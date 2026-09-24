/**
 * Populate English food names for MEXT (Japanese food database)
 *
 * Uses the official MEXT 2015 English Excel file to map food IDs to English names.
 * The 2015 (7th edition) English file covers 2,184 of 2,478 foods in the 2020 (8th edition).
 *
 * Source: https://www.mext.go.jp/component/english/__icsFiles/afieldfile/2017/12/25/1374049_1r12_1.xlsx
 */

import { readFileSync } from 'fs';
import xlsx from 'xlsx';
import postgres from 'postgres';

const ENGLISH_FILE = 'data/mext/main_composition_en_2015.xlsx';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function main() {
  console.log('=== MEXT English Name Population ===\n');

  // Step 1: Parse the 2015 English Excel
  console.log('Step 1: Parsing English Excel...');
  const wb = xlsx.readFile(ENGLISH_FILE);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null });

  // Extract food ID → English name mapping
  // Data starts at row 9 (0-indexed row 8)
  // Column 1 = Item No. (food ID), Column 3 = Food and Description (English name)
  const englishNames = new Map();

  for (let i = 8; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[1]) continue;

    const foodId = String(row[1]).trim().padStart(5, '0');
    if (!/^\d{5}$/.test(foodId)) continue;

    let name = String(row[3] || '').trim();
    // Clean up: remove newlines, extra whitespace, and synonym brackets
    name = name.replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    if (name) {
      englishNames.set(foodId, name);
    }
  }

  console.log(`  Parsed ${englishNames.size} English food names`);

  // Sample
  console.log('\nSample entries:');
  let count = 0;
  for (const [id, name] of englishNames) {
    if (count++ >= 10) break;
    console.log(`  ${id}: ${name}`);
  }

  // Step 2: Get all MEXT foods from database
  const foods = await sql`SELECT food_id, name FROM source_mext_foods`;
  console.log(`\nDatabase has ${foods.length} MEXT foods`);

  // Step 3: Update English names
  let updated = 0;
  let notFound = 0;

  for (const food of foods) {
    const englishName = englishNames.get(food.food_id);
    if (englishName) {
      await sql`UPDATE source_mext_foods SET name_en = ${englishName} WHERE food_id = ${food.food_id}`;
      updated++;
    } else {
      notFound++;
    }
  }

  console.log(`\nResults:`);
  console.log(`  Updated: ${updated}/${foods.length} foods with English names (${(updated/foods.length*100).toFixed(1)}%)`);
  console.log(`  Not found: ${notFound} foods without English translation`);

  // Show some that weren't found
  if (notFound > 0) {
    const missing = await sql`SELECT food_id, name FROM source_mext_foods WHERE name_en IS NULL LIMIT 15`;
    console.log('\nSample foods without English names (8th edition additions):');
    for (const m of missing) {
      console.log(`  ${m.food_id}: ${m.name}`);
    }
  }

  await sql.end();
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
