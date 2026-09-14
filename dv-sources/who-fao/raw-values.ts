/**
 * WHO/FAO 2004 — Vitamin and Mineral Requirements in Human Nutrition, 2nd ed.
 * Source: FAO appendix https://www.fao.org/4/y2809e/y2809e0o.htm
 *
 * Only RNIs published. Some preg/lact split by trimester/period.
 * Iron stored at 15% bioavailability; Zinc at moderate bioavailability.
 */

export type Sex = 'MALE' | 'FEMALE';

export interface Demographic {
  key: string;
  minMonths: number;
  maxMonths: number | null;
  sex: Sex | 'BOTH';
  lifeStage:
    | 'NONE' | 'PREGNANT' | 'PREGNANT_T1' | 'PREGNANT_T2' | 'PREGNANT_T3'
    | 'LACTATING' | 'LACTATING_0_6M' | 'LACTATING_7_12M';
  label: string;
}

export const DEMOGRAPHICS: Demographic[] = [
  { key: 'INFANT_0_6',  minMonths: 0,   maxMonths: 5,    sex: 'BOTH',   lifeStage: 'NONE', label: 'Infants 0-6 mo' },
  { key: 'INFANT_7_12', minMonths: 6,   maxMonths: 11,   sex: 'BOTH',   lifeStage: 'NONE', label: 'Infants 7-12 mo' },
  { key: 'CHILD_1_3',   minMonths: 12,  maxMonths: 47,   sex: 'BOTH',   lifeStage: 'NONE', label: 'Children 1-3 y' },
  { key: 'CHILD_4_6',   minMonths: 48,  maxMonths: 83,   sex: 'BOTH',   lifeStage: 'NONE', label: 'Children 4-6 y' },
  { key: 'CHILD_7_9',   minMonths: 84,  maxMonths: 119,  sex: 'BOTH',   lifeStage: 'NONE', label: 'Children 7-9 y' },
  // 10-14 split for Iron/Iodine; 10-18 combined for everything else
  { key: 'M_10_14',     minMonths: 120, maxMonths: 179,  sex: 'MALE',   lifeStage: 'NONE', label: 'Males 10-14 y' },
  { key: 'M_15_18',     minMonths: 180, maxMonths: 227,  sex: 'MALE',   lifeStage: 'NONE', label: 'Males 15-18 y' },
  { key: 'M_10_18',     minMonths: 120, maxMonths: 227,  sex: 'MALE',   lifeStage: 'NONE', label: 'Males 10-18 y' },
  { key: 'F_10_14',     minMonths: 120, maxMonths: 179,  sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 10-14 y' },
  { key: 'F_15_18',     minMonths: 180, maxMonths: 227,  sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 15-18 y' },
  { key: 'F_10_18',     minMonths: 120, maxMonths: 227,  sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 10-18 y' },
  { key: 'M_19_65',     minMonths: 228, maxMonths: 779,  sex: 'MALE',   lifeStage: 'NONE', label: 'Males 19-65 y' },
  { key: 'F_19_50',     minMonths: 228, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 19-50 y' },
  { key: 'F_51_65',     minMonths: 612, maxMonths: 779,  sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 51-65 y' },
  { key: 'M_65P',       minMonths: 780, maxMonths: null, sex: 'MALE',   lifeStage: 'NONE', label: 'Males 65+ y' },
  { key: 'F_65P',       minMonths: 780, maxMonths: null, sex: 'FEMALE', lifeStage: 'NONE', label: 'Females 65+ y' },
  // Pregnancy: single or by trimester
  { key: 'PREG',        minMonths: 228, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT',    label: 'Pregnancy' },
  { key: 'PREG_T1',     minMonths: 228, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT_T1', label: 'Pregnancy T1' },
  { key: 'PREG_T2',     minMonths: 228, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT_T2', label: 'Pregnancy T2' },
  { key: 'PREG_T3',     minMonths: 228, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT_T3', label: 'Pregnancy T3' },
  { key: 'LACT',        minMonths: 228, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'LACTATING',        label: 'Lactation' },
  { key: 'LACT_0_6',    minMonths: 228, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'LACTATING_0_6M',   label: 'Lactation 0-6 mo' },
  { key: 'LACT_7_12',   minMonths: 228, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'LACTATING_7_12M',  label: 'Lactation 7-12 mo' },
];
const DEMO_BY_KEY = Object.fromEntries(DEMOGRAPHICS.map((d) => [d.key, d]));
export function demo(key: string): Demographic {
  const d = DEMO_BY_KEY[key];
  if (!d) throw new Error(`Unknown demo: ${key}`);
  return d;
}

// ═══════════════════════════════════════════════════════════════
// VITAMINS (Table 2) — all RNI
// ═══════════════════════════════════════════════════════════════

export interface VitRow {
  compoundName: string;
  unit: string;
  values: Record<string, number | null>;
  note?: string;
}

export const VITAMINS: VitRow[] = [
  {
    compoundName: 'Thiamin', unit: 'mg',
    values: {
      INFANT_0_6: 0.2, INFANT_7_12: 0.3,
      CHILD_1_3: 0.5, CHILD_4_6: 0.6, CHILD_7_9: 0.9,
      M_10_18: 1.2, F_10_18: 1.1,
      M_19_65: 1.2, F_19_50: 1.1, F_51_65: 1.1, M_65P: 1.2, F_65P: 1.1,
      PREG: 1.4, LACT: 1.5,
    },
  },
  {
    compoundName: 'Riboflavin', unit: 'mg',
    values: {
      INFANT_0_6: 0.3, INFANT_7_12: 0.4,
      CHILD_1_3: 0.5, CHILD_4_6: 0.6, CHILD_7_9: 0.9,
      M_10_18: 1.3, F_10_18: 1.0,
      M_19_65: 1.3, F_19_50: 1.1, F_51_65: 1.1, M_65P: 1.3, F_65P: 1.1,
      PREG: 1.4, LACT: 1.6,
    },
  },
  {
    compoundName: 'Niacin', unit: 'mg',
    values: {
      INFANT_0_6: 2, INFANT_7_12: 4,
      CHILD_1_3: 6, CHILD_4_6: 8, CHILD_7_9: 12,
      M_10_18: 16, F_10_18: 16,
      M_19_65: 16, F_19_50: 14, F_51_65: 14, M_65P: 16, F_65P: 14,
      PREG: 18, LACT: 17,
    },
    note: 'Expressed as mg NE (niacin equivalent).',
  },
  {
    compoundName: 'Vitamin B6', unit: 'mg',
    values: {
      INFANT_0_6: 0.1, INFANT_7_12: 0.3,
      CHILD_1_3: 0.5, CHILD_4_6: 0.6, CHILD_7_9: 1.0,
      M_10_18: 1.3, F_10_18: 1.2,
      M_19_65: 1.5, // source says 1.3-1.7; use midpoint 1.5
      F_19_50: 1.3, F_51_65: 1.5, M_65P: 1.7, F_65P: 1.5,
      PREG: 1.9, LACT: 2.0,
    },
    note: 'M 19-65 published as 1.3-1.7 range; midpoint 1.5 stored.',
  },
  {
    compoundName: 'Pantothenate', unit: 'mg',
    values: {
      INFANT_0_6: 1.7, INFANT_7_12: 1.8,
      CHILD_1_3: 2, CHILD_4_6: 3, CHILD_7_9: 4,
      M_10_18: 5, F_10_18: 5,
      M_19_65: 5, F_19_50: 5, F_51_65: 5, M_65P: 5, F_65P: 5,
      PREG: 6, LACT: 7,
    },
  },
  {
    compoundName: 'Biotin', unit: 'µg',
    values: {
      INFANT_0_6: 5, INFANT_7_12: 6,
      CHILD_1_3: 8, CHILD_4_6: 12, CHILD_7_9: 20,
      M_10_18: 25, F_10_18: 25,
      M_19_65: 30, F_19_50: 30, F_51_65: 30, M_65P: null, F_65P: null,
      PREG: 30, LACT: 35,
    },
    note: '65+ values not published.',
  },
  {
    compoundName: 'Folate', unit: 'µg',
    values: {
      INFANT_0_6: 80, INFANT_7_12: 80,
      CHILD_1_3: 160, CHILD_4_6: 200, CHILD_7_9: 300,
      M_10_18: 400, F_10_18: 400,
      M_19_65: 400, F_19_50: 400, F_51_65: 400, M_65P: 400, F_65P: 400,
      PREG: 600, LACT: 500,
    },
    note: 'Expressed as µg DFE. Women of reproductive age should consume 400 µg folic acid supplement preconception.',
  },
  {
    compoundName: 'Vitamin B12', unit: 'µg',
    values: {
      INFANT_0_6: 0.4, INFANT_7_12: 0.5,
      CHILD_1_3: 0.9, CHILD_4_6: 1.2, CHILD_7_9: 1.8,
      M_10_18: 2.4, F_10_18: 2.4,
      M_19_65: 2.4, F_19_50: 2.4, F_51_65: 2.4, M_65P: 2.4, F_65P: 2.4,
      PREG: 2.6, LACT: 2.8,
    },
  },
  {
    compoundName: 'Vitamin C', unit: 'mg',
    values: {
      INFANT_0_6: 25, INFANT_7_12: 30,
      CHILD_1_3: 30, CHILD_4_6: 30, CHILD_7_9: 35,
      M_10_18: 40, F_10_18: 40,
      M_19_65: 45, F_19_50: 45, F_51_65: 45, M_65P: 45, F_65P: 45,
      PREG: 55, LACT: 70,
    },
  },
  {
    compoundName: 'Vitamin A', unit: 'µg',
    values: {
      INFANT_0_6: 375, INFANT_7_12: 400,
      CHILD_1_3: 400, CHILD_4_6: 450, CHILD_7_9: 500,
      M_10_18: 600, F_10_18: 600,
      M_19_65: 600, F_19_50: 500, F_51_65: 500, M_65P: 600, F_65P: 600,
      PREG: 800, LACT: 850,
    },
    note: 'WHO/FAO uses Retinol Equivalent (RE), not RAE. 1 µg RE = 6 µg β-carotene. Stored in Vitamin A (RAE) compound with caveat.',
  },
  {
    compoundName: 'Vitamin D', unit: 'µg',
    values: {
      INFANT_0_6: 5, INFANT_7_12: 5,
      CHILD_1_3: 5, CHILD_4_6: 5, CHILD_7_9: 5,
      M_10_18: 5, F_10_18: 5,
      M_19_65: 5, // source 5-10 range; use 5
      F_19_50: 5, F_51_65: 10, M_65P: 15, F_65P: 15,
      PREG: 5, LACT: 5,
    },
    note: '1 µg = 40 IU. M 19-65 range 5-10 µg; lower bound stored.',
  },
  {
    compoundName: 'Vitamin E', unit: 'mg',
    values: {
      INFANT_0_6: 2.7, INFANT_7_12: 2.7,
      CHILD_1_3: 5, CHILD_4_6: 5, CHILD_7_9: 7,
      M_10_18: 10, F_10_18: 7.5,
      M_19_65: 10, F_19_50: 7.5, F_51_65: 7.5, M_65P: 10, F_65P: 7.5,
      PREG: null, LACT: null,
    },
    note: 'α-tocopherol equivalents. WHO/FAO notes these as "acceptable intakes" not formal RNIs. No preg/lact value set.',
  },
  {
    compoundName: 'Vitamin K', unit: 'µg',
    values: {
      INFANT_0_6: 5, INFANT_7_12: 10,
      CHILD_1_3: 15, CHILD_4_6: 20, CHILD_7_9: 25,
      M_10_18: 55, F_10_18: 45,
      M_19_65: 65, F_19_50: 55, F_51_65: 55, M_65P: 65, F_65P: 55,
      PREG: 55, LACT: 55,
    },
    note: 'Adolescent M/F values stored as midpoint of published ranges (M 35-65; F 35-55).',
  },
];

// ═══════════════════════════════════════════════════════════════
// MINERALS (Table 1) — all RNI. Iron = 15% bioavailability.
// ═══════════════════════════════════════════════════════════════

export interface MinRow {
  compoundName: string;
  unit: string;
  values: Record<string, number | null>;
  note?: string;
}

export const MINERALS: MinRow[] = [
  {
    compoundName: 'Calcium', unit: 'mg',
    values: {
      INFANT_0_6: 300, INFANT_7_12: 400,
      CHILD_1_3: 500, CHILD_4_6: 600, CHILD_7_9: 700,
      M_10_18: 1300, F_10_18: 1300,
      M_19_65: 1000, F_19_50: 1000, F_51_65: 1300, M_65P: 1300, F_65P: 1300,
      PREG_T3: 1200,
      LACT: 1000,
    },
    note: 'Pregnancy: only T3 value published (1,200 mg) — T1/T2 assumed same as non-pregnant.',
  },
  {
    compoundName: 'Magnesium', unit: 'mg',
    values: {
      INFANT_0_6: 26, INFANT_7_12: 36,
      CHILD_1_3: 60, CHILD_4_6: 73, CHILD_7_9: 100,
      M_10_18: 250, F_10_18: 230,
      M_19_65: 260, F_19_50: 220, F_51_65: 220, M_65P: 230, F_65P: 190,
      PREG: 220,
      LACT: 270,
    },
  },
  {
    compoundName: 'Selenium', unit: 'µg',
    values: {
      INFANT_0_6: 6, INFANT_7_12: 10,
      CHILD_1_3: 17, CHILD_4_6: 21, CHILD_7_9: 21,
      M_10_18: 34, F_10_18: 26,
      M_19_65: 34, F_19_50: 26, F_51_65: 26, M_65P: 34, F_65P: 26,
      PREG_T2: 28, PREG_T3: 30,
      LACT_0_6: 35, LACT_7_12: 42,
    },
    note: 'Lactation 0-6 mo averages published 0-3 (35) and 4-6 (35). Pregnancy: T1 not set.',
  },
  {
    compoundName: 'Zinc', unit: 'mg',
    values: {
      INFANT_0_6: 1.1, INFANT_7_12: 0.8,
      CHILD_1_3: 2.4, CHILD_4_6: 3.1, CHILD_7_9: 3.3,
      M_10_18: 5.7, F_10_18: 4.6,
      M_19_65: 4.2, F_19_50: 3.0, F_51_65: 3.0, M_65P: 4.2, F_65P: 3.0,
      PREG_T1: 3.4, PREG_T2: 4.2, PREG_T3: 6.0,
      LACT_0_6: 5.55, LACT_7_12: 4.3,
    },
    note: 'Stored at moderate bioavailability (medium diet). Also published: high (30% avail) lower and low (15% avail) higher. Lact 0-6 = avg of 0-3 (5.8) and 4-6 (5.3).',
  },
  {
    compoundName: 'Iron', unit: 'mg',
    values: {
      INFANT_0_6: null, INFANT_7_12: 6.2, // 0-6 mo: "(k)" footnote = breast milk only; 7-12 mo: 6.2 at 15%
      CHILD_1_3: 4.1, CHILD_4_6: 5.1, CHILD_7_9: 5.6,
      M_10_14: 10, M_15_18: 12,
      F_10_14: 9, F_15_18: 21,
      M_19_65: 7.0, F_19_50: 4.9, F_51_65: 4.9, M_65P: 7.0, F_65P: 4.9,
      PREG_T1: 5.5, PREG_T2: 7.0, PREG_T3: 10.0,
      LACT_0_6: 9.15, LACT_7_12: 7.2,
    },
    note: 'Stored at 15% bioavailability (mixed omnivorous diet). Also published at 12%, 10%, 5%. Infant 0-5 mo not set (breast milk only). Lact 0-6 = avg of 0-3 (9.5) and 4-6 (8.8).',
  },
  {
    compoundName: 'Iodine', unit: 'µg',
    values: {
      INFANT_0_6: 90,    // 15 µg/kg/d × 6 kg
      INFANT_7_12: 135,
      CHILD_1_3: 75, CHILD_4_6: 110, CHILD_7_9: 100,
      // Source splits 10-18 into 10-11 and 12-18 with different values per sex
      M_10_14: 120, M_15_18: 110,     // M 10-11: 135; M 12-18: 110 — we use 10-14 avg-ish 120, 15-18 110
      F_10_14: 120, F_15_18: 100,     // F 10-11: 140; F 12-18: 100
      M_19_65: 130, F_19_50: 110, F_51_65: 110, M_65P: 130, F_65P: 110,
      PREG: 200,
      LACT: 200,
    },
    note: 'Source splits 10-18 at age 11/12; our 10-14 bucket uses midpoint (M: ~120, F: ~120). 15-18 uses the published 12+ value.',
  },
];

// ═══════════════════════════════════════════════════════════════
// Reference data for all demographics — used for unisex expansion
// ═══════════════════════════════════════════════════════════════

// Which nutrients use which age-10-18 buckets
//  - Iron: M_10_14/M_15_18, F_10_14/F_15_18 (split)
//  - Iodine: M_10_14/M_15_18, F_10_14/F_15_18 (split)
//  - All other vitamins/minerals: M_10_18, F_10_18 (combined)
// Our VITAMINS data uses M_10_18/F_10_18 keys.
// MINERALS — Calcium/Mg/Se/Zn use M_10_18/F_10_18;
//            Iron/Iodine use M_10_14/M_15_18/F_10_14/F_15_18.
