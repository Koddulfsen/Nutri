/**
 * Turn stored reference values into the numbers a bar shows.
 *
 * This is the one place that decides what a user's target is. It applies what the source audit established:
 *
 *   - Only the 10 bodies that derive their own values count (dv-sources/PROVENANCE.md). A copy is not a second
 *     opinion, and Spain's values are already a median of other bodies.
 *   - Where two of those bodies share one judgement for a nutrient (NUTRIENT_COLLAPSES), they count once.
 *   - MEDIAN, not mean: one unusual source should not drag a target.
 *   - Units are converted, not matched as text — 'µg RAE' and 'µg' are the same scale (dv-sources/VALUE-TYPES.md).
 *     Anything that cannot be converted is dropped with a reason, never averaged in.
 *   - A value's TYPE decides its direction: RDA/AI and CDRR floors are goals; UL, CDRR ceilings and AMDR ceilings are
 *     limits; EAR is never a personal target (it meets half the population's needs).
 *   - Limits that apply only to supplements (magnesium salts, folic acid) never constrain food.
 *
 * Pure: no database, no clock. `resolveBar` takes the rows for one compound and one demographic.
 */
import { conversionBetween, parseUnit } from '../food-health/units';
import { ALPHA_INDEPENDENT_REGIONS, NUTRIENT_COLLAPSES } from './source-provenance';
import { formLinksOf } from './compound-links';
import { qualifiersInterchangeable, rulingFor, isRuledQualifier } from './unit-rulings';

export type ValueClass = 'REC' | 'EAR' | 'UL';

/** One stored value, already filtered to a single compound, sex, life stage and age. */
export interface DvRow {
  region: string;
  compound: string;
  valueType: 'RDA' | 'AI' | 'EAR' | 'UL' | 'CDRR' | 'AMDR' | 'EER';
  value: number;
  valueMin?: number | null;
  valueMax?: number | null;
  unit: string;
  isPercentOfEnergy?: boolean;
  supplementalOnly?: boolean;
}

export interface Aggregate {
  value: number;
  unit: string;
  /** Regions that contributed, after collapsing shared judgements. */
  sources: string[];
  /** Lowest and highest contributing value, in `unit` — how much the bodies disagree. */
  spread: [number, number];
}

export interface ResolvedBar {
  compound: string;
  /** Intake to reach for adequacy: median of each body's RDA, or its AI where it sets no RDA. */
  goal: (Aggregate & { type: 'RDA' | 'AI' | 'MIXED' }) | null;
  /**
   * Intake to reach for lower chronic-disease risk (CDRR/AMDR floors: potassium, fibre, China's PI-NCD vitamin C).
   * A different question from adequacy and usually a higher number, so it is kept apart instead of being averaged
   * into the goal — and it stops a body that sets both from being counted twice.
   */
  diseaseFloor: Aggregate | null;
  /** Intake to stay under: the median of each body's strictest food-applicable ceiling. */
  limit: (Aggregate & { from: Array<'UL' | 'CDRR' | 'AMDR'> }) | null;
  /** Range to stay inside (macronutrients, % of energy). */
  range: { min: number; max: number; unit: string; sources: string[] } | null;
  /**
   * Values expressed as a share of energy rather than as an amount — China's 4 %E linoleic acid, Russia's 30 %E fat
   * ceiling. They are NOT amounts and must never be mixed with one: a 4 and a 17 are not two opinions about the same
   * quantity. Kept here in percent until the caller knows the user's energy intake and can convert them.
   */
  energyShare: { goal: Aggregate | null; limit: Aggregate | null } | null;
  /** Limits that apply only to supplements or fortified foods — shown apart, never against food intake. */
  supplementLimit: Aggregate | null;
  /**
   * Limits that belong beside this bar but cap a FORM of the nutrient (retinol within vitamin A, folic acid within
   * folate). They cannot be compared with the bar's total intake — `countsParentTotal` is false for all of them — so
   * they are returned separately, with the form's own compound, for the caller to apply to that form's intake.
   */
  formLimits: Array<Aggregate & { compound: string; countsParentTotal: boolean; unitNote?: string }>;
  /** Every row that did not contribute, and why. */
  excluded: Array<{ region: string; valueType: string; unit: string; reason: string }>;
}

const ALPHA = new Set<string>(ALPHA_INDEPENDENT_REGIONS);
const classOf = (t: DvRow['valueType']): ValueClass | null =>
  t === 'RDA' || t === 'AI' ? 'REC' : t === 'EAR' ? 'EAR' : t === 'UL' ? 'UL' : null;

