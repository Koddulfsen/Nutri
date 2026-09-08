import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const NUTRIENT_TABLES = [
  { source: 'AFCD', table: 'source_afcd_nutrients' },
  { source: 'CIQUAL', table: 'source_ciqual_nutrients' },
  { source: 'UK_COFID', table: 'source_cofid_nutrients' },
  { source: 'FINELI', table: 'source_fineli_nutrients' },
  { source: 'BLS', table: 'source_bls_nutrients' },
  { source: 'NEVO', table: 'source_nevo_nutrients' },
  { source: 'FRIDA', table: 'source_frida_nutrients' },
  { source: 'MATVARETABELLEN', table: 'source_matvaretabellen_nutrients' },
  { source: 'FOODFILES', table: 'source_foodfiles_nutrients' },
  { source: 'MEXT', table: 'source_mext_nutrients' },
  { source: 'KFCT', table: 'source_kfct_nutrients' },
  { source: 'INDB', table: 'source_indb_nutrients' },
  { source: 'ASEANFOODS', table: 'source_aseanfoods_nutrients' },
];

async function searchSources(pattern: string, label: string) {
  console.log(`\n=== ${label} ===`);
  for (const t of NUTRIENT_TABLES) {
    try {
      const r = await db.execute(sql.raw(`SELECT name FROM ${t.table} WHERE name ~* '${pattern}' LIMIT 5`));
      const rows = ((r as any).rows ?? r) as any[];
      if (rows.length > 0) console.log(`  [${t.source}] ${rows.map(r => `"${r.name}"`).join(', ')}`);
    } catch {}
  }
  // FOODB compounds
  const fb = await db.execute(sql.raw(`SELECT name FROM source_foodb_compounds WHERE name ~* '${pattern}' LIMIT 5`));
  const fbRows = ((fb as any).rows ?? fb) as any[];
  if (fbRows.length > 0) console.log(`  [FOODB] ${fbRows.map(r => `"${r.name}"`).join(', ')}`);
}

async function checkExistingCompound(name: string) {
  const c = await db.execute(sql`SELECT id, tier FROM compounds WHERE name = ${name}`);
  const cid = ((c as any).rows ?? c)[0]?.id;
  if (!cid) { console.log(`  Not in compounds table`); return; }
  const tier = ((c as any).rows ?? c)[0].tier;
  const m = await db.execute(sql`SELECT cs.external_source FROM compound_sources cs WHERE cs.compound_id = ${cid}`);
  const mappings = (((m as any).rows ?? m) as any[]).map(r => r.external_source);
  const f = await db.execute(sql`SELECT COUNT(*)::int as n, MAX(average_value::numeric)::float as max FROM merged_nutrients WHERE compound_id = ${cid} AND average_value::numeric > 0`);
  const stats = ((f as any).rows ?? f)[0];
  console.log(`  In compounds (tier=${tier}): ${mappings.length} mappings (${mappings.join(',')}), ${stats.n} foods with values (max=${stats.max})`);
}

async function main() {
  for (const [name, pattern] of [
    ['Taurine', '^taurine$|taurin'],
    ['Hydroxyproline', 'hydroxyproline|hyp'],
    ['Carnitine', '^carnitine$|carnitine|^l-carnitine'],
    ['Beta-Alanine', 'beta.?alanine|β.?alanine'],
  ]) {
    console.log(`\n###### ${name} ######`);
    await checkExistingCompound(name);
    await searchSources(pattern, `Source nutrient catalogs matching /${pattern}/`);
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
