import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', url);
console.log('Key (first 20):', key?.slice(0, 20));

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const test = await supabase.from('compounds').select('count').limit(1);
console.log('Test query result:', test);
