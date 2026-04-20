import 'dotenv/config';
import postgres from 'postgres';

/**
 * Migrate Duke mappings from external_compound_mappings to compound_sources
 *
 * This consolidates all source mappings into the compound_sources table,
 * which is the standard table we use for all 17+ sources.
 */

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('MIGRATE DUKE TO COMPOUND_SOURCES');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Check current state
  const [{ ecm_count }] = await sql`
    SELECT COUNT(*) as ecm_count FROM external_compound_mappings
    WHERE external_source = 'duke' AND compound_id IS NOT NULL
  `;
  console.log('Duke mappings in external_compound_mappings: ' + ecm_count);

  const [{ cs_count }] = await sql`
    SELECT COUNT(*) as cs_count FROM compound_sources WHERE external_source = 'DUKE'
  `;
  console.log('Duke mappings in compound_sources: ' + cs_count);

  if (Number(cs_count) > 0) {
    console.log('\nDuke already exists in compound_sources. Skipping migration.');
    await sql.end();
    return;
  }

  // Get Duke mappings from external_compound_mappings
  const dukeMappings = await sql`
    SELECT compound_id, external_id, external_name
    FROM external_compound_mappings
    WHERE external_source = 'duke' AND compound_id IS NOT NULL
  `;

  console.log('\nMigrating ' + dukeMappings.length + ' Duke mappings...\n');

  let inserted = 0;
  let errors = 0;

  for (const mapping of dukeMappings) {
    try {
      await sql`
        INSERT INTO compound_sources (
          compound_id,
          external_source,
          external_id,
          source_name,
          is_canonical
        ) VALUES (
          ${mapping.compound_id},
          'DUKE',
          ${mapping.external_id},
          ${mapping.external_name},
          true
        )
        ON CONFLICT (external_source, external_id) DO NOTHING
      `;
      inserted++;
      if (inserted % 100 === 0) {
        console.log('  Inserted ' + inserted + '...');
      }
    } catch (err) {
      console.log('Error: ' + (err as Error).message);
      errors++;
    }
  }

  console.log('\n--- Migration Complete ---');
  console.log('Inserted: ' + inserted);
  console.log('Errors: ' + errors);

  // Verify
  const [{ new_count }] = await sql`
    SELECT COUNT(*) as new_count FROM compound_sources WHERE external_source = 'DUKE'
  `;
  console.log('\nDuke mappings now in compound_sources: ' + new_count);

  await sql.end();
}

main().catch(console.error);
