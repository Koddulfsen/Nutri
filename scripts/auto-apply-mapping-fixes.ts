/**
 * Auto-apply obvious mapping fixes.
 *
 * Reuses the suggest-mapping-fixes scoring. Applies a fix automatically ONLY
 * when ALL of these hold:
 *   1. Top candidate score >= 100 (exact normalized name match)
 *   2. No runner-up within 15 points of the top
 *   3. Suggested CF is known (not '?')
 *   4. Current mapping is unverified (no existing verification row)
 *
 * Updates compound_sources: external_id, source_unit, conversion_factor.
 * Writes compound_source_verifications with status='verified' and a note
 * documenting the auto-fix. Everything else goes to the review file.
 *
 * Usage:
 *   npx tsx scripts/auto-apply-mapping-fixes.ts          # dry-run
 *   npx tsx scripts/auto-apply-mapping-fixes.ts --apply  # write changes
 */
import 'dotenv/config';
import { writeFileSync } from 'fs';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { getSourceNutrientReference } from '../lib/services/source-nutrient-reference';
import { normalizeSource } from '../lib/utils/source-normalize';

const APPLY = process.argv.includes('--apply');

interface SourceAdapter {
  source: string;
  table: string;
  idColumn: string;
  nameColumn: string;
  unitColumn?: string;
}

const ADAPTERS: SourceAdapter[] = [
  { source: 'AFCD', table: 'source_afcd_nutrients', idColumn: 'nutrient_index', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'CIQUAL', table: 'source_ciqual_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'UK_COFID', table: 'source_cofid_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'FINELI', table: 'source_fineli_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'BLS', table: 'source_bls_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'NEVO', table: 'source_nevo_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'FRIDA', table: 'source_frida_nutrients', idColumn: 'eurofir_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'MATVARETABELLEN', table: 'source_matvaretabellen_nutrients', idColumn: 'eurofir_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'FOODFILES', table: 'source_foodfiles_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'MEXT', table: 'source_mext_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'KFCT', table: 'source_kfct_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'INDB', table: 'source_indb_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'ASEANFOODS', table: 'source_aseanfoods_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  { source: 'FOODB', table: 'source_foodb_compounds', idColumn: 'public_id', nameColumn: 'name' },
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}
function tokens(s: string): Set<string> {
  return new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 2));
}
function nameScore(our: string, candidate: string): number {
  const na = normalize(our);
  const nb = normalize(candidate);
  if (!na || !nb) return 0;
  if (na === nb) return 100;
  if (na.includes(nb) || nb.includes(na)) return 80;
  const ta = tokens(our);
  const tb = tokens(candidate);
  if (ta.size === 0 || tb.size === 0) return 0;
  const intersection = new Set([...ta].filter(x => tb.has(x)));
  const union = new Set([...ta, ...tb]);
  const jaccard = intersection.size / union.size;
  if (jaccard >= 0.5) return Math.round(40 + 60 * jaccard);
  return Math.round(jaccard * 50);
}

const UNIT_SYNONYMS: Record<string, string> = {
  g: 'g', gram: 'g', grams: 'g',
  mg: 'mg', milligram: 'mg',
  'μg': 'ug', ug: 'ug', mcg: 'ug', microgram: 'ug',
  iu: 'iu', kcal: 'kcal', kj: 'kj',
};
function normalizeUnit(u: string | null | undefined): string {
  if (!u) return '';
  // Unicode micro sign (U+00B5) and Greek mu (U+03BC) are visually identical
  // but different codepoints — both used interchangeably for "micro". Map both to "u".
  const cleaned = u.toLowerCase().trim().replace(/µ|μ/g, 'u');
  return UNIT_SYNONYMS[cleaned] ?? cleaned;
}
function suggestCF(ourUnit: string, sourceUnit: string): string | null {
  const o = normalizeUnit(ourUnit);
  const s = normalizeUnit(sourceUnit);
  if (!o || !s) return null;
  if (o === s) return '1.0';
  const key = `${s}->${o}`;
  const map: Record<string, string> = {
    'mg->g': '0.001', 'g->mg': '1000',
    'ug->g': '0.000001', 'g->ug': '1000000',
    'ug->mg': '0.001', 'mg->ug': '1000',
    'kj->kcal': '0.239', 'kcal->kj': '4.184',
  };
  return map[key] ?? null;
}

