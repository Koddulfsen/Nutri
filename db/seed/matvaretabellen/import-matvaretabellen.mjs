/**
 * Norwegian Matvaretabellen Import Script
 *
 * Imports Matvaretabellen data from JSON files into staging tables:
 * - source_matvaretabellen_nutrients: Nutrient definitions (57 entries)
 * - source_matvaretabellen_foods: Food items with English names (~2,121)
 * - source_matvaretabellen_content: Nutrient values per food (~120K rows)
 *
 * Data source: foods-en.json (2,121 foods with constituents)
 *              nutrients.json (57 nutrient definitions with EuroFIR codes)
 *
 * Key design decisions:
 * - food_id is text (e.g., "06.178", "01.344")
 * - nutrient_id is Norwegian text (e.g., "Vann", "Fett", "Ca")
 * - eurofir_code enables join to compound_sources (e.g., "WATER", "FAT", "CA")
 * - Only constituents with a quantity field are imported (missing = no data)
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration
const BATCH_SIZE = 100;
const CONTENT_BATCH_SIZE = 1000;
const DATA_DIR = join(__dirname, '..', '..', '..', 'data', 'matvaretabellen');
const FOODS_FILE = join(DATA_DIR, 'foods-en.json');
const NUTRIENTS_FILE = join(DATA_DIR, 'nutrients.json');

// Database connection
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 5,
});

/**
 * Import all Matvaretabellen data
 */
