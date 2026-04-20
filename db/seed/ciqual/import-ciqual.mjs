/**
 * French CIQUAL Food Composition Database Import Script
 *
 * Imports CIQUAL 2025 data from Excel + nutrients.json into staging tables:
 * - source_ciqual_nutrients: Nutrient definitions with CIQUAL codes
 * - source_ciqual_foods: Food items with metadata
 * - source_ciqual_content: Nutrient values per food (long format)
 *
 * Data source: ciqual-2025-en.xlsx (single sheet, ~3,484 foods, 65 nutrients)
 *
 * Key design decisions:
 * - nutrient_code uses CIQUAL integer codes as strings ("327", "400", etc.)
 *   matching compound_sources.external_id
 * - Single wide-format sheet: cols 0-8 = metadata, cols 9-82 = nutrients
 * - Values: "-" or empty = no data (null), "< X" / "traces" = trace → 0
 * - Column 83 (Jones factor) is skipped
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
const DATA_DIR = join(__dirname, '..', '..', '..', 'data', 'ciqual');
const EXCEL_FILE = join(DATA_DIR, 'ciqual-2025-en.xlsx');
const NUTRIENTS_FILE = join(DATA_DIR, 'nutrients.json');

// Metadata columns in the Excel sheet
// 0: alim_grp_code, 1: alim_ssgrp_code, 2: alim_ssssgrp_code
// 3: alim_grp_nom_eng, 4: alim_ssgrp_nom_eng, 5: alim_ssssgrp_nom_eng
// 6: alim_code, 7: alim_nom_eng, 8: alim_nom_sci
const COL_FOOD_GROUP = 3;
const COL_FOOD_ID = 6;
const COL_FOOD_NAME = 7;
const COL_FOOD_SCI = 8;
const NUTRIENT_START_COL = 9;

// Database connection
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 5,
});

/**
 * Parse a CIQUAL cell value to a number
 * "-" = no data → null
 * "" or null → null
 * "< X" = less than X → 0 (trace)
 * "traces" = trace → 0
 * Numbers (including comma decimals) → parsed float
 */
function parseValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;

  const s = String(val).trim();
  if (s === '' || s === '-') return null;
  if (s === 'traces' || s === 'Traces') return 0;
  if (s.startsWith('<') || s.startsWith('< ')) return 0;

  // Handle European comma decimals (e.g., "12,5")
  const normalized = s.replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

/**
 * Import all CIQUAL data
 */
