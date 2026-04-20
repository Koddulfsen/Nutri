// Test Suite: User Profiles Data Access Layer
// Tests for lib/dal/profiles.ts
// Generated: 2025-11-10

import {
  getUserProfile,
  updateUserProfile,
  incrementSessionVersion,
  getDashboardWidgets,
  updateDashboardWidgets,
  UserProfile,
  UserProfileUpdate
} from '@/lib/dal/profiles';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/security/audit-logger';

// Mock dependencies
jest.mock('@/db');
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/security/audit-logger');

describe('Profiles DAL - getUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should retrieve user profile successfully', async () => {
    // Arrange: Mock authenticated session
    const mockSession = {
      user: { id: 'user-123' }
    };
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: mockSession },
          error: null
        })
      }
    });

    // Mock database query
    const mockProfile: UserProfile = {
      id: 'profile-456',
      userId: 'user-123',
      fullName: 'Jane Doe',
      avatarUrl: 'https://example.com/avatar.jpg',
      dataEncryptionKey: 'base64-dek-string',
      sessionVersion: 1,
      dashboardWidgets: {
        staple: ['rda_snapshot', 'recent_meals'],
        custom: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    (db.query.userProfiles.findFirst as jest.Mock) = jest.fn().mockResolvedValue(mockProfile);
    (logAudit as jest.Mock) = jest.fn().mockResolvedValue(undefined);

    // Act
    const result = await getUserProfile('user-123');

    // Assert
    expect(result).toEqual(mockProfile);
    expect(logAudit).toHaveBeenCalledWith({
      userId: 'user-123',
      action: 'READ',
      resourceType: 'user_profile',
      resourceId: 'profile-456'
    });
  });

  test('should throw error if user not authenticated', async () => {
    // Arrange: No session
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: null },
          error: null
        })
      }
    });

    // Act & Assert
    await expect(getUserProfile('user-123')).rejects.toThrow('Unauthorized: User must be authenticated');
  });

  test('should throw error if userId mismatch (authorization check)', async () => {
    // Arrange: Session user is 'user-123', requesting 'user-456'
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-123' } } },
          error: null
        })
      }
    });

    // Act & Assert
    await expect(getUserProfile('user-456')).rejects.toThrow('Unauthorized: Cannot access another user\'s profile');
  });

  test('should return null if profile not found', async () => {
    // Arrange
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-123' } } },
          error: null
        })
      }
    });

    (db.query.userProfiles.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);
    (logAudit as jest.Mock) = jest.fn().mockResolvedValue(undefined);

    // Act
    const result = await getUserProfile('user-123');

    // Assert
    expect(result).toBeNull();
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({
      resourceId: null
    }));
  });
});

describe('Profiles DAL - updateUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should update user profile successfully', async () => {
    // Arrange
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-123' } } },
          error: null
        })
      }
    });

    const oldProfile: UserProfile = {
      id: 'profile-456',
      userId: 'user-123',
      fullName: 'Jane Doe',
      avatarUrl: null,
      dataEncryptionKey: 'dek-string',
      sessionVersion: 1,
      dashboardWidgets: { staple: [], custom: [] },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedProfile: UserProfile = {
      ...oldProfile,
      fullName: 'Jane Smith',
      avatarUrl: 'https://example.com/new-avatar.jpg',
      updatedAt: new Date()
    };

    (db.query.userProfiles.findFirst as jest.Mock) = jest.fn().mockResolvedValue(oldProfile);
    (db.update as jest.Mock) = jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([updatedProfile])
        }))
      }))
    }));
    (logAudit as jest.Mock) = jest.fn().mockResolvedValue(undefined);

    const updates: UserProfileUpdate = {
      fullName: 'Jane Smith',
      avatarUrl: 'https://example.com/new-avatar.jpg'
    };

    // Act
    const result = await updateUserProfile('user-123', updates);

    // Assert
    expect(result).toEqual(updatedProfile);
    expect(logAudit).toHaveBeenCalledWith({
      userId: 'user-123',
      action: 'UPDATE',
      resourceType: 'user_profile',
      resourceId: 'profile-456',
      metadata: {
        changes: {
          before: oldProfile,
          after: updatedProfile
        }
      }
    });
  });

  test('should throw error if unauthorized', async () => {
    // Arrange: Session user is 'user-123', trying to update 'user-456'
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-123' } } },
          error: null
        })
      }
    });

    // Act & Assert
    await expect(updateUserProfile('user-456', { fullName: 'Hacker' })).rejects.toThrow(
      'Unauthorized: Cannot update another user\'s profile'
    );
  });

  test('should throw error if profile not found', async () => {
    // Arrange
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-123' } } },
          error: null
        })
      }
    });

    (db.query.userProfiles.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);
    (db.update as jest.Mock) = jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([])
        }))
      }))
    }));

    // Act & Assert
    await expect(updateUserProfile('user-123', { fullName: 'Test' })).rejects.toThrow(
      'Profile update failed: User profile not found'
    );
  });
});

