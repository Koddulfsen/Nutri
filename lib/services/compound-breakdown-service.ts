/**
 * Compound Breakdown Service
 *
 * Purpose: Get detailed per-food, per-source breakdown for a compound
 * Pattern: Calculates multi-level confidence (source → food → total)
 * Features:
 *   - Per-food breakdown with portion amounts
 *   - Per-source values (CNF, USDA, FooDB, etc.)
 *   - 3-tier confidence system with source caps
 *   - Volume-weighted total confidence
 *
 * Generated: 2026-01-09
 * Architecture: Phase 2 Feature System 02 (Enhanced Analysis)
 */

import { db } from '@/db';
import { mealLogs, mealItems, mergedNutrients, nutrientSourceValues, foods, compounds } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * Source value for a nutrient
 */
export interface SourceValue {
  source: string; // CNF, USDA, FooDB, etc.
  value: number;
  unit: string;
}

/**
 * Per-food breakdown for a compound
 */
export interface FoodBreakdown {
  foodId: string;
  foodName: string;
  portionGrams: number;
  amountFromFood: number; // Actual amount contributed (value * portion/100)
  valuePer100g: number; // Average value per 100g
  unit: string;
  sourceCount: number;
  sources: SourceValue[];
  discrepancyPercent: number; // How much sources disagree
  confidence: number; // 0-100, capped by source count
  confidenceTier: 1 | 2 | 3; // 1=low, 2=medium, 3=high
}

/**
 * Complete breakdown for a compound
 */
export interface CompoundBreakdown {
  compoundId: string;
  compoundName: string;
  totalAmount: number;
  unit: string;
  foods: FoodBreakdown[];
  totalConfidence: number; // Volume-weighted average
  totalConfidenceTier: 1 | 2 | 3;
}

/**
 * Calculate discrepancy percentage between source values
 * Uses max - min / average * 100
 */
function calculateDiscrepancy(values: number[]): number {
  if (values.length < 2) return 0;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  if (avg === 0) return 0;

  return ((max - min) / avg) * 100;
}

/**
 * Calculate confidence with source cap
 * - 1 source → max 33%
 * - 2 sources → max 66%
 * - 3+ sources → max 100%
 * - Confidence = 100 - discrepancy%, capped by source count
 */
function calculateConfidence(discrepancyPercent: number, sourceCount: number): { confidence: number; tier: 1 | 2 | 3 } {
  // Source cap based on number of sources
  let cap: number;
  if (sourceCount >= 3) {
    cap = 100;
  } else if (sourceCount === 2) {
    cap = 66;
  } else {
    cap = 33;
  }

  // Base confidence from discrepancy (100% - discrepancy)
  // Clamp discrepancy to 0-100 range
  const clampedDiscrepancy = Math.min(100, Math.max(0, discrepancyPercent));
  const baseConfidence = 100 - clampedDiscrepancy;

  // Apply cap
  const confidence = Math.min(baseConfidence, cap);

  // Determine tier: 0-33% = tier 1, 34-66% = tier 2, 67-100% = tier 3
  let tier: 1 | 2 | 3;
  if (confidence <= 33) {
    tier = 1;
  } else if (confidence <= 66) {
    tier = 2;
  } else {
    tier = 3;
  }

  return { confidence, tier };
}

/**
 * Get compound breakdown for selected meals
 *
 * @param userId - User ID
 * @param compoundId - Compound UUID
 * @param mealIds - Array of meal IDs to include
 * @returns Detailed breakdown by food and source
 */
