/**
 * End-to-end check of CHINA reference values against the verified CNS 2023
 * printed-table transcriptions (dv-sources/cns-2023/printed/).
 *
 * Builds the expected rows straight from the transcriptions — independently of
 * the seed script — and requires the database to hold exactly those CHINA rows:
 * same value, range, type, activity level; nothing missing, nothing extra.
 *
 * Run: npx tsx scripts/dv-verify/check-cns-db.ts
 */
import 'dotenv/config';
import postgres from 'postgres';
import { BAND_ROWS, YEARLY_ROWS, type PrintedNutrient } from '../../dv-sources/cns-2023/printed/types';
import { TABLE_3_1_ENERGY } from '../../dv-sources/cns-2023/printed/table-3-1-energy';
import { TABLE_3_2_PROTEIN } from '../../dv-sources/cns-2023/printed/table-3-2-protein';
import { TABLE_3_3_FAT, FAT_ROWS } from '../../dv-sources/cns-2023/printed/table-3-3-fat';
import { TABLE_3_4_CARBOHYDRATE } from '../../dv-sources/cns-2023/printed/table-3-4-carbohydrate';
import { TABLE_3_6_EAR } from '../../dv-sources/cns-2023/printed/table-3-6-ear';
import { TABLE_3_7_MINERALS } from '../../dv-sources/cns-2023/printed/table-3-7-minerals';
import { TABLE_3_8_VITAMINS } from '../../dv-sources/cns-2023/printed/table-3-8-vitamins';
import { TABLE_3_9_PINCD } from '../../dv-sources/cns-2023/printed/table-3-9-pincd';
import { TABLE_3_10_UL } from '../../dv-sources/cns-2023/printed/table-3-10-ul';
import { TABLE_3_11_WATER_TOTAL, WATER_ROWS } from '../../dv-sources/cns-2023/printed/table-3-11-water';

const sql = postgres(process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL!, { max: 1 });

// Printed-table key -> live compound name.
const C: Record<string, string> = {
  calcium: 'Calcium', phosphorus: 'Phosphorus', magnesium: 'Magnesium', iron: 'Iron (Total)', iodine: 'Iodine',
  zinc: 'Zinc', selenium: 'Selenium', copper: 'Copper', molybdenum: 'Molybdenum', vitaminA: 'Vitamin A (RAE)',
  vitaminD: 'Vitamin D (Total)', thiamin: 'Thiamin (B1)', riboflavin: 'Riboflavin (B2)', niacin: 'Niacin (B3)',
  vitaminB6: 'Vitamin B6', folate: 'Folate (Total)', vitaminB12: 'Vitamin B12 (Total)', vitaminC: 'Vitamin C (Total)',
  potassium: 'Potassium', sodium: 'Sodium', chloride: 'Chloride', fluoride: 'Fluoride', chromium: 'Chromium',
  manganese: 'Manganese', vitaminE: 'Vitamin E (Total)', vitaminK: 'Vitamin K (Total)',
  pantothenic: 'Pantothenic Acid (B5)', biotin: 'Biotin (B7)', choline: 'Choline (Total)', nicotinamide: 'Nicotinamide',
  totalFat: 'Total Fat', saturatedFat: 'Saturated Fat', n6Pufa: 'Omega-6', n3Pufa: 'Omega-3',
  linoleicAcid: 'Linoleic Acid', alphaLinolenicAcid: 'Alpha-Linolenic Acid (ALA)',
  dha: 'DHA (Docosahexaenoic Acid)', epaDhaAi: 'EPA + DHA', epaDhaAmdr: 'EPA + DHA',
};
const STAGES = ['PREGNANT_T1', 'PREGNANT_T2', 'PREGNANT_T3', 'LACTATING'];
type Rows = Array<[number, number | null]>;
type Cell = number | [number | null, number | null] | null;
type Exp = { value: number; min: number | null; max: number | null; from: string };

const expected = new Map<string, Exp>();
const n = (x: number) => Number(x.toFixed(4));
function put(name: string, type: string, sex: string, stage: string, min: number, max: number | null, act: string | null, e: Exp) {
  const k = [name, type, sex, stage, min, max, act ?? '-'].join('|');
  if (expected.has(k)) throw new Error(`Two printed cells map to ${k}`);
  expected.set(k, { ...e, value: n(e.value), min: e.min == null ? null : n(e.min), max: e.max == null ? null : n(e.max) });
}
const containing = (rows: Rows, m: number) => rows.findIndex(([a, b]) => a <= m && (b == null || m <= b));

