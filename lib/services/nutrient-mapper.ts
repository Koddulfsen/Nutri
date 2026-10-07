/**
 * Nutrient Standardization Service
 *
 * Purpose: Maps nutrients from different APIs to standardized names and units
 * Pattern: Dictionary-based mapping with unit conversion
 *
 * Problem:
 * - CNF calls it "Protein" with unit "g"
 * - USDA calls it "Protein" with unit "g"
 * - But: "Vitamin C" vs "Vitamin C, total ascorbic acid"
 * - Need: Unified naming and unit system
 *
 * Solution:
 * - Standard nutrient names (e.g., "Protein", "Vitamin C")
 * - Standard units (g, mg, μg, kcal)
 * - Mapping tables for CNF and USDA
 *
 * Generated: 2025-11-18
 * Architecture: Phase 2 Multi-Source Food Integration
 */

import { logger } from '@/lib/logger';
import { db } from '@/db';
import { compoundSources } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

/**
 * Standard nutrient definition
 */
export interface StandardNutrient {
  name: string; // Standard name (e.g., "Protein")
  unit: string; // Standard unit (e.g., "g")
  category: NutrientCategory;
  aliases: string[]; // Alternative names
}

/**
 * Nutrient categories
 */
export type NutrientCategory =
  | 'MACRONUTRIENT'
  | 'VITAMIN'
  | 'MINERAL'
  | 'AMINO_ACID'
  | 'FATTY_ACID'
  | 'OTHER';

/**
 * API source nutrient value
 */
export interface SourceNutrientValue {
  apiSource: 'CNF' | 'FDC';
  nutrientName: string; // API's name for the nutrient
  value: number;
  unit: string;
}

/**
 * Standardized nutrient value
 */
export interface StandardizedNutrient {
  compoundId: string | null; // NEW: Compound UUID from compounds table
  standardName: string; // DEPRECATED: Legacy string name (for backward compatibility)
  value: number;
  unit: string;
  category: NutrientCategory;
  sourceApi: 'CNF' | 'FDC';
  originalName: string;
  originalId?: string; // NEW: Original API nutrient ID (CNF nutrient_id or FDC nutrient_number)
  conversionApplied: boolean;
}

/**
 * CNF to Standard nutrient name mapping
 * Based on CNF API response: nutrient_web_name field
 */
const CNF_NUTRIENT_MAP: Record<string, string> = {
  // Macronutrients
  'Protein': 'Protein',
  'Total Fat': 'Total Fat',
  'Carbohydrate': 'Carbohydrate',
  'Fibre, total dietary': 'Dietary Fiber',
  'Moisture': 'Water',
  'Ash': 'Ash',
  'Energy': 'Calories',

  // Vitamins
  'Vitamin C': 'Vitamin C',
  'Thiamin': 'Vitamin B1 (Thiamin)',
  'Riboflavin': 'Vitamin B2 (Riboflavin)',
  'Niacin': 'Vitamin B3 (Niacin)',
  'Pantothenic acid': 'Vitamin B5 (Pantothenic Acid)',
  'Vitamin B6': 'Vitamin B6',
  'Folate, total': 'Folate (Total)',
  'Folate, naturally occurring': 'Folate (Natural)',
  'Folic acid, synthetic form': 'Folic Acid (Synthetic)',
  'Vitamin B12': 'Vitamin B12',
  'Retinol activity equivalents, RAE': 'Vitamin A (RAE)',
  'Retinol': 'Retinol',
  'Beta carotene': 'Beta Carotene',
  'Vitamin D': 'Vitamin D',
  'Vitamin E': 'Vitamin E',
  'Vitamin K': 'Vitamin K',

  // Minerals
  'Calcium, Ca': 'Calcium',
  'Iron, Fe': 'Iron',
  'Magnesium, Mg': 'Magnesium',
  'Phosphorus, P': 'Phosphorus',
  'Potassium, K': 'Potassium',
  'Sodium, Na': 'Sodium',
  'Zinc, Zn': 'Zinc',
  'Copper, Cu': 'Copper',
  'Manganese, Mn': 'Manganese',
  'Selenium, Se': 'Selenium',

  // Lipids
  'Cholesterol': 'Cholesterol',
  'Fatty acids, saturated, total': 'Saturated Fat',
  'Fatty acids, monounsaturated, total': 'Monounsaturated Fat',
  'Fatty acids, polyunsaturated, total': 'Polyunsaturated Fat',
  'Fatty acids, trans, total, monoenoic': 'Trans Fat (Monoenoic)',
  'Fatty acids, trans, total, polyenoic': 'Trans Fat (Polyenoic)',

  // Amino Acids
  'Tryptophan': 'Tryptophan',
  'Threonine': 'Threonine',
  'Isoleucine': 'Isoleucine',
  'Leucine': 'Leucine',
  'Lysine': 'Lysine',
  'Methionine': 'Methionine',
  'Phenylalanine': 'Phenylalanine',
  'Valine': 'Valine',
  'Histidine': 'Histidine',

  // Other
  'Caffeine': 'Caffeine',
  'Alcohol': 'Alcohol',
};

