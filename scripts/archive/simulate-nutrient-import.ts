/**
 * Nutrient Import Simulation
 *
 * Simulates importing real food-nutrient data through our compound_sources mapping system.
 * Tests coverage, accuracy, and identifies potential mapping errors.
 *
 * Run: npx tsx scripts/simulate-nutrient-import.ts
 * Run specific source: npx tsx scripts/simulate-nutrient-import.ts --source=Fineli
 */

import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync, existsSync, createReadStream } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

const sql = postgres(process.env.DATABASE_URL!);
const DATA_DIR = '/home/kodd/Nutri/data';

// ============================================================================
// Types
// ============================================================================

interface CompoundMapping {
  compound_id: number;
  compound_name: string;
  external_id: string;
  source_name: string;
  source_unit: string;
  conversion_factor: string;
}

interface ImportResult {
  source: string;
  total_entries: number;
  unique_nutrients: number;
  mapped: number;
  unmapped: number;
  potential_mismatches: number;
  nutrient_counts: Map<string, { count: number; mapped: boolean; compound?: string }>;
  unmapped_list: string[];
  mismatches: { nutrient_id: string; source_name: string; our_compound: string }[];
}

// ============================================================================
// Load Compound Mappings
// ============================================================================

async function loadMappings(source: string): Promise<Map<string, CompoundMapping>> {
  const mappings = await sql<CompoundMapping[]>`
    SELECT
      cs.compound_id,
      c.name as compound_name,
      cs.external_id,
      cs.source_name,
      cs.source_unit,
      cs.conversion_factor
    FROM compound_sources cs
    JOIN compounds c ON cs.compound_id = c.id
    WHERE cs.external_source = ${source}
  `;

  const lookup = new Map<string, CompoundMapping>();
  for (const m of mappings) {
    lookup.set(m.external_id, m);

    // For FooDB: also add numeric-only version (FDB000565 -> 565)
    if (source === 'FooDB' && m.external_id.startsWith('FDB')) {
      const numericId = m.external_id.replace(/^FDB0*/, '');
      lookup.set(numericId, m);
    }
  }

  console.log(`  Loaded ${lookup.size} mappings for ${source}`);
  return lookup;
}

// ============================================================================
// Fineli Simulation
// ============================================================================

