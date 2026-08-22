# Nutri — Claude Code Instructions

> **Read §0 and §1 first, every session. They tell you where we are.**
> Everything below §4 is stable reference material — consult it when relevant, not up front.

---

## 0. THE MISSION, AND WHAT GUARDS IT

Nutri helps people understand how what they consume affects how they feel.

To do that it holds the most sensitive category of data there is: **symptom diaries,
pregnancy status, birth dates, and verbatim free text about people's bodies.** Under GDPR
that is Article 9 special-category data. We are the custodian of it.

So the mission has two halves, and the second is not optional:

1. Build a compound-centric food database and a tracking system that discovers patterns.
2. **Be worthy of the data required to do it.**

### What a parasite is

Everything that has gone wrong in this codebase has one shape: **an unverified claim that
got treated as a fact.**

- `db/schema/audit.ts` claimed 6-year HIPAA retention. No retention code exists.
- `db/schema/gdpr.ts` claimed foreign keys "added in migration SQL". They were never created.
- `lib/dal/consent.ts` claimed RLS enforcement. There are zero RLS policies.
- `lib/auth/totp.ts` claimed the MFA secret was encrypted at rest. It is plaintext.
- `app/api/user/delete-account/route.ts` tells users their data is deleted. Nothing deletes it.
- Four test files print `✅ passed` while asserting nothing.

Dead code, ungated routes, fake tests, and lying endpoints are all the same organism. Each
one is a claim nobody checked, load-bearing for someone's trust.

**A parasite is any assertion this project makes that is not verified.** The doors in §2
exist to keep them out. This project is built to repel them.

---

## 1. WHERE WE ARE

**Position: pre-alpha. Target: open alpha with paid accounts / crowdfunding.**

```
[███████████░░░░░░░░░░░░░░░░░░░░] Foundation ─── Hardening ─── Alpha
                     ▲ you are here
```

| Layer | State |
|---|---|
| Compound reference data | **Done.** 280 compounds, 1,807 mappings, 16,832 DV rows / 15 authorities |
| Food data | Code ready, **DB empty**. 557 MB raw on disk, importers verified working |
| Tracking / user data | Schema exists, zero rows |
| **Authentication** | **BROKEN — no working login. This blocks everything.** |
| Authorization | No RLS, 18 admin routes unguarded |
| Privacy compliance | Erasure and export are non-functional stubs |
| Tests | Harness non-functional |

**The single blocking dependency:** Supabase Auth is gone. Every security control below
assumes the system knows who someone is. It currently cannot.

```
Identity ──→ Authorization ──→ Data protection ──→ Rights & compliance ──→ Money
   ▲ broken; nothing downstream can be trusted until this is real
```

Full findings: **`docs/AUDIT-2026-08-11.md`**. Read it before security work.

---

## 2. THE DOORS

Named for the moment they fire, not the phase they belong to. When you are about to do the
thing, the door applies. **These are prohibitions, not aspirations.**

### 🚪 Before you trust a comment
A docstring is not evidence. Every claim in this codebase about encryption, retention, RLS,
or cascades has been false at least once. Verify against code or the database, then say
which you did. If you cannot verify it, it is CLAIMED — never VERIFIED.

### 🚪 Before you say something works
Name the check you ran. "Tests pass" is not a check when 12 of 14 test files are broken.
"Returns 200" is not a check when middleware is disabled in dev. State what you ran, what it
output, and what that does *not* cover.

### 🚪 Before you add an API route
Wrap it in `withAuth()` from `lib/auth/with-auth.ts` — or `withPublic()` with a written
reason. No per-handler judgement calls; that is how 18 admin routes ended up unguarded.
Then run `npm run check:auth`. Authenticate with `getUser()`, never `getSession()`
(the latter only decodes a cookie the client controls). Validate input with Zod. Never
authorize on `user_metadata` — the user can write it themselves.

### 🚪 Before you collect a new field
Ask what the code actually *reads*, not what seems useful. `birth_date` was stored for
years while `calculateAgeGroup()` only ever read year and month — a full DOB is a strong
quasi-identifier that, with `biological_sex` and `life_stage`, re-identifies most people
and discloses a pregnancy. Collect the coarsest value that satisfies the actual read.

