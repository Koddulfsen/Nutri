/**
 * Russia MR 2.3.1.0253-21 (2021) — Rospotrebnadzor Dietary Norms
 * Source: extracted from consolidated Russian article + cross-checked
 *
 * Adult energy/macros stored at 4 activity levels (КФА).
 * Vitamins/minerals stored per age×sex (activity-independent).
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

// ═════════════════════════════════════════════════════════════════
// Demographics
// ═════════════════════════════════════════════════════════════════
export const DEMOGRAPHICS: Demographic[] = [
  { key: 'INFANT_0_6',  minMonths: 0,   maxMonths: 5,    sex: 'BOTH',   lifeStage: 'NONE', label: 'Infants 0-6 mo' },
  { key: 'INFANT_6_12', minMonths: 6,   maxMonths: 11,   sex: 'BOTH',   lifeStage: 'NONE', label: 'Infants 6-12 mo' },
  { key: 'CHILD_1_3',   minMonths: 12,  maxMonths: 35,   sex: 'BOTH',   lifeStage: 'NONE', label: 'Children 1-3 y' },
  { key: 'CHILD_3_7',   minMonths: 36,  maxMonths: 83,   sex: 'BOTH',   lifeStage: 'NONE', label: 'Children 3-7 y' },
  { key: 'CHILD_7_11',  minMonths: 84,  maxMonths: 131,  sex: 'BOTH',   lifeStage: 'NONE', label: 'Children 7-11 y' },
  { key: 'M_11_14',     minMonths: 132, maxMonths: 167,  sex: 'MALE',   lifeStage: 'NONE', label: 'Males 11-14 y' },
  { key: 'M_14_18',     minMonths: 168, maxMonths: 215,  sex: 'MALE',   lifeStage: 'NONE', label: 'Males 14-18 y' },
  { key: 'M_18_29',     minMonths: 216, maxMonths: 359,  sex: 'MALE',   lifeStage: 'NONE', label: 'Males 18-29 y' },
  { key: 'M_30_44',     minMonths: 360, maxMonths: 539,  sex: 'MALE',   lifeStage: 'NONE', label: 'Males 30-44 y' },
  { key: 'M_45_64',     minMonths: 540, maxMonths: 779,  sex: 'MALE',   lifeStage: 'NONE', label: 'Males 45-64 y' },
  { key: 'M_65_74',     minMonths: 780, maxMonths: 899,  sex: 'MALE',   lifeStage: 'NONE', label: 'Males 65-74 y' },
  { key: 'M_75P',       minMonths: 900, maxMonths: null, sex: 'MALE',   lifeStage: 'NONE', label: 'Males 75+ y' },
  { key: 'F_11_14',     minMonths: 132, maxMonths: 167,  sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 11-14 y' },
  { key: 'F_14_18',     minMonths: 168, maxMonths: 215,  sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 14-18 y' },
  { key: 'F_18_29',     minMonths: 216, maxMonths: 359,  sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 18-29 y' },
  { key: 'F_30_44',     minMonths: 360, maxMonths: 539,  sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 30-44 y' },
  { key: 'F_45_64',     minMonths: 540, maxMonths: 779,  sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 45-64 y' },
  { key: 'F_65_74',     minMonths: 780, maxMonths: 899,  sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 65-74 y' },
  { key: 'F_75P',       minMonths: 900, maxMonths: null, sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 75+ y' },
  { key: 'PREG',        minMonths: 216, maxMonths: 539,  sex: 'FEMALE', lifeStage: 'PREGNANT',  label: 'Pregnancy' },
  { key: 'LACT',        minMonths: 216, maxMonths: 539,  sex: 'FEMALE', lifeStage: 'LACTATING', label: 'Lactation' },
];
const DEMO_BY_KEY = Object.fromEntries(DEMOGRAPHICS.map((d) => [d.key, d]));
export function demo(key: string): Demographic {
  const d = DEMO_BY_KEY[key];
  if (!d) throw new Error(`Unknown demo: ${key}`);
  return d;
}

// ═════════════════════════════════════════════════════════════════
// ADULT MACROS (Energy + Protein + Fat + Carb) at 4 activity levels
// Activity: KFA 1.4/1.6/1.9/2.2 → SEDENTARY/MODERATE/ACTIVE/VERY_ACTIVE
// Elderly 65+ at single KFA 1.7 → MODERATE
// ═════════════════════════════════════════════════════════════════

export type ActivityLevel = 'SEDENTARY' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';

export interface AdultMacroRow {
  demoKey: string;
  activityLevel: ActivityLevel;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
}

export const ADULT_MACROS: AdultMacroRow[] = [
  // Males 18-29
  { demoKey: 'M_18_29', activityLevel: 'SEDENTARY',   kcal: 2400, proteinG: 84,  fatG: 80,  carbG: 336 },
  { demoKey: 'M_18_29', activityLevel: 'MODERATE',    kcal: 2750, proteinG: 89,  fatG: 92,  carbG: 392 },
  { demoKey: 'M_18_29', activityLevel: 'ACTIVE',      kcal: 3250, proteinG: 102, fatG: 108, carbG: 467 },
  { demoKey: 'M_18_29', activityLevel: 'VERY_ACTIVE', kcal: 3800, proteinG: 114, fatG: 127, carbG: 551 },
  // Males 30-44
  { demoKey: 'M_30_44', activityLevel: 'SEDENTARY',   kcal: 2300, proteinG: 81,  fatG: 77,  carbG: 322 },
  { demoKey: 'M_30_44', activityLevel: 'MODERATE',    kcal: 2650, proteinG: 86,  fatG: 88,  carbG: 378 },
  { demoKey: 'M_30_44', activityLevel: 'ACTIVE',      kcal: 3150, proteinG: 98,  fatG: 105, carbG: 453 },
  { demoKey: 'M_30_44', activityLevel: 'VERY_ACTIVE', kcal: 3650, proteinG: 110, fatG: 122, carbG: 529 },
  // Males 45-64
  { demoKey: 'M_45_64', activityLevel: 'SEDENTARY',   kcal: 2150, proteinG: 75,  fatG: 72,  carbG: 301 },
  { demoKey: 'M_45_64', activityLevel: 'MODERATE',    kcal: 2450, proteinG: 80,  fatG: 82,  carbG: 349 },
  { demoKey: 'M_45_64', activityLevel: 'ACTIVE',      kcal: 2900, proteinG: 91,  fatG: 97,  carbG: 417 },
  { demoKey: 'M_45_64', activityLevel: 'VERY_ACTIVE', kcal: 3400, proteinG: 102, fatG: 113, carbG: 493 },
  // Males 65-74 (single level KFA 1.7)
  { demoKey: 'M_65_74', activityLevel: 'MODERATE',    kcal: 2400, proteinG: 84,  fatG: 80,  carbG: 336 },
  // Males 75+
  { demoKey: 'M_75P',   activityLevel: 'MODERATE',    kcal: 2300, proteinG: 81,  fatG: 77,  carbG: 322 },

  // Females 18-29
  { demoKey: 'F_18_29', activityLevel: 'SEDENTARY',   kcal: 1900, proteinG: 67, fatG: 63,  carbG: 266 },
  { demoKey: 'F_18_29', activityLevel: 'MODERATE',    kcal: 2200, proteinG: 72, fatG: 73,  carbG: 314 },
  { demoKey: 'F_18_29', activityLevel: 'ACTIVE',      kcal: 2600, proteinG: 81, fatG: 87,  carbG: 374 },
  { demoKey: 'F_18_29', activityLevel: 'VERY_ACTIVE', kcal: 3000, proteinG: 90, fatG: 100, carbG: 435 },
  // Females 30-44
  { demoKey: 'F_30_44', activityLevel: 'SEDENTARY',   kcal: 1800, proteinG: 63, fatG: 60,  carbG: 252 },
  { demoKey: 'F_30_44', activityLevel: 'MODERATE',    kcal: 2100, proteinG: 68, fatG: 70,  carbG: 299 },
  { demoKey: 'F_30_44', activityLevel: 'ACTIVE',      kcal: 2500, proteinG: 78, fatG: 83,  carbG: 359 },
  { demoKey: 'F_30_44', activityLevel: 'VERY_ACTIVE', kcal: 2850, proteinG: 86, fatG: 95,  carbG: 413 },
  // Females 45-64
  { demoKey: 'F_45_64', activityLevel: 'SEDENTARY',   kcal: 1700, proteinG: 60, fatG: 57,  carbG: 238 },
  { demoKey: 'F_45_64', activityLevel: 'MODERATE',    kcal: 1950, proteinG: 63, fatG: 65,  carbG: 278 },
  { demoKey: 'F_45_64', activityLevel: 'ACTIVE',      kcal: 2300, proteinG: 72, fatG: 77,  carbG: 331 },
  { demoKey: 'F_45_64', activityLevel: 'VERY_ACTIVE', kcal: 2700, proteinG: 81, fatG: 90,  carbG: 392 },
  // Females 65-74
  { demoKey: 'F_65_74', activityLevel: 'MODERATE',    kcal: 1900, proteinG: 67, fatG: 63,  carbG: 266 },
  // Females 75+
  { demoKey: 'F_75P',   activityLevel: 'MODERATE',    kcal: 1800, proteinG: 63, fatG: 60,  carbG: 252 },
];

// ═════════════════════════════════════════════════════════════════
// CHILD MACROS (single-level, no activity split for children)
// Values are midpoints of published ranges.
// ═════════════════════════════════════════════════════════════════

export interface ChildMacroRow {
  demoKey: string;
  kcal: number;
  proteinG: number | 'per_kg';
  proteinPerKg?: number;
  fatG: number | 'per_kg';
  fatPerKg?: number;
  carbG: number | 'per_kg';
  carbPerKg?: number;
}

export const CHILD_MACROS: ChildMacroRow[] = [
  // Infants (per kg body weight — document with per-kg note)
  // 0-6 mo avg weight ~6 kg; 6-12 mo ~9 kg
  // Using reference weights: 0-6 mo: 110 kcal/kg × 6 = 660; 6-12: 112.5 × 9 = 1012
  { demoKey: 'INFANT_0_6',  kcal: 660,  proteinG: 15,  fatG: 36,   carbG: 78  },  // 2.55 × 6, 6 × 6, 13 × 6
  { demoKey: 'INFANT_6_12', kcal: 1013, proteinG: 23,  fatG: 54,   carbG: 117 },  // 2.55 × 9, 6 × 9, 13 × 9
  // Children (midpoint of published range)
  { demoKey: 'CHILD_1_3',   kcal: 1400, proteinG: 42,  fatG: 47,  carbG: 200 },
  { demoKey: 'CHILD_3_7',   kcal: 1650, proteinG: 48,  fatG: 55,  carbG: 233 },
  { demoKey: 'CHILD_7_11',  kcal: 1950, proteinG: 56,  fatG: 67,  carbG: 277 },
  // Adolescents (M upper, F lower of range)
  { demoKey: 'M_11_14',     kcal: 2500, proteinG: 73,  fatG: 90,  carbG: 360 },
  { demoKey: 'F_11_14',     kcal: 2200, proteinG: 60,  fatG: 75,  carbG: 300 },
  { demoKey: 'M_14_18',     kcal: 2900, proteinG: 87,  fatG: 97,  carbG: 421 },
  { demoKey: 'F_14_18',     kcal: 2400, proteinG: 73,  fatG: 90,  carbG: 360 },
];

// ═════════════════════════════════════════════════════════════════
// VITAMINS (activity-independent)
// ═════════════════════════════════════════════════════════════════

export const DEMO_KEYS = [
  'INFANT_0_6','INFANT_6_12','CHILD_1_3','CHILD_3_7','CHILD_7_11',
  'M_11_14','M_14_18','M_18_29','M_30_44','M_45_64','M_65_74','M_75P',
  'F_11_14','F_14_18','F_18_29','F_30_44','F_45_64','F_65_74','F_75P',
  'PREG','LACT',
] as const;

type NVal = number | null;
function asMap(values: readonly NVal[]): Record<string, NVal> {
  const out: Record<string, NVal> = {};
  DEMO_KEYS.forEach((k, i) => { out[k] = values[i] ?? null; });
  return out;
}

// Vitamin C mg
export const VITAMIN_C_RNI = asMap([
  30, 35, 40, 45, 50,
  70, 90, 100, 100, 100, 100, 100,  // Males — adult 100, adolescents upper bound
  60, 70, 100, 100, 100, 100, 100,  // Females
  110, 120,  // Preg +10, Lact +20
]);

// Thiamin B1 mg
export const THIAMIN_RNI = asMap([
  0.3, 0.4, 0.6, 0.7, 0.9,
  1.3, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5,
  1.2, 1.3, 1.5, 1.5, 1.5, 1.5, 1.5,
  1.7, 1.8,
]);

// Riboflavin B2 mg
export const RIBOFLAVIN_RNI = asMap([
  0.4, 0.5, 0.8, 1.0, 1.2,
  1.5, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8,
  1.4, 1.5, 1.8, 1.8, 1.8, 1.8, 1.8,
  2.0, 2.1,
]);

// Niacin mg NE
export const NIACIN_RNI = asMap([
  5, 6, 8, 11, 15,
  18, 20, 20, 20, 20, 20, 20,
  18, 20, 20, 20, 20, 20, 20,
  22, 23,
]);

// Vitamin B6 mg
export const B6_RNI = asMap([
  0.4, 0.5, 0.9, 1.0, 1.2,
  1.8, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0,
  1.5, 1.8, 2.0, 2.0, 2.0, 2.0, 2.0,
  2.3, 2.3,
]);

// Vitamin B12 µg
export const B12_RNI = asMap([
  0.3, 0.4, 0.9, 1.2, 1.5,
  2.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0,
  1.8, 2.0, 3.0, 3.0, 3.0, 3.0, 3.0,
  3.5, 3.5,
]);

// Folate µg
export const FOLATE_RNI = asMap([
  50, 80, 150, 200, 250,
  350, 400, 400, 400, 400, 400, 400,
  300, 350, 400, 400, 400, 400, 400,
  600, 500,  // Preg +200, Lact +100
]);

// Pantothenic acid mg
export const PANTOTHENIC_AI = asMap([
  1.7, 1.9, 2.0, 3.0, 3.5,
  4.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0,
  4.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0,
  6.0, 7.0,
]);

// Biotin µg
export const BIOTIN_AI = asMap([
  10, 15, 20, 25, 30,
  40, 50, 50, 50, 50, 50, 50,
  40, 50, 50, 50, 50, 50, 50,
  50, 50,
]);

// Vitamin A µg RE
export const VITAMIN_A_RNI = asMap([
  400, 500, 600, 700, 800,
  1000, 1000, 900, 900, 900, 900, 900,
  900, 1000, 800, 800, 800, 800, 800,
  900, 1300,  // Preg +100, Lact +500
]);

// Beta-carotene mg
export const BETA_CAROTENE_AI = asMap([
  null, null, null, null, null,
  5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0,
  5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0,
  5.0, 5.0,
]);

// Vitamin D µg
export const VITAMIN_D_RNI = asMap([
  10, 10, 10, 10, 10,
  10, 10, 15, 15, 15, 20, 20,
  10, 10, 15, 15, 15, 20, 20,
  15, 15,
]);

// Vitamin E mg TE
export const VITAMIN_E_RNI = asMap([
  3, 4, 6, 7, 8,
  12, 15, 15, 15, 15, 15, 15,
  10, 12, 15, 15, 15, 15, 15,
  17, 19,
]);

// Vitamin K µg
export const VITAMIN_K_AI = asMap([
  null, null, 30, 55, 60,
  80, 120, 120, 120, 120, 120, 120,
  80, 100, 120, 120, 120, 120, 120,
  120, 120,
]);

// ═════════════════════════════════════════════════════════════════
// MINERALS
// ═════════════════════════════════════════════════════════════════

// Calcium mg
export const CALCIUM_RNI = asMap([
  400, 600, 800, 1000, 1200,
  1200, 1200, 1000, 1000, 1000, 1200, 1200,
  1200, 1200, 1000, 1000, 1000, 1200, 1200,
  1000, 1000,
]);

// Phosphorus mg
export const PHOSPHORUS_RNI = asMap([
  250, 350, 800, 900, 1100,
  1200, 1200, 700, 700, 700, 700, 700,
  1200, 1200, 700, 700, 700, 700, 700,
  700, 700,
]);

// Magnesium mg
export const MAGNESIUM_RNI = asMap([
  55, 65, 150, 200, 250,
  350, 400, 420, 420, 420, 420, 420,
  300, 350, 420, 420, 420, 420, 420,
  450, 450,
]);

// Potassium mg
export const POTASSIUM_AI = asMap([
  400, 600, 1800, 2050, 2300,
  2500, 3200, 3500, 3500, 3500, 3500, 3500,
  2400, 2500, 3500, 3500, 3500, 3500, 3500,
  3500, 3500,
]);

// Sodium mg
export const SODIUM_RNI = asMap([
  200, 280, 500, 700, 1000,
  1100, 1300, 1300, 1300, 1300, 1300, 1300,
  1100, 1300, 1300, 1300, 1300, 1300, 1300,
  1300, 1300,
]);

// Chloride mg
export const CHLORIDE_RNI = asMap([
  300, 450, 800, 1100, 1700,
  1900, 2300, 2300, 2300, 2300, 2300, 2300,
  1900, 2300, 2300, 2300, 2300, 2300, 2300,
  2300, 2300,
]);

// Iron mg (adolescent F gets 18, M 12; adult F 18 if menstruating)
export const IRON_RNI = asMap([
  4, 6, 8, 10, 12,
  12, 15, 10, 10, 10, 10, 10,    // Males
  18, 18, 18, 18, 18, 18, 18,    // Females (Russia keeps 18 for all adult F)
  33, 18,                         // Preg +15, Lact +0
]);

// Zinc mg
export const ZINC_RNI = asMap([
  3, 4, 5, 6, 8,
  11, 12, 12, 12, 12, 12, 12,
  11, 12, 12, 12, 12, 12, 12,
  15, 15,
]);

// Iodine µg
export const IODINE_RNI = asMap([
  70, 90, 100, 120, 130,
  140, 150, 150, 150, 150, 150, 150,
  140, 150, 150, 150, 150, 150, 150,
  220, 290,
]);

// Copper mg
export const COPPER_RNI = asMap([
  0.3, 0.5, 0.7, 0.8, 0.9,
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
  1.1, 1.4,
]);

// Manganese mg
export const MANGANESE_AI = asMap([
  0.02, 0.5, 1.0, 1.5, 2.0,
  2.5, 3.0, 2.0, 2.0, 2.0, 2.0, 2.0,
  2.5, 3.0, 2.0, 2.0, 2.0, 2.0, 2.0,
  2.2, 2.8,
]);

// Molybdenum µg
export const MOLYBDENUM_AI = asMap([
  null, null, null, null, null,
  null, 70, 70, 70, 70, 70, 70,
  null, 70, 70, 70, 70, 70, 70,
  70, 70,
]);

// Selenium µg
export const SELENIUM_RNI = asMap([
  10, 15, 20, 25, 30,
  40, 55, 70, 70, 70, 70, 70,
  40, 50, 55, 55, 55, 55, 55,
  65, 75,
]);

// Chromium µg
export const CHROMIUM_AI = asMap([
  null, null, 11, 15, 25,
  35, 35, 40, 40, 40, 40, 40,
  35, 35, 40, 40, 40, 40, 40,
  40, 40,
]);

// Fluoride mg
export const FLUORIDE_AI = asMap([
  1.0, 1.2, 1.4, 2.0, 3.0,
  4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0,
  4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0,
  4.0, 4.0,
]);

// Fiber g
export const FIBER_AI = asMap([
  null, null, 10, 15, 18,
  22, 25, 22, 22, 22, 22, 22,
  22, 25, 22, 22, 22, 22, 22,
  22, 22,
]);
