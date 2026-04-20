import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function main() {
  // Count by source
  const { data: sources } = await supabase
    .from('compound_sources')
    .select('external_source');

  const counts = sources?.reduce((acc: Record<string, number>, s) => {
    acc[s.external_source] = (acc[s.external_source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('Mappings by source:');
  console.log(JSON.stringify(counts, null, 2));

  // Total unique compounds mapped
  const { data: uniqueCompounds } = await supabase
    .from('compound_sources')
    .select('compound_id');

  const uniqueCount = new Set(uniqueCompounds?.map(c => c.compound_id)).size;
  console.log('\nUnique compounds mapped:', uniqueCount);

  // Total compounds in database
  const { count: totalCompounds } = await supabase
    .from('compounds')
    .select('*', { count: 'exact', head: true });

  console.log('Total compounds in database:', totalCompounds);
  console.log('Coverage:', ((uniqueCount / (totalCompounds || 1)) * 100).toFixed(1) + '%');
}

main();
