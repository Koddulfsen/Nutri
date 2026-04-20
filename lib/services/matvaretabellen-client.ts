/**
 * Norwegian Matvaretabellen Food Composition Database Client
 *
 * Purpose: Typed client for Matvaretabellen staging tables
 * Pattern: Database query client for local staging data
 * Source: https://www.matvaretabellen.no/
 *
 * Features:
 * - 2,121 Norwegian foods with English names
 * - 57 nutrients with EuroFIR codes
 * - ~120K nutrient content values
 *
 * Data Structure:
 * - source_matvaretabellen_foods: Food metadata (food_id text, name)
 * - source_matvaretabellen_nutrients: Nutrient definitions (nutrient_id, name, unit, eurofir_code)
 * - source_matvaretabellen_content: Food-nutrient values (long format)
 *
 * Key difference: compound_sources uses EuroFIR codes as external_id,
 * so the join goes through source_matvaretabellen_nutrients.eurofir_code
 * (same pattern as FRIDA).
 *
 * Generated: 2026-02-07
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { wordMatchSQL } from '@/lib/utils/search-words';

/**
 * Matvaretabellen staging table food result
 */
export interface MatvaretabellenStagingFood {
  foodId: string;
  name: string;
  foodGroupId: string | null;
}

/**
 * Matvaretabellen staging table nutrient result (with Nutri compound mapping)
 */
export interface MatvaretabellenStagingNutrient {
  nutrientId: string;
  name: string;
  unit: string;
  sourceUnit: string;
  value: number;
  eurofirCode: string | null;
  compoundId: string | null;
  nutriCompoundName: string | null;
}

/**
 * Matvaretabellen Staging Client
 * Fetches data from local staging tables
 */
class MatvaretabellenStagingClient {
  /**
   * Search foods by name in staging table
   */
  async searchFoods(query: string, limit: number = 20): Promise<MatvaretabellenStagingFood[]> {
    const startTime = Date.now();

    try {
      const results = await db.execute<{
        food_id: string;
        name: string;
        food_group_id: string | null;
      }>(
        sql`SELECT food_id, name, food_group_id FROM source_matvaretabellen_foods WHERE `
          .append(wordMatchSQL('name', query))
          .append(sql` ORDER BY CASE WHEN LOWER(name) = LOWER(${query}) THEN 0 ELSE 1 END, name ASC LIMIT ${limit}`)
      );

      const rows = (results as any).rows ?? results;
      const foods = rows.map((row: any) => ({
        foodId: row.food_id,
        name: row.name,
        foodGroupId: row.food_group_id,
      }));

      logger.debug(
        {
          service: 'matvaretabellen-staging',
          query,
          count: foods.length,
          durationMs: Date.now() - startTime,
        },
        'Matvaretabellen staging search completed'
      );

      return foods;
    } catch (error) {
      logger.error(
        {
          service: 'matvaretabellen-staging',
          error: error instanceof Error ? error.message : String(error),
        },
        'Matvaretabellen staging search failed'
      );
      throw error;
    }
  }

  /**
   * Get food by food ID from staging table
   */
  async getFood(foodId: string): Promise<MatvaretabellenStagingFood | null> {
    const results = await db.execute<{
      food_id: string;
      name: string;
      food_group_id: string | null;
    }>(sql`
      SELECT food_id, name, food_group_id
      FROM source_matvaretabellen_foods
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
      foodGroupId: row.food_group_id,
    };
  }

  /**
   * Get nutrients for a food from staging table
   * Returns nutrients with Nutri compound mapping where available
   *
   * Critical: compound_sources uses EuroFIR codes as external_id,
   * so the join goes through source_matvaretabellen_nutrients.eurofir_code
   *
   * @param foodId - Matvaretabellen food ID (text, e.g., "06.178")
   */
  async getNutrients(foodId: string): Promise<MatvaretabellenStagingNutrient[]> {
    const startTime = Date.now();

    try {
      const results = await db.execute<{
        nutrient_id: string;
        name: string;
        unit: string;
        value: number;
        eurofir_code: string | null;
        compound_id: string | null;
        nutri_compound_name: string | null;
        conversion_factor: string | null;
        canonical_unit: string | null;
      }>(sql`
        SELECT
          n.nutrient_id,
          n.name,
          n.unit,
          c.value,
          n.eurofir_code,
          cs.compound_id,
          comp.name as nutri_compound_name,
          cs.conversion_factor,
          comp.unit as canonical_unit
        FROM source_matvaretabellen_content c
        JOIN source_matvaretabellen_nutrients n ON n.nutrient_id = c.nutrient_id
        LEFT JOIN compound_sources cs ON cs.external_id = n.eurofir_code
          AND cs.external_source = 'MATVARETABELLEN'
        LEFT JOIN compounds comp ON comp.id = cs.compound_id
        WHERE c.food_id = ${foodId}
          AND c.value IS NOT NULL
          AND c.value > 0
        ORDER BY c.value DESC
      `);

      const rows = (results as any).rows ?? results;
      const nutrients = rows.map((row: any) => ({
        nutrientId: row.nutrient_id,
        name: row.name,
        unit: row.canonical_unit || row.unit,
        sourceUnit: row.unit,
        value: parseFloat(row.value) * parseFloat(row.conversion_factor || '1'),
        eurofirCode: row.eurofir_code,
        compoundId: row.compound_id,
        nutriCompoundName: row.nutri_compound_name,
      }));

      logger.debug(
        {
          service: 'matvaretabellen-staging',
          foodId,
          count: nutrients.length,
          mappedCount: nutrients.filter((n: MatvaretabellenStagingNutrient) => n.compoundId).length,
          durationMs: Date.now() - startTime,
        },
        'Matvaretabellen staging nutrients fetched'
      );

      return nutrients;
    } catch (error) {
      logger.error(
        {
          service: 'matvaretabellen-staging',
          foodId,
          error: error instanceof Error ? error.message : String(error),
        },
        'Matvaretabellen staging nutrient fetch failed'
      );
      throw error;
    }
  }

  /**
   * Get nutrient count for a food (all available nutrients with values)
   *
   * @param foodId - Matvaretabellen food ID (text, e.g., "06.178")
   */
  async getNutrientCount(foodId: string): Promise<number> {
    const result = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count
      FROM source_matvaretabellen_content
      WHERE food_id = ${foodId}
        AND value IS NOT NULL
        AND value > 0
    `);

    const rows = (result as any).rows ?? result;
    return parseInt(rows[0]?.count || '0', 10);
  }
}

/**
 * Singleton Matvaretabellen staging client instance
 */
export const matvaretabellenStagingClient = new MatvaretabellenStagingClient();
