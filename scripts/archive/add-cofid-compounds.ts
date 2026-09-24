import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import * as XLSX from 'xlsx';

// New compounds that don't exist in our database
const newCompounds = [
  { name: 'Oligosaccharide', type: 'CARBOHYDRATE', unit: 'g', description: 'Short-chain carbohydrates (3-10 sugar units)' },
  { name: 'Branched Chain Fatty Acids', type: 'FATTY_ACID', unit: 'g', description: 'Fatty acids with branched carbon chains' },
  { name: '13-cis-Retinol', type: 'VITAMIN', unit: 'µg', description: 'Isomer of retinol (Vitamin A)' },
  { name: 'Dehydroretinol', type: 'VITAMIN', unit: 'µg', description: 'Vitamin A2, found in freshwater fish' },
  { name: 'Retinaldehyde', type: 'VITAMIN', unit: 'µg', description: 'Retinal, aldehyde form of vitamin A' },
  { name: '25-Hydroxyvitamin D3', type: 'VITAMIN', unit: 'µg', description: 'Calcifediol, major circulating form of vitamin D' },
  { name: 'Pentacosanoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C25:0 saturated fatty acid' },
  { name: 'Decenoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C10:1 monounsaturated fatty acid' },
  { name: 'Hexadecatrienoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C16:3 polyunsaturated fatty acid' },
  { name: 'Hexadecatetraenoic Acid', type: 'FATTY_ACID', unit: 'g', description: 'C16:4 polyunsaturated fatty acid' },
  { name: 'Brassicasterol', type: 'STEROL', unit: 'mg', description: 'Phytosterol found in rapeseed/canola oil' },
  { name: 'Delta-5-Avenasterol', type: 'STEROL', unit: 'mg', description: 'Phytosterol found in oats and other plants' },
  { name: 'Delta-7-Avenasterol', type: 'STEROL', unit: 'mg', description: 'Phytosterol found in oats' },
  { name: 'Delta-7-Stigmastenol', type: 'STEROL', unit: 'mg', description: 'Phytosterol found in vegetable oils' },
];

