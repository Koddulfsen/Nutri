/**
 * New Zealand FOODfiles Import Script
 *
 * Imports FOODfiles data from tilde-delimited text files into staging tables:
 * - source_foodfiles_nutrients: Nutrient definitions (434 entries)
 * - source_foodfiles_foods: Food items with names (~2,857)
 * - source_foodfiles_content: Nutrient values per food (~571K rows)
 *
 * Data source: UnabridgedCodes (nutrient definitions)
 *              Names (food metadata)
 *              UnabridgedDataFT (nutrient values, long format)
 *
 * Key design decisions:
 * - food_id is text (e.g., "A10001", "A1011")
 * - nutrient_code is text (e.g., "WATER", "PROT", "F18D2CN6")
 * - nutrient_code used directly as compound_sources external_id (NEVO pattern)
 * - First line of every file = copyright notice, second line = header (skip both)
 * - Values are plain numbers, tilde (~) delimited
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration
const BATCH_SIZE = 100;
const CONTENT_BATCH_SIZE = 2000;
const DATA_DIR = join(__dirname, '..', '..', '..', 'data', 'foodfiles', 'extracted');
const CODES_FILE = join(DATA_DIR, 'UnabridgedCodes');
const NAMES_FILE = join(DATA_DIR, 'Names');
const DATA_FILE = join(DATA_DIR, 'UnabridgedDataFT');

// Database connection
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 5,
});

/**
 * Parse a tilde-delimited file, skipping line 1 (copyright) and line 2 (header)
 * Returns array of arrays (fields per row)
 */
function parseTildeFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  // Skip line 0 (copyright) and line 1 (header), start at line 2
  const dataLines = lines.slice(2).filter(line => line.trim().length > 0);
  return dataLines.map(line => line.split('~'));
}

/**
 * Import all FOODfiles data
 */
