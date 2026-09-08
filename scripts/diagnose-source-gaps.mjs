#!/usr/bin/env node
/**
 * Why is a compound "promised" by compound_sources but never "seen" on a food?
 *
 * Four very different causes hide behind one number. This separates them:
 *
 *   NO_KEY_MATCH   the mapping's external_id matches no nutrient key in the
 *                  source's own catalogue -> BUG (wrong id, or wrong join column)
 *   NEVER_MEASURED the key resolves, but the source's content table holds zero
 *                  values for it anywhere -> the source declares the nutrient
 *                  and never populates it. Nothing we can do.
 *   NEED_FOODS     the source does publish nonzero values, just not for any food
 *                  we have imported -> import a food that contains it.
 *   ALL_ZERO       the source reports the nutrient for our foods and every value
 *                  is 0. Not a bug: every client filters `value > 0`, so a true
 *                  zero never becomes a merged nutrient. Import a food that
 *                  actually contains the compound.
 *   DROPPED        the source has a NONZERO value for a food we imported, yet no
 *                  merged_nutrient exists -> BUG in the import/merge path.
 *
 * Usage: node scripts/diagnose-source-gaps.mjs [SOURCE]
 */
import postgres from 'postgres';

const url = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
const sql = postgres(url, { max: 1 });
const only = process.argv[2];

// source -> how its staging tables are keyed.
// nutrientKeys: every column a mapping's external_id might legitimately point at.
const CFG = {
  AFCD:            { nut: 'source_afcd_nutrients',            keys: ['nutrient_index'],               content: 'source_afcd_content',            cNut: 'nutrient_index', cFood: 'afcd_food_key' },
  ASEANFOODS:      { nut: 'source_aseanfoods_nutrients',      keys: ['nutrient_code'],                content: 'source_aseanfoods_content',      cNut: 'nutrient_code',  cFood: 'food_id' },
  BLS:             { nut: 'source_bls_nutrients',             keys: ['nutrient_code'],                content: 'source_bls_content',             cNut: 'nutrient_code',  cFood: 'food_code' },
  CIQUAL:          { nut: 'source_ciqual_nutrients',          keys: ['nutrient_code'],                content: 'source_ciqual_content',          cNut: 'nutrient_code',  cFood: 'food_id' },
  UK_COFID:        { nut: 'source_cofid_nutrients',           keys: ['nutrient_code'],                content: 'source_cofid_content',           cNut: 'nutrient_code',  cFood: 'food_code' },
  FINELI:          { nut: 'source_fineli_nutrients',          keys: ['nutrient_code'],                content: 'source_fineli_content',          cNut: 'nutrient_code',  cFood: 'food_id' },
  FOODFILES:       { nut: 'source_foodfiles_nutrients',       keys: ['nutrient_code'],                content: 'source_foodfiles_content',       cNut: 'nutrient_code',  cFood: 'food_id' },
  FRIDA:           { nut: 'source_frida_nutrients',           keys: ['nutrient_id', 'eurofir_code'],  content: 'source_frida_content',           cNut: 'nutrient_id',    cFood: 'food_id' },
  INDB:            { nut: 'source_indb_nutrients',            keys: ['nutrient_code'],                content: 'source_indb_content',            cNut: 'nutrient_code',  cFood: 'food_id' },
  KFCT:            { nut: 'source_kfct_nutrients',            keys: ['nutrient_code'],                content: 'source_kfct_content',            cNut: 'nutrient_code',  cFood: 'food_id' },
  MATVARETABELLEN: { nut: 'source_matvaretabellen_nutrients', keys: ['nutrient_id', 'eurofir_code'],  content: 'source_matvaretabellen_content', cNut: 'nutrient_id',    cFood: 'food_id' },
  MEXT:            { nut: 'source_mext_nutrients',            keys: ['nutrient_code'],                content: 'source_mext_content',            cNut: 'nutrient_code',  cFood: 'food_id' },
  NEVO:            { nut: 'source_nevo_nutrients',            keys: ['nutrient_code'],                content: 'source_nevo_content',            cNut: 'nutrient_code',  cFood: 'food_id' },
};
// FDC and CNF are live APIs with empty staging tables — nothing local to diagnose.

const summary = [];

