/**
 * DELETE /api/auth/api-keys/:id
 *
 * Purpose: Revoke API key
 * Authentication: Required (must own the key)
 *
 * Generated: 2025-11-10
 * Architecture: Phase 1 Feature System 02 (Authentication & User System)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit/log'
import { headers } from 'next/headers'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
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

    const { id: keyId } = await params

    // Verify user owns this API key
    const { data: apiKey, error: fetchError } = await supabase
      .from('api_keys')
      .select('id, user_id, key_prefix, name')
      .eq('id', keyId)
      .single()

    if (fetchError || !apiKey) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'API key not found'
          },
          success: false
        },
        { status: 404 }
      )
    }

    if (apiKey.user_id !== session.user.id) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to revoke this API key'
          },
          success: false
        },
        { status: 403 }
      )
    }

    // Soft delete: Set is_revoked = TRUE
    const { error: updateError } = await supabase
      .from('api_keys')
      .update({
        is_revoked: true
      })
      .eq('id', keyId)

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
      userId: session.user.id,
      action: 'DELETE',
      resourceType: 'api_key',
      resourceId: keyId,
      metadata: { key_prefix: apiKey.key_prefix, name: apiKey.name },
      ipAddress,
      userAgent
    })

    return NextResponse.json({
      data: {
        success: true,
        message: 'API key revoked successfully'
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
