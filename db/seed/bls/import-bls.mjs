/**
 * German BLS (Bundeslebensmittelschlüssel) Import Script
 *
 * Imports BLS 4.0 data from Excel + nutrients.json into staging tables:
 * - source_bls_nutrients: Nutrient definitions with BLS codes
 * - source_bls_foods: Food items with English and German names
 * - source_bls_content: Nutrient values per food (long format)
 *
 * Data source: BLS_4_0_Daten_2025_DE.xlsx (single sheet, ~7,140 foods, 138 nutrients)
 *
 * Key design decisions:
 * - nutrient_code uses BLS text codes (WATER, PROT625, etc.)
 *   matching compound_sources.external_id
 * - Single wide-format sheet with triplet columns: (value, data origin, reference) per nutrient
 * - Column 0 = BLS Code (text), Column 1 = German name, Column 2 = English name
 * - For nutrient index i, value column = 3 + (i * 3)
 * - Sodium has code "nan" in nutrients.json → hardcoded fix to "NA"
 * - 7 trailing "nan" entries in nutrients.json are skipped
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
const DATA_DIR = join(__dirname, '..', '..', '..', 'data', 'bls');
const EXCEL_FILE = join(DATA_DIR, 'BLS_4_0_2025_DE', 'BLS_4_0_Daten_2025_DE.xlsx');
const NUTRIENTS_FILE = join(DATA_DIR, 'nutrients.json');

// Column layout
const COL_FOOD_CODE = 0;  // BLS Code (text, e.g., "C131000")
const COL_NAME_DE = 1;    // German name
const COL_NAME_EN = 2;    // English name
const NUTRIENT_START_COL = 3;  // First nutrient value column
const TRIPLET_SIZE = 3;   // Each nutrient has 3 columns: value, origin, reference

// Database connection
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 5,
});

/**
 * Parse a BLS cell value to a number
 * Empty/null → null
 * Numbers → parseFloat
 */
function parseValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;

  const s = String(val).trim();
  if (s === '' || s === '-') return null;

  // Handle European comma decimals (e.g., "12,5")
  const normalized = s.replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

/**
 * Import all BLS data
 */
