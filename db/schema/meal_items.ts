import { pgTable, uuid, text, decimal, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { mealLogs } from './meal_logs';
import { foods } from './foods';

/**
 * Meal Items Table
 * Individual food items in meals
 * ~9M → 180M items (Phase 2-5 growth)
 */
export const mealItems = pgTable('meal_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  mealLogId: uuid('meal_log_id').notNull().references(() => mealLogs.id, { onDelete: 'cascade' }),
  foodId: uuid('food_id').notNull().references(() => foods.id, { onDelete: 'restrict' }),
  portionSize: decimal('portion_size', { precision: 10, scale: 2 }).notNull(),
  portionType: text('portion_type').notNull(),
  contextId: uuid('context_id'), // Will reference cooking_contexts when created
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  mealLogIdx: index('idx_meal_items_meal_log').on(table.mealLogId),
  foodIdx: index('idx_meal_items_food').on(table.foodId),
  contextIdx: index('idx_meal_items_context').on(table.contextId).where(sql`${table.contextId} IS NOT NULL`),
  portionSizeCheck: sql`CHECK (portion_size > 0)`,
}));
