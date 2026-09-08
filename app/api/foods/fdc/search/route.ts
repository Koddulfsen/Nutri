/**
 * FDC Search API Endpoint
 *
 * GET /api/foods/fdc/search
 *
 * Purpose: Search USDA FoodData Central (FDC) API exclusively
 * Pattern: Direct FDC API search with pagination support
 * Features:
 *   - Query parameter: q (search query)
 *   - Pagination: page, limit (default 20, max 50)
 *   - Returns FDC results only (no DB, no CNF)
 *   - Used by Add Food modal USDA search input
 *
 * Generated: 2025-11-20
 * Architecture: Multi-Source Food Database System - Source Separation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { usdaClient } from '@/lib/services/usda-client';
import { logger } from '@/lib/logger';
import { requireUser } from '@/lib/auth/api-guard';

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
    .pipe(z.number().int().positive().max(50)), // Max 50 results
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),
});

/**
 * FDC search result (unified format)
 */
interface FDCSearchResult {
  apiSource: 'FDC';
  apiId: string | number;
  name: string;
  description?: string;
  relevanceScore?: number;
}

/**
 * FDC search response
 */
interface FDCSearchResponse {
  results: FDCSearchResult[];
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
 * GET /api/foods/fdc/search
 * Search FDC API exclusively
 */
export const maxDuration = 60;

export async function GET(request: NextRequest): Promise<NextResponse<FDCSearchResponse | { error: string; details?: any }>> {
  // Proxies to the external USDA FDC API. Requires a session so anonymous
  // callers cannot burn our upstream rate limit.
  const denied = await requireUser();
  if (denied) return denied;


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
          service: 'fdc-search-api',
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
        service: 'fdc-search-api',
        query: params.q,
        limit: params.limit,
        page: params.page,
      },
      'Executing FDC API search'
    );

    // Step 2: Search FDC API
    // Fetch MORE results than requested so we can re-rank a larger pool
    // Then return only the top N after our scoring algorithm
    const FETCH_POOL_SIZE = 150; // Fetch 150 results to re-rank
    const fdcRawResponse = await usdaClient.searchFoods(params.q, FETCH_POOL_SIZE, 1);

    // Step 3: Transform and RE-RANK results using token-based scoring
    // Algorithm: Exponential + Average + Combined bonuses
    // - Tokenize by common delimiters (word boundary matching)
    // - Score by: matchRatio × (positionScore + bonuses)
    // - Exponential decay on average token position
    // - Bonuses for first-token match and consecutive tokens
    const DELIMITERS = /[,\s\-\(\):;\/]+/;
    const queryTokens = params.q.toLowerCase().trim().split(/\s+/).filter(t => t.length > 1);

    // Simple plural normalization (handles most English food words)
    const normalize = (word: string): string => {
      if (word.endsWith('ies')) return word.slice(0, -3) + 'y'; // berries → berry
      if (word.endsWith('es') && word.length > 3) return word.slice(0, -2); // tomatoes → tomato
      if (word.endsWith('s') && word.length > 2) return word.slice(0, -1); // eggs → egg
      return word;
    };

    // Normalize query tokens for plural matching
    const normalizedQueryTokens = queryTokens.map(normalize);

    const fdcResults: FDCSearchResult[] = (fdcRawResponse.foods || [])
      .map((food) => {
        // Tokenize food description
        const foodTokens = food.description
          .toLowerCase()
          .split(DELIMITERS)
          .map(t => t.trim())
          .filter(t => t.length > 1);

        if (foodTokens.length === 0 || queryTokens.length === 0) {
          return {
            apiSource: 'FDC' as const,
            apiId: food.fdcId,
            name: food.description,
            description: food.brandOwner ? `Brand: ${food.brandOwner}` : undefined,
            relevanceScore: 0,
          };
        }

        // Normalize food tokens for plural matching
        const normalizedFoodTokens = foodTokens.map(normalize);

        // Find exact token matches (word boundary matching with plural normalization)
        const matchPositions: number[] = [];
        for (const nqt of normalizedQueryTokens) {
          const idx = normalizedFoodTokens.findIndex(nft => nft === nqt);
          if (idx >= 0) matchPositions.push(idx);
        }

        // No matches = no score
        if (matchPositions.length === 0) {
          return {
            apiSource: 'FDC' as const,
            apiId: food.fdcId,
            name: food.description,
            description: food.brandOwner ? `Brand: ${food.brandOwner}` : undefined,
            relevanceScore: 0,
          };
        }

        // Match ratio: what % of query tokens were found
        const matchRatio = matchPositions.length / queryTokens.length;

        // Position score: exponential decay on average position
        const avgPosition = matchPositions.reduce((a, b) => a + b, 0) / matchPositions.length;
        const positionScore = 1 / (1 + avgPosition);

        // Bonuses
        let bonus = 0;

        // First token bonus: query matches the primary food
        if (matchPositions.includes(0)) {
          bonus += 0.25;
        }

        // Consecutive tokens bonus: query tokens appear consecutively
        if (matchPositions.length >= 2) {
          const sorted = [...matchPositions].sort((a, b) => a - b);
          let consecutive = true;
          for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] !== sorted[i - 1] + 1) {
              consecutive = false;
              break;
            }
          }
          if (consecutive) bonus += 0.15;
        }

        // Final score
        const score = Math.round(matchRatio * (positionScore + bonus) * 1000);

        return {
          apiSource: 'FDC' as const,
          apiId: food.fdcId,
          name: food.description,
          description: food.brandOwner ? `Brand: ${food.brandOwner}` : undefined,
          relevanceScore: score,
        };
      })
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    const durationMs = Date.now() - startTime;

    logger.info(
      {
        service: 'fdc-search-api',
        query: params.q,
        count: fdcResults.length,
        durationMs,
      },
      'FDC API search completed'
    );

    // Step 4: Paginate and return results
    // We fetched a large pool and re-ranked, now slice to requested page/limit
    const startIndex = (params.page - 1) * params.limit;
    const paginatedResults = fdcResults.slice(startIndex, startIndex + params.limit);
    const hasMore = startIndex + params.limit < fdcResults.length;

    return NextResponse.json({
      results: paginatedResults,
      metadata: {
        query: params.q,
        durationMs,
        count: paginatedResults.length,
        totalInPool: fdcResults.length,
        page: params.page,
        limit: params.limit,
        hasMore,
      },
    });
  } catch (error) {
    logger.error(
      {
        service: 'fdc-search-api',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'FDC API search error'
    );

    return NextResponse.json(
      {
        error: 'FDC search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
