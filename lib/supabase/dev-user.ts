/**
 * Dev Auth Stubs (browser-safe)
 *
 * The fixed local dev user, session, and auth surface used by the dev bypass.
 *
 * This file must stay free of any Node-only imports (notably the `postgres`
 * driver). It is pulled into the browser bundle via `lib/supabase/client.ts`
 * and into the Edge runtime, so the database-backed half of the shim lives
 * separately in `dev-shim.ts`.
 */

export const DEV_USER_ID = '00000000-0000-4000-8000-000000000001';

// Defaults to an address in ADMIN_EMAILS so admin-gated routes stay reachable
// in local dev. Override with DEV_AUTH_EMAIL to test as a non-admin.
export const DEV_USER_EMAIL = process.env.DEV_AUTH_EMAIL || 'dev@localhost';

/**
 * True when the shim should replace the real Supabase client.
 *
 * The `NODE_ENV !== 'production'` term is not redundant with the env var — it is the
 * safety net. If `DEV_AUTH_BYPASS=true` ever reaches a deployed environment (a
 * copy-pasted `.env`, an inherited docker `env_file`, a stray dashboard variable),
 * the bypass would treat **every anonymous request** as a fixed admin with full
 * read/write on every table. Being a compile-time constant, it also lets the bundler
 * drop the branch entirely from production builds.
 *
 * `next.config.js` additionally fails the build outright if both are set.
 */
export function isDevAuthBypass(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_BYPASS === 'true';
}

// Some routes gate on ADMIN_EMAILS, others on a `user_metadata.admin` flag that
// used to be set on the Supabase user record. Derive the flag from the same
// list so both styles of check agree.
const devUserIsAdmin = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim())
  .filter(Boolean)
  .includes(DEV_USER_EMAIL);

/** Minimal stand-in for a Supabase auth user. */
export const devUser = {
  id: DEV_USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: DEV_USER_EMAIL,
  email_confirmed_at: new Date(0).toISOString(),
  phone: '',
  confirmed_at: new Date(0).toISOString(),
  last_sign_in_at: new Date(0).toISOString(),
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {
    full_name: 'Local Dev',
    admin: devUserIsAdmin,
    session_version: 1,
  },
  identities: [],
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  factors: [],
};

/** Minimal stand-in for a Supabase session. */
export const devSession = {
  access_token: 'dev-access-token',
  refresh_token: 'dev-refresh-token',
  token_type: 'bearer',
  // Far-future expiry so nothing tries to refresh against a dead auth server.
  expires_in: 60 * 60 * 24 * 365,
  expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
  user: devUser,
};

/** Auth surface backed by the fixed dev user instead of a real auth server. */
export const devAuth = {
  async getUser() {
    return { data: { user: devUser }, error: null };
  },
  async getSession() {
    return { data: { session: devSession }, error: null };
  },
  async signInWithPassword() {
    return { data: { user: devUser, session: devSession }, error: null };
  },
  async signInWithOtp() {
    return { data: { user: devUser, session: devSession }, error: null };
  },
  async verifyOtp() {
    return { data: { user: devUser, session: devSession }, error: null };
  },
  async signInWithOAuth() {
    return { data: { provider: 'email', url: null }, error: null };
  },
  async exchangeCodeForSession() {
    return { data: { user: devUser, session: devSession }, error: null };
  },
  async resetPasswordForEmail() {
    return { data: {}, error: null };
  },
  async signOut() {
    return { error: null };
  },
  async updateUser() {
    return { data: { user: devUser }, error: null };
  },
  onAuthStateChange(callback: (event: string, session: typeof devSession) => void) {
    // Fire once so listeners settle into the signed-in state immediately.
    try {
      callback('SIGNED_IN', devSession);
    } catch {
      // A listener throwing must not break client render.
    }
    return { data: { subscription: { unsubscribe() {} } }, error: null };
  },
  mfa: {
    async listFactors() {
      return { data: { all: [], totp: [] }, error: null };
    },
    async getAuthenticatorAssuranceLevel() {
      return { data: { currentLevel: 'aal1', nextLevel: 'aal1' }, error: null };
    },
  },
};

/**
 * Browser-side shim client. A browser cannot reach Postgres directly, so
 * `.from()` is unavailable here — the only browser usage in this codebase is
 * `auth.getUser()`.
 */
export function createDevBrowserClient() {
  return {
    auth: devAuth,
    from() {
      throw new Error(
        '[dev-shim] .from() is not available in the browser. Query through an API route instead.'
      );
    },
  };
}
