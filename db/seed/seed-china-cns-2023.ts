/**
 * CNS 2023 — Chinese Nutrition Society Dietary Reference Intakes
 * Published Sept 2023. Revises 2013 edition.
 *
 * Every value comes from a cell-by-cell transcription of the printed appendix tables in
 * dv-sources/cns-2023/printed/. Verify with scripts/dv-verify/check-cns-db.ts and
 * scripts/dv-verify/check-cns-consistency.ts.
 *
 * Run: npx tsx db/seed/seed-china-cns-2023.ts
 */

import 'dotenv/config';
import postgres from 'postgres';
import { TABLE_3_6_EAR, type PrintedNutrient } from '../../dv-sources/cns-2023/printed/table-3-6-ear';
import { TABLE_3_7_MINERALS } from '../../dv-sources/cns-2023/printed/table-3-7-minerals';
import { TABLE_3_8_VITAMINS } from '../../dv-sources/cns-2023/printed/table-3-8-vitamins';
import { TABLE_3_1_ENERGY } from '../../dv-sources/cns-2023/printed/table-3-1-energy';
import { YEARLY_ROWS, BAND_ROWS } from '../../dv-sources/cns-2023/printed/types';
import { TABLE_3_2_PROTEIN } from '../../dv-sources/cns-2023/printed/table-3-2-protein';
import { TABLE_3_3_FAT, FAT_ROWS } from '../../dv-sources/cns-2023/printed/table-3-3-fat';
import { TABLE_3_12_OTHER } from '../../dv-sources/cns-2023/printed/table-3-12-other';
import { TABLE_3_4_CARBOHYDRATE } from '../../dv-sources/cns-2023/printed/table-3-4-carbohydrate';
import { TABLE_3_9_PINCD } from '../../dv-sources/cns-2023/printed/table-3-9-pincd';
import { TABLE_3_10_UL } from '../../dv-sources/cns-2023/printed/table-3-10-ul';
import { TABLE_3_11_WATER_TOTAL, WATER_ROWS } from '../../dv-sources/cns-2023/printed/table-3-11-water';

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
  'Iron': 'Iron (Total)',
  'LA': 'Linoleic Acid',
  'ALA': 'Alpha-Linolenic Acid (ALA)',
  'DHA': 'DHA (Docosahexaenoic Acid)',
  'EPA + DHA': 'EPA + DHA',
  'Nicotinamide': 'Nicotinamide',
  'Carbohydrate': 'Carbohydrates',
};
function resolveDbName(n: string): string {
  return COMPOUND_NAME_MAP[n] ?? n;
}

type Sex = 'MALE' | 'FEMALE';
type LifeStage = 'NONE' | 'PREGNANT_T1' | 'PREGNANT_T2' | 'PREGNANT_T3' | 'LACTATING';
type Activity = 'SEDENTARY' | 'MODERATE' | 'ACTIVE';
type ValueType = 'RDA' | 'AI' | 'EAR' | 'EER' | 'UL' | 'CDRR' | 'AMDR';

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
  activityLevel?: Activity | null;
  /** The limit applies only to supplements / fortified foods, not to the nutrient in ordinary food. */
  supplementalOnly?: boolean;
  valueNote?: string | null;
}

const PREG_STAGES: LifeStage[] = ['PREGNANT_T1', 'PREGNANT_T2', 'PREGNANT_T3', 'LACTATING'];

