/**
 * NIH / National Academies DRI summary tables -> values.json.
 *
 * Source: Appendix J, "Dietary Reference Intakes Summary Tables", in Dietary Reference
 * Intakes for Sodium and Potassium (2019), NCBI Bookshelf NBK545442. The nine tables are
 * snapshotted in ./source/tabN.html (fetched 2026-09-14) and parsed here — no value is
 * retyped by hand. Reviewed by hand: the column -> compound/unit mapping and row labels.
 *
 * RDA vs AI: the tables mark AIs with "*" (RDAs are bold, which the HTML does not
 * reliably carry), so a value without "*" in an RDA/AI table is an RDA.
 *
 * Run: npx tsx dv-sources/nih-dri/extract.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

const DIR = path.join(process.cwd(), 'dv-sources', 'nih-dri');

function decode(s: string): string {
  return s.replace(/&nbsp;| /g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
}

/** Table -> rows of cell text. Superscripts become "^x" so footnote markers never merge into numbers. */
function grid(file: string): string[][] {
  const s = readFileSync(path.join(DIR, 'source', file), 'utf8');
  const t = s.slice(s.indexOf('<table'), s.lastIndexOf('</table>'));
  return [...t.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) =>
    [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) =>
      decode(c[1].replace(/<sup>([\s\S]*?)<\/sup>/g, (_, x) => '^' + x.replace(/<[^>]+>/g, '')).replace(/<[^>]+>/g, ''))
        .replace(/\s+/g, ' ').trim()));
}

interface Parsed { value: number; ai: boolean }
/** "2,000*^a" -> { value: 2000, ai: true }. "ND", "" -> null. A trailing footnote letter without "^" ("400j") is dropped. */
function parse(cell: string): Parsed | null {
  const c = cell.replace(/\^[a-z,]+/gi, '').replace(/\*\*/g, '').trim();
  if (c === '' || /^ND/.test(c)) return null;
  const ai = c.includes('*');
  const m = c.replace(/\*/g, '').replace(/[a-z]$/i, '').replace(/[, ]/g, '').match(/^\d+(\.\d+)?$/);
  if (!m) throw new Error(`Unparseable cell "${cell}"`);
  return { value: Number(m[0]), ai };
}

const SECTION: Record<string, { sexes: Sex[]; lifeStage: LifeStage }> = {
  Infants: { sexes: ['MALE', 'FEMALE'], lifeStage: 'NONE' },
  Children: { sexes: ['MALE', 'FEMALE'], lifeStage: 'NONE' },
  Males: { sexes: ['MALE'], lifeStage: 'NONE' },
  Females: { sexes: ['FEMALE'], lifeStage: 'NONE' },
  Pregnancy: { sexes: ['FEMALE'], lifeStage: 'PREGNANT' },
  Lactation: { sexes: ['FEMALE'], lifeStage: 'LACTATING' },
};
/** Life-stage group label -> inclusive months. Infants are 0–5.9 and 6–11.9 months (table footnote). */
const AGES: Record<string, [number, number | null]> = {
  '0–6 mo': [0, 5], '7–12 mo': [6, 11], '1–3 y': [12, 47], '4–8 y': [48, 107], '9–13 y': [108, 167],
  '14–18 y': [168, 227], '19–30 y': [228, 371], '31–50 y': [372, 611], '31−50 y': [372, 611],
  '51–70 y': [612, 851], '> 70 y': [852, null],
};

interface Column { compound: string; unit: string; note?: string; isPercentOfEnergy?: boolean; supplementalOnly?: boolean }
const out: SourceValue[] = [];

