# Plan — Food-logging chat: simpler, cheaper, one-click logging

Written 2026-09-28. Scope: the `/analysis` chat (`app/analysis/FoodLogChat.tsx` →
`app/api/ai/log-food/route.ts`, Haiku 4.5 tool loop).

## Goal

1. Asks fewer questions. Still a real conversation, but more to the point.
2. When there's a food list, an **Add foods** button saves it. No typing "yes".
3. What gets saved is exactly what was shown.
4. Costs less per logged meal, and there's a ceiling on what one user can spend.

## What's there now (verified 2026-09-28 by reading the code)

| Finding | Where |
|---|---|
| Food IDs are dropped between turns (client keeps text only), so "yes" makes the model search again and it can pick a different row than it showed | `FoodLogChat.tsx:15`, route returns `toolCalls` that the client ignores |
| Confirming costs a full model loop (2–3 calls) | prompt step 4 + `log_meal` tool |
| Prompt pushes toward questions ("ask ONE focused question", "ASK about food IDENTITY … brand, raw vs cooked") and every proposal ends "Want me to log this?" | `lib/ai/prompts.ts:240-326` |
| Chat saves each food as its own untitled meal; manual search adds to the active meal tab or "Today" | `log_meal` → `createMeal()` per item vs `app/api/meals/sync/route.ts` |
| Search sorts A–Z, not by best match, and returns 8 results | `lib/search/search-service.ts` `orderBy(asc(foods.name))` |
| `checkAiRateLimit()` (30/hour, fails closed) exists but **nothing calls it**, so AI routes have no limit | `lib/rate-limit/index.ts:156` |
| `log-food` doesn't use `withAuth()` | route handles auth by hand |
| Up to 6 loop rounds, then "I ran out of steps" | `chatWithTools` `maxIterations` |

## Principle for the AI's behavior

Trust the model and write a short prompt. Tell it what the job is and what matters; don't
script each turn. It stays conversational (answers questions, chats, asks when it genuinely
has to) but defaults to making a reasonable guess and showing a list the user can fix, rather
than asking first. The button handles confirmation, so the prompt no longer needs to.

---

## Step 0 — A way to measure (before changing anything)

Without this, "better" is a feeling.

- **0.1** Pull the chat's core out of the HTTP handler into `lib/ai/food-log-chat.ts` →
  `runFoodLogChat({ userId, messages, date, draft? })`. Pure move; the route calls it.
  Check: `npm run build`, chat still works for Jens.
- **0.2** Write `scripts/chat-eval/messages.json` with about 20 made-up messages covering:
  simple ("two eggs"), vague ("a sandwich"), multi-item, named recipe ("my smoothie"),
  branded ("a Clif bar"), a question ("is avocado high in fat?"), non-food chatter.
  Synthetic only; no real user text.
- **0.3** `scripts/chat-eval/run.ts`: runs each message through `runFoodLogChat` (single
  turn, test user, no writes) and records whether it asked a question or proposed foods,
  the foods proposed, model calls, and input/output tokens. Prints a table and saves JSON
  for comparison. Cost is roughly $0.02 × 20 ≈ **under $1 per run**. Jens approves each run.
- **0.4** Run once on the current system → `baseline.json`.

## Step 1 — Spend cap (small, independent)

- **1.1** Call `checkAiRateLimit(userId)` in `log-food` right after auth. On limit, return
  429 with a friendly message ("You've hit the hourly chat limit — try again in N minutes").
- **1.2** Same call in the other user-facing AI routes: `smart-search`, `clarify`,
  `synthesize-portions`. (`/api/ai/chat` is admin-only.)
- **1.3** Move `log-food` onto `withAuth()` with its Zod schema (CLAUDE.md door), then
  `npm run check:auth`.
- **1.4** Chat UI shows the 429 message as a normal chat error.
- **Check:** temporarily set the limit to 2 locally → third message shows the message →
  restore to 30. The limiter fails **closed**: if Postgres is unreachable the chat is
  refused rather than made free. That's intentional (see the comment on the function).
- Note: this caps *messages*, not *money*. A real per-user spend budget (task 2.9) can
  follow later by summing the tokens `logUsage()` already logs.

## Step 2 — Search sorts by best match

- **2.1** In `searchDatabase`, replace `orderBy(asc(foods.name))` with a rank: exact name
  → name starts with the term → a word starts with the term → contains; then shorter names
  first; then A–Z.
- **2.2** `search_foods` accepts several queries at once (`queries: ["egg","bread"]`), run
  in parallel, so a 4-item meal is one tool round instead of up to 4.
- **Check:** a unit test on the ordering, plus "egg"/"milk"/"bread" before and after.
  This also affects the manual search bar (same service); Jens looks at that.

## Step 3 — New prompt: shorter, trusting, less question-prone

- **3.1** Rewrite `FOOD_LOG_CHAT_SYSTEM` to about 20 lines. Draft direction (not final):

  > You're Nutri's food-logging companion. People tell you what they ate or drank; help get
  > it into their log accurately, with as little back-and-forth as possible. Keep replies
  > short and natural.
  >
  > When you know roughly what they had, search the database and propose the foods.
  > Fill gaps with sensible assumptions (the common version, a typical portion) and mark
  > them as guesses. The user can adjust the list, so a good guess beats a question. Ask
  > only when a wrong guess would matter and you can't reasonably pick.
  >
  > If they ask something or just chat, answer normally. Only use foods the database
  > returned. If something isn't there, pick the closest and say so.

