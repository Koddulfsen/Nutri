/**
 * Account Deletion API - GDPR Article 17 (Right to Erasure)
 *
 * POST /api/user/delete-account - Immediately and permanently delete the
 * caller's own account and all associated data.
 *
 * No grace period: per the retention decision in docs/DATA-SCOPE-DECISIONS.md,
 * deletion means deletion, now, not a 30-day soft-delete window. The previous
 * version of this endpoint recorded a `deletion_requests` row and told users
 * their data would be deleted in 30 days; nothing ever consumed that table, so
 * it was a promise the system did not keep. That table and flow are retired —
 * this endpoint does the actual deletion synchronously and reports what happened.
 *
 * Rate limit: 3 req/24hr per user, fails closed (see lib/rate-limit).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { logAudit, getRequestMetadata } from '@/lib/security/audit-logger';
import { checkDeleteAccountRateLimit } from '@/lib/rate-limit';
import { db } from '@/db';
import { userProfiles, userConsent, apiKeys, userEncryptionKeys } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required' },
      { status: 401 }
    );
  }

  const rateLimit = await checkDeleteAccountRateLimit(user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many deletion attempts. Try again later.' },
      { status: 429 }
    );
  }

  const metadata = getRequestMetadata(request);

  try {
    // Audit log BEFORE deleting — once the profile row is gone there is nothing
    // left to attribute the action to. audit_log.user_id has no FK constraint,
    // so the row survives the user's deletion (this is the expected, standard
    // shape for a security audit trail).
    await logAudit({
      userId: user.id,
      action: 'DELETE',
      resourceType: 'user_account',
      resourceId: user.id,
      metadata: { email: user.email, immediate: true },
      ...metadata,
    });

    // user_consent, api_keys, and user_encryption_keys have NO foreign key to
    // user_profiles (verified via \d on the live schema) — deleting the profile
    // row does not cascade to them, so each must be deleted explicitly.
    await db.delete(userConsent).where(eq(userConsent.userId, user.id));
    await db.delete(apiKeys).where(eq(apiKeys.userId, user.id));
    await db.delete(userEncryptionKeys).where(eq(userEncryptionKeys.userId, user.id));

    // Deleting user_profiles cascades (verified via \d on the live schema) to:
    // meal_logs -> meal_items, symptom_logs, symptom_definitions (custom),
    // user_custom_daily_values, daily_totals, favorite_foods,
    // saved_meal_templates, ag_ui_logs. It sets NULL on food_approvals,
    // food_sources, foods, manual_review_queue, quarantine_imports — correct,
    // those are shared content records, not this user's personal data.
    const deletedProfile = await db
      .delete(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .returning({ id: userProfiles.id });

    if (deletedProfile.length === 0) {
      // No profile row existed — still proceed to delete the auth user below,
      // since the account itself is what the user asked to remove.
    }

    // Delete the actual Supabase Auth user. This requires the service-role key
    // — the one legitimate use of it in this codebase, since deleting an auth
    // user is an admin-only operation with no user-scoped equivalent. Nothing
    // in Postgres FK-cascades from auth.users to public.* here (they're
    // matched by UUID convention, not a real FK across schemas), which is why
    // every public-schema row above had to be deleted explicitly first.
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
      // The user's app data is already gone at this point. Report the auth
      // deletion failure honestly rather than claiming full success.
      return NextResponse.json(
        {
          error: 'Partial deletion',
          message: 'Your data was deleted, but removing your login credentials failed. Contact support to finish closing your account.',
          detail: deleteAuthError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
    });
  } catch (error) {
    console.error('POST /api/user/delete-account error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Account deletion failed. No partial changes were confirmed — contact support.' },
      { status: 500 }
    );
  }
}
