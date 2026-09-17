/**
 * Italy — SINU LARN IV Revisione (2014) -> values.json.
 *
 * Source: the 13 open LARN 2014 tables on eng.sinu.it (published 2019-07-09), saved 2026-09-16 as
 * HTML snapshots in source/. The numeric grids (vitamins and minerals PRI/AI, AR, UL, SDT; proteins;
 * energy) are parsed from those snapshots. The lipid and carbohydrate tables are prose cells and are
 * transcribed by hand below, each value citing its cell.
 *
 * Mapping decisions:
 *   - PRI/AI table: SINU prints PRI in bold and AI in italics. Bold -> RDA, italic -> AI. Infant iron
 *     and zinc are unformatted; they are PRIs (LARN derives an infant AR for exactly these two, and an
 *     AI has no AR), so they are stored as RDA with a note.
 *   - AR -> EAR, UL -> UL, SDT -> SDT, lipid/carbohydrate RI -> AMDR (% energy, midpoint with min/max).
 *   - Iron "10/18" (girls 11-14: AR "7/10") and "18/10" (women 30-59: AR "10/6"): the menstruating
 *     value is stored, the other in the note (per the AR table footnote).
 *   - Na, K, Cl are printed in g and kept in g. Vitamin A is µg retinol equivalents (stored under
 *     Vitamin A (RE)); niacin mg NE; vitamin E mg α-TE.
 *   - Niacin UL is printed as nicotinamide (NA) and nicotinic acid (AcN), for supplement/fortified
 *     forms -> Nicotinamide / Nicotinic Acid, supplementalOnly. Folate UL is for synthetic folic acid
 *     -> Folic Acid (Synthetic), supplementalOnly. Magnesium UL is supplemental Mg -> supplementalOnly.
 *   - Pregnancy and lactation rows print no age; absolute values stored from 18 y (as for AESAN).
 *     Protein trimester / semester increments are stored as totals over women 18-59 y (18-29 and 30-59
 *     are equal).
 *   - Protein 60+ y is printed only in the SDT column (1.1 g/kg; 77 g men, 66 g women) -> SDT floor.
 *   - Energy: infants 6-12 months are printed per month and children 1-17 y per year at the 25th
 *     percentile, median and 75th percentile of PAL for age. The median is stored with no activity
 *     level; the percentile values and PAL are in the note. SINU marks all energy values as
 *     illustrative, not normative. "12 mesi" and "1 anno" both exist: 12 months stored as month 12,
 *     1 year from month 13.
 *
 * Not stored: adult and geriatric energy (printed per body height, with no reference height to pick),
 * protein g/kg (the g/day at LARN's reference weights is stored), trans fat
 * "as low as possible", the carbohydrate guidance text, and the calcium AR for postmenopausal women not
 * on oestrogen therapy (a condition the demographic model cannot express).
 *
 * Source contradictions kept as printed and noted: the UL footnotes say no vitamin UL exists for infants
 * yet vitamin D is printed as 40 µg for 6-12 months; they say the infant UL is defined only for calcium
 * yet calcium is "nd" for infants. The AR footnote says "39-59" for the postmenopausal iron value; the
 * table row is 30-59.
 *
 * Run: npx tsx dv-sources/larn-2014/extract.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
const DIR = path.join(process.cwd(), 'dv-sources', 'larn-2014');
const out: SourceValue[] = [];
const BOTH: Sex[] = ['MALE', 'FEMALE'];
const F: Sex[] = ['FEMALE'];
const r4 = (x: number) => Number(x.toFixed(4));

function add(p: {
  compound: string; type: DvValueType; sexes: Sex[]; stage?: LifeStage; age: Age; value: number;
  min?: number | null; max?: number | null; unit: string; pct?: boolean; supp?: boolean; note?: string | null; from: string;
}) {
  for (const sex of p.sexes) {
    out.push({
      compound: p.compound, valueType: p.type, sex, lifeStage: p.stage ?? 'NONE', ageMinMonths: p.age[0], ageMaxMonths: p.age[1],
      activityLevel: null, dietaryContext: null, value: p.value, valueMin: p.min ?? null, valueMax: p.max ?? null, unit: p.unit,
      isPercentOfEnergy: p.pct ?? false, isProvisional: false, supplementalOnly: p.supp ?? false, note: p.note ?? null, from: p.from,
    });
  }
}

// ───────────── HTML grid parsing ─────────────
interface Cell { text: string; bold: boolean; italic: boolean }
function tables(file: string): Cell[][][] {
  const html = readFileSync(path.join(DIR, 'source', file), 'utf8');
  const decode = (s: string) => s.replace(/&#8211;/g, '–').replace(/&#8217;/g, '’').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8805;|&ge;/g, '≥');
  return [...html.matchAll(/<table.*?<\/table>/gs)].map(([t]) =>
    [...t.matchAll(/<tr.*?<\/tr>/gs)].map(([tr]) =>
      [...tr.matchAll(/<t[dh][^>]*>(.*?)<\/t[dh]>/gs)].map(([, inner]) => ({
        text: decode(inner.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim(),
        bold: /<(strong|b)>/.test(inner),
        italic: /<(em|i)>/.test(inner),
      }))));
}
const num = (s: string) => Number(s.replace(',', '.'));

/** Demographic rows, keyed by the age label as printed; the group label carries forward. */
interface Demo { label: string; sexes: Sex[]; stage: LifeStage; age: Age }
function demographic(group: string, ageLabel: string): Demo | null {
  const a = ageLabel.replace(/\s+/g, '').replace('years old', '').replace('yearsold', '').replace('monthsold', 'mesi').replace(/anni$/, '');
  const g = group.toUpperCase();
  if (g === 'GRAVIDANZA') return { label: 'Gravidanza', sexes: F, stage: 'PREGNANT', age: [216, null] };
  if (g === 'ALLATTAMENTO') return { label: 'Allattamento', sexes: F, stage: 'LACTATING', age: [216, null] };
  const bands: Record<string, Age> = {
    '6-12mesi': [6, 11], '1-3': [12, 47], '4-6': [48, 83], '7-10': [84, 131], '11-14': [132, 179], '15-17': [180, 215],
    '18-29': [216, 359], '30-59': [360, 719], '60-74': [720, 899], '≥75': [900, null],
  };
  const age = bands[a];
  if (!age) return null;
  const sexes: Sex[] = g === 'MASCHI' || g === 'MALE' ? ['MALE'] : g === 'FEMMINE' || g === 'FEMALE' ? F : BOTH;
  if (age[0] >= 132 && sexes.length === 2) throw new Error(`No sex for ${group} ${ageLabel}`);
  return { label: `${group ? group + ' ' : ''}${ageLabel}`, sexes, stage: 'NONE', age };
}

