// Data Access Layer: Consent Management - FS-4 Security & Compliance System
// Created: 2025-11-10
// Purpose: GDPR Article 7 compliant consent tracking with granular withdrawal

import { db } from '@/db';
import { userConsent } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/security/audit-logger';

/**
 * Consent Record Type (inferred from schema)
 */
export type ConsentRecord = typeof userConsent.$inferSelect;
export type ConsentUpdate = Partial<Omit<ConsentRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

/**
 * Require Authentication
 *
 * Helper function to get authenticated user from Supabase session.
 *
 * @throws Error if user is not authenticated
 * @returns User ID from authenticated session
 */
async function requireAuth(): Promise<string> {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.user) {
    throw new Error('Unauthorized: User must be authenticated');
  }

  return session.user.id;
}

/**
 * Get User Consent
 *
 * Retrieves user's current consent preferences.
 *
 * GDPR COMPLIANCE:
 * - Transparent access to all consent choices
 * - Users can view their consent status at any time
 * - Audit trail of access
 *
 * SECURITY LAYERS:
 * - Layer 1: Authentication check
 * - Layer 2: Authorization check (userId matches session)
 * - Layer 3: RLS policy enforcement
 * - Layer 4: Audit logging
 *
 * @param userId - User ID to retrieve consent for
 * @returns Consent record
 * @throws Error if unauthorized
 *
 * @example
 * const consent = await getUserConsent('user-123');
 * if (consent.analytics) {
 *   // User has consented to analytics
 * }
 */
export async function getUserConsent(userId: string): Promise<ConsentRecord> {
  // Layer 1: Verify authentication
  const sessionUserId = await requireAuth();

  // Layer 2: Verify authorization
  if (sessionUserId !== userId) {
    throw new Error('Unauthorized: Cannot access another user\'s consent');
  }

  // Layer 3: Execute database query (RLS provides additional enforcement)
  const consent = await db.query.userConsent.findFirst({
    where: eq(userConsent.userId, userId)
  });

  if (!consent) {
    throw new Error('User consent record not found');
  }

  // Layer 4: Audit log the READ operation
  await logAudit({
    userId,
    action: 'READ',
    resourceType: 'user_consent',
    resourceId: consent.id
  });

  return consent;
}

/**
 * Update User Consent
 *
 * Updates user's consent preferences with GDPR compliance.
 *
 * GDPR COMPLIANCE:
 * - Freely given (no coercion)
 * - Specific (granular per consent type)
 * - Informed (clear explanations required in UI)
 * - Unambiguous (explicit opt-in action)
 * - Withdrawal as easy as giving consent
 * - Before/after snapshots for audit trail
 *
 * CONSENT TYPES:
 * - newsletter: Marketing emails
 * - pushNotifications: Browser/mobile push notifications
 * - research: Anonymized data for research purposes
 * - analytics: Usage tracking (Google Analytics, etc.)
 * - thirdParty: Data sharing with partners
 *
 * WITHDRAWAL EFFECTS:
 * - Immediate: newsletter, pushNotifications (stop sending immediately)
 * - 7-day cleanup: research, analytics (remove from analytics platforms)
 * - 30-day cleanup: thirdParty (notify partners, remove shared data)
 *
 * @param userId - User ID
 * @param updates - Consent updates (partial)
 * @returns Updated consent record
 * @throws Error if unauthorized
 *
 * @example
 * await updateUserConsent('user-123', {
 *   analytics: false, // Withdraw analytics consent
 *   newsletter: true  // Grant newsletter consent
 * });
 */
