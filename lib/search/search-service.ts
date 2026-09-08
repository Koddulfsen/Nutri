/**
 * Search Service
 *
 * Purpose: Coordinate database search + CNF API fallback with deduplication
 * Pattern: Multi-source search orchestration with relevance scoring
 * Features:
 *   - Database full-text search (primary) - uses Supabase REST API
 *   - CNF API search (fallback)
 *   - Result deduplication (prefer local over CNF)
 *   - Relevance scoring
 *   - Search analytics tracking
 *
 * Updated: 2025-12-04 (switched to Supabase REST API for IPv4 compatibility)
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 2250-2350 (Search Orchestration)
 */

import { createClient } from '@/lib/supabase/server';
import type { SearchOptions } from './query-builder';
import { cnfClient } from '@/lib/services/cnf-client';
import { logger } from '@/lib/logger';

/**
 * Shape of a `foods` row as selected by `searchDatabase`.
 *
 * The Supabase client is constructed without a generated `Database` type, so
 * PostgREST results are untyped at compile time. This mirrors the explicit
 * select list in `searchDatabase` — keep the two in sync.
 */
interface FoodSearchRow {
  id: string;
  fdc_id: number | null;
  name: string;
  description: string | null;
  food_category_id: string | null;
}

/**
 * Search result
 */
export interface SearchResult {
  id?: string; // Internal ID (if in database)
  fdcId: number; // USDA FDC ID (if from database) or CNF food_code (if from CNF)
  name: string;
  description: string | null;
  category?: string;
  brand?: string;
  dataSource: 'DATABASE' | 'CNF';
  relevanceScore?: number;
  isImported: boolean; // True if in database, false if from CNF
  compoundCount?: number; // Number of compounds/nutrients for this food
}

/**
 * Paginated search response
 */
export interface SearchResponse {
  results: SearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  metadata: {
    query: string;
    filters: Record<string, any>;
    durationMs: number;
    databaseResults: number;
    cnfResults: number;
  };
}

/**
 * Search Service
 */
export class SearchService {
  /**
   * Search foods across database and USDA API
   *
   * @param options - Search options
   * @returns Paginated search results
   */
  async searchFoods(options: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now();

    logger.info(
      {
        service: 'search-service',
        query: options.query,
        filters: {
          category: options.category,
          brand: options.brand,
          isEstimated: options.isEstimated,
        },
        page: options.page,
        limit: options.limit,
      },
      'Executing food search'
    );

    // Step 1: Search database ONLY (no API fallback)
    const databaseResults = await this.searchDatabase(options);

    logger.debug(
      {
        service: 'search-service',
        databaseCount: databaseResults.length,
      },
      'Database search completed'
    );

    // Use database results only (removed CNF API fallback)
    const combinedResults = databaseResults;

    // Step 4: Apply pagination
    const { page = 1, limit = 20 } = options;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = combinedResults.slice(startIndex, endIndex);

    // Step 5: Calculate metadata
    const durationMs = Date.now() - startTime;
    const totalPages = Math.ceil(combinedResults.length / limit);

    logger.info(
      {
        service: 'search-service',
        totalResults: combinedResults.length,
        databaseResults: databaseResults.length,
        durationMs,
      },
      'Search completed'
    );

    return {
      results: paginatedResults,
      pagination: {
        page,
        limit,
        total: combinedResults.length,
        totalPages,
      },
      metadata: {
        query: options.query,
        filters: {
          category: options.category,
          brand: options.brand,
          isEstimated: options.isEstimated,
        },
        durationMs,
        databaseResults: databaseResults.length,
        cnfResults: 0, // Always 0 now (no API fallback)
      },
    };
  }