interface Candidate {
  id: string;
  name: string;
  unit: string | null;
  score: number;
  cf: string | null;
}

async function main() {
  console.log(APPLY ? 'APPLY MODE — will write changes' : 'DRY RUN — use --apply to write');
  console.log('Loading reference cache...');
  const ref = await getSourceNutrientReference();

  const mappings = await db.execute(sql`
    SELECT cs.id as cs_id, cs.external_source, cs.external_id,
           cs.source_name, cs.source_unit, cs.conversion_factor,
           c.id as compound_id, c.name as compound_name, c.unit as compound_unit,
           csv.status as verification_status
    FROM compound_sources cs
    JOIN compounds c ON c.id = cs.compound_id
    LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
  `);
  const all = ((mappings as any).rows ?? mappings) as any[];

  // Only unverified + unresolvable
  const broken = all.filter(m => {
    if (m.verification_status) return false; // skip verified/flagged/review
    const norm = normalizeSource(m.external_source);
    return !ref.get(`${m.external_source}:${m.external_id}`) && !ref.get(`${norm}:${m.external_id}`);
  });
  console.log(`${broken.length} unverified + unresolvable mappings to consider\n`);

  const autoApply: Array<{ m: any; top: Candidate; adapter: SourceAdapter }> = [];
  const skipped: Array<{ m: any; reason: string; top?: Candidate; runnerUp?: Candidate }> = [];

  for (const adapter of ADAPTERS) {
    const forSource = broken.filter(m => normalizeSource(m.external_source) === adapter.source);
    if (forSource.length === 0) continue;

    const catalogRows = await db.execute(sql.raw(`
      SELECT ${adapter.idColumn} as id, ${adapter.nameColumn} as name${adapter.unitColumn ? `, ${adapter.unitColumn} as unit` : ', NULL as unit'}
      FROM ${adapter.table}
    `));
    const catalog = ((catalogRows as any).rows ?? catalogRows) as Array<{ id: any; name: string; unit: string | null }>;

    for (const m of forSource) {
      const candidates: Candidate[] = [];
      for (const entry of catalog) {
        const compoundScore = nameScore(m.compound_name, entry.name);
        const sourceNameScore = m.source_name ? nameScore(m.source_name, entry.name) : 0;
        let score = Math.max(compoundScore, sourceNameScore);
        if (score < 80) continue;

        if (adapter.unitColumn && entry.unit && m.compound_unit) {
          const o = normalizeUnit(m.compound_unit);
          const s = normalizeUnit(entry.unit);
          if (o === s) score += 10;
          else if (['g', 'mg', 'ug'].includes(o) && ['g', 'mg', 'ug'].includes(s)) score += 5;
        }

        const cf = suggestCF(m.compound_unit, entry.unit ?? m.compound_unit);
        candidates.push({ id: String(entry.id), name: entry.name, unit: entry.unit, score, cf });
      }

      candidates.sort((a, b) => b.score - a.score);
      const top = candidates[0];
      const runnerUp = candidates[1];

      if (!top) { skipped.push({ m, reason: 'no candidates' }); continue; }
      if (top.score < 100) { skipped.push({ m, reason: `top score ${top.score} < 100`, top }); continue; }
      if (runnerUp && runnerUp.score >= top.score - 15) {
        skipped.push({ m, reason: `ambiguous: runner-up score ${runnerUp.score} too close to top ${top.score}`, top, runnerUp });
        continue;
      }
      if (!top.cf) { skipped.push({ m, reason: `no unit conversion from ${top.unit} → ${m.compound_unit}`, top }); continue; }

      autoApply.push({ m, top, adapter });
    }
  }

  console.log(`\nAuto-apply candidates: ${autoApply.length}`);
  console.log(`Skipped (need review): ${skipped.length}\n`);

  // Show a sample of auto-applies
  console.log('Sample auto-applies:');
  for (const { m, top } of autoApply.slice(0, 10)) {
    console.log(`  ${m.external_source.padEnd(20)} ${m.compound_name.padEnd(30)} ${m.external_id} → ${top.id} (${top.name}, unit=${top.unit}, cf=${top.cf}, score=${top.score})`);
  }
  if (autoApply.length > 10) console.log(`  ...and ${autoApply.length - 10} more`);

  // Count skip reasons
  const skipReasons: Record<string, number> = {};
  for (const s of skipped) {
    const reason = s.reason.split(':')[0];
    skipReasons[reason] = (skipReasons[reason] ?? 0) + 1;
  }
  console.log('\nSkip reasons:');
  for (const [reason, count] of Object.entries(skipReasons).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${reason.padEnd(40)} ${count}`);
  }

  // Write skipped list for user review
  const reviewLines: string[] = ['# Skipped Mapping Fixes (Need Human Review)', ''];
  reviewLines.push(`Generated: ${new Date().toISOString()}  |  ${skipped.length} entries`);
  reviewLines.push('');
  reviewLines.push('Each entry shows why it was skipped and the top candidate(s). Tick one to apply manually (via apply-mapping-fixes.ts, coming).');
  reviewLines.push('');
  const bySource: Record<string, typeof skipped> = {};
  for (const s of skipped) {
    const k = normalizeSource(s.m.external_source);
    (bySource[k] ??= []).push(s);
  }
  for (const src of Object.keys(bySource).sort()) {
    reviewLines.push(`## ${src} (${bySource[src].length})`);
    reviewLines.push('');
    for (const s of bySource[src]) {
      reviewLines.push(`### ${s.m.compound_name} (cs_id: ${s.m.cs_id})`);
      reviewLines.push(`Broken: external_id=\`${s.m.external_id}\`, unit=\`${s.m.compound_unit}\`, source_name=\`${s.m.source_name ?? '-'}\``);
      reviewLines.push(`Reason: ${s.reason}`);
      if (s.top) reviewLines.push(`- [ ] id=\`${s.top.id}\` name="${s.top.name}" unit=\`${s.top.unit ?? '-'}\` score=${s.top.score} cf=${s.top.cf ?? '?'}`);
      if (s.runnerUp) reviewLines.push(`- [ ] id=\`${s.runnerUp.id}\` name="${s.runnerUp.name}" unit=\`${s.runnerUp.unit ?? '-'}\` score=${s.runnerUp.score} cf=${s.runnerUp.cf ?? '?'}`);
      reviewLines.push('');
    }
  }
  writeFileSync('docs/MAPPING_REVIEW_NEEDED.md', reviewLines.join('\n'));
  console.log(`\nWrote docs/MAPPING_REVIEW_NEEDED.md (${skipped.length} entries for human review)`);

  if (!APPLY) {
    console.log('\nDry run complete. Re-run with --apply to write auto-fix changes.');
    process.exit(0);
  }

  console.log(`\nApplying ${autoApply.length} fixes...`);
  let applied = 0;
  let conflicts = 0;
  for (const { m, top } of autoApply) {
    // Check for unique-constraint conflict: another row in the same source
    // already has this external_id. If so, this broken row is a duplicate —
    // mark as flagged instead of trying to update.
    const existing = await db.execute(sql`
      SELECT id FROM compound_sources
      WHERE external_source = ${m.external_source} AND external_id = ${top.id} AND id != ${m.cs_id}
      LIMIT 1
    `);
    const existingRows = ((existing as any).rows ?? existing) as any[];
    if (existingRows.length > 0) {
      const note = `Auto-fix: duplicate mapping — correct target (${m.external_source} ${top.id}) already owned by cs_id=${existingRows[0].id}. This row should be deleted.`;
      await db.execute(sql`
        INSERT INTO compound_source_verifications (compound_source_id, status, notes, verified_at)
        VALUES (${m.cs_id}, 'flagged', ${note}, NOW())
        ON CONFLICT (compound_source_id) DO NOTHING
      `);
      conflicts++;
      continue;
    }

    const note = `Auto-fix: external_id "${m.external_id}" → "${top.id}" (name="${top.name}", unit=${top.unit}, score=${top.score})`;
    await db.execute(sql`
      UPDATE compound_sources
      SET external_id = ${top.id},
          source_unit = ${top.unit ?? m.source_unit},
          conversion_factor = ${top.cf}
      WHERE id = ${m.cs_id}
    `);
    await db.execute(sql`
      INSERT INTO compound_source_verifications (compound_source_id, status, notes, verified_at)
      VALUES (${m.cs_id}, 'verified', ${note}, NOW())
      ON CONFLICT (compound_source_id) DO NOTHING
    `);
    applied++;
    if ((applied + conflicts) % 25 === 0) process.stdout.write(`  ${applied + conflicts}/${autoApply.length}\r`);
  }
  console.log(`\n  Applied ${applied} fixes, ${conflicts} flagged as duplicates.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
