import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { severityLevelEnum, evidenceLevelEnum } from './enums';
import { compounds } from './compounds';

/**
 * Medication Interactions Table
 * 18 medication-compound interactions with severity and evidence levels
 * Examples: Warfarin + Vitamin K, MAOIs + Tyramine, Statins + Grapefruit
 */
export const medicationInteractions = pgTable('medication_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  compoundId: uuid('compound_id').notNull().references(() => compounds.id, { onDelete: 'restrict' }),
  medicationName: text('medication_name').notNull(),
  interactionDescription: text('interaction_description').notNull(),
  severity: severityLevelEnum('severity').notNull(),
  evidenceLevel: evidenceLevelEnum('evidence_level').notNull(),
  clinicalNote: text('clinical_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  compoundIdx: index('idx_medication_interactions_compound').on(table.compoundId),
  severityIdx: index('idx_medication_interactions_severity').on(table.severity),
  medicationIdx: index('idx_medication_interactions_medication').on(table.medicationName),
}));