export async function updateUserConsent(
  userId: string,
  updates: ConsentUpdate
): Promise<ConsentRecord> {
  // Verify authentication and authorization
  const sessionUserId = await requireAuth();
  if (sessionUserId !== userId) {
    throw new Error('Unauthorized: Cannot update another user\'s consent');
  }

  // Capture old state for audit trail (GDPR requirement)
  const oldConsent = await db.query.userConsent.findFirst({
    where: eq(userConsent.userId, userId)
  });

  if (!oldConsent) {
    throw new Error('User consent record not found');
  }

  // Update consent
  const updated = await db
    .update(userConsent)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where(eq(userConsent.userId, userId))
    .returning();

  if (!updated || updated.length === 0) {
    throw new Error('Consent update failed');
  }

  // Audit log CONSENT_CHANGE with before/after metadata (CRITICAL for GDPR)
  await logAudit({
    userId,
    action: 'CONSENT_CHANGE',
    resourceType: 'user_consent',
    resourceId: updated[0].id,
    metadata: {
      changes: {
        before: oldConsent,
        after: updated[0]
      }
    }
  });

  // TODO: Trigger cleanup jobs for withdrawn consents
  // This will be implemented in Wave 4 when building GDPR rights APIs
  // - If newsletter withdrawn: Remove from mailing list immediately
  // - If analytics withdrawn: Schedule 7-day cleanup job
  // - If thirdParty withdrawn: Notify partners, schedule 30-day cleanup

  return updated[0];
}

/**
 * Check Consent for Specific Type
 *
 * Helper function to check if user has granted specific consent.
 *
 * @param userId - User ID
 * @param consentType - Type of consent to check
 * @returns True if consent granted, false otherwise
 * @throws Error if unauthorized
 *
 * @example
 * const hasAnalyticsConsent = await checkConsent('user-123', 'analytics');
 * if (hasAnalyticsConsent) {
 *   // Track analytics event
 * }
 */
export async function checkConsent(
  userId: string,
  consentType: 'newsletter' | 'pushNotifications' | 'research' | 'analytics' | 'thirdParty'
): Promise<boolean> {
  const consent = await getUserConsent(userId);
  return consent[consentType] ?? false;
}

/**
 * Grant All Consents
 *
 * Helper function to grant all consent types (used in "Accept All" button).
 *
 * @param userId - User ID
 * @returns Updated consent record
 * @throws Error if unauthorized
 *
 * @example
 * await grantAllConsents('user-123');
 * // All consent types now true
 */
export async function grantAllConsents(userId: string): Promise<ConsentRecord> {
  return updateUserConsent(userId, {
    newsletter: true,
    pushNotifications: true,
    research: true,
    analytics: true,
    thirdParty: true
  });
}

/**
 * Revoke All Consents
 *
 * Helper function to revoke all consent types (used in "Reject All" button).
 *
 * @param userId - User ID
 * @returns Updated consent record
 * @throws Error if unauthorized
 *
 * @example
 * await revokeAllConsents('user-123');
 * // All consent types now false
 */
export async function revokeAllConsents(userId: string): Promise<ConsentRecord> {
  return updateUserConsent(userId, {
    newsletter: false,
    pushNotifications: false,
    research: false,
    analytics: false,
    thirdParty: false
  });
}

/**
 * Create Initial Consent Record
 *
 * Creates initial consent record for new users with all consents defaulting to false.
 * This is called during user registration.
 *
 * GDPR COMPLIANCE:
 * - No pre-checked boxes (all default to false)
 * - User must explicitly opt-in
 *
 * @param userId - User ID
 * @returns Created consent record
 * @throws Error if consent record already exists
 *
 * @example
 * await createInitialConsent('new-user-123');
 */
export async function createInitialConsent(userId: string): Promise<ConsentRecord> {
  // Check if consent record already exists
  const existing = await db.query.userConsent.findFirst({
    where: eq(userConsent.userId, userId)
  });

  if (existing) {
    throw new Error('Consent record already exists for this user');
  }

  // Create initial consent record (all false by default)
  const created = await db
    .insert(userConsent)
    .values({
      userId,
      newsletter: false,
      pushNotifications: false,
      research: false,
      analytics: false,
      thirdParty: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();

  if (!created || created.length === 0) {
    throw new Error('Failed to create initial consent record');
  }

  // Audit log the creation
  await logAudit({
    userId,
    action: 'CREATE',
    resourceType: 'user_consent',
    resourceId: created[0].id,
    metadata: {
      operation: 'initial_consent_creation',
      allConsentsFalse: true
    }
  });

  return created[0];
}
