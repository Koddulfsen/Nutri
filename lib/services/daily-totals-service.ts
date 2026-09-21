/**
 * Daily Totals Service
 *
 * Purpose: Real-time aggregation of daily nutrient totals
 * Pattern: Calculate from meal_items with confidence-weighted formula
 * Features:
 *   - Real-time aggregation (~150ms pipeline)
 *   - Confidence-weighted totals
 *   - Redis + PostgreSQL caching
 *   - Cache invalidation on meal mutations
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 02 (Meal Logging & Tracking)
 */

import { db } from '@/db';
import { mealLogs, mealItems, dailyTotals } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { redis } from './redis';
import { expandFoodsToAtomsBatch, type ExpandedAtom } from './food-expansion';
import { loadAtomVectors } from './food-vectors';
import { computeCompoundValues, portionGrams, type CompoundValue } from '@/lib/nutrition/totals';

/**
 * Compound value with confidence
 */
export type { CompoundValue };

/**
 * Daily totals response
 */
export interface DailyTotalsResponse {
  date: string;
  compounds: CompoundValue[];
  lastUpdated: Date;
}

/**
 * Calculate daily totals from meal items
 * Aggregates all meal items for a date with confidence-weighted formula
 *
 * Formula: Σ(confidence × amount) / Σ(amount) for weighted confidence
 *
 * @param userId - User ID
 * @param date - Date (YYYY-MM-DD)
 * @param mealIds - Optional array of meal IDs to filter by (for meal selection feature)
 * @param itemIds - Optional meal-item IDs; when given, only those items count. Items are
 *   only ever read from this user's own meals, so a foreign id simply matches nothing.
 * @returns Aggregated compound totals
 */
