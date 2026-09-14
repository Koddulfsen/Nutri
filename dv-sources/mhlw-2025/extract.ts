/**
 * MHLW "Dietary Reference Intakes for Japanese (2020)" (English edition) -> values.json.
 *
 * Age rows are PARSED from source/mhlw-dri-2020-en.pages-10-44.txt (pdftotext -layout of
 * mhlw-dri-2020-en.pdf, pages 10-44): each cell is assigned to its column by horizontal
 * position, using an age row where every column is filled as the anchor. Two tokens landing
 * in one column, or a row with no anchor, is a hard error.
 *
 * Pregnancy / lactation rows are TRANSCRIBED by hand (their layout wraps unpredictably),
 * each tagged with its page. Printed "+x" values are increments over same-age non-pregnant
 * women and are stored as totals for 18-29 y and 30-49 y.
 *
 * Mapping decisions:
 *   - DG (Tentative Dietary Goal): a range -> AMDR [min, max]; "≥ x" -> AMDR [x, null];
 *     "≤ x" / "< x" -> CDRR [null, x].
 *   - Sodium DG is printed as salt equivalent (g) only; stored as sodium mg = g × 1000 / 2.54,
 *     the factor the table itself uses (600 mg ↔ 1.5 g).
 *   - Iron, women 10-64 y: printed for menstruating and not menstruating. The menstruating value
 *     is stored (the other is in the note); pregnancy increments apply to the not-menstruating
 *     value, as printed.
 *   - Niacin UL is printed as nicotinamide, with nicotinic acid in parentheses: both stored.
 *   - Vitamin A AI/UL exclude provitamin A carotenoids: UL stored as Retinol.
 *   - Magnesium UL: "No UL for dietary intake from normal food"; 350 mg/d (adults) applies to
 *     sources other than normal food only -> not in the table grid; stored supplemental-only.
 *   - n-3 / n-6 fatty acid AI are total n-3 / n-6 (Omega-3 / Omega-6).
 *
 * Run: npx tsx dv-sources/mhlw-2025/extract.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage, Activity } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

const DIR = path.join(process.cwd(), 'dv-sources', 'mhlw-2025');
const TEXT = readFileSync(path.join(DIR, 'source', 'mhlw-dri-2020-en.pages-10-44.txt'), 'utf8');
const PAGES = new Map<number, string[]>();
for (const chunk of TEXT.split('\f').filter((c) => c.includes('=== PAGE'))) {
  const n = Number(chunk.match(/=== PAGE (\d+) ===/)![1]);
  PAGES.set(n, chunk.split('\n'));
}

const AGES: Array<[RegExp, [number, number | null], string]> = [
  [/^0-5 months/, [0, 5], '0-5 months'], [/^6-8 months/, [6, 8], '6-8 months'], [/^9-11 months/, [9, 11], '9-11 months'],
  [/^6-11 months/, [6, 11], '6-11 months'], [/^1-2 years/, [12, 35], '1-2 years'], [/^3-5 years/, [36, 71], '3-5 years'],
  [/^6-7 years/, [72, 95], '6-7 years'], [/^8-9 years/, [96, 119], '8-9 years'], [/^10-11 years/, [120, 143], '10-11 years'],
  [/^12-14 years/, [144, 179], '12-14 years'], [/^15-17 years/, [180, 215], '15-17 years'], [/^18-29 years/, [216, 359], '18-29 years'],
  [/^30-49 years/, [360, 599], '30-49 years'], [/^50-64 years/, [600, 779], '50-64 years'], [/^65-74 years/, [780, 899], '65-74 years'],
  [/^75\+ years/, [900, null], '75+ years'],
];

// A cell: number, range, bound, salt pair, niacin pair, increment, or dash.
const CELL = /\+?\d[\d,]*(?:\.\d+)?\s?[（(]\d+(?:\.\d+)?[）)]|\(<\d+(?:\.\d+)?\)|[≥≤]\s?\d[\d,]*(?:\.\d+)?|\d+-\d+|\+?\d[\d,]*(?:\.\d+)?|[―－-]\d?/g;

interface Tok { text: string; center: number }
function tokens(line: string, labelEnd: number): Tok[] {
  const body = line.slice(labelEnd);
  return [...body.matchAll(CELL)].map((m) => ({ text: m[0], center: labelEnd + m.index! + m[0].length / 2 }));
}

type Parsed =
  | { kind: 'none' }
  | { kind: 'value'; v: number }
  | { kind: 'range'; min: number; max: number }
  | { kind: 'floor'; v: number }
  | { kind: 'ceiling'; v: number }
  | { kind: 'pair'; v: number; paren: number };
function parse(t: string): Parsed {
  const s = t.replace(/,/g, '');
  if (/^[―－-]\d?$/.test(s)) return { kind: 'none' };
  let m;
  if ((m = s.match(/^(\d+(?:\.\d+)?)\s?[（(](\d+(?:\.\d+)?)[）)]$/))) return { kind: 'pair', v: Number(m[1]), paren: Number(m[2]) };
  if ((m = s.match(/^\(<(\d+(?:\.\d+)?)\)$/))) return { kind: 'ceiling', v: Number(m[1]) };
  if ((m = s.match(/^≥\s?(\d+(?:\.\d+)?)$/))) return { kind: 'floor', v: Number(m[1]) };
  if ((m = s.match(/^≤\s?(\d+(?:\.\d+)?)$/))) return { kind: 'ceiling', v: Number(m[1]) };
  if ((m = s.match(/^(\d+)-(\d+)$/))) return { kind: 'range', min: Number(m[1]), max: Number(m[2]) };
  if ((m = s.match(/^(\d+(?:\.\d+)?)$/))) return { kind: 'value', v: Number(m[1]) };
  throw new Error(`Unparseable cell "${t}"`);
}

/** Parse a page's age rows into cells per column. Columns are anchored on a fully filled age row. */
function grid(page: number, ncols: number): Array<{ age: [number, number | null]; label: string; cells: (string | null)[] }> {
  const lines = PAGES.get(page)!;
  const rows: Array<{ age: [number, number | null]; label: string; toks: Tok[] }> = [];
  for (const line of lines) {
    const trimmed = line.trimStart();
    const hit = AGES.find(([re]) => re.test(trimmed));
    if (!hit) continue;
    const indent = line.length - trimmed.length;
    // Label ends after "months"/"years" plus an optional footnote digit(s).
    const labelMatch = trimmed.match(/^\S+\s+(?:months|years)(?:\s?\d(?!\d*[.,]))?/)!;
    rows.push({ age: hit[1], label: hit[2], toks: tokens(line, indent + labelMatch[0].length) });
  }
  const anchor = rows.find((r) => r.toks.length === ncols);
  if (!anchor) throw new Error(`p${page}: no age row with all ${ncols} columns filled`);
  const centers = anchor.toks.map((t) => t.center);
  return rows.map((r) => {
    if (r.toks.length > ncols) throw new Error(`p${page} ${r.label}: ${r.toks.length} cells for ${ncols} columns`);
    const cells: (string | null)[] = Array(ncols).fill(null);
    for (const t of r.toks) {
      let best = 0;
      for (let i = 1; i < ncols; i++) if (Math.abs(centers[i] - t.center) < Math.abs(centers[best] - t.center)) best = i;
      if (cells[best] != null) throw new Error(`p${page} ${r.label}: two cells in column ${best} ("${cells[best]}", "${t.text}")`);
      cells[best] = t.text;
    }
    return { age: r.age, label: r.label, cells };
  });
}

