/**
 * Search Service - 3-Tier Cascade Search Implementation
 *
 * Feature System: 05-compound-database-system
 * Wave 2: API Layer Implementation
 * Generated: 2025-11-10
 *
 * ARCHITECTURE: 3-tier search cascade for optimal performance
 * - Tier 1: Exact prefix match (ILIKE 'query%') - <10ms
 * - Tier 2: Full-text search (tsvector @@ tsquery) - 20-50ms
 * - Tier 3: Fuzzy trigram (similarity > 0.3) - 50-100ms
 *
 * CRITICAL: Each tier only executes if previous tier returns < 5 results
 * This ensures optimal performance by using fastest method first
 */

import { db } from '@/db';
import { compounds } from '@/db/schema/compounds';
import { sql, ilike } from 'drizzle-orm';
import type { SearchResult, SearchMatchType } from '@/lib/types/api';

/**
 * Minimum query length for search
 */
const MIN_QUERY_LENGTH = 3;

/**
 * Minimum results to stop cascade (if Tier N returns >= this, skip remaining tiers)
 */
const CASCADE_THRESHOLD = 5;

/**
 * Minimum similarity score for fuzzy trigram matching (0.0-1.0)
 */
const FUZZY_SIMILARITY_THRESHOLD = 0.3;

/**
 * SearchService - Implements 3-tier search cascade
 */
export class SearchService {
  /**
   * Search compounds with 3-tier cascade algorithm
   *
   * @param query - Search query string (min 3 characters)
   * @param limit - Maximum results to return (default 10)
   * @returns Array of search results with match type and similarity score
   * @throws Error if query is too short
   */
  static async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    // Validate query length
    if (query.length < MIN_QUERY_LENGTH) {
      throw new Error(`Search query must be at least ${MIN_QUERY_LENGTH} characters`);
    }

    // Tier 1: Exact prefix match (fastest, <10ms)
    const exactResults = await this.exactPrefixMatch(query, limit);
    if (exactResults.length >= CASCADE_THRESHOLD) {
      return exactResults.slice(0, limit);
    }

    // Tier 2: Full-text search (medium, 20-50ms)
    const ftsResults = await this.fullTextSearch(query, limit);
    if (ftsResults.length >= CASCADE_THRESHOLD) {
      return ftsResults.slice(0, limit);
    }

    // Tier 3: Fuzzy trigram search (slowest, 50-100ms)
    const fuzzyResults = await this.fuzzyTrigramSearch(query, limit);
    return fuzzyResults.slice(0, limit);
  }

  /**
   * Tier 1: Exact prefix match using ILIKE
   *
   * @param query - Search query
   * @param limit - Maximum results
   * @returns Array of search results with 'exact' match type
   */
  private static async exactPrefixMatch(query: string, limit: number): Promise<SearchResult[]> {
    const results = await db
      .select({
        id: compounds.id,
        name: compounds.name,
        compound_type: compounds.compoundType,
      })
      .from(compounds)
      .where(ilike(compounds.name, `${query}%`))
      .limit(limit);

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      compound_type: r.compound_type,
      match_type: 'exact' as SearchMatchType,
    }));
  }

  /**
   * Tier 2: Full-text search using PostgreSQL tsvector
   *
   * @param query - Search query
   * @param limit - Maximum results
   * @returns Array of search results with 'full-text' match type
   */
  private static async fullTextSearch(query: string, limit: number): Promise<SearchResult[]> {
    // PostgreSQL full-text search with to_tsvector and to_tsquery
    // Using prefix matching with :* wildcard
    const results = await db.execute<{
      id: string;
      name: string;
      compound_type: string;
    }>(sql`
      SELECT id, name, compound_type
      FROM compounds
      WHERE to_tsvector('english', name) @@ to_tsquery('english', ${query + ':*'})
      LIMIT ${limit}
    `);

    return Array.from(results).map((r: any) => ({
      id: r.id,
      name: r.name,
      compound_type: r.compound_type,
      match_type: 'full-text' as SearchMatchType,
    }));
  }

  /**
   * Tier 3: Fuzzy trigram search using pg_trgm similarity
   *
   * @param query - Search query
   * @param limit - Maximum results
   * @returns Array of search results with 'fuzzy' match type and similarity score
   */
  private static async fuzzyTrigramSearch(query: string, limit: number): Promise<SearchResult[]> {
    // PostgreSQL trigram similarity matching with pg_trgm extension
    // Returns results with similarity score > threshold, ordered by similarity DESC
    const results = await db.execute<{
      id: string;
      name: string;
      compound_type: string;
      similarity: number;
    }>(sql`
      SELECT
        id,
        name,
        compound_type,
        similarity(name, ${query}) AS similarity
      FROM compounds
      WHERE similarity(name, ${query}) > ${FUZZY_SIMILARITY_THRESHOLD}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `);

    return Array.from(results).map((r: any) => ({
      id: r.id,
      name: r.name,
      compound_type: r.compound_type,
      match_type: 'fuzzy' as SearchMatchType,
      similarity: r.similarity,
    }));
  }

  /**
   * Autocomplete search (alias for search method)
   * Provided for semantic clarity in API routes
   *
   * @param query - Search query string
   * @param limit - Maximum results to return
   * @returns Array of search results
   */
  static async autocomplete(query: string, limit: number = 10): Promise<SearchResult[]> {
    return this.search(query, limit);
  }
}
