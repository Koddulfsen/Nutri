/**
 * EFSA DRV raw values — extracted verbatim from drv-summary-tables.pdf (Sept 2017, v4).
 *
 * EFSA's age buckets VARY per compound — there is no unified demographic table
 * like NIH/NNR/ICMR. Each compound has its own age ranges. We store rows as-is.
 *
 * Value type mapping:
 *   PRI (Population Reference Intake) → RDA
 *   AR  (Average Requirement)         → EAR
 *   AI  (Adequate Intake)             → AI
 *   RI  (Reference Intake range)      → AMDR (for macros, % of energy)
 */

export type Sex = 'MALE' | 'FEMALE';
export type LifeStage = 'NONE' | 'PREGNANT' | 'PREGNANT_T1' | 'PREGNANT_T2' | 'PREGNANT_T3' | 'LACTATING' | 'LACTATING_0_6M' | 'LACTATING_7_12M';
export type DietaryContext = 'PHYTATE_LOW' | 'PHYTATE_MED_LOW' | 'PHYTATE_MED_HIGH' | 'PHYTATE_HIGH' | null;
export type Activity = 'SEDENTARY' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE' | null;
export type ValueType = 'RDA' | 'AI' | 'EAR' | 'EER' | 'AMDR' | 'UL';

export interface RawRow {
  compound: string;
  ageMinMonths: number;
  ageMaxMonths: number | null;
  sex: Sex | 'BOTH';
  lifeStage: LifeStage;
  activityLevel?: Activity;
  dietaryContext?: DietaryContext;
  valueType: ValueType;
  value: number;
  valueMin?: number;
  valueMax?: number;
  unit: string;
  isPercentOfEnergy?: boolean;
  valueNote?: string;
}

// Helper: year → months range
const y = (min: number, max: number | null): [number, number | null] =>
  [min * 12, max == null ? null : max * 12 + 11];

// ═══════════════════════════════════════════════════════════════
// Table 1 — Energy AR (MJ/d). Convert to kcal (1 MJ = 239 kcal).
// Structure: age × sex × PAL. PAL 1.4=sedentary, 1.6=moderate, 1.8=active, 2.0=very active.
// ═══════════════════════════════════════════════════════════════

const MJ_TO_KCAL = 239;

interface EnergyCell { M: number | null; F: number | null; }
interface EnergyRow { ageMin: number; ageMax: number | null; pal14: EnergyCell; pal16?: EnergyCell; pal18?: EnergyCell; pal20?: EnergyCell; }

// Format: [min_months, max_months, PAL 1.4 M, 1.4 F, 1.6 M, 1.6 F, 1.8 M, 1.8 F, 2.0 M, 2.0 F]
// null = not published. Infants have only 1 PAL (resting) — actually EFSA uses single value for them.
const ENERGY_ROWS: Array<[number, number | null, ...Array<number | null>]> = [
  // Infants 7-11 mo — single value (not PAL-varied)
  [7,   7,   2.7, 2.4, null, null, null, null, null, null],
  [8,   8,   2.8, 2.5, null, null, null, null, null, null],
  [9,   9,   2.9, 2.6, null, null, null, null, null, null],
  [10,  10,  3.0, 2.7, null, null, null, null, null, null],
  [11,  11,  3.1, 2.8, null, null, null, null, null, null],
  // 1-3 y — PAL 1.4 only
  [12,  23,  3.3, 3.0, null, null, null, null, null, null],
  [24,  35,  4.3, 4.0, null, null, null, null, null, null],
  [36,  47,  4.9, 4.6, null, null, null, null, null, null],
  // 4-17 y — increasing PALs
  [48,  59,  5.3, 4.9, 6.0, 5.6, 6.8, 6.3, null, null],
  [60,  71,  5.6, 5.2, 6.4, 5.9, 7.2, 6.7, null, null],
  [72,  83,  5.9, 5.5, 6.7, 6.3, 7.6, 7.1, null, null],
  [84,  95,  6.3, 5.8, 7.2, 6.7, 8.1, 7.5, null, null],
  [96,  107, 6.7, 6.2, 7.6, 7.1, 8.6, 7.9, null, null],
  [108, 119, 7.0, 6.6, 8.1, 7.5, 9.1, 8.4, null, null],
  [120, 131, null, null, 8.1, 7.6, 9.1, 8.6, 10.1, 9.5],
  [132, 143, null, null, 8.5, 8.0, 9.6, 9.0, 10.7, 10.0],
  [144, 155, null, null, 9.1, 8.4, 10.2, 9.4, 11.4, 10.5],
  [156, 167, null, null, 9.8, 8.8, 11.0, 9.9, 12.2, 11.0],
  [168, 179, null, null, 10.5, 9.1, 11.8, 10.2, 13.1, 11.4],
  [180, 191, null, null, 11.3, 9.3, 12.7, 10.5, 14.1, 11.7],
  [192, 203, null, null, 11.9, 9.5, 13.4, 10.6, 14.9, 11.8],
  [204, 215, null, null, 12.3, 9.5, 13.8, 10.7, 15.4, 11.9],
  // Adults — all 4 PALs
  [216, 359, 9.8,  7.9, 11.2, 9.0,  12.6, 10.1, 14.0, 11.2],
  [360, 479, 9.5,  7.6, 10.8, 8.7,  12.2, 9.8,  13.5, 10.8],
  [480, 599, 9.3,  7.5, 10.7, 8.6,  12.0, 9.7,  13.4, 10.7],
  [600, 719, 9.2,  7.5, 10.5, 8.5,  11.9, 9.6,  13.2, 10.7],
  [720, 839, 8.4,  6.8, 9.6,  7.8,  10.9, 8.8,  12.1, 9.7],
  [840, 959, 8.3,  6.8, 9.5,  7.7,  10.7, 8.7,  11.9, 9.6],
];

