/**
 * Russia — МР 2.3.1.0253-21 Rospotrebnadzor 2021
 * Dietary norms for various population groups of the Russian Federation.
 *
 * See dv-sources/russia-mr-2021/NOTES.md and raw-values.ts.
 *
 * Run: npx tsx db/seed/seed-russia-mr-2021.ts
 */

import 'dotenv/config';
import postgres from 'postgres';
import {
  DEMOGRAPHICS, demo, DEMO_KEYS,
  ADULT_MACROS, CHILD_MACROS,
  VITAMIN_C_RNI, THIAMIN_RNI, RIBOFLAVIN_RNI, NIACIN_RNI, B6_RNI, B12_RNI,
  FOLATE_RNI, PANTOTHENIC_AI, BIOTIN_AI,
  VITAMIN_A_RNI, BETA_CAROTENE_AI, VITAMIN_D_RNI, VITAMIN_E_RNI, VITAMIN_K_AI,
  CALCIUM_RNI, PHOSPHORUS_RNI, MAGNESIUM_RNI,
  POTASSIUM_AI, SODIUM_RNI, CHLORIDE_RNI,
  IRON_RNI, ZINC_RNI, IODINE_RNI, COPPER_RNI,
  MANGANESE_AI, MOLYBDENUM_AI, SELENIUM_RNI, CHROMIUM_AI, FLUORIDE_AI,
  FIBER_AI,
} from '../../dv-sources/russia-mr-2021/raw-values';

const sql = postgres(process.env.DATABASE_URL!);

const SOURCE = {
  authorityName: 'Rospotrebnadzor — МР 2.3.1.0253-21 (Russia)',
  regionCode: 'RUSSIA',
  versionYear: 2021,
  sourceType: 'SCIENTIFIC_DRI' as const,
  url: 'https://docs.cntd.ru/document/608629034',
  note: 'Rospotrebnadzor Methodological Recommendations МР 2.3.1.0253-21 (22 July 2021). Russian national DRIs. Energy/protein/fat/carb at 4 activity levels for adults 18-64 (КФА 1.4/1.6/1.9/2.2 → SEDENTARY/MODERATE/ACTIVE/VERY_ACTIVE); elderly 65+ at single КФА 1.7 → MODERATE. Vitamins/minerals activity-independent. Russia has unique minerals: Cobalt AI 10 µg, Silicon AI 30 mg, Vanadium AI 15 µg (not tracked in most other sources — skipped here since Nutri may not track). Vit A in RE (not RAE). Iron 18 mg/d for all adult women (unique — no post-menopausal reduction). No UL table in this document. Sodium 1300 mg/d recommended (Russia-specific; no separate CDRR). Extracted via WebFetch from consolidated Russian article.',
  retrievedDate: '2026-04-20',
};

const COMPOUND_NAME_MAP: Record<string, string> = {
  'Thiamin': 'Thiamin (B1)',
  'Riboflavin': 'Riboflavin (B2)',
  'Niacin': 'Niacin (B3)',
  'Vitamin B12': 'Vitamin B12 (Total)',
  'Folate': 'Folate (Total)',
  'Pantothenic acid': 'Pantothenic Acid (B5)',
  'Biotin': 'Biotin (B7)',
  'Vitamin A': 'Vitamin A (RAE)',
  'Beta-carotene': 'Beta-Carotene',
  'Vitamin C': 'Vitamin C (Total)',
  'Vitamin D': 'Vitamin D (Total)',
  'Vitamin E': 'Vitamin E (Total)',
  'Vitamin K': 'Vitamin K (Total)',
  'Calcium': 'Calcium (Total)',
  'Magnesium': 'Magnesium (Total)',
  'Iron': 'Iron (Total)',
  'Zinc': 'Zinc (Total)',
  'Chromium': 'Chromium (Total)',
  'Selenium': 'Selenium (Total)',
  'Carbohydrate': 'Carbohydrates',
};
function resolveDbName(n: string): string {
  return COMPOUND_NAME_MAP[n] ?? n;
}

