/**
 * Minerals category cleanup:
 *   1. Demote 6 supplement-form compounds (Calcium Carbonate/Citrate/Phosphate,
 *      Magnesium Oxide, Zinc Sulfate, Sodium Selenite) — no source has them.
 *   2. Rename "(Total)" compounds whose subforms are gone:
 *      - Calcium (Total) → Calcium
 *      - Magnesium (Total) → Magnesium
 *      - Zinc (Total) → Zinc
 *      - Chromium (Total) → Chromium
 *      - Cobalt (Co) → Cobalt
 *      (Iron and Selenium keep "(Total)" — they have real children)
 *   3. Flatten the structure:
 *      - Delete subgroups: Calcium, Magnesium, Zinc, Other Macro/Trace Minerals
 *      - Set compound_names on the Macro/Trace parent groups directly
 *      - Keep Iron (Total) and Selenium (Total) subgroups intact
 */
import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const APPLY = process.argv.includes('--apply');

const DEMOTE = [
  'Calcium Carbonate', 'Calcium Citrate', 'Calcium Phosphate',
  'Magnesium Oxide', 'Zinc Sulfate', 'Sodium Selenite',
];

const RENAMES: Record<string, string> = {
  'Calcium (Total)': 'Calcium',
  'Magnesium (Total)': 'Magnesium',
  'Zinc (Total)': 'Zinc',
  'Chromium (Total)': 'Chromium',
  'Cobalt (Co)': 'Cobalt',
};

// Subgroups to delete after flattening
const SUBGROUPS_TO_DELETE = ['calcium-total-', 'magnesium-total-', 'zinc-total-', 'other-macro-minerals', 'other-trace-minerals'];

// Final flat compound_names for parent groups
const MACRO_FLAT = ['Calcium', 'Magnesium', 'Phosphorus', 'Potassium', 'Sodium', 'Chloride', 'Sulfur'];
const TRACE_FLAT = ['Zinc', 'Boron', 'Chromium', 'Cobalt', 'Copper', 'Fluoride', 'Iodine', 'Manganese', 'Molybdenum', 'Silicon'];

const toPgArray = (a: string[]) => `{${a.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',')}}`;

async function main() {
  console.log(APPLY ? 'APPLY MODE' : 'DRY RUN');

  // 1. Demote
  console.log('\n=== Demoting supplement forms ===');
  for (const name of DEMOTE) {
    console.log(`  ${name} → advanced`);
    if (APPLY) {
      await db.execute(sql`UPDATE compounds SET tier = 'advanced' WHERE name = ${name}`);
      await db.execute(sql`UPDATE compound_groups SET compound_names = array_remove(compound_names, ${name})`);
    }
  }

  // 2. Renames
  console.log('\n=== Renaming compounds ===');
  for (const [oldName, newName] of Object.entries(RENAMES)) {
    console.log(`  ${oldName} → ${newName}`);
    if (APPLY) {
      await db.execute(sql`UPDATE compounds SET name = ${newName} WHERE name = ${oldName}`);
      // Replace in any compound_names arrays
      await db.execute(sql.raw(`
        UPDATE compound_groups
        SET compound_names = array_replace(compound_names, '${oldName.replace(/'/g, "''")}', '${newName.replace(/'/g, "''")}')
      `));
      // Also update group representative_compound if any
      await db.execute(sql`UPDATE compound_groups SET representative_compound = ${newName} WHERE representative_compound = ${oldName}`);
    }
  }

  // 3. Flatten — set parent group compound_names + delete subgroups
  console.log('\n=== Flattening Macro Minerals parent group ===');
  console.log(`  compound_names → ${JSON.stringify(MACRO_FLAT)}`);
  if (APPLY) {
    await db.execute(sql`UPDATE compound_groups SET compound_names = ${toPgArray(MACRO_FLAT)}::text[] WHERE slug = 'macro-minerals'`);
  }

  console.log('\n=== Flattening Trace Minerals parent group ===');
  console.log(`  compound_names → ${JSON.stringify(TRACE_FLAT)}`);
  console.log('  (Iron (Total) and Selenium (Total) subgroups remain as before)');
  if (APPLY) {
    await db.execute(sql`UPDATE compound_groups SET compound_names = ${toPgArray(TRACE_FLAT)}::text[] WHERE slug = 'trace-minerals'`);
  }

  console.log('\n=== Deleting empty/redundant subgroups ===');
  for (const slug of SUBGROUPS_TO_DELETE) {
    console.log(`  DELETE ${slug}`);
    if (APPLY) {
      await db.execute(sql`DELETE FROM compound_groups WHERE slug = ${slug}`);
    }
  }

  if (!APPLY) console.log('\nDry run. Re-run with --apply.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
