/**
 * Korea — MOHW / KNS "2020 Dietary Reference Intakes for Koreans (KDRIs)" -> values.json.
 *
 * Transcribed cell by cell, 2026-09-16, from Book 1 (에너지와 다량영양소), Appendix 2, the English summary
 * tables on printed pages 255-264 (PDF pages 293-302). Those pages are images with no text layer; the
 * renders read are in source/summary-293.png ... summary-302.png. Pages 303-311 of the same PDF are the
 * 2015 KDRI tables and are NOT used.
 *
 * Errata applied (정오표 rounds 1-4, 2021). Only the amino-acid rows change summary-table values:
 *   - "Methionine" is Methionine+Cysteine (not stored: no combined compound).
 *   - Men 30-49 y Methionine+Cysteine RNI 1.3 -> 1.4 (not stored, as above).
 *   - Pregnancy / lactation Phe+Tyr, threonine and histidine were printed in the wrong columns. Corrected:
 *     Phe+Tyr 3.0/3.8 and 3.7/4.7 (not stored: no combined compound); threonine 1.2/1.5 and 1.3/1.7;
 *     histidine 0.8/1.0 and 0.8/1.1. Amino-acid pregnancy / lactation values are absolute, not increments.
 *   The other corrections are to the chapter text (carbohydrate 180 -> 175 and 215 -> 210 g, water and
 *   energy worked examples, pantothenic acid RNI -> AI wording), which the summary tables already match.
 *
 * Mapping decisions:
 *   - RNI -> RDA; EAR, AI, UL as named; EER -> EER (one value per group, no activity level); AMDR ranges
 *     -> AMDR; "less than" SFA / trans fat and the sodium CDRR -> CDRR ceilings.
 *   - Pregnancy / lactation "+x" cells are stored as totals over women 19-29 y and 30-49 y separately
 *     (the bases differ for several nutrients). "+0" is stored as the base value. Absolute cells are
 *     stored once for women 19-49 y. Water is the exception: the chapter sets the pregnancy and
 *     lactation AI as women 19-29 y + 200 / + 700 mL (2,300 / 2,800 mL), so that total is stored for 19-49 y.
 *   - Energy pregnancy "+0 / +340 / +450" -> PREGNANT_T1 / T2 / T3. Protein "+12 / +25" is "per the second
 *     and third trimester" -> PREGNANT_T2 / T3 (the first trimester has no addition).
 *   - Infant EPA+DHA AI (200 / 300 mg) is footnoted as DHA -> DHA. Other EPA+DHA values are not stored
 *     (no EPA+DHA compound yet).
 *   - Niacin UL "nicotinic acid / nicotinamide" -> Nicotinic Acid and Nicotinamide, supplementalOnly (the
 *     chapter bases them on supplements and fortified foods). Folate UL -> Folic Acid (Synthetic),
 *     supplementalOnly (footnote: supplements or fortified foods only). Magnesium UL -> supplementalOnly
 *     (footnote: non-food sources only).
 *   - Vitamin A in µg RAE, folate in µg DFE, niacin in mg NE, vitamin E in mg α-TE, copper in µg, water in
 *     mL, as printed.
 *   - Sugars (total 10-20% of energy; added sugars no more than 10%) and cholesterol (less than 300 mg for
 *     19 y and older) are text notes to the tables. Sugars carry no age, so they are stored from 1 year.
 *
 * Not stored: Methionine+Cysteine and Phenylalanine+Tyrosine (no combined compounds), EPA+DHA beyond
 * infancy, water from food / plain water / beverages / liquids (only total water).
 *
 * Run: npx tsx dv-sources/kdri-2020/extract.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
const out: SourceValue[] = [];
const r4 = (x: number) => Number(x.toFixed(4));

// The 24 printed rows, in table order.
const ROWS: Array<{ label: string; sexes: Sex[]; age: Age }> = [
  { label: 'Infants 0-5 mo', sexes: ['MALE', 'FEMALE'], age: [0, 5] },
  { label: 'Infants 6-11 mo', sexes: ['MALE', 'FEMALE'], age: [6, 11] },
  { label: 'Children 1-2 y', sexes: ['MALE', 'FEMALE'], age: [12, 35] },
  { label: 'Children 3-5 y', sexes: ['MALE', 'FEMALE'], age: [36, 71] },
  ...(['MALE', 'FEMALE'] as const).flatMap((sex) => ([
    ['6-8', [72, 107]], ['9-11', [108, 143]], ['12-14', [144, 179]], ['15-18', [180, 227]], ['19-29', [228, 359]],
    ['30-49', [360, 599]], ['50-64', [600, 779]], ['65-74', [780, 899]], ['≥75', [900, null]],
  ] as Array<[string, Age]>).map(([l, age]) => ({ label: `${sex === 'MALE' ? 'Males' : 'Females'} ${l} y`, sexes: [sex] as Sex[], age }))),
];
const PREG = 22; const LACT = 23;
const F19 = 17; const F30 = 18;

interface Col { compound: string; type: DvValueType; unit: string; cells: string; note?: string; supp?: boolean; pct?: boolean; table: string }

/** cells: 24 space-separated tokens; "-" = blank. Pregnancy may be "a/b/c" (trimesters). */
function column(c: Col) {
  const t = c.cells.trim().split(/\s+/);
  if (t.length !== 24) throw new Error(`${c.compound} ${c.type}: ${t.length} cells`);
  const from = (label: string) => `${c.table}, ${c.compound} ${c.type === 'RDA' ? 'RNI' : c.type}, ${label}`;
  const push = (sexes: Sex[], stage: LifeStage, age: Age, value: number, note: string | null, label: string) => {
    for (const sex of sexes) {
      out.push({
        compound: c.compound, valueType: c.type, sex, lifeStage: stage, ageMinMonths: age[0], ageMaxMonths: age[1], activityLevel: null,
        dietaryContext: null, value, valueMin: null, valueMax: c.type === 'CDRR' ? value : null, unit: c.unit, isPercentOfEnergy: c.pct ?? false,
        isProvisional: false, supplementalOnly: c.supp ?? false, note: [c.note, note].filter(Boolean).join(' ') || null, from: from(label),
      });
    }
  };
  const num = (s: string) => { const n = Number(s.replace(/,/g, '')); if (Number.isNaN(n)) throw new Error(`${c.compound} ${c.type}: "${s}"`); return n; };
  for (let i = 0; i < 22; i++) if (t[i] !== '-') push(ROWS[i].sexes, 'NONE', ROWS[i].age, num(t[i]), null, ROWS[i].label);

  for (const [idx, stageName, label] of [[PREG, 'PREGNANT', 'Pregnancy'], [LACT, 'LACTATING', 'Lactation']] as const) {
    const cell = t[idx];
    if (cell === '-') continue;
    const parts = cell.split('/');
    const stages: LifeStage[] = parts.length === 3 ? ['PREGNANT_T1', 'PREGNANT_T2', 'PREGNANT_T3']
      : parts.length === 2 ? ['PREGNANT_T2', 'PREGNANT_T3'] : [stageName];
    parts.forEach((p, k) => {
      const stage = stages[k];
      const tri = parts.length > 1 ? ` (${['first', 'second', 'third'][parts.length === 3 ? k : k + 1]} trimester)` : '';
      if (!p.startsWith('+')) { push(['FEMALE'], stage, [228, 599], num(p), null, `${label}${tri}`); return; }
      for (const [base, band, age] of [[F19, '19-29', [228, 359]], [F30, '30-49', [360, 599]]] as Array<[number, string, Age]>) {
        if (t[base] === '-') throw new Error(`${c.compound} ${c.type}: increment with no base`);
        push(['FEMALE'], stage, age, r4(num(t[base]) + num(p.slice(1))),
          `Printed as ${p}${tri} over women ${band} y (${t[base]}); stored as total.`, `${label}${tri} ${p} over Females ${band} y`);
      }
    });
  }
}

