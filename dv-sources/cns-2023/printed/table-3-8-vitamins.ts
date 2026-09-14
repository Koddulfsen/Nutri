/**
 * CNS 2023 附表 3-8 膳食维生素推荐摄入量 (RNI) 或适宜摄入量 (AI) — transcribed cell
 * by cell from cns-2023.pdf PDF page 652 (printed p.636), 2026-09-14.
 * Column type is per nutrient (RNI or AI); infant cells printed "(AI)" are in aiRows.
 */
import { same, type PrintedNutrient } from './types';

type Col = PrintedNutrient & { valueType: 'RDA' | 'AI' };

export const TABLE_3_8_VITAMINS: Record<string, Col> = {
  vitaminA: {
    valueType: 'RDA', unit: 'µg RAE',
    m: [300, 350, 340, 390, 430, 560, 780, 810, 770, 770, 750, 730, 710],
    f: [300, 350, 330, 380, 390, 540, 730, 670, 660, 660, 660, 640, 600],
    preg: [0, 70, 70, 600], aiRows: [0, 1],
  },
  vitaminD:   { valueType: 'RDA', unit: 'µg', ...same([10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 15, 15]), preg: [0, 0, 0, 0], aiRows: [0, 1] },
  vitaminE:   { valueType: 'AI',  unit: 'mg α-TE', ...same([3, 4, 6, 7, 9, 11, 13, 14, 14, 14, 14, 14, 14]), preg: [0, 0, 0, 3] },
  vitaminK:   { valueType: 'AI',  unit: 'µg', ...same([2, 10, 30, 40, 50, 60, 70, 75, 80, 80, 80, 80, 80]), preg: [0, 0, 0, 5] },
  thiamin: {
    valueType: 'RDA', unit: 'mg',
    m: [0.1, 0.3, 0.6, 0.9, 1.0, 1.1, 1.4, 1.6, 1.4, 1.4, 1.4, 1.4, 1.4],
    f: [0.1, 0.3, 0.6, 0.9, 0.9, 1.0, 1.2, 1.3, 1.2, 1.2, 1.2, 1.2, 1.2],
    preg: [0, 0.2, 0.3, 0.3], aiRows: [0, 1],
  },
  riboflavin: {
    valueType: 'RDA', unit: 'mg',
    m: [0.4, 0.6, 0.7, 0.9, 1.0, 1.1, 1.4, 1.6, 1.4, 1.4, 1.4, 1.4, 1.4],
    f: [0.4, 0.6, 0.6, 0.8, 0.9, 1.0, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2],
    preg: [0, 0.1, 0.2, 0.5], aiRows: [0, 1],
  },
  niacin: {
    valueType: 'RDA', unit: 'mg NE',
    m: [1, 2, 6, 7, 9, 10, 13, 15, 15, 15, 15, 15, 15],
    f: [1, 2, 5, 6, 8, 10, 12, 12, 12, 12, 12, 12, 12],
    preg: [0, 0, 0, 4], aiRows: [0, 1],
  },
  vitaminB6:  { valueType: 'RDA', unit: 'mg', ...same([0.1, 0.3, 0.6, 0.7, 0.8, 1.0, 1.3, 1.4, 1.4, 1.4, 1.6, 1.6, 1.6]), preg: [0.8, 0.8, 0.8, 0.3], aiRows: [0, 1] },
  folate:     { valueType: 'RDA', unit: 'µg DFE', ...same([65, 100, 160, 190, 240, 290, 370, 400, 400, 400, 400, 400, 400]), preg: [200, 200, 200, 150], aiRows: [0, 1] },
  vitaminB12: { valueType: 'RDA', unit: 'µg', ...same([0.3, 0.6, 1.0, 1.2, 1.4, 1.8, 2.0, 2.5, 2.4, 2.4, 2.4, 2.4, 2.4]), preg: [0.5, 0.5, 0.5, 0.8], aiRows: [0, 1] },
  pantothenic: { valueType: 'AI', unit: 'mg', ...same([1.7, 1.9, 2.1, 2.5, 3.1, 3.8, 4.9, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0]), preg: [1.0, 1.0, 1.0, 2.0] },
  biotin:     { valueType: 'AI',  unit: 'µg', ...same([5, 10, 17, 20, 25, 30, 35, 40, 40, 40, 40, 40, 40]), preg: [10, 10, 10, 10] },
  choline: {
    valueType: 'AI', unit: 'mg',
    m: [120, 140, 170, 200, 250, 300, 380, 450, 450, 450, 450, 450, 450],
    f: [120, 140, 170, 200, 250, 300, 380, 380, 380, 380, 380, 380, 380],
    preg: [80, 80, 80, 120],
  },
  vitaminC:   { valueType: 'RDA', unit: 'mg', ...same([40, 40, 40, 50, 60, 75, 95, 100, 100, 100, 100, 100, 100]), preg: [0, 15, 15, 50], aiRows: [0, 1] },
};