/** Emit rows from a verified printed transcription (dv-sources/cns-2023/printed/). */
function pushPrinted(
  rows: SeedRow[], compound: string, unit: string, valueType: ValueType,
  p: PrintedNutrient, note?: string, ageRows: Array<[number, number | null]> = BAND_ROWS,
) {
  if (p.m.length !== ageRows.length || p.f.length !== ageRows.length) {
    throw new Error(`${compound} ${valueType}: ${p.m.length}/${p.f.length} cells for ${ageRows.length} printed rows`);
  }
  ageRows.forEach(([min, max], i) => {
    const range = p.ranges?.[i];
    for (const sex of ['MALE', 'FEMALE'] as Sex[]) {
      const value = sex === 'MALE' ? p.m[i] : p.f[i];
      if (value == null) continue;
      rows.push({
        compoundName: compound, ageMinMonths: min, ageMaxMonths: max,
        sex, lifeStage: 'NONE', valueType: p.aiRows?.includes(i) ? 'AI' : valueType,
        value, valueMin: range?.[0] ?? null, valueMax: range?.[1] ?? null,
        unit, valueNote: note ?? null,
      });
    }
  });
  // Printed "+x" over same-age non-pregnant women; the table's 18 and 30 rows.
  const at = (m: number) => ageRows.findIndex(([min, max]) => min <= m && (max == null || m <= max));
  const bases = [
    { min: 216, max: 359, base: p.f[at(216)], range: p.ranges?.[at(216)] },
    { min: 360, max: 599, base: p.f[at(360)], range: p.ranges?.[at(360)] },
  ];
  PREG_STAGES.forEach((lifeStage, i) => {
    const inc = p.preg[i];
    const totals = bases.map((b) => {
      if (b.base == null) throw new Error(`${compound} ${valueType}: no base for ${lifeStage}`);
      const shifted = b.range ? [b.range[0] + inc, b.range[1] + inc] as [number, number] : null;
      return { min: b.min, max: b.max, total: Number((b.base + inc).toFixed(4)), range: shifted };
    });
    const merged = totals[0].total === totals[1].total ? [{ ...totals[0], min: 216, max: 599 }] : totals;
    for (const b of merged) {
      rows.push({
        compoundName: compound, ageMinMonths: b.min, ageMaxMonths: b.max,
        sex: 'FEMALE', lifeStage, valueType, value: b.total, unit,
        valueMin: b.range?.[0] ?? null, valueMax: b.range?.[1] ?? null,
        valueNote: `${note ? note + ' ' : ''}Printed as +${inc} over same-age non-pregnant women; stored as total.`,
      });
    }
  });
}

type Cell = number | [number | null, number | null] | null;

/**
 * %-of-energy cells: a point (e.g. LA AI 4.0) or a [min, max] range (AMDR 20-30,
 * "<10" as [null, 10]). Pregnancy/lactation cells are printed absolute.
 */
function pushCells(
  rows: SeedRow[], compound: string,
  t: { valueType: ValueType; cells: Cell[]; preg: Cell; aiCells?: number[]; unit?: string },
  ageRows: Array<[number, number | null]>, note: string,
) {
  const unit = t.unit ?? '%';
  const isPercentOfEnergy = unit === '%';
  if (t.cells.length !== ageRows.length) throw new Error(`${compound} ${t.valueType}: ${t.cells.length} cells for ${ageRows.length} rows`);
  const shape = (c: Exclude<Cell, null>) => Array.isArray(c)
    ? { value: c[0] != null && c[1] != null ? (c[0] + c[1]) / 2 : (c[1] ?? c[0])!, valueMin: c[0], valueMax: c[1] }
    : { value: c, valueMin: null, valueMax: null };
  ageRows.forEach(([min, max], i) => {
    const c = t.cells[i];
    if (c == null) return;
    for (const sex of ['MALE', 'FEMALE'] as Sex[]) {
      rows.push({
        compoundName: compound, ageMinMonths: min, ageMaxMonths: max, sex, lifeStage: 'NONE',
        valueType: t.aiCells?.includes(i) ? 'AI' : t.valueType, ...shape(c), unit, isPercentOfEnergy, valueNote: note,
      });
    }
  });
  if (t.preg == null) return;
  for (const lifeStage of PREG_STAGES) {
    rows.push({
      compoundName: compound, ageMinMonths: 216, ageMaxMonths: 599, sex: 'FEMALE', lifeStage,
      valueType: t.valueType, ...shape(t.preg), unit, isPercentOfEnergy, valueNote: note,
    });
  }
}

