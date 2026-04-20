import 'dotenv/config';
import * as fs from 'fs';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// New compounds to add for Fineli
const newCompounds = [
  {
    name: 'Salt',
    type: 'MINERAL',
    unit: 'mg',
    description: 'Sodium chloride (NaCl) - table salt. Calculated from sodium content or measured directly.',
  },
  {
    name: 'Total Fatty Acids',
    type: 'FATTY_ACID',
    unit: 'g',
    description: 'Sum of all fatty acids (saturated, monounsaturated, polyunsaturated, and trans).',
  },
  {
    name: 'Fatty Acids (TAG Equivalents)',
    type: 'FATTY_ACID',
    unit: 'g',
    description: 'Total fatty acids calculated as triglyceride (triacylglycerol) equivalents. Includes glycerol backbone weight.',
  },
  {
    name: 'Niacin Equivalents',
    type: 'VITAMIN',
    unit: 'mg',
    description: 'Total niacin activity including preformed niacin plus niacin derived from tryptophan (1 mg NE = 1 mg niacin or 60 mg tryptophan).',
  },
  {
    name: 'Total Carotenoids',
    type: 'VITAMIN',
    unit: 'µg',
    description: 'Sum of all carotenoid pigments including alpha-carotene, beta-carotene, lycopene, lutein, zeaxanthin, and cryptoxanthin.',
  },
  {
    name: 'Sugar Alcohols',
    type: 'CARBOHYDRATE',
    unit: 'g',
    description: 'Polyols including sorbitol, xylitol, mannitol, maltitol, and other sugar alcohols used as sweeteners.',
  },
];

// Fineli mappings - EuroFIR codes to our compound names
const fineliMappings = [
  // Energy & Macronutrients
  { code: 'ENERC', compoundName: 'Energy', isCanonical: true },
  { code: 'FAT', compoundName: 'Total Fat', isCanonical: true },
  { code: 'CHOAVL', compoundName: 'Total Carbohydrate', isCanonical: true },
  { code: 'CHOCDF', compoundName: 'Total Carbohydrate', isCanonical: false }, // Carbs by difference
  { code: 'PROT', compoundName: 'Protein', isCanonical: true },
  { code: 'ALC', compoundName: 'Alcohol', isCanonical: true },
  { code: 'ASH', compoundName: 'Ash', isCanonical: true },
  { code: 'WATER', compoundName: 'Water', isCanonical: true },

  // Carbohydrate Components
  { code: 'OA', compoundName: 'Total Organic Acids', isCanonical: true },
  { code: 'SUGOH', compoundName: 'Sugar Alcohols', isCanonical: true },
  { code: 'SUGAR', compoundName: 'Total Sugars', isCanonical: true },
  { code: 'FRUS', compoundName: 'Fructose', isCanonical: true },
  { code: 'GALS', compoundName: 'Galactose', isCanonical: true },
  { code: 'GLUS', compoundName: 'Glucose', isCanonical: true },
  { code: 'LACS', compoundName: 'Lactose', isCanonical: true },
  { code: 'MALS', compoundName: 'Maltose', isCanonical: true },
  { code: 'SUCS', compoundName: 'Sucrose', isCanonical: true },
  { code: 'STARCH', compoundName: 'Starch', isCanonical: true },
  { code: 'FIBC', compoundName: 'Total Fiber', isCanonical: false }, // Crude fiber
  { code: 'FIBT', compoundName: 'Total Fiber', isCanonical: true }, // Total dietary fiber
  { code: 'FIBINS', compoundName: 'Insoluble Fiber', isCanonical: true },
  { code: 'PSACNCS', compoundName: 'Soluble Fiber', isCanonical: true },

  // Vitamins
  { code: 'FOL', compoundName: 'Folate', isCanonical: true },
  { code: 'NIAEQ', compoundName: 'Niacin Equivalents', isCanonical: true },
  { code: 'NIA', compoundName: 'Niacin', isCanonical: true },
  { code: 'VITPYRID', compoundName: 'Vitamin B6', isCanonical: true },
  { code: 'RIBF', compoundName: 'Riboflavin', isCanonical: true },
  { code: 'THIA', compoundName: 'Thiamin', isCanonical: true },
  { code: 'VITA', compoundName: 'Vitamin A', isCanonical: true },
  { code: 'RETOL', compoundName: 'Retinol', isCanonical: true },
  { code: 'CAROTENS', compoundName: 'Total Carotenoids', isCanonical: true },
  { code: 'CARTB', compoundName: 'Beta-Carotene', isCanonical: true },
  { code: 'VITB12', compoundName: 'Vitamin B12', isCanonical: true },
  { code: 'VITC', compoundName: 'Vitamin C', isCanonical: true },
  { code: 'VITD', compoundName: 'Vitamin D', isCanonical: true },
  { code: 'VITE', compoundName: 'Vitamin E', isCanonical: true },
  { code: 'VITK', compoundName: 'Vitamin K', isCanonical: true },

  // Minerals
  { code: 'CA', compoundName: 'Calcium', isCanonical: true },
  { code: 'CR', compoundName: 'Chromium', isCanonical: true },
  { code: 'CU', compoundName: 'Copper', isCanonical: true },
  { code: 'FD', compoundName: 'Fluoride', isCanonical: true },
  { code: 'FE', compoundName: 'Iron', isCanonical: true },
  { code: 'ID', compoundName: 'Iodine', isCanonical: true },
  { code: 'K', compoundName: 'Potassium', isCanonical: true },
  { code: 'MG', compoundName: 'Magnesium', isCanonical: true },
  { code: 'MN', compoundName: 'Manganese', isCanonical: true },
  { code: 'MO', compoundName: 'Molybdenum', isCanonical: true },
  { code: 'NA', compoundName: 'Sodium', isCanonical: true },
  { code: 'NACL', compoundName: 'Salt', isCanonical: true },
  { code: 'NT', compoundName: 'Nitrogen', isCanonical: true },
  { code: 'P', compoundName: 'Phosphorus', isCanonical: true },
  { code: 'SE', compoundName: 'Selenium', isCanonical: true },
  { code: 'ZN', compoundName: 'Zinc', isCanonical: true },

  // Lipids & Fatty Acids
  { code: 'FAFRE', compoundName: 'Total Fatty Acids', isCanonical: true },
  { code: 'FACIDCTG', compoundName: 'Fatty Acids (TAG Equivalents)', isCanonical: true },
  { code: 'FAPU', compoundName: 'Polyunsaturated Fat', isCanonical: true },
  { code: 'FAMCIS', compoundName: 'Monounsaturated Fat', isCanonical: true },
  { code: 'FASAT', compoundName: 'Saturated Fat', isCanonical: true },
  { code: 'FATRN', compoundName: 'Trans Fat', isCanonical: true },
  { code: 'FAPUN3', compoundName: 'Omega-3 Fatty Acids', isCanonical: true },
  { code: 'FAPUN6', compoundName: 'Omega-6 Fatty Acids', isCanonical: true },
  { code: 'FAS18', compoundName: 'Stearic Acid', isCanonical: true },
  { code: 'F16D0T', compoundName: 'Palmitic Acid', isCanonical: true },
  { code: 'F18D1T', compoundName: 'Oleic Acid', isCanonical: true },
  { code: 'F18D2CN6', compoundName: 'Linoleic Acid', isCanonical: true },
  { code: 'F18D3N3', compoundName: 'Alpha-Linolenic Acid', isCanonical: true },
  { code: 'F20D4N6', compoundName: 'Arachidonic Acid', isCanonical: true },
  { code: 'F20D5N3', compoundName: 'Eicosapentaenoic Acid', isCanonical: true },
  { code: 'F22D6N3', compoundName: 'Docosahexaenoic Acid', isCanonical: true },
  { code: 'CHOLE', compoundName: 'Cholesterol', isCanonical: true },
  { code: 'STERT', compoundName: 'Total Plant Sterols', isCanonical: true },

  // Amino Acids
  { code: 'TRP', compoundName: 'Tryptophan', isCanonical: true },

  // Flavonoids
  { code: 'MYRIC', compoundName: 'Myricetin', isCanonical: true },
  { code: 'QUERCE', compoundName: 'Quercetin', isCanonical: true },
];

