/**
 * Search Query Builder
 *
 * Purpose: Build PostgreSQL full-text search queries with ts_vector
 * Pattern: Query builder with multi-field search and filtering
 * Features:
 *   - Multi-field search (name, description, brand)
 *   - PostgreSQL full-text search with ts_vector
 *   - Filters: category, brand, is_estimated
 *   - Pagination and sorting
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 2150-2300 (Search Implementation)
 */

import { sql, SQL } from 'drizzle-orm';
import { foods } from '@/db/schema';
import type { PgColumn } from 'drizzle-orm/pg-core';

/**
 * Search options
 */
export interface SearchOptions {
  query: string;
  category?: string;
  brand?: string;
  isEstimated?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'relevance' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  /**
   * Visibility scope for the search.
   * - undefined (default): public foods only — safe for unauthenticated callers.
   * - userId provided: public foods + private foods owned by this user.
   *   Use for authenticated users who should see their own personal recipes.
   */
  userId?: string;
}

/**
 * Search query result
 */
export interface SearchQueryResult {
  whereConditions: SQL[];
  orderBy: SQL[];
  limit: number;
  offset: number;
}

/**
 * Search Query Builder
 */
export class SearchQueryBuilder {
  /**
   * Build search query with full-text search and filters
   *
   * @param options - Search options
   * @returns Query components (where, orderBy, limit, offset)
   */
  buildQuery(options: SearchOptions): SearchQueryResult {
    const {
      query,
      category,
      brand,
      isEstimated,
      page = 1,
      limit = 20,
      sortBy = 'relevance',
      sortOrder = 'desc',
    } = options;

    const whereConditions: SQL[] = [];
    const orderBy: SQL[] = [];

    // Full-text search on name (primary field)
    if (query && query.trim().length > 0) {
      const searchQuery = this.sanitizeQuery(query);

      // Use ts_vector for full-text search
      // Note: search_vector column populated by database trigger
      // Cast to tsvector explicitly since column is text type
      whereConditions.push(
        sql`${foods.searchVector}::tsvector @@ to_tsquery('english', ${searchQuery})`
      );

      // Rank by relevance when sorting by relevance
      if (sortBy === 'relevance') {
        orderBy.push(
          sql`ts_rank(${foods.searchVector}::tsvector, to_tsquery('english', ${searchQuery})) ${sql.raw(sortOrder.toUpperCase())}`
        );
      }
    }

    // Filter by category
    if (category) {
      whereConditions.push(sql`${foods.foodCategoryId} = ${category}`);
    }

    // Filter by brand (stored in description or name for USDA foods)
    if (brand) {
      whereConditions.push(
        sql`(${foods.name} ILIKE ${`%${brand}%`} OR ${foods.description} ILIKE ${`%${brand}%`})`
      );
    }

    // Filter by is_estimated
    if (isEstimated !== undefined) {
      whereConditions.push(sql`${foods.isEstimated} = ${isEstimated}`);
    }

    // Sorting
    if (sortBy === 'name') {
      orderBy.push(sql`${foods.name} ${sql.raw(sortOrder.toUpperCase())}`);
    } else if (sortBy === 'created_at') {
      orderBy.push(sql`${foods.createdAt} ${sql.raw(sortOrder.toUpperCase())}`);
    }

    // Add secondary sort by name for consistent ordering
    if (sortBy !== 'name') {
      orderBy.push(sql`${foods.name} ASC`);
    }

    // Pagination
    const offset = (page - 1) * limit;

    return {
      whereConditions,
      orderBy,
      limit,
      offset,
    };
  }

  /**
   * Build count query (for pagination metadata)
   *
   * @param options - Search options
   * @returns Where conditions for count query
   */
  buildCountQuery(options: SearchOptions): SQL[] {
    const { query, category, brand, isEstimated } = options;
    const whereConditions: SQL[] = [];

    // Full-text search (cast to tsvector since column is text type)
    if (query && query.trim().length > 0) {
      const searchQuery = this.sanitizeQuery(query);
      whereConditions.push(
        sql`${foods.searchVector}::tsvector @@ to_tsquery('english', ${searchQuery})`
      );
    }

    // Filter by category
    if (category) {
      whereConditions.push(sql`${foods.foodCategoryId} = ${category}`);
    }

    // Filter by brand
    if (brand) {
      whereConditions.push(
        sql`(${foods.name} ILIKE ${`%${brand}%`} OR ${foods.description} ILIKE ${`%${brand}%`})`
      );
    }

    // Filter by is_estimated
    if (isEstimated !== undefined) {
      whereConditions.push(sql`${foods.isEstimated} = ${isEstimated}`);
    }

    return whereConditions;
  }

  /**
   * Sanitize search query for ts_query
   * Converts user input to tsquery format with OR operators
   *
   * @param query - Raw search query
   * @returns Sanitized tsquery string
   *
   * @example
   * sanitizeQuery('chicken breast') → 'chicken:* | breast:*'
   */
  private sanitizeQuery(query: string): string {
    // Remove special characters and split into words
    const words = query
      .trim()
      .replace(/[^\w\s]/g, ' ') // Remove special chars
      .split(/\s+/) // Split on whitespace
      .filter((word) => word.length > 0);

    if (words.length === 0) {
      return '';
    }

    // Add prefix matching (:*) for each word and join with OR (|)
    // This allows matching "chicken" when searching for "chick"
    return words.map((word) => `${word}:*`).join(' | ');
  }

  /**
   * Build suggestion query for when no results found
   *
   * @param query - Original search query
   * @returns Fuzzy search query using pg_trgm
   */
  buildSuggestionQuery(query: string): SQL {
    // Use trigram similarity for fuzzy matching
    // Requires pg_trgm extension enabled
    return sql`similarity(${foods.name}, ${query}) > 0.3`;
  }
}

/**
 * Singleton query builder instance
 */
export const searchQueryBuilder = new SearchQueryBuilder();