export async function getCompoundBreakdown(
  userId: string,
  compoundId: string,
  mealIds: string[]
): Promise<CompoundBreakdown | null> {
  logger.info(
    {
      service: 'compound-breakdown-service',
      userId,
      compoundId,
      mealCount: mealIds.length,
    },
    'Getting compound breakdown'
  );

  const startTime = Date.now();

  try {
    // Step 1: Verify meals belong to user and get meal items
    const validMeals = await db
      .select({ id: mealLogs.id })
      .from(mealLogs)
      .where(
        and(
          eq(mealLogs.userId, userId),
          eq(mealLogs.isActive, true),
          inArray(mealLogs.id, mealIds)
        )
      );

    if (validMeals.length === 0) {
      logger.debug(
        { service: 'compound-breakdown-service', userId, compoundId },
        'No valid meals found'
      );
      return null;
    }

    const validMealIds = validMeals.map((m) => m.id);

    // Step 2: Get all meal items with food details
    const items = await db
      .select({
        foodId: mealItems.foodId,
        portionSize: mealItems.portionSize,
        foodName: foods.name,
      })
      .from(mealItems)
      .leftJoin(foods, eq(mealItems.foodId, foods.id))
      .where(inArray(mealItems.mealLogId, validMealIds));

    if (items.length === 0) {
      logger.debug(
        { service: 'compound-breakdown-service', userId, compoundId },
        'No meal items found'
      );
      return null;
    }

    // Step 3: Get compound details
    const [compound] = await db
      .select({
        id: compounds.id,
        name: compounds.name,
      })
      .from(compounds)
      .where(eq(compounds.id, compoundId))
      .limit(1);

    if (!compound) {
      logger.warn(
        { service: 'compound-breakdown-service', compoundId },
        'Compound not found'
      );
      return null;
    }

    // Step 4: Get merged nutrients for this compound for all foods
    const foodIds = [...new Set(items.map((item) => item.foodId))];

    const mergedNutrientData = await db
      .select({
        id: mergedNutrients.id,
        foodId: mergedNutrients.foodId,
        averageValue: mergedNutrients.averageValue,
        unit: mergedNutrients.unit,
        sourceCount: mergedNutrients.sourceCount,
      })
      .from(mergedNutrients)
      .where(
        and(
          inArray(mergedNutrients.foodId, foodIds),
          eq(mergedNutrients.compoundId, compoundId)
        )
      );

    // Create map of foodId -> merged nutrient data
    const nutrientByFood = new Map(
      mergedNutrientData.map((mn) => [mn.foodId, mn])
    );

    // Step 5: Get source values for all merged nutrients
    const mergedIds = mergedNutrientData.map((mn) => mn.id);

    let sourceValuesData: { mergedNutrientId: string; apiSource: string; value: string }[] = [];

    if (mergedIds.length > 0) {
      sourceValuesData = await db
        .select({
          mergedNutrientId: nutrientSourceValues.mergedNutrientId,
          apiSource: nutrientSourceValues.apiSource,
          value: nutrientSourceValues.value,
        })
        .from(nutrientSourceValues)
        .where(inArray(nutrientSourceValues.mergedNutrientId, mergedIds));
    }

    // Group source values by merged nutrient ID
    const sourcesByMerged = new Map<string, SourceValue[]>();
    for (const sv of sourceValuesData) {
      if (!sourcesByMerged.has(sv.mergedNutrientId)) {
        sourcesByMerged.set(sv.mergedNutrientId, []);
      }
      sourcesByMerged.get(sv.mergedNutrientId)!.push({
        source: sv.apiSource,
        value: parseFloat(sv.value),
        unit: nutrientByFood.get(
          mergedNutrientData.find((mn) => mn.id === sv.mergedNutrientId)?.foodId || ''
        )?.unit || 'g',
      });
    }

    // Step 6: Build per-food breakdown
    const foodBreakdowns: FoodBreakdown[] = [];
    let totalAmount = 0;
    let unit = 'g';

    // Group items by foodId to handle duplicate foods
    const foodItemMap = new Map<string, { foodName: string; totalPortion: number }>();
    for (const item of items) {
      const existing = foodItemMap.get(item.foodId);
      const portion = parseFloat(item.portionSize || '100');

      if (existing) {
        existing.totalPortion += portion;
      } else {
        foodItemMap.set(item.foodId, {
          foodName: item.foodName || 'Unknown Food',
          totalPortion: portion,
        });
      }
    }

    for (const [foodId, foodData] of foodItemMap) {
      const nutrient = nutrientByFood.get(foodId);

      if (!nutrient) {
        // Food doesn't have this compound - skip
        continue;
      }

      const valuePer100g = parseFloat(nutrient.averageValue);
      const portionGrams = foodData.totalPortion;
      const amountFromFood = valuePer100g * (portionGrams / 100);
      unit = nutrient.unit;
      totalAmount += amountFromFood;

      // Get source values for this food's nutrient
      const sources = sourcesByMerged.get(nutrient.id) || [];
      const sourceValues = sources.map((s) => s.value);

      // Calculate discrepancy
      const discrepancyPercent = calculateDiscrepancy(sourceValues);

      // Calculate confidence with source cap
      const { confidence, tier } = calculateConfidence(discrepancyPercent, nutrient.sourceCount);

      foodBreakdowns.push({
        foodId,
        foodName: foodData.foodName,
        portionGrams,
        amountFromFood,
        valuePer100g,
        unit,
        sourceCount: nutrient.sourceCount,
        sources,
        discrepancyPercent: Math.round(discrepancyPercent * 10) / 10,
        confidence: Math.round(confidence),
        confidenceTier: tier,
      });
    }

    if (foodBreakdowns.length === 0) {
      logger.debug(
        { service: 'compound-breakdown-service', userId, compoundId },
        'No foods contain this compound'
      );
      return null;
    }

    // Step 7: Calculate total volume-weighted confidence
    let weightedSum = 0;
    let totalWeight = 0;

    for (const fb of foodBreakdowns) {
      weightedSum += fb.confidence * fb.amountFromFood;
      totalWeight += fb.amountFromFood;
    }

    const totalConfidence = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

    // Determine total tier
    let totalTier: 1 | 2 | 3;
    if (totalConfidence <= 33) {
      totalTier = 1;
    } else if (totalConfidence <= 66) {
      totalTier = 2;
    } else {
      totalTier = 3;
    }

    const durationMs = Date.now() - startTime;

    logger.info(
      {
        service: 'compound-breakdown-service',
        userId,
        compoundId,
        compoundName: compound.name,
        foodCount: foodBreakdowns.length,
        totalAmount,
        totalConfidence,
        durationMs,
      },
      'Compound breakdown calculated'
    );

    return {
      compoundId: compound.id,
      compoundName: compound.name,
      totalAmount,
      unit,
      foods: foodBreakdowns,
      totalConfidence,
      totalConfidenceTier: totalTier,
    };
  } catch (error) {
    logger.error(
      {
        service: 'compound-breakdown-service',
        userId,
        compoundId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to get compound breakdown'
    );

    throw new Error(
      'Failed to get compound breakdown: ' +
        (error instanceof Error ? error.message : String(error))
    );
  }
}
