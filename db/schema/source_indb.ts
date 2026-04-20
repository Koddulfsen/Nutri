/**
 * Indian INDB Staging Tables
 *
 * Purpose: Store imported INDB data for food search and nutrient lookup
 * Source: Indian Nutrient Database (INDB)
 * Data: INDB.xlsx — 1,014 foods with 39 per-100g nutrients
 *
 * Food IDs are alphanumeric codes (e.g., "ASC001", "BFP001", "OSR001").
 * Nutrient codes are column names from nutrients.json (e.g., "energy_kj", "protein_g").
 * These are used directly as compound_sources.external_id.
 *
 * Generated: 2026-02-10
 */

import { pgTable, uuid, text, real, timestamp } from 'drizzle-orm/pg-core';

/**
 * INDB Foods
 * Stores food metadata with food codes and names
 */
export const sourceIndbFoods = pgTable('source_indb_foods', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Primary identifier - INDB food code (text, e.g., "ASC001")
  foodId: text('food_id').notNull().unique(),

  // Names
  name: text('name').notNull(),

  // Food group (primarysource: asc_manual, bfp_manual, open_source_recipes)
  foodGroup: text('food_group'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * INDB Nutrients
 * Stores nutrient definitions from nutrients.json
 * ~39 nutrients — codes join to compound_sources external_id
 */
export const sourceIndbNutrients = pgTable('source_indb_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Nutrient identifier - column name (e.g., "energy_kj", "protein_g")
  nutrientCode: text('nutrient_code').notNull().unique(),

  // Names
  name: text('name').notNull(),
  unit: text('unit').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * INDB Content
 * Stores nutrient values per food (long format, sparse)
 */
export const sourceIndbContent = pgTable('source_indb_content', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys (text IDs matching INDB's native format)
  foodId: text('food_id').notNull(),
  nutrientCode: text('nutrient_code').notNull(),

  // Value
  value: real('value'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Note: Indexes will be created in migration
// CREATE INDEX idx_indb_content_food_id ON source_indb_content(food_id);
// CREATE INDEX idx_indb_content_nutrient ON source_indb_content(nutrient_code);
// CREATE INDEX idx_indb_foods_name ON source_indb_foods USING gin(name gin_trgm_ops);
