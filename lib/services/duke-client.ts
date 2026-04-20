/**
 * Duke Phytochemical Database Client
 *
 * Purpose: Typed client for Duke staging tables
 * Pattern: Database query client for local staging data
 * Service: Dr. Duke's Phytochemical and Ethnobotanical Databases
 *
 * Features:
 * - 2,376 medicinal plants
 * - 29,572 phytochemicals
 * - 104,388 plant-chemical associations
 * - Ethnobotanical and pharmacological data
 *
 * Data Structure:
 * - source_duke_plants: Plant/food metadata (fnf_num, common_name, latin_name, family)
 * - source_duke_chemicals: Chemical compound data (chem_id, name, cas_number)
 * - source_duke_farmacy: Plant-chemical content relationships
 *
 * Generated: 2026-01-22
 * Architecture: Multi-Source Food Database System
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { wordMatchSQL } from '@/lib/utils/search-words';

/**
 * Duke staging table plant result
 */
export interface DukeStagingPlant {
  fnfNum: string;
  commonName: string;
  latinName: string | null;
  family: string | null;
}

/**
 * Duke staging table nutrient result (with Nutri compound mapping)
 */
export interface DukeStagingNutrient {
  dukeChemId: string;
  chemicalName: string;
  plantPart: string | null;
  amountLow: number | null;
  amountHigh: number | null;
  unit: string | null;
  sourceUnit: string | null;
  value: number; // Calculated average or low value
  compoundId: string | null; // Nutri compound UUID if mapped
  nutriCompoundName: string | null; // Nutri compound name if mapped
}

/**
 * Duke Staging Client
 * Fetches data from local staging tables
 */
class DukeStagingClient {
  /**
   * Search plants by name in staging table
   */
  async searchPlants(query: string, limit: number = 20): Promise<DukeStagingPlant[]> {
    const startTime = Date.now();

    try {
      const results = await db.execute<{
        fnf_num: string;
        common_name: string;
        latin_name: string | null;
        family: string | null;
      }>(
        sql`SELECT fnf_num, common_name, latin_name, family FROM source_duke_plants WHERE (`
          .append(wordMatchSQL('common_name', query))
          .append(sql` OR `)
          .append(wordMatchSQL('latin_name', query))
          .append(sql`) ORDER BY CASE WHEN LOWER(common_name) = LOWER(${query}) THEN 0 ELSE 1 END, common_name ASC LIMIT ${limit}`)
      );

      const rows = (results as any).rows ?? results;
      const plants = rows.map((row: any) => ({
        fnfNum: row.fnf_num,
        commonName: row.common_name,
        latinName: row.latin_name,
        family: row.family,
      }));

      logger.debug(
        {
          service: 'duke-staging',
          query,
          count: plants.length,
          durationMs: Date.now() - startTime,
        },
        'Duke staging search completed'
      );

      return plants;
    } catch (error) {
      logger.error(
        {
          service: 'duke-staging',
          error: error instanceof Error ? error.message : String(error),
        },
        'Duke staging search failed'
      );
      throw error;
    }
  }

