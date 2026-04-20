/**
 * API Guard Helpers
 *
 * Thin wrappers for authenticating and authorizing API requests.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from './permissions';

/**
 * Require the caller to be an admin. Returns a NextResponse with 401/403 on failure,
 * or `null` if the request is authorized.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await isAdminUser(user))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}
