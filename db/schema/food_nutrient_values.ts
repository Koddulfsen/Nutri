import { pgTable, uuid, text, decimal, integer, timestamp, jsonb, primaryKey, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { foods } from './foods';
import { compounds } from './compounds';

/**
 * Food Nutrient Values Table
 * Nutrient values with 4-layer confidence scoring
 * ~450K → 6.75M rows (Phase 2-5 growth)
 * Composite PK: (food_id, compound_id, source) for multi-source aggregation
 */
export const foodNutrientValues = pgTable('food_nutrient_values', {
  foodId: uuid('food_id').notNull().references(() => foods.id, { onDelete: 'cascade' }),
  compoundId: uuid('compound_id').notNull().references(() => compounds.id, { onDelete: 'restrict' }),
  source: text('source').notNull(),
  value: decimal('value', { precision: 12, scale: 6 }).notNull(),
  unit: text('unit').notNull(),
  confidenceL1: integer('confidence_l1').notNull(),
  confidenceL2: integer('confidence_l2'),
  confidenceL3: integer('confidence_l3'),
  confidenceL4: integer('confidence_l4'),
  confidenceFinal: integer('confidence_final').notNull(),
  cvPercentage: decimal('cv_percentage', { precision: 5, scale: 2 }),
  validationWarnings: jsonb('validation_warnings').notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.foodId, table.compoundId, table.source] }),
  compoundIdx: index('idx_food_nutrient_values_compound').on(table.compoundId),
  confidenceIdx: index('idx_food_nutrient_values_confidence').on(table.confidenceFinal),
  sourceIdx: index('idx_food_nutrient_values_source').on(table.source),
  warningsIdx: index('idx_food_nutrient_values_warnings').using('gin', table.validationWarnings),
  valueCheck: sql`CHECK (value >= 0)`,
  confidenceL1Check: sql`CHECK (confidence_l1 BETWEEN 0 AND 100)`,
  confidenceL2Check: sql`CHECK (confidence_l2 BETWEEN 0 AND 100 OR confidence_l2 IS NULL)`,
  confidenceL3Check: sql`CHECK (confidence_l3 BETWEEN 0 AND 100 OR confidence_l3 IS NULL)`,
  confidenceL4Check: sql`CHECK (confidence_l4 BETWEEN 0 AND 100 OR confidence_l4 IS NULL)`,
  confidenceFinalCheck: sql`CHECK (confidence_final BETWEEN 0 AND 100)`,
  cvCheck: sql`CHECK (cv_percentage >= 0 OR cv_percentage IS NULL)`,
}));
