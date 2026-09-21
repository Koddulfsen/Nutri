/**
 * Symptom Logged Dates API Endpoint
 *
 * GET /api/symptoms/dates?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns array of date strings that have at least one symptom log.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSymptomDates } from '@/lib/services/day-dates';

const QuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    from: searchParams.get('from'),
    to: searchParams.get('to'),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const { from, to } = parsed.data;
  const userId = user.id;

  const dates = await getSymptomDates(userId, from, to);
  return NextResponse.json({ dates });
}
