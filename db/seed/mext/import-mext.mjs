/**
 * MEXT (Japanese Standard Tables of Food Composition) Import Script
 *
 * Imports MEXT 8th Edition data from 3 Excel files into staging tables:
 * - source_mext_foods: Food items with Japanese names
 * - source_mext_nutrients: Nutrient definitions with INFOODS codes
 * - source_mext_content: Nutrient values per food (long format, pivoted from wide)
 *
 * Data source: 3 Excel files in data/mext/
 *   - main_composition.xlsx (~2,478 foods × 56 nutrients)
 *   - amino_acids_1.xlsx (~1,954 foods × 24 amino acids)
 *   - fatty_acids_1.xlsx (~1,918 foods × 48 fatty acids)
 *
 * Structure per file:
 *   - Main: row 11 = INFOODS codes, row 10 = units, row 12+ = data
 *   - Amino: row 4 = INFOODS codes, row 5 = units, row 6+ = data
 *   - Fatty: row 3 = INFOODS codes, row 4 = units, row 5+ = data
 *
 * Special value markers:
 *   - (value) = estimated → strip parens, parse number
 *   - Tr = trace → 0
 *   - - = missing → skip
 *   - * = not applicable → skip
 */

import xlsx from 'xlsx';
import postgres from 'postgres';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration
const BATCH_SIZE = 100;
const CONTENT_BATCH_SIZE = 1000;
const DATA_DIR = join(__dirname, '../../../data/mext');
const MAIN_FILE = join(DATA_DIR, 'main_composition.xlsx');
const AMINO_FILE = join(DATA_DIR, 'amino_acids_1.xlsx');
const FATTY_FILE = join(DATA_DIR, 'fatty_acids_1.xlsx');

// Database connection
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 5,
});

/**
 * Parse a MEXT cell value, handling special markers
 * Returns a number or null (skip)
 */
