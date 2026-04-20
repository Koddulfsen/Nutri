/**
 * Pino Logger Configuration
 * Structured logging with request ID correlation and log rotation
 *
 * Reference: architecture.md lines 2950-3050 (Logging Strategy)
 * Library Reference: /home/kodd/VibeWiz/references/library-bank/pino-logger/
 *
 * CRITICAL: Use object-first signature: logger.info({ data }, 'message')
 * NOT string-first: logger.info('message', data) ← WRONG
 */

import pino from 'pino';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Async local storage for request ID correlation
 * Allows all logs within a request to share the same request ID
 */
export const requestContext = new AsyncLocalStorage<{ requestId: string }>();

/**
 * Log levels:
 * - fatal: 60
 * - error: 50
 * - warn: 40
 * - info: 30
 * - debug: 20
 * - trace: 10
 */
const LOG_LEVEL = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

/**
 * Pino logger instance
 *
 * Configuration:
 * - Development: Pretty-printed logs with colors
 * - Production: Structured JSON logs to stdout (Vercel captures)
 * - Request ID: Automatically added from async local storage
 * - Log rotation: 90-day retention (handled by Vercel log retention)
 */
export const logger = pino({
  level: LOG_LEVEL,

  // Production: JSON logs, Development: Pretty logs
  ...(process.env.NODE_ENV === 'production'
    ? {
        // Production configuration
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
      }
    : {
        // Development configuration with pretty printing
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        },
      }),

  // Base fields included in every log entry
  base: {
    env: process.env.NODE_ENV ?? 'development',
  },

  // Timestamp in ISO format
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,

  // Mixin: Add request ID from async local storage to every log
  mixin() {
    const context = requestContext.getStore();
    if (context?.requestId) {
      return { requestId: context.requestId };
    }
    return {};
  },
});

/**
 * Create child logger with additional context
 *
 * Example:
 * const etlLogger = createLogger({ service: 'etl-pipeline' });
 * etlLogger.info({ fdcId: 123 }, 'Starting food import');
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Generate unique request ID for correlation
 * Format: {timestamp}-{randomHex}
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
}

/**
 * Log ETL pipeline stages with structured data
 *
 * Usage:
 * logETLStage('extract', 'success', { fdcId: 123, duration: 450 });
 */
export function logETLStage(
  stage: 'extract' | 'transform' | 'load' | 'validate',
  status: 'start' | 'success' | 'error',
  data: Record<string, any>
) {
  const logData = {
    etl: {
      stage,
      status,
      ...data,
    },
  };

  if (status === 'error') {
    logger.error(logData, `ETL ${stage} failed`);
  } else if (status === 'success') {
    logger.info(logData, `ETL ${stage} completed`);
  } else {
    logger.info(logData, `ETL ${stage} started`);
  }
}

/**
 * Log API request with performance metrics
 *
 * Usage:
 * logAPIRequest('GET', '/api/foods/123', 200, 145, { cacheHit: true });
 */
export function logAPIRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  additionalData?: Record<string, any>
) {
  logger.info(
    {
      api: {
        method,
        path,
        statusCode,
        durationMs,
        ...additionalData,
      },
    },
    `${method} ${path} ${statusCode} ${durationMs}ms`
  );
}

/**
 * Log cache operation with hit/miss status
 *
 * Usage:
 * logCacheOperation('L1', 'hit', 'food:123', 5);
 */
export function logCacheOperation(
  layer: 'L1' | 'L2' | 'L3' | 'L4',
  status: 'hit' | 'miss' | 'set' | 'invalidate',
  key: string,
  durationMs?: number
) {
  logger.debug(
    {
      cache: {
        layer,
        status,
        key,
        durationMs,
      },
    },
    `Cache ${status} on ${layer}: ${key}`
  );
}

/**
 * Log rate limiter operation
 *
 * Usage:
 * logRateLimiter('allowed', 892, 1000);
 * logRateLimiter('rejected', 0, 1000);
 */
