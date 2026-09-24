import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyMigration() {
  console.log('🔄 Connecting to Supabase...');

  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    ssl: 'require',
    connection: {
      application_name: 'nutri_migration'
    }
  });

  try {
    console.log('📖 Reading migration file...');
    const migrationPath = join(__dirname, '../drizzle/0000_windy_meltdown.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split by statement breakpoint and filter out empty statements
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    console.log('⚡ Executing migration...\n');

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip if it's just a comment
      if (statement.startsWith('--')) continue;

      try {
        await sql.unsafe(statement);

        // Log progress for major operations
        if (statement.includes('CREATE TYPE')) {
          const match = statement.match(/CREATE TYPE "public"\."(\w+)"/);
          if (match) console.log(`  ✅ Created ENUM type: ${match[1]}`);
        } else if (statement.includes('CREATE TABLE')) {
          const match = statement.match(/CREATE TABLE "(\w+)"/);
          if (match) console.log(`  ✅ Created table: ${match[1]}`);
        } else if (statement.includes('CREATE INDEX')) {
          const match = statement.match(/CREATE.*INDEX "(\w+)"/);
          if (match) console.log(`  ✅ Created index: ${match[1]}`);
        } else if (statement.includes('ALTER TABLE')) {
          const match = statement.match(/ALTER TABLE "(\w+)"/);
          if (match) console.log(`  ✅ Added constraint to: ${match[1]}`);
        }
      } catch (error) {
        console.error(`\n❌ Error executing statement ${i + 1}:`);
        console.error(statement.substring(0, 100) + '...');
        console.error(error.message);
        throw error;
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Verifying tables...');

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log(`\n✅ Created ${tables.length} tables:`);
    tables.forEach(t => console.log(`   - ${t.table_name}`));

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyMigration();
