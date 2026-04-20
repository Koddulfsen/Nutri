/**
 * Dutch NEVO (Nederlands Voedingsstoffenbestand) Staging Tables
 *
 * Purpose: Store imported NEVO data for food search and nutrient lookup
 * Source: https://nevo-online.rivm.nl/
 * License: Open data (RIVM)
 *
 * Data: NEVO 2025 v9.0
 * - ~2,328 foods with Dutch and English names
 * - 142 nutrients with text codes (PROT, NA, F16:0)
 * - ~270K content rows (long format, pipe-delimited CSV)
 *
 * Key design: nutrient_code is text (e.g., "PROT", "NA", "F16:0") used
 * directly as external_id in compound_sources — no indirection needed.
 *
 * Generated: 2026-02-07
 */

import { pgTable, uuid, text, real, integer, timestamp } from 'drizzle-orm/pg-core';

/**
 * NEVO Foods
 * Stores food metadata with English and Dutch names
 */
export const sourceNevoFoods = pgTable('source_nevo_foods', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Primary identifier - NEVO food code (integer, 1–2328)
  foodId: integer('food_id').notNull().unique(),

  // Names
  name: text('name').notNull(), // English name
  nameNl: text('name_nl'), // Dutch name (nullable)

  // Food group
  foodGroup: text('food_group'), // English food group (nullable)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * NEVO Nutrients
 * Stores nutrient definitions with text codes
 * 142 nutrients — codes used directly as compound_sources external_id
 */
export const sourceNevoNutrients = pgTable('source_nevo_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Nutrient identifier - NEVO text code (PROT, NA, F16:0, etc.)
  nutrientCode: text('nutrient_code').notNull().unique(),

  // Names
  name: text('name').notNull(), // English name
  unit: text('unit').notNull(), // e.g., "g", "mg", "µg", "kcal"

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * NEVO Content
 * Stores nutrient values per food (long format, sparse)
 */
export const sourceNevoContent = pgTable('source_nevo_content', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys
  foodId: integer('food_id').notNull(), // Links to source_nevo_foods
  nutrientCode: text('nutrient_code').notNull(), // Links to source_nevo_nutrients

  // Value
  value: real('value'), // Nutrient amount per 100g (null = not measured)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Note: Indexes will be created in migration
// CREATE INDEX idx_nevo_content_food_id ON source_nevo_content(food_id);
// CREATE INDEX idx_nevo_content_nutrient ON source_nevo_content(nutrient_code);
// CREATE INDEX idx_nevo_foods_name ON source_nevo_foods USING gin(name gin_trgm_ops);
