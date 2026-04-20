/**
 * Food Enrichment API Endpoint
 *
 * POST /api/foods/[foodId]/enrich
 *
 * Purpose: Enrich a food with compound data from external sources
 * Sources: FooDB, Dr. Duke's, Phenol-Explorer
 *
 * Features:
 *   - Auto-match food to external databases
 *   - Pull compound values for matched foods
 *   - Map to internal compound IDs
 *   - Add new nutrient values (doesn't overwrite existing)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { enrichFood, previewEnrichment } from '@/lib/sources';
import { requireAdmin } from '@/lib/auth/api-guard';

const FoodIdSchema = z.string().uuid();

/**
 * POST /api/foods/[foodId]/enrich
 * Enrich a food with compound data from external sources
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ foodId: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const { foodId } = await params;

    // Validate food ID
    const validationResult = FoodIdSchema.safeParse(foodId);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid food ID - must be a UUID' },
        { status: 400 }
      );
    }

    // Get food from database
    const queryResult = await db.execute(sql`
      SELECT id, name, description
      FROM foods
      WHERE id = ${foodId}::uuid
    `);

    const rows = (queryResult as any).rows ?? queryResult;
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'Food not found' },
        { status: 404 }
      );
    }

    const foodData = rows[0] as { id: string; name: string; description: string };

    // Extract scientific name from description if available
    const scientificName = extractScientificName(foodData.description);

    // Enrich the food
    const result = await enrichFood(foodData.id, foodData.name, scientificName);

    return NextResponse.json({
      success: true,
      foodId: result.foodId,
      foodName: result.foodName,
      matchesFound: result.matchesFound,
      compoundsAdded: result.compoundsAdded,
      sources: result.sources,
      compounds: result.compounds.slice(0, 20), // Return first 20 for preview
    });
  } catch (error) {
    console.error('Food enrichment error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/foods/[foodId]/enrich
 * Preview enrichment without applying it
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ foodId: string }> }
) {
  try {
    const { foodId } = await params;

    // Validate food ID
    const validationResult = FoodIdSchema.safeParse(foodId);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid food ID - must be a UUID' },
        { status: 400 }
      );
    }

    // Get food from database
    const queryResult = await db.execute(sql`
      SELECT id, name, description
      FROM foods
      WHERE id = ${foodId}::uuid
    `);

    const rows = (queryResult as any).rows ?? queryResult;
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'Food not found' },
        { status: 404 }
      );
    }

    const foodData = rows[0] as { id: string; name: string; description: string };

    // Extract scientific name
    const scientificName = extractScientificName(foodData.description);

    // Preview enrichment
    const preview = await previewEnrichment(foodData.name, scientificName);

    return NextResponse.json({
      foodId: foodData.id,
      foodName: foodData.name,
      canEnrich: preview.matchCount > 0,
      matchCount: preview.matchCount,
      estimatedCompounds: preview.estimatedCompounds,
    });
  } catch (error) {
    console.error('Food enrichment preview error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Extract scientific name from food description
 * E.g., "Broccoli (Brassica oleracea)" → "Brassica oleracea"
 */
function extractScientificName(description?: string): string | undefined {
  if (!description) return undefined;

  // Look for text in parentheses that looks like a scientific name
  const match = description.match(/\(([A-Z][a-z]+ [a-z]+)/);
  if (match) {
    return match[1];
  }

  return undefined;
}
