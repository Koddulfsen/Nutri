# Nutri — product map

A snapshot of every page and feature: what exists, what's wired, what's missing, what needs
restyling. Unlike CLAUDE.md this **is** a status document and goes stale — update it as things land.

Written 2026-11-14 from reading the code (no browser, no database — Supabase was unreachable).
"Styling" notes come from how a page is built, not from looking at it; Jens is the judge of how it looks.

Legend: ✅ built and wired · 🟡 built but incomplete or not reachable · ❌ missing · 🧱 stub (looks real, does nothing)

---

## 1. Pages

| Route | Who | What it is | State | Styling |
|---|---|---|---|---|
| `/` | public | Home: hero search box (typing hands off to the chat on `/analysis`), stats strip, one tagline | ✅ | Own CSS (`.home-page`). Stats are hard-coded (280 compounds / 16,832 DV rows / 15 authorities) and out of date |
| `/login` `/signup` | public | Email+password and Google/Apple OAuth forms | ✅ | Own CSS |
| `/verify-email` | public | 6-digit code entry after sign-up, with resend timer | ✅ | Own CSS |
| `/forgot-password`, `/auth/reset-password` | public | Request and complete a password reset | ✅ | Own CSS |
| `/analysis` | signed-in | **The product.** Food list, macro ring, compound cards with limit bars, body profile, chat, symptom picker, date navigation | ✅ | `.an-page` cream/coral palette (intentional, locked) |
| `/dashboard` | signed-in | Trend charts: wellness (from symptom logs) and daily-value composite over a date range | 🟡 see §3 | Inline styles in the component |
| `/settings/account` | signed-in | Name/avatar form (works), plus Change Password / Enable MFA / Delete Account buttons | 🟡 | Tailwind utilities in an older cyan/magenta style — **needs restyle** |
| `/settings/privacy` | signed-in | Consent switches (AI logging, body weight, pregnancy/breastfeeding) with plain "if you turn this off" text and erase buttons; data download; typed-confirmation account deletion | 🟡 **built 2026-11-14, unverified against a live database** (Supabase paused) | House style (`privacy.css`). The old settings nav above it is still the old look |
| `/settings/security` | signed-in | Password, MFA, API keys | ❌ **linked from the settings nav, doesn't exist** | — |
| `/admin/*` (7 pages) | admin only | approvals, compounds, core-compounds, food-health, source-coverage, source-inspect, verify-mappings | ✅ internal tools | Tailwind, utilitarian — fine to leave |
| Privacy policy, Terms | public | — | ❌ (policy draft exists in `docs/PRIVACY-POLICY-DRAFT.md`) | — |
| Landing / marketing page | public | `/` is the only public page; no pricing, about, or signup pitch | ❌ | — |

Public pages are: `/`, login, signup, verify-email, forgot/reset password. Everything else needs sign-in
(enforced in `middleware.ts`; `/admin` also needs the admin email list).

## 2. Features

### Core loop (works)
- **Log food:** search the food list (ranked by best match), add with amounts, edit, delete, per-day. ✅
- **Suggestions:** up to 5 greyed "usual" foods/saved meals with **+**, learned from your own log. ✅
- **Saved meals:** save selected foods as a meal, "My meals" modal to add/rename/delete. Names encrypted. ✅
- **Chat logging:** type what you ate → proposed list → **Add foods**. Needs the `aiProcessing` consent (see §4). ✅ asks for the consent in place when needed (untested live)
- **Analysis:** compound cards, limit bars against resolved targets, macro ring (18 styles), energy and water targets, DV-source selector, what-if age/sex picker. ✅
- **Body profile:** weight and life stage persisted and encrypted; each needs its own consent. ✅ code, 🟡 blocked by the same missing consent screen
- **Add a food to the database** ("Add to NutriDB" button → smart-add modal: AI clarifies, searches sources, review, import). Admin-only; the button is now hidden for everyone else.

### Account and privacy
| Feature | Backend | UI |
|---|---|---|
| Sign-up / sign-in / OAuth / reset | ✅ | ✅ |
| Profile (name, avatar) | ✅ | ✅ |
| Consent (3 flags: AI logging, body weight, pregnancy/breastfeeding) | ✅ API on `withAuth`+Zod, all 3 enforced | ✅ inline prompt in the chat and body profile, plus `/settings/privacy` |
| Export my data | ✅ real JSON download | ✅ on `/settings/privacy` |
| Delete my account | ✅ real, immediate | ✅ on `/settings/privacy` (typed confirmation). 🧱 the button on `/settings/account` is still a fake `alert()` |
| Audit log viewer | ✅ API | 🟡 component written, no page |
| Change password | ✅ `updatePassword` action exists (used by reset flow) | 🧱 button is a fake `alert()` |
| MFA (TOTP) | ✅ `/api/auth/mfa/enable` + `/verify` | 🧱 button is a fake `alert()`; no setup/QR screen |
| API keys | ✅ `/api/auth/api-keys` | ❌ no UI at all |
| Privacy policy / ToS | draft only | ❌ |
| Age check (16+) | ✅ in demographics API | ❌ nothing at sign-up tells the user |

