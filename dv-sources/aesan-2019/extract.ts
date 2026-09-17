/**
 * AESAN "Ingestas Nutricionales de Referencia para la población española" (AESAN-2019-003)
 * -> values.json.
 *
 * Only the "Comité Científico AESAN (2019) — INR" column is Spain's own value. The FESNAD (2010)
 * and EFSA (2017) columns beside it are comparisons, and Tables 1-5 (energy, protein, fats,
 * carbohydrates, water) reproduce EFSA values already loaded under EU — none of those are stored.
 *
 * Tables 6a-6c and 7a-7d are PARSED from source/aesan-inr-2019.txt (pdftotext -layout): each row is
 * [age] [sex] [condition] then three columns per nutrient (INR, FESNAD, EFSA); the INR is taken.
 * Table 6d (vitamin K) has its own layout and is parsed separately.
 *
 * INR -> RDA. The report states INR is used both where the underlying value is a PRI/RDA and where
 * it is an AI (section 3), so AI-type INRs cannot be told apart: recorded as a known issue.
 *
 * Run: npx tsx dv-sources/aesan-2019/extract.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage } from '../../lib/dv/source-values';

const DIR = path.join(process.cwd(), 'dv-sources', 'aesan-2019');
const TEXT = readFileSync(path.join(DIR, 'source', 'aesan-inr-2019.txt'), 'utf8').split('\n');

const AGES: Array<[RegExp, [number, number | null], string]> = [
  [/^0-6 meses/, [0, 5], '0-6 meses'], [/^7-12 meses/, [6, 11], '7-12 meses'], [/^1-3 años/, [12, 47], '1-3 años'],
  [/^4-5 años/, [48, 71], '4-5 años'], [/^6-9 años/, [72, 119], '6-9 años'], [/^10-13 años/, [120, 167], '10-13 años'],
  [/^14-19 años/, [168, 239], '14-19 años'], [/^20-29 años/, [240, 359], '20-29 años'], [/^30-39 años/, [360, 479], '30-39 años'],
  [/^40-49 años/, [480, 599], '40-49 años'], [/^50-59 años/, [600, 719], '50-59 años'], [/^60-69 años/, [720, 839], '60-69 años'],
  [/^>70 años/, [840, null], '>70 años'],
];
const ADULT: [number, number | null] = [216, null];

interface Row { age: [number, number | null]; label: string; sexes: Sex[]; stage: LifeStage; nums: (number | null)[] }

/** Rows of the table starting at the line matching `title`, up to the next "Tabla". */
function rows(title: string, perRow: number): Row[] {
  const start = TEXT.findIndex((l) => l.includes(title));
  if (start < 0) throw new Error(`Table not found: ${title}`);
  const out: Row[] = [];
  let lastAge: { age: [number, number | null]; label: string } | null = null;
  for (let i = start + 1; i < TEXT.length && !/Tabla \d/.test(TEXT[i]); i++) {
    const line = TEXT[i].trim();
    let rest = line;
    const hit = AGES.find(([re]) => re.test(line));
    if (hit) { lastAge = { age: hit[1], label: hit[2] }; rest = line.replace(hit[0], '').trim(); }
    let tokens = rest.split(/\s+/);
    let sexes: Sex[]; let stage: LifeStage = 'NONE'; let age = lastAge?.age; let label = lastAge?.label;
    if (tokens[0] === '-' && tokens[1] === 'Mujer' && (tokens[2] === 'Embarazo' || tokens[2] === 'Lactancia')) {
      sexes = ['FEMALE']; stage = tokens[2] === 'Embarazo' ? 'PREGNANT' : 'LACTATING'; age = ADULT; label = tokens[2]; tokens = tokens.slice(3);
    } else if (hit && tokens[0] === '-' && tokens[1] === '-') {
      sexes = ['MALE', 'FEMALE']; tokens = tokens.slice(2);
    } else if ((tokens[0] === 'Hombre' || tokens[0] === 'Mujer') && tokens[1] === '-') {
      sexes = [tokens[0] === 'Hombre' ? 'MALE' : 'FEMALE']; tokens = tokens.slice(2);
      label = `${label} ${tokens.length ? (sexes[0] === 'MALE' ? 'Hombre' : 'Mujer') : ''}`.trim();
    } else continue;
    if (!age || !label) throw new Error(`${title}: row without age: "${line}"`);
    if (tokens.length !== perRow) throw new Error(`${title} ${label}: ${tokens.length} cells, expected ${perRow}: "${line}"`);
    const nums = tokens.map((t) => (t === '-' ? null : Number(t.replace(',', '.'))));
    if (nums.some((n) => n != null && Number.isNaN(n))) throw new Error(`${title} ${label}: bad number in "${line}"`);
    out.push({ age, label, sexes, stage, nums });
  }
  return out;
}

