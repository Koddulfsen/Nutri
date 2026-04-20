/**
 * Food Details API Endpoint
 *
 * GET /api/foods/[foodId]
 *
 * Purpose: Get food details with 4-layer cache lookup
 * Pattern: Cache-first with automatic cache population
 * Features:
 *   - Return: food metadata + all nutrients
 *   - Include confidence scores and sources
 *   - Add last_updated timestamp
 *   - 4-layer cache cascade (L1 → L2 → L3 → L4)
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 2500-2600 (Food Data API)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cacheService } from '@/lib/services/cache';
import { logger } from '@/lib/logger';

/**
 * Food ID parameter schema
 */
const FoodIdSchema = z.union([
  z.string().uuid(), // Internal UUID
  z.string().regex(/^\d+$/).transform((val) => parseInt(val, 10)), // FDC ID as string
]);

/**
 * GET /api/foods/[foodId]
 * Get food details with 4-layer cache lookup
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ foodId: string }> }
) {
  try {
    const { foodId } = await params;

    logger.debug(
      {
        service: 'food-details-api',
        foodId,
      },
      'Fetching food details'
    );

    // Step 1: Validate food ID
    const validationResult = FoodIdSchema.safeParse(foodId);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'food-details-api',
          foodId,
          errors: validationResult.error.errors,
        },
        'Invalid food ID'
      );

      return NextResponse.json(
        {
          error: 'Invalid food ID',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const parsedId = validationResult.data;

    // Step 2: Determine if ID is UUID or FDC ID
    const isUUID = typeof parsedId === 'string';
    const isFdcId = typeof parsedId === 'number';

    // Step 3: Fetch from 4-layer cache
    let foodData = null;

    if (isFdcId) {
      // FDC ID - use cache service
      foodData = await cacheService.getFoodData(parsedId);
    } else {
      // UUID - query database directly (no cache for UUID lookups)
      // TODO: Implement UUID lookup if needed
      logger.warn(
        {
          service: 'food-details-api',
          foodId,
        },
        'UUID lookup not yet implemented - use FDC ID instead'
      );

      return NextResponse.json(
        {
          error: 'UUID lookup not supported - please use FDC ID',
        },
        { status: 400 }
      );
    }

    // Step 4: Check if food found
    if (!foodData) {
      logger.info(
        {
          service: 'food-details-api',
          foodId,
        },
        'Food not found - not yet imported'
      );

      return NextResponse.json(
        {
          error: 'Food not found',
          message: 'This food has not been imported yet. Please import it first using /api/foods/import',
          fdcId: isFdcId ? parsedId : undefined,
        },
        { status: 404 }
      );
    }

    logger.info(
      {
        service: 'food-details-api',
        foodId,
        foodName: foodData.name,
        nutrientCount: foodData.nutrients.length,
      },
      'Food details retrieved'
    );

    // Step 5: Format response
    return NextResponse.json({
      id: foodData.id,
      fdcId: foodData.fdcId,
      name: foodData.name,
      description: foodData.description,
      category: foodData.foodCategoryId,
      defaultPortion: {
        type: foodData.defaultPortionType,
        size: foodData.defaultPortionSize,
      },
      isEstimated: foodData.isEstimated,
      dataSource: foodData.dataSource,
      nutrients: foodData.nutrients.map((n) => ({
        compoundId: n.compoundId,
        value: parseFloat(n.value),
        unit: n.unit,
        confidence: n.confidence,
        source: n.source,
      })),
      lastUpdated: foodData.updatedAt,
      createdAt: foodData.createdAt,
    });
  } catch (error) {
    logger.error(
      {
        service: 'food-details-api',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Food details API error'
    );

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
