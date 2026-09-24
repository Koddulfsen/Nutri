import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  const { count } = await supabase.from('compounds').select('*', { count: 'exact', head: true });
  console.log('Total compounds:', count);

  const { data } = await supabase.from('compounds').select('compound_type');
  const byType: Record<string, number> = {};
  data?.forEach(c => { byType[c.compound_type] = (byType[c.compound_type] || 0) + 1; });
  console.log('\nBy type:');
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
}

main();
