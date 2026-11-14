/**
 * Privacy settings — what Nutri may do with your data, a copy of it, and the way out.
 *
 * Three parts: the consents that gate real features (withdraw or re-grant any time), a download of
 * everything held about you, and permanent account deletion. Consent is normally asked for in the
 * moment it is needed (see ConsentPrompt); this page is where it is managed afterwards.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SettingsNav from '@/app/components/settings/SettingsNav';
import PrivacyConsents from './PrivacyConsents';
import PrivacyData from './PrivacyData';
import './privacy.css';

export const metadata = {
  title: 'Privacy - Nutri',
  description: 'Manage what Nutri may do with your data, download it, or delete your account',
};

export const dynamic = 'force-dynamic';

export default async function PrivacySettingsPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');

  return (
    <div className="pv-page">
      <div className="pv-wrap">
        <Link href="/analysis" className="pv-back">&larr; Back to tracking</Link>
        <h1 className="pv-title">Privacy</h1>
        <p className="pv-lead">
          Nutri holds health information about you, so you decide what it is used for. You can change
          any of this at any time.
        </p>

        <SettingsNav />

        <PrivacyConsents />
        <PrivacyData userId={user.id} />
      </div>
    </div>
  );
}
