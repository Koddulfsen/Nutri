/**
 * Token Bucket Rate Limiter
 *
 * Purpose: Atomic rate limiting using Redis Lua script for USDA API
 * Pattern: Token bucket algorithm with automatic refill
 * Service: Upstash Redis with Lua script execution
 * Limit: 900 req/hr (80% safety margin on 1,000/hr USDA limit)
 * Burst: 120 tokens (allow short bursts)
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 550-700 (Rate Limiting Strategy)
 */

import { redis } from './redis';
import { logger } from '@/lib/logger';

/**
 * Token bucket configuration
 */
interface TokenBucketConfig {
  capacity: number; // Max tokens (burst capacity)
  refillRate: number; // Tokens per second
  keyPrefix: string; // Redis key prefix
}

/**
 * Rate limit error with retry information
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public remaining: number,
    public retryAfterSeconds: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Token Bucket Rate Limiter
 * Implements atomic token bucket algorithm using Redis Lua script
 */
export class TokenBucketRateLimiter {
  private configs: Map<string, TokenBucketConfig> = new Map();

  constructor() {
    // USDA API rate limit: 900 req/hr (80% of 1,000 limit for safety margin)
    // Burst capacity: 120 tokens (allows short bursts without hitting limit)
    this.configs.set('usda-api', {
      capacity: 120,
      refillRate: 0.25, // 900 tokens/hr = 15 tokens/min = 0.25 tokens/sec
      keyPrefix: 'rate-limit:usda-api',
    });

    logger.info(
      {
        service: 'rate-limiter',
        configs: Array.from(this.configs.entries()).map(([key, config]) => ({
          service: key,
          capacity: config.capacity,
          refillRate: config.refillRate,
          effectiveRatePerHour: config.refillRate * 3600,
        })),
      },
      'Token bucket rate limiter initialized'
    );
  }

  /**
   * Consume tokens from the bucket
   * Uses Redis Lua script for atomic check-and-decrement
   *
   * @param service - Service identifier (e.g., 'usda-api')
   * @param tokens - Number of tokens to consume (default: 1)
   * @throws RateLimitError if insufficient tokens available
   *
   * @example
   * await rateLimiter.consume('usda-api', 1);
   */
  async consume(service: string, tokens = 1): Promise<void> {
    const config = this.configs.get(service);
    if (!config) {
      throw new Error(`Rate limit config not found for service: ${service}`);
    }

    // Graceful degradation if Redis unavailable
    if (!redis) {
      logger.warn(
        { service: 'rate-limiter', target: service },
        'Redis unavailable - rate limiting disabled (fail open)'
      );
      return;
    }

    const key = `${config.keyPrefix}:bucket`;
    const now = Date.now();

    try {
      // Execute Lua script for atomic token bucket operation
      const luaScript = `
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])
        local requested = tonumber(ARGV[3])
        local now = tonumber(ARGV[4])

        -- Get current bucket state (tokens, last_refill_time)
        local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
        local tokens = tonumber(bucket[1]) or capacity
        local last_refill = tonumber(bucket[2]) or now

        -- Calculate elapsed time and tokens to add
        local elapsed = (now - last_refill) / 1000  -- Convert to seconds
        local tokens_to_add = elapsed * refill_rate
        tokens = math.min(capacity, tokens + tokens_to_add)

        -- Check if enough tokens available
        if tokens >= requested then
          tokens = tokens - requested
          redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
          redis.call('EXPIRE', key, 3600)  -- 1 hour TTL
          return {1, math.floor(tokens)}  -- [allowed=1, remaining]
        else
          redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
          redis.call('EXPIRE', key, 3600)
          return {0, math.floor(tokens)}  -- [allowed=0, remaining]
        end
      `;

      const result = (await redis.eval(
        luaScript,
        [key],
        [
          config.capacity.toString(),
          config.refillRate.toString(),
          tokens.toString(),
          now.toString(),
        ]
      )) as [number, number];

      const [allowed, remaining] = result;

      if (!allowed) {
        const retryAfterSeconds = Math.ceil((tokens - remaining) / config.refillRate);

        logger.warn(
          {
            service: 'rate-limiter',
            target: service,
            tokensRequested: tokens,
            tokensRemaining: remaining,
            retryAfterSeconds,
          },
          'Rate limit exceeded'
        );

        throw new RateLimitError(
          `Rate limit exceeded for ${service}. Retry after ${retryAfterSeconds} seconds.`,
          remaining,
          retryAfterSeconds
        );
      }

      logger.debug(
        {
          service: 'rate-limiter',
          target: service,
          tokensConsumed: tokens,
          tokensRemaining: remaining,
        },
        'Tokens consumed successfully'
      );
    } catch (error) {
      // If it's already a RateLimitError, re-throw it
      if (error instanceof RateLimitError) {
        throw error;
      }

      // For other Redis errors, fail open (allow request)
      logger.error(
        {
          service: 'rate-limiter',
          target: service,
          error: error instanceof Error ? error.message : String(error),
        },
        'Redis error in rate limiter - failing open'
      );
    }
  }

