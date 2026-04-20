/**
 * French CIQUAL Food Composition Database Client
 *
 * Purpose: Typed client for CIQUAL staging tables
 * Pattern: Database query client for local staging data
 * Source: ANSES (French Agency for Food, Environmental and Occupational Health & Safety)
 *
 * Features:
 * - 3,484 French foods with English names
 * - 74 nutrients per food (CIQUAL codes)
 * - 174,570 nutrient content values
 *
 * Data Structure:
 * - source_ciqual_foods: Food metadata (food_id, name, description, food_group)
 * - source_ciqual_nutrients: Nutrient definitions (nutrient_code, name, unit)
 * - source_ciqual_content: Food-nutrient values (long format)
 *
 * Generated: 2026-02-07
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { wordMatchSQL } from '@/lib/utils/search-words';

/**
 * CIQUAL staging table food result
 */
export interface CiqualStagingFood {
  foodId: number;
  name: string;
  description: string | null;
  foodGroup: string | null;
}

/**
 * CIQUAL staging table nutrient result (with Nutri compound mapping)
 */
export interface CiqualStagingNutrient {
  nutrientCode: string;
  name: string;
  unit: string;
  sourceUnit: string;
  value: number;
  compoundId: string | null;
  nutriCompoundName: string | null;
}

/**
 * CIQUAL Staging Client
 * Fetches data from local staging tables
 */
class CiqualStagingClient {
  /**
   * Search foods by name in staging table
   */
  async searchFoods(query: string, limit: number = 20): Promise<CiqualStagingFood[]> {
    const startTime = Date.now();

    try {
      const results = await db.execute<{
        food_id: number;
        name: string;
        description: string | null;
        food_group: string | null;
      }>(
        sql`SELECT food_id, name, description, food_group FROM source_ciqual_foods WHERE `
          .append(wordMatchSQL('name', query))
          .append(sql` ORDER BY CASE WHEN LOWER(name) = LOWER(${query}) THEN 0 ELSE 1 END, name ASC LIMIT ${limit}`)
      );

      const rows = (results as any).rows ?? results;
      const foods = rows.map((row: any) => ({
        foodId: row.food_id,
        name: row.name,
        description: row.description,
        foodGroup: row.food_group,
      }));

      logger.debug(
        {
          service: 'ciqual-staging',
          query,
          count: foods.length,
          durationMs: Date.now() - startTime,
        },
        'CIQUAL staging search completed'
      );

      return foods;
    } catch (error) {
      logger.error(
        {
          service: 'ciqual-staging',
          error: error instanceof Error ? error.message : String(error),
        },
        'CIQUAL staging search failed'
      );
      throw error;
    }
  }

  /**
   * Get food by food ID from staging table
   */
  async getFood(foodId: number): Promise<CiqualStagingFood | null> {
    const results = await db.execute<{
      food_id: number;
      name: string;
      description: string | null;
      food_group: string | null;
    }>(sql`
      SELECT food_id, name, description, food_group
      FROM source_ciqual_foods
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
      description: row.description,
      foodGroup: row.food_group,
    };
  }

  /**
   * Get nutrients for a food from staging table
   * Returns nutrients with Nutri compound mapping where available
   *
   * @param foodId - CIQUAL food ID (integer)
   */
  async getNutrients(foodId: number): Promise<CiqualStagingNutrient[]> {
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
        FROM source_ciqual_content c
        JOIN source_ciqual_nutrients n ON n.nutrient_code = c.nutrient_code
        LEFT JOIN compound_sources cs ON cs.external_id = c.nutrient_code
          AND cs.external_source = 'CIQUAL'
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
          service: 'ciqual-staging',
          foodId,
          count: nutrients.length,
          mappedCount: nutrients.filter((n: CiqualStagingNutrient) => n.compoundId).length,
          durationMs: Date.now() - startTime,
        },
        'CIQUAL staging nutrients fetched'
      );

      return nutrients;
    } catch (error) {
      logger.error(
        {
          service: 'ciqual-staging',
          foodId,
          error: error instanceof Error ? error.message : String(error),
        },
        'CIQUAL staging nutrient fetch failed'
      );
      throw error;
    }
  }

  /**
   * Get nutrient count for a food (all available nutrients with values)
   *
   * @param foodId - CIQUAL food ID (integer)
   */
  async getNutrientCount(foodId: number): Promise<number> {
    const result = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count
      FROM source_ciqual_content
      WHERE food_id = ${foodId}
        AND value IS NOT NULL
        AND value > 0
    `);

    const rows = (result as any).rows ?? result;
    return parseInt(rows[0]?.count || '0', 10);
  }
}

/**
 * Singleton CIQUAL staging client instance
 */
export const ciqualStagingClient = new CiqualStagingClient();
