/**
 * Bulk-add everyday foods, through the same pipeline as the admin "Add to
 * NutriDB" modal — never a second implementation of it:
 *
 *   /api/ai/clarify → /api/ai/smart-search → [verify] → POST /api/foods (dry run)
 *   → [drop flagged sources, dry-run again] → /api/ai/synthesize-portions
 *
 * Where the modal has a person pick each source's match, this adds a strict
 * check: one model call per food that, for every source, names the candidate
 * that is the SAME food in the SAME form — or none. Then the dry run's
 * cross-source analysis drops any source that disagrees with the others on
 * many nutrients (almost always a wrong match). A food is accepted only with
 * at least MIN_SOURCES left and no strongly flagged source.
 *
 * Nothing is written in a normal run. It saves a report; `--commit` then
 * imports exactly the accepted foods from that report.
 *
 *   npx tsx scripts/food-import/import-everyday.ts --list pilot --label pilot
 *   npx tsx scripts/food-import/import-everyday.ts --commit results/pilot.json [--only "Almonds"]
 *
 * Needs a dev server with DEV_AUTH_BYPASS=true (the routes are admin-only),
 * BASE_URL default http://localhost:3003. Costs roughly $0.03 per food in
 * Haiku calls (clarify, one ranking per source, verify, portions).
 */
import 'dotenv/config';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { chatCompletion } from '@/lib/ai/anthropic-client';

const here = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3003';

// Alpha excludes DUKE (plant × part), FOODB (deferred) and PHENOL (unmapped) — CLAUDE.md §5.
const EXCLUDED_SOURCES = new Set(['DUKE', 'FOODB', 'PHENOL']);
const MIN_SOURCES = 3;
// A source is dropped when it disagrees with the others on the core values
// that identify a food (energy, water, protein, fat, carbohydrate, alcohol):
//  - grossly on one: 3× off or more, by a real amount (≥ 1 g or 1 kcal) —
//    whole milk matched for semi-skimmed shows fat ×6.5;
//  - or clearly (severity "high", real amount) on two different ones —
//    dry pasta matched for cooked shows water and energy together.
// Micronutrients don't count: across 13 national databases they disagree for
// real reasons (US pasta and bread are fortified), and a correct match can be
// flagged on dozens. Tiny amounts don't count either: 0.1 g vs 0.55 g of fat
// in a cucumber is "×5.5" and means nothing.
// Carbohydrate is shown but not judged: databases define it differently
// ("available" without fibre vs "by difference" with it — almonds read 5 g vs
// 19 g, both correct). Energy off by exactly kJ/kcal (×4.184) is a label mix-up
// in that source (CNF sends kJ as "Energy"; the merge already sets it aside),
// not a wrong food. Judged against the median, so the band is wide (×3.4–5.1);
// that's safe because a genuinely different food — raisins vs grapes is also
// ~4× the energy — disagrees on water too, and water is still checked.
const GROSS_RATIO = 3;
const MIN_REAL_DIFF = 1;
const IDENTITY_COMPOUNDS = new Set(['Energy', 'Water', 'Protein', 'Total Fat', 'Ethanol']);
const isKjMixup = (compound: string, ratio: number) =>
  compound === 'Energy' && ratio >= 3.4 && ratio <= 5.1;

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i > -1 ? args[i + 1] : undefined;
};

// ── HTTP helpers

