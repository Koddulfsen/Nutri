/**
 * EFSA Dietary Reference Values -> values.json.
 *
 * Transcribed cell by cell, 2026-09-14, from:
 *   drv-summary-tables.pdf  "Summary of Dietary Reference Values – version 4 (September 2017)"
 *   ul-summary-2024.pdf     "Overview on Tolerable Upper Intake Levels", version 11 (August 2025)
 * Numbers were read from the text layer and checked against rendered pages; PRI vs AI was
 * read from the bold type on the rendered pages (the text layer does not carry it).
 *
 * Not stored, on purpose:
 *   - Protein AR/PRI (Table 2): published per kg body weight; pregnancy/lactation increments
 *     are g/d on top of that per-kg base.
 *   - SFA, TFA: "as low as possible" — no number.
 *   - Safe levels of intake (UL Table 2: iron, manganese, fluoride ≥ 9 y): EFSA states they are
 *     not ULs; storing them as UL would mislabel them.
 *   - Copper, niacin UL for pregnancy/lactation: printed ND / "Inadequate data".
 *
 * Interpretations (ours, recorded in each value's note where they apply):
 *   - Energy "7 mo" … "11 mo" are the 7th … 11th month of life (Table 3 footnote d defines
 *     7–11 mo as the beginning of the 7th month to the 1st birthday), i.e. months 6 … 10.
 *   - Iron PRI for women ≥ 18 y is printed premenopausal / postmenopausal without ages;
 *     Nutri applies premenopausal to 18–49 y and postmenopausal to ≥ 50 y.
 *   - Thiamin and niacin are per MJ of energy (mg/MJ, mg NE/MJ) and are stored per MJ.
 *
 * Run: npx tsx dv-sources/efsa-drv/extract.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage, Activity, DietaryContext } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
const out: SourceValue[] = [];
const ADULT: Age = [216, null];

function add(p: {
  compound: string; type: DvValueType; sexes?: Sex[]; stage?: LifeStage; age: Age; value: number;
  min?: number | null; max?: number | null; unit: string; pct?: boolean; activity?: Activity | null;
  diet?: DietaryContext | null; note?: string | null; from: string; supplementalOnly?: boolean;
}) {
  for (const sex of p.sexes ?? ['MALE', 'FEMALE']) {
    out.push({
      compound: p.compound, valueType: p.type, sex, lifeStage: p.stage ?? 'NONE',
      ageMinMonths: p.age[0], ageMaxMonths: p.age[1], activityLevel: p.activity ?? null, dietaryContext: p.diet ?? null,
      value: Number(p.value.toFixed(4)), valueMin: p.min ?? null, valueMax: p.max ?? null, unit: p.unit,
      isPercentOfEnergy: p.pct ?? false, isProvisional: false, supplementalOnly: p.supplementalOnly ?? false, note: p.note ?? null, from: p.from,
    });
  }
}
const M: Sex[] = ['MALE'];
const F: Sex[] = ['FEMALE'];
const r4 = (x: number) => Number(x.toFixed(4));

// ───────────────────────── Table 1: AR for energy (MJ/d) ─────────────────────────
{
  const from = 'DRV Table 1 AR energy';
  const infants: Array<[number, number, number]> = [[6, 2.7, 2.4], [7, 2.8, 2.5], [8, 2.9, 2.6], [9, 3.0, 2.7], [10, 3.1, 2.8]];
  for (const [m, male, female] of infants) {
    const note = `Printed "${m + 1} mo" (the ${m + 1}th month of life); no PAL.`;
    add({ compound: 'Energy', type: 'EER', sexes: M, age: [m, m], value: male, unit: 'MJ', note, from: `${from}, ${m + 1} mo` });
    add({ compound: 'Energy', type: 'EER', sexes: F, age: [m, m], value: female, unit: 'MJ', note, from: `${from}, ${m + 1} mo` });
  }
  const PAL: Record<string, Activity> = { '1.4': 'SEDENTARY', '1.6': 'MODERATE', '1.8': 'ACTIVE', '2.0': 'VERY_ACTIVE' };
  // [label, age, {pal: [M, F]}]
  const rows: Array<[string, Age, Partial<Record<keyof typeof PAL, [number, number]>>]> = [
    ['1 y', [12, 23], { '1.4': [3.3, 3.0] }],
    ['2 y', [24, 35], { '1.4': [4.3, 4.0] }],
    ['3 y', [36, 47], { '1.4': [4.9, 4.6] }],
    ['4 y', [48, 59], { '1.4': [5.3, 4.9], '1.6': [6.0, 5.6], '1.8': [6.8, 6.3] }],
    ['5 y', [60, 71], { '1.4': [5.6, 5.2], '1.6': [6.4, 5.9], '1.8': [7.2, 6.7] }],
    ['6 y', [72, 83], { '1.4': [5.9, 5.5], '1.6': [6.7, 6.3], '1.8': [7.6, 7.1] }],
    ['7 y', [84, 95], { '1.4': [6.3, 5.8], '1.6': [7.2, 6.7], '1.8': [8.1, 7.5] }],
    ['8 y', [96, 107], { '1.4': [6.7, 6.2], '1.6': [7.6, 7.1], '1.8': [8.6, 7.9] }],
    ['9 y', [108, 119], { '1.4': [7.0, 6.6], '1.6': [8.1, 7.5], '1.8': [9.1, 8.4] }],
    ['10 y', [120, 131], { '1.6': [8.1, 7.6], '1.8': [9.1, 8.6], '2.0': [10.1, 9.5] }],
    ['11 y', [132, 143], { '1.6': [8.5, 8.0], '1.8': [9.6, 9.0], '2.0': [10.7, 10.0] }],
    ['12 y', [144, 155], { '1.6': [9.1, 8.4], '1.8': [10.2, 9.4], '2.0': [11.4, 10.5] }],
    ['13 y', [156, 167], { '1.6': [9.8, 8.8], '1.8': [11.0, 9.9], '2.0': [12.2, 11.0] }],
    ['14 y', [168, 179], { '1.6': [10.5, 9.1], '1.8': [11.8, 10.2], '2.0': [13.1, 11.4] }],
    ['15 y', [180, 191], { '1.6': [11.3, 9.3], '1.8': [12.7, 10.5], '2.0': [14.1, 11.7] }],
    ['16 y', [192, 203], { '1.6': [11.9, 9.5], '1.8': [13.4, 10.6], '2.0': [14.9, 11.8] }],
    ['17 y', [204, 215], { '1.6': [12.3, 9.5], '1.8': [13.8, 10.7], '2.0': [15.4, 11.9] }],
    ['18-29 y', [216, 359], { '1.4': [9.8, 7.9], '1.6': [11.2, 9.0], '1.8': [12.6, 10.1], '2.0': [14.0, 11.2] }],
    ['30-39 y', [360, 479], { '1.4': [9.5, 7.6], '1.6': [10.8, 8.7], '1.8': [12.2, 9.8], '2.0': [13.5, 10.8] }],
    ['40-49 y', [480, 599], { '1.4': [9.3, 7.5], '1.6': [10.7, 8.6], '1.8': [12.0, 9.7], '2.0': [13.4, 10.7] }],
    ['50-59 y', [600, 719], { '1.4': [9.2, 7.5], '1.6': [10.5, 8.5], '1.8': [11.9, 9.6], '2.0': [13.2, 10.7] }],
    ['60-69 y', [720, 839], { '1.4': [8.4, 6.8], '1.6': [9.6, 7.8], '1.8': [10.9, 8.8], '2.0': [12.1, 9.7] }],
    ['70-79 y', [840, 959], { '1.4': [8.3, 6.8], '1.6': [9.5, 7.7], '1.8': [10.7, 8.7], '2.0': [11.9, 9.6] }],
  ];
  for (const [label, age, pals] of rows) {
    const single = Object.keys(pals).length === 1;
    for (const [pal, [male, female]] of Object.entries(pals) as Array<[string, [number, number]]>) {
      const activity = single ? null : PAL[pal];
      const note = single ? `Printed at PAL ${pal} only; applies at every activity level.` : `PAL ${pal}.`;
      add({ compound: 'Energy', type: 'EER', sexes: M, age, value: male, unit: 'MJ', activity, note, from: `${from}, ${label}, PAL ${pal}` });
      add({ compound: 'Energy', type: 'EER', sexes: F, age, value: female, unit: 'MJ', activity, note, from: `${from}, ${label}, PAL ${pal}` });
    }
  }
  // Pregnancy/lactation: "+x in addition to the AR of non-pregnant, non-lactating women" (footnote d).
  const inc: Array<[LifeStage, number, string]> = [['PREGNANT_T1', 0.29, '1st trimester'], ['PREGNANT_T2', 1.1, '2nd trimester'], ['PREGNANT_T3', 2.1, '3rd trimester'], ['LACTATING_0_6M', 2.1, '0-6 mo post partum']];
  for (const [label, age, pals] of rows.filter(([, a]) => a[0] >= 216 && a[0] < 600)) {
    for (const [pal, [, female]] of Object.entries(pals) as Array<[string, [number, number]]>) {
      for (const [stage, add_, stageLabel] of inc) {
        add({
          compound: 'Energy', type: 'EER', sexes: F, stage, age, value: r4(female + add_), unit: 'MJ', activity: PAL[pal],
          note: `PAL ${pal}. Printed as +${add_} MJ over same-age non-pregnant women; stored as total.`,
          from: `${from}, ${stageLabel} +${add_} over ${label} PAL ${pal}`,
        });
      }
    }
  }
}

// ───────────── Table 3: RI total fat / carbohydrate, AI fatty acids, fibre, water ─────────────
{
  const from = 'DRV Table 3';
  const fatAges: Array<[string, Age]> = [['7-11 mo', [6, 11]], ['1', [12, 23]], ['2-3', [24, 47]], ['4-17', [48, 215]], ['≥ 18', ADULT]];
  const fat: Array<number | [number, number]> = [40, [35, 40], [35, 40], [20, 35], [20, 35]];
  fatAges.forEach(([label, age], i) => {
    const c = fat[i];
    if (Array.isArray(c)) add({ compound: 'Total Fat', type: 'AMDR', age, value: (c[0] + c[1]) / 2, min: c[0], max: c[1], unit: '%', pct: true, from: `${from}, Total fat RI, ${label}` });
    else add({ compound: 'Total Fat', type: 'AI', age, value: c, unit: '%', pct: true, from: `${from}, Total fat AI, ${label}` });
    add({ compound: 'Linoleic Acid', type: 'AI', age, value: 4, unit: '%', pct: true, from: `${from}, LA AI, ${label}` });
    add({ compound: 'Alpha-Linolenic Acid (ALA)', type: 'AI', age, value: 0.5, unit: '%', pct: true, from: `${from}, ALA AI, ${label}` });
  });
  add({ compound: 'DHA (Docosahexaenoic Acid)', type: 'AI', age: [6, 11], value: 100, unit: 'mg', from: `${from}, DHA AI, 7-11 mo` });
  add({ compound: 'DHA (Docosahexaenoic Acid)', type: 'AI', age: [12, 23], value: 100, unit: 'mg', from: `${from}, DHA AI, 1` });
  for (const [label, age] of [['2-3', [24, 47]], ['4-17', [48, 215]], ['≥ 18', ADULT]] as Array<[string, Age]>) {
    add({ compound: 'EPA + DHA', type: 'AI', age, value: 250, unit: 'mg', from: `${from}, EPA+DHA AI, ${label}` });
  }
  for (const [stage, label] of [['PREGNANT', 'Pregnancy'], ['LACTATING', 'Lactation']] as const) {
    add({ compound: 'Total Fat', type: 'AMDR', sexes: F, stage, age: ADULT, value: 27.5, min: 20, max: 35, unit: '%', pct: true, from: `${from}, Total fat RI, ${label}` });
    add({ compound: 'Linoleic Acid', type: 'AI', sexes: F, stage, age: ADULT, value: 4, unit: '%', pct: true, from: `${from}, LA AI, ${label}` });
    add({ compound: 'Alpha-Linolenic Acid (ALA)', type: 'AI', sexes: F, stage, age: ADULT, value: 0.5, unit: '%', pct: true, from: `${from}, ALA AI, ${label}` });
    add({
      compound: 'DHA (Docosahexaenoic Acid)', type: 'AI', sexes: F, stage, age: ADULT, value: 150, min: 100, max: 200, unit: 'mg',
      note: 'Printed "+100-200" mg/d DHA in addition to the 250 mg/d EPA+DHA AI.', from: `${from}, DHA AI, ${label}`,
    });
    add({ compound: 'EPA + DHA', type: 'AI', sexes: F, stage, age: ADULT, value: 250, unit: 'mg', from: `${from}, EPA+DHA AI, ${label}` });
    add({ compound: 'Water', type: 'AI', sexes: F, stage, age: ADULT, value: stage === 'PREGNANT' ? 2.3 : 2.7, unit: 'L', note: 'Water from beverages of all kinds and food moisture.', from: `${from}, Water AI, ${label}` });
  }
  const carbAges: Array<[string, Age, number]> = [['1-3', [12, 47], 10], ['4-6', [48, 83], 14], ['7-10', [84, 131], 16], ['11-14', [132, 179], 19], ['15-17', [180, 215], 21], ['≥ 18', ADULT, 25]];
  for (const [label, age, fibre] of carbAges) {
    add({ compound: 'Carbohydrates', type: 'AMDR', age, value: 52.5, min: 45, max: 60, unit: '%', pct: true, from: `${from}, Total carbohydrates RI, ${label}` });
    add({ compound: 'Dietary Fiber', type: 'AI', age, value: fibre, unit: 'g', from: `${from}, Dietary fibre AI, ${label}` });
  }
  const waterNote = 'Water from beverages of all kinds and food moisture.';
  const water: Array<[string, Age, [number, number] | number, [number, number] | number]> = [
    ['6-12 mo', [6, 11], [0.8, 1.0], [0.8, 1.0]], ['1', [12, 23], [1.1, 1.2], [1.1, 1.2]], ['2-3', [24, 47], 1.3, 1.3],
    ['4-8', [48, 107], 1.6, 1.6], ['9-13', [108, 167], 2.1, 1.9], ['14-17', [168, 215], 2.5, 2.0], ['≥ 18', ADULT, 2.5, 2.0],
  ];
  for (const [label, age, male, female] of water) {
    for (const [sexes, c] of [[M, male], [F, female]] as const) {
      if (Array.isArray(c)) add({ compound: 'Water', type: 'AI', sexes, age, value: r4((c[0] + c[1]) / 2), min: c[0], max: c[1], unit: 'L', note: waterNote, from: `${from}, Water AI, ${label}` });
      else add({ compound: 'Water', type: 'AI', sexes, age, value: c, unit: 'L', note: waterNote, from: `${from}, Water AI, ${label}` });
    }
  }
}

// ───────────────────────── Tables 4 & 6: AR minerals ─────────────────────────
const LPI: Array<[DietaryContext, number]> = [['PHYTATE_LOW', 300], ['PHYTATE_MED_LOW', 600], ['PHYTATE_MED_HIGH', 900], ['PHYTATE_HIGH', 1200]];
{
  const ca: Array<[string, Age, number]> = [['1–3', [12, 47], 390], ['4–10', [48, 131], 680], ['11–17', [132, 215], 960], ['18–24', [216, 299], 860], ['≥ 25', [300, null], 750]];
  for (const [label, age, v] of ca) add({ compound: 'Calcium', type: 'EAR', age, value: v, unit: 'mg', from: `DRV Tables 4/6 AR, Calcium, ${label}` });
  for (const stage of ['PREGNANT', 'LACTATING'] as const) {
    add({ compound: 'Calcium', type: 'EAR', sexes: F, stage, age: [216, 299], value: 860, unit: 'mg', from: `DRV Table 6 AR, Calcium, ${stage}, 18–24` });
    add({ compound: 'Calcium', type: 'EAR', sexes: F, stage, age: [300, null], value: 750, unit: 'mg', from: `DRV Table 6 AR, Calcium, ${stage}, ≥ 25` });
  }
  const feM: Array<[string, Age, number]> = [['7–11 mo', [6, 11], 8], ['1–6', [12, 83], 5], ['7–11', [84, 143], 8], ['12–17', [144, 215], 8], ['≥ 18', ADULT, 6]];
  for (const [label, age, v] of feM) add({ compound: 'Iron (Total)', type: 'EAR', sexes: M, age, value: v, unit: 'mg', from: `DRV Table 4 AR, Iron, ${label}` });
  const feF: Array<[string, Age, number, string?]> = [['7–11 mo', [6, 11], 8], ['1–6', [12, 83], 5], ['7–11', [84, 143], 8], ['12–17', [144, 215], 7],
    ['≥ 18 premenopausal', [216, 599], 7, 'Printed premenopausal (no ages); Nutri applies it to 18–49 y.'],
    ['≥ 18 postmenopausal', [600, null], 6, 'Printed postmenopausal (no ages); Nutri applies it to ≥ 50 y.']];
  for (const [label, age, v, note] of feF) add({ compound: 'Iron (Total)', type: 'EAR', sexes: F, age, value: v, unit: 'mg', note, from: `DRV Table 6 AR, Iron, ${label}` });
  for (const stage of ['PREGNANT', 'LACTATING'] as const) add({ compound: 'Iron (Total)', type: 'EAR', sexes: F, stage, age: ADULT, value: 7, unit: 'mg', from: `DRV Table 6 AR, Iron, ${stage}` });

  const znChild: Array<[string, Age, number, number]> = [['7–11 mo', [6, 11], 2.4, 2.4], ['1–3', [12, 47], 3.6, 3.6], ['4–6', [48, 83], 4.6, 4.6], ['7–10', [84, 131], 6.2, 6.2], ['11–14', [132, 179], 8.9, 8.9], ['15–17', [180, 215], 11.8, 9.9]];
  const childZnNote = 'Children: absorption from mixed diets with variable phytate; no phytate adjustment.';
  for (const [label, age, male, female] of znChild) {
    add({ compound: 'Zinc', type: 'EAR', sexes: M, age, value: male, unit: 'mg', note: childZnNote, from: `DRV Table 4 AR, Zinc, ${label}` });
    add({ compound: 'Zinc', type: 'EAR', sexes: F, age, value: female, unit: 'mg', note: childZnNote, from: `DRV Table 6 AR, Zinc, ${label}` });
  }
  const znAdultM = [7.5, 9.3, 11.0, 12.7], znAdultF = [6.2, 7.6, 8.9, 10.2];
  LPI.forEach(([diet, lpi], i) => {
    add({ compound: 'Zinc', type: 'EAR', sexes: M, age: ADULT, diet, value: znAdultM[i], unit: 'mg', note: `Phytate intake ${lpi} mg/d.`, from: `DRV Table 4 AR, Zinc, ≥ 18, LPI ${lpi}` });
    add({ compound: 'Zinc', type: 'EAR', sexes: F, age: ADULT, diet, value: znAdultF[i], unit: 'mg', note: `Phytate intake ${lpi} mg/d.`, from: `DRV Table 6 AR, Zinc, ≥ 18, LPI ${lpi}` });
    for (const [stage, inc] of [['PREGNANT', 1.3], ['LACTATING', 2.4]] as const) {
      add({ compound: 'Zinc', type: 'EAR', sexes: F, stage, age: ADULT, diet, value: r4(znAdultF[i] + inc), unit: 'mg', note: `Phytate intake ${lpi} mg/d. Printed as +${inc} over non-pregnant women; stored as total.`, from: `DRV Table 6 AR, Zinc, ${stage} +${inc}, LPI ${lpi}` });
    }
  });
}

// ───────────────────────── Tables 5 & 7: PRI / AI minerals ─────────────────────────
{
  // Calcium: 7–11 mo AI; PRI from 1 y (bold).
  add({ compound: 'Calcium', type: 'AI', age: [6, 11], value: 280, unit: 'mg', from: 'DRV Tables 5/7, Calcium, 7–11 mo' });
  const ca: Array<[string, Age, number]> = [['1–3', [12, 47], 450], ['4–10', [48, 131], 800], ['11–17', [132, 215], 1150], ['18–24', [216, 299], 1000], ['≥ 25', [300, null], 950]];
  for (const [label, age, v] of ca) add({ compound: 'Calcium', type: 'RDA', age, value: v, unit: 'mg', from: `DRV Tables 5/7 PRI, Calcium, ${label}` });
  for (const stage of ['PREGNANT', 'LACTATING'] as const) {
    add({ compound: 'Calcium', type: 'RDA', sexes: F, stage, age: [216, 299], value: 1000, unit: 'mg', from: `DRV Table 7 PRI, Calcium, ${stage}, 18–24` });
    add({ compound: 'Calcium', type: 'RDA', sexes: F, stage, age: [300, null], value: 950, unit: 'mg', from: `DRV Table 7 PRI, Calcium, ${stage}, ≥ 25` });
  }

  // AI columns sharing the age groups 7–11 mo, 1–3, 4–6, 7–10, 11–14, 15–17, ≥ 18. [male, female] where they differ.
  const g: Age[] = [[6, 11], [12, 47], [48, 83], [84, 131], [132, 179], [180, 215], ADULT];
  const gl = ['7–11 mo', '1–3', '4–6', '7–10', '11–14', '15–17', '≥ 18'];
  const aiCols: Array<{ compound: string; unit: string; m: number[]; f: number[]; preg: number; lact: number }> = [
    { compound: 'Fluoride', unit: 'mg', m: [0.4, 0.6, 1.0, 1.5, 2.2, 3.2, 3.4], f: [0.4, 0.6, 0.9, 1.4, 2.3, 2.8, 2.9], preg: 2.9, lact: 2.9 },
    { compound: 'Iodine', unit: 'µg', m: [70, 90, 90, 90, 120, 130, 150], f: [70, 90, 90, 90, 120, 130, 150], preg: 200, lact: 200 },
    { compound: 'Molybdenum', unit: 'µg', m: [10, 15, 20, 30, 45, 65, 65], f: [10, 15, 20, 30, 45, 65, 65], preg: 65, lact: 65 },
    { compound: 'Phosphorus', unit: 'mg', m: [160, 250, 440, 440, 640, 640, 550], f: [160, 250, 440, 440, 640, 640, 550], preg: 550, lact: 550 },
    { compound: 'Potassium', unit: 'mg', m: [750, 800, 1100, 1800, 2700, 3500, 3500], f: [750, 800, 1100, 1800, 2700, 3500, 3500], preg: 3500, lact: 4000 },
    { compound: 'Selenium', unit: 'µg', m: [15, 15, 20, 35, 55, 70, 70], f: [15, 15, 20, 35, 55, 70, 70], preg: 70, lact: 85 },
  ];
  for (const c of aiCols) {
    g.forEach((age, i) => {
      add({ compound: c.compound, type: 'AI', sexes: M, age, value: c.m[i], unit: c.unit, from: `DRV Table 5 AI, ${c.compound}, ${gl[i]}` });
      add({ compound: c.compound, type: 'AI', sexes: F, age, value: c.f[i], unit: c.unit, from: `DRV Table 7 AI, ${c.compound}, ${gl[i]}` });
    });
    add({ compound: c.compound, type: 'AI', sexes: F, stage: 'PREGNANT', age: ADULT, value: c.preg, unit: c.unit, from: `DRV Table 7 AI, ${c.compound}, Pregnancy` });
    add({ compound: c.compound, type: 'AI', sexes: F, stage: 'LACTATING', age: ADULT, value: c.lact, unit: c.unit, from: `DRV Table 7 AI, ${c.compound}, Lactation` });
  }
  // Manganese AI: 7–11 mo is a range (footnote b).
  add({ compound: 'Manganese', type: 'AI', age: [6, 11], value: 0.26, min: 0.02, max: 0.5, unit: 'mg', note: 'Printed as a range 0.02–0.5 given the wide range of adequate intakes; value is the midpoint.', from: 'DRV Tables 5/7 AI, Manganese, 7–11 mo' });
  [0.5, 1.0, 1.5, 2.0, 3.0, 3.0].forEach((v, j) => add({ compound: 'Manganese', type: 'AI', age: g[j + 1], value: v, unit: 'mg', from: `DRV Tables 5/7 AI, Manganese, ${gl[j + 1]}` }));
  for (const stage of ['PREGNANT', 'LACTATING'] as const) add({ compound: 'Manganese', type: 'AI', sexes: F, stage, age: ADULT, value: 3.0, unit: 'mg', from: `DRV Table 7 AI, Manganese, ${stage}` });

  // Iron PRI (bold) — its own age groups.
  const feM: Array<[string, Age, number]> = [['7–11 mo', [6, 11], 11], ['1–6', [12, 83], 7], ['7–11', [84, 143], 11], ['12–17', [144, 215], 11], ['≥ 18', ADULT, 11]];
  for (const [label, age, v] of feM) add({ compound: 'Iron (Total)', type: 'RDA', sexes: M, age, value: v, unit: 'mg', from: `DRV Table 5 PRI, Iron, ${label}` });
  const pre = 'PRI covers ~95% of premenopausal women (footnote d).';
  const feF: Array<[string, Age, number, string?]> = [['7–11 mo', [6, 11], 11], ['1–6', [12, 83], 7], ['7–11', [84, 143], 11], ['12–17', [144, 215], 13],
    ['≥ 18 premenopausal', [216, 599], 16, `${pre} Printed without ages; Nutri applies it to 18–49 y.`],
    ['≥ 18 postmenopausal', [600, null], 11, 'Printed postmenopausal (no ages); Nutri applies it to ≥ 50 y.']];
  for (const [label, age, v, note] of feF) add({ compound: 'Iron (Total)', type: 'RDA', sexes: F, age, value: v, unit: 'mg', note, from: `DRV Table 7 PRI, Iron, ${label}` });
  for (const stage of ['PREGNANT', 'LACTATING'] as const) add({ compound: 'Iron (Total)', type: 'RDA', sexes: F, stage, age: ADULT, value: 16, unit: 'mg', note: pre, from: `DRV Table 7 PRI, Iron, ${stage}` });

  // Copper, magnesium AI — age groups 7–11 mo, 1–2, 3–9, 10–17, ≥ 18.
  const cg: Array<[string, Age]> = [['7–11 mo', [6, 11]], ['1–2', [12, 35]], ['3–9', [36, 119]], ['10–17', [120, 215]], ['≥ 18', ADULT]];
  const cuM = [0.4, 0.7, 1.0, 1.3, 1.6], cuF = [0.4, 0.7, 1.0, 1.1, 1.3];
  const mgM = [80, 170, 230, 300, 350], mgF = [80, 170, 230, 250, 300];
  cg.forEach(([label, age], i) => {
    add({ compound: 'Copper', type: 'AI', sexes: M, age, value: cuM[i], unit: 'mg', from: `DRV Table 5 AI, Copper, ${label}` });
    add({ compound: 'Copper', type: 'AI', sexes: F, age, value: cuF[i], unit: 'mg', from: `DRV Table 7 AI, Copper, ${label}` });
    add({ compound: 'Magnesium', type: 'AI', sexes: M, age, value: mgM[i], unit: 'mg', from: `DRV Table 5 AI, Magnesium, ${label}` });
    add({ compound: 'Magnesium', type: 'AI', sexes: F, age, value: mgF[i], unit: 'mg', from: `DRV Table 7 AI, Magnesium, ${label}` });
  });
  for (const stage of ['PREGNANT', 'LACTATING'] as const) {
    add({ compound: 'Copper', type: 'AI', sexes: F, stage, age: ADULT, value: 1.5, unit: 'mg', from: `DRV Table 7 AI, Copper, ${stage}` });
    add({ compound: 'Magnesium', type: 'AI', sexes: F, stage, age: ADULT, value: 300, unit: 'mg', from: `DRV Table 7 AI, Magnesium, ${stage}` });
  }

  // Zinc PRI (bold).
  const childZnNote = 'Children: absorption from mixed diets with variable phytate; no phytate adjustment.';
  const zc: Array<[string, Age, number, number]> = [['7–11 mo', [6, 11], 2.9, 2.9], ['1–3', [12, 47], 4.3, 4.3], ['4–6', [48, 83], 5.5, 5.5], ['7–10', [84, 131], 7.4, 7.4], ['11–14', [132, 179], 10.7, 10.7], ['15–17', [180, 215], 14.2, 11.9]];
  for (const [label, age, male, female] of zc) {
    add({ compound: 'Zinc', type: 'RDA', sexes: M, age, value: male, unit: 'mg', note: childZnNote, from: `DRV Table 5 PRI, Zinc, ${label}` });
    add({ compound: 'Zinc', type: 'RDA', sexes: F, age, value: female, unit: 'mg', note: childZnNote, from: `DRV Table 7 PRI, Zinc, ${label}` });
  }
  const zM = [9.4, 11.7, 14.0, 16.3], zF = [7.5, 9.3, 11.0, 12.7];
  LPI.forEach(([diet, lpi], i) => {
    add({ compound: 'Zinc', type: 'RDA', sexes: M, age: ADULT, diet, value: zM[i], unit: 'mg', note: `Phytate intake ${lpi} mg/d.`, from: `DRV Table 5 PRI, Zinc, ≥ 18, LPI ${lpi}` });
    add({ compound: 'Zinc', type: 'RDA', sexes: F, age: ADULT, diet, value: zF[i], unit: 'mg', note: `Phytate intake ${lpi} mg/d.`, from: `DRV Table 7 PRI, Zinc, ≥ 18, LPI ${lpi}` });
    for (const [stage, inc] of [['PREGNANT', 1.6], ['LACTATING', 2.9]] as const) {
      add({ compound: 'Zinc', type: 'RDA', sexes: F, stage, age: ADULT, diet, value: r4(zF[i] + inc), unit: 'mg', note: `Phytate intake ${lpi} mg/d. Printed as +${inc} over non-pregnant women; stored as total.`, from: `DRV Table 7 PRI, Zinc, ${stage} +${inc}, LPI ${lpi}` });
    }
  });
}

// ───────────────────────── Tables 8 & 10: AR vitamins ─────────────────────────
{
  const g: Array<[string, Age]> = [['7–11 mo', [6, 11]], ['1–3', [12, 47]], ['4–6', [48, 83]], ['7–10', [84, 131]], ['11–14', [132, 179]], ['15–17', [180, 215]], ['≥ 18', ADULT]];
  type Col = { compound: string; unit: string; note?: string; m: (number | null)[]; f: (number | null)[]; preg: number | null; lact: number | null };
  const cols: Col[] = [
    { compound: 'Folate (Total)', unit: 'µg DFE', m: [null, 90, 110, 160, 210, 250, 250], f: [null, 90, 110, 160, 210, 250, 250], preg: null, lact: 380 },
    { compound: 'Niacin (B3)', unit: 'mg NE/MJ', note: 'Per MJ of energy.', m: [1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3], f: [1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3], preg: 1.3, lact: 1.3 },
    { compound: 'Riboflavin (B2)', unit: 'mg', m: [null, 0.5, 0.6, 0.8, 1.1, 1.4, 1.3], f: [null, 0.5, 0.6, 0.8, 1.1, 1.4, 1.3], preg: 1.5, lact: 1.7 },
    { compound: 'Thiamin (B1)', unit: 'mg/MJ', note: 'Per MJ of energy.', m: [0.072, 0.072, 0.072, 0.072, 0.072, 0.072, 0.072], f: [0.072, 0.072, 0.072, 0.072, 0.072, 0.072, 0.072], preg: 0.072, lact: 0.072 },
    { compound: 'Vitamin A (RE)', unit: 'µg RE', note: 'As retinol equivalents (1 µg RE = 6 µg β-carotene), not RAE.', m: [190, 205, 245, 320, 480, 580, 570], f: [190, 205, 245, 320, 480, 490, 490], preg: 540, lact: 1020 },
    { compound: 'Vitamin B6', unit: 'mg', m: [null, 0.5, 0.6, 0.9, 1.2, 1.5, 1.5], f: [null, 0.5, 0.6, 0.9, 1.2, 1.3, 1.3], preg: 1.5, lact: 1.4 },
    { compound: 'Vitamin C (Total)', unit: 'mg', m: [null, 15, 25, 40, 60, 85, 90], f: [null, 15, 25, 40, 60, 75, 80], preg: null, lact: 145 },
  ];
  for (const c of cols) {
    g.forEach(([label, age], i) => {
      if (c.m[i] != null) add({ compound: c.compound, type: 'EAR', sexes: M, age, value: c.m[i]!, unit: c.unit, note: c.note, from: `DRV Table 8 AR, ${c.compound}, ${label}` });
      if (c.f[i] != null) add({ compound: c.compound, type: 'EAR', sexes: F, age, value: c.f[i]!, unit: c.unit, note: c.note, from: `DRV Table 10 AR, ${c.compound}, ${label}` });
    });
    if (c.preg != null) add({ compound: c.compound, type: 'EAR', sexes: F, stage: 'PREGNANT', age: ADULT, value: c.preg, unit: c.unit, note: c.note, from: `DRV Table 10 AR, ${c.compound}, Pregnancy` });
    if (c.lact != null) add({ compound: c.compound, type: 'EAR', sexes: F, stage: 'LACTATING', age: ADULT, value: c.lact, unit: c.unit, note: c.note, from: `DRV Table 10 AR, ${c.compound}, Lactation` });
  }
}

// ───────────────────────── Tables 9 & 11: PRI / AI vitamins ─────────────────────────
{
  // α-Tocopherol AI: 7–11 mo, 1–2, 3–9, 10–17, ≥ 18.
  const tg: Array<[string, Age, number, number]> = [['7–11 mo', [6, 11], 5, 5], ['1–2', [12, 35], 6, 6], ['3–9', [36, 119], 9, 9], ['10–17', [120, 215], 13, 11], ['≥ 18', ADULT, 13, 11]];
  const tNote = 'As α-tocopherol.';
  for (const [label, age, male, female] of tg) {
    add({ compound: 'Vitamin E (Total)', type: 'AI', sexes: M, age, value: male, unit: 'mg', note: tNote, from: `DRV Table 9 AI, α-Tocopherol, ${label}` });
    add({ compound: 'Vitamin E (Total)', type: 'AI', sexes: F, age, value: female, unit: 'mg', note: tNote, from: `DRV Table 11 AI, α-Tocopherol, ${label}` });
  }
  for (const stage of ['PREGNANT', 'LACTATING'] as const) add({ compound: 'Vitamin E (Total)', type: 'AI', sexes: F, stage, age: ADULT, value: 11, unit: 'mg', note: tNote, from: `DRV Table 11 AI, α-Tocopherol, ${stage}` });

  const g: Array<[string, Age]> = [['7–11 mo', [6, 11]], ['1–3', [12, 47]], ['4–6', [48, 83]], ['7–10', [84, 131]], ['11–14', [132, 179]], ['15–17', [180, 215]], ['≥ 18', ADULT]];
  // pri: row indices printed bold (PRI); others are AI.
  // pregPri / lactPri: whether the pregnancy / lactation cell is printed bold (PRI).
  type Col = { compound: string; unit: string; note?: string; pri: number[]; m: number[]; f: number[]; preg: number; lact: number; pregPri: boolean; lactPri?: boolean };
  const all = [0, 1, 2, 3, 4, 5, 6], fromOne = [1, 2, 3, 4, 5, 6];
  const vitD = 'Under assumed minimal cutaneous vitamin D synthesis (from 1 y).';
  const cols: Col[] = [
    { compound: 'Biotin (B7)', unit: 'µg', pri: [], m: [6, 20, 25, 25, 35, 35, 40], f: [6, 20, 25, 25, 35, 35, 40], preg: 40, lact: 45, pregPri: false },
    { compound: 'Choline (Total)', unit: 'mg', pri: [], m: [160, 140, 170, 250, 340, 400, 400], f: [160, 140, 170, 250, 340, 400, 400], preg: 480, lact: 520, pregPri: false },
    { compound: 'Vitamin B12 (Total)', unit: 'µg', note: 'As cobalamin.', pri: [], m: [1.5, 1.5, 1.5, 2.5, 3.5, 4.0, 4.0], f: [1.5, 1.5, 1.5, 2.5, 3.5, 4.0, 4.0], preg: 4.5, lact: 5.0, pregPri: false },
    { compound: 'Folate (Total)', unit: 'µg DFE', pri: fromOne, m: [80, 120, 140, 200, 270, 330, 330], f: [80, 120, 140, 200, 270, 330, 330], preg: 600, lact: 500, pregPri: false, lactPri: true },
    { compound: 'Niacin (B3)', unit: 'mg NE/MJ', note: 'Per MJ of energy.', pri: all, m: [1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6], f: [1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6], preg: 1.6, lact: 1.6, pregPri: true },
    { compound: 'Pantothenic Acid (B5)', unit: 'mg', pri: [], m: [3, 4, 4, 4, 5, 5, 5], f: [3, 4, 4, 4, 5, 5, 5], preg: 5, lact: 7, pregPri: false },
    { compound: 'Riboflavin (B2)', unit: 'mg', pri: fromOne, m: [0.4, 0.6, 0.7, 1.0, 1.4, 1.6, 1.6], f: [0.4, 0.6, 0.7, 1.0, 1.4, 1.6, 1.6], preg: 1.9, lact: 2.0, pregPri: true },
    { compound: 'Thiamin (B1)', unit: 'mg/MJ', note: 'Per MJ of energy.', pri: all, m: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], f: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], preg: 0.1, lact: 0.1, pregPri: true },
    { compound: 'Vitamin A (RE)', unit: 'µg RE', note: 'As retinol equivalents (1 µg RE = 6 µg β-carotene), not RAE.', pri: all, m: [250, 250, 300, 400, 600, 750, 750], f: [250, 250, 300, 400, 600, 650, 650], preg: 700, lact: 1300, pregPri: true },
    { compound: 'Vitamin B6', unit: 'mg', pri: fromOne, m: [0.3, 0.6, 0.7, 1.0, 1.4, 1.7, 1.7], f: [0.3, 0.6, 0.7, 1.0, 1.4, 1.6, 1.6], preg: 1.8, lact: 1.7, pregPri: true },
    { compound: 'Vitamin C (Total)', unit: 'mg', pri: all, m: [20, 20, 30, 45, 70, 100, 110], f: [20, 20, 30, 45, 70, 90, 95], preg: 105, lact: 155, pregPri: true },
    { compound: 'Vitamin D (Total)', unit: 'µg', pri: [], m: [10, 15, 15, 15, 15, 15, 15], f: [10, 15, 15, 15, 15, 15, 15], preg: 15, lact: 15, pregPri: false },
    { compound: 'Vitamin K (Total)', unit: 'µg', note: 'Based on phylloquinone only.', pri: [], m: [10, 12, 20, 30, 45, 65, 70], f: [10, 12, 20, 30, 45, 65, 70], preg: 70, lact: 70, pregPri: false },
  ];
  for (const c of cols) {
    g.forEach(([label, age], i) => {
      const type: DvValueType = c.pri.includes(i) ? 'RDA' : 'AI';
      const note = c.compound === 'Vitamin D (Total)' && i > 0 ? vitD : c.note;
      add({ compound: c.compound, type, sexes: M, age, value: c.m[i], unit: c.unit, note, from: `DRV Table 9 ${type === 'RDA' ? 'PRI' : 'AI'}, ${c.compound}, ${label}` });
      add({ compound: c.compound, type, sexes: F, age, value: c.f[i], unit: c.unit, note, from: `DRV Table 11 ${type === 'RDA' ? 'PRI' : 'AI'}, ${c.compound}, ${label}` });
    });
    const note = c.compound === 'Vitamin D (Total)' ? vitD : c.note;
    const pregType: DvValueType = c.pregPri ? 'RDA' : 'AI';
    const lactType: DvValueType = (c.lactPri ?? c.pregPri) ? 'RDA' : 'AI';
    add({ compound: c.compound, type: pregType, sexes: F, stage: 'PREGNANT', age: ADULT, value: c.preg, unit: c.unit, note, from: `DRV Table 11, ${c.compound}, Pregnancy` });
    add({ compound: c.compound, type: lactType, sexes: F, stage: 'LACTATING', age: ADULT, value: c.lact, unit: c.unit, note, from: `DRV Table 11, ${c.compound}, Lactation` });
  }
}

// ───────────────────────── UL summary (version 11, August 2025) ─────────────────────────
{
  // Columns: 4-6 mo, 7-11 mo, 1-3 y, 4-6 y, 7-10 y, 11-14 y, 15-17 y, Adults, Pregnancy, Lactation.
  const ages: Array<[string, Age]> = [['4-6 mo', [4, 5]], ['7-11 mo', [6, 11]], ['1-3 y', [12, 47]], ['4-6 y', [48, 83]], ['7-10 y', [84, 131]], ['11-14 y', [132, 179]], ['15-17 y', [180, 215]], ['Adults', ADULT]];
  type Row = { compound: string; unit: string; table: string; note?: string; supplementalOnly?: boolean; cells: (number | null)[]; preg: number | null; lact: number | null };
  const rows: Row[] = [
    { compound: 'Boron', unit: 'mg', table: 'UL Table 1', cells: [null, null, 3, 4, 5, 7, 9, 10], preg: 10, lact: 10 },
    { compound: 'Calcium', unit: 'mg', table: 'UL Table 1', cells: [null, null, null, null, null, null, null, 2500], preg: 2500, lact: 2500 },
    { compound: 'Copper', unit: 'mg', table: 'UL Table 1', cells: [null, null, 1, 2, 3, 4, 4, 5], preg: null, lact: null },
    { compound: 'Iodine', unit: 'µg', table: 'UL Table 1', cells: [null, null, 200, 250, 300, 450, 500, 600], preg: 600, lact: 600 },
    { compound: 'Magnesium', unit: 'mg', table: 'UL Table 1', supplementalOnly: true, note: 'Readily dissociable Mg salts and MgO in supplements, water or added to foods; excludes Mg naturally present in foods.', cells: [null, null, null, 250, 250, 250, 250, 250], preg: 250, lact: 250 },
    { compound: 'Molybdenum', unit: 'mg', table: 'UL Table 1', cells: [null, null, 0.1, 0.2, 0.25, 0.4, 0.5, 0.6], preg: 0.6, lact: 0.6 },
    { compound: 'Selenium', unit: 'µg', table: 'UL Table 1', cells: [45, 55, 70, 95, 130, 180, 230, 255], preg: 255, lact: 255 },
    { compound: 'Zinc', unit: 'mg', table: 'UL Table 1', cells: [null, null, 7, 10, 13, 18, 22, 25], preg: 25, lact: 25 },
    { compound: 'Folic Acid (Synthetic)', unit: 'µg', table: 'UL Table 3', supplementalOnly: true, note: 'Folic acid and authorised MTHF salts added to foods or in supplements; excludes natural food folate.', cells: [200, 200, 200, 300, 400, 600, 800, 1000], preg: 1000, lact: 1000 },
    { compound: 'Nicotinamide', unit: 'mg', table: 'UL Table 3', cells: [null, null, 150, 220, 350, 500, 700, 900], preg: null, lact: null },
    { compound: 'Nicotinic Acid', unit: 'mg', table: 'UL Table 3', cells: [null, null, 2, 3, 4, 6, 8, 10], preg: null, lact: null },
    { compound: 'Retinol', unit: 'µg RE', table: 'UL Table 3', note: 'Preformed vitamin A (retinol and retinyl esters).', cells: [600, 600, 800, 1100, 1500, 2000, 2600, 3000], preg: 3000, lact: 3000 },
    { compound: 'Vitamin B6', unit: 'mg', table: 'UL Table 3', cells: [2.2, 2.5, 3.2, 4.5, 6.1, 8.6, 10.7, 12], preg: 12, lact: 12 },
    { compound: 'Vitamin E (Total)', unit: 'mg', table: 'UL Table 3', note: 'Review of this UL is ongoing.', cells: [null, null, 100, 120, 160, 220, 260, 300], preg: 300, lact: 300 },
  ];
  for (const r of rows) {
    ages.forEach(([label, age], i) => {
      const v = r.cells[i];
      if (v != null) add({ compound: r.compound, type: 'UL', age, value: v, unit: r.unit, note: r.note, supplementalOnly: r.supplementalOnly, from: `${r.table}, ${r.compound}, ${label}` });
    });
    if (r.preg != null) add({ compound: r.compound, type: 'UL', sexes: F, stage: 'PREGNANT', age: ADULT, value: r.preg, unit: r.unit, note: r.note, supplementalOnly: r.supplementalOnly, from: `${r.table}, ${r.compound}, Pregnancy` });
    if (r.lact != null) add({ compound: r.compound, type: 'UL', sexes: F, stage: 'LACTATING', age: ADULT, value: r.lact, unit: r.unit, note: r.note, supplementalOnly: r.supplementalOnly, from: `${r.table}, ${r.compound}, Lactation` });
  }
  // Vitamin D: 0-6 mo, 7-11 mo, 1-3, 4-6, 7-10, 11-14, 15-17, Adults, Pregnancy, Lactation.
  const vd: Array<[string, Age, number]> = [['0-6 mo', [0, 5], 25], ['7-11 mo', [6, 11], 35], ['1-3 y', [12, 47], 50], ['4-6 y', [48, 83], 50], ['7-10 y', [84, 131], 50], ['11-14 y', [132, 179], 100], ['15-17 y', [180, 215], 100], ['Adults', ADULT, 100]];
  for (const [label, age, v] of vd) add({ compound: 'Vitamin D (Total)', type: 'UL', age, value: v, unit: 'µg', from: `UL Table 3, Vitamin D, ${label}` });
  for (const stage of ['PREGNANT', 'LACTATING'] as const) add({ compound: 'Vitamin D (Total)', type: 'UL', sexes: F, stage, age: ADULT, value: 100, unit: 'µg', from: `UL Table 3, Vitamin D, ${stage}` });
  // Fluoride UL: <1 y, 1-3, 4-8; ND from 9 y (safe levels instead — not stored).
  const fl: Array<[string, Age, number]> = [['<1 y', [0, 11], 1.0], ['1-3 y', [12, 47], 1.6], ['4-8 y', [48, 107], 2.0]];
  for (const [label, age, v] of fl) add({ compound: 'Fluoride', type: 'UL', age, value: v, unit: 'mg', from: `UL Table 1, Fluoride, ${label}` });
}

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths || (a.activityLevel ?? '').localeCompare(b.activityLevel ?? '') || (a.dietaryContext ?? '').localeCompare(b.dietaryContext ?? ''));
writeFileSync(path.join(process.cwd(), 'dv-sources', 'efsa-drv', 'values.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${out.length} values to dv-sources/efsa-drv/values.json`);
