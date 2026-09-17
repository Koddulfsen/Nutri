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

import { db } from '@/db';
import { foods, mergedNutrients, foodNutrientValues } from '@/db/schema';
import { and, asc, count, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import type { SearchOptions } from './query-builder';
import { cnfClient } from '@/lib/services/cnf-client';
import { logger } from '@/lib/logger';

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
   * Search the `foods` table directly over Drizzle/Postgres.
   *
   * Was Supabase's PostgREST REST API ("switched ... for IPv4 compatibility",
   * 2025-12-04) — that reason no longer applies since the 2026-08-22 move to
   * Supabase Postgres, which the rest of the app already reaches over the
   * IPv4-compatible transaction pooler via this same `db` import (see
   * app/api/foods/[foodId]/portions/route.ts). PostgREST added a full HTTP
   * round trip on top of the query itself; direct SQL removes it, and turns
   * the compound-count step (below) from "fetch every row, count in JS" into
   * a real GROUP BY.
   *
   * @param options - Search options
   * @returns Array of search results
   */
  private async searchDatabase(options: SearchOptions): Promise<SearchResult[]> {
    try {
      const { query, category, isEstimated, page = 1, limit = 20, userId } = options;
      const offset = (page - 1) * limit;

      const conditions = [
        // Visibility — public foods are always returned; private foods only
        // when an authenticated user is querying their own.
        userId
          ? or(eq(foods.visibility, 'public'), and(eq(foods.visibility, 'private'), eq(foods.createdBy, userId)))
          : eq(foods.visibility, 'public'),
      ];

      if (query && query.trim().length > 0) {
        // Match if the name contains any word of the query (same semantics
        // as the previous REST version: one ilike per term, OR'd together).
        const searchTerms = query.trim().split(/\s+/);
        conditions.push(or(...searchTerms.map((term) => ilike(foods.name, `%${term}%`))));
      }

      if (category) {
        conditions.push(eq(foods.foodCategoryId, category));
      }

      if (isEstimated !== undefined) {
        conditions.push(eq(foods.isEstimated, isEstimated));
      }

      const rows = await db
        .select({
          id: foods.id,
          fdcId: foods.fdcId,
          name: foods.name,
          description: foods.description,
          foodCategoryId: foods.foodCategoryId,
        })
        .from(foods)
        .where(and(...conditions))
        .orderBy(asc(foods.name))
        .limit(limit)
        .offset(offset);

      if (rows.length === 0) {
        return [];
      }

      const foodIds = rows.map((food) => food.id);
      const compoundCounts = await this.getCompoundCounts(foodIds);

      return rows.map((food) => ({
        id: food.id,
        fdcId: food.fdcId || 0,
        name: food.name,
        description: food.description,
        category: food.foodCategoryId || undefined,
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
   * Get compound counts for a list of food IDs — counted in Postgres
   * (GROUP BY), not by fetching every matching row and counting in JS.
   * Counts from both merged_nutrients (CNF/USDA) and food_nutrient_values
   * (enrichment).
   *
   * @param foodIds - Array of food IDs
   * @returns Map of food ID to compound count
   */
  private async getCompoundCounts(foodIds: string[]): Promise<Map<string, number>> {
    const countMap = new Map<string, number>();

    if (foodIds.length === 0) {
      return countMap;
    }

    try {
      const [mergedRows, enrichmentRows] = await Promise.all([
        db
          .select({ foodId: mergedNutrients.foodId, n: count() })
          .from(mergedNutrients)
          .where(inArray(mergedNutrients.foodId, foodIds))
          .groupBy(mergedNutrients.foodId),
        db
          .select({ foodId: foodNutrientValues.foodId, n: count() })
          .from(foodNutrientValues)
          .where(inArray(foodNutrientValues.foodId, foodIds))
          .groupBy(foodNutrientValues.foodId),
      ]);

      for (const row of mergedRows) {
        countMap.set(row.foodId, (countMap.get(row.foodId) || 0) + row.n);
      }
      for (const row of enrichmentRows) {
        countMap.set(row.foodId, (countMap.get(row.foodId) || 0) + row.n);
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
   *
   * @param query - Original search query
   * @returns Array of suggested searches
   */
  async getSuggestions(query: string): Promise<string[]> {
    try {
      const rows = await db
        .select({ name: foods.name })
        .from(foods)
        .where(ilike(foods.name, `%${query}%`))
        .orderBy(asc(foods.name))
        .limit(5);

      return rows.map((r) => r.name);
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
