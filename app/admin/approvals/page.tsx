/**
 * Admin Food Approvals Page
 *
 * Server component that checks admin permissions and renders approval dashboard
 *
 * Route: /admin/approvals
 * Access: Admin only
 *
 * Architecture: Multi-Source Food Database System
 * Generated: 2025-11-18
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/auth/permissions';
import ApprovalDashboard from './ApprovalDashboard';

export default async function AdminApprovalsPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect if not logged in
  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const isAdmin = await isAdminUser(user);

  if (!isAdmin) {
    redirect('/analysis');
  }

  return <ApprovalDashboard user={user} />;
}
