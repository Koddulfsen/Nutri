/**
 * Vietnam — Nhu cầu dinh dưỡng khuyến nghị cho người Việt Nam (Recommended Dietary Allowances for Vietnamese),
 * National Institute of Nutrition / Ministry of Health, issued with decision 2615/QĐ-BYT of 16 June 2016 -> values.json.
 *
 * Transcribed 2026-09-20 from the official book (vietnam-rda-2016.pdf, 188 pages) via its text layer (pdftotext -layout).
 * The per-nutrient chapter tables (Bảng 16-42) are used wherever they exist, because they publish EAR / RDA / AI / UL per
 * sex, while the appendix (Phụ lục) only summarises RDA/AI. The appendix supplies what the chapters do not:
 *   - Phụ lục 1.1 energy by physical activity level,
 *   - Phụ lục 2.1 protein (g/day and % of energy),
 *   - Phụ lục 3.1-3.3 fat, PUFA, linoleic and alpha-linolenic acid (% of energy),
 *   - Phụ lục 4 carbohydrate and fibre (g/day),
 *   - Phụ lục 7.2 sodium, potassium and chloride,
 *   - vitamin B1 and B2 pregnancy/lactation increments.
 *
 * Mapping: RDA -> RDA, AI -> AI, EAR -> EAR, UL -> UL; energy ("nhu cầu khuyến nghị năng lượng") -> EER; "% năng lượng
 * khẩu phần" ranges -> AMDR; the diet goals in Phụ lục 7.2 ("Mục tiêu chế độ ăn", DG) -> CDRR.
 *
 * Decisions:
 *   - Age bands as printed: 0-5, 6-8, 9-11 months; 1-2, 3-5, 6-7, 8-9, 10-11, 12-14, 15-19, 20-29, 30-49, 50-69, >=70 y.
 *     Vitamins A, E and K and chromium use 6-12 months and split 15-17 / 18-19 (chromium 15-17 / 18-29); those are stored
 *     as printed.
 *   - Physical activity: nhẹ / trung bình / nặng -> SEDENTARY / MODERATE / ACTIVE. Infants and children to 5 y have one
 *     value, printed in the moderate column, and are stored without an activity level.
 *   - Pregnancy and lactation rows carry no age in the chapters and are stored for women 20-49 y [240, 599]. Where the book
 *     prints trimesters (selenium, vitamin A, zinc, iron increments, appendix energy/protein) they are stored per
 *     trimester, and where it splits lactation by month (selenium, zinc) as LACTATING_0_6M / LACTATING_7_12M.
 *   - Increments ("+x" / "(+) x") are stored as totals over the matching non-pregnant bands (women 20-29 and 30-49 y).
 *   - Iron is published for diets of 10% and 15% bioavailability: the 10% value is stored and the 15% value noted. Rows for
 *     menstruating girls and women ("Có kinh nguyệt") are stored, with the non-menstruating value in the note; for lactation
 *     the book prints both "menstruation not yet returned" (stored) and "returned".
 *   - Zinc is published for poor / moderate / good absorption (15% / 30% / 50% bioavailability), stored as
 *     PHYTATE_HIGH / PHYTATE_MED_HIGH / PHYTATE_LOW respectively, with the bioavailability in each note. Infant footnotes
 *     (breast fed, formula fed, plant-based foods high in phytate) are kept in the notes.
 *   - Vitamin A is in µg RAE -> Vitamin A (RAE); its UL excludes provitamin A carotenoids and is stored on Retinol.
 *     Vitamin E is alpha-tocopherol; vitamin K is stored on Vitamin K (Total) as published ("vitamin K").
 *   - Amino acid requirements (Phụ lục 2.2-2.3) are published per kg body weight and per g protein only, and water
 *     (Phụ lục 7.1) per kg or per kcal, so neither is stored.
 *   - The appendix and the chapter tables disagree in a few cells (e.g. zinc boys 10-11 y 17.1 vs 17.2 mg, boys 12-14 y
 *     good absorption 5.4 vs 6.4 mg, lactation 7-12 months 6.0 vs 6.6 mg). The chapter value is stored and the appendix
 *     value noted.
 *
 * Run: npx tsx dv-sources/vietnam-rda-2016/extract.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage, Activity, DietaryContext } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
const out: SourceValue[] = [];
const BOTH: Sex[] = ['MALE', 'FEMALE'];
const F: Sex[] = ['FEMALE'];
const r4 = (n: number) => Math.round(n * 10000) / 10000;
const num = (s: string) => { const v = Number(s.replace(',', '.')); if (Number.isNaN(v)) throw new Error(`number "${s}"`); return v; };

interface P { compound: string; type: DvValueType; sexes: Sex[]; stage?: LifeStage; age: Age; value: number; min?: number | null; max?: number | null; unit: string; pct?: boolean; activity?: Activity | null; diet?: DietaryContext | null; note?: string | null; from: string }
function push(p: P) {
  for (const sex of p.sexes) out.push({
    compound: p.compound, valueType: p.type, sex, lifeStage: p.stage ?? 'NONE', ageMinMonths: p.age[0], ageMaxMonths: p.age[1],
    activityLevel: p.activity ?? null, dietaryContext: p.diet ?? null, value: p.value, valueMin: p.min ?? null, valueMax: p.max ?? null,
    unit: p.unit, isPercentOfEnergy: p.pct ?? false, isProvisional: false, supplementalOnly: false, note: p.note ?? null, from: p.from,
  });
}

/** The 14 age bands most chapter tables use. */
const STD: Array<[string, Age]> = [['0-5 tháng', [0, 5]], ['6-8 tháng', [6, 8]], ['9-11 tháng', [9, 11]], ['1-2 tuổi', [12, 35]], ['3-5 tuổi', [36, 71]],
  ['6-7 tuổi', [72, 95]], ['8-9 tuổi', [96, 119]], ['10-11 tuổi', [120, 143]], ['12-14 tuổi', [144, 179]], ['15-19 tuổi', [180, 239]],
  ['20-29 tuổi', [240, 359]], ['30-49 tuổi', [360, 599]], ['50-69 tuổi', [600, 839]], ['>= 70 tuổi', [840, null]]];
/** Vitamins A, E and K: 6-12 months in one row, 15-17 and 18-19 split. */
const VIT: Array<[string, Age]> = [['0-5 tháng', [0, 5]], ['6-12 tháng', [6, 11]], ['1-2 tuổi', [12, 35]], ['3-5 tuổi', [36, 71]], ['6-7 tuổi', [72, 95]],
  ['8-9 tuổi', [96, 119]], ['10-11 tuổi', [120, 143]], ['12-14 tuổi', [144, 179]], ['15-17 tuổi', [180, 215]], ['18-19 tuổi', [216, 239]],
  ['20-29 tuổi', [240, 359]], ['30-49 tuổi', [360, 599]], ['50-69 tuổi', [600, 839]], ['> 70 tuổi', [840, null]]];
/** Chromium: 6-11 months in one row, 15-17 and 18-29 split. */
const CR: Array<[string, Age]> = [['0-5 tháng', [0, 5]], ['6-11 tháng', [6, 11]], ['1-2 tuổi', [12, 35]], ['3-5 tuổi', [36, 71]], ['6-7 tuổi', [72, 95]],
  ['8-9 tuổi', [96, 119]], ['10-11 tuổi', [120, 143]], ['12-14 tuổi', [144, 179]], ['15-17 tuổi', [180, 215]], ['18-29 tuổi', [216, 359]],
  ['30-49 tuổi', [360, 599]], ['50-69 tuổi', [600, 839]], ['>70 tuổi', [840, null]]];

const PREG_AGE: Age = [240, 599];
const W20: Age = [240, 359];
const W30: Age = [360, 599];
const PREG_NOTE = 'Printed without an age for pregnancy/lactation; stored for women 20-49 y.';

/**
 * A chapter table: `types` are the columns published per sex (in order), `rows` one string per age band with one token per
 * column and per sex (male columns first, then female), "-" for a blank cell.
 */
