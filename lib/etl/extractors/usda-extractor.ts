/**
 * USDA Data Extractor
 *
 * Purpose: Extract raw USDA food data via usda-service with proper error handling
 * Pattern: Extraction layer with structured data parsing
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 1300-1450 (Extraction Layer)
 */

import { usdaService } from '@/lib/services/usda-service';
import { USDAFoodDetails, USDANutrient } from '@/lib/services/usda-client';
import { logger } from '@/lib/logger';

/**
 * Extracted USDA Food Data
 * Simplified structure for transformation layer
 */
export interface ExtractedUSDAFood {
  fdcId: number;
  name: string;
  description: string | null;
  dataType: string; // 'SR Legacy', 'Foundation', 'Survey', 'Branded'
  publicationDate: string | null;

  // Portions
  portions: Array<{
    amount: number;
    modifier: string | null;
    gramWeight: number;
    sequenceNumber: number;
  }>;

  // Nutrients with raw USDA data
  nutrients: Array<{
    nutrientId: number;
    nutrientNumber: string;
    nutrientName: string;
    value: number;
    unit: string;
    derivationCode: string | null;
    derivationDescription: string | null;

    // Data quality metadata
    dataPoints: number | null;  // Sample size
    min: number | null;
    max: number | null;
    median: number | null;
    footnote: string | null;
  }>;

  // Category
  foodCategory: {
    id: number;
    code: string | null;
    description: string;
  } | null;
}

/**
 * USDA Data Extractor
 * Fetches and parses USDA food data
 */
export class USDAExtractor {
  /**
   * Extract food details from USDA API
   *
   * @param fdcId - USDA FoodData Central ID
   * @returns Extracted food data
   *
   * @throws Error if USDA API fails or data is invalid
   */
  async extractFood(fdcId: number): Promise<ExtractedUSDAFood> {
    try {
      logger.debug(
        { service: 'usda-extractor', fdcId },
        'Fetching food from USDA API'
      );

      // Fetch full food details (includes all nutrients and metadata)
      const usdaFood = await usdaService.getFoodDetails(fdcId, 'full');

      // Parse and structure the data
      const extracted = this.parseUSDAFood(usdaFood);

      logger.info(
        {
          service: 'usda-extractor',
          fdcId,
          nutrientCount: extracted.nutrients.length,
          portionCount: extracted.portions.length,
        },
        'Successfully extracted USDA food data'
      );

      return extracted;
    } catch (error) {
      logger.error(
        {
          service: 'usda-extractor',
          fdcId,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to extract USDA food data'
      );

      throw new Error(`USDA extraction failed for FDC ID ${fdcId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse USDA API response into structured format
   *
   * @param usdaFood - Raw USDA API response
   * @returns Structured extracted data
   */
  private parseUSDAFood(usdaFood: USDAFoodDetails): ExtractedUSDAFood {
    return {
      fdcId: usdaFood.fdcId,
      name: usdaFood.description,
      description: (usdaFood as any).additionalDescriptions || null,
      dataType: usdaFood.dataType,
      publicationDate: usdaFood.publicationDate || null,

      // Parse portions
      portions: this.parsePortions(usdaFood),

      // Parse nutrients
      nutrients: this.parseNutrients(usdaFood.foodNutrients || []),

      // Parse category
      foodCategory: this.parseFoodCategory(usdaFood),
    };
  }

  /**
   * Parse food portions from USDA data
   */
  private parsePortions(usdaFood: USDAFoodDetails): ExtractedUSDAFood['portions'] {
    const portions: ExtractedUSDAFood['portions'] = [];

    // SR Legacy and Foundation foods have foodPortions array
    if ((usdaFood as any).foodPortions) {
      const foodPortions = (usdaFood as any).foodPortions as Array<any>;

      for (const portion of foodPortions) {
        portions.push({
          amount: portion.amount || 1,
          modifier: portion.modifier || portion.portionDescription || null,
          gramWeight: portion.gramWeight,
          sequenceNumber: portion.sequenceNumber || 0,
        });
      }
    }

    // Branded foods have servingSize and servingSizeUnit
    if ((usdaFood as any).servingSize) {
      portions.push({
        amount: (usdaFood as any).servingSize,
        modifier: (usdaFood as any).servingSizeUnit || 'g',
        gramWeight: (usdaFood as any).servingSize,
        sequenceNumber: 1,
      });
    }

    // Default to 100g if no portions defined
    if (portions.length === 0) {
      portions.push({
        amount: 100,
        modifier: 'g',
        gramWeight: 100,
        sequenceNumber: 1,
      });
    }

    return portions;
  }

  /**
   * Parse nutrients from USDA data
   */
  private parseNutrients(foodNutrients: USDANutrient[]): ExtractedUSDAFood['nutrients'] {
    const nutrients: ExtractedUSDAFood['nutrients'] = [];

    for (const nutrient of foodNutrients) {
      // Skip nutrients without values
      if (nutrient.amount === null || nutrient.amount === undefined) {
        continue;
      }

      nutrients.push({
        nutrientId: nutrient.nutrient.id,
        nutrientNumber: nutrient.nutrient.number,
        nutrientName: nutrient.nutrient.name,
        value: nutrient.amount,
        unit: nutrient.nutrient.unitName,
        derivationCode: (nutrient as any).derivation?.code || null,
        derivationDescription: (nutrient as any).derivation?.description || null,

        // Data quality metadata (only present in some data types)
        dataPoints: (nutrient as any).dataPoints || null,
        min: (nutrient as any).min || null,
        max: (nutrient as any).max || null,
        median: (nutrient as any).median || null,
        footnote: (nutrient as any).footnote || null,
      });
    }

    return nutrients;
  }

  /**
   * Parse food category from USDA data
   */
  private parseFoodCategory(usdaFood: USDAFoodDetails): ExtractedUSDAFood['foodCategory'] {
    if ((usdaFood as any).foodCategory) {
      const category = (usdaFood as any).foodCategory;

      return {
        id: category.id,
        code: category.code || null,
        description: category.description,
      };
    }

    // Branded foods have brandedFoodCategory
    if ((usdaFood as any).brandedFoodCategory) {
      const category = (usdaFood as any).brandedFoodCategory;

      return {
        id: category.id,
        code: null,
        description: category.description || 'Branded Food',
      };
    }

    return null;
  }

  /**
   * Extract multiple foods in batch
   *
   * @param fdcIds - Array of USDA FoodData Central IDs
   * @returns Array of extracted food data
   */
  async extractFoodBatch(fdcIds: number[]): Promise<ExtractedUSDAFood[]> {
    logger.info(
      { service: 'usda-extractor', count: fdcIds.length },
      'Extracting food batch from USDA API'
    );

    const results: ExtractedUSDAFood[] = [];
    const errors: Array<{ fdcId: number; error: string }> = [];

    // Process in parallel (usda-service handles rate limiting)
    const promises = fdcIds.map(async (fdcId) => {
      try {
        const extracted = await this.extractFood(fdcId);
        results.push(extracted);
      } catch (error) {
        errors.push({
          fdcId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.all(promises);

    if (errors.length > 0) {
      logger.warn(
        {
          service: 'usda-extractor',
          totalRequested: fdcIds.length,
          succeeded: results.length,
          failed: errors.length,
          errors,
        },
        'Batch extraction completed with errors'
      );
    } else {
      logger.info(
        {
          service: 'usda-extractor',
          count: results.length,
        },
        'Batch extraction completed successfully'
      );
    }

    return results;
  }
}

/**
 * Singleton extractor instance
 */
export const usdaExtractor = new USDAExtractor();
