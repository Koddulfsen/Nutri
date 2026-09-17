/**
 * Taiwan — HPA "國人膳食營養素參考攝取量及其說明 第八版" (DRIs 8th edition; announced 2022, book Dec 2023)
 * -> values.json.
 *
 * Transcribed cell by cell, 2026-09-16, from the total table (總表) on printed pages 718-722 and the UL
 * table on page 724 of ntshb-backup.pdf. The pages' text layer is scrambled, so renders were read
 * (source/total-718.png ... total-724.png; the UL page is rotated and was checked at 300 dpi).
 * Vitamin B6 has no column in the total table; its values come from the table closing the B6 chapter
 * ("臺灣 2010 維生素 B6 每日攝取參考量", printed page 330), whose ULs match page 724.
 *
 * Mapping decisions:
 *   - "Values not marked AI are RDA" (table footnote *). Columns headed AI (vitamins D, E, K, choline,
 *     biotin, pantothenic acid, calcium, phosphorus, zinc, fluoride, potassium, fibre) -> AI; cells
 *     written "AI=x" -> AI; everything else -> RDA. Carbohydrate EAR / RDA as headed; fat, fatty acids and
 *     carbohydrate % energy -> AMDR ranges, "<x%" -> CDRR ceiling; infant total fat "50%(AI)" -> AI.
 *     Sodium is headed CDRR (ceiling); the infant "100(AI)" / "320(AI)" cells -> AI.
 *   - Activity: 低 / 稍低 / 適度 / 高 are PAL 1.3 / 1.5 / 1.7 / 1.9 (energy chapter, 表三) -> SEDENTARY /
 *     MODERATE / ACTIVE / VERY_ACTIVE. Energy and fibre are printed per level.
 *   - Pregnancy is printed per trimester (第一/二/三期) and lactation once, all as "+x". Stored as totals
 *     over women 19-30 y and 31-50 y (per activity level for energy and fibre). "+0" is stored as the base.
 *     UL cells are absolute and stored once for women 19-50 y.
 *   - Iron pregnancy T3 / lactation "+30": footnote 5 advises 30 mg/day of iron salts from the third
 *     trimester to two months after delivery; kept as printed (total) with the note.
 *   - Infant energy (kcal/kg) and protein (g/kg) are per kg and not stored.
 *   - Vitamin A µg RE, vitamin E mg α-TE, niacin mg NE. Niacin UL is printed as one value (mg NE) and
 *     stored under Niacin (B3). Magnesium UL is "non-food magnesium" -> supplementalOnly. Iron UL
 *     excludes non-fortified food iron (applies to fortified foods and supplements) -> supplementalOnly.
 *   - n-3 PUFA is printed as α-linolenic acid, EPA and DHA together -> Omega-3 (total n-3).
 *
 * Page 722 prints the fluoride / sodium / potassium columns twice with identical values; read once.
 *
 * Run: npx tsx dv-sources/taiwan-dri-8/extract.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage, Activity } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
const out: SourceValue[] = [];
const r4 = (x: number) => Number(x.toFixed(4));
const BOTH: Sex[] = ['MALE', 'FEMALE'];

// The 12 age rows, in table order.
const AGES: Array<[string, Age]> = [
  ['0-6月', [0, 5]], ['7-12月', [6, 11]], ['1-3歲', [12, 47]], ['4-6歲', [48, 83]], ['7-9歲', [84, 119]], ['10-12歲', [120, 155]],
  ['13-15歲', [156, 191]], ['16-18歲', [192, 227]], ['19-30歲', [228, 371]], ['31-50歲', [372, 611]], ['51-70歲', [612, 851]], ['71歲-', [852, null]],
];
const W19 = 8; const W31 = 9;
const ACT: Record<string, [Activity, string]> = { L: ['SEDENTARY', '低 (PAL 1.3)'], LA: ['MODERATE', '稍低 (PAL 1.5)'], A: ['ACTIVE', '適度 (PAL 1.7)'], H: ['VERY_ACTIVE', '高 (PAL 1.9)'] };

function push(p: { compound: string; type: DvValueType; sex: Sex; stage?: LifeStage; age: Age; value: number; min?: number | null; max?: number | null; unit: string; pct?: boolean; supp?: boolean; activity?: Activity | null; note?: string | null; from: string }) {
  out.push({
    compound: p.compound, valueType: p.type, sex: p.sex, lifeStage: p.stage ?? 'NONE', ageMinMonths: p.age[0], ageMaxMonths: p.age[1],
    activityLevel: p.activity ?? null, dietaryContext: null, value: p.value, valueMin: p.min ?? null, valueMax: p.max ?? (p.type === 'CDRR' ? p.value : null),
    unit: p.unit, isPercentOfEnergy: p.pct ?? false, isProvisional: false, supplementalOnly: p.supp ?? false, note: p.note ?? null, from: p.from,
  });
}

/**
 * A nutrient column. cells: 12 age tokens; a token is "-" (blank), "x" (both sexes), "m/f", or "AI=x"
 * (AI marking, both sexes). preg: 3 trimester tokens; lact: 1 token ("+x" or absolute, or "-").
 */
