import { pgTable, uuid, text, timestamp, jsonb, index, uniqueIndex, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { compoundTypeEnum, compoundTierEnum } from './enums';
import { compoundGroups } from './compound_groups';

/**
 * Compounds Table
 * Central entity for all tracked nutrients and compounds
 *
 * Tiers:
 * - core: ~195 manually curated compounds (vitamins, minerals, macros, etc.)
 * - advanced: Auto-imported from FooDB, Duke's, Phenol-Explorer (unlimited)
 */
export const compounds = pgTable('compounds', {
  id: uuid('id').primaryKey().defaultRandom(),
  compoundType: compoundTypeEnum('compound_type').notNull(),
  tier: compoundTierEnum('tier').notNull().default('advanced'),
  name: text('name').notNull(),
  alternateNames: text('alternate_names').array().default(sql`ARRAY[]::text[]`),
  unit: text('unit').notNull(),
  // Hierarchical group this compound belongs to (e.g., "B-Complex", "Omega-3")
  groupId: uuid('group_id').references(() => compoundGroups.id, { onDelete: 'set null' }),
  parentCompoundId: uuid('parent_compound_id').references((): any => compounds.id, { onDelete: 'set null' }),
  description: text('description'),
  healthConcernFlags: jsonb('health_concern_flags').notNull().default(sql`'{}'::jsonb`),
  formationConditions: jsonb('formation_conditions'),
  iarcGroup: text('iarc_group'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  typeIdx: index('idx_compounds_type').on(table.compoundType),
  tierIdx: index('idx_compounds_tier').on(table.tier),
  groupIdx: index('idx_compounds_group').on(table.groupId).where(sql`${table.groupId} IS NOT NULL`),
  parentIdx: index('idx_compounds_parent').on(table.parentCompoundId).where(sql`${table.parentCompoundId} IS NOT NULL`),
  healthFlagsIdx: index('idx_compounds_health_flags').using('gin', table.healthConcernFlags).where(sql`jsonb_typeof(${table.healthConcernFlags}) = 'object'`),
}));

/**
 * Compound Sources Table
 * UUID mapping system for cross-source deduplication
 * Maps external source IDs to internal compound UUIDs with unit conversion info
 *
 * Example: FDC 1008 (Energy kcal) and FDC 1062 (Energy kJ) both map to "Energy" compound
 * - FDC 1008: source_unit='kcal', conversion_factor=1.0, is_canonical=true
 * - FDC 1062: source_unit='kJ', conversion_factor=0.239, is_canonical=false
 */
export const compoundSources = pgTable('compound_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  compoundId: uuid('compound_id').notNull().references(() => compounds.id, { onDelete: 'restrict' }),
  externalSource: text('external_source').notNull(), // 'CNF', 'FDC', 'PhenolExplorer', etc.
  externalId: text('external_id').notNull(), // Source-specific ID (e.g., '1008', '208')
  sourceName: text('source_name'), // Name used by source (e.g., 'Energy (kcal)')
  sourceUnit: text('source_unit'), // Unit used by source (e.g., 'kcal', 'kJ', 'IU')
  conversionFactor: text('conversion_factor').default('1.0'), // Multiply to get canonical unit
  isCanonical: boolean('is_canonical').default(false), // Primary mapping for aggregation
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  compoundIdx: index('idx_compound_sources_compound').on(table.compoundId),
  externalUnique: uniqueIndex('idx_compound_sources_external').on(table.externalSource, table.externalId),
}));
