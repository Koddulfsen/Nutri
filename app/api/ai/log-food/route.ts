import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  chatWithTools,
  isAnthropicConfigured,
  type ChatMessage,
  type ChatTool,
} from '@/lib/ai/anthropic-client';
import { getFoodLogChatSystemPrompt } from '@/lib/ai/prompts';
import { searchService } from '@/lib/search/search-service';
import { createMeal } from '@/lib/services/meal-service';
import { ensureUserProfile } from '@/lib/services/user-service';
import { logger } from '@/lib/logger';
import { db } from '@/db';
import { foods, foodComponents, foodApprovals } from '@/db/schema';

const RequestSchema = z.object({
  message: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .default([]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;

  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { message, history, date } = parsed.data;

  if (!isAnthropicConfigured()) {
    return NextResponse.json(
      { response: "I'm not available right now — try the search bar instead.", toolCalls: [] }
    );
  }

  await ensureUserProfile(userId, {
    fullName: user.user_metadata?.full_name || user.user_metadata?.name,
    avatarUrl: user.user_metadata?.avatar_url,
  });

  const tools: ChatTool[] = [
    {
      name: 'search_foods',
      description:
        'Search the Nutri food database for a food. Pass a single root word as the query (e.g., "egg", "rice"). Returns up to 8 candidates with id, name, brand, and category. Only foods with an "id" field can be logged.',
      input_schema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Single root word to search (e.g., "egg", "rice", "chicken").',
          },
        },
        required: ['query'],
      },
      handler: async (input) => {
        const query = String(input.query ?? '').trim();
        if (!query) return JSON.stringify({ error: 'query required' });
        const res = await searchService.searchFoods({
          query,
          page: 1,
          limit: 8,
          sortBy: 'relevance',
          sortOrder: 'desc',
          userId, // include user's private foods (their personal recipes)
        });
        const trimmed = res.results.map((r) => ({
          id: r.id ?? null,
          name: r.name,
          description: r.description,
          category: r.category,
          brand: r.brand,
          source: r.dataSource,
          loggable: !!r.id,
          compoundCount: r.compoundCount,
        }));
        return JSON.stringify({ results: trimmed, total: res.pagination.total });
      },
    },
    {
      name: 'create_composite',
      description:
        'Create a new composite food (a recipe of components) in the database. Use this for: (1) BRANDED products the user describes that aren\'t in the DB yet — set visibility "public" so the food enters the review queue and becomes globally available once approved; (2) PERSONAL recipes the user names ("my smoothie", "my chili", "Mom\'s lasagna") — set visibility "private" so it stays under their account as a reusable recipe. DO NOT use this for one-off meals like a quick sandwich the user just describes — for those, log each component separately via log_meal. Always call search_foods first to confirm the food doesn\'t already exist. Components must reference real foods returned by search_foods (with loggable: true). Returns the new food_id, which you can then use with log_meal.',
      input_schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description:
              'Display name. For branded: "Clif Bar Chocolate Chip Cookie Dough". For personal: "My Morning Smoothie".',
          },
          visibility: {
            type: 'string',
            enum: ['public', 'private'],
            description:
              '"public" = branded product, enters Jens\'s review queue, eventually globally searchable. "private" = personal recipe, only this user can see and reuse it.',
          },
          components: {
            type: 'array',
            description:
              'Recipe breakdown. Each component is an existing food (from search_foods) with its mass in grams. Order matters for display.',
            items: {
              type: 'object',
              properties: {
                food_id: { type: 'string', description: 'UUID of an existing food (with loggable: true).' },
                grams: { type: 'number', description: 'Mass of this component in grams.' },
                notes: { type: 'string', description: 'Optional ("estimated", "from label", etc.).' },
              },
              required: ['food_id', 'grams'],
            },
            minItems: 1,
          },
          brand: {
            type: 'string',
            description: 'Manufacturer brand name (only for visibility=public branded products).',
          },
          description: {
            type: 'string',
            description: 'Optional free-form description.',
          },
        },
        required: ['name', 'visibility', 'components'],
      },
      handler: async (input) => {
        const name = String(input.name ?? '').trim();
        const visibility = String(input.visibility ?? '').trim();
        const components = Array.isArray(input.components) ? (input.components as Array<Record<string, unknown>>) : [];
        const brand = input.brand ? String(input.brand).trim() : undefined;
        const description = input.description ? String(input.description).trim() : undefined;

        if (!name) return JSON.stringify({ error: 'name required.' });
        if (visibility !== 'public' && visibility !== 'private') {
          return JSON.stringify({ error: 'visibility must be "public" or "private".' });
        }
        if (components.length === 0) {
          return JSON.stringify({ error: 'at least one component required.' });
        }

        const cleaned: Array<{ food_id: string; grams: number; notes?: string }> = [];
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        for (let i = 0; i < components.length; i++) {
          const c = components[i];
          const fid = String(c.food_id ?? '');
          const grams = Number(c.grams);
          if (!uuidRe.test(fid)) {
            return JSON.stringify({ error: `component ${i}: food_id must be a UUID from search_foods.` });
          }
          if (!Number.isFinite(grams) || grams <= 0) {
            return JSON.stringify({ error: `component ${i}: grams must be positive.` });
          }
          cleaned.push({ food_id: fid, grams, notes: c.notes ? String(c.notes) : undefined });
        }

        try {
          const result = await db.transaction(async (tx) => {
            // Always insert as 'private' initially. Branded composites get a PENDING
            // food_approvals row; admin review flips visibility to 'public' on approval.
            // Personal recipes stay private with no approval row.
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
              .returning({ id: foods.id, name: foods.name, visibility: foods.visibility });

            await tx.insert(foodComponents).values(
              cleaned.map((c, idx) => ({
                compositeFoodId: newFood.id,
                componentFoodId: c.food_id,
                grams: c.grams.toString(),
                position: idx,
                notes: c.notes ?? null,
              }))
            );

            // Branded intent → submit for global review.
            // Personal intent → no approval row; food remains private to creator.
            if (visibility === 'public') {
              await tx.insert(foodApprovals).values({
                foodId: newFood.id,
                status: 'PENDING',
                requestedBy: userId,
              });
            }

            return newFood;
          });

          logger.info(
            {
              service: 'log-food-chat',
              event: 'composite_created',
              userId,
              foodId: result.id,
              visibility,
              componentCount: cleaned.length,
              brand: brand ?? null,
            },
            'Composite food created via chat'
          );

          return JSON.stringify({
            ok: true,
            food_id: result.id,
            name: result.name,
            visibility: result.visibility,
            components_created: cleaned.length,
            review_queued: visibility === 'public',
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return JSON.stringify({ error: `create_composite failed: ${msg}` });
        }
      },
    },
    {
      name: 'log_meal',
      description:
        'Log a food entry to the user\'s daily log for the current date. Only call this AFTER the user has confirmed what to log. food_id must be a UUID returned by search_foods (with loggable: true).',
      input_schema: {
        type: 'object',
        properties: {
          food_id: { type: 'string', description: 'UUID of the food (from search_foods results).' },
          portion_size: { type: 'number', description: 'Quantity (e.g., 2 for two eggs, 100 for 100g).' },
          portion_type: {
            type: 'string',
            description:
              'Unit string. Common: "g", "ml", "cup", "tbsp", "tsp", "oz", "piece", "slice", "serving".',
          },
          meal_type: {
            type: 'string',
            description: 'Optional: "breakfast", "lunch", "dinner", "snack". Omit if unknown.',
          },
          notes: { type: 'string', description: 'Optional free-form notes.' },
        },
        required: ['food_id', 'portion_size', 'portion_type'],
      },
      handler: async (input) => {
        const foodId = String(input.food_id ?? '');
        const portionSize = Number(input.portion_size);
        const portionType = String(input.portion_type ?? '').trim();
        const mealType = input.meal_type ? String(input.meal_type) : null;
        const notes = input.notes ? String(input.notes) : undefined;

        if (!foodId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          return JSON.stringify({ error: 'food_id must be a UUID from search_foods.' });
        }
        if (!Number.isFinite(portionSize) || portionSize <= 0) {
          return JSON.stringify({ error: 'portion_size must be a positive number.' });
        }
        if (!portionType) {
          return JSON.stringify({ error: 'portion_type is required.' });
        }

        const meal = await createMeal(userId, date, mealType, [
          { foodId, portionSize, portionType, notes },
        ]);
        return JSON.stringify({
          ok: true,
          mealId: meal.mealId,
          date: meal.date,
          mealType: meal.mealType,
          logged: { foodId, portionSize, portionType },
        });
      },
    },
  ];

  const messages: ChatMessage[] = [
    ...history,
    { role: 'user', content: `[Logging date: ${date}]\n${message}` },
  ];

  try {
    const { response, toolCalls } = await chatWithTools(
      getFoodLogChatSystemPrompt(),
      messages,
      tools,
      { maxTokens: 1024, maxIterations: 6 }
    );

    const loggedAny = toolCalls.some(
      (c) => c.name === 'log_meal' && !c.output.includes('"error"')
    );

    return NextResponse.json({
      response,
      toolCalls: toolCalls.map((c) => ({ name: c.name, input: c.input })),
      loggedAny,
    });
  } catch (err) {
    logger.error(
      {
        service: 'log-food-chat',
        userId,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      },
      'log-food chat failed'
    );
    return NextResponse.json(
      { error: 'Chat failed', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
