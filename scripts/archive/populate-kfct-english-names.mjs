/**
 * Extract English food names from KFCT PDF text files and populate source_kfct_foods.name_en
 *
 * The KFCT vol1/vol2 text files contain alternating Korean/English food names in
 * "Food and Description" sections. This script:
 * 1. Parses both volumes to extract Korean→English name pairs
 * 2. Updates source_kfct_foods.name_en by matching on the Korean name
 */

import { readFileSync } from 'fs';
import postgres from 'postgres';

const VOL1_FILE = 'data/kfct/kfct_vol1.txt';
const VOL2_FILE = 'data/kfct/kfct_vol2.txt';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

/**
 * Detect if a line is Korean text (contains Hangul characters)
 */
function isKorean(line) {
  return /[\uAC00-\uD7AF\u1100-\u11FF]/.test(line);
}

/**
 * Detect if a line is English text (starts with Latin letter, contains mostly ASCII)
 */
function isEnglish(line) {
  return /^[A-Za-z(]/.test(line) && /[a-zA-Z]/.test(line);
}

/**
 * Known Korean nutrient header words that signal end of food names
 */
const NUTRIENT_HEADERS = [
  '에너지', '수분', '단백질', '지질', '회분', '탄수화물',
  '칼슘', '철', '나트륨', '칼륨', '인', '아연',
  '무기질', '비타민', '식이섬유',
];

function isNutrientHeader(line) {
  return NUTRIENT_HEADERS.some(h => line.startsWith(h));
}

/**
 * Extract Korean→English name pairs from a KFCT text file
 */
function extractNamePairs(filePath) {
  const lines = readFileSync(filePath, 'utf-8').split('\n');
  const pairs = new Map(); // Korean name → English name

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // Find "Food and Description" marker
    if (line === 'Food and Description') {
      i++;

      // Skip blank lines and index-related headers
      while (i < lines.length) {
        const next = lines[i].trim();
        if (next === '' || next === 'Index' || next === 'No.' || /^\d+$/.test(next)) {
          i++;
          continue;
        }
        break;
      }

      // Now read alternating Korean/English pairs
      while (i < lines.length) {
        const korean = lines[i]?.trim();
        if (!korean || korean === '') { i++; continue; }

        // Stop if we hit nutrient headers or INFOODS codes
        if (isNutrientHeader(korean) || /^[A-Z]{2,}$/.test(korean) || korean === 'ENERC') {
          break;
        }

        // Should be Korean text
        if (!isKorean(korean)) {
          // Could be a page number or other noise
          i++;
          continue;
        }

        // Next non-blank line should be English
        i++;
        while (i < lines.length && lines[i].trim() === '') i++;

        const english = lines[i]?.trim();
        if (english && isEnglish(english)) {
          pairs.set(korean, english);
          i++;
        }
        // If no English follows, the Korean name might not have a translation
      }
    } else {
      i++;
    }
  }

  return pairs;
}

async function main() {
  console.log('=== KFCT English Name Extraction ===\n');

  // Extract from both volumes
  console.log('Parsing vol1...');
  const vol1Pairs = extractNamePairs(VOL1_FILE);
  console.log(`  Found ${vol1Pairs.size} name pairs`);

  console.log('Parsing vol2...');
  const vol2Pairs = extractNamePairs(VOL2_FILE);
  console.log(`  Found ${vol2Pairs.size} name pairs`);

  // Merge (vol1 takes priority, vol2 fills gaps)
  const allPairs = new Map(vol1Pairs);
  let newFromVol2 = 0;
  for (const [kr, en] of vol2Pairs) {
    if (!allPairs.has(kr)) {
      allPairs.set(kr, en);
      newFromVol2++;
    }
  }
  console.log(`\nTotal unique Korean→English pairs: ${allPairs.size} (${newFromVol2} new from vol2)`);

  // Print some examples
  console.log('\nSample pairs:');
  let count = 0;
  for (const [kr, en] of allPairs) {
    if (count++ >= 10) break;
    console.log(`  ${kr} → ${en}`);
  }

  // Get all KFCT foods
  const foods = await sql`SELECT food_id, name FROM source_kfct_foods`;
  console.log(`\nDatabase has ${foods.length} KFCT foods`);

  // Update English names
  let updated = 0;
  let notFound = 0;

  for (const food of foods) {
    const englishName = allPairs.get(food.name);
    if (englishName) {
      await sql`UPDATE source_kfct_foods SET name_en = ${englishName} WHERE food_id = ${food.food_id}`;
      updated++;
    } else {
      notFound++;
    }
  }

  console.log(`\nResults:`);
  console.log(`  Updated: ${updated}/${foods.length} foods with English names`);
  console.log(`  Not found: ${notFound} foods without English translation`);

  // Show some that weren't found
  if (notFound > 0) {
    const missing = await sql`SELECT food_id, name FROM source_kfct_foods WHERE name_en IS NULL LIMIT 20`;
    console.log('\nSample foods without English names:');
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
