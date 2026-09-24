// Test Suite: API Keys Data Access Layer
// Tests for lib/dal/api-keys.ts

import { describe, test, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  generateApiKey,
  listApiKeys,
  revokeApiKey,
  validateApiKey,
  updateKeyLastUsed,
  setKeyExpiration,
  ApiKey,
} from '@/lib/dal/api-keys';
import { db } from '@/db';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/security/audit-logger';
import bcrypt from 'bcryptjs';

// Explicit factory — see profiles.test.ts for why a bare vi.mock('@/db')
// triggers db/index.ts's real lazy-connecting getter.
vi.mock('@/db', () => ({
  db: {
    query: { apiKeys: { findMany: vi.fn(), findFirst: vi.fn() } },
    insert: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/security/audit-logger');
vi.mock('bcryptjs');

// lib/dal/api-keys.ts's requireAuth() calls supabase.auth.getUser(), not
// getSession() — mocking getSession() (as the original Jest file did) leaves
// every "authenticated" test actually hitting the Unauthorized path.
function mockAuthedUser(userId: string | null) {
  (createClient as unknown as Mock).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
  });
}

describe('API Keys DAL - generateApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should generate API key successfully', async () => {
    // Arrange
    mockAuthedUser('user-123');

    // Mock: User has 2 active keys (under limit of 5)
    (db.query.apiKeys.findMany as Mock) = vi.fn().mockResolvedValue([
      { id: 'key-1', isRevoked: false },
      { id: 'key-2', isRevoked: false }
    ]);

    const mockHash = '$2b$10$mockhashedkey';
    (bcrypt.hash as Mock) = vi.fn().mockResolvedValue(mockHash);

    const mockCreatedKey: ApiKey = {
      id: 'key-new',
      userId: 'user-123',
      keyPrefix: 'nutri_live_abcd1234',
      keyHash: mockHash,
      name: 'Production API',
      rateLimit: 500,
      lastUsedAt: null,
      expiresAt: null,
      isRevoked: false,
      createdAt: new Date()
    };

    (db.insert as Mock) = vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([mockCreatedKey])
      }))
    }));
    (logAudit as Mock).mockResolvedValue(undefined);

    // Act
    const result = await generateApiKey('user-123', 'Production API');

    // Assert
    expect(result.keyRecord).toEqual(mockCreatedKey);
    expect(result.key).toMatch(/^nutri_live_[a-zA-Z0-9_-]{32}$/);
    expect(logAudit).toHaveBeenCalledWith({
      userId: 'user-123',
      action: 'CREATE',
      resourceType: 'api_key',
      resourceId: 'key-new',
      metadata: expect.objectContaining({
        keyPrefix: expect.stringContaining('nutri_live_'),
        name: 'Production API',
        rateLimit: 500
      })
    });
  });

  test('should throw error if limit exceeded (5 keys max)', async () => {
    // Arrange
    mockAuthedUser('user-123');

    // Mock: User has 5 active keys (at limit)
    (db.query.apiKeys.findMany as Mock) = vi.fn().mockResolvedValue([
      { id: 'key-1', isRevoked: false },
      { id: 'key-2', isRevoked: false },
      { id: 'key-3', isRevoked: false },
      { id: 'key-4', isRevoked: false },
      { id: 'key-5', isRevoked: false }
    ]);

    // Act & Assert
    await expect(generateApiKey('user-123', 'Test Key')).rejects.toThrow(
      'API key limit exceeded: Maximum 5 active keys per user'
    );
  });

  test('should throw error if unauthorized', async () => {
    // Arrange
    mockAuthedUser('user-123');

    // Act & Assert
    await expect(generateApiKey('user-456', 'Test Key')).rejects.toThrow(
      'Unauthorized: Cannot generate API key for another user'
    );
  });

  test('should throw error if not authenticated', async () => {
    // Arrange
    mockAuthedUser(null);

    // Act & Assert
    await expect(generateApiKey('user-123', 'Test Key')).rejects.toThrow(
      'Unauthorized: User must be authenticated'
    );
  });

  test('should allow revoked keys to not count toward limit', async () => {
    // Arrange
    mockAuthedUser('user-123');

    // Mock: User has 4 active keys + 3 revoked (only active count)
    (db.query.apiKeys.findMany as Mock) = vi.fn().mockResolvedValue([
      { id: 'key-1', isRevoked: false },
      { id: 'key-2', isRevoked: false },
      { id: 'key-3', isRevoked: false },
      { id: 'key-4', isRevoked: false }
      // Revoked keys filtered by query
    ]);

    (bcrypt.hash as Mock) = vi.fn().mockResolvedValue('$2b$10$hash');
    (db.insert as Mock) = vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{
          id: 'key-new',
          userId: 'user-123',
          keyPrefix: 'nutri_live_test1234',
          keyHash: '$2b$10$hash',
          name: 'Test',
          rateLimit: 500,
          lastUsedAt: null,
          expiresAt: null,
          isRevoked: false,
          createdAt: new Date()
        }])
      }))
    }));
    (logAudit as Mock).mockResolvedValue(undefined);

    // Act
    const result = await generateApiKey('user-123', 'Test');

    // Assert: Should succeed (4 active < 5 limit)
    expect(result.keyRecord).toBeDefined();
  });

  // Regression: base64url's alphabet includes '_', so the random suffix
  // frequently contains one (~39% of real keys, by the birthday bound over
  // 32 characters). extractKeyPrefix() used to split the whole key on '_'
  // and require exactly 3 parts, which broke on any such key — an
  // intermittent "Invalid API key format" on key generation that had
  // nothing to do with test mocking (it used real, unmocked crypto).
  // Node's builtin crypto module can't be spied on under ESM (its exports
  // are non-configurable), so this proves the fix statistically instead:
  // with the old bug, each generation independently had a ~39% failure
  // chance, so all 50 succeeding is a ~4e-11 coincidence if the bug were
  // still present.
  test('should not fail across many real key generations (underscore-in-suffix regression)', async () => {
    mockAuthedUser('user-123');
    (db.query.apiKeys.findMany as Mock) = vi.fn().mockResolvedValue([]);
    (bcrypt.hash as Mock) = vi.fn().mockResolvedValue('$2b$10$hash');
    (db.insert as Mock) = vi.fn(() => ({
      values: vi.fn((row: any) => ({
        returning: vi.fn().mockResolvedValue([row])
      }))
    }));
    (logAudit as Mock).mockResolvedValue(undefined);

    for (let i = 0; i < 50; i++) {
      const result = await generateApiKey('user-123', `Key ${i}`);
      expect(result.key.startsWith('nutri_live_')).toBe(true);
      expect(result.keyRecord.keyPrefix.startsWith('nutri_live_')).toBe(true);
    }
  });
});

