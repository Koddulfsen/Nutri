/**
 * French CIQUAL Food Composition Database Staging Tables
 *
 * Purpose: Store imported CIQUAL data for food search and nutrient lookup
 * Source: https://ciqual.anses.fr/
 * License: Open data (Etalab)
 *
 * Data: CIQUAL 2025
 * - ~3,484 foods with English names
 * - 65 nutrients (CIQUAL integer codes: 327, 400, etc.)
 * - ~150K+ nutrient values
 *
 * Generated: 2026-02-07
 */

import { pgTable, uuid, text, real, integer, timestamp } from 'drizzle-orm/pg-core';

/**
 * CIQUAL Foods
 * Stores food metadata with English names from ciqual-2025-en.xlsx
 */
export const sourceCiqualFoods = pgTable('source_ciqual_foods', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Primary identifier - alim_code from CIQUAL (integer)
  foodId: integer('food_id').notNull().unique(),

  // Names
  name: text('name').notNull(), // English name (alim_nom_eng)
  description: text('description'), // Scientific name (alim_nom_sci)

  // Classification
  foodGroup: text('food_group'), // alim_grp_nom_eng

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * CIQUAL Nutrients
 * Stores nutrient definitions from nutrients.json
 * 65 nutrients with CIQUAL integer codes (327, 400, etc.)
 */
export const sourceCiqualNutrients = pgTable('source_ciqual_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Nutrient identifier - CIQUAL code as string matching compound_sources.external_id
  nutrientCode: text('nutrient_code').notNull().unique(),

  // Names
  name: text('name').notNull(), // Nutrient name from nutrients.json
  unit: text('unit').notNull(), // e.g., "g", "mg", "µg", "kJ", "kcal"

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * CIQUAL Content
 * Stores nutrient values per food (long format, sparse)
 */
export const sourceCiqualContent = pgTable('source_ciqual_content', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys
  foodId: integer('food_id').notNull(), // Links to source_ciqual_foods
  nutrientCode: text('nutrient_code').notNull(), // Links to source_ciqual_nutrients

  // Value
  value: real('value'), // Nutrient amount per 100g (null = not measured)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Note: Indexes will be created in migration
// CREATE INDEX idx_ciqual_content_food_id ON source_ciqual_content(food_id);
// CREATE INDEX idx_ciqual_content_nutrient ON source_ciqual_content(nutrient_code);
// CREATE INDEX idx_ciqual_foods_name ON source_ciqual_foods USING gin(name gin_trgm_ops);
