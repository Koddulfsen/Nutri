/**
 * LARN 2014 — raw reference values extracted verbatim from
 * eng.sinu.it/tabelle-larn-2014/ (vitamins + minerals pages).
 *
 * No interpretation, no unit conversion. PRI = Population Reference Intake
 * (= RDA); AI = Adequate Intake. LARN 2014 does not explicitly mark which
 * values are PRI vs AI in the web tables — we treat all as PRI/RDA by
 * default unless a per-nutrient footnote specifies AI.
 *
 * Iron "10/18" (F 11-14) and "18/10" (F 30-59) indicate menstruating vs
 * non-menstruating. We store the menstruating value as primary with
 * value_note capturing the non-menstruating alternative.
 *
 * Pregnancy = single bucket (no trimester split like NNR 2023).
 * LARN uses broad sodium/potassium/chloride values in GRAMS (converted
 * to mg in the seed).
 */

export type NutrientKey = keyof typeof VITAMIN_PRI;
export type AgeKey =
  | 'INFANT_6_12M'
  | 'CHILD_1_3' | 'CHILD_4_6' | 'CHILD_7_10'
  | 'M_11_14' | 'M_15_17'
  | 'F_11_14' | 'F_15_17'
  | 'M_18_29' | 'M_30_59' | 'M_60_74' | 'M_75P'
  | 'F_18_29' | 'F_30_59' | 'F_60_74' | 'F_75P'
  | 'PREGNANT' | 'LACTATING';

