/**
 * Seed Core Compounds: Saturated Fat (Total)
 *
 * Run: npx tsx scripts/seed/03-saturated-fat.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const compound = { name: 'Saturated Fat', unit: 'g', type: 'MACRONUTRIENT' };

const mappings = [
  { source: 'FDC', externalId: '606', sourceName: 'Fatty acids, total saturated', sourceUnit: 'g', conversionFactor: '1.0', isCanonical: true },
  { source: 'CNF', externalId: '606', sourceName: 'Fatty acids, total saturated', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'AFCD', externalId: 'Total saturated fatty acids', sourceName: 'Total saturated fatty acids', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'CoFID', externalId: 'Satd FA /100g fd', sourceName: 'Satd FA /100g fd', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'CIQUAL', externalId: '40302', sourceName: 'FA saturated', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FOODfiles', externalId: 'FASAT', sourceName: 'Fatty acids, total saturated', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'Fineli', externalId: 'FASAT', sourceName: 'Fatty acids, total saturated', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'BLS', externalId: 'FASAT', sourceName: 'Fatty acids, saturated, total', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'NEVO', externalId: 'FASAT', sourceName: 'Fatty acids saturated total', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'Matvaretabellen', externalId: 'Mettet', sourceName: 'Saturated fatty acids', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FRIDA', externalId: '248', sourceName: 'Sum saturated fatty acids', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'INDB', externalId: 'sfa_mg', sourceName: 'Sfa', sourceUnit: 'mg', conversionFactor: '0.001' },
];

async function seed() {
  console.log('Seeding Saturated Fat...\n');
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
