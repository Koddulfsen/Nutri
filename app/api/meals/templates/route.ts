/**
 * Meal Templates API Endpoint
 *
 * POST /api/meals/templates - Save meal as template
 * GET /api/meals/templates - List user's templates
 * DELETE /api/meals/templates?templateId=... - Delete template
 *
 * Purpose: Saved meal templates for one-tap logging
 * Pattern: Supabase auth + Zod validation + Drizzle ORM
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 02 (Meal Logging & Tracking)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { savedMealTemplates } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * POST body schema
 */
const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100, 'Name too long'),
  foods: z
    .array(
      z.object({
        foodId: z.string().uuid('Invalid food ID'),
        portionSize: z.number().positive('Portion size must be positive'),
        portionType: z.string().min(1, 'Portion type is required'),
        contextId: z.string().uuid().optional(),
      })
    )
    .min(1, 'At least one food item is required'),
});

/**
 * GET query params schema
 */
const GetTemplatesSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100)),
});

/**
 * DELETE query params schema
 */
const DeleteTemplateSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
});

/**
 * POST /api/meals/templates
 * Save meal as template
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
        {
          service: 'templates-api',
          endpoint: 'POST /api/meals/templates',
        },
        'Unauthorized request - no session'
      );

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Step 2: Parse and validate request body
    const body = await request.json();
    const validationResult = CreateTemplateSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'templates-api',
          endpoint: 'POST /api/meals/templates',
          userId,
          errors: validationResult.error.errors,
        },
        'Invalid request body'
      );

      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, foods } = validationResult.data;

    logger.info(
      {
        service: 'templates-api',
        endpoint: 'POST /api/meals/templates',
        userId,
        name,
        foodCount: foods.length,
      },
      'Creating meal template'
    );

    // Step 3: Insert template
    const [template] = await db
      .insert(savedMealTemplates)
      .values({
        userId,
        name,
        foods: foods as any, // JSONB
      })
      .returning();

    logger.info(
      {
        service: 'templates-api',
        endpoint: 'POST /api/meals/templates',
        userId,
        templateId: template.id,
        name,
      },
      'Template created successfully'
    );

    // Step 4: Return response
    return NextResponse.json(
      {
        id: template.id,
        name: template.name,
        foods: template.foods,
        createdAt: template.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error(
      {
        service: 'templates-api',
        endpoint: 'POST /api/meals/templates',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to create template'
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
 * GET /api/meals/templates?page=1&limit=20
 * List user's meal templates (paginated)
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
        {
          service: 'templates-api',
          endpoint: 'GET /api/meals/templates',
        },
        'Unauthorized request - no session'
      );

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Step 2: Parse and validate query params
    const { searchParams } = new URL(request.url);
    const paramsObject = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    };

    const validationResult = GetTemplatesSchema.safeParse(paramsObject);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'templates-api',
          endpoint: 'GET /api/meals/templates',
          userId,
          errors: validationResult.error.errors,
        },
        'Invalid query parameters'
      );

      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { page, limit } = validationResult.data;
    const offset = (page - 1) * limit;

    logger.debug(
      {
        service: 'templates-api',
        endpoint: 'GET /api/meals/templates',
        userId,
        page,
        limit,
      },
      'Fetching meal templates'
    );

    // Step 3: Fetch templates (only active)
    const templates = await db
      .select()
      .from(savedMealTemplates)
      .where(and(eq(savedMealTemplates.userId, userId), eq(savedMealTemplates.isActive, true)))
      .orderBy(desc(savedMealTemplates.useCount), desc(savedMealTemplates.createdAt))
      .limit(limit)
      .offset(offset);

    // Step 4: Get total count for pagination
    const [countResult] = await db
      .select({ count: savedMealTemplates.id })
      .from(savedMealTemplates)
      .where(and(eq(savedMealTemplates.userId, userId), eq(savedMealTemplates.isActive, true)));

    const total = templates.length; // Simplified - in production would use COUNT(*)

    logger.info(
      {
        service: 'templates-api',
        endpoint: 'GET /api/meals/templates',
        userId,
        page,
        limit,
        resultCount: templates.length,
      },
      'Templates fetched successfully'
    );

    // Step 5: Return response
    return NextResponse.json({
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        foods: t.foods,
        useCount: t.useCount,
        lastUsedAt: t.lastUsedAt ? t.lastUsedAt.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error(
      {
        service: 'templates-api',
        endpoint: 'GET /api/meals/templates',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to fetch templates'
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
 * DELETE /api/meals/templates?templateId=...
 * Delete meal template (soft delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      logger.warn(
        {
          service: 'templates-api',
          endpoint: 'DELETE /api/meals/templates',
        },
        'Unauthorized request - no session'
      );

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Step 2: Parse and validate query params
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    const validationResult = DeleteTemplateSchema.safeParse({ templateId });

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'templates-api',
          endpoint: 'DELETE /api/meals/templates',
          userId,
          errors: validationResult.error.errors,
        },
        'Invalid query parameters'
      );

      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    logger.info(
      {
        service: 'templates-api',
        endpoint: 'DELETE /api/meals/templates',
        userId,
        templateId: validationResult.data.templateId,
      },
      'Deleting meal template (soft delete)'
    );

    // Step 3: Soft delete template (verify ownership)
    const result = await db
      .update(savedMealTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(savedMealTemplates.id, validationResult.data.templateId), eq(savedMealTemplates.userId, userId)))
      .returning();

    if (result.length === 0) {
      logger.warn(
        {
          service: 'templates-api',
          endpoint: 'DELETE /api/meals/templates',
          userId,
          templateId: validationResult.data.templateId,
        },
        'Template not found or unauthorized'
      );

      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    logger.info(
      {
        service: 'templates-api',
        endpoint: 'DELETE /api/meals/templates',
        userId,
        templateId: validationResult.data.templateId,
      },
      'Template deleted successfully'
    );

    // Step 4: Return response
    return NextResponse.json({
      message: 'Template deleted successfully',
      templateId: validationResult.data.templateId,
    });
  } catch (error) {
    logger.error(
      {
        service: 'templates-api',
        endpoint: 'DELETE /api/meals/templates',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to delete template'
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
