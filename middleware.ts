/**
 * Next.js Middleware - Route Protection & Session Validation
 *
 * Purpose: Protect routes requiring authentication, validate session version for global logout
 * Runs: On Vercel Edge Network before page load
 *
 * Generated: 2025-11-10
 * Architecture: Phase 1 Feature System 02 (Authentication & User System)
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware function that runs on every request
 *
 * Flow:
 * 1. Add security headers (FS-4)
 * 2. Get session from cookies
 * 3. Check if route requires authentication
 * 4. Redirect unauthenticated users to /login
 * 5. Validate session version (for global logout)
 * 6. Allow authenticated requests to proceed
 */
export async function middleware(request: NextRequest) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/nutri'

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // FS-4: Apply security headers to all routes
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // Next.js requires unsafe-eval
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com; " +
    "connect-src 'self' https://*.supabase.co; " +
    "frame-ancestors 'none';"
  )

  // Strict-Transport-Security (HSTS) - production only
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get session
  const { data: { session } } = await supabase.auth.getSession()

  // Define protected routes (require authentication)
  const protectedPaths = [
    '/dashboard',
    '/profile',
    '/settings',
    '/analysis',
    '/admin',
    // '/compounds' removed - Phase 1 requires public access for free tier users
    '/api/user',
    '/api/auth/mfa',
    '/api/auth/api-keys',
    '/api/audit-log'
  ]

  // Define admin-only routes
  const adminPaths = [
    '/admin',
    '/api/foods/pending',
  ]

  // Check for admin API routes that use dynamic segments
  const isAdminApproveRoute = /^\/api\/foods\/[^/]+\/approve$/.test(request.nextUrl.pathname)

  // Check if current path requires authentication
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Check if current path requires admin access
  const isAdminPath = adminPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  ) || isAdminApproveRoute

  // Redirect unauthenticated users to login
  if (isProtectedPath && !session) {
    const redirectUrl = new URL(`${basePath}/login`, request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check admin permissions for admin-only routes
  if (isAdminPath && session) {
    // Get admin emails from environment
    const adminEmailsString = process.env.ADMIN_EMAILS || ''
    const adminEmails = adminEmailsString
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0)

    const isAdmin = adminEmails.includes(session.user.email || '')

    // Redirect non-admin users to analysis page
    if (!isAdmin) {
      return NextResponse.redirect(new URL(`${basePath}/analysis`, request.url))
    }
  }

  // If authenticated, validate session version (global logout)
  if (session) {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('session_version')
        .eq('user_id', session.user.id)
        .single()

      // Get session version from user metadata (set during login)
      const tokenVersion = session.user.user_metadata?.session_version || 1

      // If profile version > token version, session is invalid (password changed or logout-all)
      if (profile && profile.session_version > tokenVersion) {
        // Sign out user
        await supabase.auth.signOut()

        // Redirect to login with message
        const redirectUrl = new URL(`${basePath}/login`, request.url)
        redirectUrl.searchParams.set('message', 'Your session has been invalidated. Please log in again.')
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      // Log error but don't block request
      console.error('Session version validation error:', error)
    }
  }

  return response
}

/**
 * Matcher configuration
 *
 * Excludes:
 * - /api/* routes (handled by API routes themselves)
 * - /_next/static/* (static files)
 * - /_next/image/* (Next.js image optimization)
 * - /favicon.ico (favicon)
 * - Public assets (*.png, *.jpg, etc.)
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
