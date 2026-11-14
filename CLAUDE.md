# Nutri — guide for Claude Code sessions

This file holds things that stay true: what the project is, how it is built, the rules
for working in it, and decisions already made. **Status, plans and history do not live
here** — they go stale. Status lives in `docs/`; history lives in `git log`.
If something below disagrees with the code, the code wins — fix this file in the same change.

---

## 1. What Nutri is

Nutri helps people understand how what they consume affects how they feel.

You log food. Nutri breaks each food into **compounds** (vitamins, minerals, amino acids,
contaminants, caffeine…) using a database merged from many national food-composition
tables, then compares the day against **daily-value targets** published by health
authorities. The longer-term goal is finding patterns between intake and how people feel.

To do that it holds the most sensitive kind of data there is: **health data under GDPR
Article 9** — pregnancy/lactation status, body weight, birth year/month, and free text
about people's bodies. The project has two jobs: build the thing, and be worthy of that data.

## 2. Vocabulary

| Term | Meaning |
|---|---|
| **Compound** | One nutrient/substance Nutri tracks (`compounds` table), grouped in `compound_groups` |
| **Authority / body** | A health organization that publishes daily values (EFSA, NIH, WHO/FAO, national bodies) |
| **Daily value (DV) / target** | What an authority says a person of a given age/sex/life-stage needs (or must not exceed) |
| **Source** | A food-composition database (USDA FDC, Canada's CNF, CIQUAL, BLS, …). 2 are live APIs (FDC, CNF); the rest are loaded locally |
| **Staging tables** | `source_<name>_*` — raw rows from one source, untouched |
| **Mapping** | A row in `compound_sources` saying "source X's nutrient #N is our compound Y, ×factor" |
| **Merged nutrients** | `merged_nutrients` — one value per food × compound, combined across sources |
| **Article 9** | GDPR's special category (health data). Needs encryption, explicit consent, and a working deletion path |

## 3. Where things live

```
app/                 Next.js app — pages, API routes (app/api), UI (app/components)
  analysis/          The main screen: food list, macro ring, compound cards, chat
  admin/             Admin-only tools (gated by app/admin/layout.tsx)
  settings/          Account settings
  (auth)/actions.ts  Sign-in / sign-up / OAuth / reset server actions
lib/
  dv/                Daily-value resolution (resolve.ts is the one place targets become numbers)
  services/          Source clients, meal/DV/symptom services, nutrient mapper
  ai/                The food-logging chat (food-log-chat.ts, prompts.ts, anthropic-client.ts)
  auth/              withAuth/withPublic wrappers, permissions, MFA, password
  security/          Encryption, per-user keys, audit logging
  consent/           The consents Nutri asks for + their wording (one source for API, prompts, settings)
  dal/               Data-access layer for profiles, consent, audit, api keys
  food-health/       Merge logic and unit normalization
  rate-limit/        Postgres-backed rate limiter
  supabase/          Client wrappers + dev-auth shim
db/schema/           Drizzle schema (one file per concern; one per source's staging tables)
db/seed/             Seeders and per-source loaders (db/seed/<source>/import-<source>.mjs)
drizzle/             Generated migrations + journal
dv-sources/          Daily-value source documents, extraction scripts, values, provenance
scripts/             Live maintenance scripts; scripts/archive/ = finished one-offs
data/                Raw source files (large, gitignored)
docs/                Reference docs (see §12)
```

## 4. Running it

- Dev server: `npx next dev -p 3003`, served at the root (`http://localhost:3003/`, no basePath).
- Database: Supabase Postgres (eu-west-1, EU region because of Article 9 data).
  Two URLs on purpose: `DATABASE_URL` → transaction pooler :6543 (the app);
  `MIGRATION_DATABASE_URL` → session mode :5432 (drizzle-kit, bulk loads, psql, dumps).
- Commands: `npm run db:generate` · `db:migrate` · `npx vitest run` · `npm run check:auth` ·
  `npm run check:printed` · `npm run typecheck:scripts` · `npm run build:local`.
  Many tests are integration tests and need the database reachable.
- `DEV_AUTH_BYPASS=true` makes every request one fixed admin. Local only; the build refuses
  to run with it on. `lib/supabase/dev-shim.ts` reimplements only part of the Supabase client
  (e.g. no `.or()`), so with the bypass on, features can silently return nothing — turn the
  bypass off to test anything that depends on the missing methods.
- Admin = the `ADMIN_EMAILS` env list, never a database column.

## 5. Working rules

Each rule exists because the opposite happened here once. In short: **never let an
unchecked claim stand as fact** — in a comment, a commit, a message to the user, or an
endpoint's response.

1. **Comments are not evidence.** Claims about encryption, retention, RLS, cascades or
   "this is secure" have been false before. Verify in code or the database and say which you did.
2. **"It works" needs a named check.** State what you ran, what it printed, and what that
   does *not* cover. "Tests pass" and "returns 200" are not checks on their own.
3. **New API route:** wrap it in `withAuth()` (or `withPublic()` with a written reason) from
   `lib/auth/with-auth.ts`, validate input with Zod, run `npm run check:auth`. Authenticate with
   `getUser()`, never `getSession()` (that only decodes a cookie the client controls). Never
   authorize on `user_metadata` — the user can write it.
4. **New data field:** ask what the code actually *reads* and collect the coarsest value that
   satisfies it. Read `docs/DATA-SCOPE-DECISIONS.md` first — it records what was deliberately
   kept or dropped. A consent flag should exist only if something real is gated by it.
5. **Touching user data:** if it is Article 9, it needs encryption, a lawful basis and a deletion
   path that really runs. Never send a user's free text to a third party without explicit
   consent and a DPA.
6. **Never promise what the code can't do.** If a screen or endpoint says "your data will be
   deleted", code must delete it. No placeholder buttons that pretend to work.
7. **Migrations:** compare `drizzle.__drizzle_migrations` with `drizzle/meta/_journal.json`
   first (they have drifted before). After migrating, diff live columns against the schema —
   expect zero drift both ways.
8. **Deleting code:** prove nothing uses it — search app, lib, scripts, tests, configs, and
   string-built paths — and say how you proved it. Use `git rm`, run a build after. If there is
   any doubt, ask; remove only what is certain.
9. **Source data:** conversion factors are applied at *read* time, so a wrong factor produces a
   believable wrong number, not an error. Units are a trap: `µg` (U+00B5), `μg` (U+03BC), `ug`,
   `UG` are one unit. Never default a missing unit to `g`.
10. **Never open a browser** to look at the app — Jens checks visuals himself. Verify by what
    the server actually serves (e.g. curl the CSS bundle). A source edit is not a shipped change:
    Turbopack has served stale CSS after a correct edit (fix: stop the server, `rm -rf .next`,
    restart). When "it didn't work", suspect the pipeline before re-editing.
11. **Before starting work,** skim this file and check it against reality. If it's wrong, fix it first.

## 6. Security and privacy model

- **Identity:** Supabase Auth (sign-in, sign-up, OAuth, reset in `app/(auth)/actions.ts`).
- **Authorization:** every API route goes through `withAuth`/`withPublic`; `check:auth` enforces
  it. Admin APIs return 403 JSON, admin pages redirect.
- **Database role:** the app connects as the table owner, so Postgres RLS does **not** cover the
  app's own queries (RLS policies exist for the public Supabase API only). Every user-scoped
  query must therefore filter by the server-derived authenticated `userId` in code. Assume this
  unless you have just verified otherwise.
- **Encryption at rest:** AES-256-GCM with a per-user key stored in a separate table
  (`user_encryption_keys`), so reading a profile never returns its own key. Applies to
  `life_stage`, body weight and saved-meal names. Key rotation is not implemented and throws.
  `biological_sex` and birth year/month are not encrypted (quasi-identifiers; see DATA-SCOPE doc).
- **Consent:** `user_consent` has one row per user, created with every flag false. Gate a behaviour
  with `checkConsent()`. Article 9 flags are never bundled into "accept all".
- **Audit logging:** IPs are truncated before they are stored.
- **Rate limiting:** Postgres-backed in `lib/rate-limit/`; fails closed. The AI chat is capped per user per hour.
- **Erasure and export:** real, synchronous. Deletion removes the profile (cascading to meals,
  etc.), consent, keys and the auth user. Tables without a foreign key to the profile are deleted explicitly.
- **Dev bypass** cannot ship: `next.config.js` throws on a production build with it enabled.

## 7. Data model and pipeline

**Reference data:** `compounds` → `compound_groups`; `compound_sources` (mappings);
`reference_daily_values` (targets, with age/sex/life-stage, stored in the authority's own native
age ranges in months). Source documents and extraction live in `dv-sources/`; `PROVENANCE.md`
records which authorities derived their own values versus copied another's.

**How targets are resolved** (`lib/dv/resolve.ts` — the single place):
- One vote per independent authority, then the **median**.
- Units are converted, not matched as text.
- Per-kg-of-body-weight values resolve against the user's own weight if given, else that
  authority's own published reference weight.
- Energy: pick the activity level first, then one value per body, then the median.
- Contaminant ceilings (TWI/TDI/PTMI/RfD) use the **strictest** body, not the median — a nutrient
  target estimates a need, a ceiling estimates where harm begins. Supplement-only and
  form-specific limits are kept out of food limits.
- Compounds the authorities publish only as a pair (e.g. aromatic amino acids) show the pair, not invented halves.

**Food data:** 17 source databases are staged in `source_*` tables by loaders in
`db/seed/<source>/`. Each loader truncates its own tables, so re-running is safe; bulk loads go
through the session port. Importing a food (`POST /api/foods`) queries the sources, maps
nutrients (`lib/services/nutrient-mapper.ts`), and merges them (`lib/food-health/merge.ts`).
- Merge normalizes units first and holds out values more than 100× from their peers.
- Import aborts before writing if any requested source fails; outbound calls use `withRetry`.
- Sources do not have parent/child food rows. DUKE (plant × part) and FOODB are held back; PHENOL has no mappings.
- Source quirks: KFCT/MEXT need `scripts/populate-*-english-names.mjs` after import; Fineli CSVs are ISO-8859-1.

**Tracking:** `meal_logs` / `meal_items` (amounts stored in grams, with the user's own portion
wording as a label), `saved_meal_templates`. "Usuals" and suggestions are learned from the user's
own log (`lib/services/usuals.ts`), nothing extra stored. Symptom tables exist but are shelved
and must stay inert (see decisions).

**Chat logging:** `app/analysis/FoodLogChat.tsx` → `/api/ai/log-food` → `lib/ai/food-log-chat.ts`.
The model can only *search and propose*; it has no write tool. The user presses "Add foods" and
exactly the shown list is saved through `POST /api/meals/sync`. Auth, consent and rate limiting live in
the route. `scripts/chat-eval/` replays sample messages against the same code. Recipes are built
but switched off (`RECIPES_ENABLED` in `FoodLogChat.tsx`).

## 8. Known sharp edges

- Staging-table names and enum values differ in places (`source_cofid_*` vs `UK_COFID`).
- Some source mappings have no `source_unit`; the audit scripts (`audit-source-units`,
  `audit-magnitudes`, `audit-mapping-ids`) cover them from independent angles, because each alone has blind spots.
- CNF mappings can't be checked against a catalogue (none is loaded).
- Seeding: work in batches of 5, run `scripts/check-source-compound-names.ts` first, make seeds
  idempotent (second run inserts 0), and watch for `ON CONFLICT DO NOTHING` silently skipping a
  wrongly-claimed external ID (an X/Y mismatch in "mappings inserted").

## 9. Decisions already made (don't reopen without asking Jens)

- Alpha minimum age 16; GDPR/Norway only. Details in `docs/DATA-SCOPE-DECISIONS.md`.
- Retention: kept while the account is active; deletion is immediate and complete, no grace period.
- Symptom/wellness tracking is shelved — no writes, no consent entry — until it gets its own consent flow and DPIA update.
- `life_stage` (pregnancy/lactation) is kept despite the compliance cost; it needs its own consent and encryption.
- Body weight: optional, one current value in whole kg, no history, own consent, encrypted.
- Recipes and branded/barcode products come after alpha.
- Lead and inorganic arsenic show "No DV" because the committees withdrew their limits.
- Universal "Item/Entry/Pattern" tracking model is a long-term direction only — don't start building it.
- Only Jens signs off on consent wording, the DPIA and the privacy policy.

## 10. Design

**Every new page and component is built in this style from the start** — don't write a page in
default Tailwind and plan to restyle it later. Source of truth for tokens: `app/globals.css`
(`:root`). Use the tokens (`var(--bg)`, `var(--accent)`…), never hard-coded hex. Prefer a
page-scoped stylesheet or styled-jsx with a unique class prefix over adding to `globals.css`
(it holds older rules that collide, e.g. two different `.success-message`).

**Charcoal × teal (the default)**

| Token | Role |
|---|---|
| `--bg` `#000` / `--bg-soft` `#080808` / `--surface` `#050505` | page / raised panel / inset input |
| `--border` `#1e1e24` / `--border-soft` / `--divider` | lines |
| `--text-1` `#e8e8f4` / `--text-2` / `--text-3` | primary / secondary / muted text |
| `--accent` `#508898` / `--accent-dark` `#306070` / `--accent-soft` / `--accent-border` | interactive, press depth, tints |
| `--accent-text` `#906070` | dusty rose, for highlighting data |
| `--warn` `#f97316` / `--warn-soft` / `--warn-text` / `--warn-border` | errors and destructive actions |
| `--space-xs…2xl` (4/8/16/24/36/48) | spacing scale |

Fonts: Instrument Serif (`--font-display`) for headings, DM Sans (`--font-body`), DM Mono (`--font-mono`) for numbers.

**Rules:** font weight ≤ 500 · max content width 720px · square corners (`border-radius: 3px`) ·
no gradients, no glassmorphism, no decorative emoji or icons-as-decoration · header transparent.
**Buttons** press down: `box-shadow: 0 5px 0 var(--accent-dark)`, `translateY(4px)` on `:active`.
**Inputs** are inset (`var(--surface)` + `inset 0 2px 4px rgba(0,0,0,.5)`). **Lists** are banded
(alternate rows `var(--bg-soft)`). Copy is plain language, no jargon, no exclamation marks.

**`/analysis` is the one exception:** a cream/coral "Petal White" palette scoped under `.an-page` in
`AnalysisClient.tsx` — `--panel #fff7f4`, `--coral #d42a55` for data (bars, rings, selected date),
`--action #2e1a0e` (espresso) for anything pressed, ink `#2e1a0e`. Shared components that appear on
both (e.g. `ConsentPrompt`) borrow colours with fallbacks (`var(--action, var(--accent))`) rather than
assuming a theme.

**Cards and rings** (stat/goal/progress visuals): white `#fff` card, `border-radius` 10–16px,
`box-shadow: 0 6px 22px rgba(46,26,14,.12)` for inner tiles and `0 10px 34px rgba(46,26,14,.13)`
for outer containers (one shadow language, reused, never invented per component). Split panels use a
2px hairline `rgba(46,26,14,.16)`; stack to one column under 860px.
`MacroViz` has 18 switchable styles (12 ring treatments `A`–`L`, 6 shapes `M`–`R`); default is `O`
(one ring, split by share of calories); the choice is stored per-browser in `localStorage`
(`nutri.macroVizStyle`). Ring colours come only from `RING_COLORS` (`--ring-1/2/3`) — never a hex
per slice, or the re-tone knob breaks. Gallery of all 18: `docs/design/macro-viz-styles.html` — add
a new style there as well as in code.

Don't invent one-off widgets without checking this section, and don't revive retired design
systems (Circadian, Sandalwood).

## 11. Working with Jens

- Plain language over jargon; explain what code actually does.
- Commit only when asked. The git index is shared with other sessions, so commit with explicit
  pathspecs (`git commit -- <paths>`), never include Jens's uncommitted edits, and push to
  `origin/main` after committing.
- Confirm before anything hard to reverse or outward-facing.
- Report outcomes honestly: failing tests, skipped steps and unverified claims are stated, not smoothed over.

## 12. Reference docs

| Doc | Use |
|---|---|
| `docs/DATA-SCOPE-DECISIONS.md` | Deliberate data-minimization/retention/age calls — read before touching fields or consent |
| `docs/AUDIT-2026-08-11.md` | Original security audit — background for why the rules above exist |
| `docs/DPIA-2026-09-23.md`, `docs/PRIVACY-POLICY-DRAFT.md` | Privacy paperwork (drafts) |
| `docs/NUTRI_OVERVIEW.md`, `docs/DATA_SOURCES.md` | Vision; the food sources |
| `docs/PLAN-CHAT-PIPELINE.md`, `docs/PLAN-SAVED-MEALS.md` | Design of the chat and saved-meals features |
| `docs/architecture/` | Compound hierarchy and tiering |
| `dv-sources/GUIDE.md`, `INDEX.md`, `PROVENANCE.md`, `DV-ACCURACY-TASKS.md` | Daily-value sourcing, coverage, provenance, run state |
| `db/seed/SOURCING.md` | The 5-gate source-loading pipeline |
| `DATABASE_SETUP.md`, `docs/DEPLOY.md` | Environment and deployment |
