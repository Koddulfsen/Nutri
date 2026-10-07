/**
 * GET /api/quick-add?date=YYYY-MM-DD
 *
 * The food list's suggestions for that day (up to 5, saved meals and usual
 * foods mixed, nothing already logged that day) and all saved meals for
 * My meals. See lib/services/usuals.ts.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/with-auth';
import { getQuickAdd } from '@/lib/services/usuals';

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

export const GET = withAuth(
  async ({ user, input }) => NextResponse.json(await getQuickAdd(user.id, input.date)),
  { schema: QuerySchema, source: 'query' }
);
