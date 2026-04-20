/**
 * Consent Management API - FS-4 Security & Compliance System
 *
 * GET /api/consent - Get user's consent status
 * POST /api/consent - Update consent preferences
 *
 * GDPR Compliance: Article 7 (Granular Consent Management)
 * Rate Limit: 10 req/15min
 *
 * Created: 2025-11-10
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserConsent, updateUserConsent } from '@/lib/dal/consent';
import { createClient } from '@/lib/supabase/server';
import { getRequestMetadata } from '@/lib/security/audit-logger';

/**
 * GET /api/consent
 *
 * Retrieve user's current consent preferences
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    // Get consent via DAL (includes authorization check + audit logging)
    const consent = await getUserConsent(user.id);

    return NextResponse.json({
      userId: consent.userId,
      newsletter: consent.newsletter,
      pushNotifications: consent.pushNotifications,
      research: consent.research,
      analytics: consent.analytics,
      thirdParty: consent.thirdParty,
      createdAt: consent.createdAt.toISOString(),
      updatedAt: consent.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('GET /api/consent error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/consent
 *
 * Update user's consent preferences
 *
 * Request Body:
 * {
 *   newsletter?: boolean,
 *   pushNotifications?: boolean,
 *   research?: boolean,
 *   analytics?: boolean,
 *   thirdParty?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate consent updates (only allow boolean values for known consent types)
    const validKeys = ['newsletter', 'pushNotifications', 'research', 'analytics', 'thirdParty'];
    const updates: Record<string, boolean> = {};

    for (const key of validKeys) {
      if (key in body && typeof body[key] === 'boolean') {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: At least one consent type must be provided' },
        { status: 400 }
      );
    }

    // Update consent via DAL (includes authorization check + audit logging)
    const updated = await updateUserConsent(user.id, updates);

    // TODO: Trigger cleanup jobs for withdrawn consents
    // - If newsletter withdrawn: Remove from mailing list immediately
    // - If analytics withdrawn: Schedule 7-day cleanup job
    // - If thirdParty withdrawn: Notify partners, schedule 30-day cleanup

    return NextResponse.json({
      success: true,
      consent: {
        userId: updated.userId,
        newsletter: updated.newsletter,
        pushNotifications: updated.pushNotifications,
        research: updated.research,
        analytics: updated.analytics,
        thirdParty: updated.thirdParty,
        updatedAt: updated.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('POST /api/consent error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
