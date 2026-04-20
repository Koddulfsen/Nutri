/**
 * Fix Compound Mapping Errors
 *
 * This script fixes the following documented errors:
 *
 * 1. Galactose has FDC 1087 (wrong - that's Calcium's ID)
 *    - Delete: FDC 1087 from Galactose
 *    - Add: FDC 1075 to Galactose (correct ID)
 *
 * 2. Calcium (Total) missing FDC mapping
 *    - Add: FDC 1087 to Calcium (now available)
 *
 * 3. Iodine has FDC 1012 (wrong - that's Fructose's ID)
 *    - Delete: FDC 1012 from Iodine (if it was added)
 *    - Add: FDC 1100 to Iodine (correct ID)
 *
 * 4. Chromium has CNF 304 (wrong - that's Magnesium's ID)
 *    - Delete: CNF 304 from Chromium (if it was added)
 *    - Add: CNF 310 to Chromium (correct ID)
 *
 * Run: npx tsx scripts/fix-mapping-errors.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

interface Fix {
  compound: string;
  action: 'delete' | 'add';
  source: string;
  externalId: string;
  sourceName?: string;
  sourceUnit?: string;
  conversionFactor?: string;
  isCanonical?: boolean;
}

const fixes: Fix[] = [
  // Fix 1: Galactose FDC ID
  { compound: 'Galactose', action: 'delete', source: 'FDC', externalId: '1087' },
  { compound: 'Galactose', action: 'add', source: 'FDC', externalId: '1075', sourceName: 'Galactose', sourceUnit: 'g', conversionFactor: '1.0', isCanonical: true },

  // Fix 2: Calcium FDC ID
  { compound: 'Calcium (Total)', action: 'add', source: 'FDC', externalId: '1087', sourceName: 'Calcium, Ca', sourceUnit: 'mg', conversionFactor: '1.0', isCanonical: true },

  // Fix 3: Iodine FDC ID
  { compound: 'Iodine', action: 'delete', source: 'FDC', externalId: '1012' },
  { compound: 'Iodine', action: 'add', source: 'FDC', externalId: '1100', sourceName: 'Iodine, I', sourceUnit: 'µg', conversionFactor: '1.0', isCanonical: true },

  // Fix 4: Chromium CNF ID
  { compound: 'Chromium (Total)', action: 'delete', source: 'CNF', externalId: '304' },
  { compound: 'Chromium (Total)', action: 'add', source: 'CNF', externalId: '310', sourceName: 'Chromium', sourceUnit: 'µg', conversionFactor: '1.0' },
];

async function applyFixes() {
  console.log('=== Applying Mapping Fixes ===\n');

  let deletions = 0;
  let additions = 0;

  for (const fix of fixes) {
    // Get compound ID
    const [compound] = await sql`SELECT id FROM compounds WHERE name = ${fix.compound}`;
    if (!compound) {
      console.log(`⚠ Compound not found: ${fix.compound}`);
      continue;
    }

    if (fix.action === 'delete') {
      const result = await sql`
        DELETE FROM compound_sources
        WHERE compound_id = ${compound.id}
        AND external_source = ${fix.source}
        AND external_id = ${fix.externalId}
        RETURNING id
      `;
      if (result.length > 0) {
        console.log(`✓ Deleted ${fix.source} ${fix.externalId} from ${fix.compound}`);
        deletions++;
      } else {
        console.log(`- ${fix.source} ${fix.externalId} not found on ${fix.compound} (already removed or never added)`);
      }
    } else {
      // Check if already exists
      const existing = await sql`
        SELECT id FROM compound_sources
        WHERE external_source = ${fix.source} AND external_id = ${fix.externalId}
      `;
      if (existing.length > 0) {
        console.log(`- ${fix.source} ${fix.externalId} already exists (skipping)`);
        continue;
      }

      const result = await sql`
        INSERT INTO compound_sources
        (compound_id, external_source, external_id, source_name, source_unit, conversion_factor, is_canonical)
        VALUES (${compound.id}, ${fix.source}, ${fix.externalId}, ${fix.sourceName!}, ${fix.sourceUnit!}, ${fix.conversionFactor!}, ${fix.isCanonical ?? false})
        RETURNING id
      `;
      if (result.length > 0) {
        console.log(`✓ Added ${fix.source} ${fix.externalId} to ${fix.compound}`);
        additions++;
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Deletions: ${deletions}`);
  console.log(`Additions: ${additions}`);

  // Verify the fixes
  console.log('\n=== Verification ===');

  const verifyCompounds = ['Galactose', 'Calcium (Total)', 'Iodine', 'Chromium (Total)'];
  for (const name of verifyCompounds) {
    const mappings = await sql`
      SELECT cs.external_source, cs.external_id, cs.source_name
      FROM compound_sources cs
      JOIN compounds c ON cs.compound_id = c.id
      WHERE c.name = ${name}
      ORDER BY cs.external_source
    `;
    console.log(`\n${name}: ${mappings.length} mappings`);
    const fdcMap = mappings.find(m => m.external_source === 'FDC');
    const cnfMap = mappings.find(m => m.external_source === 'CNF');
    if (fdcMap) console.log(`  FDC: ${fdcMap.external_id} (${fdcMap.source_name})`);
    if (cnfMap) console.log(`  CNF: ${cnfMap.external_id} (${cnfMap.source_name})`);
  }
}

applyFixes().catch(console.error).finally(() => sql.end());