const out: SourceValue[] = [];
function push(p: {
  compound: string; type: DvValueType; sex: Sex; stage?: LifeStage; age: [number, number | null]; value: number;
  min?: number | null; max?: number | null; unit: string; pct?: boolean; activity?: Activity | null;
  supplementalOnly?: boolean; note?: string | null; from: string;
}) {
  out.push({
    compound: p.compound, valueType: p.type, sex: p.sex, lifeStage: p.stage ?? 'NONE',
    ageMinMonths: p.age[0], ageMaxMonths: p.age[1], activityLevel: p.activity ?? null, dietaryContext: null,
    value: Number(p.value.toFixed(4)), valueMin: p.min ?? null, valueMax: p.max ?? null, unit: p.unit,
    isPercentOfEnergy: p.pct ?? false, isProvisional: false, supplementalOnly: p.supplementalOnly ?? false,
    note: p.note ?? null, from: p.from,
  });
}

/**
 * A column: which sex, what it stores, and how.
 * as: 'value' plain | 'dg' DG cell (range/floor/ceiling) | 'salt' sodium from salt g | 'niacinUl' nicotinamide + nicotinic acid.
 */
interface Col { sex: Sex; type: DvValueType; compound: string; unit: string; as?: 'value' | 'dg' | 'salt' | 'niacinUl'; pct?: boolean; activity?: Activity | null; note?: string; skip?: boolean }

