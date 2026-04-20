/**
 * AFCD (Australian Food Composition Database) Import Script
 *
 * Imports AFCD data from Excel files into staging tables:
 * - source_afcd_foods: Food items with metadata
 * - source_afcd_nutrients: Nutrient definitions
 * - source_afcd_content: Nutrient values per food (long format)
 *
 * Data source: nutrient-profiles.xlsx "All solids & liquids per 100 g" sheet
 * Structure:
 *   - Row 0: Title
 *   - Row 1: Empty
 *   - Row 2: Headers (272 columns: 4 food info + 268 nutrients)
 *   - Row 3+: Data (1588 foods)
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
const AFCD_DIR = __dirname;
const PROFILES_FILE = join(AFCD_DIR, 'nutrient-profiles.xlsx');
const DATA_SHEET = 'All solids & liquids per 100 g';

// Food info columns (first 4)
const FOOD_COLS = ['Public Food Key', 'Classification', 'Derivation', 'Food Name'];

// Database connection
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 5,
});

/**
 * Parse nutrient name and unit from header
 * Example: "Energy with dietary fibre, equated \r\n(kJ)" -> { name: "Energy with dietary fibre, equated", unit: "kJ" }
 */
function parseNutrientHeader(header) {
  if (!header) return { name: 'Unknown', unit: 'unknown' };

  // Clean up newlines and extra spaces
  const clean = header.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim();

  // Extract unit from parentheses at end
  const match = clean.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (match) {
    return { name: match[1].trim(), unit: match[2].trim() };
  }

  return { name: clean, unit: 'unknown' };
}

/**
 * Import all data from nutrient-profiles.xlsx
 */
