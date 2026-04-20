/**
 * Account Deletion API - FS-4 Security & Compliance System
 *
 * POST /api/user/delete-account - Request account deletion (GDPR Article 17)
 *
 * Grace Period: 30 days
 * Rate Limit: 3 req/24hr
 *
 * Created: 2025-11-10
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAudit, getRequestMetadata } from '@/lib/security/audit-logger';
import { db } from '@/db';
import { deletionRequests } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/user/delete-account
 *
 * Request account deletion with 30-day grace period
 *
 * GDPR Article 17: Right to Erasure (Right to be Forgotten)
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

    // Check if there's already a pending deletion request
    const existingRequest = await db.query.deletionRequests.findFirst({
      where: and(
        eq(deletionRequests.userId, user.id),
        eq(deletionRequests.status, 'pending')
      )
    });

    if (existingRequest) {
      return NextResponse.json({
        error: 'Deletion request already pending',
        scheduledDate: existingRequest.scheduledDeletionAt.toISOString(),
        cancellationUrl: `/settings/privacy?cancel-deletion=${existingRequest.id}`
      }, { status: 400 });
    }

    // Calculate scheduled deletion date (30 days from now)
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 30);

    // Create deletion request
    const deletionRequest = await db.insert(deletionRequests).values({
      userId: user.id,
      userEmail: user.email || '',
      status: 'pending',
      requestedAt: new Date(),
      scheduledDeletionAt: scheduledDate,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    if (!deletionRequest || deletionRequest.length === 0) {
      throw new Error('Failed to create deletion request');
    }

    // Extract request metadata for audit log
    const metadata = getRequestMetadata(request);

    // Audit log the deletion request
    await logAudit({
      userId: user.id,
      action: 'DELETE',
      resourceType: 'user_account',
      resourceId: deletionRequest[0].id,
      metadata: {
        grace_period_ends: scheduledDate.toISOString(),
        can_cancel_before: scheduledDate.toISOString(),
        deletion_request_id: deletionRequest[0].id
      },
      ...metadata
    });

    // TODO: Send confirmation email with cancellation link
    // Email template should include:
    // - Account deletion scheduled for [scheduledDate]
    // - Cancellation link (valid for 30 days)
    // - Warning that all data will be permanently deleted

    return NextResponse.json({
      success: true,
      deletionRequestId: deletionRequest[0].id,
      scheduledDate: scheduledDate.toISOString(),
      message: `Account deletion scheduled for ${scheduledDate.toLocaleDateString()}. You can cancel this request within 30 days.`,
      cancellationToken: deletionRequest[0].id
    });
  } catch (error) {
    console.error('POST /api/user/delete-account error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/delete-account
 *
 * Cancel pending account deletion
 *
 * Query Parameters:
 * - requestId: Deletion request ID to cancel
 */
export async function DELETE(request: NextRequest) {
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

    // Get requestId from query params
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        { error: 'Missing requestId parameter' },
        { status: 400 }
      );
    }

    // Find deletion request
    const deletionRequest = await db.query.deletionRequests.findFirst({
      where: and(
        eq(deletionRequests.id, requestId),
        eq(deletionRequests.userId, user.id),
        eq(deletionRequests.status, 'pending')
      )
    });

    if (!deletionRequest) {
      return NextResponse.json(
        { error: 'Deletion request not found or already cancelled' },
        { status: 404 }
      );
    }

    // Check if grace period has expired
    if (deletionRequest.scheduledDeletionAt < new Date()) {
      return NextResponse.json(
        { error: 'Grace period has expired. Account deletion is in progress.' },
        { status: 400 }
      );
    }

    // Cancel deletion request
    const cancelled = await db.update(deletionRequests)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(deletionRequests.id, requestId))
      .returning();

    if (!cancelled || cancelled.length === 0) {
      throw new Error('Failed to cancel deletion request');
    }

    // Extract request metadata for audit log
    const metadata = getRequestMetadata(request);

    // Audit log the cancellation
    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      resourceType: 'deletion_request',
      resourceId: requestId,
      metadata: {
        action: 'cancelled',
        original_scheduled_date: deletionRequest.scheduledDeletionAt.toISOString()
      },
      ...metadata
    });

    return NextResponse.json({
      success: true,
      message: 'Account deletion cancelled successfully'
    });
  } catch (error) {
    console.error('DELETE /api/user/delete-account error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
