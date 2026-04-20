/**
 * Dutch NEVO (Nederlands Voedingsstoffenbestand) Food Composition Database Client
 *
 * Purpose: Typed client for NEVO staging tables
 * Pattern: Database query client for local staging data
 * Source: https://nevo-online.rivm.nl/
 *
 * Features:
 * - 2,328 Dutch foods with English and Dutch names
 * - 137 nutrients with text codes (PROT, NA, F16:0)
 * - 270,810 nutrient content values
 *
 * Data Structure:
 * - source_nevo_foods: Food metadata (food_id, name, name_nl, food_group)
 * - source_nevo_nutrients: Nutrient definitions (nutrient_code, name, unit)
 * - source_nevo_content: Food-nutrient values (long format)
 *
 * Key design: nutrient_code is text used directly as compound_sources external_id.
 * No indirection needed — join goes straight through nutrient_code.
 *
 * Generated: 2026-02-07
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { wordMatchSQL } from '@/lib/utils/search-words';

/**
 * NEVO staging table food result
 */
export interface NevoStagingFood {
  foodId: number;
  name: string;
  nameNl: string | null;
  foodGroup: string | null;
}

/**
 * NEVO staging table nutrient result (with Nutri compound mapping)
 */
export interface NevoStagingNutrient {
  nutrientCode: string;
  name: string;
  unit: string;
  sourceUnit: string;
  value: number;
  compoundId: string | null;
  nutriCompoundName: string | null;
}

/**
 * NEVO Staging Client
 * Fetches data from local staging tables
 */
class NevoStagingClient {
  /**
   * Search foods by name in staging table
   */
  async searchFoods(query: string, limit: number = 20): Promise<NevoStagingFood[]> {
    const startTime = Date.now();

    try {
      const results = await db.execute<{
        food_id: number;
        name: string;
        name_nl: string | null;
        food_group: string | null;
      }>(
        sql`SELECT food_id, name, name_nl, food_group FROM source_nevo_foods WHERE `
          .append(wordMatchSQL('name', query))
          .append(sql` ORDER BY CASE WHEN LOWER(name) = LOWER(${query}) THEN 0 ELSE 1 END, name ASC LIMIT ${limit}`)
      );

      const rows = (results as any).rows ?? results;
      const foods = rows.map((row: any) => ({
        foodId: parseInt(row.food_id, 10),
        name: row.name,
        nameNl: row.name_nl,
        foodGroup: row.food_group,
      }));

      logger.debug(
        {
          service: 'nevo-staging',
          query,
          count: foods.length,
          durationMs: Date.now() - startTime,
        },
        'NEVO staging search completed'
      );

      return foods;
    } catch (error) {
      logger.error(
        {
          service: 'nevo-staging',
          error: error instanceof Error ? error.message : String(error),
        },
        'NEVO staging search failed'
      );
      throw error;
    }
  }

  /**
   * Get food by food ID from staging table
   */
  async getFood(foodId: number): Promise<NevoStagingFood | null> {
    const results = await db.execute<{
      food_id: number;
      name: string;
      name_nl: string | null;
      food_group: string | null;
    }>(sql`
      SELECT food_id, name, name_nl, food_group
      FROM source_nevo_foods
      WHERE food_id = ${foodId}
    `);

    const rows = (results as any).rows ?? results;
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      foodId: parseInt(row.food_id, 10),
      name: row.name,
      nameNl: row.name_nl,
      foodGroup: row.food_group,
    };
  }

  /**
   * Get nutrients for a food from staging table
   * Returns nutrients with Nutri compound mapping where available
   *
   * Key: nutrient_code is used directly as compound_sources external_id
   * (no indirection like FRIDA's eurofir_code)
   *
   * @param foodId - NEVO food ID (integer)
   */
  async getNutrients(foodId: number): Promise<NevoStagingNutrient[]> {
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
        FROM source_nevo_content c
        JOIN source_nevo_nutrients n ON n.nutrient_code = c.nutrient_code
        LEFT JOIN compound_sources cs ON cs.external_id = c.nutrient_code
          AND cs.external_source = 'NEVO'
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
          service: 'nevo-staging',
          foodId,
          count: nutrients.length,
          mappedCount: nutrients.filter((n: NevoStagingNutrient) => n.compoundId).length,
          durationMs: Date.now() - startTime,
        },
        'NEVO staging nutrients fetched'
      );

      return nutrients;
    } catch (error) {
      logger.error(
        {
          service: 'nevo-staging',
          foodId,
          error: error instanceof Error ? error.message : String(error),
        },
        'NEVO staging nutrient fetch failed'
      );
      throw error;
    }
  }

  /**
   * Get nutrient count for a food (all available nutrients with values)
   *
   * @param foodId - NEVO food ID (integer)
   */
  async getNutrientCount(foodId: number): Promise<number> {
    const result = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count
      FROM source_nevo_content
      WHERE food_id = ${foodId}
        AND value IS NOT NULL
        AND value > 0
    `);

    const rows = (result as any).rows ?? result;
    return parseInt(rows[0]?.count || '0', 10);
  }
}

/**
 * Singleton NEVO staging client instance
 */
export const nevoStagingClient = new NevoStagingClient();
