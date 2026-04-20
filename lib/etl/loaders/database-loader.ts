/**
 * Database Loader
 *
 * Purpose: Load transformed food data into database with transaction support
 * Pattern: Atomic inserts with upsert logic and batch optimization
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 1650-1800 (Loading Layer)
 */

import { db } from '@/db';
import { foods, foodNutrientValues, quarantineImports } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import type { ConfidenceScore } from '@/lib/etl/transformers/confidence-scorer';

/**
 * Transformed Food Data (ready for database)
 */
export interface TransformedFood {
  fdcId: number;
  name: string;
  description: string | null;
  foodCategoryId: string | null; // Internal category UUID
  defaultPortionType: string | null;
  defaultPortionSize: number | null;
  isEstimated: boolean;
  dataSource: 'USDA';

  nutrients: Array<{
    compoundId: string; // Internal compound UUID
    value: number;
    unit: string;
    confidence: ConfidenceScore;
    cvPercentage: number | null;
    validationWarnings: any;
  }>;
}

/**
 * Load Result
 */
export interface LoadResult {
  success: boolean;
  foodId?: string;
  quarantineId?: string;
  error?: string;
  nutrientsInserted?: number;
}

/**
 * Quarantine Data
 */
export interface QuarantineData {
  foodData: any;
  validationErrors: Array<{ rule: string; severity: string; message: string }>;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
}

/**
 * Database Loader
 * Handles atomic database operations for food imports
 */
