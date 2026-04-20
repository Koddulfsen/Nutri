import { pgTable, uuid, decimal, timestamp, index, text } from 'drizzle-orm/pg-core';
import { mergedNutrients } from './merged_nutrients';
import { apiSourceEnum } from './multi_source_enums';

/**
 * Nutrient Source Values Table
 * Stores individual nutrient values from each API source
 * Linked to merged_nutrients for transparency
 *
 * Example:
 * Merged Nutrient: Protein (23.5g average)
 * Source Values:
 *   - CNF: 23.2g (confidence: 1.0)
 *   - FDC: 23.8g (confidence: 0.95)
 *   - FooDB: 23.5g (confidence: 0.85)
 *
 * Allows users to see ALL sources and make informed decisions
 */
export const nutrientSourceValues = pgTable('nutrient_source_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  mergedNutrientId: uuid('merged_nutrient_id').notNull().references(() => mergedNutrients.id, { onDelete: 'cascade' }),
  apiSource: apiSourceEnum('api_source').notNull(),
  value: decimal('value', { precision: 15, scale: 4 }).notNull(),
  sourceUnit: text('source_unit'), // Original unit from source before conversion
  confidence: decimal('confidence', { precision: 3, scale: 2 }).default('1.0'), // 0.0-1.0 data quality score
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  mergedIdx: index('idx_nutrient_sources_merged').on(table.mergedNutrientId),
  apiIdx: index('idx_nutrient_sources_api').on(table.apiSource),
}));
