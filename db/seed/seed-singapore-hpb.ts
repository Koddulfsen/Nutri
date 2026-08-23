/**
 * Singapore HPB — Recommended Dietary Allowances
 * Source: Health Promotion Board RDAs via HealthHub.
 *
 * See dv-sources/hpb-singapore/NOTES.md and raw-values.ts.
 *
 * Run: npx tsx db/seed/seed-singapore-hpb.ts
 */

import 'dotenv/config';
import postgres from 'postgres';
import {
  DEMOGRAPHICS, demo, DEMO_KEYS,
  IRON_RDA, VITAMIN_A_RDA, VITAMIN_D_RDA,
  THIAMIN_RDA, RIBOFLAVIN_RDA, NIACIN_RDA, B6_RDA, B12_RDA,
  FOLATE_RDA, VITAMIN_C_RDA, CALCIUM_RDA,
  ENERGY_ROWS, ENERGY_CHILDREN,
} from '../../dv-sources/hpb-singapore/raw-values';

const sql = postgres(process.env.DATABASE_URL!);

const SOURCE = {
  authorityName: 'Singapore HPB — Recommended Dietary Allowances',
  regionCode: 'SINGAPORE',
  versionYear: 2012,  // MOH 2012 RDA update (canonical on HealthHub)
  sourceType: 'SCIENTIFIC_DRI' as const,
  url: 'https://www.healthhub.sg/well-being-and-lifestyle/food-diet-and-nutrition/recommended_dietary_allowances',
  note: 'Singapore Ministry of Health/HPB Recommended Dietary Allowances (2012). 10 vitamins + 2 minerals (Ca, Fe) + Energy at 3 PAL levels (Light/Moderate/Vigorous → SEDENTARY/MODERATE/ACTIVE). Age bands include 3-month infant buckets. Vitamin D notably low (2.5 µg) for ages 7-65 — relies on sun exposure in equatorial climate. Iron F 18-60: 18 mg menstruating; F 60+: 8 mg; Preg: 27 mg; Lact 0-6: 9 mg (menstruation suppressed); Lact 7+: 18 mg. B-vitamin pregnancy increments converted to absolute values. Energy pregnancy = adult F base + 370 (T2) / 480 (T3); stored as single PREG row at +480. Not covered: Phosphorus, K, Na, Mg, Zn, Iodine, Se, Cu, Vit E, K, Pantothenic, Biotin, Choline, macros (deferred to clinical guidelines).',
  retrievedDate: '2026-04-20',
};

const COMPOUND_NAME_MAP: Record<string, string> = {
  'Thiamin': 'Thiamin (B1)',
  'Riboflavin': 'Riboflavin (B2)',
  'Niacin': 'Niacin (B3)',
  'Vitamin B12': 'Vitamin B12 (Total)',
  'Folate': 'Folate (Total)',
  'Vitamin A': 'Vitamin A (RAE)',
  'Vitamin C': 'Vitamin C (Total)',
  'Vitamin D': 'Vitamin D (Total)',
  'Calcium': 'Calcium (Total)',
  'Iron': 'Iron (Total)',
};
function resolveDbName(n: string): string {
  return COMPOUND_NAME_MAP[n] ?? n;
}

type Sex = 'MALE' | 'FEMALE';
type LifeStage = 'NONE' | 'PREGNANT' | 'PREGNANT_T2' | 'PREGNANT_T3' | 'LACTATING_0_6M' | 'LACTATING_7_12M';
type ActivityLevel = 'SEDENTARY' | 'MODERATE' | 'ACTIVE' | null;

interface SeedRow {
  compoundName: string;
  ageMinMonths: number;
  ageMaxMonths: number | null;
  sex: Sex;
  lifeStage: LifeStage;
  valueType: 'RDA';
  value: number;
  unit: string;
  activityLevel?: ActivityLevel;
  valueNote?: string | null;
}

function expandDemo(key: string): Array<{ sex: Sex; lifeStage: LifeStage; min: number; max: number | null }> {
  const d = demo(key);
  if (d.sex === 'BOTH') {
    return [
      { sex: 'MALE',   lifeStage: d.lifeStage as LifeStage, min: d.minMonths, max: d.maxMonths },
      { sex: 'FEMALE', lifeStage: d.lifeStage as LifeStage, min: d.minMonths, max: d.maxMonths },
    ];
  }
  return [{ sex: d.sex, lifeStage: d.lifeStage as LifeStage, min: d.minMonths, max: d.maxMonths }];
}

