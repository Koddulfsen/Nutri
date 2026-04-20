/**
 * AFCD (Australian Food Composition Database) Staging Tables
 *
 * Purpose: Store imported AFCD data for food search and nutrient lookup
 * Source: https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd
 * License: CC BY 4.0 (commercial use allowed with attribution)
 *
 * Data: Release 3 (2025)
 * - 1,588 foods
 * - 268 nutrients (58 core + 210 extended)
 *
 * Generated: 2026-01-22
 */

import { pgTable, uuid, text, real, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

/**
 * AFCD Foods
 * Stores food metadata from "Food Details" sheet
 */
export const sourceAfcdFoods = pgTable('source_afcd_foods', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Primary identifier
  afcdFoodKey: text('afcd_food_key').notNull().unique(), // e.g., "F002258"

  // Classification
  classification: text('classification'), // Food group code
  derivation: text('derivation'), // "Analysed", "Borrowed", "Calculated", etc.

  // Names
  name: text('name').notNull(), // Food Name
  description: text('description'), // Food Description

  // Metadata
  samplingDetails: text('sampling_details'), // Notes on data source
  nitrogenFactor: real('nitrogen_factor'), // For protein calculation
  fatFactor: real('fat_factor'), // For fat calculation
  specificGravity: real('specific_gravity'), // Density factor
  analysedPortion: text('analysed_portion'), // e.g., "100%"
  unanalysedPortion: text('unanalysed_portion'), // e.g., "0%"

  // Raw JSON for future use
  rawData: text('raw_data'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * AFCD Nutrients
 * Stores nutrient definitions from "Nutrient Details" sheets
 * 268 nutrients with international standard identifiers
 */
export const sourceAfcdNutrients = pgTable('source_afcd_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Nutrient identifier (column index in nutrient profiles)
  nutrientIndex: integer('nutrient_index').notNull().unique(),

  // Names
  name: text('name').notNull(), // e.g., "Energy with dietary fibre, equated"
  unit: text('unit').notNull(), // e.g., "kJ", "g", "mg", "ug"

  // International standard identifiers
  infoodsTagname: text('infoods_tagname'), // e.g., "ENERC", "PROCNT"
  eurofirName: text('eurofir_name'), // EuroFIR component name

  // Classification
  category: text('category'), // "Proximates", "Vitamins", "Minerals", etc.
  isCore: boolean('is_core').default(false), // Part of 58 core nutrients

  // Metadata
  description: text('description'),
  equation: text('equation'), // For calculated nutrients
  reportingLimit: real('reporting_limit'), // Detection limit per 100g

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * AFCD Content
 * Stores nutrient values per food (long format)
 * ~425,000 rows (1,588 foods × 268 nutrients, sparse)
 */
export const sourceAfcdContent = pgTable('source_afcd_content', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys
  afcdFoodKey: text('afcd_food_key').notNull(), // Links to source_afcd_foods
  nutrientIndex: integer('nutrient_index').notNull(), // Links to source_afcd_nutrients

  // Value
  value: real('value'), // Nutrient amount (null = not measured/reported)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Note: Indexes will be created in migration
// CREATE INDEX idx_afcd_content_food_key ON source_afcd_content(afcd_food_key);
// CREATE INDEX idx_afcd_content_nutrient ON source_afcd_content(nutrient_index);
// CREATE INDEX idx_afcd_foods_name ON source_afcd_foods USING gin(name gin_trgm_ops);
