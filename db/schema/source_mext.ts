/**
 * Japanese MEXT Staging Tables
 *
 * Purpose: Store imported MEXT data for food search and nutrient lookup
 * Source: Ministry of Education, Culture, Sports, Science and Technology (Japan)
 * Data: Standard Tables of Food Composition in Japan - 8th Edition
 *
 * Data: 3 Excel files (main composition, amino acids, fatty acids)
 * - ~2,478 foods with Japanese names
 * - ~131 nutrients with INFOODS component codes
 * - ~200-300K content rows (pivoted from wide format)
 *
 * Key difference from other sources: Data comes in wide-format Excel
 * (nutrients as columns) requiring pivot to long format during import.
 * MEXT nutrient codes (e.g., ENERC_KCAL, F18D2N6) are used directly
 * as compound_sources.external_id.
 *
 * Food IDs are 5-digit text with leading zeros (e.g., "01001").
 *
 * Generated: 2026-02-07
 */

import { pgTable, uuid, text, real, timestamp } from 'drizzle-orm/pg-core';

/**
 * MEXT Foods
 * Stores food metadata with Japanese names
 */
export const sourceMextFoods = pgTable('source_mext_foods', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Primary identifier - MEXT food ID (text, e.g., "01001")
  foodId: text('food_id').notNull().unique(),

  // Names
  name: text('name').notNull(), // Japanese name
  nameEn: text('name_en'), // English name

  // Food group
  foodGroup: text('food_group'), // Food group name (nullable)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * MEXT Nutrients
 * Stores nutrient definitions with INFOODS component codes
 * ~131 nutrients — codes join to compound_sources external_id
 */
export const sourceMextNutrients = pgTable('source_mext_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Nutrient identifier - INFOODS code (e.g., "ENERC_KCAL", "F18D2N6")
  nutrientCode: text('nutrient_code').notNull().unique(),

  // Names
  name: text('name').notNull(), // Japanese name or code label
  unit: text('unit').notNull(), // e.g., "g", "mg", "µg", "kcal", "kJ"

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * MEXT Content
 * Stores nutrient values per food (long format, sparse)
 */
export const sourceMextContent = pgTable('source_mext_content', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys (text IDs matching MEXT's native format)
  foodId: text('food_id').notNull(), // Links to source_mext_foods
  nutrientCode: text('nutrient_code').notNull(), // Links to source_mext_nutrients

  // Value
  value: real('value'), // Nutrient amount per 100g (null = not measured)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Note: Indexes will be created in migration
// CREATE INDEX idx_mext_content_food_id ON source_mext_content(food_id);
// CREATE INDEX idx_mext_content_nutrient ON source_mext_content(nutrient_code);
// CREATE INDEX idx_mext_foods_name ON source_mext_foods USING gin(name gin_trgm_ops);