async function importData() {
  console.log('========================================');
  console.log('New Zealand FOODfiles Import Script');
  console.log('========================================');

  // Verify files exist
  for (const [name, path] of [['UnabridgedCodes', CODES_FILE], ['Names', NAMES_FILE], ['UnabridgedDataFT', DATA_FILE]]) {
    if (!existsSync(path)) {
      console.error(`Missing file: ${path}`);
      process.exit(1);
    }
  }

  // === STEP 1: Import Nutrients (UnabridgedCodes) ===
  // Format: Code~Description~Unit Code~Matrix Unit Code
  console.log('\n=== Step 1: Importing Nutrients ===');

  const codeRows = parseTildeFile(CODES_FILE);
  console.log(`  Loaded ${codeRows.length} nutrient definitions from UnabridgedCodes`);

  const nutrientRecords = codeRows.map(fields => ({
    nutrient_code: fields[0].trim(),
    name: fields[1].trim(),
    unit: fields[2].trim(),
  }));

  await sql`TRUNCATE source_foodfiles_nutrients CASCADE`;

  for (let i = 0; i < nutrientRecords.length; i += BATCH_SIZE) {
    const batch = nutrientRecords.slice(i, i + BATCH_SIZE);
    await sql`
      INSERT INTO source_foodfiles_nutrients ${sql(batch, 'nutrient_code', 'name', 'unit')}
    `;
  }
  console.log(`  Imported ${nutrientRecords.length} nutrients`);

  // Build set of known nutrient codes for filtering
  const knownCodes = new Set(nutrientRecords.map(n => n.nutrient_code));

  // === STEP 2: Import Foods (Names) ===
  // Format: FoodID~Food Name~Short Food Name~AlternativeNames~Food Description~...
  console.log('\n=== Step 2: Importing Foods ===');

  const nameRows = parseTildeFile(NAMES_FILE);
  console.log(`  Loaded ${nameRows.length} foods from Names`);

  await sql`TRUNCATE source_foodfiles_foods CASCADE`;

  const foodRecords = nameRows.map(fields => ({
    food_id: fields[0].trim(),
    name: fields[1].trim(),
    short_name: fields[2]?.trim() || null,
  }));

  let foodCount = 0;
  for (let i = 0; i < foodRecords.length; i += BATCH_SIZE) {
    const batch = foodRecords.slice(i, i + BATCH_SIZE);
    await sql`
      INSERT INTO source_foodfiles_foods ${sql(batch, 'food_id', 'name', 'short_name')}
      ON CONFLICT (food_id) DO UPDATE SET name = EXCLUDED.name
    `;
    foodCount += batch.length;
    process.stdout.write(`\r  Imported ${foodCount} foods`);
  }
  console.log(`\r  Imported ${foodCount} foods`);

  // Build set of known food IDs for filtering
  const knownFoodIds = new Set(foodRecords.map(f => f.food_id));

  // === STEP 3: Import Content (UnabridgedDataFT) ===
  // Format: FoodID~Component Identifier~Value~Unit Code~Matrix Unit Code~Source Code~...
  console.log('\n=== Step 3: Importing Nutrient Content ===');
  await sql`TRUNCATE source_foodfiles_content`;

  // Stream the large file line by line to avoid memory issues
  const content = readFileSync(DATA_FILE, 'utf-8');
  const lines = content.split('\n');
  // Skip copyright (line 0) and header (line 1)

  let contentCount = 0;
  let skippedNoValue = 0;
  let skippedUnknownCode = 0;
  let skippedUnknownFood = 0;
  let pendingContent = [];

  for (let lineIdx = 2; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx].trim();
    if (!line) continue;

    const fields = line.split('~');
    const foodId = fields[0].trim();
    const nutrientCode = fields[1].trim();
    const rawValue = fields[2]?.trim();

    // Skip unknown food IDs
    if (!knownFoodIds.has(foodId)) {
      skippedUnknownFood++;
      continue;
    }

    // Skip unknown nutrient codes
    if (!knownCodes.has(nutrientCode)) {
      skippedUnknownCode++;
      continue;
    }

    // Parse value (skip empty or non-numeric)
    if (!rawValue || rawValue === '') {
      skippedNoValue++;
      continue;
    }

    const value = parseFloat(rawValue);
    if (isNaN(value)) {
      skippedNoValue++;
      continue;
    }

    pendingContent.push({
      food_id: foodId,
      nutrient_code: nutrientCode,
      value,
    });

    // Flush batch
    if (pendingContent.length >= CONTENT_BATCH_SIZE) {
      await sql`
        INSERT INTO source_foodfiles_content ${sql(pendingContent, 'food_id', 'nutrient_code', 'value')}
      `;
      contentCount += pendingContent.length;
      pendingContent = [];
      process.stdout.write(`\r  Imported ${contentCount} content rows`);
    }
  }

  // Flush remaining
  if (pendingContent.length > 0) {
    await sql`
      INSERT INTO source_foodfiles_content ${sql(pendingContent, 'food_id', 'nutrient_code', 'value')}
    `;
    contentCount += pendingContent.length;
  }
  console.log(`\r  Imported ${contentCount} content rows`);
  console.log(`  Skipped ${skippedNoValue} rows without value`);
  console.log(`  Skipped ${skippedUnknownCode} rows with unknown nutrient codes`);
  console.log(`  Skipped ${skippedUnknownFood} rows with unknown food IDs`);

  // === Verify ===
  console.log('\n========================================');
  console.log('Import Summary');
  console.log('========================================');

  const [{ count: dbFoods }] = await sql`SELECT COUNT(*) as count FROM source_foodfiles_foods`;
  const [{ count: dbNutrients }] = await sql`SELECT COUNT(*) as count FROM source_foodfiles_nutrients`;
  const [{ count: dbContent }] = await sql`SELECT COUNT(*) as count FROM source_foodfiles_content`;

  console.log(`source_foodfiles_foods:       ${dbFoods} rows`);
  console.log(`source_foodfiles_nutrients:    ${dbNutrients} rows`);
  console.log(`source_foodfiles_content:     ${dbContent} rows`);

  // Sample data
  console.log('\n=== Sample Foods ===');
  const sampleFoods = await sql`SELECT food_id, name, short_name FROM source_foodfiles_foods LIMIT 5`;
  sampleFoods.forEach(f => console.log(`  ${f.food_id}: ${f.name} (short: ${f.short_name})`));

  console.log('\n=== Sample Nutrients ===');
  const sampleNutrients = await sql`SELECT nutrient_code, name, unit FROM source_foodfiles_nutrients LIMIT 10`;
  sampleNutrients.forEach(n => console.log(`  ${n.nutrient_code}: ${n.name} (${n.unit})`));

  console.log('\n=== Sample Content ===');
  const sampleContent = await sql`
    SELECT c.food_id, f.name as food_name, c.nutrient_code, n.name as nutrient_name, c.value
    FROM source_foodfiles_content c
    JOIN source_foodfiles_foods f ON f.food_id = c.food_id
    JOIN source_foodfiles_nutrients n ON n.nutrient_code = c.nutrient_code
    WHERE c.nutrient_code IN ('WATER', 'PROT', 'FAT')
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
