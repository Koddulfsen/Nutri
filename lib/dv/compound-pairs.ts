/**
 * Requirements published for the SUM of two amino acids, because the body interconverts within the
 * pair and a requirement for one member alone is not a thing the bodies set.
 *
 * Only one pair lives here, and the reason the other does not is the point of the file.
 *
 * WHO TRS 935 (2007) publishes both sulfur (methionine + cysteine) and aromatic (phenylalanine +
 * tyrosine) as pairs in Table 36. For SULFUR it then goes further and splits them — § 8.1.7: "there
 * should be separate recommendations for methionine and cysteine ... 10.4 mg/kg per day methionine
 * and 4.1 mg/kg per day cysteine" — so methionine and cysteine each carry their own target and need
 * nothing from this file.
 *
 * For AROMATIC it says the opposite, in § 8.1.6: "It is not possible at present to set a specific
 * value for the ability of tyrosine to spare phenylalanine intake." So the pair total is the only
 * figure that exists, and phenylalanine and tyrosine correctly show no target of their own. Splitting
 * it — as Cronometer does, at an even 50/50 — would state a per-member requirement no authority sets.
 *
 * A pair is shown as its own row: the members keep their amounts with no bar, and the pair carries the
 * bar against the sum of their intakes.
 */
export interface CompoundPair {
  /** The compound the requirement is stored on. Must exist in `compounds` and in CORE_COMPOUNDS. */
  pair: string;
  /** The compounds whose intakes add up to it. */
  members: string[];
  /** Why the requirement is only published for the sum. Quoted from the source. */
  evidence: string;
}

export const COMPOUND_PAIRS: CompoundPair[] = [
  {
    pair: 'Phenylalanine + Tyrosine',
    members: ['Phenylalanine', 'Tyrosine'],
    evidence:
      'WHO TRS 935 (2007) § 8.1.6: "the recommended best estimate of total aromatic amino acid '
      + 'requirement is set at 25 mg/kg per day. It is not possible at present to set a specific value '
      + 'for the ability of tyrosine to spare phenylalanine intake." Tyrosine is made from '
      + 'phenylalanine, so the two are only meaningful together. Korea publishes the pair the same way.',
  },
];

export const pairsOf = (name: string) => COMPOUND_PAIRS.filter((p) => p.members.includes(name));
export const pairFor = (name: string) => COMPOUND_PAIRS.find((p) => p.pair === name);

/**
 * The pair's intake: the sum of its members, in the first member's unit.
 *
 * Returns null unless EVERY member has a value and all of them convert to one unit. A partial sum
 * would render as a real total and tell the user they are short of a target they may well have met —
 * the same failure shape as a bar drawn from half the data.
 */
export function sumPairIntake(
  pair: CompoundPair,
  amountOf: (name: string) => { amount: number; unit: string } | null | undefined,
  convert: (amount: number, from: string, to: string) => number | null
): { amount: number; unit: string } | null {
  const parts = pair.members.map(amountOf);
  if (parts.some((p) => p == null)) return null;
  const unit = parts[0]!.unit;
  let total = 0;
  for (const p of parts) {
    const v = convert(p!.amount, p!.unit, unit);
    if (v == null) return null;
    total += v;
  }
  return { amount: total, unit };
}
