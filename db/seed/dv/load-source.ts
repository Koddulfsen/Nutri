/**
 * Load one DV source from dv-sources/<slug>/values.json, replacing all of that
 * source's rows in a single transaction.
 *
 * Refuses to load if any compound is missing, any two values share a unique key,
 * or any value is malformed — a silent skip would drop published values.
 *
 * Run: npx tsx db/seed/dv/load-source.ts <REGION>   (e.g. USA_CANADA)
 */
import 'dotenv/config';
import postgres from 'postgres';
import { readSourceValues, valueKey } from '../../../lib/dv/source-values';
import { SOURCES } from './sources';

const region = process.argv[2];
const meta = SOURCES[region];
if (!meta) {
  console.error(`Unknown source "${region}". Known: ${Object.keys(SOURCES).join(', ')}`);
  process.exit(1);
}

const sql = postgres(process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL!, { max: 1 });

async function main() {
  const values = readSourceValues(meta.slug);

  const problems: string[] = [];
  const seen = new Map<string, string>();
  for (const v of values) {
    const k = valueKey(v);
    if (seen.has(k)) problems.push(`duplicate key ${k} (${seen.get(k)} / ${v.from})`);
    seen.set(k, v.from);
    for (const [field, x] of [['value', v.value], ['valueMin', v.valueMin], ['valueMax', v.valueMax]] as const) {
      if (x == null) continue;
      if (!Number.isFinite(x)) problems.push(`non-numeric ${field} at ${v.from}`);
      // reference_daily_values stores numeric(_, 4); more precision would be silently rounded.
      else if (Number(x.toFixed(4)) !== x) problems.push(`${field} ${x} has more than 4 decimals at ${v.from}`);
    }
    if (v.ageMaxMonths != null && v.ageMaxMonths < v.ageMinMonths) problems.push(`age range inverted at ${v.from}`);
    if (v.valueMin != null && v.valueMax != null && v.valueMin > v.valueMax) problems.push(`range inverted at ${v.from}`);
  }

  const names = [...new Set(values.map((v) => v.compound))];
  const compounds = await sql<{ id: string; name: string }[]>`
    SELECT id, name FROM compounds WHERE name = ANY(${names}) AND tier = 'core'`;
  const idByName = new Map(compounds.map((c) => [c.name, c.id]));
  for (const n of names) if (!idByName.has(n)) problems.push(`compound not found: ${n}`);

  if (problems.length) {
    console.error(`Refusing to load ${region}:\n  ${problems.slice(0, 50).join('\n  ')}`);
    process.exitCode = 1;
    return;
  }

  const result = await sql.begin(async (tx) => {
    const [source] = await tx<{ id: string }[]>`
      INSERT INTO dv_sources (authority_name, region_code, version_year, source_type, url, note, retrieved_date)
      VALUES (${meta.authorityName}, ${meta.region}, ${meta.versionYear}, 'SCIENTIFIC_DRI', ${meta.url}, ${meta.note}, ${meta.retrievedDate})
      ON CONFLICT (region_code, version_year, source_type) DO UPDATE SET
        authority_name = EXCLUDED.authority_name, url = EXCLUDED.url, note = EXCLUDED.note,
        retrieved_date = EXCLUDED.retrieved_date, updated_at = NOW()
      RETURNING id`;
    const removed = await tx`DELETE FROM reference_daily_values WHERE source_region = ${meta.region}`;
    for (const v of values) {
      await tx`
        INSERT INTO reference_daily_values (
          compound_id, source_region, source_id, age_min_months, age_max_months, sex, life_stage,
          value_type, activity_level, dietary_context, value, value_min, value_max, unit,
          is_percent_of_energy, is_provisional, value_note, source_note
        ) VALUES (
          ${idByName.get(v.compound)!}, ${meta.region}, ${source.id}, ${v.ageMinMonths}, ${v.ageMaxMonths}, ${v.sex}, ${v.lifeStage},
          ${v.valueType}, ${v.activityLevel}, ${v.dietaryContext}, ${v.value}, ${v.valueMin}, ${v.valueMax}, ${v.unit},
          ${v.isPercentOfEnergy}, ${v.isProvisional}, ${v.note}, ${v.from}
        )`;
    }
    return { removed: removed.count, inserted: values.length };
  });
  console.log(`${region}: replaced ${result.removed} rows with ${result.inserted} from dv-sources/${meta.slug}/values.json`);
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => sql.end());
