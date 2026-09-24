import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// New compounds to add for BLS 4.0
const newCompounds = [
  {
    name: 'Sulphur',
    type: 'MINERAL',
    unit: 'mg',
    description: 'Essential mineral component of amino acids methionine and cysteine. Important for protein synthesis and enzyme function.',
  },
  {
    name: 'Carotenoids (excl. Beta-Carotene)',
    type: 'VITAMIN',
    unit: 'µg',
    description: 'Sum of provitamin A carotenoids excluding beta-carotene, including alpha-carotene, beta-cryptoxanthin, and others.',
  },
  {
    name: 'Essential Amino Acids Total',
    type: 'AMINO_ACID',
    unit: 'g',
    description: 'Sum of the nine essential amino acids: histidine, isoleucine, leucine, lysine, methionine, phenylalanine, threonine, tryptophan, and valine.',
  },
  {
    name: 'Fiber, HMW Water-Soluble',
    type: 'CARBOHYDRATE',
    unit: 'g',
    description: 'High molecular weight dietary fiber that is water-soluble. Includes beta-glucan, pectin, and some hemicelluloses.',
  },
  {
    name: 'Fiber, HMW Water-Insoluble',
    type: 'CARBOHYDRATE',
    unit: 'g',
    description: 'High molecular weight dietary fiber that is water-insoluble. Includes cellulose and lignin.',
  },
];

