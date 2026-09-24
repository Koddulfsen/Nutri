import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// New compounds — already added in prior run, skip creation
// (Per BLS/FRIDA pattern: only run mapping step)
// const newCompounds = [...];

// NEVO 2025 mappings - using exact compound names from database
const nevoMappings = [
  // Energy & Macronutrients
  { code: 'ENERCJ', compoundName: 'Energy', isCanonical: false },
  { code: 'ENERCC', compoundName: 'Energy', isCanonical: true },
  { code: 'WATER', compoundName: 'Water', isCanonical: true },
  { code: 'PROT', compoundName: 'Protein', isCanonical: true },
  { code: 'FAT', compoundName: 'Total Fat', isCanonical: true },
  { code: 'CHO', compoundName: 'Carbohydrates', isCanonical: true },
  { code: 'FIBT', compoundName: 'Dietary Fiber', isCanonical: true },
  { code: 'OA', compoundName: 'Total Organic Acids', isCanonical: true },

  // Amino acid
  { code: 'TRP', compoundName: 'Tryptophan', isCanonical: true },

  // Carbohydrates
  { code: 'SUGAR', compoundName: 'Total Sugars', isCanonical: true },
  { code: 'STARCH', compoundName: 'Starch', isCanonical: true },
  { code: 'POLYL', compoundName: 'Sugar Alcohols', isCanonical: true },

  // Fat clusters
  { code: 'FACID', compoundName: 'Total Fatty Acids', isCanonical: true },
  { code: 'FASAT', compoundName: 'Saturated Fat', isCanonical: true },
  { code: 'FAMSCIS', compoundName: 'Monounsaturated Fat', isCanonical: true },
  { code: 'FAPUN3', compoundName: 'Omega-3', isCanonical: true },
  { code: 'FAPUN6', compoundName: 'Omega-6', isCanonical: true },
  { code: 'FATRS', compoundName: 'Trans Fat', isCanonical: true },

  // Saturated fatty acids
  { code: 'F4:0', compoundName: 'Butyric Acid', isCanonical: true },
  { code: 'F6:0', compoundName: 'Caproic Acid', isCanonical: true },
  { code: 'F8:0', compoundName: 'Caprylic Acid', isCanonical: true },
  { code: 'F10:0', compoundName: 'Capric Acid', isCanonical: true },
  { code: 'F12:0', compoundName: 'Lauric Acid', isCanonical: true },
  { code: 'F14:0', compoundName: 'Myristic Acid', isCanonical: true },
  { code: 'F16:0', compoundName: 'Palmitic Acid', isCanonical: true },
  { code: 'F18:0', compoundName: 'Stearic Acid', isCanonical: true },
  { code: 'F20:0', compoundName: 'Arachidic Acid', isCanonical: true },
  { code: 'F22:0', compoundName: 'Behenic Acid', isCanonical: true },
  { code: 'F24:0', compoundName: 'Lignoceric Acid', isCanonical: true },

  // Monounsaturated fatty acids (cis)
  { code: 'F10:1CIS', compoundName: 'Decenoic Acid', isCanonical: true },
  { code: 'F16:1CIS', compoundName: 'Palmitoleic Acid', isCanonical: true },
  { code: 'F18:1CIS', compoundName: 'Oleic Acid', isCanonical: true },
  { code: 'F22:1CIS', compoundName: 'Erucic Acid', isCanonical: true },

  // Omega-3 fatty acids
  { code: 'F18:3CN3', compoundName: 'ALA', isCanonical: true },
  { code: 'F20:5CN3', compoundName: 'EPA', isCanonical: true },
  { code: 'F22:5CN3', compoundName: 'DPA', isCanonical: true },
  { code: 'F22:6CN3', compoundName: 'DHA', isCanonical: true },

  // Omega-6 fatty acids
  { code: 'F20:4CN6', compoundName: 'Arachidonic Acid', isCanonical: true },

  // Other PUFAs
  { code: 'F20:3CN9', compoundName: 'Mead Acid', isCanonical: true },

  // Cholesterol
  { code: 'CHORL', compoundName: 'Cholesterol', isCanonical: true },

  // Minerals
  { code: 'NA', compoundName: 'Sodium', isCanonical: true },
  { code: 'K', compoundName: 'Potassium', isCanonical: true },
  { code: 'CA', compoundName: 'Calcium (Total)', isCanonical: true },
  { code: 'P', compoundName: 'Phosphorus', isCanonical: true },
  { code: 'MG', compoundName: 'Magnesium (Total)', isCanonical: true },
  { code: 'FE', compoundName: 'Iron (Total)', isCanonical: true },
  { code: 'HAEM', compoundName: 'Heme Iron', isCanonical: true },
  { code: 'NHAEM', compoundName: 'Non-Heme Iron', isCanonical: true },
  { code: 'CU', compoundName: 'Copper', isCanonical: true },
  { code: 'SE', compoundName: 'Selenium (Total)', isCanonical: true },
  { code: 'ZN', compoundName: 'Zinc (Total)', isCanonical: true },
  { code: 'ID', compoundName: 'Iodine', isCanonical: true },

  // Vitamin A & Carotenoids
  { code: 'VITA_RAE', compoundName: 'Vitamin A (RAE)', isCanonical: true },
  { code: 'VITA_RE', compoundName: 'Vitamin A (RAE)', isCanonical: false },
  { code: 'RETOL', compoundName: 'Retinol', isCanonical: true },
  { code: 'CARTBTOT', compoundName: 'Beta-Carotene', isCanonical: true },
  { code: 'CARTA', compoundName: 'Alpha-Carotene', isCanonical: true },
  { code: 'CRYPXB', compoundName: 'Beta-Cryptoxanthin', isCanonical: true },

  // Vitamin D
  { code: 'VITD', compoundName: 'Vitamin D (Total)', isCanonical: true },
  { code: 'ERGCAL', compoundName: 'Vitamin D2 (Ergocalciferol)', isCanonical: true },
  { code: 'CHOCAL', compoundName: 'Vitamin D3 (Cholecalciferol)', isCanonical: true },
  { code: 'CHOCALOH', compoundName: '25-Hydroxyvitamin D3', isCanonical: true },

  // Vitamin E
  { code: 'VITE', compoundName: 'Vitamin E (Total)', isCanonical: true },
  { code: 'TOCPHA', compoundName: 'Alpha-Tocopherol', isCanonical: true },
  { code: 'TOCPHB', compoundName: 'Beta-Tocopherol', isCanonical: true },
  { code: 'TOCPHD', compoundName: 'Delta-Tocopherol', isCanonical: true },
  { code: 'TOCPHG', compoundName: 'Gamma-Tocopherol', isCanonical: true },

  // Vitamin K
  { code: 'VITK', compoundName: 'Vitamin K (Total)', isCanonical: true },
  { code: 'VITK1', compoundName: 'Vitamin K1 (Phylloquinone)', isCanonical: true },
  { code: 'VITK2', compoundName: 'Vitamin K2 MK-4', isCanonical: true },

  // Water-soluble vitamins
  { code: 'THIA', compoundName: 'Thiamin (B1)', isCanonical: true },
  { code: 'RIBF', compoundName: 'Riboflavin (B2)', isCanonical: true },
  { code: 'VITB6', compoundName: 'Vitamin B6', isCanonical: true },
  { code: 'VITB12', compoundName: 'Vitamin B12 (Total)', isCanonical: true },
  { code: 'NIAEQ', compoundName: 'Niacin Equivalents', isCanonical: true },
  { code: 'NIA', compoundName: 'Niacin (B3)', isCanonical: true },
  { code: 'FOL', compoundName: 'Folate (Total)', isCanonical: true },
  { code: 'FOLFD', compoundName: 'Food Folate (Natural)', isCanonical: true },
  { code: 'FOLAC', compoundName: 'Folic Acid (Synthetic)', isCanonical: true },
  { code: 'VITC', compoundName: 'Vitamin C (Total)', isCanonical: true },
];

async function main() {
  console.log('=== NEVO 2025 (Netherlands) Compound Integration ===\n');

  // Step 1: Skipped — new compounds already added in prior run

  // Step 2: Create NEVO mappings
  console.log('Step 2: Creating NEVO mappings...');
  let mappedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const mapping of nevoMappings) {
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
      WHERE compound_id = ${compoundId} AND external_source = 'NEVO' AND external_id = ${mapping.code}
    `);

    if (existingMapping.length > 0) {
      skippedCount++;
      continue;
    }

    // Create mapping
    try {
      await db.execute(sql`
        INSERT INTO compound_sources (compound_id, external_source, external_id, is_canonical)
        VALUES (${compoundId}, 'NEVO', ${mapping.code}, ${mapping.isCanonical})
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
    SELECT COUNT(*)::int as count FROM compound_sources WHERE external_source = 'NEVO'
  `);
  console.log(`Total NEVO mappings: ${totalMappings[0].count}`);

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
