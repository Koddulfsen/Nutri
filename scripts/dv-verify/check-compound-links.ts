/**
 * Every limit that sits on a form of a nutrient must be linked to the nutrient whose goal it belongs beside.
 *
 * A limit stored on its own compound (Retinol, Folic Acid, Nicotinic Acid …) is invisible to a bar built from the
 * parent nutrient unless something connects them. This check makes that connection mandatory and verifies it against
 * the database rather than the file's own say-so:
 *
 *   1. Every compound in the alpha sources that has ONLY limits is either linked to a parent or listed as
 *      legitimately limit-only — so a new form-specific UL cannot appear unnoticed.
 *   2. Every linked form and parent exists, the form really does carry limits, and the parent really does carry a
 *      goal (RDA/AI) — otherwise the bar it points at does not exist.
 *   3. Every region quoted as evidence actually publishes that limit, and every region that publishes it is quoted.
 *   4. A link whose limit does not count the parent's total (`countsParentTotal: false`) must say so in a unitNote,
 *      because that is the case where comparing it to total intake would be wrong.
 *
 * Run: npx tsx scripts/dv-verify/check-compound-links.ts
 */
import 'dotenv/config';
import postgres from 'postgres';
import { FORM_LINKS, LIMIT_ONLY_COMPOUNDS } from '../../lib/dv/compound-links';
import { ALPHA_INDEPENDENT_REGIONS } from '../../lib/dv/source-provenance';

const sql = postgres(process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL!, { max: 1 });
let fails = 0;
const fail = (m: string) => { fails++; console.log('FAIL ' + m); };

async function main() {
  const regions = [...ALPHA_INDEPENDENT_REGIONS];
  const rows = await sql`
    SELECT c.name compound, r.value_type::text vt, r.source_region::text region, count(*)::int n
    FROM reference_daily_values r JOIN compounds c ON c.id = r.compound_id
    WHERE r.source_region = ANY(${regions}) GROUP BY 1, 2, 3`;

  const types = new Map<string, Set<string>>();
  const ulRegions = new Map<string, Set<string>>();
  const goalCompounds = new Set<string>();
  for (const r of rows) {
    types.set(r.compound, (types.get(r.compound) ?? new Set()).add(r.vt));
    if (r.vt === 'UL') ulRegions.set(r.compound, (ulRegions.get(r.compound) ?? new Set()).add(r.region));
    if (r.vt === 'RDA' || r.vt === 'AI') goalCompounds.add(r.compound);
  }

  const linked = new Set(FORM_LINKS.map((l) => l.form));
  const allowed = new Set(LIMIT_ONLY_COMPOUNDS.map((c) => c.compound));

  // 1. No unaccounted limit-only compound.
  for (const [compound, ts] of types) {
    if (ts.size === 1 && ts.has('UL') && !linked.has(compound) && !allowed.has(compound))
      fail(`${compound} has only limits in the alpha sources and is neither linked to a parent nor listed as limit-only — see lib/dv/compound-links.ts`);
  }
  for (const c of allowed) if (!types.has(c)) fail(`LIMIT_ONLY_COMPOUNDS lists ${c}, which has no values in the alpha sources`);

  for (const link of FORM_LINKS) {
    // 2. Both ends exist and carry what the link claims.
    const formTypes = types.get(link.form);
    if (!formTypes) { fail(`${link.form}: no values in the alpha sources`); continue; }
    if (!formTypes.has('UL')) fail(`${link.form}: linked as a form-specific limit but carries no UL`);
    if (!types.has(link.parent)) fail(`${link.form} -> ${link.parent}: the parent has no values in the alpha sources`);
    else if (!goalCompounds.has(link.parent)) fail(`${link.form} -> ${link.parent}: the parent carries no RDA or AI, so there is no goal for this limit to sit beside`);

    // 3. Evidence covers exactly the regions that publish the limit.
    const publishing = ulRegions.get(link.form) ?? new Set<string>();
    const quoted = new Set(link.evidence.map((e) => e.region));
    for (const r of publishing) if (!quoted.has(r)) fail(`${link.form}: ${r} publishes this limit but is not quoted in the link's evidence`);
    for (const r of quoted) if (!publishing.has(r)) fail(`${link.form}: evidence quotes ${r}, which publishes no limit for it`);
    for (const e of link.evidence) if (e.quote.length < 40) fail(`${link.form} (${e.region}): evidence must quote the source, not summarise it`);

    // 4. A form-only limit must explain how its unit relates to the parent's.
    if (!link.countsParentTotal && !link.unitNote)
      fail(`${link.form}: countsParentTotal is false, so it needs a unitNote saying what the limit counts and how its unit relates to ${link.parent}`);
  }

  console.log(`Compound links: ${FORM_LINKS.length} form links, ${LIMIT_ONLY_COMPOUNDS.length} limit-only compounds, ${fails} failures`);
  await sql.end();
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
