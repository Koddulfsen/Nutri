/**
 * Compounds that have a ceiling and no target — cadmium, mercury, retinol, cholesterol, nicotinamide,
 * boron, nickel, lutein, lycopene, plant sterols, nicotinic acid.
 *
 * Until 2026-10-08 all eleven rendered "No DV" in the app. The limits were resolved correctly by
 * lib/dv/resolve.ts and carried intact through daily-value-service, then discarded one layer below the
 * UI: `buildDvValues` only emitted an entry when `target != null`, because the bar is goal-shaped — its
 * width IS the target — so a compound with no target had nothing to be a fraction of.
 *
 * These tests pin the two things that made it silent: a ceiling must survive into the payload, and its
 * percentage must NOT be scored on target zones, where a small number means deficiency. For a
 * contaminant a small number is the whole point.
 */
import { describe, it, expect } from 'vitest';
import { assemblePayload, calculatePercentDV, calculatePercentOfLimit, type DvValue } from './totals';

const CID = '22222222-2222-2222-2222-222222222222';

const payloadFor = (amount: number, dv: DvValue) =>
  assemblePayload({
    date: '2026-10-08',
    compounds: [{ compoundId: CID, name: 'Cadmium', amount, unit: 'µg', confidence: 'high' } as never],
    lastUpdated: new Date('2026-10-08T00:00:00Z'),
    dvValues: { [CID]: dv },
  }).compounds[0];

/** EFSA's cadmium TWI is 2.5 µg/kg bw/week — 175 µg/week at 70 kg, divided to 25 µg/day. */
const cadmium: DvValue = {
  value: 25,
  unit: 'µg',
  source: 'limit',
  sourceCount: 1,
  limitOnly: true,
  perDayFrom: { averagingDays: 7, publishedValue: 175 },
};

describe('a ceiling with no target reaches the UI', () => {
  it('produces a dailyValue instead of null, which is what rendered "No DV"', () => {
    const row = payloadFor(5, cadmium);
    expect(row.dailyValue).not.toBeNull();
    expect(row.dailyValue!.value).toBe(25);
    expect(row.dailyValue!.limitOnly).toBe(true);
  });

  it('keeps what the body actually published, so the label can say it is a quotient', () => {
    // No body sets a DAILY cadmium ceiling. The 25 is ours; the 175 per week is EFSA's.
    const row = payloadFor(5, cadmium);
    expect(row.dailyValue!.perDayFrom).toEqual({ averagingDays: 7, publishedValue: 175 });
  });

  it('measures intake against the limit', () => {
    expect(Math.round(payloadFor(5, cadmium).rdaPercent!)).toBe(20);
    expect(Math.round(payloadFor(25, cadmium).rdaPercent!)).toBe(100);
  });
});

describe('limit zones are not target zones', () => {
  it('a little of a contaminant is fine, not deficient', () => {
    // The bug this prevents: reusing calculatePercentDV would call 20 % of a cadmium limit "low" and
    // 5 % "deficient" — telling the user to eat MORE cadmium.
    expect(calculatePercentDV(5, 25).status).toBe('low');
    expect(calculatePercentDV(1, 25).status).toBe('deficient');
    expect(calculatePercentOfLimit(5, 25).status).toBe('optimal');
    expect(calculatePercentOfLimit(1, 25).status).toBe('optimal');
    expect(payloadFor(1, cadmium).zone).toBe('optimal');
  });

  it('flags approach and exceedance', () => {
    expect(calculatePercentOfLimit(12.5, 25).status).toBe('high');   // half the limit
    expect(calculatePercentOfLimit(26, 25).status).toBe('excess');
    expect(payloadFor(30, cadmium).zone).toBe('excess');
  });

  it('never reports a deficiency at any intake', () => {
    for (const intake of [0, 0.1, 1, 5, 12, 20, 25, 40, 1000]) {
      expect(['optimal', 'high', 'excess']).toContain(calculatePercentOfLimit(intake, 25).status);
    }
  });

  it('treats a zero or missing limit as unscoreable rather than dividing by it', () => {
    expect(calculatePercentOfLimit(5, 0).percent).toBe(0);
  });
});

describe('target compounds are untouched', () => {
  const iron: DvValue = { value: 10.5, unit: 'mg', source: 'average', sourceCount: 10 };
  it('still scores on target zones, where too little IS a deficiency', () => {
    const row = assemblePayload({
      date: '2026-10-08',
      compounds: [{ compoundId: CID, name: 'Iron (Total)', amount: 0.5, unit: 'mg', confidence: 'high' } as never],
      lastUpdated: new Date('2026-10-08T00:00:00Z'),
      dvValues: { [CID]: iron },
    }).compounds[0];
    expect(row.zone).toBe('deficient');
    expect(row.dailyValue!.limitOnly).toBe(false);
  });
});
