import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// New compounds to add for MEXT (Japan)
// Primarily branched-chain and C16 polyunsaturated fatty acids
const newCompounds = [
  {
    name: 'Heptanoic Acid',
    type: 'FATTY_ACID',
    unit: 'g',
    description: 'C7:0 saturated fatty acid (enanthic acid). Found in various plant and animal fats. Used as a chemical intermediate.',
  },
  {
    name: 'Anteiso-Pentadecanoic Acid',
    type: 'FATTY_ACID',
    unit: 'g',
    description: 'Branched-chain saturated fatty acid (ai15:0). Found in dairy and ruminant fat. Marker of dairy consumption.',
  },
  {
    name: 'Iso-Palmitic Acid',
    type: 'FATTY_ACID',
    unit: 'g',
    description: 'Branched-chain saturated fatty acid (i16:0, 14-methylpentadecanoic acid). Found in dairy and fermented foods.',
  },
  {
    name: 'Anteiso-Margaric Acid',
    type: 'FATTY_ACID',
    unit: 'g',
    description: 'Branched-chain saturated fatty acid (ai17:0). Found in dairy and ruminant fat. Biomarker of dairy intake.',
  },
  {
    name: 'Decenoic Acid',
    type: 'FATTY_ACID',
    unit: 'g',
    description: 'C10:1 monounsaturated fatty acid. Found in milk fat and some plant oils.',
  },
  {
    name: 'Hexadecadienoic Acid',
    type: 'FATTY_ACID',
    unit: 'g',
    description: 'C16:2 polyunsaturated fatty acid. Found in certain fish oils and algae. Precursor in fatty acid metabolism.',
  },
  {
    name: 'Hexadecatrienoic Acid',
    type: 'FATTY_ACID',
    unit: 'g',
    description: 'C16:3 polyunsaturated fatty acid. Found primarily in algae and some plant oils. Roughanic acid (16:3n-3) is the most common form.',
  },
  {
    name: 'Hexadecatetraenoic Acid',
    type: 'FATTY_ACID',
    unit: 'g',
    description: 'C16:4 polyunsaturated fatty acid. Found in marine algae and fish. Common in seafood from algae-rich waters.',
  },
];