/** Walk a grid: header row gives nutrient columns, then one callback per demographic data cell. */
function grid(rows: Cell[][], cols: string[], fn: (d: Demo, col: string, cell: Cell) => void) {
  let group = '';
  for (const r of rows) {
    if (r.length < cols.length + 2) {
      if (r[0]?.text && /^[A-ZÀ-Ú-]+$/.test(r[0].text)) group = r[0].text;
      continue;
    }
    if (r[0].text) group = r[0].text;
    const d = demographic(group, r[1].text);
    if (!d) {
      if (r.slice(2).some((c) => /^[\d,/]+$/.test(c.text))) throw new Error(`Unmapped row: ${group} | ${r[1].text}`);
      continue;
    }
    cols.forEach((col, i) => fn(d, col, r[i + 2]));
  }
}

// Nutrient columns: [compound, unit, note?]
type Col = [string, string, string?];
const VIT: Record<string, Col> = {
  'Vit. C': ['Vitamin C (Total)', 'mg'], Tiamina: ['Thiamin (B1)', 'mg'], Riboflavina: ['Riboflavin (B2)', 'mg'],
  Niacina: ['Niacin (B3)', 'mg NE', 'As niacin equivalents (60 mg tryptophan = 1 mg NE).'], 'Ac pantotenico': ['Pantothenic Acid (B5)', 'mg'],
  'Vit. B6': ['Vitamin B6', 'mg'], Biotina: ['Biotin (B7)', 'µg'],
  Folati: ['Folate (Total)', 'µg', 'For women who may become pregnant and in pregnancy, excludes supplements for neural tube defect prevention.'],
  'Vit.B12': ['Vitamin B12 (Total)', 'µg'], 'Vit. A': ['Vitamin A (RE)', 'µg RE', 'As retinol equivalents (1 RE = 1 µg retinol = 6 µg β-carotene = 12 µg other provitamin A carotenoids).'],
  'Vit. D': ['Vitamin D (Total)', 'µg', 'As cholecalciferol (1 µg = 40 IU).'], 'Vit. E': ['Vitamin E (Total)', 'mg α-TE'], 'Vit. K': ['Vitamin K (Total)', 'µg'],
};
const MIN: Record<string, Col> = {
  Ca: ['Calcium', 'mg'], P: ['Phosphorus', 'mg'], Mg: ['Magnesium', 'mg'], Na: ['Sodium', 'g'], K: ['Potassium', 'g'], Cl: ['Chloride', 'g'],
  Fe: ['Iron (Total)', 'mg'], Zn: ['Zinc', 'mg'], Cu: ['Copper', 'mg'], Se: ['Selenium', 'µg'], I: ['Iodine', 'µg'], Mn: ['Manganese', 'mg'],
  Mo: ['Molybdenum', 'µg'], Cr: ['Chromium', 'µg'], F: ['Fluoride', 'mg'],
};
const header = (r: Cell[]) => r.slice(2).map((c) => c.text.replace(/\s*\(.*\)$/, '').trim());

