/**
 * Indian INDB Nutrient Database Client
 *
 * Purpose: Typed client for INDB staging tables
 * Pattern: Database query client for local staging data
 * Source: Indian Nutrient Database (INDB)
 *
 * Features:
 * - 1,014 Indian foods with text IDs (ASC001-ASC490, BFP001-BFP376, OSR001-OSR148)
 * - 39 nutrients per 100g
 * - ~39,500 nutrient content values
 *
 * Data Structure:
 * - source_indb_foods: Food metadata (food_id text, name, food_group)
 * - source_indb_nutrients: Nutrient definitions (nutrient_code, name, unit)
 * - source_indb_content: Food-nutrient values (long format)
 *
 * Key design: nutrient_code is text used directly as compound_sources external_id.
 * No indirection needed — join goes straight through nutrient_code.
 *
 * Generated: 2026-02-10
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { wordMatchSQL } from '@/lib/utils/search-words';

/**
 * INDB staging table food result
 */
export interface IndbStagingFood {
  foodId: string;
  name: string;
  foodGroup: string | null;
}

/**
 * INDB staging table nutrient result (with Nutri compound mapping)
 */
export interface IndbStagingNutrient {
  nutrientCode: string;
  name: string;
  unit: string;
  sourceUnit: string;
  value: number;
  compoundId: string | null;
  nutriCompoundName: string | null;
}

/**
 * INDB Staging Client
 * Fetches data from local staging tables
 */
class IndbStagingClient {
  /**
   * Search foods by name in staging table
   */
  async searchFoods(query: string, limit: number = 20): Promise<IndbStagingFood[]> {
    const startTime = Date.now();

    try {
      const results = await db.execute<{
        food_id: string;
        name: string;
        food_group: string | null;
      }>(
        sql`SELECT food_id, name, food_group FROM source_indb_foods WHERE `
          .append(wordMatchSQL('name', query))
          .append(sql` ORDER BY CASE WHEN LOWER(name) = LOWER(${query}) THEN 0 ELSE 1 END, name ASC LIMIT ${limit}`)
      );

      const rows = (results as any).rows ?? results;
      const foods = rows.map((row: any) => ({
        foodId: row.food_id,
        name: row.name,
        foodGroup: row.food_group,
      }));

      logger.debug(
        {
          service: 'indb-staging',
          query,
          count: foods.length,
          durationMs: Date.now() - startTime,
        },
        'INDB staging search completed'
      );

      return foods;
    } catch (error) {
      logger.error(
        {
          service: 'indb-staging',
          error: error instanceof Error ? error.message : String(error),
        },
        'INDB staging search failed'
      );
      throw error;
    }
  }

  /**
   * Get food by food ID from staging table
   */
  async getFood(foodId: string): Promise<IndbStagingFood | null> {
    const results = await db.execute<{
      food_id: string;
      name: string;
      food_group: string | null;
    }>(sql`
      SELECT food_id, name, food_group
      FROM source_indb_foods
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
      foodGroup: row.food_group,
    };
  }

  /**
   * Get nutrients for a food from staging table
   * Returns nutrients with Nutri compound mapping where available
   *
   * Key: nutrient_code is used directly as compound_sources external_id
   *
   * @param foodId - INDB food ID (text, e.g., "ASC001")
   */
  async getNutrients(foodId: string): Promise<IndbStagingNutrient[]> {
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
        FROM source_indb_content c
        JOIN source_indb_nutrients n ON n.nutrient_code = c.nutrient_code
        LEFT JOIN compound_sources cs ON cs.external_id = c.nutrient_code
          AND cs.external_source = 'INDB'
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
          service: 'indb-staging',
          foodId,
          count: nutrients.length,
          mappedCount: nutrients.filter((n: IndbStagingNutrient) => n.compoundId).length,
          durationMs: Date.now() - startTime,
        },
        'INDB staging nutrients fetched'
      );

      return nutrients;
    } catch (error) {
      logger.error(
        {
          service: 'indb-staging',
          foodId,
          error: error instanceof Error ? error.message : String(error),
        },
        'INDB staging nutrient fetch failed'
      );
      throw error;
    }
  }

  /**
   * Get nutrient count for a food (all available nutrients with values)
   *
   * @param foodId - INDB food ID (text, e.g., "ASC001")
   */
  async getNutrientCount(foodId: string): Promise<number> {
    const result = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count
      FROM source_indb_content
      WHERE food_id = ${foodId}
        AND value IS NOT NULL
        AND value > 0
    `);

    const rows = (result as any).rows ?? result;
    return parseInt(rows[0]?.count || '0', 10);
  }
}

/**
 * Singleton INDB staging client instance
 */
export const indbStagingClient = new IndbStagingClient();
