/**
 * Seed Core Compounds: Magnesium (Total)
 *
 * Run: npx tsx scripts/seed/05-magnesium.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const compound = { name: 'Magnesium (Total)', unit: 'mg', type: 'MINERAL' };

const mappings = [
  { source: 'FDC', externalId: '1090', sourceName: 'Magnesium, Mg', sourceUnit: 'mg', conversionFactor: '1.0', isCanonical: true },
  { source: 'CNF', externalId: '304', sourceName: 'Magnesium', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'AFCD', externalId: 'Magnesium (Mg)', sourceName: 'Magnesium (Mg)', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'CoFID', externalId: 'Magnesium (mg)', sourceName: 'Magnesium', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'CIQUAL', externalId: '10120', sourceName: 'Magnesium', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'FOODfiles', externalId: 'MG', sourceName: 'Magnesium', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'Fineli', externalId: 'MG', sourceName: 'Magnesium', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'BLS', externalId: 'MG', sourceName: 'Magnesium', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'NEVO', externalId: 'MG', sourceName: 'Magnesium', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'Matvaretabellen', externalId: 'Mg', sourceName: 'Magnesium', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'FRIDA', externalId: '184', sourceName: 'Magnesium', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'MEXT', externalId: 'col:26', sourceName: 'マグネシウム', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'KFCT', externalId: 'MG', sourceName: '마그네슘', sourceUnit: 'mg', conversionFactor: '1.0' },
  { source: 'INDB', externalId: 'magnesium_mg', sourceName: 'Magnesium', sourceUnit: 'mg', conversionFactor: '1.0' },
];

async function seed() {
  console.log('Seeding Magnesium (Total)...\n');
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
