/**
 * Recompute existing foods' nutrients with the current factors and merge rules.
 *
 * Conversion factors apply at read time, so fixing one changes nothing already
 * stored: the 71 foods imported before scripts/fix-conversion-factors-2.ts still
 * carry averages built from the old factors, and from the merge that summed
 * across units. Apple tryptophan reads 0.7274 g against a true ~0.001 g until
 * this runs.
 *
 * Everything each import needs was recorded at the time — food_sources holds the
 * api_source, api_food_id, variant and composition for all 789 selections, with
 * no gaps — so this replays the exact same source choices. It drives
 * POST /api/foods with replaceFoodId rather than reimplementing the pipeline,
 * because a second implementation of an 18-source merge is how the numbers drift
 * apart without anyone noticing.
 *
 * The food row, its id, portions, category and approval are untouched; only
 * merged_nutrients, nutrient_source_values and food_sources are rewritten.
 *
 * Usage:
 *   npx tsx scripts/reimport-foods.ts --dry-run              # list what would run
 *   npx tsx scripts/reimport-foods.ts --food "Apple"         # one food, by name
 *   npx tsx scripts/reimport-foods.ts --limit 5
 *   npx tsx scripts/reimport-foods.ts                        # all of them
 *
 * Needs the dev server up (BASE_URL, default http://localhost:3003/nutri) and
 * DEV_AUTH_BYPASS=true, since POST /api/foods requires an admin.
 */
import 'dotenv/config';
import postgres from 'postgres';

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i > -1 ? args[i + 1] : undefined;
};
const DRY = args.includes('--dry-run');
const ONLY = flag('--food');
const LIMIT = flag('--limit') ? parseInt(flag('--limit')!, 10) : undefined;
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3003/nutri';

const url = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('Set MIGRATION_DATABASE_URL');
  process.exit(1);
}
const sql = postgres(url, { max: 1 });

type FoodRow = {
  id: string;
  name: string;
  common_names: string[] | null;
  food_family: string | null;
  variety: string | null;
  part: string | null;
  preparation: string | null;
  qualifiers: string[] | null;
  origin_type: string | null;
  is_composite: boolean;
  scientific_name: string | null;
};

/** Read the SSE stream and return the terminal event. */
async function postFood(body: unknown): Promise<{ ok: boolean; detail: string }> {
  const res = await fetch(`${BASE_URL}/api/foods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    return { ok: false, detail: `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}` };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let last: any = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      const line = part.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      try {
        const event = JSON.parse(line.slice(6));
        if (event.type === 'complete' || event.type === 'error') last = event;
      } catch {
        // A partial frame is not an error; the next read completes it.
      }
    }
  }

  if (!last) return { ok: false, detail: 'stream ended with no complete or error event' };
  if (last.type === 'error') return { ok: false, detail: last.error ?? 'unknown error' };
  return { ok: true, detail: `${last.nutrients?.length ?? '?'} compounds` };
}

async function main() {
  const foods = await sql<FoodRow[]>`
    SELECT f.id, f.name, f.common_names, f.food_family, f.variety, f.part,
           f.preparation, f.qualifiers, f.origin_type::text AS origin_type,
           f.is_composite, f.scientific_name
    FROM foods f
    ${ONLY ? sql`WHERE f.name = ${ONLY}` : sql``}
    ORDER BY f.name
    ${LIMIT ? sql`LIMIT ${LIMIT}` : sql``}`;

  if (foods.length === 0) {
    console.log('No foods matched.');
    await sql.end();
    return;
  }

  console.log('\n%s %d food(s) via %s\n', DRY ? 'DRY RUN —' : 'Re-importing', foods.length, BASE_URL);

  let ok = 0;
  let failed = 0;

  for (const food of foods) {
    const srcs = await sql<
      { api_source: string; api_food_id: string; api_food_variant: string | null; composition: any }[]
    >`
      SELECT api_source::text AS api_source, api_food_id, api_food_variant, composition
      FROM food_sources WHERE food_id = ${food.id} ORDER BY api_source`;

    if (srcs.length === 0) {
      console.log('  skip   %s — no recorded sources', food.name);
      continue;
    }

    const body: Record<string, unknown> = {
      name: food.name,
      commonNames: food.common_names ?? [],
      replaceFoodId: food.id,
      sources: srcs.map((s) => ({
        apiSource: s.api_source,
        apiFoodId: s.api_food_id,
        ...(s.api_food_variant ? { apiFoodVariant: s.api_food_variant } : {}),
        ...(s.composition ? { composition: s.composition } : {}),
      })),
    };

    if (food.food_family) {
      body.metadata = {
        foodFamily: food.food_family,
        variety: food.variety,
        part: food.part,
        preparation: food.preparation,
        qualifiers: food.qualifiers ?? [],
        originType: food.origin_type,
        isComposite: food.is_composite,
        scientificName: food.scientific_name,
      };
    }

    if (DRY) {
      console.log('  would  %s — %d sources (%s)', food.name.padEnd(28), srcs.length,
        srcs.map((s) => s.api_source).join(', '));
      continue;
    }

    process.stdout.write(`  ${food.name.padEnd(28)} `);
    const result = await postFood(body);
    if (result.ok) {
      console.log('ok — %s', result.detail);
      ok++;
    } else {
      console.log('FAILED — %s', result.detail);
      failed++;
    }
  }

  if (!DRY) console.log('\n%d ok, %d failed\n', ok, failed);
  else console.log();
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
