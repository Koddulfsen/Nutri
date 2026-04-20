import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// Matvaretabellen mappings - all 57 nutrients map to existing compounds
// Compound names MUST match exact DB names (case-insensitive)
const matvaretabellenMappings = [
  // Energy & Macronutrients
  { code: 'WATER', compoundName: 'Water', isCanonical: true },
  { code: 'FAT', compoundName: 'Total Fat', isCanonical: true },
  { code: 'CHO', compoundName: 'Carbohydrates', isCanonical: true },
  { code: 'FIBT', compoundName: 'Dietary Fiber', isCanonical: true },
  { code: 'PROT', compoundName: 'Protein', isCanonical: true },
  { code: 'ALC', compoundName: 'Ethanol', isCanonical: true },
  { code: 'NACL', compoundName: 'Salt', isCanonical: true },

  // Carbohydrates
  { code: 'STARCH', compoundName: 'Starch', isCanonical: true },
  { code: 'SUGAR', compoundName: 'Total Sugars', isCanonical: true },
  { code: 'SUGAD', compoundName: 'Added Sugars', isCanonical: true },
  // SUGAN (Free Sugars) - no matching compound in DB, skip

  // Fatty acid clusters
  { code: 'FASAT', compoundName: 'Saturated Fat', isCanonical: true },
  { code: 'FAMS', compoundName: 'Monounsaturated Fat', isCanonical: true },
  // FAPU (Polyunsaturated Fat) - no matching compound in DB, skip
  { code: 'FATRS', compoundName: 'Trans Fat', isCanonical: true },
  { code: 'FAN3', compoundName: 'Omega-3', isCanonical: true },
  { code: 'FAN6', compoundName: 'Omega-6', isCanonical: true },
  { code: 'CHORL', compoundName: 'Cholesterol', isCanonical: true },

  // Saturated fatty acids
  { code: 'F12:0', compoundName: 'Lauric Acid', isCanonical: true },
  { code: 'F14:0', compoundName: 'Myristic Acid', isCanonical: true },
  { code: 'F16:0', compoundName: 'Palmitic Acid', isCanonical: true },
  { code: 'F18:0', compoundName: 'Stearic Acid', isCanonical: true },

  // Monounsaturated fatty acids (sum codes)
  { code: 'F16:1', compoundName: 'Palmitoleic Acid', isCanonical: true },
  { code: 'F18:1', compoundName: 'Oleic Acid', isCanonical: true },

  // Polyunsaturated fatty acids - n-6
  { code: 'F18:2CN6', compoundName: 'LA', isCanonical: true },
  { code: 'F20:3N6', compoundName: 'DGLA', isCanonical: true },
  { code: 'F20:4N6', compoundName: 'AA', isCanonical: true },

  // Polyunsaturated fatty acids - n-3
  { code: 'F18:3N3', compoundName: 'ALA', isCanonical: true },
  // F20:3N3 (Eicosatrienoic Acid n-3) - no matching compound in DB
  // F20:4N3 (Eicosatetraenoic Acid n-3) - no matching compound in DB
  { code: 'F20:5N3', compoundName: 'EPA', isCanonical: true },
  { code: 'F22:5N3', compoundName: 'DPA', isCanonical: true },
  { code: 'F22:6N3', compoundName: 'DHA', isCanonical: true },

  // Minerals
  { code: 'CA', compoundName: 'Calcium (Total)', isCanonical: true },
  { code: 'FE', compoundName: 'Iron (Total)', isCanonical: true },
  { code: 'NA', compoundName: 'Sodium', isCanonical: true },
  { code: 'K', compoundName: 'Potassium', isCanonical: true },
  { code: 'MG', compoundName: 'Magnesium (Total)', isCanonical: true },
  { code: 'ZN', compoundName: 'Zinc (Total)', isCanonical: true },
  { code: 'SE', compoundName: 'Selenium (Total)', isCanonical: true },
  { code: 'CU', compoundName: 'Copper', isCanonical: true },
  { code: 'P', compoundName: 'Phosphorus', isCanonical: true },
  { code: 'ID', compoundName: 'Iodine', isCanonical: true },

  // Vitamin A & Carotenoids
  { code: 'VITA', compoundName: 'Vitamin A (RAE)', isCanonical: true },
  { code: 'VITARE', compoundName: 'Vitamin A (RAE)', isCanonical: false }, // RE variant
  { code: 'RETOL', compoundName: 'Retinol', isCanonical: true },
  { code: 'CARTB', compoundName: 'Beta-Carotene', isCanonical: true },

  // Other vitamins
  { code: 'VITD', compoundName: 'Vitamin D (Total)', isCanonical: true },
  { code: 'VITE', compoundName: 'Vitamin E (Total)', isCanonical: true },
  { code: 'THIA', compoundName: 'Thiamin (B1)', isCanonical: true },
  { code: 'RIBF', compoundName: 'Riboflavin (B2)', isCanonical: true },
  { code: 'NIA', compoundName: 'Nicotinic Acid', isCanonical: true },
  { code: 'NIAEQ', compoundName: 'Niacin (B3)', isCanonical: true },
  { code: 'VITB6', compoundName: 'Vitamin B6', isCanonical: true },
  { code: 'FOL', compoundName: 'Folate (Total)', isCanonical: true },
  { code: 'VITB12', compoundName: 'Vitamin B12 (Total)', isCanonical: true },
  { code: 'VITC', compoundName: 'Vitamin C (Total)', isCanonical: true },
];

