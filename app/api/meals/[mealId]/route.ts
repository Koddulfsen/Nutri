/**
 * Meal Detail API Endpoint
 *
 * GET /api/meals/[mealId] - Get single meal details
 * PATCH /api/meals/[mealId] - Update meal
 * DELETE /api/meals/[mealId] - Delete meal (soft delete)
 *
 * Purpose: Individual meal operations
 * Pattern: Supabase auth + ownership verification + meal-service
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 02 (Meal Logging & Tracking)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { updateMeal, deleteMeal } from '@/lib/services/meal-service';
import { db } from '@/db';
import { mealLogs, mealItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * PATCH body schema
 */
const UpdateMealSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  mealType: z.string().nullable().optional(),
});

/**
 * GET /api/meals/[mealId]
 * Get single meal details with items
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ mealId: string }> }) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      logger.warn(
        {
          service: 'meal-detail-api',
          endpoint: 'GET /api/meals/[mealId]',
        },
        'Unauthorized request - no session'
      );

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { mealId } = await params;

    logger.debug(
      {
        service: 'meal-detail-api',
        endpoint: 'GET /api/meals/[mealId]',
        userId,
        mealId,
      },
      'Fetching meal details'
    );

    // Step 2: Fetch meal (verify ownership)
    const [meal] = await db
      .select()
      .from(mealLogs)
      .where(and(eq(mealLogs.id, mealId), eq(mealLogs.userId, userId)))
      .limit(1);

    if (!meal) {
      logger.warn(
        {
          service: 'meal-detail-api',
          endpoint: 'GET /api/meals/[mealId]',
          userId,
          mealId,
        },
        'Meal not found or unauthorized'
      );

      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    // Step 3: Fetch meal items
    const items = await db
      .select({
        id: mealItems.id,
        foodId: mealItems.foodId,
        portionSize: mealItems.portionSize,
        portionType: mealItems.portionType,
        contextId: mealItems.contextId,
        notes: mealItems.notes,
      })
      .from(mealItems)
      .where(eq(mealItems.mealLogId, mealId));

    logger.info(
      {
        service: 'meal-detail-api',
        endpoint: 'GET /api/meals/[mealId]',
        userId,
        mealId,
        itemCount: items.length,
      },
      'Meal details fetched successfully'
    );

    // Step 4: Return response
    return NextResponse.json({
      id: meal.id,
      date: meal.date,
      mealType: meal.mealType,
      loggedAt: meal.loggedAt.toISOString(),
      updatedAt: meal.updatedAt.toISOString(),
      isActive: meal.isActive,
      items,
    });
  } catch (error) {
    logger.error(
      {
        service: 'meal-detail-api',
        endpoint: 'GET /api/meals/[mealId]',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to fetch meal details'
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

/**
 * PATCH /api/meals/[mealId]
 * Update meal metadata (date, mealType)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ mealId: string }> }) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      logger.warn(
        {
          service: 'meal-detail-api',
          endpoint: 'PATCH /api/meals/[mealId]',
        },
        'Unauthorized request - no session'
      );

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { mealId } = await params;

    // Step 2: Parse and validate request body
    const body = await request.json();
    const validationResult = UpdateMealSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'meal-detail-api',
          endpoint: 'PATCH /api/meals/[mealId]',
          userId,
          mealId,
          errors: validationResult.error.errors,
        },
        'Invalid request body'
      );

      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    logger.info(
      {
        service: 'meal-detail-api',
        endpoint: 'PATCH /api/meals/[mealId]',
        userId,
        mealId,
        updates: validationResult.data,
      },
      'Updating meal'
    );

    // Step 3: Update meal
    const updated = await updateMeal(mealId, userId, validationResult.data);

    logger.info(
      {
        service: 'meal-detail-api',
        endpoint: 'PATCH /api/meals/[mealId]',
        userId,
        mealId,
      },
      'Meal updated successfully'
    );

    // Step 4: Return response
    return NextResponse.json({
      mealId: updated.mealId,
      date: updated.date,
      mealType: updated.mealType,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error(
      {
        service: 'meal-detail-api',
        endpoint: 'PATCH /api/meals/[mealId]',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to update meal'
    );

    // Check for specific error messages
    if (error instanceof Error && error.message.includes('not found or unauthorized')) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/meals/[mealId]
 * Delete meal (soft delete - sets isActive = false)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ mealId: string }> }) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      logger.warn(
        {
          service: 'meal-detail-api',
          endpoint: 'DELETE /api/meals/[mealId]',
        },
        'Unauthorized request - no session'
      );

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { mealId } = await params;

    logger.info(
      {
        service: 'meal-detail-api',
        endpoint: 'DELETE /api/meals/[mealId]',
        userId,
        mealId,
      },
      'Deleting meal (soft delete)'
    );

    // Step 2: Delete meal
    await deleteMeal(mealId, userId);

    logger.info(
      {
        service: 'meal-detail-api',
        endpoint: 'DELETE /api/meals/[mealId]',
        userId,
        mealId,
      },
      'Meal deleted successfully'
    );

    // Step 3: Return response
    return NextResponse.json(
      {
        message: 'Meal deleted successfully',
        mealId,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(
      {
        service: 'meal-detail-api',
        endpoint: 'DELETE /api/meals/[mealId]',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to delete meal'
    );

    // Check for specific error messages
    if (error instanceof Error && error.message.includes('not found or unauthorized')) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
