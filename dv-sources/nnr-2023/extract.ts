/**
 * Nordic Nutrition Recommendations 2023 (NNR2023) -> values.json.
 *
 * Transcribed cell by cell, 2026-09-14, from nord2023-003.pdf, Tables 8, 10, 12-21 and Boxes 2-8
 * (PDF pages 58-82). Numbers were read from the text layer; every cell whose superscript footnote
 * marker merges into the number in that layer ("3306", "0.34", "11504") was read from the rendered
 * page instead. RI/AI and provisional status follow each table's footnotes.
 *
 * Mapping decisions:
 *   - RI -> RDA; AR -> EAR; provisional AR (Tables 18, 20 and footnoted cells) -> EAR, isProvisional.
 *   - Infant cells footnoted "these values represent an AI" in RI tables -> AI.
 *   - Table 16 sodium: infants are estimated intakes from breast milk (footnotes 2-3) -> AI; from
 *     1 y the table's chronic disease risk reduction intake -> CDRR ceiling.
 *   - Recommended intake ranges of macronutrients (Boxes 2, 4, 5) -> AMDR; "<10 E%" -> [null, 10];
 *     "at least" -> [x, null].
 *   - Pregnancy/lactation rows print no ages; stored from 18 y with no upper bound.
 *   - Zinc and iron RI/AR assume ~600 mg/d phytate (footnote); stored without a dietary context.
 *
 * Not stored: protein AR/RI (per kg body weight), infant energy (per kg body weight), and
 * "if menstruating" alternatives other than as notes.
 *
 * Run: npx tsx dv-sources/nnr-2023/extract.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage, Activity } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
const out: SourceValue[] = [];
const r4 = (x: number) => Number(x.toFixed(4));
const PREG_AGE: Age = [216, null];

/** Row keys in printed order. Children rows apply to both sexes. */
const K = ['le6', 'm7_11', 'c1_3', 'c4_6', 'c7_10', 'f11_14', 'f15_17', 'f18_24', 'f25_50', 'f51_70', 'f70', 't1', 't2', 't3', 'lact', 'm11_14', 'm15_17', 'm18_24', 'm25_50', 'm51_70', 'm70'] as const;
type Key = typeof K[number];
const ROW: Record<Key, { label: string; sexes: Sex[]; stage: LifeStage; age: Age }> = {
  le6: { label: '≤6 mo', sexes: ['MALE', 'FEMALE'], stage: 'NONE', age: [0, 5] },
  m7_11: { label: '7-11 mo', sexes: ['MALE', 'FEMALE'], stage: 'NONE', age: [6, 11] },
  c1_3: { label: '1-3 y', sexes: ['MALE', 'FEMALE'], stage: 'NONE', age: [12, 47] },
  c4_6: { label: '4-6 y', sexes: ['MALE', 'FEMALE'], stage: 'NONE', age: [48, 83] },
  c7_10: { label: '7-10 y', sexes: ['MALE', 'FEMALE'], stage: 'NONE', age: [84, 131] },
  f11_14: { label: 'Females 11-14 y', sexes: ['FEMALE'], stage: 'NONE', age: [132, 179] },
  f15_17: { label: 'Females 15-17 y', sexes: ['FEMALE'], stage: 'NONE', age: [180, 215] },
  f18_24: { label: 'Females 18-24 y', sexes: ['FEMALE'], stage: 'NONE', age: [216, 299] },
  f25_50: { label: 'Females 25-50 y', sexes: ['FEMALE'], stage: 'NONE', age: [300, 611] },
  f51_70: { label: 'Females 51-70 y', sexes: ['FEMALE'], stage: 'NONE', age: [612, 851] },
  f70: { label: 'Females >70 y', sexes: ['FEMALE'], stage: 'NONE', age: [852, null] },
  t1: { label: 'Pregnant trimester 1', sexes: ['FEMALE'], stage: 'PREGNANT_T1', age: PREG_AGE },
  t2: { label: 'Pregnant trimester 2', sexes: ['FEMALE'], stage: 'PREGNANT_T2', age: PREG_AGE },
  t3: { label: 'Pregnant trimester 3', sexes: ['FEMALE'], stage: 'PREGNANT_T3', age: PREG_AGE },
  lact: { label: 'Lactating', sexes: ['FEMALE'], stage: 'LACTATING', age: PREG_AGE },
  m11_14: { label: 'Males 11-14 y', sexes: ['MALE'], stage: 'NONE', age: [132, 179] },
  m15_17: { label: 'Males 15-17 y', sexes: ['MALE'], stage: 'NONE', age: [180, 215] },
  m18_24: { label: 'Males 18-24 y', sexes: ['MALE'], stage: 'NONE', age: [216, 299] },
  m25_50: { label: 'Males 25-50 y', sexes: ['MALE'], stage: 'NONE', age: [300, 611] },
  m51_70: { label: 'Males 51-70 y', sexes: ['MALE'], stage: 'NONE', age: [612, 851] },
  m70: { label: 'Males >70 y', sexes: ['MALE'], stage: 'NONE', age: [852, null] },
};

