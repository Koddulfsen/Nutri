/**
 * Seed Duke Compound Mappings
 *
 * Maps 155 Duke chemicals → Nutri core compounds via compound_sources.
 * Uses three matching strategies:
 *   1. Exact name match (Duke name = Nutri name, case-insensitive)
 *   2. Hyphen-to-space match (OLEIC-ACID → Oleic Acid)
 *   3. Manual mapping (CALCIUM → Calcium (Total), etc.)
 *
 * Progress tracked in: docs/compound-mappings/DUKE-MAPPING-PROGRESS.md
 *
 * Run: npx tsx scripts/seed/duke-compound-mappings.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

// Manual mapping for Duke names that don't match Nutri compounds via name transforms
const MANUAL_MAP: Record<string, string> = {
  // Minerals with "(Total)" suffix
  CALCIUM: 'Calcium (Total)',
  IRON: 'Iron (Total)',
  ZINC: 'Zinc (Total)',
  MAGNESIUM: 'Magnesium (Total)',
  SELENIUM: 'Selenium (Total)',
  CHROMIUM: 'Chromium (Total)',
  // Minerals with element symbol suffix
  COBALT: 'Cobalt (Co)',
  ALUMINUM: 'Aluminum (Al)',
  ARSENIC: 'Arsenic (As) - Total',
  CADMIUM: 'Cadmium (Cd)',
  LEAD: 'Lead (Pb)',
  MERCURY: 'Mercury (Hg) - Total',
  NICKEL: 'Nickel (Ni)',
  TIN: 'Tin (Sn)',
  // Vitamins with different names
  NIACIN: 'Niacin (B3)',
  THIAMIN: 'Thiamin (B1)',
  RIBOFLAVIN: 'Riboflavin (B2)',
  BIOTIN: 'Biotin (B7)',
  CHOLINE: 'Choline (Total)',
  FOLATE: 'Folate (Total)',
  // Macros with different names
  FAT: 'Total Fat',
  FIBER: 'Dietary Fiber',
  KILOCALORIES: 'Energy',
  // Sterols
  PHYTOSTEROLS: 'Total Plant Sterols',
};

async function seed() {
  console.log('Seeding Duke compound mappings...\n');

  // 1. Exact name matches
  const exact = await sql`
    SELECT sdc.chem_id, sdc.name as duke_name, c.name as nutri_name, c.id as compound_id
    FROM source_duke_chemicals sdc
    JOIN compounds c ON LOWER(c.name) = LOWER(sdc.name)
    ORDER BY sdc.name
  `;
  console.log(`  Exact name matches: ${exact.length}`);

  // 2. Hyphen-to-space matches (OLEIC-ACID → Oleic Acid)
  const hyphen = await sql`
    SELECT sdc.chem_id, sdc.name as duke_name, c.name as nutri_name, c.id as compound_id
    FROM source_duke_chemicals sdc
    JOIN compounds c ON LOWER(REPLACE(c.name, ' ', '-')) = LOWER(sdc.name)
    WHERE LOWER(c.name) <> LOWER(sdc.name)
    ORDER BY sdc.name
  `;
  console.log(`  Hyphen-to-space matches: ${hyphen.length}`);

  // 3. Manual mappings
  const manualResults: Array<{ chem_id: string; duke_name: string; nutri_name: string; compound_id: string }> = [];
  for (const [dukeName, nutriName] of Object.entries(MANUAL_MAP)) {
    const rows = await sql`
      SELECT sdc.chem_id, sdc.name as duke_name, c.name as nutri_name, c.id as compound_id
      FROM source_duke_chemicals sdc
      JOIN compounds c ON c.name = ${nutriName}
      WHERE sdc.name = ${dukeName}
    `;
    if (rows.length > 0) {
      manualResults.push(rows[0] as any);
    } else {
      console.log(`  WARNING: No match for manual mapping ${dukeName} → ${nutriName}`);
    }
  }
  console.log(`  Manual mappings: ${manualResults.length}`);

  // Combine and dedupe by chem_id
  const seen = new Set<string>();
  const all: Array<{ chem_id: string; duke_name: string; nutri_name: string; compound_id: string }> = [];
  for (const row of [...exact, ...hyphen, ...manualResults]) {
    if (!seen.has(row.chem_id)) {
      seen.add(row.chem_id);
      all.push(row as any);
    }
  }

  console.log(`\n  Total unique mappings: ${all.length}`);
  console.log('');

  // Insert compound_sources entries
  let inserted = 0;
  let skipped = 0;
  for (const row of all) {
    const result = await sql`
      INSERT INTO compound_sources (
        compound_id,
        external_source,
        external_id,
        source_name,
        source_unit,
        conversion_factor,
        is_canonical
      ) VALUES (
        ${row.compound_id},
        'DUKE',
        ${row.chem_id},
        ${row.duke_name},
        'ppm',
        '1.0',
        false
      )
      ON CONFLICT (external_source, external_id) DO NOTHING
      RETURNING id
    `;
    if (result.length > 0) {
      inserted++;
    } else {
      skipped++;
      console.log(`  SKIP (conflict): ${row.chem_id} → ${row.nutri_name}`);
    }
  }

  console.log('');
  console.log('─'.repeat(50));
  console.log(`Duke mappings inserted: ${inserted}/${all.length}`);
  if (skipped > 0) {
    console.log(`  (${skipped} skipped due to existing entries)`);
  }

  // Verify
  const verify = await sql`
    SELECT COUNT(*) as n FROM compound_sources WHERE external_source = 'DUKE'
  `;
  console.log(`Total DUKE entries in compound_sources: ${verify[0].n}`);

  // Summary by compound type
  const byType = await sql`
    SELECT c.compound_type, COUNT(*) as n
    FROM compound_sources cs
    JOIN compounds c ON c.id = cs.compound_id
    WHERE cs.external_source = 'DUKE'
    GROUP BY c.compound_type
    ORDER BY c.compound_type
  `;
  console.log('\nBy compound type:');
  for (const row of byType) {
    console.log(`  ${row.compound_type}: ${row.n}`);
  }
}

seed().catch(console.error).finally(() => sql.end());
