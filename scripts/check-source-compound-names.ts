/**
 * Check source compound names against Nutri's core compounds.
 *
 * Purpose: before writing a new source seed, run this to build the
 * COMPOUND_NAME_MAP. Finds exact matches, fuzzy matches, and gaps.
 *
 * Usage:
 *   npx tsx scripts/check-source-compound-names.ts \
 *     "Vitamin A" "Iron" "Calcium" "Choline" "Boron"
 *
 *   # or from a file (one name per line)
 *   npx tsx scripts/check-source-compound-names.ts --file names.txt
 *
 * Output: table of source name → best DB match → confidence + suggested
 *         NAME_MAP literal ready to paste into a seed file.
 */

import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync } from 'fs';

const sql = postgres(process.env.DATABASE_URL!);

// Normalize for fuzzy matching: lowercase, strip parens, strip punctuation
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Score: Jaccard-like similarity on whitespace-split tokens.
function score(a: string, b: string): number {
  const ta = new Set(normalize(a).split(' ').filter(Boolean));
  const tb = new Set(normalize(b).split(' ').filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersect = 0;
  for (const t of ta) if (tb.has(t)) intersect++;
  const union = new Set([...ta, ...tb]).size;
  return intersect / union;
}

interface Match {
  sourceName: string;
  bestDbName: string | null;
  confidence: number;
  verdict: 'exact' | 'fuzzy' | 'missing';
}

async function main() {
  const args = process.argv.slice(2);
  let sourceNames: string[] = [];

  if (args[0] === '--file') {
    if (!args[1]) {
      console.error('Usage: --file <path>');
      process.exit(1);
    }
    sourceNames = readFileSync(args[1], 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));
  } else if (args.length > 0) {
    sourceNames = args;
  } else {
    console.error('Usage:');
    console.error('  npx tsx scripts/check-source-compound-names.ts "Name1" "Name2" ...');
    console.error('  npx tsx scripts/check-source-compound-names.ts --file names.txt');
    process.exit(1);
  }

  const dbRows = await sql`SELECT name FROM compounds WHERE tier = 'core' ORDER BY name`;
  const dbNames: string[] = dbRows.map((r: any) => r.name);

  const matches: Match[] = sourceNames.map((sourceName) => {
    const exact = dbNames.find((n) => n === sourceName);
    if (exact) return { sourceName, bestDbName: exact, confidence: 1.0, verdict: 'exact' };

    let best: { name: string; score: number } | null = null;
    for (const n of dbNames) {
      const s = score(sourceName, n);
      if (!best || s > best.score) best = { name: n, score: s };
    }
    if (best && best.score >= 0.5) {
      return { sourceName, bestDbName: best.name, confidence: best.score, verdict: 'fuzzy' };
    }
    return { sourceName, bestDbName: null, confidence: best?.score ?? 0, verdict: 'missing' };
  });

  // Print results
  console.log('\n═══ Compound name check ═══\n');
  const col = (s: string, w: number) => (s + ' '.repeat(w)).slice(0, w);
  console.log(
    col('Source name', 30) +
    col('DB name', 40) +
    col('Confidence', 12) +
    'Verdict'
  );
  console.log('─'.repeat(100));
  for (const m of matches) {
    console.log(
      col(m.sourceName, 30) +
      col(m.bestDbName ?? '—', 40) +
      col(m.confidence === 1 ? 'exact' : m.confidence.toFixed(2), 12) +
      m.verdict
    );
  }

  const mapEntries = matches.filter((m) => m.verdict === 'fuzzy');
  const exact = matches.filter((m) => m.verdict === 'exact');
  const missing = matches.filter((m) => m.verdict === 'missing');

  console.log('\n─── Summary ───');
  console.log(`  Exact:   ${exact.length}`);
  console.log(`  Fuzzy:   ${mapEntries.length}`);
  console.log(`  Missing: ${missing.length}`);

  if (mapEntries.length > 0) {
    console.log('\n─── Suggested COMPOUND_NAME_MAP ───\n');
    console.log('const COMPOUND_NAME_MAP: Record<string, string> = {');
    for (const m of mapEntries) {
      console.log(`  ${JSON.stringify(m.sourceName)}: ${JSON.stringify(m.bestDbName)},`);
    }
    console.log('};');
  }

  if (missing.length > 0) {
    console.log('\n─── Missing compounds (source covers, Nutri does not track) ───');
    for (const m of missing) console.log(`  ${m.sourceName}`);
    console.log('\nDecide: skip these rows, OR add compound to Nutri core.');
  }

  await sql.end();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
