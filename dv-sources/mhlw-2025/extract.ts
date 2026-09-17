/**
 * MHLW "日本人の食事摂取基準（2025年版）" (Dietary Reference Intakes for Japanese, 2025; in force April 2025
 * to March 2030) -> values.json. Replaces the 2020 English edition used until 2026-09-17.
 *
 * Transcribed cell by cell, 2026-09-17, from the Kenpakusha reprint of the tables
 * (source/2025/kenpakusha-dri-2025-summary.pdf, pages 3-12; working notes in transcription-draft.txt), then
 * checked cell by cell against the official report "「日本人の食事摂取基準（2025年版）」策定検討会報告書"
 * (mhlw-dri-2025-report.pdf, pages 90, 115, 138-140, 155-156, 193-196, 246-254, 293-297, 357-364): every
 * value agreed. The report's text layer is unusable (font encoding), so both were read from renders.
 *
 * Mapping decisions (as for the 2020 edition):
 *   - 推定平均必要量 EAR, 推奨量 RDA, 目安量 AI, 耐容上限量 UL. 目標量 (DG): a range -> AMDR [min, max];
 *     "x以上" -> AMDR floor; "x以下" / "x未満" -> CDRR ceiling.
 *   - Energy (参考表 推定エネルギー必要量): 低い / ふつう / 高い = PAL 1.50 / 1.75 / 2.00 for adults ->
 *     SEDENTARY / MODERATE / ACTIVE. Ages printed with "ふつう" only (0-5 y) have no activity level.
 *   - Pregnancy / lactation are "+x" increments (付加量) over same-age non-pregnant women, stored as totals
 *     for 18-29 y and 30-49 y; absolute cells are stored for 18-49 y. 初期 / 中期 / 後期 -> PREGNANT_T1/T2/T3.
 *   - Sodium DG is printed as salt equivalent (g): sodium mg = salt g × 1000 / 2.54, the table's own ratio
 *     (600 mg = 1.5 g). EAR and AI are printed in mg (salt in parentheses).
 *   - Iron, women 10-64 y: printed for 月経なし (not menstruating) and 月経あり (menstruating). The
 *     menstruating value is stored with the other in the note; pregnancy / lactation increments are over the
 *     not-menstruating value, as printed.
 *   - Vitamin A (µg RAE): EAR/RDA include provitamin A carotenoids; AI and UL do not. The UL is stored as
 *     Retinol. Niacin UL: nicotinamide mg, nicotinic acid mg in parentheses: both stored. Folate UL applies
 *     to folic acid in foods other than ordinary foods -> Folic Acid (Synthetic). Magnesium UL is given only in
 *     a footnote for non-food sources (adults 350 mg; children 5 mg/kg, not stored) -> supplementalOnly.
 *   - Iodine UL for pregnancy and lactation is 2,000 µg (footnote), stored for 18-49 y.
 *   - n-6 / n-3 AI are total n-6 / n-3 (Omega-6 / Omega-3).
 *
 * Not stored: target BMI, reference body sizes, basal metabolic rates, per-kg magnesium UL for children, and
 * footnoted amounts for preventing disease aggravation (cholesterol <200 mg/d for dyslipidaemia, salt <6.0 g/d
 * for hypertension and CKD) or advice without a table value (trans fat <1% of energy, 400 µg/d folic acid
 * before and in early pregnancy).
 *
 * Run: npx tsx dv-sources/mhlw-2025/extract.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage, Activity } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
const out: SourceValue[] = [];
const r4 = (x: number) => Number(x.toFixed(4));

// 15-row tables (energy, protein) split infants 0-5 / 6-8 / 9-11 months; the other tables use 0-5 / 6-11.
const R15: Array<[string, Age]> = [
  ['0-5 months', [0, 5]], ['6-8 months', [6, 8]], ['9-11 months', [9, 11]], ['1-2 y', [12, 35]], ['3-5 y', [36, 71]], ['6-7 y', [72, 95]],
  ['8-9 y', [96, 119]], ['10-11 y', [120, 143]], ['12-14 y', [144, 179]], ['15-17 y', [180, 215]], ['18-29 y', [216, 359]],
  ['30-49 y', [360, 599]], ['50-64 y', [600, 779]], ['65-74 y', [780, 899]], ['75+ y', [900, null]],
];
const R14: Array<[string, Age]> = [['0-5 months', [0, 5]], ['6-11 months', [6, 11]], ...R15.slice(3)];
const W18: Age = [216, 359]; const W30: Age = [360, 599]; const W18_49: Age = [216, 599];

interface Col {
  page: string; label: string; compound: string; type: DvValueType; unit: string;
  m: string | null; f: string | null;
  /** Pregnancy / lactation: "T1,T2,T3|L" style tokens, e.g. "+0,+0,+60|+300" or "P9.0|9.0" (absolute). */
  preg?: string;
  rows?: 14 | 15; pct?: boolean; supp?: boolean; note?: string; activity?: Activity | null; dg?: boolean;
}

/** DG cells: "20-30" range, "8+" floor (以上), "10-" ceiling (以下 / 未満). Plain numbers are values. */
function parseCell(tok: string, dg: boolean): { value: number; min: number | null; max: number | null; kind: 'value' | 'range' | 'floor' | 'ceiling' } {
  const range = /^(\d+(?:\.\d+)?)~(\d+(?:\.\d+)?)$/.exec(tok);
  if (range) return { value: r4((Number(range[1]) + Number(range[2])) / 2), min: Number(range[1]), max: Number(range[2]), kind: 'range' };
  if (dg && tok.endsWith('+')) { const v = Number(tok.slice(0, -1)); return { value: v, min: v, max: null, kind: 'floor' }; }
  if (dg && tok.endsWith('<')) { const v = Number(tok.slice(0, -1)); return { value: v, min: null, max: v, kind: 'ceiling' }; }
  const v = Number(tok);
  if (Number.isNaN(v)) throw new Error(`Cannot parse "${tok}"`);
  return { value: v, min: null, max: null, kind: 'value' };
}

