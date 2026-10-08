/**
 * Cysteine and Cystine are one nutrient in every food table we load; our two compounds are a mapping
 * accident. FOODFILES, KFCT and MEXT all publish the component under the code `CYS` — FOODFILES names
 * it "Cystine" — and we pointed those at a `Cystine` compound, while FRIDA's `CYS` (also named
 * "Cystine", EuroFIR code CYS) went to `Cysteine` along with FDC, BLS, CNF, FOODB and AFCD. Same
 * nutrient, two destinations. The data agrees it is one thing: 69 foods carry both, median ratio 1.18,
 * 60 of 69 within 2x — ordinary cross-source variation, not two different chemicals.
 *
 * DUKE is deliberately NOT moved. It is the one source that publishes CYSTEINE and CYSTINE as separate
 * entries, so it genuinely makes the distinction and collapsing it would destroy information the source
 * actually has. DUKE is alpha-excluded and unloaded, so no merged value depends on that choice today.
 *
 * merged_nutrients cannot be rebuilt from scratch here: food_sources.composition is null for these
 * sources, so the per-source values are not recoverable offline. Instead each food's two merged values
 * are combined by a source_count-weighted mean after unit conversion, which reproduces what the merge
 * would have produced from the pooled source set — merge.ts takes a plain mean, and its >100x outlier
 * guard cannot fire here (the widest disagreement between the two is 7.5x).
 *
 * Idempotent: a second run finds no Cystine rows and reports nothing to do.
 *
 *   npx tsx scripts/merge-cystine-into-cysteine.ts            # dry run, prints every change
 *   npx tsx scripts/merge-cystine-into-cysteine.ts --apply
 */
import 'dotenv/config';
import postgres from 'postgres';

const APPLY = process.argv.includes('--apply');
const sql = postgres(process.env.MIGRATION_DATABASE_URL!, { max: 1 });
/** The sources whose CYS component is the standard food-table one. DUKE is absent on purpose. */
const MOVE_SOURCES = ['FOODFILES', 'KFCT', 'MEXT'];
const TO_G: Record<string, number> = { g: 1, mg: 0.001, 'µg': 1e-6, 'μg': 1e-6, ug: 1e-6 };

async function main() {
  const [cysteine] = await sql`SELECT id FROM compounds WHERE name = 'Cysteine'`;
  const [cystine] = await sql`SELECT id FROM compounds WHERE name = 'Cystine'`;
  if (!cysteine || !cystine) throw new Error('Cysteine and Cystine must both exist');

  // ── 1. mappings ───────────────────────────────────────────────────────────────────────────────
  const maps = await sql`SELECT id, external_source::text src, external_id FROM compound_sources
    WHERE compound_id = ${cystine.id} AND external_source::text = ANY(${MOVE_SOURCES})`;
  console.log(`mappings to repoint at Cysteine: ${maps.length}`);
  for (const m of maps as any[]) console.log(`  ${m.src.padEnd(11)} ${m.external_id}`);
  const kept = await sql`SELECT external_source::text src, external_id FROM compound_sources
    WHERE compound_id = ${cystine.id} AND NOT (external_source::text = ANY(${MOVE_SOURCES}))`;
  for (const m of kept as any[]) console.log(`  (kept on Cystine: ${m.src} ${m.external_id} — that source publishes both)`);

  // ── 2. merged values ──────────────────────────────────────────────────────────────────────────
  const rows = await sql`
    SELECT f.name food, b.id cystine_row, b.average_value::float8 b_val, b.unit b_unit, b.source_count b_n,
           a.id cysteine_row, a.average_value::float8 a_val, a.unit a_unit, a.source_count a_n
    FROM merged_nutrients b
    JOIN foods f ON f.id = b.food_id
    LEFT JOIN merged_nutrients a ON a.food_id = b.food_id AND a.compound_id = ${cysteine.id}
    WHERE b.compound_id = ${cystine.id}
    ORDER BY f.name`;
  console.log(`\nmerged_nutrients rows on Cystine: ${rows.length}`);
  let moved = 0, combined = 0;
  const plan: Array<{ id: string; value: number; unit: string; n: number; drop: string }> = [];
  for (const r of rows as any[]) {
    const bInG = r.b_val * (TO_G[r.b_unit] ?? NaN);
    if (!Number.isFinite(bInG)) throw new Error(`unknown unit ${r.b_unit} on ${r.food}`);
    if (!r.cysteine_row) {
      // Nothing to combine with: carry the value over as-is, converted to the Cysteine convention.
      plan.push({ id: '', value: bInG, unit: 'g', n: r.b_n, drop: r.cystine_row });
      console.log(`  ${r.food.padEnd(28)} move   ${r.b_val} ${r.b_unit} -> ${bInG.toPrecision(4)} g (${r.b_n} src)`);
      moved++;
    } else {
      const aInG = r.a_val * (TO_G[r.a_unit] ?? NaN);
      const n = r.a_n + r.b_n;
      const combinedVal = (aInG * r.a_n + bInG * r.b_n) / n;
      plan.push({ id: r.cysteine_row, value: combinedVal, unit: 'g', n, drop: r.cystine_row });
      console.log(`  ${r.food.padEnd(28)} combine ${aInG.toPrecision(4)}g(${r.a_n}) + ${bInG.toPrecision(4)}g(${r.b_n}) -> ${combinedVal.toPrecision(4)}g(${n})`);
      combined++;
    }
  }
  console.log(`\n${combined} combined, ${moved} carried over`);

  if (!APPLY) { console.log('\nDRY RUN — nothing written. Re-run with --apply.'); return; }

  await sql.begin(async (tx) => {
    for (const m of maps as any[]) await tx`UPDATE compound_sources SET compound_id = ${cysteine.id} WHERE id = ${m.id}`;
    for (const p of plan) {
      if (p.id) {
        await tx`UPDATE merged_nutrients SET average_value = ${p.value}, unit = 'g', source_count = ${p.n}, updated_at = now() WHERE id = ${p.id}`;
        await tx`DELETE FROM merged_nutrients WHERE id = ${p.drop}`;
      } else {
        await tx`UPDATE merged_nutrients SET compound_id = ${cysteine.id}, average_value = ${p.value}, unit = 'g', updated_at = now() WHERE id = ${p.drop}`;
      }
    }
  });
  console.log('\napplied.');
}
main().then(() => process.exit(0));