interface Chapter { table: string; compound: string; unit: string; types: DvValueType[]; ages: Array<[string, Age]>; rows: string[]; sexed?: boolean; note?: string }
function chapter(c: Chapter) {
  const perSex = c.types.length;
  const width = c.sexed === false ? perSex : perSex * 2;
  if (c.rows.length !== c.ages.length) throw new Error(`${c.compound}: ${c.rows.length} rows for ${c.ages.length} bands`);
  c.rows.forEach((text, i) => {
    const t = text.split(' ');
    if (t.length !== width) throw new Error(`${c.compound} ${c.ages[i][0]}: ${t.length} cells for ${width}`);
    const [label, age] = c.ages[i];
    const groups: Array<[Sex[], string[]]> = c.sexed === false ? [[BOTH, t]] : [[['MALE'], t.slice(0, perSex)], [['FEMALE'], t.slice(perSex)]];
    for (const [sexes, cells] of groups) cells.forEach((tok, k) => {
      if (tok === '-') return;
      push({ compound: c.compound, type: c.types[k], sexes, age, value: num(tok), unit: c.unit, note: c.note,
        from: `${c.table}, ${c.compound} ${c.types[k]}, ${label}${c.sexed === false ? '' : sexes[0] === 'MALE' ? ' (nam)' : ' (nữ)'}` });
    });
  });
}
/** Pregnancy / lactation rows of a chapter table (female only, one token per type). */
function stageRow(table: string, compound: string, unit: string, types: DvValueType[], stage: LifeStage, label: string, text: string, note?: string, age: Age = PREG_AGE) {
  const t = text.split(' ');
  if (t.length !== types.length) throw new Error(`${compound} ${label}: ${t.length} cells for ${types.length}`);
  t.forEach((tok, k) => {
    if (tok === '-') return;
    push({ compound, type: types[k], sexes: F, stage, age, value: num(tok), unit, note: [note, PREG_NOTE].filter(Boolean).join(' '), from: `${table}, ${compound} ${types[k]}, ${label}` });
  });
}
/** An increment over the two adult women's bands, stored as totals. */
function increment(table: string, compound: string, unit: string, type: DvValueType, stage: LifeStage, label: string, inc: number, bases: [number, number], note?: string) {
  ([[W20, bases[0], '20-29 tuổi'], [W30, bases[1], '30-49 tuổi']] as const).forEach(([age, base, band]) => {
    push({ compound, type, sexes: F, stage, age, value: r4(base + inc), unit,
      note: [note, `Printed as +${inc} over women ${band} (${base}); stored as total.`].filter(Boolean).join(' '), from: `${table}, ${compound}, ${label} +${inc} over ${band}` });
  });
}

// ── Bảng 16: calcium ──
chapter({ table: 'Bảng 16 (p. 58)', compound: 'Calcium', unit: 'mg', types: ['RDA', 'UL'], ages: STD, rows: [
  '300 1000 300 1000', '400 1500 400 1500', '400 1500 400 1500', '500 2500 500 2500', '600 2500 600 2500', '650 2500 650 2500', '700 3000 700 3000',
  '1000 3000 1000 3000', '1000 3000 1000 3000', '1000 3000 1000 3000', '800 2500 800 2500', '800 2500 800 2500', '800 2000 900 2000', '1000 2000 1000 2000'] });
stageRow('Bảng 16 (p. 58)', 'Calcium', 'mg', ['RDA', 'UL'], 'PREGNANT', 'Phụ nữ có thai', '1200 2500');
stageRow('Bảng 16 (p. 58)', 'Calcium', 'mg', ['RDA', 'UL'], 'LACTATING', 'Phụ nữ cho con bú', '1300 2500');

// ── Bảng 17: phosphorus ──
chapter({ table: 'Bảng 17 (p. 60)', compound: 'Phosphorus', unit: 'mg', types: ['RDA', 'UL'], ages: STD, rows: [
  '100 - 100 -', '275 - 275 -', '330 - 330 -', '460 - 460 -', '500 - 500 -', '500 - 500 -', '500 - 500 -', '1250 - 1250 -', '1250 - 1250 -', '1250 - 1250 -',
  '700 3000 700 3000', '700 3000 700 3000', '700 3000 700 3000', '700 3000 700 3000'] });
stageRow('Bảng 17 (p. 60)', 'Phosphorus', 'mg', ['RDA', 'UL'], 'PREGNANT', 'PN có thai', '700 3500');
stageRow('Bảng 17 (p. 60)', 'Phosphorus', 'mg', ['RDA', 'UL'], 'LACTATING', 'PN cho con bú', '700 4000');

// ── Bảng 18: magnesium ──
chapter({ table: 'Bảng 18 (p. 61)', compound: 'Magnesium', unit: 'mg', types: ['EAR', 'RDA'], ages: STD, rows: [
  '- 40 - 40', '- 50 - 50', '- 60 - 60', '60 70 60 70', '80 100 80 100', '110 130 110 130', '140 170 140 160', '180 210 170 210', '240 290 230 280',
  '290 350 250 300', '280 340 230 270', '310 370 240 290', '290 350 240 290', '270 320 220 260'] });
increment('Bảng 18 (p. 61)', 'Magnesium', 'mg', 'EAR', 'PREGNANT', 'Phụ nữ có thai', 30, [230, 240]);
increment('Bảng 18 (p. 61)', 'Magnesium', 'mg', 'RDA', 'PREGNANT', 'Phụ nữ có thai', 40, [270, 290]);
increment('Bảng 18 (p. 61)', 'Magnesium', 'mg', 'RDA', 'LACTATING', 'Phụ nữ cho con bú', 0, [270, 290]);

// ── Bảng 19: iron (10% bioavailability stored, 15% in the note) ──
{
  const T = 'Bảng 19 (p. 65)';
  const FE15 = (v: string) => `Diet of 10% iron bioavailability (stored; 30-90 g meat or fish, or 25-75 mg vitamin C per day). At 15% bioavailability (>90 g meat or fish, or >75 mg vitamin C): ${v} mg.`;
  const rows: Array<[string, Age, string, string, string, string]> = [
    ['0-5 tháng', [0, 5], '0,93', '0,93', '-', '-'], ['6-8 tháng', [6, 8], '8,5', '7,9', '5,6', '5,2'], ['9-11 tháng', [9, 11], '9,4', '8,7', '6,3', '5,8'],
    ['1-2 tuổi', [12, 35], '5,4', '5,1', '3,6', '3,5'], ['3-5 tuổi', [36, 71], '5,5', '5,4', '3,6', '3,6'], ['6-7 tuổi', [72, 95], '7,2', '7,1', '4,8', '4,7'],
    ['8-9 tuổi', [96, 119], '8,9', '8,9', '5,9', '5,9'], ['10-11 tuổi', [120, 143], '11,3', '10,5', '7,5', '7,0'], ['12-14 tuổi', [144, 179], '15,3', '14,0', '10,2', '9,3'],
    ['15-19 tuổi', [180, 239], '17,5', '29,7', '11,6', '19,8'], ['20-29 tuổi', [240, 359], '11,9', '26,1', '7,9', '17,4'], ['30-49 tuổi', [360, 599], '11,9', '26,1', '7,9', '17,4'],
    ['50-69 tuổi', [600, 839], '11,9', '10,0', '7,9', '6,7'], ['> 70 tuổi', [840, null], '11,0', '9,4', '7,3', '6,3'],
  ];
  // Where the book prints a separate menstruating row (girls 10-11 and 12-14 y, women over 50), that value is
  // stored for the band and the plain row's non-menstruating value goes in the note: the model has one value per
  // compound and demographic, and menstruating is the case the RDA is meant to cover.
  const MENS: Record<number, [string, string, string]> = {
    120: ['24,5', '16,4', '10-11 tuổi (Có kinh nguyệt)'], 144: ['32,6', '21,8', '12-14 tuổi (Có kinh nguyệt)'], 600: ['26,1', '17,4', '> 50 tuổi (Có kinh nguyệt)'],
  };
  for (const [label, age, m10, f10, m15, f15] of rows) {
    if (m10 !== '-') push({ compound: 'Iron (Total)', type: 'RDA', sexes: ['MALE'], age, value: num(m10), unit: 'mg', note: FE15(m15 === '-' ? 'not published' : m15), from: `${T}, Iron 10%, ${label} (nam)` });
    if (f10 === '-') continue;
    const mens = MENS[age[0]];
    if (mens) push({ compound: 'Iron (Total)', type: 'RDA', sexes: F, age, value: num(mens[0]), unit: 'mg',
      note: `Menstruating girls/women (stored); non-menstruating ${f10} mg (at 15% bioavailability ${f15} mg). ${FE15(mens[1])}`, from: `${T}, Iron 10%, ${mens[2]}` });
    else push({ compound: 'Iron (Total)', type: 'RDA', sexes: F, age, value: num(f10), unit: 'mg', note: FE15(f15 === '-' ? 'not published' : f15), from: `${T}, Iron 10%, ${label} (nữ)` });
  }
  for (const [stage, label] of [['PREGNANT_T1', '3 tháng đầu'], ['PREGNANT_T2', '3 tháng giữa'], ['PREGNANT_T3', '3 tháng cuối']] as Array<[LifeStage, string]>) {
    increment(T, 'Iron (Total)', 'mg', 'RDA', stage, `Phụ nữ có thai (${label})`, 15, [26.1, 26.1],
      'Printed as +15 mg for the whole of pregnancy at 10% bioavailability (+10 mg at 15%). Iron supplements are recommended for all pregnant women throughout pregnancy; anaemic women need treatment doses.');
  }
  for (const [stage, label] of [['LACTATING_0_6M', 'Phụ nữ cho con bú 0-6 tháng'], ['LACTATING_7_12M', 'Phụ nữ cho con bú 7-12 tháng']] as Array<[LifeStage, string]>) {
    push({ compound: 'Iron (Total)', type: 'RDA', sexes: F, stage, age: PREG_AGE, value: 13.3, unit: 'mg',
      note: `Menstruation not yet returned (stored); after it returns 26.1 mg. ${FE15('8.9 (26.1 after menstruation returns: 17.4)')} ${PREG_NOTE}`, from: `${T}, Iron 10%, ${label}` });
  }
}

