import { pgTable, uuid, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { compoundSources } from './compounds';

/**
 * Compound Source Verifications Table
 * Tracks manual verification status of compound_sources mappings.
 * Each mapping is verified once — confirms the external nutrient ID
 * correctly maps to the internal Nutri compound.
 */
export const compoundSourceVerifications = pgTable('compound_source_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  compoundSourceId: uuid('compound_source_id').notNull().references(() => compoundSources.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // 'verified' | 'flagged' (dead mapping, exclude from use) | 'review' (needs unit/CF/source-id fix)
  notes: text('notes'),
  verifiedBy: uuid('verified_by'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  compoundSourceUniq: uniqueIndex('idx_csv_compound_source_uniq').on(table.compoundSourceId),
  statusIdx: index('idx_csv_status').on(table.status),
}));
