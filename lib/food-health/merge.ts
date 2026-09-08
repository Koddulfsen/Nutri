/**
 * Combine one compound's values from several sources into a single number.
 *
 * The merge this replaces summed raw values and labelled the result with
 * whichever source happened to be first in the group:
 *
 *   const sum = nutrients.reduce((acc, n) => acc + n.value, 0);
 *   const average = sum / nutrients.length;
 *   unit: nutrients[0].unit
 *
 * It never consulted a unit. Apple tryptophan merged to 0.7274 g from nine
 * sources: seven agreed on ~0.001-0.005 g, while FINELI (3.9) and FRIDA (2.586)
 * arrived in milligrams at conversion_factor 1.0 and dragged the average about
 * 700x high. The stored row carried source_count 9, so the wrongest value in the
 * set looked like the best-corroborated one.
 *
 * Two guards, in order:
 *
 *   1. NORMALIZE. Everything is converted to the target unit before averaging.
 *      A value whose unit measures something else entirely (%T = percent of
 *      total fatty acids, mg/gN = per gram nitrogen) is dropped, not guessed at.
 *
 *   2. REJECT MAGNITUDE OUTLIERS. Labels do not catch the case above, because
 *      every one of those nine values was labelled 'g' — the milligrams were
 *      hidden in a wrong conversion_factor upstream. So a value more than 100x
 *      from the median of its peers is excluded from the average as a probable
 *      scale error. Sources genuinely disagree about trace nutrients by 2-3x and
 *      occasionally 10x; 100x is not disagreement, it is a different unit.
 *
 * Nothing is discarded silently. Every exclusion is returned in `excluded` with
 * a reason, for the review step to show before the food is written.
 *
 * The median is only trustworthy while most sources are right. For amino acids
 * that is currently NOT true — FINELI, FRIDA and MEXT all store mg at factor 1.0
 * (scripts/audit-magnitudes.ts), so on a food where those three outvote the rest
 * the guard will exclude the correct values instead. It still surfaces the
 * conflict rather than averaging through it, but the factors are the real fix.
 */
import { conversionBetween, parseUnit } from './units';
import { median } from './outliers';

/** Beyond this multiple of the median, a value is a unit error, not a disagreement. */
export const MAGNITUDE_THRESHOLD = 100;

/** Below this many values there is no majority, so no outlier can be identified. */
const MIN_FOR_OUTLIER_TEST = 3;

export type MergeInput = {
  value: number;
  unit: string;
  apiSource: string;
};

export type Excluded<T> = {
  input: T;
  reason: 'incompatible-unit' | 'magnitude-outlier';
  detail: string;
};

export type MergeResult<T extends MergeInput> = {
  /** Mean of the kept values, in `unit`. */
  averageValue: number;
  unit: string;
  /** Values that survived both guards, normalized to `unit`. */
  kept: { input: T; normalizedValue: number }[];
  excluded: Excluded<T>[];
};

/**
 * The unit to normalize onto: the one the most values already carry. Ties break
 * toward the first seen, which keeps the result stable for a given input order.
 */
function targetUnit<T extends MergeInput>(values: T[]): string {
  const counts = new Map<string, number>();
  for (const v of values) {
    const u = v.unit || '';
    counts.set(u, (counts.get(u) ?? 0) + 1);
  }
  let best = values[0]?.unit ?? '';
  let bestCount = -1;
  for (const [unit, count] of counts) {
    if (count > bestCount) {
      best = unit;
      bestCount = count;
    }
  }
  return best;
}

export function mergeCompoundValues<T extends MergeInput>(values: T[]): MergeResult<T> {
  const excluded: Excluded<T>[] = [];

  if (values.length === 0) {
    return { averageValue: 0, unit: '', kept: [], excluded };
  }

  const unit = targetUnit(values);

  // ---- guard 1: normalize, or drop ----
  const normalized: { input: T; normalizedValue: number }[] = [];
  for (const v of values) {
    if ((v.unit || '') === unit) {
      normalized.push({ input: v, normalizedValue: v.value });
      continue;
    }
    const factor = conversionBetween(v.unit, unit);
    if (factor === null) {
      excluded.push({
        input: v,
        reason: 'incompatible-unit',
        detail: `${v.apiSource}: ${v.unit || '(none)'} cannot be expressed as ${unit}`,
      });
      continue;
    }
    normalized.push({ input: v, normalizedValue: v.value * factor });
  }

  if (normalized.length === 0) {
    return { averageValue: 0, unit, kept: [], excluded };
  }

  // ---- guard 2: reject magnitude outliers ----
  // Zero and near-zero values carry no ratio information, so they neither vote
  // for the median nor get tested against it.
  const positive = normalized.filter((n) => n.normalizedValue > 0);
  let kept = normalized;

  if (positive.length >= MIN_FOR_OUTLIER_TEST) {
    const med = median(positive.map((n) => n.normalizedValue));
    if (med > 0) {
      kept = [];
      for (const n of normalized) {
        if (n.normalizedValue <= 0) {
          kept.push(n);
          continue;
        }
        const ratio = n.normalizedValue / med;
        if (ratio > MAGNITUDE_THRESHOLD || ratio < 1 / MAGNITUDE_THRESHOLD) {
          excluded.push({
            input: n.input,
            reason: 'magnitude-outlier',
            detail:
              `${n.input.apiSource}: ${n.normalizedValue} ${unit} is ` +
              `${ratio >= 1 ? `${ratio.toPrecision(3)}x` : `1/${(1 / ratio).toPrecision(3)}`} ` +
              `the median of ${med.toPrecision(3)} ${unit}`,
          });
          continue;
        }
        kept.push(n);
      }
    }
  }

  // Every value looked like a scale error against every other one. Averaging
  // them would be worse than keeping them for a human to look at.
  if (kept.length === 0) {
    return {
      averageValue: median(normalized.map((n) => n.normalizedValue)),
      unit,
      kept: normalized,
      excluded: excluded.filter((e) => e.reason === 'incompatible-unit'),
    };
  }

  const sum = kept.reduce((acc, n) => acc + n.normalizedValue, 0);
  return { averageValue: sum / kept.length, unit, kept, excluded };
}

/** True when the unit is one we can reason about at all. */
export function isKnownUnit(unit: string | null | undefined): boolean {
  return conversionBetween(unit, unit) !== null && parseUnit(unit).magnitude !== '';
}