/** "10/18" and "18/10" iron cells: store the menstruating value. */
function splitIron(text: string, d: Demo, table: string): { value: number; note: string } {
  const [a, b] = text.split('/').map(num);
  if (d.age[0] === 132) return { value: b, note: `Printed "${text}": ${a} before menarche, ${b} for girls who menstruate (stored).` };
  if (d.age[0] === 360) return { value: a, note: `Printed "${text}": ${a} for menstruating women (stored), ${b} after menopause.` };
  throw new Error(`Unexpected split iron cell ${text} in ${table} ${d.label}`);
}

function emitGrid(file: string, tableIndex: number, colMap: Record<string, Col>, table: string, typeOf: (c: Cell, d: Demo, compound: string) => { type: DvValueType; note?: string } | null, extra?: (compound: string) => { compound?: string; supp?: boolean; note?: string }) {
  const rows = tables(file)[tableIndex];
  const headerRow = rows.find((r) => r.length >= 3)!;
  const cols = header(headerRow);
  for (const c of cols) if (!colMap[c]) throw new Error(`${table}: unknown column "${c}"`);
  grid(rows, cols, (d, col, cell) => {
    if (!cell.text || cell.text === 'nd') return;
    const [compound0, unit, colNote] = colMap[col];
    const t = typeOf(cell, d, compound0);
    if (!t) return;
    const x = extra?.(compound0) ?? {};
    let value: number; let splitNote: string | null = null;
    if (cell.text.includes('/')) ({ value, note: splitNote } = splitIron(cell.text, d, table));
    else { value = num(cell.text); if (Number.isNaN(value)) throw new Error(`${table} ${d.label} ${col}: "${cell.text}"`); }
    add({
      compound: x.compound ?? compound0, type: t.type, sexes: d.sexes, stage: d.stage, age: d.age, value, unit, supp: x.supp,
      note: [x.note ?? colNote, t.note, splitNote].filter(Boolean).join(' ') || null,
      from: `${table}, ${col}, ${d.label}`,
    });
  });
}

const priAi = (c: Cell, d: Demo, compound: string): { type: DvValueType; note?: string } => {
  if (c.bold && !c.italic) return { type: 'RDA' };
  if (c.italic && !c.bold) return { type: 'AI' };
  if (!c.bold && !c.italic && d.age[0] === 6 && (compound === 'Iron (Total)' || compound === 'Zinc')) {
    return { type: 'RDA', note: 'Unformatted in the PRI/AI table; a PRI, since LARN sets an infant AR for iron and zinc.' };
  }
  throw new Error(`Cannot tell PRI from AI: ${compound} ${d.label} "${c.text}" bold=${c.bold} italic=${c.italic}`);
};

