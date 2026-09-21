/**
 * Food catalog — every food a user may search, with its portions and how many
 * nutrients it has. Small enough (~100 foods today) to send whole, so the
 * manual-search UI can search and select entirely in the browser.
 */

import { db } from '@/db';
import { foods, foodPortions, mergedNutrients, foodNutrientValues } from '@/db/schema';
import { and, asc, count, eq, inArray, or } from 'drizzle-orm';

export async function loadFoodCatalog(userId: string) {
  const rows = await db
    .select({
      id: foods.id,
      name: foods.name,
      description: foods.description,
      foodCategoryId: foods.foodCategoryId,
    })
    .from(foods)
    .where(or(eq(foods.visibility, 'public'), and(eq(foods.visibility, 'private'), eq(foods.createdBy, userId))))
    .orderBy(asc(foods.name));

  const foodIds = rows.map((f) => f.id);

  const [portionRows, mergedCounts, enrichmentCounts] = await Promise.all([
    foodIds.length === 0
      ? []
      : db
          .select({
            id: foodPortions.id,
            foodId: foodPortions.foodId,
            description: foodPortions.description,
            gramWeight: foodPortions.gramWeight,
            isDefault: foodPortions.isDefault,
          })
          .from(foodPortions)
          .where(inArray(foodPortions.foodId, foodIds))
          .orderBy(asc(foodPortions.sortOrder)),
    foodIds.length === 0
      ? []
      : db
          .select({ foodId: mergedNutrients.foodId, n: count() })
          .from(mergedNutrients)
          .where(inArray(mergedNutrients.foodId, foodIds))
          .groupBy(mergedNutrients.foodId),
    foodIds.length === 0
      ? []
      : db
          .select({ foodId: foodNutrientValues.foodId, n: count() })
          .from(foodNutrientValues)
          .where(inArray(foodNutrientValues.foodId, foodIds))
          .groupBy(foodNutrientValues.foodId),
  ]);

  const portionsByFood = new Map<string, typeof portionRows>();
  for (const p of portionRows) {
    const list = portionsByFood.get(p.foodId) || [];
    list.push(p);
    portionsByFood.set(p.foodId, list);
  }

  const compoundCounts = new Map<string, number>();
  for (const row of mergedCounts) compoundCounts.set(row.foodId, (compoundCounts.get(row.foodId) || 0) + row.n);
  for (const row of enrichmentCounts) compoundCounts.set(row.foodId, (compoundCounts.get(row.foodId) || 0) + row.n);

  const catalog = rows.map((food) => ({
    id: food.id,
    name: food.name,
    description: food.description,
    category: food.foodCategoryId || undefined,
    // Every entry here is already in the `foods` table, so downstream
    // "add to meal" logic (which imports from USDA when this is false)
    // should never try to import a catalog-sourced selection.
    isImported: true,
    compoundCount: compoundCounts.get(food.id) || 0,
    portions: (portionsByFood.get(food.id) || [])
      // isDefault first, matching the portions endpoint's own ordering
      .slice()
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
      .map((p) => ({
        id: p.id,
        description: p.description,
        gramWeight: parseFloat(p.gramWeight),
        isDefault: p.isDefault,
      })),
  }));

  return catalog;
}
