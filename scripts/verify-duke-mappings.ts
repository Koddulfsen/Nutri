import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('DUKE MAPPING VERIFICATION - Step 6');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // 1. Total Duke mappings
  const [{ duke_count }] = await sql`
    SELECT COUNT(*) as duke_count FROM external_compound_mappings WHERE external_source = 'duke'
  `;
  console.log('1. Total Duke mappings: ' + duke_count);

  // 2. By match method
  console.log('\n2. By match method:');
  const byMethod = await sql`
    SELECT match_method, COUNT(*) as count
    FROM external_compound_mappings
    WHERE external_source = 'duke'
    GROUP BY match_method
    ORDER BY count DESC
  `;
  for (const row of byMethod) {
    console.log('   ' + row.match_method + ': ' + row.count);
  }

  // 3. Sample mappings
  console.log('\n3. Sample mappings (first 10):');
  const sample = await sql`
    SELECT ecm.external_id, ecm.match_method, c.name as compound_name, c.compound_type
    FROM external_compound_mappings ecm
    JOIN compounds c ON c.id = ecm.compound_id
    WHERE ecm.external_source = 'duke'
    ORDER BY ecm.created_at DESC
    LIMIT 10
  `;
  for (const row of sample) {
    console.log('   ' + row.external_id + ' → ' + row.compound_name + ' (' + row.compound_type + ')');
  }

  // 4. Forms with parents
  console.log('\n4. Forms with parent relationships:');
  const forms = await sql`
    SELECT c.name, c.compound_type, p.name as parent_name
    FROM compounds c
    JOIN compounds p ON p.id = c.parent_compound_id
    WHERE c.description LIKE '%Form of%'
    AND c.description LIKE '%Duke%'
  `;
  for (const row of forms) {
    console.log('   ' + row.name + ' → parent: ' + row.parent_name + ' (' + row.compound_type + ')');
  }

  // 5. Compounds by type (Duke additions)
  console.log('\n5. Duke compounds by type:');
  const byType = await sql`
    SELECT c.compound_type, COUNT(*) as count
    FROM external_compound_mappings ecm
    JOIN compounds c ON c.id = ecm.compound_id
    WHERE ecm.external_source = 'duke'
    GROUP BY c.compound_type
    ORDER BY count DESC
  `;
  for (const row of byType) {
    console.log('   ' + row.compound_type + ': ' + row.count);
  }

  // 6. Total compounds in database
  const [{ total }] = await sql`SELECT COUNT(*) as total FROM compounds`;
  console.log('\n6. Total compounds in database: ' + total);

  // 7. All sources summary
  console.log('\n7. All external source mappings:');
  const sources = await sql`
    SELECT external_source, COUNT(*) as count
    FROM external_compound_mappings
    GROUP BY external_source
    ORDER BY count DESC
  `;
  for (const row of sources) {
    console.log('   ' + row.external_source + ': ' + row.count);
  }

  // 8. High-value Duke compounds
  console.log('\n8. Top health-relevant Duke compounds (by type):');
  const topDuke = await sql`
    SELECT c.name, c.compound_type, c.description
    FROM external_compound_mappings ecm
    JOIN compounds c ON c.id = ecm.compound_id
    WHERE ecm.external_source = 'duke'
    AND ecm.match_method = 'new_compound'
    ORDER BY ecm.created_at
    LIMIT 15
  `;
  for (const row of topDuke) {
    const healthActs = row.description?.match(/(\d+) health activities/)?.[1] || '?';
    console.log('   ' + row.name + ' (' + row.compound_type + ') - ' + healthActs + ' health acts');
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('VERIFICATION COMPLETE ✅');
  console.log('═══════════════════════════════════════════════════════════════════');

  await sql.end();
}

main().catch(console.error);
