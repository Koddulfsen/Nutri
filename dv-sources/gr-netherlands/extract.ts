/**
 * Netherlands — Gezondheidsraad (Health Council of the Netherlands) dietary reference values for vitamins and minerals
 * -> values.json.
 *
 * Two advisory reports, transcribed 2026-09-17 from their text layers (pdftotext -layout) and checked against page
 * renders in source/:
 *   - Adults: "Voedingsnormen voor vitamines en mineralen voor volwassenen", nr. 2018/19 — Tabel 3 (p. 25, relatively
 *     strong evidence) and Tabel 4 (p. 26, adequate intakes with weak evidence, all adopted from EFSA).
 *   - Infants 7-11 months and children: "Voedingsnormen voor vitamines en mineralen voor zuigelingen en kinderen",
 *     nr. 2025/06 (erratum 9 Sept 2025; only footnote a of Tabellen 2-3 changed) — Tabel 2 (gemiddelde behoefte),
 *     Tabel 3 (aanbevolen hoeveelheid) and Tabel 4 (adequate inname), pp. 15-17.
 *
 * Mapping: gemiddelde behoefte -> EAR; aanbevolen hoeveelheid -> RDA; adequate inname -> AI.
 * The adult table's "Herkomst" (origin: EFSA, NCM 2014, GR 2003, GR 2000, GR 2012, dit rapport) is kept in each note, so
 * values adopted from EFSA or the Nordic Council can be recognised later.
 *
 * Decisions:
 *   - Adults are 18 y and older. Age-split rows as printed (B6 men 18-50 / >50; vitamin D 18-69 / >=70; calcium 18-24,
 *     men 25-69, women 25-49 and 50-69, >=70).
 *   - Iron, adult women: premenopausal (7 / 16 mg) stored; postmenopausal (6 / 11 mg) in the note. Girls 12-17 y:
 *     post-menarche values stored (EAR 7, RDA 13), pre-menarche (EAR 9, RDA 13) in the note. Girls 7-11 y who already
 *     menstruate follow 13 mg (footnote c), noted.
 *   - Thiamin and niacin per MJ (mg/MJ, mg NE/MJ), as the source prints them.
 *   - Vitamin A in µg RAE -> Vitamin A (RAE). Folate µg DFE. Vitamin K1 -> Vitamin K1 (Phylloquinone).
 *   - Manganese 7-11 months "0,2 - 0,5" stored as midpoint 0.35 with min/max.
 *
 * Not in these reports: infants under 7 months, pregnancy and lactation, upper levels, energy and macronutrients.
 *
 * Run: npx tsx dv-sources/gr-netherlands/extract.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
const out: SourceValue[] = [];
const BOTH: Sex[] = ['MALE', 'FEMALE'];
const M: Sex[] = ['MALE'];
const F: Sex[] = ['FEMALE'];

function push(compound: string, type: DvValueType, sexes: Sex[], age: Age, value: number, unit: string, from: string, note: string | null = null, range?: [number, number]) {
  for (const sex of sexes) out.push({
    compound, valueType: type, sex, lifeStage: 'NONE', ageMinMonths: age[0], ageMaxMonths: age[1], activityLevel: null, dietaryContext: null,
    value, valueMin: range ? range[0] : null, valueMax: range ? range[1] : null, unit, isPercentOfEnergy: false, isProvisional: false,
    supplementalOnly: false, note, from,
  });
}

// ── Adults, 2018/19 ──
const A = 'GR 2018/19';
const ADULT: Age = [216, null];
type AdultRow = [compound: string, unit: string, sexes: Sex[], age: Age, ear: number | null, rda: number | null, ai: number | null, origin: string, label: string, extra?: string];
const adults: AdultRow[] = [
  ['Vitamin A (RAE)', 'µg RAE', M, ADULT, 615, 800, null, 'dit rapport', 'Vitamine A, ♂'],
  ['Vitamin A (RAE)', 'µg RAE', F, ADULT, 525, 680, null, 'dit rapport', 'Vitamine A, ♀'],
  ['Thiamin (B1)', 'mg/MJ', BOTH, ADULT, 0.072, 0.1, null, 'EFSA', 'Thiamine', 'Per MJ of energy intake.'],
  ['Riboflavin (B2)', 'mg', BOTH, ADULT, 1.3, 1.6, null, 'EFSA', 'Riboflavine'],
  ['Niacin (B3)', 'mg NE/MJ', BOTH, ADULT, 1.3, 1.6, null, 'EFSA', 'Niacine', 'Per MJ of energy intake.'],
  ['Vitamin B6', 'mg', M, [216, 611], 1.1, 1.5, null, 'GR 2003', 'Vitamine B6, ♂ 18-50 jaar'],
  ['Vitamin B6', 'mg', M, [612, null], 1.3, 1.8, null, 'GR 2003', 'Vitamine B6, ♂ >50 jaar'],
  ['Vitamin B6', 'mg', F, ADULT, 1.1, 1.5, null, 'GR 2003', 'Vitamine B6, ♀'],
  ['Folate (Total)', 'µg DFE', BOTH, ADULT, 200, 300, null, 'GR 2003', 'Folaat',
    'Women wishing to conceive: additionally 400 µg/day folic acid supplement from at least 4 weeks before conception to week 8 of pregnancy.'],
  ['Vitamin B12 (Total)', 'µg', BOTH, ADULT, 2.0, 2.8, null, 'GR 2003', 'Vitamine B12'],
  ['Vitamin C (Total)', 'mg', M, ADULT, 60, 75, null, 'NCM 2014', 'Vitamine C, ♂'],
  ['Vitamin C (Total)', 'mg', F, ADULT, 50, 75, null, 'NCM 2014', 'Vitamine C, ♀'],
  ['Vitamin D (Total)', 'µg', BOTH, [216, 839], null, null, 10, 'GR 2012', 'Vitamine D, 18-69 jaar',
    'Assumes minimal skin synthesis. Supplement advice: 10 µg/day for adults without skin synthesis and all women 50-70 y.'],
  ['Vitamin D (Total)', 'µg', BOTH, [840, null], 10, 20, null, 'GR 2012', 'Vitamine D, ≥ 70 jaar',
    'Assumes minimal skin synthesis. Supplement advice: 20 µg/day for everyone over 70.'],
  ['Vitamin K1 (Phylloquinone)', 'µg', BOTH, ADULT, null, null, 70, 'EFSA', 'Vitamine K1'],
  ['Calcium', 'mg', BOTH, [216, 299], 860, 1000, null, 'EFSA', 'Calcium, 18-24 jaar'],
  ['Calcium', 'mg', M, [300, 839], 750, 950, null, 'EFSA', 'Calcium, ♂ 25-69 jaar'],
  ['Calcium', 'mg', F, [300, 599], 750, 950, null, 'EFSA', 'Calcium, ♀ 25-49 jaar'],
  ['Calcium', 'mg', F, [600, 839], null, null, 1100, 'GR 2000', 'Calcium, ♀ 50-69 jaar'],
  ['Calcium', 'mg', BOTH, [840, null], null, null, 1200, 'GR 2000', 'Calcium, ≥ 70 jaar'],
  ['Iron (Total)', 'mg', M, ADULT, 6, 11, null, 'EFSA', 'IJzer, ♂'],
  ['Iron (Total)', 'mg', F, ADULT, 7, 16, null, 'EFSA', 'IJzer, ♀ premenopauzaal', 'Premenopausal (stored). Postmenopausal women: EAR 6, RDA 11 mg/day.'],
  ['Iodine', 'µg', BOTH, ADULT, null, null, 150, 'EFSA', 'Jodium'],
  ['Potassium', 'mg', BOTH, ADULT, null, null, 3500, 'EFSA', 'Kalium', 'Printed as 3,5 g/dag.'],
  ['Copper', 'mg', BOTH, ADULT, 0.7, 0.9, null, 'NCM 2014', 'Koper', 'NCM 2014 values match IOM 2001.'],
  ['Magnesium', 'mg', M, ADULT, null, null, 350, 'EFSA', 'Magnesium, ♂'],
  ['Magnesium', 'mg', F, ADULT, null, null, 300, 'EFSA', 'Magnesium, ♀'],
  ['Zinc', 'mg', M, ADULT, 6.4, 9, null, 'NCM 2014', 'Zink, ♂'],
  ['Zinc', 'mg', F, ADULT, 5.7, 7, null, 'NCM 2014', 'Zink, ♀'],
  // Tabel 4 — adequate intakes with weak evidence, all from EFSA
  ['Pantothenic Acid (B5)', 'mg', BOTH, ADULT, null, null, 5, 'EFSA', 'Pantotheenzuur'],
  ['Vitamin E (Total)', 'mg', M, ADULT, null, null, 13, 'EFSA', 'Vitamine E, ♂'],
  ['Vitamin E (Total)', 'mg', F, ADULT, null, null, 11, 'EFSA', 'Vitamine E, ♀'],
  ['Biotin (B7)', 'µg', BOTH, ADULT, null, null, 40, 'EFSA', 'Biotine'],
  ['Choline (Total)', 'mg', BOTH, ADULT, null, null, 400, 'EFSA', 'Choline'],
  ['Phosphorus', 'mg', BOTH, ADULT, null, null, 550, 'EFSA', 'Fosfor'],
  ['Manganese', 'mg', BOTH, ADULT, null, null, 3, 'EFSA', 'Mangaan'],
  ['Molybdenum', 'µg', BOTH, ADULT, null, null, 65, 'EFSA', 'Molybdeen'],
  ['Selenium', 'µg', BOTH, ADULT, null, null, 70, 'EFSA', 'Selenium'],
];
for (const [compound, unit, sexes, age, ear, rda, ai, origin, label, extra] of adults) {
  const table = ai != null && ['EFSA'].includes(origin) && ear == null && ['Pantothenic Acid (B5)', 'Vitamin E (Total)', 'Biotin (B7)', 'Choline (Total)', 'Phosphorus', 'Manganese', 'Molybdenum', 'Selenium'].includes(compound) ? 'Tabel 4' : 'Tabel 3';
  const note = [`Origin: ${origin}.`, extra].filter(Boolean).join(' ');
  const from = `${A} ${table}, ${label}`;
  if (ear != null) push(compound, 'EAR', sexes, age, ear, unit, from, note);
  if (rda != null) push(compound, 'RDA', sexes, age, rda, unit, from, note);
  if (ai != null) push(compound, 'AI', sexes, age, ai, unit, from, note);
}

// ── Infants 7-11 months and children, 2025/06 ──
const K = 'GR 2025/06';
const B6: Age[] = [[7, 11], [12, 47], [48, 83], [84, 131], [132, 179], [180, 215]];
const LAB6 = ['7 t/m 11 maanden', '1 t/m 3 jaar', '4 t/m 6 jaar', '7 t/m 10 jaar', '11 t/m 14 jaar', '15 t/m 17 jaar'];
const num = (s: string) => { const v = Number(s.replace(',', '.')); if (Number.isNaN(v)) throw new Error(`number "${s}"`); return v; };

/** cells per band: "x" both sexes, "m/f" boys/girls, "-" not applicable, "a-b" a range. */
function band(table: string, type: DvValueType, compound: string, unit: string, cells: string, ages = B6, labels = LAB6, note: string | null = null) {
  const t = cells.trim().split(/\s+/);
  if (t.length !== ages.length) throw new Error(`${compound}: ${t.length} cells for ${ages.length} bands`);
  t.forEach((c, i) => {
    if (c === '-') return;
    const from = `${K} ${table}, ${compound}, ${labels[i]}`;
    if (c.includes('/')) {
      const [m, f] = c.split('/');
      push(compound, type, M, ages[i], num(m), unit, `${from}, jongens`, note);
      push(compound, type, F, ages[i], num(f), unit, `${from}, meisjes`, note);
    } else if (c.includes('-')) {
      const [lo, hi] = c.split('-').map(num);
      push(compound, type, BOTH, ages[i], (lo + hi) / 2, unit, from, note, [lo, hi]);
    } else push(compound, type, BOTH, ages[i], num(c), unit, from, note);
  });
}
const perMJ = 'Per MJ of energy intake.';
// Tabel 2 — gemiddelde behoefte
band('Tabel 2', 'EAR', 'Vitamin A (RAE)', 'µg RAE', '195 220 250 320 480/475 580/490');
band('Tabel 2', 'EAR', 'Thiamin (B1)', 'mg/MJ', '0,072 0,072 0,072 0,072 0,072 0,072', B6, LAB6, perMJ);
band('Tabel 2', 'EAR', 'Niacin (B3)', 'mg NE/MJ', '1,3 1,3 1,3 1,3 1,3 1,3', B6, LAB6, perMJ);
band('Tabel 2', 'EAR', 'Calcium', 'mg', '- 390 680 670 940 970');
band('Tabel 2', 'EAR', 'Zinc', 'mg', '2,5 3,6 4,6 6,2 8,7/8,5 11,5/9,8');
// Tabel 3 — aanbevolen hoeveelheid
band('Tabel 3', 'RDA', 'Vitamin A (RAE)', 'µg RAE', '250 285 325 415 625/620 750/635');
band('Tabel 3', 'RDA', 'Thiamin (B1)', 'mg/MJ', '0,1 0,1 0,1 0,1 0,1 0,1', B6, LAB6, perMJ);
band('Tabel 3', 'RDA', 'Niacin (B3)', 'mg NE/MJ', '1,6 1,6 1,6 1,6 1,6 1,6', B6, LAB6, perMJ);
band('Tabel 3', 'RDA', 'Calcium', 'mg', '- 450 800 800 1100 1150');
band('Tabel 3', 'RDA', 'Zinc', 'mg', '3,0 4,4 5,6 7,4 10,4/10,2 13,8/11,8');
// Iron (own bands)
const FE: Age[] = [[7, 11], [12, 47], [48, 83], [84, 143]];
const FEL = ['7 t/m 11 maanden', '1 t/m 3 jaar', '4 t/m 6 jaar', '7 t/m 11 jaar'];
band('Tabel 2', 'EAR', 'Iron (Total)', 'mg', '8 5 5 8', FE, FEL);
band('Tabel 3', 'RDA', 'Iron (Total)', 'mg', '11 8 7 -', FE, FEL);
push('Iron (Total)', 'RDA', M, [84, 143], 11, 'mg', `${K} Tabel 3, Iron (Total), 7 t/m 11 jaar, jongens`);
push('Iron (Total)', 'RDA', F, [84, 143], 11, 'mg', `${K} Tabel 3, Iron (Total), 7 t/m 11 jaar, meisjes voor menarche`,
  'Before menarche (stored). Girls 7-11 y who already menstruate: 13 mg/day (footnote c).');