// EFSA pregnancy additions (MJ/d) applied to adult female base (PAL 1.6)
const PREG_ENERGY_ADD = { T1: 0.29, T2: 1.1, T3: 2.1 };
// Lactation addition (0-6 mo postpartum)
const LACT_ENERGY_ADD_06 = 2.1;

// ═══════════════════════════════════════════════════════════════
// Table 2 — Protein AR + PRI (g/kg bw/day). Use EFSA ref body weights.
// Reference weights from EFSA 2013 (rounded). Ages pre-11y unisex.
// ═══════════════════════════════════════════════════════════════

// EFSA reference body weights (kg) — used to compute g/d from g/kg bw
const REF_BW: Record<string, { M: number; F: number }> = {
  '0.5y':  { M: 7.8,  F: 7.2 },   // ~7-12mo
  '1y':    { M: 11.0, F: 10.5 },
  '1.5y':  { M: 11.5, F: 11.0 },
  '2y':    { M: 12.5, F: 12.0 },
  '3y':    { M: 14.5, F: 14.0 },
  '4y':    { M: 16.5, F: 16.0 },
  '5y':    { M: 18.5, F: 18.5 },
  '6y':    { M: 21,   F: 20.5 },
  '7y':    { M: 23,   F: 23 },
  '8y':    { M: 26,   F: 26 },
  '9y':    { M: 29,   F: 29 },
  '10y':   { M: 32,   F: 33 },
  '11y':   { M: 36,   F: 37.5 },
  '12y':   { M: 40.5, F: 42 },
  '13y':   { M: 46,   F: 47 },
  '14y':   { M: 52.5, F: 51 },
  '15y':   { M: 59,   F: 54.5 },
  '16y':   { M: 64,   F: 56.5 },
  '17y':   { M: 67,   F: 57.5 },
  'adult': { M: 68.1, F: 58.5 },  // EFSA reference
};

// Protein AR / PRI in g/kg bw per day
// Columns: AR, PRI (M or unisex) then F if different
const PROTEIN_G_PER_KG: Array<{ age: string; ageMin: number; ageMax: number | null; ar_M: number; ar_F?: number; pri_M: number; pri_F?: number }> = [
  { age: '0.5y',  ageMin: 6,   ageMax: 11,  ar_M: 1.12, pri_M: 1.31 },
  { age: '1y',    ageMin: 12,  ageMax: 17,  ar_M: 0.95, pri_M: 1.14 },
  { age: '1.5y',  ageMin: 18,  ageMax: 23,  ar_M: 0.85, pri_M: 1.03 },
  { age: '2y',    ageMin: 24,  ageMax: 35,  ar_M: 0.79, pri_M: 0.97 },
  { age: '3y',    ageMin: 36,  ageMax: 47,  ar_M: 0.73, pri_M: 0.90 },
  { age: '4y',    ageMin: 48,  ageMax: 59,  ar_M: 0.69, pri_M: 0.86 },
  { age: '5y',    ageMin: 60,  ageMax: 71,  ar_M: 0.69, pri_M: 0.85 },
  { age: '6y',    ageMin: 72,  ageMax: 83,  ar_M: 0.72, pri_M: 0.89 },
  { age: '7y',    ageMin: 84,  ageMax: 95,  ar_M: 0.74, pri_M: 0.91 },
  { age: '8y',    ageMin: 96,  ageMax: 107, ar_M: 0.75, pri_M: 0.92 },
  { age: '9y',    ageMin: 108, ageMax: 119, ar_M: 0.75, pri_M: 0.92 },
  { age: '10y',   ageMin: 120, ageMax: 131, ar_M: 0.75, pri_M: 0.91 },
  { age: '11y',   ageMin: 132, ageMax: 143, ar_M: 0.75, ar_F: 0.73, pri_M: 0.91, pri_F: 0.90 },
  { age: '12y',   ageMin: 144, ageMax: 155, ar_M: 0.74, ar_F: 0.72, pri_M: 0.90, pri_F: 0.89 },
  { age: '13y',   ageMin: 156, ageMax: 167, ar_M: 0.73, ar_F: 0.71, pri_M: 0.90, pri_F: 0.88 },
  { age: '14y',   ageMin: 168, ageMax: 179, ar_M: 0.72, ar_F: 0.70, pri_M: 0.89, pri_F: 0.87 },
  { age: '15y',   ageMin: 180, ageMax: 191, ar_M: 0.72, ar_F: 0.69, pri_M: 0.88, pri_F: 0.85 },
  { age: '16y',   ageMin: 192, ageMax: 203, ar_M: 0.71, ar_F: 0.68, pri_M: 0.87, pri_F: 0.84 },
  { age: '17y',   ageMin: 204, ageMax: 215, ar_M: 0.70, ar_F: 0.67, pri_M: 0.86, pri_F: 0.83 },
  { age: 'adult', ageMin: 216, ageMax: 719, ar_M: 0.66, ar_F: 0.66, pri_M: 0.83, pri_F: 0.83 }, // 18-59
  { age: 'senior', ageMin: 720, ageMax: null, ar_M: 0.66, ar_F: 0.66, pri_M: 0.83, pri_F: 0.83 }, // ≥60 (same as adult)
];

