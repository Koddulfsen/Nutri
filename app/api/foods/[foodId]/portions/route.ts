/**
 * Food Portions API Endpoint
 *
 * GET /api/foods/[foodId]/portions
 *
 * Returns portions for a food, sorted by isDefault first then sortOrder.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { foodPortions } from '@/db/schema/food_portions';
import { eq, desc, asc } from 'drizzle-orm';
import { logger } from '@/lib/logger';

const FoodIdSchema = z.string().uuid();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ foodId: string }> }
) {
  try {
    const { foodId } = await params;
    const validation = FoodIdSchema.safeParse(foodId);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid food ID (must be UUID)' }, { status: 400 });
    }

    const rows = await db
      .select({
        id: foodPortions.id,
        description: foodPortions.description,
        gramWeight: foodPortions.gramWeight,
        isDefault: foodPortions.isDefault,
        sortOrder: foodPortions.sortOrder,
      })
      .from(foodPortions)
      .where(eq(foodPortions.foodId, validation.data))
      .orderBy(desc(foodPortions.isDefault), asc(foodPortions.sortOrder));

    return NextResponse.json({
      portions: rows.map((r) => ({
        id: r.id,
        description: r.description,
        gramWeight: parseFloat(r.gramWeight),
        isDefault: r.isDefault,
      })),
    });
  } catch (error) {
    logger.error(
      { service: 'food-portions-api', error: error instanceof Error ? error.message : String(error) },
      'Failed to fetch food portions'
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
