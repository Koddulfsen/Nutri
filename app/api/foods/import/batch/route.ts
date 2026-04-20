/**
 * Batch Food Import API Endpoint
 *
 * POST /api/foods/import/batch
 *
 * Purpose: Import multiple foods in a single batch
 * Pattern: Queue batch job with progress tracking
 * Features:
 *   - Accept array of fdcIds (max 100)
 *   - Queue batch job with progress tracking
 *   - Return job ID + estimated duration
 *   - Rate limiting (max 5 batches/hour per user)
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 2550-2650 (Batch Operations)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { foodImportQueue } from '@/lib/queue/food-import-queue';
import { getRedisClient } from '@/lib/services/redis';
import { logger } from '@/lib/logger';

/**
 * Request schema validation
 */
const BatchImportRequestSchema = z.object({
  fdcIds: z
    .array(z.number().int().positive())
    .min(1, 'At least 1 food required')
    .max(100, 'Maximum 100 foods per batch'),
  priority: z.number().int().min(1).max(10).optional().default(5),
});

/**
 * Rate limiter for batch imports
 */
async function checkBatchRateLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const redis = getRedisClient();

  if (!redis) {
    // Redis unavailable - allow request (degraded mode)
    logger.warn(
      { service: 'batch-import-api', userId },
      'Redis unavailable - batch rate limiting disabled'
    );
    return { allowed: true, remaining: 5, resetAt: new Date() };
  }

  const key = `batch-rate-limit:${userId}`;
  const limit = 5; // Max 5 batches per hour
  const windowSeconds = 3600; // 1 hour

  try {
    // Get current count
    const current = await redis.get<number>(key);
    const count = current || 0;

    if (count >= limit) {
      // Rate limit exceeded
      const ttl = await redis.ttl(key);
      const resetAt = new Date(Date.now() + ttl * 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // Increment count
    const newCount = count + 1;
    if (count === 0) {
      // Set with TTL on first request
      await redis.set(key, newCount, { ex: windowSeconds });
    } else {
      // Update without changing TTL
      await redis.set(key, newCount);
    }

    const ttl = await redis.ttl(key);
    const resetAt = new Date(Date.now() + ttl * 1000);

    return {
      allowed: true,
      remaining: limit - newCount,
      resetAt,
    };
  } catch (error) {
    logger.error(
      {
        service: 'batch-import-api',
        userId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Rate limit check failed - allowing request'
    );

    return { allowed: true, remaining: 5, resetAt: new Date() };
  }
}

/**
 * POST /api/foods/import/batch
 * Queue batch food import job
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Authentication check
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      logger.warn(
        { service: 'batch-import-api', endpoint: '/api/foods/import/batch' },
        'Unauthorized batch import attempt'
      );

      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Step 2: Rate limit check
    const rateLimitResult = await checkBatchRateLimit(userId);

    if (!rateLimitResult.allowed) {
      logger.warn(
        {
          service: 'batch-import-api',
          userId,
          resetAt: rateLimitResult.resetAt,
        },
        'Batch rate limit exceeded'
      );

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Maximum 5 batch imports per hour',
          remaining: 0,
          resetAt: rateLimitResult.resetAt,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
          },
        }
      );
    }

    // Step 3: Parse and validate request body
    const body = await request.json();
    const validationResult = BatchImportRequestSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'batch-import-api',
          userId,
          errors: validationResult.error.errors,
        },
        'Invalid batch import request'
      );

      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { fdcIds, priority } = validationResult.data;

    logger.info(
      {
        service: 'batch-import-api',
        userId,
        count: fdcIds.length,
        priority,
      },
      'Queueing batch food import job'
    );

    // Step 4: Generate batch ID
    const batchId = crypto.randomUUID();

    // Step 5: Queue batch job
    const jobId = await foodImportQueue.addBatchFoodImport({
      fdcIds,
      batchId,
      priority,
      requestedBy: userId,
    });

    // Step 6: Estimate duration
    const queueMetrics = await foodImportQueue.getHealthMetrics();
    const estimatedDuration = queueMetrics.healthy
      ? Math.max(fdcIds.length * 3, (queueMetrics.waiting || 0) * 3 + fdcIds.length * 3)
      : fdcIds.length * 5; // 5 seconds per food if queue unavailable

    logger.info(
      {
        service: 'batch-import-api',
        userId,
        batchId,
        jobId,
        count: fdcIds.length,
        estimatedDuration,
        remaining: rateLimitResult.remaining,
      },
      'Batch food import job queued successfully'
    );

    // Step 7: Return job ID and status
    return NextResponse.json(
      {
        jobId,
        batchId,
        status: 'queued',
        count: fdcIds.length,
        estimatedDuration,
      },
      {
        status: 202,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
        },
      }
    );
  } catch (error) {
    logger.error(
      {
        service: 'batch-import-api',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Batch import API error'
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
