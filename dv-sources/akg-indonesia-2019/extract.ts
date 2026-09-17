/**
 * Indonesia — Peraturan Menteri Kesehatan No. 28 Tahun 2019 tentang Angka Kecukupan Gizi yang Dianjurkan untuk
 * Masyarakat Indonesia (AKG 2019) -> values.json.
 *
 * Transcribed 2026-09-17 from Lampiran I, Tabel 1 (energy, protein, fat, omega-3, omega-6, carbohydrate, fibre, water),
 * Tabel 2 (vitamins) and Tabel 3 (minerals), printed pages 7-14 of permenkes-28-2019.pdf (the Ministry's certified copy,
 * "Salinan sesuai dengan aslinya"). Rows were read from the text layer (pdftotext -layout) and every page checked against
 * its render in source/akg-07.png ... akg-14.png.
 *
 * Mapping and decisions:
 *   - AKG is the Indonesian RDA (Lampiran II: "recommended dietary allowances disebut juga dengan Angka Kecukupan Gizi"),
 *     so every nutrient is stored as RDA; energy as EER. The 0-5 month row is met by exclusive breastfeeding (footnote 1),
 *     noted on those rows. Body weight and height columns are not stored.
 *   - Age bands: 0-5 and 6-11 months; 1-3, 4-6, 7-9 y (both sexes); 10-12, 13-15, 16-18, 19-29, 30-49, 50-64, 65-80, 80+ y
 *     by sex. "65-80" and "80+" share age 80; 65-80 is stored as [780, 959] months and 80+ from 960.
 *   - Pregnancy (trimester 1-3) and lactation (first / second 6 months) are printed as increments ("+an"); stored as
 *     totals over women 19-29 y and 30-49 y (PREGNANT_T1..T3, LACTATING_0_6M / LACTATING_7_12M), including +0.
 *   - Tabel 2's header labels vitamin E "(mcg)", but the values (4-20) are mg α-tocopherol (15 mg adult, as IOM); stored
 *     as mg with a note. Vitamin A in RE -> Vitamin A (RE). Folate printed "(mcg)" without DFE: stored as µg.
 *   - Tabel 3: manganese 0-5 months "0.003" (the cell wraps to "0.00 / 3"). Selenium lactation second 6 months printed
 *     "±10", read as +10 (same as the first 6 months) and noted. Copper and chromium are in mcg.
 *   - Iron assumes 75% of iron from heme sources (footnote 2); zinc from high- and moderate-bioavailability sources
 *     (footnote 3). Energy uses physical activity factors 1.1 (<1 y), 1.14 (1-3 y), 1.26 (4-64 y), 1.12 (older).
 *   - Fibre 0 g for 0-5 months is not stored (no requirement, not a zero target).
 *
 * Run: npx tsx dv-sources/akg-indonesia-2019/extract.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex, LifeStage } from '../../lib/dv/source-values';
import type { DvValueType } from '../../lib/dv/value-types';

type Age = [number, number | null];
const out: SourceValue[] = [];
const BOTH: Sex[] = ['MALE', 'FEMALE'];
const r4 = (n: number) => Math.round(n * 10000) / 10000;

function push(compound: string, type: DvValueType, sex: Sex, stage: LifeStage, age: Age, value: number, unit: string, from: string, note: string | null) {
  out.push({
    compound, valueType: type, sex, lifeStage: stage, ageMinMonths: age[0], ageMaxMonths: age[1], activityLevel: null, dietaryContext: null,
    value, valueMin: null, valueMax: null, unit, isPercentOfEnergy: false, isProvisional: false, supplementalOnly: false, note, from,
  });
}

// Row order in every table: 5 child rows (both sexes), 8 male rows, 8 female rows, 3 pregnancy, 2 lactation.
const CHILD: Array<[string, Age]> = [['0-5 bulan', [0, 5]], ['6-11 bulan', [6, 11]], ['1-3 tahun', [12, 47]], ['4-6 tahun', [48, 83]], ['7-9 tahun', [84, 119]]];
const ADULT: Array<[string, Age]> = [['10-12 tahun', [120, 155]], ['13-15 tahun', [156, 191]], ['16-18 tahun', [192, 227]], ['19-29 tahun', [228, 359]],
  ['30-49 tahun', [360, 599]], ['50-64 tahun', [600, 779]], ['65-80 tahun', [780, 959]], ['80+ tahun', [960, null]]];
const W19 = 3; const W30 = 4; // indexes into ADULT
const STAGES: Array<[string, LifeStage]> = [['Hamil trimester 1', 'PREGNANT_T1'], ['Hamil trimester 2', 'PREGNANT_T2'], ['Hamil trimester 3', 'PREGNANT_T3'],
  ['Menyusui 6 bulan pertama', 'LACTATING_0_6M'], ['Menyusui 6 bulan kedua', 'LACTATING_7_12M']];

interface Col { compound: string; type: DvValueType; unit: string; note?: string; skip0to5?: boolean }
const BREASTFED = 'Needs of infants 0-5 months are met by exclusive breastfeeding (footnote 1).';

function table(name: string, cols: Col[], text: string) {
  const lines = text.trim().split('\n').map((l) => l.trim().split(/\s+/));
  if (lines.length !== 26) throw new Error(`${name}: ${lines.length} rows`);
  for (const l of lines) if (l.length !== cols.length) throw new Error(`${name}: row "${l.join(' ')}" has ${l.length} cells for ${cols.length} columns`);
  cols.forEach((c, ci) => {
    const cell = (r: number) => lines[r][ci];
    const from = (row: string) => `Lampiran I ${name}, ${c.compound}, ${row}`;
    const noteFor = (extra?: string | null) => [c.note, extra].filter(Boolean).join(' ') || null;
    CHILD.forEach(([label, age], r) => {
      const v = Number(cell(r));
      if (Number.isNaN(v)) throw new Error(`${name} ${c.compound} ${label}: "${cell(r)}"`);
      if (r === 0 && c.skip0to5) return;
      for (const sex of BOTH) push(c.compound, c.type, sex, 'NONE', age, v, c.unit, from(label), noteFor(r === 0 ? BREASTFED : null));
    });
    const adult: number[][] = [[], []];
    ([['MALE', 5, 'Laki-laki'], ['FEMALE', 13, 'Perempuan']] as const).forEach(([sex, start, word], si) => {
      ADULT.forEach(([label, age], k) => {
        const v = Number(cell(start + k));
        if (Number.isNaN(v)) throw new Error(`${name} ${c.compound} ${word} ${label}: "${cell(start + k)}"`);
        adult[si].push(v);
        push(c.compound, c.type, sex, 'NONE', age, v, c.unit, from(`${word} ${label}`), noteFor());
      });
    });
    STAGES.forEach(([label, stage], k) => {
      let tok = cell(21 + k); let extra: string | null = null;
      if (tok.startsWith('±')) { extra = `Printed as "${tok}"; read as +${tok.slice(1)}.`; tok = `+${tok.slice(1)}`; }
      if (!tok.startsWith('+')) throw new Error(`${name} ${c.compound} ${label}: "${tok}"`);
      const inc = Number(tok.slice(1));
      for (const [bi, band] of [[W19, '19-29'], [W30, '30-49']] as const) {
        const base = adult[1][bi];
        push(c.compound, c.type, 'FEMALE', stage, ADULT[bi][1], r4(base + inc), c.unit, `${from(label)} ${tok} over Perempuan ${band} tahun`,
          noteFor([extra, `Printed as ${tok} over women ${band} y (${base}); stored as total.`].filter(Boolean).join(' ')));
      }
    });
  });
}

// ── Tabel 1 (weight and height columns dropped) ──
table('Tabel 1', [
  { compound: 'Energy', type: 'EER', unit: 'kcal', note: 'Physical activity factor 1.1 (to 1 y), 1.14 (1-3 y), 1.26 (4-64 y), 1.12 (older) (footnote 2).' },
  { compound: 'Protein', type: 'RDA', unit: 'g' },
  { compound: 'Total Fat', type: 'RDA', unit: 'g' },
  { compound: 'Omega-3', type: 'RDA', unit: 'g' },
  { compound: 'Omega-6', type: 'RDA', unit: 'g' },
  { compound: 'Carbohydrates', type: 'RDA', unit: 'g' },
  { compound: 'Dietary Fiber', type: 'RDA', unit: 'g', skip0to5: true },
  { compound: 'Water', type: 'RDA', unit: 'ml' },
], `
550 9 31 0.5 4.4 59 0 700
800 15 35 0.5 4.4 105 11 900
1350 20 45 0.7 7 215 19 1150
1400 25 50 0.9 10 220 20 1450
1650 40 55 0.9 10 250 23 1650
2000 50 65 1.2 12 300 28 1850
2400 70 80 1.6 16 350 34 2100
2650 75 85 1.6 16 400 37 2300
2650 65 75 1.6 17 430 37 2500
2550 65 70 1.6 17 415 36 2500
2150 65 60 1.6 14 340 30 2500
1800 64 50 1.6 14 275 25 1800
1600 64 45 1.6 14 235 22 1600
1900 55 65 1.0 10 280 27 1850
2050 65 70 1.1 11 300 29 2100
2100 65 70 1.1 11 300 29 2150
2250 60 65 1.1 12 360 32 2350
2150 60 60 1.1 12 340 30 2350
1800 60 50 1.1 11 280 25 2350
1550 58 45 1.1 11 230 22 1550
1400 58 40 1.1 11 200 20 1400
+180 +1 +2.3 +0.3 +2 +25 +3 +300
+300 +10 +2.3 +0.3 +2 +40 +4 +300
+300 +30 +2.3 +0.3 +2 +40 +4 +300
+330 +20 +2.2 +0.2 +2 +45 +5 +800
+400 +15 +2.2 +0.2 +2 +55 +6 +650
`);

// ── Tabel 2 ──
table('Tabel 2', [
  { compound: 'Vitamin A (RE)', type: 'RDA', unit: 'µg RE' },
  { compound: 'Vitamin D (Total)', type: 'RDA', unit: 'µg' },
  { compound: 'Vitamin E (Total)', type: 'RDA', unit: 'mg', note: 'Header prints "(mcg)"; the values are mg (adult 15, as IOM).' },
  { compound: 'Vitamin K (Total)', type: 'RDA', unit: 'µg' },
  { compound: 'Thiamin (B1)', type: 'RDA', unit: 'mg' },
  { compound: 'Riboflavin (B2)', type: 'RDA', unit: 'mg' },
  { compound: 'Niacin (B3)', type: 'RDA', unit: 'mg' },
  { compound: 'Pantothenic Acid (B5)', type: 'RDA', unit: 'mg' },
  { compound: 'Vitamin B6', type: 'RDA', unit: 'mg' },
  { compound: 'Folate (Total)', type: 'RDA', unit: 'µg' },
  { compound: 'Vitamin B12 (Total)', type: 'RDA', unit: 'µg' },
  { compound: 'Biotin (B7)', type: 'RDA', unit: 'µg' },
  { compound: 'Choline (Total)', type: 'RDA', unit: 'mg' },
  { compound: 'Vitamin C (Total)', type: 'RDA', unit: 'mg' },
], `
375 10 4 5 0.2 0.3 2 1.7 0.1 80 0.4 5 125 40
400 10 5 10 0.3 0.4 4 1.8 0.3 80 1.5 6 150 50
400 15 6 15 0.5 0.5 6 2.0 0.5 160 1.5 8 200 40
450 15 7 20 0.6 0.6 8 3.0 0.6 200 1.5 12 250 45
500 15 8 25 0.9 0.9 10 4.0 1.0 300 2.0 12 375 45
600 15 11 35 1.1 1.3 12 5.0 1.3 400 3.5 20 375 50
600 15 15 55 1.2 1.3 16 5.0 1.3 400 4.0 25 550 75
700 15 15 55 1.2 1.3 16 5.0 1.3 400 4.0 30 550 90
650 15 15 65 1.2 1.3 16 5.0 1.3 400 4.0 30 550 90
650 15 15 65 1.2 1.3 16 5.0 1.3 400 4.0 30 550 90
650 15 15 65 1.2 1.3 16 5.0 1.7 400 4.0 30 550 90
650 20 15 65 1.2 1.3 16 5.0 1.7 400 4.0 30 550 90
650 20 15 65 1.2 1.3 16 5.0 1.7 400 4.0 30 550 90
600 15 15 35 1.0 1.0 12 5.0 1.2 400 3.5 20 375 50
600 15 15 55 1.1 1.0 14 5.0 1.2 400 4.0 25 400 65
600 15 15 55 1.1 1.0 14 5.0 1.2 400 4.0 30 425 75
600 15 15 55 1.1 1.1 14 5.0 1.3 400 4.0 30 425 75
600 15 15 55 1.1 1.1 14 5.0 1.3 400 4.0 30 425 75
600 15 15 55 1.1 1.1 14 5.0 1.5 400 4.0 30 425 75
600 20 20 55 1.1 1.1 14 5.0 1.5 400 4.0 30 425 75
600 20 20 55 1.1 1.1 14 5.0 1.5 400 4.0 30 425 75
+300 +0 +0 +0 +0.3 +0.3 +4 +1 +0.6 +200 +0.5 +0 +25 +10
+300 +0 +0 +0 +0.3 +0.3 +4 +1 +0.6 +200 +0.5 +0 +25 +10
+300 +0 +0 +0 +0.3 +0.3 +4 +1 +0.6 +200 +0.5 +0 +25 +10
+350 +0 +4 +0 +0.4 +0.5 +3 +2 +0.6 +100 +1.0 +5 +125 +45
+350 +0 +4 +0 +0.4 +0.5 +3 +2 +0.6 +100 +1.0 +5 +125 +45
`);

// ── Tabel 3 ──
table('Tabel 3', [
  { compound: 'Calcium', type: 'RDA', unit: 'mg' },
  { compound: 'Phosphorus', type: 'RDA', unit: 'mg' },
  { compound: 'Magnesium', type: 'RDA', unit: 'mg' },
  { compound: 'Iron (Total)', type: 'RDA', unit: 'mg', note: 'Assumes 75% of iron from heme sources (footnote 2).' },
  { compound: 'Iodine', type: 'RDA', unit: 'µg' },
  { compound: 'Zinc', type: 'RDA', unit: 'mg', note: 'Assumes zinc from high- and moderate-bioavailability sources (footnote 3).' },
  { compound: 'Selenium', type: 'RDA', unit: 'µg' },
  { compound: 'Manganese', type: 'RDA', unit: 'mg' },
  { compound: 'Fluoride', type: 'RDA', unit: 'mg' },
  { compound: 'Chromium', type: 'RDA', unit: 'µg' },
  { compound: 'Potassium', type: 'RDA', unit: 'mg' },
  { compound: 'Sodium', type: 'RDA', unit: 'mg' },
  { compound: 'Chloride', type: 'RDA', unit: 'mg' },
  { compound: 'Copper', type: 'RDA', unit: 'µg' },
], `
200 100 30 0.3 90 1.1 7 0.003 0.01 0.2 400 120 180 200
270 275 55 11 120 3 10 0.7 0.5 6 700 370 570 220
650 460 65 7 90 3 18 1.2 0.7 14 2600 800 1200 340
1000 500 95 10 120 5 21 1.5 1.0 16 2700 900 1300 440
1000 500 135 10 120 5 22 1.7 1.4 21 3200 1000 1500 570
1200 1250 160 8 120 8 22 1.9 1.8 28 3900 1300 1900 700
1200 1250 225 11 150 11 30 2.2 2.5 36 4800 1500 2300 795
1200 1250 270 11 150 11 36 2.3 4.0 41 5300 1700 2500 890
1000 700 360 9 150 11 30 2.3 4.0 36 4700 1500 2250 900
1000 700 360 9 150 11 30 2.3 4.0 34 4700 1500 2250 900
1200 700 360 9 150 11 30 2.3 4.0 29 4700 1300 2100 900
1200 700 350 9 150 11 29 2.3 4.0 24 4700 1100 1900 900
1200 700 350 9 150 11 29 2.3 4.0 21 4700 1000 1600 900
1200 1250 170 8 120 8 19 1.6 1.9 26 4400 1400 2100 700
1200 1250 220 15 150 9 24 1.6 2.4 27 4800 1500 2300 795
1200 1250 230 15 150 9 26 1.8 3.0 29 5000 1600 2400 890
1000 700 330 18 150 8 24 1.8 3.0 30 4700 1500 2250 900
1000 700 340 18 150 8 25 1.8 3.0 29 4700 1500 2250 900
1200 700 340 8 150 8 25 1.8 3.0 24 4700 1400 2100 900
1200 700 320 8 150 8 24 1.8 3.0 21 4700 1200 1900 900
1200 700 320 8 150 8 24 1.8 3.0 19 4700 1000 1600 900
+200 +0 +0 +0 +70 +2 +5 +0.2 +0 +5 +0 +0 +0 +100
+200 +0 +0 +9 +70 +4 +5 +0.2 +0 +5 +0 +0 +0 +100
+200 +0 +0 +9 +70 +4 +5 +0.2 +0 +5 +0 +0 +0 +100
+200 +0 +0 +0 +140 +5 +10 +0.8 +0 +20 +400 +0 +0 +400
+200 +0 +0 +0 +140 +5 ±10 +0.8 +0 +20 +400 +0 +0 +400
`);

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.lifeStage.localeCompare(b.lifeStage) || a.sex.localeCompare(b.sex) || a.ageMinMonths - b.ageMinMonths);
writeFileSync(path.join(process.cwd(), 'dv-sources', 'akg-indonesia-2019', 'values.json'), JSON.stringify(out, null, 1) + '\n');
const byType: Record<string, number> = {};
for (const v of out) byType[v.valueType] = (byType[v.valueType] ?? 0) + 1;
console.log(`Wrote ${out.length} values to dv-sources/akg-indonesia-2019/values.json`, byType);
