/**
 * Food Expansion Service
 *
 * Recursive resolution of composite foods into their constituent atoms (whole foods).
 *
 * When a meal item references a composite food that has rows in `food_components`,
 * expansion walks the recipe down to atoms, scaling each component's mass
 * proportionally to the meal's logged grams. The result is a flat list of
 * (foodId, grams) pairs that downstream nutrient aggregation can query directly.
 *
 * Backward compatibility: composites without components are treated as leaves —
 * their stored `food_nutrient_values` / `merged_nutrients` rows are used as-is,
 * preserving the legacy single-row-with-measured-nutrients path used by external
 * databases like USDA FDC.
 */

import { db } from '@/db';
import { foodComponents } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface ExpandedAtom {
  foodId: string;
  grams: number;
}

interface ComponentRow {
  compositeFoodId: string;
  componentFoodId: string;
  grams: string; // numeric arrives as string from drizzle
}

/**
 * Expand a single food into its atom contributions.
 *
 * @param foodId - The food being logged (atom, branded composite, or personal recipe).
 * @param grams - Mass of the food in this meal entry.
 * @returns A flat list of {foodId, grams}. Returns [{foodId, grams}] unchanged for
 *          atoms and for composites that have no components rows.
 */
export async function expandFoodToAtoms(
  foodId: string,
  grams: number
): Promise<ExpandedAtom[]> {
  return expandWithVisited(foodId, grams, new Set());
}

/**
 * Batch expansion for multiple meal items in one pass.
 * Fetches all relevant component rows up front to avoid N+1 queries on the
 * common case of a meal containing many composites.
 *
 * @param items - Meal entries to expand.
 * @returns Flat list of atom contributions across all items combined.
 */
export async function expandFoodsToAtomsBatch(
  items: Array<{ foodId: string; grams: number }>
): Promise<ExpandedAtom[]> {
  if (items.length === 0) return [];

  const seedIds = [...new Set(items.map((i) => i.foodId))];
  const componentMap = await loadComponentTree(seedIds);

  const result: ExpandedAtom[] = [];
  for (const item of items) {
    const expanded = expandFromMap(item.foodId, item.grams, componentMap, new Set());
    result.push(...expanded);
  }
  return result;
}

// ─── Internal helpers ───────────────────────────────────────────────────────

async function expandWithVisited(
  foodId: string,
  grams: number,
  visited: Set<string>
): Promise<ExpandedAtom[]> {
  if (visited.has(foodId)) {
    logger.warn(
      { service: 'food-expansion', foodId },
      'Cycle detected in composite decomposition; treating as leaf'
    );
    return [{ foodId, grams }];
  }
  visited.add(foodId);

  const components = await db
    .select({
      componentFoodId: foodComponents.componentFoodId,
      grams: foodComponents.grams,
    })
    .from(foodComponents)
    .where(eq(foodComponents.compositeFoodId, foodId));

  if (components.length === 0) {
    return [{ foodId, grams }];
  }

  const totalRecipeGrams = components.reduce(
    (sum, c) => sum + parseFloat(c.grams),
    0
  );
  if (totalRecipeGrams <= 0) {
    logger.warn(
      { service: 'food-expansion', foodId },
      'Composite has zero total recipe grams; treating as leaf'
    );
    return [{ foodId, grams }];
  }

  const out: ExpandedAtom[] = [];
  for (const c of components) {
    const cGrams = parseFloat(c.grams);
    const proportional = (cGrams / totalRecipeGrams) * grams;
    const sub = await expandWithVisited(c.componentFoodId, proportional, new Set(visited));
    out.push(...sub);
  }
  return out;
}

/**
 * Load the entire reachable component tree starting from seed food IDs.
 * Iteratively follows component links until no new composite IDs are discovered.
 */
async function loadComponentTree(seedIds: string[]): Promise<Map<string, ComponentRow[]>> {
  const componentMap = new Map<string, ComponentRow[]>();
  let frontier = seedIds;

  while (frontier.length > 0) {
    const rows = await db
      .select({
        compositeFoodId: foodComponents.compositeFoodId,
        componentFoodId: foodComponents.componentFoodId,
        grams: foodComponents.grams,
      })
      .from(foodComponents)
      .where(inArray(foodComponents.compositeFoodId, frontier));

    if (rows.length === 0) break;

    const nextFrontier: string[] = [];
    for (const row of rows) {
      const list = componentMap.get(row.compositeFoodId) ?? [];
      list.push(row);
      componentMap.set(row.compositeFoodId, list);
      if (!componentMap.has(row.componentFoodId)) {
        nextFrontier.push(row.componentFoodId);
      }
    }
    frontier = [...new Set(nextFrontier)];
  }

  return componentMap;
}

function expandFromMap(
  foodId: string,
  grams: number,
  componentMap: Map<string, ComponentRow[]>,
  visited: Set<string>
): ExpandedAtom[] {
  if (visited.has(foodId)) {
    logger.warn(
      { service: 'food-expansion', foodId },
      'Cycle detected in composite decomposition; treating as leaf'
    );
    return [{ foodId, grams }];
  }

  const components = componentMap.get(foodId);
  if (!components || components.length === 0) {
    return [{ foodId, grams }];
  }

  const totalRecipeGrams = components.reduce((sum, c) => sum + parseFloat(c.grams), 0);
  if (totalRecipeGrams <= 0) {
    return [{ foodId, grams }];
  }

  const next = new Set(visited);
  next.add(foodId);

  const out: ExpandedAtom[] = [];
  for (const c of components) {
    const cGrams = parseFloat(c.grams);
    const proportional = (cGrams / totalRecipeGrams) * grams;
    out.push(...expandFromMap(c.componentFoodId, proportional, componentMap, next));
  }
  return out;
}
