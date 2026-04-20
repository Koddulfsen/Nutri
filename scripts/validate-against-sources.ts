/**
 * Validate Database Mappings Against Actual Source Files
 *
 * This script reads the nutrients.json files from each data source
 * and compares against our compound_sources table.
 *
 * Run: npx tsx scripts/validate-against-sources.ts
 * Run specific source: npx tsx scripts/validate-against-sources.ts FRIDA
 */

import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const sql = postgres(process.env.DATABASE_URL!);
const DATA_DIR = '/home/kodd/Nutri/data';

// ============================================================================
// Source Configurations
// ============================================================================

interface SourceConfig {
  folder: string;
  file: string;
  idField: string;
  nameField: string | string[];  // Can be array for fallback (e.g., name_en, name)
  nested?: string;  // If data is nested under a key (e.g., 'nutrients')
}

const SOURCES: Record<string, SourceConfig> = {
  FRIDA: {
    folder: 'frida',
    file: 'nutrients.json',
    idField: 'id',
    nameField: ['name_en', 'name_dk'],
  },
  CIQUAL: {
    folder: 'ciqual',
    file: 'nutrients.json',
    idField: 'id',
    nameField: 'name',
  },
  BLS: {
    folder: 'bls',
    file: 'nutrients.json',
    idField: 'code',  // BLS uses 'code' not 'id'
    nameField: ['name_en', 'name_de'],
  },
  MEXT: {
    folder: 'mext',
    file: 'nutrients.json',
    idField: 'column',  // MEXT uses numeric column (we prefix with 'col:')
    nameField: ['name_en', 'name_jp'],
  },
  KFCT: {
    folder: 'kfct',
    file: 'nutrients.json',
    idField: 'tagname',  // KFCT uses INFOODS tagnames (CA, FE, etc)
    nameField: ['name_en', 'name_kr'],
  },
  INDB: {
    folder: 'indb',
    file: 'nutrients.json',
    idField: 'column',  // INDB uses column names like 'energy_kj'
    nameField: 'name',
  },
  AFCD: {
    folder: 'afcd',
    file: 'nutrient-list.json',
    idField: 'name',  // AFCD uses nutrient name as ID
    nameField: 'name',
  },
  CoFID: {
    folder: 'uk-cofid',
    file: 'nutrients.json',
    idField: 'column',  // CoFID uses column names like "Protein (g)"
    nameField: 'name',
  },
  ASEANFOODS: {
    folder: 'aseanfoods',
    file: 'nutrients.json',
    idField: 'tagname',  // ASEANFOODS uses INFOODS tagnames (CA, FE, etc)
    nameField: 'name',
  },
  Matvaretabellen: {
    folder: 'matvaretabellen',
    file: 'nutrients.json',
    idField: 'nutrientId',  // Matvaretabellen uses nutrientId like 'Ca', 'Fe'
    nameField: 'name',
    nested: 'nutrients',  // Data is nested under 'nutrients' key
  },
};

// ============================================================================
// Types
// ============================================================================

interface SourceNutrient {
  [key: string]: any;
}

interface DbMapping {
  compound_name: string;
  external_id: string;
  source_name: string;
  source_unit: string;
}

interface ValidationError {
  compound: string;
  external_id: string;
  our_name: string;
  source_name: string | null;
  issue: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function loadSourceData(config: SourceConfig, sourceName: string): Map<string, string> {
  const filePath = join(DATA_DIR, config.folder, config.file);

  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  const data: SourceNutrient[] = config.nested ? raw[config.nested] : raw;
  const lookup = new Map<string, string>();

  for (const item of data) {
    let id = String(item[config.idField]);

    // Special handling for MEXT - we use 'col:25' format but file has just 25
    if (sourceName === 'MEXT' && config.idField === 'column') {
      id = `col:${id}`;
    }

    // Get name from first available field
    let name: string | undefined;
    const nameFields = Array.isArray(config.nameField) ? config.nameField : [config.nameField];

    for (const field of nameFields) {
      if (item[field]) {
        name = item[field];
        break;
      }
    }

    if (id && name) {
      lookup.set(id, name);
    }
  }

  return lookup;
}

function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/vitamin/g, 'vit')
    .replace(/tocopherol/g, 'tocph')
    .replace(/total/g, '')
    .replace(/acid/g, '');
}

