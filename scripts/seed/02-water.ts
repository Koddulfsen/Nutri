/**
 * Seed Core Compounds: Water
 *
 * Parsed from: docs/compound-mappings/02-water.md
 *
 * Run: npx tsx scripts/seed/02-water.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

// =============================================================================
// Water - 1 compound, 14 mappings (verified against local data 2025-02-04)
// =============================================================================

const compound = {
  name: 'Water',
  unit: 'g',
  type: 'MACRONUTRIENT',
};

// All rows with ✓ from the mapping table (verified against local source data)
const mappings = [
  // FDC (1)
  { source: 'FDC', externalId: '1051', sourceName: 'Water', sourceUnit: 'g', conversionFactor: '1.0', isCanonical: true },
  // CNF (1)
  { source: 'CNF', externalId: '255', sourceName: 'MOISTURE', sourceUnit: 'g', conversionFactor: '1.0' },
  // AFCD (1)
  { source: 'AFCD', externalId: 'Moisture', sourceName: 'Moisture', sourceUnit: 'g', conversionFactor: '1.0' },
  // CoFID (1)
  { source: 'CoFID', externalId: 'Water (g)', sourceName: 'Water (g)', sourceUnit: 'g', conversionFactor: '1.0' },
  // CIQUAL (1)
  { source: 'CIQUAL', externalId: '400', sourceName: 'Water', sourceUnit: 'g', conversionFactor: '1.0' },
  // FOODfiles (1)
  { source: 'FOODfiles', externalId: 'WATER', sourceName: 'Water', sourceUnit: 'g', conversionFactor: '1.0' },
  // Fineli (1)
  { source: 'Fineli', externalId: 'WATER', sourceName: 'Water', sourceUnit: 'g', conversionFactor: '1.0' },
  // BLS (1)
  { source: 'BLS', externalId: 'WATER', sourceName: 'Wasser', sourceUnit: 'g', conversionFactor: '1.0' },
  // NEVO (1)
  { source: 'NEVO', externalId: 'WATER', sourceName: 'Water total', sourceUnit: 'g', conversionFactor: '1.0' },
  // Matvaretabellen (1)
  { source: 'Matvaretabellen', externalId: 'Vann', sourceName: 'Water', sourceUnit: 'g', conversionFactor: '1.0' },
  // FRIDA (1)
  { source: 'FRIDA', externalId: '268', sourceName: 'Vand', sourceUnit: 'g', conversionFactor: '1.0' },
  // MEXT (1)
  { source: 'MEXT', externalId: 'col:7', sourceName: '水分', sourceUnit: 'g', conversionFactor: '1.0' },
  // KFCT (1)
  { source: 'KFCT', externalId: 'WATER', sourceName: '수분', sourceUnit: 'g', conversionFactor: '1.0' },
  // ASEANFOODS (1)
  { source: 'ASEANFOODS', externalId: 'WATER', sourceName: 'Moisture', sourceUnit: 'g', conversionFactor: '1.0' },
  // INDB - not available
  // FooDB - not available
];

// =============================================================================
// Seed
// =============================================================================

async function seed() {
  console.log('Seeding Water...\n');

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
