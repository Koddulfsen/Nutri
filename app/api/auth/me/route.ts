/**
 * GET /api/auth/me
 *
 * Purpose: Return current authenticated user data
 * Authentication: Required (checks session cookie)
 *
 * Generated: 2025-11-10
 * Architecture: Phase 1 Feature System 02 (Authentication & User System)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, user_id, full_name, avatar_url, created_at, updated_at')
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
      data: {
        id: user.id,
        email: user.email,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        tier: 'free', // TODO: Implement tier logic in Phase 2
        created_at: user.created_at
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
