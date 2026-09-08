import { pgTable, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { auditActionEnum } from './enums';

/**
 * Audit Log Table
 * Append-only trail of security events.
 *
 * RETENTION: none is implemented. There is no expiry job, TTL, or partition drop
 * anywhere in the codebase, so rows accumulate indefinitely. This previously
 * claimed "6-year HIPAA retention compliance", which was wrong twice over: HIPAA
 * is US law and does not apply to an EEA controller, and under GDPR Art. 5(1)(e)
 * indefinite retention is a violation rather than a form of compliance.
 * See docs/AUDIT-2026-08-11.md (P9).
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
