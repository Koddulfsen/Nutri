/**
 * Seed Core Compounds: Lactose
 *
 * Run: npx tsx scripts/seed/03-lactose.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const compound = { name: 'Lactose', unit: 'g', type: 'MACRONUTRIENT' };

const mappings = [
  { source: 'FDC', externalId: '1013', sourceName: 'Lactose', sourceUnit: 'g', conversionFactor: '1.0', isCanonical: true },
  { source: 'CNF', externalId: '213', sourceName: 'Lactose', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'AFCD', externalId: 'Lactose', sourceName: 'Lactose', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'CoFID', externalId: 'Lactose (g)', sourceName: 'Lactose (g)', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'CIQUAL', externalId: '32410', sourceName: 'Lactose', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FOODfiles', externalId: 'LACS', sourceName: 'Lactose', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'Fineli', externalId: 'LACS', sourceName: 'Lactose', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'BLS', externalId: 'LACS', sourceName: 'Lactose', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FRIDA', externalId: '179', sourceName: 'Laktose', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'KFCT', externalId: 'LACS', sourceName: '유당', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FooDB', externalId: '1145', sourceName: 'Lactose', sourceUnit: 'g', conversionFactor: '1.0' },
];

async function seed() {
  console.log('Seeding Lactose...\n');
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
