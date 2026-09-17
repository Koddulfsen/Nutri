/**
 * Philippines — FNRI-DOST Philippine Dietary Reference Intakes 2015: Summary Tables (revised September 2018)
 * -> values.json.
 *
 * Transcribed 2026-09-17 from pdri-2015-summary-tables.pdf (7 pages; renders in source/pdri-1.png ... pdri-7.png).
 * The RNI tables (pp. 2-4) mark Recommended Nutrient Intakes in bold and Adequate Intakes in italics, so rows were read
 * with each span's font (PyMuPDF; dump in source/pdri-2015-spans.txt): a cell suffixed "i" below is italic (AI), unsuffixed
 * is bold (RNI). Every row string below was diffed against that dump; each page was checked against its render.
 *
 * Tables and mapping:
 *   p.1 Recommended Energy Intakes -> EER (kcal); Acceptable Macronutrient Distribution Ranges -> AMDR (% energy, range
 *       stored as midpoint with min/max; the infant 0-5 mo protein "5" as a single value).
 *   p.2 macronutrient RNIs: protein (RNI, g); α-linolenic and linoleic acid (AI, % energy); dietary fibre (AI, g range);
 *       water (AI, mL).
 *   p.3 vitamin RNIs/AIs; p.4 mineral RNIs/AIs; p.5 EARs; p.6 ULs; p.7 additional recommendations (WHO) -> CDRR.
 *
 * Decisions:
 *   - Age bands: 0-5, 6-11 mo; 1-2, 3-5, 6-9, 10-12, 13-15, 16-18, 19-29, 30-49, 50-59, 60-69, >=70 y. AMDR bands
 *     0-5, 6-11 mo, 1-2, 3-18, >=19 y. UL bands as printed (1-2, 3, 4-5, 6-8, 9, 10-12, 13, 14-15, 16-18, 19-29, 30-49,
 *     50-59, 60-70, >70; pregnant/lactating 14-18 and >=19). Body weights are not stored.
 *   - Pregnancy/lactation increments ("+x") stored as totals over women 19-29 and 30-49 y. Energy "+300" is for the 2nd and
 *     3rd trimesters only, and calcium "+50" for the 3rd only: stored per trimester (PREGNANT_T1..T3), the other trimesters
 *     at the non-pregnant value. The EAR table prints absolute pregnancy/lactation values, stored for women 19-49 y.
 *   - Iron in parentheses ("(28)", "(+10)"): requirement cannot be met by usual diet alone; iron-rich and fortified foods
 *     and supplements recommended. Stored with that note.
 *   - UL: vitamin A as preformed only -> Retinol. Vitamin E, niacin, folate and calcium ULs apply to synthetic forms from
 *     supplements/fortified foods and magnesium to pharmacologic agents (footnote b) -> supplementalOnly (folate UL as
 *     Folic Acid (Synthetic)). "c" (not established) not stored. Phosphorus for pregnant/lactating women: 3,500 / 4,000 mg
 *     (footnote e, 14-50 y). Vitamin E adult UL footnote d noted.
 *   - p.7 (from WHO guidelines): free sugars <10% energy (children and adults, stored from 1 y), sodium <2 g and
 *     potassium >=3,510 mg (adults, from 19 y). The children's extrapolation by energy intake is a formula, not stored.
 *
 * Run: npx tsx dv-sources/pdri-2015/extract.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
const out: SourceValue[] = [];
const BOTH: Sex[] = ['MALE', 'FEMALE'];
const r4 = (n: number) => Math.round(n * 10000) / 10000;

interface P { compound: string; type: DvValueType; sexes: Sex[]; stage?: LifeStage; age: Age; value: number; min?: number; max?: number; unit: string; pct?: boolean; supp?: boolean; note?: string | null; from: string }
function push(p: P) {
  for (const sex of p.sexes) out.push({
    compound: p.compound, valueType: p.type, sex, lifeStage: p.stage ?? 'NONE', ageMinMonths: p.age[0], ageMaxMonths: p.age[1], activityLevel: null,
    dietaryContext: null, value: p.value, valueMin: p.min ?? null, valueMax: p.max ?? null, unit: p.unit, isPercentOfEnergy: p.pct ?? false,
    isProvisional: false, supplementalOnly: p.supp ?? false, note: p.note ?? null, from: p.from,
  });
}
const num = (s: string) => { const v = Number(s.replace(/,/g, '')); if (Number.isNaN(v)) throw new Error(`number "${s}"`); return v; };

const AGE: Record<string, Age> = {
  '0–5': [0, 5], '6–11': [6, 11], '1–2': [12, 35], '3–5': [36, 71], '6–9': [72, 119], '10–12': [120, 155], '13–15': [156, 191],
  '16–18': [192, 227], '19–29': [228, 359], '30–49': [360, 599], '50–59': [600, 719], '60–69': [720, 839], '≥ 70': [840, null],
};
const LABELS = Object.keys(AGE);
const W19 = '19–29'; const W30 = '30–49';
const FE_PAREN = 'Requirement cannot be met by usual diet alone; iron-rich and iron-fortified foods and supplements are recommended if necessary.';

interface Col { compound: string; unit: string; sexed: boolean; pct?: boolean; range?: boolean; note?: string }
/** A cell: "-" blank; suffix "i" = italic (AI), else bold (RNI); "(x)" iron footnote; "a–b" range. */
function cell(tok: string) {
  let s = tok; let type: DvValueType = 'RDA'; let paren = false;
  if (s.endsWith('i')) { type = 'AI'; s = s.slice(0, -1); }
  if (s.startsWith('(') && s.endsWith(')')) { paren = true; s = s.slice(1, -1); }
  return { s, type, paren };
}

