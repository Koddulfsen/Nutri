import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { matchFood, saveFoodMappings, type FoodMatch } from './food-matcher';

// Helper to extract rows from db.execute result (handles both formats)
function getRows(result: any): any[] {
  return result?.rows ?? result ?? [];
}

export interface CompoundValue {
  compoundId: string;
  compoundName: string;
  value: number;
  unit: string;
  source: string;
  confidence: number;
}

export interface EnrichmentResult {
  foodId: string;
  foodName: string;
  matchesFound: number;
  compoundsAdded: number;
  compounds: CompoundValue[];
  sources: string[];
}

/**
 * Enrich a food with compound data from external sources
 */
export async function enrichFood(
  foodId: string,
  foodName: string,
  scientificName?: string
): Promise<EnrichmentResult> {
  // 1. Find matching foods in external sources
  const { matches } = await matchFood(foodName, scientificName);

  if (matches.length === 0) {
    return {
      foodId,
      foodName,
      matchesFound: 0,
      compoundsAdded: 0,
      compounds: [],
      sources: [],
    };
  }

  // 2. Save the food mappings
  await saveFoodMappings(foodId, matches);

  // 3. Get compound values from each matched source
  const allCompounds: CompoundValue[] = [];
  const sources = new Set<string>();

  for (const match of matches) {
    const compounds = await getCompoundsFromMatch(match);
    allCompounds.push(...compounds);
    if (compounds.length > 0) {
      sources.add(match.source);
    }
  }

  // 4. Deduplicate compounds (keep highest confidence)
  const deduped = deduplicateCompounds(allCompounds);

  // 5. Save to food_nutrient_values
  let compoundsAdded = 0;
  for (const compound of deduped) {
    const saved = await saveCompoundValue(foodId, compound);
    if (saved) compoundsAdded++;
  }

  return {
    foodId,
    foodName,
    matchesFound: matches.length,
    compoundsAdded,
    compounds: deduped,
    sources: Array.from(sources),
  };
}

/**
 * Get compound values from a matched external food
 */
async function getCompoundsFromMatch(match: FoodMatch): Promise<CompoundValue[]> {
  const compounds: CompoundValue[] = [];

  switch (match.source) {
    case 'foodb':
      return getCompoundsFromFooDB(match.externalId, match.confidence);
    case 'phenol_explorer':
      return getCompoundsFromPhenol(match.externalId, match.confidence);
    default:
      return compounds;
  }
}

/**
 * Get compounds from FooDB content table
 */
async function getCompoundsFromFooDB(
  foodbFoodId: string,
  matchConfidence: number
): Promise<CompoundValue[]> {
  const results = await db.execute(sql`
    SELECT
      ecm.compound_id,
      c.name as compound_name,
      fc.standard_content as value,
      COALESCE(fc.orig_unit, 'mg/100g') as unit,
      ecm.match_confidence as compound_confidence
    FROM source_foodb_content fc
    JOIN external_compound_mappings ecm
      ON ecm.external_source = 'foodb'
      AND ecm.external_id = fc.foodb_compound_id::text
    JOIN compounds c ON c.id = ecm.compound_id
    WHERE fc.foodb_food_id = ${parseInt(foodbFoodId)}
      AND fc.standard_content IS NOT NULL
      AND fc.standard_content > 0
      AND ecm.match_status = 'auto_matched'
  `);

  return getRows(results).map((row) => ({
    compoundId: String(row.compound_id),
    compoundName: String(row.compound_name),
    value: Number(row.value),
    unit: String(row.unit),
    source: 'foodb',
    confidence: matchConfidence * Number(row.compound_confidence || 1),
  }));
}

/**
 * Get compounds from Phenol-Explorer content table
 */