function parseValue(raw) {
  if (raw === null || raw === undefined || raw === '') return null;

  // Numeric values pass through directly
  if (typeof raw === 'number') {
    return isNaN(raw) ? null : raw;
  }

  const str = String(raw).trim();

  // Skip markers
  if (str === '-' || str === '*' || str === '…' || str === '') return null;

  // Trace = 0
  if (str === 'Tr' || str === 'tr' || str === '(Tr)' || str === '(tr)') return 0;

  // Estimated value in parens: "(550)" → 550
  const parenMatch = str.match(/^\((.+)\)$/);
  if (parenMatch) {
    const inner = parenMatch[1].trim();
    if (inner === 'Tr' || inner === 'tr') return 0;
    const num = parseFloat(inner);
    return isNaN(num) ? null : num;
  }

  // Plain string number: "48.0"
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

/**
 * Extract food group name from the food group code
 * MEXT uses numeric group codes in column 0
 */
const FOOD_GROUPS = {
  '01': 'Cereals',
  '02': 'Potatoes and starches',
  '03': 'Sugars and sweeteners',
  '04': 'Pulses',
  '05': 'Nuts and seeds',
  '06': 'Vegetables',
  '07': 'Fruits',
  '08': 'Mushrooms',
  '09': 'Algae',
  '10': 'Fish and shellfish',
  '11': 'Meat',
  '12': 'Eggs',
  '13': 'Dairy products',
  '14': 'Fats and oils',
  '15': 'Confectioneries',
  '16': 'Beverages',
  '17': 'Seasonings and spices',
  '18': 'Prepared foods',
};

/**
 * Process a single Excel file and extract nutrients + content
 */
function processFile(filePath, config) {
  console.log(`\nReading ${filePath}...`);
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // First sheet is the combined table
  const sheet = workbook.Sheets[sheetName];
  const allRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

  console.log(`  Sheet: "${sheetName}", Total rows: ${allRows.length}`);

  const codeRow = allRows[config.codeRowIdx];
  const unitRow = allRows[config.unitRowIdx];
  const dataStartIdx = config.dataStartIdx;

  // Extract nutrient definitions from this file
  const nutrients = [];
  for (let col = config.nutrientStartCol; col < codeRow.length; col++) {
    const code = codeRow[col];
    if (!code || String(code).trim() === '') continue;

    const codeStr = String(code).trim();
    const unit = unitRow && unitRow[col] ? String(unitRow[col]).trim() : '';

    // Clean up unit - extract from parentheses if needed
    let cleanUnit = unit;
    const unitMatch = unit.match(/\(([^)]+)\)/);
    if (unitMatch) cleanUnit = unitMatch[1];
    // Remove "/100g" suffix
    cleanUnit = cleanUnit.replace(/\/100\s*g/i, '').trim();
    if (!cleanUnit) cleanUnit = 'g';

    nutrients.push({
      code: codeStr,
      name: codeStr, // Use code as name (Japanese names are in different rows)
      unit: cleanUnit,
      col: col,
    });
  }

  console.log(`  Found ${nutrients.length} nutrient columns`);

  // Extract food data and content rows
  const foods = [];
  const content = [];

  for (let rowIdx = dataStartIdx; rowIdx < allRows.length; rowIdx++) {
    const row = allRows[rowIdx];
    if (!row) continue;

    // Food ID is in column 1 (5-digit text, e.g., "01001")
    const rawFoodId = row[1];
    if (!rawFoodId) continue;

    const foodId = String(rawFoodId).trim().padStart(5, '0');
    // Skip non-food rows (headers, subtotals, etc.)
    if (!/^\d{5}$/.test(foodId)) continue;

    // Food name is in column 3
    const foodName = row[3] ? String(row[3]).trim() : null;

    // Food group from first 2 digits of food ID
    const groupCode = foodId.substring(0, 2);
    const foodGroup = FOOD_GROUPS[groupCode] || null;

    // Only collect food info from main composition file
    if (config.collectFoods && foodName) {
      foods.push({
        food_id: foodId,
        name: foodName,
        food_group: foodGroup,
      });
    }

    // Extract nutrient values (pivot wide → long)
    for (const nutrient of nutrients) {
      const rawVal = row[nutrient.col];
      const value = parseValue(rawVal);
      if (value !== null) {
        content.push({
          food_id: foodId,
          nutrient_code: nutrient.code,
          value: value,
        });
      }
    }
  }

  console.log(`  Foods: ${foods.length}, Content rows: ${content.length}`);
  return { nutrients, foods, content };
}

/**
 * Main import function
 */
