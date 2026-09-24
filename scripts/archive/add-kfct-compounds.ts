import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// New compounds to add for KFCT (Korea)
// Most compounds already exist - this is mainly a mapping exercise
const newCompounds = [
  {
    name: 'Folic Acid (Synthetic)',
    type: 'VITAMIN',
    unit: 'µg',
    description: 'Synthetic form of folate (vitamin B9). Used in supplements and fortified foods. More bioavailable than food folate.',
  },
];

// KFCT mappings - codes to compound names
// KFCT uses "F" suffix on many fatty acid codes
const kfctMappings = [
  // Macronutrients
  { code: 'ENERC', compoundName: 'Energy', isCanonical: true },
  { code: 'WATER', compoundName: 'Water', isCanonical: true },
  { code: 'PROCNP', compoundName: 'Protein', isCanonical: true },
  { code: 'FAT', compoundName: 'Total Fat', isCanonical: true },
  { code: 'CHOTDF', compoundName: 'Carbohydrates', isCanonical: true },
  { code: 'ASH', compoundName: 'Ash', isCanonical: true },
  { code: 'CHOLE', compoundName: 'Cholesterol', isCanonical: true },

  // Fiber
  { code: 'FIBTG', compoundName: 'Dietary Fiber', isCanonical: true },
  { code: 'FIBINS', compoundName: 'Insoluble Fiber', isCanonical: true },
  { code: 'FIBSOL', compoundName: 'Soluble Fiber', isCanonical: true },
  { code: 'FIBC', compoundName: 'Crude Fiber', isCanonical: true },

  // Sugars
  { code: 'SUGAR', compoundName: 'Total Sugars', isCanonical: true },
  { code: 'SUCS', compoundName: 'Sucrose', isCanonical: true },
  { code: 'GLUS', compoundName: 'Glucose', isCanonical: true },
  { code: 'FRUS', compoundName: 'Fructose', isCanonical: true },
  { code: 'GALS', compoundName: 'Galactose', isCanonical: true },
  { code: 'LACS', compoundName: 'Lactose', isCanonical: true },
  { code: 'MALS', compoundName: 'Maltose', isCanonical: true },
  { code: 'RAFS', compoundName: 'Raffinose', isCanonical: true },

  // Minerals
  { code: 'NA', compoundName: 'Sodium', isCanonical: true },
  { code: 'NACL', compoundName: 'Salt', isCanonical: true },
  { code: 'CA', compoundName: 'Calcium (Total)', isCanonical: true },
  { code: 'MG', compoundName: 'Magnesium (Total)', isCanonical: true },
  { code: 'FE', compoundName: 'Iron (Total)', isCanonical: true },
  { code: 'ZN', compoundName: 'Zinc (Total)', isCanonical: true },
  { code: 'CU', compoundName: 'Copper', isCanonical: true },
  { code: 'MN', compoundName: 'Manganese', isCanonical: true },
  { code: 'ID', compoundName: 'Iodine', isCanonical: true },
  { code: 'SE', compoundName: 'Selenium (Total)', isCanonical: true },
  { code: 'MO', compoundName: 'Molybdenum', isCanonical: true },

  // Vitamins - Retinoids & Carotenoids
  { code: 'VITA', compoundName: 'Vitamin A (RAE)', isCanonical: false },
  { code: 'VITA_RAE', compoundName: 'Vitamin A (RAE)', isCanonical: true },
  { code: 'RETOL', compoundName: 'Retinol', isCanonical: true },
  { code: 'CARTB', compoundName: 'Beta-Carotene', isCanonical: true },
  { code: 'CARTA', compoundName: 'Alpha-Carotene', isCanonical: true },
  { code: 'CRYPX', compoundName: 'Beta-Cryptoxanthin', isCanonical: true },

  // Vitamins - D
  { code: 'VITD', compoundName: 'Vitamin D (Total)', isCanonical: true },
  { code: 'CHOCAL', compoundName: 'Vitamin D3 (Cholecalciferol)', isCanonical: true },
  { code: 'ERGCAL', compoundName: 'Vitamin D2 (Ergocalciferol)', isCanonical: true },

  // Vitamins - E (Tocopherols)
  { code: 'VITE', compoundName: 'Vitamin E (Total)', isCanonical: true },
  { code: 'TOCPHA', compoundName: 'Alpha-Tocopherol', isCanonical: true },
  { code: 'TOCPHB', compoundName: 'Beta-Tocopherol', isCanonical: true },
  { code: 'TOCPHG', compoundName: 'Gamma-Tocopherol', isCanonical: true },
  { code: 'TOCPHD', compoundName: 'Delta-Tocopherol', isCanonical: true },

  // Vitamins - E (Tocotrienols)
  { code: 'TOCTRA', compoundName: 'Alpha-Tocotrienol', isCanonical: true },
  { code: 'TOCTRB', compoundName: 'Beta-Tocotrienol', isCanonical: true },
  { code: 'TOCTRG', compoundName: 'Gamma-Tocotrienol', isCanonical: true },
  { code: 'TOCTRD', compoundName: 'Delta-Tocotrienol', isCanonical: true },

  // Vitamins - K
  { code: 'VITK1', compoundName: 'Vitamin K1 (Phylloquinone)', isCanonical: true },

  // Vitamins - B Complex
  { code: 'THIA', compoundName: 'Thiamin (B1)', isCanonical: true },
  { code: 'RIBF', compoundName: 'Riboflavin (B2)', isCanonical: true },
  { code: 'NIA', compoundName: 'Niacin (B3)', isCanonical: true },
  { code: 'NIAEQ', compoundName: 'Niacin Equivalents', isCanonical: true },
  { code: 'PYRXN', compoundName: 'Vitamin B6', isCanonical: true },
  { code: 'VITB12', compoundName: 'Vitamin B12 (Total)', isCanonical: true },
  { code: 'FOL', compoundName: 'Folate (Total)', isCanonical: true },
  { code: 'FOLAC', compoundName: 'Folic Acid (Synthetic)', isCanonical: true },
  { code: 'FOLFD', compoundName: 'Folate (Total)', isCanonical: false },
  { code: 'BIOT', compoundName: 'Biotin (B7)', isCanonical: true },
  { code: 'PANTAC', compoundName: 'Pantothenic Acid (B5)', isCanonical: true },

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

  // Taurine
  { code: 'TAUN', compoundName: 'Taurine', isCanonical: true },

  // Fatty Acid Sums
  { code: 'FASATF', compoundName: 'Saturated Fat', isCanonical: true },
  { code: 'FAMSF', compoundName: 'Monounsaturated Fat', isCanonical: true },
  { code: 'FAPUF', compoundName: 'Polyunsaturated Fat', isCanonical: true },
  { code: 'FAPUN3F', compoundName: 'Omega-3', isCanonical: true },
  { code: 'FAPUN6F', compoundName: 'Omega-6', isCanonical: true },
  { code: 'FATRNF', compoundName: 'Trans Fat', isCanonical: true },

  // Saturated Fatty Acids
  { code: 'F4D0F', compoundName: 'Butyric Acid', isCanonical: true },
  { code: 'F6D0F', compoundName: 'Caproic Acid', isCanonical: true },
  { code: 'F8D0F', compoundName: 'Caprylic Acid', isCanonical: true },
  { code: 'F10D0F', compoundName: 'Capric Acid', isCanonical: true },
  { code: 'F12D0F', compoundName: 'Lauric Acid', isCanonical: true },
  { code: 'F13D0F', compoundName: 'Tridecanoic Acid', isCanonical: true },
  { code: 'F14D0F', compoundName: 'Myristic Acid', isCanonical: true },
  { code: 'F15D0F', compoundName: 'Pentadecanoic Acid', isCanonical: true },
  { code: 'F16D0F', compoundName: 'Palmitic Acid', isCanonical: true },
  { code: 'F17D0F', compoundName: 'Margaric Acid', isCanonical: true },
  { code: 'F18D0F', compoundName: 'Stearic Acid', isCanonical: true },
  { code: 'F20D0F', compoundName: 'Arachidic Acid', isCanonical: true },
  { code: 'F21D0F', compoundName: 'Heneicosanoic Acid', isCanonical: true },
  { code: 'F22D0F', compoundName: 'Behenic Acid', isCanonical: true },
  { code: 'F23D0F', compoundName: 'Tricosanoic Acid', isCanonical: true },
  { code: 'F24D0F', compoundName: 'Lignoceric Acid', isCanonical: true },

  // Monounsaturated Fatty Acids
  { code: 'F10D1', compoundName: 'Decenoic Acid', isCanonical: true },
  { code: 'F14D1F', compoundName: 'Myristoleic Acid', isCanonical: true },
  { code: 'F16D1', compoundName: 'Palmitoleic Acid', isCanonical: true },
  { code: 'F17D1F', compoundName: 'Heptadecenoic Acid', isCanonical: true },
  { code: 'F18D1N9F', compoundName: 'Oleic Acid', isCanonical: true },
  { code: 'F18D1N7F', compoundName: 'Vaccenic Acid (cis)', isCanonical: true },
  { code: 'F18D1TN9', compoundName: 'Elaidic Acid', isCanonical: true },
  { code: 'F20D1F', compoundName: 'Gondoic Acid', isCanonical: true },
  { code: 'F22D1F', compoundName: 'Erucic Acid', isCanonical: true },
  { code: 'F24D1F', compoundName: 'Nervonic Acid', isCanonical: true },

  // Polyunsaturated Fatty Acids - Omega-6
  { code: 'F18D2N6F', compoundName: 'LA', isCanonical: true },
  { code: 'F18D2TN6', compoundName: 'Linolelaidic Acid', isCanonical: true },
  { code: 'F18D3N6F', compoundName: 'GLA', isCanonical: true },
  { code: 'F20D2N6F', compoundName: 'Eicosadienoic Acid', isCanonical: true },
  { code: 'F20D3N6F', compoundName: 'DGLA', isCanonical: true },
  { code: 'F20D4N6F', compoundName: 'AA', isCanonical: true },
  { code: 'F22D2F', compoundName: 'Docosadienoic Acid', isCanonical: true },
  { code: 'F22D5N6', compoundName: 'Docosapentaenoic Acid (n-6)', isCanonical: true },

  // Polyunsaturated Fatty Acids - Omega-3
  { code: 'F18D3N3F', compoundName: 'ALA', isCanonical: true },
  { code: 'F18D3TN3', compoundName: 'Trans Alpha-Linolenic Acid', isCanonical: true },
  { code: 'F18D4', compoundName: 'SDA', isCanonical: true },
  { code: 'F20D3N3F', compoundName: 'Eicosatrienoic Acid', isCanonical: true },
  { code: 'F20D4N3', compoundName: 'Eicosatetraenoic Acid (n-3)', isCanonical: true },
  { code: 'F20D5N3F', compoundName: 'EPA', isCanonical: true },
  { code: 'F22D5N3F', compoundName: 'DPA', isCanonical: true },
  { code: 'F22D6N3F', compoundName: 'DHA', isCanonical: true },
];

async function main() {
  console.log('=== KFCT 9th Revision (Korea) Compound Integration ===\n');

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

  // Step 2: Create KFCT mappings
  console.log('\nStep 2: Creating KFCT mappings...');
  let mappedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const mapping of kfctMappings) {
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
      WHERE compound_id = ${compoundId} AND external_source = 'KFCT' AND external_id = ${mapping.code}
    `);

    if (existingMapping.length > 0) {
      skippedCount++;
      continue;
    }

    // Create mapping
    try {
      await db.execute(sql`
        INSERT INTO compound_sources (compound_id, external_source, external_id, is_canonical)
        VALUES (${compoundId}, 'KFCT', ${mapping.code}, ${mapping.isCanonical})
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
    SELECT COUNT(*)::int as count FROM compound_sources WHERE external_source = 'KFCT'
  `);
  console.log(`Total KFCT mappings: ${totalMappings[0].count}`);

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
