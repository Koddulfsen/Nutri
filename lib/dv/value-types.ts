/**
 * DV value types — what each authority publishes, and what it means.
 *
 * Every authority names its reference values differently (RDA, PRI, RNI, RI,
 * INR...) but they fall into a handful of families. Values may only be
 * aggregated WITHIN a family: an RDA and an EAR for the same nutrient are
 * different questions, not two opinions on one question.
 *
 * SOURCE_VALUE_TYPES is the per-source vocabulary: native term -> stored
 * `dv_type_enum` value. It was written from each source's `dv_sources.note`
 * and `dv-sources/<slug>/NOTES.md`, and `scripts/audit-dv-types.ts` checks the
 * live table against it. A stored type that is not in its source's vocabulary
 * is an error, not a style issue.
 */

export type DvValueType =
  | 'RDA' | 'AI' | 'UL' | 'EAR' | 'EER' | 'AMDR'
  | 'CDRR' | 'SDT' | 'NRV_R' | 'NRV_NCD' | 'DV' | 'RI';

export type DvFamily =
  /** Covers ~97.5% of healthy people. The main target. */
  | 'TARGET'
  /** "Appears adequate" — a target, but set without enough data for an RDA. */
  | 'TARGET_WEAK'
  /** Median requirement — covers 50%. Never a target. */
  | 'AVERAGE_REQUIREMENT'
  /** Energy requirement. Its own family: depends on activity, and %E values hang off it. */
  | 'ENERGY'
  /** Tolerable upper intake — a ceiling. */
  | 'UPPER_LIMIT'
  /** Acceptable range, usually % of energy. */
  | 'RANGE'
  /** Chronic-disease "stay below" (or "reach") marker. Not a target. */
  | 'CHRONIC_DISEASE'
  /** Flat food-label values. Not demographic; not used for personal targets. */
  | 'LABEL';

export const DV_FAMILY: Record<DvValueType, DvFamily> = {
  RDA: 'TARGET',
  AI: 'TARGET_WEAK',
  EAR: 'AVERAGE_REQUIREMENT',
  EER: 'ENERGY',
  UL: 'UPPER_LIMIT',
  AMDR: 'RANGE',
  CDRR: 'CHRONIC_DISEASE',
  SDT: 'CHRONIC_DISEASE',
  NRV_NCD: 'CHRONIC_DISEASE',
  NRV_R: 'LABEL',
  DV: 'LABEL',
  RI: 'LABEL',
};

export interface SourceVocabulary {
  /** Native term as the authority writes it -> stored enum value. */
  terms: Record<string, DvValueType>;
  /**
   * Known, unresolved deviations. The audit reports these as KNOWN rather than
   * failing, so they stay visible without blocking. Remove an entry once fixed.
   */
  knownIssues?: string[];
}

/** Keyed by `source_region_enum`. */
export const SOURCE_VALUE_TYPES: Record<string, SourceVocabulary> = {
  USA_CANADA: {
    terms: { RDA: 'RDA', AI: 'AI', EAR: 'EAR', UL: 'UL', AMDR: 'AMDR', CDRR: 'CDRR', EER: 'EER' },
  },
  EU: {
    terms: { PRI: 'RDA', AI: 'AI', AR: 'EAR', UL: 'UL', RI: 'AMDR', 'AR (energy)': 'EER' },
  },
  UK: {
    terms: {
      RNI: 'RDA', 'Safe Intake': 'AI', 'EAR (energy)': 'EER', 'fibre recommended intake': 'AI',
      'max salt/sugar/fat': 'CDRR', 'carb target': 'AMDR',
    },
  },
  JAPAN: {
    // DG (Dietary Goal) has three shapes: a range (macros), a floor (fiber >= x),
    // and a ceiling (sodium < x). Ranges and floors are AMDR; ceilings are CDRR.
    terms: { EAR: 'EAR', RDA: 'RDA', AI: 'AI', UL: 'UL', DG: 'AMDR', 'DG (ceiling)': 'CDRR', EER: 'EER' },
  },
  CHINA: {
    terms: {
      EAR: 'EAR', RNI: 'RDA', AI: 'AI', UL: 'UL', AMDR: 'AMDR', 'PI-NCD': 'CDRR', EER: 'EER',
    },
  },
  AU_NZ: {
    terms: { RDI: 'RDA', AI: 'AI', EAR: 'EAR', UL: 'UL', EER: 'EER', AMDR: 'AMDR', SDT: 'SDT' },
  },
  NORDIC: {
    terms: { RI: 'RDA', AI: 'AI', AR: 'EAR', 'provisional AR': 'EAR', UL: 'UL', CDRR: 'CDRR', 'recommended intake range': 'AMDR', 'energy reference value': 'EER' },
  },
  ITALY: {
    // PRI vs AI is read from the SINU tables' formatting (bold PRI, italic AI).
    terms: { PRI: 'RDA', AI: 'AI', AR: 'EAR', UL: 'UL', SDT: 'SDT', RI: 'AMDR', 'AR (energy)': 'EER' },
  },
  INDIA: {
    terms: { RDA: 'RDA', EAR: 'EAR', 'RDA (energy)': 'EER' },
  },
  KOREA: {
    terms: { EAR: 'EAR', RNI: 'RDA', AI: 'AI', UL: 'UL', AMDR: 'AMDR', CDRR: 'CDRR', EER: 'EER' },
  },
  TAIWAN: {
    terms: { EAR: 'EAR', RDA: 'RDA', AI: 'AI', UL: 'UL', AMDR: 'AMDR', CDRR: 'CDRR', EER: 'EER' },
  },
  RUSSIA: {
    terms: { 'норма (RDA)': 'RDA', AI: 'AI', 'added sugars limit': 'CDRR', 'energy requirement': 'EER' },
  },
  WHO_FAO: {
    terms: { RNI: 'RDA', 'recommended safe intake (vitamin A)': 'RDA', 'acceptable intake (vitamin E)': 'AI' },
    knownIssues: ['Iron and zinc RNIs are printed per bioavailability level; stored at 12% (iron) and moderate (zinc), with the alternatives in notes'],
  },
  SINGAPORE: {
    terms: { RDA: 'RDA', 'energy requirement': 'EER' },
  },
  SPAIN: {
    terms: { INR: 'RDA' },
    knownIssues: ['INR stored as RDA, but AESAN uses INR for both PRI/RDA- and AI-derived values (report section 3), so AI-type values cannot be told apart'],
  },
};

/** The stored types a source is allowed to have. */
export function allowedTypes(region: string): Set<DvValueType> {
  const vocab = SOURCE_VALUE_TYPES[region];
  return new Set(vocab ? Object.values(vocab.terms) : []);
}
