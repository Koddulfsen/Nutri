/**
 * KFCT (Korean Food Composition Table) Import Script
 *
 * Imports KFCT 9th Revision data from linearized PDF text into staging tables.
 * Strategy:
 *   1. Parse INDEX section from vol1 → global_index → { food_code, food_name }
 *   2. Scan each volume sequentially, detecting section headers
 *   3. For each LEFT section: read indices → skip food names → find tags → read units → read values
 *   4. For each RIGHT section: find tags → read units → read values (reusing LEFT indices)
 *   5. Cross-reference with INDEX, insert into DB
 */

import { readFileSync } from 'fs';
import { createBoundsGuard } from '../_shared/bounds.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONTENT_BATCH_SIZE = 1000;
const DATA_DIR = join(__dirname, '../../../data/kfct');
const VOL1_FILE = join(DATA_DIR, 'kfct_vol1.txt');
const VOL2_FILE = join(DATA_DIR, 'kfct_vol2.txt');
const NUTRIENTS_FILE = join(DATA_DIR, 'nutrients.json');

const dbUrl = process.env.DATABASE_URL;
const sql = postgres(dbUrl, { ssl: 'require', max: 5 });

// Tag sequences per section
const TAG_SETS = {
  VOL1_LEFT: ['ENERC', 'WATER', 'PROCNP', 'FAT', 'ASH', 'CHOTDF', 'SUGAR', 'FIBTG'],
  VOL1_RIGHT: ['AAT19', 'AAE10A', 'AANE', 'FAFREF', 'FAESSF', 'FASATF', 'FAMSF', 'FAPUF', 'CHOLE', 'NACL'],
  VOL2_LEFT: ['CA', 'FE', 'MG', 'P', 'K', 'NA', 'ZN', 'CU', 'MN', 'SE', 'MO', 'ID'],
  VOL2_RIGHT: ['RETOL', 'CARTB', 'VITD', 'VITE', 'VITK1', 'THIA', 'RIBF', 'NIA', 'PANTAC', 'PYRXN', 'BIOT', 'FOL', 'VITB12', 'VITC'],
};

const ALL_TAGS = new Set(Object.values(TAG_SETS).flat());
const UNITS = new Set(['g', 'mg', 'µg', 'μg', 'kcal', 'kJ', '%']);

const FOOD_GROUPS = {
  '01': 'Cereals', '02': 'Potatoes and Starches', '03': 'Sugars and Sweeteners',
  '04': 'Pulses', '05': 'Nuts and Seeds', '06': 'Vegetables',
  '07': 'Mushrooms', '08': 'Fruits', '09': 'Meats', '10': 'Eggs',
  '11': 'Fishes', '12': 'Seaweeds', '13': 'Milks and Milk Products',
  '14': 'Oils and Fats', '15': 'Teas', '16': 'Beverages',
  '17': 'Alcohols', '18': 'Seasonings', '19': 'Prepared Foods', '20': 'Others',
};

const SOURCE_PATTERNS = [
  /^농진청/, /^축산원/, /^수과원/, /^식약처/, /^국과원/,
  /^JAPAN/, /^US[A-Z]?/, /^EU/, /^CN\b/, /^NZ/, /^TW/,
];

function isSourceRef(line) {
  return SOURCE_PATTERNS.some(p => p.test(line));
}

function isNumericValue(line) {
  if (line === '-' || line === 'Tr' || line === 'tr' || line === '(Tr)' || line === '(tr)') return true;
  if (/^\(?\d/.test(line)) return true;
  if (/^0$/.test(line)) return true;
  return false;
}

/**
 * Strict numeric value check: requires pure number string.
 * Rejects "161 Noodle..." (merged index+name) but accepts "161", "3.14", "(0.5)", "-", "Tr".
 */
function isStrictNumericValue(line) {
  if (line === '-' || line === 'Tr' || line === 'tr' || line === '(Tr)' || line === '(tr)') return true;
  if (/^\(?\d+(\.\d+)?\)?$/.test(line)) return true;
  if (line === '0') return true;
  return false;
}

function parseValue(str) {
  if (str === '-') return null;
  if (str === 'Tr' || str === 'tr' || str === '(Tr)' || str === '(tr)') return 0;
  if (str === '0') return 0;
  const parenMatch = str.match(/^\((.+)\)$/);
  if (parenMatch) {
    const inner = parenMatch[1].trim();
    if (inner === 'Tr' || inner === 'tr') return 0;
    const num = parseFloat(inner);
    return isNaN(num) ? null : num;
  }
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

// ─── INDEX PARSER ────────────────────────────────────────────

function parseIndex(lines) {
  const indexMap = new Map();

  // Find "Index &\nFood Code" header
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'Index &' && lines[i+1]?.trim() === 'Food Code') {
      start = i;
      break;
    }
  }

  // Find "찾아보기" end marker
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (lines[i].trim().startsWith('찾아보기')) { end = i; break; }
  }

  console.log(`  INDEX range: lines ${start+1}-${end}`);

  const skipLines = new Set([
    '색인 및 식품코드', 'Index &', 'Food Code',
    '식품코드', '식품명', '색인',
    'Food Code', 'Food and Description', 'Index',
  ]);

  let i = start;
  while (i < end) {
    const line = lines[i].trim();
    if (line === '' || skipLines.has(line)) { i++; continue; }

    // Food code + name on same line
    const m = line.match(/^([A-Z]\S+)\s+(.+)$/);
    if (m) {
      const foodCode = m[1];
      const foodName = m[2].trim();
      // Next non-blank = global index
      i++;
      while (i < end && lines[i].trim() === '') i++;
      if (i < end) {
        const idx = parseInt(lines[i].trim(), 10);
        if (!isNaN(idx) && idx >= 1 && idx <= 5000) {
          indexMap.set(idx, { foodCode, foodName });
        }
        i++;
      }
      continue;
    }

    i++;
  }

  return indexMap;
}

