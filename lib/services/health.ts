/**
 * Service Health Monitor
 *
 * Purpose: Aggregate health checks for all external services
 * Pattern: Centralized health monitoring with degraded mode detection
 * Services:
 *   - Redis (Upstash)
 *   - USDA API
 *   - Circuit Breaker status
 *   - Rate Limiter status
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: TODO.md Task 16
 */

import { checkRedisHealth, getRedisHealthStatus } from './redis';
import { circuitBreaker, CircuitState } from './circuit-breaker';
import { rateLimiter } from './rate-limiter';
import { usdaClient } from './usda-client';
import { logger } from '@/lib/logger';

/**
 * Health status levels
 */
export enum HealthStatus {
  HEALTHY = 'HEALTHY', // All services operational
  DEGRADED = 'DEGRADED', // Some services down, but core functionality available
  UNHEALTHY = 'UNHEALTHY', // Critical services down
}

/**
 * Individual service health
 */
export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  available: boolean;
  details?: Record<string, any>;
  lastCheck?: Date;
}

/**
 * Overall system health
 */
export interface SystemHealth {
  status: HealthStatus;
  timestamp: Date;
  services: ServiceHealth[];
  degradedMode: boolean;
  metrics: {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
  };
}

/**
 * Service Health Monitor
 * Provides aggregate health status for monitoring and observability
 */
export class HealthMonitor {
  /**
   * Check health of all services
   *
   * @returns System health with individual service statuses
   *
   * @example
   * const health = await healthMonitor.checkHealth();
   * if (health.status === HealthStatus.UNHEALTHY) {
   *   // Alert operations team
   * }
   */
  async checkHealth(): Promise<SystemHealth> {
    const services: ServiceHealth[] = [];

    // Check Redis
    const redisHealth = await this.checkRedis();
    services.push(redisHealth);

    // Check USDA API circuit breaker
    const usdaCircuitHealth = await this.checkUSDACircuitBreaker();
    services.push(usdaCircuitHealth);

    // Check rate limiter
    const rateLimiterHealth = await this.checkRateLimiter();
    services.push(rateLimiterHealth);

    // Check USDA API connectivity (optional - can be expensive)
    // const usdaApiHealth = await this.checkUSDAAPI();
    // services.push(usdaApiHealth);

    // Calculate overall status
    const healthyCount = services.filter((s) => s.status === HealthStatus.HEALTHY).length;
    const degradedCount = services.filter((s) => s.status === HealthStatus.DEGRADED).length;
    const unhealthyCount = services.filter((s) => s.status === HealthStatus.UNHEALTHY).length;

    let overallStatus: HealthStatus;
    if (unhealthyCount === services.length) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (unhealthyCount > 0 || degradedCount > 0) {
      overallStatus = HealthStatus.DEGRADED;
    } else {
      overallStatus = HealthStatus.HEALTHY;
    }

    const degradedMode = overallStatus !== HealthStatus.HEALTHY;

    const systemHealth: SystemHealth = {
      status: overallStatus,
      timestamp: new Date(),
      services,
      degradedMode,
      metrics: {
        totalServices: services.length,
        healthyServices: healthyCount,
        degradedServices: degradedCount,
        unhealthyServices: unhealthyCount,
      },
    };

    logger.info(
      {
        service: 'health-monitor',
        status: overallStatus,
        degradedMode,
        metrics: systemHealth.metrics,
      },
      'System health check completed'
    );

    return systemHealth;
  }

  /**
   * Check Redis health
   */
  private async checkRedis(): Promise<ServiceHealth> {
    const isHealthy = await checkRedisHealth(true); // Force fresh check
    const status = getRedisHealthStatus();

    return {
      name: 'Redis (Upstash)',
      status: isHealthy ? HealthStatus.HEALTHY : status.available ? HealthStatus.DEGRADED : HealthStatus.UNHEALTHY,
      available: status.available,
      details: {
        healthy: status.healthy,
        lastCheck: status.lastCheck,
      },
      lastCheck: status.lastCheck || undefined,
    };
  }

