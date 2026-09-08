import { pgTable, uuid, text, timestamp, numeric, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { compounds } from './compounds';
import { foods } from './foods';

/**
 * Compound-Food Sanity Check Cache
 *
 * Stores web-search-backed sanity checks for (compound, food) value pairs.
 * Populated by the /admin/verify-mappings page via Claude + web_search.
 * Unique per (compound_id, food_id) — one check per pair, re-runnable.
 */
export const compoundFoodSanityChecks = pgTable('compound_food_sanity_checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  compoundId: uuid('compound_id').notNull().references(() => compounds.id, { onDelete: 'cascade' }),
  foodId: uuid('food_id').notNull().references(() => foods.id, { onDelete: 'cascade' }),
  verdict: text('verdict').notNull(), // 'matches' | 'low_outlier' | 'high_outlier' | 'uncertain'
  confidence: text('confidence').notNull(), // 'high' | 'medium' | 'low'
  expectedLow: numeric('expected_low'),
  expectedHigh: numeric('expected_high'),
  typicalValue: numeric('typical_value'),
  unit: text('unit').notNull(),
  ourValueAtCheck: numeric('our_value_at_check').notNull(),
  sources: jsonb('sources').notNull(), // Array<{ name: string; url: string; value: number | null }>
  note: text('note'),
  checkedBy: uuid('checked_by'),
  checkedAt: timestamp('checked_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  compoundFoodUniq: uniqueIndex('idx_cfsc_compound_food_uniq').on(table.compoundId, table.foodId),
  verdictIdx: index('idx_cfsc_verdict').on(table.verdict),
}));
