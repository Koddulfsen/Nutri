import { describe, it, expect } from 'vitest';
import {
  aggregateTotals,
  assemblePayload,
  calculatePercentDV,
  computeCompoundValues,
  convertToUnit,
  flattenToVector,
  portionGrams,
  type FoodVector,
} from './totals';

const row = (compoundId: string, value: number, unit = 'g', sourceCount = 1, name = compoundId) => ({
  compoundId,
  name,
  value,
  unit,
  sourceCount,
});

const vectors: Record<string, FoodVector> = {
  apple: [row('protein', 0.3, 'g', 3, 'Protein'), row('energy', 52, 'kcal', 3, 'Energy')],
  milk: [row('protein', 3.4, 'g', 2, 'Protein'), row('calcium', 113, 'mg', 3, 'Calcium')],
};

describe('portionGrams', () => {
  it('reads a number or a numeric string', () => {
    expect(portionGrams(182)).toBe(182);
    expect(portionGrams('182.50')).toBe(182.5);
  });
  it('falls back to 100 g when unparseable or zero', () => {
    expect(portionGrams('abc')).toBe(100);
    expect(portionGrams('')).toBe(100);
    expect(portionGrams(0)).toBe(100);
  });
});

describe('aggregateTotals', () => {
  it('scales per-100g values by grams and sums across foods', () => {
    const out = aggregateTotals(
      [
        { foodId: 'apple', grams: 200 },
        { foodId: 'milk', grams: 50 },
      ],
      vectors
    );
    const byId = Object.fromEntries(out.map((r) => [r.compoundId, r.amount]));
    expect(byId.protein).toBeCloseTo(0.3 * 2 + 3.4 * 0.5, 10);
    expect(byId.energy).toBeCloseTo(104, 10);
    expect(byId.calcium).toBeCloseTo(56.5, 10);
  });

  it('sums repeated foods', () => {
    const one = aggregateTotals([{ foodId: 'apple', grams: 100 }], vectors);
    const two = aggregateTotals(
      [
        { foodId: 'apple', grams: 100 },
        { foodId: 'apple', grams: 100 },
      ],
      vectors
    );
    expect(two.find((r) => r.compoundId === 'energy')!.amount).toBeCloseTo(
      2 * one.find((r) => r.compoundId === 'energy')!.amount,
      10
    );
  });

  it('gives the same result whatever order the atoms arrive in', () => {
    const atoms = [
      { foodId: 'milk', grams: 30 },
      { foodId: 'apple', grams: 182 },
      { foodId: 'milk', grams: 250 },
      { foodId: 'apple', grams: 90 },
    ];
    const forward = aggregateTotals(atoms, vectors);
    const backward = aggregateTotals([...atoms].reverse(), vectors);
    // exactly equal, not just close: the order of the sum is fixed
    expect(backward).toEqual(forward);
  });

  it('takes name, unit and sourceCount from the first food in a fixed order', () => {
    // 'apple' sorts before 'milk', so its sourceCount (3) wins for protein
    const out = aggregateTotals(
      [
        { foodId: 'milk', grams: 100 },
        { foodId: 'apple', grams: 100 },
      ],
      vectors
    );
    expect(out.find((r) => r.compoundId === 'protein')!.sourceCount).toBe(3);
  });

  it('counts a food with no vector as nothing, and no foods as no totals', () => {
    expect(aggregateTotals([{ foodId: 'unknown', grams: 100 }], vectors)).toEqual([]);
    expect(aggregateTotals([], vectors)).toEqual([]);
  });

  it('accepts a Map as well as a plain object', () => {
    const atoms = [{ foodId: 'apple', grams: 150 }];
    expect(aggregateTotals(atoms, new Map(Object.entries(vectors)))).toEqual(aggregateTotals(atoms, vectors));
  });
});

describe('computeCompoundValues', () => {
  it('derives confidence from sourceCount, capped at 100', () => {
    const out = computeCompoundValues([{ foodId: 'apple', grams: 100 }], {
      apple: [row('a', 1, 'g', 1), row('b', 1, 'g', 3), row('c', 1, 'g', 9)],
    });
    expect(out.map((c) => c.confidence)).toEqual([33, 99, 100]);
  });
});

describe('flattenToVector (composite foods)', () => {
  it('scaling the flattened recipe equals scaling each ingredient', () => {
    // a recipe of 60 g apple + 40 g milk (per 100 g of recipe)
    const recipe = flattenToVector(
      [
        { foodId: 'apple', grams: 60 },
        { foodId: 'milk', grams: 40 },
      ],
      vectors
    );
    const viaRecipe = computeCompoundValues([{ foodId: 'recipe', grams: 250 }], { recipe });
    const viaParts = computeCompoundValues(
      [
        { foodId: 'apple', grams: 150 },
        { foodId: 'milk', grams: 100 },
      ],
      vectors
    );
    const byId = (list: { compoundId: string; amount: number }[]) =>
      Object.fromEntries(list.map((c) => [c.compoundId, c.amount]));
    const a = byId(viaRecipe);
    const b = byId(viaParts);
    expect(Object.keys(a).sort()).toEqual(Object.keys(b).sort());
    for (const k of Object.keys(a)) expect(a[k]).toBeCloseTo(b[k], 9);
  });
});

