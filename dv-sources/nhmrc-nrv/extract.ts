/**
 * NHMRC / NZ MoH "Nutrient Reference Values for Australia and New Zealand" (2006, with the
 * 2017 fluoride and sodium updates) -> values.json.
 *
 * Transcribed cell by cell, 2026-09-14, from nutrient-refererence-dietary-intakes.pdf:
 *   Summary Tables 1, 2, 4-9 (printed pp. 276-290), and the "Optimising diets for lowering
 *   chronic disease risk" Tables 1 (SDT) and 2 (AMDR) (pp. 250-252). Section text was used to
 *   resolve summary-table footnotes (vitamin A UL "as retinol", infant total fat AI 31/30 g).
 *
 * Mapping decisions:
 *   - RDI -> RDA. "Linoleic (n-6)" / "α-linolenic (n-3)" AIs are TOTAL n-6 / n-3 (Table 4
 *     footnote a) -> Omega-6 / Omega-3. LC n-3 (DHA/EPA/DPA) -> Long Chain Omega-3.
 *   - Calcium 9-13 y printed "800–1,050" / "1,000–1,300": footnote a gives separate values for
 *     9-11 and 12-13 y -> stored as two age bands.
 *   - Protein EAR/RDI in pregnancy apply to the 2nd and 3rd trimesters only (footnote d).
 *   - Niacin UL refers to nicotinic acid; supplemental nicotinamide ULs are in footnote a.
 *     Folate UL is folic acid from fortified foods/supplements; magnesium ULs refer to supplements.
 *   - Sodium AI ranges (e.g. 460–920) stored as ranges with the midpoint as value.
 *   - SDT: sodium is a ceiling (valueMax); the rest are intakes to reach (valueMin). Adults 19+.
 *
 * Not stored:
 *   - Adult EER (Summary Table 3): given by height and weight; any single value would need a body
 *     size Nutri does not collect. PAL 1.2 (bed rest) and 2.2 columns of Table 2 have no Nutri
 *     activity level. Infant EERs are stored only at the printed months (no invented bands).
 *   - "Carotenes" and folate SDTs (no single compound / a range "over current intakes").
 *   - Vitamin C "prudent limit" of 1,000 mg/d: explicitly not a UL.
 *
 * Run: npx tsx dv-sources/nhmrc-nrv/extract.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage, Activity } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
type Cell = number | [number, number] | null;
const out: SourceValue[] = [];
const r4 = (x: number) => Number(x.toFixed(4));

/** The 20 life-stage rows of Summary Tables 4-9, in printed order. */
const ROWS: Array<{ label: string; sexes: Sex[]; stage: LifeStage; age: Age }> = [
  { label: 'Children 1–3 yr', sexes: ['MALE', 'FEMALE'], stage: 'NONE', age: [12, 47] },
  { label: 'Children 4–8 yr', sexes: ['MALE', 'FEMALE'], stage: 'NONE', age: [48, 107] },
  { label: 'Boys 9–13 yr', sexes: ['MALE'], stage: 'NONE', age: [108, 167] },
  { label: 'Boys 14–18 yr', sexes: ['MALE'], stage: 'NONE', age: [168, 227] },
  { label: 'Girls 9–13 yr', sexes: ['FEMALE'], stage: 'NONE', age: [108, 167] },
  { label: 'Girls 14–18 yr', sexes: ['FEMALE'], stage: 'NONE', age: [168, 227] },
  { label: 'Men 19–30 yr', sexes: ['MALE'], stage: 'NONE', age: [228, 371] },
  { label: 'Men 31–50 yr', sexes: ['MALE'], stage: 'NONE', age: [372, 611] },
  { label: 'Men 51–70 yr', sexes: ['MALE'], stage: 'NONE', age: [612, 851] },
  { label: 'Men >70 yr', sexes: ['MALE'], stage: 'NONE', age: [852, null] },
  { label: 'Women 19–30 yr', sexes: ['FEMALE'], stage: 'NONE', age: [228, 371] },
  { label: 'Women 31–50 yr', sexes: ['FEMALE'], stage: 'NONE', age: [372, 611] },
  { label: 'Women 51–70 yr', sexes: ['FEMALE'], stage: 'NONE', age: [612, 851] },
  { label: 'Women >70 yr', sexes: ['FEMALE'], stage: 'NONE', age: [852, null] },
  { label: 'Pregnancy 14–18 yr', sexes: ['FEMALE'], stage: 'PREGNANT', age: [168, 227] },
  { label: 'Pregnancy 19–30 yr', sexes: ['FEMALE'], stage: 'PREGNANT', age: [228, 371] },
  { label: 'Pregnancy 31–50 yr', sexes: ['FEMALE'], stage: 'PREGNANT', age: [372, 611] },
  { label: 'Lactation 14–18 yr', sexes: ['FEMALE'], stage: 'LACTATING', age: [168, 227] },
  { label: 'Lactation 19–30 yr', sexes: ['FEMALE'], stage: 'LACTATING', age: [228, 371] },
  { label: 'Lactation 31–50 yr', sexes: ['FEMALE'], stage: 'LACTATING', age: [372, 611] },
];
const INFANTS: Array<{ label: string; age: Age }> = [{ label: 'Infants 0–6 mo', age: [0, 5] }, { label: 'Infants 7–12 mo', age: [6, 11] }];

