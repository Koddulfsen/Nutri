/**
 * Seed: NIH/NAM DRI (USA + Canada harmonized)
 *
 * Source: NCBI Bookshelf NBK545442 — Dietary Reference Intakes Summary Tables
 * Replaces the legacy USA_CANADA data we deleted earlier (untrusted sourcing).
 *
 * Covers: RDA/AI for vitamins + minerals + macros, ULs, AMDR ranges,
 * Sodium CDRR. EARs not in summary tables (deferred).
 *
 * Run: npx tsx db/seed/seed-usa-canada-nih-dri.ts
 */

import 'dotenv/config';
import postgres from 'postgres';
import {
  DEMOGRAPHICS, VITAMINS, VITAMIN_META,
  MINERALS, MINERAL_META,
  MACROS,
  UL_DEMOS, VITAMIN_UL, MINERAL_UL,
  SODIUM_CDRR, AMDR,
  EARS, EAR_META, REF_WEIGHTS_KG,
  ADULT_AI_COMPOUNDS,
  type Sex, type LifeStage,
} from '../../dv-sources/nih-dri/raw-values';

const sql = postgres(process.env.DATABASE_URL!);

const SOURCE = {
  authorityName: 'NIH/NAM Dietary Reference Intakes (USA + Canada)',
  regionCode: 'USA_CANADA',
  versionYear: 2019, // latest comprehensive update (sodium/potassium revised 2019)
  sourceType: 'SCIENTIFIC_DRI' as const,
  url: 'https://www.ncbi.nlm.nih.gov/books/NBK545442/',
  note: 'NIH/NAM DRIs — harmonized with Health Canada since 1997. Summary tables from NCBI Bookshelf. RDA = ≥97.5% coverage; AI = adequate intake when RDA cannot be derived. All infant values are AI. Per-compound AI adults: Vitamin K, Biotin, Pantothenic Acid, Choline, Chromium, Fluoride, Potassium, Sodium, Manganese, Chloride, Water, Dietary Fiber. Vitamin A in µg RAE; Folate in µg DFE; Niacin in mg NE. AMDR stored as value_min/value_max with isPercentOfEnergy=true. Sodium CDRR = Chronic Disease Risk Reduction intake. EARs deferred (not in summary tables).',
  retrievedDate: '2026-04-14',
};

const COMPOUND_NAME_MAP: Record<string, string> = {
  'Vitamin A': 'Vitamin A (RAE)',
  'Vitamin C': 'Vitamin C (Total)',
  'Vitamin D': 'Vitamin D (Total)',
  'Vitamin E': 'Vitamin E (Total)',
  'Vitamin K': 'Vitamin K (Total)',
  'Thiamin': 'Thiamin (B1)',
  'Riboflavin': 'Riboflavin (B2)',
  'Niacin': 'Niacin (B3)',
  'Folate': 'Folate (Total)',
  'Vitamin B12': 'Vitamin B12 (Total)',
  'Pantothenic Acid': 'Pantothenic Acid (B5)',
  'Biotin': 'Biotin (B7)',
  'Choline': 'Choline (Total)',
  'Calcium': 'Calcium (Total)',
  'Chromium': 'Chromium (Total)',
  'Iron': 'Iron (Total)',
  'Magnesium': 'Magnesium (Total)',
  'Selenium': 'Selenium (Total)',
  'Zinc': 'Zinc (Total)',
  'Fiber': 'Dietary Fiber',
};
function resolveDbName(n: string): string {
  return COMPOUND_NAME_MAP[n] ?? n;
}

type ValueType = 'RDA' | 'AI' | 'UL' | 'CDRR' | 'AMDR' | 'EAR';

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

function expandSexes(sex: Sex | 'BOTH'): Sex[] {
  return sex === 'BOTH' ? ['MALE', 'FEMALE'] : [sex];
}

function decideAiOrRda(compoundName: string, isInfant: boolean): 'RDA' | 'AI' {
  if (isInfant) return 'AI';
  return ADULT_AI_COMPOUNDS.has(compoundName) ? 'AI' : 'RDA';
}

