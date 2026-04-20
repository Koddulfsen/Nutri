/**
 * ASEANFOODS (ASEAN Food Composition Database) Import Script
 *
 * Imports ASEANFOODS data from aseanfoods.txt (pdftotext output) into staging tables.
 *
 * The two-column PDF layout creates a challenging interleaving pattern:
 * - A food's VALUES often appear BEFORE its food ID (from the previous page's column 2)
 * - Food IDs appear in page headers as column markers (not real records)
 * - Each food appears ~2x (once per column) with identical values
 *
 * Strategy:
 *   1. Parse Appendix 1 for food_id → name + food_group
 *   2. Build a flat token stream from the data section: FOOD_ID | VALUE only
 *   3. Find all VALUE runs (consecutive VALUE tokens of length ≥ 21)
 *   4. Match each VALUE run to the nearest FOOD_ID token(s) within ±30 tokens
 *   5. Deduplicate by food ID (keep first complete match)
 *   6. Also extract food names from data section as fallback
 *
 * Usage: node db/seed/aseanfoods/import-aseanfoods.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONTENT_BATCH_SIZE = 1000;
const FOOD_BATCH_SIZE = 100;
const DATA_DIR = join(__dirname, '../../../data/aseanfoods');
const TXT_FILE = join(DATA_DIR, 'aseanfoods.txt');
const NUTRIENTS_FILE = join(DATA_DIR, 'nutrients.json');

const dbUrl = process.env.DATABASE_URL;
const sql = postgres(dbUrl, { ssl: 'require', max: 5 });

const NUTRIENT_ORDER = [
  'ENERC', 'WATER', 'PROCNT', 'FAT', 'CHOAVLDF', 'FIBTG', 'ASH',
  'CA', 'P', 'NA', 'K', 'FE', 'CU', 'ZN',
  'RETOL', 'CARTB', 'VITA_RAE', 'THIA', 'RIBF', 'NIA', 'VITC',
];

const FOOD_ID_RE = /^AA[A-U]\d+$/;

// ======== SHARED UTILITIES ========

function tryParseValue(raw) {
  const s = raw.trim();
  if (s === '-') return { value: null, ok: true };
  if (s === 'tr' || s === 'Tr' || s === 'T') return { value: 0, ok: true };
  if (s === '0p') return { value: 0, ok: true };
  const m = s.match(/^\(?(-?[\d.]+)\)?$/);
  if (m) {
    const v = parseFloat(m[1]);
    return isNaN(v) ? { ok: false } : { value: v, ok: true };
  }
  return { ok: false };
}

const GROUP_PATTERNS = [
  /^Cereals and/, /^Starchy roots/, /^Legumes, nuts/, /^Vegetables and/,
  /^Fruits and/, /^Meat, other/, /^Poultry and/, /^Fish and seafood/,
  /^Eggs and/, /^Milk and/, /^Fats and/, /^Sugars, syrup/,
  /^Spices and/, /^Beverages, alcoholic/, /^Beverages, nonalcoholic/,
  /^Fast food/, /^Mixed food/, /^Miscellaneous/,
];

function isFoodGroupHeader(t) {
  const base = t.replace(/\s*\(continued\).*/, '');
  for (const p of GROUP_PATTERNS) {
    if (p.test(base)) return true;
  }
  return false;
}

function normalizeFoodGroup(t) {
  const base = t.replace(/\s*\(continued\).*/, '').trim();
  if (base.startsWith('Cereals')) return 'Cereals and products';
  if (base.startsWith('Starchy')) return 'Starchy roots, tubers and products';
  if (base.startsWith('Legumes')) return 'Legumes, nuts, seeds and products';
  if (base.startsWith('Vegetables')) return 'Vegetables and products';
  if (base.startsWith('Fruits')) return 'Fruits and products';
  if (base.startsWith('Meat')) return 'Meat, other animals and products';
  if (base.startsWith('Poultry')) return 'Poultry and products';
  if (base.startsWith('Fish and seafood dish')) return 'Fish and seafood dishes';
  if (base.startsWith('Fish')) return 'Fish and seafood';
  if (base.startsWith('Eggs')) return 'Eggs and products';
  if (base.startsWith('Milk')) return 'Milk and products';
  if (base.startsWith('Fats')) return 'Fats and oils';
  if (base.startsWith('Sugars')) return 'Sugars, syrup and confectionery';
  if (base.startsWith('Spices')) return 'Spices and condiments';
  if (base.startsWith('Beverages, alcoholic')) return 'Beverages, alcoholic';
  if (base.startsWith('Beverages, non')) return 'Beverages, nonalcoholic';
  if (base.startsWith('Fast food')) return 'Fast foods: franchise foods';
  if (base.startsWith('Mixed food')) return 'Mixed food dishes';
  if (base.startsWith('Miscellaneous')) return 'Miscellaneous';
  return base;
}

