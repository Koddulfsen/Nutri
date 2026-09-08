/**
 * Weekly Daily Totals API Endpoint
 *
 * GET /api/daily-totals/week?startDate=YYYY-MM-DD
 *
 * Purpose: Get daily totals for a week (7 days)
 * Pattern: Supabase auth + daily-totals-service for 7-day scroller
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 02 (Meal Logging & Tracking)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getDailyTotals } from '@/lib/services/daily-totals-service';
import { logger } from '@/lib/logger';

/**
 * GET query params schema
 */
const GetWeekTotalsSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
});

/**
 * Day names for UI display
 */
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * GET /api/daily-totals/week?startDate=YYYY-MM-DD
 * Get daily totals for 7 consecutive days (for week view scroller)
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
          service: 'week-totals-api',
          endpoint: 'GET /api/daily-totals/week',
        },
        'Unauthorized request - no session'
      );

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Step 2: Parse and validate query params
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');

    const validationResult = GetWeekTotalsSchema.safeParse({ startDate });

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'week-totals-api',
          endpoint: 'GET /api/daily-totals/week',
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
        service: 'week-totals-api',
        endpoint: 'GET /api/daily-totals/week',
        userId,
        startDate: validationResult.data.startDate,
      },
      'Fetching weekly totals'
    );

    // Step 3: Generate dates for 7 days
    const dates: string[] = [];
    const start = new Date(validationResult.data.startDate);

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Step 4: Fetch daily totals for each date (parallel)
    const totalsPromises = dates.map((date) => getDailyTotals(userId, date));
    const totals = await Promise.all(totalsPromises);

    // Step 5: Format response for week view
    const days = totals.map((dailyTotal, index) => {
      const date = new Date(dailyTotal.date);
      const dayName = DAY_NAMES[date.getDay()];

      // Calculate health score (simplified - Phase 3 will have proper RDA comparison)
      const healthScore = dailyTotal.compounds.length > 0 ? Math.round((dailyTotal.compounds.length / 280) * 100) : null;

      // Calculate calories
      const calories = dailyTotal.compounds.find((c) => c.compoundId === 'energy-calories')?.amount || null;

      // Determine zone (simplified - Phase 3 will use RDA thresholds)
      let zone: 'optimal' | 'warning' | 'deficient' | null = null;
      if (healthScore !== null) {
        if (healthScore >= 80) zone = 'optimal';
        else if (healthScore >= 50) zone = 'warning';
        else zone = 'deficient';
      }

      return {
        date: dailyTotal.date,
        dayName,
        healthScore,
        calories,
        zone,
      };
    });

    logger.info(
      {
        service: 'week-totals-api',
        endpoint: 'GET /api/daily-totals/week',
        userId,
        startDate: validationResult.data.startDate,
        daysCount: days.length,
      },
      'Weekly totals fetched successfully'
    );

    // Step 6: Return response
    return NextResponse.json({
      startDate: validationResult.data.startDate,
      days,
    });
  } catch (error) {
    logger.error(
      {
        service: 'week-totals-api',
        endpoint: 'GET /api/daily-totals/week',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to fetch weekly totals'
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
