import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { userProfiles, userEncryptionKeys } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { generateDEK } from '@/lib/security/encryption'
import { createInitialConsent } from '@/lib/dal/consent'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  // With the app at the domain root basePath is '', which would redirect to a
  // bare origin. Land on the dashboard instead.
  const next = searchParams.get('next') ?? `${basePath}/dashboard`

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
        // Create user profile and, separately, its encryption key. The key lives
        // in its own table — never on user_profiles — so that reading a profile
        // never also returns the key that decrypts its own PHI columns.
        const dek = await generateDEK()
        await db.insert(userProfiles).values({
          userId: user.id,
          fullName: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatarUrl: user.user_metadata?.avatar_url || null,
        })
        await db.insert(userEncryptionKeys).values({
          userId: user.id,
          dataEncryptionKey: dek,
        })
        // Every new user needs a real consent row from the start, with every flag
        // defaulting false — checkConsent() throws for a user with no row at all,
        // which previously meant new users got errors instead of a clean "not
        // consented yet" until they happened to visit settings.
        await createInitialConsent(user.id)
      }
    }

    // Successful authentication - redirect to home or intended destination
    return NextResponse.redirect(`${origin}${next}`)
  }

  // No code provided - redirect to login
  return NextResponse.redirect(`${origin}${basePath}/login`)
}
