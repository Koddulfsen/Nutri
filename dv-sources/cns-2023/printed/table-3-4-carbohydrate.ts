/**
 * CNS 2023 附表 3-4 膳食碳水化合物参考摄入量 — transcribed cell by cell from
 * cns-2023.pdf PDF page 648 (printed p.632), 2026-09-14. Rows are BAND_ROWS.
 * Footnote a: added sugars no more than 50 g/d, preferably below 25 g/d.
 */
import { same, type PrintedNutrient } from './types';

const _ = null;
type Cell = [number | null, number | null] | null;

export const TABLE_3_4_CARBOHYDRATE: {
  carbEar: PrintedNutrient; fiberAi: PrintedNutrient;
  carbAmdr: { cells: Cell[]; preg: Cell }; addedSugarsAmdr: { cells: Cell[]; preg: Cell };
} = {
  carbEar: {
    unit: 'g', ...same([60, 80, 120, 120, 120, 120, 150, 150, 120, 120, 120, 120, 120]),
    preg: [10, 20, 35, 50], aiRows: [0, 1],
  },
  carbAmdr: { cells: [_, _, [50, 65], [50, 65], [50, 65], [50, 65], [50, 65], [50, 65], [50, 65], [50, 65], [50, 65], [50, 65], [50, 65]], preg: [50, 65] },
  // Printed as ranges; m/f hold the midpoint. Pregnancy "+x" shifts the range.
  fiberAi: {
    unit: 'g', ...same([_, _, 7.5, 12.5, 17.5, 17.5, 22.5, 27.5, 27.5, 27.5, 27.5, 27.5, 27.5]),
    ranges: { 2: [5, 10], 3: [10, 15], 4: [15, 20], 5: [15, 20], 6: [20, 25], 7: [25, 30], 8: [25, 30], 9: [25, 30], 10: [25, 30], 11: [25, 30], 12: [25, 30] },
    preg: [0, 4, 4, 4],
  },
  addedSugarsAmdr: { cells: [_, _, _, [null, 10], [null, 10], [null, 10], [null, 10], [null, 10], [null, 10], [null, 10], [null, 10], [null, 10], [null, 10]], preg: [null, 10] },
};