async function importData() {
  console.log('========================================');
  console.log('Norwegian Matvaretabellen Import Script');
  console.log('========================================');

  if (!existsSync(FOODS_FILE)) {
    console.error(`Missing file: ${FOODS_FILE}`);
    process.exit(1);
  }
  if (!existsSync(NUTRIENTS_FILE)) {
    console.error(`Missing file: ${NUTRIENTS_FILE}`);
    process.exit(1);
  }

  // === STEP 1: Import Nutrients ===
  console.log('\n=== Step 1: Importing Nutrients ===');

  const nutrientsData = JSON.parse(readFileSync(NUTRIENTS_FILE, 'utf-8'));
  const nutrients = nutrientsData.nutrients;
  console.log(`  Loaded ${nutrients.length} nutrient definitions from nutrients.json`);

  const nutrientRecords = nutrients.map(n => ({
    nutrient_id: n.nutrientId,
    name: n.name,
    unit: n.unit || 'unknown',
    eurofir_code: n.euroFirId || null,
  }));

  await sql`TRUNCATE source_matvaretabellen_nutrients CASCADE`;

  for (let i = 0; i < nutrientRecords.length; i += BATCH_SIZE) {
    const batch = nutrientRecords.slice(i, i + BATCH_SIZE);
    await sql`
      INSERT INTO source_matvaretabellen_nutrients ${sql(batch,
        'nutrient_id', 'name', 'unit', 'eurofir_code'
      )}
    `;
  }
  console.log(`  Imported ${nutrientRecords.length} nutrients`);

  // Build set of known nutrient IDs for filtering
  const knownNutrientIds = new Set(nutrients.map(n => n.nutrientId));

  // === STEP 2: Import Foods ===
  console.log('\n=== Step 2: Importing Foods ===');

  const foodsData = JSON.parse(readFileSync(FOODS_FILE, 'utf-8'));
  const allFoods = foodsData.foods;
  console.log(`  Loaded ${allFoods.length} foods from foods-en.json`);

  await sql`TRUNCATE source_matvaretabellen_foods CASCADE`;

  const foodRecords = allFoods.map(f => ({
    food_id: f.foodId,
    name: f.foodName,
    food_group_id: f.foodGroupId || null,
  }));

  let foodCount = 0;
  for (let i = 0; i < foodRecords.length; i += BATCH_SIZE) {
    const batch = foodRecords.slice(i, i + BATCH_SIZE);
    await sql`
      INSERT INTO source_matvaretabellen_foods ${sql(batch,
        'food_id', 'name', 'food_group_id'
      )}
      ON CONFLICT (food_id) DO UPDATE SET name = EXCLUDED.name
    `;
    foodCount += batch.length;
    process.stdout.write(`\r  Imported ${foodCount} foods`);
  }
  console.log(`\r  Imported ${foodCount} foods`);

  // === STEP 3: Import Content (nutrient values) ===
  console.log('\n=== Step 3: Importing Nutrient Content ===');
  await sql`TRUNCATE source_matvaretabellen_content`;

  let contentCount = 0;
  let skippedNoQuantity = 0;
  let skippedUnknownNutrient = 0;
  let pendingContent = [];

  for (const food of allFoods) {
    if (!food.constituents) continue;

    for (const c of food.constituents) {
      // Skip constituents without quantity (missing data)
      if (!('quantity' in c) || c.quantity === undefined || c.quantity === null) {
        skippedNoQuantity++;
        continue;
      }

      // Only import nutrients we have definitions for
      if (!knownNutrientIds.has(c.nutrientId)) {
        skippedUnknownNutrient++;
        continue;
      }

      pendingContent.push({
        food_id: food.foodId,
        nutrient_id: c.nutrientId,
        value: c.quantity,
      });

      // Flush batch
      if (pendingContent.length >= CONTENT_BATCH_SIZE) {
        await sql`
          INSERT INTO source_matvaretabellen_content ${sql(pendingContent, 'food_id', 'nutrient_id', 'value')}
        `;
        contentCount += pendingContent.length;
        pendingContent = [];
        process.stdout.write(`\r  Imported ${contentCount} content rows`);
      }
    }
  }

  // Flush remaining
  if (pendingContent.length > 0) {
    await sql`
      INSERT INTO source_matvaretabellen_content ${sql(pendingContent, 'food_id', 'nutrient_id', 'value')}
    `;
    contentCount += pendingContent.length;
  }
  console.log(`\r  Imported ${contentCount} content rows`);
  console.log(`  Skipped ${skippedNoQuantity} constituents without quantity`);
  console.log(`  Skipped ${skippedUnknownNutrient} constituents with unknown nutrient IDs`);

  // === Verify ===
  console.log('\n========================================');
  console.log('Import Summary');
  console.log('========================================');

  const [{ count: dbFoods }] = await sql`SELECT COUNT(*) as count FROM source_matvaretabellen_foods`;
  const [{ count: dbNutrients }] = await sql`SELECT COUNT(*) as count FROM source_matvaretabellen_nutrients`;
  const [{ count: dbContent }] = await sql`SELECT COUNT(*) as count FROM source_matvaretabellen_content`;

  console.log(`source_matvaretabellen_foods:       ${dbFoods} rows`);
  console.log(`source_matvaretabellen_nutrients:    ${dbNutrients} rows`);
  console.log(`source_matvaretabellen_content:     ${dbContent} rows`);

  // Sample data
  console.log('\n=== Sample Foods ===');
  const sampleFoods = await sql`SELECT food_id, name, food_group_id FROM source_matvaretabellen_foods LIMIT 5`;
  sampleFoods.forEach(f => console.log(`  ${f.food_id}: ${f.name} (group: ${f.food_group_id})`));

  console.log('\n=== Sample Nutrients ===');
  const sampleNutrients = await sql`SELECT nutrient_id, name, unit, eurofir_code FROM source_matvaretabellen_nutrients LIMIT 10`;
  sampleNutrients.forEach(n => console.log(`  ${n.nutrient_id}: ${n.name} (${n.unit}) → ${n.eurofir_code}`));

  console.log('\n=== Sample Content ===');
  const sampleContent = await sql`
    SELECT c.food_id, f.name as food_name, c.nutrient_id, n.name as nutrient_name, c.value
    FROM source_matvaretabellen_content c
    JOIN source_matvaretabellen_foods f ON f.food_id = c.food_id
    JOIN source_matvaretabellen_nutrients n ON n.nutrient_id = c.nutrient_id
    WHERE c.nutrient_id IN ('Vann', 'Protein', 'Fett')
    LIMIT 10
  `;
  sampleContent.forEach(c => console.log(`  ${c.food_name}: ${c.nutrient_name} = ${c.value}`));

  // Compound mapping verification
  console.log('\n=== Compound Mapping Coverage ===');
  const mappingCheck = await sql`
    SELECT
      COUNT(DISTINCT n.nutrient_id) as total_nutrients,
      COUNT(DISTINCT CASE WHEN cs.compound_id IS NOT NULL THEN n.nutrient_id END) as mapped_nutrients
    FROM source_matvaretabellen_nutrients n
    LEFT JOIN compound_sources cs ON cs.external_id = n.eurofir_code
      AND cs.external_source = 'MATVARETABELLEN'
  `;
  console.log(`  ${mappingCheck[0].mapped_nutrients}/${mappingCheck[0].total_nutrients} nutrients mapped to compounds`);

  await sql.end();
  console.log('\nImport complete!');
}

importData().catch(err => {
  console.error('\nImport failed:', err);
  process.exit(1);
});
