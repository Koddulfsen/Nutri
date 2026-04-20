/**
 * NHMRC/NZ-MoH Nutrient Reference Values for Australia and New Zealand (2006)
 * including 2017 updates (Fluoride — ages 0-8; Sodium — adults SDT + UL).
 *
 * See dv-sources/nhmrc-nrv/NOTES.md for full source notes.
 * See dv-sources/nhmrc-nrv/raw-values.ts for extracted data tables.
 *
 * Run: npx tsx db/seed/seed-au-nz-nhmrc-2006.ts
 */

import 'dotenv/config';
import postgres from 'postgres';
import {
  DEMOGRAPHICS, demo,
  PROTEIN, LINOLEIC, ALINOLENIC, LC_OMEGA3, FIBRE, WATER,
  THIAMIN, RIBOFLAVIN, NIACIN, B6, B12, FOLATE, PANTOTHENIC, BIOTIN,
  VITAMIN_A, VITAMIN_C, VITAMIN_D, VITAMIN_E, VITAMIN_K, CHOLINE,
  CALCIUM, PHOSPHORUS, ZINC, IRON,
  MAGNESIUM, IODINE, SELENIUM, MOLYBDENUM,
  COPPER, CHROMIUM, MANGANESE, FLUORIDE, SODIUM, POTASSIUM,
  ENERGY_INFANTS_MONTHLY, ENERGY_CHILDREN, ENERGY_ADULTS,
} from '../../dv-sources/nhmrc-nrv/raw-values';

const sql = postgres(process.env.DATABASE_URL!);

// ═══════════════════════════════════════════════════════════════
// Source metadata
// ═══════════════════════════════════════════════════════════════

const SOURCE = {
  authorityName: 'NHMRC / NZ MoH — Nutrient Reference Values for Australia and New Zealand',
  regionCode: 'AU_NZ',
  versionYear: 2006,
  sourceType: 'SCIENTIFIC_DRI' as const,
  url: 'https://www.nhmrc.gov.au/about-us/publications/nutrient-reference-values-australia-and-new-zealand-including-recommended-dietary-intakes',
  note: 'NHMRC 2006 NRVs + 2017 updates (Fluoride ages 0-8, Sodium adults SDT+UL). Adopts IOM/NIH framework: AI/EAR/RDI/UL/EER/AMDR/SDT. 16 demographic groups × M/F + preg/lact age splits (14-18, 19-30, 31-50). Infants use AI only (from BM). Energy stored at PAL 1.6 (Light) — median ht/wt for adults. Calcium 9-13y stored as upper bound per published growth recommendation. Magnesium UL = supplemental only. Folate UL = folic acid form (fortified/supplements). Niacin UL = nicotinic acid form. Vitamin B6 UL = pyridoxine. Sodium AI published as range 460-920 mg/d — stored midpoint with valueMin/valueMax. LC n-3 stored as Omega-3 (DHA+EPA+DPA sum).',
  retrievedDate: '2026-04-18',
};

// ═══════════════════════════════════════════════════════════════
// Compound name map (from Gate 2)
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
  'Choline': 'Choline (Total)',
  'Calcium': 'Calcium (Total)',
  'Magnesium': 'Magnesium (Total)',
  'Iron': 'Iron (Total)',
  'Zinc': 'Zinc (Total)',
  'Chromium': 'Chromium (Total)',
  'Selenium': 'Selenium (Total)',
};
function resolveDbName(n: string): string {
  return COMPOUND_NAME_MAP[n] ?? n;
}

// ═══════════════════════════════════════════════════════════════
// Row schema
// ═══════════════════════════════════════════════════════════════

type Sex = 'MALE' | 'FEMALE';
type LifeStage =
  | 'NONE' | 'PREGNANT' | 'PREGNANT_T1' | 'PREGNANT_T2' | 'PREGNANT_T3'
  | 'LACTATING' | 'LACTATING_0_6M' | 'LACTATING_7_12M';
