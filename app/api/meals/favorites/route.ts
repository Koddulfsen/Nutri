/**
 * Favorites API Endpoint
 *
 * POST /api/meals/favorites - Add food to favorites
 * GET /api/meals/favorites - List favorite foods
 * DELETE /api/meals/favorites?foodId=... - Remove favorite
 *
 * Purpose: User-favorited foods for quick access
 * Pattern: Supabase auth + Zod validation + Drizzle ORM
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 02 (Meal Logging & Tracking)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { favoriteFoods, foods } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * POST body schema
 */
const AddFavoriteSchema = z.object({
  foodId: z.string().uuid('Invalid food ID'),
});

/**
 * GET query params schema
 */
const GetFavoritesSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100)),
});

/**
 * DELETE query params schema
 */
const DeleteFavoriteSchema = z.object({
  foodId: z.string().uuid('Invalid food ID'),
});

/**
 * POST /api/meals/favorites
 * Add food to favorites
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.warn(
        {
          service: 'favorites-api',
          endpoint: 'POST /api/meals/favorites',
        },
        'Unauthorized request - no session'
      );

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Step 2: Parse and validate request body
    const body = await request.json();
    const validationResult = AddFavoriteSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'favorites-api',
          endpoint: 'POST /api/meals/favorites',
          userId,
          errors: validationResult.error.errors,
        },
        'Invalid request body'
      );

      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { foodId } = validationResult.data;

    logger.info(
      {
        service: 'favorites-api',
        endpoint: 'POST /api/meals/favorites',
        userId,
        foodId,
      },
      'Adding food to favorites'
    );

    // Step 3: Verify food exists
    const [food] = await db.select({ id: foods.id }).from(foods).where(eq(foods.id, foodId)).limit(1);

    if (!food) {
      logger.warn(
        {
          service: 'favorites-api',
          endpoint: 'POST /api/meals/favorites',
          userId,
          foodId,
        },
        'Food not found'
      );

      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    // Step 4: Insert favorite (ignore if already exists)
    try {
      await db.insert(favoriteFoods).values({
        userId,
        foodId,
      });

      logger.info(
        {
          service: 'favorites-api',
          endpoint: 'POST /api/meals/favorites',
          userId,
          foodId,
        },
        'Favorite added successfully'
      );

      return NextResponse.json(
        {
          message: 'Favorite added successfully',
          foodId,
        },
        { status: 201 }
      );
    } catch (error) {
      // Check for duplicate key error
      if (error instanceof Error && error.message.includes('duplicate')) {
        logger.debug(
          {
            service: 'favorites-api',
            endpoint: 'POST /api/meals/favorites',
            userId,
            foodId,
          },
          'Food already favorited'
        );

        return NextResponse.json(
          {
            message: 'Food already in favorites',
            foodId,
          },
          { status: 200 }
        );
      }

      throw error;
    }
  } catch (error) {
    logger.error(
      {
        service: 'favorites-api',
        endpoint: 'POST /api/meals/favorites',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to add favorite'
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

/**
 * GET /api/meals/favorites?page=1&limit=20
 * List user's favorite foods (paginated)
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.warn(
        {
          service: 'favorites-api',
          endpoint: 'GET /api/meals/favorites',
        },
        'Unauthorized request - no session'
      );

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Step 2: Parse and validate query params
    const { searchParams } = new URL(request.url);
    const paramsObject = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    };

    const validationResult = GetFavoritesSchema.safeParse(paramsObject);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'favorites-api',
          endpoint: 'GET /api/meals/favorites',
          userId,
          errors: validationResult.error.errors,
        },
        'Invalid query parameters'
      );

      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { page, limit } = validationResult.data;
    const offset = (page - 1) * limit;

    logger.debug(
      {
        service: 'favorites-api',
        endpoint: 'GET /api/meals/favorites',
        userId,
        page,
        limit,
      },
      'Fetching favorite foods'
    );

    // Step 3: Fetch favorites with food details (join)
    const favorites = await db
      .select({
        foodId: favoriteFoods.foodId,
        createdAt: favoriteFoods.createdAt,
        name: foods.name,
        description: foods.description,
        foodCategoryId: foods.foodCategoryId,
        defaultPortionType: foods.defaultPortionType,
        defaultPortionSize: foods.defaultPortionSize,
      })
      .from(favoriteFoods)
      .innerJoin(foods, eq(favoriteFoods.foodId, foods.id))
      .where(eq(favoriteFoods.userId, userId))
      .orderBy(desc(favoriteFoods.createdAt))
      .limit(limit)
      .offset(offset);

    logger.info(
      {
        service: 'favorites-api',
        endpoint: 'GET /api/meals/favorites',
        userId,
        page,
        limit,
        resultCount: favorites.length,
      },
      'Favorites fetched successfully'
    );

    // Step 4: Return response
    return NextResponse.json({
      favorites: favorites.map((f) => ({
        foodId: f.foodId,
        name: f.name,
        description: f.description,
        categoryId: f.foodCategoryId,
        defaultPortionType: f.defaultPortionType,
        defaultPortionSize: f.defaultPortionSize,
        favoritedAt: f.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total: favorites.length, // Simplified
      },
    });
  } catch (error) {
    logger.error(
      {
        service: 'favorites-api',
        endpoint: 'GET /api/meals/favorites',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to fetch favorites'
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

/**
 * DELETE /api/meals/favorites?foodId=...
 * Remove food from favorites
 */
export async function DELETE(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.warn(
        {
          service: 'favorites-api',
          endpoint: 'DELETE /api/meals/favorites',
        },
        'Unauthorized request - no session'
      );

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Step 2: Parse and validate query params
    const { searchParams } = new URL(request.url);
    const foodId = searchParams.get('foodId');

    const validationResult = DeleteFavoriteSchema.safeParse({ foodId });

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'favorites-api',
          endpoint: 'DELETE /api/meals/favorites',
          userId,
          errors: validationResult.error.errors,
        },
        'Invalid query parameters'
      );

      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    logger.info(
      {
        service: 'favorites-api',
        endpoint: 'DELETE /api/meals/favorites',
        userId,
        foodId: validationResult.data.foodId,
      },
      'Removing food from favorites'
    );

    // Step 3: Delete favorite (verify ownership)
    const result = await db
      .delete(favoriteFoods)
      .where(and(eq(favoriteFoods.userId, userId), eq(favoriteFoods.foodId, validationResult.data.foodId)))
      .returning();

    if (result.length === 0) {
      logger.warn(
        {
          service: 'favorites-api',
          endpoint: 'DELETE /api/meals/favorites',
          userId,
          foodId: validationResult.data.foodId,
        },
        'Favorite not found'
      );

      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    logger.info(
      {
        service: 'favorites-api',
        endpoint: 'DELETE /api/meals/favorites',
        userId,
        foodId: validationResult.data.foodId,
      },
      'Favorite removed successfully'
    );

    // Step 4: Return response
    return NextResponse.json({
      message: 'Favorite removed successfully',
      foodId: validationResult.data.foodId,
    });
  } catch (error) {
    logger.error(
      {
        service: 'favorites-api',
        endpoint: 'DELETE /api/meals/favorites',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to remove favorite'
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
