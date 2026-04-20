/**
 * Seed Core Compounds: DPA (C22:5 n-3) - Docosapentaenoic acid
 *
 * Run: npx tsx scripts/seed/03-dpa.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const compound = { name: 'DPA', unit: 'g', type: 'MACRONUTRIENT' };

const mappings = [
  { source: 'FDC', externalId: '631', sourceName: '22:5 n-3 (DPA)', sourceUnit: 'g', conversionFactor: '1.0', isCanonical: true },
  { source: 'CNF', externalId: '631', sourceName: '22:5n-3, docosapentaenoic', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'AFCD', externalId: 'C22:5w3 Docosapentaenoic', sourceName: 'C22:5w3 Docosapentaenoic', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'CoFID', externalId: 'cis n-3 C22:5 /100g food', sourceName: 'cis n-3 C22:5 /100g food', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FOODfiles', externalId: 'F22D5N3', sourceName: 'Fatty acid 22:5 omega-3', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'BLS', externalId: 'F22:5CN3', sourceName: 'C22:5 n-3 all-cis', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'NEVO', externalId: 'F22:5CN3', sourceName: 'C22:5 n-3 cis (DPA)', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'Matvaretabellen', externalId: 'F22:5N3', sourceName: 'C22:5n-3 (docosapentaenoic acid, DPA)', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FRIDA', externalId: '98', sourceName: 'C22:5,n-3', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FooDB', externalId: '21989', sourceName: 'Docosapentaenoic acid', sourceUnit: 'g', conversionFactor: '1.0' },
];

async function seed() {
  console.log('Seeding DPA...\n');
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
