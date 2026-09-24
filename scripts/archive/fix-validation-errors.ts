/**
 * Fix Validation Errors Found by validate-all-mappings.ts
 *
 * Issues found:
 * 1. Gamma-Tocopherol: FDC 1127 should be 1126
 *    - FDC 1127 = Tocopherol, delta (wrong - that's delta!)
 *    - FDC 1126 = Tocopherol, gamma (correct)
 *
 * 2. Delta-Tocopherol: FDC 1128 should be 1127
 *    - FDC 1128 = Tocotrienol, alpha (wrong)
 *    - FDC 1127 = Tocopherol, delta (correct)
 *
 * 3. Chloride: FDC 1104 is actually Vitamin A, IU
 *    - Chloride may not exist in FDC standard nutrients
 *    - Remove incorrect mapping
 *
 * Run: npx tsx scripts/fix-validation-errors.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function fix() {
  console.log('=== Fixing Validation Errors ===\n');

  // Fix 1: Gamma-Tocopherol FDC ID (must fix first to free up 1127)
  console.log('1. Fixing Gamma-Tocopherol FDC mapping...');
  const gtCompound = await sql`SELECT id FROM compounds WHERE name = 'Gamma-Tocopherol'`;

  if (gtCompound.length > 0) {
    // Delete wrong mapping (1127 is delta, not gamma)
    const deleted = await sql`
      DELETE FROM compound_sources
      WHERE compound_id = ${gtCompound[0].id}
      AND external_source = 'FDC'
      AND external_id = '1127'
      RETURNING id
    `;

    if (deleted.length > 0) {
      console.log('   Deleted FDC 1127 from Gamma-Tocopherol');

      // Add correct mapping (1126 is gamma)
      const inserted = await sql`
        INSERT INTO compound_sources
        (compound_id, external_source, external_id, source_name, source_unit, conversion_factor, is_canonical)
        VALUES (${gtCompound[0].id}, 'FDC', '1126', 'Tocopherol, gamma', 'mg', '1.0', true)
        ON CONFLICT (external_source, external_id) DO NOTHING
        RETURNING id
      `;

      if (inserted.length > 0) {
        console.log('   Added FDC 1126 (Tocopherol, gamma)');
      } else {
        console.log('   Warning: FDC 1126 already exists or conflict');
      }
    } else {
      console.log('   FDC 1127 not found (already fixed?)');
    }
  }

  // Fix 2: Delta-Tocopherol FDC ID (now 1127 is free)
  console.log('\n2. Fixing Delta-Tocopherol FDC mapping...');
  const dtCompound = await sql`SELECT id FROM compounds WHERE name = 'Delta-Tocopherol'`;

  if (dtCompound.length > 0) {
    // Delete wrong mapping
    const deleted = await sql`
      DELETE FROM compound_sources
      WHERE compound_id = ${dtCompound[0].id}
      AND external_source = 'FDC'
      AND external_id = '1128'
      RETURNING id
    `;

    if (deleted.length > 0) {
      console.log('   Deleted FDC 1128 from Delta-Tocopherol');

      // Add correct mapping
      const inserted = await sql`
        INSERT INTO compound_sources
        (compound_id, external_source, external_id, source_name, source_unit, conversion_factor, is_canonical)
        VALUES (${dtCompound[0].id}, 'FDC', '1127', 'Tocopherol, delta', 'mg', '1.0', true)
        ON CONFLICT (external_source, external_id) DO NOTHING
        RETURNING id
      `;

      if (inserted.length > 0) {
        console.log('   Added FDC 1127 (Tocopherol, delta)');
      } else {
        console.log('   Warning: FDC 1127 already exists or conflict');
      }
    } else {
      console.log('   FDC 1128 not found (already fixed?)');
    }
  }

  // Fix 3: Chloride FDC ID - remove incorrect mapping
  console.log('\n3. Fixing Chloride FDC mapping...');
  const clCompound = await sql`SELECT id FROM compounds WHERE name = 'Chloride'`;

  if (clCompound.length > 0) {
    // Delete wrong mapping (1104 is Vitamin A, IU - not Chloride)
    const deleted = await sql`
      DELETE FROM compound_sources
      WHERE compound_id = ${clCompound[0].id}
      AND external_source = 'FDC'
      AND external_id = '1104'
      RETURNING id
    `;

    if (deleted.length > 0) {
      console.log('   Deleted FDC 1104 from Chloride (was actually Vitamin A, IU)');
      console.log('   Note: Chloride may not have a valid FDC ID');
    } else {
      console.log('   FDC 1104 not found (already fixed?)');
    }
  }

  // Verify fixes
  console.log('\n=== Verification ===');

  const gtMappings = await sql`
    SELECT cs.external_source, cs.external_id, cs.source_name
    FROM compound_sources cs
    JOIN compounds c ON cs.compound_id = c.id
    WHERE c.name = 'Gamma-Tocopherol' AND cs.external_source = 'FDC'
  `;
  console.log(`\nGamma-Tocopherol FDC: ${gtMappings.length > 0 ? `${gtMappings[0].external_id} (${gtMappings[0].source_name})` : 'none'}`);

  const dtMappings = await sql`
    SELECT cs.external_source, cs.external_id, cs.source_name
    FROM compound_sources cs
    JOIN compounds c ON cs.compound_id = c.id
    WHERE c.name = 'Delta-Tocopherol' AND cs.external_source = 'FDC'
  `;
  console.log(`Delta-Tocopherol FDC: ${dtMappings.length > 0 ? `${dtMappings[0].external_id} (${dtMappings[0].source_name})` : 'none'}`);

  const clMappings = await sql`
    SELECT cs.external_source, cs.external_id, cs.source_name
    FROM compound_sources cs
    JOIN compounds c ON cs.compound_id = c.id
    WHERE c.name = 'Chloride' AND cs.external_source = 'FDC'
  `;
  console.log(`Chloride FDC: ${clMappings.length > 0 ? `${clMappings[0].external_id} (${clMappings[0].source_name})` : 'none (removed - not in FDC)'}`);

  // Final stats
  const totalMappings = await sql`SELECT COUNT(*) as n FROM compound_sources`;
  console.log(`\nTotal mappings: ${totalMappings[0].n}`);

  await sql.end();
}

fix().catch(console.error);
