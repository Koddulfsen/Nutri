/**
 * UK Dietary Reference Values (COMA 1991, with SACN 2011 energy, 2015 carbohydrates, 2016 vitamin D)
 * -> values.json.
 *
 * Transcribed cell by cell, 2026-09-14, from the British Nutrition Foundation summary
 * "Nutrition Requirements" (reviewed May 2021), bnf-nutrition-requirements-2021.pdf — text snapshot
 * in source/. It reproduces the COMA/SACN tables and cites them as sources.
 *
 * Mapping decisions:
 *   - RNI -> RDA; "safe intake" (infant vitamin D) -> AI; energy EAR -> EER.
 *   - Infant energy: the "mixed feeding or unknown" table (breastfed and formula-fed values in notes).
 *     UK energy EARs assume moderate activity; one value per group, so no activity level is set.
 *   - Pregnancy / lactation are printed as "+x" over non-pregnant women or "*" (no increase); stored as
 *     totals over women 19-50 y. Lactation 0-4 and 4+ months are equal except zinc (+6.0 / +2.5), where
 *     the 0-4 month value is stored.
 *   - Salt maxima are converted to sodium with the table's "1 g sodium = 2.5 g salt" and stored as
 *     CDRR ceilings. Total fat, saturated fat and free sugars "not more than" -> CDRR ceilings (% energy).
 *   - "Total carbohydrate 50%" is a single %-energy goal -> AMDR point.
 *
 * Source inconsistency: women 65-74 / 75+ energy MJ disagree with the printed kcal; kcal-consistent MJ used.
 *
 * Not stored: adult protein RNI (0.75 g/kg body weight) and its pregnancy/lactation increments, and the
 * food-labelling Reference Intakes (not demographic values).
 *
 * Run: npx tsx dv-sources/sacn-rni/extract.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
type Cell = number | [number, number] | null;
const out: SourceValue[] = [];
const BOTH: Sex[] = ['MALE', 'FEMALE'];
const r4 = (x: number) => Number(x.toFixed(4));

function add(p: { compound: string; type: DvValueType; sexes: Sex[]; stage?: LifeStage; age: Age; cell: Cell; unit: string; pct?: boolean; min?: number | null; max?: number | null; note?: string | null; from: string }) {
  if (p.cell == null) return;
  const [value, vmin, vmax] = Array.isArray(p.cell) ? [r4((p.cell[0] + p.cell[1]) / 2), p.cell[0], p.cell[1]] : [p.cell, p.min ?? null, p.max ?? null];
  for (const sex of p.sexes) {
    out.push({
      compound: p.compound, valueType: p.type, sex, lifeStage: p.stage ?? 'NONE', ageMinMonths: p.age[0], ageMaxMonths: p.age[1],
      activityLevel: null, dietaryContext: null, value, valueMin: vmin, valueMax: vmax, unit: p.unit,
      isPercentOfEnergy: p.pct ?? false, isProvisional: false, supplementalOnly: false, note: p.note ?? null, from: p.from,
    });
  }
}

// ───────────── Energy (p2-3), MJ/d ─────────────
{
  const infants: Array<[string, Age, number, number, string]> = [
    ['1-2 months', [1, 2], 2.4, 2.1, 'Breastfed M 2.2 / F 2.0; formula-fed M 2.5 / F 2.3 MJ.'],
    ['3-4 months', [3, 4], 2.5, 2.3, 'Breastfed M 2.4 / F 2.2; formula-fed M 2.6 / F 2.5 MJ.'],
    ['5-6 months', [5, 6], 2.6, 2.4, 'Breastfed M 2.5 / F 2.3; formula-fed M 2.7 / F 2.6 MJ.'],
    ['7-12 months', [7, 11], 3.0, 2.7, 'Breastfed M 2.9 / F 2.7; formula-fed M 3.1 / F 2.8 MJ.'],
    ['1 year', [12, 23], 3.2, 3.0, ''], ['2 years', [24, 35], 4.2, 3.9, ''], ['3 years', [36, 47], 4.9, 4.5, ''],
  ];
  for (const [label, age, m, f, alt] of infants) {
    const note = `Mixed feeding or unknown.${alt ? ' ' + alt : ''}`;
    add({ compound: 'Energy', type: 'EER', sexes: ['MALE'], age, cell: m, unit: 'MJ', note, from: `Energy EAR, ${label}, males` });
    add({ compound: 'Energy', type: 'EER', sexes: ['FEMALE'], age, cell: f, unit: 'MJ', note, from: `Energy EAR, ${label}, females` });
  }
  const kids: Array<[number, number, number]> = [[4, 5.8, 5.4], [5, 6.2, 5.7], [6, 6.6, 6.2], [7, 6.9, 6.4], [8, 7.3, 6.8], [9, 7.7, 7.2], [10, 8.5, 8.1], [11, 8.9, 8.5], [12, 9.4, 8.8], [13, 10.1, 9.3], [14, 11.0, 9.8], [15, 11.8, 10.0], [16, 12.4, 10.1], [17, 12.9, 10.3], [18, 13.2, 10.3]];
  for (const [y, m, f] of kids) {
    add({ compound: 'Energy', type: 'EER', sexes: ['MALE'], age: [y * 12, y * 12 + 11], cell: m, unit: 'MJ', from: `Energy EAR, children ${y} y, males` });
    add({ compound: 'Energy', type: 'EER', sexes: ['FEMALE'], age: [y * 12, y * 12 + 11], cell: f, unit: 'MJ', from: `Energy EAR, children ${y} y, females` });
  }
  const moderate = 'Healthy weight, moderately active.';
  const adults: Array<[string, Age, number, number]> = [['19-24', [228, 299], 11.6, 9.1], ['25-34', [300, 419], 11.5, 9.1], ['35-44', [420, 539], 11.0, 8.8], ['45-54', [540, 659], 10.8, 8.8], ['55-64', [660, 779], 10.8, 8.7], ['65-74', [780, 899], 9.8, 8.0], ['75+', [900, null], 9.6, 7.7]];
  // The BNF table prints women 65-74 as "7.7 MJ / 1912 kcal" and 75+ as "8.7 MJ / 1840 kcal": the MJ and
  // kcal disagree in both rows (every other row agrees). The kcal gives 8.0 and 7.7 MJ, the SACN 2011 values.
  const mjTypo: Record<string, string> = {
    '65-74': 'BNF prints 7.7 MJ beside 1912 kcal; 1912 kcal = 8.0 MJ (SACN 2011), used here.',
    '75+': 'BNF prints 8.7 MJ beside 1840 kcal; 1840 kcal = 7.7 MJ (SACN 2011), used here.',
  };
  for (const [label, age, m, f] of adults) {
    add({ compound: 'Energy', type: 'EER', sexes: ['MALE'], age, cell: m, unit: 'MJ', note: moderate, from: `Energy EAR, adults ${label}, males` });
    add({ compound: 'Energy', type: 'EER', sexes: ['FEMALE'], age, cell: f, unit: 'MJ', note: [moderate, mjTypo[label]].filter(Boolean).join(' '), from: `Energy EAR, adults ${label}, females` });
    // "+0.8 MJ/day, but only in the final three months of pregnancy".
    if (age[0] < 600) add({ compound: 'Energy', type: 'EER', sexes: ['FEMALE'], stage: 'PREGNANT_T3', age, cell: r4(f + 0.8), unit: 'MJ', note: `${moderate} Printed as +0.8 MJ in the final three months; stored as total.`, from: `Energy, pregnancy +0.8 over adults ${label}` });
  }
}

// ───────────── Carbohydrate, fat, fibre, salt (p4-5) ─────────────
{
  add({ compound: 'Carbohydrates', type: 'AMDR', sexes: BOTH, age: [24, null], cell: 50, unit: '%', pct: true, note: 'SACN 2015, population aged 2 years and above.', from: 'DRVs for carbohydrate and fat, Total carbohydrate' });
  add({ compound: 'Free Sugars', type: 'CDRR', sexes: BOTH, age: [24, null], cell: 5, max: 5, unit: '%', pct: true, note: 'Not more than 5% of energy (SACN 2015, aged 2 years and above).', from: 'DRVs for carbohydrate and fat, free sugars' });
  add({ compound: 'Total Fat', type: 'CDRR', sexes: BOTH, age: [60, null], cell: 35, max: 35, unit: '%', pct: true, note: 'Not more than 35% of food energy (COMA 1991, aged 5 years and above).', from: 'DRVs for carbohydrate and fat, Total fat' });
  add({ compound: 'Saturated Fat', type: 'CDRR', sexes: BOTH, age: [60, null], cell: 11, max: 11, unit: '%', pct: true, note: 'Not more than 11% of food energy (COMA 1991, aged 5 years and above).', from: 'DRVs for carbohydrate and fat, Saturated fat' });
  const fibre: Array<[string, Age, number]> = [['2-5 years', [24, 59], 15], ['5-11 years', [60, 131], 20], ['11-16 years', [132, 203], 25], ['17 years and over', [204, null], 30]];
  for (const [label, age, v] of fibre) add({ compound: 'Dietary Fiber', type: 'AI', sexes: BOTH, age, cell: v, unit: 'g', note: 'SACN 2015 recommended intake.', from: `Dietary fibre, ${label}` });
  const salt: Array<[string, Age, number, string]> = [['0-6 months', [0, 5], 1, '<1'], ['6-12 months', [6, 11], 1, '1'], ['1-3 years', [12, 47], 2, '2'], ['4-6 years', [48, 83], 3, '3'], ['7-10 years', [84, 131], 5, '5'], ['11 years and above', [132, null], 6, '6']];
  for (const [label, age, g, printed] of salt) {
    const na = r4(g / 2.5);
    add({ compound: 'Sodium', type: 'CDRR', sexes: BOTH, age, cell: na, max: na, unit: 'g', note: `Maximum salt ${printed} g/day, as sodium (1 g sodium = 2.5 g salt). An achievable population goal, not an optimum.`, from: `Salt, ${label}` });
  }
  const protein: Array<[string, Age, number]> = [['0-3 months', [0, 2], 12.5], ['4-6 months', [3, 5], 12.7], ['7-9 months', [6, 8], 13.7], ['10-12 months', [9, 11], 14.9], ['1-3 years', [12, 47], 14.5], ['4-6 years', [48, 83], 19.7], ['7-10 years', [84, 131], 28.3]];
  for (const [label, age, v] of protein) add({ compound: 'Protein', type: 'RDA', sexes: BOTH, age, cell: v, unit: 'g', from: `Protein RNI, ${label}` });
}

// ───────────── RNI tables (p6-7) ─────────────
const ROWS: Array<{ key: string; label: string; sexes: Sex[]; age: Age }> = [
  { key: 'm0_3', label: '0-3 months', sexes: BOTH, age: [0, 2] }, { key: 'm4_6', label: '4-6 months', sexes: BOTH, age: [3, 5] },
  { key: 'm7_9', label: '7-9 months', sexes: BOTH, age: [6, 8] }, { key: 'm10_12', label: '10-12 months', sexes: BOTH, age: [9, 11] },
  { key: 'c1_3', label: '1-3 years', sexes: BOTH, age: [12, 47] }, { key: 'c4_6', label: '4-6 years', sexes: BOTH, age: [48, 83] },
  { key: 'c7_10', label: '7-10 years', sexes: BOTH, age: [84, 131] },
  { key: 'm11_14', label: 'Males 11-14 years', sexes: ['MALE'], age: [132, 179] }, { key: 'm15_18', label: 'Males 15-18 years', sexes: ['MALE'], age: [180, 227] },
  { key: 'm19_50', label: 'Males 19-50 years', sexes: ['MALE'], age: [228, 599] }, { key: 'm50', label: 'Males 50+ years', sexes: ['MALE'], age: [600, null] },
  { key: 'f11_14', label: 'Females 11-14 years', sexes: ['FEMALE'], age: [132, 179] }, { key: 'f15_18', label: 'Females 15-18 years', sexes: ['FEMALE'], age: [180, 227] },
  { key: 'f19_50', label: 'Females 19-50 years', sexes: ['FEMALE'], age: [228, 599] }, { key: 'f50', label: 'Females 50+ years', sexes: ['FEMALE'], age: [600, null] },
];
const F19_50 = ROWS.findIndex((r) => r.key === 'f19_50');
const PREG_AGE: Age = [228, 599];

/** preg / lact: '+x' increment, a number (absolute), or '*' (no increase). */
function rni(c: { compound: string; unit: string; table: string; cells: Cell[]; preg: string; lact: string; note?: string; pregStage?: LifeStage; infantAI?: boolean; notes?: Record<string, string> }) {
  if (c.cells.length !== ROWS.length) throw new Error(`${c.compound}: ${c.cells.length} cells`);
  ROWS.forEach((r, i) => {
    const infantAI = c.infantAI && r.age[0] < 12;
    add({ compound: c.compound, type: infantAI ? 'AI' : 'RDA', sexes: r.sexes, age: r.age, cell: c.cells[i], unit: c.unit,
      note: [c.note, infantAI ? 'Safe intake.' : null, c.notes?.[r.key]].filter(Boolean).join(' ') || null, from: `${c.table}, ${c.compound}, ${r.label}` });
  });
  const base = c.cells[F19_50] as number;
  for (const [stage, printed, label] of [[c.pregStage ?? 'PREGNANT', c.preg, 'Pregnancy'], ['LACTATING', c.lact, 'Lactation']] as const) {
    let v: number; let note: string;
    if (printed === '*') { v = base; note = 'No increase over non-pregnant women 19-50 y.'; }
    else if (printed.startsWith('+')) { v = r4(base + Number(printed.slice(1))); note = `Printed as ${printed} over women 19-50 y; stored as total.`; }
    else { v = Number(printed); note = 'Printed absolute.'; }
    add({ compound: c.compound, type: 'RDA', sexes: ['FEMALE'], stage, age: PREG_AGE, cell: v, unit: c.unit, note: [c.note, note, c.notes?.[label]].filter(Boolean).join(' '), from: `${c.table}, ${c.compound}, ${label} ${printed}` });
  }
}
const V = 'RNI vitamins';
// Order: 0-3, 4-6, 7-9, 10-12 months, 1-3, 4-6, 7-10 y, M 11-14, 15-18, 19-50, 50+, F 11-14, 15-18, 19-50, 50+
rni({ compound: 'Thiamin (B1)', unit: 'mg', table: V, cells: [0.2, 0.2, 0.2, 0.3, 0.5, 0.7, 0.7, 0.9, 1.1, 1.0, 0.9, 0.7, 0.8, 0.8, 0.8], preg: '+0.1', lact: '+0.2', pregStage: 'PREGNANT_T3', notes: { Pregnancy: 'For the last trimester only.' } });
rni({ compound: 'Riboflavin (B2)', unit: 'mg', table: V, cells: [0.4, 0.4, 0.4, 0.4, 0.6, 0.8, 1.0, 1.2, 1.3, 1.3, 1.3, 1.1, 1.1, 1.1, 1.1], preg: '+0.3', lact: '+0.5' });
rni({ compound: 'Niacin (B3)', unit: 'mg', table: V, cells: [3, 3, 4, 5, 8, 11, 12, 15, 18, 17, 16, 12, 14, 13, 12], preg: '*', lact: '+2' });
rni({ compound: 'Vitamin B6', unit: 'mg', table: V, note: 'Based on protein providing 14.7% of the EAR for energy.', cells: [0.2, 0.2, 0.3, 0.4, 0.7, 0.9, 1.0, 1.2, 1.5, 1.4, 1.4, 1.0, 1.2, 1.2, 1.2], preg: '*', lact: '*' });
rni({ compound: 'Vitamin B12 (Total)', unit: 'µg', table: V, cells: [0.3, 0.3, 0.4, 0.4, 0.5, 0.8, 1.0, 1.2, 1.5, 1.5, 1.5, 1.2, 1.5, 1.5, 1.5], preg: '*', lact: '+0.5' });
rni({ compound: 'Folate (Total)', unit: 'µg', table: V, cells: [50, 50, 50, 50, 70, 100, 150, 200, 200, 200, 200, 200, 200, 200, 200], preg: '+100', lact: '+60' });
rni({ compound: 'Vitamin C (Total)', unit: 'mg', table: V, cells: [25, 25, 25, 25, 30, 30, 30, 35, 40, 40, 40, 35, 40, 40, 40], preg: '+10', lact: '+30', pregStage: 'PREGNANT_T3', notes: { Pregnancy: 'For the last trimester only.' } });
rni({ compound: 'Vitamin A (RE)', unit: 'µg RE', table: V, note: 'COMA 1991 vitamin A (retinol equivalents).', cells: [350, 350, 350, 350, 400, 400, 500, 600, 700, 700, 700, 600, 600, 600, 600], preg: '+100', lact: '+350' });
rni({ compound: 'Vitamin D (Total)', unit: 'µg', table: V, note: 'SACN 2016.', infantAI: true, cells: [[8.5, 10], [8.5, 10], [8.5, 10], [8.5, 10], 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], preg: '10', lact: '10' });
const MN = 'RNI minerals';
const fe = 'Insufficient for women with high menstrual losses, for whom iron supplements are the most practical way to meet requirements.';
rni({ compound: 'Calcium', unit: 'mg', table: MN, cells: [525, 525, 525, 525, 350, 450, 550, 1000, 1000, 700, 700, 800, 800, 700, 700], preg: '*', lact: '+550' });
rni({ compound: 'Phosphorus', unit: 'mg', table: MN, note: 'Set equal to calcium in molar terms.', cells: [400, 400, 400, 400, 270, 350, 450, 775, 775, 550, 550, 625, 625, 550, 550], preg: '*', lact: '+440' });
rni({ compound: 'Magnesium', unit: 'mg', table: MN, cells: [55, 60, 75, 80, 85, 120, 200, 280, 300, 300, 300, 280, 300, 270, 270], preg: '*', lact: '+50' });
rni({ compound: 'Sodium', unit: 'mg', table: MN, cells: [210, 280, 320, 350, 500, 700, 1200, 1600, 1600, 1600, 1600, 1600, 1600, 1600, 1600], preg: '*', lact: '*' });
rni({ compound: 'Potassium', unit: 'mg', table: MN, cells: [800, 850, 700, 700, 800, 1100, 2000, 3100, 3500, 3500, 3500, 3100, 3500, 3500, 3500], preg: '*', lact: '*' });
rni({ compound: 'Chloride', unit: 'mg', table: MN, cells: [320, 400, 500, 500, 800, 1100, 1800, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500], preg: '*', lact: '*' });
rni({ compound: 'Iron (Total)', unit: 'mg', table: MN, cells: [1.7, 4.3, 7.8, 7.8, 6.9, 6.1, 8.7, 11.3, 11.3, 8.7, 8.7, 14.8, 14.8, 14.8, 8.7], preg: '*', lact: '*', notes: { f11_14: fe, f15_18: fe, f19_50: fe } });
rni({ compound: 'Zinc', unit: 'mg', table: MN, cells: [4.0, 4.0, 5.0, 5.0, 5.0, 6.5, 7.0, 9.0, 9.5, 9.5, 9.5, 9.0, 7.0, 7.0, 7.0], preg: '*', lact: '+6.0', notes: { Lactation: '0-4 months; 4+ months: +2.5 mg.' } });
rni({ compound: 'Copper', unit: 'mg', table: MN, cells: [0.2, 0.3, 0.3, 0.3, 0.4, 0.6, 0.7, 0.8, 1.0, 1.2, 1.2, 0.8, 1.0, 1.2, 1.2], preg: '*', lact: '+0.3' });
rni({ compound: 'Selenium', unit: 'µg', table: MN, cells: [10, 13, 10, 10, 15, 20, 30, 45, 70, 75, 75, 45, 60, 60, 60], preg: '*', lact: '+15' });
rni({ compound: 'Iodine', unit: 'µg', table: MN, cells: [50, 60, 60, 60, 70, 100, 110, 130, 140, 140, 140, 130, 140, 140, 140], preg: '*', lact: '*' });

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths);
writeFileSync(path.join(process.cwd(), 'dv-sources', 'sacn-rni', 'values.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${out.length} values to dv-sources/sacn-rni/values.json`);
