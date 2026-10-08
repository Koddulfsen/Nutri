/**
 * Daily totals payload — the shape GET /api/daily-totals and POST
 * /api/meals/sync both return: per-compound amounts plus each compound's
 * daily value, % of it, and zone.
 *
 * The arithmetic (units, % of target, zones) is in lib/nutrition/totals.ts,
 * shared with the browser; this file only fetches the daily values.
 *
 * `prefetchDvCompoundIds`: daily values depend only on (compound, age, sex),
 * not on what was eaten, so they can be looked up WHILE the totals are still
 * being calculated instead of after — one fewer step on the critical path.
 * Any compound in the totals that the prefetch didn't cover is looked up
 * afterwards, so results are identical.
 */

import { getDailyValuesBatch, getDailyValuesBatchByDemographics } from './daily-value-service';
import type { CompoundValue } from './daily-totals-service';
import { assemblePayload, type DvValue } from '@/lib/nutrition/totals';

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
          sourceCount: row.targetSourceCount,
          sources: row.targetSources,
          spread: row.targetSpread,
          supplementLimit: row.supplementLimit,
        });
      } else if (row.upperLimit != null && row.upperLimitUnit) {
        // A ceiling with no target behind it. Until 2026-10-08 this branch did not exist, so every compound no
        // body sets a requirement for — cadmium, mercury, retinol, nicotinamide, cholesterol, boron, nickel and
        // four more — was dropped here and rendered "No DV" despite having a verified, resolved limit. The bar
        // is goal-shaped (its width is the target), so a limit-only compound had nothing to be a fraction OF.
        //
        // `limitOnly` tells the UI the number is a ceiling and the percentage counts headroom used, not progress.
        //
        // The division is Jens's call (2026-10-08): the page is one day and the contaminant limits are weekly, so
        // the weekly figure is divided down to sit beside everything else. `perDayFrom` keeps what was actually
        // published, because NO body sets a daily cadmium or mercury ceiling — presenting the quotient without
        // saying it is a quotient would state something nobody published.
        const days = row.averagingDays && row.averagingDays > 1 ? row.averagingDays : 1;
        dvValues.set(id, {
          value: row.upperLimit / days,
          unit: row.upperLimitUnit,
          source: 'limit',
          sourceCount: row.upperLimitSourceCount,
          limitOnly: true,
          perDayFrom: days > 1 ? { averagingDays: days, publishedValue: row.upperLimit } : null,
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

  return assemblePayload({
    date: totals.date,
    compounds: totals.compounds,
    lastUpdated: totals.lastUpdated,
    dvValues,
  });
}