function buildAllRows(): SeedRow[] {
  const rows: SeedRow[] = [];

  // ── Vitamins RDA/AI ──────────────────────────────────────────
  for (const demo of DEMOGRAPHICS) {
    const vitRow = VITAMINS[demo.key];
    if (!vitRow) continue;
    for (const [field, meta] of Object.entries(VITAMIN_META)) {
      const value = (vitRow as any)[field];
      if (value == null) continue;
      const valueType = decideAiOrRda(meta.compound, !!demo.infantInfer);
      for (const sex of expandSexes(demo.sex)) {
        rows.push({
          compoundName: meta.compound,
          ageMinMonths: demo.minMonths, ageMaxMonths: demo.maxMonths,
          sex, lifeStage: demo.lifeStage, valueType,
          value, unit: meta.unit,
        });
      }
    }
  }

  // ── Minerals RDA/AI ──────────────────────────────────────────
  for (const demo of DEMOGRAPHICS) {
    const minRow = MINERALS[demo.key];
    if (!minRow) continue;
    for (const [field, meta] of Object.entries(MINERAL_META)) {
      const raw = (minRow as any)[field];
      if (raw == null) continue;
      const value = (meta as any).fromGrams ? raw * 1000 : raw;
      const valueType = decideAiOrRda(meta.compound, !!demo.infantInfer);
      for (const sex of expandSexes(demo.sex)) {
        rows.push({
          compoundName: meta.compound,
          ageMinMonths: demo.minMonths, ageMaxMonths: demo.maxMonths,
          sex, lifeStage: demo.lifeStage, valueType,
          value, unit: meta.unit,
        });
      }
    }
  }

  // ── Macros (Water AI, Carbs RDA, Fiber AI, Protein RDA) ─────
  for (const demo of DEMOGRAPHICS) {
    const m = MACROS[demo.key];
    if (!m) continue;
    const isInfant = !!demo.infantInfer;

    for (const sex of expandSexes(demo.sex)) {
      // Water — L/d converted to mL (store as mg? Water unit complicated — we use mL)
      rows.push({
        compoundName: 'Water',
        ageMinMonths: demo.minMonths, ageMaxMonths: demo.maxMonths,
        sex, lifeStage: demo.lifeStage, valueType: 'AI',
        value: m.water_L * 1000, unit: 'mL',
      });
      // Carbohydrates — RDA for non-infants; AI for infants
      rows.push({
        compoundName: 'Carbohydrates',
        ageMinMonths: demo.minMonths, ageMaxMonths: demo.maxMonths,
        sex, lifeStage: demo.lifeStage,
        valueType: isInfant ? 'AI' : 'RDA',
        value: m.carbs_g, unit: 'g',
      });
      // Fiber — always AI
      if (m.fiber_g != null) {
        rows.push({
          compoundName: 'Fiber',
          ageMinMonths: demo.minMonths, ageMaxMonths: demo.maxMonths,
          sex, lifeStage: demo.lifeStage, valueType: 'AI',
          value: m.fiber_g, unit: 'g',
        });
      }
      // Protein — RDA for non-infants; AI for infants
      rows.push({
        compoundName: 'Protein',
        ageMinMonths: demo.minMonths, ageMaxMonths: demo.maxMonths,
        sex, lifeStage: demo.lifeStage,
        valueType: isInfant ? 'AI' : 'RDA',
        value: m.protein_g, unit: 'g',
      });
    }
  }

  // ── Vitamin ULs ─────────────────────────────────────────────
  for (const [key, demo] of Object.entries(UL_DEMOS)) {
    const ulRow = VITAMIN_UL[key as keyof typeof VITAMIN_UL];
    if (!ulRow) continue;
    const ulEntries: Array<[string, number | null, string]> = [
      ['Vitamin A', ulRow.vitA, 'µg'],
      ['Vitamin C', ulRow.vitC, 'mg'],
      ['Vitamin D', ulRow.vitD, 'µg'],
      ['Vitamin E', ulRow.vitE, 'mg'],
      ['Niacin', ulRow.niacin, 'mg'],
      ['Vitamin B6', ulRow.vitB6, 'mg'],
      ['Folate', ulRow.folate, 'µg'],
      ['Choline', ulRow.choline_g == null ? null : ulRow.choline_g * 1000, 'mg'],
    ];
    for (const [compound, value, unit] of ulEntries) {
      if (value == null) continue;
      for (const sex of expandSexes(demo.sex)) {
        const note = compound === 'Folate' ? 'UL applies to folic acid (synthetic form) only' : null;
        rows.push({
          compoundName: compound,
          ageMinMonths: demo.minMonths, ageMaxMonths: demo.maxMonths,
          sex, lifeStage: demo.lifeStage, valueType: 'UL',
          value, unit, valueNote: note,
        });
      }
    }
  }

  // ── Mineral ULs ─────────────────────────────────────────────
  for (const demo of DEMOGRAPHICS) {
    const ulRow = MINERAL_UL[demo.key];
    if (!ulRow) continue;
    const entries: Array<[string, number | null, string]> = [
      ['Calcium', ulRow.calcium, 'mg'],
      ['Phosphorus', ulRow.phosphorus_g == null ? null : ulRow.phosphorus_g * 1000, 'mg'],
      ['Magnesium', ulRow.magnesium, 'mg'],
      ['Iron', ulRow.iron, 'mg'],
      ['Zinc', ulRow.zinc, 'mg'],
      ['Copper', ulRow.copper, 'µg'],
      ['Manganese', ulRow.manganese, 'mg'],
      ['Fluoride', ulRow.fluoride, 'mg'],
      ['Selenium', ulRow.selenium, 'µg'],
      ['Iodine', ulRow.iodine, 'µg'],
      ['Molybdenum', ulRow.molybdenum, 'µg'],
      ['Chloride', ulRow.chloride_g == null ? null : ulRow.chloride_g * 1000, 'mg'],
    ];
    for (const [compound, value, unit] of entries) {
      if (value == null) continue;
      const note = compound === 'Magnesium' ? 'UL applies to supplemental magnesium only (not food)' : null;
      for (const sex of expandSexes(demo.sex)) {
        rows.push({
          compoundName: compound,
          ageMinMonths: demo.minMonths, ageMaxMonths: demo.maxMonths,
          sex, lifeStage: demo.lifeStage, valueType: 'UL',
          value, unit, valueNote: note,
        });
      }
    }
  }

  // ── Sodium CDRR ─────────────────────────────────────────────
  for (const c of SODIUM_CDRR) {
    for (const sex of ['MALE', 'FEMALE'] as Sex[]) {
      rows.push({
        compoundName: 'Sodium',
        ageMinMonths: c.minMonths, ageMaxMonths: c.maxMonths,
        sex, lifeStage: 'NONE', valueType: 'CDRR',
        value: c.value_mg, unit: 'mg',
        valueNote: 'Chronic Disease Risk Reduction intake — aim to stay at or below',
      });
    }
  }

  // ── EARs (Estimated Average Requirements — 21 nutrients, no infants) ──
  for (const demo of DEMOGRAPHICS) {
    const earRow = EARS[demo.key as keyof typeof EARS];
    if (!earRow) continue;
    const refWeight = REF_WEIGHTS_KG[demo.key as keyof typeof REF_WEIGHTS_KG];

    for (const sex of expandSexes(demo.sex)) {
      // Standard EAR nutrients
      for (const [field, meta] of Object.entries(EAR_META)) {
        if (meta === null) continue; // protein handled below
        const value = (earRow as any)[field];
        if (value == null) continue;
        rows.push({
          compoundName: meta.compound,
          ageMinMonths: demo.minMonths, ageMaxMonths: demo.maxMonths,
          sex, lifeStage: demo.lifeStage, valueType: 'EAR',
          value, unit: meta.unit,
        });
      }

      // Protein EAR (g/kg × reference body weight)
      if (refWeight && earRow.proteinPerKg != null) {
        const w = sex === 'MALE' ? refWeight.M : refWeight.F;
        if (w != null) {
          const grams = Math.round(earRow.proteinPerKg * w * 10) / 10;
          rows.push({
            compoundName: 'Protein',
            ageMinMonths: demo.minMonths, ageMaxMonths: demo.maxMonths,
            sex, lifeStage: demo.lifeStage, valueType: 'EAR',
            value: grams, unit: 'g',
            valueNote: `${earRow.proteinPerKg} g/kg × ${w} kg NIH ref weight`,
          });
        }
      }
    }
  }

  // ── AMDR ranges ─────────────────────────────────────────────
  for (const a of AMDR) {
    for (const sex of ['MALE', 'FEMALE'] as Sex[]) {
      rows.push({
        compoundName: a.compound,
        ageMinMonths: a.minMonths, ageMaxMonths: a.maxMonths,
        sex, lifeStage: 'NONE', valueType: 'AMDR',
        value: (a.min + a.max) / 2, // midpoint as primary
        valueMin: a.min, valueMax: a.max,
        unit: '%E',
        isPercentOfEnergy: true,
        valueNote: 'Acceptable Macronutrient Distribution Range — % of total energy',
      });
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
  console.log(`✅ NIH DRI seed complete`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Updated:  ${updated}`);
  console.log(`   Skipped:  ${skipped}`);
  console.log('─'.repeat(60));
}

seed()
  .catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); })
  .finally(() => sql.end());
