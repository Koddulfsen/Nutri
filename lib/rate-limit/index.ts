/**
 * Rate Limiting — Postgres-backed
 *
 * Replaces the previous Upstash Redis implementation, which pointed at a host
 * that no longer resolves and **failed open on every call**. Login brute-force
 * and password-reset flooding were therefore completely unthrottled.
 *
 * Two design decisions worth understanding before changing anything here:
 *
 * 1. FAIL CLOSED ON AUTH. The old code returned `allowed: true` whenever the
 *    store was unreachable. That is the correct trade-off for a comment box and
 *    the wrong one for a login form — it converts an outage into an open door.
 *    Callers declare their own posture via `failMode`, and the auth helpers below
 *    choose 'closed'.
 *
 * 2. ONE ATOMIC STATEMENT. The window is advanced in the same UPSERT that
 *    increments the counter, so two concurrent requests cannot both read "0" and
 *    both pass. A read-then-write limiter is not a limiter under load.
 *
 * Postgres rather than a new vendor: counters are low-volume, the database is
 * already a hard dependency, and one less external service is one less security
 * control that can vanish silently.
 */

import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { logger } from '@/lib/logger';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  /** True when the limiter itself failed and `allowed` came from the fail mode. */
  degraded?: boolean;
}

export interface RateLimitConfig {
  /** Identity being limited, e.g. `login:203.0.113.0`. */
  key: string;
  /** Maximum requests permitted per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
  /**
   * What to do when the limiter cannot reach the database.
   * 'closed' denies the request (use for authentication and anything costly).
   * 'open' permits it (use where availability matters more than the limit).
   */
  failMode?: 'open' | 'closed';
}

/**
 * Counts one request against `key` and reports whether it is allowed.
 *
 * The UPSERT below is the whole limiter. On conflict it either continues the
 * current window (`count + 1`) or, if the stored window has already elapsed,
 * starts a new one (`count = 1`) — decided inside the statement so no concurrent
 * request can observe an intermediate state.
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const { key, limit, windowSeconds, failMode = 'closed' } = config;

  try {
    const rows = (await db.execute(sql`
      INSERT INTO rate_limits (key, count, expires_at, created_at)
      VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}), now())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limits.expires_at <= now() THEN 1
          ELSE rate_limits.count + 1
        END,
        expires_at = CASE
          WHEN rate_limits.expires_at <= now()
            THEN now() + make_interval(secs => ${windowSeconds})
          ELSE rate_limits.expires_at
        END,
        created_at = CASE
          WHEN rate_limits.expires_at <= now() THEN now()
          ELSE rate_limits.created_at
        END
      RETURNING count, expires_at
    `)) as unknown as Array<{ count: number; expires_at: string | Date }>;

    const row = Array.isArray(rows) ? rows[0] : (rows as any)?.rows?.[0];
    if (!row) throw new Error('rate limit upsert returned no row');

    const count = Number(row.count);
    const resetAt = new Date(row.expires_at);

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt,
    };
  } catch (error) {
    // A limiter that cannot count must not silently permit. Log loudly, then
    // apply the caller's declared posture.
    logger.error(
      { key, error: error instanceof Error ? error.message : String(error), failMode },
      'Rate limiter unavailable'
    );

    return {
      allowed: failMode === 'open',
      remaining: 0,
      resetAt: new Date(Date.now() + windowSeconds * 1000),
      degraded: true,
    };
  }
}

/**
 * Login attempts: 5 per IP per 15 minutes.
 * Fails CLOSED — an unavailable limiter must not open the login form.
 */
export async function checkLoginRateLimit(ipAddress: string): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `login:${ipAddress}`,
    limit: 5,
    windowSeconds: 15 * 60,
    failMode: 'closed',
  });
}

/**
 * Password reset: 3 per email per hour.
 * Fails CLOSED — this endpoint sends mail, so an outage would let it be used
 * to flood someone's inbox.
 */
export async function checkPasswordResetRateLimit(email: string): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `pwreset:${email.toLowerCase()}`,
    limit: 3,
    windowSeconds: 60 * 60,
    failMode: 'closed',
  });
}

/**
 * MFA verification: 5 attempts per user per 15 minutes.
 * A 6-digit TOTP with a ±1 step window is brute-forceable in minutes unguarded.
 */
export async function checkMfaRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `mfa:${userId}`,
    limit: 5,
    windowSeconds: 15 * 60,
    failMode: 'closed',
  });
}

/**
 * AI endpoints: 30 requests per user per hour.
 * These cost real money per call, so an outage should not make them free.
 */
export async function checkAiRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `ai:${userId}`,
    limit: 30,
    windowSeconds: 60 * 60,
    failMode: 'closed',
  });
}

/**
 * API key usage: 500 requests per key per minute.
 * Fails OPEN — this is a throughput quota for already-authenticated callers, not
 * an authentication control, so availability wins.
 */
export async function checkApiKeyRateLimit(apiKeyId: string): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `apikey:${apiKeyId}`,
    limit: 500,
    windowSeconds: 60,
    failMode: 'open',
  });
}

/** Clears a counter. Intended for tests and administrative unblocking. */
export async function resetRateLimit(key: string): Promise<void> {
  await db.execute(sql`DELETE FROM rate_limits WHERE key = ${key}`);
}

/**
 * Removes elapsed windows. Safe to call at any time — expired rows are inert,
 * so this only reclaims space. Run periodically once a scheduler exists.
 */
export async function deleteExpiredRateLimits(): Promise<number> {
  const rows = (await db.execute(
    sql`DELETE FROM rate_limits WHERE expires_at <= now() RETURNING key`
  )) as unknown as unknown[];
  const list = Array.isArray(rows) ? rows : ((rows as any)?.rows ?? []);
  return list.length;
}

/** Reports whether the limiter's backing store is reachable. */
export async function getRateLimiterHealth(): Promise<{ available: boolean; error?: string }> {
  try {
    await db.execute(sql`SELECT 1 FROM rate_limits LIMIT 1`);
    return { available: true };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
