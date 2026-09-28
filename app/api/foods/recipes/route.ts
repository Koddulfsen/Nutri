/**
 * POST /api/foods/recipes — save a list of foods as the user's own recipe.
 *
 * Private to the user; food search finds it for them afterwards ("my
 * smoothie"). Used by the chat's "Save as recipe" button.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/with-auth';
import { createComposite, CompositeError } from '@/lib/services/composite-service';
import { ensureUserProfile } from '@/lib/services/user-service';

const RecipeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  components: z
    .array(
      z.object({
        foodId: z.string().uuid(),
        grams: z.number().positive().max(5000),
      })
    )
    .min(1)
    .max(25),
});

export const POST = withAuth(
  async ({ user, input }) => {
    // foods.created_by references user_profiles.
    await ensureUserProfile(user.id, {
      fullName: user.user_metadata?.full_name || user.user_metadata?.name,
      avatarUrl: user.user_metadata?.avatar_url,
    });
    try {
      const recipe = await createComposite({
        userId: user.id,
        name: input.name,
        components: input.components,
        visibility: 'private',
      });
      return NextResponse.json(recipe, { status: 201 });
    } catch (err) {
      if (err instanceof CompositeError) {
        return NextResponse.json({ error: 'Invalid recipe', message: err.message }, { status: 400 });
      }
      throw err;
    }
  },
  { schema: RecipeSchema, source: 'body' }
);
