/**
 * CNS 2023 — Chinese Nutrition Society Dietary Reference Intakes
 * Published Sept 2023. Revises 2013 edition.
 *
 * See dv-sources/cns-2023/NOTES.md and raw-values.ts.
 *
 * Run: npx tsx db/seed/seed-china-cns-2023.ts
 */

import 'dotenv/config';
import postgres from 'postgres';
import {
  DEMOGRAPHICS, demo, DEMO_KEYS,
  ENERGY_PAL2_EER,
  PROTEIN_AI, PROTEIN_EAR, PROTEIN_RNI,
  CARB_AI, CARB_EAR, FIBER_AI,
  CALCIUM_EAR, PHOSPHORUS_EAR, MAGNESIUM_EAR, IRON_EAR, IODINE_EAR, ZINC_EAR,
  SELENIUM_EAR, COPPER_EAR, MOLYBDENUM_EAR,
  VITAMIN_A_EAR, VITAMIN_D_EAR, THIAMIN_EAR, RIBOFLAVIN_EAR, NIACIN_EAR,
  B6_EAR, FOLATE_EAR, B12_EAR, VITAMIN_C_EAR,
  CALCIUM_RNI, PHOSPHORUS_RNI, POTASSIUM_AI, SODIUM_AI, MAGNESIUM_RNI, CHLORIDE_AI,
  IRON_RNI_M, IRON_RNI_F, IODINE_RNI, ZINC_RNI, SELENIUM_RNI, COPPER_RNI,
  FLUORIDE_AI, CHROMIUM_AI, MANGANESE_AI, MOLYBDENUM_RNI,
  VITAMIN_A_RNI_M, VITAMIN_A_RNI_F, VITAMIN_D_RNI, VITAMIN_E_AI, VITAMIN_K_AI,
  THIAMIN_RNI_M, THIAMIN_RNI_F, RIBOFLAVIN_RNI_M, RIBOFLAVIN_RNI_F,
  NIACIN_RNI_M, NIACIN_RNI_F, B6_RNI, FOLATE_RNI, B12_RNI,
  PANTOTHENIC_AI, BIOTIN_AI, CHOLINE_AI_M, CHOLINE_AI_F, VITAMIN_C_RNI,
  POTASSIUM_PI_NCD, SODIUM_PI_NCD, VITAMIN_C_PI_NCD,
  CALCIUM_UL, PHOSPHORUS_UL, IRON_UL, IODINE_UL, ZINC_UL, SELENIUM_UL,
  COPPER_UL, FLUORIDE_UL, MANGANESE_UL, MOLYBDENUM_UL,
  VITAMIN_A_UL, VITAMIN_D_UL, VITAMIN_E_UL, NIACIN_UL, B6_UL, FOLATE_UL, CHOLINE_UL, VITAMIN_C_UL,
  WATER_TOTAL_AI_M, WATER_TOTAL_AI_F,
} from '../../dv-sources/cns-2023/raw-values';

const sql = postgres(process.env.DATABASE_URL!);

