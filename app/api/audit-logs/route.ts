/**
 * Audit Log Query API - FS-4 Security & Compliance System
 *
 * GET /api/audit-logs - Retrieve user's audit trail (paginated)
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 100, max: 500)
 * - action: AuditAction (optional filter)
 * - resourceType: string (optional filter)
 * - startDate: ISO 8601 date (optional filter)
 * - endDate: ISO 8601 date (optional filter)
 *
 * Retention: none enforced. The previous "HIPAA 6-year retention" claim was not
 * implemented, and HIPAA does not apply to this EEA controller.
 *
 * Created: 2025-11-10
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/dal/audit';
import { createClient } from '@/lib/supabase/server';
import type { AuditAction } from '@/lib/security/audit-logger';

/**
 * GET /api/audit-logs
 *
 * Retrieve paginated audit trail for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const action = searchParams.get('action') as AuditAction | null;
    const resourceType = searchParams.get('resourceType');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 500) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters (page >= 1, limit 1-500)' },
        { status: 400 }
      );
    }

    // Parse dates if provided
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    // Validate dates
    if (startDate && isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid startDate format (use ISO 8601)' },
        { status: 400 }
      );
    }
    if (endDate && isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid endDate format (use ISO 8601)' },
        { status: 400 }
      );
    }

    // Get audit logs via DAL (includes authorization check + RLS enforcement)
    const result = await getAuditLogs(user.id, {
      page,
      limit,
      action: action || undefined,
      resourceType: resourceType || undefined,
      startDate,
      endDate
    });

    // Format response
    return NextResponse.json({
      logs: result.logs.map(log => ({
        id: log.id,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt.toISOString()
      })),
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        hasMore: result.pagination.hasMore
      }
    });
  } catch (error) {
    console.error('GET /api/audit-logs error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
