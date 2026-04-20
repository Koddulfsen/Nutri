import { pgTable, uuid, text, integer, timestamp, index, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Compound Groups Table
 * Hierarchical organization of compounds into groups and subgroups
 *
 * Example hierarchy:
 * - Vitamins (level 0)
 *   - Fat-Soluble Vitamins (level 1)
 *     - Vitamin A Forms (level 2)
 *   - Water-Soluble Vitamins (level 1)
 *     - B-Complex (level 2)
 * - Minerals (level 0)
 *   - Macro Minerals (level 1)
 *   - Trace Minerals (level 1)
 * - Fatty Acids (level 0)
 *   - Saturated (level 1)
 *   - Polyunsaturated (level 1)
 *     - Omega-3 (level 2)
 *     - Omega-6 (level 2)
 */
export const compoundGroups = pgTable('compound_groups', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Display name (e.g., "Fat-Soluble Vitamins", "B-Complex", "Omega-3")
  name: text('name').notNull(),

  // URL-friendly slug (e.g., "fat-soluble-vitamins", "b-complex", "omega-3")
  slug: text('slug').notNull().unique(),

  // Self-referential parent for hierarchy (null = root level)
  parentGroupId: uuid('parent_group_id').references((): any => compoundGroups.id, { onDelete: 'set null' }),

  // Hierarchy level (0 = root, 1 = first subgroup, etc.)
  // Denormalized for query performance
  level: integer('level').notNull().default(0),

  // Display order within parent group (for sorting)
  displayOrder: integer('display_order').notNull().default(0),

  // Optional description for UI tooltips
  description: text('description'),

  // Optional icon (emoji or icon name)
  icon: text('icon'),

  // Whether this group has a Daily Value (RDA/AI) and should show a progress bar
  hasDv: boolean('has_dv').notNull().default(false),

  // Compound type filters - which compound types belong to this group (e.g., ['VITAMIN', 'MINERAL'])
  compoundTypes: text('compound_types').array().default(sql`ARRAY[]::text[]`),

  // Specific compound names that belong to this group (for leaf groups with specific compounds)
  compoundNames: text('compound_names').array().default(sql`ARRAY[]::text[]`),

  // Representative compound name - the compound whose value shows on the group header
  representativeCompound: text('representative_compound'),

  // Materialized path for efficient ancestor queries (e.g., "vitamins/water-soluble/b-complex")
  // Denormalized for query performance
  path: text('path').notNull().default(''),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  parentIdx: index('idx_compound_groups_parent').on(table.parentGroupId),
  levelIdx: index('idx_compound_groups_level').on(table.level),
  pathIdx: index('idx_compound_groups_path').on(table.path),
  orderIdx: index('idx_compound_groups_order').on(table.parentGroupId, table.displayOrder),
}));
