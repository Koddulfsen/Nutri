/**
 * Systematic mapping validator.
 *
 * Walks every row in compound_sources, resolves each external_id against the
 * source's lookup (staging table or API cache via getSourceNutrientReference),
 * buckets the result, and marks UNVERIFIED unresolvable mappings as 'review'.
 *
 * Does NOT touch rows already verified/flagged/review — those are reported
 * for human attention but not auto-modified.
 *
 * Usage:
 *   npx tsx scripts/validate-all-source-mappings.ts         # dry-run (default)
 *   npx tsx scripts/validate-all-source-mappings.ts --apply # write 'review' rows
 */
import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { getSourceNutrientReference } from '../lib/services/source-nutrient-reference';
import { normalizeSource } from '../lib/utils/source-normalize';

const APPLY = process.argv.includes('--apply');

// API-backed sources: a cache miss may just mean the reference food didn't
// include this nutrient. Don't auto-flag — just report.
const API_BACKED = new Set(['FDC', 'CNF']);

type Bucket = 'resolved' | 'unresolvable' | 'api_unchecked';

interface Row {
  cs_id: string;
  compound_id: string;
  compound_name: string;
  external_source: string;
  external_id: string;
  source_name: string | null;
  verification_status: string | null;
}

function looseNameMatch(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

async function main() {
  console.log(APPLY ? 'APPLY MODE — will write review rows' : 'DRY RUN — use --apply to write');
  console.log('Loading source nutrient reference cache...');
  const ref = await getSourceNutrientReference();
  console.log(`Loaded ${ref.size} source nutrient entries\n`);

  const coreOnly = process.argv.includes('--core-only');
  const rows = await db.execute(sql`
    SELECT
      cs.id as cs_id,
      c.id as compound_id, c.name as compound_name,
      cs.external_source, cs.external_id, cs.source_name,
      csv.status as verification_status
    FROM compound_sources cs
    JOIN compounds c ON c.id = cs.compound_id
    LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
    ${coreOnly ? sql`WHERE c.tier = 'core'` : sql``}
  `);
  const allRows = ((rows as any).rows ?? rows) as Row[];
  console.log(`Scanning ${allRows.length} compound_source mappings${coreOnly ? ' (core tier only)' : ''}...\n`);

  const buckets = { resolved: 0, resolved_name_mismatch: 0, unresolvable: 0, api_unchecked: 0 };
  const issues: Array<Row & { bucket: Bucket; reason: string; actualName?: string | null }> = [];

  for (const row of allRows) {
    const normalized = normalizeSource(row.external_source);
    const refKey = `${row.external_source}:${row.external_id}`;
    const altKey = `${normalized}:${row.external_id}`;
    const hit = ref.get(refKey) ?? ref.get(altKey) ?? null;

    if (hit) {
      // Resolved — compare names for silent-fail detection
      const srcName = row.source_name ?? row.compound_name;
      if (srcName && hit.name && !looseNameMatch(srcName, hit.name) && !looseNameMatch(row.compound_name, hit.name)) {
        buckets.resolved_name_mismatch++;
        issues.push({
          ...row, bucket: 'resolved',
          reason: `Resolved but names disagree: our="${srcName}" / compound="${row.compound_name}" vs actual="${hit.name}"`,
          actualName: hit.name,
        });
      } else {
        buckets.resolved++;
      }
    } else if (API_BACKED.has(normalized)) {
      buckets.api_unchecked++;
      // Don't report each — too noisy
    } else {
      buckets.unresolvable++;
      issues.push({
        ...row, bucket: 'unresolvable',
        reason: `ID "${row.external_id}" did not resolve in ${normalized} staging data`,
      });
    }
  }

  console.log('Summary:');
  console.log(`  Resolved (name OK):           ${buckets.resolved}`);
  console.log(`  Resolved but name mismatch:   ${buckets.resolved_name_mismatch}  ← potential silent bugs`);
  console.log(`  Unresolvable (not in source): ${buckets.unresolvable}  ← hard-fail mappings`);
  console.log(`  API-backed, cache miss:       ${buckets.api_unchecked}  (skipped — may be cache gap)`);
  console.log(`  Total issues found:           ${issues.length}\n`);

  // Group issues by source for readability
  const bySource: Record<string, typeof issues> = {};
  for (const iss of issues) {
    const s = normalizeSource(iss.external_source);
    (bySource[s] ??= []).push(iss);
  }
  const sortedSources = Object.keys(bySource).sort();
  for (const src of sortedSources) {
    console.log(`\n[${src}] ${bySource[src].length} issues:`);
    for (const iss of bySource[src].slice(0, 5)) {
      console.log(`  ${iss.external_id.padEnd(15)} ${iss.compound_name.padEnd(30)} status=${iss.verification_status ?? 'unverified'}`);
      console.log(`    └─ ${iss.reason}`);
    }
    if (bySource[src].length > 5) {
      console.log(`  ... and ${bySource[src].length - 5} more`);
    }
  }

  // Count rows that would actually be written (only unverified)
  const wouldWrite = issues.filter(i => !i.verification_status);
  const skipVerified = issues.filter(i => i.verification_status === 'verified');
  const skipOther = issues.filter(i => ['review', 'flagged'].includes(i.verification_status ?? ''));

  console.log(`\nStatus breakdown of issues:`);
  console.log(`  Currently unverified (would flag as review):  ${wouldWrite.length}`);
  console.log(`  Currently verified (SKIP — human confirmed):  ${skipVerified.length}  ← suspicious, re-check manually`);
  console.log(`  Currently review/flagged (skip — no change):  ${skipOther.length}`);

  if (!APPLY) {
    console.log('\nDry run complete. Re-run with --apply to mark unverified issues as review.');
    process.exit(0);
  }

  console.log(`\nApplying ${wouldWrite.length} review flags...`);
  let written = 0;
  for (const iss of wouldWrite) {
    const note = `Auto-validator: ${iss.reason}`;
    await db.execute(sql`
      INSERT INTO compound_source_verifications (compound_source_id, status, notes, verified_at)
      VALUES (${iss.cs_id}, 'review', ${note}, NOW())
      ON CONFLICT (compound_source_id) DO NOTHING
    `);
    written++;
    if (written % 20 === 0) process.stdout.write(`  ${written}/${wouldWrite.length}\r`);
  }
  console.log(`\n  Wrote ${written} review records.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
