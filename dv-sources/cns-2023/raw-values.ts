/**
 * CNS 2023 — Dietary Reference Intakes for China
 * Source: 中国营养学会《中国居民膳食营养素参考摄入量 (2023版)》
 * Book pages 628-639 (Appendix 3, Tables 3-1 to 3-12).
 */

export type Sex = 'MALE' | 'FEMALE';

export interface Demographic {
  key: string;
  minMonths: number;
  maxMonths: number | null;
  sex: Sex | 'BOTH';
  lifeStage: 'NONE' | 'PREGNANT_T1' | 'PREGNANT_T2' | 'PREGNANT_T3' | 'LACTATING';
  label: string;
}

export const DEMOGRAPHICS: Demographic[] = [
  { key: 'INFANT_0_6',  minMonths: 0,   maxMonths: 5,    sex: 'BOTH',   lifeStage: 'NONE', label: '0岁~ (0-6 mo)' },
  { key: 'INFANT_6_12', minMonths: 6,   maxMonths: 11,   sex: 'BOTH',   lifeStage: 'NONE', label: '0.5岁~ (6-12 mo)' },
  { key: 'CHILD_1_3',   minMonths: 12,  maxMonths: 47,   sex: 'BOTH',   lifeStage: 'NONE', label: '1岁~ (1-3 y)' },
  { key: 'CHILD_4_6',   minMonths: 48,  maxMonths: 83,   sex: 'BOTH',   lifeStage: 'NONE', label: '4岁~ (4-6 y)' },
  { key: 'CHILD_7_8',   minMonths: 84,  maxMonths: 107,  sex: 'BOTH',   lifeStage: 'NONE', label: '7岁~ (7-8 y)' },
  { key: 'CHILD_9_11',  minMonths: 108, maxMonths: 143,  sex: 'BOTH',   lifeStage: 'NONE', label: '9岁~ (9-11 y)' },
  { key: 'M_12_14',     minMonths: 144, maxMonths: 179,  sex: 'MALE',   lifeStage: 'NONE', label: 'Males 12-14 y' },
  { key: 'M_15_17',     minMonths: 180, maxMonths: 215,  sex: 'MALE',   lifeStage: 'NONE', label: 'Males 15-17 y' },
  { key: 'M_18_29',     minMonths: 216, maxMonths: 359,  sex: 'MALE',   lifeStage: 'NONE', label: 'Males 18-29 y' },
  { key: 'M_30_49',     minMonths: 360, maxMonths: 599,  sex: 'MALE',   lifeStage: 'NONE', label: 'Males 30-49 y' },
  { key: 'M_50_64',     minMonths: 600, maxMonths: 779,  sex: 'MALE',   lifeStage: 'NONE', label: 'Males 50-64 y' },
  { key: 'M_65_74',     minMonths: 780, maxMonths: 899,  sex: 'MALE',   lifeStage: 'NONE', label: 'Males 65-74 y' },
  { key: 'M_75P',       minMonths: 900, maxMonths: null, sex: 'MALE',   lifeStage: 'NONE', label: 'Males 75+ y' },
  { key: 'F_12_14',     minMonths: 144, maxMonths: 179,  sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 12-14 y' },
  { key: 'F_15_17',     minMonths: 180, maxMonths: 215,  sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 15-17 y' },
  { key: 'F_18_29',     minMonths: 216, maxMonths: 359,  sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 18-29 y' },
  { key: 'F_30_49',     minMonths: 360, maxMonths: 599,  sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 30-49 y' },
  { key: 'F_50_64',     minMonths: 600, maxMonths: 779,  sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 50-64 y' },
  { key: 'F_65_74',     minMonths: 780, maxMonths: 899,  sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 65-74 y' },
  { key: 'F_75P',       minMonths: 900, maxMonths: null, sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 75+ y' },
  { key: 'PREG_T1',     minMonths: 216, maxMonths: 599,  sex: 'FEMALE', lifeStage: 'PREGNANT_T1', label: 'Pregnancy 孕早期' },
  { key: 'PREG_T2',     minMonths: 216, maxMonths: 599,  sex: 'FEMALE', lifeStage: 'PREGNANT_T2', label: 'Pregnancy 孕中期' },
  { key: 'PREG_T3',     minMonths: 216, maxMonths: 599,  sex: 'FEMALE', lifeStage: 'PREGNANT_T3', label: 'Pregnancy 孕晚期' },
  { key: 'LACT',        minMonths: 216, maxMonths: 599,  sex: 'FEMALE', lifeStage: 'LACTATING',   label: 'Lactation 乳母' },
];
const DEMO_BY_KEY = Object.fromEntries(DEMOGRAPHICS.map((d) => [d.key, d]));
export function demo(key: string): Demographic {
  const d = DEMO_BY_KEY[key];
  if (!d) throw new Error(`Unknown demo: ${key}`);
  return d;
}

export const DEMO_KEYS = [
  'INFANT_0_6','INFANT_6_12','CHILD_1_3','CHILD_4_6','CHILD_7_8','CHILD_9_11',
  'M_12_14','M_15_17','M_18_29','M_30_49','M_50_64','M_65_74','M_75P',
  'F_12_14','F_15_17','F_18_29','F_30_49','F_50_64','F_65_74','F_75P',
  'PREG_T1','PREG_T2','PREG_T3','LACT',
] as const;

type NVal = number | null;
function asMap(values: readonly NVal[]): Record<string, NVal> {
  const out: Record<string, NVal> = {};
  DEMO_KEYS.forEach((k, i) => { out[k] = values[i] ?? null; });
  return out;
}

// ═════════════════════════════════════════════════════════════════
// ENERGY (Table 3-1) at PAL II (moderate)
// Children use midpoint-year value of each bucket
// Infants: 90/75 kcal/kg × reference weight (6/8 kg)
// ═════════════════════════════════════════════════════════════════

export const ENERGY_PAL2_EER = asMap([
  540,  // 0-6 mo: 90 kcal/kg × 6 kg
  600,  // 6-12 mo: 75 kcal/kg × 8 kg
  1100, // 1-3 y — use age 2 PAL II (child table has 1=900, 2=1100, 3=1250; midpoint ~1100)
  1400, // 4-6 y — age 5 PAL II = 1400
  1700, // 7-8 y — age 7 PAL II (boy) = 1700; we use male; F version is asymmetric so approximate
  2050, // 9-11 y — age 10 M PAL II = 2050
  2600, // M 12-14 — age 12 PAL II = 2600
  2950, // M 15-17 — age 15 PAL II = 2950
  2550, // M 18-29 — 18歲 PAL II
  2500, // M 30-49
  2400, // M 50-64
  2300, // M 65-74
  2200, // M 75+
  2200, // F 12-14 — age 12 PAL II F = 2200
  2350, // F 15-17
  2100, // F 18-29
  2050, // F 30-49
  1950, // F 50-64
  1850, // F 65-74
  1750, // F 75+
  // Pregnancy/lactation (additions, shown as absolute over F 18-29 base of 2100)
  2100, // Preg T1: +0
  2350, // Preg T2: +250
  2500, // Preg T3: +400
  2500, // Lact: +400
]);

// ═════════════════════════════════════════════════════════════════
// PROTEIN (Table 3-2) — EAR + RNI
// ═════════════════════════════════════════════════════════════════

export const PROTEIN_AI = asMap([  // Infants only
  9, 17, null, null, null, null,
  null, null, null, null, null, null, null,
  null, null, null, null, null, null, null,
  null, null, null, null,
]);
export const PROTEIN_EAR = asMap([
  null, null, 20, 25, 30, 40,
  55, 60, 60, 60, 60, 60, 60,
  50, 50, 50, 50, 50, 50, 50,
  50, 60, 75, 70,
]);
export const PROTEIN_RNI = asMap([
  null, null, 25, 30, 40, 50,
  70, 75, 65, 65, 65, 72, 72,
  60, 60, 55, 55, 55, 62, 62,
  55, 70, 85, 80,
]);

// ═════════════════════════════════════════════════════════════════
// CARBOHYDRATE (Table 3-4) — EAR
// ═════════════════════════════════════════════════════════════════

export const CARB_AI = asMap([  // Infants
  60, 80, null, null, null, null,
  null, null, null, null, null, null, null,
  null, null, null, null, null, null, null,
  null, null, null, null,
]);
export const CARB_EAR = asMap([
  null, null, 120, 120, 120, 120,
  150, 150, 120, 120, 120, 120, 120,
  150, 150, 120, 120, 120, 120, 120,
  130, 140, 155, 170,  // Preg T1+10, T2+20, T3+35; Lact +50 over 120 base
]);

// Dietary Fiber AI (Table 3-4)
export const FIBER_AI = asMap([
  null, null, 7.5, 12.5, 17.5, 17.5,
  22.5, 27.5, 27.5, 27.5, 27.5, 27.5, 27.5,
  22.5, 27.5, 27.5, 27.5, 27.5, 27.5, 27.5,
  27.5, 31.5, 31.5, 31.5,  // Preg T1 +0; T2/T3 +4; Lact +4
]);

// ═════════════════════════════════════════════════════════════════
// MICROMINERALS EAR (Table 3-6)
// Columns: Ca, P, Mg, Fe (M/F), I, Zn (M/F), Se, Cu, Mo, Vit A (M/F), D, B1 (M/F), B2 (M/F), Niacin (M/F), B6, Folate, B12, C
// ═════════════════════════════════════════════════════════════════

export const CALCIUM_EAR = asMap([
  null, null, 400, 500, 650, 800,
  850, 800, 650, 650, 650, 650, 650,
  850, 800, 650, 650, 650, 650, 650,
  0, 0, 0, 0,  // Preg +0/+0/+0; Lact +0
]);
export const PHOSPHORUS_EAR = asMap([
  null, null, 250, 290, 370, 460,
  580, 600, 600, 590, 590, 570, 570,
  580, 600, 600, 590, 590, 570, 570,
  0, 0, 0, 0,
]);
export const MAGNESIUM_EAR = asMap([
  null, null, 110, 130, 170, 210,
  260, 270, 270, 270, 270, 260, 250,
  260, 270, 270, 270, 270, 260, 250,
  30, 30, 30, 0,  // Preg +30 all, Lact +0 (verified 附表 3-6; lact was mis-entered as 30)
]);
export const IRON_EAR = asMap([  // Using Male values; Female split noted
  null, 7, 7, 7, 7, 12,
  12, 12, 9, 9, 9, 9, 9,
  14, 14, 12, 12, 8, 8, 8,  // F values (menstruating: 12 for 18-49, 8 for 50+)
  0, 7, 10, 6,  // Preg: +0/+7/+10; Lact: +6
]);
export const IODINE_EAR = asMap([
  null, null, 65, 65, 65, 65,
  80, 85, 85, 85, 85, 85, 85,
  80, 85, 85, 85, 85, 85, 85,
  75, 75, 75, 85,  // Preg +75 all; Lact +85
]);
export const ZINC_EAR = asMap([
  null, null, 3.2, 4.6, 5.9, 5.9,  // 9岁~ M & F same EAR
  7.0, 9.7, 10.1, 10.1, 10.1, 10.1, 10.1,  // Male values (wait table shows "12岁 M=7.0/F=6.3" — let me use M)
  6.3, 6.5, 6.9, 6.9, 6.9, 6.9, 6.9,  // Female values
  1.7, 1.7, 1.7, 4.1,  // Preg +1.7 all; Lact +4.1
]);
export const SELENIUM_EAR = asMap([
  null, null, 20, 25, 30, 40,
  50, 50, 50, 50, 50, 50, 50,
  50, 50, 50, 50, 50, 50, 50,
  4, 4, 4, 15,  // Preg +4; Lact +15
]);
export const COPPER_EAR = asMap([
  null, null, 0.26, 0.30, 0.38, 0.47,
  0.56, 0.59, 0.62, 0.60, 0.60, 0.58, 0.57,
  0.56, 0.59, 0.62, 0.60, 0.60, 0.58, 0.57,
  0.10, 0.10, 0.10, 0.50,  // Preg +0.1; Lact +0.5 (verified 附表 3-6; was mis-entered as 0.4)
]);
export const MOLYBDENUM_EAR = asMap([
  null, null, 8, 10, 12, 15,
  25, 25, 25, 25, 25, 25, 25,
  25, 25, 25, 25, 25, 25, 25,
  0, 0, 0, 4,  // Preg +0; Lact +4 (verified 附表 3-6; preg was mis-entered as +4)
]);

// ═════════════════════════════════════════════════════════════════
// FAT-SOLUBLE + WATER-SOLUBLE VITAMIN EAR (Table 3-6 cont'd)
// ═════════════════════════════════════════════════════════════════

export const VITAMIN_A_EAR = asMap([  // Use M values (F similar for children, differs for adults)
  null, null, 250, 280, 300, 370,
  560, 580, 560, 550, 550, 540, 520,
  240, 270, 280, 470, 470, 470, 470,  // F (child 1-11 matches M; adult F lower)
  0, 50, 50, 400,  // Preg T1+0, T2+50, T3+50; Lact +400
]);
// Actually Table 3-6 shows male/female split explicitly for Vit A only at 12-18 y and adults
// I'll use the M values as primary for M-specific rows; use split-table approach for seed

export const VITAMIN_D_EAR = asMap([
  null, null, 8, 8, 8, 8,
  8, 8, 8, 8, 8, 8, 8,
  8, 8, 8, 8, 8, 8, 8,
  0, 0, 0, 0,  // Preg +0 all; Lact +0
]);

export const THIAMIN_EAR = asMap([
  null, null, 0.5, 0.7, 0.8, 0.9,
  1.1, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2,
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
  0, 0.1, 0.2, 0.2,  // Preg T1 +0, T2 +0.1, T3 +0.2; Lact +0.2
]);
export const RIBOFLAVIN_EAR = asMap([
  null, null, 0.6, 0.7, 0.8, 0.9,
  1.1, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2,
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
  0, 0.1, 0.2, 0.4,  // Preg T1 +0, T2 +0.1, T3 +0.2; Lact +0.4 (verified 附表 3-6; was 0.3)
]);
export const NIACIN_EAR = asMap([  // Male values
  null, null, 5, 6, 7, 9,
  11, 12, 12, 12, 12, 12, 12,
  4, 5, 6, 8, 9, 10, 10,  // Female values shown separately in table
  0, 0, 0, 3,
]);
export const B6_EAR = asMap([
  null, null, 0.5, 0.6, 0.8, 0.9,
  1.1, 1.2, 1.2, 1.2, 1.2, 1.3, 1.3,
  1.1, 1.2, 1.2, 1.2, 1.2, 1.3, 1.3,
  0.7, 0.7, 0.7, 0.2,
]);
export const FOLATE_EAR = asMap([
  null, null, 130, 160, 200, 240,
  310, 320, 320, 320, 320, 320, 320,
  310, 320, 320, 320, 320, 320, 320,
  200, 200, 200, 130,
]);
export const B12_EAR = asMap([
  null, null, 0.8, 1.0, 1.2, 1.5,
  1.7, 2.1, 2.0, 2.0, 2.0, 2.0, 2.0,
  1.7, 2.1, 2.0, 2.0, 2.0, 2.0, 2.0,
  0.4, 0.4, 0.4, 0.6,
]);
export const VITAMIN_C_EAR = asMap([
  null, null, 35, 40, 50, 65,
  85, 85, 85, 85, 85, 85, 85,
  85, 85, 85, 85, 85, 85, 85,
  0, 10, 10, 40,
]);

// ═════════════════════════════════════════════════════════════════
// MINERAL RNI/AI (Table 3-7)
// Ca/P RNI, K/Na AI, Mg RNI, Cl AI, Fe RNI, I RNI, Zn RNI, Se RNI, Cu RNI, F AI, Cr AI, Mn AI, Mo RNI
// ═════════════════════════════════════════════════════════════════

export const CALCIUM_RNI = asMap([
  200, 350, 500, 600, 800, 1000,
  1000, 1000, 800, 800, 800, 800, 800,
  1000, 1000, 800, 800, 800, 800, 800,
  0, 0, 0, 0,
]);
export const PHOSPHORUS_RNI = asMap([
  105, 180, 300, 350, 440, 550,
  700, 720, 720, 710, 710, 680, 680,
  700, 720, 720, 710, 710, 680, 680,
  0, 0, 0, 0,
]);
export const POTASSIUM_AI = asMap([
  400, 600, 900, 1100, 1300, 1600,
  1800, 2000, 2000, 2000, 2000, 2000, 2000,
  1800, 2000, 2000, 2000, 2000, 2000, 2000,
  0, 0, 0, 400,
]);
export const SODIUM_AI = asMap([  // Note: row shows ranges "500-700" etc. Using lower bound
  80, 180, 500, 800, 900, 1100,
  1400, 1500, 1500, 1500, 1400, 1400, 1400,
  1400, 1500, 1500, 1500, 1400, 1400, 1400,
  0, 0, 0, 0,
]);
export const MAGNESIUM_RNI = asMap([
  20, 65, 140, 160, 200, 250,
  320, 330, 330, 320, 320, 310, 300,
  320, 330, 330, 320, 320, 310, 300,
  40, 40, 40, 0,
]);
export const CHLORIDE_AI = asMap([
  120, 450, 1000, 1200, 1400, 1700,
  2200, 2500, 2300, 2300, 2300, 2200, 2200,
  2200, 2500, 2300, 2300, 2300, 2200, 2200,
  0, 0, 0, 0,
]);
// Iron RNI — female menstruating 18 mg
export const IRON_RNI_M = asMap([  // Males
  0.3, 10, 10, 10, 12, 16,
  16, 16, 12, 12, 12, 12, 12,
  null, null, null, null, null, null, null,
  null, null, null, null,
]);
export const IRON_RNI_F = asMap([
  null, null, null, null, null, null,
  null, null, null, null, null, null, null,
  18, 18, 18, 18, 10, 10, 10,  // F 50-64: 10 (postmeno)
  null, 7, 11, 6,  // Preg T1+0, T2+7, T3+11; Lact +6
]);
// F 50-64 menstruating alternate: 18 mg
export const IRON_RNI_F_MENSTRUATING_50 = 18;

export const IODINE_RNI = asMap([
  85, 115, 90, 90, 90, 90,
  110, 120, 120, 120, 120, 120, 120,
  110, 120, 120, 120, 120, 120, 120,
  110, 110, 110, 120,
]);
export const ZINC_RNI = asMap([
  1.5, 3.2, 4.0, 5.5, 7.0, 7.0,
  8.5, 11.5, 12.0, 12.0, 12.0, 12.0, 12.0,
  7.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5,
  2.0, 2.0, 2.0, 4.5,
]);
export const SELENIUM_RNI = asMap([
  15, 20, 25, 30, 40, 45,
  60, 60, 60, 60, 60, 60, 60,
  60, 60, 60, 60, 60, 60, 60,
  5, 5, 5, 18,
]);
export const COPPER_RNI = asMap([
  0.3, 0.3, 0.3, 0.4, 0.5, 0.6,
  0.7, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8,
  0.7, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8,
  0.1, 0.1, 0.1, 0.7,
]);
export const FLUORIDE_AI = asMap([
  0.01, 0.23, 0.6, 0.7, 1.0, 1.1,
  1.4, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5,
  1.4, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5,
  0, 0, 0, 0,
]);
export const CHROMIUM_AI = asMap([
  0.2, 5, 15, 15, 20, 25,
  33, 35, 35, 35, 35, 30, 30,
  30, 35, 35, 35, 35, 30, 30,
  0, 3, 5, 5,
]);
export const MANGANESE_AI = asMap([
  0.01, 0.7, 1.5, 2.0, 2.5, 3.0,
  4.0, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5,
  4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0,
  0, 0, 0, 0.2,
]);
export const MOLYBDENUM_RNI = asMap([
  3, 6, 10, 12, 15, 20,
  25, 25, 25, 25, 25, 25, 25,
  25, 25, 25, 25, 25, 25, 25,
  0, 0, 0, 5,
]);

// ═════════════════════════════════════════════════════════════════
// VITAMIN RNI/AI (Table 3-8)
// ═════════════════════════════════════════════════════════════════

// Vitamin A male/female split
export const VITAMIN_A_RNI_M = asMap([
  300, 350, 340, 390, 430, 560,
  780, 810, 770, 770, 750, 730, 710,
  null, null, null, null, null, null, null,
  null, null, null, null,
]);
export const VITAMIN_A_RNI_F = asMap([
  null, null, 330, 380, 390, 540,
  null, null, null, null, null, null, null,
  730, 660, 660, 660, 660, 640, 600,
  0, 70, 70, 600,
]);

export const VITAMIN_D_RNI = asMap([
  10, 10, 10, 10, 10, 10,
  10, 10, 10, 10, 10, 15, 15,
  10, 10, 10, 10, 10, 15, 15,
  0, 0, 0, 0,
]);

export const VITAMIN_E_AI = asMap([
  3, 4, 6, 7, 9, 11,
  13, 14, 14, 14, 14, 14, 14,
  13, 14, 14, 14, 14, 14, 14,
  0, 0, 0, 3,
]);

export const VITAMIN_K_AI = asMap([
  2, 10, 30, 40, 50, 60,
  70, 75, 80, 80, 80, 80, 80,
  70, 75, 80, 80, 80, 80, 80,
  0, 0, 0, 5,
]);

export const THIAMIN_RNI_M = asMap([
  0.1, 0.3, 0.6, 0.9, 1.0, 1.1,
  1.4, 1.6, 1.4, 1.4, 1.4, 1.4, 1.4,
  null, null, null, null, null, null, null,
  null, null, null, null,
]);
export const THIAMIN_RNI_F = asMap([
  null, null, 0.6, 0.9, 0.9, 1.1,
  null, null, null, null, null, null, null,
  1.2, 1.3, 1.2, 1.2, 1.2, 1.2, 1.2,
  0, 0.2, 0.3, 0.3,
]);

export const RIBOFLAVIN_RNI_M = asMap([
  0.4, 0.6, 0.7, 0.9, 1.0, 1.1,
  1.4, 1.6, 1.4, 1.4, 1.4, 1.4, 1.4,
  null, null, null, null, null, null, null,
  null, null, null, null,
]);
export const RIBOFLAVIN_RNI_F = asMap([
  null, null, 0.6, 0.8, 0.9, 1.0,
  null, null, null, null, null, null, null,
  1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2,
  0, 0.1, 0.2, 0.5,
]);

export const NIACIN_RNI_M = asMap([
  1, 2, 6, 7, 9, 10,  // 7-8 y verified 附表 3-8: 9 (was 8)
  13, 15, 15, 15, 15, 14, 14,
  null, null, null, null, null, null, null,
  null, null, null, null,
]);
export const NIACIN_RNI_F = asMap([
  null, null, 5, 6, 8, 10,  // 7-8 y verified 附表 3-8: 8 (was 7)
  null, null, null, null, null, null, null,
  12, 12, 12, 12, 12, 11, 11,
  0, 0, 0, 4,
]);

export const B6_RNI = asMap([
  0.1, 0.3, 0.6, 0.7, 0.8, 1.0,
  1.3, 1.4, 1.4, 1.4, 1.4, 1.6, 1.6,
  1.3, 1.4, 1.4, 1.4, 1.4, 1.6, 1.6,
  0.8, 0.8, 0.8, 0.3,
]);

export const FOLATE_RNI = asMap([
  65, 100, 160, 190, 240, 290,
  370, 400, 400, 400, 400, 400, 400,
  370, 400, 400, 400, 400, 400, 400,
  200, 200, 200, 150,
]);

export const B12_RNI = asMap([
  0.3, 0.6, 1.0, 1.2, 1.4, 1.8,
  2.0, 2.5, 2.4, 2.4, 2.4, 2.4, 2.4,
  2.0, 2.5, 2.4, 2.4, 2.4, 2.4, 2.4,
  0.5, 0.5, 0.5, 0.8,
]);

export const PANTOTHENIC_AI = asMap([
  1.7, 1.9, 2.1, 2.5, 3.1, 3.8,
  4.9, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0,
  4.9, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0,
  1.0, 1.0, 1.0, 2.0,
]);

export const BIOTIN_AI = asMap([
  5, 10, 17, 20, 25, 30,
  40, 40, 40, 40, 40, 40, 40,
  40, 40, 40, 40, 40, 40, 40,
  10, 10, 10, 10,
]);

export const CHOLINE_AI_M = asMap([
  120, 140, 170, 200, 250, 300,
  380, 450, 450, 450, 450, 450, 450,
  null, null, null, null, null, null, null,
  null, null, null, null,
]);
export const CHOLINE_AI_F = asMap([
  null, null, 170, 200, 250, 300,
  null, null, null, null, null, null, null,
  380, 380, 380, 380, 380, 380, 380,
  80, 80, 80, 120,
]);

export const VITAMIN_C_RNI = asMap([
  40, 40, 40, 50, 60, 75,
  95, 100, 100, 100, 100, 100, 100,
  95, 100, 100, 100, 100, 100, 100,
  0, 15, 15, 50,
]);

// ═════════════════════════════════════════════════════════════════
// PI-NCD (Table 3-9) — Chronic disease prevention intake → CDRR
// Only K, Na, Vit C published
// ═════════════════════════════════════════════════════════════════

export const POTASSIUM_PI_NCD = asMap([
  null, null, null, 1800, 2200, 2800,
  3200, 3600, 3600, 3600, 3600, 3600, 3600,
  3200, 3600, 3600, 3600, 3600, 3600, 3600,
  0, 0, 0, 0,
]);

export const SODIUM_PI_NCD = asMap([  // ≤ upper
  null, null, null, 1000, 1200, 1500,
  1900, 2100, 2000, 2000, 2000, 1900, 1800,
  1900, 2100, 2000, 2000, 2000, 1900, 1800,
  0, 0, 0, 0,
]);

export const VITAMIN_C_PI_NCD = asMap([
  null, null, null, null, null, null,
  null, null, 200, 200, 200, 200, 200,
  null, null, 200, 200, 200, 200, 200,
  0, 0, 0, 0,
]);

// ═════════════════════════════════════════════════════════════════
// MICRONUTRIENT UL (Table 3-10)
// ═════════════════════════════════════════════════════════════════

export const CALCIUM_UL = asMap([
  1000, 1500, 1500, 2000, 2000, 2000,
  2000, 2000, 2000, 2000, 2000, 2000, 2000,
  2000, 2000, 2000, 2000, 2000, 2000, 2000,
  2000, 2000, 2000, 2000,
]);
export const PHOSPHORUS_UL = asMap([
  null, null, null, null, null, null,
  null, null, 3500, 3500, 3500, 3500, 3500,
  null, null, 3500, 3500, 3500, 3500, 3500,
  3500, 3500, 3500, 3500,
]);
export const IRON_UL = asMap([
  null, null, 25, 30, 35, 35,
  40, 40, 42, 42, 42, 42, 42,
  40, 40, 42, 42, 42, 42, 42,
  42, 42, 42, 42,
]);
export const IODINE_UL = asMap([
  null, null, null, 200, 250, 250,
  300, 400, 600, 600, 600, 600, 600,
  300, 400, 600, 600, 600, 600, 600,
  500, 500, 500, 500,
]);
export const ZINC_UL = asMap([
  null, null, 9, 13, 21, 24,
  32, 37, 40, 40, 40, 40, 40,
  32, 37, 40, 40, 40, 40, 40,
  40, 40, 40, 40,
]);
export const SELENIUM_UL = asMap([
  55, 80, 80, 120, 150, 200,
  300, 350, 400, 400, 400, 400, 400,
  300, 350, 400, 400, 400, 400, 400,
  400, 400, 400, 400,
]);
export const COPPER_UL = asMap([
  null, null, 2.0, 3.0, 3.0, 5.0,
  6.0, 7.0, 8.0, 8.0, 8.0, 8.0, 8.0,
  6.0, 7.0, 8.0, 8.0, 8.0, 8.0, 8.0,
  8.0, 8.0, 8.0, 8.0,
]);
export const FLUORIDE_UL = asMap([
  null, null, 0.8, 1.1, 1.5, 2.0,
  2.4, 2.4, 3.5, 3.5, 3.5, 3.5, 3.5,
  2.4, 2.4, 3.5, 3.5, 3.5, 3.5, 3.5,
  3.5, 3.5, 3.5, 3.5,
]);
export const MANGANESE_UL = asMap([
  null, null, null, 3.5, 5.0, 6.5,
  10, 10, 11, 11, 11, 11, 11,
  10, 10, 11, 11, 11, 11, 11,
  11, 11, 11, 11,
]);
export const MOLYBDENUM_UL = asMap([
  null, null, 200, 300, 400, 500,
  500, 500, 900, 900, 900, 900, 900,
  500, 500, 900, 900, 900, 900, 900,
  900, 900, 900, 900,
]);
export const VITAMIN_A_UL = asMap([
  600, 600, 700, 1000, 1300, 1800,
  2400, 2800, 3000, 3000, 3000, 3000, 3000,
  2400, 2800, 3000, 3000, 3000, 3000, 3000,
  3000, 3000, 3000, 3000,
]);
export const VITAMIN_D_UL = asMap([
  20, 20, 20, 20, 45, 45,
  50, 50, 50, 50, 50, 50, 50,
  50, 50, 50, 50, 50, 50, 50,
  50, 50, 50, 50,
]);
export const VITAMIN_E_UL = asMap([
  null, null, 150, 200, 300, 400,
  500, 600, 700, 700, 700, 700, 700,
  500, 600, 700, 700, 700, 700, 700,
  700, 700, 700, 700,
]);
export const NIACIN_UL = asMap([  // Niacin as mg NE (nicotinic acid)
  null, null, 11, 15, 19, 23,
  30, 33, 35, 35, 35, 35, 35,
  30, 33, 35, 35, 35, 35, 35,
  35, 35, 35, 35,
]);
export const B6_UL = asMap([
  null, null, 20, 25, 32, 40,
  50, 55, 60, 60, 60, 55, 55,
  50, 55, 60, 60, 60, 55, 55,
  60, 60, 60, 60,
]);
export const FOLATE_UL = asMap([
  null, null, 300, 400, 500, 650,
  800, 900, 1000, 1000, 1000, 1000, 1000,
  800, 900, 1000, 1000, 1000, 1000, 1000,
  1000, 1000, 1000, 1000,
]);
export const CHOLINE_UL = asMap([
  null, null, 1000, 1000, 2000, 2000,
  2000, 2500, 3000, 3000, 3000, 3000, 3000,
  2000, 2500, 3000, 3000, 3000, 3000, 3000,
  3000, 3000, 3000, 3000,
]);
export const VITAMIN_C_UL = asMap([
  null, null, 400, 600, 800, 1100,
  1600, 1800, 2000, 2000, 2000, 2000, 2000,
  1600, 1800, 2000, 2000, 2000, 2000, 2000,
  2000, 2000, 2000, 2000,
]);

// ═════════════════════════════════════════════════════════════════
// WATER (Table 3-11) — total water AI in mL/d
// ═════════════════════════════════════════════════════════════════

export const WATER_TOTAL_AI_M = asMap([
  700, 900, 1300, 1600, 1800, 1800,
  2300, 2500, 3000, 3000, 3000, 3000, 3000,
  null, null, null, null, null, null, null,
  null, null, null, null,
]);
export const WATER_TOTAL_AI_F = asMap([
  700, 900, 1300, 1600, 1800, 1800,
  null, null, null, null, null, null, null,
  2000, 2200, 2700, 2700, 2700, 2700, 2700,
  0, 300, 300, 1100,
]);