async function importData() {
  console.log('========================================');
  console.log('French CIQUAL Import Script');
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
  console.log(`Found ${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(', ')}`);

  // Use the first sheet (food composition)
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
  console.log(`Sheet "${sheetName}": ${rows.length} rows`);

  // First row is headers
  const headers = rows[0];
  const dataRows = rows.slice(1);
  console.log(`Headers: ${headers.length} columns`);
  console.log(`Data rows: ${dataRows.length}`);

  // === STEP 1: Import Nutrients ===
  console.log('\n=== Step 1: Importing Nutrients ===');
  await sql`TRUNCATE source_ciqual_nutrients CASCADE`;

  // Map nutrients from JSON - these are in order matching Excel columns 9+
  const nutrientRecords = [];
  for (const nutrient of nutrientsJson) {
    nutrientRecords.push({
      nutrient_code: String(nutrient.id),
      name: nutrient.name,
      unit: nutrient.unit || 'unknown',
    });
  }

  // Insert nutrients in batches
  for (let i = 0; i < nutrientRecords.length; i += BATCH_SIZE) {
    const batch = nutrientRecords.slice(i, i + BATCH_SIZE);
    await sql`
      INSERT INTO source_ciqual_nutrients ${sql(batch,
        'nutrient_code', 'name', 'unit'
      )}
    `;
  }
  console.log(`  Imported ${nutrientRecords.length} nutrients`);

  // === STEP 2: Import Foods ===
  console.log('\n=== Step 2: Importing Foods ===');
  await sql`TRUNCATE source_ciqual_foods CASCADE`;

  let foodCount = 0;
  const foodBatch = [];

  for (const row of dataRows) {
    const foodId = row[COL_FOOD_ID];
    const name = row[COL_FOOD_NAME];

    if (!foodId || !name) continue;

    const parsedFoodId = parseInt(String(foodId), 10);
    if (isNaN(parsedFoodId)) continue;

    foodBatch.push({
      food_id: parsedFoodId,
      name: String(name).trim(),
      description: row[COL_FOOD_SCI] ? String(row[COL_FOOD_SCI]).trim() : null,
      food_group: row[COL_FOOD_GROUP] ? String(row[COL_FOOD_GROUP]).trim() : null,
    });

    if (foodBatch.length >= BATCH_SIZE) {
      await sql`
        INSERT INTO source_ciqual_foods ${sql(foodBatch,
          'food_id', 'name', 'description', 'food_group'
        )}
        ON CONFLICT (food_id) DO UPDATE SET name = EXCLUDED.name
      `;
      foodCount += foodBatch.length;
      foodBatch.length = 0;
      process.stdout.write(`\r  Imported ${foodCount} foods`);
    }
  }

  // Flush remaining
  if (foodBatch.length > 0) {
    await sql`
      INSERT INTO source_ciqual_foods ${sql(foodBatch,
        'food_id', 'name', 'description', 'food_group'
      )}
      ON CONFLICT (food_id) DO UPDATE SET name = EXCLUDED.name
    `;
    foodCount += foodBatch.length;
  }
  console.log(`\r  Imported ${foodCount} foods`);

  // === STEP 3: Import Content (nutrient values) ===
  console.log('\n=== Step 3: Importing Nutrient Content ===');
  await sql`TRUNCATE source_ciqual_content`;

  // Build column-to-nutrient mapping
  // nutrients.json entries are in the same order as Excel columns starting at col 9
  // But we need to verify by checking headers match nutrient names
  // The Excel header row has nutrient names that should correspond to nutrients.json order
  const colToNutrientCode = {};
  for (let i = 0; i < nutrientsJson.length; i++) {
    const colIdx = NUTRIENT_START_COL + i;
    if (colIdx < headers.length) {
      colToNutrientCode[colIdx] = String(nutrientsJson[i].id);
    }
  }

  console.log(`  Mapped ${Object.keys(colToNutrientCode).length} nutrient columns`);

  let contentCount = 0;
  let pendingContent = [];

  for (const row of dataRows) {
    const foodId = row[COL_FOOD_ID];
    if (!foodId) continue;

    const parsedFoodId = parseInt(String(foodId), 10);
    if (isNaN(parsedFoodId)) continue;

    for (const [colIdxStr, nutrientCode] of Object.entries(colToNutrientCode)) {
      const colIdx = parseInt(colIdxStr, 10);
      const value = parseValue(row[colIdx]);
      if (value === null) continue;

      pendingContent.push({
        food_id: parsedFoodId,
        nutrient_code: nutrientCode,
        value: value,
      });
    }

    // Flush batch
    if (pendingContent.length >= CONTENT_BATCH_SIZE) {
      await sql`
        INSERT INTO source_ciqual_content ${sql(pendingContent, 'food_id', 'nutrient_code', 'value')}
      `;
      contentCount += pendingContent.length;
      pendingContent = [];
      process.stdout.write(`\r  Imported ${contentCount} content rows`);
    }
  }

  // Flush remaining
  if (pendingContent.length > 0) {
    await sql`
      INSERT INTO source_ciqual_content ${sql(pendingContent, 'food_id', 'nutrient_code', 'value')}
    `;
    contentCount += pendingContent.length;
  }
  console.log(`\r  Imported ${contentCount} content rows`);

  // === Verify ===
  console.log('\n========================================');
  console.log('Import Summary');
  console.log('========================================');

  const [{ count: dbFoods }] = await sql`SELECT COUNT(*) as count FROM source_ciqual_foods`;
  const [{ count: dbNutrients }] = await sql`SELECT COUNT(*) as count FROM source_ciqual_nutrients`;
  const [{ count: dbContent }] = await sql`SELECT COUNT(*) as count FROM source_ciqual_content`;

  console.log(`source_ciqual_foods:     ${dbFoods} rows`);
  console.log(`source_ciqual_nutrients:  ${dbNutrients} rows`);
  console.log(`source_ciqual_content:   ${dbContent} rows`);

  // Sample data
  console.log('\n=== Sample Foods ===');
  const sampleFoods = await sql`SELECT food_id, name, food_group FROM source_ciqual_foods LIMIT 5`;
  sampleFoods.forEach(f => console.log(`  ${f.food_id}: ${f.name} [${f.food_group}]`));

  console.log('\n=== Sample Nutrients ===');
  const sampleNutrients = await sql`SELECT nutrient_code, name, unit FROM source_ciqual_nutrients LIMIT 10`;
  sampleNutrients.forEach(n => console.log(`  ${n.nutrient_code}: ${n.name} (${n.unit})`));

  console.log('\n=== Sample Content ===');
  const sampleContent = await sql`
    SELECT c.food_id, f.name as food_name, c.nutrient_code, n.name as nutrient_name, c.value
    FROM source_ciqual_content c
    JOIN source_ciqual_foods f ON f.food_id = c.food_id
    JOIN source_ciqual_nutrients n ON n.nutrient_code = c.nutrient_code
    WHERE c.nutrient_code IN ('328', '25000', '40000')
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