const PAL_ACTIVITY: Record<'I' | 'II' | 'III', Activity> = { I: 'SEDENTARY', II: 'MODERATE', III: 'ACTIVE' };

/**
 * Energy by PAL. Where a row publishes PAL II only (ages 1-5), the value applies at
 * every activity level, so activity_level is NULL. Infants are printed per kg and
 * are not stored (see table-3-1-energy.ts).
 */
function pushEnergy(rows: SeedRow[]) {
  const T = TABLE_3_1_ENERGY;
  const pals = ['I', 'II', 'III'] as const;
  YEARLY_ROWS.forEach(([min, max], i) => {
    for (const sex of ['MALE', 'FEMALE'] as Sex[]) {
      const col = (pal: typeof pals[number]) => (sex === 'MALE' ? T[pal].m[i] : T[pal].f[i]);
      const split = col('I') != null || col('III') != null;
      for (const pal of pals) {
        const value = col(pal);
        if (value == null) continue;
        rows.push({
          compoundName: 'Energy', ageMinMonths: min, ageMaxMonths: max, sex, lifeStage: 'NONE',
          valueType: 'EER', value, unit: 'kcal', activityLevel: split ? PAL_ACTIVITY[pal] : null,
          valueNote: split ? `PAL ${pal}.` : 'Printed at PAL II only; applies at every activity level.',
        });
      }
    }
  });
  // Pregnancy/lactation: printed "+x" identically under each PAL, over the same-age woman.
  const i18 = YEARLY_ROWS.findIndex(([min]) => min === 216);
  const i30 = YEARLY_ROWS.findIndex(([min]) => min === 360);
  for (const pal of pals) {
    PREG_STAGES.forEach((lifeStage, k) => {
      const inc = T.preg[k];
      const a = T[pal].f[i18]! + inc, b = T[pal].f[i30]! + inc;
      const bands = a === b ? [{ min: 216, max: 599, total: a }] : [{ min: 216, max: 359, total: a }, { min: 360, max: 599, total: b }];
      for (const band of bands) {
        rows.push({
          compoundName: 'Energy', ageMinMonths: band.min, ageMaxMonths: band.max, sex: 'FEMALE', lifeStage,
          valueType: 'EER', value: band.total, unit: 'kcal', activityLevel: PAL_ACTIVITY[pal],
          valueNote: `PAL ${pal}. Printed as +${inc} over same-age non-pregnant women; stored as total.`,
        });
      }
    });
  }
}

