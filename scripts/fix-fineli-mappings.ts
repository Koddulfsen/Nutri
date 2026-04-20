import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Fix FINELI compound_sources mappings that failed due to name mismatches.
 * The add-fineli-compounds.ts script used names like "Calcium" but our DB has "Calcium (Total)".
 * This script adds the missing mappings using correct compound names.
 */

// Mapping: Fineli EuroFIR code -> correct compound name in our DB
const fixMappings: { code: string; compoundName: string; isCanonical: boolean }[] = [
  // Macronutrients
  { code: 'CHOAVL', compoundName: 'Carbohydrates', isCanonical: true },
  { code: 'CHOCDF', compoundName: 'Carbohydrates', isCanonical: false },
  { code: 'ALC', compoundName: 'Ethanol', isCanonical: true },
  // Carbohydrate components
  { code: 'FIBC', compoundName: 'Dietary Fiber', isCanonical: false },
  { code: 'FIBT', compoundName: 'Dietary Fiber', isCanonical: true },

  // Vitamins
  { code: 'FOL', compoundName: 'Folate (Total)', isCanonical: true },
  { code: 'NIA', compoundName: 'Niacin (B3)', isCanonical: true },
  { code: 'RIBF', compoundName: 'Riboflavin (B2)', isCanonical: true },
  { code: 'THIA', compoundName: 'Thiamin (B1)', isCanonical: true },
  { code: 'VITA', compoundName: 'Vitamin A (RAE)', isCanonical: true },
  { code: 'VITB12', compoundName: 'Vitamin B12 (Total)', isCanonical: true },
  { code: 'VITC', compoundName: 'Vitamin C (Total)', isCanonical: true },
  { code: 'VITD', compoundName: 'Vitamin D (Total)', isCanonical: true },
  { code: 'VITE', compoundName: 'Vitamin E (Total)', isCanonical: true },
  { code: 'VITK', compoundName: 'Vitamin K (Total)', isCanonical: true },

  // Minerals
  { code: 'CA', compoundName: 'Calcium (Total)', isCanonical: true },
  { code: 'CR', compoundName: 'Chromium (Total)', isCanonical: true },
  { code: 'FE', compoundName: 'Iron (Total)', isCanonical: true },
  { code: 'MG', compoundName: 'Magnesium (Total)', isCanonical: true },
  // NT (Nitrogen) - not in our compound DB, skip
  { code: 'SE', compoundName: 'Selenium (Total)', isCanonical: true },
  { code: 'ZN', compoundName: 'Zinc (Total)', isCanonical: true },

  // Fatty acids
  // FAPU (Polyunsaturated Fat) - not in our compound DB, skip
  { code: 'FAPUN3', compoundName: 'Omega-3', isCanonical: true },
  { code: 'FAPUN6', compoundName: 'Omega-6', isCanonical: true },
  // Linoleic, ALA, Arachidonic, EPA, DHA - not in our compound DB by those names
  { code: 'F20D5N3', compoundName: 'EPA', isCanonical: true },
  { code: 'F22D6N3', compoundName: 'DHA', isCanonical: true },
  { code: 'F18D3N3', compoundName: 'ALA', isCanonical: true },
  // STERT, MYRIC, QUERCE - not in our compound DB, skip
];

async function main() {
  console.log('=== Fix FINELI Compound Mappings ===\n');

  let created = 0;
  let skipped = 0;
  let notFound = 0;

  for (const mapping of fixMappings) {
    // Check if mapping already exists
    const existing = await db.execute(sql`
      SELECT id FROM compound_sources
      WHERE external_source = 'FINELI' AND external_id = ${mapping.code}
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
        VALUES (${rows[0].id}, 'FINELI', ${mapping.code}, ${mapping.compoundName}, ${mapping.isCanonical})
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
    SELECT COUNT(*) as count FROM compound_sources WHERE external_source = 'FINELI'
  `);
  console.log(`\nTotal FINELI mappings: ${((total as any).rows ?? total)[0].count}`);
}

main().catch(console.error).finally(() => process.exit());