describe('Profiles DAL - incrementSessionVersion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should increment session version successfully', async () => {
    // Arrange
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-123' } } },
          error: null
        })
      }
    });

    const mockProfile: UserProfile = {
      id: 'profile-456',
      userId: 'user-123',
      fullName: 'Jane Doe',
      avatarUrl: null,
      dataEncryptionKey: 'dek',
      sessionVersion: 5,
      dashboardWidgets: { staple: [], custom: [] },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    (db.query.userProfiles.findFirst as jest.Mock) = jest.fn().mockResolvedValue(mockProfile);
    (db.update as jest.Mock) = jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn().mockResolvedValue(undefined)
      }))
    }));
    (logAudit as jest.Mock) = jest.fn().mockResolvedValue(undefined);

    // Act
    await incrementSessionVersion('user-123');

    // Assert
    expect(db.update).toHaveBeenCalled();
    expect(logAudit).toHaveBeenCalledWith({
      userId: 'user-123',
      action: 'UPDATE',
      resourceType: 'user_profile',
      resourceId: 'profile-456',
      metadata: {
        operation: 'increment_session_version',
        oldVersion: 5,
        newVersion: 6,
        reason: 'Password change or security update'
      }
    });
  });

  test('should throw error if unauthorized', async () => {
    // Arrange
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-123' } } },
          error: null
        })
      }
    });

    // Act & Assert
    await expect(incrementSessionVersion('user-456')).rejects.toThrow(
      'Unauthorized: Cannot increment another user\'s session version'
    );
  });

  test('should throw error if profile not found', async () => {
    // Arrange
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-123' } } },
          error: null
        })
      }
    });

    (db.query.userProfiles.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);

    // Act & Assert
    await expect(incrementSessionVersion('user-123')).rejects.toThrow('User profile not found');
  });
});

describe('Profiles DAL - getDashboardWidgets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should retrieve dashboard widgets successfully', async () => {
    // Arrange
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-123' } } },
          error: null
        })
      }
    });

    const mockProfile: UserProfile = {
      id: 'profile-456',
      userId: 'user-123',
      fullName: 'Jane Doe',
      avatarUrl: null,
      dataEncryptionKey: 'dek',
      sessionVersion: 1,
      dashboardWidgets: {
        staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
        custom: ['my_custom_widget']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    (db.query.userProfiles.findFirst as jest.Mock) = jest.fn().mockResolvedValue(mockProfile);

    // Act
    const result = await getDashboardWidgets('user-123');

    // Assert
    expect(result).toEqual({
      staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
      custom: ['my_custom_widget']
    });
  });

  test('should throw error if unauthorized', async () => {
    // Arrange
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-123' } } },
          error: null
        })
      }
    });

    // Act & Assert
    await expect(getDashboardWidgets('user-456')).rejects.toThrow(
      'Unauthorized: Cannot access another user\'s dashboard widgets'
    );
  });
});

describe('Profiles DAL - updateDashboardWidgets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should update dashboard widgets successfully', async () => {
    // Arrange
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-123' } } },
          error: null
        })
      }
    });

    const updatedProfile: UserProfile = {
      id: 'profile-456',
      userId: 'user-123',
      fullName: 'Jane Doe',
      avatarUrl: null,
      dataEncryptionKey: 'dek',
      sessionVersion: 1,
      dashboardWidgets: {
        staple: ['rda_snapshot'],
        custom: ['compound_trends']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    (db.update as jest.Mock) = jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([updatedProfile])
        }))
      }))
    }));
    (logAudit as jest.Mock) = jest.fn().mockResolvedValue(undefined);

    const newWidgets = {
      staple: ['rda_snapshot'],
      custom: ['compound_trends']
    };

    // Act
    const result = await updateDashboardWidgets('user-123', newWidgets);

    // Assert
    expect(result).toEqual(newWidgets);
    expect(logAudit).toHaveBeenCalledWith({
      userId: 'user-123',
      action: 'UPDATE',
      resourceType: 'user_profile',
      resourceId: 'profile-456',
      metadata: {
        operation: 'update_dashboard_widgets',
        widgets: newWidgets
      }
    });
  });

  test('should throw error if unauthorized', async () => {
    // Arrange
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-123' } } },
          error: null
        })
      }
    });

    // Act & Assert
    await expect(
      updateDashboardWidgets('user-456', { staple: [], custom: [] })
    ).rejects.toThrow('Unauthorized: Cannot update another user\'s dashboard widgets');
  });
});