// Columns: C, Thiamin, Riboflavin, Niacin, Pantothenic, B6, Biotin, Folate, B12, A, D, E, K
// Units:   mg, mg,      mg,         mg,     mg,          mg, μg,     μg,     μg,  μg, μg, mg, μg
export const VITAMIN_PRI: Record<AgeKey, {
  vitC: number; thiamin: number; riboflavin: number; niacin: number;
  pantothenicAcid: number; vitB6: number; biotin: number; folate: number;
  vitB12: number; vitA: number; vitD: number; vitE: number; vitK: number;
}> = {
  INFANT_6_12M: { vitC: 35,  thiamin: 0.3, riboflavin: 0.4, niacin: 5,  pantothenicAcid: 2.0, vitB6: 0.4, biotin: 7,  folate: 110, vitB12: 0.7, vitA: 450,  vitD: 10, vitE: 4,  vitK: 10  },
  CHILD_1_3:    { vitC: 35,  thiamin: 0.4, riboflavin: 0.5, niacin: 7,  pantothenicAcid: 2.0, vitB6: 0.5, biotin: 10, folate: 140, vitB12: 0.9, vitA: 300,  vitD: 15, vitE: 5,  vitK: 50  },
  CHILD_4_6:    { vitC: 45,  thiamin: 0.5, riboflavin: 0.6, niacin: 8,  pantothenicAcid: 2.5, vitB6: 0.6, biotin: 15, folate: 170, vitB12: 1.1, vitA: 350,  vitD: 15, vitE: 6,  vitK: 65  },
  CHILD_7_10:   { vitC: 60,  thiamin: 0.8, riboflavin: 0.8, niacin: 12, pantothenicAcid: 3.5, vitB6: 0.9, biotin: 20, folate: 250, vitB12: 1.6, vitA: 500,  vitD: 15, vitE: 8,  vitK: 90  },
  M_11_14:      { vitC: 90,  thiamin: 1.1, riboflavin: 1.3, niacin: 17, pantothenicAcid: 4.5, vitB6: 1.2, biotin: 25, folate: 350, vitB12: 2.2, vitA: 600,  vitD: 15, vitE: 11, vitK: 130 },
  M_15_17:      { vitC: 105, thiamin: 1.2, riboflavin: 1.6, niacin: 18, pantothenicAcid: 5.0, vitB6: 1.3, biotin: 30, folate: 400, vitB12: 2.4, vitA: 700,  vitD: 15, vitE: 13, vitK: 140 },
  F_11_14:      { vitC: 80,  thiamin: 1.0, riboflavin: 1.2, niacin: 17, pantothenicAcid: 4.5, vitB6: 1.2, biotin: 25, folate: 350, vitB12: 2.2, vitA: 600,  vitD: 15, vitE: 11, vitK: 130 },
  F_15_17:      { vitC: 85,  thiamin: 1.1, riboflavin: 1.3, niacin: 18, pantothenicAcid: 5.0, vitB6: 1.3, biotin: 30, folate: 400, vitB12: 2.4, vitA: 600,  vitD: 15, vitE: 12, vitK: 140 },
  M_18_29:      { vitC: 105, thiamin: 1.2, riboflavin: 1.6, niacin: 18, pantothenicAcid: 5.0, vitB6: 1.3, biotin: 30, folate: 400, vitB12: 2.4, vitA: 700,  vitD: 15, vitE: 13, vitK: 140 },
  M_30_59:      { vitC: 105, thiamin: 1.2, riboflavin: 1.6, niacin: 18, pantothenicAcid: 5.0, vitB6: 1.3, biotin: 30, folate: 400, vitB12: 2.4, vitA: 700,  vitD: 15, vitE: 13, vitK: 140 },
  M_60_74:      { vitC: 105, thiamin: 1.2, riboflavin: 1.6, niacin: 18, pantothenicAcid: 5.0, vitB6: 1.7, biotin: 30, folate: 400, vitB12: 2.4, vitA: 700,  vitD: 15, vitE: 13, vitK: 170 },
  M_75P:        { vitC: 105, thiamin: 1.2, riboflavin: 1.6, niacin: 18, pantothenicAcid: 5.0, vitB6: 1.7, biotin: 30, folate: 400, vitB12: 2.4, vitA: 700,  vitD: 20, vitE: 13, vitK: 170 },
  F_18_29:      { vitC: 85,  thiamin: 1.1, riboflavin: 1.3, niacin: 18, pantothenicAcid: 5.0, vitB6: 1.3, biotin: 30, folate: 400, vitB12: 2.4, vitA: 600,  vitD: 15, vitE: 12, vitK: 140 },
  F_30_59:      { vitC: 85,  thiamin: 1.1, riboflavin: 1.3, niacin: 18, pantothenicAcid: 5.0, vitB6: 1.3, biotin: 30, folate: 400, vitB12: 2.4, vitA: 600,  vitD: 15, vitE: 12, vitK: 140 },
  F_60_74:      { vitC: 85,  thiamin: 1.1, riboflavin: 1.3, niacin: 18, pantothenicAcid: 5.0, vitB6: 1.5, biotin: 30, folate: 400, vitB12: 2.4, vitA: 600,  vitD: 15, vitE: 12, vitK: 170 },
  F_75P:        { vitC: 85,  thiamin: 1.1, riboflavin: 1.3, niacin: 18, pantothenicAcid: 5.0, vitB6: 1.5, biotin: 30, folate: 400, vitB12: 2.4, vitA: 600,  vitD: 20, vitE: 12, vitK: 170 },
  PREGNANT:     { vitC: 100, thiamin: 1.4, riboflavin: 1.7, niacin: 22, pantothenicAcid: 6.0, vitB6: 1.9, biotin: 35, folate: 600, vitB12: 2.6, vitA: 700,  vitD: 15, vitE: 12, vitK: 140 },
  LACTATING:    { vitC: 130, thiamin: 1.4, riboflavin: 1.8, niacin: 22, pantothenicAcid: 7.0, vitB6: 2.0, biotin: 35, folate: 500, vitB12: 2.8, vitA: 1000, vitD: 15, vitE: 15, vitK: 140 },
};