/**
 * USDA to Standard nutrient name mapping
 * Based on USDA FDC API response: nutrient.name field
 */
const USDA_NUTRIENT_MAP: Record<string, string> = {
  // Macronutrients
  'Protein': 'Protein',
  'Total lipid (fat)': 'Total Fat',
  'Carbohydrate, by difference': 'Carbohydrate',
  'Fiber, total dietary': 'Dietary Fiber',
  'Water': 'Water',
  'Ash': 'Ash',
  'Energy': 'Calories',

  // Vitamins
  'Vitamin C, total ascorbic acid': 'Vitamin C',
  'Thiamin': 'Vitamin B1 (Thiamin)',
  'Riboflavin': 'Vitamin B2 (Riboflavin)',
  'Niacin': 'Vitamin B3 (Niacin)',
  'Pantothenic acid': 'Vitamin B5 (Pantothenic Acid)',
  'Vitamin B-6': 'Vitamin B6',
  'Folate, total': 'Folate (Total)',
  'Folic acid': 'Folic Acid (Synthetic)',
  'Folate, food': 'Folate (Natural)',
  'Vitamin B-12': 'Vitamin B12',
  'Vitamin A, RAE': 'Vitamin A (RAE)',
  'Retinol': 'Retinol',
  'Carotene, beta': 'Beta Carotene',
  'Vitamin D (D2 + D3)': 'Vitamin D',
  'Vitamin E (alpha-tocopherol)': 'Vitamin E',
  'Vitamin K (phylloquinone)': 'Vitamin K',

  // Minerals
  'Calcium, Ca': 'Calcium',
  'Iron, Fe': 'Iron',
  'Magnesium, Mg': 'Magnesium',
  'Phosphorus, P': 'Phosphorus',
  'Potassium, K': 'Potassium',
  'Sodium, Na': 'Sodium',
  'Zinc, Zn': 'Zinc',
  'Copper, Cu': 'Copper',
  'Manganese, Mn': 'Manganese',
  'Selenium, Se': 'Selenium',

  // Lipids
  'Cholesterol': 'Cholesterol',
  'Fatty acids, total saturated': 'Saturated Fat',
  'Fatty acids, total monounsaturated': 'Monounsaturated Fat',
  'Fatty acids, total polyunsaturated': 'Polyunsaturated Fat',
  'Fatty acids, total trans': 'Trans Fat',

  // Amino Acids
  'Tryptophan': 'Tryptophan',
  'Threonine': 'Threonine',
  'Isoleucine': 'Isoleucine',
  'Leucine': 'Leucine',
  'Lysine': 'Lysine',
  'Methionine': 'Methionine',
  'Phenylalanine': 'Phenylalanine',
  'Valine': 'Valine',
  'Histidine': 'Histidine',

  // Other
  'Caffeine': 'Caffeine',
  'Alcohol, ethyl': 'Alcohol',
};

