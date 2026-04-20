import { pgTable, uuid, text, timestamp, boolean, decimal, integer, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { foods } from './foods';

/**
 * Food Portions Table
 * Standard portion definitions for each food item
 * All nutrient values are stored per 100g; portions provide gram-weight conversions for meal logging
 */
export const foodPortions = pgTable('food_portions', {
  id: uuid('id').primaryKey().defaultRandom(),
  foodId: uuid('food_id').notNull().references(() => foods.id, { onDelete: 'cascade' }),
  description: text('description').notNull(), // "1 large", "1 cup, chopped", "1 tablespoon"
  gramWeight: decimal('gram_weight', { precision: 10, scale: 2 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  source: text('source'), // "AI", "manual", "FDC", "CNF", etc.
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  foodIdx: index('idx_food_portions_food').on(table.foodId),
  gramWeightCheck: check('gram_weight_positive', sql`${table.gramWeight} > 0`),
}));
