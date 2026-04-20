/**
 * Symptoms API Endpoint
 *
 * GET /api/symptoms?date=YYYY-MM-DD - Get symptom logs for date
 * POST /api/symptoms - Log a symptom
 *
 * Purpose: Symptom logging and retrieval
 * Pattern: Supabase auth + Zod validation + symptom-service
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { logSymptom, getSymptomsForDate } from '@/lib/services/symptom-service';
import { ensureUserProfile } from '@/lib/services/user-service';
import { logger } from '@/lib/logger';

/**
 * POST body schema
 */
const LogSymptomSchema = z.object({
  symptomDefinitionId: z.string().uuid('Invalid symptom definition ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  intensity: z.number().int().min(1, 'Intensity must be at least 1').max(10, 'Intensity must be at most 10'),
  notes: z.string().optional(),
});

/**
 * GET query params schema
 */
const GetSymptomsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

/**
 * POST /api/symptoms
 * Log a symptom with intensity
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      logger.warn(
        { service: 'symptoms-api', endpoint: 'POST /api/symptoms' },
        'Unauthorized request - no session'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Step 2: Parse and validate request body
    const body = await request.json();
    const validationResult = LogSymptomSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'symptoms-api',
          endpoint: 'POST /api/symptoms',
          userId,
          errors: validationResult.error.errors,
        },
        'Invalid request body'
      );
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { symptomDefinitionId, date, intensity, notes } = validationResult.data;

    // Step 3: Ensure user profile exists
    await ensureUserProfile(userId, {
      fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
      avatarUrl: session.user.user_metadata?.avatar_url,
    });

    logger.info(
      {
        service: 'symptoms-api',
        endpoint: 'POST /api/symptoms',
        userId,
        symptomDefinitionId,
        date,
        intensity,
      },
      'Logging symptom'
    );

    // Step 4: Log symptom
    const symptomLog = await logSymptom(userId, {
      symptomDefinitionId,
      date,
      intensity,
      notes,
    });

    logger.info(
      {
        service: 'symptoms-api',
        endpoint: 'POST /api/symptoms',
        userId,
        logId: symptomLog.id,
      },
      'Symptom logged successfully'
    );

    return NextResponse.json(
      {
        id: symptomLog.id,
        symptomDefinitionId: symptomLog.symptomDefinitionId,
        date: symptomLog.date,
        intensity: symptomLog.intensity,
        notes: symptomLog.notes,
        loggedAt: symptomLog.loggedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error(
      {
        service: 'symptoms-api',
        endpoint: 'POST /api/symptoms',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to log symptom'
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

/**
 * GET /api/symptoms?date=YYYY-MM-DD
 * Get symptom logs for specific date
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
        { service: 'symptoms-api', endpoint: 'GET /api/symptoms' },
        'Unauthorized request - no session'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Step 2: Parse and validate query params
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const validationResult = GetSymptomsSchema.safeParse({ date });

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'symptoms-api',
          endpoint: 'GET /api/symptoms',
          userId,
          errors: validationResult.error.errors,
        },
        'Invalid query parameters'
      );
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    logger.debug(
      {
        service: 'symptoms-api',
        endpoint: 'GET /api/symptoms',
        userId,
        date: validationResult.data.date,
      },
      'Fetching symptoms for date'
    );

    // Step 3: Fetch symptoms
    const symptoms = await getSymptomsForDate(userId, validationResult.data.date);

    logger.info(
      {
        service: 'symptoms-api',
        endpoint: 'GET /api/symptoms',
        userId,
        date: validationResult.data.date,
        count: symptoms.length,
      },
      'Symptoms fetched successfully'
    );

    return NextResponse.json({
      date: validationResult.data.date,
      symptoms: symptoms.map((log) => ({
        id: log.id,
        symptomDefinitionId: log.symptomDefinitionId,
        date: log.date,
        intensity: log.intensity,
        notes: log.notes,
        loggedAt: log.loggedAt.toISOString(),
        symptomDefinition: log.symptomDefinition,
      })),
    });
  } catch (error) {
    logger.error(
      {
        service: 'symptoms-api',
        endpoint: 'GET /api/symptoms',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to fetch symptoms'
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
