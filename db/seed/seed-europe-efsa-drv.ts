/**
 * Seed: EFSA DRV (European Food Safety Authority)
 *
 * Source: drv-summary-tables.pdf (Sept 2017 v4)
 * Coverage: Energy × PAL × age × sex, Protein AR+PRI, Macro RI ranges,
 * Water AI, Vitamin AR+PRI/AI (14 vitamins), Mineral AR+PRI/AI (13 minerals).
 * Zinc: 4 phytate LPI tiers via dietary_context. Iron F: premenopausal/post split.
 *
 * Run: npx tsx db/seed/seed-europe-efsa-drv.ts
 */

import 'dotenv/config';
import postgres from 'postgres';
import {
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
  refEnergyMJ,
  type Sex, type LifeStage, type DietaryContext, type Activity, type ValueType,
} from '../../dv-sources/efsa-drv/raw-values';

const sql = postgres(process.env.DATABASE_URL!);

const SOURCE = {
  authorityName: 'EFSA Dietary Reference Values (NDA Panel 2010-2017)',
  regionCode: 'EU',
  versionYear: 2017,
  sourceType: 'SCIENTIFIC_DRI' as const,
  url: 'https://www.efsa.europa.eu/sites/default/files/assets/DRV_Summary_tables_jan_17.pdf',
  note: 'EFSA DRVs — Summary tables v4 (Sept 2017). PRI = RDA-equivalent; AR = EAR-equivalent; AI = adequate intake. Iron F premenopausal PRI = 16 mg (age 18-50), postmenopausal = 11 mg (age 51+). Zinc depends on phytate intake — 4 tiers stored via dietary_context (PHYTATE_LOW/MED_LOW/MED_HIGH/HIGH = 300/600/900/1200 mg phytate/d). Thiamin/Niacin converted from mg/MJ using PAL 1.4 ref energy. Skipped: Sodium/Chloride (EFSA evaluation ongoing in 2017; published 2019 — separate seed), Chromium (EFSA did not set DRV). ULs published in separate scientific opinions (not in summary).',
  retrievedDate: '2026-04-14',
};

const COMPOUND_NAME_MAP: Record<string, string> = {
  'Vitamin A': 'Vitamin A (RAE)',
  'Vitamin C': 'Vitamin C (Total)',
  'Vitamin D': 'Vitamin D (Total)',
  'Vitamin E': 'Vitamin E (Total)',
  'Vitamin K': 'Vitamin K (Total)',
  'Thiamin': 'Thiamin (B1)',
  'Riboflavin': 'Riboflavin (B2)',
  'Niacin': 'Niacin (B3)',
  'Folate': 'Folate (Total)',
  'Cobalamin': 'Vitamin B12 (Total)',
  'Pantothenic Acid': 'Pantothenic Acid (B5)',
  'Biotin': 'Biotin (B7)',
  'Choline': 'Choline (Total)',
  'Calcium': 'Calcium (Total)',
  'Iron': 'Iron (Total)',
  'Magnesium': 'Magnesium (Total)',
  'Selenium': 'Selenium (Total)',
  'Zinc': 'Zinc (Total)',
  'Fiber': 'Dietary Fiber',
  'Carbohydrate': 'Carbohydrates',
  'Fat': 'Total Fat',
  'SFA': 'Saturated Fat',
  'TFA': 'Trans Fat',
  'LA': 'LA',                  // Linoleic acid specifically, not umbrella Omega-6
  'ALA': 'ALA',                // α-linolenic acid specifically, not umbrella Omega-3
  'EPA+DHA': 'Omega-3',        // Combined target — no single DB compound for EPA+DHA sum
  'DHA': 'DHA',                // DHA specifically
};
function resolveDbName(n: string): string {
  return COMPOUND_NAME_MAP[n] ?? n;
}

interface SeedRow {
  compoundName: string;
  ageMinMonths: number;
  ageMaxMonths: number | null;
  sex: Sex;
  lifeStage: LifeStage;
  activityLevel?: Activity;
  dietaryContext?: DietaryContext;
  valueType: ValueType;
  value: number;
  valueMin?: number;
  valueMax?: number;
  unit: string;
  isPercentOfEnergy?: boolean;
  valueNote?: string | null;
}

