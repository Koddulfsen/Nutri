// Test Suite: Audit Logging Infrastructure
// Tests for lib/security/audit-logger.ts
// Generated: 2025-11-10

import { logAudit, logAuditBatch, getRequestMetadata, AuditLogOptions, AuditAction } from '@/lib/security/audit-logger';
import { db } from '@/db';
import { auditLog } from '@/db/schema';

// Mock dependencies
jest.mock('@/db');

describe('Audit Logger - logAudit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should log audit entry successfully', async () => {
    // Arrange: Mock successful insert
    const mockInsert = jest.fn().mockResolvedValue(undefined);
    (db.insert as jest.Mock) = jest.fn(() => ({
      values: mockInsert
    }));

    const options: AuditLogOptions = {
      userId: 'user-123',
      action: 'LOGIN',
      resourceType: 'user_session',
      resourceId: 'session-456',
      metadata: { ip: '192.168.1.1' },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    };

    // Act
    await logAudit(options);

    // Assert
    expect(db.insert).toHaveBeenCalledWith(auditLog);
    expect(mockInsert).toHaveBeenCalledWith({
      userId: 'user-123',
      action: 'LOGIN',
      resourceType: 'user_session',
      resourceId: 'session-456',
      metadata: { ip: '192.168.1.1' },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      createdAt: expect.any(Date)
    });
  });

  test('should handle null userId for anonymous events', async () => {
    // Arrange
    const mockInsert = jest.fn().mockResolvedValue(undefined);
    (db.insert as jest.Mock) = jest.fn(() => ({
      values: mockInsert
    }));

    const options: AuditLogOptions = {
      userId: null,
      action: 'READ',
      resourceType: 'public_data',
      metadata: {},
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    };

    // Act
    await logAudit(options);

    // Assert
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      userId: null
    }));
  });

  test('should throw error on audit log failure (fail-closed)', async () => {
    // Arrange: Mock database error
    const mockInsert = jest.fn().mockRejectedValue(new Error('Database connection failed'));
    (db.insert as jest.Mock) = jest.fn(() => ({
      values: mockInsert
    }));

    const options: AuditLogOptions = {
      userId: 'user-123',
      action: 'UPDATE',
      resourceType: 'user_profile'
    };

    // Act & Assert
    await expect(logAudit(options)).rejects.toThrow('Audit logging failed - operation blocked for compliance');
  });

  test('should handle optional fields gracefully', async () => {
    // Arrange
    const mockInsert = jest.fn().mockResolvedValue(undefined);
    (db.insert as jest.Mock) = jest.fn(() => ({
      values: mockInsert
    }));

    const options: AuditLogOptions = {
      userId: 'user-123',
      action: 'DELETE',
      resourceType: 'meal_log'
      // No resourceId, metadata, ipAddress, userAgent
    };

    // Act
    await logAudit(options);

    // Assert
    expect(mockInsert).toHaveBeenCalledWith({
      userId: 'user-123',
      action: 'DELETE',
      resourceType: 'meal_log',
      resourceId: null,
      metadata: {},
      ipAddress: null,
      userAgent: null,
      createdAt: expect.any(Date)
    });
  });

  test('should log all audit action types', async () => {
    // Arrange
    const mockInsert = jest.fn().mockResolvedValue(undefined);
    (db.insert as jest.Mock) = jest.fn(() => ({
      values: mockInsert
    }));

    const actions: AuditAction[] = [
      'LOGIN',
      'LOGOUT',
      'CREATE',
      'READ',
      'UPDATE',
      'DELETE',
      'EXPORT',
      'CONSENT_CHANGE'
    ];

    // Act
    for (const action of actions) {
      await logAudit({
        userId: 'user-123',
        action,
        resourceType: 'test_resource'
      });
    }

    // Assert
    expect(mockInsert).toHaveBeenCalledTimes(8);
  });
});

