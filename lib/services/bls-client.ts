/**
 * German BLS (Bundeslebensmittelschlüssel) Food Composition Database Client
 *
 * Purpose: Typed client for BLS staging tables
 * Pattern: Database query client for local staging data
 * Source: German Federal Institute for Risk Assessment (BfR)
 *
 * Features:
 * - 7,140 German foods with English and German names
 * - 138 nutrients per food (BLS codes)
 * - 869,501 nutrient content values
 *
 * Data Structure:
 * - source_bls_foods: Food metadata (food_code, name, name_de)
 * - source_bls_nutrients: Nutrient definitions (nutrient_code, name, unit)
 * - source_bls_content: Food-nutrient values (long format)
 *
 * Generated: 2026-02-07
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { wordMatchSQL } from '@/lib/utils/search-words';

/**
 * BLS staging table food result
 */
export interface BlsStagingFood {
  foodCode: string;
  name: string;
  nameDe: string | null;
}

/**
 * BLS staging table nutrient result (with Nutri compound mapping)
 */
export interface BlsStagingNutrient {
  nutrientCode: string;
  name: string;
  unit: string;
  sourceUnit: string;
  value: number;
  compoundId: string | null;
  nutriCompoundName: string | null;
}

/**
 * BLS Staging Client
 * Fetches data from local staging tables
 */
class BlsStagingClient {
  /**
   * Search foods by name in staging table
   */
  async searchFoods(query: string, limit: number = 20): Promise<BlsStagingFood[]> {
    const startTime = Date.now();

    try {
      const results = await db.execute<{
        food_code: string;
        name: string;
        name_de: string | null;
      }>(
        sql`SELECT food_code, name, name_de FROM source_bls_foods WHERE `
          .append(wordMatchSQL('name', query))
          .append(sql` ORDER BY CASE WHEN LOWER(name) = LOWER(${query}) THEN 0 ELSE 1 END, name ASC LIMIT ${limit}`)
      );

      const rows = (results as any).rows ?? results;
      const foods = rows.map((row: any) => ({
        foodCode: row.food_code,
        name: row.name,
        nameDe: row.name_de,
      }));

      logger.debug(
        {
          service: 'bls-staging',
          query,
          count: foods.length,
          durationMs: Date.now() - startTime,
        },
        'BLS staging search completed'
      );

      return foods;
    } catch (error) {
      logger.error(
        {
          service: 'bls-staging',
          error: error instanceof Error ? error.message : String(error),
        },
        'BLS staging search failed'
      );
      throw error;
    }
  }

  /**
   * Get food by food code from staging table
   */
  async getFood(foodCode: string): Promise<BlsStagingFood | null> {
    const results = await db.execute<{
      food_code: string;
      name: string;
      name_de: string | null;
    }>(sql`
      SELECT food_code, name, name_de
      FROM source_bls_foods
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
      nameDe: row.name_de,
    };
  }

  /**
   * Get nutrients for a food from staging table
   * Returns nutrients with Nutri compound mapping where available
   *
   * @param foodCode - BLS food code (text, e.g., "C131000")
   */
  async getNutrients(foodCode: string): Promise<BlsStagingNutrient[]> {
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
        FROM source_bls_content c
        JOIN source_bls_nutrients n ON n.nutrient_code = c.nutrient_code
        LEFT JOIN compound_sources cs ON cs.external_id = c.nutrient_code
          AND cs.external_source = 'BLS'
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
          service: 'bls-staging',
          foodCode,
          count: nutrients.length,
          mappedCount: nutrients.filter((n: BlsStagingNutrient) => n.compoundId).length,
          durationMs: Date.now() - startTime,
        },
        'BLS staging nutrients fetched'
      );

      return nutrients;
    } catch (error) {
      logger.error(
        {
          service: 'bls-staging',
          foodCode,
          error: error instanceof Error ? error.message : String(error),
        },
        'BLS staging nutrient fetch failed'
      );
      throw error;
    }
  }

  /**
   * Get nutrient count for a food (all available nutrients with values)
   *
   * @param foodCode - BLS food code (text, e.g., "C131000")
   */
  async getNutrientCount(foodCode: string): Promise<number> {
    const result = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count
      FROM source_bls_content
      WHERE food_code = ${foodCode}
        AND value IS NOT NULL
        AND value > 0
    `);

    const rows = (result as any).rows ?? result;
    return parseInt(rows[0]?.count || '0', 10);
  }
}

/**
 * Singleton BLS staging client instance
 */
export const blsStagingClient = new BlsStagingClient();
