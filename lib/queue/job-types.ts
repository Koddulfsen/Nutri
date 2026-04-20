/**
 * BullMQ Job Types and Schemas
 *
 * Purpose: TypeScript interfaces and Zod validation schemas for all job payloads
 * Pattern: Strongly typed job payloads with runtime validation
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 1000-1150 (ETL Architecture)
 */

import { z } from 'zod';

/**
 * Job Priority Levels
 */
export enum JobPriority {
  HIGH = 1,    // User-requested imports (immediate)
  NORMAL = 5,  // Background imports
  LOW = 10     // Batch background processing
}

/**
 * Import Single Food Job
 * Imports a single food by FDC ID
 */
export interface ImportSingleFoodJob {
  fdcId: number;
  priority: JobPriority | number;
  userId?: string; // User ID if user-initiated
  requestedBy?: string; // Legacy field name
  source?: 'user-search' | 'batch-import' | 'recommendation';
}

export const ImportSingleFoodJobSchema = z.object({
  fdcId: z.number().int().positive(),
  priority: z.nativeEnum(JobPriority),
  requestedBy: z.string().uuid().optional(),
  source: z.enum(['user-search', 'batch-import', 'recommendation']),
});

/**
 * Import Batch Food Job
 * Imports multiple foods in a single batch
 */
export interface ImportBatchFoodJob {
  fdcIds: number[];
  batchId: string;
  priority: JobPriority;
  requestedBy?: string;
}

export const ImportBatchFoodJobSchema = z.object({
  fdcIds: z.array(z.number().int().positive()).min(1).max(50), // Max 50 per batch
  batchId: z.string().uuid(),
  priority: z.nativeEnum(JobPriority),
  requestedBy: z.string().uuid().optional(),
});

/**
 * Process Quarantine Job
 * Processes a quarantined food for manual review approval
 */
export interface ProcessQuarantineJob {
  quarantineId: string;
  action: 'approve' | 'reject';
  reviewerId: string;
  reviewerNotes?: string;
}

export const ProcessQuarantineJobSchema = z.object({
  quarantineId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  reviewerId: z.string().uuid(),
  reviewerNotes: z.string().optional(),
});

/**
 * Job Result Types
 */
export interface ImportJobResult {
  status: 'SUCCESS' | 'QUARANTINED' | 'FAILED';
  fdcId: number;
  foodId?: string;
  reason?: string;
  errors?: Array<{ rule: string; severity: string; message: string }>;
}

export interface BatchImportJobResult {
  batchId: string;
  total: number;
  succeeded: number;
  quarantined: number;
  failed: number;
  results: ImportJobResult[];
}

/**
 * Job Names (Queue Identifiers)
 */
export const JOB_NAMES = {
  IMPORT_SINGLE_FOOD: 'import-single-food',
  IMPORT_BATCH_FOOD: 'import-batch-food',
  PROCESS_QUARANTINE: 'process-quarantine',
} as const;

/**
 * Job Options
 */
export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000, // Start at 2 seconds
  },
  removeOnComplete: {
    age: 86400, // Keep completed jobs for 24 hours
    count: 1000, // Keep max 1000 completed jobs
  },
  removeOnFail: {
    age: 604800, // Keep failed jobs for 7 days
  },
};
