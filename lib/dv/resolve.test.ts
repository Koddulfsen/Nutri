/**
 * Tests for the DV resolver, written against the five ways the previous aggregation got it wrong
 * (see dv-sources/PROVENANCE.md and VALUE-TYPES.md): copies counted as votes, mean instead of median,
 * units matched as text, supplement-only limits applied to food, and chronic-disease ceilings ignored.
 */
import { describe, it, expect } from 'vitest';
import { resolveBar, median, toUnit, type DvRow } from './resolve';

const row = (r: Partial<DvRow> & Pick<DvRow, 'region' | 'valueType' | 'value' | 'unit'>): DvRow => ({
  compound: 'Test', valueMin: null, valueMax: null, isPercentOfEnergy: false, supplementalOnly: false, ...r,
});

describe('median', () => {
  it('takes the middle of an odd count and the mean of the two middles of an even one', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
  it('is not dragged by an outlier the way a mean is', () => {
    const xs = [90, 95, 100, 105, 1000];
    expect(median(xs)).toBe(100);
    expect(xs.reduce((a, b) => a + b, 0) / xs.length).toBeGreaterThan(200);
  });
});

describe('toUnit', () => {
  it('converts magnitudes', () => expect(toUnit(1, 'mg', 'µg')).toBeCloseTo(1000, 9));
  it('treats a qualifier as the same scale as its bare unit', () => expect(toUnit(900, 'µg RAE', 'µg')).toBe(900));
  it('refuses two different qualifiers — µg folic acid is not µg DFE', () => expect(toUnit(400, 'µg DFE', 'µg RAE')).toBeNull());
  it('refuses a per-energy unit', () => expect(toUnit(1.6, 'mg NE/MJ', 'mg')).toBeNull());
  it('converts volumes', () => expect(toUnit(2, 'L', 'mL')).toBe(2000));
});

describe('resolveBar', () => {
  it('counts only the independent sources', () => {
    const bar = resolveBar('Vitamin C (Total)', [
      row({ region: 'USA_CANADA', valueType: 'RDA', value: 90, unit: 'mg' }),
      row({ region: 'EU', valueType: 'RDA', value: 110, unit: 'mg' }),
      row({ region: 'SPAIN', valueType: 'RDA', value: 95, unit: 'mg' }),      // an average of other bodies
      row({ region: 'NETHERLANDS', valueType: 'RDA', value: 110, unit: 'mg' }), // copies EFSA
    ]);
    expect(bar.goal?.sources).toEqual(['EU', 'USA_CANADA']);
    expect(bar.excluded.map((e) => e.region).sort()).toEqual(['NETHERLANDS', 'SPAIN']);
  });

  it('takes one goal per source, preferring an RDA over the same source\'s AI', () => {
    const bar = resolveBar('Test', [
      row({ region: 'JAPAN', valueType: 'AI', value: 50, unit: 'mg' }),
      row({ region: 'JAPAN', valueType: 'RDA', value: 80, unit: 'mg' }),
      row({ region: 'UK', valueType: 'RDA', value: 100, unit: 'mg' }),
    ]);
    expect(bar.goal?.value).toBe(90);          // median of 80 and 100, Japan counted once
    expect(bar.goal?.sources).toEqual(['JAPAN', 'UK']);
  });

  it('converts units instead of dropping the minority spelling', () => {
    const bar = resolveBar('Vitamin A (RAE)', [
      row({ region: 'USA_CANADA', valueType: 'RDA', value: 900, unit: 'µg RAE' }),
      row({ region: 'JAPAN', valueType: 'RDA', value: 850, unit: 'µg RAE' }),
      row({ region: 'CHINA', valueType: 'RDA', value: 770, unit: 'µg' }),
      row({ region: 'RUSSIA', valueType: 'RDA', value: 0.9, unit: 'mg' }),
    ]);
    expect(bar.goal?.sources).toHaveLength(4);   // nothing dropped for spelling
    expect(bar.goal?.unit).toBe('µg RAE');
    expect(bar.goal?.value).toBe(875);           // median of 770, 850, 900, 900
  });

  it('never lets an average requirement become a target', () => {
    const bar = resolveBar('Test', [
      row({ region: 'USA_CANADA', valueType: 'EAR', value: 625, unit: 'µg' }),
      row({ region: 'USA_CANADA', valueType: 'RDA', value: 900, unit: 'µg' }),
    ]);
    expect(bar.goal?.value).toBe(900);
    expect(bar.excluded.some((e) => e.valueType === 'EAR')).toBe(true);
  });

  it('keeps a supplement-only limit away from the food limit', () => {
    const bar = resolveBar('Magnesium', [
      row({ region: 'USA_CANADA', valueType: 'RDA', value: 420, unit: 'mg' }),
      row({ region: 'USA_CANADA', valueType: 'UL', value: 350, unit: 'mg', supplementalOnly: true }),
      row({ region: 'EU', valueType: 'UL', value: 250, unit: 'mg', supplementalOnly: true }),
    ]);
    expect(bar.limit).toBeNull();                       // a 350 mg food limit under a 420 mg goal would be nonsense
    expect(bar.supplementLimit?.value).toBe(300);       // median of 350 and 250, shown separately
  });

  it('uses a chronic-disease ceiling, which the old aggregation ignored entirely', () => {
    const bar = resolveBar('Sodium', [
      row({ region: 'EU', valueType: 'AI', value: 2000, unit: 'mg' }),
      row({ region: 'USA_CANADA', valueType: 'CDRR', value: 2300, valueMax: 2300, unit: 'mg' }),
      row({ region: 'WHO_FAO', valueType: 'CDRR', value: 2000, valueMax: 2000, unit: 'mg' }),
    ]);
    expect(bar.limit?.value).toBe(2150);
    expect(bar.limit?.from).toContain('CDRR');
  });

  it('takes the strictest ceiling a single body sets, then the median across bodies', () => {
    const bar = resolveBar('Test', [
      row({ region: 'USA_CANADA', valueType: 'UL', value: 3000, unit: 'mg' }),
      row({ region: 'USA_CANADA', valueType: 'CDRR', value: 2300, valueMax: 2300, unit: 'mg' }),
      row({ region: 'JAPAN', valueType: 'UL', value: 2500, unit: 'mg' }),
    ]);
    expect(bar.limit?.value).toBe(2400);   // median of USA 2300 (its strictest) and Japan 2500
  });

  it('reads direction from min/max, not from the type name', () => {
    const bar = resolveBar('Potassium', [
      row({ region: 'WHO_FAO', valueType: 'CDRR', value: 3510, valueMin: 3510, unit: 'mg' }),  // a floor
      row({ region: 'EU', valueType: 'AI', value: 3500, unit: 'mg' }),
    ]);
    expect(bar.goal?.value).toBe(3500);          // adequacy
    expect(bar.diseaseFloor?.value).toBe(3510);  // disease prevention, kept apart
    expect(bar.limit).toBeNull();
  });

  it('never counts one body twice when it sets both an adequacy goal and a disease floor', () => {
    const bar = resolveBar('Vitamin C (Total)', [
      row({ region: 'CHINA', valueType: 'RDA', value: 100, unit: 'mg' }),
      row({ region: 'CHINA', valueType: 'CDRR', value: 200, valueMin: 200, unit: 'mg' }),
      row({ region: 'EU', valueType: 'RDA', value: 110, unit: 'mg' }),
    ]);
    expect(bar.goal?.sources).toEqual(['CHINA', 'EU']);
    expect(bar.goal?.value).toBe(105);
    expect(bar.diseaseFloor?.value).toBe(200);
  });

  it('counts a shared judgement once (Korea\'s carbohydrate values are IOM\'s)', () => {
    const bar = resolveBar('Carbohydrates', [
      row({ region: 'USA_CANADA', valueType: 'RDA', value: 130, unit: 'g' }),
      row({ region: 'KOREA', valueType: 'RDA', value: 130, unit: 'g' }),
      row({ region: 'JAPAN', valueType: 'RDA', value: 150, unit: 'g' }),
    ]);
    expect(bar.goal?.sources).toEqual(['JAPAN', 'USA_CANADA']);
    expect(bar.goal?.value).toBe(140);
    expect(bar.excluded.some((e) => e.region === 'KOREA' && /counted once/.test(e.reason))).toBe(true);
  });

  it('returns a form limit beside the bar without merging it into the total', () => {
    const bar = resolveBar('Vitamin A (RAE)',
      [row({ region: 'USA_CANADA', valueType: 'RDA', value: 900, unit: 'µg RAE' })],
      { Retinol: [
        row({ region: 'USA_CANADA', compound: 'Retinol', valueType: 'UL', value: 3000, unit: 'µg' }),
        row({ region: 'EU', compound: 'Retinol', valueType: 'UL', value: 3000, unit: 'µg RE' }),
      ] });
    expect(bar.limit).toBeNull();                                  // nothing caps total vitamin A
    expect(bar.formLimits).toHaveLength(1);
    expect(bar.formLimits[0]).toMatchObject({ compound: 'Retinol', value: 3000, countsParentTotal: false });
    expect(bar.formLimits[0].sources).toEqual(['EU', 'USA_CANADA']);
  });

  it('keeps a range as a range', () => {
    const bar = resolveBar('Total Fat', [
      row({ region: 'USA_CANADA', valueType: 'AMDR', value: 27.5, valueMin: 20, valueMax: 35, unit: '%', isPercentOfEnergy: true }),
      row({ region: 'EU', valueType: 'AMDR', value: 30, valueMin: 20, valueMax: 35, unit: '%', isPercentOfEnergy: true }),
    ]);
    expect(bar.range).toEqual({ min: 20, max: 35, unit: '%', sources: ['EU', 'USA_CANADA'] });
  });

  it('reports the spread so disagreement between bodies stays visible', () => {
    const bar = resolveBar('Vitamin C (Total)', [
      row({ region: 'WHO_FAO', valueType: 'RDA', value: 45, unit: 'mg' }),
      row({ region: 'USA_CANADA', valueType: 'RDA', value: 90, unit: 'mg' }),
      row({ region: 'EU', valueType: 'RDA', value: 110, unit: 'mg' }),
    ]);
    expect(bar.goal?.value).toBe(90);
    expect(bar.goal?.spread).toEqual([45, 110]);
  });

  it('excludes a per-energy value rather than treating it as an amount', () => {
    const bar = resolveBar('Thiamin (B1)', [
      row({ region: 'EU', valueType: 'RDA', value: 0.1, unit: 'mg/MJ' }),
      row({ region: 'USA_CANADA', valueType: 'RDA', value: 1.2, unit: 'mg' }),
    ]);
    expect(bar.goal?.value).toBe(1.2);
    expect(bar.excluded.some((e) => e.region === 'EU' && /per-energy/.test(e.reason))).toBe(true);
  });
});

describe('a body that publishes several rows for one demographic', () => {
  it('counts it once, at its own median (Russia prints fat per physical-activity group)', () => {
    const bar = resolveBar('Total Fat', [
      row({ region: 'RUSSIA', valueType: 'RDA', value: 77, unit: 'g' }),
      row({ region: 'RUSSIA', valueType: 'RDA', value: 88, unit: 'g' }),
      row({ region: 'RUSSIA', valueType: 'RDA', value: 105, unit: 'g' }),
      row({ region: 'RUSSIA', valueType: 'RDA', value: 122, unit: 'g' }),
      row({ region: 'INDIA', valueType: 'RDA', value: 30, unit: 'g' }),
    ]);
    expect(bar.goal?.sources).toEqual(['INDIA', 'RUSSIA']);   // not five votes
    expect(bar.goal?.spread).toEqual([30, 96.5]);             // Russia's own median of 88 and 105
    expect(bar.goal?.value).toBe(63.25);
  });

  it('does not let repeated floors from one body outvote another', () => {
    const bar = resolveBar('Test', [
      row({ region: 'RUSSIA', valueType: 'CDRR', value: 10, valueMin: 10, unit: 'mg' }),
      row({ region: 'RUSSIA', valueType: 'CDRR', value: 10, valueMin: 10, unit: 'mg' }),
      row({ region: 'EU', valueType: 'CDRR', value: 20, valueMin: 20, unit: 'mg' }),
    ]);
    expect(bar.diseaseFloor?.sources).toEqual(['EU', 'RUSSIA']);
    expect(bar.diseaseFloor?.value).toBe(15);
  });
});