const SALT_TO_NA = 1000 / 2.54;

function emit(page: number, title: string, col: Col, age: [number, number | null], label: string, cell: string | null, stage: LifeStage = 'NONE') {
  if (col.skip || cell == null) return;
  const p = parse(cell);
  if (p.kind === 'none') return;
  const base = { compound: col.compound, sex: col.sex, stage, age, unit: col.unit, pct: col.pct, activity: col.activity ?? null, note: col.note ?? null, from: `p${page} ${title}, ${col.sex === 'MALE' ? 'Males' : 'Females'} ${col.type}, ${label}` };
  if (col.as === 'salt') {
    if (p.kind === 'pair') return push({ ...base, type: col.type, value: Math.round(p.v * 10000) / 10000, note: `Printed ${p.v} mg (salt ${p.paren} g).` });
    if (p.kind === 'value') return push({ ...base, type: col.type, value: p.v });
    if (p.kind === 'ceiling') {
      const na = Number((p.v * SALT_TO_NA).toFixed(4));
      return push({ ...base, compound: 'Sodium', type: 'CDRR', value: na, max: na, unit: 'mg', note: `DG printed as salt equivalent < ${p.v} g/day; sodium = salt × 1000 / 2.54.` });
    }
  }
  if (col.as === 'niacinUl' && p.kind === 'pair') {
    push({ ...base, compound: 'Nicotinamide', type: 'UL', value: p.v, unit: 'mg', note: 'Printed as nicotinamide.' });
    return push({ ...base, compound: 'Nicotinic Acid', type: 'UL', value: p.paren, unit: 'mg', note: 'Printed in parentheses as nicotinic acid.' });
  }
  if (col.as === 'dg') {
    if (p.kind === 'range') return push({ ...base, type: 'AMDR', value: (p.min + p.max) / 2, min: p.min, max: p.max });
    if (p.kind === 'floor') return push({ ...base, type: 'AMDR', value: p.v, min: p.v });
    if (p.kind === 'ceiling') return push({ ...base, type: 'CDRR', value: p.v, max: p.v });
  }
  if (p.kind === 'value') return push({ ...base, type: col.type, value: p.v });
  throw new Error(`p${page} ${label} ${col.compound} ${col.type}: unexpected cell "${cell}"`);
}

function table(page: number, title: string, cols: Col[]) {
  for (const row of grid(page, cols.length)) cols.forEach((c, i) => emit(page, title, c, row.age, row.label, row.cells[i]));
}

/**
 * Hand-transcribed pregnancy / lactation cells (females only). `cells` align to the page's
 * female columns; "+x" is an increment over women of the same age (18-29, 30-49), otherwise absolute.
 */
