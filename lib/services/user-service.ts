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
import { userProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { generateDEK } from '@/lib/security/encryption'
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

    // Create profile with generated DEK
    const dek = await generateDEK()
    await db.insert(userProfiles).values({
      userId,
      fullName: metadata?.fullName || null,
      avatarUrl: metadata?.avatarUrl || null,
      dataEncryptionKey: dek,
    })

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
