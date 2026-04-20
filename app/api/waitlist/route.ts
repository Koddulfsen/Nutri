/**
 * Waitlist API
 *
 * POST /api/waitlist — capture an email for alpha access waitlist.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { waitlistSignups } from '@/db/schema/waitlist';
import { logger } from '@/lib/logger';

const BodySchema = z.object({
  email: z.string().email(),
  source: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const { email, source } = parsed.data;

    try {
      await db.insert(waitlistSignups).values({ email, source: source ?? 'alpha-gate' });
    } catch (err: any) {
      // Unique constraint — already on waitlist, treat as success
      if (err?.code === '23505') {
        return NextResponse.json({ success: true, duplicate: true });
      }
      throw err;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      { service: 'waitlist-api', error: error instanceof Error ? error.message : String(error) },
      'Waitlist signup failed'
    );
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