function preg(page: number, title: string, femaleCols: Col[], stage: LifeStage, label: string, cells: (string | null)[]) {
  if (cells.length !== femaleCols.length) throw new Error(`p${page} ${label}: ${cells.length} cells for ${femaleCols.length} female columns`);
  const baseRows = grid(page, 0 + (PAGES_COLS.get(page) ?? 0));
  femaleCols.forEach((col, i) => {
    const cell = cells[i];
    if (cell == null || col.skip) return;
    if (!cell.startsWith('+')) return emit(page, title, col, [216, 599], `${label} (printed absolute; applied to 18-49 y)`, cell, stage);
    const inc = Number(cell.slice(1));
    const bases = [[216, 359], [360, 599]].map(([min, max]) => {
      const r = baseRows.find((b) => b.age[0] === min)!;
      const idx = PAGES_FEMALE_OFFSET.get(page)! + (BASE_COL_OVERRIDE.get(`${page}:${i}`) ?? i);
      const base = parse(r.cells[idx] ?? '―');
      if (base.kind !== 'value') throw new Error(`p${page} ${label} ${col.compound}: no base at ${min} months`);
      return { min, max, total: Number((base.v + inc).toFixed(4)) };
    });
    const bands = bases[0].total === bases[1].total ? [{ ...bases[0], max: 599 }] : bases;
    for (const b of bands) {
      push({
        compound: col.compound, type: col.type, sex: 'FEMALE', stage, age: [b.min, b.max], value: b.total, unit: col.unit,
        pct: col.pct, activity: col.activity ?? null,
        note: `${col.note ? col.note + ' ' : ''}Printed as +${inc} over same-age non-pregnant women; stored as total.`,
        from: `p${page} ${title}, Females ${col.type}, ${label} +${inc}`,
      });
    }
  });
}
const PAGES_COLS = new Map<number, number>();
const PAGES_FEMALE_OFFSET = new Map<number, number>();
/** page:femaleColIndex -> base column (female-relative) when the increment builds on a different column. */
const BASE_COL_OVERRIDE = new Map<string, number>();

function both(page: number, title: string, perSex: Array<Omit<Col, 'sex'>>, pregRows: Array<[LifeStage, string, (string | null)[]]> = []) {
  const cols: Col[] = [...perSex.map((c) => ({ ...c, sex: 'MALE' as Sex })), ...perSex.map((c) => ({ ...c, sex: 'FEMALE' as Sex }))];
  PAGES_COLS.set(page, cols.length);
  PAGES_FEMALE_OFFSET.set(page, perSex.length);
  table(page, title, cols);
  for (const [stage, label, cells] of pregRows) preg(page, title, cols.slice(perSex.length), stage, label, cells);
}

const V = (compound: string, unit: string, extra: Partial<Col> = {}) => ({
  EAR: { type: 'EAR' as DvValueType, compound, unit, ...extra },
  RDA: { type: 'RDA' as DvValueType, compound, unit, ...extra },
  AI: { type: 'AI' as DvValueType, compound, unit, ...extra },
  UL: { type: 'UL' as DvValueType, compound, unit, ...extra },
});

// p10 Estimated energy requirement (kcal/day), PAL I / II / III.
{
  const pal = (p: 'I' | 'II' | 'III', activity: Activity) => ({ type: 'EER' as DvValueType, compound: 'Energy', unit: 'kcal', activity, note: `PAL ${p}.` });
  const per = [pal('I', 'SEDENTARY'), pal('II', 'MODERATE'), pal('III', 'ACTIVE')];
  const cols: Col[] = [...per.map((c) => ({ ...c, sex: 'MALE' as Sex })), ...per.map((c) => ({ ...c, sex: 'FEMALE' as Sex }))];
  // Ages 0-5 y print PAL II only: applies at every activity level.
  for (const row of grid(10, 6)) {
    const single = [0, 2, 3, 5].every((i) => row.cells[i] == null || parse(row.cells[i]!).kind === 'none');
    cols.forEach((c, i) => emit(10, 'Estimated energy requirement', single ? { ...c, activity: null, note: 'Printed at PAL II only; applies at every activity level.' } : c, row.age, row.label, row.cells[i]));
  }
  PAGES_COLS.set(10, 6); PAGES_FEMALE_OFFSET.set(10, 3);
  const female = cols.slice(3);
  preg(10, 'Estimated energy requirement', female, 'PREGNANT_T1', 'Pregnant, early-stage', ['+50', '+50', '+50']);
  preg(10, 'Estimated energy requirement', female, 'PREGNANT_T2', 'Pregnant, mid-stage', ['+250', '+250', '+250']);
  preg(10, 'Estimated energy requirement', female, 'PREGNANT_T3', 'Pregnant, late-stage', ['+450', '+450', '+450']);
  preg(10, 'Estimated energy requirement', female, 'LACTATING', 'Lactating', ['+350', '+350', '+350']);
}

