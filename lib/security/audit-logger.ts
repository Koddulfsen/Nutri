// Audit Logging Infrastructure - FS-4 Security & Compliance System
// Created: 2025-11-10
// Purpose: Immutable audit trail with 6-year HIPAA retention

import { db } from '@/db';
import { auditLog } from '@/db/schema';

/**
 * Audit Action Types
 * Tracks all security-relevant events in the system
 */
export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'CONSENT_CHANGE';

/**
 * Audit Log Options
 * Fields required for creating audit log entries
 */
export interface AuditLogOptions {
  userId: string | null; // NULL for anonymous events or post-deletion
  action: AuditAction;
  resourceType: string; // e.g., 'user_profile', 'user_consent', 'meal_log'
  resourceId?: string | null;
  metadata?: Record<string, any>; // JSONB: IP, user agent, changes, etc.
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Log Audit Entry
 *
 * Creates an immutable audit log entry for compliance tracking.
 *
 * CRITICAL: This function uses fail-closed approach - if audit log
 * write fails, the operation is blocked to maintain compliance.
 *
 * @param options - Audit log entry details
 * @throws Error if audit log write fails (intentional - fail-closed)
 *
 * @example
 * await logAudit({
 *   userId: session.user.id,
 *   action: 'CONSENT_CHANGE',
 *   resourceType: 'user_consent',
 *   resourceId: consent.id,
 *   metadata: { changes: { analytics: false } },
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...'
 * });
 */
export async function logAudit(options: AuditLogOptions): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId: options.userId,
      action: options.action,
      resourceType: options.resourceType,
      resourceId: options.resourceId || null,
      metadata: options.metadata || {},
      ipAddress: options.ipAddress || null,
      userAgent: options.userAgent || null,
      createdAt: new Date()
    });
  } catch (error) {
    // CRITICAL: Audit log failure must not silently fail
    console.error('🚨 AUDIT LOG FAILURE:', error);

    // In production: Send alert to monitoring system
    // Consider blocking operation if audit log cannot be written
    throw new Error('Audit logging failed - operation blocked for compliance');
  }
}

/**
 * Extract Request Metadata
 *
 * Extracts IP address and user agent from Next.js Request object
 * for audit logging purposes.
 *
 * @param request - Next.js Request object
 * @returns Object with ipAddress and userAgent (or null if headers missing)
 *
 * @example
 * const metadata = getRequestMetadata(request);
 * await logAudit({
 *   ...auditOptions,
 *   ...metadata
 * });
 */
export function getRequestMetadata(request: Request) {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || null,
    userAgent: request.headers.get('user-agent') || null
  };
}

/**
 * Batch Audit Logging
 *
 * For operations that affect multiple resources (e.g., bulk delete),
 * log all changes in a single transaction for consistency.
 *
 * @param entries - Array of audit log entries
 * @throws Error if any entry fails (fail-closed)
 *
 * @example
 * await logAuditBatch([
 *   { userId, action: 'DELETE', resourceType: 'meal_log', resourceId: id1 },
 *   { userId, action: 'DELETE', resourceType: 'meal_log', resourceId: id2 }
 * ]);
 */
export async function logAuditBatch(entries: AuditLogOptions[]): Promise<void> {
  try {
    const values = entries.map(entry => ({
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId || null,
      metadata: entry.metadata || {},
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      createdAt: new Date()
    }));

    await db.insert(auditLog).values(values);
  } catch (error) {
    console.error('🚨 BATCH AUDIT LOG FAILURE:', error);
    throw new Error('Batch audit logging failed - operation blocked for compliance');
  }
}