### 🚪 Before you touch user data
Ask: is it Article 9? (symptoms, pregnancy/life stage, birth date, free text — yes.) If it
is, it needs encryption, a lawful basis, and a deletion path that actually runs. Never send
user free text to a third party without explicit consent and a DPA.

### 🚪 Before you promise the user something
If the endpoint says "your data will be deleted", code must delete it. A promise the system
cannot keep is worse than no feature — it is the most expensive parasite we have found.

### 🚪 Before you write a migration
Check `drizzle.__drizzle_migrations` against `drizzle/meta/_journal.json`. They have been out
of sync before (0 applied vs 44 recorded). A snapshot can also claim objects no SQL creates —
that happened at 0043. After migrating, diff live columns against the snapshot and expect zero
drift both directions.

### 🚪 Before you delete anything
Prove nothing imports it, and say how you proved it. If you cannot prove it, it goes on the
confirm list, not the delete list. Deletions are `git rm` — individually revertible, with
`npm run build` as the check after each.

### 🚪 Before you claim a source's data is right
Conversion factors are applied at **read time**, so a wrong factor yields a plausible number,
never a crash. 25 are currently wrong — see §6. Units are a trap: `µg` (U+00B5), `μg`
(U+03BC), `ug` and `UG` are the same unit and 221 "errors" are just that.

### 🚪 Before you start a session
Re-read §1. If it no longer matches reality, **fix §1 first** — a stale position marker sent
every session hunting for an `items`/`entries` system that was never built.

---

## 3. BUILD ORDER

Checkboxes are the timeline. Update them as work lands.

### Phase 1 — Contain (do first; cheap, no architecture needed)
- [x] **1.0** Take `delete-account` + `export` offline until real *(P1, P3)* — both return 501 with an honest message; original impls preserved in comments
- [ ] **1.1** Revoke `SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_ACCESS_TOKEN` *(owner action, A6)*
- [x] **1.2** Remove the `NODE_ENV === 'development'` early return in `middleware.ts` *(A1)*
- [x] **1.3** Make `DEV_AUTH_BYPASS` impossible in a production build *(A2)* — `NODE_ENV` term at all 3 call sites + build-time throw in `next.config.js`
- [x] **1.4** `requireAdmin()` on all 18 `/api/admin/**` handlers *(A3)* — 20 handlers; verified non-admin gets 403 JSON
- [x] **1.5** Server-side admin check in `app/admin/layout.tsx` *(A4)* — covers all 7 admin pages; verified non-admin redirects to /analysis
- [x] **1.6** Delete the `user_metadata.admin` checks *(B1)* — 3 occurrences across 2 files
- [x] **1.7** Strip every false compliance claim from comments *(§0)* — 16 across 11 files (HIPAA retention, phantom FKs, phantom RLS, phantom encryption, phantom DEK rotation)
- [x] **1.8** Settle the middleware `basePath` question *(B8)* — **RESOLVED: Next strips basePath; page protection works.** Also fixed `includes` → `startsWith` on public-API matching, and added `/api/admin` to `adminPaths`
- [x] **1.9** Triage npm vulns *(assessed)* — `xlsx` never reaches server runtime; used only by offline seed scripts on self-downloaded government files. Contained, not upgraded. Revisit if it ever parses user uploads

### Phase 1b — Found mid-flight (not planned; recorded so the count is honest)
- [x] Production build was **broken** (3 TS errors) — fixed; `npm run build:local` added
- [x] `middleware.ts` `includes` → `startsWith` on public-API matching (latent bypass)
- [x] Admin APIs return **403 JSON** instead of redirecting an API client to HTML
- [x] `requireUser()` added; `foods/pending` (moderation queue) admin-gated; 4 external-API
      proxies authenticated so anonymous callers cannot burn upstream rate limits
- [x] Upstash Redis disabled in `.env` — **12 files** used it; each call burned a 420ms
      timeout against a dead host
- [x] Demographics cache invalidation could **fail a successful write** (500 after the DB
      write landed) — now best-effort
