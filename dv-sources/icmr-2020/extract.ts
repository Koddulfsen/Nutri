/**
 * ICMR-NIN "A Brief Note on Nutrient Requirements for Indians, the RDA and the EAR" (2020)
 * -> values.json.
 *
 * Transcribed cell by cell, 2026-09-14, from brief-note.pdf (text snapshot in source/): Tables 1a/1b
 * (energy), 2a (protein) and 3/4 (adult micronutrients). Only the "RDA 2020" and "EAR 2020" columns are
 * ICMR-NIN 2020 values; the RDA 2010 and IOM columns are comparisons and are not stored.
 *
 * Mapping decisions:
 *   - Adults: the brief note gives no ages for "adult men / women"; stored from 18 y with no upper bound.
 *   - Energy work categories: sedentary -> SEDENTARY, moderate -> MODERATE, heavy -> VERY_ACTIVE.
 *     Children's energy is computed at moderate activity (Table 1b footnote c); one value, no level set.
 *   - Pregnancy / lactation are printed as "+x"; stored as totals over the adult woman's value
 *     (energy per work category). Protein pregnancy increments are printed for 2nd and 3rd trimesters.
 *   - Protein is stored in g/d as printed (Table 2a gives both g/kg and g/d at reference weights).
 *   - Vitamin D is printed in IU and stored in µg (1 µg = 40 IU by definition); vitamin A, niacin and
 *     folate units as printed.
 *
 * Source inconsistency: energy for children 1-3 y is 1070 kcal in Table 1a but 1110 in Table 1b; Table
 * 1b's own 83 kcal/kg × 12.9 kg = 1071, so 1070 is stored.
 *
 * Not stored: the n-6 / n-3 PUFA amounts (6.6 g / 2.2 g) are given without a population group.
 *
 * Run: npx tsx dv-sources/icmr-2020/extract.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage, Activity } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
const out: SourceValue[] = [];
const ADULT: Age = [216, null];
const BOTH: Sex[] = ['MALE', 'FEMALE'];
const r4 = (x: number) => Number(x.toFixed(4));
const adultNote = 'Adult (the brief note gives no age range).';

function add(p: { compound: string; type: DvValueType; sexes: Sex[]; stage?: LifeStage; age: Age; value: number; unit: string; activity?: Activity | null; note?: string | null; from: string }) {
  for (const sex of p.sexes) {
    out.push({
      compound: p.compound, valueType: p.type, sex, lifeStage: p.stage ?? 'NONE', ageMinMonths: p.age[0], ageMaxMonths: p.age[1],
      activityLevel: p.activity ?? null, dietaryContext: null, value: p.value, valueMin: null, valueMax: null, unit: p.unit,
      isPercentOfEnergy: false, isProvisional: false, supplementalOnly: false, note: p.note ?? null, from: p.from,
    });
  }
}

// ───────────── Tables 1a / 1b: energy (kcal/d) ─────────────
{
  const t = 'Table 1a/1b energy';
  const work: Array<[string, Activity, number, number]> = [['Sedentary work', 'SEDENTARY', 2110, 1660], ['Moderate work', 'MODERATE', 2710, 2130], ['Heavy work', 'VERY_ACTIVE', 3470, 2720]];
  for (const [label, activity, men, women] of work) {
    add({ compound: 'Energy', type: 'EER', sexes: ['MALE'], age: ADULT, value: men, unit: 'kcal', activity, note: `${label}; reference weight 65 kg. ${adultNote}`, from: `${t}, Adult men, ${label}` });
    add({ compound: 'Energy', type: 'EER', sexes: ['FEMALE'], age: ADULT, value: women, unit: 'kcal', activity, note: `${label}; reference weight 55 kg. ${adultNote}`, from: `${t}, Adult women, ${label}` });
    for (const [stage, inc, stageLabel] of [['PREGNANT', 350, 'Pregnant'], ['LACTATING_0_6M', 600, 'Lactating (0-6m)'], ['LACTATING_7_12M', 520, 'Lactating (7-12m)']] as const) {
      add({ compound: 'Energy', type: 'EER', sexes: ['FEMALE'], stage, age: ADULT, value: women + inc, unit: 'kcal', activity,
        note: `${label}. Printed as +${inc} kcal over adult women; stored as total. Adjust for actual body weight, gestational weight gain and activity.`, from: `${t}, ${stageLabel} +${inc} over ${label}` });
    }
  }
  const kids: Array<[string, Sex[], Age, number, string?]> = [
    ['Infants 0-6 months', BOTH, [0, 5], 530], ['Infants 6-12 months', BOTH, [6, 11], 660],
    ['Children 1-3 y', BOTH, [12, 47], 1070, 'Table 1a prints 1070, Table 1b 1110; Table 1b\'s 83 kcal/kg × 12.9 kg = 1071.'],
    ['Children 4-6 y', BOTH, [48, 83], 1360], ['Children 7-9 y', BOTH, [84, 119], 1700],
    ['Boys 10-12 y', ['MALE'], [120, 155], 2220], ['Girls 10-12 y', ['FEMALE'], [120, 155], 2060],
    ['Boys 13-15 y', ['MALE'], [156, 191], 2860], ['Girls 13-15 y', ['FEMALE'], [156, 191], 2400],
    ['Boys 16-18 y', ['MALE'], [192, 227], 3320], ['Girls 16-18 y', ['FEMALE'], [192, 227], 2500],
  ];
  for (const [label, sexes, age, v, extra] of kids) {
    const note = [age[0] >= 12 ? 'Reference children with moderate daily physical activity.' : null, extra].filter(Boolean).join(' ') || null;
    add({ compound: 'Energy', type: 'EER', sexes, age, value: v, unit: 'kcal', note, from: `${t}, ${label}` });
  }
}

// ───────────── Table 2a: protein (g/d) ─────────────
{
  const t = 'Table 2a protein';
  const lowQuality = 'For cereal-based diets with low-quality protein, 1 g/kg per day.';
  const rows: Array<[string, Sex[], Age, number, number, string?]> = [
    ['Adult men (65 kg)', ['MALE'], ADULT, 42.9, 54.0, adultNote], ['Adult women (55 kg)', ['FEMALE'], ADULT, 36.3, 45.7, adultNote],
    ['Infants 0-6 months', BOTH, [0, 5], 6.7, 8.1], ['Infants 6-12 months', BOTH, [6, 11], 8.8, 10.5],
    ['Children 1-3y', BOTH, [12, 47], 10.2, 12.5], ['Children 4-6y', BOTH, [48, 83], 12.8, 15.9], ['Children 7-9y', BOTH, [84, 119], 19.0, 23.3],
    ['Boys 10-12y', ['MALE'], [120, 155], 26.2, 31.8], ['Girls 10-12y', ['FEMALE'], [120, 155], 26.6, 32.8],
    ['Boys 13-15y', ['MALE'], [156, 191], 36.4, 44.9], ['Girls 13-15y', ['FEMALE'], [156, 191], 34.7, 43.2],
    ['Boys 16-18y', ['MALE'], [192, 227], 45.1, 55.4], ['Girls 16-18y', ['FEMALE'], [192, 227], 37.3, 46.2],
  ];
  for (const [label, sexes, age, ear, rda, extra] of rows) {
    const note = [lowQuality, extra].filter(Boolean).join(' ');
    add({ compound: 'Protein', type: 'EAR', sexes, age, value: ear, unit: 'g', note, from: `${t}, ${label}, EAR` });
    add({ compound: 'Protein', type: 'RDA', sexes, age, value: rda, unit: 'g', note, from: `${t}, ${label}, RDA` });
  }
  const inc: Array<[LifeStage, string, number, number]> = [['PREGNANT_T2', '2nd trimester', 7.6, 9.5], ['PREGNANT_T3', '3rd trimester', 17.6, 22.0], ['LACTATING_0_6M', 'Lactating 0-6 months', 13.6, 16.9], ['LACTATING_7_12M', 'Lactating 6-12 months', 10.6, 13.2]];
  for (const [stage, label, ear, rda] of inc) {
    add({ compound: 'Protein', type: 'EAR', sexes: ['FEMALE'], stage, age: ADULT, value: r4(36.3 + ear), unit: 'g', note: `Printed as +${ear} g over adult women; stored as total.`, from: `${t}, ${label}, EAR +${ear}` });
    add({ compound: 'Protein', type: 'RDA', sexes: ['FEMALE'], stage, age: ADULT, value: r4(45.7 + rda), unit: 'g', note: `Printed as +${rda} g over adult women; stored as total.`, from: `${t}, ${label}, RDA +${rda}` });
  }
}

// ───────────── Tables 3 (males) / 4 (females): adult micronutrients, RDA 2020 and EAR 2020 ─────────────
{
  const rows: Array<[string, string, [number, number], [number, number], string?]> = [
    // [compound, unit, [male RDA, EAR], [female RDA, EAR], note]
    ['Calcium', 'mg', [1000, 800], [1000, 800]],
    ['Magnesium', 'mg', [440, 370], [370, 310]],
    ['Iron (Total)', 'mg', [19, 11], [29, 15]],
    ['Zinc', 'mg', [17, 14], [13.0, 11]],
    ['Iodine', 'µg', [150, 95], [150, 95]],
    ['Thiamin (B1)', 'mg', [1.8, 1.5], [1.7, 1.4]],
    ['Riboflavin (B2)', 'mg', [2.5, 2.1], [2.4, 2.0]],
    ['Niacin (B3)', 'mg', [18, 15], [14, 12]],
    ['Vitamin B6', 'mg', [2.4, 2.1], [1.9, 1.6]],
    ['Folate (Total)', 'µg DFE', [300, 250], [220, 180]],
    ['Vitamin B12 (Total)', 'µg', [2.2, 2], [2.2, 2]],
    ['Vitamin C (Total)', 'mg', [80, 65], [65, 55]],
    ['Vitamin A (RAE)', 'µg', [1000, 460], [840, 390], 'Printed as µg; the brief note does not state the retinol-equivalent basis.'],
    ['Vitamin D (Total)', 'µg', [15, 10], [15, 10], 'Printed as 600 IU (RDA) / 400 IU (EAR); 1 µg = 40 IU.'],
  ];
  for (const [compound, unit, male, female, extra] of rows) {
    for (const [sex, [rda, ear], table] of [['MALE', male, 'Table 3 (Males)'], ['FEMALE', female, 'Table 4 (Females)']] as const) {
      const note = [adultNote, extra].filter(Boolean).join(' ');
      add({ compound, type: 'RDA', sexes: [sex], age: ADULT, value: rda, unit, note, from: `${table}, ${compound}, RDA 2020` });
      add({ compound, type: 'EAR', sexes: [sex], age: ADULT, value: ear, unit, note, from: `${table}, ${compound}, EAR 2020` });
    }
  }
}

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths || (a.activityLevel ?? '').localeCompare(b.activityLevel ?? ''));
writeFileSync(path.join(process.cwd(), 'dv-sources', 'icmr-2020', 'values.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${out.length} values to dv-sources/icmr-2020/values.json`);