  /**
   * Search database with full-text search via Supabase REST API
   * Uses ilike for simple text matching (REST API compatible)
   *
   * @param options - Search options
   * @returns Array of search results
   */
  private async searchDatabase(options: SearchOptions): Promise<SearchResult[]> {
    try {
      const { query, category, brand, isEstimated, page = 1, limit = 20, userId } = options;
      const offset = (page - 1) * limit;

      // Create Supabase client (uses REST API which works with IPv4)
      const supabase = await createClient();

      // Build query
      let dbQuery = supabase
        .from('foods')
        .select('id, fdc_id, name, description, food_category_id');

      // Visibility filter — public foods are always returned; private foods
      // only when an authenticated user is querying their own.
      if (userId) {
        dbQuery = dbQuery.or(`visibility.eq.public,and(visibility.eq.private,created_by.eq.${userId})`);
      } else {
        dbQuery = dbQuery.eq('visibility', 'public');
      }

      // Text search - use ilike for pattern matching
      if (query && query.trim().length > 0) {
        // Search for any word in the query matching the food name
        const searchTerms = query.trim().split(/\s+/);
        // Build OR conditions for each term
        const orConditions = searchTerms
          .map((term) => `name.ilike.%${term}%`)
          .join(',');
        dbQuery = dbQuery.or(orConditions);
      }

      // Filter by category
      if (category) {
        dbQuery = dbQuery.eq('food_category_id', category);
      }

      // Filter by is_estimated
      if (isEstimated !== undefined) {
        dbQuery = dbQuery.eq('is_estimated', isEstimated);
      }

      // Apply pagination and ordering
      dbQuery = dbQuery
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1);

      // Execute query
      const { data, error } = await dbQuery;

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // The Supabase client is created without a generated `Database` type, so
      // query results come back untyped. Annotate against the select list above
      // rather than widening to `any`, so the fields used below stay checked.
      const rows = data as FoodSearchRow[];

      // Get compound counts for the found foods
      const foodIds = rows.map((food) => food.id);
      const compoundCounts = await this.getCompoundCounts(supabase, foodIds);

      // Transform to SearchResult format with compound counts
      return rows.map((food) => ({
        id: food.id,
        fdcId: food.fdc_id || 0,
        name: food.name,
        description: food.description,
        category: food.food_category_id || undefined,
        dataSource: 'DATABASE' as const,
        isImported: true,
        compoundCount: compoundCounts.get(food.id) || 0,
      }));
    } catch (error) {
      logger.error(
        {
          service: 'search-service',
          error: error instanceof Error ? error.message : String(error),
        },
        'Database search failed'
      );

      return [];
    }
  }

  /**
   * Get compound counts for a list of food IDs
   * Counts from both merged_nutrients (CNF/USDA) and food_nutrient_values (enrichment)
   *
   * @param supabase - Supabase client
   * @param foodIds - Array of food IDs
   * @returns Map of food ID to compound count
   */
  private async getCompoundCounts(
    supabase: Awaited<ReturnType<typeof createClient>>,
    foodIds: string[]
  ): Promise<Map<string, number>> {
    const countMap = new Map<string, number>();

    if (foodIds.length === 0) {
      return countMap;
    }

    try {
      // Query compound counts from both tables in parallel
      const [mergedResult, enrichmentResult] = await Promise.all([
        // Count from merged_nutrients (CNF/USDA data)
        supabase
          .from('merged_nutrients')
          .select('food_id')
          .in('food_id', foodIds),
        // Count from food_nutrient_values (enrichment data)
        supabase
          .from('food_nutrient_values')
          .select('food_id')
          .in('food_id', foodIds),
      ]);

      if (mergedResult.error) {
        logger.warn(
          {
            service: 'search-service',
            error: mergedResult.error.message,
          },
          'Failed to get merged_nutrients counts'
        );
      }

      if (enrichmentResult.error) {
        logger.warn(
          {
            service: 'search-service',
            error: enrichmentResult.error.message,
          },
          'Failed to get food_nutrient_values counts'
        );
      }

      // Count occurrences per food_id from merged_nutrients
      if (mergedResult.data) {
        for (const row of mergedResult.data) {
          const currentCount = countMap.get(row.food_id) || 0;
          countMap.set(row.food_id, currentCount + 1);
        }
      }

      // Add counts from food_nutrient_values (enrichment)
      if (enrichmentResult.data) {
        for (const row of enrichmentResult.data) {
          const currentCount = countMap.get(row.food_id) || 0;
          countMap.set(row.food_id, currentCount + 1);
        }
      }

      return countMap;
    } catch (error) {
      logger.warn(
        {
          service: 'search-service',
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to get compound counts'
      );
      return countMap;
    }
  }

  /**
   * Search CNF API
   *
   * @param options - Search options
   * @param existingResults - Existing database results (for deduplication)
   * @returns Array of CNF search results
   */
  private async searchCNF(
    options: SearchOptions,
    existingResults: SearchResult[]
  ): Promise<SearchResult[]> {
    try {
      const { query, limit = 20 } = options;

      // Get existing food codes to avoid duplicates
      const existingCodes = new Set(
        existingResults.map((r) => r.fdcId).filter((id) => id > 0)
      );

      // Search CNF - get top 50 results
      const cnfResults = await cnfClient.searchFoods(query, 50);

      if (!cnfResults || cnfResults.length === 0) {
        return [];
      }

      // Filter out duplicates and transform to SearchResult format
      const transformedResults = cnfResults
        .filter((food) => !existingCodes.has(food.foodCode))
        .map((food) => ({
          fdcId: food.foodCode, // Store CNF food_code in fdcId field
          name: food.name,
          description: null,
          category: undefined,
          brand: undefined,
          dataSource: 'CNF' as const,
          isImported: false,
          relevanceScore: food.relevanceScore,
        }))
        .slice(0, limit);

      logger.info(
        {
          service: 'search-service',
          query,
          totalResults: transformedResults.length,
        },
        'CNF search results transformed'
      );

      return transformedResults;
    } catch (error) {
      logger.warn(
        {
          service: 'search-service',
          error: error instanceof Error ? error.message : String(error),
        },
        'CNF search failed - returning empty results'
      );

      return [];
    }
  }

  /**
   * Deduplicate search results (prefer database over CNF)
   *
   * @param databaseResults - Database search results
   * @param cnfResults - CNF search results
   * @returns Combined and deduplicated results
   */
  private deduplicateResults(
    databaseResults: SearchResult[],
    cnfResults: SearchResult[]
  ): SearchResult[] {
    // Create map of food codes from database results
    const fdcIdMap = new Set(
      databaseResults.map((r) => r.fdcId).filter((id) => id > 0)
    );

    // Filter CNF results to exclude duplicates
    const uniqueCnfResults = cnfResults.filter(
      (result) => !fdcIdMap.has(result.fdcId)
    );

    // Combine: database results first (higher relevance), then CNF
    return [...databaseResults, ...uniqueCnfResults];
  }

  /**
   * Get search suggestions when no results found
   * Uses ilike pattern matching via Supabase REST API
   *
   * @param query - Original search query
   * @returns Array of suggested searches
   */
  async getSuggestions(query: string): Promise<string[]> {
    try {
      const supabase = await createClient();

      // Use ilike for pattern matching (REST API compatible)
      const { data, error } = await supabase
        .from('foods')
        .select('name')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(5);

      if (error) {
        throw error;
      }

      return (data as { name: string }[] | null)?.map((r) => r.name) || [];
    } catch (error) {
      logger.warn(
        {
          service: 'search-service',
          query,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to get search suggestions'
      );

      return [];
    }
  }
}

/**
 * Singleton search service instance
 */
export const searchService = new SearchService();
