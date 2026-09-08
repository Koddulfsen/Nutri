/**
 * Authentication Server Actions
 *
 * Purpose: Server-side authentication operations
 * Usage: Called from client components via form submissions
 *
 * Generated: 2025-11-10
 * Architecture: Phase 1 Feature System 02 (Authentication & User System)
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { validatePasswordStrength } from '@/lib/auth/password'
import { checkLoginRateLimit, checkPasswordResetRateLimit } from '@/lib/rate-limit'
import { logAuditEvent } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

/**
 * Sign up new user with email/password + OTP verification
 *
 * @param formData - Form data containing email and password
 * @returns Success response with email to verify or error
 *
 * Flow:
 * 1. Validate password strength
 * 2. Send OTP email (creates user if doesn't exist)
 * 3. Return success with email for verification page
 * 4. User enters OTP on /verify-email page
 */
export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password)
  if (!passwordValidation.isValid) {
    return {
      error: passwordValidation.errors.join(', '),
      success: false
    }
  }

  try {
    const supabase = await createClient()

    // Send OTP email (creates user automatically if doesn't exist)
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: {
          // Store password in user metadata for setting after OTP verification
          temp_password: password
        }
      }
    })

    if (error) {
      return {
        error: error.message,
        success: false
      }
    }

    // Log audit event
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await logAuditEvent({
      userId: undefined, // User not created yet, will be created on OTP verification
      action: 'CREATE',
      resourceType: 'auth',
      resourceId: undefined,
      metadata: { email, method: 'email_otp' },
      ipAddress,
      userAgent
    })

    return {
      success: true,
      email: email,
      message: 'Verification code sent to your email'
    }
  } catch (error: any) {
    return {
      error: error.message || 'An unexpected error occurred',
      success: false
    }
  }
}

/**
 * Verify OTP code and complete signup
 *
 * @param email - User's email address
 * @param token - 6-digit OTP code from email
 * @returns Success with redirect or error
 *
 * Flow:
 * 1. Verify OTP with Supabase
 * 2. Log audit event
 * 3. Redirect to dashboard
 */
export async function verifyOTP(email: string, token: string) {
  try {
    const supabase = await createClient()

    // Verify OTP
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })

    if (error) {
      return {
        error: error.message,
        success: false
      }
    }

    // Log audit event
    if (data.user) {
      const headersList = await headers()
      const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
      const userAgent = headersList.get('user-agent') || 'unknown'

      await logAuditEvent({
        userId: data.user.id,
        action: 'LOGIN',
        resourceType: 'auth',
        resourceId: data.user.id,
        metadata: { email, method: 'email_otp_verify' },
        ipAddress,
        userAgent
      })
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error: any) {
    // Handle redirect error (this is expected behavior)
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error
    }

    return {
      error: error.message || 'Invalid or expired code',
      success: false
    }
  }
}

/**
 * Resend OTP code
 *
 * @param email - User's email address
 * @returns Success message or error
 */
export async function resendOTP(email: string) {
  try {
    const supabase = await createClient()

    // Resend OTP
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false // Don't create if doesn't exist
      }
    })

    if (error) {
      return {
        error: error.message,
        success: false
      }
    }

    return {
      success: true,
      message: 'New code sent to your email'
    }
  } catch (error: any) {
    return {
      error: error.message || 'Failed to resend code',
      success: false
    }
  }
}

/**
 * Sign in user with email/password
 *
 * @param formData - Form data containing email and password
 * @returns Success response with user data or error
 *
 * Flow:
 * 1. Check rate limit (5 attempts per IP per 15min)
 * 2. Sign in with Supabase Auth
 * 3. Set httpOnly cookies (automatic by Supabase)
 * 4. Log audit event
 * 5. Redirect to dashboard
 */
export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    // Check rate limit
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

    const rateLimitResult = await checkLoginRateLimit(ipAddress)
    if (!rateLimitResult.allowed) {
      const minutesRemaining = Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 60000)
      return {
        error: `Too many login attempts. Please try again in ${minutesRemaining} minutes.`,
        success: false
      }
    }

    const supabase = await createClient()

    // Sign in with password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return {
        error: error.message,
        success: false
      }
    }

    // Log audit event
    if (data.user) {
      const userAgent = headersList.get('user-agent') || 'unknown'

      await logAuditEvent({
        userId: data.user.id,
        action: 'LOGIN',
        resourceType: 'auth',
        resourceId: data.user.id,
        metadata: { email, method: 'email_password' },
        ipAddress,
        userAgent
      })
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error: any) {
    // Handle redirect error (this is expected behavior)
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error
    }

    return {
      error: error.message || 'An unexpected error occurred',
      success: false
    }
  }
}

