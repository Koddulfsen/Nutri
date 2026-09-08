/**
 * Admin Layout — Authorization Boundary
 *
 * Every page under /admin renders inside this layout, so the admin check happens
 * once here rather than being re-implemented (and forgotten) per page. Six of the
 * seven admin pages previously had no server-side check at all and relied entirely
 * on middleware.
 *
 * Middleware is deliberately NOT trusted as the only gate: it can be bypassed
 * (see CVE-2025-29927, where a spoofed `x-middleware-subrequest` header skipped
 * middleware entirely), and it does not run for every rendering path. This check
 * runs on the server, inside the render, and cannot be skipped by a header.
 *
 * `getUser()` is used rather than `getSession()`: getSession only decodes the
 * cookie, while getUser verifies it against the auth server.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/auth/permissions';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (!(await isAdminUser(user))) {
    // Non-admins are sent to the app rather than shown a 403, so admin routes
    // do not confirm their own existence to a curious signed-in user.
    redirect('/analysis');
  }

  return <>{children}</>;
}
