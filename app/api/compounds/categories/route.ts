/**
 * GET /api/compounds/categories - List all compound categories with counts
 *
 * Feature System: 05-compound-database-system
 * Phase: 1 - Browse Compounds
 *
 * Returns all compound types (VITAMIN, MINERAL, etc.) with counts
 * for browsing by category (US-COMP-5.1)
 */

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { compounds } from '@/db/schema/compounds';
import { sql } from 'drizzle-orm';
import type { ApiResponse } from '@/lib/types/api';

interface CompoundCategory {
  type: string;
  count: number;
  label: string;
}

interface GetCategoriesResponse {
  categories: CompoundCategory[];
  total: number;
}

// Human-readable labels for compound types
const CATEGORY_LABELS: Record<string, string> = {
  VITAMIN: 'Vitamins',
  MINERAL: 'Minerals',
  AMINO_ACID: 'Amino Acids',
  FATTY_ACID: 'Fatty Acids',
  POLYPHENOL: 'Polyphenols',
  CAROTENOID: 'Carotenoids',
  GLUCOSINOLATE: 'Glucosinolates',
  ANTI_NUTRIENT: 'Anti-Nutrients',
  PROCESSING_COMPOUND: 'Processing Compounds',
  SYNTHETIC_ADDITIVE: 'Synthetic Additives',
  PERFORMANCE_COMPOUND: 'Performance Compounds',
  NICHE_HEALTH: 'Niche Health Compounds',
};

/**
 * GET handler - List all compound categories with counts
 */
export async function GET() {
  try {
    // Get compound counts grouped by type
    const results = await db
      .select({
        type: compounds.compoundType,
        count: sql<number>`count(*)::int`,
      })
      .from(compounds)
      .groupBy(compounds.compoundType)
      .orderBy(sql`count(*) DESC`);

    // Map to category format with labels
    const categories: CompoundCategory[] = results.map((row) => ({
      type: row.type,
      count: row.count,
      label: CATEGORY_LABELS[row.type] || row.type,
    }));

    // Calculate total
    const total = categories.reduce((sum, cat) => sum + cat.count, 0);

    return NextResponse.json<ApiResponse<GetCategoriesResponse>>(
      {
        success: true,
        data: {
          categories,
          total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/compounds/categories:', error);

    return NextResponse.json<ApiResponse<GetCategoriesResponse>>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
