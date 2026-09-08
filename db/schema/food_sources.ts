import { pgTable, uuid, text, timestamp, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { foods } from './foods';
import { users } from './users';
import { apiSourceEnum } from './multi_source_enums';

/**
 * Composition entry for parent foods that aggregate multiple children
 * (Duke plant_parts, FooDB orig_food_name variants).
 * Stored as jsonb array on food_sources.composition.
 * Percents must sum to 100 across the array.
 */
export interface FoodSourceCompositionEntry {
  variant: string; // e.g. Duke plant_part "Leaf" or FooDB orig_food_name "Coriander, raw"
  percent: number; // 0 < percent <= 100
}

/**
 * Food Sources Table
 * Maps Nutri foods to external API food entries
 * Enables multi-source nutrient aggregation
 *
 * Example:
 * Food: "Chicken Breast, Raw"
 * Sources:
 *   - CNF: 5690 (Chicken, broiler, breast, meat only, raw)
 *   - FDC: 171477 (Chicken breast, raw, skinless)
 *   - FooDB: 1023 (Chicken breast)
 */
export const foodSources = pgTable('food_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  foodId: uuid('food_id').notNull().references(() => foods.id, { onDelete: 'cascade' }),
  apiSource: apiSourceEnum('api_source').notNull(),
  apiFoodId: text('api_food_id').notNull(), // External API's food ID
  apiFoodVariant: text('api_food_variant'), // Specific variant/preparation (e.g., FooDB orig_food_name) — used for single-variant selections
  composition: jsonb('composition').$type<FoodSourceCompositionEntry[]>(), // Multi-variant blend for parent foods (Duke plant_parts, FooDB variants). When set, apiFoodVariant is null.
  verifiedBy: uuid('verified_by').references(() => users.userId, { onDelete: 'set null' }), // References auth.users.id
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  foodIdx: index('idx_food_sources_food').on(table.foodId),
  apiIdx: index('idx_food_sources_api').on(table.apiSource),
  // Prevent duplicate mappings for same food + API combo
  uniqueMapping: uniqueIndex('idx_food_sources_unique').on(table.foodId, table.apiSource),
}));
