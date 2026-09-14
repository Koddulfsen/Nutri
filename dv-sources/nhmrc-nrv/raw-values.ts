/**
 * NHMRC NRV 2006 (+ 2017 fluoride/sodium updates) — raw values
 * Extracted from Tables 1-9 (pages 276-291) of:
 *   Nutrient Reference Values for Australia and New Zealand (NHMRC 2006)
 *
 * Index convention: parallel arrays match DEMOGRAPHICS order below.
 * `null` = not applicable / not set / NP / ND
 */

export type Sex = 'MALE' | 'FEMALE';

export interface Demographic {
  key: string;
  minMonths: number;
  maxMonths: number | null;
  sex: Sex | 'BOTH';
  lifeStage:
    | 'NONE' | 'PREGNANT' | 'LACTATING';
  label: string;
}

export const DEMOGRAPHICS: Demographic[] = [
  { key: 'INFANT_0_6',   minMonths: 0,    maxMonths: 6,    sex: 'BOTH',   lifeStage: 'NONE',      label: 'Infants 0-6 mo' },
  { key: 'INFANT_7_12',  minMonths: 7,    maxMonths: 12,   sex: 'BOTH',   lifeStage: 'NONE',      label: 'Infants 7-12 mo' },
  { key: 'CHILD_1_3',    minMonths: 12,   maxMonths: 47,   sex: 'BOTH',   lifeStage: 'NONE',      label: 'Children 1-3 y' },
  { key: 'CHILD_4_8',    minMonths: 48,   maxMonths: 107,  sex: 'BOTH',   lifeStage: 'NONE',      label: 'Children 4-8 y' },
  { key: 'M_9_13',       minMonths: 108,  maxMonths: 167,  sex: 'MALE',   lifeStage: 'NONE',      label: 'Boys 9-13 y' },
  { key: 'M_14_18',      minMonths: 168,  maxMonths: 227,  sex: 'MALE',   lifeStage: 'NONE',      label: 'Boys 14-18 y' },
  { key: 'M_19_30',      minMonths: 228,  maxMonths: 371,  sex: 'MALE',   lifeStage: 'NONE',      label: 'Men 19-30 y' },
  { key: 'M_31_50',      minMonths: 372,  maxMonths: 611,  sex: 'MALE',   lifeStage: 'NONE',      label: 'Men 31-50 y' },
  { key: 'M_51_70',      minMonths: 612,  maxMonths: 851,  sex: 'MALE',   lifeStage: 'NONE',      label: 'Men 51-70 y' },
  { key: 'M_70P',        minMonths: 852,  maxMonths: null, sex: 'MALE',   lifeStage: 'NONE',      label: 'Men >70 y' },
  { key: 'F_9_13',       minMonths: 108,  maxMonths: 167,  sex: 'FEMALE', lifeStage: 'NONE',      label: 'Girls 9-13 y' },
  { key: 'F_14_18',      minMonths: 168,  maxMonths: 227,  sex: 'FEMALE', lifeStage: 'NONE',      label: 'Girls 14-18 y' },
  { key: 'F_19_30',      minMonths: 228,  maxMonths: 371,  sex: 'FEMALE', lifeStage: 'NONE',      label: 'Women 19-30 y' },
  { key: 'F_31_50',      minMonths: 372,  maxMonths: 611,  sex: 'FEMALE', lifeStage: 'NONE',      label: 'Women 31-50 y' },
  { key: 'F_51_70',      minMonths: 612,  maxMonths: 851,  sex: 'FEMALE', lifeStage: 'NONE',      label: 'Women 51-70 y' },
  { key: 'F_70P',        minMonths: 852,  maxMonths: null, sex: 'FEMALE', lifeStage: 'NONE',      label: 'Women >70 y' },
  { key: 'PREG_14_18',   minMonths: 168,  maxMonths: 227,  sex: 'FEMALE', lifeStage: 'PREGNANT',  label: 'Pregnancy 14-18 y' },
  { key: 'PREG_19_30',   minMonths: 228,  maxMonths: 371,  sex: 'FEMALE', lifeStage: 'PREGNANT',  label: 'Pregnancy 19-30 y' },
  { key: 'PREG_31_50',   minMonths: 372,  maxMonths: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT',  label: 'Pregnancy 31-50 y' },
  { key: 'LACT_14_18',   minMonths: 168,  maxMonths: 227,  sex: 'FEMALE', lifeStage: 'LACTATING', label: 'Lactation 14-18 y' },
  { key: 'LACT_19_30',   minMonths: 228,  maxMonths: 371,  sex: 'FEMALE', lifeStage: 'LACTATING', label: 'Lactation 19-30 y' },
  { key: 'LACT_31_50',   minMonths: 372,  maxMonths: 611,  sex: 'FEMALE', lifeStage: 'LACTATING', label: 'Lactation 31-50 y' },
];

// Index helpers
export type DemoKey = typeof DEMOGRAPHICS[number]['key'];
const DEMO_BY_KEY = Object.fromEntries(DEMOGRAPHICS.map((d) => [d.key, d]));
export function demo(key: string): Demographic {
  const d = DEMO_BY_KEY[key];
  if (!d) throw new Error(`Unknown demographic key: ${key}`);
  return d;
}

// ═════════════════════════════════════════════════════════════════
// MACROS & WATER (Table 4, pages 280-281)
// ═════════════════════════════════════════════════════════════════

// Protein (g/day)
export const PROTEIN = {
  compoundName: 'Protein',
  unit: 'g',
  // AI for infants, EAR + RDI for 1y+
  ai: {
    INFANT_0_6: 10,
    INFANT_7_12: 14,
  } as Record<string, number | null>,
  // EAR
  ear: {
    CHILD_1_3: 12, CHILD_4_8: 16,
    M_9_13: 31, M_14_18: 49, M_19_30: 52, M_31_50: 52, M_51_70: 52, M_70P: 65,
    F_9_13: 24, F_14_18: 35, F_19_30: 37, F_31_50: 37, F_51_70: 37, F_70P: 46,
    PREG_14_18: 47, PREG_19_30: 49, PREG_31_50: 49,
    LACT_14_18: 51, LACT_19_30: 54, LACT_31_50: 54,
  } as Record<string, number | null>,
  // RDI
  rdi: {
    CHILD_1_3: 14, CHILD_4_8: 20,
    M_9_13: 40, M_14_18: 65, M_19_30: 64, M_31_50: 64, M_51_70: 64, M_70P: 81,
    F_9_13: 35, F_14_18: 45, F_19_30: 46, F_31_50: 46, F_51_70: 46, F_70P: 57,
    PREG_14_18: 58, PREG_19_30: 60, PREG_31_50: 60,
    LACT_14_18: 63, LACT_19_30: 67, LACT_31_50: 67,
  } as Record<string, number | null>,
};

// Linoleic acid (n-6) AI — g/day. No EAR/RDI published.
export const LINOLEIC = {
  unit: 'g', compoundName: 'LA',
  ai: {
    INFANT_0_6: 4.4, INFANT_7_12: 4.6,
    CHILD_1_3: 5, CHILD_4_8: 8,
    M_9_13: 10, M_14_18: 12, M_19_30: 13, M_31_50: 13, M_51_70: 13, M_70P: 13,
    F_9_13: 8, F_14_18: 8, F_19_30: 8, F_31_50: 8, F_51_70: 8, F_70P: 8,
    PREG_14_18: 10, PREG_19_30: 10, PREG_31_50: 10,
    LACT_14_18: 12, LACT_19_30: 12, LACT_31_50: 12,
  } as Record<string, number | null>,
};

// α-Linolenic acid (n-3) AI — g/day
export const ALINOLENIC = {
  unit: 'g', compoundName: 'ALA',
  ai: {
    INFANT_0_6: 0.5, INFANT_7_12: 0.5,
    CHILD_1_3: 0.5, CHILD_4_8: 0.8,
    M_9_13: 1.0, M_14_18: 1.2, M_19_30: 1.3, M_31_50: 1.3, M_51_70: 1.3, M_70P: 1.3,
    F_9_13: 0.8, F_14_18: 0.8, F_19_30: 0.8, F_31_50: 0.8, F_51_70: 0.8, F_70P: 0.8,
    PREG_14_18: 1.0, PREG_19_30: 1.0, PREG_31_50: 1.0,
    LACT_14_18: 1.2, LACT_19_30: 1.2, LACT_31_50: 1.2,
  } as Record<string, number | null>,
};

// LC n-3 (DHA + EPA + DPA) AI — mg/day. Store as Omega-3.
export const LC_OMEGA3 = {
  unit: 'mg', compoundName: 'Omega-3',
  ai: {
    INFANT_0_6: null, INFANT_7_12: null, // No AI pre-1y for LC n-3
    CHILD_1_3: 40, CHILD_4_8: 55,
    M_9_13: 70, M_14_18: 125, M_19_30: 160, M_31_50: 160, M_51_70: 160, M_70P: 160,
    F_9_13: 70, F_14_18: 85, F_19_30: 90, F_31_50: 90, F_51_70: 90, F_70P: 90,
    PREG_14_18: 110, PREG_19_30: 115, PREG_31_50: 115,
    LACT_14_18: 140, LACT_19_30: 145, LACT_31_50: 145,
  } as Record<string, number | null>,
  // UL for LC n-3 is 3,000 mg/day for ages 1+
  ul: {
    CHILD_1_3: 3000, CHILD_4_8: 3000,
    M_9_13: 3000, M_14_18: 3000, M_19_30: 3000, M_31_50: 3000, M_51_70: 3000, M_70P: 3000,
    F_9_13: 3000, F_14_18: 3000, F_19_30: 3000, F_31_50: 3000, F_51_70: 3000, F_70P: 3000,
    PREG_14_18: 3000, PREG_19_30: 3000, PREG_31_50: 3000,
    LACT_14_18: 3000, LACT_19_30: 3000, LACT_31_50: 3000,
  } as Record<string, number | null>,
};

// Dietary fibre AI (g/day) — 1y+
export const FIBRE = {
  unit: 'g', compoundName: 'Dietary Fiber',
  ai: {
    CHILD_1_3: 14, CHILD_4_8: 18,
    M_9_13: 24, M_14_18: 28, M_19_30: 30, M_31_50: 30, M_51_70: 30, M_70P: 30,
    F_9_13: 20, F_14_18: 22, F_19_30: 25, F_31_50: 25, F_51_70: 25, F_70P: 25,
    PREG_14_18: 25, PREG_19_30: 28, PREG_31_50: 28,
    LACT_14_18: 27, LACT_19_30: 30, LACT_31_50: 30,
  } as Record<string, number | null>,
};

// Total water AI (L/day) — stored as Water in grams (1 L ~ 1000 g for water)
export const WATER = {
  unit: 'mL', compoundName: 'Water',  // use mL for precision
  ai: {
    INFANT_0_6: 700, INFANT_7_12: 800,
    CHILD_1_3: 1400, CHILD_4_8: 1600,
    M_9_13: 2200, M_14_18: 2700, M_19_30: 3400, M_31_50: 3400, M_51_70: 3400, M_70P: 3400,
    F_9_13: 1900, F_14_18: 2200, F_19_30: 2800, F_31_50: 2800, F_51_70: 2800, F_70P: 2800,
    PREG_14_18: 2400, PREG_19_30: 3100, PREG_31_50: 3100,
    LACT_14_18: 2900, LACT_19_30: 3500, LACT_31_50: 3500,
  } as Record<string, number | null>,
};

// ═════════════════════════════════════════════════════════════════
// B VITAMINS (Table 5)
// ═════════════════════════════════════════════════════════════════

export const THIAMIN = {
  unit: 'mg', compoundName: 'Thiamin',
  ai: { INFANT_0_6: 0.2, INFANT_7_12: 0.3 } as Record<string, number | null>,
  ear: {
    CHILD_1_3: 0.4, CHILD_4_8: 0.5,
    M_9_13: 0.7, M_14_18: 1.0, M_19_30: 1.0, M_31_50: 1.0, M_51_70: 1.0, M_70P: 1.0,
    F_9_13: 0.7, F_14_18: 0.9, F_19_30: 0.9, F_31_50: 0.9, F_51_70: 0.9, F_70P: 0.9,
    PREG_14_18: 1.2, PREG_19_30: 1.2, PREG_31_50: 1.2,
    LACT_14_18: 1.2, LACT_19_30: 1.2, LACT_31_50: 1.2,
  } as Record<string, number | null>,
  rdi: {
    CHILD_1_3: 0.5, CHILD_4_8: 0.6,
    M_9_13: 0.9, M_14_18: 1.2, M_19_30: 1.2, M_31_50: 1.2, M_51_70: 1.2, M_70P: 1.2,
    F_9_13: 0.9, F_14_18: 1.1, F_19_30: 1.1, F_31_50: 1.1, F_51_70: 1.1, F_70P: 1.1,
    PREG_14_18: 1.4, PREG_19_30: 1.4, PREG_31_50: 1.4,
    LACT_14_18: 1.4, LACT_19_30: 1.4, LACT_31_50: 1.4,
  } as Record<string, number | null>,
};

export const RIBOFLAVIN = {
  unit: 'mg', compoundName: 'Riboflavin',
  ai: { INFANT_0_6: 0.3, INFANT_7_12: 0.4 } as Record<string, number | null>,
  ear: {
    CHILD_1_3: 0.4, CHILD_4_8: 0.5,
    M_9_13: 0.8, M_14_18: 1.1, M_19_30: 1.1, M_31_50: 1.1, M_51_70: 1.1, M_70P: 1.3,
    F_9_13: 0.8, F_14_18: 0.9, F_19_30: 0.9, F_31_50: 0.9, F_51_70: 0.9, F_70P: 1.1,
    PREG_14_18: 1.2, PREG_19_30: 1.2, PREG_31_50: 1.2,
    LACT_14_18: 1.3, LACT_19_30: 1.3, LACT_31_50: 1.3,
  } as Record<string, number | null>,
  rdi: {
    CHILD_1_3: 0.5, CHILD_4_8: 0.6,
    M_9_13: 0.9, M_14_18: 1.3, M_19_30: 1.3, M_31_50: 1.3, M_51_70: 1.3, M_70P: 1.6,
    F_9_13: 0.9, F_14_18: 1.1, F_19_30: 1.1, F_31_50: 1.1, F_51_70: 1.1, F_70P: 1.3,
    PREG_14_18: 1.4, PREG_19_30: 1.4, PREG_31_50: 1.4,
    LACT_14_18: 1.6, LACT_19_30: 1.6, LACT_31_50: 1.6,
  } as Record<string, number | null>,
};

export const NIACIN = {
  unit: 'mg', compoundName: 'Niacin',
  ai: { INFANT_0_6: 2, INFANT_7_12: 4 } as Record<string, number | null>,
  ear: {
    CHILD_1_3: 5, CHILD_4_8: 6,
    M_9_13: 9, M_14_18: 12, M_19_30: 12, M_31_50: 12, M_51_70: 12, M_70P: 12,
    F_9_13: 9, F_14_18: 11, F_19_30: 11, F_31_50: 11, F_51_70: 11, F_70P: 11,
    PREG_14_18: 14, PREG_19_30: 14, PREG_31_50: 14,
    LACT_14_18: 13, LACT_19_30: 13, LACT_31_50: 13,
  } as Record<string, number | null>,
  rdi: {
    CHILD_1_3: 6, CHILD_4_8: 8,
    M_9_13: 12, M_14_18: 16, M_19_30: 16, M_31_50: 16, M_51_70: 16, M_70P: 16,
    F_9_13: 12, F_14_18: 14, F_19_30: 14, F_31_50: 14, F_51_70: 14, F_70P: 14,
    PREG_14_18: 18, PREG_19_30: 18, PREG_31_50: 18,
    LACT_14_18: 17, LACT_19_30: 17, LACT_31_50: 17,
  } as Record<string, number | null>,
  // UL is for niacin (nicotinic acid form)
  ul: {
    CHILD_1_3: 10, CHILD_4_8: 15,
    M_9_13: 20, M_14_18: 30, M_19_30: 35, M_31_50: 35, M_51_70: 35, M_70P: 35,
    F_9_13: 20, F_14_18: 30, F_19_30: 35, F_31_50: 35, F_51_70: 35, F_70P: 35,
    PREG_14_18: 30, PREG_19_30: 35, PREG_31_50: 35,
    LACT_14_18: 30, LACT_19_30: 35, LACT_31_50: 35,
  } as Record<string, number | null>,
};

export const B6 = {
  unit: 'mg', compoundName: 'Vitamin B6',
  ai: { INFANT_0_6: 0.1, INFANT_7_12: 0.3 } as Record<string, number | null>,
  ear: {
    CHILD_1_3: 0.4, CHILD_4_8: 0.5,
    M_9_13: 0.8, M_14_18: 1.1, M_19_30: 1.1, M_31_50: 1.1, M_51_70: 1.4, M_70P: 1.4,
    F_9_13: 0.8, F_14_18: 1.0, F_19_30: 1.1, F_31_50: 1.1, F_51_70: 1.3, F_70P: 1.3,
    PREG_14_18: 1.6, PREG_19_30: 1.6, PREG_31_50: 1.6,
    LACT_14_18: 1.7, LACT_19_30: 1.7, LACT_31_50: 1.7,
  } as Record<string, number | null>,
  rdi: {
    CHILD_1_3: 0.5, CHILD_4_8: 0.6,
    M_9_13: 1.0, M_14_18: 1.3, M_19_30: 1.3, M_31_50: 1.3, M_51_70: 1.7, M_70P: 1.7,
    F_9_13: 1.0, F_14_18: 1.2, F_19_30: 1.3, F_31_50: 1.3, F_51_70: 1.5, F_70P: 1.5,
    PREG_14_18: 1.9, PREG_19_30: 1.9, PREG_31_50: 1.9,
    LACT_14_18: 2.0, LACT_19_30: 2.0, LACT_31_50: 2.0,
  } as Record<string, number | null>,
  ul: {
    CHILD_1_3: 15, CHILD_4_8: 20,
    M_9_13: 30, M_14_18: 40, M_19_30: 50, M_31_50: 50, M_51_70: 50, M_70P: 50,
    F_9_13: 30, F_14_18: 40, F_19_30: 50, F_31_50: 50, F_51_70: 50, F_70P: 50,
    PREG_14_18: 40, PREG_19_30: 50, PREG_31_50: 50,
    LACT_14_18: 40, LACT_19_30: 50, LACT_31_50: 50,
  } as Record<string, number | null>,
};

export const B12 = {
  unit: 'µg', compoundName: 'Vitamin B12',
  ai: { INFANT_0_6: 0.4, INFANT_7_12: 0.5 } as Record<string, number | null>,
  ear: {
    CHILD_1_3: 0.7, CHILD_4_8: 1.0,
    M_9_13: 1.5, M_14_18: 2.0, M_19_30: 2.0, M_31_50: 2.0, M_51_70: 2.0, M_70P: 2.0,
    F_9_13: 1.5, F_14_18: 2.0, F_19_30: 2.0, F_31_50: 2.0, F_51_70: 2.0, F_70P: 2.0,
    PREG_14_18: 2.2, PREG_19_30: 2.2, PREG_31_50: 2.2,
    LACT_14_18: 2.4, LACT_19_30: 2.4, LACT_31_50: 2.4,
  } as Record<string, number | null>,
  rdi: {
    CHILD_1_3: 0.9, CHILD_4_8: 1.2,
    M_9_13: 1.8, M_14_18: 2.4, M_19_30: 2.4, M_31_50: 2.4, M_51_70: 2.4, M_70P: 2.4,
    F_9_13: 1.8, F_14_18: 2.4, F_19_30: 2.4, F_31_50: 2.4, F_51_70: 2.4, F_70P: 2.4,
    PREG_14_18: 2.6, PREG_19_30: 2.6, PREG_31_50: 2.6,
    LACT_14_18: 2.8, LACT_19_30: 2.8, LACT_31_50: 2.8,
  } as Record<string, number | null>,
};

export const FOLATE = {
  unit: 'µg', compoundName: 'Folate',
  ai: { INFANT_0_6: 65, INFANT_7_12: 80 } as Record<string, number | null>,
  ear: {
    CHILD_1_3: 120, CHILD_4_8: 160,
    M_9_13: 250, M_14_18: 330, M_19_30: 320, M_31_50: 320, M_51_70: 320, M_70P: 320,
    F_9_13: 250, F_14_18: 330, F_19_30: 320, F_31_50: 320, F_51_70: 320, F_70P: 320,
    PREG_14_18: 520, PREG_19_30: 520, PREG_31_50: 520,
    LACT_14_18: 450, LACT_19_30: 450, LACT_31_50: 450,
  } as Record<string, number | null>,
  rdi: {
    CHILD_1_3: 150, CHILD_4_8: 200,
    M_9_13: 300, M_14_18: 400, M_19_30: 400, M_31_50: 400, M_51_70: 400, M_70P: 400,
    F_9_13: 300, F_14_18: 400, F_19_30: 400, F_31_50: 400, F_51_70: 400, F_70P: 400,
    PREG_14_18: 600, PREG_19_30: 600, PREG_31_50: 600,
    LACT_14_18: 500, LACT_19_30: 500, LACT_31_50: 500,
  } as Record<string, number | null>,
  // UL applies to folic acid from fortified foods and supplements only
  ul: {
    CHILD_1_3: 300, CHILD_4_8: 400,
    M_9_13: 600, M_14_18: 800, M_19_30: 1000, M_31_50: 1000, M_51_70: 1000, M_70P: 1000,
    F_9_13: 600, F_14_18: 800, F_19_30: 1000, F_31_50: 1000, F_51_70: 1000, F_70P: 1000,
    PREG_14_18: 800, PREG_19_30: 1000, PREG_31_50: 1000,
    LACT_14_18: 800, LACT_19_30: 1000, LACT_31_50: 1000,
  } as Record<string, number | null>,
};

export const PANTOTHENIC = {
  unit: 'mg', compoundName: 'Pantothenic acid',
  ai: {
    INFANT_0_6: 1.7, INFANT_7_12: 2.2,
    CHILD_1_3: 3.5, CHILD_4_8: 4.0,
    M_9_13: 5.0, M_14_18: 6.0, M_19_30: 6.0, M_31_50: 6.0, M_51_70: 6.0, M_70P: 6.0,
    F_9_13: 4.0, F_14_18: 4.0, F_19_30: 4.0, F_31_50: 4.0, F_51_70: 4.0, F_70P: 4.0,
    PREG_14_18: 5.0, PREG_19_30: 5.0, PREG_31_50: 5.0,
    LACT_14_18: 6.0, LACT_19_30: 6.0, LACT_31_50: 6.0,
  } as Record<string, number | null>,
};

export const BIOTIN = {
  unit: 'µg', compoundName: 'Biotin',
  ai: {
    INFANT_0_6: 5, INFANT_7_12: 6,
    CHILD_1_3: 8, CHILD_4_8: 12,
    M_9_13: 20, M_14_18: 25, M_19_30: 30, M_31_50: 30, M_51_70: 30, M_70P: 30,
    F_9_13: 20, F_14_18: 25, F_19_30: 25, F_31_50: 25, F_51_70: 25, F_70P: 25,
    PREG_14_18: 30, PREG_19_30: 30, PREG_31_50: 30,
    LACT_14_18: 35, LACT_19_30: 35, LACT_31_50: 35,
  } as Record<string, number | null>,
};

// ═════════════════════════════════════════════════════════════════
// VITAMINS A, C, D, E, K, CHOLINE (Table 6)
// ═════════════════════════════════════════════════════════════════

export const VITAMIN_A = {
  unit: 'µg', compoundName: 'Vitamin A',
  ai: { INFANT_0_6: 250, INFANT_7_12: 430 } as Record<string, number | null>,
  ear: {
    CHILD_1_3: 210, CHILD_4_8: 275,
    M_9_13: 445, M_14_18: 630, M_19_30: 625, M_31_50: 625, M_51_70: 625, M_70P: 625,
    F_9_13: 420, F_14_18: 485, F_19_30: 500, F_31_50: 500, F_51_70: 500, F_70P: 500,
    PREG_14_18: 530, PREG_19_30: 550, PREG_31_50: 550,
    LACT_14_18: 780, LACT_19_30: 800, LACT_31_50: 800,
  } as Record<string, number | null>,
  rdi: {
    CHILD_1_3: 300, CHILD_4_8: 400,
    M_9_13: 600, M_14_18: 900, M_19_30: 900, M_31_50: 900, M_51_70: 900, M_70P: 900,
    F_9_13: 600, F_14_18: 700, F_19_30: 700, F_31_50: 700, F_51_70: 700, F_70P: 700,
    PREG_14_18: 700, PREG_19_30: 800, PREG_31_50: 800,
    LACT_14_18: 1100, LACT_19_30: 1100, LACT_31_50: 1100,
  } as Record<string, number | null>,
  ul: {
    INFANT_0_6: 600, INFANT_7_12: 600,
    CHILD_1_3: 600, CHILD_4_8: 900,
    M_9_13: 1700, M_14_18: 2800, M_19_30: 3000, M_31_50: 3000, M_51_70: 3000, M_70P: 3000,
    F_9_13: 1700, F_14_18: 2800, F_19_30: 3000, F_31_50: 3000, F_51_70: 3000, F_70P: 3000,
    PREG_14_18: 2800, PREG_19_30: 3000, PREG_31_50: 3000,
    LACT_14_18: 2800, LACT_19_30: 3000, LACT_31_50: 3000,
  } as Record<string, number | null>,
};

export const VITAMIN_C = {
  unit: 'mg', compoundName: 'Vitamin C',
  ai: { INFANT_0_6: 25, INFANT_7_12: 30 } as Record<string, number | null>,
  ear: {
    CHILD_1_3: 25, CHILD_4_8: 25,
    M_9_13: 28, M_14_18: 28, M_19_30: 30, M_31_50: 30, M_51_70: 30, M_70P: 30,
    F_9_13: 28, F_14_18: 28, F_19_30: 30, F_31_50: 30, F_51_70: 30, F_70P: 30,
    PREG_14_18: 38, PREG_19_30: 40, PREG_31_50: 40,
    LACT_14_18: 58, LACT_19_30: 60, LACT_31_50: 60,
  } as Record<string, number | null>,
  rdi: {
    CHILD_1_3: 35, CHILD_4_8: 35,
    M_9_13: 40, M_14_18: 40, M_19_30: 45, M_31_50: 45, M_51_70: 45, M_70P: 45,
    F_9_13: 40, F_14_18: 40, F_19_30: 45, F_31_50: 45, F_51_70: 45, F_70P: 45,
    PREG_14_18: 55, PREG_19_30: 60, PREG_31_50: 60,
    LACT_14_18: 80, LACT_19_30: 85, LACT_31_50: 85,
  } as Record<string, number | null>,
};

export const VITAMIN_D = {
  unit: 'µg', compoundName: 'Vitamin D',
  // All are AI — no EAR/RDI in 2006 NRV
  ai: {
    INFANT_0_6: 5, INFANT_7_12: 5,
    CHILD_1_3: 5, CHILD_4_8: 5,
    M_9_13: 5, M_14_18: 5, M_19_30: 5, M_31_50: 5, M_51_70: 10, M_70P: 15,
    F_9_13: 5, F_14_18: 5, F_19_30: 5, F_31_50: 5, F_51_70: 10, F_70P: 15,
    PREG_14_18: 5, PREG_19_30: 5, PREG_31_50: 5,
    LACT_14_18: 5, LACT_19_30: 5, LACT_31_50: 5,
  } as Record<string, number | null>,
  ul: {
    INFANT_0_6: 25, INFANT_7_12: 25,
    CHILD_1_3: 80, CHILD_4_8: 80,
    M_9_13: 80, M_14_18: 80, M_19_30: 80, M_31_50: 80, M_51_70: 80, M_70P: 80,
    F_9_13: 80, F_14_18: 80, F_19_30: 80, F_31_50: 80, F_51_70: 80, F_70P: 80,
    PREG_14_18: 80, PREG_19_30: 80, PREG_31_50: 80,
    LACT_14_18: 80, LACT_19_30: 80, LACT_31_50: 80,
  } as Record<string, number | null>,
};

export const VITAMIN_E = {
  unit: 'mg', compoundName: 'Vitamin E',
  ai: {
    INFANT_0_6: 4, INFANT_7_12: 5,
    CHILD_1_3: 5, CHILD_4_8: 6,
    M_9_13: 9, M_14_18: 10, M_19_30: 10, M_31_50: 10, M_51_70: 10, M_70P: 10,
    F_9_13: 8, F_14_18: 8, F_19_30: 7, F_31_50: 7, F_51_70: 7, F_70P: 7,
    PREG_14_18: 8, PREG_19_30: 7, PREG_31_50: 7,
    LACT_14_18: 12, LACT_19_30: 11, LACT_31_50: 11,
  } as Record<string, number | null>,
  ul: {
    CHILD_1_3: 70, CHILD_4_8: 100,
    M_9_13: 180, M_14_18: 250, M_19_30: 300, M_31_50: 300, M_51_70: 300, M_70P: 300,
    F_9_13: 180, F_14_18: 250, F_19_30: 300, F_31_50: 300, F_51_70: 300, F_70P: 300,
    PREG_14_18: 250, PREG_19_30: 300, PREG_31_50: 300,
    LACT_14_18: 250, LACT_19_30: 300, LACT_31_50: 300,
  } as Record<string, number | null>,
};

export const VITAMIN_K = {
  unit: 'µg', compoundName: 'Vitamin K',
  ai: {
    INFANT_0_6: 2.0, INFANT_7_12: 2.5,
    CHILD_1_3: 25, CHILD_4_8: 35,
    M_9_13: 45, M_14_18: 55, M_19_30: 70, M_31_50: 70, M_51_70: 70, M_70P: 70,
    F_9_13: 45, F_14_18: 55, F_19_30: 60, F_31_50: 60, F_51_70: 60, F_70P: 60,
    PREG_14_18: 60, PREG_19_30: 60, PREG_31_50: 60,
    LACT_14_18: 60, LACT_19_30: 60, LACT_31_50: 60,
  } as Record<string, number | null>,
};

export const CHOLINE = {
  unit: 'mg', compoundName: 'Choline',
  ai: {
    INFANT_0_6: 125, INFANT_7_12: 150,
    CHILD_1_3: 200, CHILD_4_8: 250,
    M_9_13: 375, M_14_18: 550, M_19_30: 550, M_31_50: 550, M_51_70: 550, M_70P: 550,
    F_9_13: 375, F_14_18: 400, F_19_30: 425, F_31_50: 425, F_51_70: 425, F_70P: 425,
    PREG_14_18: 415, PREG_19_30: 440, PREG_31_50: 440,
    LACT_14_18: 525, LACT_19_30: 550, LACT_31_50: 550,
  } as Record<string, number | null>,
  ul: {
    INFANT_0_6: 1000, INFANT_7_12: 1000,
    CHILD_1_3: 1000, CHILD_4_8: 1000,
    M_9_13: 3000, M_14_18: 3000, M_19_30: 3500, M_31_50: 3500, M_51_70: 3500, M_70P: 3500,
    F_9_13: 3000, F_14_18: 3000, F_19_30: 3500, F_31_50: 3500, F_51_70: 3500, F_70P: 3500,
    PREG_14_18: 3000, PREG_19_30: 3500, PREG_31_50: 3500,
    LACT_14_18: 3000, LACT_19_30: 3500, LACT_31_50: 3500,
  } as Record<string, number | null>,
};

// ═════════════════════════════════════════════════════════════════
// MINERALS — Ca, P, Zn, Fe (Table 7)
// ═════════════════════════════════════════════════════════════════

export const CALCIUM = {
  unit: 'mg', compoundName: 'Calcium',
  ai: { INFANT_0_6: 210, INFANT_7_12: 270 } as Record<string, number | null>,
  // 9-13 y split: 9-11 y uses lower bound, 12-13 y uses upper bound of range
  // Stored as a single 9-13 row with the upper (growth) value per published convention
  ear: {
    CHILD_1_3: 360, CHILD_4_8: 520,
    M_9_13: 1050, M_14_18: 1050, M_19_30: 840, M_31_50: 840, M_51_70: 840, M_70P: 1100,
    F_9_13: 1050, F_14_18: 1050, F_19_30: 840, F_31_50: 840, F_51_70: 1100, F_70P: 1100,
    PREG_14_18: 1050, PREG_19_30: 840, PREG_31_50: 840,
    LACT_14_18: 1050, LACT_19_30: 840, LACT_31_50: 840,
  } as Record<string, number | null>,
  rdi: {
    CHILD_1_3: 500, CHILD_4_8: 700,
    M_9_13: 1300, M_14_18: 1300, M_19_30: 1000, M_31_50: 1000, M_51_70: 1000, M_70P: 1300,
    F_9_13: 1300, F_14_18: 1300, F_19_30: 1000, F_31_50: 1000, F_51_70: 1300, F_70P: 1300,
    PREG_14_18: 1300, PREG_19_30: 1000, PREG_31_50: 1000,
    LACT_14_18: 1300, LACT_19_30: 1000, LACT_31_50: 1000,
  } as Record<string, number | null>,
  ul: {
    CHILD_1_3: 2500, CHILD_4_8: 2500,
    M_9_13: 2500, M_14_18: 2500, M_19_30: 2500, M_31_50: 2500, M_51_70: 2500, M_70P: 2500,
    F_9_13: 2500, F_14_18: 2500, F_19_30: 2500, F_31_50: 2500, F_51_70: 2500, F_70P: 2500,
    PREG_14_18: 2500, PREG_19_30: 2500, PREG_31_50: 2500,
    LACT_14_18: 2500, LACT_19_30: 2500, LACT_31_50: 2500,
  } as Record<string, number | null>,
};

export const PHOSPHORUS = {
  unit: 'mg', compoundName: 'Phosphorus',
  ai: { INFANT_0_6: 100, INFANT_7_12: 275 } as Record<string, number | null>,
  ear: {
    CHILD_1_3: 380, CHILD_4_8: 405,
    M_9_13: 1055, M_14_18: 1055, M_19_30: 580, M_31_50: 580, M_51_70: 580, M_70P: 580,
    F_9_13: 1055, F_14_18: 1055, F_19_30: 580, F_31_50: 580, F_51_70: 580, F_70P: 580,
    PREG_14_18: 1055, PREG_19_30: 580, PREG_31_50: 580,
    LACT_14_18: 1055, LACT_19_30: 580, LACT_31_50: 580,
  } as Record<string, number | null>,
  rdi: {
    CHILD_1_3: 460, CHILD_4_8: 500,
    M_9_13: 1250, M_14_18: 1250, M_19_30: 1000, M_31_50: 1000, M_51_70: 1000, M_70P: 1000,
    F_9_13: 1250, F_14_18: 1250, F_19_30: 1000, F_31_50: 1000, F_51_70: 1000, F_70P: 1000,
    PREG_14_18: 1250, PREG_19_30: 1000, PREG_31_50: 1000,
    LACT_14_18: 1250, LACT_19_30: 1000, LACT_31_50: 1000,
  } as Record<string, number | null>,
  ul: {
    CHILD_1_3: 3000, CHILD_4_8: 3000,
    M_9_13: 4000, M_14_18: 4000, M_19_30: 4000, M_31_50: 4000, M_51_70: 4000, M_70P: 3000,
    F_9_13: 4000, F_14_18: 4000, F_19_30: 4000, F_31_50: 4000, F_51_70: 4000, F_70P: 3000,
    PREG_14_18: 3500, PREG_19_30: 3500, PREG_31_50: 3500,
    LACT_14_18: 4000, LACT_19_30: 4000, LACT_31_50: 4000,
  } as Record<string, number | null>,
};

export const ZINC = {
  unit: 'mg', compoundName: 'Zinc',
  ai: { INFANT_0_6: 2.0, INFANT_7_12: 2.5 } as Record<string, number | null>,
  ear: {
    CHILD_1_3: 2.5, CHILD_4_8: 3.0,
    M_9_13: 5.0, M_14_18: 11.0, M_19_30: 12.0, M_31_50: 12.0, M_51_70: 12.0, M_70P: 12.0,
    F_9_13: 5.0, F_14_18: 6.0, F_19_30: 6.5, F_31_50: 6.5, F_51_70: 6.5, F_70P: 6.5,
    PREG_14_18: 8.5, PREG_19_30: 9.0, PREG_31_50: 9.0,
    LACT_14_18: 10.0, LACT_19_30: 10.0, LACT_31_50: 10.0,
  } as Record<string, number | null>,
  rdi: {
    CHILD_1_3: 3, CHILD_4_8: 4,
    M_9_13: 6, M_14_18: 13, M_19_30: 14, M_31_50: 14, M_51_70: 14, M_70P: 14,
    F_9_13: 6, F_14_18: 7, F_19_30: 8, F_31_50: 8, F_51_70: 8, F_70P: 8,
    PREG_14_18: 10, PREG_19_30: 11, PREG_31_50: 11,
    LACT_14_18: 11, LACT_19_30: 12, LACT_31_50: 12,
  } as Record<string, number | null>,
  ul: {
    INFANT_0_6: 4, INFANT_7_12: 5,
    CHILD_1_3: 7, CHILD_4_8: 12,
    M_9_13: 25, M_14_18: 35, M_19_30: 40, M_31_50: 40, M_51_70: 40, M_70P: 40,
    F_9_13: 25, F_14_18: 35, F_19_30: 40, F_31_50: 40, F_51_70: 40, F_70P: 40,
    PREG_14_18: 35, PREG_19_30: 40, PREG_31_50: 40,
    LACT_14_18: 35, LACT_19_30: 40, LACT_31_50: 40,
  } as Record<string, number | null>,
};

export const IRON = {
  unit: 'mg', compoundName: 'Iron',
  ai: { INFANT_0_6: 0.2 } as Record<string, number | null>,
  ear: {
    INFANT_7_12: 7,
    CHILD_1_3: 4, CHILD_4_8: 4,
    M_9_13: 6, M_14_18: 8, M_19_30: 6, M_31_50: 6, M_51_70: 6, M_70P: 6,
    F_9_13: 6, F_14_18: 8, F_19_30: 8, F_31_50: 8, F_51_70: 5, F_70P: 5,
    PREG_14_18: 23, PREG_19_30: 22, PREG_31_50: 22,
    LACT_14_18: 7, LACT_19_30: 6.5, LACT_31_50: 6.5,
  } as Record<string, number | null>,
  rdi: {
    INFANT_7_12: 11,
    CHILD_1_3: 9, CHILD_4_8: 10,
    M_9_13: 8, M_14_18: 11, M_19_30: 8, M_31_50: 8, M_51_70: 8, M_70P: 8,
    F_9_13: 8, F_14_18: 15, F_19_30: 18, F_31_50: 18, F_51_70: 8, F_70P: 8,
    PREG_14_18: 27, PREG_19_30: 27, PREG_31_50: 27,
    LACT_14_18: 10, LACT_19_30: 9, LACT_31_50: 9,
  } as Record<string, number | null>,
  ul: {
    INFANT_0_6: 20, INFANT_7_12: 20,
    CHILD_1_3: 20, CHILD_4_8: 40,
    M_9_13: 40, M_14_18: 45, M_19_30: 45, M_31_50: 45, M_51_70: 45, M_70P: 45,
    F_9_13: 40, F_14_18: 45, F_19_30: 45, F_31_50: 45, F_51_70: 45, F_70P: 45,
    PREG_14_18: 45, PREG_19_30: 45, PREG_31_50: 45,
    LACT_14_18: 45, LACT_19_30: 45, LACT_31_50: 45,
  } as Record<string, number | null>,
};

// ═════════════════════════════════════════════════════════════════
// MINERALS — Mg, I, Se, Mo (Table 8)
// ═════════════════════════════════════════════════════════════════

export const MAGNESIUM = {
  unit: 'mg', compoundName: 'Magnesium',
  ai: { INFANT_0_6: 30, INFANT_7_12: 75 } as Record<string, number | null>,
  ear: {
    CHILD_1_3: 65, CHILD_4_8: 110,
    M_9_13: 200, M_14_18: 340, M_19_30: 330, M_31_50: 350, M_51_70: 350, M_70P: 350,
    F_9_13: 200, F_14_18: 300, F_19_30: 255, F_31_50: 265, F_51_70: 265, F_70P: 265,
    PREG_14_18: 335, PREG_19_30: 290, PREG_31_50: 300,
    LACT_14_18: 300, LACT_19_30: 255, LACT_31_50: 265,
  } as Record<string, number | null>,
  rdi: {
    CHILD_1_3: 80, CHILD_4_8: 130,
    M_9_13: 240, M_14_18: 410, M_19_30: 400, M_31_50: 420, M_51_70: 420, M_70P: 420,
    F_9_13: 240, F_14_18: 360, F_19_30: 310, F_31_50: 320, F_51_70: 320, F_70P: 320,
    PREG_14_18: 400, PREG_19_30: 350, PREG_31_50: 360,
    LACT_14_18: 360, LACT_19_30: 310, LACT_31_50: 320,
  } as Record<string, number | null>,
  // UL is for supplemental Mg only
  ul: {
    CHILD_1_3: 65, CHILD_4_8: 110,
    M_9_13: 350, M_14_18: 350, M_19_30: 350, M_31_50: 350, M_51_70: 350, M_70P: 350,
    F_9_13: 350, F_14_18: 350, F_19_30: 350, F_31_50: 350, F_51_70: 350, F_70P: 350,
    PREG_14_18: 350, PREG_19_30: 350, PREG_31_50: 350,
    LACT_14_18: 350, LACT_19_30: 350, LACT_31_50: 350,
  } as Record<string, number | null>,
};

export const IODINE = {
  unit: 'µg', compoundName: 'Iodine',
  ai: { INFANT_0_6: 90, INFANT_7_12: 110 } as Record<string, number | null>,
  ear: {
    CHILD_1_3: 65, CHILD_4_8: 65,
    M_9_13: 75, M_14_18: 95, M_19_30: 100, M_31_50: 100, M_51_70: 100, M_70P: 100,
    F_9_13: 75, F_14_18: 95, F_19_30: 100, F_31_50: 100, F_51_70: 100, F_70P: 100,
    PREG_14_18: 160, PREG_19_30: 160, PREG_31_50: 160,
    LACT_14_18: 190, LACT_19_30: 190, LACT_31_50: 190,
  } as Record<string, number | null>,
  rdi: {
    CHILD_1_3: 90, CHILD_4_8: 90,
    M_9_13: 120, M_14_18: 150, M_19_30: 150, M_31_50: 150, M_51_70: 150, M_70P: 150,
    F_9_13: 120, F_14_18: 150, F_19_30: 150, F_31_50: 150, F_51_70: 150, F_70P: 150,
    PREG_14_18: 220, PREG_19_30: 220, PREG_31_50: 220,
    LACT_14_18: 270, LACT_19_30: 270, LACT_31_50: 270,
  } as Record<string, number | null>,
  ul: {
    CHILD_1_3: 200, CHILD_4_8: 300,
    M_9_13: 600, M_14_18: 900, M_19_30: 1100, M_31_50: 1100, M_51_70: 1100, M_70P: 1100,
    F_9_13: 600, F_14_18: 900, F_19_30: 1100, F_31_50: 1100, F_51_70: 1100, F_70P: 1100,
    PREG_14_18: 900, PREG_19_30: 1100, PREG_31_50: 1100,
    LACT_14_18: 900, LACT_19_30: 1100, LACT_31_50: 1100,
  } as Record<string, number | null>,
};

export const SELENIUM = {
  unit: 'µg', compoundName: 'Selenium',
  ai: { INFANT_0_6: 12, INFANT_7_12: 15 } as Record<string, number | null>,
  ear: {
    CHILD_1_3: 20, CHILD_4_8: 25,
    M_9_13: 40, M_14_18: 60, M_19_30: 60, M_31_50: 60, M_51_70: 60, M_70P: 60,
    F_9_13: 40, F_14_18: 50, F_19_30: 50, F_31_50: 50, F_51_70: 50, F_70P: 50,
    PREG_14_18: 55, PREG_19_30: 55, PREG_31_50: 55,
    LACT_14_18: 65, LACT_19_30: 65, LACT_31_50: 65,
  } as Record<string, number | null>,
  rdi: {
    CHILD_1_3: 25, CHILD_4_8: 30,
    M_9_13: 50, M_14_18: 70, M_19_30: 70, M_31_50: 70, M_51_70: 70, M_70P: 70,
    F_9_13: 50, F_14_18: 60, F_19_30: 60, F_31_50: 60, F_51_70: 60, F_70P: 60,
    PREG_14_18: 65, PREG_19_30: 65, PREG_31_50: 65,
    LACT_14_18: 75, LACT_19_30: 75, LACT_31_50: 75,
  } as Record<string, number | null>,
  ul: {
    INFANT_0_6: 45, INFANT_7_12: 60,
    CHILD_1_3: 90, CHILD_4_8: 150,
    M_9_13: 280, M_14_18: 400, M_19_30: 400, M_31_50: 400, M_51_70: 400, M_70P: 400,
    F_9_13: 280, F_14_18: 400, F_19_30: 400, F_31_50: 400, F_51_70: 400, F_70P: 400,
    PREG_14_18: 400, PREG_19_30: 400, PREG_31_50: 400,
    LACT_14_18: 400, LACT_19_30: 400, LACT_31_50: 400,
  } as Record<string, number | null>,
};

export const MOLYBDENUM = {
  unit: 'µg', compoundName: 'Molybdenum',
  ai: { INFANT_0_6: 2, INFANT_7_12: 3 } as Record<string, number | null>,
  ear: {
    CHILD_1_3: 13, CHILD_4_8: 17,
    M_9_13: 26, M_14_18: 33, M_19_30: 34, M_31_50: 34, M_51_70: 34, M_70P: 34,
    F_9_13: 26, F_14_18: 33, F_19_30: 34, F_31_50: 34, F_51_70: 34, F_70P: 34,
    PREG_14_18: 40, PREG_19_30: 40, PREG_31_50: 40,
    LACT_14_18: 35, LACT_19_30: 36, LACT_31_50: 36,
  } as Record<string, number | null>,
  rdi: {
    CHILD_1_3: 17, CHILD_4_8: 22,
    M_9_13: 34, M_14_18: 43, M_19_30: 45, M_31_50: 45, M_51_70: 45, M_70P: 45,
    F_9_13: 34, F_14_18: 43, F_19_30: 45, F_31_50: 45, F_51_70: 45, F_70P: 45,
    PREG_14_18: 50, PREG_19_30: 50, PREG_31_50: 50,
    LACT_14_18: 50, LACT_19_30: 50, LACT_31_50: 50,
  } as Record<string, number | null>,
  ul: {
    CHILD_1_3: 300, CHILD_4_8: 600,
    M_9_13: 1100, M_14_18: 1700, M_19_30: 2000, M_31_50: 2000, M_51_70: 2000, M_70P: 2000,
    F_9_13: 1100, F_14_18: 1700, F_19_30: 2000, F_31_50: 2000, F_51_70: 2000, F_70P: 2000,
    PREG_14_18: 1700, PREG_19_30: 2000, PREG_31_50: 2000,
    LACT_14_18: 1700, LACT_19_30: 2000, LACT_31_50: 2000,
  } as Record<string, number | null>,
};

// ═════════════════════════════════════════════════════════════════
// MINERALS — Cu, Cr, Mn, F, Na, K (Table 9, Cr/Mn/F/Na 2017 updates)
// ═════════════════════════════════════════════════════════════════

export const COPPER = {
  unit: 'mg', compoundName: 'Copper',
  ai: {
    INFANT_0_6: 0.20, INFANT_7_12: 0.22,
    CHILD_1_3: 0.7, CHILD_4_8: 1.0,
    M_9_13: 1.3, M_14_18: 1.5, M_19_30: 1.7, M_31_50: 1.7, M_51_70: 1.7, M_70P: 1.7,
    F_9_13: 1.1, F_14_18: 1.1, F_19_30: 1.2, F_31_50: 1.2, F_51_70: 1.2, F_70P: 1.2,
    PREG_14_18: 1.2, PREG_19_30: 1.3, PREG_31_50: 1.3,
    LACT_14_18: 1.4, LACT_19_30: 1.5, LACT_31_50: 1.5,
  } as Record<string, number | null>,
  ul: {
    CHILD_1_3: 1, CHILD_4_8: 3,
    M_9_13: 5, M_14_18: 8, M_19_30: 10, M_31_50: 10, M_51_70: 10, M_70P: 10,
    F_9_13: 5, F_14_18: 8, F_19_30: 10, F_31_50: 10, F_51_70: 10, F_70P: 10,
    PREG_14_18: 8, PREG_19_30: 10, PREG_31_50: 10,
    LACT_14_18: 8, LACT_19_30: 10, LACT_31_50: 10,
  } as Record<string, number | null>,
};

export const CHROMIUM = {
  unit: 'µg', compoundName: 'Chromium',
  ai: {
    INFANT_0_6: 0.2, INFANT_7_12: 5.5,
    CHILD_1_3: 11, CHILD_4_8: 15,
    M_9_13: 25, M_14_18: 35, M_19_30: 35, M_31_50: 35, M_51_70: 35, M_70P: 35,
    F_9_13: 21, F_14_18: 24, F_19_30: 25, F_31_50: 25, F_51_70: 25, F_70P: 25,
    PREG_14_18: 30, PREG_19_30: 30, PREG_31_50: 30,
    LACT_14_18: 45, LACT_19_30: 45, LACT_31_50: 45,
  } as Record<string, number | null>,
};

export const MANGANESE = {
  unit: 'mg', compoundName: 'Manganese',
  ai: {
    INFANT_0_6: 0.003, INFANT_7_12: 0.600,
    CHILD_1_3: 2.0, CHILD_4_8: 2.5,
    M_9_13: 3.0, M_14_18: 3.5, M_19_30: 5.5, M_31_50: 5.5, M_51_70: 5.5, M_70P: 5.5,
    F_9_13: 2.5, F_14_18: 3.0, F_19_30: 5.0, F_31_50: 5.0, F_51_70: 5.0, F_70P: 5.0,
    PREG_14_18: 5.0, PREG_19_30: 5.0, PREG_31_50: 5.0,
    LACT_14_18: 5.0, LACT_19_30: 5.0, LACT_31_50: 5.0,
  } as Record<string, number | null>,
};

export const FLUORIDE = {
  unit: 'mg', compoundName: 'Fluoride',
  ai: {
    INFANT_0_6: 0, INFANT_7_12: 0.5,
    CHILD_1_3: 0.6, CHILD_4_8: 1.1,
    M_9_13: 2.0, M_14_18: 3.0, M_19_30: 4.0, M_31_50: 4.0, M_51_70: 4.0, M_70P: 3.0,
    F_9_13: 2.0, F_14_18: 3.0, F_19_30: 3.0, F_31_50: 3.0, F_51_70: 3.0, F_70P: 3.0,
    PREG_14_18: 3.0, PREG_19_30: 3.0, PREG_31_50: 3.0,
    LACT_14_18: 3.0, LACT_19_30: 3.0, LACT_31_50: 3.0,
  } as Record<string, number | null>,
  ul: {
    INFANT_0_6: 1.2, INFANT_7_12: 1.8,
    CHILD_1_3: 2.4, CHILD_4_8: 4.4,
    M_9_13: 10, M_14_18: 10, M_19_30: 10, M_31_50: 10, M_51_70: 10, M_70P: 10,
    F_9_13: 10, F_14_18: 10, F_19_30: 10, F_31_50: 10, F_51_70: 10, F_70P: 10,
    PREG_14_18: 10, PREG_19_30: 10, PREG_31_50: 10,
    LACT_14_18: 10, LACT_19_30: 10, LACT_31_50: 10,
  } as Record<string, number | null>,
};

// Sodium — AI was stored as range 460-920 (2017 update retained prior AI)
// UL 2017: ND for children, 2300 for 18+ adults
export const SODIUM = {
  unit: 'mg', compoundName: 'Sodium',
  ai: {
    INFANT_0_6: 120, INFANT_7_12: 170,
    // Ranges — midpoint stored in value, min/max in valueMin/valueMax
    CHILD_1_3: 300,   CHILD_4_8: 450,   // 200-400 and 300-600 midpoints
    M_9_13: 600,  M_14_18: 690,  M_19_30: 690,  M_31_50: 690,  M_51_70: 690,  M_70P: 690,  // 460-920 mid
    F_9_13: 600,  F_14_18: 690,  F_19_30: 690,  F_31_50: 690,  F_51_70: 690,  F_70P: 690,
    PREG_14_18: 690, PREG_19_30: 690, PREG_31_50: 690,
    LACT_14_18: 690, LACT_19_30: 690, LACT_31_50: 690,
  } as Record<string, number | null>,
  aiMin: {
    CHILD_1_3: 200, CHILD_4_8: 300,
    M_9_13: 400, M_14_18: 460, M_19_30: 460, M_31_50: 460, M_51_70: 460, M_70P: 460,
    F_9_13: 400, F_14_18: 460, F_19_30: 460, F_31_50: 460, F_51_70: 460, F_70P: 460,
    PREG_14_18: 460, PREG_19_30: 460, PREG_31_50: 460,
    LACT_14_18: 460, LACT_19_30: 460, LACT_31_50: 460,
  } as Record<string, number | null>,
  aiMax: {
    CHILD_1_3: 400, CHILD_4_8: 600,
    M_9_13: 800, M_14_18: 920, M_19_30: 920, M_31_50: 920, M_51_70: 920, M_70P: 920,
    F_9_13: 800, F_14_18: 920, F_19_30: 920, F_31_50: 920, F_51_70: 920, F_70P: 920,
    PREG_14_18: 920, PREG_19_30: 920, PREG_31_50: 920,
    LACT_14_18: 920, LACT_19_30: 920, LACT_31_50: 920,
  } as Record<string, number | null>,
  // UL 2017 — only for 18+ adults
  ul: {
    M_14_18: 2300,
    M_19_30: 2300, M_31_50: 2300, M_51_70: 2300, M_70P: 2300,
    F_14_18: 2300,
    F_19_30: 2300, F_31_50: 2300, F_51_70: 2300, F_70P: 2300,
    PREG_14_18: 2300, PREG_19_30: 2300, PREG_31_50: 2300,
    LACT_14_18: 2300, LACT_19_30: 2300, LACT_31_50: 2300,
  } as Record<string, number | null>,
  // SDT 2017 — adults 19+
  sdt: {
    M_19_30: 2000, M_31_50: 2000, M_51_70: 2000, M_70P: 2000,
    F_19_30: 2000, F_31_50: 2000, F_51_70: 2000, F_70P: 2000,
  } as Record<string, number | null>,
};

export const POTASSIUM = {
  unit: 'mg', compoundName: 'Potassium',
  ai: {
    INFANT_0_6: 400, INFANT_7_12: 700,
    CHILD_1_3: 2000, CHILD_4_8: 2300,
    M_9_13: 3000, M_14_18: 3600, M_19_30: 3800, M_31_50: 3800, M_51_70: 3800, M_70P: 3800,
    F_9_13: 2500, F_14_18: 2600, F_19_30: 2800, F_31_50: 2800, F_51_70: 2800, F_70P: 2800,
    PREG_14_18: 2800, PREG_19_30: 2800, PREG_31_50: 2800,
    LACT_14_18: 3200, LACT_19_30: 3200, LACT_31_50: 3200,
  } as Record<string, number | null>,
};

// ═════════════════════════════════════════════════════════════════
// ENERGY (Tables 1, 2, 3) — at PAL 1.6 (Light, typical moderate activity)
// Convert kJ → kcal (÷ 4.184)
// Infants: single value per month (no PAL)
// Children 3-18: single-year buckets × sex at PAL 1.6
// Adults: median height/weight × PAL 1.6
// ═════════════════════════════════════════════════════════════════

// Table 1: Infant EER kJ/day → kcal/day
export const ENERGY_INFANTS_MONTHLY: Array<{ ageMonth: number; kcalM: number; kcalF: number }> = [
  { ageMonth: 1,  kcalM: 478,  kcalF: 430 },   // 2000/1800 kJ
  { ageMonth: 2,  kcalM: 574,  kcalF: 502 },   // 2400/2100
  { ageMonth: 3,  kcalM: 574,  kcalF: 526 },   // 2400/2200
  { ageMonth: 4,  kcalM: 574,  kcalF: 526 },   // 2400/2200
  { ageMonth: 5,  kcalM: 598,  kcalF: 550 },   // 2500/2300
  { ageMonth: 6,  kcalM: 645,  kcalF: 598 },   // 2700/2500
  { ageMonth: 7,  kcalM: 669,  kcalF: 598 },   // 2800/2500
  { ageMonth: 8,  kcalM: 717,  kcalF: 645 },   // 3000/2700
  { ageMonth: 9,  kcalM: 741,  kcalF: 669 },   // 3100/2800
  { ageMonth: 10, kcalM: 789,  kcalF: 717 },   // 3300/3000
  { ageMonth: 11, kcalM: 813,  kcalF: 741 },   // 3400/3100
  { ageMonth: 12, kcalM: 837,  kcalF: 765 },   // 3500/3200
  // 15/18/21/24 mo go into 1-3 y band; also covered by child EER below
];

// Table 2: Children 3-18 y EER at PAL 1.6 (Light) — MJ/d × 239 for kcal
// Index by year 3-18
export const ENERGY_CHILDREN: Array<{ year: number; kcalM: number; kcalF: number }> = [
  { year: 3,  kcalM: 1339, kcalF: 1267 },  // 5.6 / 5.3 MJ
  { year: 4,  kcalM: 1410, kcalF: 1315 },  // 5.9 / 5.5
  { year: 5,  kcalM: 1482, kcalF: 1554 },  // 6.2 / 6.5 (table says 6.5 for girl5)
  { year: 6,  kcalM: 1577, kcalF: 1458 },  // 6.6 / 6.1
  { year: 7,  kcalM: 1673, kcalF: 1554 },  // 7.0 / 6.5
  { year: 8,  kcalM: 1745, kcalF: 1649 },  // 7.3 / 6.9
  { year: 9,  kcalM: 1864, kcalF: 1745 },  // 7.8 / 7.3
  { year: 10, kcalM: 1984, kcalF: 1817 },  // 8.3 / 7.6
  { year: 11, kcalM: 2103, kcalF: 1912 },  // 8.8 / 8.0
  { year: 12, kcalM: 2222, kcalF: 2032 },  // 9.3 / 8.5
  { year: 13, kcalM: 2390, kcalF: 2127 },  // 10.0 / 8.9
  { year: 14, kcalM: 2533, kcalF: 2198 },  // 10.6 / 9.2
  { year: 15, kcalM: 2677, kcalF: 2246 },  // 11.2 / 9.4
  { year: 16, kcalM: 2820, kcalF: 2270 },  // 11.8 / 9.5
  { year: 17, kcalM: 2916, kcalF: 2294 },  // 12.2 / 9.6
  { year: 18, kcalM: 2988, kcalF: 2318 },  // 12.5 / 9.7
];

// Table 3: Adults at median ht×wt, PAL 1.6 (Light)
// Men median row: 1.7m, 63.6kg; Women median row: 1.6m, 56.3kg
// 19-30 M: 11.0 MJ; 31-50 M: 10.7; 51-70 M: 9.8; >70 M: 8.9
// 19-30 F: 8.8 MJ; 31-50 F: 8.7; 51-70 F: 8.3; >70 F: 7.8
export const ENERGY_ADULTS: Record<string, { kcalM: number; kcalF: number }> = {
  M_19_30: { kcalM: 2629, kcalF: 2103 },  // 11.0 / 8.8 MJ
  M_31_50: { kcalM: 2557, kcalF: 2079 },  // 10.7 / 8.7
  M_51_70: { kcalM: 2342, kcalF: 1984 },  //  9.8 / 8.3
  M_70P:   { kcalM: 2127, kcalF: 1864 },  //  8.9 / 7.8
};
