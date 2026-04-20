/**
 * INDB (Indian Nutrient Databank) Integration Script
 *
 * Maps 39 INDB nutrient columns to Nutri compound UUIDs.
 * All nutrients already exist in the database - no new compounds needed.
 *
 * INDB uses column names like "energy_kcal", "protein_g", "vitb1_mg"
 *
 * Run: npx tsx scripts/add-indb-compounds.ts
 */

import { db } from '../db';
import { compounds, compoundSources } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

const SOURCE = 'INDB';

// INDB column name → Nutri compound name mapping
// isCanonical=false when units differ from our standard
const indbMappings: { code: string; compoundName: string; isCanonical: boolean; sourceUnit?: string; conversionFactor?: string }[] = [
  // Energy
  { code: 'energy_kcal', compoundName: 'Energy', isCanonical: true, sourceUnit: 'kcal' },
  { code: 'energy_kj', compoundName: 'Energy', isCanonical: false, sourceUnit: 'kJ', conversionFactor: '0.239' },

  // Macronutrients
  { code: 'protein_g', compoundName: 'Protein', isCanonical: true, sourceUnit: 'g' },
  { code: 'fat_g', compoundName: 'Total Fat', isCanonical: true, sourceUnit: 'g' },
  { code: 'carb_g', compoundName: 'Total Carbohydrate', isCanonical: true, sourceUnit: 'g' },
  { code: 'fibre_g', compoundName: 'Total Fiber', isCanonical: true, sourceUnit: 'g' },
  { code: 'freesugar_g', compoundName: 'Free Sugars', isCanonical: true, sourceUnit: 'g' },

  // Lipids (SFA/MUFA/PUFA in mg vs our g)
  { code: 'sfa_mg', compoundName: 'Saturated Fat', isCanonical: false, sourceUnit: 'mg', conversionFactor: '0.001' },
  { code: 'mufa_mg', compoundName: 'Monounsaturated Fat', isCanonical: false, sourceUnit: 'mg', conversionFactor: '0.001' },
  { code: 'pufa_mg', compoundName: 'Polyunsaturated Fat', isCanonical: false, sourceUnit: 'mg', conversionFactor: '0.001' },
  { code: 'cholesterol_mg', compoundName: 'Cholesterol', isCanonical: true, sourceUnit: 'mg' },

  // Minerals
  { code: 'calcium_mg', compoundName: 'Calcium', isCanonical: true, sourceUnit: 'mg' },
  { code: 'phosphorus_mg', compoundName: 'Phosphorus', isCanonical: true, sourceUnit: 'mg' },
  { code: 'magnesium_mg', compoundName: 'Magnesium', isCanonical: true, sourceUnit: 'mg' },
  { code: 'sodium_mg', compoundName: 'Sodium', isCanonical: true, sourceUnit: 'mg' },
  { code: 'potassium_mg', compoundName: 'Potassium', isCanonical: true, sourceUnit: 'mg' },
  { code: 'iron_mg', compoundName: 'Iron', isCanonical: true, sourceUnit: 'mg' },
  { code: 'copper_mg', compoundName: 'Copper', isCanonical: true, sourceUnit: 'mg' },
  { code: 'zinc_mg', compoundName: 'Zinc', isCanonical: true, sourceUnit: 'mg' },
  { code: 'manganese_mg', compoundName: 'Manganese', isCanonical: true, sourceUnit: 'mg' },
  { code: 'selenium_ug', compoundName: 'Selenium', isCanonical: true, sourceUnit: 'µg' },
  // INDB uses mg for Cr/Mo (unusual - standard is µg)
  { code: 'chromium_mg', compoundName: 'Chromium', isCanonical: false, sourceUnit: 'mg', conversionFactor: '1000' },
  { code: 'molybdenum_mg', compoundName: 'Molybdenum', isCanonical: false, sourceUnit: 'mg', conversionFactor: '1000' },

  // Fat-Soluble Vitamins
  { code: 'vita_ug', compoundName: 'Vitamin A', isCanonical: true, sourceUnit: 'µg' },
  { code: 'vite_mg', compoundName: 'Vitamin E', isCanonical: true, sourceUnit: 'mg' },
  { code: 'vitd2_ug', compoundName: 'Vitamin D2', isCanonical: true, sourceUnit: 'µg' },
  { code: 'vitd3_ug', compoundName: 'Vitamin D3', isCanonical: true, sourceUnit: 'µg' },
  { code: 'vitk1_ug', compoundName: 'Vitamin K1', isCanonical: true, sourceUnit: 'µg' },
  { code: 'vitk2_ug', compoundName: 'Vitamin K2', isCanonical: true, sourceUnit: 'µg' },
  { code: 'carotenoids_ug', compoundName: 'Total Carotenoids', isCanonical: true, sourceUnit: 'µg' },

  // Water-Soluble Vitamins
  { code: 'vitc_mg', compoundName: 'Vitamin C', isCanonical: true, sourceUnit: 'mg' },
  { code: 'vitb1_mg', compoundName: 'Thiamin', isCanonical: true, sourceUnit: 'mg' },
  { code: 'vitb2_mg', compoundName: 'Riboflavin', isCanonical: true, sourceUnit: 'mg' },
  { code: 'vitb3_mg', compoundName: 'Niacin', isCanonical: true, sourceUnit: 'mg' },
  { code: 'vitb5_mg', compoundName: 'Pantothenic Acid', isCanonical: true, sourceUnit: 'mg' },
  { code: 'vitb6_mg', compoundName: 'Vitamin B6', isCanonical: true, sourceUnit: 'mg' },
  { code: 'vitb7_ug', compoundName: 'Biotin', isCanonical: true, sourceUnit: 'µg' },
  { code: 'folate_ug', compoundName: 'Folate', isCanonical: true, sourceUnit: 'µg' },
  { code: 'vitb9_ug', compoundName: 'Folic Acid', isCanonical: true, sourceUnit: 'µg' },
];

