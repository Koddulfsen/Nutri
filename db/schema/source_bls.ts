/**
 * German BLS (Bundeslebensmittelschlüssel) Staging Tables
 *
 * Purpose: Store imported BLS data for food search and nutrient lookup
 * Source: https://www.blsdb.de/
 * License: Restricted (purchased dataset)
 *
 * Data: BLS 4.0 (2025)
 * - ~7,140 foods with German and English names
 * - 138 nutrients (triplet column layout: value, origin, reference)
 * - 7-character alphanumeric food codes (e.g., C131000)
 *
 * Generated: 2026-02-07
 */

import { pgTable, uuid, text, real, timestamp } from 'drizzle-orm/pg-core';

/**
 * BLS Foods
 * Stores food metadata with English and German names
 */
export const sourceBlsFoods = pgTable('source_bls_foods', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Primary identifier - BLS food code (text, e.g., "C131000")
  foodCode: text('food_code').notNull().unique(),

  // Names
  name: text('name').notNull(), // English name
  nameDe: text('name_de'), // German name (nullable)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * BLS Nutrients
 * Stores nutrient definitions from nutrients.json
 * 131 nutrients with text-based codes (WATER, PROT625, etc.)
 */
export const sourceBlsNutrients = pgTable('source_bls_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Nutrient identifier - BLS code matching compound_sources external_id
  nutrientCode: text('nutrient_code').notNull().unique(),

  // Names
  name: text('name').notNull(), // English name
  unit: text('unit').notNull(), // e.g., "g", "mg", "µg", "kcal"

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * BLS Content
 * Stores nutrient values per food (long format, sparse)
 */
export const sourceBlsContent = pgTable('source_bls_content', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys
  foodCode: text('food_code').notNull(), // Links to source_bls_foods
  nutrientCode: text('nutrient_code').notNull(), // Links to source_bls_nutrients

  // Value
  value: real('value'), // Nutrient amount per 100g (null = not measured)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Note: Indexes will be created in migration
// CREATE INDEX idx_bls_content_food_code ON source_bls_content(food_code);
// CREATE INDEX idx_bls_content_nutrient ON source_bls_content(nutrient_code);
// CREATE INDEX idx_bls_foods_name ON source_bls_foods USING gin(name gin_trgm_ops);
