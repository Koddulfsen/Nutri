#!/usr/bin/env node
/**
 * Audit every compound_sources.external_id against the source's own nutrient
 * catalogue in staging.
 *
 * A mapping is a CLAIM: "this source publishes this compound under this id."
 * Nothing has ever checked that claim. Three were found wrong by hand
 * (UK_COFID Ethanol -> `Alcohol`, UK_COFID Chloride -> `Chloride (mg)`,
 * ASEANFOODS Carbohydrates -> `CHOCDF`); all three were readable labels
 * mapped where the source uses codes. This sweeps all of them.
 *
 * Verdicts per mapping:
 *   ok          id is in the catalogue and has content rows
 *   empty       id is in the catalogue but no food has a value for it
 *   dead        id is not in the catalogue at all
 *   no-catalog  source has no staging catalogue (live API / unloaded)
 *
 * For every `dead` mapping it also looks for what the id probably should be,
 * by matching the compound name against catalogue nutrient names.
 *
 * Usage: node scripts/audit-mapping-ids.mjs [--csv out.csv]
 */
import postgres from 'postgres';
import { writeFileSync } from 'node:fs';

// enum value -> { table stem, id columns on the nutrients table, id column on content }
const SOURCES = {
  AFCD:            { stem: 'afcd',            idCols: ['nutrient_index'], contentCol: 'nutrient_index' },
  ASEANFOODS:      { stem: 'aseanfoods',      idCols: ['nutrient_code'],  contentCol: 'nutrient_code' },
  BLS:             { stem: 'bls',             idCols: ['nutrient_code'],  contentCol: 'nutrient_code' },
  CIQUAL:          { stem: 'ciqual',          idCols: ['nutrient_code'],  contentCol: 'nutrient_code' },
  UK_COFID:        { stem: 'cofid',           idCols: ['nutrient_code'],  contentCol: 'nutrient_code' },
  FINELI:          { stem: 'fineli',          idCols: ['nutrient_code'],  contentCol: 'nutrient_code' },
  FOODFILES:       { stem: 'foodfiles',       idCols: ['nutrient_code'],  contentCol: 'nutrient_code' },
  FRIDA:           { stem: 'frida',           idCols: ['nutrient_id', 'eurofir_code'], contentCol: 'nutrient_id' },
  INDB:            { stem: 'indb',            idCols: ['nutrient_code'],  contentCol: 'nutrient_code' },
  KFCT:            { stem: 'kfct',            idCols: ['nutrient_code'],  contentCol: 'nutrient_code' },
  MATVARETABELLEN: { stem: 'matvaretabellen', idCols: ['nutrient_id', 'eurofir_code'], contentCol: 'nutrient_id' },
  MEXT:            { stem: 'mext',            idCols: ['nutrient_code'],  contentCol: 'nutrient_code' },
  NEVO:            { stem: 'nevo',            idCols: ['nutrient_code'],  contentCol: 'nutrient_code' },
  // Catalogue but no content table: these two are live APIs, so "empty" cannot
  // be distinguished from "ok" here. Reported as `ok` when the id resolves.
  CNF:             { stem: 'cnf',             idCols: ['nutrient_id'],    contentCol: null },
  FDC:             { stem: 'fdc',             idCols: ['nutrient_id'],    contentCol: null },
};

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function main() {
  const csvArg = process.argv.indexOf('--csv');
  const url = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) { console.error('Set MIGRATION_DATABASE_URL'); process.exit(1); }
  const sql = postgres(url, { max: 1 });

  const mappings = await sql.unsafe(`
    SELECT cs.external_source, cs.external_id, cs.source_unit, cs.conversion_factor,
           c.name AS compound
    FROM compound_sources cs
    JOIN compounds c ON c.id = cs.compound_id
    ORDER BY cs.external_source, c.name
  `);

  // Load each catalogue once, with content row counts.
  const catalogues = {};
  for (const [src, cfg] of Object.entries(SOURCES)) {
    const idExpr = cfg.idCols.map((c) => `n.${c}`);
    const counts = cfg.contentCol
      ? `(SELECT count(*) FROM source_${cfg.stem}_content v WHERE v.${cfg.contentCol} = n.${cfg.idCols[0]})`
      : `NULL`;
    const rows = await sql.unsafe(`
      SELECT ${idExpr.map((e, i) => `${e} AS id${i}`).join(', ')},
             n.name, n.unit, ${counts}::bigint AS rows
      FROM source_${cfg.stem}_nutrients n
    `);
    const byId = new Map();
    const byName = [];
    for (const r of rows) {
      for (let i = 0; i < cfg.idCols.length; i++) {
        const v = r[`id${i}`];
        if (v != null && v !== '') {
          const prev = byId.get(String(v));
          // prefer the entry with content rows if an id appears twice
          if (!prev || (Number(r.rows ?? 0) > Number(prev.rows ?? 0))) {
            byId.set(String(v), { id: String(v), name: r.name, unit: r.unit, rows: r.rows });
          }
        }
      }
      byName.push({ id: String(r.id0), name: r.name, unit: r.unit, rows: r.rows });
    }
    catalogues[src] = { byId, byName, size: rows.length };
  }

  const results = [];
  for (const m of mappings) {
    const cat = catalogues[m.external_source];
    // An empty catalogue table proves nothing about the mapping — CNF's
    // source_cnf_nutrients has 0 rows, which would score all 117 CNF mappings
    // "dead" when the truth is we simply never loaded its catalogue.
    if (!cat || cat.size === 0) {
      results.push({ ...m, verdict: 'no-catalog', rows: null, catName: null, suggest: null });
      continue;
    }
    const hit = cat.byId.get(String(m.external_id));
    if (!hit) {
      // What should it have been? Match compound name against catalogue names.
      const target = norm(m.compound);
      const cand = cat.byName
        .filter((n) => n.rows === null || Number(n.rows) > 0)
        .map((n) => {
          const nn = norm(n.name);
          let score = 0;
          if (nn === target) score = 3;
          else if (nn.startsWith(target) || target.startsWith(nn)) score = 2;
          else if (nn.includes(target) || target.includes(nn)) score = 1;
          return { ...n, score };
        })
        .filter((n) => n.score > 0)
        .sort((a, b) => b.score - a.score || Number(b.rows ?? 0) - Number(a.rows ?? 0))[0];
      results.push({
        ...m, verdict: 'dead', rows: null, catName: null,
        suggest: cand ? `${cand.id} (${cand.name}${cand.rows != null ? `, ${cand.rows} rows` : ''})` : null,
      });
      continue;
    }
    const rows = hit.rows == null ? null : Number(hit.rows);
    results.push({
      ...m,
      verdict: rows === 0 ? 'empty' : 'ok',
      rows, catName: hit.name, suggest: null,
    });
  }

  // ---- report ----
  const bySrc = {};
  for (const r of results) {
    (bySrc[r.external_source] ??= { ok: 0, empty: 0, dead: 0, 'no-catalog': 0 })[r.verdict]++;
  }
  console.log('\nMAPPING ID AUDIT — %d mappings across %d sources\n', results.length, Object.keys(bySrc).length);
  console.log('source              ok  empty   dead  no-catalog');
  for (const [src, c] of Object.entries(bySrc).sort()) {
    console.log(
      '%s %s %s %s %s',
      src.padEnd(18), String(c.ok).padStart(4), String(c.empty).padStart(6),
      String(c.dead).padStart(6), String(c['no-catalog']).padStart(11)
    );
  }

  const dead = results.filter((r) => r.verdict === 'dead');
  if (dead.length) {
    console.log('\n--- DEAD: external_id is not in the source catalogue (%d) ---\n', dead.length);
    for (const d of dead) {
      console.log(
        '%s  %s\n    mapped to: %s%s',
        d.external_source.padEnd(16), d.compound, JSON.stringify(d.external_id),
        d.suggest ? `\n    probably:  ${d.suggest}` : '\n    probably:  (no name match in catalogue — source may not measure it)'
      );
    }
  }

  const empty = results.filter((r) => r.verdict === 'empty');
  if (empty.length) {
    console.log('\n--- EMPTY: id exists but no food has a value (%d) ---\n', empty.length);
    for (const e of empty) {
      console.log('%s  %s %s', e.external_source.padEnd(16), e.compound.padEnd(40), JSON.stringify(e.external_id));
    }
  }

  if (csvArg !== -1) {
    const out = process.argv[csvArg + 1] || 'mapping-audit.csv';
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    writeFileSync(out, [
      'source,compound,external_id,verdict,content_rows,catalogue_name,suggested_id,source_unit,conversion_factor',
      ...results.map((r) => [r.external_source, r.compound, r.external_id, r.verdict, r.rows ?? '', r.catName ?? '', r.suggest ?? '', r.source_unit ?? '', r.conversion_factor].map(esc).join(',')),
    ].join('\n'));
    console.log('\nCSV -> %s', out);
  }

  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
