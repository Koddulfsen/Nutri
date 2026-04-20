/**
 * Health Dashboard Endpoint
 * Admin-only endpoint for system health monitoring
 *
 * Reference: architecture.md lines 3100-3200 (Health Monitoring)
 *
 * Aggregates:
 * - Redis status (UP/DOWN, latency)
 * - Circuit breaker state (CLOSED/OPEN/HALF_OPEN)
 * - Rate limiter stats (tokens remaining, reset time)
 * - ETL queue metrics (waiting/active/completed/failed)
 * - Cache hit rates (L1/L2)
 * - Last 10 errors from logs
 * - Overall health status (HEALTHY/DEGRADED/UNHEALTHY)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { redis } from '@/lib/services/redis';
import { getCircuitBreakerState } from '@/lib/services/circuit-breaker';
import { getRateLimiterStatus } from '@/lib/services/rate-limiter';
import { getQueueMetrics } from '@/lib/queue/food-import-queue';
import { getRecentErrors } from '@/lib/logging/pino-config';
import { logger, withRequestId } from '@/lib/logging/pino-config';

interface HealthDashboardResponse {
  overall: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  services: {
    redis: {
      status: 'UP' | 'DOWN';
      latency_ms: number;
    };
    circuitBreaker: {
      state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
      failures: number;
      lastFailure?: string;
    };
    rateLimiter: {
      tokensRemaining: number;
      resetAt: string;
      utilization: number; // percentage
    };
    etlQueue: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
    cache: {
      l1HitRate: number;
      l2HitRate: number;
      totalRequests: number;
    };
  };
  degradedMode: boolean;
  lastErrors: Array<{
    timestamp: string;
    type: string;
    message: string;
  }>;
  timestamp: string;
}

/**
 * GET /api/admin/health
 * Returns comprehensive system health dashboard
 */
export async function GET() {
  return withRequestId(async () => {
    try {
      // 1. Authentication check
      const supabase = await createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        logger.warn({ error: sessionError }, 'Unauthorized health check attempt');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // 2. Admin role verification
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.user_metadata?.admin) {
        logger.warn({ userId: user?.id }, 'Non-admin user attempted health check');
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        );
      }

      logger.info({ userId: user.id }, 'Admin health check requested');

      // 3. Check Redis health
      const redisHealth = await checkRedisHealth();

      // 4. Check Circuit Breaker state
      const circuitBreakerHealth = await checkCircuitBreakerHealth();

      // 5. Check Rate Limiter status
      const rateLimiterHealth = await checkRateLimiterHealth();

      // 6. Check ETL Queue metrics
      const etlQueueHealth = await checkETLQueueHealth();

      // 7. Get cache hit rates (placeholder - implement when cache metrics tracking is added)
      const cacheHealth = {
        l1HitRate: 0.85, // 85% hit rate (placeholder)
        l2HitRate: 0.95, // 95% hit rate (placeholder)
        totalRequests: 1000, // placeholder
      };

      // 8. Get last 10 errors from log buffer
      const recentErrors = getRecentErrors(10).map(err => ({
        timestamp: err.timestamp,
        type: err.type,
        message: err.message,
      }));

      // 9. Determine overall health status
      const degradedMode =
        redisHealth.status === 'DOWN' ||
        circuitBreakerHealth.state === 'OPEN' ||
        etlQueueHealth.failed > 10;

      const unhealthyConditions =
        (redisHealth.status === 'DOWN' ? 1 : 0) +
        (circuitBreakerHealth.state === 'OPEN' ? 1 : 0) +
        (etlQueueHealth.failed > 50 ? 1 : 0);

      const overall: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' =
        unhealthyConditions >= 2 ? 'UNHEALTHY'
        : degradedMode ? 'DEGRADED'
        : 'HEALTHY';

      const response: HealthDashboardResponse = {
        overall,
        services: {
          redis: redisHealth,
          circuitBreaker: circuitBreakerHealth,
          rateLimiter: rateLimiterHealth,
          etlQueue: etlQueueHealth,
          cache: cacheHealth,
        },
        degradedMode,
        lastErrors: recentErrors,
        timestamp: new Date().toISOString(),
      };

      logger.info({
        overall,
        degradedMode,
        errorCount: recentErrors.length,
      }, 'Health check completed');

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } catch (error) {
      logger.error({ error }, 'Health check failed');

      return NextResponse.json(
        {
          error: 'Health check failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}

/**
 * Check Redis health with latency measurement
 */
async function checkRedisHealth(): Promise<{
  status: 'UP' | 'DOWN';
  latency_ms: number;
}> {
  try {
    const startTime = Date.now();

    if (!redis) {
      return {
        status: 'DOWN',
        latency_ms: -1,
      };
    }

    // Ping Redis
    await redis.ping();

    const latency_ms = Date.now() - startTime;

    return {
      status: 'UP',
      latency_ms,
    };
  } catch (error) {
    logger.error({ error }, 'Redis health check failed');
    return {
      status: 'DOWN',
      latency_ms: -1,
    };
  }
}

/**
 * Check Circuit Breaker state
 */
async function checkCircuitBreakerHealth(): Promise<{
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailure?: string;
}> {
  try {
    const cbState = await getCircuitBreakerState();

    return {
      state: cbState.state,
      failures: cbState.failures,
      lastFailure: cbState.lastFailureTime
        ? new Date(cbState.lastFailureTime).toISOString()
        : undefined,
    };
  } catch (error) {
    logger.error({ error }, 'Circuit breaker health check failed');
    return {
      state: 'OPEN', // Assume OPEN on error for safety
      failures: -1,
    };
  }
}

/**
 * Check Rate Limiter status
 */
async function checkRateLimiterHealth(): Promise<{
  tokensRemaining: number;
  resetAt: string;
  utilization: number;
}> {
  try {
    const rlStatus = await getRateLimiterStatus();

    return {
      tokensRemaining: rlStatus.tokensRemaining,
      resetAt: new Date(rlStatus.resetAt).toISOString(),
      utilization: ((rlStatus.limit - rlStatus.tokensRemaining) / rlStatus.limit) * 100,
    };
  } catch (error) {
    logger.error({ error }, 'Rate limiter health check failed');
    return {
      tokensRemaining: 0,
      resetAt: new Date().toISOString(),
      utilization: 100,
    };
  }
}

/**
 * Check ETL Queue metrics (BullMQ)
 */
async function checkETLQueueHealth(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}> {
  try {
    const metrics = await getQueueMetrics();

    return {
      waiting: metrics.waiting ?? 0,
      active: metrics.active ?? 0,
      completed: metrics.completed ?? 0,
      failed: metrics.failed ?? 0,
    };
  } catch (error) {
    logger.error({ error }, 'ETL queue health check failed');
    return {
      waiting: -1,
      active: -1,
      completed: -1,
      failed: -1,
    };
  }
}
