/**
 * Prove the database holds exactly a source's values.json: every value present with
 * the same number, range, unit and flags; no row the file does not contain.
 *
 * Run: npx tsx scripts/dv-verify/check-source-db.ts <REGION>
 */
import 'dotenv/config';
import postgres from 'postgres';
import { readSourceValues, valueKey } from '../../lib/dv/source-values';
import { SOURCES } from '../../db/seed/dv/sources';

const region = process.argv[2];
const meta = SOURCES[region];
if (!meta) { console.error(`Unknown source "${region}"`); process.exit(1); }
const sql = postgres(process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL!, { max: 1 });

async function main() {
  const expected = new Map(readSourceValues(meta.slug).map((v) => [valueKey(v), v]));
  const rows = await sql`
    SELECT c.name compound, r.value_type "valueType", r.sex, r.life_stage "lifeStage", r.age_min_months "ageMinMonths",
      r.age_max_months "ageMaxMonths", r.activity_level "activityLevel", r.dietary_context "dietaryContext",
      r.value, r.value_min "valueMin", r.value_max "valueMax", r.unit, r.is_percent_of_energy "isPercentOfEnergy",
      r.is_provisional "isProvisional"
    FROM reference_daily_values r JOIN compounds c ON c.id = r.compound_id
    WHERE r.source_region = ${meta.region}`;
  const num = (x: unknown) => (x == null ? null : Number(x));
  let fails = 0;
  const seen = new Set<string>();
  for (const r of rows) {
    const k = valueKey(r as any);
    seen.add(k);
    const e = expected.get(k);
    if (!e) { fails++; console.log(`FAIL extra ${k}`); continue; }
    const diffs = [
      num(r.value) !== e.value && `value ${r.value} vs ${e.value}`,
      num(r.valueMin) !== e.valueMin && `min ${r.valueMin} vs ${e.valueMin}`,
      num(r.valueMax) !== e.valueMax && `max ${r.valueMax} vs ${e.valueMax}`,
      r.unit !== e.unit && `unit ${r.unit} vs ${e.unit}`,
      r.isPercentOfEnergy !== e.isPercentOfEnergy && 'isPercentOfEnergy',
      r.isProvisional !== e.isProvisional && 'isProvisional',
    ].filter(Boolean);
    if (diffs.length) { fails++; console.log(`FAIL ${k}: ${diffs.join('; ')} (${e.from})`); }
  }
  for (const [k, e] of expected) if (!seen.has(k)) { fails++; console.log(`FAIL missing ${k} (${e.from})`); }
  console.log(`${region}: ${expected.size} values in file, ${rows.length} db rows, ${fails} failures`);
  if (fails) process.exitCode = 1;
}
main().finally(() => sql.end());
