import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { foodCategories } from '@/db/schema/categories';
import { eq, isNull, and } from 'drizzle-orm';
import { FoodCategoriesQuerySchema, validateQuery } from '@/lib/validations/api-params';
import { validationError, databaseError } from '@/lib/api/errors';

/**
 * GET /api/food-categories
 *
 * Browse food categories with hierarchical structure
 *
 * Query params:
 * - parentId: string - Get children of specific category (omit for root level)
 * - level: number - Filter by hierarchy level (1-5)
 * - includeChildren: boolean - Include all descendants (default: false)
 *
 * Returns:
 * - categories: FoodCategory[] - Array of categories
 * - total: number - Total categories returned
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Validate query parameters
    const validation = validateQuery(FoodCategoriesQuerySchema, searchParams);
    if (!validation.success) {
      return validationError(validation.errors);
    }

    const { parentId, level, includeChildren } = validation.data;

    // Build conditions array
    const conditions = [];

    // Filter by parent
    if (parentId) {
      conditions.push(eq(foodCategories.parentCategoryId, parentId));
    } else if (!parentId && !level) {
      // Root level categories (no parent) - only if no other filters
      conditions.push(isNull(foodCategories.parentCategoryId));
    }

    // Filter by level
    if (level) {
      conditions.push(eq(foodCategories.level, level as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select()
      .from(foodCategories)
      .where(whereClause)
      .orderBy(foodCategories.name);

    // If includeChildren is true, recursively fetch descendants
    let allCategories = results;
    if (includeChildren) {
      for (const category of results) {
        const descendants = await getDescendants(category.id);
        allCategories = [...allCategories, ...descendants];
      }
    }

    return NextResponse.json({
      categories: allCategories,
      total: allCategories.length,
    });
  } catch (error) {
    return databaseError(error);
  }
}

/**
 * Recursively fetch all descendants of a category
 */
async function getDescendants(categoryId: string): Promise<any[]> {
  const children = await db
    .select()
    .from(foodCategories)
    .where(eq(foodCategories.parentCategoryId, categoryId));

  let descendants = [...children];

  for (const child of children) {
    const childDescendants = await getDescendants(child.id);
    descendants = [...descendants, ...childDescendants];
  }

  return descendants;
}
