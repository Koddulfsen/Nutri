/**
 * Seed Core Compounds: Vitamin B6
 *
 * Run: npx tsx scripts/seed/04-vitamin-b6.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const compound = { name: 'Vitamin B6', unit: 'mg', type: 'VITAMIN' };

const mappings = [
  { source: 'FDC', externalId: '1175', sourceName: 'Vitamin B-6', sourceUnit: 'mg', conversionFactor: '1.0', isCanonical: true },
  { source: 'CNF', externalId: '415', sourceName: 'Vitamin B-6', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'AFCD', externalId: 'Pyridoxine (B6)', sourceName: 'Pyridoxine (B6)', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'CoFID', externalId: 'Vitamin B6 (mg)', sourceName: 'Vitamin B6', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'CIQUAL', externalId: '56500', sourceName: 'Vitamin B6', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'FOODfiles', externalId: 'VITB6A', sourceName: 'Vitamin B6', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'Fineli', externalId: 'VITPYRID', sourceName: 'Vitamin B6 (pyridoxine)', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'BLS', externalId: 'VITB6', sourceName: 'Vitamin B6', sourceUnit: 'µg', conversionFactor: '0.001' },
  { source: 'NEVO', externalId: 'VITB6', sourceName: 'Pyridoxine (Vit B6)', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'Matvaretabellen', externalId: 'Vit B6', sourceName: 'Vitamin B6 (pyridoxine)', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'FRIDA', externalId: '40', sourceName: 'Vitamin B6', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'MEXT', externalId: 'col:53', sourceName: 'ビタミンＢ６', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'KFCT', externalId: 'PYRXN', sourceName: 'Pyridoxine', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'INDB', externalId: 'vitb6_mg', sourceName: 'Vitb6', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'FooDB', externalId: 'FDB000574', sourceName: 'Pyridoxine', sourceUnit: 'mg', conversionFactor: '1.0' },
];

async function seed() {
  console.log('Seeding Vitamin B6...\n');
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