/**
 * Standard unit for each nutrient
 */
const STANDARD_UNITS: Record<string, string> = {
  // Macros (grams)
  'Protein': 'g',
  'Total Fat': 'g',
  'Carbohydrate': 'g',
  'Dietary Fiber': 'g',
  'Water': 'g',
  'Ash': 'g',
  'Calories': 'kcal',

  // Vitamins
  'Vitamin C': 'mg',
  'Vitamin B1 (Thiamin)': 'mg',
  'Vitamin B2 (Riboflavin)': 'mg',
  'Vitamin B3 (Niacin)': 'mg',
  'Vitamin B5 (Pantothenic Acid)': 'mg',
  'Vitamin B6': 'mg',
  'Folate (Total)': 'μg',
  'Folate (Natural)': 'μg',
  'Folic Acid (Synthetic)': 'μg',
  'Vitamin B12': 'μg',
  'Vitamin A (RAE)': 'μg',
  'Retinol': 'μg',
  'Beta Carotene': 'μg',
  'Vitamin D': 'μg',
  'Vitamin E': 'mg',
  'Vitamin K': 'μg',

  // Minerals
  'Calcium': 'mg',
  'Iron': 'mg',
  'Magnesium': 'mg',
  'Phosphorus': 'mg',
  'Potassium': 'mg',
  'Sodium': 'mg',
  'Zinc': 'mg',
  'Copper': 'mg',
  'Manganese': 'mg',
  'Selenium': 'μg',

  // Lipids
  'Cholesterol': 'mg',
  'Saturated Fat': 'g',
  'Monounsaturated Fat': 'g',
  'Polyunsaturated Fat': 'g',
  'Trans Fat': 'g',
  'Trans Fat (Monoenoic)': 'g',
  'Trans Fat (Polyenoic)': 'g',

  // Amino Acids
  'Tryptophan': 'g',
  'Threonine': 'g',
  'Isoleucine': 'g',
  'Leucine': 'g',
  'Lysine': 'g',
  'Methionine': 'g',
  'Phenylalanine': 'g',
  'Valine': 'g',
  'Histidine': 'g',

  // Other
  'Caffeine': 'mg',
  'Alcohol': 'g',
};

/**
 * Unit conversion factors (to standard unit)
 */
const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  'g': { 'g': 1, 'mg': 1000, 'μg': 1000000, 'mcg': 1000000 },
  'mg': { 'g': 0.001, 'mg': 1, 'μg': 1000, 'mcg': 1000 },
  'μg': { 'g': 0.000001, 'mg': 0.001, 'μg': 1, 'mcg': 1 },
  'kcal': { 'kcal': 1, 'kJ': 0.239 },
  'IU': { 'IU': 1 }, // International Units (context-dependent, handle separately)
};

/**
 * Nutrient Mapper Service
 */
export class NutrientMapper {
  // In-memory cache for compound_sources lookups (external_source:external_id -> compound_id)
  private mappingCache: Map<string, { compoundId: string | null; sourceUnit: string | null }> = new Map();

  /**
   * Look up compound ID from compound_sources table
   *
   * @param externalSource - API source ('CNF' or 'FDC')
   * @param externalId - Nutrient ID from the external API
   * @returns Compound UUID or null if not found
   */
  async lookupCompoundId(externalSource: 'CNF' | 'FDC', externalId: string): Promise<string | null> {
    return (await this.lookupMapping(externalSource, externalId)).compoundId;
  }

