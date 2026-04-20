/**
 * Food Import Queue (BullMQ)
 *
 * Purpose: BullMQ queue setup with Redis connection and job management
 * Pattern: Queue with event handlers, retry logic, and health metrics
 * Service: Upstash Redis (from Wave 2)
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 1000-1150 (ETL Architecture)
 */

import { Queue, QueueEvents } from 'bullmq';
import { getRedisClient } from '@/lib/services/redis';
import { logger } from '@/lib/logger';
import {
  JOB_NAMES,
  DEFAULT_JOB_OPTIONS,
  ImportSingleFoodJob,
  ImportBatchFoodJob,
  ProcessQuarantineJob,
} from './job-types';

/**
 * Redis connection configuration for BullMQ
 * Uses Upstash Redis REST API
 */
function getRedisConnection() {
  const redis = getRedisClient();

  if (!redis) {
    throw new Error('Redis client not configured - BullMQ requires Redis');
  }

  // BullMQ requires connection object, not client instance
  // Upstash Redis uses REST API, so we configure direct connection
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Redis environment variables not configured');
  }

  // For Upstash Redis, we use ioredis-compatible connection
  // BullMQ will handle the connection internally
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
 * Food Import Queue
 * Handles all food import jobs with retry and monitoring
 */
class FoodImportQueue {
  private queue: Queue | null = null;
  private queueEvents: QueueEvents | null = null;
  private metrics = {
    completed: 0,
    failed: 0,
    stalled: 0,
  };

  /**
   * Initialize BullMQ queue
   */
  async initialize(): Promise<void> {
    try {
      const connection = getRedisConnection();

      // Create queue
      this.queue = new Queue(JOB_NAMES.IMPORT_SINGLE_FOOD, {
        connection,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      });

      // Create queue events for monitoring
      this.queueEvents = new QueueEvents(JOB_NAMES.IMPORT_SINGLE_FOOD, {
        connection,
      });

      // Setup event handlers
      this.setupEventHandlers();

      logger.info({ service: 'food-import-queue' }, 'BullMQ queue initialized');
    } catch (error) {
      logger.error(
        {
          service: 'food-import-queue',
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to initialize BullMQ queue'
      );
      throw error;
    }
  }

  /**
   * Setup event handlers for queue monitoring
   */
  private setupEventHandlers(): void {
    if (!this.queueEvents) return;

    this.queueEvents.on('completed', ({ jobId }) => {
      this.metrics.completed++;
      logger.debug({ service: 'food-import-queue', jobId }, 'Job completed');
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      this.metrics.failed++;
      logger.error(
        {
          service: 'food-import-queue',
          jobId,
          failedReason,
        },
        'Job failed'
      );
    });

    this.queueEvents.on('stalled', ({ jobId }) => {
      this.metrics.stalled++;
      logger.warn({ service: 'food-import-queue', jobId }, 'Job stalled - will retry');
    });
  }

  /**
   * Add single food import job to queue
   *
   * @param job - Import single food job data
   * @returns Job ID
   */
  async addSingleFoodImport(job: ImportSingleFoodJob): Promise<string> {
    if (!this.queue) {
      await this.initialize();
    }

    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const bullJob = await this.queue.add(JOB_NAMES.IMPORT_SINGLE_FOOD, job, {
      priority: job.priority,
      jobId: `food-${job.fdcId}-${Date.now()}`, // Unique job ID with timestamp
    });

    logger.info(
      {
        service: 'food-import-queue',
        jobId: bullJob.id,
        fdcId: job.fdcId,
        priority: job.priority,
      },
      'Single food import job queued'
    );

    return bullJob.id || 'unknown';
  }

  /**
   * Add batch food import job to queue
   *
   * @param job - Import batch food job data
   * @returns Job ID
   */
  async addBatchFoodImport(job: ImportBatchFoodJob): Promise<string> {
    if (!this.queue) {
      await this.initialize();
    }

    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const bullJob = await this.queue.add(JOB_NAMES.IMPORT_BATCH_FOOD, job, {
      priority: job.priority,
      jobId: `batch-${job.batchId}`,
    });

    logger.info(
      {
        service: 'food-import-queue',
        jobId: bullJob.id,
        batchId: job.batchId,
        count: job.fdcIds.length,
        priority: job.priority,
      },
      'Batch food import job queued'
    );

    return bullJob.id || 'unknown';
  }

  /**
   * Add quarantine processing job to queue
   *
   * @param job - Process quarantine job data
   * @returns Job ID
   */
  async addQuarantineProcessing(job: ProcessQuarantineJob): Promise<string> {
    if (!this.queue) {
      await this.initialize();
    }

    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const bullJob = await this.queue.add(JOB_NAMES.PROCESS_QUARANTINE, job, {
      priority: 1, // High priority for manual reviews
      jobId: `quarantine-${job.quarantineId}`,
    });

    logger.info(
      {
        service: 'food-import-queue',
        jobId: bullJob.id,
        quarantineId: job.quarantineId,
        action: job.action,
      },
      'Quarantine processing job queued'
    );

    return bullJob.id || 'unknown';
  }

  /**
   * Get queue health metrics
   *
   * @returns Health metrics object
   */
  async getHealthMetrics() {
    if (!this.queue) {
      return {
        healthy: false,
        error: 'Queue not initialized',
      };
    }

    try {
      const counts = await this.queue.getJobCounts('waiting', 'active', 'completed', 'failed');

      return {
        healthy: true,
        waiting: counts.waiting,
        active: counts.active,
        completed: this.metrics.completed,
        failed: this.metrics.failed,
        stalled: this.metrics.stalled,
      };
    } catch (error) {
      logger.error(
        {
          service: 'food-import-queue',
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to get queue health metrics'
      );

      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Close queue and cleanup
   */
  async close(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
      logger.info({ service: 'food-import-queue' }, 'Queue closed');
    }

    if (this.queueEvents) {
      await this.queueEvents.close();
    }
  }
}

/**
 * Singleton queue instance
 */
export const foodImportQueue = new FoodImportQueue();

/**
 * Helper function to get queue metrics for health monitoring
 */
export async function getQueueMetrics() {
  return await foodImportQueue.getHealthMetrics();
}
