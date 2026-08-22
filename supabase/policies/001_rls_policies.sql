-- ============================================================================
-- Row Level Security policies — Nutri
-- Applied 2026-08-22 against project knwfnixfanmydbeatamu (eu-west-1)
--
-- CONTEXT
--   Supabase enables RLS on every table in `public` automatically. With no
--   policies that means deny-all, which is the safe default but blocks the
--   7 tables the app reaches through the Supabase client (PostgREST).
--
--   The other ~87 tables are reached ONLY through Drizzle, which connects as
--   `postgres` (the table owner) and bypasses RLS entirely. They deliberately
--   get NO policies: unreachable over the public API is exactly what we want.
--
-- MODEL
--   Reference data  -> readable by anyone (it is public nutrition science)
--   User-owned data -> readable/writable only by the row's owner
--   Everything else -> deny all
--
--   `auth.uid()` is the logged-in user's id, taken from the request JWT.
--   It is NULL for anonymous callers, so every user-data policy fails closed.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Reference data — public read, no writes
-- ---------------------------------------------------------------------------

-- foods: public rows to everyone; private rows only to whoever created them.
DROP POLICY IF EXISTS "foods_read_public_or_own" ON public.foods;
CREATE POLICY "foods_read_public_or_own" ON public.foods
  FOR SELECT TO anon, authenticated
  USING (visibility = 'public' OR created_by = auth.uid());

-- Nutrient values and reference daily values are published science, not
-- personal data. Read-only to everyone.
DROP POLICY IF EXISTS "merged_nutrients_read_all" ON public.merged_nutrients;
CREATE POLICY "merged_nutrients_read_all" ON public.merged_nutrients
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "food_nutrient_values_read_all" ON public.food_nutrient_values;
CREATE POLICY "food_nutrient_values_read_all" ON public.food_nutrient_values
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reference_daily_values_read_all" ON public.reference_daily_values;
CREATE POLICY "reference_daily_values_read_all" ON public.reference_daily_values
  FOR SELECT TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------------
-- 2. User-owned data — owner only, authenticated only
-- ---------------------------------------------------------------------------

-- user_profiles holds Article 9 data (biological_sex, life_stage, mfa_secret,
-- data_encryption_key). Owner only, and no INSERT: profile creation runs
-- server-side through Drizzle, not from the browser.
DROP POLICY IF EXISTS "user_profiles_read_own" ON public.user_profiles;
CREATE POLICY "user_profiles_read_own" ON public.user_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
CREATE POLICY "user_profiles_update_own" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());   -- WITH CHECK stops reassigning a row to someone else

DROP POLICY IF EXISTS "api_keys_read_own" ON public.api_keys;
CREATE POLICY "api_keys_read_own" ON public.api_keys
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "api_keys_insert_own" ON public.api_keys;
CREATE POLICY "api_keys_insert_own" ON public.api_keys
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Revocation is a soft delete (is_revoked = true), so UPDATE covers it.
-- No DELETE policy: audit trails should not be erasable from the browser.
DROP POLICY IF EXISTS "api_keys_update_own" ON public.api_keys;
CREATE POLICY "api_keys_update_own" ON public.api_keys
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- audit_log: users may read their own trail. Writes happen server-side only.
DROP POLICY IF EXISTS "audit_log_read_own" ON public.audit_log;
CREATE POLICY "audit_log_read_own" ON public.audit_log
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. Harden the default grants
--
-- Supabase grants anon and authenticated full DML on every table in `public`.
-- RLS is currently the only thing standing in front of that: if anyone ever
-- disables RLS on a table to "make it work", it becomes world-writable.
-- anon never legitimately writes anything here, so take the grants away and
-- stop relying on RLS alone.
-- ---------------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLES FROM anon;
