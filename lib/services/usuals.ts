/**
 * What Nutri remembers about a user's eating: the foods they log most and their
 * usual amount of each, read from their own log every time — nothing extra is
 * stored, so deleting entries (or the account) removes them from here too.
 *
 * The server sends a pool of candidates once; the browser picks the few to show
 * (lib/services/suggestion-ranking.ts), so adding and removing foods never waits
 * on a request.
 */

import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { visibleFoods } from '@/lib/services/food-visibility';
import { listSavedMeals } from '@/lib/services/saved-meals';
import type { UsualFood } from '@/lib/services/suggestion-ranking';

export type { UsualFood };

/** How far back the log is read. */
const LOOKBACK_DAYS = 90;
/** Uses in this window decide the order. */
const RECENT_DAYS = 30;
/** Enough that 5 remain after a full day's foods are left out. */
const POOL_FOODS = 25;

export async function getUsualFoods(userId: string, today: string): Promise<UsualFood[]> {
  const rows = (await db.execute(sql`
    WITH items AS (
      SELECT i.food_id, i.portion_size, i.portion_type, l.date
      FROM meal_items i
      JOIN meal_logs l ON l.id = i.meal_log_id
      WHERE l.user_id = ${userId}
        AND l.is_active
        AND l.date >  ${today}::date - ${LOOKBACK_DAYS}::int
        AND l.date <= ${today}::date
    )
    SELECT food_id,
           count(*)::int AS uses,
           count(*) FILTER (WHERE date > ${today}::date - ${RECENT_DAYS}::int)::int AS recent_uses,
           max(date)::text AS last_used,
           mode() WITHIN GROUP (ORDER BY portion_size::text || '|' || portion_type) AS usual
    FROM items
    GROUP BY food_id
  `)) as unknown as Array<{ food_id: string; uses: number; recent_uses: number; last_used: string; usual: string }>;

  const names = await visibleFoods(userId, rows.map((r) => r.food_id));
  return rows
    .filter((r) => names.has(r.food_id))
    .map((r) => {
      const cut = r.usual.indexOf('|');
      return {
        foodId: r.food_id,
        name: names.get(r.food_id)!,
        grams: Number(r.usual.slice(0, cut)),
        portion: r.usual.slice(cut + 1),
        uses: r.uses,
        recentUses: r.recent_uses,
        lastUsed: r.last_used,
      };
    });
}

/**
 * The candidates for the food list's suggestions: the user's most-used foods
 * (by uses in the last 30 days, then most recent) and all their saved meals.
 */
export async function getQuickAddPool(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const [foods, meals] = await Promise.all([getUsualFoods(userId, today), listSavedMeals(userId)]);
  foods.sort((a, b) => b.recentUses - a.recentUses || b.lastUsed.localeCompare(a.lastUsed));
  return { foods: foods.slice(0, POOL_FOODS), meals };
}
