/**
 * FooDB Search API Endpoint
 *
 * GET /api/foods/foodb/search
 *
 * Returns one result per FooDB parent food (foodb_food_id), with all available
 * variants (orig_food_name) nested under it. The add-food modal expands a parent
 * row to show its variants for multi-part composition.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

const SearchParamsSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(50)),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),
});

interface FooDBVariant {
  origFoodName: string;
  preparationType: string | null;
  compoundCount: number;
}

interface FooDBSearchResult {
  apiSource: 'FOODB';
  apiId: string; // foodb_food_id
  name: string; // parent food name (from source_foodb_foods); falls back to first variant
  description?: string;
  category?: string;
  nutrientCount?: number; // sum of compound counts across all variants
  variants: FooDBVariant[];
  relevanceScore?: number;
}

interface FooDBSearchResponse {
  results: FooDBSearchResult[];
  metadata: {
    query: string;
    durationMs: number;
    count: number;
    totalInPool: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export const maxDuration = 60;

export async function GET(
  request: NextRequest
): Promise<NextResponse<FooDBSearchResponse | { error: string; details?: unknown }>> {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const validationResult = SearchParamsSchema.safeParse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit') || undefined,
      page: searchParams.get('page') || undefined,
    });

    if (!validationResult.success) {
      logger.warn(
        { service: 'foodb-search-api', errors: validationResult.error.errors },
        'Invalid search parameters'
      );
      return NextResponse.json(
        { error: 'Invalid search parameters', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const params = validationResult.data;

    logger.info(
      { service: 'foodb-search-api', query: params.q, limit: params.limit, page: params.page },
      'Executing FooDB search'
    );

    // Match parents by parent name OR by any variant name. Then return ALL variants
    // for each matched parent so the user can compose any combination.
    const FETCH_POOL_SIZE = 100;
    const pattern = `%${params.q}%`;

    const results = await db.execute<{
      foodb_food_id: number;
      parent_name: string | null;
      food_group: string | null;
      variants: Array<{ origFoodName: string; preparationType: string | null; compoundCount: number }> | string;
      total_compound_count: string;
    }>(sql`
      WITH matching_parents AS (
        SELECT DISTINCT c.foodb_food_id
        FROM source_foodb_content c
        LEFT JOIN source_foodb_foods f ON f.foodb_id = c.foodb_food_id
        WHERE (c.orig_food_name ILIKE ${pattern} OR f.name ILIKE ${pattern})
          AND c.standard_content IS NOT NULL
        LIMIT ${FETCH_POOL_SIZE}
      ),
      variant_counts AS (
        SELECT
          c.foodb_food_id,
          c.orig_food_name,
          c.preparation_type,
          COUNT(*) as compound_count
        FROM source_foodb_content c
        WHERE c.foodb_food_id IN (SELECT foodb_food_id FROM matching_parents)
          AND c.standard_content IS NOT NULL
        GROUP BY c.foodb_food_id, c.orig_food_name, c.preparation_type
      )
      SELECT
        v.foodb_food_id,
        f.name as parent_name,
        f.food_group,
        jsonb_agg(
          jsonb_build_object(
            'origFoodName', v.orig_food_name,
            'preparationType', v.preparation_type,
            'compoundCount', v.compound_count
          )
          ORDER BY v.orig_food_name
        ) as variants,
        SUM(v.compound_count)::text as total_compound_count
      FROM variant_counts v
      LEFT JOIN source_foodb_foods f ON f.foodb_id = v.foodb_food_id
      GROUP BY v.foodb_food_id, f.name, f.food_group
    `);

    // Token-based scoring (parent name OR best variant name match).
    const DELIMITERS = /[,\s\-\(\)\[\]:;\/]+/;
    const queryTokens = params.q.toLowerCase().trim().split(/\s+/).filter((t) => t.length > 1);
    const normalize = (word: string): string => {
      if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
      if (word.endsWith('es') && word.length > 3) return word.slice(0, -2);
      if (word.endsWith('s') && word.length > 2) return word.slice(0, -1);
      return word;
    };
    const getCompoundBoost = (count: number): number => {
      if (count <= 0) return 0;
      return Math.min(200, Math.log10(count + 1) * 100);
    };

    const normalizedQueryTokens = queryTokens.map(normalize);

    const scoreName = (candidate: string): number => {
      const tokens = candidate
        .toLowerCase()
        .split(DELIMITERS)
        .map((t) => t.trim())
        .filter((t) => t.length > 1);
      if (tokens.length === 0 || queryTokens.length === 0) return 0;
      const normalizedTokens = tokens.map(normalize);
      const matchPositions: number[] = [];
      for (const nqt of normalizedQueryTokens) {
        const idx = normalizedTokens.findIndex((nt) => nt === nqt);
        if (idx >= 0) matchPositions.push(idx);
      }
      if (matchPositions.length === 0) return 0;
      const matchRatio = matchPositions.length / queryTokens.length;
      const avgPosition = matchPositions.reduce((a, b) => a + b, 0) / matchPositions.length;
      const positionScore = 1 / (1 + avgPosition);
      let bonus = 0;
      if (matchPositions.includes(0)) bonus += 0.25;
      if (matchPositions.length >= 2) {
        const sorted = [...matchPositions].sort((a, b) => a - b);
        let consecutive = true;
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] !== sorted[i - 1] + 1) consecutive = false;
        }
        if (consecutive) bonus += 0.15;
      }
      return Math.round(matchRatio * (positionScore + bonus) * 1000);
    };

    const rows = (results as any).rows ?? results;

    const scoredResults = rows
      .map((row: any) => {
        const variants: FooDBVariant[] = typeof row.variants === 'string' ? JSON.parse(row.variants) : row.variants;
        const parentName: string = row.parent_name || variants[0]?.origFoodName || '';

        // Best score across parent name and variant names.
        let bestScore = scoreName(parentName);
        for (const v of variants) {
          const s = scoreName(v.origFoodName);
          if (s > bestScore) bestScore = s;
        }

        const totalCount = parseInt(row.total_compound_count, 10) || 0;
        const compoundBoost = Math.round(getCompoundBoost(totalCount));
        const relevanceScore = bestScore + compoundBoost;

        return {
          foodbFoodId: row.foodb_food_id,
          parentName,
          foodGroup: row.food_group,
          variants,
          totalCompoundCount: totalCount,
          relevanceScore,
        };
      })
      .filter((r: any) => r.relevanceScore > 0)
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

    const startIndex = (params.page - 1) * params.limit;
    const paginatedResults = scoredResults.slice(startIndex, startIndex + params.limit);
    const hasMore = startIndex + params.limit < scoredResults.length;

    const foodbResults: FooDBSearchResult[] = paginatedResults.map((row: any) => ({
      apiSource: 'FOODB' as const,
      apiId: row.foodbFoodId.toString(),
      name: row.parentName,
      description: row.variants[0]?.preparationType || undefined,
      category: row.foodGroup || undefined,
      nutrientCount: row.totalCompoundCount,
      variants: row.variants,
      relevanceScore: row.relevanceScore,
    }));

    const durationMs = Date.now() - startTime;

    logger.info(
      { service: 'foodb-search-api', query: params.q, count: foodbResults.length, durationMs },
      'FooDB search completed'
    );

    return NextResponse.json({
      results: foodbResults,
      metadata: {
        query: params.q,
        durationMs,
        count: foodbResults.length,
        totalInPool: scoredResults.length,
        page: params.page,
        limit: params.limit,
        hasMore,
      },
    });
  } catch (error) {
    logger.error(
      {
        service: 'foodb-search-api',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'FooDB search error'
    );

    return NextResponse.json(
      {
        error: 'FooDB search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
