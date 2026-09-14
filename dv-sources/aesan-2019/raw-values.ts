/**
 * AESAN 2019 — Ingestas Nutricionales de Referencia for Spanish population
 * Source: AESAN-2019-003 Scientific Committee Report, Appendix I Tables 1-7
 */

export type Sex = 'MALE' | 'FEMALE';

export interface Demographic {
  key: string;
  minMonths: number;
  maxMonths: number | null;
  sex: Sex | 'BOTH';
  lifeStage: 'NONE' | 'PREGNANT' | 'LACTATING';
  label: string;
}

// Vitamin/Mineral tables use: 0-6mo, 7-12mo, 1-3y, 4-5y, 6-9y, 10-13, 14-19, 20-29, 30-39, 40-49, 50-59, 60-69, >70
export const DEMOGRAPHICS: Demographic[] = [
  { key: 'INFANT_0_6',  minMonths: 0,   maxMonths: 5,    sex: 'BOTH', lifeStage: 'NONE', label: '0-6 mo' },
  { key: 'INFANT_7_12', minMonths: 6,   maxMonths: 11,   sex: 'BOTH', lifeStage: 'NONE', label: '7-12 mo' },
  { key: 'CHILD_1_3',   minMonths: 12,  maxMonths: 47,   sex: 'BOTH', lifeStage: 'NONE', label: '1-3 y' },
  { key: 'CHILD_4_5',   minMonths: 48,  maxMonths: 71,   sex: 'BOTH', lifeStage: 'NONE', label: '4-5 y' },
  { key: 'CHILD_6_9',   minMonths: 72,  maxMonths: 119,  sex: 'BOTH', lifeStage: 'NONE', label: '6-9 y' },
  { key: 'M_10_13',     minMonths: 120, maxMonths: 167,  sex: 'MALE', lifeStage: 'NONE', label: 'M 10-13 y' },
  { key: 'M_14_19',     minMonths: 168, maxMonths: 239,  sex: 'MALE', lifeStage: 'NONE', label: 'M 14-19 y' },
  { key: 'M_20_29',     minMonths: 240, maxMonths: 359,  sex: 'MALE', lifeStage: 'NONE', label: 'M 20-29 y' },
  { key: 'M_30_39',     minMonths: 360, maxMonths: 479,  sex: 'MALE', lifeStage: 'NONE', label: 'M 30-39 y' },
  { key: 'M_40_49',     minMonths: 480, maxMonths: 599,  sex: 'MALE', lifeStage: 'NONE', label: 'M 40-49 y' },
  { key: 'M_50_59',     minMonths: 600, maxMonths: 719,  sex: 'MALE', lifeStage: 'NONE', label: 'M 50-59 y' },
  { key: 'M_60_69',     minMonths: 720, maxMonths: 839,  sex: 'MALE', lifeStage: 'NONE', label: 'M 60-69 y' },
  { key: 'M_70P',       minMonths: 840, maxMonths: null, sex: 'MALE', lifeStage: 'NONE', label: 'M >70 y' },
  { key: 'F_10_13',     minMonths: 120, maxMonths: 167,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 10-13 y' },
  { key: 'F_14_19',     minMonths: 168, maxMonths: 239,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 14-19 y' },
  { key: 'F_20_29',     minMonths: 240, maxMonths: 359,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 20-29 y' },
  { key: 'F_30_39',     minMonths: 360, maxMonths: 479,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 30-39 y' },
  { key: 'F_40_49',     minMonths: 480, maxMonths: 599,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 40-49 y' },
  { key: 'F_50_59',     minMonths: 600, maxMonths: 719,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 50-59 y' },
  { key: 'F_60_69',     minMonths: 720, maxMonths: 839,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 60-69 y' },
  { key: 'F_70P',       minMonths: 840, maxMonths: null, sex: 'FEMALE', lifeStage: 'NONE', label: 'F >70 y' },
  { key: 'PREG',        minMonths: 240, maxMonths: 599,  sex: 'FEMALE', lifeStage: 'PREGNANT',  label: 'Embarazo' },
  { key: 'LACT',        minMonths: 240, maxMonths: 599,  sex: 'FEMALE', lifeStage: 'LACTATING', label: 'Lactancia' },
];
const DEMO_BY_KEY = Object.fromEntries(DEMOGRAPHICS.map((d) => [d.key, d]));
export function demo(key: string): Demographic {
  const d = DEMO_BY_KEY[key];
  if (!d) throw new Error(`Unknown demo: ${key}`);
  return d;
}

export const DEMO_KEYS = [
  'INFANT_0_6','INFANT_7_12','CHILD_1_3','CHILD_4_5','CHILD_6_9',
  'M_10_13','M_14_19','M_20_29','M_30_39','M_40_49','M_50_59','M_60_69','M_70P',
  'F_10_13','F_14_19','F_20_29','F_30_39','F_40_49','F_50_59','F_60_69','F_70P',
  'PREG','LACT',
] as const;

type NVal = number | null;
function asMap(values: readonly NVal[]): Record<string, NVal> {
  const out: Record<string, NVal> = {};
  DEMO_KEYS.forEach((k, i) => { out[k] = values[i] ?? null; });
  return out;
}

// ═════════════════════════════════════════════════════════════════
// VITAMINS (Tables 6a-6d)
// AESAN column values. Preg/lact are ABSOLUTE (table shows absolute, not increment)
// Age bucket used: >70 = 840+ months
// ═════════════════════════════════════════════════════════════════

// Vitamin A µg RE — Table 6a
export const VITAMIN_A_RDA = asMap([
  400, 400, 350, 400, 500,
  600, 750, 750, 750, 750, 750, 750, 750,
  600, 650, 650, 650, 650, 650, 650, 650,
  800, 1300,
]);

// Vitamin B1 (Thiamin) mg — Table 6a
export const THIAMIN_RDA = asMap([
  0.2, 0.3, 0.5, 0.6, 0.8,
  1.2, 1.5, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2,
  1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1,
  1.4, 1.7,
]);

// Vitamin B2 (Riboflavin) mg — Table 6a
export const RIBOFLAVIN_RDA = asMap([
  0.4, 0.6, 0.6, 0.7, 1.0,
  1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5,
  1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4,
  1.5, 1.7,
]);

// Vitamin B3 (Niacin) mg NE — Table 6a
export const NIACIN_RDA = asMap([
  3, 5, 7, 9, 11,
  14, 17, 14, 14, 14, 14, 16, 17,
  14, 14, 14, 14, 14, 14, 14, 14,
  16, 18,
]);

// Vitamin B5 (Pantothenic acid) mg — Table 6b
export const PANTOTHENIC_RDA = asMap([
  1.7, 2.2, 3.5, 4, 4,
  5, 5, 5, 5, 5, 5, 5, 5,
  4.5, 5, 5, 5, 5, 5, 5, 5,
  6, 7,
]);

// Vitamin B6 (Pyridoxine) mg — Table 6b
export const B6_RDA = asMap([
  0.2, 0.6, 1.1, 1.2, 1.3,
  1.7, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7,
  1.2, 1.3, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5,
  1.9, 2,
]);

// Vitamin B9 (Folate) µg DFE — Table 6b
export const FOLATE_RDA = asMap([
  65, 80, 120, 150, 200,
  270, 330, 330, 330, 330, 330, 330, 330,
  270, 330, 330, 330, 330, 330, 330, 330,
  500, 500,
]);

// Vitamin B12 (Cobalamin) µg — Table 6b
export const B12_RDA = asMap([
  0.4, 0.8, 0.9, 1.2, 1.6,
  2.2, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4,
  2.2, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4,
  2.6, 2.8,
]);

// Biotin µg — Table 6c
export const BIOTIN_RDA = asMap([
  5, 6, 12.5, 15, 20,
  25, 30, 30, 30, 30, 30, 30, 30,
  25, 30, 30, 30, 30, 30, 30, 30,
  35, 35,
]);

// Vitamin C mg — Table 6c
export const VITAMIN_C_RDA = asMap([
  35, 30, 30, 45, 60,
  75, 75, 75, 75, 75, 75, 75, 75,
  60, 75, 75, 75, 75, 75, 75, 75,
  85, 120,
]);

// Vitamin D µg — Table 6c (Spain: 10 young, 12.5 middle-aged, 15 elderly)
export const VITAMIN_D_RDA = asMap([
  10, 10, 10, 10, 10,
  12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 15, 15,
  12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 15, 15,
  12.5, 12.5,
]);

// Vitamin E mg α-tocopherol — Table 6c
export const VITAMIN_E_RDA = asMap([
  4, 5, 6, 7, 9,
  11, 13, 13, 13, 13, 13, 13, 13,
  11, 11, 11, 11, 11, 11, 11, 11,
  12, 12,
]);

// Vitamin K µg — Table 6d
export const VITAMIN_K_RDA = asMap([
  5, 10, 25, 35, 35,
  45, 70, 70, 70, 70, 80, 80, 80,
  45, 65, 70, 70, 70, 70, 70, 70,
  70, 70,
]);

// ═════════════════════════════════════════════════════════════════
// MINERALS (Tables 7a-7d)
// ═════════════════════════════════════════════════════════════════

// Calcium mg — Table 7a
export const CALCIUM_RDA = asMap([
  300, 400, 600, 750, 800,
  1150, 1150, 950, 950, 950, 950, 1000, 1000,
  1100, 1150, 950, 950, 950, 950, 1000, 1000,
  1000, 1000,
]);

// Chloride mg — Table 7a
export const CHLORIDE_RDA = asMap([
  180, 450, 1000, 1400, 1900,
  2300, 2300, 2300, 2300, 2300, 2300, 2300, 2300,
  2300, 2300, 2300, 2300, 2300, 2300, 2300, 2300,
  2300, 2300,
]);

// Chromium µg — Table 7a
export const CHROMIUM_RDA = asMap([
  0.2, 5.5, 11, 15, 15,
  25, 35, 35, 35, 35, 35, 30, 30,
  21, 24, 25, 25, 25, 25, 30, 30,
  30, 45,
]);

// Copper mg — Table 7a
export const COPPER_RDA = asMap([
  0.3, 0.3, 0.4, 0.7, 0.7,
  1, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3,
  1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1,
  1.2, 1.5,
]);

// Fluoride mg — Table 7b
export const FLUORIDE_RDA = asMap([
  0.25, 0.5, 0.7, 1, 1.5,
  2, 3.2, 3.8, 3.8, 3.8, 3.8, 3.8, 3.8,
  2, 3, 3, 3, 3, 3, 3, 3,
  3, 3,
]);

// Phosphorus mg — Table 7b
export const PHOSPHORUS_RDA = asMap([
  120, 275, 460, 500, 600,
  900, 800, 700, 700, 700, 700, 700, 800,
  900, 800, 700, 700, 700, 700, 700, 800,
  800, 800,
]);

// Iron mg — Table 7b (sex split 10+)
export const IRON_RDA = asMap([
  4.3, 8, 8, 8, 10,
  11, 15, 9.1, 9.1, 9.1, 9.1, 9.1, 9.1,
  11, 18, 18, 18, 18, 9, 9, 9,
  27, 15,
]);

// Iodine µg — Table 7b
export const IODINE_RDA = asMap([
  70, 90, 90, 90, 110,
  120, 150, 150, 150, 150, 150, 150, 150,
  120, 150, 150, 150, 150, 150, 150, 150,
  200, 200,
]);

// Magnesium mg — Table 7c
export const MAGNESIUM_RDA = asMap([
  40, 75, 85, 120, 170,
  280, 350, 350, 350, 350, 350, 350, 350,
  250, 300, 300, 300, 300, 280, 280, 280,
  300, 300,
]);

// Manganese mg — Table 7c
export const MANGANESE_RDA = asMap([
  0.003, 0.6, 1.2, 1.5, 1.5,
  2, 3, 3, 3, 3, 3, 3, 3,
  2, 3, 3, 3, 3, 3, 3, 3,
  3, 3,
]);

// Molybdenum µg — Table 7c
export const MOLYBDENUM_RDA = asMap([
  2, 10, 15, 22, 30,
  45, 60, 65, 65, 65, 65, 65, 65,
  45, 60, 65, 65, 65, 65, 65, 65,
  65, 65,
]);

// Potassium mg — Table 7c
export const POTASSIUM_RDA = asMap([
  400, 700, 1100, 1800, 2000,
  3100, 3500, 3500, 3500, 3500, 3500, 3500, 3900,
  2900, 3500, 3500, 3500, 3500, 3500, 3500, 3900,
  3500, 3500,  // AESAN uses 3500 baseline for most adults
]);

// Selenium µg — Table 7d
export const SELENIUM_RDA = asMap([
  12, 15, 19, 22, 30,
  45, 60, 70, 70, 70, 70, 60, 70,
  45, 55, 55, 55, 55, 55, 55, 70,
  60, 70,
]);

// Sodium mg — Table 7d
export const SODIUM_RDA = asMap([
  120, 200, 700, 900, 1200,
  1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500,
  1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500,
  1500, 1500,
]);

// Zinc mg — Table 7d
export const ZINC_RDA = asMap([
  2.8, 3, 4.1, 5.5, 6.5,
  9, 11, 11, 11, 11, 11, 11, 10,
  9, 8, 8, 8, 8, 7, 7, 10,
  12, 12,  // Preg/Lact absolute
]);

// ═════════════════════════════════════════════════════════════════
// MACROS (Tables 1-5) — EFSA-based
// ═════════════════════════════════════════════════════════════════

// Energy single PAL=1.6 (Moderately active) — we'll map to MODERATE
// Monthly infants: use their published values; children 1-9 yr single-year → aggregate to match micronutrient buckets
// Adult bands 20-29, 30-39 etc differ slightly from micronutrient (18-29 vs 20-29). Use micronutrient buckets.

// Fiber g/d — Table 4
export const FIBER_AI = asMap([
  null, null, 10, 14, 16,
  19, 21, 25, 25, 25, 25, 25, 25,
  19, 21, 25, 25, 25, 25, 25, 25,
  25, 25,
]);
