/**
 * Seed Core Compounds: Vitamin D2 (Ergocalciferol)
 *
 * Run: npx tsx scripts/seed/04-vitamin-d2.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const compound = { name: 'Vitamin D2 (Ergocalciferol)', unit: 'μg', type: 'VITAMIN' };

const mappings = [
  { source: 'FDC', externalId: '1111', sourceName: 'Vitamin D2 (ergocalciferol)', sourceUnit: 'μg', conversionFactor: '1.0', isCanonical: true },
  { source: 'CNF', externalId: '325', sourceName: 'Vitamin D2 (ergocalciferol)', sourceUnit: 'μg', conversionFactor: '1.0' },
  { source: 'CIQUAL', externalId: '52200', sourceName: 'Vitamin D2 (ergocalciferol)', sourceUnit: 'μg', conversionFactor: '1.0' },
  { source: 'FOODfiles', externalId: 'ERGCAL', sourceName: 'Ergocalciferol (Vitamin D2)', sourceUnit: 'μg', conversionFactor: '1.0' },
  { source: 'BLS', externalId: 'ERGCAL', sourceName: 'Vitamin D2 (ergocalciferol)', sourceUnit: 'μg', conversionFactor: '1.0' },
  { source: 'NEVO', externalId: 'ERGCAL', sourceName: 'Ergocalciferol (Vit D2)', sourceUnit: 'μg', conversionFactor: '1.0' },
  { source: 'FRIDA', externalId: '127', sourceName: 'Vitamin D2', sourceUnit: 'μg', conversionFactor: '1.0' },
  { source: 'KFCT', externalId: 'ERGCAL', sourceName: 'Ergocalciferol', sourceUnit: 'μg', conversionFactor: '1.0' },
  { source: 'INDB', externalId: 'vitd2_ug', sourceName: 'Vitd2', sourceUnit: 'μg', conversionFactor: '1.0' },
  { source: 'FooDB', externalId: 'FDB012811', sourceName: 'Ergocalciferol', sourceUnit: 'μg', conversionFactor: '1.0' },
];

async function seed() {
  console.log('Seeding Vitamin D2 (Ergocalciferol)...\n');
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