async function simulateFineli(): Promise<ImportResult> {
  console.log('\n' + '─'.repeat(60));
  console.log('Simulating FINELI import...');

  const mappings = await loadMappings('Fineli');
  const componentValuePath = join(DATA_DIR, 'fineli/component_value.csv');

  if (!existsSync(componentValuePath)) {
    throw new Error(`File not found: ${componentValuePath}`);
  }

  const nutrientCounts = new Map<string, { count: number; mapped: boolean; compound?: string }>();
  let totalEntries = 0;

  // Read line by line (file is 8MB)
  const fileStream = createReadStream(componentValuePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let isFirst = true;
  for await (const line of rl) {
    if (isFirst) { isFirst = false; continue; } // Skip header

    const parts = line.split(';');
    const nutrientId = parts[1]; // EUFDNAME column

    if (!nutrientId) continue;
    totalEntries++;

    const existing = nutrientCounts.get(nutrientId);
    if (existing) {
      existing.count++;
    } else {
      const mapping = mappings.get(nutrientId);
      nutrientCounts.set(nutrientId, {
        count: 1,
        mapped: !!mapping,
        compound: mapping?.compound_name
      });
    }
  }

  // Calculate results
  const unmapped: string[] = [];
  const mismatches: { nutrient_id: string; source_name: string; our_compound: string }[] = [];
  let mappedCount = 0;
  let unmappedCount = 0;

  for (const [id, data] of nutrientCounts) {
    if (data.mapped) {
      mappedCount += data.count;
    } else {
      unmappedCount += data.count;
      unmapped.push(id);
    }
  }

  return {
    source: 'Fineli',
    total_entries: totalEntries,
    unique_nutrients: nutrientCounts.size,
    mapped: mappedCount,
    unmapped: unmappedCount,
    potential_mismatches: mismatches.length,
    nutrient_counts: nutrientCounts,
    unmapped_list: unmapped,
    mismatches
  };
}

// ============================================================================
// FooDB Simulation (Sample)
// ============================================================================

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function simulateFooDB(sampleSize = 500000): Promise<ImportResult[]> {
  console.log('\n' + '─'.repeat(60));
  console.log(`Simulating FooDB import (${sampleSize.toLocaleString()} sample)...`);

  const mappings = await loadMappings('FooDB');
  const contentPath = join(DATA_DIR, 'foodb/foodb_2020_04_07_csv/Content.csv');

  if (!existsSync(contentPath)) {
    throw new Error(`File not found: ${contentPath}`);
  }

  // Track both Nutrient and Compound entries separately
  const nutrientCounts = new Map<string, { count: number; mapped: boolean; compound?: string }>();
  const compoundCounts = new Map<string, { count: number; mapped: boolean; compound?: string }>();
  let totalNutrient = 0;
  let totalCompound = 0;
  let lineCount = 0;

  const fileStream = createReadStream(contentPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let isFirst = true;
  for await (const line of rl) {
    if (isFirst) { isFirst = false; continue; }
    lineCount++;
    if (lineCount > sampleSize) break;

    const parts = parseCSVLine(line);
    const sourceType = parts[2];    // source_type (Nutrient, Compound)
    const sourceId = parts[1];      // source_id

    if (!sourceId) continue;

    const isNutrient = sourceType === 'Nutrient';
    const counts = isNutrient ? nutrientCounts : compoundCounts;

    if (isNutrient) totalNutrient++;
    else totalCompound++;

    const existing = counts.get(sourceId);
    if (existing) {
      existing.count++;
    } else {
      const mapping = mappings.get(sourceId);
      counts.set(sourceId, {
        count: 1,
        mapped: !!mapping,
        compound: mapping?.compound_name
      });
    }
  }

  // Build results for both types
  const results: ImportResult[] = [];

  for (const [name, counts, total] of [
    ['FooDB (Nutrients)', nutrientCounts, totalNutrient],
    ['FooDB (Compounds)', compoundCounts, totalCompound]
  ] as const) {
    const unmapped: string[] = [];
    let mappedCount = 0;
    let unmappedCount = 0;

    for (const [id, data] of counts) {
      if (data.mapped) {
        mappedCount += data.count;
      } else {
        unmappedCount += data.count;
        unmapped.push(id);
      }
    }

    results.push({
      source: name,
      total_entries: total,
      unique_nutrients: counts.size,
      mapped: mappedCount,
      unmapped: unmappedCount,
      potential_mismatches: 0,
      nutrient_counts: counts,
      unmapped_list: unmapped,
      mismatches: []
    });
  }

  return results;
}

// ============================================================================
// Database Coverage Report
// ============================================================================

async function reportMappingCoverage() {
  console.log('\n' + '═'.repeat(60));
  console.log('COMPOUND MAPPING COVERAGE REPORT');
  console.log('═'.repeat(60));

  // Count mappings by source
  const sourceCounts = await sql`
    SELECT external_source, COUNT(*) as count
    FROM compound_sources
    GROUP BY external_source
    ORDER BY count DESC
  `;

  console.log('\nMappings by source:');
  for (const row of sourceCounts) {
    console.log(`  ${row.external_source}: ${row.count}`);
  }

  // Count compounds by type
  const typeCounts = await sql`
    SELECT compound_type, COUNT(*) as count
    FROM compounds
    GROUP BY compound_type
    ORDER BY count DESC
  `;

  console.log('\nCompounds by type:');
  for (const row of typeCounts) {
    console.log(`  ${row.compound_type}: ${row.count}`);
  }

  // Total stats
  const totalCompounds = await sql`SELECT COUNT(*) as n FROM compounds`;
  const totalMappings = await sql`SELECT COUNT(*) as n FROM compound_sources`;
  const avgMappings = await sql`
    SELECT ROUND(AVG(mapping_count), 1) as avg
    FROM (
      SELECT compound_id, COUNT(*) as mapping_count
      FROM compound_sources
      GROUP BY compound_id
    ) t
  `;

  console.log(`\nTotal compounds: ${totalCompounds[0].n}`);
  console.log(`Total mappings: ${totalMappings[0].n}`);
  console.log(`Avg mappings per compound: ${avgMappings[0].avg}`);
}

// ============================================================================
// Print Results
// ============================================================================

function printResult(result: ImportResult) {
  console.log(`\n${result.source} Import Simulation`);
  console.log('─'.repeat(40));
  console.log(`Total food-nutrient entries: ${result.total_entries.toLocaleString()}`);
  console.log(`Unique nutrients: ${result.unique_nutrients}`);
  console.log(`Mapped entries: ${result.mapped.toLocaleString()} (${(result.mapped / result.total_entries * 100).toFixed(1)}%)`);
  console.log(`Unmapped entries: ${result.unmapped.toLocaleString()} (${(result.unmapped / result.total_entries * 100).toFixed(1)}%)`);

  if (result.unmapped_list.length > 0) {
    console.log(`\nUnmapped nutrient IDs (${result.unmapped_list.length}):`);
    const sorted = [...result.nutrient_counts.entries()]
      .filter(([_, d]) => !d.mapped)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15);

    for (const [id, data] of sorted) {
      console.log(`  ${id}: ${data.count.toLocaleString()} entries`);
    }
    if (result.unmapped_list.length > 15) {
      console.log(`  ... and ${result.unmapped_list.length - 15} more`);
    }
  }

  if (result.mismatches.length > 0) {
    console.log(`\n⚠️  Potential mismatches (${result.mismatches.length}):`);
    for (const m of result.mismatches.slice(0, 10)) {
      console.log(`  ${m.nutrient_id}: "${m.source_name}" vs our "${m.our_compound}"`);
    }
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const sourceFilter = args.find(a => a.startsWith('--source='))?.split('=')[1];

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           NUTRIENT IMPORT SIMULATION                           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  await reportMappingCoverage();

  const results: ImportResult[] = [];

  // Run simulations
  if (!sourceFilter || sourceFilter === 'Fineli') {
    try {
      const fineli = await simulateFineli();
      results.push(fineli);
      printResult(fineli);
    } catch (e: any) {
      console.log(`  ⚠ Fineli: ${e.message}`);
    }
  }

  if (!sourceFilter || sourceFilter === 'FooDB') {
    try {
      const foodbResults = await simulateFooDB();
      for (const r of foodbResults) {
        results.push(r);
        printResult(r);
      }
    } catch (e: any) {
      console.log(`  ⚠ FooDB: ${e.message}`);
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('SIMULATION SUMMARY');
  console.log('═'.repeat(60));

  let totalProcessed = 0;
  let totalMapped = 0;
  let totalUnmapped = 0;

  for (const r of results) {
    totalProcessed += r.total_entries;
    totalMapped += r.mapped;
    totalUnmapped += r.unmapped;
  }

  console.log(`\nTotal entries processed: ${totalProcessed.toLocaleString()}`);
  console.log(`Total mapped: ${totalMapped.toLocaleString()} (${(totalMapped / totalProcessed * 100).toFixed(1)}%)`);
  console.log(`Total unmapped: ${totalUnmapped.toLocaleString()} (${(totalUnmapped / totalProcessed * 100).toFixed(1)}%)`);

  await sql.end();
}

main().catch(console.error);