interface Col { compound: string; type: DvValueType; unit: string; cells: string; preg?: string; lact?: string; note?: string; supp?: boolean; page: string; label: string; activity?: string }

function column(c: Col) {
  const t = c.cells.trim().split(/\s+/);
  if (t.length !== 12) throw new Error(`${c.label}: ${t.length} cells`);
  const act = c.activity ? ACT[c.activity] : null;
  const from = (row: string) => `${c.page}, ${c.label}${act ? ` ${act[1]}` : ''}, ${row}`;
  const parsed: Array<null | { type: DvValueType; m: number; f: number }> = t.map((tok) => {
    if (tok === '-') return null;
    let type = c.type; let s = tok;
    if (s.startsWith('AI=')) { type = 'AI'; s = s.slice(3); }
    const [a, b] = s.split('/').map(Number);
    if (Number.isNaN(a) || (b !== undefined && Number.isNaN(b))) throw new Error(`${c.label}: "${tok}"`);
    return { type, m: a, f: b ?? a };
  });
  parsed.forEach((p, i) => {
    if (!p) return;
    const [label, age] = AGES[i];
    for (const sex of BOTH) push({ compound: c.compound, type: p.type, sex, age, value: sex === 'MALE' ? p.m : p.f, unit: c.unit, supp: c.supp, activity: act?.[0], note: c.note, from: from(label) });
  });
  const stage = (tok: string, st: LifeStage, label: string) => {
    if (tok === '-') return;
    if (!tok.startsWith('+')) {
      push({ compound: c.compound, type: c.type, sex: 'FEMALE', stage: st, age: [228, 611], value: Number(tok), unit: c.unit, supp: c.supp, activity: act?.[0], note: c.note, from: from(label) });
      return;
    }
    for (const [bi, band] of [[W19, '19-30'], [W31, '31-50']] as const) {
      const base = parsed[bi];
      if (!base) throw new Error(`${c.label}: increment with no base`);
      push({ compound: c.compound, type: base.type, sex: 'FEMALE', stage: st, age: AGES[bi][1], value: r4(base.f + Number(tok.slice(1))), unit: c.unit, supp: c.supp, activity: act?.[0],
        note: [c.note, `Printed as ${tok} over women ${band} y (${base.f}); stored as total.`].filter(Boolean).join(' '), from: `${from(label)} ${tok} over women ${band} y` });
    }
  };
  if (c.preg) {
    const p = c.preg.trim().split(/\s+/);
    if (p.length !== 3) throw new Error(`${c.label}: pregnancy cells`);
    stage(p[0], 'PREGNANT_T1', '懷孕第一期'); stage(p[1], 'PREGNANT_T2', '懷孕第二期'); stage(p[2], 'PREGNANT_T3', '懷孕第三期');
  }
  if (c.lact) stage(c.lact, 'LACTATING', '哺乳期');
}

