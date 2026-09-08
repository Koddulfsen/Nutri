/**
 * POST /api/auth/mfa/enable
 *
 * Purpose: Generate TOTP secret and QR code for MFA setup
 * Authentication: Required
 *
 * Generated: 2025-11-10
 * Architecture: Phase 1 Feature System 02 (Authentication & User System)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSecret, generateQRCode, generateBackupCodes } from '@/lib/auth/totp'
import { logAuditEvent } from '@/lib/audit/log'
import { headers } from 'next/headers'
import bcrypt from 'bcryptjs'

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

    // Generate TOTP secret
    const secret = generateSecret()

    // Generate QR code
    const qrCode = await generateQRCode(secret, user.email || 'user@nutri.app')

    // Generate 10 backup codes (function generates 10 by default)
    const backupCodes = generateBackupCodes()

    // Hash backup codes for storage (bcrypt)
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    )

    // Update user profile with MFA data
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        mfa_secret: secret,
        mfa_backup_codes: hashedBackupCodes,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json(
        {
          error: {
            code: 'UPDATE_FAILED',
            message: updateError.message
          },
          success: false
        },
        { status: 500 }
      )
    }

    // Log audit event
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await logAuditEvent({
      userId: user.id,
      action: 'UPDATE',
      resourceType: 'user_profile',
      resourceId: user.id,
      metadata: { action: 'mfa_setup_initiated' },
      ipAddress,
      userAgent
    })

    return NextResponse.json({
      data: {
        secret,
        qr_code: qrCode,
        backup_codes: backupCodes // Display once, never shown again
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
