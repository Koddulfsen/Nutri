/**
 * Meals API Endpoint
 *
 * POST /api/meals - Create meal log
 * GET /api/meals - Get meals for date
 *
 * Purpose: Meal logging and retrieval
 * Pattern: Supabase auth + Zod validation + meal-service
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 02 (Meal Logging & Tracking)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createMeal, getMealsForDate } from '@/lib/services/meal-service';
import { ensureUserProfile } from '@/lib/services/user-service';
import { logger } from '@/lib/logger';

/**
 * POST body schema
 */
const CreateMealSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  mealType: z.string().nullable().optional(),
  foods: z
    .array(
      z.object({
        foodId: z.string().uuid('Invalid food ID'),
        portionSize: z.number().positive('Portion size must be positive'),
        portionType: z.string().min(1, 'Portion type is required'),
        contextId: z.string().uuid().optional(),
        notes: z.string().optional(),
      })
    )
    .default([]), // Allow empty meals (just placeholders with names)
});

/**
 * GET query params schema
 */
const GetMealsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

/**
 * POST /api/meals
 * Create new meal log with food items
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      logger.warn(
        {
          service: 'meals-api',
          endpoint: 'POST /api/meals',
        },
        'Unauthorized request - no session'
      );

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Step 2: Parse and validate request body
    const body = await request.json();
    const validationResult = CreateMealSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'meals-api',
          endpoint: 'POST /api/meals',
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

    const { date, mealType, foods } = validationResult.data;

    // Step 3: Ensure user profile exists (auto-create if missing)
    await ensureUserProfile(userId, {
      fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
      avatarUrl: session.user.user_metadata?.avatar_url,
    });

    logger.info(
      {
        service: 'meals-api',
        endpoint: 'POST /api/meals',
        userId,
        date,
        mealType,
        foodCount: foods.length,
      },
      'Creating meal log'
    );

    // Step 4: Create meal
    const meal = await createMeal(userId, date, mealType || null, foods);

    logger.info(
      {
        service: 'meals-api',
        endpoint: 'POST /api/meals',
        userId,
        mealId: meal.mealId,
        date: meal.date,
      },
      'Meal created successfully'
    );

    // Step 4: Return response
    return NextResponse.json(
      {
        mealId: meal.mealId,
        date: meal.date,
        mealType: meal.mealType,
        foods: meal.foods,
        createdAt: meal.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error(
      {
        service: 'meals-api',
        endpoint: 'POST /api/meals',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to create meal'
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
 * GET /api/meals?date=YYYY-MM-DD
 * Get meals for specific date
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      logger.warn(
        {
          service: 'meals-api',
          endpoint: 'GET /api/meals',
        },
        'Unauthorized request - no session'
      );

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Step 2: Parse and validate query params
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const validationResult = GetMealsSchema.safeParse({ date });

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'meals-api',
          endpoint: 'GET /api/meals',
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

    logger.debug(
      {
        service: 'meals-api',
        endpoint: 'GET /api/meals',
        userId,
        date: validationResult.data.date,
      },
      'Fetching meals for date'
    );

    // Step 3: Fetch meals
    const meals = await getMealsForDate(userId, validationResult.data.date);

    logger.info(
      {
        service: 'meals-api',
        endpoint: 'GET /api/meals',
        userId,
        date: validationResult.data.date,
        mealCount: meals.length,
      },
      'Meals fetched successfully'
    );

    // Step 4: Return response
    return NextResponse.json({
      date: validationResult.data.date,
      meals: meals.map((meal) => ({
        id: meal.id,
        date: meal.date,
        mealType: meal.mealType,
        loggedAt: meal.loggedAt.toISOString(),
        items: meal.items,
      })),
    });
  } catch (error) {
    logger.error(
      {
        service: 'meals-api',
        endpoint: 'GET /api/meals',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to fetch meals'
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