/** Per-sex point table with "+x" pregnancy increments (optionally shifting a printed range). */
function point(id: string, name: string, type: string, p: PrintedNutrient, rows: Rows) {
  if (p.m.length !== rows.length || p.f.length !== rows.length) throw new Error(`${id} ${name}: row count`);
  rows.forEach(([min, max], i) => {
    for (const [sex, v] of [['MALE', p.m[i]], ['FEMALE', p.f[i]]] as const) {
      if (v == null) continue;
      const r = p.ranges?.[i];
      put(name, p.aiRows?.includes(i) ? 'AI' : type, sex, 'NONE', min, max, null, { value: v, min: r?.[0] ?? null, max: r?.[1] ?? null, from: `${id} row ${i}` });
    }
  });
  const i18 = containing(rows, 216), i30 = containing(rows, 360);
  STAGES.forEach((st, k) => {
    const inc = p.preg[k];
    const at = (i: number) => ({ v: n(p.f[i]! + inc), r: p.ranges?.[i] ? [p.ranges[i][0] + inc, p.ranges[i][1] + inc] as const : null });
    const a = at(i18), b = at(i30);
    const bands = a.v === b.v ? [{ min: 216, max: 599, ...a }] : [{ min: 216, max: 359, ...a }, { min: 360, max: 599, ...b }];
    for (const band of bands) put(name, type, 'FEMALE', st, band.min, band.max, null, { value: band.v, min: band.r?.[0] ?? null, max: band.r?.[1] ?? null, from: `${id} ${st} +${inc}` });
  });
}

/** Unisex cells (point or [min,max]); pregnancy printed absolute. */
function cells(id: string, name: string, type: string, cs: Cell[], preg: Cell, rows: Rows, aiCells: number[] = []) {
  if (cs.length !== rows.length) throw new Error(`${id} ${name}: row count`);
  const shape = (c: Exclude<Cell, null>) => Array.isArray(c)
    ? { value: c[0] != null && c[1] != null ? (c[0] + c[1]) / 2 : (c[1] ?? c[0])!, min: c[0], max: c[1] }
    : { value: c, min: null, max: null };
  rows.forEach(([min, max], i) => {
    const c = cs[i];
    if (c == null) return;
    for (const sex of ['MALE', 'FEMALE']) put(name, aiCells.includes(i) ? 'AI' : type, sex, 'NONE', min, max, null, { ...shape(c), from: `${id} row ${i}` });
  });
  if (preg == null) return;
  for (const st of STAGES) put(name, type, 'FEMALE', st, 216, 599, null, { ...shape(preg), from: `${id} ${st}` });
}

