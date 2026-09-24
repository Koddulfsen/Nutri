/**
 * Data Export API - GDPR Article 15/20 (Access & Portability)
 *
 * GET /api/user/export - Returns the caller's own data as a downloadable JSON file.
 *
 * Synchronous, direct download — no async job, no email-a-link flow. The
 * previous version recorded an `export_requests` row and promised a download
 * "within 5 minutes" with the actual collection/generation/upload/email steps
 * left as TODOs; `download_url` was never populated. At alpha's data volume per
 * user, generating the export inline is simpler and has fewer ways to silently
 * fail than a queued job nobody has built yet. Revisit if export size becomes
 * a real latency problem.
 *
 * Rate limit: 3 req/24hr per user, fails closed (see lib/rate-limit).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAudit, getRequestMetadata } from '@/lib/security/audit-logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { db } from '@/db';
import { userProfiles, userConsent, apiKeys, mealLogs, mealItems, userCustomDailyValues } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserDemographics } from '@/lib/services/daily-value-service';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required' },
      { status: 401 }
    );
  }

  const rateLimit = await checkRateLimit({
    key: `export:${user.id}`,
    limit: 3,
    windowSeconds: 24 * 60 * 60,
    failMode: 'closed',
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many export requests. Try again later.' },
      { status: 429 }
    );
  }

  try {
    const [profile, demographics, consent, apiKeyRows, meals] = await Promise.all([
      db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, user.id) }),
      getUserDemographics(user.id), // decrypts life_stage via the real service path
      db.query.userConsent.findFirst({ where: eq(userConsent.userId, user.id) }),
      db.query.apiKeys.findMany({ where: eq(apiKeys.userId, user.id) }),
      db.query.mealLogs.findMany({
        where: eq(mealLogs.userId, user.id),
        with: { items: true },
      }),
    ]);

    const customDailyValues = await db.query.userCustomDailyValues.findMany({
      where: eq(userCustomDailyValues.userId, user.id),
    });

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      account: {
        userId: user.id,
        email: user.email,
      },
      profile: profile
        ? {
            fullName: profile.fullName,
            avatarUrl: profile.avatarUrl,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          }
        : null,
      demographics: demographics
        ? {
            birthYearMonth:
              demographics.birthYear && demographics.birthMonth
                ? `${demographics.birthYear}-${String(demographics.birthMonth).padStart(2, '0')}`
                : null,
            biologicalSex: demographics.biologicalSex,
            lifeStage: demographics.lifeStage,
            manualAgeGroup: demographics.manualAgeGroup,
            dvSourcePreference: demographics.dvSourcePreference,
          }
        : null,
      consent: consent
        ? {
            newsletter: consent.newsletter,
            pushNotifications: consent.pushNotifications,
            research: consent.research,
            analytics: consent.analytics,
            thirdParty: consent.thirdParty,
            sensitiveHealthData: consent.sensitiveHealthData,
            aiProcessing: consent.aiProcessing,
            updatedAt: consent.updatedAt,
          }
        : null,
      // Never the key hash — only what identifies the key to its owner.
      apiKeys: apiKeyRows.map((k) => ({
        name: k.name,
        keyPrefix: k.keyPrefix,
        createdAt: k.createdAt,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        isRevoked: k.isRevoked,
      })),
      customDailyValues: customDailyValues.map((v) => ({
        compoundId: v.compoundId,
        value: v.value,
        unit: v.unit,
        note: v.note,
        createdAt: v.createdAt,
      })),
      meals: meals.map((m) => ({
        date: m.date,
        mealType: m.mealType,
        loggedAt: m.loggedAt,
        items: m.items.map((i) => ({
          foodId: i.foodId,
          portionSize: i.portionSize,
          portionType: i.portionType,
          notes: i.notes,
        })),
      })),
    };

    const metadata = getRequestMetadata(request);
    await logAudit({
      userId: user.id,
      action: 'EXPORT',
      resourceType: 'user_data',
      resourceId: user.id,
      metadata: { format: 'json', mealCount: meals.length },
      ...metadata,
    });

    const body = JSON.stringify(exportPayload, null, 2);
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="nutri-export-${user.id}.json"`,
      },
    });
  } catch (error) {
    console.error('GET /api/user/export error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Export failed. No data was modified — try again or contact support.' },
      { status: 500 }
    );
  }
}