function isOriginLine(t) {
  return /^[A-Z]{2,3}[A-Z]?\d+(?:\s*,\s*[A-Z]{2,3}[A-Z]?\d+)*$/.test(t);
}

function hasNonLatin(t) {
  return /[\u0E00-\u0E7F\u3000-\u9FFF\u1780-\u17FF\u0E80-\u0EFF]/.test(t);
}

// ======== APPENDIX PARSER ========

function parseAppendix(lines) {
  const mapping = new Map();

  let startIdx = -1;
  for (let i = 40228; i < lines.length; i++) {
    if (lines[i].trim() === 'Appendix 1. Scientific name index') {
      startIdx = i + 1;
      break;
    }
  }
  if (startIdx === -1) return mapping;

  let endIdx = lines.length;
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].trim().startsWith('Appendix 2')) {
      endIdx = i;
      break;
    }
  }

  const appendixNoise = new Set([
    'Food ID', 'Scientific name', 'English name and description',
    'Appendix 1. Scientific name index',
  ]);

  let currentGroup = 'Unknown';

  for (let i = startIdx; i < endIdx; i++) {
    const t = lines[i].trim();
    if (!t) continue;
    if (appendixNoise.has(t)) continue;
    if (/^\d{1,2}$/.test(t)) continue;
    if (/^[A-U]$/.test(t)) continue;

    if (isFoodGroupHeader(t)) {
      currentGroup = normalizeFoodGroup(t);
      continue;
    }

    if (FOOD_ID_RE.test(t)) {
      const foodId = t;
      for (let j = i + 1; j < Math.min(i + 6, endIdx); j++) {
        const nextLine = lines[j].trim();
        if (!nextLine) continue;
        if (appendixNoise.has(nextLine)) continue;
        if (/^\d{1,2}$/.test(nextLine)) continue;
        if (/^[A-U]$/.test(nextLine)) continue;
        if (FOOD_ID_RE.test(nextLine)) break;
        if (isFoodGroupHeader(nextLine)) break;

        let name = nextLine;
        for (let k = j + 1; k < Math.min(j + 3, endIdx); k++) {
          const cont = lines[k].trim();
          if (!cont) break;
          if (FOOD_ID_RE.test(cont)) break;
          if (isFoodGroupHeader(cont)) break;
          if (appendixNoise.has(cont)) break;
          if (/^[A-Z][a-z]+(?:ceae|ales|us|um|is|a|e)\b/.test(cont) || /^[A-Z][a-z]+ [a-z]+$/.test(cont)) break;
          if (/^[a-z]/.test(cont) || cont.startsWith('(') || cont.startsWith(',')) {
            name += ' ' + cont;
          } else break;
        }

        if (!mapping.has(foodId)) {
          mapping.set(foodId, { name: name.trim(), foodGroup: currentGroup });
        }
        break;
      }
    }
  }

  return mapping;
}

// ======== DATA SECTION PARSER (TOKEN STREAM) ========

/**
 * Build a token stream from the data section, then match food IDs to value runs.
 *
 * Token types:
 * - FOOD_ID: { type: 'FOOD_ID', id: string, lineNum: number }
 * - VALUE: { type: 'VALUE', value: number|null, lineNum: number }
 *
 * Everything else is skipped. This means page headers, names, origin codes,
 * non-Latin text, unit names, INFOODS tagnames, etc. are all ignored.
 * They produce "gaps" in the token stream between VALUE tokens.
 *
 * We then find VALUE runs (consecutive VALUE tokens in the stream) and
 * match each run to nearby FOOD_ID tokens.
 */
