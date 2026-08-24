/**
 * Cross-source outlier detection for a single compound across food sources.
 *
 * Motivating case: "Gelatin" was imported from 13 sources. Ten reported ~86 g protein
 * (pure gelatin); three reported 7.8 g because they had matched *gelatin dessert mix*,
 * a mostly-sugar product. Nothing flagged it. That is the shape this must catch:
 * not a lone stray value, but a MINORITY CLUSTER that is internally consistent.
 *
 * Design constraints that rule out the obvious approaches:
 *
 *   - Mean/stddev is dragged toward a minority cluster and flags nothing. Use the median.
 *   - MAD is frequently exactly 0 here, because sources copy each other (CNF derives from
 *     USDA, so identical values are normal). A naive modified z-score then divides by zero
 *     and flags every remaining source. Needs an explicit fallback.
 *   - n is small (2-14). Asymptotic tests do not apply.
 *   - Trace nutrients genuinely vary 3x between countries; proximates do not. A single
 *     relative threshold cannot serve both, so severity is scaled by nutrient class.
 *
 * Sensitivity: deliberately high. A false flag costs a glance; a missed one costs
 * silent bad data, which is what this project keeps paying for.
 */

export type Severity = 'high' | 'medium' | 'low';

export interface SourceValue {
  source: string;
  value: number;
  /** Optional: the source's own name for the matched food, e.g. "Gelatin desserts, dry mix" */
  matchedName?: string | null;
}

export interface OutlierFlag {
  source: string;
  value: number;
  matchedName?: string | null;
  /** How far from the consensus, as a multiple (2 = twice the median) */
  ratio: number;
  modifiedZ: number | null;
  severity: Severity;
  reason: string;
}

export interface CompoundAnalysis {
  compound: string;
  unit: string | null;
  n: number;
  median: number;
  min: number;
  max: number;
  /** Ratio of max to min among non-zero values — a quick "how bad is the spread" number */
  spread: number;
  flags: OutlierFlag[];
  /** Two internally-consistent groups, e.g. 3 sources at 7.8 vs 10 at 86 */
  cluster: {
    minorityMedian: number;
    majorityMedian: number;
    minoritySources: string[];
    majoritySources: string[];
    ratio: number;
  } | null;
  /** Highest severity present, for sorting a review list */
  worst: Severity | null;
}

/** Proximates are near-identical across countries. Disagreement means a wrong food match. */
const PROXIMATES = new Set([
  'water', 'protein', 'total fat', 'carbohydrates', 'carbohydrates (excluding fiber)',
  'energy', 'ash', 'dietary fiber', 'total sugars',
]);

/**
 * Minerals and vitamins vary with soil, feed, season and analytical method. Real spreads of
 * 2-3x are normal and must not drown the list, so they need a wider band than proximates.
 */
const WIDE_BAND = new Set([
  'selenium', 'iodine', 'vitamin d (total)', 'vitamin k1 (phylloquinone)', 'chromium',
  'molybdenum', 'manganese', 'copper', 'retinol', 'vitamin a (rae)', 'beta-carotene',
  'folate (total)', 'vitamin c (total)', 'vitamin e (total)',
]);

export interface DetectOptions {
  /** Values at or below this are treated as "effectively zero" and excluded from ratios. */
  zeroFloor?: number;
  /** Modified z-score above which a value is flagged. Lower = more sensitive. */
  zThreshold?: number;
  /** Ratio to the median above which a value is flagged, for proximates. */
  proximateRatio?: number;
  /** Ratio to the median above which a value is flagged, for wide-band nutrients. */
  wideRatio?: number;
  /** Default ratio for everything else. */
  defaultRatio?: number;
  /**
   * Minimum practical deviation before a z-score alone may flag a value.
   *
   * When sources agree almost exactly (common — several derive from USDA), MAD collapses
   * and the z-score explodes for values that differ by a few percent. Protein 17.4 against
   * a median of 20.3 is z=4.3 but only 1.17x: statistically notable, practically normal
   * between food tables. Such values are still reported, but as 'low'.
   */
  zMinRatio?: number;
}