type ValueType = 'RDA' | 'AI' | 'EAR' | 'UL' | 'CDRR' | 'SDT' | 'AMDR';
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
  valueNote?: string | null;
}

// ═══════════════════════════════════════════════════════════════
// Build rows
// ═══════════════════════════════════════════════════════════════

type NutrientBlock = {
  compoundName: string;
  unit: string;
  ai?: Record<string, number | null>;
  ear?: Record<string, number | null>;
  rdi?: Record<string, number | null>;
  ul?: Record<string, number | null>;
};

function expandDemographic(key: string): Array<{ sex: Sex; lifeStage: LifeStage; min: number; max: number | null }> {
  const d = demo(key);
  const lifeStageMap: Record<string, LifeStage> = {
    NONE: 'NONE',
    PREGNANT: 'PREGNANT',
    LACTATING: 'LACTATING',
  };
  const ls = lifeStageMap[d.lifeStage] ?? 'NONE';
  if (d.sex === 'BOTH') {
    return [
      { sex: 'MALE',   lifeStage: ls, min: d.minMonths, max: d.maxMonths },
      { sex: 'FEMALE', lifeStage: ls, min: d.minMonths, max: d.maxMonths },
    ];
  }
  return [{ sex: d.sex, lifeStage: ls, min: d.minMonths, max: d.maxMonths }];
}

function addNutrient(rows: SeedRow[], block: NutrientBlock, opts?: {
  aiNote?: string; earNote?: string; rdiNote?: string; ulNote?: string;
}) {
  const compound = block.compoundName;
  const unit = block.unit;
  const pairs: Array<[Record<string, number | null> | undefined, ValueType, string | undefined]> = [
    [block.ai,  'AI',  opts?.aiNote],
    [block.ear, 'EAR', opts?.earNote],
    [block.rdi, 'RDA', opts?.rdiNote],
    [block.ul,  'UL',  opts?.ulNote],
  ];
  for (const [map, valueType, note] of pairs) {
    if (!map) continue;
    for (const [demoKey, value] of Object.entries(map)) {
      if (value == null) continue;
      for (const { sex, lifeStage, min, max } of expandDemographic(demoKey)) {
        rows.push({
          compoundName: compound,
          ageMinMonths: min, ageMaxMonths: max,
          sex, lifeStage, valueType,
          value, unit,
          valueNote: note ?? null,
        });
      }
    }
  }
}

