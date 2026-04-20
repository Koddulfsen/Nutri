/**
 * MOHW / Korean Nutrition Society — Dietary Reference Intakes for Koreans 2020
 *
 * Source: dv-sources/kdri-2020/01 (Energy+Macronutrients book), Appendix 2
 *   English summary tables pages 255-264.
 *   + 4 errata files (latest: 2021-11-04 supersedes #1).
 *
 * See dv-sources/kdri-2020/NOTES.md for full source notes.
 * See dv-sources/kdri-2020/raw-values.ts for extracted data tables.
 *
 * Run: npx tsx db/seed/seed-korea-kdri-2020.ts
 */

import 'dotenv/config';
import postgres from 'postgres';
import {
  DEMOGRAPHICS, demo, DEMO_KEYS,
  ENERGY_EER, CARB_EAR, CARB_RNI, FIBER_AI, FAT_AI,
  LA_AI, ALA_AI, EPA_DHA_AI,
  WATER_LIQUID_AI, WATER_TOTAL_AI,
  PROTEIN_EAR, PROTEIN_RNI, PROTEIN_AI,
  VITAMIN_A_EAR, VITAMIN_A_RNI, VITAMIN_A_AI, VITAMIN_A_UL,
  VITAMIN_D_AI, VITAMIN_D_UL,
  VITAMIN_E_AI, VITAMIN_E_UL,
  VITAMIN_K_AI,
  VITAMIN_C_EAR, VITAMIN_C_RNI, VITAMIN_C_AI, VITAMIN_C_UL,
  THIAMIN_EAR, THIAMIN_RNI, THIAMIN_AI,
  RIBOFLAVIN_EAR, RIBOFLAVIN_RNI, RIBOFLAVIN_AI,
  NIACIN_EAR, NIACIN_RNI, NIACIN_AI, NIACIN_UL,
  B6_EAR, B6_RNI, B6_AI, B6_UL,
  FOLATE_EAR, FOLATE_RNI, FOLATE_AI, FOLATE_UL,
  B12_EAR, B12_RNI, B12_AI,
  PANTOTHENIC_AI, BIOTIN_AI,
  CALCIUM_EAR, CALCIUM_RNI, CALCIUM_AI, CALCIUM_UL,
  PHOSPHORUS_EAR, PHOSPHORUS_RNI, PHOSPHORUS_AI, PHOSPHORUS_UL,
  SODIUM_AI, SODIUM_CDRR,
  CHLORIDE_AI, POTASSIUM_AI,
  MAGNESIUM_EAR, MAGNESIUM_RNI, MAGNESIUM_AI, MAGNESIUM_UL,
  IRON_EAR, IRON_RNI, IRON_AI, IRON_UL,
  ZINC_EAR, ZINC_RNI, ZINC_AI, ZINC_UL,
  COPPER_EAR, COPPER_RNI, COPPER_AI, COPPER_UL,
  FLUORIDE_AI, FLUORIDE_UL,
  MANGANESE_AI, MANGANESE_UL,
  IODINE_EAR, IODINE_RNI, IODINE_AI, IODINE_UL,
  SELENIUM_EAR, SELENIUM_RNI, SELENIUM_AI, SELENIUM_UL,
  MOLYBDENUM_EAR, MOLYBDENUM_RNI, MOLYBDENUM_UL,
  CHROMIUM_AI,
} from '../../dv-sources/kdri-2020/raw-values';

const sql = postgres(process.env.DATABASE_URL!);

// ═══════════════════════════════════════════════════════════════
// Source metadata
// ═══════════════════════════════════════════════════════════════

