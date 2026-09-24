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

export function referenceWeightKg(ageMonths: number, sex: 'MALE' | 'FEMALE'): ReferenceWeight | null {
  const band = BANDS.find((b) => ageMonths >= b.minMonths && (b.maxMonths === null || ageMonths <= b.maxMonths));
  if (!band) return null;
  const kg = sex === 'MALE' ? band.male : band.female;
  return { kg, note: `IOM DRI reference weight, ${sex === 'MALE' ? 'males' : 'females'} ${band.label}` };
}

/** Exposed for the test that reproduces the DRI's own published values. */
export const REFERENCE_WEIGHT_BANDS = BANDS;