/**
 * Sign in with OAuth provider (Google, Apple)
 *
 * @param provider - OAuth provider name ('google' | 'apple')
 * @returns Redirect URL for OAuth consent screen or error
 *
 * Flow:
 * 1. Request OAuth URL from Supabase
 * 2. Return URL for client-side redirect
 * 3. User completes OAuth flow
 * 4. Callback handled by /auth/callback route
 */
export async function signInWithOAuth(provider: 'google' | 'apple') {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    })

    if (error) {
      return {
        error: error.message,
        success: false
      }
    }

    // Log audit event (user_id will be available after callback)
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await logAuditEvent({
      userId: undefined, // Will be updated after OAuth callback
      action: 'LOGIN',
      resourceType: 'auth',
      resourceId: undefined,
      metadata: { provider, method: 'oauth' },
      ipAddress,
      userAgent
    })

    return {
      success: true,
      url: data.url
    }
  } catch (error: any) {
    return {
      error: error.message || 'An unexpected error occurred',
      success: false
    }
  }
}

/**
 * Reset password for user
 *
 * @param email - User email address
 * @returns Success message (always, for security)
 *
 * Flow:
 * 1. Check rate limit (3 attempts per email per hour)
 * 2. Send password reset email (Supabase handles)
 * 3. Log audit event
 * 4. Return success (don't reveal if email exists)
 */
export async function resetPassword(email: string) {
  try {
    // Check rate limit
    const rateLimitResult = await checkPasswordResetRateLimit(email)
    if (!rateLimitResult.allowed) {
      const minutesRemaining = Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 60000)
      return {
        error: `Too many password reset requests. Please try again in ${minutesRemaining} minutes.`,
        success: false
      }
    }

    const supabase = await createClient()

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
    })

    // Log audit event (even if email doesn't exist, for security)
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await logAuditEvent({
      userId: undefined, // Don't reveal if email exists
      action: 'UPDATE',
      resourceType: 'auth',
      resourceId: undefined,
      metadata: { email, action: 'password_reset_request' },
      ipAddress,
      userAgent
    })

    // Always return success (don't reveal if email exists)
    return {
      success: true,
      message: 'If an account exists for this email, you will receive password reset instructions.'
    }
  } catch (error: any) {
    // Still return success for security
    return {
      success: true,
      message: 'If an account exists for this email, you will receive password reset instructions.'
    }
  }
}

/**
 * Sign out current user
 *
 * @returns Success response or error
 *
 * Flow:
 * 1. Sign out from Supabase (clears httpOnly cookies)
 * 2. Log audit event
 * 3. Redirect to home page
 */
export async function signOut() {
  try {
    const supabase = await createClient()

    // Get user before signing out
    const { data: { user } } = await supabase.auth.getUser()

    // Sign out
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        error: error.message,
        success: false
      }
    }

    // Log audit event
    if (user) {
      const headersList = await headers()
      const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
      const userAgent = headersList.get('user-agent') || 'unknown'

      await logAuditEvent({
        userId: user.id,
        action: 'LOGOUT',
        resourceType: 'auth',
        resourceId: user.id,
        metadata: {},
        ipAddress,
        userAgent
      })
    }

    revalidatePath('/', 'layout')
    redirect('/')
  } catch (error: any) {
    // Handle redirect error (this is expected behavior)
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error
    }

    return {
      error: error.message || 'An unexpected error occurred',
      success: false
    }
  }
}

/**
 * Update user profile
 *
 * @param data - Profile data to update (full_name, avatar_url)
 * @returns Updated profile or error
 *
 * Flow:
 * 1. Get current user
 * 2. Update user_profiles table (NOTE: no RLS exists — scope by user_id explicitly)
 * 3. Log audit event
 * 4. Return updated profile
 */
export async function updateProfile(data: { full_name?: string; avatar_url?: string }) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        error: 'Not authenticated',
        success: false
      }
    }

    // Update user profile. NOTE: no RLS exists — scope by user_id explicitly.
    const { data: profile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      return {
        error: updateError.message,
        success: false
      }
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
      metadata: { fields_updated: Object.keys(data) },
      ipAddress,
      userAgent
    })

    revalidatePath('/profile')

    return {
      success: true,
      profile
    }
  } catch (error: any) {
    return {
      error: error.message || 'An unexpected error occurred',
      success: false
    }
  }
}
