/**
 * Audit reference_daily_values.value_type against each source's vocabulary.
 *
 * The vocabulary (lib/dv/value-types.ts) records what each authority actually
 * publishes. This checks the live table against it, so a mislabelled type is
 * caught by a script instead of noticed by eye.
 *
 * FAIL  — must be fixed (exit code 1)
 * KNOWN — deviation recorded in the vocabulary's knownIssues
 * INFO  — vocabulary claims a type the data never uses (coverage gap or stale claim)
 *
 * Run: npx tsx scripts/audit-dv-types.ts
 */

import 'dotenv/config';
import postgres from 'postgres';
import { SOURCE_VALUE_TYPES, DV_FAMILY, allowedTypes, type DvValueType } from '../lib/dv/value-types';

const sql = postgres(process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL!, { max: 1 });

const fails: string[] = [];
const infos: string[] = [];

async function main() {
  const pairs = await sql<{ source_region: string; value_type: DvValueType; n: number }[]>`
    SELECT source_region, value_type, count(*)::int AS n
    FROM reference_daily_values GROUP BY 1, 2 ORDER BY 1, 2`;

  // 1. Every stored type must be one its source publishes.
  const seen = new Map<string, Set<string>>();
  for (const p of pairs) {
    if (!seen.has(p.source_region)) seen.set(p.source_region, new Set());
    seen.get(p.source_region)!.add(p.value_type);
    if (!SOURCE_VALUE_TYPES[p.source_region]) {
      fails.push(`${p.source_region}: no vocabulary entry (${p.n} rows)`);
    } else if (!allowedTypes(p.source_region).has(p.value_type)) {
      fails.push(`${p.source_region}: stores ${p.value_type} (${p.n} rows) but does not publish it`);
    }
  }

  // 2. Vocabulary types the data never uses.
  for (const [region, vocab] of Object.entries(SOURCE_VALUE_TYPES)) {
    const used = seen.get(region) ?? new Set();
    for (const t of new Set(Object.values(vocab.terms))) {
      if (!used.has(t)) infos.push(`${region}: publishes ${t}, but 0 rows stored`);
    }
  }

  // 3. Energy is EER, and only energy is EER.
  const energy = await sql<{ source_region: string; value_type: string; name: string; n: number }[]>`
    SELECT r.source_region, r.value_type, c.name, count(*)::int AS n
    FROM reference_daily_values r JOIN compounds c ON c.id = r.compound_id
    WHERE (c.name = 'Energy') <> (r.value_type = 'EER')
    GROUP BY 1, 2, 3`;
  for (const e of energy) {
    fails.push(e.name === 'Energy'
      ? `${e.source_region}: ${e.n} Energy rows typed ${e.value_type}, expected EER`
      : `${e.source_region}: ${e.n} ${e.name} rows typed EER — EER is energy only`);
  }

  // 4. Shape follows family: a RANGE carries a bound, unless it is a single
  //    %-of-energy goal (UK SACN "approximately 50% of energy from carbohydrate").
  const shape = await sql<{ source_region: string; n: number }[]>`
    SELECT source_region, count(*)::int AS n FROM reference_daily_values
    WHERE value_type = 'AMDR' AND value_min IS NULL AND value_max IS NULL
      AND NOT is_percent_of_energy
    GROUP BY 1`;
  for (const s of shape) fails.push(`${s.source_region}: ${s.n} AMDR rows with no bound and not %-of-energy`);

  // 5. Label-only types never belong in a demographic table.
  for (const p of pairs) {
    if (DV_FAMILY[p.value_type] === 'LABEL') {
      fails.push(`${p.source_region}: ${p.n} rows typed ${p.value_type} — label values, not demographic DRIs`);
    }
  }

  // Report
  const known = Object.entries(SOURCE_VALUE_TYPES).flatMap(([r, v]) => (v.knownIssues ?? []).map((k) => `${r}: ${k}`));
  const total = pairs.reduce((s, p) => s + p.n, 0);
  console.log(`reference_daily_values: ${total} rows, ${seen.size} sources\n`);
  for (const f of fails) console.log(`FAIL   ${f}`);
  for (const k of known) console.log(`KNOWN  ${k}`);
  for (const i of infos) console.log(`INFO   ${i}`);
  console.log(`\n${fails.length} fail, ${known.length} known, ${infos.length} info`);
  if (fails.length > 0) process.exitCode = 1;
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => sql.end());
