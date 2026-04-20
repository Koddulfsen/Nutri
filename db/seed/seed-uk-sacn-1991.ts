/**
 * UK Dietary Reference Values
 *
 * Authority: COMA 1991 baseline + SACN updates
 *   - COMA 1991 — Dietary Reference Values for Food Energy and Nutrients for the UK (HMSO Report 41)
 *   - SACN 2003 — Salt and Health (max salt intakes → stored as Sodium CDRR)
 *   - SACN 2011 — Dietary Reference Values for Energy (revised EARs)
 *   - SACN 2015 — Carbohydrates and Health (Free Sugars ≤5%, Fibre 30 g/d AOAC)
 *   - SACN 2016 — Vitamin D and Health (10 µg/d RNI from age 4)
 *
 * Source PDF: dv-sources/sacn-rni/bnf-nutrition-requirements-2021.pdf
 *   (British Nutrition Foundation digest — citations at bottom of each table point to
 *   the COMA 1991 + SACN reports above)
 *
 * See dv-sources/sacn-rni/NOTES.md for full source notes and edge-case decisions.
 *
 * Run: npx tsx db/seed/seed-uk-sacn-1991.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

// ═══════════════════════════════════════════════════════════════
// Gate 1 — Source metadata
// ═══════════════════════════════════════════════════════════════

const SOURCE = {
  authorityName: 'COMA 1991 / SACN — UK Dietary Reference Values',
  regionCode: 'UK',
  versionYear: 1991,
  sourceType: 'SCIENTIFIC_DRI' as const,
  url: 'https://www.nutrition.org.uk/media/nmmewdug/nutrition-requirements.pdf',
  note: 'UK DRVs from COMA 1991 (Report 41) with SACN updates: Salt 2003 (Sodium CDRR), Energy 2011 (EARs), Carbs/Fibre 2015, Vitamin D 2016 (10 µg RNI). Value types: RNI→RDA, EAR→EAR, Safe Intake→AI, max salt/sugar/fat→CDRR, carb target→AMDR. Iron RNI 14.8 for 11+ females flagged insufficient for high-menstrual-loss women (supplement advised). Phosphorus RNI = Calcium RNI in molar terms. Adult protein derived from COMA reference body weights × g/kg (0.75 adults, higher for adolescents).',
  retrievedDate: '2026-04-18',
};

// ═══════════════════════════════════════════════════════════════
// Gate 2 — Compound name map
// ═══════════════════════════════════════════════════════════════

const COMPOUND_NAME_MAP: Record<string, string> = {
  'Thiamin': 'Thiamin (B1)',
  'Riboflavin': 'Riboflavin (B2)',
  'Niacin': 'Niacin (B3)',
  'Vitamin B12': 'Vitamin B12 (Total)',
  'Folate': 'Folate (Total)',
  'Vitamin C': 'Vitamin C (Total)',
  'Vitamin A': 'Vitamin A (RAE)',
  'Vitamin D': 'Vitamin D (Total)',
  'Calcium': 'Calcium (Total)',
  'Magnesium': 'Magnesium (Total)',
  'Iron': 'Iron (Total)',
  'Zinc': 'Zinc (Total)',
  'Selenium': 'Selenium (Total)',
  'Carbohydrate': 'Carbohydrates',
  'Free Sugars': 'Added Sugars',  // UK "Free Sugars" closest match in DB; semantic note added
  'Fibre': 'Dietary Fiber',
};
function resolveDbName(n: string): string {
  return COMPOUND_NAME_MAP[n] ?? n;
}

// ═══════════════════════════════════════════════════════════════
// Gate 3 — Raw values
// ═══════════════════════════════════════════════════════════════

type Sex = 'MALE' | 'FEMALE';
type LifeStage =
  | 'NONE' | 'PREGNANT' | 'PREGNANT_T1' | 'PREGNANT_T2' | 'PREGNANT_T3'
  | 'LACTATING' | 'LACTATING_0_6M' | 'LACTATING_7_12M';
type ValueType = 'RDA' | 'AI' | 'EAR' | 'UL' | 'CDRR' | 'AMDR';

interface SeedRow {
  compoundName: string;
  ageMinMonths: number;
  ageMaxMonths: number | null;
  sex: Sex;
  lifeStage: LifeStage;
  valueType: ValueType;
  value: number;
  valueMin?: number;
  valueMax?: number;
  unit: string;
  isPercentOfEnergy?: boolean;
  valueNote?: string | null;
}

// ─── Age buckets (months) ─────────────────────────────────────────
// COMA 1991 vitamins/minerals
const A_0_3   = [0, 3]   as const;
const A_4_6   = [4, 6]   as const;
const A_7_9   = [7, 9]   as const;
const A_10_12 = [10, 12] as const;
const A_1_3Y  = [12, 47] as const;
const A_4_6Y  = [48, 83] as const;
const A_7_10Y = [84, 131] as const;
const A_11_14 = [132, 179] as const;
const A_15_18 = [180, 227] as const;
const A_19_50 = [228, 611] as const;
const A_50P:  readonly [number, number | null] = [612, null];

// SACN 2011 energy adult bands
const E_19_24 = [228, 299] as const;
const E_25_34 = [300, 419] as const;
const E_35_44 = [420, 539] as const;
const E_45_54 = [540, 659] as const;
const E_55_64 = [660, 779] as const;
const E_65_74 = [780, 899] as const;
const E_75P:  readonly [number, number | null]  = [900, null];

// ─── Helpers ──────────────────────────────────────────────────────
function pushUnisex(
  rows: SeedRow[], compound: string, age: readonly [number, number | null],
  value: number, unit: string, valueType: ValueType = 'RDA', note?: string,
) {
  for (const sex of ['MALE', 'FEMALE'] as Sex[]) {
    rows.push({
      compoundName: compound, ageMinMonths: age[0], ageMaxMonths: age[1],
      sex, lifeStage: 'NONE', valueType, value, unit,
      valueNote: note ?? null,
    });
  }
}

function pushSexed(
  rows: SeedRow[], compound: string, age: readonly [number, number | null],
  m: number | null, f: number | null, unit: string,
  valueType: ValueType = 'RDA',
  noteM?: string, noteF?: string,
) {
  if (m != null) {
    rows.push({
      compoundName: compound, ageMinMonths: age[0], ageMaxMonths: age[1],
      sex: 'MALE', lifeStage: 'NONE', valueType, value: m, unit,
      valueNote: noteM ?? null,
    });
  }
  if (f != null) {
    rows.push({
      compoundName: compound, ageMinMonths: age[0], ageMaxMonths: age[1],
      sex: 'FEMALE', lifeStage: 'NONE', valueType, value: f, unit,
      valueNote: noteF ?? null,
    });
  }
}

// Pregnancy (single bucket: COMA gives one increment, no trimester split,
// EXCEPT energy which is last trimester only)
function pushPreg(
  rows: SeedRow[], compound: string, value: number, unit: string,
  valueType: ValueType = 'RDA', note?: string,
  lifeStage: LifeStage = 'PREGNANT',
) {
  rows.push({
    compoundName: compound, ageMinMonths: 180, ageMaxMonths: 611,
    sex: 'FEMALE', lifeStage, valueType, value, unit,
    valueNote: note ?? null,
  });
}

// Lactation: COMA splits 0-4 mo and 4+ mo for some compounds.
// We map → LACTATING_0_6M and LACTATING_7_12M for storage compatibility,
// noting the actual COMA boundary in value_note.
function pushLact(
  rows: SeedRow[], compound: string,
  v0_4: number | null, v4plus: number | null, unit: string,
  valueType: ValueType = 'RDA', note?: string,
) {
  const baseNote = note ?? '';
  if (v0_4 != null) {
    rows.push({
      compoundName: compound, ageMinMonths: 180, ageMaxMonths: 611,
      sex: 'FEMALE', lifeStage: 'LACTATING_0_6M', valueType, value: v0_4, unit,
      valueNote: (baseNote + ' COMA boundary: 0-4 mo postpartum.').trim(),
    });
  }
  if (v4plus != null) {
    rows.push({
      compoundName: compound, ageMinMonths: 180, ageMaxMonths: 611,
      sex: 'FEMALE', lifeStage: 'LACTATING_7_12M', valueType, value: v4plus, unit,
      valueNote: (baseNote + ' COMA boundary: 4+ mo postpartum.').trim(),
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// Build all rows
// ═══════════════════════════════════════════════════════════════

function buildAllRows(): SeedRow[] {
  const rows: SeedRow[] = [];

  // ───────────────────────────────────────────────────────────────
  // VITAMINS (COMA 1991, with SACN 2016 updating Vitamin D)
  // Source: BNF "Reference Nutrient Intakes for Vitamins" table
  // ───────────────────────────────────────────────────────────────

  // Thiamin (mg/d) — RNI based on 14.7% of EAR for energy
  pushUnisex(rows, 'Thiamin', A_0_3, 0.2, 'mg');
  pushUnisex(rows, 'Thiamin', A_4_6, 0.2, 'mg');
  pushUnisex(rows, 'Thiamin', A_7_9, 0.2, 'mg');
  pushUnisex(rows, 'Thiamin', A_10_12, 0.3, 'mg');
  pushUnisex(rows, 'Thiamin', A_1_3Y, 0.5, 'mg');
  pushUnisex(rows, 'Thiamin', A_4_6Y, 0.7, 'mg');
  pushUnisex(rows, 'Thiamin', A_7_10Y, 0.7, 'mg');
  pushSexed(rows, 'Thiamin', A_11_14, 0.9, 0.7, 'mg');
  pushSexed(rows, 'Thiamin', A_15_18, 1.1, 0.8, 'mg');
  pushSexed(rows, 'Thiamin', A_19_50, 1.0, 0.8, 'mg');
  pushSexed(rows, 'Thiamin', A_50P, 0.9, 0.8, 'mg');
  pushPreg(rows, 'Thiamin', 0.9, 'mg', 'RDA',
           'Pregnancy increment +0.1 mg/d for last trimester only (added to base 0.8). Stored as full pregnancy value.',
           'PREGNANT_T3');
  pushLact(rows, 'Thiamin', 1.0, 1.0, 'mg', 'RDA',
           'Lactation increment +0.2 mg/d (base 0.8 + 0.2 = 1.0).');

  // Riboflavin (mg/d)
  pushUnisex(rows, 'Riboflavin', A_0_3, 0.4, 'mg');
  pushUnisex(rows, 'Riboflavin', A_4_6, 0.4, 'mg');
  pushUnisex(rows, 'Riboflavin', A_7_9, 0.4, 'mg');
  pushUnisex(rows, 'Riboflavin', A_10_12, 0.4, 'mg');
  pushUnisex(rows, 'Riboflavin', A_1_3Y, 0.6, 'mg');
  pushUnisex(rows, 'Riboflavin', A_4_6Y, 0.8, 'mg');
  pushUnisex(rows, 'Riboflavin', A_7_10Y, 1.0, 'mg');
  pushSexed(rows, 'Riboflavin', A_11_14, 1.2, 1.1, 'mg');
  pushSexed(rows, 'Riboflavin', A_15_18, 1.3, 1.1, 'mg');
  pushSexed(rows, 'Riboflavin', A_19_50, 1.3, 1.1, 'mg');
  pushSexed(rows, 'Riboflavin', A_50P, 1.3, 1.1, 'mg');
  pushPreg(rows, 'Riboflavin', 1.4, 'mg', 'RDA', 'Pregnancy increment +0.3 mg/d (base 1.1 + 0.3 = 1.4).');
  pushLact(rows, 'Riboflavin', 1.6, 1.6, 'mg', 'RDA', 'Lactation increment +0.5 mg/d (base 1.1 + 0.5 = 1.6).');

  // Niacin (mg/d) — RNI is nicotinic acid equivalents
  pushUnisex(rows, 'Niacin', A_0_3, 3, 'mg');
  pushUnisex(rows, 'Niacin', A_4_6, 3, 'mg');
  pushUnisex(rows, 'Niacin', A_7_9, 4, 'mg');
  pushUnisex(rows, 'Niacin', A_10_12, 5, 'mg');
  pushUnisex(rows, 'Niacin', A_1_3Y, 8, 'mg');
  pushUnisex(rows, 'Niacin', A_4_6Y, 11, 'mg');
  pushUnisex(rows, 'Niacin', A_7_10Y, 12, 'mg');
  pushSexed(rows, 'Niacin', A_11_14, 15, 12, 'mg');
  pushSexed(rows, 'Niacin', A_15_18, 18, 14, 'mg');
  pushSexed(rows, 'Niacin', A_19_50, 17, 13, 'mg');
  pushSexed(rows, 'Niacin', A_50P, 16, 12, 'mg');
  // Pregnancy: * (no increase)
  pushLact(rows, 'Niacin', 15, 15, 'mg', 'RDA', 'Lactation increment +2 mg/d (base 13 + 2 = 15).');

  // Vitamin B6 (mg/d) — based on protein providing 14.7% of EAR for energy
  pushUnisex(rows, 'Vitamin B6', A_0_3, 0.2, 'mg');
  pushUnisex(rows, 'Vitamin B6', A_4_6, 0.2, 'mg');
  pushUnisex(rows, 'Vitamin B6', A_7_9, 0.3, 'mg');
  pushUnisex(rows, 'Vitamin B6', A_10_12, 0.4, 'mg');
  pushUnisex(rows, 'Vitamin B6', A_1_3Y, 0.7, 'mg');
  pushUnisex(rows, 'Vitamin B6', A_4_6Y, 0.9, 'mg');
  pushUnisex(rows, 'Vitamin B6', A_7_10Y, 1.0, 'mg');
  pushSexed(rows, 'Vitamin B6', A_11_14, 1.2, 1.0, 'mg');
  pushSexed(rows, 'Vitamin B6', A_15_18, 1.5, 1.2, 'mg');
  pushSexed(rows, 'Vitamin B6', A_19_50, 1.4, 1.2, 'mg');
  pushSexed(rows, 'Vitamin B6', A_50P, 1.4, 1.2, 'mg');
  // Pregnancy: * (no increase)
  // Lactation: * (no increase)

  // Vitamin B12 (µg/d)
  pushUnisex(rows, 'Vitamin B12', A_0_3, 0.3, 'µg');
  pushUnisex(rows, 'Vitamin B12', A_4_6, 0.3, 'µg');
  pushUnisex(rows, 'Vitamin B12', A_7_9, 0.4, 'µg');
  pushUnisex(rows, 'Vitamin B12', A_10_12, 0.4, 'µg');
  pushUnisex(rows, 'Vitamin B12', A_1_3Y, 0.5, 'µg');
  pushUnisex(rows, 'Vitamin B12', A_4_6Y, 0.8, 'µg');
  pushUnisex(rows, 'Vitamin B12', A_7_10Y, 1.0, 'µg');
  pushSexed(rows, 'Vitamin B12', A_11_14, 1.2, 1.2, 'µg');
  pushSexed(rows, 'Vitamin B12', A_15_18, 1.5, 1.5, 'µg');
  pushSexed(rows, 'Vitamin B12', A_19_50, 1.5, 1.5, 'µg');
  pushSexed(rows, 'Vitamin B12', A_50P, 1.5, 1.5, 'µg');
  // Pregnancy: * (no increase)
  pushLact(rows, 'Vitamin B12', 2.0, 2.0, 'µg', 'RDA', 'Lactation increment +0.5 µg/d (base 1.5 + 0.5 = 2.0).');

  // Folate (µg/d)
  pushUnisex(rows, 'Folate', A_0_3, 50, 'µg');
  pushUnisex(rows, 'Folate', A_4_6, 50, 'µg');
  pushUnisex(rows, 'Folate', A_7_9, 50, 'µg');
  pushUnisex(rows, 'Folate', A_10_12, 50, 'µg');
  pushUnisex(rows, 'Folate', A_1_3Y, 70, 'µg');
  pushUnisex(rows, 'Folate', A_4_6Y, 100, 'µg');
  pushUnisex(rows, 'Folate', A_7_10Y, 150, 'µg');
  pushSexed(rows, 'Folate', A_11_14, 200, 200, 'µg');
  pushSexed(rows, 'Folate', A_15_18, 200, 200, 'µg');
  pushSexed(rows, 'Folate', A_19_50, 200, 200, 'µg');
  pushSexed(rows, 'Folate', A_50P, 200, 200, 'µg');
  pushPreg(rows, 'Folate', 300, 'µg', 'RDA', 'Pregnancy increment +100 µg/d (base 200 + 100 = 300). Note: separate UK Health Departments advise 400 µg/d folic acid supplement preconception + first 12 weeks.');
  pushLact(rows, 'Folate', 260, 260, 'µg', 'RDA', 'Lactation increment +60 µg/d (base 200 + 60 = 260).');

  // Vitamin C (mg/d)
  pushUnisex(rows, 'Vitamin C', A_0_3, 25, 'mg');
  pushUnisex(rows, 'Vitamin C', A_4_6, 25, 'mg');
  pushUnisex(rows, 'Vitamin C', A_7_9, 25, 'mg');
  pushUnisex(rows, 'Vitamin C', A_10_12, 25, 'mg');
  pushUnisex(rows, 'Vitamin C', A_1_3Y, 30, 'mg');
  pushUnisex(rows, 'Vitamin C', A_4_6Y, 30, 'mg');
  pushUnisex(rows, 'Vitamin C', A_7_10Y, 30, 'mg');
  pushSexed(rows, 'Vitamin C', A_11_14, 35, 35, 'mg');
  pushSexed(rows, 'Vitamin C', A_15_18, 40, 40, 'mg');
  pushSexed(rows, 'Vitamin C', A_19_50, 40, 40, 'mg');
  pushSexed(rows, 'Vitamin C', A_50P, 40, 40, 'mg');
  pushPreg(rows, 'Vitamin C', 50, 'mg', 'RDA',
           'Pregnancy increment +10 mg/d for last trimester only (base 40 + 10 = 50). Stored as full pregnancy value.',
           'PREGNANT_T3');
  pushLact(rows, 'Vitamin C', 70, 70, 'mg', 'RDA', 'Lactation increment +30 mg/d (base 40 + 30 = 70).');

  // Vitamin A (µg/d) — retinol equivalents
  pushUnisex(rows, 'Vitamin A', A_0_3, 350, 'µg');
  pushUnisex(rows, 'Vitamin A', A_4_6, 350, 'µg');
  pushUnisex(rows, 'Vitamin A', A_7_9, 350, 'µg');
  pushUnisex(rows, 'Vitamin A', A_10_12, 350, 'µg');
  pushUnisex(rows, 'Vitamin A', A_1_3Y, 400, 'µg');
  pushUnisex(rows, 'Vitamin A', A_4_6Y, 400, 'µg');
  pushUnisex(rows, 'Vitamin A', A_7_10Y, 500, 'µg');
  pushSexed(rows, 'Vitamin A', A_11_14, 600, 600, 'µg');
  pushSexed(rows, 'Vitamin A', A_15_18, 700, 600, 'µg');
  pushSexed(rows, 'Vitamin A', A_19_50, 700, 600, 'µg');
  pushSexed(rows, 'Vitamin A', A_50P, 700, 600, 'µg');
  pushPreg(rows, 'Vitamin A', 700, 'µg', 'RDA', 'Pregnancy increment +100 µg/d (base 600 + 100 = 700).');
  pushLact(rows, 'Vitamin A', 950, 950, 'µg', 'RDA', 'Lactation increment +350 µg/d (base 600 + 350 = 950).');

  // Vitamin D (µg/d) — SACN 2016 updated to 10 µg from age 4
  // Infants 0-12 mo: Safe Intake 8.5-10 µg → store as AI = 10
  pushUnisex(rows, 'Vitamin D', A_0_3, 10, 'µg', 'AI', 'Safe Intake (range 8.5-10 µg/d). SACN 2016 recommends 8.5-10 µg/d for non-formula-fed infants 0-12 mo via supplementation.');
  pushUnisex(rows, 'Vitamin D', A_4_6, 10, 'µg', 'AI', 'Safe Intake (range 8.5-10 µg/d).');
  pushUnisex(rows, 'Vitamin D', A_7_9, 10, 'µg', 'AI', 'Safe Intake (range 8.5-10 µg/d).');
  pushUnisex(rows, 'Vitamin D', A_10_12, 10, 'µg', 'AI', 'Safe Intake (range 8.5-10 µg/d).');
  pushUnisex(rows, 'Vitamin D', A_1_3Y, 10, 'µg');
  pushUnisex(rows, 'Vitamin D', A_4_6Y, 10, 'µg');
  pushUnisex(rows, 'Vitamin D', A_7_10Y, 10, 'µg');
  pushSexed(rows, 'Vitamin D', A_11_14, 10, 10, 'µg');
  pushSexed(rows, 'Vitamin D', A_15_18, 10, 10, 'µg');
  pushSexed(rows, 'Vitamin D', A_19_50, 10, 10, 'µg');
  pushSexed(rows, 'Vitamin D', A_50P, 10, 10, 'µg');
  pushPreg(rows, 'Vitamin D', 10, 'µg', 'RDA', 'Pregnancy: 10 µg/d (no increment from base — same as non-pregnant per SACN 2016).');
  pushLact(rows, 'Vitamin D', 10, 10, 'µg', 'RDA', 'Lactation: 10 µg/d (no increment from base — same as non-lactating per SACN 2016).');

  // ───────────────────────────────────────────────────────────────
  // MINERALS (COMA 1991)
  // Source: BNF "Reference Nutrient Intakes for Minerals" table
  // ───────────────────────────────────────────────────────────────

  // Calcium (mg/d)
  pushUnisex(rows, 'Calcium', A_0_3, 525, 'mg');
  pushUnisex(rows, 'Calcium', A_4_6, 525, 'mg');
  pushUnisex(rows, 'Calcium', A_7_9, 525, 'mg');
  pushUnisex(rows, 'Calcium', A_10_12, 525, 'mg');
  pushUnisex(rows, 'Calcium', A_1_3Y, 350, 'mg');
  pushUnisex(rows, 'Calcium', A_4_6Y, 450, 'mg');
  pushUnisex(rows, 'Calcium', A_7_10Y, 550, 'mg');
  pushSexed(rows, 'Calcium', A_11_14, 1000, 800, 'mg');
  pushSexed(rows, 'Calcium', A_15_18, 1000, 800, 'mg');
  pushSexed(rows, 'Calcium', A_19_50, 700, 700, 'mg');
  pushSexed(rows, 'Calcium', A_50P, 700, 700, 'mg');
  // Pregnancy: * (no increase)
  pushLact(rows, 'Calcium', 1250, 1250, 'mg', 'RDA', 'Lactation increment +550 mg/d (base 700 + 550 = 1250).');

  // Phosphorus (mg/d) — RNI = Calcium RNI in molar terms
  pushUnisex(rows, 'Phosphorus', A_0_3, 400, 'mg', 'RDA', 'Phosphorus RNI is set equal to calcium RNI in molar terms.');
  pushUnisex(rows, 'Phosphorus', A_4_6, 400, 'mg', 'RDA', 'Phosphorus RNI is set equal to calcium RNI in molar terms.');
  pushUnisex(rows, 'Phosphorus', A_7_9, 400, 'mg', 'RDA', 'Phosphorus RNI is set equal to calcium RNI in molar terms.');
  pushUnisex(rows, 'Phosphorus', A_10_12, 400, 'mg', 'RDA', 'Phosphorus RNI is set equal to calcium RNI in molar terms.');
  pushUnisex(rows, 'Phosphorus', A_1_3Y, 270, 'mg', 'RDA', 'Phosphorus RNI is set equal to calcium RNI in molar terms.');
  pushUnisex(rows, 'Phosphorus', A_4_6Y, 350, 'mg', 'RDA', 'Phosphorus RNI is set equal to calcium RNI in molar terms.');
  pushUnisex(rows, 'Phosphorus', A_7_10Y, 450, 'mg', 'RDA', 'Phosphorus RNI is set equal to calcium RNI in molar terms.');
  pushSexed(rows, 'Phosphorus', A_11_14, 775, 625, 'mg', 'RDA',
            'Phosphorus RNI is set equal to calcium RNI in molar terms.',
            'Phosphorus RNI is set equal to calcium RNI in molar terms.');
  pushSexed(rows, 'Phosphorus', A_15_18, 775, 625, 'mg', 'RDA',
            'Phosphorus RNI is set equal to calcium RNI in molar terms.',
            'Phosphorus RNI is set equal to calcium RNI in molar terms.');
  pushSexed(rows, 'Phosphorus', A_19_50, 550, 550, 'mg', 'RDA',
            'Phosphorus RNI is set equal to calcium RNI in molar terms.',
            'Phosphorus RNI is set equal to calcium RNI in molar terms.');
  pushSexed(rows, 'Phosphorus', A_50P, 550, 550, 'mg', 'RDA',
            'Phosphorus RNI is set equal to calcium RNI in molar terms.',
            'Phosphorus RNI is set equal to calcium RNI in molar terms.');
  pushLact(rows, 'Phosphorus', 990, 990, 'mg', 'RDA', 'Lactation increment +440 mg/d (base 550 + 440 = 990). Set equal to calcium in molar terms.');

  // Magnesium (mg/d)
  pushUnisex(rows, 'Magnesium', A_0_3, 55, 'mg');
  pushUnisex(rows, 'Magnesium', A_4_6, 60, 'mg');
  pushUnisex(rows, 'Magnesium', A_7_9, 75, 'mg');
  pushUnisex(rows, 'Magnesium', A_10_12, 80, 'mg');
  pushUnisex(rows, 'Magnesium', A_1_3Y, 85, 'mg');
  pushUnisex(rows, 'Magnesium', A_4_6Y, 120, 'mg');
  pushUnisex(rows, 'Magnesium', A_7_10Y, 200, 'mg');
  pushSexed(rows, 'Magnesium', A_11_14, 280, 280, 'mg');
  pushSexed(rows, 'Magnesium', A_15_18, 300, 300, 'mg');
  pushSexed(rows, 'Magnesium', A_19_50, 300, 270, 'mg');
  pushSexed(rows, 'Magnesium', A_50P, 300, 270, 'mg');
  pushLact(rows, 'Magnesium', 320, 320, 'mg', 'RDA', 'Lactation increment +50 mg/d (base 270 + 50 = 320).');

  // Sodium (mg/d) — COMA 1991 RNI (separate from SACN 2003 salt CDRR below)
  pushUnisex(rows, 'Sodium', A_0_3, 210, 'mg', 'RDA', 'COMA 1991 RNI. Note: SACN 2003 also published max-intake salt CDRR — both stored.');
  pushUnisex(rows, 'Sodium', A_4_6, 280, 'mg', 'RDA', 'COMA 1991 RNI.');
  pushUnisex(rows, 'Sodium', A_7_9, 320, 'mg', 'RDA', 'COMA 1991 RNI.');
  pushUnisex(rows, 'Sodium', A_10_12, 350, 'mg', 'RDA', 'COMA 1991 RNI.');
  pushUnisex(rows, 'Sodium', A_1_3Y, 500, 'mg', 'RDA', 'COMA 1991 RNI.');
  pushUnisex(rows, 'Sodium', A_4_6Y, 700, 'mg', 'RDA', 'COMA 1991 RNI.');
  pushUnisex(rows, 'Sodium', A_7_10Y, 1200, 'mg', 'RDA', 'COMA 1991 RNI.');
  pushSexed(rows, 'Sodium', A_11_14, 1600, 1600, 'mg', 'RDA', 'COMA 1991 RNI.', 'COMA 1991 RNI.');
  pushSexed(rows, 'Sodium', A_15_18, 1600, 1600, 'mg', 'RDA', 'COMA 1991 RNI.', 'COMA 1991 RNI.');
  pushSexed(rows, 'Sodium', A_19_50, 1600, 1600, 'mg', 'RDA', 'COMA 1991 RNI.', 'COMA 1991 RNI.');
  pushSexed(rows, 'Sodium', A_50P, 1600, 1600, 'mg', 'RDA', 'COMA 1991 RNI.', 'COMA 1991 RNI.');

  // Potassium (mg/d)
  pushUnisex(rows, 'Potassium', A_0_3, 800, 'mg');
  pushUnisex(rows, 'Potassium', A_4_6, 850, 'mg');
  pushUnisex(rows, 'Potassium', A_7_9, 700, 'mg');
  pushUnisex(rows, 'Potassium', A_10_12, 700, 'mg');
  pushUnisex(rows, 'Potassium', A_1_3Y, 800, 'mg');
  pushUnisex(rows, 'Potassium', A_4_6Y, 1100, 'mg');
  pushUnisex(rows, 'Potassium', A_7_10Y, 2000, 'mg');
  pushSexed(rows, 'Potassium', A_11_14, 3100, 3100, 'mg');
  pushSexed(rows, 'Potassium', A_15_18, 3500, 3500, 'mg');
  pushSexed(rows, 'Potassium', A_19_50, 3500, 3500, 'mg');
  pushSexed(rows, 'Potassium', A_50P, 3500, 3500, 'mg');

  // Chloride (mg/d) — set in molar equivalence to sodium
  pushUnisex(rows, 'Chloride', A_0_3, 320, 'mg', 'RDA', 'Set in molar equivalence to sodium.');
  pushUnisex(rows, 'Chloride', A_4_6, 400, 'mg', 'RDA', 'Set in molar equivalence to sodium.');
  pushUnisex(rows, 'Chloride', A_7_9, 500, 'mg', 'RDA', 'Set in molar equivalence to sodium.');
  pushUnisex(rows, 'Chloride', A_10_12, 500, 'mg', 'RDA', 'Set in molar equivalence to sodium.');
  pushUnisex(rows, 'Chloride', A_1_3Y, 800, 'mg', 'RDA', 'Set in molar equivalence to sodium.');
  pushUnisex(rows, 'Chloride', A_4_6Y, 1100, 'mg', 'RDA', 'Set in molar equivalence to sodium.');
  pushUnisex(rows, 'Chloride', A_7_10Y, 1800, 'mg', 'RDA', 'Set in molar equivalence to sodium.');
  pushSexed(rows, 'Chloride', A_11_14, 2500, 2500, 'mg', 'RDA',
            'Set in molar equivalence to sodium.', 'Set in molar equivalence to sodium.');
  pushSexed(rows, 'Chloride', A_15_18, 2500, 2500, 'mg', 'RDA',
            'Set in molar equivalence to sodium.', 'Set in molar equivalence to sodium.');
  pushSexed(rows, 'Chloride', A_19_50, 2500, 2500, 'mg', 'RDA',
            'Set in molar equivalence to sodium.', 'Set in molar equivalence to sodium.');
  pushSexed(rows, 'Chloride', A_50P, 2500, 2500, 'mg', 'RDA',
            'Set in molar equivalence to sodium.', 'Set in molar equivalence to sodium.');

  // Iron (mg/d) — 11+ female 14.8 marked *** (insufficient for high-menstrual-loss)
  pushUnisex(rows, 'Iron', A_0_3, 1.7, 'mg');
  pushUnisex(rows, 'Iron', A_4_6, 4.3, 'mg');
  pushUnisex(rows, 'Iron', A_7_9, 7.8, 'mg');
  pushUnisex(rows, 'Iron', A_10_12, 7.8, 'mg');
  pushUnisex(rows, 'Iron', A_1_3Y, 6.9, 'mg');
  pushUnisex(rows, 'Iron', A_4_6Y, 6.1, 'mg');
  pushUnisex(rows, 'Iron', A_7_10Y, 8.7, 'mg');
  pushSexed(rows, 'Iron', A_11_14, 11.3, 14.8, 'mg', 'RDA',
            undefined,
            'Insufficient for women with high menstrual losses; supplements advised in such cases.');
  pushSexed(rows, 'Iron', A_15_18, 11.3, 14.8, 'mg', 'RDA',
            undefined,
            'Insufficient for women with high menstrual losses; supplements advised in such cases.');
  pushSexed(rows, 'Iron', A_19_50, 8.7, 14.8, 'mg', 'RDA',
            undefined,
            'Insufficient for women with high menstrual losses (premenopausal); supplements advised.');
  pushSexed(rows, 'Iron', A_50P, 8.7, 8.7, 'mg', 'RDA',
            undefined,
            'Postmenopausal value (no menstrual losses).');

  // Zinc (mg/d)
  pushUnisex(rows, 'Zinc', A_0_3, 4.0, 'mg');
  pushUnisex(rows, 'Zinc', A_4_6, 4.0, 'mg');
  pushUnisex(rows, 'Zinc', A_7_9, 5.0, 'mg');
  pushUnisex(rows, 'Zinc', A_10_12, 5.0, 'mg');
  pushUnisex(rows, 'Zinc', A_1_3Y, 5.0, 'mg');
  pushUnisex(rows, 'Zinc', A_4_6Y, 6.5, 'mg');
  pushUnisex(rows, 'Zinc', A_7_10Y, 7.0, 'mg');
  pushSexed(rows, 'Zinc', A_11_14, 9.0, 9.0, 'mg');
  pushSexed(rows, 'Zinc', A_15_18, 9.5, 7.0, 'mg');
  pushSexed(rows, 'Zinc', A_19_50, 9.5, 7.0, 'mg');
  pushSexed(rows, 'Zinc', A_50P, 9.5, 7.0, 'mg');
  pushLact(rows, 'Zinc', 13.0, 9.5, 'mg', 'RDA', 'Lactation: +6.0 mg 0-4 mo (base 7 + 6 = 13), +2.5 mg 4+ mo (base 7 + 2.5 = 9.5).');

  // Copper (mg/d)
  pushUnisex(rows, 'Copper', A_0_3, 0.2, 'mg');
  pushUnisex(rows, 'Copper', A_4_6, 0.3, 'mg');
  pushUnisex(rows, 'Copper', A_7_9, 0.3, 'mg');
  pushUnisex(rows, 'Copper', A_10_12, 0.3, 'mg');
  pushUnisex(rows, 'Copper', A_1_3Y, 0.4, 'mg');
  pushUnisex(rows, 'Copper', A_4_6Y, 0.6, 'mg');
  pushUnisex(rows, 'Copper', A_7_10Y, 0.7, 'mg');
  pushSexed(rows, 'Copper', A_11_14, 0.8, 0.8, 'mg');
  pushSexed(rows, 'Copper', A_15_18, 1.0, 1.0, 'mg');
  pushSexed(rows, 'Copper', A_19_50, 1.2, 1.2, 'mg');
  pushSexed(rows, 'Copper', A_50P, 1.2, 1.2, 'mg');
  pushLact(rows, 'Copper', 1.5, 1.5, 'mg', 'RDA', 'Lactation increment +0.3 mg/d (base 1.2 + 0.3 = 1.5).');

  // Selenium (µg/d)
  pushUnisex(rows, 'Selenium', A_0_3, 10, 'µg');
  pushUnisex(rows, 'Selenium', A_4_6, 13, 'µg');
  pushUnisex(rows, 'Selenium', A_7_9, 10, 'µg');
  pushUnisex(rows, 'Selenium', A_10_12, 10, 'µg');
  pushUnisex(rows, 'Selenium', A_1_3Y, 15, 'µg');
  pushUnisex(rows, 'Selenium', A_4_6Y, 20, 'µg');
  pushUnisex(rows, 'Selenium', A_7_10Y, 30, 'µg');
  pushSexed(rows, 'Selenium', A_11_14, 45, 45, 'µg');
  pushSexed(rows, 'Selenium', A_15_18, 70, 60, 'µg');
  pushSexed(rows, 'Selenium', A_19_50, 75, 60, 'µg');
  pushSexed(rows, 'Selenium', A_50P, 75, 60, 'µg');
  pushLact(rows, 'Selenium', 75, 75, 'µg', 'RDA', 'Lactation increment +15 µg/d (base 60 + 15 = 75).');

  // Iodine (µg/d)
  pushUnisex(rows, 'Iodine', A_0_3, 50, 'µg');
  pushUnisex(rows, 'Iodine', A_4_6, 60, 'µg');
  pushUnisex(rows, 'Iodine', A_7_9, 60, 'µg');
  pushUnisex(rows, 'Iodine', A_10_12, 60, 'µg');
  pushUnisex(rows, 'Iodine', A_1_3Y, 70, 'µg');
  pushUnisex(rows, 'Iodine', A_4_6Y, 100, 'µg');
  pushUnisex(rows, 'Iodine', A_7_10Y, 110, 'µg');
  pushSexed(rows, 'Iodine', A_11_14, 130, 130, 'µg');
  pushSexed(rows, 'Iodine', A_15_18, 140, 140, 'µg');
  pushSexed(rows, 'Iodine', A_19_50, 140, 140, 'µg');
  pushSexed(rows, 'Iodine', A_50P, 140, 140, 'µg');

  // ───────────────────────────────────────────────────────────────
  // PROTEIN (COMA 1991 — Table 5.4 of Report 41)
  // Source: BNF + COMA-published derived values from g/kg × ref body weight
  // ───────────────────────────────────────────────────────────────

  // Children (BNF table)
  pushUnisex(rows, 'Protein', A_0_3, 12.5, 'g');
  pushUnisex(rows, 'Protein', A_4_6, 12.7, 'g');
  pushUnisex(rows, 'Protein', A_7_9, 13.7, 'g');
  pushUnisex(rows, 'Protein', A_10_12, 14.9, 'g');
  pushUnisex(rows, 'Protein', A_1_3Y, 14.5, 'g');
  pushUnisex(rows, 'Protein', A_4_6Y, 19.7, 'g');
  pushUnisex(rows, 'Protein', A_7_10Y, 28.3, 'g');

  // Adolescents/Adults (COMA Table 5.4 — derived from g/kg × COMA reference body weight)
  pushSexed(rows, 'Protein', A_11_14, 42.1, 41.2, 'g', 'RDA',
            'COMA 1991 Table 5.4: 1.0 g/kg × 43.4 kg ref M.', 'COMA 1991 Table 5.4: 0.95 g/kg × 43.4 kg ref F.');
  pushSexed(rows, 'Protein', A_15_18, 55.2, 45.4, 'g', 'RDA',
            'COMA 1991 Table 5.4: 0.85 g/kg × 64.5 kg ref M.', 'COMA 1991 Table 5.4: 0.82 g/kg × 55.5 kg ref F.');
  pushSexed(rows, 'Protein', A_19_50, 55.5, 45.0, 'g', 'RDA',
            'COMA 1991 Table 5.4: 0.75 g/kg × 74 kg ref M.', 'COMA 1991 Table 5.4: 0.75 g/kg × 60 kg ref F.');
  pushSexed(rows, 'Protein', A_50P, 53.3, 46.5, 'g', 'RDA',
            'COMA 1991 Table 5.4: 0.75 g/kg × 71 kg ref M.', 'COMA 1991 Table 5.4: 0.75 g/kg × 62 kg ref F.');

  pushPreg(rows, 'Protein', 51.0, 'g', 'RDA',
           'Pregnancy increment +6 g/d (base 45 + 6 = 51).');
  pushLact(rows, 'Protein', 56.0, 53.0, 'g', 'RDA',
           'Lactation: +11 g/d 0-6 mo (base 45 + 11 = 56), +8 g/d 6+ mo (base 45 + 8 = 53).');

  // ───────────────────────────────────────────────────────────────
  // ENERGY (SACN 2011 — Estimated Average Requirements, mixed-feeding for infants)
  // ───────────────────────────────────────────────────────────────
  // Mixed feeding infants (kcal/d)
  pushSexed(rows, 'Energy', [1, 2],   574, 502, 'kcal', 'EAR', 'SACN 2011 — mixed/unknown feeding mode.', 'SACN 2011 — mixed/unknown feeding mode.');
  pushSexed(rows, 'Energy', [3, 4],   598, 550, 'kcal', 'EAR', 'SACN 2011 — mixed/unknown feeding mode.', 'SACN 2011 — mixed/unknown feeding mode.');
  pushSexed(rows, 'Energy', [5, 6],   622, 574, 'kcal', 'EAR', 'SACN 2011 — mixed/unknown feeding mode.', 'SACN 2011 — mixed/unknown feeding mode.');
  pushSexed(rows, 'Energy', [7, 12],  718, 646, 'kcal', 'EAR', 'SACN 2011 — mixed/unknown feeding mode.', 'SACN 2011 — mixed/unknown feeding mode.');

  // Children single-year buckets (1y..18y)
  // Ages 1-3 y come from mixed-feeding table; 4-18 from children table
  const kidsByYear: Array<[number, number, number]> = [
    // [yearOfAge, M kcal, F kcal]
    [1, 765, 717],
    [2, 1004, 932],
    [3, 1171, 1076],
    [4, 1386, 1291],
    [5, 1482, 1362],
    [6, 1577, 1482],
    [7, 1649, 1530],
    [8, 1745, 1625],
    [9, 1840, 1721],
    [10, 2032, 1936],
    [11, 2127, 2032],
    [12, 2247, 2103],
    [13, 2414, 2223],
    [14, 2629, 2342],
    [15, 2820, 2390],
    [16, 2964, 2414],
    [17, 3083, 2462],
    [18, 3155, 2462],
  ];
  for (const [year, m, f] of kidsByYear) {
    const ageMin = year * 12;
    const ageMax = ageMin + 11;
    pushSexed(rows, 'Energy', [ageMin, ageMax], m, f, 'kcal', 'EAR',
              'SACN 2011.', 'SACN 2011.');
  }

  // Adults
  pushSexed(rows, 'Energy', E_19_24, 2772, 2175, 'kcal', 'EAR', 'SACN 2011 — moderately active.', 'SACN 2011 — moderately active.');
  pushSexed(rows, 'Energy', E_25_34, 2749, 2175, 'kcal', 'EAR', 'SACN 2011 — moderately active.', 'SACN 2011 — moderately active.');
  pushSexed(rows, 'Energy', E_35_44, 2629, 2103, 'kcal', 'EAR', 'SACN 2011 — moderately active.', 'SACN 2011 — moderately active.');
  pushSexed(rows, 'Energy', E_45_54, 2581, 2103, 'kcal', 'EAR', 'SACN 2011 — moderately active.', 'SACN 2011 — moderately active.');
  pushSexed(rows, 'Energy', E_55_64, 2581, 2079, 'kcal', 'EAR', 'SACN 2011 — moderately active.', 'SACN 2011 — moderately active.');
  pushSexed(rows, 'Energy', E_65_74, 2342, 1912, 'kcal', 'EAR', 'SACN 2011 — moderately active.', 'SACN 2011 — moderately active.');
  pushSexed(rows, 'Energy', E_75P,   2294, 1840, 'kcal', 'EAR', 'SACN 2011 — moderately active.', 'SACN 2011 — moderately active.');

  // Pregnancy energy: +200 kcal/d last trimester only
  rows.push({
    compoundName: 'Energy', ageMinMonths: 180, ageMaxMonths: 611,
    sex: 'FEMALE', lifeStage: 'PREGNANT_T3', valueType: 'EAR',
    value: 2375, unit: 'kcal',
    valueNote: 'SACN 2011: pregnancy increment +200 kcal/d (0.8 MJ) for last trimester only. Base 2175 + 200 = 2375.',
  });

  // ───────────────────────────────────────────────────────────────
  // MACRONUTRIENT RANGES (% of energy)
  // SACN 2015 (carb/sugars), COMA 1991 (fat/sat fat)
  // ───────────────────────────────────────────────────────────────

  // Carbohydrate target 50% (SACN 2015, age 2+)
  pushUnisex(rows, 'Carbohydrate', [24, null], 50, '%', 'AMDR', 'SACN 2015 — population goal: ~50% of total energy from carbohydrate. Stored as % energy.');
  // Override since pushUnisex sets isPercentOfEnergy=false; mark percent
  for (const r of rows) {
    if (r.compoundName === 'Carbohydrate') r.isPercentOfEnergy = true;
  }

  // Free Sugars ≤5% (SACN 2015, age 2+)
  pushUnisex(rows, 'Free Sugars', [24, null], 5, '%', 'CDRR', 'SACN 2015 — population goal: free sugars should not exceed 5% of total energy. UK "free sugars" definition (added + honey/syrups/fruit juice; excludes whole-fruit sugars).');
  for (const r of rows) {
    if (r.compoundName === 'Free Sugars') r.isPercentOfEnergy = true;
  }

  // Total Fat ≤35% (COMA 1991, age 5+)
  pushUnisex(rows, 'Total Fat', [60, null], 35, '%', 'CDRR', 'COMA 1991 — population goal: total fat should not exceed 35% of total energy.');
  for (const r of rows) {
    if (r.compoundName === 'Total Fat') r.isPercentOfEnergy = true;
  }

  // Saturated Fat ≤11% (COMA 1991, age 5+)
  pushUnisex(rows, 'Saturated Fat', [60, null], 11, '%', 'CDRR', 'COMA 1991 — population goal: saturated fat should not exceed 11% of total energy.');
  for (const r of rows) {
    if (r.compoundName === 'Saturated Fat') r.isPercentOfEnergy = true;
  }

  // ───────────────────────────────────────────────────────────────
  // FIBRE (SACN 2015 — AOAC method, "Recommended intake")
  // ───────────────────────────────────────────────────────────────
  // Source has overlapping 5-year boundaries (2-5, 5-11, 11-16, 17+).
  // Storing with literal source labels (overlap on year 5, 11 is one-year boundary).
  pushUnisex(rows, 'Fibre', [24, 71],  15, 'g', 'RDA', 'SACN 2015 — recommended fibre intake (AOAC method), age 2-5 y.');
  pushUnisex(rows, 'Fibre', [60, 131], 20, 'g', 'RDA', 'SACN 2015 — recommended fibre intake (AOAC method), age 5-11 y.');
  pushUnisex(rows, 'Fibre', [132, 203], 25, 'g', 'RDA', 'SACN 2015 — recommended fibre intake (AOAC method), age 11-16 y.');
  pushUnisex(rows, 'Fibre', [204, null], 30, 'g', 'RDA', 'SACN 2015 — recommended fibre intake (AOAC method), age 17+ y.');

  // ───────────────────────────────────────────────────────────────
  // SODIUM (SACN 2003 — Salt and Health, max population intake → CDRR)
  // ───────────────────────────────────────────────────────────────
  // Conversion: 1 g salt = 393 mg sodium (per NaCl mass: 23/58.5)
  pushUnisex(rows, 'Sodium', [0, 6],   393, 'mg', 'CDRR', 'SACN 2003 max salt 1 g/d (<1 g for 0-6 mo; stored as 1 g equivalent = 393 mg Na, ceiling).');
  pushUnisex(rows, 'Sodium', [6, 12],  393, 'mg', 'CDRR', 'SACN 2003 max salt 1 g/d → 393 mg Na.');
  pushUnisex(rows, 'Sodium', A_1_3Y,   786, 'mg', 'CDRR', 'SACN 2003 max salt 2 g/d → 786 mg Na.');
  pushUnisex(rows, 'Sodium', A_4_6Y,  1180, 'mg', 'CDRR', 'SACN 2003 max salt 3 g/d → 1180 mg Na.');
  pushUnisex(rows, 'Sodium', A_7_10Y, 1966, 'mg', 'CDRR', 'SACN 2003 max salt 5 g/d → 1966 mg Na.');
  pushUnisex(rows, 'Sodium', [132, null], 2360, 'mg', 'CDRR', 'SACN 2003 max salt 6 g/d → 2360 mg Na (ages 11+).');

  return rows;
}

// ═══════════════════════════════════════════════════════════════
// Gate 4+5 — Insert (idempotent via ON CONFLICT DO UPDATE)
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