function buildAllRows(): SeedRow[] {
  const rows: SeedRow[] = [];

  // ─── B vitamins ───
  addNutrient(rows, THIAMIN);
  addNutrient(rows, RIBOFLAVIN);
  addNutrient(rows, NIACIN, { ulNote: 'UL is for nicotinic acid form. Supplemental nicotinamide UL: 900 mg/d adults (non-preg), 150 mg/d 1-3 y, 250 mg/d 4-8 y, 500 mg/d 9-13 y, 750 mg/d 14-18 y; not set for infancy.' });
  addNutrient(rows, B6, { ulNote: 'UL is set for pyridoxine form.' });
  addNutrient(rows, B12);
  addNutrient(rows, FOLATE, { ulNote: 'UL applies to folic acid from fortified foods and supplements only; no UL for food folate.' });
  addNutrient(rows, PANTOTHENIC);
  addNutrient(rows, BIOTIN);

  // ─── Other vitamins + Choline ───
  addNutrient(rows, VITAMIN_A);
  addNutrient(rows, VITAMIN_C);
  addNutrient(rows, VITAMIN_D);
  addNutrient(rows, VITAMIN_E);
  addNutrient(rows, VITAMIN_K);
  addNutrient(rows, CHOLINE);

  // ─── Minerals ───
  addNutrient(rows, CALCIUM, {
    earNote: '9-13 y value is the upper-bound (12-13 y) per COMA/NHMRC growth recommendation; 9-11 y effective EAR = 800 mg/d.',
    rdiNote: '9-13 y value is the upper-bound (12-13 y) per COMA/NHMRC growth recommendation; 9-11 y effective RDI = 1000 mg/d.',
  });
  addNutrient(rows, PHOSPHORUS);
  addNutrient(rows, ZINC);
  addNutrient(rows, IRON);
  addNutrient(rows, MAGNESIUM, { ulNote: 'UL refers to supplemental magnesium only (salts + supplements), not dietary.' });
  addNutrient(rows, IODINE);
  addNutrient(rows, SELENIUM);
  addNutrient(rows, MOLYBDENUM);
  addNutrient(rows, COPPER);
  addNutrient(rows, CHROMIUM);
  addNutrient(rows, MANGANESE);
  addNutrient(rows, FLUORIDE, { aiNote: 'Fluoride AI/UL for 0-8 y updated in 2017.' });
  addNutrient(rows, POTASSIUM);

  // Sodium — special (range AI + UL + SDT)
  for (const [demoKey, value] of Object.entries(SODIUM.ai)) {
    if (value == null) continue;
    const vmin = SODIUM.aiMin[demoKey] ?? null;
    const vmax = SODIUM.aiMax[demoKey] ?? null;
    for (const { sex, lifeStage, min, max } of expandDemographic(demoKey)) {
      rows.push({
        compoundName: 'Sodium', ageMinMonths: min, ageMaxMonths: max,
        sex, lifeStage, valueType: 'AI', value, unit: 'mg',
        valueMin: vmin, valueMax: vmax,
        valueNote: vmin != null ? `AI published as range ${vmin}-${vmax} mg/d; midpoint stored in value.` : null,
      });
    }
  }
  for (const [demoKey, value] of Object.entries(SODIUM.ul)) {
    if (value == null) continue;
    for (const { sex, lifeStage, min, max } of expandDemographic(demoKey)) {
      rows.push({
        compoundName: 'Sodium', ageMinMonths: min, ageMaxMonths: max,
        sex, lifeStage, valueType: 'UL', value, unit: 'mg',
        valueNote: '2017 update — UL added for 18+ adults (14-18 y extended to UL as upper bound of adult carryover).',
      });
    }
  }
  for (const [demoKey, value] of Object.entries(SODIUM.sdt)) {
    if (value == null) continue;
    for (const { sex, lifeStage, min, max } of expandDemographic(demoKey)) {
      rows.push({
        compoundName: 'Sodium', ageMinMonths: min, ageMaxMonths: max,
        sex, lifeStage, valueType: 'SDT', value, unit: 'mg',
        valueNote: '2017 update — Suggested Dietary Target (chronic disease reduction) for adults 19+.',
      });
    }
  }

  // ─── Macros ───
  addNutrient(rows, PROTEIN);
  addNutrient(rows, { compoundName: 'LA', unit: 'g', ai: LINOLEIC.ai });
  addNutrient(rows, { compoundName: 'ALA', unit: 'g', ai: ALINOLENIC.ai });
  addNutrient(rows, { compoundName: 'Omega-3', unit: 'mg', ai: LC_OMEGA3.ai, ul: LC_OMEGA3.ul }, {
    aiNote: 'LC n-3 (DHA + EPA + DPA) AI as published by NHMRC. Stored as Omega-3.',
    ulNote: 'UL for LC n-3 (supplemental DHA + EPA + DPA).',
  });
  addNutrient(rows, { compoundName: 'Dietary Fiber', unit: 'g', ai: FIBRE.ai });
  addNutrient(rows, { compoundName: 'Water', unit: 'mL', ai: WATER.ai }, {
    aiNote: 'Total water AI including water from foods + fluids. Pregnancy/lactation include BM output.',
  });

  // ─── Energy ───
  // Infants: single-month buckets (no activity_level)
  for (const r of ENERGY_INFANTS_MONTHLY) {
    rows.push({
      compoundName: 'Energy', ageMinMonths: r.ageMonth, ageMaxMonths: r.ageMonth,
      sex: 'MALE', lifeStage: 'NONE', valueType: 'EAR',
      value: r.kcalM, unit: 'kcal',
      valueNote: `NHMRC Table 1 infant EER at month ${r.ageMonth}.`,
    });
    rows.push({
      compoundName: 'Energy', ageMinMonths: r.ageMonth, ageMaxMonths: r.ageMonth,
      sex: 'FEMALE', lifeStage: 'NONE', valueType: 'EAR',
      value: r.kcalF, unit: 'kcal',
      valueNote: `NHMRC Table 1 infant EER at month ${r.ageMonth}.`,
    });
  }

  // Children/Adolescents 3-18 y at PAL 1.6 (Light, mapped to MODERATE)
  for (const r of ENERGY_CHILDREN) {
    const ageMin = r.year * 12;
    const ageMax = ageMin + 11;
    rows.push({
      compoundName: 'Energy', ageMinMonths: ageMin, ageMaxMonths: ageMax,
      sex: 'MALE', lifeStage: 'NONE', valueType: 'EAR',
      value: r.kcalM, unit: 'kcal', activityLevel: 'MODERATE',
      valueNote: 'NHMRC Table 2 child/adolescent EER at PAL 1.6 (Light), Schofield BMR × PAL.',
    });
    rows.push({
      compoundName: 'Energy', ageMinMonths: ageMin, ageMaxMonths: ageMax,
      sex: 'FEMALE', lifeStage: 'NONE', valueType: 'EAR',
      value: r.kcalF, unit: 'kcal', activityLevel: 'MODERATE',
      valueNote: 'NHMRC Table 2 child/adolescent EER at PAL 1.6 (Light), Schofield BMR × PAL.',
    });
  }

  // Adults — PAL 1.6 at median ht/wt
  for (const [demoKey, vals] of Object.entries(ENERGY_ADULTS)) {
    const d = demo(demoKey);
    if (d.sex === 'MALE') {
      rows.push({
        compoundName: 'Energy', ageMinMonths: d.minMonths, ageMaxMonths: d.maxMonths,
        sex: 'MALE', lifeStage: 'NONE', valueType: 'EAR',
        value: vals.kcalM, unit: 'kcal', activityLevel: 'MODERATE',
        valueNote: 'NHMRC Table 3 adult EER at PAL 1.6 (Light), 1.7m / 63.6kg reference (male).',
      });
    }
    // Mirror the female value using the same age band
    const fDemoKey = demoKey.replace('M_', 'F_');
    if (fDemoKey in DEMOGRAPHICS.reduce((acc, dd) => { acc[dd.key] = true; return acc; }, {} as Record<string, boolean>)) {
      const fd = demo(fDemoKey);
      rows.push({
        compoundName: 'Energy', ageMinMonths: fd.minMonths, ageMaxMonths: fd.maxMonths,
        sex: 'FEMALE', lifeStage: 'NONE', valueType: 'EAR',
        value: vals.kcalF, unit: 'kcal', activityLevel: 'MODERATE',
        valueNote: 'NHMRC Table 3 adult EER at PAL 1.6 (Light), 1.6m / 56.3kg reference (female).',
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
        activity_level,
        is_percent_of_energy, is_provisional, value_note
      ) VALUES (
        ${compoundId}, ${SOURCE.regionCode}, ${source.id},
        ${row.ageMinMonths}, ${row.ageMaxMonths},
        ${row.sex}, ${row.lifeStage}, ${row.valueType},
        ${row.value}, ${row.valueMin ?? null}, ${row.valueMax ?? null}, ${row.unit},
        ${row.activityLevel ?? null},
        false, false, ${row.valueNote ?? null}
      )
      ON CONFLICT (compound_id, source_region, age_min_months, age_max_months, sex, life_stage, value_type, activity_level, dietary_context)
      DO UPDATE SET
        value = EXCLUDED.value,
        value_min = EXCLUDED.value_min,
        value_max = EXCLUDED.value_max,
        unit = EXCLUDED.unit,
        source_id = EXCLUDED.source_id,
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
