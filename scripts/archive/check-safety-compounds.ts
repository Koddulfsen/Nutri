import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function check() {
  // Check for heavy metals
  const heavyMetals = await db.execute(sql`
    SELECT name, compound_type FROM compounds
    WHERE name ILIKE '%lead%'
       OR name ILIKE '%mercury%'
       OR name ILIKE '%arsenic%'
       OR name ILIKE '%cadmium%'
       OR name ILIKE '%aluminium%'
       OR name ILIKE '%aluminum%'
       OR name ILIKE '%antimony%'
  `);

  console.log('=== Heavy Metals Found ===');
  const hmRows = Array.isArray(heavyMetals) ? heavyMetals : (heavyMetals as any).rows || [];
  console.log(`Count: ${hmRows.length}`);
  hmRows.forEach((r: any) => console.log(`  - ${r.name} (${r.compound_type})`));

  // Check mycotoxins
  const mycotoxins = await db.execute(sql`
    SELECT name FROM compounds WHERE compound_type = 'MYCOTOXIN'
  `);
  const mtRows = Array.isArray(mycotoxins) ? mycotoxins : (mycotoxins as any).rows || [];
  console.log(`\n=== Mycotoxins (${mtRows.length}) ===`);
  mtRows.forEach((r: any) => console.log(`  - ${r.name}`));

  // Check pesticides
  const pesticides = await db.execute(sql`
    SELECT name FROM compounds WHERE compound_type = 'PESTICIDE_RESIDUE'
  `);
  const prRows = Array.isArray(pesticides) ? pesticides : (pesticides as any).rows || [];
  console.log(`\n=== Pesticide Residues (${prRows.length}) ===`);
  prRows.forEach((r: any) => console.log(`  - ${r.name}`));

  // Check plasticizers
  const plasticizers = await db.execute(sql`
    SELECT name FROM compounds WHERE compound_type = 'PLASTICIZER'
  `);
  const plRows = Array.isArray(plasticizers) ? plasticizers : (plasticizers as any).rows || [];
  console.log(`\n=== Plasticizers (${plRows.length}) ===`);
  plRows.forEach((r: any) => console.log(`  - ${r.name}`));

  // Show all compound types
  const allTypes = await db.execute(sql`
    SELECT DISTINCT compound_type, COUNT(*) as count FROM compounds GROUP BY compound_type ORDER BY compound_type
  `);
  const atRows = Array.isArray(allTypes) ? allTypes : (allTypes as any).rows || [];
  console.log(`\n=== All Compound Types ===`);
  atRows.forEach((t: any) => console.log(`  - ${t.compound_type}: ${t.count}`));
}

check().then(() => process.exit(0)).catch(console.error);
