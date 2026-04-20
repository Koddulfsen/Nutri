/**
 * New Zealand FOODfiles Food Composition Database Client
 *
 * Purpose: Typed client for FOODfiles staging tables
 * Pattern: Database query client for local staging data
 * Source: Plant & Food Research / Ministry of Health (New Zealand)
 *
 * Features:
 * - 2,857 New Zealand foods with text IDs
 * - 434 nutrients with text codes (PROT, NA, F18D2CN6)
 * - 571,495 nutrient content values
 *
 * Data Structure:
 * - source_foodfiles_foods: Food metadata (food_id text, name, short_name)
 * - source_foodfiles_nutrients: Nutrient definitions (nutrient_code, name, unit)
 * - source_foodfiles_content: Food-nutrient values (long format)
 *
 * Key design: nutrient_code is text used directly as compound_sources external_id.
 * No indirection needed — join goes straight through nutrient_code (same as NEVO).
 *
 * Generated: 2026-02-07
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { wordMatchSQL } from '@/lib/utils/search-words';

/**
 * FOODfiles staging table food result
 */
export interface FoodfilesStagingFood {
  foodId: string;
  name: string;
  shortName: string | null;
}

/**
 * FOODfiles staging table nutrient result (with Nutri compound mapping)
 */
export interface FoodfilesStagingNutrient {
  nutrientCode: string;
  name: string;
  unit: string;
  sourceUnit: string;
  value: number;
  compoundId: string | null;
  nutriCompoundName: string | null;
}

/**
 * FOODfiles Staging Client
 * Fetches data from local staging tables
 */
class FoodfilesStagingClient {
  /**
   * Search foods by name in staging table
   */
  async searchFoods(query: string, limit: number = 20): Promise<FoodfilesStagingFood[]> {
    const startTime = Date.now();

    try {
      const results = await db.execute<{
        food_id: string;
        name: string;
        short_name: string | null;
      }>(
        sql`SELECT food_id, name, short_name FROM source_foodfiles_foods WHERE `
          .append(wordMatchSQL('name', query))
          .append(sql` ORDER BY CASE WHEN LOWER(name) = LOWER(${query}) THEN 0 ELSE 1 END, name ASC LIMIT ${limit}`)
      );

      const rows = (results as any).rows ?? results;
      const foods = rows.map((row: any) => ({
        foodId: row.food_id,
        name: row.name,
        shortName: row.short_name,
      }));

      logger.debug(
        {
          service: 'foodfiles-staging',
          query,
          count: foods.length,
          durationMs: Date.now() - startTime,
        },
        'FOODfiles staging search completed'
      );

      return foods;
    } catch (error) {
      logger.error(
        {
          service: 'foodfiles-staging',
          error: error instanceof Error ? error.message : String(error),
        },
        'FOODfiles staging search failed'
      );
      throw error;
    }
  }

  /**
   * Get food by food ID from staging table
   */
  async getFood(foodId: string): Promise<FoodfilesStagingFood | null> {
    const results = await db.execute<{
      food_id: string;
      name: string;
      short_name: string | null;
    }>(sql`
      SELECT food_id, name, short_name
      FROM source_foodfiles_foods
      WHERE food_id = ${foodId}
    `);

    const rows = (results as any).rows ?? results;
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      foodId: row.food_id,
      name: row.name,
      shortName: row.short_name,
    };
  }

  /**
   * Get nutrients for a food from staging table
   * Returns nutrients with Nutri compound mapping where available
   *
   * Key: nutrient_code is used directly as compound_sources external_id
   * (no indirection — same pattern as NEVO)
   *
   * @param foodId - FOODfiles food ID (text, e.g., "A10001")
   */
  async getNutrients(foodId: string): Promise<FoodfilesStagingNutrient[]> {
    const startTime = Date.now();

    try {
      const results = await db.execute<{
        nutrient_code: string;
        name: string;
        unit: string;
        value: number;
        compound_id: string | null;
        nutri_compound_name: string | null;
        conversion_factor: string | null;
        canonical_unit: string | null;
      }>(sql`
        SELECT
          n.nutrient_code,
          n.name,
          n.unit,
          c.value,
          cs.compound_id,
          comp.name as nutri_compound_name,
          cs.conversion_factor,
          comp.unit as canonical_unit
        FROM source_foodfiles_content c
        JOIN source_foodfiles_nutrients n ON n.nutrient_code = c.nutrient_code
        LEFT JOIN compound_sources cs ON cs.external_id = c.nutrient_code
          AND cs.external_source = 'FOODFILES'
        LEFT JOIN compounds comp ON comp.id = cs.compound_id
        WHERE c.food_id = ${foodId}
          AND c.value IS NOT NULL
          AND c.value > 0
        ORDER BY c.value DESC
      `);

      const rows = (results as any).rows ?? results;
      const nutrients = rows.map((row: any) => ({
        nutrientCode: row.nutrient_code,
        name: row.name,
        unit: row.canonical_unit || row.unit,
        sourceUnit: row.unit,
        value: parseFloat(row.value) * parseFloat(row.conversion_factor || '1'),
        compoundId: row.compound_id,
        nutriCompoundName: row.nutri_compound_name,
      }));

      logger.debug(
        {
          service: 'foodfiles-staging',
          foodId,
          count: nutrients.length,
          mappedCount: nutrients.filter((n: FoodfilesStagingNutrient) => n.compoundId).length,
          durationMs: Date.now() - startTime,
        },
        'FOODfiles staging nutrients fetched'
      );

      return nutrients;
    } catch (error) {
      logger.error(
        {
          service: 'foodfiles-staging',
          foodId,
          error: error instanceof Error ? error.message : String(error),
        },
        'FOODfiles staging nutrient fetch failed'
      );
      throw error;
    }
  }

  /**
   * Get nutrient count for a food (all available nutrients with values)
   *
   * @param foodId - FOODfiles food ID (text, e.g., "A10001")
   */
  async getNutrientCount(foodId: string): Promise<number> {
    const result = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count
      FROM source_foodfiles_content
      WHERE food_id = ${foodId}
        AND value IS NOT NULL
        AND value > 0
    `);

    const rows = (result as any).rows ?? result;
    return parseInt(rows[0]?.count || '0', 10);
  }
}

/**
 * Singleton FOODfiles staging client instance
 */
export const foodfilesStagingClient = new FoodfilesStagingClient();