// BLS 4.0 mappings - all 138 components (minus FAX which we skip)
const blsMappings = [
  // Energy (2)
  { code: 'ENERCJ', compoundName: 'Energy', isCanonical: false }, // kJ variant
  { code: 'ENERCC', compoundName: 'Energy', isCanonical: true },  // kcal canonical

  // Proximate (8)
  { code: 'WATER', compoundName: 'Water', isCanonical: true },
  { code: 'PROT625', compoundName: 'Protein', isCanonical: true },
  { code: 'FAT', compoundName: 'Total Fat', isCanonical: true },
  { code: 'CHO', compoundName: 'Total Carbohydrate', isCanonical: true },
  { code: 'FIBT', compoundName: 'Total Fiber', isCanonical: true },
  { code: 'ALC', compoundName: 'Alcohol', isCanonical: true },
  { code: 'OA', compoundName: 'Total Organic Acids', isCanonical: true },
  { code: 'ASH', compoundName: 'Ash', isCanonical: true },

  // Fat-soluble Vitamins (17)
  { code: 'VITA', compoundName: 'Vitamin A', isCanonical: false }, // RE variant
  { code: 'VITAA', compoundName: 'Vitamin A', isCanonical: true }, // RAE canonical
  { code: 'RETOL', compoundName: 'Retinol', isCanonical: true },
  { code: 'CARTB', compoundName: 'Beta-Carotene', isCanonical: true },
  { code: 'CAROTPAXB', compoundName: 'Carotenoids (excl. Beta-Carotene)', isCanonical: true },
  { code: 'VITD', compoundName: 'Vitamin D', isCanonical: true },
  { code: 'CHOCAL', compoundName: 'Vitamin D3', isCanonical: true },
  { code: 'ERGCAL', compoundName: 'Vitamin D2', isCanonical: true },
  { code: 'VITE', compoundName: 'Vitamin E', isCanonical: true },
  { code: 'TOCPHA', compoundName: 'Alpha-Tocopherol', isCanonical: true },
  { code: 'TOCPHB', compoundName: 'Beta-Tocopherol', isCanonical: true },
  { code: 'TOCPHG', compoundName: 'Gamma-Tocopherol', isCanonical: true },
  { code: 'TOCPHD', compoundName: 'Delta-Tocopherol', isCanonical: true },
  { code: 'TOCTRA', compoundName: 'Alpha-Tocotrienol', isCanonical: true },
  { code: 'VITK', compoundName: 'Vitamin K', isCanonical: true },
  { code: 'VITK1', compoundName: 'Vitamin K1', isCanonical: true },
  { code: 'VITK2', compoundName: 'Vitamin K2', isCanonical: true },

  // Water-soluble Vitamins (12)
  { code: 'THIA', compoundName: 'Thiamin', isCanonical: true },
  { code: 'RIBF', compoundName: 'Riboflavin', isCanonical: true },
  { code: 'NIAEQ', compoundName: 'Niacin Equivalents', isCanonical: true },
  { code: 'NIA', compoundName: 'Niacin', isCanonical: true },
  { code: 'PANTAC', compoundName: 'Pantothenic Acid', isCanonical: true },
  { code: 'VITB6', compoundName: 'Vitamin B6', isCanonical: true },
  { code: 'BIOT', compoundName: 'Biotin', isCanonical: true },
  { code: 'FOL', compoundName: 'Folate', isCanonical: true },
  { code: 'FOLFD', compoundName: 'Intrinsic Folate', isCanonical: true },
  { code: 'FOLAC', compoundName: 'Folic Acid', isCanonical: true },
  { code: 'VITB12', compoundName: 'Vitamin B12', isCanonical: true },
  { code: 'VITC', compoundName: 'Vitamin C', isCanonical: true },

  // Minerals (16)
  { code: 'NACL', compoundName: 'Salt', isCanonical: true },
  { code: 'NA', compoundName: 'Sodium', isCanonical: true },
  { code: 'CLD', compoundName: 'Chloride', isCanonical: true },
  { code: 'K', compoundName: 'Potassium', isCanonical: true },
  { code: 'CA', compoundName: 'Calcium', isCanonical: true },
  { code: 'MG', compoundName: 'Magnesium', isCanonical: true },
  { code: 'P', compoundName: 'Phosphorus', isCanonical: true },
  { code: 'S', compoundName: 'Sulphur', isCanonical: true },
  { code: 'FE', compoundName: 'Iron', isCanonical: true },
  { code: 'ZN', compoundName: 'Zinc', isCanonical: true },
  { code: 'ID', compoundName: 'Iodine', isCanonical: true },
  { code: 'CU', compoundName: 'Copper', isCanonical: true },
  { code: 'MN', compoundName: 'Manganese', isCanonical: true },
  { code: 'FD', compoundName: 'Fluoride', isCanonical: true },
  { code: 'CR', compoundName: 'Chromium', isCanonical: true },
  { code: 'MO', compoundName: 'Molybdenum', isCanonical: true },

  // Organic Acids (5)
  { code: 'ACEAC', compoundName: 'Acetic Acid', isCanonical: true },
  { code: 'CITAC', compoundName: 'Citric Acid', isCanonical: true },
  { code: 'LACAC', compoundName: 'Lactic Acid', isCanonical: true },
  { code: 'MALAC', compoundName: 'Malic Acid', isCanonical: true },
  { code: 'TARAC', compoundName: 'Tartaric Acid', isCanonical: true },

  // Polyols (4)
  { code: 'POLYL', compoundName: 'Sugar Alcohols', isCanonical: true },
  { code: 'MANTL', compoundName: 'Mannitol', isCanonical: true },
  { code: 'SORTL', compoundName: 'Sorbitol', isCanonical: true },
  { code: 'XYLTL', compoundName: 'Xylitol', isCanonical: true },

  // Carbohydrates (11)
  { code: 'MNSAC', compoundName: 'Total Monosaccharides', isCanonical: true },
  { code: 'GLUS', compoundName: 'Glucose', isCanonical: true },
  { code: 'FRUS', compoundName: 'Fructose', isCanonical: true },
  { code: 'GALS', compoundName: 'Galactose', isCanonical: true },
  { code: 'DISAC', compoundName: 'Total Disaccharides', isCanonical: true },
  { code: 'SUCS', compoundName: 'Sucrose', isCanonical: true },
  { code: 'MALS', compoundName: 'Maltose', isCanonical: true },
  { code: 'LACS', compoundName: 'Lactose', isCanonical: true },
  { code: 'SUGAR', compoundName: 'Total Sugars', isCanonical: true },
  { code: 'OLSAC', compoundName: 'Oligosaccharides', isCanonical: true },
  { code: 'STARCH', compoundName: 'Starch', isCanonical: true },

  // Dietary Fibres (6)
  { code: 'FIBLMW', compoundName: 'Fiber, Low Molecular Weight', isCanonical: true },
  { code: 'FIBHMW', compoundName: 'Fiber, High Molecular Weight', isCanonical: true },
  { code: 'FIBINS', compoundName: 'Insoluble Fiber', isCanonical: true },
  { code: 'FIBSOL', compoundName: 'Soluble Fiber', isCanonical: true },
  { code: 'FIBHMWS', compoundName: 'Fiber, HMW Water-Soluble', isCanonical: true },
  { code: 'FIBHMWI', compoundName: 'Fiber, HMW Water-Insoluble', isCanonical: true },

  // Fatty Acids - Saturated (14)
  { code: 'FASAT', compoundName: 'Saturated Fat', isCanonical: true },
  { code: 'F4:0', compoundName: 'Butyric Acid', isCanonical: true },
  { code: 'F6:0', compoundName: 'Caproic Acid', isCanonical: true },
  { code: 'F8:0', compoundName: 'Caprylic Acid', isCanonical: true },
  { code: 'F10:0', compoundName: 'Capric Acid', isCanonical: true },
  { code: 'F12:0', compoundName: 'Lauric Acid', isCanonical: true },
  { code: 'F14:0', compoundName: 'Myristic Acid', isCanonical: true },
  { code: 'F15:0', compoundName: 'Pentadecanoic Acid', isCanonical: true },
  { code: 'F16:0', compoundName: 'Palmitic Acid', isCanonical: true },
  { code: 'F17:0', compoundName: 'Margaric Acid', isCanonical: true },
  { code: 'F18:0', compoundName: 'Stearic Acid', isCanonical: true },
  { code: 'F20:0', compoundName: 'Arachidic Acid', isCanonical: true },
  { code: 'F22:0', compoundName: 'Behenic Acid', isCanonical: true },
  { code: 'F24:0', compoundName: 'Lignoceric Acid', isCanonical: true },

  // Fatty Acids - Monounsaturated (7)
  { code: 'FAMS', compoundName: 'Monounsaturated Fat', isCanonical: true },
  { code: 'F14:1CN5', compoundName: 'Myristoleic Acid', isCanonical: true },
  { code: 'F16:1CN7', compoundName: 'Palmitoleic Acid', isCanonical: true },
  { code: 'F18:1CN7', compoundName: 'Vaccenic Acid (cis)', isCanonical: true },
  { code: 'F18:1CN9', compoundName: 'Oleic Acid', isCanonical: true },
  { code: 'F20:1CN9', compoundName: 'Gondoic Acid', isCanonical: true },
  { code: 'F22:1CN9', compoundName: 'Erucic Acid', isCanonical: true },

  // Fatty Acids - Polyunsaturated (14) - skipping FAX
  { code: 'FAPU', compoundName: 'Polyunsaturated Fat', isCanonical: true },
  { code: 'FAPUN3', compoundName: 'Omega-3 Fatty Acids', isCanonical: true },
  { code: 'F18:3CN3', compoundName: 'Alpha-Linolenic Acid', isCanonical: true },
  { code: 'F18:4CN3', compoundName: 'Stearidonic Acid', isCanonical: true },
  { code: 'F20:5CN3', compoundName: 'Eicosapentaenoic Acid', isCanonical: true },
  { code: 'F22:5CN3', compoundName: 'Docosapentaenoic Acid', isCanonical: true },
  { code: 'F22:6CN3', compoundName: 'Docosahexaenoic Acid', isCanonical: true },
  { code: 'FAPUN6', compoundName: 'Omega-6 Fatty Acids', isCanonical: true },
  { code: 'F18:2CN6', compoundName: 'Linoleic Acid', isCanonical: true },
  { code: 'F18:2C9T11', compoundName: 'Conjugated Linoleic Acid', isCanonical: true },
  { code: 'F18:3CN6', compoundName: 'Gamma-Linolenic Acid', isCanonical: true },
  { code: 'F20:2CN6', compoundName: 'Eicosadienoic Acid', isCanonical: true },
  { code: 'F20:3CN6', compoundName: 'Dihomo-gamma-linolenic Acid', isCanonical: true },
  { code: 'F20:4CN6', compoundName: 'Arachidonic Acid', isCanonical: true },

  // Other (2)
  { code: 'CHORL', compoundName: 'Cholesterol', isCanonical: true },
  { code: 'NT', compoundName: 'Nitrogen', isCanonical: true },

  // Amino Acids (19)
  { code: 'AAE9', compoundName: 'Essential Amino Acids Total', isCanonical: true },
  { code: 'ALA', compoundName: 'Alanine', isCanonical: true },
  { code: 'ARG', compoundName: 'Arginine', isCanonical: true },
  { code: 'ASP', compoundName: 'Aspartic Acid', isCanonical: true },
  { code: 'CYSTE', compoundName: 'Cysteine', isCanonical: true },
  { code: 'GLU', compoundName: 'Glutamic Acid', isCanonical: true },
  { code: 'GLY', compoundName: 'Glycine', isCanonical: true },
  { code: 'HIS', compoundName: 'Histidine', isCanonical: true },
  { code: 'ILE', compoundName: 'Isoleucine', isCanonical: true },
  { code: 'LEU', compoundName: 'Leucine', isCanonical: true },
  { code: 'LYS', compoundName: 'Lysine', isCanonical: true },
  { code: 'MET', compoundName: 'Methionine', isCanonical: true },
  { code: 'PHE', compoundName: 'Phenylalanine', isCanonical: true },
  { code: 'PRO', compoundName: 'Proline', isCanonical: true },
  { code: 'SER', compoundName: 'Serine', isCanonical: true },
  { code: 'THR', compoundName: 'Threonine', isCanonical: true },
  { code: 'TRP', compoundName: 'Tryptophan', isCanonical: true },
  { code: 'TYR', compoundName: 'Tyrosine', isCanonical: true },
  { code: 'VAL', compoundName: 'Valine', isCanonical: true },
];

async function main() {
  console.log('=== BLS 4.0 (Germany) Compound Integration ===\n');

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

  // Step 2: Create BLS mappings
  console.log('Step 2: Creating BLS mappings...');
  let mappedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const mapping of blsMappings) {
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
      WHERE compound_id = ${compoundId} AND external_source = 'BLS' AND external_id = ${mapping.code}
    `);

    if (existingMapping.length > 0) {
      skippedCount++;
      continue;
    }

    // Create mapping
    try {
      await db.execute(sql`
        INSERT INTO compound_sources (compound_id, external_source, external_id, is_canonical)
        VALUES (${compoundId}, 'BLS', ${mapping.code}, ${mapping.isCanonical})
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
    SELECT COUNT(*)::int as count FROM compound_sources WHERE external_source = 'BLS'
  `);
  console.log(`Total BLS mappings: ${totalMappings[0].count}`);

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
