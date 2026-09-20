/**
 * Daily totals payload — the shape GET /api/daily-totals and POST
 * /api/meals/sync both return: per-compound amounts plus each compound's
 * daily value, % of it, and zone.
 *
 * Extracted from the daily-totals route so both endpoints build the payload
 * the same way. The one addition is `prefetchDvCompoundIds`: daily values
 * depend only on (compound, age, sex), not on what was eaten, so they can be
 * looked up WHILE the totals are still being calculated instead of after —
 * one fewer step on the critical path. Any compound in the totals that the
 * prefetch didn't cover is looked up afterwards, so results are identical.
 */

import {
  getDailyValuesBatch,
  getDailyValuesBatchByDemographics,
  calculatePercentDV,
} from './daily-value-service';
import type { CompoundValue } from './daily-totals-service';

/**
 * Convert a nutrient amount between unit systems. Returns null when units aren't
 * comparable (e.g. mg vs IU, kcal vs mg). Handles common mass conversions only —
 * good enough for the alpha; energy/IU/kJ stay null.
 */
function convertToUnit(amount: number, from: string, to: string): number | null {
  if (from === to) return amount;
  const norm = (u: string) => u.replace('μ', 'µ').toLowerCase();
  const f = norm(from);
  const t = norm(to);
  if (f === t) return amount;
  const mass: Record<string, number> = { g: 1, mg: 0.001, µg: 0.000001, ug: 0.000001, mcg: 0.000001 };
  if (mass[f] != null && mass[t] != null) return (amount * mass[f]) / mass[t];
  return null;
}

interface DvValue {
  value: number;
  unit: string;
  source: string | null;
  upperLimit?: number | null;
  upperLimitUnit?: string | null;
}

export interface TotalsInput {
  date: string;
  compounds: CompoundValue[];
  lastUpdated: Date;
}

/** compoundId → daily value, via the picker's age/sex or the user's own profile. */
async function lookupDvs(
  userId: string,
  compoundIds: string[],
  age: number | undefined,
  sex: 'MALE' | 'FEMALE' | undefined
): Promise<Map<string, DvValue>> {
  const dvValues = new Map<string, DvValue>();
  if (compoundIds.length === 0) return dvValues;

  if (age !== undefined && sex !== undefined) {
    const lookup = await getDailyValuesBatchByDemographics({ compoundIds, ageYears: age, sex });
    lookup.forEach((row, id) => {
      if (row.target != null && row.targetUnit) {
        dvValues.set(id, {
          value: row.target,
          unit: row.targetUnit,
          source: 'average',
          upperLimit: row.upperLimit,
          upperLimitUnit: row.upperLimitUnit,
        });
      }
    });
  } else {
    const legacy = await getDailyValuesBatch(userId, compoundIds);
    legacy.forEach((v, id) => dvValues.set(id, { value: v.value, unit: v.unit, source: v.source }));
  }
  return dvValues;
}

export async function buildDailyTotalsPayload(args: {
  userId: string;
  /** The calculated totals, or a promise for them (lets the DV prefetch overlap the calculation). */
  totals: TotalsInput | Promise<TotalsInput>;
  age?: number;
  sex?: 'MALE' | 'FEMALE';
  prefetchDvCompoundIds?: string[];
}) {
  const { userId, age, sex, prefetchDvCompoundIds } = args;

  const prefetch = prefetchDvCompoundIds?.length
    ? lookupDvs(userId, prefetchDvCompoundIds, age, sex)
    : null;
  // If the totals calculation throws we never await this — don't leave an unhandled rejection.
  prefetch?.catch(() => {});

  const totals = await args.totals;
  const compoundIds = totals.compounds.map((c) => c.compoundId);

  let dvValues: Map<string, DvValue>;
  if (prefetch) {
    dvValues = await prefetch;
    const covered = new Set(prefetchDvCompoundIds);
    const missing = compoundIds.filter((id) => !covered.has(id));
    if (missing.length > 0) {
      (await lookupDvs(userId, missing, age, sex)).forEach((v, id) => dvValues.set(id, v));
    }
  } else {
    dvValues = await lookupDvs(userId, compoundIds, age, sex);
  }

  const calories = totals.compounds.find((c) => c.name === 'Energy')?.amount || 0;
  const macros = {
    carbs: totals.compounds.find((c) => c.name === 'Total Carbohydrate')?.amount || 0,
    protein: totals.compounds.find((c) => c.name === 'Protein')?.amount || 0,
    fat: totals.compounds.find((c) => c.name === 'Total Fat')?.amount || 0,
  };

  return {
    date: totals.date,
    compounds: totals.compounds.map((c) => {
      const dv = dvValues.get(c.compoundId);

      let rdaPercent: number | null = null;
      let zone: 'deficient' | 'low' | 'optimal' | 'high' | 'excess' | 'unknown' = 'unknown';

      if (dv) {
        // Convert intake to DV unit if they differ (mg <-> µg, mg <-> g).
        const intakeInDvUnit = convertToUnit(c.amount, c.unit, dv.unit);
        if (intakeInDvUnit != null) {
          const percentResult = calculatePercentDV(intakeInDvUnit, dv.value);
          rdaPercent = percentResult.percent;
          zone = percentResult.status;
        }
      }

      return {
        compoundId: c.compoundId,
        name: c.name,
        amount: c.amount,
        unit: c.unit,
        confidence: c.confidence,
        zone,
        rdaPercent,
        dailyValue: dv
          ? {
              value: dv.value,
              unit: dv.unit,
              source: dv.source,
              upperLimit: dv.upperLimit ?? null,
              upperLimitUnit: dv.upperLimitUnit ?? null,
            }
          : null,
        showProgressBar: true,
        displayPriority: 0,
      };
    }),
    calories,
    healthScore: 0,
    macros,
    lastUpdated: totals.lastUpdated.toISOString(),
  };
}
