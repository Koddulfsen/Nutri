--
-- Row-Level Security (RLS) Policies for Nutri Authentication System
-- Apply these via Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
--
-- CRITICAL: These policies enforce user data isolation for HIPAA & GDPR compliance
--

-- ============================================================================
-- user_profiles Table
-- ============================================================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile (for initial creation)
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- api_keys Table
-- ============================================================================

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own API keys
CREATE POLICY "Users can view own API keys" ON api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own API keys
CREATE POLICY "Users can create own API keys" ON api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update (revoke) their own API keys
CREATE POLICY "Users can revoke own API keys" ON api_keys
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- user_consent Table
-- ============================================================================

-- Enable RLS
ALTER TABLE user_consent ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own consent settings
CREATE POLICY "Users can view own consent" ON user_consent
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own consent settings
CREATE POLICY "Users can update own consent" ON user_consent
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own consent (for initial creation)
CREATE POLICY "Users can insert own consent" ON user_consent
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- audit_log Table
-- ============================================================================

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own audit trail (READ-ONLY)
CREATE POLICY "Users can view own audit trail" ON audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Note: No INSERT/UPDATE/DELETE policies for audit_log
-- Only backend can write to audit_log for integrity

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Run these to verify RLS is enabled:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_profiles', 'api_keys', 'user_consent', 'audit_log');

-- Run these to list all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('user_profiles', 'api_keys', 'user_consent', 'audit_log');