const SOURCE = {
  authorityName: '中国营养学会 CNS — Dietary Reference Intakes for China (2023版)',
  regionCode: 'CHINA',
  versionYear: 2023,
  sourceType: 'SCIENTIFIC_DRI' as const,
  url: 'https://www.cnsoc.org/',
  note: 'Chinese Nutrition Society DRIs 2023 edition (revises 2013). Published September 2023. ISBN 978-7-117-35069-3. Full value-type coverage: EAR, RNI→RDA, AI, UL, AMDR, PI-NCD→CDRR. 13 vitamins + 15 minerals + macros + water. Pregnancy 3-trimester split (孕早/中/晚期 → PREGNANT_T1/T2/T3). Energy stored at PAL II (moderate) only. Iron F 50-64y has two values (10 postmenopausal / 18 menstruating); we store postmeno default. Vit A uses RAE (matches modern standard). Added sugars AMDR <10% energy. PI-NCD (disease prevention intake): K/Na/Vit C adult-specific ceilings or targets. Extracted from 附录三 pages 628-639. 2nd largest source by nutrient breadth after KDRI.',
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
  'Choline': 'Choline (Total)',
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

type Sex = 'MALE' | 'FEMALE';
type LifeStage = 'NONE' | 'PREGNANT_T1' | 'PREGNANT_T2' | 'PREGNANT_T3' | 'LACTATING';
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

function buildAllRows(): SeedRow[] {
  const rows: SeedRow[] = [];

  // ─── ENERGY at PAL II (moderate) ───
  pushFromMap(rows, 'Energy', 'kcal', 'EAR', ENERGY_PAL2_EER,
    'EER at PAL II (moderate activity, PAL ~1.7). Infants from per-kg × reference weight.');

  // ─── MACROS ───
  pushFromMap(rows, 'Protein', 'g', 'AI', PROTEIN_AI);
  pushFromMap(rows, 'Protein', 'g', 'EAR', PROTEIN_EAR);
  pushFromMap(rows, 'Protein', 'g', 'RDA', PROTEIN_RNI,
    'Pregnancy cumulative: T1 +0, T2 +15, T3 +30. Lact +25.');
  pushFromMap(rows, 'Carbohydrate', 'g', 'AI', CARB_AI);
  pushFromMap(rows, 'Carbohydrate', 'g', 'EAR', CARB_EAR);
  pushFromMap(rows, 'Dietary Fiber', 'g', 'AI', FIBER_AI);

  // ─── MICROMINERAL EAR ───
  pushFromMap(rows, 'Calcium', 'mg', 'EAR', CALCIUM_EAR);
  pushFromMap(rows, 'Phosphorus', 'mg', 'EAR', PHOSPHORUS_EAR);
  pushFromMap(rows, 'Magnesium', 'mg', 'EAR', MAGNESIUM_EAR);
  pushFromMap(rows, 'Iron', 'mg', 'EAR', IRON_EAR);
  pushFromMap(rows, 'Iodine', 'µg', 'EAR', IODINE_EAR);
  pushFromMap(rows, 'Zinc', 'mg', 'EAR', ZINC_EAR);
  pushFromMap(rows, 'Selenium', 'µg', 'EAR', SELENIUM_EAR);
  pushFromMap(rows, 'Copper', 'mg', 'EAR', COPPER_EAR);
  pushFromMap(rows, 'Molybdenum', 'µg', 'EAR', MOLYBDENUM_EAR);
  pushFromMap(rows, 'Vitamin A', 'µg', 'EAR', VITAMIN_A_EAR,
    'µg RAE. Male values (F similar for children).');
  pushFromMap(rows, 'Vitamin D', 'µg', 'EAR', VITAMIN_D_EAR);
  pushFromMap(rows, 'Thiamin', 'mg', 'EAR', THIAMIN_EAR);
  pushFromMap(rows, 'Riboflavin', 'mg', 'EAR', RIBOFLAVIN_EAR);
  pushFromMap(rows, 'Niacin', 'mg', 'EAR', NIACIN_EAR, 'mg NE.');
  pushFromMap(rows, 'Vitamin B6', 'mg', 'EAR', B6_EAR);
  pushFromMap(rows, 'Folate', 'µg', 'EAR', FOLATE_EAR, 'µg DFE.');
  pushFromMap(rows, 'Vitamin B12', 'µg', 'EAR', B12_EAR);
  pushFromMap(rows, 'Vitamin C', 'mg', 'EAR', VITAMIN_C_EAR);

  // ─── MINERAL RNI / AI (Table 3-7) ───
  pushFromMap(rows, 'Calcium', 'mg', 'RDA', CALCIUM_RNI);
  pushFromMap(rows, 'Phosphorus', 'mg', 'RDA', PHOSPHORUS_RNI);
  pushFromMap(rows, 'Potassium', 'mg', 'AI', POTASSIUM_AI);
  pushFromMap(rows, 'Sodium', 'mg', 'AI', SODIUM_AI);
  pushFromMap(rows, 'Magnesium', 'mg', 'RDA', MAGNESIUM_RNI);
  pushFromMap(rows, 'Chloride', 'mg', 'AI', CHLORIDE_AI);

  // Iron RDA — Male map only has males, Female map has females; merge
  pushFromMap(rows, 'Iron', 'mg', 'RDA', IRON_RNI_M,
    'F 50-64 premenopausal: 18 mg (menstruating); store postmeno = 10. Split by dietary_context future work.');
  pushFromMap(rows, 'Iron', 'mg', 'RDA', IRON_RNI_F,
    'F 50-64 premenopausal: 18 mg (menstruating); store postmeno = 10.');

  pushFromMap(rows, 'Iodine', 'µg', 'RDA', IODINE_RNI);
  pushFromMap(rows, 'Zinc', 'mg', 'RDA', ZINC_RNI);
  pushFromMap(rows, 'Selenium', 'µg', 'RDA', SELENIUM_RNI);
  pushFromMap(rows, 'Copper', 'mg', 'RDA', COPPER_RNI);
  pushFromMap(rows, 'Fluoride', 'mg', 'AI', FLUORIDE_AI);
  pushFromMap(rows, 'Chromium', 'µg', 'AI', CHROMIUM_AI);
  pushFromMap(rows, 'Manganese', 'mg', 'AI', MANGANESE_AI);
  pushFromMap(rows, 'Molybdenum', 'µg', 'RDA', MOLYBDENUM_RNI);

  // ─── VITAMIN RNI / AI (Table 3-8) ───
  pushFromMap(rows, 'Vitamin A', 'µg', 'RDA', VITAMIN_A_RNI_M, 'µg RAE (male).');
  pushFromMap(rows, 'Vitamin A', 'µg', 'RDA', VITAMIN_A_RNI_F, 'µg RAE (female).');
  pushFromMap(rows, 'Vitamin D', 'µg', 'RDA', VITAMIN_D_RNI);
  pushFromMap(rows, 'Vitamin E', 'mg', 'AI', VITAMIN_E_AI, 'α-TE.');
  pushFromMap(rows, 'Vitamin K', 'µg', 'AI', VITAMIN_K_AI);
  pushFromMap(rows, 'Thiamin', 'mg', 'RDA', THIAMIN_RNI_M);
  pushFromMap(rows, 'Thiamin', 'mg', 'RDA', THIAMIN_RNI_F);
  pushFromMap(rows, 'Riboflavin', 'mg', 'RDA', RIBOFLAVIN_RNI_M);
  pushFromMap(rows, 'Riboflavin', 'mg', 'RDA', RIBOFLAVIN_RNI_F);
  pushFromMap(rows, 'Niacin', 'mg', 'RDA', NIACIN_RNI_M, 'mg NE.');
  pushFromMap(rows, 'Niacin', 'mg', 'RDA', NIACIN_RNI_F, 'mg NE.');
  pushFromMap(rows, 'Vitamin B6', 'mg', 'RDA', B6_RNI);
  pushFromMap(rows, 'Folate', 'µg', 'RDA', FOLATE_RNI, 'µg DFE. Preg: +200 all trimesters; women of childbearing age should consume 400 µg folic acid supplement.');
  pushFromMap(rows, 'Vitamin B12', 'µg', 'RDA', B12_RNI);
  pushFromMap(rows, 'Pantothenic acid', 'mg', 'AI', PANTOTHENIC_AI);
  pushFromMap(rows, 'Biotin', 'µg', 'AI', BIOTIN_AI);
  pushFromMap(rows, 'Choline', 'mg', 'AI', CHOLINE_AI_M);
  pushFromMap(rows, 'Choline', 'mg', 'AI', CHOLINE_AI_F);
  pushFromMap(rows, 'Vitamin C', 'mg', 'RDA', VITAMIN_C_RNI);

  // ─── PI-NCD (Table 3-9) → CDRR ───
  pushFromMap(rows, 'Potassium', 'mg', 'CDRR', POTASSIUM_PI_NCD,
    'PI-NCD (disease risk reduction target) — aim for this or higher for cardiovascular benefits.');
  pushFromMap(rows, 'Sodium', 'mg', 'CDRR', SODIUM_PI_NCD,
    'PI-NCD ceiling — stay under.');
  pushFromMap(rows, 'Vitamin C', 'mg', 'CDRR', VITAMIN_C_PI_NCD,
    'PI-NCD 200 mg/d adults — disease prevention target.');

  // ─── UL (Table 3-10) ───
  pushFromMap(rows, 'Calcium', 'mg', 'UL', CALCIUM_UL);
  pushFromMap(rows, 'Phosphorus', 'mg', 'UL', PHOSPHORUS_UL);
  pushFromMap(rows, 'Iron', 'mg', 'UL', IRON_UL);
  pushFromMap(rows, 'Iodine', 'µg', 'UL', IODINE_UL);
  pushFromMap(rows, 'Zinc', 'mg', 'UL', ZINC_UL);
  pushFromMap(rows, 'Selenium', 'µg', 'UL', SELENIUM_UL);
  pushFromMap(rows, 'Copper', 'mg', 'UL', COPPER_UL);
  pushFromMap(rows, 'Fluoride', 'mg', 'UL', FLUORIDE_UL);
  pushFromMap(rows, 'Manganese', 'mg', 'UL', MANGANESE_UL);
  pushFromMap(rows, 'Molybdenum', 'µg', 'UL', MOLYBDENUM_UL);
  pushFromMap(rows, 'Vitamin A', 'µg', 'UL', VITAMIN_A_UL);
  pushFromMap(rows, 'Vitamin D', 'µg', 'UL', VITAMIN_D_UL);
  pushFromMap(rows, 'Vitamin E', 'mg', 'UL', VITAMIN_E_UL);
  pushFromMap(rows, 'Niacin', 'mg', 'UL', NIACIN_UL, 'Nicotinic acid form (stricter).');
  pushFromMap(rows, 'Vitamin B6', 'mg', 'UL', B6_UL);
  pushFromMap(rows, 'Folate', 'µg', 'UL', FOLATE_UL, 'Folic acid form from fortified foods/supplements.');
  pushFromMap(rows, 'Choline', 'mg', 'UL', CHOLINE_UL);
  pushFromMap(rows, 'Vitamin C', 'mg', 'UL', VITAMIN_C_UL);

  // ─── WATER (Table 3-11) ───
  pushFromMap(rows, 'Water', 'mL', 'AI', WATER_TOTAL_AI_M,
    'Total water AI including food and drink (M).');
  pushFromMap(rows, 'Water', 'mL', 'AI', WATER_TOTAL_AI_F,
    'Total water AI including food and drink (F).');

  // ─── AMDR ranges (Tables 3-3, 3-4, 3-5) ───
  const amdrAges = [
    { key: 'CHILD_1_3', min: 12, max: 47 },
    { key: 'CHILD_4_6', min: 48, max: 83 },
    { key: 'CHILD_7_8', min: 84, max: 107 },
    { key: 'CHILD_9_11', min: 108, max: 143 },
    { key: 'M_12_14', min: 144, max: 179 }, { key: 'F_12_14', min: 144, max: 179 },
    { key: 'M_15_17', min: 180, max: 215 }, { key: 'F_15_17', min: 180, max: 215 },
    { key: 'M_18_29', min: 216, max: 359 }, { key: 'F_18_29', min: 216, max: 359 },
    { key: 'M_30_49', min: 360, max: 599 }, { key: 'F_30_49', min: 360, max: 599 },
    { key: 'M_50_64', min: 600, max: 779 }, { key: 'F_50_64', min: 600, max: 779 },
    { key: 'M_65_74', min: 780, max: 899 }, { key: 'F_65_74', min: 780, max: 899 },
    { key: 'M_75P', min: 900, max: null }, { key: 'F_75P', min: 900, max: null },
    { key: 'PREG_T1', min: 216, max: 599 },
    { key: 'PREG_T2', min: 216, max: 599 },
    { key: 'PREG_T3', min: 216, max: 599 },
    { key: 'LACT', min: 216, max: 599 },
  ] as const;
  function amdrPush(compound: string, value: number, valueMin: number | null, valueMax: number | null, valueType: ValueType, note: string, ages = amdrAges) {
    for (const a of ages) {
      for (const { sex, lifeStage, min, max } of expandDemo(a.key)) {
        rows.push({
          compoundName: compound, ageMinMonths: min, ageMaxMonths: max,
          sex, lifeStage, valueType, value, unit: '%',
          valueMin: valueMin ?? null, valueMax: valueMax ?? null,
          isPercentOfEnergy: true,
          valueNote: note,
        });
      }
    }
  }

  // Carbohydrate AMDR 50-65% (1y+)
  amdrPush('Carbohydrate', 57.5, 50, 65, 'AMDR', 'Carbohydrate AMDR 50-65% of total energy.');
  // Protein AMDR varies by age
  amdrPush('Protein', 14, 8, 20, 'AMDR', 'Protein AMDR 8-20% (4-5 y).',
           [{ key: 'CHILD_4_6', min: 48, max: 83 }]);
  amdrPush('Protein', 15, 10, 20, 'AMDR', 'Protein AMDR 10-20% (6+ y).',
           amdrAges.filter((a) => a.key !== 'CHILD_4_6' && a.key !== 'CHILD_1_3'));
  // Fat AMDR: 1-3y 35%, 4+ 20-30%
  amdrPush('Total Fat', 35, null, 35, 'AMDR', 'Total Fat AI (1-3 y).',
           [{ key: 'CHILD_1_3', min: 12, max: 47 }]);
  amdrPush('Total Fat', 25, 20, 30, 'AMDR', 'Total fat AMDR 20-30% (4y+).',
           amdrAges.filter((a) => a.key !== 'CHILD_1_3'));
  // Saturated fat <8% for 4-17y, <10% for 18+
  amdrPush('Saturated Fat', 8, null, 8, 'AMDR', 'Saturated fat <8% (4-17 y).',
           amdrAges.filter((a) => ['CHILD_4_6','CHILD_7_8','CHILD_9_11','M_12_14','F_12_14','M_15_17','F_15_17'].includes(a.key as string)));
  amdrPush('Saturated Fat', 10, null, 10, 'AMDR', 'Saturated fat <10% (18y+).',
           amdrAges.filter((a) => ['M_18_29','F_18_29','M_30_49','F_30_49','M_50_64','F_50_64','M_65_74','F_65_74','M_75P','F_75P','PREG_T1','PREG_T2','PREG_T3','LACT'].includes(a.key as string)));
  // n-6 PUFA (LA) AMDR 2.5-9.0 %E (18+)
  amdrPush('LA', 5.75, 2.5, 9.0, 'AMDR', 'Linoleic acid (n-6) AMDR 2.5-9% energy (18y+).',
           amdrAges.filter((a) => ['M_18_29','F_18_29','M_30_49','F_30_49','M_50_64','F_50_64','M_65_74','F_65_74','M_75P','F_75P','PREG_T1','PREG_T2','PREG_T3','LACT'].includes(a.key as string)));
  // n-3 PUFA (ALA) AMDR 0.5-2% (18+)
  amdrPush('ALA', 1.25, 0.5, 2.0, 'AMDR', 'α-linolenic acid (n-3) AMDR 0.5-2% energy (18y+).',
           amdrAges.filter((a) => ['M_18_29','F_18_29','M_30_49','F_30_49','M_50_64','F_50_64','M_65_74','F_65_74','M_75P','F_75P','PREG_T1','PREG_T2','PREG_T3','LACT'].includes(a.key as string)));
  // LA AI 4% energy for 1y+
  amdrPush('LA', 4, null, null, 'AI', 'Linoleic acid AI 4% energy (1-17 y).',
           amdrAges.filter((a) => !['M_18_29','F_18_29','M_30_49','F_30_49','M_50_64','F_50_64','M_65_74','F_65_74','M_75P','F_75P','PREG_T1','PREG_T2','PREG_T3','LACT'].includes(a.key as string)));
  // Added sugars CDRR <10% (4+)
  amdrPush('Added Sugars', 10, null, 10, 'CDRR', 'Added sugars <10% energy (4y+). ≤50 g/d, ideally <25 g/d.',
           amdrAges.filter((a) => a.key !== 'CHILD_1_3'));

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

  const rows = buildAllRows().filter((r) => r.value !== 0);  // Drop "+0" pregnancy zero-addition placeholder rows
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
  console.log(`   Skipped:  ${skipped}`);
  console.log('─'.repeat(60));
}

seed()
  .catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); })
  .finally(() => sql.end());