async function importData() {
  console.log('========================================');
  console.log('MEXT Import Script');
  console.log('Japanese Standard Tables of Food Composition (8th Edition)');
  console.log('========================================');

  // Verify files exist
  for (const file of [MAIN_FILE, AMINO_FILE, FATTY_FILE]) {
    if (!existsSync(file)) {
      console.error(`Missing file: ${file}`);
      process.exit(1);
    }
  }

  // Process all 3 files
  const mainResult = processFile(MAIN_FILE, {
    codeRowIdx: 11,
    unitRowIdx: 10,
    dataStartIdx: 12,
    nutrientStartCol: 4, // Columns 0-3 are food info
    collectFoods: true,
  });

  const aminoResult = processFile(AMINO_FILE, {
    codeRowIdx: 4,
    unitRowIdx: 5,
    dataStartIdx: 6,
    nutrientStartCol: 7, // Columns 0-6 are food info + protein refs
    collectFoods: false,
  });

  const fattyResult = processFile(FATTY_FILE, {
    codeRowIdx: 3,
    unitRowIdx: 4,
    dataStartIdx: 5,
    nutrientStartCol: 7, // Columns 0-6 are food info + fat refs
    collectFoods: false,
  });

  // Merge nutrient definitions (deduplicate by code)
  const nutrientMap = new Map();
  for (const n of [...mainResult.nutrients, ...aminoResult.nutrients, ...fattyResult.nutrients]) {
    if (!nutrientMap.has(n.code)) {
      nutrientMap.set(n.code, { nutrient_code: n.code, name: n.name, unit: n.unit });
    }
  }
  const allNutrients = [...nutrientMap.values()];
  console.log(`\nTotal unique nutrients: ${allNutrients.length}`);

  // Merge all content
  const allContent = [...mainResult.content, ...aminoResult.content, ...fattyResult.content];
  console.log(`Total content rows: ${allContent.length}`);

  // === STEP 1: Import Nutrients ===
  console.log('\n=== Importing Nutrients ===');
  await sql`TRUNCATE source_mext_nutrients CASCADE`;

  for (let i = 0; i < allNutrients.length; i += BATCH_SIZE) {
    const batch = allNutrients.slice(i, i + BATCH_SIZE);
    await sql`
      INSERT INTO source_mext_nutrients ${sql(batch, 'nutrient_code', 'name', 'unit')}
      ON CONFLICT (nutrient_code) DO NOTHING
    `;
  }
  console.log(`  Imported ${allNutrients.length} nutrients`);

  // === STEP 2: Import Foods ===
  console.log('\n=== Importing Foods ===');
  await sql`TRUNCATE source_mext_foods CASCADE`;

  let foodCount = 0;
  for (let i = 0; i < mainResult.foods.length; i += BATCH_SIZE) {
    const batch = mainResult.foods.slice(i, i + BATCH_SIZE);
    if (batch.length > 0) {
      await sql`
        INSERT INTO source_mext_foods ${sql(batch, 'food_id', 'name', 'food_group')}
        ON CONFLICT (food_id) DO UPDATE SET name = EXCLUDED.name
      `;
      foodCount += batch.length;
    }
    process.stdout.write(`\r  Imported ${foodCount} foods`);
  }
  console.log('');

  // === STEP 3: Import Content (nutrient values) ===
  console.log('\n=== Importing Nutrient Content ===');
  await sql`TRUNCATE source_mext_content`;

  let contentCount = 0;
  for (let i = 0; i < allContent.length; i += CONTENT_BATCH_SIZE) {
    const batch = allContent.slice(i, i + CONTENT_BATCH_SIZE);
    await sql`
      INSERT INTO source_mext_content ${sql(batch, 'food_id', 'nutrient_code', 'value')}
    `;
    contentCount += batch.length;
    process.stdout.write(`\r  Imported ${contentCount}/${allContent.length} content rows`);
  }
  console.log('');

  // === Verify ===
  console.log('\n========================================');
  console.log('Import Summary');
  console.log('========================================');

  const [{ count: dbFoods }] = await sql`SELECT COUNT(*) as count FROM source_mext_foods`;
  const [{ count: dbNutrients }] = await sql`SELECT COUNT(*) as count FROM source_mext_nutrients`;
  const [{ count: dbContent }] = await sql`SELECT COUNT(*) as count FROM source_mext_content`;

  console.log(`source_mext_foods:     ${dbFoods} rows`);
  console.log(`source_mext_nutrients: ${dbNutrients} rows`);
  console.log(`source_mext_content:   ${dbContent} rows`);

  // Sample data
  console.log('\n=== Sample Foods ===');
  const sampleFoods = await sql`SELECT food_id, name, food_group FROM source_mext_foods LIMIT 5`;
  sampleFoods.forEach(f => console.log(`  ${f.food_id}: ${f.name} (${f.food_group})`));

  console.log('\n=== Sample Nutrients ===');
  const sampleNutrients = await sql`SELECT nutrient_code, name, unit FROM source_mext_nutrients LIMIT 10`;
  sampleNutrients.forEach(n => console.log(`  ${n.nutrient_code} (${n.unit})`));

  console.log('\n=== Content per file ===');
  const mainCodes = new Set(mainResult.nutrients.map(n => n.code));
  const aminoCodes = new Set(aminoResult.nutrients.map(n => n.code));
  const fattyCodes = new Set(fattyResult.nutrients.map(n => n.code));
  console.log(`  Main composition: ${mainResult.content.length} rows (${mainCodes.size} nutrients)`);
  console.log(`  Amino acids: ${aminoResult.content.length} rows (${aminoCodes.size} nutrients)`);
  console.log(`  Fatty acids: ${fattyResult.content.length} rows (${fattyCodes.size} nutrients)`);

  await sql.end();
  console.log('\nImport complete!');
}

importData().catch(err => {
  console.error('\nImport failed:', err);
  process.exit(1);
});