function add(p: {
  compound: string; type: DvValueType; sexes: Sex[]; stage: LifeStage; age: Age; cell: Cell; unit: string;
  pct?: boolean; activity?: Activity | null; supplementalOnly?: boolean; note?: string | null; from: string; min?: number | null; max?: number | null;
}) {
  if (p.cell == null) return;
  const [value, vmin, vmax] = Array.isArray(p.cell) ? [r4((p.cell[0] + p.cell[1]) / 2), p.cell[0], p.cell[1]] : [p.cell, p.min ?? null, p.max ?? null];
  for (const sex of p.sexes) {
    out.push({
      compound: p.compound, valueType: p.type, sex, lifeStage: p.stage, ageMinMonths: p.age[0], ageMaxMonths: p.age[1],
      activityLevel: p.activity ?? null, dietaryContext: null, value, valueMin: vmin, valueMax: vmax, unit: p.unit,
      isPercentOfEnergy: p.pct ?? false, isProvisional: false, supplementalOnly: p.supplementalOnly ?? false,
      note: p.note ?? null, from: p.from,
    });
  }
}

interface Nutrient {
  compound: string; unit: string; table: string; note?: string;
  infantsAI?: [Cell, Cell]; infantsUL?: [Cell, Cell];
  ear?: Cell[]; rdi?: Cell[]; ai?: Cell[];
  ul?: Cell[]; ulCompound?: string; ulUnit?: string; ulNote?: string; ulSupplementalOnly?: boolean;
  /** Row indices whose EAR/RDI apply to the 2nd and 3rd trimesters only. */
  trimesters23?: number[];
}
function nutrient(n: Nutrient) {
  const both: Sex[] = ['MALE', 'FEMALE'];
  INFANTS.forEach((inf, i) => {
    add({ compound: n.compound, type: 'AI', sexes: both, stage: 'NONE', age: inf.age, cell: n.infantsAI?.[i] ?? null, unit: n.unit, note: n.note, from: `${n.table}, ${n.compound}, ${inf.label} AI` });
    add({ compound: n.ulCompound ?? n.compound, type: 'UL', sexes: both, stage: 'NONE', age: inf.age, cell: n.infantsUL?.[i] ?? null, unit: n.ulUnit ?? n.unit, supplementalOnly: n.ulSupplementalOnly, note: n.ulNote ?? n.note, from: `${n.table}, ${n.compound}, ${inf.label} UL` });
  });
  for (const [key, type] of [['ear', 'EAR'], ['rdi', 'RDA'], ['ai', 'AI'], ['ul', 'UL']] as const) {
    const cells = n[key];
    if (!cells) continue;
    if (cells.length !== ROWS.length) throw new Error(`${n.compound} ${key}: ${cells.length} cells for ${ROWS.length} rows`);
    ROWS.forEach((row, i) => {
      const isUl = type === 'UL';
      const stages: LifeStage[] = n.trimesters23?.includes(i) && !isUl && row.stage === 'PREGNANT' ? ['PREGNANT_T2', 'PREGNANT_T3'] : [row.stage];
      for (const stage of stages) {
        add({
          compound: isUl ? n.ulCompound ?? n.compound : n.compound, type, sexes: row.sexes, stage, age: row.age, cell: cells[i],
          unit: isUl ? n.ulUnit ?? n.unit : n.unit, supplementalOnly: isUl ? n.ulSupplementalOnly : false,
          note: (isUl ? n.ulNote ?? n.note : n.note) ?? (stages.length > 1 ? 'Pregnancy value applies to the 2nd and 3rd trimesters.' : null),
          from: `${n.table}, ${n.compound} ${key.toUpperCase()}, ${row.label}`,
        });
      }
    });
  }
}
const rep = <T,>(v: T, n: number): T[] => Array(n).fill(v);
// Helper for the common shape: children(2), boys(2), girls(2), men(4), women(4), preg(3), lact(3).
const r = (c: Cell[], b: Cell[], g: Cell[], m: Cell[], w: Cell[], p: Cell[], l: Cell[]): Cell[] => [...c, ...b, ...g, ...m, ...w, ...p, ...l];

// ───────────── Summary Table 4: macronutrients and water ─────────────
nutrient({ compound: 'Protein', unit: 'g', table: 'Summary Table 4', infantsAI: [10, 14],
  ear: r([12, 16], [31, 49], [24, 35], [52, 52, 52, 65], [37, 37, 37, 46], [47, 49, 49], [51, 54, 54]),
  rdi: r([14, 20], [40, 65], [35, 45], [64, 64, 64, 81], [46, 46, 46, 57], [58, 60, 60], [63, 67, 67]),
  trimesters23: [14, 15, 16] });
