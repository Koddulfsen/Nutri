// Data Access Layer: API Keys - FS-4 Security & Compliance System
// Created: 2025-11-10
// Purpose: API key generation, validation, and management for Premium users

import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/security/audit-logger';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * API Key Type (inferred from schema)
 */
export type ApiKey = typeof apiKeys.$inferSelect;

/**
 * API Key with Plaintext (returned ONCE during generation)
 */
export interface ApiKeyWithPlaintext {
  key: string; // Plaintext key (displayed ONCE)
  keyRecord: ApiKey; // Database record (without plaintext)
}

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
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized: User must be authenticated');
  }

  return user.id;
}

/**
 * Generate Random API Key
 *
 * Generates secure random API key with prefix for identification.
 *
 * FORMAT: nutri_live_[32-character-random-string]
 * EXAMPLE: nutri_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 *
 * @returns Plaintext API key (to be hashed before storage)
 */
function generateRandomKey(): string {
  const randomBytes = crypto.randomBytes(24); // 24 bytes = 32 chars base64
  const randomString = randomBytes.toString('base64url').substring(0, 32);
  return `nutri_live_${randomString}`;
}

/**
 * Extract Key Prefix
 *
 * Extracts prefix from API key for indexing and identification.
 *
 * PREFIX FORMAT: nutri_live_[first-8-chars]
 * EXAMPLE: nutri_live_a1b2c3d4
 *
 * @param key - Full API key
 * @returns Key prefix for indexing
 */
function extractKeyPrefix(key: string): string {
  // Extract first 8 characters after "nutri_live_"
  const parts = key.split('_');
  if (parts.length !== 3 || parts[0] !== 'nutri' || parts[1] !== 'live') {
    throw new Error('Invalid API key format');
  }
  return `nutri_live_${parts[2].substring(0, 8)}`;
}

/**
 * Hash API Key
 *
 * Hashes API key using bcrypt for secure storage.
 *
 * SECURITY:
 * - bcrypt with 10 rounds (balance between security and performance)
 * - Plaintext key NEVER stored in database
 * - Hash is irreversible (cannot recover plaintext from hash)
 *
 * @param key - Plaintext API key
 * @returns Bcrypt hash
 */
async function hashKey(key: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(key, saltRounds);
}

/**
 * Verify API Key
 *
 * Verifies plaintext key against stored bcrypt hash.
 *
 * @param key - Plaintext API key
 * @param hash - Stored bcrypt hash
 * @returns True if key matches hash
 */
async function verifyKey(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash);
}

/**
 * Generate API Key
 *
 * Generates new API key for authenticated Premium user.
 *
 * PREMIUM FEATURE:
 * - Requires Premium subscription
 * - Limit: 5 active keys per user
 * - Rate limit: 500 requests per minute
 *
 * SECURITY:
 * - Key displayed ONCE (cannot be recovered later)
 * - Stored as bcrypt hash (irreversible)
 * - Prefix indexed for fast lookup
 *
 * @param userId - User ID
 * @param name - Friendly name for the key (e.g., "Production API", "Mobile App")
 * @returns API key with plaintext (display ONCE to user)
 * @throws Error if unauthorized, limit exceeded, or Premium required
 *
 * @example
 * const { key, keyRecord } = await generateApiKey('user-123', 'Production API');
 * console.log('SAVE THIS KEY (shown only once):', key);
 * // key: "nutri_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
 * // keyRecord.keyPrefix: "nutri_live_a1b2c3d4"
 * // keyRecord.keyHash: "$2b$10$..."
 */
