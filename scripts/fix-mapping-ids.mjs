#!/usr/bin/env node
/**
 * Apply the findings of scripts/audit-mapping-ids.mjs.
 *
 * Two kinds of change, both derived from checking every external_id against the
 * source's own staging catalogue:
 *
 *   DELETE — the id matches nothing in the catalogue AND the same compound is
 *            already mapped to a working id. These are label-style leftovers
 *            ("Calcium (mg)" where COFID uses "CA"), dead weight that inflates
 *            the "promised" column of the coverage matrix.
 *   REMAP  — the id is wrong and the right one is known and carries data.
 *
 * Idempotent: a second run reports 0 changes. --dry-run prints without writing.
 * Every row is re-verified against the catalogue at run time; nothing is applied
 * on the strength of this file's say-so alone.
 *
 * Usage:
 *   node scripts/fix-mapping-ids.mjs --dry-run
 *   node scripts/fix-mapping-ids.mjs
 */
import 'dotenv/config';
import postgres from 'postgres';

const DRY = process.argv.includes('--dry-run');

// Remaps: verified individually against the source catalogue.
const REMAPS = [
  // FDC 346 is not a nutrient id; gamma-tocotrienol is 1130 ("Tocotrienol, gamma").
  // Sibling isomers already map correctly (alpha 1128, beta 1129, delta 1131).
  { source: 'FDC', compound: 'Gamma-Tocotrienol', from: '346', to: '1130' },
  // Adrenic acid is 22:4 n-6; FDC publishes it as 1411 "PUFA 22:4". 858 matches nothing.
  { source: 'FDC', compound: 'Adrenic Acid', from: '858', to: '1411' },
  // ASEANFOODS declares CHOCDF (total carbohydrate) but populates zero rows for
  // it; the carbohydrate it actually publishes is CHOAVLDF (available), 511 rows.
  { source: 'ASEANFOODS', compound: 'Carbohydrates', from: 'CHOCDF', to: 'CHOAVLDF' },
];

// Deletes that are NOT covered by the "dead + a live sibling exists" rule below,
// because the source genuinely does not publish the compound at all.
const DELETES = [
  // FINELI publishes VITK (total, 4140 rows) but no K2 breakdown.
  { source: 'FINELI', compound: 'Vitamin K2 (Total)', id: 'VITK2' },
  // Matvaretabellen's catalogue has no chloride entry under any code.
  { source: 'MATVARETABELLEN', compound: 'Chloride', id: 'Cl' },
];

// Sources whose dead-duplicate leftovers are swept automatically. Restricted on
// purpose: KFCT's 88 dead mappings are a different problem (the source really
// does not publish them) and are left alone until that is decided separately.
const SWEEP_DUPES = ['UK_COFID'];

const CATALOGUE = {
  UK_COFID: { table: 'source_cofid_nutrients', idCols: ['nutrient_code'] },
  FDC: { table: 'source_fdc_nutrients', idCols: ['nutrient_id'] },
  ASEANFOODS: { table: 'source_aseanfoods_nutrients', idCols: ['nutrient_code'] },
  FINELI: { table: 'source_fineli_nutrients', idCols: ['nutrient_code'] },
  MATVARETABELLEN: { table: 'source_matvaretabellen_nutrients', idCols: ['nutrient_id', 'eurofir_code'] },
};

const url = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (!url) { console.error('Set MIGRATION_DATABASE_URL'); process.exit(1); }
const sql = postgres(url, { max: 1 });

async function inCatalogue(source, id) {
  const c = CATALOGUE[source];
  if (!c) return false;
  const where = c.idCols.map((col) => `${col} = $1`).join(' OR ');
  const rows = await sql.unsafe(`SELECT 1 FROM ${c.table} WHERE ${where} LIMIT 1`, [id]);
  return rows.length > 0;
}

let changed = 0, skipped = 0;

// ---- 1. Remaps -------------------------------------------------------------
console.log('\n== REMAP ==');
for (const r of REMAPS) {
  const [row] = await sql`
    SELECT cs.id FROM compound_sources cs JOIN compounds c ON c.id = cs.compound_id
    WHERE cs.external_source::text = ${r.source}
      AND c.name = ${r.compound} AND cs.external_id = ${r.from}`;
  if (!row) { console.log('  skip  %s %s — already remapped or absent', r.source, r.compound); skipped++; continue; }
  if (!(await inCatalogue(r.source, r.to))) {
    console.log('  ABORT %s %s — target %s is not in the catalogue', r.source, r.compound, r.to);
    skipped++; continue;
  }
  console.log('  %s  %s %s: %s -> %s', DRY ? 'would' : 'apply', r.source, r.compound, r.from, r.to);
  if (!DRY) await sql`UPDATE compound_sources SET external_id = ${r.to} WHERE id = ${row.id}`;
  changed++;
}

// ---- 2. Explicit deletes ---------------------------------------------------
console.log('\n== DELETE (source does not publish it) ==');
for (const d of DELETES) {
  const [row] = await sql`
    SELECT cs.id FROM compound_sources cs JOIN compounds c ON c.id = cs.compound_id
    WHERE cs.external_source::text = ${d.source}
      AND c.name = ${d.compound} AND cs.external_id = ${d.id}`;
  if (!row) { console.log('  skip  %s %s — already gone', d.source, d.compound); skipped++; continue; }
  if (await inCatalogue(d.source, d.id)) {
    console.log('  ABORT %s %s — %s IS in the catalogue; refusing to delete', d.source, d.compound, d.id);
    skipped++; continue;
  }
  console.log('  %s  %s %s (%s)', DRY ? 'would' : 'apply', d.source, d.compound, d.id);
  if (!DRY) await sql`DELETE FROM compound_sources WHERE id = ${row.id}`;
  changed++;
}

// ---- 3. Sweep dead duplicates ----------------------------------------------
console.log('\n== DELETE (dead duplicate — same compound already mapped to a live id) ==');
for (const source of SWEEP_DUPES) {
  const c = CATALOGUE[source];
  const cat = new Set(
    (await sql.unsafe(`SELECT ${c.idCols.join(', ')} FROM ${c.table}`))
      .flatMap((r) => c.idCols.map((col) => r[col]).filter((v) => v != null && v !== ''))
      .map(String)
  );
  const rows = await sql`
    SELECT cs.id, cs.external_id, c.name AS compound
    FROM compound_sources cs JOIN compounds c ON c.id = cs.compound_id
    WHERE cs.external_source::text = ${source}
    ORDER BY c.name`;
  const live = new Map();
  for (const r of rows) if (cat.has(String(r.external_id))) {
    if (!live.has(r.compound)) live.set(r.compound, []);
    live.get(r.compound).push(r.external_id);
  }
  for (const r of rows) {
    if (cat.has(String(r.external_id))) continue;
    const peers = live.get(r.compound);
    if (!peers?.length) {
      console.log('  keep  %s %s (%s) — dead but nothing else covers it', source, r.compound, r.external_id);
      skipped++; continue;
    }
    console.log('  %s  %s %s %s (live: %s)', DRY ? 'would' : 'apply', source, r.compound.padEnd(30), JSON.stringify(r.external_id).padEnd(24), peers.join(', '));
    if (!DRY) await sql`DELETE FROM compound_sources WHERE id = ${r.id}`;
    changed++;
  }
}

console.log('\n%s: %d change%s, %d skipped\n', DRY ? 'DRY RUN' : 'APPLIED', changed, changed === 1 ? '' : 's', skipped);
await sql.end();
