// Data Access Layer - Central Export
// FS-4 Security & Compliance System
// Created: 2025-11-10

/**
 * Data Access Layer (DAL) - Security & Authorization
 *
 * The DAL provides centralized authentication and authorization enforcement
 * for all database operations. This is Layer 2 of the multi-layered security
 * architecture (after Supabase RLS at Layer 1).
 *
 * SECURITY LAYERS:
 * 1. Database (PRIMARY): Supabase RLS policies enforce user_id = auth.uid()
 * 2. DAL (SECONDARY): Authentication + authorization checks before queries
 * 3. Server Actions: Verify authentication at function entry
 * 4. Route-Level: Page components check auth before rendering
 *
 * ALL database access MUST go through DAL functions.
 * Direct db.query.* calls bypass security checks and should be avoided.
 *
 * @module lib/dal
 */

// User Profiles
export {
  getUserProfile,
  updateUserProfile,
  incrementSessionVersion,
  getDashboardWidgets,
  updateDashboardWidgets,
  type UserProfile,
  type UserProfileUpdate
} from './profiles';

// Consent Management
export {
  getUserConsent,
  updateUserConsent,
  checkConsent,
  grantAllConsents,
  revokeAllConsents,
  createInitialConsent,
  type ConsentRecord,
  type ConsentUpdate
} from './consent';

// Audit Log Queries
export {
  getAuditLogs,
  getRecentAuditLogs,
  getAuditLogsByAction,
  getAuditLogsByResourceType,
  getAuditLogsByDateRange,
  getConsentChangeHistory,
  type AuditLogEntry,
  type AuditLogPaginationOptions,
  type AuditLogPage
} from './audit';

// API Keys
export {
  generateApiKey,
  listApiKeys,
  revokeApiKey,
  validateApiKey,
  updateKeyLastUsed,
  setKeyExpiration,
  type ApiKey,
  type ApiKeyWithPlaintext
} from './api-keys';