// Complete mapping of CoFID codes to Nutri compound names
const cofidMappings: { code: string; compoundName: string; isCanonical: boolean }[] = [
  // Proximates
  { code: 'WATER', compoundName: 'Water', isCanonical: true },
  { code: 'PROT', compoundName: 'Protein', isCanonical: true },
  { code: 'FAT', compoundName: 'Total Fat', isCanonical: true },
  { code: 'CHO', compoundName: 'Total Carbohydrate', isCanonical: true },
  { code: 'KCALS', compoundName: 'Energy', isCanonical: true },
  { code: 'KJ', compoundName: 'Energy', isCanonical: false },
  { code: 'STAR', compoundName: 'Starch', isCanonical: true },
  { code: 'OLIGO', compoundName: 'Oligosaccharide', isCanonical: true },
  { code: 'TOTSUG', compoundName: 'Total Sugars', isCanonical: true },
  { code: 'GLUC', compoundName: 'Glucose', isCanonical: true },
  { code: 'GALACT', compoundName: 'Galactose', isCanonical: true },
  { code: 'FRUCT', compoundName: 'Fructose', isCanonical: true },
  { code: 'SUCR', compoundName: 'Sucrose', isCanonical: true },
  { code: 'MALT', compoundName: 'Maltose', isCanonical: true },
  { code: 'LACT', compoundName: 'Lactose', isCanonical: true },
  { code: 'ALCO', compoundName: 'Alcohol', isCanonical: true },
  { code: 'ENGFIB', compoundName: 'Total Fiber', isCanonical: false },
  { code: 'AOACFIB', compoundName: 'Total Fiber', isCanonical: true },
  { code: 'SATFOD', compoundName: 'Saturated Fat', isCanonical: true },
  { code: 'TOTn6PFOD', compoundName: 'Omega-6 Fatty Acids', isCanonical: true },
  { code: 'TOTn3PFOD', compoundName: 'Omega-3 Fatty Acids', isCanonical: true },
  { code: 'MONOFODc', compoundName: 'Monounsaturated Fat', isCanonical: true },
  { code: 'MONOFOD', compoundName: 'Monounsaturated Fat', isCanonical: false },
  { code: 'POLYFODc', compoundName: 'Polyunsaturated Fat', isCanonical: true },
  { code: 'POLYFOD', compoundName: 'Polyunsaturated Fat', isCanonical: false },
  { code: 'TOTBRFOD', compoundName: 'Branched Chain Fatty Acids', isCanonical: true },
  { code: 'FODTRANS', compoundName: 'Trans Fat', isCanonical: true },
  { code: 'CHOL', compoundName: 'Cholesterol', isCanonical: true },

  // Inorganics
  { code: 'NA', compoundName: 'Sodium', isCanonical: true },
  { code: 'K', compoundName: 'Potassium', isCanonical: true },
  { code: 'CA', compoundName: 'Calcium', isCanonical: true },
  { code: 'MG', compoundName: 'Magnesium', isCanonical: true },
  { code: 'P', compoundName: 'Phosphorus', isCanonical: true },
  { code: 'FE', compoundName: 'Iron', isCanonical: true },
  { code: 'CU', compoundName: 'Copper', isCanonical: true },
  { code: 'ZN', compoundName: 'Zinc', isCanonical: true },
  { code: 'CL', compoundName: 'Chloride', isCanonical: true },
  { code: 'MN', compoundName: 'Manganese', isCanonical: true },
  { code: 'SE', compoundName: 'Selenium', isCanonical: true },
  { code: 'I', compoundName: 'Iodine', isCanonical: true },

  // Vitamins
  { code: 'RET', compoundName: 'Retinol', isCanonical: true },
  { code: 'CAREQU', compoundName: 'Beta-Carotene', isCanonical: false },
  { code: 'RETEQU', compoundName: 'Vitamin A', isCanonical: true },
  { code: 'VITD', compoundName: 'Vitamin D', isCanonical: true },
  { code: 'VITE', compoundName: 'Vitamin E', isCanonical: true },
  { code: 'VITK1', compoundName: 'Vitamin K', isCanonical: true },
  { code: 'THIA', compoundName: 'Thiamin', isCanonical: true },
  { code: 'RIBO', compoundName: 'Riboflavin', isCanonical: true },
  { code: 'NIAC', compoundName: 'Niacin', isCanonical: true },
  { code: 'VITB6', compoundName: 'Vitamin B6', isCanonical: true },
  { code: 'VITB12', compoundName: 'Vitamin B12', isCanonical: true },
  { code: 'FOLT', compoundName: 'Folate', isCanonical: true },
  { code: 'PANTO', compoundName: 'Pantothenic Acid', isCanonical: true },
  { code: 'BIOT', compoundName: 'Biotin', isCanonical: true },
  { code: 'VITC', compoundName: 'Vitamin C', isCanonical: true },

  // Vitamin Fractions
  { code: 'ALTRET', compoundName: 'Retinol', isCanonical: false },
  { code: '13CISRET', compoundName: '13-cis-Retinol', isCanonical: true },
  { code: 'DEHYRET', compoundName: 'Dehydroretinol', isCanonical: true },
  { code: 'RETALD', compoundName: 'Retinaldehyde', isCanonical: true },
  { code: 'ACAR', compoundName: 'Alpha-Carotene', isCanonical: true },
  { code: 'BCAR', compoundName: 'Beta-Carotene', isCanonical: true },
  { code: 'CRYPT', compoundName: 'Beta-Cryptoxanthin', isCanonical: true },
  { code: 'LUT', compoundName: 'Lutein', isCanonical: true },
  { code: 'LYCO', compoundName: 'Lycopene', isCanonical: true },
  { code: '25OHD3', compoundName: '25-Hydroxyvitamin D3', isCanonical: true },
  { code: 'VITD3', compoundName: 'Vitamin D3', isCanonical: true },
  { code: '5METHF', compoundName: '5-MTHF', isCanonical: true },
  { code: 'ATOPH', compoundName: 'Alpha-Tocopherol', isCanonical: true },
  { code: 'BTOPH', compoundName: 'Beta-Tocopherol', isCanonical: true },
  { code: 'DTOPH', compoundName: 'Delta-Tocopherol', isCanonical: true },
  { code: 'GTOPH', compoundName: 'Gamma-Tocopherol', isCanonical: true },
  { code: 'ATOTR', compoundName: 'Alpha-Tocotrienol', isCanonical: true },
  { code: 'GTOTR', compoundName: 'Gamma-Tocotrienol', isCanonical: true },

  // Saturated Fatty Acids
  { code: 'FOD4:0', compoundName: 'Butyric Acid', isCanonical: true },
  { code: 'FOD6:0', compoundName: 'Caproic Acid', isCanonical: true },
  { code: 'FOD8:0', compoundName: 'Caprylic Acid', isCanonical: true },
  { code: 'FOD10:0', compoundName: 'Capric Acid', isCanonical: true },
  { code: 'FOD11:0xb', compoundName: 'Undecanoic Acid', isCanonical: true },
  { code: 'FOD12:0', compoundName: 'Lauric Acid', isCanonical: true },
  { code: 'FOD12:0xb', compoundName: 'Lauric Acid', isCanonical: false },
  { code: 'FOD13:0', compoundName: 'Tridecanoic Acid', isCanonical: true },
  { code: 'FOD13:0xb', compoundName: 'Tridecanoic Acid', isCanonical: false },
  { code: 'FOD14:0', compoundName: 'Myristic Acid', isCanonical: true },
  { code: 'FOD14:0xb', compoundName: 'Myristic Acid', isCanonical: false },
  { code: 'FOD15:0', compoundName: 'Pentadecanoic Acid', isCanonical: true },
  { code: 'FOD15:0xb', compoundName: 'Pentadecanoic Acid', isCanonical: false },
  { code: 'FOD16:0', compoundName: 'Palmitic Acid', isCanonical: true },
  { code: 'FOD16:0xb', compoundName: 'Palmitic Acid', isCanonical: false },
  { code: 'FOD17:0', compoundName: 'Heptadecanoic Acid', isCanonical: true },
  { code: 'FOD17:0xb', compoundName: 'Heptadecanoic Acid', isCanonical: false },
  { code: 'FOD18:0', compoundName: 'Stearic Acid', isCanonical: true },
  { code: 'FOD18:0xb', compoundName: 'Stearic Acid', isCanonical: false },
  { code: 'FOD19:0', compoundName: 'Nonadecanoic Acid', isCanonical: true },
  { code: 'FOD20:0', compoundName: 'Arachidic Acid', isCanonical: true },
  { code: 'FOD20:0xb', compoundName: 'Arachidic Acid', isCanonical: false },
  { code: 'FOD22:0', compoundName: 'Behenic Acid', isCanonical: true },
  { code: 'FOD22:0xb', compoundName: 'Behenic Acid', isCanonical: false },
  { code: 'FOD24:0', compoundName: 'Lignoceric Acid', isCanonical: true },
  { code: 'FOD24:0xb', compoundName: 'Lignoceric Acid', isCanonical: false },
  { code: 'FOD25:0xb', compoundName: 'Pentacosanoic Acid', isCanonical: true },

  // Monounsaturated Fatty Acids
  { code: 'FOD10:1', compoundName: 'Decenoic Acid', isCanonical: true },
  { code: 'FOD10:1c', compoundName: 'Decenoic Acid', isCanonical: false },
  { code: 'FOD12:1', compoundName: 'Dodecenoic Acid', isCanonical: true },
  { code: 'FOD12:1c', compoundName: 'Dodecenoic Acid', isCanonical: false },
  { code: 'FOD14:1', compoundName: 'Myristoleic Acid', isCanonical: true },
  { code: 'FOD14:1c', compoundName: 'Myristoleic Acid', isCanonical: false },
  { code: 'FOD15:1', compoundName: 'Pentadecenoic Acid', isCanonical: true },
  { code: 'FOD15:1c', compoundName: 'Pentadecenoic Acid', isCanonical: false },
  { code: 'FOD16:1', compoundName: 'Palmitoleic Acid', isCanonical: true },
  { code: 'FOD16:1c', compoundName: 'Palmitoleic Acid (cis)', isCanonical: true },
  { code: 'FOD17:1', compoundName: 'Heptadecenoic Acid', isCanonical: true },
  { code: 'FOD17:1c', compoundName: 'Heptadecenoic Acid', isCanonical: false },
  { code: 'FOD18:1', compoundName: 'Oleic Acid', isCanonical: true },
  { code: 'FOD18:1c', compoundName: 'Oleic Acid (cis)', isCanonical: true },
  { code: 'FOD18:1n9', compoundName: 'Oleic Acid', isCanonical: false },
  { code: 'FOD18:1n7', compoundName: 'Vaccenic Acid (cis)', isCanonical: true },
  { code: 'FOD20:1', compoundName: 'Eicosenoic Acid', isCanonical: true },
  { code: 'FOD20:1c', compoundName: 'Gondoic Acid', isCanonical: true },
  { code: 'FOD22:1', compoundName: 'Erucic Acid', isCanonical: true },
  { code: 'FOD22:1c', compoundName: 'Erucic Acid (cis)', isCanonical: true },
  { code: 'FOD22:1n11', compoundName: 'Cetoleic Acid', isCanonical: true },
  { code: 'FOD22:1n9', compoundName: 'Erucic Acid', isCanonical: false },
  { code: 'FOD24:1', compoundName: 'Nervonic Acid', isCanonical: true },
  { code: 'FOD24:1c', compoundName: 'Nervonic Acid', isCanonical: false },
  { code: 'MONOFODtr', compoundName: 'Trans Fat (Monoenoic)', isCanonical: true },

  // Polyunsaturated Fatty Acids
  { code: 'FOD16:2', compoundName: 'Hexadecadienoic Acid', isCanonical: true },
  { code: 'FOD16:2c', compoundName: 'Hexadecadienoic Acid', isCanonical: false },
  { code: 'FOD16:3', compoundName: 'Hexadecatrienoic Acid', isCanonical: true },
  { code: 'FOD16:4', compoundName: 'Hexadecatetraenoic Acid', isCanonical: true },
  { code: 'FOD16:4c', compoundName: 'Hexadecatetraenoic Acid', isCanonical: false },
  { code: 'FOD18:2', compoundName: 'Linoleic Acid', isCanonical: true },
  { code: 'FOD18:2cn6', compoundName: 'Linoleic Acid (cis,cis)', isCanonical: true },
  { code: 'FOD18:3', compoundName: 'Linolenic Acid Isomers', isCanonical: true },
  { code: 'FOD18:3cn3', compoundName: 'Alpha-Linolenic Acid', isCanonical: true },
  { code: 'FOD18:3cn6', compoundName: 'Gamma-Linolenic Acid', isCanonical: true },
  { code: 'FOD18:4', compoundName: 'Stearidonic Acid', isCanonical: true },
  { code: 'FOD18:4cn3', compoundName: 'Stearidonic Acid', isCanonical: false },
  { code: 'FOD20:2', compoundName: 'Eicosadienoic Acid', isCanonical: true },
  { code: 'FOD20:2cn6', compoundName: 'Eicosadienoic Acid', isCanonical: false },
  { code: 'FOD20:3', compoundName: 'Eicosatrienoic Acid', isCanonical: true },
  { code: 'FOD20:3cn6', compoundName: 'Dihomo-gamma-linolenic Acid', isCanonical: true },
  { code: 'FOD20:4', compoundName: 'Arachidonic Acid', isCanonical: true },
  { code: 'FOD20:4cn6', compoundName: 'Arachidonic Acid', isCanonical: false },
  { code: 'FOD20:5', compoundName: 'Eicosapentaenoic Acid', isCanonical: true },
  { code: 'FOD20:5cn3', compoundName: 'Eicosapentaenoic Acid', isCanonical: false },
  { code: 'FOD21:5', compoundName: 'Heneicosapentaenoic Acid', isCanonical: true },
  { code: 'FOD21:5cn3', compoundName: 'Heneicosapentaenoic Acid', isCanonical: false },
  { code: 'FOD22:2', compoundName: 'Docosadienoic Acid', isCanonical: true },
  { code: 'FOD22:2cn6', compoundName: 'Docosadienoic Acid', isCanonical: false },
  { code: 'FOD22:3cn6', compoundName: 'Docosatrienoic Acid', isCanonical: true },
  { code: 'FOD22:4', compoundName: 'Docosatetraenoic Acid', isCanonical: true },
  { code: 'FOD22:4cn6', compoundName: 'Adrenic Acid', isCanonical: true },
  { code: 'FOD22:5', compoundName: 'Docosapentaenoic Acid', isCanonical: true },
  { code: 'FOD22:5cn3', compoundName: 'Docosapentaenoic Acid', isCanonical: false },
  { code: 'FOD22:6', compoundName: 'Docosahexaenoic Acid', isCanonical: true },
  { code: 'FOD22:6cn3', compoundName: 'Docosahexaenoic Acid', isCanonical: false },
  { code: 'POLYFODtr', compoundName: 'Trans Fat (Polyenoic)', isCanonical: true },

  // Phytosterols
  { code: 'Total PHYTO', compoundName: 'Total Plant Sterols', isCanonical: true },
  { code: 'PHYTO', compoundName: 'Total Plant Sterols', isCanonical: false },
  { code: 'BSITPHYTO', compoundName: 'Beta-Sitosterol', isCanonical: true },
  { code: 'BRASPHYTO', compoundName: 'Brassicasterol', isCanonical: true },
  { code: 'CAMPHYTO', compoundName: 'Campesterol', isCanonical: true },
  { code: 'D5AVEN', compoundName: 'Delta-5-Avenasterol', isCanonical: true },
  { code: 'D7AVEN', compoundName: 'Delta-7-Avenasterol', isCanonical: true },
  { code: 'D7STIG', compoundName: 'Delta-7-Stigmastenol', isCanonical: true },
  { code: 'STIGPHYTO', compoundName: 'Stigmasterol', isCanonical: true },

  // Organic Acids
  { code: 'CITA', compoundName: 'Citric Acid', isCanonical: true },
  { code: 'MALA', compoundName: 'Malic Acid', isCanonical: true },
];

