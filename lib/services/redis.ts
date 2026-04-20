/**
 * Redis Connection Module
 *
 * Purpose: Upstash Redis client with connection pooling and graceful degradation
 * Pattern: Singleton with lazy initialization and health checks
 * Service: Upstash Redis REST API
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 450-550 (Redis Configuration)
 */

import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

let redisClient: Redis | null = null;
let isHealthy = false;
let lastHealthCheck: number = 0;
const HEALTH_CHECK_INTERVAL = 60000; // 1 minute
const REDIS_TIMEOUT_MS = 420; // Skip Redis if it doesn't respond in 420ms

/**
 * Get or create Redis client instance
 * Lazy initialization with graceful degradation if Redis unavailable
 *
 * @returns Redis client instance or null if unavailable
 */
export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    logger.warn(
      { service: 'redis', url: !!url, token: !!token },
      'Redis not configured - services will degrade gracefully'
    );
    return null;
  }

  try {
    // Custom fetch with timeout - if Redis doesn't respond in 420ms, skip it
    const fetchWithTimeout: typeof fetch = (input, init) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REDIS_TIMEOUT_MS);

      return fetch(input, {
        ...init,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    };

    redisClient = new Redis({
      url,
      token,
      retry: { retries: 0, backoff: () => 0 }, // No retries - fail fast
      automaticDeserialization: true,
      ...({ fetch: fetchWithTimeout } as any),
    });

    logger.info({ service: 'redis', url, timeoutMs: REDIS_TIMEOUT_MS }, 'Redis client initialized with timeout');
    return redisClient;
  } catch (error) {
    logger.error(
      { service: 'redis', error: error instanceof Error ? error.message : String(error) },
      'Failed to initialize Redis client'
    );
    return null;
  }
}

/**
 * Health check for Redis connection
 * Tests connectivity with PING command
 *
 * @param forceCheck - Force health check even if recently checked
 * @returns True if Redis is healthy and responding
 */
export async function checkRedisHealth(forceCheck = false): Promise<boolean> {
  const now = Date.now();

  // Return cached result if checked recently (within 1 minute)
  if (!forceCheck && now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return isHealthy;
  }

  const client = getRedisClient();

  if (!client) {
    isHealthy = false;
    lastHealthCheck = now;
    return false;
  }

  try {
    const result = await client.ping();
    isHealthy = result === 'PONG';
    lastHealthCheck = now;

    if (isHealthy) {
      logger.debug({ service: 'redis' }, 'Redis health check passed');
    } else {
      logger.warn({ service: 'redis', result }, 'Redis health check failed - unexpected response');
    }

    return isHealthy;
  } catch (error) {
    isHealthy = false;
    lastHealthCheck = now;

    logger.error(
      { service: 'redis', error: error instanceof Error ? error.message : String(error) },
      'Redis health check failed with error'
    );

    return false;
  }
}

/**
 * Get Redis health status
 *
 * @returns Object with health status and last check time
 */
export function getRedisHealthStatus(): {
  healthy: boolean;
  lastCheck: Date | null;
  available: boolean;
} {
  return {
    healthy: isHealthy,
    lastCheck: lastHealthCheck > 0 ? new Date(lastHealthCheck) : null,
    available: redisClient !== null,
  };
}

/**
 * Singleton Redis client instance
 * Use this for direct Redis operations
 */
export const redis = getRedisClient();