// Minerals: Ca, P, Mg (all mg) | Na, K, Cl (g — convert to mg) | Fe, Zn, Cu (mg) | Se, I (μg) | Mn (mg) | Mo, Cr (μg) | F (mg)
// Iron F 11-14 "10/18" → 10 pre-menarche, 18 menstruating
// Iron F 30-59 "18/10" → 18 menstruating, 10 post-menopause
export const MINERAL_PRI: Record<AgeKey, {
  calcium: number; phosphorus: number; magnesium: number;
  sodium_g: number; potassium_g: number; chloride_g: number;
  iron: number | { premenarche: number; menstruating: number } | { menstruating: number; postmenopausal: number };
  zinc: number; copper: number; selenium: number; iodine: number;
  manganese: number; molybdenum: number; chromium: number; fluoride: number;
}> = {
  INFANT_6_12M: { calcium: 260,  phosphorus: 275,  magnesium: 80,  sodium_g: 0.4, potassium_g: 0.7, chloride_g: 0.6, iron: 11, zinc: 3,  copper: 0.2, selenium: 20, iodine: 70,  manganese: 0.4, molybdenum: 10, chromium: 4,  fluoride: 0.4 },
  CHILD_1_3:    { calcium: 700,  phosphorus: 460,  magnesium: 80,  sodium_g: 0.7, potassium_g: 1.7, chloride_g: 1.0, iron: 8,  zinc: 5,  copper: 0.3, selenium: 19, iodine: 100, manganese: 0.6, molybdenum: 15, chromium: 7,  fluoride: 0.7 },
  CHILD_4_6:    { calcium: 900,  phosphorus: 500,  magnesium: 100, sodium_g: 0.9, potassium_g: 2.4, chloride_g: 1.4, iron: 11, zinc: 6,  copper: 0.4, selenium: 25, iodine: 100, manganese: 0.8, molybdenum: 20, chromium: 10, fluoride: 1.0 },
  CHILD_7_10:   { calcium: 1100, phosphorus: 875,  magnesium: 150, sodium_g: 1.1, potassium_g: 3.0, chloride_g: 1.7, iron: 13, zinc: 8,  copper: 0.6, selenium: 34, iodine: 100, manganese: 1.2, molybdenum: 30, chromium: 14, fluoride: 1.6 },
  M_11_14:      { calcium: 1300, phosphorus: 1250, magnesium: 240, sodium_g: 1.5, potassium_g: 3.9, chloride_g: 2.3, iron: 10, zinc: 12, copper: 0.8, selenium: 49, iodine: 130, manganese: 1.9, molybdenum: 50, chromium: 25, fluoride: 2.5 },
  M_15_17:      { calcium: 1300, phosphorus: 1250, magnesium: 240, sodium_g: 1.5, potassium_g: 3.9, chloride_g: 2.3, iron: 13, zinc: 12, copper: 0.9, selenium: 55, iodine: 130, manganese: 2.7, molybdenum: 60, chromium: 33, fluoride: 3.5 },
  F_11_14:      { calcium: 1300, phosphorus: 1250, magnesium: 240, sodium_g: 1.5, potassium_g: 3.9, chloride_g: 2.3, iron: { premenarche: 10, menstruating: 18 }, zinc: 9,  copper: 0.8, selenium: 48, iodine: 130, manganese: 1.9, molybdenum: 50, chromium: 21, fluoride: 2.5 },
  F_15_17:      { calcium: 1200, phosphorus: 1250, magnesium: 240, sodium_g: 1.5, potassium_g: 3.9, chloride_g: 2.3, iron: 18, zinc: 9,  copper: 0.9, selenium: 55, iodine: 130, manganese: 2.3, molybdenum: 60, chromium: 23, fluoride: 3.0 },
  M_18_29:      { calcium: 1000, phosphorus: 700,  magnesium: 240, sodium_g: 1.5, potassium_g: 3.9, chloride_g: 2.3, iron: 10, zinc: 12, copper: 0.9, selenium: 55, iodine: 150, manganese: 2.7, molybdenum: 65, chromium: 35, fluoride: 3.5 },
  M_30_59:      { calcium: 1000, phosphorus: 700,  magnesium: 240, sodium_g: 1.5, potassium_g: 3.9, chloride_g: 2.3, iron: 10, zinc: 12, copper: 0.9, selenium: 55, iodine: 150, manganese: 2.7, molybdenum: 65, chromium: 35, fluoride: 3.5 },
  M_60_74:      { calcium: 1200, phosphorus: 700,  magnesium: 240, sodium_g: 1.2, potassium_g: 3.9, chloride_g: 1.9, iron: 10, zinc: 12, copper: 0.9, selenium: 55, iodine: 150, manganese: 2.7, molybdenum: 65, chromium: 30, fluoride: 3.5 },
  M_75P:        { calcium: 1200, phosphorus: 700,  magnesium: 240, sodium_g: 1.2, potassium_g: 3.9, chloride_g: 1.9, iron: 10, zinc: 12, copper: 0.9, selenium: 55, iodine: 150, manganese: 2.7, molybdenum: 65, chromium: 30, fluoride: 3.5 },
  F_18_29:      { calcium: 1000, phosphorus: 700,  magnesium: 240, sodium_g: 1.5, potassium_g: 3.9, chloride_g: 2.3, iron: 18, zinc: 9,  copper: 0.9, selenium: 55, iodine: 150, manganese: 2.3, molybdenum: 65, chromium: 25, fluoride: 3.0 },
  F_30_59:      { calcium: 1000, phosphorus: 700,  magnesium: 240, sodium_g: 1.5, potassium_g: 3.9, chloride_g: 2.3, iron: { menstruating: 18, postmenopausal: 10 }, zinc: 9, copper: 0.9, selenium: 55, iodine: 150, manganese: 2.3, molybdenum: 65, chromium: 25, fluoride: 3.0 },
  F_60_74:      { calcium: 1200, phosphorus: 700,  magnesium: 240, sodium_g: 1.2, potassium_g: 3.9, chloride_g: 1.9, iron: 10, zinc: 9,  copper: 0.9, selenium: 55, iodine: 150, manganese: 2.3, molybdenum: 65, chromium: 20, fluoride: 3.0 },
  F_75P:        { calcium: 1200, phosphorus: 700,  magnesium: 240, sodium_g: 1.2, potassium_g: 3.9, chloride_g: 1.9, iron: 10, zinc: 9,  copper: 0.9, selenium: 55, iodine: 150, manganese: 2.3, molybdenum: 65, chromium: 20, fluoride: 3.0 },
  PREGNANT:     { calcium: 1200, phosphorus: 700,  magnesium: 240, sodium_g: 1.5, potassium_g: 3.9, chloride_g: 2.3, iron: 27, zinc: 11, copper: 1.2, selenium: 60, iodine: 200, manganese: 2.3, molybdenum: 65, chromium: 30, fluoride: 3.0 },
  LACTATING:    { calcium: 1000, phosphorus: 700,  magnesium: 240, sodium_g: 1.5, potassium_g: 3.9, chloride_g: 2.3, iron: 11, zinc: 12, copper: 1.6, selenium: 70, iodine: 200, manganese: 2.3, molybdenum: 65, chromium: 45, fluoride: 3.0 },
};

