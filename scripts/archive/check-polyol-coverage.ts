import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function main() {
  const polyols = ['Xylitol', 'Erythritol', 'Maltitol', 'Lactitol', 'Sorbitol', 'Mannitol'];

  for (const name of polyols) {
    console.log(`\n=== ${name} ===`);

    // Find compound
    const cRows = await db.execute(sql`SELECT id, name FROM compounds WHERE name = ${name}`);
    const compound = ((cRows as any).rows ?? cRows)[0];
    if (!compound) { console.log('  Not in compounds table'); continue; }

    // Mappings
    const mRows = await db.execute(sql`
      SELECT cs.external_source, cs.external_id, csv.status
      FROM compound_sources cs
      LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
      WHERE cs.compound_id = ${compound.id}
      ORDER BY cs.external_source
    `);
    const mappings = ((mRows as any).rows ?? mRows) as any[];
    console.log(`  Mappings: ${mappings.length} (${mappings.map(m => `${m.external_source}${m.status ? '/' + m.status : ''}`).join(', ')})`);

    // How many foods actually have a value
    const fRows = await db.execute(sql`
      SELECT COUNT(*)::int as n,
             MIN(average_value::numeric) as min_val,
             AVG(average_value::numeric) as avg_val,
             MAX(average_value::numeric) as max_val
      FROM merged_nutrients
      WHERE compound_id = ${compound.id} AND average_value::numeric > 0
    `);
    const stats = ((fRows as any).rows ?? fRows)[0];
    console.log(`  Foods with non-zero value: ${stats.n}  (min=${stats.min_val}, avg=${parseFloat(stats.avg_val ?? 0).toFixed(3)}, max=${stats.max_val})`);

    // Top 5 foods by value
    const tRows = await db.execute(sql`
      SELECT f.name, mn.average_value, mn.unit, mn.source_count
      FROM merged_nutrients mn
      JOIN foods f ON f.id = mn.food_id
      WHERE mn.compound_id = ${compound.id} AND average_value::numeric > 0
      ORDER BY average_value::numeric DESC
      LIMIT 5
    `);
    const top = ((tRows as any).rows ?? tRows) as any[];
    if (top.length > 0) {
      console.log(`  Top foods:`);
      for (const t of top) console.log(`    ${t.average_value} ${t.unit}  ${t.name}  (${t.source_count} source${t.source_count !== 1 ? 's' : ''})`);
    }
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
