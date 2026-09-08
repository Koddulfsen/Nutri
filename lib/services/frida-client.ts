/**
 * Danish FRIDA (Fødevaredatabanken) Food Composition Database Client
 *
 * Purpose: Typed client for FRIDA staging tables
 * Pattern: Database query client for local staging data
 * Source: https://frida.fooddata.dk/
 *
 * Features:
 * - 1,370 Danish foods with English and Danish names
 * - 218 nutrients with EuroFIR codes
 * - 137,946 nutrient content values
 *
 * Data Structure:
 * - source_frida_foods: Food metadata (food_id, name, name_dk)
 * - source_frida_nutrients: Nutrient definitions (nutrient_id, name, unit, eurofir_code)
 * - source_frida_content: Food-nutrient values (long format)
 *
 * Key difference: compound_sources uses EuroFIR codes as external_id,
 * so the join goes through source_frida_nutrients.eurofir_code.
 *
 * Generated: 2026-02-07
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { wordMatchSQL } from '@/lib/utils/search-words';

/**
 * FRIDA staging table food result
 */
export interface FridaStagingFood {
  foodId: number;
  name: string;
  nameDk: string | null;
}

/**
 * FRIDA staging table nutrient result (with Nutri compound mapping)
 */
export interface FridaStagingNutrient {
  nutrientId: number;
  name: string;
  unit: string;
  sourceUnit: string;
  value: number;
  eurofirCode: string | null;
  compoundId: string | null;
  nutriCompoundName: string | null;
}

/**
 * FRIDA Staging Client
 * Fetches data from local staging tables
 */
class FridaStagingClient {
  /**
   * Search foods by name in staging table
   */
  async searchFoods(query: string, limit: number = 20): Promise<FridaStagingFood[]> {
    const startTime = Date.now();

    try {
      const results = await db.execute<{
        food_id: number;
        name: string;
        name_dk: string | null;
      }>(
        sql`SELECT food_id, name, name_dk FROM source_frida_foods WHERE `
          .append(wordMatchSQL('name', query))
          .append(sql` ORDER BY CASE WHEN LOWER(name) = LOWER(${query}) THEN 0 ELSE 1 END, name ASC LIMIT ${limit}`)
      );

      const rows = (results as any).rows ?? results;
      const foods = rows.map((row: any) => ({
        foodId: parseInt(row.food_id, 10),
        name: row.name,
        nameDk: row.name_dk,
      }));

      logger.debug(
        {
          service: 'frida-staging',
          query,
          count: foods.length,
          durationMs: Date.now() - startTime,
        },
        'FRIDA staging search completed'
      );

      return foods;
    } catch (error) {
      logger.error(
        {
          service: 'frida-staging',
          error: error instanceof Error ? error.message : String(error),
        },
        'FRIDA staging search failed'
      );
      throw error;
    }
  }

  /**
   * Get food by food ID from staging table
   */
  async getFood(foodId: number): Promise<FridaStagingFood | null> {
    const results = await db.execute<{
      food_id: number;
      name: string;
      name_dk: string | null;
    }>(sql`
      SELECT food_id, name, name_dk
      FROM source_frida_foods
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
      nameDk: row.name_dk,
    };
  }

  /**
   * Get nutrients for a food from staging table
   * Returns nutrients with Nutri compound mapping where available
   *
   * Critical: compound_sources uses EuroFIR codes as external_id,
   * so the join goes through source_frida_nutrients.eurofir_code
   *
   * @param foodId - FRIDA food ID (integer)
   */
  async getNutrients(foodId: number): Promise<FridaStagingNutrient[]> {
    const startTime = Date.now();

    try {
      const results = await db.execute<{
        nutrient_id: number;
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
        FROM source_frida_content c
        JOIN source_frida_nutrients n ON n.nutrient_id = c.nutrient_id
        LEFT JOIN compound_sources cs ON cs.external_source = 'FRIDA'
          AND (cs.external_id = n.eurofir_code OR cs.external_id = n.nutrient_id::text)
        LEFT JOIN compounds comp ON comp.id = cs.compound_id
        WHERE c.food_id = ${foodId}
          AND c.value IS NOT NULL
          AND c.value > 0
        ORDER BY c.value DESC
      `);

      const rows = (results as any).rows ?? results;
      const nutrients = rows.map((row: any) => ({
        nutrientId: parseInt(row.nutrient_id, 10),
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
          service: 'frida-staging',
          foodId,
          count: nutrients.length,
          mappedCount: nutrients.filter((n: FridaStagingNutrient) => n.compoundId).length,
          durationMs: Date.now() - startTime,
        },
        'FRIDA staging nutrients fetched'
      );

      return nutrients;
    } catch (error) {
      logger.error(
        {
          service: 'frida-staging',
          foodId,
          error: error instanceof Error ? error.message : String(error),
        },
        'FRIDA staging nutrient fetch failed'
      );
      throw error;
    }
  }

  /**
   * Get nutrient count for a food (all available nutrients with values)
   *
   * @param foodId - FRIDA food ID (integer)
   */
  async getNutrientCount(foodId: number): Promise<number> {
    const result = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count
      FROM source_frida_content
      WHERE food_id = ${foodId}
        AND value IS NOT NULL
        AND value > 0
    `);

    const rows = (result as any).rows ?? result;
    return parseInt(rows[0]?.count || '0', 10);
  }
}

/**
 * Singleton FRIDA staging client instance
 */
export const fridaStagingClient = new FridaStagingClient();
