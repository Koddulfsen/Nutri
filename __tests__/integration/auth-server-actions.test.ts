/**
 * Integration Tests: Authentication Server Actions
 *
 * Hits the real Supabase project (no mocking) — these create real, throwaway
 * accounts against `*@nutri.test` addresses.
 *
 * Coverage: signUp, resetPassword. signIn/signOut/updateProfile need an
 * authenticated session and are better suited to an E2E environment
 * (Playwright), not a unit test file.
 */

import 'dotenv/config'
import { describe, it, expect, vi } from 'vitest'

// createClient() (lib/supabase/server.ts) calls next/headers' cookies(), which
// only works inside a real Next.js request context. Running these actions
// directly in a test runner needs a minimal stand-in — a plain in-memory jar
// is enough, since these tests don't depend on session persistence across calls.
vi.mock('next/headers', () => {
  const jar = new Map<string, { value: string }>()
  return {
    cookies: async () => ({
      get: (name: string) => jar.get(name),
      set: (opts: { name: string; value: string }) => jar.set(opts.name, { value: opts.value }),
      getAll: () => Array.from(jar.entries()).map(([name, { value }]) => ({ name, value })),
    }),
    headers: async () => new Headers(),
  }
})

const { signUp, resetPassword } = await import('@/app/(auth)/actions')

describe('Authentication Server Actions', () => {
  const testEmail = `test-${Date.now()}@nutri.test`
  const testPassword = 'TestPassword123!'

  describe('signUp', () => {
    // NOTE: this hits Supabase's real signup-email rate limit if run repeatedly
    // in a short window (observed: "email rate limit exceeded" after a handful
    // of runs). That's Supabase's own send-rate guard, not a bug in signUp() —
    // if this test flakes in CI, check for that specific error before assuming
    // a regression.
    it('should create new user with valid credentials', async () => {
      const formData = new FormData()
      formData.append('email', testEmail)
      formData.append('password', testPassword)

      const result = await signUp(formData)

      // signUp() only creates the account and sends a confirmation email — it
      // does not return a userId, since the user isn't fully active until they
      // verify via verifyOTP(). Asserting a userId here was never correct.
      expect(result.success).toBe(true)
      expect(result.email).toBe(testEmail)
      expect(result.message).toContain('email')
    })

    it('should reject weak password', async () => {
      const formData = new FormData()
      formData.append('email', `weak-${Date.now()}@nutri.test`)
      formData.append('password', 'weak')

      const result = await signUp(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject duplicate email', async () => {
      const formData = new FormData()
      formData.append('email', testEmail)
      formData.append('password', testPassword)

      const result = await signUp(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('resetPassword', () => {
    it('should always return success (security — never reveal if the email exists)', async () => {
      const result = await resetPassword(testEmail)

      expect(result.success).toBe(true)
      expect(result.message).toContain('email')
    })

    it('should return success even for a non-existent email (security)', async () => {
      const result = await resetPassword('nonexistent@nutri.test')

      expect(result.success).toBe(true)
      expect(result.message).toContain('email')
    })
  })
})