describe('API Keys DAL - listApiKeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should list all API keys for user', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const mockKeys: ApiKey[] = [
      {
        id: 'key-1',
        userId: 'user-123',
        keyPrefix: 'nutri_live_abcd1234',
        keyHash: '$2b$10$hash1',
        name: 'Production API',
        rateLimit: 500,
        lastUsedAt: new Date(),
        expiresAt: null,
        isRevoked: false,
        createdAt: new Date()
      },
      {
        id: 'key-2',
        userId: 'user-123',
        keyPrefix: 'nutri_live_efgh5678',
        keyHash: '$2b$10$hash2',
        name: 'Development API',
        rateLimit: 500,
        lastUsedAt: null,
        expiresAt: null,
        isRevoked: true,
        createdAt: new Date()
      }
    ];

    (db.query.apiKeys.findMany as Mock) = vi.fn().mockResolvedValue(mockKeys);
    (logAudit as Mock).mockResolvedValue(undefined);

    // Act
    const result = await listApiKeys('user-123');

    // Assert
    expect(result).toEqual(mockKeys);
    expect(result.length).toBe(2);
    expect(logAudit).toHaveBeenCalledWith({
      userId: 'user-123',
      action: 'READ',
      resourceType: 'api_key',
      metadata: { count: 2 }
    });
  });

  test('should throw error if unauthorized', async () => {
    // Arrange
    mockAuthedUser('user-123');

    // Act & Assert
    await expect(listApiKeys('user-456')).rejects.toThrow(
      'Unauthorized: Cannot list another user\'s API keys'
    );
  });
});

