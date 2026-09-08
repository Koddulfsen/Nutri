import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { userProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { generateDEK } from '@/lib/security/encryption'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/nutri'
  const next = searchParams.get('next') ?? basePath

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}${basePath}/login?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(
        `${origin}${basePath}/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    // Get user session
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Check if user profile exists
      const existingProfile = await db
        .select({ id: userProfiles.id })
        .from(userProfiles)
        .where(eq(userProfiles.userId, user.id))
        .limit(1)

      if (existingProfile.length === 0) {
        // Create user profile with generated DEK
        const dek = await generateDEK()
        await db.insert(userProfiles).values({
          userId: user.id,
          fullName: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatarUrl: user.user_metadata?.avatar_url || null,
          dataEncryptionKey: dek,
        })
      }
    }

    // Successful authentication - redirect to home or intended destination
    return NextResponse.redirect(`${origin}${next}`)
  }

  // No code provided - redirect to login
  return NextResponse.redirect(`${origin}${basePath}/login`)
}