async function importData() {
  console.log('========================================');
  console.log('AFCD Import Script');
  console.log('========================================');

  if (!existsSync(PROFILES_FILE)) {
    console.error(`Missing file: ${PROFILES_FILE}`);
    process.exit(1);
  }

  console.log(`\nReading ${PROFILES_FILE}...`);
  const workbook = xlsx.readFile(PROFILES_FILE);
  const sheet = workbook.Sheets[DATA_SHEET];

  if (!sheet) {
    console.error(`Sheet "${DATA_SHEET}" not found`);
    process.exit(1);
  }

  const allRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const headers = allRows[2]; // Row 2 has headers
  const dataRows = allRows.slice(3); // Row 3+ has data

  console.log(`Found ${headers.length} columns, ${dataRows.length} food rows`);

  // Split headers into food columns and nutrient columns
  const nutrientHeaders = headers.slice(4); // Skip first 4 food columns
  console.log(`Food columns: ${FOOD_COLS.length}, Nutrient columns: ${nutrientHeaders.length}`);

  // === STEP 1: Import Nutrients ===
  console.log('\n=== Importing Nutrients ===');
  await sql`TRUNCATE source_afcd_nutrients CASCADE`;

  const nutrients = nutrientHeaders.map((header, idx) => {
    const { name, unit } = parseNutrientHeader(header);
    return {
      nutrient_index: idx,
      name,
      unit,
      infoods_tagname: null,
      eurofir_name: null,
      category: null,
      is_core: false,
      description: null,
      equation: null,
      reporting_limit: null,
    };
  });

  // Insert nutrients in batches
  for (let i = 0; i < nutrients.length; i += BATCH_SIZE) {
    const batch = nutrients.slice(i, i + BATCH_SIZE);
    await sql`
      INSERT INTO source_afcd_nutrients ${sql(batch,
        'nutrient_index', 'name', 'unit', 'infoods_tagname', 'eurofir_name',
        'category', 'is_core', 'description', 'equation', 'reporting_limit'
      )}
    `;
  }
  console.log(`  Imported ${nutrients.length} nutrients`);

  // === STEP 2: Import Foods ===
  console.log('\n=== Importing Foods ===');
  await sql`TRUNCATE source_afcd_foods CASCADE`;

  let foodCount = 0;
  for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
    const batch = dataRows.slice(i, i + BATCH_SIZE);

    const foods = batch
      .filter(row => row[0]) // Must have food key
      .map(row => ({
        afcd_food_key: String(row[0]),
        classification: row[1] ? String(row[1]) : null,
        derivation: row[2] ? String(row[2]) : null,
        name: row[3] ? String(row[3]) : 'Unknown',
        description: null,
        sampling_details: null,
        nitrogen_factor: null,
        fat_factor: null,
        specific_gravity: null,
        analysed_portion: null,
        unanalysed_portion: null,
        raw_data: null,
      }));

    if (foods.length > 0) {
      await sql`
        INSERT INTO source_afcd_foods ${sql(foods,
          'afcd_food_key', 'classification', 'derivation', 'name', 'description',
          'sampling_details', 'nitrogen_factor', 'fat_factor', 'specific_gravity',
          'analysed_portion', 'unanalysed_portion', 'raw_data'
        )}
        ON CONFLICT (afcd_food_key) DO UPDATE SET name = EXCLUDED.name
      `;
      foodCount += foods.length;
    }

    process.stdout.write(`\r  Imported ${foodCount} foods`);
  }
  console.log('');

  // === STEP 3: Import Content (nutrient values) ===
  console.log('\n=== Importing Nutrient Content ===');
  await sql`TRUNCATE source_afcd_content`;

  let contentCount = 0;
  let pendingContent = [];

  for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
    const row = dataRows[rowIdx];
    const foodKey = row[0];
    if (!foodKey) continue;

    // Extract nutrient values (columns 4+)
    for (let colIdx = 4; colIdx < row.length; colIdx++) {
      const value = row[colIdx];
      // Only store numeric values
      if (value !== null && value !== '' && typeof value === 'number' && !isNaN(value)) {
        pendingContent.push({
          afcd_food_key: String(foodKey),
          nutrient_index: colIdx - 4, // Adjust for food columns
          value: value,
        });
      }
    }

    // Flush batch when large enough
    if (pendingContent.length >= CONTENT_BATCH_SIZE) {
      await sql`
        INSERT INTO source_afcd_content ${sql(pendingContent, 'afcd_food_key', 'nutrient_index', 'value')}
      `;
      contentCount += pendingContent.length;
      pendingContent = [];
      process.stdout.write(`\r  Processed ${rowIdx + 1}/${dataRows.length} foods, ${contentCount} content rows`);
    }
  }

  // Flush remaining
  if (pendingContent.length > 0) {
    await sql`
      INSERT INTO source_afcd_content ${sql(pendingContent, 'afcd_food_key', 'nutrient_index', 'value')}
    `;
    contentCount += pendingContent.length;
  }

  console.log(`\n  Imported ${contentCount} content rows`);

  // === Verify ===
  console.log('\n========================================');
  console.log('Import Summary');
  console.log('========================================');

  const [{ count: dbFoods }] = await sql`SELECT COUNT(*) as count FROM source_afcd_foods`;
  const [{ count: dbNutrients }] = await sql`SELECT COUNT(*) as count FROM source_afcd_nutrients`;
  const [{ count: dbContent }] = await sql`SELECT COUNT(*) as count FROM source_afcd_content`;

  console.log(`source_afcd_foods:    ${dbFoods} rows`);
  console.log(`source_afcd_nutrients: ${dbNutrients} rows`);
  console.log(`source_afcd_content:  ${dbContent} rows`);

  // Sample data
  console.log('\n=== Sample Foods ===');
  const sampleFoods = await sql`SELECT afcd_food_key, name FROM source_afcd_foods LIMIT 5`;
  sampleFoods.forEach(f => console.log(`  ${f.afcd_food_key}: ${f.name}`));

  console.log('\n=== Sample Nutrients ===');
  const sampleNutrients = await sql`SELECT nutrient_index, name, unit FROM source_afcd_nutrients LIMIT 5`;
  sampleNutrients.forEach(n => console.log(`  [${n.nutrient_index}] ${n.name} (${n.unit})`));

  await sql.end();
  console.log('\nImport complete!');
}

importData().catch(err => {
  console.error('\nImport failed:', err);
  process.exit(1);
});
