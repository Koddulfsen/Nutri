/**
 * Seed Core Compounds: Lignoceric Acid (C24:0)
 *
 * Run: npx tsx scripts/seed/03-lignoceric-acid.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const compound = { name: 'Lignoceric Acid', unit: 'g', type: 'MACRONUTRIENT' };

const mappings = [
  { source: 'FDC', externalId: '654', sourceName: 'Fatty acid 24:0 (Lignoceric acid)', sourceUnit: 'g', conversionFactor: '1.0', isCanonical: true },
  { source: 'CNF', externalId: '654', sourceName: '24:0 (Lignoceric acid)', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'AFCD', externalId: 'C24FD', sourceName: 'C24:0', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'CoFID', externalId: 'C24:0 /100g food', sourceName: 'C24:0 /100g food', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FOODfiles', externalId: 'F24D0', sourceName: 'Fatty acid 24:0', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'BLS', externalId: 'F24:0', sourceName: 'Fatty acid C24:0 (lignoceric acid)', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'NEVO', externalId: 'F24:0', sourceName: 'C24:0', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FRIDA', externalId: '100', sourceName: 'C24:0', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FooDB', externalId: '4652', sourceName: 'Carnaubic acid', sourceUnit: 'g', conversionFactor: '1.0' },
];

async function seed() {
  console.log('Seeding Lignoceric Acid...\n');
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
