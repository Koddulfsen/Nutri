/**
 * Taiwan HPA Dietary Reference Intakes 8th Edition
 * 衛生福利部國民健康署 - 國人膳食營養素參考攝取量 (DRIs) 第八版
 *
 * Book published Dec 2023 (112/12); content officially promulgated 111年 (2022).
 * Source: dv-sources/taiwan-dri-8/ntshb-backup.pdf (728-page book).
 * Summary tables at book pages 718-724.
 *
 * See dv-sources/taiwan-dri-8/NOTES.md for full source notes.
 * See dv-sources/taiwan-dri-8/raw-values.ts for extracted data.
 *
 * Run: npx tsx db/seed/seed-taiwan-hpa-2020.ts
 */

import 'dotenv/config';
import postgres from 'postgres';
import {
  DEMOGRAPHICS, demo, DEMO_KEYS,
  ENERGY_LIGHT_EAR, FIBER_AI,
  PROTEIN_AI, PROTEIN_RNI,
  CARB_EAR, CARB_RNI,
  VITAMIN_A_AI, VITAMIN_A_RNI, VITAMIN_A_UL,
  VITAMIN_D_AI, VITAMIN_D_UL,
  VITAMIN_E_AI, VITAMIN_E_UL,
  VITAMIN_K_AI,
  VITAMIN_C_AI, VITAMIN_C_RNI, VITAMIN_C_UL,
  THIAMIN_AI, THIAMIN_RNI,
  RIBOFLAVIN_AI, RIBOFLAVIN_RNI,
  NIACIN_AI, NIACIN_RNI, NIACIN_UL,
  B6_UL,
  B12_AI, B12_RNI,
  FOLATE_AI, FOLATE_RNI, FOLATE_UL,
  CHOLINE_AI, CHOLINE_UL,
  BIOTIN_AI, PANTOTHENIC_AI,
  CALCIUM_AI, CALCIUM_UL,
  PHOSPHORUS_AI, PHOSPHORUS_UL,
  MAGNESIUM_AI, MAGNESIUM_RNI, MAGNESIUM_UL,
  IRON_AI, IRON_RNI, IRON_UL,
  ZINC_AI, ZINC_RNI, ZINC_UL,
  IODINE_AI, IODINE_RNI, IODINE_UL,
  SELENIUM_AI, SELENIUM_RNI, SELENIUM_UL,
  FLUORIDE_AI, FLUORIDE_UL,
  SODIUM_CDRR, SODIUM_INFANT_AI,
  POTASSIUM_AI,
} from '../../dv-sources/taiwan-dri-8/raw-values';

const sql = postgres(process.env.DATABASE_URL!);

const SOURCE = {
  authorityName: 'Taiwan HPA — 國人膳食營養素參考攝取量 第八版 (DRIs 8th ed.)',
  regionCode: 'TAIWAN',
  versionYear: 2020,
  sourceType: 'SCIENTIFIC_DRI' as const,
  url: 'https://www.hpa.gov.tw/Pages/Detail.aspx?nodeid=4248&pid=12285',
  note: 'Taiwan DRI 8th edition, promulgated 中華民國 111 年 (2022), book reprinted 112年12月 (Dec 2023). Value types: EAR, RDA (稱建議量 RNI), AI (足夠攝取量), UL (上限攝取量), AMDR (可接受範圍), CDRR (only for Sodium). 12 main age bands × M/F split at 10歲+; pregnancy has 3 trimesters stored as PREGNANT_T1/T2/T3; single lactation bucket. Energy and fiber stored at 稍低 (light, PAL ~1.45) activity = MODERATE in Nutri enum. Uses Retinol Equivalent (RE) not RAE for Vitamin A (differs from other modern sources). Vitamin B6 skipped from this seed — summary table has ambiguous column; chapter-level extraction deferred. Water chapter deferred (not included in 8th edition per editor foreword). Amino acids not covered by Taiwan DRI.',
  retrievedDate: '2026-04-18',
};

const COMPOUND_NAME_MAP: Record<string, string> = {
  'Thiamin': 'Thiamin (B1)',
  'Riboflavin': 'Riboflavin (B2)',
  'Niacin': 'Niacin (B3)',
  'Vitamin B12': 'Vitamin B12 (Total)',
  'Folate': 'Folate (Total)',
  'Pantothenic acid': 'Pantothenic Acid (B5)',
  'Biotin': 'Biotin (B7)',
  'Vitamin A': 'Vitamin A (RAE)',  // Taiwan uses RE; store in RAE compound w/ note
  'Vitamin C': 'Vitamin C (Total)',
  'Vitamin D': 'Vitamin D (Total)',
  'Vitamin E': 'Vitamin E (Total)',
  'Vitamin K': 'Vitamin K (Total)',
  'Choline': 'Choline (Total)',
  'Calcium': 'Calcium (Total)',
  'Magnesium': 'Magnesium (Total)',
  'Iron': 'Iron (Total)',
  'Zinc': 'Zinc (Total)',
  'Selenium': 'Selenium (Total)',
  'Carbohydrate': 'Carbohydrates',
};
function resolveDbName(n: string): string {
  return COMPOUND_NAME_MAP[n] ?? n;
}