// p11 Protein (g/day; DG % energy). Pregnancy DG per footnotes 3/4: 13-20 early/mid, 15-20 late/lactating.
{
  const p = V('Protein', 'g');
  both(11, 'Protein', [p.EAR, p.RDA, p.AI, { type: 'AMDR', compound: 'Protein', unit: '%', pct: true, as: 'dg' }], [
    ['PREGNANT_T1', 'Pregnant, early-stage', ['+0', '+0', '―', '13-20']],
    ['PREGNANT_T2', 'Pregnant, mid-stage', ['+5', '+5', '―', '13-20']],
    ['PREGNANT_T3', 'Pregnant, late-stage', ['+20', '+25', '―', '15-20']],
    ['LACTATING', 'Lactating', ['+15', '+20', '―', '15-20']],
  ]);
}
// p12 Dietary fats (% energy)
both(12, 'Dietary fats', [{ type: 'AI', compound: 'Total Fat', unit: '%', pct: true }, { type: 'AMDR', compound: 'Total Fat', unit: '%', pct: true, as: 'dg' }], [
  ['PREGNANT', 'Pregnant', ['―', '20-30']], ['LACTATING', 'Lactating', ['―', '20-30']],
]);
// p13 Saturated fatty acid DG (% energy)
both(13, 'Saturated fatty acid', [{ type: 'CDRR', compound: 'Saturated Fat', unit: '%', pct: true, as: 'dg' }], [
  ['PREGNANT', 'Pregnant', ['≤7']], ['LACTATING', 'Lactating', ['≤7']],
]);
// p14 n-6, p15 n-3 fatty acids AI (g/day): total n-6 / n-3.
both(14, 'n-6 fatty acid', [{ type: 'AI', compound: 'Omega-6', unit: 'g', note: 'Total n-6 fatty acids.' }], [
  ['PREGNANT', 'Pregnant', ['9']], ['LACTATING', 'Lactating', ['10']],
]);
both(15, 'n-3 fatty acid', [{ type: 'AI', compound: 'Omega-3', unit: 'g', note: 'Total n-3 fatty acids.' }], [
  ['PREGNANT', 'Pregnant', ['1.6']], ['LACTATING', 'Lactating', ['1.8']],
]);
// p16 Carbohydrates DG (% energy, includes alcohol)
both(16, 'Carbohydrates', [{ type: 'AMDR', compound: 'Carbohydrates', unit: '%', pct: true, as: 'dg', note: 'Includes alcohol.' }], [
  ['PREGNANT', 'Pregnant', ['50-65']], ['LACTATING', 'Lactating', ['50-65']],
]);
// p17 Dietary fiber DG (g/day)
both(17, 'Dietary fiber', [{ type: 'AMDR', compound: 'Dietary Fiber', unit: 'g', as: 'dg' }], [
  ['PREGNANT', 'Pregnant', ['≥ 18']], ['LACTATING', 'Lactating', ['≥ 18']],
]);
// p18 is the energy-providing nutrient balance: a restatement of p11-p16, not stored.
// p19 Vitamin A (µg RAE). AI and UL exclude provitamin A carotenoids.
{
  const a = V('Vitamin A (RAE)', 'µg RAE');
  both(19, 'Vitamin A', [a.EAR, a.RDA, { ...a.AI, note: 'Excludes provitamin A carotenoids.' }, { type: 'UL', compound: 'Retinol', unit: 'µg', note: 'Excludes provitamin A carotenoids.' }], [
    ['PREGNANT_T1', 'Pregnant, early-stage', ['+0', '+0', '―', '―']],
    ['PREGNANT_T2', 'Pregnant, mid-stage', ['+0', '+0', '―', '―']],
    ['PREGNANT_T3', 'Pregnant, late-stage', ['+60', '+80', '―', '―']],
    ['LACTATING', 'Lactating', ['+300', '+450', '―', '―']],
  ]);
}
// p20 Vitamin D
{ const d = V('Vitamin D (Total)', 'µg'); both(20, 'Vitamin D', [d.AI, d.UL], [['PREGNANT', 'Pregnant', ['8.5', '―']], ['LACTATING', 'Lactating', ['8.5', '―']]]); }
// p21 Vitamin E (α-tocopherol only)
{ const e = V('Vitamin E (Total)', 'mg', { note: 'As α-tocopherol only.' }); both(21, 'Vitamin E', [e.AI, e.UL], [['PREGNANT', 'Pregnant', ['6.5', '―']], ['LACTATING', 'Lactating', ['7.0', '―']]]); }
// p22 Vitamin K
{ const k = V('Vitamin K (Total)', 'µg'); both(22, 'Vitamin K', [k.AI], [['PREGNANT', 'Pregnant', ['150']], ['LACTATING', 'Lactating', ['150']]]); }
// p23 Vitamin B1 (as thiamine chloride hydrochloride)
{ const b = V('Thiamin (B1)', 'mg', { note: 'As thiamine chloride hydrochloride.' }); both(23, 'Vitamin B1', [b.EAR, b.RDA, b.AI], [['PREGNANT', 'Pregnant', ['+0.2', '+0.2', '―']], ['LACTATING', 'Lactating', ['+0.2', '+0.2', '―']]]); }
// p24 Vitamin B2
{ const b = V('Riboflavin (B2)', 'mg'); both(24, 'Vitamin B2', [b.EAR, b.RDA, b.AI], [['PREGNANT', 'Pregnant', ['+0.2', '+0.3', '―']], ['LACTATING', 'Lactating', ['+0.5', '+0.6', '―']]]); }
// p25 Niacin (mg NE); infants 0-5 months in mg/day (footnote 4). UL as nicotinamide (nicotinic acid).
{
  const n = V('Niacin (B3)', 'mg NE');
  both(25, 'Niacin', [n.EAR, n.RDA, n.AI, { type: 'UL', compound: 'Nicotinamide', unit: 'mg', as: 'niacinUl' }], [
    ['PREGNANT', 'Pregnant', ['+0', '+0', '―', '―']], ['LACTATING', 'Lactating', ['+3', '+3', '―', '―']],
  ]);
}
// p26 Vitamin B6 (UL as pyridoxine)
{ const b = V('Vitamin B6', 'mg'); both(26, 'Vitamin B6', [b.EAR, b.RDA, b.AI, { ...b.UL, note: 'As pyridoxine.' }], [['PREGNANT', 'Pregnant', ['+0.2', '+0.2', '―', '―']], ['LACTATING', 'Lactating', ['+0.3', '+0.3', '―', '―']]]); }
// p27 Vitamin B12
{ const b = V('Vitamin B12 (Total)', 'µg'); both(27, 'Vitamin B12', [b.EAR, b.RDA, b.AI], [['PREGNANT', 'Pregnant', ['+0.3', '+0.4', '―']], ['LACTATING', 'Lactating', ['+0.7', '+0.8', '―']]]); }
// p28 Folic acid (µg, as pteroylmonoglutamic acid); UL only for supplements / enriched food.
{
  const f = V('Folate (Total)', 'µg');
  both(28, 'Folic acid', [f.EAR, f.RDA, f.AI, { type: 'UL', compound: 'Folic Acid (Synthetic)', unit: 'µg', supplementalOnly: true, note: 'Pteroylmonoglutamic acid in supplements and vitamin-enriched food.' } as Omit<Col, 'sex'>], [
    ['PREGNANT', 'Pregnant (mid- or late-stage)', ['+200', '+240', '―', '―']], ['LACTATING', 'Lactating', ['+80', '+100', '―', '―']],
  ]);
}
// p29 Pantothenic acid, p30 Biotin
{ const p = V('Pantothenic Acid (B5)', 'mg'); both(29, 'Pantothenic acid', [p.AI], [['PREGNANT', 'Pregnant', ['5']], ['LACTATING', 'Lactating', ['6']]]); }
{ const b = V('Biotin (B7)', 'µg'); both(30, 'Biotin', [b.AI], [['PREGNANT', 'Pregnant', ['50']], ['LACTATING', 'Lactating', ['50']]]); }
// p31 Vitamin C
{ const c = V('Vitamin C (Total)', 'mg'); both(31, 'Vitamin C', [c.EAR, c.RDA, c.AI], [['PREGNANT', 'Pregnant', ['+10', '+10', '―']], ['LACTATING', 'Lactating', ['+40', '+45', '―']]]); }
// p32 Sodium (mg; salt g in parentheses). Footnote: 6.0 g/day salt to prevent progression of hypertension or CKD.
{
  const na = V('Sodium', 'mg');
  both(32, 'Sodium', [{ ...na.EAR, as: 'salt' }, { ...na.AI, as: 'salt' }, { type: 'CDRR', compound: 'Sodium', unit: 'mg', as: 'salt' }], [
    ['PREGNANT', 'Pregnant', ['600 (1.5)', '―', '(<6.5)']], ['LACTATING', 'Lactating', ['600 (1.5)', '―', '(<6.5)']],
  ]);
}
// p33 Potassium
{ const k = V('Potassium', 'mg'); both(33, 'Potassium', [k.AI, { type: 'AMDR', compound: 'Potassium', unit: 'mg', as: 'dg' }], [['PREGNANT', 'Pregnant', ['2,000', '≥2,600']], ['LACTATING', 'Lactating', ['2,200', '≥2,600']]]); }
// p34 Calcium
{ const c = V('Calcium', 'mg'); both(34, 'Calcium', [c.EAR, c.RDA, c.AI, c.UL], [['PREGNANT', 'Pregnant', ['+0', '+0', '―', '―']], ['LACTATING', 'Lactating', ['+0', '+0', '―', '―']]]); }
// p35 Magnesium. UL column is empty in the grid; footnote 1 gives 350 mg/d (adults) for non-food sources.
{
  const m = V('Magnesium', 'mg');
  both(35, 'Magnesium', [m.EAR, m.RDA, m.AI, { ...m.UL, skip: true }], [['PREGNANT', 'Pregnant', ['+30', '+40', '―', '―']], ['LACTATING', 'Lactating', ['+0', '+0', '―', '―']]]);
  for (const sex of ['MALE', 'FEMALE'] as Sex[]) {
    push({ compound: 'Magnesium', type: 'UL', sex, age: [216, null], value: 350, unit: 'mg', supplementalOnly: true, note: 'Sources other than normal food only; no UL for normal food (footnote 1).', from: 'p35 Magnesium, footnote 1' });
  }
}
// p36 Phosphorus
{ const p = V('Phosphorus', 'mg'); both(36, 'Phosphorus', [p.AI, p.UL], [['PREGNANT', 'Pregnant', ['800', '―']], ['LACTATING', 'Lactating', ['800', '―']]]); }
// p37 Iron: males EAR RDA AI UL | females not-menstruating EAR RDA, menstruating EAR RDA, AI, UL.
{
  const title = 'Iron';
  const rows = grid(37, 10);
  const m = V('Iron (Total)', 'mg');
  for (const r of rows) {
    const c = r.cells;
    emit(37, title, { ...m.EAR, sex: 'MALE' }, r.age, r.label, c[0]);
    emit(37, title, { ...m.RDA, sex: 'MALE' }, r.age, r.label, c[1]);
    emit(37, title, { ...m.AI, sex: 'MALE' }, r.age, r.label, c[2]);
    emit(37, title, { ...m.UL, sex: 'MALE' }, r.age, r.label, c[3]);
    const menstruating = c[6] != null && parse(c[6]).kind === 'value';
    for (const [type, notIdx, menIdx] of [['EAR', 4, 6], ['RDA', 5, 7]] as const) {
      if (menstruating) {
        const other = parse(c[notIdx]!);
        emit(37, title, { type, compound: 'Iron (Total)', unit: 'mg', sex: 'FEMALE', note: `Menstruating. Not menstruating: ${other.kind === 'value' ? other.v : '—'} mg.` }, r.age, `${r.label} (menstruating)`, c[menIdx]);
      } else {
        emit(37, title, { type, compound: 'Iron (Total)', unit: 'mg', sex: 'FEMALE' }, r.age, r.label, c[notIdx]);
      }
    }
    emit(37, title, { ...m.AI, sex: 'FEMALE' }, r.age, r.label, c[8]);
    emit(37, title, { ...m.UL, sex: 'FEMALE' }, r.age, r.label, c[9]);
  }
  // Pregnancy increments build on the NOT-menstruating EAR/RDA (female-relative columns 0 and 1).
  PAGES_COLS.set(37, 10); PAGES_FEMALE_OFFSET.set(37, 4);
  const female: Col[] = [{ ...m.EAR, sex: 'FEMALE', note: 'Over the not-menstruating value.' }, { ...m.RDA, sex: 'FEMALE', note: 'Over the not-menstruating value.' }];
  preg(37, title, female, 'PREGNANT_T1', 'Pregnant, early stage', ['+2.0', '+2.5']);
  preg(37, title, female, 'PREGNANT_T2', 'Pregnant, mid to late stage', ['+8.0', '+9.5']);
  preg(37, title, female, 'PREGNANT_T3', 'Pregnant, mid to late stage', ['+8.0', '+9.5']);
  preg(37, title, female, 'LACTATING', 'Lactating', ['+2.0', '+2.5']);
}
// p38 Zinc, p39 Copper
{ const z = V('Zinc', 'mg'); both(38, 'Zinc', [z.EAR, z.RDA, z.AI, z.UL], [['PREGNANT', 'Pregnant', ['+1', '+2', '―', '―']], ['LACTATING', 'Lactating', ['+3', '+4', '―', '―']]]); }
{ const c = V('Copper', 'mg'); both(39, 'Copper', [c.EAR, c.RDA, c.AI, c.UL], [['PREGNANT', 'Pregnant', ['+0.1', '+0.1', '―', '―']], ['LACTATING', 'Lactating', ['+0.5', '+0.6', '―', '―']]]); }
// p40 Manganese
{ const m = V('Manganese', 'mg'); both(40, 'Manganese', [m.AI, m.UL], [['PREGNANT', 'Pregnant', ['3.5', '―']], ['LACTATING', 'Lactating', ['3.5', '―']]]); }
// p41 Iodine. Footnote 1: UL for pregnant or lactating women is 2,000 µg/day.
{
  const i = V('Iodine', 'µg');
  both(41, 'Iodine', [i.EAR, i.RDA, i.AI, i.UL], [
    ['PREGNANT', 'Pregnant', ['+75', '+110', '―', '2,000']], ['LACTATING', 'Lactating', ['+100', '+140', '―', '2,000']],
  ]);
}
// p42 Selenium, p43 Chromium, p44 Molybdenum
{ const s = V('Selenium', 'µg'); both(42, 'Selenium', [s.EAR, s.RDA, s.AI, s.UL], [['PREGNANT', 'Pregnant', ['+5', '+5', '―', '―']], ['LACTATING', 'Lactating', ['+15', '+20', '―', '―']]]); }
{ const c = V('Chromium', 'µg'); both(43, 'Chromium', [c.AI, c.UL], [['PREGNANT', 'Pregnant', ['10', '―']], ['LACTATING', 'Lactating', ['10', '―']]]); }
{ const m = V('Molybdenum', 'µg'); both(44, 'Molybdenum', [m.EAR, m.RDA, m.AI, m.UL], [['PREGNANT', 'Pregnant', ['+0', '+0', '―', '―']], ['LACTATING', 'Lactating', ['+3', '+3', '―', '―']]]); }

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths || (a.activityLevel ?? '').localeCompare(b.activityLevel ?? ''));
writeFileSync(path.join(DIR, 'values.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${out.length} values to dv-sources/mhlw-2025/values.json`);