async function getCompoundsFromPhenol(
  phenolFoodId: string,
  matchConfidence: number
): Promise<CompoundValue[]> {
  const results = await db.execute(sql`
    SELECT
      ecm.compound_id,
      c.name as compound_name,
      pc.content_mean as value,
      COALESCE(pc.unit, 'mg/100g') as unit,
      ecm.match_confidence as compound_confidence
    FROM source_phenol_content pc
    JOIN external_compound_mappings ecm
      ON ecm.external_source = 'phenol_explorer'
      AND ecm.external_id = pc.phenol_compound_id::text
    JOIN compounds c ON c.id = ecm.compound_id
    WHERE pc.phenol_food_id = ${parseInt(phenolFoodId)}
      AND pc.content_mean IS NOT NULL
      AND pc.content_mean > 0
      AND ecm.match_status = 'auto_matched'
  `);

  return getRows(results).map((row) => ({
    compoundId: String(row.compound_id),
    compoundName: String(row.compound_name),
    value: Number(row.value),
    unit: String(row.unit),
    source: 'phenol_explorer',
    confidence: matchConfidence * Number(row.compound_confidence || 1),
  }));
}

/**
 * Convert various units to mg/100g
 */
function convertToMgPer100g(value: number, unit: string): number {
  const unitLower = unit.toLowerCase();

  if (unitLower === 'ppm' || unitLower === 'mg/kg') {
    // ppm = mg/kg, so mg/100g = ppm / 10
    return value / 10;
  }
  if (unitLower === 'mg/100g' || unitLower === 'mg/100 g') {
    return value;
  }
  if (unitLower === 'g/100g' || unitLower === 'g/100 g') {
    return value * 1000;
  }
  if (unitLower === 'ug/100g' || unitLower === 'µg/100g' || unitLower === 'mcg/100g') {
    return value / 1000;
  }
  if (unitLower === '%') {
    return value * 1000; // % = g/100g
  }

  // Default: assume it's already mg/100g
  return value;
}

/**
 * Deduplicate compounds - keep highest confidence value per compound
 */
function deduplicateCompounds(compounds: CompoundValue[]): CompoundValue[] {
  const byCompound = new Map<string, CompoundValue>();

  for (const compound of compounds) {
    const existing = byCompound.get(compound.compoundId);
    if (!existing || compound.confidence > existing.confidence) {
      byCompound.set(compound.compoundId, compound);
    }
  }

  return Array.from(byCompound.values());
}

/**
 * Save a compound value to food_nutrient_values
 */
async function saveCompoundValue(
  foodId: string,
  compound: CompoundValue
): Promise<boolean> {
  try {
    // Check if this compound already has a value for this food
    const existing = await db.execute(sql`
      SELECT food_id FROM food_nutrient_values
      WHERE food_id = ${foodId}::uuid AND compound_id = ${compound.compoundId}::uuid
    `);

    if (getRows(existing).length > 0) {
      // Don't overwrite existing values (could be from primary source like USDA)
      return false;
    }

    // Insert new value with default confidence values
    await db.execute(sql`
      INSERT INTO food_nutrient_values (
        food_id, compound_id, value, unit, source,
        confidence_l1, confidence_l2, confidence_l3, confidence_l4, confidence_final
      ) VALUES (
        ${foodId}::uuid,
        ${compound.compoundId}::uuid,
        ${compound.value},
        ${compound.unit},
        ${compound.source},
        3, 3, 3, 3, 3
      )
    `);

    return true;
  } catch (error) {
    console.error(`Failed to save compound ${compound.compoundName}:`, error);
    return false;
  }
}

/**
 * Quick lookup: check how many compounds we could add for a food
 */
export async function previewEnrichment(
  foodName: string,
  scientificName?: string
): Promise<{ matchCount: number; estimatedCompounds: number }> {
  const { matches } = await matchFood(foodName, scientificName);

  if (matches.length === 0) {
    return { matchCount: 0, estimatedCompounds: 0 };
  }

  let totalCompounds = 0;

  // Just count, don't fetch full data
  for (const match of matches.slice(0, 3)) {
    // Top 3 matches
    if (match.source === 'foodb') {
      const countResult = await db.execute(sql`
        SELECT COUNT(*) as cnt
        FROM source_foodb_content fc
        JOIN external_compound_mappings ecm
          ON ecm.external_source = 'foodb'
          AND ecm.external_id = fc.foodb_compound_id::text
        WHERE fc.foodb_food_id = ${parseInt(match.externalId)}
          AND ecm.match_status = 'auto_matched'
      `);
      const rows = getRows(countResult);
      totalCompounds += Number(rows[0]?.cnt || 0);
    }
  }

  return {
    matchCount: matches.length,
    estimatedCompounds: totalCompounds,
  };
}
