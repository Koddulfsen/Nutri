// Data Access Layer: Audit Log Queries - FS-4 Security & Compliance System
// Created: 2025-11-10
// Purpose: Read-only access to user's audit trail with pagination

import { db } from '@/db';
import { auditLog } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import type { AuditAction } from '@/lib/security/audit-logger';

/**
 * Audit Log Entry Type (inferred from schema)
 */
export type AuditLogEntry = typeof auditLog.$inferSelect;

/**
 * Pagination Options for Audit Log Queries
 */
export interface AuditLogPaginationOptions {
  page?: number; // Default: 1
  limit?: number; // Default: 100, max: 500
  action?: AuditAction; // Filter by action type
  resourceType?: string; // Filter by resource type
  startDate?: Date; // Filter by date range (inclusive)
  endDate?: Date; // Filter by date range (inclusive)
}

/**
 * Paginated Audit Log Response
 */
export interface AuditLogPage {
  logs: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Require Authentication
 *
 * Helper function to get authenticated user from Supabase session.
 *
 * @throws Error if user is not authenticated
 * @returns User ID from authenticated session
 */
async function requireAuth(): Promise<string> {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.user) {
    throw new Error('Unauthorized: User must be authenticated');
  }

  return session.user.id;
}

/**
 * Get Audit Logs
 *
 * Retrieves paginated audit logs for authenticated user.
 *
 * HIPAA COMPLIANCE:
 * - 6-year retention enforced at database level
 * - User can view their own audit trail
 * - RLS enforces user_id = auth.uid()
 *
 * PERFORMANCE:
 * - Uses composite index: idx_audit_log_user_time (user_id, created_at DESC)
 * - Query time: <100ms for single user (p95)
 * - Pagination prevents large result sets
 *
 * SECURITY LAYERS:
 * - Layer 1: Authentication check
 * - Layer 2: Authorization check (userId matches session)
 * - Layer 3: RLS policy enforcement (database-level)
 * - NOTE: Audit log reads are NOT logged (would create infinite loop)
 *
 * @param userId - User ID to retrieve logs for
 * @param options - Pagination and filtering options
 * @returns Paginated audit log entries
 * @throws Error if unauthorized
 *
 * @example
 * const { logs, pagination } = await getAuditLogs('user-123', {
 *   page: 1,
 *   limit: 100,
 *   action: 'CONSENT_CHANGE',
 *   startDate: new Date('2025-01-01')
 * });
 *
 * console.log(`Showing ${logs.length} of ${pagination.total} entries`);
 * if (pagination.hasMore) {
 *   // Load next page
 * }
 */
export async function getAuditLogs(
  userId: string,
  options: AuditLogPaginationOptions = {}
): Promise<AuditLogPage> {
  // Verify authentication and authorization
  const sessionUserId = await requireAuth();
  if (sessionUserId !== userId) {
    throw new Error('Unauthorized: Cannot access another user\'s audit logs');
  }

  // Parse pagination options with defaults and limits
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(500, Math.max(1, options.limit || 100)); // Max 500, default 100
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [eq(auditLog.userId, userId)];

  // Filter by action type if provided
  if (options.action) {
    conditions.push(eq(auditLog.action, options.action));
  }

  // Filter by resource type if provided
  if (options.resourceType) {
    conditions.push(eq(auditLog.resourceType, options.resourceType));
  }

  // Filter by date range if provided
  if (options.startDate) {
    conditions.push(gte(auditLog.createdAt, options.startDate));
  }
  if (options.endDate) {
    conditions.push(lte(auditLog.createdAt, options.endDate));
  }

  // Execute query with pagination
  // Uses composite index: idx_audit_log_user_time for fast queries
  const logs = await db.query.auditLog.findMany({
    where: and(...conditions),
    orderBy: [desc(auditLog.createdAt)], // Most recent first
    limit: limit,
    offset: offset
  });

  // Get total count for pagination metadata
  // NOTE: This is a separate query for accuracy
  // In production, consider caching total counts for performance
  const totalResult = await db
    .select({ count: db.$count(auditLog.id) })
    .from(auditLog)
    .where(and(...conditions));

  const total = totalResult[0]?.count || 0;
  const hasMore = offset + logs.length < total;

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      hasMore
    }
  };
}