nutrient({ compound: 'Omega-6', unit: 'g', table: 'Summary Table 4', note: 'Total n-6 (Table 4 footnote a).', infantsAI: [4.4, 4.6],
  ai: r([5, 8], [10, 12], [8, 8], rep(13, 4), rep(8, 4), rep(10, 3), rep(12, 3)) });
nutrient({ compound: 'Omega-3', unit: 'g', table: 'Summary Table 4', note: 'Total n-3 (Table 4 footnote a).', infantsAI: [0.5, 0.5],
  ai: r([0.5, 0.8], [1.0, 1.2], [0.8, 0.8], rep(1.3, 4), rep(0.8, 4), rep(1.0, 3), rep(1.2, 3)) });
nutrient({ compound: 'Long Chain Omega-3', unit: 'mg', table: 'Summary Table 4', note: 'LC n-3: DHA + EPA + DPA.',
  ai: r([40, 55], [70, 125], [70, 85], rep(160, 4), rep(90, 4), [110, 115, 115], [140, 145, 145]),
  ul: rep(3000, 20) });
nutrient({ compound: 'Carbohydrates', unit: 'g', table: 'Summary Table 4', infantsAI: [60, 95] });
nutrient({ compound: 'Dietary Fiber', unit: 'g', table: 'Summary Table 4',
  ai: r([14, 18], [24, 28], [20, 22], rep(30, 4), rep(25, 4), [25, 28, 28], [27, 30, 30]) });
{
  // Total water AI, L/day; the bracketed fluid-only figure goes in the note.
  const total: number[] = [1.4, 1.6, 2.2, 2.7, 1.9, 2.2, ...rep(3.4, 4), ...rep(2.8, 4), 2.4, 3.1, 3.1, 2.9, 3.5, 3.5];
  const fluid: number[] = [1.0, 1.2, 1.6, 1.9, 1.4, 1.6, ...rep(2.6, 4), ...rep(2.1, 4), 1.8, 2.3, 2.3, 2.3, 2.6, 2.6];
  ROWS.forEach((row, i) => add({ compound: 'Water', type: 'AI', sexes: row.sexes, stage: row.stage, age: row.age, cell: total[i], unit: 'L', note: `Total water from foods and fluids; fluids ${fluid[i]} L.`, from: `Summary Table 4, Total water AI, ${row.label}` }));
  [[0.7, 0.7], [0.8, 0.6]].forEach(([t, f], i) => add({ compound: 'Water', type: 'AI', sexes: ['MALE', 'FEMALE'], stage: 'NONE', age: INFANTS[i].age, cell: t, unit: 'L', note: `Total water from foods and fluids; fluids ${f} L.`, from: `Summary Table 4, Total water AI, ${INFANTS[i].label}` }));
  // Infant total fat AI (Table 4 footnote a "30–31 g/day"; section: 0–6 mo 31 g, 7–12 mo 30 g).
  [31, 30].forEach((v, i) => add({ compound: 'Total Fat', type: 'AI', sexes: ['MALE', 'FEMALE'], stage: 'NONE', age: INFANTS[i].age, cell: v, unit: 'g', from: `Fats section, Total fat AI, ${INFANTS[i].label}` }));
}

// ───────────── Summary Table 5: B vitamins ─────────────
nutrient({ compound: 'Thiamin (B1)', unit: 'mg', table: 'Summary Table 5', infantsAI: [0.2, 0.3],
  ear: r([0.4, 0.5], [0.7, 1.0], [0.7, 0.9], rep(1.0, 4), rep(0.9, 4), rep(1.2, 3), rep(1.2, 3)),
  rdi: r([0.5, 0.6], [0.9, 1.2], [0.9, 1.1], rep(1.2, 4), rep(1.1, 4), rep(1.4, 3), rep(1.4, 3)) });
nutrient({ compound: 'Riboflavin (B2)', unit: 'mg', table: 'Summary Table 5', infantsAI: [0.3, 0.4],
  ear: r([0.4, 0.5], [0.8, 1.1], [0.8, 0.9], [1.1, 1.1, 1.1, 1.3], [0.9, 0.9, 0.9, 1.1], rep(1.2, 3), rep(1.3, 3)),
  rdi: r([0.5, 0.6], [0.9, 1.3], [0.9, 1.1], [1.3, 1.3, 1.3, 1.6], [1.1, 1.1, 1.1, 1.3], rep(1.4, 3), rep(1.6, 3)) });
