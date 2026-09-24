import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function main() {
  // AFCD — does F20D4N6 exist? What does AFCD actually use for arachidonic acid?
  console.log('\n=== AFCD ===');
  const afcdCol = await db.execute(sql`SELECT data_type FROM information_schema.columns WHERE table_name = 'source_afcd_nutrients' AND column_name = 'nutrient_index'`);
  console.log('AFCD nutrient_index column type:', (afcdCol as any).rows ?? afcdCol);
  const afcdSearch = await db.execute(sql`SELECT nutrient_index, name, unit FROM source_afcd_nutrients WHERE name ILIKE '%arachidonic%' OR name ILIKE '%20:4%' LIMIT 10`);
  console.log('Search arachidonic/20:4:', (afcdSearch as any).rows ?? afcdSearch);

  // FOODB — does FDB011875 exist? What's the real FooDB ID for arachidonic acid?
  console.log('\n=== FOODB ===');
  const foodbHit = await db.execute(sql`SELECT foodb_id, public_id, name FROM source_foodb_compounds WHERE public_id = 'FDB011875' LIMIT 5`);
  console.log('Lookup public_id=FDB011875:', (foodbHit as any).rows ?? foodbHit);
  const foodbSearch = await db.execute(sql`SELECT foodb_id, public_id, name FROM source_foodb_compounds WHERE name ILIKE '%arachidonic%' LIMIT 10`);
  console.log('Search arachidonic:', (foodbSearch as any).rows ?? foodbSearch);

  // CNF — we don't have a local table, it's API-based. Show what our mapping looks like and whether the live API is consulted at load time.
  console.log('\n=== CNF ===');
  console.log('CNF names are fetched live from the CNF API via one reference food.');
  console.log('If compound ID 855 (arachidonic acid) is not in that reference food, lookup returns N/A.');
  const cnfMap = await db.execute(sql`SELECT cs.external_id, cs.source_name, c.name FROM compound_sources cs JOIN compounds c ON c.id = cs.compound_id WHERE cs.external_source = 'CNF' AND cs.external_id = '855' LIMIT 5`);
  console.log('Our CNF 855 mapping:', (cnfMap as any).rows ?? cnfMap);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
