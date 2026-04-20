/**
 * Permission System
 *
 * Centralized admin permission checking for server and API routes
 *
 * Usage:
 * - Server Components: const isAdmin = await isAdminUser(session.user)
 * - API Routes: const isAdmin = await isAdminUser(user)
 *
 * Environment:
 * - ADMIN_EMAILS: Comma-separated list of admin emails
 *
 * Architecture: Multi-Source Food Database System
 * Generated: 2025-11-18
 */

import type { User } from '@supabase/supabase-js';

/**
 * Check if a user has admin permissions
 *
 * @param user - Supabase user object (must have email)
 * @returns true if user is admin, false otherwise
 */
export async function isAdminUser(user: User | null | undefined): Promise<boolean> {
  if (!user?.email) {
    return false;
  }

  // Get admin emails from environment
  const adminEmailsString = process.env.ADMIN_EMAILS || '';
  const adminEmails = adminEmailsString
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0);

  // Check if user's email is in admin list
  return adminEmails.includes(user.email);
}

/**
 * Check if a user email has admin permissions
 *
 * @param email - User email address
 * @returns true if email is in admin list, false otherwise
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const adminEmailsString = process.env.ADMIN_EMAILS || '';
  const adminEmails = adminEmailsString
    .split(',')
    .map(e => e.trim())
    .filter(e => e.length > 0);

  return adminEmails.includes(email);
}

/**
 * Get list of all admin emails (for debugging)
 *
 * @returns Array of admin email addresses
 */
export function getAdminEmails(): string[] {
  const adminEmailsString = process.env.ADMIN_EMAILS || '';
  return adminEmailsString
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0);
}
