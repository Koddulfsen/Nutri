/**
 * FAO/WHO "Vitamin and mineral requirements in human nutrition", 2nd ed. (2004), Appendix 1 ->
 * values.json.
 *
 * Transcribed cell by cell, 2026-09-14, from the FAO HTML appendix
 * https://www.fao.org/4/y2809e/y2809e0o.htm (snapshot: source/y2809e0o.htm): Table 1 (minerals) and
 * Table 2 (vitamins). The local PDFs are front matter only.
 *
 * Mapping decisions (all recorded in value notes):
 *   - RNI -> RDA. Vitamin A is printed as "recommended safe intakes" (note f) -> RDA with that wording.
 *     Vitamin E is "acceptable intakes" (note h) -> AI.
 *   - Iron RNIs are printed at 15 / 12 / 10 / 5 % bioavailability and zinc at high / moderate / low.
 *     Nutri has no bioavailability dimension: iron is stored at 12 % and zinc at moderate
 *     bioavailability, with every printed alternative in the note.
 *   - Infants 0-6 months: calcium, magnesium and zinc are printed for human milk and for formula; the
 *     human-milk value is stored (zinc 1.1, note e). Zinc 7-12 months prints 0.8 for human milk (e) and 2.5 / 4.1 / 8.3
 *     otherwise (h); the moderate-bioavailability 4.1 is stored.
 *   - Females 10-14 y iron: printed for non-menstruating (m) and menstruating adolescents; the
 *     menstruating value is stored.
 *   - Lactation is printed for 0-3, 4-6 and 7-12 months; Nutri has 0-6 and 7-12. Where 0-3 and 4-6
 *     differ (zinc only) the 0-3 month value is stored.
 *   - Pregnancy / lactation rows print no ages; stored from 18 y with no upper bound.
 *
 * Not stored: iodine for premature infants and 0-6 months (per kg body weight), iron for 0-6 months
 * (note k: neonatal stores suffice), pregnancy iron (note n: supplements advised), vitamin E in
 * pregnancy/lactation (note i: no different from adults, no value printed), biotin 65+ (blank).
 *
 * Also stored (sections below): WHO guidelines on sodium, potassium (2012), sugars (2015), saturated and trans
 * fat, total fat, carbohydrate/fibre (2023); FAO/WHO/UNU human energy requirements (2001) for infants and
 * children; FAO 2010 fats and fatty acids Tables 2.1 and 2.2.
 *
 * Run: npx tsx dv-sources/who-fao/extract.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage, Activity } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
type Cell = number | [number, number] | null;
const out: SourceValue[] = [];
const BOTH: Sex[] = ['MALE', 'FEMALE'];
const PREG: Age = [216, null];

function add(p: { compound: string; type: DvValueType; sexes: Sex[]; stage?: LifeStage; age: Age; cell: Cell; unit: string; note?: string | null; from: string }) {
  if (p.cell == null) return;
  const [value, vmin, vmax] = Array.isArray(p.cell) ? [Number(((p.cell[0] + p.cell[1]) / 2).toFixed(4)), p.cell[0], p.cell[1]] : [p.cell, null, null];
  for (const sex of p.sexes) {
    out.push({
      compound: p.compound, valueType: p.type, sex, lifeStage: p.stage ?? 'NONE', ageMinMonths: p.age[0], ageMaxMonths: p.age[1],
      activityLevel: null, dietaryContext: null, value, valueMin: vmin, valueMax: vmax, unit: p.unit,
      isPercentOfEnergy: false, isProvisional: false, supplementalOnly: false, note: p.note ?? null, from: p.from,
    });
  }
}

// ───────────── Table 1: minerals ─────────────
{
  const t = 'Appendix 1 Table 1';
  interface Row { label: string; sexes: Sex[]; stage?: LifeStage; age: Age; ca?: Cell; mg?: Cell; se?: Cell; zn?: [Cell, Cell, Cell]; znHumanMilk?: boolean; fe?: [number, number, number, number]; i?: Cell; notes?: Record<string, string> }
  const rows: Row[] = [
    { label: '0-6 months', sexes: BOTH, age: [0, 5], ca: 300, mg: 26, se: 6, zn: [1.1, 2.8, 6.6], znHumanMilk: true,
      notes: { ca: 'Human milk; 400 mg for infant formula.', mg: 'Human milk; 36 mg for infant formula.', zn: 'Human-milk fed 1.1 mg; formula-fed moderate 2.8, low 6.6 mg.' } },
    { label: '7-12 months', sexes: BOTH, age: [6, 11], ca: 400, mg: 53, se: 10, zn: [2.5, 4.1, 8.3], fe: [6, 8, 9, 19], i: 135,
      notes: { zn: 'Not applicable to infants consuming human milk only (0.8 mg for human-milk fed).', fe: 'Printed in brackets: bioavailability of dietary iron varies greatly in this period.' } },
    { label: '1-3 years', sexes: BOTH, age: [12, 47], ca: 500, mg: 60, se: 17, zn: [2.4, 4.1, 8.4], fe: [4, 5, 6, 12], i: 75 },
    { label: '4-6 years', sexes: BOTH, age: [48, 83], ca: 600, mg: 73, se: 21, zn: [3.1, 5.1, 10.3], fe: [4, 5, 6, 13], i: 110 },
    { label: '7-9 years', sexes: BOTH, age: [84, 119], ca: 700, mg: 100, se: 21, zn: [3.3, 5.6, 11.3], fe: [6, 7, 9, 18], i: 100 },
    { label: 'Males 10-18 years', sexes: ['MALE'], age: [120, 227], ca: 1300, mg: 250, se: 34, zn: [5.7, 9.7, 19.2], notes: { ca: 'Particularly during the growth spurt.' } },
    { label: 'Females 10-18 years', sexes: ['FEMALE'], age: [120, 227], ca: 1300, mg: 230, se: 26, zn: [4.6, 7.8, 15.5], notes: { ca: 'Particularly during the growth spurt.' } },
    { label: 'Males 19-65 years', sexes: ['MALE'], age: [228, 791], ca: 1000, mg: 260, se: 34, zn: [4.2, 7.0, 14.0], fe: [9, 11, 14, 27], i: 130 },
    { label: 'Females 19-50 years (pre-menopausal)', sexes: ['FEMALE'], age: [228, 611], ca: 1000, mg: 220, se: 26, zn: [3.0, 4.9, 9.8], fe: [20, 24, 29, 59], i: 110 },
    { label: 'Females 51-65 years (menopausal)', sexes: ['FEMALE'], age: [612, 791], ca: 1300, mg: 220, se: 26, zn: [3.0, 4.9, 9.8], fe: [8, 9, 11, 23], i: 110 },
    { label: 'Males 65+ years', sexes: ['MALE'], age: [792, null], ca: 1300, mg: 230, se: 34, zn: [4.2, 7.0, 14.0], fe: [9, 11, 14, 27], i: 130 },
    { label: 'Females 65+ years', sexes: ['FEMALE'], age: [792, null], ca: 1300, mg: 190, se: 26, zn: [3.0, 4.9, 9.8], fe: [8, 9, 11, 23], i: 110 },
    { label: 'Pregnancy, first trimester', sexes: ['FEMALE'], stage: 'PREGNANT_T1', age: PREG, mg: 220, zn: [3.4, 5.5, 11.0], i: 200 },
    { label: 'Pregnancy, second trimester', sexes: ['FEMALE'], stage: 'PREGNANT_T2', age: PREG, mg: 220, se: 28, zn: [4.2, 7.0, 14.0], i: 200 },
    { label: 'Pregnancy, third trimester', sexes: ['FEMALE'], stage: 'PREGNANT_T3', age: PREG, ca: 1200, mg: 220, se: 30, zn: [6.0, 10.0, 20.0], i: 200 },
    { label: 'Lactation, 0-3 months (4-6 months equal except zinc)', sexes: ['FEMALE'], stage: 'LACTATING_0_6M', age: PREG, ca: 1000, mg: 270, se: 35, zn: [5.8, 9.5, 19.0], fe: [10, 12, 15, 30], i: 200,
      notes: { zn: '0-3 months postpartum; 4-6 months: high 5.3, moderate 8.8, low 17.5 mg.' } },
    { label: 'Lactation, 7-12 months', sexes: ['FEMALE'], stage: 'LACTATING_7_12M', age: PREG, ca: 1000, mg: 270, se: 42, zn: [4.3, 7.2, 14.4], fe: [10, 12, 15, 30], i: 200 },
  ];
  for (const r of rows) {
    const from = (n: string) => `${t}, ${n}, ${r.label}`;
    add({ compound: 'Calcium', type: 'RDA', sexes: r.sexes, stage: r.stage, age: r.age, cell: r.ca ?? null, unit: 'mg', note: r.notes?.ca, from: from('Calcium') });
    add({ compound: 'Magnesium', type: 'RDA', sexes: r.sexes, stage: r.stage, age: r.age, cell: r.mg ?? null, unit: 'mg', note: r.notes?.mg, from: from('Magnesium') });
    add({ compound: 'Selenium', type: 'RDA', sexes: r.sexes, stage: r.stage, age: r.age, cell: r.se ?? null, unit: 'µg', from: from('Selenium') });
    if (r.zn && r.znHumanMilk) add({ compound: 'Zinc', type: 'RDA', sexes: r.sexes, stage: r.stage, age: r.age, cell: r.zn[0], unit: 'mg',
      note: r.notes?.zn, from: from('Zinc (human-milk fed)') });
    else if (r.zn) add({ compound: 'Zinc', type: 'RDA', sexes: r.sexes, stage: r.stage, age: r.age, cell: r.zn[1], unit: 'mg',
      note: [`Moderate bioavailability. High ${r.zn[0]}, low ${r.zn[2]} mg.`, r.notes?.zn].filter(Boolean).join(' '), from: from('Zinc (moderate bioavailability)') });
    if (r.fe) add({ compound: 'Iron (Total)', type: 'RDA', sexes: r.sexes, stage: r.stage, age: r.age, cell: r.fe[1], unit: 'mg',
      note: [`12 % bioavailability. 15 %: ${r.fe[0]}, 10 %: ${r.fe[2]}, 5 %: ${r.fe[3]} mg.`, r.notes?.fe].filter(Boolean).join(' '), from: from('Iron (12% bioavailability)') });
    add({ compound: 'Iodine', type: 'RDA', sexes: r.sexes, stage: r.stage, age: r.age, cell: r.i ?? null, unit: 'µg', from: from('Iodine') });
  }
  // Adolescents with split sub-ages for iron and iodine.
  const feSplit: Array<[string, Sex, Age, [number, number, number, number], string?]> = [
    ['Males 10-14 yrs', 'MALE', [120, 179], [10, 12, 15, 29]], ['Males 15-18 yrs', 'MALE', [180, 227], [12, 16, 19, 38]],
    ['Females 10-14 yrs (menstruating)', 'FEMALE', [120, 179], [22, 28, 33, 65], 'Menstruating; non-menstruating adolescents: 15 %: 9, 12 %: 12, 10 %: 14, 5 %: 28 mg.'],
    ['Females 15-18 yrs', 'FEMALE', [180, 227], [21, 26, 31, 62]],
  ];
  for (const [label, sex, age, fe, extra] of feSplit) {
    add({ compound: 'Iron (Total)', type: 'RDA', sexes: [sex], age, cell: fe[1], unit: 'mg', note: [`12 % bioavailability. 15 %: ${fe[0]}, 10 %: ${fe[2]}, 5 %: ${fe[3]} mg.`, extra].filter(Boolean).join(' '), from: `${t}, Iron (12% bioavailability), ${label}` });
  }
  const iSplit: Array<[string, Sex, Age, number]> = [['Males 10-11 yrs', 'MALE', [120, 143], 135], ['Males 12+ yrs', 'MALE', [144, 227], 110], ['Females 10-11 yrs', 'FEMALE', [120, 143], 140], ['Females 12+ yrs', 'FEMALE', [144, 227], 100]];
  for (const [label, sex, age, v] of iSplit) add({ compound: 'Iodine', type: 'RDA', sexes: [sex], age, cell: v, unit: 'µg', from: `${t}, Iodine, ${label}` });
}

// ───────────── Table 2: vitamins ─────────────
{
  const t = 'Appendix 1 Table 2';
  const COLS: Array<{ compound: string; unit: string; type: DvValueType; note?: string }> = [
    { compound: 'Thiamin (B1)', unit: 'mg', type: 'RDA' }, { compound: 'Riboflavin (B2)', unit: 'mg', type: 'RDA' },
    { compound: 'Niacin (B3)', unit: 'mg NE', type: 'RDA', note: 'As niacin equivalents.' }, { compound: 'Vitamin B6', unit: 'mg', type: 'RDA' },
    { compound: 'Pantothenic Acid (B5)', unit: 'mg', type: 'RDA' }, { compound: 'Biotin (B7)', unit: 'µg', type: 'RDA' },
    { compound: 'Folate (Total)', unit: 'µg DFE', type: 'RDA', note: 'As dietary folate equivalents.' }, { compound: 'Vitamin B12 (Total)', unit: 'µg', type: 'RDA' },
    { compound: 'Vitamin C (Total)', unit: 'mg', type: 'RDA' },
    { compound: 'Vitamin A (RE)', unit: 'µg RE', type: 'RDA', note: 'Recommended safe intake (not an RNI), as retinol equivalents, not RAE.' },
    { compound: 'Vitamin D (Total)', unit: 'µg', type: 'RDA' },
    { compound: 'Vitamin E (Total)', unit: 'mg α-TE', type: 'AI', note: 'Acceptable intake: data insufficient for a recommendation.' },
    { compound: 'Vitamin K (Total)', unit: 'µg', type: 'RDA', note: '1 µg/kg/day of phylloquinone.' },
  ];
  const rows: Array<[string, Sex[], LifeStage, Age, Cell[], Record<number, string>?]> = [
    ['0-6 months', BOTH, 'NONE', [0, 5], [0.2, 0.3, 2, 0.1, 1.7, 5, 80, 0.4, 25, 375, 5, 2.7, 5], { 2: 'Preformed niacin.', 11: 'Human breast milk vitamin E is about 2.7 mg per 850 ml.', 12: 'Cannot be met by exclusively breast-fed infants; vitamin K supplementation at birth advised.' }],
    ['7-11 months', BOTH, 'NONE', [6, 11], [0.3, 0.4, 4, 0.3, 1.8, 6, 80, 0.5, 30, 400, 5, 2.7, 10]],
    ['1-3 years', BOTH, 'NONE', [12, 47], [0.5, 0.5, 6, 0.5, 2, 8, 160, 0.9, 30, 400, 5, 5, 15], { 11: 'Based on a proportion of the adult acceptable intake.' }],
    ['4-6 years', BOTH, 'NONE', [48, 83], [0.6, 0.6, 8, 0.6, 3, 12, 200, 1.2, 30, 450, 5, 5, 20], { 11: 'Based on a proportion of the adult acceptable intake.' }],
    ['7-9 years', BOTH, 'NONE', [84, 119], [0.9, 0.9, 12, 1.0, 4, 20, 300, 1.8, 35, 500, 5, 7, 25], { 11: 'Based on a proportion of the adult acceptable intake.' }],
    ['Adolescent males 10-18 years', ['MALE'], 'NONE', [120, 227], [1.2, 1.3, 16, 1.3, 5, 25, 400, 2.4, 40, 600, 5, 10, [35, 65]]],
    ['Adolescent females 10-18 years', ['FEMALE'], 'NONE', [120, 227], [1.1, 1.0, 16, 1.2, 5, 25, 400, 2.4, 40, 600, 5, 7.5, [35, 55]]],
    ['Males 19-65 years (B6, D: 19-50 yrs)', ['MALE'], 'NONE', [228, 599], [1.2, 1.3, 16, 1.3, 5, 30, 400, 2.4, 45, 600, 5, 10, 65]],
    ['Males 19-65 years (B6, D: 50+ yrs)', ['MALE'], 'NONE', [600, 791], [1.2, 1.3, 16, 1.7, 5, 30, 400, 2.4, 45, 600, 10, 10, 65]],
    ['Females 19-50 years (pre-menopausal)', ['FEMALE'], 'NONE', [228, 599], [1.1, 1.1, 14, 1.3, 5, 30, 400, 2.4, 45, 500, 5, 7.5, 55]],
    ['Females 50-65 years (menopausal)', ['FEMALE'], 'NONE', [600, 791], [1.1, 1.1, 14, 1.5, 5, 30, 400, 2.4, 45, 500, 10, 7.5, 55]],
    ['Older males 65+ years', ['MALE'], 'NONE', [792, null], [1.2, 1.3, 16, 1.7, 5, null, 400, 2.4, 45, 600, 15, 10, 65]],
    ['Older females 65+ years', ['FEMALE'], 'NONE', [792, null], [1.1, 1.1, 14, 1.5, 5, null, 400, 2.4, 45, 600, 15, 7.5, 55]],
    ['Pregnancy', ['FEMALE'], 'PREGNANT', PREG, [1.4, 1.4, 18, 1.9, 6, 30, 600, 2.6, 55, 800, 5, null, 55]],
    ['Lactation', ['FEMALE'], 'LACTATING', PREG, [1.5, 1.6, 17, 2.0, 7, 35, 500, 2.8, 70, 850, 5, null, 55], { 8: 'Includes an additional 25 mg for lactation.' }],
  ];
  for (const [label, sexes, stage, age, cells, notes] of rows) {
    if (cells.length !== COLS.length) throw new Error(`${label}: ${cells.length} cells`);
    COLS.forEach((c, i) => add({ compound: c.compound, type: c.type, sexes, stage, age, cell: cells[i], unit: c.unit, note: [c.note, notes?.[i]].filter(Boolean).join(' ') || null, from: `${t}, ${c.compound}, ${label}` }));
  }
}

// ───────────── WHO guidelines on sodium, potassium, sugars, fats and fibre ─────────────
// From the "Recommendations" sections on NCBI Bookshelf, snapshots in source/who-20*.html. Each is a
// guideline for reducing noncommunicable disease risk -> CDRR: "less than / limit / reduce to" is a ceiling,
// "at least" a floor. Children's sodium and potassium are "adjusted downward based on energy requirements"
// with no numbers given (not stored). Vegetable and fruit intakes are not nutrients (not stored).
{
  const ceiling = (compound: string, age: Age, v: number, unit: string, pct: boolean, note: string, from: string) => {
    for (const sex of BOTH) out.push({ compound, valueType: 'CDRR', sex, lifeStage: 'NONE', ageMinMonths: age[0], ageMaxMonths: age[1], activityLevel: null, dietaryContext: null,
      value: v, valueMin: null, valueMax: v, unit, isPercentOfEnergy: pct, isProvisional: false, supplementalOnly: false, note, from });
  };
  const floor = (compound: string, age: Age, v: number, unit: string, note: string, from: string) => {
    for (const sex of BOTH) out.push({ compound, valueType: 'CDRR', sex, lifeStage: 'NONE', ageMinMonths: age[0], ageMaxMonths: age[1], activityLevel: null, dietaryContext: null,
      value: v, valueMin: v, valueMax: null, unit, isPercentOfEnergy: false, isProvisional: false, supplementalOnly: false, note, from });
  };
  ceiling('Sodium', [192, null], 2, 'g', false, 'WHO recommends a reduction to <2 g/day sodium (5 g/day salt) in adults (strong recommendation). "Adults" includes individuals ≥16 years of age.',
    'WHO 2012 Guideline: Sodium intake for adults and children, Recommendations');
  floor('Potassium', [192, null], 3510, 'mg', 'WHO suggests a potassium intake of at least 90 mmol/day (3510 mg/day) for adults (conditional recommendation). "Adults" includes all individuals ≥16 years of age.',
    'WHO 2012 Guideline: Potassium intake for adults and children, Recommendations');
  ceiling('Free Sugars', [0, null], 10, '%', true, 'In both adults and children, WHO recommends reducing the intake of free sugars to less than 10% of total energy intake (strong recommendation); a further reduction to below 5% is suggested (conditional). Recommended "throughout the lifecourse"; no age range is given.',
    'WHO 2015 Guideline: Sugars intake for adults and children, Recommendations');
  ceiling('Saturated Fat', [24, null], 10, '%', true, 'WHO recommends that adults and children reduce saturated fatty acid intake to 10% of total energy intake (strong recommendation), and suggests further reducing it below 10% (conditional). Relevant for all individuals aged 2 years and older.',
    'WHO 2023 Guideline: Saturated fatty acid and trans-fatty acid intake, SFA recommendations 1-2');
  ceiling('Trans Fat', [24, null], 1, '%', true, 'WHO recommends that adults and children reduce trans-fatty acid intake to 1% of total energy intake (strong recommendation), and suggests further reducing it below 1% (conditional). Relevant for all individuals aged 2 years and older.',
    'WHO 2023 Guideline: Saturated fatty acid and trans-fatty acid intake, TFA recommendations 1-2');
  ceiling('Total Fat', [240, null], 30, '%', true, 'To reduce the risk of unhealthy weight gain, WHO suggests that adults limit total fat intake to 30% of total energy intake or less (conditional recommendation). Relevant for individuals aged 20 years or older.',
    'WHO 2023 Guideline: Total fat intake for the prevention of unhealthy weight gain, Recommendation 1');
  const fibre = 'Naturally occurring dietary fibre as consumed in foods.';
  floor('Dietary Fiber', [24, 71], 15, 'g', `${fibre} Children 2–5 years, at least 15 g per day (conditional recommendation).`, 'WHO 2023 Guideline: Carbohydrate intake for adults and children, Recommendation 5, 2–5 years');
  floor('Dietary Fiber', [72, 119], 21, 'g', `${fibre} Children 6–9 years, at least 21 g per day (conditional recommendation).`, 'WHO 2023 Guideline: Carbohydrate intake for adults and children, Recommendation 5, 6–9 years');
  floor('Dietary Fiber', [120, null], 25, 'g', `${fibre} At least 25 g per day for 10 years or older (conditional) and for adults (strong recommendation); the guideline does not define the adult age.`, 'WHO 2023 Guideline: Carbohydrate intake for adults and children, Recommendations 4-5, 10 years or older and adults');
}

// ───────────── FAO/WHO/UNU Human energy requirements (2001) ─────────────
// Chapters 3 and 4 of https://www.fao.org/4/y5686e/, snapshots in source/fao-2001-energy-ch*.htm. Stored in kcal/d:
//   - Table 3.2 (first table of that name): daily energy requirement of all infants (breast- and formula-fed
//     combined, per the chapter) by month of life, boys and girls.
//   - Tables 4.5 / 4.6: boys' / girls' requirements at light, moderate and heavy habitual activity. From 1 to
//     6 y only moderate is printed (stored with no activity level). Light / moderate / heavy -> SEDENTARY /
//     MODERATE / ACTIVE, with the printed PAL in the note.
// Adults (chapter 5) are given per kg of body weight and PAL, and are not stored.
{
  const rows = (file: string, caption: RegExp): string[][] => {
    const t = readFileSync(path.join(process.cwd(), 'dv-sources', 'who-fao', 'source', file), 'latin1');
    const m = caption.exec(t);
    if (!m) throw new Error(`${file}: ${caption} not found`);
    const start = t.toLowerCase().indexOf('<table', m.index);
    const end = t.toLowerCase().indexOf('</table>', start);
    return [...t.slice(start, end).matchAll(/<tr.*?<\/tr>/gis)].map(([tr]) =>
      [...tr.matchAll(/<t[dh][^>]*>(.*?)<\/t[dh]>/gis)].map(([, c]) => c.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()));
  };
  const kcal = (c: string) => { const v = Number(c.replace(/\s/g, '')); if (!Number.isFinite(v) || v <= 0) throw new Error(`energy cell "${c}"`); return v; };
  const push = (sex: Sex, age: Age, v: number, activity: Activity | null, note: string, from: string) => out.push({
    compound: 'Energy', valueType: 'EER', sex, lifeStage: 'NONE', ageMinMonths: age[0], ageMaxMonths: age[1], activityLevel: activity, dietaryContext: null,
    value: v, valueMin: null, valueMax: null, unit: 'kcal', isPercentOfEnergy: false, isProvisional: false, supplementalOnly: false, note, from });

  // Infants
  {
    let sex: Sex | null = null; let n = 0;
    for (const r of rows('fao-2001-energy-ch3-infants.htm', /TABLE\s*3\.2[\s\S]{0,300}?Energy requirements of infants/i)) {
      if (r[0] === 'Boys') { sex = 'MALE'; continue; }
      if (r[0] === 'Girls') { sex = 'FEMALE'; continue; }
      const m = /^(\d+)-(\d+)$/.exec(r[0]);
      if (!sex || !m || r.length !== 11) continue;
      const month = Number(m[1]);
      push(sex, [month, month], kcal(r[8]), null, `Month ${m[1]}-${m[2]} of life, weight ${r[1]} kg; breast- and formula-fed infants combined.`,
        `FAO/WHO/UNU 2001 Table 3.2, ${sex === 'MALE' ? 'Boys' : 'Girls'} ${r[0]} months, daily energy requirement kcal/d`);
      n++;
    }
    if (n !== 24) throw new Error(`Table 3.2: ${n} infant rows`);
  }
  // Children and adolescents
  for (const [tab, sex, who] of [['4.5', 'MALE', 'Boys'], ['4.6', 'FEMALE', 'Girls']] as Array<[string, Sex, string]>) {
    let n = 0;
    for (const r of rows('fao-2001-energy-ch4-children.htm', new RegExp(`TABLE\\s*${tab.replace('.', '\\.')}[\\s\\S]{0,300}?${who}`, 'i'))) {
      const m = /^(\d+)-(\d+)$/.exec(r[0]);
      if (!m || r.length !== 17) continue;
      const y = Number(m[1]);
      const age: Age = [y * 12, y * 12 + 11];
      const levels: Array<[Activity, string, number]> = [['SEDENTARY', 'Light', 2], ['MODERATE', 'Moderate', 7], ['ACTIVE', 'Heavy', 12]];
      const light = r[3];
      if (!light) {
        push(sex, age, kcal(r[8]), null, `Printed at moderate activity only (PAL ${r[11]}); applies at every activity level. Weight ${r[1]} kg.`,
          `FAO/WHO/UNU 2001 Table ${tab}, ${who} ${r[0]} years, moderate physical activity, kcal/d`);
      } else {
        for (const [act, label, i] of levels) {
          push(sex, age, kcal(r[i + 1]), act, `${label} habitual physical activity (PAL ${r[i + 4]}). Weight ${r[1]} kg.`,
            `FAO/WHO/UNU 2001 Table ${tab}, ${who} ${r[0]} years, ${label.toLowerCase()} physical activity, kcal/d`);
        }
      }
      n++;
    }
    if (n !== 17) throw new Error(`Table ${tab}: ${n} rows`);
  }
}

// ───────────── FAO 2010 Fats and fatty acids in human nutrition ─────────────
// Tables 2.1 (adults) and 2.2 (infants 0-24 months, children 2-18 years), transcribed from the report PDF (text
// snapshot: source/fao-2010-fats-report.txt, lines ~1158-1300). Adults are taken as 18 y and older (Table 2.2
// covers children to 18 y). U-AMDR -> AMDR ceiling, L-AMDR -> AMDR floor, TFA "UL <1%E" -> UL.
// Not stored: MUFA "by difference", total fat 6-24 mo ("gradual reduction ... to 35%E"), human-milk-based
// values without a number, DHA 6-24 mo (10-12 mg/kg body weight), the EPA+DHA upper value of 2 g "for secondary
// prevention of CHD" is kept as the printed range end.
{
  const T21 = 'FAO 2010 Fats and fatty acids, Table 2.1 (adults)';
  const T22 = 'FAO 2010 Fats and fatty acids, Table 2.2 (infants and children)';
  const put = (compound: string, type: DvValueType, age: Age, lo: number | null, hi: number | null, unit: string, from: string, note?: string) => {
    const value = lo != null && hi != null ? Number(((lo + hi) / 2).toFixed(4)) : (hi ?? lo)!;
    for (const sex of BOTH) out.push({ compound, valueType: type, sex, lifeStage: 'NONE', ageMinMonths: age[0], ageMaxMonths: age[1], activityLevel: null, dietaryContext: null,
      value, valueMin: lo, valueMax: hi, unit, isPercentOfEnergy: unit === '%', isProvisional: false, supplementalOnly: false, note: note ?? null, from });
  };
  const ADULT: Age = [216, null];
  put('Total Fat', 'AMDR', ADULT, 20, 35, '%', `${T21}, Total fat AMDR 20–35%E`, 'U-AMDR 35%E, L-AMDR 15%E.');
  put('Saturated Fat', 'AMDR', ADULT, null, 10, '%', `${T21}, SFA U-AMDR 10%E`);
  put('Polyunsaturated Fat', 'AMDR', ADULT, 6, 11, '%', `${T21}, Total PUFA AMDR (LA + ALA + EPA + DHA) 6–11%E`);
  put('Polyunsaturated Fat', 'AI', ADULT, 2.5, 3.5, '%', `${T21}, Total PUFA AI 2.5–3.5%E`);
  put('Linoleic Acid', 'AMDR', ADULT, 2.5, 9, '%', `${T21}, n-6 PUFA AMDR (LA) 2.5–9%E`);
  put('Linoleic Acid', 'EAR', ADULT, 2, null, '%', `${T21}, n-6 PUFA EAR 2%E (SD of 0.5%)`);
  put('Linoleic Acid', 'AI', ADULT, 2, 3, '%', `${T21}, n-6 PUFA AI 2–3%E`);
  put('Omega-3', 'AMDR', ADULT, 0.5, 2, '%', `${T21}, n-3 PUFA AMDR (n-3) 0.5–2%E`, 'ALA + n-3 long-chain PUFA (footnote c).');
  put('Alpha-Linolenic Acid (ALA)', 'AMDR', ADULT, 0.5, null, '%', `${T21}, n-3 PUFA L-AMDR (ALA) > 0.5%E`);
  put('EPA + DHA', 'AMDR', ADULT, 0.25, 2, 'g', `${T21}, n-3 PUFA AMDR (EPA + DHA) 0.250–2 g/day`, 'The upper value of 2 g/day is for secondary prevention of CHD (footnote *).');
  put('Trans Fat', 'UL', ADULT, null, 1, '%', `${T21}, TFA UL <1%E`, 'Total TFA from ruminant and industrially-produced sources.');

  put('Total Fat', 'AMDR', [0, 5], 40, 60, '%', `${T22}, Total fat 0-6 mo AMDR 40-60%E`);
  put('Total Fat', 'AMDR', [24, 215], 25, 35, '%', `${T22}, Total fat 2-18 yr AMDR 25-35%E`);
  put('Saturated Fat', 'AMDR', [24, 215], null, 8, '%', `${T22}, SFA 2-18 yr U-AMDR 8%E`, 'Children from families with familial dyslipidaemia should receive lower SFA but not reduced total fat.');
  put('Polyunsaturated Fat', 'AMDR', [6, 23], null, 15, '%', `${T22}, Total PUFA 6-24 mo U-AMDR <15%E`);
  put('Polyunsaturated Fat', 'AMDR', [24, 215], null, 11, '%', `${T22}, Total PUFA 2-18 yr U-AMDR 11%E`);
  put('Arachidonic Acid', 'AI', [0, 5], 0.2, 0.3, '%', `${T22}, AA 0-6 mo AI 0.2-0.3%E`, 'Based on human milk composition (0.4-0.6% of fatty acids), footnote b.');
  put('Linoleic Acid', 'AI', [6, 23], 3.0, 4.5, '%', `${T22}, LA 6-12 mo and 12-24 mo AI 3.0-4.5%E`);
  put('Linoleic Acid', 'AMDR', [6, 23], null, 10, '%', `${T22}, LA 6-12 mo and 12-24 mo U-AMDR <10%E`);
  put('Alpha-Linolenic Acid (ALA)', 'AI', [0, 5], 0.2, 0.3, '%', `${T22}, ALA 0-6 mo AI 0.2-0.3%E`, 'Based on human milk composition (0.4-0.6% of fatty acids), footnote b.');
  put('Alpha-Linolenic Acid (ALA)', 'AI', [6, 23], 0.4, 0.6, '%', `${T22}, ALA 6-24 mo AI 0.4-0.6%E`);
  put('Alpha-Linolenic Acid (ALA)', 'AMDR', [6, 23], null, 3, '%', `${T22}, ALA 6-24 mo U-AMDR <3%E`);
  put('DHA (Docosahexaenoic Acid)', 'AI', [0, 5], 0.1, 0.18, '%', `${T22}, DHA 0-6 mo AI 0.1-0.18%E`, 'Based on human milk composition (0.20-0.36% of fatty acids), footnote b.');
  put('EPA + DHA', 'AI', [24, 47], 100, 150, 'mg', `${T22}, EPA+DHA 2-4 yr AI 100-150 mg`, 'Age adjusted for chronic disease prevention.');
  put('EPA + DHA', 'AI', [48, 71], 150, 200, 'mg', `${T22}, EPA+DHA 4-6 yr AI 150-200 mg`, 'Bridged from an infant value of 10 mg/kg.');
  put('EPA + DHA', 'AI', [72, 119], 200, 250, 'mg', `${T22}, EPA+DHA 6-10 yr AI 200-250 mg`, 'To the adult value assigned at age 10 years.');
  put('Trans Fat', 'UL', [24, 215], null, 1, '%', `${T22}, TFA 2-18 yr UL <1%E`, 'Total TFA from ruminant and industrially-produced sources.');
}

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths);
writeFileSync(path.join(process.cwd(), 'dv-sources', 'who-fao', 'values.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${out.length} values to dv-sources/who-fao/values.json`);