- [x] `getUserDemographics` built a raw **service-role** Supabase client inline, bypassing
      the app wrapper — now Drizzle
- [x] Full date of birth removed → year+month (verified identical across 809 age cases)

### Phase 2 — Foundation
- [ ] **2.1** **DECIDE: auth replacement.** Self-hosted Supabase (restores `auth` + RLS +
      email, ~70 call sites unchanged, needs Docker) vs Postgres-native (fewer vendors, but
      every user-scoped query must be hand-audited with no RLS backstop)
- [ ] **2.2** Build it; restore authorization at the data layer
- [x] **2.2a** Least-privilege DB role — app runs as `nutri_app` (no DDL, no BYPASSRLS, not superuser); migrations use `MIGRATION_DATABASE_URL` (owner). Default privileges cover future migration tables. **Remaining:** run `ALTER ROLE nutri NOSUPERUSER;` as a superuser (see below)
- [x] **2.3** `withAuth(handler, { role, schema })` wrapper + CI check *(built)* — `lib/auth/with-auth.ts`, `withPublic()` for explicit public routes, lint at `scripts/check-route-auth.ts` (`npm run check:auth`). Report-only until the last 30 routes are migrated, then flip `STRICT=1` in CI
- [x] **2.4** `getSession()` → `getUser()` *(B2)* — 36 files rewritten; zero `getSession()` left outside `middleware.ts` (deferred to 2.2, since `getUser()` adds a network call per request)
- [ ] **2.5** Apply the DEK to Article 9 columns; move the key out from under the data *(P4, P5)*
- [x] **2.6** Fail-open trio *(A7, A8)* — Postgres rate limiter (`lib/rate-limit/`), fails **closed** on auth; MFA verify now 401 + 5/15min lockout. Session-version (A10) still open, belongs with 2.2
- [x] **2.7** `anonymizeIP` fixed (IPv6 expansion, IPv4-mapped, 10 cases pass) and wired into **all three** audit write paths. `parseUserAgent` still open
- [ ] **2.8** Real erasure + export jobs; add the 5 missing FKs *(P1, P2, P3)*
- [ ] **2.9** Per-user spend budget on `/api/ai/log-food` *(B3)*

### Phase 3 — Refurbish (serves Phase 2; not cosmetics)
- [ ] **3.1** Delete the dead Supabase-HTTP cluster — 5,555 lines *(S1)*
- [ ] **3.2** Move `components/calendar/` → `app/components/`, delete prototype UI *(S2)*
- [ ] **3.3** Delete `lib/data/compounds.ts` — 26,508 stale lines *(S3)*
- [ ] **3.4** **DECIDE:** ship the BullMQ worker or return 501 — imports currently vanish *(S4)*
- [ ] **3.5** Archive ~310 one-off scripts to `scripts/archive/` *(S10)*
- [ ] **3.6** Delete Circadian + Sandalwood docs; fix the `--bg` drift *(S9)*
- [ ] **3.7** Rewrite `DATABASE_SETUP.md` — it predates the local-Postgres move
- [ ] **3.8** Split `AnalysisClient.tsx` — free extraction first *(S8)*
- [ ] Structure verdict: **cleanup in place. Do NOT start a new folder** *(S7)*

### Phase 4 — Verify
- [ ] **4.1** Port Jest→Vitest; delete the 4 fake test files
- [ ] **4.2** Test the security layer first — authorization, ownership, encryption round-trip,
      deletion cascade. These are where silent failure means breach
- [x] **4.3** Conversion factors *(done 2026-08-22)* — 23 rows fixed (17 FRIDA + 6 DUKE) via
      `scripts/fix-conversion-factors.ts` (idempotent, `--dry-run`); checker normalization
      extracted to `lib/food-health/units.ts`. 4 judgment calls left, listed in §6

