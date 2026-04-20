/**
 * Food Approval Endpoint
 *
 * POST /api/foods/[id]/approve
 *
 * Purpose: Admin endpoint to approve/reject pending food additions
 * Pattern: Authorization check + status update
 * Features:
 *   - Admin-only access
 *   - Approve or reject pending foods
 *   - Optional review notes
 *   - Records reviewer and timestamp
 *
 * Generated: 2025-11-18
 * Architecture: Multi-Source Food Database System
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { foodApprovals } from '@/db/schema';
import { logger } from '@/lib/logger';
import { eq, and } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/api-guard';

/**
 * Request body schema
 */
const ApprovalSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Action must be "approve" or "reject"' }),
  }),
  reviewNotes: z.string().optional(),
  reviewerId: z.string().uuid('Invalid reviewer ID'), // Admin user ID
});

/**
 * POST /api/foods/[id]/approve
 * Approve or reject a pending food
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ foodId: string }> }
): Promise<NextResponse> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const startTime = Date.now();
  const { foodId } = await params;

  try {
    // Step 1: Validate request body
    const body = await request.json();
    const validationResult = ApprovalSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'food-approval-api',
          foodId,
          errors: validationResult.error.errors,
        },
        'Invalid approval request'
      );

      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { action, reviewNotes, reviewerId } = validationResult.data;

    logger.info(
      {
        service: 'food-approval-api',
        foodId,
        action,
        reviewerId,
      },
      'Processing food approval'
    );

    // Step 2: Check if food approval exists
    const [existingApproval] = await db
      .select()
      .from(foodApprovals)
      .where(eq(foodApprovals.foodId, foodId))
      .limit(1);

    if (!existingApproval) {
      logger.warn(
        {
          service: 'food-approval-api',
          foodId,
        },
        'Food approval not found'
      );

      return NextResponse.json(
        {
          error: 'Food approval not found',
          message: `No approval record found for food ID: ${foodId}`,
        },
        { status: 404 }
      );
    }

    // Step 3: Check if already reviewed
    if (existingApproval.status !== 'PENDING' && existingApproval.status !== 'AUTO_APPROVED') {
      logger.warn(
        {
          service: 'food-approval-api',
          foodId,
          currentStatus: existingApproval.status,
        },
        'Food already reviewed'
      );

      return NextResponse.json(
        {
          error: 'Already reviewed',
          message: `Food has already been ${existingApproval.status.toLowerCase()}`,
          currentStatus: existingApproval.status,
        },
        { status: 409 }
      );
    }

    // Step 4: Update approval status
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    const [updatedApproval] = await db
      .update(foodApprovals)
      .set({
        status: newStatus,
        reviewedBy: reviewerId,
        reviewNotes: reviewNotes || null,
        reviewedAt: new Date(),
      })
      .where(eq(foodApprovals.id, existingApproval.id))
      .returning();

    const durationMs = Date.now() - startTime;

    logger.info(
      {
        service: 'food-approval-api',
        foodId,
        action,
        newStatus,
        reviewerId,
        durationMs,
      },
      'Food approval updated'
    );

    // Step 5: Return result
    return NextResponse.json(
      {
        success: true,
        approval: {
          id: updatedApproval.id,
          foodId: updatedApproval.foodId,
          status: updatedApproval.status,
          reviewedBy: updatedApproval.reviewedBy,
          reviewNotes: updatedApproval.reviewNotes,
          reviewedAt: updatedApproval.reviewedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(
      {
        service: 'food-approval-api',
        foodId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Food approval error'
    );

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
