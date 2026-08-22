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

export function parseUnit(raw: string | null | undefined): { magnitude: string; qualifier: string } {
  if (!raw) return { magnitude: '', qualifier: '' };

  let u = raw
    .normalize('NFKC')          // collapses some compatibility forms
    .toLowerCase()
    .replace(/\u00b5|\u03bc/g, 'u')   // micro sign + Greek mu -> 'u'
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

  return { magnitude: parts.join(' '), qualifier: qualifierParts.join(' ') };
}
