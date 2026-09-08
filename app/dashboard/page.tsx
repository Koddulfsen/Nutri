import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'Dashboard - Nutri',
  description: 'Trends and insights across your nutrition and wellness data',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // The alpha gate is gone: anyone who signs up gets the real dashboard.
  // Signing in is still required — this page reads the caller's own data.
  return <DashboardClient user={user} />;
}
