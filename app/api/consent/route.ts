/**
 * Consent API
 *
 * GET  /api/consent — the user's current consents
 * POST /api/consent — grant or withdraw one or more consents
 *
 * Only consents that gate something real are exposed (see lib/consent). Each change goes through the
 * DAL, which audit-logs the before and after.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/with-auth';
import { ensureUserConsent, updateUserConsent } from '@/lib/dal/consent';
import { invalidateDemographicsCache } from '@/lib/services/daily-value-service';
import { CONSENT_KEYS, type ConsentKey } from '@/lib/consent';

type ConsentFlags = Record<ConsentKey, boolean>;

function flagsOf(consent: ConsentFlags): ConsentFlags {
  return {
    aiProcessing: consent.aiProcessing,
    bodyMeasurements: consent.bodyMeasurements,
    sensitiveHealthData: consent.sensitiveHealthData,
  };
}

export const GET = withAuth(async ({ user }) => {
  const consent = await ensureUserConsent(user.id);
  return NextResponse.json({
    ...flagsOf(consent),
    updatedAt: consent.updatedAt.toISOString(),
  });
});

const UpdateSchema = z
  .object({
    aiProcessing: z.boolean().optional(),
    bodyMeasurements: z.boolean().optional(),
    sensitiveHealthData: z.boolean().optional(),
  })
  .strict()
  .refine((value) => CONSENT_KEYS.some((key) => value[key] !== undefined), {
    message: 'At least one consent must be provided',
  });

export const POST = withAuth(
  async ({ user, input }) => {
    // A user with no consent row yet (a profile older than the wiring) gets one before the update.
    await ensureUserConsent(user.id);
    const updated = await updateUserConsent(user.id, input);

    // Demographics are cached for five minutes, and body weight and life stage are only returned while
    // their consent stands — so a withdrawal has to reach the read path now, not eventually. Dropping the
    // cache is best-effort by construction (it is a Map delete) and must never fail the write that
    // already landed.
    invalidateDemographicsCache(user.id);

    return NextResponse.json({
      success: true,
      consent: {
        ...flagsOf(updated),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  },
  { schema: UpdateSchema }
);
