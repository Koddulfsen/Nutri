/**
 * Finnish Fineli Food Composition Database Import Script
 *
 * Imports Fineli data from CSV files into staging tables:
 * - source_fineli_nutrients: Nutrient definitions with EuroFIR codes
 * - source_fineli_foods: Food items with English names and food groups
 * - source_fineli_content: Nutrient values per food (long format)
 *
 * Data source: Fineli Release 20
 * - component.csv: 75 nutrients (semicolon-delimited)
 * - foodname_EN.csv: English food names
 * - food.csv: Food metadata with FUCLASS food groups
 * - component_value.csv: ~300K nutrient values
 *
 * Key design decisions:
 * - Semicolon-delimited CSVs with European decimal separator (comma → period)
 * - nutrient_code uses EuroFIR codes (ENERC, FAT, CA, etc.) matching compound_sources.external_id
 * - food_id is integer (from FOODID column)
 * - English names come from foodname_EN.csv, joined with food.csv for food groups
 */

import postgres from 'postgres';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration
const BATCH_SIZE = 100;
const CONTENT_BATCH_SIZE = 1000;
const DATA_DIR = join(__dirname, '..', '..', '..', 'data', 'fineli');

// Data files
const COMPONENT_FILE = join(DATA_DIR, 'component.csv');
const FOODNAME_EN_FILE = join(DATA_DIR, 'foodname_EN.csv');
const FOOD_FILE = join(DATA_DIR, 'food.csv');
const COMPONENT_VALUE_FILE = join(DATA_DIR, 'component_value.csv');

// Database connection
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 5,
});

/**
 * Parse a semicolon-delimited CSV file into rows of objects
 * Handles European decimal separator (comma → period) in numeric fields
 */
function parseSemicolonCSV(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(';');

  return lines.slice(1).map(line => {
    const values = line.split(';');
    const row = {};
    headers.forEach((header, i) => {
      row[header.trim()] = values[i]?.trim() || null;
    });
    return row;
  });
}

/**
 * Parse European decimal number (comma → period)
 * Returns null for empty/invalid values
 */
function parseEuropeanDecimal(val) {
  if (!val || val === '') return null;
  // Replace comma decimal separator with period
  const num = parseFloat(val.replace(',', '.'));
  return isNaN(num) ? null : num;
}

/**
 * Import all Fineli data
 */
