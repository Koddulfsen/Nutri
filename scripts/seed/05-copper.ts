/**
 * Seed Core Compounds: Copper
 *
 * Run: npx tsx scripts/seed/05-copper.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const compound = { name: 'Copper', unit: 'mg', type: 'MINERAL' };

const mappings = [
  { source: 'FDC', externalId: '1098', sourceName: 'Copper, Cu', sourceUnit: 'mg', conversionFactor: '1.0', isCanonical: true },
  { source: 'CNF', externalId: '312', sourceName: 'Copper', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'AFCD', externalId: 'Copper (Cu)', sourceName: 'Copper (Cu)', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'CoFID', externalId: 'Copper (mg)', sourceName: 'Copper', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'CIQUAL', externalId: '10290', sourceName: 'Copper', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'FOODfiles', externalId: 'CU', sourceName: 'Copper', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'Fineli', externalId: 'CU', sourceName: 'Kupari', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'BLS', externalId: 'CU', sourceName: 'Kupfer', sourceUnit: 'µg', conversionFactor: '0.001' },
  { source: 'NEVO', externalId: 'CU', sourceName: 'Koper', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'Matvaretabellen', externalId: 'Cu', sourceName: 'Copper (Cu)', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'FRIDA', externalId: '166', sourceName: 'Kobber', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'MEXT', externalId: 'col:30', sourceName: '銅', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'KFCT', externalId: 'CU', sourceName: '구리', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'INDB', externalId: 'copper_mg', sourceName: 'Copper', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'ASEANFOODS', externalId: 'CU', sourceName: 'Copper', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'FooDB', externalId: 'FDB003582', sourceName: 'Copper', sourceUnit: 'mg', conversionFactor: '1.0' },
];

async function seed() {
  console.log('Seeding Copper...\n');
  const existing = await sql`SELECT id FROM compounds WHERE name = ${compound.name}`;
  let compoundId: string;
  if (existing.length > 0) {
    compoundId = existing[0].id;
    await sql`UPDATE compounds SET tier = 'core', unit = ${compound.unit} WHERE id = ${compoundId}`;
    console.log(`~ ${compound.name} (updated)`);
  } else {
    const [row] = await sql`INSERT INTO compounds (compound_type, tier, name, unit) VALUES (${compound.type}::compound_type_enum, 'core', ${compound.name}, ${compound.unit}) RETURNING id`;
    compoundId = row.id;
    console.log(`✓ ${compound.name} (created)`);
  }
  let inserted = 0;
  for (const m of mappings) {
    const result = await sql`INSERT INTO compound_sources (compound_id, external_source, external_id, source_name, source_unit, conversion_factor, is_canonical) VALUES (${compoundId}, ${m.source}, ${m.externalId}, ${m.sourceName}, ${m.sourceUnit}, ${m.conversionFactor}, ${m.isCanonical ?? false}) ON CONFLICT (external_source, external_id) DO NOTHING RETURNING id`;
    if (result.length > 0) inserted++;
  }
  console.log(`  └─ ${inserted}/${mappings.length} mappings inserted\n`);
  const total = await sql`SELECT COUNT(*) as n FROM compounds WHERE tier = 'core'`;
  const totalMappings = await sql`SELECT COUNT(*) as n FROM compound_sources`;
  console.log('─'.repeat(40));
  console.log(`Core compounds: ${total[0].n}`);
  console.log(`Total mappings: ${totalMappings[0].n}`);
}

seed().catch(console.error).finally(() => sql.end());
