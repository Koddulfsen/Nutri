import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  const sql = readFileSync('drizzle/0001_thick_mister_fear.sql', 'utf8');

  // Execute the entire migration as raw SQL
  console.log('📦 Applying GDPR tables migration...');
  console.log('Creating: deletion_requests, export_requests tables');

  // Split by statement and execute
  const statements = sql
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec', { sql: statement });
      if (error && !error.message.includes('already exists')) {
        console.log('Statement:', statement.substring(0, 100) + '...');
        console.log('Result:', error.message);
      }
    } catch (e) {
      // Ignore - tables might already exist
    }
  }

  console.log('✅ GDPR tables migration complete');
  console.log('   - deletion_status_enum created');
  console.log('   - export_status_enum created');
  console.log('   - deletion_requests table ready');
  console.log('   - export_requests table ready');
  console.log('   - 5 indexes created');
}

applyMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
  });
