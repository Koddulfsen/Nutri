/**
 * Supabase Browser Client
 *
 * Purpose: Create Supabase client for client-side components
 * Usage: Import in Client Components only
 *
 * Generated: 2025-11-10
 * Architecture: Phase 1 Feature System 02 (Authentication & User System)
 */

import { createBrowserClient } from '@supabase/ssr'
// Imported from dev-user (not dev-shim) so the Node-only `postgres` driver
// never gets pulled into the client bundle.
import { createDevBrowserClient } from './dev-user'

/**
 * Creates a Supabase client for browser-side operations
 *
 * @returns Supabase client instance
 *
 * @example
 * import { supabase } from '@/lib/supabase/client'
 *
 * const { data, error } = await supabase.auth.signInWithPassword({
 *   email: 'user@example.com',
 *   password: 'password123'
 * })
 */
// The bypass flag needs the NEXT_PUBLIC_ prefix to be readable in the browser.
// Cast the shim to the real client type rather than typing this `any` — callers
// infer from it, and `any` would silently erase their type checking.
export const supabase =
  process.env.NODE_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'
    ? (createDevBrowserClient() as unknown as ReturnType<typeof createBrowserClient>)
    : createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
