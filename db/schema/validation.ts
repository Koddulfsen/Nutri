import { pgTable, uuid, decimal, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { compounds } from './compounds';

/**
 * Compound Validation Ranges Table
 * Validation thresholds for 280 compounds (min/max/warn/reject)
 * Used by quality validation pipeline (FR-DATA-030)
 */
export const compoundValidationRanges = pgTable('compound_validation_ranges', {
  id: uuid('id').primaryKey().defaultRandom(),
  compoundId: uuid('compound_id').notNull().unique().references(() => compounds.id, { onDelete: 'restrict' }),
  minValue: decimal('min_value', { precision: 12, scale: 6 }),
  maxValue: decimal('max_value', { precision: 12, scale: 6 }),
  warnThreshold: decimal('warn_threshold', { precision: 12, scale: 6 }),
  rejectThreshold: decimal('reject_threshold', { precision: 12, scale: 6 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  compoundUnique: uniqueIndex('idx_compound_validation_compound').on(table.compoundId),
}));
