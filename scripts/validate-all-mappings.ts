/**
 * Comprehensive Compound Mapping Validation
 *
 * Validates all compound_sources mappings against actual source data.
 *
 * Run: npx tsx scripts/validate-all-mappings.ts
 * Run specific source: npx tsx scripts/validate-all-mappings.ts --source=FDC
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);
const FDC_API_KEY = process.env.FDC_API_KEY || 'DEMO_KEY';

// ============================================================================
// Types
// ============================================================================

interface Mapping {
  compound_name: string;
  external_source: string;
  external_id: string;
  source_name: string;
  source_unit: string;
}

interface ValidationResult {
  source: string;
  total: number;
  verified: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  compound: string;
  external_id: string;
  issue: string;
  expected?: string;
  actual?: string;
}

interface ValidationWarning {
  compound: string;
  external_id: string;
  message: string;
}

// ============================================================================
// FDC API Validation
// ============================================================================

interface FDCNutrient {
  id: number;
  name: string;
  unitName: string;
}

async function fetchFDCNutrients(): Promise<Map<string, FDCNutrient>> {
  console.log('  Fetching FDC nutrient list...');

  // Fetch a sample food to get the nutrient list (SR Legacy chicken breast)
  const response = await fetch(
    `https://api.nal.usda.gov/fdc/v1/food/171077?api_key=${FDC_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`FDC API error: ${response.status}`);
  }

  const data = await response.json();
  const nutrients = new Map<string, FDCNutrient>();

  for (const fn of data.foodNutrients || []) {
    if (fn.nutrient?.id) {
      nutrients.set(String(fn.nutrient.id), {
        id: fn.nutrient.id,
        name: fn.nutrient.name,
        unitName: fn.nutrient.unitName,
      });
    }
  }

  // Also fetch another food to get more nutrients (avocado has different set)
  const response2 = await fetch(
    `https://api.nal.usda.gov/fdc/v1/food/171705?api_key=${FDC_API_KEY}`
  );

  if (response2.ok) {
    const data2 = await response2.json();
    for (const fn of data2.foodNutrients || []) {
      if (fn.nutrient?.id && !nutrients.has(String(fn.nutrient.id))) {
        nutrients.set(String(fn.nutrient.id), {
          id: fn.nutrient.id,
          name: fn.nutrient.name,
          unitName: fn.nutrient.unitName,
        });
      }
    }
  }

  console.log(`  Found ${nutrients.size} FDC nutrients`);
  return nutrients;
}

async function validateFDC(mappings: Mapping[]): Promise<ValidationResult> {
  const result: ValidationResult = {
    source: 'FDC',
    total: mappings.length,
    verified: 0,
    errors: [],
    warnings: [],
  };

  const fdcNutrients = await fetchFDCNutrients();

  for (const m of mappings) {
    const nutrient = fdcNutrients.get(m.external_id);

    if (!nutrient) {
      // ID not found in our sample - might still be valid
      result.warnings.push({
        compound: m.compound_name,
        external_id: m.external_id,
        message: `FDC ID ${m.external_id} not found in sample foods (may still be valid)`,
      });
      continue;
    }

    // Check if names reasonably match
    const ourName = m.compound_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fdcName = nutrient.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const sourceName = m.source_name.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check for obvious mismatches
    const nameMatches =
      fdcName.includes(ourName.slice(0, 5)) ||
      ourName.includes(fdcName.slice(0, 5)) ||
      sourceName.includes(fdcName.slice(0, 5)) ||
      fdcName.includes(sourceName.slice(0, 5));

    if (!nameMatches) {
      result.errors.push({
        compound: m.compound_name,
        external_id: m.external_id,
        issue: 'Name mismatch',
        expected: m.source_name,
        actual: nutrient.name,
      });
    } else {
      result.verified++;
    }
  }

  return result;
}

// ============================================================================
// Duplicate Detection
// ============================================================================

async function findDuplicateMappings(): Promise<ValidationError[]> {
  const duplicates = await sql`
    SELECT external_source, external_id, array_agg(c.name) as compounds
    FROM compound_sources cs
    JOIN compounds c ON cs.compound_id = c.id
    GROUP BY external_source, external_id
    HAVING COUNT(*) > 1
  `;

  return duplicates.map(d => ({
    compound: (d.compounds as string[]).join(', '),
    external_id: d.external_id,
    issue: `Duplicate: ${d.external_source} ID ${d.external_id} used by multiple compounds`,
    expected: 'Unique ID per compound',
    actual: (d.compounds as string[]).join(', '),
  }));
}

// ============================================================================
// INFOODS Tagname Validation
// ============================================================================

// Standard INFOODS tagnames - these should be consistent across sources
const INFOODS_TAGNAMES: Record<string, string> = {
  // Macros
  'PROCNT': 'Protein',
  'FAT': 'Fat',
  'CHOCDF': 'Carbohydrate',
  'FIBTG': 'Fiber',
  'ALC': 'Alcohol',

  // Sugars
  'SUGAR': 'Total Sugars',
  'GLUS': 'Glucose',
  'FRUS': 'Fructose',
  'GALS': 'Galactose',
  'SUCS': 'Sucrose',
  'LACS': 'Lactose',
  'MALS': 'Maltose',
  'STARCH': 'Starch',

  // Minerals (element symbols)
  'CA': 'Calcium',
  'FE': 'Iron',
  'MG': 'Magnesium',
  'P': 'Phosphorus',
  'K': 'Potassium',
  'NA': 'Sodium',
  'ZN': 'Zinc',
  'CU': 'Copper',
  'MN': 'Manganese',
  'SE': 'Selenium',
  'CR': 'Chromium',
  'MO': 'Molybdenum',
  'ID': 'Iodine',
  'F': 'Fluoride',
  'B': 'Boron',

  // Vitamins
  'VITA_RAE': 'Vitamin A',
  'RETOL': 'Retinol',
  'CARTB': 'Beta-Carotene',
  'CARTA': 'Alpha-Carotene',
  'VITC': 'Vitamin C',
  'VITD': 'Vitamin D',
  'VITE': 'Vitamin E',
  'VITK': 'Vitamin K',
  'THIA': 'Thiamin',
  'RIBF': 'Riboflavin',
  'NIA': 'Niacin',
  'VITB6': 'Vitamin B6',
  'FOL': 'Folate',
  'VITB12': 'Vitamin B12',
  'PANTAC': 'Pantothenic Acid',
  'CHOLN': 'Choline',

  // Amino Acids
  'HIS': 'Histidine',
  'ILE': 'Isoleucine',
  'LEU': 'Leucine',
  'LYS': 'Lysine',
  'MET': 'Methionine',
  'PHE': 'Phenylalanine',
  'THR': 'Threonine',
  'TRP': 'Tryptophan',
  'VAL': 'Valine',
  'ALA': 'Alanine',
  'ARG': 'Arginine',
  'ASP': 'Aspartic Acid',
  'CYS': 'Cysteine',
  'GLU': 'Glutamic Acid',
  'GLY': 'Glycine',
  'PRO': 'Proline',
  'SER': 'Serine',
  'TYR': 'Tyrosine',

  // Fatty Acids
  'FASAT': 'Saturated Fat',
  'FAMS': 'Monounsaturated Fat',
  'FAPU': 'Polyunsaturated Fat',
  'FATRN': 'Trans Fat',

  // Contaminants
  'PB': 'Lead',
  'HG': 'Mercury',
  'CD': 'Cadmium',
  'AS': 'Arsenic',
  'AL': 'Aluminum',
  'NI': 'Nickel',
  'SN': 'Tin',
  'CO': 'Cobalt',
  'SB': 'Antimony',
};

function validateINFOODS(mappings: Mapping[]): ValidationResult {
  const result: ValidationResult = {
    source: 'INFOODS',
    total: mappings.length,
    verified: 0,
    errors: [],
    warnings: [],
  };

  for (const m of mappings) {
    const tagname = m.external_id.toUpperCase();
    const expected = INFOODS_TAGNAMES[tagname];

    if (expected) {
      const ourName = m.compound_name.toLowerCase();
      const expectedLower = expected.toLowerCase();

      if (!ourName.includes(expectedLower.slice(0, 4)) &&
          !expectedLower.includes(ourName.slice(0, 4))) {
        result.errors.push({
          compound: m.compound_name,
          external_id: m.external_id,
          issue: 'INFOODS tagname mismatch',
          expected: expected,
          actual: m.compound_name,
        });
      } else {
        result.verified++;
      }
    } else {
      // Unknown tagname - just warn
      result.warnings.push({
        compound: m.compound_name,
        external_id: m.external_id,
        message: `Unknown INFOODS tagname: ${tagname}`,
      });
    }
  }

  return result;
}

// ============================================================================
// Main Validation
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const sourceFilter = args.find(a => a.startsWith('--source='))?.split('=')[1];

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         COMPOUND MAPPING VALIDATION                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Get all mappings from database
  const allMappings = await sql<Mapping[]>`
    SELECT
      c.name as compound_name,
      cs.external_source,
      cs.external_id,
      cs.source_name,
      cs.source_unit
    FROM compound_sources cs
    JOIN compounds c ON cs.compound_id = c.id
    ORDER BY cs.external_source, c.name
  `;

  console.log(`Total mappings in database: ${allMappings.length}\n`);

  // Group by source
  const bySource = new Map<string, Mapping[]>();
  for (const m of allMappings) {
    const list = bySource.get(m.external_source) || [];
    list.push(m);
    bySource.set(m.external_source, list);
  }

  // Show source distribution
  console.log('Mappings by source:');
  for (const [source, mappings] of bySource) {
    console.log(`  ${source}: ${mappings.length}`);
  }
  console.log('');

  // Check for duplicates first
  console.log('─'.repeat(60));
  console.log('Checking for duplicate external IDs...\n');
  const duplicates = await findDuplicateMappings();
  if (duplicates.length > 0) {
    console.log('⚠️  DUPLICATE IDs FOUND:');
    for (const d of duplicates) {
      console.log(`  ${d.issue}`);
    }
    console.log('');
  } else {
    console.log('✓ No duplicate external IDs found\n');
  }

  // Validate FDC if not filtered out
  if (!sourceFilter || sourceFilter === 'FDC') {
    console.log('─'.repeat(60));
    console.log('Validating FDC mappings against USDA API...\n');
    const fdcMappings = bySource.get('FDC') || [];
    const fdcResult = await validateFDC(fdcMappings);
    printResult(fdcResult);
  }

  // Validate INFOODS-based sources
  const infoodsSource = ['FOODfiles', 'Fineli', 'BLS', 'NEVO'];
  for (const source of infoodsSource) {
    if (sourceFilter && sourceFilter !== source && sourceFilter !== 'INFOODS') continue;

    const mappings = bySource.get(source) || [];
    if (mappings.length === 0) continue;

    // Filter to only INFOODS-style tagnames (alphabetic, 2-6 chars)
    const tagnameMappings = mappings.filter(m =>
      /^[A-Z]{1,6}$/.test(m.external_id.toUpperCase()) ||
      /^[A-Z]+\d*$/.test(m.external_id.toUpperCase())
    );

    if (tagnameMappings.length > 0) {
      console.log('─'.repeat(60));
      console.log(`Validating ${source} mappings (INFOODS tagnames)...\n`);
      const result = validateINFOODS(tagnameMappings);
      result.source = source;
      printResult(result);
    }
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('VALIDATION COMPLETE');
  console.log('═'.repeat(60));

  await sql.end();
}

function printResult(result: ValidationResult) {
  console.log(`${result.source}: ${result.verified}/${result.total} verified`);

  if (result.errors.length > 0) {
    console.log(`\n❌ ERRORS (${result.errors.length}):`);
    for (const e of result.errors) {
      console.log(`  ${e.compound} [${e.external_id}]: ${e.issue}`);
      if (e.expected && e.actual) {
        console.log(`    Expected: ${e.expected}`);
        console.log(`    Actual:   ${e.actual}`);
      }
    }
  }

  if (result.warnings.length > 0 && result.warnings.length <= 10) {
    console.log(`\n⚠️  WARNINGS (${result.warnings.length}):`);
    for (const w of result.warnings) {
      console.log(`  ${w.compound} [${w.external_id}]: ${w.message}`);
    }
  } else if (result.warnings.length > 10) {
    console.log(`\n⚠️  ${result.warnings.length} warnings (showing first 5):`);
    for (const w of result.warnings.slice(0, 5)) {
      console.log(`  ${w.compound} [${w.external_id}]: ${w.message}`);
    }
  }

  console.log('');
}

main().catch(console.error);