// ── Bảng 20: zinc by absorption level ──
{
  const T = 'Bảng 20 (p. 70)';
  const LEVELS: Array<[DietaryContext, string, string]> = [['PHYTATE_HIGH', 'Mức hấp thu kém', 'Poor zinc absorption (bioavailability 15%: little or no animal protein or fish).'],
    ['PHYTATE_MED_HIGH', 'Mức hấp thu vừa', 'Moderate zinc absorption (bioavailability 30%: moderate animal protein or fish; molar phytate:zinc ratio 5-15).'],
    ['PHYTATE_LOW', 'Mức hấp thu tốt', 'Good zinc absorption (bioavailability 50%: diet rich in animal protein or fish).']];
  const rows: Array<[string, Age, string, string | null]> = [
    ['0-5 tháng', [0, 5], '6,6 2,8 1,1 6,6 2,8 1,1', 'Poor: infants fed artificial foods high in phytate and plant protein; moderate: formula fed; good: breast fed.'],
    ['6-8 tháng', [6, 8], '8,3 4,1 2,5 8,3 4,1 2,5', 'Good-absorption value printed as 0.8-2.5 mg (0.8 for exclusively breast-fed infants); 2.5 stored. Not applicable to exclusively breast-fed infants.'],
    ['9-11 tháng', [9, 11], '8,3 4,1 2,5 8,3 4,1 2,5', 'Good-absorption value printed as 0.8-2.5 mg (0.8 for exclusively breast-fed infants); 2.5 stored. Not applicable to exclusively breast-fed infants.'],
    ['1-2 tuổi', [12, 35], '8,3 4,1 2,4 8,3 4,1 2,4', null], ['3-5 tuổi', [36, 71], '9,6 4,8 2,9 9,6 4,8 2,9', null],
    ['6-7 tuổi', [72, 95], '11,2 5,6 3,3 11,2 5,6 3,3', null], ['8-9 tuổi', [96, 119], '12 6,0 3,3 11,2 5,6 3,3', null],
    ['10-11 tuổi', [120, 143], '17,2 8,6 5,2 14,4 7,2 4,3', 'The appendix prints 17.1 mg for boys at poor absorption; the chapter value 17.2 is stored.'],
    ['12-14 tuổi', [144, 179], '18 9,0 6,4 16,0 8,0 4,8', 'The appendix prints 5.4 mg for boys at good absorption; the chapter value 6.4 is stored.'],
    ['15-19 tuổi', [180, 239], '20 10,0 6,0 16,0 8,0 4,8', null], ['20-29 tuổi', [240, 359], '20 10,0 6,0 16,0 8,0 4,8', null],
    ['30-49 tuổi', [360, 599], '20 10,0 6,0 16,0 8,0 4,8', null], ['50-69 tuổi', [600, 839], '20 10,0 6,0 16,0 8,0 4,8', null],
    ['>70 tuổi', [840, null], '18 9,0 5,4 14,0 7,0 4,2', null],
  ];
  for (const [label, age, text, note] of rows) {
    const t = text.split(' ');
    if (t.length !== 6) throw new Error(`Zinc ${label}: ${t.length}`);
    ([[['MALE'] as Sex[], 0, '(nam)'], [F, 3, '(nữ)']] as const).forEach(([sexes, off, sx]) => LEVELS.forEach(([diet, vi, desc], k) => {
      push({ compound: 'Zinc', type: 'RDA', sexes: [...sexes], age, value: num(t[off + k]), unit: 'mg', diet, note: [desc, note].filter(Boolean).join(' '), from: `${T}, Zinc ${vi}, ${label} ${sx}` });
    }));
  }
  const stages: Array<[LifeStage, string, string]> = [['PREGNANT_T1', '3 tháng đầu', '20,0 10,0 6,0'], ['PREGNANT_T2', '3 tháng giữa', '20,0 10,0 6,0'],
    ['PREGNANT_T3', '3 tháng cuối', '20,0 10,0 6,0'], ['LACTATING_0_6M', 'Phụ nữ cho con bú 0-6 tháng', '22,0 11,0 6,6'], ['LACTATING_7_12M', 'Phụ nữ cho con bú 7-12 tháng', '22,0 11,0 6,6']];
  for (const [stage, label, text] of stages) {
    const t = text.split(' ');
    LEVELS.forEach(([diet, vi, desc], k) => push({ compound: 'Zinc', type: 'RDA', sexes: F, stage, age: PREG_AGE, value: num(t[k]), unit: 'mg', diet,
      note: [desc, stage === 'LACTATING_7_12M' ? 'The appendix prints 6.0 mg at good absorption for months 7-12; the chapter value 6.6 is stored.' : null, PREG_NOTE].filter(Boolean).join(' '),
      from: `${T}, Zinc ${vi}, ${label}` }));
  }
}

// ── Bảng 21: iodine ──
chapter({ table: 'Bảng 21 (p. 73)', compound: 'Iodine', unit: 'µg', types: ['EAR', 'RDA', 'AI', 'UL'], ages: STD, rows: [
  '- - 100 250 - - 100 250', '- - 130 250 - - 130 250', '- - 130 250 - - 130 250', '65 90 - 250 65 90 - 250', '65 90 - 350 65 90 - 350',
  '65 90 - 500 65 90 - 500', '73 120 - 600 73 120 - 600', '73 120 - 600 73 120 - 600', '73 120 - 600 73 120 - 600', '95 150 - 900 95 150 - 900',
  '95 150 - 1100 95 150 - 1100', '95 150 - 1100 95 150 - 1100', '95 150 - 1100 95 150 - 1100', '95 150 - 1100 95 150 - 1100'] });
stageRow('Bảng 21 (p. 73)', 'Iodine', 'µg', ['RDA', 'UL'], 'PREGNANT', 'Phụ nữ mang thai', '220 1100');
stageRow('Bảng 21 (p. 73)', 'Iodine', 'µg', ['RDA', 'UL'], 'LACTATING', 'Phụ nữ cho con bú', '250 1100');

// ── Bảng 22: selenium ──
chapter({ table: 'Bảng 22 (p. 75)', compound: 'Selenium', unit: 'µg', types: ['RDA', 'UL'], ages: STD, rows: [
  '6 45 6 45', '10 60 10 60', '10 60 10 60', '17 80 17 70', '20 110 20 110', '22 150 22 150', '22 190 22 180', '32 240 26 240', '32 330 26 320',
  '32 400 26 350', '34 420 26 330', '34 460 26 350', '34 440 26 350', '33 400 25 330'] });
