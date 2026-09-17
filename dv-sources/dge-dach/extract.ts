/**
 * DACH — DGE / ÖGE / SGE "Referenzwerte für die Nährstoffzufuhr" (Germany, Austria, Switzerland) -> values.json.
 *
 * Source: the DGE Referenzwerte-Tool (https://www.dge.de/wissenschaft/referenzwerte-tool/), queried 2026-09-17 for
 * every population group, every nutrient and both sexes. The response is the current official table (including the
 * 2025 iodine and vitamin E revisions). Snapshots: source/dge-referenzwerte-tool-all.html (all 16 groups) and
 * source/dge-footnotes.json (footnote texts, collected from the per-group responses). Parsed here, not retyped.
 *
 * Mapping decisions:
 *   - Kategorie: "Empfohlene Zufuhr" -> RDA; "Schätzwert" (estimate) -> AI; "Richtwert" (guidance value) by nutrient:
 *     energy -> EER; water (beverages; infants: milk) -> AI; fluoride -> AI; fibre "≥30" -> AMDR floor; total fat and
 *     carbohydrate % energy -> AMDR (points, ranges, ">50" floor, "≈ 45" point with note).
 *   - Rows printed without a category: saturated fat "max. 10" -> CDRR ceiling; MUFA ">10" -> AMDR floor; PUFA "7-10"
 *     -> AMDR range; EPA_DHA 250 mg -> EPA + DHA AI (noted); pregnancy/lactation "200 mg DHA" -> DHA AI.
 *   - Ranges ("30-100") are stored as the midpoint with min/max.
 *   - Energy "bei PAL 1,4 / 1,6 / 1,8" -> SEDENTARY / MODERATE / ACTIVE; infants have a single value (no level).
 *   - Iron, women 25-65 y "Prämenopausal 16 Postmenopausal 14": 16 stored, 14 in the note; footnote v (11 mg for
 *     women who do not menstruate) is noted on the 16 mg values.
 *   - Zinc by phytate intake (footnotes y1-y3: 330 / 660 / 990 mg/day) -> PHYTATE_LOW / PHYTATE_MED_LOW /
 *     PHYTATE_MED_HIGH, matching EFSA's 300 / 600 / 900 mg levels.
 *   - Pregnancy (1.-3. Trimester) and lactation ("Stillende") print no age: absolute values are stored for women
 *     19-51 y. Energy "+0 / +250 / +500" and lactation "+500" are stored as totals over women 19-25 and 25-51 y at
 *     each PAL. Calcium and phosphorus for pregnant/lactating women under 19 (footnotes q, r) are in the notes.
 *   - Footnotes with numbers that apply to the group are stored: vitamin D UL "bei Supplementation" 25 µg infants,
 *     50 µg children to 10 y, 100 µg from 11 y (footnote al) -> UL; cholesterol up to 300 mg/day (af) -> CDRR; trans
 *     fat < 1 % of energy (ag) -> CDRR; free sugars max. 10 % of energy (ai) -> CDRR.
 *   - Vitamin A µg RAE; folate µg folate equivalents (DFE); niacin mg NE; vitamin E mg RRR-α-tocopherol.
 *
 * Not stored: protein (g/kg body weight), alcohol (no amount is safe), supplementation advice without a reference
 * value, smokers' vitamin C (noted), fluoride and vitamin K prophylaxis doses for infants (noted).
 *
 * Run: npx tsx dv-sources/dge-dach/extract.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage, Activity, DietaryContext } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
const DIR = path.join(process.cwd(), 'dv-sources', 'dge-dach');
const out: SourceValue[] = [];
const r4 = (x: number) => Number(x.toFixed(4));
const FN: Record<string, string> = JSON.parse(readFileSync(path.join(DIR, 'source', 'dge-footnotes.json'), 'utf8'));

const GROUPS: Record<string, { age: Age; stage: LifeStage }> = {
  '0 bis unter 4 Monate': { age: [0, 3], stage: 'NONE' }, '4 bis unter 12 Monate': { age: [4, 11], stage: 'NONE' },
  '1 bis unter 4 Jahre': { age: [12, 47], stage: 'NONE' }, '4 bis unter 7 Jahre': { age: [48, 83], stage: 'NONE' },
  '7 bis unter 10 Jahre': { age: [84, 119], stage: 'NONE' }, '10 bis unter 13 Jahre': { age: [120, 155], stage: 'NONE' },
  '13 bis unter 15 Jahre': { age: [156, 179], stage: 'NONE' }, '15 bis unter 19 Jahre': { age: [180, 227], stage: 'NONE' },
  '19 bis unter 25 Jahre': { age: [228, 299], stage: 'NONE' }, '25 bis unter 51 Jahre': { age: [300, 611], stage: 'NONE' },
  '51 bis unter 65 Jahre': { age: [612, 779], stage: 'NONE' }, '65 Jahre und älter': { age: [780, null], stage: 'NONE' },
  '1. Trimester': { age: [228, 611], stage: 'PREGNANT_T1' }, '2. Trimester': { age: [228, 611], stage: 'PREGNANT_T2' },
  '3. Trimester': { age: [228, 611], stage: 'PREGNANT_T3' }, 'Stillende': { age: [228, 611], stage: 'LACTATING' },
};

// ───────────── Parse ─────────────
interface Row { name: string; marks: string[]; cells: string[]; unit: string; remark: string; category: string }
const html = readFileSync(path.join(DIR, 'source', 'dge-referenzwerte-tool-all.html'), 'utf8');
const clean = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const tables: Array<{ group: string; female: boolean; male: boolean; rows: Row[] }> = [];
{
  const re = /<dt class="vsa-item__heading">([\s\S]*?)<\/dt>[\s\S]*?(<table[\s\S]*?<\/table>)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const group = clean(m[1].replace(/<(svg|img)[\s\S]*?(<\/svg>|>)/g, ''));
    if (!GROUPS[group]) throw new Error(`Unknown group "${group}"`);
    const trs = [...m[2].matchAll(/<tr[\s\S]*?<\/tr>/g)].map(([tr]) => [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(([, c]) => c));
    const sexRow = trs[1].map(clean);
    const male = sexRow.includes('Männlich'); const female = sexRow.includes('Weiblich');
    const nSex = (male ? 1 : 0) + (female ? 1 : 0);
    const rows: Row[] = [];
    for (const tr of trs.slice(2)) {
      const nameHtml = tr[0];
      const marks = [...nameHtml.matchAll(/<sup[^>]*>([\s\S]*?)<\/sup>/g)].flatMap(([, s]) => clean(s).split(',').map((x) => x.trim()).filter(Boolean));
      const name = clean(nameHtml.replace(/<sup[\s\S]*?<\/sup>/g, ''));
      const cells = tr.slice(1, 1 + nSex).map(clean);
      const [unit, remark, category] = [clean(tr[1 + nSex] ?? ''), clean(tr[2 + nSex] ?? ''), clean(tr[3 + nSex] ?? '').replace(/^[ⓇⓈⓏ]\s*/, '')];
      rows.push({ name, marks, cells, unit, remark, category });
    }
    tables.push({ group, female, male, rows });
  }
}
if (tables.length !== 16) throw new Error(`Expected 16 group tables, got ${tables.length}`);
// Marks must come out of <sup>; if they do not, the name keeps them ("Eisen v") and the lookup below fails loudly.