/**
 * RNI table: rows of cells in column order (a sexed column takes M F, else one cell), then Pregnant/Lactating rows with one
 * increment per column. triOnly maps a column to the trimesters its pregnancy increment applies to.
 */
function rniTable(page: string, cols: Col[], rows: Array<[string, string]>, triOnly: Record<string, LifeStage[]> = {}) {
  const width = cols.reduce((n, c) => n + (c.sexed ? 2 : 1), 0);
  const women: Record<string, Record<string, { value: number; type: DvValueType; paren: boolean }>> = {};
  for (const [label, text] of rows) {
    const t = text.split(' ');
    if (label === 'Pregnant' || label === 'Lactating') {
      if (t.length !== cols.length) throw new Error(`${page} ${label}: ${t.length} cells for ${cols.length} columns`);
      cols.forEach((c, i) => {
        if (t[i] === '-') return;
        let { s, type, paren } = cell(t[i]);
        let star = false;
        if (s.endsWith('*')) { star = true; s = s.slice(0, -1); }
        if (!s.startsWith('+')) throw new Error(`${page} ${label} ${c.compound}: "${t[i]}"`);
        const inc = num(s.slice(1));
        const stages: Array<[LifeStage, number]> = label === 'Lactating' ? [['LACTATING', inc]]
          : triOnly[c.compound] ? (['PREGNANT_T1', 'PREGNANT_T2', 'PREGNANT_T3'] as LifeStage[]).map((st) => [st, triOnly[c.compound].includes(st) ? inc : 0])
          : [['PREGNANT', inc]];
        for (const [stage, add] of stages) for (const band of [W19, W30]) {
          const base = women[band][c.compound];
          const printed = `${paren ? `(${s})` : s}${star ? '*' : ''}`;
          const notes = [c.note, paren || base.paren ? FE_PAREN : null,
            triOnly[c.compound] && label === 'Pregnant' ? (add ? `Increment applies to the ${triOnly[c.compound].length === 1 ? '3rd trimester' : '2nd and 3rd trimesters'} only.` : `No increment in this trimester (printed ${printed} applies to the ${triOnly[c.compound].length === 1 ? '3rd trimester' : '2nd and 3rd trimesters'} only).`) : null,
            `Printed as ${printed} over women ${band.replace('–', '-')} y (${base.value}); stored as total.`];
          push({ compound: c.compound, type, sexes: ['FEMALE'], stage, age: AGE[band], value: r4(base.value + add), unit: c.unit, pct: c.pct,
            note: notes.filter(Boolean).join(' '), from: `${page}, ${c.compound}, ${label} ${printed} over women ${band} y` });
        }
      });
      continue;
    }
    if (t.length !== width) throw new Error(`${page} ${label}: ${t.length} cells for ${width}`);
    let k = 0;
    for (const c of cols) {
      const sexCells: Array<[Sex[], string]> = c.sexed ? [[['MALE'], t[k]], [['FEMALE'], t[k + 1]]] : [[BOTH, t[k]]];
      k += c.sexed ? 2 : 1;
      for (const [sexes, tok] of sexCells) {
        if (tok === '-') continue;
        const { s, type, paren } = cell(tok);
        let value: number; let min: number | undefined; let max: number | undefined;
        if (c.range && s.includes('–')) { [min, max] = s.split('–').map(num); value = (min + max) / 2; } else value = num(s);
        const note = [c.note, paren ? FE_PAREN : null].filter(Boolean).join(' ') || null;
        push({ compound: c.compound, type, sexes, age: AGE[label], value, min, max, unit: c.unit, pct: c.pct, note,
          from: `${page}, ${c.compound}, ${label}${c.sexed ? (sexes[0] === 'MALE' ? ' M' : ' F') : ''}` });
        if (sexes.includes('FEMALE') && (label === W19 || label === W30)) (women[label] ??= {})[c.compound] = { value, type, paren };
      }
    }
  }
}

