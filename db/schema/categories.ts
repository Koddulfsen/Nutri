import { pgTable, uuid, text, integer, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Food Categories Table
 * 5-level hierarchical taxonomy (~100 categories) for food classification
 * Example: Fruits → Citrus → Oranges → Navel Oranges → Organic Navel Oranges
 */
export const foodCategories = pgTable('food_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  parentCategoryId: uuid('parent_category_id').references((): any => foodCategories.id, { onDelete: 'set null' }),
  level: integer('level').notNull().$type<1 | 2 | 3 | 4 | 5>(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  parentIdx: index('idx_food_categories_parent').on(table.parentCategoryId).where(sql`${table.parentCategoryId} IS NOT NULL`),
  levelIdx: index('idx_food_categories_level').on(table.level),
  levelCheck: check('level_check', sql`${table.level} BETWEEN 1 AND 5`),
}));
