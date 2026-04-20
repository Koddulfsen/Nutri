/**
 * INDB (Indian Nutrient Database) Import Script
 *
 * Imports INDB data from INDB.xlsx into staging tables.
 * Strategy:
 *   1. Read nutrient definitions from nutrients.json (first 39 entries before servings_unit)
 *   2. Parse INDB.xlsx sheet "Nutrient Data" — 1,014 foods with 39 nutrient columns
 *   3. Pivot wide nutrient columns into long format content rows
 *   4. Batch insert into source_indb_foods, source_indb_nutrients, source_indb_content
 *
 * Usage: npx tsx db/seed/indb/import-indb.mjs
 *   or:  node db/seed/indb/import-indb.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import postgres from 'postgres';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONTENT_BATCH_SIZE = 1000;
const FOOD_BATCH_SIZE = 100;
const DATA_DIR = join(__dirname, '../../../data/indb');
const XLSX_FILE = join(DATA_DIR, 'INDB.xlsx');
const NUTRIENTS_FILE = join(DATA_DIR, 'nutrients.json');

const dbUrl = process.env.DATABASE_URL;
const sql = postgres(dbUrl, { ssl: 'require', max: 5 });

async function main() {
  console.log('=== INDB (Indian Nutrient Database) Import ===\n');

  // Step 1: Load nutrient definitions (first 39 before servings_unit)
  console.log('Step 1: Loading nutrient definitions...');
  const allNutrientDefs = JSON.parse(readFileSync(NUTRIENTS_FILE, 'utf-8'));
  const nutrientDefs = [];
  for (const nd of allNutrientDefs) {
    if (nd.column === 'servings_unit') break;
    nutrientDefs.push(nd);
  }
  console.log(`  Loaded ${nutrientDefs.length} nutrient definitions (stopped before servings_unit)`);

  // Step 2: Parse INDB.xlsx
  console.log('\nStep 2: Parsing INDB.xlsx...');
  const workbook = XLSX.readFile(XLSX_FILE);

  // Find the data sheet — try "Nutrient Data" first, then fall back to first sheet
  let sheetName = 'Nutrient Data';
  if (!workbook.SheetNames.includes(sheetName)) {
    sheetName = workbook.SheetNames[0];
    console.log(`  Sheet "Nutrient Data" not found, using "${sheetName}"`);
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  console.log(`  Parsed ${rows.length} rows from sheet "${sheetName}"`);

  if (rows.length === 0) {
    console.error('  ERROR: No rows found!');
    await sql.end();
    process.exit(1);
  }

  // Log column names for debugging
  const columns = Object.keys(rows[0]);
  console.log(`  Columns (${columns.length}): ${columns.slice(0, 10).join(', ')}...`);

  // Step 3: Extract foods and content
  console.log('\nStep 3: Extracting foods and content...');
  const foods = [];
  const content = [];
  let skippedRows = 0;

  for (const row of rows) {
    const foodId = String(row.food_code || row.Food_Code || row.FOOD_CODE || '').trim();
    const foodName = String(row.food_name || row.Food_Name || row.FOOD_NAME || '').trim();
    const foodGroup = String(row.primarysource || row.PrimarySource || row.PRIMARY_SOURCE || '').trim() || null;

    if (!foodId || !foodName) {
      skippedRows++;
      continue;
    }

    foods.push({ foodId, name: foodName, foodGroup });

    // Pivot nutrient columns to long format
    for (const nd of nutrientDefs) {
      const rawVal = row[nd.column];
      if (rawVal === null || rawVal === undefined || rawVal === '' || rawVal === '-') continue;

      const val = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal));
      if (isNaN(val)) continue;

      content.push({ foodId, nutrientCode: nd.column, value: val });
    }
  }

  console.log(`  Foods: ${foods.length}`);
  console.log(`  Content rows: ${content.length}`);
  if (skippedRows > 0) console.log(`  Skipped rows (no food_code/name): ${skippedRows}`);

  // Step 4: Insert into database
  console.log('\nStep 4: Inserting into database...');

  // Clear existing data
  await sql`DELETE FROM source_indb_content`;
  await sql`DELETE FROM source_indb_nutrients`;
  await sql`DELETE FROM source_indb_foods`;
  console.log('  Cleared existing INDB data');

  // Insert nutrients
  for (const nd of nutrientDefs) {
    await sql`INSERT INTO source_indb_nutrients (nutrient_code, name, unit)
      VALUES (${nd.column}, ${nd.name}, ${nd.unit})
      ON CONFLICT (nutrient_code) DO NOTHING`;
  }
  console.log(`  ${nutrientDefs.length} nutrients inserted`);

  // Insert foods in batches
  for (let b = 0; b < foods.length; b += FOOD_BATCH_SIZE) {
    const chunk = foods.slice(b, b + FOOD_BATCH_SIZE);
    await sql`INSERT INTO source_indb_foods ${sql(
      chunk.map(f => ({ food_id: f.foodId, name: f.name, food_group: f.foodGroup })),
      'food_id', 'name', 'food_group'
    )} ON CONFLICT (food_id) DO UPDATE SET name = EXCLUDED.name, food_group = EXCLUDED.food_group`;
  }
  console.log(`  ${foods.length} foods inserted`);

  // Insert content in batches
  let inserted = 0;
  for (let b = 0; b < content.length; b += CONTENT_BATCH_SIZE) {
    const chunk = content.slice(b, b + CONTENT_BATCH_SIZE);
    await sql`INSERT INTO source_indb_content ${sql(
      chunk.map(c => ({ food_id: c.foodId, nutrient_code: c.nutrientCode, value: c.value })),
      'food_id', 'nutrient_code', 'value'
    )}`;
    inserted += chunk.length;
    if (inserted % 10000 === 0 || b + CONTENT_BATCH_SIZE >= content.length) {
      console.log(`    ${inserted}/${content.length} content rows...`);
    }
  }

  // Step 5: Summary
  console.log('\n=== Summary ===');
  const fc = await sql`SELECT COUNT(*)::int as count FROM source_indb_foods`;
  const nc = await sql`SELECT COUNT(*)::int as count FROM source_indb_nutrients`;
  const cc = await sql`SELECT COUNT(*)::int as count FROM source_indb_content`;
  console.log(`Foods: ${fc[0].count}, Nutrients: ${nc[0].count}, Content: ${cc[0].count}`);

  // Per-nutrient coverage
  const stats = await sql`SELECT nutrient_code, COUNT(*)::int as count FROM source_indb_content WHERE value IS NOT NULL AND value > 0 GROUP BY nutrient_code ORDER BY count DESC`;
  console.log('\nNutrient coverage:');
  for (const s of stats) console.log(`  ${s.nutrient_code}: ${s.count}`);

  // Sample foods
  const sample = await sql`SELECT food_id, name, food_group FROM source_indb_foods ORDER BY food_id LIMIT 5`;
  console.log('\nSample foods:');
  for (const s of sample) console.log(`  ${s.food_id}: ${s.name} (${s.food_group})`);

  await sql.end();
  console.log('\nDone!');
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
