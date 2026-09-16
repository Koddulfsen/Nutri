/**
 * Singapore HPB / MOH "Recommended Dietary Allowances for Normal Healthy Persons in Singapore"
 * (HealthHub, article last reviewed 15 November 2022) -> values.json.
 *
 * Transcribed cell by cell, 2026-09-14, from the HealthHub page (snapshot: source/healthhub-rda-2022.html),
 * tables 0-10.
 *
 * Mapping decisions:
 *   - Energy (average requirements, kcal/d): children "light / moderate / vigorous" -> SEDENTARY /
 *     MODERATE / ACTIVE; adults "low / moderate / very active" -> SEDENTARY / MODERATE / VERY_ACTIVE
 *     (the adult top level is ~1.38x moderate, the children's ~1.15x). Pregnancy +370 (2nd trimester),
 *     +480 (3rd), lactation +500 up to 12 months, stored as totals per activity level over women 18-49 y.
 *   - Pregnancy "full activities" / "reduced activities" (thiamin, riboflavin, niacin increments) ->
 *     MODERATE / SEDENTARY. Increments stored as totals over women 18-30 and 30-49 y.
 *   - Infant calcium 0-6 months: breast-fed value stored (formula-fed in note).
 *   - Vitamin A in retinol equivalents; vitamin D 2.5 µg applies to Singapore's tropical sun (note j).
 *
 * Printed as-is but flagged: girls 5-<7 y vitamin D is 10.5 µg where boys and all neighbouring cells are
 * 10.0 or 2.5 (possible typo in the source).
 *
 * Run: npx tsx dv-sources/hpb-singapore/extract.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage, Activity } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
const out: SourceValue[] = [];
const BOTH: Sex[] = ['MALE', 'FEMALE'];
const r4 = (x: number) => Number(x.toFixed(4));

function add(p: { compound: string; type?: DvValueType; sexes: Sex[]; stage?: LifeStage; age: Age; value: number | null; unit: string; activity?: Activity | null; note?: string | null; from: string }) {
  if (p.value == null) return;
  for (const sex of p.sexes) {
    out.push({
      compound: p.compound, valueType: p.type ?? 'RDA', sex, lifeStage: p.stage ?? 'NONE', ageMinMonths: p.age[0], ageMaxMonths: p.age[1],
      activityLevel: p.activity ?? null, dietaryContext: null, value: p.value, valueMin: null, valueMax: null, unit: p.unit,
      isPercentOfEnergy: false, isProvisional: false, supplementalOnly: false, note: p.note ?? null, from: p.from,
    });
  }
}

const vitA = 'As retinol equivalents.';
const vitD = 'As cholecalciferol.';
const tropical = '2.5 µg applies to Singapore only, given strong year-round sunlight (note j).';
const ironNote = 'Applies when 10-25% of dietary energy comes from animal foods (note e).';

// ───────────── Table 0: children & adolescents — iron, vitamin A, D, thiamin, riboflavin, niacin ─────────────
{
  const t = 'RDA children & adolescents (table 1)';
  // [label, sexes, age, iron, vitA, vitD, thiamin, riboflavin, niacin]
  const rows: Array<[string, Sex[], Age, number, number, number, number, number, number]> = [
    ['3 - < 6 mths', BOTH, [3, 5], 7, 300, 10.0, 0.28, 0.42, 4.6], ['6 - < 9 mths', BOTH, [6, 8], 7, 300, 10.0, 0.32, 0.49, 5.3],
    ['9 - < 12 mths', BOTH, [9, 11], 7, 300, 10.0, 0.38, 0.57, 6.3], ['1 - < 2 yrs', BOTH, [12, 23], 7, 250, 10.0, 0.46, 0.69, 7.6],
    ['2 - < 3 yrs', BOTH, [24, 35], 7, 250, 10.0, 0.54, 0.81, 8.9], ['3 - < 5 yrs', BOTH, [36, 59], 7, 300, 10.0, 0.62, 0.93, 10.2],
    ['Boys 5 - < 7 yrs', ['MALE'], [60, 83], 7, 300, 10.0, 0.74, 1.11, 12.2], ['Boys 7 - < 10 yrs', ['MALE'], [84, 119], 7, 400, 2.5, 0.84, 1.26, 13.9],
    ['Boys 10 - < 12 yrs', ['MALE'], [120, 143], 7, 575, 2.5, 0.88, 1.32, 14.5], ['Boys 12 - < 14 yrs', ['MALE'], [144, 167], 12, 725, 2.5, 0.96, 1.44, 15.8],
    ['Boys 14 - < 16 yrs', ['MALE'], [168, 191], 12, 725, 2.5, 1.06, 1.59, 17.5], ['Boys 16 - < 18 yrs', ['MALE'], [192, 215], 6, 750, 2.5, 1.14, 1.71, 18.8],
    ['Girls 5 - < 7 yrs', ['FEMALE'], [60, 83], 7, 300, 10.5, 0.70, 1.05, 11.6], ['Girls 7 - < 10 yrs', ['FEMALE'], [84, 119], 7, 400, 2.5, 0.72, 1.08, 11.9],
    ['Girls 10 - < 12 yrs', ['FEMALE'], [120, 143], 7, 575, 2.5, 0.78, 1.17, 12.9], ['Girls 12 - < 14 yrs', ['FEMALE'], [144, 167], 18, 725, 2.5, 0.84, 1.26, 13.9],
    ['Girls 14 - < 16 yrs', ['FEMALE'], [168, 191], 18, 725, 2.5, 0.86, 1.29, 14.2], ['Girls 16 - < 18 yrs', ['FEMALE'], [192, 215], 19, 750, 2.5, 0.86, 1.29, 14.2],
  ];
  for (const [label, sexes, age, fe, a, d, b1, b2, b3] of rows) {
    const f = (n: string) => `${t}, ${n}, ${label}`;
    add({ compound: 'Iron (Total)', sexes, age, value: fe, unit: 'mg', note: ironNote, from: f('Iron') });
    add({ compound: 'Vitamin A (RAE)', sexes, age, value: a, unit: 'µg RE', note: vitA, from: f('Vitamin A') });
    const dNote = [vitD, d === 2.5 ? tropical : null, label === 'Girls 5 - < 7 yrs' ? 'Printed 10.5 µg; boys and neighbouring cells are 10.0 or 2.5 (possible typo in the source).' : null].filter(Boolean).join(' ');
    add({ compound: 'Vitamin D (Total)', sexes, age, value: d, unit: 'µg', note: dNote, from: f('Vitamin D') });
    add({ compound: 'Thiamin (B1)', sexes, age, value: b1, unit: 'mg', from: f('Thiamin') });
    add({ compound: 'Riboflavin (B2)', sexes, age, value: b2, unit: 'mg', from: f('Riboflavin') });
    add({ compound: 'Niacin (B3)', sexes, age, value: b3, unit: 'mg NE', note: 'As niacin equivalents.', from: f('Niacin equiv.') });
  }
}
// ───────────── Table 1: children & adolescents — B12, B6, vitamin C, folate ─────────────
{
  const t = 'RDA children & adolescents (table 2)';
  const rows: Array<[string, Sex[], Age, number, number, number, number]> = [
    ['0-6 mths', BOTH, [0, 5], 0.4, 0.1, 35, 65], ['7-12 mths', BOTH, [6, 11], 0.5, 0.3, 45, 80], ['1-2 years', BOTH, [12, 35], 0.9, 0.5, 35, 150],
    ['3-6 years', BOTH, [36, 83], 1.1, 0.6, 50, 200], ['Boys 7-12 years', ['MALE'], [84, 155], 1.8, 1.0, 70, 300], ['Boys 13-18 years', ['MALE'], [156, 227], 2.4, 1.4, 105, 350],
    ['Girls 7-12 years', ['FEMALE'], [84, 155], 1.8, 1.0, 65, 300], ['Girls 13-18 years', ['FEMALE'], [156, 227], 2.2, 1.2, 80, 350],
  ];
  for (const [label, sexes, age, b12, b6, c, fol] of rows) {
    add({ compound: 'Vitamin B12 (Total)', sexes, age, value: b12, unit: 'µg', from: `${t}, Vit B12, ${label}` });
    add({ compound: 'Vitamin B6', sexes, age, value: b6, unit: 'mg', from: `${t}, Vit B6, ${label}` });
    add({ compound: 'Vitamin C (Total)', sexes, age, value: c, unit: 'mg', from: `${t}, Ascorbic acid, ${label}` });
    add({ compound: 'Folate (Total)', sexes, age, value: fol, unit: 'µg', note: 'Printed as "Folic Acid".', from: `${t}, Folic acid, ${label}` });
  }
}
// ───────────── Table 2: adults — iron, vitamin A, D, thiamin, riboflavin, niacin ─────────────
{
  const t = 'RDA adults (table 3)';
  const bands: Array<[string, Sex, Age]> = [['Men 18 - < 30', 'MALE', [216, 359]], ['Men 30 - < 60', 'MALE', [360, 719]], ['Men 60+', 'MALE', [720, null]], ['Women 18 - < 30', 'FEMALE', [216, 359]], ['Women 30 - < 60', 'FEMALE', [360, 719]], ['Women 60+', 'FEMALE', [720, null]]];
  const cols: Array<[string, string, number[], string?]> = [
    ['Iron (Total)', 'mg', [8, 8, 8, 18, 18, 8], ironNote], ['Vitamin A (RAE)', 'µg RE', [750, 750, 750, 750, 750, 750], vitA],
    ['Vitamin D (Total)', 'µg', [2.5, 2.5, 2.5, 2.5, 2.5, 2.5], `${vitD} ${tropical}`], ['Thiamin (B1)', 'mg', [1.18, 1.16, 0.98, 0.84, 0.86, 0.80]],
    ['Riboflavin (B2)', 'mg', [1.77, 1.74, 1.47, 1.26, 1.29, 1.20]], ['Niacin (B3)', 'mg NE', [19.5, 19.1, 16.2, 13.9, 14.2, 13.2], 'As niacin equivalents.'],
  ];
  for (const [compound, unit, vals, note] of cols) bands.forEach(([label, sex, age], i) => add({ compound, sexes: [sex], age, value: vals[i], unit, note, from: `${t}, ${compound}, ${label}` }));
  // Pregnant (full / reduced activities) and lactating (first 6 months / after 6 months).
  const W: Array<[number, number | null, number]> = [[216, 359, 3], [360, 599, 4]]; // women's age band -> column index
  const preg: Array<[string, string, Array<string | number>, string?]> = [
    ['Iron (Total)', 'mg', [27, 27, 9, 18], ironNote], ['Vitamin A (RAE)', 'µg RE', [750, 750, 1200, 1200], vitA], ['Vitamin D (Total)', 'µg', [10.0, 10.0, 10.0, 10.0], vitD],
    ['Thiamin (B1)', 'mg', ['+0.11', '+0.08', '+0.2', '+0.2']], ['Riboflavin (B2)', 'mg', ['+0.17', '+0.12', '+0.30', '+0.30']], ['Niacin (B3)', 'mg NE', ['+1.9', '+1.3', '+3.3', '+3.3'], 'As niacin equivalents.'],
  ];
  const stages: Array<[LifeStage, Activity | null, string]> = [['PREGNANT', 'MODERATE', 'Pregnant, full activities'], ['PREGNANT', 'SEDENTARY', 'Pregnant, reduced activities'], ['LACTATING_0_6M', null, 'Lactating, first 6 months'], ['LACTATING_7_12M', null, 'Lactating, after 6 months']];
  for (const [compound, unit, cells, note] of preg) {
    const base = cols.find((c) => c[0] === compound)![2];
    stages.forEach(([stage, activity, label], i) => {
      const cell = cells[i];
      const increment = typeof cell === 'string';
      // Absolute cells differ only by activity for pregnancy; store once without an activity level.
      if (!increment && stage === 'PREGNANT' && activity === 'SEDENTARY') return;
      for (const [min, max, col] of W) {
        const value = increment ? r4(base[col] + Number((cell as string).slice(1))) : (cell as number);
        const act = increment ? activity : null;
        add({ compound, sexes: ['FEMALE'], stage, age: [min, max], value, unit, activity: act,
          note: [note, increment ? `Printed as ${cell} over women ${col === 3 ? '18-30' : '30-60'} y; stored as total.` : null].filter(Boolean).join(' ') || null,
          from: `${t}, ${compound}, ${label}${increment ? ' ' + cell : ''}` });
        if (!increment) break;
      }
    });
  }
  // Absolute pregnancy/lactation cells are stored once for 18-49 y.
  for (const v of out) if (v.lifeStage !== 'NONE' && v.from.startsWith(t) && !v.from.includes('+') && v.ageMaxMonths === 359) v.ageMaxMonths = 599;
}
// ───────────── Table 3: adults — B12, B6, vitamin C, folate ─────────────
{
  const t = 'RDA adults (table 4)';
  const bands: Array<[string, Sex, Age]> = [['Men 19-50', 'MALE', [228, 611]], ['Men 51-65', 'MALE', [612, 791]], ['Men >65', 'MALE', [792, null]], ['Women 19-50', 'FEMALE', [228, 611]], ['Women 51-65', 'FEMALE', [612, 791]], ['Women >65', 'FEMALE', [792, null]]];
  const cols: Array<[string, string, number[], number, number, string?]> = [
    ['Vitamin B12 (Total)', 'µg', [2.4, 2.4, 2.4, 2.4, 2.4, 2.4], 2.6, 2.8], ['Vitamin B6', 'mg', [1.3, 1.7, 1.7, 1.3, 1.5, 1.5], 1.9, 2.0],
    ['Vitamin C (Total)', 'mg', [105, 105, 105, 85, 85, 85], 100, 135], ['Folate (Total)', 'µg', [400, 400, 400, 400, 400, 400], 600, 500, 'Printed as "Folic Acid".'],
  ];
  for (const [compound, unit, vals, preg, lact, note] of cols) {
    bands.forEach(([label, sex, age], i) => add({ compound, sexes: [sex], age, value: vals[i], unit, note, from: `${t}, ${compound}, ${label}` }));
    add({ compound, sexes: ['FEMALE'], stage: 'PREGNANT', age: [216, 599], value: preg, unit, note, from: `${t}, ${compound}, Pregnant` });
    add({ compound, sexes: ['FEMALE'], stage: 'LACTATING', age: [216, 599], value: lact, unit, note, from: `${t}, ${compound}, Lactating` });
  }
}
// ───────────── Table 4: calcium ─────────────
{
  const t = 'RDA for calcium';
  const rows: Array<[string, Sex[], LifeStage, Age, number, string?]> = [
    ['Infants 0 - 6 months, breast-fed', BOTH, 'NONE', [0, 5], 300, 'Breast-fed; 400 mg for formula-fed infants.'], ['Infants 7 - < 12 months', BOTH, 'NONE', [6, 11], 400],
    ['Children 1 - 3 years', BOTH, 'NONE', [12, 47], 500], ['Children 4 - 6 years', BOTH, 'NONE', [48, 83], 600], ['Children 7 - 9 years', BOTH, 'NONE', [84, 119], 700],
    ['Adolescents 10 - 18 years', BOTH, 'NONE', [120, 227], 1000], ['Adults 19 - 50 years', BOTH, 'NONE', [228, 611], 800], ['Adults 51 years and above', BOTH, 'NONE', [612, null], 1000],
    ['Pregnant', ['FEMALE'], 'PREGNANT', [216, 599], 1000], ['Breastfeeding', ['FEMALE'], 'LACTATING', [216, 599], 1000],
  ];
  for (const [label, sexes, stage, age, v, note] of rows) add({ compound: 'Calcium', sexes, stage, age, value: v, unit: 'mg', note, from: `${t}, ${label}` });
}
// ───────────── Tables 6-10: energy (average requirements, kcal/d) ─────────────
{
  const infants: Array<[string, Age, number, number]> = [
    ['1 month', [1, 1], 410, 370], ['2 months', [2, 2], 480, 430], ['3 months', [3, 3], 590, 540], ['4 months', [4, 4], 530, 480], ['5 months', [5, 5], 570, 520],
    ['6 months', [6, 6], 600, 560], ['7 months', [7, 7], 620, 570], ['8 months', [8, 8], 650, 590], ['9 months', [9, 9], 670, 620], ['10 months', [10, 10], 690, 630],
    ['11 months', [11, 11], 680, 640], ['12 months', [12, 12], 740, 640], ['1 year', [13, 23], 880, 810], ['2 years', [24, 35], 1080, 1000], ['3 years', [36, 47], 1160, 1070],
    ['4 years', [48, 59], 1310, 1190], ['5 years', [60, 71], 1440, 1320],
  ];
  const infNote = 'FAO/WHO/UNU 2004 equation and median Singapore weights.';
  for (const [label, age, m, f] of infants) {
    const note = label === '1 year' ? `${infNote} "12 months" is printed separately; "1 year" stored from 13 months.` : infNote;
    add({ compound: 'Energy', type: 'EER', sexes: ['MALE'], age, value: m, unit: 'kcal', note, from: `Energy, infants and young children, ${label}, male` });
    add({ compound: 'Energy', type: 'EER', sexes: ['FEMALE'], age, value: f, unit: 'kcal', note, from: `Energy, infants and young children, ${label}, female` });
  }
  const kids: Array<[number, number[], number[]]> = [
    [6, [1320, 1550, 1780], [1210, 1420, 1630]], [7, [1360, 1600, 1840], [1280, 1500, 1730]], [8, [1480, 1740, 2000], [1380, 1620, 1860]],
    [9, [1650, 1940, 2230], [1500, 1760, 2020]], [10, [1790, 2110, 2430], [1620, 1910, 2200]], [11, [1940, 2280, 2620], [1760, 2070, 2380]],
    [12, [2150, 2530, 2910], [1900, 2230, 2570]], [13, [2330, 2740, 3150], [1960, 2310, 2660]], [14, [2480, 2920, 3360], [2010, 2360, 2710]],
    [15, [2580, 3030, 3490], [2030, 2390, 2750]], [16, [2650, 3120, 3590], [2040, 2400, 2760]], [17, [2700, 3180, 3660], [2040, 2400, 2760]],
  ];
  const kidLevels: Array<[Activity, string]> = [['SEDENTARY', 'light'], ['MODERATE', 'moderate'], ['ACTIVE', 'vigorous']];
  for (const [y, m, f] of kids) {
    kidLevels.forEach(([activity, lvl], i) => {
      add({ compound: 'Energy', type: 'EER', sexes: ['MALE'], age: [y * 12, y * 12 + 11], value: m[i], unit: 'kcal', activity, note: `${lvl[0].toUpperCase() + lvl.slice(1)} physical activity.`, from: `Energy, children and adolescents, ${y} years, male, ${lvl}` });
      add({ compound: 'Energy', type: 'EER', sexes: ['FEMALE'], age: [y * 12, y * 12 + 11], value: f[i], unit: 'kcal', activity, note: `${lvl[0].toUpperCase() + lvl.slice(1)} physical activity.`, from: `Energy, children and adolescents, ${y} years, female, ${lvl}` });
    });
  }
  // "18 years" appears in the children's table; adults 18-29 start at 18 too. The adult table is used for 18+.
  const adults: Array<[string, Age, number[], number[]]> = [['18-29 years', [216, 359], [2280, 2700, 3720], [1745, 2070, 2840]], ['30-59 years', [360, 719], [2185, 2590, 3560], [1720, 2035, 2800]], ['> 60 years', [720, null], [1885, 2235, 3070], [1570, 1865, 2560]]];
  const adultLevels: Array<[Activity, string]> = [['SEDENTARY', 'low active'], ['MODERATE', 'moderate active'], ['VERY_ACTIVE', 'very active']];
  for (const [label, age, m, f] of adults) {
    adultLevels.forEach(([activity, lvl], i) => {
      add({ compound: 'Energy', type: 'EER', sexes: ['MALE'], age, value: m[i], unit: 'kcal', activity, note: `${lvl}.`, from: `Energy, adults, ${label}, male, ${lvl}` });
      add({ compound: 'Energy', type: 'EER', sexes: ['FEMALE'], age, value: f[i], unit: 'kcal', activity, note: `${lvl}.`, from: `Energy, adults, ${label}, female, ${lvl}` });
      if (age[0] < 600) {
        for (const [stage, inc, stLabel] of [['PREGNANT_T2', 370, '2nd trimester'], ['PREGNANT_T3', 480, '3rd trimester'], ['LACTATING', 500, 'lactation up to 12 months']] as const) {
          const band: Age = [age[0], Math.min(age[1] ?? 599, 599)];
          add({ compound: 'Energy', type: 'EER', sexes: ['FEMALE'], stage, age: band, value: f[i] + inc, unit: 'kcal', activity, note: `${lvl}. Printed as +${inc} kcal (${stLabel}); stored as total.`, from: `Energy, ${stLabel} +${inc} over women ${label}, ${lvl}` });
        }
      }
    });
  }
}

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths || (a.activityLevel ?? '').localeCompare(b.activityLevel ?? ''));
writeFileSync(path.join(process.cwd(), 'dv-sources', 'hpb-singapore', 'values.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${out.length} values to dv-sources/hpb-singapore/values.json`);