export const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Mechanical conversion: scale only, no judgement about what a qualifier means. Two different qualifiers are refused
 * outright (µg DFE is not µg RAE). Whether a BARE unit may be pooled with a qualified one depends on the nutrient and
 * is not decidable here — use `convertFor`, which consults the per-compound rulings.
 */
export function toUnit(value: number, from: string, to: string): number | null {
  const a = parseUnit(from);
  const b = parseUnit(to);
  if (a.qualifier && b.qualifier && a.qualifier !== b.qualifier) return null;
  const f = conversionBetween(from, to);
  return f == null ? null : value * f;
}

/**
 * Convert within one nutrient, applying that nutrient's unit ruling (lib/dv/unit-rulings.ts). Returns the converted
 * value, or a reason it cannot be converted — the reason is carried into `excluded` so a dropped source is always
 * accounted for rather than silently missing.
 */
function convertFor(compound: string, value: number, from: string, to: string): { value: number } | { reason: string } {
  const a = parseUnit(from);
  const b = parseUnit(to);
  if (a.qualifier !== b.qualifier) {
    const ok = qualifiersInterchangeable(compound, a.qualifier, b.qualifier);
    const name = (u: string) => u || 'the bare unit';
    if (ok === null)
      return { reason: `${name(from)} and ${name(to)} have no ruling for this nutrient, so they are not pooled — see lib/dv/unit-rulings.ts` };
    if (ok === false)
      return { reason: `${name(from)} is not ${name(to)} for this nutrient: ${rulingFor(compound, a.qualifier, b.qualifier)?.difference ?? ''}` };
  }
  const f = conversionBetween(a.magnitude, b.magnitude);
  return f == null ? { reason: `cannot be expressed in ${to}` } : { value: value * f };
}

/**
 * The unit to express the bar in.
 *
 * Entries are grouped by what their qualifier MEANS for this nutrient — one group per quantity, with spellings the
 * ruling calls equivalent folded together — and the largest group wins. A plain majority vote over unit strings
 * would decide folate's bar by a coin flip between two bodies writing µg and two writing µg DFE, and silently drop
 * whichever half lost. Ties go to the group with a stated basis, because a book that says what it is counting is the
 * safer thing to build a target from.
 */