  /**
   * Get plant by FNF number from staging table
   */
  async getPlant(fnfNum: string): Promise<DukeStagingPlant | null> {
    const results = await db.execute<{
      fnf_num: string;
      common_name: string;
      latin_name: string | null;
      family: string | null;
    }>(sql`
      SELECT fnf_num, common_name, latin_name, family
      FROM source_duke_plants
      WHERE fnf_num = ${fnfNum}
    `);

    const rows = (results as any).rows ?? results;
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      fnfNum: row.fnf_num,
      commonName: row.common_name,
      latinName: row.latin_name,
      family: row.family,
    };
  }

  /**
   * Get nutrients for a plant from staging table
   * Returns nutrients with Nutri compound mapping where available
   *
   * @param fnfNum - Duke FNF number (plant identifier)
   * @param plantPart - Optional specific plant part filter (e.g., "Leaf", "Root", "Fruit")
   */
  async getNutrients(fnfNum: string, plantPart?: string): Promise<DukeStagingNutrient[]> {
    const startTime = Date.now();

    try {
      // Query farmacy table joined with chemicals and compound_sources
      // If plantPart is provided, filter by it; otherwise get all parts
      const results = plantPart
        ? await db.execute<{
            chem_id: string;
            chemical_name: string;
            plant_part: string | null;
            amount_low: number | null;
            amount_high: number | null;
            unit: string | null;
            compound_id: string | null;
            nutri_compound_name: string | null;
            conversion_factor: string | null;
            canonical_unit: string | null;
          }>(sql`
            SELECT
              f.chem_id,
              c.name as chemical_name,
              f.plant_part,
              f.amount_low,
              f.amount_high,
              f.unit,
              cs.compound_id,
              comp.name as nutri_compound_name,
              cs.conversion_factor,
              comp.unit as canonical_unit
            FROM source_duke_farmacy f
            JOIN source_duke_chemicals c ON c.chem_id = f.chem_id
            LEFT JOIN compound_sources cs ON cs.external_id = f.chem_id
              AND cs.external_source = 'DUKE'
            LEFT JOIN compounds comp ON comp.id = cs.compound_id
            WHERE f.fnf_num = ${fnfNum}
              AND f.plant_part = ${plantPart}
            ORDER BY f.amount_high DESC NULLS LAST, f.amount_low DESC NULLS LAST
          `)
        : await db.execute<{
            chem_id: string;
            chemical_name: string;
            plant_part: string | null;
            amount_low: number | null;
            amount_high: number | null;
            unit: string | null;
            compound_id: string | null;
            nutri_compound_name: string | null;
            conversion_factor: string | null;
            canonical_unit: string | null;
          }>(sql`
            SELECT
              f.chem_id,
              c.name as chemical_name,
              f.plant_part,
              f.amount_low,
              f.amount_high,
              f.unit,
              cs.compound_id,
              comp.name as nutri_compound_name,
              cs.conversion_factor,
              comp.unit as canonical_unit
            FROM source_duke_farmacy f
            JOIN source_duke_chemicals c ON c.chem_id = f.chem_id
            LEFT JOIN compound_sources cs ON cs.external_id = f.chem_id
              AND cs.external_source = 'DUKE'
            LEFT JOIN compounds comp ON comp.id = cs.compound_id
            WHERE f.fnf_num = ${fnfNum}
            ORDER BY f.amount_high DESC NULLS LAST, f.amount_low DESC NULLS LAST
          `);

      const rows = (results as any).rows ?? results;
      const nutrients = rows.map((row: any) => {
        // Calculate a representative value
        // Prefer average of low and high, otherwise use low, otherwise use high
        let value = 0;
        const amountLow = row.amount_low ? parseFloat(row.amount_low) : null;
        const amountHigh = row.amount_high ? parseFloat(row.amount_high) : null;

        if (amountLow !== null && amountHigh !== null) {
          value = (amountLow + amountHigh) / 2;
        } else if (amountLow !== null) {
          value = amountLow;
        } else if (amountHigh !== null) {
          value = amountHigh;
        }

        return {
          dukeChemId: row.chem_id,
          chemicalName: row.chemical_name,
          plantPart: row.plant_part,
          amountLow: amountLow,
          amountHigh: amountHigh,
          unit: row.canonical_unit || row.unit,
          sourceUnit: row.unit,
          value: value * parseFloat(row.conversion_factor || '1'),
          compoundId: row.compound_id,
          nutriCompoundName: row.nutri_compound_name,
        };
      });

      logger.debug(
        {
          service: 'duke-staging',
          fnfNum,
          plantPart,
          count: nutrients.length,
          mappedCount: nutrients.filter((n: DukeStagingNutrient) => n.compoundId).length,
          durationMs: Date.now() - startTime,
        },
        'Duke staging nutrients fetched'
      );

      return nutrients;
    } catch (error) {
      logger.error(
        {
          service: 'duke-staging',
          fnfNum,
          plantPart,
          error: error instanceof Error ? error.message : String(error),
        },
        'Duke staging nutrient fetch failed'
      );
      throw error;
    }
  }

  /**
   * Get nutrient count for a plant (mapped compounds only)
   *
   * @param fnfNum - Duke FNF number
   * @param plantPart - Optional specific plant part filter
   */
  async getNutrientCount(fnfNum: string, plantPart?: string): Promise<number> {
    const result = plantPart
      ? await db.execute<{ count: string }>(sql`
          SELECT COUNT(DISTINCT cs.compound_id) as count
          FROM source_duke_farmacy f
          JOIN compound_sources cs ON cs.external_id = f.chem_id
            AND cs.external_source = 'DUKE'
          WHERE f.fnf_num = ${fnfNum}
            AND f.plant_part = ${plantPart}
        `)
      : await db.execute<{ count: string }>(sql`
          SELECT COUNT(DISTINCT cs.compound_id) as count
          FROM source_duke_farmacy f
          JOIN compound_sources cs ON cs.external_id = f.chem_id
            AND cs.external_source = 'DUKE'
          WHERE f.fnf_num = ${fnfNum}
        `);

    const rows = (result as any).rows ?? result;
    return parseInt(rows[0]?.count || '0', 10);
  }

  /**
   * Get available plant parts for a plant
   *
   * @param fnfNum - Duke FNF number
   */
  async getPlantParts(fnfNum: string): Promise<string[]> {
    const results = await db.execute<{ plant_part: string }>(sql`
      SELECT DISTINCT plant_part
      FROM source_duke_farmacy
      WHERE fnf_num = ${fnfNum}
        AND plant_part IS NOT NULL
        AND plant_part != ''
      ORDER BY plant_part
    `);

    const rows = (results as any).rows ?? results;
    return rows.map((row: any) => row.plant_part);
  }
}

/**
 * Singleton Duke staging client instance
 */
export const dukeStagingClient = new DukeStagingClient();