  /**
   * The compound a source's nutrient id maps to, AND the unit that source publishes it in.
   *
   * The unit matters because CNF's API sends values with no unit at all. Guessing was costing real
   * accuracy: choline reached 96 foods stored as grams when the values were milligrams, so the bar
   * read 1600 % for a carrot (see scripts/fix-merged-nutrient-units.ts). The unit was in the database
   * the whole time — all 117 CNF mappings carry `source_unit`, choline's says `mg` — and nothing asked
   * for it. Same query as before, so this costs nothing.
   */
  async lookupMapping(
    externalSource: 'CNF' | 'FDC',
    externalId: string
  ): Promise<{ compoundId: string | null; sourceUnit: string | null }> {
    const cacheKey = `${externalSource}:${externalId}`;

    const cached = this.mappingCache.get(cacheKey);
    if (cached) return cached;

    try {
      const result = await db
        .select({ compoundId: compoundSources.compoundId, sourceUnit: compoundSources.sourceUnit })
        .from(compoundSources)
        .where(
          and(
            eq(compoundSources.externalSource, externalSource),
            eq(compoundSources.externalId, externalId)
          )
        )
        .limit(1);

      const mapping = {
        compoundId: result[0]?.compoundId || null,
        sourceUnit: result[0]?.sourceUnit || null,
      };

      this.mappingCache.set(cacheKey, mapping);

      if (!mapping.compoundId) {
        logger.debug(
          { service: 'nutrient-mapper', externalSource, externalId },
          'No compound mapping found'
        );
      }

      return mapping;
    } catch (error) {
      logger.error(
        {
          service: 'nutrient-mapper',
          externalSource,
          externalId,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to lookup compound ID'
      );
      return { compoundId: null, sourceUnit: null };
    }
  }

  /**
   * Standardize a nutrient from CNF
   *
   * Note: CNF API doesn't provide unit information. Values are per 100g in standard units.
   * If unit is not provided (empty string), assumes value is already in standard unit.
   */
  async standardizeCNF(
    nutrientName: string,
    value: number,
    nutrientId?: string,
    unit?: string
  ): Promise<StandardizedNutrient | null> {
    // Use mapped name if available, otherwise use original name
    const standardName = CNF_NUTRIENT_MAP[nutrientName] || nutrientName;

    // CNF's API sends values with no unit, so the unit has to come from somewhere else. In order of
    // trust: what the caller passed, then the unit this very mapping records CNF as publishing (all 117
    // CNF mappings carry one), then our own dictionary.
    //
    // What it must NOT fall back to is grams. That was the old behaviour — `STANDARD_UNITS[name] ||
    // unit || 'g'` against a dictionary of 52 entries for 280 compounds — and it silently labelled
    // every unlisted micronutrient as grams. Choline went into 96 foods that way, milligram values
    // under a gram label, and the bar read a thousand times high. A guess that is wrong by 10³ and
    // looks plausible is worse than no value, so an unknown unit is now logged and the nutrient is
    // skipped rather than invented.
    const mapping = nutrientId
      ? await this.lookupMapping('CNF', nutrientId)
      : { compoundId: null, sourceUnit: null };
    const compoundId = mapping.compoundId;

    const actualUnit = unit || mapping.sourceUnit || STANDARD_UNITS[standardName] || null;
    if (!actualUnit) {
      logger.warn(
        { service: 'nutrient-mapper', sourceApi: 'CNF', nutrientName, standardName, nutrientId },
        'No unit for this CNF nutrient — not in the mapping, not in STANDARD_UNITS, and none supplied. Skipping rather than assuming grams.'
      );
      return null;
    }

    // Store in our dictionary's unit where we have an opinion, otherwise in the unit the value is
    // actually in. Either way the conversion is explicit rather than assumed.
    const standardUnit = STANDARD_UNITS[standardName] || actualUnit;
    const { convertedValue, conversionApplied } = this.convertUnit(value, actualUnit, standardUnit);

    return {
      compoundId,
      standardName,
      value: convertedValue,
      unit: standardUnit,
      category: this.getCategory(standardName),
      sourceApi: 'CNF',
      originalName: nutrientName,
      originalId: nutrientId,
      conversionApplied,
    };
  }

  /**
   * Standardize a nutrient from USDA/FDC
   */
  async standardizeUSDA(
    nutrientName: string,
    value: number,
    unit: string,
    nutrientId?: string
  ): Promise<StandardizedNutrient | null> {
    // Use mapped name if available, otherwise use original name
    const standardName = USDA_NUTRIENT_MAP[nutrientName] || nutrientName;
    const standardUnit = STANDARD_UNITS[standardName] || unit;

    // Only convert if we have a target unit
    const { convertedValue, conversionApplied } = standardUnit
      ? this.convertUnit(value, unit, standardUnit)
      : { convertedValue: value, conversionApplied: false };

    // Lookup compound ID from compound_sources
    const compoundId = nutrientId ? await this.lookupCompoundId('FDC', nutrientId) : null;

    return {
      compoundId,
      standardName,
      value: convertedValue,
      unit: standardUnit || unit,
      category: this.getCategory(standardName),
      sourceApi: 'FDC',
      originalName: nutrientName,
      originalId: nutrientId,
      conversionApplied,
    };
  }

  /**
   * Convert value from one unit to another
   */
  private convertUnit(
    value: number,
    fromUnit: string,
    toUnit: string
  ): { convertedValue: number; conversionApplied: boolean } {
    if (fromUnit === toUnit) {
      return { convertedValue: value, conversionApplied: false };
    }

    const conversionFactor = UNIT_CONVERSIONS[toUnit]?.[fromUnit];

    if (!conversionFactor) {
      logger.warn(
        { service: 'nutrient-mapper', fromUnit, toUnit },
        'Unit conversion not found - using original value'
      );
      return { convertedValue: value, conversionApplied: false };
    }

    return {
      convertedValue: value * conversionFactor,
      conversionApplied: true,
    };
  }

  /**
   * Get nutrient category
   */
  private getCategory(standardName: string): NutrientCategory {
    if (['Protein', 'Total Fat', 'Carbohydrate', 'Dietary Fiber', 'Calories'].includes(standardName)) {
      return 'MACRONUTRIENT';
    }

    if (standardName.startsWith('Vitamin')) {
      return 'VITAMIN';
    }

    if (['Calcium', 'Iron', 'Magnesium', 'Phosphorus', 'Potassium', 'Sodium', 'Zinc', 'Copper', 'Manganese', 'Selenium'].includes(standardName)) {
      return 'MINERAL';
    }

    if (['Tryptophan', 'Threonine', 'Isoleucine', 'Leucine', 'Lysine', 'Methionine', 'Phenylalanine', 'Valine', 'Histidine'].includes(standardName)) {
      return 'AMINO_ACID';
    }

    if (standardName.includes('Fat') && !standardName.includes('Total')) {
      return 'FATTY_ACID';
    }

    return 'OTHER';
  }

  /**
   * Get list of all standard nutrients we track
   */
  getAllStandardNutrients(): StandardNutrient[] {
    return Object.entries(STANDARD_UNITS).map(([name, unit]) => ({
      name,
      unit,
      category: this.getCategory(name),
      aliases: this.getAliases(name),
    }));
  }

  /**
   * Get aliases for a standard nutrient name
   */
  private getAliases(standardName: string): string[] {
    const aliases: string[] = [];

    // Find CNF aliases
    for (const [cnfName, stdName] of Object.entries(CNF_NUTRIENT_MAP)) {
      if (stdName === standardName) {
        aliases.push(cnfName);
      }
    }

    // Find USDA aliases
    for (const [usdaName, stdName] of Object.entries(USDA_NUTRIENT_MAP)) {
      if (stdName === standardName) {
        aliases.push(usdaName);
      }
    }

    return [...new Set(aliases)]; // Remove duplicates
  }
}

/**
 * Singleton nutrient mapper instance
 */
export const nutrientMapper = new NutrientMapper();
