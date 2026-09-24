// Test Suite: Consent Management Data Access Layer
// Tests for lib/dal/consent.ts

import { describe, test, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  getUserConsent,
  updateUserConsent,
  checkConsent,
  grantAllConsents,
  revokeAllConsents,
  createInitialConsent,
  ConsentRecord
} from '@/lib/dal/consent';
import { db } from '@/db';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/security/audit-logger';

// Explicit factory — see profiles.test.ts for why a bare vi.mock('@/db')
// triggers db/index.ts's real lazy-connecting getter.
vi.mock('@/db', () => ({
  db: {
    query: { userConsent: { findFirst: vi.fn() } },
    update: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/security/audit-logger');

// lib/dal/consent.ts's requireAuth() calls supabase.auth.getUser(), not
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

describe('Consent DAL - getUserConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should retrieve user consent successfully', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const mockConsent: ConsentRecord = {
      id: 'consent-456',
      userId: 'user-123',
      newsletter: true,
      pushNotifications: false,
      research: true,
      analytics: false,
      thirdParty: false,
      sensitiveHealthData: false,
      aiProcessing: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    (db.query.userConsent.findFirst as Mock) = vi.fn().mockResolvedValue(mockConsent);
    (logAudit as Mock).mockResolvedValue(undefined);

    // Act
    const result = await getUserConsent('user-123');

    // Assert
    expect(result).toEqual(mockConsent);
    expect(logAudit).toHaveBeenCalledWith({
      userId: 'user-123',
      action: 'READ',
      resourceType: 'user_consent',
      resourceId: 'consent-456'
    });
  });

  test('should throw error if user not authenticated', async () => {
    // Arrange
    mockAuthedUser(null);

    // Act & Assert
    await expect(getUserConsent('user-123')).rejects.toThrow('Unauthorized: User must be authenticated');
  });

  test('should throw error if userId mismatch', async () => {
    // Arrange
    mockAuthedUser('user-123');

    // Act & Assert
    await expect(getUserConsent('user-456')).rejects.toThrow('Unauthorized: Cannot access another user\'s consent');
  });

  test('should throw error if consent record not found', async () => {
    // Arrange
    mockAuthedUser('user-123');

    (db.query.userConsent.findFirst as Mock) = vi.fn().mockResolvedValue(null);

    // Act & Assert
    await expect(getUserConsent('user-123')).rejects.toThrow('User consent record not found');
  });
});

describe('Consent DAL - updateUserConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should update user consent with GDPR audit trail', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const oldConsent: ConsentRecord = {
      id: 'consent-456',
      userId: 'user-123',
      newsletter: true,
      pushNotifications: false,
      research: true,
      analytics: true,
      thirdParty: false,
      sensitiveHealthData: false,
      aiProcessing: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedConsent: ConsentRecord = {
      ...oldConsent,
      analytics: false, // Withdrawn
      newsletter: true,
      updatedAt: new Date()
    };

    (db.query.userConsent.findFirst as Mock) = vi.fn().mockResolvedValue(oldConsent);
    (db.update as Mock) = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([updatedConsent])
        }))
      }))
    }));
    (logAudit as Mock).mockResolvedValue(undefined);

    // Act
    const result = await updateUserConsent('user-123', { analytics: false });

    // Assert
    expect(result).toEqual(updatedConsent);
    expect(logAudit).toHaveBeenCalledWith({
      userId: 'user-123',
      action: 'CONSENT_CHANGE',
      resourceType: 'user_consent',
      resourceId: 'consent-456',
      metadata: {
        changes: {
          before: oldConsent,
          after: updatedConsent
        }
      }
    });
  });

  test('should throw error if unauthorized', async () => {
    // Arrange
    mockAuthedUser('user-123');

    // Act & Assert
    await expect(updateUserConsent('user-456', { newsletter: false })).rejects.toThrow(
      'Unauthorized: Cannot update another user\'s consent'
    );
  });

  test('should throw error if consent record not found', async () => {
    // Arrange
    mockAuthedUser('user-123');

    (db.query.userConsent.findFirst as Mock) = vi.fn().mockResolvedValue(null);

    // Act & Assert
    await expect(updateUserConsent('user-123', { newsletter: false })).rejects.toThrow(
      'User consent record not found'
    );
  });

  test('should handle multiple consent updates', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const oldConsent: ConsentRecord = {
      id: 'consent-456',
      userId: 'user-123',
      newsletter: false,
      pushNotifications: false,
      research: false,
      analytics: false,
      thirdParty: false,
      sensitiveHealthData: false,
      aiProcessing: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedConsent: ConsentRecord = {
      ...oldConsent,
      newsletter: true,
      analytics: true,
      research: true,
      updatedAt: new Date()
    };

    (db.query.userConsent.findFirst as Mock) = vi.fn().mockResolvedValue(oldConsent);
    (db.update as Mock) = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([updatedConsent])
        }))
      }))
    }));
    (logAudit as Mock).mockResolvedValue(undefined);

    // Act
    const result = await updateUserConsent('user-123', {
      newsletter: true,
      analytics: true,
      research: true
    });

    // Assert
    expect(result.newsletter).toBe(true);
    expect(result.analytics).toBe(true);
    expect(result.research).toBe(true);
  });
});