async function importData() {
  console.log('========================================');
  console.log('German BLS 4.0 Import Script');
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
  const nutrientsRaw = JSON.parse(readFileSync(NUTRIENTS_FILE, 'utf-8'));
  console.log(`Loaded ${nutrientsRaw.length} raw nutrient definitions from nutrients.json`);

  // Filter out "nan" entries (7 trailing garbage rows) and fix Sodium code
  const nutrients = [];
  for (const n of nutrientsRaw) {
    // Skip entries where all fields are "nan"
    if (n.code === 'nan' && n.name_en === 'nan') {
      // Special case: Sodium has code "nan" but valid name_en "Sodium"
      if (n.name_en === 'Sodium') {
        nutrients.push({ ...n, code: 'NA' });
      }
      continue;
    }
    // Fix Sodium: code is "nan" but name_en is "Sodium"
    if (n.code === 'nan' && n.name_en === 'Sodium') {
      nutrients.push({ ...n, code: 'NA' });
      continue;
    }
    nutrients.push(n);
  }
  console.log(`Valid nutrients after filtering: ${nutrients.length}`);

  // Load Excel
  console.log(`\nReading ${EXCEL_FILE}...`);
  const workbook = xlsx.readFile(EXCEL_FILE);
  console.log(`Found ${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(', ')}`);

  // Use the first (and only) sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
  console.log(`Sheet "${sheetName}": ${rows.length} rows, ${rows[0]?.length || 0} columns`);

  // First row is headers
  const headers = rows[0];
  const dataRows = rows.slice(1);
  console.log(`Headers: ${headers.length} columns`);
  console.log(`Data rows: ${dataRows.length}`);

  // === STEP 1: Import Nutrients ===
  console.log('\n=== Step 1: Importing Nutrients ===');
  await sql`TRUNCATE source_bls_nutrients CASCADE`;

  const nutrientRecords = nutrients.map(n => ({
    nutrient_code: n.code,
    name: n.name_en,
    unit: n.unit || 'unknown',
  }));

  // Insert nutrients in batches
  for (let i = 0; i < nutrientRecords.length; i += BATCH_SIZE) {
    const batch = nutrientRecords.slice(i, i + BATCH_SIZE);
    await sql`
      INSERT INTO source_bls_nutrients ${sql(batch,
        'nutrient_code', 'name', 'unit'
      )}
    `;
  }
  console.log(`  Imported ${nutrientRecords.length} nutrients`);

  // === STEP 2: Import Foods ===
  console.log('\n=== Step 2: Importing Foods ===');
  await sql`TRUNCATE source_bls_foods CASCADE`;

  let foodCount = 0;
  const foodBatch = [];

  for (const row of dataRows) {
    const foodCode = row[COL_FOOD_CODE];
    const nameEn = row[COL_NAME_EN];

    if (!foodCode || !nameEn) continue;

    const code = String(foodCode).trim();
    if (!code) continue;

    foodBatch.push({
      food_code: code,
      name: String(nameEn).trim(),
      name_de: row[COL_NAME_DE] ? String(row[COL_NAME_DE]).trim() : null,
    });

    if (foodBatch.length >= BATCH_SIZE) {
      await sql`
        INSERT INTO source_bls_foods ${sql(foodBatch,
          'food_code', 'name', 'name_de'
        )}
        ON CONFLICT (food_code) DO UPDATE SET name = EXCLUDED.name
      `;
      foodCount += foodBatch.length;
      foodBatch.length = 0;
      process.stdout.write(`\r  Imported ${foodCount} foods`);
    }
  }

  // Flush remaining
  if (foodBatch.length > 0) {
    await sql`
      INSERT INTO source_bls_foods ${sql(foodBatch,
        'food_code', 'name', 'name_de'
      )}
      ON CONFLICT (food_code) DO UPDATE SET name = EXCLUDED.name
    `;
    foodCount += foodBatch.length;
  }
  console.log(`\r  Imported ${foodCount} foods`);

  // === STEP 3: Import Content (nutrient values) ===
  console.log('\n=== Step 3: Importing Nutrient Content ===');
  await sql`TRUNCATE source_bls_content`;

  // Build nutrient index-to-code mapping
  // For nutrient index i, value column = NUTRIENT_START_COL + (i * TRIPLET_SIZE)
  const nutrientIndexToCode = {};
  for (let i = 0; i < nutrients.length; i++) {
    nutrientIndexToCode[i] = nutrients[i].code;
  }
  console.log(`  Mapped ${Object.keys(nutrientIndexToCode).length} nutrient columns`);

  let contentCount = 0;
  let pendingContent = [];

  for (const row of dataRows) {
    const foodCode = row[COL_FOOD_CODE];
    if (!foodCode) continue;

    const code = String(foodCode).trim();
    if (!code) continue;

    for (let i = 0; i < nutrients.length; i++) {
      const valueCol = NUTRIENT_START_COL + (i * TRIPLET_SIZE);
      const value = parseValue(row[valueCol]);
      if (value === null) continue;

      pendingContent.push({
        food_code: code,
        nutrient_code: nutrientIndexToCode[i],
        value: value,
      });
    }

    // Flush batch
    if (pendingContent.length >= CONTENT_BATCH_SIZE) {
      await sql`
        INSERT INTO source_bls_content ${sql(pendingContent, 'food_code', 'nutrient_code', 'value')}
      `;
      contentCount += pendingContent.length;
      pendingContent = [];
      process.stdout.write(`\r  Imported ${contentCount} content rows`);
    }
  }

  // Flush remaining
  if (pendingContent.length > 0) {
    await sql`
      INSERT INTO source_bls_content ${sql(pendingContent, 'food_code', 'nutrient_code', 'value')}
    `;
    contentCount += pendingContent.length;
  }
  console.log(`\r  Imported ${contentCount} content rows`);

  // === Verify ===
  console.log('\n========================================');
  console.log('Import Summary');
  console.log('========================================');

  const [{ count: dbFoods }] = await sql`SELECT COUNT(*) as count FROM source_bls_foods`;
  const [{ count: dbNutrients }] = await sql`SELECT COUNT(*) as count FROM source_bls_nutrients`;
  const [{ count: dbContent }] = await sql`SELECT COUNT(*) as count FROM source_bls_content`;

  console.log(`source_bls_foods:       ${dbFoods} rows`);
  console.log(`source_bls_nutrients:    ${dbNutrients} rows`);
  console.log(`source_bls_content:     ${dbContent} rows`);

  // Sample data
  console.log('\n=== Sample Foods ===');
  const sampleFoods = await sql`SELECT food_code, name, name_de FROM source_bls_foods LIMIT 5`;
  sampleFoods.forEach(f => console.log(`  ${f.food_code}: ${f.name} [${f.name_de}]`));

  console.log('\n=== Sample Nutrients ===');
  const sampleNutrients = await sql`SELECT nutrient_code, name, unit FROM source_bls_nutrients LIMIT 10`;
  sampleNutrients.forEach(n => console.log(`  ${n.nutrient_code}: ${n.name} (${n.unit})`));

  console.log('\n=== Sample Content ===');
  const sampleContent = await sql`
    SELECT c.food_code, f.name as food_name, c.nutrient_code, n.name as nutrient_name, c.value
    FROM source_bls_content c
    JOIN source_bls_foods f ON f.food_code = c.food_code
    JOIN source_bls_nutrients n ON n.nutrient_code = c.nutrient_code
    WHERE c.nutrient_code IN ('WATER', 'ENERCC', 'PROT625')
    LIMIT 10
  `;
  sampleContent.forEach(c => console.log(`  ${c.food_name}: ${c.nutrient_name} = ${c.value}`));

  await sql.end();
  console.log('\nImport complete!');
}

importData().catch(err => {
  console.error('\nImport failed:', err);
  process.exit(1);
});
