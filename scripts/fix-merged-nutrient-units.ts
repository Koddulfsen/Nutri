/**
 * Relabel merged_nutrients rows whose unit is wrong, without touching rows whose unit is right.
 *
 * `lib/services/nutrient-mapper.ts` picks a unit as `STANDARD_UNITS[name] || unit || 'g'`, and that
 * dictionary holds 52 entries against 280 compounds. Everything missing from it, from a source that
 * sends no unit, is silently stored as grams. CLAUDE.md §6b recorded this as cosmetic. It is not:
 * choline is stored for 87 foods as grams while the values are milligrams — carrot at 8.8 and garlic at
 * 23.2, which are exactly the published mg figures, and beef liver at 166.8, which as grams would make
 * the liver 167 % choline by mass. The bar reads a thousand times high.
 *
 * What this does NOT do is relabel by name. Most `g` rows are correct: leucine at 3 g per 100 g is
 * ordinary for a protein-rich food, and cod liver oil really is about 10 % DHA. A row is only changed
 * when BOTH of these hold:
 *
 *   1. Its unit disagrees with the compound's canonical unit — the one the daily-value authorities use,
 *      which is independent of anything the food importer decided.
 *   2. Its magnitude is impossible for the unit it claims: a value that, read as written, would exceed
 *      what 100 g of food can physically contain, or (for a zero) carries no quantity at all.
 *
 * Zeros are relabelled too. A zero adds nothing to a total, but `aggregateTotals` used to take the
 * total's LABEL from whichever row came first, so a zero in the wrong unit could relabel a real
 * quantity — see lib/nutrition/intake-to-percent.test.ts. The runtime now defends against that; this
 * removes the hazard at the source.
 *
 * Idempotent. Run with --dry-run first, as ever.
 */
import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL!, { max: 1 });
const DRY = process.argv.includes('--dry-run');

/** Grams of a single compound that 100 g of food could conceivably contain. */
const MAX_G_PER_100G = 100;

/**
 * Compounds whose stored unit is wrong for every row, established by comparing our values against
 * published figures rather than by inference. A rule goes here only with that evidence written down,
 * because relabelling a row that was right is the same class of error as leaving one that was wrong.
 */
const VERIFIED_RELABEL: Record<string, { from: string; to: string; evidence: string }> = {
  'Choline (Total)': {
    from: 'g',
    to: 'mg',
    evidence:
      'Our stored values match the published milligram figures exactly, food after food: broccoli 18.7, ' +
      'carrot 8.8, chickpea 99.3, garlic 23.2, kale 0.4, lentils 96.4 — all identical to USDA per 100 g ' +
      'in mg. Read as grams, beef liver would be 167 % choline by mass. Choline does not occur at gram ' +
      'scale in food, so no row of this compound is correctly labelled g.',
  },
};

const norm = (u: string) => u.replace('μ', 'µ').trim();
const MASS: Record<string, number> = { g: 1, mg: 1e-3, 'µg': 1e-6, ug: 1e-6 };

async function main() {
  // The canonical unit per compound, taken from the authorities rather than from the food importers.
  const dvUnits = await sql<Array<{ compound_id: string; unit: string; n: number }>>`
    SELECT compound_id, unit, count(*)::int n FROM reference_daily_values
    WHERE unit IS NOT NULL GROUP BY 1, 2 ORDER BY 1, 3 DESC`;
  const canonical = new Map<string, string>();
  for (const r of dvUnits) if (!canonical.has(r.compound_id)) canonical.set(r.compound_id, norm(r.unit));

  const rows = await sql<Array<{ id: string; compound_id: string; unit: string; value: number; compound: string; food: string }>>`
    SELECT m.id, m.compound_id, m.unit, m.average_value::float8 value, c.name compound, f.name food
    FROM merged_nutrients m JOIN compounds c ON c.id = m.compound_id JOIN foods f ON f.id = m.food_id
    WHERE m.compound_id IS NOT NULL`;

  const fixes: Array<{ id: string; from: string; to: string; why: string; compound: string; food: string; value: number }> = [];

  for (const r of rows) {
    const want = canonical.get(r.compound_id);
    if (!want) continue;                          // no authority states a unit: nothing to compare against
    const have = norm(r.unit);
    if (have === want) continue;

    // Only mass units are comparable; a percent or a kcal is a different question entirely.
    const haveScale = MASS[have.split(' ')[0]];
    const wantScale = MASS[want.split(' ')[0]];
    if (haveScale == null || wantScale == null) continue;

    if (r.value === 0) {
      fixes.push({ id: r.id, from: r.unit, to: want, why: 'zero carries no quantity, and its label could relabel a real total', compound: r.compound, food: r.food, value: r.value });
      continue;
    }

    // A compound established as mislabelled throughout, with the evidence recorded above.
    const verified = VERIFIED_RELABEL[r.compound];
    if (verified && norm(verified.from) === have) {
      fixes.push({ id: r.id, from: r.unit, to: verified.to, why: 'verified mislabel — see VERIFIED_RELABEL', compound: r.compound, food: r.food, value: r.value });
      continue;
    }

    // Otherwise, only what is impossible as written: convert what the row claims into grams and see
    // whether 100 g of food could hold it. This is what separates choline-as-grams (wrong) from
    // leucine-as-grams (right: 3 g per 100 g is ordinary for a protein-rich food) and DHA-as-grams
    // (right: cod liver oil really is about 10 % DHA). Anything short of impossible is left alone —
    // a plausible number in the wrong unit needs evidence, not a threshold.
    const asGrams = r.value * haveScale;
    if (asGrams > MAX_G_PER_100G) {
      fixes.push({ id: r.id, from: r.unit, to: want, why: `${r.value} ${r.unit} is ${asGrams.toFixed(0)} g per 100 g of food`, compound: r.compound, food: r.food, value: r.value });
    }
  }

  const byCompound = new Map<string, typeof fixes>();
  for (const f of fixes) byCompound.set(f.compound, [...(byCompound.get(f.compound) ?? []), f]);

  console.log(`${fixes.length} rows to relabel, across ${byCompound.size} compounds${DRY ? ' (dry run)' : ''}:\n`);
  for (const [compound, list] of [...byCompound.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const real = list.filter((f) => f.value !== 0);
    console.log(`  ${compound}: ${list.length} rows (${real.length} with a value) — ${list[0].from} → ${list[0].to}`);
    for (const f of real.slice(0, 3)) console.log(`      ${f.food.slice(0, 28).padEnd(28)} ${f.value} ${f.from} — ${f.why}`);
  }

  if (!DRY && fixes.length) {
    await sql.begin(async (tx) => {
      for (const f of fixes) {
        await tx`UPDATE merged_nutrients SET unit = ${f.to}, updated_at = now() WHERE id = ${f.id}`;
      }
    });
    console.log(`\nRelabelled ${fixes.length} rows. Values were not touched — only the unit they are stated in.`);
  }
  await sql.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
