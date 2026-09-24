/**
 * Export Core Compounds to Static File
 *
 * Exports only the 188 core compounds (with source mappings) to a static file
 * for use in the analysis page.
 */

import 'dotenv/config';
import postgres from 'postgres';
import { writeFileSync } from 'fs';

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  console.log('Fetching core compounds...');

  // Get all core compounds
  const compounds = await sql`
    SELECT
      c.id,
      c.name,
      c.compound_type,
      c.unit,
      c.parent_compound_id,
      c.description,
      c.tier
    FROM compounds c
    WHERE c.tier = 'core'
    ORDER BY
      CASE c.compound_type
        WHEN 'MACRONUTRIENT' THEN 1
        WHEN 'VITAMIN' THEN 2
        WHEN 'MINERAL' THEN 3
        WHEN 'AMINO_ACID' THEN 4
        ELSE 5
      END,
      c.name
  `;

  console.log(`Found ${compounds.length} core compounds`);

  // Format for export
  const formatted = compounds.map(c => ({
    id: c.id,
    name: c.name,
    compound_type: c.compound_type,
    unit: c.unit,
    parent_compound_id: c.parent_compound_id,
    description: c.description,
  }));

  // Generate TypeScript file
  const output = `/**
 * Core Compounds Data (Nutri Core)
 *
 * Contains the ${compounds.length} core compounds with source mappings.
 * These are the compounds that can be imported from food databases.
 *
 * Generated: ${new Date().toISOString()}
 *
 * Compound Types:
 * - MACRONUTRIENT: Proteins, fats, carbs, fiber, etc.
 * - VITAMIN: All vitamins and forms
 * - MINERAL: Essential minerals
 * - AMINO_ACID: Essential and non-essential amino acids
 * - ALKALOID: Caffeine, theobromine, etc.
 * - SYNTHETIC_ADDITIVE: Artificial sweeteners, etc.
 */

export interface CoreCompound {
  id: string;
  name: string;
  compound_type: string;
  unit: string;
  parent_compound_id: string | null;
  description: string | null;
}

export const CORE_COMPOUNDS: Readonly<CoreCompound[]> = ${JSON.stringify(formatted, null, 2)};

// Export count for verification
export const CORE_COMPOUND_COUNT = ${compounds.length};

// Group compounds by type for quick access
export const COMPOUNDS_BY_TYPE: Record<string, CoreCompound[]> = CORE_COMPOUNDS.reduce((acc, c) => {
  if (!acc[c.compound_type]) acc[c.compound_type] = [];
  acc[c.compound_type].push(c);
  return acc;
}, {} as Record<string, CoreCompound[]>);
`;

  writeFileSync('/home/kodd/Nutri/lib/data/core-compounds.ts', output);
  console.log('Written to lib/data/core-compounds.ts');

  // Summary by type
  const byType: Record<string, number> = {};
  for (const c of compounds) {
    byType[c.compound_type] = (byType[c.compound_type] || 0) + 1;
  }

  console.log('\nBy type:');
  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }

  await sql.end();
}

main().catch(console.error);