/**
 * Get Recent Audit Logs
 *
 * Helper function to get most recent audit logs (last 100 entries).
 *
 * @param userId - User ID
 * @returns Most recent 100 audit log entries
 * @throws Error if unauthorized
 *
 * @example
 * const recentLogs = await getRecentAuditLogs('user-123');
 * // Returns last 100 audit entries
 */
export async function getRecentAuditLogs(userId: string): Promise<AuditLogEntry[]> {
  const result = await getAuditLogs(userId, { page: 1, limit: 100 });
  return result.logs;
}

/**
 * Get Audit Logs by Action
 *
 * Helper function to get audit logs filtered by action type.
 *
 * @param userId - User ID
 * @param action - Action type to filter by
 * @param options - Additional pagination options
 * @returns Audit logs filtered by action
 * @throws Error if unauthorized
 *
 * @example
 * const consentChanges = await getAuditLogsByAction('user-123', 'CONSENT_CHANGE');
 * // Returns all consent change audit entries
 */
export async function getAuditLogsByAction(
  userId: string,
  action: AuditAction,
  options: Omit<AuditLogPaginationOptions, 'action'> = {}
): Promise<AuditLogPage> {
  return getAuditLogs(userId, { ...options, action });
}

/**
 * Get Audit Logs by Resource Type
 *
 * Helper function to get audit logs filtered by resource type.
 *
 * @param userId - User ID
 * @param resourceType - Resource type to filter by
 * @param options - Additional pagination options
 * @returns Audit logs filtered by resource type
 * @throws Error if unauthorized
 *
 * @example
 * const profileChanges = await getAuditLogsByResourceType('user-123', 'user_profile');
 * // Returns all user_profile audit entries
 */
export async function getAuditLogsByResourceType(
  userId: string,
  resourceType: string,
  options: Omit<AuditLogPaginationOptions, 'resourceType'> = {}
): Promise<AuditLogPage> {
  return getAuditLogs(userId, { ...options, resourceType });
}

/**
 * Get Audit Logs by Date Range
 *
 * Helper function to get audit logs within a specific date range.
 *
 * @param userId - User ID
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @param options - Additional pagination options
 * @returns Audit logs within date range
 * @throws Error if unauthorized
 *
 * @example
 * const logsThisMonth = await getAuditLogsByDateRange(
 *   'user-123',
 *   new Date('2025-11-01'),
 *   new Date('2025-11-30')
 * );
 */
export async function getAuditLogsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date,
  options: Omit<AuditLogPaginationOptions, 'startDate' | 'endDate'> = {}
): Promise<AuditLogPage> {
  return getAuditLogs(userId, { ...options, startDate, endDate });
}

/**
 * Get Consent Change History
 *
 * Specialized query for retrieving consent change audit trail.
 * Used in /api/consent/history endpoint.
 *
 * @param userId - User ID
 * @param options - Pagination options
 * @returns Consent change audit entries
 * @throws Error if unauthorized
 *
 * @example
 * const history = await getConsentChangeHistory('user-123', { page: 1, limit: 50 });
 * history.logs.forEach(log => {
 *   console.log(`Consent changed at ${log.createdAt}`);
 *   console.log('Before:', log.metadata.changes.before);
 *   console.log('After:', log.metadata.changes.after);
 * });
 */
export async function getConsentChangeHistory(
  userId: string,
  options: Omit<AuditLogPaginationOptions, 'action' | 'resourceType'> = {}
): Promise<AuditLogPage> {
  return getAuditLogs(userId, {
    ...options,
    action: 'CONSENT_CHANGE',
    resourceType: 'user_consent'
  });
}
