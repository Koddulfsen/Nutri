/**
 * Weighted merging of nutrients across multiple variants of a parent food
 * (Duke plant_parts, FooDB orig_food_name variants).
 *
 * Each variant contributes `percent / 100` of its values; results are summed
 * per compound. Ranges (amount_low / amount_high) are weighted independently
 * so they're preserved through the blend.
 */

import type { DukeStagingNutrient } from './duke-client';
import type { FooDBStagingNutrient } from './foodb-client';

export interface VariantNutrients<T> {
  variant: string;
  percent: number; // 0 < percent <= 100; sum across entries must equal 100
  nutrients: T[];
}

/**
 * Group key: compoundId when mapped, otherwise the source-specific name so
 * unmapped entries don't all collide into one bucket.
 */
function dukeKey(n: DukeStagingNutrient): string {
  return n.compoundId ?? `unmapped:${n.dukeChemId}`;
}

function foodbKey(n: FooDBStagingNutrient): string {
  return n.compoundId ?? `unmapped:${n.foodbCompoundId}`;
}

export function mergeDukeVariants(
  entries: VariantNutrients<DukeStagingNutrient>[],
): DukeStagingNutrient[] {
  const buckets = new Map<
    string,
    {
      sample: DukeStagingNutrient;
      value: number;
      lowSum: number;
      highSum: number;
      lowWeight: number;
      highWeight: number;
    }
  >();

  for (const entry of entries) {
    const w = entry.percent / 100;
    for (const n of entry.nutrients) {
      const key = dukeKey(n);
      const bucket = buckets.get(key);
      if (!bucket) {
        buckets.set(key, {
          sample: n,
          value: n.value * w,
          lowSum: n.amountLow !== null ? n.amountLow * w : 0,
          highSum: n.amountHigh !== null ? n.amountHigh * w : 0,
          lowWeight: n.amountLow !== null ? w : 0,
          highWeight: n.amountHigh !== null ? w : 0,
        });
      } else {
        bucket.value += n.value * w;
        if (n.amountLow !== null) {
          bucket.lowSum += n.amountLow * w;
          bucket.lowWeight += w;
        }
        if (n.amountHigh !== null) {
          bucket.highSum += n.amountHigh * w;
          bucket.highWeight += w;
        }
      }
    }
  }

  return Array.from(buckets.values()).map((b) => ({
    ...b.sample,
    plantPart: null, // composite — no single part to attribute to
    value: b.value,
    amountLow: b.lowWeight > 0 ? b.lowSum : null,
    amountHigh: b.highWeight > 0 ? b.highSum : null,
  }));
}

export function mergeFooDBVariants(
  entries: VariantNutrients<FooDBStagingNutrient>[],
): FooDBStagingNutrient[] {
  const buckets = new Map<string, { sample: FooDBStagingNutrient; value: number }>();

  for (const entry of entries) {
    const w = entry.percent / 100;
    for (const n of entry.nutrients) {
      const key = foodbKey(n);
      const bucket = buckets.get(key);
      if (!bucket) {
        buckets.set(key, { sample: n, value: n.value * w });
      } else {
        bucket.value += n.value * w;
      }
    }
  }

  return Array.from(buckets.values()).map((b) => ({
    ...b.sample,
    value: b.value,
  }));
}
