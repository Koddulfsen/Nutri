/**
 * CNS 2023 附表 3-7 膳食矿物质推荐摄入量 (RNI) 或适宜摄入量 (AI) — transcribed cell
 * by cell from cns-2023.pdf PDF page 651 (printed p.635), 2026-09-14.
 * Column type is per nutrient (RNI or AI); infant cells printed "(AI)" are in aiRows.
 */
import { same, type PrintedNutrient } from './types';

const _ = null;
type Col = PrintedNutrient & { valueType: 'RDA' | 'AI' };

export const TABLE_3_7_MINERALS: Record<string, Col> = {
  calcium:    { valueType: 'RDA', unit: 'mg', ...same([200, 350, 500, 600, 800, 1000, 1000, 1000, 800, 800, 800, 800, 800]), preg: [0, 0, 0, 0], aiRows: [0, 1] },
  phosphorus: { valueType: 'RDA', unit: 'mg', ...same([105, 180, 300, 350, 440, 550, 700, 720, 720, 710, 710, 680, 680]), preg: [0, 0, 0, 0], aiRows: [0, 1] },
  potassium:  { valueType: 'AI',  unit: 'mg', ...same([400, 600, 900, 1100, 1300, 1600, 1800, 2000, 2000, 2000, 2000, 2000, 2000]), preg: [0, 0, 0, 400] },
  sodium: {
    valueType: 'AI', unit: 'mg', ...same([80, 180, 600, 800, 900, 1100, 1400, 1600, 1500, 1500, 1500, 1400, 1400]), preg: [0, 0, 0, 0],
    ranges: { 2: [500, 700] }, note: '1-3 y printed 500~700 (1 y 500, 2 y 600, 3 y 700).',
  },
  magnesium:  { valueType: 'RDA', unit: 'mg', ...same([20, 65, 140, 160, 200, 250, 320, 330, 330, 320, 320, 310, 300]), preg: [40, 40, 40, 0], aiRows: [0, 1] },
  chloride: {
    valueType: 'AI', unit: 'mg', ...same([120, 450, 950, 1200, 1400, 1700, 2200, 2500, 2300, 2300, 2300, 2200, 2200]), preg: [0, 0, 0, 0],
    ranges: { 2: [800, 1100] }, note: '1-3 y printed 800~1100 (1 y 800, 2 y 900, 3 y 1100).',
  },
  iron: {
    valueType: 'RDA', unit: 'mg',
    m: [0.3, 10, 10, 10, 12, 16, 16, 16, 12, 12, 12, 12, 12],
    f: [0.3, 10, 10, 10, 12, 16, 18, 18, 18, 18, 10, 10, 10],
    preg: [0, 7, 11, 6], aiRows: [0],
    note: 'F 50 y printed 10 (no menstruation) / 18 (menstruating); 10 stored.',
  },
  iodine:     { valueType: 'RDA', unit: 'µg', ...same([85, 115, 90, 90, 90, 90, 110, 120, 120, 120, 120, 120, 120]), preg: [110, 110, 110, 120], aiRows: [0, 1] },
  zinc: {
    valueType: 'RDA', unit: 'mg',
    m: [1.5, 3.2, 4.0, 5.5, 7.0, 7.0, 8.5, 11.5, 12.0, 12.0, 12.0, 12.0, 12.0],
    f: [1.5, 3.2, 4.0, 5.5, 7.0, 7.0, 7.5, 8.0, 8.5, 8.5, 8.5, 8.5, 8.5],
    preg: [2.0, 2.0, 2.0, 4.5], aiRows: [0, 1],
  },
  selenium:   { valueType: 'RDA', unit: 'µg', ...same([15, 20, 25, 30, 40, 45, 60, 60, 60, 60, 60, 60, 60]), preg: [5, 5, 5, 18], aiRows: [0, 1] },
  copper:     { valueType: 'RDA', unit: 'mg', ...same([0.3, 0.3, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.8, 0.8, 0.8, 0.8, 0.7]), preg: [0.1, 0.1, 0.1, 0.7], aiRows: [0, 1] },
  fluoride:   { valueType: 'AI',  unit: 'mg', ...same([0.01, 0.23, 0.6, 0.7, 0.9, 1.1, 1.4, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5]), preg: [0, 0, 0, 0] },
  chromium: {
    valueType: 'AI', unit: 'µg',
    m: [0.2, 5, 15, 15, 20, 25, 33, 35, 35, 35, 30, 30, 30],
    f: [0.2, 5, 15, 15, 20, 25, 30, 30, 30, 30, 25, 25, 25],
    preg: [0, 3, 5, 5],
  },
  manganese: {
    valueType: 'AI', unit: 'mg',
    m: [0.01, 0.7, 2.0, 2.0, 2.5, 3.5, 4.5, 5.0, 4.5, 4.5, 4.5, 4.5, 4.5],
    f: [0.01, 0.7, 1.5, 2.0, 2.5, 3.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0],
    preg: [0, 0, 0, 0.2],
  },
  molybdenum: { valueType: 'RDA', unit: 'µg', ...same([3, 6, 10, 12, 15, 20, 25, 25, 25, 25, 25, 25, 25]), preg: [0, 0, 0, 5], aiRows: [0, 1] },
};
void _;
