/**
 * POST /api/auth/mfa/verify
 *
 * Purpose: Verify TOTP code during login or setup
 * Authentication: Required
 *
 * Generated: 2025-11-10
 * Architecture: Phase 1 Feature System 02 (Authentication & User System)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyCode } from '@/lib/auth/totp'
import { logAuditEvent } from '@/lib/audit/log'
import { headers } from 'next/headers'
import { checkMfaRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get session
    const { data: { user }, error: sessionError } = await supabase.auth.getUser()

    if (sessionError || !user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          },
          success: false
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_REQUEST',
            message: 'Valid 6-digit code required'
          },
          success: false
        },
        { status: 400 }
      )
    }

    // Get user profile with MFA secret
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, mfa_secret, mfa_enabled')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Profile not found'
          },
          success: false
        },
        { status: 404 }
      )
    }

    if (!profile.mfa_secret) {
      return NextResponse.json(
        {
          error: {
            code: 'MFA_NOT_SETUP',
            message: 'MFA is not set up for this account'
          },
          success: false
        },
        { status: 400 }
      )
    }

    // Verify TOTP code (±1 time step tolerance for clock skew)
    // A 6-digit TOTP with a +/-1 step window leaves ~3 codes valid at any moment,
    // which is brute-forceable in minutes without a limiter. Fails closed.
    const mfaLimit = await checkMfaRateLimit(user.id)
    if (!mfaLimit.allowed) {
      return NextResponse.json({
        data: { valid: false, message: 'Too many attempts. Try again later.' },
        success: false
      }, { status: 429 })
    }

    const isValid = verifyCode(code, profile.mfa_secret)

    if (!isValid) {
      // Log failed verification attempt
      const headersList = await headers()
      const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
      const userAgent = headersList.get('user-agent') || 'unknown'

      await logAuditEvent({
        userId: user.id,
        action: 'UPDATE',
        resourceType: 'user_profile',
        resourceId: profile.id,
        metadata: { action: 'mfa_verification_failed' },
        ipAddress,
        userAgent
      })

      // 401, not 200. This previously returned `success: true` with the failure
      // buried in `data.valid`, so any caller checking `res.ok` or `body.success`
      // — the normal pattern — treated a FAILED second factor as a pass.
      return NextResponse.json({
        data: { valid: false, message: 'Invalid or expired code' },
        success: false
      }, { status: 401 })
    }

    // If this is first verification after setup, enable MFA
    if (!profile.mfa_enabled) {
      const { error: enableError } = await supabase
        .from('user_profiles')
        .update({
          mfa_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (enableError) {
        return NextResponse.json(
          {
            error: {
              code: 'UPDATE_FAILED',
              message: enableError.message
            },
            success: false
          },
          { status: 500 }
        )
      }
    }

    // Log successful verification
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await logAuditEvent({
      userId: user.id,
      action: 'UPDATE',
      resourceType: 'user_profile',
      resourceId: profile.id,
      metadata: { action: 'mfa_verification_success' },
      ipAddress,
      userAgent
    })

    return NextResponse.json({
      data: {
        valid: true,
        message: 'Code verified successfully'
      },
      success: true
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An unexpected error occurred'
        },
        success: false
      },
      { status: 500 }
    )
  }
}
