/**
 * WHO/FAO 2004 — Vitamin and Mineral Requirements in Human Nutrition, 2nd ed.
 * Joint FAO/WHO Expert Consultation (Bangkok, 1998), published 2004.
 *
 * Source extraction: dv-sources/who-fao/NOTES.md + raw-values.ts
 * Primary ref: FAO appendix at https://www.fao.org/4/y2809e/y2809e0o.htm
 *
 * Run: npx tsx db/seed/seed-who-fao-2004.ts
 */

import 'dotenv/config';
import postgres from 'postgres';
import { DEMOGRAPHICS, demo, VITAMINS, MINERALS } from '../../dv-sources/who-fao/raw-values';

const sql = postgres(process.env.DATABASE_URL!);

const SOURCE = {
  authorityName: 'WHO/FAO — Vitamin and Mineral Requirements in Human Nutrition (2nd ed.)',
  regionCode: 'WHO_FAO',
  versionYear: 2004,
  sourceType: 'SCIENTIFIC_DRI' as const,
  url: 'https://www.who.int/publications/i/item/9241546123',
  note: 'WHO/FAO 2004 — Report of Joint FAO/WHO Expert Consultation on Human Vitamin and Mineral Requirements (Bangkok 1998). Only RNIs published (no EAR/UL/AMDR). 13 vitamins + 6 minerals. Iron stored at 15% bioavailability (high, mixed omnivorous diet) — source also published at 12%, 10%, 5%. Zinc stored at moderate bioavailability. Iron and Iodine adolescent split 10-14 / 15-18; other nutrients use combined 10-18. Pregnancy: single row for most; trimester split for Ca (T3 only), Fe, Zn, Se (T1/T2/T3). Lactation: single row for most; 0-6 / 7-12 mo split for Fe/Zn/Se. Vitamin A in RE (not RAE); Vit E labeled "acceptable intakes" not formal RNIs.',
  retrievedDate: '2026-04-20',
};

const COMPOUND_NAME_MAP: Record<string, string> = {
  'Thiamin': 'Thiamin (B1)',
  'Riboflavin': 'Riboflavin (B2)',
  'Niacin': 'Niacin (B3)',
  'Vitamin B12': 'Vitamin B12 (Total)',
  'Folate': 'Folate (Total)',
  'Pantothenate': 'Pantothenic Acid (B5)',
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
  'Selenium': 'Selenium (Total)',
};
function resolveDbName(n: string): string {
  return COMPOUND_NAME_MAP[n] ?? n;
}

type Sex = 'MALE' | 'FEMALE';
type LifeStage =
  | 'NONE' | 'PREGNANT' | 'PREGNANT_T1' | 'PREGNANT_T2' | 'PREGNANT_T3'
  | 'LACTATING' | 'LACTATING_0_6M' | 'LACTATING_7_12M';

interface SeedRow {
  compoundName: string;
  ageMinMonths: number;
  ageMaxMonths: number | null;
  sex: Sex;
  lifeStage: LifeStage;
  valueType: 'RDA';
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

function buildAllRows(): SeedRow[] {
  const rows: SeedRow[] = [];

  for (const block of [...VITAMINS, ...MINERALS]) {
    for (const [demoKey, value] of Object.entries(block.values)) {
      if (value == null) continue;
      for (const { sex, lifeStage, min, max } of expandDemo(demoKey)) {
        rows.push({
          compoundName: block.compoundName,
          ageMinMonths: min, ageMaxMonths: max,
          sex, lifeStage, valueType: 'RDA',
          value, unit: block.unit,
          valueNote: block.note ?? null,
        });
      }
    }
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
