/**
 * CNS 2023 附表 3-10 膳食微量营养素可耐受最高摄入量 (UL) — transcribed cell by cell from
 * cns-2023.pdf PDF page 654 (printed p.638), 2026-09-14. Rows are BAND_ROWS.
 * One value per row for both sexes. Pregnancy/lactation are printed ABSOLUTE (no "+").
 * 烟酸 (mg NE) and 烟酰胺 (nicotinamide) are separate printed columns.
 */
const _ = null;

export const TABLE_3_10_UL: Record<string, { unit: string; cells: (number | null)[]; preg: [number, number, number, number] }> = {
  calcium:      { unit: 'mg', cells: [1000, 1500, 1500, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000], preg: [2000, 2000, 2000, 2000] },
  phosphorus:   { unit: 'mg', cells: [_, _, _, _, _, _, _, _, 3500, 3500, 3500, 3000, 3000], preg: [3500, 3500, 3500, 3500] },
  iron:         { unit: 'mg', cells: [_, _, 25, 30, 35, 35, 40, 40, 42, 42, 42, 42, 42], preg: [42, 42, 42, 42] },
  iodine:       { unit: 'µg', cells: [_, _, _, 200, 250, 250, 300, 500, 600, 600, 600, 600, 600], preg: [500, 500, 500, 500] },
  zinc:         { unit: 'mg', cells: [_, _, 9, 13, 21, 24, 32, 37, 40, 40, 40, 40, 40], preg: [40, 40, 40, 40] },
  selenium:     { unit: 'µg', cells: [55, 80, 80, 120, 150, 200, 300, 350, 400, 400, 400, 400, 400], preg: [400, 400, 400, 400] },
  copper:       { unit: 'mg', cells: [_, _, 2.0, 3.0, 3.0, 5.0, 6.0, 7.0, 8.0, 8.0, 8.0, 8.0, 8.0], preg: [8.0, 8.0, 8.0, 8.0] },
  fluoride:     { unit: 'mg', cells: [_, _, 0.8, 1.1, 1.5, 2.0, 2.4, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5], preg: [3.5, 3.5, 3.5, 3.5] },
  manganese:    { unit: 'mg', cells: [_, _, _, 3.5, 5.0, 6.5, 9.0, 10, 11, 11, 11, 11, 11], preg: [11, 11, 11, 11] },
  molybdenum:   { unit: 'µg', cells: [_, _, 200, 300, 400, 500, 700, 800, 900, 900, 900, 900, 900], preg: [900, 900, 900, 900] },
  vitaminA:     { unit: 'µg', cells: [600, 600, 700, 1000, 1300, 1800, 2400, 2800, 3000, 3000, 3000, 3000, 3000], preg: [3000, 3000, 3000, 3000] },
  vitaminD:     { unit: 'µg', cells: [20, 20, 20, 30, 45, 45, 50, 50, 50, 50, 50, 50, 50], preg: [50, 50, 50, 50] },
  vitaminE:     { unit: 'mg', cells: [_, _, 150, 200, 300, 400, 500, 600, 700, 700, 700, 700, 700], preg: [700, 700, 700, 700] },
  niacin:       { unit: 'mg', cells: [_, _, 11, 15, 19, 23, 30, 33, 35, 35, 35, 35, 35], preg: [35, 35, 35, 35] },
  nicotinamide: { unit: 'mg', cells: [_, _, 100, 130, 160, 200, 260, 290, 310, 310, 310, 300, 290], preg: [310, 310, 310, 310] },
  vitaminB6:    { unit: 'mg', cells: [_, _, 20, 25, 32, 40, 50, 55, 60, 60, 55, 55, 55], preg: [60, 60, 60, 60] },
  folate:       { unit: 'µg', cells: [_, _, 300, 400, 500, 650, 800, 900, 1000, 1000, 1000, 1000, 1000], preg: [1000, 1000, 1000, 1000] },
  choline:      { unit: 'mg', cells: [_, _, 1000, 1000, 2000, 2000, 2000, 2500, 3000, 3000, 3000, 3000, 3000], preg: [3000, 3000, 3000, 3000] },
  vitaminC:     { unit: 'mg', cells: [_, _, 400, 600, 800, 1100, 1600, 1800, 2000, 2000, 2000, 2000, 2000], preg: [2000, 2000, 2000, 2000] },
};
