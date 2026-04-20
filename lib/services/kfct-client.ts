/**
 * Korean KFCT Food Composition Database Client
 *
 * Purpose: Typed client for KFCT staging tables
 * Pattern: Database query client for local staging data
 * Source: Rural Development Administration (Korea) - 9th Revision
 *
 * Features:
 * - 2,733 Korean foods with alphanumeric text IDs
 * - 44 nutrients with INFOODS component codes
 * - 64,101 nutrient content values
 *
 * Data Structure:
 * - source_kfct_foods: Food metadata (food_id text, name, food_group)
 * - source_kfct_nutrients: Nutrient definitions (nutrient_code, name, unit)
 * - source_kfct_content: Food-nutrient values (long format)
 *
 * Key design: nutrient_code is text used directly as compound_sources external_id.
 * No indirection needed — join goes straight through nutrient_code (same as NEVO/FOODfiles/MEXT).
 *
 * Generated: 2026-02-09
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { wordMatchSQL } from '@/lib/utils/search-words';

/**
 * KFCT staging table food result
 */
export interface KfctStagingFood {
  foodId: string;
  name: string;
  nameEn: string | null;
  foodGroup: string | null;
}

/**
 * KFCT staging table nutrient result (with Nutri compound mapping)
 */
export interface KfctStagingNutrient {
  nutrientCode: string;
  name: string;
  unit: string;
  sourceUnit: string;
  value: number;
  compoundId: string | null;
  nutriCompoundName: string | null;
}

/**
 * KFCT Staging Client
 * Fetches data from local staging tables
 */
class KfctStagingClient {
  /**
   * Search foods by name in staging table
   */
  async searchFoods(query: string, limit: number = 20): Promise<KfctStagingFood[]> {
    const startTime = Date.now();

    try {
      const results = await db.execute<{
        food_id: string;
        name: string;
        name_en: string | null;
        food_group: string | null;
      }>(
        sql`SELECT food_id, name, name_en, food_group FROM source_kfct_foods WHERE (`
          .append(wordMatchSQL('name', query))
          .append(sql` OR `)
          .append(wordMatchSQL('name_en', query))
          .append(sql`) ORDER BY CASE WHEN LOWER(name_en) = LOWER(${query}) OR LOWER(name) = LOWER(${query}) THEN 0 ELSE 1 END, COALESCE(name_en, name) ASC LIMIT ${limit}`)
      );

      const rows = (results as any).rows ?? results;
      const foods = rows.map((row: any) => ({
        foodId: row.food_id,
        name: row.name_en || row.name,
        nameEn: row.name_en,
        foodGroup: row.food_group,
      }));

      logger.debug(
        {
          service: 'kfct-staging',
          query,
          count: foods.length,
          durationMs: Date.now() - startTime,
        },
        'KFCT staging search completed'
      );

      return foods;
    } catch (error) {
      logger.error(
        {
          service: 'kfct-staging',
          error: error instanceof Error ? error.message : String(error),
        },
        'KFCT staging search failed'
      );
      throw error;
    }
  }

  /**
   * Get food by food ID from staging table
   */
  async getFood(foodId: string): Promise<KfctStagingFood | null> {
    const results = await db.execute<{
      food_id: string;
      name: string;
      name_en: string | null;
      food_group: string | null;
    }>(sql`
      SELECT food_id, name, name_en, food_group
      FROM source_kfct_foods
      WHERE food_id = ${foodId}
    `);

    const rows = (results as any).rows ?? results;
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      foodId: row.food_id,
      name: row.name_en || row.name,
      nameEn: row.name_en,
      foodGroup: row.food_group,
    };
  }

  /**
   * Get nutrients for a food from staging table
   * Returns nutrients with Nutri compound mapping where available
   *
   * Key: nutrient_code is used directly as compound_sources external_id
   * (no indirection — same pattern as NEVO/FOODfiles/MEXT)
   *
   * @param foodId - KFCT food ID (text, e.g., "A001001A010a")
   */
  async getNutrients(foodId: string): Promise<KfctStagingNutrient[]> {
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
        FROM source_kfct_content c
        JOIN source_kfct_nutrients n ON n.nutrient_code = c.nutrient_code
        LEFT JOIN compound_sources cs ON cs.external_id = c.nutrient_code
          AND cs.external_source = 'KFCT'
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
          service: 'kfct-staging',
          foodId,
          count: nutrients.length,
          mappedCount: nutrients.filter((n: KfctStagingNutrient) => n.compoundId).length,
          durationMs: Date.now() - startTime,
        },
        'KFCT staging nutrients fetched'
      );

      return nutrients;
    } catch (error) {
      logger.error(
        {
          service: 'kfct-staging',
          foodId,
          error: error instanceof Error ? error.message : String(error),
        },
        'KFCT staging nutrient fetch failed'
      );
      throw error;
    }
  }

  /**
   * Get nutrient count for a food (all available nutrients with values)
   *
   * @param foodId - KFCT food ID (text, e.g., "A001001A010a")
   */
  async getNutrientCount(foodId: string): Promise<number> {
    const result = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count
      FROM source_kfct_content
      WHERE food_id = ${foodId}
        AND value IS NOT NULL
        AND value > 0
    `);

    const rows = (result as any).rows ?? result;
    return parseInt(rows[0]?.count || '0', 10);
  }
}

/**
 * Singleton KFCT staging client instance
 */
export const kfctStagingClient = new KfctStagingClient();