/** A life-stage table: header row, then section rows ("Males") and group rows ("19–30 y"). */
function lifeStageTable(file: string, tableName: string, columns: Record<string, Column | null>, types: { plain: DvValueType; asterisk?: DvValueType }) {
  const rows = grid(file);
  const header = rows[0];
  let section: (typeof SECTION)[string] | null = null;
  for (const row of rows.slice(1)) {
    if (row.length === 1) { section = SECTION[row[0]] ?? null; if (!section) throw new Error(`${file}: unknown section ${row[0]}`); continue; }
    const label = row[0];
    // tab1 repeats "Children" as a full-width row of empty cells.
    if (SECTION[label] && row.slice(1).every((c) => c === '')) { section = SECTION[label]; continue; }
    const ages = AGES[label];
    if (!section || !ages) throw new Error(`${file}: unplaced row "${label}"`);
    header.slice(1).forEach((h, i) => {
      if (!(h in columns)) throw new Error(`${file}: unmapped column "${h}"`);
      const col = columns[h];
      if (!col) return;
      const p = parse(row[i + 1]);
      if (!p) return;
      if (p.ai && !types.asterisk) throw new Error(`${file}: "*" in a ${types.plain} table at ${label} / ${h}`);
      for (const sex of section!.sexes) {
        out.push({
          compound: col.compound, valueType: p.ai ? types.asterisk! : types.plain, sex, lifeStage: section!.lifeStage,
          ageMinMonths: ages[0], ageMaxMonths: ages[1], activityLevel: null, dietaryContext: null,
          value: p.value, valueMin: null, valueMax: null, unit: col.unit, isPercentOfEnergy: col.isPercentOfEnergy ?? false,
          isProvisional: false, supplementalOnly: col.supplementalOnly ?? false, note: col.note ?? null, from: `${tableName}, ${h}, ${label}`,
        });
      }
    });
  }
}

const RDA_AI = { plain: 'RDA' as DvValueType, asterisk: 'AI' as DvValueType };

// J-1 Estimated Average Requirements
lifeStageTable('tab1.html', 'Table J-1 EAR', {
  'Calcium (mg/d)': { compound: 'Calcium', unit: 'mg' },
  'CHO (g/d)': { compound: 'Carbohydrates', unit: 'g' },
  // Per kg body weight: not storable as g/d without a reference weight. The g/d RDA is in J-4.
  'Protein (g/kg/d)': null,
  'Vitamin A (Rg/d)^a': { compound: 'Vitamin A (RAE)', unit: 'µg RAE' },
  'Vitamin C (mg/d)': { compound: 'Vitamin C (Total)', unit: 'mg' },
  'Vitamin D (Rg/d)': { compound: 'Vitamin D (Total)', unit: 'µg' },
  'Vitamin E (mg/d)^b': { compound: 'Vitamin E (Total)', unit: 'mg', note: 'As α-tocopherol (2R-stereoisomeric forms).' },
  'Thiamin (mg/d)': { compound: 'Thiamin (B1)', unit: 'mg' },
  'Riboflavin (mg/d)': { compound: 'Riboflavin (B2)', unit: 'mg' },
  'Niacin (mg/d)^c': { compound: 'Niacin (B3)', unit: 'mg NE' },
  'Vitamin B6 (mg/d)': { compound: 'Vitamin B6', unit: 'mg' },
  'Folate (Rg/d)^d': { compound: 'Folate (Total)', unit: 'µg DFE' },
  'Vitamin B12 (Rg/d)': { compound: 'Vitamin B12 (Total)', unit: 'µg' },
  'Copper (Rg/d)': { compound: 'Copper', unit: 'µg' },
  'Iodine (Rg/d)': { compound: 'Iodine', unit: 'µg' },
  'Iron (mg/d)': { compound: 'Iron (Total)', unit: 'mg' },
  'Magnesium (mg/d)': { compound: 'Magnesium', unit: 'mg' },
  'Molybdenum (Rg/d)': { compound: 'Molybdenum', unit: 'µg' },
  'Phosphorus (mg/d)': { compound: 'Phosphorus', unit: 'mg' },
  'Selenium (Rg/d)': { compound: 'Selenium', unit: 'µg' },
  'Zinc (mg/d)': { compound: 'Zinc', unit: 'mg' },
}, { plain: 'EAR' });