describe('calculatePercentDV', () => {
  it('bands the percentage', () => {
    expect(calculatePercentDV(5, 100).status).toBe('deficient');
    expect(calculatePercentDV(30, 100).status).toBe('low');
    expect(calculatePercentDV(100, 100).status).toBe('optimal');
    expect(calculatePercentDV(150, 100).status).toBe('optimal');
    expect(calculatePercentDV(180, 100).status).toBe('high');
    expect(calculatePercentDV(250, 100).status).toBe('excess');
  });
  it('treats a zero or negative target as optimal at 0%', () => {
    expect(calculatePercentDV(50, 0)).toEqual({ percent: 0, status: 'optimal' });
  });
});

describe('convertToUnit', () => {
  it('converts between mass units, including the two micro signs', () => {
    expect(convertToUnit(1, 'g', 'mg')).toBeCloseTo(1000, 9);
    expect(convertToUnit(500, 'mg', 'g')).toBeCloseTo(0.5, 9);
    expect(convertToUnit(1000, 'µg', 'mg')).toBeCloseTo(1, 9);
    expect(convertToUnit(1000, 'μg', 'mg')).toBeCloseTo(1, 9);
  });
  it('returns null for units that cannot be compared', () => {
    expect(convertToUnit(1, 'kcal', 'mg')).toBeNull();
    expect(convertToUnit(1, 'IU', 'mg')).toBeNull();
  });
  it('is the identity for the same unit', () => {
    expect(convertToUnit(7, 'kcal', 'kcal')).toBe(7);
  });
});

describe('assemblePayload', () => {
  const compounds = computeCompoundValues(
    [
      { foodId: 'apple', grams: 200 },
      { foodId: 'milk', grams: 100 },
    ],
    vectors
  );

  it('exposes calories and macros by compound name', () => {
    const p = assemblePayload({ date: '2026-09-20', compounds, lastUpdated: new Date(0), dvValues: {} });
    expect(p.calories).toBeCloseTo(104, 10);
    expect(p.macros.protein).toBeCloseTo(0.6 + 3.4, 10);
    expect(p.macros.carbs).toBe(0);
    expect(p.lastUpdated).toBe('1970-01-01T00:00:00.000Z');
  });

  it('leaves zone unknown and percent null when there is no daily value', () => {
    const p = assemblePayload({ date: 'd', compounds, lastUpdated: new Date(0), dvValues: {} });
    const protein = p.compounds.find((c) => c.compoundId === 'protein')!;
    expect(protein.zone).toBe('unknown');
    expect(protein.rdaPercent).toBeNull();
    expect(protein.dailyValue).toBeNull();
  });

  it('computes percent and zone, converting units when the daily value uses another', () => {
    const p = assemblePayload({
      date: 'd',
      compounds,
      lastUpdated: new Date(0),
      // calcium intake is 113 mg; a 1 g target makes that 11.3 %
      dvValues: { calcium: { value: 1, unit: 'g', source: 'average', upperLimit: 2.5, upperLimitUnit: 'g' } },
    });
    const calcium = p.compounds.find((c) => c.compoundId === 'calcium')!;
    expect(calcium.rdaPercent).toBeCloseTo(11.3, 9);
    expect(calcium.zone).toBe('low');
    expect(calcium.dailyValue).toEqual({ value: 1, unit: 'g', source: 'average', upperLimit: 2.5, upperLimitUnit: 'g' });
  });

  it('keeps zone unknown when units are not comparable', () => {
    const p = assemblePayload({
      date: 'd',
      compounds,
      lastUpdated: new Date(0),
      dvValues: { energy: { value: 2000, unit: 'mg', source: null } }, // kcal vs mg
    });
    expect(p.compounds.find((c) => c.compoundId === 'energy')!.zone).toBe('unknown');
  });
});

import { packVectors, unpackVectors } from './wire';

describe('wire format', () => {
  it('round-trips vectors exactly, including empty ones', () => {
    const original: Record<string, FoodVector> = {
      apple: [row('protein', 0.30000000000000004, 'g', 3, 'Protein'), row('energy', 52, 'kcal', 3, 'Energy')],
      milk: [row('protein', 3.4, 'g', 2, 'Protein')],
      empty: [],
    };
    const restored = unpackVectors(JSON.parse(JSON.stringify(packVectors(original))));
    expect(Object.fromEntries(restored)).toEqual(original);
  });

  it('shares each compound and unit across foods instead of repeating them', () => {
    const pack = packVectors({
      a: [row('protein', 1, 'g', 1, 'Protein')],
      b: [row('protein', 2, 'g', 1, 'Protein')],
    });
    expect(pack.compounds).toHaveLength(1);
    expect(pack.units).toEqual(['g']);
  });

  it('is much smaller than the object-per-row form', () => {
    const big: FoodVector = Array.from({ length: 289 }, (_, i) =>
      row(`3f64490f-0711-4f85-be31-${String(i).padStart(12, '0')}`, i * 1.25, 'mg', 2, `Compound number ${i}`)
    );
    const naive = JSON.stringify({ f: big }).length;
    const packed = JSON.stringify(packVectors({ f: big })).length;
    // the shared dictionary is paid once per response, so compare two foods
    const packedTwo = JSON.stringify(packVectors({ f: big, g: big })).length;
    const naiveTwo = JSON.stringify({ f: big, g: big }).length;
    expect(packed).toBeLessThan(naive);
    expect(packedTwo).toBeLessThan(naiveTwo * 0.6);
  });
});
