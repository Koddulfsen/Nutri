/**
 * Seed Core Compounds: Tryptophan
 *
 * Parsed from: docs/compound-mappings/03-macronutrients.md
 *
 * Run: npx tsx scripts/seed/03-tryptophan.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

// =============================================================================
// Tryptophan - 1 compound, 8 mappings (includes Fineli and NEVO)
// =============================================================================

const compound = {
  name: 'Tryptophan',
  unit: 'g',
  type: 'AMINO_ACID',
};

const mappings = [
  // FDC
  { source: 'FDC', externalId: '1210', sourceName: 'Tryptophan', sourceUnit: 'g', conversionFactor: '1.0', isCanonical: true },
  // CNF
  { source: 'CNF', externalId: '501', sourceName: 'TRYPTOPHAN', sourceUnit: 'g', conversionFactor: '1.0' },
  // AFCD
  { source: 'AFCD', externalId: 'Tryptophan', sourceName: 'Tryptophan', sourceUnit: 'mg/g N', conversionFactor: '1.0' },
  // FOODfiles
  { source: 'FOODfiles', externalId: 'TRP', sourceName: 'Tryptophan', sourceUnit: 'mg', conversionFactor: '0.001' },
  // Fineli (only amino acid in Fineli)
  { source: 'Fineli', externalId: 'TRP', sourceName: 'Tryptophan', sourceUnit: 'mg', conversionFactor: '0.001' },
  // BLS
  { source: 'BLS', externalId: 'TRP', sourceName: 'Tryptophan', sourceUnit: 'g', conversionFactor: '1.0' },
  // NEVO (only amino acid in NEVO)
  { source: 'NEVO', externalId: 'TRP', sourceName: 'Tryptofaan', sourceUnit: 'mg', conversionFactor: '0.001' },
  // FRIDA
  { source: 'FRIDA', externalId: '262', sourceName: 'Tryptofan', sourceUnit: 'mg', conversionFactor: '0.001' },
];

// =============================================================================
// Seed
// =============================================================================

async function seed() {
  console.log('Seeding Tryptophan...\n');

  const existing = await sql`SELECT id FROM compounds WHERE name = ${compound.name}`;

  let compoundId: string;
  if (existing.length > 0) {
    compoundId = existing[0].id;
    await sql`UPDATE compounds SET tier = 'core', unit = ${compound.unit} WHERE id = ${compoundId}`;
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

  const total = await sql`SELECT COUNT(*) as n FROM compounds WHERE tier = 'core'`;
  const totalMappings = await sql`SELECT COUNT(*) as n FROM compound_sources`;
  console.log('─'.repeat(40));
  console.log(`Core compounds: ${total[0].n}`);
  console.log(`Total mappings: ${totalMappings[0].n}`);
}

seed().catch(console.error).finally(() => sql.end());
