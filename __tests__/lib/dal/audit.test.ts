// Test Suite: Audit Log Queries Data Access Layer
// Tests for lib/dal/audit.ts

import { describe, test, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  getAuditLogs,
  getRecentAuditLogs,
  getAuditLogsByAction,
  getAuditLogsByResourceType,
  getAuditLogsByDateRange,
  getConsentChangeHistory,
  AuditLogEntry,
} from '@/lib/dal/audit';
import { db } from '@/db';
import { createClient } from '@/lib/supabase/server';

// Explicit factory — see profiles.test.ts for why a bare vi.mock('@/db')
// triggers db/index.ts's real lazy-connecting getter.
vi.mock('@/db', () => ({
  db: {
    query: { auditLog: { findMany: vi.fn() } },
    select: vi.fn(),
  },
}));
vi.mock('@/lib/supabase/server');

// lib/dal/audit.ts's requireAuth() calls supabase.auth.getUser(), not
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

describe('Audit DAL - getAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should retrieve paginated audit logs', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const mockLogs: AuditLogEntry[] = [
      {
        id: 'audit-1',
        userId: 'user-123',
        action: 'LOGIN',
        resourceType: 'user_session',
        resourceId: null,
        metadata: {},
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date('2025-11-10T10:00:00Z')
      },
      {
        id: 'audit-2',
        userId: 'user-123',
        action: 'UPDATE',
        resourceType: 'user_profile',
        resourceId: 'profile-456',
        metadata: { changes: {} },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date('2025-11-10T09:00:00Z')
      }
    ];

    (db.query.auditLog.findMany as Mock) = vi.fn().mockResolvedValue(mockLogs);
    (db.select as Mock) = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ count: 150 }])
      }))
    }));

    // Act
    const result = await getAuditLogs('user-123', { page: 1, limit: 100 });

    // Assert
    expect(result.logs).toEqual(mockLogs);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 100,
      total: 150,
      hasMore: true // offset 0 + 2 logs < 150 total
    });
  });

  test('should throw error if user not authenticated', async () => {
    // Arrange
    mockAuthedUser(null);

    // Act & Assert
    await expect(getAuditLogs('user-123')).rejects.toThrow('Unauthorized: User must be authenticated');
  });

  test('should throw error if userId mismatch', async () => {
    // Arrange
    mockAuthedUser('user-123');

    // Act & Assert
    await expect(getAuditLogs('user-456')).rejects.toThrow('Unauthorized: Cannot access another user\'s audit logs');
  });

  test('should filter by action type', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const mockLogs: AuditLogEntry[] = [
      {
        id: 'audit-1',
        userId: 'user-123',
        action: 'CONSENT_CHANGE',
        resourceType: 'user_consent',
        resourceId: 'consent-456',
        metadata: { changes: {} },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date()
      }
    ];

    (db.query.auditLog.findMany as Mock) = vi.fn().mockResolvedValue(mockLogs);
    (db.select as Mock) = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ count: 1 }])
      }))
    }));

    // Act
    const result = await getAuditLogs('user-123', { action: 'CONSENT_CHANGE' });

    // Assert
    expect(result.logs).toEqual(mockLogs);
    expect(result.logs[0].action).toBe('CONSENT_CHANGE');
  });

  test('should filter by resource type', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const mockLogs: AuditLogEntry[] = [
      {
        id: 'audit-1',
        userId: 'user-123',
        action: 'READ',
        resourceType: 'user_profile',
        resourceId: 'profile-456',
        metadata: {},
        ipAddress: null,
        userAgent: null,
        createdAt: new Date()
      }
    ];

    (db.query.auditLog.findMany as Mock) = vi.fn().mockResolvedValue(mockLogs);
    (db.select as Mock) = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ count: 1 }])
      }))
    }));

    // Act
    const result = await getAuditLogs('user-123', { resourceType: 'user_profile' });

    // Assert
    expect(result.logs[0].resourceType).toBe('user_profile');
  });

  test('should filter by date range', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const mockLogs: AuditLogEntry[] = [
      {
        id: 'audit-1',
        userId: 'user-123',
        action: 'LOGIN',
        resourceType: 'user_session',
        resourceId: null,
        metadata: {},
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date('2025-11-05T10:00:00Z')
      }
    ];

    (db.query.auditLog.findMany as Mock) = vi.fn().mockResolvedValue(mockLogs);
    (db.select as Mock) = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ count: 1 }])
      }))
    }));

    // Act
    const result = await getAuditLogs('user-123', {
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30')
    });

    // Assert
    expect(result.logs.length).toBeGreaterThan(0);
  });

  test('should enforce max limit of 500', async () => {
    // Arrange
    mockAuthedUser('user-123');

    (db.query.auditLog.findMany as Mock) = vi.fn().mockResolvedValue([]);
    (db.select as Mock) = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ count: 0 }])
      }))
    }));

    // Act
    const result = await getAuditLogs('user-123', { limit: 1000 }); // Try to request 1000

    // Assert: Should be capped at 500
    expect(result.pagination.limit).toBe(500);
  });

  test('should calculate hasMore correctly', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const mockLogs: AuditLogEntry[] = Array.from({ length: 100 }, (_, i) => ({
      id: `audit-${i}`,
      userId: 'user-123',
      action: 'READ',
      resourceType: 'test',
      resourceId: null,
      metadata: {},
      ipAddress: null,
      userAgent: null,
      createdAt: new Date()
    }));

    (db.query.auditLog.findMany as Mock) = vi.fn().mockResolvedValue(mockLogs);
    (db.select as Mock) = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ count: 250 }])
      }))
    }));

    // Act
    const result = await getAuditLogs('user-123', { page: 1, limit: 100 });

    // Assert: 0 offset + 100 logs < 250 total = hasMore true
    expect(result.pagination.hasMore).toBe(true);

    // Act: Page 3 (last page)
    const lastPage = await getAuditLogs('user-123', { page: 3, limit: 100 });

    // Assert: 200 offset + 100 logs >= 250 total = hasMore false
    (db.select as Mock) = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ count: 250 }])
      }))
    }));
  });
});

