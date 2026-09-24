/**
 * ID Fixer — deterministic suggestions for broken compound_sources mappings.
 *
 * For each mapping whose external_id didn't resolve in its source's nutrient
 * staging table, queries that source's catalog and returns top 3 candidates
 * scored by name similarity + unit compatibility.
 *
 * Writes docs/MAPPING_SUGGESTIONS.md as markdown checklists — one section per
 * source, one entry per broken mapping. Skim through, tick the correct
 * candidate, then run apply-mapping-fixes.ts (next).
 *
 * Usage:
 *   npx tsx scripts/suggest-mapping-fixes.ts                   # all sources
 *   npx tsx scripts/suggest-mapping-fixes.ts --source AFCD     # just one
 */
import 'dotenv/config';
import { writeFileSync } from 'fs';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { getSourceNutrientReference } from '../lib/services/source-nutrient-reference';
import { normalizeSource } from '../lib/utils/source-normalize';

// ---------- Source adapters ----------

interface SourceAdapter {
  source: string;
  table: string;
  idColumn: string;
  nameColumn: string;
  unitColumn?: string; // undefined = source doesn't track units per-nutrient
  idIsInteger?: boolean;
}

const ADAPTERS: SourceAdapter[] = [
  { source: 'AFCD', table: 'source_afcd_nutrients', idColumn: 'nutrient_index', nameColumn: 'name', unitColumn: 'unit', idIsInteger: true },
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

// ---------- Scoring ----------

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
  'g': 'g', 'gram': 'g', 'grams': 'g',
  'mg': 'mg', 'milligram': 'mg',
  'μg': 'ug', 'ug': 'ug', 'mcg': 'ug', 'microgram': 'ug',
  'iu': 'iu', 'kcal': 'kcal', 'kj': 'kj',
};

function normalizeUnit(u: string | null | undefined): string {
  if (!u) return '';
  return UNIT_SYNONYMS[u.toLowerCase().trim()] ?? u.toLowerCase().trim();
}

function suggestCF(ourUnit: string, sourceUnit: string): string {
  const o = normalizeUnit(ourUnit);
  const s = normalizeUnit(sourceUnit);
  if (!o || !s) return '?';
  if (o === s) return '1.0';
  const key = `${s}->${o}`;
  const map: Record<string, string> = {
    'mg->g': '0.001', 'g->mg': '1000',
    'ug->g': '0.000001', 'g->ug': '1000000',
    'ug->mg': '0.001', 'mg->ug': '1000',
    'kj->kcal': '0.239', 'kcal->kj': '4.184',
  };
  return map[key] ?? '?';
}

// ---------- Main ----------

interface Candidate {
  id: string;
  name: string;
  unit: string | null;
  score: number;
  suggestedCF: string;
}