const BW_ADULT = REF_BW.adult;
// Pregnancy/Lactation protein additions (g/d)
const PROTEIN_PREG_ADD = { T1: { ar: 0.52, pri: 1 }, T2: { ar: 7.2, pri: 9 }, T3: { ar: 23, pri: 28 } };
const PROTEIN_LACT_ADD = { '0_6M': { ar: 15, pri: 19 }, '>6M': { ar: 10, pri: 13 } };

// ═══════════════════════════════════════════════════════════════
// Table 3 — Macros RI ranges + Water AI
// ═══════════════════════════════════════════════════════════════

// Format: age-range, RI ranges for fat, LA, ALA, EPA+DHA, DHA, carbs (%E); fiber (g/d); water (L/d)
// ALAP ("as low as possible") = store as range 0-10% for SFA + TFA capping at 10
interface MacroSpec { ageMin: number; ageMax: number | null; fat_pct?: [number, number]; LA_pct?: number; ALA_pct?: number; epaDha_mg?: number | [number, number]; dha_mg?: number; carbs_pct?: [number, number]; fiber_g?: number; waterM_L?: number; waterF_L?: number; pregAdd_EPA_DHA?: [number, number]; lactWater?: number; }

const MACROS: MacroSpec[] = [
  { ageMin: 6,   ageMax: 11,  fat_pct: [40, 40], LA_pct: 4, ALA_pct: 0.5, dha_mg: 100, waterM_L: 0.9, waterF_L: 0.9 }, // 6-12mo water 0.8-1.0
  { ageMin: 12,  ageMax: 23,  fat_pct: [35, 40], LA_pct: 4, ALA_pct: 0.5, dha_mg: 100, carbs_pct: [45, 60], fiber_g: 10, waterM_L: 1.1, waterF_L: 1.1 },
  { ageMin: 24,  ageMax: 35,  fat_pct: [35, 40], LA_pct: 4, ALA_pct: 0.5, epaDha_mg: 250, carbs_pct: [45, 60], fiber_g: 10, waterM_L: 1.3, waterF_L: 1.3 },
  { ageMin: 36,  ageMax: 47,  fat_pct: [20, 35], LA_pct: 4, ALA_pct: 0.5, epaDha_mg: 250, carbs_pct: [45, 60], fiber_g: 10 },
  { ageMin: 48,  ageMax: 107, fat_pct: [20, 35], LA_pct: 4, ALA_pct: 0.5, epaDha_mg: 250, carbs_pct: [45, 60], fiber_g: 14, waterM_L: 1.6, waterF_L: 1.6 },
  { ageMin: 84,  ageMax: 119, fiber_g: 16, carbs_pct: [45, 60] }, // 7-10y fiber
  { ageMin: 108, ageMax: 155, waterM_L: 2.1, waterF_L: 1.9 }, // 9-13y water
  { ageMin: 132, ageMax: 167, fiber_g: 19, carbs_pct: [45, 60] }, // 11-14y fiber
  { ageMin: 168, ageMax: 215, fiber_g: 21, carbs_pct: [45, 60], waterM_L: 2.5, waterF_L: 2.0 }, // 15-17y
  { ageMin: 216, ageMax: null, fat_pct: [20, 35], LA_pct: 4, ALA_pct: 0.5, epaDha_mg: 250, carbs_pct: [45, 60], fiber_g: 25, waterM_L: 2.5, waterF_L: 2.0 },
];

// ═══════════════════════════════════════════════════════════════
// Vitamin AR (Tables 8 Males, 10 Females)
// Columns: Folate µg/d, Niacin mg NE/MJ, Riboflavin mg/d, Thiamin mg/MJ,
//          Vit A µg RE/d, Vit B6 mg/d, Vit C mg/d
// NE/MJ and mg/MJ need conversion — done at seed time using PAL 1.4 ref energy.
// ═══════════════════════════════════════════════════════════════

interface VitARRow { ageMin: number; ageMax: number | null; folate: number | null; niacinRatio: number; riboflavin: number | null; thiaminRatio: number; vitA: number; vitB6: number | null; vitC: number | null; }

