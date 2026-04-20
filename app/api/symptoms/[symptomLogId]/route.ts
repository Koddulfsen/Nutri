/**
 * Symptom Log Detail API Endpoint
 *
 * PATCH /api/symptoms/[symptomLogId] - Update symptom log
 * DELETE /api/symptoms/[symptomLogId] - Delete symptom log (soft delete)
 *
 * Purpose: Individual symptom log operations
 * Pattern: Supabase auth + ownership verification + symptom-service
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { updateSymptomLog, deleteSymptomLog } from '@/lib/services/symptom-service';
import { logger } from '@/lib/logger';

/**
 * PATCH body schema
 */
const UpdateSymptomLogSchema = z.object({
  intensity: z.number().int().min(1).max(10).optional(),
  notes: z.string().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

/**
 * PATCH /api/symptoms/[symptomLogId]
 * Update symptom log (intensity, notes, date)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ symptomLogId: string }> }
) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      logger.warn(
        { service: 'symptom-detail-api', endpoint: 'PATCH /api/symptoms/[symptomLogId]' },
        'Unauthorized request - no session'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { symptomLogId } = await params;

    // Step 2: Parse and validate request body
    const body = await request.json();
    const validationResult = UpdateSymptomLogSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'symptom-detail-api',
          endpoint: 'PATCH /api/symptoms/[symptomLogId]',
          userId,
          symptomLogId,
          errors: validationResult.error.errors,
        },
        'Invalid request body'
      );
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    logger.info(
      {
        service: 'symptom-detail-api',
        endpoint: 'PATCH /api/symptoms/[symptomLogId]',
        userId,
        symptomLogId,
        updates: validationResult.data,
      },
      'Updating symptom log'
    );

    // Step 3: Update symptom log
    const updated = await updateSymptomLog(symptomLogId, userId, validationResult.data);

    logger.info(
      {
        service: 'symptom-detail-api',
        endpoint: 'PATCH /api/symptoms/[symptomLogId]',
        userId,
        symptomLogId,
      },
      'Symptom log updated successfully'
    );

    return NextResponse.json({
      id: updated.id,
      symptomDefinitionId: updated.symptomDefinitionId,
      date: updated.date,
      intensity: updated.intensity,
      notes: updated.notes,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error(
      {
        service: 'symptom-detail-api',
        endpoint: 'PATCH /api/symptoms/[symptomLogId]',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to update symptom log'
    );

    if (error instanceof Error && error.message.includes('not found or unauthorized')) {
      return NextResponse.json({ error: 'Symptom log not found' }, { status: 404 });
    }

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
 * DELETE /api/symptoms/[symptomLogId]
 * Delete symptom log (soft delete - sets isActive = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ symptomLogId: string }> }
) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      logger.warn(
        { service: 'symptom-detail-api', endpoint: 'DELETE /api/symptoms/[symptomLogId]' },
        'Unauthorized request - no session'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { symptomLogId } = await params;

    logger.info(
      {
        service: 'symptom-detail-api',
        endpoint: 'DELETE /api/symptoms/[symptomLogId]',
        userId,
        symptomLogId,
      },
      'Deleting symptom log (soft delete)'
    );

    // Step 2: Delete symptom log
    await deleteSymptomLog(symptomLogId, userId);

    logger.info(
      {
        service: 'symptom-detail-api',
        endpoint: 'DELETE /api/symptoms/[symptomLogId]',
        userId,
        symptomLogId,
      },
      'Symptom log deleted successfully'
    );

    return NextResponse.json(
      { message: 'Symptom log deleted successfully', symptomLogId },
      { status: 200 }
    );
  } catch (error) {
    logger.error(
      {
        service: 'symptom-detail-api',
        endpoint: 'DELETE /api/symptoms/[symptomLogId]',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to delete symptom log'
    );

    if (error instanceof Error && error.message.includes('not found or unauthorized')) {
      return NextResponse.json({ error: 'Symptom log not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