// MEXT mappings - codes to compound names
// Using MEXT code format (F18D2N6 instead of F18:2CN6)
const mextMappings = [
  // Energy
  { code: 'ENERC', compoundName: 'Energy', isCanonical: false },
  { code: 'ENERC_KCAL', compoundName: 'Energy', isCanonical: true },

  // Macronutrients
  { code: 'WATER', compoundName: 'Water', isCanonical: true },
  { code: 'PROTCAA', compoundName: 'Protein', isCanonical: false },
  { code: 'PROT-', compoundName: 'Protein', isCanonical: true },
  { code: 'FATNLEA', compoundName: 'Total Fat', isCanonical: false },
  { code: 'FAT-', compoundName: 'Total Fat', isCanonical: true },
  { code: 'CHOLE', compoundName: 'Cholesterol', isCanonical: true },
  { code: 'CHOAVLM', compoundName: 'Carbohydrates', isCanonical: false },
  { code: 'CHOAVL', compoundName: 'Carbohydrates', isCanonical: false },
  { code: 'CHOAVLDF-', compoundName: 'Carbohydrates', isCanonical: true },
  { code: 'CHOCDF-', compoundName: 'Carbohydrates', isCanonical: false },
  { code: 'FIB-', compoundName: 'Dietary Fiber', isCanonical: true },
  { code: 'POLYL', compoundName: 'Sorbitol', isCanonical: false }, // Maps to sorbitol as representative polyol
  { code: 'ASH', compoundName: 'Ash', isCanonical: true },
  { code: 'ALC', compoundName: 'Ethanol', isCanonical: true },
  { code: 'NACL_EQ', compoundName: 'Salt', isCanonical: true },

  // Minerals
  { code: 'NA', compoundName: 'Sodium', isCanonical: true },
  { code: 'CA', compoundName: 'Calcium (Total)', isCanonical: true },
  { code: 'MG', compoundName: 'Magnesium (Total)', isCanonical: true },
  { code: 'FE', compoundName: 'Iron (Total)', isCanonical: true },
  { code: 'ZN', compoundName: 'Zinc (Total)', isCanonical: true },
  { code: 'CU', compoundName: 'Copper', isCanonical: true },
  { code: 'MN', compoundName: 'Manganese', isCanonical: true },
  { code: 'ID', compoundName: 'Iodine', isCanonical: true },
  { code: 'SE', compoundName: 'Selenium (Total)', isCanonical: true },
  { code: 'CR', compoundName: 'Chromium (Total)', isCanonical: true },
  { code: 'MO', compoundName: 'Molybdenum', isCanonical: true },

  // Vitamins - Retinoids & Carotenoids
  { code: 'RETOL', compoundName: 'Retinol', isCanonical: true },
  { code: 'CARTA', compoundName: 'Alpha-Carotene', isCanonical: true },
  { code: 'CARTB', compoundName: 'Beta-Carotene', isCanonical: true },
  { code: 'CRYPXB', compoundName: 'Beta-Cryptoxanthin', isCanonical: true },
  { code: 'CARTBEQ', compoundName: 'Beta-Carotene', isCanonical: false }, // Beta-carotene equivalents maps to beta-carotene
  { code: 'VITA_RAE', compoundName: 'Vitamin A (RAE)', isCanonical: true },

  // Vitamins - D, E, K
  { code: 'VITD', compoundName: 'Vitamin D (Total)', isCanonical: true },
  { code: 'TOCPHA', compoundName: 'Alpha-Tocopherol', isCanonical: true },
  { code: 'TOCPHB', compoundName: 'Beta-Tocopherol', isCanonical: true },
  { code: 'TOCPHG', compoundName: 'Gamma-Tocopherol', isCanonical: true },
  { code: 'TOCPHD', compoundName: 'Delta-Tocopherol', isCanonical: true },
  { code: 'VITK', compoundName: 'Vitamin K (Total)', isCanonical: true },

  // Vitamins - B Complex
  { code: 'THIA', compoundName: 'Thiamin (B1)', isCanonical: true },
  { code: 'RIBF', compoundName: 'Riboflavin (B2)', isCanonical: true },
  { code: 'NIA', compoundName: 'Niacin (B3)', isCanonical: true },
  { code: 'NE', compoundName: 'Niacin Equivalents', isCanonical: true },
  { code: 'VITB6A', compoundName: 'Vitamin B6', isCanonical: true },
  { code: 'VITB12', compoundName: 'Vitamin B12 (Total)', isCanonical: true },
  { code: 'FOL', compoundName: 'Folate (Total)', isCanonical: true },
  { code: 'PANTAC', compoundName: 'Pantothenic Acid (B5)', isCanonical: true },
  { code: 'BIOT', compoundName: 'Biotin (B7)', isCanonical: true },

  // Vitamins - C
  { code: 'VITC', compoundName: 'Vitamin C (Total)', isCanonical: true },

  // Amino Acids - Essential
  { code: 'ILE', compoundName: 'Isoleucine', isCanonical: true },
  { code: 'LEU', compoundName: 'Leucine', isCanonical: true },
  { code: 'LYS', compoundName: 'Lysine', isCanonical: true },
  { code: 'MET', compoundName: 'Methionine', isCanonical: true },
  { code: 'PHE', compoundName: 'Phenylalanine', isCanonical: true },
  { code: 'THR', compoundName: 'Threonine', isCanonical: true },
  { code: 'TRP', compoundName: 'Tryptophan', isCanonical: true },
  { code: 'VAL', compoundName: 'Valine', isCanonical: true },
  { code: 'HIS', compoundName: 'Histidine', isCanonical: true },

  // Amino Acids - Non-Essential
  { code: 'CYS', compoundName: 'Cystine', isCanonical: true },
  { code: 'TYR', compoundName: 'Tyrosine', isCanonical: true },
  { code: 'ARG', compoundName: 'Arginine', isCanonical: true },
  { code: 'ALA', compoundName: 'Alanine', isCanonical: true },
  { code: 'ASP', compoundName: 'Aspartic Acid', isCanonical: true },
  { code: 'GLU', compoundName: 'Glutamic Acid', isCanonical: true },
  { code: 'GLY', compoundName: 'Glycine', isCanonical: true },
  { code: 'PRO', compoundName: 'Proline', isCanonical: true },
  { code: 'SER', compoundName: 'Serine', isCanonical: true },
  { code: 'HYP', compoundName: 'Hydroxyproline', isCanonical: true },

  // Fatty Acid Sums
  { code: 'FACID', compoundName: 'Total Fatty Acids', isCanonical: true },
  { code: 'FASAT', compoundName: 'Saturated Fat', isCanonical: true },
  { code: 'FAMS', compoundName: 'Monounsaturated Fat', isCanonical: true },
  { code: 'FAPU', compoundName: 'Polyunsaturated Fat', isCanonical: true },
  { code: 'FAPUN3', compoundName: 'Omega-3', isCanonical: true },
  { code: 'FAPUN6', compoundName: 'Omega-6', isCanonical: true },

  // Saturated Fatty Acids
  { code: 'F4D0', compoundName: 'Butyric Acid', isCanonical: true },
  { code: 'F6D0', compoundName: 'Caproic Acid', isCanonical: true },
  { code: 'F7D0', compoundName: 'Heptanoic Acid', isCanonical: true },
  { code: 'F8D0', compoundName: 'Caprylic Acid', isCanonical: true },
  { code: 'F10D0', compoundName: 'Capric Acid', isCanonical: true },
  { code: 'F12D0', compoundName: 'Lauric Acid', isCanonical: true },
  { code: 'F13D0', compoundName: 'Tridecanoic Acid', isCanonical: true },
  { code: 'F14D0', compoundName: 'Myristic Acid', isCanonical: true },
  { code: 'F15D0', compoundName: 'Pentadecanoic Acid', isCanonical: true },
  { code: 'F15D0AI', compoundName: 'Anteiso-Pentadecanoic Acid', isCanonical: true },
  { code: 'F16D0', compoundName: 'Palmitic Acid', isCanonical: true },
  { code: 'F16D0I', compoundName: 'Iso-Palmitic Acid', isCanonical: true },
  { code: 'F17D0', compoundName: 'Margaric Acid', isCanonical: true },
  { code: 'F17D0AI', compoundName: 'Anteiso-Margaric Acid', isCanonical: true },
  { code: 'F18D0', compoundName: 'Stearic Acid', isCanonical: true },
  { code: 'F20D0', compoundName: 'Arachidic Acid', isCanonical: true },
  { code: 'F22D0', compoundName: 'Behenic Acid', isCanonical: true },
  { code: 'F24D0', compoundName: 'Lignoceric Acid', isCanonical: true },

  // Monounsaturated Fatty Acids
  { code: 'F10D1', compoundName: 'Decenoic Acid', isCanonical: true },
  { code: 'F14D1', compoundName: 'Myristoleic Acid', isCanonical: true },
  { code: 'F15D1', compoundName: 'Pentadecenoic Acid', isCanonical: true },
  { code: 'F16D1', compoundName: 'Palmitoleic Acid', isCanonical: true },
  { code: 'F17D1', compoundName: 'Heptadecenoic Acid', isCanonical: true },
  { code: 'F18D1CN9', compoundName: 'Oleic Acid', isCanonical: true },
  { code: 'F18D1CN7', compoundName: 'Vaccenic Acid (cis)', isCanonical: true },
  { code: 'F20D1', compoundName: 'Gondoic Acid', isCanonical: true },
  { code: 'F22D1', compoundName: 'Erucic Acid', isCanonical: true },
  { code: 'F24D1', compoundName: 'Nervonic Acid', isCanonical: true },

  // Polyunsaturated Fatty Acids - C16
  { code: 'F16D2', compoundName: 'Hexadecadienoic Acid', isCanonical: true },
  { code: 'F16D3', compoundName: 'Hexadecatrienoic Acid', isCanonical: true },
  { code: 'F16D4', compoundName: 'Hexadecatetraenoic Acid', isCanonical: true },

  // Polyunsaturated Fatty Acids - Omega-6
  { code: 'F18D2N6', compoundName: 'LA', isCanonical: true },
  { code: 'F18D3N6', compoundName: 'GLA', isCanonical: true },
  { code: 'F20D2N6', compoundName: 'Eicosadienoic Acid', isCanonical: true },
  { code: 'F20D3N6', compoundName: 'DGLA', isCanonical: true },
  { code: 'F20D4N6', compoundName: 'AA', isCanonical: true },
  { code: 'F22D2', compoundName: 'Docosadienoic Acid', isCanonical: true },
  { code: 'F22D4N6', compoundName: 'Adrenic Acid', isCanonical: true },
  { code: 'F22D5N6', compoundName: 'Docosapentaenoic Acid (n-6)', isCanonical: true },

  // Polyunsaturated Fatty Acids - Omega-3
  { code: 'F18D3N3', compoundName: 'ALA', isCanonical: true },
  { code: 'F18D4N3', compoundName: 'SDA', isCanonical: true },
  { code: 'F20D3N3', compoundName: 'Eicosatrienoic Acid', isCanonical: true },
  { code: 'F20D4N3', compoundName: 'Eicosatetraenoic Acid (n-3)', isCanonical: true },
  { code: 'F20D5N3', compoundName: 'EPA', isCanonical: true },
  { code: 'F21D5N3', compoundName: 'Heneicosapentaenoic Acid', isCanonical: true },
  { code: 'F22D5N3', compoundName: 'DPA', isCanonical: true },
  { code: 'F22D6N3', compoundName: 'DHA', isCanonical: true },
];

