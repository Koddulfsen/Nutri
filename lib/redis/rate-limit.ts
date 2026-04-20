/**
 * Rate Limiting Utilities
 *
 * Purpose: Implement distributed rate limiting using Redis (Upstash)
 * Pattern: Token bucket with atomic INCR operations
 * Limits:
 *   - Login attempts: 5 per IP per 15 minutes
 *   - Password reset: 3 per email per hour
 *   - API key usage: 500 requests per minute (Premium)
 *
 * Generated: 2025-11-10
 * Architecture: Phase 1 Feature System 02 (Authentication & User System)
 */

import { Redis } from '@upstash/redis'

// Initialize Redis client
let redis: Redis | null = null

/**
 * Gets or creates Redis client instance
 * Lazy initialization to handle missing UPSTASH_REDIS_REST_URL gracefully
 */
function getRedisClient(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn(
      '[Rate Limit] Redis not configured - rate limiting will fail open (allow all requests)'
    )
    return null
  }

  redis = new Redis({
    url,
    token,
  })

  return redis
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export interface RateLimitConfig {
  key: string // Redis key (e.g., 'ratelimit:login:192.168.1.1')
  limit: number // Maximum attempts
  windowSeconds: number // Time window in seconds
}

/**
 * Checks rate limit using token bucket pattern
 *
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and remaining attempts
 *
 * @example
 * const result = await checkRateLimit({
 *   key: `ratelimit:login:${ipAddress}`,
 *   limit: 5,
 *   windowSeconds: 900 // 15 minutes
 * })
 *
 * if (!result.allowed) {
 *   throw new Error('Rate limit exceeded. Try again later.')
 * }
 */
export async function checkRateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const client = getRedisClient()

  // Fail open if Redis is not configured
  if (!client) {
    console.warn(`[Rate Limit] Allowing request (Redis unavailable): ${config.key}`)
    return {
      allowed: true,
      remaining: config.limit,
      resetAt: new Date(Date.now() + config.windowSeconds * 1000),
    }
  }

  try {
    // Atomic increment
    const count = await client.incr(config.key)

    // Set TTL only on first increment (count === 1)
    if (count === 1) {
      await client.expire(config.key, config.windowSeconds)
    }

    // Get TTL to calculate resetAt
    const ttl = await client.ttl(config.key)
    const resetAt = new Date(Date.now() + ttl * 1000)

    const allowed = count <= config.limit
    const remaining = Math.max(0, config.limit - count)

    return {
      allowed,
      remaining,
      resetAt,
    }
  } catch (error) {
    console.error('[Rate Limit] Redis error:', error)
    // Fail open on Redis errors
    return {
      allowed: true,
      remaining: config.limit,
      resetAt: new Date(Date.now() + config.windowSeconds * 1000),
    }
  }
}

/**
 * Rate limit for login attempts
 * Limit: 5 attempts per IP per 15 minutes
 *
 * @param ipAddress - Client IP address
 * @returns Rate limit result
 *
 * @example
 * const result = await checkLoginRateLimit('192.168.1.1')
 * if (!result.allowed) {
 *   return res.status(429).json({
 *     error: 'Too many login attempts. Try again later.'
 *   })
 * }
 */
export async function checkLoginRateLimit(
  ipAddress: string
): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `ratelimit:login:${ipAddress}`,
    limit: 5,
    windowSeconds: 900, // 15 minutes
  })
}

/**
 * Rate limit for password reset requests
 * Limit: 3 requests per email per hour
 *
 * @param email - User email address
 * @returns Rate limit result
 *
 * @example
 * const result = await checkPasswordResetRateLimit('user@example.com')
 * if (!result.allowed) {
 *   return res.status(429).json({
 *     error: 'Too many password reset requests. Try again in an hour.'
 *   })
 * }
 */
export async function checkPasswordResetRateLimit(
  email: string
): Promise<RateLimitResult> {
  // Hash email to avoid storing PII in Redis keys
  const emailHash = Buffer.from(email).toString('base64')

  return checkRateLimit({
    key: `ratelimit:reset:${emailHash}`,
    limit: 3,
    windowSeconds: 3600, // 1 hour
  })
}

/**
 * Rate limit for API key requests
 * Limit: 500 requests per minute (Premium users)
 *
 * @param keyPrefix - API key prefix (first 8 chars)
 * @returns Rate limit result
 *
 * @example
 * const result = await checkApiKeyRateLimit('nutri_li')
 * if (!result.allowed) {
 *   return res.status(429).json({
 *     error: 'Rate limit exceeded',
 *     headers: { 'Retry-After': result.resetAt.toISOString() }
 *   })
 * }
 */
export async function checkApiKeyRateLimit(
  keyPrefix: string
): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `ratelimit:api:${keyPrefix}`,
    limit: 500,
    windowSeconds: 60, // 1 minute
  })
}

/**
 * Manually reset rate limit (for testing or admin override)
 *
 * @param key - Redis key to delete
 *
 * @example
 * await resetRateLimit('ratelimit:login:192.168.1.1')
 */
export async function resetRateLimit(key: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    await client.del(key)
  } catch (error) {
    console.error('[Rate Limit] Failed to reset:', error)
  }
}