type Cell = number | [number, number] | null;
function add(p: {
  compound: string; type: DvValueType; sexes: Sex[]; stage: LifeStage; age: Age; cell: Cell; unit: string; pct?: boolean;
  activity?: Activity | null; provisional?: boolean; supplementalOnly?: boolean; note?: string | null; from: string; min?: number | null; max?: number | null;
}) {
  if (p.cell == null) return;
  const [value, vmin, vmax] = Array.isArray(p.cell) ? [r4((p.cell[0] + p.cell[1]) / 2), p.cell[0], p.cell[1]] : [p.cell, p.min ?? null, p.max ?? null];
  for (const sex of p.sexes) {
    out.push({
      compound: p.compound, valueType: p.type, sex, lifeStage: p.stage, ageMinMonths: p.age[0], ageMaxMonths: p.age[1],
      activityLevel: p.activity ?? null, dietaryContext: null, value, valueMin: vmin, valueMax: vmax, unit: p.unit,
      isPercentOfEnergy: p.pct ?? false, isProvisional: p.provisional ?? false, supplementalOnly: p.supplementalOnly ?? false,
      note: p.note ?? null, from: p.from,
    });
  }
}

interface Col {
  compound: string; unit: string; type: DvValueType; table: string; note?: string;
  cells: Cell[];
  /** Row keys whose cell is an AI inside an RI table / provisional inside an AR table. */
  ai?: Key[]; provisional?: Key[] | 'all'; notes?: Partial<Record<Key, string>>;
  /** Row keys whose cell carries a different unit than the column. */
  units?: Partial<Record<Key, string>>;
}
function column(c: Col) {
  if (c.cells.length !== K.length) throw new Error(`${c.table} ${c.compound}: ${c.cells.length} cells for ${K.length} rows`);
  K.forEach((key, i) => {
    const row = ROW[key];
    add({
      compound: c.compound, type: c.ai?.includes(key) ? 'AI' : c.type, sexes: row.sexes, stage: row.stage, age: row.age,
      cell: c.cells[i], unit: c.units?.[key] ?? c.unit, provisional: c.provisional === 'all' || (c.provisional?.includes(key) ?? false),
      note: [c.note, c.notes?.[key]].filter(Boolean).join(' ') || null, from: `${c.table}, ${c.compound}, ${row.label}`,
    });
  });
}
// Order: le6, m7_11, c1_3, c4_6, c7_10, f11_14, f15_17, f18_24, f25_50, f51_70, f70, t1, t2, t3, lact, m11_14, m15_17, m18_24, m25_50, m51_70, m70
const cells = (...v: Cell[]) => v;
const _ = null;

