/**
 * UK CoFID (Composition of Foods Integrated Dataset) Import Script
 *
 * Imports CoFID 2021 data from Excel + nutrients.json into staging tables:
 * - source_cofid_nutrients: Nutrient definitions with codes
 * - source_cofid_foods: Food items with metadata
 * - source_cofid_content: Nutrient values per food (long format)
 *
 * Data source: cofid-2021.xlsx (15 sheets, ~2,887 foods, 280 nutrients)
 *
 * Key design decisions:
 * - nutrient_code uses CoFID codes (WATER, PROT, etc.) matching compound_sources.external_id
 * - Only "per 100g food" values are imported for fatty acids (skip "per 100g FA" sheets)
 * - Values like "N" (not detected), "Tr" (trace), "" are stored as null
 * - "Tr" (trace) is stored as 0 to indicate presence without measurable quantity
 */

import xlsx from 'xlsx';
import postgres from 'postgres';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration
const BATCH_SIZE = 100;
const CONTENT_BATCH_SIZE = 1000;
const DATA_DIR = join(__dirname, '..', '..', '..', 'data', 'uk-cofid');
const EXCEL_FILE = join(DATA_DIR, 'cofid-2021.xlsx');
const NUTRIENTS_FILE = join(DATA_DIR, 'nutrients.json');

// Food info columns (first 7 in each sheet)
const FOOD_COL_COUNT = 7; // Food Code, Food Name, Description, Group, Previous, Main data references, Footnote

// Database connection
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 5,
});

/**
 * Mapping from nutrients.json column names to CoFID nutrient codes.
 * These codes match what's stored in compound_sources.external_id WHERE external_source = 'UK_COFID'.
 *
 * Only includes sheets we want to import (per 100g food, not per 100g FA).
 */
