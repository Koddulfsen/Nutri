import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function check() {
  const result = await db.execute(sql`SELECT unnest(enum_range(NULL::api_source_enum)) as value`);
  const rows = (result as any).rows ?? result;
  console.log('Current api_source_enum values:');
  rows.forEach((r: any) => console.log('  -', r.value));
  
  const hasDuke = rows.some((r: any) => r.value === 'DUKE');
  console.log('\nDUKE in enum:', hasDuke ? 'YES' : 'NO - needs to be added');
  
  // Also check compound count per plant
  const compoundCounts = await db.execute(sql`
    SELECT p.common_name, p.fnf_num, COUNT(f.id) as compound_count
    FROM source_duke_plants p
    LEFT JOIN source_duke_farmacy f ON f.fnf_num = p.fnf_num
    GROUP BY p.common_name, p.fnf_num
    ORDER BY compound_count DESC
    LIMIT 10
  `);
  const countRows = (compoundCounts as any).rows ?? compoundCounts;
  console.log('\nTop 10 plants by compound count:');
  countRows.forEach((r: any) => console.log(`  - ${r.common_name}: ${r.compound_count} compounds`));
  
  process.exit(0);
}

check();
