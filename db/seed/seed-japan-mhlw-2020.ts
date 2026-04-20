/**
 * Seed: MHLW DRI for Japanese (2020)
 *
 * Source: Ministry of Health, Labour and Welfare, Japan — English edition (Dec 2019)
 * Coverage: Energy × 3 PAL, Protein EAR/RDA/AI, Macros DG ranges,
 * 13 vitamins (EAR/RDA/AI/UL), 13 minerals (EAR/RDA/AI/UL).
 * Iron F has menstruating/not-menstruating split. Niacin UL split by form.
 * 14 native age groups × 2 sexes + pregnancy (early/mid/late) + lactation.
 *
 * Run: npx tsx db/seed/seed-japan-mhlw-2020.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const SOURCE = {
  authorityName: 'MHLW Dietary Reference Intakes for Japanese (2020)',
  regionCode: 'JAPAN',
  versionYear: 2020,
  sourceType: 'SCIENTIFIC_DRI' as const,
  url: 'https://www.mhlw.go.jp/content/001151422.pdf',
  note: 'MHLW DRI 2020 — English edition. 5 value types: EAR, RDA, AI, UL, DG (Dietary Goal for LRD prevention = Japan-specific AMDR). 14 age groups × 2 sexes. Energy × 3 PAL levels (I=low, II=medium, III=high). Iron F has menstruating/not-menstruating split (ages 10-64). Niacin UL split: nicotinamide mg / nicotinic acid mg. Mg UL = supplemental only (350 mg/d). Sodium stored as mg with salt equivalent noted. 2025 edition exists but English version not yet available — will upgrade when released.',
  retrievedDate: '2026-04-16',
};

const COMPOUND_NAME_MAP: Record<string, string> = {
  'Vitamin A': 'Vitamin A (RAE)',
  'Vitamin D': 'Vitamin D (Total)',
  'Vitamin E': 'Vitamin E (Total)',
  'Vitamin K': 'Vitamin K (Total)',
  'Thiamin': 'Thiamin (B1)',
  'Riboflavin': 'Riboflavin (B2)',
  'Niacin': 'Niacin (B3)',
  'Vitamin B12': 'Vitamin B12 (Total)',
  'Folate': 'Folate (Total)',
  'Pantothenic Acid': 'Pantothenic Acid (B5)',
  'Biotin': 'Biotin (B7)',
  'Vitamin C': 'Vitamin C (Total)',
  'Calcium': 'Calcium (Total)',
  'Magnesium': 'Magnesium (Total)',
  'Iron': 'Iron (Total)',
  'Zinc': 'Zinc (Total)',
  'Selenium': 'Selenium (Total)',
  'Chromium': 'Chromium (Total)',
};
function resolveDbName(n: string): string {
  return COMPOUND_NAME_MAP[n] ?? n;
}

type Sex = 'MALE' | 'FEMALE';
type LifeStage = 'NONE' | 'PREGNANT' | 'PREGNANT_T1' | 'PREGNANT_T2' | 'PREGNANT_T3' | 'LACTATING';
type Activity = 'SEDENTARY' | 'MODERATE' | 'ACTIVE' | null;
type VT = 'RDA' | 'AI' | 'EAR' | 'UL' | 'AMDR' | 'CDRR';

interface SeedRow {
  compoundName: string;
  ageMinMonths: number;
  ageMaxMonths: number | null;
  sex: Sex;
  lifeStage: LifeStage;
  activityLevel?: Activity;
  valueType: VT;
  value: number;
  valueMin?: number;
  valueMax?: number;
  unit: string;
  isPercentOfEnergy?: boolean;
  valueNote?: string | null;
}

// Age groups: [minMonths, maxMonths]
const AGES: Array<[number, number | null]> = [
  [0, 5], [6, 11], [12, 35], [36, 71], [72, 95], [96, 119], [120, 143],
  [144, 179], [180, 215], [216, 359], [360, 599], [600, 779], [780, 899], [900, null],
];

// Helper: create rows from a simple [M, F] per age table
type MF = [number | null, number | null]; // [male, female]

function addNutrient(
  rows: SeedRow[],
  compound: string, unit: string, valueType: VT,
  data: MF[], note?: string,
) {
  for (let i = 0; i < AGES.length && i < data.length; i++) {
    const [ageMin, ageMax] = AGES[i];
    const [m, f] = data[i];
    if (m != null) rows.push({ compoundName: compound, ageMinMonths: ageMin, ageMaxMonths: ageMax, sex: 'MALE', lifeStage: 'NONE', valueType, value: m, unit, valueNote: note ?? null });
    if (f != null) rows.push({ compoundName: compound, ageMinMonths: ageMin, ageMaxMonths: ageMax, sex: 'FEMALE', lifeStage: 'NONE', valueType, value: f, unit, valueNote: note ?? null });
  }
}

// Helper for pregnancy/lactation additions (female only)
function addPregLact(
  rows: SeedRow[],
  compound: string, unit: string, valueType: VT,
  additions: { preg?: number; pregEarly?: number; pregMid?: number; pregLate?: number; lact?: number },
  note?: string,
) {
  if (additions.preg != null) {
    rows.push({ compoundName: compound, ageMinMonths: 180, ageMaxMonths: 611, sex: 'FEMALE', lifeStage: 'PREGNANT', valueType, value: additions.preg, unit, valueNote: note ?? 'Additional intake for pregnancy' });
  }
  if (additions.pregEarly != null) {
    rows.push({ compoundName: compound, ageMinMonths: 180, ageMaxMonths: 611, sex: 'FEMALE', lifeStage: 'PREGNANT_T1', valueType, value: additions.pregEarly, unit, valueNote: 'Early-stage pregnancy additional' });
  }
  if (additions.pregMid != null) {
    rows.push({ compoundName: compound, ageMinMonths: 180, ageMaxMonths: 611, sex: 'FEMALE', lifeStage: 'PREGNANT_T2', valueType, value: additions.pregMid, unit, valueNote: 'Mid-stage pregnancy additional' });
  }
  if (additions.pregLate != null) {
    rows.push({ compoundName: compound, ageMinMonths: 180, ageMaxMonths: 611, sex: 'FEMALE', lifeStage: 'PREGNANT_T3', valueType, value: additions.pregLate, unit, valueNote: 'Late-stage pregnancy additional' });
  }
  if (additions.lact != null) {
    rows.push({ compoundName: compound, ageMinMonths: 180, ageMaxMonths: 611, sex: 'FEMALE', lifeStage: 'LACTATING', valueType, value: additions.lact, unit, valueNote: note ?? 'Additional intake for lactation' });
  }
}

function buildAllRows(): SeedRow[] {
  const rows: SeedRow[] = [];

  // ═══════════════════════════════════════════════════════════
  // Energy (kcal/d) — by PAL level
  // Format: [PAL_I_M, PAL_II_M, PAL_III_M, PAL_I_F, PAL_II_F, PAL_III_F]
  // null = not published for that age group
  // ═══════════════════════════════════════════════════════════
  const ENERGY: Array<[number | null, number, number | null, number | null, number, number | null]> = [
    [null, 550, null, null, 500, null],       // 0-5mo
    [null, 650, null, null, 600, null],       // 6-11mo (6-8 + 9-11 averaged)
    [null, 950, null, null, 900, null],       // 1-2y
    [null, 1300, null, null, 1250, null],     // 3-5y
    [1350, 1550, 1750, 1250, 1450, 1650],    // 6-7y
    [1600, 1850, 2100, 1500, 1700, 1900],    // 8-9y
    [1950, 2250, 2500, 1850, 2100, 2350],    // 10-11y
    [2300, 2600, 2900, 2150, 2400, 2700],    // 12-14y
    [2500, 2800, 3150, 2050, 2300, 2550],    // 15-17y
    [2300, 2650, 3050, 1700, 2000, 2300],    // 18-29y
    [2300, 2700, 3050, 1750, 2050, 2350],    // 30-49y
    [2200, 2600, 2950, 1650, 1950, 2250],    // 50-64y
    [2050, 2400, 2750, 1550, 1850, 2100],    // 65-74y
    [1800, 2100, null, 1400, 1650, null],    // 75+y
  ];

  const PALS: Array<[number, Activity]> = [[0, 'SEDENTARY'], [1, 'MODERATE'], [2, 'ACTIVE']];
  for (let i = 0; i < AGES.length; i++) {
    const [ageMin, ageMax] = AGES[i];
    const e = ENERGY[i];
    for (const [offset, activity] of PALS) {
      const mVal = e[offset] as number | null;
      const fVal = e[offset + 3] as number | null;
      if (mVal != null) rows.push({ compoundName: 'Energy', ageMinMonths: ageMin, ageMaxMonths: ageMax, sex: 'MALE', lifeStage: 'NONE', activityLevel: activity, valueType: 'EAR', value: mVal, unit: 'kcal' });
      if (fVal != null) rows.push({ compoundName: 'Energy', ageMinMonths: ageMin, ageMaxMonths: ageMax, sex: 'FEMALE', lifeStage: 'NONE', activityLevel: activity, valueType: 'EAR', value: fVal, unit: 'kcal' });
    }
  }
  // Pregnancy energy additions (early +50, mid +250, late +450)
  addPregLact(rows, 'Energy', 'kcal', 'EAR', { pregEarly: 2050, pregMid: 2250, pregLate: 2450 }, 'Base F PAL II ~2000 + addition');
  // Lactation +350
  addPregLact(rows, 'Energy', 'kcal', 'EAR', { lact: 2350 }, 'Base F PAL II ~2000 + 350');

  // ═══════════════════════════════════════════════════════════
  // Protein (g/d) — EAR, RDA, AI
  // ═══════════════════════════════════════════════════════════
  //                    0-5  6-11 1-2  3-5  6-7  8-9 10-11 12-14 15-17 18-29 30-49 50-64 65-74 75+
  addNutrient(rows, 'Protein', 'g', 'AI',  [[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null]]); // infants only
  // Infants have AI only
  rows.push({ compoundName: 'Protein', ageMinMonths: 0, ageMaxMonths: 5, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 10, unit: 'g' });
  rows.push({ compoundName: 'Protein', ageMinMonths: 0, ageMaxMonths: 5, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 10, unit: 'g' });
  rows.push({ compoundName: 'Protein', ageMinMonths: 6, ageMaxMonths: 11, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 15, unit: 'g' });
  rows.push({ compoundName: 'Protein', ageMinMonths: 6, ageMaxMonths: 11, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 15, unit: 'g' });
  rows.push({ compoundName: 'Protein', ageMinMonths: 6, ageMaxMonths: 11, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 25, unit: 'g' });
  rows.push({ compoundName: 'Protein', ageMinMonths: 6, ageMaxMonths: 11, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 25, unit: 'g' });

  // EAR for 1-2y onwards
  addNutrient(rows, 'Protein', 'g', 'EAR', [
    [null,null],[null,null],[15,15],[20,20],[25,25],[30,30],[40,40],
    [45,45],[50,45],[50,40],[50,40],[50,40],[50,40],[50,40],
  ]);
  // RDA for 1-2y onwards
  addNutrient(rows, 'Protein', 'g', 'RDA', [
    [null,null],[null,null],[20,20],[25,25],[30,30],[40,40],[45,50],
    [60,55],[65,55],[65,50],[65,50],[65,50],[60,50],[60,50],
  ]);
  // Pregnancy protein additions
  addPregLact(rows, 'Protein', 'g', 'EAR', { pregEarly: 40, pregMid: 45, pregLate: 60 });
  addPregLact(rows, 'Protein', 'g', 'RDA', { pregEarly: 50, pregMid: 55, pregLate: 75 });
  addPregLact(rows, 'Protein', 'g', 'EAR', { lact: 55 });
  addPregLact(rows, 'Protein', 'g', 'RDA', { lact: 70 });

  // ═══════════════════════════════════════════════════════════
  // FAT-SOLUBLE VITAMINS
  // ═══════════════════════════════════════════════════════════

  // Vitamin A (µg RAE) — EAR
  addNutrient(rows, 'Vitamin A', 'µg', 'EAR', [
    [null,null],[null,null],[300,250],[350,350],[300,300],[350,350],
    [450,400],[550,500],[650,500],[600,450],[650,500],[650,500],[600,500],[550,450],
  ]);
  // Vitamin A — RDA
  addNutrient(rows, 'Vitamin A', 'µg', 'RDA', [
    [null,null],[null,null],[400,350],[450,500],[400,400],[500,500],
    [600,600],[800,700],[900,650],[850,650],[900,700],[900,700],[850,700],[800,650],
  ]);
  // Vitamin A — AI (infants)
  addNutrient(rows, 'Vitamin A', 'µg', 'AI', [[300,300],[400,400],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null]]);
  // Vitamin A — UL
  addNutrient(rows, 'Vitamin A', 'µg', 'UL', [
    [600,600],[600,600],[600,600],[700,700],[950,950],[1200,1200],
    [1500,1500],[2100,2100],[2500,2500],[2700,2700],[2700,2700],[2700,2700],[2700,2700],[2700,2700],
  ], 'UL excludes provitamin A carotenoids');
  addPregLact(rows, 'Vitamin A', 'µg', 'EAR', { pregLate: 510, lact: 490 }); // +60 EAR late preg; +300+450 RDA lact
  addPregLact(rows, 'Vitamin A', 'µg', 'RDA', { pregLate: 730, lact: 1100 });

  // Vitamin D (µg) — AI + UL
  addNutrient(rows, 'Vitamin D', 'µg', 'AI', [
    [5,5],[5,5],[3,3.5],[3.5,4],[4.5,5],[5,6],[6.5,8],[8,9.5],[9,8.5],
    [8.5,8.5],[8.5,8.5],[8.5,8.5],[8.5,8.5],[8.5,8.5],
  ]);
  addNutrient(rows, 'Vitamin D', 'µg', 'UL', [
    [25,25],[25,25],[20,20],[30,30],[30,30],[40,40],[60,60],[80,80],[90,90],
    [100,100],[100,100],[100,100],[100,100],[100,100],
  ]);
  addPregLact(rows, 'Vitamin D', 'µg', 'AI', { preg: 8.5, lact: 8.5 });

  // Vitamin E (mg α-tocopherol) — AI + UL
  addNutrient(rows, 'Vitamin E', 'mg', 'AI', [
    [3,3],[4,4],[3,3],[4,4],[5,5],[5,5],[5.5,5.5],[6.5,6],[7,5.5],
    [6,5],[6,5.5],[7,6],[7,6.5],[6.5,6.5],
  ]);
  addNutrient(rows, 'Vitamin E', 'mg', 'UL', [
    [null,null],[null,null],[150,150],[200,200],[300,300],[350,350],[450,450],
    [650,600],[750,650],[850,650],[900,700],[850,700],[850,650],[750,650],
  ]);
  addPregLact(rows, 'Vitamin E', 'mg', 'AI', { preg: 6.5, lact: 7 });

  // Vitamin K (µg) — AI
  addNutrient(rows, 'Vitamin K', 'µg', 'AI', [
    [4,4],[7,7],[50,60],[60,70],[80,90],[90,110],[110,140],
    [140,170],[160,150],[150,150],[150,150],[150,150],[150,150],[150,150],
  ]);
  addPregLact(rows, 'Vitamin K', 'µg', 'AI', { preg: 150, lact: 150 });

  // ═══════════════════════════════════════════════════════════
  // WATER-SOLUBLE VITAMINS
  // ═══════════════════════════════════════════════════════════

  // Thiamin (B1) — EAR/RDA/AI
  addNutrient(rows, 'Thiamin', 'mg', 'AI', [[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null]]);
  rows.push({ compoundName: 'Thiamin', ageMinMonths: 0, ageMaxMonths: 5, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 0.1, unit: 'mg' });
  rows.push({ compoundName: 'Thiamin', ageMinMonths: 0, ageMaxMonths: 5, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 0.1, unit: 'mg' });
  rows.push({ compoundName: 'Thiamin', ageMinMonths: 6, ageMaxMonths: 11, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 0.2, unit: 'mg' });
  rows.push({ compoundName: 'Thiamin', ageMinMonths: 6, ageMaxMonths: 11, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 0.2, unit: 'mg' });
  addNutrient(rows, 'Thiamin', 'mg', 'EAR', [
    [null,null],[null,null],[0.4,0.4],[0.6,0.6],[0.7,0.7],[0.8,0.8],[1.0,0.9],
    [1.2,1.1],[1.3,1.0],[1.2,0.9],[1.2,0.9],[1.1,0.9],[1.1,0.9],[1.0,0.8],
  ]);
  addNutrient(rows, 'Thiamin', 'mg', 'RDA', [
    [null,null],[null,null],[0.5,0.5],[0.7,0.7],[0.8,0.8],[1.0,0.9],[1.2,1.1],
    [1.4,1.3],[1.5,1.2],[1.4,1.1],[1.4,1.1],[1.3,1.1],[1.3,1.1],[1.2,0.9],
  ]);
  addPregLact(rows, 'Thiamin', 'mg', 'EAR', { preg: 1.1, lact: 1.1 });
  addPregLact(rows, 'Thiamin', 'mg', 'RDA', { preg: 1.3, lact: 1.3 });

  // Riboflavin (B2) — EAR/RDA/AI
  rows.push({ compoundName: 'Riboflavin', ageMinMonths: 0, ageMaxMonths: 5, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 0.3, unit: 'mg' });
  rows.push({ compoundName: 'Riboflavin', ageMinMonths: 0, ageMaxMonths: 5, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 0.3, unit: 'mg' });
  rows.push({ compoundName: 'Riboflavin', ageMinMonths: 6, ageMaxMonths: 11, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 0.4, unit: 'mg' });
  rows.push({ compoundName: 'Riboflavin', ageMinMonths: 6, ageMaxMonths: 11, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 0.4, unit: 'mg' });
  addNutrient(rows, 'Riboflavin', 'mg', 'EAR', [
    [null,null],[null,null],[0.5,0.5],[0.7,0.6],[0.8,0.7],[0.9,0.9],[1.1,1.0],
    [1.3,1.2],[1.4,1.2],[1.3,1.0],[1.3,1.0],[1.2,1.0],[1.2,1.0],[1.1,0.9],
  ]);
  addNutrient(rows, 'Riboflavin', 'mg', 'RDA', [
    [null,null],[null,null],[0.6,0.5],[0.8,0.8],[0.9,0.9],[1.1,1.0],[1.4,1.3],
    [1.6,1.4],[1.7,1.4],[1.6,1.2],[1.6,1.2],[1.5,1.2],[1.5,1.2],[1.3,1.0],
  ]);
  addPregLact(rows, 'Riboflavin', 'mg', 'EAR', { preg: 1.2, lact: 1.5 });
  addPregLact(rows, 'Riboflavin', 'mg', 'RDA', { preg: 1.5, lact: 1.8 });

  // Niacin (mg NE) — EAR/RDA/AI + UL (split Nicotinamide/Nicotinic Acid)
  rows.push({ compoundName: 'Niacin', ageMinMonths: 0, ageMaxMonths: 5, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 2, unit: 'mg' });
  rows.push({ compoundName: 'Niacin', ageMinMonths: 0, ageMaxMonths: 5, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 2, unit: 'mg' });
  rows.push({ compoundName: 'Niacin', ageMinMonths: 6, ageMaxMonths: 11, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 3, unit: 'mg' });
  rows.push({ compoundName: 'Niacin', ageMinMonths: 6, ageMaxMonths: 11, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 3, unit: 'mg' });
  addNutrient(rows, 'Niacin', 'mg', 'EAR', [
    [null,null],[null,null],[5,4],[6,6],[7,7],[9,8],[11,10],
    [12,12],[14,11],[13,9],[13,10],[12,9],[12,9],[11,9],
  ]);
  addNutrient(rows, 'Niacin', 'mg', 'RDA', [
    [null,null],[null,null],[6,5],[8,7],[9,8],[11,10],[13,10],
    [15,14],[17,13],[15,11],[15,12],[14,11],[14,11],[13,10],
  ]);
  // Nicotinamide UL
  addNutrient(rows, 'Nicotinamide', 'mg', 'UL', [
    [null,null],[null,null],[60,60],[80,80],[100,100],[150,150],[200,200],
    [250,250],[300,300],[300,250],[350,250],[350,250],[300,250],[300,250],
  ]);
  // Nicotinic Acid UL
  addNutrient(rows, 'Nicotinic Acid', 'mg', 'UL', [
    [null,null],[null,null],[15,15],[20,20],[30,30],[35,35],[45,45],
    [60,60],[75,65],[80,65],[85,65],[80,65],[80,65],[75,60],
  ]);
  addPregLact(rows, 'Niacin', 'mg', 'EAR', { preg: 9, lact: 12 });
  addPregLact(rows, 'Niacin', 'mg', 'RDA', { preg: 11, lact: 14 });

  // Vitamin B6 — EAR/RDA/AI/UL
  rows.push({ compoundName: 'Vitamin B6', ageMinMonths: 0, ageMaxMonths: 5, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 0.2, unit: 'mg' });
  rows.push({ compoundName: 'Vitamin B6', ageMinMonths: 0, ageMaxMonths: 5, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 0.2, unit: 'mg' });
  rows.push({ compoundName: 'Vitamin B6', ageMinMonths: 6, ageMaxMonths: 11, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 0.3, unit: 'mg' });
  rows.push({ compoundName: 'Vitamin B6', ageMinMonths: 6, ageMaxMonths: 11, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 0.3, unit: 'mg' });
  addNutrient(rows, 'Vitamin B6', 'mg', 'EAR', [
    [null,null],[null,null],[0.4,0.4],[0.5,0.5],[0.7,0.6],[0.8,0.8],[1.0,1.0],
    [1.2,1.0],[1.2,1.0],[1.1,1.0],[1.1,1.0],[1.1,1.0],[1.1,1.0],[1.1,1.0],
  ]);
  addNutrient(rows, 'Vitamin B6', 'mg', 'RDA', [
    [null,null],[null,null],[0.5,0.5],[0.6,0.6],[0.8,0.7],[0.9,0.9],[1.1,1.1],
    [1.4,1.3],[1.5,1.3],[1.4,1.1],[1.4,1.1],[1.4,1.1],[1.4,1.1],[1.4,1.1],
  ]);
  addNutrient(rows, 'Vitamin B6', 'mg', 'UL', [
    [null,null],[null,null],[10,10],[15,15],[20,20],[25,25],[30,30],
    [40,40],[50,45],[55,45],[60,45],[55,45],[50,45],[50,40],
  ]);
  addPregLact(rows, 'Vitamin B6', 'mg', 'EAR', { preg: 1.2, lact: 1.3 });
  addPregLact(rows, 'Vitamin B6', 'mg', 'RDA', { preg: 1.3, lact: 1.4 });

  // Vitamin B12 — EAR/RDA/AI
  rows.push({ compoundName: 'Vitamin B12', ageMinMonths: 0, ageMaxMonths: 5, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 0.4, unit: 'µg' });
  rows.push({ compoundName: 'Vitamin B12', ageMinMonths: 0, ageMaxMonths: 5, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 0.4, unit: 'µg' });
  rows.push({ compoundName: 'Vitamin B12', ageMinMonths: 6, ageMaxMonths: 11, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 0.5, unit: 'µg' });
  rows.push({ compoundName: 'Vitamin B12', ageMinMonths: 6, ageMaxMonths: 11, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 0.5, unit: 'µg' });
  addNutrient(rows, 'Vitamin B12', 'µg', 'EAR', [
    [null,null],[null,null],[0.8,0.8],[0.9,0.9],[1.1,1.1],[1.3,1.3],[1.6,1.6],
    [2.0,2.0],[2.0,2.0],[2.0,2.0],[2.0,2.0],[2.0,2.0],[2.0,2.0],[2.0,2.0],
  ]);
  addNutrient(rows, 'Vitamin B12', 'µg', 'RDA', [
    [null,null],[null,null],[0.9,0.9],[1.1,1.1],[1.3,1.3],[1.6,1.6],[1.9,1.9],
    [2.4,2.4],[2.4,2.4],[2.4,2.4],[2.4,2.4],[2.4,2.4],[2.4,2.4],[2.4,2.4],
  ]);
  addPregLact(rows, 'Vitamin B12', 'µg', 'EAR', { preg: 2.3, lact: 2.7 });
  addPregLact(rows, 'Vitamin B12', 'µg', 'RDA', { preg: 2.8, lact: 3.2 });

  // Folate (Folic Acid) — EAR/RDA/AI/UL
  rows.push({ compoundName: 'Folate', ageMinMonths: 0, ageMaxMonths: 5, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 40, unit: 'µg' });
  rows.push({ compoundName: 'Folate', ageMinMonths: 0, ageMaxMonths: 5, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 40, unit: 'µg' });
  rows.push({ compoundName: 'Folate', ageMinMonths: 6, ageMaxMonths: 11, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 60, unit: 'µg' });
  rows.push({ compoundName: 'Folate', ageMinMonths: 6, ageMaxMonths: 11, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 60, unit: 'µg' });
  addNutrient(rows, 'Folate', 'µg', 'EAR', [
    [null,null],[null,null],[80,80],[90,90],[110,110],[130,130],[160,160],
    [200,200],[220,200],[200,200],[200,200],[200,200],[200,200],[200,200],
  ]);
  addNutrient(rows, 'Folate', 'µg', 'RDA', [
    [null,null],[null,null],[90,90],[110,110],[140,140],[160,160],[190,190],
    [240,240],[240,240],[240,240],[240,240],[240,240],[240,240],[240,240],
  ]);
  addNutrient(rows, 'Folate', 'µg', 'UL', [
    [null,null],[null,null],[200,200],[300,300],[400,400],[500,500],[700,700],
    [900,900],[900,900],[900,900],[1000,1000],[1000,1000],[900,900],[900,900],
  ], 'UL applies to pteroylmonoglutamic acid (synthetic folic acid) only');
  addPregLact(rows, 'Folate', 'µg', 'EAR', { preg: 400, lact: 280 });
  addPregLact(rows, 'Folate', 'µg', 'RDA', { preg: 480, lact: 340 });

  // Vitamin C — EAR/RDA/AI
  rows.push({ compoundName: 'Vitamin C', ageMinMonths: 0, ageMaxMonths: 5, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 40, unit: 'mg' });
  rows.push({ compoundName: 'Vitamin C', ageMinMonths: 0, ageMaxMonths: 5, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 40, unit: 'mg' });
  rows.push({ compoundName: 'Vitamin C', ageMinMonths: 6, ageMaxMonths: 11, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 40, unit: 'mg' });
  rows.push({ compoundName: 'Vitamin C', ageMinMonths: 6, ageMaxMonths: 11, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 40, unit: 'mg' });
  addNutrient(rows, 'Vitamin C', 'mg', 'EAR', [
    [null,null],[null,null],[35,35],[40,40],[50,50],[60,60],[70,70],
    [85,85],[85,85],[85,85],[85,85],[85,85],[80,80],[80,80],
  ]);
  addNutrient(rows, 'Vitamin C', 'mg', 'RDA', [
    [null,null],[null,null],[40,40],[50,50],[60,60],[70,70],[85,85],
    [100,100],[100,100],[100,100],[100,100],[100,100],[100,100],[100,100],
  ]);
  addPregLact(rows, 'Vitamin C', 'mg', 'EAR', { preg: 95, lact: 125 });
  addPregLact(rows, 'Vitamin C', 'mg', 'RDA', { preg: 110, lact: 145 });

  // Pantothenic Acid — AI only
  addNutrient(rows, 'Pantothenic Acid', 'mg', 'AI', [
    [4,4],[5,5],[3,4],[4,4],[5,5],[6,5],[6,6],[7,6],[7,6],[5,5],[5,5],[6,5],[6,5],[6,5],
  ]);
  addPregLact(rows, 'Pantothenic Acid', 'mg', 'AI', { preg: 5, lact: 6 });

  // Biotin — AI only
  addNutrient(rows, 'Biotin', 'µg', 'AI', [
    [4,4],[5,5],[20,20],[20,20],[30,30],[30,30],[40,40],[50,50],[50,50],[50,50],[50,50],[50,50],[50,50],[50,50],
  ]);
  addPregLact(rows, 'Biotin', 'µg', 'AI', { preg: 50, lact: 50 });

  // ═══════════════════════════════════════════════════════════
  // MINERALS
  // ═══════════════════════════════════════════════════════════

  // Sodium (mg) — EAR for adults, AI, CDRR (DG salt equivalent)
  addNutrient(rows, 'Sodium', 'mg', 'AI', [
    [100,100],[600,600],[null,null],[null,null],[null,null],[null,null],[null,null],
    [null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],
  ]);
  addNutrient(rows, 'Sodium', 'mg', 'EAR', [
    [null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],
    [null,null],[null,null],[600,600],[600,600],[600,600],[600,600],[600,600],
  ]);
  // DG as CDRR (converted from salt: M <7.5g = ~2950 mg Na; F <6.5g = ~2550 mg Na)
  addNutrient(rows, 'Sodium', 'mg', 'CDRR', [
    [null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],
    [null,null],[null,null],[2950,2550],[2950,2550],[2950,2550],[2950,2550],[2950,2550],
  ], 'DG: salt equiv <7.5 g/d M, <6.5 g/d F');
  addPregLact(rows, 'Sodium', 'mg', 'EAR', { preg: 600, lact: 600 });

  // Potassium — AI
  addNutrient(rows, 'Potassium', 'mg', 'AI', [
    [400,400],[700,700],[900,900],[1000,1000],[1300,1200],[1500,1500],
    [1800,1800],[2300,1900],[2700,2000],[2500,2000],[2500,2000],[2500,2000],[2500,2000],[2500,2000],
  ]);
  addPregLact(rows, 'Potassium', 'mg', 'AI', { preg: 2000, lact: 2200 });

  // Calcium — EAR/RDA/AI/UL
  addNutrient(rows, 'Calcium', 'mg', 'AI', [[200,200],[250,250],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null]]);
  addNutrient(rows, 'Calcium', 'mg', 'EAR', [
    [null,null],[null,null],[350,350],[500,450],[450,450],[550,600],[600,600],
    [850,700],[650,550],[650,550],[600,550],[600,550],[600,500],[500,450],
  ]);
  addNutrient(rows, 'Calcium', 'mg', 'RDA', [
    [null,null],[null,null],[450,400],[600,550],[600,550],[650,750],[700,750],
    [1000,800],[800,650],[800,650],[750,650],[750,650],[750,700],[700,600],
  ]);
  addNutrient(rows, 'Calcium', 'mg', 'UL', [
    [null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],
    [null,null],[null,null],[2500,2500],[2500,2500],[2500,2500],[2500,2500],[2500,2500],
  ]);

  // Magnesium — EAR/RDA/AI
  addNutrient(rows, 'Magnesium', 'mg', 'AI', [[20,20],[60,60],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null]]);
  addNutrient(rows, 'Magnesium', 'mg', 'EAR', [
    [null,null],[null,null],[60,60],[80,80],[110,110],[140,140],[180,180],
    [250,240],[300,260],[280,230],[310,240],[310,240],[290,230],[270,220],
  ]);
  addNutrient(rows, 'Magnesium', 'mg', 'RDA', [
    [null,null],[null,null],[70,70],[100,100],[130,130],[170,160],[210,220],
    [290,290],[360,310],[340,270],[370,290],[370,290],[350,280],[320,260],
  ]);
  addPregLact(rows, 'Magnesium', 'mg', 'EAR', { preg: 260, lact: 220 });
  addPregLact(rows, 'Magnesium', 'mg', 'RDA', { preg: 310, lact: 270 });

  // Phosphorus — AI/UL
  addNutrient(rows, 'Phosphorus', 'mg', 'AI', [
    [120,120],[260,260],[500,500],[700,700],[900,800],[1000,1000],[1100,1000],
    [1200,1000],[1200,900],[1000,800],[1000,800],[1000,800],[1000,800],[1000,800],
  ]);
  addNutrient(rows, 'Phosphorus', 'mg', 'UL', [
    [null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],
    [null,null],[null,null],[3000,3000],[3000,3000],[3000,3000],[3000,3000],[3000,3000],
  ]);
  addPregLact(rows, 'Phosphorus', 'mg', 'AI', { preg: 800, lact: 800 });

  // Iron — EAR/RDA/AI/UL (F menstruating split for ages 10-64)
  // Male + F non-menstruating EAR
  addNutrient(rows, 'Iron', 'mg', 'EAR', [
    [null,null],[3.5,null],[3.0,3.0],[4.0,4.0],[5.0,5.0],[6.0,6.0],[7.0,7.0],
    [8.0,7.0],[8.0,5.5],[6.5,5.5],[6.5,5.5],[6.5,5.5],[6.0,5.0],[6.0,5.0],
  ]);
  // Male + F non-menstruating RDA
  addNutrient(rows, 'Iron', 'mg', 'RDA', [
    [null,null],[5.0,4.5],[4.5,4.5],[5.5,5.5],[5.5,5.5],[7.0,7.5],[8.5,8.5],
    [10.0,8.5],[10.0,7.0],[7.5,6.5],[7.5,6.5],[7.5,6.5],[7.5,6.0],[7.0,6.0],
  ]);
  // F menstruating EAR (ages 10-64 only — store with value_note)
  const FE_MENSTR_EAR: Array<[number, number | null, number]> = [
    [120, 143, 10.0], [144, 179, 10.0], [180, 215, 8.5], [216, 359, 8.5],
    [360, 599, 9.0], [600, 779, 9.0],
  ];
  for (const [ageMin, ageMax, v] of FE_MENSTR_EAR) {
    rows.push({ compoundName: 'Iron', ageMinMonths: ageMin, ageMaxMonths: ageMax, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'EAR', value: v, unit: 'mg', valueNote: 'Menstruating females (replaces non-menstruating value for this age)' });
  }
  // F menstruating RDA
  const FE_MENSTR_RDA: Array<[number, number | null, number]> = [
    [120, 143, 12.0], [144, 179, 12.0], [180, 215, 10.5], [216, 359, 10.5],
    [360, 599, 11.0], [600, 779, 11.0],
  ];
  for (const [ageMin, ageMax, v] of FE_MENSTR_RDA) {
    rows.push({ compoundName: 'Iron', ageMinMonths: ageMin, ageMaxMonths: ageMax, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'RDA', value: v, unit: 'mg', valueNote: 'Menstruating females (replaces non-menstruating value for this age)' });
  }
  // Iron AI (infants)
  rows.push({ compoundName: 'Iron', ageMinMonths: 0, ageMaxMonths: 5, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 0.5, unit: 'mg' });
  rows.push({ compoundName: 'Iron', ageMinMonths: 0, ageMaxMonths: 5, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 0.5, unit: 'mg' });
  // Iron UL
  addNutrient(rows, 'Iron', 'mg', 'UL', [
    [null,null],[null,null],[25,20],[25,25],[30,30],[35,35],[35,35],
    [40,40],[50,40],[50,40],[50,40],[50,40],[50,40],[50,40],
  ]);
  // Iron pregnancy additional
  addPregLact(rows, 'Iron', 'mg', 'EAR', { pregEarly: 7.5, pregMid: 13.5, pregLate: 21 });
  addPregLact(rows, 'Iron', 'mg', 'RDA', { pregEarly: 9, pregMid: 16, pregLate: 27.5 });
  addPregLact(rows, 'Iron', 'mg', 'EAR', { lact: 7.5 });
  addPregLact(rows, 'Iron', 'mg', 'RDA', { lact: 9 });

  // Zinc — EAR/RDA/AI/UL
  rows.push({ compoundName: 'Zinc', ageMinMonths: 0, ageMaxMonths: 5, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 2, unit: 'mg' });
  rows.push({ compoundName: 'Zinc', ageMinMonths: 0, ageMaxMonths: 5, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 2, unit: 'mg' });
  rows.push({ compoundName: 'Zinc', ageMinMonths: 6, ageMaxMonths: 11, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 3, unit: 'mg' });
  rows.push({ compoundName: 'Zinc', ageMinMonths: 6, ageMaxMonths: 11, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 3, unit: 'mg' });
  addNutrient(rows, 'Zinc', 'mg', 'EAR', [
    [null,null],[null,null],[3,2],[3,3],[4,3],[5,4],[6,5],
    [9,7],[10,7],[9,7],[9,7],[9,7],[9,7],[9,6],
  ]);
  addNutrient(rows, 'Zinc', 'mg', 'RDA', [
    [null,null],[null,null],[3,3],[4,3],[5,4],[6,5],[7,6],
    [10,8],[12,8],[11,8],[11,8],[11,8],[11,8],[10,8],
  ]);
  addNutrient(rows, 'Zinc', 'mg', 'UL', [
    [null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],
    [null,null],[null,null],[40,35],[45,35],[45,35],[40,35],[40,30],
  ]);
  addPregLact(rows, 'Zinc', 'mg', 'EAR', { preg: 8, lact: 11 });
  addPregLact(rows, 'Zinc', 'mg', 'RDA', { preg: 10, lact: 12 });

  // Copper — EAR/RDA/AI/UL
  rows.push({ compoundName: 'Copper', ageMinMonths: 0, ageMaxMonths: 5, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 0.3, unit: 'mg' });
  rows.push({ compoundName: 'Copper', ageMinMonths: 0, ageMaxMonths: 5, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 0.3, unit: 'mg' });
  rows.push({ compoundName: 'Copper', ageMinMonths: 6, ageMaxMonths: 11, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 0.3, unit: 'mg' });
  rows.push({ compoundName: 'Copper', ageMinMonths: 6, ageMaxMonths: 11, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 0.3, unit: 'mg' });
  addNutrient(rows, 'Copper', 'mg', 'EAR', [
    [null,null],[null,null],[0.3,0.2],[0.3,0.3],[0.4,0.4],[0.4,0.4],[0.5,0.5],
    [0.7,0.6],[0.8,0.6],[0.7,0.6],[0.7,0.6],[0.7,0.6],[0.7,0.6],[0.7,0.6],
  ]);
  addNutrient(rows, 'Copper', 'mg', 'RDA', [
    [null,null],[null,null],[0.3,0.3],[0.4,0.3],[0.4,0.4],[0.5,0.5],[0.6,0.6],
    [0.8,0.8],[0.9,0.7],[0.9,0.7],[0.9,0.7],[0.9,0.7],[0.8,0.7],[0.8,0.7],
  ]);
  addNutrient(rows, 'Copper', 'mg', 'UL', [
    [null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],
    [null,null],[null,null],[7,7],[7,7],[7,7],[7,7],[7,7],
  ]);
  addPregLact(rows, 'Copper', 'mg', 'EAR', { preg: 0.7, lact: 1.1 });
  addPregLact(rows, 'Copper', 'mg', 'RDA', { preg: 0.8, lact: 1.3 });

  // Manganese — AI/UL
  addNutrient(rows, 'Manganese', 'mg', 'AI', [
    [0.01,0.01],[0.5,0.5],[1.5,1.5],[1.5,1.5],[2.0,2.0],[2.5,2.5],[3.0,3.0],
    [4.0,4.0],[4.5,3.5],[4.0,3.5],[4.0,3.5],[4.0,3.5],[4.0,3.5],[4.0,3.5],
  ]);
  addNutrient(rows, 'Manganese', 'mg', 'UL', [
    [null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],
    [null,null],[null,null],[11,11],[11,11],[11,11],[11,11],[11,11],
  ]);
  addPregLact(rows, 'Manganese', 'mg', 'AI', { preg: 3.5, lact: 3.5 });

  // Iodine — EAR/RDA/AI/UL
  rows.push({ compoundName: 'Iodine', ageMinMonths: 0, ageMaxMonths: 5, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 100, unit: 'µg' });
  rows.push({ compoundName: 'Iodine', ageMinMonths: 0, ageMaxMonths: 5, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 100, unit: 'µg' });
  rows.push({ compoundName: 'Iodine', ageMinMonths: 6, ageMaxMonths: 11, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 130, unit: 'µg' });
  rows.push({ compoundName: 'Iodine', ageMinMonths: 6, ageMaxMonths: 11, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 130, unit: 'µg' });
  addNutrient(rows, 'Iodine', 'µg', 'EAR', [
    [null,null],[null,null],[35,35],[45,45],[55,55],[65,65],[80,80],
    [95,95],[100,100],[95,95],[95,95],[95,95],[95,95],[95,95],
  ]);
  addNutrient(rows, 'Iodine', 'µg', 'RDA', [
    [null,null],[null,null],[50,50],[60,60],[75,75],[90,90],[110,110],
    [140,140],[140,140],[130,130],[130,130],[130,130],[130,130],[130,130],
  ]);
  addNutrient(rows, 'Iodine', 'µg', 'UL', [
    [250,250],[250,250],[300,300],[400,400],[550,550],[700,700],[900,900],
    [2000,2000],[3000,3000],[3000,3000],[3000,3000],[3000,3000],[3000,3000],[3000,3000],
  ]);
  addPregLact(rows, 'Iodine', 'µg', 'EAR', { preg: 170, lact: 195 });
  addPregLact(rows, 'Iodine', 'µg', 'RDA', { preg: 220, lact: 260 });

  // Selenium — EAR/RDA/AI/UL
  rows.push({ compoundName: 'Selenium', ageMinMonths: 0, ageMaxMonths: 5, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 15, unit: 'µg' });
  rows.push({ compoundName: 'Selenium', ageMinMonths: 0, ageMaxMonths: 5, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 15, unit: 'µg' });
  rows.push({ compoundName: 'Selenium', ageMinMonths: 6, ageMaxMonths: 11, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 15, unit: 'µg' });
  rows.push({ compoundName: 'Selenium', ageMinMonths: 6, ageMaxMonths: 11, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 15, unit: 'µg' });
  addNutrient(rows, 'Selenium', 'µg', 'EAR', [
    [null,null],[null,null],[10,10],[10,10],[15,15],[15,15],[20,20],
    [25,25],[30,20],[25,20],[25,20],[25,20],[25,20],[25,20],
  ]);
  addNutrient(rows, 'Selenium', 'µg', 'RDA', [
    [null,null],[null,null],[10,10],[15,10],[15,15],[20,20],[25,25],
    [30,30],[35,25],[30,25],[30,25],[30,25],[30,25],[30,25],
  ]);
  addNutrient(rows, 'Selenium', 'µg', 'UL', [
    [null,null],[null,null],[100,100],[100,100],[150,150],[200,200],[250,250],
    [350,300],[400,350],[450,350],[450,350],[450,350],[450,350],[400,350],
  ]);
  addPregLact(rows, 'Selenium', 'µg', 'EAR', { preg: 25, lact: 35 });
  addPregLact(rows, 'Selenium', 'µg', 'RDA', { preg: 30, lact: 45 });

  // Chromium — AI/UL (adults only)
  rows.push({ compoundName: 'Chromium', ageMinMonths: 0, ageMaxMonths: 5, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 0.8, unit: 'µg' });
  rows.push({ compoundName: 'Chromium', ageMinMonths: 0, ageMaxMonths: 5, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 0.8, unit: 'µg' });
  rows.push({ compoundName: 'Chromium', ageMinMonths: 6, ageMaxMonths: 11, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 1.0, unit: 'µg' });
  rows.push({ compoundName: 'Chromium', ageMinMonths: 6, ageMaxMonths: 11, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 1.0, unit: 'µg' });
  addNutrient(rows, 'Chromium', 'µg', 'AI', [
    [null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],
    [null,null],[null,null],[10,10],[10,10],[10,10],[10,10],[10,10],
  ]);
  addNutrient(rows, 'Chromium', 'µg', 'UL', [
    [null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],
    [null,null],[null,null],[500,500],[500,500],[500,500],[500,500],[500,500],
  ]);
  addPregLact(rows, 'Chromium', 'µg', 'AI', { preg: 10, lact: 10 });

  // Molybdenum — EAR/RDA/AI/UL
  rows.push({ compoundName: 'Molybdenum', ageMinMonths: 0, ageMaxMonths: 5, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 2, unit: 'µg' });
  rows.push({ compoundName: 'Molybdenum', ageMinMonths: 0, ageMaxMonths: 5, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 2, unit: 'µg' });
  rows.push({ compoundName: 'Molybdenum', ageMinMonths: 6, ageMaxMonths: 11, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: 5, unit: 'µg' });
  rows.push({ compoundName: 'Molybdenum', ageMinMonths: 6, ageMaxMonths: 11, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: 5, unit: 'µg' });
  addNutrient(rows, 'Molybdenum', 'µg', 'EAR', [
    [null,null],[null,null],[10,10],[10,10],[10,10],[15,15],[15,15],
    [20,20],[25,20],[20,20],[25,20],[25,20],[20,20],[20,20],
  ]);
  addNutrient(rows, 'Molybdenum', 'µg', 'RDA', [
    [null,null],[null,null],[10,10],[10,10],[15,15],[20,15],[20,20],
    [25,25],[30,25],[30,25],[30,25],[30,25],[25,25],[25,25],
  ]);
  addNutrient(rows, 'Molybdenum', 'µg', 'UL', [
    [null,null],[null,null],[null,null],[null,null],[null,null],[null,null],[null,null],
    [null,null],[null,null],[600,500],[600,500],[600,500],[600,500],[600,500],
  ]);
  addPregLact(rows, 'Molybdenum', 'µg', 'EAR', { preg: 20, lact: 23 });
  addPregLact(rows, 'Molybdenum', 'µg', 'RDA', { preg: 25, lact: 28 });

  // ═══════════════════════════════════════════════════════════
  // MACROS — DG ranges (AMDR/CDRR)
  // ═══════════════════════════════════════════════════════════

  // n-6 Fatty Acid (Omega-6) — AI (g/d)
  addNutrient(rows, 'Omega-6', 'g', 'AI', [
    [4,4],[4,4],[4,4],[6,6],[8,7],[8,7],[10,8],
    [11,9],[13,9],[11,8],[10,8],[10,8],[9,8],[8,7],
  ]);
  addPregLact(rows, 'Omega-6', 'g', 'AI', { preg: 9, lact: 10 });

  // n-3 Fatty Acid (Omega-3) — AI (g/d)
  addNutrient(rows, 'Omega-3', 'g', 'AI', [
    [0.9,0.9],[0.8,0.8],[0.7,0.8],[1.1,1.0],[1.5,1.3],[1.5,1.3],[1.6,1.6],
    [1.9,1.6],[2.1,1.6],[2.0,1.6],[2.0,1.6],[2.2,1.9],[2.2,2.0],[2.1,1.8],
  ]);
  addPregLact(rows, 'Omega-3', 'g', 'AI', { preg: 1.6, lact: 1.8 });

  // Dietary Fiber (g/d) — DG (stored as AMDR with min only = "aim above")
  const FIBER_DG_M = [null,null,null,8,10,11,13,17,19,21,21,21,20,20];
  const FIBER_DG_F = [null,null,null,8,10,11,13,17,18,18,18,18,17,17];
  for (let i = 0; i < AGES.length; i++) {
    const [ageMin, ageMax] = AGES[i];
    if (FIBER_DG_M[i] != null) {
      rows.push({ compoundName: 'Dietary Fiber', ageMinMonths: ageMin, ageMaxMonths: ageMax, sex: 'MALE', lifeStage: 'NONE', valueType: 'AMDR', value: FIBER_DG_M[i]!, valueMin: FIBER_DG_M[i]!, unit: 'g', valueNote: 'DG: dietary goal ≥ this amount' });
    }
    if (FIBER_DG_F[i] != null) {
      rows.push({ compoundName: 'Dietary Fiber', ageMinMonths: ageMin, ageMaxMonths: ageMax, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AMDR', value: FIBER_DG_F[i]!, valueMin: FIBER_DG_F[i]!, unit: 'g', valueNote: 'DG: dietary goal ≥ this amount' });
    }
  }
  addPregLact(rows, 'Dietary Fiber', 'g', 'AMDR', { preg: 18, lact: 18 }, 'DG: dietary goal ≥ this amount');

  return rows;
}

// ═══════════════════════════════════════════════════════════════
// Seed runner
// ═══════════════════════════════════════════════════════════════

async function seed() {
  console.log(`🌱 Seeding ${SOURCE.authorityName}...\n`);

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
    console.log(`⚠️  Compounds not found: ${missing.join(', ')}\n`);
  }

  let inserted = 0, updated = 0, skipped = 0;
  for (const row of rows) {
    const compoundId = idByName.get(resolveDbName(row.compoundName));
    if (!compoundId) { skipped++; continue; }

    const result = await sql`
      INSERT INTO reference_daily_values (
        compound_id, source_region, source_id,
        age_min_months, age_max_months,
        sex, life_stage, activity_level, value_type,
        value, value_min, value_max, unit,
        is_percent_of_energy, is_provisional, value_note
      ) VALUES (
        ${compoundId}, ${SOURCE.regionCode}, ${source.id},
        ${row.ageMinMonths}, ${row.ageMaxMonths},
        ${row.sex}, ${row.lifeStage},
        ${row.activityLevel ?? null},
        ${row.valueType},
        ${row.value}, ${row.valueMin ?? null}, ${row.valueMax ?? null}, ${row.unit},
        ${row.isPercentOfEnergy ?? false}, false, ${row.valueNote ?? null}
      )
      ON CONFLICT (compound_id, source_region, age_min_months, age_max_months, sex, life_stage, value_type, activity_level, dietary_context)
      DO UPDATE SET
        value = EXCLUDED.value,
        value_min = EXCLUDED.value_min,
        value_max = EXCLUDED.value_max,
        unit = EXCLUDED.unit,
        source_id = EXCLUDED.source_id,
        value_note = EXCLUDED.value_note
      RETURNING (xmax = 0) AS inserted
    `;
    if (result[0]?.inserted) inserted++; else updated++;
  }

  console.log('─'.repeat(60));
  console.log(`✅ MHLW Japan 2020 seed complete`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Updated:  ${updated}`);
  console.log(`   Skipped:  ${skipped}`);
  console.log('─'.repeat(60));
}

seed()
  .catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); })
  .finally(() => sql.end());