type Sex = 'MALE' | 'FEMALE';
type LifeStage = 'NONE' | 'PREGNANT' | 'LACTATING';
type ValueType = 'RDA' | 'AI' | 'CDRR';
type ActivityLevel = 'SEDENTARY' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE' | null;

interface SeedRow {
  compoundName: string;
  ageMinMonths: number;
  ageMaxMonths: number | null;
  sex: Sex;
  lifeStage: LifeStage;
  valueType: ValueType;
  value: number;
  unit: string;
  activityLevel?: ActivityLevel;
  valueNote?: string | null;
}

function expandDemo(key: string): Array<{ sex: Sex; lifeStage: LifeStage; min: number; max: number | null }> {
  const d = demo(key);
  if (d.sex === 'BOTH') {
    return [
      { sex: 'MALE',   lifeStage: d.lifeStage, min: d.minMonths, max: d.maxMonths },
      { sex: 'FEMALE', lifeStage: d.lifeStage, min: d.minMonths, max: d.maxMonths },
    ];
  }
  return [{ sex: d.sex, lifeStage: d.lifeStage, min: d.minMonths, max: d.maxMonths }];
}

function pushFromMap(
  rows: SeedRow[], compound: string, unit: string, valueType: ValueType,
  map: Record<string, number | null>, note?: string,
) {
  for (const demoKey of DEMO_KEYS) {
    const value = map[demoKey];
    if (value == null) continue;
    for (const { sex, lifeStage, min, max } of expandDemo(demoKey)) {
      rows.push({
        compoundName: compound, ageMinMonths: min, ageMaxMonths: max,
        sex, lifeStage, valueType, value, unit, valueNote: note ?? null,
      });
    }
  }
}