// ─── SEQUENTIAL DATA PARSER ────────────────────────────────

/**
 * Parse all data from a volume by scanning sequentially.
 * Detects section headers ("foodgroup_ ENGLISH\n일반성분 Proximates" or "무기질 Minerals")
 * and parses LEFT then RIGHT pages.
 *
 * Handles three section types:
 * 1. Main (Index first) - indices listed upfront, all values continuous
 * 2. Main (食품명 first) - food names first, then indices, all values continuous
 * 3. Continuation (에너지 first) - no indices/names, values may be interleaved with overflow food names
 */
function parseVolume(lines, volumeNum) {
  const leftTags = volumeNum === 1 ? TAG_SETS.VOL1_LEFT : TAG_SETS.VOL2_LEFT;
  const rightTags = volumeNum === 1 ? TAG_SETS.VOL1_RIGHT : TAG_SETS.VOL2_RIGHT;

  const leftType = volumeNum === 1 ? '일반성분 Proximates' : '무기질 Minerals';
  const leftTypePrefix = leftType.split(' ')[0]; // 일반성분 or 무기질

  const data = new Map(); // globalIndex → { tag → value }
  const foodGroups = new Map(); // globalIndex → group

  let currentGroup = '';
  let lastMaxIndex = 0; // Track highest index across all sections
  let i = 0;

  // Skip front matter
  const skipMarker = volumeNum === 1 ? 'xxx' : 'xiv';
  for (; i < lines.length; i++) {
    if (lines[i].trim() === skipMarker) { i++; break; }
  }

  while (i < lines.length) {
    const line = lines[i].trim();

    // Stop at INDEX section
    if (line === '색인 및 식품코드' || (line === 'Index &' && lines[i+1]?.trim() === 'Food Code')) {
      break;
    }

    // Detect food group code ("01", "02", ...)
    if (/^\d{2}$/.test(line) && FOOD_GROUPS[line]) {
      const nb = nextNonBlank(lines, i + 1);
      if (nb !== null && /[\uAC00-\uD7AF]/.test(lines[nb].trim())) {
        currentGroup = FOOD_GROUPS[line];
      }
      i++;
      continue;
    }

    // Detect section header: "foodgroup_ ENGLISH"
    if (line.includes('_ ') && /[A-Z]{3,}/.test(line)) {
      const nb = nextNonBlank(lines, i + 1);
      if (nb !== null && lines[nb].trim().startsWith(leftTypePrefix)) {
        // Determine section type by checking what follows the type marker
        const startLine = nb + 1;
        let sectionType = 'continuation';
        for (let k = startLine; k < Math.min(startLine + 20, lines.length); k++) {
          const ll = lines[k].trim();
          if (ll === '') continue;
          if (ll === 'Index' || ll === 'No.') { sectionType = 'main'; break; }
          if (ll === '식품명') { sectionType = 'main'; break; }
          break; // First non-blank is neither → continuation
        }

        let result;
        if (sectionType === 'main') {
          result = parseLeftSection(lines, startLine, leftTags);
          // Fall back to continuation parsing if main section had no indices
          if (!result || result.foodIndices.length === 0) {
            result = parseContinuationSection(lines, startLine, leftTags, lastMaxIndex);
          }
        } else {
          result = parseContinuationSection(lines, startLine, leftTags, lastMaxIndex);
        }

        if (result && result.foodIndices.length > 0) {
          // Update lastMaxIndex
          const maxIdx = Math.max(...result.foodIndices);
          if (maxIdx > lastMaxIndex) lastMaxIndex = maxIdx;

          // Store data
          for (const [idx, nutrients] of result.tagValues) {
            if (!data.has(idx)) data.set(idx, new Map());
            for (const [tag, val] of nutrients) data.get(idx).set(tag, val);
            foodGroups.set(idx, currentGroup);
          }

          // Now parse RIGHT page
          const rightResult = parseRightSection(lines, result.endLine, rightTags, result.foodIndices);
          if (rightResult) {
            for (const [idx, nutrients] of rightResult.tagValues) {
              if (!data.has(idx)) data.set(idx, new Map());
              for (const [tag, val] of nutrients) data.get(idx).set(tag, val);
            }
            i = rightResult.endLine;
          } else {
            i = result.endLine;
          }
          continue;
        }
      }
    }

    i++;
  }

  return { data, foodGroups };
}