export async function generateApiKey(
  userId: string,
  name: string
): Promise<ApiKeyWithPlaintext> {
  // Verify authentication and authorization
  const sessionUserId = await requireAuth();
  if (sessionUserId !== userId) {
    throw new Error('Unauthorized: Cannot generate API key for another user');
  }

  // TODO Phase 2: Check Premium subscription status
  // For now, allow all authenticated users (Phase 1 has no subscription system)
  // const isPremium = await checkPremiumStatus(userId);
  // if (!isPremium) {
  //   throw new Error('Premium subscription required to generate API keys');
  // }

  // Check limit: max 5 active keys per user
  const activeKeys = await db.query.apiKeys.findMany({
    where: and(
      eq(apiKeys.userId, userId),
      eq(apiKeys.isRevoked, false)
    )
  });

  if (activeKeys.length >= 5) {
    throw new Error('API key limit exceeded: Maximum 5 active keys per user');
  }

  // Generate random API key
  const plaintextKey = generateRandomKey();
  const keyPrefix = extractKeyPrefix(plaintextKey);
  const keyHash = await hashKey(plaintextKey);

  // Create API key record
  const created = await db
    .insert(apiKeys)
    .values({
      userId,
      keyPrefix,
      keyHash,
      name,
      rateLimit: 500, // 500 requests per minute (Premium tier)
      lastUsedAt: null,
      expiresAt: null, // No expiration by default (can be set by user)
      isRevoked: false,
      createdAt: new Date()
    })
    .returning();

  if (!created || created.length === 0) {
    throw new Error('Failed to create API key');
  }

  // Audit log the key generation
  await logAudit({
    userId,
    action: 'CREATE',
    resourceType: 'api_key',
    resourceId: created[0].id,
    metadata: {
      keyPrefix,
      name,
      rateLimit: 500
    }
  });

  return {
    key: plaintextKey, // Return plaintext key (displayed ONCE to user)
    keyRecord: created[0] // Database record (without plaintext)
  };
}

/**
 * List API Keys
 *
 * Retrieves all API keys for authenticated user (without plaintext keys).
 *
 * RETURNS:
 * - Key metadata (prefix, name, created_at, last_used_at)
 * - NO plaintext keys (cannot be recovered)
 *
 * @param userId - User ID
 * @returns List of API key records (without plaintext)
 * @throws Error if unauthorized
 *
 * @example
 * const keys = await listApiKeys('user-123');
 * keys.forEach(key => {
 *   console.log(`${key.name}: ${key.keyPrefix}****`);
 *   console.log(`Last used: ${key.lastUsedAt || 'Never'}`);
 * });
 */
export async function listApiKeys(userId: string): Promise<ApiKey[]> {
  // Verify authentication and authorization
  const sessionUserId = await requireAuth();
  if (sessionUserId !== userId) {
    throw new Error('Unauthorized: Cannot list another user\'s API keys');
  }

  // Retrieve all API keys for user (including revoked)
  const keys = await db.query.apiKeys.findMany({
    where: eq(apiKeys.userId, userId),
    orderBy: (apiKeys, { desc }) => [desc(apiKeys.createdAt)]
  });

  // Audit log the READ operation
  await logAudit({
    userId,
    action: 'READ',
    resourceType: 'api_key',
    metadata: {
      count: keys.length
    }
  });

  return keys;
}

/**
 * Revoke API Key
 *
 * Revokes (soft deletes) API key for authenticated user.
 *
 * SECURITY:
 * - Soft delete (set is_revoked = true)
 * - Preserves audit trail (key record remains in database)
 * - Immediate effect (key cannot be used after revocation)
 *
 * @param userId - User ID
 * @param keyId - API key ID to revoke
 * @throws Error if unauthorized or key not found
 *
 * @example
 * await revokeApiKey('user-123', 'key-id-456');
 * // Key is now revoked and cannot be used
 */
export async function revokeApiKey(userId: string, keyId: string): Promise<void> {
  // Verify authentication and authorization
  const sessionUserId = await requireAuth();
  if (sessionUserId !== userId) {
    throw new Error('Unauthorized: Cannot revoke another user\'s API key');
  }

  // Verify key belongs to user
  const key = await db.query.apiKeys.findFirst({
    where: and(
      eq(apiKeys.id, keyId),
      eq(apiKeys.userId, userId)
    )
  });

  if (!key) {
    throw new Error('API key not found or does not belong to user');
  }

  // Revoke key (soft delete)
  await db
    .update(apiKeys)
    .set({ isRevoked: true })
    .where(eq(apiKeys.id, keyId));

  // Audit log the revocation
  await logAudit({
    userId,
    action: 'DELETE',
    resourceType: 'api_key',
    resourceId: keyId,
    metadata: {
      keyPrefix: key.keyPrefix,
      name: key.name,
      operation: 'revoke'
    }
  });
}

