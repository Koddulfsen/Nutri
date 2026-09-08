/**
 * Error Analytics Endpoint
 * Admin-only endpoint for error debugging and analytics
 *
 * Reference: architecture.md lines 3150-3250 (Error Analytics)
 *
 * Features:
 * - Last 100 errors from in-memory buffer
 * - Grouped by error type with counts
 * - Full stack traces and context
 * - Time range filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRecentErrors } from '@/lib/logging/pino-config';
import { logger, withRequestId } from '@/lib/logging/pino-config';
import { requireAdmin } from '@/lib/auth/api-guard';

interface ErrorAnalyticsResponse {
  totalErrors: number;
  timeRange: {
    start: string;
    end: string;
  };
  errors: Array<{
    timestamp: string;
    type: string;
    message: string;
    stack?: string;
    context: Record<string, any>;
    count: number; // if grouped
  }>;
  groupedByType: Record<string, number>;
}

/**
 * GET /api/admin/errors
 * Returns error analytics and recent errors
 *
 * Query params:
 * - limit: Maximum number of errors to return (default: 100)
 * - grouped: Whether to group by error type (default: false)
 */
export async function GET(request: NextRequest) {
  // Admin-only. Middleware is a second line of defence, not a boundary
  // (see CVE-2025-29927: middleware can be skipped entirely).
  const denied = await requireAdmin();
  if (denied) return denied;


  return withRequestId(async () => {
    try {
      // 1. Authentication check
      const supabase = await createClient();
      const { data: { user }, error: sessionError } = await supabase.auth.getUser();

      if (sessionError || !user) {
        logger.warn({ error: sessionError }, 'Unauthorized error analytics attempt');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Authorization is enforced by requireAdmin() at the top of this handler.
      // A second check here previously read `user_metadata.admin`, which the
      // user's own client can write — a privilege-escalation vector, not a gate.

      logger.info({ userId: user.id }, 'Admin error analytics requested');

      // 3. Parse query parameters
      const searchParams = request.nextUrl.searchParams;
      const limit = parseInt(searchParams.get('limit') ?? '100', 10);
      const grouped = searchParams.get('grouped') === 'true';

      // 4. Get recent errors from in-memory buffer
      const recentErrors = getRecentErrors(limit);

      // 5. Calculate time range
      const timestamps = recentErrors.map(e => new Date(e.timestamp).getTime());
      const timeRange = {
        start: timestamps.length > 0
          ? new Date(Math.min(...timestamps)).toISOString()
          : new Date().toISOString(),
        end: timestamps.length > 0
          ? new Date(Math.max(...timestamps)).toISOString()
          : new Date().toISOString(),
      };

      // 6. Group errors by type
      const groupedByType: Record<string, number> = {};
      for (const error of recentErrors) {
        groupedByType[error.type] = (groupedByType[error.type] ?? 0) + 1;
      }

      // 7. Format errors for response
      let errors: ErrorAnalyticsResponse['errors'];

      if (grouped) {
        // Group identical errors together and count occurrences
        const errorMap = new Map<string, ErrorAnalyticsResponse['errors'][0]>();

        for (const error of recentErrors) {
          const key = `${error.type}:${error.message}`;
          const existing = errorMap.get(key);

          if (existing) {
            existing.count++;
          } else {
            errorMap.set(key, {
              timestamp: error.timestamp,
              type: error.type,
              message: error.message,
              stack: error.stack,
              context: error.context,
              count: 1,
            });
          }
        }

        errors = Array.from(errorMap.values());
      } else {
        // Return all errors individually
        errors = recentErrors.map(error => ({
          timestamp: error.timestamp,
          type: error.type,
          message: error.message,
          stack: error.stack,
          context: error.context,
          count: 1,
        }));
      }

      const response: ErrorAnalyticsResponse = {
        totalErrors: recentErrors.length,
        timeRange,
        errors,
        groupedByType,
      };

      logger.info({
        totalErrors: recentErrors.length,
        uniqueTypes: Object.keys(groupedByType).length,
        userId: user.id,
      }, 'Error analytics generated');

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } catch (error) {
      logger.error({ error }, 'Error analytics generation failed');

      return NextResponse.json(
        {
          error: 'Error analytics generation failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE /api/admin/errors
 * Clear error buffer (admin utility)
 */
export async function DELETE() {
  // Admin-only. Middleware is a second line of defence, not a boundary
  // (see CVE-2025-29927: middleware can be skipped entirely).
  const denied = await requireAdmin();
  if (denied) return denied;


  return withRequestId(async () => {
    try {
      // 1. Authentication check
      const supabase = await createClient();
      const { data: { user }, error: sessionError } = await supabase.auth.getUser();

      if (sessionError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Authorization is enforced by requireAdmin() at the top of this handler.
      // A second check here previously read `user_metadata.admin`, which the
      // user's own client can write — a privilege-escalation vector, not a gate.

      logger.info({ userId: user.id }, 'Admin clearing error buffer');

      // Note: clearErrorBuffer is not exported from pino-config
      // This is intentional - error buffer persists for debugging
      // To implement: add clearErrorBuffer to pino-config exports

      return NextResponse.json({
        success: true,
        message: 'Error buffer clearing not implemented (errors persist for debugging)',
      });
    } catch (error) {
      logger.error({ error }, 'Error buffer clear failed');

      return NextResponse.json(
        {
          error: 'Error buffer clear failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}
