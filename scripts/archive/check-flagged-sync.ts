/**
 * Cross-checks docs/FLAGGED_MAPPINGS.md against compound_source_verifications.
 * For every (source, external_id) listed in the doc, confirms there's a
 * verification row with status='flagged'. Reports any mismatches.
 */
import 'dotenv/config';
import { readFileSync } from 'fs';
import { db } from '../db';
import { compoundSources, compounds } from '../db/schema/compounds';
import { compoundSourceVerifications } from '../db/schema/compound_source_verifications';
import { eq, and, inArray } from 'drizzle-orm';

type Entry = { source: string; externalId: string; compound?: string };

function parseDoc(path: string): Entry[] {
  const text = readFileSync(path, 'utf-8');
  const entries: Entry[] = [];
  for (const line of text.split('\n')) {
    // Match table rows: | SOURCE | ExtID | Compound | ... |
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;
    const [source, externalId, compound] = cells;
    // Skip header/separator rows
    if (source === 'Source' || source.startsWith('---') || source.startsWith(':--')) continue;
    if (!/^[A-Z_]+$/.test(source)) continue; // Must look like a source name
    if (!externalId) continue;
    entries.push({ source, externalId, compound });
  }
  return entries;
}

async function main() {
  const entries = parseDoc('docs/FLAGGED_MAPPINGS.md');
  console.log(`Parsed ${entries.length} flagged entries from doc\n`);

  // Bulk fetch matching compound_sources
  const rows = await db
    .select({
      id: compoundSources.id,
      externalSource: compoundSources.externalSource,
      externalId: compoundSources.externalId,
      compoundName: compounds.name,
      verificationStatus: compoundSourceVerifications.status,
      verificationNotes: compoundSourceVerifications.notes,
    })
    .from(compoundSources)
    .leftJoin(compounds, eq(compounds.id, compoundSources.compoundId))
    .leftJoin(
      compoundSourceVerifications,
      eq(compoundSourceVerifications.compoundSourceId, compoundSources.id)
    );

  // Index by (source, externalId)
  const byKey = new Map<string, typeof rows[0]>();
  for (const r of rows) {
    byKey.set(`${r.externalSource}|${r.externalId}`, r);
  }

  let flagged = 0;
  let verified = 0;
  let unverified = 0;
  let missingFromDb = 0;
  const problems: string[] = [];

  for (const e of entries) {
    const key = `${e.source}|${e.externalId}`;
    const r = byKey.get(key);
    if (!r) {
      missingFromDb++;
      problems.push(`  MISSING  ${e.source} ${e.externalId} (${e.compound}) — no compound_sources row`);
      continue;
    }
    if (r.verificationStatus === 'flagged') {
      flagged++;
    } else if (r.verificationStatus === 'verified') {
      verified++;
      problems.push(`  VERIFIED ${e.source} ${e.externalId} (${r.compoundName}) — should be flagged`);
    } else {
      unverified++;
      problems.push(`  UNVERIFIED ${e.source} ${e.externalId} (${r.compoundName}) — no verification row`);
    }
  }

  console.log(`Results:`);
  console.log(`  Flagged in DB:     ${flagged}`);
  console.log(`  Verified in DB:    ${verified}  (unexpected)`);
  console.log(`  Unverified in DB:  ${unverified}  (unexpected)`);
  console.log(`  Missing from DB:   ${missingFromDb}  (unexpected)`);
  console.log(`  Total in doc:      ${entries.length}`);

  if (problems.length > 0) {
    console.log(`\nProblems:`);
    for (const p of problems) console.log(p);
  } else {
    console.log(`\nAll entries are correctly tagged as flagged in the DB.`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
