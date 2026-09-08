/**
 * API Guard Helpers
 *
 * Thin wrappers for authenticating and authorizing API requests.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from './permissions';

/**
 * Require the caller to be signed in. Returns a NextResponse with 401 on failure,
 * or `null` if the request is authorized.
 *
 * Use this for endpoints that expose no user data but should not be free for
 * anonymous callers to hammer — e.g. routes that proxy to a rate-limited external
 * API, or that cost money per call.
 *
 * Prefer `withAuth()` from './with-auth' for new routes; this exists for guarding
 * handlers that have not been migrated to the wrapper yet.
 */
export async function requireUser(): Promise<NextResponse<{ error: string }> | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/**
 * Require the caller to be an admin. Returns a NextResponse with 401/403 on failure,
 * or `null` if the request is authorized.
 */
export async function requireAdmin(): Promise<NextResponse<{ error: string }> | null> {
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