const DEFAULTS: Required<DetectOptions> = {
  zeroFloor: 1e-9,
  zThreshold: 3.0,      // Iglewicz-Hoaglin suggest 3.5; tightened for sensitivity
  proximateRatio: 1.35, // protein 21 vs 28 is already suspicious
  wideRatio: 4.0,
  defaultRatio: 2.5,
  zMinRatio: 1.15,
};

export function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Median absolute deviation. Frequently 0 here — callers must handle that. */
export function mad(xs: number[], med = median(xs)): number {
  if (xs.length === 0) return NaN;
  return median(xs.map((x) => Math.abs(x - med)));
}

function bandFor(compound: string, o: Required<DetectOptions>): number {
  const c = compound.trim().toLowerCase();
  if (PROXIMATES.has(c)) return o.proximateRatio;
  if (WIDE_BAND.has(c)) return o.wideRatio;
  return o.defaultRatio;
}

function severityFor(compound: string, ratio: number, band: number): Severity {
  const isProximate = PROXIMATES.has(compound.trim().toLowerCase());
  if (ratio >= band * 2) return 'high';
  if (isProximate) return ratio >= band * 1.3 ? 'high' : 'medium';
  return ratio >= band * 1.5 ? 'medium' : 'low';
}

/**
 * Find two internally-consistent groups separated by a large gap.
 *
 * This is the gelatin detector. A minority cluster whose members agree with each other is
 * far more likely to be a wrong food match than measurement noise, so it is reported even
 * when the individual values would not trip the per-value tests.
 */
function findCluster(values: SourceValue[]): CompoundAnalysis['cluster'] {
  const usable = values.filter((v) => Number.isFinite(v.value) && v.value > 0);
  if (usable.length < 4) return null; // need >=2 per side to call it a cluster

  const sorted = [...usable].sort((a, b) => a.value - b.value);

  let bestIdx = -1;
  let bestRatio = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const lo = sorted[i].value;
    const hi = sorted[i + 1].value;
    if (lo <= 0) continue;
    const r = hi / lo;
    // both sides must have at least 2 members
    if (i + 1 >= 2 && sorted.length - (i + 1) >= 2 && r > bestRatio) {
      bestRatio = r;
      bestIdx = i;
    }
  }

  if (bestIdx === -1 || bestRatio < 1.8) return null;

  const low = sorted.slice(0, bestIdx + 1);
  const high = sorted.slice(bestIdx + 1);
  const lowMed = median(low.map((v) => v.value));
  const highMed = median(high.map((v) => v.value));

  // Whichever side has fewer members is the suspect one.
  const minorityIsLow = low.length <= high.length;
  return {
    minorityMedian: minorityIsLow ? lowMed : highMed,
    majorityMedian: minorityIsLow ? highMed : lowMed,
    minoritySources: (minorityIsLow ? low : high).map((v) => v.source),
    majoritySources: (minorityIsLow ? high : low).map((v) => v.source),
    ratio: highMed / lowMed,
  };
}

