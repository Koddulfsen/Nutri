import { pgTable, uuid, text, integer, jsonb, timestamp, boolean, uniqueIndex, index, date } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { biologicalSexEnum, ageGroupEnum, lifeStageEnum, dvSourcePreferenceEnum } from './daily_values_enums';

/**
 * User Profiles Table
 * User profile data with 39-factor personalization, DEK encryption key storage
 * 1:1 relationship with Supabase auth.users
 */
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  dataEncryptionKey: text('data_encryption_key').notNull(),
  sessionVersion: integer('session_version').notNull().default(1),
  dashboardWidgets: jsonb('dashboard_widgets').notNull().default(sql`'{"staple": ["rda_snapshot", "recent_meals", "compound_trends"], "custom": []}'::jsonb`),

  // Demographic fields for personalized daily values
  birthDate: date('birth_date'),                                          // For automatic age group calculation
  biologicalSex: biologicalSexEnum('biological_sex'),                     // MALE | FEMALE
  lifeStage: lifeStageEnum('life_stage').notNull().default('NONE'),       // NONE | PREGNANT | LACTATING
  manualAgeGroup: ageGroupEnum('manual_age_group'),                       // Optional override for age calculation
  dvSourcePreference: dvSourcePreferenceEnum('dv_source_preference').notNull().default('AVERAGE'), // Preferred RDA source

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userUnique: uniqueIndex('idx_user_profiles_user').on(table.userId),
  widgetsIdx: index('idx_user_profiles_widgets').using('gin', table.dashboardWidgets).where(sql`jsonb_typeof(${table.dashboardWidgets}) = 'object'`),
}));

/**
 * API Keys Table
 * API authentication for Premium users (5 max per user)
 * Keys are bcrypt hashed, never stored in plaintext
 */
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  keyPrefix: text('key_prefix').notNull(),
  keyHash: text('key_hash').notNull(),
  name: text('name'),
  rateLimit: integer('rate_limit').notNull().default(500),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isRevoked: boolean('is_revoked').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('idx_api_keys_user').on(table.userId),
  prefixIdx: index('idx_api_keys_prefix').on(table.keyPrefix),
  activeIdx: index('idx_api_keys_active').on(table.userId).where(sql`${table.isRevoked} = FALSE AND (${table.expiresAt} IS NULL OR ${table.expiresAt} > NOW())`),
}));

/**
 * User Consent Table
 * GDPR consent tracking (5 consent types) with granular withdrawal
 * 1:1 relationship with users
 */
export const userConsent = pgTable('user_consent', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique(),
  newsletter: boolean('newsletter').notNull().default(false),
  pushNotifications: boolean('push_notifications').notNull().default(false),
  research: boolean('research').notNull().default(false),
  analytics: boolean('analytics').notNull().default(false),
  thirdParty: boolean('third_party').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userUnique: uniqueIndex('idx_user_consent_user').on(table.userId),
}));

/**
 * Users alias
 * Alias for userProfiles table for backwards compatibility and cleaner foreign key references
 */
export const users = userProfiles;
