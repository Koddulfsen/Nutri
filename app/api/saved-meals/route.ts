/**
 * The user's saved meals ("My meals"). See lib/services/saved-meals.ts.
 *
 *   GET    /api/saved-meals              → { meals: SavedMeal[] }
 *   POST   /api/saved-meals              { name, items } → 201 { id }
 *   PATCH  /api/saved-meals              { id, name }
 *   DELETE /api/saved-meals?id=…         (a real delete)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/with-auth';
import {
  createSavedMeal,
  deleteSavedMeal,
  listSavedMeals,
  MAX_SAVED_MEAL_ITEMS,
  renameSavedMeal,
  SavedMealError,
} from '@/lib/services/saved-meals';
import { ensureUserProfile } from '@/lib/services/user-service';

const Name = z.string().trim().min(1, 'Give the meal a name').max(80);

const CreateSchema = z.object({
  name: Name,
  items: z
    .array(
      z.object({
        foodId: z.string().uuid(),
        grams: z.number().positive().max(5000),
        portion: z.string().trim().min(1).max(120),
      })
    )
    .min(1)
    .max(MAX_SAVED_MEAL_ITEMS),
});

const RenameSchema = z.object({ id: z.string().uuid(), name: Name });
const DeleteSchema = z.object({ id: z.string().uuid() });

function fail(err: unknown) {
  if (err instanceof SavedMealError) {
    return NextResponse.json({ error: err.message, message: err.message }, { status: err.status });
  }
  throw err;
}

export const GET = withAuth(async ({ user }) => {
  return NextResponse.json({ meals: await listSavedMeals(user.id) });
});

export const POST = withAuth(
  async ({ user, input }) => {
    // saved_meal_templates.user_id references user_profiles.
    await ensureUserProfile(user.id, {
      fullName: user.user_metadata?.full_name || user.user_metadata?.name,
      avatarUrl: user.user_metadata?.avatar_url,
    });
    try {
      return NextResponse.json(await createSavedMeal(user.id, input.name, input.items), { status: 201 });
    } catch (err) {
      return fail(err);
    }
  },
  { schema: CreateSchema, source: 'body' }
);

export const PATCH = withAuth(
  async ({ user, input }) => {
    try {
      await renameSavedMeal(user.id, input.id, input.name);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return fail(err);
    }
  },
  { schema: RenameSchema, source: 'body' }
);

export const DELETE = withAuth(
  async ({ user, input }) => {
    try {
      await deleteSavedMeal(user.id, input.id);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return fail(err);
    }
  },
  { schema: DeleteSchema, source: 'query' }
);
