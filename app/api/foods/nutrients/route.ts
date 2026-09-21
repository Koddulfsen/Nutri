/**
 * Food Nutrients API Endpoint
 *
 * POST /api/foods/nutrients
 *
 * Returns each requested food's nutrients per 100 g, in the compact wire
 * format (lib/nutrition/wire.ts). The browser asks for a food's numbers the
 * moment it is picked, so that adding it can update the totals instantly
 * instead of waiting for the server to recalculate.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, inArray, or } from 'drizzle-orm';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/db';
import { foods } from '@/db/schema';
import { loadFoodVectors } from '@/lib/services/food-vectors';
import { packVectors } from '@/lib/nutrition/wire';

const NutrientsSchema = z.object({
  foodIds: z.array(z.string().uuid('Invalid food ID')).min(1).max(50),
});

export const POST = withAuth(
  async ({ user, input }) => {
    // Only foods this user may see — public ones, or their own private ones.
    // Someone else's private recipe must not be readable by guessing its id.
    const visible = await db
      .select({ id: foods.id })
      .from(foods)
      .where(
        and(
          inArray(foods.id, input.foodIds),
          or(eq(foods.visibility, 'public'), and(eq(foods.visibility, 'private'), eq(foods.createdBy, user.id)))
        )
      );

    const vectors = await loadFoodVectors(visible.map((f) => f.id));
    return NextResponse.json({ vectors: packVectors(vectors) });
  },
  { schema: NutrientsSchema, source: 'body' }
);
