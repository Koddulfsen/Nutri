/**
 * KDRI 2020 — raw reference values
 * Source: MOHW/KNS 2020 Dietary Reference Intakes for Koreans
 *   Book 1 Appendix 2 "Summary of 2020 DRIs for Koreans" pages 255-264
 * Errata 4 (Nov 2021) applied: Carb preg/lact values corrected.
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
// Demographics (24 groups)
// ═════════════════════════════════════════════════════════════════
export const DEMOGRAPHICS: Demographic[] = [
  { key: 'INFANT_0_5',  minMonths: 0,   maxMonths: 5,    sex: 'BOTH',   lifeStage: 'NONE',      label: 'Infants 0-5 mo' },
  { key: 'INFANT_6_11', minMonths: 6,   maxMonths: 11,   sex: 'BOTH',   lifeStage: 'NONE',      label: 'Infants 6-11 mo' },
  { key: 'CHILD_1_2',   minMonths: 12,  maxMonths: 35,   sex: 'BOTH',   lifeStage: 'NONE',      label: 'Children 1-2 y' },
  { key: 'CHILD_3_5',   minMonths: 36,  maxMonths: 71,   sex: 'BOTH',   lifeStage: 'NONE',      label: 'Children 3-5 y' },
  { key: 'M_6_8',       minMonths: 72,  maxMonths: 107,  sex: 'MALE',   lifeStage: 'NONE',      label: 'Males 6-8 y' },
  { key: 'M_9_11',      minMonths: 108, maxMonths: 143,  sex: 'MALE',   lifeStage: 'NONE',      label: 'Males 9-11 y' },
  { key: 'M_12_14',     minMonths: 144, maxMonths: 179,  sex: 'MALE',   lifeStage: 'NONE',      label: 'Males 12-14 y' },
  { key: 'M_15_18',     minMonths: 180, maxMonths: 227,  sex: 'MALE',   lifeStage: 'NONE',      label: 'Males 15-18 y' },
  { key: 'M_19_29',     minMonths: 228, maxMonths: 359,  sex: 'MALE',   lifeStage: 'NONE',      label: 'Males 19-29 y' },
  { key: 'M_30_49',     minMonths: 360, maxMonths: 599,  sex: 'MALE',   lifeStage: 'NONE',      label: 'Males 30-49 y' },
  { key: 'M_50_64',     minMonths: 600, maxMonths: 779,  sex: 'MALE',   lifeStage: 'NONE',      label: 'Males 50-64 y' },
  { key: 'M_65_74',     minMonths: 780, maxMonths: 899,  sex: 'MALE',   lifeStage: 'NONE',      label: 'Males 65-74 y' },
  { key: 'M_75P',       minMonths: 900, maxMonths: null, sex: 'MALE',   lifeStage: 'NONE',      label: 'Males ≥75 y' },
  { key: 'F_6_8',       minMonths: 72,  maxMonths: 107,  sex: 'FEMALE', lifeStage: 'NONE',      label: 'Females 6-8 y' },
  { key: 'F_9_11',      minMonths: 108, maxMonths: 143,  sex: 'FEMALE', lifeStage: 'NONE',      label: 'Females 9-11 y' },
  { key: 'F_12_14',     minMonths: 144, maxMonths: 179,  sex: 'FEMALE', lifeStage: 'NONE',      label: 'Females 12-14 y' },
  { key: 'F_15_18',     minMonths: 180, maxMonths: 227,  sex: 'FEMALE', lifeStage: 'NONE',      label: 'Females 15-18 y' },
  { key: 'F_19_29',     minMonths: 228, maxMonths: 359,  sex: 'FEMALE', lifeStage: 'NONE',      label: 'Females 19-29 y' },
  { key: 'F_30_49',     minMonths: 360, maxMonths: 599,  sex: 'FEMALE', lifeStage: 'NONE',      label: 'Females 30-49 y' },
  { key: 'F_50_64',     minMonths: 600, maxMonths: 779,  sex: 'FEMALE', lifeStage: 'NONE',      label: 'Females 50-64 y' },
  { key: 'F_65_74',     minMonths: 780, maxMonths: 899,  sex: 'FEMALE', lifeStage: 'NONE',      label: 'Females 65-74 y' },
  { key: 'F_75P',       minMonths: 900, maxMonths: null, sex: 'FEMALE', lifeStage: 'NONE',      label: 'Females ≥75 y' },
  { key: 'PREG',        minMonths: 228, maxMonths: 599,  sex: 'FEMALE', lifeStage: 'PREGNANT',  label: 'Pregnancy' },
  { key: 'LACT',        minMonths: 228, maxMonths: 599,  sex: 'FEMALE', lifeStage: 'LACTATING', label: 'Lactation' },
];
const DEMO_BY_KEY = Object.fromEntries(DEMOGRAPHICS.map((d) => [d.key, d]));
export function demo(key: string): Demographic {
  const d = DEMO_BY_KEY[key];
  if (!d) throw new Error(`Unknown demo: ${key}`);
  return d;
}

// ═════════════════════════════════════════════════════════════════
// Helper: parallel arrays for each age group
// Arrays ordered by: [infant 0-5, 6-11, child 1-2, 3-5, M 6-8, 9-11, 12-14, 15-18,
//                    19-29, 30-49, 50-64, 65-74, 75+, F same 9 ages, Preg, Lact]
// Length always 24.
// ═════════════════════════════════════════════════════════════════

type NVal = number | null;
type ValArr = readonly NVal[];

export const DEMO_KEYS = [
  'INFANT_0_5','INFANT_6_11','CHILD_1_2','CHILD_3_5',
  'M_6_8','M_9_11','M_12_14','M_15_18','M_19_29','M_30_49','M_50_64','M_65_74','M_75P',
  'F_6_8','F_9_11','F_12_14','F_15_18','F_19_29','F_30_49','F_50_64','F_65_74','F_75P',
  'PREG','LACT',
] as const;

function asMap(values: ValArr): Record<string, NVal> {
  const out: Record<string, NVal> = {};
  DEMO_KEYS.forEach((k, i) => { out[k] = values[i] ?? null; });
  return out;
}

// ═════════════════════════════════════════════════════════════════
// MACROS (Book 1 Appendix 2, pages 255-256)
// ═════════════════════════════════════════════════════════════════

// Energy kcal/d — EER (stored as EAR valueType)
// Preg +340 (avg 2nd/3rd trimester), Lact +340
// i0-5, i6-11, c1-2, c3-5, M6-8..75+, F6-8..75+, Preg, Lact
export const ENERGY_EER = asMap([
  500, 600, 900, 1400,
  1700, 2000, 2500, 2700, 2600, 2500, 2200, 2000, 1900,
  1500, 1800, 2000, 2000, 2000, 1900, 1700, 1600, 1500,
  2340, // Pregnancy +340 over F 19-29 = 2000+340 (use T2+T3 avg per errata)
  2340, // Lactation +340 over F 19-29
]);

// Carbohydrate g/d
export const CARB_EAR = asMap([
  null, null, 100, 100,
  100, 100, 100, 100, 100, 100, 100, 100, 100,
  100, 100, 100, 100, 100, 100, 100, 100, 100,
  135, // Preg = 100 + 35
  160, // Lact = 100 + 60
]);
export const CARB_RNI = asMap([
  null, null, 130, 130,
  130, 130, 130, 130, 130, 130, 130, 130, 130,
  130, 130, 130, 130, 130, 130, 130, 130, 130,
  175, // Preg = 130 + 45 (errata 4: was 180)
  210, // Lact = 130 + 80 (errata 4: was 215)
]);

// Total fiber g/d — AI only
export const FIBER_AI = asMap([
  null, null, 15, 20,
  25, 25, 30, 30, 30, 30, 30, 25, 25,
  20, 25, 25, 25, 20, 20, 20, 20, 20,
  25, // Preg = 20 + 5
  25, // Lact = 20 + 5
]);

// Fat g/d — AI (infant only)
export const FAT_AI = asMap([
  25, 25, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null,
]);

// Linoleic acid (n-6) g/d — AI
export const LA_AI = asMap([
  5.0, 7.0, 4.5, 7.0,
  9.0, 9.5, 12.0, 14.0, 13.0, 11.5, 9.0, 7.0, 5.0,
  7.0, 9.0, 9.0, 10.0, 10.0, 8.5, 7.0, 4.5, 3.0,
  10.0, // Preg +0 → 10 (base for F 19-29 is 10, preg adds 0)
  10.0, // Lact +0
]);

// α-Linolenic acid (n-3) g/d — AI
export const ALA_AI = asMap([
  0.6, 0.8, 0.6, 0.9,
  1.1, 1.3, 1.5, 1.7, 1.6, 1.4, 1.4, 1.2, 0.9,
  0.8, 1.1, 1.2, 1.1, 1.2, 1.2, 1.2, 1.0, 0.4,
  1.2, // Preg +0
  1.2, // Lact +0
]);

// EPA+DHA mg/d — AI (infant = DHA only)
export const EPA_DHA_AI = asMap([
  200, 300, null, null,
  200, 220, 230, 230, 210, 400, 500, 310, 280,
  200, 150, 210, 100, 150, 260, 240, 150, 140,
  150, // Preg +0
  150, // Lact +0
]);

// Water mL/d — liquid AI
export const WATER_LIQUID_AI = asMap([
  700, 500, 700, 1100,
  800, 900, 1100, 1200, 1200, 1300, 1200, 1000, 1000,
  800, 900, 900, 900, 1000, 1000, 1000, 900, 1000,
  1000, // Preg +0 (same as F 19-29)
  1500, // Lact = 1000 + 500
]);

// Water mL/d — total AI
export const WATER_TOTAL_AI = asMap([
  700, 800, 1000, 1500,
  1700, 2000, 2400, 2600, 2600, 2500, 2200, 2100, 2100,
  1600, 1900, 2000, 2000, 2100, 2000, 1900, 1800, 1800,
  2300, // Preg = 2100 + 200
  2800, // Lact = 2100 + 700
]);

// Protein g/d — EAR
export const PROTEIN_EAR = asMap([
  null, 12, 15, 20,
  30, 40, 50, 55, 50, 50, 50, 50, 50,
  30, 40, 45, 45, 45, 40, 40, 40, 40,
  62, // Preg avg = 50 + avg(+12, +25)/1 = ~62 approx (preg: +0/+12/+25 by trimester, avg 12.33)
  70, // Lact = 50 + 20
]);
export const PROTEIN_RNI = asMap([
  null, 15, 20, 25,
  35, 50, 60, 65, 65, 65, 60, 60, 60,
  35, 45, 55, 55, 55, 50, 50, 50, 50,
  80, // Preg 2/3 trimester avg = 55 + avg(+15, +30) ≈ 77.5 → round 80
  80, // Lact = 55 + 25
]);

// Infant AI for Protein (0-5 mo)
export const PROTEIN_AI = asMap([
  10, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null,
]);

// ═════════════════════════════════════════════════════════════════
// FAT-SOLUBLE VITAMINS (page 259)
// ═════════════════════════════════════════════════════════════════

// Vitamin A µg RAE/d — EAR / RNI / UL (preg +50/+70 over F 19-29 base 460/650)
export const VITAMIN_A_EAR = asMap([
  null, null, 190, 230,
  310, 410, 530, 620, 570, 560, 530, 510, 500,
  290, 390, 480, 450, 460, 450, 430, 410, 410,
  510, // Preg = 460 + 50
  810, // Lact = 460 + 350
]);
export const VITAMIN_A_RNI = asMap([
  null, null, 250, 300,
  450, 600, 750, 850, 800, 800, 750, 700, 700,
  400, 550, 650, 650, 650, 650, 600, 600, 600,
  720, // Preg = 650 + 70
  1140, // Lact = 650 + 490
]);
export const VITAMIN_A_AI = asMap([
  350, 450, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null,
]);
export const VITAMIN_A_UL = asMap([
  600, 600, 600, 750,
  1100, 1600, 2300, 2800, 3000, 3000, 3000, 3000, 3000,
  1100, 1600, 2300, 2800, 3000, 3000, 3000, 3000, 3000,
  3000, 3000,
]);

// Vitamin D µg/d — AI + UL
export const VITAMIN_D_AI = asMap([
  5, 5, 5, 5,
  5, 5, 10, 10, 10, 10, 10, 15, 15,
  5, 5, 10, 10, 10, 10, 10, 15, 15,
  10, // Preg +0
  10, // Lact +0
]);
export const VITAMIN_D_UL = asMap([
  25, 25, 30, 35,
  40, 60, 100, 100, 100, 100, 100, 100, 100,
  40, 60, 100, 100, 100, 100, 100, 100, 100,
  100, 100,
]);

// Vitamin E mg α-TE/d — AI + UL
export const VITAMIN_E_AI = asMap([
  3, 4, 5, 6,
  7, 9, 11, 12, 12, 12, 12, 12, 12,
  7, 9, 11, 12, 12, 12, 12, 12, 12,
  12, 15, // Preg +0, Lact +3
]);
export const VITAMIN_E_UL = asMap([
  null, null, 100, 150,
  200, 300, 400, 500, 540, 540, 540, 540, 540,
  200, 300, 400, 500, 540, 540, 540, 540, 540,
  540, 540,
]);

// Vitamin K µg/d — AI only
export const VITAMIN_K_AI = asMap([
  4, 6, 25, 30,
  40, 55, 70, 80, 75, 75, 75, 75, 75,
  40, 55, 65, 65, 65, 65, 65, 65, 65,
  65, 65, // Preg +0, Lact +0
]);

// ═════════════════════════════════════════════════════════════════
// WATER-SOLUBLE VITAMINS (page 260-261)
// ═════════════════════════════════════════════════════════════════

// Vitamin C mg/d — EAR/RNI/UL (infant AI)
export const VITAMIN_C_EAR = asMap([
  null, null, 30, 35,
  40, 55, 70, 80, 75, 75, 75, 75, 75,
  40, 55, 70, 80, 75, 75, 75, 75, 75,
  85, // Preg = 75 + 10
  110, // Lact = 75 + 35
]);
export const VITAMIN_C_RNI = asMap([
  null, null, 40, 45,
  50, 70, 90, 100, 100, 100, 100, 100, 100,
  50, 70, 90, 100, 100, 100, 100, 100, 100,
  110, // Preg = 100 + 10
  140, // Lact = 100 + 40
]);
export const VITAMIN_C_AI = asMap([
  40, 55, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null,
]);
export const VITAMIN_C_UL = asMap([
  null, null, 340, 510,
  750, 1100, 1400, 1600, 2000, 2000, 2000, 2000, 2000,
  750, 1100, 1400, 1600, 2000, 2000, 2000, 2000, 2000,
  2000, 2000,
]);

// Thiamin mg/d — EAR/RNI (infant AI)
export const THIAMIN_EAR = asMap([
  null, null, 0.4, 0.4,
  0.5, 0.7, 0.9, 1.1, 1.0, 1.0, 1.0, 0.9, 0.9,
  0.6, 0.8, 0.9, 0.9, 0.9, 0.9, 0.9, 0.8, 0.7,
  1.3, // Preg = 0.9 + 0.4
  1.2, // Lact = 0.9 + 0.3
]);
export const THIAMIN_RNI = asMap([
  null, null, 0.4, 0.5,
  0.7, 0.9, 1.1, 1.3, 1.2, 1.2, 1.2, 1.1, 1.1,
  0.7, 0.9, 1.1, 1.1, 1.1, 1.1, 1.1, 1.0, 0.8,
  1.5, // Preg = 1.1 + 0.4
  1.5, // Lact = 1.1 + 0.4
]);
export const THIAMIN_AI = asMap([
  0.2, 0.3, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null,
]);

// Riboflavin mg/d
export const RIBOFLAVIN_EAR = asMap([
  null, null, 0.4, 0.5,
  0.7, 0.9, 1.2, 1.4, 1.3, 1.3, 1.3, 1.2, 1.1,
  0.6, 0.8, 1.0, 1.0, 1.0, 1.0, 1.0, 0.9, 0.8,
  1.3, // Preg = 1.0 + 0.3
  1.4, // Lact = 1.0 + 0.4
]);
export const RIBOFLAVIN_RNI = asMap([
  null, null, 0.5, 0.6,
  0.9, 1.1, 1.5, 1.7, 1.5, 1.5, 1.5, 1.4, 1.3,
  0.8, 1.0, 1.2, 1.2, 1.2, 1.2, 1.2, 1.1, 1.0,
  1.6, // Preg = 1.2 + 0.4
  1.7, // Lact = 1.2 + 0.5
]);
export const RIBOFLAVIN_AI = asMap([
  0.3, 0.4, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null,
]);

// Niacin mg NE/d — EAR/RNI/UL (UL has form-split, store nicotinic acid = stricter)
export const NIACIN_EAR = asMap([
  null, null, 4, 5,
  7, 9, 11, 13, 12, 12, 12, 11, 10,
  7, 9, 11, 11, 11, 11, 11, 10, 9,
  14, // Preg = 11 + 3
  13, // Lact = 11 + 2
]);
export const NIACIN_RNI = asMap([
  null, null, 6, 7,
  9, 11, 15, 17, 16, 16, 16, 14, 13,
  9, 12, 15, 14, 14, 14, 14, 13, 12,
  18, // Preg = 14 + 4
  17, // Lact = 14 + 3
]);
export const NIACIN_AI = asMap([
  2, 3, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null,
]);
// Nicotinic acid UL (the stricter form)
export const NIACIN_UL = asMap([
  null, null, 10, 10,
  15, 20, 25, 30, 35, 35, 35, 35, 35,
  15, 20, 25, 30, 35, 35, 35, 35, 35,
  35, 35,
]);

// Vitamin B6 mg/d
export const B6_EAR = asMap([
  null, null, 0.5, 0.6,
  0.7, 0.9, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3,
  0.7, 0.9, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2,
  1.9, // Preg = 1.2 + 0.7
  1.9, // Lact = 1.2 + 0.7
]);
export const B6_RNI = asMap([
  null, null, 0.6, 0.7,
  0.9, 1.1, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5,
  0.9, 1.1, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4,
  2.2, // Preg = 1.4 + 0.8
  2.2, // Lact = 1.4 + 0.8
]);
export const B6_AI = asMap([
  0.1, 0.3, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null,
]);
export const B6_UL = asMap([
  null, null, 20, 30,
  45, 60, 80, 95, 100, 100, 100, 100, 100,
  45, 60, 80, 95, 100, 100, 100, 100, 100,
  100, 100,
]);

// Folate µg DFE/d
export const FOLATE_EAR = asMap([
  null, null, 120, 150,
  180, 250, 300, 330, 320, 320, 320, 320, 320,
  180, 250, 300, 330, 320, 320, 320, 320, 320,
  520, // Preg = 320 + 200
  450, // Lact = 320 + 130
]);
export const FOLATE_RNI = asMap([
  null, null, 150, 180,
  220, 300, 360, 400, 400, 400, 400, 400, 400,
  220, 300, 360, 400, 400, 400, 400, 400, 400,
  620, // Preg = 400 + 220
  550, // Lact = 400 + 150
]);
export const FOLATE_AI = asMap([
  65, 90, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null,
]);
export const FOLATE_UL = asMap([
  null, null, 300, 400,
  500, 600, 800, 900, 1000, 1000, 1000, 1000, 1000,
  500, 600, 800, 900, 1000, 1000, 1000, 1000, 1000,
  1000, 1000,
]);

// Vitamin B12 µg/d
export const B12_EAR = asMap([
  null, null, 0.8, 0.9,
  1.1, 1.5, 1.9, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0,
  1.1, 1.5, 1.9, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0,
  2.2, // Preg = 2.0 + 0.2
  2.3, // Lact = 2.0 + 0.3
]);
export const B12_RNI = asMap([
  null, null, 0.9, 1.1,
  1.3, 1.7, 2.3, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4,
  1.3, 1.7, 2.3, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4,
  2.6, // Preg = 2.4 + 0.2
  2.8, // Lact = 2.4 + 0.4
]);
export const B12_AI = asMap([
  0.3, 0.5, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null,
]);

// Pantothenic acid mg/d — AI only
export const PANTOTHENIC_AI = asMap([
  1.7, 1.9, 2, 2,
  3, 4, 5, 5, 5, 5, 5, 5, 5,
  3, 4, 5, 5, 5, 5, 5, 5, 5,
  6, // Preg = 5 + 1
  7, // Lact = 5 + 2
]);

// Biotin µg/d — AI only
export const BIOTIN_AI = asMap([
  5, 7, 9, 12,
  15, 20, 25, 30, 30, 30, 30, 30, 30,
  15, 20, 25, 30, 30, 30, 30, 30, 30,
  30, 35, // Preg +0, Lact +5
]);

// ═════════════════════════════════════════════════════════════════
// MACROMINERALS (page 262)
// ═════════════════════════════════════════════════════════════════

// Calcium mg/d
export const CALCIUM_EAR = asMap([
  null, null, 400, 500,
  600, 650, 800, 750, 650, 650, 600, 600, 600,
  600, 650, 750, 700, 550, 550, 600, 600, 600,
  550, // Preg +0
  550, // Lact +0
]);
export const CALCIUM_RNI = asMap([
  null, null, 500, 600,
  700, 800, 1000, 900, 800, 800, 750, 700, 700,
  700, 800, 900, 800, 700, 700, 800, 800, 800,
  700, // Preg +0
  700, // Lact +0
]);
export const CALCIUM_AI = asMap([
  250, 300, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null,
]);
export const CALCIUM_UL = asMap([
  1000, 1500, 2500, 2500,
  2500, 3000, 3000, 3000, 2500, 2500, 2000, 2000, 2000,
  2500, 3000, 3000, 3000, 2500, 2500, 2000, 2000, 2000,
  2500, 2500,
]);

// Phosphorus (stored as "Phosphate" source name, maps to Nutri "Phosphorus") mg/d
export const PHOSPHORUS_EAR = asMap([
  null, null, 380, 480,
  500, 1000, 1000, 1000, 580, 580, 580, 580, 580,
  480, 1000, 1000, 1000, 580, 580, 580, 580, 580,
  580, // Preg +0
  580, // Lact +0
]);
export const PHOSPHORUS_RNI = asMap([
  null, null, 450, 550,
  600, 1200, 1200, 1200, 700, 700, 700, 700, 700,
  600, 1200, 1200, 1200, 700, 700, 700, 700, 700,
  700, // Preg +0
  700, // Lact +0
]);
export const PHOSPHORUS_AI = asMap([
  100, 300, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null,
]);
export const PHOSPHORUS_UL = asMap([
  null, null, 3000, 3000,
  3000, 3500, 3500, 3500, 3500, 3500, 3500, 3000, 3000,
  3000, 3500, 3500, 3500, 3500, 3500, 3500, 3000, 3000,
  3000, 3500,
]);

// Sodium mg/d — AI + CDRR (no EAR/RNI)
export const SODIUM_AI = asMap([
  110, 370, 810, 1000,
  1200, 1500, 1500, 1500, 1500, 1500, 1500, 1300, 1100,
  1200, 1500, 1500, 1500, 1500, 1500, 1500, 1300, 1100,
  1500, // Preg +0
  1500, // Lact +0
]);
export const SODIUM_CDRR = asMap([
  null, null, 1200, 1600,
  1900, 2300, 2300, 2300, 2300, 2300, 2300, 2100, 1700,
  1900, 2300, 2300, 2300, 2300, 2300, 2300, 2100, 1700,
  2300, 2300,
]);

// Chloride mg/d — AI only
export const CHLORIDE_AI = asMap([
  170, 560, 1200, 1600,
  1900, 2300, 2300, 2300, 2300, 2300, 2300, 2100, 1700,
  1900, 2300, 2300, 2300, 2300, 2300, 2300, 2100, 1700,
  2300, 2300,
]);

// Potassium mg/d — AI only
export const POTASSIUM_AI = asMap([
  400, 700, 1900, 2400,
  2900, 3400, 3500, 3500, 3500, 3500, 3500, 3500, 3500,
  2900, 3400, 3500, 3500, 3500, 3500, 3500, 3500, 3500,
  3500, // Preg +0
  3900, // Lact = 3500 + 400
]);

// Magnesium mg/d
export const MAGNESIUM_EAR = asMap([
  null, null, 60, 90,
  130, 190, 260, 340, 300, 310, 310, 310, 310,
  130, 180, 240, 290, 230, 240, 240, 240, 240,
  270, // Preg = 240 + 30
  240, // Lact +0
]);
export const MAGNESIUM_RNI = asMap([
  null, null, 70, 110,
  150, 220, 320, 410, 360, 370, 370, 370, 370,
  150, 220, 290, 340, 280, 280, 280, 280, 280,
  320, // Preg = 280 + 40
  280, // Lact +0
]);
export const MAGNESIUM_AI = asMap([
  25, 55, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null,
]);
// UL is for supplemental Mg only
export const MAGNESIUM_UL = asMap([
  null, null, 60, 90,
  130, 190, 270, 350, 350, 350, 350, 350, 350,
  130, 190, 270, 350, 350, 350, 350, 350, 350,
  350, 350,
]);

// ═════════════════════════════════════════════════════════════════
// MICROMINERALS (page 263-264)
// ═════════════════════════════════════════════════════════════════

// Iron mg/d
export const IRON_EAR = asMap([
  null, 4, 4.5, 5,
  7, 8, 11, 11, 8, 8, 8, 7, 7,
  7, 8, 12, 11, 11, 11, 6, 6, 5,
  19, // Preg = 11 + 8
  11, // Lact +0
]);
export const IRON_RNI = asMap([
  null, 6, 6, 7,
  9, 11, 14, 14, 10, 10, 10, 9, 9,
  9, 10, 16, 14, 14, 14, 8, 8, 7,
  24, // Preg = 14 + 10
  14, // Lact +0
]);
export const IRON_AI = asMap([
  0.3, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null,
]);
export const IRON_UL = asMap([
  40, 40, 40, 40,
  40, 40, 40, 45, 45, 45, 45, 45, 45,
  40, 40, 40, 45, 45, 45, 45, 45, 45,
  45, 45,
]);

// Zinc mg/d (page 263: F 19-29 EAR/RNI 7/8; Preg +2.0/+2.5; Lact +4.0/+5.0)
export const ZINC_EAR = asMap([
  null, 2, 2, 3,
  5, 7, 7, 7, 9, 8, 8, 8, 7,
  4, 7, 6, 7, 7, 7, 6, 6, 5,
  9, // Preg = 7 + 2
  11, // Lact = 7 + 4
]);
export const ZINC_RNI = asMap([
  null, 3, 3, 4,
  5, 8, 8, 9, 10, 10, 10, 9, 9,
  5, 8, 8, 9, 8, 8, 7, 7, 6,
  10.5, // Preg = 8 + 2.5
  13, // Lact = 8 + 5
]);
export const ZINC_AI = asMap([
  2, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null,
]);
export const ZINC_UL = asMap([
  null, null, 6, 9,
  13, 19, 27, 33, 35, 35, 35, 35, 35,
  13, 19, 27, 33, 35, 35, 35, 35, 35,
  35, 35,
]);

// Copper µg/d (stored as mg internally)
export const COPPER_EAR = asMap([
  null, null, 220, 270,
  360, 470, 600, 700, 650, 650, 650, 600, 600,
  310, 420, 500, 550, 500, 500, 500, 460, 460,
  600, // Preg = 500 + 100
  870, // Lact = 500 + 370
]);
export const COPPER_RNI = asMap([
  null, null, 290, 350,
  470, 600, 800, 900, 850, 850, 850, 800, 800,
  400, 550, 650, 700, 650, 650, 650, 600, 600,
  780, // Preg = 650 + 130
  1130, // Lact = 650 + 480
]);
export const COPPER_AI = asMap([
  240, 330, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null,
]);
export const COPPER_UL = asMap([
  null, null, 1700, 2600,
  3700, 5500, 7500, 9500, 10000, 10000, 10000, 10000, 10000,
  3700, 5500, 7500, 9500, 10000, 10000, 10000, 10000, 10000,
  10000, 10000,
]);

// Fluoride mg/d — AI + UL
export const FLUORIDE_AI = asMap([
  0.01, 0.4, 0.6, 0.9,
  1.3, 1.9, 2.6, 3.2, 3.4, 3.4, 3.2, 3.1, 3.0,
  1.3, 1.8, 2.4, 2.7, 2.8, 2.7, 2.6, 2.5, 2.3,
  2.8, // Preg +0
  2.8, // Lact +0
]);
export const FLUORIDE_UL = asMap([
  0.6, 0.8, 1.2, 1.8,
  2.6, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0,
  2.5, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0,
  10.0, 10.0,
]);

// Manganese mg/d — AI + UL
export const MANGANESE_AI = asMap([
  0.01, 0.8, 1.5, 2.0,
  2.5, 3.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0,
  2.5, 3.0, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5,
  3.5, // Preg +0
  3.5, // Lact +0
]);
export const MANGANESE_UL = asMap([
  null, null, 2.0, 3.0,
  4.0, 6.0, 8.0, 10.0, 11.0, 11.0, 11.0, 11.0, 11.0,
  4.0, 6.0, 8.0, 10.0, 11.0, 11.0, 11.0, 11.0, 11.0,
  11.0, 11.0,
]);

// Iodine µg/d
export const IODINE_EAR = asMap([
  null, null, 55, 65,
  75, 80, 90, 95, 95, 95, 95, 95, 95,
  75, 80, 90, 95, 95, 95, 95, 95, 95,
  160, // Preg = 95 + 65
  225, // Lact = 95 + 130
]);
export const IODINE_RNI = asMap([
  null, null, 80, 90,
  100, 110, 130, 130, 150, 150, 150, 150, 150,
  100, 110, 130, 130, 150, 150, 150, 150, 150,
  240, // Preg = 150 + 90
  340, // Lact = 150 + 190
]);
export const IODINE_AI = asMap([
  130, 180, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null,
]);
export const IODINE_UL = asMap([
  250, 250, 300, 300,
  500, 500, 1900, 2200, 2400, 2400, 2400, 2400, 2400,
  500, 500, 1900, 2200, 2400, 2400, 2400, 2400, 2400,
  2400, 2400,
]);

// Selenium µg/d
export const SELENIUM_EAR = asMap([
  null, null, 19, 22,
  30, 40, 50, 55, 50, 50, 50, 50, 50,
  30, 40, 50, 55, 50, 50, 50, 50, 50,
  53, // Preg = 50 + 3
  59, // Lact = 50 + 9
]);
export const SELENIUM_RNI = asMap([
  null, null, 23, 25,
  35, 45, 60, 65, 60, 60, 60, 60, 60,
  35, 45, 60, 65, 60, 60, 60, 60, 60,
  64, // Preg = 60 + 4
  70, // Lact = 60 + 10
]);
export const SELENIUM_AI = asMap([
  9, 12, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null,
  null, null,
]);
export const SELENIUM_UL = asMap([
  40, 65, 70, 100,
  150, 200, 300, 300, 400, 400, 400, 400, 400,
  150, 200, 300, 300, 400, 400, 400, 400, 400,
  400, 400,
]);

// Molybdenum µg/d
export const MOLYBDENUM_EAR = asMap([
  null, null, 8, 10,
  15, 15, 25, 25, 25, 25, 25, 23, 23,
  15, 15, 20, 20, 20, 20, 20, 18, 18,
  20, // Preg +0
  23, // Lact = 20 + 3
]);
export const MOLYBDENUM_RNI = asMap([
  null, null, 10, 12,
  18, 18, 30, 30, 30, 30, 30, 28, 28,
  18, 18, 25, 25, 25, 25, 25, 22, 22,
  25, // Preg +0
  28, // Lact = 25 + 3
]);
export const MOLYBDENUM_UL = asMap([
  null, null, 100, 150,
  200, 300, 450, 550, 600, 600, 550, 550, 550,
  200, 300, 400, 500, 500, 500, 450, 450, 450,
  500, 500,
]);

// Chromium µg/d — AI only
export const CHROMIUM_AI = asMap([
  0.2, 4.0, 10, 10,
  15, 20, 30, 35, 30, 30, 30, 25, 25,
  15, 20, 20, 20, 20, 20, 20, 20, 20,
  25, // Preg = 20 + 5
  40, // Lact = 20 + 20
]);

// ═════════════════════════════════════════════════════════════════
// AMDR ranges (% of energy, applies to ages 1+)
// ═════════════════════════════════════════════════════════════════

// KDRI AMDR per page 255:
// - Carbohydrate: 55-65% (all 1+)
// - Protein: 7-20% (all 1+)
// - Fat: 1-2y = 20-35%, 3+ = 15-30%
// - Saturated fatty acid: <8% (3-18), <7% (19+)
// - Trans fatty acid: <1% (3+)
// - Added sugars: ≤10% (CDRR)
// - Cholesterol: <300 mg/d (CDRR, 19+)