export function analyzeCompound(
  compound: string,
  unit: string | null,
  values: SourceValue[],
  options: DetectOptions = {}
): CompoundAnalysis {
  const o = { ...DEFAULTS, ...options };
  const finite = values.filter((v) => Number.isFinite(v.value));
  const nums = finite.map((v) => v.value);

  const med = median(nums);
  const nonZero = nums.filter((x) => Math.abs(x) > o.zeroFloor);
  const minNZ = nonZero.length ? Math.min(...nonZero) : 0;
  const maxNZ = nonZero.length ? Math.max(...nonZero) : 0;

  const base: CompoundAnalysis = {
    compound,
    unit,
    n: finite.length,
    median: med,
    min: nums.length ? Math.min(...nums) : NaN,
    max: nums.length ? Math.max(...nums) : NaN,
    spread: minNZ > 0 ? maxNZ / minNZ : 1,
    flags: [],
    cluster: null,
    worst: null,
  };

  if (finite.length < 2) return base;

  const band = bandFor(compound, o);
  const m = mad(nums, med);
  // 0.6745 makes the modified z-score comparable to a standard z-score.
  const scaledMad = m > 0 ? m / 0.6745 : 0;

  for (const v of finite) {
    const dev = Math.abs(v.value - med);

    // A source reporting zero while the consensus is clearly non-zero is a real signal
    // (usually an unmapped or missing column), not a rounding artifact.
    const isZeroAgainstNonZero = Math.abs(v.value) <= o.zeroFloor && Math.abs(med) > o.zeroFloor;

    // Ratio against the median, in whichever direction is larger.
    let ratio = 1;
    if (Math.abs(med) > o.zeroFloor && Math.abs(v.value) > o.zeroFloor) {
      ratio = Math.max(v.value / med, med / v.value);
    } else if (isZeroAgainstNonZero) {
      ratio = Infinity;
    }

    const z = scaledMad > 0 ? Math.abs(v.value - med) / scaledMad : null;

    const reasons: string[] = [];
    const breachesRatio = ratio !== Infinity && ratio >= band;
    // z alone may flag, but only once the value is practically different, not merely
    // statistically so against a near-zero MAD.
    const breachesZ = z !== null && z > o.zThreshold && ratio >= o.zMinRatio;

    if (isZeroAgainstNonZero) reasons.push(`reports 0 where others report ~${med.toPrecision(3)}`);
    if (breachesRatio) reasons.push(`${ratio.toFixed(1)}x the median`);
    if (breachesZ) reasons.push(`${((ratio - 1) * 100).toFixed(0)}% from a tight consensus (z=${z!.toFixed(1)})`);

    // MAD collapses to 0 whenever half the sources agree exactly, which is common because
    // several sources derive from USDA. Fall back to the ratio test alone in that case.
    if (reasons.length === 0) continue;
    if (dev <= o.zeroFloor) continue;

    base.flags.push({
      source: v.source,
      value: v.value,
      matchedName: v.matchedName ?? null,
      ratio,
      modifiedZ: z,
      // A z-only flag on a tight cluster is worth showing but is not evidence of a wrong
      // food — keep it at the bottom of the list.
      severity: isZeroAgainstNonZero
        ? 'high'
        : breachesRatio
          ? severityFor(compound, ratio, band)
          : 'low',
      reason: reasons.join(', '),
    });
  }

  base.cluster = findCluster(finite);

  // A coherent minority cluster is a strong signal even if individual values were not
  // extreme enough to flag on their own — promote those sources.
  if (base.cluster && base.cluster.ratio >= 1.8) {
    for (const src of base.cluster.minoritySources) {
      const existing = base.flags.find((f) => f.source === src);
      const val = finite.find((v) => v.source === src)!;
      const reason =
        `clusters with ${base.cluster.minoritySources.length} source(s) at ` +
        `~${base.cluster.minorityMedian.toPrecision(3)} vs ${base.cluster.majoritySources.length} at ` +
        `~${base.cluster.majorityMedian.toPrecision(3)} — likely a different food`;
      if (existing) {
        existing.reason += `; ${reason}`;
        existing.severity = 'high';
      } else {
        base.flags.push({
          source: src,
          value: val.value,
          matchedName: val.matchedName ?? null,
          ratio: base.cluster.ratio,
          modifiedZ: null,
          severity: 'high',
          reason,
        });
      }
    }
  }

  const order: Severity[] = ['high', 'medium', 'low'];
  base.flags.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity) || b.ratio - a.ratio);
  base.worst = base.flags.length ? base.flags[0].severity : null;

  return base;
}
