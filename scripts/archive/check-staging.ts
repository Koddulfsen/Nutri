import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  // Get all source_ tables
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name LIKE 'source_%'
    ORDER BY table_name
  `;

  console.log('Staging tables:\n');
  for (const t of tables) {
    const count = await sql.unsafe(`SELECT COUNT(*) as cnt FROM "${t.table_name}"`);
    console.log(`  ${t.table_name}: ${count[0].cnt} rows`);
  }

  // Check for any other tables that might be staging for the 12 remaining sources
  const allTables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND (
      table_name LIKE '%cofid%' OR table_name LIKE '%ciqual%' OR
      table_name LIKE '%bls%' OR table_name LIKE '%frida%' OR
      table_name LIKE '%fineli%' OR table_name LIKE '%nevo%' OR
      table_name LIKE '%matvaretabellen%' OR table_name LIKE '%foodfiles%' OR
      table_name LIKE '%mext%' OR table_name LIKE '%kfct%' OR
      table_name LIKE '%indb%' OR table_name LIKE '%asean%' OR
      table_name LIKE '%uk_%' OR table_name LIKE '%japan%' OR
      table_name LIKE '%korea%' OR table_name LIKE '%india%' OR
      table_name LIKE '%sweden%' OR table_name LIKE '%norway%'
    )
    ORDER BY table_name
  `;

  if (allTables.length > 0) {
    console.log('\nOther source-related tables:');
    for (const t of allTables) {
      const count = await sql.unsafe(`SELECT COUNT(*) as cnt FROM "${t.table_name}"`);
      console.log(`  ${t.table_name}: ${count[0].cnt} rows`);
    }
  } else {
    console.log('\nNo staging tables found for the 12 remaining sources.');
  }

  // Also check the data/ directory for available source files
  console.log('\nChecking data/ directory for source files...');

  await sql.end();
}

main();