/**
 * Parse a CONTINUATION section (no Index/식품명 markers).
 * Starts directly with Korean nutrient names → INFOODS tags → units → values.
 * Values may be interleaved with overflow food names between batches.
 */
function parseContinuationSection(lines, startLine, expectedTags, lastMaxIndex) {
  let i = startLine;

  // Skip blanks
  while (i < lines.length && lines[i].trim() === '') i++;

  // Find INFOODS tags (skip Korean nutrient names)
  const tags = collectTags(lines, i, expectedTags);
  if (!tags) return null;
  i = tags.endLine;

  // Read units
  const units = [];
  while (i < lines.length && units.length < tags.tags.length) {
    const l = lines[i].trim();
    if (l === '') { i++; continue; }
    if (UNITS.has(l)) { units.push(l); i++; }
    else break;
  }

  const numNutrients = tags.tags.length;

  // Read ALL values, skipping interleaved food names (Korean/English text)
  // Stop at: 식품명, 가식부, section headers, INDEX markers
  const values = readValuesContinuation(lines, i, numNutrients);
  i = values.endLine;

  const actualFoods = Math.floor(values.values.length / numNutrients);
  if (actualFoods === 0) return null;

  if (values.values.length % numNutrients !== 0) {
    // Trim to complete foods
    values.values.length = actualFoods * numNutrients;
  }

  // Generate sequential indices from lastMaxIndex + 1
  const foodIndices = [];
  for (let f = 0; f < actualFoods; f++) {
    foodIndices.push(lastMaxIndex + 1 + f);
  }

  // Build result
  const tagValues = new Map();
  for (let f = 0; f < actualFoods; f++) {
    const idx = foodIndices[f];
    const nutrients = new Map();
    for (let n = 0; n < numNutrients; n++) {
      const vi = f * numNutrients + n;
      if (vi < values.values.length && values.values[vi] !== null) {
        nutrients.set(tags.tags[n], values.values[vi]);
      }
    }
    if (nutrients.size > 0) tagValues.set(idx, nutrients);
  }

  return { foodIndices, tagValues, endLine: i };
}

/**
 * Read values for continuation sections.
 * Skips non-numeric text (interleaved food names) but stops at markers.
 * Uses strict numeric check to avoid reading merged index+name lines as values.
 */
function readValuesContinuation(lines, startLine, numNutrients) {
  const values = [];
  let i = startLine;
  const maxScan = 5000;
  let scanned = 0;

  while (i < lines.length && scanned < maxScan) {
    const l = lines[i].trim();
    if (l === '') { i++; scanned++; continue; }

    // Hard stop conditions
    if (l.startsWith('가식부 100g')) break;
    if (l === '식품명') break;
    if (l === 'Index') break;
    if (l.includes('_ ') && /[A-Z]{3,}/.test(l)) break;
    if (l === '색인 및 식품코드') break;

    // Strict numeric value check (pure number only, not "161 Noodle...")
    if (isStrictNumericValue(l)) {
      values.push(parseValue(l));
      i++;
      scanned++;
      continue;
    }

    // Non-numeric text: skip it (interleaved food names)
    i++;
    scanned++;
  }

  return { values, endLine: i };
}

/**
 * Parse a LEFT section starting after the section type marker.
 *
 * Vol1 pattern: "Index\nNo.\n" → indices → "식품명\nFood and Description" → food names → Korean nutrients → INFOODS tags → units → values
 * Vol2 pattern: "식품명\nFood and Description" → "Index\nNo.\n" → indices → food names → Korean nutrients → INFOODS tags → units → values
 */
