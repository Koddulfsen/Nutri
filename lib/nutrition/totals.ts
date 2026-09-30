/**
 * Nutrient totals — the arithmetic behind every number on /analysis.
 *
 * Pure: no database, no framework imports, so the SAME code runs on the
 * server (which stays the source of truth) and in the browser (which uses it
 * to update totals the instant a food is added, removed or selected, before
 * the server has answered). Keeping one copy is what stops the two from
 * drifting apart; do not re-implement any of this elsewhere.
 *
 * Nutrient values are per 100 g of food.
 */

/** One nutrient of one food, per 100 g, already resolved to a single value. */
export interface NutrientRow {
  compoundId: string;
  name: string;
  value: number;
  unit: string;
  /** How many sources agreed on this value (drives the confidence proxy) */
  sourceCount: number;
}

/** Everything known about one food: its nutrients per 100 g. */
export type FoodVector = NutrientRow[];

/** A mass of one food. */
export interface Atom {
  foodId: string;
  grams: number;
}

export interface CompoundValue {
  compoundId: string;
  name: string;
  amount: number;
  unit: string;
  confidence: number;
}

export interface AggregatedRow {
  compoundId: string;
  name: string;
  amount: number;
  unit: string;
  sourceCount: number;
}

/**
 * Grams for a meal item. portionSize is treated as grams (the nutrient values
 * are per 100 g); anything unparseable counts as 100 g.
 */
export function portionGrams(portionSize: string | number): number {
  return parseFloat(String(portionSize)) || 100;
}

/**
 * Sum each compound over the given foods.
 *
 * Deterministic for a given set of atoms whatever order they arrive in:
 * atoms are processed sorted by (foodId, grams), and a compound takes its
 * name, unit and sourceCount from the first row that mentions it. Server and
 * browser get their items in different orders, so this is what makes them
 * agree. A food with no vector contributes nothing.
 */
export function aggregateTotals(
  atoms: Atom[],
  vectors: Map<string, FoodVector> | Record<string, FoodVector>
): AggregatedRow[] {
  const vectorOf = (foodId: string): FoodVector | undefined =>
    vectors instanceof Map ? vectors.get(foodId) : vectors[foodId];

  const ordered = [...atoms].sort((a, b) =>
    a.foodId < b.foodId ? -1 : a.foodId > b.foodId ? 1 : a.grams - b.grams
  );

  const byCompound = new Map<string, AggregatedRow>();
  for (const atom of ordered) {
    const multiplier = atom.grams / 100;
    for (const row of vectorOf(atom.foodId) ?? []) {
      let total = byCompound.get(row.compoundId);
      if (!total) {
        total = {
          compoundId: row.compoundId,
          name: row.name,
          amount: 0,
          unit: row.unit,
          sourceCount: row.sourceCount || 1,
        };
        byCompound.set(row.compoundId, total);
      }
      const contribution = row.value * multiplier;

      // Foods do not agree on units. `merged_nutrients` stores each compound in whatever unit that
      // food's own sources used, and 15 compounds are currently stored in more than one across foods —
      // biotin in both `g` and `µg`, B12 in both. Adding those numbers together treats a gram as a
      // microgram, and taking the label from whichever row arrived first can multiply a whole day's
      // intake by a million on the way to the bar.
      if (row.unit !== total.unit) {
        // Nothing real has been added yet, so there is no quantity to preserve and the incoming unit is
        // the better label. This is the common case: a food with no data for a compound stores 0 in `g`,
        // and that zero should not decide how the foods that DO have data are read.
        if (total.amount === 0) {
          total.unit = row.unit;
          total.amount = contribution;
          continue;
        }
        const converted = convertToUnit(contribution, row.unit, total.unit);
        // Two units that cannot be converted are not the same quantity — µg of folate and µg DFE of
        // folate count different things — so the contribution is left out rather than silently added to
        // something it does not belong with. It is the lesser of two wrongs, not a good outcome.
        if (converted == null) continue;
        total.amount += converted;
        continue;
      }
      total.amount += contribution;
    }
  }
  return [...byCompound.values()];
}

export function toCompoundValues(rows: AggregatedRow[]): CompoundValue[] {
  return rows.map((r) => ({
    compoundId: r.compoundId,
    name: r.name,
    amount: r.amount,
    unit: r.unit,
    // sourceCount as a confidence proxy (more sources = higher confidence)
    confidence: Math.min(100, r.sourceCount * 33),
  }));
}