### Phase 5 — Alpha
- [ ] **5.1** DPIA — **mandatory before processing begins**, not after *(P7)*
- [ ] **5.2** Privacy policy, ToS, consent UI; Anthropic DPA *(P6, P7)*
- [ ] **5.3** Stop sending user free text to the 17 external food APIs — send tokens only *(P6)*
- [ ] **5.4** Payments (Stripe keys exist; integration unverified)
- [ ] **5.5** Load food data — **Duke and FooDB last** (the two parent/child sources)
- [ ] **5.6** Restyle landing + `/analysis` — low-poly banana in `bilder/`. Note: the assets
      are light pink; the live system is charcoal + teal. Decide deliberately
- [ ] **5.7** Instant-feedback layer — perceived latency between action and response
      - [ ] **5.7a** Client data cache. **This is where the latency actually is**: 59 raw
            `fetch()` calls across 19 files, no cache layer, so every date/tab switch
            refetches from scratch. Route prefetch is already handled by `<Link>`.
      - [ ] **5.7b** `router.prefetch()` for the 3 `useRouter` files (imperative pushes are
            not prefetched); convert the 1 raw `<a href="/">` to `<Link>`
      - [ ] **5.7c** Web Audio sound layer — shared `AudioContext`, `decodeAudioData` at
            load, `AudioBufferSourceNode.start()` per trigger, resumed on first gesture.
            **Do after 3.8** so triggers land inside the extracted hooks rather than being
            bolted into a 2,406-line component and moved later
      - [ ] **5.7d** Sound must be opt-out and default-quiet — a "meal logged" chime in
            public discloses that someone is tracking health data. Ties to the anonymity
            work, not just preference

---

## 4. TRUST LEDGER

What is actually true, as of 2026-08-11. **Add to this rather than trusting comments.**

| Claim | Status |
|---|---|
| Schema matches DB | ✅ VERIFIED — 749/749 columns, zero drift |
| `db:migrate` idempotent | ✅ VERIFIED — runs clean twice |
| Food importers work | ✅ VERIFIED — aseanfoods loaded 517 foods / 8,510 rows |
| Compound + DV data intact | ✅ VERIFIED — 280 / 1,807 / 16,832 |
| Conversion factors applied at read time | ✅ VERIFIED — fixable retroactively |
| Known-wrong conversion factors | ✅ FIXED 2026-08-22 — 23 rows (17 FRIDA + 6 DUKE); re-queried DB, second run is a no-op. 4 judgment calls remain (§6) |
| Conversion checker false positives | ✅ FIXED — was 246 flags / ~25 real; unit normalization in `lib/food-health/units.ts`. Now 4 real + 314 missing-unit |
| Chatbot pipeline | ✅ VERIFIED to Anthropic — blocked only on account credits |
| Encryption applied to health data | ❌ FALSE — `encryptPHI` has zero callers |
| User deletion works | ❌ FALSE — nothing consumes `deletion_requests` |
| Data export works | ❌ FALSE — all TODO comments |
| RLS protects user data | ❌ FALSE — zero policies exist |
| Rate limiting protects login | ✅ VERIFIED — Postgres-backed, fails closed; 5/20 parallel hits allowed (atomic) |
| Full IPs stored in audit log | ✅ FIXED — truncated at all 3 write boundaries (pseudonymised, still personal data) |
| Full date of birth stored | ✅ REMOVED — year+month only; API rejects a day. Age bands identical across 809 cases |
| Upstash Redis | ✅ DISABLED in .env — 12 files used it; each call burned a 420ms timeout against a dead host |
| getUserDemographics privilege | ✅ FIXED — was building a raw service-role Supabase client inline; now Drizzle |
| Import queue processes jobs | ❌ FALSE — nothing consumes the queue |
| ~~Middleware protects pages in dev~~ | ✅ FIXED 2026-08-11 — see rows below |
| Tests pass | ❌ FALSE — 13/14 files fail; 4 assert nothing |
| Routes authorize with getUser() | ✅ VERIFIED — 36 files swept; 0 getSession outside middleware |
| Route auth is enforceable | ✅ `npm run check:auth` — 30 routes still to migrate, all reference-data reads |
| Admin APIs require admin | ✅ VERIFIED — non-admin gets 403 JSON on all 18 |
| Admin pages require admin | ✅ VERIFIED — non-admin redirected to /analysis |
| Erasure/export endpoints | ✅ HONEST — now 501; they no longer claim to work |
| Middleware `basePath` matching | ✅ VERIFIED — Next strips it; page protection works in prod |
| Production build | ✅ VERIFIED passing — was broken (3 TS errors); fixed 2026-08-11 |
| Middleware runs in dev | ✅ VERIFIED — short-circuit removed; headers now present in dev |
| App runs as DB superuser | ✅ FIXED — runtime is `nutri_app`; DDL blocked, verified by attempting CREATE/ALTER/DROP |
| Migration role still superuser | ⚠️ `nutri` retains SUPERUSER — only used for manual migrations. Run `ALTER ROLE nutri NOSUPERUSER;` as postgres |