function parseLeftSection(lines, startLine, expectedTags) {
  let i = startLine;

  // Skip blanks
  while (i < lines.length && lines[i].trim() === '') i++;

  // Detect pattern: does "Index/No." or "식품명" come first?
  let indexFirst = false;
  let foodNameFirst = false;

  // Look at first non-blank lines to find which marker comes first
  for (let k = i; k < Math.min(i + 20, lines.length); k++) {
    const l = lines[k].trim();
    if (l === '') continue;
    if (l === 'Index' || l === 'No.') { indexFirst = true; break; }
    if (l === '식품명') { foodNameFirst = true; break; }
  }

  const foodIndices = [];

  if (foodNameFirst) {
    // Vol2 pattern: skip "식품명" and "Food and Description", then "Index" and "No.", then read indices

    // Skip "식품명"
    while (i < lines.length) {
      if (lines[i].trim() === '식품명') { i++; break; }
      i++;
    }
    // Skip "Food and Description"
    while (i < lines.length && lines[i].trim() === '') i++;
    if (lines[i]?.trim() === 'Food and Description') i++;
    while (i < lines.length && lines[i].trim() === '') i++;

    // Skip "Index" and "No."
    if (lines[i]?.trim() === 'Index') {
      i++;
      while (i < lines.length && lines[i].trim() === '') i++;
    }
    if (lines[i]?.trim() === 'No.') {
      i++;
      while (i < lines.length && lines[i].trim() === '') i++;
    }

    // Read index numbers (sequential, increasing)
    while (i < lines.length) {
      const l = lines[i].trim();
      if (l === '') { i++; continue; }
      const num = parseInt(l, 10);
      if (!isNaN(num) && num >= 1 && num <= 5000 && String(num) === l) {
        // Check if sequential: must be >= last index or first index
        if (foodIndices.length === 0 || num >= foodIndices[foodIndices.length - 1]) {
          foodIndices.push(num);
          i++;
        } else {
          // Non-sequential number = page number, skip it
          i++;
          break;
        }
      } else {
        break;
      }
    }

    // Skip food names (Korean + English pairs) — we don't need them, INDEX has names
    while (i < lines.length) {
      const l = lines[i].trim();
      if (l === '') { i++; continue; }

      // Stop when we hit Korean nutrient names or INFOODS tags
      if (ALL_TAGS.has(l)) break;
      if (isKoreanNutrient(l)) break;

      // Food names contain Korean chars
      if (/[\uAC00-\uD7AF]/.test(l)) {
        i++; // Korean name
        // Skip English name
        while (i < lines.length && lines[i].trim() === '') i++;
        const eng = lines[i]?.trim() || '';
        // Check for merged index (e.g., "11 Buckwheat noodle, ...")
        if (/^\d+\s+/.test(eng)) i++;
        else if (eng && !ALL_TAGS.has(eng) && !isKoreanNutrient(eng)) i++;
        continue;
      }

      i++;
    }
  } else {
    // Vol1 pattern: Skip "Index" and "No.", read indices, skip food names

    // Skip "Index" and "No."
    while (i < lines.length) {
      const l = lines[i].trim();
      if (l === 'Index' || l === 'No.' || l === '') { i++; continue; }
      break;
    }

    // Read index numbers (sequential, increasing)
    while (i < lines.length) {
      const l = lines[i].trim();
      if (l === '') { i++; continue; }
      const num = parseInt(l, 10);
      if (!isNaN(num) && num >= 1 && num <= 5000 && String(num) === l) {
        if (foodIndices.length === 0 || num >= foodIndices[foodIndices.length - 1]) {
          foodIndices.push(num);
          i++;
        } else {
          // Non-sequential = page number, skip
          i++;
          break;
        }
      } else {
        break;
      }
    }

    // Skip "식품명" and "Food and Description"
    while (i < lines.length) {
      const l = lines[i].trim();
      if (l === '식품명') { i++; break; }
      if (l === '') { i++; continue; }
      // Sometimes there's no "식품명" marker, just food names start
      if (/[\uAC00-\uD7AF]/.test(l)) break;
      i++;
    }
    while (i < lines.length && lines[i].trim() === '') i++;
    if (lines[i]?.trim() === 'Food and Description') {
      i++;
      while (i < lines.length && lines[i].trim() === '') i++;
    }

    // Skip food names
    while (i < lines.length) {
      const l = lines[i].trim();
      if (l === '') { i++; continue; }

      if (ALL_TAGS.has(l)) break;
      if (isKoreanNutrient(l)) break;

      if (/[\uAC00-\uD7AF]/.test(l)) {
        i++; // Korean name
        while (i < lines.length && lines[i].trim() === '') i++;
        const eng = lines[i]?.trim() || '';
        if (eng && !ALL_TAGS.has(eng) && !isKoreanNutrient(eng) && !/^\d+$/.test(eng)) {
          i++;
          // Handle multi-line English names
          while (i < lines.length && lines[i].trim() === '') i++;
          // Check for continuation line (e.g., "Cooked" or "Boiled")
          const cont = lines[i]?.trim() || '';
          if (cont && /^[A-Z][a-z]/.test(cont) && !ALL_TAGS.has(cont) && !isKoreanNutrient(cont) &&
              cont.length < 30 && !/[\uAC00-\uD7AF]/.test(cont)) {
            // Might be continuation, but could also be next Korean name
            // Don't consume — let next iteration handle
          }
        }
        continue;
      }

      i++;
    }
  }

  if (foodIndices.length === 0) return null;

  // Now scan for INFOODS tags (skip Korean nutrient names)
  const tags = collectTags(lines, i, expectedTags);
  if (!tags) return null;
  i = tags.endLine;

  // Read units
  const units = [];
  while (i < lines.length && units.length < tags.tags.length) {
    const l = lines[i].trim();
    if (l === '') { i++; continue; }
    if (UNITS.has(l)) { units.push(l); i++; }
    else break;
  }

  // Read ALL values until non-numeric text (overflow food names)
  const numNutrients = tags.tags.length;
  const values = readValues(lines, i);
  i = values.endLine;

  // Calculate actual number of foods from values read
  const actualFoods = Math.floor(values.values.length / numNutrients);
  if (values.values.length % numNutrients !== 0) {
    console.warn(`  Warning: ${values.values.length} values not divisible by ${numNutrients} nutrients (${values.values.length % numNutrients} extra)`);
  }

  // Extend food indices for overflow foods
  if (actualFoods > foodIndices.length) {
    const maxIdx = Math.max(...foodIndices);
    for (let extra = foodIndices.length; extra < actualFoods; extra++) {
      foodIndices.push(maxIdx + (extra - foodIndices.length + 1));
    }
  }

  // Build result
  const tagValues = new Map();
  for (let f = 0; f < actualFoods; f++) {
    const idx = foodIndices[f];
    const nutrients = new Map();
    for (let n = 0; n < numNutrients; n++) {
      const vi = f * numNutrients + n;
      if (vi < values.values.length && values.values[vi] !== null) {
        nutrients.set(tags.tags[n], values.values[vi]);
      }
    }
    if (nutrients.size > 0) tagValues.set(idx, nutrients);
  }

  return { foodIndices, tagValues, endLine: i };
}

