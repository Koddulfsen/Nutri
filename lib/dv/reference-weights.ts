/**
 * The body weight to use when a per-kg daily value must be shown to someone who has not given theirs.
 *
 * Why this table and not another: EFSA's *Guidance on selected default values* (EFSA Journal
 * 2012;10(3):2579) offers 70 kg for adults, 12 kg for 1–3 y and 5 kg for infants — three numbers, no
 * split by sex, no adolescent bands. The IOM's DRI reference weights below are per sex and use the same
 * age bands our own data already does, and — decisively — they are the weights the DRI tables
 * themselves multiplied by to turn g/kg into g/day, so using them reproduces what that committee
 * published rather than approximating it.
 *
 * Source: *Dietary Reference Intakes*, "Reference Heights and Weights", as reproduced by Health Canada
 * (`dri_tables-eng.pdf`, Abbreviations and Reference Heights and Weights). Footnotes, verbatim:
 *   "Calculated from median height and median body mass index for ages 4 through 19 years from
 *    CDC/NCHS growth charts."
 *   "Since there is no evidence that weight should change with ageing if activity is maintained, the
 *    reference weights for adults 19-30 years of age apply to all adult age groups."
 *
 * A weight from this table is an assumption about the person, not a measurement of them. Every caller
 * that uses one must carry that fact through — `resolveBar` records it as
 * `weightBasis.source === 'reference'` so a bar can say so.
 *
 * `reference-weights.test.ts` checks this table the only way that actually proves it: it reproduces the
 * DRI's own printed protein g/day from its printed g/kg/day, for every band.
 */

export interface ReferenceWeight {
  kg: number;
  /** Names the source and band, for display beside an assumed value. */
  note: string;
}

interface Band {
  /** Inclusive month bounds; null max = no upper bound. */
  minMonths: number;
  maxMonths: number | null;
  male: number;
  female: number;
  label: string;
}

/**
 * Infants under 2 months are deliberately absent: the DRI table starts at 2–6 months, and inventing a
 * weight for a newborn to fill the gap would be exactly the kind of unverified number this project
 * exists to keep out. `referenceWeightKg` returns null there, and the resolver excludes the value.
 */
const BANDS: Band[] = [
  { minMonths: 2, maxMonths: 6, male: 6, female: 6, label: '2–6 mo' },
  { minMonths: 7, maxMonths: 11, male: 9, female: 9, label: '7–12 mo' },
  { minMonths: 12, maxMonths: 47, male: 12, female: 12, label: '1–3 y' },
  { minMonths: 48, maxMonths: 107, male: 20, female: 20, label: '4–8 y' },
  { minMonths: 108, maxMonths: 167, male: 36, female: 37, label: '9–13 y' },
  { minMonths: 168, maxMonths: 227, male: 61, female: 54, label: '14–18 y' },
  // Per the footnote above, the 19–30 y weights stand for every adult age group.
  { minMonths: 228, maxMonths: null, male: 70, female: 57, label: '19–30 y (applies to all adults)' },
];

/**
 * A source's OWN reference weights, where it publishes them.
 *
 * This matters because a per-kg value and the absolute value a body prints beside it are tied together
 * by that body's own weights. EFSA states it outright in the protein table's footnote (a): the per-kg
 * figures are "to be multiplied by reference body weights to calculate values in g/day" — and EFSA's
 * adult weights are 68.1 and 58.5 kg, not the IOM's 70 and 57. Converting EFSA's 0.83 g/kg at the IOM's
 * weight produces 58.1 g, a number EFSA never published; at its own weight it produces 56.5 g, which is
 * what EFSA means.
 *
 * A source with no published table falls back to the IOM's, and the note says so, because an unstated
 * assumption is worse than a borrowed one that is named.
 */
const SOURCE_BANDS: Record<string, { label: string; bands: Band[] }> = {
  // EFSA DRVs summary report, Table 17, "Reference body weights for children and adults used for
  // scaling". Adults: "Derived from measured body heights of men and women aged 18-79 years in 13 EU
  // Member States and assuming a body mass index of 22 kg/m2". Children: median weight-for-age at the
  // age taken as reference (WHO Multicentre Growth Reference Study 2006; van Buuren et al. 2012).
  EU: {
    label: 'EFSA DRVs summary report, Table 17',
    bands: [
      { minMonths: 0, maxMonths: 6, male: 6.4, female: 5.8, label: '0–6 mo' },
      { minMonths: 7, maxMonths: 11, male: 8.9, female: 8.2, label: '7–11 mo' },
      { minMonths: 12, maxMonths: 47, male: 12.2, female: 11.5, label: '1–3 y' },
      { minMonths: 48, maxMonths: 83, male: 19.2, female: 18.7, label: '4–6 y' },
      { minMonths: 84, maxMonths: 131, male: 29.0, female: 28.4, label: '7–10 y' },
      { minMonths: 132, maxMonths: 179, male: 44.0, female: 45.1, label: '11–14 y' },
      { minMonths: 180, maxMonths: 215, male: 64.1, female: 56.4, label: '15–17 y' },
      { minMonths: 216, maxMonths: null, male: 68.1, female: 58.5, label: '≥ 18 y' },
    ],
  },
};

/**
 * The weight to resolve a per-kg value at.
 *
 * `region` picks that body's own table when it has one. Omit it for a general default.
 */
export function referenceWeightKg(ageMonths: number, sex: 'MALE' | 'FEMALE', region?: string): ReferenceWeight | null {
  const own = region ? SOURCE_BANDS[region] : undefined;
  if (own) {
    const band = own.bands.find((b) => ageMonths >= b.minMonths && (b.maxMonths === null || ageMonths <= b.maxMonths));
    if (band) return { kg: sex === 'MALE' ? band.male : band.female, note: `${own.label}, ${sex === 'MALE' ? 'males' : 'females'} ${band.label}` };
  }
  const band = BANDS.find((b) => ageMonths >= b.minMonths && (b.maxMonths === null || ageMonths <= b.maxMonths));
  if (!band) return null;
  const kg = sex === 'MALE' ? band.male : band.female;
  const borrowed = region && !own ? ` (no reference weights published by ${region}; the IOM's are used)` : '';
  return { kg, note: `IOM DRI reference weight, ${sex === 'MALE' ? 'males' : 'females'} ${band.label}${borrowed}` };
}

/** Exposed for the test that reproduces the DRI's own published values. */
export const REFERENCE_WEIGHT_BANDS = BANDS;
