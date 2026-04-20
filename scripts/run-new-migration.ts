import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  const migrationPath = '/home/kodd/Nutri/drizzle/0014_icy_stephen_strange.sql';
  const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

  // Split by statement breakpoint and run each statement
  const statements = migrationSql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s);

  console.log(`Running ${statements.length} statements...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 80).replace(/\n/g, ' ');
    console.log(`[${i + 1}/${statements.length}] ${preview}...`);

    try {
      await sql.unsafe(stmt);
      console.log(`  ✅ Done`);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log(`  ⚠️  Skipped (already exists)`);
      } else {
        console.error(`  ❌ Error: ${error.message}`);
      }
    }
  }

  await sql.end();
  console.log('\nMigration complete!');
}

main().catch(console.error);
