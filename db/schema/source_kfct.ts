/**
 * Korean KFCT Staging Tables
 *
 * Purpose: Store imported KFCT data for food search and nutrient lookup
 * Source: Rural Development Administration (Korea)
 * Data: Korean Food Composition Table - 9th Revision
 *
 * Data: 2 PDF volumes (proximates + minerals/vitamins)
 * - ~3,000 foods with Korean/English names
 * - ~44 nutrients with INFOODS component codes
 * - ~132,000 content rows
 *
 * Key difference from other sources: Data comes from linearized PDF text
 * (pdftotext output) requiring a state-machine parser.
 * KFCT nutrient codes (INFOODS tagnames e.g., ENERC, CA, RETOL) are used
 * directly as compound_sources.external_id.
 *
 * Food IDs are alphanumeric codes (e.g., "A001001A010a", "K0070030000a").
 *
 * Generated: 2026-02-08
 */

import { pgTable, uuid, text, real, timestamp } from 'drizzle-orm/pg-core';

/**
 * KFCT Foods
 * Stores food metadata with Korean/English names
 */
export const sourceKfctFoods = pgTable('source_kfct_foods', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Primary identifier - KFCT food code (text, e.g., "A001001A010a")
  foodId: text('food_id').notNull().unique(),

  // Names
  name: text('name').notNull(), // Korean name
  nameEn: text('name_en'), // English name (extracted from KFCT PDF)

  // Food group
  foodGroup: text('food_group'), // Food group name (nullable)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * KFCT Nutrients
 * Stores nutrient definitions with INFOODS component codes
 * ~44 nutrients — codes join to compound_sources external_id
 */
export const sourceKfctNutrients = pgTable('source_kfct_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Nutrient identifier - INFOODS code (e.g., "ENERC", "CA", "RETOL")
  nutrientCode: text('nutrient_code').notNull().unique(),

  // Names
  name: text('name').notNull(), // English name or code label
  unit: text('unit').notNull(), // e.g., "g", "mg", "µg", "kcal"

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * KFCT Content
 * Stores nutrient values per food (long format, sparse)
 */
export const sourceKfctContent = pgTable('source_kfct_content', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys (text IDs matching KFCT's native format)
  foodId: text('food_id').notNull(), // Links to source_kfct_foods
  nutrientCode: text('nutrient_code').notNull(), // Links to source_kfct_nutrients

  // Value
  value: real('value'), // Nutrient amount per 100g (null = not measured)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Note: Indexes will be created in migration
// CREATE INDEX idx_kfct_content_food_id ON source_kfct_content(food_id);
// CREATE INDEX idx_kfct_content_nutrient ON source_kfct_content(nutrient_code);
// CREATE INDEX idx_kfct_foods_name ON source_kfct_foods USING gin(name gin_trgm_ops);
