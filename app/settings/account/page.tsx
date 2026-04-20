/**
 * Account Settings Page
 *
 * Purpose: User profile management (avatar, name, email, password)
 * Protected route: Requires authentication
 *
 * Extracted from: settings-account.html
 * Generated: 2025-11-10
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfileForm from '@/app/components/settings/ProfileForm';
import SettingsNav from '@/app/components/settings/SettingsNav';
import { ChangePasswordButton, EnableMFAButton, DeleteAccountButton } from '@/app/components/settings/SecurityButtons';

export const metadata = {
  title: 'Account Settings - Nutri',
  description: 'Manage your Nutri account settings',
};

export default async function AccountSettingsPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const profileData = {
    id: profile?.id || '',
    userId: user.id,
    fullName: profile?.full_name || null,
    avatarUrl: profile?.avatar_url || null,
    email: user.email || ''
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan to-magenta bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-white/70">
            Manage your profile, security, and privacy preferences
          </p>
        </div>

        {/* Settings Navigation */}
        <SettingsNav />

        {/* Profile Form */}
        <ProfileForm profile={profileData} />

        {/* Password Section */}
        <section className="bg-white/5 border border-white/15 rounded-2xl p-8 mb-6">
          <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-white/15 text-cyan-light">
            Password & Security
          </h2>

          <div className="mb-6">
            <p className="text-white/70 text-sm mb-4">
              Change your password or enable two-factor authentication
            </p>
            <ChangePasswordButton />
          </div>

          <div className="pt-4 border-t border-white/10">
            <h3 className="text-sm font-semibold mb-2 text-white">
              Two-Factor Authentication
            </h3>
            <p className="text-white/60 text-xs mb-4">
              Add an extra layer of security to your account
            </p>
            <EnableMFAButton />
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-red/10 border border-red/30 rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-red/30 text-red">
            Danger Zone
          </h2>

          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-white">
              Delete Account
            </h3>
            <p className="text-white/60 text-xs mb-4">
              Once you delete your account, there is no going back. All your data will be permanently removed.
            </p>
            <DeleteAccountButton />
          </div>
        </section>
      </div>
    </div>
  );
}