const VIT_AR_MALE: VitARRow[] = [
  { ageMin: 7, ageMax: 11,  folate: null, niacinRatio: 1.3, riboflavin: null, thiaminRatio: 0.072, vitA: 190, vitB6: null, vitC: null },
  { ageMin: 12, ageMax: 35, folate: 90,   niacinRatio: 1.3, riboflavin: 0.5,  thiaminRatio: 0.072, vitA: 205, vitB6: 0.5,  vitC: 15 },
  { ageMin: 48, ageMax: 71, folate: 110,  niacinRatio: 1.3, riboflavin: 0.6,  thiaminRatio: 0.072, vitA: 245, vitB6: 0.6,  vitC: 25 },
  { ageMin: 84, ageMax: 119,folate: 160,  niacinRatio: 1.3, riboflavin: 0.8,  thiaminRatio: 0.072, vitA: 320, vitB6: 0.9,  vitC: 40 },
  { ageMin: 132, ageMax: 167,folate: 210, niacinRatio: 1.3, riboflavin: 1.1,  thiaminRatio: 0.072, vitA: 480, vitB6: 1.2,  vitC: 60 },
  { ageMin: 180, ageMax: 215,folate: 250, niacinRatio: 1.3, riboflavin: 1.4,  thiaminRatio: 0.072, vitA: 580, vitB6: 1.5,  vitC: 85 },
  { ageMin: 216, ageMax: null,folate: 250,niacinRatio: 1.3, riboflavin: 1.3,  thiaminRatio: 0.072, vitA: 570, vitB6: 1.5,  vitC: 90 },
];

const VIT_AR_FEMALE: VitARRow[] = [
  { ageMin: 7, ageMax: 11,  folate: null, niacinRatio: 1.3, riboflavin: null, thiaminRatio: 0.072, vitA: 190, vitB6: null, vitC: null },
  { ageMin: 12, ageMax: 35, folate: 90,   niacinRatio: 1.3, riboflavin: 0.5,  thiaminRatio: 0.072, vitA: 205, vitB6: 0.5,  vitC: 15 },
  { ageMin: 48, ageMax: 71, folate: 110,  niacinRatio: 1.3, riboflavin: 0.6,  thiaminRatio: 0.072, vitA: 245, vitB6: 0.6,  vitC: 25 },
  { ageMin: 84, ageMax: 119,folate: 160,  niacinRatio: 1.3, riboflavin: 0.8,  thiaminRatio: 0.072, vitA: 320, vitB6: 0.9,  vitC: 40 },
  { ageMin: 132, ageMax: 167,folate: 210, niacinRatio: 1.3, riboflavin: 1.1,  thiaminRatio: 0.072, vitA: 480, vitB6: 1.2,  vitC: 60 },
  { ageMin: 180, ageMax: 215,folate: 250, niacinRatio: 1.3, riboflavin: 1.4,  thiaminRatio: 0.072, vitA: 490, vitB6: 1.3,  vitC: 75 },
  { ageMin: 216, ageMax: null,folate: 250,niacinRatio: 1.3, riboflavin: 1.3,  thiaminRatio: 0.072, vitA: 490, vitB6: 1.3,  vitC: 80 },
];

// Pregnancy/Lactation AR (F only, Table 10)
const VIT_AR_FEMALE_PREG = { folate: null, niacinRatio: 1.3, riboflavin: 1.5, thiaminRatio: 0.072, vitA: 540, vitB6: 1.5, vitC: null };
const VIT_AR_FEMALE_LACT = { folate: 380, niacinRatio: 1.3, riboflavin: 1.7, thiaminRatio: 0.072, vitA: 1020, vitB6: 1.4, vitC: 145 };

// ═══════════════════════════════════════════════════════════════
// Vitamin PRI/AI (Tables 9 Males, 11 Females)
// ═══════════════════════════════════════════════════════════════

// α-Tocopherol (Vit E): sex-specific from 10/11 years
// Ages split differently for E vs others — E uses 1-2, 3-9, 10-17, ≥18 unisex
// Others use 1-3, 4-6, 7-10, 11-14, 15-17, ≥18

// Common PRI/AI columns: biotin, choline, cobalamin, folate, niacin, pantothenic, riboflavin, thiamin, vitA, vitB6, vitC, vitD, vitK
interface VitPRIRow {
  ageMin: number; ageMax: number | null;
  biotin: number; choline: number; cobalamin: number;
  folate: number | null; niacinRatio: number; pantothenic: number;
  riboflavin: number; thiaminRatio: number;
  vitA: number; vitB6: number; vitC: number; vitD: number; vitK: number;
}