export function logRateLimiter(
  status: 'allowed' | 'rejected',
  remaining: number,
  limit: number
) {
  const logData = {
    rateLimiter: {
      status,
      remaining,
      limit,
      utilization: ((limit - remaining) / limit * 100).toFixed(1) + '%',
    },
  };

  if (status === 'rejected') {
    logger.warn(logData, 'Rate limit exceeded');
  } else {
    logger.debug(logData, 'Rate limit check passed');
  }
}

/**
 * Log circuit breaker state transition
 *
 * Usage:
 * logCircuitBreaker('CLOSED', 'OPEN', 5, 'Too many failures');
 */
export function logCircuitBreaker(
  fromState: 'CLOSED' | 'OPEN' | 'HALF_OPEN',
  toState: 'CLOSED' | 'OPEN' | 'HALF_OPEN',
  failures: number,
  reason?: string
) {
  logger.warn(
    {
      circuitBreaker: {
        fromState,
        toState,
        failures,
        reason,
      },
    },
    `Circuit breaker transition: ${fromState} → ${toState}`
  );
}

/**
 * In-memory error buffer for admin error analytics endpoint
 * Stores last 100 errors with full context
 */
const errorBuffer: Array<{
  timestamp: string;
  type: string;
  message: string;
  stack?: string;
  context: Record<string, any>;
}> = [];

const MAX_ERROR_BUFFER_SIZE = 100;

/**
 * Log error with full stack trace and context
 * Automatically adds to error buffer for admin analytics
 *
 * Usage:
 * logError(error, 'ETL Pipeline', { fdcId: 123, stage: 'transform' });
 */
export function logError(
  error: Error,
  source: string,
  context?: Record<string, any>
) {
  const errorData = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      source,
      ...context,
    },
  };

  logger.error(errorData, `Error in ${source}: ${error.message}`);

  // Add to error buffer for admin analytics
  errorBuffer.push({
    timestamp: new Date().toISOString(),
    type: error.name,
    message: error.message,
    stack: error.stack,
    context: {
      source,
      ...context,
    },
  });

  // Keep buffer size under limit (FIFO)
  if (errorBuffer.length > MAX_ERROR_BUFFER_SIZE) {
    errorBuffer.shift();
  }
}

/**
 * Get recent errors from in-memory buffer
 * Used by admin error analytics endpoint
 *
 * @param count Maximum number of errors to return
 * @returns Array of recent errors
 */
export function getRecentErrors(count = 100) {
  return errorBuffer.slice(-count);
}

/**
 * Clear error buffer (for testing or admin reset)
 */
export function clearErrorBuffer() {
  errorBuffer.length = 0;
  logger.info('Error buffer cleared');
}

/**
 * Middleware helper: Run function with request ID context
 *
 * Usage in Next.js API route:
 * export async function GET(request: Request) {
 *   return withRequestId(async () => {
 *     logger.info({}, 'Processing request'); // requestId automatically added
 *     // ... handler logic
 *   });
 * }
 */
export async function withRequestId<T>(fn: () => Promise<T>): Promise<T> {
  const requestId = generateRequestId();
  return requestContext.run({ requestId }, fn);
}

/**
 * Example usage patterns:
 *
 * Basic logging:
 * logger.info({ userId: '123' }, 'User logged in');
 * logger.error({ error: err }, 'Database connection failed');
 *
 * ETL pipeline:
 * logETLStage('extract', 'start', { fdcId: 123 });
 * logETLStage('transform', 'success', { fdcId: 123, compounds: 28, duration: 145 });
 *
 * API requests:
 * logAPIRequest('GET', '/api/foods/123', 200, 145, { cacheHit: true });
 *
 * Cache operations:
 * logCacheOperation('L2', 'hit', 'food:123', 5);
 *
 * Rate limiting:
 * logRateLimiter('allowed', 892, 1000);
 *
 * Circuit breaker:
 * logCircuitBreaker('CLOSED', 'OPEN', 5, 'USDA API timeout');
 *
 * Errors:
 * logError(error, 'USDA Client', { fdcId: 123, attempt: 3 });
 */
