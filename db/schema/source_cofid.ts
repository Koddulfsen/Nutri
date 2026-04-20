/**
 * UK CoFID (Composition of Foods Integrated Dataset) Staging Tables
 *
 * Purpose: Store imported CoFID data for food search and nutrient lookup
 * Source: https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid
 * License: Open Government Licence
 *
 * Data: CoFID 2021 (McCance and Widdowson's)
 * - ~3,000 foods across 15 sheets
 * - 280 nutrients (proximates, minerals, vitamins, fatty acids, phytosterols, organic acids)
 *
 * Generated: 2026-02-06
 */

import { pgTable, uuid, text, real, timestamp } from 'drizzle-orm/pg-core';

/**
 * CoFID Foods
 * Stores food metadata from all data sheets
 */
export const sourceCofidFoods = pgTable('source_cofid_foods', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Primary identifier - "Food Code" column in the Excel
  foodCode: text('food_code').notNull().unique(),

  // Names
  name: text('name').notNull(), // "Food Name"
  description: text('description'), // "Description"

  // Classification
  foodGroup: text('food_group'), // Group/category if available

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * CoFID Nutrients
 * Stores nutrient definitions from nutrients.json
 * 280 nutrients with text-based codes (WATER, PROT, etc.)
 */
export const sourceCofidNutrients = pgTable('source_cofid_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Nutrient identifier - text code matching compound_sources external_id
  nutrientCode: text('nutrient_code').notNull().unique(),

  // Names
  name: text('name').notNull(), // e.g., "Water", "Protein"
  unit: text('unit').notNull(), // e.g., "g", "mg", "µg", "kcal"

  // Classification
  sheet: text('sheet'), // Which Excel sheet (e.g., "1.3 Proximates")
  columnName: text('column_name'), // Original Excel column header

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * CoFID Content
 * Stores nutrient values per food (long format, sparse)
 */
export const sourceCofidContent = pgTable('source_cofid_content', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys
  foodCode: text('food_code').notNull(), // Links to source_cofid_foods
  nutrientCode: text('nutrient_code').notNull(), // Links to source_cofid_nutrients

  // Value
  value: real('value'), // Nutrient amount per 100g (null = not measured)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Note: Indexes will be created in migration
// CREATE INDEX idx_cofid_content_food_code ON source_cofid_content(food_code);
// CREATE INDEX idx_cofid_content_nutrient ON source_cofid_content(nutrient_code);
// CREATE INDEX idx_cofid_foods_name ON source_cofid_foods USING gin(name gin_trgm_ops);
