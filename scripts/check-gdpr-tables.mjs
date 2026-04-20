import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('🔍 Checking GDPR tables...\n');

  // Check deletion_requests
  const { error: e1 } = await supabase.from('deletion_requests').select('id').limit(1);
  const deletionExists = !e1 || e1.code !== '42P01';
  console.log('✓ deletion_requests:', deletionExists ? '✅ EXISTS' : '❌ MISSING');

  // Check export_requests
  const { error: e2 } = await supabase.from('export_requests').select('id').limit(1);
  const exportExists = !e2 || e2.code !== '42P01';
  console.log('✓ export_requests:', exportExists ? '✅ EXISTS' : '❌ MISSING');

  if (deletionExists && exportExists) {
    console.log('\n✅ All GDPR tables exist - migration not needed');
    return true;
  } else {
    console.log('\n❌ GDPR tables missing - manual creation needed');
    return false;
  }
}

checkTables()
  .then(exists => process.exit(exists ? 0 : 1))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
