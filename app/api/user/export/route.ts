/**
 * Data Export API - FS-4 Security & Compliance System
 *
 * POST /api/user/export - Request data export (GDPR Article 20)
 * GET /api/user/export - Check export status and get download URL
 *
 * Rate Limit: 3 req/24hr
 * Format: JSON (machine-readable)
 * Expiration: 7 days
 *
 * Created: 2025-11-10
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAudit, getRequestMetadata } from '@/lib/security/audit-logger';
import { db } from '@/db';
import { exportRequests } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * POST /api/user/export
 *
 * Request complete data export
 *
 * GDPR Article 20: Right to Data Portability
 */
export async function POST(request: NextRequest) {
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

    // TODO: Check rate limit (3 req/24hr)
    // This will be implemented when rate limiting infrastructure is added

    // Create export request
    const exportRequest = await db.insert(exportRequests).values({
      userId: user.id,
      userEmail: user.email || '',
      status: 'pending',
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    if (!exportRequest || exportRequest.length === 0) {
      throw new Error('Failed to create export request');
    }

    // Extract request metadata for audit log
    const metadata = getRequestMetadata(request);

    // Audit log the export request
    await logAudit({
      userId: user.id,
      action: 'EXPORT',
      resourceType: 'user_data',
      resourceId: exportRequest[0].id,
      metadata: {
        export_request_id: exportRequest[0].id,
        status: 'pending'
      },
      ...metadata
    });

    // TODO: Trigger background job to generate export
    // This will be implemented as a serverless function that:
    // 1. Collects ALL user data from all tables
    // 2. Formats as JSON
    // 3. Uploads to Supabase Storage
    // 4. Generates signed URL (7-day expiration)
    // 5. Sends email notification with download link

    return NextResponse.json({
      success: true,
      exportId: exportRequest[0].id,
      status: 'pending',
      message: 'Export request created. You will receive an email when your data is ready (typically within 5 minutes).'
    });
  } catch (error) {
    console.error('POST /api/user/export error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/export
 *
 * Get export status and download URL
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

    // Get user's most recent export request
    const exports = await db.query.exportRequests.findMany({
      where: eq(exportRequests.userId, user.id),
      orderBy: [desc(exportRequests.requestedAt)],
      limit: 10 // Show last 10 export requests
    });

    // Format response
    const formattedExports = exports?.map(exp => ({
      id: exp.id,
      status: exp.status,
      requestedAt: exp.requestedAt.toISOString(),
      completedAt: exp.completedAt?.toISOString() || null,
      downloadUrl: exp.downloadUrl,
      expiresAt: exp.expiresAt?.toISOString() || null,
      isExpired: exp.expiresAt ? exp.expiresAt < new Date() : false
    })) || [];

    return NextResponse.json({
      exports: formattedExports
    });
  } catch (error) {
    console.error('GET /api/user/export error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
