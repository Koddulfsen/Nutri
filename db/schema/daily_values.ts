import { pgTable, uuid, text, numeric, timestamp, boolean, integer, index, uniqueIndex, date } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { compounds } from './compounds';
import { compoundGroups } from './compound_groups';
import { userProfiles } from './users';
import {
  biologicalSexEnum,
  ageGroupEnum,
  lifeStageEnum,
  activityLevelEnum,
  dietaryContextEnum,
  sourceRegionEnum,
  dvTypeEnum,
  sourceTypeEnum,
  dvSourcePreferenceEnum,
} from './daily_values_enums';

// Re-export enums for external use
export {
  biologicalSexEnum,
  ageGroupEnum,
  lifeStageEnum,
  activityLevelEnum,
  dietaryContextEnum,
  sourceRegionEnum,
  dvTypeEnum,
  sourceTypeEnum,
  dvSourcePreferenceEnum,
} from './daily_values_enums';

/**
 * DV Sources Table
 * Central reference for authority attribution. Every row in
 * reference_daily_values rows point here via source_id FK.
 */
export const dvSources = pgTable('dv_sources', {
  id: uuid('id').primaryKey().defaultRandom(),

  authorityName: text('authority_name').notNull(),
  regionCode: text('region_code').notNull(),
  versionYear: integer('version_year').notNull(),
  sourceType: sourceTypeEnum('source_type').notNull(),

  url: text('url'),
  note: text('note'),
  retrievedDate: date('retrieved_date'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  regionVersionIdx: uniqueIndex('idx_dv_sources_region_version').on(
    table.regionCode,
    table.versionYear,
    table.sourceType
  ),
}));

/**
 * Reference Daily Values Table
 * Demographic-aware scientific DRIs from Tier-1 authorities worldwide.
 * Nutri Target is computed by aggregating across these rows at query time.
 */
export const referenceDailyValues = pgTable('reference_daily_values', {
  id: uuid('id').primaryKey().defaultRandom(),

  compoundId: uuid('compound_id').notNull().references(() => compounds.id, { onDelete: 'cascade' }),

  sourceRegion: sourceRegionEnum('source_region').notNull(),
  sourceId: uuid('source_id').references(() => dvSources.id, { onDelete: 'set null' }),

  // Age as native source range in months. Primary age field.
  // User queries: WHERE user_age_months BETWEEN age_min_months AND age_max_months.
  // null for age_max_months = no upper bound (e.g., ">70 y" => age_min=852, age_max=null).
  ageMinMonths: integer('age_min_months'),
  ageMaxMonths: integer('age_max_months'),

  // Convenience label for display/debugging. Not used for lookups.
  // Legacy field — kept nullable for backward compat with existing seeded data.
  ageGroup: ageGroupEnum('age_group'),

  sex: biologicalSexEnum('sex').notNull(),
  lifeStage: lifeStageEnum('life_stage').notNull().default('NONE'),
  activityLevel: activityLevelEnum('activity_level'),
  dietaryContext: dietaryContextEnum('dietary_context'),

  // The daily value (single value or range)
  value: numeric('value', { precision: 12, scale: 4 }).notNull(),
  valueMin: numeric('value_min', { precision: 12, scale: 4 }),
  valueMax: numeric('value_max', { precision: 12, scale: 4 }),
  unit: text('unit').notNull(),
  isPercentOfEnergy: boolean('is_percent_of_energy').notNull().default(false),

  valueType: dvTypeEnum('value_type').notNull().default('RDA'),

  // Provisional flag — NNR distinguishes "provisional AR" from established AR; lower confidence.
  isProvisional: boolean('is_provisional').notNull().default(false),

  // Per-row caveat note (e.g., "assuming menstruation", "mixed animal/vegetable diet").
  // Row-level, distinct from source-level note on dv_sources.
  valueNote: text('value_note'),

  // Legacy attribution fields (kept until dv_sources backfill; new rows should use source_id)
  sourceUrl: text('source_url'),
  sourceNote: text('source_note'),

  lastUpdated: date('last_updated').notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Primary unique constraint: one value per (compound, source, age-range, demographic, type)
  // NOTE: the physical index uses NULLS NOT DISTINCT (Postgres 15+) so NULL activity_level,
  // dietary_context, or age_max_months don't bypass uniqueness. The Drizzle version can't
  // declare NULLS NOT DISTINCT inline, so migration 0039 recreates the index with the clause.
  // Migration 0040 adds dietary_context to the unique key.
  compoundDemoSourceIdx: uniqueIndex('idx_ref_dv_compound_demo_source').on(
    table.compoundId,
    table.sourceRegion,
    table.ageMinMonths,
    table.ageMaxMonths,
    table.sex,
    table.lifeStage,
    table.valueType,
    table.activityLevel,
    table.dietaryContext
  ),

  compoundIdx: index('idx_ref_dv_compound').on(table.compoundId),
  sourceIdx: index('idx_ref_dv_source').on(table.sourceRegion),
  // Range-lookup index: find all rows containing a given user age
  ageLookupIdx: index('idx_ref_dv_age_range').on(table.ageMinMonths, table.ageMaxMonths),
  demographicIdx: index('idx_ref_dv_demographic').on(table.sex, table.lifeStage),
}));

/**
 * User Custom Daily Values Table
 * Premium feature: user-defined daily value overrides
 */
export const userCustomDailyValues = pgTable('user_custom_daily_values', {
  id: uuid('id').primaryKey().defaultRandom(),

  // User reference
  userId: uuid('user_id').notNull().references(() => userProfiles.userId, { onDelete: 'cascade' }),

  // Compound reference
  compoundId: uuid('compound_id').notNull().references(() => compounds.id, { onDelete: 'cascade' }),

  // Custom value
  value: numeric('value', { precision: 12, scale: 4 }).notNull(),
  unit: text('unit').notNull(),

  // Optional note (why they set this value)
  note: text('note'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // One custom value per user per compound
  userCompoundUnique: uniqueIndex('idx_user_custom_dv_unique').on(table.userId, table.compoundId),

  // Query by user
  userIdx: index('idx_user_custom_dv_user').on(table.userId),
}));

// NOTE: compound_display_settings table has been deprecated
// Display settings (has_dv) are now stored directly on compounds and compound_groups tables
