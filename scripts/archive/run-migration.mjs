#!/usr/bin/env node
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Manually load .env file
console.log('🔄 Loading .env file...');
const envPath = join(projectRoot, '.env');
const envContent = readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2];
  }
});

console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Loaded' : '❌ Missing');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

async function runMigration() {
  console.log('\n🔄 Connecting to Supabase PostgreSQL...');

  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    ssl: { rejectUnauthorized: false },
    connection: {
      application_name: 'nutri_migration'
    }
  });

  try {
    console.log('🧪 Testing connection...');
    await sql`SELECT 1 as test`;
    console.log('✅ Connection successful!\n');

    console.log('📖 Reading FIXED migration file...');
    const migrationPath = join(projectRoot, 'drizzle/0000_windy_meltdown_FIXED.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements\n`);
    console.log('⚡ Executing migration...\n');

    let counts = { types: 0, tables: 0, indexes: 0, constraints: 0 };

    for (const statement of statements) {
      if (!statement || statement.startsWith('--')) continue;

      await sql.unsafe(statement + ';');

      if (statement.includes('CREATE TYPE')) {
        counts.types++;
        const match = statement.match(/CREATE TYPE "public"\."(\w+)"/);
        if (match) console.log(`  ✅ ENUM: ${match[1]}`);
      } else if (statement.includes('CREATE TABLE')) {
        counts.tables++;
        const match = statement.match(/CREATE TABLE "(\w+)"/);
        if (match) console.log(`  ✅ Table: ${match[1]}`);
      } else if (statement.includes('CREATE INDEX') || statement.includes('CREATE UNIQUE INDEX')) {
        counts.indexes++;
      } else if (statement.includes('ALTER TABLE')) {
        counts.constraints++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`  • ${counts.types} ENUM types`);
    console.log(`  • ${counts.tables} tables`);
    console.log(`  • ${counts.indexes} indexes`);
    console.log(`  • ${counts.constraints} foreign keys`);

    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    console.log(`\n✅ ${tables.length} tables in database:`);
    tables.forEach(t => console.log(`   • ${t.table_name}`));

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
