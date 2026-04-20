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
import { getDailyValuesBatch, calculatePercentDV } from '@/lib/services/daily-value-service';
import { logger } from '@/lib/logger';

/**
 * GET query params schema
 */
const GetDailyTotalsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  mealIds: z.string().optional(), // Comma-separated meal UUIDs for filtering
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
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      logger.warn(
        {
          service: 'daily-totals-api',
          endpoint: 'GET /api/daily-totals',
        },
        'Unauthorized request - no session'
      );

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Step 2: Parse and validate query params
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const mealIdsParam = searchParams.get('mealIds');

    const validationResult = GetDailyTotalsSchema.safeParse({ date, mealIds: mealIdsParam ?? undefined });

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
    const totals = await getDailyTotals(userId, validationResult.data.date, mealIds);

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

    // Step 4: Calculate basic metrics first (fast path)
    const calories = totals.compounds.find((c) => c.name === 'Energy')?.amount || 0;
    const macros = {
      carbs: totals.compounds.find((c) => c.name === 'Total Carbohydrate')?.amount || 0,
      protein: totals.compounds.find((c) => c.name === 'Protein')?.amount || 0,
      fat: totals.compounds.find((c) => c.name === 'Total Fat')?.amount || 0,
    };

    // Step 5: Get daily values for all compounds (optimized - single query + caching)
    const compoundIds = totals.compounds.map((c) => c.compoundId);
    const dailyValues = await getDailyValuesBatch(userId, compoundIds);
    const healthScore = 0;

    // Step 6: Return response with DV data
    return NextResponse.json({
      date: totals.date,
      compounds: totals.compounds.map((c) => {
        const dv = dailyValues.get(c.compoundId);

        let rdaPercent: number | null = null;
        let zone: 'deficient' | 'low' | 'optimal' | 'high' | 'excess' | 'unknown' = 'unknown';
        let dvSource: string | null = null;

        if (dv) {
          const percentResult = calculatePercentDV(c.amount, dv.value);
          rdaPercent = percentResult.percent;
          zone = percentResult.status;
          dvSource = dv.source;
        }

        return {
          compoundId: c.compoundId,
          name: c.name,
          amount: c.amount,
          unit: c.unit,
          confidence: c.confidence,
          zone,
          rdaPercent,
          dailyValue: dv ? { value: dv.value, unit: dv.unit, source: dvSource } : null,
          // Show progress bar for all compounds - UI handles active/inactive state based on dailyValue presence
          showProgressBar: true,
          displayPriority: 0,
        };
      }),
      calories,
      healthScore,
      macros,
      lastUpdated: totals.lastUpdated.toISOString(),
    });
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
