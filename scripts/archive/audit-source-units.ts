/**
 * Check every conversion factor against the SOURCE'S OWN catalogue unit.
 *
 * The existing checker (app/api/admin/food-health/conversions/route.ts) compares
 * compound_sources.source_unit against the compound's canonical unit. That only
 * works when source_unit is populated — 314 mappings have none, and those rows
 * were being trusted blind at factor 1.0 (CLAUDE.md §6).
 *
 * A blind 1.0 is not harmless. Apple tryptophan merged to 0.7274 g from nine
 * sources, seven of which agreed on ~0.001 g; FINELI (3.9) and FRIDA (2.586)
 * arrived in milligrams at factor 1.0 and dragged the average ~700x high. The
 * merge in app/api/foods/route.ts sums raw values without consulting units, so
 * a wrong factor is invisible until someone reads the number.
 *
 * But we do not have to guess: source_*_nutrients.unit records what each source
 * actually publishes. This derives the expected factor from that column and
 * reports every mapping whose stored factor disagrees.
 *
 * Verdicts:
 *   ok        stored factor matches the catalogue-derived factor
 *   WRONG     factor disagrees with the catalogue — a real magnitude error
 *   blind     no source_unit stored; catalogue supplies it (factor may still be ok)
 *   basis     catalogue unit is not a mass/energy scale (%T, mg/gN) — never
 *             convertible to a per-100g compound value; the mapping is invalid
 *   unknown   catalogue has no unit, or the unit is unrecognised
 *
 * Read-only. Run: npx tsx scripts/audit-source-units.ts
 */
import 'dotenv/config';
import postgres from 'postgres';
import { parseUnit } from '../lib/food-health/units';

// enum value -> catalogue table + the column(s) an external_id can match
const CATALOGUE: Record<string, { table: string; idCols: string[] }> = {
  AFCD:            { table: 'source_afcd_nutrients',            idCols: ['nutrient_index'] },
  ASEANFOODS:      { table: 'source_aseanfoods_nutrients',      idCols: ['nutrient_code'] },
  BLS:             { table: 'source_bls_nutrients',             idCols: ['nutrient_code'] },
  CIQUAL:          { table: 'source_ciqual_nutrients',          idCols: ['nutrient_code'] },
  UK_COFID:        { table: 'source_cofid_nutrients',           idCols: ['nutrient_code'] },
  FINELI:          { table: 'source_fineli_nutrients',          idCols: ['nutrient_code'] },
  FOODFILES:       { table: 'source_foodfiles_nutrients',       idCols: ['nutrient_code'] },
  FRIDA:           { table: 'source_frida_nutrients',           idCols: ['nutrient_id', 'eurofir_code'] },
  INDB:            { table: 'source_indb_nutrients',            idCols: ['nutrient_code'] },
  KFCT:            { table: 'source_kfct_nutrients',            idCols: ['nutrient_code'] },
  MATVARETABELLEN: { table: 'source_matvaretabellen_nutrients', idCols: ['nutrient_id', 'eurofir_code'] },
  MEXT:            { table: 'source_mext_nutrients',            idCols: ['nutrient_code'] },
  NEVO:            { table: 'source_nevo_nutrients',            idCols: ['nutrient_code'] },
  FDC:             { table: 'source_fdc_nutrients',             idCols: ['nutrient_id'] },
};

// Scales we can convert between, grouped by DIMENSION. Converting across
// dimensions is not a scaling error, it is a category error, so the dimension
// is compared first — kJ -> kcal is a real x0.239 conversion, g -> kcal is not
// a conversion at all.
const SCALE: Record<string, { dim: string; scale: number }> = {
  kg:   { dim: 'mass',   scale: 1e3 },
  g:    { dim: 'mass',   scale: 1 },
  mg:   { dim: 'mass',   scale: 1e-3 },
  'µg': { dim: 'mass',   scale: 1e-6 },
  ng:   { dim: 'mass',   scale: 1e-9 },
  ppm:  { dim: 'mass',   scale: 1e-6 },
  kj:   { dim: 'energy', scale: 1 },
  kcal: { dim: 'energy', scale: 4.184 },
  iu:   { dim: 'iu',     scale: 1 },
  '%':  { dim: 'ratio',  scale: 1 },
};

// Units that express a DIFFERENT QUANTITY, not a scaled one. A mapping carrying
// one of these can never yield a per-100g value.
const BASIS_UNITS = ['%t', 'mg/gn', 'g/gn', '%fa', 'mg/g n'];

/**
 * Catalogue units that are known to be WRONG, so a disagreement with them is not
 * evidence of a bad factor.
 *
 * MEXT's unit rows were parsed out of the Japanese Standard Tables and 44 of 130
 * say 'g' where the source publishes milligrams — beef liver calcium is 5, and
 * the same file still holds leader-dot artifacts like '……g……' in its unit
 * column. Each id below was checked against real staging values AND against
 * scripts/audit-magnitudes.ts, which compares this source to its peers on the
 * same food and flags none of them. Two MEXT rows that the value audit DID flag
 * (VITA_RAE, TOCPHG) were fixed rather than suppressed.
 *
 * Suppression is per-id and deliberate: a blanket "ignore MEXT" would hide the
 * next real error.
 */
const UNRELIABLE_CATALOGUE_UNIT: Record<string, string[]> = {
  MEXT: ['TOCPHB', 'TOCPHD', 'TOCPHG', 'CA', 'CU', 'FE', 'MG', 'MN', 'NIA', 'NE', 'RIBF', 'VITB6A', 'ZN'],
};

const norm = (u: string) =>
  u.trim().toLowerCase().replace(/μ/g, 'µ').replace(/^ug$/, 'µg').replace(/^mcg$/, 'µg');