function emit(p: { col: Col; sex: Sex; stage: LifeStage; age: Age; tok: string; label: string; note?: string | null }) {
  const c = p.col;
  const cell = parseCell(p.tok, !!c.dg);
  let type = c.type;
  if (c.dg) type = cell.kind === 'ceiling' ? 'CDRR' : 'AMDR';
  out.push({
    compound: c.compound, valueType: type, sex: p.sex, lifeStage: p.stage, ageMinMonths: p.age[0], ageMaxMonths: p.age[1],
    activityLevel: c.activity ?? null, dietaryContext: null, value: cell.value, valueMin: cell.min, valueMax: cell.max, unit: c.unit,
    isPercentOfEnergy: c.pct ?? false, isProvisional: false, supplementalOnly: c.supp ?? false,
    note: [c.note, p.note].filter(Boolean).join(' ') || null, from: `${c.page}, ${c.label}, ${p.label}`,
  });
}

function column(c: Col) {
  const rows = c.rows === 15 ? R15 : R14;
  const cells: Record<Sex, string[] | null> = {
    MALE: c.m == null ? null : c.m.trim().split(/\s+/),
    FEMALE: c.f == null ? null : c.f.trim().split(/\s+/),
  };
  for (const sex of ['MALE', 'FEMALE'] as Sex[]) {
    const t = cells[sex];
    if (!t) continue;
    if (t.length !== rows.length) throw new Error(`${c.label} ${sex}: ${t.length} cells, expected ${rows.length}`);
    t.forEach((tok, i) => { if (tok !== '-') emit({ col: c, sex, stage: 'NONE', age: rows[i][1], tok, label: `${sex === 'MALE' ? '男性' : '女性'} ${rows[i][0]}` }); });
  }
  if (!c.preg) return;
  const f = cells.FEMALE;
  const idx18 = rows.findIndex(([, a]) => a[0] === 216);
  const [pregPart, lactPart] = c.preg.split('|');
  const stageToks = pregPart.split(',');
  const stages: Array<[LifeStage, string]> = stageToks.length === 3
    ? [['PREGNANT_T1', '妊婦 初期'], ['PREGNANT_T2', '妊婦 中期'], ['PREGNANT_T3', '妊婦 後期']]
    : stageToks.length === 2 ? [['PREGNANT_T1', '妊婦 初期'], ['PREGNANT_T2', '妊婦 中期・後期']] : [['PREGNANT', '妊婦']];
  const handle = (tok: string, stage: LifeStage, label: string) => {
    if (tok === '-') return;
    const stagesFor: LifeStage[] = label === '妊婦 中期・後期' ? ['PREGNANT_T2', 'PREGNANT_T3'] : [stage];
    for (const st of stagesFor) {
      if (!tok.startsWith('+')) { emit({ col: c, sex: 'FEMALE', stage: st, age: W18_49, tok, label }); continue; }
      if (!f) throw new Error(`${c.label}: increment with no female base`);
      for (const [age, band, i] of [[W18, '18-29', idx18], [W30, '30-49', idx18 + 1]] as Array<[Age, string, number]>) {
        const base = c.label.startsWith('鉄') ? IRON_NOT_MENSTRUATING[i] : f[i];
        if (base == null || base === '-') throw new Error(`${c.label}: no base for ${band}`);
        const total = r4(Number(base) + Number(tok.slice(1)));
        emit({ col: c, sex: 'FEMALE', stage: st, age, tok: String(total), label: `${label} ${tok} over 女性 ${band} y`,
          note: `${c.label.startsWith('鉄') ? 'Over the not-menstruating value. ' : ''}Printed as ${tok} over same-age non-pregnant women (${base}); stored as total.` });
      }
    }
  };
  stageToks.forEach((tok, k) => handle(tok, stages[k][0], stages[k][1]));
  if (lactPart !== undefined) handle(lactPart, 'LACTATING', '授乳婦');
}

// Iron, women: not-menstruating column (the base for pregnancy / lactation increments).
const IRON_NOT_MENSTRUATING_EAR = '- 3.0 3.0 3.5 4.5 6.0 6.5 6.5 5.5 5.0 5.0 5.0 5.0 4.5'.split(' ');
const IRON_NOT_MENSTRUATING_RDA = '- 4.5 4.0 5.0 6.0 8.0 9.0 8.0 6.5 6.0 6.0 6.0 6.0 5.5'.split(' ');
let IRON_NOT_MENSTRUATING: string[] = IRON_NOT_MENSTRUATING_RDA;

const P = (n: number) => `2025 DRI table (report p. ${n})`;
const COLS: Col[] = [];
const add = (c: Col) => COLS.push(c);

