/**
 * External API Search Endpoint
 *
 * GET /api/foods/external-search
 *
 * Purpose: Search external APIs (CNF, USDA) for Add Food modal
 * Pattern: Parallel API searches with structured results
 * Features:
 *   - Query parameter: q (search query)
 *   - Searches CNF + USDA in parallel
 *   - Returns structured results grouped by API
 *   - Used by "Add Food" modal for source selection
 *
 * Generated: 2025-11-18
 * Architecture: Multi-Source Food Database System
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cnfClient } from '@/lib/services/cnf-client';
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
    .pipe(z.number().int().positive().max(50)), // Max 50 per API
});

/**
 * External search result (unified format)
 */
interface ExternalSearchResult {
  apiSource: 'CNF' | 'FDC';
  apiId: string | number; // API's food ID
  name: string;
  description?: string;
  relevanceScore?: number;
}

/**
 * External search response
 */
interface ExternalSearchResponse {
  cnf: ExternalSearchResult[];
  fdc: ExternalSearchResult[];
  metadata: {
    query: string;
    durationMs: number;
    cnfCount: number;
    fdcCount: number;
    errors?: string[];
  };
}

/**
 * GET /api/foods/external-search
 * Search external APIs for Add Food modal
 */
export const maxDuration = 60; // Allow up to 60 seconds for API calls

export async function GET(request: NextRequest): Promise<NextResponse<ExternalSearchResponse | { error: string; details?: any }>> {
  // Fans out to external food-database APIs. Requires a session so anonymous
  // callers cannot burn upstream rate limits.
  const denied = await requireUser();
  if (denied) return denied;


  const startTime = Date.now();

  try {
    // Step 1: Parse and validate query parameters
    const { searchParams } = new URL(request.url);

    const paramsObject = {
      q: searchParams.get('q'),
      limit: searchParams.get('limit') || undefined,
    };

    const validationResult = SearchParamsSchema.safeParse(paramsObject);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'external-search-api',
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
        service: 'external-search-api',
        query: params.q,
        limit: params.limit,
      },
      'Executing external API search'
    );

    // Step 2: Search CNF and USDA in parallel
    const errors: string[] = [];

    const [cnfResults, usdaResults] = await Promise.allSettled([
      cnfClient.searchFoods(params.q, params.limit),
      usdaClient.searchFoods(params.q, params.limit, 1),
    ]);

    // Step 3: Process CNF results
    let cnfSearchResults: ExternalSearchResult[] = [];

    if (cnfResults.status === 'fulfilled') {
      cnfSearchResults = cnfResults.value.map((food) => ({
        apiSource: 'CNF' as const,
        apiId: food.foodCode,
        name: food.name,
        description: undefined,
        relevanceScore: food.relevanceScore,
      }));

      logger.debug(
        {
          service: 'external-search-api',
          api: 'CNF',
          count: cnfSearchResults.length,
        },
        'CNF search completed'
      );
    } else {
      logger.error(
        {
          service: 'external-search-api',
          api: 'CNF',
          error: cnfResults.reason,
        },
        'CNF search failed'
      );
      errors.push(`CNF: ${cnfResults.reason}`);
    }

    // Step 4: Process USDA results
    let fdcSearchResults: ExternalSearchResult[] = [];

    if (usdaResults.status === 'fulfilled') {
      fdcSearchResults = (usdaResults.value.foods || []).map((food) => ({
        apiSource: 'FDC' as const,
        apiId: food.fdcId,
        name: food.description,
        description: food.brandOwner ? `Brand: ${food.brandOwner}` : undefined,
        relevanceScore: food.score,
      }));

      logger.debug(
        {
          service: 'external-search-api',
          api: 'USDA',
          count: fdcSearchResults.length,
        },
        'USDA search completed'
      );
    } else {
      logger.error(
        {
          service: 'external-search-api',
          api: 'USDA',
          error: usdaResults.reason,
        },
        'USDA search failed'
      );
      errors.push(`USDA: ${usdaResults.reason}`);
    }

    const durationMs = Date.now() - startTime;

    logger.info(
      {
        service: 'external-search-api',
        query: params.q,
        cnfCount: cnfSearchResults.length,
        fdcCount: fdcSearchResults.length,
        durationMs,
      },
      'External API search completed'
    );

    // Step 5: Return results
    return NextResponse.json({
      cnf: cnfSearchResults,
      fdc: fdcSearchResults,
      metadata: {
        query: params.q,
        durationMs,
        cnfCount: cnfSearchResults.length,
        fdcCount: fdcSearchResults.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    logger.error(
      {
        service: 'external-search-api',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'External API search error'
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