// ───────────── Vitamins and minerals ─────────────
emitGrid('assunzione-raccomandata-per-la-popolazione-pri-e-assunzione-adeguata-ai.html', 0, VIT, 'LARN vitamins PRI/AI', priAi);
emitGrid('minerali-assunzione-raccomandata-per-la-popolazione-pri-e-assunzione-adeguataai.html', 0, MIN, 'LARN minerals PRI/AI', priAi);
emitGrid('vitamine-fabbisogno-medio-ar.html', 0, VIT, 'LARN vitamins AR', () => ({ type: 'EAR' }));
emitGrid('minerali-fabbisogno-medio-ar.html', 0, MIN, 'LARN minerals AR', () => ({ type: 'EAR' }));
emitGrid('minerali-livello-massimo-tollerabile-di-assunzione-ul-e-obiettivo-nutrizionale-per-la-popolazione-sdt.html', 0, MIN, 'LARN minerals UL',
  () => ({ type: 'UL' }),
  (compound) => compound === 'Magnesium' ? { supp: true, note: 'Magnesium taken as supplements or medicines, in addition to diet.' } : {});
emitGrid('minerali-livello-massimo-tollerabile-di-assunzione-ul-e-obiettivo-nutrizionale-per-la-popolazione-sdt.html', 1, MIN, 'LARN minerals SDT',
  () => ({ type: 'SDT' }));
// SDT sodium/chloride are ceilings.
for (const v of out) if (v.valueType === 'SDT' && (v.compound === 'Sodium' || v.compound === 'Chloride')) v.valueMax = v.value;

// Vitamin UL: niacin spans two sub-columns (NA, AcN), so the header is expanded by hand and checked.
{
  const table = 'LARN vitamins UL';
  const rows = tables('vitamine-livello-massimo-tollerabile-di-assunzione-ul.html')[0];
  const printed = header(rows.find((r) => r.length > 4)!).filter(Boolean);
  const expect = ['Niacina', 'Vit. B6', 'Folati', 'Vit. A', 'Vit. D', 'Vit. E'];
  if (printed.join('|') !== expect.join('|')) throw new Error(`${table}: header changed: ${printed.join('|')}`);
  const sub = rows.find((r) => r.some((c) => c.text === 'AcN'))!.map((c) => c.text).filter(Boolean);
  if (sub.join('|') !== 'NA|AcN') throw new Error(`${table}: niacin sub-header changed`);
  const suppNiacin = 'For the forms in supplements and fortified foods; does not apply under medical supervision.';
  const cols: Record<string, [string, string, boolean, string?]> = {
    'Niacina NA': ['Nicotinamide', 'mg', true, `Printed as niacin UL, nicotinamide (NA). ${suppNiacin}`],
    'Niacina AcN': ['Nicotinic Acid', 'mg', true, `Printed as niacin UL, nicotinic acid (AcN). ${suppNiacin}`],
    'Vit. B6': ['Vitamin B6', 'mg', false], Folati: ['Folic Acid (Synthetic)', 'µg', true, 'Printed as folate UL; applies to synthetic folic acid.'],
    'Vit. A': ['Vitamin A (RE)', 'µg RE', false, 'As retinol equivalents.'], 'Vit. D': ['Vitamin D (Total)', 'µg', false, 'As cholecalciferol.'],
    'Vit. E': ['Vitamin E (Total)', 'mg α-TE', false, 'As α-tocopherol equivalents.'],
  };
  grid(rows, Object.keys(cols), (d, col, cell) => {
    if (!cell.text || cell.text === 'nd') return;
    const [compound, unit, supp, note] = cols[col];
    const infantD = d.age[0] === 6 && col === 'Vit. D' ? 'Printed 40 µg although the table footnote says no vitamin UL is available for infants.' : null;
    add({ compound, type: 'UL', sexes: d.sexes, stage: d.stage, age: d.age, value: num(cell.text), unit, supp,
      note: [note, infantD].filter(Boolean).join(' ') || null, from: `${table}, ${col}, ${d.label}` });
  });
}