describe('Consent DAL - checkConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should return true if consent granted', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const mockConsent: ConsentRecord = {
      id: 'consent-456',
      userId: 'user-123',
      newsletter: true,
      pushNotifications: false,
      research: true,
      analytics: true,
      thirdParty: false,
      sensitiveHealthData: false,
      aiProcessing: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    (db.query.userConsent.findFirst as Mock) = vi.fn().mockResolvedValue(mockConsent);
    (logAudit as Mock).mockResolvedValue(undefined);

    // Act
    const hasAnalytics = await checkConsent('user-123', 'analytics');

    // Assert
    expect(hasAnalytics).toBe(true);
  });

  test('should return false if consent not granted', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const mockConsent: ConsentRecord = {
      id: 'consent-456',
      userId: 'user-123',
      newsletter: true,
      pushNotifications: false,
      research: false,
      analytics: false,
      thirdParty: false,
      sensitiveHealthData: false,
      aiProcessing: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    (db.query.userConsent.findFirst as Mock) = vi.fn().mockResolvedValue(mockConsent);
    (logAudit as Mock).mockResolvedValue(undefined);

    // Act
    const hasThirdParty = await checkConsent('user-123', 'thirdParty');

    // Assert
    expect(hasThirdParty).toBe(false);
  });
});

describe('Consent DAL - grantAllConsents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should grant all consent types', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const oldConsent: ConsentRecord = {
      id: 'consent-456',
      userId: 'user-123',
      newsletter: false,
      pushNotifications: false,
      research: false,
      analytics: false,
      thirdParty: false,
      sensitiveHealthData: false,
      aiProcessing: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const allGranted: ConsentRecord = {
      ...oldConsent,
      newsletter: true,
      pushNotifications: true,
      research: true,
      analytics: true,
      thirdParty: true,
      sensitiveHealthData: false,
      aiProcessing: false,
      updatedAt: new Date()
    };

    (db.query.userConsent.findFirst as Mock) = vi.fn().mockResolvedValue(oldConsent);
    (db.update as Mock) = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([allGranted])
        }))
      }))
    }));
    (logAudit as Mock).mockResolvedValue(undefined);

    // Act
    const result = await grantAllConsents('user-123');

    // Assert
    expect(result.newsletter).toBe(true);
    expect(result.pushNotifications).toBe(true);
    expect(result.research).toBe(true);
    expect(result.analytics).toBe(true);
    expect(result.thirdParty).toBe(true);
  });
});

describe('Consent DAL - revokeAllConsents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should revoke all consent types', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const oldConsent: ConsentRecord = {
      id: 'consent-456',
      userId: 'user-123',
      newsletter: true,
      pushNotifications: true,
      research: true,
      analytics: true,
      thirdParty: true,
      sensitiveHealthData: false,
      aiProcessing: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const allRevoked: ConsentRecord = {
      ...oldConsent,
      newsletter: false,
      pushNotifications: false,
      research: false,
      analytics: false,
      thirdParty: false,
      sensitiveHealthData: false,
      aiProcessing: false,
      updatedAt: new Date()
    };

    (db.query.userConsent.findFirst as Mock) = vi.fn().mockResolvedValue(oldConsent);
    (db.update as Mock) = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([allRevoked])
        }))
      }))
    }));
    (logAudit as Mock).mockResolvedValue(undefined);

    // Act
    const result = await revokeAllConsents('user-123');

    // Assert
    expect(result.newsletter).toBe(false);
    expect(result.pushNotifications).toBe(false);
    expect(result.research).toBe(false);
    expect(result.analytics).toBe(false);
    expect(result.thirdParty).toBe(false);
  });
});

describe('Consent DAL - createInitialConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should create initial consent record with all false', async () => {
    // Arrange
    const newConsent: ConsentRecord = {
      id: 'consent-789',
      userId: 'user-new',
      newsletter: false,
      pushNotifications: false,
      research: false,
      analytics: false,
      thirdParty: false,
      sensitiveHealthData: false,
      aiProcessing: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    (db.query.userConsent.findFirst as Mock) = vi.fn().mockResolvedValue(null);
    (db.insert as Mock) = vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([newConsent])
      }))
    }));
    (logAudit as Mock).mockResolvedValue(undefined);

    // Act
    const result = await createInitialConsent('user-new');

    // Assert
    expect(result).toEqual(newConsent);
    expect(result.newsletter).toBe(false);
    expect(result.pushNotifications).toBe(false);
    expect(result.research).toBe(false);
    expect(result.analytics).toBe(false);
    expect(result.thirdParty).toBe(false);
    expect(logAudit).toHaveBeenCalledWith({
      userId: 'user-new',
      action: 'CREATE',
      resourceType: 'user_consent',
      resourceId: 'consent-789',
      metadata: {
        operation: 'initial_consent_creation',
        allConsentsFalse: true
      }
    });
  });

  test('should throw error if consent record already exists', async () => {
    // Arrange
    const existingConsent: ConsentRecord = {
      id: 'consent-456',
      userId: 'user-123',
      newsletter: false,
      pushNotifications: false,
      research: false,
      analytics: false,
      thirdParty: false,
      sensitiveHealthData: false,
      aiProcessing: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    (db.query.userConsent.findFirst as Mock) = vi.fn().mockResolvedValue(existingConsent);

    // Act & Assert
    await expect(createInitialConsent('user-123')).rejects.toThrow(
      'Consent record already exists for this user'
    );
  });

  test('should throw error if insert fails', async () => {
    // Arrange
    (db.query.userConsent.findFirst as Mock) = vi.fn().mockResolvedValue(null);
    (db.insert as Mock) = vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([])
      }))
    }));

    // Act & Assert
    await expect(createInitialConsent('user-new')).rejects.toThrow(
      'Failed to create initial consent record'
    );
  });
});
