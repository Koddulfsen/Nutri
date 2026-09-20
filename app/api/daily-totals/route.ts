/**
 * Daily Totals API Endpoint
 *
 * GET /api/daily-totals?date=YYYY-MM-DD
 *
 * Purpose: Get aggregated daily nutrient totals
 * Pattern: Supabase auth + daily-totals-service with caching
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 02 (Meal Logging & Tracking)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getDailyTotals } from '@/lib/services/daily-totals-service';
import { buildDailyTotalsPayload } from '@/lib/services/daily-totals-payload';
import { logger } from '@/lib/logger';

/**
 * GET query params schema
 */
const GetDailyTotalsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  mealIds: z.string().optional(),
  itemIds: z.string().optional(),
  // Optional demographic overrides — when both present, use the new age-range DV lookup
  age: z.string().regex(/^\d{1,3}$/).optional(),
  sex: z.enum(['MALE', 'FEMALE']).optional(),
});

/**
 * GET /api/daily-totals?date=YYYY-MM-DD
 * Get daily nutrient totals with confidence-weighted aggregation
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
          service: 'daily-totals-api',
          endpoint: 'GET /api/daily-totals',
        },
        'Unauthorized request - no session'
      );

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Step 2: Parse and validate query params
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const mealIdsParam = searchParams.get('mealIds');

    const ageParam = searchParams.get('age');
    const sexParam = searchParams.get('sex');
    const validationResult = GetDailyTotalsSchema.safeParse({
      date,
      mealIds: mealIdsParam ?? undefined,
      itemIds: searchParams.get('itemIds') ?? undefined,
      age: ageParam ?? undefined,
      sex: sexParam ?? undefined,
    });

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'daily-totals-api',
          endpoint: 'GET /api/daily-totals',
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

    // Parse mealIds if provided (comma-separated UUIDs)
    const mealIds = validationResult.data.mealIds
      ? validationResult.data.mealIds.split(',').map((id) => id.trim()).filter(Boolean)
      : undefined;

    const itemIds = validationResult.data.itemIds
      ? validationResult.data.itemIds.split(',').map((id) => id.trim()).filter(Boolean)
      : undefined;

    logger.debug(
      {
        service: 'daily-totals-api',
        endpoint: 'GET /api/daily-totals',
        userId,
        date: validationResult.data.date,
        mealIdsFilter: mealIds?.length || 'all',
      },
      'Fetching daily totals'
    );

    // Step 3: Get daily totals (cached or calculated, with optional meal filtering)
    const totals = await getDailyTotals(userId, validationResult.data.date, mealIds, itemIds);

    logger.info(
      {
        service: 'daily-totals-api',
        endpoint: 'GET /api/daily-totals',
        userId,
        date: validationResult.data.date,
        compoundCount: totals.compounds.length,
      },
      'Daily totals fetched successfully'
    );

    // Step 4: Attach daily values and % of target (shared with POST /api/meals/sync)
    const age = validationResult.data.age ? parseInt(validationResult.data.age, 10) : undefined;
    const sex = validationResult.data.sex;

    const payload = await buildDailyTotalsPayload({ userId, totals, age, sex });

    return NextResponse.json(payload);
  } catch (error) {
    logger.error(
      {
        service: 'daily-totals-api',
        endpoint: 'GET /api/daily-totals',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to fetch daily totals'
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