describe('API Keys DAL - revokeApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should revoke API key successfully', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const mockKey: ApiKey = {
      id: 'key-1',
      userId: 'user-123',
      keyPrefix: 'nutri_live_abcd1234',
      keyHash: '$2b$10$hash',
      name: 'Production API',
      rateLimit: 500,
      lastUsedAt: null,
      expiresAt: null,
      isRevoked: false,
      createdAt: new Date()
    };

    (db.query.apiKeys.findFirst as Mock) = vi.fn().mockResolvedValue(mockKey);
    (db.update as Mock) = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined)
      }))
    }));
    (logAudit as Mock).mockResolvedValue(undefined);

    // Act
    await revokeApiKey('user-123', 'key-1');

    // Assert
    expect(db.update).toHaveBeenCalled();
    expect(logAudit).toHaveBeenCalledWith({
      userId: 'user-123',
      action: 'DELETE',
      resourceType: 'api_key',
      resourceId: 'key-1',
      metadata: {
        keyPrefix: 'nutri_live_abcd1234',
        name: 'Production API',
        operation: 'revoke'
      }
    });
  });

  test('should throw error if key not found', async () => {
    // Arrange
    mockAuthedUser('user-123');

    (db.query.apiKeys.findFirst as Mock) = vi.fn().mockResolvedValue(null);

    // Act & Assert
    await expect(revokeApiKey('user-123', 'key-nonexistent')).rejects.toThrow(
      'API key not found or does not belong to user'
    );
  });

  test('should throw error if unauthorized', async () => {
    // Arrange
    mockAuthedUser('user-123');

    // Act & Assert
    await expect(revokeApiKey('user-456', 'key-1')).rejects.toThrow(
      'Unauthorized: Cannot revoke another user\'s API key'
    );
  });
});

describe('API Keys DAL - validateApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should validate correct API key', async () => {
    // Arrange
    const mockKey: ApiKey = {
      id: 'key-1',
      userId: 'user-123',
      keyPrefix: 'nutri_live_abcd1234',
      keyHash: '$2b$10$hash',
      name: 'Production API',
      rateLimit: 500,
      lastUsedAt: null,
      expiresAt: null,
      isRevoked: false,
      createdAt: new Date()
    };

    (db.query.apiKeys.findMany as Mock) = vi.fn().mockResolvedValue([mockKey]);
    (bcrypt.compare as Mock) = vi.fn().mockResolvedValue(true);

    // Act
    const result = await validateApiKey('nutri_live_abcd1234', 'nutri_live_abcd1234567890123456789012');

    // Assert
    expect(result).toEqual(mockKey);
  });

  test('should return null for wrong key hash', async () => {
    // Arrange
    const mockKey: ApiKey = {
      id: 'key-1',
      userId: 'user-123',
      keyPrefix: 'nutri_live_abcd1234',
      keyHash: '$2b$10$hash',
      name: 'Production API',
      rateLimit: 500,
      lastUsedAt: null,
      expiresAt: null,
      isRevoked: false,
      createdAt: new Date()
    };

    (db.query.apiKeys.findMany as Mock) = vi.fn().mockResolvedValue([mockKey]);
    (bcrypt.compare as Mock) = vi.fn().mockResolvedValue(false);

    // Act
    const result = await validateApiKey('nutri_live_abcd1234', 'wrong-key');

    // Assert
    expect(result).toBeNull();
  });

  test('should return null for revoked key', async () => {
    // Arrange: findMany filters by isRevoked = false
    (db.query.apiKeys.findMany as Mock) = vi.fn().mockResolvedValue([]);

    // Act
    const result = await validateApiKey('nutri_live_abcd1234', 'any-key');

    // Assert
    expect(result).toBeNull();
  });

  test('should return null for expired key', async () => {
    // Arrange
    const expiredKey: ApiKey = {
      id: 'key-1',
      userId: 'user-123',
      keyPrefix: 'nutri_live_abcd1234',
      keyHash: '$2b$10$hash',
      name: 'Expired API',
      rateLimit: 500,
      lastUsedAt: null,
      expiresAt: new Date('2025-01-01'), // Expired
      isRevoked: false,
      createdAt: new Date()
    };

    (db.query.apiKeys.findMany as Mock) = vi.fn().mockResolvedValue([expiredKey]);
    (bcrypt.compare as Mock) = vi.fn().mockResolvedValue(true);

    // Act
    const result = await validateApiKey('nutri_live_abcd1234', 'nutri_live_abcd1234567890123456789012');

    // Assert
    expect(result).toBeNull();
  });

  test('should return null for non-existent prefix', async () => {
    // Arrange
    (db.query.apiKeys.findMany as Mock) = vi.fn().mockResolvedValue([]);

    // Act
    const result = await validateApiKey('nutri_live_nonexist', 'any-key');

    // Assert
    expect(result).toBeNull();
  });
});

