/**
 * CNS 2023 附表 3-9 膳食营养素降低膳食相关非传染性疾病风险的建议摄入量 (PI-NCD), mg/d —
 * transcribed cell by cell from cns-2023.pdf PDF page 653 (printed p.637), 2026-09-14.
 * Rows are BAND_ROWS. Footnote: pregnant/lactating women's PI-NCD equals same-age women (+0).
 * Potassium and vitamin C are intakes to reach ([min, null]); sodium is printed "≤" ([null, max]).
 */
const _ = null;
type Cell = [number | null, number | null] | null;
const reach = (v: number): Cell => [v, null];
const atMost = (v: number): Cell => [null, v];

export const TABLE_3_9_PINCD: Record<string, { cells: Cell[]; preg: Cell }> = {
  potassium: { cells: [_, _, _, reach(1800), reach(2200), reach(2800), reach(3200), reach(3600), reach(3600), reach(3600), reach(3600), reach(3600), reach(3600)], preg: reach(3600) },
  sodium:    { cells: [_, _, _, atMost(1000), atMost(1200), atMost(1500), atMost(1900), atMost(2100), atMost(2000), atMost(2000), atMost(2000), atMost(1900), atMost(1800)], preg: atMost(2000) },
  vitaminC:  { cells: [_, _, _, _, _, _, _, _, reach(200), reach(200), reach(200), reach(200), reach(200)], preg: reach(200) },
};
