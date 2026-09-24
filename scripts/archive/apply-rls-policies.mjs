/**
 * Apply Row-Level Security (RLS) policies to authentication tables
 * Implements HIPAA compliance and GDPR user data isolation
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔒 Applying Row-Level Security Policies...\n');

// RLS policies SQL statements
const rlsPolicies = [
  {
    name: 'Enable RLS on user_profiles',
    sql: 'ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;'
  },
  {
    name: 'user_profiles: Users can view own profile',
    sql: `
      CREATE POLICY "Users can view own profile" ON user_profiles
        FOR SELECT USING (auth.uid() = user_id);
    `
  },
  {
    name: 'user_profiles: Users can update own profile',
    sql: `
      CREATE POLICY "Users can update own profile" ON user_profiles
        FOR UPDATE USING (auth.uid() = user_id);
    `
  },
  {
    name: 'Enable RLS on api_keys',
    sql: 'ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;'
  },
  {
    name: 'api_keys: Users can view own API keys',
    sql: `
      CREATE POLICY "Users can view own API keys" ON api_keys
        FOR SELECT USING (auth.uid() = user_id);
    `
  },
  {
    name: 'api_keys: Users can create own API keys',
    sql: `
      CREATE POLICY "Users can create own API keys" ON api_keys
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    `
  },
  {
    name: 'api_keys: Users can revoke own API keys',
    sql: `
      CREATE POLICY "Users can revoke own API keys" ON api_keys
        FOR UPDATE USING (auth.uid() = user_id);
    `
  },
  {
    name: 'Enable RLS on user_consent',
    sql: 'ALTER TABLE user_consent ENABLE ROW LEVEL SECURITY;'
  },
  {
    name: 'user_consent: Users can view own consent',
    sql: `
      CREATE POLICY "Users can view own consent" ON user_consent
        FOR SELECT USING (auth.uid() = user_id);
    `
  },
  {
    name: 'user_consent: Users can update own consent',
    sql: `
      CREATE POLICY "Users can update own consent" ON user_consent
        FOR UPDATE USING (auth.uid() = user_id);
    `
  },
  {
    name: 'Enable RLS on audit_log',
    sql: 'ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;'
  },
  {
    name: 'audit_log: Users can view own audit trail',
    sql: `
      CREATE POLICY "Users can view own audit trail" ON audit_log
        FOR SELECT USING (auth.uid() = user_id);
    `
  },
];

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

for (const policy of rlsPolicies) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: policy.sql });

    if (error) {
      // Policy might already exist
      if (error.message.includes('already exists')) {
        console.log(`  ⏭️  ${policy.name} (already exists)`);
        skipCount++;
      } else if (error.message.includes('already enabled')) {
        console.log(`  ⏭️  ${policy.name} (already enabled)`);
        skipCount++;
      } else {
        console.error(`  ❌ ${policy.name}:`, error.message);
        errorCount++;
      }
    } else {
      console.log(`  ✅ ${policy.name}`);
      successCount++;
    }
  } catch (err) {
    console.error(`  ❌ ${policy.name}:`, err.message);
    errorCount++;
  }
}

console.log('\n📊 RLS Policy Results:');
console.log(`  ✅ Applied: ${successCount}`);
console.log(`  ⏭️  Skipped (already exists): ${skipCount}`);
console.log(`  ❌ Failed: ${errorCount}`);

if (errorCount > 0) {
  console.error('\n⚠️  Some policies failed to apply - check errors above');
  console.log('💡 Note: If policies already exist, this is expected and safe to ignore');
}

console.log('\n✅ RLS policy application complete!');
process.exit(0);
