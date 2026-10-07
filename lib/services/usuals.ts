/**
 * What Nutri remembers about a user's eating: the foods they log most, their
 * usual amount of each, and their saved meals — ranked into a few suggestions.
 *
 * Foods are worked out from the user's own log every time; nothing extra is
 * stored, so deleting entries (or the account) removes them from here too.
 * Saved meals come from lib/services/saved-meals.ts.
 */

import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { visibleFoods } from '@/lib/services/food-visibility';
import { listSavedMeals, type SavedMeal } from '@/lib/services/saved-meals';

/** How far back the log is read. */
const LOOKBACK_DAYS = 90;
/** Uses in this window decide the order. */
const RECENT_DAYS = 30;

export interface UsualFood {
  foodId: string;
  name: string;
  /** Usual amount: the most common grams + label the user logged it with. */
  grams: number;
  portion: string;
  uses: number;
  recentUses: number;
  /** YYYY-MM-DD */
  lastUsed: string;
}

export type Suggestion =
  | { kind: 'food'; foodId: string; name: string; grams: number; portion: string }
  | { kind: 'meal'; id: string; name: string; items: SavedMeal['items'] };

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
 * Pick the suggestions: foods and saved meals in one list, by uses in the last
 * 30 days, then by most recent use. A saved meal counts its uses only while it
 * has been used in the last 30 days (its count isn't kept per day). Anything
 * already logged on the day is left out — a meal once all its foods are.
 */
export function rankSuggestions(input: {
  foods: UsualFood[];
  meals: SavedMeal[];
  loggedToday: Set<string>;
  today: string;
  limit: number;
}): Suggestion[] {
  const { foods, meals, loggedToday, today, limit } = input;
  const recentCutoff = new Date(`${today}T00:00:00Z`).getTime() - RECENT_DAYS * 86_400_000;

  const scored: Array<{ score: number; last: number; s: Suggestion }> = [];
  for (const f of foods) {
    if (loggedToday.has(f.foodId)) continue;
    scored.push({
      score: f.recentUses,
      last: new Date(`${f.lastUsed}T00:00:00Z`).getTime(),
      s: { kind: 'food', foodId: f.foodId, name: f.name, grams: f.grams, portion: f.portion },
    });
  }
  for (const m of meals) {
    if (m.items.length === 0 || m.items.every((i) => loggedToday.has(i.foodId))) continue;
    const last = m.lastUsedAt ? m.lastUsedAt.getTime() : m.createdAt.getTime();
    scored.push({
      score: m.lastUsedAt && m.lastUsedAt.getTime() > recentCutoff ? m.useCount : 0,
      last,
      s: { kind: 'meal', id: m.id, name: m.name, items: m.items },
    });
  }

  return scored
    .sort((a, b) => b.score - a.score || b.last - a.last)
    .slice(0, limit)
    .map((x) => x.s);
}

/** Suggestions for one day, plus all saved meals (for My meals). */
export async function getQuickAdd(userId: string, date: string, limit = 5) {
  const [foods, meals, logged] = await Promise.all([
    getUsualFoods(userId, date),
    listSavedMeals(userId),
    db.execute(sql`
      SELECT DISTINCT i.food_id
      FROM meal_items i JOIN meal_logs l ON l.id = i.meal_log_id
      WHERE l.user_id = ${userId} AND l.is_active AND l.date = ${date}::date
    `) as unknown as Promise<Array<{ food_id: string }>>,
  ]);
  return {
    suggestions: rankSuggestions({
      foods,
      meals,
      loggedToday: new Set(logged.map((r) => r.food_id)),
      today: date,
      limit,
    }),
    meals,
  };
}