function pushFromMap(
  rows: SeedRow[], compound: string, unit: string,
  map: Record<string, number | null>, note?: string,
) {
  for (const demoKey of DEMO_KEYS) {
    const value = map[demoKey];
    if (value == null) continue;
    for (const { sex, lifeStage, min, max } of expandDemo(demoKey)) {
      rows.push({
        compoundName: compound, ageMinMonths: min, ageMaxMonths: max,
        sex, lifeStage, valueType: 'RDA', value, unit, valueNote: note ?? null,
      });
    }
  }
}

function buildAllRows(): SeedRow[] {
  const rows: SeedRow[] = [];

  // Vitamins + minerals
  pushFromMap(rows, 'Iron', 'mg', IRON_RDA, 'F 60+ = 8 mg (postmeno); Lact 0-6 = 9 mg (suppressed menses).');
  pushFromMap(rows, 'Vitamin A', 'µg', VITAMIN_A_RDA, 'µg RE (stored in RAE compound).');
  pushFromMap(rows, 'Vitamin D', 'µg', VITAMIN_D_RDA, 'Singapore sets low 2.5 µg for ages 7-65 due to equatorial sun exposure.');
  pushFromMap(rows, 'Thiamin', 'mg', THIAMIN_RDA, 'Preg/lact include full-activity increment.');
  pushFromMap(rows, 'Riboflavin', 'mg', RIBOFLAVIN_RDA);
  pushFromMap(rows, 'Niacin', 'mg', NIACIN_RDA, 'mg NE.');
  pushFromMap(rows, 'Vitamin B6', 'mg', B6_RDA);
  pushFromMap(rows, 'Vitamin B12', 'µg', B12_RDA);
  pushFromMap(rows, 'Folate', 'µg', FOLATE_RDA, 'Listed as folic acid; assume DFE-equivalent.');
  pushFromMap(rows, 'Vitamin C', 'mg', VITAMIN_C_RDA);
  pushFromMap(rows, 'Calcium', 'mg', CALCIUM_RDA);

  // Energy rows with activity levels
  for (const e of ENERGY_ROWS) {
    const d = demo(e.demoKey);
    const sexes: Sex[] = d.sex === 'BOTH' ? ['MALE', 'FEMALE'] : [d.sex as Sex];
    for (const sex of sexes) {
      rows.push({
        compoundName: 'Energy', ageMinMonths: d.minMonths, ageMaxMonths: d.maxMonths,
        sex, lifeStage: d.lifeStage as LifeStage, valueType: 'RDA',
        value: e.kcal, unit: 'kcal', activityLevel: e.activity,
        valueNote: e.demoKey.startsWith('PREG') ? 'Pregnancy T3 addition (+480 over non-preg base).'
                : e.demoKey.startsWith('LACT') ? 'Lactation +500 kcal over non-lact base.'
                : null,
      });
    }
  }

  // Children 1-5 y energy (sex-specific single value, no activity)
  for (const c of ENERGY_CHILDREN) {
    const d = demo(c.demoKey);
    rows.push({
      compoundName: 'Energy', ageMinMonths: d.minMonths, ageMaxMonths: d.maxMonths,
      sex: 'MALE', lifeStage: 'NONE', valueType: 'RDA',
      value: c.sexM, unit: 'kcal', activityLevel: null,
      valueNote: 'Single value (no activity split for this age).',
    });
    rows.push({
      compoundName: 'Energy', ageMinMonths: d.minMonths, ageMaxMonths: d.maxMonths,
      sex: 'FEMALE', lifeStage: 'NONE', valueType: 'RDA',
      value: c.sexF, unit: 'kcal', activityLevel: null,
      valueNote: 'Single value (no activity split for this age).',
    });
  }

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
        false, false, ${row.valueNote ?? null}
      )
      ON CONFLICT (compound_id, source_region, age_min_months, age_max_months, sex, life_stage, value_type, activity_level, dietary_context)
      DO UPDATE SET
        value = EXCLUDED.value,
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
  console.log(`   Skipped:  ${skipped}`);
  console.log('─'.repeat(60));
}

seed()
  .catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); })
  .finally(() => sql.end());
