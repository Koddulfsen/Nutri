/**
 * Audit Logging Utilities
 *
 * Purpose: Log security and data access events.
 * Retention: NONE IMPLEMENTED. This previously claimed "6 years (HIPAA Security
 *   Rule § 164.316)" — that rule does not apply here (GDPR, not HIPAA) and no
 *   expiry job exists. See docs/AUDIT-2026-08-11.md (P9).
 * Fields: user_id, action, resource_type, resource_id, IP, user agent, metadata
 *
 * Generated: 2025-11-10
 * Architecture: Phase 1 Feature System 02 (Authentication & User System)
 */

import { db } from '@/db'
import { auditLog } from '@/db/schema/audit'
import { anonymizeIP } from '@/lib/security/request-metadata'

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'CONSENT_CHANGE'

export interface AuditEventData {
  userId?: string // Nullable - some events may not have a user (e.g., failed login)
  action: AuditAction
  resourceType: string // e.g., 'user_profile', 'compound', 'meal'
  resourceId?: string // UUID of the resource
  metadata?: Record<string, any> // Additional context (e.g., { field: 'email', oldValue: 'old@example.com' })
  ipAddress?: string
  userAgent?: string
}

/**
 * Logs an audit event to the audit_log table
 *
 * @param event - Audit event data
 * @returns Inserted audit log ID
 *
 * @example
 * await logAuditEvent({
 *   userId: session.user.id,
 *   action: 'LOGIN',
 *   resourceType: 'auth',
 *   metadata: { method: 'email' },
 *   ipAddress: request.headers.get('x-forwarded-for'),
 *   userAgent: request.headers.get('user-agent')
 * })
 *
 * @example
 * // Log profile update
 * await logAuditEvent({
 *   userId: session.user.id,
 *   action: 'UPDATE',
 *   resourceType: 'user_profile',
 *   resourceId: profile.id,
 *   metadata: {
 *     field: 'full_name',
 *     oldValue: 'John Doe',
 *     newValue: 'Jane Doe'
 *   },
 *   ipAddress: request.ip,
 *   userAgent: request.headers.get('user-agent')
 * })
 */
export async function logAuditEvent(event: AuditEventData): Promise<string> {
  try {
    const [inserted] = await db
      .insert(auditLog)
      .values({
        userId: event.userId || null,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId || null,
        metadata: event.metadata || {},
        // Truncated before storage; see lib/security/request-metadata.ts.
        // This is pseudonymisation, not anonymisation — the row remains
        // personal data under GDPR.
        ipAddress: event.ipAddress ? anonymizeIP(event.ipAddress) : null,
        userAgent: event.userAgent || null,
      })
      .returning({ id: auditLog.id })

    return inserted.id
  } catch (error) {
    console.error('[Audit Log] Failed to log event:', error)
    // Don't throw - audit logging failures should not block user actions
    // But log to monitoring service (Sentry, etc.)
    return ''
  }
}

/**
 * Convenience function to log login event
 *
 * @param userId - User ID
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 * @param metadata - Additional context (e.g., { method: 'google' })
 *
 * @example
 * await logLoginEvent(session.user.id, request.ip, request.userAgent, { method: 'email' })
 */
export async function logLoginEvent(
  userId: string,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'LOGIN',
    resourceType: 'auth',
    metadata,
    ipAddress,
    userAgent,
  })
}

/**
 * Convenience function to log logout event
 *
 * @param userId - User ID
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 *
 * @example
 * await logLogoutEvent(session.user.id, request.ip, request.userAgent)
 */
export async function logLogoutEvent(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'LOGOUT',
    resourceType: 'auth',
    ipAddress,
    userAgent,
  })
}

/**
 * Convenience function to log data export event (GDPR compliance)
 *
 * @param userId - User ID
 * @param format - Export format (e.g., 'json', 'csv')
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 *
 * @example
 * await logDataExportEvent(session.user.id, 'json', request.ip, request.userAgent)
 */
export async function logDataExportEvent(
  userId: string,
  format: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'EXPORT',
    resourceType: 'user_data',
    metadata: { format },
    ipAddress,
    userAgent,
  })
}

/**
 * Convenience function to log consent change (GDPR compliance)
 *
 * @param userId - User ID
 * @param consentType - Type of consent changed (e.g., 'newsletter', 'analytics')
 * @param newValue - New consent value (true/false)
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 *
 * @example
 * await logConsentChange(session.user.id, 'newsletter', false, request.ip, request.userAgent)
 */
export async function logConsentChange(
  userId: string,
  consentType: string,
  newValue: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'CONSENT_CHANGE',
    resourceType: 'user_consent',
    metadata: {
      consentType,
      newValue,
    },
    ipAddress,
    userAgent,
  })
}