// ── p.1 Recommended Energy Intakes (weights dropped) and AMDR ──
{
  const pg = 'p.1 Recommended Energy Intakes';
  const rows: Array<[string, number, number]> = [
    ['0–5', 620, 560], ['6–11', 720, 630], ['1–2', 1000, 920], ['3–5', 1350, 1260], ['6–9', 1600, 1470], ['10–12', 2060, 1980], ['13–15', 2700, 2170],
    ['16–18', 3010, 2280], ['19–29', 2530, 1930], ['30–49', 2420, 1870], ['50–59', 2420, 1870], ['60–69', 2140, 1610], ['≥ 70', 1960, 1540],
  ];
  for (const [label, m, f] of rows) {
    push({ compound: 'Energy', type: 'EER', sexes: ['MALE'], age: AGE[label], value: m, unit: 'kcal', from: `${pg}, ${label} M` });
    push({ compound: 'Energy', type: 'EER', sexes: ['FEMALE'], age: AGE[label], value: f, unit: 'kcal', from: `${pg}, ${label} F` });
  }
  for (const band of [W19, W30]) {
    const base = rows.find((r) => r[0] === band)![2];
    for (const [stage, add, note] of [['PREGNANT_T1', 0, 'No increment in the 1st trimester (+300 applies to the 2nd and 3rd trimesters only).'],
      ['PREGNANT_T2', 300, 'Increment applies to the 2nd and 3rd trimesters only.'], ['PREGNANT_T3', 300, 'Increment applies to the 2nd and 3rd trimesters only.'],
      ['LACTATING', 500, null]] as Array<[LifeStage, number, string | null]>) {
      push({ compound: 'Energy', type: 'EER', sexes: ['FEMALE'], stage, age: AGE[band], value: base + add, unit: 'kcal',
        note: [note, `Printed as +${stage === 'LACTATING' ? 500 : 300} over women ${band.replace('–', '-')} y (${base}); stored as total.`].join(' '),
        from: `${pg}, ${stage === 'LACTATING' ? 'Lactating +500' : 'Pregnant +300*'} over women ${band} y` });
    }
  }
  const pa = 'p.1 Acceptable Macronutrient Distribution Ranges';
  const amdr: Array<[string, Age, string, string, string]> = [
    ['0–5 mo', [0, 5], '5', '40–60', '35–55'], ['6–11 mo', [6, 11], '8–15', '30–40', '45–62'], ['1–2 y', [12, 35], '6–15', '25–35', '50–69'],
    ['3–18 y', [36, 227], '6–15', '15–30', '55–79'], ['≥ 19 y', [228, null], '10–15', '15–30', '55–75'],
  ];
  for (const [label, age, ...cells] of amdr) {
    (['Protein', 'Total Fat', 'Carbohydrates'] as const).forEach((compound, i) => {
      const s = cells[i];
      const note = compound === 'Carbohydrates' ? 'The carbohydrate AMDR is the energy remaining after protein and fat, hence the wide ranges.' : null;
      if (s.includes('–')) {
        const [min, max] = s.split('–').map(num);
        push({ compound, type: 'AMDR', sexes: BOTH, age, value: (min + max) / 2, min, max, unit: '%E', pct: true, note, from: `${pa}, ${compound}, ${label}` });
      } else push({ compound, type: 'AMDR', sexes: BOTH, age, value: num(s), unit: '%E', pct: true, note, from: `${pa}, ${compound}, ${label}` });
    });
  }
}

