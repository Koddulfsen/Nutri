/**
 * Russia — Rospotrebnadzor MR 2.3.1.0253-21 "Нормы физиологических потребностей в энергии и пищевых
 * веществах для различных групп населения Российской Федерации" (approved 22 July 2021) -> values.json.
 *
 * Source: the official text as published by Garant (garant.ru, doc 402716140), saved 2026-09-16 as
 * source/garant-mr-2.3.1.0253-21.html. Tables 7-24 are parsed from that snapshot, with colspans expanded.
 * Vitamin B names are images in the HTML (B1, B2, B6, B12, subscripts as pictures); the 20 pictures were
 * downloaded to source/img/ and read (as were the other 19 pictures used in tables), and are mapped by file name below.
 *
 * Mapping decisions:
 *   - "Нормы физиологических потребностей" (norms) -> RDA; "адекватный уровень потребления" (tables 13,
 *     18, 23; fluoride for children, footnote **) -> AI. Ranges ("20-25", "300-350") are stored as the
 *     midpoint with min/max. "Оптимальное соотношение" (% of energy, tables 10, 15, 19, 22) -> AMDR (points
 *     or ranges); "<10" added sugars -> CDRR ceiling; cholesterol "<300" -> CDRR.
 *   - Activity: КФА 1.4 / 1.6 / 1.9 / 2.2 -> SEDENTARY / MODERATE / ACTIVE / VERY_ACTIVE. Adults 65+ are
 *     printed at a single КФА 1.7 ("desired activity") -> no activity level, noted.
 *   - Adult vitamins and minerals are printed for "older than 18" -> 18 y and older; the footnoted 65+
 *     values (vitamin D 20 µg, calcium 1200 mg) are stored for 65+ and the 18+ rows are split at 65.
 *     The per-1000 kcal thiamin / riboflavin / niacin figures are not stored (the absolute values are).
 *   - Pregnancy (per trimester) and lactation (1-6 / 7-12 months): table 20 is absolute. Table 19 energy,
 *     protein, fat and carbohydrate are "additional needs"; stored as totals over women 18-29 y and
 *     30-44 y at each activity level. "-" in the first trimester means no addition, so no row is stored.
 *     Pregnancy / lactation rows carry no age; absolute values are stored from 18 y.
 *   - Children: 0-3 mo, 4-6 mo, 7-11 mo, 1-2 y, 3-6 y, 7-10 y, 11-14 y and 15-17 y (boys / girls from
 *     11). Infant energy, protein, fat and carbohydrate are per kg (footnote *) and not stored.
 *   - Vitamin A is µg retinol equivalents; niacin mg NE; vitamin E mg tocopherol equivalents.
 *   - Water (tables 7, 8) is printed in litres as ranges -> Water, RDA, L.
 *   - Table 22 children "в т.ч. сахара" (including sugars) is stored as Total Sugars; adults' "добавленные
 *     сахара" as Added Sugars.
 *
 * Not stored: DHA+EPA (no compound), per-kg infant values, table 23/24 bioactives without a compound
 * (inositol, carnitine, CoQ10, lipoic acid, flavonoid classes, etc.), and the 15% Far North energy uplift.
 *
 * Run: npx tsx dv-sources/russia-mr-2021/extract.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage, Activity } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
const DIR = path.join(process.cwd(), 'dv-sources', 'russia-mr-2021');
const out: SourceValue[] = [];
const r4 = (x: number) => Number(x.toFixed(4));
const BOTH: Sex[] = ['MALE', 'FEMALE'];
const F: Sex[] = ['FEMALE'];

// ───────────── HTML parsing ─────────────
// Pictures inside the tables, read from source/img/ (subscripts and Greek letters are images in the HTML).
const IMG: Record<string, string> = {
  pict1006: 'кг/м2', pict1007: '≥75', pict1009: '≥75', pict1047: '≥65', pict1048: '≥65',
  pict1049: 'B1', pict1050: 'B2', pict1051: 'B6', pict1052: 'B12', pict1053: '(α-токоферол)',
  pict1054: 'B1', pict1055: 'B2', pict1056: 'B6', pict1057: 'B12', pict1058: '(α-токоферол)',
  pict1059: 'B1', pict1060: 'B2', pict1061: 'B6', pict1062: 'B12', pict1063: '(α-токоферол)',
  pict1064: 'B1', pict1065: 'B2', pict1066: 'B6', pict1067: 'B12', pict1068: '(α-токоферол)',
  pict1069: 'β-ситостерин', pict1070: 'β-ситостерол-D-гликозид', pict1071: 'α-разнообразия', pict1072: 'Σ',
  pict1073: 'β-аспартилглицин', pict1074: 'γ-аминоуксусная', pict1075: 'β-аспартиллизин', pict1076: 'β-аланин', pict1077: 'γ-аминоизомасляная',
  pict1082: 'β-каротина', pict1083: 'β-каротина', pict1084: 'α-токоферола', pict1085: 'RRR-α-токоферола', pict1086: '(d-α-токоферола)',
};
const html = readFileSync(path.join(DIR, 'source', 'garant-mr-2.3.1.0253-21.html'), 'utf8');
const decode = (s: string) => s
  .replace(/<img src = "[^"]*\/(pict\d+)-\d+\.png">/g, (_m, id) => { if (!IMG[id]) throw new Error(`Unmapped picture ${id}`); return IMG[id]; })
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').replace(/ ,/g, ',').trim();

/** Table N as rows of cells, colspans expanded (rowspans are not needed for the data rows used). */
function table(n: string): string[][] {
  const re = new RegExp(`Таблица ${n.replace('.', '\\.')}\\b`, 'g');
  const m = re.exec(html);
  if (!m) throw new Error(`Table ${n} not found`);
  const start = html.indexOf('<table', m.index);
  const end = html.indexOf('</table>', start);
  return [...html.slice(start, end).matchAll(/<tr.*?<\/tr>/gs)].map(([tr]) =>
    [...tr.matchAll(/<t[dh]([^>]*)>(.*?)<\/t[dh]>/gs)].flatMap(([, attrs, inner]) => {
      const span = Number(/colspan="?(\d+)/.exec(attrs)?.[1] ?? 1);
      return Array(span).fill(decode(inner));
    }));
}
const row = (t: string[][], label: RegExp) => {
  const r = t.find((cells) => cells.some((c) => label.test(c)));
  if (!r) throw new Error(`Row ${label} not found`);
  return r;
};
/** Parse "1 000", "12,5", "300-350", "<10", "15 *", "0,9 (м)". Returns [value, min, max, lessThan]. */
function num(s: string): { value: number; min: number | null; max: number | null; lt: boolean } | null {
  const c = s.replace(/\*/g, '').replace(/\((м|д)\)/g, '').replace(/\s/g, '').replace(/,/g, '.');
  if (c === '' || c === '-') return null;
  const lt = c.startsWith('<');
  const body = lt ? c.slice(1) : c;
  const range = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(body);
  if (range) { const a = Number(range[1]); const b = Number(range[2]); return { value: r4((a + b) / 2), min: a, max: b, lt }; }
  const v = Number(body);
  if (Number.isNaN(v)) throw new Error(`Cannot parse "${s}"`);
  return { value: v, min: null, max: lt ? v : null, lt };
}

function push(p: { compound: string; type: DvValueType; sexes: Sex[]; stage?: LifeStage; age: Age; cell: ReturnType<typeof num>; unit: string; pct?: boolean; activity?: Activity | null; note?: string | null; from: string }) {
  if (!p.cell) return;
  for (const sex of p.sexes) out.push({
    compound: p.compound, valueType: p.type, sex, lifeStage: p.stage ?? 'NONE', ageMinMonths: p.age[0], ageMaxMonths: p.age[1],
    activityLevel: p.activity ?? null, dietaryContext: null, value: p.cell.value, valueMin: p.cell.min, valueMax: p.cell.max, unit: p.unit,
    isPercentOfEnergy: p.pct ?? false, isProvisional: false, supplementalOnly: false, note: p.note ?? null, from: p.from,
  });
}

// ───────────── Adults: tables 9/10 (men), 14/15 (women) ─────────────
const ADULT_AGES: Age[] = [[216, 359], [360, 539], [540, 779]];
const ACTS: Array<[Activity, string]> = [['SEDENTARY', 'КФА 1,4'], ['MODERATE', 'КФА 1,6'], ['ACTIVE', 'КФА 1,9'], ['VERY_ACTIVE', 'КФА 2,2']];
const ELDER: Array<[Age, string]> = [[[780, 899], '65-74'], [[900, null], 'старше 75']];
const elderNote = 'Printed at КФА 1.7 ("desired physical activity") only; applies at every activity level.';
const farNorth = 'In the Far North, energy needs are 15% higher (footnote *).';

// Energy, protein, fat and carbohydrate per activity, kept for the pregnancy increments.
const womenBase: Record<string, Record<string, number>> = {};

for (const [sexes, tg, tp, sexLabel] of [[['MALE'] as Sex[], '9', '10', 'мужчины'], [F, '14', '15', 'женщины']] as const) {
  const g = table(tg); const p = table(tp);
  const cols = (r: string[]) => r.slice(1, 15); // 12 activity × age columns, then 65-74 and 75+
  const grams: Array<[RegExp, string, DvValueType, string, string | null]> = [
    [/^Энергия, ккал/, 'Energy', 'EER', 'kcal', farNorth],
    [/^Белок, г/, 'Protein', 'RDA', 'g', 'Minimum for nitrogen balance: 0.83 g/kg body weight of protein with an amino-acid score of 1.0 (footnote ***).'],
    [/^Жиры, г/, 'Total Fat', 'RDA', 'g', null],
    [/^Углеводы, г/, 'Carbohydrates', 'RDA', 'g', null],
  ];
  for (const [label, compound, type, unit, note] of grams) {
    const cells = cols(row(g, label));
    ACTS.forEach(([act, actLabel], a) => ADULT_AGES.forEach((age, i) => {
      const c = num(cells[a * 3 + i]);
      push({ compound, type, sexes, age, cell: c, unit, activity: act, note, from: `Table ${tg}, ${cells.length && row(g, label)[0]}, ${actLabel}, ${['18-29', '30-44', '45-64'][i]} (${sexLabel})` });
      if (sexes[0] === 'FEMALE' && c) (womenBase[`${compound}|${act}|${i}`] ??= {}).v = c.value;
    }));
    ELDER.forEach(([age, l], i) => push({ compound, type, sexes, age, cell: num(cells[12 + i]), unit, note: [elderNote, note].filter(Boolean).join(' '), from: `Table ${tg}, ${row(g, label)[0]}, КФА 1,7, ${l} (${sexLabel})` }));
  }
  const fiber = row(g, /^Пищевые волокна/);
  push({ compound: 'Dietary Fiber', type: 'RDA', sexes, age: [216, null], cell: num(fiber[1]), unit: 'g', from: `Table ${tg}, Пищевые волокна, г (${sexLabel})` });

  // % of energy (table 10 / 15)
  const pctRows: Array<[RegExp, string, string | null]> = [[/^Белок, % от ккал/, 'Protein', null], [/^Жиры?, % от ккал/, 'Total Fat', null], [/^Углеводы, % от ккал/, 'Carbohydrates', null]];
  for (const [label, compound] of pctRows) {
    const cells = cols(row(p, label));
    ACTS.forEach(([act, actLabel], a) => ADULT_AGES.forEach((age, i) => push({ compound, type: 'AMDR', sexes, age, cell: num(cells[a * 3 + i]), unit: '%', pct: true, activity: act,
      note: 'Printed as the optimal share of energy.', from: `Table ${tp}, ${row(p, label)[0]}, ${actLabel}, ${['18-29', '30-44', '45-64'][i]} (${sexLabel})` })));
    ELDER.forEach(([age, l], i) => push({ compound, type: 'AMDR', sexes, age, cell: num(cells[12 + i]), unit: '%', pct: true, note: `Printed as the optimal share of energy. ${elderNote}`, from: `Table ${tp}, ${row(p, label)[0]}, КФА 1,7, ${l} (${sexLabel})` }));
  }
  const flat: Array<[RegExp, string, DvValueType, string]> = [
    [/^НЖК/, 'Saturated Fat', 'AMDR', 'Printed as the optimal share of energy (10%).'], [/^МНЖК/, 'Monounsaturated Fat', 'AMDR', 'Printed as the optimal share of energy (10%).'],
    [/^ПНЖК/, 'Polyunsaturated Fat', 'AMDR', ''], [/^Омега-6/, 'Omega-6', 'AMDR', ''], [/^Омега-3/, 'Omega-3', 'AMDR', ''], [/^Добавленные сахара/, 'Added Sugars', 'CDRR', ''],
  ];
  for (const [label, compound, type, note] of flat) {
    const r = row(p, label);
    push({ compound, type, sexes, age: [216, null], cell: num(r[1]), unit: '%', pct: true, note: note || null, from: `Table ${tp}, ${r[0]} (${sexLabel})` });
  }
}

// ───────────── Adults: vitamins and minerals (tables 11/12/13 men, 16/17/18 women) ─────────────
const VIT: Array<[RegExp, string, string, string?]> = [
  [/^Витамин С, мг/, 'Vitamin C (Total)', 'mg'], [/^Витамин B1, мг/, 'Thiamin (B1)', 'mg'], [/^Витамин B2, мг/, 'Riboflavin (B2)', 'mg'],
  [/^Витамин B6, мг/, 'Vitamin B6', 'mg'], [/^Ниацин, мг/, 'Niacin (B3)', 'mg NE', 'As niacin equivalents.'], [/^Витамин B12, мкг/, 'Vitamin B12 (Total)', 'µg'],
  [/^Фолаты?, мкг/, 'Folate (Total)', 'µg'], [/^Пантотеновая кислота/, 'Pantothenic Acid (B5)', 'mg'], [/^Биотин/, 'Biotin (B7)', 'µg'],
  [/^Витамин А, мкг/, 'Vitamin A (RAE)', 'µg RE', 'As retinol equivalents.'], [/^Бета-каротин/, 'Beta-Carotene', 'mg'],
  [/^Витамин Е \(α-токоферол\), мг/, 'Vitamin E (Total)', 'mg α-TE', 'As α-tocopherol equivalents.'], [/^Витамин D, мкг/, 'Vitamin D (Total)', 'µg'], [/^Витамин К, мкг/, 'Vitamin K (Total)', 'µg'],
];
const MIN: Array<[RegExp, string, string]> = [
  [/^Кальций/, 'Calcium', 'mg'], [/^Фосфор/, 'Phosphorus', 'mg'], [/^Магний/, 'Magnesium', 'mg'], [/^Калий/, 'Potassium', 'mg'], [/^Натрий/, 'Sodium', 'mg'],
  [/^Хлориды/, 'Chloride', 'mg'], [/^Железо/, 'Iron (Total)', 'mg'], [/^Цинк/, 'Zinc', 'mg'], [/^Йод/, 'Iodine', 'µg'], [/^Медь/, 'Copper', 'mg'],
  [/^Марганец/, 'Manganese', 'mg'], [/^Молибден/, 'Molybdenum', 'µg'], [/^Селен/, 'Selenium', 'µg'], [/^Хром/, 'Chromium', 'µg'],
];
const MIN_AI: Array<[RegExp, string, string]> = [[/^Кобальт/, 'Cobalt', 'µg'], [/^Фтор/, 'Fluoride', 'mg'], [/^Кремний/, 'Silicon', 'mg'], [/^Ванадий/, 'Vanadium', 'µg']];
for (const [sexes, tv, tm, ta, sexLabel] of [[['MALE'] as Sex[], '11', '12', '13', 'мужчины'], [F, '16', '17', '18', 'женщины']] as const) {
  const emit = (t: string[][], tn: string, list: Array<[RegExp, string, string, string?]>, type: DvValueType) => {
    for (const [label, compound, unit, note] of list) {
      const r = row(t, label);
      const from = `Table ${tn}, ${r[0]}, старше 18 лет (${sexLabel})`;
      const over65 = compound === 'Vitamin D (Total)' ? '20' : compound === 'Calcium' ? '1200' : null;
      if (over65) {
        push({ compound, type, sexes, age: [216, 779], cell: num(r[1]), unit, note, from });
        push({ compound, type, sexes, age: [780, null], cell: num(over65), unit, note: [note, `Footnote *: ${over65} ${unit} for people older than 65.`].filter(Boolean).join(' '), from: `${from}, footnote * (older than 65)` });
      } else push({ compound, type, sexes, age: [216, null], cell: num(r[1]), unit, note, from });
    }
  };
  emit(table(tv), tv, VIT, 'RDA');
  emit(table(tm), tm, MIN, 'RDA');
  emit(table(ta), ta, MIN_AI, 'AI');
}

// ───────────── Pregnancy and lactation (tables 19, 20) ─────────────
{
  const STAGES: Array<[LifeStage, string]> = [['PREGNANT_T1', '1 триместр'], ['PREGNANT_T2', '2 триместр'], ['PREGNANT_T3', '3 триместр'], ['LACTATING_0_6M', 'кормящие 1-6 мес.'], ['LACTATING_7_12M', 'кормящие 7-12 мес.']];
  const t20 = table('20');
  for (const [label, compound, unit, note] of [...VIT, ...MIN]) {
    const r = row(t20, label);
    STAGES.forEach(([stage, sl], i) => push({ compound, type: 'RDA', sexes: F, stage, age: [216, null], cell: num(r[1 + i]), unit, note, from: `Table 20, ${r[0]}, ${sl}` }));
  }
  const t19 = table('19');
  for (const [label, compound] of [[/^Белки, % от ккал/, 'Protein'], [/^Жиры, % от ккал/, 'Total Fat'], [/^Углеводы, % от ккал/, 'Carbohydrates']] as const) {
    const r = row(t19, label);
    STAGES.forEach(([stage, sl], i) => push({ compound, type: 'AMDR', sexes: F, stage, age: [216, null], cell: num(r[1 + i]), unit: '%', pct: true, from: `Table 19, ${r[0]}, ${sl}` }));
  }
  const inc: Array<[RegExp, string, DvValueType, string]> = [[/^Энергия, ккал/, 'Energy', 'EER', 'kcal'], [/^Белок, г/, 'Protein', 'RDA', 'g'], [/^Жир, г/, 'Total Fat', 'RDA', 'g'], [/^Углеводы, г/, 'Carbohydrates', 'RDA', 'g']];
  for (const [label, compound, type, unit] of inc) {
    const r = row(t19, label);
    STAGES.forEach(([stage, sl], i) => {
      const add = num(r[1 + i]);
      if (!add) return;
      ACTS.forEach(([act, actLabel]) => [0, 1].forEach((bi) => {
        const base = womenBase[`${compound}|${act}|${bi}`]?.v;
        if (base == null) throw new Error(`No base for ${compound} ${act}`);
        const band = ['18-29', '30-44'][bi];
        push({ compound, type, sexes: F, stage, age: ADULT_AGES[bi], activity: act, unit, cell: { value: r4(base + add.value), min: null, max: null, lt: false },
          note: `Printed as an additional ${add.value} ${unit} (${sl}) over women ${band} y at ${actLabel} (${base}); stored as total.`,
          from: `Table 19, ${r[0]}, ${sl} +${add.value} over women ${band} y ${actLabel}` });
      }));
    });
  }
  const dha = row(t19, /^ДГК, мг/);
  STAGES.forEach(([stage, sl], i) => push({ compound: 'DHA (Docosahexaenoic Acid)', type: 'RDA', sexes: F, stage, age: [216, null], cell: num(dha[1 + i]), unit: 'mg',
    note: 'Listed under additional needs; there is no DHA norm for non-pregnant adults, so the value is stored as printed.', from: `Table 19, ДГК, мг, ${sl}` }));
}

// ───────────── Children: tables 21, 22 ─────────────
{
  const t21 = table('21');
  // 12 value columns after "N" and the label.
  const COLS: Array<[Sex[], Age, string]> = [
    [BOTH, [0, 2], '0-3 мес.'], [BOTH, [3, 5], '4-6 мес.'], [BOTH, [6, 11], '7-11 мес.'], [BOTH, [12, 35], '1-2 г.'],
    [['MALE'], [36, 83], '3-6 лет (м)'], [F, [36, 83], '3-6 лет (д)'], [['MALE'], [84, 131], '7-10 лет (м)'], [F, [84, 131], '7-10 лет (д)'],
    [['MALE'], [132, 179], '11-14 лет, мальчики'], [F, [132, 179], '11-14 лет, девочки'], [['MALE'], [180, 215], '15-17 лет, юноши'], [F, [180, 215], '15-17 лет, девушки'],
  ];
  const kids = (r: string[]) => { const v = r.slice(2); if (v.length !== 12) throw new Error(`Table 21 row "${r[1]}" has ${v.length} cells`); return v; };
  const list: Array<[RegExp, string, DvValueType, string, number, string?]> = [
    // [label, compound, type, unit, first column to store (skips per-kg infant cells), note]
    [/^Энергия, ккал/, 'Energy', 'EER', 'kcal', 3], [/^Белок, г/, 'Protein', 'RDA', 'g', 3], [/^Жиры, г/, 'Total Fat', 'RDA', 'g', 3],
    [/^Углеводы, г/, 'Carbohydrates', 'RDA', 'g', 3], [/^Пищевые волокна/, 'Dietary Fiber', 'RDA', 'g', 0], [/^ДГК, мг/, 'DHA (Docosahexaenoic Acid)', 'RDA', 'mg', 0],
    [/^Холестерин/, 'Cholesterol', 'CDRR', 'mg', 0],
    ...VIT.filter(([, c]) => c !== 'Beta-Carotene').map(([l, c, u, n]) => [l, c, 'RDA', u, 0, n] as [RegExp, string, DvValueType, string, number, string?]),
    ...MIN.map(([l, c, u]) => [l, c, 'RDA', u, 0] as [RegExp, string, DvValueType, string, number]),
    [/^Фтор, мг/, 'Fluoride', 'AI', 'mg', 0, 'Adequate intake (footnote **).'],
  ];
  for (const [label, compound, type, unit, first, note] of list) {
    const r = t21.find((cells) => label.test(cells[1] ?? ''));
    if (!r) throw new Error(`Table 21: ${label}`);
    kids(r).forEach((cell, i) => {
      if (i < first) return;
      const [sexes, age, al] = COLS[i];
      push({ compound, type, sexes, age, cell: num(cell), unit, note, from: `Table 21, ${r[1]}, ${al}` });
    });
  }
  const t22 = table('22');
  const COLS22: Array<[Sex[], Age, string]> = [
    [BOTH, [0, 2], '0-3 мес.'], [BOTH, [3, 5], '4-6 мес.'], [BOTH, [6, 11], '7-11 мес.'], [BOTH, [12, 35], '1-2 г.'], [BOTH, [36, 83], '3-6 лет'],
    [BOTH, [84, 131], '7-10 лет'], [['MALE'], [132, 179], '11-14 лет, мальчики'], [F, [132, 179], '11-14 лет, девочки'], [['MALE'], [180, 215], '15-17 лет, юноши'], [F, [180, 215], '15-17 лет, девушки'],
  ];
  const pl: Array<[RegExp, string, DvValueType, string?]> = [
    [/^Белок, % от ккал/, 'Protein', 'AMDR'], [/^Жиры, % от ккал/, 'Total Fat', 'AMDR'], [/^ПНЖК/, 'Polyunsaturated Fat', 'AMDR'], [/^Омега-6/, 'Omega-6', 'AMDR'],
    [/^Омега-3/, 'Omega-3', 'AMDR'], [/^Углеводы, % от ккал/, 'Carbohydrates', 'AMDR'], [/^в т\.ч\. сахара/, 'Total Sugars', 'CDRR', 'Printed as "в т.ч. сахара" (including sugars).'],
  ];
  for (const [label, compound, type, note] of pl) {
    const r = t22.find((cells) => label.test(cells[1] ?? ''));
    if (!r) throw new Error(`Table 22: ${label}`);
    const v = r.slice(2);
    if (v.length !== 10) throw new Error(`Table 22 row "${r[1]}" has ${v.length} cells`);
    v.forEach((cell, i) => { const [sexes, age, al] = COLS22[i]; push({ compound, type, sexes, age, cell: num(cell), unit: '%', pct: true, note, from: `Table 22, ${r[1]}, ${al}` }); });
  }
}

// ───────────── Water (tables 7, 8) ─────────────
{
  const t7 = table('7');
  const kfa: Record<string, Activity | null> = { '1,4': 'SEDENTARY', '1,6': 'MODERATE', '1,9': 'ACTIVE', '2,2': 'VERY_ACTIVE', '1,7': null };
  let sexes: Sex[] = ['MALE']; let age: Age = [216, 779]; let label = 'Мужчины 18-64 года';
  for (const r of t7.slice(1)) {
    let cells = r;
    if (/^(Мужчины|Женщины)/.test(r[0])) {
      label = r[0]; sexes = r[0].startsWith('Мужчины') ? ['MALE'] : F; age = /18-64/.test(r[0]) ? [216, 779] : [780, null];
      cells = r.slice(1);
    }
    const act = kfa[cells[0]];
    if (act === undefined) throw new Error(`Table 7: КФА "${cells[0]}"`);
    push({ compound: 'Water', type: 'RDA', sexes, age, cell: num(cells[1]), unit: 'L', activity: act,
      note: act ? 'Water and drinks, at BMI 20-25.' : `Water and drinks, at BMI 20-25. ${elderNote}`, from: `Table 7, ${label}${age[0] === 780 ? ' (65+)' : ''}, КФА ${cells[0]}` });
  }
  const t8 = table('8');
  const w = row(t8, /^Вода/).slice(1);
  const C8: Array<[Sex[], Age, string]> = [[BOTH, [6, 11], '7-11 мес.'], [BOTH, [12, 35], '1-2 г.'], [BOTH, [36, 83], '3-6 лет'], [['MALE'], [84, 131], '7-10 лет м.'], [F, [84, 131], '7-10 лет д.'], [['MALE'], [132, 167], '11-13 лет м.'], [F, [132, 167], '11-13 лет д.'], [['MALE'], [168, 215], '14-17 лет м.'], [F, [168, 215], '14-17 лет д.']];
  if (w.length !== 9) throw new Error(`Table 8 has ${w.length} cells`);
  w.forEach((cell, i) => push({ compound: 'Water', type: 'RDA', sexes: C8[i][0], age: C8[i][1], cell: num(cell), unit: 'L', note: 'Water and drinks.', from: `Table 8, Вода, л/сутки, ${C8[i][2]}` }));
}

// ───────────── Adult bioactives with a compound (table 23) ─────────────
{
  const t23 = table('23');
  for (const [label, compound] of [[/^Холин$/, 'Choline (Total)'], [/^Стигмастерин$/, 'Stigmasterol'], [/^β-ситостерин$/, 'Beta-Sitosterol']] as const) {
    const r = row(t23, label);
    push({ compound, type: 'AI', sexes: BOTH, age: [216, null], cell: num(r[1]), unit: 'mg', from: `Table 23, ${r[0]}` });
  }
}

// Sanity: the pictures table 7 uses for the 65+ rows carry no age text; check both 65+ rows were read.
if (out.filter((v) => v.compound === 'Water' && v.ageMinMonths === 780).length !== 2) throw new Error('Table 7 elderly water rows');

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths || (a.activityLevel ?? '').localeCompare(b.activityLevel ?? ''));
writeFileSync(path.join(DIR, 'values.json'), JSON.stringify(out, null, 1) + '\n');
const byType: Record<string, number> = {};
for (const v of out) byType[v.valueType] = (byType[v.valueType] ?? 0) + 1;
console.log(`Wrote ${out.length} values to dv-sources/russia-mr-2021/values.json`, byType);
