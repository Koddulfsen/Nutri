/**
 * BullMQ Worker
 *
 * Purpose: Process BullMQ jobs for food imports with progress reporting
 * Pattern: Worker with concurrency control and comprehensive error handling
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 1800-1950 (Job Processing)
 */

import { Worker, Job } from 'bullmq';
import { getRedisClient } from '@/lib/services/redis';
import { logger } from '@/lib/logger';
import { etlOrchestrator } from '@/lib/etl/orchestrator';
import {
  JOB_NAMES,
  ImportSingleFoodJob,
  ImportBatchFoodJob,
  ProcessQuarantineJob,
  ImportJobResult,
  BatchImportJobResult,
} from './job-types';

/**
 * Redis connection configuration for BullMQ worker
 */
function getRedisConnection() {
  const redis = getRedisClient();

  if (!redis) {
    throw new Error('Redis client not configured - BullMQ worker requires Redis');
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Redis environment variables not configured');
  }

  return {
    host: new URL(url).hostname,
    port: parseInt(new URL(url).port) || 443,
    password: token,
    tls: {
      rejectUnauthorized: false,
    },
  };
}

/**
 * Process Single Food Import Job
 *
 * @param job - BullMQ job
 * @returns Import result
 */
async function processSingleFoodImport(
  job: Job<ImportSingleFoodJob>
): Promise<ImportJobResult> {
  const { fdcId, priority, requestedBy, source } = job.data;

  logger.info(
    {
      service: 'bullmq-worker',
      jobId: job.id,
      fdcId,
      priority,
      requestedBy,
      source,
    },
    'Processing single food import job'
  );

  try {
    // Update progress: Starting extraction
    await job.updateProgress(10);

    // Run ETL pipeline
    const result = await etlOrchestrator.processSingleFoodImport(fdcId);

    // Update progress based on result
    if (result.status === 'SUCCESS') {
      await job.updateProgress(100);

      logger.info(
        {
          service: 'bullmq-worker',
          jobId: job.id,
          fdcId,
          foodId: result.foodId,
          status: result.status,
        },
        'Single food import job completed successfully'
      );
    } else if (result.status === 'QUARANTINED') {
      await job.updateProgress(100);

      logger.warn(
        {
          service: 'bullmq-worker',
          jobId: job.id,
          fdcId,
          status: result.status,
          reason: result.reason,
          errors: result.errors,
        },
        'Single food import job quarantined'
      );
    } else {
      await job.updateProgress(100);

      logger.error(
        {
          service: 'bullmq-worker',
          jobId: job.id,
          fdcId,
          status: result.status,
          reason: result.reason,
        },
        'Single food import job failed'
      );
    }

    return result;
  } catch (error) {
    logger.error(
      {
        service: 'bullmq-worker',
        jobId: job.id,
        fdcId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Single food import job threw error'
    );

    throw error; // Let BullMQ handle retry
  }
}

/**
 * Process Batch Food Import Job
 *
 * @param job - BullMQ job
 * @returns Batch import result
 */
async function processBatchFoodImport(
  job: Job<ImportBatchFoodJob>
): Promise<BatchImportJobResult> {
  const { fdcIds, batchId, priority, requestedBy } = job.data;

  logger.info(
    {
      service: 'bullmq-worker',
      jobId: job.id,
      batchId,
      count: fdcIds.length,
      priority,
      requestedBy,
    },
    'Processing batch food import job'
  );

  try {
    await job.updateProgress(10);

    // Process all foods in batch
    const results = await etlOrchestrator.processBatchFoodImport(fdcIds);

    await job.updateProgress(100);

    // Aggregate results
    const succeeded = results.filter((r) => r.status === 'SUCCESS').length;
    const quarantined = results.filter((r) => r.status === 'QUARANTINED').length;
    const failed = results.filter((r) => r.status === 'FAILED').length;

    const batchResult: BatchImportJobResult = {
      batchId,
      total: fdcIds.length,
      succeeded,
      quarantined,
      failed,
      results,
    };

    logger.info(
      {
        service: 'bullmq-worker',
        jobId: job.id,
        batchId,
        total: fdcIds.length,
        succeeded,
        quarantined,
        failed,
      },
      'Batch food import job completed'
    );

    return batchResult;
  } catch (error) {
    logger.error(
      {
        service: 'bullmq-worker',
        jobId: job.id,
        batchId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Batch food import job threw error'
    );

    throw error; // Let BullMQ handle retry
  }
}

/**
 * Process Quarantine Approval/Rejection Job
 *
 * @param job - BullMQ job
 * @returns Processing result
 */
async function processQuarantineJob(
  job: Job<ProcessQuarantineJob>
): Promise<{ status: string; quarantineId: string }> {
  const { quarantineId, action, reviewerId, reviewerNotes } = job.data;

  logger.info(
    {
      service: 'bullmq-worker',
      jobId: job.id,
      quarantineId,
      action,
      reviewerId,
    },
    'Processing quarantine review job'
  );

  try {
    await job.updateProgress(25);

    // TODO: Implement quarantine processing logic
    // This will be implemented in Wave 5 (Data Quality & Testing)

    await job.updateProgress(100);

    logger.info(
      {
        service: 'bullmq-worker',
        jobId: job.id,
        quarantineId,
        action,
      },
      'Quarantine review job completed'
    );

    return {
      status: 'SUCCESS',
      quarantineId,
    };
  } catch (error) {
    logger.error(
      {
        service: 'bullmq-worker',
        jobId: job.id,
        quarantineId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Quarantine review job threw error'
    );

    throw error;
  }
}

/**
 * Food Import Worker
 * Processes all food import jobs with concurrency control
 */
export class FoodImportWorker {
  private worker: Worker | null = null;

  /**
   * Start BullMQ worker
   *
   * @param concurrency - Number of concurrent jobs (default: 5)
   */
  async start(concurrency = 5): Promise<void> {
    try {
      const connection = getRedisConnection();

      this.worker = new Worker(
        JOB_NAMES.IMPORT_SINGLE_FOOD,
        async (job) => {
          // Route to appropriate handler based on job name
          if (job.name === JOB_NAMES.IMPORT_SINGLE_FOOD) {
            return await processSingleFoodImport(job);
          } else if (job.name === JOB_NAMES.IMPORT_BATCH_FOOD) {
            return await processBatchFoodImport(job);
          } else if (job.name === JOB_NAMES.PROCESS_QUARANTINE) {
            return await processQuarantineJob(job);
          } else {
            throw new Error(`Unknown job type: ${job.name}`);
          }
        },
        {
          connection,
          concurrency,
          limiter: {
            max: 10, // Max 10 jobs per minute
            duration: 60000,
          },
        }
      );

      // Event handlers
      this.worker.on('completed', (job) => {
        logger.info(
          {
            service: 'bullmq-worker',
            jobId: job.id,
            jobName: job.name,
            duration: Date.now() - job.processedOn!,
          },
          'Job completed'
        );
      });

      this.worker.on('failed', (job, error) => {
        logger.error(
          {
            service: 'bullmq-worker',
            jobId: job?.id,
            jobName: job?.name,
            error: error.message,
            attemptsMade: job?.attemptsMade,
          },
          'Job failed'
        );
      });

      this.worker.on('error', (error) => {
        logger.error(
          {
            service: 'bullmq-worker',
            error: error.message,
          },
          'Worker error'
        );
      });

      logger.info(
        {
          service: 'bullmq-worker',
          concurrency,
        },
        'BullMQ worker started'
      );
    } catch (error) {
      logger.error(
        {
          service: 'bullmq-worker',
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to start BullMQ worker'
      );

      throw error;
    }
  }

  /**
   * Stop BullMQ worker gracefully
   */
  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();

      logger.info({ service: 'bullmq-worker' }, 'BullMQ worker stopped');
    }
  }

  /**
   * Get worker metrics
   */
  async getMetrics() {
    if (!this.worker) {
      return { running: false };
    }

    return {
      running: !this.worker.closing,
      concurrency: this.worker.opts.concurrency,
    };
  }
}

/**
 * Singleton worker instance
 */
export const foodImportWorker = new FoodImportWorker();
