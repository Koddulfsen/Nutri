/**
 * User Service
 *
 * Purpose: User profile management
 * Features:
 *   - Ensure user profile exists (auto-create if missing)
 *   - Get user profile
 *
 * Created: 2026-01-06
 */

import { db } from '@/db'
import { userProfiles, userEncryptionKeys } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { generateDEK } from '@/lib/security/encryption'
import { createInitialConsent } from '@/lib/dal/consent'
import { logger } from '@/lib/logger'

/**
 * Ensure user profile exists
 * Creates a profile with generated DEK if one doesn't exist
 *
 * @param userId - User ID from Supabase auth
 * @param metadata - Optional user metadata (name, avatar)
 * @returns true if profile was created, false if it already existed
 */
export async function ensureUserProfile(
  userId: string,
  metadata?: {
    fullName?: string | null
    avatarUrl?: string | null
  }
): Promise<boolean> {
  try {
    // Check if profile exists
    const existing = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1)

    if (existing.length > 0) {
      return false // Profile already exists
    }

    // Create profile and its encryption key as separate inserts — the key lives
    // in its own table, never on user_profiles. See db/schema/users.ts
    // (userEncryptionKeys) for why.
    const dek = await generateDEK()
    await db.insert(userProfiles).values({
      userId,
      fullName: metadata?.fullName || null,
      avatarUrl: metadata?.avatarUrl || null,
    })
    await db.insert(userEncryptionKeys).values({
      userId,
      dataEncryptionKey: dek,
    })

    // Every new user needs a real consent row from the start (all flags false) —
    // checkConsent() throws for a user with none at all. See app/auth/callback/route.ts
    // for the OAuth-path equivalent of this same wiring.
    await createInitialConsent(userId)

    logger.info(
      { service: 'user-service', userId },
      'Created user profile'
    )

    return true
  } catch (error) {
    logger.error(
      {
        service: 'user-service',
        userId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to ensure user profile'
    )
    throw error
  }
}

/**
 * Get user profile
 *
 * @param userId - User ID from Supabase auth
 * @returns User profile or null if not found
 */
export async function getUserProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1)

  return profile || null
}
