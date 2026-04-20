import { z } from 'zod';

/**
 * Validation schemas for API query parameters
 */

// Compound type enum matching database
export const CompoundTypeEnum = z.enum([
  'VITAMIN',
  'MINERAL',
  'AMINO_ACID',
  'FATTY_ACID',
  'POLYPHENOL',
  'CAROTENOID',
  'GLUCOSINOLATE',
  'ANTI_NUTRIENT',
  'PROCESSING_COMPOUND',
  'SYNTHETIC_ADDITIVE',
  'PERFORMANCE_COMPOUND',
  'NICHE_HEALTH',
]);

/**
 * GET /api/compounds query parameters
 */
export const CompoundsQuerySchema = z.object({
  search: z.string().min(1).max(100).optional(),
  type: CompoundTypeEnum.optional(),
  types: z.string().refine(
    (val) => {
      const types = val.split(',');
      return types.every(t => CompoundTypeEnum.safeParse(t).success);
    },
    { message: 'Invalid compound types' }
  ).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CompoundsQuery = z.infer<typeof CompoundsQuerySchema>;

/**
 * GET /api/compounds/[id] params
 */
export const CompoundIdSchema = z.object({
  id: z.string().uuid('Invalid compound ID'),
});

export type CompoundIdParams = z.infer<typeof CompoundIdSchema>;

/**
 * GET /api/food-categories query parameters
 */
export const FoodCategoriesQuerySchema = z.object({
  parentId: z.string().uuid().optional(),
  level: z.coerce.number().int().min(1).max(5).optional(),
  includeChildren: z.enum(['true', 'false']).transform(val => val === 'true').default('false'),
});

export type FoodCategoriesQuery = z.infer<typeof FoodCategoriesQuerySchema>;

/**
 * Helper to validate and parse query parameters
 */
export function validateQuery<T extends z.ZodTypeAny>(
  schema: T,
  params: URLSearchParams
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } {
  const parsed = Object.fromEntries(params.entries());
  const result = schema.safeParse(parsed);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}
