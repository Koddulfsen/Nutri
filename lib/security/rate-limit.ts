// Rate Limiting - FS-4 Security & Compliance System
// Created: 2025-11-10
// Purpose: Upstash Redis-based rate limiting for API endpoints
// TEMPORARILY DISABLED: Causing "Invalid API key" error during module load
// TODO Phase 2: Re-enable when actually needed for API routes

// ENTIRE FILE COMMENTED OUT TO PREVENT MODULE-SCOPE REDIS INITIALIZATION
// The module-scope `const redis = new Redis({...})` was causing "Invalid API key"
// error because it runs at import time before environment variables are ready.
// Will re-enable in Phase 2 with lazy initialization pattern.

/*
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const rateLimiters = {
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '10 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),

  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '15 m'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),

  compliance: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '24 h'),
    analytics: true,
    prefix: 'ratelimit:compliance',
  }),

  apiKey: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(500, '1 m'),
    analytics: true,
    prefix: 'ratelimit:apikey',
  }),
};

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<RateLimitResult> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    const waitMinutes = Math.ceil((reset - Date.now()) / 1000 / 60);
    throw new Error(
      `Rate limit exceeded. Try again in ${waitMinutes} minute${waitMinutes !== 1 ? 's' : ''}.`
    );
  }

  return { success, remaining, limit, reset };
}

export async function checkRateLimitSoft(
  identifier: string,
  limiter: Ratelimit
): Promise<RateLimitResult> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  return { success, remaining, limit, reset };
}

export async function getRateLimitStatus(
  identifier: string,
  prefix: string
): Promise<{ remaining: number; limit: number } | null> {
  try {
    const key = `${prefix}:${identifier}`;
    const count = await redis.get<number>(key);

    const limits: Record<string, number> = {
      'ratelimit:api': 100,
      'ratelimit:auth': 10,
      'ratelimit:compliance': 3,
      'ratelimit:apikey': 500,
    };

    const limit = limits[prefix] || 100;
    const remaining = Math.max(0, limit - (count || 0));

    return { remaining, limit };
  } catch (error) {
    console.error('❌ Failed to get rate limit status:', error);
    return null;
  }
}

export async function resetRateLimit(
  identifier: string,
  prefix: string
): Promise<void> {
  try {
    const key = `${prefix}:${identifier}`;
    await redis.del(key);
  } catch (error) {
    console.error('❌ Failed to reset rate limit:', error);
    throw new Error('Failed to reset rate limit');
  }
}
*/