// ── p.2 RNI macronutrients (weight and energy columns dropped; energy is p.1) ──
rniTable('p.2 RNI (Macronutrients)', [
  { compound: 'Protein', unit: 'g', sexed: true },
  { compound: 'Alpha-Linolenic Acid (ALA)', unit: '%E', sexed: false, pct: true },
  { compound: 'Linoleic Acid', unit: '%E', sexed: false, pct: true },
  { compound: 'Dietary Fiber', unit: 'g', sexed: false, range: true },
  { compound: 'Water', unit: 'mL', sexed: true },
], [
  ['0–5', '9 8 0.5i 4.5i - 680i 680i'],
  ['6–11', '17 15 0.5i 4.5i - 890i 890i'],
  ['1–2', '18 17 0.5i 3.0i 6–7i 1000i 920i'],
  ['3–5', '22 21 0.5i 2.0i 8–10i 1350i 1260i'],
  ['6–9', '30 29 0.5i 2.0i 11–14i 1600i 1470i'],
  ['10–12', '43 46 0.5i 2.0i 15–17i 2060i 1980i'],
  ['13–15', '62 57 0.5i 2.0i 18–20i 2700i 2170i'],
  ['16–18', '72 61 0.5i 2.0i 21–23i 3010i 2280i'],
  ['19–29', '71 62 0.5i 2.0i 20–25i 2530i 1930i'],
  ['30–49', '71 62 0.5i 2.0i 20–25i 2420i 1870i'],
  ['50–59', '71 62 0.5i 2.0i 20–25i 2420i 1870i'],
  ['60–69', '71 62 0.5i 2.0i 20–25i 2140i 1610i'],
  ['≥ 70', '71 62 0.5i 2.0i 20–25i 1960i 1540i'],
  ['Pregnant', '+27 - - - +300i'],
  ['Lactating', '+27 - - - +700i'],
]);

// ── p.3 RNI vitamins ──
rniTable('p.3 RNI (Vitamins)', [
  { compound: 'Vitamin A (RE)', unit: 'µg RE', sexed: true },
  { compound: 'Vitamin D (Total)', unit: 'µg', sexed: true, note: 'In the absence of adequate sunlight exposure, as calciferol.' },
  { compound: 'Vitamin E (Total)', unit: 'mg α-TE', sexed: true },
  { compound: 'Vitamin K (Total)', unit: 'µg', sexed: true },
  { compound: 'Thiamin (B1)', unit: 'mg', sexed: true },
  { compound: 'Riboflavin (B2)', unit: 'mg', sexed: true },
  { compound: 'Niacin (B3)', unit: 'mg NE', sexed: true },
  { compound: 'Vitamin B6', unit: 'mg', sexed: true },
  { compound: 'Vitamin B12 (Total)', unit: 'µg', sexed: true },
  { compound: 'Folate (Total)', unit: 'µg DFE', sexed: true },
  { compound: 'Vitamin C (Total)', unit: 'mg', sexed: true },
], [
  ['0–5', '380i 380i 5i 5i 3i 3i 7 6 0.2i 0.2i 0.3i 0.3i 1i 1i 0.1i 0.1i 0.3i 0.3i 65i 65i 30i 30i'],
  ['6–11', '400 400 5i 5i 4i 4i 9 8 0.4 0.3 0.4 0.3 5 5 0.2i 0.3i 0.4i 0.4i 80i 70i 40i 40i'],
  ['1–2', '400 400 5i 5i 4i 4i 12 12 0.5 0.4 0.5 0.4 6 6 0.5 0.5 0.9 1.0 150 150 45 45'],
  ['3–5', '400 400 5i 5i 5i 5i 18 17 0.5 0.5 0.6 0.5 7 7 0.6 0.7 1.1 1.2 200 200 45 45'],
  ['6–9', '400 400 5i 5i 6i 6i 23 23 0.7 0.7 0.7 0.7 9 9 0.7 0.8 1.3 1.5 300 300 45 45'],
  ['10–12', '500 500 5i 5i 7i 9i 33 36 0.9 0.9 1.0 0.9 11 12 1.0 1.1 1.8 2.1 300 300 45 45'],
  ['13–15', '700 500 5i 5i 10i 9i 49 46 1.2 1.0 1.3 1.0 15 13 1.3 1.2 2.3 2.2 400 400 60 55'],
  ['16–18', '800 600 5i 5i 11i 10i 59 52 1.4 1.1 1.5 1.1 18 14 1.5 1.3 2.7 2.4 400 400 70 60'],
  ['19–29', '700 600 5i 5i 10i 10i 61 53 1.2 1.1 1.3 1.1 16 14 1.3 1.3 2.4 2.4 400 400 70 60'],
  ['30–49', '700 600 5i 5i 10i 10i 61 53 1.2 1.1 1.3 1.1 16 14 1.3 1.3 2.4 2.4 400 400 70 60'],
  ['50–59', '700 600 10i 10i 10i 10i 61 53 1.2 1.1 1.3 1.1 16 14 1.7 1.6 2.4 2.4 400 400 70 60'],
  ['60–69', '700 600 15i 15i 10i 10i 61 53 1.2 1.1 1.3 1.1 16 14 1.7 1.6 2.4 2.4 400 400 70 60'],
  ['≥ 70', '700 600 15i 15i 10i 10i 61 53 1.2 1.1 1.3 1.1 16 14 1.7 1.6 2.4 2.4 400 400 70 60'],
  ['Pregnant', '+300 +0i +0i +0 +0.3 +0.7 +4 +0.6 +0.2 +200 +10'],
  ['Lactating', '+400 +0i +4i +0 +0.2 +0.6 +3 +0.7 +0.5 +150 +35'],
]);