// Age ranges in months. Primary/only reference for LARN 2014.
export const AGE_RANGE: Record<AgeKey, {
  minMonths: number; maxMonths: number | null; sex: 'MALE' | 'FEMALE' | 'BOTH';
  lifeStage: 'NONE' | 'PREGNANT' | 'LACTATING'; label: string;
}> = {
  INFANT_6_12M: { minMonths: 6,   maxMonths: 12,   sex: 'BOTH',   lifeStage: 'NONE',       label: '6-12 mo' },
  CHILD_1_3:    { minMonths: 12,  maxMonths: 47,   sex: 'BOTH',   lifeStage: 'NONE',       label: '1-3 y' },
  CHILD_4_6:    { minMonths: 48,  maxMonths: 83,   sex: 'BOTH',   lifeStage: 'NONE',       label: '4-6 y' },
  CHILD_7_10:   { minMonths: 84,  maxMonths: 131,  sex: 'BOTH',   lifeStage: 'NONE',       label: '7-10 y' },
  M_11_14:      { minMonths: 132, maxMonths: 179,  sex: 'MALE',   lifeStage: 'NONE',       label: 'M 11-14 y' },
  M_15_17:      { minMonths: 180, maxMonths: 215,  sex: 'MALE',   lifeStage: 'NONE',       label: 'M 15-17 y' },
  F_11_14:      { minMonths: 132, maxMonths: 179,  sex: 'FEMALE', lifeStage: 'NONE',       label: 'F 11-14 y' },
  F_15_17:      { minMonths: 180, maxMonths: 215,  sex: 'FEMALE', lifeStage: 'NONE',       label: 'F 15-17 y' },
  M_18_29:      { minMonths: 216, maxMonths: 359,  sex: 'MALE',   lifeStage: 'NONE',       label: 'M 18-29 y' },
  M_30_59:      { minMonths: 360, maxMonths: 719,  sex: 'MALE',   lifeStage: 'NONE',       label: 'M 30-59 y' },
  M_60_74:      { minMonths: 720, maxMonths: 899,  sex: 'MALE',   lifeStage: 'NONE',       label: 'M 60-74 y' },
  M_75P:        { minMonths: 900, maxMonths: null, sex: 'MALE',   lifeStage: 'NONE',       label: 'M ≥75 y' },
  F_18_29:      { minMonths: 216, maxMonths: 359,  sex: 'FEMALE', lifeStage: 'NONE',       label: 'F 18-29 y' },
  F_30_59:      { minMonths: 360, maxMonths: 719,  sex: 'FEMALE', lifeStage: 'NONE',       label: 'F 30-59 y' },
  F_60_74:      { minMonths: 720, maxMonths: 899,  sex: 'FEMALE', lifeStage: 'NONE',       label: 'F 60-74 y' },
  F_75P:        { minMonths: 900, maxMonths: null, sex: 'FEMALE', lifeStage: 'NONE',       label: 'F ≥75 y' },
  PREGNANT:     { minMonths: 180, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT',   label: 'Pregnant' },
  LACTATING:    { minMonths: 180, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'LACTATING',  label: 'Lactating' },
};
