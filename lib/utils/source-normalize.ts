/**
 * Shared source name normalization.
 *
 * compound_sources.external_source uses mixed case (CoFID, Fineli, FooDB)
 * while api_source_enum uses uppercase (UK_COFID, FINELI, FOODB).
 * This map resolves the variants to their canonical enum names.
 */

const SOURCE_NORMALIZE: Record<string, string> = {
  CoFID: 'UK_COFID',
  Fineli: 'FINELI',
  FooDB: 'FOODB',
  Matvaretabellen: 'MATVARETABELLEN',
};

export function normalizeSource(s: string): string {
  return SOURCE_NORMALIZE[s] || s;
}