export class DatabaseLoader {
  /**
   * Load transformed food into database
   *
   * @param transformedFood - Transformed food data
   * @returns Load result
   */
  async loadFood(transformedFood: TransformedFood): Promise<LoadResult> {
    try {
      logger.debug(
        {
          service: 'database-loader',
          fdcId: transformedFood.fdcId,
          nutrientCount: transformedFood.nutrients.length,
        },
        'Loading food into database'
      );

      // Use transaction to ensure atomicity
      const result = await db.transaction(async (tx) => {
        // Step 1: Upsert food record (ON CONFLICT UPDATE if fdc_id exists)
        const existingFood = await tx
          .select({ id: foods.id })
          .from(foods)
          .where(eq(foods.fdcId, transformedFood.fdcId))
          .limit(1);

        let foodId: string;

        if (existingFood.length > 0) {
          // Update existing food
          foodId = existingFood[0].id;

          await tx
            .update(foods)
            .set({
              name: transformedFood.name,
              description: transformedFood.description,
              foodCategoryId: transformedFood.foodCategoryId,
              defaultPortionType: transformedFood.defaultPortionType,
              defaultPortionSize: transformedFood.defaultPortionSize
                ? transformedFood.defaultPortionSize.toString()
                : null,
              isEstimated: transformedFood.isEstimated,
              dataSource: transformedFood.dataSource,
              updatedAt: new Date(),
            })
            .where(eq(foods.id, foodId));

          logger.debug(
            {
              service: 'database-loader',
              fdcId: transformedFood.fdcId,
              foodId,
            },
            'Updated existing food record'
          );
        } else {
          // Insert new food
          const [insertedFood] = await tx
            .insert(foods)
            .values({
              fdcId: transformedFood.fdcId,
              name: transformedFood.name,
              description: transformedFood.description,
              foodCategoryId: transformedFood.foodCategoryId,
              defaultPortionType: transformedFood.defaultPortionType,
              defaultPortionSize: transformedFood.defaultPortionSize
                ? transformedFood.defaultPortionSize.toString()
                : null,
              isEstimated: transformedFood.isEstimated,
              dataSource: transformedFood.dataSource,
            })
            .returning({ id: foods.id });

          foodId = insertedFood.id;

          logger.debug(
            {
              service: 'database-loader',
              fdcId: transformedFood.fdcId,
              foodId,
            },
            'Inserted new food record'
          );
        }

        // Step 2: Insert nutrient values (batch insert for performance)
        if (transformedFood.nutrients.length > 0) {
          // Delete existing nutrient values for this food (USDA source)
          await tx
            .delete(foodNutrientValues)
            .where(eq(foodNutrientValues.foodId, foodId));

          // Batch insert new nutrient values (100 at a time)
          const batchSize = 100;
          let insertedCount = 0;

          for (let i = 0; i < transformedFood.nutrients.length; i += batchSize) {
            const batch = transformedFood.nutrients.slice(i, i + batchSize);

            await tx.insert(foodNutrientValues).values(
              batch.map((nutrient) => ({
                foodId,
                compoundId: nutrient.compoundId,
                source: 'USDA',
                value: nutrient.value.toString(),
                unit: nutrient.unit,
                confidenceL1: nutrient.confidence.l1,
                confidenceL2: nutrient.confidence.l2,
                confidenceL3: nutrient.confidence.l3,
                confidenceL4: nutrient.confidence.l4,
                confidenceFinal: nutrient.confidence.final,
                cvPercentage: nutrient.cvPercentage ? nutrient.cvPercentage.toString() : null,
                validationWarnings: nutrient.validationWarnings,
              }))
            );

            insertedCount += batch.length;

            logger.debug(
              {
                service: 'database-loader',
                foodId,
                batch: Math.floor(i / batchSize) + 1,
                insertedCount,
              },
              'Inserted nutrient batch'
            );
          }

          logger.info(
            {
              service: 'database-loader',
              fdcId: transformedFood.fdcId,
              foodId,
              nutrientsInserted: insertedCount,
            },
            'Successfully loaded food with nutrients'
          );

          return {
            success: true,
            foodId,
            nutrientsInserted: insertedCount,
          };
        } else {
          logger.warn(
            {
              service: 'database-loader',
              fdcId: transformedFood.fdcId,
              foodId,
            },
            'Food loaded without nutrients'
          );

          return {
            success: true,
            foodId,
            nutrientsInserted: 0,
          };
        }
      });

      return result;
    } catch (error) {
      logger.error(
        {
          service: 'database-loader',
          fdcId: transformedFood.fdcId,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to load food into database'
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Load food into quarantine (validation failed)
   *
   * @param quarantineData - Quarantine data
   * @returns Load result with quarantine ID
   */
  async loadQuarantine(quarantineData: QuarantineData): Promise<LoadResult> {
    try {
      logger.debug(
        {
          service: 'database-loader',
          severity: quarantineData.severity,
          errorCount: quarantineData.validationErrors.length,
        },
        'Loading food into quarantine'
      );

      const [inserted] = await db
        .insert(quarantineImports)
        .values({
          foodData: quarantineData.foodData,
          validationErrors: quarantineData.validationErrors,
          status: 'pending',
          severity: quarantineData.severity,
        })
        .returning({ id: quarantineImports.id });

      logger.info(
        {
          service: 'database-loader',
          quarantineId: inserted.id,
          severity: quarantineData.severity,
        },
        'Food loaded into quarantine'
      );

      return {
        success: true,
        quarantineId: inserted.id,
      };
    } catch (error) {
      logger.error(
        {
          service: 'database-loader',
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to load food into quarantine'
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Batch load multiple foods
   *
   * @param transformedFoods - Array of transformed foods
   * @returns Array of load results
   */
  async loadFoodBatch(transformedFoods: TransformedFood[]): Promise<LoadResult[]> {
    logger.info(
      {
        service: 'database-loader',
        count: transformedFoods.length,
      },
      'Batch loading foods'
    );

    const results: LoadResult[] = [];

    // Process sequentially to avoid transaction conflicts
    for (const food of transformedFoods) {
      const result = await this.loadFood(food);
      results.push(result);
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    logger.info(
      {
        service: 'database-loader',
        total: results.length,
        succeeded: successCount,
        failed: failureCount,
      },
      'Batch load completed'
    );

    return results;
  }
}

/**
 * Singleton loader instance
 */
export const databaseLoader = new DatabaseLoader();
