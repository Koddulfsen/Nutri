/**
 * GET /api/audit-log
 *
 * Purpose: Return paginated audit log for current user
 * Authentication: Required
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

    // Parse query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100) // Max 100
    const action = searchParams.get('action') || undefined

    // Calculate offset
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('audit_log')
      .select('id, action, resource_type, resource_id, metadata, ip_address, user_agent, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by action if provided
    if (action) {
      query = query.eq('action', action)
    }

    const { data: logs, error: logsError, count } = await query

    if (logsError) {
      return NextResponse.json(
        {
          error: {
            code: 'QUERY_FAILED',
            message: logsError.message
          },
          success: false
        },
        { status: 500 }
      )
    }

    // Calculate pagination
    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: logs || [],
      pagination: {
        page,
        limit,
        totalPages,
        total: count || 0
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
