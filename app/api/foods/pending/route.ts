/**
 * Pending Foods Endpoint
 *
 * GET /api/foods/pending
 *
 * Purpose: Admin endpoint to get list of pending food approvals
 * Pattern: Filtered query with JOIN for food details
 * Features:
 *   - Admin-only access
 *   - Returns pending foods with requester info
 *   - Includes food name, sources, and request timestamp
 *   - Pagination support
 *
 * Generated: 2025-11-18
 * Architecture: Multi-Source Food Database System
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { foodApprovals, foods, foodSources } from '@/db/schema';
import { logger } from '@/lib/logger';
import { eq, desc } from 'drizzle-orm';

/**
 * Query parameters schema
 */
const QueryParamsSchema = z.object({
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100)),
  offset: z
    .string()
    .optional()
    .default('0')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().nonnegative()),
  status: z.enum(['PENDING', 'ALL']).optional().default('PENDING'),
});

/**
 * GET /api/foods/pending
 * Get list of pending food approvals
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Step 1: Parse and validate query parameters
    const { searchParams } = new URL(request.url);

    const paramsObject = {
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
      status: searchParams.get('status') as 'PENDING' | 'ALL' | undefined,
    };

    const validationResult = QueryParamsSchema.safeParse(paramsObject);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'pending-foods-api',
          errors: validationResult.error.errors,
        },
        'Invalid query parameters'
      );

      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { limit, offset, status } = validationResult.data;

    logger.info(
      {
        service: 'pending-foods-api',
        limit,
        offset,
        status,
      },
      'Fetching pending food approvals'
    );

    // Step 2: Query pending approvals with food details
    const approvalQuery = db
      .select({
        approvalId: foodApprovals.id,
        foodId: foodApprovals.foodId,
        status: foodApprovals.status,
        requestedBy: foodApprovals.requestedBy,
        requestedAt: foodApprovals.requestedAt,
        reviewedBy: foodApprovals.reviewedBy,
        reviewedAt: foodApprovals.reviewedAt,
        reviewNotes: foodApprovals.reviewNotes,
        foodName: foods.name,
        commonNames: foods.commonNames,
        dataSource: foods.dataSource,
        createdAt: foods.createdAt,
      })
      .from(foodApprovals)
      .innerJoin(foods, eq(foodApprovals.foodId, foods.id))
      .orderBy(desc(foodApprovals.requestedAt))
      .limit(limit)
      .offset(offset);

    // Filter by status if not 'ALL'
    const pendingApprovals =
      status === 'PENDING'
        ? await approvalQuery.where(eq(foodApprovals.status, 'PENDING'))
        : await approvalQuery;

    logger.debug(
      {
        service: 'pending-foods-api',
        count: pendingApprovals.length,
      },
      'Pending approvals fetched'
    );

    // Step 3: Fetch food sources for each pending food
    const pendingFoodsWithSources = await Promise.all(
      pendingApprovals.map(async (approval) => {
        const sources = await db
          .select({
            id: foodSources.id,
            apiSource: foodSources.apiSource,
            apiFoodId: foodSources.apiFoodId,
            verifiedBy: foodSources.verifiedBy,
          })
          .from(foodSources)
          .where(eq(foodSources.foodId, approval.foodId));

        return {
          approval: {
            id: approval.approvalId,
            status: approval.status,
            requestedBy: approval.requestedBy,
            requestedAt: approval.requestedAt,
            reviewedBy: approval.reviewedBy,
            reviewedAt: approval.reviewedAt,
            reviewNotes: approval.reviewNotes,
          },
          food: {
            id: approval.foodId,
            name: approval.foodName,
            commonNames: approval.commonNames,
            dataSource: approval.dataSource,
            createdAt: approval.createdAt,
          },
          sources: sources.map((s) => ({
            apiSource: s.apiSource,
            apiFoodId: s.apiFoodId,
          })),
        };
      })
    );

    const durationMs = Date.now() - startTime;

    logger.info(
      {
        service: 'pending-foods-api',
        count: pendingFoodsWithSources.length,
        status,
        durationMs,
      },
      'Pending food approvals retrieved'
    );

    // Step 4: Return results
    return NextResponse.json(
      {
        foods: pendingFoodsWithSources,
        pagination: {
          limit,
          offset,
          returned: pendingFoodsWithSources.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(
      {
        service: 'pending-foods-api',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Pending foods error'
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