// ── p.4 RNI minerals ──
rniTable('p.4 RNI (Minerals)', [
  { compound: 'Iron (Total)', unit: 'mg', sexed: true },
  { compound: 'Zinc', unit: 'mg', sexed: true },
  { compound: 'Selenium', unit: 'µg', sexed: true },
  { compound: 'Iodine', unit: 'µg', sexed: true },
  { compound: 'Calcium', unit: 'mg', sexed: true },
  { compound: 'Magnesium', unit: 'mg', sexed: true },
  { compound: 'Phosphorus', unit: 'mg', sexed: true },
  { compound: 'Fluoride', unit: 'mg', sexed: true },
  { compound: 'Sodium', unit: 'mg', sexed: false },
  { compound: 'Chloride', unit: 'mg', sexed: false },
  { compound: 'Potassium', unit: 'mg', sexed: false },
], [
  ['0–5', '0.4i 0.4i 2.0i 2.0i 7 6 90 90 200i 200i 26i 26i 90i 90i 0.01i 0.01i 120i 180i 500i'],
  ['6–11', '10 9 4.2 3.7 10 9 90 90 400 400 50i 50i 275i 275i 0.5i 0.4i 200i 300i 700i'],
  ['1–2', '8 8 4.1 4.0 17 16 90 90 500 500 60 60 460 460 0.6i 0.6i 225i 350i 1000i'],
  ['3–5', '9 9 5.0 4.8 20 20 90 90 550 550 70 70 500 500 0.9i 0.9i 300i 500i 1400i'],
  ['6–9', '10 9 5.1 5.0 20 19 120 120 700 700 90 90 500 500 1.2i 1.1i 400i 600i 1600i'],
  ['10–12', '12 20 6.6 6.1 21 23 120 120 1000 1000 150 160 1250 1250 1.7i 1.8i 500i 750i 2000i'],
  ['13–15', '19 (28) 9.2 7.4 30 29 150 150 1000 1000 220 210 1250 1250 2.4i 2.3i 500i 750i 2000i'],
  ['16–18', '14 (28) 9.0 7.2 37 32 150 150 1000 1000 265 230 1250 1250 3.0i 2.6i 500i 750i 2000i'],
  ['19–29', '12 (28) 6.5 4.6 38 33 150 150 750 750 240 210 700 700 3.0i 2.6i 500i 750i 2000i'],
  ['30–49', '12 (28) 6.5 4.6 38 33 150 150 750 750 240 210 700 700 3.0i 2.6i 500i 750i 2000i'],
  ['50–59', '12 10 6.5 4.6 38 33 150 150 750 800 240 210 700 700 3.0i 2.6i 500i 750i 2000i'],
  ['60–69', '12 10 6.5 4.6 38 33 150 150 800 800 240 210 700 700 3.0i 2.6i 500i 750i 2000i'],
  ['≥ 70', '12 10 6.5 4.6 38 33 150 150 800 800 240 210 700 700 3.0i 2.6i 500i 750i 2000i'],
  ['Pregnant', '(+10) +5.1 +4 +100 +50* +0 +0 +0i - - -'],
  ['Lactating', '+2 +7.0 +9 +100 +0 +50 +0 +0i - - -'],
], { Calcium: ['PREGNANT_T3'] });

