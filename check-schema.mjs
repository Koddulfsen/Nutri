import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log('Checking compounds table schema...\n');

// Try to get table info
const { data, error } = await supabase
  .from('compounds')
  .select('*')
  .limit(0);

if (error) {
  console.log('Error:', error);
} else {
  console.log('Query successful (no rows returned as expected)');
  console.log('This means the table exists and is accessible');
}

// Try inserting with minimal fields
console.log('\nTrying minimal insert...');
const testInsert = await supabase
  .from('compounds')
  .insert({
    compound_type: 'VITAMIN',
    name: 'Test Vitamin A',
    unit: 'mcg'
  })
  .select();

console.log('Insert result:', JSON.stringify(testInsert, null, 2));
