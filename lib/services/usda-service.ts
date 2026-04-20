/**
 * USDA Service Orchestrator
 *
 * Purpose: High-level service combining USDA client, rate limiter, and circuit breaker
 * Pattern: Service orchestration with automatic retry and request queuing
 * Features:
 *   - Rate limiting with token bucket
 *   - Circuit breaker protection
 *   - Exponential backoff retry
 *   - Request queuing when rate limited
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 850-1000 (Service Integration)
 */

import { usdaClient, USDASearchResponse, USDAFoodDetails, USDANutrient } from './usda-client';
import { rateLimiter, RateLimitError } from './rate-limiter';
import { circuitBreaker, CircuitBreakerOpenError } from './circuit-breaker';
import { logger } from '@/lib/logger';

/**
 * Retry configuration
 */
interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * USDA Service Orchestrator
 * Combines USDA API client with reliability patterns
 */
export class USDAService {
  private retryConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelayMs: 1000, // 1 second
    maxDelayMs: 30000, // 30 seconds
    backoffMultiplier: 2, // Exponential backoff
  };

  /**
   * Search foods with rate limiting and circuit breaker protection
   *
   * @param query - Search query
   * @param pageSize - Results per page (default: 50)
   * @param pageNumber - Page number (default: 1)
   * @returns Search response
   *
   * @example
   * const results = await usdaService.searchFoods('chicken breast');
   */
  async searchFoods(
    query: string,
    pageSize = 50,
    pageNumber = 1
  ): Promise<USDASearchResponse> {
    return await this.executeWithProtection(
      'searchFoods',
      async () => {
        return await usdaClient.searchFoods(query, pageSize, pageNumber);
      },
      { query, pageSize, pageNumber }
    );
  }

  /**
   * Get food details with rate limiting and circuit breaker protection
   *
   * @param fdcId - USDA FoodData Central ID
   * @param format - Response format (default: 'full')
   * @returns Food details
   *
   * @example
   * const food = await usdaService.getFoodDetails(123456);
   */
  async getFoodDetails(
    fdcId: number,
    format: 'abridged' | 'full' = 'full'
  ): Promise<USDAFoodDetails> {
    return await this.executeWithProtection(
      'getFoodDetails',
      async () => {
        return await usdaClient.getFoodDetails(fdcId, format);
      },
      { fdcId, format }
    );
  }

  /**
   * Get nutrients for a food
   *
   * @param fdcId - USDA FoodData Central ID
   * @returns Array of nutrients
   *
   * @example
   * const nutrients = await usdaService.getNutrients(123456);
   */
  async getNutrients(fdcId: number): Promise<USDANutrient[]> {
    return await this.executeWithProtection(
      'getNutrients',
      async () => {
        return await usdaClient.getNutrients(fdcId);
      },
      { fdcId }
    );
  }

  /**
   * Get multiple foods in batch
   *
   * @param fdcIds - Array of USDA FoodData Central IDs
   * @param format - Response format (default: 'full')
   * @returns Array of food details
   *
   * @example
   * const foods = await usdaService.getFoodsBatch([123456, 789012]);
   */
  async getFoodsBatch(
    fdcIds: number[],
    format: 'abridged' | 'full' = 'full'
  ): Promise<USDAFoodDetails[]> {
    return await this.executeWithProtection(
      'getFoodsBatch',
      async () => {
        return await usdaClient.getFoodsBatch(fdcIds, format);
      },
      { fdcIds, count: fdcIds.length, format }
    );
  }

  /**
   * Execute function with rate limiting, circuit breaker, and retry logic
   *
   * @param operation - Operation name for logging
   * @param fn - Async function to execute
   * @param context - Context for logging
   * @returns Result of function execution
   */
  private async executeWithProtection<T>(
    operation: string,
    fn: () => Promise<T>,
    context: Record<string, any>
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        logger.debug(
          {
            service: 'usda-service',
            operation,
            attempt,
            maxAttempts: this.retryConfig.maxAttempts,
            ...context,
          },
          `Executing ${operation} (attempt ${attempt})`
        );

        // Step 1: Check rate limit
        await rateLimiter.consume('usda-api', 1);

        // Step 2: Execute with circuit breaker protection
        const result = await circuitBreaker.execute('usda-api', fn);

        logger.info(
          {
            service: 'usda-service',
            operation,
            attempt,
            ...context,
          },
          `${operation} completed successfully`
        );

        return result;
      } catch (error) {
        lastError = error as Error;

        // Handle different error types
        if (error instanceof RateLimitError) {
          logger.warn(
            {
              service: 'usda-service',
              operation,
              attempt,
              remaining: error.remaining,
              retryAfterSeconds: error.retryAfterSeconds,
              ...context,
            },
            'Rate limit exceeded - waiting for tokens'
          );

          // Wait for tokens to become available
          const tokensAcquired = await rateLimiter.waitForToken(
            'usda-api',
            1,
            error.retryAfterSeconds * 1000
          );

          if (!tokensAcquired) {
            logger.error(
              {
                service: 'usda-service',
                operation,
                attempt,
                ...context,
              },
              'Timeout waiting for rate limit tokens'
            );
            throw error; // Give up on this attempt
          }

          continue; // Retry immediately after acquiring token
        } else if (error instanceof CircuitBreakerOpenError) {
          logger.warn(
            {
              service: 'usda-service',
              operation,
              attempt,
              retryAfterSeconds: error.retryAfterSeconds,
              ...context,
            },
            'Circuit breaker open - waiting before retry'
          );

          if (attempt < this.retryConfig.maxAttempts) {
            await this.sleep(error.retryAfterSeconds * 1000);
            continue; // Retry after circuit timeout
          } else {
            throw error; // No more retries
          }
        } else {
          // Other errors (network, API errors, etc.)
          logger.error(
            {
              service: 'usda-service',
              operation,
              attempt,
              error: error instanceof Error ? error.message : String(error),
              ...context,
            },
            `${operation} failed with error`
          );

          if (attempt < this.retryConfig.maxAttempts) {
            // Exponential backoff
            const delayMs = Math.min(
              this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
              this.retryConfig.maxDelayMs
            );

            logger.debug(
              {
                service: 'usda-service',
                operation,
                attempt,
                delayMs,
              },
              'Retrying with exponential backoff'
            );

            await this.sleep(delayMs);
            continue; // Retry after backoff
          } else {
            throw error; // No more retries
          }
        }
      }
    }

    // All retries exhausted
    logger.error(
      {
        service: 'usda-service',
        operation,
        maxAttempts: this.retryConfig.maxAttempts,
        lastError: lastError?.message,
        ...context,
      },
      `${operation} failed after ${this.retryConfig.maxAttempts} attempts`
    );

    throw lastError || new Error(`${operation} failed after retries`);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Singleton USDA service instance
 */
export const usdaService = new USDAService();
