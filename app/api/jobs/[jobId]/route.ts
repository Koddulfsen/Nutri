/**
 * Job Status API Endpoint
 *
 * GET /api/jobs/[jobId]
 *
 * Purpose: Check import job status for polling
 * Pattern: BullMQ job status with progress tracking
 * Features:
 *   - Return: state, progress, result, error
 *   - Include estimated completion time
 *   - Authentication check
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 2450-2550 (Job Polling)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Queue } from 'bullmq';
import { getRedisClient } from '@/lib/services/redis';
import { JOB_NAMES } from '@/lib/queue/job-types';
import { logger } from '@/lib/logger';

/**
 * Get Redis connection for BullMQ
 */
function getRedisConnection() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Redis not configured');
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
 * GET /api/jobs/[jobId]
 * Get job status and progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    // Step 1: Authentication check
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      logger.warn(
        { service: 'job-status-api', endpoint: '/api/jobs/[jobId]' },
        'Unauthorized job status check'
      );

      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { jobId } = await params;

    logger.debug(
      {
        service: 'job-status-api',
        userId,
        jobId,
      },
      'Checking job status'
    );

    // Step 2: Connect to BullMQ queue
    const connection = getRedisConnection();
    const queue = new Queue(JOB_NAMES.IMPORT_SINGLE_FOOD, { connection });

    // Step 3: Get job from queue
    const job = await queue.getJob(jobId);

    if (!job) {
      logger.warn(
        {
          service: 'job-status-api',
          userId,
          jobId,
        },
        'Job not found'
      );

      return NextResponse.json(
        { error: 'Job not found', jobId },
        { status: 404 }
      );
    }

    // Step 4: Get job state and progress
    const state = await job.getState();
    const progress = job.progress as number | { percent: number; message?: string } | undefined;

    // Normalize progress to number
    const progressPercent = typeof progress === 'number'
      ? progress
      : typeof progress === 'object' && progress !== null
      ? progress.percent
      : 0;

    logger.debug(
      {
        service: 'job-status-api',
        userId,
        jobId,
        state,
        progress: progressPercent,
      },
      'Job status retrieved'
    );

    // Step 5: Build response based on state
    const response: any = {
      jobId,
      state,
      progress: progressPercent,
    };

    // Add result if completed
    if (state === 'completed') {
      response.result = job.returnvalue;
    }

    // Add error if failed
    if (state === 'failed') {
      response.error = job.failedReason || 'Job failed with unknown error';
    }

    // Estimate completion time for active/waiting jobs
    if (state === 'waiting' || state === 'active') {
      const queueCounts = await queue.getJobCounts('waiting', 'active');
      const estimatedSeconds = state === 'waiting'
        ? (queueCounts.waiting || 0) * 3 + 5 // 3 sec per job ahead + 5 sec base
        : Math.max(1, Math.round((100 - progressPercent) / 20)); // Estimate based on progress

      response.estimatedCompletion = estimatedSeconds;
    }

    // Clean up queue connection
    await queue.close();

    logger.info(
      {
        service: 'job-status-api',
        userId,
        jobId,
        state,
      },
      'Job status check completed'
    );

    return NextResponse.json(response);
  } catch (error) {
    logger.error(
      {
        service: 'job-status-api',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Job status API error'
    );

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
