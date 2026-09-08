// GDPR Support Tables - FS-4 Security & Compliance System
// Created: 2025-11-10
// Purpose: Deletion requests and data export requests for GDPR compliance

import { pgTable, uuid, text, timestamp, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';

// Enums
export const deletionStatusEnum = pgEnum('deletion_status_enum', [
  'pending',
  'cancelled',
  'completed',
  'failed'
]);

export const exportStatusEnum = pgEnum('export_status_enum', [
  'pending',
  'processing',
  'completed',
  'failed'
]);

// Deletion Requests Table
export const deletionRequests = pgTable(
  'deletion_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // NOTE: no foreign key exists. The comment here used to claim one was "added in
    // migration SQL"; it never was, so deleting a user does NOT cascade to this
    // table. See docs/AUDIT-2026-08-11.md (P2).
    userId: uuid('user_id').notNull(),
    userEmail: text('user_email').notNull(), // Stored for post-deletion email
    status: deletionStatusEnum('status').notNull().default('pending'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    scheduledDeletionAt: timestamp('scheduled_deletion_at', { withTimezone: true }).notNull(),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    metadata: jsonb('metadata').notNull().default('{}'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    statusIdx: index('idx_deletion_requests_status').on(table.status),
    scheduledIdx: index('idx_deletion_requests_scheduled').on(table.scheduledDeletionAt),
    userIdIdx: index('idx_deletion_requests_user_id').on(table.userId)
  })
);

// Export Requests Table
export const exportRequests = pgTable(
  'export_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // NOTE: no foreign key exists. The comment here used to claim one was "added in
    // migration SQL"; it never was, so deleting a user does NOT cascade to this
    // table. See docs/AUDIT-2026-08-11.md (P2).
    userId: uuid('user_id').notNull(),
    userEmail: text('user_email').notNull(),
    status: exportStatusEnum('status').notNull().default('pending'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    downloadUrl: text('download_url'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    metadata: jsonb('metadata').notNull().default('{}'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    statusIdx: index('idx_export_requests_status').on(table.status),
    userIdIdx: index('idx_export_requests_user_id').on(table.userId)
  })
);

// Types
export type DeletionRequest = typeof deletionRequests.$inferSelect;
export type NewDeletionRequest = typeof deletionRequests.$inferInsert;
export type ExportRequest = typeof exportRequests.$inferSelect;
export type NewExportRequest = typeof exportRequests.$inferInsert;
