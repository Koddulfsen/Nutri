#!/usr/bin/env node
/**
 * Nutrient x source coverage matrix.
 *
 * For every compound we track, how often does each source actually supply a
 * value? The denominator is per source: a source can only cover a food it has
 * a food_sources row for, so coverage is
 *   foods_with_value(compound, source) / foods_where_source_present(source)
 *
 * Usage:
 *   node scripts/nutrient-source-matrix.mjs            # summary to stdout
 *   node scripts/nutrient-source-matrix.mjs --csv out.csv
 */
import postgres from 'postgres';
import { writeFileSync } from 'node:fs';

const url = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (!url) { console.error('Set MIGRATION_DATABASE_URL'); process.exit(1); }

const csvArg = process.argv.indexOf('--csv');
const csvPath = csvArg > -1 ? process.argv[csvArg + 1] : null;

const sql = postgres(url, { max: 1 });

// Sources that are actually attached to at least one food, with their denominator.
const sources = await sql.unsafe(`
  select api_source, count(distinct food_id)::int as foods
  from food_sources group by 1 order by 1
`);

// Compounds that any mapping claims a source can deliver — the expectation.
const expected = await sql.unsafe(`
  select cs.external_source::text as api_source, cs.compound_id
  from compound_sources cs
`);
const expects = new Map();
for (const r of expected) {
  if (!expects.has(r.api_source)) expects.set(r.api_source, new Set());
  expects.get(r.api_source).add(r.compound_id);
}

// Which promised compounds the source's own staging data can actually deliver.
// A mapping that points at a nutrient the source never measured is a data gap;
// a mapping whose key does not join is a BUG. Conflating the two hid the
// Matvaretabellen join defect behind KFCT's (legitimate) 87 missing nutrients.
const STAGING = {
  AFCD: ['source_afcd_nutrients', ['nutrient_index']],
  ASEANFOODS: ['source_aseanfoods_nutrients', ['nutrient_code']],
  BLS: ['source_bls_nutrients', ['nutrient_code']],
  CIQUAL: ['source_ciqual_nutrients', ['nutrient_code']],
  UK_COFID: ['source_cofid_nutrients', ['nutrient_code']],
  FINELI: ['source_fineli_nutrients', ['nutrient_code']],
  FOODFILES: ['source_foodfiles_nutrients', ['nutrient_code']],
  FRIDA: ['source_frida_nutrients', ['nutrient_id', 'eurofir_code']],
  INDB: ['source_indb_nutrients', ['nutrient_code']],
  KFCT: ['source_kfct_nutrients', ['nutrient_code']],
  MATVARETABELLEN: ['source_matvaretabellen_nutrients', ['nutrient_id', 'eurofir_code']],
  MEXT: ['source_mext_nutrients', ['nutrient_code']],
  NEVO: ['source_nevo_nutrients', ['nutrient_code']],
};

// CNF and FDC are live APIs — their staging tables are empty, so there is no
// local catalogue to check a promise against. Absent from STAGING => not scored.
const inStaging = new Map(); // source -> Set(compoundId) the staging tables can key
for (const [src, [table, keys]] of Object.entries(STAGING)) {
  const pred = keys.map((k) => `cs.external_id = n.${k}::text`).join(' OR ');
  const hits = await sql.unsafe(`
    select distinct cs.compound_id
    from ${table} n
    join compound_sources cs
      on cs.external_source = '${src}' and (${pred})
    where cs.compound_id is not null
  `);
  inStaging.set(src, new Set(hits.map((h) => h.compound_id)));
}

// Observed: distinct foods per (compound, source).
const observed = await sql.unsafe(`
  select mn.compound_id, nsv.api_source::text as api_source,
         count(distinct mn.food_id)::int as foods
  from nutrient_source_values nsv
  join merged_nutrients mn on mn.id = nsv.merged_nutrient_id
  where mn.compound_id is not null
  group by 1, 2
`);