// ── p.5 EAR ──
{
  const pg = 'p.5 EAR';
  const cols: Array<[string, string]> = [['Protein', 'g'], ['Vitamin A (RE)', 'µg RE'], ['Thiamin (B1)', 'mg'], ['Riboflavin (B2)', 'mg'], ['Niacin (B3)', 'mg NE'],
    ['Vitamin B6', 'mg'], ['Vitamin B12 (Total)', 'µg'], ['Folate (Total)', 'µg DFE'], ['Vitamin C (Total)', 'mg'], ['Iron (Total)', 'mg'], ['Zinc', 'mg'],
    ['Selenium', 'µg'], ['Iodine', 'µg'], ['Calcium', 'mg'], ['Phosphorus', 'mg']];
  const rows: Array<[string, string]> = [
    ['0–5', '7 7 - - - - - - - - - - - - - - - - - - - - 5.5 5.1 - - - - - -'],
    ['6–11', '14 13 190 190 0.3 0.3 0.3 0.3 4 3 - - - - - - - - 8.4 7.2 2.8 2.5 8.2 7.3 - - - - - -'],
    ['1–2', '15 14 200 200 0.4 0.4 0.4 0.4 5 5 0.4 0.5 0.8 0.9 120 120 12 11 6.4 7.0 2.8 2.6 13.6 13.0 65 65 440 440 380 380'],
    ['3–5', '18 17 226 214 0.5 0.4 0.5 0.4 5 5 0.5 0.5 0.9 1.0 160 160 17 17 7.5 7.4 3.3 3.2 16.1 15.6 65 65 440 440 405 405'],
    ['6–9', '24 24 278 264 0.6 0.5 0.6 0.5 7 7 0.6 0.7 1.1 1.2 250 250 23 22 8.6 7.8 3.4 3.4 15.6 15.3 73 73 440 440 405 405'],
    ['10–12', '35 38 364 375 0.7 0.8 0.8 0.8 9 10 0.8 1.0 1.5 1.7 250 250 33 36 10.2 16.5 4.4 4.1 16.5 18.0 73 73 440 440 1055 1055'],
    ['13–15', '50 46 483 392 1.0 0.8 1.1 0.8 12 10 1.1 1.0 1.9 1.8 330 330 48 45 18.1 16.5 6.1 4.9 24.3 23.0 95 95 440 440 1055 1055'],
    ['16–18', '59 49 563 427 1.1 0.9 1.2 0.9 14 11 1.2 1.1 2.3 2.0 330 330 58 51 12.1 16.2 6.0 4.8 29.5 25.8 95 95 440 440 1055 1055'],
    ['19–29', '57 49 499 433 1.0 0.9 1.1 0.9 12 11 1.1 1.1 2.0 2.0 320 320 60 52 10.4 26.3 4.4 3.1 30.3 26.3 95 95 600 600 580 580'],
    ['30–49', '57 49 499 433 1.0 0.9 1.1 0.9 12 11 1.1 1.1 2.0 2.0 320 320 60 52 10.4 26.3 4.4 3.1 30.3 26.3 95 95 600 600 580 580'],
    ['50–59', '57 49 499 433 1.0 0.9 1.1 0.9 12 11 1.4 1.3 2.0 2.0 320 320 60 52 10.4 8.6 4.4 3.1 30.3 26.3 95 95 600 600 580 580'],
    ['60–69', '57 49 499 433 1.0 0.9 1.1 0.9 12 11 1.4 1.3 2.0 2.0 320 320 60 52 10.4 8.6 4.4 3.1 30.3 26.3 95 95 600 600 580 580'],
    ['≥ 70', '57 49 499 433 1.0 0.9 1.1 0.9 12 11 1.4 1.3 2.0 2.0 320 320 60 52 10.4 8.6 4.4 3.1 30.3 26.3 95 95 600 600 580 580'],
  ];
  for (const [label, text] of rows) {
    const t = text.split(' ');
    if (t.length !== 30) throw new Error(`${pg} ${label}: ${t.length}`);
    cols.forEach(([compound, unit], i) => {
      (['MALE', 'FEMALE'] as Sex[]).forEach((sex, j) => {
        const tok = t[2 * i + j];
        if (tok === '-') return;
        push({ compound, type: 'EAR', sexes: [sex], age: AGE[label], value: num(tok), unit, from: `${pg}, ${compound}, ${label} ${sex === 'MALE' ? 'M' : 'F'}` });
      });
    });
  }
  // Pregnant / lactating: absolute values, one per nutrient.
  const stages: Array<[LifeStage, string, string]> = [
    ['PREGNANT', 'Pregnant', '72 - 1.2 1.4 14 1.6 2.2 520 - 31.7 - 30.3 160 - 580'],
    ['LACTATING', 'Lactating', '72 - 1.1 1.3 13.4 1.7 2.4 450 - 28.2 - 35.3 209 - 580'],
  ];
  for (const [stage, label, text] of stages) {
    const t = text.split(' ');
    if (t.length !== cols.length) throw new Error(`${pg} ${label}: ${t.length}`);
    cols.forEach(([compound, unit], i) => {
      if (t[i] === '-') return;
      push({ compound, type: 'EAR', sexes: ['FEMALE'], stage, age: [228, 599], value: num(t[i]), unit, note: 'Printed as an absolute value for all pregnant/lactating women; stored for women 19-49 y.', from: `${pg}, ${compound}, ${label}` });
    });
  }
}

