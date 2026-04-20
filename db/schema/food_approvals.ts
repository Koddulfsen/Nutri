import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { foods } from './foods';
import { users } from './users';
import { approvalStatusEnum } from './multi_source_enums';

/**
 * Food Approvals Table
 * Manages approval workflow for community-added foods
 *
 * Flow:
 * 1. Non-auth user adds food → status: PENDING
 * 2. Auth user adds food → status: AUTO_APPROVED
 * 3. Admin reviews → status: APPROVED or REJECTED
 *
 * Note: Users can still USE pending foods, but they're flagged as "under review"
 */
export const foodApprovals = pgTable('food_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  foodId: uuid('food_id').notNull().references(() => foods.id, { onDelete: 'cascade' }),
  status: approvalStatusEnum('status').notNull().default('PENDING'),
  requestedBy: uuid('requested_by').references(() => users.userId, { onDelete: 'set null' }), // Null if anonymous
  reviewedBy: uuid('reviewed_by').references(() => users.userId, { onDelete: 'set null' }),
  reviewNotes: text('review_notes'), // Admin feedback
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
}, (table) => ({
  foodIdx: index('idx_food_approvals_food').on(table.foodId),
  statusIdx: index('idx_food_approvals_status').on(table.status),
  requesterIdx: index('idx_food_approvals_requester').on(table.requestedBy),
}));