const out: SourceValue[] = [];
function table(title: string, nutrients: Array<{ compound: string; unit: string; note?: string } | null>) {
  for (const r of rows(title, nutrients.length * 3)) {
    nutrients.forEach((n, j) => {
      const v = r.nums[j * 3];
      if (!n || v == null) return;
      for (const sex of r.sexes) {
        out.push({
          compound: n.compound, valueType: 'RDA', sex, lifeStage: r.stage, ageMinMonths: r.age[0], ageMaxMonths: r.age[1],
          activityLevel: null, dietaryContext: null, value: v, valueMin: null, valueMax: null, unit: n.unit,
          isPercentOfEnergy: false, isProvisional: false, supplementalOnly: false,
          note: ['INR (covers both PRI/RDA- and AI-derived values).', n.note].filter(Boolean).join(' '),
          from: `${title}, ${n.compound}, ${r.label}`,
        });
      }
    });
  }
}

table('Tabla 6a. Ingestas Nutricionales de Referencia para vitaminas', [
  { compound: 'Vitamin A (RE)', unit: 'µg RE', note: 'As retinol equivalents, not RAE.' },
  { compound: 'Thiamin (B1)', unit: 'mg' }, { compound: 'Riboflavin (B2)', unit: 'mg' },
  { compound: 'Niacin (B3)', unit: 'mg NE', note: 'As niacin equivalents.' },
]);
table('Tabla 6b. Ingestas Nutricionales de Referencia para vitaminas', [
  { compound: 'Pantothenic Acid (B5)', unit: 'mg' }, { compound: 'Vitamin B6', unit: 'mg' },
  { compound: 'Folate (Total)', unit: 'µg DFE', note: 'As dietary folate equivalents.' }, { compound: 'Vitamin B12 (Total)', unit: 'µg' },
]);
table('Tabla 6c. Ingestas Nutricionales de Referencia para vitaminas', [
  { compound: 'Biotin (B7)', unit: 'µg' }, { compound: 'Vitamin C (Total)', unit: 'mg' },
  { compound: 'Vitamin D (Total)', unit: 'µg', note: 'Assuming minimal cutaneous vitamin D synthesis.' },
  { compound: 'Vitamin E (Total)', unit: 'mg', note: 'As α-tocopherol.' },
]);
table('Tabla 7a. Ingestas Nutricionales de Referencia para minerales', [
  { compound: 'Calcium', unit: 'mg' }, { compound: 'Chloride', unit: 'mg' }, { compound: 'Chromium', unit: 'µg' }, { compound: 'Copper', unit: 'mg' },
]);
table('Tabla 7b. Ingestas Nutricionales de Referencia para minerales', [
  { compound: 'Fluoride', unit: 'mg' }, { compound: 'Phosphorus', unit: 'mg' },
  { compound: 'Iron (Total)', unit: 'mg', note: 'Assumes a balanced mix of haem and non-haem iron.' }, { compound: 'Iodine', unit: 'µg' },
]);
table('Tabla 7c. Ingestas Nutricionales de Referencia para minerales', [
  { compound: 'Magnesium', unit: 'mg' }, { compound: 'Manganese', unit: 'mg' }, { compound: 'Molybdenum', unit: 'µg' }, { compound: 'Potassium', unit: 'mg' },
]);
table('Tabla 7d. Ingestas Nutricionales de Referencia para minerales', [
  { compound: 'Selenium', unit: 'µg' }, { compound: 'Sodium', unit: 'mg' },
  { compound: 'Zinc', unit: 'mg', note: 'Phytate intake estimated at 600 mg/d (mixed diet).' },
]);
// Tabla 6d (vitamin K): one nutrient, rows are spaced out; same [age][sex][condition] INR FESNAD EFSA shape.
table('Tabla 6d. Ingestas Nutricionales de Referencia para vitaminas', [{ compound: 'Vitamin K (Total)', unit: 'µg' }]);

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths);
writeFileSync(path.join(DIR, 'values.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${out.length} values to dv-sources/aesan-2019/values.json`);