const P718 = 'Total table p. 718'; const P720 = 'Total table p. 720'; const P721 = 'Total table p. 721'; const P722 = 'Total table p. 722'; const P724 = 'UL table p. 724';
//                              0-6  7-12  1-3  4-6  7-9  10-12  13-15  16-18  19-30  31-50  51-70  71+
const COLS: Col[] = [
  // ── p. 718 energy (by activity level), protein, carbohydrate, fibre ──
  { page: P718, label: '熱量', compound: 'Energy', type: 'EER', unit: 'kcal', activity: 'L', cells: '- - - - - - - 2150/1650 1850/1450 1800/1450 1700/1400 1650/1300', preg: '+0 +300 +300', lact: '+500' },
  { page: P718, label: '熱量', compound: 'Energy', type: 'EER', unit: 'kcal', activity: 'LA', cells: '- - 1150/1150 1550/1400 1800/1650 2050/1950 2400/2050 2500/1900 2150/1650 2100/1650 1950/1600 1900/1500', preg: '+0 +300 +300', lact: '+500' },
  { page: P718, label: '熱量', compound: 'Energy', type: 'EER', unit: 'kcal', activity: 'A', cells: '- - 1350/1350 1800/1650 2100/1900 2350/2250 2800/2350 2900/2250 2400/1900 2400/1900 2250/1800 2150/1700', preg: '+0 +300 +300', lact: '+500' },
  { page: P718, label: '熱量', compound: 'Energy', type: 'EER', unit: 'kcal', activity: 'H', cells: '- - - - - - - 3350/2550 2700/2100 2650/2100 2500/2000 -', preg: '+0 +300 +300', lact: '+500' },
  { page: P718, label: '蛋白質', compound: 'Protein', type: 'RDA', unit: 'g', cells: '- - 20 30 40 55/50 70/60 75/55 70/60 70/60 70/60 70/60', preg: '+10 +10 +10', lact: '+15' },
  { page: P718, label: '碳水化合物', compound: 'Carbohydrates', type: 'EAR', unit: 'g', cells: '- - 100 100 100 100 100 100 100 100 100 100', preg: '+0 +35 +35', lact: '+60', note: 'Set from brain glucose requirement (footnote 10).' },
  { page: P718, label: '碳水化合物', compound: 'Carbohydrates', type: 'RDA', unit: 'g', cells: 'AI=60 AI=95 130 130 130 130 130 130 130 130 130 130', preg: '+0 +45 +45', lact: '+80', note: 'Set from brain glucose requirement (footnote 10).' },
  { page: P718, label: '膳食纖維', compound: 'Dietary Fiber', type: 'AI', unit: 'g', activity: 'L', cells: '- - - - - - - 30/23 26/20 25/20 24/20 23/18', preg: '+0 +5 +5', lact: '+7' },
  { page: P718, label: '膳食纖維', compound: 'Dietary Fiber', type: 'AI', unit: 'g', activity: 'LA', cells: '- - 16 22/20 25/23 29/27 34/29 35/27 30/23 29/23 27/22 27/21', preg: '+0 +5 +5', lact: '+7' },
  { page: P718, label: '膳食纖維', compound: 'Dietary Fiber', type: 'AI', unit: 'g', activity: 'A', cells: '- - 19 25/23 29/27 33/32 39/33 41/32 34/27 34/27 32/25 30/24', preg: '+0 +5 +5', lact: '+7' },
  { page: P718, label: '膳食纖維', compound: 'Dietary Fiber', type: 'AI', unit: 'g', activity: 'H', cells: '- - - - - - - 47/36 38/29 37/29 35/28 -', preg: '+0 +5 +5', lact: '+7' },
  // ── p. 720 vitamins ──
  { page: P720, label: '維生素 A', compound: 'Vitamin A (RE)', type: 'RDA', unit: 'µg RE', cells: 'AI=400 AI=400 400 400 400 500 600/500 700/500 600/500 600/500 600/500 600/500', preg: '+0 +0 +100', lact: '+400', note: 'As retinol equivalents (1 µg RE = 1 µg retinol = 6 µg β-carotene).' },
  { page: P720, label: '維生素 D', compound: 'Vitamin D (Total)', type: 'AI', unit: 'µg', cells: '10 10 10 10 10 10 10 10 10 10 15 15', preg: '+0 +0 +0', lact: '+0' },
  { page: P720, label: '維生素 E', compound: 'Vitamin E (Total)', type: 'AI', unit: 'mg α-TE', cells: '3 4 5 6 8 10 12 13 12 12 12 12', preg: '+2 +2 +2', lact: '+3' },
  { page: P720, label: '維生素 K', compound: 'Vitamin K (Total)', type: 'AI', unit: 'µg', cells: '2.0 2.5 30 55 55 60 75 75 120/90 120/90 120/90 120/90', preg: '+0 +0 +0', lact: '+0' },
  { page: P720, label: '維生素 C', compound: 'Vitamin C (Total)', type: 'RDA', unit: 'mg', cells: 'AI=40 AI=50 40 50 60 80 100 100 100 100 100 100', preg: '+10 +10 +10', lact: '+40' },
  { page: P720, label: '維生素 B1', compound: 'Thiamin (B1)', type: 'RDA', unit: 'mg', cells: 'AI=0.3 AI=0.3 0.6 0.9/0.8 1.0/0.9 1.1/1.1 1.3/1.1 1.4/1.1 1.2/0.9 1.2/0.9 1.2/0.9 1.2/0.9', preg: '+0 +0.2 +0.2', lact: '+0.3' },
  { page: P720, label: '維生素 B2', compound: 'Riboflavin (B2)', type: 'RDA', unit: 'mg', cells: 'AI=0.3 AI=0.4 0.7 1/0.9 1.2/1.0 1.3/1.2 1.5/1.3 1.6/1.2 1.3/1.0 1.3/1.0 1.3/1.0 1.3/1.0', preg: '+0 +0.2 +0.2', lact: '+0.4' },
  { page: P720, label: '菸鹼素', compound: 'Niacin (B3)', type: 'RDA', unit: 'mg NE', cells: 'AI=2 AI=4 9 12/11 14/12 15/15 18/15 18/15 16/14 16/14 16/14 16/14', preg: '+0 +2 +2', lact: '+4' },
  // B6 from the chapter table (printed p. 330).
  { page: 'Vitamin B6 chapter table p. 330', label: '維生素 B6', compound: 'Vitamin B6', type: 'RDA', unit: 'mg', cells: 'AI=0.3 AI=0.3 0.5 0.6 0.8 1.3 1.4/1.3 1.5/1.3 1.5 1.5 1.6 1.6', preg: '1.9 1.9 1.9', lact: '1.9', note: 'Not in the total table; from the B6 chapter table (dated 2010, retained in the 8th edition).' },
  // ── p. 721 vitamins and minerals ──
  { page: P721, label: '維生素 B12', compound: 'Vitamin B12 (Total)', type: 'RDA', unit: 'µg', cells: 'AI=0.4 AI=0.6 0.9 1.2 1.5 2.0/2.2 2.4 2.4 2.4 2.4 2.4 2.4', preg: '+0.2 +0.2 +0.2', lact: '+0.4' },
  { page: P721, label: '葉酸', compound: 'Folate (Total)', type: 'RDA', unit: 'µg', cells: 'AI=70 AI=85 170 200 250 300 400 400 400 400 400 400', preg: '+200 +200 +200', lact: '+100' },
  { page: P721, label: '膽素', compound: 'Choline (Total)', type: 'AI', unit: 'mg', cells: '140 160 180 220 280 350/350 460/380 500/370 450/390 450/390 450/390 450/390', preg: '+20 +20 +20', lact: '+140' },
  { page: P721, label: '生物素', compound: 'Biotin (B7)', type: 'AI', unit: 'µg', cells: '5.0 6.5 9.0 12.0 16.0 20.0 25.0 27.0 30.0 30.0 30.0 30.0', preg: '+0 +0 +0', lact: '+5.0' },
  { page: P721, label: '泛酸', compound: 'Pantothenic Acid (B5)', type: 'AI', unit: 'mg', cells: '1.7 1.8 2.0 2.5 3.0 4.0 4.5 5.0 5.0 5.0 5.0 5.0', preg: '+1.0 +1.0 +1.0', lact: '+2.0' },
  { page: P721, label: '鈣', compound: 'Calcium', type: 'AI', unit: 'mg', cells: '300 400 500 600 800 1000 1200 1200 1000 1000 1000 1000', preg: '+0 +0 +0', lact: '+0' },
  { page: P721, label: '磷', compound: 'Phosphorus', type: 'AI', unit: 'mg', cells: '200 300 400 500 600 800 1000 1000 800 800 800 800', preg: '+0 +0 +0', lact: '+0' },
  { page: P721, label: '鎂', compound: 'Magnesium', type: 'RDA', unit: 'mg', cells: 'AI=25 AI=70 80 120 170 230/230 350/320 390/330 380/320 380/320 360/310 350/300', preg: '+35 +35 +35', lact: '+0' },
  { page: P721, label: '鐵', compound: 'Iron (Total)', type: 'RDA', unit: 'mg', cells: '7 10 10 10 10 15 15 15 10/15 10/15 10 10', preg: '+0 +0 +30', lact: '+30', note: 'Footnote 5: 30 mg/day of iron salts is advised from the third trimester to two months after delivery. 0-6 and 7-12 month values are unmarked (RDA by the table rule).' },
  { page: P721, label: '鋅', compound: 'Zinc', type: 'AI', unit: 'mg', cells: '5 5 5 5 8 10 15/12 15/12 15/12 15/12 15/12 15/12', preg: '+3 +3 +3', lact: '+3' },
  { page: P721, label: '碘', compound: 'Iodine', type: 'RDA', unit: 'µg', cells: 'AI=110 AI=130 65 90 100 120 150 150 150 150 150 150', preg: '+75 +75 +75', lact: '+100' },
  { page: P721, label: '硒', compound: 'Selenium', type: 'RDA', unit: 'µg', cells: 'AI=15 AI=20 20 25 30 40 50 55 55 55 55 55', preg: '+5 +5 +5', lact: '+15' },
  // ── p. 722 fluoride, sodium, potassium ──
  { page: P722, label: '氟', compound: 'Fluoride', type: 'AI', unit: 'mg', cells: '0.1 0.4 0.7 1.0 1.5 2.0 3.0 3.0 3.0 3.0 3.0 3.0', preg: '+0 +0 +0', lact: '+0' },
  { page: P722, label: '鈉', compound: 'Sodium', type: 'CDRR', unit: 'mg', cells: 'AI=100 AI=320 1300 1700 2000 2300 2300 2300 2300 2300 2300 2300', preg: '+0 +0 +0', lact: '+0' },
  { page: P722, label: '鉀', compound: 'Potassium', type: 'AI', unit: 'mg', cells: '400 900 1500 2100/1900 2400/2200 2700/2500 2800/2500 2800/2500 2800/2500 2800/2500 2800/2500 2800/2500', preg: '+0 +0 +0', lact: '+400' },
  // ── p. 724 UL (merged cells expanded per age row) ──
  { page: P724, label: '維生素 A UL', compound: 'Vitamin A (RE)', type: 'UL', unit: 'µg RE', cells: '600 600 600 900 900 1700 2800 2800 3000 3000 3000 3000', preg: '3000 3000 3000', lact: '3000' },
  { page: P724, label: '維生素 D UL', compound: 'Vitamin D (Total)', type: 'UL', unit: 'µg', cells: '25 25 50 50 50 50 50 50 50 50 50 50', preg: '50 50 50', lact: '50' },
  { page: P724, label: '維生素 E UL', compound: 'Vitamin E (Total)', type: 'UL', unit: 'mg α-TE', cells: '- - 200 300 300 600 800 800 1000 1000 1000 1000', preg: '1000 1000 1000', lact: '1000' },
  { page: P724, label: '維生素 C UL', compound: 'Vitamin C (Total)', type: 'UL', unit: 'mg', cells: '- - 400 650 650 1200 1800 1800 2000 2000 2000 2000', preg: '2000 2000 2000', lact: '2000' },
  { page: P724, label: '維生素 B6 UL', compound: 'Vitamin B6', type: 'UL', unit: 'mg', cells: '- - 30 40 40 60 60 80 80 80 80 80', preg: '80 80 80', lact: '80' },
  { page: P724, label: '菸鹼素 UL', compound: 'Niacin (B3)', type: 'UL', unit: 'mg NE', cells: '- - 10 15 20 25 30 30 35 35 35 35', preg: '35 35 35', lact: '35', note: 'Printed as a single niacin UL (mg NE), not split by form.' },
  { page: P724, label: '葉酸 UL', compound: 'Folate (Total)', type: 'UL', unit: 'µg', cells: '- - 300 400 500 700 800 900 1000 1000 1000 1000', preg: '1000 1000 1000', lact: '1000', note: 'Printed as folate UL; the table does not state the form.' },
  { page: P724, label: '膽素 UL', compound: 'Choline (Total)', type: 'UL', unit: 'mg', cells: '- - 1000 1000 1000 2000 2000 3000 3500 3500 3500 3500', preg: '3500 3500 3500', lact: '3500' },
  { page: P724, label: '鈣 UL', compound: 'Calcium', type: 'UL', unit: 'mg', cells: '1000 1500 2500 2500 2500 2500 2500 2500 2500 2500 2500 2500', preg: '2500 2500 2500', lact: '2500' },
  { page: P724, label: '磷 UL', compound: 'Phosphorus', type: 'UL', unit: 'mg', cells: '- - 3000 3000 3000 4000 4000 4000 4000 4000 4000 3000', preg: '3500 3500 3500', lact: '4000' },
  { page: P724, label: '鎂 UL', compound: 'Magnesium', type: 'UL', unit: 'mg', supp: true, note: 'Non-food magnesium (footnote †).', cells: '- - 65 110 110 350 350 350 350 350 350 350', preg: '350 350 350', lact: '350' },
  { page: P724, label: '鐵 UL', compound: 'Iron (Total)', type: 'UL', unit: 'mg', supp: true, note: 'Excludes iron in non-fortified foods; applies to fortified foods and supplements (footnote ‡).', cells: '30 30 30 30 30 30 40 40 40 40 40 40', preg: '40 40 40', lact: '40' },
  { page: P724, label: '鋅 UL', compound: 'Zinc', type: 'UL', unit: 'mg', cells: '7 7 9 11 15 22 29 35 35 35 35 35', preg: '35 35 35', lact: '35' },
  { page: P724, label: '碘 UL', compound: 'Iodine', type: 'UL', unit: 'µg', cells: '- - 200 300 400 600 800 1000 1000 1000 1000 1000', preg: '1000 1000 1000', lact: '1000' },
  { page: P724, label: '硒 UL', compound: 'Selenium', type: 'UL', unit: 'µg', cells: '40 60 90 135 185 280 400 400 400 400 400 400', preg: '400 400 400', lact: '400' },
  { page: P724, label: '氟 UL', compound: 'Fluoride', type: 'UL', unit: 'mg', cells: '0.7 0.9 1.3 2 3 10 10 10 10 10 10 10', preg: '10 10 10', lact: '10' },
];
for (const c of COLS) column(c);

