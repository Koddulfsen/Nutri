// Test Suite: User Profiles Data Access Layer
// Tests for lib/dal/profiles.ts

import { describe, test, expect, vi, beforeEach, type Mock } from 'vitest';
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
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/security/audit-logger';

// Explicit factory, not bare vi.mock('@/db') — an automock introspects the
// real module first, and db/index.ts's `db` export is a lazily-connecting
// getter, so automocking it actually triggers a real connection attempt.
vi.mock('@/db', () => ({
  db: {
    query: { userProfiles: { findFirst: vi.fn() } },
    update: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/security/audit-logger');

// requireAuth() in lib/dal/profiles.ts calls supabase.auth.getUser() — NOT
// getSession(). Mocking getSession() here would leave `user` undefined and
// make every "success" test actually hit the Unauthorized path silently
// passing for the wrong reason (or failing) — this was the bug in the
// original Jest version of this file.
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

describe('Profiles DAL - getUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should retrieve user profile successfully', async () => {
    mockAuthedUser('user-123');

    const mockProfile: UserProfile = {
      id: 'profile-456',
      userId: 'user-123',
      fullName: 'Jane Doe',
      avatarUrl: 'https://example.com/avatar.jpg',
      sessionVersion: 1,
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
      birthYear: null,
      birthMonth: null,
      biologicalSex: null,
      lifeStageEncrypted: null,
      manualAgeGroup: null,
      dvSourcePreference: 'AVERAGE',
      dashboardWidgets: {
        staple: ['rda_snapshot', 'recent_meals'],
        custom: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    (db.query.userProfiles.findFirst as Mock) = vi.fn().mockResolvedValue(mockProfile);
    (logAudit as Mock).mockResolvedValue(undefined);

    const result = await getUserProfile('user-123');

    expect(result).toEqual(mockProfile);
    expect(logAudit).toHaveBeenCalledWith({
      userId: 'user-123',
      action: 'READ',
      resourceType: 'user_profile',
      resourceId: 'profile-456'
    });
  });

  test('should throw error if user not authenticated', async () => {
    mockAuthedUser(null);

    await expect(getUserProfile('user-123')).rejects.toThrow('Unauthorized: User must be authenticated');
  });

  test('should throw error if userId mismatch (authorization check)', async () => {
    mockAuthedUser('user-123');

    await expect(getUserProfile('user-456')).rejects.toThrow("Unauthorized: Cannot access another user's profile");
  });

  test('should return null if profile not found', async () => {
    mockAuthedUser('user-123');

    (db.query.userProfiles.findFirst as Mock) = vi.fn().mockResolvedValue(null);
    (logAudit as Mock).mockResolvedValue(undefined);

    const result = await getUserProfile('user-123');

    expect(result).toBeNull();
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({
      resourceId: null
    }));
  });
});

describe('Profiles DAL - updateUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should update user profile successfully', async () => {
    mockAuthedUser('user-123');

    const oldProfile: UserProfile = {
      id: 'profile-456',
      userId: 'user-123',
      fullName: 'Jane Doe',
      avatarUrl: null,
      sessionVersion: 1,
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
      birthYear: null,
      birthMonth: null,
      biologicalSex: null,
      lifeStageEncrypted: null,
      manualAgeGroup: null,
      dvSourcePreference: 'AVERAGE',
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

    (db.query.userProfiles.findFirst as Mock) = vi.fn().mockResolvedValue(oldProfile);
    (db.update as Mock) = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([updatedProfile])
        }))
      }))
    }));
    (logAudit as Mock).mockResolvedValue(undefined);

    const updates: UserProfileUpdate = {
      fullName: 'Jane Smith',
      avatarUrl: 'https://example.com/new-avatar.jpg'
    };

    const result = await updateUserProfile('user-123', updates);

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
    mockAuthedUser('user-123');

    await expect(updateUserProfile('user-456', { fullName: 'Hacker' })).rejects.toThrow(
      "Unauthorized: Cannot update another user's profile"
    );
  });

  test('should throw error if profile not found', async () => {
    mockAuthedUser('user-123');

    (db.query.userProfiles.findFirst as Mock) = vi.fn().mockResolvedValue(null);
    (db.update as Mock) = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([])
        }))
      }))
    }));

    await expect(updateUserProfile('user-123', { fullName: 'Test' })).rejects.toThrow(
      'Profile update failed: User profile not found'
    );
  });
});