/**
 * Parse a RIGHT section.
 * Starts after the LEFT section ends.
 * May have overflow food items (indices merged into names), then "가식부 100g 기준" marker,
 * then section label, then Korean names, INFOODS tags, units, values.
 *
 * Values include:
 * Vol1 RIGHT: numNutrients values + refuse%(number) + source(text) per food
 * Vol2 RIGHT: numNutrients values + source(text) per food
 */
function parseRightSection(lines, startLine, expectedTags, foodIndices) {
  let i = startLine;

  // Find "가식부 100g 기준" marker
  const maxSearch = 500;
  let found = false;
  for (let k = 0; k < maxSearch && i + k < lines.length; k++) {
    if (lines[i + k].trim().startsWith('가식부 100g')) {
      i = i + k + 1;
      found = true;
      break;
    }
    // If we hit a new food group, stop
    if (/^\d{2}$/.test(lines[i + k].trim()) && FOOD_GROUPS[lines[i + k].trim()]) {
      const nb = nextNonBlank(lines, i + k + 1);
      if (nb && /[\uAC00-\uD7AF]/.test(lines[nb].trim())) return null;
    }
  }
  if (!found) return null;

  // Skip section label and Korean nutrient names until INFOODS tags
  const tags = collectTags(lines, i, expectedTags);
  if (!tags) return null;
  i = tags.endLine;

  // Read units
  const units = [];
  while (i < lines.length && units.length < tags.tags.length) {
    const l = lines[i].trim();
    if (l === '') { i++; continue; }
    if (UNITS.has(l)) { units.push(l); i++; }
    else break;
  }

  // Read values with source refs
  // Each food has: numNutrients values, then optional extras (refuse%, source text)
  const numFoods = foodIndices.length;
  const numNutrients = tags.tags.length;

  // Read all items (values + source refs)
  const items = readValuesWithSources(lines, i, numFoods, numNutrients);
  i = items.endLine;

  // Build result
  const tagValues = new Map();
  for (let f = 0; f < numFoods; f++) {
    const idx = foodIndices[f];
    const nutrients = new Map();
    for (let n = 0; n < numNutrients; n++) {
      const vi = f * numNutrients + n;
      if (vi < items.values.length && items.values[vi] !== null) {
        nutrients.set(tags.tags[n], items.values[vi]);
      }
    }
    if (nutrients.size > 0) tagValues.set(idx, nutrients);
  }

  return { tagValues, endLine: i };
}

