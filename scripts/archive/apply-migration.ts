import 'dotenv/config';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

const DATABASE_URL = process.env.DATABASE_URL!;
console.log('Connecting to database...');

async function applyMigration() {
  const sql = postgres(DATABASE_URL, { ssl: 'require' });

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../drizzle/0011_serious_wonder_man.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    // Split by statement breakpoints
    const statements = migrationSql.split('--> statement-breakpoint');

    console.log(`Applying ${statements.length} statements...`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt) {
        try {
          console.log(`Statement ${i + 1}/${statements.length}: ${stmt.substring(0, 60)}...`);
          await sql.unsafe(stmt);
          console.log(`  ✓ Success`);
        } catch (err: any) {
          // Skip "already exists" errors
          if (err.message?.includes('already exists')) {
            console.log(`  ⚠ Skipped (already exists)`);
          } else {
            throw err;
          }
        }
      }
    }

    console.log('\n✅ Migration applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyMigration();