nutrient({ compound: 'Niacin (B3)', unit: 'mg NE', table: 'Summary Table 5', infantsAI: [2, 4],
  ear: r([5, 6], [9, 12], [9, 11], rep(12, 4), rep(11, 4), rep(14, 3), rep(13, 3)),
  rdi: r([6, 8], [12, 16], [12, 14], rep(16, 4), rep(14, 4), rep(18, 3), rep(17, 3)),
  ul: r([10, 15], [20, 30], [20, 30], rep(35, 4), rep(35, 4), [30, 35, 35], [30, 35, 35]), ulCompound: 'Nicotinic Acid', ulUnit: 'mg',
  ulNote: 'The UL for niacin refers to nicotinic acid (Table 5 footnote a).' });
{
  // Table 5 footnote a: supplemental nicotinamide UL; none for infancy, pregnancy or lactation.
  const ages: Array<[string, Age, Sex[]]> = [['1–3 yr', [12, 47], ['MALE', 'FEMALE']], ['4–8 yr', [48, 107], ['MALE', 'FEMALE']], ['9–13 yr', [108, 167], ['MALE', 'FEMALE']], ['14–18 yr', [168, 227], ['MALE', 'FEMALE']], ['men and non-pregnant women', [228, null], ['MALE', 'FEMALE']]];
  [150, 250, 500, 750, 900].forEach((v, i) => add({ compound: 'Nicotinamide', type: 'UL', sexes: ages[i][2], stage: 'NONE', age: ages[i][1], cell: v, unit: 'mg', supplementalOnly: true, note: 'Supplemental nicotinamide.', from: `Summary Table 5 footnote a, nicotinamide UL, ${ages[i][0]}` }));
}
nutrient({ compound: 'Vitamin B6', unit: 'mg', table: 'Summary Table 5', infantsAI: [0.1, 0.3],
  ear: r([0.4, 0.5], [0.8, 1.1], [0.8, 1.0], [1.1, 1.1, 1.4, 1.4], [1.1, 1.1, 1.3, 1.3], rep(1.6, 3), rep(1.7, 3)),
  rdi: r([0.5, 0.6], [1.0, 1.3], [1.0, 1.2], [1.3, 1.3, 1.7, 1.7], [1.3, 1.3, 1.5, 1.5], rep(1.9, 3), rep(2.0, 3)),
  ul: r([15, 20], [30, 40], [30, 40], rep(50, 4), rep(50, 4), [40, 50, 50], [40, 50, 50]), ulNote: 'As pyridoxine.' });
nutrient({ compound: 'Vitamin B12 (Total)', unit: 'µg', table: 'Summary Table 5', infantsAI: [0.4, 0.5],
  ear: r([0.7, 1.0], [1.5, 2.0], [1.5, 2.0], rep(2.0, 4), rep(2.0, 4), rep(2.2, 3), rep(2.4, 3)),
  rdi: r([0.9, 1.2], [1.8, 2.4], [1.8, 2.4], rep(2.4, 4), rep(2.4, 4), rep(2.6, 3), rep(2.8, 3)) });
nutrient({ compound: 'Folate (Total)', unit: 'µg DFE', table: 'Summary Table 5', infantsAI: [65, 80],
  note: 'Dietary intake; for pregnancy excludes the additional supplemental folic acid for neural tube defects.',
  ear: r([120, 160], [250, 330], [250, 330], rep(320, 4), rep(320, 4), rep(520, 3), rep(450, 3)),
  rdi: r([150, 200], [300, 400], [300, 400], rep(400, 4), rep(400, 4), rep(600, 3), rep(500, 3)),
  ul: r([300, 400], [600, 800], [600, 800], rep(1000, 4), rep(1000, 4), [800, 1000, 1000], [800, 1000, 1000]),
  ulCompound: 'Folic Acid (Synthetic)', ulUnit: 'µg', ulSupplementalOnly: true, ulNote: 'Folic acid from fortified foods and supplements.' });
nutrient({ compound: 'Pantothenic Acid (B5)', unit: 'mg', table: 'Summary Table 5', infantsAI: [1.7, 2.2],
  ai: r([3.5, 4.0], [5.0, 6.0], [4.0, 4.0], rep(6.0, 4), rep(4.0, 4), rep(5.0, 3), rep(6.0, 3)) });
nutrient({ compound: 'Biotin (B7)', unit: 'µg', table: 'Summary Table 5', infantsAI: [5, 6],
  ai: r([8, 12], [20, 30], [20, 25], rep(30, 4), rep(25, 4), rep(30, 3), rep(35, 3)) });

// ───────────── Summary Table 6: vitamins A, C, D, E, K, choline ─────────────
nutrient({ compound: 'Vitamin A (RE)', unit: 'µg RE', table: 'Summary Table 6', note: 'As retinol equivalents, not RAE.', infantsAI: [250, 430],
  ear: r([210, 275], [445, 630], [420, 485], rep(625, 4), rep(500, 4), [530, 550, 550], [780, 800, 800]),
  rdi: r([300, 400], [600, 900], [600, 700], rep(900, 4), rep(700, 4), [700, 800, 800], rep(1100, 3)),
  infantsUL: [600, 600], ul: r([600, 900], [1700, 2800], [1700, 2800], rep(3000, 4), rep(3000, 4), [2800, 3000, 3000], [2800, 3000, 3000]),
  ulCompound: 'Retinol', ulUnit: 'µg', ulNote: 'Upper level of intake for vitamin A as retinol.' });