async function importData() {
  console.log('========================================');
  console.log('Finnish Fineli Import Script');
  console.log('========================================');

  // Verify data files exist
  const requiredFiles = [COMPONENT_FILE, FOODNAME_EN_FILE, FOOD_FILE, COMPONENT_VALUE_FILE];
  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      console.error(`Missing file: ${file}`);
      process.exit(1);
    }
  }

  // === STEP 1: Import Nutrients ===
  console.log('\n=== Step 1: Importing Nutrients ===');
  await sql`TRUNCATE source_fineli_nutrients CASCADE`;

  const components = parseSemicolonCSV(COMPONENT_FILE);
  console.log(`  Loaded ${components.length} nutrient definitions from component.csv`);

  const nutrientRecords = components.map(c => ({
    nutrient_code: c.EUFDNAME,
    name: c.EUFDNAME, // EuroFIR code as name
    unit: c.COMPUNIT || 'unknown',
  }));

  // Insert in batches
  for (let i = 0; i < nutrientRecords.length; i += BATCH_SIZE) {
    const batch = nutrientRecords.slice(i, i + BATCH_SIZE);
    await sql`
      INSERT INTO source_fineli_nutrients ${sql(batch, 'nutrient_code', 'name', 'unit')}
    `;
  }
  console.log(`  Imported ${nutrientRecords.length} nutrients`);

  // === STEP 2: Import Foods ===
  console.log('\n=== Step 2: Importing Foods ===');
  await sql`TRUNCATE source_fineli_foods CASCADE`;

  // Parse English names
  const foodNamesEN = parseSemicolonCSV(FOODNAME_EN_FILE);
  console.log(`  Loaded ${foodNamesEN.length} English food names`);

  // Parse food metadata (for FUCLASS food groups and Finnish names)
  const foodMeta = parseSemicolonCSV(FOOD_FILE);
  console.log(`  Loaded ${foodMeta.length} food metadata rows`);

  // Build lookup maps
  const foodMetaMap = new Map();
  for (const row of foodMeta) {
    foodMetaMap.set(row.FOODID, row);
  }

  let foodCount = 0;
  const foodRecords = [];

  for (const nameRow of foodNamesEN) {
    const foodId = parseInt(nameRow.FOODID, 10);
    if (isNaN(foodId)) continue;

    const meta = foodMetaMap.get(nameRow.FOODID);

    foodRecords.push({
      food_id: foodId,
      name: nameRow.FOODNAME || 'Unknown',
      description: meta?.FOODNAME || null, // Finnish name as description
      food_group: meta?.FUCLASS || null,
    });
  }

  // Insert in batches
  for (let i = 0; i < foodRecords.length; i += BATCH_SIZE) {
    const batch = foodRecords.slice(i, i + BATCH_SIZE);
    await sql`
      INSERT INTO source_fineli_foods ${sql(batch, 'food_id', 'name', 'description', 'food_group')}
      ON CONFLICT (food_id) DO UPDATE SET name = EXCLUDED.name
    `;
    foodCount += batch.length;
    process.stdout.write(`\r  Imported ${foodCount} foods`);
  }
  console.log('');

  // === STEP 3: Import Content (nutrient values) ===
  console.log('\n=== Step 3: Importing Nutrient Content ===');
  await sql`TRUNCATE source_fineli_content`;

  // Build set of valid food IDs and nutrient codes for validation
  const validFoodIds = new Set(foodRecords.map(f => f.food_id));
  const validNutrientCodes = new Set(nutrientRecords.map(n => n.nutrient_code));

  // Parse component_value.csv - this is the large file (~300K rows)
  const content = readFileSync(COMPONENT_VALUE_FILE, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(';');

  let contentCount = 0;
  let skippedCount = 0;
  let pendingContent = [];

  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx].trim();
    if (!line) continue;

    const values = line.split(';');
    const foodId = parseInt(values[0], 10); // FOODID
    const nutrientCode = values[1]; // EUFDNAME
    const bestloc = values[2]; // BESTLOC (value with comma decimal)

    if (isNaN(foodId) || !nutrientCode) {
      skippedCount++;
      continue;
    }

    // Validate references
    if (!validFoodIds.has(foodId) || !validNutrientCodes.has(nutrientCode)) {
      skippedCount++;
      continue;
    }

    const value = parseEuropeanDecimal(bestloc);
    if (value === null) {
      skippedCount++;
      continue;
    }

    pendingContent.push({
      food_id: foodId,
      nutrient_code: nutrientCode,
      value: value,
    });

    // Flush batch
    if (pendingContent.length >= CONTENT_BATCH_SIZE) {
      await sql`
        INSERT INTO source_fineli_content ${sql(pendingContent, 'food_id', 'nutrient_code', 'value')}
      `;
      contentCount += pendingContent.length;
      pendingContent = [];
      process.stdout.write(`\r  Imported ${contentCount} content rows`);
    }
  }

  // Flush remaining
  if (pendingContent.length > 0) {
    await sql`
      INSERT INTO source_fineli_content ${sql(pendingContent, 'food_id', 'nutrient_code', 'value')}
    `;
    contentCount += pendingContent.length;
  }

  console.log(`\r  Imported ${contentCount} content rows`);
  console.log(`  Skipped ${skippedCount} rows (null/invalid values)`);

  // === Verify ===
  console.log('\n========================================');
  console.log('Import Summary');
  console.log('========================================');

  const [{ count: dbFoods }] = await sql`SELECT COUNT(*) as count FROM source_fineli_foods`;
  const [{ count: dbNutrients }] = await sql`SELECT COUNT(*) as count FROM source_fineli_nutrients`;
  const [{ count: dbContent }] = await sql`SELECT COUNT(*) as count FROM source_fineli_content`;

  console.log(`source_fineli_foods:     ${dbFoods} rows`);
  console.log(`source_fineli_nutrients:  ${dbNutrients} rows`);
  console.log(`source_fineli_content:   ${dbContent} rows`);

  // Sample data
  console.log('\n=== Sample Foods ===');
  const sampleFoods = await sql`SELECT food_id, name FROM source_fineli_foods LIMIT 5`;
  sampleFoods.forEach(f => console.log(`  ${f.food_id}: ${f.name}`));

  console.log('\n=== Sample Nutrients ===');
  const sampleNutrients = await sql`SELECT nutrient_code, name, unit FROM source_fineli_nutrients LIMIT 10`;
  sampleNutrients.forEach(n => console.log(`  ${n.nutrient_code}: ${n.name} (${n.unit})`));

  console.log('\n=== Sample Content ===');
  const sampleContent = await sql`
    SELECT c.food_id, f.name as food_name, c.nutrient_code, c.value
    FROM source_fineli_content c
    JOIN source_fineli_foods f ON f.food_id = c.food_id
    WHERE c.nutrient_code IN ('PROT', 'FAT', 'ENERC')
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
