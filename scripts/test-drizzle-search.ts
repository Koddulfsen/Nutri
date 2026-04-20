/**
 * Test Drizzle search directly to isolate the issue
 *
 * IMPORTANT: Use environment variables, never hardcode secrets.
 * Required env vars: SUPABASE_ACCESS_TOKEN, NEXT_PUBLIC_SUPABASE_URL
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

// Extract project ref from URL
const PROJECT_REF = new URL(supabaseUrl).hostname.split('.')[0];

async function runSQL(sql: string): Promise<any> {
  if (!SUPABASE_ACCESS_TOKEN) {
    console.error('Missing SUPABASE_ACCESS_TOKEN env var');
    process.exit(1);
  }
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  return response.json();
}

async function testDrizzleSearch() {
  const query = 'chicken';
  const searchQuery = query.split(/\s+/).map(w => `${w}:*`).join(' | ');

  console.log('Search query:', query);
  console.log('Sanitized tsquery:', searchQuery);

  console.log('\n--- Full-text search ---');
  const result = await runSQL(`
    SELECT id, name
    FROM foods
    WHERE search_vector @@ to_tsquery('english', '${searchQuery}')
    LIMIT 10;
  `);
  console.log('Results:', JSON.stringify(result, null, 2));
}

testDrizzleSearch().catch(console.error);