describe('Profiles DAL - incrementSessionVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should increment session version successfully', async () => {
    mockAuthedUser('user-123');

    const mockProfile: UserProfile = {
      id: 'profile-456',
      userId: 'user-123',
      fullName: 'Jane Doe',
      avatarUrl: null,
      sessionVersion: 5,
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
      birthYear: null,
      birthMonth: null,
      biologicalSex: null,
      lifeStageEncrypted: null,
      manualAgeGroup: null,
      dvSourcePreference: 'AVERAGE',
      dashboardWidgets: { staple: [], custom: [] },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    (db.query.userProfiles.findFirst as Mock) = vi.fn().mockResolvedValue(mockProfile);
    (db.update as Mock) = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined)
      }))
    }));
    (logAudit as Mock).mockResolvedValue(undefined);

    await incrementSessionVersion('user-123');

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
    mockAuthedUser('user-123');

    await expect(incrementSessionVersion('user-456')).rejects.toThrow(
      "Unauthorized: Cannot increment another user's session version"
    );
  });

  test('should throw error if profile not found', async () => {
    mockAuthedUser('user-123');

    (db.query.userProfiles.findFirst as Mock) = vi.fn().mockResolvedValue(null);

    await expect(incrementSessionVersion('user-123')).rejects.toThrow('User profile not found');
  });
});

describe('Profiles DAL - getDashboardWidgets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should retrieve dashboard widgets successfully', async () => {
    mockAuthedUser('user-123');

    const mockProfile: UserProfile = {
      id: 'profile-456',
      userId: 'user-123',
      fullName: 'Jane Doe',
      avatarUrl: null,
      sessionVersion: 1,
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
      birthYear: null,
      birthMonth: null,
      biologicalSex: null,
      lifeStageEncrypted: null,
      manualAgeGroup: null,
      dvSourcePreference: 'AVERAGE',
      dashboardWidgets: {
        staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
        custom: ['my_custom_widget']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    (db.query.userProfiles.findFirst as Mock) = vi.fn().mockResolvedValue(mockProfile);

    const result = await getDashboardWidgets('user-123');

    expect(result).toEqual({
      staple: ['rda_snapshot', 'recent_meals', 'compound_trends'],
      custom: ['my_custom_widget']
    });
  });

  test('should throw error if unauthorized', async () => {
    mockAuthedUser('user-123');

    await expect(getDashboardWidgets('user-456')).rejects.toThrow(
      "Unauthorized: Cannot access another user's dashboard widgets"
    );
  });
});

describe('Profiles DAL - updateDashboardWidgets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should update dashboard widgets successfully', async () => {
    mockAuthedUser('user-123');

    const updatedProfile: UserProfile = {
      id: 'profile-456',
      userId: 'user-123',
      fullName: 'Jane Doe',
      avatarUrl: null,
      sessionVersion: 1,
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
      birthYear: null,
      birthMonth: null,
      biologicalSex: null,
      lifeStageEncrypted: null,
      manualAgeGroup: null,
      dvSourcePreference: 'AVERAGE',
      dashboardWidgets: {
        staple: ['rda_snapshot'],
        custom: ['compound_trends']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    (db.update as Mock) = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([updatedProfile])
        }))
      }))
    }));
    (logAudit as Mock).mockResolvedValue(undefined);

    const newWidgets = {
      staple: ['rda_snapshot'],
      custom: ['compound_trends']
    };

    const result = await updateDashboardWidgets('user-123', newWidgets);

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
    mockAuthedUser('user-123');

    await expect(
      updateDashboardWidgets('user-456', { staple: [], custom: [] })
    ).rejects.toThrow("Unauthorized: Cannot update another user's dashboard widgets");
  });
});
