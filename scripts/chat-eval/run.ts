/**
 * Runs the food-logging chat over a fixed set of made-up messages and records
 * what it did: proposed foods, asked a question, or just answered — plus how
 * many model calls and tokens each took.
 *
 * Spends real money (Haiku, roughly $0.01–0.03 per message). Nothing is written
 * to the database: tools run with dryRun.
 *
 *   npx tsx scripts/chat-eval/run.ts <label>
 *
 * Writes scripts/chat-eval/results/<label>.json and prints a table.
 * Compare two runs: npx tsx scripts/chat-eval/compare.ts <a> <b>
 */
import 'dotenv/config';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFoodLogChat } from '@/lib/ai/food-log-chat';

const here = path.dirname(fileURLToPath(import.meta.url));

// Haiku 4.5, $ per token
const INPUT_PRICE = 1 / 1_000_000;
const OUTPUT_PRICE = 5 / 1_000_000;

// A user id that owns nothing, so search sees public foods only.
const EVAL_USER = '00000000-0000-4000-8000-000000000000';

interface Case {
  id: string;
  message: string;
  expect: 'foods' | 'answer' | 'either';
}

export interface CaseResult {
  id: string;
  message: string;
  expect: Case['expect'];
  outcome: 'proposed' | 'asked' | 'answered' | 'error';
  foods: string[];
  response: string;
  tools: string[];
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  ms: number;
}

/** Foods from a structured proposal, or — for the old text-only chat — the "- " lines. */
function proposedFoods(result: { response: string } & Record<string, unknown>): string[] {
  const proposal = result.proposal as
    | { items?: Array<{ name: string; grams: number; portion: string; guessed?: boolean }> }
    | undefined;
  if (proposal?.items?.length) {
    return proposal.items.map((i) => `${i.name} — ${i.portion}, ${i.grams} g${i.guessed ? ' (guess)' : ''}`);
  }
  return result.response
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^[-•*]\s/.test(l))
    .map((l) => l.replace(/^[-•*]\s+/, ''));
}

async function runCase(c: Case): Promise<CaseResult> {
  const started = Date.now();
  try {
    const result = await runFoodLogChat({ userId: EVAL_USER, history: [], message: c.message, dryRun: true });
    const foods = proposedFoods(result as unknown as { response: string } & Record<string, unknown>);
    const outcome = foods.length > 0 ? 'proposed' : result.response.includes('?') ? 'asked' : 'answered';
    return {
      id: c.id,
      message: c.message,
      expect: c.expect,
      outcome,
      foods,
      response: result.response,
      tools: result.toolCalls.map((t) => t.name),
      calls: result.usage.calls,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      cost: result.usage.inputTokens * INPUT_PRICE + result.usage.outputTokens * OUTPUT_PRICE,
      ms: Date.now() - started,
    };
  } catch (err) {
    return {
      id: c.id,
      message: c.message,
      expect: c.expect,
      outcome: 'error',
      foods: [],
      response: err instanceof Error ? err.message : String(err),
      tools: [],
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      ms: Date.now() - started,
    };
  }
}

async function main() {
  const label = process.argv[2];
  if (!label) {
    console.error('usage: npx tsx scripts/chat-eval/run.ts <label>');
    process.exit(1);
  }
  const cases: Case[] = JSON.parse(readFileSync(path.join(here, 'messages.json'), 'utf8'));

  // A few at a time — fast, without tripping API rate limits.
  const results: CaseResult[] = [];
  const queue = [...cases];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let c = queue.shift(); c; c = queue.shift()) {
        const r = await runCase(c);
        results.push(r);
        process.stderr.write(`  ${r.outcome.padEnd(9)} ${r.id}\n`);
      }
    })
  );
  results.sort((a, b) => cases.findIndex((c) => c.id === a.id) - cases.findIndex((c) => c.id === b.id));

  mkdirSync(path.join(here, 'results'), { recursive: true });
  const out = path.join(here, 'results', `${label}.json`);
  writeFileSync(out, JSON.stringify({ label, ranAt: new Date().toISOString(), results }, null, 2));

  printSummary(label, results);
  console.log(`\nSaved ${path.relative(process.cwd(), out)}`);
  process.exit(0);
}

export function printSummary(label: string, results: CaseResult[]) {
  console.log(`\n${label}`);
  console.log('id'.padEnd(18), 'outcome'.padEnd(9), 'calls', ' tokens in/out', '   cost', ' foods');
  for (const r of results) {
    console.log(
      r.id.padEnd(18),
      r.outcome.padEnd(9),
      String(r.calls).padStart(5),
      `${r.inputTokens}/${r.outputTokens}`.padStart(14),
      `$${r.cost.toFixed(4)}`.padStart(8),
      ' ' + r.foods.join('; ')
    );
  }
  const n = (o: string) => results.filter((r) => r.outcome === o).length;
  const total = results.reduce((s, r) => s + r.cost, 0);
  const calls = results.reduce((s, r) => s + r.calls, 0);
  const wrong = results.filter(
    (r) => (r.expect === 'foods' && r.outcome !== 'proposed') || (r.expect === 'answer' && r.outcome === 'proposed')
  );
  console.log(
    `\nproposed ${n('proposed')} · asked ${n('asked')} · answered ${n('answered')} · errors ${n('error')}` +
      ` · model calls ${calls} · cost $${total.toFixed(3)} ($${(total / results.length).toFixed(4)}/msg)`
  );
  console.log(`not what was expected: ${wrong.map((r) => r.id).join(', ') || 'none'}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
