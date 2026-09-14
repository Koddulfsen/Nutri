/**
 * CNS 2023 附表 3-6 膳食微量营养素平均需要量 (EAR) — transcribed cell by cell
 * from the printed table (cns-2023.pdf, PDF page 650 / printed p.634), 2026-09-14.
 *
 * Rows follow the printed order. `m` and `f` hold the printed 男/女 columns;
 * where the table prints one centred value for both sexes, it appears in both.
 * `preg` holds the printed "+x" increments for 孕早期 / 孕中期 / 孕晚期 / 乳母.
 * null = printed "—".
 */

export const ROWS = ['0', '0.5', '1', '4', '7', '9', '12', '15', '18', '30', '50', '65', '75'] as const;

export interface PrintedNutrient {
  unit: string;
  m: (number | null)[];
  f: (number | null)[];
  preg: [number, number, number, number];
  note?: string;
}

const same = (v: (number | null)[]) => ({ m: v, f: v });
const _ = null;

export const TABLE_3_6_EAR: Record<string, PrintedNutrient> = {
  calcium:    { unit: 'mg', ...same([_, _, 400, 500, 650, 800, 850, 800, 650, 650, 650, 650, 650]), preg: [0, 0, 0, 0] },
  phosphorus: { unit: 'mg', ...same([_, _, 250, 290, 370, 460, 580, 600, 600, 590, 590, 570, 570]), preg: [0, 0, 0, 0] },
  magnesium:  { unit: 'mg', ...same([_, _, 110, 130, 170, 210, 260, 270, 270, 270, 270, 260, 250]), preg: [30, 30, 30, 0] },
  iron: {
    unit: 'mg',
    m: [_, 7, 7, 7, 9, 12, 12, 12, 9, 9, 9, 9, 9],
    f: [_, 7, 7, 7, 9, 12, 14, 14, 12, 12, 8, 8, 8],
    preg: [0, 7, 10, 6],
    note: 'F 50 y printed 8 (no menstruation) / 12 (menstruating); 8 stored.',
  },
  iodine:     { unit: 'µg', ...same([_, _, 65, 65, 65, 65, 80, 85, 85, 85, 85, 85, 85]), preg: [75, 75, 75, 85] },
  zinc: {
    unit: 'mg',
    m: [_, _, 3.2, 4.6, 5.9, 5.9, 7.0, 9.7, 10.1, 10.1, 10.1, 10.1, 10.1],
    f: [_, _, 3.2, 4.6, 5.9, 5.9, 6.3, 6.5, 6.9, 6.9, 6.9, 6.9, 6.9],
    preg: [1.7, 1.7, 1.7, 4.1],
  },
  selenium:   { unit: 'µg', ...same([_, _, 20, 25, 30, 40, 50, 50, 50, 50, 50, 50, 50]), preg: [4, 4, 4, 15] },
  copper:     { unit: 'mg', ...same([_, _, 0.26, 0.30, 0.38, 0.47, 0.56, 0.59, 0.62, 0.60, 0.60, 0.58, 0.57]), preg: [0.10, 0.10, 0.10, 0.50] },
  molybdenum: { unit: 'µg', ...same([_, _, 8, 10, 12, 15, 20, 20, 20, 20, 20, 20, 20]), preg: [0, 0, 0, 4] },
  vitaminA: {
    unit: 'µg RAE',
    m: [_, _, 250, 280, 300, 400, 560, 580, 550, 550, 540, 520, 500],
    f: [_, _, 240, 270, 280, 380, 520, 480, 470, 470, 470, 460, 430],
    preg: [0, 50, 50, 400],
  },
  vitaminD:   { unit: 'µg', ...same([_, _, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8]), preg: [0, 0, 0, 0] },
  thiamin: {
    unit: 'mg',
    m: [_, _, 0.5, 0.7, 0.8, 0.9, 1.2, 1.4, 1.2, 1.2, 1.2, 1.2, 1.2],
    f: [_, _, 0.5, 0.7, 0.7, 0.8, 1.0, 1.1, 1.0, 1.0, 1.0, 1.0, 1.0],
    preg: [0, 0.1, 0.2, 0.2],
  },
  riboflavin: {
    unit: 'mg',
    m: [_, _, 0.6, 0.7, 0.8, 0.9, 1.2, 1.3, 1.2, 1.2, 1.2, 1.2, 1.2],
    f: [_, _, 0.5, 0.6, 0.7, 0.8, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    preg: [0, 0.1, 0.2, 0.4],
  },
  niacin: {
    unit: 'mg NE',
    m: [_, _, 5, 6, 7, 9, 11, 13, 12, 12, 12, 12, 12],
    f: [_, _, 4, 5, 6, 8, 10, 10, 10, 10, 10, 10, 10],
    preg: [0, 0, 0, 3],
  },
  vitaminB6:  { unit: 'mg', ...same([_, _, 0.5, 0.6, 0.7, 0.8, 1.1, 1.2, 1.2, 1.2, 1.3, 1.3, 1.3]), preg: [0.7, 0.7, 0.7, 0.2] },
  folate:     { unit: 'µg DFE', ...same([_, _, 130, 160, 200, 240, 310, 320, 320, 320, 320, 320, 320]), preg: [200, 200, 200, 130] },
  vitaminB12: { unit: 'µg', ...same([_, _, 0.8, 1.0, 1.2, 1.5, 1.7, 2.1, 2.0, 2.0, 2.0, 2.0, 2.0]), preg: [0.4, 0.4, 0.4, 0.6] },
  vitaminC:   { unit: 'mg', ...same([_, _, 35, 40, 50, 65, 80, 85, 85, 85, 85, 85, 85]), preg: [0, 10, 10, 40] },
};
