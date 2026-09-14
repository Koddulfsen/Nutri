/**
 * Internal-consistency checks on the CNS 2023 transcriptions. These relations hold
 * in any correct DRI table, so a violation means a misread cell, not a science question.
 *   1. RNI >= EAR for the same nutrient, row and sex (and pregnancy increments likewise).
 *   2. UL >= RNI/AI for the same row.
 *   3. 附表 3-5 (AMDR summary) agrees with 3-2 / 3-3 / 3-4.
 * Run: npx tsx scripts/dv-verify/check-cns-consistency.ts
 */
import { BAND_ROWS, YEARLY_ROWS } from '../../dv-sources/cns-2023/printed/types';
import { TABLE_3_2_PROTEIN } from '../../dv-sources/cns-2023/printed/table-3-2-protein';
import { TABLE_3_3_FAT, FAT_ROWS } from '../../dv-sources/cns-2023/printed/table-3-3-fat';
import { TABLE_3_4_CARBOHYDRATE } from '../../dv-sources/cns-2023/printed/table-3-4-carbohydrate';
import { TABLE_3_6_EAR } from '../../dv-sources/cns-2023/printed/table-3-6-ear';
import { TABLE_3_7_MINERALS } from '../../dv-sources/cns-2023/printed/table-3-7-minerals';
import { TABLE_3_8_VITAMINS } from '../../dv-sources/cns-2023/printed/table-3-8-vitamins';
import { TABLE_3_10_UL } from '../../dv-sources/cns-2023/printed/table-3-10-ul';

let fails = 0;
const fail = (m: string) => { fails++; console.log('FAIL ' + m); };

// 1. RNI >= EAR
const RNI = { ...TABLE_3_7_MINERALS, ...TABLE_3_8_VITAMINS } as Record<string, any>;
for (const [k, ear] of Object.entries(TABLE_3_6_EAR)) {
  const rni = RNI[k];
  if (!rni) { fail(`EAR ${k} has no RNI column`); continue; }
  for (let i = 0; i < BAND_ROWS.length; i++) {
    for (const s of ['m', 'f'] as const) {
      const e = ear[s][i], r = rni[s][i];
      if (e != null && r != null && !rni.aiRows?.includes(i) && r < e) fail(`${k} row ${i} ${s}: RNI ${r} < EAR ${e}`);
    }
  }
  ear.preg.forEach((inc: number, j: number) => { if (rni.preg[j] < inc) fail(`${k} preg ${j}: RNI +${rni.preg[j]} < EAR +${inc}`); });
}
const pe = TABLE_3_2_PROTEIN;
for (let i = 0; i < YEARLY_ROWS.length; i++) for (const s of ['m', 'f'] as const) {
  const e = pe.ear[s][i], r = pe.rni[s][i];
  if (e != null && r != null && r < e) fail(`protein row ${i} ${s}: RNI ${r} < EAR ${e}`);
}

// 2. UL >= RNI/AI (unisex UL vs both sexes)
for (const [k, ul] of Object.entries(TABLE_3_10_UL)) {
  const rni = RNI[k];
  if (!rni) continue;
  for (let i = 0; i < BAND_ROWS.length; i++) {
    const u = ul.cells[i];
    for (const s of ['m', 'f'] as const) {
      const r = rni[s][i];
      if (u != null && r != null && u < r) fail(`${k} row ${i} ${s}: UL ${u} < RNI/AI ${r}`);
    }
  }
}

// 3. 附表 3-5 transcribed (PDF page 649) vs its source tables. Rows: 0,0.5,1,4,6,7,11,12,15,18,30,50,65,75.
const AMDR_3_5 = {
  months: [0, 6, 12, 48, 72, 84, 132, 144, 180, 216, 360, 600, 780, 900],
  carb:    [null, null, [50, 65], [50, 65], [50, 65], [50, 65], [50, 65], [50, 65], [50, 65], [50, 65], [50, 65], [50, 65], [50, 65], [50, 65]],
  fat:     [48, 40, 35, [20, 30], [20, 30], [20, 30], [20, 30], [20, 30], [20, 30], [20, 30], [20, 30], [20, 30], [20, 30], [20, 30]],
  protein: [null, null, null, [8, 20], [10, 20], [10, 20], [10, 20], [10, 20], [10, 20], [10, 20], [10, 20], [10, 20], [15, 20], [15, 20]],
};
const at = (rows: Array<[number, number | null]>, m: number) => rows.findIndex(([a, b]) => a <= m && (b == null || m <= b));
const eq = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
AMDR_3_5.months.forEach((m, j) => {
  if (!eq(AMDR_3_5.carb[j], TABLE_3_4_CARBOHYDRATE.carbAmdr.cells[at(BAND_ROWS, m)])) fail(`3-5 vs 3-4 carb at ${m} mo`);
  if (!eq(AMDR_3_5.fat[j], TABLE_3_3_FAT.totalFat.cells[at(FAT_ROWS, m)])) fail(`3-5 vs 3-3 fat at ${m} mo`);
  if (!eq(AMDR_3_5.protein[j], TABLE_3_2_PROTEIN.amdr[at(YEARLY_ROWS, m)])) fail(`3-5 vs 3-2 protein at ${m} mo`);
});

console.log(`consistency: ${fails} failures`);
if (fails) process.exitCode = 1;
