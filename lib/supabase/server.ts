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
 *   const { data: { session } } = await supabase.auth.getSession()
 *   // ...
 * }
 */
export const createClient = async () => {
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
