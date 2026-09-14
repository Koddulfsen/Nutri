/**
 * NIH / NAM DRI raw values — extracted verbatim from NCBI Bookshelf NBK545442
 * summary tables. Values: RDA/AI for vitamins, minerals, macros; ULs; AMDR;
 * Sodium CDRR. EARs not included (not in summary tables).
 *
 * NIH notation: bold = RDA, asterisk (*) = AI. This file splits them into
 * explicit fields so the seed code doesn't need to re-interpret.
 */

export type Sex = 'MALE' | 'FEMALE';
export type LifeStage = 'NONE' | 'PREGNANT' | 'LACTATING';

// Age ranges in months for NIH demographics
export interface Demographic {
  key: string;
  minMonths: number;
  maxMonths: number | null;
  sex: Sex | 'BOTH';
  lifeStage: LifeStage;
  label: string;
  infantInfer?: boolean; // infants → all values are AI
}

export const DEMOGRAPHICS: Demographic[] = [
  { key: 'INFANT_0_6',   minMonths: 0,   maxMonths: 6,    sex: 'BOTH',   lifeStage: 'NONE',      label: 'Infants 0-6 mo', infantInfer: true },
  { key: 'INFANT_7_12',  minMonths: 7,   maxMonths: 12,   sex: 'BOTH',   lifeStage: 'NONE',      label: 'Infants 7-12 mo', infantInfer: true },
  { key: 'CHILD_1_3',    minMonths: 12,  maxMonths: 47,   sex: 'BOTH',   lifeStage: 'NONE',      label: 'Children 1-3 y' },
  { key: 'CHILD_4_8',    minMonths: 48,  maxMonths: 107,  sex: 'BOTH',   lifeStage: 'NONE',      label: 'Children 4-8 y' },
  { key: 'M_9_13',       minMonths: 108, maxMonths: 167,  sex: 'MALE',   lifeStage: 'NONE',      label: 'Males 9-13 y' },
  { key: 'M_14_18',      minMonths: 168, maxMonths: 227,  sex: 'MALE',   lifeStage: 'NONE',      label: 'Males 14-18 y' },
  { key: 'M_19_30',      minMonths: 228, maxMonths: 371,  sex: 'MALE',   lifeStage: 'NONE',      label: 'Males 19-30 y' },
  { key: 'M_31_50',      minMonths: 372, maxMonths: 611,  sex: 'MALE',   lifeStage: 'NONE',      label: 'Males 31-50 y' },
  { key: 'M_51_70',      minMonths: 612, maxMonths: 851,  sex: 'MALE',   lifeStage: 'NONE',      label: 'Males 51-70 y' },
  { key: 'M_70P',        minMonths: 852, maxMonths: null, sex: 'MALE',   lifeStage: 'NONE',      label: 'Males >70 y' },
  { key: 'F_9_13',       minMonths: 108, maxMonths: 167,  sex: 'FEMALE', lifeStage: 'NONE',      label: 'Females 9-13 y' },
  { key: 'F_14_18',      minMonths: 168, maxMonths: 227,  sex: 'FEMALE', lifeStage: 'NONE',      label: 'Females 14-18 y' },
  { key: 'F_19_30',      minMonths: 228, maxMonths: 371,  sex: 'FEMALE', lifeStage: 'NONE',      label: 'Females 19-30 y' },
  { key: 'F_31_50',      minMonths: 372, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'NONE',      label: 'Females 31-50 y' },
  { key: 'F_51_70',      minMonths: 612, maxMonths: 851,  sex: 'FEMALE', lifeStage: 'NONE',      label: 'Females 51-70 y' },
  { key: 'F_70P',        minMonths: 852, maxMonths: null, sex: 'FEMALE', lifeStage: 'NONE',      label: 'Females >70 y' },
  { key: 'PREG_14_18',   minMonths: 168, maxMonths: 227,  sex: 'FEMALE', lifeStage: 'PREGNANT',  label: 'Pregnant 14-18 y' },
  { key: 'PREG_19_30',   minMonths: 228, maxMonths: 371,  sex: 'FEMALE', lifeStage: 'PREGNANT',  label: 'Pregnant 19-30 y' },
  { key: 'PREG_31_50',   minMonths: 372, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT',  label: 'Pregnant 31-50 y' },
  { key: 'LACT_14_18',   minMonths: 168, maxMonths: 227,  sex: 'FEMALE', lifeStage: 'LACTATING', label: 'Lactating 14-18 y' },
  { key: 'LACT_19_30',   minMonths: 228, maxMonths: 371,  sex: 'FEMALE', lifeStage: 'LACTATING', label: 'Lactating 19-30 y' },
  { key: 'LACT_31_50',   minMonths: 372, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'LACTATING', label: 'Lactating 31-50 y' },
];

export type DemoKey = typeof DEMOGRAPHICS[number]['key'];

// ═══════════════════════════════════════════════════════════════
// RDA/AI tag per compound for adults (children 1+ follow adult tag).
// Infants are always AI regardless of this tag.
// ═══════════════════════════════════════════════════════════════

export const ADULT_AI_COMPOUNDS = new Set([
  'Vitamin K', 'Pantothenic Acid', 'Biotin', 'Choline',
  'Chromium', 'Fluoride', 'Potassium', 'Sodium', 'Manganese', 'Chloride',
  'Water', 'Dietary Fiber',
]);

// ═══════════════════════════════════════════════════════════════
// Table: RDA/AI for Vitamins (Table appJ_tab2)
// ═══════════════════════════════════════════════════════════════

interface VitaminRow {
  vitA: number; vitC: number; vitD: number; vitE: number; vitK: number;
  thiamin: number; riboflavin: number; niacin: number;
  vitB6: number; folate: number; vitB12: number;
  pantothenicAcid: number; biotin: number; choline: number;
}

export const VITAMINS: Record<DemoKey, VitaminRow> = {
  INFANT_0_6:  { vitA: 400, vitC: 40, vitD: 10, vitE: 4,  vitK: 2.0, thiamin: 0.2, riboflavin: 0.3, niacin: 2,  vitB6: 0.1, folate: 65,  vitB12: 0.4, pantothenicAcid: 1.7, biotin: 5,  choline: 125 },
  INFANT_7_12: { vitA: 500, vitC: 50, vitD: 10, vitE: 5,  vitK: 2.5, thiamin: 0.3, riboflavin: 0.4, niacin: 4,  vitB6: 0.3, folate: 80,  vitB12: 0.5, pantothenicAcid: 1.8, biotin: 6,  choline: 150 },
  CHILD_1_3:   { vitA: 300, vitC: 15, vitD: 15, vitE: 6,  vitK: 30,  thiamin: 0.5, riboflavin: 0.5, niacin: 6,  vitB6: 0.5, folate: 150, vitB12: 0.9, pantothenicAcid: 2,   biotin: 8,  choline: 200 },
  CHILD_4_8:   { vitA: 400, vitC: 25, vitD: 15, vitE: 7,  vitK: 55,  thiamin: 0.6, riboflavin: 0.6, niacin: 8,  vitB6: 0.6, folate: 200, vitB12: 1.2, pantothenicAcid: 3,   biotin: 12, choline: 250 },
  M_9_13:      { vitA: 600, vitC: 45, vitD: 15, vitE: 11, vitK: 60,  thiamin: 0.9, riboflavin: 0.9, niacin: 12, vitB6: 1.0, folate: 300, vitB12: 1.8, pantothenicAcid: 4,   biotin: 20, choline: 375 },
  M_14_18:     { vitA: 900, vitC: 75, vitD: 15, vitE: 15, vitK: 75,  thiamin: 1.2, riboflavin: 1.3, niacin: 16, vitB6: 1.3, folate: 400, vitB12: 2.4, pantothenicAcid: 5,   biotin: 25, choline: 550 },
  M_19_30:     { vitA: 900, vitC: 90, vitD: 15, vitE: 15, vitK: 120, thiamin: 1.2, riboflavin: 1.3, niacin: 16, vitB6: 1.3, folate: 400, vitB12: 2.4, pantothenicAcid: 5,   biotin: 30, choline: 550 },
  M_31_50:     { vitA: 900, vitC: 90, vitD: 15, vitE: 15, vitK: 120, thiamin: 1.2, riboflavin: 1.3, niacin: 16, vitB6: 1.3, folate: 400, vitB12: 2.4, pantothenicAcid: 5,   biotin: 30, choline: 550 },
  M_51_70:     { vitA: 900, vitC: 90, vitD: 15, vitE: 15, vitK: 120, thiamin: 1.2, riboflavin: 1.3, niacin: 16, vitB6: 1.7, folate: 400, vitB12: 2.4, pantothenicAcid: 5,   biotin: 30, choline: 550 },
  M_70P:       { vitA: 900, vitC: 90, vitD: 20, vitE: 15, vitK: 120, thiamin: 1.2, riboflavin: 1.3, niacin: 16, vitB6: 1.7, folate: 400, vitB12: 2.4, pantothenicAcid: 5,   biotin: 30, choline: 550 },
  F_9_13:      { vitA: 600, vitC: 45, vitD: 15, vitE: 11, vitK: 60,  thiamin: 0.9, riboflavin: 0.9, niacin: 12, vitB6: 1.0, folate: 300, vitB12: 1.8, pantothenicAcid: 4,   biotin: 20, choline: 375 },
  F_14_18:     { vitA: 700, vitC: 65, vitD: 15, vitE: 15, vitK: 75,  thiamin: 1.0, riboflavin: 1.0, niacin: 14, vitB6: 1.2, folate: 400, vitB12: 2.4, pantothenicAcid: 5,   biotin: 25, choline: 400 },
  F_19_30:     { vitA: 700, vitC: 75, vitD: 15, vitE: 15, vitK: 90,  thiamin: 1.1, riboflavin: 1.1, niacin: 14, vitB6: 1.3, folate: 400, vitB12: 2.4, pantothenicAcid: 5,   biotin: 30, choline: 425 },
  F_31_50:     { vitA: 700, vitC: 75, vitD: 15, vitE: 15, vitK: 90,  thiamin: 1.1, riboflavin: 1.1, niacin: 14, vitB6: 1.3, folate: 400, vitB12: 2.4, pantothenicAcid: 5,   biotin: 30, choline: 425 },
  F_51_70:     { vitA: 700, vitC: 75, vitD: 15, vitE: 15, vitK: 90,  thiamin: 1.1, riboflavin: 1.1, niacin: 14, vitB6: 1.5, folate: 400, vitB12: 2.4, pantothenicAcid: 5,   biotin: 30, choline: 425 },
  F_70P:       { vitA: 700, vitC: 75, vitD: 20, vitE: 15, vitK: 90,  thiamin: 1.1, riboflavin: 1.1, niacin: 14, vitB6: 1.5, folate: 400, vitB12: 2.4, pantothenicAcid: 5,   biotin: 30, choline: 425 },
  PREG_14_18:  { vitA: 750, vitC: 80, vitD: 15, vitE: 15, vitK: 75,  thiamin: 1.4, riboflavin: 1.4, niacin: 18, vitB6: 1.9, folate: 600, vitB12: 2.6, pantothenicAcid: 6,   biotin: 30, choline: 450 },
  PREG_19_30:  { vitA: 770, vitC: 85, vitD: 15, vitE: 15, vitK: 90,  thiamin: 1.4, riboflavin: 1.4, niacin: 18, vitB6: 1.9, folate: 600, vitB12: 2.6, pantothenicAcid: 6,   biotin: 30, choline: 450 },
  PREG_31_50:  { vitA: 770, vitC: 85, vitD: 15, vitE: 15, vitK: 90,  thiamin: 1.4, riboflavin: 1.4, niacin: 18, vitB6: 1.9, folate: 600, vitB12: 2.6, pantothenicAcid: 6,   biotin: 30, choline: 450 },
  LACT_14_18:  { vitA: 1200,vitC: 115,vitD: 15, vitE: 19, vitK: 75,  thiamin: 1.4, riboflavin: 1.6, niacin: 17, vitB6: 2.0, folate: 500, vitB12: 2.8, pantothenicAcid: 7,   biotin: 35, choline: 550 },
  LACT_19_30:  { vitA: 1300,vitC: 120,vitD: 15, vitE: 19, vitK: 90,  thiamin: 1.4, riboflavin: 1.6, niacin: 17, vitB6: 2.0, folate: 500, vitB12: 2.8, pantothenicAcid: 7,   biotin: 35, choline: 550 },
  LACT_31_50:  { vitA: 1300,vitC: 120,vitD: 15, vitE: 19, vitK: 90,  thiamin: 1.4, riboflavin: 1.6, niacin: 17, vitB6: 2.0, folate: 500, vitB12: 2.8, pantothenicAcid: 7,   biotin: 35, choline: 550 },
};

export const VITAMIN_META = {
  vitA:            { compound: 'Vitamin A',         unit: 'µg' },
  vitC:            { compound: 'Vitamin C',         unit: 'mg' },
  vitD:            { compound: 'Vitamin D',         unit: 'µg' },
  vitE:            { compound: 'Vitamin E',         unit: 'mg' },
  vitK:            { compound: 'Vitamin K',         unit: 'µg' },
  thiamin:         { compound: 'Thiamin',           unit: 'mg' },
  riboflavin:      { compound: 'Riboflavin',        unit: 'mg' },
  niacin:          { compound: 'Niacin',            unit: 'mg' },
  vitB6:           { compound: 'Vitamin B6',        unit: 'mg' },
  folate:          { compound: 'Folate',            unit: 'µg' },
  vitB12:          { compound: 'Vitamin B12',       unit: 'µg' },
  pantothenicAcid: { compound: 'Pantothenic Acid',  unit: 'mg' },
  biotin:          { compound: 'Biotin',            unit: 'µg' },
  choline:         { compound: 'Choline',           unit: 'mg' },
} as const;

// ═══════════════════════════════════════════════════════════════
// Table: RDA/AI for Minerals (Elements — Table appJ_tab3)
// Sodium/Chloride stored as mg (source gives Chloride in g/d — converted)
// ═══════════════════════════════════════════════════════════════

interface MineralRow {
  calcium: number; chromium: number; copper: number; fluoride: number;
  iodine: number; iron: number; magnesium: number; manganese: number;
  molybdenum: number; phosphorus: number; selenium: number; zinc: number;
  potassium: number; sodium: number; chloride_g: number; // chloride in grams
}

export const MINERALS: Record<DemoKey, MineralRow> = {
  INFANT_0_6:  { calcium: 200,  chromium: 0.2,  copper: 200,  fluoride: 0.01, iodine: 110, iron: 0.27, magnesium: 30,  manganese: 0.003, molybdenum: 2,   phosphorus: 100,  selenium: 15, zinc: 2,  potassium: 400,   sodium: 110,   chloride_g: 0.18 },
  INFANT_7_12: { calcium: 260,  chromium: 5.5,  copper: 220,  fluoride: 0.5,  iodine: 130, iron: 11,   magnesium: 75,  manganese: 0.6,   molybdenum: 3,   phosphorus: 275,  selenium: 20, zinc: 3,  potassium: 860,   sodium: 370,   chloride_g: 0.57 },
  CHILD_1_3:   { calcium: 700,  chromium: 11,   copper: 340,  fluoride: 0.7,  iodine: 90,  iron: 7,    magnesium: 80,  manganese: 1.2,   molybdenum: 17,  phosphorus: 460,  selenium: 20, zinc: 3,  potassium: 2000,  sodium: 800,   chloride_g: 1.5 },
  CHILD_4_8:   { calcium: 1000, chromium: 15,   copper: 440,  fluoride: 1,    iodine: 90,  iron: 10,   magnesium: 130, manganese: 1.5,   molybdenum: 22,  phosphorus: 500,  selenium: 30, zinc: 5,  potassium: 2300,  sodium: 1000,  chloride_g: 1.9 },
  M_9_13:      { calcium: 1300, chromium: 25,   copper: 700,  fluoride: 2,    iodine: 120, iron: 8,    magnesium: 240, manganese: 1.9,   molybdenum: 34,  phosphorus: 1250, selenium: 40, zinc: 8,  potassium: 2500,  sodium: 1200,  chloride_g: 2.3 },
  M_14_18:     { calcium: 1300, chromium: 35,   copper: 890,  fluoride: 3,    iodine: 150, iron: 11,   magnesium: 410, manganese: 2.2,   molybdenum: 43,  phosphorus: 1250, selenium: 55, zinc: 11, potassium: 3000,  sodium: 1500,  chloride_g: 2.3 },
  M_19_30:     { calcium: 1000, chromium: 35,   copper: 900,  fluoride: 4,    iodine: 150, iron: 8,    magnesium: 400, manganese: 2.3,   molybdenum: 45,  phosphorus: 700,  selenium: 55, zinc: 11, potassium: 3400,  sodium: 1500,  chloride_g: 2.3 },
  M_31_50:     { calcium: 1000, chromium: 35,   copper: 900,  fluoride: 4,    iodine: 150, iron: 8,    magnesium: 420, manganese: 2.3,   molybdenum: 45,  phosphorus: 700,  selenium: 55, zinc: 11, potassium: 3400,  sodium: 1500,  chloride_g: 2.3 },
  M_51_70:     { calcium: 1000, chromium: 30,   copper: 900,  fluoride: 4,    iodine: 150, iron: 8,    magnesium: 420, manganese: 2.3,   molybdenum: 45,  phosphorus: 700,  selenium: 55, zinc: 11, potassium: 3400,  sodium: 1500,  chloride_g: 2.0 },
  M_70P:       { calcium: 1200, chromium: 30,   copper: 900,  fluoride: 4,    iodine: 150, iron: 8,    magnesium: 420, manganese: 2.3,   molybdenum: 45,  phosphorus: 700,  selenium: 55, zinc: 11, potassium: 3400,  sodium: 1500,  chloride_g: 1.8 },
  F_9_13:      { calcium: 1300, chromium: 21,   copper: 700,  fluoride: 2,    iodine: 120, iron: 8,    magnesium: 240, manganese: 1.6,   molybdenum: 34,  phosphorus: 1250, selenium: 40, zinc: 8,  potassium: 2300,  sodium: 1200,  chloride_g: 2.3 },
  F_14_18:     { calcium: 1300, chromium: 24,   copper: 890,  fluoride: 3,    iodine: 150, iron: 15,   magnesium: 360, manganese: 1.6,   molybdenum: 43,  phosphorus: 1250, selenium: 55, zinc: 9,  potassium: 2300,  sodium: 1500,  chloride_g: 2.3 },
  F_19_30:     { calcium: 1000, chromium: 25,   copper: 900,  fluoride: 3,    iodine: 150, iron: 18,   magnesium: 310, manganese: 1.8,   molybdenum: 45,  phosphorus: 700,  selenium: 55, zinc: 8,  potassium: 2600,  sodium: 1500,  chloride_g: 2.3 },
  F_31_50:     { calcium: 1000, chromium: 25,   copper: 900,  fluoride: 3,    iodine: 150, iron: 18,   magnesium: 320, manganese: 1.8,   molybdenum: 45,  phosphorus: 700,  selenium: 55, zinc: 8,  potassium: 2600,  sodium: 1500,  chloride_g: 2.3 },
  F_51_70:     { calcium: 1200, chromium: 20,   copper: 900,  fluoride: 3,    iodine: 150, iron: 8,    magnesium: 320, manganese: 1.8,   molybdenum: 45,  phosphorus: 700,  selenium: 55, zinc: 8,  potassium: 2600,  sodium: 1500,  chloride_g: 2.0 },
  F_70P:       { calcium: 1200, chromium: 20,   copper: 900,  fluoride: 3,    iodine: 150, iron: 8,    magnesium: 320, manganese: 1.8,   molybdenum: 45,  phosphorus: 700,  selenium: 55, zinc: 8,  potassium: 2600,  sodium: 1500,  chloride_g: 1.8 },
  PREG_14_18:  { calcium: 1300, chromium: 29,   copper: 1000, fluoride: 3,    iodine: 220, iron: 27,   magnesium: 400, manganese: 2.0,   molybdenum: 50,  phosphorus: 1250, selenium: 60, zinc: 12, potassium: 2600,  sodium: 1500,  chloride_g: 2.3 },
  PREG_19_30:  { calcium: 1000, chromium: 30,   copper: 1000, fluoride: 3,    iodine: 220, iron: 27,   magnesium: 350, manganese: 2.0,   molybdenum: 50,  phosphorus: 700,  selenium: 60, zinc: 11, potassium: 2900,  sodium: 1500,  chloride_g: 2.3 },
  PREG_31_50:  { calcium: 1000, chromium: 30,   copper: 1000, fluoride: 3,    iodine: 220, iron: 27,   magnesium: 360, manganese: 2.0,   molybdenum: 50,  phosphorus: 700,  selenium: 60, zinc: 11, potassium: 2900,  sodium: 1500,  chloride_g: 2.3 },
  LACT_14_18:  { calcium: 1300, chromium: 44,   copper: 1300, fluoride: 3,    iodine: 290, iron: 10,   magnesium: 360, manganese: 2.6,   molybdenum: 50,  phosphorus: 1250, selenium: 70, zinc: 13, potassium: 2500,  sodium: 1500,  chloride_g: 2.3 },
  LACT_19_30:  { calcium: 1000, chromium: 45,   copper: 1300, fluoride: 3,    iodine: 290, iron: 9,    magnesium: 310, manganese: 2.6,   molybdenum: 50,  phosphorus: 700,  selenium: 70, zinc: 12, potassium: 2800,  sodium: 1500,  chloride_g: 2.3 },
  LACT_31_50:  { calcium: 1000, chromium: 45,   copper: 1300, fluoride: 3,    iodine: 290, iron: 9,    magnesium: 320, manganese: 2.6,   molybdenum: 50,  phosphorus: 700,  selenium: 70, zinc: 12, potassium: 2800,  sodium: 1500,  chloride_g: 2.3 },
};

export const MINERAL_META = {
  calcium:     { compound: 'Calcium',    unit: 'mg' },
  chromium:    { compound: 'Chromium',   unit: 'µg' },
  copper:      { compound: 'Copper',     unit: 'µg' },
  fluoride:    { compound: 'Fluoride',   unit: 'mg' },
  iodine:      { compound: 'Iodine',     unit: 'µg' },
  iron:        { compound: 'Iron',       unit: 'mg' },
  magnesium:   { compound: 'Magnesium',  unit: 'mg' },
  manganese:   { compound: 'Manganese',  unit: 'mg' },
  molybdenum:  { compound: 'Molybdenum', unit: 'µg' },
  phosphorus:  { compound: 'Phosphorus', unit: 'mg' },
  selenium:    { compound: 'Selenium',   unit: 'µg' },
  zinc:        { compound: 'Zinc',       unit: 'mg' },
  potassium:   { compound: 'Potassium',  unit: 'mg' },
  sodium:      { compound: 'Sodium',     unit: 'mg' },
  chloride_g:  { compound: 'Chloride',   unit: 'mg', fromGrams: true },
} as const;

// ═══════════════════════════════════════════════════════════════
// Table: Macros (Table appJ_tab4) — Water, Carbs, Fiber, Protein
// Fat = ND (skip)
// ═══════════════════════════════════════════════════════════════

interface MacroRow {
  water_L: number; carbs_g: number; fiber_g: number | null; protein_g: number;
}

export const MACROS: Record<DemoKey, MacroRow> = {
  INFANT_0_6:  { water_L: 0.7, carbs_g: 60,  fiber_g: null, protein_g: 9.1 },
  INFANT_7_12: { water_L: 0.8, carbs_g: 95,  fiber_g: null, protein_g: 11.0 },
  CHILD_1_3:   { water_L: 1.3, carbs_g: 130, fiber_g: 19,   protein_g: 13 },
  CHILD_4_8:   { water_L: 1.7, carbs_g: 130, fiber_g: 25,   protein_g: 19 },
  M_9_13:      { water_L: 2.4, carbs_g: 130, fiber_g: 31,   protein_g: 34 },
  M_14_18:     { water_L: 3.3, carbs_g: 130, fiber_g: 38,   protein_g: 52 },
  M_19_30:     { water_L: 3.7, carbs_g: 130, fiber_g: 38,   protein_g: 56 },
  M_31_50:     { water_L: 3.7, carbs_g: 130, fiber_g: 38,   protein_g: 56 },
  M_51_70:     { water_L: 3.7, carbs_g: 130, fiber_g: 30,   protein_g: 56 },
  M_70P:       { water_L: 3.7, carbs_g: 130, fiber_g: 30,   protein_g: 56 },
  F_9_13:      { water_L: 2.1, carbs_g: 130, fiber_g: 26,   protein_g: 34 },
  F_14_18:     { water_L: 2.3, carbs_g: 130, fiber_g: 26,   protein_g: 46 },
  F_19_30:     { water_L: 2.7, carbs_g: 130, fiber_g: 25,   protein_g: 46 },
  F_31_50:     { water_L: 2.7, carbs_g: 130, fiber_g: 25,   protein_g: 46 },
  F_51_70:     { water_L: 2.7, carbs_g: 130, fiber_g: 21,   protein_g: 46 },
  F_70P:       { water_L: 2.7, carbs_g: 130, fiber_g: 21,   protein_g: 46 },
  PREG_14_18:  { water_L: 3.0, carbs_g: 175, fiber_g: 28,   protein_g: 71 },
  PREG_19_30:  { water_L: 3.0, carbs_g: 175, fiber_g: 28,   protein_g: 71 },
  PREG_31_50:  { water_L: 3.0, carbs_g: 175, fiber_g: 28,   protein_g: 71 },
  LACT_14_18:  { water_L: 3.8, carbs_g: 210, fiber_g: 29,   protein_g: 71 },
  LACT_19_30:  { water_L: 3.8, carbs_g: 210, fiber_g: 29,   protein_g: 71 },
  LACT_31_50:  { water_L: 3.8, carbs_g: 210, fiber_g: 29,   protein_g: 71 },
};

// ═══════════════════════════════════════════════════════════════
// Table: Vitamin ULs (Table appJ_tab8). null = ND.
// UL table collapses 19-30/31-50/51-70/>70 into a single 19-70y + >70y group.
// Pregnancy and lactation collapse 19-30/31-50 → 19-50.
// ═══════════════════════════════════════════════════════════════

interface VitaminULRow {
  vitA: number | null; vitC: number | null; vitD: number | null;
  vitE: number | null; niacin: number | null; vitB6: number | null;
  folate: number | null; choline_g: number | null; // choline in grams
}

type ULDemoKey =
  | 'INFANT_0_6' | 'INFANT_7_12' | 'CHILD_1_3' | 'CHILD_4_8'
  | 'M_9_13' | 'M_14_18' | 'M_19_70' | 'M_70P'
  | 'F_9_13' | 'F_14_18' | 'F_19_70' | 'F_70P'
  | 'PREG_14_18' | 'PREG_19_50'
  | 'LACT_14_18' | 'LACT_19_50';

export const UL_DEMOS: Record<ULDemoKey, { minMonths: number; maxMonths: number | null; sex: Sex | 'BOTH'; lifeStage: LifeStage }> = {
  INFANT_0_6:  { minMonths: 0,   maxMonths: 6,    sex: 'BOTH',   lifeStage: 'NONE' },
  INFANT_7_12: { minMonths: 7,   maxMonths: 12,   sex: 'BOTH',   lifeStage: 'NONE' },
  CHILD_1_3:   { minMonths: 12,  maxMonths: 47,   sex: 'BOTH',   lifeStage: 'NONE' },
  CHILD_4_8:   { minMonths: 48,  maxMonths: 107,  sex: 'BOTH',   lifeStage: 'NONE' },
  M_9_13:      { minMonths: 108, maxMonths: 167,  sex: 'MALE',   lifeStage: 'NONE' },
  M_14_18:     { minMonths: 168, maxMonths: 227,  sex: 'MALE',   lifeStage: 'NONE' },
  M_19_70:     { minMonths: 228, maxMonths: 851,  sex: 'MALE',   lifeStage: 'NONE' },
  M_70P:       { minMonths: 852, maxMonths: null, sex: 'MALE',   lifeStage: 'NONE' },
  F_9_13:      { minMonths: 108, maxMonths: 167,  sex: 'FEMALE', lifeStage: 'NONE' },
  F_14_18:     { minMonths: 168, maxMonths: 227,  sex: 'FEMALE', lifeStage: 'NONE' },
  F_19_70:     { minMonths: 228, maxMonths: 851,  sex: 'FEMALE', lifeStage: 'NONE' },
  F_70P:       { minMonths: 852, maxMonths: null, sex: 'FEMALE', lifeStage: 'NONE' },
  PREG_14_18:  { minMonths: 168, maxMonths: 227,  sex: 'FEMALE', lifeStage: 'PREGNANT' },
  PREG_19_50:  { minMonths: 228, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT' },
  LACT_14_18:  { minMonths: 168, maxMonths: 227,  sex: 'FEMALE', lifeStage: 'LACTATING' },
  LACT_19_50:  { minMonths: 228, maxMonths: 611,  sex: 'FEMALE', lifeStage: 'LACTATING' },
};

export const VITAMIN_UL: Record<ULDemoKey, VitaminULRow> = {
  INFANT_0_6:  { vitA: 600,   vitC: null, vitD: 25,  vitE: null,  niacin: null, vitB6: null, folate: null, choline_g: null },
  INFANT_7_12: { vitA: 600,   vitC: null, vitD: 38,  vitE: null,  niacin: null, vitB6: null, folate: null, choline_g: null },
  CHILD_1_3:   { vitA: 600,   vitC: 400,  vitD: 63,  vitE: 200,   niacin: 10,   vitB6: 30,   folate: 300,  choline_g: 1.0 },
  CHILD_4_8:   { vitA: 900,   vitC: 650,  vitD: 75,  vitE: 300,   niacin: 15,   vitB6: 40,   folate: 400,  choline_g: 1.0 },
  M_9_13:      { vitA: 1700,  vitC: 1200, vitD: 100, vitE: 600,   niacin: 20,   vitB6: 60,   folate: 600,  choline_g: 2.0 },
  M_14_18:     { vitA: 2800,  vitC: 1800, vitD: 100, vitE: 800,   niacin: 30,   vitB6: 80,   folate: 800,  choline_g: 3.0 },
  M_19_70:     { vitA: 3000,  vitC: 2000, vitD: 100, vitE: 1000,  niacin: 35,   vitB6: 100,  folate: 1000, choline_g: 3.5 },
  M_70P:       { vitA: 3000,  vitC: 2000, vitD: 100, vitE: 1000,  niacin: 35,   vitB6: 100,  folate: 1000, choline_g: 3.5 },
  F_9_13:      { vitA: 1700,  vitC: 1200, vitD: 100, vitE: 600,   niacin: 20,   vitB6: 60,   folate: 600,  choline_g: 2.0 },
  F_14_18:     { vitA: 2800,  vitC: 1800, vitD: 100, vitE: 800,   niacin: 30,   vitB6: 80,   folate: 800,  choline_g: 3.0 },
  F_19_70:     { vitA: 3000,  vitC: 2000, vitD: 100, vitE: 1000,  niacin: 35,   vitB6: 100,  folate: 1000, choline_g: 3.5 },
  F_70P:       { vitA: 3000,  vitC: 2000, vitD: 100, vitE: 1000,  niacin: 35,   vitB6: 100,  folate: 1000, choline_g: 3.5 },
  PREG_14_18:  { vitA: 2800,  vitC: 1800, vitD: 100, vitE: 800,   niacin: 30,   vitB6: 80,   folate: 800,  choline_g: 3.0 },
  PREG_19_50:  { vitA: 3000,  vitC: 2000, vitD: 100, vitE: 1000,  niacin: 35,   vitB6: 100,  folate: 1000, choline_g: 3.5 },
  LACT_14_18:  { vitA: 2800,  vitC: 1800, vitD: 100, vitE: 800,   niacin: 30,   vitB6: 80,   folate: 800,  choline_g: 3.0 },
  LACT_19_50:  { vitA: 3000,  vitC: 2000, vitD: 100, vitE: 1000,  niacin: 35,   vitB6: 100,  folate: 1000, choline_g: 3.5 },
};

// ═══════════════════════════════════════════════════════════════
// Table: Mineral ULs (Table appJ_tab9). null = ND.
// Uses same 22-demographic structure as RDA/AI minerals, with pregnancy
// 14-18 + 19-30 + 31-50, lactation similar.
// ═══════════════════════════════════════════════════════════════

interface MineralULRow {
  calcium: number | null; phosphorus_g: number | null; magnesium: number | null;
  iron: number | null; zinc: number | null; copper: number | null;
  manganese: number | null; fluoride: number | null; selenium: number | null;
  iodine: number | null; molybdenum: number | null; chloride_g: number | null;
}

export const MINERAL_UL: Record<DemoKey, MineralULRow> = {
  INFANT_0_6:  { calcium: 1000, phosphorus_g: null, magnesium: null, iron: 40, zinc: 4,  copper: null,   manganese: null, fluoride: 0.7, selenium: 45,  iodine: null, molybdenum: null, chloride_g: null },
  INFANT_7_12: { calcium: 1500, phosphorus_g: null, magnesium: null, iron: 40, zinc: 5,  copper: null,   manganese: null, fluoride: 0.9, selenium: 60,  iodine: null, molybdenum: null, chloride_g: null },
  CHILD_1_3:   { calcium: 2500, phosphorus_g: 3,    magnesium: 65,   iron: 40, zinc: 7,  copper: 1000,   manganese: 2,    fluoride: 1.3, selenium: 90,  iodine: 200,  molybdenum: 300,  chloride_g: 2.3 },
  CHILD_4_8:   { calcium: 2500, phosphorus_g: 3,    magnesium: 110,  iron: 40, zinc: 12, copper: 3000,   manganese: 3,    fluoride: 2.2, selenium: 150, iodine: 300,  molybdenum: 600,  chloride_g: 2.9 },
  M_9_13:      { calcium: 3000, phosphorus_g: 4,    magnesium: 350,  iron: 40, zinc: 23, copper: 5000,   manganese: 6,    fluoride: 10,  selenium: 280, iodine: 600,  molybdenum: 1100, chloride_g: 3.4 },
  M_14_18:     { calcium: 3000, phosphorus_g: 4,    magnesium: 350,  iron: 45, zinc: 34, copper: 8000,   manganese: 9,    fluoride: 10,  selenium: 400, iodine: 900,  molybdenum: 1700, chloride_g: 3.6 },
  M_19_30:     { calcium: 2500, phosphorus_g: 4,    magnesium: 350,  iron: 45, zinc: 40, copper: 10000,  manganese: 11,   fluoride: 10,  selenium: 400, iodine: 1100, molybdenum: 2000, chloride_g: 3.6 },
  M_31_50:     { calcium: 2500, phosphorus_g: 4,    magnesium: 350,  iron: 45, zinc: 40, copper: 10000,  manganese: 11,   fluoride: 10,  selenium: 400, iodine: 1100, molybdenum: 2000, chloride_g: 3.6 },
  M_51_70:     { calcium: 2000, phosphorus_g: 4,    magnesium: 350,  iron: 45, zinc: 40, copper: 10000,  manganese: 11,   fluoride: 10,  selenium: 400, iodine: 1100, molybdenum: 2000, chloride_g: 3.6 },
  M_70P:       { calcium: 2000, phosphorus_g: 3,    magnesium: 350,  iron: 45, zinc: 40, copper: 10000,  manganese: 11,   fluoride: 10,  selenium: 400, iodine: 1100, molybdenum: 2000, chloride_g: 3.6 },
  F_9_13:      { calcium: 3000, phosphorus_g: 4,    magnesium: 350,  iron: 40, zinc: 23, copper: 5000,   manganese: 6,    fluoride: 10,  selenium: 280, iodine: 600,  molybdenum: 1100, chloride_g: 3.4 },
  F_14_18:     { calcium: 3000, phosphorus_g: 4,    magnesium: 350,  iron: 45, zinc: 34, copper: 8000,   manganese: 9,    fluoride: 10,  selenium: 400, iodine: 900,  molybdenum: 1700, chloride_g: 3.6 },
  F_19_30:     { calcium: 2500, phosphorus_g: 4,    magnesium: 350,  iron: 45, zinc: 40, copper: 10000,  manganese: 11,   fluoride: 10,  selenium: 400, iodine: 1100, molybdenum: 2000, chloride_g: 3.6 },
  F_31_50:     { calcium: 2500, phosphorus_g: 4,    magnesium: 350,  iron: 45, zinc: 40, copper: 10000,  manganese: 11,   fluoride: 10,  selenium: 400, iodine: 1100, molybdenum: 2000, chloride_g: 3.6 },
  F_51_70:     { calcium: 2000, phosphorus_g: 4,    magnesium: 350,  iron: 45, zinc: 40, copper: 10000,  manganese: 11,   fluoride: 10,  selenium: 400, iodine: 1100, molybdenum: 2000, chloride_g: 3.6 },
  F_70P:       { calcium: 2000, phosphorus_g: 3,    magnesium: 350,  iron: 45, zinc: 40, copper: 10000,  manganese: 11,   fluoride: 10,  selenium: 400, iodine: 1100, molybdenum: 2000, chloride_g: 3.6 },
  PREG_14_18:  { calcium: 3000, phosphorus_g: 3.5,  magnesium: 350,  iron: 45, zinc: 34, copper: 8000,   manganese: 9,    fluoride: 10,  selenium: 400, iodine: 900,  molybdenum: 1700, chloride_g: 3.6 },
  PREG_19_30:  { calcium: 2500, phosphorus_g: 3.5,  magnesium: 350,  iron: 45, zinc: 40, copper: 10000,  manganese: 11,   fluoride: 10,  selenium: 400, iodine: 1100, molybdenum: 2000, chloride_g: 3.6 },
  PREG_31_50:  { calcium: 2500, phosphorus_g: 3.5,  magnesium: 350,  iron: 45, zinc: 40, copper: 10000,  manganese: 11,   fluoride: 10,  selenium: 400, iodine: 1100, molybdenum: 2000, chloride_g: 3.6 },
  LACT_14_18:  { calcium: 3000, phosphorus_g: 4,    magnesium: 350,  iron: 45, zinc: 34, copper: 8000,   manganese: 9,    fluoride: 10,  selenium: 400, iodine: 900,  molybdenum: 1700, chloride_g: 3.6 },
  LACT_19_30:  { calcium: 2500, phosphorus_g: 4,    magnesium: 350,  iron: 45, zinc: 40, copper: 10000,  manganese: 11,   fluoride: 10,  selenium: 400, iodine: 1100, molybdenum: 2000, chloride_g: 3.6 },
  LACT_31_50:  { calcium: 2500, phosphorus_g: 4,    magnesium: 350,  iron: 45, zinc: 40, copper: 10000,  manganese: 11,   fluoride: 10,  selenium: 400, iodine: 1100, molybdenum: 2000, chloride_g: 3.6 },
};

// ═══════════════════════════════════════════════════════════════
// Sodium CDRR (Table appJ_tab7). Simpler structure: just 5 age bands.
// ═══════════════════════════════════════════════════════════════

export const SODIUM_CDRR: Array<{ minMonths: number; maxMonths: number | null; value_mg: number }> = [
  { minMonths: 12,  maxMonths: 47,   value_mg: 1200 },
  { minMonths: 48,  maxMonths: 107,  value_mg: 1500 },
  { minMonths: 108, maxMonths: 167,  value_mg: 1800 },
  { minMonths: 168, maxMonths: 227,  value_mg: 2300 },
  { minMonths: 228, maxMonths: null, value_mg: 2300 },
];

// ═══════════════════════════════════════════════════════════════
// NIH reference body weights (kg) — used to compute protein EAR g/d
// from the published g/kg bw EAR. From NAM/IOM 2005 DRI Macronutrients.
// Infants omitted (no EAR).
// ═══════════════════════════════════════════════════════════════

export const REF_WEIGHTS_KG: Partial<Record<DemoKey, { M?: number; F?: number }>> = {
  CHILD_1_3:   { M: 12,   F: 12 },
  CHILD_4_8:   { M: 20,   F: 20 },
  M_9_13:      { M: 36 },
  M_14_18:     { M: 61 },
  M_19_30:     { M: 70 }, M_31_50: { M: 70 }, M_51_70: { M: 70 }, M_70P: { M: 70 },
  F_9_13:      { F: 37 },
  F_14_18:     { F: 54 },
  F_19_30:     { F: 57 }, F_31_50: { F: 57 }, F_51_70: { F: 57 }, F_70P: { F: 57 },
  PREG_14_18:  { F: 54 }, PREG_19_30: { F: 57 }, PREG_31_50: { F: 57 },
  LACT_14_18:  { F: 54 }, LACT_19_30: { F: 57 }, LACT_31_50: { F: 57 },
};

// ═══════════════════════════════════════════════════════════════
// Table: EARs (Table appJ_tab1) — infants have no EARs
// Protein as g/kg bw/d (multiply by ref weight for g/d).
// Note: Fluoride, Pantothenic Acid, Biotin, Choline, Vit K, Chromium,
// Manganese, Chloride, Sodium/Potassium, Fat, Fiber, Water have NO EARs.
// ═══════════════════════════════════════════════════════════════

interface EARRow {
  calcium: number; carbs: number; proteinPerKg: number;
  vitA: number; vitC: number; vitD: number; vitE: number;
  thiamin: number; riboflavin: number; niacin: number;
  vitB6: number; folate: number; vitB12: number;
  copper: number; iodine: number; iron: number; magnesium: number;
  molybdenum: number; phosphorus: number; selenium: number; zinc: number;
}

export const EARS: Partial<Record<DemoKey, EARRow>> = {
  CHILD_1_3:   { calcium: 500,  carbs: 100, proteinPerKg: 0.87, vitA: 210, vitC: 13, vitD: 10, vitE: 5,  thiamin: 0.4, riboflavin: 0.4, niacin: 5,  vitB6: 0.4, folate: 120, vitB12: 0.7, copper: 260, iodine: 65,  iron: 3.0, magnesium: 65,  molybdenum: 13, phosphorus: 380,  selenium: 17, zinc: 2.5 },
  CHILD_4_8:   { calcium: 800,  carbs: 100, proteinPerKg: 0.76, vitA: 275, vitC: 22, vitD: 10, vitE: 6,  thiamin: 0.5, riboflavin: 0.5, niacin: 6,  vitB6: 0.5, folate: 160, vitB12: 1.0, copper: 340, iodine: 65,  iron: 4.1, magnesium: 110, molybdenum: 17, phosphorus: 405,  selenium: 23, zinc: 4.0 },
  M_9_13:      { calcium: 1100, carbs: 100, proteinPerKg: 0.76, vitA: 445, vitC: 39, vitD: 10, vitE: 9,  thiamin: 0.7, riboflavin: 0.8, niacin: 9,  vitB6: 0.8, folate: 250, vitB12: 1.5, copper: 540, iodine: 73,  iron: 5.9, magnesium: 200, molybdenum: 26, phosphorus: 1055, selenium: 35, zinc: 7.0 },
  M_14_18:     { calcium: 1100, carbs: 100, proteinPerKg: 0.73, vitA: 630, vitC: 63, vitD: 10, vitE: 12, thiamin: 1.0, riboflavin: 1.1, niacin: 12, vitB6: 1.1, folate: 330, vitB12: 2.0, copper: 685, iodine: 95,  iron: 7.7, magnesium: 340, molybdenum: 33, phosphorus: 1055, selenium: 45, zinc: 8.5 },
  M_19_30:     { calcium: 800,  carbs: 100, proteinPerKg: 0.66, vitA: 625, vitC: 75, vitD: 10, vitE: 12, thiamin: 1.0, riboflavin: 1.1, niacin: 12, vitB6: 1.1, folate: 320, vitB12: 2.0, copper: 700, iodine: 95,  iron: 6.0, magnesium: 330, molybdenum: 34, phosphorus: 580,  selenium: 45, zinc: 9.4 },
  M_31_50:     { calcium: 800,  carbs: 100, proteinPerKg: 0.66, vitA: 625, vitC: 75, vitD: 10, vitE: 12, thiamin: 1.0, riboflavin: 1.1, niacin: 12, vitB6: 1.1, folate: 320, vitB12: 2.0, copper: 700, iodine: 95,  iron: 6.0, magnesium: 350, molybdenum: 34, phosphorus: 580,  selenium: 45, zinc: 9.4 },
  M_51_70:     { calcium: 800,  carbs: 100, proteinPerKg: 0.66, vitA: 625, vitC: 75, vitD: 10, vitE: 12, thiamin: 1.0, riboflavin: 1.1, niacin: 12, vitB6: 1.4, folate: 320, vitB12: 2.0, copper: 700, iodine: 95,  iron: 6.0, magnesium: 350, molybdenum: 34, phosphorus: 580,  selenium: 45, zinc: 9.4 },
  M_70P:       { calcium: 1000, carbs: 100, proteinPerKg: 0.66, vitA: 625, vitC: 75, vitD: 10, vitE: 12, thiamin: 1.0, riboflavin: 1.1, niacin: 12, vitB6: 1.4, folate: 320, vitB12: 2.0, copper: 700, iodine: 95,  iron: 6.0, magnesium: 350, molybdenum: 34, phosphorus: 580,  selenium: 45, zinc: 9.4 },
  F_9_13:      { calcium: 1100, carbs: 100, proteinPerKg: 0.76, vitA: 420, vitC: 39, vitD: 10, vitE: 9,  thiamin: 0.7, riboflavin: 0.8, niacin: 9,  vitB6: 0.8, folate: 250, vitB12: 1.5, copper: 540, iodine: 73,  iron: 5.7, magnesium: 200, molybdenum: 26, phosphorus: 1055, selenium: 35, zinc: 7.0 },
  F_14_18:     { calcium: 1100, carbs: 100, proteinPerKg: 0.71, vitA: 485, vitC: 56, vitD: 10, vitE: 12, thiamin: 0.9, riboflavin: 0.9, niacin: 11, vitB6: 1.0, folate: 330, vitB12: 2.0, copper: 685, iodine: 95,  iron: 7.9, magnesium: 300, molybdenum: 33, phosphorus: 1055, selenium: 45, zinc: 7.3 },
  F_19_30:     { calcium: 800,  carbs: 100, proteinPerKg: 0.66, vitA: 500, vitC: 60, vitD: 10, vitE: 12, thiamin: 0.9, riboflavin: 0.9, niacin: 11, vitB6: 1.1, folate: 320, vitB12: 2.0, copper: 700, iodine: 95,  iron: 8.1, magnesium: 255, molybdenum: 34, phosphorus: 580,  selenium: 45, zinc: 6.8 },
  F_31_50:     { calcium: 800,  carbs: 100, proteinPerKg: 0.66, vitA: 500, vitC: 60, vitD: 10, vitE: 12, thiamin: 0.9, riboflavin: 0.9, niacin: 11, vitB6: 1.1, folate: 320, vitB12: 2.0, copper: 700, iodine: 95,  iron: 8.1, magnesium: 265, molybdenum: 34, phosphorus: 580,  selenium: 45, zinc: 6.8 },
  F_51_70:     { calcium: 1000, carbs: 100, proteinPerKg: 0.66, vitA: 500, vitC: 60, vitD: 10, vitE: 12, thiamin: 0.9, riboflavin: 0.9, niacin: 11, vitB6: 1.3, folate: 320, vitB12: 2.0, copper: 700, iodine: 95,  iron: 5.0, magnesium: 265, molybdenum: 34, phosphorus: 580,  selenium: 45, zinc: 6.8 },
  F_70P:       { calcium: 1000, carbs: 100, proteinPerKg: 0.66, vitA: 500, vitC: 60, vitD: 10, vitE: 12, thiamin: 0.9, riboflavin: 0.9, niacin: 11, vitB6: 1.3, folate: 320, vitB12: 2.0, copper: 700, iodine: 95,  iron: 5.0, magnesium: 265, molybdenum: 34, phosphorus: 580,  selenium: 45, zinc: 6.8 },
  PREG_14_18:  { calcium: 1000, carbs: 135, proteinPerKg: 0.88, vitA: 530, vitC: 66, vitD: 10, vitE: 12, thiamin: 1.2, riboflavin: 1.2, niacin: 14, vitB6: 1.6, folate: 520, vitB12: 2.2, copper: 785, iodine: 160, iron: 23,  magnesium: 335, molybdenum: 40, phosphorus: 1055, selenium: 49, zinc: 10.5 },
  PREG_19_30:  { calcium: 800,  carbs: 135, proteinPerKg: 0.88, vitA: 550, vitC: 70, vitD: 10, vitE: 12, thiamin: 1.2, riboflavin: 1.2, niacin: 14, vitB6: 1.6, folate: 520, vitB12: 2.2, copper: 800, iodine: 160, iron: 22,  magnesium: 290, molybdenum: 40, phosphorus: 580,  selenium: 49, zinc: 9.5 },
  PREG_31_50:  { calcium: 800,  carbs: 135, proteinPerKg: 0.88, vitA: 550, vitC: 70, vitD: 10, vitE: 12, thiamin: 1.2, riboflavin: 1.2, niacin: 14, vitB6: 1.6, folate: 520, vitB12: 2.2, copper: 800, iodine: 160, iron: 22,  magnesium: 300, molybdenum: 40, phosphorus: 580,  selenium: 49, zinc: 9.5 },
  LACT_14_18:  { calcium: 1000, carbs: 160, proteinPerKg: 1.05, vitA: 885, vitC: 96, vitD: 10, vitE: 16, thiamin: 1.2, riboflavin: 1.3, niacin: 13, vitB6: 1.7, folate: 450, vitB12: 2.4, copper: 985, iodine: 209, iron: 7.0, magnesium: 300, molybdenum: 35, phosphorus: 1055, selenium: 59, zinc: 10.9 },
  LACT_19_30:  { calcium: 800,  carbs: 160, proteinPerKg: 1.05, vitA: 900, vitC: 100,vitD: 10, vitE: 16, thiamin: 1.2, riboflavin: 1.3, niacin: 13, vitB6: 1.7, folate: 450, vitB12: 2.4, copper: 1000,iodine: 209, iron: 6.5, magnesium: 255, molybdenum: 36, phosphorus: 580,  selenium: 59, zinc: 10.4 },
  LACT_31_50:  { calcium: 800,  carbs: 160, proteinPerKg: 1.05, vitA: 900, vitC: 100,vitD: 10, vitE: 16, thiamin: 1.2, riboflavin: 1.3, niacin: 13, vitB6: 1.7, folate: 450, vitB12: 2.4, copper: 1000,iodine: 209, iron: 6.5, magnesium: 265, molybdenum: 36, phosphorus: 580,  selenium: 59, zinc: 10.4 },
};

// Nutrient-to-compound-name mapping for EAR table iteration
export const EAR_META: Record<keyof EARRow, { compound: string; unit: string } | null> = {
  calcium:    { compound: 'Calcium',    unit: 'mg' },
  carbs:      { compound: 'Carbohydrates', unit: 'g' },
  proteinPerKg: null, // handled specially (×ref weight)
  vitA:       { compound: 'Vitamin A',  unit: 'µg' },
  vitC:       { compound: 'Vitamin C',  unit: 'mg' },
  vitD:       { compound: 'Vitamin D',  unit: 'µg' },
  vitE:       { compound: 'Vitamin E',  unit: 'mg' },
  thiamin:    { compound: 'Thiamin',    unit: 'mg' },
  riboflavin: { compound: 'Riboflavin', unit: 'mg' },
  niacin:     { compound: 'Niacin',     unit: 'mg' },
  vitB6:      { compound: 'Vitamin B6', unit: 'mg' },
  folate:     { compound: 'Folate',     unit: 'µg' },
  vitB12:     { compound: 'Vitamin B12',unit: 'µg' },
  copper:     { compound: 'Copper',     unit: 'µg' },
  iodine:     { compound: 'Iodine',     unit: 'µg' },
  iron:       { compound: 'Iron',       unit: 'mg' },
  magnesium:  { compound: 'Magnesium',  unit: 'mg' },
  molybdenum: { compound: 'Molybdenum', unit: 'µg' },
  phosphorus: { compound: 'Phosphorus', unit: 'mg' },
  selenium:   { compound: 'Selenium',   unit: 'µg' },
  zinc:       { compound: 'Zinc',       unit: 'mg' },
};

// ═══════════════════════════════════════════════════════════════
// AMDR — % of energy, ranges.
// ═══════════════════════════════════════════════════════════════

export const AMDR: Array<{
  minMonths: number; maxMonths: number | null;
  compound: string; min: number; max: number;
}> = [
  // Children 1-3y
  { minMonths: 12, maxMonths: 47, compound: 'Carbohydrates', min: 45, max: 65 },
  { minMonths: 12, maxMonths: 47, compound: 'Protein',       min: 5,  max: 20 },
  { minMonths: 12, maxMonths: 47, compound: 'Total Fat',     min: 30, max: 40 },
  // Children 4-18y
  { minMonths: 48, maxMonths: 227, compound: 'Carbohydrates', min: 45, max: 65 },
  { minMonths: 48, maxMonths: 227, compound: 'Protein',       min: 10, max: 30 },
  { minMonths: 48, maxMonths: 227, compound: 'Total Fat',     min: 25, max: 35 },
  // Adults 19+
  { minMonths: 228, maxMonths: null, compound: 'Carbohydrates', min: 45, max: 65 },
  { minMonths: 228, maxMonths: null, compound: 'Protein',       min: 10, max: 35 },
  { minMonths: 228, maxMonths: null, compound: 'Total Fat',     min: 20, max: 35 },
];
