/**
 * Seed Core Compounds: Energy
 *
 * Parsed from: docs/compound-mappings/01-energy.md
 *
 * Run: npx tsx scripts/seed/01-energy.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

// =============================================================================
// Energy - 1 compound, 33 mappings (verified against local data 2025-02-04)
// =============================================================================

const compound = {
  name: 'Energy',
  unit: 'kcal',
  type: 'MACRONUTRIENT',
};

// All rows with ✓ from the mapping table (verified against local source data)
const mappings = [
  // FDC (2)
  { source: 'FDC', externalId: '1008', sourceName: 'Energy', sourceUnit: 'kcal', conversionFactor: '1.0', isCanonical: true },
  { source: 'FDC', externalId: '1062', sourceName: 'Energy', sourceUnit: 'kJ', conversionFactor: '0.239' },
  // CNF (2)
  { source: 'CNF', externalId: '208', sourceName: 'ENERGY (KILOCALORIES)', sourceUnit: 'kcal', conversionFactor: '1.0' },
  { source: 'CNF', externalId: '268', sourceName: 'ENERGY (KILOJOULES)', sourceUnit: 'kJ', conversionFactor: '0.239' },
  // AFCD (2)
  { source: 'AFCD', externalId: 'Energy, with dietary fibre', sourceName: 'Energy, with dietary fibre', sourceUnit: 'kJ', conversionFactor: '0.239' },
  { source: 'AFCD', externalId: 'Energy, without dietary fibre', sourceName: 'Energy, without dietary fibre', sourceUnit: 'kJ', conversionFactor: '0.239' },
  // CoFID (2) - column names have duplicated unit suffix
  { source: 'CoFID', externalId: 'Energy (kcal) (kcal)', sourceName: 'Energy (kcal) (kcal)', sourceUnit: 'kcal', conversionFactor: '1.0' },
  { source: 'CoFID', externalId: 'Energy (kJ) (kJ)', sourceName: 'Energy (kJ) (kJ)', sourceUnit: 'kJ', conversionFactor: '0.239' },
  // CIQUAL (4)
  { source: 'CIQUAL', externalId: '327', sourceName: 'Energy, Regulation EU No 1169/2011', sourceUnit: 'kJ', conversionFactor: '0.239' },
  { source: 'CIQUAL', externalId: '328', sourceName: 'Energy, Regulation EU No 1169/2011', sourceUnit: 'kcal', conversionFactor: '1.0' },
  { source: 'CIQUAL', externalId: '332', sourceName: 'Energy, N x Jones\' factor, with fibres', sourceUnit: 'kJ', conversionFactor: '0.239' },
  { source: 'CIQUAL', externalId: '333', sourceName: 'Energy, N x Jones\' factor, with fibres', sourceUnit: 'kcal', conversionFactor: '1.0' },
  // FOODfiles (6)
  { source: 'FOODfiles', externalId: 'ENERC', sourceName: 'Energy, total metabolisable (kJ)', sourceUnit: 'kJ', conversionFactor: '0.239' },
  { source: 'FOODfiles', externalId: 'ENERC_KCAL', sourceName: 'Energy, total metabolisable (kcal)', sourceUnit: 'kcal', conversionFactor: '1.0' },
  { source: 'FOODfiles', externalId: 'ENERC1', sourceName: 'Energy, total metabolisable (kJ, including dietary fibre)', sourceUnit: 'kJ', conversionFactor: '0.239' },
  { source: 'FOODfiles', externalId: 'ENERC1_KCAL', sourceName: 'Energy, total metabolisable (kcal, including dietary fibre)', sourceUnit: 'kcal', conversionFactor: '1.0' },
  { source: 'FOODfiles', externalId: 'ENERC_FSANZ1', sourceName: 'Energy, total metabolisable, carbohydrate by difference, FSANZ (kJ)', sourceUnit: 'kJ', conversionFactor: '0.239' },
  { source: 'FOODfiles', externalId: 'ENERC_FSANZ1_KCAL', sourceName: 'Energy, total metabolisable, carbohydrate by difference, FSANZ (kcal)', sourceUnit: 'kcal', conversionFactor: '1.0' },
  // Fineli (1) - uses EuroFIR code
  { source: 'Fineli', externalId: 'ENERC', sourceName: 'Energia', sourceUnit: 'kJ', conversionFactor: '0.239' },
  // BLS (2) - uses EuroFIR-style codes
  { source: 'BLS', externalId: 'ENERCJ', sourceName: 'Energie (Kilojoule)', sourceUnit: 'kJ', conversionFactor: '0.239' },
  { source: 'BLS', externalId: 'ENERCC', sourceName: 'Energie (Kilokalorien)', sourceUnit: 'kcal', conversionFactor: '1.0' },
  // NEVO (2) - uses EuroFIR-style codes
  { source: 'NEVO', externalId: 'ENERCJ', sourceName: 'Energie kJ', sourceUnit: 'kJ', conversionFactor: '0.239' },
  { source: 'NEVO', externalId: 'ENERCC', sourceName: 'Energie kcal', sourceUnit: 'kcal', conversionFactor: '1.0' },
  // Matvaretabellen - NOT AVAILABLE (no energy in nutrient list)
  // FRIDA (4)
  { source: 'FRIDA', externalId: '137', sourceName: 'Energy (kJ)', sourceUnit: 'kJ', conversionFactor: '0.239' },
  { source: 'FRIDA', externalId: '316', sourceName: 'Energy, labelling (kJ)', sourceUnit: 'kJ', conversionFactor: '0.239' },
  { source: 'FRIDA', externalId: '356', sourceName: 'Energy (kcal)', sourceUnit: 'kcal', conversionFactor: '1.0' },
  { source: 'FRIDA', externalId: '359', sourceName: 'Energy, labelling (kcal)', sourceUnit: 'kcal', conversionFactor: '1.0' },
  // MEXT (1) - uses column index
  { source: 'MEXT', externalId: 'col:5', sourceName: 'エネルギー', sourceUnit: 'kcal', conversionFactor: '1.0' },
  // KFCT (1)
  { source: 'KFCT', externalId: 'ENERC', sourceName: 'Energy', sourceUnit: 'kcal', conversionFactor: '1.0' },
  // INDB (2)
  { source: 'INDB', externalId: 'energy_kj', sourceName: 'Energy', sourceUnit: 'kJ', conversionFactor: '0.239' },
  { source: 'INDB', externalId: 'energy_kcal', sourceName: 'Energy', sourceUnit: 'kcal', conversionFactor: '1.0' },
  // ASEANFOODS (1) - kcal only
  { source: 'ASEANFOODS', externalId: 'ENERC', sourceName: 'Energy', sourceUnit: 'kcal', conversionFactor: '1.0' },
  // FooDB (1)
  { source: 'FooDB', externalId: '38', sourceName: 'Energy', sourceUnit: 'kcal', conversionFactor: '1.0' },
];

// =============================================================================
// Seed
// =============================================================================

async function seed() {
  console.log('Seeding Energy...\n');

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
