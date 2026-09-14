/**
 * Diff a verified CNS printed-table transcription against the legacy raw-values arrays.
 * Run: npx tsx scripts/dv-verify/diff-cns-printed.ts
 */
import * as RV from '../../dv-sources/cns-2023/raw-values';
import { TABLE_3_6_EAR } from '../../dv-sources/cns-2023/printed/table-3-6-ear';

const LEGACY: Record<string, string> = {
  calcium: 'CALCIUM_EAR', phosphorus: 'PHOSPHORUS_EAR', magnesium: 'MAGNESIUM_EAR', iron: 'IRON_EAR',
  iodine: 'IODINE_EAR', zinc: 'ZINC_EAR', selenium: 'SELENIUM_EAR', copper: 'COPPER_EAR',
  molybdenum: 'MOLYBDENUM_EAR', vitaminA: 'VITAMIN_A_EAR', vitaminD: 'VITAMIN_D_EAR', thiamin: 'THIAMIN_EAR',
  riboflavin: 'RIBOFLAVIN_EAR', niacin: 'NIACIN_EAR', vitaminB6: 'B6_EAR', folate: 'FOLATE_EAR',
  vitaminB12: 'B12_EAR', vitaminC: 'VITAMIN_C_EAR',
};
const CHILD = ['INFANT_0_6', 'INFANT_6_12', 'CHILD_1_3', 'CHILD_4_6', 'CHILD_7_8', 'CHILD_9_11'];
const ADULT = ['12_14', '15_17', '18_29', '30_49', '50_64', '65_74', '75P'];
const PREG = ['PREG_T1', 'PREG_T2', 'PREG_T3', 'LACT'];

let cells = 0, wrong = 0;
for (const [key, p] of Object.entries(TABLE_3_6_EAR)) {
  const raw = (RV as any)[LEGACY[key]] as Record<string, number | null>;
  const out: string[] = [];
  const cmp = (label: string, printed: number | null, stored: number | null | undefined) => {
    cells++;
    if ((printed ?? null) !== (stored ?? null)) { wrong++; out.push(`${label}: printed ${printed ?? '—'}, stored ${stored ?? '—'}`); }
  };
  CHILD.forEach((k, i) => {
    cmp(`${k} M`, p.m[i], raw[k]);
    // A unisex legacy slot cannot hold a printed girls' value that differs.
    if (p.f[i] !== p.m[i]) cmp(`${k} F`, p.f[i], raw[k]);
  });
  ADULT.forEach((a, j) => { cmp(`M_${a}`, p.m[6 + j], raw[`M_${a}`]); cmp(`F_${a}`, p.f[6 + j], raw[`F_${a}`]); });
  PREG.forEach((k, i) => cmp(k, p.preg[i], raw[k]));
  if (out.length) console.log(`${LEGACY[key]} (${out.length})\n  ${out.join('\n  ')}`);
}
console.log(`\n${wrong} of ${cells} cells differ from the printed table`);
