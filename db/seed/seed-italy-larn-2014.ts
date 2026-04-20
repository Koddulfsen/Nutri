/**
 * Seed: LARN IV Revisione (Italy, 2014)
 *
 * Source: SINU — Società Italiana di Nutrizione Umana
 * Data scraped from eng.sinu.it/tabelle-larn-2014/ (vitamins + minerals).
 * No ULs / ARs in this first pass — web tables publish PRI/AI only.
 *
 * Run: npx tsx db/seed/seed-italy-larn-2014.ts
 */

import 'dotenv/config';
import postgres from 'postgres';
import {
  VITAMIN_PRI,
  MINERAL_PRI,
  AGE_RANGE,
  type AgeKey,
} from '../../dv-sources/larn-2014/raw-values';

const sql = postgres(process.env.DATABASE_URL!);

const SOURCE = {
  authorityName: 'LARN IV Revisione (SINU 2014)',
  regionCode: 'ITALY',
  versionYear: 2014,
  sourceType: 'SCIENTIFIC_DRI' as const,
  url: 'https://eng.sinu.it/tabelle-larn-2014/',
  note:
    'LARN IV Revisione — Italian Society of Human Nutrition (SINU). PRI = Population Reference Intake (≈RDA); AI = Adequate Intake. Web summary tables do not reliably mark PRI vs AI per nutrient — all values stored as RDA in this pass. No ULs / ARs available on free web tables. Pregnancy = single bucket (no trimester split). Iron has menstruation-conditional values captured in value_note. LARN V 2024 (updated edition) is commercially published — pending acquisition.',
  retrievedDate: '2026-04-14',
};

const COMPOUND_NAME_MAP: Record<string, string> = {
  'Vitamin C': 'Vitamin C (Total)',
  'Thiamin': 'Thiamin (B1)',
  'Riboflavin': 'Riboflavin (B2)',
  'Niacin': 'Niacin (B3)',
  'Pantothenic Acid': 'Pantothenic Acid (B5)',
  'Biotin': 'Biotin (B7)',
  'Folate': 'Folate (Total)',
  'Vitamin B12': 'Vitamin B12 (Total)',
  'Vitamin A': 'Vitamin A (RAE)',
  'Vitamin D': 'Vitamin D (Total)',
  'Vitamin E': 'Vitamin E (Total)',
  'Vitamin K': 'Vitamin K (Total)',
  'Calcium': 'Calcium (Total)',
  'Magnesium': 'Magnesium (Total)',
  'Iron': 'Iron (Total)',
  'Zinc': 'Zinc (Total)',
  'Selenium': 'Selenium (Total)',
  'Chromium': 'Chromium (Total)',
};
function resolveDbName(n: string): string {
  return COMPOUND_NAME_MAP[n] ?? n;
}

type Sex = 'MALE' | 'FEMALE';

interface SeedRow {
  compoundName: string;
  ageMinMonths: number;
  ageMaxMonths: number | null;
  sex: Sex;
  lifeStage: 'NONE' | 'PREGNANT' | 'LACTATING';
  valueType: 'RDA';
  value: number;
  unit: string;
  valueNote?: string | null;
}

// Nutrient -> compound name + unit mapping (vitamins)
const VITAMIN_META: Record<string, { compound: string; unit: string }> = {
  vitC:            { compound: 'Vitamin C',         unit: 'mg' },
  thiamin:         { compound: 'Thiamin',           unit: 'mg' },
  riboflavin:      { compound: 'Riboflavin',        unit: 'mg' },
  niacin:          { compound: 'Niacin',            unit: 'mg' },
  pantothenicAcid: { compound: 'Pantothenic Acid',  unit: 'mg' },
  vitB6:           { compound: 'Vitamin B6',        unit: 'mg' },
  biotin:          { compound: 'Biotin',            unit: 'µg' },
  folate:          { compound: 'Folate',            unit: 'µg' },
  vitB12:          { compound: 'Vitamin B12',       unit: 'µg' },
  vitA:            { compound: 'Vitamin A',         unit: 'µg' },
  vitD:            { compound: 'Vitamin D',         unit: 'µg' },
  vitE:            { compound: 'Vitamin E',         unit: 'mg' },
  vitK:            { compound: 'Vitamin K',         unit: 'µg' },
};