nutrient({ compound: 'Vitamin C (Total)', unit: 'mg', table: 'Summary Table 6', infantsAI: [25, 30],
  ear: r([25, 25], [28, 28], [28, 28], rep(30, 4), rep(30, 4), [38, 40, 40], [58, 60, 60]),
  rdi: r([35, 35], [40, 40], [40, 40], rep(45, 4), rep(45, 4), [55, 60, 60], [80, 85, 85]) });
nutrient({ compound: 'Vitamin D (Total)', unit: 'µg', table: 'Summary Table 6', infantsAI: [5, 5], infantsUL: [25, 25],
  ai: r([5, 5], [5, 5], [5, 5], [5, 5, 10, 15], [5, 5, 10, 15], rep(5, 3), rep(5, 3)), ul: rep(80, 20) });
nutrient({ compound: 'Vitamin E (Total)', unit: 'mg α-TE', table: 'Summary Table 6', note: 'As α-tocopherol equivalents.', infantsAI: [4, 5],
  ai: r([5, 6], [9, 10], [8, 8], rep(10, 4), rep(7, 4), [8, 7, 7], [12, 11, 11]),
  ul: r([70, 100], [180, 250], [180, 250], rep(300, 4), rep(300, 4), rep(300, 3), rep(300, 3)) });
nutrient({ compound: 'Vitamin K (Total)', unit: 'µg', table: 'Summary Table 6', infantsAI: [2.0, 2.5],
  ai: r([25, 35], [45, 55], [45, 55], rep(70, 4), rep(60, 4), rep(60, 3), rep(60, 3)) });
nutrient({ compound: 'Choline (Total)', unit: 'mg', table: 'Summary Table 6', infantsAI: [125, 150],
  ai: r([200, 250], [375, 550], [375, 400], rep(550, 4), rep(425, 4), [415, 440, 440], [525, 550, 550]),
  ul: r([1000, 1000], [1000, 3000], [1000, 3000], rep(3500, 4), rep(3500, 4), [3000, 3500, 3500], [3000, 3500, 3500]) });

// ───────────── Summary Table 7: calcium, phosphorus, zinc, iron ─────────────
{
  // Calcium: rows 2 and 4 (9–13 y) are split per footnote a into 9–11 and 12–13 y.
  const caEar: Cell[] = r([360, 520], [null, 1050], [null, 1050], [840, 840, 840, 1100], [840, 840, 1100, 1100], [1050, 840, 840], [1050, 840, 840]);
  const caRdi: Cell[] = r([500, 700], [null, 1300], [null, 1300], [1000, 1000, 1000, 1300], [1000, 1000, 1300, 1300], [1300, 1000, 1000], [1300, 1000, 1000]);
  nutrient({ compound: 'Calcium', unit: 'mg', table: 'Summary Table 7', infantsAI: [210, 270], ear: caEar, rdi: caRdi, ul: rep(2500, 20) });
  for (const [label, sex] of [['Boys', 'MALE'], ['Girls', 'FEMALE']] as const) {
    const note = 'Printed "800–1,050" / "1,000–1,300" for 9–13 y; footnote a: separate values for 9–11 and 12–13 y.';
    add({ compound: 'Calcium', type: 'EAR', sexes: [sex], stage: 'NONE', age: [108, 143], cell: 800, unit: 'mg', note, from: `Summary Table 7, Calcium EAR, ${label} 9–11 yr` });
    add({ compound: 'Calcium', type: 'EAR', sexes: [sex], stage: 'NONE', age: [144, 167], cell: 1050, unit: 'mg', note, from: `Summary Table 7, Calcium EAR, ${label} 12–13 yr` });
    add({ compound: 'Calcium', type: 'RDA', sexes: [sex], stage: 'NONE', age: [108, 143], cell: 1000, unit: 'mg', note, from: `Summary Table 7, Calcium RDI, ${label} 9–11 yr` });
    add({ compound: 'Calcium', type: 'RDA', sexes: [sex], stage: 'NONE', age: [144, 167], cell: 1300, unit: 'mg', note, from: `Summary Table 7, Calcium RDI, ${label} 12–13 yr` });
  }
}
nutrient({ compound: 'Phosphorus', unit: 'mg', table: 'Summary Table 7', infantsAI: [100, 275],
  ear: r([380, 405], [1055, 1055], [1055, 1055], rep(580, 4), rep(580, 4), [1055, 580, 580], [1055, 580, 580]),
  rdi: r([460, 500], [1250, 1250], [1250, 1250], rep(1000, 4), rep(1000, 4), [1250, 1000, 1000], [1250, 1000, 1000]),
  ul: r([3000, 3000], [4000, 4000], [4000, 4000], [4000, 4000, 4000, 3000], [4000, 4000, 4000, 3000], rep(3500, 3), rep(4000, 3)) });
