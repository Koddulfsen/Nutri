/**
 * Meal Service
 *
 * Purpose: Business logic for meal logging and tracking
 * Pattern: Service layer with Drizzle transactions and cache invalidation
 * Features:
 *   - Create meal logs with items (atomic transaction)
 *   - Update existing meals
 *   - Delete meals (soft delete)
 *   - Fetch meals for date/week
 *   - Cache invalidation on mutations
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 02 (Meal Logging & Tracking)
 */

import { db } from '@/db';
import { mealLogs, mealItems, foods } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { invalidateDailyTotals } from './daily-totals-service';

/**
 * Food item in meal
 */
export interface MealFoodItem {
  foodId: string;
  portionSize: number;
  portionType: string;
  contextId?: string;
  notes?: string;
}

/**
 * Create meal log with items
 * Uses Drizzle transaction to ensure atomicity
 * Invalidates daily totals cache after successful creation
 *
 * @param userId - User ID from Supabase auth
 * @param date - Meal date (YYYY-MM-DD)
 * @param mealType - Optional meal type (breakfast, lunch, dinner, snack)
 * @param foods - Array of food items with portions
 * @returns Created meal log with items
 */
export async function createMeal(
  userId: string,
  date: string,
  mealType: string | null,
  foods: MealFoodItem[]
): Promise<{
  mealId: string;
  date: string;
  mealType: string | null;
  foods: MealFoodItem[];
  createdAt: Date;
}> {
  logger.info(
    {
      service: 'meal-service',
      userId,
      date,
      mealType,
      foodCount: foods.length,
    },
    'Creating meal log'
  );

  try {
    // Transaction: Create meal log + meal items atomically
    const result = await db.transaction(async (tx) => {
      // Step 1: Insert meal log
      const [mealLog] = await tx
        .insert(mealLogs)
        .values({
          userId,
          date,
          mealType,
        })
        .returning();

      logger.debug(
        {
          service: 'meal-service',
          mealId: mealLog.id,
          userId,
          date,
        },
        'Meal log created'
      );

      // Step 2: Insert meal items
      if (foods.length > 0) {
        const itemsToInsert = foods.map((food) => ({
          mealLogId: mealLog.id,
          foodId: food.foodId,
          portionSize: food.portionSize.toString(),
          portionType: food.portionType,
          contextId: food.contextId || null,
          notes: food.notes || null,
        }));

        await tx.insert(mealItems).values(itemsToInsert);

        logger.debug(
          {
            service: 'meal-service',
            mealId: mealLog.id,
            itemCount: foods.length,
          },
          'Meal items created'
        );
      }

      return mealLog;
    });

    // Step 3: Invalidate daily totals cache
    await invalidateDailyTotals(userId, date);

    logger.info(
      {
        service: 'meal-service',
        mealId: result.id,
        userId,
        date,
        foodCount: foods.length,
      },
      'Meal creation completed successfully'
    );

    return {
      mealId: result.id,
      date: result.date,
      mealType: result.mealType,
      foods,
      createdAt: result.loggedAt,
    };
  } catch (error) {
    logger.error(
      {
        service: 'meal-service',
        userId,
        date,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to create meal'
    );

    throw new Error('Failed to create meal: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Update existing meal
 * Updates meal log metadata (date, mealType)
 * Invalidates daily totals cache for both old and new dates
 *
 * @param mealId - Meal log ID
 * @param userId - User ID (for ownership verification)
 * @param updates - Fields to update
 * @returns Updated meal log
 */
export async function updateMeal(
  mealId: string,
  userId: string,
  updates: {
    date?: string;
    mealType?: string | null;
  }
): Promise<{
  mealId: string;
  date: string;
  mealType: string | null;
  updatedAt: Date;
}> {
  logger.info(
    {
      service: 'meal-service',
      mealId,
      userId,
      updates,
    },
    'Updating meal log'
  );

  try {
    // Fetch current meal to get old date
    const [currentMeal] = await db
      .select()
      .from(mealLogs)
      .where(and(eq(mealLogs.id, mealId), eq(mealLogs.userId, userId)))
      .limit(1);

    if (!currentMeal) {
      throw new Error('Meal not found or unauthorized');
    }

    const oldDate = currentMeal.date;

    // Update meal log
    const [updated] = await db
      .update(mealLogs)
      .set({
        date: updates.date || currentMeal.date,
        mealType: updates.mealType !== undefined ? updates.mealType : currentMeal.mealType,
        updatedAt: new Date(),
      })
      .where(and(eq(mealLogs.id, mealId), eq(mealLogs.userId, userId)))
      .returning();

    if (!updated) {
      throw new Error('Meal not found or unauthorized');
    }

    // Invalidate daily totals for old date
    if (oldDate) {
      await invalidateDailyTotals(userId, oldDate);
    }

    // Invalidate daily totals for new date (if changed)
    if (updates.date && updates.date !== oldDate) {
      await invalidateDailyTotals(userId, updates.date);
    }

    logger.info(
      {
        service: 'meal-service',
        mealId: updated.id,
        userId,
        oldDate,
        newDate: updated.date,
      },
      'Meal update completed successfully'
    );

    return {
      mealId: updated.id,
      date: updated.date,
      mealType: updated.mealType,
      updatedAt: updated.updatedAt,
    };
  } catch (error) {
    logger.error(
      {
        service: 'meal-service',
        mealId,
        userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to update meal'
    );

    throw new Error('Failed to update meal: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Delete meal (soft delete)
 * Sets isActive = false instead of hard delete
 * Invalidates daily totals cache
 *
 * @param mealId - Meal log ID
 * @param userId - User ID (for ownership verification)
 */
export async function deleteMeal(mealId: string, userId: string): Promise<void> {
  logger.info(
    {
      service: 'meal-service',
      mealId,
      userId,
    },
    'Deleting meal log (soft delete)'
  );

  try {
    // Fetch meal to get date for cache invalidation
    const [meal] = await db
      .select()
      .from(mealLogs)
      .where(and(eq(mealLogs.id, mealId), eq(mealLogs.userId, userId)))
      .limit(1);

    if (!meal) {
      throw new Error('Meal not found or unauthorized');
    }

    // Soft delete
    await db
      .update(mealLogs)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(mealLogs.id, mealId), eq(mealLogs.userId, userId)));

    // Invalidate daily totals cache
    if (meal.date) {
      await invalidateDailyTotals(userId, meal.date);
    }

    logger.info(
      {
        service: 'meal-service',
        mealId,
        userId,
        date: meal.date,
      },
      'Meal deletion completed successfully'
    );
  } catch (error) {
    logger.error(
      {
        service: 'meal-service',
        mealId,
        userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to delete meal'
    );

    throw new Error('Failed to delete meal: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Get meals for a specific date
 * Only returns active meals
 *
 * @param userId - User ID
 * @param date - Date (YYYY-MM-DD)
 * @returns Array of meals with items
 */
export async function getMealsForDate(
  userId: string,
  date: string
): Promise<
  Array<{
    id: string;
    date: string;
    mealType: string | null;
    loggedAt: Date;
    items: Array<{
      id: string;
      foodId: string;
      portionSize: string;
      portionType: string;
      contextId: string | null;
      notes: string | null;
      food: {
        id: string;
        name: string;
      } | null;
    }>;
  }>
> {
  logger.debug(
    {
      service: 'meal-service',
      userId,
      date,
    },
    'Fetching meals for date'
  );

  try {
    // Fetch meals
    const meals = await db
      .select()
      .from(mealLogs)
      .where(and(eq(mealLogs.userId, userId), eq(mealLogs.date, date), eq(mealLogs.isActive, true)))
      .orderBy(desc(mealLogs.loggedAt));

    // Fetch items for each meal with food data
    const mealsWithItems = await Promise.all(
      meals.map(async (meal) => {
        const items = await db
          .select({
            id: mealItems.id,
            foodId: mealItems.foodId,
            portionSize: mealItems.portionSize,
            portionType: mealItems.portionType,
            contextId: mealItems.contextId,
            notes: mealItems.notes,
            food: {
              id: foods.id,
              name: foods.name,
            },
          })
          .from(mealItems)
          .leftJoin(foods, eq(mealItems.foodId, foods.id))
          .where(eq(mealItems.mealLogId, meal.id));

        return {
          id: meal.id,
          date: meal.date,
          mealType: meal.mealType,
          loggedAt: meal.loggedAt,
          items,
        };
      })
    );

    logger.debug(
      {
        service: 'meal-service',
        userId,
        date,
        mealCount: mealsWithItems.length,
      },
      'Meals fetched successfully'
    );

    return mealsWithItems;
  } catch (error) {
    logger.error(
      {
        service: 'meal-service',
        userId,
        date,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to fetch meals for date'
    );

    throw new Error('Failed to fetch meals: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Get meals for a week
 * Returns meals from startDate to startDate + 6 days
 *
 * @param userId - User ID
 * @param startDate - Week start date (YYYY-MM-DD)
 * @returns Array of meals with items
 */
export async function getMealsForWeek(
  userId: string,
  startDate: string
): Promise<
  Array<{
    id: string;
    date: string;
    mealType: string | null;
    loggedAt: Date;
    items: Array<{
      id: string;
      foodId: string;
      portionSize: string;
      portionType: string;
      contextId: string | null;
      notes: string | null;
    }>;
  }>
> {
  logger.debug(
    {
      service: 'meal-service',
      userId,
      startDate,
    },
    'Fetching meals for week'
  );

  try {
    // Calculate end date (start + 6 days)
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const endDate = end.toISOString().split('T')[0];

    // Fetch meals
    const meals = await db
      .select()
      .from(mealLogs)
      .where(
        and(
          eq(mealLogs.userId, userId),
          gte(mealLogs.date, startDate),
          lte(mealLogs.date, endDate),
          eq(mealLogs.isActive, true)
        )
      )
      .orderBy(desc(mealLogs.date), desc(mealLogs.loggedAt));

    // Fetch items for each meal
    const mealsWithItems = await Promise.all(
      meals.map(async (meal) => {
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
          .where(eq(mealItems.mealLogId, meal.id));

        return {
          id: meal.id,
          date: meal.date,
          mealType: meal.mealType,
          loggedAt: meal.loggedAt,
          items,
        };
      })
    );

    logger.debug(
      {
        service: 'meal-service',
        userId,
        startDate,
        endDate,
        mealCount: mealsWithItems.length,
      },
      'Week meals fetched successfully'
    );

    return mealsWithItems;
  } catch (error) {
    logger.error(
      {
        service: 'meal-service',
        userId,
        startDate,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to fetch meals for week'
    );

    throw new Error('Failed to fetch week meals: ' + (error instanceof Error ? error.message : String(error)));
  }
}
