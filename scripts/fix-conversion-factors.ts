/**
 * Fix the confirmed-wrong conversion factors in compound_sources.
 *
 * Conversion factors are applied at READ time, so a wrong factor never crashes —
 * it yields a plausible number. These were identified in docs/AUDIT-2026-08-11.md
 * (CLAUDE.md §6) and verified against the live DB on 2026-08-22: all still at 1.0.
 *
 * FRIDA reports per 100 g, so the "/100g" suffix is a basis note, not a magnitude.
 * Only the magnitude prefix matters:
 *   mg/100g -> g   : x0.001  (was 1000x too HIGH)
 *   µg/100g -> mg  : x0.001  (was 1000x too HIGH)
 *   g/100g  -> mg  : x1000   (was 1000x too LOW)
 *
 * NOT touched (judgment calls, owner decision — see CLAUDE.md §6):
 *   - FRIDA Niacin "NE" vs canonical "mg NE"
 *   - MEXT '……g……' placeholder units
 *   - FRIDA Energy kcal/100 g -> kcal (factor 1 is CORRECT; same magnitude)
 *   - DUKE ppm -> g (already 0.0001; verified correct)
 *
 * Idempotent: matches on the current factor, so a second run reports 0 changes.
 *
 * Run: npx tsx scripts/fix-conversion-factors.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

type Fix = {
  label: string;
  source: string;
  sourceUnit: string;
  canonicalUnit: string;
  from: number;
  to: number;
};

const FIXES: Fix[] = [
  {
    label: 'FRIDA amino acids  mg/100g -> g',
    source: 'FRIDA',
    sourceUnit: 'mg/100g',
    canonicalUnit: 'g',
    from: 1.0,
    to: 0.001,
  },
  {
    label: 'FRIDA Boron/Fluoride  µg/100g -> mg',
    source: 'FRIDA',
    sourceUnit: 'µg/100g',
    canonicalUnit: 'mg',
    from: 1.0,
    to: 0.001,
  },
  {
    label: 'FRIDA Salt  g/100g -> mg',
    source: 'FRIDA',
    sourceUnit: 'g/100g',
    canonicalUnit: 'mg',
    from: 1.0,
    to: 1000,
  },
  // 1 ppm = 1 mg/kg = 0.1 mg/100g = 0.0001 g/100g.
  // DUKE already stores 78 rows at 0.0001 (g) and 44 at 0.1 (mg); these stragglers
  // were left at 1.0. The existing majority confirms the per-100g basis.
  {
    label: 'DUKE  ppm -> g',
    source: 'DUKE',
    sourceUnit: 'ppm',
    canonicalUnit: 'g',
    from: 1.0,
    to: 0.0001,
  },
  {
    label: 'DUKE  ppm -> mg',
    source: 'DUKE',
    sourceUnit: 'ppm',
    canonicalUnit: 'mg',
    from: 1.0,
    to: 0.1,
  },
];

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`=== Conversion factor fixes ${dryRun ? '(DRY RUN)' : ''} ===\n`);

  let total = 0;

  for (const fix of FIXES) {
    // Select first so we can name every row we are about to change.
    const targets = await sql`
      SELECT cs.id, c.name
      FROM compound_sources cs
      JOIN compounds c ON c.id = cs.compound_id
      WHERE cs.external_source = ${fix.source}
        AND cs.source_unit = ${fix.sourceUnit}
        AND c.unit = ${fix.canonicalUnit}
        AND cs.conversion_factor::numeric = ${fix.from}
      ORDER BY c.name
    `;

    console.log(`${fix.label}`);
    console.log(`  factor ${fix.from} -> ${fix.to}   (${targets.length} rows)`);

    if (targets.length === 0) {
      console.log('  nothing to do — already applied or no match\n');
      continue;
    }

    console.log(`  ${targets.map((t) => t.name).join(', ')}`);

    if (!dryRun) {
      const ids = targets.map((t) => t.id);
      const updated = await sql`
        UPDATE compound_sources
        SET conversion_factor = ${fix.to}
        WHERE id = ANY(${ids})
          AND conversion_factor::numeric = ${fix.from}
        RETURNING id
      `;
      if (updated.length !== targets.length) {
        throw new Error(
          `Expected to update ${targets.length} rows, updated ${updated.length}. Aborting.`
        );
      }
      console.log(`  updated ${updated.length}`);
      total += updated.length;
    }
    console.log();
  }

  console.log(dryRun ? 'Dry run complete — no writes.' : `Done. ${total} rows updated.`);
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
