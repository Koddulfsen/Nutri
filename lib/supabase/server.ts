/**
 * Supabase Server Client
 *
 * Purpose: Create Supabase client for server-side operations
 * Usage: Import in Server Components, Server Actions, API Routes
 *
 * Generated: 2025-11-10
 * Architecture: Phase 1 Feature System 02 (Authentication & User System)
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createDevClient, isDevAuthBypass } from './dev-shim'

/**
 * Creates a Supabase client for server-side operations
 *
 * This function must be called within an async context (Server Components, Server Actions, API Routes)
 * It automatically handles cookie reading/writing for session management
 *
 * @returns Supabase client instance
 *
 * @example
 * // In a Server Action
 * export async function signIn(formData: FormData) {
 *   'use server'
 *
 *   const supabase = createClient()
 *   const { data, error } = await supabase.auth.signInWithPassword({
 *     email: formData.get('email') as string,
 *     password: formData.get('password') as string
 *   })
 * }
 *
 * @example
 * // In an API Route
 * import { createClient } from '@/lib/supabase/server'
 *
 * export async function GET(request: Request) {
 *   const supabase = createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *   // ...
 * }
 */
export const createClient = async () => {
  // Local development runs against a bare Postgres with no Supabase project
  // attached, so route every call through the dev shim instead.
  //
  // The shim is cast to the real client type rather than widening this
  // function's return type: ~70 call sites rely on inference from it, and
  // returning `any` silently turns their callback parameters into implicit
  // anys, which fails the production build under `strict`.
  if (isDevAuthBypass()) {
    return createDevClient() as unknown as ReturnType<typeof createServerClient>
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