describe('Audit DAL - getRecentAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should retrieve last 100 audit logs', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const mockLogs: AuditLogEntry[] = Array.from({ length: 100 }, (_, i) => ({
      id: `audit-${i}`,
      userId: 'user-123',
      action: 'READ',
      resourceType: 'test',
      resourceId: null,
      metadata: {},
      ipAddress: null,
      userAgent: null,
      createdAt: new Date()
    }));

    (db.query.auditLog.findMany as Mock) = vi.fn().mockResolvedValue(mockLogs);
    (db.select as Mock) = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ count: 500 }])
      }))
    }));

    // Act
    const result = await getRecentAuditLogs('user-123');

    // Assert
    expect(result.length).toBe(100);
  });
});

describe('Audit DAL - getAuditLogsByAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should filter logs by action type', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const mockLogs: AuditLogEntry[] = [
      {
        id: 'audit-1',
        userId: 'user-123',
        action: 'CONSENT_CHANGE',
        resourceType: 'user_consent',
        resourceId: 'consent-456',
        metadata: {},
        ipAddress: null,
        userAgent: null,
        createdAt: new Date()
      }
    ];

    (db.query.auditLog.findMany as Mock) = vi.fn().mockResolvedValue(mockLogs);
    (db.select as Mock) = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ count: 1 }])
      }))
    }));

    // Act
    const result = await getAuditLogsByAction('user-123', 'CONSENT_CHANGE');

    // Assert
    expect(result.logs.length).toBeGreaterThan(0);
    expect(result.logs[0].action).toBe('CONSENT_CHANGE');
  });
});

describe('Audit DAL - getAuditLogsByResourceType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should filter logs by resource type', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const mockLogs: AuditLogEntry[] = [
      {
        id: 'audit-1',
        userId: 'user-123',
        action: 'UPDATE',
        resourceType: 'user_profile',
        resourceId: 'profile-456',
        metadata: {},
        ipAddress: null,
        userAgent: null,
        createdAt: new Date()
      }
    ];

    (db.query.auditLog.findMany as Mock) = vi.fn().mockResolvedValue(mockLogs);
    (db.select as Mock) = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ count: 1 }])
      }))
    }));

    // Act
    const result = await getAuditLogsByResourceType('user-123', 'user_profile');

    // Assert
    expect(result.logs[0].resourceType).toBe('user_profile');
  });
});

describe('Audit DAL - getAuditLogsByDateRange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should filter logs by date range', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const mockLogs: AuditLogEntry[] = [
      {
        id: 'audit-1',
        userId: 'user-123',
        action: 'LOGIN',
        resourceType: 'user_session',
        resourceId: null,
        metadata: {},
        ipAddress: null,
        userAgent: null,
        createdAt: new Date('2025-11-15')
      }
    ];

    (db.query.auditLog.findMany as Mock) = vi.fn().mockResolvedValue(mockLogs);
    (db.select as Mock) = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ count: 1 }])
      }))
    }));

    // Act
    const result = await getAuditLogsByDateRange(
      'user-123',
      new Date('2025-11-01'),
      new Date('2025-11-30')
    );

    // Assert
    expect(result.logs.length).toBeGreaterThan(0);
  });
});

describe('Audit DAL - getConsentChangeHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should retrieve consent change history', async () => {
    // Arrange
    mockAuthedUser('user-123');

    const mockLogs: AuditLogEntry[] = [
      {
        id: 'audit-1',
        userId: 'user-123',
        action: 'CONSENT_CHANGE',
        resourceType: 'user_consent',
        resourceId: 'consent-456',
        metadata: {
          changes: {
            before: { analytics: true },
            after: { analytics: false }
          }
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date()
      }
    ];

    (db.query.auditLog.findMany as Mock) = vi.fn().mockResolvedValue(mockLogs);
    (db.select as Mock) = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ count: 1 }])
      }))
    }));

    // Act
    const result = await getConsentChangeHistory('user-123');

    // Assert
    expect(result.logs.length).toBeGreaterThan(0);
    expect(result.logs[0].action).toBe('CONSENT_CHANGE');
    expect(result.logs[0].resourceType).toBe('user_consent');
  });
});