(['PREGNANT_T1', 'PREGNANT_T2', 'PREGNANT_T3'] as LifeStage[]).forEach((stage, i) =>
  stageRow('Bảng 22 (p. 75)', 'Selenium', 'µg', ['RDA', 'UL'], stage, `Phụ nữ mang thai ${['3 tháng đầu', '3 tháng giữa', '3 tháng cuối'][i]}`, `${[26, 28, 30][i]} 400`));
stageRow('Bảng 22 (p. 75)', 'Selenium', 'µg', ['RDA', 'UL'], 'LACTATING_0_6M', 'Phụ nữ cho con bú 6 tháng đầu', '35 400');
stageRow('Bảng 22 (p. 75)', 'Selenium', 'µg', ['RDA', 'UL'], 'LACTATING_7_12M', 'Phụ nữ cho con bú 6 tháng sau', '42 400');

// ── Bảng 23: copper ──
chapter({ table: 'Bảng 23 (p. 78)', compound: 'Copper', unit: 'µg', types: ['EAR', 'RDA', 'AI', 'UL'], ages: STD, rows: [
  '- - 200 - - - 200 -', '- - 220 - - - 220 -', '- - 220 - - - 220 -', '260 340 - 1000 260 340 - 1000', '340 440 - 3000 340 440 - 3000',
  '340 440 - 3000 340 440 - 3000', '540 700 - 3000 540 700 - 3000', '540 700 - 5000 540 700 - 5000', '540 700 - 5000 540 700 - 5000',
  '685 890 - 8000 685 890 - 8000', '700 900 - 10000 700 900 - 10000', '700 900 - 10000 700 900 - 10000', '700 900 - 10000 700 900 - 10000',
  '700 900 - 10000 700 900 - 10000'] });
stageRow('Bảng 23 (p. 78)', 'Copper', 'µg', ['EAR', 'RDA', 'UL'], 'PREGNANT', 'Phụ nữ có thai', '800 1000 10000');
stageRow('Bảng 23 (p. 78)', 'Copper', 'µg', ['EAR', 'RDA', 'UL'], 'LACTATING', 'Phụ nữ cho con bú', '1000 1300 10000');

// ── Bảng 24: chromium ──
chapter({ table: 'Bảng 24 (p. 80)', compound: 'Chromium', unit: 'µg', types: ['AI'], ages: CR, rows: [
  '0,2 0,2', '5,5 5,5', '11 11', '15 15', '15 15', '25 21', '25 21', '25 21', '35 24', '35 25', '35 25', '30 20', '30 20'] });
stageRow('Bảng 24 (p. 80)', 'Chromium', 'µg', ['AI'], 'PREGNANT', 'Phụ nữ có thai', '29');
stageRow('Bảng 24 (p. 80)', 'Chromium', 'µg', ['AI'], 'LACTATING', 'Phụ nữ cho con bú', '45');

// ── Bảng 25: manganese ──
chapter({ table: 'Bảng 25 (p. 82)', compound: 'Manganese', unit: 'mg', types: ['AI', 'UL'], ages: STD, rows: [
  '0,003 - 0,003 -', '0,6 - 0,6 -', '0,6 - 0,6 -', '1,2 2 1,2 2', '1,5 3 1,5 3', '1,5 3 1,5 3', '1,9 6 1,6 6', '1,9 6 1,6 6', '1,9 6 1,6 6',
  '2,2 9 1,6 9', '2,3 11 1,8 11', '2,3 11 1,8 11', '2,3 11 1,8 11', '2,3 11 1,8 11'], note: 'Upper level for infants: not established ("Không xác định").' });
stageRow('Bảng 25 (p. 82)', 'Manganese', 'mg', ['AI', 'UL'], 'PREGNANT', 'Phụ nữ có thai', '2,0 11');
stageRow('Bảng 25 (p. 82)', 'Manganese', 'mg', ['AI', 'UL'], 'LACTATING', 'Phụ nữ cho con bú', '2,6 11');

// ── Bảng 26: fluoride ──
chapter({ table: 'Bảng 26 (p. 85)', compound: 'Fluoride', unit: 'mg', types: ['AI', 'UL'], ages: STD, rows: [
  '0,01 0,7 0,01 0,7', '0,5 0,9 0,5 0,9', '0,5 0,9 0,5 0,9', '0,7 1,3 0,7 1,3', '1 2,2 1 2,2', '1 2,2 1 2,2', '2 10 2 10', '2 10 2 10', '2 10 2 10',
  '3 10 3 10', '4 10 3 10', '4 10 3 10', '4 10 3 10', '4 10 3 10'] });
stageRow('Bảng 26 (p. 85)', 'Fluoride', 'mg', ['AI', 'UL'], 'PREGNANT', 'Phụ nữ có thai', '3 10');
stageRow('Bảng 26 (p. 85)', 'Fluoride', 'mg', ['AI', 'UL'], 'LACTATING', 'Phụ nữ cho con bú', '3 10');

// ── Bảng 27: vitamin A (UL is on Retinol: preformed only) ──
{
  const T = 'Bảng 27 (p. 88)';
  chapter({ table: T, compound: 'Vitamin A (RAE)', unit: 'µg RAE', types: ['EAR', 'RDA', 'AI'], ages: VIT, rows: [
    '- - 300 - - 300', '- - 400 - - 400', '300 400 - 250 350 -', '350 500 - 300 400 -', '300 450 - 300 400 -', '350 500 - 350 500 -', '450 600 - 400 600 -',
    '550 800 - 500 700 -', '650 900 - 500 650 -', '600 850 - 450 650 -', '600 850 - 450 650 -', '650 900 - 500 700 -', '600 850 - 500 700 -', '550 800 - 450 650 -'],
    note: 'Includes provitamin A carotenoids (µg RAE).' });
  chapter({ table: T, compound: 'Retinol', unit: 'µg RAE', types: ['UL'], ages: VIT, rows: [
    '600 600', '600 600', '600 600', '700 700', '900 900', '1200 1200', '1500 1500', '2100 2100', '2600 2600', '2700 2700', '2700 2700', '2700 2700', '2700 2700', '2700 2700'],
    note: 'Upper level excludes provitamin A carotenoids (preformed vitamin A).' });
  (['PREGNANT_T1', 'PREGNANT_T2', 'PREGNANT_T3'] as LifeStage[]).forEach((stage, i) => {
    const [ear, rda] = [[0, 0], [0, 0], [60, 80]][i];
    increment(T, 'Vitamin A (RAE)', 'µg RAE', 'EAR', stage, `Phụ nữ có thai ${['3 tháng đầu', '3 tháng giữa', '3 tháng cuối'][i]}`, ear, [450, 500]);
    increment(T, 'Vitamin A (RAE)', 'µg RAE', 'RDA', stage, `Phụ nữ có thai ${['3 tháng đầu', '3 tháng giữa', '3 tháng cuối'][i]}`, rda, [650, 700]);
  });
  increment(T, 'Vitamin A (RAE)', 'µg RAE', 'EAR', 'LACTATING', 'Phụ nữ cho con bú', 300, [450, 500]);
  increment(T, 'Vitamin A (RAE)', 'µg RAE', 'RDA', 'LACTATING', 'Phụ nữ cho con bú', 450, [650, 700]);
}

// ── Bảng 28: vitamin D ──
chapter({ table: 'Bảng 28 (p. 91)', compound: 'Vitamin D (Total)', unit: 'µg', types: ['RDA', 'UL'], ages: STD, rows: [
  '10 25 10 25', '10 37,5 10 37,5', '10 37,5 10 37,5', '15 62,5 15 62,5', '15 75 15 75', '15 75 15 75', '15 100 15 100', '15 100 15 100', '15 100 15 100',
  '15 100 15 100', '15 100 15 100', '15 100 15 100', '20 100 20 100', '20 100 20 100'] });
stageRow('Bảng 28 (p. 91)', 'Vitamin D (Total)', 'µg', ['RDA', 'UL'], 'PREGNANT', 'Phụ nữ có thai', '20 100');
stageRow('Bảng 28 (p. 91)', 'Vitamin D (Total)', 'µg', ['RDA', 'UL'], 'LACTATING', 'Phụ nữ cho con bú', '20 100');