function namesMatch(ourName: string, sourceName: string): boolean {
  const a = normalizeForComparison(ourName);
  const b = normalizeForComparison(sourceName);

  // Exact match after normalization
  if (a === b) return true;

  // One contains the other (at least 4 chars)
  if (a.length >= 4 && b.includes(a)) return true;
  if (b.length >= 4 && a.includes(b)) return true;

  // First 5 chars match
  if (a.slice(0, 5) === b.slice(0, 5) && a.length >= 5) return true;

  return false;
}

// ============================================================================
// Main Validation
// ============================================================================

async function validateSource(sourceName: string): Promise<ValidationError[]> {
  const config = SOURCES[sourceName];
  if (!config) {
    console.log(`  ⚠ No config for ${sourceName}, skipping`);
    return [];
  }

  let sourceData: Map<string, string>;
  try {
    sourceData = loadSourceData(config, sourceName);
  } catch (e: any) {
    console.log(`  ⚠ ${e.message}`);
    return [];
  }

  console.log(`  Loaded ${sourceData.size} nutrients from source file`);

  // Get our mappings for this source
  const mappings = await sql<DbMapping[]>`
    SELECT
      c.name as compound_name,
      cs.external_id,
      cs.source_name,
      cs.source_unit
    FROM compound_sources cs
    JOIN compounds c ON cs.compound_id = c.id
    WHERE cs.external_source = ${sourceName}
    ORDER BY c.name
  `;

  console.log(`  Found ${mappings.length} mappings in our database`);

  const errors: ValidationError[] = [];

  for (const m of mappings) {
    const sourceNutrientName = sourceData.get(m.external_id);

    if (!sourceNutrientName) {
      // ID doesn't exist in source
      errors.push({
        compound: m.compound_name,
        external_id: m.external_id,
        our_name: m.source_name,
        source_name: null,
        issue: `ID "${m.external_id}" not found in source file`,
      });
    } else if (!namesMatch(m.compound_name, sourceNutrientName) &&
               !namesMatch(m.source_name, sourceNutrientName)) {
      // Names don't match
      errors.push({
        compound: m.compound_name,
        external_id: m.external_id,
        our_name: m.source_name,
        source_name: sourceNutrientName,
        issue: 'Name mismatch',
      });
    }
  }

  return errors;
}

async function main() {
  const args = process.argv.slice(2);
  const specificSource = args[0];

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      VALIDATE MAPPINGS AGAINST SOURCE FILES                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const sourcesToCheck = specificSource
    ? [specificSource]
    : Object.keys(SOURCES);

  let totalErrors = 0;
  const allErrors: { source: string; errors: ValidationError[] }[] = [];

  for (const source of sourcesToCheck) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Validating ${source}...`);

    const errors = await validateSource(source);

    if (errors.length === 0) {
      console.log(`  ✅ All mappings valid`);
    } else {
      console.log(`  ❌ ${errors.length} errors found`);
      allErrors.push({ source, errors });
      totalErrors += errors.length;
    }
  }

  // Print detailed errors
  if (allErrors.length > 0) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log('DETAILED ERRORS');
    console.log('═'.repeat(60));

    for (const { source, errors } of allErrors) {
      console.log(`\n## ${source} (${errors.length} errors)\n`);

      for (const e of errors) {
        console.log(`  ${e.compound}`);
        console.log(`    ID: ${e.external_id}`);
        console.log(`    Issue: ${e.issue}`);
        if (e.source_name) {
          console.log(`    Our name:    "${e.our_name}"`);
          console.log(`    Source name: "${e.source_name}"`);
        }
        console.log('');
      }
    }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`SUMMARY: ${totalErrors} total errors across ${allErrors.length} sources`);
  console.log('═'.repeat(60));

  await sql.end();
}

main().catch(console.error);