const SEXES: Sex[] = ['MALE', 'FEMALE'];
function expandSexes(sex: Sex | 'BOTH'): Sex[] {
  return sex === 'BOTH' ? SEXES : [sex];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildAllRows(): SeedRow[] {
  const rows: SeedRow[] = [];

  // ── Energy AR (all PAL levels) ───────────────────────────
  const palActivities: Array<[number | null, Activity]> = [
    [0, 'SEDENTARY'],   // col index for PAL 1.4 M (offset 2)
    [2, 'MODERATE'],
    [4, 'ACTIVE'],
    [6, 'VERY_ACTIVE'],
  ];
  for (const row of ENERGY_ROWS) {
    const [ageMin, ageMax] = row;
    for (const [colOffset, activity] of palActivities) {
      const mBase = 2 + colOffset!;
      const mVal = row[mBase] as number | null;
      const fVal = row[mBase + 1] as number | null;
      if (mVal != null) {
        rows.push({
          compoundName: 'Energy',
          ageMinMonths: ageMin,
          ageMaxMonths: ageMax,
          sex: 'MALE', lifeStage: 'NONE', activityLevel: activity,
          valueType: 'EAR',
          value: Math.round(mVal * MJ_TO_KCAL),
          unit: 'kcal',
          valueNote: `Converted from ${mVal} MJ/d at PAL ${activity === 'SEDENTARY' ? '1.4' : activity === 'MODERATE' ? '1.6' : activity === 'ACTIVE' ? '1.8' : '2.0'}`,
        });
      }
      if (fVal != null) {
        rows.push({
          compoundName: 'Energy',
          ageMinMonths: ageMin,
          ageMaxMonths: ageMax,
          sex: 'FEMALE', lifeStage: 'NONE', activityLevel: activity,
          valueType: 'EAR',
          value: Math.round(fVal * MJ_TO_KCAL),
          unit: 'kcal',
          valueNote: `Converted from ${fVal} MJ/d at PAL ${activity === 'SEDENTARY' ? '1.4' : activity === 'MODERATE' ? '1.6' : activity === 'ACTIVE' ? '1.8' : '2.0'}`,
        });
      }
    }
  }
  // Pregnancy energy additions (over adult female PAL 1.6 = 9.0 MJ)
  const adultFemaleEnergy16_kcal = Math.round(9.0 * MJ_TO_KCAL);
  for (const [trim, addMJ] of [['PREGNANT_T1', PREG_ENERGY_ADD.T1], ['PREGNANT_T2', PREG_ENERGY_ADD.T2], ['PREGNANT_T3', PREG_ENERGY_ADD.T3]] as const) {
    rows.push({
      compoundName: 'Energy',
      ageMinMonths: 216, ageMaxMonths: 611,
      sex: 'FEMALE', lifeStage: trim, activityLevel: 'MODERATE',
      valueType: 'EAR',
      value: adultFemaleEnergy16_kcal + Math.round(addMJ * MJ_TO_KCAL),
      unit: 'kcal',
      valueNote: `Adult female PAL 1.6 base + ${addMJ} MJ/d for ${trim}`,
    });
  }
  rows.push({
    compoundName: 'Energy',
    ageMinMonths: 216, ageMaxMonths: 611,
    sex: 'FEMALE', lifeStage: 'LACTATING_0_6M', activityLevel: 'MODERATE',
    valueType: 'EAR',
    value: adultFemaleEnergy16_kcal + Math.round(LACT_ENERGY_ADD_06 * MJ_TO_KCAL),
    unit: 'kcal',
    valueNote: `Adult female PAL 1.6 base + ${LACT_ENERGY_ADD_06} MJ/d lactation 0-6mo`,
  });

  // ── Protein AR + PRI (g/kg bw/d → g/d via ref weight) ────────
  for (const p of PROTEIN_G_PER_KG) {
    const bw = REF_BW[p.age] ?? BW_ADULT;
    for (const sex of SEXES) {
      const arPerKg = sex === 'MALE' ? p.ar_M : (p.ar_F ?? p.ar_M);
      const priPerKg = sex === 'MALE' ? p.pri_M : (p.pri_F ?? p.pri_M);
      const w = sex === 'MALE' ? bw.M : bw.F;
      rows.push({
        compoundName: 'Protein', ageMinMonths: p.ageMin, ageMaxMonths: p.ageMax,
        sex, lifeStage: 'NONE', valueType: 'EAR',
        value: round2(arPerKg * w), unit: 'g',
        valueNote: `${arPerKg} g/kg × ${w} kg EFSA ref weight`,
      });
      rows.push({
        compoundName: 'Protein', ageMinMonths: p.ageMin, ageMaxMonths: p.ageMax,
        sex, lifeStage: 'NONE', valueType: 'RDA',
        value: round2(priPerKg * w), unit: 'g',
        valueNote: `${priPerKg} g/kg × ${w} kg EFSA ref weight`,
      });
    }
  }
  // Pregnancy protein additions
  const adultFProteinAR = round2(0.66 * BW_ADULT.F);
  const adultFProteinPRI = round2(0.83 * BW_ADULT.F);
  for (const [trim, adds] of [
    ['PREGNANT_T1', PROTEIN_PREG_ADD.T1],
    ['PREGNANT_T2', PROTEIN_PREG_ADD.T2],
    ['PREGNANT_T3', PROTEIN_PREG_ADD.T3],
  ] as const) {
    rows.push({
      compoundName: 'Protein', ageMinMonths: 216, ageMaxMonths: 611,
      sex: 'FEMALE', lifeStage: trim, valueType: 'EAR',
      value: round2(adultFProteinAR + adds.ar), unit: 'g',
      valueNote: `Adult F base ${adultFProteinAR}g + ${adds.ar}g/d ${trim}`,
    });
    rows.push({
      compoundName: 'Protein', ageMinMonths: 216, ageMaxMonths: 611,
      sex: 'FEMALE', lifeStage: trim, valueType: 'RDA',
      value: round2(adultFProteinPRI + adds.pri), unit: 'g',
      valueNote: `Adult F base ${adultFProteinPRI}g + ${adds.pri}g/d ${trim}`,
    });
  }
  // Lactation protein
  for (const [stage, adds] of [
    ['LACTATING_0_6M', PROTEIN_LACT_ADD['0_6M']],
    ['LACTATING_7_12M', PROTEIN_LACT_ADD['>6M']],
  ] as const) {
    rows.push({
      compoundName: 'Protein', ageMinMonths: 216, ageMaxMonths: 611,
      sex: 'FEMALE', lifeStage: stage, valueType: 'EAR',
      value: round2(adultFProteinAR + adds.ar), unit: 'g',
      valueNote: `Adult F base + ${adds.ar}g/d lactation`,
    });
    rows.push({
      compoundName: 'Protein', ageMinMonths: 216, ageMaxMonths: 611,
      sex: 'FEMALE', lifeStage: stage, valueType: 'RDA',
      value: round2(adultFProteinPRI + adds.pri), unit: 'g',
      valueNote: `Adult F base + ${adds.pri}g/d lactation`,
    });
  }

  // ── Macros (Table 3) ─────────────────────────────────────
  for (const m of MACROS) {
    // Total fat range
    if (m.fat_pct) {
      for (const sex of SEXES) {
        rows.push({
          compoundName: 'Fat', ageMinMonths: m.ageMin, ageMaxMonths: m.ageMax,
          sex, lifeStage: 'NONE', valueType: 'AMDR',
          value: (m.fat_pct[0] + m.fat_pct[1]) / 2,
          valueMin: m.fat_pct[0], valueMax: m.fat_pct[1],
          unit: '%E', isPercentOfEnergy: true,
        });
      }
    }
    // Carbs range
    if (m.carbs_pct) {
      for (const sex of SEXES) {
        rows.push({
          compoundName: 'Carbohydrate', ageMinMonths: m.ageMin, ageMaxMonths: m.ageMax,
          sex, lifeStage: 'NONE', valueType: 'AMDR',
          value: (m.carbs_pct[0] + m.carbs_pct[1]) / 2,
          valueMin: m.carbs_pct[0], valueMax: m.carbs_pct[1],
          unit: '%E', isPercentOfEnergy: true,
        });
      }
    }
    // LA (omega-6) — 4% of energy
    if (m.LA_pct) {
      for (const sex of SEXES) {
        rows.push({
          compoundName: 'LA', ageMinMonths: m.ageMin, ageMaxMonths: m.ageMax,
          sex, lifeStage: 'NONE', valueType: 'AI',
          value: m.LA_pct, unit: '%E', isPercentOfEnergy: true,
          valueNote: 'Linoleic acid (omega-6) as % of energy',
        });
      }
    }
    // ALA (omega-3) — 0.5% of energy
    if (m.ALA_pct) {
      for (const sex of SEXES) {
        rows.push({
          compoundName: 'ALA', ageMinMonths: m.ageMin, ageMaxMonths: m.ageMax,
          sex, lifeStage: 'NONE', valueType: 'AI',
          value: m.ALA_pct, unit: '%E', isPercentOfEnergy: true,
          valueNote: 'Alpha-linolenic acid (omega-3) as % of energy',
        });
      }
    }
    // EPA+DHA
    if (m.epaDha_mg) {
      const val = Array.isArray(m.epaDha_mg) ? (m.epaDha_mg[0] + m.epaDha_mg[1]) / 2 : m.epaDha_mg;
      const vMin = Array.isArray(m.epaDha_mg) ? m.epaDha_mg[0] : undefined;
      const vMax = Array.isArray(m.epaDha_mg) ? m.epaDha_mg[1] : undefined;
      for (const sex of SEXES) {
        rows.push({
          compoundName: 'EPA+DHA', ageMinMonths: m.ageMin, ageMaxMonths: m.ageMax,
          sex, lifeStage: 'NONE', valueType: 'AI',
          value: val, valueMin: vMin, valueMax: vMax,
          unit: 'mg',
          valueNote: 'EPA + DHA combined (mapped to Omega-3)',
        });
      }
    }
    // DHA (infants)
    if (m.dha_mg) {
      for (const sex of SEXES) {
        rows.push({
          compoundName: 'DHA', ageMinMonths: m.ageMin, ageMaxMonths: m.ageMax,
          sex, lifeStage: 'NONE', valueType: 'AI',
          value: m.dha_mg, unit: 'mg',
          valueNote: 'DHA (docosahexaenoic acid) — for infants',
        });
      }
    }
    // Fiber
    if (m.fiber_g) {
      for (const sex of SEXES) {
        rows.push({
          compoundName: 'Fiber', ageMinMonths: m.ageMin, ageMaxMonths: m.ageMax,
          sex, lifeStage: 'NONE', valueType: 'AI',
          value: m.fiber_g, unit: 'g',
        });
      }
    }
    // Water (L/d → mL)
    if (m.waterM_L) {
      rows.push({
        compoundName: 'Water', ageMinMonths: m.ageMin, ageMaxMonths: m.ageMax,
        sex: 'MALE', lifeStage: 'NONE', valueType: 'AI',
        value: m.waterM_L * 1000, unit: 'mL',
        valueNote: 'Total water intake (beverages + food moisture)',
      });
    }
    if (m.waterF_L) {
      rows.push({
        compoundName: 'Water', ageMinMonths: m.ageMin, ageMaxMonths: m.ageMax,
        sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI',
        value: m.waterF_L * 1000, unit: 'mL',
        valueNote: 'Total water intake (beverages + food moisture)',
      });
    }
  }
  // Pregnancy water (2.3L) + lactation water (2.7L)
  rows.push({ compoundName: 'Water', ageMinMonths: 216, ageMaxMonths: 611, sex: 'FEMALE', lifeStage: 'PREGNANT', valueType: 'AI', value: 2300, unit: 'mL' });
  rows.push({ compoundName: 'Water', ageMinMonths: 216, ageMaxMonths: 611, sex: 'FEMALE', lifeStage: 'LACTATING', valueType: 'AI', value: 2700, unit: 'mL' });

  // ── Vitamin AR (Tables 8/10) ──────────────────────────────
  const addVitAR = (rowData: typeof VIT_AR_MALE[0], sex: Sex, lifeStage: LifeStage) => {
    const mj = refEnergyMJ(rowData.ageMin, sex);
    const items: Array<[string, number | null, string]> = [
      ['Folate', rowData.folate, 'µg'],
      ['Riboflavin', rowData.riboflavin, 'mg'],
      ['Vitamin A', rowData.vitA, 'µg'],
      ['Vitamin B6', rowData.vitB6, 'mg'],
      ['Vitamin C', rowData.vitC, 'mg'],
      // Thiamin and Niacin derived from ratios
      ['Thiamin', round2(rowData.thiaminRatio * mj), 'mg'],
      ['Niacin', round2(rowData.niacinRatio * mj), 'mg'],
    ];
    for (const [compound, value, unit] of items) {
      if (value == null) continue;
      const note = (compound === 'Thiamin' || compound === 'Niacin')
        ? `Derived: ${compound === 'Thiamin' ? rowData.thiaminRatio + ' mg' : rowData.niacinRatio + ' NE'}/MJ × ${mj} MJ/d (PAL 1.4 ref)`
        : null;
      rows.push({
        compoundName: compound, ageMinMonths: rowData.ageMin, ageMaxMonths: rowData.ageMax,
        sex, lifeStage, valueType: 'EAR',
        value, unit, valueNote: note,
      });
    }
  };
  for (const r of VIT_AR_MALE) addVitAR(r, 'MALE', 'NONE');
  for (const r of VIT_AR_FEMALE) addVitAR(r, 'FEMALE', 'NONE');
  // Pregnancy + lactation AR (F only)
  addVitAR({ ageMin: 216, ageMax: 611, ...VIT_AR_FEMALE_PREG } as any, 'FEMALE', 'PREGNANT');
  addVitAR({ ageMin: 216, ageMax: 611, ...VIT_AR_FEMALE_LACT } as any, 'FEMALE', 'LACTATING');

  // ── Vitamin PRI/AI (Tables 9/11) ──────────────────────────
  // EFSA PRI vs AI per compound:
  // PRI: Cobalamin (≥1y), Folate (≥1y), Niacin, Riboflavin, Thiamin, VitA, VitB6, VitC
  // AI: Biotin, Choline, PantothenicAcid, VitD, VitK, α-Tocopherol, infants for PRI compounds
  const PRI_COMPOUNDS = new Set(['Folate', 'Riboflavin', 'Niacin', 'Thiamin', 'Vitamin A', 'Vitamin B6', 'Vitamin C', 'Cobalamin']);
  const addVitPRI = (rowData: typeof VIT_PRI_MALE[0], sex: Sex, lifeStage: LifeStage) => {
    const mj = refEnergyMJ(rowData.ageMin, sex);
    const isInfant = rowData.ageMin < 12;
    const items: Array<[string, number | null, string]> = [
      ['Biotin', rowData.biotin, 'µg'],
      ['Choline', rowData.choline, 'mg'],
      ['Cobalamin', rowData.cobalamin, 'µg'],
      ['Folate', rowData.folate, 'µg'],
      ['Pantothenic Acid', rowData.pantothenic, 'mg'],
      ['Riboflavin', rowData.riboflavin, 'mg'],
      ['Vitamin A', rowData.vitA, 'µg'],
      ['Vitamin B6', rowData.vitB6, 'mg'],
      ['Vitamin C', rowData.vitC, 'mg'],
      ['Vitamin D', rowData.vitD, 'µg'],
      ['Vitamin K', rowData.vitK, 'µg'],
      // Derived
      ['Thiamin', round2(rowData.thiaminRatio * mj), 'mg'],
      ['Niacin', round2(rowData.niacinRatio * mj), 'mg'],
    ];
    for (const [compound, value, unit] of items) {
      if (value == null) continue;
      const valueType: ValueType = isInfant ? 'AI' : (PRI_COMPOUNDS.has(compound) ? 'RDA' : 'AI');
      let note: string | null = null;
      if (compound === 'Thiamin' || compound === 'Niacin') {
        note = `Derived: ${compound === 'Thiamin' ? rowData.thiaminRatio : rowData.niacinRatio}/MJ × ${mj} MJ/d`;
      } else if (compound === 'Vitamin D') {
        note = 'Assumes minimal cutaneous synthesis (winter, northern latitude)';
      }
      rows.push({
        compoundName: compound, ageMinMonths: rowData.ageMin, ageMaxMonths: rowData.ageMax,
        sex, lifeStage, valueType,
        value, unit, valueNote: note,
      });
    }
  };
  for (const r of VIT_PRI_MALE) addVitPRI(r, 'MALE', 'NONE');
  for (const r of VIT_PRI_FEMALE) addVitPRI(r, 'FEMALE', 'NONE');
  // Pregnancy + lactation PRI
  addVitPRI({ ageMin: 216, ageMax: 611, ...VIT_PRI_PREG } as any, 'FEMALE', 'PREGNANT');
  addVitPRI({ ageMin: 216, ageMax: 611, ...VIT_PRI_LACT } as any, 'FEMALE', 'LACTATING');

  // α-Tocopherol (Vitamin E) — separate table
  for (const r of VIT_E_ALPHA_TOCOPHEROL) {
    const isInfant = r.ageMin < 12;
    rows.push({
      compoundName: 'Vitamin E', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax,
      sex: 'MALE', lifeStage: 'NONE', valueType: 'AI',
      value: r.M, unit: 'mg', valueNote: 'α-tocopherol equivalents',
    });
    rows.push({
      compoundName: 'Vitamin E', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax,
      sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI',
      value: r.F, unit: 'mg', valueNote: 'α-tocopherol equivalents',
    });
  }
  // Pregnancy + lactation Vit E
  rows.push({ compoundName: 'Vitamin E', ageMinMonths: 216, ageMaxMonths: 611, sex: 'FEMALE', lifeStage: 'PREGNANT', valueType: 'AI', value: VIT_PRI_PREG.alphaTocopherol, unit: 'mg' });
  rows.push({ compoundName: 'Vitamin E', ageMinMonths: 216, ageMaxMonths: 611, sex: 'FEMALE', lifeStage: 'LACTATING', valueType: 'AI', value: VIT_PRI_LACT.alphaTocopherol, unit: 'mg' });

  // ── Mineral AR: Calcium ───────────────────────────────────
  for (const r of CA_AR) {
    for (const sex of SEXES) {
      const v = sex === 'MALE' ? r.M : r.F;
      if (v == null) continue;
      rows.push({
        compoundName: 'Calcium', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax,
        sex, lifeStage: 'NONE', valueType: 'EAR', value: v, unit: 'mg',
      });
    }
  }
  // ── Mineral AR: Iron (with F premenopausal/postmenopausal split) ─
  for (const r of FE_AR) {
    if (r.F_premenopausal !== undefined || r.F_postmenopausal !== undefined) {
      // Adult female with menopause split
      const noteF = r.F_premenopausal !== undefined
        ? 'Iron AR for premenopausal females (menstruating)'
        : 'Iron AR for postmenopausal females';
      rows.push({
        compoundName: 'Iron', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax,
        sex: 'FEMALE', lifeStage: 'NONE', valueType: 'EAR',
        value: r.F!, unit: 'mg', valueNote: noteF,
      });
    } else {
      rows.push({
        compoundName: 'Iron', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax,
        sex: 'FEMALE', lifeStage: 'NONE', valueType: 'EAR',
        value: r.F!, unit: 'mg',
      });
    }
    rows.push({
      compoundName: 'Iron', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax,
      sex: 'MALE', lifeStage: 'NONE', valueType: 'EAR',
      value: r.M, unit: 'mg',
    });
  }
  // ── Mineral AR: Zinc (LPI 4 tiers for adults) ─────────────
  const LPI_TIERS: Array<[keyof typeof ZN_AR[0]['lpi'] & string, DietaryContext, string]> = [
    ['l300', 'PHYTATE_LOW', '300 mg phytate/d (refined grain omnivore)'],
    ['l600', 'PHYTATE_MED_LOW', '600 mg phytate/d (standard Western mixed)'],
    ['l900', 'PHYTATE_MED_HIGH', '900 mg phytate/d (mixed with whole grains)'],
    ['l1200', 'PHYTATE_HIGH', '1200 mg phytate/d (vegetarian/vegan)'],
  ];
  for (const r of ZN_AR) {
    if (r.single_M != null) {
      for (const sex of SEXES) {
        const v = sex === 'MALE' ? r.single_M : r.single_F!;
        rows.push({
          compoundName: 'Zinc', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax,
          sex, lifeStage: 'NONE', valueType: 'EAR',
          value: v, unit: 'mg',
        });
      }
    } else if (r.lpi) {
      for (const [key, context, note] of LPI_TIERS) {
        const vM = r.lpi[key].M; const vF = r.lpi[key].F;
        rows.push({
          compoundName: 'Zinc', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax,
          sex: 'MALE', lifeStage: 'NONE', valueType: 'EAR',
          value: vM, unit: 'mg', dietaryContext: context, valueNote: note,
        });
        rows.push({
          compoundName: 'Zinc', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax,
          sex: 'FEMALE', lifeStage: 'NONE', valueType: 'EAR',
          value: vF, unit: 'mg', dietaryContext: context, valueNote: note,
        });
      }
    }
  }

  // ── Mineral PRI/AI: Calcium ───────────────────────────────
  for (const r of CA_PRI) {
    for (const sex of SEXES) {
      rows.push({
        compoundName: 'Calcium', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax,
        sex, lifeStage: 'NONE', valueType: r.ageMin >= 12 ? 'RDA' : 'AI',
        value: r.value, unit: 'mg',
      });
    }
  }
  // Fluoride AI
  for (const r of FL_AI) {
    rows.push({ compoundName: 'Fluoride', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax, sex: 'MALE', lifeStage: 'NONE', valueType: 'AI', value: r.M, unit: 'mg' });
    rows.push({ compoundName: 'Fluoride', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'AI', value: r.F, unit: 'mg' });
  }
  // Iodine AI
  for (const r of I_AI) {
    for (const sex of SEXES) {
      rows.push({ compoundName: 'Iodine', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax, sex, lifeStage: 'NONE', valueType: 'AI', value: r.value, unit: 'µg' });
    }
  }
  // Manganese AI
  for (const r of MN_AI) {
    for (const sex of SEXES) {
      rows.push({ compoundName: 'Manganese', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax, sex, lifeStage: 'NONE', valueType: 'AI', value: r.value, unit: 'mg' });
    }
  }
  // Molybdenum AI
  for (const r of MO_AI) {
    for (const sex of SEXES) {
      rows.push({ compoundName: 'Molybdenum', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax, sex, lifeStage: 'NONE', valueType: 'AI', value: r.value, unit: 'µg' });
    }
  }
  // Phosphorus AI
  for (const r of P_AI) {
    for (const sex of SEXES) {
      rows.push({ compoundName: 'Phosphorus', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax, sex, lifeStage: 'NONE', valueType: 'AI', value: r.value, unit: 'mg' });
    }
  }
  // Potassium AI
  for (const r of K_AI) {
    for (const sex of SEXES) {
      rows.push({ compoundName: 'Potassium', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax, sex, lifeStage: 'NONE', valueType: 'AI', value: r.value, unit: 'mg' });
    }
  }
  // Selenium AI
  for (const r of SE_AI) {
    for (const sex of SEXES) {
      rows.push({ compoundName: 'Selenium', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax, sex, lifeStage: 'NONE', valueType: 'AI', value: r.value, unit: 'µg' });
    }
  }
  // Iron PRI (with menopause split)
  for (const r of FE_PRI) {
    rows.push({ compoundName: 'Iron', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax, sex: 'MALE', lifeStage: 'NONE', valueType: 'RDA', value: r.M, unit: 'mg' });
    const noteF = r.F_premenopausal != null ? 'Premenopausal females (95% coverage). Postmenopausal: 11 mg.' : (r.F_postmenopausal != null ? 'Postmenopausal females' : null);
    rows.push({
      compoundName: 'Iron', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax,
      sex: 'FEMALE', lifeStage: 'NONE', valueType: 'RDA',
      value: r.F!, unit: 'mg', valueNote: noteF,
    });
  }
  // Copper PRI
  for (const r of CU_PRI) {
    rows.push({ compoundName: 'Copper', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax, sex: 'MALE', lifeStage: 'NONE', valueType: 'RDA', value: r.M, unit: 'mg' });
    rows.push({ compoundName: 'Copper', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'RDA', value: r.F, unit: 'mg' });
  }
  // Magnesium PRI
  for (const r of MG_PRI) {
    rows.push({ compoundName: 'Magnesium', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax, sex: 'MALE', lifeStage: 'NONE', valueType: 'RDA', value: r.M, unit: 'mg' });
    rows.push({ compoundName: 'Magnesium', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax, sex: 'FEMALE', lifeStage: 'NONE', valueType: 'RDA', value: r.F, unit: 'mg' });
  }
  // Zinc PRI (with LPI tiers for adults)
  for (const r of ZN_PRI) {
    if (r.single_M != null) {
      for (const sex of SEXES) {
        const v = sex === 'MALE' ? r.single_M : r.single_F!;
        rows.push({
          compoundName: 'Zinc', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax,
          sex, lifeStage: 'NONE', valueType: 'RDA',
          value: v, unit: 'mg',
        });
      }
    } else if (r.lpi) {
      for (const [key, context, note] of LPI_TIERS) {
        const vM = r.lpi[key].M; const vF = r.lpi[key].F;
        rows.push({
          compoundName: 'Zinc', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax,
          sex: 'MALE', lifeStage: 'NONE', valueType: 'RDA',
          value: vM, unit: 'mg', dietaryContext: context, valueNote: note,
        });
        rows.push({
          compoundName: 'Zinc', ageMinMonths: r.ageMin, ageMaxMonths: r.ageMax,
          sex: 'FEMALE', lifeStage: 'NONE', valueType: 'RDA',
          value: vF, unit: 'mg', dietaryContext: context, valueNote: note,
        });
      }
    }
  }

  // ── EFSA ULs (from ul-summary-2024.pdf v11, 2025) ─────────
  // Source: EFSA Tolerable Upper Intake Levels Summary Report v11 (August 2025)
  // Includes re-evaluations: Calcium (2012), Vit D infants (2018) & 2023,
  // Selenium/Vit B6/Folate/Manganese (2023), Iron/Vit A/β-carotene (2024),
  // Fluoride (2025). "ND" = Not Determined/Derived — skip.
  // Age brackets vary per nutrient — each row explicit.
  type UL = { compound: string; ageMin: number; ageMax: number | null;
              sex: 'BOTH' | 'FEMALE'; lifeStage: LifeStage;
              value: number; unit: string; note?: string };

  const EFSA_ULS: UL[] = [
    // Calcium — adults + preg/lact, children ND
    { compound: 'Calcium', ageMin: 216, ageMax: null, sex: 'BOTH', lifeStage: 'NONE', value: 2500, unit: 'mg' },
    { compound: 'Calcium', ageMin: 180, ageMax: 611, sex: 'FEMALE', lifeStage: 'PREGNANT', value: 2500, unit: 'mg' },
    { compound: 'Calcium', ageMin: 180, ageMax: 611, sex: 'FEMALE', lifeStage: 'LACTATING', value: 2500, unit: 'mg' },

    // Copper — no preg/lact UL (ND)
    { compound: 'Copper', ageMin: 12,  ageMax: 47,   sex: 'BOTH', lifeStage: 'NONE', value: 1, unit: 'mg' },
    { compound: 'Copper', ageMin: 48,  ageMax: 83,   sex: 'BOTH', lifeStage: 'NONE', value: 2, unit: 'mg' },
    { compound: 'Copper', ageMin: 84,  ageMax: 131,  sex: 'BOTH', lifeStage: 'NONE', value: 3, unit: 'mg' },
    { compound: 'Copper', ageMin: 132, ageMax: 179,  sex: 'BOTH', lifeStage: 'NONE', value: 4, unit: 'mg' },
    { compound: 'Copper', ageMin: 180, ageMax: 215,  sex: 'BOTH', lifeStage: 'NONE', value: 4, unit: 'mg' },
    { compound: 'Copper', ageMin: 216, ageMax: null, sex: 'BOTH', lifeStage: 'NONE', value: 5, unit: 'mg' },

    // Iodine
    { compound: 'Iodine', ageMin: 12,  ageMax: 47,   sex: 'BOTH', lifeStage: 'NONE', value: 200, unit: 'µg' },
    { compound: 'Iodine', ageMin: 48,  ageMax: 83,   sex: 'BOTH', lifeStage: 'NONE', value: 250, unit: 'µg' },
    { compound: 'Iodine', ageMin: 84,  ageMax: 131,  sex: 'BOTH', lifeStage: 'NONE', value: 300, unit: 'µg' },
    { compound: 'Iodine', ageMin: 132, ageMax: 179,  sex: 'BOTH', lifeStage: 'NONE', value: 450, unit: 'µg' },
    { compound: 'Iodine', ageMin: 180, ageMax: 215,  sex: 'BOTH', lifeStage: 'NONE', value: 500, unit: 'µg' },
    { compound: 'Iodine', ageMin: 216, ageMax: null, sex: 'BOTH', lifeStage: 'NONE', value: 600, unit: 'µg' },
    { compound: 'Iodine', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT',  value: 600, unit: 'µg' },
    { compound: 'Iodine', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'LACTATING', value: 600, unit: 'µg' },

    // Magnesium — supplemental only, all demographics
    { compound: 'Magnesium', ageMin: 48,  ageMax: 83,   sex: 'BOTH', lifeStage: 'NONE', value: 250, unit: 'mg', note: 'Supplemental magnesium only (readily dissociable salts + MgO supplements/water); does not include Mg naturally in foods' },
    { compound: 'Magnesium', ageMin: 84,  ageMax: 131,  sex: 'BOTH', lifeStage: 'NONE', value: 250, unit: 'mg', note: 'Supplemental magnesium only' },
    { compound: 'Magnesium', ageMin: 132, ageMax: 179,  sex: 'BOTH', lifeStage: 'NONE', value: 250, unit: 'mg', note: 'Supplemental magnesium only' },
    { compound: 'Magnesium', ageMin: 180, ageMax: 215,  sex: 'BOTH', lifeStage: 'NONE', value: 250, unit: 'mg', note: 'Supplemental magnesium only' },
    { compound: 'Magnesium', ageMin: 216, ageMax: null, sex: 'BOTH', lifeStage: 'NONE', value: 250, unit: 'mg', note: 'Supplemental magnesium only' },
    { compound: 'Magnesium', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT',  value: 250, unit: 'mg', note: 'Supplemental magnesium only' },
    { compound: 'Magnesium', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'LACTATING', value: 250, unit: 'mg', note: 'Supplemental magnesium only' },

    // Molybdenum (mg/d source → converted to µg)
    { compound: 'Molybdenum', ageMin: 12,  ageMax: 47,   sex: 'BOTH', lifeStage: 'NONE', value: 100, unit: 'µg' },
    { compound: 'Molybdenum', ageMin: 48,  ageMax: 83,   sex: 'BOTH', lifeStage: 'NONE', value: 200, unit: 'µg' },
    { compound: 'Molybdenum', ageMin: 84,  ageMax: 131,  sex: 'BOTH', lifeStage: 'NONE', value: 250, unit: 'µg' },
    { compound: 'Molybdenum', ageMin: 132, ageMax: 179,  sex: 'BOTH', lifeStage: 'NONE', value: 400, unit: 'µg' },
    { compound: 'Molybdenum', ageMin: 180, ageMax: 215,  sex: 'BOTH', lifeStage: 'NONE', value: 500, unit: 'µg' },
    { compound: 'Molybdenum', ageMin: 216, ageMax: null, sex: 'BOTH', lifeStage: 'NONE', value: 600, unit: 'µg' },
    { compound: 'Molybdenum', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT',  value: 600, unit: 'µg' },
    { compound: 'Molybdenum', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'LACTATING', value: 600, unit: 'µg' },

    // Selenium — all ages including infants
    { compound: 'Selenium', ageMin: 4,   ageMax: 6,    sex: 'BOTH', lifeStage: 'NONE', value: 45,  unit: 'µg' },
    { compound: 'Selenium', ageMin: 7,   ageMax: 11,   sex: 'BOTH', lifeStage: 'NONE', value: 55,  unit: 'µg' },
    { compound: 'Selenium', ageMin: 12,  ageMax: 47,   sex: 'BOTH', lifeStage: 'NONE', value: 70,  unit: 'µg' },
    { compound: 'Selenium', ageMin: 48,  ageMax: 83,   sex: 'BOTH', lifeStage: 'NONE', value: 95,  unit: 'µg' },
    { compound: 'Selenium', ageMin: 84,  ageMax: 131,  sex: 'BOTH', lifeStage: 'NONE', value: 130, unit: 'µg' },
    { compound: 'Selenium', ageMin: 132, ageMax: 179,  sex: 'BOTH', lifeStage: 'NONE', value: 180, unit: 'µg' },
    { compound: 'Selenium', ageMin: 180, ageMax: 215,  sex: 'BOTH', lifeStage: 'NONE', value: 230, unit: 'µg' },
    { compound: 'Selenium', ageMin: 216, ageMax: null, sex: 'BOTH', lifeStage: 'NONE', value: 255, unit: 'µg' },
    { compound: 'Selenium', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT',  value: 255, unit: 'µg' },
    { compound: 'Selenium', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'LACTATING', value: 255, unit: 'µg' },

    // Zinc
    { compound: 'Zinc', ageMin: 12,  ageMax: 47,   sex: 'BOTH', lifeStage: 'NONE', value: 7,  unit: 'mg' },
    { compound: 'Zinc', ageMin: 48,  ageMax: 83,   sex: 'BOTH', lifeStage: 'NONE', value: 10, unit: 'mg' },
    { compound: 'Zinc', ageMin: 84,  ageMax: 131,  sex: 'BOTH', lifeStage: 'NONE', value: 13, unit: 'mg' },
    { compound: 'Zinc', ageMin: 132, ageMax: 179,  sex: 'BOTH', lifeStage: 'NONE', value: 18, unit: 'mg' },
    { compound: 'Zinc', ageMin: 180, ageMax: 215,  sex: 'BOTH', lifeStage: 'NONE', value: 22, unit: 'mg' },
    { compound: 'Zinc', ageMin: 216, ageMax: null, sex: 'BOTH', lifeStage: 'NONE', value: 25, unit: 'mg' },
    { compound: 'Zinc', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT',  value: 25, unit: 'mg' },
    { compound: 'Zinc', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'LACTATING', value: 25, unit: 'mg' },

    // Fluoride — strict UL children only; adults/preg/lact use "safe level" 3.3
    { compound: 'Fluoride', ageMin: 12,  ageMax: 47,  sex: 'BOTH', lifeStage: 'NONE', value: 1.0, unit: 'mg' },
    { compound: 'Fluoride', ageMin: 48,  ageMax: 107, sex: 'BOTH', lifeStage: 'NONE', value: 1.6, unit: 'mg', note: 'Ages 4-8' },
    // Ages 9+ use "safe level" rather than strict UL — store with note
    { compound: 'Fluoride', ageMin: 108, ageMax: 215, sex: 'BOTH', lifeStage: 'NONE', value: 3.3, unit: 'mg', note: 'Safe level of intake (not strict UL) — intakes above do not necessarily indicate risk' },
    { compound: 'Fluoride', ageMin: 216, ageMax: null,sex: 'BOTH', lifeStage: 'NONE', value: 3.3, unit: 'mg', note: 'Safe level of intake (not strict UL)' },
    { compound: 'Fluoride', ageMin: 180, ageMax: 611, sex: 'FEMALE', lifeStage: 'PREGNANT',  value: 3.3, unit: 'mg', note: 'Safe level of intake (not strict UL)' },
    { compound: 'Fluoride', ageMin: 180, ageMax: 611, sex: 'FEMALE', lifeStage: 'LACTATING', value: 3.3, unit: 'mg', note: 'Safe level of intake (not strict UL)' },

    // Iron — "safe levels" (insufficient data for strict UL)
    { compound: 'Iron', ageMin: 4,   ageMax: 6,    sex: 'BOTH', lifeStage: 'NONE', value: 5,  unit: 'mg', note: 'Safe level — supplemental iron only (excludes infant formula)' },
    { compound: 'Iron', ageMin: 7,   ageMax: 11,   sex: 'BOTH', lifeStage: 'NONE', value: 5,  unit: 'mg', note: 'Safe level — supplemental iron only' },
    { compound: 'Iron', ageMin: 12,  ageMax: 47,   sex: 'BOTH', lifeStage: 'NONE', value: 10, unit: 'mg', note: 'Safe level of intake (not strict UL)' },
    { compound: 'Iron', ageMin: 48,  ageMax: 83,   sex: 'BOTH', lifeStage: 'NONE', value: 15, unit: 'mg', note: 'Safe level of intake (not strict UL)' },
    { compound: 'Iron', ageMin: 84,  ageMax: 131,  sex: 'BOTH', lifeStage: 'NONE', value: 20, unit: 'mg', note: 'Safe level of intake (not strict UL)' },
    { compound: 'Iron', ageMin: 132, ageMax: 179,  sex: 'BOTH', lifeStage: 'NONE', value: 30, unit: 'mg', note: 'Safe level of intake (not strict UL)' },
    { compound: 'Iron', ageMin: 180, ageMax: 215,  sex: 'BOTH', lifeStage: 'NONE', value: 35, unit: 'mg', note: 'Safe level of intake (not strict UL)' },
    { compound: 'Iron', ageMin: 216, ageMax: null, sex: 'BOTH', lifeStage: 'NONE', value: 40, unit: 'mg', note: 'Safe level of intake (not strict UL)' },
    { compound: 'Iron', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT',  value: 40, unit: 'mg', note: 'Safe level of intake (not strict UL)' },
    { compound: 'Iron', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'LACTATING', value: 40, unit: 'mg', note: 'Safe level of intake (not strict UL)' },

    // Manganese — "safe levels" (different age buckets)
    { compound: 'Manganese', ageMin: 4,   ageMax: 11,   sex: 'BOTH', lifeStage: 'NONE', value: 2, unit: 'mg', note: 'Safe level of intake (not strict UL)' },
    { compound: 'Manganese', ageMin: 12,  ageMax: 35,   sex: 'BOTH', lifeStage: 'NONE', value: 4, unit: 'mg', note: 'Safe level of intake (not strict UL)' },
    { compound: 'Manganese', ageMin: 36,  ageMax: 83,   sex: 'BOTH', lifeStage: 'NONE', value: 5, unit: 'mg', note: 'Safe level of intake (not strict UL)' },
    { compound: 'Manganese', ageMin: 84,  ageMax: 167,  sex: 'BOTH', lifeStage: 'NONE', value: 6, unit: 'mg', note: 'Safe level of intake (not strict UL)' },
    { compound: 'Manganese', ageMin: 168, ageMax: 215,  sex: 'BOTH', lifeStage: 'NONE', value: 7, unit: 'mg', note: 'Safe level of intake (not strict UL)' },
    { compound: 'Manganese', ageMin: 216, ageMax: null, sex: 'BOTH', lifeStage: 'NONE', value: 8, unit: 'mg', note: 'Safe level of intake (not strict UL)' },
    { compound: 'Manganese', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT',  value: 8, unit: 'mg', note: 'Safe level of intake (not strict UL)' },
    { compound: 'Manganese', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'LACTATING', value: 8, unit: 'mg', note: 'Safe level of intake (not strict UL)' },

    // Folate (UL applies to folic acid only)
    { compound: 'Folate', ageMin: 4,   ageMax: 6,    sex: 'BOTH', lifeStage: 'NONE', value: 200,  unit: 'µg', note: 'Applies to folic acid (synthetic) only' },
    { compound: 'Folate', ageMin: 7,   ageMax: 11,   sex: 'BOTH', lifeStage: 'NONE', value: 200,  unit: 'µg', note: 'Applies to folic acid (synthetic) only' },
    { compound: 'Folate', ageMin: 12,  ageMax: 47,   sex: 'BOTH', lifeStage: 'NONE', value: 200,  unit: 'µg', note: 'Applies to folic acid (synthetic) only' },
    { compound: 'Folate', ageMin: 48,  ageMax: 83,   sex: 'BOTH', lifeStage: 'NONE', value: 300,  unit: 'µg', note: 'Applies to folic acid (synthetic) only' },
    { compound: 'Folate', ageMin: 84,  ageMax: 131,  sex: 'BOTH', lifeStage: 'NONE', value: 400,  unit: 'µg', note: 'Applies to folic acid (synthetic) only' },
    { compound: 'Folate', ageMin: 132, ageMax: 179,  sex: 'BOTH', lifeStage: 'NONE', value: 600,  unit: 'µg', note: 'Applies to folic acid (synthetic) only' },
    { compound: 'Folate', ageMin: 180, ageMax: 215,  sex: 'BOTH', lifeStage: 'NONE', value: 800,  unit: 'µg', note: 'Applies to folic acid (synthetic) only' },
    { compound: 'Folate', ageMin: 216, ageMax: null, sex: 'BOTH', lifeStage: 'NONE', value: 1000, unit: 'µg', note: 'Applies to folic acid (synthetic) only' },
    { compound: 'Folate', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT',  value: 1000, unit: 'µg', note: 'Applies to folic acid (synthetic) only' },
    { compound: 'Folate', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'LACTATING', value: 1000, unit: 'µg', note: 'Applies to folic acid (synthetic) only' },

    // Niacin — form-specific: Nicotinamide vs Nicotinic Acid
    { compound: 'Nicotinamide', ageMin: 12,  ageMax: 47,   sex: 'BOTH', lifeStage: 'NONE', value: 150, unit: 'mg' },
    { compound: 'Nicotinamide', ageMin: 48,  ageMax: 83,   sex: 'BOTH', lifeStage: 'NONE', value: 220, unit: 'mg' },
    { compound: 'Nicotinamide', ageMin: 84,  ageMax: 131,  sex: 'BOTH', lifeStage: 'NONE', value: 350, unit: 'mg' },
    { compound: 'Nicotinamide', ageMin: 132, ageMax: 179,  sex: 'BOTH', lifeStage: 'NONE', value: 500, unit: 'mg' },
    { compound: 'Nicotinamide', ageMin: 180, ageMax: 215,  sex: 'BOTH', lifeStage: 'NONE', value: 700, unit: 'mg' },
    { compound: 'Nicotinamide', ageMin: 216, ageMax: null, sex: 'BOTH', lifeStage: 'NONE', value: 900, unit: 'mg' },
    { compound: 'Nicotinic Acid', ageMin: 12,  ageMax: 47,   sex: 'BOTH', lifeStage: 'NONE', value: 2,  unit: 'mg' },
    { compound: 'Nicotinic Acid', ageMin: 48,  ageMax: 83,   sex: 'BOTH', lifeStage: 'NONE', value: 3,  unit: 'mg' },
    { compound: 'Nicotinic Acid', ageMin: 84,  ageMax: 131,  sex: 'BOTH', lifeStage: 'NONE', value: 4,  unit: 'mg' },
    { compound: 'Nicotinic Acid', ageMin: 132, ageMax: 179,  sex: 'BOTH', lifeStage: 'NONE', value: 6,  unit: 'mg' },
    { compound: 'Nicotinic Acid', ageMin: 180, ageMax: 215,  sex: 'BOTH', lifeStage: 'NONE', value: 8,  unit: 'mg' },
    { compound: 'Nicotinic Acid', ageMin: 216, ageMax: null, sex: 'BOTH', lifeStage: 'NONE', value: 10, unit: 'mg' },

    // Vitamin A (preformed retinol + retinyl esters — UL does not include provitamin A)
    { compound: 'Vitamin A', ageMin: 4,   ageMax: 6,    sex: 'BOTH', lifeStage: 'NONE', value: 600,  unit: 'µg', note: 'Preformed retinol + retinyl esters only' },
    { compound: 'Vitamin A', ageMin: 7,   ageMax: 11,   sex: 'BOTH', lifeStage: 'NONE', value: 600,  unit: 'µg', note: 'Preformed retinol + retinyl esters only' },
    { compound: 'Vitamin A', ageMin: 12,  ageMax: 47,   sex: 'BOTH', lifeStage: 'NONE', value: 800,  unit: 'µg', note: 'Preformed retinol + retinyl esters only' },
    { compound: 'Vitamin A', ageMin: 48,  ageMax: 83,   sex: 'BOTH', lifeStage: 'NONE', value: 1100, unit: 'µg', note: 'Preformed retinol + retinyl esters only' },
    { compound: 'Vitamin A', ageMin: 84,  ageMax: 131,  sex: 'BOTH', lifeStage: 'NONE', value: 1500, unit: 'µg', note: 'Preformed retinol + retinyl esters only' },
    { compound: 'Vitamin A', ageMin: 132, ageMax: 179,  sex: 'BOTH', lifeStage: 'NONE', value: 2000, unit: 'µg', note: 'Preformed retinol + retinyl esters only' },
    { compound: 'Vitamin A', ageMin: 180, ageMax: 215,  sex: 'BOTH', lifeStage: 'NONE', value: 2600, unit: 'µg', note: 'Preformed retinol + retinyl esters only' },
    { compound: 'Vitamin A', ageMin: 216, ageMax: null, sex: 'BOTH', lifeStage: 'NONE', value: 3000, unit: 'µg', note: 'Preformed retinol + retinyl esters only' },
    { compound: 'Vitamin A', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT',  value: 3000, unit: 'µg', note: 'Preformed retinol + retinyl esters only' },
    { compound: 'Vitamin A', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'LACTATING', value: 3000, unit: 'µg', note: 'Preformed retinol + retinyl esters only' },

    // Vitamin B6
    { compound: 'Vitamin B6', ageMin: 4,   ageMax: 6,    sex: 'BOTH', lifeStage: 'NONE', value: 2.2,  unit: 'mg' },
    { compound: 'Vitamin B6', ageMin: 7,   ageMax: 11,   sex: 'BOTH', lifeStage: 'NONE', value: 2.5,  unit: 'mg' },
    { compound: 'Vitamin B6', ageMin: 12,  ageMax: 47,   sex: 'BOTH', lifeStage: 'NONE', value: 3.2,  unit: 'mg' },
    { compound: 'Vitamin B6', ageMin: 48,  ageMax: 83,   sex: 'BOTH', lifeStage: 'NONE', value: 4.5,  unit: 'mg' },
    { compound: 'Vitamin B6', ageMin: 84,  ageMax: 131,  sex: 'BOTH', lifeStage: 'NONE', value: 6.1,  unit: 'mg' },
    { compound: 'Vitamin B6', ageMin: 132, ageMax: 179,  sex: 'BOTH', lifeStage: 'NONE', value: 8.6,  unit: 'mg' },
    { compound: 'Vitamin B6', ageMin: 180, ageMax: 215,  sex: 'BOTH', lifeStage: 'NONE', value: 10.7, unit: 'mg' },
    { compound: 'Vitamin B6', ageMin: 216, ageMax: null, sex: 'BOTH', lifeStage: 'NONE', value: 12,   unit: 'mg' },
    { compound: 'Vitamin B6', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT',  value: 12, unit: 'mg' },
    { compound: 'Vitamin B6', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'LACTATING', value: 12, unit: 'mg' },

    // Vitamin E
    { compound: 'Vitamin E', ageMin: 12,  ageMax: 47,   sex: 'BOTH', lifeStage: 'NONE', value: 100, unit: 'mg' },
    { compound: 'Vitamin E', ageMin: 48,  ageMax: 83,   sex: 'BOTH', lifeStage: 'NONE', value: 120, unit: 'mg' },
    { compound: 'Vitamin E', ageMin: 84,  ageMax: 131,  sex: 'BOTH', lifeStage: 'NONE', value: 160, unit: 'mg' },
    { compound: 'Vitamin E', ageMin: 132, ageMax: 179,  sex: 'BOTH', lifeStage: 'NONE', value: 220, unit: 'mg' },
    { compound: 'Vitamin E', ageMin: 180, ageMax: 215,  sex: 'BOTH', lifeStage: 'NONE', value: 260, unit: 'mg' },
    { compound: 'Vitamin E', ageMin: 216, ageMax: null, sex: 'BOTH', lifeStage: 'NONE', value: 300, unit: 'mg' },
    { compound: 'Vitamin E', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT',  value: 300, unit: 'mg' },
    { compound: 'Vitamin E', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'LACTATING', value: 300, unit: 'mg' },

    // Vitamin D (VDE = vitamin D equivalent; includes D3, D2, calcidiol)
    { compound: 'Vitamin D', ageMin: 0,   ageMax: 6,    sex: 'BOTH', lifeStage: 'NONE', value: 25,  unit: 'µg' },
    { compound: 'Vitamin D', ageMin: 7,   ageMax: 11,   sex: 'BOTH', lifeStage: 'NONE', value: 35,  unit: 'µg' },
    { compound: 'Vitamin D', ageMin: 12,  ageMax: 47,   sex: 'BOTH', lifeStage: 'NONE', value: 50,  unit: 'µg' },
    { compound: 'Vitamin D', ageMin: 48,  ageMax: 83,   sex: 'BOTH', lifeStage: 'NONE', value: 50,  unit: 'µg' },
    { compound: 'Vitamin D', ageMin: 84,  ageMax: 131,  sex: 'BOTH', lifeStage: 'NONE', value: 50,  unit: 'µg' },
    { compound: 'Vitamin D', ageMin: 132, ageMax: 179,  sex: 'BOTH', lifeStage: 'NONE', value: 100, unit: 'µg' },
    { compound: 'Vitamin D', ageMin: 180, ageMax: 215,  sex: 'BOTH', lifeStage: 'NONE', value: 100, unit: 'µg' },
    { compound: 'Vitamin D', ageMin: 216, ageMax: null, sex: 'BOTH', lifeStage: 'NONE', value: 100, unit: 'µg' },
    { compound: 'Vitamin D', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'PREGNANT',  value: 100, unit: 'µg' },
    { compound: 'Vitamin D', ageMin: 180, ageMax: 611,  sex: 'FEMALE', lifeStage: 'LACTATING', value: 100, unit: 'µg' },
  ];

  for (const ul of EFSA_ULS) {
    const sexes: Sex[] = ul.sex === 'BOTH' ? SEXES : [ul.sex];
    for (const sex of sexes) {
      rows.push({
        compoundName: ul.compound,
        ageMinMonths: ul.ageMin, ageMaxMonths: ul.ageMax,
        sex, lifeStage: ul.lifeStage, valueType: 'UL',
        value: ul.value, unit: ul.unit,
        valueNote: ul.note ?? null,
      });
    }
  }

  // ── Pregnancy + lactation minerals (Table 7 F only) ───────
  const addMineralPregLact = (stage: 'PREGNANT' | 'LACTATING', data: typeof MIN_PREG) => {
    // Calcium has age split
    rows.push({ compoundName: 'Calcium', ageMinMonths: 216, ageMaxMonths: 299, sex: 'FEMALE', lifeStage: stage, valueType: 'RDA', value: data.Ca_18_24, unit: 'mg' });
    rows.push({ compoundName: 'Calcium', ageMinMonths: 300, ageMaxMonths: 611, sex: 'FEMALE', lifeStage: stage, valueType: 'RDA', value: data.Ca_25plus, unit: 'mg' });
    // Others
    const items: Array<[string, number, string, ValueType]> = [
      ['Fluoride', data.Fl, 'mg', 'AI'],
      ['Iodine', data.I, 'µg', 'AI'],
      ['Manganese', data.Mn, 'mg', 'AI'],
      ['Molybdenum', data.Mo, 'µg', 'AI'],
      ['Phosphorus', data.P, 'mg', 'AI'],
      ['Potassium', data.K, 'mg', 'AI'],
      ['Selenium', data.Se, 'µg', 'AI'],
      ['Iron', data.Fe, 'mg', 'RDA'],
      ['Copper', data.Cu, 'mg', 'RDA'],
      ['Magnesium', data.Mg, 'mg', 'RDA'],
    ];
    for (const [compound, value, unit, vt] of items) {
      rows.push({
        compoundName: compound, ageMinMonths: 216, ageMaxMonths: 611,
        sex: 'FEMALE', lifeStage: stage, valueType: vt,
        value, unit,
      });
    }
    // Zinc LPI tiers
    const zMap: Array<[keyof typeof MIN_PREG & string, DietaryContext, string]> = [
      ['Zn_LPI_300', 'PHYTATE_LOW', '300 mg phytate/d'],
      ['Zn_LPI_600', 'PHYTATE_MED_LOW', '600 mg phytate/d'],
      ['Zn_LPI_900', 'PHYTATE_MED_HIGH', '900 mg phytate/d'],
      ['Zn_LPI_1200', 'PHYTATE_HIGH', '1200 mg phytate/d'],
    ];
    for (const [key, context, note] of zMap) {
      rows.push({
        compoundName: 'Zinc', ageMinMonths: 216, ageMaxMonths: 611,
        sex: 'FEMALE', lifeStage: stage, valueType: 'RDA',
        value: (data as any)[key], unit: 'mg', dietaryContext: context, valueNote: note,
      });
    }
  };
  addMineralPregLact('PREGNANT', MIN_PREG);
  addMineralPregLact('LACTATING', MIN_LACT);

  return rows;
}

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
        sex, life_stage, activity_level, dietary_context, value_type,
        value, value_min, value_max, unit,
        is_percent_of_energy, is_provisional, value_note
      ) VALUES (
        ${compoundId}, ${SOURCE.regionCode}, ${source.id},
        ${row.ageMinMonths}, ${row.ageMaxMonths},
        ${row.sex}, ${row.lifeStage},
        ${row.activityLevel ?? null}, ${row.dietaryContext ?? null},
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
        is_percent_of_energy = EXCLUDED.is_percent_of_energy,
        value_note = EXCLUDED.value_note
      RETURNING (xmax = 0) AS inserted
    `;
    if (result[0]?.inserted) inserted++; else updated++;
  }

  console.log('─'.repeat(60));
  console.log(`✅ EFSA DRV seed complete`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Updated:  ${updated}`);
  console.log(`   Skipped:  ${skipped}`);
  console.log('─'.repeat(60));
}

seed()
  .catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); })
  .finally(() => sql.end());