// ── Bảng 29: vitamin E (alpha-tocopherol) ──
chapter({ table: 'Bảng 29 (p. 95)', compound: 'Vitamin E (Total)', unit: 'mg', types: ['AI', 'UL'], ages: VIT, rows: [
  '3,0 - 3,0 -', '4,0 - 4,0 -', '3,5 150 3,5 150', '4,5 200 4,5 200', '5,0 300 5,0 300', '5,5 350 5,5 350', '5,5 450 5,5 450', '7,5 650 6,0 600',
  '7,5 750 6,0 650', '6,5 800 6,0 650', '6,5 800 6,0 650', '6,5 900 6,0 700', '6,5 850 6,0 700', '6,5 750 6,0 650'], note: 'As alpha-tocopherol.' });
stageRow('Bảng 29 (p. 95)', 'Vitamin E (Total)', 'mg', ['AI'], 'PREGNANT', 'Phụ nữ có thai', '6,5', 'As alpha-tocopherol.');
stageRow('Bảng 29 (p. 95)', 'Vitamin E (Total)', 'mg', ['AI'], 'LACTATING', 'Phụ nữ cho con bú', '7,0', 'As alpha-tocopherol.');

// ── Bảng 30: vitamin K ──
chapter({ table: 'Bảng 30 (p. 98)', compound: 'Vitamin K (Total)', unit: 'µg', types: ['AI'], ages: VIT, rows: [
  '4 4', '7 7', '60 60', '70 70', '85 85', '100 100', '120 120', '150 150', '160 160', '150 150', '150 150', '150 150', '150 150', '150 150'] });
stageRow('Bảng 30 (p. 98)', 'Vitamin K (Total)', 'µg', ['AI'], 'PREGNANT', 'Phụ nữ có thai', '150');
stageRow('Bảng 30 (p. 98)', 'Vitamin K (Total)', 'µg', ['AI'], 'LACTATING', 'Phụ nữ cho con bú', '150');

// ── Bảng 31 / 33: thiamin and riboflavin (RDA, AI) ──
chapter({ table: 'Bảng 31 (p. 100)', compound: 'Thiamin (B1)', unit: 'mg', types: ['RDA', 'AI'], ages: STD, rows: [
  '- 0,1 - 0,1', '- 0,2 - 0,2', '- 0,2 - 0,2', '0,5 - 0,5 -', '0,7 - 0,7 -', '0,8 - 0,8 -', '1,0 - 0,9 -', '1,2 - 1,1 -', '1,4 - 1,3 -', '1,4 - 1,2 -',
  '1,3 - 1,1 -', '1,2 - 1,0 -', '1,2 - 1,0 -', '1,1 - 1,0 -'] });
increment('Phụ lục 6 (p. 167)', 'Thiamin (B1)', 'mg', 'RDA', 'PREGNANT', 'Phụ nữ có thai', 0.2, [1.1, 1.0]);
increment('Phụ lục 6 (p. 167)', 'Thiamin (B1)', 'mg', 'RDA', 'LACTATING', 'Phụ nữ cho con bú', 0.2, [1.1, 1.0]);
chapter({ table: 'Bảng 33 (p. 102)', compound: 'Riboflavin (B2)', unit: 'mg', types: ['RDA', 'AI'], ages: STD, rows: [
  '- 0,3 - 0,3', '- 0,4 - 0,4', '- 0,4 - 0,4', '0,6 - 0,5 -', '0,8 - 0,8 -', '0,9 - 0,9 -', '1,1 - 1,0 -', '1,4 - 1,3 -', '1,6 - 1,4 -', '1,7 - 1,4 -',
  '1,5 - 1,2 -', '1,4 - 1,2 -', '1,4 - 1,2 -', '1,3 - 1,1 -'] });
increment('Bảng 33 (p. 102)', 'Riboflavin (B2)', 'mg', 'RDA', 'PREGNANT', 'Phụ nữ có thai', 0.3, [1.2, 1.2]);
increment('Bảng 33 (p. 102)', 'Riboflavin (B2)', 'mg', 'RDA', 'LACTATING', 'Phụ nữ cho con bú', 0.6, [1.2, 1.2]);

// ── Bảng 35: niacin ──
chapter({ table: 'Bảng 35 (p. 109)', compound: 'Niacin (B3)', unit: 'mg', types: ['EAR', 'RDA', 'UL'], ages: STD, rows: [
  '- 2 - - 2 -', '- 4 - - 4 -', '- 4 - - 4 -', '5 6 10 4 6 10', '6 8 10 6 8 10', '6 8 15 6 8 15', '9 12 15 8 12 15', '9 12 20 9 12 20', '11 12 20 11 12 20',
  '12 16 30 11 14 30', '12 16 35 11 14 35', '12 16 35 11 14 35', '12 16 35 11 14 35', '12 16 35 11 14 35'] });
stageRow('Bảng 35 (p. 109)', 'Niacin (B3)', 'mg', ['RDA', 'UL'], 'PREGNANT', 'Phụ nữ có thai', '18 35');
stageRow('Bảng 35 (p. 109)', 'Niacin (B3)', 'mg', ['RDA', 'UL'], 'LACTATING', 'Phụ nữ cho con bú', '17 35');

// ── Bảng 36: pantothenic acid ──
chapter({ table: 'Bảng 36 (p. 113)', compound: 'Pantothenic Acid (B5)', unit: 'mg', types: ['RDA'], ages: STD, rows: [
  '1,7 1,7', '1,7 1,7', '1,8 1,8', '2 2', '3 3', '3 3', '4 4', '4 4', '4 4', '5 5', '5 5', '5 5', '5 5', '5 5'] });
stageRow('Bảng 36 (p. 113)', 'Pantothenic Acid (B5)', 'mg', ['RDA'], 'PREGNANT', 'Phụ nữ có thai', '6');
stageRow('Bảng 36 (p. 113)', 'Pantothenic Acid (B5)', 'mg', ['RDA'], 'LACTATING', 'Phụ nữ cho con bú', '7');

// ── Bảng 37: vitamin B6 ──
chapter({ table: 'Bảng 37 (p. 116)', compound: 'Vitamin B6', unit: 'mg', types: ['EAR', 'RDA', 'AI', 'UL'], ages: STD, rows: [
  '- - 0,1 - - - 0,1 -', '- - 0,3 - - - 0,3 -', '- - 0,3 - - - 0,3 -', '0,4 0,5 - 30 0,4 0,5 - 30', '0,5 0,5 - 40 0,5 0,5 - 40', '0,7 0,8 - 40 0,6 0,8 - 40',
  '0,8 1,0 - 50 0,8 1,0 - 50', '0,8 1,0 - 60 0,8 1,0 - 60', '0,9 1,2 - 60 0,9 1,1 - 60', '1,0 1,3 - 80 1,0 1,2 - 80', '1,1 1,3 - 100 1,1 1,3 - 100',
  '1,1 1,3 - 100 1,1 1,3 - 100', '1,4 1,7 - 100 1,3 1,5 - 100', '1,4 1,7 - 100 1,3 1,5 - 100'] });
stageRow('Bảng 37 (p. 116)', 'Vitamin B6', 'mg', ['EAR', 'RDA', 'UL'], 'PREGNANT', 'Phụ nữ có thai', '1,6 1,9 80');
stageRow('Bảng 37 (p. 116)', 'Vitamin B6', 'mg', ['EAR', 'RDA', 'UL'], 'LACTATING', 'Phụ nữ cho con bú', '1,7 2,0 100');

// ── Bảng 38: folate ──
chapter({ table: 'Bảng 38 (p. 121)', compound: 'Folate (Total)', unit: 'µg', types: ['EAR', 'RDA', 'UL'], ages: STD, rows: [
  '- 65 - - 65 -', '- 80 - - 80 -', '- 80 - - 80 -', '120 100 300 120 100 300', '120 150 350 120 150 350', '160 200 400 160 200 400',
  '200 200 400 200 200 400', '250 300 600 250 300 600', '250 300 600 250 400 600', '320 300 800 320 400 800', '320 400 1000 320 400 1000',
  '320 400 1000 320 400 1000', '320 400 1000 320 400 1000', '320 400 1000 320 400 1000'],
  note: 'The upper level applies to folic acid from fortified foods and supplements (IOM).' });
stageRow('Bảng 38 (p. 121)', 'Folate (Total)', 'µg', ['EAR', 'RDA', 'UL'], 'PREGNANT', 'Phụ nữ có thai', '520 600 800');
stageRow('Bảng 38 (p. 121)', 'Folate (Total)', 'µg', ['EAR', 'RDA', 'UL'], 'LACTATING', 'Phụ nữ cho con bú', '520 500 1000');