const VIT_PRI_MALE: VitPRIRow[] = [
  { ageMin: 7,   ageMax: 11,  biotin: 6,  choline: 160, cobalamin: 1.5, folate: 80,  niacinRatio: 1.6, pantothenic: 3, riboflavin: 0.4, thiaminRatio: 0.1, vitA: 250, vitB6: 0.3, vitC: 20,  vitD: 10, vitK: 10 },
  { ageMin: 12,  ageMax: 35,  biotin: 20, choline: 140, cobalamin: 1.5, folate: 120, niacinRatio: 1.6, pantothenic: 4, riboflavin: 0.6, thiaminRatio: 0.1, vitA: 250, vitB6: 0.6, vitC: 20,  vitD: 15, vitK: 12 },
  { ageMin: 48,  ageMax: 71,  biotin: 25, choline: 170, cobalamin: 1.5, folate: 140, niacinRatio: 1.6, pantothenic: 4, riboflavin: 0.7, thiaminRatio: 0.1, vitA: 300, vitB6: 0.7, vitC: 30,  vitD: 15, vitK: 20 },
  { ageMin: 84,  ageMax: 119, biotin: 25, choline: 250, cobalamin: 2.5, folate: 200, niacinRatio: 1.6, pantothenic: 4, riboflavin: 1.0, thiaminRatio: 0.1, vitA: 400, vitB6: 1.0, vitC: 45,  vitD: 15, vitK: 30 },
  { ageMin: 132, ageMax: 167, biotin: 35, choline: 340, cobalamin: 3.5, folate: 270, niacinRatio: 1.6, pantothenic: 5, riboflavin: 1.4, thiaminRatio: 0.1, vitA: 600, vitB6: 1.4, vitC: 70,  vitD: 15, vitK: 45 },
  { ageMin: 180, ageMax: 215, biotin: 35, choline: 400, cobalamin: 4.0, folate: 330, niacinRatio: 1.6, pantothenic: 5, riboflavin: 1.6, thiaminRatio: 0.1, vitA: 750, vitB6: 1.7, vitC: 100, vitD: 15, vitK: 65 },
  { ageMin: 216, ageMax: null,biotin: 40, choline: 400, cobalamin: 4.0, folate: 330, niacinRatio: 1.6, pantothenic: 5, riboflavin: 1.6, thiaminRatio: 0.1, vitA: 750, vitB6: 1.7, vitC: 110, vitD: 15, vitK: 70 },
];

const VIT_PRI_FEMALE: VitPRIRow[] = [
  { ageMin: 7,   ageMax: 11,  biotin: 6,  choline: 160, cobalamin: 1.5, folate: 80,  niacinRatio: 1.6, pantothenic: 3, riboflavin: 0.4, thiaminRatio: 0.1, vitA: 250, vitB6: 0.3, vitC: 20,  vitD: 10, vitK: 10 },
  { ageMin: 12,  ageMax: 35,  biotin: 20, choline: 140, cobalamin: 1.5, folate: 120, niacinRatio: 1.6, pantothenic: 4, riboflavin: 0.6, thiaminRatio: 0.1, vitA: 250, vitB6: 0.6, vitC: 20,  vitD: 15, vitK: 12 },
  { ageMin: 48,  ageMax: 71,  biotin: 25, choline: 170, cobalamin: 1.5, folate: 140, niacinRatio: 1.6, pantothenic: 4, riboflavin: 0.7, thiaminRatio: 0.1, vitA: 300, vitB6: 0.7, vitC: 30,  vitD: 15, vitK: 20 },
  { ageMin: 84,  ageMax: 119, biotin: 25, choline: 250, cobalamin: 2.5, folate: 200, niacinRatio: 1.6, pantothenic: 4, riboflavin: 1.0, thiaminRatio: 0.1, vitA: 400, vitB6: 1.0, vitC: 45,  vitD: 15, vitK: 30 },
  { ageMin: 132, ageMax: 167, biotin: 35, choline: 340, cobalamin: 3.5, folate: 270, niacinRatio: 1.6, pantothenic: 5, riboflavin: 1.4, thiaminRatio: 0.1, vitA: 600, vitB6: 1.4, vitC: 70,  vitD: 15, vitK: 45 },
  { ageMin: 180, ageMax: 215, biotin: 35, choline: 400, cobalamin: 4.0, folate: 330, niacinRatio: 1.6, pantothenic: 5, riboflavin: 1.6, thiaminRatio: 0.1, vitA: 650, vitB6: 1.6, vitC: 90,  vitD: 15, vitK: 65 },
  { ageMin: 216, ageMax: null,biotin: 40, choline: 400, cobalamin: 4.0, folate: 330, niacinRatio: 1.6, pantothenic: 5, riboflavin: 1.6, thiaminRatio: 0.1, vitA: 650, vitB6: 1.6, vitC: 95,  vitD: 15, vitK: 70 },
];

// α-Tocopherol unisex 1-9, sex-split 10+
// Stored separately (different age buckets)
const VIT_E_ALPHA_TOCOPHEROL: Array<{ ageMin: number; ageMax: number | null; M: number; F: number }> = [
  { ageMin: 7,   ageMax: 11,  M: 5,  F: 5 },
  { ageMin: 12,  ageMax: 35,  M: 6,  F: 6 },
  { ageMin: 36,  ageMax: 119, M: 9,  F: 9 },
  { ageMin: 120, ageMax: 215, M: 13, F: 11 },
  { ageMin: 216, ageMax: null,M: 13, F: 11 },
];