nutrient({ compound: 'Zinc', unit: 'mg', table: 'Summary Table 7', infantsAI: [2.0, null], infantsUL: [4, 5],
  ear: r([2.5, 3.0], [5.0, 11.0], [5.0, 6.0], rep(12.0, 4), rep(6.5, 4), [8.5, 9.0, 9.0], [9.0, 10.0, 10.0]),
  rdi: r([3, 4], [6, 13], [6, 7], rep(14, 4), rep(8, 4), [10, 11, 11], [11, 12, 12]),
  ul: r([7, 12], [25, 35], [25, 35], rep(40, 4), rep(40, 4), [35, 40, 40], [35, 40, 40]) });
nutrient({ compound: 'Iron (Total)', unit: 'mg', table: 'Summary Table 7', infantsAI: [0.2, null], infantsUL: [20, 20],
  ear: r([4, 4], [6, 8], [6, 8], rep(6, 4), [8, 8, 5, 5], [23, 22, 22], [7, 6.5, 6.5]),
  rdi: r([9, 10], [8, 11], [8, 15], rep(8, 4), [18, 18, 8, 8], rep(27, 3), [10, 9, 9]),
  ul: r([20, 40], [40, 45], [40, 45], rep(45, 4), rep(45, 4), rep(45, 3), rep(45, 3)) });
for (const [compound, ear, rdi] of [['Zinc', 2.5, 3.0], ['Iron (Total)', 7, 11.0]] as const) {
  add({ compound, type: 'EAR', sexes: ['MALE', 'FEMALE'], stage: 'NONE', age: [6, 11], cell: ear, unit: 'mg', from: `Summary Table 7, ${compound} EAR, Infants 7–12 mo` });
  add({ compound, type: 'RDA', sexes: ['MALE', 'FEMALE'], stage: 'NONE', age: [6, 11], cell: rdi, unit: 'mg', from: `Summary Table 7, ${compound} RDI, Infants 7–12 mo` });
}

// ───────────── Summary Table 8: magnesium, iodine, selenium, molybdenum ─────────────
nutrient({ compound: 'Magnesium', unit: 'mg', table: 'Summary Table 8', infantsAI: [30, 75],
  ear: r([65, 110], [200, 340], [200, 300], [330, 350, 350, 350], [255, 265, 265, 265], [335, 290, 300], [300, 255, 265]),
  rdi: r([80, 130], [240, 410], [240, 360], [400, 420, 420, 420], [310, 320, 320, 320], [400, 350, 360], [360, 310, 320]),
  ul: r([65, 110], [350, 350], [350, 350], rep(350, 4), rep(350, 4), rep(350, 3), rep(350, 3)), ulSupplementalOnly: true, ulNote: 'All magnesium ULs refer to supplements (footnote a).' });
nutrient({ compound: 'Iodine', unit: 'µg', table: 'Summary Table 8', infantsAI: [90, 110],
  ear: r([65, 65], [75, 95], [75, 95], rep(100, 4), rep(100, 4), rep(160, 3), rep(190, 3)),
  rdi: r([90, 90], [120, 150], [120, 150], rep(150, 4), rep(150, 4), rep(220, 3), rep(270, 3)),
  ul: r([200, 300], [600, 900], [600, 900], rep(1100, 4), rep(1100, 4), [900, 1100, 1100], [900, 1100, 1100]) });
nutrient({ compound: 'Selenium', unit: 'µg', table: 'Summary Table 8', infantsAI: [12, 15], infantsUL: [45, 60],
  ear: r([20, 25], [40, 60], [40, 50], rep(60, 4), rep(50, 4), rep(55, 3), rep(65, 3)),
  rdi: r([25, 30], [50, 70], [50, 60], rep(70, 4), rep(60, 4), rep(65, 3), rep(75, 3)),
  ul: r([90, 150], [280, 400], [280, 400], rep(400, 4), rep(400, 4), rep(400, 3), rep(400, 3)) });
nutrient({ compound: 'Molybdenum', unit: 'µg', table: 'Summary Table 8', infantsAI: [2, 3],
  ear: r([13, 17], [26, 33], [26, 33], rep(34, 4), rep(34, 4), rep(40, 3), [35, 36, 36]),
  rdi: r([17, 22], [34, 43], [34, 43], rep(45, 4), rep(45, 4), rep(50, 3), rep(50, 3)),
  ul: r([300, 600], [1100, 1700], [1100, 1700], rep(2000, 4), rep(2000, 4), [1700, 2000, 2000], [1700, 2000, 2000]) });

// ───────────── Summary Table 9: copper, chromium, manganese, fluoride, sodium, potassium ─────────────
nutrient({ compound: 'Copper', unit: 'mg', table: 'Summary Table 9', infantsAI: [0.20, 0.22],
  ai: r([0.7, 1.0], [1.3, 1.5], [1.1, 1.1], rep(1.7, 4), rep(1.2, 4), [1.2, 1.3, 1.3], [1.4, 1.5, 1.5]),
  ul: r([1, 3], [5, 8], [5, 8], rep(10, 4), rep(10, 4), [8, 10, 10], [8, 10, 10]) });