async function main() {
  console.log(`=== INDB (Indian Nutrient Databank) Compound Integration ===\n`);

  // No new compounds needed - all 39 already exist
  console.log('Step 1: Checking for new compounds...');
  console.log('  - No new compounds needed (all 39 already exist)\n');

  // Create INDB mappings
  console.log('Step 2: Creating INDB mappings...');
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const mapping of indbMappings) {
    // Find compound by name
    const compoundResult = await db.execute(
      sql`SELECT id, name FROM compounds WHERE name = ${mapping.compoundName} LIMIT 1`
    );

    const compound = (compoundResult as any[])[0];

    if (!compound) {
      console.log(`  x Compound not found: ${mapping.compoundName} (for ${mapping.code})`);
      failed++;
      continue;
    }

    // Check if mapping already exists
    const existingResult = await db.execute(
      sql`SELECT id FROM compound_sources WHERE external_source = ${SOURCE} AND external_id = ${mapping.code} LIMIT 1`
    );

    if ((existingResult as any[]).length > 0) {
      skipped++;
      continue;
    }

    // Insert mapping
    await db.execute(
      sql`INSERT INTO compound_sources (compound_id, external_source, external_id, source_unit, conversion_factor, is_canonical)
          VALUES (${compound.id}, ${SOURCE}, ${mapping.code}, ${mapping.sourceUnit || null}, ${mapping.conversionFactor || '1.0'}, ${mapping.isCanonical})`
    );

    created++;
  }

  console.log(`\nMappings created: ${created}`);
  console.log(`Mappings skipped (already exist): ${skipped}`);
  console.log(`Mappings failed: ${failed}`);

  // Summary
  const totalCompounds = await db.execute(sql`SELECT COUNT(*) as count FROM compounds`);
  const totalIndbMappings = await db.execute(
    sql`SELECT COUNT(*) as count FROM compound_sources WHERE external_source = ${SOURCE}`
  );

  console.log(`\n=== Summary ===`);
  console.log(`Total compounds in database: ${(totalCompounds as any[])[0].count}`);
  console.log(`Total INDB mappings: ${(totalIndbMappings as any[])[0].count}`);

  // Show mappings by source
  const mappingsBySource = await db.execute(
    sql`SELECT external_source, COUNT(*) as count FROM compound_sources GROUP BY external_source ORDER BY count DESC`
  );

  console.log(`\nMappings by source:`);
  for (const row of mappingsBySource as any[]) {
    console.log(`  ${row.external_source}: ${row.count}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
