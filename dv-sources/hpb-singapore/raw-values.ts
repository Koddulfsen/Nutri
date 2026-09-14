/**
 * Singapore HPB Recommended Dietary Allowances
 * Source: https://www.healthhub.sg/well-being-and-lifestyle/food-diet-and-nutrition/recommended_dietary_allowances
 */

export type Sex = 'MALE' | 'FEMALE';
export type ActivityLevel = 'SEDENTARY' | 'MODERATE' | 'ACTIVE';

export interface Demographic {
  key: string;
  minMonths: number;
  maxMonths: number | null;
  sex: Sex | 'BOTH';
  lifeStage: 'NONE' | 'PREGNANT_T2' | 'PREGNANT_T3' | 'PREGNANT' | 'LACTATING_0_6M' | 'LACTATING_7_12M';
  label: string;
}

export const DEMOGRAPHICS: Demographic[] = [
  { key: 'INFANT_3_6',   minMonths: 3,   maxMonths: 5,    sex: 'BOTH', lifeStage: 'NONE', label: '3-<6 mo' },
  { key: 'INFANT_6_9',   minMonths: 6,   maxMonths: 8,    sex: 'BOTH', lifeStage: 'NONE', label: '6-<9 mo' },
  { key: 'INFANT_9_12',  minMonths: 9,   maxMonths: 11,   sex: 'BOTH', lifeStage: 'NONE', label: '9-<12 mo' },
  { key: 'CHILD_1_2',    minMonths: 12,  maxMonths: 23,   sex: 'BOTH', lifeStage: 'NONE', label: '1-<2 y' },
  { key: 'CHILD_2_3',    minMonths: 24,  maxMonths: 35,   sex: 'BOTH', lifeStage: 'NONE', label: '2-<3 y' },
  { key: 'CHILD_3_5',    minMonths: 36,  maxMonths: 59,   sex: 'BOTH', lifeStage: 'NONE', label: '3-<5 y' },
  { key: 'M_5_7',        minMonths: 60,  maxMonths: 83,   sex: 'MALE', lifeStage: 'NONE', label: 'M 5-<7 y' },
  { key: 'M_7_10',       minMonths: 84,  maxMonths: 119,  sex: 'MALE', lifeStage: 'NONE', label: 'M 7-<10 y' },
  { key: 'M_10_12',      minMonths: 120, maxMonths: 143,  sex: 'MALE', lifeStage: 'NONE', label: 'M 10-<12 y' },
  { key: 'M_12_14',      minMonths: 144, maxMonths: 167,  sex: 'MALE', lifeStage: 'NONE', label: 'M 12-<14 y' },
  { key: 'M_14_16',      minMonths: 168, maxMonths: 191,  sex: 'MALE', lifeStage: 'NONE', label: 'M 14-<16 y' },
  { key: 'M_16_18',      minMonths: 192, maxMonths: 215,  sex: 'MALE', lifeStage: 'NONE', label: 'M 16-<18 y' },
  { key: 'M_18_30',      minMonths: 216, maxMonths: 359,  sex: 'MALE', lifeStage: 'NONE', label: 'M 18-<30 y' },
  { key: 'M_30_60',      minMonths: 360, maxMonths: 719,  sex: 'MALE', lifeStage: 'NONE', label: 'M 30-<60 y' },
  { key: 'M_60P',        minMonths: 720, maxMonths: null, sex: 'MALE', lifeStage: 'NONE', label: 'M 60+ y' },
  { key: 'F_5_7',        minMonths: 60,  maxMonths: 83,   sex: 'FEMALE', lifeStage: 'NONE', label: 'F 5-<7 y' },
  { key: 'F_7_10',       minMonths: 84,  maxMonths: 119,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 7-<10 y' },
  { key: 'F_10_12',      minMonths: 120, maxMonths: 143,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 10-<12 y' },
  { key: 'F_12_14',      minMonths: 144, maxMonths: 167,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 12-<14 y' },
  { key: 'F_14_16',      minMonths: 168, maxMonths: 191,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 14-<16 y' },
  { key: 'F_16_18',      minMonths: 192, maxMonths: 215,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 16-<18 y' },
  { key: 'F_18_30',      minMonths: 216, maxMonths: 359,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 18-<30 y' },
  { key: 'F_30_60',      minMonths: 360, maxMonths: 719,  sex: 'FEMALE', lifeStage: 'NONE', label: 'F 30-<60 y' },
  { key: 'F_60P',        minMonths: 720, maxMonths: null, sex: 'FEMALE', lifeStage: 'NONE', label: 'F 60+ y' },
  { key: 'PREG',         minMonths: 216, maxMonths: 719,  sex: 'FEMALE', lifeStage: 'PREGNANT', label: 'Pregnancy' },
  { key: 'LACT_0_6',     minMonths: 216, maxMonths: 719,  sex: 'FEMALE', lifeStage: 'LACTATING_0_6M', label: 'Lactation 0-6 mo' },
  { key: 'LACT_7_12',    minMonths: 216, maxMonths: 719,  sex: 'FEMALE', lifeStage: 'LACTATING_7_12M', label: 'Lactation 7-12 mo' },
];
const DEMO_BY_KEY = Object.fromEntries(DEMOGRAPHICS.map((d) => [d.key, d]));
export function demo(key: string): Demographic {
  const d = DEMO_BY_KEY[key];
  if (!d) throw new Error(`Unknown demo: ${key}`);
  return d;
}

export const DEMO_KEYS = [
  'INFANT_3_6','INFANT_6_9','INFANT_9_12','CHILD_1_2','CHILD_2_3','CHILD_3_5',
  'M_5_7','M_7_10','M_10_12','M_12_14','M_14_16','M_16_18','M_18_30','M_30_60','M_60P',
  'F_5_7','F_7_10','F_10_12','F_12_14','F_14_16','F_16_18','F_18_30','F_30_60','F_60P',
  'PREG','LACT_0_6','LACT_7_12',
] as const;

type NVal = number | null;
function asMap(values: readonly NVal[]): Record<string, NVal> {
  const out: Record<string, NVal> = {};
  DEMO_KEYS.forEach((k, i) => { out[k] = values[i] ?? null; });
  return out;
}

// ═════════════════════════════════════════════════════════════════
// VITAMINS (all RDA)
// ═════════════════════════════════════════════════════════════════

// Iron mg
export const IRON_RDA = asMap([
  7, 7, 7, 7, 7, 7,
  7, 7, 7, 12, 12, 6, 8, 8, 8,
  7, 7, 7, 18, 18, 19, 18, 18, 8,
  27,
  9, 18,
]);

// Vitamin A µg RE
export const VITAMIN_A_RDA = asMap([
  300, 300, 300, 250, 250, 300,
  300, 400, 575, 725, 725, 750, 750, 750, 750,
  300, 400, 575, 725, 725, 750, 750, 750, 750,
  750,
  1200, 1200,
]);

// Vitamin D µg
export const VITAMIN_D_RDA = asMap([
  10.0, 10.0, 10.0, 10.0, 10.0, 10.0,
  10.0, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5,
  10.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5,
  10.0,
  10.0, 10.0,
]);

// Thiamin mg
export const THIAMIN_RDA = asMap([
  0.28, 0.32, 0.38, 0.46, 0.54, 0.62,
  0.74, 0.84, 0.88, 0.96, 1.06, 1.14, 1.18, 1.16, 0.98,
  0.70, 0.72, 0.78, 0.84, 0.86, 0.86, 0.84, 0.86, 0.80,
  0.95,  // Full-activity preg avg: 0.84 + 0.11
  1.04, 1.04, // Lact: 0.84 + 0.2
]);

// Riboflavin mg
export const RIBOFLAVIN_RDA = asMap([
  0.42, 0.49, 0.57, 0.69, 0.81, 0.93,
  1.11, 1.26, 1.32, 1.44, 1.59, 1.71, 1.77, 1.74, 1.47,
  1.05, 1.08, 1.17, 1.26, 1.29, 1.29, 1.26, 1.29, 1.20,
  1.43,  // preg 1.26 + 0.17
  1.56, 1.56,  // lact 1.26 + 0.30
]);

// Niacin mg
export const NIACIN_RDA = asMap([
  4.6, 5.3, 6.3, 7.6, 8.9, 10.2,
  12.2, 13.9, 14.5, 15.8, 17.5, 18.8, 19.5, 19.1, 16.2,
  11.6, 11.9, 12.9, 13.9, 14.2, 14.2, 13.9, 14.2, 13.2,
  15.8,  // preg 13.9 + 1.9
  17.2, 17.2,  // lact 13.9 + 3.3
]);

// Vitamin B6 mg
export const B6_RDA = asMap([
  0.1, 0.3, 0.3, 0.5, 0.5, 0.6,
  1.0, 1.0, 1.0, 1.4, 1.4, 1.4, 1.3, 1.3, 1.7,
  1.0, 1.0, 1.0, 1.2, 1.2, 1.2, 1.3, 1.5, 1.5,
  1.9,
  2.0, 2.0,
]);

// Vitamin B12 µg
export const B12_RDA = asMap([
  0.4, 0.5, 0.5, 0.9, 0.9, 1.1,
  1.8, 1.8, 1.8, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4,
  1.8, 1.8, 1.8, 2.2, 2.2, 2.2, 2.4, 2.4, 2.4,
  2.6,
  2.8, 2.8,
]);

// Folic acid (Folate) µg
export const FOLATE_RDA = asMap([
  65, 80, 80, 150, 150, 200,
  300, 300, 300, 350, 350, 350, 400, 400, 400,
  300, 300, 300, 350, 350, 350, 400, 400, 400,
  600,
  500, 500,
]);

// Vitamin C (Ascorbic acid) mg
export const VITAMIN_C_RDA = asMap([
  35, 45, 45, 35, 35, 50,
  70, 70, 70, 105, 105, 105, 105, 105, 105,
  65, 65, 65, 80, 80, 80, 85, 85, 85,
  100,
  135, 135,
]);

// Calcium mg (separate table with simpler buckets — use closest match)
// Source: 0-6mo: 300-400, 7-<12mo: 400, 1-3: 500, 4-6: 600, 7-9: 700, 10-18: 1000, 19-50: 800, 51+: 1000
export const CALCIUM_RDA = asMap([
  300, 400, 400, 500, 500, 600,
  700, 700, 1000, 1000, 1000, 1000, 800, 800, 1000,  // M 50+: 800 (30-60); 1000 (60+ from 51+)
  700, 700, 1000, 1000, 1000, 1000, 800, 800, 1000,
  1000,
  1000, 1000,
]);
// Note: M_60P (60+) gets 1000 (51+ bucket in source)

// ═════════════════════════════════════════════════════════════════
// ENERGY (kcal/d) at 3 activity levels
// Children 1-5: single value (no activity split)
// Children/Adolescents 6-18: Light / Moderate / Vigorous
// Adults: Low / Moderate / Very Active
// We map: Light/Low → SEDENTARY; Moderate → MODERATE; Vigorous/Very Active → ACTIVE
// ═════════════════════════════════════════════════════════════════

export interface EnergyRow {
  demoKey: string;
  activity: ActivityLevel | null;
  kcal: number;
}

export const ENERGY_ROWS: EnergyRow[] = [
  // Infants 1-5 y — single value (use MODERATE default)
  { demoKey: 'CHILD_1_2', activity: 'MODERATE', kcal: 880 },  // Males age 1 — we map to CHILD_1_2 for M (use 880 mean)
  // Note: HPB children 1-5 are M and F different; use midpoint for unisex 1-2
  // For simplicity we inline the specific age×sex values below with ageMonths representations

  // Adolescents 6-18 at MODERATE (Light and Vigorous not stored for brevity)
  { demoKey: 'M_5_7',   activity: 'MODERATE', kcal: 1550 }, // age 6
  { demoKey: 'M_7_10',  activity: 'MODERATE', kcal: 1700 }, // avg ages 7-9: 1600/1740/1940 → use 1700 midpoint
  { demoKey: 'M_10_12', activity: 'MODERATE', kcal: 2200 }, // ages 10-11
  { demoKey: 'M_12_14', activity: 'MODERATE', kcal: 2630 }, // ages 12-13
  { demoKey: 'M_14_16', activity: 'MODERATE', kcal: 2975 }, // avg 14-15
  { demoKey: 'M_16_18', activity: 'MODERATE', kcal: 3150 }, // avg 16-17
  { demoKey: 'F_5_7',   activity: 'MODERATE', kcal: 1420 },
  { demoKey: 'F_7_10',  activity: 'MODERATE', kcal: 1600 },
  { demoKey: 'F_10_12', activity: 'MODERATE', kcal: 1990 },
  { demoKey: 'F_12_14', activity: 'MODERATE', kcal: 2270 },
  { demoKey: 'F_14_16', activity: 'MODERATE', kcal: 2375 },
  { demoKey: 'F_16_18', activity: 'MODERATE', kcal: 2400 },

  // Adults at 3 activity levels
  { demoKey: 'M_18_30', activity: 'SEDENTARY', kcal: 2280 },
  { demoKey: 'M_18_30', activity: 'MODERATE',  kcal: 2700 },
  { demoKey: 'M_18_30', activity: 'ACTIVE',    kcal: 3720 },
  { demoKey: 'M_30_60', activity: 'SEDENTARY', kcal: 2185 },
  { demoKey: 'M_30_60', activity: 'MODERATE',  kcal: 2590 },
  { demoKey: 'M_30_60', activity: 'ACTIVE',    kcal: 3560 },
  { demoKey: 'M_60P',   activity: 'SEDENTARY', kcal: 1885 },
  { demoKey: 'M_60P',   activity: 'MODERATE',  kcal: 2235 },
  { demoKey: 'M_60P',   activity: 'ACTIVE',    kcal: 3070 },
  { demoKey: 'F_18_30', activity: 'SEDENTARY', kcal: 1745 },
  { demoKey: 'F_18_30', activity: 'MODERATE',  kcal: 2070 },
  { demoKey: 'F_18_30', activity: 'ACTIVE',    kcal: 2840 },
  { demoKey: 'F_30_60', activity: 'SEDENTARY', kcal: 1720 },
  { demoKey: 'F_30_60', activity: 'MODERATE',  kcal: 2035 },
  { demoKey: 'F_30_60', activity: 'ACTIVE',    kcal: 2800 },
  { demoKey: 'F_60P',   activity: 'SEDENTARY', kcal: 1570 },
  { demoKey: 'F_60P',   activity: 'MODERATE',  kcal: 1865 },
  { demoKey: 'F_60P',   activity: 'ACTIVE',    kcal: 2560 },

  // Pregnancy/Lactation (additions to non-preg base): store adjusted
  // Preg T3: F 18-30 moderate 2070 + 480 = 2550
  { demoKey: 'PREG', activity: 'MODERATE', kcal: 2550 },
  // Lact: 2070 + 500 = 2570
  { demoKey: 'LACT_0_6', activity: 'MODERATE', kcal: 2570 },
  { demoKey: 'LACT_7_12', activity: 'MODERATE', kcal: 2570 },
];

// Children 1-5 energy (unisex for children 1-5 per HPB table)
// Age 1: M 880 F 810; Age 2: M 1080 F 1000; Age 3: M 1160 F 1070; Age 4: M 1310 F 1190; Age 5: M 1440 F 1320
// Stored by age bucket midpoint:
// CHILD_1_2 (1-2 y): avg of age 1+2 = M (880+1080)/2=980, F (810+1000)/2=905
// CHILD_2_3 (2-3 y): avg of 2+3 = M 1120, F 1035
// CHILD_3_5 (3-5 y): avg of 3,4,5 = M 1303, F 1193

export const ENERGY_CHILDREN = [
  { demoKey: 'CHILD_1_2', sexM: 980,  sexF: 905  },
  { demoKey: 'CHILD_2_3', sexM: 1120, sexF: 1035 },
  { demoKey: 'CHILD_3_5', sexM: 1303, sexF: 1193 },
];