// ── p.6 UL ──
{
  const pg = 'p.6 UL';
  const cols: Array<[string, string, boolean, string | null]> = [
    ['Retinol', 'µg RE', false, 'As preformed vitamin A only.'],
    ['Vitamin D (Total)', 'µg', false, null],
    ['Vitamin E (Total)', 'mg α-TE', true, 'Applies to synthetic forms from supplements and/or fortified foods.'],
    ['Niacin (B3)', 'mg NE', true, 'Applies to synthetic forms from supplements and/or fortified foods.'],
    ['Vitamin B6', 'mg', false, null],
    ['Folic Acid (Synthetic)', 'µg DFE', true, 'Applies to synthetic forms from supplements and/or fortified foods.'],
    ['Vitamin C (Total)', 'mg', false, null],
    ['Iron (Total)', 'mg', false, null],
    ['Zinc', 'mg', false, null],
    ['Selenium', 'µg', false, null],
    ['Iodine', 'µg', false, null],
    ['Calcium', 'mg', true, 'Applies to synthetic forms from supplements and/or fortified foods.'],
    ['Magnesium', 'mg', true, 'Applies to pharmacologic agents only; does not include intake from food and water.'],
    ['Phosphorus', 'mg', false, null],
    ['Fluoride', 'mg', false, null],
  ];
  const E_D = 'More recent evidence suggests lower ULs: <1000 mg/d α-TE (Horwitt 2001); 300 mg/d α-TE (NHMRC 2005; EFSA 2006) (footnote d).';
  const rows: Array<[string, LifeStage[], Age, string]> = [
    ['0–5 mo', ['NONE'], [0, 5], '600 25 c c c c c 40 4 45 c 1000 c c 0.7'],
    ['6–11 mo', ['NONE'], [6, 11], '600 25 c c c c c 40 5 60 c 1500 c c 0.9'],
    ['1–2 y', ['NONE'], [12, 35], '600 50 200 10 30 300 400 40 7 90 200 2500 65 3000 1.3'],
    ['3 y', ['NONE'], [36, 47], '600 50 200 10 30 300 400 40 7 90 200 2500 65 3000 1.3'],
    ['4–5 y', ['NONE'], [48, 71], '900 50 300 15 40 400 650 40 12 150 300 2500 110 3000 2.2'],
    ['6–8 y', ['NONE'], [72, 107], '900 50 300 15 40 400 650 40 12 150 300 2500 110 3000 2.2'],
    ['9 y', ['NONE'], [108, 119], '1700 50 600 20 60 600 1200 40 23 280 600 3000 350 4000 10.0'],
    ['10–12 y', ['NONE'], [120, 155], '1700 50 600 20 60 600 1200 40 23 280 600 3000 350 4000 10.0'],
    ['13 y', ['NONE'], [156, 167], '1700 50 600 20 60 600 1200 40 23 280 600 3000 350 4000 10.0'],
    ['14–15 y', ['NONE'], [168, 191], '2800 50 800 30 80 800 1800 45 34 400 900 3000 350 4000 10.0'],
    ['16–18 y', ['NONE'], [192, 227], '2800 50 800 30 80 800 1800 45 34 400 900 3000 350 4000 10.0'],
    ['19–29 y', ['NONE'], [228, 359], '3000 50 1000 35 100 1000 1000 45 45 400 1100 3000 350 4000 10.0'],
    ['30–49 y', ['NONE'], [360, 599], '3000 50 1000 35 100 1000 1000 45 45 400 1100 3000 350 4000 10.0'],
    ['50–59 y', ['NONE'], [600, 719], '3000 50 1000 35 100 1000 1000 45 45 400 1100 3000 350 4000 10.0'],
    ['60–70 y', ['NONE'], [720, 851], '3000 50 1000 35 100 1000 1000 45 45 400 1100 3000 350 4000 10.0'],
    ['>70 y', ['NONE'], [852, null], '3000 50 1000 35 100 1000 1000 45 45 400 1100 2000 350 3000 10.0'],
    ['Pregnant/Lactating 14–18 y', ['PREGNANT', 'LACTATING'], [168, 227], '2800 50 800 35 80 800 1800 45 34 400 900 3000 350 e 10.0'],
    ['Pregnant/Lactating ≥ 19 y', ['PREGNANT', 'LACTATING'], [228, null], '3000 50 1000 35 100 1000 2000 45 40 400 1100 2500 350 e 10.0'],
  ];
  for (const [label, stages, age, text] of rows) {
    const t = text.split(' ');
    if (t.length !== cols.length) throw new Error(`${pg} ${label}: ${t.length}`);
    cols.forEach(([compound, unit, supp, note], i) => {
      if (t[i] === 'c') return;
      for (const stage of stages) {
        const sexes: Sex[] = stage === 'NONE' ? BOTH : ['FEMALE'];
        if (t[i] === 'e') {
          const v = stage === 'PREGNANT' ? 3500 : 4000;
          const e = 'Printed as footnote e: UL for pregnant and lactating women 14-50 y were 3,500 and 4,000 mg.';
          if (age[0] === 168) push({ compound, type: 'UL', sexes, stage, age: [168, 227], value: v, unit, note: e, from: `${pg}, ${compound}, ${label} (footnote e)` });
          else push({ compound, type: 'UL', sexes, stage, age: [228, 611], value: v, unit, note: e, from: `${pg}, ${compound}, ${label} (footnote e)` });
          continue;
        }
        const dNote = compound === 'Vitamin E (Total)' && age[0] >= 228 ? E_D : null;
        push({ compound, type: 'UL', sexes, stage, age, value: num(t[i]), unit, supp, note: [note, dNote].filter(Boolean).join(' ') || null, from: `${pg}, ${compound}, ${label}` });
      }
    });
  }
}

