/**
 * Daily Values API Endpoint
 *
 * GET /api/daily-values?compoundIds=id1,id2
 * POST /api/daily-values (premium: set custom daily value)
 * DELETE /api/daily-values?compoundId=xxx (premium: remove custom value)
 *
 * Purpose: Get personalized daily values for compounds
 * Pattern: Supabase auth + daily-value-service
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  getDailyValuesBatch,
  setCustomDailyValue,
  deleteCustomDailyValue,
  getUserCustomValues,
  getAllDisplaySettings,
} from '@/lib/services/daily-value-service';
import { logger } from '@/lib/logger';

/**
 * GET query params schema
 */
const GetDailyValuesSchema = z.object({
  compoundIds: z.string().optional(), // Comma-separated compound UUIDs
  includeDisplaySettings: z.string().optional(), // Include display settings
  customOnly: z.string().optional(), // Only return custom values
});

/**
 * POST body schema for fetching daily values (batch)
 */
const FetchDailyValuesSchema = z.object({
  compoundIds: z.array(z.string().uuid()).min(1, 'At least one compound ID required'),
  includeDisplaySettings: z.boolean().optional(),
});

/**
 * POST body schema for setting custom daily value
 */
const SetCustomValueSchema = z.object({
  compoundId: z.string().uuid(),
  value: z.number().positive(),
  unit: z.string().min(1),
  note: z.string().optional(),
});

/**
 * DELETE query params schema
 */
const DeleteCustomValueSchema = z.object({
  compoundId: z.string().uuid(),
});

/**
 * GET /api/daily-values
 * Get daily values for specified compounds
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      logger.warn(
        { service: 'daily-values-api', endpoint: 'GET /api/daily-values' },
        'Unauthorized request - no session'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Step 2: Parse query params
    const { searchParams } = new URL(request.url);
    const compoundIdsParam = searchParams.get('compoundIds');
    const includeDisplaySettings = searchParams.get('includeDisplaySettings') === 'true';
    const customOnly = searchParams.get('customOnly') === 'true';

    logger.debug(
      {
        service: 'daily-values-api',
        endpoint: 'GET /api/daily-values',
        userId,
        compoundIdsParam,
        includeDisplaySettings,
        customOnly,
      },
      'Fetching daily values'
    );

    // Step 3: Handle custom-only request
    if (customOnly) {
      const customValues = await getUserCustomValues(userId);
      return NextResponse.json({
        customValues,
        count: customValues.length,
      });
    }

    // Step 4: Parse compound IDs
    const compoundIds = compoundIdsParam
      ? compoundIdsParam.split(',').map((id) => id.trim()).filter(Boolean)
      : [];

    if (compoundIds.length === 0) {
      return NextResponse.json({ error: 'No compound IDs provided' }, { status: 400 });
    }

    // Step 5: Get daily values
    const dailyValues = await getDailyValuesBatch(userId, compoundIds);

    // Convert Map to object for JSON response
    const valuesObject: Record<string, any> = {};
    dailyValues.forEach((value, key) => {
      valuesObject[key] = value;
    });

    // Step 6: Include display settings if requested
    let displaySettings = null;
    if (includeDisplaySettings) {
      displaySettings = await getAllDisplaySettings();
    }

    logger.info(
      {
        service: 'daily-values-api',
        endpoint: 'GET /api/daily-values',
        userId,
        requestedCount: compoundIds.length,
        foundCount: dailyValues.size,
      },
      'Daily values fetched successfully'
    );

    return NextResponse.json({
      dailyValues: valuesObject,
      count: dailyValues.size,
      ...(displaySettings && { displaySettings }),
    });
  } catch (error) {
    logger.error(
      {
        service: 'daily-values-api',
        endpoint: 'GET /api/daily-values',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to fetch daily values'
    );

    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/daily-values
 * Two modes:
 * 1. Fetch daily values (batch) - body: { compoundIds: string[] }
 * 2. Set custom daily value - body: { compoundId, value, unit, note? }
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Step 2: Parse body and determine mode
    const body = await request.json();

    // Mode 1: Fetch daily values (batch) - uses compoundIds array
    const fetchResult = FetchDailyValuesSchema.safeParse(body);
    if (fetchResult.success) {
      const { compoundIds, includeDisplaySettings } = fetchResult.data;

      logger.debug(
        {
          service: 'daily-values-api',
          endpoint: 'POST /api/daily-values (fetch)',
          userId,
          compoundCount: compoundIds.length,
        },
        'Fetching daily values (batch)'
      );

      const dailyValues = await getDailyValuesBatch(userId, compoundIds);

      // Convert Map to object for JSON response
      const valuesObject: Record<string, any> = {};
      dailyValues.forEach((value, key) => {
        valuesObject[key] = value;
      });

      // Include display settings if requested
      let displaySettings = null;
      if (includeDisplaySettings) {
        displaySettings = await getAllDisplaySettings();
      }

      logger.info(
        {
          service: 'daily-values-api',
          endpoint: 'POST /api/daily-values (fetch)',
          userId,
          requestedCount: compoundIds.length,
          foundCount: dailyValues.size,
        },
        'Daily values fetched successfully (batch)'
      );

      return NextResponse.json({
        dailyValues: valuesObject,
        count: dailyValues.size,
        ...(displaySettings && { displaySettings }),
      });
    }

    // Mode 2: Set custom daily value
    const setResult = SetCustomValueSchema.safeParse(body);
    if (setResult.success) {
      const { compoundId, value, unit, note } = setResult.data;

      await setCustomDailyValue(userId, compoundId, value, unit, note);

      logger.info(
        { service: 'daily-values-api', endpoint: 'POST /api/daily-values (set)', userId, compoundId },
        'Custom daily value set'
      );

      return NextResponse.json({ success: true, compoundId, value, unit });
    }

    // Neither schema matched
    return NextResponse.json(
      {
        error: 'Invalid request body',
        details: 'Body must match either fetch schema (compoundIds array) or set schema (compoundId, value, unit)',
      },
      { status: 400 }
    );
  } catch (error) {
    logger.error(
      {
        service: 'daily-values-api',
        endpoint: 'POST /api/daily-values',
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to process daily-values request'
    );

    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/daily-values?compoundId=xxx
 * Delete custom daily value
 */
export async function DELETE(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Step 2: Parse query params
    const { searchParams } = new URL(request.url);
    const compoundId = searchParams.get('compoundId');

    const validationResult = DeleteCustomValueSchema.safeParse({ compoundId });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Step 3: Delete custom value
    await deleteCustomDailyValue(userId, validationResult.data.compoundId);

    logger.info(
      { service: 'daily-values-api', endpoint: 'DELETE /api/daily-values', userId, compoundId },
      'Custom daily value deleted'
    );

    return NextResponse.json({ success: true, compoundId });
  } catch (error) {
    logger.error(
      {
        service: 'daily-values-api',
        endpoint: 'DELETE /api/daily-values',
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to delete custom daily value'
    );

    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