const T = {
  macro: 'Energy and Macronutrients (p. 256)', amino1: 'Energy and Macronutrients (p. 257)', amino2: 'Energy and Macronutrients (p. 258)',
  fat: 'Fat-soluble Vitamins (p. 259)', water1: 'Water-soluble Vitamins (p. 260)', water2: 'Water-soluble Vitamins (p. 261)',
  macroMin: 'Macrominerals (p. 262)', micro: 'Microminerals (p. 263)', micro2: 'Microminerals (p. 264)',
};
//                                                inf0-5 inf6-11 c1-2 c3-5 | M 6-8 9-11 12-14 15-18 19-29 30-49 50-64 65-74 75+ | F (same) | preg lact
const COLS: Col[] = [
  // ── p. 256 Energy and macronutrients ──
  { table: T.macro, compound: 'Energy', type: 'EER', unit: 'kcal', cells: '500 600 900 1400  1700 2000 2500 2700 2600 2500 2200 2000 1900  1500 1800 2000 2000 2000 1900 1700 1600 1500  +0/+340/+450 +340' },
  { table: T.macro, compound: 'Carbohydrates', type: 'EAR', unit: 'g', cells: '- - 100 100  100 100 100 100 100 100 100 100 100  100 100 100 100 100 100 100 100 100  +35 +60' },
  { table: T.macro, compound: 'Carbohydrates', type: 'RDA', unit: 'g', cells: '- - 130 130  130 130 130 130 130 130 130 130 130  130 130 130 130 130 130 130 130 130  +45 +80' },
  { table: T.macro, compound: 'Carbohydrates', type: 'AI', unit: 'g', cells: '60 90 - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.macro, compound: 'Dietary Fiber', type: 'AI', unit: 'g', cells: '- - 15 20  25 25 30 30 30 30 30 25 25  20 25 25 25 20 20 20 20 20  +5 +5', note: 'Total fiber.' },
  { table: T.macro, compound: 'Total Fat', type: 'AI', unit: 'g', cells: '25 25 - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.macro, compound: 'Linoleic Acid', type: 'AI', unit: 'g', cells: '5.0 7.0 4.5 7.0  9.0 9.5 12.0 14.0 13.0 11.5 9.0 7.0 5.0  7.0 9.0 9.0 10.0 10.0 8.5 7.0 4.5 3.0  +0 +0' },
  { table: T.macro, compound: 'Alpha-Linolenic Acid (ALA)', type: 'AI', unit: 'g', cells: '0.6 0.8 0.6 0.9  1.1 1.3 1.5 1.7 1.6 1.4 1.4 1.2 0.9  0.8 1.1 1.2 1.1 1.2 1.2 1.2 1.0 0.4  +0 +0' },
  { table: T.macro, compound: 'DHA (Docosahexaenoic Acid)', type: 'AI', unit: 'mg', cells: '200 300 - -  - - - - - - - - -  - - - - - - - - -  - -', note: 'Printed in the EPA+DHA column; footnoted as DHA for infants.' },
  // ── p. 257-258 Protein and amino acids ──
  { table: T.amino1, compound: 'Protein', type: 'EAR', unit: 'g', cells: '- 12 15 20  30 40 50 55 50 50 50 50 50  30 40 45 45 45 40 40 40 40  +12/+25 +20' },
  { table: T.amino1, compound: 'Protein', type: 'RDA', unit: 'g', cells: '- 15 20 25  35 50 60 65 65 65 60 60 60  35 45 55 55 55 50 50 50 50  +15/+30 +25' },
  { table: T.amino1, compound: 'Protein', type: 'AI', unit: 'g', cells: '10 - - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.amino1, compound: 'Leucine', type: 'EAR', unit: 'g', cells: '- 0.6 0.6 0.7  1.1 1.5 2.2 2.6 2.4 2.4 2.3 2.2 2.1  1.0 1.5 1.9 2.0 2.0 1.9 1.9 1.8 1.7  2.5 2.8' },
  { table: T.amino1, compound: 'Leucine', type: 'RDA', unit: 'g', cells: '- 0.8 0.8 1.0  1.3 1.9 2.7 3.2 3.1 3.1 2.8 2.8 2.7  1.3 1.8 2.4 2.4 2.5 2.4 2.3 2.2 2.1  3.1 3.5' },
  { table: T.amino1, compound: 'Leucine', type: 'AI', unit: 'g', cells: '1.0 - - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.amino1, compound: 'Isoleucine', type: 'EAR', unit: 'g', cells: '- 0.3 0.3 0.3  0.5 0.7 1.0 1.2 1.0 1.1 1.1 1.0 0.9  0.5 0.6 0.8 0.8 0.8 0.8 0.8 0.7 0.7  1.1 1.3' },
  { table: T.amino1, compound: 'Isoleucine', type: 'RDA', unit: 'g', cells: '- 0.4 0.4 0.4  0.6 0.8 1.2 1.4 1.4 1.4 1.3 1.3 1.1  0.6 0.7 1.0 1.1 1.1 1.0 1.1 0.9 0.9  1.4 1.7' },
  { table: T.amino1, compound: 'Isoleucine', type: 'AI', unit: 'g', cells: '0.6 - - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.amino1, compound: 'Valine', type: 'EAR', unit: 'g', cells: '- 0.3 0.4 0.4  0.6 0.9 1.2 1.5 1.4 1.4 1.3 1.3 1.1  0.6 0.9 1.2 1.2 1.1 1.0 1.1 0.9 0.9  1.4 1.6' },
  { table: T.amino1, compound: 'Valine', type: 'RDA', unit: 'g', cells: '- 0.5 0.5 0.5  0.7 1.1 1.6 1.8 1.7 1.7 1.6 1.6 1.5  0.7 1.1 1.4 1.4 1.3 1.4 1.3 1.3 1.1  1.7 1.9' },
  { table: T.amino1, compound: 'Valine', type: 'AI', unit: 'g', cells: '0.6 - - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.amino1, compound: 'Lysine', type: 'EAR', unit: 'g', cells: '- 0.6 0.6 0.6  1.0 1.4 2.1 2.3 2.5 2.4 2.3 2.2 2.2  0.9 1.3 1.8 1.8 2.1 2.0 1.9 1.8 1.7  2.3 2.5' },
  { table: T.amino1, compound: 'Lysine', type: 'RDA', unit: 'g', cells: '- 0.8 0.7 0.8  1.2 1.8 2.5 2.9 3.1 3.1 2.9 2.9 2.7  1.3 1.6 2.2 2.2 2.6 2.5 2.4 2.3 2.1  2.9 3.1' },
  { table: T.amino1, compound: 'Lysine', type: 'AI', unit: 'g', cells: '0.7 - - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.amino2, compound: 'Threonine', type: 'EAR', unit: 'g', cells: '- 0.3 0.3 0.3  0.5 0.7 1.0 1.2 1.1 1.2 1.1 1.1 1.0  0.5 0.6 0.9 0.9 0.9 0.9 0.8 0.8 0.7  1.2 1.3', note: 'Pregnancy/lactation per erratum (printed 3.0 / 3.7 in error).' },
  { table: T.amino2, compound: 'Threonine', type: 'RDA', unit: 'g', cells: '- 0.4 0.4 0.4  0.6 0.9 1.3 1.5 1.5 1.5 1.4 1.3 1.3  0.6 0.9 1.2 1.2 1.1 1.2 1.1 1.0 0.9  1.5 1.7', note: 'Pregnancy/lactation per erratum (printed 3.8 / 4.7 in error).' },
  { table: T.amino2, compound: 'Threonine', type: 'AI', unit: 'g', cells: '0.5 - - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.amino2, compound: 'Tryptophan', type: 'EAR', unit: 'g', cells: '- 0.1 0.1 0.1  0.1 0.2 0.3 0.3 0.3 0.3 0.3 0.2 0.2  0.1 0.2 0.2 0.2 0.2 0.2 0.2 0.2 0.2  0.3 0.4' },
  { table: T.amino2, compound: 'Tryptophan', type: 'RDA', unit: 'g', cells: '- 0.1 0.1 0.1  0.2 0.2 0.3 0.4 0.3 0.3 0.3 0.3 0.3  0.2 0.2 0.3 0.3 0.3 0.3 0.3 0.2 0.2  0.4 0.5' },
  { table: T.amino2, compound: 'Tryptophan', type: 'AI', unit: 'g', cells: '0.2 - - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.amino2, compound: 'Histidine', type: 'EAR', unit: 'g', cells: '- 0.2 0.2 0.2  0.3 0.5 0.7 0.9 0.8 0.7 0.7 0.7 0.7  0.3 0.4 0.6 0.6 0.6 0.6 0.6 0.5 0.5  0.8 0.8', note: 'Pregnancy/lactation per erratum (printed 1.2 / 1.3 in error).' },
  { table: T.amino2, compound: 'Histidine', type: 'RDA', unit: 'g', cells: '- 0.3 0.3 0.3  0.4 0.6 0.9 1.0 1.0 1.0 0.9 1.0 0.8  0.4 0.5 0.7 0.7 0.8 0.8 0.7 0.7 0.7  1.0 1.1', note: 'Pregnancy/lactation per erratum (printed 1.5 / 1.7 in error).' },
  { table: T.amino2, compound: 'Histidine', type: 'AI', unit: 'g', cells: '0.1 - - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.amino2, compound: 'Water', type: 'AI', unit: 'mL', cells: '700 800 1000 1500  1700 2000 2400 2600 2600 2500 2200 2100 2100  1600 1900 2000 2000 2100 2000 1900 1800 1800  2300 2800', note: 'Total water.' },
  // ── p. 259 Fat-soluble vitamins ──
  { table: T.fat, compound: 'Vitamin A (RAE)', type: 'EAR', unit: 'µg RAE', cells: '- - 190 230  310 410 530 620 570 560 530 510 500  290 390 480 450 460 450 430 410 410  +50 +350' },
  { table: T.fat, compound: 'Vitamin A (RAE)', type: 'RDA', unit: 'µg RAE', cells: '- - 250 300  450 600 750 850 800 800 750 700 700  400 550 650 650 650 650 600 600 600  +70 +490' },
  { table: T.fat, compound: 'Vitamin A (RAE)', type: 'AI', unit: 'µg RAE', cells: '350 450 - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.fat, compound: 'Vitamin A (RAE)', type: 'UL', unit: 'µg RAE', cells: '600 600 600 750  1100 1600 2300 2800 3000 3000 3000 3000 3000  1100 1600 2300 2800 3000 3000 3000 3000 3000  3000 3000' },
  { table: T.fat, compound: 'Vitamin D (Total)', type: 'AI', unit: 'µg', cells: '5 5 5 5  5 5 10 10 10 10 10 15 15  5 5 10 10 10 10 10 15 15  +0 +0' },
  { table: T.fat, compound: 'Vitamin D (Total)', type: 'UL', unit: 'µg', cells: '25 25 30 35  40 60 100 100 100 100 100 100 100  40 60 100 100 100 100 100 100 100  100 100' },
  { table: T.fat, compound: 'Vitamin E (Total)', type: 'AI', unit: 'mg α-TE', cells: '3 4 5 6  7 9 11 12 12 12 12 12 12  7 9 11 12 12 12 12 12 12  +0 +3' },
  { table: T.fat, compound: 'Vitamin E (Total)', type: 'UL', unit: 'mg α-TE', cells: '- - 100 150  200 300 400 500 540 540 540 540 540  200 300 400 500 540 540 540 540 540  540 540' },
  { table: T.fat, compound: 'Vitamin K (Total)', type: 'AI', unit: 'µg', cells: '4 6 25 30  40 55 70 80 75 75 75 75 75  40 55 65 65 65 65 65 65 65  +0 +0' },
  // ── p. 260 Water-soluble vitamins ──
  { table: T.water1, compound: 'Vitamin C (Total)', type: 'EAR', unit: 'mg', cells: '- - 30 35  40 55 70 80 75 75 75 75 75  40 55 70 80 75 75 75 75 75  +10 +35' },
  { table: T.water1, compound: 'Vitamin C (Total)', type: 'RDA', unit: 'mg', cells: '- - 40 45  50 70 90 100 100 100 100 100 100  50 70 90 100 100 100 100 100 100  +10 +40' },
  { table: T.water1, compound: 'Vitamin C (Total)', type: 'AI', unit: 'mg', cells: '40 55 - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.water1, compound: 'Vitamin C (Total)', type: 'UL', unit: 'mg', cells: '- - 340 510  750 1100 1400 1600 2000 2000 2000 2000 2000  750 1100 1400 1600 2000 2000 2000 2000 2000  2000 2000' },
  { table: T.water1, compound: 'Thiamin (B1)', type: 'EAR', unit: 'mg', cells: '- - 0.4 0.4  0.5 0.7 0.9 1.1 1.0 1.0 1.0 0.9 0.9  0.6 0.8 0.9 0.9 0.9 0.9 0.9 0.8 0.7  +0.4 +0.3' },
  { table: T.water1, compound: 'Thiamin (B1)', type: 'RDA', unit: 'mg', cells: '- - 0.4 0.5  0.7 0.9 1.1 1.3 1.2 1.2 1.2 1.1 1.1  0.7 0.9 1.1 1.1 1.1 1.1 1.1 1.0 0.8  +0.4 +0.4' },
  { table: T.water1, compound: 'Thiamin (B1)', type: 'AI', unit: 'mg', cells: '0.2 0.3 - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.water1, compound: 'Riboflavin (B2)', type: 'EAR', unit: 'mg', cells: '- - 0.4 0.5  0.7 0.9 1.2 1.4 1.3 1.3 1.3 1.2 1.1  0.6 0.8 1.0 1.0 1.0 1.0 1.0 0.9 0.8  +0.3 +0.4' },
  { table: T.water1, compound: 'Riboflavin (B2)', type: 'RDA', unit: 'mg', cells: '- - 0.5 0.6  0.9 1.1 1.5 1.7 1.5 1.5 1.5 1.4 1.3  0.8 1.0 1.2 1.2 1.2 1.2 1.2 1.1 1.0  +0.4 +0.5' },
  { table: T.water1, compound: 'Riboflavin (B2)', type: 'AI', unit: 'mg', cells: '0.3 0.4 - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.water1, compound: 'Niacin (B3)', type: 'EAR', unit: 'mg NE', cells: '- - 4 5  7 9 11 13 12 12 12 11 10  7 9 11 11 11 11 11 10 9  +3 +2' },
  { table: T.water1, compound: 'Niacin (B3)', type: 'RDA', unit: 'mg NE', cells: '- - 6 7  9 11 15 17 16 16 16 14 13  9 12 15 14 14 14 14 13 12  +4 +3' },
  { table: T.water1, compound: 'Niacin (B3)', type: 'AI', unit: 'mg NE', cells: '2 3 - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.water1, compound: 'Nicotinic Acid', type: 'UL', unit: 'mg', supp: true, note: 'Printed as niacin UL "nicotinic acid/nicotinamide"; set for supplements and fortified foods.', cells: '- - 10 10  15 20 25 30 35 35 35 35 35  15 20 25 30 35 35 35 35 35  35 35' },
  { table: T.water1, compound: 'Nicotinamide', type: 'UL', unit: 'mg', supp: true, note: 'Printed as niacin UL "nicotinic acid/nicotinamide"; set for supplements and fortified foods.', cells: '- - 180 250  350 500 700 800 1000 1000 1000 1000 1000  350 500 700 800 1000 1000 1000 1000 1000  1000 1000' },
  // ── p. 261 Water-soluble vitamins ──
  { table: T.water2, compound: 'Vitamin B6', type: 'EAR', unit: 'mg', cells: '- - 0.5 0.6  0.7 0.9 1.3 1.3 1.3 1.3 1.3 1.3 1.3  0.7 0.9 1.2 1.2 1.2 1.2 1.2 1.2 1.2  +0.7 +0.7' },
  { table: T.water2, compound: 'Vitamin B6', type: 'RDA', unit: 'mg', cells: '- - 0.6 0.7  0.9 1.1 1.5 1.5 1.5 1.5 1.5 1.5 1.5  0.9 1.1 1.4 1.4 1.4 1.4 1.4 1.4 1.4  +0.8 +0.8' },
  { table: T.water2, compound: 'Vitamin B6', type: 'AI', unit: 'mg', cells: '0.1 0.3 - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.water2, compound: 'Vitamin B6', type: 'UL', unit: 'mg', cells: '- - 20 30  45 60 80 95 100 100 100 100 100  45 60 80 95 100 100 100 100 100  100 100' },
  { table: T.water2, compound: 'Folate (Total)', type: 'EAR', unit: 'µg DFE', cells: '- - 120 150  180 250 300 330 320 320 320 320 320  180 250 300 330 320 320 320 320 320  +200 +130' },
  { table: T.water2, compound: 'Folate (Total)', type: 'RDA', unit: 'µg DFE', cells: '- - 150 180  220 300 360 400 400 400 400 400 400  220 300 360 400 400 400 400 400 400  +220 +150', note: 'Women of childbearing age are also recommended a 400 µg DFE/d folic acid supplement.' },
  { table: T.water2, compound: 'Folate (Total)', type: 'AI', unit: 'µg DFE', cells: '65 90 - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.water2, compound: 'Folic Acid (Synthetic)', type: 'UL', unit: 'µg', supp: true, note: 'Printed as folate UL (µg DFE); applies only to folic acid from supplements or fortified foods.', cells: '- - 300 400  500 600 800 900 1000 1000 1000 1000 1000  500 600 800 900 1000 1000 1000 1000 1000  1000 1000' },
  { table: T.water2, compound: 'Vitamin B12 (Total)', type: 'EAR', unit: 'µg', cells: '- - 0.8 0.9  1.1 1.5 1.9 2.0 2.0 2.0 2.0 2.0 2.0  1.1 1.5 1.9 2.0 2.0 2.0 2.0 2.0 2.0  +0.2 +0.3' },
  { table: T.water2, compound: 'Vitamin B12 (Total)', type: 'RDA', unit: 'µg', cells: '- - 0.9 1.1  1.3 1.7 2.3 2.4 2.4 2.4 2.4 2.4 2.4  1.3 1.7 2.3 2.4 2.4 2.4 2.4 2.4 2.4  +0.2 +0.4' },
  { table: T.water2, compound: 'Vitamin B12 (Total)', type: 'AI', unit: 'µg', cells: '0.3 0.5 - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.water2, compound: 'Pantothenic Acid (B5)', type: 'AI', unit: 'mg', cells: '1.7 1.9 2 2  3 4 5 5 5 5 5 5 5  3 4 5 5 5 5 5 5 5  +1.0 +2.0' },
  { table: T.water2, compound: 'Biotin (B7)', type: 'AI', unit: 'µg', cells: '5 7 9 12  15 20 25 30 30 30 30 30 30  15 20 25 30 30 30 30 30 30  +0 +5' },
  // ── p. 262 Macrominerals ──
  { table: T.macroMin, compound: 'Calcium', type: 'EAR', unit: 'mg', cells: '- - 400 500  600 650 800 750 650 650 600 600 600  600 650 750 700 550 550 600 600 600  +0 +0' },
  { table: T.macroMin, compound: 'Calcium', type: 'RDA', unit: 'mg', cells: '- - 500 600  700 800 1000 900 800 800 750 700 700  700 800 900 800 700 700 800 800 800  +0 +0' },
  { table: T.macroMin, compound: 'Calcium', type: 'AI', unit: 'mg', cells: '250 300 - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.macroMin, compound: 'Calcium', type: 'UL', unit: 'mg', cells: '1000 1500 2500 2500  2500 3000 3000 3000 2500 2500 2000 2000 2000  2500 3000 3000 3000 2500 2500 2000 2000 2000  2500 2500' },
  { table: T.macroMin, compound: 'Phosphorus', type: 'EAR', unit: 'mg', cells: '- - 380 480  500 1000 1000 1000 580 580 580 580 580  480 1000 1000 1000 580 580 580 580 580  +0 +0' },
  { table: T.macroMin, compound: 'Phosphorus', type: 'RDA', unit: 'mg', cells: '- - 450 550  600 1200 1200 1200 700 700 700 700 700  550 1200 1200 1200 700 700 700 700 700  +0 +0' },
  { table: T.macroMin, compound: 'Phosphorus', type: 'AI', unit: 'mg', cells: '100 300 - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.macroMin, compound: 'Phosphorus', type: 'UL', unit: 'mg', cells: '- - 3000 3000  3000 3500 3500 3500 3500 3500 3500 3500 3000  3000 3500 3500 3500 3500 3500 3500 3500 3000  3000 3500' },
  { table: T.macroMin, compound: 'Sodium', type: 'AI', unit: 'mg', cells: '110 370 810 1000  1200 1500 1500 1500 1500 1500 1500 1300 1100  1200 1500 1500 1500 1500 1500 1500 1300 1100  1500 1500' },
  { table: T.macroMin, compound: 'Sodium', type: 'CDRR', unit: 'mg', cells: '- - 1200 1600  1900 2300 2300 2300 2300 2300 2300 2100 1700  1900 2300 2300 2300 2300 2300 2300 2100 1700  2300 2300' },
  { table: T.macroMin, compound: 'Chloride', type: 'AI', unit: 'mg', cells: '170 560 1200 1600  1900 2300 2300 2300 2300 2300 2300 2100 1700  1900 2300 2300 2300 2300 2300 2300 2100 1700  2300 2300' },
  { table: T.macroMin, compound: 'Potassium', type: 'AI', unit: 'mg', cells: '400 700 1900 2400  2900 3400 3500 3500 3500 3500 3500 3500 3500  2900 3400 3500 3500 3500 3500 3500 3500 3500  +0 +400' },
  { table: T.macroMin, compound: 'Magnesium', type: 'EAR', unit: 'mg', cells: '- - 60 90  130 190 260 340 300 310 310 310 310  130 180 240 290 230 240 240 240 240  +30 +0' },
  { table: T.macroMin, compound: 'Magnesium', type: 'RDA', unit: 'mg', cells: '- - 70 110  150 220 320 410 360 370 370 370 370  150 220 290 340 280 280 280 280 280  +40 +0' },
  { table: T.macroMin, compound: 'Magnesium', type: 'AI', unit: 'mg', cells: '25 55 - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.macroMin, compound: 'Magnesium', type: 'UL', unit: 'mg', supp: true, note: 'Only for non-food magnesium sources.', cells: '- - 60 90  130 190 270 350 350 350 350 350 350  130 190 270 350 350 350 350 350 350  350 350' },
  // ── p. 263 Microminerals ──
  { table: T.micro, compound: 'Iron (Total)', type: 'EAR', unit: 'mg', cells: '- 4 4.5 5  7 8 11 11 8 8 8 7 7  7 8 12 11 11 11 6 6 5  +8 +0' },
  { table: T.micro, compound: 'Iron (Total)', type: 'RDA', unit: 'mg', cells: '- 6 6 7  9 11 14 14 10 10 10 9 9  9 10 16 14 14 14 8 8 7  +10 +0' },
  { table: T.micro, compound: 'Iron (Total)', type: 'AI', unit: 'mg', cells: '0.3 - - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.micro, compound: 'Iron (Total)', type: 'UL', unit: 'mg', cells: '40 40 40 40  40 40 40 45 45 45 45 45 45  40 40 40 45 45 45 45 45 45  45 45' },
  { table: T.micro, compound: 'Zinc', type: 'EAR', unit: 'mg', cells: '- 2 2 3  5 7 7 8 9 8 8 8 7  4 7 6 7 7 7 6 6 6  +2.0 +4.0' },
  { table: T.micro, compound: 'Zinc', type: 'RDA', unit: 'mg', cells: '- 3 3 4  5 8 8 10 10 10 10 9 9  5 8 8 9 8 8 8 7 7  +2.5 +5.0' },
  { table: T.micro, compound: 'Zinc', type: 'AI', unit: 'mg', cells: '2 - - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.micro, compound: 'Zinc', type: 'UL', unit: 'mg', cells: '- - 6 9  13 19 27 33 35 35 35 35 35  13 19 27 33 35 35 35 35 35  35 35' },
  { table: T.micro, compound: 'Copper', type: 'EAR', unit: 'µg', cells: '- - 220 270  360 470 600 700 650 650 650 600 600  310 420 500 550 500 500 500 460 460  +100 +370' },
  { table: T.micro, compound: 'Copper', type: 'RDA', unit: 'µg', cells: '- - 290 350  470 600 800 900 850 850 850 800 800  400 550 650 700 650 650 650 600 600  +130 +480' },
  { table: T.micro, compound: 'Copper', type: 'AI', unit: 'µg', cells: '240 330 - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.micro, compound: 'Copper', type: 'UL', unit: 'µg', cells: '- - 1700 2600  3700 5500 7500 9500 10000 10000 10000 10000 10000  3700 5500 7500 9500 10000 10000 10000 10000 10000  10000 10000' },
  { table: T.micro, compound: 'Fluoride', type: 'AI', unit: 'mg', cells: '0.01 0.4 0.6 0.9  1.3 1.9 2.6 3.2 3.4 3.4 3.2 3.1 3.0  1.3 1.8 2.4 2.7 2.8 2.7 2.6 2.5 2.3  +0 +0' },
  { table: T.micro, compound: 'Fluoride', type: 'UL', unit: 'mg', cells: '0.6 0.8 1.2 1.8  2.6 10.0 10.0 10.0 10.0 10.0 10.0 10.0 10.0  2.5 10.0 10.0 10.0 10.0 10.0 10.0 10.0 10.0  10.0 10.0' },
  { table: T.micro, compound: 'Manganese', type: 'AI', unit: 'mg', cells: '0.01 0.8 1.5 2.0  2.5 3.0 4.0 4.0 4.0 4.0 4.0 4.0 4.0  2.5 3.0 3.5 3.5 3.5 3.5 3.5 3.5 3.5  +0 +0' },
  { table: T.micro, compound: 'Manganese', type: 'UL', unit: 'mg', cells: '- - 2.0 3.0  4.0 6.0 8.0 10.0 11.0 11.0 11.0 11.0 11.0  4.0 6.0 8.0 10.0 11.0 11.0 11.0 11.0 11.0  11.0 11.0' },
  { table: T.micro, compound: 'Iodine', type: 'EAR', unit: 'µg', cells: '- - 55 65  75 85 90 95 95 95 95 95 95  75 80 90 95 95 95 95 95 95  +65 +130' },
  { table: T.micro, compound: 'Iodine', type: 'RDA', unit: 'µg', cells: '- - 80 90  100 110 130 130 150 150 150 150 150  100 110 130 130 150 150 150 150 150  +90 +190' },
  { table: T.micro, compound: 'Iodine', type: 'AI', unit: 'µg', cells: '130 180 - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.micro, compound: 'Iodine', type: 'UL', unit: 'µg', cells: '250 250 300 300  500 500 1900 2200 2400 2400 2400 2400 2400  500 500 1900 2200 2400 2400 2400 2400 2400  - -' },
  // ── p. 264 Microminerals ──
  { table: T.micro2, compound: 'Selenium', type: 'EAR', unit: 'µg', cells: '- - 19 22  30 40 50 55 50 50 50 50 50  30 40 50 55 50 50 50 50 50  +3 +9' },
  { table: T.micro2, compound: 'Selenium', type: 'RDA', unit: 'µg', cells: '- - 23 25  35 45 60 65 60 60 60 60 60  35 45 60 65 60 60 60 60 60  +4 +10' },
  { table: T.micro2, compound: 'Selenium', type: 'AI', unit: 'µg', cells: '9 12 - -  - - - - - - - - -  - - - - - - - - -  - -' },
  { table: T.micro2, compound: 'Selenium', type: 'UL', unit: 'µg', cells: '40 65 70 100  150 200 300 300 400 400 400 400 400  150 200 300 300 400 400 400 400 400  400 400' },
  { table: T.micro2, compound: 'Molybdenum', type: 'EAR', unit: 'µg', cells: '- - 8 10  15 15 25 25 25 25 25 23 23  15 15 20 20 20 20 20 18 18  +0 +3' },
  { table: T.micro2, compound: 'Molybdenum', type: 'RDA', unit: 'µg', cells: '- - 10 12  18 18 30 30 30 30 30 28 28  18 18 25 25 25 25 25 22 22  +0 +3' },
  { table: T.micro2, compound: 'Molybdenum', type: 'UL', unit: 'µg', cells: '- - 100 150  200 300 450 550 600 600 550 550 550  200 300 400 500 500 500 450 450 450  500 500' },
  { table: T.micro2, compound: 'Chromium', type: 'AI', unit: 'µg', cells: '0.2 4.0 10 10  15 20 30 35 30 30 30 25 25  15 20 20 20 20 20 20 20 20  +5 +20' },
];
for (const c of COLS) column(c);

// ── p. 255 AMDR (% energy), sugars and cholesterol notes ──
{
  const t = 'Acceptable Macronutrient Distribution Ranges (p. 255)';
  const pct = (compound: string, type: DvValueType, sexes: Sex[], stage: LifeStage, age: Age, lo: number | null, hi: number, label: string, note?: string) => {
    for (const sex of sexes) out.push({
      compound, valueType: type, sex, lifeStage: stage, ageMinMonths: age[0], ageMaxMonths: age[1], activityLevel: null, dietaryContext: null,
      value: lo == null ? hi : r4((lo + hi) / 2), valueMin: lo, valueMax: hi, unit: '%', isPercentOfEnergy: true, isProvisional: false,
      supplementalOnly: false, note: note ?? null, from: `${t}, ${label}`,
    });
  };
  const BOTH: Sex[] = ['MALE', 'FEMALE'];
  const F: Sex[] = ['FEMALE'];
  const lessThan = 'Printed "Less than" in the AMDR table.';
  pct('Carbohydrates', 'AMDR', BOTH, 'NONE', [12, null], 55, 65, 'Carbohydrate 55-65, 1-2 y and older');
  pct('Protein', 'AMDR', BOTH, 'NONE', [12, null], 7, 20, 'Protein 7-20, 1-2 y and older');
  pct('Total Fat', 'AMDR', BOTH, 'NONE', [12, 35], 20, 35, 'Fat 20-35, 1-2 y');
  pct('Total Fat', 'AMDR', BOTH, 'NONE', [36, null], 15, 30, 'Fat 15-30, 3-5 y and older');
  pct('Saturated Fat', 'CDRR', BOTH, 'NONE', [36, 227], null, 8, 'Saturated fatty acid less than 8, 3-18 y', lessThan);
  pct('Saturated Fat', 'CDRR', BOTH, 'NONE', [228, null], null, 7, 'Saturated fatty acid less than 7, 19 y and older', lessThan);
  pct('Trans Fat', 'CDRR', BOTH, 'NONE', [36, null], null, 1, 'Trans fatty acid less than 1, 3-5 y and older', lessThan);
  for (const [stage, label] of [['PREGNANT', 'Pregnancy'], ['LACTATING', 'Lactation']] as const) {
    pct('Carbohydrates', 'AMDR', F, stage, [228, 599], 55, 65, `Carbohydrate 55-65, ${label}`);
    pct('Protein', 'AMDR', F, stage, [228, 599], 7, 20, `Protein 7-20, ${label}`);
    pct('Total Fat', 'AMDR', F, stage, [228, 599], 15, 30, `Fat 15-30, ${label}`);
  }
  const sugarAge = 'The statement carries no age; stored from 1 year.';
  pct('Total Sugars', 'AMDR', BOTH, 'NONE', [12, null], 10, 20, 'Sugars: total sugar intake 10-20% of daily calories', sugarAge);
  pct('Added Sugars', 'CDRR', BOTH, 'NONE', [12, null], null, 10, 'Sugars: added sugars no more than 10 percent of energy', `Simple sugars, HFCS, starch syrup, molasses, honey, syrup and concentrated fruit juice. ${sugarAge}`);
  for (const sex of BOTH) out.push({
    compound: 'Cholesterol', valueType: 'CDRR', sex, lifeStage: 'NONE', ageMinMonths: 228, ageMaxMonths: null, activityLevel: null, dietaryContext: null,
    value: 300, valueMin: null, valueMax: 300, unit: 'mg', isPercentOfEnergy: false, isProvisional: false, supplementalOnly: false,
    note: 'Recommended less than 300 mg/d for adults aged 19 years or older (AMDR table footnote).', from: `${t}, footnote 1, Cholesterol`,
  });
}

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths);
writeFileSync(path.join(process.cwd(), 'dv-sources', 'kdri-2020', 'values.json'), JSON.stringify(out, null, 1) + '\n');
const byType: Record<string, number> = {};
for (const v of out) byType[v.valueType] = (byType[v.valueType] ?? 0) + 1;
console.log(`Wrote ${out.length} values to dv-sources/kdri-2020/values.json`, byType);
