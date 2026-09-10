import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ResetPasswordForm from '@/app/components/auth/ResetPasswordForm';

export const metadata = {
  title: 'Set a new password - Nutri',
};

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>;
};

/**
 * Where the password-reset email lands.
 *
 * resetPassword() has always pointed reset emails at /auth/reset-password, and
 * this page did not exist — the link 404'd, so nobody who forgot a password
 * could ever set a new one. Only /forgot-password (the request form) was built.
 *
 * Supabase sends a one-time `code`. Exchanging it establishes a session for that
 * user, which is what lets updatePassword() call updateUser() without asking for
 * the old password. The exchange happens here, before the form renders, so a
 * dead or already-used link fails immediately with something readable instead of
 * after the user has typed a new password twice.
 */
export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (params.error) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(params.error_description || params.error)}`
    );
  }

  if (!params.code) {
    redirect('/forgot-password?error=' + encodeURIComponent('That link is missing its code. Request a new one.'));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(params.code);

  if (error) {
    // Reset links are single-use and time-limited, and this is the common case:
    // an expired link, or one already opened. Say so plainly rather than
    // surfacing the raw provider message.
    redirect(
      '/forgot-password?error=' +
        encodeURIComponent('That reset link has expired or was already used. Request a new one.')
    );
  }

  return <ResetPasswordForm />;
}
