/**
 * Phenylalanine and tyrosine have no requirement of their own — WHO TRS 935 § 8.1.6 says it is "not
 * possible at present to set a specific value for the ability of tyrosine to spare phenylalanine
 * intake" — so the pair total is the only figure there is, and the bar is drawn against the sum.
 *
 * The thing these tests guard is the partial sum. If one member is missing from a day's food and the
 * other is not, adding up what is there produces a number that looks like a total and is not one, and
 * the bar would tell the user they are short of a target they may well have met.
 */
import { describe, it, expect } from 'vitest';
import { COMPOUND_PAIRS, pairFor, pairsOf, sumPairIntake } from './compound-pairs';
import { convertToUnit } from '@/lib/nutrition/totals';

const AAA = pairFor('Phenylalanine + Tyrosine')!;
const from = (m: Record<string, { amount: number; unit: string }>) => (name: string) => m[name] ?? null;

describe('summing a pair', () => {
  it('adds the members', () => {
    const got = sumPairIntake(AAA, from({ Phenylalanine: { amount: 1.0, unit: 'g' }, Tyrosine: { amount: 0.9, unit: 'g' } }), convertToUnit);
    expect(got).toEqual({ amount: 1.9, unit: 'g' });
  });

  it('converts before adding, instead of adding a gram to a milligram', () => {
    const got = sumPairIntake(AAA, from({ Phenylalanine: { amount: 1.0, unit: 'g' }, Tyrosine: { amount: 900, unit: 'mg' } }), convertToUnit)!;
    expect(got.unit).toBe('g');
    expect(got.amount).toBeCloseTo(1.9, 10);
  });

  it('refuses a partial sum when a member is missing', () => {
    expect(sumPairIntake(AAA, from({ Phenylalanine: { amount: 1.0, unit: 'g' } }), convertToUnit)).toBeNull();
    expect(sumPairIntake(AAA, from({ Tyrosine: { amount: 0.9, unit: 'g' } }), convertToUnit)).toBeNull();
    expect(sumPairIntake(AAA, from({}), convertToUnit)).toBeNull();
  });

  it('refuses rather than guessing when the units cannot be reconciled', () => {
    expect(sumPairIntake(AAA, from({ Phenylalanine: { amount: 1, unit: 'g' }, Tyrosine: { amount: 5, unit: 'IU' } }), convertToUnit)).toBeNull();
  });

  it('counts a zero member as present — eating none of it is a real measurement', () => {
    const got = sumPairIntake(AAA, from({ Phenylalanine: { amount: 1.0, unit: 'g' }, Tyrosine: { amount: 0, unit: 'g' } }), convertToUnit);
    expect(got).toEqual({ amount: 1.0, unit: 'g' });
  });
});

describe('which pairs exist, and which deliberately do not', () => {
  it('has the aromatic pair', () => {
    expect(pairFor('Phenylalanine + Tyrosine')).toBeTruthy();
    expect(pairsOf('Tyrosine').map((p) => p.pair)).toEqual(['Phenylalanine + Tyrosine']);
  });

  it('has NO sulfur pair, because WHO splits that one into its members', () => {
    // § 8.1.7 publishes methionine 10.4 and cysteine 4.1 mg/kg separately, so each carries its own
    // target and must not be collapsed into a pair row as well — that would double-count the bar.
    expect(pairFor('Methionine + Cysteine')).toBeUndefined();
    expect(pairsOf('Methionine')).toEqual([]);
    expect(pairsOf('Cysteine')).toEqual([]);
  });

  it('quotes a source for every pair', () => {
    for (const p of COMPOUND_PAIRS) {
      expect(p.evidence.length).toBeGreaterThan(60);
      expect(p.members.length).toBeGreaterThanOrEqual(2);
    }
  });
});
