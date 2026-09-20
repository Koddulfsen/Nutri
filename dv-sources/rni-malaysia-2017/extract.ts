/**
 * Malaysia — Recommended Nutrient Intakes for Malaysia 2017 (National Coordinating Committee on Food and Nutrition,
 * Ministry of Health Malaysia) -> values.json.
 *
 * Transcribed 2026-09-17 from the full book (rni-2017-book.pdf, 542 PDF pages; book page = PDF page - 17), read from the
 * text layer (pdftotext -layout) and checked against renders of the summary pages (source/rni-537..540.png):
 *   - RNI 2017 Summary Tables (book pp. 520-523): 1 energy by PAL and protein; 2 vitamins; 3a and 3b minerals.
 *   - Macronutrient ranges: Appendix 3.5 (fat and fatty acids, %TEI column for Malaysia 2017, book pp. 98-99),
 *     Appendix 4.1 (carbohydrate, free sugars, fibre, p. 120) and the Energy & Macronutrients summary (p. 14: protein
 *     10-20 %TEI for adults).
 *   - Upper levels printed in the chapters (all reproduced from IOM, noted per value): niacin T7.2, B6 T9.2, folic acid
 *     T10.2, vitamin C T12.2, vitamin A T13.2, vitamin D T14.2, vitamin E T15.3, calcium T17.2, iodine T19.2, selenium
 *     T21.3, phosphorus T22.2, sodium (§23.8), magnesium (§25.8), copper (§27.8), manganese T28.2 (+ adult 11 mg from the
 *     §28.8 text), molybdenum (§29.8), fluoride T30.4. Zinc's T20.3 only compares WHO/FAO, IOM and IZiNCG without adopting
 *     one, so no zinc UL is stored.
 *
 * Decisions:
 *   - The summary tables label every value "RNI" (they mix RDA-type and AI-type values without marking them), so all are
 *     stored as RDA; energy as EER. Logged as a known issue.
 *   - Energy PAL 1.4 / 1.6 / 1.8 / 2.0 -> SEDENTARY / MODERATE / ACTIVE / VERY_ACTIVE (the book calls them low active,
 *     moderately active, active, very active). Infants and 1-3 y have a single value (no activity level). Pregnancy energy
 *     increments (+80 / +280 / +470 by trimester) and lactation (+500, first 6 months; none printed for the second) are stored
 *     as totals over women 18-29 and 30-59 y at each PAL.
 *   - Protein increments (+0.5 / +8 / +25; lactation +19 / +13) likewise over women 18-29 and 30-59 y.
 *   - Vitamins and table 3a print absolute pregnancy/lactation values, stored for women 19-50 y [228, 611]; the 13-19 y
 *     pregnancy/lactation calcium (1300) and lactation iodine (200) rows are stored for 13-18 y [156, 227].
 *   - Vitamin K adolescents "35-55": midpoint 45 with min/max.
 *   - Infants breast fed (bf) vs formula fed (ff) for calcium and zinc: the breast-fed value is stored, formula-fed in the note.
 *     Iodine for infants is printed by 3-month bands and stored that way.
 *   - Iron by dietary iron bioavailability 10% / 15%: 10% stored, 15% in the note. Girls 10-14 y and lactation (2nd 6 months)
 *     print non-menstruating (nm) and menstruating (m): menstruating stored, non-menstruating in the note. "a" (infants 0-5
 *     months, no recommendation) and "b" (pregnancy: iron supplements recommended for all pregnant women) are not values.
 *   - Zinc lactation first 6 months prints 9.5 (1-3 months) and 8.8 (4-6 months): 9.5 stored, 8.8 in the note.
 *   - Table 3b uses its own bands (0-6 and 7-12 months stored as [0, 6] and [7, 11]; 1-3, 4-8, 9-13, 14-18, 19-29, 30-50,
 *     51-59, 60-69, >70 y; pregnancy/lactation 14-18, 19-30, 31-50 y). Potassium in g/day as printed.
 *   - Magnesium women 51-59 and 60-69 y print 420 mg (>70 y: 320). The chapter (§25.7) prints the same (women 51-70 y 420),
 *     so it is stored as published; IOM's value for these women is 320 mg (noted).
 *   - ULs: vitamin A as preformed -> Retinol; folic acid -> Folic Acid (Synthetic), supplementalOnly; vitamin E ("any form of
 *     supplementary α-tocopherol") and magnesium ("from supplements") supplementalOnly. Table 19.2 labels iodine "mg/day"
 *     but the values are µg (IOM); stored as µg with a note. Table 13.2 prints 2,800 µg for pregnant and lactating women
 *     (IOM: 3,000 for ≥19 y); stored as printed for women 14-50 y with a note.
 *   - Fat 25-30 %TEI for adults (up to 35 %TEI a safe limit for active adults with normal BMI), 25-35 %TEI for 1-17 y,
 *     40-60 %TEI 0-5 months, 30-40 %TEI 6-11 months (Malaysia 2017 column; g/day ranges derived from energy not stored).
 *     n-6 PUFA 3-7 %TEI (general population, stored from 1 y; pregnancy and lactation 5-7), n-3 PUFA 0.3-1.2 %TEI,
 *     SFA <10, MUFA 12-15, TFA <1 %TEI. Carbohydrate 50-65 %TEI, free sugars <10 %TEI, fibre 20-30 g and protein
 *     10-20 %TEI: stated for adults, stored from 18 y.
 *
 * Run: npx tsx dv-sources/rni-malaysia-2017/extract.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage, Activity } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
const out: SourceValue[] = [];
const BOTH: Sex[] = ['MALE', 'FEMALE'];
const M: Sex[] = ['MALE'];
const F: Sex[] = ['FEMALE'];
const r4 = (n: number) => Math.round(n * 10000) / 10000;
const num = (s: string) => { const v = Number(s.replace(/,/g, '')); if (Number.isNaN(v)) throw new Error(`number "${s}"`); return v; };

interface P { compound: string; type: DvValueType; sexes: Sex[]; stage?: LifeStage; age: Age; value: number; min?: number | null; max?: number | null; unit: string; pct?: boolean; supp?: boolean; activity?: Activity | null; note?: string | null; from: string }
function push(p: P) {
  for (const sex of p.sexes) out.push({
    compound: p.compound, valueType: p.type, sex, lifeStage: p.stage ?? 'NONE', ageMinMonths: p.age[0], ageMaxMonths: p.age[1], activityLevel: p.activity ?? null,
    dietaryContext: null, value: p.value, valueMin: p.min ?? null, valueMax: p.max ?? null, unit: p.unit, isPercentOfEnergy: p.pct ?? false,
    isProvisional: false, supplementalOnly: p.supp ?? false, note: p.note ?? null, from: p.from,
  });
}
const ST = 'Summary Table';
const TRI: LifeStage[] = ['PREGNANT_T1', 'PREGNANT_T2', 'PREGNANT_T3'];
const ADULT_W: Age = [228, 611];

// ── Summary Table 1: energy by PAL, protein ──
{
  const pg = `${ST} 1 (book p. 520)`;
  const PAL: Activity[] = ['SEDENTARY', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE'];
  const PALN = ['1.4', '1.6', '1.8', '2.0'];
  // label, age, male energy (1 value or PAL list), male protein, female energy, female protein
  const rows: Array<[string, Age, number[], number, number[], number]> = [
    ['0-2 months', [0, 2], [470], 8, [420], 8],
    ['3-5 months', [3, 5], [540], 8, [500], 8],
    ['6-8 months', [6, 8], [630], 10, [570], 10],
    ['9-11 months', [9, 11], [720], 10, [660], 10],
    ['1-3 years', [12, 47], [980], 12, [900], 12],
    ['4-6 years', [48, 83], [1300, 1490, 1670], 16, [1210, 1380, 1560], 16],
    ['7-9 years', [84, 119], [1530, 1750, 1970], 23, [1410, 1610, 1810], 23],
    ['10-12 years', [120, 155], [1690, 1930, 2170, 2420], 30, [1500, 1710, 1920, 2140], 31],
    ['13-15 years', [156, 191], [1930, 2210, 2480, 2760], 45, [1580, 1810, 2040, 2260], 42],
    ['16-<18 years', [192, 215], [2050, 2340, 2640, 2930], 51, [1660, 1890, 2130, 2370], 42],
    ['≥18-29 years', [216, 359], [1960, 2240, 2520, 2800], 62, [1610, 1840, 2080, 2310], 53],
    ['30-59 years', [360, 719], [1920, 2190, 2470, 2740], 61, [1660, 1900, 2130, 2370], 52],
    ['≥60 years', [720, null], [1780, 2030, 2280, 2540], 58, [1550, 1770, 1990, 2220], 50],
  ];
  const palNote = (age: Age) => age[0] < 84 ? 'PAL 1.4 is recommended for the general population of children 4-6 y (note 1).' : 'PAL 1.6 (moderately active) is recommended for the general population from 7 y (note 1).';
  for (const [label, age, me, mp, fe, fp] of rows) {
    for (const [sexes, en, pr, sx] of [[M, me, mp, 'Males'], [F, fe, fp, 'Females']] as const) {
      if (en.length === 1) push({ compound: 'Energy', type: 'EER', sexes: [...sexes], age, value: en[0], unit: 'kcal', from: `${pg}, Energy, ${sx} ${label}` });
      else en.forEach((v, i) => push({ compound: 'Energy', type: 'EER', sexes: [...sexes], age, value: v, unit: 'kcal', activity: PAL[i], note: palNote(age), from: `${pg}, Energy PAL ${PALN[i]}, ${sx} ${label}` }));
      push({ compound: 'Protein', type: 'RDA', sexes: [...sexes], age, value: pr, unit: 'g', note: 'Calculated from reference body weight (note 2).', from: `${pg}, Protein, ${sx} ${label}` });
    }
  }
  const women = rows.filter((r) => r[0] === '≥18-29 years' || r[0] === '30-59 years');
  const energyInc: Array<[LifeStage, string, number]> = [['PREGNANT_T1', '1st trimester', 80], ['PREGNANT_T2', '2nd trimester', 280], ['PREGNANT_T3', '3rd trimester', 470], ['LACTATING_0_6M', '1st six months', 500]];
  const proteinInc: Array<[LifeStage, string, number]> = [['PREGNANT_T1', '1st trimester', 0.5], ['PREGNANT_T2', '2nd trimester', 8], ['PREGNANT_T3', '3rd trimester', 25], ['LACTATING_0_6M', '1st six months', 19], ['LACTATING_7_12M', '2nd six months', 13]];
  for (const [label, age, , , fe, fp] of women) {
    for (const [stage, sl, inc] of energyInc) fe.forEach((v, i) => push({ compound: 'Energy', type: 'EER', sexes: F, stage, age, value: v + inc, unit: 'kcal', activity: PAL[i],
      note: `Printed as +${inc} over women ${label} at PAL ${PALN[i]} (${v}); stored as total.`, from: `${pg}, Energy, ${stage.startsWith('L') ? 'Lactation' : 'Pregnancy'} ${sl} +${inc} over women ${label} PAL ${PALN[i]}` }));
    for (const [stage, sl, inc] of proteinInc) push({ compound: 'Protein', type: 'RDA', sexes: F, stage, age, value: r4(fp + inc), unit: 'g',
      note: `Printed as +${inc} over women ${label} (${fp}); stored as total.`, from: `${pg}, Protein, ${stage.startsWith('L') ? 'Lactation' : 'Pregnancy'} ${sl} +${inc} over women ${label}` });
  }
}

// ── Summary Table 2: vitamins ──
{
  const pg = `${ST} 2 (book p. 521)`;
  const cols: Array<[string, string]> = [['Thiamin (B1)', 'mg'], ['Riboflavin (B2)', 'mg'], ['Niacin (B3)', 'mg NE'], ['Pantothenic Acid (B5)', 'mg'], ['Vitamin B6', 'mg'],
    ['Folate (Total)', 'µg'], ['Vitamin B12 (Total)', 'µg'], ['Vitamin C (Total)', 'mg'], ['Vitamin A (RE)', 'µg'], ['Vitamin D (Total)', 'µg'], ['Vitamin E (Total)', 'mg'], ['Vitamin K (Total)', 'µg']];
  const kids: Array<[string, Age, string]> = [
    ['0-5 months', [0, 5], '0.2 0.3 2 1.7 0.1 80 1.2 25 375 10 3 5'],
    ['6-11 months', [6, 11], '0.3 0.4 4 1.8 0.3 80 1.5 30 400 10 3 10'],
    ['1-3 years', [12, 47], '0.5 0.5 6 2.0 0.5 160 1.5 30 400 15 5 15'],
    ['4-6 years', [48, 83], '0.6 0.6 8 3.0 0.6 200 1.5 30 450 15 5 20'],
    ['7-9 years', [84, 119], '0.9 0.9 12 4.0 1.0 300 2.5 35 500 15 7 25'],
  ];
  const boys: Array<[string, Age, string]> = [
    ['10-12 years', [120, 155], '1.2 1.3 16 5.0 1.3 400 3.5 65 600 15 10 35-55'],
    ['13-14 years', [156, 179], '1.2 1.3 16 5.0 1.3 400 4.0 65 600 15 10 35-55'],
    ['15 years', [180, 191], '1.2 1.3 16 5.0 1.3 400 4.0 65 600 15 10 35-55'],
    ['16-18 years', [192, 227], '1.2 1.3 16 5.0 1.3 400 4.0 65 600 15 10 35-55'],
    ['19-29 years', [228, 359], '1.2 1.3 16 5.0 1.3 400 4.0 70 600 15 10 65'],
    ['30-50 years', [360, 611], '1.2 1.3 16 5.0 1.3 400 4.0 70 600 15 10 65'],
    ['51-59 years', [612, 719], '1.2 1.3 16 5.0 1.7 400 4.0 70 600 15 10 65'],
    ['60-65 years', [720, 791], '1.2 1.3 16 5.0 1.7 400 4.0 70 600 15 10 65'],
    ['> 65 years', [792, null], '1.2 1.3 16 5.0 1.7 400 4.0 70 600 20 10 65'],
  ];
  const girls: Array<[string, Age, string]> = [
    ['10-12 years', [120, 155], '1.1 1.0 16 5.0 1.2 400 3.5 65 600 15 7.5 35-55'],
    ['13-14 years', [156, 179], '1.1 1.0 16 5.0 1.2 400 4.0 65 600 15 7.5 35-55'],
    ['15 years', [180, 191], '1.1 1.0 16 5.0 1.2 400 4.0 65 600 15 7.5 35-55'],
    ['16-18 years', [192, 227], '1.1 1.0 16 5.0 1.2 400 4.0 65 600 15 7.5 35-55'],
    ['19-29 years', [228, 359], '1.1 1.1 14 5.0 1.3 400 4.0 70 600 15 7.5 55'],
    ['30-50 years', [360, 611], '1.1 1.1 14 5.0 1.3 400 4.0 70 600 15 7.5 55'],
    ['51-59 years', [612, 719], '1.1 1.1 14 5.0 1.5 400 4.0 70 600 15 7.5 55'],
    ['60-65 years', [720, 791], '1.1 1.1 14 5.0 1.5 400 4.0 70 600 15 7.5 55'],
    ['> 65 years', [792, null], '1.1 1.1 14 5.0 1.5 400 4.0 70 600 20 7.5 55'],
  ];
  const stages: Array<[string, LifeStage, string]> = [
    ['Pregnancy 1st trimester', 'PREGNANT_T1', '1.4 1.4 18 6.0 1.9 600 4.5 80 800 15 7.5 55'],
    ['Pregnancy 2nd trimester', 'PREGNANT_T2', '1.4 1.4 18 6.0 1.9 600 4.5 80 800 15 7.5 55'],
    ['Pregnancy 3rd trimester', 'PREGNANT_T3', '1.4 1.4 18 6.0 1.9 600 4.5 80 800 15 7.5 55'],
    ['Lactation 1st 6 months', 'LACTATING_0_6M', '1.5 1.6 17 7.0 2.0 500 5.0 95 850 15 7.5 55'],
    ['Lactation 2nd 6 months', 'LACTATING_7_12M', '1.5 1.6 17 7.0 2.0 500 5.0 95 850 15 7.5 55'],
  ];
  const row = (label: string, sexes: Sex[], stage: LifeStage, age: Age, text: string, note: string | null) => {
    const t = text.split(' ');
    if (t.length !== cols.length) throw new Error(`${pg} ${label}: ${t.length}`);
    cols.forEach(([compound, unit], i) => {
      let value: number; let min: number | null = null; let max: number | null = null;
      if (t[i].includes('-')) { [min, max] = t[i].split('-').map(num); value = (min + max) / 2; } else value = num(t[i]);
      push({ compound, type: 'RDA', sexes, stage, age, value, min, max, unit, note, from: `${pg}, ${compound}, ${label}` });
    });
  };
  for (const [label, age, text] of kids) { row(`Infants/Children (boys) ${label}`, M, 'NONE', age, text, null); row(`Infants/Children (girls) ${label}`, F, 'NONE', age, text, null); }
  for (const [label, age, text] of boys) row(`${age[0] < 228 ? 'Adolescent (boys)' : 'Men'} ${label}`, M, 'NONE', age, text, null);
  for (const [label, age, text] of girls) row(`${age[0] < 228 ? 'Adolescent (girls)' : 'Women'} ${label}`, F, 'NONE', age, text, null);
  for (const [label, stage, text] of stages) row(label, F, stage, ADULT_W, text, 'Printed as an absolute value for pregnancy/lactation (no age); stored for women 19-50 y.');
}

// ── Summary Table 3a: calcium, iodine, selenium, zinc, iron (10% / 15% bioavailability) ──
{
  const pg = `${ST} 3a (book p. 522)`;
  const ironNote = (v15: string) => `At 10% dietary iron bioavailability (stored); ${v15} mg at 15%.`;
  // Infants
  for (const [sexes, sx, se611, zn611, iod] of [[M, 'boys', 10, 4.1, [67.5, 105.0, 124.5, 138.0]], [F, 'girls', 9, 3.7, [63.0, 96.0, 114.0, 127.5]]] as const) {
    const lab = `Infants (${sx})`;
    push({ compound: 'Calcium', type: 'RDA', sexes: [...sexes], age: [0, 5], value: 200, unit: 'mg', note: 'Breast fed (stored); formula fed 250 mg.', from: `${pg}, Calcium, ${lab} 0-5 months` });
    push({ compound: 'Calcium', type: 'RDA', sexes: [...sexes], age: [6, 11], value: 260, unit: 'mg', from: `${pg}, Calcium, ${lab} 6-11 months` });
    ([[0, 2], [3, 5], [6, 8], [9, 11]] as Age[]).forEach((age, i) => push({ compound: 'Iodine', type: 'RDA', sexes: [...sexes], age, value: iod[i], unit: 'µg', from: `${pg}, Iodine, ${lab} ${age[0]}-${age[1]} months` }));
    push({ compound: 'Selenium', type: 'RDA', sexes: [...sexes], age: [0, 5], value: 6, unit: 'µg', from: `${pg}, Selenium, ${lab} 0-5 months` });
    push({ compound: 'Selenium', type: 'RDA', sexes: [...sexes], age: [6, 11], value: se611, unit: 'µg', from: `${pg}, Selenium, ${lab} 6-11 months` });
    push({ compound: 'Zinc', type: 'RDA', sexes: [...sexes], age: [0, 5], value: 1.1, unit: 'mg', note: 'Breast fed (stored); formula fed 2.8 mg.', from: `${pg}, Zinc, ${lab} 0-5 months` });
    push({ compound: 'Zinc', type: 'RDA', sexes: [...sexes], age: [6, 11], value: zn611, unit: 'mg', from: `${pg}, Zinc, ${lab} 6-11 months` });
    push({ compound: 'Iron (Total)', type: 'RDA', sexes: [...sexes], age: [6, 11], value: 9, unit: 'mg', note: ironNote('6'), from: `${pg}, Iron 10%, ${lab} 6-11 months` });
  }
  // label, sex, age, Ca, I, Se, Zn, Fe10, Fe15 (Fe "m/nm" = menstruating stored / non-menstruating)
  const rows: Array<[string, Sex[], Age, string]> = [
    ['Children (boys) 1-3 years', M, [12, 47], '700 73.2 17 4.2 6 4'],
    ['Children (boys) 4-6 years', M, [48, 83], '1000 109.8 21 5.2 6 4'],
    ['Children (boys) 7-9 years', M, [84, 119], '1000 101.6 22 5.7 9 6'],
    ['Children (girls) 1-3 years', F, [12, 47], '700 69.0 16 4.0 6 4'],
    ['Children (girls) 4-6 years', F, [48, 83], '1000 109.2 21 5.2 6 4'],
    ['Children (girls) 7-9 years', F, [84, 119], '1000 100.0 21 5.6 9 6'],
    ['Adolescent (boys) 10-12 years', M, [120, 155], '1300 133.6 21 7.0 15 10'],
    ['Adolescent (boys) 13-14 years', M, [156, 179], '1300 99.2 31 9.3 15 10'],
    ['Adolescent (boys) 15 years', M, [180, 191], '1300 99.2 31 9.3 19 12'],
    ['Adolescent (boys) 16-18 years', M, [192, 227], '1300 118.4 37 9.9 19 12'],
    ['Adolescent (girls) 10-12 years', F, [120, 155], '1300 141.6 19 6.3 33/14 22/9'],
    ['Adolescent (girls) 13-14 years', F, [156, 179], '1300 93.0 24 7.7 33/14 22/9'],
    ['Adolescent (girls) 15 years', F, [180, 191], '1300 93.0 24 7.7 31 21'],
    ['Adolescent (girls) 16-18 years', F, [192, 227], '1300 100.6 26 7.7 31 21'],
    ['Men 19-29 years', M, [228, 359], '1000 122.8 32 6.6 14 9'],
    ['Men 30-50 years', M, [360, 611], '1000 121.2 32 6.5 14 9'],
    ['Men 51-59 years', M, [612, 719], '1000 121.2 32 6.5 14 9'],
    ['Men 60-65 years', M, [720, 791], '1000 116.2 31 6.3 14 9'],
    ['Men > 65 years', M, [792, null], '1000 116.2 30 6.2 14 9'],
    ['Women 19-29 years', F, [228, 359], '1000 105.8 25 4.7 29 20'],
    ['Women 30-50 years', F, [360, 611], '1000 104.4 24 4.6 29 20'],
    ['Women 51-59 years', F, [612, 719], '1200 104.4 24 4.6 11 8'],
    ['Women 60-65 years', F, [720, 791], '1200 99.0 23 4.4 11 8'],
    ['Women > 65 years', F, [792, null], '1200 99.0 23 4.3 11 8'],
  ];
  const three = (label: string, sexes: Sex[], stage: LifeStage, age: Age, text: string, extra: string | null) => {
    const [ca, io, se, zn, fe10, fe15] = text.split(' ');
    const n = (s: string) => s;
    for (const [compound, unit, tok] of [['Calcium', 'mg', ca], ['Iodine', 'µg', io], ['Selenium', 'µg', se], ['Zinc', 'mg', zn]] as const) {
      if (tok === '-') continue;
      push({ compound, type: 'RDA', sexes, stage, age, value: num(n(tok)), unit, note: extra, from: `${pg}, ${compound}, ${label}` });
    }
    if (fe10 === '-') return;
    if (fe10.includes('/')) {
      const [m10, nm10] = fe10.split('/'); const [m15, nm15] = fe15.split('/');
      push({ compound: 'Iron (Total)', type: 'RDA', sexes, stage, age, value: num(m10), unit: 'mg',
        note: [extra, `Menstruating (stored); non-menstruating ${nm10} mg. At 10% bioavailability (stored); at 15%: ${m15} mg menstruating, ${nm15} mg non-menstruating.`].filter(Boolean).join(' '), from: `${pg}, Iron 10%, ${label} (m)` });
    } else push({ compound: 'Iron (Total)', type: 'RDA', sexes, stage, age, value: num(fe10), unit: 'mg', note: [extra, ironNote(fe15)].filter(Boolean).join(' '), from: `${pg}, Iron 10%, ${label}` });
  };
  for (const [label, sexes, age, text] of rows) three(label, sexes, 'NONE', age, text, null);
  const abs = 'Printed as an absolute value for pregnancy/lactation; stored for women 19-50 y.';
  const noIron = 'Iron: no value; iron supplements in tablet form are recommended for all pregnant women (note b).';
  three('Pregnancy 1st trimester', F, 'PREGNANT_T1', ADULT_W, '1000 200 25 5.5 - -', `${abs} ${noIron}`);
  three('Pregnancy 2nd trimester', F, 'PREGNANT_T2', ADULT_W, '1000 200 27 7.0 - -', `${abs} ${noIron}`);
  three('Pregnancy 3rd trimester', F, 'PREGNANT_T3', ADULT_W, '1000 200 29 10.0 - -', `${abs} ${noIron}`);
  three('Lactation 1st 6 months', F, 'LACTATING_0_6M', ADULT_W, '1000 200 34 9.5 15 10', `${abs} Zinc: 9.5 mg for months 1-3 (stored), 8.8 mg for months 4-6.`);
  three('Lactation 2nd 6 months', F, 'LACTATING_7_12M', ADULT_W, '1000 200 41 7.2 32/15 21/10', abs);
  for (const stage of TRI) push({ compound: 'Calcium', type: 'RDA', sexes: F, stage, age: [156, 227], value: 1300, unit: 'mg', note: 'Printed as Pregnancy 13-19 (all trimesters); stored for 13-18 y.', from: `${pg}, Calcium, Pregnancy 13-19` });
  for (const stage of ['LACTATING_0_6M', 'LACTATING_7_12M'] as LifeStage[]) {
    push({ compound: 'Calcium', type: 'RDA', sexes: F, stage, age: [156, 227], value: 1300, unit: 'mg', note: 'Printed as Lactation 13-19; stored for 13-18 y.', from: `${pg}, Calcium, Lactation 13-19` });
    push({ compound: 'Iodine', type: 'RDA', sexes: F, stage, age: [156, 227], value: 200, unit: 'µg', note: 'Printed as Lactation 13-19; stored for 13-18 y.', from: `${pg}, Iodine, Lactation 13-19` });
  }
}

// ── Summary Table 3b ──
{
  const pg = `${ST} 3b (book p. 523)`;
  const cols: Array<[string, string]> = [['Phosphorus', 'mg'], ['Sodium', 'mg'], ['Potassium', 'g'], ['Magnesium', 'mg'], ['Chromium', 'µg'], ['Copper', 'µg'], ['Manganese', 'mg'], ['Molybdenum', 'µg'], ['Fluoride', 'mg']];
  const MG_NOTE = 'Printed as 420 mg for women 51-69 y here and 51-70 y in chapter 25; IOM sets 320 mg for women over 50.';
  const rows: Array<[string, Sex[], LifeStage, Age, string]> = [
    ['Infants 0-6 months', BOTH, 'NONE', [0, 6], '100 120 0.4 30 0.2 200 0.003 2 0.01'],
    ['Infants 7-12 months', BOTH, 'NONE', [7, 11], '275 370 0.7 75 5.5 220 0.6 3 0.5'],
    ['Children 1-3 years', BOTH, 'NONE', [12, 47], '460 1000 3.0 80 11 340 1.2 17 0.7'],
    ['Children 4-8 years', BOTH, 'NONE', [48, 107], '500 1200 3.8 130 15 440 1.5 22 1.0'],
    ['Adolescent (boys) 9-13 years', M, 'NONE', [108, 167], '1250 1500 4.5 240 25 700 1.9 34 2.0'],
    ['Adolescent (boys) 14-18 years', M, 'NONE', [168, 227], '1250 1500 4.7 410 35 890 2.2 43 3.0'],
    ['Adolescent (girls) 9-13 years', F, 'NONE', [108, 167], '1250 1500 4.5 240 21 700 1.6 34 2.0'],
    ['Adolescent (girls) 14-18 years', F, 'NONE', [168, 227], '1250 1500 4.7 360 24 890 1.6 43 3.0'],
    ['Men 19-29 years', M, 'NONE', [228, 359], '700 1500 4.7 400 35 900 2.3 45 4.0'],
    ['Men 30-50 years', M, 'NONE', [360, 611], '700 1500 4.7 420 35 900 2.3 45 4.0'],
    ['Men 51-59 years', M, 'NONE', [612, 719], '700 1500 4.7 420 30 900 2.3 45 4.0'],
    ['Men 60-69 years', M, 'NONE', [720, 839], '700 1500 4.7 420 30 900 2.3 45 4.0'],
    ['Men > 70 years', M, 'NONE', [840, null], '700 1200 4.7 420 30 900 2.3 45 4.0'],
    ['Women 19-29 years', F, 'NONE', [228, 359], '700 1500 4.7 310 25 900 1.8 45 3.0'],
    ['Women 30-50 years', F, 'NONE', [360, 611], '700 1500 4.7 320 25 900 1.8 45 3.0'],
    ['Women 51-59 years', F, 'NONE', [612, 719], '700 1500 4.7 420 20 900 1.8 45 3.0'],
    ['Women 60-69 years', F, 'NONE', [720, 839], '700 1500 4.7 420 20 900 1.8 45 3.0'],
    ['Women > 70 years', F, 'NONE', [840, null], '700 1200 4.7 320 20 900 1.8 45 3.0'],
    ['Pregnancy 14-18 years', F, 'PREGNANT', [168, 227], '1250 1500 4.7 400 29 1000 2.0 50 3.0'],
    ['Pregnancy 19-30 years', F, 'PREGNANT', [228, 371], '700 1500 4.7 350 30 1000 2.0 50 3.0'],
    ['Pregnancy 31-50 years', F, 'PREGNANT', [372, 611], '700 1500 4.7 360 30 1000 2.0 50 3.0'],
    ['Lactation 14-18 years', F, 'LACTATING', [168, 227], '1250 1500 5.1 360 44 1300 2.6 50 3.0'],
    ['Lactation 19-30 years', F, 'LACTATING', [228, 371], '700 1500 5.1 310 45 1300 2.6 50 3.0'],
    ['Lactation 31-50 years', F, 'LACTATING', [372, 611], '700 1500 5.1 320 45 1300 2.6 50 3.0'],
  ];
  for (const [label, sexes, stage, age, text] of rows) {
    const t = text.split(' ');
    if (t.length !== cols.length) throw new Error(`${pg} ${label}: ${t.length}`);
    cols.forEach(([compound, unit], i) => {
      const note = compound === 'Magnesium' && label.startsWith('Women') && t[i] === '420' ? MG_NOTE : null;
      push({ compound, type: 'RDA', sexes, stage, age, value: num(t[i]), unit, note, from: `${pg}, ${compound}, ${label}` });
    });
  }
}

// ── Macronutrient ranges ──
{
  const a35 = 'Appendix 3.5 (book pp. 98-99), Malaysia 2017 %TEI';
  const range = (compound: string, type: DvValueType, sexes: Sex[], stage: LifeStage, age: Age, lo: number | null, hi: number | null, unit: string, pct: boolean, from: string, note: string | null = null) => {
    const value = lo != null && hi != null ? (lo + hi) / 2 : (lo ?? hi)!;
    push({ compound, type, sexes, stage, age, value, min: lo, max: hi, unit, pct, note, from });
  };
  const ACTIVE35 = 'For active men and women with normal BMI, up to 35 %TEI from fat is a safe limit (footnote c).';
  range('Total Fat', 'AMDR', BOTH, 'NONE', [0, 5], 40, 60, '%E', true, `${a35}, Total fat, infants 0-5 months`);
  range('Total Fat', 'AMDR', BOTH, 'NONE', [6, 11], 30, 40, '%E', true, `${a35}, Total fat, infants 6-11 months`);
  range('Total Fat', 'AMDR', BOTH, 'NONE', [12, 227], 25, 35, '%E', true, `${a35}, Total fat, children and adolescents 1-18 years`);
  range('Total Fat', 'AMDR', BOTH, 'NONE', [228, 719], 25, 30, '%E', true, `${a35}, Total fat, adults 19-59 years`, ACTIVE35);
  range('Total Fat', 'AMDR', BOTH, 'NONE', [720, null], 25, 30, '%E', true, `${a35}, Total fat, adults ≥ 60 years`);
  for (const stage of [...TRI, 'LACTATING_0_6M'] as LifeStage[]) range('Total Fat', 'AMDR', F, stage, ADULT_W, 25, 30, '%E', true, `${a35}, Total fat, ${stage}`, `${ACTIVE35} Stored for women 19-50 y.`);
  range('Omega-6', 'AMDR', BOTH, 'NONE', [12, null], 3, 7, '%E', true, `${a35}, n-6 PUFA (linoleic acid), general population`, 'n-6 PUFA (linoleic acid). General population; stored from 1 y.');
  for (const stage of ['PREGNANT', 'LACTATING'] as LifeStage[]) range('Omega-6', 'AMDR', F, stage, ADULT_W, 5, 7, '%E', true, `${a35}, n-6 PUFA (linoleic acid), ${stage === 'PREGNANT' ? 'Pregnancy' : 'Lactation'}`, 'n-6 PUFA (linoleic acid). Stored for women 19-50 y.');
  range('Omega-3', 'AMDR', BOTH, 'NONE', [12, null], 0.3, 1.2, '%E', true, `${a35}, n-3 PUFA (ALA+EPA+DHA), general population`, 'n-3 PUFA as ALA + EPA + DHA. General population; stored from 1 y.');
  range('Saturated Fat', 'CDRR', BOTH, 'NONE', [12, null], null, 10, '%E', true, `${a35}, Saturated fatty acids`, '<10 %TEI. Stored from 1 y.');
  range('Monounsaturated Fat', 'AMDR', BOTH, 'NONE', [12, null], 12, 15, '%E', true, `${a35}, Monounsaturated fatty acids`, 'Stored from 1 y.');
  range('Trans Fat', 'CDRR', BOTH, 'NONE', [12, null], null, 1, '%E', true, `${a35}, Trans fatty acids`, '<1 %TEI. Stored from 1 y.');
  const a41 = 'Appendix 4.1 (book p. 120), Malaysia 2017';
  const adults = 'Stated for Malaysian adults (Summary of Energy & Macronutrients, p. 14); stored from 18 y.';
  range('Carbohydrates', 'AMDR', BOTH, 'NONE', [216, null], 50, 65, '%E', true, `${a41}, Total carbohydrate`, adults);
  range('Free Sugars', 'CDRR', BOTH, 'NONE', [216, null], null, 10, '%E', true, `${a41}, Sugars (free sugars)`, `<10 %TEI. ${adults}`);
  range('Dietary Fiber', 'AMDR', BOTH, 'NONE', [216, null], 20, 30, 'g', false, `${a41}, Dietary fibre`, adults);
  range('Protein', 'AMDR', BOTH, 'NONE', [216, null], 10, 20, '%E', true, 'Summary of Energy & Macronutrients (book p. 14), protein %TEI', adults);
}

// ── Upper levels from the chapters (all reproduced from IOM) ──
{
  type U = [label: string, sexes: Sex[], stages: LifeStage[], age: Age, value: number];
  const N: LifeStage[] = ['NONE'];
  const PL: LifeStage[] = ['PREGNANT', 'LACTATING'];
  const ul = (compound: string, unit: string, table: string, origin: string, rows: U[], opts: { supp?: boolean; note?: string } = {}) => {
    for (const [label, sexes, stages, age, value] of rows) for (const stage of stages) push({ compound, type: 'UL', sexes: stage === 'NONE' ? sexes : F, stage, age, value, unit, supp: opts.supp,
      note: [opts.note, `Reproduced from ${origin}.`].filter(Boolean).join(' '), from: `${table}, ${label}` });
  };
  const kids = (v: [number, number, number, number]): U[] => [['1-3 years', BOTH, N, [12, 47], v[0]], ['4-8 years', BOTH, N, [48, 107], v[1]], ['9-13 years', BOTH, N, [108, 167], v[2]], ['14-18 years', BOTH, N, [168, 227], v[3]]];
  ul('Niacin (B3)', 'mg NE', 'Table 7.2 (book p. 155)', 'IOM (1998)', [...kids([10, 15, 20, 30]), ['19 years and older', BOTH, N, [228, null], 35], ['Pregnant and lactating women', F, PL, [168, null], 35]],
    { note: 'Pregnant and lactating women (no age printed); stored from 14 y.' });
  ul('Vitamin B6', 'mg', 'Table 9.2 (book p. 182)', 'IOM (1998)', [...kids([30, 40, 60, 80]), ['19 years and older', BOTH, N, [228, null], 100], ['Pregnancy / Lactation', F, PL, [168, null], 100]],
    { note: 'Adult bands 19-50, 51-59, 60-65, >65 y all print 100; stored as 19+ y. Pregnancy/lactation (no age printed) stored from 14 y.' });
  ul('Folic Acid (Synthetic)', 'µg', 'Table 10.2 (book p. 197)', 'IOM (1998)', [...kids([300, 400, 600, 800]), ['Adults', BOTH, N, [228, null], 1000],
    ['Pregnant/lactating 14-18 years', F, PL, [168, 227], 800], ['Pregnant/lactating ≥ 19 years', F, PL, [228, null], 1000]], { supp: true, note: 'Folate from fortified foods or supplements.' });
  ul('Vitamin C (Total)', 'mg', 'Table 12.2 (book p. 228)', 'IOM (2000)', [...kids([400, 650, 1200, 1800]), ['≥ 19 years', BOTH, N, [228, null], 2000],
    ['Pregnant/lactating 14-18 years', F, PL, [168, 227], 1800], ['Pregnant/lactating > 19 years', F, PL, [228, null], 2000]]);
  ul('Retinol', 'µg', 'Table 13.2 (book p. 246)', 'IOM (2001)', [['Infants', BOTH, N, [0, 11], 600], ...kids([600, 900, 1700, 2800]), ['≥ 19 years', BOTH, N, [228, null], 3000]], { note: 'Preformed vitamin A.' });
  ul('Retinol', 'µg', 'Table 13.2 (book p. 246)', 'IOM (2001)', [['Pregnant and lactating women', F, PL, [168, 611], 2800]],
    { note: 'Preformed vitamin A. Printed as 2,800 µg for pregnant and lactating women (no age); IOM gives 2,800 for 14-18 y and 3,000 for 19-50 y. Stored as printed for 14-50 y.' });
  ul('Vitamin D (Total)', 'µg', 'Table 14.2 (book p. 261)', 'IOM (2011)', [['Infants 0-6 months', BOTH, N, [0, 6], 25], ['Infants 6-12 months', BOTH, N, [7, 11], 37.5],
    ['Children 1-13 years', BOTH, N, [12, 167], 100], ['Adolescents 14-18 years', BOTH, N, [168, 227], 100], ['Adults > 18', BOTH, N, [228, null], 100], ['Pregnant/lactating women', F, PL, [168, null], 100]],
    { note: 'Infant bands printed 0-6 and 6-12 months; stored as [0, 6] and [7, 11].' });
  ul('Vitamin E (Total)', 'mg', 'Table 15.3 (book p. 277)', 'IOM (2000)', [...kids([200, 300, 600, 800]), ['≥ 19 years', BOTH, N, [228, null], 1000],
    ['Pregnant/lactating 14-18 years', F, PL, [168, 227], 800], ['Pregnant/lactating ≥ 19 years', F, PL, [228, null], 1000]], { supp: true, note: 'Any form of supplementary α-tocopherol.' });
  ul('Calcium', 'mg', 'Table 17.2 (book p. 311)', 'IOM (2011)', [['0-6 months', BOTH, N, [0, 6], 1000], ['6-12 months', BOTH, N, [7, 11], 1500], ['1-3 years', BOTH, N, [12, 47], 2500],
    ['4-8 years', BOTH, N, [48, 107], 2500], ['9-13 years', BOTH, N, [108, 167], 3000], ['14-18 years', BOTH, N, [168, 227], 3000], ['19-30 years', BOTH, N, [228, 371], 2500],
    ['31-50 years', BOTH, N, [372, 611], 2500], ['51-70 years', BOTH, N, [612, 851], 2000], ['>70 years', BOTH, N, [852, null], 2000],
    ['Pregnancy & lactation 14-18 years', F, PL, [168, 227], 3000], ['Pregnancy & lactation 19-50 years', F, PL, [228, 611], 2500]]);
  ul('Iodine', 'µg', 'Table 19.2 (book p. 355)', 'IOM (2001)', [...kids([200, 300, 600, 900]), ['≥ 19 years', BOTH, N, [228, null], 1100],
    ['Pregnant/lactating 14-18 years', F, PL, [168, 227], 900], ['Pregnant/lactating > 19 years', F, PL, [228, null], 1100]], { note: 'Header prints "mg/day"; the values are µg (IOM).' });
  ul('Selenium', 'µg', 'Table 21.3 (book p. 384)', 'IOM (2000)', [['0-6 months', BOTH, N, [0, 6], 45], ['7-11 months', BOTH, N, [7, 11], 60], ...kids([90, 150, 280, 400]),
    ['≥ 19 years', BOTH, N, [228, null], 400], ['Pregnant/lactating 14-18 years', F, PL, [168, 227], 400], ['Pregnant/lactating 19-50 years', F, PL, [228, 611], 400]]);
  ul('Phosphorus', 'mg', 'Table 22.2 (book p. 400)', 'IOM (2006)', [['1-3 years', BOTH, N, [12, 47], 3000], ['4-8 years', BOTH, N, [48, 107], 3000], ['9-13 years', BOTH, N, [108, 167], 4000],
    ['14-18 years', BOTH, N, [168, 227], 4000], ['19-30 years', BOTH, N, [228, 371], 4000], ['31-50 years', BOTH, N, [372, 611], 4000], ['50-70 years', BOTH, N, [612, 851], 4000], ['> 70 years', BOTH, N, [852, null], 4000],
    ['Pregnancy ≤ 18 years', F, ['PREGNANT'], [168, 227], 3500], ['Pregnancy 19-50 years', F, ['PREGNANT'], [228, 611], 3500],
    ['Lactation ≤ 18 years', F, ['LACTATING'], [168, 227], 4000], ['Lactation 19-50 years', F, ['LACTATING'], [228, 611], 4000]]);
  ul('Sodium', 'mg', '§23.8 UL for sodium (book pp. 421-422)', 'IOM', [['1-3 years', BOTH, N, [12, 47], 1000], ['4-8 years', BOTH, N, [48, 107], 1400], ['9-13 years', BOTH, N, [108, 167], 2000],
    ['14-18 years', BOTH, N, [168, 227], 2300], ['Adults 19+ years', BOTH, N, [228, null], 2300]]);
  ul('Magnesium', 'mg', '§25.8 UL from magnesium supplements (book p. 447)', 'IOM (1997)', [['1-3 years', BOTH, N, [12, 47], 65], ['4-8 years', BOTH, N, [48, 107], 110], ['9-13 years', BOTH, N, [108, 167], 350],
    ['14-18 years', BOTH, N, [168, 227], 350], ['Adults', BOTH, N, [228, null], 350], ['Pregnancy / Lactation', F, PL, [168, null], 350]], { supp: true, note: 'From magnesium supplements (non-food sources).' });
  ul('Copper', 'µg', '§27.8 (book p. 464)', 'IOM (2001)', [['1-3 years', BOTH, N, [12, 47], 1000], ['4-8 years', BOTH, N, [48, 107], 3000], ['9-13 years', BOTH, N, [108, 167], 5000], ['14-18 years', BOTH, N, [168, 227], 8000],
    ['19-30 years', BOTH, N, [228, 371], 10000], ['31-50 years', BOTH, N, [372, 611], 10000], ['50-70 years', BOTH, N, [612, 851], 10000], ['> 70 years', BOTH, N, [852, null], 10000],
    ['Pregnancy/lactation ≤ 18 years', F, PL, [168, 227], 8000], ['Pregnancy/lactation 19-50 years', F, PL, [228, 611], 10000]]);
  ul('Manganese', 'mg', 'Table 28.2 (book p. 470)', 'IOM (2006)', [...kids([2, 3, 6, 9]), ['Pregnancy/lactation 14-18 years', F, PL, [168, 227], 9], ['Pregnancy/lactation 19-50 years', F, PL, [228, 611], 11]]);
  ul('Manganese', 'mg', '§28.8 text (book p. 470)', 'IOM (2006)', [['Adults above 19 years', BOTH, N, [228, null], 11]], { note: 'From the text ("the UL level for adults above 19 years old for manganese is 11mg/day"); Table 28.2 has no adult row.' });
  ul('Molybdenum', 'µg', '§29.8 text (book p. 491)', 'NAS/IOM', [['1-3 years', BOTH, N, [12, 47], 600], ['9-13 years', BOTH, N, [108, 167], 1100], ['14-19 years', BOTH, N, [168, 227], 1700], ['19+ years', BOTH, N, [228, null], 2000],
    ['Pregnant or lactating, under 19 years', F, PL, [168, 227], 1700], ['Pregnant or lactating, over 19 years', F, PL, [228, null], 2000]], { note: 'No value printed for 4-8 y.' });
  ul('Fluoride', 'mg', 'Table 30.4 (book p. 496)', 'IOM', [['Infants 0-6 months', BOTH, N, [0, 6], 0.7], ['Infants 7-12 months', BOTH, N, [7, 11], 0.9], ['Children 1-3 years', BOTH, N, [12, 47], 1.3],
    ['Children 4-8 years', BOTH, N, [48, 107], 2.2], ['Children 9-13 years', BOTH, N, [108, 167], 10], ['Adolescents 14-18 years', BOTH, N, [168, 227], 10], ['Adults 19 years and older', BOTH, N, [228, null], 10]]);
}

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths || (a.activityLevel ?? '').localeCompare(b.activityLevel ?? ''));
writeFileSync(path.join(process.cwd(), 'dv-sources', 'rni-malaysia-2017', 'values.json'), JSON.stringify(out, null, 1) + '\n');
const byType: Record<string, number> = {};
for (const v of out) byType[v.valueType] = (byType[v.valueType] ?? 0) + 1;
console.log(`Wrote ${out.length} values to dv-sources/rni-malaysia-2017/values.json`, byType);
