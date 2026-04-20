/**
 * ETL Orchestrator
 *
 * Purpose: Orchestrate the complete ETL pipeline (Extract → Transform → Load)
 * Pattern: Pipeline orchestration with deduplication and error handling
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 1150-1300 (Orchestration Layer)
 */

import { db } from '@/db';
import { foods } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { usdaExtractor } from './extractors/usda-extractor';
import { compoundMapper } from './transformers/compound-mapper';
import { confidenceScorer } from './transformers/confidence-scorer';
import { databaseLoader, type TransformedFood } from './loaders/database-loader';
import type { ImportJobResult } from '@/lib/queue/job-types';

/**
 * ETL Orchestrator
 * Coordinates the entire food import pipeline
 */
export class ETLOrchestrator {
  /**
   * Process single food import (complete ETL pipeline)
   *
   * @param fdcId - USDA FoodData Central ID
   * @returns Import result
   */
  async processSingleFoodImport(fdcId: number): Promise<ImportJobResult> {
    try {
      logger.info(
        { service: 'etl-orchestrator', fdcId },
        'Starting single food import'
      );

      // Step 1: Deduplication check - does food already exist?
      const existingFood = await this.checkExistingFood(fdcId);

      if (existingFood) {
        logger.info(
          {
            service: 'etl-orchestrator',
            fdcId,
            existingFoodId: existingFood.id,
          },
          'Food already exists - updating instead of creating'
        );
        // Continue with import to update existing data
      }

      // Step 2: Extract - Fetch from USDA API
      const extractedFood = await usdaExtractor.extractFood(fdcId);

      logger.debug(
        {
          service: 'etl-orchestrator',
          fdcId,
          nutrientCount: extractedFood.nutrients.length,
          stage: 'extract_complete',
        },
        'Extraction completed'
      );

      // Step 3: Transform - Map nutrients and calculate confidence scores
      const transformedFood = await this.transformFood(extractedFood);

      if (!transformedFood) {
        // Transformation failed (e.g., no mapped nutrients)
        return {
          status: 'FAILED',
          fdcId,
          reason: 'No mappable nutrients found',
        };
      }

      logger.debug(
        {
          service: 'etl-orchestrator',
          fdcId,
          mappedNutrientCount: transformedFood.nutrients.length,
          stage: 'transform_complete',
        },
        'Transformation completed'
      );

      // Step 4: Quality check - Validate confidence scores
      const qualityCheck = this.validateDataQuality(transformedFood);

      if (!qualityCheck.passed) {
        // Load into quarantine
        const quarantineResult = await databaseLoader.loadQuarantine({
          foodData: transformedFood,
          validationErrors: qualityCheck.errors,
          severity: qualityCheck.severity,
        });

        logger.warn(
          {
            service: 'etl-orchestrator',
            fdcId,
            quarantineId: quarantineResult.quarantineId,
            errors: qualityCheck.errors,
          },
          'Food quarantined due to quality issues'
        );

        return {
          status: 'QUARANTINED',
          fdcId,
          reason: 'Data quality validation failed',
          errors: qualityCheck.errors,
        };
      }

      // Step 5: Load - Insert into database
      const loadResult = await databaseLoader.loadFood(transformedFood);

      if (!loadResult.success) {
        logger.error(
          {
            service: 'etl-orchestrator',
            fdcId,
            error: loadResult.error,
          },
          'Database load failed'
        );

        return {
          status: 'FAILED',
          fdcId,
          reason: loadResult.error || 'Database load failed',
        };
      }

      logger.info(
        {
          service: 'etl-orchestrator',
          fdcId,
          foodId: loadResult.foodId,
          nutrientsInserted: loadResult.nutrientsInserted,
        },
        'Food import completed successfully'
      );

      return {
        status: 'SUCCESS',
        fdcId,
        foodId: loadResult.foodId,
      };
    } catch (error) {
      logger.error(
        {
          service: 'etl-orchestrator',
          fdcId,
          error: error instanceof Error ? error.message : String(error),
        },
        'Food import failed with error'
      );

      return {
        status: 'FAILED',
        fdcId,
        reason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process batch food import
   *
   * @param fdcIds - Array of USDA FoodData Central IDs
   * @returns Array of import results
   */
  async processBatchFoodImport(fdcIds: number[]): Promise<ImportJobResult[]> {
    logger.info(
      {
        service: 'etl-orchestrator',
        count: fdcIds.length,
      },
      'Starting batch food import'
    );

    const results: ImportJobResult[] = [];

    // Process each food sequentially to avoid overwhelming API/DB
    for (const fdcId of fdcIds) {
      const result = await this.processSingleFoodImport(fdcId);
      results.push(result);
    }

    const successCount = results.filter((r) => r.status === 'SUCCESS').length;
    const quarantineCount = results.filter((r) => r.status === 'QUARANTINED').length;
    const failedCount = results.filter((r) => r.status === 'FAILED').length;

    logger.info(
      {
        service: 'etl-orchestrator',
        total: results.length,
        succeeded: successCount,
        quarantined: quarantineCount,
        failed: failedCount,
      },
      'Batch food import completed'
    );

    return results;
  }

  /**
   * Check if food already exists in database
   *
   * @param fdcId - USDA FoodData Central ID
   * @returns Existing food or null
   */
  private async checkExistingFood(fdcId: number): Promise<{ id: string } | null> {
    try {
      const result = await db
        .select({ id: foods.id })
        .from(foods)
        .where(eq(foods.fdcId, fdcId))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.warn(
        {
          service: 'etl-orchestrator',
          fdcId,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to check for existing food'
      );

      return null;
    }
  }

  /**
   * Transform extracted USDA food into internal schema
   *
   * @param extractedFood - Extracted USDA food data
   * @returns Transformed food or null if transformation failed
   */
  private async transformFood(extractedFood: any): Promise<TransformedFood | null> {
    // Map USDA nutrients to internal compounds
    const mappedNutrients = await compoundMapper.mapNutrients(
      extractedFood.nutrients.map((n: any) => ({
        nutrientNumber: n.nutrientNumber,
        nutrientName: n.nutrientName,
        value: n.value,
        unit: n.unit,
      }))
    );

    if (mappedNutrients.length === 0) {
      logger.warn(
        {
          service: 'etl-orchestrator',
          fdcId: extractedFood.fdcId,
          originalNutrientCount: extractedFood.nutrients.length,
        },
        'No nutrients could be mapped - skipping food'
      );

      return null;
    }

    // Calculate confidence scores for each nutrient
    const nutrientsWithConfidence = mappedNutrients.map((mappedNutrient, index) => {
      const originalNutrient = extractedFood.nutrients.find(
        (n: any) => n.nutrientNumber === mappedNutrient.usdaNutrientNumber
      );

      const confidence = confidenceScorer.calculateConfidence({
        dataPoints: originalNutrient?.dataPoints || null,
        derivationCode: originalNutrient?.derivationCode || null,
        derivationDescription: originalNutrient?.derivationDescription || null,
        dataType: extractedFood.dataType,
        publicationDate: extractedFood.publicationDate,
      });

      return {
        compoundId: mappedNutrient.compoundId,
        value: mappedNutrient.value,
        unit: mappedNutrient.unit,
        confidence,
        cvPercentage: null, // Single source, no CV yet
        validationWarnings: {},
      };
    });

    // Get default portion (first portion or 100g default)
    const defaultPortion = extractedFood.portions[0] || {
      amount: 100,
      modifier: 'g',
      gramWeight: 100,
    };

    return {
      fdcId: extractedFood.fdcId,
      name: extractedFood.name,
      description: extractedFood.description,
      foodCategoryId: null, // TODO: Map USDA category to internal category
      defaultPortionType: defaultPortion.modifier,
      defaultPortionSize: defaultPortion.gramWeight,
      isEstimated: false,
      dataSource: 'USDA',
      nutrients: nutrientsWithConfidence,
    };
  }

  /**
   * Validate data quality before loading
   *
   * @param transformedFood - Transformed food data
   * @returns Validation result
   */
  private validateDataQuality(transformedFood: TransformedFood): {
    passed: boolean;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    errors: Array<{ rule: string; severity: string; message: string }>;
  } {
    const errors: Array<{ rule: string; severity: string; message: string }> = [];

    // Check if we have basic macronutrients
    const hasCalories = transformedFood.nutrients.some((n) => n.compoundId.includes('calorie'));
    const hasProtein = transformedFood.nutrients.some((n) => n.compoundId.includes('protein'));
    const hasCarbs = transformedFood.nutrients.some((n) => n.compoundId.includes('carb'));
    const hasFat = transformedFood.nutrients.some((n) => n.compoundId.includes('fat'));

    if (!hasCalories && !hasProtein && !hasCarbs && !hasFat) {
      errors.push({
        rule: 'basic_macronutrients',
        severity: 'CRITICAL',
        message: 'Missing all basic macronutrients (calories, protein, carbs, fat)',
      });
    }

    // Check average confidence score
    const avgConfidence =
      transformedFood.nutrients.reduce((sum, n) => sum + n.confidence.final, 0) /
      transformedFood.nutrients.length;

    if (avgConfidence < 40) {
      errors.push({
        rule: 'low_confidence',
        severity: 'WARNING',
        message: `Average confidence score ${avgConfidence.toFixed(0)}% below threshold (40%)`,
      });
    }

    // Determine severity
    const hasCritical = errors.some((e) => e.severity === 'CRITICAL');
    const severity = hasCritical ? 'CRITICAL' : errors.length > 0 ? 'WARNING' : 'INFO';

    return {
      passed: !hasCritical, // Pass if no critical errors
      severity,
      errors,
    };
  }
}

/**
 * Singleton orchestrator instance
 */
export const etlOrchestrator = new ETLOrchestrator();