/**
 * Collect INFOODS tags from current position, skipping Korean nutrient names.
 * Handles tags that may be split into two groups (due to PDF two-column layout).
 */
function collectTags(lines, startLine, expectedTags) {
  let i = startLine;
  const expectedSet = new Set(expectedTags);
  const tags = [];
  const maxScan = 200;
  let scanned = 0;

  while (i < lines.length && tags.length < expectedTags.length && scanned < maxScan) {
    const l = lines[i].trim();
    if (l === '') { i++; scanned++; continue; }

    if (expectedSet.has(l) && !tags.includes(l)) {
      tags.push(l);
      i++;
      scanned++;
    } else if (UNITS.has(l)) {
      // Hit units — remaining tags might come after some units
      // Check if there are more tags interspersed with units
      // Collect all remaining tags and units together
      const remaining = collectRemainingTagsAndUnits(lines, i, expectedTags, tags);
      if (remaining) {
        for (const t of remaining.tags) {
          if (!tags.includes(t)) tags.push(t);
        }
        i = remaining.endLine;
      }
      break;
    } else {
      // Skip Korean nutrient names and other text
      i++;
      scanned++;
    }
  }

  if (tags.length === 0) return null;
  return { tags, endLine: i };
}

/**
 * When tags and units are interleaved (RIGHT page), collect remaining tags.
 */
function collectRemainingTagsAndUnits(lines, startLine, expectedTags, alreadyFound) {
  const expectedSet = new Set(expectedTags);
  const tags = [];
  let i = startLine;
  const maxScan = 100;
  let scanned = 0;

  while (i < lines.length && scanned < maxScan) {
    const l = lines[i].trim();
    if (l === '') { i++; scanned++; continue; }

    if (expectedSet.has(l) && !alreadyFound.includes(l) && !tags.includes(l)) {
      tags.push(l);
    } else if (UNITS.has(l)) {
      // Skip units
    } else if (isNumericValue(l)) {
      // Hit values — stop
      break;
    } else {
      // Skip Korean text
    }
    i++;
    scanned++;
  }

  return { tags, endLine: i };
}

/**
 * Read values from current position.
 * Values are numbers, "-" (null), "Tr" (0), one per line with blank separators.
 * Stops at any non-numeric text (overflow food names, English fragments, etc.)
 */
function readValues(lines, startLine) {
  const values = [];
  let i = startLine;
  const maxScan = 5000;
  let scanned = 0;

  while (i < lines.length && scanned < maxScan) {
    const l = lines[i].trim();
    if (l === '') { i++; scanned++; continue; }

    // Stop conditions
    if (l.includes('_ ') && /[A-Z]{3,}/.test(l)) break;
    if (l === '식품명' || l === 'Index') break;
    if (l.startsWith('가식부 100g')) break;
    if (l === '색인 및 식품코드') break;

    // Stop at any non-numeric text (overflow food names, English text)
    if (!isNumericValue(l)) break;

    values.push(parseValue(l));
    i++;
    scanned++;
  }

  return { values, endLine: i };
}

/**
 * Read values with interleaved source references (for RIGHT pages).
 * Source refs are Korean text that appears after the nutrient values for each food.
 * Pattern per food: [numNutrients values] [0-2 extra items: refuse%, source text]
 */
function readValuesWithSources(lines, startLine, numFoods, numNutrients) {
  const values = []; // Only nutrient values (not refuse/source)
  let i = startLine;
  let valuesPerFood = 0;
  let foodsDone = 0;
  const maxScan = numFoods * (numNutrients + 3) * 4;
  let scanned = 0;

  while (i < lines.length && foodsDone < numFoods && scanned < maxScan) {
    const l = lines[i].trim();
    if (l === '') { i++; scanned++; continue; }

    // Stop conditions
    if (l.includes('_ ') && /[A-Z]{3,}/.test(l)) break;
    if (l === '식품명' || l === 'Index') break;
    if (l === '색인 및 식품코드') break;
    if (/^\d{2}$/.test(l) && FOOD_GROUPS[l]) {
      const nb = nextNonBlank(lines, i + 1);
      if (nb && /[\uAC00-\uD7AF]/.test(lines[nb].trim())) break;
    }

    if (isSourceRef(l)) {
      // Source ref marks end of current food's data
      if (valuesPerFood > 0) {
        foodsDone++;
        valuesPerFood = 0;
      }
      i++;
      scanned++;
      continue;
    }

    if (isNumericValue(l)) {
      if (valuesPerFood < numNutrients) {
        values.push(parseValue(l));
        valuesPerFood++;
      } else {
        // Extra value (refuse rate%) — skip
        valuesPerFood++;
      }
      i++;
      scanned++;
    } else {
      // Unknown text — skip
      i++;
      scanned++;
    }
  }

  // Handle last food if no trailing source ref
  if (valuesPerFood >= numNutrients) foodsDone++;

  return { values, endLine: i };
}

