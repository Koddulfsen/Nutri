import { describe, expect, it } from 'vitest';
import { mergeCompoundValues } from './merge';

const v = (apiSource: string, value: number, unit: string) => ({ apiSource, value, unit });

describe('mergeCompoundValues', () => {
  it('reproduces the Apple tryptophan failure and fixes it', () => {
    // The nine values actually stored for Apple / Tryptophan, read from
    // nutrient_source_values on 2026-09-08. Every one is labelled 'g' because
    // the label comes from the compound's canonical unit; the milligrams are
    // hidden in a wrong conversion_factor upstream, so no unit check can see
    // them. The old merge averaged these to 0.7274 g.
    const stored = [
      v('CNF', 0.001, 'g'),
      v('BLS', 0.002, 'g'),
      v('AFCD', 0.002, 'g'),
      v('FOODFILES', 0.002, 'g'),
      v('NEVO', 0.003, 'g'),
      v('FDC', 0.005, 'g'),
      v('AFCD', 0.046, 'g'),
      v('FRIDA', 2.5858, 'g'),
      v('FINELI', 3.9, 'g'),
    ];

    const merged = mergeCompoundValues(stored);

    // Seven sources agree on roughly 0.001-0.005 g; that is the answer.
    expect(merged.averageValue).toBeLessThan(0.01);
    expect(merged.unit).toBe('g');

    // The two milligram values are held out, and named.
    const droppedSources = merged.excluded.map((e) => e.input.apiSource).sort();
    expect(droppedSources).toEqual(['FINELI', 'FRIDA']);
    expect(merged.excluded.every((e) => e.reason === 'magnitude-outlier')).toBe(true);

    // sourceCount must reflect what the average was built from, so a dropped
    // value cannot inflate apparent corroboration.
    expect(merged.kept.length).toBe(7);

    // The old behaviour, for contrast.
    const oldAverage = stored.reduce((a, n) => a + n.value, 0) / stored.length;
    expect(oldAverage).toBeCloseTo(0.7274, 3);
  });

  it('normalizes compatible units instead of dropping them', () => {
    const merged = mergeCompoundValues([
      v('A', 1, 'g'),
      v('B', 1000, 'mg'),
      v('C', 1, 'g'),
    ]);

    expect(merged.unit).toBe('g');
    expect(merged.averageValue).toBeCloseTo(1, 10);
    expect(merged.excluded).toHaveLength(0);
  });

  it('converts kJ onto kcal rather than averaging the two', () => {
    // 418.4 kJ is exactly 100 kcal. Averaging the raw numbers gives 259.2,
    // which is what the old merge produced for Energy.
    const merged = mergeCompoundValues([
      v('A', 100, 'kcal'),
      v('B', 100, 'kcal'),
      v('C', 418.4, 'kJ'),
    ]);

    expect(merged.unit).toBe('kcal');
    expect(merged.averageValue).toBeCloseTo(100, 6);
  });

  it('drops a unit that measures a different quantity', () => {
    // AFCD publishes some fatty acids as %T, percent of total fatty acids, and
    // one mapping pointed at it. 68.3 %T is not 68.3 g and never was.
    const merged = mergeCompoundValues([
      v('AFCD', 9.53, 'g'),
      v('BLS', 9.1, 'g'),
      v('AFCD', 68.3, '%T'),
    ]);

    expect(merged.excluded).toHaveLength(1);
    expect(merged.excluded[0].reason).toBe('incompatible-unit');
    expect(merged.averageValue).toBeCloseTo(9.315, 3);
  });

  it('does not test for outliers when there is no majority', () => {
    // Two values cannot establish a consensus, so neither is excluded — the
    // disagreement is surfaced by the cross-source analysis instead.
    const merged = mergeCompoundValues([v('A', 0.001, 'g'), v('B', 3.9, 'g')]);

    expect(merged.excluded).toHaveLength(0);
    expect(merged.kept).toHaveLength(2);
  });

  it('keeps zeros without letting them drive the median', () => {
    const merged = mergeCompoundValues([
      v('A', 0, 'g'),
      v('B', 10, 'g'),
      v('C', 10, 'g'),
      v('D', 11, 'g'),
    ]);

    expect(merged.excluded).toHaveLength(0);
    expect(merged.averageValue).toBeCloseTo(7.75, 6);
  });

  it('returns a median rather than a bad mean when everything conflicts', () => {
    const merged = mergeCompoundValues([
      v('A', 0.001, 'g'),
      v('B', 1000, 'g'),
      v('C', 0.001, 'g'),
    ]);

    // B is 1e6x the median; with it gone the answer is the two that agree.
    expect(merged.averageValue).toBeCloseTo(0.001, 6);
    expect(merged.excluded.map((e) => e.input.apiSource)).toEqual(['B']);
  });

  it('handles a single value', () => {
    const merged = mergeCompoundValues([v('A', 42, 'mg')]);
    expect(merged.averageValue).toBe(42);
    expect(merged.unit).toBe('mg');
    expect(merged.excluded).toHaveLength(0);
  });
});
