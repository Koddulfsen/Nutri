/**
 * The test that proves the reference weights, rather than asserting they were typed in correctly.
 *
 * The DRI macronutrient table publishes protein twice — as g/kg/day and as g/day — and footnote 30
 * states the relationship outright: *"Recommendations for total protein are determined as the amount
 * needed per kg body weight multiplied by the reference weight."* So the printed g/day column is a
 * published answer key for this table: if our weight for a band is wrong, the product misses the
 * number the IOM printed.
 *
 * This matters because a wrong reference weight fails the way conversion factors fail (CLAUDE.md §6) —
 * a plausible number, never a crash.
 *
 * Both columns below are transcribed from Health Canada's reproduction of the DRI tables
 * (`dri_tables-eng.pdf`, macronutrients table, "Total Protein" columns, EAR / RDA-AI in g/kg/day and
 * RDA/AI in g/day).
 */
import { describe, it, expect } from 'vitest';
import { referenceWeightKg } from './reference-weights';

/** [label, ageMonths, sex, printed g/kg/day, printed g/day] */
const DRI_PROTEIN: Array<[string, number, 'MALE' | 'FEMALE', number, number]> = [
  ['7–12 mo',        9,  'MALE',   1.2,  11.0],
  ['1–3 y',         24,  'MALE',   1.05, 13],
  ['4–8 y',         72,  'MALE',   0.95, 19],
  ['males 9–13 y', 132,  'MALE',   0.95, 34],
  ['males 14–18 y',192,  'MALE',   0.85, 52],
  ['males 19–30 y',300,  'MALE',   0.80, 56],
  ['males 51–70 y',720,  'MALE',   0.80, 56],
  ['females 14–18 y', 192, 'FEMALE', 0.85, 46],
  ['females 19–30 y', 300, 'FEMALE', 0.80, 46],
  ['females 51–70 y', 720, 'FEMALE', 0.80, 46],
];

describe('reference weights reproduce the DRI\'s own published protein values', () => {
  it.each(DRI_PROTEIN)('%s: %d months', (_label, ageMonths, sex, perKg, printedGrams) => {
    const w = referenceWeightKg(ageMonths, sex)!;
    expect(w).not.toBeNull();
    // The DRI prints whole grams, so the product must round to the printed value.
    expect(Math.round(perKg * w.kg)).toBe(printedGrams);
  });

  /**
   * One band does NOT reproduce, and it is recorded rather than smoothed over: girls 9–13 y are
   * printed at 0.95 g/kg and 34 g/day, but the reference-weight table gives 37 kg, and 0.95 × 37 = 35.2.
   * Every other band is exact. The likeliest explanation is that the macronutrient report used a
   * slightly different weight for that one band than the table reproduced here, which is precisely the
   * kind of thing this test exists to surface — so it is asserted as a known deviation, and if it ever
   * changes, the test fails and someone re-reads the source.
   */
  it('records the one band that does not reproduce, instead of hiding it', () => {
    const w = referenceWeightKg(132, 'FEMALE')!;
    expect(w.kg).toBe(37);
    expect(Math.round(0.95 * w.kg)).toBe(35);   // the DRI prints 34
  });
});

describe('band edges', () => {
  it('has no weight below 2 months rather than inventing one', () => {
    expect(referenceWeightKg(0, 'MALE')).toBeNull();
    expect(referenceWeightKg(1, 'FEMALE')).toBeNull();
    expect(referenceWeightKg(2, 'MALE')?.kg).toBe(6);
  });

  it('switches bands on the right month', () => {
    expect(referenceWeightKg(11, 'MALE')?.kg).toBe(9);    // 7–12 mo
    expect(referenceWeightKg(12, 'MALE')?.kg).toBe(12);   // 1–3 y
    expect(referenceWeightKg(107, 'MALE')?.kg).toBe(20);  // 4–8 y
    expect(referenceWeightKg(108, 'MALE')?.kg).toBe(36);  // 9–13 y
    expect(referenceWeightKg(227, 'FEMALE')?.kg).toBe(54); // 14–18 y
    expect(referenceWeightKg(228, 'FEMALE')?.kg).toBe(57); // adult
  });

  it('applies the adult weight to every older band, per the table\'s own footnote', () => {
    expect(referenceWeightKg(300, 'MALE')?.kg).toBe(70);
    expect(referenceWeightKg(1200, 'MALE')?.kg).toBe(70);  // 100 years old
  });

  it('names the source in the note, so an assumed weight is attributable', () => {
    expect(referenceWeightKg(300, 'FEMALE')?.note).toMatch(/IOM DRI reference weight/);
  });
});
