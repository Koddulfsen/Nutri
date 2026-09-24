import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// New compounds that don't exist in our database
const newCompounds = [
  { name: 'Total Organic Acids', type: 'ORGANIC_ACID', unit: 'g', description: 'Sum of all organic acids in food' },
  { name: 'Intrinsic Folate', type: 'VITAMIN', unit: 'µg', description: 'Naturally occurring folate (not from fortification)' },
  { name: 'Polyols', type: 'CARBOHYDRATE', unit: 'g', description: 'Sugar alcohols (sorbitol, xylitol, mannitol, etc.)' },
  { name: 'Folate (DFE)', type: 'VITAMIN', unit: 'µg', description: 'Dietary Folate Equivalents - standardized measure of folate activity' },
];

// Complete mapping of CIQUAL codes to Nutri compound names
// Using CIQUAL's ORIGCPCD as external_id
const ciqualMappings: { code: string; infoods: string; compoundName: string; isCanonical: boolean }[] = [
  // Energy
  { code: '327', infoods: 'ENERC', compoundName: 'Energy', isCanonical: false }, // kJ
  { code: '328', infoods: 'ENERC', compoundName: 'Energy', isCanonical: true },  // kcal
  // Skip 332, 333 (Jones factor variants)

  // Proximates
  { code: '400', infoods: 'WATER', compoundName: 'Water', isCanonical: true },
  { code: '10000', infoods: 'ASH', compoundName: 'Ash', isCanonical: true },
  // Skip 10004 (Salt - derived)
  { code: '25000', infoods: 'PROCNT', compoundName: 'Protein', isCanonical: true },
  { code: '25003', infoods: 'PROCNT', compoundName: 'Protein', isCanonical: false }, // crude N×6.25
  { code: '31000', infoods: 'CHOAVL', compoundName: 'Total Carbohydrate', isCanonical: true },
  { code: '40000', infoods: 'FAT', compoundName: 'Total Fat', isCanonical: true },
  { code: '60000', infoods: 'ALC', compoundName: 'Alcohol', isCanonical: true },

  // Carbohydrates
  { code: '32000', infoods: 'SUGAR', compoundName: 'Total Sugars', isCanonical: true },
  { code: '32210', infoods: 'FRUS', compoundName: 'Fructose', isCanonical: true },
  { code: '32220', infoods: 'GALS', compoundName: 'Galactose', isCanonical: true },
  { code: '32250', infoods: 'GLUS', compoundName: 'Glucose', isCanonical: true },
  { code: '32410', infoods: 'LACS', compoundName: 'Lactose', isCanonical: true },
  { code: '32430', infoods: 'MALS', compoundName: 'Maltose', isCanonical: true },
  { code: '32480', infoods: 'SUCS', compoundName: 'Sucrose', isCanonical: true },
  { code: '33110', infoods: 'STARCH', compoundName: 'Starch', isCanonical: true },
  { code: '34000', infoods: 'POLYL', compoundName: 'Polyols', isCanonical: true },
  { code: '34100', infoods: 'FIB-', compoundName: 'Total Fiber', isCanonical: true },
  { code: '65000', infoods: 'OA', compoundName: 'Total Organic Acids', isCanonical: true },

  // Fatty Acids
  { code: '40302', infoods: 'FASAT', compoundName: 'Saturated Fat', isCanonical: true },
  { code: '40303', infoods: 'FAMS', compoundName: 'Monounsaturated Fat', isCanonical: true },
  { code: '40304', infoods: 'FAPU', compoundName: 'Polyunsaturated Fat', isCanonical: true },
  { code: '40400', infoods: 'F4D0', compoundName: 'Butyric Acid', isCanonical: true },
  { code: '40600', infoods: 'F6D0', compoundName: 'Caproic Acid', isCanonical: true },
  { code: '40800', infoods: 'F8D0', compoundName: 'Caprylic Acid', isCanonical: true },
  { code: '41000', infoods: 'F10D0', compoundName: 'Capric Acid', isCanonical: true },
  { code: '41200', infoods: 'F12D0', compoundName: 'Lauric Acid', isCanonical: true },
  { code: '41400', infoods: 'F14D0', compoundName: 'Myristic Acid', isCanonical: true },
  { code: '41600', infoods: 'F16D0', compoundName: 'Palmitic Acid', isCanonical: true },
  { code: '41800', infoods: 'F18D0', compoundName: 'Stearic Acid', isCanonical: true },
  { code: '41819', infoods: 'F18D1CN9', compoundName: 'Oleic Acid (cis)', isCanonical: true },
  { code: '41826', infoods: 'F18D2CN6', compoundName: 'Linoleic Acid (cis,cis)', isCanonical: true },
  { code: '41833', infoods: 'F18D3N3', compoundName: 'Alpha-Linolenic Acid', isCanonical: true },
  { code: '42046', infoods: 'F20D4N6', compoundName: 'Arachidonic Acid', isCanonical: true },
  { code: '42053', infoods: 'F20D5N3', compoundName: 'Eicosapentaenoic Acid', isCanonical: true },
  { code: '42263', infoods: 'F22D6N3', compoundName: 'Docosahexaenoic Acid', isCanonical: true },
  { code: '75100', infoods: 'CHOL-', compoundName: 'Cholesterol', isCanonical: true },

  // Minerals
  { code: '10110', infoods: 'NA', compoundName: 'Sodium', isCanonical: true },
  { code: '10120', infoods: 'MG', compoundName: 'Magnesium', isCanonical: true },
  { code: '10150', infoods: 'P', compoundName: 'Phosphorus', isCanonical: true },
  { code: '10170', infoods: 'CLD', compoundName: 'Chloride', isCanonical: true },
  { code: '10190', infoods: 'K', compoundName: 'Potassium', isCanonical: true },
  { code: '10200', infoods: 'CA', compoundName: 'Calcium', isCanonical: true },
  { code: '10251', infoods: 'MN', compoundName: 'Manganese', isCanonical: true },
  { code: '10260', infoods: 'FE', compoundName: 'Iron', isCanonical: true },
  { code: '10290', infoods: 'CU', compoundName: 'Copper', isCanonical: true },
  { code: '10300', infoods: 'ZN', compoundName: 'Zinc', isCanonical: true },
  { code: '10340', infoods: 'SE', compoundName: 'Selenium', isCanonical: true },
  { code: '10530', infoods: 'ID', compoundName: 'Iodine', isCanonical: true },

  // Vitamins
  { code: '51104', infoods: 'RAE', compoundName: 'Vitamin A', isCanonical: true },
  { code: '51200', infoods: 'RETOL', compoundName: 'Retinol', isCanonical: true },
  { code: '51330', infoods: 'CARTB', compoundName: 'Beta-Carotene', isCanonical: true },
  { code: '52100', infoods: 'VITD-', compoundName: 'Vitamin D', isCanonical: true },
  { code: '52200', infoods: 'ERGCAL', compoundName: 'Vitamin D2', isCanonical: true },
  { code: '52300', infoods: 'CHOCAL', compoundName: 'Vitamin D3', isCanonical: true },
  { code: '53100', infoods: 'VITE-', compoundName: 'Vitamin E', isCanonical: true },
  { code: '71010', infoods: 'TOCPHA', compoundName: 'Alpha-Tocopherol', isCanonical: true },
  { code: '54101', infoods: 'VITK1', compoundName: 'Vitamin K', isCanonical: true },
  { code: '54104', infoods: 'VITK2', compoundName: 'Vitamin K2', isCanonical: true },
  { code: '55100', infoods: 'VITC', compoundName: 'Vitamin C', isCanonical: true },
  { code: '56100', infoods: 'THIA', compoundName: 'Thiamin', isCanonical: true },
  { code: '56200', infoods: 'RIBF', compoundName: 'Riboflavin', isCanonical: true },
  { code: '56310', infoods: 'NIA', compoundName: 'Niacin', isCanonical: true },
  { code: '56400', infoods: 'PANTAC', compoundName: 'Pantothenic Acid', isCanonical: true },
  { code: '56500', infoods: 'VITB6-', compoundName: 'Vitamin B6', isCanonical: true },
  { code: '56600', infoods: 'VITB12', compoundName: 'Vitamin B12', isCanonical: true },
  { code: '56700', infoods: 'FOL', compoundName: 'Folate', isCanonical: true },
  { code: '56702', infoods: 'FOLDFE', compoundName: 'Folate (DFE)', isCanonical: true },
  { code: '56704', infoods: 'FOLFD', compoundName: 'Intrinsic Folate', isCanonical: true },
  { code: '56708', infoods: 'FOLAC', compoundName: 'Folic Acid', isCanonical: true },
];

