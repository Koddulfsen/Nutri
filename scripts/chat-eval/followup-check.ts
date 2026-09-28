/**
 * Two-turn checks: does the chat build on the list it proposed before?
 *
 *   1. "two eggs" → a list. The user adds it, then says "and a coffee":
 *      the new list should be only the coffee.
 *   2. "two eggs" → a list, not added. "actually make it three":
 *      the new list should be the eggs again, at about 150 g.
 *
 * Spends ~3 Haiku calls (~$0.01). No writes.
 *   npx tsx scripts/chat-eval/followup-check.ts
 */
import 'dotenv/config';
import { runFoodLogChat, type FoodLogChatTurn } from '@/lib/ai/food-log-chat';

const USER = '00000000-0000-4000-8000-000000000000';

function show(label: string, r: Awaited<ReturnType<typeof runFoodLogChat>>) {
  const items = r.proposal?.items.map((i) => `${i.name} ${i.grams} g`).join('; ') ?? '(no list)';
  console.log(`${label}\n  says:  ${r.response.replace(/\n/g, ' ')}\n  list:  ${items}\n  calls: ${r.usage.calls}`);
}

async function main() {
  const first = await runFoodLogChat({ userId: USER, history: [], message: 'two eggs' });
  show('turn 1: "two eggs"', first);
  if (!first.proposal) throw new Error('turn 1 proposed nothing');

  const base: FoodLogChatTurn[] = [
    { role: 'user', content: 'two eggs' },
    { role: 'assistant', content: first.response, proposal: first.proposal },
  ];

  const added = await runFoodLogChat({
    userId: USER,
    history: [base[0], { ...base[1], proposalStatus: 'added' }],
    message: 'and a coffee',
  });
  show('turn 2 after adding: "and a coffee"', added);

  const corrected = await runFoodLogChat({
    userId: USER,
    history: [base[0], { ...base[1], proposalStatus: 'open' }],
    message: 'actually make it three',
  });
  show('turn 2 before adding: "actually make it three"', corrected);

  const onlyCoffee = added.proposal?.items.every((i) => !/egg/i.test(i.name)) && added.proposal.items.length > 0;
  const eggs = corrected.proposal?.items.find((i) => /egg/i.test(i.name));
  console.log(`\nafter adding, only the new food: ${onlyCoffee ? 'yes' : 'NO'}`);
  console.log(`correction re-proposed ~150 g eggs: ${eggs && eggs.grams >= 130 && eggs.grams <= 180 ? 'yes' : 'NO'}`);
  process.exit(0);
}

main();
