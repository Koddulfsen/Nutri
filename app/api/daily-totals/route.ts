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
import {
  getDailyValuesBatch,
  getDailyValuesBatchByDemographics,
  calculatePercentDV,
} from '@/lib/services/daily-value-service';
import { logger } from '@/lib/logger';

/**
 * Convert a nutrient amount between unit systems. Returns null when units aren't
 * comparable (e.g. mg vs IU, kcal vs mg). Handles common mass conversions only —
 * good enough for the alpha; energy/IU/kJ stay null.
 */
function convertToUnit(amount: number, from: string, to: string): number | null {
  if (from === to) return amount;
  const norm = (u: string) => u.replace('μ', 'µ').toLowerCase();
  const f = norm(from);
  const t = norm(to);
  if (f === t) return amount;
  const mass: Record<string, number> = { g: 1, mg: 0.001, µg: 0.000001, ug: 0.000001, mcg: 0.000001 };
  if (mass[f] != null && mass[t] != null) return (amount * mass[f]) / mass[t];
  return null;
}

/**
 * GET query params schema
 */
const GetDailyTotalsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  mealIds: z.string().optional(),
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

    // Step 5: Get daily values for all compounds
    const compoundIds = totals.compounds.map((c) => c.compoundId);
    const age = validationResult.data.age ? parseInt(validationResult.data.age, 10) : undefined;
    const sex = validationResult.data.sex;

    // dvValues: compoundId → { value, unit, source, upperLimit? }
    const dvValues = new Map<string, {
      value: number; unit: string; source: string | null;
      upperLimit?: number | null; upperLimitUnit?: string | null;
    }>();

    if (age !== undefined && sex !== undefined) {
      // New age-range lookup driven by picker demographics
      const lookup = await getDailyValuesBatchByDemographics({
        compoundIds, ageYears: age, sex,
      });
      lookup.forEach((row, id) => {
        if (row.target != null && row.targetUnit) {
          dvValues.set(id, {
            value: row.target,
            unit: row.targetUnit,
            source: 'average',
            upperLimit: row.upperLimit,
            upperLimitUnit: row.upperLimitUnit,
          });
        }
      });
    } else {
      const legacy = await getDailyValuesBatch(userId, compoundIds);
      legacy.forEach((v, id) => dvValues.set(id, { value: v.value, unit: v.unit, source: v.source }));
    }

    const healthScore = 0;

    // Step 6: Return response with DV data
    return NextResponse.json({
      date: totals.date,
      compounds: totals.compounds.map((c) => {
        const dv = dvValues.get(c.compoundId);

        let rdaPercent: number | null = null;
        let zone: 'deficient' | 'low' | 'optimal' | 'high' | 'excess' | 'unknown' = 'unknown';

        if (dv) {
          // Convert intake to DV unit if they differ (mg <-> µg, mg <-> g).
          const intakeInDvUnit = convertToUnit(c.amount, c.unit, dv.unit);
          if (intakeInDvUnit != null) {
            const percentResult = calculatePercentDV(intakeInDvUnit, dv.value);
            rdaPercent = percentResult.percent;
            zone = percentResult.status;
          }
        }

        return {
          compoundId: c.compoundId,
          name: c.name,
          amount: c.amount,
          unit: c.unit,
          confidence: c.confidence,
          zone,
          rdaPercent,
          dailyValue: dv ? {
            value: dv.value,
            unit: dv.unit,
            source: dv.source,
            upperLimit: dv.upperLimit ?? null,
            upperLimitUnit: dv.upperLimitUnit ?? null,
          } : null,
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
