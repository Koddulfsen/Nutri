/**
 * Meal Item API Endpoint
 *
 * DELETE /api/meals/items/[mealItemId] - Remove item from meal
 *
 * Purpose: Individual meal item operations
 * Pattern: Supabase auth + ownership verification + cache invalidation
 *
 * Generated: 2026-01-20
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { mealItems, mealLogs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { invalidateDailyTotals } from '@/lib/services/daily-totals-service';
import { logger } from '@/lib/logger';

/**
 * DELETE /api/meals/items/[mealItemId]
 * Remove a meal item and invalidate daily totals cache
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ mealItemId: string }> }
) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.warn(
        {
          service: 'meal-items-api',
          endpoint: 'DELETE /api/meals/items/[mealItemId]',
        },
        'Unauthorized request - no session'
      );

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const { mealItemId } = await params;

    logger.info(
      {
        service: 'meal-items-api',
        endpoint: 'DELETE /api/meals/items/[mealItemId]',
        userId,
        mealItemId,
      },
      'Deleting meal item'
    );

    // Step 2: Fetch the meal item to get the meal log ID
    const [mealItem] = await db
      .select({
        id: mealItems.id,
        mealLogId: mealItems.mealLogId,
      })
      .from(mealItems)
      .where(eq(mealItems.id, mealItemId))
      .limit(1);

    if (!mealItem) {
      logger.warn(
        {
          service: 'meal-items-api',
          endpoint: 'DELETE /api/meals/items/[mealItemId]',
          userId,
          mealItemId,
        },
        'Meal item not found'
      );

      return NextResponse.json({ error: 'Meal item not found' }, { status: 404 });
    }

    // Step 3: Verify ownership via meal log
    const [mealLog] = await db
      .select({
        id: mealLogs.id,
        userId: mealLogs.userId,
        date: mealLogs.date,
      })
      .from(mealLogs)
      .where(and(eq(mealLogs.id, mealItem.mealLogId), eq(mealLogs.userId, userId)))
      .limit(1);

    if (!mealLog) {
      logger.warn(
        {
          service: 'meal-items-api',
          endpoint: 'DELETE /api/meals/items/[mealItemId]',
          userId,
          mealItemId,
        },
        'Meal not found or unauthorized'
      );

      return NextResponse.json({ error: 'Meal not found or unauthorized' }, { status: 404 });
    }

    // Step 4: Delete the meal item
    await db.delete(mealItems).where(eq(mealItems.id, mealItemId));

    logger.info(
      {
        service: 'meal-items-api',
        endpoint: 'DELETE /api/meals/items/[mealItemId]',
        userId,
        mealItemId,
        mealLogId: mealLog.id,
      },
      'Meal item deleted'
    );

    // Step 5: Invalidate daily totals cache for this date
    await invalidateDailyTotals(userId, mealLog.date);

    logger.info(
      {
        service: 'meal-items-api',
        endpoint: 'DELETE /api/meals/items/[mealItemId]',
        userId,
        mealItemId,
        date: mealLog.date,
      },
      'Cache invalidated after meal item deletion'
    );

    return NextResponse.json(
      {
        message: 'Meal item deleted successfully',
        mealItemId,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(
      {
        service: 'meal-items-api',
        endpoint: 'DELETE /api/meals/items/[mealItemId]',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to delete meal item'
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