---

## 5. DOMAIN MODEL

| Group | Tables | Status |
|---|---|---|
| Compounds | `compounds`, `compound_groups`, `compound_sources`, `reference_daily_values` | ✅ Built + populated |
| Foods | `foods`, `food_sources`, `merged_nutrients`, `food_components` | ✅ Built, ⬜ empty |
| Tracking | `meal_logs`, `meal_items`, `symptom_logs`, `symptom_definitions` | ✅ Built, ⬜ empty |
| Users | `user_profiles`, `user_consent`, `api_keys` | ✅ Built |

**Note:** the universal `Item`/`Entry` tracking model is a **north star, not current work** —
see §9. Earlier versions of this file listed it as "NOW", which sent many sessions looking
for tables that do not exist.

### Compound expansion
```
Entry: { item: "Lunch", value: "pizza" }
        ↓
Derived: { item: "Tyramine", value: 45mg }   { item: "Sodium", value: 890mg }
```

### Parent/child sources
Only **Duke** and **FooDB** use parent/child food structures. The other 16 are flat.
(Frida — the Danish source — is flat, despite occasional memory to the contrary.)

---

## 6. KNOWN DATA ISSUES

**Fixed 2026-08-22.** The checker used to report 246 flags because it compared units as raw
text — `µg` (U+00B5) / `μg` (U+03BC) / `ug` / `UG`, a `/100g` basis suffix, and equivalence
qualifiers (`DFE`, `NE`, `RAE`) all read as mismatches. Normalization now lives in
`lib/food-health/units.ts` (`parseUnit` → `{ magnitude, qualifier }`), so a wrong **factor**
is distinguishable from a wrong **label**.

Applied by `scripts/fix-conversion-factors.ts` (idempotent; supports `--dry-run`):

| Group | Rows | Fix | Was |
|---|---|---|---|
| FRIDA amino acids `mg/100g`→`g` | 14 | ×0.001 | 1000× too high |
| FRIDA Boron, Fluoride `µg/100g`→`mg` | 2 | ×0.001 | 1000× too high |
| FRIDA Salt `g/100g`→`mg` | 1 | ×1000 | 1000× too low |
| DUKE `ppm`→`g` / `mg` | 6 | ×0.0001 / ×0.1 | left at 1.0 |

DUKE basis confirmed from DUKE's own data: 78 rows already at `0.0001` (g) and 44 at `0.1`
(mg). 1 ppm = 1 mg/kg = 0.1 mg/100g = 0.0001 g/100g.

**Still open — 4 judgment calls (owner):**
- FRIDA `Niacin Equivalents` `NE` → `mg`
- FRIDA `Vitamin E (Total)` `alfa-TE` → `mg`
- MATVARETABELLEN `Vitamin E (Total)` `mg-ATE` → `mg`
- MEXT `Ethanol` `'……g……'` → `g` (placeholder unit; needs a source look-up)

**Separately: 314 of 1,807 mappings have no `source_unit` at all.** Not a maths error, so the
checker counts it as `missingUnits` rather than a flag — but it means those rows are trusted
blind. Worth a pass before food data loads.

---

## 7. PATTERNS

### Database access
```typescript
import { db } from '@/db';                          // Drizzle — works against local Postgres
import { createClient } from '@/lib/supabase/server'; // Supabase-shaped; dev shim in dev
```
**There is no RLS.** Every user-scoped query must filter by `userId` in application code.
The DAL comments claiming RLS are false.

