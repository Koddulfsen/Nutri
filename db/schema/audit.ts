import { pgTable, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { auditActionEnum } from './enums';

/**
 * Audit Log Table
 * 6-year HIPAA retention compliance trail logging all security events
 * INSERT-only table (no UPDATE/DELETE to preserve integrity)
 */
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  action: auditActionEnum('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: uuid('resource_id'),
  metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userTimeIdx: index('idx_audit_log_user_time').on(table.userId, table.createdAt.desc()).where(sql`${table.userId} IS NOT NULL`),
  actionIdx: index('idx_audit_log_action').on(table.action),
  resourceIdx: index('idx_audit_log_resource').on(table.resourceType, table.resourceId),
  createdIdx: index('idx_audit_log_created').on(table.createdAt.desc()),
  metadataIdx: index('idx_audit_log_metadata').using('gin', table.metadata).where(sql`jsonb_typeof(${table.metadata}) = 'object'`),
}));
