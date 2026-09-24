import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function checkCompound(name: string) {
  console.log(`\n=== ${name} ===`);
  const cRows = await db.execute(sql`SELECT id, name, tier FROM compounds WHERE name ILIKE ${name} OR name ILIKE ${'%' + name + '%'}`);
  const compounds = ((cRows as any).rows ?? cRows) as any[];
  if (compounds.length === 0) { console.log('  Not in compounds table'); return; }

  for (const c of compounds) {
    console.log(`  Compound: "${c.name}" (id=${c.id}, tier=${c.tier})`);
    const fRows = await db.execute(sql`
      SELECT COUNT(*)::int as n,
             AVG(average_value::numeric)::float as avg_val,
             MAX(average_value::numeric)::float as max_val
      FROM merged_nutrients
      WHERE compound_id = ${c.id} AND average_value::numeric > 0
    `);
    const stats = ((fRows as any).rows ?? fRows)[0];
    console.log(`    Foods with non-zero value: ${stats.n}  (avg=${stats.avg_val?.toFixed?.(3) ?? 'n/a'}, max=${stats.max_val ?? 'n/a'})`);

    const top = await db.execute(sql`
      SELECT f.name, mn.average_value, mn.unit
      FROM merged_nutrients mn JOIN foods f ON f.id = mn.food_id
      WHERE mn.compound_id = ${c.id} AND average_value::numeric > 0
      ORDER BY average_value::numeric DESC LIMIT 3
    `);
    const topRows = ((top as any).rows ?? top) as any[];
    for (const t of topRows) console.log(`      ${t.average_value} ${t.unit}  ${t.name}`);
  }
}

async function main() {
  // Mead Acid: any whole-food data?
  await checkCompound('Mead Acid');

  // Sterols we should consider
  for (const s of ['Beta-Sitosterol', 'Sitosterol', 'Campesterol', 'Stigmasterol', 'Ergosterol', 'Lanosterol', 'Phytosterol']) {
    await checkCompound(s);
  }

  // Bonus: check that AA is renamed in DB
  console.log(`\n=== AA / Arachidonic Acid check ===`);
  const aa = await db.execute(sql`SELECT id, name, tier, compound_type FROM compounds WHERE name ILIKE '%arachidonic%' OR name = 'AA'`);
  console.log(JSON.stringify(((aa as any).rows ?? aa), null, 2));

  // Check compound_groups that might still reference 'AA'
  console.log(`\n=== compound_groups referencing 'AA' ===`);
  const groups = await db.execute(sql`SELECT name, slug, compound_names FROM compound_groups WHERE 'AA' = ANY(compound_names)`);
  console.log(JSON.stringify(((groups as any).rows ?? groups), null, 2));

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