// 附表 3-1 energy
{
  const T = TABLE_3_1_ENERGY;
  YEARLY_ROWS.forEach(([min, max], i) => {
    for (const sex of ['MALE', 'FEMALE'] as const) {
      const col = (pal: 'I' | 'II' | 'III') => (sex === 'MALE' ? T[pal].m[i] : T[pal].f[i]);
      const split = col('I') != null || col('III') != null;
      for (const [pal, act] of [['I', 'SEDENTARY'], ['II', 'MODERATE'], ['III', 'ACTIVE']] as const) {
        const v = col(pal);
        if (v != null) put('Energy', 'EER', sex, 'NONE', min, max, split ? act : null, { value: v, min: null, max: null, from: `3-1 PAL ${pal} row ${i}` });
      }
    }
  });
  const i18 = containing(YEARLY_ROWS, 216), i30 = containing(YEARLY_ROWS, 360);
  for (const [pal, act] of [['I', 'SEDENTARY'], ['II', 'MODERATE'], ['III', 'ACTIVE']] as const) {
    STAGES.forEach((st, k) => {
      const a = T[pal].f[i18]! + T.preg[k], b = T[pal].f[i30]! + T.preg[k];
      const bands = a === b ? [[216, 599, a]] : [[216, 359, a], [360, 599, b]];
      for (const [min, max, v] of bands) put('Energy', 'EER', 'FEMALE', st, min, max, act, { value: v, min: null, max: null, from: `3-1 PAL ${pal} ${st}` });
    });
  }
}
// 附表 3-2 protein
point('3-2', 'Protein', 'EAR', TABLE_3_2_PROTEIN.ear, YEARLY_ROWS);
point('3-2', 'Protein', 'RDA', TABLE_3_2_PROTEIN.rni, YEARLY_ROWS);
cells('3-2', 'Protein', 'AMDR', TABLE_3_2_PROTEIN.amdr, TABLE_3_2_PROTEIN.amdrPreg, YEARLY_ROWS);
// 附表 3-3 fats
for (const [key, t] of Object.entries(TABLE_3_3_FAT)) cells('3-3', C[key], t.valueType, t.cells, t.preg, FAT_ROWS, t.aiCells);
// 附表 3-4 carbohydrate
const CARB = TABLE_3_4_CARBOHYDRATE;
point('3-4', 'Carbohydrates', 'EAR', CARB.carbEar, BAND_ROWS);
cells('3-4', 'Carbohydrates', 'AMDR', CARB.carbAmdr.cells, CARB.carbAmdr.preg, BAND_ROWS);
point('3-4', 'Dietary Fiber', 'AI', CARB.fiberAi, BAND_ROWS);
cells('3-4', 'Added Sugars', 'AMDR', CARB.addedSugarsAmdr.cells, CARB.addedSugarsAmdr.preg, BAND_ROWS);
// 附表 3-6 / 3-7 / 3-8
for (const [key, p] of Object.entries(TABLE_3_6_EAR)) point('3-6', C[key], 'EAR', p, BAND_ROWS);
for (const [key, p] of Object.entries(TABLE_3_7_MINERALS)) point('3-7', C[key], p.valueType, p, BAND_ROWS);
for (const [key, p] of Object.entries(TABLE_3_8_VITAMINS)) point('3-8', C[key], p.valueType, p, BAND_ROWS);
// 附表 3-9 PI-NCD
for (const [key, t] of Object.entries(TABLE_3_9_PINCD)) cells('3-9', C[key], 'CDRR', t.cells, t.preg, BAND_ROWS);
// 附表 3-10 UL
for (const [key, u] of Object.entries(TABLE_3_10_UL)) cells('3-10', C[key], 'UL', u.cells, u.preg[0], BAND_ROWS);
// 附表 3-11 water
point('3-11', 'Water', 'AI', TABLE_3_11_WATER_TOTAL, WATER_ROWS);

async function main() {
  const rows = await sql<{ name: string; vt: string; sex: string; ls: string; amin: number; amax: number | null; act: string | null; diet: string | null; value: string; vmin: string | null; vmax: string | null }[]>`
    SELECT c.name, r.value_type vt, r.sex, r.life_stage ls, r.age_min_months amin, r.age_max_months amax,
           r.activity_level act, r.dietary_context diet, r.value, r.value_min vmin, r.value_max vmax
    FROM reference_daily_values r JOIN compounds c ON c.id = r.compound_id
    WHERE r.source_region = 'CHINA'`;
  const num = (x: string | null) => (x == null ? null : Number(x));
  let fails = 0;
  const seen = new Set<string>();
  for (const r of rows) {
    const k = [r.name, r.vt, r.sex, r.ls, r.amin, r.amax, r.act ?? '-'].join('|');
    seen.add(k);
    const e = expected.get(k);
    if (!e || r.diet) { fails++; console.log(`FAIL extra ${k}: ${r.value} in db, not printed`); continue; }
    if (num(r.value) !== e.value || num(r.vmin) !== e.min || num(r.vmax) !== e.max) {
      fails++; console.log(`FAIL ${k}: printed ${e.value} [${e.min},${e.max}], db ${r.value} [${r.vmin},${r.vmax}] (${e.from})`);
    }
  }
  for (const [k, e] of expected) if (!seen.has(k)) { fails++; console.log(`FAIL missing ${k}: printed ${e.value} (${e.from})`); }
  console.log(`CHINA: ${expected.size} printed cells, ${rows.length} db rows, ${fails} failures`);
  if (fails) process.exitCode = 1;
}
main().finally(() => sql.end());
