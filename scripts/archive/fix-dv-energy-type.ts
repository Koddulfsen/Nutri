/**
 * Relabel energy reference values as EER.
 *
 * Energy was stored under whatever each seed script chose: EAR for 7 sources
 * ("average requirement for energy") and RDA for Russia, India and Singapore.
 * Neither is right for aggregation — EAR is never a target, and RDA would be
 * averaged with 97.5%-coverage nutrient values. Energy is its own family.
 *
 * Only the label changes; no value is touched. Idempotent.
 *
 * Run: npx tsx scripts/fix-dv-energy-type.ts [--dry-run]
 */

import 'dotenv/config';
import postgres from 'postgres';

const dryRun = process.argv.includes('--dry-run');
const sql = postgres(process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL!, { max: 1 });

async function main() {
  const before = await sql`
    SELECT r.source_region, r.value_type, count(*)::int AS n
    FROM reference_daily_values r JOIN compounds c ON c.id = r.compound_id
    WHERE c.name = 'Energy'
    GROUP BY 1, 2 ORDER BY 1, 2`;
  console.table(before);

  const pending = before.filter((r) => r.value_type !== 'EER');
  const total = pending.reduce((s, r) => s + r.n, 0);
  if (total === 0) {
    console.log('Nothing to do — all energy rows are already EER.');
    return;
  }

  // A source storing BOTH types for one demographic would collide on the unique index.
  const collisions = await sql`
    SELECT r.source_region, r.age_min_months, r.age_max_months, r.sex, r.life_stage, r.activity_level, count(*)::int AS n
    FROM reference_daily_values r JOIN compounds c ON c.id = r.compound_id
    WHERE c.name = 'Energy'
    GROUP BY 1, 2, 3, 4, 5, 6, r.dietary_context HAVING count(*) > 1`;
  if (collisions.length > 0) {
    console.table(collisions);
    throw new Error(`${collisions.length} demographics have more than one energy row — relabelling would collide. Aborting.`);
  }

  if (dryRun) {
    console.log(`[dry-run] Would relabel ${total} energy rows to EER.`);
    return;
  }

  const updated = await sql`
    UPDATE reference_daily_values r SET value_type = 'EER', last_updated = now()
    FROM compounds c
    WHERE c.id = r.compound_id AND c.name = 'Energy' AND r.value_type <> 'EER'`;
  console.log(`Relabelled ${updated.count} energy rows to EER (expected ${total}).`);
  if (updated.count !== total) throw new Error('Row count mismatch');
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => sql.end());
