# Plan — Saved meals, learned favorites, and quick add

Written 2026-10-07. The chat on `/analysis` is the main way to log; this builds around it.

## What the user gets

Everything about *what you ate* lives in the food list next to the chat; the chat stays the
main way to type it in.

```
┌──────────────────────────────┐
│ TODAY              My meals ▸│   ← opens the My meals modal
│  Oats              60 g    ✕ │
│  Blueberries       50 g    ✕ │
│ ──────────────────────────── │   ← grey separator
│  Usual breakfast · 3       + │   ← up to 5 greyed suggestions:
│  Skyr             170 g    + │     your most-used foods and
│  Coffee           200 g    + │     saved meals
└──────────────────────────────┘
```

- **Suggestions** below the day's foods, greyed, each with **+**: up to 5, mixing saved
  meals and the foods you log most, at your usual amount. **+** adds it to the list above;
  the row's ✕ undoes a mistake. Anything already logged today isn't suggested.
- **My meals** button → modal with your saved meals: one tap adds a whole meal; rename and
  delete live here; a search field appears once there are more than ~8 meals.
- **Save as meal**: select foods in the list → link next to "Unselect all" → name it.
- **Learned favorites**: no star. Nutri works out what you log most and your usual amount,
  straight from your log. They feed the suggestions now, and the chat later.
- Phones: the same list component is used in the mobile food section, so all of this is
  there too.

## Decisions (Jens, 2026-10-07)

- Saved meals: a **My meals** button + modal. Learned favorites: not in the modal; they
  show as suggestions and feed the chat.
- Suggestions sit in the food list, below a grey separator: up to 5, saved meals included.
- A tap adds instantly; the item's own ✕ is the undo.
- **Build the system and the manual flow first; how the chat uses it is discussed after.**
- Recipes (servings, cooked weight) and recommendations stay post-alpha. Saved meals are not
  recipes: logging one adds each food separately, as if added one by one.

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

## Step 2 — Suggestions and My meals

- **2.1** `GET /api/quick-add` (withAuth): ranked suggestions (top 5, excluding what's
  already logged on the day) and the saved meals.
- **2.2** `meals/sync` `addMany` takes an optional `savedMealId`: the meal's use count and
  last-used time go up in the same request (only for the caller's own meal).
- **2.3** Suggestions under the day's foods in the food list, greyed, with **+**. Built as
  one component used both beside the chat and in the mobile food section.
- **2.4** **+** adds through the same path as **Add foods** (optimistic, one sync call).
- **2.5** **My meals** button → modal: saved meals with their foods, add, rename, delete;
  search once there are more than ~8.
- **2.6** Suggestions refresh after anything is added or removed.
- **Check:** integration test: adding a suggestion logs the right items at the usual amount
  and bumps the meal's count. Jens looks at it.

## Step 3 — Save as meal, by hand

- **3.1** In the food list, when items are selected: a **Save as meal** link next to
  "Unselect all" → inline name field → saves those items with their logged grams/labels.
- **Check:** saved meal equals the selected items. Jens looks at it.

## Step 4 — The chat knows your usuals *(after discussion — not part of the first build)*

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
- **5.2** Privacy policy draft: saved meals added to the data table and the deletion
  paragraph; a line on suggestions (done 2026-10-07). **When step 4 lands**, update the
  Anthropic paragraph: the chat will then also send your frequent food names and amounts.
- **5.3** `favorite_foods` / `/api/meals/favorites`: unused before and after this. Goes on
  the confirm-to-delete list, not deleted here.

## Order

0 → 1 → 2 → 3, then 5 for those. Step 4 waits until how the chat uses this has been
discussed. Each step is checked and committed on its own.
