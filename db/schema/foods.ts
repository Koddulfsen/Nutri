import { pgTable, uuid, integer, text, timestamp, boolean, decimal, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { foodCategories } from './categories';
import { users } from './users';
import { originTypeEnum, foodVisibilityEnum } from './multi_source_enums';

/**
 * Foods Table
 * Food items database with multi-source API integration
 * ~10K → 150K rows (organic growth via user-curated additions)
 *
 * Migration from single-source (USDA) to multi-source system:
 * - fdcId + dataSource: Legacy fields for backward compatibility
 * - commonNames: Search aliases for improved discoverability
 * - usageCount: Popularity tracking for relevance scoring
 * - createdBy: Community curation tracking
 */
export const foods = pgTable('foods', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Legacy fields (backward compatibility)
  fdcId: integer('fdc_id'),
  dataSource: text('data_source').notNull().default('NUTRI'), // 'NUTRI', 'FDC', 'CNF' (legacy)

  // Core fields
  name: text('name').notNull(),
  description: text('description'),
  commonNames: text('common_names').array(), // ["chicken breast", "raw chicken breast", "poultry breast"]
  foodCategoryId: uuid('food_category_id').references(() => foodCategories.id, { onDelete: 'set null' }),
  defaultPortionType: text('default_portion_type'),
  defaultPortionSize: decimal('default_portion_size', { precision: 10, scale: 2 }),
  isEstimated: boolean('is_estimated').notNull().default(false),

  // Structured metadata (captured by AI during add-food flow)
  foodFamily: text('food_family'), // Core food identity: "Egg", "Chicken", "Rice"
  variety: text('variety'), // Species/type when not default: "duck", "brown", "Atlantic"
  part: text('part'), // Cut/form: "whole", "breast", "fillet"
  preparation: text('preparation'), // Cooking state: "raw", "cooked", "grilled"
  qualifiers: text('qualifiers').array().default(sql`'{}'`), // Additional modifiers: ["skinless", "3.25% fat"]
  originType: originTypeEnum('origin_type'), // "animal", "plant", "fungi", etc.
  isComposite: boolean('is_composite').notNull().default(false), // Multi-ingredient foods
  scientificName: text('scientific_name'), // Botanical/zoological name

  // Multi-source system fields
  usageCount: integer('usage_count').notNull().default(0), // Incremented when added to meals
  createdBy: uuid('created_by').references(() => users.userId, { onDelete: 'set null' }), // References auth.users.id, null if anonymous

  // Visibility — public (default) for atoms + approved branded composites; private for personal recipes
  visibility: foodVisibilityEnum('visibility').notNull().default('public'),

  // Full-text search
  searchVector: text('search_vector'), // Will be populated by trigger

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  fdcIdx: uniqueIndex('idx_foods_fdc').on(table.fdcId).where(sql`${table.fdcId} IS NOT NULL`),
  categoryIdx: index('idx_foods_category').on(table.foodCategoryId).where(sql`${table.foodCategoryId} IS NOT NULL`),
  sourceIdx: index('idx_foods_source').on(table.dataSource),
  nameBtreeIdx: index('idx_foods_name_btree').on(table.name),
  nameGinTrgmIdx: index('idx_foods_name_gin_trgm').using('gin', sql`${table.name} gin_trgm_ops`),
  ftsIdx: index('idx_foods_fts').using('gin', table.searchVector),
  usageIdx: index('idx_foods_usage').on(table.usageCount), // For popularity sorting
  creatorIdx: index('idx_foods_creator').on(table.createdBy),
  visibilityIdx: index('idx_foods_visibility').on(table.visibility),
  portionSizeCheck: sql`CHECK (default_portion_size > 0 OR default_portion_size IS NULL)`,
}));