// ── Energy (参考表2, report p. 90 / printed 78) ──
{
  const levels: Array<[Activity | null, string, string | null, string | null]> = [
    ['SEDENTARY', '低い', '- - - - - 1350 1600 1950 2300 2500 2250 2350 2250 2100 1850', '- - - - - 1250 1500 1850 2150 2050 1700 1750 1700 1650 1450'],
    ['MODERATE', 'ふつう', '- - - - - 1550 1850 2250 2600 2850 2600 2750 2650 2350 2250', '- - - - - 1450 1700 2100 2400 2300 1950 2050 1950 1850 1750'],
    ['ACTIVE', '高い', '- - - - - 1750 2100 2500 2900 3150 3000 3150 3000 2650 -', '- - - - - 1650 1900 2350 2700 2550 2250 2350 2250 2050 -'],
  ];
  for (const [act, label, m, f] of levels) {
    add({ page: P(90), label: `推定エネルギー必要量 ${label}`, compound: 'Energy', type: 'EER', unit: 'kcal', rows: 15, activity: act, m, f, preg: '+50,+250,+450|+350',
      note: `${label} (PAL ${act === 'SEDENTARY' ? '1.50' : act === 'MODERATE' ? '1.75' : '2.00'} for adults).` });
  }
  add({ page: P(90), label: '推定エネルギー必要量 ふつう (0-5 y)', compound: 'Energy', type: 'EER', unit: 'kcal', rows: 15, activity: null,
    m: '550 650 700 950 1300 - - - - - - - - - -', f: '500 600 650 900 1250 - - - - - - - - - -',
    note: 'Printed for ふつう only; applies at every activity level.' });
}
// ── Protein (p. 115) ──
add({ page: P(115), label: 'たんぱく質 推定平均必要量', compound: 'Protein', type: 'EAR', unit: 'g', rows: 15,
  m: '- - - 15 20 25 30 40 50 50 50 50 50 50 50', f: '- - - 15 20 25 30 40 45 45 40 40 40 40 40', preg: '+0,+5,+20|+15' });
add({ page: P(115), label: 'たんぱく質 推奨量', compound: 'Protein', type: 'RDA', unit: 'g', rows: 15,
  m: '- - - 20 25 30 40 45 60 65 65 65 65 60 60', f: '- - - 20 25 30 40 50 55 55 50 50 50 50 50', preg: '+0,+5,+25|+20' });
add({ page: P(115), label: 'たんぱく質 目安量', compound: 'Protein', type: 'AI', unit: 'g', rows: 15,
  m: '10 15 25 - - - - - - - - - - - -', f: '10 15 25 - - - - - - - - - - - -' });
add({ page: P(115), label: 'たんぱく質 目標量', compound: 'Protein', type: 'AMDR', unit: '%', pct: true, dg: true, rows: 15,
  m: '- - - 13~20 13~20 13~20 13~20 13~20 13~20 13~20 13~20 13~20 14~20 15~20 15~20',
  f: '- - - 13~20 13~20 13~20 13~20 13~20 13~20 13~20 13~20 13~20 14~20 15~20 15~20', preg: '13~20,13~20,15~20|15~20' });
// ── Fats (p. 138-140) ──
add({ page: P(138), label: '脂質 目安量', compound: 'Total Fat', type: 'AI', unit: '%', pct: true,
  m: '50 40 - - - - - - - - - - - -', f: '50 40 - - - - - - - - - - - -' });
const fatDg = '- - 20~30 20~30 20~30 20~30 20~30 20~30 20~30 20~30 20~30 20~30 20~30 20~30';
add({ page: P(138), label: '脂質 目標量', compound: 'Total Fat', type: 'AMDR', unit: '%', pct: true, dg: true, m: fatDg, f: fatDg, preg: '20~30|20~30' });
const sfa = '- - - 10< 10< 10< 10< 10< 9< 7< 7< 7< 7< 7<';
add({ page: P(139), label: '飽和脂肪酸 目標量', compound: 'Saturated Fat', type: 'CDRR', unit: '%', pct: true, dg: true, m: sfa, f: sfa, preg: '7<|7<',
  note: 'Printed "以下" (or less).' });
add({ page: P(140), label: 'n-6系脂肪酸 目安量', compound: 'Omega-6', type: 'AI', unit: 'g',
  m: '4 4 4 6 8 8 9 11 13 12 11 11 10 9', f: '4 4 4 6 7 8 9 11 11 9 9 9 9 8', preg: '9|9', note: 'Total n-6 fatty acids.' });
add({ page: P(140), label: 'n-3系脂肪酸 目安量', compound: 'Omega-3', type: 'AI', unit: 'g',
  m: '0.9 0.8 0.7 1.2 1.4 1.5 1.7 2.2 2.2 2.2 2.2 2.3 2.3 2.3', f: '0.9 0.8 0.7 1.0 1.2 1.4 1.7 1.7 1.7 1.7 1.7 1.9 2.0 2.0', preg: '1.7|1.7', note: 'Total n-3 fatty acids.' });
// ── Carbohydrates (p. 155-156) ──
const carb = '- - 50~65 50~65 50~65 50~65 50~65 50~65 50~65 50~65 50~65 50~65 50~65 50~65';
add({ page: P(155), label: '炭水化物 目標量', compound: 'Carbohydrates', type: 'AMDR', unit: '%', pct: true, dg: true, m: carb, f: carb, preg: '50~65|50~65', note: 'Includes alcohol.' });
add({ page: P(156), label: '食物繊維 目標量', compound: 'Dietary Fiber', type: 'AMDR', unit: 'g', dg: true,
  m: '- - - 8+ 10+ 11+ 13+ 17+ 19+ 20+ 22+ 22+ 21+ 20+', f: '- - - 8+ 9+ 11+ 13+ 16+ 18+ 18+ 18+ 18+ 18+ 17+', preg: '18+|18+', note: 'Printed "以上" (or more).' });
// ── Fat-soluble vitamins (p. 193-196) ──
add({ page: P(193), label: 'ビタミンA 推定平均必要量', compound: 'Vitamin A (RAE)', type: 'EAR', unit: 'µg RAE',
  m: '- - 300 350 350 350 450 550 650 600 650 650 600 550', f: '- - 250 350 350 350 400 500 500 450 500 500 500 450', preg: '+0,+0,+60|+300', note: 'Includes provitamin A carotenoids.' });
