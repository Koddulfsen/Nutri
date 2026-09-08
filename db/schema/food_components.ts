import { pgTable, uuid, text, decimal, integer, timestamp, index, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { foods } from './foods';

/**
 * Food Components Table
 *
 * Recipe decomposition for composite foods.
 *
 * A composite food (`foods.isComposite = true`) can store its ingredient breakdown
 * here as one row per component. Components reference any food (atom or another
 * composite — recursion is allowed and resolves bottom-out at atoms).
 *
 * Compound expansion behavior:
 *  - Composite WITH components → recursively resolve to atoms, sum compound profiles
 *    weighted by component grams.
 *  - Composite WITHOUT components → fall back to its own stored nutrient values
 *    (the legacy single-row-with-measured-nutrients path used by USDA FDC composites).
 *
 * `grams` is canonical: components store mass, not volume or pieces. The recipe is
 * a relative breakdown — when a meal logs N grams of the composite, expansion
 * scales each component proportionally.
 */
export const foodComponents = pgTable('food_components', {
  id: uuid('id').primaryKey().defaultRandom(),

  // The composite this row belongs to. Cascade delete: deleting a composite removes its components.
  compositeFoodId: uuid('composite_food_id').notNull().references(() => foods.id, { onDelete: 'cascade' }),

  // The food that makes up this part of the recipe. Restrict delete: protect against
  // accidentally orphaning a composite by deleting an underlying atom.
  componentFoodId: uuid('component_food_id').notNull().references(() => foods.id, { onDelete: 'restrict' }),

  // Mass contribution of this component to the composite recipe (relative weights).
  grams: decimal('grams', { precision: 10, scale: 2 }).notNull(),

  // Display order within the composite.
  position: integer('position').notNull().default(0),

  // Optional free-form note (e.g., "estimated", "label says ~10%").
  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  compositeIdx: index('idx_food_components_composite').on(table.compositeFoodId),
  componentIdx: index('idx_food_components_component').on(table.componentFoodId),
  compositePositionIdx: uniqueIndex('idx_food_components_composite_position').on(table.compositeFoodId, table.position),
  gramsCheck: check('food_components_grams_positive', sql`${table.grams} > 0`),
  noSelfRefCheck: check('food_components_no_self_reference', sql`${table.compositeFoodId} <> ${table.componentFoodId}`),
}));
