/**
 * Composite foods: a named food made of other foods, each with its mass.
 *
 * Totals never read a composite's own nutrient rows — food-expansion.ts walks
 * `food_components` down to the atoms at read time — so a recipe is just its
 * name and its components.
 *
 * Always inserted private. A public (branded) submission additionally gets a
 * PENDING food_approvals row; admin review flips it public on approval.
 */

import { and, eq, inArray, or } from 'drizzle-orm';
import { db } from '@/db';
import { foods, foodComponents, foodApprovals } from '@/db/schema';
import { logger } from '@/lib/logger';

export interface CompositeComponent {
  foodId: string;
  grams: number;
  notes?: string;
}

export interface CreateCompositeInput {
  userId: string;
  name: string;
  components: CompositeComponent[];
  /** 'private' = the user's own recipe; 'public' = submitted for review. */
  visibility: 'private' | 'public';
  description?: string;
}

export class CompositeError extends Error {}

export async function createComposite(input: CreateCompositeInput): Promise<{ id: string; name: string }> {
  const { userId, name, components, visibility, description } = input;

  // Components must be foods this user can see: public, or their own private ones.
  const ids = [...new Set(components.map((c) => c.foodId))];
  const visible = await db
    .select({ id: foods.id })
    .from(foods)
    .where(
      and(
        inArray(foods.id, ids),
        or(eq(foods.visibility, 'public'), and(eq(foods.visibility, 'private'), eq(foods.createdBy, userId)))
      )
    );
  if (visible.length !== ids.length) throw new CompositeError('One of the ingredients was not found.');

  const created = await db.transaction(async (tx) => {
    const [newFood] = await tx
      .insert(foods)
      .values({
        name,
        description: description ?? null,
        isComposite: true,
        visibility: 'private',
        createdBy: userId,
        dataSource: 'NUTRI',
        originType: 'composite',
      })
      .returning({ id: foods.id, name: foods.name });

    await tx.insert(foodComponents).values(
      components.map((c, position) => ({
        compositeFoodId: newFood.id,
        componentFoodId: c.foodId,
        grams: c.grams.toString(),
        position,
        notes: c.notes ?? null,
      }))
    );

    if (visibility === 'public') {
      await tx.insert(foodApprovals).values({ foodId: newFood.id, status: 'PENDING', requestedBy: userId });
    }

    return newFood;
  });

  logger.info(
    { service: 'composite-service', userId, foodId: created.id, visibility, componentCount: components.length },
    'Composite food created'
  );
  return created;
}
