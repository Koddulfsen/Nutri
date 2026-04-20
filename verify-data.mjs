import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n📊 Verifying Nutri Database Integrity...\n');

const tables = [
  'compounds',
  'food_categories',
  'user_profiles',
  'user_consent',
  'api_keys',
  'research_citations',
  'research_citation_compound_links',
  'medication_interactions',
  'compound_validation_ranges'
];

for (const table of tables) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.log(`❌ ${table}: ERROR -`, error.message);
  } else {
    console.log(`✅ ${table}: ${count} rows`);
  }
}

console.log('\n✨ Verification complete!\n');