// J-2 RDA/AI, vitamins
lifeStageTable('tab2.html', 'Table J-2 RDA/AI vitamins', {
  'Vitamin A (μg/d)^a': { compound: 'Vitamin A (RAE)', unit: 'µg RAE' },
  'Vitamin C (mg/d)': { compound: 'Vitamin C (Total)', unit: 'mg' },
  'Vitamin D (μg/d)^b,c': { compound: 'Vitamin D (Total)', unit: 'µg', note: 'As cholecalciferol, assuming minimal sunlight.' },
  'Vitamin E (mg/d)^d': { compound: 'Vitamin E (Total)', unit: 'mg', note: 'As α-tocopherol (2R-stereoisomeric forms).' },
  'Vitamin K (μg/d)': { compound: 'Vitamin K (Total)', unit: 'µg' },
  'Thiamin (mg/d)': { compound: 'Thiamin (B1)', unit: 'mg' },
  'Riboflavin (mg/d)': { compound: 'Riboflavin (B2)', unit: 'mg' },
  'Niacin (mg/d)^e': { compound: 'Niacin (B3)', unit: 'mg NE', note: 'As niacin equivalents; 0–6 months preformed niacin.' },
  'Vitamin B6 (mg/d)': { compound: 'Vitamin B6', unit: 'mg' },
  'Folate (μg/d)^f': { compound: 'Folate (Total)', unit: 'µg DFE' },
  'Vitamin B12 (μg/d)': { compound: 'Vitamin B12 (Total)', unit: 'µg' },
  'Pantothenic Acid (mg/d)': { compound: 'Pantothenic Acid (B5)', unit: 'mg' },
  'Biotin (μg/d)': { compound: 'Biotin (B7)', unit: 'µg' },
  'Choline (mg/d)^g': { compound: 'Choline (Total)', unit: 'mg' },
}, RDA_AI);

// J-3 RDA/AI, elements
lifeStageTable('tab3.html', 'Table J-3 RDA/AI elements', {
  'Calcium (mg/d)': { compound: 'Calcium', unit: 'mg' },
  'Chromium (μg/d)': { compound: 'Chromium', unit: 'µg' },
  'Copper (μg/d)': { compound: 'Copper', unit: 'µg' },
  'Fluoride (mg/d)': { compound: 'Fluoride', unit: 'mg' },
  'Iodine (μg/d)': { compound: 'Iodine', unit: 'µg' },
  'Iron (mg/d)': { compound: 'Iron (Total)', unit: 'mg' },
  'Magnesium (mg/d)': { compound: 'Magnesium', unit: 'mg' },
  'Manganese (mg/d)': { compound: 'Manganese', unit: 'mg' },
  'Molybdenum (μg/d)': { compound: 'Molybdenum', unit: 'µg' },
  'Phosphorus (mg/d)': { compound: 'Phosphorus', unit: 'mg' },
  'Selenium (μg/d)': { compound: 'Selenium', unit: 'µg' },
  'Zinc (mg/d)': { compound: 'Zinc', unit: 'mg' },
  'Potassium (mg/d)': { compound: 'Potassium', unit: 'mg' },
  'Sodium (mg/d)': { compound: 'Sodium', unit: 'mg' },
  'Chloride (g/d)': { compound: 'Chloride', unit: 'g' },
}, RDA_AI);

