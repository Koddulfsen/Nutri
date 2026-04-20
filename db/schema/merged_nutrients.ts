import { pgTable, uuid, text, decimal, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { foods } from './foods';
import { compounds } from './compounds';

/**
 * Merged Nutrients Table
 * Stores averaged nutrient values from multiple API sources
 * Calculated when food is added with multi-source mappings
 *
 * Example:
 * Food: "Chicken Breast, Raw"
 * Compound: "Protein" (UUID: abc-123)
 * Sources: CNF (23.2g), FDC (23.8g), FooDB (23.5g)
 * Average: 23.5g
 * Source Count: 3
 *
 * Migration: Transitioning from nutrientName (string) to compoundId (UUID)
 * - compoundId: NEW - references compounds table
 * - nutrientName: DEPRECATED - will be removed after migration
 */
export const mergedNutrients = pgTable('merged_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),
  foodId: uuid('food_id').notNull().references(() => foods.id, { onDelete: 'cascade' }),
  compoundId: uuid('compound_id').references(() => compounds.id, { onDelete: 'restrict' }), // NEW: Compound ID mapping
  nutrientName: text('nutrient_name'), // DEPRECATED: Legacy string-based lookup
  averageValue: decimal('average_value', { precision: 15, scale: 4 }).notNull(),
  unit: text('unit').notNull(), // e.g., "g", "mg", "μg"
  sourceCount: integer('source_count').notNull().default(1), // How many APIs provided this value
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  foodIdx: index('idx_merged_nutrients_food').on(table.foodId),
  compoundIdx: index('idx_merged_nutrients_compound').on(table.compoundId), // NEW: Compound ID index
  nutrientIdx: index('idx_merged_nutrients_nutrient').on(table.nutrientName), // DEPRECATED: Will be removed
  // NEW: Composite index for fast lookups by compound
  foodCompoundIdx: index('idx_merged_nutrients_food_compound').on(table.foodId, table.compoundId),
  // DEPRECATED: Old composite index - will be removed
  foodNutrientIdx: index('idx_merged_nutrients_food_nutrient').on(table.foodId, table.nutrientName),
}));