async function main() {
  console.log('=== MEXT 8th Edition (Japan) Compound Integration ===\n');

  // Step 1: Add new compounds
  console.log('Step 1: Adding new compounds...');
  let compoundsAdded = 0;

  for (const compound of newCompounds) {
    // Check if compound already exists
    const existing = await db.execute(sql`
      SELECT id FROM compounds WHERE LOWER(name) = LOWER(${compound.name})
    `);

    if (existing.length > 0) {
      console.log(`  - ${compound.name} already exists`);
      continue;
    }

    // Add compound
    try {
      await db.execute(sql`
        INSERT INTO compounds (name, compound_type, unit, description)
        VALUES (${compound.name}, ${compound.type}, ${compound.unit}, ${compound.description})
      `);
      console.log(`  + Added: ${compound.name}`);
      compoundsAdded++;
    } catch (error: any) {
      console.log(`  x Failed to add ${compound.name}: ${error.message}`);
    }
  }

  console.log(`\nNew compounds added: ${compoundsAdded}`);

  // Step 2: Create MEXT mappings
  console.log('\nStep 2: Creating MEXT mappings...');
  let mappedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const mapping of mextMappings) {
    // Find compound by name
    const compound = await db.execute(sql`
      SELECT id FROM compounds WHERE LOWER(name) = LOWER(${mapping.compoundName})
    `);

    if (compound.length === 0) {
      console.log(`  x Compound not found: ${mapping.compoundName} (for ${mapping.code})`);
      failedCount++;
      continue;
    }

    const compoundId = compound[0].id;

    // Check if mapping already exists
    const existingMapping = await db.execute(sql`
      SELECT id FROM compound_sources
      WHERE compound_id = ${compoundId} AND external_source = 'MEXT' AND external_id = ${mapping.code}
    `);

    if (existingMapping.length > 0) {
      skippedCount++;
      continue;
    }

    // Create mapping
    try {
      await db.execute(sql`
        INSERT INTO compound_sources (compound_id, external_source, external_id, is_canonical)
        VALUES (${compoundId}, 'MEXT', ${mapping.code}, ${mapping.isCanonical})
      `);
      mappedCount++;
    } catch (error: any) {
      console.log(`  x Mapping failed: ${mapping.code} -> ${mapping.compoundName} - ${error.message}`);
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
    SELECT COUNT(*)::int as count FROM compound_sources WHERE external_source = 'MEXT'
  `);
  console.log(`Total MEXT mappings: ${totalMappings[0].count}`);

  // Show all source counts
  const allMappings = await db.execute(sql`
    SELECT external_source, COUNT(*)::int as count
    FROM compound_sources
    GROUP BY external_source
    ORDER BY count DESC
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