const url = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (!url) { console.error('Set MIGRATION_DATABASE_URL'); process.exit(1); }
const sql = postgres(url, { max: 1 });

type Row = {
  source: string; compound: string; canonical: string; externalId: string;
  storedUnit: string | null; factor: number;
  catUnit: string | null; verdict: string; expected: number | null; note: string;
};

async function main() {
  const mappings = await sql<{
    external_source: string; external_id: string; source_unit: string | null;
    conversion_factor: string; compound: string; canonical: string;
  }[]>`
    SELECT cs.external_source::text AS external_source, cs.external_id, cs.source_unit,
           cs.conversion_factor, c.name AS compound, c.unit AS canonical
    FROM compound_sources cs JOIN compounds c ON c.id = cs.compound_id
    ORDER BY cs.external_source, c.name`;

  // Load catalogue units once per source.
  const units: Record<string, Map<string, string | null>> = {};
  for (const [src, cfg] of Object.entries(CATALOGUE)) {
    const rows: any[] = await sql.unsafe(
      `SELECT ${cfg.idCols.join(', ')}, unit FROM ${cfg.table}`
    );
    const m = new Map<string, string | null>();
    for (const r of rows) {
      for (const col of cfg.idCols) {
        const v = r[col];
        if (v != null && v !== '' && !m.has(String(v))) m.set(String(v), r.unit);
      }
    }
    units[src] = m;
  }

  const out: Row[] = [];
  for (const m of mappings) {
    const cat = units[m.external_source];
    const factor = parseFloat(m.conversion_factor);
    const base: Row = {
      source: m.external_source, compound: m.compound, canonical: m.canonical,
      externalId: m.external_id, storedUnit: m.source_unit, factor,
      catUnit: null, verdict: 'unknown', expected: null, note: '',
    };

    if (!cat || cat.size === 0) { out.push({ ...base, note: 'no catalogue loaded' }); continue; }
    if (!cat.has(String(m.external_id))) { out.push({ ...base, note: 'id not in catalogue' }); continue; }

    const catUnitRaw = cat.get(String(m.external_id));
    if (!catUnitRaw) { out.push({ ...base, note: 'catalogue has no unit' }); continue; }
    const catUnit = norm(catUnitRaw);

    if (BASIS_UNITS.includes(catUnit)) {
      out.push({ ...base, catUnit, verdict: 'basis', note: `${catUnitRaw} is a different quantity, not a scale` });
      continue;
    }

    const from = SCALE[parseUnit(catUnit).magnitude];
    const to = SCALE[parseUnit(norm(m.canonical)).magnitude];
    if (from === undefined || to === undefined) {
      out.push({ ...base, catUnit, note: `unrecognised: ${catUnitRaw} -> ${m.canonical}` });
      continue;
    }
    if (from.dim !== to.dim) {
      out.push({ ...base, catUnit, verdict: 'basis',
        note: `${catUnitRaw} (${from.dim}) cannot become ${m.canonical} (${to.dim})` });
      continue;
    }

    const expected = from.scale / to.scale;
    const matches = Math.abs(factor - expected) / expected < 0.001;
    if (!matches && UNRELIABLE_CATALOGUE_UNIT[m.external_source]?.includes(String(m.external_id))) {
      out.push({ ...base, catUnit, expected, verdict: 'bad-label',
        note: `catalogue says ${catUnitRaw}, but its values are not; factor x${factor} verified against data` });
      continue;
    }
    out.push({
      ...base, catUnit, expected,
      verdict: matches ? (m.source_unit ? 'ok' : 'blind-ok') : 'WRONG',
      note: matches ? '' : `${catUnitRaw} -> ${m.canonical} needs x${expected}, stored x${factor}`,
    });
  }

  // ---- report ----
  const tally: Record<string, Record<string, number>> = {};
  for (const r of out) ((tally[r.source] ??= {})[r.verdict] ??= 0, tally[r.source][r.verdict]++);

  console.log('\nCONVERSION FACTORS vs SOURCE CATALOGUE UNITS — %d mappings\n', out.length);
  console.log('source              ok  blind-ok   WRONG  bad-label  basis  unknown');
  for (const [src, t] of Object.entries(tally).sort()) {
    console.log('%s %s %s %s %s %s %s',
      src.padEnd(18), String(t.ok ?? 0).padStart(4), String(t['blind-ok'] ?? 0).padStart(9),
      String(t.WRONG ?? 0).padStart(7), String(t['bad-label'] ?? 0).padStart(10),
      String(t.basis ?? 0).padStart(6), String(t.unknown ?? 0).padStart(8));
  }

  for (const v of ['WRONG', 'basis'] as const) {
    const rows = out.filter((r) => r.verdict === v);
    if (!rows.length) continue;
    console.log('\n--- %s (%d) ---\n', v === 'WRONG' ? 'WRONG FACTOR' : 'INVALID BASIS — cannot be a per-100g value', rows.length);
    for (const r of rows) {
      console.log('  %s %s %s  %s', r.source.padEnd(16), r.compound.padEnd(34),
        JSON.stringify(r.externalId).padEnd(18), r.note);
    }
  }

  const wrong = out.filter((r) => r.verdict === 'WRONG');
  const blind = out.filter((r) => r.verdict === 'blind-ok');
  console.log(
    '\n%d wrong factor(s), %d invalid basis, %d blind-but-correct (source_unit missing, factor right), ' +
    '%d suppressed as a known-bad catalogue label\n',
    wrong.length, out.filter((r) => r.verdict === 'basis').length, blind.length,
    out.filter((r) => r.verdict === 'bad-label').length);

  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
