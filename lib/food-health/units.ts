/**
 * Unit strings arrive from 17 sources with three kinds of cosmetic variation that
 * are NOT errors. Comparing raw text made this checker report 246 flags when only
 * ~25 were real (CLAUDE.md §6):
 *
 *  1. Micro sign      — 'µg' (U+00B5), 'μg' (U+03BC), 'ug', 'UG' are one unit
 *  2. Per-100g basis  — 'mg/100g', 'mg/100 g', 'mg per 100g' all mean 'mg' here;
 *                       every source in this DB reports per 100 g
 *  3. Qualifiers      — 'µg DFE', 'mg NE', 'µg RAE' carry the same magnitude as
 *                       their bare unit; they describe equivalence accounting,
 *                       not scale
 *
 * We split a unit into { magnitude, qualifier } so a wrong FACTOR (a real bug,
 * silent because factors apply at read time) is distinguishable from a wrong
 * LABEL (a data-entry nit).
 */
// Equivalence qualifiers: they describe accounting, not scale. 'mg NE' and 'mg'
// are the same magnitude. Split on hyphens too, so 'alfa-TE' arrives as two tokens.
export const QUALIFIERS = [
  'dfe',   // dietary folate equivalents
  'ne',    // niacin equivalents
  'rae',   // retinol activity equivalents
  're',    // retinol equivalents
  'ae',    // alpha-tocopherol equivalents
  'ate',   // alpha-tocopherol equivalents (Matvaretabellen spelling)
  'te',    // tocopherol equivalents
  'at',    // alpha-tocopherol
  'alfa',  // Nordic spelling, always paired ('alfa-TE')
  'alpha',
];

/**
 * One qualifier, one spelling. 'mg α-TE', 'mg alfa-TE' and 'mg ATE' are the same accounting — Japan, the Nordic
 * council and Matvaretabellen just write it differently — and leaving them as three distinct strings makes a
 * comparison refuse three sources that agree. RE and RAE are NOT folded together: they count carotenoids
 * differently (1/6 vs 1/12 for β-carotene), so they are different quantities, not different spellings.
 */
const QUALIFIER_CANON: Record<string, string> = {
  'alpha te': 'alpha-te', 'alfa te': 'alpha-te', ate: 'alpha-te', at: 'alpha-te', 'alpha t': 'alpha-te',
};

export function parseUnit(raw: string | null | undefined): { magnitude: string; qualifier: string } {
  if (!raw) return { magnitude: '', qualifier: '' };

  let u = raw
    .normalize('NFKC')          // collapses some compatibility forms
    .toLowerCase()
    .replace(/\u00b5|\u03bc/g, 'u')   // micro sign + Greek mu -> 'u'
    .replace(/\u03b1/g, 'alpha')      // Greek alpha: 'mg α-TE' is 'mg alpha-TE'. Without this the token 'α'
                                      // is not a known qualifier, the peeling stops, and the magnitude comes
                                      // out as 'mg α' — an unknown scale, so the value converts to nothing
                                      // and is dropped from every aggregate. 411 DV rows spell it this way.
    .replace(/\u03b2/g, 'beta')
    .trim();

  // Strip the per-100g basis suffix in its several spellings.
  u = u.replace(/\s*(\/|per\s+)\s*100\s*(g|ml|gram|grams)\b\.?/g, '').trim();

  // Peel off a trailing equivalence qualifier, if present.
  // Peel every trailing qualifier token, so 'mg alfa-TE' -> magnitude 'mg'.
  const parts = u.split(/[\s_-]+/).filter(Boolean);
  const qualifierParts: string[] = [];
  while (parts.length > 1 && QUALIFIERS.includes(parts[parts.length - 1])) {
    qualifierParts.unshift(parts.pop() as string);
  }

  const qualifier = qualifierParts.join(' ');
  return { magnitude: parts.join(' '), qualifier: QUALIFIER_CANON[qualifier] ?? qualifier };
}

/**
 * Convertible scales, grouped by DIMENSION.
 *
 * Crossing dimensions is a category error, not a scaling error: kJ -> kcal is a
 * real x0.239 conversion, g -> kcal is not a conversion at all. Anything not
 * listed here cannot be normalized and must be excluded from an average rather
 * than guessed at. Note parseUnit() folds the micro sign to 'u', so the key is
 * 'ug' and not 'µg'.
 */
export const UNIT_SCALES: Record<string, { dim: string; scale: number }> = {
  kg: { dim: 'mass', scale: 1e3 },
  g: { dim: 'mass', scale: 1 },
  mg: { dim: 'mass', scale: 1e-3 },
  ug: { dim: 'mass', scale: 1e-6 },
  ng: { dim: 'mass', scale: 1e-9 },
  kj: { dim: 'energy', scale: 1 },
  kcal: { dim: 'energy', scale: 4.184 },
  l: { dim: 'volume', scale: 1 },
  dl: { dim: 'volume', scale: 0.1 },
  ml: { dim: 'volume', scale: 1e-3 },
  iu: { dim: 'iu', scale: 1 },
  '%': { dim: 'ratio', scale: 1 },
};

/**
 * Factor that turns a value expressed in `from` into one expressed in `to`.
 * Returns null when either unit is unknown or they measure different things —
 * the caller must then drop the value, never average it in.
 */
export function conversionBetween(from: string | null | undefined, to: string | null | undefined): number | null {
  const f = UNIT_SCALES[parseUnit(from).magnitude];
  const t = UNIT_SCALES[parseUnit(to).magnitude];
  if (!f || !t || f.dim !== t.dim) return null;
  return f.scale / t.scale;
}