nutrient({ compound: 'Chromium', unit: 'µg', table: 'Summary Table 9', infantsAI: [0.2, 5.5],
  ai: r([11, 15], [25, 35], [21, 24], rep(35, 4), rep(25, 4), rep(30, 3), rep(45, 3)) });
nutrient({ compound: 'Manganese', unit: 'mg', table: 'Summary Table 9', infantsAI: [0.003, 0.600],
  ai: r([2.0, 2.5], [3.0, 3.5], [2.5, 3.0], rep(5.5, 4), rep(5.0, 4), rep(5.0, 3), rep(5.0, 3)) });
nutrient({ compound: 'Fluoride', unit: 'mg', table: 'Summary Table 9', note: 'Ages 0–8 y updated in 2017.',
  infantsAI: [null, 0.5], infantsUL: [1.2, 1.8],
  ai: r([0.6, 1.1], [2.0, 3.0], [2.0, 3.0], rep(4.0, 4), rep(3.0, 4), rep(3.0, 3), rep(3.0, 3)),
  ul: r([2.4, 4.4], [10, 10], [10, 10], rep(10, 4), rep(10, 4), rep(10, 3), rep(10, 3)) });
nutrient({ compound: 'Sodium', unit: 'mg', table: 'Summary Table 9', infantsAI: [120, 170],
  ai: r([[200, 400], [300, 600]], [[400, 800], [460, 920]], [[400, 800], [460, 920]], rep([460, 920] as Cell, 4), rep([460, 920] as Cell, 4), rep([460, 920] as Cell, 3), rep([460, 920] as Cell, 3)),
  // Adults' 2017 UL is "not determined"; the 2006 UL remains for 14–18 y incl. pregnancy/lactation.
  ul: r([1000, 1400], [2000, 2300], [2000, 2300], rep(null, 4), rep(null, 4), [2300, null, null], [2300, null, null]) });
nutrient({ compound: 'Potassium', unit: 'mg', table: 'Summary Table 9', infantsAI: [400, 700],
  ai: r([2000, 2300], [3000, 3600], [2500, 2600], rep(3800, 4), rep(2800, 4), rep(2800, 3), rep(3200, 3)) });

// ───────────── Summary Table 1 (infants, kJ) and Table 2 (children 3-18 y, MJ, by PAL) ─────────────
{
  const infants: Array<[number, number, number]> = [[1, 2000, 1800], [2, 2400, 2100], [3, 2400, 2200], [4, 2400, 2200], [5, 2500, 2300], [6, 2700, 2500], [7, 2800, 2500], [8, 3000, 2700], [9, 3100, 2800], [10, 3300, 3000], [11, 3400, 3100], [12, 3500, 3200], [15, 3800, 3500], [18, 4000, 3800], [21, 4200, 4000], [24, 4400, 4200]];
  for (const [m, boys, girls] of infants) {
    const note = `Printed at age ${m} months only.`;
    add({ compound: 'Energy', type: 'EER', sexes: ['MALE'], stage: 'NONE', age: [m, m], cell: boys, unit: 'kJ', note, from: `Summary Table 1, EER, ${m} months, boys` });
    add({ compound: 'Energy', type: 'EER', sexes: ['FEMALE'], stage: 'NONE', age: [m, m], cell: girls, unit: 'kJ', note, from: `Summary Table 1, EER, ${m} months, girls` });
  }
  // PAL columns 1.2, 1.4, 1.6, 1.8, 2.0, 2.2. Only 1.4-2.0 have Nutri activity levels.
  const PAL: Array<[string, Activity | null]> = [['1.2', null], ['1.4', 'SEDENTARY'], ['1.6', 'MODERATE'], ['1.8', 'ACTIVE'], ['2.0', 'VERY_ACTIVE'], ['2.2', null]];
  const boys: number[][] = [
    [4.2, 4.9, 5.6, 6.3, 6.9, 7.6], [4.4, 5.2, 5.9, 6.6, 7.3, 8.1], [4.7, 5.5, 6.2, 7.0, 7.8, 8.5], [5.0, 5.8, 6.6, 7.4, 8.2, 9.0],
    [5.2, 6.1, 7.0, 7.8, 8.7, 9.5], [5.5, 6.4, 7.3, 8.2, 9.2, 10.1], [5.9, 6.8, 7.8, 8.8, 9.7, 10.7], [6.3, 7.3, 8.3, 9.3, 10.4, 11.4],
    [6.6, 7.7, 8.8, 9.9, 11.0, 12.0], [7.0, 8.2, 9.3, 10.5, 11.6, 12.8], [7.5, 8.7, 10.0, 11.2, 12.4, 13.6], [8.0, 9.3, 10.6, 11.9, 13.2, 14.6],
    [8.5, 9.9, 11.2, 12.6, 14.0, 15.4], [8.9, 10.3, 11.8, 13.2, 14.7, 16.2], [9.2, 10.7, 12.2, 13.7, 15.2, 16.7], [9.4, 10.9, 12.5, 14.0, 15.6, 17.1],
  ];
  const girls: number[][] = [
    [3.9, 4.5, 5.3, 5.8, 6.4, 7.1], [4.1, 4.8, 5.5, 6.1, 6.8, 7.5], [4.4, 5.1, 5.7, 6.5, 7.2, 7.9], [4.6, 5.4, 6.1, 6.9, 7.6, 8.4],
    [4.9, 5.7, 6.5, 7.3, 8.1, 8.9], [5.2, 6.0, 6.9, 7.7, 8.6, 9.4], [5.5, 6.4, 7.3, 8.2, 9.1, 10.0], [5.7, 6.7, 7.6, 8.5, 9.5, 10.4],
    [6.0, 7.0, 8.0, 9.0, 10.0, 11.0], [6.4, 7.4, 8.5, 9.5, 10.6, 11.6], [6.7, 7.8, 8.9, 10.0, 11.1, 12.2], [6.9, 8.1, 9.2, 10.3, 11.5, 12.6],
    [7.1, 8.2, 9.4, 10.6, 11.7, 12.9], [7.2, 8.4, 9.5, 10.7, 11.9, 13.1], [7.2, 8.4, 9.6, 10.8, 12.0, 13.2], [7.3, 8.5, 9.7, 10.9, 12.1, 13.3],
  ];
  for (let i = 0; i < 16; i++) {
    const age = 3 + i;
    const band: Age = [age * 12, age * 12 + 11];
    PAL.forEach(([pal, activity], j) => {
      if (!activity) return;
      add({ compound: 'Energy', type: 'EER', sexes: ['MALE'], stage: 'NONE', age: band, cell: boys[i][j], unit: 'MJ', activity, note: `PAL ${pal}.`, from: `Summary Table 2, EER, boys ${age} y, PAL ${pal}` });
      add({ compound: 'Energy', type: 'EER', sexes: ['FEMALE'], stage: 'NONE', age: band, cell: girls[i][j], unit: 'MJ', activity, note: `PAL ${pal}.`, from: `Summary Table 2, EER, girls ${age} y, PAL ${pal}` });
    });
  }
}

