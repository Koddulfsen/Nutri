import 'dotenv/config';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function main() {
  const total = await db.execute(sql`SELECT COUNT(*)::int AS n FROM reference_daily_values`);
  console.log('\n=== Total rows ===');
  console.log(total);

  const perSource = await db.execute(sql`
    SELECT source_region, COUNT(*)::int AS rows
    FROM reference_daily_values
    GROUP BY source_region
    ORDER BY rows DESC
  `);
  console.log('\n=== Rows per source_region ===');
  console.table(perSource);

  const perType = await db.execute(sql`
    SELECT value_type, COUNT(*)::int AS rows
    FROM reference_daily_values
    GROUP BY value_type
    ORDER BY rows DESC
  `);
  console.log('\n=== Rows per value_type ===');
  console.table(perType);

  const compounds = await db.execute(sql`
    SELECT COUNT(DISTINCT compound_id)::int AS n FROM reference_daily_values
  `);
  console.log('\n=== Distinct compounds with DV data ===');
  console.log(compounds);

  const matrix = await db.execute(sql`
    SELECT c.name AS compound,
           STRING_AGG(DISTINCT rdv.value_type::text, ', ' ORDER BY rdv.value_type::text) AS value_types,
           COUNT(DISTINCT rdv.source_region)::int AS sources,
           COUNT(*)::int AS rows
    FROM reference_daily_values rdv
    JOIN compounds c ON c.id = rdv.compound_id
    GROUP BY c.name
    ORDER BY c.name
  `);
  console.log('\n=== Compounds × value_types they have (every compound with DV data) ===');
  console.table(matrix);

  // Compounds that ONLY have UL (upper-limit only — i.e. things like heavy metals or vitamins where only a cap is published)
  const ulOnly = await db.execute(sql`
    WITH per_compound AS (
      SELECT compound_id,
             STRING_AGG(DISTINCT value_type::text, ',' ORDER BY value_type::text) AS types
      FROM reference_daily_values
      GROUP BY compound_id
    )
    SELECT c.name, pc.types
    FROM per_compound pc
    JOIN compounds c ON c.id = pc.compound_id
    WHERE pc.types = 'UL'
    ORDER BY c.name
  `);
  console.log('\n=== Compounds with ONLY UL (upper-limit only) ===');
  console.table(ulOnly);

  // Total compounds in DB vs compounds with DV data
  const compTotal = await db.execute(sql`SELECT COUNT(*)::int AS n FROM compounds`);
  console.log('\n=== Total compounds in DB ===');
  console.log(compTotal);

  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
