/**
 * Seed Core Compounds: Galactose
 *
 * Run: npx tsx scripts/seed/03-galactose.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const compound = { name: 'Galactose', unit: 'g', type: 'MACRONUTRIENT' };

const mappings = [
  { source: 'FDC', externalId: '1075', sourceName: 'Galactose', sourceUnit: 'g', conversionFactor: '1.0', isCanonical: true },
  { source: 'CNF', externalId: '287', sourceName: 'Galactose', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'AFCD', externalId: 'Galactose', sourceName: 'Galactose', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'CoFID', externalId: 'Galactose (g)', sourceName: 'Galactose (g)', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'CIQUAL', externalId: '32220', sourceName: 'Galactose', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FOODfiles', externalId: 'GALS', sourceName: 'Galactose', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'Fineli', externalId: 'GALS', sourceName: 'Galactose', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'BLS', externalId: 'GALS', sourceName: 'Galactose', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FRIDA', externalId: '148', sourceName: 'Galaktose', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'KFCT', externalId: 'GALS', sourceName: '갈락토오스', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FooDB', externalId: '12706', sourceName: 'D-Galactose', sourceUnit: 'g', conversionFactor: '1.0' },
];

async function seed() {
  console.log('Seeding Galactose...\n');
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