const COLUMN_TO_CODE = {
  // 1.2 Factors
  'Edible proportion': 'EDPRO',
  'Specific gravity': 'SPECGRAV',
  'Total solids': 'TOTSOL',
  'Nitrogen conversion factor': 'NITCONV',
  'Glycerol conversion factor': 'GLYCONV',

  // 1.3 Proximates
  'Water': 'WATER',
  'Total nitrogen': 'TOTNIT',
  'Protein': 'PROT',
  'Fat': 'FAT',
  'Carbohydrate': 'CHO',
  'Energy (kcal)': 'KCALS',
  'Energy (kJ)': 'KJ',
  'Starch': 'STAR',
  'Oligosaccharide': 'OLIGO',
  'Total sugars': 'TOTSUG',
  'Glucose': 'GLUC',
  'Galactose': 'GALACT',
  'Fructose': 'FRUCT',
  'Sucrose': 'SUCR',
  'Maltose': 'MALT',
  'Lactose': 'LACT',
  'Alcohol': 'ALCO',
  'NSP': 'ENGFIB',
  'AOAC fibre': 'AOACFIB',
  'Satd FA /100g FA': 'SATFAC',
  'Satd FA /100g fd': 'SATFOD',
  'n-6 poly /100g FA': 'TOTn6PFAC',
  'n-6 poly /100g food': 'TOTn6PFOD',
  'n-3 poly /100g FA': 'TOTn3PFAC',
  'n-3 poly /100g food': 'TOTn3PFOD',
  'cis-Mono FA /100g FA': 'MONOFACc',
  'cis-Mono FA /100g Food': 'MONOFODc',
  'Mono FA/ 100g FA': 'MONOFAC',
  'Mono FA /100g food': 'MONOFOD',
  'cis-Polyu FA /100g FA': 'POLYFACc',
  'cis-Poly FA /100g Food': 'POLYFODc',
  'Poly FA /100g FA': 'POLYFAC',
  'Poly FA /100g food': 'POLYFOD',
  'Sat FA excl Br /100g FA': 'SATFACx6',
  'Sat FA excl Br /100g food': 'SATFODx6',
  'Branched chain FA /100g FA': 'TOTBRFAC',
  'Branched chain FA /100g food': 'TOTBRFOD',
  'Trans FAs /100g FA': 'FACTRANS',
  'Trans FAs /100g food': 'FODTRANS',
  'Cholesterol': 'CHOL',

  // 1.4 Inorganics
  'Sodium': 'NA',
  'Potassium': 'K',
  'Calcium': 'CA',
  'Magnesium': 'MG',
  'Phosphorus': 'P',
  'Iron': 'FE',
  'Copper': 'CU',
  'Zinc': 'ZN',
  'Chloride': 'CL',
  'Manganese': 'MN',
  'Selenium': 'SE',
  'Iodine': 'I',

  // 1.5 Vitamins
  'Retinol': 'RET',
  'Carotene': 'CAREQU',
  'Retinol Equivalent': 'RETEQU',
  'Vitamin D': 'VITD',
  'Vitamin E': 'VITE',
  'Vitamin K1': 'VITK1',
  'Thiamin': 'THIA',
  'Riboflavin': 'RIBO',
  'Niacin': 'NIAC',
  'Tryptophan/60': 'TRYP60',
  'Niacin equivalent': 'NIACEQU',
  'Vitamin B6': 'VITB6',
  'Vitamin B12': 'VITB12',
  'Folate': 'FOLT',
  'Pantothenate': 'PANTO',
  'Biotin': 'BIOT',
  'Vitamin C': 'VITC',

  // 1.6 Vitamin Fractions
  'All-trans-retinol': 'ALTRET',
  '13-cis-retinol': '13CISRET',
  'Dehydroretinol': 'DEHYRET',
  'Retinaldehyde': 'RETALD',
  'Alpha-carotene': 'ACAR',
  'Beta-carotene': 'BCAR',
  'Cryptoxanthins': 'CRYPT',
  'Lutein': 'LUT',
  'Lycopene': 'LYCO',
  '25-hydroxy vitamin D3': '25OHD3',
  'Cholecalciferol': 'VITD3',
  '5-mehtyl folate': '5METHF',  // Note: typo in original data
  'Alpha-tocopherol': 'ATOPH',
  'Beta-tocopherol': 'BTOPH',
  'Delta-tocopherol': 'DTOPH',
  'Gamma-tocopherol': 'GTOPH',
  'Alpha-tocotrienol': 'ATOTR',
  'Gamma-tocotrienol': 'GTOTR',

  // 1.8 (SFA per 100gFood) - only per-food values
  'C4:0 /100g food': 'FOD4:0',
  'C6:0 /100g food': 'FOD6:0',
  'C8:0 /100g food': 'FOD8:0',
  'C10:0 /100g food': 'FOD10:0',
  'C11:0 ex Br /100g food': 'FOD11:0xb',
  'C12:0 /100g food': 'FOD12:0',
  'C12:0 ex Br /100g food': 'FOD12:0xb',
  'C13:0 /100g food': 'FOD13:0',
  'C13:0 ex Br /100g food': 'FOD13:0xb',
  'C14:0 /100g food': 'FOD14:0',
  'C14:0 ex Br /100g food': 'FOD14:0xb',
  'C15:0 /100g food': 'FOD15:0',
  'C15:0 ex Br /100g food': 'FOD15:0xb',
  'C16:0 /100g food': 'FOD16:0',
  'C16:0 ex Br /100g food': 'FOD16:0xb',
  'C17:0 /100g food': 'FOD17:0',
  'C17:0 ex Br /100g food': 'FOD17:0xb',
  'C18:0 /100g food': 'FOD18:0',
  'C18:0 ex Br /100g food': 'FOD18:0xb',
  'C19:0 /100g food': 'FOD19:0',
  'C20:0 /100g food': 'FOD20:0',
  'C20:0 ex Br /100g food': 'FOD20:0xb',
  'C22:0 /100g food': 'FOD22:0',
  'C22:0 ex Br /100g food': 'FOD22:0xb',
  'C24:0 /100g food': 'FOD24:0',
  'C24:0 ex Br /100g food': 'FOD24:0xb',
  'C25:0 ex Br /100g food': 'FOD25:0xb',

  // 1.10 (MUFA per 100gFood) - only per-food values
  'C10:1 /100g food': 'FOD10:1',
  'cis C10:1 /100g food': 'FOD10:1c',
  'C12:1 /100g food': 'FOD12:1',
  'cis C12:1 /100g food': 'FOD12:1c',
  'C14:1 /100g food': 'FOD14:1',
  'cis C14:1 /100g food': 'FOD14:1c',
  'C15:1 /100g food': 'FOD15:1',
  'cis C15:1 /100g food': 'FOD15:1c',
  'C16:1 /100g food': 'FOD16:1',
  'cis C16:1 /100g food': 'FOD16:1c',
  'C17:1 /100g food': 'FOD17:1',
  'cis C17:1 /100g food': 'FOD17:1c',
  'C18:1 /100g food': 'FOD18:1',
  'cis C18:1 /100g food': 'FOD18:1c',
  'cis/trans C18:1n-9 /100g food': 'FOD18:1n9',
  'cis/trans C18:1n-7 /100g food': 'FOD18:1n7',
  'C20:1 /100g food': 'FOD20:1',
  'cis C20:1 /100g food': 'FOD20:1c',
  'C22:1 /100g food': 'FOD22:1',
  'cis C22:1 /100g food': 'FOD22:1c',
  'cis/trans C22:1n-11 /100g food': 'FOD22:1n11',
  'cis/trans C22:1n-9 /100g food': 'FOD22:1n9',
  'C24:1 /100g food': 'FOD24:1',
  'cis C24:1 /100g food': 'FOD24:1c',
  'trans monounsaturated /100g food': 'MONOFODtr',

  // 1.12 (PUFA per 100gFood) - only per-food values
  'C16:2 /100g food': 'FOD16:2',
  'cis C16:2 /100g food': 'FOD16:2c',
  'C16:3 /100g food': 'FOD16:3',
  'C16:4 /100g food': 'FOD16:4',
  'cis C16:4 /100g food': 'FOD16:4c',
  'unknown C16 poly /100g food': 'FOD16 poly',
  'C18:2 /100g food': 'FOD18:2',
  'cis n-6 C18:2 /100g food': 'FOD18:2cn6',
  'C18:3 /100g food': 'FOD18:3',
  'cis n-3 C18:3 /100g food': 'FOD18:3cn3',
  'cis n-6 C18:3 /100g food': 'FOD18:3cn6',
  'C18:4 /100g food': 'FOD18:4',
  'cis n-3 C18:4 /100g food': 'FOD18:4cn3',
  'unknown C18 poly /100g food': 'FOD18 poly',
  'C20:2 /100g food': 'FOD20:2',
  'cis n-6 C20:2 /100g food': 'FOD20:2cn6',
  'C20:3 /100g food': 'FOD20:3',
  'cis n-6 C20:3 /100g food': 'FOD20:3cn6',
  'C20:4 /100g food': 'FOD20:4',
  'cis n-6 C20:4 /100g food': 'FOD20:4cn6',
  'C20:5 /100g food': 'FOD20:5',
  'cis n-3 C20:5 /100g food': 'FOD20:5cn3',
  'unknown C20 poly /100g food': 'FOD20 poly',
  'C21:5 /100g food': 'FOD21:5',
  'cis n-3 C21:5 /100g food': 'FOD21:5cn3',
  'C22:2 /100g food': 'FOD22:2',
  'cis n-6 C22:2 /100g food': 'FOD22:2cn6',
  'cis n-6 C22:3 /100g food': 'FOD22:3cn6',
  'C22:4 /100g food': 'FOD22:4',
  'cis n-6 C22:4 /100g food': 'FOD22:4cn6',
  'C22:5 /100g food': 'FOD22:5',
  'cis n-3 C22:5 /100g food': 'FOD22:5cn3',
  'C22:6 /100g food': 'FOD22:6',
  'cis n-3 C22:6 /100g food': 'FOD22:6cn3',
  'unknown C22 poly /100g food': 'FOD22 poly',
  'trans poly /100g food': 'POLYFODtr',

  // 1.13 Phytosterols
  'Total Phytosterols': 'Total PHYTO',
  'Other Cholesterol and Phytosterols': 'Other CHOL and PHYTO',
  'Phytosterol': 'PHYTO',
  'Beta-sitosterol': 'BSITPHYTO',
  'Brassicasterol': 'BRASPHYTO',
  'Campesterol': 'CAMPHYTO',
  'Delta-5-avenasterol': 'D5AVEN',
  'Delta-7-avenasterol': 'D7AVEN',
  'Delta-7-stigmastenol': 'D7STIG',
  'Stigmasterol': 'STIGPHYTO',

  // 1.14 Organic Acids
  'Citric acid': 'CITA',
  'Malic acid': 'MALA',
};

