import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

console.log('Testing Supabase connection via REST API...\n');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

try {
  const { data, error } = await supabase
    .from('compounds')
    .select('id, name')
    .limit(1);

  if (error) {
    console.error('❌ Query failed:', error.message);
    process.exit(1);
  } else {
    console.log('✅ Supabase REST API working!');
    console.log('Sample compound:', data);
    console.log('\n✅ Database connection is HEALTHY via Supabase REST API');
    console.log('Note: IPv6 direct PostgreSQL connection issues are bypassed by using Supabase REST API');
  }
} catch (err) {
  console.error('❌ Connection error:', err.message);
  process.exit(1);
}
