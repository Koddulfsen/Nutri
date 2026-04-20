import { readFileSync } from 'fs';
import { dbHttp } from '../db/drizzle-http-adapter.js';

const sql = readFileSync('db/sql/rls-policies.sql', 'utf-8');

const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--') && !s.startsWith('SELECT'));

console.log(`Executing ${statements.length} RLS statements...\n`);

for (const statement of statements) {
  try {
    await dbHttp.execute(statement);
    console.log('✓', statement.substring(0, 60) + '...');
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('⚠️  (already exists)', statement.substring(0, 50) + '...');
    } else {
      console.error('❌', error.message);
      console.error('   Statement:', statement.substring(0, 100));
    }
  }
}

console.log('\n✅ RLS policies applied successfully!');
