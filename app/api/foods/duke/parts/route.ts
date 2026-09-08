/**
 * GET /api/foods/duke/parts?fnfNum=<id>
 *
 * Returns plant parts for a Duke plant with mapped-compound counts.
 * Used by the add-food modal to expand parent plants for multi-part composition.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dukeStagingClient } from '@/lib/services/duke-client';
import { plantPartLabel } from '@/lib/services/duke-plant-parts';
import { logger } from '@/lib/logger';

const QuerySchema = z.object({
  fnfNum: z.string().min(1, 'fnfNum is required'),
});

interface PartsResponse {
  fnfNum: string;
  parts: Array<{ plantPart: string; label: string; compoundCount: number }>;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<PartsResponse | { error: string; details?: unknown }>> {
  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse({ fnfNum: searchParams.get('fnfNum') });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.errors },
      { status: 400 },
    );
  }

  try {
    const raw = await dukeStagingClient.getPlantPartsWithCounts(parsed.data.fnfNum);
    const parts = raw.map((p) => ({
      plantPart: p.plantPart,
      label: plantPartLabel(p.plantPart),
      compoundCount: p.compoundCount,
    }));
    return NextResponse.json({ fnfNum: parsed.data.fnfNum, parts });
  } catch (error) {
    logger.error(
      {
        service: 'duke-parts-api',
        fnfNum: parsed.data.fnfNum,
        error: error instanceof Error ? error.message : String(error),
      },
      'Duke parts fetch failed',
    );
    return NextResponse.json({ error: 'Failed to fetch plant parts' }, { status: 500 });
  }
}