/**
 * Validate API Key
 *
 * Validates plaintext API key and returns key record if valid.
 *
 * VALIDATION CHECKS:
 * 1. Key format is correct (nutri_live_...)
 * 2. Key exists in database (by prefix lookup)
 * 3. Key hash matches (bcrypt verification)
 * 4. Key is not revoked
 * 5. Key has not expired (if expiration set)
 *
 * PERFORMANCE:
 * - Uses prefix index for fast lookup (idx_api_keys_prefix)
 * - bcrypt verification is intentionally slow (security vs performance)
 *
 * @param keyPrefix - Key prefix extracted from request header
 * @param plaintextKey - Full plaintext API key
 * @returns API key record if valid, null if invalid
 *
 * @example
 * const apiKey = request.headers.get('X-API-Key');
 * const prefix = extractKeyPrefix(apiKey);
 * const validKey = await validateApiKey(prefix, apiKey);
 *
 * if (!validKey) {
 *   return new Response('Invalid API key', { status: 401 });
 * }
 *
 * // Update last_used_at
 * await updateKeyLastUsed(validKey.id);
 */
export async function validateApiKey(
  keyPrefix: string,
  plaintextKey: string
): Promise<ApiKey | null> {
  // Find all keys with matching prefix (should be 0 or 1)
  const candidates = await db.query.apiKeys.findMany({
    where: and(
      eq(apiKeys.keyPrefix, keyPrefix),
      eq(apiKeys.isRevoked, false)
    )
  });

  if (candidates.length === 0) {
    return null; // No matching key
  }

  // Verify each candidate (usually just 1)
  for (const candidate of candidates) {
    const isValid = await verifyKey(plaintextKey, candidate.keyHash);

    if (isValid) {
      // Check expiration
      if (candidate.expiresAt && candidate.expiresAt < new Date()) {
        return null; // Key expired
      }

      // Valid key found
      return candidate;
    }
  }

  return null; // No matching hash
}

/**
 * Update Key Last Used Timestamp
 *
 * Updates last_used_at timestamp for API key.
 * Called after successful API key validation.
 *
 * @param keyId - API key ID
 *
 * @example
 * await updateKeyLastUsed('key-id-456');
 */
export async function updateKeyLastUsed(keyId: string): Promise<void> {
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyId));
}

/**
 * Set Key Expiration
 *
 * Sets expiration date for API key.
 *
 * @param userId - User ID
 * @param keyId - API key ID
 * @param expiresAt - Expiration date (or null to remove expiration)
 * @throws Error if unauthorized or key not found
 *
 * @example
 * const in30Days = new Date();
 * in30Days.setDate(in30Days.getDate() + 30);
 * await setKeyExpiration('user-123', 'key-id-456', in30Days);
 */
export async function setKeyExpiration(
  userId: string,
  keyId: string,
  expiresAt: Date | null
): Promise<void> {
  // Verify authentication and authorization
  const sessionUserId = await requireAuth();
  if (sessionUserId !== userId) {
    throw new Error('Unauthorized: Cannot modify another user\'s API key');
  }

  // Verify key belongs to user
  const key = await db.query.apiKeys.findFirst({
    where: and(
      eq(apiKeys.id, keyId),
      eq(apiKeys.userId, userId)
    )
  });

  if (!key) {
    throw new Error('API key not found or does not belong to user');
  }

  // Update expiration
  await db
    .update(apiKeys)
    .set({ expiresAt })
    .where(eq(apiKeys.id, keyId));

  // Audit log the update
  await logAudit({
    userId,
    action: 'UPDATE',
    resourceType: 'api_key',
    resourceId: keyId,
    metadata: {
      keyPrefix: key.keyPrefix,
      operation: 'set_expiration',
      expiresAt: expiresAt?.toISOString() || null
    }
  });
}