// Pregnancy/Lactation PRI/AI values (F, from Table 11 pregnancy/lactation rows)
const VIT_PRI_PREG = { biotin: 40, choline: 480, cobalamin: 4.5, folate: 600, niacinRatio: 1.6, pantothenic: 5, riboflavin: 1.9, thiaminRatio: 0.1, vitA: 700, vitB6: 1.8, vitC: 105, vitD: 15, vitK: 70, alphaTocopherol: 11 };
const VIT_PRI_LACT = { biotin: 45, choline: 520, cobalamin: 5.0, folate: 500, niacinRatio: 1.6, pantothenic: 7, riboflavin: 2.0, thiaminRatio: 0.1, vitA: 1300, vitB6: 1.7, vitC: 155, vitD: 15, vitK: 70, alphaTocopherol: 11 };

// ═══════════════════════════════════════════════════════════════
// Mineral AR (Tables 4 Males, 6 Females)
// Only Ca, Fe, Zn have ARs. Others only have PRI/AI.
// Age buckets VARY per mineral.
// ═══════════════════════════════════════════════════════════════

interface CalciumAR { ageMin: number; ageMax: number | null; M: number | null; F: number | null; }

const CA_AR: CalciumAR[] = [
  { ageMin: 12,  ageMax: 47,  M: 390,  F: 390 },
  { ageMin: 48,  ageMax: 131, M: 680,  F: 680 },
  { ageMin: 132, ageMax: 215, M: 960,  F: 960 },
  { ageMin: 216, ageMax: 299, M: 860,  F: 860 },  // 18-24
  { ageMin: 300, ageMax: null,M: 750,  F: 750 },   // ≥25
];

interface IronAR { ageMin: number; ageMax: number | null; M: number; F: number | null; F_premenopausal?: number; F_postmenopausal?: number; }

const FE_AR: IronAR[] = [
  { ageMin: 7,   ageMax: 11,  M: 8, F: 8 },
  { ageMin: 12,  ageMax: 83,  M: 5, F: 5 },      // 1-6y
  { ageMin: 84,  ageMax: 131, M: 8, F: 8 },      // 7-11y (note: table shows 7-11, slight age ambiguity)
  { ageMin: 132, ageMax: 215, M: 8, F: 8 },      // 12-17y (ambiguous - could be split)
  // Adults ≥18: M = 6, F premenopausal = 7, F postmenopausal = 6
  { ageMin: 216, ageMax: 611, M: 6, F: 7, F_premenopausal: 7 },   // 18-50 F premenopausal
  { ageMin: 612, ageMax: null,M: 6, F: 6, F_postmenopausal: 6 },  // 51+ F postmenopausal
];

// Zinc AR with LPI tiers (4 phytate levels). Male and female values.
// For 7-11mo through 17y: single value (no LPI tiers shown in Table)
// Adults ≥18 (Tables 4 M / 6 F): LPI 300/600/900/1200 → different Zn values
interface ZnAR { ageMin: number; ageMax: number | null; single_M?: number; single_F?: number; lpi?: { l300: { M: number; F: number }; l600: { M: number; F: number }; l900: { M: number; F: number }; l1200: { M: number; F: number } }; }

const ZN_AR: ZnAR[] = [
  { ageMin: 7,   ageMax: 11,  single_M: 2.4, single_F: 2.4 },
  { ageMin: 12,  ageMax: 35,  single_M: 3.6, single_F: 3.6 },
  { ageMin: 48,  ageMax: 71,  single_M: 4.6, single_F: 4.6 },
  { ageMin: 84,  ageMax: 119, single_M: 6.2, single_F: 6.2 },
  { ageMin: 132, ageMax: 167, single_M: 8.9, single_F: 8.9 },
  { ageMin: 168, ageMax: 215, single_M: 11.8, single_F: 9.9 }, // 12-17 M / 15-17 F split
  { ageMin: 216, ageMax: null, lpi: {
      l300:  { M: 7.5,  F: 6.2 },
      l600:  { M: 9.3,  F: 7.6 },
      l900:  { M: 11.0, F: 8.9 },
      l1200: { M: 12.7, F: 10.2 },
  }},
];

// ═══════════════════════════════════════════════════════════════
// Mineral PRI/AI (Tables 5 Males, 7 Females)
// ═══════════════════════════════════════════════════════════════

// Calcium PRI: same age bands as AR, both sexes identical
const CA_PRI: Array<{ ageMin: number; ageMax: number | null; value: number }> = [
  { ageMin: 7,   ageMax: 11,  value: 280 },
  { ageMin: 12,  ageMax: 47,  value: 450 },
  { ageMin: 48,  ageMax: 131, value: 800 },
  { ageMin: 132, ageMax: 215, value: 1150 },
  { ageMin: 216, ageMax: 299, value: 1000 },  // 18-24
  { ageMin: 300, ageMax: null,value: 950 },    // ≥25
];

// Fluoride AI (mg/d), same M/F
const FL_AI: Array<{ ageMin: number; ageMax: number | null; M: number; F: number }> = [
  { ageMin: 7,   ageMax: 11,  M: 0.4, F: 0.4 },
  { ageMin: 12,  ageMax: 35,  M: 0.6, F: 0.6 },
  { ageMin: 48,  ageMax: 71,  M: 1.0, F: 0.9 },
  { ageMin: 84,  ageMax: 119, M: 1.5, F: 1.4 },
  { ageMin: 132, ageMax: 167, M: 2.2, F: 2.3 },
  { ageMin: 180, ageMax: 215, M: 3.2, F: 2.8 },
  { ageMin: 216, ageMax: null,M: 3.4, F: 2.9 },
];

