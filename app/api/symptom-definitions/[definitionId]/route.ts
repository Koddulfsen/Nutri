/**
 * Symptom Definition Detail API Endpoint
 *
 * DELETE /api/symptom-definitions/[definitionId] - Delete custom symptom definition
 *
 * Purpose: Delete user's custom symptom definitions
 * Pattern: Supabase auth + ownership verification + symptom-service
 *
 * Note: Only user-created definitions can be deleted (not system-defined)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteCustomSymptomDefinition } from '@/lib/services/symptom-service';
import { logger } from '@/lib/logger';

/**
 * DELETE /api/symptom-definitions/[definitionId]
 * Delete custom symptom definition
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ definitionId: string }> }
) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      logger.warn(
        { service: 'symptom-definition-detail-api', endpoint: 'DELETE /api/symptom-definitions/[definitionId]' },
        'Unauthorized request - no session'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { definitionId } = await params;

    logger.info(
      {
        service: 'symptom-definition-detail-api',
        endpoint: 'DELETE /api/symptom-definitions/[definitionId]',
        userId,
        definitionId,
      },
      'Deleting custom symptom definition'
    );

    // Step 2: Delete definition
    await deleteCustomSymptomDefinition(definitionId, userId);

    logger.info(
      {
        service: 'symptom-definition-detail-api',
        endpoint: 'DELETE /api/symptom-definitions/[definitionId]',
        userId,
        definitionId,
      },
      'Custom symptom definition deleted successfully'
    );

    return NextResponse.json(
      { message: 'Symptom definition deleted successfully', definitionId },
      { status: 200 }
    );
  } catch (error) {
    logger.error(
      {
        service: 'symptom-definition-detail-api',
        endpoint: 'DELETE /api/symptom-definitions/[definitionId]',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to delete symptom definition'
    );

    if (error instanceof Error && error.message.includes('not found or cannot be deleted')) {
      return NextResponse.json(
        { error: 'Symptom definition not found or cannot be deleted' },
        { status: 404 }
      );
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
