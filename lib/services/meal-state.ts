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
import { loadFoodVectors } from './food-vectors';
import { packVectors, type VectorPack } from '@/lib/nutrition/wire';
import { getSymptomsForDate, toSymptomLogPayload } from './symptom-service';

// Daily values depend on (compound, age, sex), not on what was eaten, so the
// ones /analysis shows can be looked up while the totals are still computing.
const CORE_COMPOUND_IDS = CORE_COMPOUNDS.map((c) => c.id);

export async function loadDayState(args: {
  userId: string;
  date: string;
  age?: number;
  sex?: 'MALE' | 'FEMALE';
  /** Foods whose nutrient vectors the browser already holds — not sent again. */
  knownFoodIds?: string[];
  /** Also return the day's symptom logs. */
  withSymptoms?: boolean;
  /**
   * Skip calculating totals: just the meals, symptoms and food numbers. For
   * warming the browser's cache with neighbouring days, where the browser
   * calculates totals itself if the day is opened. `dailyTotals` is null.
   */
  skipTotals?: boolean;
}) {
  const { userId, date, age, sex } = args;
  const known = new Set(args.knownFoodIds ?? []);
  const lastUpdated = new Date();

  // All of the day's active meals — the same set GET /api/daily-totals uses
  // when no meal filter is given.
  const totals: Promise<DailyTotalsResponse> | null = args.skipTotals
    ? null
    : calculateDailyTotals(userId, date).then((compounds) => ({ date, compounds, lastUpdated }));

  // The nutrient numbers behind the day's foods, so the browser can recalculate
  // totals itself (see lib/nutrition/totals.ts). Only for foods it lacks —
  // after a day's first load that is none, and nothing extra is sent.
  const mealsAndVectors = getMealsForDate(userId, date).then(async (meals) => {
    const needed = [...new Set(meals.flatMap((m) => m.items.map((i) => i.foodId)))].filter((id) => !known.has(id));
    const vectors: VectorPack | undefined =
      needed.length > 0 ? packVectors(await loadFoodVectors(needed)) : undefined;
    return { meals, vectors };
  });

  const [{ meals, vectors }, dailyTotals, symptoms] = await Promise.all([
    mealsAndVectors,
    totals
      ? buildDailyTotalsPayload({ userId, totals, age, sex, prefetchDvCompoundIds: CORE_COMPOUND_IDS })
      : Promise.resolve(null),
    args.withSymptoms ? getSymptomsForDate(userId, date) : Promise.resolve(null),
  ]);

  return {
    vectors,
    symptoms: symptoms ? symptoms.map(toSymptomLogPayload) : undefined,
    meals: meals.map((meal) => ({
      id: meal.id,
      date: meal.date,
      mealType: meal.mealType,
      loggedAt: meal.loggedAt.toISOString(),
      items: meal.items,
    })),
    dailyTotals,
    /** Persist the totals to the cache. Call after the response has been sent. */
    saveCache: async () => {
      if (totals) await saveDailyTotalsCache(userId, date, await totals);
    },
  };
}
