/**
 * Seed Core Compounds: Carbohydrates (Total)
 *
 * Run: npx tsx scripts/seed/03-carbohydrates.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const compound = { name: 'Carbohydrates', unit: 'g', type: 'MACRONUTRIENT' };

const mappings = [
  { source: 'FDC', externalId: '1005', sourceName: 'Carbohydrate, by difference', sourceUnit: 'g', conversionFactor: '1.0', isCanonical: true },
  { source: 'CNF', externalId: '205', sourceName: 'CARBOHYDRATE, TOTAL (BY DIFFERENCE)', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'AFCD', externalId: 'Available carbohydrate, with sugar alcohols', sourceName: 'Available carbohydrate, with sugar alcohols', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'CoFID', externalId: 'Carbohydrate (g)', sourceName: 'Carbohydrate (g)', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'CIQUAL', externalId: '31000', sourceName: 'Carbohydrate', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FOODfiles', externalId: 'CHOCDF', sourceName: 'Total carbohydrate by difference', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'Fineli', externalId: 'CHOAVL', sourceName: 'Carbohydrate, available', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'BLS', externalId: 'CHO', sourceName: 'Kohlenhydrate, verfügbar', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'NEVO', externalId: 'CHO', sourceName: 'Koolhydraten beschikbaar', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'Matvaretabellen', externalId: 'Karbo', sourceName: 'Carbohydrate', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FRIDA', externalId: '170', sourceName: 'Kulhydrat difference', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'MEXT', externalId: 'col20', sourceName: '炭水化物', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'KFCT', externalId: 'CHOTDF', sourceName: '탄수화물', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'INDB', externalId: 'carb_g', sourceName: 'Carb', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'ASEANFOODS', externalId: 'CHOCDF', sourceName: 'Total carbohydrate', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FooDB', externalId: '3', sourceName: 'Carbohydrate', sourceUnit: 'g', conversionFactor: '1.0' },
];

async function seed() {
  console.log('Seeding Carbohydrates...\n');
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