  /**
   * Wait for tokens to become available
   * Polls token bucket until tokens are available or timeout
   *
   * @param service - Service identifier
   * @param tokens - Number of tokens needed
   * @param maxWaitMs - Maximum wait time in milliseconds (default: 60000 = 1 minute)
   * @returns True if tokens acquired, false if timeout
   *
   * @example
   * const acquired = await rateLimiter.waitForToken('usda-api', 1, 30000);
   * if (!acquired) {
   *   throw new Error('Timeout waiting for rate limit tokens');
   * }
   */
  async waitForToken(
    service: string,
    tokens = 1,
    maxWaitMs = 60000
  ): Promise<boolean> {
    const startTime = Date.now();
    const pollInterval = 1000; // Check every 1 second

    while (Date.now() - startTime < maxWaitMs) {
      try {
        await this.consume(service, tokens);
        return true; // Tokens acquired
      } catch (error) {
        if (error instanceof RateLimitError) {
          // Wait before retrying
          const waitTime = Math.min(pollInterval, error.retryAfterSeconds * 1000);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        // Other errors should be thrown
        throw error;
      }
    }

    logger.warn(
      {
        service: 'rate-limiter',
        target: service,
        tokensRequested: tokens,
        waitedMs: Date.now() - startTime,
      },
      'Timeout waiting for rate limit tokens'
    );

    return false; // Timeout
  }

  /**
   * Check available tokens without consuming
   *
   * @param service - Service identifier
   * @returns Number of tokens available
   *
   * @example
   * const available = await rateLimiter.check('usda-api');
   * console.log(`${available} tokens available`);
   */
  async check(service: string): Promise<number> {
    const config = this.configs.get(service);
    if (!config) {
      throw new Error(`Rate limit config not found for service: ${service}`);
    }

    if (!redis) {
      return config.capacity; // Return max if Redis unavailable
    }

    const key = `${config.keyPrefix}:bucket`;
    const now = Date.now();

    try {
      const luaScript = `
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])

        local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
        local tokens = tonumber(bucket[1]) or capacity
        local last_refill = tonumber(bucket[2]) or now

        local elapsed = (now - last_refill) / 1000
        local tokens_to_add = elapsed * refill_rate
        tokens = math.min(capacity, tokens + tokens_to_add)

        return math.floor(tokens)
      `;

      const remaining = (await redis.eval(
        luaScript,
        [key],
        [config.capacity.toString(), config.refillRate.toString(), now.toString()]
      )) as number;

      return remaining;
    } catch (error) {
      logger.error(
        {
          service: 'rate-limiter',
          target: service,
          error: error instanceof Error ? error.message : String(error),
        },
        'Error checking rate limit'
      );
      return config.capacity; // Fail open
    }
  }
}

/**
 * Singleton rate limiter instance
 */
export const rateLimiter = new TokenBucketRateLimiter();

/**
 * Helper function to get rate limiter status for health monitoring
 * @param service Service identifier (default: 'usda-api')
 */
export async function getRateLimiterStatus(service: string = 'usda-api') {
  const config = rateLimiter['configs'].get(service) ?? {
    capacity: 900,
    refillRate: 900 / 3600,
    keyPrefix: `rate-limit:${service}`,
  };

  const tokensRemaining = await rateLimiter.check(service);
  const resetAt = Date.now() + ((config.capacity - tokensRemaining) / config.refillRate) * 1000;

  return {
    tokensRemaining,
    limit: config.capacity,
    resetAt,
  };
}
