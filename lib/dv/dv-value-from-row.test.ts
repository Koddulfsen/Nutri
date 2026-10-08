/**
 * The server-rendered payload and the browser's own recompute must draw the same bar.
 *
 * They did not. Both decided "is there a bar here?" with their own copy of the same rule, and when the
 * copy in daily-totals-payload.ts was fixed to show ceiling-only compounds, the copy in
 * POST /api/daily-values was not. The result was a bar that appeared on load and went blank as soon as a
 * food was added, because /analysis recomputes the day locally from that endpoint's map. The amounts were
 * unaffected — they come from the local totals — so only the bars broke.
 *
 * Both now call dvValueFromRow. These tests pin the rule itself; a future caller gets it for free.
 */
import { describe, it, expect } from 'vitest';
import { dvValueFromRow } from './dv-value-from-row';
import type { DvLookupRow } from '@/lib/services/daily-value-service';

const row = (over: Partial<DvLookupRow>): DvLookupRow => ({
  target: null, targetUnit: null, targetType: null, targetSourceCount: 0,
  upperLimit: null, upperLimitUnit: null, upperLimitSourceCount: 0,
  targetSources: [], targetSpread: null, diseaseFloor: null, supplementLimit: null,
  formLimits: [], energyShare: null, range: null, averagingDays: 1, referencePoints: [],
  weightBasis: null, ...over,
});

describe('a target wins when there is one', () => {
  it('uses the target and keeps the ceiling as overflow', () => {
    const dv = dvValueFromRow(row({
      target: 10.5, targetUnit: 'mg', targetSourceCount: 10, targetSources: ['EU'],
      upperLimit: 43.5, upperLimitUnit: 'mg', upperLimitSourceCount: 2,
    }))!;
    expect(dv.value).toBe(10.5);
    expect(dv.limitOnly).toBeUndefined();
    expect(dv.upperLimit).toBe(43.5);
  });
});

describe('a ceiling becomes the bar when no body sets a requirement', () => {
  it('divides a weekly ceiling to a day and records what was published', () => {
    // EFSA's cadmium TWI at 70 kg: 175 µg per week.
    const dv = dvValueFromRow(row({
      upperLimit: 175, upperLimitUnit: 'µg', upperLimitSourceCount: 1, averagingDays: 7,
    }))!;
    expect(dv.value).toBe(25);
    expect(dv.limitOnly).toBe(true);
    expect(dv.perDayFrom).toEqual({ averagingDays: 7, publishedValue: 175 });
  });

  it('leaves a daily ceiling alone and claims no window', () => {
    const dv = dvValueFromRow(row({ upperLimit: 3000, upperLimitUnit: 'µg', upperLimitSourceCount: 4 }))!;
    expect(dv.value).toBe(3000);
    expect(dv.limitOnly).toBe(true);
    expect(dv.perDayFrom).toBeNull();
  });

  it('never also reports an upperLimit, which the bar would read as overflow past a goal', () => {
    const dv = dvValueFromRow(row({ upperLimit: 300, upperLimitUnit: 'mg', upperLimitSourceCount: 2 }))!;
    expect(dv.upperLimit).toBeUndefined();
  });
});

describe('shapes no single bar can draw', () => {
  it('returns null for a %-of-energy value, a range, a floor or a supplement-only ceiling', () => {
    expect(dvValueFromRow(row({ energyShare: { goal: null, limit: 10 } }))).toBeNull();
    expect(dvValueFromRow(row({ range: { min: 45, max: 65, unit: '%' } }))).toBeNull();
    expect(dvValueFromRow(row({ diseaseFloor: { value: 3, unit: 'g', sourceCount: 1 } }))).toBeNull();
    expect(dvValueFromRow(row({ supplementLimit: { value: 1000, unit: 'µg', sourceCount: 11 } }))).toBeNull();
    expect(dvValueFromRow(row({}))).toBeNull();
  });

  it('ignores a ceiling with no unit rather than drawing a unitless bar', () => {
    expect(dvValueFromRow(row({ upperLimit: 300, upperLimitUnit: null }))).toBeNull();
  });
});
