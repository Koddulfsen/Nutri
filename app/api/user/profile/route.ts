/**
 * GET /api/user/profile - Fetch user profile
 * PATCH /api/user/profile - Update user profile
 *
 * Purpose: User profile management
 * Authentication: Required
 *
 * Generated: 2025-11-10
 * Architecture: Phase 1 Feature System 02 (Authentication & User System)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit/log'
import { headers } from 'next/headers'

/**
 * GET /api/user/profile
 *
 * Returns user profile data
 */
export async function GET(request: Request) {
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

    // Query user profile. NOTE: there is no RLS — the .eq(user_id) below is the
    // only thing scoping this to the caller. Do not remove it.
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, user_id, full_name, avatar_url, mfa_enabled, created_at, updated_at')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
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

    return NextResponse.json({
      data: profile,
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

/**
 * PATCH /api/user/profile
 *
 * Updates user profile data (full_name, avatar_url)
 */
export async function PATCH(request: Request) {
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
    const { full_name, avatar_url } = body

    // Validate at least one field is provided
    if (!full_name && !avatar_url) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_REQUEST',
            message: 'At least one field (full_name or avatar_url) must be provided'
          },
          success: false
        },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (full_name !== undefined) {
      updateData.full_name = full_name
    }

    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url
    }

    // Update user profile. NOTE: there is no RLS — the .eq(user_id) below is the
    // only ownership check. Do not remove it.
    const { data: profile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single()

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
      resourceId: profile.id,
      metadata: { fields_updated: Object.keys(body) },
      ipAddress,
      userAgent
    })

    return NextResponse.json({
      data: profile,
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
