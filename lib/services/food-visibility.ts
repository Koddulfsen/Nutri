/**
 * Which foods a user may log or build on: every public food, and their own
 * private ones. Any id outside that — another user's private recipe, a made-up
 * uuid — is refused, not merely failed by a foreign key.
 */

import { and, eq, inArray, or } from 'drizzle-orm';
import { db } from '@/db';
import { foods } from '@/db/schema';

/** The visible foods among `foodIds`, as id → name. */
export async function visibleFoods(userId: string, foodIds: string[]): Promise<Map<string, string>> {
  const ids = [...new Set(foodIds)];
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({ id: foods.id, name: foods.name })
    .from(foods)
    .where(
      and(
        inArray(foods.id, ids),
        or(eq(foods.visibility, 'public'), and(eq(foods.visibility, 'private'), eq(foods.createdBy, userId)))
      )
    );
  return new Map(rows.map((r) => [r.id, r.name]));
}

/** True when every id is a food this user may see. */
export async function allFoodsVisible(userId: string, foodIds: string[]): Promise<boolean> {
  return (await visibleFoods(userId, foodIds)).size === new Set(foodIds).size;
}
