/**
 * Generate SQL INSERT statements for manual execution in Supabase SQL Editor
 *
 * This script bypasses the IPv6 network connectivity issues by generating
 * plain SQL that can be copy-pasted into Supabase SQL Editor.
 *
 * Uses Drizzle's toSQL() method to extract SQL from insert operations,
 * then substitutes parameters with actual values.
 */

import 'dotenv/config';
import * as fs from 'fs';
import { db } from '../index';
import {
  compounds,
  foodCategories,
  userProfiles,
  apiKeys,
  userConsent,
  researchCitations,
  compoundCitations,
  medicationInteractions,
  compoundValidationRanges
} from '../schema';

/**
 * Helper to escape SQL string values
 */
function escapeSQLString(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'string') {
    // Escape single quotes by doubling them
    return `'${value.replace(/'/g, "''")}'`;
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }

  if (typeof value === 'object') {
    // JSON objects
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }

  return String(value);
}

/**
 * Convert Drizzle insert to SQL with substituted values
 */
function insertToSQL(tableName: string, records: any[]): string {
  if (records.length === 0) return '';

  const keys = Object.keys(records[0]);
  const columnNames = keys.join(', ');

  const valueRows = records.map(record => {
    const values = keys.map(key => escapeSQLString(record[key]));
    return `  (${values.join(', ')})`;
  });

  return `INSERT INTO ${tableName} (${columnNames}) VALUES\n${valueRows.join(',\n')};\n`;
}

/**
 * Main SQL generation function
 */
async function generateSQL() {
  console.log('\n📝 Generating Seed SQL for Manual Execution...\n');
  console.log('═'.repeat(70));

  let sqlOutput = '';

  // Header
  sqlOutput += '-- ═══════════════════════════════════════════════════════════════════════\n';
  sqlOutput += '-- Nutri Database Seed Data - Manual Execution Script\n';
  sqlOutput += '-- Generated: ' + new Date().toISOString() + '\n';
  sqlOutput += '-- ═══════════════════════════════════════════════════════════════════════\n\n';
  sqlOutput += '-- IMPORTANT: Execute this entire file in Supabase SQL Editor\n';
  sqlOutput += '-- This bypasses IPv6 network connectivity issues\n\n';
  sqlOutput += 'BEGIN;\n\n';

  try {
    // Import seed data generation functions
    const { seedCompounds } = await import('./compounds');
    const { seedCategories } = await import('./categories');
    const { seedUsers } = await import('./users');
    const seedResearchCitations = (await import('./research')).default;
    const { seedInteractions } = await import('./interactions');
    const { seedValidationRanges } = await import('./validation');

    // NOTE: Since the seed functions need database access for lookups,
    // we need a different approach. Let me create a data-only version.

    console.log('\n❌ Seed files require database access for FK lookups.');
    console.log('📋 Alternative approach: Use Supabase REST API or manual copy.\n');

    // For now, provide instructions
    sqlOutput += `-- ═══════════════════════════════════════════════════════════════════════
-- MANUAL SEED INSTRUCTIONS
-- ═══════════════════════════════════════════════════════════════════════
--
-- Due to IPv6 network restrictions, automated seeding is blocked.
-- The seed data files are ready at:
--   /home/kodd/VibeWiz/Projects/Nutri/db/seed/
--
-- Recommended approach:
-- 1. Install Supabase CLI: npm install -g supabase
-- 2. Link to your project: supabase link --project-ref wogwstcywkttaiiitzil
-- 3. Run: supabase db push
--
-- Alternative (this session):
-- Contact Master Claude to explore Supabase REST API seeding approach.
--
-- Seed files created:
--   • compounds.ts (280 compounds)
--   • research.ts (41 citations)
--   • users.ts (22 test users)
--   • categories.ts (~100 food categories)
--   • interactions.ts (18 medication interactions)
--   • validation.ts (280 validation ranges)
--
-- ═══════════════════════════════════════════════════════════════════════\n\n`;

    sqlOutput += 'COMMIT;\n';

    // Write output
    const outputPath = '/home/kodd/VibeWiz/Projects/Nutri/db/seed/MANUAL-SEED-INSTRUCTIONS.sql';
    fs.writeFileSync(outputPath, sqlOutput);

    console.log('═'.repeat(70));
    console.log('📄 Instructions file created: ' + outputPath);
    console.log('═'.repeat(70));
    console.log('\n⚠️  BLOCKER IDENTIFIED:\n');
    console.log('The seed files use database lookups for foreign key relationships.');
    console.log('They cannot generate static SQL without executing.');
    console.log('\n💡 SOLUTIONS:\n');
    console.log('1. Install Supabase CLI and use: supabase db push');
    console.log('2. Use Supabase REST API with HTTP client (bypasses IPv6 PostgreSQL)');
    console.log('3. Set up SSH tunnel to bypass network restrictions');
    console.log('\nShall Master Claude implement Solution #2 (REST API approach)?\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  }
}

// Execute
if (require.main === module) {
  generateSQL()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default generateSQL;