function nextNonBlank(lines, start) {
  for (let i = start; i < Math.min(start + 10, lines.length); i++) {
    if (lines[i].trim() !== '') return i;
  }
  return null;
}

const KOREAN_NUTRIENT_PARTS = [
  '에너지', '수분', '단백질', '지질', '회분', '탄수화물', '당류', '식이섬유',
  '칼슘', '철', '마그', '네슘', '인', '칼륨', '나트륨', '아연', '구리', '망간',
  '셀레늄', '몰리', '브덴', '요오드', '비타민', '레티놀', '베타', '카로틴',
  '니아신', '판토', '텐산', '비오틴', '엽산', '아미노산', '지방산', '콜레',
  '스테롤', '식염', '상당량', '폐기율', '필수', '비필수', '총포화', '총단일',
  '불포화', '총다중', '총',
];

function isKoreanNutrient(line) {
  return KOREAN_NUTRIENT_PARTS.some(part => line.includes(part));
}

// ─── MAIN ────────────────────────────────────────────────────

async function main() {
  console.log('=== KFCT 9th Revision (Korea) Import ===\n');

  // Step 1: Load nutrient definitions
  console.log('Step 1: Loading nutrient definitions...');
  const nutrientDefs = JSON.parse(readFileSync(NUTRIENTS_FILE, 'utf-8'));
  console.log(`  Loaded ${nutrientDefs.length} definitions`);

  // Step 2: Parse INDEX
  console.log('\nStep 2: Parsing INDEX...');
  const vol1Lines = readFileSync(VOL1_FILE, 'utf-8').split('\n');
  console.log(`  Vol1: ${vol1Lines.length} lines`);
  const indexMap = parseIndex(vol1Lines);
  console.log(`  Parsed ${indexMap.size} food entries`);
  const allIdx = [...indexMap.keys()].sort((a, b) => a - b);
  if (allIdx.length > 0) console.log(`  Range: ${allIdx[0]}-${allIdx[allIdx.length-1]}`);

  // Step 3: Parse Vol1
  console.log('\nStep 3: Parsing Vol1 (Proximates, Summary)...');
  const vol1Result = parseVolume(vol1Lines, 1);
  console.log(`  Vol1: ${vol1Result.data.size} foods`);

  // Step 4: Parse Vol2
  console.log('\nStep 4: Parsing Vol2 (Minerals, Vitamins)...');
  const vol2Lines = readFileSync(VOL2_FILE, 'utf-8').split('\n');
  console.log(`  Vol2: ${vol2Lines.length} lines`);
  const vol2Result = parseVolume(vol2Lines, 2);
  console.log(`  Vol2: ${vol2Result.data.size} foods`);

  // Step 5: Merge
  console.log('\nStep 5: Merging...');
  const mergedData = new Map();
  const mergedGroups = new Map();

  for (const [idx, nutrients] of vol1Result.data) {
    if (!mergedData.has(idx)) mergedData.set(idx, new Map());
    for (const [tag, val] of nutrients) mergedData.get(idx).set(tag, val);
    if (vol1Result.foodGroups.has(idx)) mergedGroups.set(idx, vol1Result.foodGroups.get(idx));
  }
  for (const [idx, nutrients] of vol2Result.data) {
    if (!mergedData.has(idx)) mergedData.set(idx, new Map());
    for (const [tag, val] of nutrients) mergedData.get(idx).set(tag, val);
    if (vol2Result.foodGroups.has(idx)) mergedGroups.set(idx, vol2Result.foodGroups.get(idx));
  }

  let totalContent = 0;
  for (const [, n] of mergedData) totalContent += n.size;
  console.log(`  Merged: ${mergedData.size} foods, ${totalContent} content rows`);

  // Step 6: Cross-reference
  console.log('\nStep 6: Cross-referencing with INDEX...');
  const foods = [];
  let content = [];
  let matched = 0, unmatched = 0;

  for (const [idx, nutrients] of mergedData) {
    const entry = indexMap.get(idx);
    if (!entry) { unmatched++; continue; }
    matched++;
    const group = mergedGroups.get(idx) || null;
    foods.push({ foodCode: entry.foodCode, foodName: entry.foodName, foodGroup: group });
    for (const [tag, val] of nutrients) {
      content.push({ foodCode: entry.foodCode, tagname: tag, value: val });
    }
  }
  console.log(`  Matched: ${matched}, Unmatched: ${unmatched}`);
  console.log(`  Content rows: ${content.length}`);

  // Step 7: Insert
  console.log('\nStep 7: Inserting into database...');
  await sql`DELETE FROM source_kfct_content`;
  await sql`DELETE FROM source_kfct_nutrients`;
  await sql`DELETE FROM source_kfct_foods`;

  // Nutrients
  const nutrientInfo = new Map();
  for (const nd of nutrientDefs) nutrientInfo.set(nd.tagname, { name: nd.name_en, unit: nd.unit });
  const extras = [
    { tagname: 'AAT19', name: 'Total Amino Acids', unit: 'mg' },
    { tagname: 'AAE10A', name: 'Essential Amino Acids', unit: 'mg' },
    { tagname: 'AANE', name: 'Non-Essential Amino Acids', unit: 'mg' },
    { tagname: 'FAFREF', name: 'Total Fatty Acids', unit: 'g' },
    { tagname: 'FAESSF', name: 'Total Essential Fatty Acids', unit: 'g' },
    { tagname: 'FASATF', name: 'Saturated Fatty Acids', unit: 'g' },
    { tagname: 'FAMSF', name: 'Monounsaturated Fatty Acids', unit: 'g' },
    { tagname: 'FAPUF', name: 'Polyunsaturated Fatty Acids', unit: 'g' },
    { tagname: 'CHOLE', name: 'Cholesterol', unit: 'mg' },
    { tagname: 'NACL', name: 'Salt Equivalent', unit: 'g' },
  ];
  for (const e of extras) if (!nutrientInfo.has(e.tagname)) nutrientInfo.set(e.tagname, { name: e.name, unit: e.unit });

  const uniqueTags = new Set();
  for (const [, n] of mergedData) for (const t of n.keys()) uniqueTags.add(t);

  for (const tag of uniqueTags) {
    const info = nutrientInfo.get(tag) || { name: tag, unit: 'g' };
    await sql`INSERT INTO source_kfct_nutrients (nutrient_code, name, unit) VALUES (${tag}, ${info.name}, ${info.unit}) ON CONFLICT (nutrient_code) DO NOTHING`;
  }
  console.log(`  ${uniqueTags.size} nutrients`);

  // Foods
  for (const f of foods) {
    await sql`INSERT INTO source_kfct_foods (food_id, name, food_group) VALUES (${f.foodCode}, ${f.foodName}, ${f.foodGroup}) ON CONFLICT (food_id) DO UPDATE SET name = ${f.foodName}, food_group = ${f.foodGroup}`;
  }
  console.log(`  ${foods.length} foods`);

  // Content
  // KFCT is parsed out of PDF-extracted text. In a few sections the parser has picked up
  // the global-index column instead of the value column, producing rows like
  // "protein = 2964 g". Reject the physically impossible ones rather than store them.
  const kfctUnits = new Map([...nutrientInfo].map(([tag, info]) => [tag, info.unit]));
  const guard = createBoundsGuard({ tagUnits: kfctUnits });
  const totalBeforeGuard = content.length;
  content = content.filter((c) => guard.accept(c.tagname, c.value));
  guard.report({ total: totalBeforeGuard, label: 'content rows' });

  let inserted = 0;
  for (let b = 0; b < content.length; b += CONTENT_BATCH_SIZE) {
    const chunk = content.slice(b, b + CONTENT_BATCH_SIZE);
    await sql`INSERT INTO source_kfct_content ${sql(chunk.map(c => ({ food_id: c.foodCode, nutrient_code: c.tagname, value: c.value })), 'food_id', 'nutrient_code', 'value')}`;
    inserted += chunk.length;
    if (inserted % 10000 === 0 || b + CONTENT_BATCH_SIZE >= content.length) {
      console.log(`    ${inserted}/${content.length} content rows...`);
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  const fc = await sql`SELECT COUNT(*)::int as count FROM source_kfct_foods`;
  const nc = await sql`SELECT COUNT(*)::int as count FROM source_kfct_nutrients`;
  const cc = await sql`SELECT COUNT(*)::int as count FROM source_kfct_content`;
  console.log(`Foods: ${fc[0].count}, Nutrients: ${nc[0].count}, Content: ${cc[0].count}`);

  // Per-nutrient coverage
  const stats = await sql`SELECT nutrient_code, COUNT(*)::int as count FROM source_kfct_content WHERE value IS NOT NULL AND value > 0 GROUP BY nutrient_code ORDER BY count DESC`;
  console.log('\nNutrient coverage:');
  for (const s of stats) console.log(`  ${s.nutrient_code}: ${s.count}`);

  // Sample
  const sample = await sql`SELECT food_id, name, food_group FROM source_kfct_foods ORDER BY food_id LIMIT 5`;
  console.log('\nSample:');
  for (const s of sample) console.log(`  ${s.food_id}: ${s.name} (${s.food_group})`);

  await sql.end();
  console.log('\nDone!');
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