for (const [src, cfg] of Object.entries(CFG)) {
  if (only && only !== src) continue;

  // The primary key column of the nutrient catalogue, used to reach content.
  const pk = cfg.cNut;
  const pred = cfg.keys.map((k) => `cs.external_id = n.${k}::text`).join(' OR ');

  const gaps = await sql.unsafe(`
    with promised as (
      select cs.compound_id, c.name as compound, cs.external_id
      from compound_sources cs
      join compounds c on c.id = cs.compound_id
      where cs.external_source = '${src}'
    ),
    -- Foods we imported that carry this source, keyed the way staging keys them.
    our_foods as (
      select distinct fs.api_food_id from food_sources fs where fs.api_source = '${src}'
    ),
    seen as (
      select distinct mn.compound_id
      from nutrient_source_values nsv
      join merged_nutrients mn on mn.id = nsv.merged_nutrient_id
      where nsv.api_source = '${src}' and mn.compound_id is not null
    ),
    resolved as (
      select p.compound_id, p.compound, p.external_id, n.${pk}::text as nutrient_key
      from promised p
      left join ${cfg.nut} n on ${cfg.keys.map((k) => `p.external_id = n.${k}::text`).join(' OR ')}
    )
    select
      r.compound,
      r.external_id,
      r.nutrient_key,
      (select count(*) from ${cfg.content} ct
         where ct.${cfg.cNut}::text = r.nutrient_key and ct.value > 0)::int as rows_anywhere,
      (select count(*) from ${cfg.content} ct
         where ct.${cfg.cNut}::text = r.nutrient_key and ct.value > 0
           and ct.${cfg.cFood}::text in (select api_food_id from our_foods))::int as rows_our_foods,
      (select count(*) from ${cfg.content} ct
         where ct.${cfg.cNut}::text = r.nutrient_key and ct.value = 0
           and ct.${cfg.cFood}::text in (select api_food_id from our_foods))::int as zeros_our_foods
    from resolved r
    where r.compound_id not in (select compound_id from seen)
    order by r.compound
  `.replaceAll('${pred}', pred));

  const buckets = { NO_KEY_MATCH: [], NEVER_MEASURED: [], ALL_ZERO: [], NEED_FOODS: [], DROPPED: [] };
  for (const g of gaps) {
    const b = !g.nutrient_key ? 'NO_KEY_MATCH'
      : g.rows_anywhere === 0 && g.zeros_our_foods === 0 ? 'NEVER_MEASURED'
      : g.rows_our_foods > 0 ? 'DROPPED'
      : g.zeros_our_foods > 0 ? 'ALL_ZERO'
      : 'NEED_FOODS';
    buckets[b].push(g);
  }

  summary.push({ src, ...Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length])) });

  console.log(`\n${'='.repeat(70)}\n${src} — ${gaps.length} promised compounds with no value on any food`);
  for (const [name, list] of Object.entries(buckets)) {
    if (!list.length) continue;
    console.log(`\n  ${name} (${list.length})`);
    for (const g of list.slice(0, 12)) {
      const detail = name === 'NO_KEY_MATCH' ? `external_id="${g.external_id}" matches nothing`
        : name === 'NEED_FOODS' ? `${g.rows_anywhere} nonzero values in source, none on our foods`
        : name === 'ALL_ZERO' ? `${g.zeros_our_foods} of our foods report it, all 0`
        : name === 'DROPPED' ? `${g.rows_our_foods} NONZERO values ON OUR FOODS but not merged`
        : 'declared, never populated';
      console.log(`    ${g.compound.padEnd(38)} ${detail}`);
    }
    if (list.length > 12) console.log(`    ... and ${list.length - 12} more`);
  }
}

console.log(`\n${'='.repeat(70)}\nSUMMARY  (BUG columns: NO_KEY_MATCH, DROPPED)\n`);
console.log('source            no_key_match  never_measured  all_zero  need_foods  dropped');
for (const s of summary) {
  console.log(
    `${s.src.padEnd(17)} ${String(s.NO_KEY_MATCH).padStart(12)}  ${String(s.NEVER_MEASURED).padStart(14)}  ` +
    `${String(s.ALL_ZERO).padStart(8)}  ${String(s.NEED_FOODS).padStart(10)}  ${String(s.DROPPED).padStart(7)}`
  );
}

await sql.end();