### Local environment
- Postgres 16, **port 5434**
- **Two connections, on purpose:** `DATABASE_URL` is the least-privilege runtime role
  (`nutri_app` — DML only, cannot CREATE/ALTER/DROP). `MIGRATION_DATABASE_URL` is the
  owner and is used *only* by `drizzle.config.ts`. Never point the app at the owner.
- Dev server **always port 3003**: `npx next dev -p 3003`
- App is served under basePath **`/nutri`** — `http://localhost:3003/nutri/...`
- `DEV_AUTH_BYPASS=true` makes every request one fixed admin. **Local only, never deployed.**

### Code style
TypeScript strict; Zod on every route; server components preferred; aliases `@/db`, `@/lib`,
`@/app/components`.

### Commands
```bash
npx next dev -p 3003     # dev server
npm run db:generate      # generate migration
npm run db:migrate       # apply migrations
npm run db:studio        # Drizzle Studio
npx vitest run           # tests (currently broken — see 4.1)
```

---

## 8. STABLE REFERENCE

These sections were verified as still accurate and are unchanged in substance.

### Compound seeding
Work in batches of 5. Per compound: create `scripts/seed/0X-name.ts` → run it → verify against
the doc table. Track in `docs/compound-mappings/SEEDING-PROGRESS.md`.
Watch for silent `ON CONFLICT DO NOTHING` skips — an X/Y discrepancy in "mappings inserted"
means an earlier compound claimed a wrong external ID.

### Daily Value sourcing
~15 authorities aggregated into personalized targets. **Every source needs age + sex minimum.**
- `dv-sources/GUIDE.md` — step-by-step
- `dv-sources/INDEX.md` — coverage tracker
- Always run `scripts/check-source-compound-names.ts` **before** writing seed code
- Always test idempotence — second run must show `Inserted: 0`
- Store native age ranges in months; never force into enum buckets
- All 9 columns in the `ON CONFLICT` clause

### Design system — Charcoal × Cyan/Magenta
**Source of truth: `app/globals.css`.** Circadian and Sandalwood are retired — delete on sight.

| Token | Value | Role |
|---|---|---|
| `--bg` | `#000000` | page background *(§13 of the old file said `#0a0a0c` — globals.css wins)* |
| `--bg-soft` | `#101014` | elevated surfaces |
| `--surface` | `#0e0e12` | inset inputs |
| `--border` | `#1e1e24` | default borders |
| `--text-1` | `#e8e8f4` | primary text |
| `--text-2` | `#8080a0` | secondary |
| `--text-3` | `#484860` | muted |
| `--accent` | `#508898` | muted teal — interactive |
| `--accent-dark` | `#306070` | 3D press depth |
| `--accent-text` | `#906070` | dusty rose — data highlight |

Fonts: Instrument Serif (display), DM Sans (body), DM Mono (data).
Buttons: square press, `border-radius: 3px`, `0 5px 0 var(--accent-dark)`.
Inputs: inset. Rows: banded. Header: transparent.
Rules: font weight ≤ 500; max content width 720px; no gradients, no glassmorphism, no
decorative emoji; square corners.

---

## 9. NORTH STAR (not current work)

The long-term model — deliberately deferred until the alpha ships:

```
Item:    { id, name }
Entry:   { item_id, value, timestamp }
Pattern: { discovered }
```

Data is dumb; discovery is smart; nothing hardcoded (no fixed lag windows, threshold bins, or
significance cutoffs); domain-agnostic. Then community and store.

**Do not start building this.** It is here so the direction is legible, not so it gets worked
on. See §1 for what is actually current.

---

## 10. REFERENCE INDEX

| Doc | Purpose |
|---|---|
| `docs/AUDIT-2026-08-11.md` | **Full security/privacy findings. Read before security work** |
| `docs/NUTRI_OVERVIEW.md` | Platform vision |
| `docs/DATA_SOURCES.md` | The 18 food sources |
| `docs/architecture/core-compounds-hierarchy.md` | ~213 Core compounds |
| `dv-sources/GUIDE.md` / `INDEX.md` | DV sourcing + coverage |
| `db/seed/SOURCING.md` | 5-gate pipeline |