  /**
   * Check USDA API circuit breaker status
   */
  private async checkUSDACircuitBreaker(): Promise<ServiceHealth> {
    try {
      const circuitStatus = await circuitBreaker.getStatus('usda-api');

      let status: HealthStatus;
      if (circuitStatus.state === CircuitState.CLOSED) {
        status = HealthStatus.HEALTHY;
      } else if (circuitStatus.state === CircuitState.HALF_OPEN) {
        status = HealthStatus.DEGRADED;
      } else {
        status = HealthStatus.UNHEALTHY;
      }

      return {
        name: 'USDA API Circuit Breaker',
        status,
        available: circuitStatus.state !== CircuitState.OPEN,
        details: {
          state: circuitStatus.state,
          failures: circuitStatus.failures,
          successes: circuitStatus.successes,
          consecutiveSuccesses: circuitStatus.consecutiveSuccesses,
          lastFailureTime: circuitStatus.lastFailureTime
            ? new Date(circuitStatus.lastFailureTime)
            : null,
          openedAt: circuitStatus.openedAt ? new Date(circuitStatus.openedAt) : null,
        },
      };
    } catch (error) {
      logger.error(
        {
          service: 'health-monitor',
          check: 'circuit-breaker',
          error: error instanceof Error ? error.message : String(error),
        },
        'Error checking circuit breaker health'
      );

      return {
        name: 'USDA API Circuit Breaker',
        status: HealthStatus.UNHEALTHY,
        available: false,
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Check rate limiter status
   */
  private async checkRateLimiter(): Promise<ServiceHealth> {
    try {
      const tokensAvailable = await rateLimiter.check('usda-api');

      // Healthy: >50% tokens available
      // Degraded: 10-50% tokens available
      // Unhealthy: <10% tokens available
      const capacity = 120; // From rate-limiter.ts config
      const percentAvailable = (tokensAvailable / capacity) * 100;

      let status: HealthStatus;
      if (percentAvailable > 50) {
        status = HealthStatus.HEALTHY;
      } else if (percentAvailable >= 10) {
        status = HealthStatus.DEGRADED;
      } else {
        status = HealthStatus.UNHEALTHY;
      }

      return {
        name: 'Rate Limiter (USDA API)',
        status,
        available: true,
        details: {
          tokensAvailable,
          capacity,
          percentAvailable: Math.round(percentAvailable),
        },
      };
    } catch (error) {
      logger.error(
        {
          service: 'health-monitor',
          check: 'rate-limiter',
          error: error instanceof Error ? error.message : String(error),
        },
        'Error checking rate limiter health'
      );

      return {
        name: 'Rate Limiter (USDA API)',
        status: HealthStatus.UNHEALTHY,
        available: false,
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Check USDA API connectivity (expensive - use sparingly)
   * This makes a real API call, so only use in manual health checks
   */
  private async checkUSDAAPI(): Promise<ServiceHealth> {
    try {
      // Simple connectivity test: search for a common food
      const startTime = Date.now();
      await usdaClient.searchFoods('apple', 1, 1);
      const latencyMs = Date.now() - startTime;

      const rateLimitHeaders = usdaClient.getRateLimitHeaders();

      return {
        name: 'USDA API',
        status: HealthStatus.HEALTHY,
        available: true,
        details: {
          latencyMs,
          rateLimitHeaders,
        },
        lastCheck: new Date(),
      };
    } catch (error) {
      logger.error(
        {
          service: 'health-monitor',
          check: 'usda-api',
          error: error instanceof Error ? error.message : String(error),
        },
        'Error checking USDA API health'
      );

      return {
        name: 'USDA API',
        status: HealthStatus.UNHEALTHY,
        available: false,
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Quick health check (no expensive API calls)
   *
   * @returns True if system is operational (HEALTHY or DEGRADED)
   */
  async isOperational(): Promise<boolean> {
    const health = await this.checkHealth();
    return health.status !== HealthStatus.UNHEALTHY;
  }

  /**
   * Check if system is in degraded mode
   *
   * @returns True if degraded mode active
   */
  async isDegraded(): Promise<boolean> {
    const health = await this.checkHealth();
    return health.degradedMode;
  }
}

/**
 * Singleton health monitor instance
 */
export const healthMonitor = new HealthMonitor();