// ───────────── Map ─────────────
const COMPOUND: Record<string, [string, string?]> = {
  'Ballaststoffe': ['Dietary Fiber'], 'Biotin': ['Biotin (B7)'], 'Calcium': ['Calcium'], 'Chlorid': ['Chloride'], 'Chrom': ['Chromium'],
  'Einfach ungesättigte Fettsäuren': ['Monounsaturated Fat'], 'Eisen': ['Iron (Total)'], 'EPA_DHA': ['EPA + DHA'], 'Fluorid': ['Fluoride'],
  'Folat': ['Folate (Total)', 'µg DFE'], 'Gesamtfett': ['Total Fat'], 'Gesättigte Fettsäuren': ['Saturated Fat'], 'Jod': ['Iodine'],
  'Kalium': ['Potassium'], 'Kohlenhydrate': ['Carbohydrates'], 'Kupfer': ['Copper'], 'Linolsäure': ['Linoleic Acid'], 'Magnesium': ['Magnesium'],
  'Mangan': ['Manganese'], 'Mehrfach ungesättigte Fettsäuren': ['Polyunsaturated Fat'], 'Molybdän': ['Molybdenum'], 'Natrium': ['Sodium'],
  'Niacin': ['Niacin (B3)', 'mg NE'], 'Pantothensäure': ['Pantothenic Acid (B5)'], 'Phosphor': ['Phosphorus'], 'Riboflavin': ['Riboflavin (B2)'],
  'Selen': ['Selenium'], 'Thiamin': ['Thiamin (B1)'], 'Vitamin A': ['Vitamin A (RAE)', 'µg RAE'], 'Vitamin B12 (Cobalamine)': ['Vitamin B12 (Total)'],
  'Vitamin B6': ['Vitamin B6'], 'Vitamin C': ['Vitamin C (Total)'], 'Vitamin D': ['Vitamin D (Total)'], 'Vitamin E': ['Vitamin E (Total)'],
  'Vitamin K': ['Vitamin K (Total)'], 'Wasser': ['Water'], 'α-Linolensäure': ['Alpha-Linolenic Acid (ALA)'], 'Zink': ['Zinc'],
};
const UNIT: Record<string, [string, boolean]> = {
  'g/Tag': ['g', false], 'mg/Tag': ['mg', false], 'µg/Tag': ['µg', false], 'µg-RAE/Tag': ['µg RAE', false], 'kcal/Tag': ['kcal', false],
  'ml/Tag': ['mL', false], '% der Energie': ['%', true],
};
const PHYTATE: Record<string, [DietaryContext, string]> = {
  'niedriger': ['PHYTATE_LOW', 'y1'], 'mittlerer': ['PHYTATE_MED_LOW', 'y2'], 'hoher': ['PHYTATE_MED_HIGH', 'y3'],
};
const ENERGY_PAL: Record<string, Activity> = { '1,4': 'SEDENTARY', '1,6': 'MODERATE', '1,8': 'ACTIVE' };
const shortFn = (k: string) => FN[k] ? `(${k}) ${FN[k]}` : null;

