/**
 * Circuit Breaker State Machine
 *
 * Purpose: Prevent cascading failures when USDA API is degraded
 * Pattern: 3-state machine (CLOSED/OPEN/HALF_OPEN) with Redis persistence
 * Transitions:
 *   - CLOSED → OPEN: 5 failures in 60s window
 *   - OPEN → HALF_OPEN: After 30s timeout
 *   - HALF_OPEN → CLOSED: 3 consecutive successes
 *   - HALF_OPEN → OPEN: Any failure
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 700-850 (Circuit Breaker Pattern)
 */

import { redis } from './redis';
import { logger } from '@/lib/logger';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Rejecting all requests
  HALF_OPEN = 'HALF_OPEN', // Testing recovery
}

/**
 * Circuit breaker configuration
 */
interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures to trigger OPEN (default: 5)
  successThreshold: number; // Successes needed to close from HALF_OPEN (default: 3)
  timeout: number; // Milliseconds to wait before HALF_OPEN (default: 30000 = 30s)
  windowSize: number; // Sliding window size in seconds (default: 60)
}

/**
 * Circuit breaker metrics
 */
interface CircuitBreakerMetrics {
  state: CircuitState;
  failures: number;
  successes: number;
  consecutiveSuccesses: number;
  lastFailureTime: number | null;
  openedAt: number | null;
}

/**
 * Circuit breaker open error
 */
export class CircuitBreakerOpenError extends Error {
  constructor(message: string, public retryAfterSeconds: number) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * Circuit Breaker
 * Implements 3-state machine with Redis-backed persistence
 */
export class CircuitBreaker {
  private configs: Map<string, CircuitBreakerConfig> = new Map();

  constructor() {
    // USDA API circuit breaker: 5 failures → OPEN, 30s timeout, 3 successes → CLOSED
    this.configs.set('usda-api', {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 30000, // 30 seconds
      windowSize: 60, // 60 seconds
    });

    logger.info(
      {
        service: 'circuit-breaker',
        configs: Array.from(this.configs.entries()).map(([key, config]) => ({
          service: key,
          ...config,
        })),
      },
      'Circuit breaker initialized'
    );
  }

  /**
   * Execute function with circuit breaker protection
   *
   * @param service - Service identifier (e.g., 'usda-api')
   * @param fn - Async function to execute
   * @returns Result of function execution
   * @throws CircuitBreakerOpenError if circuit is OPEN
   *
   * @example
   * const result = await circuitBreaker.execute('usda-api', async () => {
   *   return await usdaClient.searchFoods('apple');
   * });
   */
  async execute<T>(service: string, fn: () => Promise<T>): Promise<T> {
    const config = this.configs.get(service);
    if (!config) {
      throw new Error(`Circuit breaker config not found for service: ${service}`);
    }

    // Graceful degradation if Redis unavailable (fail closed - allow requests)
    if (!redis) {
      logger.warn(
        { service: 'circuit-breaker', target: service },
        'Redis unavailable - circuit breaker disabled'
      );
      return await fn();
    }

    const metrics = await this.getMetrics(service);

    // Check circuit state
    if (metrics.state === CircuitState.OPEN) {
      const now = Date.now();
      const openedAt = metrics.openedAt || 0;
      const elapsedMs = now - openedAt;

      if (elapsedMs >= config.timeout) {
        // Transition to HALF_OPEN (test recovery)
        await this.transitionTo(service, CircuitState.HALF_OPEN);
        logger.info(
          { service: 'circuit-breaker', target: service, elapsedMs },
          'Circuit breaker transitioning to HALF_OPEN for testing'
        );
      } else {
        const retryAfterSeconds = Math.ceil((config.timeout - elapsedMs) / 1000);
        throw new CircuitBreakerOpenError(
          `Circuit breaker OPEN for ${service}. Retry in ${retryAfterSeconds}s`,
          retryAfterSeconds
        );
      }
    }

    // Execute request with error handling
    try {
      const result = await fn();
      await this.recordSuccess(service);
      return result;
    } catch (error) {
      await this.recordFailure(service);
      throw error;
    }
  }

  /**
   * Get current circuit metrics from Redis
   */
  private async getMetrics(service: string): Promise<CircuitBreakerMetrics> {
    const key = `circuit-breaker:${service}`;

    try {
      const data = await redis!.hgetall(key);

      // Handle null or empty data
      if (!data || Object.keys(data).length === 0) {
        return {
          state: CircuitState.CLOSED,
          failures: 0,
          successes: 0,
          consecutiveSuccesses: 0,
          lastFailureTime: null,
          openedAt: null,
        };
      }

      return {
        state: (data.state as CircuitState) || CircuitState.CLOSED,
        failures: parseInt((data.failures as string) || '0', 10),
        successes: parseInt((data.successes as string) || '0', 10),
        consecutiveSuccesses: parseInt((data.consecutiveSuccesses as string) || '0', 10),
        lastFailureTime: data.lastFailureTime
          ? parseInt(data.lastFailureTime as string, 10)
          : null,
        openedAt: data.openedAt ? parseInt(data.openedAt as string, 10) : null,
      };
    } catch (error) {
      logger.error(
        {
          service: 'circuit-breaker',
          target: service,
          error: error instanceof Error ? error.message : String(error),
        },
        'Error getting circuit metrics - returning default CLOSED state'
      );
      return {
        state: CircuitState.CLOSED,
        failures: 0,
        successes: 0,
        consecutiveSuccesses: 0,
        lastFailureTime: null,
        openedAt: null,
      };
    }
  }

