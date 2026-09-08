/**
 * Symptom Definitions API Endpoint
 *
 * GET /api/symptom-definitions - Get all symptom definitions (system + custom)
 * POST /api/symptom-definitions - Create custom symptom definition
 *
 * Purpose: Manage symptom definitions
 * Pattern: Supabase auth + Zod validation + symptom-service
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSymptomDefinitions, createCustomSymptomDefinition } from '@/lib/services/symptom-service';
import { ensureUserProfile } from '@/lib/services/user-service';
import { logger } from '@/lib/logger';

/**
 * POST body schema
 */
const CreateDefinitionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  category: z.enum(['ENERGY_MENTAL', 'DIGESTIVE', 'PHYSICAL']),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
});

/**
 * GET /api/symptom-definitions
 * Get all symptom definitions available to user
 */
export async function GET() {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.warn(
        { service: 'symptom-definitions-api', endpoint: 'GET /api/symptom-definitions' },
        'Unauthorized request - no session'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    logger.debug(
      { service: 'symptom-definitions-api', endpoint: 'GET /api/symptom-definitions', userId },
      'Fetching symptom definitions'
    );

    // Step 2: Fetch definitions
    const definitions = await getSymptomDefinitions(userId);

    // Group by category for easier frontend consumption
    const grouped = {
      ENERGY_MENTAL: definitions.filter((d) => d.category === 'ENERGY_MENTAL'),
      DIGESTIVE: definitions.filter((d) => d.category === 'DIGESTIVE'),
      PHYSICAL: definitions.filter((d) => d.category === 'PHYSICAL'),
    };

    logger.info(
      {
        service: 'symptom-definitions-api',
        endpoint: 'GET /api/symptom-definitions',
        userId,
        count: definitions.length,
      },
      'Symptom definitions fetched successfully'
    );

    return NextResponse.json({
      definitions,
      grouped,
      total: definitions.length,
    });
  } catch (error) {
    logger.error(
      {
        service: 'symptom-definitions-api',
        endpoint: 'GET /api/symptom-definitions',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to fetch symptom definitions'
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
 * POST /api/symptom-definitions
 * Create custom symptom definition
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.warn(
        { service: 'symptom-definitions-api', endpoint: 'POST /api/symptom-definitions' },
        'Unauthorized request - no session'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Step 2: Parse and validate request body
    const body = await request.json();
    const validationResult = CreateDefinitionSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'symptom-definitions-api',
          endpoint: 'POST /api/symptom-definitions',
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

    const { name, category, description, icon } = validationResult.data;

    // Step 3: Ensure user profile exists
    await ensureUserProfile(userId, {
      fullName: user.user_metadata?.full_name || user.user_metadata?.name,
      avatarUrl: user.user_metadata?.avatar_url,
    });

    logger.info(
      {
        service: 'symptom-definitions-api',
        endpoint: 'POST /api/symptom-definitions',
        userId,
        name,
        category,
      },
      'Creating custom symptom definition'
    );

    // Step 4: Create definition
    const definition = await createCustomSymptomDefinition(userId, {
      name,
      category,
      description,
      icon,
    });

    logger.info(
      {
        service: 'symptom-definitions-api',
        endpoint: 'POST /api/symptom-definitions',
        userId,
        definitionId: definition.id,
      },
      'Custom symptom definition created successfully'
    );

    return NextResponse.json(
      {
        id: definition.id,
        name: definition.name,
        slug: definition.slug,
        category: definition.category,
        description: definition.description,
        icon: definition.icon,
        isSystemDefined: definition.isSystemDefined,
        sortOrder: definition.sortOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error(
      {
        service: 'symptom-definitions-api',
        endpoint: 'POST /api/symptom-definitions',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to create custom symptom definition'
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