async function main() {
  console.log('=== CIQUAL 2025 Compound Integration ===\n');

  // Step 1: Add new compounds
  console.log('Step 1: Adding new compounds...');
  let newAdded = 0;

  for (const compound of newCompounds) {
    // Check if exists
    const existing = await db.execute(sql`
      SELECT id FROM compounds WHERE LOWER(name) = LOWER(${compound.name})
    `);

    if ((existing.rows || existing).length > 0) {
      console.log(`  ⏭️  ${compound.name} (already exists)`);
      continue;
    }

    try {
      await db.execute(sql`
        INSERT INTO compounds (name, compound_type, unit, description)
        VALUES (${compound.name}, ${compound.type}, ${compound.unit}, ${compound.description})
      `);
      console.log(`  ✅ Added: ${compound.name}`);
      newAdded++;
    } catch (err: any) {
      console.log(`  ❌ Failed: ${compound.name} - ${err.message}`);
    }
  }

  console.log(`\nNew compounds added: ${newAdded}\n`);

  // Step 2: Create mappings
  console.log('Step 2: Creating CIQUAL mappings...');
  let mapped = 0;
  let skipped = 0;
  let failed = 0;

  for (const mapping of ciqualMappings) {
    // Find the compound
    const compound = await db.execute(sql`
      SELECT id, name FROM compounds WHERE LOWER(name) = LOWER(${mapping.compoundName})
    `);

    const rows = compound.rows || compound;
    if (rows.length === 0) {
      console.log(`  ❌ Compound not found: ${mapping.compoundName} (for ${mapping.code}/${mapping.infoods})`);
      failed++;
      continue;
    }

    const compoundId = rows[0].id;

    // Check if mapping already exists
    const existingMapping = await db.execute(sql`
      SELECT id FROM compound_sources
      WHERE external_source = 'CIQUAL' AND external_id = ${mapping.code}
    `);

    if ((existingMapping.rows || existingMapping).length > 0) {
      skipped++;
      continue;
    }

    // Insert mapping with INFOODS tag in source_name for reference
    try {
      await db.execute(sql`
        INSERT INTO compound_sources (compound_id, external_source, external_id, source_name, is_canonical)
        VALUES (${compoundId}, 'CIQUAL', ${mapping.code}, ${`${mapping.compoundName} (${mapping.infoods})`}, ${mapping.isCanonical})
      `);
      mapped++;
    } catch (err: any) {
      console.log(`  ❌ Mapping failed: ${mapping.code} → ${mapping.compoundName} - ${err.message}`);
      failed++;
    }
  }

  console.log(`\nMappings created: ${mapped}`);
  console.log(`Already existed: ${skipped}`);
  console.log(`Failed: ${failed}`);

  // Step 3: Summary
  console.log('\n=== Final Summary ===');

  const totalCompounds = await db.execute(sql`SELECT COUNT(*) as count FROM compounds`);
  const totalMappings = await db.execute(sql`
    SELECT external_source, COUNT(*) as count
    FROM compound_sources
    GROUP BY external_source
    ORDER BY external_source
  `);

  console.log(`\nTotal compounds: ${(totalCompounds.rows || totalCompounds)[0].count}`);
  console.log('\nMappings by source:');
  for (const row of (totalMappings.rows || totalMappings)) {
    console.log(`  ${row.external_source}: ${row.count}`);
  }
}

main().catch(console.error).finally(() => process.exit());
