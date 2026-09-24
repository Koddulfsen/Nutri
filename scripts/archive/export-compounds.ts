/**
 * Export Compounds Script
 *
 * Fetches all compounds from the database and exports them as a TypeScript constant.
 * Run with: npx tsx scripts/export-compounds.ts
 */

import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';

import { db } from '../db';
import { compounds } from '../db/schema';

async function exportCompounds() {
  console.log('Fetching all compounds from database...');

  const allCompounds = await db.select().from(compounds).orderBy(compounds.compound_type).orderBy(compounds.name);

  console.log(`Found ${allCompounds.length} compounds`);

  // Transform to snake_case for frontend compatibility
  const transformedCompounds = allCompounds.map((c) => ({
    id: c.id,
    name: c.name,
    compound_type: c.compoundType,
    unit: c.unit,
    parent_compound_id: c.parentCompoundId,
    description: c.description,
    health_benefits: c.healthBenefits || null,
    food_sources: c.foodSources || null,
    daily_value: c.dailyValue || null,
    upper_limit: c.upperLimit || null,
    created_at: c.createdAt,
  }));

  // Generate TypeScript file content
  const fileContent = `/**
 * Hardcoded Compounds Data
 *
 * This file contains all ${allCompounds.length} compounds exported from the database.
 * Generated on: ${new Date().toISOString()}
 *
 * Benefits:
 * - Zero database queries for compound data
 * - Instant page load (no API calls)
 * - Static reference data
 */

export interface Compound {
  id: string;
  name: string;
  compound_type: string;
  unit: string;
  parent_compound_id: string | null;
  description: string | null;
  health_benefits: string | null;
  food_sources: string | null;
  daily_value: number | null;
  upper_limit: number | null;
  created_at: string;
}

export const COMPOUNDS: Readonly<Compound[]> = ${JSON.stringify(transformedCompounds, null, 2)} as const;

// Group compounds by type for easy access
export const COMPOUNDS_BY_TYPE = COMPOUNDS.reduce((acc, compound) => {
  if (!acc[compound.compound_type]) {
    acc[compound.compound_type] = [];
  }
  acc[compound.compound_type].push(compound);
  return acc;
}, {} as Record<string, Compound[]>);

// Get all compound types
export const COMPOUND_TYPES = Array.from(new Set(COMPOUNDS.map(c => c.compound_type)));
`;

  // Write to file
  const outputPath = path.join(process.cwd(), 'lib', 'data', 'compounds.ts');
  const outputDir = path.dirname(outputPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, fileContent, 'utf-8');

  console.log(`✅ Exported ${allCompounds.length} compounds to ${outputPath}`);

  // Print summary by type (use camelCase from Drizzle result)
  const summary = allCompounds.reduce((acc, c) => {
    acc[c.compoundType] = (acc[c.compoundType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`\nCompound types:`, Object.keys(summary));

  console.log('\nCompounds by type:');
  Object.entries(summary).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  process.exit(0);
}

exportCompounds().catch((error) => {
  console.error('Error exporting compounds:', error);
  process.exit(1);
});
