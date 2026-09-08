/**
 * USDA FoodData Central (FDC) Nutrient Catalog
 *
 * Purpose: Local catalog of FDC nutrient definitions for source-inspect search
 * Source: https://fdc.nal.usda.gov/download-datasets (nutrient.csv)
 *
 * Note: Unlike other source_<x> schemas, FDC food/content data is NOT stored
 * locally — it is fetched live from the FDC API at runtime. Only the nutrient
 * catalog is cached here so that the admin source-inspect tooling can search
 * against the same shape as our other 14 sources.
 */

import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const sourceFdcNutrients = pgTable('source_fdc_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),

  nutrientId: integer('nutrient_id').notNull().unique(),

  name: text('name').notNull(),
  unit: text('unit').notNull(),

  nutrientNbr: text('nutrient_nbr'),
  rank: integer('rank'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
