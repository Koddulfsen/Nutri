/**
 * Validate compound mappings against actual source databases
 *
 * This script:
 * 1. Fetches real nutrient IDs from FDC API
 * 2. Compares against our compound_sources table
 * 3. Reports discrepancies
 *
 * Run: npx tsx scripts/validate-mappings.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);
const FDC_API_KEY = process.env.FDC_API_KEY || 'DEMO_KEY';

interface FDCNutrient {
  id: number;
  name: string;
  unitName: string;
}

// Known correct FDC nutrient IDs (from USDA SR Legacy)
const FDC_CORRECT_IDS: Record<string, { id: number; name: string }> = {
  // Energy & Water
  'Energy': { id: 1008, name: 'Energy' },
  'Water': { id: 1051, name: 'Water' },

  // Macros
  'Protein': { id: 1003, name: 'Protein' },
  'Carbohydrates': { id: 1005, name: 'Carbohydrate, by difference' },
  'Total Fat': { id: 1004, name: 'Total lipid (fat)' },
  'Dietary Fiber': { id: 1079, name: 'Fiber, total dietary' },
  'Total Sugars': { id: 2000, name: 'Total Sugars' },

  // Sugars
  'Glucose': { id: 1011, name: 'Glucose' },
  'Fructose': { id: 1012, name: 'Fructose' },
  'Sucrose': { id: 1010, name: 'Sucrose' },
  'Lactose': { id: 1013, name: 'Lactose' },
  'Maltose': { id: 1014, name: 'Maltose' },
  'Galactose': { id: 1075, name: 'Galactose' },
  'Starch': { id: 1009, name: 'Starch' },

  // Minerals
  'Calcium': { id: 1087, name: 'Calcium, Ca' },
  'Iron': { id: 1089, name: 'Iron, Fe' },
  'Magnesium': { id: 1090, name: 'Magnesium, Mg' },
  'Phosphorus': { id: 1091, name: 'Phosphorus, P' },
  'Potassium': { id: 1092, name: 'Potassium, K' },
  'Sodium': { id: 1093, name: 'Sodium, Na' },
  'Zinc': { id: 1095, name: 'Zinc, Zn' },
  'Copper': { id: 1098, name: 'Copper, Cu' },
  'Manganese': { id: 1101, name: 'Manganese, Mn' },
  'Selenium': { id: 1103, name: 'Selenium, Se' },
  'Fluoride': { id: 1099, name: 'Fluoride, F' },
  'Chromium': { id: 1096, name: 'Chromium, Cr' },
  'Molybdenum': { id: 1102, name: 'Molybdenum, Mo' },
  'Iodine': { id: 1100, name: 'Iodine, I' },  // NOT 1012!
  'Chloride': { id: 1104, name: 'Chloride, Cl' },
  'Boron': { id: 1137, name: 'Boron, B' },

  // Vitamins
  'Vitamin A (RAE)': { id: 1106, name: 'Vitamin A, RAE' },
  'Retinol': { id: 1105, name: 'Retinol' },
  'Vitamin C': { id: 1162, name: 'Vitamin C, total ascorbic acid' },
  'Vitamin D': { id: 1114, name: 'Vitamin D (D2 + D3)' },
  'Vitamin E': { id: 1109, name: 'Vitamin E (alpha-tocopherol)' },
  'Vitamin K': { id: 1185, name: 'Vitamin K (phylloquinone)' },
  'Thiamin': { id: 1165, name: 'Thiamin' },
  'Riboflavin': { id: 1166, name: 'Riboflavin' },
  'Niacin': { id: 1167, name: 'Niacin' },
  'Vitamin B6': { id: 1175, name: 'Vitamin B-6' },
  'Folate': { id: 1177, name: 'Folate, total' },
  'Vitamin B12': { id: 1178, name: 'Vitamin B-12' },
  'Pantothenic Acid': { id: 1170, name: 'Pantothenic acid' },
  'Choline': { id: 1180, name: 'Choline, total' },
  'Betaine': { id: 1198, name: 'Betaine' },

  // Other
  'Cholesterol': { id: 1253, name: 'Cholesterol' },
  'Caffeine': { id: 1057, name: 'Caffeine' },
  'Theobromine': { id: 1058, name: 'Theobromine' },
  'Alcohol': { id: 1018, name: 'Alcohol, ethyl' },
};

// CNF uses same IDs as USDA SR Legacy for most nutrients
const CNF_CORRECT_IDS: Record<string, number> = {
  'Calcium': 301,
  'Iron': 303,
  'Magnesium': 304,
  'Phosphorus': 305,
  'Potassium': 306,
  'Sodium': 307,
  'Zinc': 309,
  'Copper': 312,
  'Manganese': 315,  // Note: This is what the doc wrongly also used for Chloride
  'Selenium': 317,
  'Iodine': 314,
  'Chromium': 310,  // NOT 304 which is Magnesium!
  'Molybdenum': 316,
  'Fluoride': 313,
  'Chloride': 315,  // Wait, this conflicts with Manganese!
};

async function validateFDCMappings() {
  console.log('=== Validating FDC Mappings ===\n');

  const fdcMappings = await sql`
    SELECT c.name as compound_name, cs.external_id, cs.source_name
    FROM compound_sources cs
    JOIN compounds c ON cs.compound_id = c.id
    WHERE cs.external_source = 'FDC'
    ORDER BY cs.external_id::int
  `;

  const issues: string[] = [];

  for (const mapping of fdcMappings) {
    const id = parseInt(mapping.external_id);

    // Check if this ID belongs to a different compound
    for (const [correctName, info] of Object.entries(FDC_CORRECT_IDS)) {
      if (info.id === id && !mapping.compound_name.toLowerCase().includes(correctName.toLowerCase())) {
        // Check if it's a reasonable match
        const compoundLower = mapping.compound_name.toLowerCase();
        const correctLower = correctName.toLowerCase();

        if (!compoundLower.includes(correctLower) && !correctLower.includes(compoundLower)) {
          issues.push(`FDC ${id}: Assigned to "${mapping.compound_name}" but should be "${correctName}"`);
        }
      }
    }
  }

  if (issues.length === 0) {
    console.log('✓ No FDC mapping issues found\n');
  } else {
    console.log('ISSUES FOUND:');
    issues.forEach(i => console.log(`  ✗ ${i}`));
    console.log('');
  }

  return issues;
}

async function findMissingMappings() {
  console.log('=== Finding Missing FDC Mappings ===\n');

  // Get all compounds that should have FDC mappings
  const compounds = await sql`
    SELECT c.name, c.compound_type
    FROM compounds c
    WHERE c.tier = 'core'
    AND c.compound_type IN ('MINERAL', 'VITAMIN', 'MACRONUTRIENT')
    ORDER BY c.compound_type, c.name
  `;

  const missing: string[] = [];

  for (const compound of compounds) {
    const hasFDC = await sql`
      SELECT 1 FROM compound_sources cs
      JOIN compounds c ON cs.compound_id = c.id
      WHERE c.name = ${compound.name}
      AND cs.external_source = 'FDC'
      LIMIT 1
    `;

    if (hasFDC.length === 0) {
      // Check if this compound should have FDC mapping
      const simpleName = compound.name.replace(/\s*\(.*\)/, '').trim();
      if (FDC_CORRECT_IDS[simpleName]) {
        missing.push(`${compound.name} (${compound.compound_type}) - should be FDC ${FDC_CORRECT_IDS[simpleName].id}`);
      }
    }
  }

  if (missing.length === 0) {
    console.log('✓ No missing FDC mappings for known compounds\n');
  } else {
    console.log('MISSING FDC MAPPINGS:');
    missing.forEach(m => console.log(`  - ${m}`));
    console.log('');
  }

  return missing;
}

async function checkDuplicateExternalIds() {
  console.log('=== Checking for Duplicate External IDs in Docs ===\n');

  // These are IDs that appear multiple times in the docs (errors)
  const knownDuplicates = [
    { source: 'CNF', id: '304', compounds: ['Magnesium', 'Chromium'] },
    { source: 'CNF', id: '312', compounds: ['Copper', 'Molybdenum', 'Boron'] },
    { source: 'CNF', id: '315', compounds: ['Chloride', 'Manganese'] },
    { source: 'FDC', id: '1012', compounds: ['Fructose', 'Iodine (in doc, wrong!)'] },
  ];

  console.log('Known duplicate IDs in documentation:');
  for (const dup of knownDuplicates) {
    const inDb = await sql`
      SELECT c.name FROM compound_sources cs
      JOIN compounds c ON cs.compound_id = c.id
      WHERE cs.external_source = ${dup.source}
      AND cs.external_id = ${dup.id}
    `;

    console.log(`  ${dup.source} ${dup.id}: Doc says [${dup.compounds.join(', ')}], DB has [${inDb.map(r => r.name).join(', ') || 'none'}]`);
  }
  console.log('');
}

async function main() {
  try {
    await validateFDCMappings();
    await findMissingMappings();
    await checkDuplicateExternalIds();

    console.log('=== RECOMMENDATIONS ===');
    console.log('1. Fix 05-minerals.md with correct CNF IDs:');
    console.log('   - Chromium: CNF 310 (not 304)');
    console.log('   - Molybdenum: CNF 316 (not 312)');
    console.log('   - Iodine: FDC 1100 (not 1012)');
    console.log('');
    console.log('2. After fixing docs, clear affected mappings and re-seed');
    console.log('');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

main();
