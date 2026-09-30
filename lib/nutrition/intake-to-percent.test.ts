/**
 * The whole chain a user actually sees: a food's value per 100 g, a portion in grams, a target, and
 * the percentage on the bar. Every piece of this was tested; the chain never was.
 *
 * It matters because the pieces disagree about units. `merged_nutrients` stores a compound in whatever
 * unit that food's sources used — 15 compounds are currently stored in more than one unit across foods,
 * biotin in both `g` and `µg` — while `aggregateTotals` sums the values and labels the total with
 * whichever row it happened to see first. Sorting is by (foodId, grams), so which unit wins depends on
 * UUID order and on what the user ate.
 */
import { describe, it, expect } from 'vitest';
import { aggregateTotals, convertToUnit, calculatePercentDV, type Atom, type FoodVector } from './totals';

const CID = '11111111-1111-1111-1111-111111111111';
const vec = (unit: string, value: number): FoodVector =>
  [{ compoundId: CID, name: 'Vitamin B12 (Total)', unit, value, sourceCount: 1 }];

/** The whole chain, as the payload builder runs it. */
function percentOf(atoms: Atom[], vectors: Record<string, FoodVector>, target: number, targetUnit: string) {
  const [total] = aggregateTotals(atoms, vectors);
  const inTargetUnit = convertToUnit(total.amount, total.unit, targetUnit);
  return { total, percent: inTargetUnit == null ? null : calculatePercentDV(inTargetUnit, target).percent };
}

describe('one food, one portion', () => {
  it('scales by the portion and divides by the target', () => {
    // Beef liver carries 52.77 µg of biotin per 100 g; a 150 g portion is 79.15 µg.
    const { percent } = percentOf(
      [{ foodId: 'a', grams: 150 }], { a: vec('µg', 52.7675) }, 30, 'µg'
    );
    expect(percent).toBeCloseTo((52.7675 * 1.5 / 30) * 100, 6);
    expect(percent).toBeCloseTo(263.84, 2);
  });

  it('converts when the food and the target disagree about the unit', () => {
    // 0.0055 g of B12 in 100 g is 5500 µg; against a 2.4 µg target that is 229 166 %.
    const { percent } = percentOf([{ foodId: 'a', grams: 100 }], { a: vec('g', 0.0055) }, 2.4, 'µg');
    expect(percent).toBeCloseTo((5500 / 2.4) * 100, 3);
  });
});

describe('two foods whose sources used different units', () => {
  it('sums them as one quantity rather than adding a gram to a microgram', () => {
    // 2 µg from one food and 0.000003 g (= 3 µg) from another is 5 µg, whatever order they arrive in.
    const atoms: Atom[] = [{ foodId: 'a', grams: 100 }, { foodId: 'b', grams: 100 }];
    const vectors = { a: vec('µg', 2), b: vec('g', 0.000003) };
    const { total } = percentOf(atoms, vectors, 2.4, 'µg');
    const inMicrograms = convertToUnit(total.amount, total.unit, 'µg');
    expect(inMicrograms).toBeCloseTo(5, 9);
  });

  it('does not let a zero in the wrong unit relabel a real total', () => {
    // Olive oil stores B12 as 0 g; beef liver stores 5.5 µg. The zero adds nothing — but if the total
    // takes its LABEL from the zero's row, the 5.5 is read as grams and the bar reads 229 million %.
    const atoms: Atom[] = [{ foodId: 'a-olive-oil', grams: 15 }, { foodId: 'b-liver', grams: 100 }];
    const vectors = { 'a-olive-oil': vec('g', 0), 'b-liver': vec('µg', 5.5) };
    const { total, percent } = percentOf(atoms, vectors, 2.4, 'µg');

    const inMicrograms = convertToUnit(total.amount, total.unit, 'µg');
    expect(inMicrograms, 'the amount, expressed in µg').toBeCloseTo(5.5, 9);
    expect(percent, 'percent of a 2.4 µg target').toBeCloseTo((5.5 / 2.4) * 100, 3);
    expect(percent!).toBeLessThan(1000);
  });

  it('keeps a real quantity when the zero arrives second, too', () => {
    const atoms: Atom[] = [{ foodId: 'a-liver', grams: 100 }, { foodId: 'b-olive-oil', grams: 15 }];
    const vectors = { 'a-liver': vec('µg', 5.5), 'b-olive-oil': vec('g', 0) };
    const { total } = percentOf(atoms, vectors, 2.4, 'µg');
    expect(convertToUnit(total.amount, total.unit, 'µg')).toBeCloseTo(5.5, 9);
  });
});