export async function calculateDailyTotals(
  userId: string,
  date: string,
  mealIds?: string[],
  itemIds?: string[]
): Promise<CompoundValue[]> {
  logger.info(
    {
      service: 'daily-totals-service',
      userId,
      date,
      mealIds: mealIds?.length || 'all',
    },
    'Calculating daily totals from meal items'
  );

  const startTime = Date.now();

  try {
    // Step 1: Fetch active meals for the date (optionally filtered by mealIds)
    let targetMealIds: string[];
    // Filled in by the unfiltered path below, which gets meals AND items in
    // one query; the filtered path fetches items separately (step 2).
    let preloadedItems: Array<{ id: string; foodId: string; portionSize: string; portionType: string }> | null = null;

    if (mealIds && mealIds.length > 0) {
      // Use provided mealIds directly (for meal selection filtering)
      // Verify they belong to the user and are active
      const validMeals = await db
        .select({ id: mealLogs.id })
        .from(mealLogs)
        .where(
          and(
            eq(mealLogs.userId, userId),
            eq(mealLogs.isActive, true),
            inArray(mealLogs.id, mealIds)
          )
        );
      targetMealIds = validMeals.map((m) => m.id);
    } else {
      // All active meals for the date, joined to their items — one round
      // trip instead of two. (A meal with no items drops out of the join,
      // which changes nothing: no items means no totals either way.)
      const rows = await db
        .select({
          mealId: mealLogs.id,
          id: mealItems.id,
          foodId: mealItems.foodId,
          portionSize: mealItems.portionSize,
          portionType: mealItems.portionType,
        })
        .from(mealLogs)
        .innerJoin(mealItems, eq(mealItems.mealLogId, mealLogs.id))
        .where(and(eq(mealLogs.userId, userId), eq(mealLogs.date, date), eq(mealLogs.isActive, true)));
      targetMealIds = [...new Set(rows.map((r) => r.mealId))];
      preloadedItems = rows;
    }

    if (targetMealIds.length === 0) {
      logger.debug(
        {
          service: 'daily-totals-service',
          userId,
          date,
          mealIdsFilter: mealIds?.length || 'all',
        },
        'No active meals found'
      );
      return [];
    }

    // Step 2: Fetch all meal items for these meals (unless step 1 already did)
    const allItems =
      preloadedItems ??
      (await db
        .select({
          id: mealItems.id,
          foodId: mealItems.foodId,
          portionSize: mealItems.portionSize,
          portionType: mealItems.portionType,
        })
        .from(mealItems)
        .where(inArray(mealItems.mealLogId, targetMealIds)));

    const items = itemIds && itemIds.length > 0
      ? allItems.filter((it) => itemIds.includes(it.id))
      : allItems;

    if (items.length === 0) {
      logger.debug(
        {
          service: 'daily-totals-service',
          userId,
          date,
          mealCount: targetMealIds.length,
        },
        'No meal items found'
      );
      return [];
    }

    // Step 2.5: Expand composites to atoms.
    // Items pointing at composite foods with rows in `food_components` get
    // recursively decomposed into their constituent atoms (or composite-without-
    // components leaves), with grams scaled proportionally. Atoms pass through
    // unchanged. The downstream nutrient query then runs against atom IDs only.
    const expandedAtoms: ExpandedAtom[] = await expandFoodsToAtomsBatch(
      items.map((item) => ({
        foodId: item.foodId,
        // Treat portionSize as grams (the nutrient values are per 100g).
        // This matches the pre-existing assumption in the legacy aggregation path.
        grams: portionGrams(item.portionSize),
      }))
    );

    // Step 3: Each atom's nutrients per 100 g (merged_nutrients first, then
    // food_nutrient_values for compounds it lacks), then sum them by compound.
    // The summing is lib/nutrition/totals.ts — the same code the browser runs
    // for its instant recalculation, so the two can't drift apart.
    const foodIds = [...new Set(expandedAtoms.map((a) => a.foodId))];
    const vectors = await loadAtomVectors(foodIds);
    const results = computeCompoundValues(expandedAtoms, vectors);

    const durationMs = Date.now() - startTime;

    logger.info(
      {
        service: 'daily-totals-service',
        userId,
        date,
        mealCount: targetMealIds.length,
        itemCount: items.length,
        compoundCount: results.length,
        durationMs,
      },
      'Daily totals calculated successfully'
    );

    return results;
  } catch (error) {
    logger.error(
      {
        service: 'daily-totals-service',
        userId,
        date,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to calculate daily totals'
    );

    throw new Error('Failed to calculate daily totals: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Write an unfiltered day's totals to the PostgreSQL (and, if configured,
 * Redis) cache. Split out of getDailyTotals so POST /api/meals/sync can run
 * it after the response has gone out.
 *
 * Only ever call this with totals calculated from ALL of the day's active
 * meals — the cache row is not keyed by meal selection.
 */
export async function saveDailyTotalsCache(
  userId: string,
  date: string,
  response: DailyTotalsResponse
): Promise<void> {
  const cacheKey = `daily-totals:${userId}:${date}`;

  // Save to PostgreSQL cache
  await db
    .insert(dailyTotals)
    .values({
      userId,
      date,
      compounds: response.compounds as any,
      lastUpdated: response.lastUpdated,
      cacheKey,
    })
    .onConflictDoUpdate({
      target: [dailyTotals.userId, dailyTotals.date],
      set: {
        compounds: response.compounds as any,
        lastUpdated: response.lastUpdated,
        cacheKey,
      },
    });

  // Save to Redis cache (fault tolerant)
  if (redis) {
    try {
      await redis.set(cacheKey, JSON.stringify(response), { ex: 300 }); // 5 min TTL
    } catch {
      // Silently ignore Redis write failures
    }
  }
}

/**
 * Get daily totals (cached or calculate)
 * Checks Redis cache (5 min TTL) → PostgreSQL cache → Calculate fresh
 * Note: When mealIds filter is provided, cache is bypassed (filtered results are not cached)
 *
 * @param userId - User ID
 * @param date - Date (YYYY-MM-DD)
 * @param mealIds - Optional array of meal IDs to filter by (skips cache when provided)
 * @returns Daily totals with last updated timestamp
 */
export async function getDailyTotals(
  userId: string,
  date: string,
  mealIds?: string[],
  itemIds?: string[]
): Promise<DailyTotalsResponse> {
  const isFiltered = (mealIds && mealIds.length > 0) || (itemIds && itemIds.length > 0);

  logger.debug(
    {
      service: 'daily-totals-service',
      userId,
      date,
      mealIdsFilter: isFiltered ? (mealIds?.length ?? 0) + (itemIds?.length ?? 0) : 'all',
    },
    'Getting daily totals (with cache lookup)'
  );

  const cacheKey = `daily-totals:${userId}:${date}`;

  try {
    // Skip cache when filtering by specific meals (cache stores ALL meals for a date)
    if (!isFiltered) {
      // L1 Cache: Redis (5 min TTL) - fault tolerant
      if (redis) {
        try {
          const cached = await redis.get(cacheKey);

          if (cached) {
            logger.debug(
              {
                service: 'daily-totals-service',
                userId,
                date,
                cacheHit: 'redis',
              },
              'Daily totals cache hit (Redis)'
            );

            return JSON.parse(cached as string);
          }
        } catch (redisError) {
          logger.warn(
            {
              service: 'daily-totals-service',
              userId,
              date,
              error: redisError instanceof Error ? redisError.message : String(redisError),
            },
            'Redis cache lookup failed, falling back to PostgreSQL cache'
          );
        }
      }

      // L2 Cache: PostgreSQL daily_totals table
      const [dbCached] = await db
        .select()
        .from(dailyTotals)
        .where(and(eq(dailyTotals.userId, userId), eq(dailyTotals.date, date)))
        .limit(1);

      if (dbCached && dbCached.compounds) {
        logger.debug(
          {
            service: 'daily-totals-service',
            userId,
            date,
            cacheHit: 'postgresql',
          },
          'Daily totals cache hit (PostgreSQL)'
        );

        const response: DailyTotalsResponse = {
          date: dbCached.date,
          compounds: Array.isArray(dbCached.compounds) ? (dbCached.compounds as unknown as CompoundValue[]) : [],
          lastUpdated: dbCached.lastUpdated,
        };

        // Try to refresh Redis cache (fault tolerant)
        if (redis) {
          try {
            await redis.set(cacheKey, JSON.stringify(response), { ex: 300 }); // 5 min TTL
          } catch {
            // Silently ignore Redis write failures
          }
        }

        return response;
      }
    }

    // Cache miss or filtered: Calculate fresh
    logger.debug(
      {
        service: 'daily-totals-service',
        userId,
        date,
        cacheMiss: !isFiltered,
        filtered: isFiltered,
      },
      isFiltered ? 'Calculating filtered daily totals' : 'Daily totals cache miss - calculating fresh'
    );

    const compounds = await calculateDailyTotals(userId, date, mealIds, itemIds);

    const response: DailyTotalsResponse = {
      date,
      compounds,
      lastUpdated: new Date(),
    };

    // Only cache unfiltered results (all meals for date)
    if (!isFiltered) {
      await saveDailyTotalsCache(userId, date, response);
    }

    logger.info(
      {
        service: 'daily-totals-service',
        userId,
        date,
        compoundCount: compounds.length,
        filtered: isFiltered,
      },
      'Daily totals calculated' + (isFiltered ? ' (filtered, not cached)' : ' and cached')
    );

    return response;
  } catch (error) {
    logger.error(
      {
        service: 'daily-totals-service',
        userId,
        date,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to get daily totals'
    );

    throw new Error('Failed to get daily totals: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Invalidate daily totals cache
 * Called after meal mutations (create/update/delete)
 * Clears both Redis and PostgreSQL caches
 *
 * @param userId - User ID
 * @param date - Date (YYYY-MM-DD)
 */
export async function invalidateDailyTotals(userId: string, date: string): Promise<void> {
  logger.debug(
    {
      service: 'daily-totals-service',
      userId,
      date,
    },
    'Invalidating daily totals cache'
  );

  const cacheKey = `daily-totals:${userId}:${date}`;

  // Clear Redis cache (fault tolerant - don't block PostgreSQL if Redis fails)
  if (redis) {
    try {
      await redis.del(cacheKey);
      logger.debug(
        {
          service: 'daily-totals-service',
          userId,
          date,
          cache: 'redis',
        },
        'Redis cache cleared'
      );
    } catch (redisError) {
      // Redis failure shouldn't block PostgreSQL cache invalidation
      logger.warn(
        {
          service: 'daily-totals-service',
          userId,
          date,
          error: redisError instanceof Error ? redisError.message : String(redisError),
        },
        'Redis cache clear failed, continuing with PostgreSQL'
      );
    }
  }

  // Clear PostgreSQL cache (delete row) - this must always run
  try {
    await db.delete(dailyTotals).where(and(eq(dailyTotals.userId, userId), eq(dailyTotals.date, date)));

    logger.debug(
      {
        service: 'daily-totals-service',
        userId,
        date,
        cache: 'postgresql',
      },
      'PostgreSQL cache cleared'
    );

    logger.info(
      {
        service: 'daily-totals-service',
        userId,
        date,
      },
      'Daily totals cache invalidated successfully'
    );
  } catch (error) {
    logger.error(
      {
        service: 'daily-totals-service',
        userId,
        date,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to invalidate PostgreSQL cache'
    );

    // Don't throw - cache invalidation failure shouldn't break mutations
  }
}
