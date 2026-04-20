/**
 * Seed: Nordic Nutrition Recommendations 2023
 *
 * Source: pub.norden.org/nord2023-003 (Nordic Council of Ministers)
 * Coverage: all age groups (infants → 70+), both sexes, pregnancy trimesters,
 *           lactation, RI/AI/AR/UL/CDRR where NNR provides them.
 * Uses age_min_months / age_max_months for native NNR age ranges.
 *
 * Run: npx tsx db/seed/seed-nordic-nnr-2023.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const SOURCE = {
  authorityName: 'Nordic Nutrition Recommendations 2023',
  regionCode: 'NORDIC',
  versionYear: 2023,
  sourceType: 'SCIENTIFIC_DRI' as const,
  url: 'https://pub.norden.org/nord2023-003',
  note:
    'NNR2023 — 5-year Nordic & Baltic scientific review. RI = Recommended Intake (covers 97.5% of group); AI = Adequate Intake (when RI cannot be derived); AR = Average Requirement (EAR equivalent); some ARs are provisional. Pregnancy published per trimester. Sodium stored as CDRR (chronic disease risk reduction) + AI. Values extracted from Tables 11-16 and per-nutrient chapters.',
  retrievedDate: '2026-04-14',
};

// NNR publishes under short names ("Vitamin A"); Nutri DB uses compound-form names
// ("Vitamin A (RAE)"). Map the NNR label to the DB canonical row.
const COMPOUND_NAME_MAP: Record<string, string> = {
  'Vitamin A': 'Vitamin A (RAE)',
  'Vitamin D': 'Vitamin D (Total)',
  'Vitamin E': 'Vitamin E (Total)',
  'Vitamin K': 'Vitamin K (Total)',
  'Vitamin B12': 'Vitamin B12 (Total)',
  'Vitamin C': 'Vitamin C (Total)',
  'Thiamin': 'Thiamin (B1)',
  'Riboflavin': 'Riboflavin (B2)',
  'Niacin': 'Niacin (B3)',
  'Pantothenic Acid': 'Pantothenic Acid (B5)',
  'Biotin': 'Biotin (B7)',
  'Folate': 'Folate (Total)',
  'Choline': 'Choline (Total)',
  'Calcium': 'Calcium (Total)',
  'Iron': 'Iron (Total)',
  'Zinc': 'Zinc (Total)',
  'Magnesium': 'Magnesium (Total)',
  'Selenium': 'Selenium (Total)',
  // Unchanged — keep for round-trip safety:
  // 'Vitamin B6', 'Phosphorus', 'Potassium', 'Sodium', 'Copper', 'Manganese',
  // 'Molybdenum', 'Iodine', 'Fluoride', 'Protein'
};
function resolveDbName(n: string): string {
  return COMPOUND_NAME_MAP[n] ?? n;
}

// ═══════════════════════════════════════════════════════════════
// Age ranges — native NNR 2023 buckets expressed in months.
// Key maps to per-nutrient value tables below.
// ═══════════════════════════════════════════════════════════════

type Sex = 'MALE' | 'FEMALE';
type LifeStage = 'NONE' | 'PREGNANT_T1' | 'PREGNANT_T2' | 'PREGNANT_T3' | 'LACTATING';

interface AgeRange {
  key: string;
  minMonths: number;
  maxMonths: number | null;
  sex: Sex | 'BOTH';
  lifeStage: LifeStage;
  label: string;
}

const AGE_RANGES: AgeRange[] = [
  // Infants + children (not sex-differentiated in NNR Tables 12-15)
  { key: 'INFANT_0_6',   minMonths: 0,   maxMonths: 6,    sex: 'BOTH', lifeStage: 'NONE', label: '≤6 mo' },
  { key: 'INFANT_7_11',  minMonths: 7,   maxMonths: 11,   sex: 'BOTH', lifeStage: 'NONE', label: '7-11 mo' },
  { key: 'CHILD_1_3',    minMonths: 12,  maxMonths: 47,   sex: 'BOTH', lifeStage: 'NONE', label: '1-3 y' },
  { key: 'CHILD_4_6',    minMonths: 48,  maxMonths: 83,   sex: 'BOTH', lifeStage: 'NONE', label: '4-6 y' },
  { key: 'CHILD_7_10',   minMonths: 84,  maxMonths: 131,  sex: 'BOTH', lifeStage: 'NONE', label: '7-10 y' },
  // Females
  { key: 'F_11_14',      minMonths: 132, maxMonths: 179,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 11-14 y' },
  { key: 'F_15_17',      minMonths: 180, maxMonths: 215,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 15-17 y' },
  { key: 'F_18_24',      minMonths: 216, maxMonths: 299,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 18-24 y' },
  { key: 'F_25_50',      minMonths: 300, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 25-50 y' },
  { key: 'F_51_70',      minMonths: 612, maxMonths: 851,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 51-70 y' },
  { key: 'F_70P',        minMonths: 852, maxMonths: null, sex: 'FEMALE', lifeStage: 'NONE', label: 'F >70 y' },
  // Pregnancy (fertile-age females; NNR doesn't subdivide pregnant rows by age)
  { key: 'PREG_T1',      minMonths: 180, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT_T1', label: 'Pregnant T1' },
  { key: 'PREG_T2',      minMonths: 180, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT_T2', label: 'Pregnant T2' },
  { key: 'PREG_T3',      minMonths: 180, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT_T3', label: 'Pregnant T3' },
  { key: 'LACT',         minMonths: 180, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'LACTATING',  label: 'Lactating' },
  // Males
  { key: 'M_11_14',      minMonths: 132, maxMonths: 179,  sex: 'MALE', lifeStage: 'NONE', label: 'M 11-14 y' },
  { key: 'M_15_17',      minMonths: 180, maxMonths: 215,  sex: 'MALE', lifeStage: 'NONE', label: 'M 15-17 y' },
  { key: 'M_18_24',      minMonths: 216, maxMonths: 299,  sex: 'MALE', lifeStage: 'NONE', label: 'M 18-24 y' },
  { key: 'M_25_50',      minMonths: 300, maxMonths: 611,  sex: 'MALE', lifeStage: 'NONE', label: 'M 25-50 y' },
  { key: 'M_51_70',      minMonths: 612, maxMonths: 851,  sex: 'MALE', lifeStage: 'NONE', label: 'M 51-70 y' },
  { key: 'M_70P',        minMonths: 852, maxMonths: null, sex: 'MALE', lifeStage: 'NONE', label: 'M >70 y' },
];

const AGE_BY_KEY = new Map(AGE_RANGES.map((a) => [a.key, a]));

// ═══════════════════════════════════════════════════════════════
// Per-compound value tables — Tables 12-15 of NNR 2023 report.
// null = NNR didn't publish a value for that demographic.
// ═══════════════════════════════════════════════════════════════

type AgeValue = number | null;
type NutrientTable = Record<string, AgeValue>;

// Table 12: RI for vitamins
const VIT_A_RI: NutrientTable = {
  INFANT_0_6: null, INFANT_7_11: 250, CHILD_1_3: 300, CHILD_4_6: 350, CHILD_7_10: 450,
  F_11_14: 650, F_15_17: 650, F_18_24: 700, F_25_50: 700, F_51_70: 700, F_70P: 650,
  PREG_T1: 750, PREG_T2: 750, PREG_T3: 750, LACT: 1400,
  M_11_14: 700, M_15_17: 750, M_18_24: 800, M_25_50: 800, M_51_70: 800, M_70P: 750,
};
const VIT_D_RI: NutrientTable = {
  INFANT_0_6: null, INFANT_7_11: 10, CHILD_1_3: 10, CHILD_4_6: 10, CHILD_7_10: 10,
  F_11_14: 10, F_15_17: 10, F_18_24: 10, F_25_50: 10, F_51_70: 10, F_70P: 20,
  PREG_T1: 10, PREG_T2: 10, PREG_T3: 10, LACT: 10,
  M_11_14: 10, M_15_17: 10, M_18_24: 10, M_25_50: 10, M_51_70: 10, M_70P: 20,
};
const THIAMIN_RI_MG_PER_MJ = 0.1; // convert to mg/d at main() time
const RIBOFLAVIN_RI: NutrientTable = {
  INFANT_0_6: 0.3, INFANT_7_11: 0.4, CHILD_1_3: 0.6, CHILD_4_6: 0.7, CHILD_7_10: 1.0,
  F_11_14: 1.4, F_15_17: 1.6, F_18_24: 1.6, F_25_50: 1.6, F_51_70: 1.6, F_70P: 1.6,
  PREG_T1: 1.6, PREG_T2: 1.7, PREG_T3: 1.8, LACT: 2.0,
  M_11_14: 1.3, M_15_17: 1.6, M_18_24: 1.6, M_25_50: 1.6, M_51_70: 1.6, M_70P: 1.6,
};
const NIACIN_RI_NE_PER_MJ = 1.6; // convert to mg NE/d at main() time
const VIT_B6_RI: NutrientTable = {
  INFANT_0_6: 0.1, INFANT_7_11: 0.4, CHILD_1_3: 0.6, CHILD_4_6: 0.7, CHILD_7_10: 1.0,
  F_11_14: 1.3, F_15_17: 1.5, F_18_24: 1.6, F_25_50: 1.6, F_51_70: 1.6, F_70P: 1.6,
  PREG_T1: 1.6, PREG_T2: 1.8, PREG_T3: 2.0, LACT: 1.7,
  M_11_14: 1.5, M_15_17: 1.8, M_18_24: 1.8, M_25_50: 1.8, M_51_70: 1.8, M_70P: 1.7,
};
const FOLATE_RI: NutrientTable = {
  INFANT_0_6: 64, INFANT_7_11: 90, CHILD_1_3: 120, CHILD_4_6: 140, CHILD_7_10: 200,
  F_11_14: 280, F_15_17: 310, F_18_24: 330, F_25_50: 330, F_51_70: 330, F_70P: 330,
  PREG_T1: 600, PREG_T2: 600, PREG_T3: 600, LACT: 490,
  M_11_14: 260, M_15_17: 320, M_18_24: 330, M_25_50: 330, M_51_70: 330, M_70P: 330,
};
const VIT_C_RI: NutrientTable = {
  INFANT_0_6: 30, INFANT_7_11: 30, CHILD_1_3: 25, CHILD_4_6: 35, CHILD_7_10: 55,
  F_11_14: 75, F_15_17: 90, F_18_24: 95, F_25_50: 95, F_51_70: 95, F_70P: 95,
  PREG_T1: 105, PREG_T2: 105, PREG_T3: 105, LACT: 155,
  M_11_14: 80, M_15_17: 105, M_18_24: 110, M_25_50: 110, M_51_70: 110, M_70P: 110,
};

// Table 13: AI for vitamins
const VIT_E_AI: NutrientTable = {
  INFANT_0_6: 4, INFANT_7_11: 5, CHILD_1_3: 7, CHILD_4_6: 8, CHILD_7_10: 9,
  F_11_14: 10, F_15_17: 11, F_18_24: 10, F_25_50: 10, F_51_70: 9, F_70P: 9,
  PREG_T1: 10, PREG_T2: 11, PREG_T3: 12, LACT: 11,
  M_11_14: 11, M_15_17: 12, M_18_24: 11, M_25_50: 11, M_51_70: 11, M_70P: 11,
};
const VIT_K_AI: NutrientTable = {
  INFANT_0_6: null, INFANT_7_11: 10, CHILD_1_3: 15, CHILD_4_6: 20, CHILD_7_10: 30,
  F_11_14: 45, F_15_17: 60, F_18_24: 65, F_25_50: 65, F_51_70: 60, F_70P: 60,
  PREG_T1: 65, PREG_T2: 70, PREG_T3: 75, LACT: 65,
  M_11_14: 50, M_15_17: 65, M_18_24: 75, M_25_50: 75, M_51_70: 70, M_70P: 70,
};
const PANTO_AI: NutrientTable = {
  INFANT_0_6: 2, INFANT_7_11: 3, CHILD_1_3: 4, CHILD_4_6: 4, CHILD_7_10: 4,
  F_11_14: 5, F_15_17: 5, F_18_24: 5, F_25_50: 5, F_51_70: 5, F_70P: 5,
  PREG_T1: 5, PREG_T2: 5, PREG_T3: 5, LACT: 7,
  M_11_14: 5, M_15_17: 5, M_18_24: 5, M_25_50: 5, M_51_70: 5, M_70P: 5,
};
const BIOTIN_AI: NutrientTable = {
  INFANT_0_6: 4, INFANT_7_11: 5, CHILD_1_3: 20, CHILD_4_6: 25, CHILD_7_10: 25,
  F_11_14: 35, F_15_17: 35, F_18_24: 40, F_25_50: 40, F_51_70: 40, F_70P: 40,
  PREG_T1: 40, PREG_T2: 40, PREG_T3: 40, LACT: 45,
  M_11_14: 35, M_15_17: 35, M_18_24: 40, M_25_50: 40, M_51_70: 40, M_70P: 40,
};
const B12_AI: NutrientTable = {
  INFANT_0_6: 0.4, INFANT_7_11: 1.5, CHILD_1_3: 1.5, CHILD_4_6: 1.7, CHILD_7_10: 2.5,
  F_11_14: 3.5, F_15_17: 4, F_18_24: 4, F_25_50: 4, F_51_70: 4, F_70P: 4,
  PREG_T1: 4.5, PREG_T2: 4.5, PREG_T3: 4.5, LACT: 5.5,
  M_11_14: 3, M_15_17: 4, M_18_24: 4, M_25_50: 4, M_51_70: 4, M_70P: 4,
};
const CHOLINE_AI: NutrientTable = {
  INFANT_0_6: 120, INFANT_7_11: 170, CHILD_1_3: 150, CHILD_4_6: 170, CHILD_7_10: 250,
  F_11_14: 350, F_15_17: 390, F_18_24: 400, F_25_50: 400, F_51_70: 400, F_70P: 400,
  PREG_T1: 410, PREG_T2: 430, PREG_T3: 470, LACT: 520,
  M_11_14: 330, M_15_17: 400, M_18_24: 400, M_25_50: 400, M_51_70: 400, M_70P: 400,
};

// Table 14: RI for minerals
const CALCIUM_RI: NutrientTable = {
  INFANT_0_6: 120, INFANT_7_11: 310, CHILD_1_3: 450, CHILD_4_6: 800, CHILD_7_10: 800,
  F_11_14: 1150, F_15_17: 1150, F_18_24: 1000, F_25_50: 950, F_51_70: 950, F_70P: 950,
  PREG_T1: 950, PREG_T2: 950, PREG_T3: 950, LACT: 950,
  M_11_14: 1150, M_15_17: 1150, M_18_24: 1000, M_25_50: 950, M_51_70: 950, M_70P: 950,
};
const IRON_RI: NutrientTable = {
  INFANT_0_6: null, INFANT_7_11: 10, CHILD_1_3: 7, CHILD_4_6: 7, CHILD_7_10: 9,
  F_11_14: 13, F_15_17: 15, F_18_24: 15, F_25_50: 15, F_51_70: 8, F_70P: 7,
  PREG_T1: 24, PREG_T2: 25, PREG_T3: 26, LACT: 15,
  M_11_14: 11, M_15_17: 11, M_18_24: 9, M_25_50: 9, M_51_70: 9, M_70P: 9,
};
const ZINC_RI: NutrientTable = {
  INFANT_0_6: null, INFANT_7_11: 3.0, CHILD_1_3: 4.5, CHILD_4_6: 5.8, CHILD_7_10: 7.7,
  F_11_14: 10.8, F_15_17: 12.2, F_18_24: 9.7, F_25_50: 9.7, F_51_70: 9.5, F_70P: 9.3,
  PREG_T1: 9.7, PREG_T2: 12.1, PREG_T3: 12.1, LACT: 12.6,
  M_11_14: 11.1, M_15_17: 14.0, M_18_24: 12.7, M_25_50: 12.7, M_51_70: 12.4, M_70P: 12.1,
};
const COPPER_RI: NutrientTable = {
  INFANT_0_6: 200, INFANT_7_11: 220, CHILD_1_3: 340, CHILD_4_6: 400, CHILD_7_10: 570,
  F_11_14: 780, F_15_17: 880, F_18_24: 900, F_25_50: 900, F_51_70: 900, F_70P: 900,
  PREG_T1: 1000, PREG_T2: 1000, PREG_T3: 1000, LACT: 1300,
  M_11_14: 740, M_15_17: 900, M_18_24: 900, M_25_50: 900, M_51_70: 900, M_70P: 900,
};

// Table 15: AI for minerals
const PHOSPHORUS_AI: NutrientTable = {
  INFANT_0_6: null, INFANT_7_11: 170, CHILD_1_3: 250, CHILD_4_6: 440, CHILD_7_10: 440,
  F_11_14: 640, F_15_17: 640, F_18_24: 550, F_25_50: 520, F_51_70: 520, F_70P: 520,
  PREG_T1: 520, PREG_T2: 520, PREG_T3: 520, LACT: 520,
  M_11_14: 640, M_15_17: 640, M_18_24: 550, M_25_50: 520, M_51_70: 520, M_70P: 520,
};
const POTASSIUM_AI: NutrientTable = {
  INFANT_0_6: 400, INFANT_7_11: 700, CHILD_1_3: 850, CHILD_4_6: 1150, CHILD_7_10: 1800,
  F_11_14: 2400, F_15_17: 2850, F_18_24: 3500, F_25_50: 3500, F_51_70: 3500, F_70P: 3500,
  PREG_T1: 3500, PREG_T2: 3500, PREG_T3: 3500, LACT: 3500,
  M_11_14: 2550, M_15_17: 3400, M_18_24: 3500, M_25_50: 3500, M_51_70: 3500, M_70P: 3500,
};
const MAGNESIUM_AI: NutrientTable = {
  INFANT_0_6: 25, INFANT_7_11: 80, CHILD_1_3: 170, CHILD_4_6: 230, CHILD_7_10: 230,
  F_11_14: 250, F_15_17: 250, F_18_24: 300, F_25_50: 300, F_51_70: 300, F_70P: 300,
  PREG_T1: 300, PREG_T2: 300, PREG_T3: 300, LACT: 300,
  M_11_14: 300, M_15_17: 300, M_18_24: 350, M_25_50: 350, M_51_70: 350, M_70P: 350,
};
const IODINE_AI: NutrientTable = {
  INFANT_0_6: 85, INFANT_7_11: 85, CHILD_1_3: 100, CHILD_4_6: 100, CHILD_7_10: 100,
  F_11_14: 120, F_15_17: 120, F_18_24: 150, F_25_50: 150, F_51_70: 150, F_70P: 150,
  PREG_T1: 175, PREG_T2: 200, PREG_T3: 200, LACT: 200,
  M_11_14: 130, M_15_17: 140, M_18_24: 150, M_25_50: 150, M_51_70: 150, M_70P: 150,
};
const SELENIUM_AI: NutrientTable = {
  INFANT_0_6: 10, INFANT_7_11: 20, CHILD_1_3: 20, CHILD_4_6: 25, CHILD_7_10: 40,
  F_11_14: 60, F_15_17: 70, F_18_24: 75, F_25_50: 75, F_51_70: 75, F_70P: 75,
  PREG_T1: 80, PREG_T2: 85, PREG_T3: 90, LACT: 85,
  M_11_14: 65, M_15_17: 85, M_18_24: 90, M_25_50: 90, M_51_70: 90, M_70P: 85,
};
const FLUORIDE_AI: NutrientTable = {
  INFANT_0_6: null, INFANT_7_11: 0.4, CHILD_1_3: 0.7, CHILD_4_6: 1.0, CHILD_7_10: 1.5,
  F_11_14: 2.3, F_15_17: 2.9, F_18_24: 3.2, F_25_50: 3.2, F_51_70: 3.1, F_70P: 3.0,
  PREG_T1: 3.2, PREG_T2: 3.2, PREG_T3: 3.2, LACT: 3.2,
  M_11_14: 2.4, M_15_17: 3.3, M_18_24: 3.8, M_25_50: 3.7, M_51_70: 3.7, M_70P: 3.5,
};
const MANGANESE_AI: NutrientTable = {
  INFANT_0_6: 0.012, INFANT_7_11: 0.3, CHILD_1_3: 0.5, CHILD_4_6: 1.0, CHILD_7_10: 1.5,
  F_11_14: 2, F_15_17: 3, F_18_24: 3, F_25_50: 3, F_51_70: 3, F_70P: 3,
  PREG_T1: 3, PREG_T2: 3, PREG_T3: 3, LACT: 3,
  M_11_14: 2, M_15_17: 2.5, M_18_24: 3, M_25_50: 3, M_51_70: 3, M_70P: 3,
};
const MOLYBDENUM_AI: NutrientTable = {
  INFANT_0_6: null, INFANT_7_11: 10, CHILD_1_3: 15, CHILD_4_6: 20, CHILD_7_10: 30,
  F_11_14: 50, F_15_17: 60, F_18_24: 65, F_25_50: 65, F_51_70: 65, F_70P: 65,
  PREG_T1: 65, PREG_T2: 65, PREG_T3: 65, LACT: 65,
  M_11_14: 45, M_15_17: 60, M_18_24: 65, M_25_50: 65, M_51_70: 65, M_70P: 65,
};

// Table 16: Sodium CDRR (g/d) — same for ≥15 y adults; stored as mg
const SODIUM_CDRR_MG: NutrientTable = {
  INFANT_0_6: 110, INFANT_7_11: 370, CHILD_1_3: 1100, CHILD_4_6: 1400, CHILD_7_10: 1700,
  F_11_14: 2000, F_15_17: 2300, F_18_24: 2300, F_25_50: 2300, F_51_70: 2300, F_70P: 2300,
  PREG_T1: 2300, PREG_T2: 2300, PREG_T3: 2300, LACT: 2300,
  M_11_14: 2000, M_15_17: 2300, M_18_24: 2300, M_25_50: 2300, M_51_70: 2300, M_70P: 2300,
};

// Sodium AI (p.162): 1500 mg for all adults (F/M)
const SODIUM_AI_MG: NutrientTable = {
  INFANT_0_6: null, INFANT_7_11: null, CHILD_1_3: null, CHILD_4_6: null, CHILD_7_10: null,
  F_11_14: null, F_15_17: 1500, F_18_24: 1500, F_25_50: 1500, F_51_70: 1500, F_70P: 1500,
  PREG_T1: 1500, PREG_T2: 1500, PREG_T3: 1500, LACT: 1500,
  M_11_14: null, M_15_17: 1500, M_18_24: 1500, M_25_50: 1500, M_51_70: 1500, M_70P: 1500,
};

// ═══════════════════════════════════════════════════════════════
// Reference weights (kg) from NNR Appendix 4 / Tables 8 & 10
// Used for converting protein g/kg → g/day and for thiamin/niacin mg/MJ.
// Infants ≈ 8 kg at 7-11 mo (NNR-typical reference).
// ═══════════════════════════════════════════════════════════════

const REF_WEIGHT_KG: Record<string, number> = {
  INFANT_7_11: 9,
  CHILD_1_3: 13.6, CHILD_4_6: 20.7, CHILD_7_10: 30.8,
  F_11_14: 46.5, F_15_17: 57.8, F_18_24: 64.2, F_25_50: 64.1, F_51_70: 62.5, F_70P: 60.6,
  M_11_14: 48.2, M_15_17: 65.6, M_18_24: 75.2, M_25_50: 74.8, M_51_70: 73.0, M_70P: 70.6,
};
// Energy (MJ/d) at low-active PAL 1.4 (sedentary default per NNR Table 8)
const REF_ENERGY_MJ: Record<string, number> = {
  INFANT_7_11: 3,
  CHILD_1_3: 4.6, CHILD_4_6: 6.3, CHILD_7_10: 7.8,
  F_11_14: 9.2, F_15_17: 10.1, F_18_24: 8.3, F_25_50: 8.0, F_51_70: 7.2, F_70P: 7.1,
  M_11_14: 10.5, M_15_17: 12.7, M_18_24: 10.4, M_25_50: 9.9, M_51_70: 9.0, M_70P: 8.8,
  PREG_T1: 8.2, PREG_T2: 9.1, PREG_T3: 10.2, LACT: 9.9,
};

// ═══════════════════════════════════════════════════════════════
// Provisional AR flags per compound (NNR labels some ARs provisional
// because evidence is weaker). Applied when we seed EAR rows.
// ═══════════════════════════════════════════════════════════════

const COMPOUNDS_WITH_PROVISIONAL_AR = new Set([
  'Vitamin E', 'Vitamin K', 'Pantothenic Acid', 'Biotin', 'Vitamin B12', 'Choline',
  'Phosphorus', 'Magnesium', 'Potassium', 'Iodine', 'Selenium', 'Manganese',
  'Molybdenum', 'Fluoride',
]);

// AR (per-demographic) from per-nutrient chapters — adult values only.
// Non-adult AR values largely unpublished by NNR; we seed adults + apply
// provisional flag where relevant.
type ArTable = Partial<Record<string, Record<Sex, number | null>>>;

const VIT_A_AR: ArTable = {
  F_18_24: { FEMALE: 540, MALE: 0 }, F_25_50: { FEMALE: 540, MALE: 0 }, F_51_70: { FEMALE: 540, MALE: 0 }, F_70P: { FEMALE: 540, MALE: 0 },
  M_18_24: { FEMALE: 0, MALE: 630 }, M_25_50: { FEMALE: 0, MALE: 630 }, M_51_70: { FEMALE: 0, MALE: 630 }, M_70P: { FEMALE: 0, MALE: 630 },
};
const VIT_D_AR_ADULT = 7.5;
const VIT_E_PROV_AR = { FEMALE: 8, MALE: 9 };
const VIT_K_PROV_AR = { FEMALE: 50, MALE: 60 };
const RIBOFLAVIN_AR_ADULT = 1.3;
const B6_AR = { FEMALE: 1.3, MALE: 1.5 };
const FOLATE_AR_ADULT = 250;
const B12_PROV_AR = 3.2;
const CHOLINE_PROV_AR = 320;
const VIT_C_AR = { FEMALE: 75, MALE: 90 };
const BIOTIN_PROV_AR = 32;
const PANTO_PROV_AR = 4;
const CALCIUM_AR_ADULT = 750;
const IRON_AR = { FEMALE: 9, MALE: 7 };
const ZINC_AR = { FEMALE: 8, MALE: 11 };
const COPPER_AR_ADULT = 700;
const PHOSPHORUS_PROV_AR = 420;
const POTASSIUM_PROV_AR = 2800;
const MAGNESIUM_PROV_AR = { FEMALE: 240, MALE: 280 };
const IODINE_PROV_AR = 120;
const SELENIUM_PROV_AR = { FEMALE: 60, MALE: 70 };
const MANGANESE_PROV_AR = 2.4;
const MOLYBDENUM_PROV_AR = 52;
const FLUORIDE_PROV_AR = { FEMALE: 2.6, MALE: 3.0 };

// ═══════════════════════════════════════════════════════════════
// ULs (adults, per-nutrient chapters). null = NNR couldn't derive UL.
// Some ULs have special conditions captured in value_note.
// ═══════════════════════════════════════════════════════════════

interface UL {
  compound: string;
  value: number;
  unit: string;
  note?: string;
}
const ADULT_ULS: UL[] = [
  { compound: 'Vitamin A', value: 3000, unit: 'µg' },
  { compound: 'Vitamin D', value: 100, unit: 'µg' },
  { compound: 'Vitamin E', value: 300, unit: 'mg' },
  { compound: 'Vitamin B6', value: 12.5, unit: 'mg' },
  { compound: 'Folate', value: 1000, unit: 'µg', note: 'Applies to folic acid (synthetic form) only' },
  // Niacin UL is form-specific per NNR 2023: nicotinamide 900 mg, nicotinic acid 10 mg.
  // Store as umbrella Niacin (900 for typical food niacin) + split per-form rows.
  { compound: 'Niacin', value: 900, unit: 'mg', note: 'Umbrella UL — nicotinamide form (typical dietary niacin). Nicotinic acid supplement UL is 10 mg (see separate compound).' },
  { compound: 'Nicotinamide', value: 900, unit: 'mg', note: 'Nicotinamide form UL (food + supplements)' },
  { compound: 'Nicotinic Acid', value: 10, unit: 'mg', note: 'Nicotinic acid form UL — lower due to flushing threshold' },
  { compound: 'Calcium', value: 2500, unit: 'mg' },
  { compound: 'Phosphorus', value: 3000, unit: 'mg' },
  { compound: 'Magnesium', value: 250, unit: 'mg', note: 'Supplemental magnesium only' },
  { compound: 'Iron', value: 60, unit: 'mg' },
  { compound: 'Zinc', value: 25, unit: 'mg' },
  { compound: 'Iodine', value: 600, unit: 'µg' },
  { compound: 'Selenium', value: 255, unit: 'µg' },
  { compound: 'Copper', value: 5, unit: 'mg' },
  { compound: 'Molybdenum', value: 600, unit: 'µg' },
  { compound: 'Fluoride', value: 7, unit: 'mg' },
];

// ═══════════════════════════════════════════════════════════════
// Row-building
// ═══════════════════════════════════════════════════════════════

interface SeedRow {
  compoundName: string;
  ageMinMonths: number;
  ageMaxMonths: number | null;
  sex: Sex;
  lifeStage: LifeStage;
  valueType: 'RDA' | 'AI' | 'EAR' | 'CDRR' | 'UL';
  value: number;
  unit: string;
  isProvisional: boolean;
  valueNote: string | null;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function addTable(
  rows: SeedRow[],
  compoundName: string,
  table: NutrientTable,
  unit: string,
  valueType: 'RDA' | 'AI' | 'CDRR',
  note?: string,
) {
  for (const range of AGE_RANGES) {
    const v = table[range.key];
    if (v === null || v === undefined) continue;
    const sexes: Sex[] = range.sex === 'BOTH' ? ['MALE', 'FEMALE'] : [range.sex];
    for (const sex of sexes) {
      rows.push({
        compoundName,
        ageMinMonths: range.minMonths,
        ageMaxMonths: range.maxMonths,
        sex,
        lifeStage: range.lifeStage,
        valueType,
        value: v,
        unit,
        isProvisional: false,
        valueNote: note ?? null,
      });
    }
  }
}

function buildAllRows(): SeedRow[] {
  const rows: SeedRow[] = [];

  // RI for vitamins
  addTable(rows, 'Vitamin A', VIT_A_RI, 'µg', 'RDA', 'Retinol equivalents (RE); 1 RE = 1 µg retinol');
  addTable(rows, 'Vitamin D', VIT_D_RI, 'µg', 'RDA', '20 µg/d for age ≥75 y and for those with little/no sun exposure');
  addTable(rows, 'Riboflavin', RIBOFLAVIN_RI, 'mg', 'RDA');
  addTable(rows, 'Vitamin B6', VIT_B6_RI, 'mg', 'RDA');
  addTable(rows, 'Folate', FOLATE_RI, 'µg', 'RDA', 'Dietary folate; pregnant females additionally recommended folic acid supplementation 400 µg/d pre-conception through first trimester');
  addTable(rows, 'Vitamin C', VIT_C_RI, 'mg', 'RDA', 'Smokers require +40 mg/d');

  // AI for vitamins
  addTable(rows, 'Vitamin E', VIT_E_AI, 'mg', 'AI', 'α-tocopherol equivalents (α-TE)');
  addTable(rows, 'Vitamin K', VIT_K_AI, 'µg', 'AI', 'Phylloquinone');
  addTable(rows, 'Pantothenic Acid', PANTO_AI, 'mg', 'AI');
  addTable(rows, 'Biotin', BIOTIN_AI, 'µg', 'AI');
  addTable(rows, 'Vitamin B12', B12_AI, 'µg', 'AI');
  addTable(rows, 'Choline', CHOLINE_AI, 'mg', 'AI');

  // RI for minerals
  addTable(rows, 'Calcium', CALCIUM_RI, 'mg', 'RDA');
  addTable(rows, 'Iron', IRON_RI, 'mg', 'RDA', 'Female 51-70 y RI assumes post-menopause; menstruating females 51-70 use 15 mg/d');
  addTable(rows, 'Zinc', ZINC_RI, 'mg', 'RDA', 'Assumes phytate intake ~600 mg/d (semi-refined mixed diet)');
  addTable(rows, 'Copper', COPPER_RI, 'µg', 'RDA');

  // AI for minerals
  addTable(rows, 'Phosphorus', PHOSPHORUS_AI, 'mg', 'AI');
  addTable(rows, 'Potassium', POTASSIUM_AI, 'mg', 'AI');
  addTable(rows, 'Magnesium', MAGNESIUM_AI, 'mg', 'AI');
  addTable(rows, 'Iodine', IODINE_AI, 'µg', 'AI');
  addTable(rows, 'Selenium', SELENIUM_AI, 'µg', 'AI');
  addTable(rows, 'Fluoride', FLUORIDE_AI, 'mg', 'AI');
  addTable(rows, 'Manganese', MANGANESE_AI, 'mg', 'AI');
  addTable(rows, 'Molybdenum', MOLYBDENUM_AI, 'µg', 'AI');

  // Sodium (CDRR + AI)
  addTable(rows, 'Sodium', SODIUM_CDRR_MG, 'mg', 'CDRR', 'Chronic disease risk reduction intake — aim to stay at/below');
  addTable(rows, 'Sodium', SODIUM_AI_MG, 'mg', 'AI', 'Adequate Intake (health-based); CDRR is the stay-below target');

  // Thiamin and Niacin — derived from mg/MJ × energy (low-active PAL 1.4)
  for (const range of AGE_RANGES) {
    const mj = REF_ENERGY_MJ[range.key];
    if (!mj) continue;
    const sexes: Sex[] = range.sex === 'BOTH' ? ['MALE', 'FEMALE'] : [range.sex];
    for (const sex of sexes) {
      rows.push({
        compoundName: 'Thiamin',
        ageMinMonths: range.minMonths,
        ageMaxMonths: range.maxMonths,
        sex,
        lifeStage: range.lifeStage,
        valueType: 'RDA',
        value: round2(THIAMIN_RI_MG_PER_MJ * mj),
        unit: 'mg',
        isProvisional: false,
        valueNote: `Derived from NNR 0.1 mg/MJ × reference energy ${mj} MJ/d (PAL 1.4)`,
      });
      rows.push({
        compoundName: 'Niacin',
        ageMinMonths: range.minMonths,
        ageMaxMonths: range.maxMonths,
        sex,
        lifeStage: range.lifeStage,
        valueType: 'RDA',
        value: round2(NIACIN_RI_NE_PER_MJ * mj),
        unit: 'mg',
        isProvisional: false,
        valueNote: `NE (niacin equivalents); derived from 1.6 NE/MJ × ${mj} MJ/d`,
      });
    }
  }

  // Protein — Table 11 g/kg × reference weight
  const PROTEIN_AR_G_PER_KG: NutrientTable = {
    INFANT_7_11: 1.04, CHILD_1_3: 0.82, CHILD_4_6: 0.70, CHILD_7_10: 0.75,
    F_11_14: 0.72, F_15_17: 0.68, F_18_24: 0.66, F_25_50: 0.66, F_51_70: 0.66, F_70P: 0.66,
    M_11_14: 0.74, M_15_17: 0.71, M_18_24: 0.66, M_25_50: 0.66, M_51_70: 0.66, M_70P: 0.66,
  };
  const PROTEIN_RI_G_PER_KG: NutrientTable = {
    INFANT_7_11: 1.23, CHILD_1_3: 1.05, CHILD_4_6: 0.86, CHILD_7_10: 0.91,
    F_11_14: 0.88, F_15_17: 0.84, F_18_24: 0.83, F_25_50: 0.83, F_51_70: 0.83, F_70P: 0.83,
    M_11_14: 0.90, M_15_17: 0.87, M_18_24: 0.83, M_25_50: 0.83, M_51_70: 0.83, M_70P: 0.83,
  };
  for (const range of AGE_RANGES) {
    const wt = REF_WEIGHT_KG[range.key];
    if (!wt) continue;
    const ar = PROTEIN_AR_G_PER_KG[range.key];
    const ri = PROTEIN_RI_G_PER_KG[range.key];
    const sexes: Sex[] = range.sex === 'BOTH' ? ['MALE', 'FEMALE'] : [range.sex];
    for (const sex of sexes) {
      if (ar !== null && ar !== undefined) {
        rows.push({
          compoundName: 'Protein', ageMinMonths: range.minMonths, ageMaxMonths: range.maxMonths,
          sex, lifeStage: range.lifeStage, valueType: 'EAR',
          value: round2(ar * wt), unit: 'g', isProvisional: false,
          valueNote: `Derived from ${ar} g/kg × ${wt} kg reference weight`,
        });
      }
      if (ri !== null && ri !== undefined) {
        rows.push({
          compoundName: 'Protein', ageMinMonths: range.minMonths, ageMaxMonths: range.maxMonths,
          sex, lifeStage: range.lifeStage, valueType: 'RDA',
          value: round2(ri * wt), unit: 'g', isProvisional: false,
          valueNote: `Derived from ${ri} g/kg × ${wt} kg reference weight`,
        });
      }
    }
  }
  // Pregnancy/lactation protein add-ons (from Table 11 footnotes)
  const PREG_ADD_G_D: Record<string, { ar: number; ri: number }> = {
    PREG_T1: { ar: 0.5, ri: 1 },
    PREG_T2: { ar: 7.2, ri: 9 },
    PREG_T3: { ar: 23, ri: 28 },
    LACT:    { ar: 10, ri: 13 },
  };
  // Base protein for fertile female avg (use 25-50y: 64.1 kg)
  const baseArG = 0.66 * 64.1;
  const baseRiG = 0.83 * 64.1;
  for (const [key, adds] of Object.entries(PREG_ADD_G_D)) {
    const r = AGE_BY_KEY.get(key)!;
    rows.push({
      compoundName: 'Protein', ageMinMonths: r.minMonths, ageMaxMonths: r.maxMonths,
      sex: 'FEMALE', lifeStage: r.lifeStage, valueType: 'EAR',
      value: round2(baseArG + adds.ar), unit: 'g', isProvisional: false,
      valueNote: `Base AR (64.1 kg ref F 25-50 y) + ${adds.ar} g/d ${r.label} supplement`,
    });
    rows.push({
      compoundName: 'Protein', ageMinMonths: r.minMonths, ageMaxMonths: r.maxMonths,
      sex: 'FEMALE', lifeStage: r.lifeStage, valueType: 'RDA',
      value: round2(baseRiG + adds.ri), unit: 'g', isProvisional: false,
      valueNote: `Base RI (64.1 kg ref F 25-50 y) + ${adds.ri} g/d ${r.label} supplement`,
    });
  }

  // Adult AR (EAR) entries from per-nutrient chapters
  const adultKeys = ['F_18_24', 'F_25_50', 'F_51_70', 'F_70P', 'M_18_24', 'M_25_50', 'M_51_70', 'M_70P'];
  const addAdultAR = (
    compoundName: string,
    valueBySex: { FEMALE: number; MALE: number } | number,
    unit: string,
    isProvisional: boolean,
    note?: string,
  ) => {
    for (const key of adultKeys) {
      const r = AGE_BY_KEY.get(key)!;
      const sex = r.sex as Sex;
      const v = typeof valueBySex === 'number' ? valueBySex : valueBySex[sex];
      rows.push({
        compoundName, ageMinMonths: r.minMonths, ageMaxMonths: r.maxMonths,
        sex, lifeStage: 'NONE', valueType: 'EAR',
        value: v, unit, isProvisional, valueNote: note ?? null,
      });
    }
  };

  addAdultAR('Vitamin A', { FEMALE: 540, MALE: 630 }, 'µg', false);
  addAdultAR('Vitamin D', VIT_D_AR_ADULT, 'µg', false);
  addAdultAR('Vitamin E', VIT_E_PROV_AR, 'mg', true);
  addAdultAR('Vitamin K', VIT_K_PROV_AR, 'µg', true);
  addAdultAR('Riboflavin', RIBOFLAVIN_AR_ADULT, 'mg', false);
  addAdultAR('Vitamin B6', B6_AR, 'mg', false);
  addAdultAR('Folate', FOLATE_AR_ADULT, 'µg', false);
  addAdultAR('Vitamin B12', B12_PROV_AR, 'µg', true);
  addAdultAR('Choline', CHOLINE_PROV_AR, 'mg', true);
  addAdultAR('Vitamin C', VIT_C_AR, 'mg', false);
  addAdultAR('Biotin', BIOTIN_PROV_AR, 'µg', true);
  addAdultAR('Pantothenic Acid', PANTO_PROV_AR, 'mg', true);
  addAdultAR('Calcium', CALCIUM_AR_ADULT, 'mg', false);
  addAdultAR('Iron', IRON_AR, 'mg', false);
  addAdultAR('Zinc', ZINC_AR, 'mg', false);
  addAdultAR('Copper', COPPER_AR_ADULT, 'µg', false);
  addAdultAR('Phosphorus', PHOSPHORUS_PROV_AR, 'mg', true);
  addAdultAR('Potassium', POTASSIUM_PROV_AR, 'mg', true);
  addAdultAR('Magnesium', MAGNESIUM_PROV_AR, 'mg', true);
  addAdultAR('Iodine', IODINE_PROV_AR, 'µg', true);
  addAdultAR('Selenium', SELENIUM_PROV_AR, 'µg', true);
  addAdultAR('Manganese', MANGANESE_PROV_AR, 'mg', true);
  addAdultAR('Molybdenum', MOLYBDENUM_PROV_AR, 'µg', true);
  addAdultAR('Fluoride', FLUORIDE_PROV_AR, 'mg', true);

  // ULs (apply to all adults, both sexes)
  for (const ul of ADULT_ULS) {
    for (const key of adultKeys) {
      const r = AGE_BY_KEY.get(key)!;
      rows.push({
        compoundName: ul.compound, ageMinMonths: r.minMonths, ageMaxMonths: r.maxMonths,
        sex: r.sex as Sex, lifeStage: 'NONE', valueType: 'UL',
        value: ul.value, unit: ul.unit, isProvisional: false,
        valueNote: ul.note ?? null,
      });
    }
  }

  return rows;
}

// ═══════════════════════════════════════════════════════════════
// Seed runner
// ═══════════════════════════════════════════════════════════════

async function seed() {
  console.log('🌱 Seeding Nordic Nutrition Recommendations 2023 (full coverage)...\n');

  const [source] = await sql`
    INSERT INTO dv_sources (
      authority_name, region_code, version_year, source_type, url, note, retrieved_date
    ) VALUES (
      ${SOURCE.authorityName}, ${SOURCE.regionCode}, ${SOURCE.versionYear},
      ${SOURCE.sourceType}, ${SOURCE.url}, ${SOURCE.note}, ${SOURCE.retrievedDate}
    )
    ON CONFLICT (region_code, version_year, source_type)
    DO UPDATE SET
      authority_name = EXCLUDED.authority_name,
      url = EXCLUDED.url,
      note = EXCLUDED.note,
      retrieved_date = EXCLUDED.retrieved_date,
      updated_at = NOW()
    RETURNING id
  `;
  console.log(`✓ Source row: ${source.id}\n`);

  const rows = buildAllRows();
  console.log(`Prepared ${rows.length} reference values.\n`);

  const names = [...new Set(rows.map((r) => resolveDbName(r.compoundName)))];
  const compoundRows = await sql`
    SELECT id, name FROM compounds WHERE name = ANY(${names}) AND tier = 'core'
  `;
  const idByName = new Map(compoundRows.map((r: any) => [r.name, r.id]));
  const missing = names.filter((n) => !idByName.has(n));
  if (missing.length > 0) {
    console.log(`⚠️  Compounds not found (rows for these will be skipped): ${missing.join(', ')}\n`);
  }

  let inserted = 0, updated = 0, skipped = 0;

  for (const row of rows) {
    const compoundId = idByName.get(resolveDbName(row.compoundName));
    if (!compoundId) { skipped++; continue; }

    const result = await sql`
      INSERT INTO reference_daily_values (
        compound_id, source_region, source_id,
        age_min_months, age_max_months,
        sex, life_stage, value_type,
        value, unit,
        is_percent_of_energy, is_provisional, value_note
      ) VALUES (
        ${compoundId}, 'NORDIC', ${source.id},
        ${row.ageMinMonths}, ${row.ageMaxMonths},
        ${row.sex}, ${row.lifeStage}, ${row.valueType},
        ${row.value}, ${row.unit},
        false, ${row.isProvisional}, ${row.valueNote}
      )
      ON CONFLICT (compound_id, source_region, age_min_months, age_max_months, sex, life_stage, value_type, activity_level, dietary_context)
      DO UPDATE SET
        value = EXCLUDED.value,
        unit = EXCLUDED.unit,
        source_id = EXCLUDED.source_id,
        is_provisional = EXCLUDED.is_provisional,
        value_note = EXCLUDED.value_note
      RETURNING (xmax = 0) AS inserted
    `;
    if (result[0]?.inserted) inserted++; else updated++;
  }

  console.log('─'.repeat(60));
  console.log(`✅ NNR 2023 seed complete`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Updated:  ${updated}`);
  console.log(`   Skipped:  ${skipped} (compound not found in DB)`);
  console.log('─'.repeat(60));
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => sql.end());