// ───────────── Chronic disease Table 1 (SDT) and Table 2 (AMDR), adults 19+ ─────────────
{
  const adult: Age = [228, null];
  const sdt: Array<[string, string, number, number, 'reach' | 'ceiling', string?]> = [
    ['Vitamin A (RE)', 'µg RE', 1500, 1220, 'reach', 'As retinol equivalents.'],
    ['Vitamin C (Total)', 'mg', 220, 190, 'reach'],
    ['Vitamin E (Total)', 'mg α-TE', 19, 14, 'reach'],
    ['Sodium', 'mg', 2000, 2000, 'ceiling', 'Revised 2017.'],
    ['Potassium', 'mg', 4700, 4700, 'reach'],
    ['Dietary Fiber', 'g', 38, 28, 'reach'],
    ['Long Chain Omega-3', 'mg', 610, 430, 'reach', 'LC n-3: DHA + EPA + DPA.'],
  ];
  for (const [compound, unit, men, women, dir, note] of sdt) {
    for (const [sex, v] of [['MALE', men], ['FEMALE', women]] as const) {
      add({ compound, type: 'SDT', sexes: [sex], stage: 'NONE', age: adult, cell: v, unit, min: dir === 'reach' ? v : null, max: dir === 'ceiling' ? v : null,
        note: `Suggested dietary target to reduce chronic disease risk.${note ? ' ' + note : ''}`, from: `Chronic disease Table 1 SDT, ${compound}, ${sex === 'MALE' ? 'men' : 'women'}` });
    }
  }
  const amdr: Array<[string, [number | null, number], string?]> = [
    ['Protein', [15, 25]], ['Total Fat', [20, 35], 'Saturated and trans fats together no more than 10% of energy.'], ['Carbohydrates', [45, 65]],
    ['Omega-6', [null, 10], 'Lower end is the age/gender AI (equates to 4–5% of energy).'],
    ['Omega-3', [null, 1], 'Lower end is the age/gender AI (equates to 0.4–0.5% of energy).'],
  ];
  for (const [compound, [lo, hi], note] of amdr) {
    add({ compound, type: 'AMDR', sexes: ['MALE', 'FEMALE'], stage: 'NONE', age: adult, cell: lo == null ? hi : r4((lo + hi) / 2), min: lo, max: hi, unit: '%', pct: true, note, from: `Chronic disease Table 2 AMDR, ${compound}` });
  }
}

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths || (a.activityLevel ?? '').localeCompare(b.activityLevel ?? ''));
writeFileSync(path.join(process.cwd(), 'dv-sources', 'nhmrc-nrv', 'values.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${out.length} values to dv-sources/nhmrc-nrv/values.json`);
