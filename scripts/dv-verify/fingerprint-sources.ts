/**
 * Numeric provenance fingerprints: how much of a source's table can be explained by another source's values.
 *
 * The text of a report is the evidence for provenance (see dv-sources/PROVENANCE.md); this is the corroborating
 * signal, and the only one available when a report is silent. For a target source it measures, against every other
 * loaded source:
 *
 *   match      share of the target's comparable cells (same compound, value class, sex, life stage, overlapping age
 *              band) whose value equals the other source's, units converted, within 0.5%.
 *   unique     how many of the target's values are DISTINCTIVE to one of the independent roots — held by that root and
 *              by no other root for that compound. Common values (iodine 150 µg) prove nothing; a root's idiosyncratic
 *              choices (IOM choline 550 mg) are hard to reach by coincidence.
 *   scaled     compounds whose values are a constant multiple (not 1) of the other source's across ≥4 aligned cells —
 *              the signature of "copied, then rescaled to local body weights".
 *   bands      Jaccard overlap of the age-band start points: copies inherit their parent's age brackets.
 *
 * It can show dependence convincingly; it can only suggest independence — a table matching nothing here may still be
 * copied from a source we do not hold.
 *
 * Run: npx tsx scripts/dv-verify/fingerprint-sources.ts <REGION> [<REGION> ...]
 */
import 'dotenv/config';
import postgres from 'postgres';
import { conversionBetween } from '../../lib/food-health/units';
import { ALPHA_INDEPENDENT_REGIONS } from '../../lib/dv/source-provenance';

type Cls = 'REC' | 'EAR' | 'UL';
interface Row { region: string; compound: string; cls: Cls; sex: string; stage: string; min: number; max: number; value: number; unit: string }

const ROOTS: readonly string[] = ALPHA_INDEPENDENT_REGIONS;
const TOL = 0.005;
const sql = postgres(process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL!, { max: 1 });

// RDA vs AI labelling differs between bodies for the same number (Malaysia, Indonesia label everything RNI/AKG), so they
// are compared as one class of recommended intake.
const clsOf = (t: string): Cls | null => (t === 'RDA' || t === 'AI' ? 'REC' : t === 'EAR' ? 'EAR' : t === 'UL' ? 'UL' : null);
const stageOf = (s: string) => (s.startsWith('PREGNANT') ? 'PREGNANT' : s.startsWith('LACTATING') ? 'LACTATING' : s);
// Per-energy units (mg/MJ, mg/1000 kcal) and %E cannot be converted to per-day amounts: skip them.
const comparableUnit = (u: string) => !/\/|%|kcal|kJ/i.test(u);

async function load(): Promise<Row[]> {
  const rows = await sql`
    SELECT r.source_region region, c.name compound, r.value_type vt, r.sex, r.life_stage stage,
      r.age_min_months amin, r.age_max_months amax, r.value, r.unit
    FROM reference_daily_values r JOIN compounds c ON c.id = r.compound_id
    WHERE r.activity_level IS NULL AND r.dietary_context IS NULL AND NOT r.is_percent_of_energy`;
  const out: Row[] = [];
  for (const r of rows) {
    const cls = clsOf(r.vt);
    if (!cls || !comparableUnit(r.unit)) continue;
    out.push({ region: r.region, compound: r.compound, cls, sex: r.sex, stage: stageOf(r.stage), min: r.amin,
      max: r.amax ?? 1200, value: Number(r.value), unit: r.unit });
  }
  return out;
}

const eq = (a: number, b: number) => Math.abs(a - b) <= TOL * Math.max(Math.abs(a), Math.abs(b));
const inUnit = (r: Row, unit: string) => { const f = r.unit === unit ? 1 : conversionBetween(r.unit, unit); return f == null ? null : r.value * f; };

