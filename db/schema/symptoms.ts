import { pgTable, pgEnum, uuid, text, integer, boolean, timestamp, date, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { userProfiles } from './users';

/**
 * Symptom Category Enum
 * Three main categories for organizing symptoms
 */
export const symptomCategoryEnum = pgEnum('symptom_category_enum', [
  'ENERGY_MENTAL',
  'DIGESTIVE',
  'PHYSICAL',
]);

/**
 * Symptom Definitions Table
 * Predefined symptoms (system-defined) + user custom symptoms
 *
 * System-defined: userId is NULL, isSystemDefined is TRUE
 * User custom: userId references the user, isSystemDefined is FALSE
 */
export const symptomDefinitions = pgTable('symptom_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  category: symptomCategoryEnum('category').notNull(),
  description: text('description'),
  icon: text('icon'), // Emoji icon for display

  // User custom symptoms
  userId: uuid('user_id').references(() => userProfiles.userId, { onDelete: 'cascade' }),
  isSystemDefined: boolean('is_system_defined').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),

  // Ordering
  sortOrder: integer('sort_order').notNull().default(0),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Unique slug per user (NULL userId = system, non-NULL = user custom)
  slugUserUnique: uniqueIndex('idx_symptom_definitions_slug_user')
    .on(table.slug, table.userId),
  categoryIdx: index('idx_symptom_definitions_category')
    .on(table.category),
  userIdx: index('idx_symptom_definitions_user')
    .on(table.userId)
    .where(sql`${table.userId} IS NOT NULL`),
  activeIdx: index('idx_symptom_definitions_active')
    .on(table.isActive)
    .where(sql`${table.isActive} = TRUE`),
  systemIdx: index('idx_symptom_definitions_system')
    .on(table.isSystemDefined)
    .where(sql`${table.isSystemDefined} = TRUE`),
}));

/**
 * Symptom Logs Table
 * User symptom entries tied to dates
 * Pattern: Same as mealLogs with (userId, date) for daily tracking
 */
export const symptomLogs = pgTable('symptom_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.userId, { onDelete: 'cascade' }),
  symptomDefinitionId: uuid('symptom_definition_id').notNull().references(() => symptomDefinitions.id, { onDelete: 'restrict' }),
  date: date('date').notNull(),

  // Intensity: 1-10 scale
  intensity: integer('intensity').notNull(),

  // Optional notes
  notes: text('notes'),

  // Soft delete
  isActive: boolean('is_active').notNull().default(true),

  // Timestamps
  loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userDateIdx: index('idx_symptom_logs_user_date')
    .on(table.userId, table.date),
  symptomIdx: index('idx_symptom_logs_symptom')
    .on(table.symptomDefinitionId),
  userLoggedIdx: index('idx_symptom_logs_user_logged')
    .on(table.userId, table.loggedAt),
  activeIdx: index('idx_symptom_logs_active')
    .on(table.userId, table.isActive)
    .where(sql`${table.isActive} = TRUE`),
}));

// Type exports for use in application code
export type SymptomDefinition = typeof symptomDefinitions.$inferSelect;
export type NewSymptomDefinition = typeof symptomDefinitions.$inferInsert;
export type SymptomLog = typeof symptomLogs.$inferSelect;
export type NewSymptomLog = typeof symptomLogs.$inferInsert;
export type SymptomCategory = 'ENERGY_MENTAL' | 'DIGESTIVE' | 'PHYSICAL';