// ───────────── Proteins ─────────────
{
  const table = 'LARN proteins';
  const rows = tables('proteine.html')[0];
  let group = '';
  for (const r of rows) {
    const t = r.map((c) => c.text);
    if (t.length !== 9) continue;
    if (t[0]) group = t[0];
    const [, ageLabel, , , ar, , pri, , sdt] = t;
    if (group === 'GRAVIDANZA' || group === 'ALLATTAMENTO') {
      const stage: LifeStage = group === 'ALLATTAMENTO'
        ? (ageLabel === 'I semestre' ? 'LACTATING_0_6M' : 'LACTATING_7_12M')
        : ({ 'I trimestre': 'PREGNANT_T1', 'II trimestre': 'PREGNANT_T2', 'III trimestre': 'PREGNANT_T3' } as Record<string, LifeStage>)[ageLabel];
      if (!stage) throw new Error(`${table}: ${group} ${ageLabel}`);
      // Base: women 18-29 and 30-59 (equal: AR 43, PRI 54).
      for (const [cell, type, base] of [[ar, 'EAR', 43], [pri, 'RDA', 54]] as const) {
        if (!cell.startsWith('+')) throw new Error(`${table}: expected increment in ${group} ${ageLabel}`);
        add({ compound: 'Protein', type, sexes: F, stage, age: [216, 719], value: r4(base + num(cell.slice(1))), unit: 'g',
          note: `Printed as ${cell} g over women 18-59 y (${base} g); stored as total.`, from: `${table}, ${type === 'EAR' ? 'AR' : 'PRI'} g/die, ${group} ${ageLabel}` });
      }
      continue;
    }
    const d = demographic(group, ageLabel);
    if (!d) continue;
    const refWeight = `At LARN's reference body weight of ${t[2]} kg.`;
    if (ar) add({ compound: 'Protein', type: 'EAR', sexes: d.sexes, age: d.age, value: num(ar), unit: 'g', note: `${t[3]} g/kg. ${refWeight}`, from: `${table}, AR g/die, ${d.label}` });
    if (pri) add({ compound: 'Protein', type: 'RDA', sexes: d.sexes, age: d.age, value: num(pri), unit: 'g', note: `${t[5]} g/kg. ${refWeight}`, from: `${table}, PRI g/die, ${d.label}` });
    if (sdt) add({ compound: 'Protein', type: 'SDT', sexes: d.sexes, age: d.age, value: num(sdt), min: num(sdt), unit: 'g', note: `${t[7]} g/kg; printed only as SDT for this age. ${refWeight}`, from: `${table}, SDT g/die, ${d.label}` });
  }
}

// ───────────── Energy (AR) ─────────────
{
  const illustrative = 'SINU: illustrative values, not normative.';
  const rows = tables('fabbisogno-energetico-medio-ar-nellintervallo-deta-6-12-mesi.html')[0];
  let sex: Sex | null = null;
  for (const r of rows) {
    const t = r.map((c) => c.text);
    if (t[0] === 'Maschi') { sex = 'MALE'; continue; }
    if (t[0] === 'Femmine') { sex = 'FEMALE'; continue; }
    if (!sex || t.length !== 7 || !/^\d+$/.test(t[0])) continue;
    const m = Number(t[0]);
    add({ compound: 'Energy', type: 'EER', sexes: [sex], age: [m, m], value: num(t[5]), unit: 'kcal',
      note: `Printed for age ${m} months (${num(t[6])} kcal/kg at ${t[1]} kg). ${illustrative}`, from: `LARN energy AR 6-12 months, ${sex === 'MALE' ? 'Maschi' : 'Femmine'} ${m} mesi` });
  }
}
{
  const rows = tables('fabbisogno-energetico-medio-ar-nellintervallo-deta-1-17-anni.html')[0];
  const pal = (y: number) => (y < 3 ? '1.35 / 1.39 / 1.43' : y <= 9 ? '1.42 / 1.57 / 1.69' : '1.66 / 1.73 / 1.85');
  let sex: Sex | null = null;
  for (const r of rows) {
    const t = r.map((c) => c.text);
    if (t[0] === 'Maschi') { sex = 'MALE'; continue; }
    if (t[0] === 'Femmine') { sex = 'FEMALE'; continue; }
    if (!sex || t.length !== 6 || !/^\d+$/.test(t[0])) continue;
    const y = Number(t[0]);
    add({ compound: 'Energy', type: 'EER', sexes: [sex], age: [y === 1 ? 13 : y * 12, y * 12 + 11], value: num(t[4]), unit: 'kcal',
      note: `At the median PAL for age; 25th / 75th PAL percentile: ${num(t[3])} / ${num(t[5])} kcal (PAL ${pal(y)}).${y === 1 ? ' Month 12 is stored from the 6-12 month table.' : ''} SINU: illustrative values, not normative.`,
      from: `LARN energy AR 1-17 y, ${sex === 'MALE' ? 'Maschi' : 'Femmine'} ${y} anni, mediana` });
  }
}

