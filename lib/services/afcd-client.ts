/**
 * AFCD (Australian Food Composition Database) Client
 *
 * Purpose: Typed client for AFCD staging tables
 * Pattern: Database query client for local staging data
 * Service: Food Standards Australia New Zealand (FSANZ)
 *
 * Features:
 * - 1,588 Australian foods
 * - 268 nutrients per food
 * - 182,140 nutrient content values
 * - INFOODs tagnames for standardization
 *
 * Data Structure:
 * - source_afcd_foods: Food metadata (afcd_food_key, name, classification, derivation)
 * - source_afcd_nutrients: Nutrient definitions (nutrient_index, name, unit)
 * - source_afcd_content: Food-nutrient values (long format)
 *
 * Generated: 2026-01-23
 * Architecture: Multi-Source Food Database System
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { wordMatchSQL } from '@/lib/utils/search-words';

/**
 * AFCD staging table food result
 */
export interface AfcdStagingFood {
  afcdFoodKey: string;
  name: string;
  classification: string | null;
  derivation: string | null;
}

/**
 * AFCD staging table nutrient result (with Nutri compound mapping)
 */
export interface AfcdStagingNutrient {
  nutrientIndex: number;
  name: string;
  unit: string;
  sourceUnit: string;
  value: number;
  compoundId: string | null; // Nutri compound UUID if mapped
  nutriCompoundName: string | null; // Nutri compound name if mapped
}

/**
 * AFCD Staging Client
 * Fetches data from local staging tables
 */
class AfcdStagingClient {
  /**
   * Search foods by name in staging table
   */
  async searchFoods(query: string, limit: number = 20): Promise<AfcdStagingFood[]> {
    const startTime = Date.now();

    try {
      const results = await db.execute<{
        afcd_food_key: string;
        name: string;
        classification: string | null;
        derivation: string | null;
      }>(
        sql`SELECT afcd_food_key, name, classification, derivation FROM source_afcd_foods WHERE `
          .append(wordMatchSQL('name', query))
          .append(sql` ORDER BY CASE WHEN LOWER(name) = LOWER(${query}) THEN 0 ELSE 1 END, name ASC LIMIT ${limit}`)
      );

      const rows = (results as any).rows ?? results;
      const foods = rows.map((row: any) => ({
        afcdFoodKey: row.afcd_food_key,
        name: row.name,
        classification: row.classification,
        derivation: row.derivation,
      }));

      logger.debug(
        {
          service: 'afcd-staging',
          query,
          count: foods.length,
          durationMs: Date.now() - startTime,
        },
        'AFCD staging search completed'
      );

      return foods;
    } catch (error) {
      logger.error(
        {
          service: 'afcd-staging',
          error: error instanceof Error ? error.message : String(error),
        },
        'AFCD staging search failed'
      );
      throw error;
    }
  }