// ── p.7 Additional recommendations (WHO guidelines) ──
{
  const pg = 'p.7 Additional Recommendations';
  push({ compound: 'Free Sugars', type: 'CDRR', sexes: BOTH, age: [12, null], value: 10, max: 10, unit: '%E', pct: true,
    note: 'Limit intake to <10% of total energy in children and adults (WHO 2015).', from: `${pg}, Free sugars` });
  push({ compound: 'Sodium', type: 'CDRR', sexes: BOTH, age: [228, null], value: 2000, max: 2000, unit: 'mg',
    note: 'Limit intake to <2 g in adults (WHO 2012). For children, extrapolated from adults by energy requirement (formula, not stored).', from: `${pg}, Sodium` });
  push({ compound: 'Potassium', type: 'CDRR', sexes: BOTH, age: [228, null], value: 3510, min: 3510, unit: 'mg',
    note: 'Increase intake to 3,510 mg in adults (WHO 2012). For children, extrapolated from adults by energy requirement (formula, not stored).', from: `${pg}, Potassium` });
}

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths);
writeFileSync(path.join(process.cwd(), 'dv-sources', 'pdri-2015', 'values.json'), JSON.stringify(out, null, 1) + '\n');
const byType: Record<string, number> = {};
for (const v of out) byType[v.valueType] = (byType[v.valueType] ?? 0) + 1;
console.log(`Wrote ${out.length} values to dv-sources/pdri-2015/values.json`, byType);