// J-4 RDA/AI, total water and macronutrients
lifeStageTable('tab4.html', 'Table J-4 RDA/AI water and macronutrients', {
  'Total Water^a (L/d)': { compound: 'Water', unit: 'L', note: 'Total water: food, beverages and drinking water.' },
  'Carbohydrate (g/d)': { compound: 'Carbohydrates', unit: 'g' },
  'Total Fiber (g/d)': { compound: 'Dietary Fiber', unit: 'g' },
  'Fat (g/d)': { compound: 'Total Fat', unit: 'g' },
  'Linoleic Acid (g/d)': { compound: 'Linoleic Acid', unit: 'g' },
  'α-Linolenic Acid (g/d)': { compound: 'Alpha-Linolenic Acid (ALA)', unit: 'g' },
  'Protein^b (g/d)': { compound: 'Protein', unit: 'g', note: 'From g/kg at the reference body weight (adults 0.8 g/kg).' },
}, RDA_AI);

// J-8 UL, vitamins
lifeStageTable('tab8.html', 'Table J-8 UL vitamins', {
  'Vitamin A (μg/d)^a': { compound: 'Retinol', unit: 'µg', note: 'As preformed vitamin A only.' },
  'Vitamin C (mg/d)': { compound: 'Vitamin C (Total)', unit: 'mg' },
  'Vitamin D (Rg/d)': { compound: 'Vitamin D (Total)', unit: 'µg' },
  'Vitamin E (mg/d)^b,c': { compound: 'Vitamin E (Total)', unit: 'mg', supplementalOnly: true, note: 'Any form of supplemental α-tocopherol; synthetic forms from supplements/fortified foods.' },
  'Vitamin K': null, 'Thiamin': null, 'Riboflavin': null,
  'Niacin (mg/d)^c': { compound: 'Niacin (B3)', unit: 'mg', supplementalOnly: true, note: 'Synthetic forms from supplements and/or fortified foods.' },
  'Vitamin B6 (mg/d)': { compound: 'Vitamin B6', unit: 'mg' },
  'Folate (Rg/d)^c': { compound: 'Folic Acid (Synthetic)', unit: 'µg', supplementalOnly: true, note: 'Synthetic forms from supplements and/or fortified foods.' },
  'Vitamin B12': null, 'Pantothenic Acid': null, 'Biotin': null,
  'Choline (g/d)': { compound: 'Choline (Total)', unit: 'g' },
  'Carotenoids^d': null,
}, { plain: 'UL' });

// J-9 UL, elements
lifeStageTable('tab9.html', 'Table J-9 UL elements', {
  'Arsenic^a': null,
  'Boron (mg/d)': { compound: 'Boron', unit: 'mg' },
  'Calcium (mg/d)': { compound: 'Calcium', unit: 'mg' },
  'Chromium': null,
  'Copper (μg/d)': { compound: 'Copper', unit: 'µg' },
  'Fluoride (mg/d)': { compound: 'Fluoride', unit: 'mg' },
  'Iodine (μg/d)': { compound: 'Iodine', unit: 'µg' },
  'Iron (mg/d)': { compound: 'Iron (Total)', unit: 'mg' },
  'Magnesium (mg/d)^b': { compound: 'Magnesium', unit: 'mg', supplementalOnly: true, note: 'From pharmacological agents only; excludes food and water.' },
  'Manganese (mg/d)': { compound: 'Manganese', unit: 'mg' },
  'Molybdenum (μg/d)': { compound: 'Molybdenum', unit: 'µg' },
  'Nickel (mg/d)': { compound: 'Nickel', unit: 'mg', note: 'As soluble nickel salts.' },
  'Phosphorus (g/d)': { compound: 'Phosphorus', unit: 'g' },
  'Potassium': null,
  'Selenium (μg/d)': { compound: 'Selenium', unit: 'µg' },
  'Silicon^c': null, 'Sulfate': null,
  // Nutri has no vanadium compound.
  'Vanadium (mg/d)^d': null,
  'Zinc (mg/d)': { compound: 'Zinc', unit: 'mg' },
  'Sodium^e': null,
  'Chloride (g/d)': { compound: 'Chloride', unit: 'g' },
}, { plain: 'UL' });

