# Plan — Saved meals, learned favorites, and quick add

Written 2026-10-07. The chat on `/analysis` is the main way to log; this builds around it.

## What the user gets

- **Quick-add row**: chips above the chat input, always visible, mixing saved meals and
  the foods you log most, ranked by use. About 6 chips, then **More…** for the full list
  (also where saved meals are renamed or deleted). **A tap adds straight to the log**,
  at your usual amount, with an "Added Coffee · Undo" line in the chat.
- **Saved meals**: a named group of foods with amounts. Saved two ways:
  - in the chat: "save this as my usual breakfast" → a card with a **Save meal** button;
  - by hand: select foods in the Today list → **Save as meal** link (next to the existing
    "Unselect all") → name it.
- **Learned favorites**: no star button. Nutri works out what you log most and your usual
  amount of each, straight from your log.
- **A smarter chat**: it knows your usual foods, amounts and saved meals, so "milk" means
  your semi-skimmed at your 200 g, and "the usual" / "my breakfast" brings up the meal.

New UI in total: the chip row, the More… list, a **Save meal** card button, and one link.

## Decisions (Jens, 2026-10-07)

- One quick-add list for meals and foods together, not two.
- Favorites are learned from the log, not starred.
- Tapping a chip adds instantly (not via the card); undo covers a mis-tap.
- Recipes (servings, cooked weight) and recommendations stay post-alpha
  (`project_post_alpha_helpfulness` memory). Saved meals are not recipes: logging one adds
  each food separately, exactly as if added one by one.

## What's there now (verified 2026-10-07 by reading the code)

| Finding | Where |
|---|---|
| `saved_meal_templates` table + `/api/meals/templates` exist, unused by any UI, table empty. Has `use_count`, `last_used_at`, `foods` (jsonb) | `db/schema/meal_tracking.ts`, route |
| Deleting a template only sets `is_active = false`: a meal the user deleted stays stored | `templates/route.ts` DELETE |
| The data export has no saved meals | `app/api/user/export/route.ts` |
| Templates route predates `withAuth()`; foods aren't checked for visibility | route |
| Account deletion already cascades to `saved_meal_templates` (and `favorite_foods`) | `delete-account/route.ts` |
| `favorite_foods` + `/api/meals/favorites`: unused, empty. Not used by this plan | |
| Every logged item stores grams in `portion_size` and a label in `portion_type` (search bar and chat alike) | `meals/sync` |

---

## Step 0 — Make saved meals safe to store

- **0.1** Move `/api/meals/templates` onto `withAuth()` with Zod. Items stored as
  `{ foodId, grams, portion }`; names are read live from `foods`, never stored twice.
- **0.2** Every food in a saved meal must be one the user may see (public, or their own
  private). Move the check from `meals/sync` into `lib/services/food-visibility.ts` and use
  it in both places.
- **0.3** **Delete means delete**: hard-delete the row. (Table is empty, so nothing to purge.)
- **0.4** Rename: `PATCH` with a new name.
- **0.5** Add saved meals to the data export.
- **Check:** integration test: create, list, rename, delete (row gone in the DB), export
  contains it, another user's foods are refused, another user's meal can't be read,
  renamed or deleted.

## Step 1 — What Nutri remembers ("usuals")

- **1.1** `lib/services/usuals.ts` → `getUsuals(userId)`:
  - **foods**, derived from the user's own `meal_items` (last 90 days, active meals):
    times logged, last logged, **usual amount** (median grams) and the label most often
    used with it. Nothing new is stored, so deleting entries or the account removes it.
  - **saved meals**, with `use_count`, `last_used_at` and their items.
- **1.2** One ranking for both: uses in the last 30 days, then most recent. A pure function,
  unit-tested on its own.
- **1.3** A food that only ever appears as part of a saved meal isn't also shown as a
  separate chip unless it's logged on its own too.
- **Check:** unit tests for ranking and usual amount; integration test against real rows.

## Step 2 — Quick add

- **2.1** `GET /api/quick-add` (withAuth): the ranked list, chips first.
- **2.2** `meals/sync` `addMany` takes an optional `savedMealId`: the meal's use count and
  last-used time go up in the same request (only for the caller's own meal).
- **2.3** Chip row above the chat input in `FoodLogChat.tsx`: ~6 chips (meals show
  "· 3"), then **More…**. Horizontal scroll on a phone.
- **2.4** Tap → adds instantly through the same path as **Add foods**
  (`handleAddFoodsFromChat`, optimistic) → "Added Coffee · Undo" line in the chat thread.
  Undo removes exactly the items that tap added (their ids come back from the add).
- **2.5** **More…**: the full list. Saved meals get rename and delete there.
- **2.6** Refresh the row after anything is added, so ranks follow use.
- **Check:** integration test: a tap adds the right items at the usual amount and bumps
  the meal's count; undo removes exactly those items. Jens looks at the row.

## Step 3 — Save as meal, by hand

- **3.1** In the Today list, when items are selected: a **Save as meal** link next to
  "Unselect all" → inline name field → saves those items with their logged grams/labels.
- **Check:** saved meal equals the selected items. Jens looks at it.

## Step 4 — The chat knows your usuals

- **4.1** Each turn, the server adds a short context block to the conversation: top ~15
  usual foods (name, id, usual amount) and the saved meals (name, items). Built
  server-side from `getUsuals`, never from the client.
- **4.2** Prompt, a few lines: prefer the user's usual version and amount; a saved meal's
  name (or "the usual") means its foods; propose them as usual.
- **4.3** New tool `propose_saved_meal { name, items }` → a card with **Save meal**. Like
  `propose_foods`, the model only proposes; the button saves. "Save this as…" uses the list
  on screen; "save my breakfast as…" can use today's log.
- **4.4** Chat eval: `runFoodLogChat` accepts injected usuals so the eval needs no real
  history. New cases: "milk" picks the usual milk at the usual amount; "the usual" brings
  the saved meal; "save this as my breakfast" gives a save card; no regression on the 20.
- **Check:** eval before/after; two-turn check still passes.

## Step 5 — Records

- **5.1** CLAUDE.md: tasks in §3, ledger rows for "saved meals delete for real" and "export
  includes saved meals".
- **5.2** Privacy policy draft: the chat sends your frequent food names and amounts with
  each message (covered by the AI-logging consent, but it should be said).
- **5.3** `favorite_foods` / `/api/meals/favorites`: unused before and after this. Goes on
  the confirm-to-delete list, not deleted here.

## Order

0 → 1 → 2 → 3 → 4 → 5. Steps 2 and 3 are what you see; 4 is what makes the chat feel like
it knows you. Each step is checked and committed on its own.
