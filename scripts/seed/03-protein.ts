/**
 * Seed Core Compounds: Protein
 *
 * Parsed from: docs/compound-mappings/03-macronutrients.md
 *
 * Run: npx tsx scripts/seed/03-protein.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

// =============================================================================
// Protein - 1 compound, 16 mappings (verified against local data 2025-02-04)
// =============================================================================

const compound = {
  name: 'Protein',
  unit: 'g',
  type: 'MACRONUTRIENT',
};

// All rows with ✓ from the mapping table (verified against local source data)
const mappings = [
  // FDC (1)
  { source: 'FDC', externalId: '1003', sourceName: 'Protein', sourceUnit: 'g', conversionFactor: '1.0', isCanonical: true },
  // CNF (1)
  { source: 'CNF', externalId: '203', sourceName: 'PROTEIN', sourceUnit: 'g', conversionFactor: '1.0' },
  // AFCD (1)
  { source: 'AFCD', externalId: 'Protein', sourceName: 'Protein', sourceUnit: 'g', conversionFactor: '1.0' },
  // CoFID (1)
  { source: 'CoFID', externalId: 'Protein (g)', sourceName: 'Protein (g)', sourceUnit: 'g', conversionFactor: '1.0' },
  // CIQUAL (1)
  { source: 'CIQUAL', externalId: '25000', sourceName: 'Protein', sourceUnit: 'g', conversionFactor: '1.0' },
  // FOODfiles (1)
  { source: 'FOODfiles', externalId: 'PROT', sourceName: 'Protein, total', sourceUnit: 'g', conversionFactor: '1.0' },
  // Fineli (1)
  { source: 'Fineli', externalId: 'PROT', sourceName: 'Protein', sourceUnit: 'g', conversionFactor: '1.0' },
  // BLS (1)
  { source: 'BLS', externalId: 'PROT625', sourceName: 'Protein (Nx6.25)', sourceUnit: 'g', conversionFactor: '1.0' },
  // NEVO (1)
  { source: 'NEVO', externalId: 'PROT', sourceName: 'Eiwit totaal', sourceUnit: 'g', conversionFactor: '1.0' },
  // Matvaretabellen (1)
  { source: 'Matvaretabellen', externalId: 'Protein', sourceName: 'Protein', sourceUnit: 'g', conversionFactor: '1.0' },
  // FRIDA (1)
  { source: 'FRIDA', externalId: '218', sourceName: 'Protein', sourceUnit: 'g', conversionFactor: '1.0' },
  // MEXT (1)
  { source: 'MEXT', externalId: 'col:9', sourceName: 'たんぱく質', sourceUnit: 'g', conversionFactor: '1.0' },
  // KFCT (1)
  { source: 'KFCT', externalId: 'PROCNP', sourceName: '단백질', sourceUnit: 'g', conversionFactor: '1.0' },
  // INDB (1)
  { source: 'INDB', externalId: 'protein_g', sourceName: 'Protein', sourceUnit: 'g', conversionFactor: '1.0' },
  // ASEANFOODS (1)
  { source: 'ASEANFOODS', externalId: 'PROCNT', sourceName: 'Protein', sourceUnit: 'g', conversionFactor: '1.0' },
  // FooDB (1)
  { source: 'FooDB', externalId: '2', sourceName: 'Proteins', sourceUnit: 'g', conversionFactor: '1.0' },
];

// =============================================================================
// Seed
// =============================================================================

async function seed() {
  console.log('Seeding Protein...\n');

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
