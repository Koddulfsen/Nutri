/**
 * Danish FRIDA (Fødevaredatabanken) Import Script
 *
 * Imports FRIDA 5.4 data from Excel + nutrients.json into staging tables:
 * - source_frida_nutrients: Nutrient definitions with EuroFIR codes
 * - source_frida_foods: Food items with English and Danish names
 * - source_frida_content: Nutrient values per food (long format)
 *
 * Data source: Frida_Dataset_May2025.xlsx (Data_Normalised sheet, ~137K rows)
 *
 * Key design decisions:
 * - food_id and nutrient_id are integers (FRIDA's native format)
 * - eurofir_code stored in nutrients table for compound_sources join
 * - Data is already in long format — each row is a (food, nutrient, value) tuple
 * - Sodium (id 201) has eurofir: null → hardcoded fix to "NA"
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
const DATA_DIR = join(__dirname, '..', '..', '..', 'data', 'frida');
const EXCEL_FILE = join(DATA_DIR, 'Frida_Dataset_May2025.xlsx');
const NUTRIENTS_FILE = join(DATA_DIR, 'nutrients.json');

// Data_Normalised column indices
const COL_FOOD_ID = 0;       // FoodID (integer)
const COL_NAME_DK = 1;       // FødevareNavn (Danish name)
const COL_NAME_EN = 2;       // FoodName (English name)
const COL_NUTRIENT_ID = 3;   // ParameterID (integer)
const COL_RES_VAL = 7;       // ResVal (result value)

// Database connection
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 5,
});

/**
 * Parse a FRIDA cell value to a number
 */
function parseValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;

  const s = String(val).trim();
  if (s === '' || s === '-' || s === 'N/A') return null;

  // Handle European comma decimals
  const normalized = s.replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

/**
 * Import all FRIDA data
 */
