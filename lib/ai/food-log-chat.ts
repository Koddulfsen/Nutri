/**
 * The food-logging chat: one user message in, one assistant reply out — and,
 * when the user mentioned food, a proposed list of foods for the UI to show
 * with an "Add foods" button.
 *
 * The model can only search and propose. It cannot write to the user's log:
 * saving happens when the user presses the button (POST /api/meals/sync,
 * `addMany`), so what gets saved is exactly what was on screen.
 *
 * Lives outside the route so scripts/chat-eval can run the same code the app
 * runs. Auth, consent and rate limiting stay in the route — callers here are
 * trusted to have done them.
 */

import { and, eq, inArray, or } from 'drizzle-orm';
import {
  chatWithTools,
  type ChatMessage,
  type ChatTool,
  type ChatUsage,
  type ToolCallRecord,
} from '@/lib/ai/anthropic-client';
import { getFoodLogChatSystemPrompt } from '@/lib/ai/prompts';
import { searchService } from '@/lib/search/search-service';
import { db } from '@/db';
import { foods } from '@/db/schema';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_QUERIES = 12;
const MAX_ITEMS = 25;
const MAX_GRAMS = 5000;

/** One food on the proposed list, as the UI shows it and saves it. */
export interface ProposalItem {
  foodId: string;
  /** The database name — never the model's wording. */
  name: string;
  /** What gets saved. */
  grams: number;
  /** How the user would say the amount: "2 eggs", "1 glass". Display only. */
  portion: string;
  /** Filled in by assumption rather than said by the user. */
  guessed: boolean;
  /** e.g. "closest match to almonds". */
  note?: string;
}

export interface Proposal {
  items: ProposalItem[];
}

/**
 * A past turn. Assistant turns carry the list they proposed and what became of
 * it, so the model knows what's on screen and what's already in the log.
 */
export interface FoodLogChatTurn {
  role: 'user' | 'assistant';
  content: string;
  proposal?: Proposal;
  proposalStatus?: 'open' | 'added' | 'replaced';
}

export interface FoodLogChatInput {
  userId: string;
  /** Earlier turns, oldest first. */
  history: FoodLogChatTurn[];
  message: string;
  /** Called as the chat works through its steps, with a short user-facing label. */
  onProgress?: (label: string) => void;
  /** Kept for the eval harness; the chat has no writing tools any more. */
  dryRun?: boolean;
}

export interface FoodLogChatResult {
  response: string;
  proposal?: Proposal;
  toolCalls: ToolCallRecord[];
  usage: ChatUsage;
}

/** How a past turn reads to the model: its text, plus the list it proposed. */
function renderTurn(turn: FoodLogChatTurn): ChatMessage {
  if (turn.role !== 'assistant' || !turn.proposal?.items.length) {
    return { role: turn.role, content: turn.content };
  }
  const status =
    turn.proposalStatus === 'added'
      ? 'the user added these to their log'
      : turn.proposalStatus === 'replaced'
        ? 'replaced by a later list'
        : 'on screen, not added yet';
  const items = turn.proposal.items
    .map((i) => `${i.name} (id ${i.foodId}) — ${i.portion}, ${i.grams} g${i.guessed ? ', guessed' : ''}`)
    .join('; ');
  return { role: 'assistant', content: `${turn.content}\n[Proposed foods — ${status}: ${items}]`.trim() };
}