// Sodium infant cells are AI, not ceilings.
for (const v of out) if (v.compound === 'Sodium' && v.valueType === 'AI') v.valueMax = null;

// ── p. 719 lipids and p. 718 carbohydrate % energy ──
{
  const page = 'Total table p. 719';
  const range = (compound: string, type: DvValueType, age: Age, stages: LifeStage[], lo: number | null, hi: number, label: string, note?: string) => {
    for (const stage of stages) for (const sex of stage === 'NONE' ? BOTH : (['FEMALE'] as Sex[])) {
      push({ compound, type, sex, stage, age: stage === 'NONE' ? age : [228, 611], value: lo == null ? hi : r4((lo + hi) / 2), min: lo, max: hi, unit: '%', pct: true, note, from: `${page}, ${label}` });
    }
  };
  const PL: LifeStage[] = ['PREGNANT_T1', 'PREGNANT_T2', 'PREGNANT_T3', 'LACTATING'];
  push({ compound: 'Total Fat', type: 'AI', sex: 'MALE', age: [0, 5], value: 50, unit: '%', pct: true, from: `${page}, 脂質 0-6月 50%(AI)` });
  push({ compound: 'Total Fat', type: 'AI', sex: 'FEMALE', age: [0, 5], value: 50, unit: '%', pct: true, from: `${page}, 脂質 0-6月 50%(AI)` });
  push({ compound: 'Total Fat', type: 'AI', sex: 'MALE', age: [6, 11], value: 40, unit: '%', pct: true, from: `${page}, 脂質 7-12月 40%(AI)` });
  push({ compound: 'Total Fat', type: 'AI', sex: 'FEMALE', age: [6, 11], value: 40, unit: '%', pct: true, from: `${page}, 脂質 7-12月 40%(AI)` });
  range('Total Fat', 'AMDR', [12, 47], ['NONE'], 30, 40, '脂質 1-3歲 30-40%');
  range('Total Fat', 'AMDR', [48, null], ['NONE', ...PL], 20, 30, '脂質 4歲以上 / 懷孕 / 哺乳 20-30%');
  range('Saturated Fat', 'CDRR', [12, null], ['NONE'], null, 10, '飽和脂肪酸 1歲以上 <10%');
  range('Omega-6', 'AMDR', [0, null], ['NONE', ...PL], 4, 8, 'n-6 多元不飽和脂肪酸 (亞麻油酸) 4-8%', 'Printed as n-6 PUFA (linoleic acid).');
  range('Omega-3', 'AMDR', [0, null], ['NONE', ...PL], 0.6, 1.2, 'n-3 多元不飽和脂肪酸 (次亞麻油酸、EPA、DHA) 0.6-1.2%', 'Total n-3: α-linolenic acid, EPA and DHA.');
  range('Trans Fat', 'CDRR', [0, null], ['NONE', ...PL], null, 1, '反式脂肪酸 <1%');
  range('Carbohydrates', 'AMDR', [12, null], ['NONE', ...PL], 50, 65, '碳水化合物 1歲以上 / 懷孕 / 哺乳 50-65% (p. 718)');
}

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.valueType.localeCompare(b.valueType) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths || (a.activityLevel ?? '').localeCompare(b.activityLevel ?? ''));
writeFileSync(path.join(process.cwd(), 'dv-sources', 'taiwan-dri-8', 'values.json'), JSON.stringify(out, null, 1) + '\n');
const byType: Record<string, number> = {};
for (const v of out) byType[v.valueType] = (byType[v.valueType] ?? 0) + 1;
console.log(`Wrote ${out.length} values to dv-sources/taiwan-dri-8/values.json`, byType);
