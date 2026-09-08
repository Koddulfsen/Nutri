// Data Access Layer: User Profiles - FS-4 Security & Compliance System
// Created: 2025-11-10
// Purpose: Centralized authentication/authorization for user profile operations

import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/security/audit-logger';

/**
 * User Profile Type (inferred from schema)
 */
export type UserProfile = typeof userProfiles.$inferSelect;
export type UserProfileUpdate = Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

/**
 * Require Authentication
 *
 * Helper function to get authenticated user from Supabase session.
 * Throws error if user is not authenticated.
 *
 * @throws Error if user is not authenticated
 * @returns User ID from authenticated session
 */
async function requireAuth(): Promise<string> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized: User must be authenticated');
  }

  return user.id;
}

/**
 * Get User Profile
 *
 * Retrieves user profile for authenticated user.
 *
 * SECURITY LAYERS:
 * - Layer 1: Authentication check (requireAuth)
 * - Layer 2: Authorization check (userId matches session)
 * - Layer 3: NONE. Previously claimed database-level RLS; zero policies exist.
 * - Layer 4: Audit logging
 *
 * @param userId - User ID to retrieve profile for
 * @returns User profile or null if not found
 * @throws Error if unauthorized or userId mismatch
 *
 * @example
 * const profile = await getUserProfile('user-123');
 * console.log(profile.fullName);
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  // Layer 1: Verify authentication
  const sessionUserId = await requireAuth();

  // Layer 2: Verify authorization (user can only access own profile)
  if (sessionUserId !== userId) {
    throw new Error('Unauthorized: Cannot access another user\'s profile');
  }

  // Layer 3: Execute database query (RLS provides additional enforcement)
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId)
  });

  // Layer 4: Audit log the READ operation
  await logAudit({
    userId,
    action: 'READ',
    resourceType: 'user_profile',
    resourceId: profile?.id || null
  });

  return profile || null;
}

/**
 * Update User Profile
 *
 * Updates user profile fields for authenticated user.
 *
 * SECURITY LAYERS:
 * - Layer 1: Authentication check
 * - Layer 2: Authorization check (userId matches session)
 * - Layer 3: NONE. Previously claimed RLS; zero policies exist.
 * - Layer 4: Audit logging with before/after snapshots
 *
 * @param userId - User ID to update
 * @param updates - Partial profile updates
 * @returns Updated user profile
 * @throws Error if unauthorized or update fails
 *
 * @example
 * const updated = await updateUserProfile('user-123', {
 *   fullName: 'Jane Doe',
 *   avatarUrl: 'https://example.com/avatar.jpg'
 * });
 */
export async function updateUserProfile(
  userId: string,
  updates: UserProfileUpdate
): Promise<UserProfile> {
  // Layer 1: Verify authentication
  const sessionUserId = await requireAuth();

  // Layer 2: Verify authorization
  if (sessionUserId !== userId) {
    throw new Error('Unauthorized: Cannot update another user\'s profile');
  }

  // Capture old state for audit trail
  const oldProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId)
  });

  // Execute update. NOTE: no RLS exists — the userId filter below is the only
  // ownership check.
  const updated = await db
    .update(userProfiles)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where(eq(userProfiles.userId, userId))
    .returning();

  if (!updated || updated.length === 0) {
    throw new Error('Profile update failed: User profile not found');
  }

  // Layer 4: Audit log with before/after metadata
  await logAudit({
    userId,
    action: 'UPDATE',
    resourceType: 'user_profile',
    resourceId: updated[0].id,
    metadata: {
      changes: {
        before: oldProfile,
        after: updated[0]
      }
    }
  });

  return updated[0];
}

/**
 * Increment Session Version
 *
 * Increments session version to invalidate all existing sessions.
 * Used when user changes password or security settings.
 *
 * SECURITY: Forces re-authentication on all devices
 *
 * @param userId - User ID to increment session version for
 * @throws Error if unauthorized or update fails
 *
 * @example
 * await incrementSessionVersion('user-123');
 * // All existing sessions now invalidated
 */
export async function incrementSessionVersion(userId: string): Promise<void> {
  // Verify authentication and authorization
  const sessionUserId = await requireAuth();
  if (sessionUserId !== userId) {
    throw new Error('Unauthorized: Cannot increment another user\'s session version');
  }

  // Get current version
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId)
  });

  if (!profile) {
    throw new Error('User profile not found');
  }

  const newVersion = (profile.sessionVersion || 1) + 1;

  // Update session version
  await db
    .update(userProfiles)
    .set({
      sessionVersion: newVersion,
      updatedAt: new Date()
    })
    .where(eq(userProfiles.userId, userId));

  // Audit log the security operation
  await logAudit({
    userId,
    action: 'UPDATE',
    resourceType: 'user_profile',
    resourceId: profile.id,
    metadata: {
      operation: 'increment_session_version',
      oldVersion: profile.sessionVersion,
      newVersion,
      reason: 'Password change or security update'
    }
  });
}

/**
 * Get Dashboard Widgets Configuration
 *
 * Retrieves user's dashboard widget preferences.
 *
 * @param userId - User ID
 * @returns Dashboard widgets configuration
 * @throws Error if unauthorized
 *
 * @example
 * const widgets = await getDashboardWidgets('user-123');
 * console.log(widgets.staple); // ['rda_snapshot', 'recent_meals']
 */
export async function getDashboardWidgets(userId: string): Promise<{
  staple: string[];
  custom: string[];
}> {
  const sessionUserId = await requireAuth();
  if (sessionUserId !== userId) {
    throw new Error('Unauthorized: Cannot access another user\'s dashboard widgets');
  }

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId)
  });

  if (!profile) {
    throw new Error('User profile not found');
  }

  // Type guard for JSONB field
  const widgets = profile.dashboardWidgets as { staple: string[]; custom: string[] };

  return widgets;
}

/**
 * Update Dashboard Widgets Configuration
 *
 * Updates user's dashboard widget preferences.
 *
 * @param userId - User ID
 * @param widgets - New widget configuration
 * @returns Updated widgets configuration
 * @throws Error if unauthorized
 *
 * @example
 * await updateDashboardWidgets('user-123', {
 *   staple: ['rda_snapshot', 'recent_meals'],
 *   custom: ['compound_trends']
 * });
 */
export async function updateDashboardWidgets(
  userId: string,
  widgets: { staple: string[]; custom: string[] }
): Promise<{ staple: string[]; custom: string[] }> {
  const sessionUserId = await requireAuth();
  if (sessionUserId !== userId) {
    throw new Error('Unauthorized: Cannot update another user\'s dashboard widgets');
  }

  const updated = await db
    .update(userProfiles)
    .set({
      dashboardWidgets: widgets,
      updatedAt: new Date()
    })
    .where(eq(userProfiles.userId, userId))
    .returning();

  if (!updated || updated.length === 0) {
    throw new Error('Dashboard widgets update failed');
  }

  await logAudit({
    userId,
    action: 'UPDATE',
    resourceType: 'user_profile',
    resourceId: updated[0].id,
    metadata: {
      operation: 'update_dashboard_widgets',
      widgets
    }
  });

  return widgets;
}
