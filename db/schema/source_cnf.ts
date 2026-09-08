/**
 * Canadian Nutrient File (CNF) Nutrient Catalog
 *
 * Purpose: Local catalog of CNF nutrient definitions for source-inspect search
 * Source: https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/nutrient-data/canadian-nutrient-file-2015-download-files.html
 *
 * Note: Like source_fdc_nutrients, this caches catalog only — CNF food/content
 * data is fetched live from the Health Canada API at runtime.
 */

import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const sourceCnfNutrients = pgTable('source_cnf_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),

  nutrientId: integer('nutrient_id').notNull().unique(),

  name: text('name').notNull(),
  unit: text('unit').notNull(),

  symbol: text('symbol'),
  tagname: text('tagname'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
