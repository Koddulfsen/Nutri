/**
 * Seed Core Compounds: Monounsaturated Fat (Total)
 *
 * Run: npx tsx scripts/seed/03-monounsaturated-fat.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const compound = { name: 'Monounsaturated Fat', unit: 'g', type: 'MACRONUTRIENT' };

const mappings = [
  { source: 'FDC', externalId: '645', sourceName: 'Fatty acids, total monounsaturated', sourceUnit: 'g', conversionFactor: '1.0', isCanonical: true },
  { source: 'CNF', externalId: '645', sourceName: 'Fatty acids, total monounsaturated', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'AFCD', externalId: 'Total monounsaturated fatty acids', sourceName: 'Total monounsaturated fatty acids', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'CoFID', externalId: 'Mono FA /100g food', sourceName: 'Mono FA /100g food', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'CIQUAL', externalId: '40303', sourceName: 'FA mono', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FOODfiles', externalId: 'FAMS', sourceName: 'Fatty acids, total monounsaturated', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'Fineli', externalId: 'FAMCIS', sourceName: 'Monounsaturated cis fatty acids', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'BLS', externalId: 'FAMS', sourceName: 'Fatty acids, monounsaturated, total', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'NEVO', externalId: 'FAMSCIS', sourceName: 'Fatty acids monounsaturated cis total', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'Matvaretabellen', externalId: 'Enumet', sourceName: 'Monounsaturated fatty acids', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FRIDA', externalId: '247', sourceName: 'Sum monounsaturated fatty acids', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'INDB', externalId: 'mufa_mg', sourceName: 'Mufa', sourceUnit: 'mg', conversionFactor: '0.001' },
];

async function seed() {
  console.log('Seeding Monounsaturated Fat...\n');
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
