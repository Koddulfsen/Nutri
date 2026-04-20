import { pgTable, uuid, text, decimal, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { foods } from './foods';
import { compounds } from './compounds';
import { userProfiles } from './users';

/**
 * Food Compound Value Versions Table
 * Immutable event log for food data changes (audit trail)
 * ~50K rows initially (grows with manual corrections)
 */
export const foodCompoundValueVersions = pgTable('food_compound_value_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  foodId: uuid('food_id').notNull().references(() => foods.id, { onDelete: 'cascade' }),
  compoundId: uuid('compound_id').notNull().references(() => compounds.id, { onDelete: 'restrict' }),
  source: text('source').notNull(),
  valueBefore: decimal('value_before', { precision: 12, scale: 6 }),
  valueAfter: decimal('value_after', { precision: 12, scale: 6 }).notNull(),
  confidenceBefore: integer('confidence_before'),
  confidenceAfter: integer('confidence_after').notNull(),
  changeReason: text('change_reason'),
  changedBy: uuid('changed_by').references(() => userProfiles.userId, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  foodCompoundIdx: index('idx_food_versions_food_compound').on(table.foodId, table.compoundId, table.createdAt),
  createdIdx: index('idx_food_versions_created').on(table.createdAt),
  changedByIdx: index('idx_food_versions_changed_by').on(table.changedBy).where(sql`${table.changedBy} IS NOT NULL`),
  valueBeforeCheck: sql`CHECK (value_before >= 0 OR value_before IS NULL)`,
  valueAfterCheck: sql`CHECK (value_after >= 0)`,
  confidenceBeforeCheck: sql`CHECK (confidence_before BETWEEN 0 AND 100 OR confidence_before IS NULL)`,
  confidenceAfterCheck: sql`CHECK (confidence_after BETWEEN 0 AND 100)`,
}));