  /**
   * Get food by AFCD key from staging table
   */
  async getFood(afcdFoodKey: string): Promise<AfcdStagingFood | null> {
    const results = await db.execute<{
      afcd_food_key: string;
      name: string;
      classification: string | null;
      derivation: string | null;
    }>(sql`
      SELECT afcd_food_key, name, classification, derivation
      FROM source_afcd_foods
      WHERE afcd_food_key = ${afcdFoodKey}
    `);

    const rows = (results as any).rows ?? results;
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      afcdFoodKey: row.afcd_food_key,
      name: row.name,
      classification: row.classification,
      derivation: row.derivation,
    };
  }

  /**
   * Get nutrients for a food from staging table
   * Returns nutrients with Nutri compound mapping where available
   *
   * @param afcdFoodKey - AFCD food key (e.g., "F002258")
   */
  async getNutrients(afcdFoodKey: string): Promise<AfcdStagingNutrient[]> {
    const startTime = Date.now();

    try {
      // Query content table joined with nutrients and compound_sources
      const results = await db.execute<{
        nutrient_index: number;
        name: string;
        unit: string;
        value: number;
        compound_id: string | null;
        nutri_compound_name: string | null;
        conversion_factor: string | null;
        canonical_unit: string | null;
      }>(sql`
        SELECT
          n.nutrient_index,
          n.name,
          n.unit,
          c.value,
          cs.compound_id,
          comp.name as nutri_compound_name,
          cs.conversion_factor,
          comp.unit as canonical_unit
        FROM source_afcd_content c
        JOIN source_afcd_nutrients n ON n.nutrient_index = c.nutrient_index
        LEFT JOIN compound_sources cs ON cs.external_source = 'AFCD'
          AND (cs.external_id = CAST(n.nutrient_index AS TEXT) OR cs.external_id = n.name OR cs.source_name = n.name)
        LEFT JOIN compounds comp ON comp.id = cs.compound_id
        WHERE c.afcd_food_key = ${afcdFoodKey}
          AND c.value IS NOT NULL
          AND c.value > 0
        ORDER BY c.value DESC
      `);

      const rows = (results as any).rows ?? results;
      const nutrients = rows.map((row: any) => ({
        nutrientIndex: row.nutrient_index,
        name: row.name,
        unit: row.canonical_unit || row.unit,
        sourceUnit: row.unit,
        value: parseFloat(row.value) * parseFloat(row.conversion_factor || '1'),
        compoundId: row.compound_id,
        nutriCompoundName: row.nutri_compound_name,
      }));

      logger.debug(
        {
          service: 'afcd-staging',
          afcdFoodKey,
          count: nutrients.length,
          mappedCount: nutrients.filter((n: AfcdStagingNutrient) => n.compoundId).length,
          durationMs: Date.now() - startTime,
        },
        'AFCD staging nutrients fetched'
      );

      return nutrients;
    } catch (error) {
      logger.error(
        {
          service: 'afcd-staging',
          afcdFoodKey,
          error: error instanceof Error ? error.message : String(error),
        },
        'AFCD staging nutrient fetch failed'
      );
      throw error;
    }
  }

  /**
   * Get nutrient count for a food (all available nutrients)
   *
   * @param afcdFoodKey - AFCD food key
   */
  async getNutrientCount(afcdFoodKey: string): Promise<number> {
    const result = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count
      FROM source_afcd_content
      WHERE afcd_food_key = ${afcdFoodKey}
        AND value IS NOT NULL
        AND value > 0
    `);

    const rows = (result as any).rows ?? result;
    return parseInt(rows[0]?.count || '0', 10);
  }

  /**
   * Get nutrient by index from staging table
   *
   * @param nutrientIndex - AFCD nutrient index (0-267)
   */
  async getNutrientDefinition(nutrientIndex: number): Promise<{
    name: string;
    unit: string;
    infoodsTagname: string | null;
  } | null> {
    const results = await db.execute<{
      name: string;
      unit: string;
      infoods_tagname: string | null;
    }>(sql`
      SELECT name, unit, infoods_tagname
      FROM source_afcd_nutrients
      WHERE nutrient_index = ${nutrientIndex}
    `);

    const rows = (results as any).rows ?? results;
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      name: row.name,
      unit: row.unit,
      infoodsTagname: row.infoods_tagname,
    };
  }

  /**
   * Get all nutrient definitions
   */
  async getAllNutrientDefinitions(): Promise<Array<{
    nutrientIndex: number;
    name: string;
    unit: string;
  }>> {
    const results = await db.execute<{
      nutrient_index: number;
      name: string;
      unit: string;
    }>(sql`
      SELECT nutrient_index, name, unit
      FROM source_afcd_nutrients
      ORDER BY nutrient_index
    `);

    const rows = (results as any).rows ?? results;
    return rows.map((row: any) => ({
      nutrientIndex: row.nutrient_index,
      name: row.name,
      unit: row.unit,
    }));
  }
}

/**
 * Singleton AFCD staging client instance
 */
export const afcdStagingClient = new AfcdStagingClient();