- **3.2** Drop the parts the button makes unnecessary: the confirm step, "Want me to log
  this?", and the three-case composite essay (moves to step 6).
- **Check:** eval run vs baseline. Expect far fewer "asked a question" rows and similar or
  better food picks. Jens reads the table.
- Step 3 can ship before step 4, but it ships best with it: without the button the model
  still needs a "yes", so 3 and 4 land together.

## Step 4 — Food card + Add foods button (the main change)

The AI stops saving anything. It can only *propose*; the user saves.

- **4.1** New tool `propose_foods`: `{ items: [{ food_id, amount, unit, grams, guessed, note? }] }`.
  Server checks each `food_id` exists and is visible to this user (public or their own
  private food), fills in the real name from the database, and returns the validated
  list. The model's reply ends after this call.
- **4.2** Remove the `log_meal` tool. The route returns `{ response, proposal? }`.
- **4.3** Client stores `proposal` on the assistant message and renders a **card** under
  the bubble: each food with its amount (editable), a ✕ to remove, and "guessed" items
  shown lightly (e.g. "white bread · guessed"). Buttons: **Add foods**, and later
  **Save as recipe** (step 6). Styling follows the existing `.ac-card`/`.hl-card` card
  language (CLAUDE.md §8).
- **4.4** Saving: extend `/api/meals/sync` with `{ type: 'addMany', mealId?, foods: [...] }`.
  It goes into the active meal tab, or "Today", **exactly like the manual search bar**, in
  one transaction. Same visibility check as 4.1 on every `foodId`. The chat then refreshes
  the day the way it does now (`onMealLogged`).
- **4.5** After Add foods the card switches to "Added ✓" and can't be added twice (button
  disabled, and the client tracks which proposal id was saved).
- **4.6** Refining ("actually it was sourdough"): the client sends the current card as
  `draft` with the next message. The model sees it and proposes an updated card, searching
  again only for what changed. The old card is marked "replaced".
- **Check:** eval run; model calls per logged meal should drop by about half (no "yes"
  turn). Then end to end on the dev server: a message → card → edit an amount → Add
  foods → the rows in `meal_items` match the card exactly (checked with psql). Jens looks
  at the card.

## Step 5 — Real progress + a tighter loop

- **5.1** Change the route to stream small progress events (NDJSON): `thinking`,
  `searching: egg, bread`, `picking`, then the final reply + proposal. The model is still
  called once per round, so this adds almost nothing to the cost; we just report the
  steps as they happen.
- **5.2** Replace the cycling fake statuses in `FoodLogChat.tsx` and `chat-handoff.ts`
  with the real ones. Keep the front-page handoff animation working (it reads the same
  promise; that becomes the stream).
- **5.3** Cut `maxIterations` from 6 to 4. With batched search (2.2) a normal log is
  search → propose, i.e. 2 rounds. Replace the "ran out of steps" dead end with a proper
  fallback message.
- **Decision point:** if the eval still shows rounds wandering, move to a fixed
  parse → search → pick pipeline. Otherwise keep the loop, since it's what keeps the chat
  able to hold a normal conversation.

## Step 6 — Recipes as a button

- **6.1** Move the composite-creation code out of the tool into
  `lib/services/composite-service.ts`, plus a `withAuth` route.
- **6.2** **Save as recipe** on the card → asks for a name → saves a private recipe from
  the card's items → future searches find it ("my smoothie").
- **6.3** Remove the `create_composite` tool.
- **Open question for Jens:** the tool can also submit *branded* products to the public
  review queue. Keep that as a second button ("Submit as product"), or drop it for alpha?

## Step 7 — Cleanup and record-keeping

- **7.1** Delete what the new flow replaced: the old prompt sections, the `log_meal`
  handler, and the unused `toolCalls` passthrough. Prove nothing imports each piece first
  (CLAUDE.md delete door).
- **7.2** CLAUDE.md: add these tasks to §3, record in the §4 trust ledger that the AI
  limiter wasn't wired until now, and update §1.
- **7.3** Final eval run; keep `baseline.json` and `final.json` side by side.

---

## Order and size

| Step | Size | Depends on |
|---|---|---|
| 0 Measure | small | — |
| 1 Spend cap | small | — |
| 2 Search ranking | small | — |
| 3 Prompt | small | 0 (to compare) |
| 4 Card + button | medium | ships with 3 |
| 5 Progress + tighter loop | medium | 2, 4 |
| 6 Recipes button | small–medium | 4 |
| 7 Cleanup | small | all |

1 and 2 can go any time. 3 + 4 are the change users feel.

## Not in this plan

- Meaning-based (embedding) search: only worth it once the `foods` table is large.
- Switching model: Haiku 4.5 is the cheapest and fine for this; revisit only if the eval
  shows bad picks.
- A full spend budget in money (task 2.9) beyond the message cap in step 1.
