/**
 * ASEAN Food Composition Database Staging Tables
 *
 * Purpose: Store imported ASEANFOODS data for food search and nutrient lookup
 * Source: ASEAN Food Composition Database (ASEANFOODS)
 * Data: aseanfoods.txt — ~622 foods with 21 per-100g nutrients
 *
 * Food IDs are alphanumeric codes (e.g., "AAA29", "AAD45", "AAG115").
 * Nutrient codes are INFOODS tagnames (e.g., "WATER", "PROCNT", "CA").
 * These are used directly as compound_sources.external_id.
 *
 * Generated: 2026-02-10
 */

import { pgTable, uuid, text, real, timestamp } from 'drizzle-orm/pg-core';

/**
 * ASEANFOODS Foods
 * Stores food metadata with food codes and names
 */
export const sourceAseanfoodsFoods = pgTable('source_aseanfoods_foods', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Primary identifier - ASEANFOODS food code (text, e.g., "AAA29")
  foodId: text('food_id').notNull().unique(),

  // Names
  name: text('name').notNull(),

  // Food group (e.g., "Cereals and Products", "Vegetables and products")
  foodGroup: text('food_group'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * ASEANFOODS Nutrients
 * Stores nutrient definitions from nutrients.json
 * ~22 nutrients — codes join to compound_sources external_id
 */
export const sourceAseanfoodsNutrients = pgTable('source_aseanfoods_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Nutrient identifier - INFOODS tagname (e.g., "WATER", "PROCNT", "CA")
  nutrientCode: text('nutrient_code').notNull().unique(),

  // Names
  name: text('name').notNull(),
  unit: text('unit').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * ASEANFOODS Content
 * Stores nutrient values per food (long format, sparse)
 */
export const sourceAseanfoodsContent = pgTable('source_aseanfoods_content', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys (text IDs matching ASEANFOODS's native format)
  foodId: text('food_id').notNull(),
  nutrientCode: text('nutrient_code').notNull(),

  // Value
  value: real('value'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Note: Indexes will be created in migration
// CREATE INDEX idx_aseanfoods_content_food_id ON source_aseanfoods_content(food_id);
// CREATE INDEX idx_aseanfoods_content_nutrient ON source_aseanfoods_content(nutrient_code);
// CREATE INDEX idx_aseanfoods_foods_name ON source_aseanfoods_foods USING gin(name gin_trgm_ops);