function buildAllRows(): SeedRow[] {
  const rows: SeedRow[] = [];

  // Adult macros at 4 activity levels
  for (const row of ADULT_MACROS) {
    const d = demo(row.demoKey);
    const sex: Sex = d.sex as Sex;
    const base = {
      ageMinMonths: d.minMonths, ageMaxMonths: d.maxMonths,
      sex, lifeStage: 'NONE' as LifeStage, activityLevel: row.activityLevel,
    };
    rows.push({ compoundName: 'Energy', ...base, valueType: 'RDA', value: row.kcal, unit: 'kcal',
      valueNote: `КФА ${row.activityLevel === 'SEDENTARY' ? '1.4' : row.activityLevel === 'MODERATE' ? '1.6 (elderly 1.7)' : row.activityLevel === 'ACTIVE' ? '1.9' : '2.2'} activity level.` });
    rows.push({ compoundName: 'Protein', ...base, valueType: 'RDA', value: row.proteinG, unit: 'g' });
    rows.push({ compoundName: 'Total Fat', ...base, valueType: 'RDA', value: row.fatG, unit: 'g' });
    rows.push({ compoundName: 'Carbohydrate', ...base, valueType: 'RDA', value: row.carbG, unit: 'g' });
  }

  // Child macros (no activity)
  for (const row of CHILD_MACROS) {
    const perKgNote = typeof row.kcal === 'number' && row.demoKey.startsWith('INFANT')
      ? 'Infant value calculated from published per-kg ratio × reference body weight (6 kg / 9 kg).'
      : null;
    for (const { sex, lifeStage, min, max } of expandDemo(row.demoKey)) {
      const base = { ageMinMonths: min, ageMaxMonths: max, sex, lifeStage, activityLevel: null };
      rows.push({ compoundName: 'Energy', ...base, valueType: 'RDA', value: row.kcal as number, unit: 'kcal', valueNote: perKgNote });
      if (typeof row.proteinG === 'number') {
        rows.push({ compoundName: 'Protein', ...base, valueType: 'RDA', value: row.proteinG, unit: 'g', valueNote: perKgNote });
      }
      if (typeof row.fatG === 'number') {
        rows.push({ compoundName: 'Total Fat', ...base, valueType: 'RDA', value: row.fatG, unit: 'g', valueNote: perKgNote });
      }
      if (typeof row.carbG === 'number') {
        rows.push({ compoundName: 'Carbohydrate', ...base, valueType: 'RDA', value: row.carbG, unit: 'g', valueNote: perKgNote });
      }
    }
  }

  // Added sugar CDRR: <10% energy (all ages)
  for (const demoKey of DEMO_KEYS) {
    for (const { sex, lifeStage, min, max } of expandDemo(demoKey)) {
      if (demoKey.startsWith('INFANT')) continue; // no limit for infants
      rows.push({
        compoundName: 'Added Sugars', ageMinMonths: min, ageMaxMonths: max,
        sex, lifeStage, valueType: 'CDRR', value: 10, unit: '%',
        valueNote: 'Added sugars <10% of total energy.',
      });
    }
  }

  // Fiber
  pushFromMap(rows, 'Dietary Fiber', 'g', 'AI', FIBER_AI);

  // Vitamins
  pushFromMap(rows, 'Vitamin C', 'mg', 'RDA', VITAMIN_C_RNI);
  pushFromMap(rows, 'Thiamin', 'mg', 'RDA', THIAMIN_RNI);
  pushFromMap(rows, 'Riboflavin', 'mg', 'RDA', RIBOFLAVIN_RNI);
  pushFromMap(rows, 'Niacin', 'mg', 'RDA', NIACIN_RNI, 'Expressed as mg NE.');
  pushFromMap(rows, 'Vitamin B6', 'mg', 'RDA', B6_RNI);
  pushFromMap(rows, 'Vitamin B12', 'µg', 'RDA', B12_RNI);
  pushFromMap(rows, 'Folate', 'µg', 'RDA', FOLATE_RNI);
  pushFromMap(rows, 'Pantothenic acid', 'mg', 'AI', PANTOTHENIC_AI);
  pushFromMap(rows, 'Biotin', 'µg', 'AI', BIOTIN_AI);
  pushFromMap(rows, 'Vitamin A', 'µg', 'RDA', VITAMIN_A_RNI, 'Russia uses Retinol Equivalent (RE), not RAE. Stored in Vitamin A (RAE) with caveat.');
  pushFromMap(rows, 'Beta-carotene', 'mg', 'AI', BETA_CAROTENE_AI);
  pushFromMap(rows, 'Vitamin D', 'µg', 'RDA', VITAMIN_D_RNI, 'Elderly 65+ get 20 µg.');
  pushFromMap(rows, 'Vitamin E', 'mg', 'RDA', VITAMIN_E_RNI, 'α-tocopherol equivalents (TE).');
  pushFromMap(rows, 'Vitamin K', 'µg', 'AI', VITAMIN_K_AI);

  // Minerals
  pushFromMap(rows, 'Calcium', 'mg', 'RDA', CALCIUM_RNI);
  pushFromMap(rows, 'Phosphorus', 'mg', 'RDA', PHOSPHORUS_RNI);
  pushFromMap(rows, 'Magnesium', 'mg', 'RDA', MAGNESIUM_RNI);
  pushFromMap(rows, 'Potassium', 'mg', 'AI', POTASSIUM_AI);
  pushFromMap(rows, 'Sodium', 'mg', 'RDA', SODIUM_RNI, 'Russia publishes 1300 mg/d as recommended intake (not CDRR).');
  pushFromMap(rows, 'Chloride', 'mg', 'RDA', CHLORIDE_RNI);
  pushFromMap(rows, 'Iron', 'mg', 'RDA', IRON_RNI,
    'Russia uniquely keeps Iron RDA at 18 mg for ALL adult women (including post-menopausal). Preg +15 → 33 mg.');
  pushFromMap(rows, 'Zinc', 'mg', 'RDA', ZINC_RNI);
  pushFromMap(rows, 'Iodine', 'µg', 'RDA', IODINE_RNI);
  pushFromMap(rows, 'Copper', 'mg', 'RDA', COPPER_RNI);
  pushFromMap(rows, 'Manganese', 'mg', 'AI', MANGANESE_AI);
  pushFromMap(rows, 'Molybdenum', 'µg', 'AI', MOLYBDENUM_AI);
  pushFromMap(rows, 'Selenium', 'µg', 'RDA', SELENIUM_RNI);
  pushFromMap(rows, 'Chromium', 'µg', 'AI', CHROMIUM_AI);
  pushFromMap(rows, 'Fluoride', 'mg', 'AI', FLUORIDE_AI);

  return rows;
}

