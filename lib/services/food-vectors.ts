/**
 * Food vectors — each food's nutrients per 100 g, resolved to one value per
 * compound. This is the data both the server's totals calculation and the
 * browser's instant recalculation are built on (see lib/nutrition/totals.ts).
 */

import { db } from '@/db';
import { mergedNutrients, foodNutrientValues, compounds, foodComponents } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { expandFoodToAtoms } from './food-expansion';
import { flattenToVector, type FoodVector, type NutrientRow } from '@/lib/nutrition/totals';

const asNumber = (value: unknown): number => {
  const n = parseFloat(String(value ?? '0'));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Vectors for foods taken as they are (no recipe expansion), one entry per
 * food that has any nutrient rows. Rows are sorted by compound id so results
 * don't depend on the order the database happened to return them in.
 */
export async function loadAtomVectors(foodIds: string[]): Promise<Map<string, FoodVector>> {
  const vectors = new Map<string, FoodVector>();
  if (foodIds.length === 0) return vectors;

  // Two independent queries — run them side by side.
  // merged_nutrients (USDA/CNF data) and food_nutrient_values (enriched
  // FooDB/Phenol-Explorer data).
  const [mergedRows, enrichedRows] = await Promise.all([
    db
      .select({
        foodId: mergedNutrients.foodId,
        compoundId: mergedNutrients.compoundId,
        compoundName: compounds.name,
        value: mergedNutrients.averageValue,
        unit: mergedNutrients.unit,
        sourceCount: mergedNutrients.sourceCount,
      })
      .from(mergedNutrients)
      .leftJoin(compounds, eq(mergedNutrients.compoundId, compounds.id))
      .where(inArray(mergedNutrients.foodId, foodIds)),
    db
      .select({
        foodId: foodNutrientValues.foodId,
        compoundId: foodNutrientValues.compoundId,
        compoundName: compounds.name,
        value: foodNutrientValues.value,
        unit: foodNutrientValues.unit,
        confidence: foodNutrientValues.confidenceFinal,
      })
      .from(foodNutrientValues)
      .leftJoin(compounds, eq(foodNutrientValues.compoundId, compounds.id))
      .where(inArray(foodNutrientValues.foodId, foodIds)),
  ]);

  const add = (foodId: string, row: NutrientRow) => {
    const list = vectors.get(foodId);
    if (list) list.push(row);
    else vectors.set(foodId, [row]);
  };

  // (foodId, compoundId) pairs that exist in merged_nutrients — these take
  // priority over food_nutrient_values.
  const mergedKeys = new Set<string>();
  for (const nv of mergedRows) {
    if (!nv.compoundId) continue; // legacy data with no compound
    mergedKeys.add(`${nv.foodId}:${nv.compoundId}`);
    add(nv.foodId, {
      compoundId: nv.compoundId,
      name: nv.compoundName || '',
      value: asNumber(nv.value),
      unit: nv.unit,
      sourceCount: nv.sourceCount || 1,
    });
  }

  // Enriched values only for compounds NOT already in merged_nutrients.
  for (const nv of enrichedRows) {
    if (mergedKeys.has(`${nv.foodId}:${nv.compoundId}`)) continue;

    // food_nutrient_values uses mg/100g — normalize to grams.
    let value = asNumber(nv.value);
    let unit = nv.unit || 'mg/100g';
    if (unit.toLowerCase().includes('mg')) {
      value = value / 1000;
      unit = 'g';
    }
    add(nv.foodId, {
      compoundId: nv.compoundId,
      name: nv.compoundName || '',
      value,
      unit,
      sourceCount: nv.confidence || 1,
    });
  }

  for (const list of vectors.values()) {
    list.sort((a, b) => (a.compoundId < b.compoundId ? -1 : a.compoundId > b.compoundId ? 1 : 0));
  }
  return vectors;
}

/**
 * A vector for each requested food as a user would log it: a recipe
 * (composite) is flattened into one vector of its own. Every requested food
 * gets an entry, empty if it has no nutrient data — so the caller can tell
 * "loaded, nothing there" apart from "not loaded yet".
 */
export async function loadFoodVectors(foodIds: string[]): Promise<Record<string, FoodVector>> {
  const ids = [...new Set(foodIds)];
  const out: Record<string, FoodVector> = {};
  if (ids.length === 0) return out;

  const [atomVectors, compositeRows] = await Promise.all([
    loadAtomVectors(ids),
    db
      .selectDistinct({ id: foodComponents.compositeFoodId })
      .from(foodComponents)
      .where(inArray(foodComponents.compositeFoodId, ids)),
  ]);

  for (const id of ids) out[id] = atomVectors.get(id) ?? [];

  // Recipes: expand for exactly 100 g, load the ingredients, flatten.
  const compositeIds = compositeRows.map((r) => r.id);
  if (compositeIds.length > 0) {
    const expansions = await Promise.all(compositeIds.map((id) => expandFoodToAtoms(id, 100)));
    const missing = [...new Set(expansions.flat().map((a) => a.foodId))].filter((id) => !atomVectors.has(id));
    const extra = missing.length > 0 ? await loadAtomVectors(missing) : new Map<string, FoodVector>();
    const all = new Map([...atomVectors, ...extra]);
    compositeIds.forEach((id, i) => {
      out[id] = flattenToVector(
        expansions[i].map((a) => ({ foodId: a.foodId, grams: a.grams })),
        all
      );
    });
  }

  return out;
}
