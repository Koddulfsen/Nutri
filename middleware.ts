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
  // NOTE: there is deliberately no `NODE_ENV === 'development'` short-circuit here.
  // One used to sit at the top of this function and returned before every check —
  // security headers, CSP, the API 401 gate, protected-path redirects, admin gating
  // and session validation. That made auth gating impossible to test locally and meant
  // it first executed in production. The dev accommodation is the session-synthesis
  // branch below, and nothing else.
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

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

  // Get session.
  // In local dev the Supabase project is gone, so synthesise a session inline
  // rather than calling out to a dead auth host. This can't reuse the dev shim
  // in lib/supabase/dev-shim.ts because middleware runs on the Edge runtime,
  // which cannot load the `postgres` driver that module depends on.
  // The NODE_ENV term is the safety net, not redundancy — see lib/supabase/dev-user.ts.
  const devAuthBypass =
    process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_BYPASS === 'true'

  const session = devAuthBypass
    ? {
        user: {
          id: '00000000-0000-4000-8000-000000000001',
          email: process.env.DEV_AUTH_EMAIL || 'dev@localhost',
          user_metadata: { session_version: 1 },
        },
      }
    : (await supabase.auth.getSession()).data.session

  // API routes that don't require auth (login/signup flows, waitlist)
  const publicApiPaths = [
    '/api/auth/callback',
    '/api/auth/confirm',
    '/api/auth/sign-in',
    '/api/auth/sign-up',
    '/api/auth/reset-password',
    '/api/waitlist',
  ]

  // Verified 2026-08-11 against a production build: Next strips `basePath`, so
  // `pathname` here is `/dashboard`, never basePath-prefixed. Do not add the
  // prefixes to the checks below.
  const pathname = request.nextUrl.pathname
  const isApiRoute = pathname.startsWith('/api/')

  // `startsWith`, not `includes`: a substring match would let any future route whose
  // path merely *contains* a public prefix slip past the 401 gate.
  const isPublicApi = publicApiPaths.some(
    p => pathname === p || pathname.startsWith(p + '/')
  )

  // Block unauthenticated API calls with 401 — stops bots cold
  if (isApiRoute && !isPublicApi && !session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Define protected routes (require authentication)
  const protectedPaths = [
    '/dashboard',
    '/profile',
    '/settings',
    '/analysis',
    '/admin',
  ]

  // Define admin-only routes.
  // `/api/admin` is listed explicitly: it does NOT match the `/admin` prefix, so
  // without it every admin API was reachable by any authenticated user.
  // This is a second line of defence only — each handler must still call
  // `requireAdmin()`, because middleware is not a security boundary on its own.
  const adminPaths = [
    '/admin',
    '/api/admin',
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

    if (!isAdmin) {
      // API callers get a JSON 403. Redirecting them would hand an HTTP client an
      // HTML page with a 3xx, which most clients follow — turning a hard denial
      // into a confusing 200. Pages redirect instead, so admin routes do not
      // confirm their own existence to a signed-in non-admin.
      if (isApiRoute) {
        return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return NextResponse.redirect(new URL(`${basePath}/analysis`, request.url))
    }
  }

  // If authenticated, validate session version (global logout).
  // Skipped under the dev bypass: there is no real session to invalidate, and
  // the lookup would need a DB driver unavailable on the Edge runtime.
  if (session && !devAuthBypass) {
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