const SOURCE = {
  authorityName: 'MOHW / KNS — Dietary Reference Intakes for Koreans 2020',
  regionCode: 'KOREA',
  versionYear: 2020,
  sourceType: 'SCIENTIFIC_DRI' as const,
  url: 'https://www.mohw.go.kr/board.es?mid=a10411010100&bid=0019&act=view&list_no=362385',
  note: 'KDRI 2020 (Ministry of Health and Welfare + Korean Nutrition Society). Published 2020-12-10. Value types: EAR, RNI→RDA, AI, UL, AMDR, CDRR (first Korean source with CDRR for Sodium 2300 mg and Added Sugars 10%). 24 demographic groups: 2 infants, 2 children (unisex), 9 M, 9 F, 1 pregnancy, 1 lactation. IOM-aligned framework. Infants use AI only (from breast milk). Errata 4 (2021-11-04) applied: Carb pregnancy RNI 175 g/d (was 180), lactation 210 g/d (was 215). Niacin UL = nicotinic acid form; nicotinamide UL documented in value_note. Folate UL = folic acid from fortified foods/supplements only. Mg UL = supplemental only. Amino acids + Cholesterol skipped (Nutri does not track individually or as primary DRI).',
  retrievedDate: '2026-04-18',
};

// ═══════════════════════════════════════════════════════════════
// Compound name map
// ═══════════════════════════════════════════════════════════════

