/**
 * The CNF unit path — the one that produced choline's thousand-fold error.
 *
 * CNF's API sends values with no unit. The mapper used to resolve that as
 * `STANDARD_UNITS[name] || unit || 'g'` against a dictionary of 52 entries for 280 compounds, so every
 * unlisted micronutrient was stored as grams. Choline reached 96 foods that way — milligram values
 * under a gram label — and a carrot's bar read 1600 % of the daily value.
 *
 * The unit was in the database the whole time: all 117 CNF mappings carry `source_unit`, and choline's
 * says `mg`. These tests hold the mapper to asking for it, and to refusing to guess when it cannot.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const selectMock = vi.fn();
vi.mock('@/db', () => ({
  db: { select: (...args: unknown[]) => selectMock(...args) },
}));
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

/** A mapping row as compound_sources would return it. */
const mappingReturning = (row: { compoundId: string | null; sourceUnit: string | null } | null) => {
  selectMock.mockReturnValue({
    from: () => ({ where: () => ({ limit: async () => (row ? [row] : []) }) }),
  });
};

let mapper: { standardizeCNF: (n: string, v: number, id?: string, u?: string) => Promise<any> };

beforeEach(async () => {
  vi.resetModules();
  selectMock.mockReset();
  const mod = await import('./nutrient-mapper');
  const Cls = (mod as any).NutrientMapper ?? (mod as any).default;
  mapper = typeof Cls === 'function' ? new Cls() : (mod as any).nutrientMapper;
});

describe('a CNF nutrient with no unit in the response', () => {
  it('takes the unit the mapping records, rather than assuming grams', async () => {
    mappingReturning({ compoundId: 'choline-id', sourceUnit: 'mg' });
    const out = await mapper.standardizeCNF('Choline, total', 8.8, '862');
    expect(out).not.toBeNull();
    expect(out.unit, 'carrot choline is 8.8 mg per 100 g, not 8.8 g').toBe('mg');
    expect(out.value).toBe(8.8);
  });

  it('refuses to invent one when nothing knows it', async () => {
    // Not in STANDARD_UNITS, no source_unit, none supplied: a guess here is wrong by orders of
    // magnitude and looks plausible, which is worse than returning nothing.
    mappingReturning({ compoundId: 'x', sourceUnit: null });
    expect(await mapper.standardizeCNF('Some Obscure Compound', 42, '999')).toBeNull();
  });

  it('keeps value and unit consistent when the caller does supply one', async () => {
    // The point is not which unit wins but that the pair never lies: 8800 µg and 8.8 mg are the same
    // quantity, and either is fine to store. What must never happen is 8800 stored as mg, or 8.8 as g.
    // Evening out units ACROSS foods is a later step — the merge, and aggregateTotals, which converts.
    mappingReturning({ compoundId: 'x', sourceUnit: 'mg' });
    const out = await mapper.standardizeCNF('Choline, total', 8800, '862', 'µg');
    const inMg = out.unit === 'mg' ? out.value : out.value / 1000;
    expect(inMg).toBeCloseTo(8.8, 6);
  });
});

describe('a compound our own dictionary has an opinion about', () => {
  it('keeps storing it in the dictionary unit, converting from the source', async () => {
    mappingReturning({ compoundId: 'calcium-id', sourceUnit: 'mg' });
    const out = await mapper.standardizeCNF('Calcium', 120, '301');
    expect(out.unit).toBe('mg');
    expect(out.value).toBe(120);
  });
});