// Iodine AI (µg/d)
const I_AI: Array<{ ageMin: number; ageMax: number | null; value: number }> = [
  { ageMin: 7,   ageMax: 11,  value: 70 },
  { ageMin: 12,  ageMax: 35,  value: 90 },
  { ageMin: 48,  ageMax: 71,  value: 90 },
  { ageMin: 84,  ageMax: 119, value: 90 },
  { ageMin: 132, ageMax: 167, value: 120 },
  { ageMin: 180, ageMax: 215, value: 130 },
  { ageMin: 216, ageMax: null,value: 150 },
];

// Manganese AI (mg/d)
const MN_AI: Array<{ ageMin: number; ageMax: number | null; value: number }> = [
  { ageMin: 7,   ageMax: 11,  value: 0.26 }, // midpoint of 0.02-0.5
  { ageMin: 12,  ageMax: 35,  value: 0.5 },
  { ageMin: 48,  ageMax: 71,  value: 1.0 },
  { ageMin: 84,  ageMax: 119, value: 1.5 },
  { ageMin: 132, ageMax: 167, value: 2.0 },
  { ageMin: 180, ageMax: null,value: 3.0 },
];

// Molybdenum AI (µg/d)
const MO_AI: Array<{ ageMin: number; ageMax: number | null; value: number }> = [
  { ageMin: 7,   ageMax: 11,  value: 10 },
  { ageMin: 12,  ageMax: 35,  value: 15 },
  { ageMin: 48,  ageMax: 71,  value: 20 },
  { ageMin: 84,  ageMax: 119, value: 30 },
  { ageMin: 132, ageMax: 167, value: 45 },
  { ageMin: 180, ageMax: null,value: 65 },
];

// Phosphorus AI (mg/d)
const P_AI: Array<{ ageMin: number; ageMax: number | null; value: number }> = [
  { ageMin: 7,   ageMax: 11,  value: 160 },
  { ageMin: 12,  ageMax: 35,  value: 250 },
  { ageMin: 48,  ageMax: 71,  value: 440 },
  { ageMin: 84,  ageMax: 119, value: 440 },
  { ageMin: 132, ageMax: 167, value: 640 },
  { ageMin: 180, ageMax: 215, value: 640 },
  { ageMin: 216, ageMax: null,value: 550 },
];

// Potassium AI (mg/d)
const K_AI: Array<{ ageMin: number; ageMax: number | null; value: number }> = [
  { ageMin: 7,   ageMax: 11,  value: 750 },
  { ageMin: 12,  ageMax: 35,  value: 800 },
  { ageMin: 48,  ageMax: 71,  value: 1100 },
  { ageMin: 84,  ageMax: 119, value: 1800 },
  { ageMin: 132, ageMax: 167, value: 2700 },
  { ageMin: 180, ageMax: 215, value: 3500 },
  { ageMin: 216, ageMax: null,value: 3500 },
];

// Selenium AI (µg/d)
const SE_AI: Array<{ ageMin: number; ageMax: number | null; value: number }> = [
  { ageMin: 7,   ageMax: 11,  value: 15 },
  { ageMin: 12,  ageMax: 35,  value: 15 },
  { ageMin: 48,  ageMax: 71,  value: 20 },
  { ageMin: 84,  ageMax: 119, value: 35 },
  { ageMin: 132, ageMax: 167, value: 55 },
  { ageMin: 180, ageMax: null,value: 70 },
];

// Iron PRI — female menopause split for 18+
const FE_PRI: Array<{ ageMin: number; ageMax: number | null; M: number; F: number | null; F_premenopausal?: number; F_postmenopausal?: number }> = [
  { ageMin: 7,   ageMax: 11,  M: 11, F: 11 },
  { ageMin: 12,  ageMax: 83,  M: 7,  F: 7 },     // 1-6y
  { ageMin: 84,  ageMax: 131, M: 11, F: 11 },    // 7-11y (note: ambiguity)
  { ageMin: 132, ageMax: 215, M: 11, F: 13 },    // 12-17y F: 13 (assumes menstruating)
  { ageMin: 216, ageMax: 611, M: 11, F: 16, F_premenopausal: 16 },   // 18-50
  { ageMin: 612, ageMax: null,M: 11, F: 11, F_postmenopausal: 11 },  // 51+
];

// Copper PRI (mg/d)
const CU_PRI: Array<{ ageMin: number; ageMax: number | null; M: number; F: number }> = [
  { ageMin: 7,   ageMax: 11,  M: 0.4, F: 0.4 },
  { ageMin: 12,  ageMax: 107, M: 0.7, F: 0.7 },  // 1-9y (Table 5 uses 1-2/3-9 split, simplified)
  { ageMin: 108, ageMax: 215, M: 1.0, F: 1.1 },  // 10-17y approximation
  { ageMin: 216, ageMax: null,M: 1.6, F: 1.3 },
];