// ── Bảng 39: vitamin B12 ──
chapter({ table: 'Bảng 39 (p. 127)', compound: 'Vitamin B12 (Total)', unit: 'µg', types: ['EAR', 'RDA', 'AI'], ages: STD, rows: [
  '- - 0,4 - - 0,4', '- - 0,5 - - 0,5', '- - 0,5 - - 0,5', '0,7 0,9 - 0,7 0,9 -', '1,0 1,0 - 1,0 1,0 -', '1,0 1,2 - 1,0 1,2 -', '1,3 1,5 - 1,3 1,5 -',
  '1,5 1,8 - 1,5 1,8 -', '1,5 2,4 - 1,5 2,4 -', '2,0 2,4 - 2,0 2,4 -', '2,0 2,4 - 2,0 2,4 -', '2,0 2,4 - 2,0 2,4 -', '2,0 2,4 - 2,0 2,4 -', '2,0 2,4 - 2,0 2,4 -'] });
stageRow('Bảng 39 (p. 127)', 'Vitamin B12 (Total)', 'µg', ['EAR', 'RDA'], 'PREGNANT', 'Phụ nữ có thai', '2,2 2,6');
stageRow('Bảng 39 (p. 127)', 'Vitamin B12 (Total)', 'µg', ['EAR', 'RDA'], 'LACTATING', 'Phụ nữ cho con bú', '2,4 2,8');

// ── Bảng 40: biotin ──
chapter({ table: 'Bảng 40 (p. 132)', compound: 'Biotin (B7)', unit: 'µg', types: ['AI'], ages: STD, rows: [
  '5 5', '5 5', '6 6', '8 8', '12 12', '12 12', '20 20', '20 20', '25 25', '25 25', '30 30', '30 30', '30 30', '30 30'] });
stageRow('Bảng 40 (p. 132)', 'Biotin (B7)', 'µg', ['AI'], 'PREGNANT', 'Phụ nữ có thai', '30');
stageRow('Bảng 40 (p. 132)', 'Biotin (B7)', 'µg', ['AI'], 'LACTATING', 'Phụ nữ cho con bú', '35');

// ── Bảng 41: vitamin C ──
chapter({ table: 'Bảng 41 (p. 135)', compound: 'Vitamin C (Total)', unit: 'mg', types: ['EAR', 'RDA', 'AI'], ages: STD, rows: [
  '- - 40 - - 40', '- - 40 - - 40', '- - 40 - - 40', '30 35 - 30 35 -', '35 40 - 35 40 -', '45 55 - 45 55 -', '50 60 - 50 60 -', '60 75 - 60 75 -',
  '80 95 - 80 95 -', '85 100 - 85 100 -', '85 100 - 85 100 -', '85 100 - 85 100 -', '85 100 - 85 100 -', '85 100 - 85 100 -'],
  note: 'Does not allow for losses in storage and cooking.' });
increment('Bảng 41 (p. 135)', 'Vitamin C (Total)', 'mg', 'EAR', 'PREGNANT', 'Phụ nữ có thai', 10, [85, 85]);
increment('Bảng 41 (p. 135)', 'Vitamin C (Total)', 'mg', 'RDA', 'PREGNANT', 'Phụ nữ có thai', 10, [100, 100]);
increment('Bảng 41 (p. 135)', 'Vitamin C (Total)', 'mg', 'EAR', 'LACTATING', 'Phụ nữ cho con bú', 40, [85, 85]);
increment('Bảng 41 (p. 135)', 'Vitamin C (Total)', 'mg', 'RDA', 'LACTATING', 'Phụ nữ cho con bú', 45, [100, 100]);

// ── Bảng 42: choline ──
chapter({ table: 'Bảng 42 (p. 138)', compound: 'Choline (Total)', unit: 'mg', types: ['AI', 'UL'], ages: STD, rows: [
  '125 - 125 -', '150 - 150 -', '150 - 150 -', '200 1000 200 1000', '250 1000 250 1000', '250 1000 250 1000', '250 1000 250 1000', '375 2000 375 2000',
  '550 2000 400 2000', '550 3000 425 3000', '550 3500 425 3500', '550 3500 425 3500', '550 3500 425 3500', '550 3500 425 3500'] });
stageRow('Bảng 42 (p. 138)', 'Choline (Total)', 'mg', ['AI', 'UL'], 'PREGNANT', 'Phụ nữ có thai', '450 3500');
stageRow('Bảng 42 (p. 138)', 'Choline (Total)', 'mg', ['AI', 'UL'], 'LACTATING', 'Phụ nữ cho con bú', '550 3500');

// ── Phụ lục 1.1: energy by physical activity level ──
{
  const T = 'Phụ lục 1.1 (p. 151)';
  const ACT: Array<[Activity, string]> = [['SEDENTARY', 'HĐTL nhẹ'], ['MODERATE', 'HĐTL trung bình'], ['ACTIVE', 'HĐTL nặng']];
  const rows: Array<[string, Age, string]> = [
    ['0-5 tháng', [0, 5], '- 550 - - 500 -'], ['6-8 tháng', [6, 8], '- 650 - - 600 -'], ['9-11 tháng', [9, 11], '- 700 - - 650 -'],
    ['1-2 tuổi', [12, 35], '- 1000 - - 930 -'], ['3-5 tuổi', [36, 71], '- 1320 - - 1230 -'], ['6-7 tuổi', [72, 95], '1360 1570 1770 1270 1460 1650'],
    ['8-9 tuổi', [96, 119], '1600 1820 2050 1510 1730 1940'], ['10-11 tuổi', [120, 143], '1880 2150 2400 1740 1980 2220'],
    ['12-14 tuổi', [144, 179], '2200 2500 2790 2040 2310 2580'], ['15-19 tuổi', [180, 239], '2500 2820 3140 2110 2380 2650'],
    ['20-29 tuổi', [240, 359], '2200 2570 2940 1760 2050 2340'], ['30-49 tuổi', [360, 599], '2010 2350 2680 1730 2010 2300'],
    ['50-69 tuổi', [600, 839], '2000 2330 2660 1700 1980 2260'], ['≥70 tuổi', [840, null], '1870 2190 2520 1550 1820 2090'],
  ];
  const single = 'The only value published for this age group; printed in the moderate-activity column.';
  const femaleBase: Record<string, number[]> = {};
  for (const [label, age, text] of rows) {
    const t = text.split(' ');
    ([[['MALE'] as Sex[], 0, '(nam)'], [F, 3, '(nữ)']] as const).forEach(([sexes, off, sx]) => ACT.forEach(([act, vi], k) => {
      const tok = t[off + k];
      if (tok === '-') return;
      const only = t[off] === '-';
      push({ compound: 'Energy', type: 'EER', sexes: [...sexes], age, value: num(tok), unit: 'kcal', activity: only ? null : act,
        note: only ? single : null, from: `${T}, ${vi}, ${label} ${sx}` });
    }));
    if (age[0] === 240 || age[0] === 360) femaleBase[label] = t.slice(3).map(num);
  }
  const inc: Array<[LifeStage, string, number]> = [['PREGNANT_T1', 'Phụ nữ có thai 3 tháng đầu', 50], ['PREGNANT_T2', 'Phụ nữ có thai 3 tháng giữa', 250],
    ['PREGNANT_T3', 'Phụ nữ có thai 3 tháng cuối', 450], ['LACTATING', 'Phụ nữ cho con bú', 500]];
  for (const [stage, label, add] of inc) for (const [band, age] of [['20-29 tuổi', W20], ['30-49 tuổi', W30]] as const) {
    ACT.forEach(([act, vi], k) => {
      const base = femaleBase[band][k];
      push({ compound: 'Energy', type: 'EER', sexes: F, stage, age, value: base + add, unit: 'kcal', activity: act,
        note: `Printed as +${add} over women ${band} (${vi}: ${base}); stored as total.`, from: `${T}, ${label} +${add} over ${band} ${vi}` });
    });
  }
}

