/**
 * Meal Sync API Endpoint
 *
 * POST /api/meals/sync
 *
 * Applies at most one change to a day's meals — add a food, or remove a meal
 * item — and returns the day's resulting state (meals + daily totals) in the
 * same response. With no `change` it just returns the state.
 *
 * Why one endpoint: adding a food used to be three serverless calls in a row
 * (POST the item → GET meals → GET daily totals), each re-checking auth and
 * each able to cold-start. Here that is one call, and the meals list and
 * the totals are computed at the same time. The old endpoints still exist.
 */

import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/db';
import { mealItems, mealLogs } from '@/db/schema';
import { createMeal } from '@/lib/services/meal-service';
import { ensureUserProfile } from '@/lib/services/user-service';
import { invalidateDailyTotals } from '@/lib/services/daily-totals-service';
import { loadDayState } from '@/lib/services/meal-state';
import { logger } from '@/lib/logger';

const FoodSchema = z.object({
  foodId: z.string().uuid('Invalid food ID'),
  portionSize: z.number().positive('Portion size must be positive'),
  portionType: z.string().min(1, 'Portion type is required'),
});

const SyncSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  // Picker demographics, used to compute % of daily value (same as GET /api/daily-totals)
  age: z.number().int().min(0).max(120).optional(),
  sex: z.enum(['MALE', 'FEMALE']).optional(),
  change: z
    .discriminatedUnion('type', [
      z.object({
        type: z.literal('add'),
        // An existing meal to add to; omit to start today's meal
        mealId: z.string().uuid().nullish(),
        food: FoodSchema,
      }),
      z.object({
        type: z.literal('remove'),
        mealItemId: z.string().uuid(),
      }),
    ])
    .optional(),
});

export const POST = withAuth(
  async ({ user, input }) => {
    const userId = user.id;
    const { date, age, sex, change } = input;

    if (change?.type === 'add') {
      const { food, mealId } = change;

      if (mealId) {
        const [meal] = await db
          .select({ id: mealLogs.id, date: mealLogs.date, isActive: mealLogs.isActive })
          .from(mealLogs)
          .where(and(eq(mealLogs.id, mealId), eq(mealLogs.userId, userId)))
          .limit(1);

        if (!meal) return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
        if (!meal.isActive) return NextResponse.json({ error: 'Meal has been deleted' }, { status: 410 });
        // The state returned is for `date`; a meal from another day would silently not show up in it.
        if (meal.date !== date) {
          return NextResponse.json({ error: 'Meal is not on the requested date' }, { status: 400 });
        }

        await db.insert(mealItems).values({
          mealLogId: mealId,
          foodId: food.foodId,
          portionSize: food.portionSize.toString(),
          portionType: food.portionType,
        });
      } else {
        await ensureUserProfile(userId, {
          fullName: user.user_metadata?.full_name || user.user_metadata?.name,
          avatarUrl: user.user_metadata?.avatar_url,
        });
        await createMeal(userId, date, 'Today', [food]);
      }
    } else if (change?.type === 'remove') {
      // One query proves both that the item exists and that it is the caller's.
      const [owned] = await db
        .select({ id: mealItems.id })
        .from(mealItems)
        .innerJoin(mealLogs, eq(mealLogs.id, mealItems.mealLogId))
        .where(and(eq(mealItems.id, change.mealItemId), eq(mealLogs.userId, userId), eq(mealLogs.date, date)))
        .limit(1);

      if (!owned) return NextResponse.json({ error: 'Meal item not found' }, { status: 404 });

      await db.delete(mealItems).where(eq(mealItems.id, change.mealItemId));
    }

    // The cache row is now stale. Clear it while the state loads (independent
    // work, so it costs no extra time); the fresh value is written after the
    // response goes out. If that write is lost, the next read just recalculates.
    const [state] = await Promise.all([
      loadDayState({ userId, date, age, sex }),
      change ? invalidateDailyTotals(userId, date) : Promise.resolve(),
    ]);

    if (change) {
      after(async () => {
        try {
          await state.saveCache();
        } catch (error) {
          logger.warn(
            { service: 'meal-sync-api', userId, date, error: error instanceof Error ? error.message : String(error) },
            'Could not write daily totals cache after sync'
          );
        }
      });
    }

    return NextResponse.json({ date, meals: state.meals, dailyTotals: state.dailyTotals });
  },
  { schema: SyncSchema, source: 'body' }
);
