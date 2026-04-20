/**
 * Seed Core Compounds: Lauric Acid (C12:0)
 *
 * Run: npx tsx scripts/seed/03-lauric-acid.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const compound = { name: 'Lauric Acid', unit: 'g', type: 'MACRONUTRIENT' };

const mappings = [
  { source: 'FDC', externalId: '611', sourceName: 'Fatty acid 12:0 (Lauric acid)', sourceUnit: 'g', conversionFactor: '1.0', isCanonical: true },
  { source: 'CNF', externalId: '611', sourceName: '12:0 (Lauric acid)', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'AFCD', externalId: 'C12FD', sourceName: 'C12:0', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'CoFID', externalId: 'C12:0 /100g food', sourceName: 'C12:0 /100g food', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'CIQUAL', externalId: '41200', sourceName: 'FA 12:0', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FOODfiles', externalId: 'F12D0', sourceName: 'Fatty acid 12:0', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'BLS', externalId: 'F12:0', sourceName: 'Fatty acid C12:0 (Laurinsäure)', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'NEVO', externalId: 'F12:0', sourceName: 'C12:0', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'Matvaretabellen', externalId: 'C12:0Laurinsyre', sourceName: 'C12:0 (lauric acid)', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FRIDA', externalId: '49', sourceName: 'C12:0', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FooDB', externalId: '3011', sourceName: 'Dodecanoic acid', sourceUnit: 'g', conversionFactor: '1.0' },
];

async function seed() {
  console.log('Seeding Lauric Acid...\n');
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
