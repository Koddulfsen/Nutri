/**
 * Meal Items API Endpoint
 *
 * POST /api/meals/[mealId]/items - Add item(s) to existing meal
 *
 * Purpose: Add food items to an existing meal
 * Pattern: Supabase auth + ownership verification + cache invalidation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { mealLogs, mealItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { invalidateDailyTotals } from '@/lib/services/daily-totals-service';
import { logger } from '@/lib/logger';

/**
 * POST body schema
 */
const AddItemsSchema = z.object({
  foods: z
    .array(
      z.object({
        foodId: z.string().uuid('Invalid food ID'),
        portionSize: z.number().positive('Portion size must be positive'),
        portionType: z.string().min(1, 'Portion type is required'),
        contextId: z.string().uuid().optional(),
        notes: z.string().optional(),
      })
    )
    .min(1, 'At least one food item is required'),
});

/**
 * POST /api/meals/[mealId]/items
 * Add food items to an existing meal
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mealId: string }> }
) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      logger.warn(
        {
          service: 'meal-items-api',
          endpoint: 'POST /api/meals/[mealId]/items',
        },
        'Unauthorized request - no session'
      );

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { mealId } = await params;

    // Step 2: Parse and validate request body
    const body = await request.json();
    const validationResult = AddItemsSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'meal-items-api',
          endpoint: 'POST /api/meals/[mealId]/items',
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

    const { foods } = validationResult.data;

    // Step 3: Verify meal exists and belongs to user
    const [meal] = await db
      .select({
        id: mealLogs.id,
        userId: mealLogs.userId,
        date: mealLogs.date,
        isActive: mealLogs.isActive,
      })
      .from(mealLogs)
      .where(and(eq(mealLogs.id, mealId), eq(mealLogs.userId, userId)))
      .limit(1);

    if (!meal) {
      logger.warn(
        {
          service: 'meal-items-api',
          endpoint: 'POST /api/meals/[mealId]/items',
          userId,
          mealId,
        },
        'Meal not found or unauthorized'
      );

      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    if (!meal.isActive) {
      return NextResponse.json({ error: 'Meal has been deleted' }, { status: 410 });
    }

    logger.info(
      {
        service: 'meal-items-api',
        endpoint: 'POST /api/meals/[mealId]/items',
        userId,
        mealId,
        foodCount: foods.length,
      },
      'Adding items to meal'
    );

    // Step 4: Insert meal items
    const itemsToInsert = foods.map((food) => ({
      mealLogId: mealId,
      foodId: food.foodId,
      portionSize: food.portionSize.toString(),
      portionType: food.portionType,
      contextId: food.contextId || null,
      notes: food.notes || null,
    }));

    const insertedItems = await db.insert(mealItems).values(itemsToInsert).returning();

    logger.info(
      {
        service: 'meal-items-api',
        endpoint: 'POST /api/meals/[mealId]/items',
        userId,
        mealId,
        insertedCount: insertedItems.length,
      },
      'Items added to meal'
    );

    // Step 5: Invalidate daily totals cache
    await invalidateDailyTotals(userId, meal.date);

    logger.info(
      {
        service: 'meal-items-api',
        endpoint: 'POST /api/meals/[mealId]/items',
        userId,
        mealId,
        date: meal.date,
      },
      'Cache invalidated after adding items'
    );

    return NextResponse.json(
      {
        message: 'Items added successfully',
        mealId,
        items: insertedItems.map((item) => ({
          id: item.id,
          foodId: item.foodId,
          portionSize: item.portionSize,
          portionType: item.portionType,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error(
      {
        service: 'meal-items-api',
        endpoint: 'POST /api/meals/[mealId]/items',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to add items to meal'
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