function buildAllRows(): SeedRow[] {
  const rows: SeedRow[] = [];

  // ─── ENERGY (附表 3-1) — from the verified printed transcription ───
  pushEnergy(rows);

  // ─── MACROS ───
  // Protein (附表 3-2) — from the verified printed transcription
  pushPrinted(rows, 'Protein', 'g', 'EAR', TABLE_3_2_PROTEIN.ear, undefined, YEARLY_ROWS);
  pushPrinted(rows, 'Protein', 'g', 'RDA', TABLE_3_2_PROTEIN.rni, undefined, YEARLY_ROWS);
  pushCells(rows, 'Protein', { valueType: 'AMDR', cells: TABLE_3_2_PROTEIN.amdr, preg: TABLE_3_2_PROTEIN.amdrPreg }, YEARLY_ROWS, '附表 3-2.');
  // Carbohydrate, fiber, added sugars (附表 3-4) — from the verified printed transcription
  const CARB = TABLE_3_4_CARBOHYDRATE;
  pushPrinted(rows, 'Carbohydrate', 'g', 'EAR', CARB.carbEar);
  pushCells(rows, 'Carbohydrate', { valueType: 'AMDR', cells: CARB.carbAmdr.cells, preg: CARB.carbAmdr.preg }, BAND_ROWS, '附表 3-4.');
  pushPrinted(rows, 'Dietary Fiber', 'g', 'AI', CARB.fiberAi, 'Printed as a range; value is the midpoint.');
  pushCells(rows, 'Added Sugars', { valueType: 'AMDR', cells: CARB.addedSugarsAmdr.cells, preg: CARB.addedSugarsAmdr.preg }, BAND_ROWS,
    '附表 3-4. Footnote: no more than 50 g/d, preferably below 25 g/d.');

  // ─── EAR (附表 3-6) — from the verified printed transcription ───
  const EAR = TABLE_3_6_EAR;
  pushPrinted(rows, 'Calcium', 'mg', 'EAR', EAR.calcium);
  pushPrinted(rows, 'Phosphorus', 'mg', 'EAR', EAR.phosphorus);
  pushPrinted(rows, 'Magnesium', 'mg', 'EAR', EAR.magnesium);
  pushPrinted(rows, 'Iron', 'mg', 'EAR', EAR.iron, EAR.iron.note);
  pushPrinted(rows, 'Iodine', 'µg', 'EAR', EAR.iodine);
  pushPrinted(rows, 'Zinc', 'mg', 'EAR', EAR.zinc);
  pushPrinted(rows, 'Selenium', 'µg', 'EAR', EAR.selenium);
  pushPrinted(rows, 'Copper', 'mg', 'EAR', EAR.copper);
  pushPrinted(rows, 'Molybdenum', 'µg', 'EAR', EAR.molybdenum);
  pushPrinted(rows, 'Vitamin A', 'µg RAE', 'EAR', EAR.vitaminA);
  pushPrinted(rows, 'Vitamin D', 'µg', 'EAR', EAR.vitaminD);
  pushPrinted(rows, 'Thiamin', 'mg', 'EAR', EAR.thiamin);
  pushPrinted(rows, 'Riboflavin', 'mg', 'EAR', EAR.riboflavin);
  pushPrinted(rows, 'Niacin', 'mg', 'EAR', EAR.niacin, 'mg NE.');
  pushPrinted(rows, 'Vitamin B6', 'mg', 'EAR', EAR.vitaminB6);
  pushPrinted(rows, 'Folate', 'µg DFE', 'EAR', EAR.folate);
  pushPrinted(rows, 'Vitamin B12', 'µg', 'EAR', EAR.vitaminB12);
  pushPrinted(rows, 'Vitamin C', 'mg', 'EAR', EAR.vitaminC);

  // ─── MINERAL RNI / AI (附表 3-7) — from the verified printed transcription ───
  const MIN = TABLE_3_7_MINERALS;
  pushPrinted(rows, 'Calcium', 'mg', MIN.calcium.valueType, MIN.calcium);
  pushPrinted(rows, 'Phosphorus', 'mg', MIN.phosphorus.valueType, MIN.phosphorus);
  pushPrinted(rows, 'Potassium', 'mg', MIN.potassium.valueType, MIN.potassium);
  pushPrinted(rows, 'Sodium', 'mg', MIN.sodium.valueType, MIN.sodium, MIN.sodium.note);
  pushPrinted(rows, 'Magnesium', 'mg', MIN.magnesium.valueType, MIN.magnesium);
  pushPrinted(rows, 'Chloride', 'mg', MIN.chloride.valueType, MIN.chloride, MIN.chloride.note);
  pushPrinted(rows, 'Iron', 'mg', MIN.iron.valueType, MIN.iron, MIN.iron.note);
  pushPrinted(rows, 'Iodine', 'µg', MIN.iodine.valueType, MIN.iodine);
  pushPrinted(rows, 'Zinc', 'mg', MIN.zinc.valueType, MIN.zinc);
  pushPrinted(rows, 'Selenium', 'µg', MIN.selenium.valueType, MIN.selenium);
  pushPrinted(rows, 'Copper', 'mg', MIN.copper.valueType, MIN.copper);
  pushPrinted(rows, 'Fluoride', 'mg', MIN.fluoride.valueType, MIN.fluoride);
  pushPrinted(rows, 'Chromium', 'µg', MIN.chromium.valueType, MIN.chromium);
  pushPrinted(rows, 'Manganese', 'mg', MIN.manganese.valueType, MIN.manganese);
  pushPrinted(rows, 'Molybdenum', 'µg', MIN.molybdenum.valueType, MIN.molybdenum);

  // ─── VITAMIN RNI / AI (附表 3-8) — from the verified printed transcription ───
  const VIT = TABLE_3_8_VITAMINS;
  pushPrinted(rows, 'Vitamin A', 'µg RAE', VIT.vitaminA.valueType, VIT.vitaminA);
  pushPrinted(rows, 'Vitamin D', 'µg', VIT.vitaminD.valueType, VIT.vitaminD);
  pushPrinted(rows, 'Vitamin E', 'mg', VIT.vitaminE.valueType, VIT.vitaminE, 'α-TE.');
  pushPrinted(rows, 'Vitamin K', 'µg', VIT.vitaminK.valueType, VIT.vitaminK);
  pushPrinted(rows, 'Thiamin', 'mg', VIT.thiamin.valueType, VIT.thiamin);
  pushPrinted(rows, 'Riboflavin', 'mg', VIT.riboflavin.valueType, VIT.riboflavin);
  pushPrinted(rows, 'Niacin', 'mg', VIT.niacin.valueType, VIT.niacin, 'mg NE.');
  pushPrinted(rows, 'Vitamin B6', 'mg', VIT.vitaminB6.valueType, VIT.vitaminB6);
  pushPrinted(rows, 'Folate', 'µg DFE', VIT.folate.valueType, VIT.folate);
  pushPrinted(rows, 'Vitamin B12', 'µg', VIT.vitaminB12.valueType, VIT.vitaminB12);
  pushPrinted(rows, 'Pantothenic acid', 'mg', VIT.pantothenic.valueType, VIT.pantothenic);
  pushPrinted(rows, 'Biotin', 'µg', VIT.biotin.valueType, VIT.biotin);
  pushPrinted(rows, 'Choline', 'mg', VIT.choline.valueType, VIT.choline);
  pushPrinted(rows, 'Vitamin C', 'mg', VIT.vitaminC.valueType, VIT.vitaminC);

  // ─── PI-NCD (附表 3-9) → CDRR — from the verified printed transcription ───
  const PI = TABLE_3_9_PINCD;
  pushCells(rows, 'Potassium', { valueType: 'CDRR', cells: PI.potassium.cells, preg: PI.potassium.preg, unit: 'mg' }, BAND_ROWS, 'PI-NCD: intake to reach.');
  pushCells(rows, 'Sodium', { valueType: 'CDRR', cells: PI.sodium.cells, preg: PI.sodium.preg, unit: 'mg' }, BAND_ROWS, 'PI-NCD: printed ≤, stay at or below.');
  pushCells(rows, 'Vitamin C', { valueType: 'CDRR', cells: PI.vitaminC.cells, preg: PI.vitaminC.preg, unit: 'mg' }, BAND_ROWS, 'PI-NCD: intake to reach.');

  // ─── UL (附表 3-10) — from the verified printed transcription ───
  /**
   * 附表 3-10 prints one column per nutrient, but three of those limits apply to a FORM, not to the nutrient total —
   * each chapter says so explicitly, and storing them on the total compound would flag food that the limit does not
   * cover (carrots against the vitamin A UL, spinach against the folate UL). Quotes in UL_SCOPE below.
   */
  const UL_COMPOUND: Record<string, string> = {
    calcium: 'Calcium', phosphorus: 'Phosphorus', iron: 'Iron', iodine: 'Iodine', zinc: 'Zinc', selenium: 'Selenium',
    copper: 'Copper', fluoride: 'Fluoride', manganese: 'Manganese', molybdenum: 'Molybdenum', vitaminA: 'Retinol',
    vitaminD: 'Vitamin D', vitaminE: 'Vitamin E', niacin: 'Nicotinic Acid', nicotinamide: 'Nicotinamide', vitaminB6: 'Vitamin B6',
    folate: 'Folic Acid (Synthetic)', choline: 'Choline', vitaminC: 'Vitamin C',
  };
  const UL_SCOPE: Record<string, { note: string; supplementalOnly?: boolean }> = {
    vitaminA: { note: '第十一章第一节 (printed p. 332): "维生素A的UL只针对视黄醇" — the UL applies to retinol only, because carotenoid toxicity is very low; "因此，维生素A的UL数值单位使用 µg/d" (hence µg/d, not µg RAE).' },
    folate: { note: '第十二章第五节 (printed p. 394): "过量摄入天然食物叶酸未发现不良反应，叶酸的 UL 根据食物强化和补充剂的合成叶酸摄入量（µg/d）计算" — computed from synthetic folic acid in fortified foods and supplements; natural food folate showed no adverse effects.', supplementalOnly: true },
    niacin: { note: '第十二章第三节 (printed p. 379): "食物中的烟酸不会引起摄入过量的不良反应。烟酸的不良反应多由于服用烟酸补充剂、强化食品所致" — niacin in food causes no adverse effects; the 35 mg NE UL is derived from the flushing LOAEL of nicotinic acid (烟酸, printed as a separate column from 烟酰胺 nicotinamide).', supplementalOnly: true },
    nicotinamide: { note: '第十二章第三节 (printed p. 379): nicotinamide does not cause flushing; NOAEL 25 mg/kg bw/d with UF 5 gives the adult UL of 310 mg/d, the uncertainty factor chosen for "其作为营养素补充剂的安全性" (its safety as a nutrient supplement). The chapter does not restrict this UL to non-food sources, so it is not flagged supplement-only.' },
  };
  for (const [key, u] of Object.entries(TABLE_3_10_UL)) {
    if (new Set(u.preg).size !== 1) throw new Error(`UL ${key}: pregnancy cells differ; pushCells stores one`);
    const scope = UL_SCOPE[key];
    const before = rows.length;
    pushCells(rows, UL_COMPOUND[key], { valueType: 'UL', cells: u.cells, preg: u.preg[0], unit: u.unit }, BAND_ROWS,
      ['附表 3-10.', scope?.note].filter(Boolean).join(' '));
    if (scope?.supplementalOnly) for (let i = before; i < rows.length; i++) rows[i].supplementalOnly = true;
  }

  // ─── OTHER FOOD COMPONENTS (附表 3-12) — adults, SPL -> CDRR floor, UL ───
  for (const t of Object.values(TABLE_3_12_OTHER)) {
    for (const sex of ['MALE', 'FEMALE'] as Sex[]) {
      rows.push({ compoundName: t.compound, ageMinMonths: 216, ageMaxMonths: null, sex, lifeStage: 'NONE', valueType: 'CDRR',
        value: t.spl, valueMin: t.spl, valueMax: null, unit: t.unit, isPercentOfEnergy: false,
        valueNote: [t.note, 'SPL (特定建议值): intake to reach for lowering chronic disease risk, adults, 附表 3-12.'].filter(Boolean).join(' ') });
      if (t.ul != null) rows.push({ compoundName: t.compound, ageMinMonths: 216, ageMaxMonths: null, sex, lifeStage: 'NONE', valueType: 'UL',
        value: t.ul, valueMin: null, valueMax: null, unit: t.unit, isPercentOfEnergy: false,
        valueNote: [t.note, 'Adults, 附表 3-12.'].filter(Boolean).join(' ') });
    }
  }

  // ─── WATER (附表 3-11) — total intake, from the verified printed transcription ───
  pushPrinted(rows, 'Water', 'mL', 'AI', TABLE_3_11_WATER_TOTAL,
    'Total water (food + drink), temperate climate at low activity.', WATER_ROWS);

  // ─── FATS (附表 3-3) — from the verified printed transcription ───
  const FAT = TABLE_3_3_FAT;
  const fatNote = '附表 3-3.';
  pushCells(rows, 'Total Fat', FAT.totalFat, FAT_ROWS, fatNote);
  pushCells(rows, 'Saturated Fat', FAT.saturatedFat, FAT_ROWS, fatNote);
  pushCells(rows, 'Omega-6', FAT.n6Pufa, FAT_ROWS, 'n-6 PUFA (total), 附表 3-3.');
  pushCells(rows, 'Omega-3', FAT.n3Pufa, FAT_ROWS, 'n-3 PUFA (total), 附表 3-3.');
  pushCells(rows, 'LA', FAT.linoleicAcid, FAT_ROWS, fatNote);
  pushCells(rows, 'ALA', FAT.alphaLinolenicAcid, FAT_ROWS, fatNote);
  pushCells(rows, 'DHA', FAT.dha, FAT_ROWS, 'Printed in the EPA+DHA column, footnoted DHA, 附表 3-3.');
  pushCells(rows, 'EPA + DHA', FAT.epaDhaAi, FAT_ROWS, fatNote);
  pushCells(rows, 'EPA + DHA', FAT.epaDhaAmdr, FAT_ROWS, fatNote);

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

  // Two rows with the same unique key would upsert over each other, and the
  // first value would vanish without a trace. Fail instead.
  const seenKeys = new Map<string, SeedRow>();
  const dupes: string[] = [];
  for (const r of rows) {
    const key = [resolveDbName(r.compoundName), r.ageMinMonths, r.ageMaxMonths, r.sex, r.lifeStage, r.valueType, r.activityLevel ?? ''].join('|');
    const prev = seenKeys.get(key);
    if (prev) dupes.push(`${key}: ${prev.value} ${prev.unit} vs ${r.value} ${r.unit}`);
    seenKeys.set(key, r);
  }
  if (dupes.length > 0) throw new Error(`${dupes.length} duplicate keys:\n  ${dupes.join('\n  ')}`);
  console.log(`Prepared ${rows.length} reference values.\n`);

  const names = [...new Set(rows.map((r) => resolveDbName(r.compoundName)))];
  // Any tier (as db/seed/dv/load-source.ts); core first so a core compound wins a name tie.
  const compoundRows = await sql`
    SELECT id, name FROM compounds WHERE name = ANY(${names}) ORDER BY (tier = 'core') ASC
  `;
  const idByName = new Map(compoundRows.map((r: any) => [r.name, r.id]));
  const missing = names.filter((n) => !idByName.has(n));
  if (missing.length > 0) {
    // Fatal: a skipped compound would silently drop its rows.
    throw new Error(`Compounds not found: ${missing.join(', ')}`);
  }

  // Full replacement in one transaction: the table then holds exactly what this
  // seed produces (no stale rows when a key changes, e.g. an infant cell moving
  // from RDA to AI), and a failure leaves the previous data untouched.
  // Nothing references reference_daily_values.id, so replacing rows is safe.
  const { removed, inserted } = await sql.begin(async (tx) => {
    const del = await tx`DELETE FROM reference_daily_values WHERE source_region = ${SOURCE.regionCode}`;
    let n = 0;
    for (const row of rows) {
      await tx`
        INSERT INTO reference_daily_values (
          compound_id, source_region, source_id,
          age_min_months, age_max_months,
          sex, life_stage, value_type, activity_level,
          value, value_min, value_max, unit,
          is_percent_of_energy, is_provisional, supplemental_only, value_note
        ) VALUES (
          ${idByName.get(resolveDbName(row.compoundName))}, ${SOURCE.regionCode}, ${source.id},
          ${row.ageMinMonths}, ${row.ageMaxMonths},
          ${row.sex}, ${row.lifeStage}, ${row.valueType}, ${row.activityLevel ?? null},
          ${row.value}, ${row.valueMin ?? null}, ${row.valueMax ?? null}, ${row.unit},
          ${row.isPercentOfEnergy ?? false}, false, ${row.supplementalOnly ?? false}, ${row.valueNote ?? null}
        )`;
      n++;
    }
    return { removed: del.count, inserted: n };
  });

  console.log('─'.repeat(60));
  console.log(`✅ Seed complete — replaced ${removed} ${SOURCE.regionCode} rows with ${inserted}`);
  console.log('─'.repeat(60));
}

seed()
  .catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); })
  .finally(() => sql.end());
