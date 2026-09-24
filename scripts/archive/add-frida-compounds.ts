import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// New compounds to add for FRIDA
const newCompounds = [
  {
    name: 'Menaquinone-5',
    type: 'VITAMIN',
    unit: 'µg',
    description: 'Vitamin K2 form (MK-5), menaquinone with 5 isoprene units. Found in fermented foods.',
  },
  {
    name: 'Menaquinone-6',
    type: 'VITAMIN',
    unit: 'µg',
    description: 'Vitamin K2 form (MK-6), menaquinone with 6 isoprene units. Found in fermented foods.',
  },
  {
    name: 'Menaquinone-10',
    type: 'VITAMIN',
    unit: 'µg',
    description: 'Vitamin K2 form (MK-10), menaquinone with 10 isoprene units. Found in fermented foods and animal products.',
  },
  {
    name: 'cis-Beta-Carotene',
    type: 'VITAMIN',
    unit: 'µg',
    description: 'Cis isomer of beta-carotene, a provitamin A carotenoid. Has reduced vitamin A activity compared to trans form.',
  },
  {
    name: 'Dehydroascorbic Acid',
    type: 'VITAMIN',
    unit: 'mg',
    description: 'Oxidized form of vitamin C (ascorbic acid). Can be reduced back to ascorbic acid in the body.',
  },
  {
    name: 'Bromine',
    type: 'MINERAL',
    unit: 'µg',
    description: 'Trace element (Br). Not essential but found in foods, especially seafood. Bromide is the ionic form.',
  },
  {
    name: 'Phenylethylamine',
    type: 'ALKALOID',
    unit: 'mg',
    description: 'Biogenic amine and trace neurotransmitter. Found in chocolate, fermented foods, and some fruits. Acts as a neuromodulator.',
  },
  {
    name: 'Petroselinic Acid',
    type: 'FATTY_ACID',
    unit: 'g',
    description: 'C18:1,n-12 monounsaturated fatty acid. Found in parsley seed oil and other Umbelliferae plants.',
  },
  {
    name: 'Osbond Acid',
    type: 'FATTY_ACID',
    unit: 'g',
    description: 'C22:5,n-6 omega-6 polyunsaturated fatty acid. Also known as docosapentaenoic acid (n-6). Found in brain and retina.',
  },
  {
    name: 'Crude Fiber',
    type: 'CARBOHYDRATE',
    unit: 'g',
    description: 'Indigestible plant material remaining after acid and alkali extraction. Legacy fiber measurement method.',
  },
];

