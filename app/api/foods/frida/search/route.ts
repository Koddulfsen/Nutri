/**
 * Danish FRIDA Food Composition Database Search API Endpoint
 *
 * GET /api/foods/frida/search
 *
 * Purpose: Search FRIDA foods from staging table
 * Pattern: PostgreSQL search with ILIKE matching
 * Features:
 *   - Query parameter: q (search query)
 *   - Pagination: page, limit (default 20, max 50)
 *   - Returns FRIDA food results with nutrient counts
 *   - Token-based scoring with nutrient count boost
 *   - Used by Add Food modal Danish FRIDA search input
 *
 * Data source: source_frida_foods table (1,370 Danish foods)
 * Generated: 2026-02-07
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
 * FRIDA search result (unified format)
 */
interface FridaSearchResult {
  apiSource: 'FRIDA';
  apiId: string;
  name: string;
  description?: string;
  category?: string;
  nutrientCount?: number;
  relevanceScore?: number;
}

/**
 * FRIDA search response
 */
interface FridaSearchResponse {
  results: FridaSearchResult[];
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
 * GET /api/foods/frida/search
 * Search FRIDA staging table
 */
export const maxDuration = 60;

export async function GET(
  request: NextRequest
): Promise<NextResponse<FridaSearchResponse | { error: string; details?: unknown }>> {
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
          service: 'frida-search-api',
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

    logger.info(
      {
        service: 'frida-search-api',
        query: params.q,
        limit: params.limit,
        page: params.page,
      },
      'Executing FRIDA search'
    );

    // Step 2: Search FRIDA foods with nutrient count
    const FETCH_POOL_SIZE = 100;
    const results = await db.execute<{
      food_id: number;
      name: string;
      name_dk: string | null;
      nutrient_count: number;
    }>(sql`
      SELECT
        f.food_id,
        f.name,
        f.name_dk,
        COALESCE(cnt.nutrient_count, 0) as nutrient_count
      FROM source_frida_foods f
      LEFT JOIN (
        SELECT food_id, COUNT(*) as nutrient_count
        FROM source_frida_content
        WHERE value IS NOT NULL AND value > 0
        GROUP BY food_id
      ) cnt ON cnt.food_id = f.food_id
      WHERE f.name ILIKE ${`%${params.q}%`}
      ORDER BY f.name ASC
      LIMIT ${FETCH_POOL_SIZE}
    `);

    // Step 3: Apply token-based scoring algorithm with nutrient count boost
    const DELIMITERS = /[,\s\-\(\)\[\]:;\/]+/;
    const queryTokens = params.q.toLowerCase().trim().split(/\s+/).filter(t => t.length > 1);

    // Plural normalization
    const normalize = (word: string): string => {
      if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
      if (word.endsWith('es') && word.length > 3) return word.slice(0, -2);
      if (word.endsWith('s') && word.length > 2) return word.slice(0, -1);
      return word;
    };

    // Nutrient count boost: logarithmic scaling, capped at 200 points
    const getNutrientBoost = (count: number): number => {
      if (count <= 0) return 0;
      return Math.min(200, Math.log10(count + 1) * 100);
    };

    const normalizedQueryTokens = queryTokens.map(normalize);
    const rows = (results as any).rows ?? results;

    const scoredResults = rows.map((food: any) => {
      const foodTokens = food.name
        .toLowerCase()
        .split(DELIMITERS)
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 1);

      if (foodTokens.length === 0 || queryTokens.length === 0) {
        return { ...food, relevanceScore: 0 };
      }

      const normalizedFoodTokens = foodTokens.map(normalize);
      const matchPositions: number[] = [];

      for (const nqt of normalizedQueryTokens) {
        const idx = normalizedFoodTokens.findIndex((nft: string) => nft === nqt);
        if (idx >= 0) matchPositions.push(idx);
      }

      if (matchPositions.length === 0) {
        // Fallback: check for partial matches
        let hasPartialMatch = false;
        for (const nqt of normalizedQueryTokens) {
          for (const nft of normalizedFoodTokens) {
            if (nft.includes(nqt) || nqt.includes(nft)) {
              hasPartialMatch = true;
              matchPositions.push(foodTokens.indexOf(nft));
              break;
            }
          }
        }
        if (!hasPartialMatch) {
          return { ...food, relevanceScore: 50 }; // Minimum score for ILIKE matches
        }
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

      // Add nutrient count boost (0-200 range)
      const nutrientCount = parseInt(food.nutrient_count, 10) || 0;
      const nutrientBoost = Math.round(getNutrientBoost(nutrientCount));

      const finalScore = textScore + nutrientBoost;
      return { ...food, relevanceScore: finalScore, textScore, nutrientBoost };
    })
    .filter((r: any) => r.relevanceScore > 0)
    .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

    // Step 4: Paginate and transform to unified format
    const startIndex = (params.page - 1) * params.limit;
    const paginatedResults = scoredResults.slice(startIndex, startIndex + params.limit);
    const hasMore = startIndex + params.limit < scoredResults.length;

    const fridaResults: FridaSearchResult[] = paginatedResults.map((food: any) => ({
      apiSource: 'FRIDA' as const,
      apiId: String(food.food_id),
      name: food.name,
      description: food.name_dk || undefined,
      nutrientCount: parseInt(food.nutrient_count, 10),
      relevanceScore: food.relevanceScore,
    }));

    const durationMs = Date.now() - startTime;

    logger.info(
      {
        service: 'frida-search-api',
        query: params.q,
        count: fridaResults.length,
        durationMs,
      },
      'FRIDA search completed'
    );

    // Step 5: Return results
    return NextResponse.json({
      results: fridaResults,
      metadata: {
        query: params.q,
        durationMs,
        count: fridaResults.length,
        totalInPool: scoredResults.length,
        page: params.page,
        limit: params.limit,
        hasMore,
      },
    });
  } catch (error) {
    logger.error(
      {
        service: 'frida-search-api',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'FRIDA search error'
    );

    return NextResponse.json(
      {
        error: 'FRIDA search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