add({ page: P(193), label: 'ビタミンA 推奨量', compound: 'Vitamin A (RAE)', type: 'RDA', unit: 'µg RAE',
  m: '- - 400 500 500 500 600 800 900 850 900 900 850 800', f: '- - 350 500 500 500 600 700 650 650 700 700 700 650', preg: '+0,+0,+80|+450', note: 'Includes provitamin A carotenoids.' });
add({ page: P(193), label: 'ビタミンA 目安量', compound: 'Vitamin A (RAE)', type: 'AI', unit: 'µg RAE',
  m: '300 400 - - - - - - - - - - - -', f: '300 400 - - - - - - - - - - - -', note: 'Excludes provitamin A carotenoids.' });
const vaUl = '600 600 600 700 950 1200 1500 2100 2600 2700 2700 2700 2700 2700';
add({ page: P(193), label: 'ビタミンA 耐容上限量', compound: 'Retinol', type: 'UL', unit: 'µg', m: vaUl, f: vaUl, note: 'Printed as vitamin A (µg RAE); excludes provitamin A carotenoids.' });
const vdAi = '5.0 5.0 3.5 4.5 5.5 6.5 8.0 9.0 9.0 9.0 9.0 9.0 9.0 9.0';
add({ page: P(194), label: 'ビタミンD 目安量', compound: 'Vitamin D (Total)', type: 'AI', unit: 'µg', m: vdAi, f: vdAi, preg: '9.0|9.0' });
const vdUl = '25 25 25 30 40 40 60 80 90 100 100 100 100 100';
add({ page: P(194), label: 'ビタミンD 耐容上限量', compound: 'Vitamin D (Total)', type: 'UL', unit: 'µg', m: vdUl, f: vdUl });
add({ page: P(195), label: 'ビタミンE 目安量', compound: 'Vitamin E (Total)', type: 'AI', unit: 'mg α-TE',
  m: '3.0 4.0 3.0 4.0 4.5 5.0 5.0 6.5 7.0 6.5 6.5 6.5 7.5 7.0', f: '3.0 4.0 3.0 4.0 4.0 5.0 5.5 6.0 6.0 5.0 6.0 6.0 7.0 6.0', preg: '5.5|5.5', note: 'As α-tocopherol only.' });
add({ page: P(195), label: 'ビタミンE 耐容上限量', compound: 'Vitamin E (Total)', type: 'UL', unit: 'mg α-TE',
  m: '- - 150 200 300 350 450 650 750 800 800 800 800 800', f: '- - 150 200 300 350 450 600 650 650 700 700 700 650', note: 'As α-tocopherol only.' });
add({ page: P(196), label: 'ビタミンK 目安量', compound: 'Vitamin K (Total)', type: 'AI', unit: 'µg',
  m: '4 7 50 60 80 90 110 140 150 150 150 150 150 150', f: '4 7 60 70 90 110 130 150 150 150 150 150 150 150', preg: '150|150' });
// ── Water-soluble vitamins (p. 246-254) ──
const both2 = (a: string) => `${a} - - - - - - - - - - - -`;
add({ page: P(246), label: 'ビタミンB1 推定平均必要量', compound: 'Thiamin (B1)', type: 'EAR', unit: 'mg',
  m: '- - 0.3 0.4 0.5 0.6 0.7 0.8 0.9 0.8 0.8 0.8 0.7 0.7', f: '- - 0.3 0.4 0.4 0.5 0.6 0.7 0.7 0.6 0.6 0.6 0.6 0.5', preg: '+0.1|+0.2', note: 'As thiamine chloride hydrochloride.' });
add({ page: P(246), label: 'ビタミンB1 推奨量', compound: 'Thiamin (B1)', type: 'RDA', unit: 'mg',
  m: '- - 0.4 0.5 0.7 0.8 0.9 1.1 1.2 1.1 1.2 1.1 1.0 1.0', f: '- - 0.4 0.5 0.6 0.7 0.9 1.0 1.0 0.8 0.9 0.8 0.8 0.7', preg: '+0.2|+0.2', note: 'As thiamine chloride hydrochloride.' });
add({ page: P(246), label: 'ビタミンB1 目安量', compound: 'Thiamin (B1)', type: 'AI', unit: 'mg', m: both2('0.1 0.2'), f: both2('0.1 0.2') });
add({ page: P(247), label: 'ビタミンB2 推定平均必要量', compound: 'Riboflavin (B2)', type: 'EAR', unit: 'mg',
  m: '- - 0.5 0.7 0.8 0.9 1.1 1.3 1.4 1.3 1.4 1.3 1.2 1.1', f: '- - 0.5 0.6 0.7 0.9 1.1 1.2 1.2 1.0 1.0 1.0 0.9 0.9', preg: '+0.2|+0.5' });
add({ page: P(247), label: 'ビタミンB2 推奨量', compound: 'Riboflavin (B2)', type: 'RDA', unit: 'mg',
  m: '- - 0.6 0.8 0.9 1.1 1.4 1.6 1.7 1.6 1.7 1.6 1.4 1.4', f: '- - 0.5 0.8 0.9 1.0 1.3 1.4 1.4 1.2 1.2 1.2 1.1 1.1', preg: '+0.3|+0.6' });