describe('API Keys DAL - updateKeyLastUsed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should update last_used_at timestamp', async () => {
    // Arrange
    (db.update as Mock) = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined)
      }))
    }));

    // Act
    await updateKeyLastUsed('key-123');

    // Assert
    expect(db.update).toHaveBeenCalled();
  });
});

describe('API Keys DAL - setKeyExpiration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should set expiration date for API key', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const mockKey: ApiKey = {
      id: 'key-1',
      userId: 'user-123',
      keyPrefix: 'nutri_live_abcd1234',
      keyHash: '$2b$10$hash',
      name: 'Production API',
      rateLimit: 500,
      lastUsedAt: null,
      expiresAt: null,
      isRevoked: false,
      createdAt: new Date()
    };

    (db.query.apiKeys.findFirst as Mock) = vi.fn().mockResolvedValue(mockKey);
    (db.update as Mock) = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined)
      }))
    }));
    (logAudit as Mock).mockResolvedValue(undefined);

    const expirationDate = new Date('2025-12-31');

    // Act
    await setKeyExpiration('user-123', 'key-1', expirationDate);

    // Assert
    expect(db.update).toHaveBeenCalled();
    expect(logAudit).toHaveBeenCalledWith({
      userId: 'user-123',
      action: 'UPDATE',
      resourceType: 'api_key',
      resourceId: 'key-1',
      metadata: {
        keyPrefix: 'nutri_live_abcd1234',
        operation: 'set_expiration',
        expiresAt: expirationDate.toISOString()
      }
    });
  });

  test('should remove expiration by setting null', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const mockKey: ApiKey = {
      id: 'key-1',
      userId: 'user-123',
      keyPrefix: 'nutri_live_abcd1234',
      keyHash: '$2b$10$hash',
      name: 'Production API',
      rateLimit: 500,
      lastUsedAt: null,
      expiresAt: new Date('2025-12-31'),
      isRevoked: false,
      createdAt: new Date()
    };

    (db.query.apiKeys.findFirst as Mock) = vi.fn().mockResolvedValue(mockKey);
    (db.update as Mock) = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined)
      }))
    }));
    (logAudit as Mock).mockResolvedValue(undefined);

    // Act
    await setKeyExpiration('user-123', 'key-1', null);

    // Assert
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          expiresAt: null
        })
      })
    );
  });

  test('should throw error if unauthorized', async () => {
    // Arrange
    mockAuthedUser('user-123');

    // Act & Assert
    await expect(setKeyExpiration('user-456', 'key-1', new Date())).rejects.toThrow(
      'Unauthorized: Cannot modify another user\'s API key'
    );
  });
});