// Magnesium PRI (mg/d)
const MG_PRI: Array<{ ageMin: number; ageMax: number | null; M: number; F: number }> = [
  { ageMin: 7,   ageMax: 11,  M: 80,  F: 80 },
  { ageMin: 12,  ageMax: 35,  M: 170, F: 170 },
  { ageMin: 48,  ageMax: 71,  M: 230, F: 230 },
  { ageMin: 84,  ageMax: 131, M: 250, F: 250 },  // 7-10y simplified; ~230-300 range
  { ageMin: 132, ageMax: 167, M: 300, F: 250 },
  { ageMin: 180, ageMax: 215, M: 300, F: 300 },
  { ageMin: 216, ageMax: null,M: 350, F: 300 },
];

// Zinc PRI — same LPI 4-tier structure for adults; single value for non-adults
interface ZnPRI { ageMin: number; ageMax: number | null; single_M?: number; single_F?: number; lpi?: { l300: { M: number; F: number }; l600: { M: number; F: number }; l900: { M: number; F: number }; l1200: { M: number; F: number } }; }

const ZN_PRI: ZnPRI[] = [
  { ageMin: 7,   ageMax: 11,  single_M: 2.9, single_F: 2.9 },
  { ageMin: 12,  ageMax: 35,  single_M: 4.3, single_F: 4.3 },
  { ageMin: 48,  ageMax: 71,  single_M: 5.5, single_F: 5.5 },
  { ageMin: 84,  ageMax: 119, single_M: 7.4, single_F: 7.4 },
  { ageMin: 132, ageMax: 167, single_M: 10.7, single_F: 10.7 },
  { ageMin: 180, ageMax: 215, single_M: 14.2, single_F: 11.9 },  // M 15-17 / F 15-17
  { ageMin: 216, ageMax: null, lpi: {
      l300:  { M: 9.4,  F: 7.5 },
      l600:  { M: 11.7, F: 9.3 },
      l900:  { M: 14.0, F: 11.0 },
      l1200: { M: 16.3, F: 12.7 },
  }},
];

// Pregnancy + Lactation mineral additions (Table 7)
// Ca = 1000 (18-24), 950 (≥25); Fe = 16 (premenopausal) → pregnant always 16; Zn +1.6 preg, +2.9 lact
const MIN_PREG = { Ca_18_24: 1000, Ca_25plus: 950, Fl: 2.9, I: 200, Mn: 3.0, Mo: 65, P: 550, K: 3500, Se: 70, Fe: 16, Cu: 1.5, Mg: 300, Zn_LPI_300: 9.1, Zn_LPI_600: 10.9, Zn_LPI_900: 12.6, Zn_LPI_1200: 14.3 };
const MIN_LACT = { Ca_18_24: 1000, Ca_25plus: 950, Fl: 2.9, I: 200, Mn: 3.0, Mo: 65, P: 550, K: 4000, Se: 85, Fe: 16, Cu: 1.5, Mg: 300, Zn_LPI_300: 10.4, Zn_LPI_600: 12.2, Zn_LPI_900: 13.9, Zn_LPI_1200: 15.6 };

// ═══════════════════════════════════════════════════════════════
// Helpers to get reference energy (MJ/d) for a given age/sex at PAL 1.4.
// Used for thiamin/niacin mg/MJ → mg/d conversion.
// ═══════════════════════════════════════════════════════════════

export function refEnergyMJ(ageMinMonths: number, sex: Sex): number {
  // Use PAL 1.4 (sedentary) as base for reference conversions.
  for (let i = ENERGY_ROWS.length - 1; i >= 0; i--) {
    const r = ENERGY_ROWS[i];
    const [min, max, M14, F14] = r;
    if (ageMinMonths >= min) {
      const v = sex === 'MALE' ? M14 : F14;
      if (typeof v === 'number') return v;
      // Fall back to PAL 1.6 if 1.4 null
      const [, , , , M16, F16] = r;
      const v2 = sex === 'MALE' ? M16 : F16;
      if (typeof v2 === 'number') return v2;
    }
  }
  return sex === 'MALE' ? 11.2 : 9.0; // adult fallback
}

export {
  ENERGY_ROWS, MJ_TO_KCAL, PREG_ENERGY_ADD, LACT_ENERGY_ADD_06,
  REF_BW, PROTEIN_G_PER_KG, BW_ADULT, PROTEIN_PREG_ADD, PROTEIN_LACT_ADD,
  MACROS,
  VIT_AR_MALE, VIT_AR_FEMALE, VIT_AR_FEMALE_PREG, VIT_AR_FEMALE_LACT,
  VIT_PRI_MALE, VIT_PRI_FEMALE, VIT_PRI_PREG, VIT_PRI_LACT,
  VIT_E_ALPHA_TOCOPHEROL,
  CA_AR, FE_AR, ZN_AR,
  CA_PRI, FL_AI, I_AI, MN_AI, MO_AI, P_AI, K_AI, SE_AI,
  FE_PRI, CU_PRI, MG_PRI, ZN_PRI,
  MIN_PREG, MIN_LACT,
};
