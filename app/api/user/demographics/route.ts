/**
 * User Demographics API Endpoint
 *
 * GET /api/user/demographics - Get user demographic profile
 * PATCH /api/user/demographics - Update user demographics
 *
 * Purpose: Manage user demographics for personalized daily values
 * Pattern: Supabase auth + daily-value-service
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  getUserDemographics,
  updateUserDemographics,
  getEffectiveAgeGroup,
  type AgeGroup,
  type BiologicalSex,
  type LifeStage,
  type SourcePreference,
} from '@/lib/services/daily-value-service';
import { logger } from '@/lib/logger';

/**
 * Valid values for enums
 */
const ageGroups = [
  'INFANT_0_6M',
  'INFANT_7_12M',
  'CHILD_1_3Y',
  'CHILD_4_8Y',
  'CHILD_9_13Y',
  'TEEN_14_18Y',
  'ADULT_19_30Y',
  'ADULT_31_50Y',
  'ADULT_51_70Y',
  'ADULT_71_PLUS',
] as const;

const biologicalSexes = ['MALE', 'FEMALE'] as const;
const lifeStages = ['NONE', 'PREGNANT', 'LACTATING'] as const;
const sourcePreferences = ['AVERAGE', 'USA_CANADA', 'EU', 'UK', 'JAPAN', 'CHINA', 'AU_NZ'] as const;

/**
 * PATCH body schema
 */
const UpdateDemographicsSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').nullable().optional(),
  biologicalSex: z.enum(biologicalSexes).nullable().optional(),
  lifeStage: z.enum(lifeStages).optional(),
  manualAgeGroup: z.enum(ageGroups).nullable().optional(),
  dvSourcePreference: z.enum(sourcePreferences).optional(),
});

/**
 * GET /api/user/demographics
 * Get user demographic profile
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
        { service: 'demographics-api', endpoint: 'GET /api/user/demographics' },
        'Unauthorized request - no session'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    logger.debug(
      { service: 'demographics-api', endpoint: 'GET /api/user/demographics', userId },
      'Fetching user demographics'
    );

    // Step 2: Get demographics
    const demographics = await getUserDemographics(userId);

    if (!demographics) {
      return NextResponse.json({
        birthDate: null,
        biologicalSex: null,
        lifeStage: 'NONE',
        manualAgeGroup: null,
        dvSourcePreference: 'AVERAGE',
        effectiveAgeGroup: null,
        hasCompleteDemographics: false,
      });
    }

    // Step 3: Calculate effective age group
    const effectiveAgeGroup = getEffectiveAgeGroup(demographics);
    const hasCompleteDemographics = !!(effectiveAgeGroup && demographics.biologicalSex);

    logger.info(
      {
        service: 'demographics-api',
        endpoint: 'GET /api/user/demographics',
        userId,
        hasCompleteDemographics,
      },
      'User demographics fetched'
    );

    return NextResponse.json({
      birthDate: demographics.birthDate?.toISOString().split('T')[0] || null,
      biologicalSex: demographics.biologicalSex,
      lifeStage: demographics.lifeStage,
      manualAgeGroup: demographics.manualAgeGroup,
      dvSourcePreference: demographics.dvSourcePreference,
      effectiveAgeGroup,
      hasCompleteDemographics,
    });
  } catch (error) {
    logger.error(
      {
        service: 'demographics-api',
        endpoint: 'GET /api/user/demographics',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to fetch user demographics'
    );

    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/demographics
 * Update user demographics
 */
export async function PATCH(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      logger.warn(
        { service: 'demographics-api', endpoint: 'PATCH /api/user/demographics' },
        'Unauthorized request - no session'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Step 2: Parse and validate body
    const body = await request.json();
    const validationResult = UpdateDemographicsSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'demographics-api',
          endpoint: 'PATCH /api/user/demographics',
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

    const updates = validationResult.data;

    logger.debug(
      {
        service: 'demographics-api',
        endpoint: 'PATCH /api/user/demographics',
        userId,
        updates: Object.keys(updates),
      },
      'Updating user demographics'
    );

    // Step 3: Convert and update
    const updateData: Parameters<typeof updateUserDemographics>[1] = {};

    if (updates.birthDate !== undefined) {
      updateData.birthDate = updates.birthDate ? new Date(updates.birthDate) : null;
    }
    if (updates.biologicalSex !== undefined) {
      updateData.biologicalSex = updates.biologicalSex as BiologicalSex | null;
    }
    if (updates.lifeStage !== undefined) {
      updateData.lifeStage = updates.lifeStage as LifeStage;
    }
    if (updates.manualAgeGroup !== undefined) {
      updateData.manualAgeGroup = updates.manualAgeGroup as AgeGroup | null;
    }
    if (updates.dvSourcePreference !== undefined) {
      updateData.dvSourcePreference = updates.dvSourcePreference as SourcePreference;
    }

    await updateUserDemographics(userId, updateData);

    // Step 4: Return updated demographics
    const updated = await getUserDemographics(userId);
    const effectiveAgeGroup = updated ? getEffectiveAgeGroup(updated) : null;
    const hasCompleteDemographics = !!(effectiveAgeGroup && updated?.biologicalSex);

    logger.info(
      {
        service: 'demographics-api',
        endpoint: 'PATCH /api/user/demographics',
        userId,
        updatedFields: Object.keys(updates),
      },
      'User demographics updated'
    );

    return NextResponse.json({
      success: true,
      demographics: updated
        ? {
            birthDate: updated.birthDate?.toISOString().split('T')[0] || null,
            biologicalSex: updated.biologicalSex,
            lifeStage: updated.lifeStage,
            manualAgeGroup: updated.manualAgeGroup,
            dvSourcePreference: updated.dvSourcePreference,
            effectiveAgeGroup,
            hasCompleteDemographics,
          }
        : null,
    });
  } catch (error) {
    logger.error(
      {
        service: 'demographics-api',
        endpoint: 'PATCH /api/user/demographics',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to update user demographics'
    );

    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
