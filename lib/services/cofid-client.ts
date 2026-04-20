/**
 * UK CoFID (Composition of Foods Integrated Dataset) Client
 *
 * Purpose: Typed client for CoFID staging tables
 * Pattern: Database query client for local staging data
 * Source: McCance and Widdowson's Composition of Foods Integrated Dataset 2021
 *
 * Features:
 * - 2,886 UK foods
 * - 192 nutrients per food
 * - 192,760 nutrient content values
 * - Text-based nutrient codes (WATER, PROT, etc.)
 *
 * Data Structure:
 * - source_cofid_foods: Food metadata (food_code, name, description, food_group)
 * - source_cofid_nutrients: Nutrient definitions (nutrient_code, name, unit)
 * - source_cofid_content: Food-nutrient values (long format)
 *
 * Generated: 2026-02-06
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { wordMatchSQL } from '@/lib/utils/search-words';

/**
 * CoFID staging table food result
 */
export interface CofidStagingFood {
  foodCode: string;
  name: string;
  description: string | null;
  foodGroup: string | null;
}

/**
 * CoFID staging table nutrient result (with Nutri compound mapping)
 */
export interface CofidStagingNutrient {
  nutrientCode: string;
  name: string;
  unit: string;
  sourceUnit: string;
  value: number;
  compoundId: string | null;
  nutriCompoundName: string | null;
}

/**
 * CoFID Staging Client
 * Fetches data from local staging tables
 */
class CofidStagingClient {
  /**
   * Search foods by name in staging table
   */
  async searchFoods(query: string, limit: number = 20): Promise<CofidStagingFood[]> {
    const startTime = Date.now();

    try {
      const results = await db.execute<{
        food_code: string;
        name: string;
        description: string | null;
        food_group: string | null;
      }>(
        sql`SELECT food_code, name, description, food_group FROM source_cofid_foods WHERE `
          .append(wordMatchSQL('name', query))
          .append(sql` ORDER BY CASE WHEN LOWER(name) = LOWER(${query}) THEN 0 ELSE 1 END, name ASC LIMIT ${limit}`)
      );

      const rows = (results as any).rows ?? results;
      const foods = rows.map((row: any) => ({
        foodCode: row.food_code,
        name: row.name,
        description: row.description,
        foodGroup: row.food_group,
      }));

      logger.debug(
        {
          service: 'cofid-staging',
          query,
          count: foods.length,
          durationMs: Date.now() - startTime,
        },
        'CoFID staging search completed'
      );

      return foods;
    } catch (error) {
      logger.error(
        {
          service: 'cofid-staging',
          error: error instanceof Error ? error.message : String(error),
        },
        'CoFID staging search failed'
      );
      throw error;
    }
  }

  /**
   * Get food by food code from staging table
   */
  async getFood(foodCode: string): Promise<CofidStagingFood | null> {
    const results = await db.execute<{
      food_code: string;
      name: string;
      description: string | null;
      food_group: string | null;
    }>(sql`
      SELECT food_code, name, description, food_group
      FROM source_cofid_foods
      WHERE food_code = ${foodCode}
    `);

    const rows = (results as any).rows ?? results;
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      foodCode: row.food_code,
      name: row.name,
      description: row.description,
      foodGroup: row.food_group,
    };
  }

  /**
   * Get nutrients for a food from staging table
   * Returns nutrients with Nutri compound mapping where available
   *
   * @param foodCode - CoFID food code (e.g., "13-145")
   */
  async getNutrients(foodCode: string): Promise<CofidStagingNutrient[]> {
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
        FROM source_cofid_content c
        JOIN source_cofid_nutrients n ON n.nutrient_code = c.nutrient_code
        LEFT JOIN compound_sources cs ON cs.external_id = c.nutrient_code
          AND cs.external_source = 'UK_COFID'
        LEFT JOIN compounds comp ON comp.id = cs.compound_id
        WHERE c.food_code = ${foodCode}
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
          service: 'cofid-staging',
          foodCode,
          count: nutrients.length,
          mappedCount: nutrients.filter((n: CofidStagingNutrient) => n.compoundId).length,
          durationMs: Date.now() - startTime,
        },
        'CoFID staging nutrients fetched'
      );

      return nutrients;
    } catch (error) {
      logger.error(
        {
          service: 'cofid-staging',
          foodCode,
          error: error instanceof Error ? error.message : String(error),
        },
        'CoFID staging nutrient fetch failed'
      );
      throw error;
    }
  }

  /**
   * Get nutrient count for a food (all available nutrients with values)
   *
   * @param foodCode - CoFID food code
   */
  async getNutrientCount(foodCode: string): Promise<number> {
    const result = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count
      FROM source_cofid_content
      WHERE food_code = ${foodCode}
        AND value IS NOT NULL
        AND value > 0
    `);

    const rows = (result as any).rows ?? result;
    return parseInt(rows[0]?.count || '0', 10);
  }
}

/**
 * Singleton CoFID staging client instance
 */
export const cofidStagingClient = new CofidStagingClient();