function buildTools(userId: string, onProposal: (p: Proposal) => void): ChatTool[] {
  return [
    {
      name: 'search_foods',
      description:
        'Search the Nutri food database. Pass every food you need at once, one short English term each ("egg", "rice", "peanut butter"). Returns up to 8 matches per term, best match first, each with an id and name. The user\'s own saved recipes are included.',
      input_schema: {
        type: 'object',
        properties: {
          queries: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: MAX_QUERIES,
            description: 'One search term per food.',
          },
        },
        required: ['queries'],
      },
      handler: async (input) => {
        const queries = (Array.isArray(input.queries) ? input.queries : [input.queries])
          .map((q) => String(q ?? '').trim())
          .filter(Boolean)
          .slice(0, MAX_QUERIES);
        if (queries.length === 0) return JSON.stringify({ error: 'queries required' });

        const found = await Promise.all(
          queries.map(async (query) => {
            const res = await searchService.searchFoods({
              query,
              page: 1,
              limit: 8,
              sortBy: 'relevance',
              sortOrder: 'desc',
              userId, // include the user's private foods (their saved recipes)
            });
            return [query, res.results.filter((r) => r.id).map((r) => ({ id: r.id, name: r.name }))] as const;
          })
        );
        return JSON.stringify({ results: Object.fromEntries(found) });
      },
    },
    {
      name: 'propose_foods',
      description:
        'Show the user the foods to add, as a list with an "Add foods" button. They can change amounts or remove items before adding. Always the complete list for this turn. food_id must come from search_foods.',
      input_schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            minItems: 1,
            maxItems: MAX_ITEMS,
            items: {
              type: 'object',
              properties: {
                food_id: { type: 'string', description: 'id from search_foods.' },
                grams: { type: 'number', description: 'Amount in grams (ml ≈ g for drinks).' },
                portion: { type: 'string', description: 'The amount as the user would say it: "2 eggs", "1 glass", "a handful".' },
                guessed: { type: 'boolean', description: 'True if you assumed this food or amount rather than the user saying it.' },
                note: { type: 'string', description: 'Optional, very short: e.g. "closest match to almonds".' },
              },
              required: ['food_id', 'grams', 'portion', 'guessed'],
            },
          },
        },
        required: ['items'],
      },
      handler: async (input) => {
        const raw = Array.isArray(input.items) ? (input.items as Array<Record<string, unknown>>) : [];
        if (raw.length === 0) return JSON.stringify({ error: 'items required.' });
        if (raw.length > MAX_ITEMS) return JSON.stringify({ error: `at most ${MAX_ITEMS} items.` });

        for (let i = 0; i < raw.length; i++) {
          const grams = Number(raw[i].grams);
          if (!UUID_RE.test(String(raw[i].food_id ?? ''))) {
            return JSON.stringify({ error: `item ${i}: food_id must be an id from search_foods.` });
          }
          if (!Number.isFinite(grams) || grams <= 0 || grams > MAX_GRAMS) {
            return JSON.stringify({ error: `item ${i}: grams must be between 0 and ${MAX_GRAMS}.` });
          }
        }

        // Only foods this user may see: public ones, and their own private ones.
        const ids = [...new Set(raw.map((r) => String(r.food_id)))];
        const rows = await db
          .select({ id: foods.id, name: foods.name })
          .from(foods)
          .where(
            and(
              inArray(foods.id, ids),
              or(eq(foods.visibility, 'public'), and(eq(foods.visibility, 'private'), eq(foods.createdBy, userId)))
            )
          );
        const names = new Map(rows.map((r) => [r.id, r.name]));
        const unknown = ids.filter((id) => !names.has(id));
        if (unknown.length > 0) {
          return JSON.stringify({ error: `not in the database: ${unknown.join(', ')}. Use ids from search_foods.` });
        }

        const items: ProposalItem[] = raw.map((r) => ({
          foodId: String(r.food_id),
          name: names.get(String(r.food_id))!,
          grams: Math.round(Number(r.grams) * 10) / 10,
          portion: String(r.portion ?? '').trim() || `${Number(r.grams)} g`,
          guessed: r.guessed === true,
          note: r.note ? String(r.note).trim().slice(0, 120) : undefined,
        }));
        onProposal({ items });
        return JSON.stringify({ ok: true, shown: items.length });
      },
    },
  ];
}

function progressLabel(tool: string, input: Record<string, unknown>): string {
  if (tool === 'search_foods') {
    const queries = Array.isArray(input.queries) ? input.queries.map(String) : [];
    return queries.length ? `Looking up ${queries.join(', ')}` : 'Looking up foods';
  }
  if (tool === 'propose_foods') return 'Putting your list together';
  return 'Working';
}

export async function runFoodLogChat(input: FoodLogChatInput): Promise<FoodLogChatResult> {
  let proposal: Proposal | undefined;

  const messages: ChatMessage[] = [
    ...input.history.map(renderTurn),
    { role: 'user', content: input.message },
  ];

  input.onProgress?.('Reading your message');
  const { response, toolCalls, usage } = await chatWithTools(
    getFoodLogChatSystemPrompt(),
    messages,
    // The turn ends in the round a list is proposed, so several propose_foods
    // calls can only come from that one round: they're parts of one list.
    buildTools(input.userId, (p) => (proposal = { items: [...(proposal?.items ?? []), ...p.items] })),
    {
      maxTokens: 1024,
      // Same message, same list: a logging tool shouldn't answer differently each time.
      temperature: 0,
      // search → propose is two rounds; the rest is room for a retry.
      maxIterations: 4,
      label: 'log-food',
      finishTools: ['propose_foods'],
      lastRoundNote:
        'This is your last step: no more searching. Propose the foods you have found (closest matches are fine), or reply in words.',
      outOfRoundsReply: "I couldn't find good matches for that in the database. Could you describe it differently?",
      onToolStart: (name, toolInput) => input.onProgress?.(progressLabel(name, toolInput)),
    }
  );

  if (proposal && !response.trim()) {
    return { response: "Here's what I found.", proposal, toolCalls, usage };
  }
  return { response, proposal, toolCalls, usage };
}