// ── Phụ lục 2.1: protein ──
{
  const T = 'Phụ lục 2.1 (p. 153)';
  const rows: Array<[string, Age, number, number]> = [['0 - 5 tháng', [0, 5], 11, 11], ['6 - 8 tháng', [6, 8], 18, 18], ['9 - 11 tháng', [9, 11], 20, 20],
    ['1-2 tuổi', [12, 35], 20, 19], ['3-5 tuổi', [36, 71], 25, 25], ['6-7 tuổi', [72, 95], 33, 32], ['8-9 tuổi', [96, 119], 40, 40],
    ['10-11 tuổi', [120, 143], 50, 48], ['12-14 tuổi', [144, 179], 65, 60], ['15-19 tuổi', [180, 239], 74, 63], ['20-29 tuổi', [240, 359], 69, 60],
    ['30-49 tuổi', [360, 599], 68, 60], ['50-69 tuổi', [600, 839], 70, 62], ['≥ 70 tuổi', [840, null], 68, 59]];
  const proteinNote = 'RDA at NPU = 70%, from reference body weight (the per-kg column is not stored).';
  for (const [label, age, m, f] of rows) {
    push({ compound: 'Protein', type: age[0] === 0 ? 'AI' : 'RDA', sexes: ['MALE'], age, value: m, unit: 'g', note: proteinNote, from: `${T}, ${label} (nam)` });
    push({ compound: 'Protein', type: age[0] === 0 ? 'AI' : 'RDA', sexes: F, age, value: f, unit: 'g', note: proteinNote, from: `${T}, ${label} (nữ)` });
    if (age[0] >= 6) push({ compound: 'Protein', type: 'AMDR', sexes: BOTH, age, value: 16.5, min: 13, max: 20, unit: '%E', pct: true,
      note: 'Share of total energy from protein.', from: `${T}, tỷ lệ % năng lượng từ protein, ${label}` });
  }
  const inc: Array<[LifeStage, string, number]> = [['PREGNANT_T1', 'Phụ nữ có thai 3 tháng đầu', 1], ['PREGNANT_T2', 'Phụ nữ có thai 3 tháng giữa', 10],
    ['PREGNANT_T3', 'Phụ nữ có thai 3 tháng cuối', 31], ['LACTATING_0_6M', 'Phụ nữ cho con bú 6 tháng đầu', 19], ['LACTATING_7_12M', 'Phụ nữ cho con bú 6-12 tháng', 13]];
  for (const [stage, label, add] of inc) increment(T, 'Protein', 'g', 'RDA', stage, label, add, [60, 60], proteinNote);
}

// ── Phụ lục 3: fat, PUFA, linoleic and alpha-linolenic acid (% of energy) ──
{
  const T3 = 'Phụ lục 3.1 (p. 156)';
  const fat: Array<[string, Age, number, number]> = [['0-5 Tháng', [0, 5], 40, 60], ['6-8 Tháng', [6, 8], 30, 40], ['9-11 tháng', [9, 11], 30, 40],
    ['1-2 Tuổi', [12, 35], 30, 40], ['3-5 Tuổi', [36, 71], 25, 35], ['6-7 Tuổi', [72, 95], 20, 30], ['8-9 Tuổi', [96, 119], 20, 30],
    ['10-11 Tuổi', [120, 143], 20, 30], ['12-14 Tuổi', [144, 179], 20, 30], ['15-19 Tuổi', [180, 239], 20, 30], ['20-29 Tuổi', [240, 359], 20, 25],
    ['30-49 Tuổi', [360, 599], 20, 25], ['50-69 Tuổi', [600, 839], 20, 25], ['>= 70 Tuổi', [840, null], 20, 25]];
  for (const [label, age, lo, hi] of fat) push({ compound: 'Total Fat', type: 'AMDR', sexes: BOTH, age, value: (lo + hi) / 2, min: lo, max: hi, unit: '%E', pct: true, from: `${T3}, ${label}` });
  for (const stage of ['PREGNANT', 'LACTATING'] as LifeStage[]) push({ compound: 'Total Fat', type: 'AMDR', sexes: F, stage, age: PREG_AGE, value: 25, min: 20, max: 30, unit: '%E', pct: true, note: PREG_NOTE, from: `${T3}, Phụ nữ có thai` });
  const T32 = 'Phụ lục 3.2 (p. 157)';
  const pufa: Array<[string, Age, number]> = [['6-8 Tháng', [6, 8], 15], ['9-11 tháng', [9, 11], 15], ['1-2 Tuổi', [12, 35], 15], ['3-5 Tuổi', [36, 71], 11],
    ['6-7 Tuổi', [72, 95], 11], ['8-9 Tuổi', [96, 119], 11], ['10-11 Tuổi', [120, 143], 11], ['12-14 Tuổi', [144, 179], 11], ['15-19 Tuổi', [180, 239], 11],
    ['20-29 Tuổi', [240, 359], 11], ['30-49 Tuổi', [360, 599], 11], ['50-69 Tuổi', [600, 839], 11], ['>= 70 Tuổi', [840, null], 11]];
  for (const [label, age, v] of pufa) push({ compound: 'Polyunsaturated Fat', type: 'AI', sexes: BOTH, age, value: v, unit: '%E', pct: true,
    note: 'Share of total energy from polyunsaturated fat; the g/day columns are derived from the energy requirement and are not stored.', from: `${T32}, ${label}` });
  const T33 = 'Phụ lục 3.3 (p. 157)';
  const ef: Array<[string, Age, number]> = [['Dưới 1 tuổi', [0, 11], 4.5], ['1-3 tuổi', [12, 47], 3.0], ['4-18 tuổi', [48, 227], 2.0], ['Người trưởng thành', [228, null], 2.0]];
  for (const [label, age, la] of ef) {
    push({ compound: 'Linoleic Acid', type: 'AI', sexes: BOTH, age, value: la, unit: '%E', pct: true, from: `${T33}, Acid Linoleic, ${label}` });
    push({ compound: 'Alpha-Linolenic Acid (ALA)', type: 'AI', sexes: BOTH, age, value: 0.5, unit: '%E', pct: true, from: `${T33}, Acid Alpha Linolenic, ${label}` });
  }
  for (const stage of ['PREGNANT', 'LACTATING'] as LifeStage[]) {
    push({ compound: 'Linoleic Acid', type: 'AI', sexes: F, stage, age: PREG_AGE, value: 2.0, unit: '%E', pct: true, note: PREG_NOTE, from: `${T33}, Acid Linoleic, Phụ nữ có thai và cho con bú` });
    push({ compound: 'Alpha-Linolenic Acid (ALA)', type: 'AI', sexes: F, stage, age: PREG_AGE, value: 0.5, unit: '%E', pct: true, note: PREG_NOTE, from: `${T33}, Acid Alpha Linolenic, Phụ nữ có thai và cho con bú` });
  }
}