async function importData() {
  console.log('========================================');
  console.log('Danish FRIDA 5.4 Import Script');
  console.log('========================================');

  if (!existsSync(EXCEL_FILE)) {
    console.error(`Missing file: ${EXCEL_FILE}`);
    process.exit(1);
  }
  if (!existsSync(NUTRIENTS_FILE)) {
    console.error(`Missing file: ${NUTRIENTS_FILE}`);
    process.exit(1);
  }

  // === STEP 1: Import Nutrients ===
  console.log('\n=== Step 1: Importing Nutrients ===');

  const nutrientsRaw = JSON.parse(readFileSync(NUTRIENTS_FILE, 'utf-8'));
  console.log(`Loaded ${nutrientsRaw.length} nutrient definitions from nutrients.json`);

  // Fix Sodium: id 201 has eurofir: null → hardcode to "NA"
  const nutrients = nutrientsRaw.map(n => {
    if (n.id === 201 && n.eurofir === null) {
      return { ...n, eurofir: 'NA' };
    }
    return n;
  });

  await sql`TRUNCATE source_frida_nutrients CASCADE`;

  const nutrientRecords = nutrients.map(n => ({
    nutrient_id: n.id,
    name: n.name_en,
    unit: n.unit || 'unknown',
    eurofir_code: n.eurofir || null,
  }));

  for (let i = 0; i < nutrientRecords.length; i += BATCH_SIZE) {
    const batch = nutrientRecords.slice(i, i + BATCH_SIZE);
    await sql`
      INSERT INTO source_frida_nutrients ${sql(batch,
        'nutrient_id', 'name', 'unit', 'eurofir_code'
      )}
    `;
  }
  console.log(`  Imported ${nutrientRecords.length} nutrients`);

  // === STEP 2: Load Excel Data_Normalised sheet ===
  console.log('\n=== Step 2: Loading Excel (Data_Normalised) ===');

  const workbook = xlsx.readFile(EXCEL_FILE);
  console.log(`Found ${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(', ')}`);

  const sheetName = 'Data_Normalised';
  if (!workbook.SheetNames.includes(sheetName)) {
    console.error(`Sheet "${sheetName}" not found! Available: ${workbook.SheetNames.join(', ')}`);
    process.exit(1);
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
  console.log(`Sheet "${sheetName}": ${rows.length} rows, ${rows[0]?.length || 0} columns`);

  // First row is headers
  const headers = rows[0];
  const dataRows = rows.slice(1);
  console.log(`Headers: ${headers?.join(', ')}`);
  console.log(`Data rows: ${dataRows.length}`);

  // === STEP 3: Extract unique foods ===
  console.log('\n=== Step 3: Importing Foods ===');
  await sql`TRUNCATE source_frida_foods CASCADE`;

  // Build unique foods map from data rows
  const foodsMap = new Map(); // foodId -> { name, nameDk }
  for (const row of dataRows) {
    const foodId = row[COL_FOOD_ID];
    if (foodId === null || foodId === undefined) continue;
    const id = parseInt(String(foodId), 10);
    if (isNaN(id)) continue;

    if (!foodsMap.has(id)) {
      const nameEn = row[COL_NAME_EN] ? String(row[COL_NAME_EN]).trim() : null;
      const nameDk = row[COL_NAME_DK] ? String(row[COL_NAME_DK]).trim() : null;
      if (nameEn) {
        foodsMap.set(id, { name: nameEn, nameDk });
      }
    }
  }

  console.log(`  Found ${foodsMap.size} unique foods`);

  // Insert foods in batches
  const foodEntries = Array.from(foodsMap.entries());
  let foodCount = 0;

  for (let i = 0; i < foodEntries.length; i += BATCH_SIZE) {
    const batch = foodEntries.slice(i, i + BATCH_SIZE).map(([foodId, data]) => ({
      food_id: foodId,
      name: data.name,
      name_dk: data.nameDk,
    }));

    await sql`
      INSERT INTO source_frida_foods ${sql(batch,
        'food_id', 'name', 'name_dk'
      )}
      ON CONFLICT (food_id) DO UPDATE SET name = EXCLUDED.name
    `;
    foodCount += batch.length;
    process.stdout.write(`\r  Imported ${foodCount} foods`);
  }
  console.log(`\r  Imported ${foodCount} foods`);

  // === STEP 4: Import Content (nutrient values) ===
  console.log('\n=== Step 4: Importing Nutrient Content ===');
  await sql`TRUNCATE source_frida_content`;

  // Build valid nutrient IDs set for validation
  const validNutrientIds = new Set(nutrients.map(n => n.id));

  let contentCount = 0;
  let pendingContent = [];
  let skippedNull = 0;

  for (const row of dataRows) {
    const foodId = row[COL_FOOD_ID];
    const nutrientId = row[COL_NUTRIENT_ID];
    const resVal = row[COL_RES_VAL];

    if (foodId === null || foodId === undefined) continue;
    if (nutrientId === null || nutrientId === undefined) continue;

    const fid = parseInt(String(foodId), 10);
    const nid = parseInt(String(nutrientId), 10);
    if (isNaN(fid) || isNaN(nid)) continue;

    const value = parseValue(resVal);
    if (value === null) {
      skippedNull++;
      continue;
    }

    pendingContent.push({
      food_id: fid,
      nutrient_id: nid,
      value: value,
    });

    // Flush batch
    if (pendingContent.length >= CONTENT_BATCH_SIZE) {
      await sql`
        INSERT INTO source_frida_content ${sql(pendingContent, 'food_id', 'nutrient_id', 'value')}
      `;
      contentCount += pendingContent.length;
      pendingContent = [];
      process.stdout.write(`\r  Imported ${contentCount} content rows`);
    }
  }

  // Flush remaining
  if (pendingContent.length > 0) {
    await sql`
      INSERT INTO source_frida_content ${sql(pendingContent, 'food_id', 'nutrient_id', 'value')}
    `;
    contentCount += pendingContent.length;
  }
  console.log(`\r  Imported ${contentCount} content rows`);
  console.log(`  Skipped ${skippedNull} null/empty values`);

  // === Verify ===
  console.log('\n========================================');
  console.log('Import Summary');
  console.log('========================================');

  const [{ count: dbFoods }] = await sql`SELECT COUNT(*) as count FROM source_frida_foods`;
  const [{ count: dbNutrients }] = await sql`SELECT COUNT(*) as count FROM source_frida_nutrients`;
  const [{ count: dbContent }] = await sql`SELECT COUNT(*) as count FROM source_frida_content`;

  console.log(`source_frida_foods:       ${dbFoods} rows`);
  console.log(`source_frida_nutrients:    ${dbNutrients} rows`);
  console.log(`source_frida_content:     ${dbContent} rows`);

  // Sample data
  console.log('\n=== Sample Foods ===');
  const sampleFoods = await sql`SELECT food_id, name, name_dk FROM source_frida_foods LIMIT 5`;
  sampleFoods.forEach(f => console.log(`  ${f.food_id}: ${f.name} [${f.name_dk}]`));

  console.log('\n=== Sample Nutrients ===');
  const sampleNutrients = await sql`SELECT nutrient_id, name, unit, eurofir_code FROM source_frida_nutrients LIMIT 10`;
  sampleNutrients.forEach(n => console.log(`  ${n.nutrient_id}: ${n.name} (${n.unit}) [${n.eurofir_code}]`));

  console.log('\n=== Sample Content ===');
  const sampleContent = await sql`
    SELECT c.food_id, f.name as food_name, c.nutrient_id, n.name as nutrient_name, c.value
    FROM source_frida_content c
    JOIN source_frida_foods f ON f.food_id = c.food_id
    JOIN source_frida_nutrients n ON n.nutrient_id = c.nutrient_id
    WHERE n.eurofir_code IN ('WATER', 'PROT', 'FAT')
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
