/**
 * AESAN 2019 — Spanish Scientific Committee Nutritional Reference Intakes
 * AESAN-2019-003, approved 22 May 2019.
 *
 * See dv-sources/aesan-2019/NOTES.md and raw-values.ts.
 *
 * Run: npx tsx db/seed/seed-spain-aesan-2019.ts
 */

import 'dotenv/config';
import postgres from 'postgres';
import {
  DEMOGRAPHICS, demo, DEMO_KEYS,
  VITAMIN_A_RDA, THIAMIN_RDA, RIBOFLAVIN_RDA, NIACIN_RDA,
  PANTOTHENIC_RDA, B6_RDA, FOLATE_RDA, B12_RDA,
  BIOTIN_RDA, VITAMIN_C_RDA, VITAMIN_D_RDA, VITAMIN_E_RDA, VITAMIN_K_RDA,
  CALCIUM_RDA, CHLORIDE_RDA, CHROMIUM_RDA, COPPER_RDA,
  FLUORIDE_RDA, PHOSPHORUS_RDA, IRON_RDA, IODINE_RDA,
  MAGNESIUM_RDA, MANGANESE_RDA, MOLYBDENUM_RDA, POTASSIUM_RDA,
  SELENIUM_RDA, SODIUM_RDA, ZINC_RDA,
  FIBER_AI,
} from '../../dv-sources/aesan-2019/raw-values';

const sql = postgres(process.env.DATABASE_URL!);

const SOURCE = {
  authorityName: 'AESAN — Ingestas Nutricionales de Referencia (Spain 2019)',
  regionCode: 'SPAIN',
  versionYear: 2019,
  sourceType: 'SCIENTIFIC_DRI' as const,
  url: 'https://www.aesan.gob.es/AECOSAN/docs/documentos/seguridad_alimentaria/evaluacion_riesgos/informes_comite/INR.pdf',
  note: 'AESAN-2019-003 Scientific Committee report on Nutritional Reference Intakes for Spanish population. Replaces FESNAD 2010. Methodology: harmonization algorithm across international sources (mode/median/mean). For macronutrients + energy: directly adopts EFSA 2017. For vitamins + minerals: applies AESAN-specific algorithm producing 13 vitamin + 15 mineral INR values. 13 age-sex demographics + Preg/Lact. Vit A in RE (stored in RAE). Vit D 10/12.5/15 µg tiered by age. Fluoride 0.25 mg for 0-6 mo (higher than WHO). Sodium 1,500 mg/d (EFSA-aligned). Fiber 25 g/d adults (EFSA AI). Macros (energy, protein, fat AMDR, carb, water) from Tables 1-5 not seeded to avoid EFSA duplication — fiber AI included as Spain-specific simplified table.',
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
};
function resolveDbName(n: string): string {
  return COMPOUND_NAME_MAP[n] ?? n;
}

type Sex = 'MALE' | 'FEMALE';
type LifeStage = 'NONE' | 'PREGNANT' | 'LACTATING';

interface SeedRow {
  compoundName: string;
  ageMinMonths: number;
  ageMaxMonths: number | null;
  sex: Sex;
  lifeStage: LifeStage;
  valueType: 'RDA' | 'AI';
  value: number;
  unit: string;
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
  rows: SeedRow[], compound: string, unit: string, valueType: 'RDA' | 'AI',
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

  // Vitamins
  pushFromMap(rows, 'Vitamin A', 'µg', 'RDA', VITAMIN_A_RDA, 'µg RE (stored in RAE).');
  pushFromMap(rows, 'Thiamin', 'mg', 'RDA', THIAMIN_RDA);
  pushFromMap(rows, 'Riboflavin', 'mg', 'RDA', RIBOFLAVIN_RDA);
  pushFromMap(rows, 'Niacin', 'mg', 'RDA', NIACIN_RDA, 'mg NE.');
  pushFromMap(rows, 'Pantothenic acid', 'mg', 'RDA', PANTOTHENIC_RDA);
  pushFromMap(rows, 'Vitamin B6', 'mg', 'RDA', B6_RDA);
  pushFromMap(rows, 'Folate', 'µg', 'RDA', FOLATE_RDA, 'µg DFE.');
  pushFromMap(rows, 'Vitamin B12', 'µg', 'RDA', B12_RDA);
  pushFromMap(rows, 'Biotin', 'µg', 'RDA', BIOTIN_RDA);
  pushFromMap(rows, 'Vitamin C', 'mg', 'RDA', VITAMIN_C_RDA);
  pushFromMap(rows, 'Vitamin D', 'µg', 'RDA', VITAMIN_D_RDA,
    'Tiered: 10 µg young; 12.5 µg middle-age; 15 µg elderly.');
  pushFromMap(rows, 'Vitamin E', 'mg', 'RDA', VITAMIN_E_RDA);
  pushFromMap(rows, 'Vitamin K', 'µg', 'RDA', VITAMIN_K_RDA);

  // Minerals
  pushFromMap(rows, 'Calcium', 'mg', 'RDA', CALCIUM_RDA);
  pushFromMap(rows, 'Chloride', 'mg', 'RDA', CHLORIDE_RDA);
  pushFromMap(rows, 'Chromium', 'µg', 'RDA', CHROMIUM_RDA);
  pushFromMap(rows, 'Copper', 'mg', 'RDA', COPPER_RDA);
  pushFromMap(rows, 'Fluoride', 'mg', 'RDA', FLUORIDE_RDA);
  pushFromMap(rows, 'Phosphorus', 'mg', 'RDA', PHOSPHORUS_RDA);
  pushFromMap(rows, 'Iron', 'mg', 'RDA', IRON_RDA,
    'Adolescent/adult F menstruating = 18 mg; F 50+ drops to 9 mg postmeno.');
  pushFromMap(rows, 'Iodine', 'µg', 'RDA', IODINE_RDA);
  pushFromMap(rows, 'Magnesium', 'mg', 'RDA', MAGNESIUM_RDA);
  pushFromMap(rows, 'Manganese', 'mg', 'RDA', MANGANESE_RDA);
  pushFromMap(rows, 'Molybdenum', 'µg', 'RDA', MOLYBDENUM_RDA);
  pushFromMap(rows, 'Potassium', 'mg', 'RDA', POTASSIUM_RDA);
  pushFromMap(rows, 'Selenium', 'µg', 'RDA', SELENIUM_RDA);
  pushFromMap(rows, 'Sodium', 'mg', 'RDA', SODIUM_RDA);
  pushFromMap(rows, 'Zinc', 'mg', 'RDA', ZINC_RDA);

  // Fiber
  pushFromMap(rows, 'Dietary Fiber', 'g', 'AI', FIBER_AI);

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
        value, unit,
        is_percent_of_energy, is_provisional, value_note
      ) VALUES (
        ${compoundId}, ${SOURCE.regionCode}, ${source.id},
        ${row.ageMinMonths}, ${row.ageMaxMonths},
        ${row.sex}, ${row.lifeStage}, ${row.valueType},
        ${row.value}, ${row.unit},
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
