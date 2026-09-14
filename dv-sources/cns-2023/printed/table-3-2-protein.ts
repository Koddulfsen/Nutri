/**
 * CNS 2023 附表 3-2 膳食蛋白质参考摄入量 — transcribed cell by cell from
 * cns-2023.pdf PDF page 646 (printed p.630), 2026-09-14. Rows are YEARLY_ROWS.
 * AMDR (%E) is printed as an absolute range for pregnancy/lactation, not an increment.
 */
import type { PrintedNutrient } from './types';

const _ = null;

export const TABLE_3_2_PROTEIN: { ear: PrintedNutrient; rni: PrintedNutrient; amdr: Array<[number, number] | null>; amdrPreg: [number, number] } = {
  ear: {
    unit: 'g',
    m: [_, _, 20, 20, 25, 25, 25, 30, 30, 35, 40, 40, 45, 55, 60, 60, 60, 60, 60, 60],
    f: [_, _, 20, 20, 25, 25, 25, 30, 30, 35, 40, 40, 45, 50, 50, 50, 50, 50, 50, 50],
    preg: [0, 10, 25, 20],
  },
  rni: {
    unit: 'g',
    m: [9, 17, 25, 25, 30, 30, 30, 35, 40, 40, 45, 50, 55, 70, 75, 65, 65, 65, 72, 72],
    f: [9, 17, 25, 25, 30, 30, 30, 35, 40, 40, 45, 50, 55, 60, 60, 55, 55, 55, 62, 62],
    preg: [0, 15, 30, 25],
    aiRows: [0, 1],
  },
  amdr: [
    _, _, _, _, _, [8, 20], [8, 20],
    [10, 20], [10, 20], [10, 20], [10, 20], [10, 20], [10, 20], [10, 20], [10, 20], [10, 20], [10, 20], [10, 20],
    [15, 20], [15, 20],
  ],
  amdrPreg: [10, 20],
};