async function main() {
  console.log('=== UK CoFID Compound Integration ===\n');

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
  console.log('Step 2: Creating CoFID mappings...');
  let mapped = 0;
  let skipped = 0;
  let failed = 0;

  for (const mapping of cofidMappings) {
    // Find the compound
    const compound = await db.execute(sql`
      SELECT id, name FROM compounds WHERE LOWER(name) = LOWER(${mapping.compoundName})
    `);

    const rows = compound.rows || compound;
    if (rows.length === 0) {
      console.log(`  ❌ Compound not found: ${mapping.compoundName} (for ${mapping.code})`);
      failed++;
      continue;
    }

    const compoundId = rows[0].id;

    // Check if mapping already exists
    const existingMapping = await db.execute(sql`
      SELECT id FROM compound_sources
      WHERE external_source = 'UK_COFID' AND external_id = ${mapping.code}
    `);

    if ((existingMapping.rows || existingMapping).length > 0) {
      skipped++;
      continue;
    }

    // Insert mapping
    try {
      await db.execute(sql`
        INSERT INTO compound_sources (compound_id, external_source, external_id, source_name, is_canonical)
        VALUES (${compoundId}, 'UK_COFID', ${mapping.code}, ${mapping.compoundName}, ${mapping.isCanonical})
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