function parseDataSection(lines) {
  const DATA_START = 1835;
  const DATA_END = 40228;

  // Build token stream
  const tokens = [];
  for (let i = DATA_START; i < DATA_END; i++) {
    const t = lines[i].trim();
    if (!t) continue;
    if (t === 'Appendices') break;

    if (FOOD_ID_RE.test(t)) {
      tokens.push({ type: 'FOOD_ID', id: t, lineNum: i + 1 });
      continue;
    }

    const parsed = tryParseValue(t);
    if (parsed.ok) {
      tokens.push({ type: 'VALUE', value: parsed.value, lineNum: i + 1 });
    }
    // Everything else is silently skipped
  }

  const totalFoodIds = tokens.filter(t => t.type === 'FOOD_ID').length;
  const totalValues = tokens.filter(t => t.type === 'VALUE').length;
  console.log(`  Token stream: ${tokens.length} tokens (FOOD_ID: ${totalFoodIds}, VALUE: ${totalValues})`);

  // Find all VALUE runs (consecutive VALUE tokens)
  const valueRuns = []; // { startIdx, endIdx, values[] }
  let i = 0;
  while (i < tokens.length) {
    if (tokens[i].type !== 'VALUE') { i++; continue; }
    const start = i;
    while (i < tokens.length && tokens[i].type === 'VALUE') i++;
    const values = [];
    for (let j = start; j < i; j++) values.push(tokens[j].value);
    valueRuns.push({ startIdx: start, endIdx: i, values });
  }

  console.log(`  Value runs: ${valueRuns.length} (lengths: ${valueRuns.map(r => r.values.length).slice(0, 20).join(',')}...)`);
  console.log(`  Runs with 21+: ${valueRuns.filter(r => r.values.length >= 21).length}`);

  // Strategy: For each FOOD_ID in the token stream, try to find its 21 nutrient values.
  //
  // Pattern A (most common): FOOD_ID → text → VALUES (food ID precedes values)
  //   The values are in the value run that starts immediately after this food ID.
  //
  // Pattern B (page transitions): VALUES → page header → FOOD_ID (values precede food ID)
  //   The values are in the unclaimed tail of the value run before this food ID.
  //
  // We process all food IDs, trying Pattern A first, then Pattern B.

  const results = new Map(); // foodId → [21 values]

  // Map each token index to its value run (if it's in one)
  const tokenToRun = new Map(); // tokenIdx → run index
  for (let ri = 0; ri < valueRuns.length; ri++) {
    for (let ti = valueRuns[ri].startIdx; ti < valueRuns[ri].endIdx; ti++) {
      tokenToRun.set(ti, ri);
    }
  }

  // Track which value positions have been claimed
  const claimedPositions = new Set(); // set of token indices

  // Index food ID token positions
  const foodIdTokenPositions = [];
  for (let ti = 0; ti < tokens.length; ti++) {
    if (tokens[ti].type === 'FOOD_ID') {
      foodIdTokenPositions.push(ti);
    }
  }

  /**
   * Extract 21 nutrients from a run starting at offset.
   * Values at offset: density (skip) + 21 nutrients = 22 values.
   * Returns null if not enough unclaimed values.
   */
  function extractNutrients(runIdx, startOffset) {
    const run = valueRuns[runIdx];
    const avail = run.endIdx - (run.startIdx + startOffset);
    if (avail < 21) return null;

    // Check if these positions are unclaimed
    const baseIdx = run.startIdx + startOffset;
    const take = avail >= 22 ? 22 : 21;

    for (let k = 0; k < take; k++) {
      if (claimedPositions.has(baseIdx + k)) return null;
    }

    // Claim them
    for (let k = 0; k < take; k++) {
      claimedPositions.add(baseIdx + k);
    }

    if (take === 22) {
      // Skip density (first value), take 21 nutrients
      return run.values.slice(startOffset + 1, startOffset + 22);
    } else {
      return run.values.slice(startOffset, startOffset + 21);
    }
  }

  // Pass 1: Pattern A — food ID followed by values in the next value run
  for (const ti of foodIdTokenPositions) {
    const foodId = tokens[ti].id;
    if (results.has(foodId)) continue;

    // Find the next value run after this food ID
    for (let j = ti + 1; j < tokens.length && j < ti + 15; j++) {
      if (tokens[j].type === 'VALUE') {
        const runIdx = tokenToRun.get(j);
        if (runIdx === undefined) break;
        const run = valueRuns[runIdx];
        // The run should start at or near j
        const offset = j - run.startIdx;
        const remaining = run.endIdx - j;
        if (remaining >= 21) {
          const nutrients = extractNutrients(runIdx, offset);
          if (nutrients) {
            results.set(foodId, nutrients);
          }
        }
        break;
      }
      // If we hit another FOOD_ID, this food ID has no forward values
      if (tokens[j].type === 'FOOD_ID') break;
    }
  }

  console.log(`  After Pattern A (forward): ${results.size} foods`);

  // Pass 2: Pattern B — food ID preceded by unclaimed values (backward matching)
  // For food IDs that had no forward values, look for an unclaimed 22/21-value
  // block at the tail of the nearest preceding value run.
  for (const ti of foodIdTokenPositions) {
    const foodId = tokens[ti].id;
    if (results.has(foodId)) continue;

    // Walk backward to find the nearest VALUE token.
    // Don't break on FOOD_IDs — page headers can have food IDs between our
    // food ID and its values (e.g., AAA22's values are separated from AAA22
    // by a page header containing AAA19).
    let nearestRunIdx = -1;
    for (let j = ti - 1; j >= 0 && j > ti - 50; j--) {
      if (tokens[j].type === 'VALUE') {
        const ri = tokenToRun.get(j);
        if (ri !== undefined) nearestRunIdx = ri;
        break;
      }
    }
    if (nearestRunIdx === -1) continue;

    const run = valueRuns[nearestRunIdx];
    const runLen = run.endIdx - run.startIdx;
    if (runLen < 21) continue;

    // Split the run into aligned 22-value blocks from the start.
    // Find the LAST unclaimed block (closest to this food ID).
    const blocks = []; // { offset, take }
    let pos = 0;
    while (pos + 21 <= runLen) {
      if (pos + 22 <= runLen) {
        blocks.push({ offset: pos, take: 22 });
        pos += 22;
      } else {
        blocks.push({ offset: pos, take: 21 });
        pos += 21;
      }
    }

    // Try blocks in reverse order (last = closest to this food ID)
    for (let bi = blocks.length - 1; bi >= 0; bi--) {
      const { offset, take } = blocks[bi];
      let allFree = true;
      for (let k = 0; k < take; k++) {
        if (claimedPositions.has(run.startIdx + offset + k)) { allFree = false; break; }
      }
      if (!allFree) continue;

      // Claim and extract
      for (let k = 0; k < take; k++) claimedPositions.add(run.startIdx + offset + k);
      if (take === 22) {
        results.set(foodId, run.values.slice(offset + 1, offset + 22));
      } else {
        results.set(foodId, run.values.slice(offset, offset + 21));
      }
      break;
    }
  }

  console.log(`  After Pattern B (backward): ${results.size} foods`);

  // Also extract food names from data section (for foods not in appendix)
  const foodIdNames = new Map();
  const foodIdGroups = new Map();
  let currentGroup = 'Cereals and products';

  for (let li = DATA_START; li < DATA_END; li++) {
    const t = lines[li].trim();
    if (!t) continue;
    if (t === 'Appendices') break;

    if (isFoodGroupHeader(t)) {
      currentGroup = normalizeFoodGroup(t);
      continue;
    }

    if (FOOD_ID_RE.test(t)) {
      const foodId = t;
      foodIdGroups.set(foodId, currentGroup);

      // Look ahead for name (skip origin, non-Latin, blanks)
      const nameLines = [];
      let foundValue = false;
      for (let j = li + 1; j < Math.min(li + 15, DATA_END); j++) {
        const next = lines[j].trim();
        if (!next) continue;
        if (FOOD_ID_RE.test(next)) break;

        const pv = tryParseValue(next);
        if (pv.ok) { foundValue = true; break; }

        if (isOriginLine(next)) continue;
        if (hasNonLatin(next)) continue;
        if (isFoodGroupHeader(next)) break;

        // Skip obvious header text
        if (/^(g|mg|mcg|kcal|g\/mL|DEN|ENERC|WATER|PROCNT|FAT|CHOAVLDF|FIBTG|ASH|Main nutrients|Minerals|Vitamins)$/.test(next)) continue;
        if (/^(The Concise|The concise|ASEAN|Food ID|Origin|Density|Alternate name)/.test(next)) continue;

        nameLines.push(next);
        if (nameLines.length >= 3) break; // names are 1-3 lines max
      }

      if (nameLines.length > 0 && !foodIdNames.has(foodId)) {
        foodIdNames.set(foodId, nameLines.join(' ').trim());
      }
    }
  }

  return { results, foodIdNames, foodIdGroups };
}

