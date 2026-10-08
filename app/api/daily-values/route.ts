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
import { dvValueFromRow } from '@/lib/dv/dv-value-from-row';
import {
  getDailyValuesBatch,
  getDailyValuesBatchByDemographics,
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
  // Optional demographic overrides — when both provided, bypass profile lookup
  // and use the new age-range-based DV query (the picker on /analysis sends these).
  age: z.number().int().min(0).max(120).optional(),
  sex: z.enum(['MALE', 'FEMALE']).optional(),
  // Energy is the only target that depends on activity. Omitted, the resolver reads energy at MODERATE and
  // reports that it assumed, through activityBasis.
  activityLevel: z.enum(['SEDENTARY', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE']).optional(),
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
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.warn(
        { service: 'daily-values-api', endpoint: 'GET /api/daily-values' },
        'Unauthorized request - no session'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

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
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Step 2: Parse body and determine mode
    const body = await request.json();

    // Mode 1: Fetch daily values (batch) - uses compoundIds array
    const fetchResult = FetchDailyValuesSchema.safeParse(body);
    if (fetchResult.success) {
      const { compoundIds, includeDisplaySettings, age, sex, activityLevel } = fetchResult.data;

      logger.debug(
        {
          service: 'daily-values-api',
          endpoint: 'POST /api/daily-values (fetch)',
          userId,
          compoundCount: compoundIds.length,
          hasDemographicOverride: age !== undefined && sex !== undefined,
        },
        'Fetching daily values (batch)'
      );

      // Convert Map to object for JSON response
      const valuesObject: Record<string, any> = {};

      if (age !== undefined && sex !== undefined) {
        // New path: age/sex from caller, age-range-based lookup
        const lookup = await getDailyValuesBatchByDemographics({
          compoundIds, ageYears: age, sex, activityLevel,
        });
        lookup.forEach((row, compoundId) => {
          // This is the map the BROWSER draws bars from: /analysis recomputes a day locally after every
          // add and remove (recalcLocally) and reads the bar's value straight out of this object. So it
          // has to agree with the server-rendered payload exactly, and until 2026-10-08 it did not —
          // `if (row.target == null) return` dropped the eleven ceiling-only compounds here, so their
          // bars went blank the moment a food was added even though the server-rendered load had them.
          // The amounts kept updating (those come from the local totals, not from here), which is why
          // the symptom was bars-only. Shared rule, one place: lib/dv/dv-value-from-row.ts.
          const dv = dvValueFromRow(row);
          if (!dv) return;
          valuesObject[compoundId] = {
            compoundId,
            value: dv.value,
            unit: dv.unit,
            valueType: row.targetType,
            source: dv.source,
            sourceCount: dv.sourceCount,
            limitOnly: dv.limitOnly ?? false,
            perDayFrom: dv.perDayFrom ?? null,
            // A limit-only bar must not also carry an upperLimit: the target bar reads that as "overflow
            // past the goal", and here the limit IS the bar.
            upperLimit: dv.limitOnly ? null : row.upperLimit,
            upperLimitUnit: dv.limitOnly ? null : row.upperLimitUnit,
            upperLimitSourceCount: dv.limitOnly ? 0 : row.upperLimitSourceCount,
            // The rest of the resolved bar (lib/dv/resolve.ts). Each answers a different question from the target,
            // so none of them may be folded into it: which bodies set it and how far apart they are, the intake for
            // lower chronic-disease risk, a ceiling that only applies to supplements, ceilings on a FORM of the
            // nutrient, values published as a share of energy, and a published range.
            sources: dv.sources ?? [],
            spread: dv.spread ?? null,
            diseaseFloor: row.diseaseFloor,
            supplementLimit: row.supplementLimit,
            formLimits: row.formLimits,
            energyShare: row.energyShare,
            range: row.range,
            averagingDays: row.averagingDays,
            referencePoints: row.referencePoints,
            weightBasis: row.weightBasis,
            activityBasis: row.activityBasis,
          };
        });
      } else {
        // Legacy path: read demographics from profile
        const dailyValues = await getDailyValuesBatch(userId, compoundIds);
        dailyValues.forEach((value, key) => { valuesObject[key] = value; });
      }

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
          foundCount: Object.keys(valuesObject).length,
        },
        'Daily values fetched successfully (batch)'
      );

      return NextResponse.json({
        dailyValues: valuesObject,
        count: Object.keys(valuesObject).length,
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
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

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
