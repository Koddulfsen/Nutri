/**
 * Day state — everything /analysis shows for one date: the meals with their
 * items, and the per-compound daily totals with % of target.
 *
 * Built for POST /api/meals/sync. The client used to get this as three
 * separate serverless calls in a row (change → meals → totals), each
 * re-checking auth and each able to cold-start. Here the meals list and the
 * totals are loaded at the same time, in one call.
 */

import { CORE_COMPOUNDS } from '@/lib/data/core-compounds';
import { getMealsForDate } from './meal-service';
import { calculateDailyTotals, saveDailyTotalsCache, type DailyTotalsResponse } from './daily-totals-service';
import { buildDailyTotalsPayload } from './daily-totals-payload';

// Daily values depend on (compound, age, sex), not on what was eaten, so the
// ones /analysis shows can be looked up while the totals are still computing.
const CORE_COMPOUND_IDS = CORE_COMPOUNDS.map((c) => c.id);

export async function loadDayState(args: {
  userId: string;
  date: string;
  age?: number;
  sex?: 'MALE' | 'FEMALE';
}) {
  const { userId, date, age, sex } = args;
  const lastUpdated = new Date();

  // All of the day's active meals — the same set GET /api/daily-totals uses
  // when no meal filter is given.
  const totals: Promise<DailyTotalsResponse> = calculateDailyTotals(userId, date).then((compounds) => ({
    date,
    compounds,
    lastUpdated,
  }));

  const [meals, dailyTotals] = await Promise.all([
    getMealsForDate(userId, date),
    buildDailyTotalsPayload({ userId, totals, age, sex, prefetchDvCompoundIds: CORE_COMPOUND_IDS }),
  ]);

  return {
    meals: meals.map((meal) => ({
      id: meal.id,
      date: meal.date,
      mealType: meal.mealType,
      loggedAt: meal.loggedAt.toISOString(),
      items: meal.items,
    })),
    dailyTotals,
    /** Persist the totals to the cache. Call after the response has been sent. */
    saveCache: async () => saveDailyTotalsCache(userId, date, await totals),
  };
}
