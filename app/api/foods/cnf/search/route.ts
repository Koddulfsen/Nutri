/**
 * CNF Search API Endpoint
 *
 * GET /api/foods/cnf/search
 *
 * Purpose: Search Canadian Nutrient File (CNF) API exclusively
 * Pattern: Direct CNF API search with pagination support
 * Features:
 *   - Query parameter: q (search query)
 *   - Pagination: page, limit (default 20, max 50)
 *   - Returns CNF results only (no DB, no USDA)
 *   - Used by Add Food modal CNF search input
 *
 * Generated: 2025-11-20
 * Architecture: Multi-Source Food Database System - Source Separation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cnfClient } from '@/lib/services/cnf-client';
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
 * CNF search result (unified format)
 */
interface CNFSearchResult {
  apiSource: 'CNF';
  apiId: string | number;
  name: string;
  relevanceScore?: number;
}

/**
 * CNF search response
 */
interface CNFSearchResponse {
  results: CNFSearchResult[];
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
 * GET /api/foods/cnf/search
 * Search CNF API exclusively
 */
export const maxDuration = 60;

export async function GET(request: NextRequest): Promise<NextResponse<CNFSearchResponse | { error: string; details?: any }>> {
  // Proxies to the external Health Canada API. Requires a session so anonymous
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
          service: 'cnf-search-api',
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
        service: 'cnf-search-api',
        query: params.q,
        limit: params.limit,
        page: params.page,
      },
      'Executing CNF API search'
    );

    // Step 2: Search CNF API
    const cnfRawResults = await cnfClient.searchFoods(params.q, params.limit);

    // Step 3: Transform results to unified format
    const cnfResults: CNFSearchResult[] = cnfRawResults.map((food) => ({
      apiSource: 'CNF' as const,
      apiId: food.foodCode,
      name: food.name,
      relevanceScore: food.relevanceScore,
    }));

    const durationMs = Date.now() - startTime;

    logger.info(
      {
        service: 'cnf-search-api',
        query: params.q,
        count: cnfResults.length,
        durationMs,
      },
      'CNF API search completed'
    );

    // Step 4: Return results
    return NextResponse.json({
      results: cnfResults,
      metadata: {
        query: params.q,
        durationMs,
        count: cnfResults.length,
        page: params.page,
        limit: params.limit,
        hasMore: cnfResults.length === params.limit, // If we got exactly limit, there might be more
      },
    });
  } catch (error) {
    logger.error(
      {
        service: 'cnf-search-api',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'CNF API search error'
    );

    return NextResponse.json(
      {
        error: 'CNF search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
