/**
 * Meals Dates API Endpoint
 *
 * GET /api/meals/dates?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns array of date strings that have at least one food item logged.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { mealLogs, mealItems } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

const QuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
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
  const userId = session.user.id;

  // Get distinct dates where the user has at least one meal item
  const rows = await db
    .selectDistinct({ date: mealLogs.date })
    .from(mealLogs)
    .innerJoin(mealItems, eq(mealItems.mealLogId, mealLogs.id))
    .where(
      and(
        eq(mealLogs.userId, userId),
        gte(mealLogs.date, from),
        lte(mealLogs.date, to),
        eq(mealLogs.isActive, true),
      )
    );

  const dates = rows.map((r) => r.date);
  return NextResponse.json({ dates });
}
