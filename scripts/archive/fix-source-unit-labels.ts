/**
 * Normalize four `compound_sources.source_unit` labels that carried a magnitude
 * only implicitly. These are LABEL fixes, not maths fixes — every one already had
 * the correct conversion_factor of 1.0, confirmed by every peer source mapping the
 * same compound at 1.0 with a plain unit (see the query in the commit message).
 *
 *   FRIDA  'NE'      -> 'mg NE'        niacin equivalents, reported in mg/100g
 *   FRIDA  'alfa-TE' -> 'mg alfa-TE'   alpha-tocopherol equivalents, mg/100g
 *   MATVAR 'mg-ATE'  -> 'mg ATE'       already says mg; hyphen hid it from parsing
 *   MEXT   '……g……'   -> 'g'            leader-dot artifact from the Japanese
 *                                      Standard Tables unit row; alcohol is g/100g
 *
 * Safe to relabel: `compound_sources.source_unit` is audit metadata. Runtime maths
 * reads `conversion_factor`, and the per-food `sourceUnit` returned by the source
 * clients comes from each raw `source_*_nutrients` table, not from this column.
 *
 * The two Vitamin E labels also originate in scripts/seed/04-vitamin-e.ts, which is
 * updated to match so a re-seed does not reintroduce them.
 *
 * Idempotent: matches on the old label, so a second run reports 0 changes.
 *
 * Run: npx tsx scripts/fix-source-unit-labels.ts [--dry-run]
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const LABELS = [
  { source: 'FRIDA',           externalId: 'NIAEQ', from: 'NE',      to: 'mg NE' },
  { source: 'FRIDA',           externalId: 'VITE',  from: 'alfa-TE', to: 'mg alfa-TE' },
  { source: 'MATVARETABELLEN', externalId: 'Vit E', from: 'mg-ATE',  to: 'mg ATE' },
  { source: 'MEXT',            externalId: 'ALC',   from: '……g……',   to: 'g' },
];

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`=== source_unit label normalization ${dryRun ? '(DRY RUN)' : ''} ===\n`);

  let total = 0;

  for (const l of LABELS) {
    const targets = await sql`
      SELECT cs.id, c.name, cs.conversion_factor
      FROM compound_sources cs
      JOIN compounds c ON c.id = cs.compound_id
      WHERE cs.external_source = ${l.source}
        AND cs.external_id = ${l.externalId}
        AND cs.source_unit = ${l.from}
    `;

    console.log(`${l.source} ${l.externalId}: ${JSON.stringify(l.from)} -> ${JSON.stringify(l.to)}  (${targets.length} rows)`);

    if (targets.length === 0) {
      console.log('  nothing to do — already applied or no match\n');
      continue;
    }

    // A label fix must never be hiding a factor problem.
    for (const t of targets as any[]) {
      if (parseFloat(t.conversion_factor) !== 1.0) {
        throw new Error(
          `${t.name} has factor ${t.conversion_factor}, not 1.0 — this is not a label-only fix. Aborting.`
        );
      }
      console.log(`  ${t.name} (factor ${t.conversion_factor})`);
    }

    if (!dryRun) {
      const ids = (targets as any[]).map((t) => t.id);
      const updated = await sql`
        UPDATE compound_sources
        SET source_unit = ${l.to}
        WHERE id = ANY(${ids}) AND source_unit = ${l.from}
        RETURNING id
      `;
      if (updated.length !== targets.length) {
        throw new Error(`Expected ${targets.length} updates, got ${updated.length}. Aborting.`);
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