const MINERAL_META: Record<string, { compound: string; unit: string; fromGrams?: boolean }> = {
  calcium:      { compound: 'Calcium',    unit: 'mg' },
  phosphorus:   { compound: 'Phosphorus', unit: 'mg' },
  magnesium:    { compound: 'Magnesium',  unit: 'mg' },
  sodium_g:     { compound: 'Sodium',     unit: 'mg', fromGrams: true },
  potassium_g:  { compound: 'Potassium',  unit: 'mg', fromGrams: true },
  chloride_g:   { compound: 'Chloride',   unit: 'mg', fromGrams: true },
  iron:         { compound: 'Iron',       unit: 'mg' }, // handled specially below
  zinc:         { compound: 'Zinc',       unit: 'mg' },
  copper:       { compound: 'Copper',     unit: 'mg' },
  selenium:     { compound: 'Selenium',   unit: 'µg' },
  iodine:       { compound: 'Iodine',     unit: 'µg' },
  manganese:    { compound: 'Manganese',  unit: 'mg' },
  molybdenum:   { compound: 'Molybdenum', unit: 'µg' },
  chromium:     { compound: 'Chromium',   unit: 'µg' },
  fluoride:     { compound: 'Fluoride',   unit: 'mg' },
};

function ironRows(ageKey: AgeKey, iron: any): SeedRow[] {
  const r = AGE_RANGE[ageKey];
  const sexes: Sex[] = r.sex === 'BOTH' ? ['MALE', 'FEMALE'] : [r.sex];
  const rows: SeedRow[] = [];

  for (const sex of sexes) {
    if (typeof iron === 'number') {
      rows.push({
        compoundName: 'Iron',
        ageMinMonths: r.minMonths, ageMaxMonths: r.maxMonths,
        sex, lifeStage: r.lifeStage, valueType: 'RDA',
        value: iron, unit: 'mg',
      });
    } else if ('premenarche' in iron) {
      // F 11-14: store menstruating value with note
      rows.push({
        compoundName: 'Iron',
        ageMinMonths: r.minMonths, ageMaxMonths: r.maxMonths,
        sex, lifeStage: r.lifeStage, valueType: 'RDA',
        value: iron.menstruating, unit: 'mg',
        valueNote: `${iron.menstruating} mg for menstruating females; ${iron.premenarche} mg before menarche`,
      });
    } else if ('menstruating' in iron) {
      // F 30-59: store menstruating value with note
      rows.push({
        compoundName: 'Iron',
        ageMinMonths: r.minMonths, ageMaxMonths: r.maxMonths,
        sex, lifeStage: r.lifeStage, valueType: 'RDA',
        value: iron.menstruating, unit: 'mg',
        valueNote: `${iron.menstruating} mg for menstruating females; ${iron.postmenopausal} mg post-menopause`,
      });
    }
  }
  return rows;
}

function buildAllRows(): SeedRow[] {
  const rows: SeedRow[] = [];

  for (const key of Object.keys(VITAMIN_PRI) as AgeKey[]) {
    const r = AGE_RANGE[key];
    const vitValues = VITAMIN_PRI[key];
    const sexes: Sex[] = r.sex === 'BOTH' ? ['MALE', 'FEMALE'] : [r.sex];

    // Vitamins
    for (const [field, meta] of Object.entries(VITAMIN_META)) {
      const value = (vitValues as any)[field];
      if (value === null || value === undefined) continue;
      for (const sex of sexes) {
        rows.push({
          compoundName: meta.compound,
          ageMinMonths: r.minMonths, ageMaxMonths: r.maxMonths,
          sex, lifeStage: r.lifeStage, valueType: 'RDA',
          value, unit: meta.unit,
        });
      }
    }

    // Minerals (excluding iron which is handled specially)
    const minValues = MINERAL_PRI[key];
    for (const [field, meta] of Object.entries(MINERAL_META)) {
      if (field === 'iron') continue;
      const raw = (minValues as any)[field];
      if (raw === null || raw === undefined) continue;
      const value = meta.fromGrams ? raw * 1000 : raw;
      for (const sex of sexes) {
        rows.push({
          compoundName: meta.compound,
          ageMinMonths: r.minMonths, ageMaxMonths: r.maxMonths,
          sex, lifeStage: r.lifeStage, valueType: 'RDA',
          value, unit: meta.unit,
        });
      }
    }

    // Iron (special — menstruation conditional)
    rows.push(...ironRows(key, minValues.iron));
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
        value, unit, is_percent_of_energy, is_provisional, value_note
      ) VALUES (
        ${compoundId}, ${SOURCE.regionCode}, ${source.id},
        ${row.ageMinMonths}, ${row.ageMaxMonths},
        ${row.sex}, ${row.lifeStage}, ${row.valueType},
        ${row.value}, ${row.unit}, false, false, ${row.valueNote ?? null}
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
  console.log(`✅ LARN 2014 seed complete`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Updated:  ${updated}`);
  console.log(`   Skipped:  ${skipped}`);
  console.log('─'.repeat(60));
}

seed()
  .catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); })
  .finally(() => sql.end());
