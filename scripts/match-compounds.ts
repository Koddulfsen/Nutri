import 'dotenv/config';
import postgres from 'postgres';

const SIMILARITY_THRESHOLD = 0.7;

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  console.log('🔗 Starting compound matching (batch mode)...\n');

  // Get count of internal compounds
  const [{ count: nutriCount }] = await sql`SELECT COUNT(*) as count FROM compounds`;
  console.log(`Found ${nutriCount} internal Nutri compounds\n`);

  // ============================================================
  // MATCH FOODB COMPOUNDS (batch)
  // ============================================================
  console.log('📦 Matching FooDB compounds...');

  // 1. Insert all unmatched as pending first
  const [{ count: foodbInserted }] = await sql`
    INSERT INTO external_compound_mappings (external_source, external_id, external_name, match_status)
    SELECT 'foodb', foodb_id::text, name, 'pending'
    FROM source_foodb_compounds
    WHERE NOT EXISTS (
      SELECT 1 FROM external_compound_mappings ecm
      WHERE ecm.external_source = 'foodb' AND ecm.external_id = source_foodb_compounds.foodb_id::text
    )
    ON CONFLICT (external_source, external_id) DO NOTHING
    RETURNING 1
  `;
  console.log(`   Inserted ${foodbInserted || 0} pending mappings`);

  // 2. Exact name matches
  const [{ count: foodbExact }] = await sql`
    UPDATE external_compound_mappings ecm
    SET compound_id = c.id,
        match_status = 'auto_matched',
        match_method = 'exact_name',
        match_confidence = 1.0,
        matched_at = NOW()
    FROM compounds c
    WHERE ecm.external_source = 'foodb'
      AND ecm.match_status = 'pending'
      AND LOWER(ecm.external_name) = LOWER(c.name)
    RETURNING 1
  `;
  console.log(`   Exact name matches: ${foodbExact || 0}`);

  // 3. Alternate name matches
  const [{ count: foodbAlt }] = await sql`
    UPDATE external_compound_mappings ecm
    SET compound_id = c.id,
        match_status = 'auto_matched',
        match_method = 'alternate_name',
        match_confidence = 1.0,
        matched_at = NOW()
    FROM compounds c
    WHERE ecm.external_source = 'foodb'
      AND ecm.match_status = 'pending'
      AND LOWER(ecm.external_name) = ANY(SELECT LOWER(unnest(c.alternate_names)))
    RETURNING 1
  `;
  console.log(`   Alternate name matches: ${foodbAlt || 0}`);

  // 4. Fuzzy matches (for remaining)
  const [{ count: foodbFuzzy }] = await sql`
    WITH fuzzy_matches AS (
      SELECT DISTINCT ON (ecm.id)
        ecm.id as mapping_id,
        c.id as compound_id,
        similarity(ecm.external_name, c.name) as sim
      FROM external_compound_mappings ecm
      JOIN compounds c ON similarity(ecm.external_name, c.name) > ${SIMILARITY_THRESHOLD}
      WHERE ecm.external_source = 'foodb'
        AND ecm.match_status = 'pending'
      ORDER BY ecm.id, sim DESC
    )
    UPDATE external_compound_mappings ecm
    SET compound_id = fm.compound_id,
        match_status = 'auto_matched',
        match_method = 'fuzzy_name',
        match_confidence = fm.sim,
        matched_at = NOW()
    FROM fuzzy_matches fm
    WHERE ecm.id = fm.mapping_id
    RETURNING 1
  `;
  console.log(`   Fuzzy matches: ${foodbFuzzy || 0}`);

  const [foodbStats] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE match_status = 'auto_matched') as matched,
      COUNT(*) FILTER (WHERE match_status = 'pending') as pending
    FROM external_compound_mappings
    WHERE external_source = 'foodb'
  `;
  console.log(`   ✅ Total matched: ${foodbStats.matched}, Pending: ${foodbStats.pending}\n`);

  // ============================================================
  // MATCH PHENOL-EXPLORER COMPOUNDS (batch)
  // ============================================================
  console.log('🍇 Matching Phenol-Explorer compounds...');

  // 1. Insert pending
  await sql`
    INSERT INTO external_compound_mappings (external_source, external_id, external_name, match_status)
    SELECT 'phenol_explorer', phenol_id::text, name, 'pending'
    FROM source_phenol_compounds
    WHERE NOT EXISTS (
      SELECT 1 FROM external_compound_mappings ecm
      WHERE ecm.external_source = 'phenol_explorer' AND ecm.external_id = source_phenol_compounds.phenol_id::text
    )
    ON CONFLICT (external_source, external_id) DO NOTHING
  `;

  // 2. Exact matches
  const [{ count: phenolExact }] = await sql`
    UPDATE external_compound_mappings ecm
    SET compound_id = c.id,
        match_status = 'auto_matched',
        match_method = 'exact_name',
        match_confidence = 1.0,
        matched_at = NOW()
    FROM compounds c
    WHERE ecm.external_source = 'phenol_explorer'
      AND ecm.match_status = 'pending'
      AND LOWER(ecm.external_name) = LOWER(c.name)
    RETURNING 1
  `;
  console.log(`   Exact name matches: ${phenolExact || 0}`);

  // 3. Alternate name matches
  const [{ count: phenolAlt }] = await sql`
    UPDATE external_compound_mappings ecm
    SET compound_id = c.id,
        match_status = 'auto_matched',
        match_method = 'alternate_name',
        match_confidence = 1.0,
        matched_at = NOW()
    FROM compounds c
    WHERE ecm.external_source = 'phenol_explorer'
      AND ecm.match_status = 'pending'
      AND LOWER(ecm.external_name) = ANY(SELECT LOWER(unnest(c.alternate_names)))
    RETURNING 1
  `;
  console.log(`   Alternate name matches: ${phenolAlt || 0}`);

  // 4. Fuzzy matches
  const [{ count: phenolFuzzy }] = await sql`
    WITH fuzzy_matches AS (
      SELECT DISTINCT ON (ecm.id)
        ecm.id as mapping_id,
        c.id as compound_id,
        similarity(ecm.external_name, c.name) as sim
      FROM external_compound_mappings ecm
      JOIN compounds c ON similarity(ecm.external_name, c.name) > ${SIMILARITY_THRESHOLD}
      WHERE ecm.external_source = 'phenol_explorer'
        AND ecm.match_status = 'pending'
      ORDER BY ecm.id, sim DESC
    )
    UPDATE external_compound_mappings ecm
    SET compound_id = fm.compound_id,
        match_status = 'auto_matched',
        match_method = 'fuzzy_name',
        match_confidence = fm.sim,
        matched_at = NOW()
    FROM fuzzy_matches fm
    WHERE ecm.id = fm.mapping_id
    RETURNING 1
  `;
  console.log(`   Fuzzy matches: ${phenolFuzzy || 0}`);

  const [phenolStats] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE match_status = 'auto_matched') as matched,
      COUNT(*) FILTER (WHERE match_status = 'pending') as pending
    FROM external_compound_mappings
    WHERE external_source = 'phenol_explorer'
  `;
  console.log(`   ✅ Total matched: ${phenolStats.matched}, Pending: ${phenolStats.pending}\n`);

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('═══════════════════════════════════════');
  console.log('📊 MATCHING SUMMARY');
  console.log('═══════════════════════════════════════');

  const [totals] = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE match_status = 'auto_matched') as matched,
      COUNT(*) FILTER (WHERE match_status = 'pending') as pending
    FROM external_compound_mappings
  `;
  console.log(`Total mappings: ${totals.total}`);
  console.log(`Matched: ${totals.matched}`);
  console.log(`Pending: ${totals.pending}`);
  console.log(`Match rate: ${((Number(totals.matched) / Number(totals.total)) * 100).toFixed(2)}%`);

  // By method
  const methods = await sql`
    SELECT match_method, COUNT(*) as count
    FROM external_compound_mappings
    WHERE match_status = 'auto_matched'
    GROUP BY match_method
    ORDER BY count DESC
  `;
  console.log('\nBy Method:');
  for (const m of methods) {
    console.log(`  ${m.match_method}: ${m.count}`);
  }

  // Sample matches
  console.log('\n📋 Sample Matches:');
  const samples = await sql`
    SELECT ecm.external_source, ecm.external_name, c.name as matched_to,
           ecm.match_method, ROUND(ecm.match_confidence::numeric, 2) as confidence
    FROM external_compound_mappings ecm
    JOIN compounds c ON c.id = ecm.compound_id
    WHERE ecm.match_status = 'auto_matched'
    LIMIT 10
  `;
  for (const s of samples) {
    console.log(`  [${s.external_source}] "${s.external_name}" → "${s.matched_to}" (${s.match_method})`);
  }

  await sql.end();
}

main().catch(console.error);