function push(p: { compound: string; type: DvValueType; sex: Sex; stage: LifeStage; age: Age; value: number; min?: number | null; max?: number | null; unit: string; pct?: boolean; activity?: Activity | null; diet?: DietaryContext | null; supp?: boolean; note?: string | null; from: string }) {
  out.push({
    compound: p.compound, valueType: p.type, sex: p.sex, lifeStage: p.stage, ageMinMonths: p.age[0], ageMaxMonths: p.age[1],
    activityLevel: p.activity ?? null, dietaryContext: p.diet ?? null, value: p.value, valueMin: p.min ?? null, valueMax: p.max ?? null,
    unit: p.unit, isPercentOfEnergy: p.pct ?? false, isProvisional: false, supplementalOnly: p.supp ?? false, note: p.note ?? null, from: p.from,
  });
}
const num = (s: string) => { const v = Number(s.replace(',', '.')); if (Number.isNaN(v)) throw new Error(`number "${s}"`); return v; };

// Women's energy per PAL, kept for pregnancy / lactation increments.
const womenEnergy: Record<string, Record<Activity, number>> = {};

for (const t of tables) {
  const g = GROUPS[t.group];
  const sexes: Sex[] = [...(t.male ? ['MALE' as Sex] : []), ...(t.female ? ['FEMALE' as Sex] : [])];
  for (const r of t.rows) {
    const from = (sex: Sex) => `DGE Referenzwerte-Tool, ${t.group}, ${sex === 'MALE' ? 'Männlich' : 'Weiblich'}, ${r.name}`;
    if (r.name === 'Alkohol' || r.name.startsWith('Protein')) continue; // no safe amount / per kg body weight
    let base = r.name; let activity: Activity | null = null; let diet: DietaryContext | null = null; let dietNote: string | null = null;
    const e = /^Energie bei PAL (\d,\d)$/.exec(r.name);
    if (e) { base = 'Energie'; activity = ENERGY_PAL[e[1]]; if (!activity) throw new Error(`PAL ${e[1]}`); }
    const z = /^Zink bei (niedriger|mittlerer|hoher) Phytatzufuhr$/.exec(r.name);
    if (z) { base = 'Zink'; [diet] = PHYTATE[z[1]]; dietNote = shortFn(PHYTATE[z[1]][1]); }
    const fnNotes = r.marks.filter((k) => !['y1', 'y2', 'y3', 'x'].includes(k)).map(shortFn).filter(Boolean) as string[];
    const remark = r.remark ? `Bemerkung: ${r.remark}.` : null;

    sexes.forEach((sex, i) => {
      const cell = r.cells[i];
      if (cell === '-' || cell === '') return;
      const note = (extra: Array<string | null>) => [...extra, remark, ...fnNotes].filter(Boolean).join(' ') || null;
      // Energy
      if (base === 'Energie') {
        if (cell.startsWith('+')) {
          const inc = num(cell.slice(1));
          for (const [band, age] of [['19 bis unter 25 Jahre', [228, 299]], ['25 bis unter 51 Jahre', [300, 611]]] as Array<[string, Age]>) {
            for (const [act, v] of Object.entries(womenEnergy[band]) as Array<[Activity, number]>) {
              push({ compound: 'Energy', type: 'EER', sex, stage: g.stage, age, value: v + inc, unit: 'kcal', activity: act,
                note: note([`Printed as ${cell} kcal over women ${band} at this PAL (${v}); stored as total.`]), from: `${from(sex)} ${cell} over ${band}` });
            }
          }
          return;
        }
        const v = num(cell);
        if (activity && sex === 'FEMALE' && g.stage === 'NONE') ((womenEnergy[t.group] ??= {} as Record<Activity, number>)[activity] = v);
        push({ compound: 'Energy', type: 'EER', sex, stage: g.stage, age: g.age, value: v, unit: 'kcal', activity, note: note([activity ? `PAL ${e![1]}.` : null]), from: from(sex) });
        return;
      }
      // DHA during pregnancy / lactation
      if (base === 'EPA_DHA' && /^200 mg DHA$/.test(cell)) {
        push({ compound: 'DHA (Docosahexaenoic Acid)', type: 'AI', sex, stage: g.stage, age: g.age, value: 200, unit: 'mg',
          note: note(['Printed in the EPA_DHA row as "200 mg DHA"; no category printed.']), from: from(sex) });
        return;
      }
      // Iron with menopausal split
      if (base === 'Eisen' && cell.startsWith('Prämenopausal')) {
        const m = /^Prämenopausal (\d+) Postmenopausal (\d+)$/.exec(cell);
        if (!m) throw new Error(`Iron cell "${cell}"`);
        push({ compound: 'Iron (Total)', type: 'RDA', sex, stage: g.stage, age: g.age, value: Number(m[1]), unit: 'mg',
          note: note([`Premenopausal ${m[1]} mg (stored); postmenopausal ${m[2]} mg.`]), from: from(sex) });
        return;
      }
      const map = COMPOUND[base];
      if (!map) throw new Error(`Unmapped nutrient "${r.name}" in ${t.group}`);
      const [compound, unitOverride] = map;
      const u = UNIT[r.unit];
      if (!u) throw new Error(`Unmapped unit "${r.unit}" for ${r.name}`);
      const unit = unitOverride ?? (base === 'Vitamin E' ? 'mg' : u[0]);
      const pct = u[1];

      // Value shapes
      let value: number; let min: number | null = null; let max: number | null = null; let shape = 'point';
      let c = cell.replace(/\s+/g, ' ');
      if (/^max\. /.test(c)) { value = max = num(c.slice(5)); shape = 'ceiling'; }
      else if (/^[≥>]/.test(c)) { value = min = num(c.replace(/^[≥>]\s*/, '')); shape = 'floor'; }
      else if (/^≈ /.test(c)) { value = num(c.slice(2)); shape = 'approx'; }
      else if (/^\d+(,\d+)?-\d+(,\d+)?$/.test(c)) { const [a, b] = c.split('-').map(num); value = r4((a + b) / 2); min = a; max = b; shape = 'range'; }
      else if (/^\d+(,\d+)?$/.test(c)) { value = num(c); }
      else throw new Error(`Unparsed cell "${cell}" for ${r.name} in ${t.group}`);

      let type: DvValueType;
      const cat = r.category;
      const shapeNote: string[] = [];
      if (shape === 'approx') shapeNote.push(`Printed "≈ ${c.slice(2)}".`);
      if (cat === 'Empfohlene Zufuhr') type = 'RDA';
      else if (cat === 'Schätzwert') type = 'AI';
      else if (cat === 'Richtwert') {
        if (compound === 'Water' || compound === 'Fluoride') type = 'AI';
        else if (pct || compound === 'Dietary Fiber') type = 'AMDR';
        else throw new Error(`Richtwert for ${r.name}`);
        shapeNote.push('Richtwert (guidance value).');
      } else if (cat === '') {
        if (compound === 'Saturated Fat' && shape === 'ceiling') type = 'CDRR';
        else if (compound === 'Monounsaturated Fat' || compound === 'Polyunsaturated Fat') type = 'AMDR';
        else if (compound === 'EPA + DHA') type = 'AI';
        else throw new Error(`No category for ${r.name}`);
        shapeNote.push('No category printed.');
      } else throw new Error(`Unknown category "${cat}"`);
      if (type === 'AMDR' && shape === 'point' && pct) { min = null; max = null; }
      if (compound === 'Water') shapeNote.push(g.age[0] === 0 ? 'Fluid intake from breast milk or infant formula.' : 'Water from beverages.');
      if (base === 'Eisen' && FN.v && (r.marks.includes('v'))) { /* footnote v already in fnNotes */ }

      push({ compound, type, sex, stage: g.stage, age: g.age, value, min, max, unit, pct, diet,
        note: note([...shapeNote, dietNote]), from: from(sex) });
    });

    // Footnote-derived values for this group (stored once per nutrient row that cites them).
    for (const sex of sexes) {
      const where = { sex, stage: g.stage, age: g.age };
      const fnFrom = (k: string) => `DGE Referenzwerte-Tool, ${t.group}, ${sex === 'MALE' ? 'Männlich' : 'Weiblich'}, ${r.name}, footnote ${k}`;
      if (r.name === 'Gesamtfett' && r.marks.includes('af')) push({ ...where, compound: 'Cholesterol', type: 'CDRR', value: 300, max: 300, unit: 'mg', note: `(af) ${FN.af}`, from: fnFrom('af') });
      if (r.name === 'Gesamtfett' && r.marks.includes('ag')) push({ ...where, compound: 'Trans Fat', type: 'CDRR', value: 1, max: 1, unit: '%', pct: true, note: `(ag) ${FN.ag}`, from: fnFrom('ag') });
      if (r.name === 'Kohlenhydrate' && r.marks.includes('ai')) push({ ...where, compound: 'Free Sugars', type: 'CDRR', value: 10, max: 10, unit: '%', pct: true, note: `(ai) ${FN.ai}`, from: fnFrom('ai') });
      if (r.name === 'Vitamin D' && r.marks.includes('al')) {
        const a0 = g.age[0];
        const ul = a0 < 12 ? 25 : a0 < 132 ? 50 : 100;
        push({ ...where, compound: 'Vitamin D (Total)', type: 'UL', value: ul, unit: 'µg',
          note: `(al) ${FN.al} ${a0 >= 120 && a0 < 132 ? '' : ''}`.trim(), from: fnFrom('al') });
      }
    }
  }
}