add({ page: P(247), label: 'ビタミンB2 目安量', compound: 'Riboflavin (B2)', type: 'AI', unit: 'mg', m: both2('0.3 0.4'), f: both2('0.3 0.4') });
add({ page: P(248), label: 'ナイアシン 推定平均必要量', compound: 'Niacin (B3)', type: 'EAR', unit: 'mg NE',
  m: '- - 5 6 7 9 11 12 14 13 13 13 11 11', f: '- - 4 6 7 8 10 12 11 9 10 9 9 8', preg: '+0|+3' });
add({ page: P(248), label: 'ナイアシン 推奨量', compound: 'Niacin (B3)', type: 'RDA', unit: 'mg NE',
  m: '- - 6 8 9 11 13 15 16 15 16 15 14 13', f: '- - 5 7 8 10 12 14 13 11 12 11 11 10', preg: '+0|+3' });
add({ page: P(248), label: 'ナイアシン 目安量', compound: 'Niacin (B3)', type: 'AI', unit: 'mg NE', m: '- 3 - - - - - - - - - - - -', f: '- 3 - - - - - - - - - - - -' });
COLS.push({ page: P(248), label: 'ナイアシン 目安量 (0-5 months)', compound: 'Niacin (B3)', type: 'AI', unit: 'mg', m: '2 - - - - - - - - - - - - -', f: '2 - - - - - - - - - - - - -', note: 'Printed in mg niacin for 0-5 months (footnote 4).' });
add({ page: P(248), label: 'ナイアシン 耐容上限量 (ニコチンアミド)', compound: 'Nicotinamide', type: 'UL', unit: 'mg',
  m: '- - 60 80 100 150 200 250 300 300 350 350 300 300', f: '- - 60 80 100 150 200 250 250 250 250 250 250 250', note: 'Printed as niacin UL, nicotinamide weight (footnote 3).' });
add({ page: P(248), label: 'ナイアシン 耐容上限量 (ニコチン酸)', compound: 'Nicotinic Acid', type: 'UL', unit: 'mg',
  m: '- - 15 20 30 35 45 60 70 80 85 85 80 75', f: '- - 15 20 30 35 45 60 65 65 65 65 65 60', note: 'Printed in parentheses as nicotinic acid weight (footnote 3).' });
add({ page: P(249), label: 'ビタミンB6 推定平均必要量', compound: 'Vitamin B6', type: 'EAR', unit: 'mg',
  m: '- - 0.4 0.5 0.6 0.8 0.9 1.2 1.2 1.2 1.2 1.2 1.2 1.2', f: '- - 0.4 0.5 0.6 0.8 1.0 1.1 1.1 1.0 1.0 1.0 1.0 1.0', preg: '+0.2|+0.3' });
add({ page: P(249), label: 'ビタミンB6 推奨量', compound: 'Vitamin B6', type: 'RDA', unit: 'mg',
  m: '- - 0.5 0.6 0.7 0.9 1.0 1.4 1.5 1.5 1.5 1.5 1.4 1.4', f: '- - 0.5 0.6 0.7 0.9 1.2 1.3 1.3 1.2 1.2 1.2 1.2 1.2', preg: '+0.2|+0.3' });
add({ page: P(249), label: 'ビタミンB6 目安量', compound: 'Vitamin B6', type: 'AI', unit: 'mg', m: both2('0.2 0.3'), f: both2('0.2 0.3') });
add({ page: P(249), label: 'ビタミンB6 耐容上限量', compound: 'Vitamin B6', type: 'UL', unit: 'mg',
  m: '- - 10 15 20 25 30 40 50 55 60 60 55 50', f: '- - 10 15 20 25 30 40 45 45 45 45 45 40', note: 'As pyridoxine.' });
const b12 = '0.4 0.9 1.5 1.5 2.0 2.5 3.0 4.0 4.0 4.0 4.0 4.0 4.0 4.0';
add({ page: P(250), label: 'ビタミンB12 目安量', compound: 'Vitamin B12 (Total)', type: 'AI', unit: 'µg', m: b12, f: b12, preg: '4.0|4.0', note: 'As cyanocobalamin.' });
const folEar = '- - 70 80 110 130 150 190 200 200 200 200 200 200';
const folRda = '- - 90 100 130 150 180 230 240 240 240 240 240 240';
add({ page: P(251), label: '葉酸 推定平均必要量', compound: 'Folate (Total)', type: 'EAR', unit: 'µg', m: folEar, f: folEar, preg: '+0,+200|+80', note: 'As pteroylmonoglutamic acid.' });
add({ page: P(251), label: '葉酸 推奨量', compound: 'Folate (Total)', type: 'RDA', unit: 'µg', m: folRda, f: folRda, preg: '+0,+240|+100', note: 'As pteroylmonoglutamic acid.' });
add({ page: P(251), label: '葉酸 目安量', compound: 'Folate (Total)', type: 'AI', unit: 'µg', m: both2('40 70'), f: both2('40 70') });
const folUl = '- - 200 300 400 500 700 900 900 900 1000 1000 900 900';
add({ page: P(251), label: '葉酸 耐容上限量', compound: 'Folic Acid (Synthetic)', type: 'UL', unit: 'µg', m: folUl, f: folUl, supp: true,
  note: 'Applies to folic acid in foods other than ordinary foods (footnote 2).' });
add({ page: P(252), label: 'パントテン酸 目安量', compound: 'Pantothenic Acid (B5)', type: 'AI', unit: 'mg',
  m: '4 3 3 4 5 6 6 7 7 6 6 6 6 6', f: '4 3 3 4 5 6 6 6 6 5 5 5 5 5', preg: '5|6' });
