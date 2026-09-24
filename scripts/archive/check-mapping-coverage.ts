import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('SOURCE MAPPING COVERAGE CHECK');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Check external_compound_mappings (enrichment sources)
  console.log('1. EXTERNAL COMPOUND MAPPINGS (enrichment sources):');
  const extMappings = await sql`
    SELECT external_source, COUNT(*) as count
    FROM external_compound_mappings
    GROUP BY external_source
    ORDER BY count DESC
  `;
  for (const row of extMappings) {
    console.log('   ' + row.external_source + ': ' + row.count + ' mappings');
  }

  // Check compound_sources (food composition sources)
  console.log('\n2. COMPOUND SOURCES (food composition sources):');
  const compSources = await sql`
    SELECT external_source, COUNT(*) as count
    FROM compound_sources
    GROUP BY external_source
    ORDER BY count DESC
  `;
  for (const row of compSources) {
    console.log('   ' + row.external_source + ': ' + row.count + ' mappings');
  }

  // For each enrichment source, check how many map to "new" vs "existing" compounds
  console.log('\n3. ENRICHMENT SOURCE COVERAGE (new vs existing compounds):');

  // FooDB
  const foodbAnalysis = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE c.description LIKE '%FooDB%') as likely_new,
      COUNT(*) FILTER (WHERE c.description NOT LIKE '%FooDB%' OR c.description IS NULL) as likely_existing
    FROM external_compound_mappings ecm
    JOIN compounds c ON c.id = ecm.compound_id
    WHERE ecm.external_source = 'foodb'
  `;
  console.log('\n   FooDB:');
  console.log('     Total mappings: ' + foodbAnalysis[0].total);
  console.log('     Maps to FooDB-added compounds: ' + foodbAnalysis[0].likely_new);
  console.log('     Maps to pre-existing compounds: ' + foodbAnalysis[0].likely_existing);

  // Phenol-Explorer
  const phenolAnalysis = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE c.description LIKE '%Phenol%') as likely_new,
      COUNT(*) FILTER (WHERE c.description NOT LIKE '%Phenol%' OR c.description IS NULL) as likely_existing
    FROM external_compound_mappings ecm
    JOIN compounds c ON c.id = ecm.compound_id
    WHERE ecm.external_source = 'phenol_explorer'
  `;
  console.log('\n   Phenol-Explorer:');
  console.log('     Total mappings: ' + phenolAnalysis[0].total);
  console.log('     Maps to Phenol-added compounds: ' + phenolAnalysis[0].likely_new);
  console.log('     Maps to pre-existing compounds: ' + phenolAnalysis[0].likely_existing);

  // Duke
  const dukeAnalysis = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE c.description LIKE '%Duke%') as likely_new,
      COUNT(*) FILTER (WHERE c.description NOT LIKE '%Duke%' OR c.description IS NULL) as likely_existing
    FROM external_compound_mappings ecm
    JOIN compounds c ON c.id = ecm.compound_id
    WHERE ecm.external_source = 'duke'
  `;
  console.log('\n   Duke:');
  console.log('     Total mappings: ' + dukeAnalysis[0].total);
  console.log('     Maps to Duke-added compounds: ' + dukeAnalysis[0].likely_new);
  console.log('     Maps to pre-existing compounds: ' + dukeAnalysis[0].likely_existing);

  // Check compound_sources for FDC, CNF, etc.
  console.log('\n4. FOOD COMPOSITION SOURCES (compound_sources table):');

  const sourcesList = ['FDC', 'CNF', 'AFCD', 'COFID', 'CIQUAL'];
  for (const source of sourcesList) {
    const analysis = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(DISTINCT compound_id) as unique_compounds
      FROM compound_sources
      WHERE external_source = ${source}
    `;
    if (Number(analysis[0].total) > 0) {
      console.log(`\n   ${source}:`);
      console.log('     Total mappings: ' + analysis[0].total);
      console.log('     Unique compounds: ' + analysis[0].unique_compounds);
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const [{ total_compounds }] = await sql`SELECT COUNT(*) as total_compounds FROM compounds`;
  const [{ ext_mappings }] = await sql`SELECT COUNT(*) as ext_mappings FROM external_compound_mappings`;
  const [{ comp_sources }] = await sql`SELECT COUNT(*) as comp_sources FROM compound_sources`;

  console.log('Total compounds in database: ' + total_compounds);
  console.log('Total external_compound_mappings: ' + ext_mappings);
  console.log('Total compound_sources: ' + comp_sources);

  await sql.end();
}

main().catch(console.error);
