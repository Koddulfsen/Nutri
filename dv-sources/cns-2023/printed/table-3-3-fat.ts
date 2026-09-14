/**
 * CNS 2023 附表 3-3 膳食脂肪及脂肪酸参考摄入量 — transcribed cell by cell from
 * cns-2023.pdf PDF page 647 (printed p.631), 2026-09-14. Values are %E unless noted.
 * This table has its own age rows (FAT_ROWS). Cross-checked against 附表 3-5 (total fat column matches).
 *
 * A cell is a point value (AI) or a [min, max] range (AMDR); "<8" is [null, 8].
 * Pregnancy/lactation: AMDR ranges are printed absolute; LA/ALA are printed "+0".
 *
 * NOT transcribed: EPA+DHA (g/d). Nutri has no "EPA + DHA" compound — "Omega-3"
 * holds total n-3 PUFA elsewhere — so storing it would mislabel it. Printed:
 * 0.1 (DHA) 0-2 y, 0.2 3-11 y, 0.25 12-17 y, 0.25-2.00 AMDR 18 y+, 0.25 (0.2 DHA) pregnancy/lactation.
 */
const _ = null;
type Cell = number | [number | null, number | null] | null;

export const FAT_ROWS: Array<[number, number | null]> = [
  [0, 5], [6, 11], [12, 35], [36, 47], [48, 71], [72, 83], [84, 107], [108, 131], [132, 143],
  [144, 179], [180, 215], [216, 359], [360, 599], [600, 779], [780, 899], [900, null],
];

const adult = (v: Cell): Cell[] => [_, _, _, _, _, _, _, _, _, _, _, v, v, v, v, v];

export const TABLE_3_3_FAT: Record<string, { valueType: 'AI' | 'AMDR'; cells: Cell[]; preg: Cell; aiCells?: number[] }> = {
  // Rows 0-3 printed "(AI)" as a point %E; from 4 y an AMDR range.
  totalFat: {
    valueType: 'AMDR',
    cells: [48, 40, 35, 35, [20, 30], [20, 30], [20, 30], [20, 30], [20, 30], [20, 30], [20, 30], [20, 30], [20, 30], [20, 30], [20, 30], [20, 30]],
    aiCells: [0, 1, 2, 3],
    preg: [20, 30],
  },
  saturatedFat: {
    valueType: 'AMDR',
    cells: [_, _, _, _, [null, 8], [null, 8], [null, 8], [null, 8], [null, 8], [null, 8], [null, 8], [null, 10], [null, 10], [null, 10], [null, 10], [null, 10]],
    preg: [null, 10],
  },
  n6Pufa: { valueType: 'AMDR', cells: adult([2.5, 9.0]), preg: [2.5, 9.0] },
  n3Pufa: { valueType: 'AMDR', cells: adult([0.5, 2.0]), preg: [0.5, 2.0] },
  linoleicAcid: {
    valueType: 'AI',
    cells: [8.0, 6.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0],
    preg: 4.0, // printed +0 over the adult 4.0
  },
  alphaLinolenicAcid: {
    valueType: 'AI',
    cells: [0.90, 0.67, 0.60, 0.60, 0.60, 0.60, 0.60, 0.60, 0.60, 0.60, 0.60, 0.60, 0.60, 0.60, 0.60, 0.60],
    preg: 0.60, // printed +0 over the adult 0.60
  },
};