const bio = '4 10 20 20 30 30 40 50 50 50 50 50 50 50';
add({ page: P(253), label: 'ビオチン 目安量', compound: 'Biotin (B7)', type: 'AI', unit: 'µg', m: bio, f: bio, preg: '50|50' });
const vcEar = '- - 30 35 40 50 60 75 80 80 80 80 80 80';
const vcRda = '- - 35 40 50 60 70 90 100 100 100 100 100 100';
add({ page: P(254), label: 'ビタミンC 推定平均必要量', compound: 'Vitamin C (Total)', type: 'EAR', unit: 'mg', m: vcEar, f: vcEar, preg: '+10|+40', note: 'As L-ascorbic acid.' });
add({ page: P(254), label: 'ビタミンC 推奨量', compound: 'Vitamin C (Total)', type: 'RDA', unit: 'mg', m: vcRda, f: vcRda, preg: '+10|+45', note: 'As L-ascorbic acid.' });
add({ page: P(254), label: 'ビタミンC 目安量', compound: 'Vitamin C (Total)', type: 'AI', unit: 'mg', m: both2('40 40'), f: both2('40 40') });
// ── Macrominerals (p. 293-297) ──
add({ page: P(293), label: 'ナトリウム 推定平均必要量', compound: 'Sodium', type: 'EAR', unit: 'mg',
  m: '- - - - - - - - - 600 600 600 600 600', f: '- - - - - - - - - 600 600 600 600 600', preg: '600|600', note: 'Salt equivalent 1.5 g.' });
add({ page: P(293), label: 'ナトリウム 目安量', compound: 'Sodium', type: 'AI', unit: 'mg', m: both2('100 600'), f: both2('100 600'), note: 'Salt equivalent printed in parentheses (0.3 g / 1.5 g).' });
add({ page: P(294), label: 'カリウム 目安量', compound: 'Potassium', type: 'AI', unit: 'mg',
  m: '400 700 900 1100 1300 1600 1900 2400 2800 2500 2500 2500 2500 2500', f: '400 700 800 1000 1200 1400 1800 2200 2000 2000 2000 2000 2000 2000', preg: '2000|2000' });
add({ page: P(294), label: 'カリウム 目標量', compound: 'Potassium', type: 'AMDR', unit: 'mg', dg: true,
  m: '- - - 1600+ 1800+ 2000+ 2200+ 2600+ 3000+ 3000+ 3000+ 3000+ 3000+ 3000+', f: '- - - 1400+ 1600+ 1800+ 2000+ 2400+ 2600+ 2600+ 2600+ 2600+ 2600+ 2600+', preg: '2600+|2600+', note: 'Printed "以上" (or more).' });
add({ page: P(295), label: 'カルシウム 推定平均必要量', compound: 'Calcium', type: 'EAR', unit: 'mg',
  m: '- - 350 500 500 550 600 850 650 650 650 600 600 600', f: '- - 350 450 450 600 600 700 550 550 550 550 550 500', preg: '+0|+0' });
add({ page: P(295), label: 'カルシウム 推奨量', compound: 'Calcium', type: 'RDA', unit: 'mg',
  m: '- - 450 600 600 650 700 1000 800 800 750 750 750 750', f: '- - 400 550 550 750 750 800 650 650 650 650 650 600', preg: '+0|+0' });
add({ page: P(295), label: 'カルシウム 目安量', compound: 'Calcium', type: 'AI', unit: 'mg', m: both2('200 250'), f: both2('200 250') });
const caUl = '- - - - - - - - - 2500 2500 2500 2500 2500';
add({ page: P(295), label: 'カルシウム 耐容上限量', compound: 'Calcium', type: 'UL', unit: 'mg', m: caUl, f: caUl });
add({ page: P(296), label: 'マグネシウム 推定平均必要量', compound: 'Magnesium', type: 'EAR', unit: 'mg',
  m: '- - 60 80 110 140 180 250 300 280 320 310 290 270', f: '- - 60 80 110 140 180 240 260 230 240 240 240 220', preg: '+30|+0' });
add({ page: P(296), label: 'マグネシウム 推奨量', compound: 'Magnesium', type: 'RDA', unit: 'mg',
  m: '- - 70 100 130 170 210 290 360 340 380 370 350 330', f: '- - 70 100 130 160 220 290 310 280 290 290 280 270', preg: '+40|+0' });
add({ page: P(296), label: 'マグネシウム 目安量', compound: 'Magnesium', type: 'AI', unit: 'mg', m: both2('20 60'), f: both2('20 60') });
add({ page: P(297), label: 'リン 目安量', compound: 'Phosphorus', type: 'AI', unit: 'mg',
  m: '120 260 600 700 900 1000 1100 1200 1200 1000 1000 1000 1000 1000', f: '120 260 500 700 800 900 1000 1100 1000 800 800 800 800 800', preg: '800|800' });
add({ page: P(297), label: 'リン 耐容上限量', compound: 'Phosphorus', type: 'UL', unit: 'mg', m: caUl.replace(/2500/g, '3000'), f: caUl.replace(/2500/g, '3000') });
// ── Microminerals (p. 357-364) ──
add({ page: P(357), label: '鉄 推定平均必要量', compound: 'Iron (Total)', type: 'EAR', unit: 'mg',
  m: '- 3.5 3.0 3.5 4.5 5.5 6.5 7.5 7.5 5.5 6.0 6.0 5.5 5.5', f: '- 3.0 3.0 3.5 4.5 6.0 8.5 9.0 7.5 7.0 7.5 7.5 5.0 4.5', preg: '+2.0,+7.0|+1.5' });