// FRIDA mappings - codes to compound names
const fridaMappings = [
  // Energy & Macros (skip duplicates - only map unique compound once per code)
  { code: 'ENERC', compoundName: 'Energy', isCanonical: true },
  { code: 'PROT', compoundName: 'Protein', isCanonical: true },
  { code: 'CHOT', compoundName: 'Total Carbohydrate', isCanonical: true },
  { code: 'CHO', compoundName: 'Total Carbohydrate', isCanonical: false },
  { code: 'FIBT', compoundName: 'Total Fiber', isCanonical: true },
  { code: 'FAT', compoundName: 'Total Fat', isCanonical: true },
  { code: 'ALC', compoundName: 'Alcohol', isCanonical: true },
  { code: 'NACL', compoundName: 'Salt', isCanonical: true },
  { code: 'ASH', compoundName: 'Ash', isCanonical: true },
  { code: 'WATER', compoundName: 'Water', isCanonical: true },

  // Vitamin A & Carotenoids
  { code: 'VITA', compoundName: 'Vitamin A', isCanonical: true },
  { code: 'RETOLAT', compoundName: 'Retinol', isCanonical: true },
  { code: 'CARTBTRANS', compoundName: 'Beta-Carotene', isCanonical: true },
  { code: 'CARTBCIS', compoundName: 'cis-Beta-Carotene', isCanonical: true },

  // Vitamin D
  { code: 'VITD', compoundName: 'Vitamin D', isCanonical: true },
  { code: 'CHOCAL', compoundName: 'Vitamin D3', isCanonical: true },
  { code: 'ERGCAL', compoundName: 'Vitamin D2', isCanonical: true },
  { code: 'CHOCALOH', compoundName: '25-Hydroxyvitamin D3', isCanonical: true },
  { code: 'ERGCALOH', compoundName: '25-Hydroxyvitamin D2', isCanonical: true },

  // Vitamin E
  { code: 'VITE', compoundName: 'Vitamin E', isCanonical: true },
  { code: 'TOCPHA', compoundName: 'Alpha-Tocopherol', isCanonical: true },
  { code: 'TOCPHB', compoundName: 'Beta-Tocopherol', isCanonical: true },
  { code: 'TOCPHG', compoundName: 'Gamma-Tocopherol', isCanonical: true },
  { code: 'TOCPHD', compoundName: 'Delta-Tocopherol', isCanonical: true },
  { code: 'TOCTRA', compoundName: 'Alpha-Tocotrienol', isCanonical: true },

  // Vitamin K
  { code: 'VITK', compoundName: 'Vitamin K', isCanonical: true },
  { code: 'VITK1', compoundName: 'Vitamin K1', isCanonical: true },
  { code: 'VITK2', compoundName: 'Vitamin K2', isCanonical: true },
  { code: 'MK4', compoundName: 'Menaquinone-4', isCanonical: true },
  { code: 'MK5', compoundName: 'Menaquinone-5', isCanonical: true },
  { code: 'MK6', compoundName: 'Menaquinone-6', isCanonical: true },
  { code: 'MK7', compoundName: 'Menaquinone-7', isCanonical: true },
  { code: 'MK8', compoundName: 'Menaquinone-8', isCanonical: true },
  { code: 'MK9', compoundName: 'Menaquinone-9', isCanonical: true },
  { code: 'MK10', compoundName: 'Menaquinone-10', isCanonical: true },

  // B Vitamins
  { code: 'THIA', compoundName: 'Thiamin', isCanonical: true },
  { code: 'RIBF', compoundName: 'Riboflavin', isCanonical: true },
  { code: 'NIAEQ', compoundName: 'Niacin Equivalents', isCanonical: true },
  { code: 'NICOTAC', compoundName: 'Niacin', isCanonical: true },
  { code: 'VITB6', compoundName: 'Vitamin B6', isCanonical: true },
  { code: 'PANTAC', compoundName: 'Pantothenic Acid', isCanonical: true },
  { code: 'BIOT', compoundName: 'Biotin', isCanonical: true },
  { code: 'FOL', compoundName: 'Folate', isCanonical: true },
  { code: 'FOLFRE', compoundName: 'Folate', isCanonical: false },
  { code: 'VITB12', compoundName: 'Vitamin B12', isCanonical: true },

  // Vitamin C
  { code: 'VITC', compoundName: 'Vitamin C', isCanonical: true },
  { code: 'ASCL', compoundName: 'Vitamin C', isCanonical: false },
  { code: 'ASCDL', compoundName: 'Dehydroascorbic Acid', isCanonical: true },

  // Minerals
  { code: 'NA', compoundName: 'Sodium', isCanonical: true },
  { code: 'K', compoundName: 'Potassium', isCanonical: true },
  { code: 'CA', compoundName: 'Calcium', isCanonical: true },
  { code: 'MG', compoundName: 'Magnesium', isCanonical: true },
  { code: 'FE', compoundName: 'Iron', isCanonical: true },
  { code: 'CU', compoundName: 'Copper', isCanonical: true },
  { code: 'ZN', compoundName: 'Zinc', isCanonical: true },
  { code: 'MN', compoundName: 'Manganese', isCanonical: true },
  { code: 'SE', compoundName: 'Selenium', isCanonical: true },
  { code: 'P', compoundName: 'Phosphorus', isCanonical: true },
  { code: 'FD', compoundName: 'Fluoride', isCanonical: true },
  { code: 'CLD', compoundName: 'Chloride', isCanonical: true },
  { code: 'ID', compoundName: 'Iodine', isCanonical: true },
  { code: 'S', compoundName: 'Sulfur', isCanonical: true },
  { code: 'RB', compoundName: 'Rubidium', isCanonical: true },
  { code: 'CR', compoundName: 'Chromium', isCanonical: true },
  { code: 'MO', compoundName: 'Molybdenum', isCanonical: true },
  { code: 'CO', compoundName: 'Cobalt', isCanonical: true },
  { code: 'AL', compoundName: 'Aluminum', isCanonical: true },
  { code: 'SI', compoundName: 'Silicon', isCanonical: true },
  { code: 'B', compoundName: 'Boron', isCanonical: true },
  { code: 'NI', compoundName: 'Nickel', isCanonical: true },
  { code: 'BRD', compoundName: 'Bromine', isCanonical: true },
  { code: 'HG', compoundName: 'Mercury', isCanonical: true },
  { code: 'AS', compoundName: 'Arsenic', isCanonical: true },
  { code: 'CD', compoundName: 'Cadmium', isCanonical: true },
  { code: 'PB', compoundName: 'Lead', isCanonical: true },
  { code: 'SN', compoundName: 'Tin', isCanonical: true },

  // Sugars
  { code: 'GLUS', compoundName: 'Glucose', isCanonical: true },
  { code: 'FRUS', compoundName: 'Fructose', isCanonical: true },
  { code: 'GALS', compoundName: 'Galactose', isCanonical: true },
  { code: 'MNSAC', compoundName: 'Total Monosaccharides', isCanonical: true },
  { code: 'SUCS', compoundName: 'Sucrose', isCanonical: true },
  { code: 'MALS', compoundName: 'Maltose', isCanonical: true },
  { code: 'LACS', compoundName: 'Lactose', isCanonical: true },
  { code: 'DISAC', compoundName: 'Total Disaccharides', isCanonical: true },
  { code: 'RAFS', compoundName: 'Raffinose', isCanonical: true },
  { code: 'SUGAR', compoundName: 'Total Sugars', isCanonical: true },
  { code: 'SUGAD', compoundName: 'Added Sugars', isCanonical: true },
  { code: 'SORTL', compoundName: 'Sorbitol', isCanonical: true },

  // Dietary Fibre & Starch
  { code: 'STARCH', compoundName: 'Starch', isCanonical: true },
  { code: 'CELLU', compoundName: 'Cellulose', isCanonical: true },
  { code: 'LIGN', compoundName: 'Lignin', isCanonical: true },
  { code: 'FIBINS', compoundName: 'Insoluble Fiber', isCanonical: true },
  { code: 'FIBHMWS', compoundName: 'Soluble Fiber', isCanonical: true },
  { code: 'FIBLMW', compoundName: 'Soluble Fiber', isCanonical: false },
  { code: 'FIBC', compoundName: 'Crude Fiber', isCanonical: true },

  // Fatty Acid Sums
  { code: 'FASAT', compoundName: 'Saturated Fat', isCanonical: true },
  { code: 'FAMS', compoundName: 'Monounsaturated Fat', isCanonical: true },
  { code: 'FAPU', compoundName: 'Polyunsaturated Fat', isCanonical: true },
  { code: 'FATRS', compoundName: 'Trans Fat', isCanonical: true },
  { code: 'FAN3', compoundName: 'Omega-3 Fatty Acids', isCanonical: true },
  { code: 'FAN6', compoundName: 'Omega-6 Fatty Acids', isCanonical: true },
  { code: 'FACID', compoundName: 'Total Fatty Acids', isCanonical: true },

  // Saturated Fatty Acids
  { code: 'F4:0', compoundName: 'Butyric Acid', isCanonical: true },
  { code: 'F6:0', compoundName: 'Caproic Acid', isCanonical: true },
  { code: 'F8:0', compoundName: 'Caprylic Acid', isCanonical: true },
  { code: 'F10:0', compoundName: 'Capric Acid', isCanonical: true },
  { code: 'F12:0', compoundName: 'Lauric Acid', isCanonical: true },
  { code: 'F13:0', compoundName: 'Tridecanoic Acid', isCanonical: true },
  { code: 'F14:0', compoundName: 'Myristic Acid', isCanonical: true },
  { code: 'F15:0', compoundName: 'Pentadecanoic Acid', isCanonical: true },
  { code: 'F16:0', compoundName: 'Palmitic Acid', isCanonical: true },
  { code: 'F17:0', compoundName: 'Margaric Acid', isCanonical: true },
  { code: 'F18:0', compoundName: 'Stearic Acid', isCanonical: true },
  { code: 'F20:0', compoundName: 'Arachidic Acid', isCanonical: true },
  { code: 'F21:0', compoundName: 'Heneicosanoic Acid', isCanonical: true },
  { code: 'F22:0', compoundName: 'Behenic Acid', isCanonical: true },
  { code: 'F23:0', compoundName: 'Tricosanoic Acid', isCanonical: true },
  { code: 'F24:0', compoundName: 'Lignoceric Acid', isCanonical: true },

  // Monounsaturated Fatty Acids - Cis
  { code: 'F12:1CIS', compoundName: 'Dodecenoic Acid', isCanonical: true },
  { code: 'F14:1CN5', compoundName: 'Myristoleic Acid', isCanonical: true },
  { code: 'F15:1CIS', compoundName: 'Pentadecenoic Acid', isCanonical: true },
  { code: 'F16:1CN7', compoundName: 'Palmitoleic Acid', isCanonical: true },
  { code: 'F17:1CIS', compoundName: 'Heptadecenoic Acid', isCanonical: true },
  { code: 'F18:1CN7', compoundName: 'Vaccenic Acid (cis)', isCanonical: true },
  { code: 'F18:1CN9', compoundName: 'Oleic Acid', isCanonical: true },
  { code: 'F18:1CN12', compoundName: 'Petroselinic Acid', isCanonical: true },
  { code: 'F20:1CN9', compoundName: 'Eicosenoic Acid', isCanonical: true },
  { code: 'F20:1CN11', compoundName: 'Gondoic Acid', isCanonical: true },
  { code: 'F22:1CN9', compoundName: 'Erucic Acid', isCanonical: true },
  { code: 'F22:1CN11', compoundName: 'Cetoleic Acid', isCanonical: true },
  { code: 'F24:1CN9', compoundName: 'Nervonic Acid', isCanonical: true },

  // Monounsaturated Fatty Acids - Trans
  { code: 'F14:1TN5', compoundName: 'Trans Myristoleic Acid', isCanonical: true },
  { code: 'F16:1TN7', compoundName: 'Palmitoleic Acid (trans)', isCanonical: true },
  { code: 'F18:1TRS', compoundName: 'Oleic Acid (trans)', isCanonical: true },
  { code: 'F20:1TRS', compoundName: 'Trans Eicosenoic Acid', isCanonical: true },
  { code: 'F22:1TRS', compoundName: 'Erucic Acid (trans)', isCanonical: true },

  // Polyunsaturated Fatty Acids - Omega-6
  { code: 'F18:2CN6', compoundName: 'Linoleic Acid', isCanonical: true },
  { code: 'F18:2CON', compoundName: 'Conjugated Linoleic Acid', isCanonical: true },
  { code: 'F18:3CN6', compoundName: 'Gamma-Linolenic Acid', isCanonical: true },
  { code: 'F20:2CN6', compoundName: 'Eicosadienoic Acid', isCanonical: true },
  { code: 'F20:3CN6', compoundName: 'Dihomo-gamma-linolenic Acid', isCanonical: true },
  { code: 'F20:4CN6', compoundName: 'Arachidonic Acid', isCanonical: true },
  { code: 'F22:2CN6', compoundName: 'Docosadienoic Acid', isCanonical: true },
  { code: 'F22:4CN6', compoundName: 'Adrenic Acid', isCanonical: true },
  { code: 'F22:5N6', compoundName: 'Osbond Acid', isCanonical: true },

  // Polyunsaturated Fatty Acids - Omega-3
  { code: 'F18:3CN3', compoundName: 'Alpha-Linolenic Acid', isCanonical: true },
  { code: 'F18:4CN3', compoundName: 'Stearidonic Acid', isCanonical: true },
  { code: 'F20:3CN3', compoundName: 'Eicosatrienoic Acid (n-3)', isCanonical: true },
  { code: 'F20:4CN3', compoundName: 'Eicosatetraenoic Acid (n-3)', isCanonical: true },
  { code: 'F20:5CN3', compoundName: 'Eicosapentaenoic Acid', isCanonical: true },
  { code: 'F21:5CN3', compoundName: 'Heneicosapentaenoic Acid', isCanonical: true },
  { code: 'F22:3CN3', compoundName: 'Docosatrienoic Acid', isCanonical: true },
  { code: 'F22:5CN3', compoundName: 'Docosapentaenoic Acid', isCanonical: true },
  { code: 'F22:6CN3', compoundName: 'Docosahexaenoic Acid', isCanonical: true },

  // Trans PUFAs
  { code: 'F18:2TRS', compoundName: 'Linoleic Acid (trans,trans)', isCanonical: true },
  { code: 'F18:3TRS', compoundName: 'Trans Alpha-Linolenic Acid', isCanonical: true },

  // Sterols
  { code: 'CHORL', compoundName: 'Cholesterol', isCanonical: true },

  // Amino Acids
  { code: 'NT', compoundName: 'Nitrogen', isCanonical: true },
  { code: 'ILE', compoundName: 'Isoleucine', isCanonical: true },
  { code: 'LEU', compoundName: 'Leucine', isCanonical: true },
  { code: 'LYS', compoundName: 'Lysine', isCanonical: true },
  { code: 'MET', compoundName: 'Methionine', isCanonical: true },
  { code: 'CYS', compoundName: 'Cystine', isCanonical: true },
  { code: 'PHE', compoundName: 'Phenylalanine', isCanonical: true },
  { code: 'TYR', compoundName: 'Tyrosine', isCanonical: true },
  { code: 'THR', compoundName: 'Threonine', isCanonical: true },
  { code: 'TRP', compoundName: 'Tryptophan', isCanonical: true },
  { code: 'VAL', compoundName: 'Valine', isCanonical: true },
  { code: 'ARG', compoundName: 'Arginine', isCanonical: true },
  { code: 'HIS', compoundName: 'Histidine', isCanonical: true },
  { code: 'ALA', compoundName: 'Alanine', isCanonical: true },
  { code: 'ASP', compoundName: 'Aspartic Acid', isCanonical: true },
  { code: 'GLU', compoundName: 'Glutamic Acid', isCanonical: true },
  { code: 'GLY', compoundName: 'Glycine', isCanonical: true },
  { code: 'PRO', compoundName: 'Proline', isCanonical: true },
  { code: 'SER', compoundName: 'Serine', isCanonical: true },
  { code: 'HYP', compoundName: 'Hydroxyproline', isCanonical: true },

  // Biogenic Amines
  { code: 'HISTN', compoundName: 'Histamine', isCanonical: true },
  { code: 'SEROTN', compoundName: 'Serotonin', isCanonical: true },
  { code: 'CHOLN', compoundName: 'Choline', isCanonical: true },
  { code: 'TYRA', compoundName: 'Tyramine', isCanonical: true },
  { code: 'PHETN', compoundName: 'Phenylethylamine', isCanonical: true },
  { code: 'PUTRSC', compoundName: 'Putrescine', isCanonical: true },
  { code: 'CADAVT', compoundName: 'Cadaverine', isCanonical: true },
  { code: 'SPERN', compoundName: 'Spermine', isCanonical: true },
  { code: 'SPERDN', compoundName: 'Spermidine', isCanonical: true },

  // Organic Acids
  { code: 'LACACL', compoundName: 'Lactic Acid', isCanonical: false },
  { code: 'LACACD', compoundName: 'Lactic Acid', isCanonical: false },
  { code: 'LACAC', compoundName: 'Lactic Acid', isCanonical: true },
  { code: 'CITAC', compoundName: 'Citric Acid', isCanonical: true },
  { code: 'OXALAC', compoundName: 'Oxalic Acid', isCanonical: true },
  { code: 'PROPAC', compoundName: 'Propionic Acid', isCanonical: true },
  { code: 'BENAC', compoundName: 'Benzoic Acid', isCanonical: true },
];

async function main() {
  console.log('=== FRIDA 5.4 (Denmark) Compound Integration ===\n');

  // Step 1: Skipped — new compounds already added in previous runs
  console.log('Step 1: Skipped (new compounds already exist)');

  // Step 2: Create FRIDA mappings
  console.log('\nStep 2: Creating FRIDA mappings...');
  let mappedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const mapping of fridaMappings) {
    // Find compound by name
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
      WHERE compound_id = ${compoundId} AND external_source = 'FRIDA' AND external_id = ${mapping.code}
    `);

    if (existingMapping.length > 0) {
      skippedCount++;
      continue;
    }

    // Create mapping
    try {
      await db.execute(sql`
        INSERT INTO compound_sources (compound_id, external_source, external_id, is_canonical)
        VALUES (${compoundId}, 'FRIDA', ${mapping.code}, ${mapping.isCanonical})
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
    SELECT COUNT(*)::int as count FROM compound_sources WHERE external_source = 'FRIDA'
  `);
  console.log(`Total FRIDA mappings: ${totalMappings[0].count}`);

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
