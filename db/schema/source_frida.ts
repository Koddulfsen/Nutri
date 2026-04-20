/**
 * Danish FRIDA (Fødevaredatabanken) Staging Tables
 *
 * Purpose: Store imported FRIDA data for food search and nutrient lookup
 * Source: https://frida.fooddata.dk/
 * License: Open data
 *
 * Data: FRIDA 5.4 (May 2025)
 * - ~1,371 foods with Danish and English names
 * - 153 nutrients with EuroFIR codes
 * - ~137K content rows (long format)
 *
 * Key difference from other sources: compound_sources uses EuroFIR codes
 * (e.g., "PROT", "CA", "FE") as external_id, not integer IDs.
 * The eurofir_code column enables the join.
 *
 * Generated: 2026-02-07
 */

import { pgTable, uuid, text, real, integer, timestamp } from 'drizzle-orm/pg-core';

/**
 * FRIDA Foods
 * Stores food metadata with English and Danish names
 */
export const sourceFridaFoods = pgTable('source_frida_foods', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Primary identifier - FRIDA food ID (integer)
  foodId: integer('food_id').notNull().unique(),

  // Names
  name: text('name').notNull(), // English name
  nameDk: text('name_dk'), // Danish name (nullable)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * FRIDA Nutrients
 * Stores nutrient definitions from nutrients.json
 * 153 nutrients with EuroFIR codes for compound mapping
 */
export const sourceFridaNutrients = pgTable('source_frida_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Nutrient identifier - FRIDA integer ID
  nutrientId: integer('nutrient_id').notNull().unique(),

  // Names
  name: text('name').notNull(), // English name
  unit: text('unit').notNull(), // e.g., "g/100g", "mg/100g", "µg/100g"

  // EuroFIR code for compound_sources join
  eurofirCode: text('eurofir_code'), // e.g., "PROT", "CA", "FE" (nullable for unmapped nutrients)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * FRIDA Content
 * Stores nutrient values per food (long format)
 */
export const sourceFridaContent = pgTable('source_frida_content', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys (integer IDs matching FRIDA's native format)
  foodId: integer('food_id').notNull(), // Links to source_frida_foods
  nutrientId: integer('nutrient_id').notNull(), // Links to source_frida_nutrients

  // Value
  value: real('value'), // Nutrient amount per 100g (null = not measured)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Note: Indexes will be created in migration
// CREATE INDEX idx_frida_content_food_id ON source_frida_content(food_id);
// CREATE INDEX idx_frida_content_nutrient ON source_frida_content(nutrient_id);
// CREATE INDEX idx_frida_foods_name ON source_frida_foods USING gin(name gin_trgm_ops);
