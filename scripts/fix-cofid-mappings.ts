import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Fix UK_COFID compound_sources mappings that failed due to name mismatches.
 * The add-cofid-compounds.ts script used names like "Calcium" but our DB has "Calcium (Total)".
 * This script adds the missing mappings using correct compound names.
 *
 * Minor fatty acids (C11, C13, C15, C17, C19, etc.) that don't exist as compounds are skipped.
 * These are very rare fatty acids that weren't seeded from other sources either.
 */

// Mapping: CoFID code -> correct compound name in our DB
const fixMappings: { code: string; compoundName: string; isCanonical: boolean }[] = [
  // Proximates
  { code: 'CHO', compoundName: 'Carbohydrates', isCanonical: true },
  { code: 'ALCO', compoundName: 'Ethanol', isCanonical: true },
  { code: 'ENGFIB', compoundName: 'Dietary Fiber', isCanonical: false },
  { code: 'AOACFIB', compoundName: 'Dietary Fiber', isCanonical: true },
  { code: 'TOTn6PFOD', compoundName: 'Omega-6', isCanonical: true },
  { code: 'TOTn3PFOD', compoundName: 'Omega-3', isCanonical: true },

  // Inorganics
  { code: 'CA', compoundName: 'Calcium (Total)', isCanonical: true },
  { code: 'MG', compoundName: 'Magnesium (Total)', isCanonical: true },
  { code: 'FE', compoundName: 'Iron (Total)', isCanonical: true },
  { code: 'ZN', compoundName: 'Zinc (Total)', isCanonical: true },
  { code: 'SE', compoundName: 'Selenium (Total)', isCanonical: true },

  // Vitamins
  { code: 'RETEQU', compoundName: 'Vitamin A (RAE)', isCanonical: true },
  { code: 'VITD', compoundName: 'Vitamin D (Total)', isCanonical: true },
  { code: 'VITE', compoundName: 'Vitamin E (Total)', isCanonical: true },
  { code: 'VITK1', compoundName: 'Vitamin K1 (Phylloquinone)', isCanonical: true },
  { code: 'THIA', compoundName: 'Thiamin (B1)', isCanonical: true },
  { code: 'RIBO', compoundName: 'Riboflavin (B2)', isCanonical: true },
  { code: 'NIAC', compoundName: 'Niacin (B3)', isCanonical: true },
  { code: 'VITB6', compoundName: 'Vitamin B6', isCanonical: true },
  { code: 'VITB12', compoundName: 'Vitamin B12 (Total)', isCanonical: true },
  { code: 'FOLT', compoundName: 'Folate (Total)', isCanonical: true },
  { code: 'PANTO', compoundName: 'Pantothenic Acid (B5)', isCanonical: true },
  { code: 'BIOT', compoundName: 'Biotin (B7)', isCanonical: true },
  { code: 'VITC', compoundName: 'Vitamin C (Total)', isCanonical: true },

  // Vitamin Fractions
  { code: 'VITD3', compoundName: 'Vitamin D3 (Cholecalciferol)', isCanonical: true },
  { code: '5METHF', compoundName: '5-MTHF (Methylfolate)', isCanonical: true },

  // Palmitoleic acid cis variant (Palmitoleic Acid exists)
  { code: 'FOD16:1c', compoundName: 'Palmitoleic Acid', isCanonical: false },
];

async function main() {
  console.log('=== Fix UK CoFID Compound Mappings ===\n');

  let created = 0;
  let skipped = 0;
  let notFound = 0;

  for (const mapping of fixMappings) {
    // Check if mapping already exists
    const existing = await db.execute(sql`
      SELECT id FROM compound_sources
      WHERE external_source = 'UK_COFID' AND external_id = ${mapping.code}
    `);

    if (((existing as any).rows ?? existing).length > 0) {
      skipped++;
      continue;
    }

    // Find compound
    const compound = await db.execute(sql`
      SELECT id, name FROM compounds WHERE LOWER(name) = LOWER(${mapping.compoundName})
    `);

    const rows = (compound as any).rows ?? compound;
    if (rows.length === 0) {
      console.log(`  ❌ Not found: ${mapping.compoundName} (for ${mapping.code})`);
      notFound++;
      continue;
    }

    try {
      await db.execute(sql`
        INSERT INTO compound_sources (compound_id, external_source, external_id, source_name, is_canonical)
        VALUES (${rows[0].id}, 'UK_COFID', ${mapping.code}, ${mapping.compoundName}, ${mapping.isCanonical})
      `);
      console.log(`  ✅ ${mapping.code} → ${rows[0].name}`);
      created++;
    } catch (err: any) {
      console.log(`  ❌ Failed: ${mapping.code} - ${err.message}`);
    }
  }

  console.log(`\nCreated: ${created}`);
  console.log(`Skipped (existing): ${skipped}`);
  console.log(`Not found: ${notFound}`);

  // Final count
  const total = await db.execute(sql`
    SELECT COUNT(*) as count FROM compound_sources WHERE external_source = 'UK_COFID'
  `);
  console.log(`\nTotal UK_COFID mappings: ${((total as any).rows ?? total)[0].count}`);
}

main().catch(console.error).finally(() => process.exit());
