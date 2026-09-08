/**
 * Food Import API Endpoint
 *
 * POST /api/foods/import
 *
 * Purpose: On-demand food import from USDA API
 * Pattern: Queue job and return job ID for status polling
 * Features:
 *   - Accept fdcId or search query
 *   - Queue import job via BullMQ orchestrator
 *   - Return job ID for status polling
 *   - Authentication check (user must be logged in)
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 2350-2450 (API Design)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { foodImportQueue } from '@/lib/queue/food-import-queue';
import { logger } from '@/lib/logger';

/**
 * Request schema validation
 */
const ImportRequestSchema = z.object({
  fdcId: z.number().int().positive(),
  priority: z.number().int().min(1).max(10).optional().default(5),
});

/**
 * POST /api/foods/import
 * Queue single food import job
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Authentication check
    const supabase = await createClient();
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();

    if (sessionError || !user) {
      logger.warn(
        { service: 'food-import-api', endpoint: '/api/foods/import' },
        'Unauthorized import attempt'
      );

      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Step 2: Parse and validate request body
    const body = await request.json();
    const validationResult = ImportRequestSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'food-import-api',
          userId,
          errors: validationResult.error.errors,
        },
        'Invalid import request'
      );

      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { fdcId, priority } = validationResult.data;

    logger.info(
      {
        service: 'food-import-api',
        userId,
        fdcId,
        priority,
      },
      'Queueing food import job'
    );

    // Step 3: Queue import job
    const jobId = await foodImportQueue.addSingleFoodImport({
      fdcId,
      userId,
      priority,
    });

    // Step 4: Estimate duration based on queue depth
    const queueMetrics = await foodImportQueue.getHealthMetrics();
    const estimatedDuration = queueMetrics.healthy
      ? Math.max(5, (queueMetrics.waiting || 0) * 3) // 3 seconds per job in queue + 5 sec base
      : 30; // Default 30 seconds if queue metrics unavailable

    logger.info(
      {
        service: 'food-import-api',
        userId,
        fdcId,
        jobId,
        estimatedDuration,
      },
      'Food import job queued successfully'
    );

    // Step 5: Return job ID and status
    return NextResponse.json(
      {
        jobId,
        status: 'queued',
        estimatedDuration,
        fdcId,
      },
      { status: 202 } // 202 Accepted - request accepted for processing
    );
  } catch (error) {
    logger.error(
      {
        service: 'food-import-api',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Food import API error'
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
