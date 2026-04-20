/**
 * Check for missing compounds in the database
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Check for fatty acids
  const { data: fattyAcids } = await supabase
    .from('compounds')
    .select('name, alternate_names, compound_type')
    .eq('compound_type', 'FATTY_ACID')
    .order('name');

  console.log('=== FATTY ACIDS IN DB ===');
  for (const c of fattyAcids || []) {
    const altNames = c.alternate_names?.length ? ` (${c.alternate_names.join(', ')})` : '';
    console.log(`  ${c.name}${altNames}`);
  }

  // Check for sterol-related
  console.log('\n=== STEROL-RELATED COMPOUNDS ===');
  const { data: sterols } = await supabase
    .from('compounds')
    .select('name, alternate_names, compound_type')
    .or('name.ilike.%sterol%,name.ilike.%stigma%,name.ilike.%sito%,name.ilike.%campe%');

  for (const c of sterols || []) {
    console.log(`  ${c.name} [${c.compound_type}]`);
  }

  // Check for cholesterol
  const { data: chol } = await supabase
    .from('compounds')
    .select('name, compound_type')
    .ilike('name', '%cholesterol%');
  console.log('\n=== CHOLESTEROL ===');
  console.log(chol);

  // Check for starch
  console.log('\n=== STARCH-RELATED ===');
  const { data: starch } = await supabase
    .from('compounds')
    .select('name, compound_type')
    .ilike('name', '%starch%');
  console.log(starch);

  // Check for carbohydrate totals
  console.log('\n=== CARBOHYDRATE COMPOUNDS ===');
  const { data: carbs } = await supabase
    .from('compounds')
    .select('name, compound_type')
    .eq('compound_type', 'CARBOHYDRATE')
    .order('name');
  for (const c of carbs || []) {
    console.log(`  ${c.name}`);
  }
}

main().catch(console.error);