export function computeCompoundValues(
  atoms: Atom[],
  vectors: Map<string, FoodVector> | Record<string, FoodVector>
): CompoundValue[] {
  return toCompoundValues(aggregateTotals(atoms, vectors));
}

/**
 * Collapse a composite food (a recipe) into a single per-100 g vector of its
 * own, so it can be treated like any other food. `atoms` is the composite
 * expanded for exactly 100 g of it. Totals are linear in grams, so scaling
 * the flattened vector gives the same result as scaling each component.
 */
export function flattenToVector(
  atoms: Atom[],
  vectors: Map<string, FoodVector> | Record<string, FoodVector>
): FoodVector {
  return aggregateTotals(atoms, vectors)
    .map((r) => ({ compoundId: r.compoundId, name: r.name, value: r.amount, unit: r.unit, sourceCount: r.sourceCount }))
    .sort((a, b) => (a.compoundId < b.compoundId ? -1 : a.compoundId > b.compoundId ? 1 : 0));
}

// ─── Daily values ────────────────────────────────────────────────────────────

export interface DvStatus {
  percent: number;
  status: 'deficient' | 'low' | 'optimal' | 'high' | 'excess';
}

/** Percent of a daily value, and where that falls. */
export function calculatePercentDV(intake: number, dailyValue: number): DvStatus {
  if (dailyValue <= 0) {
    return { percent: 0, status: 'optimal' };
  }

  const percent = (intake / dailyValue) * 100;

  let status: DvStatus['status'];
  if (percent < 10) {
    status = 'deficient';
  } else if (percent < 50) {
    status = 'low';
  } else if (percent <= 150) {
    status = 'optimal';
  } else if (percent <= 200) {
    status = 'high';
  } else {
    status = 'excess';
  }

  return { percent, status };
}

/**
 * Convert a nutrient amount between unit systems. Returns null when units aren't
 * comparable (e.g. mg vs IU, kcal vs mg). Handles common mass conversions only —
 * good enough for the alpha; energy/IU/kJ stay null.
 */
export function convertToUnit(amount: number, from: string, to: string): number | null {
  if (from === to) return amount;
  const norm = (u: string) => u.replace('μ', 'µ').toLowerCase();
  const f = norm(from);
  const t = norm(to);
  if (f === t) return amount;
  const mass: Record<string, number> = { g: 1, mg: 0.001, µg: 0.000001, ug: 0.000001, mcg: 0.000001 };
  if (mass[f] != null && mass[t] != null) return (amount * mass[f]) / mass[t];
  return null;
}

export interface DvValue {
  value: number;
  unit: string;
  source: string | null;
  upperLimit?: number | null;
  upperLimitUnit?: string | null;
  /**
   * How well founded the target is: which independent bodies set it, and how far apart they are. A value backed by
   * one book and one backed by ten are different claims and should not render identically — see
   * dv-sources/PROVENANCE.md for why only ten bodies count at all.
   */
  sourceCount?: number;
  sources?: string[];
  spread?: [number, number] | null;
  /** A ceiling that applies only to supplements or fortified foods — never to be compared with intake from food. */
  supplementLimit?: { value: number; unit: string; sourceCount: number } | null;
}

export type DvZone = 'deficient' | 'low' | 'optimal' | 'high' | 'excess' | 'unknown';

/**
 * The daily-totals payload /analysis renders: each compound's amount plus its
 * daily value, % of it, and zone. Same shape GET /api/daily-totals returns.
 */
export function assemblePayload(args: {
  date: string;
  compounds: CompoundValue[];
  lastUpdated: Date;
  dvValues: Map<string, DvValue> | Record<string, DvValue | undefined>;
}) {
  const { date, compounds, lastUpdated, dvValues } = args;
  const dvOf = (id: string): DvValue | undefined =>
    dvValues instanceof Map ? dvValues.get(id) : dvValues[id];

  const amountOf = (name: string) => compounds.find((c) => c.name === name)?.amount || 0;

  return {
    date,
    compounds: compounds.map((c) => {
      const dv = dvOf(c.compoundId);

      let rdaPercent: number | null = null;
      let zone: DvZone = 'unknown';

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
    calories: amountOf('Energy'),
    healthScore: 0,
    macros: {
      carbs: amountOf('Total Carbohydrate'),
      protein: amountOf('Protein'),
      fat: amountOf('Total Fat'),
    },
    lastUpdated: lastUpdated.toISOString(),
  };
}