// ── Phụ lục 4: carbohydrate and fibre (g/day) ──
{
  const T = 'Phụ lục 4 (p. 158)';
  const note = 'Calculated from the energy requirement at moderate physical activity.';
  const rows: Array<[string, Age, string, string, string | null, string | null]> = [
    ['0-5 tháng', [0, 5], '80-90', '75-80', null, null], ['6-8 tháng', [6, 8], '90-100', '85-95', null, null], ['9-11 tháng', [9, 11], '100-110', '95-105', null, null],
    ['1-2 tuổi', [12, 35], '140-150', '135-145', '19', '19'], ['3-5 tuổi', [36, 71], '190-200', '175-190', '20-21', '20-21'],
    ['6-7 tuổi', [72, 95], '210-230', '200-220', '22-23', '22-23'], ['8-9 tuổi', [96, 119], '250-270', '230-250', '24-26', '24-25'],
    ['10-11 tuổi', [120, 143], '290-320', '230-260', '27-28', '26'], ['12-14 tuổi', [144, 179], '300-340', '280-300', '29-31', '26'],
    ['15-19 tuổi', [180, 239], '400-440', '330-370', '38', '26'], ['20-29 tuổi', [240, 359], '370-400', '320-360', '38', '25'],
    ['30-49 tuổi', [360, 599], '330-360', '290-320', '38', '25'], ['50-69 tuổi', [600, 839], '320-350', '280-310', '30', '21'],
    ['>= 70 tuổi', [840, null], '300-320', '250-280', '30', '21'],
  ];
  const range = (compound: string, sexes: Sex[], stage: LifeStage, age: Age, s: string, from: string, extra?: string | null) => {
    let value: number; let min: number | null = null; let max: number | null = null;
    if (s.includes('-')) { [min, max] = s.split('-').map(num); value = (min + max) / 2; } else value = num(s);
    push({ compound, type: 'RDA', sexes, stage, age, value, min, max, unit: 'g', note: [note, extra].filter(Boolean).join(' '), from });
  };
  for (const [label, age, cm, cf, fm, ff] of rows) {
    range('Carbohydrates', ['MALE'], 'NONE', age, cm, `${T}, glucid, ${label} (nam)`);
    range('Carbohydrates', F, 'NONE', age, cf, `${T}, glucid, ${label} (nữ)`);
    if (fm) range('Dietary Fiber', ['MALE'], 'NONE', age, fm, `${T}, chất xơ, ${label} (nam)`);
    if (ff) range('Dietary Fiber', F, 'NONE', age, ff, `${T}, chất xơ, ${label} (nữ)`);
  }
  const carbInc: Array<[LifeStage, string, number, number, number]> = [['PREGNANT_T1', 'Phụ nữ có thai 3 tháng đầu', 7, 10, 28], ['PREGNANT_T2', 'Phụ nữ có thai 3 tháng giữa', 35, 40, 28],
    ['PREGNANT_T3', 'Phụ nữ có thai 3 tháng cuối', 65, 70, 28], ['LACTATING', 'Phụ nữ cho con bú', 50, 55, 29]];
  for (const [stage, label, lo, hi, fibre] of carbInc) {
    for (const [band, age, base] of [['20-29 tuổi', W20, [320, 360]], ['30-49 tuổi', W30, [290, 320]]] as Array<[string, Age, number[]]>) {
      push({ compound: 'Carbohydrates', type: 'RDA', sexes: F, stage, age, value: (base[0] + lo + base[1] + hi) / 2, min: base[0] + lo, max: base[1] + hi, unit: 'g',
        note: `${note} Printed as +(${lo}-${hi}) g over women ${band} (${base[0]}-${base[1]}); stored as total.`, from: `${T}, glucid, ${label} +(${lo}-${hi}) over ${band}` });
    }
    push({ compound: 'Dietary Fiber', type: 'RDA', sexes: F, stage, age: PREG_AGE, value: fibre, unit: 'g', note: [note, PREG_NOTE].join(' '), from: `${T}, chất xơ, ${label}` });
  }
}

// ── Phụ lục 7.2: sodium, potassium, chloride ──
{
  const T = 'Phụ lục 7.2 (p. 172)';
  // label, age, Na RDA/AI, Na DG (max), K AI male, K AI female, K DG (min), Cl AI, Cl DG (max)
  const rows: Array<[string, Age, string, string, string, string, string, string, string]> = [
    ['0-5 tháng', [0, 5], '100', '100', '400', '400', '-', '150', '-'],
    ['6-8 tháng', [6, 8], '600', '600', '700', '700', '-', '900', '-'],
    ['9-11 tháng', [9, 11], '600', '600', '700', '700', '-', '900', '-'],
    ['1-2 tuổi', [12, 35], '-', '900', '900', '900', '-', '-', '1300'],
    ['3-5 tuổi', [36, 71], '-', '1100', '1100', '1100', '1870', '-', '1600'],
    ['6-7 tuổi', [72, 95], '-', '1300', '1300', '1200', '2210', '-', '1900'],
    ['8-9 tuổi', [96, 119], '-', '1600', '1600', '1500', '2720', '-', '2300'],
    ['10-11 tuổi', [120, 143], '-', '1900', '1900', '1800', '3230', '-', '2800'],
    ['12-14 tuổi', [144, 179], '-', '2000', '2400', '2200', '3400', '-', '2900'],
    ['15-19 tuổi', [180, 239], '-', '2000', '2800', '2100', '3510', '-', '2900'],
    ['20-29 tuổi', [240, 359], '600', '2000', '2500', '2000', '3510', '900', '2900'],
    ['30-49 tuổi', [360, 599], '600', '2000', '2500', '2000', '3510', '900', '2900'],
    ['50-69 tuổi', [600, 839], '600', '2000', '2500', '2000', '3510', '900', '2900'],
    ['≥ 70 tuổi', [840, null], '600', '2000', '2500', '2000', '3510', '900', '2900'],
  ];
  const dgNote = 'Diet goal ("mục tiêu chế độ ăn").';
  for (const [label, age, na, naDg, kM, kF, kDg, cl, clDg] of rows) {
    const infant = age[0] < 12;
    if (na !== '-') push({ compound: 'Sodium', type: infant ? 'AI' : 'RDA', sexes: BOTH, age, value: num(na), unit: 'mg',
      note: infant ? 'Printed as an adequate intake (AI).' : null, from: `${T}, Na nhu cầu khuyến nghị, ${label}` });
    push({ compound: 'Sodium', type: 'CDRR', sexes: BOTH, age, value: num(naDg), max: num(naDg), unit: 'mg', note: `${dgNote} The table also prints the equivalent as grams of salt.`, from: `${T}, Na mục tiêu chế độ ăn, ${label}` });
    push({ compound: 'Potassium', type: 'AI', sexes: ['MALE'], age, value: num(kM), unit: 'mg', from: `${T}, K mức tiêu thụ đủ, ${label} (nam)` });
    push({ compound: 'Potassium', type: 'AI', sexes: F, age, value: num(kF), unit: 'mg', from: `${T}, K mức tiêu thụ đủ, ${label} (nữ)` });
    if (kDg !== '-') push({ compound: 'Potassium', type: 'CDRR', sexes: BOTH, age, value: num(kDg), min: num(kDg), unit: 'mg', note: dgNote, from: `${T}, K mục tiêu chế độ ăn, ${label}` });
    if (cl !== '-') push({ compound: 'Chloride', type: 'AI', sexes: BOTH, age, value: num(cl), unit: 'mg', from: `${T}, Cl mức tiêu thụ đủ, ${label}` });
    if (clDg !== '-') push({ compound: 'Chloride', type: 'CDRR', sexes: BOTH, age, value: num(clDg), max: num(clDg), unit: 'mg', note: dgNote, from: `${T}, Cl mục tiêu chế độ ăn, ${label}` });
  }
  for (const stage of ['PREGNANT', 'LACTATING'] as LifeStage[]) {
    const label = stage === 'PREGNANT' ? 'Phụ nữ có thai' : 'Phụ nữ cho con bú';
    push({ compound: 'Sodium', type: 'CDRR', sexes: F, stage, age: PREG_AGE, value: 2000, max: 2000, unit: 'mg', note: `${dgNote} ${PREG_NOTE}`, from: `${T}, Na mục tiêu chế độ ăn, ${label}` });
    push({ compound: 'Potassium', type: 'AI', sexes: F, stage, age: PREG_AGE, value: 2000, unit: 'mg', note: PREG_NOTE, from: `${T}, K mức tiêu thụ đủ, ${label} (nữ)` });
    push({ compound: 'Potassium', type: 'CDRR', sexes: F, stage, age: PREG_AGE, value: 3510, min: 3510, unit: 'mg', note: `${dgNote} ${PREG_NOTE}`, from: `${T}, K mục tiêu chế độ ăn, ${label}` });
    push({ compound: 'Chloride', type: 'AI', sexes: F, stage, age: PREG_AGE, value: 900, unit: 'mg', note: PREG_NOTE, from: `${T}, Cl mức tiêu thụ đủ, ${label}` });
    push({ compound: 'Chloride', type: 'CDRR', sexes: F, stage, age: PREG_AGE, value: 2900, max: 2900, unit: 'mg', note: `${dgNote} ${PREG_NOTE}`, from: `${T}, Cl mục tiêu chế độ ăn, ${label}` });
  }
}

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex)
  || a.ageMinMonths - b.ageMinMonths || (a.activityLevel ?? '').localeCompare(b.activityLevel ?? '') || (a.dietaryContext ?? '').localeCompare(b.dietaryContext ?? ''));
writeFileSync(path.join(process.cwd(), 'dv-sources', 'vietnam-rda-2016', 'values.json'), JSON.stringify(out, null, 1) + '\n');
const byType: Record<string, number> = {};
for (const v of out) byType[v.valueType] = (byType[v.valueType] ?? 0) + 1;
console.log(`Wrote ${out.length} values to dv-sources/vietnam-rda-2016/values.json`, byType);
