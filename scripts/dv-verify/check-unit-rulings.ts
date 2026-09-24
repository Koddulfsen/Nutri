/**
 * Every unit disagreement between the independent sources must have a ruling, and every ruling must be about a
 * disagreement that exists.
 *
 * A qualifier is either a label on the same quantity or a different quantity, per nutrient (lib/dv/unit-rulings.ts).
 * Getting it wrong is silent in both directions — pooling µg with µg DFE inflates a target by up to 70 %, refusing
 * to pool mg with mg α-TE halves the number of bodies behind it — so this checks the rulings against the database:
 *
 *   1. Every compound whose alpha sources mix qualifiers has a ruling for each pair that occurs.
 *   2. No ruling describes a pair that does not occur (a ruling nothing exercises is a claim nobody checks).
 *   3. Every region quoted in a ruling actually publishes that compound, and every region whose rows depend on the
 *      ruling is quoted.
 *   4. Evidence quotes carry a locator, and a `same: false` ruling says what differs.
 *
 * Run: npx tsx scripts/dv-verify/check-unit-rulings.ts
 */
import 'dotenv/config';
import postgres from 'postgres';
import { UNIT_RULINGS } from '../../lib/dv/unit-rulings';
import { ALPHA_INDEPENDENT_REGIONS } from '../../lib/dv/source-provenance';
import { parseUnit } from '../../lib/food-health/units';

const sql = postgres(process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL!, { max: 1 });
const LOCATOR = /p\.\s?\d|pp\.\s?\d|§|Table|table|第[一二三四五六七八九十]+章|NBK\d+|footnote|Tables|20\d\d/;
let fails = 0;
const fail = (m: string) => { fails++; console.log('FAIL ' + m); };

async function main() {
  const regions = [...ALPHA_INDEPENDENT_REGIONS];
  const rows = await sql`
    SELECT c.name compound, r.source_region::text region, r.unit
    FROM reference_daily_values r JOIN compounds c ON c.id = r.compound_id
    WHERE r.source_region = ANY(${regions}) GROUP BY 1, 2, 3`;

  // compound -> qualifier -> regions that publish it
  const seen = new Map<string, Map<string, Set<string>>>();
  for (const r of rows as Array<{ compound: string; region: string; unit: string }>) {
    const q = parseUnit(r.unit).qualifier;
    const m = seen.get(r.compound) ?? new Map<string, Set<string>>();
    m.set(q, (m.get(q) ?? new Set()).add(r.region));
    seen.set(r.compound, m);
  }

  const ruled = new Set(UNIT_RULINGS.map((r) => `${r.compound}|${[...r.qualifiers].sort().join('|')}`));

  // 1. Every pair that occurs is ruled.
  let pairs = 0;
  for (const [compound, byQual] of seen) {
    const quals = [...byQual.keys()];
    if (quals.length < 2) continue;
    for (let i = 0; i < quals.length; i++)
      for (let j = i + 1; j < quals.length; j++) {
        pairs++;
        const key = `${compound}|${[quals[i], quals[j]].sort().join('|')}`;
        if (!ruled.has(key))
          fail(`${compound}: ${quals[i] || '(bare)'} vs ${quals[j] || '(bare)'} occurs in the data but has no ruling — ${[...byQual.get(quals[i])!].join(',')} against ${[...byQual.get(quals[j])!].join(',')}`);
      }
  }

  for (const r of UNIT_RULINGS) {
    const byQual = seen.get(r.compound);
    // 2. The ruling is about a real disagreement.
    if (!byQual) { fail(`${r.compound}: ruled, but has no values in the alpha sources`); continue; }
    const [a, b] = r.qualifiers;
    if (!byQual.has(a) || !byQual.has(b))
      fail(`${r.compound}: ruling covers ${a || '(bare)'} vs ${b || '(bare)'}, but ${!byQual.has(a) ? a || '(bare)' : b || '(bare)'} does not occur in the data`);

    // 3. Evidence covers the regions whose rows the ruling decides.
    const affected = new Set([...(byQual.get(a) ?? []), ...(byQual.get(b) ?? [])]);
    const quoted = new Set(r.evidence.map((e) => e.region));
    for (const region of affected) if (!quoted.has(region)) fail(`${r.compound}: ${region} publishes a unit this ruling decides and is not quoted`);
    for (const region of quoted) if (!affected.has(region)) fail(`${r.compound}: evidence quotes ${region}, whose rows this ruling does not decide`);

    // 4. Quotes are quotes, and a refusal says what differs.
    for (const e of r.evidence) {
      if (e.quote.length < 40) fail(`${r.compound} (${e.region}): evidence must quote the source, not summarise it`);
      if (!LOCATOR.test(e.quote)) fail(`${r.compound} (${e.region}): evidence needs a locator (page, table, section or document year)`);
    }
    if (!r.same && !r.difference) fail(`${r.compound}: rules the two units different but does not say what differs`);
  }

  console.log(`Unit rulings: ${UNIT_RULINGS.length} rulings over ${pairs} qualifier pairs in the data, ${fails} failures`);
  await sql.end();
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
