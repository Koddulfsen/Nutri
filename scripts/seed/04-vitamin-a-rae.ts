/**
 * Seed Core Compounds: Vitamin A (RAE)
 *
 * Run: npx tsx scripts/seed/04-vitamin-a-rae.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const compound = { name: 'Vitamin A (RAE)', unit: 'μg', type: 'VITAMIN' };

const mappings = [
  { source: 'FDC', externalId: '1106', sourceName: 'Vitamin A, RAE', sourceUnit: 'μg', conversionFactor: '1.0', isCanonical: true },
  { source: 'CNF', externalId: '814', sourceName: 'Retinol activity equivalents, RAE', sourceUnit: 'μg', conversionFactor: '1.0' },
  { source: 'CIQUAL', externalId: '51104', sourceName: 'Vitamin A activity, retinol equivalent', sourceUnit: 'μg', conversionFactor: '1.0' },
  { source: 'FOODfiles', externalId: 'VITA_RAE', sourceName: 'Vitamin A, retinol activity equivalents', sourceUnit: 'μg', conversionFactor: '1.0' },
  { source: 'Fineli', externalId: 'VITA', sourceName: 'Vitamin A', sourceUnit: 'μg', conversionFactor: '1.0' },
  { source: 'BLS', externalId: 'VITAA', sourceName: 'Vitamin A, retinol activity equivalents (RAE)', sourceUnit: 'μg', conversionFactor: '1.0' },
  { source: 'NEVO', externalId: 'VITA_RAE', sourceName: 'Retinol activity equivalents (RAE)', sourceUnit: 'μg', conversionFactor: '1.0' },
  { source: 'Matvaretabellen', externalId: 'Vit A', sourceName: 'Vitamin A (RAE)', sourceUnit: 'RAE', conversionFactor: '1.0' },
  { source: 'FRIDA', externalId: '12', sourceName: 'Vitamin A', sourceUnit: 'RE μg', conversionFactor: '1.0' },
  { source: 'MEXT', externalId: 'col:42', sourceName: 'レチノール活性当量', sourceUnit: 'μg', conversionFactor: '1.0' },
  { source: 'KFCT', externalId: 'VITA_RAE', sourceName: '비타민 A(RAE) / Retinol Activity Equivalent', sourceUnit: 'μg', conversionFactor: '1.0' },
  { source: 'INDB', externalId: 'vita_ug', sourceName: 'Vita', sourceUnit: 'μg', conversionFactor: '1.0' },
  { source: 'ASEANFOODS', externalId: 'VITA_RAE', sourceName: 'Vitamin A RAE', sourceUnit: 'μg', conversionFactor: '1.0' },
];

async function seed() {
  console.log('Seeding Vitamin A (RAE)...\n');
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
