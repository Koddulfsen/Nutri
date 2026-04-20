/**
 * Finnish Fineli Food Composition Database Staging Tables
 *
 * Purpose: Store imported Fineli data for food search and nutrient lookup
 * Source: https://fineli.fi/fineli/en/index
 * License: CC BY 4.0
 *
 * Data: Fineli Release 20
 * - ~4,200 foods with English names
 * - 75 nutrients (EuroFIR codes: ENERC, FAT, CA, etc.)
 * - ~300K nutrient values
 *
 * Generated: 2026-02-06
 */

import { pgTable, uuid, text, real, integer, timestamp } from 'drizzle-orm/pg-core';

/**
 * Fineli Foods
 * Stores food metadata with English names from foodname_EN.csv
 * and food groups from food.csv (FUCLASS column)
 */
export const sourceFineliFoods = pgTable('source_fineli_foods', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Primary identifier - FOODID from Fineli (integer)
  foodId: integer('food_id').notNull().unique(),

  // Names
  name: text('name').notNull(), // English name from foodname_EN.csv
  description: text('description'), // Finnish name from food.csv (FOODNAME)

  // Classification
  foodGroup: text('food_group'), // FUCLASS from food.csv

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Fineli Nutrients
 * Stores nutrient definitions from component.csv
 * 75 nutrients with EuroFIR codes (ENERC, FAT, CA, etc.)
 */
export const sourceFineliNutrients = pgTable('source_fineli_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Nutrient identifier - EuroFIR code matching compound_sources.external_id
  nutrientCode: text('nutrient_code').notNull().unique(),

  // Names
  name: text('name').notNull(), // EuroFIR code used as name (ENERC, FAT, etc.)
  unit: text('unit').notNull(), // e.g., "KJ", "G", "MG", "UG"

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Fineli Content
 * Stores nutrient values per food (long format, sparse)
 */
export const sourceFineliContent = pgTable('source_fineli_content', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys
  foodId: integer('food_id').notNull(), // Links to source_fineli_foods
  nutrientCode: text('nutrient_code').notNull(), // Links to source_fineli_nutrients

  // Value
  value: real('value'), // Nutrient amount per 100g (null = not measured)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Note: Indexes will be created in migration
// CREATE INDEX idx_fineli_content_food_id ON source_fineli_content(food_id);
// CREATE INDEX idx_fineli_content_nutrient ON source_fineli_content(nutrient_code);
// CREATE INDEX idx_fineli_foods_name ON source_fineli_foods USING gin(name gin_trgm_ops);
