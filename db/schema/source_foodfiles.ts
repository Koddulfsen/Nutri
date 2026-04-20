/**
 * New Zealand FOODfiles Staging Tables
 *
 * Purpose: Store imported FOODfiles data for food search and nutrient lookup
 * Source: Plant & Food Research / Ministry of Health (New Zealand)
 *
 * Data: FOODfiles 2024
 * - ~2,857 foods with text IDs (e.g., "A10001", "A1011")
 * - 434 nutrients with text codes (e.g., "WATER", "PROT", "F18D2CN6")
 * - ~571K content rows (long format, tilde-delimited)
 *
 * Key design: nutrient_code is text (e.g., "PROT", "NA", "F18D2CN6") used
 * directly as external_id in compound_sources — no indirection needed.
 * Same pattern as NEVO.
 *
 * Generated: 2026-02-07
 */

import { pgTable, uuid, text, real, timestamp } from 'drizzle-orm/pg-core';

/**
 * FOODfiles Foods
 * Stores food metadata with food names
 */
export const sourceFoodfilesFoods = pgTable('source_foodfiles_foods', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Primary identifier - FOODfiles food ID (text, e.g., "A10001")
  foodId: text('food_id').notNull().unique(),

  // Names
  name: text('name').notNull(), // Full food name
  shortName: text('short_name'), // Short food name (nullable)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * FOODfiles Nutrients
 * Stores nutrient definitions with text codes
 * 434 nutrients — codes used directly as compound_sources external_id
 */
export const sourceFoodfilesNutrients = pgTable('source_foodfiles_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Nutrient identifier - FOODfiles text code (PROT, NA, F18D2CN6, etc.)
  nutrientCode: text('nutrient_code').notNull().unique(),

  // Names
  name: text('name').notNull(), // Description
  unit: text('unit').notNull(), // e.g., "g", "mg", "µg", "kcal"

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * FOODfiles Content
 * Stores nutrient values per food (long format, sparse)
 */
export const sourceFoodfilesContent = pgTable('source_foodfiles_content', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys
  foodId: text('food_id').notNull(), // Links to source_foodfiles_foods
  nutrientCode: text('nutrient_code').notNull(), // Links to source_foodfiles_nutrients

  // Value
  value: real('value'), // Nutrient amount per 100g (null = not measured)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Note: Indexes will be created in migration
// CREATE INDEX idx_foodfiles_content_food_id ON source_foodfiles_content(food_id);
// CREATE INDEX idx_foodfiles_content_nutrient ON source_foodfiles_content(nutrient_code);
// CREATE INDEX idx_foodfiles_foods_name ON source_foodfiles_foods USING gin(name gin_trgm_ops);