// ======== MAIN ========

async function main() {
  console.log('=== ASEANFOODS (ASEAN Food Composition Database) Import ===\n');

  // Step 1: Load nutrient definitions
  console.log('Step 1: Loading nutrient definitions...');
  const nutrientDefs = JSON.parse(readFileSync(NUTRIENTS_FILE, 'utf-8'));
  const allNutrients = [...nutrientDefs];
  if (!allNutrients.find(n => n.tagname === 'ENERC')) {
    allNutrients.unshift({ name: 'Energy', tagname: 'ENERC', unit: 'kcal' });
  }
  console.log(`  Total nutrients (incl ENERC): ${allNutrients.length}`);

  // Step 2: Read data file
  console.log('\nStep 2: Reading data file...');
  const rawText = readFileSync(TXT_FILE, 'utf-8');
  const lines = rawText.split('\n');
  console.log(`  File size: ${rawText.length} bytes, ${lines.length} lines`);

  // Step 3: Parse appendix
  console.log('\nStep 3: Parsing appendix for food names...');
  const appendixNames = parseAppendix(lines);
  console.log(`  Appendix foods: ${appendixNames.size}`);

  // Step 4: Parse data section
  console.log('\nStep 4: Parsing data section...');
  const { results: foodValues, foodIdNames, foodIdGroups } = parseDataSection(lines);
  console.log(`  Foods with 21 values: ${foodValues.size}`);
  console.log(`  Foods with data-section names: ${foodIdNames.size}`);

  // Step 5: Merge
  console.log('\nStep 5: Merging...');
  const foods = new Map();
  let fromAppendix = 0;
  let fromDataSection = 0;
  let noName = 0;
  let noValues = 0;

  for (const [foodId, info] of appendixNames) {
    if (foodValues.has(foodId)) {
      const values = foodValues.get(foodId);
      const nutrients = new Map();
      for (let j = 0; j < NUTRIENT_ORDER.length; j++) {
        nutrients.set(NUTRIENT_ORDER[j], values[j] !== undefined ? values[j] : null);
      }
      foods.set(foodId, { name: info.name, foodGroup: info.foodGroup, nutrients });
      fromAppendix++;
    } else {
      noValues++;
    }
  }

  for (const [foodId, values] of foodValues) {
    if (foods.has(foodId)) continue;
    const name = foodIdNames.get(foodId);
    if (!name) { noName++; continue; }
    const foodGroup = foodIdGroups.get(foodId) || 'Unknown';
    const nutrients = new Map();
    for (let j = 0; j < NUTRIENT_ORDER.length; j++) {
      nutrients.set(NUTRIENT_ORDER[j], values[j] !== undefined ? values[j] : null);
    }
    foods.set(foodId, { name, foodGroup, nutrients });
    fromDataSection++;
  }

  console.log(`  Merged: ${foods.size} foods`);
  console.log(`    From appendix: ${fromAppendix}`);
  console.log(`    From data-section names: ${fromDataSection}`);
  console.log(`  In appendix but no values: ${noValues}`);
  console.log(`  Values but no name: ${noName}`);

  // Build flat arrays
  const foodRows = [];
  const contentRows = [];
  for (const [foodId, food] of foods) {
    foodRows.push({ foodId, name: food.name, foodGroup: food.foodGroup });
    for (const [nutrientCode, value] of food.nutrients) {
      if (value !== null && value !== undefined) {
        contentRows.push({ foodId, nutrientCode, value });
      }
    }
  }
  console.log(`  Food rows: ${foodRows.length}`);
  console.log(`  Content rows: ${contentRows.length}`);

  // Sample
  console.log('\n  Sample parsed foods:');
  let count = 0;
  for (const [foodId, food] of foods) {
    if (count++ >= 8) break;
    const vals = [...food.nutrients.entries()].filter(([,v]) => v !== null).slice(0, 5).map(([k, v]) => `${k}=${v}`).join(', ');
    console.log(`    ${foodId}: "${food.name}" (${food.foodGroup}) — ${food.nutrients.size}n [${vals}]`);
  }

  // Spot-check
  console.log('\n  Spot-check:');
  const checks = [
    { id: 'AAA29', name: 'Corn flakes', enerc: 373, water: 2.6 },
    { id: 'AAA22', name: 'Corn flakes, sugar coated', enerc: 379, water: 2.5 },
    { id: 'AAB6', name: 'Cassava', enerc: 146, water: 61.9 },
    { id: 'AAD48', name: 'Horseradish', enerc: 47, water: 86.2 },
    { id: 'AAG115', name: 'Sardine', enerc: 93, water: 76.2 },
  ];
  for (const c of checks) {
    if (foods.has(c.id)) {
      const f = foods.get(c.id);
      const enerc = f.nutrients.get('ENERC');
      const water = f.nutrients.get('WATER');
      const ok = enerc === c.enerc && water === c.water ? '✓' : `✗ expected ENERC=${c.enerc},WATER=${c.water}`;
      console.log(`    ${c.id}: "${f.name}" ENERC=${enerc} WATER=${water} ${ok}`);
    } else {
      console.log(`    ${c.id}: NOT FOUND (expected: ${c.name})`);
    }
  }

  // Step 6: Insert into database
  console.log('\nStep 6: Inserting into database...');
  await sql`DELETE FROM source_aseanfoods_content`;
  await sql`DELETE FROM source_aseanfoods_nutrients`;
  await sql`DELETE FROM source_aseanfoods_foods`;
  console.log('  Cleared existing data');

  for (const nd of allNutrients) {
    await sql`INSERT INTO source_aseanfoods_nutrients (nutrient_code, name, unit)
      VALUES (${nd.tagname}, ${nd.name}, ${nd.unit})
      ON CONFLICT (nutrient_code) DO NOTHING`;
  }
  console.log(`  ${allNutrients.length} nutrients inserted`);

  for (let b = 0; b < foodRows.length; b += FOOD_BATCH_SIZE) {
    const chunk = foodRows.slice(b, b + FOOD_BATCH_SIZE);
    await sql`INSERT INTO source_aseanfoods_foods ${sql(
      chunk.map(f => ({ food_id: f.foodId, name: f.name, food_group: f.foodGroup })),
      'food_id', 'name', 'food_group'
    )} ON CONFLICT (food_id) DO UPDATE SET name = EXCLUDED.name, food_group = EXCLUDED.food_group`;
  }
  console.log(`  ${foodRows.length} foods inserted`);

  let inserted = 0;
  for (let b = 0; b < contentRows.length; b += CONTENT_BATCH_SIZE) {
    const chunk = contentRows.slice(b, b + CONTENT_BATCH_SIZE);
    await sql`INSERT INTO source_aseanfoods_content ${sql(
      chunk.map(c => ({ food_id: c.foodId, nutrient_code: c.nutrientCode, value: c.value })),
      'food_id', 'nutrient_code', 'value'
    )}`;
    inserted += chunk.length;
    if (inserted % 5000 === 0 || b + CONTENT_BATCH_SIZE >= contentRows.length) {
      console.log(`    ${inserted}/${contentRows.length} content rows...`);
    }
  }

  // Step 7: Indexes
  console.log('\nStep 7: Creating indexes...');
  await sql`CREATE INDEX IF NOT EXISTS idx_aseanfoods_content_food_id ON source_aseanfoods_content(food_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_aseanfoods_content_nutrient ON source_aseanfoods_content(nutrient_code)`;
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_aseanfoods_foods_name ON source_aseanfoods_foods USING gin(name gin_trgm_ops)`;
  } catch (e) { /* pg_trgm not enabled */ }
  console.log('  Indexes created');

  // Step 8: Summary
  console.log('\n=== Summary ===');
  const fc = await sql`SELECT COUNT(*)::int as count FROM source_aseanfoods_foods`;
  const nc = await sql`SELECT COUNT(*)::int as count FROM source_aseanfoods_nutrients`;
  const cc = await sql`SELECT COUNT(*)::int as count FROM source_aseanfoods_content`;
  console.log(`Foods: ${fc[0].count}, Nutrients: ${nc[0].count}, Content: ${cc[0].count}`);

  const stats = await sql`SELECT nutrient_code, COUNT(*)::int as count FROM source_aseanfoods_content WHERE value IS NOT NULL GROUP BY nutrient_code ORDER BY count DESC`;
  console.log('\nNutrient coverage (non-null values):');
  for (const s of stats) console.log(`  ${s.nutrient_code}: ${s.count}`);

  const groups = await sql`SELECT food_group, COUNT(*)::int as count FROM source_aseanfoods_foods GROUP BY food_group ORDER BY count DESC`;
  console.log('\nFood group distribution:');
  for (const g of groups) console.log(`  ${g.food_group}: ${g.count}`);

  await sql.end();
  console.log('\nDone!');
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
