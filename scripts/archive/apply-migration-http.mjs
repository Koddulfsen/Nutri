/**
 * Apply database migration via Supabase HTTP API
 * Bypasses PostgreSQL direct connection issues
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔍 Checking if tables exist...');

// Check if tables already exist
const { data: tables, error: checkError } = await supabase
  .from('user_profiles')
  .select('*', { count: 'exact', head: true });

if (!checkError || checkError.code !== '42P01') {
  console.log('✅ Tables already exist! Migration previously applied.');

  // List all tables
  const tableNames = ['compounds', 'user_profiles', 'api_keys', 'user_consent', 'audit_log'];
  for (const tableName of tableNames) {
    const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`  ✓ ${tableName}: ${count || 0} records`);
    }
  }

  process.exit(0);
}

console.log('⚠️  Tables do not exist - applying migration...');

// Read migration file
const migrationPath = join(__dirname, '../drizzle/0000_windy_meltdown_FIXED.sql');
const migrationSql = readFileSync(migrationPath, 'utf8');

console.log('📄 Migration file size:', migrationSql.length, 'bytes');

// Split migration into individual statements and execute
const statements = migrationSql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log('📝 Executing', statements.length, 'SQL statements...');

let successCount = 0;
let errorCount = 0;

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i];

  // Skip comments
  if (statement.startsWith('--')) continue;

  try {
    // Execute via raw SQL endpoint
    const { data, error } = await supabase.rpc('exec_sql', { query: statement + ';' });

    if (error) {
      console.error(`  ❌ Statement ${i + 1} failed:`, error.message);
      errorCount++;
    } else {
      successCount++;
      if (statement.includes('CREATE TABLE')) {
        const tableName = statement.match(/CREATE TABLE "?(\w+)"?/i)?.[1];
        console.log(`  ✓ Created table: ${tableName}`);
      } else if (statement.includes('CREATE INDEX')) {
        const indexName = statement.match(/CREATE (?:UNIQUE )?INDEX "?(\w+)"?/i)?.[1];
        console.log(`  ✓ Created index: ${indexName}`);
      } else if (statement.includes('CREATE TYPE')) {
        const typeName = statement.match(/CREATE TYPE "?(\w+)"?/i)?.[1];
        console.log(`  ✓ Created type: ${typeName}`);
      }
    }
  } catch (err) {
    console.error(`  ❌ Unexpected error on statement ${i + 1}:`, err.message);
    errorCount++;
  }
}

console.log('\n📊 Migration Results:');
console.log(`  ✓ Successful: ${successCount}`);
console.log(`  ✗ Failed: ${errorCount}`);

if (errorCount > 0) {
  console.error('\n❌ Migration completed with errors');
  process.exit(1);
} else {
  console.log('\n✅ Migration completed successfully!');
  process.exit(0);
}
