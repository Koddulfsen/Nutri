/**
 * Seed: ICMR-NIN 2020 (India)
 *
 * Source: ICMR-NIN Expert Group on Nutrient Requirement for Indians, 2020.
 * Data from the free brief-note.pdf (Tables 1a/1b, 2a, 3, 4).
 * Full book (commercial ₹400) has more detail — this pass covers:
 *   - Energy (all ages × activity)
 *   - Protein EAR + RDA (all demographics)
 *   - Adult micronutrients EAR + RDA (14 nutrients, M + F)
 *
 * Run: npx tsx db/seed/seed-india-icmr-2020.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const SOURCE = {
  authorityName: 'ICMR-NIN Nutrient Requirements 2020 (India)',
  regionCode: 'INDIA',
  versionYear: 2020,
  sourceType: 'SCIENTIFIC_DRI' as const,
  url: 'https://www.nin.res.in/rdabook/brief_note.pdf',
  note: 'ICMR-NIN 2020 Recommended Dietary Allowances and Estimated Average Requirements. Free brief note only (6 pp). Full commercial book contains child/teen micros, ULs, and 14 other nutrients not seeded here. Activity levels apply to energy + protein (values same across activity for micros). Vitamin D IU→µg converted (1 µg = 40 IU). Iron F is high (29 mg RDA) reflecting Indian dietary iron bioavailability ~8%.',
  retrievedDate: '2026-04-14',
};

const COMPOUND_NAME_MAP: Record<string, string> = {
  'Calcium': 'Calcium (Total)',
  'Magnesium': 'Magnesium (Total)',
  'Iron': 'Iron (Total)',
  'Zinc': 'Zinc (Total)',
  'Riboflavin': 'Riboflavin (B2)',
  'Niacin': 'Niacin (B3)',
  'Folate': 'Folate (Total)',
  'Vitamin B12': 'Vitamin B12 (Total)',
  'Vitamin C': 'Vitamin C (Total)',
  'Vitamin A': 'Vitamin A (RAE)',
  'Vitamin D': 'Vitamin D (Total)',
  'Thiamine': 'Thiamin (B1)', // ICMR uses "Thiamine"; DB uses "Thiamin"
  'Vitamin B6': 'Vitamin B6',
  'Iodine': 'Iodine',
  'Energy': 'Energy',
  'Protein': 'Protein',
};
function resolveDbName(n: string): string {
  return COMPOUND_NAME_MAP[n] ?? n;
}

type Sex = 'MALE' | 'FEMALE';
type LifeStage = 'NONE' | 'PREGNANT_T2' | 'PREGNANT_T3' | 'LACTATING_0_6M' | 'LACTATING_7_12M';
type Activity = 'SEDENTARY' | 'MODERATE' | 'VERY_ACTIVE' | null;

interface SeedRow {
  compoundName: string;
  ageMinMonths: number;
  ageMaxMonths: number | null;
  sex: Sex;
  lifeStage: LifeStage;
  activityLevel: Activity;
  valueType: 'RDA' | 'EAR';
  value: number;
  unit: string;
  valueNote?: string | null;
}

// ═══════════════════════════════════════════════════════════════
// Energy — Table 1a (kcal/d)
// ═══════════════════════════════════════════════════════════════

const ENERGY_ROWS: Array<{
  label: string; minMo: number; maxMo: number | null;
  sex: Sex | 'BOTH'; activity: Activity; lifeStage: LifeStage;
  kcal: number;
}> = [
  { label: 'Infants 0-6m',     minMo: 0,    maxMo: 6,    sex: 'BOTH',   activity: null, lifeStage: 'NONE', kcal: 530 },
  { label: 'Infants 6-12m',    minMo: 6,    maxMo: 12,   sex: 'BOTH',   activity: null, lifeStage: 'NONE', kcal: 660 },
  { label: 'Children 1-3y',    minMo: 12,   maxMo: 47,   sex: 'BOTH',   activity: null, lifeStage: 'NONE', kcal: 1070 },
  { label: 'Children 4-6y',    minMo: 48,   maxMo: 83,   sex: 'BOTH',   activity: null, lifeStage: 'NONE', kcal: 1360 },
  { label: 'Children 7-9y',    minMo: 84,   maxMo: 119,  sex: 'BOTH',   activity: null, lifeStage: 'NONE', kcal: 1700 },
  { label: 'Boys 10-12y',      minMo: 120,  maxMo: 155,  sex: 'MALE',   activity: null, lifeStage: 'NONE', kcal: 2220 },
  { label: 'Girls 10-12y',     minMo: 120,  maxMo: 155,  sex: 'FEMALE', activity: null, lifeStage: 'NONE', kcal: 2060 },
  { label: 'Boys 13-15y',      minMo: 156,  maxMo: 191,  sex: 'MALE',   activity: null, lifeStage: 'NONE', kcal: 2860 },
  { label: 'Girls 13-15y',     minMo: 156,  maxMo: 191,  sex: 'FEMALE', activity: null, lifeStage: 'NONE', kcal: 2400 },
  { label: 'Boys 16-18y',      minMo: 192,  maxMo: 215,  sex: 'MALE',   activity: null, lifeStage: 'NONE', kcal: 3320 },
  { label: 'Girls 16-18y',     minMo: 192,  maxMo: 215,  sex: 'FEMALE', activity: null, lifeStage: 'NONE', kcal: 2500 },
  // Adults by activity
  { label: 'Men Sedentary',    minMo: 216,  maxMo: null, sex: 'MALE',   activity: 'SEDENTARY',   lifeStage: 'NONE', kcal: 2110 },
  { label: 'Men Moderate',     minMo: 216,  maxMo: null, sex: 'MALE',   activity: 'MODERATE',    lifeStage: 'NONE', kcal: 2710 },
  { label: 'Men Heavy',        minMo: 216,  maxMo: null, sex: 'MALE',   activity: 'VERY_ACTIVE', lifeStage: 'NONE', kcal: 3470 },
  { label: 'Women Sedentary',  minMo: 216,  maxMo: null, sex: 'FEMALE', activity: 'SEDENTARY',   lifeStage: 'NONE', kcal: 1660 },
  { label: 'Women Moderate',   minMo: 216,  maxMo: null, sex: 'FEMALE', activity: 'MODERATE',    lifeStage: 'NONE', kcal: 2130 },
  { label: 'Women Heavy',      minMo: 216,  maxMo: null, sex: 'FEMALE', activity: 'VERY_ACTIVE', lifeStage: 'NONE', kcal: 2720 },
  // Pregnancy (+350 over sedentary women base = 2010)
  { label: 'Pregnant +350',    minMo: 180,  maxMo: 611,  sex: 'FEMALE', activity: null, lifeStage: 'PREGNANT_T2', kcal: 2010 },
  { label: 'Pregnant +350',    minMo: 180,  maxMo: 611,  sex: 'FEMALE', activity: null, lifeStage: 'PREGNANT_T3', kcal: 2010 },
  // Lactation
  { label: 'Lact 0-6m +600',   minMo: 180,  maxMo: 611,  sex: 'FEMALE', activity: null, lifeStage: 'LACTATING_0_6M',  kcal: 2260 },
  { label: 'Lact 6-12m +520',  minMo: 180,  maxMo: 611,  sex: 'FEMALE', activity: null, lifeStage: 'LACTATING_7_12M', kcal: 2180 },
];

// ═══════════════════════════════════════════════════════════════
// Protein — Table 2a (g/d)
// ═══════════════════════════════════════════════════════════════

const PROTEIN_ROWS: Array<{
  label: string; minMo: number; maxMo: number | null;
  sex: Sex | 'BOTH'; lifeStage: LifeStage;
  ear: number; rda: number;
}> = [
  { label: 'Infants 0-6m',   minMo: 0,    maxMo: 6,    sex: 'BOTH',   lifeStage: 'NONE', ear: 6.7,  rda: 8.1 },
  { label: 'Infants 6-12m',  minMo: 6,    maxMo: 12,   sex: 'BOTH',   lifeStage: 'NONE', ear: 8.8,  rda: 10.5 },
  { label: 'Children 1-3y',  minMo: 12,   maxMo: 47,   sex: 'BOTH',   lifeStage: 'NONE', ear: 10.2, rda: 12.5 },
  { label: 'Children 4-6y',  minMo: 48,   maxMo: 83,   sex: 'BOTH',   lifeStage: 'NONE', ear: 12.8, rda: 15.9 },
  { label: 'Children 7-9y',  minMo: 84,   maxMo: 119,  sex: 'BOTH',   lifeStage: 'NONE', ear: 19.0, rda: 23.3 },
  { label: 'Boys 10-12y',    minMo: 120,  maxMo: 155,  sex: 'MALE',   lifeStage: 'NONE', ear: 26.2, rda: 31.8 },
  { label: 'Girls 10-12y',   minMo: 120,  maxMo: 155,  sex: 'FEMALE', lifeStage: 'NONE', ear: 26.6, rda: 32.8 },
  { label: 'Boys 13-15y',    minMo: 156,  maxMo: 191,  sex: 'MALE',   lifeStage: 'NONE', ear: 36.4, rda: 44.9 },
  { label: 'Girls 13-15y',   minMo: 156,  maxMo: 191,  sex: 'FEMALE', lifeStage: 'NONE', ear: 34.7, rda: 43.2 },
  { label: 'Boys 16-18y',    minMo: 192,  maxMo: 215,  sex: 'MALE',   lifeStage: 'NONE', ear: 45.1, rda: 55.4 },
  { label: 'Girls 16-18y',   minMo: 192,  maxMo: 215,  sex: 'FEMALE', lifeStage: 'NONE', ear: 37.3, rda: 46.2 },
  { label: 'Adult Men',      minMo: 216,  maxMo: null, sex: 'MALE',   lifeStage: 'NONE', ear: 42.9, rda: 54.0 },
  { label: 'Adult Women',    minMo: 216,  maxMo: null, sex: 'FEMALE', lifeStage: 'NONE', ear: 36.3, rda: 45.7 },
  // Pregnancy adds to adult female base
  { label: 'Pregnant T2',    minMo: 180,  maxMo: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT_T2', ear: 36.3 + 7.6,  rda: 45.7 + 9.5 },
  { label: 'Pregnant T3',    minMo: 180,  maxMo: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT_T3', ear: 36.3 + 17.6, rda: 45.7 + 22.0 },
  { label: 'Lact 0-6m',      minMo: 180,  maxMo: 611,  sex: 'FEMALE', lifeStage: 'LACTATING_0_6M',  ear: 36.3 + 13.6, rda: 45.7 + 16.9 },
  { label: 'Lact 6-12m',     minMo: 180,  maxMo: 611,  sex: 'FEMALE', lifeStage: 'LACTATING_7_12M', ear: 36.3 + 10.6, rda: 45.7 + 13.2 },
];

// ═══════════════════════════════════════════════════════════════
// Adult micronutrients — Tables 3 (Males) and 4 (Females)
// Applies to adults 18+ without activity differentiation.
// ═══════════════════════════════════════════════════════════════

interface MicroRow {
  compound: string; unit: string;
  maleRda: number; maleEar: number;
  femaleRda: number; femaleEar: number;
  note?: string;
}

const ADULT_MICROS: MicroRow[] = [
  { compound: 'Calcium',     unit: 'mg', maleRda: 1000, maleEar: 800, femaleRda: 1000, femaleEar: 800 },
  { compound: 'Magnesium',   unit: 'mg', maleRda: 440,  maleEar: 370, femaleRda: 370,  femaleEar: 310 },
  { compound: 'Iron',        unit: 'mg', maleRda: 19,   maleEar: 11,  femaleRda: 29,   femaleEar: 15,
    note: 'High iron recommendation reflects Indian dietary iron bioavailability ~8%' },
  { compound: 'Zinc',        unit: 'mg', maleRda: 17,   maleEar: 14,  femaleRda: 13,   femaleEar: 11 },
  { compound: 'Iodine',      unit: 'µg', maleRda: 150,  maleEar: 95,  femaleRda: 150,  femaleEar: 95 },
  { compound: 'Thiamine',    unit: 'mg', maleRda: 1.8,  maleEar: 1.5, femaleRda: 1.7,  femaleEar: 1.4 },
  { compound: 'Riboflavin',  unit: 'mg', maleRda: 2.5,  maleEar: 2.1, femaleRda: 2.4,  femaleEar: 2.0 },
  { compound: 'Niacin',      unit: 'mg', maleRda: 18,   maleEar: 15,  femaleRda: 14,   femaleEar: 12 },
  { compound: 'Vitamin B6',  unit: 'mg', maleRda: 2.4,  maleEar: 2.1, femaleRda: 1.9,  femaleEar: 1.6 },
  { compound: 'Folate',      unit: 'µg', maleRda: 300,  maleEar: 250, femaleRda: 220,  femaleEar: 180,
    note: 'µg DFE (Dietary Folate Equivalents)' },
  { compound: 'Vitamin B12', unit: 'µg', maleRda: 2.2,  maleEar: 2,   femaleRda: 2.2,  femaleEar: 2 },
  { compound: 'Vitamin C',   unit: 'mg', maleRda: 80,   maleEar: 65,  femaleRda: 65,   femaleEar: 55 },
  { compound: 'Vitamin A',   unit: 'µg', maleRda: 1000, maleEar: 460, femaleRda: 840,  femaleEar: 390 },
  // Vitamin D: 600 IU → 15 µg, 400 IU → 10 µg
  { compound: 'Vitamin D',   unit: 'µg', maleRda: 15,   maleEar: 10,  femaleRda: 15,   femaleEar: 10,
    note: 'Converted from ICMR IU values (600 IU RDA, 400 IU EAR; 1 µg = 40 IU)' },
];

// ═══════════════════════════════════════════════════════════════
// Build all rows
// ═══════════════════════════════════════════════════════════════

function buildAllRows(): SeedRow[] {
  const rows: SeedRow[] = [];

  // Energy
  for (const e of ENERGY_ROWS) {
    const sexes: Sex[] = e.sex === 'BOTH' ? ['MALE', 'FEMALE'] : [e.sex];
    for (const sex of sexes) {
      rows.push({
        compoundName: 'Energy',
        ageMinMonths: e.minMo, ageMaxMonths: e.maxMo,
        sex, lifeStage: e.lifeStage, activityLevel: e.activity,
        valueType: 'RDA', value: e.kcal, unit: 'kcal',
      });
    }
  }

  // Protein (EAR + RDA)
  for (const p of PROTEIN_ROWS) {
    const sexes: Sex[] = p.sex === 'BOTH' ? ['MALE', 'FEMALE'] : [p.sex];
    for (const sex of sexes) {
      rows.push({
        compoundName: 'Protein',
        ageMinMonths: p.minMo, ageMaxMonths: p.maxMo,
        sex, lifeStage: p.lifeStage, activityLevel: null,
        valueType: 'EAR', value: Math.round(p.ear * 10) / 10, unit: 'g',
      });
      rows.push({
        compoundName: 'Protein',
        ageMinMonths: p.minMo, ageMaxMonths: p.maxMo,
        sex, lifeStage: p.lifeStage, activityLevel: null,
        valueType: 'RDA', value: Math.round(p.rda * 10) / 10, unit: 'g',
      });
    }
  }

  // Adult micronutrients — 216+ months, no upper bound
  for (const m of ADULT_MICROS) {
    // Males
    rows.push({
      compoundName: m.compound,
      ageMinMonths: 216, ageMaxMonths: null,
      sex: 'MALE', lifeStage: 'NONE', activityLevel: null,
      valueType: 'EAR', value: m.maleEar, unit: m.unit, valueNote: m.note ?? null,
    });
    rows.push({
      compoundName: m.compound,
      ageMinMonths: 216, ageMaxMonths: null,
      sex: 'MALE', lifeStage: 'NONE', activityLevel: null,
      valueType: 'RDA', value: m.maleRda, unit: m.unit, valueNote: m.note ?? null,
    });
    // Females
    rows.push({
      compoundName: m.compound,
      ageMinMonths: 216, ageMaxMonths: null,
      sex: 'FEMALE', lifeStage: 'NONE', activityLevel: null,
      valueType: 'EAR', value: m.femaleEar, unit: m.unit, valueNote: m.note ?? null,
    });
    rows.push({
      compoundName: m.compound,
      ageMinMonths: 216, ageMaxMonths: null,
      sex: 'FEMALE', lifeStage: 'NONE', activityLevel: null,
      valueType: 'RDA', value: m.femaleRda, unit: m.unit, valueNote: m.note ?? null,
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
        sex, life_stage, activity_level, value_type,
        value, unit, is_percent_of_energy, is_provisional, value_note
      ) VALUES (
        ${compoundId}, ${SOURCE.regionCode}, ${source.id},
        ${row.ageMinMonths}, ${row.ageMaxMonths},
        ${row.sex}, ${row.lifeStage}, ${row.activityLevel}, ${row.valueType},
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
  console.log(`✅ ICMR 2020 seed complete`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Updated:  ${updated}`);
  console.log(`   Skipped:  ${skipped}`);
  console.log('─'.repeat(60));
}

seed()
  .catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); })
  .finally(() => sql.end());
