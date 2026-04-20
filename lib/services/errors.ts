/**
 * Error Handling Utilities
 *
 * Purpose: Custom error classes for service-specific errors
 * Pattern: Typed errors with context and retry information
 * Features:
 *   - Custom error classes with additional metadata
 *   - Retry detection for automatic retry logic
 *   - HTTP status code mapping
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: TODO.md Task 15
 */

/**
 * Base service error with context
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ServiceError';
  }

  /**
   * Check if error is retryable based on status code
   */
  isRetryable(): boolean {
    // Retryable: 408 (Timeout), 429 (Rate Limit), 500+ (Server errors)
    // Not retryable: 400-407, 410-428, 430-499 (Client errors)
    return (
      this.statusCode === 408 ||
      this.statusCode === 429 ||
      (this.statusCode >= 500 && this.statusCode < 600)
    );
  }
}

/**
 * USDA API error
 */
export class USDAAPIError extends ServiceError {
  constructor(
    message: string,
    statusCode: number,
    public retryAfter?: number, // Seconds to wait before retry
    context?: Record<string, any>
  ) {
    super(message, statusCode, context);
    this.name = 'USDAAPIError';
  }
}

/**
 * Rate limit error (already defined in rate-limiter.ts, re-exporting for convenience)
 */
export class RateLimitError extends ServiceError {
  constructor(
    message: string,
    public remaining: number,
    public retryAfterSeconds: number
  ) {
    super(message, 429, { remaining, retryAfterSeconds });
    this.name = 'RateLimitError';
  }
}

/**
 * Circuit breaker error (already defined in circuit-breaker.ts, re-exporting for convenience)
 */
export class CircuitBreakerError extends ServiceError {
  constructor(message: string, public retryAfterSeconds: number) {
    super(message, 503, { retryAfterSeconds });
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Database error
 */
export class DatabaseError extends ServiceError {
  constructor(
    message: string,
    public operation: string,
    context?: Record<string, any>
  ) {
    super(message, 500, { operation, ...context });
    this.name = 'DatabaseError';
  }

  /**
   * Database errors are generally not retryable (data issues, constraint violations)
   * Exception: Connection errors (timeout, connection refused)
   */
  isRetryable(): boolean {
    const retryablePatterns = [
      'connection',
      'timeout',
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
    ];

    return retryablePatterns.some((pattern) =>
      this.message.toLowerCase().includes(pattern.toLowerCase())
    );
  }
}

/**
 * Validation error
 */
export class ValidationError extends ServiceError {
  constructor(
    message: string,
    public field?: string,
    public validationErrors?: Record<string, string[]>
  ) {
    super(message, 400, { field, validationErrors });
    this.name = 'ValidationError';
  }

  /**
   * Validation errors are never retryable (client data issue)
   */
  isRetryable(): boolean {
    return false;
  }
}

/**
 * Not found error
 */
export class NotFoundError extends ServiceError {
  constructor(message: string, public resource: string, public id?: string | number) {
    super(message, 404, { resource, id });
    this.name = 'NotFoundError';
  }

  /**
   * Not found errors are never retryable
   */
  isRetryable(): boolean {
    return false;
  }
}

/**
 * Quarantine error (data quality failure)
 */
export class QuarantineError extends ServiceError {
  constructor(
    message: string,
    public fdcId: number,
    public failureReason: string,
    public validationDetails?: Record<string, any>
  ) {
    super(message, 422, { fdcId, failureReason, validationDetails });
    this.name = 'QuarantineError';
  }

  /**
   * Quarantine errors are never retryable (data quality issue)
   */
  isRetryable(): boolean {
    return false;
  }
}

/**
 * ETL processing error
 */
export class ETLError extends ServiceError {
  constructor(
    message: string,
    public stage: 'extract' | 'transform' | 'load',
    public jobId?: string,
    context?: Record<string, any>
  ) {
    super(message, 500, { stage, jobId, ...context });
    this.name = 'ETLError';
  }

  /**
   * ETL errors may be retryable depending on stage
   * Extract errors: Retryable (network/API issues)
   * Transform errors: Not retryable (data format issues)
   * Load errors: Retryable (database connection issues)
   */
  isRetryable(): boolean {
    if (this.stage === 'transform') return false;
    return super.isRetryable();
  }
}

/**
 * Helper function to determine if any error is retryable
 *
 * @param error - Error instance
 * @returns True if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ServiceError) {
    return error.isRetryable();
  }

  // Unknown errors are considered retryable (safe default)
  return true;
}

/**
 * Helper function to extract retry-after value from error
 *
 * @param error - Error instance
 * @returns Retry-after seconds, or null if not specified
 */
export function getRetryAfter(error: unknown): number | null {
  if (error instanceof USDAAPIError && error.retryAfter) {
    return error.retryAfter;
  }

  if (error instanceof RateLimitError) {
    return error.retryAfterSeconds;
  }

  if (error instanceof CircuitBreakerError) {
    return error.retryAfterSeconds;
  }

  return null;
}

/**
 * Helper function to convert error to HTTP response format
 *
 * @param error - Error instance
 * @returns Object with status code and error details
 */
export function toHTTPError(error: unknown): {
  statusCode: number;
  error: string;
  message: string;
  retryAfter?: number;
  context?: Record<string, any>;
} {
  if (error instanceof ServiceError) {
    return {
      statusCode: error.statusCode,
      error: error.name,
      message: error.message,
      retryAfter: getRetryAfter(error) || undefined,
      context: error.context,
    };
  }

  // Unknown error
  return {
    statusCode: 500,
    error: 'InternalServerError',
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
  };
}
