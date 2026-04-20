import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/auth/permissions';
import DashboardClient from './DashboardClient';
import AlphaGate from '@/app/components/AlphaGate';

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

  // Alpha gate: only admins can access the dashboard
  if (!(await isAdminUser(user))) {
    return <AlphaGate />;
  }

  return <DashboardClient user={user} />;
}