  /**
   * Record successful request
   */
  private async recordSuccess(service: string): Promise<void> {
    const config = this.configs.get(service)!;
    const key = `circuit-breaker:${service}`;
    const metrics = await this.getMetrics(service);

    try {
      if (metrics.state === CircuitState.HALF_OPEN) {
        // Increment consecutive successes in HALF_OPEN state
        const consecutiveSuccesses = metrics.consecutiveSuccesses + 1;

        await redis!.hset(key, { consecutiveSuccesses });

        if (consecutiveSuccesses >= config.successThreshold) {
          // Transition to CLOSED - recovery successful
          await this.transitionTo(service, CircuitState.CLOSED);
          await redis!.del(key); // Reset all metrics
          logger.info(
            {
              service: 'circuit-breaker',
              target: service,
              consecutiveSuccesses,
            },
            'Circuit breaker recovered - transitioning to CLOSED'
          );
        } else {
          logger.debug(
            {
              service: 'circuit-breaker',
              target: service,
              consecutiveSuccesses,
              threshold: config.successThreshold,
            },
            'Circuit breaker HALF_OPEN - tracking recovery progress'
          );
        }
      } else {
        // Increment total successes in CLOSED state
        await redis!.hincrby(key, 'successes', 1);
        await redis!.expire(key, config.windowSize * 2); // Keep metrics for 2x window
      }
    } catch (error) {
      logger.error(
        {
          service: 'circuit-breaker',
          target: service,
          error: error instanceof Error ? error.message : String(error),
        },
        'Error recording success'
      );
    }
  }

  /**
   * Record failed request
   */
  private async recordFailure(service: string): Promise<void> {
    const config = this.configs.get(service)!;
    const key = `circuit-breaker:${service}`;
    const now = Date.now();
    const metrics = await this.getMetrics(service);

    try {
      // Increment failures
      await redis!.hincrby(key, 'failures', 1);
      await redis!.hset(key, { lastFailureTime: now });

      const updatedMetrics = await this.getMetrics(service);

      if (metrics.state === CircuitState.HALF_OPEN) {
        // Any failure in HALF_OPEN → back to OPEN
        await this.transitionTo(service, CircuitState.OPEN);
        await redis!.hset(key, { openedAt: now, consecutiveSuccesses: 0 });

        logger.warn(
          { service: 'circuit-breaker', target: service },
          'Circuit breaker HALF_OPEN test failed - back to OPEN'
        );
      } else if (metrics.state === CircuitState.CLOSED) {
        // Check if failure threshold exceeded
        const windowStartTime = now - config.windowSize * 1000;
        const recentFailuresInWindow = metrics.lastFailureTime
          ? metrics.lastFailureTime >= windowStartTime
            ? updatedMetrics.failures
            : 1
          : updatedMetrics.failures;

        if (recentFailuresInWindow >= config.failureThreshold) {
          // Transition to OPEN
          await this.transitionTo(service, CircuitState.OPEN);
          await redis!.hset(key, { openedAt: now });

          logger.warn(
            {
              service: 'circuit-breaker',
              target: service,
              failures: recentFailuresInWindow,
              threshold: config.failureThreshold,
            },
            'Circuit breaker threshold exceeded - transitioning to OPEN'
          );
        }
      }

      await redis!.expire(key, config.windowSize * 2);
    } catch (error) {
      logger.error(
        {
          service: 'circuit-breaker',
          target: service,
          error: error instanceof Error ? error.message : String(error),
        },
        'Error recording failure'
      );
    }
  }

  /**
   * Transition circuit to new state
   */
  private async transitionTo(service: string, state: CircuitState): Promise<void> {
    const key = `circuit-breaker:${service}`;

    try {
      await redis!.hset(key, { state });
      logger.info(
        { service: 'circuit-breaker', target: service, state },
        `Circuit breaker transitioned to ${state}`
      );
    } catch (error) {
      logger.error(
        {
          service: 'circuit-breaker',
          target: service,
          state,
          error: error instanceof Error ? error.message : String(error),
        },
        'Error transitioning circuit state'
      );
    }
  }

  /**
   * Manually reset circuit (admin operation)
   *
   * @param service - Service identifier
   *
   * @example
   * await circuitBreaker.reset('usda-api');
   */
  async reset(service: string): Promise<void> {
    const key = `circuit-breaker:${service}`;

    if (!redis) {
      logger.warn(
        { service: 'circuit-breaker', target: service },
        'Redis unavailable - cannot reset circuit'
      );
      return;
    }

    try {
      await redis.del(key);
      logger.info(
        { service: 'circuit-breaker', target: service },
        'Circuit breaker manually reset to CLOSED'
      );
    } catch (error) {
      logger.error(
        {
          service: 'circuit-breaker',
          target: service,
          error: error instanceof Error ? error.message : String(error),
        },
        'Error resetting circuit breaker'
      );
    }
  }

  /**
   * Get current circuit status for monitoring
   *
   * @param service - Service identifier
   * @returns Current metrics
   */
  async getStatus(service: string): Promise<CircuitBreakerMetrics> {
    return await this.getMetrics(service);
  }
}

/**
 * Singleton circuit breaker instance
 */
export const circuitBreaker = new CircuitBreaker();

/**
 * Helper function to get circuit breaker state for health monitoring
 * @param service Service identifier (default: 'usda-api')
 */
export async function getCircuitBreakerState(service: string = 'usda-api') {
  return await circuitBreaker.getStatus(service);
}