// ───────────── Lipids (prose cells, transcribed) ─────────────
{
  const t = 'LARN lipids';
  const INF: Age = [6, 11]; const KIDS: Age = [12, 215]; const ADULT: Age = [216, null];
  const pct = (compound: string, type: DvValueType, sexes: Sex[], stage: LifeStage, age: Age, lo: number | null, hi: number | null, from: string, note?: string) =>
    add({ compound, type, sexes, stage, age, value: lo != null && hi != null ? r4((lo + hi) / 2) : (hi ?? lo)!, min: lo, max: hi, unit: '%', pct: true, note, from });
  const groups: Array<[string, Sex[], LifeStage, Age]> = [
    ['LATTANTI', BOTH, 'NONE', INF], ['BAMBINI-ADOLESCENTI', BOTH, 'NONE', KIDS], ['ADULTI E ANZIANI', BOTH, 'NONE', ADULT],
    ['GRAVIDANZA E ALLATTAMENTO', F, 'PREGNANT', ADULT], ['GRAVIDANZA E ALLATTAMENTO', F, 'LACTATING', ADULT],
  ];
  for (const [g, sexes, stage, age] of groups) {
    pct('Saturated Fat', 'SDT', sexes, stage, age, null, 10, `${t}, SDT, ${g}, SFA <10% En`);
    pct('Polyunsaturated Fat', 'AMDR', sexes, stage, age, 5, 10, `${t}, RI, ${g}, PUFA 5-10% En`);
    pct('Omega-6', 'AMDR', sexes, stage, age, 4, 8, `${t}, RI, ${g}, PUFA n-6 4-8% En`);
    pct('Omega-3', 'AMDR', sexes, stage, age, 0.5, 2, `${t}, RI, ${g}, PUFA n-3 0,5-2,0% En`, 'Total n-3 polyunsaturated fatty acids.');
    if (g !== 'LATTANTI' && g !== 'BAMBINI-ADOLESCENTI') {
      add({ compound: 'Cholesterol', type: 'SDT', sexes, stage, age, value: 300, max: 300, unit: 'mg', from: `${t}, SDT, ${g}, Colesterolo <300 mg` });
    }
  }
  add({ compound: 'Total Fat', type: 'AI', sexes: BOTH, age: INF, value: 40, unit: '%', pct: true, from: `${t}, AI, LATTANTI, Lipidi totali 40% En` });
  add({ compound: 'DHA (Docosahexaenoic Acid)', type: 'AI', sexes: BOTH, age: INF, value: 100, unit: 'mg', note: 'Printed "+DHA 100 mg" in addition to EPA-DHA 250 mg.', from: `${t}, AI, LATTANTI, DHA 100 mg` });
  add({ compound: 'DHA (Docosahexaenoic Acid)', type: 'AI', sexes: BOTH, age: [12, 23], value: 100, unit: 'mg', note: 'Printed "1-2 anni +DHA 100 mg" in addition to EPA-DHA 250 mg.', from: `${t}, AI, BAMBINI-ADOLESCENTI, 1-2 anni +DHA 100 mg` });
  for (const stage of ['PREGNANT', 'LACTATING'] as const) {
    add({ compound: 'DHA (Docosahexaenoic Acid)', type: 'AI', sexes: F, stage, age: ADULT, value: 150, min: 100, max: 200, unit: 'mg', note: 'Printed "+DHA 100-200 mg" in addition to EPA-DHA 250 mg.', from: `${t}, AI, GRAVIDANZA E ALLATTAMENTO, +DHA 100-200 mg` });
  }
  const epaDha = 'Printed "EPA-DHA 250 mg".';
  add({ compound: 'EPA + DHA', type: 'AI', sexes: BOTH, age: INF, value: 250, unit: 'mg', note: epaDha, from: `${t}, AI, LATTANTI, EPA-DHA 250 mg` });
  add({ compound: 'EPA + DHA', type: 'AI', sexes: BOTH, age: KIDS, value: 250, unit: 'mg', note: epaDha, from: `${t}, AI, BAMBINI-ADOLESCENTI, EPA-DHA 250 mg` });
  add({ compound: 'EPA + DHA', type: 'AI', sexes: BOTH, age: ADULT, value: 250, unit: 'mg', note: epaDha, from: `${t}, AI, ADULTI E ANZIANI, EPA-DHA 250 mg` });
  for (const stage of ['PREGNANT', 'LACTATING'] as const) {
    add({ compound: 'EPA + DHA', type: 'AI', sexes: F, stage, age: ADULT, value: 250, unit: 'mg', note: epaDha, from: `${t}, AI, GRAVIDANZA E ALLATTAMENTO, EPA-DHA 250 mg` });
  }
  pct('Total Fat', 'AMDR', BOTH, 'NONE', [12, 47], 35, 40, `${t}, RI, BAMBINI-ADOLESCENTI, 1-3 anni 35-40% En`);
  const fatNote = 'Up to 35% En applies at high activity; see table footnote.';
  pct('Total Fat', 'AMDR', BOTH, 'NONE', [48, 215], 20, 35, `${t}, RI, BAMBINI-ADOLESCENTI, >4 anni 20-35% En*`, fatNote);
  pct('Total Fat', 'AMDR', BOTH, 'NONE', ADULT, 20, 35, `${t}, RI, ADULTI E ANZIANI, 20-35% En*`, fatNote);
  pct('Total Fat', 'AMDR', F, 'PREGNANT', ADULT, 20, 35, `${t}, RI, GRAVIDANZA E ALLATTAMENTO, 20-35% En*`, fatNote);
  pct('Total Fat', 'AMDR', F, 'LACTATING', ADULT, 20, 35, `${t}, RI, GRAVIDANZA E ALLATTAMENTO, 20-35% En*`, fatNote);
}

