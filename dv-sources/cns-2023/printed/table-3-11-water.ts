/**
 * CNS 2023 附表 3-11 水的适宜摄入量, mL/d — transcribed cell by cell from cns-2023.pdf
 * PDF page 655 (printed p.639), 2026-09-14.
 * Footnote a: temperate climate at low physical activity. Footnote c: 0 y from breast milk.
 * Only TOTAL intake (总摄入量) is stored — Nutri has no drinking-water compound. Printed
 * drinking water: 4 y 800, 7 y 1000; M/F 12 y 1300/1100, 15 y 1400/1200, 18 y+ 1700/1500;
 * pregnancy +0/+200/+200, lactation +600.
 */
import type { PrintedNutrient } from './types';

const _ = null;

/** This table's own rows: 0, 0.5, 1, 4, 7, 12, 15, 18, 65. */
export const WATER_ROWS: Array<[number, number | null]> = [
  [0, 5], [6, 11], [12, 47], [48, 83], [84, 143], [144, 179], [180, 215], [216, 779], [780, null],
];

export const TABLE_3_11_WATER_TOTAL: PrintedNutrient = {
  unit: 'mL',
  m: [700, 900, 1300, 1600, 1800, 2300, 2500, 3000, 3000],
  f: [700, 900, 1300, 1600, 1800, 2000, 2200, 2700, 2700],
  preg: [0, 300, 300, 1100],
};
void _;