describe('Audit Logger - getRequestMetadata', () => {
  test('should extract IP from x-forwarded-for header (first IP)', () => {
    // Arrange: Mock Request with x-forwarded-for
    const mockRequest = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '192.168.1.100, 10.0.0.1, 172.16.0.1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    // Act
    const metadata = getRequestMetadata(mockRequest);

    // Assert
    expect(metadata.ipAddress).toBe('192.168.1.100');
    expect(metadata.userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
  });

  test('should fallback to x-real-ip if x-forwarded-for missing', () => {
    // Arrange
    const mockRequest = new Request('http://localhost', {
      headers: {
        'x-real-ip': '192.168.1.200',
        'user-agent': 'Mozilla/5.0'
      }
    });

    // Act
    const metadata = getRequestMetadata(mockRequest);

    // Assert
    expect(metadata.ipAddress).toBe('192.168.1.200');
  });

  test('should return null for missing headers', () => {
    // Arrange: Request with no IP or user agent headers
    const mockRequest = new Request('http://localhost');

    // Act
    const metadata = getRequestMetadata(mockRequest);

    // Assert
    expect(metadata.ipAddress).toBeNull();
    expect(metadata.userAgent).toBeNull();
  });

  test('should handle x-forwarded-for with whitespace', () => {
    // Arrange
    const mockRequest = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '  192.168.1.100  , 10.0.0.1',
        'user-agent': 'Mozilla/5.0'
      }
    });

    // Act
    const metadata = getRequestMetadata(mockRequest);

    // Assert
    expect(metadata.ipAddress).toBe('192.168.1.100');
  });
});

describe('Audit Logger - logAuditBatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should log multiple audit entries in batch', async () => {
    // Arrange
    const mockInsert = jest.fn().mockResolvedValue(undefined);
    (db.insert as jest.Mock) = jest.fn(() => ({
      values: mockInsert
    }));

    const entries: AuditLogOptions[] = [
      {
        userId: 'user-123',
        action: 'DELETE',
        resourceType: 'meal_log',
        resourceId: 'meal-1'
      },
      {
        userId: 'user-123',
        action: 'DELETE',
        resourceType: 'meal_log',
        resourceId: 'meal-2'
      },
      {
        userId: 'user-123',
        action: 'DELETE',
        resourceType: 'meal_log',
        resourceId: 'meal-3'
      }
    ];

    // Act
    await logAuditBatch(entries);

    // Assert
    expect(db.insert).toHaveBeenCalledWith(auditLog);
    expect(mockInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        userId: 'user-123',
        action: 'DELETE',
        resourceType: 'meal_log',
        resourceId: 'meal-1'
      }),
      expect.objectContaining({
        userId: 'user-123',
        action: 'DELETE',
        resourceType: 'meal_log',
        resourceId: 'meal-2'
      }),
      expect.objectContaining({
        userId: 'user-123',
        action: 'DELETE',
        resourceType: 'meal_log',
        resourceId: 'meal-3'
      })
    ]);
  });

  test('should throw error on batch failure (fail-closed)', async () => {
    // Arrange
    const mockInsert = jest.fn().mockRejectedValue(new Error('Database error'));
    (db.insert as jest.Mock) = jest.fn(() => ({
      values: mockInsert
    }));

    const entries: AuditLogOptions[] = [
      {
        userId: 'user-123',
        action: 'DELETE',
        resourceType: 'meal_log',
        resourceId: 'meal-1'
      }
    ];

    // Act & Assert
    await expect(logAuditBatch(entries)).rejects.toThrow('Batch audit logging failed - operation blocked for compliance');
  });

  test('should handle empty batch gracefully', async () => {
    // Arrange
    const mockInsert = jest.fn().mockResolvedValue(undefined);
    (db.insert as jest.Mock) = jest.fn(() => ({
      values: mockInsert
    }));

    // Act
    await logAuditBatch([]);

    // Assert
    expect(mockInsert).toHaveBeenCalledWith([]);
  });

  test('should handle batch with mixed metadata', async () => {
    // Arrange
    const mockInsert = jest.fn().mockResolvedValue(undefined);
    (db.insert as jest.Mock) = jest.fn(() => ({
      values: mockInsert
    }));

    const entries: AuditLogOptions[] = [
      {
        userId: 'user-123',
        action: 'CREATE',
        resourceType: 'meal_log',
        metadata: { calories: 500 },
        ipAddress: '192.168.1.1'
      },
      {
        userId: null,
        action: 'READ',
        resourceType: 'public_data'
        // No metadata or ipAddress
      }
    ];

    // Act
    await logAuditBatch(entries);

    // Assert
    expect(mockInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        metadata: { calories: 500 },
        ipAddress: '192.168.1.1'
      }),
      expect.objectContaining({
        metadata: {},
        ipAddress: null
      })
    ]);
  });
});