const COMPOUND_NAME_MAP: Record<string, string> = {
  'Thiamin': 'Thiamin (B1)',
  'Riboflavin': 'Riboflavin (B2)',
  'Niacin': 'Niacin (B3)',
  'Vitamin B12': 'Vitamin B12 (Total)',
  'Folate': 'Folate (Total)',
  'Pantothenic acid': 'Pantothenic Acid (B5)',
  'Biotin': 'Biotin (B7)',
  'Vitamin A': 'Vitamin A (RAE)',
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

// ═══════════════════════════════════════════════════════════════
// Row schema
// ═══════════════════════════════════════════════════════════════

type Sex = 'MALE' | 'FEMALE';
type LifeStage = 'NONE' | 'PREGNANT' | 'LACTATING';
type ValueType = 'RDA' | 'AI' | 'EAR' | 'UL' | 'CDRR' | 'AMDR';

interface SeedRow {
  compoundName: string;
  ageMinMonths: number;
  ageMaxMonths: number | null;
  sex: Sex;
  lifeStage: LifeStage;
  valueType: ValueType;
  value: number;
  valueMin?: number | null;
  valueMax?: number | null;
  unit: string;
  isPercentOfEnergy?: boolean;
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

// ═══════════════════════════════════════════════════════════════
// Build rows
// ═══════════════════════════════════════════════════════════════

function buildAllRows(): SeedRow[] {
  const rows: SeedRow[] = [];

  // ─── ENERGY ───
  pushFromMap(rows, 'Energy', 'kcal', 'EAR', ENERGY_EER,
    'EER (Estimated Energy Requirement). Preg/Lact = +340 kcal (2nd+3rd trimester avg) over non-preg/non-lact 19-29 base.');

  // ─── MACROS ───
  pushFromMap(rows, 'Carbohydrate', 'g', 'EAR', CARB_EAR);
  pushFromMap(rows, 'Carbohydrate', 'g', 'RDA', CARB_RNI,
    'Errata 4 (2021-11-04): Pregnancy 130+45=175, Lactation 130+80=210.');
  pushFromMap(rows, 'Dietary Fiber', 'g', 'AI', FIBER_AI);
  pushFromMap(rows, 'Total Fat', 'g', 'AI', FAT_AI, 'Infant total fat AI only.');
  pushFromMap(rows, 'LA', 'g', 'AI', LA_AI);
  pushFromMap(rows, 'ALA', 'g', 'AI', ALA_AI);
  pushFromMap(rows, 'Omega-3', 'mg', 'AI', EPA_DHA_AI,
    'EPA+DHA combined. For infants, AI is DHA only.');
  pushFromMap(rows, 'Water', 'mL', 'AI', WATER_TOTAL_AI,
    'Total water AI (food + beverage + liquid).');

  // ─── PROTEIN ───
  pushFromMap(rows, 'Protein', 'g', 'EAR', PROTEIN_EAR,
    'Preg EAR = non-preg 45 + avg (+12, +25)/1 = ~62. Lact = 50 + 20.');
  pushFromMap(rows, 'Protein', 'g', 'RDA', PROTEIN_RNI,
    'Preg RNI T2+T3 avg ≈ 80. Lact = 55 + 25 = 80.');
  pushFromMap(rows, 'Protein', 'g', 'AI', PROTEIN_AI, 'Infant 0-5 mo AI only.');

  // ─── FAT-SOLUBLE VITAMINS ───
  pushFromMap(rows, 'Vitamin A', 'µg', 'EAR', VITAMIN_A_EAR);
  pushFromMap(rows, 'Vitamin A', 'µg', 'RDA', VITAMIN_A_RNI);
  pushFromMap(rows, 'Vitamin A', 'µg', 'AI', VITAMIN_A_AI);
  pushFromMap(rows, 'Vitamin A', 'µg', 'UL', VITAMIN_A_UL);

  pushFromMap(rows, 'Vitamin D', 'µg', 'AI', VITAMIN_D_AI);
  pushFromMap(rows, 'Vitamin D', 'µg', 'UL', VITAMIN_D_UL);

  pushFromMap(rows, 'Vitamin E', 'mg', 'AI', VITAMIN_E_AI);
  pushFromMap(rows, 'Vitamin E', 'mg', 'UL', VITAMIN_E_UL);

  pushFromMap(rows, 'Vitamin K', 'µg', 'AI', VITAMIN_K_AI);

  // ─── WATER-SOLUBLE VITAMINS ───
  pushFromMap(rows, 'Vitamin C', 'mg', 'EAR', VITAMIN_C_EAR);
  pushFromMap(rows, 'Vitamin C', 'mg', 'RDA', VITAMIN_C_RNI);
  pushFromMap(rows, 'Vitamin C', 'mg', 'AI', VITAMIN_C_AI);
  pushFromMap(rows, 'Vitamin C', 'mg', 'UL', VITAMIN_C_UL);

  pushFromMap(rows, 'Thiamin', 'mg', 'EAR', THIAMIN_EAR);
  pushFromMap(rows, 'Thiamin', 'mg', 'RDA', THIAMIN_RNI);
  pushFromMap(rows, 'Thiamin', 'mg', 'AI', THIAMIN_AI);

  pushFromMap(rows, 'Riboflavin', 'mg', 'EAR', RIBOFLAVIN_EAR);
  pushFromMap(rows, 'Riboflavin', 'mg', 'RDA', RIBOFLAVIN_RNI);
  pushFromMap(rows, 'Riboflavin', 'mg', 'AI', RIBOFLAVIN_AI);

  pushFromMap(rows, 'Niacin', 'mg', 'EAR', NIACIN_EAR, 'Expressed as mg NE (niacin equivalent).');
  pushFromMap(rows, 'Niacin', 'mg', 'RDA', NIACIN_RNI, 'Expressed as mg NE (niacin equivalent).');
  pushFromMap(rows, 'Niacin', 'mg', 'AI', NIACIN_AI, 'Expressed as mg NE (niacin equivalent).');
  pushFromMap(rows, 'Niacin', 'mg', 'UL', NIACIN_UL,
    'UL is for nicotinic acid form (stricter). Nicotinamide UL per KDRI: 180/250/500/700/800 mg for ages 1-3/4-8/9-13/14-18/adult respectively.');

  pushFromMap(rows, 'Vitamin B6', 'mg', 'EAR', B6_EAR);
  pushFromMap(rows, 'Vitamin B6', 'mg', 'RDA', B6_RNI);
  pushFromMap(rows, 'Vitamin B6', 'mg', 'AI', B6_AI);
  pushFromMap(rows, 'Vitamin B6', 'mg', 'UL', B6_UL);

  pushFromMap(rows, 'Folate', 'µg', 'EAR', FOLATE_EAR, 'Expressed as µg DFE (dietary folate equivalents).');
  pushFromMap(rows, 'Folate', 'µg', 'RDA', FOLATE_RNI, 'Expressed as µg DFE (dietary folate equivalents).');
  pushFromMap(rows, 'Folate', 'µg', 'AI', FOLATE_AI, 'Expressed as µg DFE (dietary folate equivalents).');
  pushFromMap(rows, 'Folate', 'µg', 'UL', FOLATE_UL,
    'UL applies to folic acid from fortified foods and supplements only, not food folate. Pregnancy: 400 µg DFE/d folic acid supplement recommended.');

  pushFromMap(rows, 'Vitamin B12', 'µg', 'EAR', B12_EAR);
  pushFromMap(rows, 'Vitamin B12', 'µg', 'RDA', B12_RNI);
  pushFromMap(rows, 'Vitamin B12', 'µg', 'AI', B12_AI);

  pushFromMap(rows, 'Pantothenic acid', 'mg', 'AI', PANTOTHENIC_AI);
  pushFromMap(rows, 'Biotin', 'µg', 'AI', BIOTIN_AI);

  // ─── MACROMINERALS ───
  pushFromMap(rows, 'Calcium', 'mg', 'EAR', CALCIUM_EAR);
  pushFromMap(rows, 'Calcium', 'mg', 'RDA', CALCIUM_RNI);
  pushFromMap(rows, 'Calcium', 'mg', 'AI', CALCIUM_AI);
  pushFromMap(rows, 'Calcium', 'mg', 'UL', CALCIUM_UL);

  pushFromMap(rows, 'Phosphorus', 'mg', 'EAR', PHOSPHORUS_EAR);
  pushFromMap(rows, 'Phosphorus', 'mg', 'RDA', PHOSPHORUS_RNI);
  pushFromMap(rows, 'Phosphorus', 'mg', 'AI', PHOSPHORUS_AI);
  pushFromMap(rows, 'Phosphorus', 'mg', 'UL', PHOSPHORUS_UL);

  pushFromMap(rows, 'Sodium', 'mg', 'AI', SODIUM_AI);
  pushFromMap(rows, 'Sodium', 'mg', 'CDRR', SODIUM_CDRR,
    'CDRR (Chronic Disease Risk Reduction intake) — first in KDRI 2020.');

  pushFromMap(rows, 'Chloride', 'mg', 'AI', CHLORIDE_AI);
  pushFromMap(rows, 'Potassium', 'mg', 'AI', POTASSIUM_AI);

  pushFromMap(rows, 'Magnesium', 'mg', 'EAR', MAGNESIUM_EAR);
  pushFromMap(rows, 'Magnesium', 'mg', 'RDA', MAGNESIUM_RNI);
  pushFromMap(rows, 'Magnesium', 'mg', 'AI', MAGNESIUM_AI);
  pushFromMap(rows, 'Magnesium', 'mg', 'UL', MAGNESIUM_UL,
    'UL refers to supplemental Mg only (non-food sources).');

  // ─── MICROMINERALS ───
  pushFromMap(rows, 'Iron', 'mg', 'EAR', IRON_EAR);
  pushFromMap(rows, 'Iron', 'mg', 'RDA', IRON_RNI);
  pushFromMap(rows, 'Iron', 'mg', 'AI', IRON_AI);
  pushFromMap(rows, 'Iron', 'mg', 'UL', IRON_UL);

  pushFromMap(rows, 'Zinc', 'mg', 'EAR', ZINC_EAR);
  pushFromMap(rows, 'Zinc', 'mg', 'RDA', ZINC_RNI);
  pushFromMap(rows, 'Zinc', 'mg', 'AI', ZINC_AI);
  pushFromMap(rows, 'Zinc', 'mg', 'UL', ZINC_UL);

  pushFromMap(rows, 'Copper', 'µg', 'EAR', COPPER_EAR);
  pushFromMap(rows, 'Copper', 'µg', 'RDA', COPPER_RNI);
  pushFromMap(rows, 'Copper', 'µg', 'AI', COPPER_AI);
  pushFromMap(rows, 'Copper', 'µg', 'UL', COPPER_UL);

  pushFromMap(rows, 'Fluoride', 'mg', 'AI', FLUORIDE_AI);
  pushFromMap(rows, 'Fluoride', 'mg', 'UL', FLUORIDE_UL);

  pushFromMap(rows, 'Manganese', 'mg', 'AI', MANGANESE_AI);
  pushFromMap(rows, 'Manganese', 'mg', 'UL', MANGANESE_UL);

  pushFromMap(rows, 'Iodine', 'µg', 'EAR', IODINE_EAR);
  pushFromMap(rows, 'Iodine', 'µg', 'RDA', IODINE_RNI);
  pushFromMap(rows, 'Iodine', 'µg', 'AI', IODINE_AI);
  pushFromMap(rows, 'Iodine', 'µg', 'UL', IODINE_UL);

  pushFromMap(rows, 'Selenium', 'µg', 'EAR', SELENIUM_EAR);
  pushFromMap(rows, 'Selenium', 'µg', 'RDA', SELENIUM_RNI);
  pushFromMap(rows, 'Selenium', 'µg', 'AI', SELENIUM_AI);
  pushFromMap(rows, 'Selenium', 'µg', 'UL', SELENIUM_UL);

  pushFromMap(rows, 'Molybdenum', 'µg', 'EAR', MOLYBDENUM_EAR);
  pushFromMap(rows, 'Molybdenum', 'µg', 'RDA', MOLYBDENUM_RNI);
  pushFromMap(rows, 'Molybdenum', 'µg', 'UL', MOLYBDENUM_UL);

  pushFromMap(rows, 'Chromium', 'µg', 'AI', CHROMIUM_AI);

  // ─── AMDR RANGES (% of energy, applies to ages 1+) ───
  // Per page 255: Carb 55-65%, Protein 7-20%, Fat (1-2y 20-35%, 3+ 15-30%),
  //  SatFat (3-18 <8%, 19+ <7%), TransFat (3+ <1%), Added Sugars (≤10%)
  const amdrAges = [
    // { key, min, max }
    { key: 'CHILD_1_2', min: 12, max: 35 },
    { key: 'CHILD_3_5', min: 36, max: 71 },
    { key: 'M_6_8', min: 72, max: 107 }, { key: 'F_6_8', min: 72, max: 107 },
    { key: 'M_9_11', min: 108, max: 143 }, { key: 'F_9_11', min: 108, max: 143 },
    { key: 'M_12_14', min: 144, max: 179 }, { key: 'F_12_14', min: 144, max: 179 },
    { key: 'M_15_18', min: 180, max: 227 }, { key: 'F_15_18', min: 180, max: 227 },
    { key: 'M_19_29', min: 228, max: 359 }, { key: 'F_19_29', min: 228, max: 359 },
    { key: 'M_30_49', min: 360, max: 599 }, { key: 'F_30_49', min: 360, max: 599 },
    { key: 'M_50_64', min: 600, max: 779 }, { key: 'F_50_64', min: 600, max: 779 },
    { key: 'M_65_74', min: 780, max: 899 }, { key: 'F_65_74', min: 780, max: 899 },
    { key: 'M_75P', min: 900, max: null }, { key: 'F_75P', min: 900, max: null },
    { key: 'PREG', min: 228, max: 599 },
    { key: 'LACT', min: 228, max: 599 },
  ] as const;

  function amdrPush(compound: string, value: number, valueMin: number | null, valueMax: number | null, valueType: ValueType, note?: string, ages = amdrAges) {
    for (const a of ages) {
      for (const { sex, lifeStage, min, max } of expandDemo(a.key)) {
        rows.push({
          compoundName: compound, ageMinMonths: min, ageMaxMonths: max,
          sex, lifeStage, valueType, value, unit: '%',
          valueMin: valueMin ?? null, valueMax: valueMax ?? null,
          isPercentOfEnergy: true,
          valueNote: note ?? null,
        });
      }
    }
  }

  amdrPush('Carbohydrate', 60, 55, 65, 'AMDR', 'Carbohydrate AMDR 55-65% of total energy.');
  amdrPush('Protein', 13, 7, 20, 'AMDR', 'Protein AMDR 7-20% of total energy.');

  // Fat AMDR — age-specific
  amdrPush('Total Fat', 27.5, 20, 35, 'AMDR', 'Fat AMDR 20-35% (ages 1-2 y).',
           [{ key: 'CHILD_1_2', min: 12, max: 35 }]);
  amdrPush('Total Fat', 22.5, 15, 30, 'AMDR', 'Fat AMDR 15-30% (ages 3+).',
           amdrAges.filter((a) => a.key !== 'CHILD_1_2'));

  // Saturated fat CDRR — age-specific
  const satFat_3_18 = amdrAges.filter((a) => ['CHILD_3_5','M_6_8','M_9_11','M_12_14','M_15_18','F_6_8','F_9_11','F_12_14','F_15_18'].includes(a.key as string));
  const satFat_19p = amdrAges.filter((a) => ['M_19_29','M_30_49','M_50_64','M_65_74','M_75P','F_19_29','F_30_49','F_50_64','F_65_74','F_75P','PREG','LACT'].includes(a.key as string));
  amdrPush('Saturated Fat', 8, null, 8, 'CDRR', 'Saturated fat <8% of total energy (ages 3-18).', satFat_3_18);
  amdrPush('Saturated Fat', 7, null, 7, 'CDRR', 'Saturated fat <7% of total energy (ages 19+).', satFat_19p);

  // Trans fat — ages 3+
  const trans_3p = amdrAges.filter((a) => a.key !== 'CHILD_1_2');
  amdrPush('Trans Fat', 1, null, 1, 'CDRR', 'Trans fatty acid <1% of total energy (ages 3+).', trans_3p);

  // Added Sugars CDRR — ages 1+ (all amdrAges)
  amdrPush('Added Sugars', 10, null, 10, 'CDRR', 'Added sugars ≤10% of total energy. Total sugars AMDR 10-20% (non-enforced).');

  // Cholesterol CDRR — adults 19+ only (300 mg/d, not % energy)
  const cholAges = amdrAges.filter((a) => ['M_19_29','M_30_49','M_50_64','M_65_74','M_75P','F_19_29','F_30_49','F_50_64','F_65_74','F_75P','PREG','LACT'].includes(a.key as string));
  for (const a of cholAges) {
    for (const { sex, lifeStage, min, max } of expandDemo(a.key)) {
      rows.push({
        compoundName: 'Cholesterol', ageMinMonths: min, ageMaxMonths: max,
        sex, lifeStage, valueType: 'CDRR', value: 300, unit: 'mg',
        valueNote: 'Cholesterol CDRR <300 mg/d for adults 19+.',
      });
    }
  }

  return rows;
}

// ═══════════════════════════════════════════════════════════════
// Seed
// ═══════════════════════════════════════════════════════════════

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
    console.log(`⚠️  Compounds not found (rows for these will be skipped): ${missing.join(', ')}\n`);
  }

  let inserted = 0, updated = 0, skipped = 0;
  for (const row of rows) {
    const compoundId = idByName.get(resolveDbName(row.compoundName));
    if (!compoundId) { skipped++; continue; }

    const result = await sql`
      INSERT INTO reference_daily_values (
        compound_id, source_region, source_id,
        age_min_months, age_max_months,
        sex, life_stage, value_type,
        value, value_min, value_max, unit,
        is_percent_of_energy, is_provisional, value_note
      ) VALUES (
        ${compoundId}, ${SOURCE.regionCode}, ${source.id},
        ${row.ageMinMonths}, ${row.ageMaxMonths},
        ${row.sex}, ${row.lifeStage}, ${row.valueType},
        ${row.value}, ${row.valueMin ?? null}, ${row.valueMax ?? null}, ${row.unit},
        ${row.isPercentOfEnergy ?? false}, false, ${row.valueNote ?? null}
      )
      ON CONFLICT (compound_id, source_region, age_min_months, age_max_months, sex, life_stage, value_type, activity_level, dietary_context)
      DO UPDATE SET
        value = EXCLUDED.value,
        value_min = EXCLUDED.value_min,
        value_max = EXCLUDED.value_max,
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
  console.log(`   Skipped:  ${skipped} (compound not found)`);
  console.log('─'.repeat(60));
}

seed()
  .catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); })
  .finally(() => sql.end());
