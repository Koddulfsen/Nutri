/**
 * Export Compounds from Production API
 *
 * Fetches all compounds from the production API and exports them as a TypeScript constant.
 * Run with: npx tsx scripts/export-compounds-from-api.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const PRODUCTION_URL = 'https://nutri-3mq6iwvl5-sana-eco.vercel.app';

interface Compound {
  id: string;
  name: string;
  compound_type: string;
  unit: string;
  parent_compound_id?: string | null;
  description?: string | null;
  health_benefits?: string | null;
  food_sources?: string | null;
  daily_value?: number | null;
  upper_limit?: number | null;
  created_at?: Date | string;
}

async function fetchAllCompounds(): Promise<Compound[]> {
  console.log('Fetching compounds from production API...');

  const allCompounds: Compound[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const url = `${PRODUCTION_URL}/api/compounds?limit=${limit}&offset=${offset}`;
    console.log(`Fetching: ${url}`);

    const response = await fetch(url);
    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error(`Failed to fetch compounds: ${JSON.stringify(data)}`);
    }

    const { compounds, total } = data.data;
    allCompounds.push(...compounds);

    console.log(`  Fetched ${compounds.length} compounds (${allCompounds.length}/${total})`);

    offset += limit;
    hasMore = allCompounds.length < total;
  }

  console.log(`\n✅ Fetched all ${allCompounds.length} compounds`);
  return allCompounds;
}

async function exportCompounds() {
  try {
    const allCompounds = await fetchAllCompounds();

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
  parent_compound_id?: string | null;
  description?: string | null;
  health_benefits?: string | null;
  food_sources?: string | null;
  daily_value?: number | null;
  upper_limit?: number | null;
  created_at?: Date | string;
}

export const COMPOUNDS: Readonly<Compound[]> = ${JSON.stringify(allCompounds, null, 2)} as const;

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

    console.log(`\n✅ Exported ${allCompounds.length} compounds to ${outputPath}`);

    // Print summary by type
    const summary = allCompounds.reduce((acc, c) => {
      acc[c.compound_type] = (acc[c.compound_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nCompounds by type:');
    Object.entries(summary)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

    process.exit(0);
  } catch (error) {
    console.error('Error exporting compounds:', error);
    process.exit(1);
  }
}

exportCompounds();
