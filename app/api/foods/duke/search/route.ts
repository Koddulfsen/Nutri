/**
 * Duke Phytochemical Database Search API Endpoint
 *
 * GET /api/foods/duke/search
 *
 * Purpose: Search Duke plants from staging table
 * Pattern: PostgreSQL search with trigram similarity
 * Features:
 *   - Query parameter: q (search query)
 *   - Pagination: page, limit (default 20, max 50)
 *   - Returns Duke plant results only
 *   - Used by Add Food modal Duke search input
 *
 * Generated: 2026-01-22
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * Query parameters schema validation
 */
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

/**
 * Duke search result (unified format)
 */
interface DukeSearchResult {
  apiSource: 'DUKE';
  apiId: string;
  name: string;
  description?: string;
  category?: string;
  nutrientCount?: number;
  relevanceScore?: number;
}

/**
 * Duke search response
 */
interface DukeSearchResponse {
  results: DukeSearchResult[];
  metadata: {
    query: string;
    durationMs: number;
    count: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

/**
 * GET /api/foods/duke/search
 * Search Duke staging table
 */
export const maxDuration = 60;

export async function GET(
  request: NextRequest
): Promise<NextResponse<DukeSearchResponse | { error: string; details?: unknown }>> {
  const startTime = Date.now();

  try {
    // Step 1: Parse and validate query parameters
    const { searchParams } = new URL(request.url);

    const paramsObject = {
      q: searchParams.get('q'),
      limit: searchParams.get('limit') || undefined,
      page: searchParams.get('page') || undefined,
    };

    const validationResult = SearchParamsSchema.safeParse(paramsObject);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'duke-search-api',
          errors: validationResult.error.errors,
        },
        'Invalid search parameters'
      );

      return NextResponse.json(
        {
          error: 'Invalid search parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const params = validationResult.data;
    const offset = (params.page - 1) * params.limit;

    logger.info(
      {
        service: 'duke-search-api',
        query: params.q,
        limit: params.limit,
        page: params.page,
      },
      'Executing Duke search'
    );

    // Step 2: Search Duke plants with compound count
    // Fetch more results for client-side re-ranking
    const FETCH_POOL_SIZE = 100;
    const results = await db.execute<{
      fnf_num: string;
      common_name: string;
      latin_name: string | null;
      family: string | null;
      compound_count: number;
    }>(sql`
      SELECT
        p.fnf_num,
        p.common_name,
        p.latin_name,
        p.family,
        COALESCE(cnt.compound_count, 0) as compound_count
      FROM source_duke_plants p
      LEFT JOIN (
        SELECT fnf_num, COUNT(DISTINCT chem_id) as compound_count
        FROM source_duke_farmacy
        GROUP BY fnf_num
      ) cnt ON cnt.fnf_num = p.fnf_num
      WHERE p.common_name ILIKE ${`%${params.q}%`}
         OR p.latin_name ILIKE ${`%${params.q}%`}
      ORDER BY p.common_name ASC
      LIMIT ${FETCH_POOL_SIZE}
    `);

    // Step 3: Apply token-based scoring algorithm with compound count boost
    // Algorithm: Text relevance (0-1400) + compound count boost (0-200)
    const DELIMITERS = /[,\s\-\(\)\[\]:;\/]+/;
    const queryTokens = params.q.toLowerCase().trim().split(/\s+/).filter(t => t.length > 1);

    // Plural normalization
    const normalize = (word: string): string => {
      if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
      if (word.endsWith('es') && word.length > 3) return word.slice(0, -2);
      if (word.endsWith('s') && word.length > 2) return word.slice(0, -1);
      return word;
    };

    // Compound count boost: logarithmic scaling, capped at 200 points
    // This rewards data-rich foods without overwhelming text relevance
    const getCompoundBoost = (count: number): number => {
      if (count <= 0) return 0;
      return Math.min(200, Math.log10(count + 1) * 100);
    };

    const normalizedQueryTokens = queryTokens.map(normalize);
    const rows = (results as any).rows ?? results;

    const scoredResults = rows.map((plant: any) => {
      const foodTokens = plant.common_name
        .toLowerCase()
        .split(DELIMITERS)
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 1);

      if (foodTokens.length === 0 || queryTokens.length === 0) {
        return { ...plant, relevanceScore: 0 };
      }

      const normalizedFoodTokens = foodTokens.map(normalize);
      const matchPositions: number[] = [];

      for (const nqt of normalizedQueryTokens) {
        const idx = normalizedFoodTokens.findIndex((nft: string) => nft === nqt);
        if (idx >= 0) matchPositions.push(idx);
      }

      if (matchPositions.length === 0) {
        return { ...plant, relevanceScore: 0 };
      }

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

      // Text relevance score (0-1400 range typically)
      const textScore = Math.round(matchRatio * (positionScore + bonus) * 1000);

      // Add compound count boost (0-200 range)
      const compoundCount = parseInt(plant.compound_count, 10) || 0;
      const compoundBoost = Math.round(getCompoundBoost(compoundCount));

      const finalScore = textScore + compoundBoost;
      return { ...plant, relevanceScore: finalScore, textScore, compoundBoost };
    })
    .filter((r: any) => r.relevanceScore > 0)
    .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

    // Step 4: Paginate and transform to unified format
    const startIndex = (params.page - 1) * params.limit;
    const paginatedResults = scoredResults.slice(startIndex, startIndex + params.limit);
    const hasMore = startIndex + params.limit < scoredResults.length;

    const dukeResults: DukeSearchResult[] = paginatedResults.map((plant: any) => ({
      apiSource: 'DUKE' as const,
      apiId: plant.fnf_num,
      name: plant.common_name,
      description: plant.latin_name || undefined,
      category: plant.family || undefined,
      nutrientCount: parseInt(plant.compound_count, 10),
      relevanceScore: plant.relevanceScore,
    }));

    const durationMs = Date.now() - startTime;

    logger.info(
      {
        service: 'duke-search-api',
        query: params.q,
        count: dukeResults.length,
        durationMs,
      },
      'Duke search completed'
    );

    // Step 5: Return results
    return NextResponse.json({
      results: dukeResults,
      metadata: {
        query: params.q,
        durationMs,
        count: dukeResults.length,
        totalInPool: scoredResults.length,
        page: params.page,
        limit: params.limit,
        hasMore,
      },
    });
  } catch (error) {
    logger.error(
      {
        service: 'duke-search-api',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Duke search error'
    );

    return NextResponse.json(
      {
        error: 'Duke search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
