/**
 * The energy target, which did not exist until 2026-10-08.
 *
 * 1,491 EER rows from 19 bodies were stored and never read: resolveBar dropped every one with the note
 * "energy is resolved separately (depends on activity)", and nothing did. /analysis printed the kcal eaten
 * with nothing to compare it to, while Cronometer's headline is "X of Y kcal".
 *
 * Energy cannot use the same per-body vote as every other target, because activity is a second axis: one
 * body publishes three or four numbers for the same age and sex, 900 kcal apart. The level is chosen first,
 * and only then is there one value per body to take a median of.
 */
import { describe, it, expect } from 'vitest';
import { resolveBar, type DvRow, type ActivityLevel } from './resolve';

const eer = (region: string, value: number, activityLevel: ActivityLevel | null, unit = 'kcal'): DvRow =>
  ({ region, compound: 'Energy', valueType: 'EER', value, unit, activityLevel });

/** The real adult-male rows, as transcribed. */
const ROWS: DvRow[] = [
  eer('CHINA', 2050, 'SEDENTARY'), eer('CHINA', 2500, 'MODERATE'), eer('CHINA', 2950, 'ACTIVE'),
  eer('USA_CANADA', 2593, 'SEDENTARY'), eer('USA_CANADA', 2796, 'MODERATE'),
  eer('USA_CANADA', 2972, 'ACTIVE'), eer('USA_CANADA', 3269, 'VERY_ACTIVE'),
  eer('EU', 9.5, 'SEDENTARY', 'MJ'), eer('EU', 10.8, 'MODERATE', 'MJ'),
  eer('EU', 12.2, 'ACTIVE', 'MJ'), eer('EU', 13.5, 'VERY_ACTIVE', 'MJ'),
  eer('KOREA', 2500, null), eer('UK', 11.5, null, 'MJ'),
];

const at = (level: ActivityLevel | null) => resolveBar('Energy', ROWS, {}, { activityLevel: level });

describe('activity picks the rows, then the bodies vote', () => {
  it('reads each level on its own rows', () => {
    expect(at('SEDENTARY')!.goal!.value).toBeLessThan(at('MODERATE')!.goal!.value);
    expect(at('MODERATE')!.goal!.value).toBeLessThan(at('ACTIVE')!.goal!.value);
    expect(at('ACTIVE')!.goal!.value).toBeLessThan(at('VERY_ACTIVE')!.goal!.value);
  });

  it('never averages a body across its own activity levels', () => {
    // The bug this prevents: pooling China's 2050/2500/2950 would describe a person who is at once
    // sedentary and athletic, and would do it silently.
    const sed = at('SEDENTARY')!;
    expect(sed.goal!.spread![0]).toBeGreaterThanOrEqual(2050);
    expect(sed.goal!.spread![1]).toBeLessThanOrEqual(2593);
    expect(sed.goal!.value).toBeLessThan(2950);
  });

  it('converts MJ to kcal instead of pooling the numbers as written', () => {
    // EU's 12.2 MJ is 2916 kcal. Treated as 12.2 it would drag the median to nothing.
    const active = at('ACTIVE')!;
    expect(active.goal!.unit).toBe('kcal');
    expect(active.goal!.value).toBeGreaterThan(2500);
    expect(active.goal!.spread![0]).toBeGreaterThan(2000);
  });
});

describe('a body that publishes one figure votes only at moderate', () => {
  it('counts Korea and the UK at moderate', () => {
    expect(at('MODERATE')!.goal!.sources).toContain('KOREA');
    expect(at('MODERATE')!.goal!.sources).toContain('UK');
  });

  it('leaves them out elsewhere, with the reason recorded rather than silently', () => {
    const sed = at('SEDENTARY')!;
    expect(sed.goal!.sources).not.toContain('KOREA');
    const why = sed.excluded.find((e) => e.region === 'KOREA')!;
    expect(why.reason).toMatch(/without an activity breakdown/);
    expect(why.reason).toMatch(/sedentary/);
  });
});

describe('an unstated activity level is assumed, not guessed silently', () => {
  it('falls back to moderate and says that it did', () => {
    const bar = at(null);
    expect(bar.activityBasis).toEqual({ level: 'MODERATE', source: 'default' });
    expect(bar.goal!.value).toBe(at('MODERATE')!.goal!.value);
  });

  it('reports a stated level as stated', () => {
    expect(at('ACTIVE')!.activityBasis).toEqual({ level: 'ACTIVE', source: 'stated' });
  });

  it('carries no activity basis for a compound that has no EER', () => {
    const iron: DvRow[] = [{ region: 'EU', compound: 'Iron (Total)', valueType: 'RDA', value: 11, unit: 'mg' }];
    expect(resolveBar('Iron (Total)', iron, {}, { activityLevel: 'ACTIVE' }).activityBasis).toBeNull();
  });
});

describe('a body cannot vote twice at one level', () => {
  it('keeps the lower of a duplicate rather than inflating the target', () => {
    const dup = [eer('EU', 2000, 'MODERATE'), eer('EU', 3000, 'MODERATE')];
    const bar = resolveBar('Energy', dup, {}, { activityLevel: 'MODERATE' });
    expect(bar.goal!.value).toBe(2000);
    expect(bar.goal!.sources).toEqual(['EU']);
  });
});

describe('only the independent bodies count', () => {
  it('excludes a body that copies, as everywhere else', () => {
    const rows = [...ROWS, eer('MALAYSIA', 2190, 'MODERATE'), eer('SINGAPORE', 2590, 'MODERATE')];
    const bar = resolveBar('Energy', rows, {}, { activityLevel: 'MODERATE' });
    expect(bar.goal!.sources).not.toContain('MALAYSIA');
    expect(bar.goal!.sources).not.toContain('SINGAPORE');
  });
});
