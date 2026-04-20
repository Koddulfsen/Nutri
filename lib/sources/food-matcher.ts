import { db } from '@/db';
import { sql } from 'drizzle-orm';

// Helper to extract rows from db.execute result (handles both formats)
function getRows(result: any): any[] {
  return result?.rows ?? result ?? [];
}

export type ExternalSource = 'foodb' | 'phenol_explorer';

export interface FoodMatch {
  source: ExternalSource;
  externalId: string;
  externalName: string;
  confidence: number;
  method: 'exact' | 'fuzzy' | 'scientific_name';
}

interface MatchResult {
  matches: FoodMatch[];
  bestMatch: FoodMatch | null;
}

const FUZZY_THRESHOLD = 0.6;

/**
 * Find matching foods in external sources (FooDB, Phenol-Explorer)
 */
export async function matchFood(foodName: string, scientificName?: string): Promise<MatchResult> {
  const matches: FoodMatch[] = [];

  // Search all sources in parallel
  const [foodbMatches, phenolMatches] = await Promise.all([
    searchFooDB(foodName, scientificName),
    searchPhenolExplorer(foodName, scientificName),
  ]);

  matches.push(...foodbMatches, ...phenolMatches);

  // Sort by confidence
  matches.sort((a, b) => b.confidence - a.confidence);

  return {
    matches,
    bestMatch: matches.length > 0 ? matches[0] : null,
  };
}

/**
 * Search FooDB for matching foods
 */
async function searchFooDB(foodName: string, scientificName?: string): Promise<FoodMatch[]> {
  const matches: FoodMatch[] = [];
  const normalizedName = foodName.toLowerCase().trim();

  // 1. Exact name match
  const exactMatches = await db.execute(sql`
    SELECT foodb_id, name, name_scientific,
           1.0 as confidence, 'exact' as method
    FROM source_foodb_foods
    WHERE LOWER(name) = ${normalizedName}
    LIMIT 5
  `);

  for (const row of getRows(exactMatches)) {
    matches.push({
      source: 'foodb',
      externalId: String(row.foodb_id),
      externalName: String(row.name),
      confidence: 1.0,
      method: 'exact',
    });
  }

  // 2. Scientific name match (if provided and no exact match)
  if (scientificName && matches.length === 0) {
    const sciMatches = await db.execute(sql`
      SELECT foodb_id, name, name_scientific,
             0.95 as confidence, 'scientific_name' as method
      FROM source_foodb_foods
      WHERE LOWER(name_scientific) LIKE ${`%${scientificName.toLowerCase()}%`}
      LIMIT 5
    `);

    for (const row of getRows(sciMatches)) {
      matches.push({
        source: 'foodb',
        externalId: String(row.foodb_id),
        externalName: String(row.name),
        confidence: 0.95,
        method: 'scientific_name',
      });
    }
  }

  // 3. Fuzzy match (if no exact matches)
  if (matches.length === 0) {
    const fuzzyMatches = await db.execute(sql`
      SELECT foodb_id, name,
             similarity(LOWER(name), ${normalizedName}) as sim
      FROM source_foodb_foods
      WHERE similarity(LOWER(name), ${normalizedName}) > ${FUZZY_THRESHOLD}
      ORDER BY sim DESC
      LIMIT 5
    `);

    for (const row of getRows(fuzzyMatches)) {
      matches.push({
        source: 'foodb',
        externalId: String(row.foodb_id),
        externalName: String(row.name),
        confidence: Number(row.sim),
        method: 'fuzzy',
      });
    }
  }

  return matches;
}

/**
 * Search Phenol-Explorer for matching foods
 */
async function searchPhenolExplorer(foodName: string, scientificName?: string): Promise<FoodMatch[]> {
  const matches: FoodMatch[] = [];
  const normalizedName = foodName.toLowerCase().trim();

  // 1. Exact name match
  const exactMatches = await db.execute(sql`
    SELECT phenol_id, name, scientific_name,
           1.0 as confidence
    FROM source_phenol_foods
    WHERE LOWER(name) = ${normalizedName}
    LIMIT 5
  `);

  for (const row of getRows(exactMatches)) {
    matches.push({
      source: 'phenol_explorer',
      externalId: String(row.phenol_id),
      externalName: String(row.name),
      confidence: 1.0,
      method: 'exact',
    });
  }

  // 2. Scientific name match
  if (scientificName && matches.length === 0) {
    const sciMatches = await db.execute(sql`
      SELECT phenol_id, name, scientific_name,
             0.95 as confidence
      FROM source_phenol_foods
      WHERE scientific_name IS NOT NULL
        AND LOWER(scientific_name) LIKE ${`%${scientificName.toLowerCase()}%`}
      LIMIT 5
    `);

    for (const row of getRows(sciMatches)) {
      matches.push({
        source: 'phenol_explorer',
        externalId: String(row.phenol_id),
        externalName: String(row.name),
        confidence: 0.95,
        method: 'scientific_name',
      });
    }
  }

  // 3. Fuzzy match
  if (matches.length === 0) {
    const fuzzyMatches = await db.execute(sql`
      SELECT phenol_id, name,
             similarity(LOWER(name), ${normalizedName}) as sim
      FROM source_phenol_foods
      WHERE similarity(LOWER(name), ${normalizedName}) > ${FUZZY_THRESHOLD}
      ORDER BY sim DESC
      LIMIT 5
    `);

    for (const row of getRows(fuzzyMatches)) {
      matches.push({
        source: 'phenol_explorer',
        externalId: String(row.phenol_id),
        externalName: String(row.name),
        confidence: Number(row.sim),
        method: 'fuzzy',
      });
    }
  }

  return matches;
}

/**
 * Save food mappings to the database
 */
export async function saveFoodMappings(
  nutriFoodId: string,
  matches: FoodMatch[]
): Promise<void> {
  for (const match of matches) {
    await db.execute(sql`
      INSERT INTO external_food_mappings (
        food_id, external_source, external_id, external_name,
        match_status, match_confidence, match_method, matched_at
      ) VALUES (
        ${nutriFoodId},
        ${match.source},
        ${match.externalId},
        ${match.externalName},
        'auto_matched',
        ${match.confidence},
        ${match.method},
        NOW()
      )
      ON CONFLICT (external_source, external_id)
      DO UPDATE SET
        food_id = ${nutriFoodId},
        match_status = 'auto_matched',
        match_confidence = ${match.confidence},
        match_method = ${match.method},
        matched_at = NOW()
    `);
  }
}