async function main() {
  const brief = process.argv.includes('--summary');
  let targets = process.argv.slice(2).filter((a) => a !== '--summary');
  const summary: Array<{ target: string; distinct: number; topRoot: string; topUnique: number; share: number; second: number }> = [];
  if (!targets.length) { console.error('Usage: fingerprint-sources.ts <REGION> [...]'); process.exit(1); }
  const all = await load();
  const byRegion = new Map<string, Row[]>();
  for (const r of all) byRegion.set(r.region, [...(byRegion.get(r.region) ?? []), r]);
  if (targets.includes('ALL')) targets = [...byRegion.keys()].sort();

  // Canonical unit per compound (the most common one), so root value sets can be compared across sources.
  const unitVotes = new Map<string, Map<string, number>>();
  for (const r of all) { const m = unitVotes.get(r.compound) ?? new Map(); m.set(r.unit, (m.get(r.unit) ?? 0) + 1); unitVotes.set(r.compound, m); }
  const canon = new Map([...unitVotes].map(([c, m]) => [c, [...m].sort((a, b) => b[1] - a[1])[0][0]]));
  const canonVal = (r: Row) => { const v = inUnit(r, canon.get(r.compound)!); return v == null ? null : Math.round(v * 1e6) / 1e6; };

  // Values each root holds per (compound, class).
  const rootVals = new Map<string, Map<string, number[]>>();
  for (const root of ROOTS) {
    const m = new Map<string, number[]>();
    for (const r of byRegion.get(root) ?? []) { const v = canonVal(r); if (v == null) continue; const k = `${r.compound}|${r.cls}`; m.set(k, [...(m.get(k) ?? []), v]); }
    rootVals.set(root, m);
  }
  // Distinctive = held by exactly one root, judged WITHOUT the target: when the target is itself a root, counting its
  // own values would make every value it shares with another root non-distinctive, and it could never score — a
  // control that passes by construction.
  const distinctiveOwner = (compound: string, cls: Cls, v: number, target: string): string | null => {
    const owners = ROOTS.filter((root) => root !== target && (rootVals.get(root)!.get(`${compound}|${cls}`) ?? []).some((x) => eq(x, v)));
    return owners.length === 1 ? owners[0] : null;
  };

  for (const target of targets) {
    const T = byRegion.get(target);
    if (!T) { console.log(`\n${target}: no rows`); continue; }
    // Distinctive root values the target carries (each distinct compound/class/value counted once).
    const uniqueHits = new Map<string, Set<string>>();
    for (const t of T) {
      const v = canonVal(t); if (v == null) continue;
      const owner = distinctiveOwner(t.compound, t.cls, v, target);
      if (owner) { const s = uniqueHits.get(owner) ?? new Set(); s.add(`${t.compound} ${t.cls} ${v}`); uniqueHits.set(owner, s); }
    }
    const tBands = new Set(T.filter((r) => r.stage === 'NONE').map((r) => r.min));
    const results: Array<{ region: string; comparable: number; matched: number; scaled: string[]; bands: number; unique: number; uniqueEx: string[] }> = [];
    for (const [region, R] of byRegion) {
      if (region === target) continue;
      const idx = new Map<string, Row[]>();
      for (const r of R) { const k = `${r.compound}|${r.cls}|${r.sex}|${r.stage}`; idx.set(k, [...(idx.get(k) ?? []), r]); }
      let comparable = 0; let matched = 0;
      const ratios = new Map<string, number[]>();
      for (const t of T) {
        const cands = (idx.get(`${t.compound}|${t.cls}|${t.sex}|${t.stage}`) ?? []).filter((r) => r.min <= t.max && t.min <= r.max);
        const vals = cands.map((r) => inUnit(r, t.unit)).filter((v): v is number => v != null && v > 0);
        if (!vals.length) continue;
        comparable++;
        if (vals.some((v) => eq(v, t.value))) matched++;
        // Ratio against the best-overlapping candidate, for the rescaling test.
        const best = cands.reduce((a, b) => (Math.min(a.max, t.max) - Math.max(a.min, t.min) >= Math.min(b.max, t.max) - Math.max(b.min, t.min) ? a : b));
        const bv = inUnit(best, t.unit);
        if (bv && bv > 0 && t.value > 0) ratios.set(t.compound, [...(ratios.get(t.compound) ?? []), t.value / bv]);
      }
      const scaled: string[] = [];
      for (const [c, rs] of ratios) {
        if (rs.length < 4) continue;
        const mean = rs.reduce((a, b) => a + b, 0) / rs.length;
        const sd = Math.sqrt(rs.reduce((a, b) => a + (b - mean) ** 2, 0) / rs.length);
        if (sd / mean < 0.02 && Math.abs(mean - 1) > 0.02) scaled.push(`${c} ×${mean.toFixed(3)}`);
      }
      const rBands = new Set(R.filter((r) => r.stage === 'NONE').map((r) => r.min));
      const inter = [...tBands].filter((b) => rBands.has(b)).length;
      const bands = inter / new Set([...tBands, ...rBands]).size;
      const u = uniqueHits.get(region);
      results.push({ region, comparable, matched, scaled, bands, unique: u?.size ?? 0, uniqueEx: [...(u ?? [])].slice(0, 6) });
    }
    results.sort((a, b) => b.unique - a.unique || b.matched / (b.comparable || 1) - a.matched / (a.comparable || 1));
    // Distinct (compound, class, value) triples the target holds — the denominator that makes "unique" comparable
    // between a 500-row and a 2,500-row source.
    const distinct = new Set(T.map((t) => `${t.compound}|${t.cls}|${canonVal(t)}`)).size;
    const top = results[0];
    summary.push({ target, distinct, topRoot: top?.region ?? '-', topUnique: top?.unique ?? 0, share: top ? top.unique / distinct : 0, second: results[1]?.unique ?? 0 });
    if (brief) continue;
    console.log(`\n=== ${target} (${T.length} comparable rows)`);
    console.log('source        match            unique-to-root  bands  scaled');
    for (const r of results.slice(0, 8)) {
      const pct = r.comparable ? ((100 * r.matched) / r.comparable).toFixed(0).padStart(3) : '  -';
      console.log(`${(ROOTS.includes(r.region) ? '*' : ' ') + r.region.padEnd(12)} ${pct}% of ${String(r.comparable).padEnd(5)}   ${String(r.unique).padStart(3)}            ${r.bands.toFixed(2)}   ${r.scaled.slice(0, 3).join(', ')}`);
    }
    for (const r of results.filter((x) => x.unique).slice(0, 2)) console.log(`  e.g. unique to ${r.region}: ${r.uniqueEx.join('; ')}`);
  }
  if (summary.length > 1) {
    console.log('\nsource        distinct  strongest root   unique  share   runner-up');
    for (const r of summary.sort((a, b) => b.share - a.share))
      console.log(`${(ROOTS.includes(r.target) ? '*' : ' ') + r.target.padEnd(13)} ${String(r.distinct).padStart(5)}    ${r.topRoot.padEnd(14)} ${String(r.topUnique).padStart(5)}   ${(100 * r.share).toFixed(1).padStart(4)}%   ${r.second}`);
  }
  await sql.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
