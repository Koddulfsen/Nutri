/**
 * Seed Core Compounds: Leucine
 *
 * Parsed from: docs/compound-mappings/03-macronutrients.md
 *
 * Run: npx tsx scripts/seed/03-leucine.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

// =============================================================================
// Leucine - 1 compound, 6 mappings (verified against local data 2025-02-04)
// Note: Duke's excluded (web-only source)
// =============================================================================

const compound = {
  name: 'Leucine',
  unit: 'g',
  type: 'AMINO_ACID',
};

// All rows with ✓ from the mapping table (verified against local source data)
const mappings = [
  // FDC (1)
  { source: 'FDC', externalId: '1213', sourceName: 'Leucine', sourceUnit: 'g', conversionFactor: '1.0', isCanonical: true },
  // CNF (1)
  { source: 'CNF', externalId: '504', sourceName: 'LEUCINE', sourceUnit: 'g', conversionFactor: '1.0' },
  // AFCD (1) - unit is mg/g N (per gram nitrogen), complex conversion
  { source: 'AFCD', externalId: 'Leucine', sourceName: 'Leucine', sourceUnit: 'mg/g N', conversionFactor: '1.0' },
  // FOODfiles (1)
  { source: 'FOODfiles', externalId: 'LEU', sourceName: 'Leucine', sourceUnit: 'mg', conversionFactor: '0.001' },
  // BLS (1)
  { source: 'BLS', externalId: 'LEU', sourceName: 'Leucin', sourceUnit: 'g', conversionFactor: '1.0' },
  // FRIDA (1)
  { source: 'FRIDA', externalId: '180', sourceName: 'Leucin', sourceUnit: 'mg', conversionFactor: '0.001' },
];

// =============================================================================
// Seed
// =============================================================================

async function seed() {
  console.log('Seeding Leucine...\n');

  // Check if exists
  const existing = await sql`SELECT id FROM compounds WHERE name = ${compound.name}`;

  let compoundId: string;
  if (existing.length > 0) {
    compoundId = existing[0].id;
    await sql`
      UPDATE compounds SET tier = 'core', unit = ${compound.unit}
      WHERE id = ${compoundId}
    `;
    console.log(`~ ${compound.name} (updated)`);
  } else {
    const [row] = await sql`
      INSERT INTO compounds (compound_type, tier, name, unit)
      VALUES (${compound.type}::compound_type_enum, 'core', ${compound.name}, ${compound.unit})
      RETURNING id
    `;
    compoundId = row.id;
    console.log(`✓ ${compound.name} (created)`);
  }

  // Insert mappings
  let inserted = 0;
  for (const m of mappings) {
    const result = await sql`
      INSERT INTO compound_sources (compound_id, external_source, external_id, source_name, source_unit, conversion_factor, is_canonical)
      VALUES (${compoundId}, ${m.source}, ${m.externalId}, ${m.sourceName}, ${m.sourceUnit}, ${m.conversionFactor}, ${m.isCanonical ?? false})
      ON CONFLICT (external_source, external_id) DO NOTHING
      RETURNING id
    `;
    if (result.length > 0) inserted++;
  }

  console.log(`  └─ ${inserted}/${mappings.length} mappings inserted\n`);

  // Summary
  const total = await sql`SELECT COUNT(*) as n FROM compounds WHERE tier = 'core'`;
  const totalMappings = await sql`SELECT COUNT(*) as n FROM compound_sources`;
  console.log('─'.repeat(40));
  console.log(`Core compounds: ${total[0].n}`);
  console.log(`Total mappings: ${totalMappings[0].n}`);
}

seed().catch(console.error).finally(() => sql.end());
