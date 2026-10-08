/**
 * GET /api/quick-add
 *
 * The pool the food list's suggestions are picked from: the user's most-used
 * foods with their usual amounts, and all their saved meals. Fetched once; the
 * browser picks what to show as the day's foods change
 * (lib/services/suggestion-ranking.ts). See lib/services/usuals.ts.
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getQuickAddPool } from '@/lib/services/usuals';

export const GET = withAuth(async ({ user }) => NextResponse.json(await getQuickAddPool(user.id)));