const compounds = await sql.unsafe(`
  select c.id, c.name, cg.name as group_name
  from compounds c
  left join compound_groups cg on cg.id = c.group_id
  order by cg.name nulls last, c.name
`);

const obs = new Map(); // compoundId -> source -> foods
for (const r of observed) {
  if (!obs.has(r.compound_id)) obs.set(r.compound_id, new Map());
  obs.get(r.compound_id).set(r.api_source, r.foods);
}

const srcNames = sources.map((s) => s.api_source);
const denom = Object.fromEntries(sources.map((s) => [s.api_source, s.foods]));

const rows = compounds.map((c) => {
  const cells = srcNames.map((s) => {
    const foods = obs.get(c.id)?.get(s) ?? 0;
    const mapped = expects.get(s)?.has(c.id) ?? false;
    return { source: s, foods, pct: denom[s] ? (100 * foods) / denom[s] : 0, mapped };
  });
  return { ...c, cells, sourcesHit: cells.filter((x) => x.foods > 0).length };
});

// ---- terminal summary ----
const covered = rows.filter((r) => r.sourcesHit > 0);
console.log(`\nCompounds: ${rows.length}   with data from >=1 source: ${covered.length}   with none: ${rows.length - covered.length}`);
console.log(`Sources attached to foods: ${srcNames.length}\n`);

console.log('Per-source health (mapped = compounds the mapping table promises):');
console.log('source            foods  compounds_seen  mapped_promised   not_in_source  unreached');
for (const s of sources) {
  const src = s.api_source;
  const promised = expects.get(src) ?? new Set();
  const staged = inStaging.get(src) ?? new Set();
  const seen = rows.filter((r) => (obs.get(r.id)?.get(src) ?? 0) > 0).length;
  // Promised, present in the source's own data, yet never reached a food.
  const broken = STAGING[src]
    ? rows.filter((r) => promised.has(r.id) && staged.has(r.id) && !(obs.get(r.id)?.get(src) > 0)).length
    : rows.filter((r) => promised.has(r.id) && !(obs.get(r.id)?.get(src) > 0)).length;
  // Promised but the source simply never measured it — expected, not a defect.
  const absent = STAGING[src] ? rows.filter((r) => promised.has(r.id) && !staged.has(r.id)).length : null;
  console.log(
    `${src.padEnd(17)} ${String(s.foods).padStart(5)}  ${String(seen).padStart(14)}  ` +
      `${String(promised.size).padStart(15)}  ${String(absent ?? 'live API').padStart(16)}  ${String(broken).padStart(6)}`
  );
}
console.log('\nnot_in_source = mapping points at a nutrient the source never measured (expected).');
console.log('unreached     = the source HAS it and we mapped it, but no food got a value — investigate.');

const dist = new Map();
for (const r of rows) dist.set(r.sourcesHit, (dist.get(r.sourcesHit) ?? 0) + 1);
console.log('\nCompounds by number of sources supplying them:');
for (const n of [...dist.keys()].sort((a, b) => a - b)) {
  console.log(`  ${String(n).padStart(2)} source(s): ${dist.get(n)}`);
}

const single = rows.filter((r) => r.sourcesHit === 1);
if (single.length) {
  console.log(`\nSingle-source compounds (no cross-check possible) — ${single.length}:`);
  for (const r of single) {
    const only = r.cells.find((c) => c.foods > 0);
    console.log(`  ${r.name.padEnd(40)} ${only.source} (${only.foods} foods)`);
  }
}

if (csvPath) {
  const head = ['compound', 'group', 'sources_hit', ...srcNames.flatMap((s) => [`${s}_foods`, `${s}_pct`])];
  const lines = [head.join(',')];
  for (const r of rows) {
    lines.push([
      JSON.stringify(r.name), JSON.stringify(r.group_name ?? ''), r.sourcesHit,
      ...r.cells.flatMap((c) => [c.foods, c.pct.toFixed(1)]),
    ].join(','));
  }
  writeFileSync(csvPath, lines.join('\n'));
  console.log(`\nCSV -> ${csvPath}`);
}

await sql.end();
