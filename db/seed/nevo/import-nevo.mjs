/**
 * Dutch NEVO (Nederlands Voedingsstoffenbestand) Import Script
 *
 * Imports NEVO 2025 v9.0 data from pipe-delimited CSVs into staging tables:
 * - source_nevo_nutrients: Nutrient definitions (142 entries)
 * - source_nevo_foods: Food items with English and Dutch names (~2,328)
 * - source_nevo_content: Nutrient values per food (~270K rows)
 *
 * Data source: NEVO2025_v9.0_Details.csv (pipe-delimited, 270K rows)
 *              NEVO2025_v9.0_Nutrienten_Nutrients.csv (pipe-delimited, 142 rows)
 *
 * Key design decisions:
 * - food_id is integer (NEVO-code)
 * - nutrient_code is text (PROT, NA, F16:0) — same as compound_sources external_id
 * - Pipe-delimited CSV with quoted values
 */

import { createReadStream, existsSync } from 'fs';
import { createInterface } from 'readline';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration
const BATCH_SIZE = 100;
const CONTENT_BATCH_SIZE = 1000;
const DATA_DIR = join(__dirname, '..', '..', '..', 'data', 'nevo');
const DETAILS_FILE = join(DATA_DIR, 'NEVO2025_v9.0_Details.csv');
const NUTRIENTS_FILE = join(DATA_DIR, 'NEVO2025_v9.0_Nutrienten_Nutrients.csv');

// Details CSV column indices (pipe-delimited)
const COL_FOOD_GROUP_NL = 1;  // Voedingsmiddelgroep (Dutch food group)
const COL_FOOD_GROUP_EN = 2;  // Food group (English)
const COL_NEVO_CODE = 3;      // NEVO-code (integer food ID)
const COL_NAME_NL = 4;        // Voedingsmiddelnaam (Dutch name)
const COL_NAME_EN = 5;        // Engelse naam (English name)
const COL_NUTRIENT_CODE = 9;  // Nutrient-code (text: PROT, NA, etc.)
const COL_VALUE = 12;         // Gehalte/Value (quoted number)

// Database connection
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 5,
});

/**
 * Parse a pipe-delimited line into fields
 * Handles quoted fields containing pipes (though NEVO data doesn't seem to)
 */
function parsePipeLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === '|' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Parse a NEVO cell value to a number
 * Values are quoted numbers like "371", "2", "0.0"
 */
function parseValue(val) {
  if (val === null || val === undefined) return null;

  const s = String(val).trim().replace(/^"|"$/g, '');
  if (s === '' || s === '-' || s === 'N/A' || s === 'NA') return null;

  const num = parseFloat(s);
  return isNaN(num) ? null : num;
}

/**
 * Read lines from a file using readline
 */
async function readLines(filePath) {
  const lines = [];
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    lines.push(line);
  }
  return lines;
}

/**
 * Import all NEVO data
 */
