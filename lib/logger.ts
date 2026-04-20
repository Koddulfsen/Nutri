/**
 * Logging Utility
 *
 * Purpose: Structured logging for backend services
 * Pattern: Simple console-based logger with consistent formatting
 * Note: Using console.log for now; can upgrade to Pino later if needed
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 */

export interface LogContext {
  [key: string]: any;
}

/**
 * Simple logger with structured output
 * Object-first signature for consistency with Pino pattern
 */
export const logger = {
  info(context: LogContext, message: string): void {
    console.log(`[INFO] ${message}`, JSON.stringify(context, null, 2));
  },

  error(context: LogContext, message: string): void {
    console.error(`[ERROR] ${message}`, JSON.stringify(context, null, 2));
  },

  warn(context: LogContext, message: string): void {
    console.warn(`[WARN] ${message}`, JSON.stringify(context, null, 2));
  },

  debug(context: LogContext, message: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, JSON.stringify(context, null, 2));
    }
  },
};
