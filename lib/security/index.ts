// Security & Compliance Module Index - FS-4
// Created: 2025-11-10
// Purpose: Central export point for all security utilities

// Audit Logging
export {
  logAudit,
  logAuditBatch,
  getRequestMetadata,
  type AuditAction,
  type AuditLogOptions
} from './audit-logger';

// Encryption (Phase 3+)
export {
  generateDEK,
  encryptPHI,
  decryptPHI,
  rotateDEK,
  encryptForExport
} from './encryption';

// Rate Limiting
// TEMPORARILY DISABLED - Causing "Invalid API key" error
// export {
//   rateLimiters,
//   checkRateLimit,
//   checkRateLimitSoft,
//   getRateLimitStatus,
//   resetRateLimit,
//   type RateLimitResult
// } from './rate-limit';

// Request Metadata
export {
  extractRequestMetadata,
  extractClientIP,
  extractUserAgent,
  anonymizeIP,
  isLocalhost,
  parseUserAgent,
  type RequestMetadata
} from './request-metadata';
