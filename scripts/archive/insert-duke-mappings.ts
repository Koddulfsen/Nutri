import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';

/**
 * Insert Duke Compound Mappings
 * Step 5 of SOURCE_MAPPING_GUIDE.md
 *
 * Inserts mappings into external_compound_mappings table for:
 * 1. Already matched compounds (254)
 * 2. Forms (3)
 * 3. New compounds (428)
 * Total: 685 mappings
 */

interface MatchedCompound {
  dukeId: string;
  compoundId: string;
  compoundName: string;
}

interface FormCompound {
  dukeId: string;
  name: string;
  type: string;
  parent: string;
}

interface NewCompound {
  dukeId: string;
  name: string;
  type: string;
  healthActs: number;
  plants: number;
}

interface MappingData {
  matched: MatchedCompound[];
  forms: FormCompound[];
  newCompounds: NewCompound[];
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  // Load mapping data
  const data: MappingData = JSON.parse(
    fs.readFileSync('data/duke-mapping-data.json', 'utf-8')
  );

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('INSERT DUKE COMPOUND MAPPINGS - Step 5');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  console.log('Data loaded:');
  console.log('  Already matched: ' + data.matched.length);
  console.log('  Forms: ' + data.forms.length);
  console.log('  New compounds: ' + data.newCompounds.length);
  console.log('  Total mappings: ' + (data.matched.length + data.forms.length + data.newCompounds.length));

  // Get compounds for lookup
  const compounds = await sql`
    SELECT id, LOWER(name) as name FROM compounds
  `;
  const compoundByName = new Map(compounds.map(c => [c.name, c.id]));

  // Check existing mappings
  const existingMappings = await sql`
    SELECT external_id FROM external_compound_mappings
    WHERE external_source = 'duke'
  `;
  const existingSet = new Set(existingMappings.map(m => m.external_id));

  console.log('\nExisting Duke mappings: ' + existingSet.size);

  // Stats
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  // ============================================================
  // 1. Insert mappings for already matched compounds
  // ============================================================
  console.log('\n--- Inserting Already Matched (254) ---\n');

  for (const match of data.matched) {
    if (existingSet.has(match.dukeId)) {
      skipped++;
      continue;
    }

    try {
      await sql`
        INSERT INTO external_compound_mappings (
          compound_id,
          external_source,
          external_id,
          external_name,
          match_status,
          match_method,
          match_confidence,
          matched_at
        ) VALUES (
          ${match.compoundId},
          'duke',
          ${match.dukeId},
          ${match.dukeId},
          'verified',
          'name_match',
          ${1.0},
          NOW()
        )
      `;
      inserted++;
      if (inserted % 50 === 0) {
        console.log(`  Inserted ${inserted}...`);
      }
    } catch (err) {
      console.log(`❌ ${match.dukeId}: ${(err as Error).message}`);
      errors++;
    }
  }

  console.log(`  Matched: ${data.matched.length} (inserted: ${inserted - 0})`);

  // ============================================================
  // 2. Insert mappings for forms
  // ============================================================
  console.log('\n--- Inserting Forms (3) ---\n');

  const formsStartCount = inserted;
  for (const form of data.forms) {
    if (existingSet.has(form.dukeId)) {
      skipped++;
      continue;
    }

    // Look up compound by name
    const compoundId = compoundByName.get(form.name.toLowerCase());
    if (!compoundId) {
      console.log(`❌ ${form.dukeId}: compound "${form.name}" not found`);
      errors++;
      continue;
    }

    try {
      await sql`
        INSERT INTO external_compound_mappings (
          compound_id,
          external_source,
          external_id,
          external_name,
          match_status,
          match_method,
          match_confidence,
          matched_at
        ) VALUES (
          ${compoundId},
          'duke',
          ${form.dukeId},
          ${form.dukeId},
          'verified',
          'form_mapping',
          ${1.0},
          NOW()
        )
      `;
      inserted++;
      console.log(`✅ ${form.dukeId} → ${form.name}`);
    } catch (err) {
      console.log(`❌ ${form.dukeId}: ${(err as Error).message}`);
      errors++;
    }
  }

  console.log(`  Forms: ${data.forms.length} (inserted: ${inserted - formsStartCount})`);

  // ============================================================
  // 3. Insert mappings for new compounds
  // ============================================================
  console.log('\n--- Inserting New Compounds (428) ---\n');

  const newStartCount = inserted;
  for (const compound of data.newCompounds) {
    if (existingSet.has(compound.dukeId)) {
      skipped++;
      continue;
    }

    // Look up compound by name
    const compoundId = compoundByName.get(compound.name.toLowerCase());
    if (!compoundId) {
      console.log(`❌ ${compound.dukeId}: compound "${compound.name}" not found`);
      errors++;
      continue;
    }

    try {
      await sql`
        INSERT INTO external_compound_mappings (
          compound_id,
          external_source,
          external_id,
          external_name,
          match_status,
          match_method,
          match_confidence,
          matched_at
        ) VALUES (
          ${compoundId},
          'duke',
          ${compound.dukeId},
          ${compound.dukeId},
          'verified',
          'new_compound',
          ${1.0},
          NOW()
        )
      `;
      inserted++;
      if ((inserted - newStartCount) % 100 === 0) {
        console.log(`  Inserted ${inserted - newStartCount}...`);
      }
    } catch (err) {
      console.log(`❌ ${compound.dukeId}: ${(err as Error).message}`);
      errors++;
    }
  }

  console.log(`  New compounds: ${data.newCompounds.length} (inserted: ${inserted - newStartCount})`);

  // ============================================================
  // Summary
  // ============================================================
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  console.log('Inserted: ' + inserted);
  console.log('Skipped (already existed): ' + skipped);
  console.log('Errors: ' + errors);

  // Get total count
  const [{ count }] = await sql`
    SELECT COUNT(*) as count FROM external_compound_mappings
    WHERE external_source = 'duke'
  `;
  console.log('\nTotal Duke mappings in database: ' + count);

  // Breakdown by status
  const statusCounts = await sql`
    SELECT match_status, COUNT(*) as count
    FROM external_compound_mappings
    WHERE external_source = 'duke'
    GROUP BY match_status
  `;
  console.log('\nBy status:');
  for (const row of statusCounts) {
    console.log(`  ${row.match_status}: ${row.count}`);
  }

  await sql.end();
}

main().catch(console.error);