async function seed() {
  console.log(`🌱 Seeding ${SOURCE.authorityName}...\n`);

  const [source] = await sql`
    INSERT INTO dv_sources (
      authority_name, region_code, version_year, source_type, url, note, retrieved_date
    ) VALUES (
      ${SOURCE.authorityName}, ${SOURCE.regionCode}, ${SOURCE.versionYear},
      ${SOURCE.sourceType}, ${SOURCE.url}, ${SOURCE.note}, ${SOURCE.retrievedDate}
    )
    ON CONFLICT (region_code, version_year, source_type)
    DO UPDATE SET
      authority_name = EXCLUDED.authority_name,
      url = EXCLUDED.url,
      note = EXCLUDED.note,
      retrieved_date = EXCLUDED.retrieved_date,
      updated_at = NOW()
    RETURNING id
  `;
  console.log(`✓ Source row: ${source.id}\n`);

  const rows = buildAllRows();
  console.log(`Prepared ${rows.length} reference values.\n`);

  const names = [...new Set(rows.map((r) => resolveDbName(r.compoundName)))];
  const compoundRows = await sql`
    SELECT id, name FROM compounds WHERE name = ANY(${names}) AND tier = 'core'
  `;
  const idByName = new Map(compoundRows.map((r: any) => [r.name, r.id]));
  const missing = names.filter((n) => !idByName.has(n));
  if (missing.length > 0) {
    console.log(`⚠️  Compounds not found: ${missing.join(', ')}\n`);
  }

  let inserted = 0, updated = 0, skipped = 0;
  for (const row of rows) {
    const compoundId = idByName.get(resolveDbName(row.compoundName));
    if (!compoundId) { skipped++; continue; }

    const isPercent = row.unit === '%';
    const result = await sql`
      INSERT INTO reference_daily_values (
        compound_id, source_region, source_id,
        age_min_months, age_max_months,
        sex, life_stage, value_type,
        value, unit, activity_level,
        is_percent_of_energy, is_provisional, value_note
      ) VALUES (
        ${compoundId}, ${SOURCE.regionCode}, ${source.id},
        ${row.ageMinMonths}, ${row.ageMaxMonths},
        ${row.sex}, ${row.lifeStage}, ${row.valueType},
        ${row.value}, ${row.unit}, ${row.activityLevel ?? null},
        ${isPercent}, false, ${row.valueNote ?? null}
      )
      ON CONFLICT (compound_id, source_region, age_min_months, age_max_months, sex, life_stage, value_type, activity_level, dietary_context)
      DO UPDATE SET
        value = EXCLUDED.value,
        unit = EXCLUDED.unit,
        source_id = EXCLUDED.source_id,
        is_percent_of_energy = EXCLUDED.is_percent_of_energy,
        value_note = EXCLUDED.value_note
      RETURNING (xmax = 0) AS inserted
    `;
    if (result[0]?.inserted) inserted++; else updated++;
  }

  console.log('─'.repeat(60));
  console.log(`✅ Seed complete`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Updated:  ${updated}`);
  console.log(`   Skipped:  ${skipped}`);
  console.log('─'.repeat(60));
}

seed()
  .catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); })
  .finally(() => sql.end());
