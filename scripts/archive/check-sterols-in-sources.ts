/**
 * Check which of our 18 source staging tables have sterol nutrients/compounds
 * (beyond Cholesterol which we already have).
 */
import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const STEROL_PATTERN = '%sterol%|%sitosterol%|%campesterol%|%stigmasterol%|%ergosterol%|%phytosterol%';

const NUTRIENT_TABLES = [
  { source: 'AFCD', table: 'source_afcd_nutrients', idCol: 'nutrient_index' },
  { source: 'CIQUAL', table: 'source_ciqual_nutrients', idCol: 'nutrient_code' },
  { source: 'UK_COFID', table: 'source_cofid_nutrients', idCol: 'nutrient_code' },
  { source: 'FINELI', table: 'source_fineli_nutrients', idCol: 'nutrient_code' },
  { source: 'BLS', table: 'source_bls_nutrients', idCol: 'nutrient_code' },
  { source: 'NEVO', table: 'source_nevo_nutrients', idCol: 'nutrient_code' },
  { source: 'FRIDA', table: 'source_frida_nutrients', idCol: 'eurofir_code' },
  { source: 'MATVARETABELLEN', table: 'source_matvaretabellen_nutrients', idCol: 'eurofir_code' },
  { source: 'FOODFILES', table: 'source_foodfiles_nutrients', idCol: 'nutrient_code' },
  { source: 'MEXT', table: 'source_mext_nutrients', idCol: 'nutrient_code' },
  { source: 'KFCT', table: 'source_kfct_nutrients', idCol: 'nutrient_code' },
  { source: 'INDB', table: 'source_indb_nutrients', idCol: 'nutrient_code' },
  { source: 'ASEANFOODS', table: 'source_aseanfoods_nutrients', idCol: 'nutrient_code' },
];

async function main() {
  console.log('Searching staging nutrient tables for sterols...\n');

  for (const t of NUTRIENT_TABLES) {
    try {
      const r = await db.execute(sql.raw(`
        SELECT ${t.idCol}::text as id, name, unit
        FROM ${t.table}
        WHERE name ~* '(sterol|sitosterol|campesterol|stigmasterol|ergosterol|phytosterol)'
          AND name !~* 'cholesterol'
        ORDER BY name
        LIMIT 20
      `));
      const rows = ((r as any).rows ?? r) as any[];
      if (rows.length === 0) {
        console.log(`[${t.source}] no sterol entries (other than cholesterol)`);
      } else {
        console.log(`[${t.source}] ${rows.length} sterol entries:`);
        for (const row of rows) console.log(`  id=${row.id}  name="${row.name}"  unit=${row.unit ?? '-'}`);
      }
    } catch (e: any) {
      console.log(`[${t.source}] ERROR: ${e.message}`);
    }
  }

  // FOODB has compounds table with chemical names
  console.log('\n[FOODB] searching source_foodb_compounds...');
  const foodb = await db.execute(sql`
    SELECT public_id, name FROM source_foodb_compounds
    WHERE name ~* '(sterol|sitosterol|campesterol|stigmasterol|ergosterol|phytosterol)'
      AND name !~* 'cholesterol'
    ORDER BY name
    LIMIT 25
  `);
  const foodbRows = ((foodb as any).rows ?? foodb) as any[];
  console.log(`  ${foodbRows.length} entries:`);
  for (const r of foodbRows) console.log(`    ${r.public_id}  ${r.name}`);

  // FDC nutrients csv has Phytosterols + Beta-Sitosterol + Campesterol + Stigmasterol
  console.log('\n[FDC] (from docs/fdc-nutrients.csv if loaded — known IDs:');
  console.log('  612 Phytosterols, 638 Beta-sitosterol, 639 Campesterol, 640 Stigmasterol');
  console.log('  But FDC API may not return values for these (per FLAGGED_MAPPINGS history)');

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