async function main() {
  console.log('=== Fineli (Finland) Compound Integration ===\n');

  // Step 1: Add new compounds
  console.log('Step 1: Adding new compounds...');
  let addedCount = 0;

  for (const compound of newCompounds) {
    // Check if already exists (case-insensitive)
    const existing = await db.execute(sql`
      SELECT id FROM compounds WHERE LOWER(name) = LOWER(${compound.name})
    `);

    if (existing.length > 0) {
      console.log(`  ⏭️  ${compound.name} (already exists)`);
      continue;
    }

    // Add compound
    try {
      await db.execute(sql`
        INSERT INTO compounds (name, compound_type, unit, description)
        VALUES (${compound.name}, ${compound.type}::compound_type_enum, ${compound.unit}, ${compound.description})
      `);
      console.log(`  ✅ Added: ${compound.name}`);
      addedCount++;
    } catch (error: any) {
      console.log(`  ❌ Failed: ${compound.name} - ${error.message}`);
    }
  }

  console.log(`\nNew compounds added: ${addedCount}\n`);

  // Step 2: Create FINELI mappings
  console.log('Step 2: Creating FINELI mappings...');
  let mappedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const mapping of fineliMappings) {
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
      WHERE compound_id = ${compoundId} AND external_source = 'FINELI' AND external_id = ${mapping.code}
    `);

    if (existingMapping.length > 0) {
      skippedCount++;
      continue;
    }

    // Create mapping
    try {
      await db.execute(sql`
        INSERT INTO compound_sources (compound_id, external_source, external_id, is_canonical)
        VALUES (${compoundId}, 'FINELI', ${mapping.code}, ${mapping.isCanonical})
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
    SELECT COUNT(*)::int as count FROM compound_sources WHERE external_source = 'FINELI'
  `);
  console.log(`Total FINELI mappings: ${totalMappings[0].count}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
