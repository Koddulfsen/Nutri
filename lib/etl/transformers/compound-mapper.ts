/**
 * Compound Mapper
 *
 * Purpose: Map USDA nutrient IDs to internal compound UUIDs with unit conversions
 * Pattern: Database lookup with logging for unmapped nutrients
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 1450-1600 (Transformation Layer)
 */

import { db } from '@/db';
import { compoundSources } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { getUnitConversion } from '@/lib/etl/mappings/nutrient-map';

/**
 * Mapped Nutrient
 * USDA nutrient mapped to internal compound ID
 */
export interface MappedNutrient {
  compoundId: string; // Internal compound UUID
  value: number;      // Converted value
  unit: string;       // Standardized unit
  originalValue: number;
  originalUnit: string;
  usdaNutrientNumber: string;
  usdaNutrientName: string;
  converted: boolean; // True if unit conversion was applied
}

/**
 * Compound Mapper
 * Maps USDA nutrients to internal compound system
 */
export class CompoundMapper {
  // Cache for compound mappings (nutrient number -> compound UUID)
  private mappingCache: Map<string, string> = new Map();
  private unmappedNutrients: Set<string> = new Set();

  /**
   * Map USDA nutrient to internal compound
   *
   * @param nutrientNumber - USDA nutrient number (e.g., "1003")
   * @param nutrientName - USDA nutrient name
   * @param value - Nutrient value
   * @param unit - Original unit from USDA
   * @returns Mapped nutrient or null if not mapped
   */
  async mapNutrient(
    nutrientNumber: string,
    nutrientName: string,
    value: number,
    unit: string
  ): Promise<MappedNutrient | null> {
    // Check cache first
    let compoundId: string | undefined = this.mappingCache.get(nutrientNumber);

    // If not cached, lookup in database
    if (!compoundId) {
      const lookupResult = await this.lookupCompoundId(nutrientNumber);
      compoundId = lookupResult ?? undefined;

      if (compoundId) {
        // Cache for future lookups
        this.mappingCache.set(nutrientNumber, compoundId);
      } else {
        // Log unmapped nutrient (only once per nutrient number)
        if (!this.unmappedNutrients.has(nutrientNumber)) {
          logger.warn(
            {
              service: 'compound-mapper',
              nutrientNumber,
              nutrientName,
            },
            'Unmapped USDA nutrient - skipping'
          );
          this.unmappedNutrients.add(nutrientNumber);
        }

        return null;
      }
    }

    // Check if unit conversion is needed
    const conversion = getUnitConversion(nutrientNumber, unit);

    let finalValue = value;
    let finalUnit = unit;
    let converted = false;

    if (conversion) {
      finalValue = value * conversion.factor;
      finalUnit = conversion.to;
      converted = true;

      logger.debug(
        {
          service: 'compound-mapper',
          nutrientNumber,
          nutrientName,
          originalValue: value,
          originalUnit: unit,
          convertedValue: finalValue,
          convertedUnit: finalUnit,
          conversionFactor: conversion.factor,
        },
        'Applied unit conversion'
      );
    }

    return {
      compoundId,
      value: finalValue,
      unit: finalUnit,
      originalValue: value,
      originalUnit: unit,
      usdaNutrientNumber: nutrientNumber,
      usdaNutrientName: nutrientName,
      converted,
    };
  }

  /**
   * Map multiple USDA nutrients in batch
   *
   * @param nutrients - Array of USDA nutrients
   * @returns Array of mapped nutrients (null entries filtered out)
   */
  async mapNutrients(
    nutrients: Array<{
      nutrientNumber: string;
      nutrientName: string;
      value: number;
      unit: string;
    }>
  ): Promise<MappedNutrient[]> {
    const mappedNutrients: MappedNutrient[] = [];

    for (const nutrient of nutrients) {
      const mapped = await this.mapNutrient(
        nutrient.nutrientNumber,
        nutrient.nutrientName,
        nutrient.value,
        nutrient.unit
      );

      if (mapped) {
        mappedNutrients.push(mapped);
      }
    }

    logger.debug(
      {
        service: 'compound-mapper',
        totalNutrients: nutrients.length,
        mappedNutrients: mappedNutrients.length,
        unmappedNutrients: nutrients.length - mappedNutrients.length,
      },
      'Batch nutrient mapping complete'
    );

    return mappedNutrients;
  }

  /**
   * Lookup compound UUID from database using USDA nutrient number
   *
   * @param nutrientNumber - USDA nutrient number
   * @returns Compound UUID or null if not found
   */
  private async lookupCompoundId(nutrientNumber: string): Promise<string | null> {
    try {
      // Query compound_sources table for USDA mapping
      const result = await db
        .select({ compoundId: compoundSources.compoundId })
        .from(compoundSources)
        .where(
          and(
            eq(compoundSources.externalSource, 'USDA'),
            eq(compoundSources.externalId, nutrientNumber)
          )
        )
        .limit(1);

      if (result.length > 0) {
        return result[0].compoundId;
      }

      return null;
    } catch (error) {
      logger.error(
        {
          service: 'compound-mapper',
          nutrientNumber,
          error: error instanceof Error ? error.message : String(error),
        },
        'Database lookup failed for compound mapping'
      );

      return null;
    }
  }

  /**
   * Preload all USDA compound mappings into cache
   * Call this once at startup for better performance
   */
  async preloadMappings(): Promise<void> {
    try {
      logger.info({ service: 'compound-mapper' }, 'Preloading USDA compound mappings');

      const mappings = await db
        .select({
          externalId: compoundSources.externalId,
          compoundId: compoundSources.compoundId,
        })
        .from(compoundSources)
        .where(eq(compoundSources.externalSource, 'USDA'));

      for (const mapping of mappings) {
        this.mappingCache.set(mapping.externalId, mapping.compoundId);
      }

      logger.info(
        {
          service: 'compound-mapper',
          mappingsLoaded: mappings.length,
        },
        'USDA compound mappings preloaded successfully'
      );
    } catch (error) {
      logger.error(
        {
          service: 'compound-mapper',
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to preload compound mappings'
      );
    }
  }

  /**
   * Get unmapped nutrients summary
   * Useful for debugging and expanding nutrient coverage
   */
  getUnmappedNutrients(): string[] {
    return Array.from(this.unmappedNutrients);
  }

  /**
   * Clear cache (useful for testing or after database updates)
   */
  clearCache(): void {
    this.mappingCache.clear();
    this.unmappedNutrients.clear();

    logger.debug({ service: 'compound-mapper' }, 'Mapping cache cleared');
  }
}

/**
 * Singleton mapper instance
 */
export const compoundMapper = new CompoundMapper();