async function importData() {
  console.log('========================================');
  console.log('Dutch NEVO 2025 v9.0 Import Script');
  console.log('========================================');

  if (!existsSync(DETAILS_FILE)) {
    console.error(`Missing file: ${DETAILS_FILE}`);
    process.exit(1);
  }
  if (!existsSync(NUTRIENTS_FILE)) {
    console.error(`Missing file: ${NUTRIENTS_FILE}`);
    process.exit(1);
  }

  // === STEP 1: Import Nutrients ===
  console.log('\n=== Step 1: Importing Nutrients ===');

  const nutrientLines = await readLines(NUTRIENTS_FILE);
  console.log(`Loaded ${nutrientLines.length} lines from nutrients file`);

  // First line is header
  // Deduplicate by nutrient_code (some appear in multiple groups)
  const nutrientMap = new Map();
  for (let i = 1; i < nutrientLines.length; i++) {
    const line = nutrientLines[i].trim();
    if (!line) continue;

    const fields = parsePipeLine(line);
    // Columns: Voedingsstofgroep | Component group | Nutrient-code | Voedingsstof | Component | Eenheid/Unit
    const nutrientCode = fields[2]?.trim();
    const nameEn = fields[4]?.trim();
    const unit = fields[5]?.trim();

    if (!nutrientCode || !nameEn) continue;

    // Keep first occurrence
    if (!nutrientMap.has(nutrientCode)) {
      nutrientMap.set(nutrientCode, {
        nutrient_code: nutrientCode,
        name: nameEn,
        unit: unit || 'unknown',
      });
    }
  }
  const nutrientRecords = Array.from(nutrientMap.values());

  console.log(`  Parsed ${nutrientRecords.length} nutrient definitions`);

  await sql`TRUNCATE source_nevo_nutrients CASCADE`;

  for (let i = 0; i < nutrientRecords.length; i += BATCH_SIZE) {
    const batch = nutrientRecords.slice(i, i + BATCH_SIZE);
    await sql`
      INSERT INTO source_nevo_nutrients ${sql(batch,
        'nutrient_code', 'name', 'unit'
      )}
    `;
  }
  console.log(`  Imported ${nutrientRecords.length} nutrients`);

  // === STEP 2: Parse Details CSV (foods + content) ===
  console.log('\n=== Step 2: Loading Details CSV ===');

  const detailLines = await readLines(DETAILS_FILE);
  console.log(`Loaded ${detailLines.length} lines from details file`);

  // First line is header
  const dataLines = detailLines.slice(1);
  console.log(`Data rows: ${dataLines.length}`);

  // === STEP 3: Extract unique foods ===
  console.log('\n=== Step 3: Importing Foods ===');
  await sql`TRUNCATE source_nevo_foods CASCADE`;

  const foodsMap = new Map(); // foodId -> { name, nameNl, foodGroup }
  for (const line of dataLines) {
    if (!line.trim()) continue;
    const fields = parsePipeLine(line);

    const nevoCode = parseInt(fields[COL_NEVO_CODE], 10);
    if (isNaN(nevoCode)) continue;

    if (!foodsMap.has(nevoCode)) {
      const nameEn = fields[COL_NAME_EN]?.trim() || null;
      const nameNl = fields[COL_NAME_NL]?.trim() || null;
      const foodGroup = fields[COL_FOOD_GROUP_EN]?.trim() || null;

      if (nameEn) {
        foodsMap.set(nevoCode, { name: nameEn, nameNl, foodGroup });
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
      name_nl: data.nameNl,
      food_group: data.foodGroup,
    }));

    await sql`
      INSERT INTO source_nevo_foods ${sql(batch,
        'food_id', 'name', 'name_nl', 'food_group'
      )}
      ON CONFLICT (food_id) DO UPDATE SET name = EXCLUDED.name
    `;
    foodCount += batch.length;
    process.stdout.write(`\r  Imported ${foodCount} foods`);
  }
  console.log(`\r  Imported ${foodCount} foods`);

  // === STEP 4: Import Content (nutrient values) ===
  console.log('\n=== Step 4: Importing Nutrient Content ===');
  await sql`TRUNCATE source_nevo_content`;

  // Build valid nutrient codes set
  const validNutrientCodes = new Set(nutrientRecords.map(n => n.nutrient_code));

  let contentCount = 0;
  let pendingContent = [];
  let skippedNull = 0;

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const fields = parsePipeLine(line);

    const nevoCode = parseInt(fields[COL_NEVO_CODE], 10);
    const nutrientCode = fields[COL_NUTRIENT_CODE]?.trim();
    const rawValue = fields[COL_VALUE];

    if (isNaN(nevoCode) || !nutrientCode) continue;

    const value = parseValue(rawValue);
    if (value === null) {
      skippedNull++;
      continue;
    }

    pendingContent.push({
      food_id: nevoCode,
      nutrient_code: nutrientCode,
      value: value,
    });

    // Flush batch
    if (pendingContent.length >= CONTENT_BATCH_SIZE) {
      await sql`
        INSERT INTO source_nevo_content ${sql(pendingContent, 'food_id', 'nutrient_code', 'value')}
      `;
      contentCount += pendingContent.length;
      pendingContent = [];
      process.stdout.write(`\r  Imported ${contentCount} content rows`);
    }
  }

  // Flush remaining
  if (pendingContent.length > 0) {
    await sql`
      INSERT INTO source_nevo_content ${sql(pendingContent, 'food_id', 'nutrient_code', 'value')}
    `;
    contentCount += pendingContent.length;
  }
  console.log(`\r  Imported ${contentCount} content rows`);
  console.log(`  Skipped ${skippedNull} null/empty values`);

  // === Verify ===
  console.log('\n========================================');
  console.log('Import Summary');
  console.log('========================================');

  const [{ count: dbFoods }] = await sql`SELECT COUNT(*) as count FROM source_nevo_foods`;
  const [{ count: dbNutrients }] = await sql`SELECT COUNT(*) as count FROM source_nevo_nutrients`;
  const [{ count: dbContent }] = await sql`SELECT COUNT(*) as count FROM source_nevo_content`;

  console.log(`source_nevo_foods:       ${dbFoods} rows`);
  console.log(`source_nevo_nutrients:    ${dbNutrients} rows`);
  console.log(`source_nevo_content:     ${dbContent} rows`);

  // Sample data
  console.log('\n=== Sample Foods ===');
  const sampleFoods = await sql`SELECT food_id, name, name_nl, food_group FROM source_nevo_foods LIMIT 5`;
  sampleFoods.forEach(f => console.log(`  ${f.food_id}: ${f.name} [${f.name_nl}] (${f.food_group})`));

  console.log('\n=== Sample Nutrients ===');
  const sampleNutrients = await sql`SELECT nutrient_code, name, unit FROM source_nevo_nutrients LIMIT 10`;
  sampleNutrients.forEach(n => console.log(`  ${n.nutrient_code}: ${n.name} (${n.unit})`));

  console.log('\n=== Sample Content ===');
  const sampleContent = await sql`
    SELECT c.food_id, f.name as food_name, c.nutrient_code, n.name as nutrient_name, c.value
    FROM source_nevo_content c
    JOIN source_nevo_foods f ON f.food_id = c.food_id
    JOIN source_nevo_nutrients n ON n.nutrient_code = c.nutrient_code
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