// Vitamin D UL for 10-13 y: footnote al gives 50 µg "bis 10 Jahre" and 100 µg "ab 11 Jahre"; the 10 to <13 y group
// straddles both. Split the stored row at 11 y rather than pick one.
for (let i = out.length - 1; i >= 0; i--) {
  const v = out[i];
  if (v.compound === 'Vitamin D (Total)' && v.valueType === 'UL' && v.ageMinMonths === 120) {
    out.splice(i, 1,
      { ...v, ageMaxMonths: 131, value: 50, note: `${v.note} Group 10 to <13 y split at 11 y: 50 µg for 10 y.` },
      { ...v, ageMinMonths: 132, value: 100, note: `${v.note} Group 10 to <13 y split at 11 y: 100 µg from 11 y.` });
  }
}

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths || (a.activityLevel ?? '').localeCompare(b.activityLevel ?? '') || (a.dietaryContext ?? '').localeCompare(b.dietaryContext ?? ''));
writeFileSync(path.join(DIR, 'values.json'), JSON.stringify(out, null, 1) + '\n');
const byType: Record<string, number> = {};
for (const v of out) byType[v.valueType] = (byType[v.valueType] ?? 0) + 1;
console.log(`Wrote ${out.length} values to dv-sources/dge-dach/values.json`, byType);