async function postJson(route: string, body: unknown) {
  const res = await fetch(`${BASE_URL}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${route} → HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

/** POST and read an SSE stream to the end; returns every event. */
async function postSse(route: string, body: unknown): Promise<Array<Record<string, any>>> {
  const res = await fetch(`${BASE_URL}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error(`${route} → HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const events: Array<Record<string, any>> = [];
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const parts = buffer.split('\n\n');
    buffer = done ? '' : parts.pop()!;
    for (const part of parts) {
      const line = part.split('\n').find((l) => l.startsWith('data: '));
      if (line) events.push(JSON.parse(line.slice(6)));
    }
    if (done) break;
  }
  return events;
}

// ── Steps

interface Candidate {
  apiId: string;
  name: string;
  variant?: string;
}

interface SourcePick {
  apiSource: string;
  apiFoodId: string;
  apiFoodVariant?: string;
  apiFoodName: string;
}

const VERIFY_SYSTEM = `You check food-database matches for a nutrition app. You get a target food and, per source database, a few candidate entries. For each source, return the id of the candidate that is the SAME food in the SAME form as the target — or null.

Same form matters because nutrients are per 100 g: raw vs cooked, fresh vs dried, whole vs juice, plain vs sweetened, with vs without skin all change the numbers. If the target states a form, the candidate must match it. If the target doesn't state one, accept the plain, most common form.
A single ingredient never matches a dish or product containing it ("Almonds" ≠ "Almond cake"). A dish matches the same dish.
Names may be in English, French, German, Norwegian, Dutch, Finnish, Japanese romanization etc. — judge the meaning.
When unsure, return null. A missing source is fine; a wrong one corrupts the data.

Return ONLY JSON: {"SOURCE_CODE": "id or null", ...}`;

async function verifyMatches(target: string, metadata: unknown, candidates: Record<string, Candidate[]>) {
  const listing = Object.entries(candidates)
    .map(([source, list]) => `${source}:\n${list.map((c) => `  [${c.apiId}${c.variant ? ` | ${c.variant}` : ''}] ${c.name}`).join('\n')}`)
    .join('\n\n');
  const raw = await chatCompletion(
    VERIFY_SYSTEM,
    [{ role: 'user', content: `Target food: "${target}"\nDetails: ${JSON.stringify(metadata ?? {})}\n\n${listing}` }],
    { maxTokens: 800, label: 'food-import:verify' }
  );
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  const json = start > -1 && end > start ? raw.slice(start, end + 1) : null;
  if (!json) throw new Error(`verify returned no JSON: ${raw.slice(0, 120)}`);
  const parsed = JSON.parse(json) as Record<string, string | null>;
  const picks: SourcePick[] = [];
  for (const [source, id] of Object.entries(parsed)) {
    if (!id) continue;
    const c = candidates[source]?.find((x) => String(x.apiId) === String(id));
    if (c) picks.push({ apiSource: source, apiFoodId: String(c.apiId), apiFoodVariant: c.variant, apiFoodName: c.name });
  }
  return picks;
}

async function dryRun(body: Record<string, unknown>) {
  const events = await postSse('/api/foods', { ...body, dryRun: true });
  const preview = events.find((e) => e.type === 'preview')?.preview;
  if (!preview) {
    const err = events.find((e) => e.type === 'error');
    throw new Error(`dry run gave no preview${err ? `: ${err.detail ?? err.message ?? JSON.stringify(err)}` : ''}`);
  }
  return preview as {
    sources: Array<{ apiSource: string; matchedName: string | null; valueCount: number; flagCount: number; highFlagCount: number }>;
    comparedCompounds: number;
    flaggedCompounds: number;
    totalCompounds: number;
    coreValues: Array<{ compound: string; value: number; unit: string | null }>;
    coreFindings: Array<{ compound: string; median: number; flags: Array<{ source: string; value: number; ratio: number; severity: string }> }>;
  };
}

/** Per source: why it should be dropped, or nothing if it agrees on the basics. */
function coreVerdicts(preview: Awaited<ReturnType<typeof dryRun>>) {
  const gross = new Map<string, string>();
  const high = new Map<string, Set<string>>();
  for (const f of preview.coreFindings ?? []) {
    if (!IDENTITY_COMPOUNDS.has(f.compound)) continue;
    for (const flag of f.flags) {
      if (Math.abs(flag.value - f.median) < MIN_REAL_DIFF) continue;
      if (isKjMixup(f.compound, flag.ratio)) continue;
      const label = `${f.compound} ${flag.value.toFixed(1)} vs ${f.median.toFixed(1)}`;
      if (flag.ratio >= GROSS_RATIO || flag.ratio <= 1 / GROSS_RATIO) gross.set(flag.source, label);
      if (flag.severity === 'high') high.set(flag.source, new Set([...(high.get(flag.source) ?? []), label]));
    }
  }
  const out = new Map<string, string>();
  for (const [source, label] of gross) out.set(source, `grossly off on ${label}`);
  for (const [source, labels] of high) {
    if (!out.has(source) && labels.size >= 2) out.set(source, `off on ${[...labels].join(', ')}`);
  }
  return out;
}

// ── One food

export interface FoodResult {
  query: string;
  status: 'accepted' | 'review' | 'exists' | 'skipped' | 'error';
  reason?: string;
  canonicalName?: string;
  kept?: Array<{ source: string; name: string; values: number; flags: number }>;
  dropped?: Array<{ source: string; name: string; why: string }>;
  unmatched?: string[];
  flaggedCompounds?: number;
  totalCompounds?: number;
  /** Merged per-100 g basics, e.g. { Energy: "157 kcal" }. */
  core?: Record<string, string>;
  portions?: Array<{ description: string; gramWeight: number; isDefault: boolean }>;
  /** Exactly what --commit will POST. */
  body?: Record<string, unknown>;
  ms: number;
}

async function importOne(query: string, existing: Set<string>): Promise<FoodResult> {
  const started = Date.now();
  const done = (r: Omit<FoodResult, 'query' | 'ms'>): FoodResult => ({ query, ...r, ms: Date.now() - started });

  // Clarify sometimes asks ("raw or roasted?"). The names in the list already
  // say what's meant, so take its canonical name and go on.
  const clarify = await postJson('/api/ai/clarify', { query });
  const name: string = clarify.canonicalName || query;
  if (existing.has(name.toLowerCase())) return done({ status: 'exists', canonicalName: name });

  const search = await postSse('/api/ai/smart-search', {
    canonicalName: name,
    searchQuery: clarify.searchQuery,
    searchSynonyms: clarify.searchSynonyms ?? [],
  });
  const complete = search.find((e) => e.type === 'complete');
  if (!complete) return done({ status: 'error', canonicalName: name, reason: 'search did not complete' });

  const candidates: Record<string, Candidate[]> = {};
  for (const [source, r] of Object.entries<any>(complete.results)) {
    if (EXCLUDED_SOURCES.has(source)) continue;
    const pool: Candidate[] = (r.aiTopPicks?.length ? r.aiTopPicks : r.allResults ?? []).slice(0, 6);
    if (pool.length) candidates[source] = pool.map((c: any) => ({ apiId: String(c.apiId), name: c.name, variant: c.variant }));
  }
  if (Object.keys(candidates).length === 0) return done({ status: 'review', canonicalName: name, reason: 'no source had any candidate' });

  let picks = await verifyMatches(name, clarify.metadata, candidates);
  const unmatched = Object.keys(candidates).filter((s) => !picks.some((p) => p.apiSource === s));
  if (picks.length < MIN_SOURCES) {
    return done({ status: 'review', canonicalName: name, unmatched, reason: `only ${picks.length} source(s) matched`, kept: picks.map((p) => ({ source: p.apiSource, name: p.apiFoodName, values: 0, flags: 0 })) });
  }

  const base = {
    name,
    commonNames: clarify.searchSynonyms ?? [],
    ...(clarify.metadata ? { metadata: clarify.metadata } : {}),
    ...(clarify.categoryPath ? { categoryPath: clarify.categoryPath } : {}),
  };

  const dropped: FoodResult['dropped'] = [];
  let preview = await dryRun({ ...base, sources: picks });
  for (let round = 0; round < 2; round++) {
    const verdicts = coreVerdicts(preview);
    const remove = new Set<string>();
    for (const s of preview.sources) {
      const why = s.valueCount === 0 ? 'no values' : verdicts.get(s.apiSource);
      if (why) {
        remove.add(s.apiSource);
        dropped.push({
          source: s.apiSource,
          name: picks.find((p) => p.apiSource === s.apiSource)?.apiFoodName ?? s.matchedName ?? '?',
          why,
        });
      }
    }
    if (remove.size === 0) break;
    picks = picks.filter((p) => !remove.has(p.apiSource));
    if (picks.length < MIN_SOURCES) break;
    preview = await dryRun({ ...base, sources: picks });
  }

  const kept = picks.map((p) => {
    const s = preview.sources.find((x) => x.apiSource === p.apiSource);
    return { source: p.apiSource, name: p.apiFoodName, values: s?.valueCount ?? 0, flags: s?.flagCount ?? 0 };
  });
  const stillBad = coreVerdicts(preview).size > 0;
  if (picks.length < MIN_SOURCES || stillBad) {
    return done({
      status: 'review',
      canonicalName: name,
      reason: picks.length < MIN_SOURCES ? `only ${picks.length} source(s) left after dropping outliers` : 'sources still disagree after two rounds',
      kept,
      dropped,
      unmatched,
      flaggedCompounds: preview.flaggedCompounds,
      totalCompounds: preview.totalCompounds,
    });
  }

  const portions = (await postJson('/api/ai/synthesize-portions', { canonicalName: name, metadata: clarify.metadata })).portions ?? [];

  return done({
    status: 'accepted',
    canonicalName: name,
    kept,
    dropped,
    unmatched,
    flaggedCompounds: preview.flaggedCompounds,
    totalCompounds: preview.totalCompounds,
    core: Object.fromEntries((preview.coreValues ?? []).map((c) => [c.compound, `${+c.value.toFixed(1)} ${c.unit ?? ''}`.trim()])),
    portions,
    body: { ...base, sources: picks, ...(portions.length ? { portions } : {}) },
  });
}

// ── Runs

async function existingNames(): Promise<Set<string>> {
  const sql = postgres(process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL!, { max: 1 });
  const rows = await sql<{ name: string }[]>`SELECT name FROM foods WHERE visibility = 'public'`;
  await sql.end();
  return new Set(rows.map((r) => r.name.toLowerCase()));
}

function printTable(results: FoodResult[]) {
  for (const r of results) {
    const src = r.kept?.map((k) => k.source).join(' ') ?? '';
    console.log(
      `${r.status.padEnd(9)} ${(r.canonicalName ?? r.query).slice(0, 34).padEnd(34)} ${String(r.kept?.length ?? '').padStart(2)} src  ${src}${r.reason ? `  — ${r.reason}` : ''}`
    );
  }
  console.log('\nper 100 g        Energy     Water   Protein       Fat     Carbs   Ethanol');
  for (const r of results.filter((x) => x.core)) {
    const c = r.core!;
    console.log(
      (r.canonicalName ?? r.query).slice(0, 16).padEnd(16),
      ...['Energy', 'Water', 'Protein', 'Total Fat', 'Carbohydrates', 'Ethanol'].map((k) => (c[k] ?? '–').padStart(9))
    );
  }
  const count = (s: string) => results.filter((r) => r.status === s).length;
  console.log(`\naccepted ${count('accepted')} · review ${count('review')} · exists ${count('exists')} · skipped ${count('skipped')} · error ${count('error')}`);
}

async function runLists() {
  const listNames = (flag('--list') ?? 'pilot').split(',');
  const label = flag('--label') ?? listNames.join('+');
  const all = JSON.parse(readFileSync(path.join(here, 'everyday-foods.json'), 'utf8'));
  const queries: string[] = listNames.flatMap((n) => {
    if (!Array.isArray(all[n])) throw new Error(`no list "${n}" in everyday-foods.json`);
    return all[n];
  });

  const existing = await existingNames();
  const results: FoodResult[] = [];
  const out = path.join(here, 'results', `${label}.json`);
  mkdirSync(path.dirname(out), { recursive: true });

  // Two at a time: each search fans out to every source already.
  const queue = [...queries];
  await Promise.all(
    Array.from({ length: 2 }, async () => {
      for (let q = queue.shift(); q; q = queue.shift()) {
        let r: FoodResult;
        try {
          r = await importOne(q, existing);
        } catch (err) {
          r = { query: q, status: 'error', reason: err instanceof Error ? err.message : String(err), ms: 0 };
        }
        results.push(r);
        if (r.status === 'accepted' && r.canonicalName) existing.add(r.canonicalName.toLowerCase());
        process.stderr.write(`  ${r.status.padEnd(9)} ${r.canonicalName ?? q} (${Math.round(r.ms / 1000)}s)\n`);
        // Save as we go, so a crash keeps what was done.
        writeFileSync(out, JSON.stringify({ label, ranAt: new Date().toISOString(), results }, null, 2));
      }
    })
  );
  results.sort((a, b) => queries.indexOf(a.query) - queries.indexOf(b.query));
  writeFileSync(out, JSON.stringify({ label, ranAt: new Date().toISOString(), results }, null, 2));
  printTable(results);
  console.log(`\nSaved ${path.relative(process.cwd(), out)}`);
}

async function commit(file: string) {
  const only = flag('--only');
  const { results } = JSON.parse(readFileSync(path.resolve(here, file), 'utf8')) as { results: FoodResult[] };
  const existing = await existingNames();
  for (const r of results) {
    if (r.status !== 'accepted' || !r.body) continue;
    if (only && r.canonicalName !== only) continue;
    if (existing.has(String(r.body.name).toLowerCase())) {
      console.log(`exists     ${r.body.name}`);
      continue;
    }
    const events = await postSse('/api/foods', r.body);
    const last = events.at(-1) ?? {};
    const ok = last.type === 'complete';
    console.log(`${ok ? 'imported' : 'FAILED  '}   ${r.body.name}${ok ? '' : `  ${JSON.stringify(last).slice(0, 200)}`}`);
  }
}

async function main() {
  const commitFile = flag('--commit');
  if (commitFile) await commit(commitFile);
  else await runLists();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
