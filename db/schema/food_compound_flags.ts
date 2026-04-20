import { pgTable, uuid, text, real, timestamp, index } from 'drizzle-orm/pg-core';
import { riskLevelEnum } from './enums';
import { foods } from './foods';
import { compounds } from './compounds';

/**
 * Food Compound Flags Table
 * Risk-based flagging system for safety compounds (mycotoxins, pesticides, heavy metals, plasticizers)
 * Used when precise values unavailable - shows risk levels instead of exact measurements
 *
 * Example: "⚠️ Aflatoxin Risk: Peanuts (HIGH), Corn (MODERATE)"
 * ~500-1,000 rows (50 safety compounds × 10-20 high-risk foods each)
 */
export const foodCompoundFlags = pgTable('food_compound_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  foodId: uuid('food_id').notNull().references(() => foods.id, { onDelete: 'cascade' }),
  compoundId: uuid('compound_id').notNull().references(() => compounds.id, { onDelete: 'restrict' }),
  riskLevel: riskLevelEnum('risk_level').notNull(),
  detectionFrequency: real('detection_frequency'), // 0.0-1.0 (e.g., 0.42 = 42% of samples test positive)
  source: text('source').notNull(), // e.g., 'FDA_PDP_2023', 'WHO_MYCOTOXIN_2024', 'USDA_TDS_2023'
  notes: text('notes'), // Additional context like "Conventional farming only" or "Canned foods primary risk"
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  foodIdx: index('idx_food_compound_flags_food').on(table.foodId),
  compoundIdx: index('idx_food_compound_flags_compound').on(table.compoundId),
  riskIdx: index('idx_food_compound_flags_risk').on(table.riskLevel),
}));
