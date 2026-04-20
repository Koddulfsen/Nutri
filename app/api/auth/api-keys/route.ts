/**
 * POST /api/auth/api-keys
 *
 * Purpose: Generate new API key for Premium users
 * Authentication: Required (Premium tier only)
 *
 * Generated: 2025-11-10
 * Architecture: Phase 1 Feature System 02 (Authentication & User System)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit/log'
import { headers } from 'next/headers'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(request: Request) {
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

    // Parse request body
    const body = await request.json()
    const { name } = body

    // TODO Phase 2: Check user tier = Premium
    // For now, allow all authenticated users
    // const { data: profile } = await supabase
    //   .from('user_profiles')
    //   .select('tier')
    //   .eq('user_id', session.user.id)
    //   .single()
    //
    // if (profile?.tier !== 'premium') {
    //   return NextResponse.json(
    //     {
    //       error: {
    //         code: 'FORBIDDEN',
    //         message: 'Premium tier required for API keys'
    //       },
    //       success: false
    //     },
    //     { status: 403 }
    //   )
    // }

    // Check active keys count (max 5 per user)
    const { data: existingKeys, error: countError } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('is_revoked', false)
      .is('expires_at', null)
      .or(`expires_at.gt.${new Date().toISOString()}`)

    if (countError) {
      return NextResponse.json(
        {
          error: {
            code: 'QUERY_FAILED',
            message: countError.message
          },
          success: false
        },
        { status: 500 }
      )
    }

    if (existingKeys && existingKeys.length >= 5) {
      return NextResponse.json(
        {
          error: {
            code: 'LIMIT_EXCEEDED',
            message: 'Maximum 5 active API keys allowed. Please revoke an existing key.'
          },
          success: false
        },
        { status: 400 }
      )
    }

    // Generate API key: nutri_live_{32_random_chars}
    const randomBytes = crypto.randomBytes(24) // 24 bytes = 32 chars base64
    const keySecret = randomBytes.toString('base64url')
    const fullKey = `nutri_live_${keySecret}`

    // Key prefix (first 8 chars after nutri_live_)
    const keyPrefix = `nutri_live_${keySecret.substring(0, 8)}`

    // Hash full key with bcrypt (cost factor 10)
    const keyHash = await bcrypt.hash(fullKey, 10)

    // Store in database
    const { data: apiKey, error: insertError } = await supabase
      .from('api_keys')
      .insert({
        user_id: session.user.id,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        name: name || 'Unnamed Key',
        rate_limit: 500, // 500 requests per minute
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        {
          error: {
            code: 'INSERT_FAILED',
            message: insertError.message
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
      action: 'CREATE',
      resourceType: 'api_key',
      resourceId: apiKey.id,
      metadata: { key_prefix: keyPrefix, name: name || 'Unnamed Key' },
      ipAddress,
      userAgent
    })

    return NextResponse.json({
      data: {
        key: fullKey, // FULL KEY (displayed once, never stored in plaintext)
        key_prefix: apiKey.key_prefix,
        name: apiKey.name,
        rate_limit: apiKey.rate_limit,
        created_at: apiKey.created_at,
        warning: 'Store this key securely. It will not be shown again.'
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