push('Iron (Total)', 'EAR', M, [144, 215], 8, 'mg', `${K} Tabel 2, Iron (Total), 12 t/m 17 jaar, jongens`);
push('Iron (Total)', 'RDA', M, [144, 215], 11, 'mg', `${K} Tabel 3, Iron (Total), 12 t/m 17 jaar, jongens`);
const girlsFe = 'After menarche (stored). Before menarche: EAR 9, RDA 13 mg/day (lower absorption assumed, 10% vs 16%). The EAR for girls from 12 y should not be used for monitoring (footnote d).';
push('Iron (Total)', 'EAR', F, [144, 215], 7, 'mg', `${K} Tabel 2, Iron (Total), 12 t/m 17 jaar, meisjes na menarche`, girlsFe);
push('Iron (Total)', 'RDA', F, [144, 215], 13, 'mg', `${K} Tabel 3, Iron (Total), 12 t/m 17 jaar, meisjes na menarche`,
  `${girlsFe} The post-menarche RDA is the mean of the calculated 10.1 mg and the adult premenopausal 16 mg (footnote e).`);
// Tabel 4 — adequate inname
band('Tabel 4', 'AI', 'Riboflavin (B2)', 'mg', '0,4 0,5 0,6 0,9 1,2 1,5');
band('Tabel 4', 'AI', 'Pantothenic Acid (B5)', 'mg', '3 4 4 4 5 5');
band('Tabel 4', 'AI', 'Vitamin B6', 'mg', '0,3 0,5 0,6 0,9 1,2 1,4');
band('Tabel 4', 'AI', 'Biotin (B7)', 'µg', '6 20 25 25 35 35');
band('Tabel 4', 'AI', 'Choline (Total)', 'mg', '160 140 160 230 310 380');
band('Tabel 4', 'AI', 'Folate (Total)', 'µg DFE', '90 100 120 170 230 280');
band('Tabel 4', 'AI', 'Vitamin B12 (Total)', 'µg', '0,9 1,0 1,1 1,6 2,2 2,6');
band('Tabel 4', 'AI', 'Vitamin C (Total)', 'mg', '20 20 20 30 45 65/55');
band('Tabel 4', 'AI', 'Vitamin D (Total)', 'µg', '10 10 10 10 10 10');
band('Tabel 4', 'AI', 'Vitamin K1 (Phylloquinone)', 'µg', '10 15 20 30 45 60');
band('Tabel 4', 'AI', 'Calcium', 'mg', '315 - - - - -');
band('Tabel 4', 'AI', 'Phosphorus', 'mg', '170 250 440 440 610 630');
band('Tabel 4', 'AI', 'Iodine', 'µg', '70 90 90 90 120 130');
band('Tabel 4', 'AI', 'Potassium', 'mg', '700 800 1000 1600 2400 3200');
band('Tabel 4', 'AI', 'Copper', 'mg', '0,4 0,4 0,4 0,5 0,7 0,9');
band('Tabel 4', 'AI', 'Manganese', 'mg', '0,2-0,5 0,5 1 1 2 2,5');
band('Tabel 4', 'AI', 'Molybdenum', 'µg', '10 10 20 25 40 55');
band('Tabel 4', 'AI', 'Selenium', 'µg', '20 20 20 35 50 65');
const B4: Age[] = [[7, 11], [12, 35], [36, 119], [120, 215]];
const B4L = ['7 t/m 11 maanden', '1 t/m 2 jaar', '3 t/m 9 jaar', '10 t/m 17 jaar'];
band('Tabel 4', 'AI', 'Vitamin E (Total)', 'mg', '5 6 9 13/11', B4, B4L, 'Alpha-tocopherol.');
band('Tabel 4', 'AI', 'Magnesium', 'mg', '80 170 230 300/250', B4, B4L);

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths);
writeFileSync(path.join(process.cwd(), 'dv-sources', 'gr-netherlands', 'values.json'), JSON.stringify(out, null, 1) + '\n');
const byType: Record<string, number> = {};
for (const v of out) byType[v.valueType] = (byType[v.valueType] ?? 0) + 1;
console.log(`Wrote ${out.length} values to dv-sources/gr-netherlands/values.json`, byType);