function chooseUnit(compound: string, entries: Array<{ region: string; unit: string }>): string {
  const groups = new Map<string, { units: Map<string, number>; regions: Set<string>; qualified: boolean; known: boolean }>();
  for (const e of entries) {
    const q = parseUnit(e.unit).qualifier;
    const key = [...groups.keys()].find((k) => qualifiersInterchangeable(compound, k, q) === true) ?? q;
    const g = groups.get(key) ?? { units: new Map(), regions: new Set(), qualified: false, known: isRuledQualifier(compound, q) };
    g.units.set(e.unit, (g.units.get(e.unit) ?? 0) + 1);
    g.regions.add(e.region);
    if (q) g.qualified = true;
    groups.set(key, g);
  }
  const best = [...groups.values()].sort(
    (a, b) =>
      b.regions.size - a.regions.size ||
      // A qualifier this nutrient has no ruling for is not a basis, it is an unknown — it should not win a tie
      // against a plain unit just for carrying letters after the magnitude.
      Number(b.known) - Number(a.known) ||
      Number(b.qualified) - Number(a.qualified) ||
      [...a.units.keys()][0].localeCompare([...b.units.keys()][0])
  )[0];
  // Within the winning group, the spelling most of its rows already use.
  return [...best.units.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

function aggregate(compound: string, entries: Array<{ region: string; value: number; unit: string }>, excluded: ResolvedBar['excluded'], what: string) {
  if (!entries.length) return null;
  const unit = chooseUnit(compound, entries);
  const kept: Array<{ region: string; value: number }> = [];
  for (const e of entries) {
    const c = convertFor(compound, e.value, e.unit, unit);
    if ('reason' in c) { excluded.push({ region: e.region, valueType: what, unit: e.unit, reason: c.reason }); continue; }
    kept.push({ region: e.region, value: c.value });
  }
  if (!kept.length) return null;
  // A body can publish several rows for one demographic — Russia prints a separate protein and fat intake per
  // physical-activity group — and that is still one body's judgement, not several votes. Collapse to its median first,
  // so a source with four rows cannot outweigh a source with one.
  const perRegion = new Map<string, number[]>();
  for (const k of kept) perRegion.set(k.region, [...(perRegion.get(k.region) ?? []), k.value]);
  const values = [...perRegion.values()].map(median);
  return { value: median(values), unit, sources: [...perRegion.keys()].sort(), spread: [Math.min(...values), Math.max(...values)] as [number, number] };
}

/**
 * Rows that another body's row already speaks for (see NUTRIENT_COLLAPSES). Matched on the compound the bar is for,
 * not on each row's own `compound` field: the rows are already filtered to one compound, and trusting the field would
 * silently skip the collapse whenever a caller labelled rows differently.
 */
function dropCollapsed(compound: string, rows: DvRow[], excluded: ResolvedBar['excluded']): DvRow[] {
  const present = new Set(rows.map((r) => r.region));
  return rows.filter((r) => {
    const cls = classOf(r.valueType);
    const rule = NUTRIENT_COLLAPSES.find((c) => c.region === r.region && c.compound === compound && c.cls === cls && present.has(c.sameAs));
    if (!rule) return true;
    excluded.push({ region: r.region, valueType: r.valueType, unit: r.unit, reason: `same judgement as ${rule.sameAs} for this nutrient; counted once` });
    return false;
  });
}

/**
 * @param allRows rows for `compound`, one demographic.
 * @param formRows rows for compounds whose limits belong beside this bar (see lib/dv/compound-links.ts), keyed by
 *   compound name. Omit when the caller has not loaded them; the bar is then returned without form limits.
 */
/**
 * True when a row states a share of the day's energy, not an amount. The stored flag is authoritative; the unit is
 * checked too because a `%` that is not flagged is the same trap either way.
 */
const isEnergyShare = (r: DvRow) => r.isPercentOfEnergy === true || /^%/.test(parseUnit(r.unit).magnitude.trim());

export function resolveBar(compound: string, allRows: DvRow[], formRows: Record<string, DvRow[]> = {}): ResolvedBar {
  const excluded: ResolvedBar['excluded'] = [];
  const rows: DvRow[] = [];
  for (const r of allRows) {
    if (!ALPHA.has(r.region)) { excluded.push({ region: r.region, valueType: r.valueType, unit: r.unit, reason: 'not one of the independent sources' }); continue; }
    if (r.valueType === 'EAR') { excluded.push({ region: r.region, valueType: r.valueType, unit: r.unit, reason: 'an average requirement is not a personal target' }); continue; }
    if (r.valueType === 'EER') { excluded.push({ region: r.region, valueType: r.valueType, unit: r.unit, reason: 'energy is resolved separately (depends on activity)' }); continue; }
    if (/\//.test(parseUnit(r.unit).magnitude)) { excluded.push({ region: r.region, valueType: r.valueType, unit: r.unit, reason: 'per-energy unit: needs the user\'s energy intake to become an amount' }); continue; }
    rows.push(r);
  }
  const kept = dropCollapsed(compound, rows, excluded);

  // ── Goal: one per body (RDA beats AI), plus floors from CDRR/AMDR ──
  const perRegionGoal = new Map<string, { values: Array<{ value: number; unit: string }>; type: 'RDA' | 'AI' }>();
  const floors: Array<{ region: string; value: number; unit: string }> = [];
  const ceilings: Array<{ region: string; value: number; unit: string; from: 'UL' | 'CDRR' | 'AMDR' }> = [];
  const suppCeilings: Array<{ region: string; value: number; unit: string }> = [];
  const ranges: Array<{ region: string; min: number; max: number; unit: string }> = [];
  const shareGoals: Array<{ region: string; value: number; unit: string }> = [];
  const shareCeilings: Array<{ region: string; value: number; unit: string }> = [];

  for (const r of kept) {
    // A share of energy is not an amount. Letting one into the pool lets it win the unit vote and drop every body
    // that published a real amount — which is exactly what linoleic acid did (3.25 % from 2 bodies, 11.5 g and
    // 17 g discarded). Ranges are the one place a share belongs as published.
    if (isEnergyShare(r) && !(r.valueMin != null && r.valueMax != null)) {
      if (r.valueType === 'RDA' || r.valueType === 'AI') shareGoals.push({ region: r.region, value: r.value, unit: r.unit });
      else if (r.valueMax != null) shareCeilings.push({ region: r.region, value: r.valueMax, unit: r.unit });
      else if (r.valueMin != null) shareGoals.push({ region: r.region, value: r.valueMin, unit: r.unit });
      // A share with no min or max is a point target — Russia prints protein at 14 % of energy per activity group,
      // DGE prints fat at 30 % as a Richtwert. That is something to aim at, so it belongs with the share goals.
      // `scripts/dv-verify/check-source-consistency.ts` is what stops a mistranscribed range from arriving here:
      // a direction-less row must be on its verified point-target allowlist or the checker fails.
      else shareGoals.push({ region: r.region, value: r.value, unit: r.unit });
      excluded.push({ region: r.region, valueType: r.valueType, unit: r.unit, reason: 'stated as a share of energy, not an amount; kept under energyShare' });
      continue;
    }
    if (r.valueType === 'RDA' || r.valueType === 'AI') {
      const cur = perRegionGoal.get(r.region);
      // An RDA supersedes the same body's AI; further rows of the type it publishes are kept and collapsed below.
      if (!cur || (cur.type === 'AI' && r.valueType === 'RDA')) perRegionGoal.set(r.region, { values: [{ value: r.value, unit: r.unit }], type: r.valueType });
      else if (cur.type === r.valueType) cur.values.push({ value: r.value, unit: r.unit });
      continue;
    }
    if (r.valueType === 'UL') {
      if (r.supplementalOnly) suppCeilings.push({ region: r.region, value: r.value, unit: r.unit });
      else ceilings.push({ region: r.region, value: r.value, unit: r.unit, from: 'UL' });
      continue;
    }
    // CDRR and AMDR carry their direction in min/max, never in the type name.
    if (r.valueMin != null && r.valueMax != null) { ranges.push({ region: r.region, min: r.valueMin, max: r.valueMax, unit: r.unit }); continue; }
    if (r.valueMax != null) { ceilings.push({ region: r.region, value: r.valueMax, unit: r.unit, from: r.valueType === 'CDRR' ? 'CDRR' : 'AMDR' }); continue; }
    if (r.valueMin != null) { floors.push({ region: r.region, value: r.valueMin, unit: r.unit }); continue; }
    excluded.push({ region: r.region, valueType: r.valueType, unit: r.unit, reason: 'point target: neither a goal nor a limit' });
  }

  const goalEntries = [...perRegionGoal.entries()].flatMap(([region, g]) => g.values.map((v) => ({ region, ...v })));
  const goalAgg = aggregate(compound, goalEntries, excluded, 'goal');
  const diseaseFloor = aggregate(compound, floors, excluded, 'disease floor');
  const goalTypes = new Set([...perRegionGoal.values()].map((g) => g.type));
  const goal = goalAgg ? { ...goalAgg, type: (goalTypes.size === 1 ? [...goalTypes][0] : 'MIXED') as 'RDA' | 'AI' | 'MIXED' } : null;

  // One ceiling per body — the strictest it sets — then the median of those.
  const perRegionCeiling = new Map<string, { value: number; unit: string; from: 'UL' | 'CDRR' | 'AMDR' }>();
  for (const c of ceilings) {
    const cur = perRegionCeiling.get(c.region);
    if (!cur) { perRegionCeiling.set(c.region, c); continue; }
    const inCur = convertFor(compound, c.value, c.unit, cur.unit);
    if ('value' in inCur && inCur.value < cur.value) perRegionCeiling.set(c.region, c);
  }
  const limitAgg = aggregate(compound, [...perRegionCeiling.entries()].map(([region, c]) => ({ region, value: c.value, unit: c.unit })), excluded, 'limit');
  const limit = limitAgg ? { ...limitAgg, from: [...new Set([...perRegionCeiling.values()].map((c) => c.from))] } : null;

  const suppAgg = aggregate(compound, suppCeilings, excluded, 'supplement limit');

  let range: ResolvedBar['range'] = null;
  if (ranges.length) {
    const unit = chooseUnit(compound, ranges);
    const mins: number[] = []; const maxs: number[] = []; const regions: string[] = [];
    for (const r of ranges) {
      const lo = convertFor(compound, r.min, r.unit, unit); const hi = convertFor(compound, r.max, r.unit, unit);
      if ('reason' in lo || 'reason' in hi) { excluded.push({ region: r.region, valueType: 'range', unit: r.unit, reason: 'reason' in lo ? lo.reason : (hi as { reason: string }).reason }); continue; }
      mins.push(lo.value); maxs.push(hi.value); regions.push(r.region);
    }
    if (mins.length) range = { min: median(mins), max: median(maxs), unit, sources: regions.sort() };
  }

  // Limits stored on a form of this nutrient (resolved on their own compound, never merged into `limit`).
  const formLimits: ResolvedBar['formLimits'] = [];
  for (const link of formLinksOf(compound)) {
    const rowsForForm = formRows[link.form];
    if (!rowsForForm?.length) continue;
    const sub = resolveBar(link.form, rowsForForm);
    const agg = sub.limit ?? sub.supplementLimit;
    if (agg) formLimits.push({ ...agg, compound: link.form, countsParentTotal: link.countsParentTotal, unitNote: link.unitNote });
  }

  const shareGoal = aggregate(compound, shareGoals, excluded, 'energy share goal');
  const shareLimit = aggregate(compound, shareCeilings, excluded, 'energy share limit');
  const energyShare = shareGoal || shareLimit ? { goal: shareGoal, limit: shareLimit } : null;

  return { compound, goal, diseaseFloor, limit, range, energyShare, supplementLimit: suppAgg, formLimits, excluded };
}
