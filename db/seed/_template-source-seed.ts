/**
 * TEMPLATE — copy this to seed-<region>-<authority>-<year>.ts for a new source.
 *
 * Follow the 5-gate pipeline documented in db/seed/SOURCING.md.
 * Before filling this in, run Gate 2:
 *   npx tsx scripts/check-source-compound-names.ts "Name1" "Name2" ...
 * and paste the generated COMPOUND_NAME_MAP below.
 *
 * Run: npx tsx db/seed/seed-<region>-<authority>-<year>.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

// ═══════════════════════════════════════════════════════════════
// Gate 1 — Source metadata
// ═══════════════════════════════════════════════════════════════

const SOURCE = {
  authorityName: 'TODO: full authority name',
  regionCode: 'TODO',             // e.g. 'ITALY', 'INDIA', 'KOREA' — must match source_region_enum
  versionYear: 2024,              // year of the authority's publication
  sourceType: 'SCIENTIFIC_DRI' as const,
  url: 'https://...',
  note: 'TODO: short description of what this source publishes, value-type legend, special notes',
  retrievedDate: 'YYYY-MM-DD',
};

// ═══════════════════════════════════════════════════════════════
// Gate 2 — Compound name map
// Paste the suggested map from check-source-compound-names.ts.
// Any source label NOT in this map must match a DB name exactly.
// ═══════════════════════════════════════════════════════════════

const COMPOUND_NAME_MAP: Record<string, string> = {
  // "Vitamin A": "Vitamin A (RAE)",
  // ...
};
function resolveDbName(n: string): string {
  return COMPOUND_NAME_MAP[n] ?? n;
}

// ═══════════════════════════════════════════════════════════════
// Gate 3 — Raw values
// Prefer importing from dv-sources/<source>/raw-values.ts for a clean split.
// For small sources inlining is acceptable.
// ═══════════════════════════════════════════════════════════════

type Sex = 'MALE' | 'FEMALE';
type LifeStage = 'NONE' | 'PREGNANT' | 'PREGNANT_T1' | 'PREGNANT_T2' | 'PREGNANT_T3'
                | 'LACTATING' | 'LACTATING_0_6M' | 'LACTATING_7_12M';

interface SeedRow {
  compoundName: string;
  ageMinMonths: number;
  ageMaxMonths: number | null;  // null = open-ended (e.g., 71+)
  sex: Sex;
  lifeStage: LifeStage;
  valueType: 'RDA' | 'AI' | 'EAR' | 'UL' | 'CDRR' | 'SDT' | 'AMDR' | 'DV' | 'RI' | 'NRV_R' | 'NRV_NCD';
  value: number;
  valueMin?: number;
  valueMax?: number;
  unit: string;
  isPercentOfEnergy?: boolean;
  isProvisional?: boolean;
  valueNote?: string | null;
}

// TODO: build your rows here. Example:
//
// function buildAllRows(): SeedRow[] {
//   const rows: SeedRow[] = [];
//   rows.push({
//     compoundName: 'Vitamin C',
//     ageMinMonths: 300, ageMaxMonths: 611,
//     sex: 'FEMALE', lifeStage: 'NONE',
//     valueType: 'RDA', value: 95, unit: 'mg',
//   });
//   return rows;
// }

function buildAllRows(): SeedRow[] {
  return []; // TODO
}

// ═══════════════════════════════════════════════════════════════
// Gate 4+5 — Insert (idempotent via ON CONFLICT DO UPDATE)
// Do not modify unless you know what you're doing.
// ═══════════════════════════════════════════════════════════════

async function seed() {
  console.log(`🌱 Seeding ${SOURCE.authorityName}...\n`);

  const [source] = await sql`
    INSERT INTO dv_sources (
      authority_name, region_code, version_year, source_type, url, note, retrieved_date
    ) VALUES (
      ${SOURCE.authorityName}, ${SOURCE.regionCode}, ${SOURCE.versionYear},
      ${SOURCE.sourceType}, ${SOURCE.url}, ${SOURCE.note}, ${SOURCE.retrievedDate}
    )
    ON CONFLICT (region_code, version_year, source_type)
    DO UPDATE SET
      authority_name = EXCLUDED.authority_name,
      url = EXCLUDED.url,
      note = EXCLUDED.note,
      retrieved_date = EXCLUDED.retrieved_date,
      updated_at = NOW()
    RETURNING id
  `;
  console.log(`✓ Source row: ${source.id}\n`);

  const rows = buildAllRows();
  console.log(`Prepared ${rows.length} reference values.\n`);

  const names = [...new Set(rows.map((r) => resolveDbName(r.compoundName)))];
  const compoundRows = await sql`
    SELECT id, name FROM compounds WHERE name = ANY(${names}) AND tier = 'core'
  `;
  const idByName = new Map(compoundRows.map((r: any) => [r.name, r.id]));
  const missing = names.filter((n) => !idByName.has(n));
  if (missing.length > 0) {
    console.log(`⚠️  Compounds not found (rows for these will be skipped): ${missing.join(', ')}\n`);
  }

  let inserted = 0, updated = 0, skipped = 0;
  for (const row of rows) {
    const compoundId = idByName.get(resolveDbName(row.compoundName));
    if (!compoundId) { skipped++; continue; }

    const result = await sql`
      INSERT INTO reference_daily_values (
        compound_id, source_region, source_id,
        age_min_months, age_max_months,
        sex, life_stage, value_type,
        value, value_min, value_max, unit,
        is_percent_of_energy, is_provisional, value_note
      ) VALUES (
        ${compoundId}, ${SOURCE.regionCode}, ${source.id},
        ${row.ageMinMonths}, ${row.ageMaxMonths},
        ${row.sex}, ${row.lifeStage}, ${row.valueType},
        ${row.value}, ${row.valueMin ?? null}, ${row.valueMax ?? null}, ${row.unit},
        ${row.isPercentOfEnergy ?? false}, ${row.isProvisional ?? false}, ${row.valueNote ?? null}
      )
      ON CONFLICT (compound_id, source_region, age_min_months, age_max_months, sex, life_stage, value_type, activity_level, dietary_context)
      DO UPDATE SET
        value = EXCLUDED.value,
        value_min = EXCLUDED.value_min,
        value_max = EXCLUDED.value_max,
        unit = EXCLUDED.unit,
        source_id = EXCLUDED.source_id,
        is_provisional = EXCLUDED.is_provisional,
        value_note = EXCLUDED.value_note
      RETURNING (xmax = 0) AS inserted
    `;
    if (result[0]?.inserted) inserted++; else updated++;
  }

  console.log('─'.repeat(60));
  console.log(`✅ Seed complete`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Updated:  ${updated}`);
  console.log(`   Skipped:  ${skipped} (compound not found)`);
  console.log('─'.repeat(60));
}

seed()
  .catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); })
  .finally(() => sql.end());
