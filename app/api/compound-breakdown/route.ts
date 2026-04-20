/**
 * Compound Breakdown API
 *
 * GET /api/compound-breakdown?compoundId={id}&mealIds={comma-separated}
 *
 * Returns detailed breakdown of a compound by food and source.
 * Used for progress bar tooltips in the analysis view.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompoundBreakdown } from '@/lib/services/compound-breakdown-service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const querySchema = z.object({
  compoundId: z.string().uuid('Invalid compound ID'),
  mealIds: z.string().min(1, 'At least one meal ID required'),
});

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query params
    const searchParams = request.nextUrl.searchParams;
    const compoundId = searchParams.get('compoundId');
    const mealIdsParam = searchParams.get('mealIds');

    const validated = querySchema.safeParse({
      compoundId,
      mealIds: mealIdsParam,
    });

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    // Parse meal IDs
    const mealIds = validated.data.mealIds
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (mealIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one meal ID required' },
        { status: 400 }
      );
    }

    // Get compound breakdown
    const breakdown = await getCompoundBreakdown(
      user.id,
      validated.data.compoundId,
      mealIds
    );

    if (!breakdown) {
      return NextResponse.json(
        { error: 'Compound not found in selected meals' },
        { status: 404 }
      );
    }

    const durationMs = Date.now() - startTime;

    logger.info(
      {
        api: 'compound-breakdown',
        userId: user.id,
        compoundId: validated.data.compoundId,
        mealCount: mealIds.length,
        foodCount: breakdown.foods.length,
        durationMs,
      },
      'Compound breakdown request completed'
    );

    return NextResponse.json({
      success: true,
      data: breakdown,
      meta: {
        durationMs,
      },
    });
  } catch (error) {
    logger.error(
      {
        api: 'compound-breakdown',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Compound breakdown request failed'
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