// ───────────── Table 12: RI for vitamins ─────────────
{
  const t = 'Table 12 RI vitamins';
  column({ compound: 'Vitamin A (RAE)', unit: 'µg RE', type: 'RDA', table: t, note: 'As retinol equivalents, not RAE.', cells: cells(_, 250, 300, 350, 450, 650, 650, 700, 700, 700, 650, 750, 750, 750, 1400, 700, 750, 800, 800, 800, 750) });
  column({ compound: 'Vitamin D (Total)', unit: 'µg', type: 'RDA', table: t, cells: cells(_, 10, 10, 10, 10, 10, 10, 10, 10, 10, 20, 10, 10, 10, 10, 10, 10, 10, 10, 10, 20),
    notes: { f70: 'Printed 20 for age 75 and older (footnote 8).', m70: 'Printed 20 for age 75 and older (footnote 8).' } });
  column({ compound: 'Thiamin (B1)', unit: 'mg/MJ', type: 'RDA', table: t, note: 'Per MJ of energy.', cells: cells(_, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1) });
  column({ compound: 'Riboflavin (B2)', unit: 'mg', type: 'RDA', table: t, ai: ['le6', 'm7_11'], cells: cells(0.3, 0.4, 0.6, 0.7, 1.0, 1.4, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.7, 1.8, 2.0, 1.3, 1.6, 1.6, 1.6, 1.6, 1.6) });
  column({ compound: 'Niacin (B3)', unit: 'mg NE/MJ', type: 'RDA', table: t, note: 'Per MJ of energy.', cells: cells(_, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6) });
  column({ compound: 'Vitamin B6', unit: 'mg', type: 'RDA', table: t, ai: ['le6', 'm7_11'], cells: cells(0.1, 0.4, 0.6, 0.7, 1.0, 1.3, 1.5, 1.6, 1.6, 1.6, 1.6, 1.6, 1.8, 2.0, 1.7, 1.5, 1.8, 1.8, 1.8, 1.8, 1.7) });
  column({ compound: 'Folate (Total)', unit: 'µg', type: 'RDA', table: t, ai: ['le6', 't1', 't2', 't3'], cells: cells(64, 90, 120, 140, 200, 280, 310, 330, 330, 330, 330, 600, 600, 600, 490, 260, 320, 330, 330, 330, 330),
    notes: { f18_24: 'Most Nordic/Baltic authorities advise 400 µg/d supplemental folic acid from planned pregnancy through the first trimester.', f25_50: 'Most Nordic/Baltic authorities advise 400 µg/d supplemental folic acid from planned pregnancy through the first trimester.' } });
  column({ compound: 'Vitamin C (Total)', unit: 'mg', type: 'RDA', table: t, ai: ['le6', 'm7_11'], cells: cells(30, 30, 25, 35, 55, 75, 90, 95, 95, 95, 95, 105, 105, 105, 155, 80, 105, 110, 110, 110, 110),
    notes: { le6: 'AI set to 3 times the intake known to prevent scurvy in infants.', m7_11: 'AI set to 3 times the intake known to prevent scurvy in infants.' } });
}
// ───────────── Table 13: AI for vitamins ─────────────
{
  const t = 'Table 13 AI vitamins';
  column({ compound: 'Vitamin E (Total)', unit: 'mg α-TE', type: 'AI', table: t, note: 'Assuming PUFA intake of 5 E%.', cells: cells(4, 5, 7, 8, 9, 10, 11, 10, 10, 9, 9, 10, 11, 12, 11, 11, 12, 11, 11, 11, 11) });
  column({ compound: 'Vitamin K (Total)', unit: 'µg', type: 'AI', table: t, note: '1 µg/kg body weight.', cells: cells(_, 10, 15, 20, 30, 45, 60, 65, 65, 60, 60, 65, 70, 75, 65, 50, 65, 75, 75, 70, 70) });
  column({ compound: 'Pantothenic Acid (B5)', unit: 'mg', type: 'AI', table: t, cells: cells(2, 3, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 7, 5, 5, 5, 5, 5, 5) });
  column({ compound: 'Biotin (B7)', unit: 'µg', type: 'AI', table: t, cells: cells(4, 5, 20, 25, 25, 35, 35, 40, 40, 40, 40, 40, 40, 40, 45, 35, 35, 40, 40, 40, 40) });
  column({ compound: 'Vitamin B12 (Total)', unit: 'µg', type: 'AI', table: t, cells: cells(0.4, 1.5, 1.5, 1.7, 2.5, 3.5, 4, 4, 4, 4, 4, 4.5, 4.5, 4.5, 5.5, 3, 4, 4, 4, 4, 4) });
  column({ compound: 'Choline (Total)', unit: 'mg', type: 'AI', table: t, cells: cells(120, 170, 150, 170, 250, 350, 390, 400, 400, 400, 400, 410, 430, 470, 520, 330, 400, 400, 400, 400, 400) });
}
// ───────────── Table 14: RI for minerals ─────────────
{
  const t = 'Table 14 RI minerals';
  const phytate = 'Assuming a mixed diet with ~600 mg/d phytic acid.';
  column({ compound: 'Calcium', unit: 'mg', type: 'RDA', table: t, ai: ['le6', 'm7_11'], cells: cells(120, 310, 450, 800, 800, 1150, 1150, 1000, 950, 950, 950, 950, 950, 950, 950, 1150, 1150, 1000, 950, 950, 950),
    notes: { f11_14: 'Average of females and males.', f15_17: 'Average of females and males.', m11_14: 'Average of females and males.', m15_17: 'Average of females and males.' } });
  column({ compound: 'Iron (Total)', unit: 'mg', type: 'RDA', table: t, note: phytate, cells: cells(_, 10, 7, 7, 9, 13, 15, 15, 15, 8, 7, 24, 25, 26, 15, 11, 11, 9, 9, 9, 9),
    notes: { f11_14: 'If menstruating: 15 mg.', f51_70: 'If still menstruating, use 15 mg.', t1: 'Assumes 1.91 mg/d additional need over pregnancy.', t2: 'Assumes 1.91 mg/d additional need over pregnancy.', t3: 'Assumes 1.91 mg/d additional need over pregnancy.' } });
  column({ compound: 'Zinc', unit: 'mg', type: 'RDA', table: t, note: phytate, cells: cells(_, 3.0, 4.5, 5.8, 7.7, 10.8, 12.2, 9.7, 9.7, 9.5, 9.3, 9.7, 12.1, 12.1, 12.6, 11.1, 14.0, 12.7, 12.7, 12.4, 12.1) });
  column({ compound: 'Copper', unit: 'µg', type: 'RDA', table: t, ai: ['le6', 'm7_11'], cells: cells(200, 220, 340, 400, 570, 780, 880, 900, 900, 900, 900, 1000, 1000, 1000, 1300, 740, 900, 900, 900, 900, 900) });
}
// ───────────── Table 15: AI for minerals ─────────────
{
  const t = 'Table 15 AI minerals';
  column({ compound: 'Phosphorus', unit: 'mg', type: 'AI', table: t, note: 'Assuming the calcium RI is consumed.', cells: cells(_, 170, 250, 440, 440, 640, 640, 550, 520, 520, 520, 520, 520, 520, 520, 640, 640, 550, 520, 520, 520) });
  column({ compound: 'Potassium', unit: 'mg', type: 'AI', table: t, cells: cells(400, 700, 850, 1150, 1800, 2400, 2850, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 2550, 3400, 3500, 3500, 3500, 3500) });
  column({ compound: 'Magnesium', unit: 'mg', type: 'AI', table: t, cells: cells(25, 80, 170, 230, 230, 250, 250, 300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 350, 350, 350, 350) });
  column({ compound: 'Iodine', unit: 'µg', type: 'AI', table: t, cells: cells([80, 90], [80, 90], 100, 100, 100, 120, 120, 150, 150, 150, 150, 175, 200, 200, 200, 130, 140, 150, 150, 150, 150),
    notes: { le6: '80 µg/d in iodine-sufficient populations, 90 µg/d with mild to moderate deficiency.', m7_11: '80 µg/d in iodine-sufficient populations, 90 µg/d with mild to moderate deficiency.' } });
  column({ compound: 'Selenium', unit: 'µg', type: 'AI', table: t, cells: cells(10, 20, 20, 25, 40, 60, 70, 75, 75, 75, 75, 80, 85, 90, 85, 65, 85, 90, 90, 90, 85) });
  column({ compound: 'Fluoride', unit: 'mg', type: 'AI', table: t, note: '0.05 mg/kg body weight at population reference weights.', cells: cells(_, 0.4, 0.7, 1.0, 1.5, 2.3, 2.9, 3.2, 3.2, 3.1, 3.0, 3.2, 3.2, 3.2, 3.2, 2.4, 3.3, 3.8, 3.7, 3.7, 3.5) });
  column({ compound: 'Manganese', unit: 'mg', type: 'AI', table: t, units: { le6: 'µg' }, cells: cells(12, [0.02, 0.5], 0.5, 1, 1.5, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2.5, 3, 3, 3, 3) });
  column({ compound: 'Molybdenum', unit: 'µg', type: 'AI', table: t, cells: cells(_, 10, 15, 20, 30, 50, 60, 65, 65, 65, 65, 65, 65, 65, 65, 45, 60, 65, 65, 65, 65) });
}
// ───────────── Table 16: sodium (g/d) ─────────────
{
  const t = 'Table 16 sodium';
  add({ compound: 'Sodium', type: 'AI', sexes: ['MALE', 'FEMALE'], stage: 'NONE', age: [0, 5], cell: 0.11, unit: 'g', note: 'Estimated intake from human milk.', from: `${t}, ≤6 mo` });
  add({ compound: 'Sodium', type: 'AI', sexes: ['MALE', 'FEMALE'], stage: 'NONE', age: [6, 11], cell: 0.37, unit: 'g', note: 'Estimated intake from breast milk (70 mg/d) and complementary foods (300 mg/d).', from: `${t}, 7-11 mo` });
  const cdrr: Array<[Key, number]> = [['c1_3', 1.1], ['c4_6', 1.4], ['c7_10', 1.7], ['f11_14', 2.0], ['f15_17', 2.3], ['f18_24', 2.3], ['f25_50', 2.3], ['f51_70', 2.3], ['f70', 2.3], ['m11_14', 2.0], ['m15_17', 2.3], ['m18_24', 2.3], ['m25_50', 2.3], ['m51_70', 2.3], ['m70', 2.3]];
  for (const [key, v] of cdrr) {
    const row = ROW[key];
    add({ compound: 'Sodium', type: 'CDRR', sexes: row.sexes, stage: row.stage, age: row.age, cell: v, max: v, unit: 'g', note: key.endsWith('11_14') ? 'Extrapolated from adults based on energy intake.' : null, from: `${t}, ${row.label}` });
  }
  for (const stage of ['PREGNANT', 'LACTATING'] as const) add({ compound: 'Sodium', type: 'CDRR', sexes: ['FEMALE'], stage, age: PREG_AGE, cell: 2.3, max: 2.3, unit: 'g', from: `${t}, ${stage}` });
}
// ───────────── Table 17: AR vitamins ─────────────
{
  const t = 'Table 17 AR vitamins';
  const infantProv: Key[] = ['le6', 'm7_11'];
  column({ compound: 'Vitamin A (RAE)', unit: 'µg RE', type: 'EAR', table: t, note: 'As retinol equivalents, not RAE.', cells: cells(_, 200, 240, 270, 340, 490, 500, 540, 540, 530, 510, 590, 590, 590, 1070, 520, 600, 630, 630, 610, 590) });
  column({ compound: 'Vitamin D (Total)', unit: 'µg', type: 'EAR', table: t, cells: cells(_, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5) });
  column({ compound: 'Thiamin (B1)', unit: 'mg/MJ', type: 'EAR', table: t, note: 'Per MJ of energy.', cells: cells(_, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07) });
  column({ compound: 'Riboflavin (B2)', unit: 'mg', type: 'EAR', table: t, provisional: infantProv, cells: cells(0.2, 0.3, 0.5, 0.6, 0.8, 1.2, 1.3, 1.3, 1.3, 1.3, 1.3, 1.4, 1.4, 1.5, 1.6, 1.1, 1.3, 1.3, 1.3, 1.3, 1.3) });
  column({ compound: 'Niacin (B3)', unit: 'mg NE/MJ', type: 'EAR', table: t, note: 'Per MJ of energy.', cells: cells(_, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3) });
  column({ compound: 'Vitamin B6', unit: 'mg', type: 'EAR', table: t, provisional: infantProv, cells: cells(0.1, 0.3, 0.5, 0.6, 0.9, 1.1, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.5, 1.6, 1.4, 1.2, 1.5, 1.5, 1.5, 1.5, 1.5) });
  column({ compound: 'Folate (Total)', unit: 'µg', type: 'EAR', table: t, provisional: ['le6', 'm7_11', 't1', 't2', 't3'], cells: cells(50, 70, 90, 110, 160, 220, 240, 250, 250, 250, 250, 480, 480, 480, 380, 200, 250, 250, 250, 250, 250) });
  column({ compound: 'Vitamin C (Total)', unit: 'mg', type: 'EAR', table: t, provisional: infantProv, cells: cells(25, 25, 20, 30, 45, 60, 75, 75, 75, 75, 75, 85, 85, 85, 125, 65, 85, 90, 90, 90, 90),
    notes: { t1: 'Back-calculated from RI.', t2: 'Back-calculated from RI.', t3: 'Back-calculated from RI.' } });
}
// ───────────── Table 18: provisional AR vitamins ─────────────
{
  const t = 'Table 18 provisional AR vitamins';
  const note = 'Provisional AR = 0.8 × provisional RI; likely overestimates the true AR.';
  column({ compound: 'Vitamin E (Total)', unit: 'mg α-TE', type: 'EAR', table: t, provisional: 'all', note, cells: cells(3, 4, 6, 7, 7, 8, 9, 8, 8, 8, 8, 8, 9, 9, 9, 9, 10, 9, 9, 9, 9) });
  column({ compound: 'Vitamin K (Total)', unit: 'µg', type: 'EAR', table: t, provisional: 'all', note, cells: cells(_, 5, 10, 15, 25, 35, 45, 50, 50, 50, 50, 50, 55, 60, 50, 40, 50, 60, 60, 60, 55) });
  column({ compound: 'Pantothenic Acid (B5)', unit: 'mg', type: 'EAR', table: t, provisional: 'all', note, cells: cells(1.6, 2.2, 3.2, 3.2, 3.2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5.6, 4, 4, 4, 4, 4, 4) });
  column({ compound: 'Biotin (B7)', unit: 'µg', type: 'EAR', table: t, provisional: 'all', note, cells: cells(3, 4, 16, 20, 20, 28, 28, 32, 32, 32, 32, 32, 32, 32, 35, 28, 28, 32, 32, 32, 32) });
  column({ compound: 'Vitamin B12 (Total)', unit: 'µg', type: 'EAR', table: t, provisional: 'all', note, cells: cells(0.3, 1.1, 1.2, 1.4, 2, 2.8, 3.1, 3.2, 3.2, 3.2, 3.2, 3.6, 3.6, 3.6, 4.2, 2.6, 3.2, 3.2, 3.2, 3.2, 3.2) });
  column({ compound: 'Choline (Total)', unit: 'mg', type: 'EAR', table: t, provisional: 'all', note, cells: cells(96, 134, 119, 139, 199, 276, 310, 320, 320, 320, 320, 324, 344, 375, 416, 259, 318, 320, 320, 320, 320) });
}
// ───────────── Table 19: AR minerals ─────────────
{
  const t = 'Table 19 AR minerals';
  const phytate = 'Assuming a mixed diet with ~600 mg/d phytic acid.';
  column({ compound: 'Calcium', unit: 'mg', type: 'EAR', table: t, provisional: ['le6', 'm7_11'], cells: cells(96, 250, 400, 700, 675, 980, 980, 870, 750, 750, 750, 750, 750, 750, 750, 980, 980, 870, 750, 750, 750) });
  column({ compound: 'Copper', unit: 'µg', type: 'EAR', table: t, provisional: ['le6', 'm7_11'], cells: cells(160, 180, 260, 300, 440, 600, 680, 700, 700, 700, 700, 800, 800, 800, 1000, 570, 700, 700, 700, 700, 700) });
  column({ compound: 'Iron (Total)', unit: 'mg', type: 'EAR', table: t, note: phytate, cells: cells(_, 8, 6, 5, 7, 10, 9, 9, 9, 6, 6, 19, 19, 20, 9, 9, 9, 7, 7, 7, 7) });
  column({ compound: 'Zinc', unit: 'mg', type: 'EAR', table: t, note: phytate, cells: cells(_, 2.5, 3.8, 4.8, 6.4, 9.0, 10.2, 8.1, 8.1, 7.9, 7.7, 8.1, 10.1, 10.1, 10.5, 9.2, 11.7, 10.6, 10.6, 10.4, 10.1) });
}
// ───────────── Table 20: provisional AR minerals ─────────────
{
  const t = 'Table 20 provisional AR minerals';
  const note = 'Provisional AR = 0.8 × AI; likely overestimates the true AR.';
  column({ compound: 'Phosphorus', unit: 'mg', type: 'EAR', table: t, provisional: 'all', note, cells: cells(_, 140, 200, 350, 350, 510, 510, 440, 420, 420, 420, 420, 420, 420, 430, 510, 510, 440, 420, 420, 420) });
  column({ compound: 'Potassium', unit: 'mg', type: 'EAR', table: t, provisional: 'all', note, cells: cells(320, 600, 700, 900, 1450, 1900, 2250, 2800, 2800, 2800, 2800, 2800, 2800, 2800, 2800, 2050, 2700, 2800, 2800, 2800, 2800) });
  column({ compound: 'Magnesium', unit: 'mg', type: 'EAR', table: t, provisional: 'all', note, cells: cells(20, 64, 136, 184, 184, 200, 200, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 280, 280, 280, 280) });
  column({ compound: 'Iodine', unit: 'µg', type: 'EAR', table: t, provisional: 'all', note, cells: cells([64, 72], [64, 72], 80, 80, 80, 100, 100, 120, 120, 120, 120, 140, 160, 160, 160, 100, 110, 120, 120, 120, 120) });
  column({ compound: 'Selenium', unit: 'µg', type: 'EAR', table: t, provisional: 'all', note, cells: cells(10, 15, 15, 20, 35, 50, 55, 60, 60, 60, 60, 60, 65, 70, 70, 50, 70, 70, 70, 70, 70) });
  column({ compound: 'Fluoride', unit: 'mg', type: 'EAR', table: t, provisional: 'all', note, cells: cells(_, 0.4, 0.5, 0.8, 1.2, 1.9, 2.3, 2.6, 2.6, 2.5, 2.4, 2.6, 2.6, 2.6, 2.6, 1.9, 2.6, 3.0, 3.0, 2.9, 2.8) });
  column({ compound: 'Manganese', unit: 'mg', type: 'EAR', table: t, provisional: 'all', note, units: { le6: 'µg' }, cells: cells(9.6, [0.02, 0.4], 0.5, 0.7, 1.1, 1.8, 2.2, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 1.6, 2.1, 2.4, 2.4, 2.4, 2.4) });
  column({ compound: 'Molybdenum', unit: 'µg', type: 'EAR', table: t, provisional: 'all', note, cells: cells(_, 7, 10, 16, 24, 38, 48, 52, 52, 52, 52, 52, 52, 52, 52, 34, 46, 52, 52, 52, 52) });
}
// ───────────── Table 21: UL for adults (≥ 18 y) ─────────────
{
  const t = 'Table 21 UL adults';
  const adult: Age = [216, null];
  const uls: Array<[string, number, string, string?, boolean?]> = [
    ['Boron', 10, 'mg'], ['Calcium', 2500, 'mg'], ['Copper', 5, 'mg'], ['Iodine', 600, 'µg'], ['Iron (Total)', 60, 'mg'],
    ['Magnesium', 250, 'mg', 'Readily dissociable Mg salts and MgO in supplements, water or added to foods; excludes Mg naturally present in foods.', true],
    ['Molybdenum', 0.6, 'mg'], ['Phosphorus', 3000, 'mg'], ['Selenium', 255, 'µg'], ['Zinc', 25, 'mg'], ['Fluoride', 7, 'mg'],
    ['Folic Acid (Synthetic)', 1000, 'µg', 'Synthetic folic acid.', true], ['Nicotinamide', 900, 'mg'], ['Nicotinic Acid', 10, 'mg'],
    ['Retinol', 3000, 'µg RE', 'Retinol and retinyl esters.'], ['Vitamin B6', 12, 'mg'], ['Vitamin D (Total)', 100, 'µg'], ['Vitamin E (Total)', 300, 'mg'],
  ];
  for (const [compound, v, unit, note, supp] of uls) add({ compound, type: 'UL', sexes: ['MALE', 'FEMALE'], stage: 'NONE', age: adult, cell: v, unit, note, supplementalOnly: supp, from: `${t}, ${compound}` });
}
// ───────────── Table 8 (adults, MJ/d by PAL) and Table 10 (children, MJ/d) ─────────────
{
  const PAL: Array<[string, Activity]> = [['1.4', 'SEDENTARY'], ['1.6', 'MODERATE'], ['1.8', 'ACTIVE']];
  const adults: Array<[string, Sex, LifeStage, Age, number[]]> = [
    ['Females 18-24 y', 'FEMALE', 'NONE', [216, 299], [8.3, 9.4, 10.6]], ['Females 25-50 y', 'FEMALE', 'NONE', [300, 611], [8.0, 9.0, 10.2]],
    ['Females 51-70 y', 'FEMALE', 'NONE', [612, 851], [7.2, 8.3, 9.3]], ['Females >70 y', 'FEMALE', 'NONE', [852, null], [7.1, 8.2, 9.2]],
    ['Pregnant trimester 1', 'FEMALE', 'PREGNANT_T1', PREG_AGE, [8.2, 9.3, 10.5]], ['Pregnant trimester 2', 'FEMALE', 'PREGNANT_T2', PREG_AGE, [9.1, 10.2, 11.4]],
    ['Pregnant trimester 3', 'FEMALE', 'PREGNANT_T3', PREG_AGE, [10.2, 11.3, 12.5]], ['Lactating ≤50 y', 'FEMALE', 'LACTATING', [216, 611], [9.9, 11.0, 12.2]],
    ['Males 18-24 y', 'MALE', 'NONE', [216, 299], [10.4, 11.8, 13.2]], ['Males 25-50 y', 'MALE', 'NONE', [300, 611], [9.9, 11.3, 12.7]],
    ['Males 51-70 y', 'MALE', 'NONE', [612, 851], [9.0, 10.3, 11.6]], ['Males >70 y', 'MALE', 'NONE', [852, null], [8.8, 10.1, 11.3]],
  ];
  for (const [label, sex, stage, age, v] of adults) {
    PAL.forEach(([pal, activity], i) => add({ compound: 'Energy', type: 'EER', sexes: [sex], stage, age, cell: v[i], unit: 'MJ', activity, note: `PAL ${pal}.`, from: `Table 8, Energy, ${label}, PAL ${pal}` }));
  }
  const kids: Array<[string, Sex[], Age, number, string]> = [
    ['1-3 y', ['MALE', 'FEMALE'], [12, 47], 4.6, '1.4'], ['4-6 y', ['MALE', 'FEMALE'], [48, 83], 6.3, '1.6'], ['7-10 y', ['MALE', 'FEMALE'], [84, 131], 7.8, '1.6'],
    ['Females 11-14 y', ['FEMALE'], [132, 179], 9.2, '1.7'], ['Females 15-17 y', ['FEMALE'], [180, 215], 10.1, '1.7'],
    ['Males 11-14 y', ['MALE'], [132, 179], 10.5, '1.7'], ['Males 15-17 y', ['MALE'], [180, 215], 12.7, '1.7'],
  ];
  for (const [label, sexes, age, v, pal] of kids) add({ compound: 'Energy', type: 'EER', sexes, stage: 'NONE', age, cell: v, unit: 'MJ', note: `Printed at the group's average PAL ${pal} only; applies at every activity level.`, from: `Table 10, Energy, ${label}` });
}
// ───────────── Boxes 2-5: recommended intake ranges of macronutrients ─────────────
{
  const both: Sex[] = ['MALE', 'FEMALE'];
  const adult: Age = [216, null];
  const range = (compound: string, lo: number | null, hi: number | null, age: Age, from: string, note?: string, unit = '%', pct = true) =>
    add({ compound, type: 'AMDR', sexes: both, stage: 'NONE', age, cell: lo != null && hi != null ? r4((lo + hi) / 2) : (hi ?? lo)!, min: lo, max: hi, unit, pct, note, from });
  range('Total Fat', 25, 40, adult, 'Box 2, Fats');
  range('Monounsaturated Fat', 10, 20, adult, 'Box 2, Cis-monounsaturated', 'Cis-monounsaturated fatty acids.');
  range('Polyunsaturated Fat', 5, 10, adult, 'Box 2, Cis-polyunsaturated', 'Cis-polyunsaturated fatty acids.');
  range('Saturated Fat', null, 10, [12, null], 'Box 2 / Box 3, Saturated fatty acids', 'From 12 months the adult recommendation applies (Box 3).');
  range('Carbohydrates', 45, 60, adult, 'Box 2, Carbohydrates', 'Including energy from dietary fibre.');
  range('Free Sugars', null, 10, adult, 'Box 2 / Box 7, Added and free sugars', 'Added and free sugars; preferentially lower.');
  range('Protein', 10, 20, [24, null], 'Box 2 / Box 8, Proteins', 'Adults and children from 2 years; increase E% as energy intake falls below 8 MJ/d.');
  range('Omega-3', 1, null, [24, null], 'Box 5, n-3 fatty acids', 'At least 1 E%.');
  range('Alpha-Linolenic Acid (ALA)', 0.5, null, [24, null], 'Box 5, alpha-linolenic acid', 'Linoleic and alpha-linolenic acids at least 3 E%, including at least 0.5 E% alpha-linolenic acid.');
  add({ compound: 'Dietary Fiber', type: 'AMDR', sexes: ['FEMALE'], stage: 'NONE', age: adult, cell: 25, min: 25, unit: 'g', note: 'At least 3 g/MJ; ≥ 25 g/d at the female reference energy intake.', from: 'Box 2 / Box 6, Dietary fibre, females' });
  add({ compound: 'Dietary Fiber', type: 'AMDR', sexes: ['MALE'], stage: 'NONE', age: adult, cell: 35, min: 35, unit: 'g', note: 'At least 3 g/MJ; ≥ 35 g/d at the male reference energy intake.', from: 'Box 2 / Box 6, Dietary fibre, males' });
  // Box 4: children 6-23 months.
  const m6_11: Age = [6, 11], m12_23: Age = [12, 23];
  range('Protein', 7, 15, m6_11, 'Box 4, 6-11 months, Protein'); range('Total Fat', 30, 45, m6_11, 'Box 4, 6-11 months, Fat'); range('Carbohydrates', 45, 60, m6_11, 'Box 4, 6-11 months, Carbohydrates', 'Including energy from dietary fibre.');
  range('Protein', 10, 15, m12_23, 'Box 4, 12-23 months, Protein'); range('Total Fat', 30, 40, m12_23, 'Box 4, 12-23 months, Fat', 'Cis-MUFA + cis-PUFA at least two thirds of total fat.'); range('Carbohydrates', 45, 60, m12_23, 'Box 4, 12-23 months, Carbohydrates', 'Including energy from dietary fibre.');
  // Box 3: n-6 / n-3 floors for 6-23 months.
  range('Omega-6', 4, null, m6_11, 'Box 3, n-6 fatty acids, 6-11 months', 'At least 4 E%.'); range('Omega-3', 1, null, m6_11, 'Box 3, n-3 fatty acids, 6-11 months', 'At least 1 E%.');
  range('Omega-6', 3, null, m12_23, 'Box 3, n-6 fatty acids, 12-23 months', 'At least 3 E%.'); range('Omega-3', 0.5, null, m12_23, 'Box 3, n-3 fatty acids, 12-23 months', 'At least 0.5 E%.');
  // Box 5: pregnant and lactating women.
  for (const stage of ['PREGNANT', 'LACTATING'] as const) {
    add({ compound: 'Omega-3', type: 'AMDR', sexes: ['FEMALE'], stage, age: PREG_AGE, cell: 1, min: 1, unit: '%', pct: true, note: 'Essential fatty acids at least 5 E%, including 1 E% from n-3.', from: `Box 5, n-3 fatty acids, ${stage}` });
    add({ compound: 'DHA (Docosahexaenoic Acid)', type: 'AI', sexes: ['FEMALE'], stage, age: PREG_AGE, cell: 200, unit: 'mg', note: 'Of the n-3 fatty acids, 200 mg/d should be DHA (Box 5).', from: `Box 5, DHA, ${stage}` });
  }
}

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths || (a.activityLevel ?? '').localeCompare(b.activityLevel ?? ''));
writeFileSync(path.join(process.cwd(), 'dv-sources', 'nnr-2023', 'values.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${out.length} values to dv-sources/nnr-2023/values.json`);