type Sex = 'MALE' | 'FEMALE';
type LifeStage = 'NONE' | 'PREGNANT_T1' | 'PREGNANT_T2' | 'PREGNANT_T3' | 'LACTATING';
type ValueType = 'RDA' | 'AI' | 'EAR' | 'UL' | 'CDRR' | 'AMDR';
type ActivityLevel = 'SEDENTARY' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE' | null;

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
  activityLevel?: ActivityLevel;
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
  map: Record<string, number | null>, note?: string, activityLevel?: ActivityLevel,
) {
  for (const demoKey of DEMO_KEYS) {
    const value = map[demoKey];
    if (value == null) continue;
    for (const { sex, lifeStage, min, max } of expandDemo(demoKey)) {
      rows.push({
        compoundName: compound, ageMinMonths: min, ageMaxMonths: max,
        sex, lifeStage, valueType, value, unit,
        activityLevel: activityLevel ?? null,
        valueNote: note ?? null,
      });
    }
  }
}

function buildAllRows(): SeedRow[] {
  const rows: SeedRow[] = [];

  // ─── ENERGY at 稍低 (Light, PAL ~1.45, mapped to MODERATE) ───
  pushFromMap(rows, 'Energy', 'kcal', 'EAR', ENERGY_LIGHT_EAR,
    'EER at 稍低 (light) activity level (PAL ≈ 1.45). Infants use AI basis (100 or 90 kcal/kg × reference weight). Preg T2/T3 +300 kcal; Lact +500 kcal.',
    'MODERATE');

  // ─── MACROS ───
  pushFromMap(rows, 'Carbohydrate', 'g', 'EAR', CARB_EAR,
    'Preg T2/T3: +35 EAR. Lact: +60.');
  pushFromMap(rows, 'Carbohydrate', 'g', 'RDA', CARB_RNI,
    'Preg T2/T3: +45 RDA. Lact: +80.');
  pushFromMap(rows, 'Protein', 'g', 'AI', PROTEIN_AI,
    'Infant AI: 2.3 g/kg × 6 kg = 14 g (0-6 mo); 2.1 g/kg × 8 kg = 17 g (7-12 mo).');
  pushFromMap(rows, 'Protein', 'g', 'RDA', PROTEIN_RNI,
    'Preg all trimesters +10. Lact +15.');
  pushFromMap(rows, 'Dietary Fiber', 'g', 'AI', FIBER_AI,
    'Fiber AI at 稍低 (light) activity level.', 'MODERATE');

  // ─── FAT-SOLUBLE VITAMINS ───
  pushFromMap(rows, 'Vitamin A', 'µg', 'AI', VITAMIN_A_AI,
    'Taiwan uses Retinol Equivalent (RE), NOT RAE. 1 µg RE = 1 µg retinol = 6 µg β-carotene. Stored in Vitamin A (RAE) compound with this caveat.');
  pushFromMap(rows, 'Vitamin A', 'µg', 'RDA', VITAMIN_A_RNI,
    'Taiwan uses Retinol Equivalent (RE), NOT RAE. Preg T3 +100, Lact +400.');
  pushFromMap(rows, 'Vitamin A', 'µg', 'UL', VITAMIN_A_UL);

  pushFromMap(rows, 'Vitamin D', 'µg', 'AI', VITAMIN_D_AI, '1 µg = 40 IU. Elderly 51+ gets 15 µg.');
  pushFromMap(rows, 'Vitamin D', 'µg', 'UL', VITAMIN_D_UL);

  pushFromMap(rows, 'Vitamin E', 'mg', 'AI', VITAMIN_E_AI, 'mg α-TE (alpha-tocopherol equivalent).');
  pushFromMap(rows, 'Vitamin E', 'mg', 'UL', VITAMIN_E_UL);

  pushFromMap(rows, 'Vitamin K', 'µg', 'AI', VITAMIN_K_AI);

  // ─── WATER-SOLUBLE VITAMINS ───
  pushFromMap(rows, 'Vitamin C', 'mg', 'AI', VITAMIN_C_AI);
  pushFromMap(rows, 'Vitamin C', 'mg', 'RDA', VITAMIN_C_RNI);
  pushFromMap(rows, 'Vitamin C', 'mg', 'UL', VITAMIN_C_UL);

  pushFromMap(rows, 'Thiamin', 'mg', 'AI', THIAMIN_AI);
  pushFromMap(rows, 'Thiamin', 'mg', 'RDA', THIAMIN_RNI);

  pushFromMap(rows, 'Riboflavin', 'mg', 'AI', RIBOFLAVIN_AI);
  pushFromMap(rows, 'Riboflavin', 'mg', 'RDA', RIBOFLAVIN_RNI);

  pushFromMap(rows, 'Niacin', 'mg', 'AI', NIACIN_AI, 'Expressed as mg NE (niacin equivalent).');
  pushFromMap(rows, 'Niacin', 'mg', 'RDA', NIACIN_RNI, 'Expressed as mg NE.');
  pushFromMap(rows, 'Niacin', 'mg', 'UL', NIACIN_UL, 'UL is for nicotinic acid form.');

  // Vitamin B6 UL only (RDA deferred due to summary-table ambiguity)
  pushFromMap(rows, 'Vitamin B6', 'mg', 'UL', B6_UL,
    'UL only. EAR/RDA data deferred pending chapter-level extraction.');

  pushFromMap(rows, 'Vitamin B12', 'µg', 'AI', B12_AI);
  pushFromMap(rows, 'Vitamin B12', 'µg', 'RDA', B12_RNI);

  pushFromMap(rows, 'Folate', 'µg', 'AI', FOLATE_AI, 'Expressed as µg DFE.');
  pushFromMap(rows, 'Folate', 'µg', 'RDA', FOLATE_RNI, 'Expressed as µg DFE. Preg +200 each trimester; women of child-bearing age should consume 400 µg folic acid/d.');
  pushFromMap(rows, 'Folate', 'µg', 'UL', FOLATE_UL,
    'UL applies to folic acid from fortified foods/supplements only.');

  pushFromMap(rows, 'Choline', 'mg', 'AI', CHOLINE_AI);
  pushFromMap(rows, 'Choline', 'mg', 'UL', CHOLINE_UL);

  pushFromMap(rows, 'Biotin', 'µg', 'AI', BIOTIN_AI);
  pushFromMap(rows, 'Pantothenic acid', 'mg', 'AI', PANTOTHENIC_AI);

  // ─── MACROMINERALS ───
  pushFromMap(rows, 'Calcium', 'mg', 'AI', CALCIUM_AI);
  pushFromMap(rows, 'Calcium', 'mg', 'UL', CALCIUM_UL);

  pushFromMap(rows, 'Phosphorus', 'mg', 'AI', PHOSPHORUS_AI);
  pushFromMap(rows, 'Phosphorus', 'mg', 'UL', PHOSPHORUS_UL);

  pushFromMap(rows, 'Magnesium', 'mg', 'AI', MAGNESIUM_AI);
  pushFromMap(rows, 'Magnesium', 'mg', 'RDA', MAGNESIUM_RNI);
  pushFromMap(rows, 'Magnesium', 'mg', 'UL', MAGNESIUM_UL, 'UL refers to supplemental Mg only.');

  // ─── MICROMINERALS ───
  pushFromMap(rows, 'Iron', 'mg', 'AI', IRON_AI);
  pushFromMap(rows, 'Iron', 'mg', 'RDA', IRON_RNI,
    'Females 13-50y: 15 mg RDA (menstruation). Preg T3 +30 mg. Taiwan footnote: preg T3-lactation typically needs +30 mg/d ferrous sulfate supplement.');
  pushFromMap(rows, 'Iron', 'mg', 'UL', IRON_UL);

  pushFromMap(rows, 'Zinc', 'mg', 'AI', ZINC_AI);
  pushFromMap(rows, 'Zinc', 'mg', 'RDA', ZINC_RNI, 'Preg +3 each trimester. Lact +3.');
  pushFromMap(rows, 'Zinc', 'mg', 'UL', ZINC_UL);

  pushFromMap(rows, 'Iodine', 'µg', 'AI', IODINE_AI);
  pushFromMap(rows, 'Iodine', 'µg', 'RDA', IODINE_RNI, 'Preg +75. Lact +100.');
  pushFromMap(rows, 'Iodine', 'µg', 'UL', IODINE_UL);

  pushFromMap(rows, 'Selenium', 'µg', 'AI', SELENIUM_AI);
  pushFromMap(rows, 'Selenium', 'µg', 'RDA', SELENIUM_RNI, 'Preg +5. Lact +15.');
  pushFromMap(rows, 'Selenium', 'µg', 'UL', SELENIUM_UL);

  pushFromMap(rows, 'Fluoride', 'mg', 'AI', FLUORIDE_AI);
  pushFromMap(rows, 'Fluoride', 'mg', 'UL', FLUORIDE_UL);

  pushFromMap(rows, 'Sodium', 'mg', 'AI', SODIUM_INFANT_AI,
    'Infant AI only (Taiwan does not set AI for Na ≥1y — only CDRR).');
  pushFromMap(rows, 'Sodium', 'mg', 'CDRR', SODIUM_CDRR,
    'Taiwan publishes CDRR (no EAR/RNI/AI for ≥1y). Aligned with WHO 2,000 mg target + guideline ~2,300 mg adult ceiling.');

  pushFromMap(rows, 'Potassium', 'mg', 'AI', POTASSIUM_AI,
    'Lact +400. Preg +0.');

  // ─── AMDR RANGES (% of energy, ages 1+) ───
  const amdrAges = [
    { key: 'CHILD_1_3', min: 12, max: 47 },
    { key: 'CHILD_4_6', min: 48, max: 83 },
    { key: 'CHILD_7_9', min: 84, max: 119 },
    { key: 'M_10_12', min: 120, max: 155 }, { key: 'F_10_12', min: 120, max: 155 },
    { key: 'M_13_15', min: 156, max: 191 }, { key: 'F_13_15', min: 156, max: 191 },
    { key: 'M_16_18', min: 192, max: 227 }, { key: 'F_16_18', min: 192, max: 227 },
    { key: 'M_19_30', min: 228, max: 371 }, { key: 'F_19_30', min: 228, max: 371 },
    { key: 'M_31_50', min: 372, max: 611 }, { key: 'F_31_50', min: 372, max: 611 },
    { key: 'M_51_70', min: 612, max: 851 }, { key: 'F_51_70', min: 612, max: 851 },
    { key: 'M_71P', min: 852, max: null }, { key: 'F_71P', min: 852, max: null },
    { key: 'PREG_T1', min: 228, max: 611 },
    { key: 'PREG_T2', min: 228, max: 611 },
    { key: 'PREG_T3', min: 228, max: 611 },
    { key: 'LACT', min: 228, max: 611 },
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

  // Carbohydrate 50-65% all
  amdrPush('Carbohydrate', 57.5, 50, 65, 'AMDR', 'Carbohydrate AMDR 50-65% of total energy (all 1+).');

  // Fat: 1-3y 30-40%, 4+ 20-30%
  amdrPush('Total Fat', 35, 30, 40, 'AMDR', 'Total fat AMDR 30-40% of total energy (1-3 y, growth period).',
           [{ key: 'CHILD_1_3', min: 12, max: 47 }]);
  amdrPush('Total Fat', 25, 20, 30, 'AMDR', 'Total fat AMDR 20-30% of total energy (4y+).',
           amdrAges.filter((a) => a.key !== 'CHILD_1_3'));

  // Saturated fat <10% for 4y+
  amdrPush('Saturated Fat', 10, null, 10, 'AMDR', 'Saturated fat <10% of total energy (4y+).',
           amdrAges.filter((a) => a.key !== 'CHILD_1_3'));

  // n-6 PUFA (Linoleic acid) AMDR 4-8% (all 1+)
  amdrPush('LA', 6, 4, 8, 'AMDR', 'Linoleic acid (n-6 PUFA) AMDR 4-8% of total energy.');

  // n-3 PUFA AMDR 0.6-1.2% — stored as Omega-3 (source covers ALA+EPA+DHA combined)
  amdrPush('Omega-3', 0.9, 0.6, 1.2, 'AMDR', 'n-3 PUFA (α-linolenic acid + EPA + DHA) AMDR 0.6-1.2% of total energy.');

  // Trans fat <1% (all 1+)
  amdrPush('Trans Fat', 1, null, 1, 'AMDR', 'Trans fatty acid <1% of total energy.');

  return rows;
}

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
        activity_level,
        is_percent_of_energy, is_provisional, value_note
      ) VALUES (
        ${compoundId}, ${SOURCE.regionCode}, ${source.id},
        ${row.ageMinMonths}, ${row.ageMaxMonths},
        ${row.sex}, ${row.lifeStage}, ${row.valueType},
        ${row.value}, ${row.valueMin ?? null}, ${row.valueMax ?? null}, ${row.unit},
        ${row.activityLevel ?? null},
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
