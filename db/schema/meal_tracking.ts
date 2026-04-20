import { pgTable, uuid, text, date, timestamp, boolean, integer, jsonb, primaryKey, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { userProfiles } from './users';
import { foods } from './foods';

/**
 * Favorite Foods Table
 * Junction table for user-favorited foods
 * ~50K → 1M favorites (Phase 2-5 growth)
 */
export const favoriteFoods = pgTable('favorite_foods', {
  userId: uuid('user_id').notNull().references(() => userProfiles.userId, { onDelete: 'cascade' }),
  foodId: uuid('food_id').notNull().references(() => foods.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.foodId] }),
  foodIdx: index('idx_favorite_foods_food').on(table.foodId),
}));

/**
 * Saved Meal Templates Table
 * Saved meal combinations for one-tap logging
 * ~30K → 600K templates (Phase 2-5 growth)
 */
export const savedMealTemplates = pgTable('saved_meal_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.userId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  foods: jsonb('foods').notNull(),
  useCount: integer('use_count').notNull().default(0),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
}, (table) => ({
  userActiveIdx: index('idx_saved_templates_user_active').on(table.userId, table.isActive).where(sql`${table.isActive} = TRUE`),
  userUsageIdx: index('idx_saved_templates_user_usage').on(table.userId, table.useCount),
  foodsIdx: index('idx_saved_templates_foods').using('gin', table.foods),
  useCountCheck: sql`CHECK (use_count >= 0)`,
}));

/**
 * Daily Totals Table
 * Aggregated daily compound totals
 * ~3.65M → 73M rows (Phase 2-5 growth)
 */
export const dailyTotals = pgTable('daily_totals', {
  userId: uuid('user_id').notNull().references(() => userProfiles.userId, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  compounds: jsonb('compounds').notNull().default(sql`'{}'::jsonb`),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull().defaultNow(),
  cacheKey: text('cache_key'),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.date] }),
  userDateDescIdx: index('idx_daily_totals_user_date_desc').on(table.userId, table.date),
  compoundsIdx: index('idx_daily_totals_compounds').using('gin', table.compounds),
}));

/**
 * Cooking Contexts Table
 * Reusable cooking method definitions (dormant Phase 2, activated Phase 5)
 * ~50 rows (predefined cooking methods)
 */
export const cookingContexts = pgTable('cooking_contexts', {
  id: uuid('id').primaryKey().defaultRandom(),
  method: text('method').notNull().unique(),
  intensity: text('intensity'),
  temperatureRange: text('temperature_range'),
  durationRange: text('duration_range'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  methodIdx: index('idx_cooking_contexts_method').on(table.method),
}));

/**
 * Quarantine Imports Table
 * Data quality review queue for failed validations
 * ~1K rows (failed USDA imports)
 */
export const quarantineImports = pgTable('quarantine_imports', {
  id: uuid('id').primaryKey().defaultRandom(),
  foodId: uuid('food_id').references(() => foods.id, { onDelete: 'cascade' }),
  foodData: jsonb('food_data').notNull(),
  validationErrors: jsonb('validation_errors').notNull(),
  status: text('status').notNull().default('pending'),
  severity: text('severity').notNull(),
  reviewerId: uuid('reviewer_id').references(() => userProfiles.userId, { onDelete: 'set null' }),
  reviewerNotes: text('reviewer_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
}, (table) => ({
  statusIdx: index('idx_quarantine_status').on(table.status, table.createdAt),
  severityIdx: index('idx_quarantine_severity').on(table.severity),
  foodIdx: index('idx_quarantine_food').on(table.foodId).where(sql`${table.foodId} IS NOT NULL`),
  reviewerIdx: index('idx_quarantine_reviewer').on(table.reviewerId).where(sql`${table.reviewerId} IS NOT NULL`),
}));

/**
 * Manual Review Queue Table
 * General manual curation queue (CV >30%, synthesis failures, user flags)
 * ~2K rows (high-variance nutrient values, AI synthesis failures)
 */
export const manualReviewQueue = pgTable('manual_review_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemType: text('item_type').notNull(),
  itemId: uuid('item_id').notNull(),
  priority: integer('priority').notNull().default(5),
  context: jsonb('context').notNull().default(sql`'{}'::jsonb`),
  aiAttempts: jsonb('ai_attempts').notNull().default(sql`'[]'::jsonb`),
  status: text('status').notNull().default('pending'),
  assignedTo: uuid('assigned_to').references(() => userProfiles.userId, { onDelete: 'set null' }),
  curatorNotes: text('curator_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
}, (table) => ({
  queueIdx: index('idx_manual_review_queue').on(table.status, table.priority, table.createdAt),
  itemIdx: index('idx_manual_review_item').on(table.itemType, table.itemId),
  assignedIdx: index('idx_manual_review_assigned').on(table.assignedTo).where(sql`${table.assignedTo} IS NOT NULL`),
  priorityCheck: sql`CHECK (priority BETWEEN 1 AND 10)`,
}));

/**
 * AG UI Logs Table
 * AI parsing logs with 90-day retention
 * ~50K → 1M rows (rolling retention)
 */
export const agUiLogs = pgTable('ag_ui_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.userId, { onDelete: 'cascade' }),
  rawInput: text('raw_input').notNull(),
  parsedOutput: jsonb('parsed_output'),
  modelUsed: text('model_used').notNull(),
  confidence: integer('confidence'),
  parseSuccess: boolean('parse_success').notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('idx_ag_ui_logs_user').on(table.userId, table.createdAt),
  createdIdx: index('idx_ag_ui_logs_created').on(table.createdAt),
  successIdx: index('idx_ag_ui_logs_success').on(table.parseSuccess),
  confidenceCheck: sql`CHECK (confidence BETWEEN 0 AND 100 OR confidence IS NULL)`,
}));