// ───────────── Carbohydrates and fibre (prose cells, transcribed) ─────────────
{
  const t = 'LARN carbohydrates and fibre';
  const FROM1: Age = [12, null];
  add({ compound: 'Carbohydrates', type: 'AMDR', sexes: BOTH, age: FROM1, value: 52.5, min: 45, max: 60, unit: '%', pct: true,
    note: 'Up to 65% En acceptable at very high activity. The table has no age groups; stored from 1 year (the LARN tables start at 6 months, and infant macronutrients are set separately).',
    from: `${t}, RI, Carboidrati totali 45-60% En` });
  add({ compound: 'Total Sugars', type: 'SDT', sexes: BOTH, age: FROM1, value: 15, max: 15, unit: '%', pct: true,
    note: 'Total sugars, including those naturally in milk, fruit and vegetables. Intakes >25% En are potentially linked to adverse effects. The table has no age groups; stored from 1 year.',
    from: `${t}, SDT, Zuccheri <15% En` });
  add({ compound: 'Dietary Fiber', type: 'AI', sexes: BOTH, age: [12, 215], value: 2, unit: 'g/MJ',
    note: 'Printed 8,4 g/1000 kcal (2 g/MJ).', from: `${t}, AI, Fibra alimentare, età evolutiva` });
  add({ compound: 'Dietary Fiber', type: 'AMDR', sexes: BOTH, age: [216, null], value: 3.5, min: 3, max: 4, unit: 'g/MJ',
    note: 'Printed 12,6-16,7 g/1000 kcal (3-4 g/MJ).', from: `${t}, RI, Fibra alimentare, adulti` });
  add({ compound: 'Dietary Fiber', type: 'SDT', sexes: BOTH, age: [216, null], value: 25, min: 25, unit: 'g',
    note: 'At least 25 g/day in adults, even at energy intakes below 2000 kcal/day.', from: `${t}, SDT, Fibra alimentare, adulti` });
}

// ───────────── Self-checks against the printed table shape ─────────────
const count = (type: string, compound?: string) => out.filter((v) => v.valueType === type && (!compound || v.compound === compound)).length;
// PRI/AI: 22 stored rows per nutrient (infants and 3 child bands × 2 sexes, 4 teen and 8 adult rows,
// pregnancy, lactation), for 13 vitamins and 15 minerals.
const priAiRows = out.filter((v) => v.from.includes('PRI/AI')).length;
if (priAiRows !== (13 + 15) * 22) throw new Error(`PRI/AI rows: ${priAiRows}, expected ${(13 + 15) * 22}`);
if (count('RDA', 'Iron (Total)') !== 22 || count('AI', 'Iron (Total)') !== 0) throw new Error('iron PRI/AI split');

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths);
writeFileSync(path.join(DIR, 'values.json'), JSON.stringify(out, null, 1) + '\n');
const byType: Record<string, number> = {};
for (const v of out) byType[v.valueType] = (byType[v.valueType] ?? 0) + 1;
console.log(`Wrote ${out.length} values to dv-sources/larn-2014/values.json`, byType);