add({ page: P(357), label: '鉄 推奨量', compound: 'Iron (Total)', type: 'RDA', unit: 'mg',
  m: '- 4.5 4.0 5.0 6.0 7.5 9.5 9.0 9.0 7.0 7.5 7.0 7.0 6.5', f: '- 4.5 4.0 5.0 6.0 8.0 12.5 12.5 11.0 10.0 10.5 10.5 6.0 5.5', preg: '+2.5,+8.5|+2.0' });
add({ page: P(357), label: '鉄 目安量', compound: 'Iron (Total)', type: 'AI', unit: 'mg', m: '0.5 - - - - - - - - - - - - -', f: '0.5 - - - - - - - - - - - - -' });
add({ page: P(359), label: '銅 推定平均必要量', compound: 'Copper', type: 'EAR', unit: 'mg',
  m: '- - 0.3 0.3 0.4 0.4 0.5 0.7 0.8 0.7 0.8 0.7 0.7 0.7', f: '- - 0.2 0.3 0.4 0.4 0.5 0.6 0.6 0.6 0.6 0.6 0.6 0.6', preg: '+0.1|+0.5' });
add({ page: P(359), label: '銅 推奨量', compound: 'Copper', type: 'RDA', unit: 'mg',
  m: '- - 0.3 0.4 0.4 0.5 0.6 0.8 0.9 0.8 0.9 0.9 0.8 0.8', f: '- - 0.3 0.3 0.4 0.5 0.6 0.8 0.7 0.7 0.7 0.7 0.7 0.7', preg: '+0.1|+0.6' });
add({ page: P(359), label: '銅 目安量', compound: 'Copper', type: 'AI', unit: 'mg', m: both2('0.3 0.4'), f: both2('0.3 0.4') });
const cuUl = '- - - - - - - - - 7 7 7 7 7';
add({ page: P(359), label: '銅 耐容上限量', compound: 'Copper', type: 'UL', unit: 'mg', m: cuUl, f: cuUl });
add({ page: P(358), label: '亜鉛 推定平均必要量', compound: 'Zinc', type: 'EAR', unit: 'mg',
  m: '- - 2.5 3.0 3.5 4.0 5.5 7.0 8.5 7.5 8.0 8.0 7.5 7.5', f: '- - 2.0 2.5 3.0 4.0 5.5 6.5 6.0 6.0 6.5 6.5 6.5 6.0', preg: '+0.0,+2.0|+2.5' });
add({ page: P(358), label: '亜鉛 推奨量', compound: 'Zinc', type: 'RDA', unit: 'mg',
  m: '- - 3.5 4.0 5.0 5.5 8.0 8.5 10.0 9.0 9.5 9.5 9.0 9.0', f: '- - 3.0 3.5 4.5 5.5 7.5 8.5 8.0 7.5 8.0 8.0 7.5 7.0', preg: '+0.0,+2.0|+3.0' });
add({ page: P(358), label: '亜鉛 目安量', compound: 'Zinc', type: 'AI', unit: 'mg', m: both2('1.5 2.0'), f: both2('1.5 2.0') });
add({ page: P(358), label: '亜鉛 耐容上限量', compound: 'Zinc', type: 'UL', unit: 'mg', m: '- - - - - - - - - 40 45 45 45 40', f: '- - - - - - - - - 35 35 35 35 35' });
add({ page: P(360), label: 'マンガン 目安量', compound: 'Manganese', type: 'AI', unit: 'mg',
  m: '0.01 0.5 1.5 2.0 2.0 2.5 3.0 3.5 3.5 3.5 3.5 3.5 3.5 3.5', f: '0.01 0.5 1.5 2.0 2.0 2.5 3.0 3.0 3.0 3.0 3.0 3.0 3.0 3.0', preg: '3.0|3.0' });
const mnUl = '- - - - - - - - - 11 11 11 11 11';
add({ page: P(360), label: 'マンガン 耐容上限量', compound: 'Manganese', type: 'UL', unit: 'mg', m: mnUl, f: mnUl });
const iEar = '- - 35 40 55 65 75 100 100 100 100 100 100 100';
const iRda = '- - 50 60 75 90 110 140 140 140 140 140 140 140';
add({ page: P(361), label: 'ヨウ素 推定平均必要量', compound: 'Iodine', type: 'EAR', unit: 'µg', m: iEar, f: iEar, preg: '+75|+100' });
add({ page: P(361), label: 'ヨウ素 推奨量', compound: 'Iodine', type: 'RDA', unit: 'µg', m: iRda, f: iRda, preg: '+110|+140' });
add({ page: P(361), label: 'ヨウ素 目安量', compound: 'Iodine', type: 'AI', unit: 'µg', m: both2('100 130'), f: both2('100 130') });
const iUl = '250 350 600 900 1200 1500 2000 2500 3000 3000 3000 3000 3000 3000';
add({ page: P(361), label: 'ヨウ素 耐容上限量', compound: 'Iodine', type: 'UL', unit: 'µg', m: iUl, f: iUl, preg: '2000|2000' });
add({ page: P(362), label: 'セレン 推定平均必要量', compound: 'Selenium', type: 'EAR', unit: 'µg',
  m: '- - 10 10 15 15 20 25 30 25 25 25 25 25', f: '- - 10 10 15 15 20 25 20 20 20 20 20 20', preg: '+5|+15' });
add({ page: P(362), label: 'セレン 推奨量', compound: 'Selenium', type: 'RDA', unit: 'µg',
  m: '- - 10 15 15 20 25 30 35 30 35 30 30 30', f: '- - 10 10 15 20 25 30 25 25 25 25 25 25', preg: '+5|+20' });
