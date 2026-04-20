/**
 * Compound Service - Business logic for compound data retrieval
 *
 * Feature System: 05-compound-database-system
 * Wave 2: API Layer Implementation
 * Generated: 2025-11-10
 *
 * CRITICAL: Uses Drizzle relational queries with eager loading (with())
 * to prevent N+1 query problems
 */

import { db } from '@/db';
import { compounds } from '@/db/schema/compounds';
import { eq, and, gte, or, ilike, sql } from 'drizzle-orm';
import type {
  CompoundListItem,
  CompoundDetail,
  ConfidenceLevel,
  CompoundType,
  CitationListItem,
  QualityGrade,
} from '@/lib/types/api';

/**
 * Filter options for compound listing
 */
export interface CompoundFilters {
  category?: CompoundType;
  healthCondition?: string;
  confidenceLevel?: ConfidenceLevel;
  hasRDA?: boolean;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Calculate quality grade from quality score (0-18)
 * A*: 17-18, A: 14-16, B: 10-13, C: 0-9
 */
function calculateQualityGrade(score: number): QualityGrade {
  if (score >= 17) return 'A*';
  if (score >= 14) return 'A';
  if (score >= 10) return 'B';
  return 'C';
}

/**
 * CompoundService - Core business logic for compound operations
 */
export class CompoundService {
  /**
   * Get all compounds with optional filtering and pagination
   *
   * @param filters - Optional filters (category, health condition, confidence level, etc.)
   * @param pagination - Optional pagination (limit, offset)
   * @returns Array of compound list items with metadata
   */
  static async getAllCompounds(
    filters: CompoundFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{
    compounds: CompoundListItem[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const limit = pagination.limit ?? 50;
    const offset = pagination.offset ?? 0;

    // Build where clause conditions
    const conditions = [];

    // Filter by compound type (category)
    if (filters.category) {
      conditions.push(eq(compounds.compoundType, filters.category));
    }

    // Note: confidenceLevel and hasRDA filtering would require additional
    // tables/columns (Phase 2+). For now, we return all compounds matching
    // basic filters. These filters will be implemented when confidence scoring
    // and RDA tables are added.

    // Combine conditions with AND
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Execute query with eager loading (no separate query for count)
    const results = await db.query.compounds.findMany({
      where: whereClause,
      columns: {
        id: true,
        name: true,
        compoundType: true,
        unit: true,
        description: true,
      },
      limit,
      offset,
    });

    // Get total count (separate query for accuracy)
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(compounds)
      .where(whereClause);

    const total = Number(countResult[0]?.count ?? 0);

    // Map to CompoundListItem format
    const compoundList: CompoundListItem[] = results.map((c) => ({
      id: c.id,
      name: c.name,
      compound_type: c.compoundType,
      unit: c.unit,
      description: c.description ?? undefined,
      // confidence_score will be calculated in Phase 2+ when scoring system is implemented
    }));

    return {
      compounds: compoundList,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get compound by ID with all relationships (eager loaded)
   *
   * @param id - Compound UUID
   * @returns Compound detail with citations, categories, and parent compound
   * @throws Error if compound not found
   */
  static async getCompoundById(id: string): Promise<CompoundDetail> {
    // Use Drizzle relational query with eager loading
    const compound = await db.query.compounds.findFirst({
      where: eq(compounds.id, id),
      with: {
        parentCompound: {
          columns: {
            id: true,
            name: true,
          },
        },
        citations: {
          with: {
            citation: {
              columns: {
                id: true,
                pmid: true,
                title: true,
                authors: true,
                year: true,
                journal: true,
                qualityScoreTotal: true,
              },
            },
          },
          limit: 10, // Paginated citations (first 10)
        },
        // Note: categories relationship will be added in Phase 10
        // when functional_categories and compound_category_mapping tables are created
      },
    });

    if (!compound) {
      throw new Error(`Compound with id ${id} not found`);
    }

    // Transform citations to API format
    const citations: CitationListItem[] = compound.citations.map((cc) => ({
      id: cc.citation.id,
      pmid: cc.citation.pmid,
      title: cc.citation.title,
      authors: cc.citation.authors,
      year: cc.citation.year,
      journal: cc.citation.journal,
      quality_score: cc.citation.qualityScoreTotal,
      quality_grade: calculateQualityGrade(cc.citation.qualityScoreTotal),
    }));

    // Transform to CompoundDetail format
    const detail: CompoundDetail = {
      id: compound.id,
      name: compound.name,
      alternate_names: compound.alternateNames ?? [],
      compound_type: compound.compoundType,
      unit: compound.unit,
      description: compound.description ?? undefined,
      health_concern_flags: (compound.healthConcernFlags as Record<string, unknown>) ?? {},
      parent_compound: compound.parentCompound
        ? {
            id: compound.parentCompound.id,
            name: compound.parentCompound.name,
          }
        : undefined,
      categories: [], // Will be populated in Phase 10
      citations,
    };

    return detail;
  }

  /**
   * Get compounds by category (chemical type)
   *
   * @param categoryId - Compound type enum value
   * @param limit - Maximum results to return
   * @returns Array of compound list items
   */
  static async getCompoundsByCategory(
    categoryId: CompoundType,
    limit: number = 50
  ): Promise<CompoundListItem[]> {
    const results = await db.query.compounds.findMany({
      where: eq(compounds.compoundType, categoryId),
      columns: {
        id: true,
        name: true,
        compoundType: true,
        unit: true,
        description: true,
      },
      limit,
    });

    return results.map((c) => ({
      id: c.id,
      name: c.name,
      compound_type: c.compoundType,
      unit: c.unit,
      description: c.description ?? undefined,
    }));
  }
}
