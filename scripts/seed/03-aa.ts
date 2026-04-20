/**
 * Seed Core Compounds: AA (C20:4 n-6) - Arachidonic acid
 *
 * Run: npx tsx scripts/seed/03-aa.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const compound = { name: 'AA', unit: 'g', type: 'MACRONUTRIENT' };

const mappings = [
  { source: 'FDC', externalId: '855', sourceName: '20:4 n-6', sourceUnit: 'g', conversionFactor: '1.0', isCanonical: true },
  { source: 'CNF', externalId: '855', sourceName: '20:4 n-6 arachidonic', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'AFCD', externalId: 'F20D4N6', sourceName: 'C20:4w6FD', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'CoFID', externalId: 'cis n-6 C20:4 /100g food', sourceName: 'cis n-6 C20:4 /100g food', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'CIQUAL', externalId: '42046', sourceName: 'FA 20:4 5c,8c,11c,14c (n-6)', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FOODfiles', externalId: 'F20D4CN6', sourceName: 'FA cis 20:4 omega-6', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'Fineli', externalId: 'F20D4N6', sourceName: 'F20D4N6', sourceUnit: 'mg', conversionFactor: '0.001' },
  { source: 'BLS', externalId: 'F20:4CN6', sourceName: 'Arachidonsäure', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'NEVO', externalId: 'F20:4CN6', sourceName: 'C20:4 n-6 cis', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'Matvaretabellen', externalId: 'F20:4N6', sourceName: 'C20:4n-6 (arachidonic acid)', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FRIDA', externalId: '86', sourceName: 'C20:4,n-6', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FooDB', externalId: 'FDB011872', sourceName: 'Arachidonic acid', sourceUnit: 'g', conversionFactor: '1.0' },
];

async function seed() {
  console.log('Seeding AA...\n');
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