### Other
- **Guest mode:** removed. Nutri is signed-in only; `/analysis` redirects signed-out visitors to `/login`.
- **Wellness/symptom tracking:** see §3.
- **Payments:** no code. (The Stripe packages were removed as unused.) ❌
- **Newsletter / push / analytics / third-party sharing:** consent toggles exist for these; no feature does. Remove the toggles or build the features.
- **Waitlist:** `/api/waitlist` + table kept for a future landing page; nothing calls it.

## 3. A conflict to resolve first: symptom tracking

`docs/DATA-SCOPE-DECISIONS.md` says symptom tracking is **shelved and must stay inert** — no route writes, no consent entry, not in the DPIA.
The code says otherwise:
- `/analysis` has a live symptom picker (`SymptomDropdown`) that writes via `POST /api/symptoms` and `/api/symptom-definitions`.
- `/dashboard` is built around wellness trends from those logs.
- `symptom_logs.notes` is free text, stored as **plaintext**, with **no consent gate**.

That is Article 9 data being collected without the protections the project's own decisions require.
Options: (a) switch the UI and routes off to match the decision, or (b) decide it ships, then add a consent flag,
encrypt `notes`, and update the DPIA. This needs Jens's call before the settings work, since it changes which consent toggles exist.

## 4. Consent flow (built 2026-11-14)

New users start with every consent off. When the chat or the body profile is refused for want of a consent, the API
sends a structured 403 and the UI shows a short prompt in place (**Allow** / **Not now**), then retries what the user
was doing. `/settings/privacy` is where it is managed afterwards. Not yet exercised against a live database.

**Open: life stage.** The body-profile dropdown sends `PREGNANT_T1…T3` / `LACTATING_0_6M…`, but `PATCH /api/user/demographics`
only accepts `PREGNANT` / `LACTATING`, so choosing any pregnancy option is rejected with a 400 even with consent. Fixing it
means deciding how targets resolve by trimester (the service matches `life_stage` exactly). Belongs in the `/analysis` pass.

## 5. Sequence: one page at a time

**Method, per step:** (1) I read the page and list what works, what's missing and what looks off;
(2) Jens decides; (3) I build functionality and design together, in the house style (CLAUDE.md §10);
(4) I verify and say what I could and couldn't check; (5) tick it off here.

**Step 0 — Housekeeping.** Commit the consent/privacy work. Bring Supabase back (the paid plan);
until then nothing below can be checked against real data. First live test: new user → chat → Allow → message sends.

**Step 1 — The shell everything sits in.** Header/nav is different on every page (home, analysis, settings have
three arrangements; settings has no header at all). Decide one signed-in header and one signed-out header,
and the settings sub-navigation. Also the pages that don't exist yet and every site needs: 404, error and
loading states (none exist today).

**Step 2 — Legal pages.** Privacy policy and Terms as real pages (policy draft exists in `docs/PRIVACY-POLICY-DRAFT.md`;
needs a contact email and your/legal sign-off). Needed before sign-up can link to them.

**Step 3 — Sign-up and sign-in.** Sign-up: age statement (16+) and Terms/Privacy line. Then verify the whole
journey against a live database: sign up → email code → first login → what the user sees first.
Also the first-run experience (see §6). Design check of login, signup, verify-email, forgot/reset.

**Step 4 — Home `/`.** Real or removed stats (they're hard-coded and stale), a message that explains the product
to a stranger, a clear path to sign up. Decide what the page is for.

**Step 5 — `/analysis`, the product.** The biggest page; split into passes:
a. Life-stage bug (dropdown values vs API) and how trimester targets resolve
b. Empty and first-time states (a new user's blank screen)
c. Symptoms and the wider holistic-logging direction (Jens's call, deferred) — decides what this page and the dashboard hold
d. Design review section by section (food list, macro ring, compound cards, chat, body profile)
e. Splitting `AnalysisClient.tsx` (4,100 lines) — only after the design is settled, to avoid rework

**Step 6 — Settings.** `/settings/account` (remove fake buttons, restyle), `/settings/security` (build: change
password, MFA setup, API keys or hide them), `/settings/privacy` (verify live, final design pass), shared settings nav.

**Step 7 — `/dashboard`.** Depends on step 5c: it is built on symptom logs today. Decide keep, rework or park.

**Step 8 — Food coverage.** Only ~107 public foods; chat quality is limited by this, not by the chat.

**Step 9 — Admin.** Leave as is; trim only what's broken.

**Later:** payments, recipes/branded products, holistic logging, mobile polish if not folded in earlier.

## 6. Not yet looked at
- Mobile/responsive layout of every page.
- What a brand-new user sees after verifying their email (onboarding).
- The emails themselves (Supabase template `supabase-email-template-otp.html`, sender, wording).
- 404 / error / loading pages — none exist.
- Accessibility (keyboard, screen reader) beyond what the new Privacy page does.

## 7. Restyle summary
- Matches the design system: home, auth pages, `/analysis`, modals, dashboard (not visually checked).
- Needs restyle: `/settings/account` and the shared settings nav (older Tailwind cyan/magenta look with emoji and gradients, which the design rules forbid). `/settings/privacy` is already in the house style.
- Leave: `/admin`.