/**
 * Sheets to import (skip per-100g-FA sheets to avoid duplicate data)
 */
const SHEETS_TO_IMPORT = [
  '1.2 Factors',
  '1.3 Proximates',
  '1.4 Inorganics',
  '1.5 Vitamins',
  '1.6 Vitamin Fractions',
  '1.8 (SFA per 100gFood)',      // Per food, not per FA
  '1.10 (MUFA per 100gFood)',    // Per food, not per FA
  '1.12 (PUFA per 100gFood)',    // Per food, not per FA
  '1.13 Phytosterols',
  '1.14 Organic Acids',
];

/**
 * Parse a cell value to a number, handling CoFID special values
 * "N" = not detected → null
 * "Tr" = trace → 0
 * "" or null → null
 * Numbers (including strings like "240") → parsed float
 */
function parseValue(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const s = String(val).trim();
  if (s === 'N' || s === 'n' || s === '') return null;
  if (s === 'Tr' || s === 'tr' || s === 'TR') return 0;
  const num = parseFloat(s);
  return isNaN(num) ? null : num;
}

/**
 * Import all CoFID data
 */
async function importData() {
  console.log('========================================');
  console.log('UK CoFID Import Script');
  console.log('========================================');

  if (!existsSync(EXCEL_FILE)) {
    console.error(`Missing file: ${EXCEL_FILE}`);
    process.exit(1);
  }
  if (!existsSync(NUTRIENTS_FILE)) {
    console.error(`Missing file: ${NUTRIENTS_FILE}`);
    process.exit(1);
  }

  // Load nutrients.json
  const nutrientsJson = JSON.parse(readFileSync(NUTRIENTS_FILE, 'utf-8'));
  console.log(`Loaded ${nutrientsJson.length} nutrient definitions from nutrients.json`);

  // Load Excel
  console.log(`\nReading ${EXCEL_FILE}...`);
  const workbook = xlsx.readFile(EXCEL_FILE);
  console.log(`Found ${workbook.SheetNames.length} sheets`);

  // === STEP 1: Import Nutrients ===
  console.log('\n=== Step 1: Importing Nutrients ===');
  await sql`TRUNCATE source_cofid_nutrients CASCADE`;

  // Build nutrient records from nutrients.json, only for sheets we're importing
  const nutrientRecords = [];
  const seenCodes = new Set();

  for (const entry of nutrientsJson) {
    // Only include nutrients from sheets we're importing
    if (!SHEETS_TO_IMPORT.includes(entry.sheet)) continue;

    const code = COLUMN_TO_CODE[entry.name];
    if (!code) {
      // Nutrient name not in our mapping - skip it
      continue;
    }

    // Skip duplicates (same code from different contexts)
    if (seenCodes.has(code)) continue;
    seenCodes.add(code);

    nutrientRecords.push({
      nutrient_code: code,
      name: entry.name,
      unit: entry.unit || 'unknown',
      sheet: entry.sheet,
      column_name: entry.column,
    });
  }

  // Insert nutrients in batches
  for (let i = 0; i < nutrientRecords.length; i += BATCH_SIZE) {
    const batch = nutrientRecords.slice(i, i + BATCH_SIZE);
    await sql`
      INSERT INTO source_cofid_nutrients ${sql(batch,
        'nutrient_code', 'name', 'unit', 'sheet', 'column_name'
      )}
    `;
  }
  console.log(`  Imported ${nutrientRecords.length} nutrients`);

  // === STEP 2: Import Foods (from Proximates sheet - has all foods) ===
  console.log('\n=== Step 2: Importing Foods ===');
  await sql`TRUNCATE source_cofid_foods CASCADE`;

  const proxSheet = workbook.Sheets['1.3 Proximates'];
  const proxRows = xlsx.utils.sheet_to_json(proxSheet, { header: 1, defval: null });
  const dataRows = proxRows.slice(3); // Skip header + 2 empty rows

  let foodCount = 0;
  for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
    const batch = dataRows.slice(i, i + BATCH_SIZE);

    const foods = batch
      .filter(row => row[0] && String(row[0]).trim()) // Must have food code
      .map(row => ({
        food_code: String(row[0]).trim(),
        name: row[1] ? String(row[1]).trim() : 'Unknown',
        description: row[2] ? String(row[2]).trim() : null,
        food_group: row[3] ? String(row[3]).trim() : null,
      }));

    if (foods.length > 0) {
      await sql`
        INSERT INTO source_cofid_foods ${sql(foods,
          'food_code', 'name', 'description', 'food_group'
        )}
        ON CONFLICT (food_code) DO UPDATE SET name = EXCLUDED.name
      `;
      foodCount += foods.length;
    }

    process.stdout.write(`\r  Imported ${foodCount} foods`);
  }
  console.log('');

  // === STEP 3: Import Content (nutrient values from all sheets) ===
  console.log('\n=== Step 3: Importing Nutrient Content ===');
  await sql`TRUNCATE source_cofid_content`;

  // Build a reverse lookup: column header text → nutrient code
  // We need to match Excel column headers (like "Water (g)") to our codes
  const columnHeaderToCode = {};
  for (const entry of nutrientsJson) {
    if (!SHEETS_TO_IMPORT.includes(entry.sheet)) continue;
    const code = COLUMN_TO_CODE[entry.name];
    if (code && !columnHeaderToCode[entry.column]) {
      columnHeaderToCode[entry.column] = code;
    }
  }

  let contentCount = 0;
  let pendingContent = [];

  for (const sheetName of SHEETS_TO_IMPORT) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      console.log(`  Warning: Sheet "${sheetName}" not found, skipping`);
      continue;
    }

    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
    const headers = rows[0];
    const sheetDataRows = rows.slice(3); // Skip header + 2 empty rows

    // Map column indices to nutrient codes for this sheet
    const colMapping = []; // { colIdx, code }
    for (let c = FOOD_COL_COUNT; c < headers.length; c++) {
      const header = headers[c];
      if (!header) continue;
      const code = columnHeaderToCode[header];
      if (code) {
        colMapping.push({ colIdx: c, code });
      }
    }

    if (colMapping.length === 0) {
      console.log(`  ${sheetName}: 0 mapped columns, skipping`);
      continue;
    }

    let sheetContentCount = 0;

    for (let rowIdx = 0; rowIdx < sheetDataRows.length; rowIdx++) {
      const row = sheetDataRows[rowIdx];
      const foodCode = row[0];
      if (!foodCode || !String(foodCode).trim()) continue;

      for (const { colIdx, code } of colMapping) {
        const value = parseValue(row[colIdx]);
        if (value === null) continue; // Skip null/N values

        pendingContent.push({
          food_code: String(foodCode).trim(),
          nutrient_code: code,
          value: value,
        });
        sheetContentCount++;
      }

      // Flush batch
      if (pendingContent.length >= CONTENT_BATCH_SIZE) {
        await sql`
          INSERT INTO source_cofid_content ${sql(pendingContent, 'food_code', 'nutrient_code', 'value')}
        `;
        contentCount += pendingContent.length;
        pendingContent = [];
      }
    }

    console.log(`  ${sheetName}: ${colMapping.length} nutrients, ${sheetContentCount} values`);
  }

  // Flush remaining
  if (pendingContent.length > 0) {
    await sql`
      INSERT INTO source_cofid_content ${sql(pendingContent, 'food_code', 'nutrient_code', 'value')}
    `;
    contentCount += pendingContent.length;
  }

  console.log(`\n  Total content rows: ${contentCount}`);

  // === Verify ===
  console.log('\n========================================');
  console.log('Import Summary');
  console.log('========================================');

  const [{ count: dbFoods }] = await sql`SELECT COUNT(*) as count FROM source_cofid_foods`;
  const [{ count: dbNutrients }] = await sql`SELECT COUNT(*) as count FROM source_cofid_nutrients`;
  const [{ count: dbContent }] = await sql`SELECT COUNT(*) as count FROM source_cofid_content`;

  console.log(`source_cofid_foods:     ${dbFoods} rows`);
  console.log(`source_cofid_nutrients:  ${dbNutrients} rows`);
  console.log(`source_cofid_content:   ${dbContent} rows`);

  // Sample data
  console.log('\n=== Sample Foods ===');
  const sampleFoods = await sql`SELECT food_code, name FROM source_cofid_foods LIMIT 5`;
  sampleFoods.forEach(f => console.log(`  ${f.food_code}: ${f.name}`));

  console.log('\n=== Sample Nutrients ===');
  const sampleNutrients = await sql`SELECT nutrient_code, name, unit FROM source_cofid_nutrients LIMIT 10`;
  sampleNutrients.forEach(n => console.log(`  ${n.nutrient_code}: ${n.name} (${n.unit})`));

  console.log('\n=== Sample Content ===');
  const sampleContent = await sql`
    SELECT c.food_code, f.name as food_name, c.nutrient_code, c.value
    FROM source_cofid_content c
    JOIN source_cofid_foods f ON f.food_code = c.food_code
    WHERE c.nutrient_code IN ('PROT', 'FAT', 'KCALS')
    LIMIT 10
  `;
  sampleContent.forEach(c => console.log(`  ${c.food_name}: ${c.nutrient_code} = ${c.value}`));

  await sql.end();
  console.log('\nImport complete!');
}

importData().catch(err => {
  console.error('\nImport failed:', err);
  process.exit(1);
});
