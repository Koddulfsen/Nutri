/**
 * Food Search API Endpoint
 *
 * GET /api/foods/search
 *
 * Purpose: Search foods with multi-source aggregation
 * Pattern: Database search + USDA API fallback with pagination
 * Features:
 *   - Query parameter: q (search query)
 *   - Filters: category, brand, isEstimated
 *   - Pagination: page, limit
 *   - Return paginated results with metadata
 *   - Include search suggestions for 0 results
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 2400-2500 (Search API)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchService } from '@/lib/search/search-service';
import { logger } from '@/lib/logger';

/**
 * Query parameters schema validation
 */
const SearchParamsSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  category: z.string().optional(),
  brand: z.string().optional(),
  isEstimated: z
    .string()
    .optional()
    .transform((val) => val === 'true' ? true : val === 'false' ? false : undefined),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100)), // Max 100 results per page
  sortBy: z.enum(['name', 'relevance', 'created_at']).optional().default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * GET /api/foods/search
 * Search foods with multi-source aggregation
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Parse and validate query parameters
    const { searchParams } = new URL(request.url);

    const paramsObject = {
      q: searchParams.get('q'),
      category: searchParams.get('category') || undefined,
      brand: searchParams.get('brand') || undefined,
      isEstimated: searchParams.get('isEstimated') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const validationResult = SearchParamsSchema.safeParse(paramsObject);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'food-search-api',
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
        service: 'food-search-api',
        query: params.q,
        filters: {
          category: params.category,
          brand: params.brand,
          isEstimated: params.isEstimated,
        },
        page: params.page,
        limit: params.limit,
      },
      'Executing food search'
    );

    // Step 2: Execute search
    const searchResponse = await searchService.searchFoods({
      query: params.q,
      category: params.category,
      brand: params.brand,
      isEstimated: params.isEstimated,
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });

    // Step 3: If no results, get suggestions
    let suggestions: string[] = [];

    if (searchResponse.results.length === 0) {
      logger.debug(
        {
          service: 'food-search-api',
          query: params.q,
        },
        'No results found - generating suggestions'
      );

      suggestions = await searchService.getSuggestions(params.q);
    }

    logger.info(
      {
        service: 'food-search-api',
        query: params.q,
        totalResults: searchResponse.pagination.total,
        durationMs: searchResponse.metadata.durationMs,
      },
      'Food search completed'
    );

    // Step 4: Return results
    return NextResponse.json({
      results: searchResponse.results,
      pagination: searchResponse.pagination,
      metadata: {
        ...searchResponse.metadata,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      },
    });
  } catch (error) {
    logger.error(
      {
        service: 'food-search-api',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Food search API error'
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