async function main() {
  const sourceArg = process.argv.find(a => a.startsWith('--source='))?.split('=')[1]
    ?? (process.argv.indexOf('--source') >= 0 ? process.argv[process.argv.indexOf('--source') + 1] : undefined);

  console.log('Loading source nutrient reference cache...');
  const ref = await getSourceNutrientReference();

  // Get all compound_sources with their current state
  const mappings = await db.execute(sql`
    SELECT
      cs.id as cs_id,
      c.id as compound_id, c.name as compound_name, c.unit as compound_unit,
      cs.external_source, cs.external_id, cs.source_name, cs.source_unit,
      csv.status as verification_status
    FROM compound_sources cs
    JOIN compounds c ON c.id = cs.compound_id
    LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
  `);
  const allMappings = ((mappings as any).rows ?? mappings) as any[];

  // Filter to unresolvable mappings (ID doesn't resolve in reference cache)
  // Skip mappings already flagged as dead.
  const broken = allMappings.filter(m => {
    if (m.verification_status === 'flagged') return false;
    const normalized = normalizeSource(m.external_source);
    const hit = ref.get(`${m.external_source}:${m.external_id}`) ?? ref.get(`${normalized}:${m.external_id}`);
    return !hit;
  });

  console.log(`Found ${broken.length} broken (unresolvable) mappings`);

  const adapters = sourceArg
    ? ADAPTERS.filter(a => a.source === sourceArg.toUpperCase())
    : ADAPTERS;

  if (adapters.length === 0) {
    console.error(`No adapter for source "${sourceArg}". Available: ${ADAPTERS.map(a => a.source).join(', ')}`);
    process.exit(1);
  }

  const output: string[] = ['# Mapping Suggestions', '', `Generated: ${new Date().toISOString()}`, ''];
  output.push('For each broken mapping, tick ONE candidate below. Then run `apply-mapping-fixes.ts`.');
  output.push('');
  output.push('Format per entry: `- [ ] id=... name="..." unit=... score=X cf=Y`');
  output.push('');

  let totalSuggested = 0;
  let totalNoCandidates = 0;

  for (const adapter of adapters) {
    const brokenForSource = broken.filter(m => normalizeSource(m.external_source) === adapter.source);
    if (brokenForSource.length === 0) continue;

    console.log(`\n[${adapter.source}] Loading catalog from ${adapter.table}...`);

    // Load the full catalog for this source once
    const catalogRows = await db.execute(sql.raw(`
      SELECT ${adapter.idColumn} as id, ${adapter.nameColumn} as name${adapter.unitColumn ? `, ${adapter.unitColumn} as unit` : ', NULL as unit'}
      FROM ${adapter.table}
    `));
    const catalog = ((catalogRows as any).rows ?? catalogRows) as Array<{ id: any; name: string; unit: string | null }>;
    console.log(`  ${catalog.length} catalog entries, ${brokenForSource.length} broken mappings`);

    output.push(`## ${adapter.source} (${brokenForSource.length} broken)`);
    output.push('');

    for (const m of brokenForSource) {
      // Score all catalog entries
      const candidates: Candidate[] = [];
      for (const entry of catalog) {
        const compoundScore = nameScore(m.compound_name, entry.name);
        const sourceNameScore = m.source_name ? nameScore(m.source_name, entry.name) : 0;
        let score = Math.max(compoundScore, sourceNameScore);
        if (score < 30) continue;

        // Unit bonus
        if (adapter.unitColumn && entry.unit && m.compound_unit) {
          const o = normalizeUnit(m.compound_unit);
          const s = normalizeUnit(entry.unit);
          if (o === s) score += 10;
          // Compatible (same dimension, different scale) → small bonus
          else if (['g', 'mg', 'ug'].includes(o) && ['g', 'mg', 'ug'].includes(s)) score += 5;
        }

        candidates.push({
          id: String(entry.id),
          name: entry.name,
          unit: entry.unit,
          score,
          suggestedCF: suggestCF(m.compound_unit, entry.unit ?? m.compound_unit),
        });
      }

      candidates.sort((a, b) => b.score - a.score);
      const top3 = candidates.slice(0, 3);

      output.push(`### ${m.compound_name} (cs_id: ${m.cs_id})`);
      output.push(`Broken: external_id=\`${m.external_id}\`, compound_unit=\`${m.compound_unit}\`, source_name=\`${m.source_name ?? '-'}\`, status=\`${m.verification_status ?? 'unverified'}\``);

      if (top3.length === 0) {
        output.push('- _No candidates — consider flagging as dead mapping_');
        totalNoCandidates++;
      } else {
        for (const c of top3) {
          output.push(`- [ ] id=\`${c.id}\` name="${c.name}" unit=\`${c.unit ?? 'n/a'}\` score=${c.score} cf=${c.suggestedCF}`);
        }
        totalSuggested++;
      }
      output.push('');
    }
  }

  output.push('---');
  output.push(`**Totals**: ${totalSuggested} with candidates, ${totalNoCandidates} with no candidates (likely dead).`);

  const outPath = 'docs/MAPPING_SUGGESTIONS.md';
  writeFileSync(outPath, output.join('\n'));
  console.log(`\nWrote ${outPath}`);
  console.log(`  ${totalSuggested} broken mappings with suggestions`);
  console.log(`  ${totalNoCandidates} with no candidates (likely dead — add to FLAGGED_MAPPINGS.md)`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
