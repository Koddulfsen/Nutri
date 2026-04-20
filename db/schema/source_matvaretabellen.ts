/**
 * Norwegian Matvaretabellen Staging Tables
 *
 * Purpose: Store imported Matvaretabellen data for food search and nutrient lookup
 * Source: https://www.matvaretabellen.no/
 * License: Open data (Mattilsynet)
 *
 * Data: Matvaretabellen 2026
 * - ~2,121 foods with English names
 * - 57 nutrients with EuroFIR codes
 * - ~120K content rows (JSON format)
 *
 * Key difference from other sources: compound_sources uses EuroFIR codes
 * (e.g., "WATER", "FAT", "CA") as external_id. The eurofir_code column
 * in the nutrients table enables the join (same pattern as FRIDA).
 *
 * Food IDs are text (e.g., "06.178", "01.344").
 * Nutrient IDs are Norwegian text codes (e.g., "Vann", "Fett", "Ca").
 *
 * Generated: 2026-02-07
 */

import { pgTable, uuid, text, real, timestamp } from 'drizzle-orm/pg-core';

/**
 * Matvaretabellen Foods
 * Stores food metadata with English names
 */
export const sourceMatvaretabellenFoods = pgTable('source_matvaretabellen_foods', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Primary identifier - Matvaretabellen food ID (text, e.g., "06.178")
  foodId: text('food_id').notNull().unique(),

  // Names
  name: text('name').notNull(), // English name

  // Food group
  foodGroupId: text('food_group_id'), // Food group ID (nullable)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Matvaretabellen Nutrients
 * Stores nutrient definitions with Norwegian IDs and EuroFIR codes
 * 57 nutrients — EuroFIR codes join to compound_sources external_id
 */
export const sourceMatvaretabellenNutrients = pgTable('source_matvaretabellen_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Nutrient identifier - Norwegian ID (e.g., "Vann", "Fett", "Ca")
  nutrientId: text('nutrient_id').notNull().unique(),

  // Names
  name: text('name').notNull(), // English name
  unit: text('unit').notNull(), // e.g., "g", "mg", "µg", "RAE"

  // EuroFIR code for compound_sources join
  eurofirCode: text('eurofir_code'), // e.g., "WATER", "FAT", "CA" (nullable for unmapped nutrients)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Matvaretabellen Content
 * Stores nutrient values per food (long format, sparse)
 */
export const sourceMatvaretabellenContent = pgTable('source_matvaretabellen_content', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys (text IDs matching Matvaretabellen's native format)
  foodId: text('food_id').notNull(), // Links to source_matvaretabellen_foods
  nutrientId: text('nutrient_id').notNull(), // Links to source_matvaretabellen_nutrients

  // Value
  value: real('value'), // Nutrient amount per 100g (null = not measured)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Note: Indexes will be created in migration
// CREATE INDEX idx_matvaretabellen_content_food_id ON source_matvaretabellen_content(food_id);
// CREATE INDEX idx_matvaretabellen_content_nutrient ON source_matvaretabellen_content(nutrient_id);
// CREATE INDEX idx_matvaretabellen_foods_name ON source_matvaretabellen_foods USING gin(name gin_trgm_ops);