// J-5 AMDR (percent of energy), both sexes, no pregnancy/lactation rows
{
  const rows = grid('tab5.html');
  const groups: Array<[string, [number, number | null]]> = [['Children, 1–3 y', [12, 47]], ['Children, 4–18 y', [48, 227]], ['Adults', [228, null]]];
  if (rows[1].join('|') !== 'Children,1–3 y|Children,4–18 y|Adults') throw new Error(`J-5 header changed: ${rows[1].join('|')}`);
  const COMPOUND: Record<string, { compound: string; note?: string }> = {
    'Fat': { compound: 'Total Fat' },
    'n-6 polyunsaturated fatty acids^a (linoleic acid)': { compound: 'Linoleic Acid', note: 'n-6 PUFA (linoleic acid); ~10% of the total can be longer-chain n-6.' },
    'n-3 polyunsaturated fatty acids^a (α-linolenic acid)': { compound: 'Alpha-Linolenic Acid (ALA)', note: 'n-3 PUFA (α-linolenic acid); ~10% of the total can be longer-chain n-3.' },
    'Carbohydrate': { compound: 'Carbohydrates' },
    'Protein': { compound: 'Protein' },
  };
  for (const row of rows.slice(2)) {
    const c = COMPOUND[row[0]];
    if (!c) throw new Error(`J-5 unmapped row "${row[0]}"`);
    groups.forEach(([label, ages], i) => {
      const m = row[i + 1].match(/^([\d.]+)–([\d.]+)$/);
      if (!m) throw new Error(`J-5 unparseable "${row[i + 1]}"`);
      const [lo, hi] = [Number(m[1]), Number(m[2])];
      for (const sex of ['MALE', 'FEMALE'] as Sex[]) {
        out.push({
          compound: c.compound, valueType: 'AMDR', sex, lifeStage: 'NONE', ageMinMonths: ages[0], ageMaxMonths: ages[1],
          activityLevel: null, dietaryContext: null, value: Number(((lo + hi) / 2).toFixed(4)), valueMin: lo, valueMax: hi, unit: '%',
          isPercentOfEnergy: true, isProvisional: false, supplementalOnly: false, note: c.note ?? null, from: `Table J-5 AMDR, ${row[0]}, ${label}`,
        });
      }
    });
  }
}

// J-7 CDRR, sodium, both sexes
{
  const rows = grid('tab7.html');
  const AGE: Record<string, [number, number | null]> = {
    'Children, 1–3 y': [12, 47], 'Children, 4–8 y': [48, 107], 'Adolescents, 9–13 y': [108, 167],
    'Adolescents, 14–18 y': [168, 227], 'Adults, ≥ 19 y': [228, null],
  };
  for (const row of rows.slice(1)) {
    const [group, rec] = row.length === 3 ? [row[1], row[2]] : [row[0], row[1]];
    const ages = AGE[group];
    const m = rec.match(/above ([\d,]+) mg\/day/);
    if (!ages || !m) throw new Error(`J-7 unparseable "${row.join(' | ')}"`);
    const v = Number(m[1].replace(/,/g, ''));
    for (const sex of ['MALE', 'FEMALE'] as Sex[]) {
      out.push({
        compound: 'Sodium', valueType: 'CDRR', sex, lifeStage: 'NONE', ageMinMonths: ages[0], ageMaxMonths: ages[1],
        activityLevel: null, dietaryContext: null, value: v, valueMin: null, valueMax: v, unit: 'mg',
        isPercentOfEnergy: false, isProvisional: false, supplementalOnly: false,
        note: ages[0] < 228 ? 'Reduce intakes if above; extrapolated from the adult CDRR using sedentary EERs.' : 'Reduce intakes if above.',
        from: `Table J-7 CDRR, Sodium, ${group}`,
      });
    }
  }
}

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths);
writeFileSync(path.join(DIR, 'values.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${out.length} values to dv-sources/nih-dri/values.json`);
