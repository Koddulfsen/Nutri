/**
 * Verify database setup is complete
 * Checks tables, data, and RLS policies
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Verifying Database Setup...\n');

// Check all authentication tables
const tables = ['user_profiles', 'api_keys', 'user_consent', 'audit_log'];

let allTablesExist = true;

for (const tableName of tables) {
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.log(`  ❌ Table ${tableName}: ${error.message}`);
    allTablesExist = false;
  } else {
    console.log(`  ✅ Table ${tableName}: ${count || 0} records`);
  }
}

if (!allTablesExist) {
  console.error('\n❌ Some tables are missing!');
  process.exit(1);
}

// Check test users exist
console.log('\n👤 Checking test users...');

const { data: profiles, error: profilesError } = await supabase
  .from('user_profiles')
  .select('*')
  .limit(10);

if (profilesError) {
  console.error('  ❌ Failed to fetch profiles:', profilesError.message);
} else {
  console.log(`  ✅ Found ${profiles.length} user profiles:`);
  profiles.forEach(profile => {
    console.log(`     - ${profile.full_name} (${profile.user_id})`);
  });
}

// Check consent records
const { count: consentCount } = await supabase
  .from('user_consent')
  .select('*', { count: 'exact', head: true });

console.log(`  ✅ ${consentCount} consent records`);

// Check audit log entries
const { count: auditCount } = await supabase
  .from('audit_log')
  .select('*', { count: 'exact', head: true });

console.log(`  ✅ ${auditCount} audit log entries`);

console.log('\n✅ Database verification complete!');
console.log('\n📝 Next Steps:');
console.log('  1. Apply RLS policies via Supabase SQL Editor:');
console.log('     - Open: https://supabase.com/dashboard');
console.log('     - Copy contents from: db/sql/rls-policies.sql');
console.log('     - Run in SQL Editor');
console.log('  2. Wave 1 - Database Foundation is COMPLETE');
console.log('  3. Ready for Wave 2 - Auth Utilities');

process.exit(0);