add({ page: P(362), label: 'セレン 目安量', compound: 'Selenium', type: 'AI', unit: 'µg', m: both2('15 15'), f: both2('15 15') });
add({ page: P(362), label: 'セレン 耐容上限量', compound: 'Selenium', type: 'UL', unit: 'µg',
  m: '- - 100 100 150 200 250 350 400 400 450 450 450 400', f: '- - 100 100 150 200 250 300 350 350 350 350 350 350' });
const crAi = '0.8 1.0 - - - - - - - 10 10 10 10 10';
add({ page: P(363), label: 'クロム 目安量', compound: 'Chromium', type: 'AI', unit: 'µg', m: crAi, f: crAi, preg: '10|10' });
const crUl = '- - - - - - - - - 500 500 500 500 500';
add({ page: P(363), label: 'クロム 耐容上限量', compound: 'Chromium', type: 'UL', unit: 'µg', m: crUl, f: crUl });
add({ page: P(364), label: 'モリブデン 推定平均必要量', compound: 'Molybdenum', type: 'EAR', unit: 'µg',
  m: '- - 10 10 10 15 15 20 25 20 25 25 20 20', f: '- - 10 10 10 15 15 20 20 20 20 20 20 20', preg: '+0|+2.5' });
add({ page: P(364), label: 'モリブデン 推奨量', compound: 'Molybdenum', type: 'RDA', unit: 'µg',
  m: '- - 10 10 15 20 20 25 30 30 30 30 30 25', f: '- - 10 10 15 15 20 25 25 25 25 25 25 25', preg: '+0|+3.5' });
add({ page: P(364), label: 'モリブデン 目安量', compound: 'Molybdenum', type: 'AI', unit: 'µg', m: both2('2.5 3.0'), f: both2('2.5 3.0') });
add({ page: P(364), label: 'モリブデン 耐容上限量', compound: 'Molybdenum', type: 'UL', unit: 'µg', m: '- - - - - - - - - 600 600 600 600 600', f: '- - - - - - - - - 500 500 500 500 500' });

for (const c of COLS) {
  if (c.compound === 'Iron (Total)') IRON_NOT_MENSTRUATING = c.type === 'EAR' ? IRON_NOT_MENSTRUATING_EAR : IRON_NOT_MENSTRUATING_RDA;
  column(c);
}

// Sodium DG: salt equivalent (g) -> sodium mg (report p. 293).
{
  const salt: Record<Sex, string> = { MALE: '- - 3.0 3.5 4.5 5.0 6.0 7.0 7.5 7.5 7.5 7.5 7.5 7.5', FEMALE: '- - 2.5 3.5 4.5 5.0 6.0 6.5 6.5 6.5 6.5 6.5 6.5 6.5' };
  const push = (sex: Sex, stage: LifeStage, age: Age, g: number, label: string) => {
    const na = r4((g * 1000) / 2.54);
    out.push({ compound: 'Sodium', valueType: 'CDRR', sex, lifeStage: stage, ageMinMonths: age[0], ageMaxMonths: age[1], activityLevel: null, dietaryContext: null,
      value: na, valueMin: null, valueMax: na, unit: 'mg', isPercentOfEnergy: false, isProvisional: false, supplementalOnly: false,
      note: `目標量 printed as salt equivalent < ${g.toFixed(1)} g/day; sodium = salt × 1000 / 2.54 (the table's 600 mg = 1.5 g).`, from: `${P(293)}, ナトリウム 目標量 (食塩相当量), ${label}` });
  };
  for (const sex of ['MALE', 'FEMALE'] as Sex[]) {
    salt[sex].split(' ').forEach((t, i) => { if (t !== '-') push(sex, 'NONE', R14[i][1], Number(t), `${sex === 'MALE' ? '男性' : '女性'} ${R14[i][0]}`); });
  }
  push('FEMALE', 'PREGNANT', W18_49, 6.5, '妊婦');
  push('FEMALE', 'LACTATING', W18_49, 6.5, '授乳婦');
}
// Iron, menstruating women: note the not-menstruating alternative.
for (const v of out) {
  if (v.compound !== 'Iron (Total)' || v.sex !== 'FEMALE' || v.lifeStage !== 'NONE' || v.ageMinMonths < 120 || v.ageMinMonths > 600) continue;
  const i = R14.findIndex(([, a]) => a[0] === v.ageMinMonths);
  const alt = (v.valueType === 'EAR' ? IRON_NOT_MENSTRUATING_EAR : IRON_NOT_MENSTRUATING_RDA)[i];
  v.note = `月経あり (menstruating). 月経なし (not menstruating): ${alt} mg.`;
}
// Magnesium UL (footnote, non-food sources only), adults.
for (const sex of ['MALE', 'FEMALE'] as Sex[]) {
  out.push({ compound: 'Magnesium', valueType: 'UL', sex, lifeStage: 'NONE', ageMinMonths: 216, ageMaxMonths: null, activityLevel: null, dietaryContext: null,
    value: 350, valueMin: null, valueMax: null, unit: 'mg', isPercentOfEnergy: false, isProvisional: false, supplementalOnly: true,
    note: 'UL for intake from sources other than ordinary foods (footnote 1); no UL for ordinary foods. Children: 5 mg/kg body weight/day (not stored).',
    from: `${P(296)}, マグネシウム 耐容上限量 footnote 1, adults` });
}

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths || (a.activityLevel ?? '').localeCompare(b.activityLevel ?? ''));
writeFileSync(path.join(process.cwd(), 'dv-sources', 'mhlw-2025', 'values.json'), JSON.stringify(out, null, 1) + '\n');
const byType: Record<string, number> = {};
for (const v of out) byType[v.valueType] = (byType[v.valueType] ?? 0) + 1;
console.log(`Wrote ${out.length} values to dv-sources/mhlw-2025/values.json`, byType);
