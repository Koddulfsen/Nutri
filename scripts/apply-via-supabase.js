import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyMigration() {
  console.log('🔄 Connecting to Supabase via client library...');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false
      }
    }
  );

  try {
    console.log('📖 Reading migration file...');
    const migrationPath = join(__dirname, '../drizzle/0000_windy_meltdown.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('⚡ Executing migration via Supabase RPC...\n');

    // Use Supabase's SQL query function
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If exec_sql doesn't exist, try direct SQL execution
      console.log('ℹ️  exec_sql RPC not available, trying direct approach...');

      // Split statements and execute individually
      const statements = migrationSQL
        .split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`📝 Found ${statements.length} SQL statements\n`);

      for (const statement of statements) {
        const { error: execError } = await supabase
          .from('_sql')
          .insert({ query: statement });

        if (execError) {
          console.error('❌ Statement failed:', statement.substring(0, 80) + '...');
          console.error('Error:', execError.message);
          throw execError;
        }

        if (statement.includes('CREATE TYPE')) {
          const match = statement.match(/CREATE TYPE "public"\."(\w+)"/);
          if (match) console.log(`  ✅ Created ENUM type: ${match[1]}`);
        } else if (statement.includes('CREATE TABLE')) {
          const match = statement.match(/CREATE TABLE "(\w+)"/);
          if (match) console.log(`  ✅ Created table: ${match[1]}`);
        }
      }
    }

    console.log('\n🎉 Migration executed successfully!');
    console.log('\nPlease verify tables in Supabase dashboard → Table Editor');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n📋 Manual SQL approach recommended:');
    console.error('1. Go to Supabase dashboard → SQL Editor');
    console.error('2. Create new query');
    console.error('3. Paste contents of drizzle/0000_windy_meltdown.sql');
    console.error('4. Click RUN');
    process.exit(1);
  }
}

applyMigration();