async function main() {
  console.log('=== Matvaretabellen (Norway) Compound Integration ===\n');

  // No new compounds needed - all map to existing
  console.log('Step 1: No new compounds needed (all map to existing)\n');

  // Step 2: Create Matvaretabellen mappings
  console.log('Step 2: Creating Matvaretabellen mappings...');
  let mappedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const mapping of matvaretabellenMappings) {
    // Find compound by name (case-insensitive)
    const compound = await db.execute(sql`
      SELECT id FROM compounds WHERE LOWER(name) = LOWER(${mapping.compoundName})
    `);

    if (compound.length === 0) {
      console.log(`  ❌ Compound not found: ${mapping.compoundName} (for ${mapping.code})`);
      failedCount++;
      continue;
    }

    const compoundId = compound[0].id;

    // Check if mapping already exists
    const existingMapping = await db.execute(sql`
      SELECT id FROM compound_sources
      WHERE compound_id = ${compoundId} AND external_source = 'MATVARETABELLEN' AND external_id = ${mapping.code}
    `);

    if (existingMapping.length > 0) {
      skippedCount++;
      continue;
    }

    // Create mapping
    try {
      await db.execute(sql`
        INSERT INTO compound_sources (compound_id, external_source, external_id, is_canonical)
        VALUES (${compoundId}, 'MATVARETABELLEN', ${mapping.code}, ${mapping.isCanonical})
      `);
      mappedCount++;
    } catch (error: any) {
      console.log(`  ❌ Mapping failed: ${mapping.code} -> ${mapping.compoundName} - ${error.message}`);
      failedCount++;
    }
  }

  console.log(`\nMappings created: ${mappedCount}`);
  console.log(`Mappings skipped (already exist): ${skippedCount}`);
  console.log(`Mappings failed: ${failedCount}`);

  // Step 3: Summary
  console.log('\n=== Summary ===');

  const totalCompounds = await db.execute(sql`SELECT COUNT(*)::int as count FROM compounds`);
  console.log(`Total compounds in database: ${totalCompounds[0].count}`);

  const totalMappings = await db.execute(sql`
    SELECT COUNT(*)::int as count FROM compound_sources WHERE external_source = 'MATVARETABELLEN'
  `);
  console.log(`Total Matvaretabellen mappings: ${totalMappings[0].count}`);

  // Show all source counts
  const allMappings = await db.execute(sql`
    SELECT external_source, COUNT(*)::int as count
    FROM compound_sources
    GROUP BY external_source
    ORDER BY external_source
  `);
  console.log('\nMappings by source:');
  for (const row of allMappings) {
    console.log(`  ${row.external_source}: ${row.count}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
