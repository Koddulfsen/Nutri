# DV accuracy — open tasks

Run-state for the work between "the source data is clean" and "the number on the bar is right".
Companion to `PROVENANCE.md` (which body derived what) and `VALUE-TYPES.md` (what each value means).
**Tick a box only when the check that proves it is named beside it.**

Found 2026-09-24 by sweeping `lib/dv/resolve.ts` across all 64 compounds that hold values at one
demographic (adult male, 30 y) and reading its own `excluded` list — the resolver records every row it
drops, so the defects below are its own report, not a guess.

---

## A. Defects — wrong on screen today

- [x] **A1. Percent-of-energy values are treated as amounts.** *(fixed 2026-09-24)* — energy shares are
      now kept out of the amount pools and returned under `ResolvedBar.energyShare`, in percent, until a
      caller knows the user's energy intake. Linoleic acid now resolves to **14.25 g** (Korea + USA) with
      the 4 % and 2.5 % held separately; ALA likewise. The guard reads the stored `isPercentOfEnergy`
      flag *and* the unit, because an unflagged `%` is the same trap. 4 tests; the all-compound sweep
      reports zero unit drops outside vitamin E.
      *Was:* `DvRow.isPercentOfEnergy` is loaded by
      the service and never read by the resolver; the per-energy guard only matches a `/` in the unit
      (`mg/MJ`), so a plain `%` enters the goal pool and can win the unit vote.
      Linoleic acid resolves to **`3.25 %`** from China + DACH, having dropped Korea's 11.5 g and the
      USA's 17 g as "cannot be expressed in %". Same for ALA.
      *Check: `resolveBar` on those rows returns a gram goal from 2 bodies and lists the %E rows as
      excluded with a reason; a test covers it.*

- [x] **A2. Vitamin E splits on a qualifier that is probably cosmetic.** *(fixed 2026-09-24 — and it was
      not only the ruling.)* `parseUnit('mg α-TE')` returned magnitude **`mg α`**: the Greek α is not a
      qualifier token, so the peeling stopped early and the magnitude was an unknown scale. Every one of
      the 411 rows spelled that way converted to nothing and was dropped from every aggregate, in both
      directions. `lib/food-health/units.ts` now folds α→alpha and β→beta before splitting, and
      canonicalises `α-TE` / `alfa-TE` / `ATE` / `AT` to one token so three sources that agree are not
      treated as three different quantities. RE and RAE are deliberately NOT folded — they count
      β-carotene at 1/6 and 1/12. Food-side data was unaffected (0 `compound_sources.source_unit` rows
      contain α; checked).
      *Was:* Six alpha bodies publish it,
      three as `mg` and three as `mg α-TE`; `toUnit` refuses to cross a qualifier boundary, so three are
      dropped whichever spelling wins the majority. See B1 — this is not fixable by a blanket rule,
      because bare `mg` vs `mg NE` for niacin IS a different quantity.

- [x] **A3. Nine rows carry no direction** *(resolved 2026-09-24)* — read in their extracts: all nine are
      deliberate, verified point targets, not defects. Russia prints protein and carbohydrate as the
      optimal share of energy per physical-activity group (§1.7, *"доля белка в калорийности составляет
      14%"*), DGE prints total fat as a 30 % Richtwert. They are now counted as energy-share goals rather
      than dropped. Transcription is still guarded upstream: `check-source-consistency.ts` fails a
      direction-less row that is not on its verified allowlist — re-run clean for both (RUSSIA 1166
      values / 0 failures, DACH 1236 / 0).
      *Was:* ("point target: neither a goal nor a limit") and are silently
      excluded. Same shape as the 30 Russian rows fixed on 2026-09-08 by reading §2 of the source.
      *Check: each one read in its own source document and either given a min/max or allowlisted with
      the source's wording, as `VERIFIED_POINT_TARGETS` already requires.*

## B. The deep dive — units, one compound at a time

- [x] **B1. Rule on every qualifier pair, per compound, with a quote.** *(done 2026-09-24)* —
      `lib/dv/unit-rulings.ts` holds 5 rulings covering all 5 qualifier pairs that occur among the
      independent sources, each with a quote and a locator per affected region (24 quotes):
      **same quantity** — Vitamin E `mg` ≡ `mg α-TE` (every body means α-tocopherol), Retinol `µg` ≡
      `µg RE`; **different quantities** — Folate `µg` vs `µg DFE` (DFE weights synthetic folic acid at
      1.7), Niacin `mg` vs `mg NE` (NE counts tryptophan conversion), Vitamin A `µg` vs `µg RAE`.
      A pair with no ruling is treated as different, so the safe direction is the default. The resolver
      converts through `convertFor()`, which consults the ruling, and picks the bar's unit by grouping
      entries by what they MEAN rather than by a majority vote over strings — a vote would have decided
      folate's bar by a coin flip between two bodies writing µg and two writing µg DFE.
      *Check: `npx tsx scripts/dv-verify/check-unit-rulings.ts` — 5 rulings / 5 pairs / 0 failures. It
      fails on an unruled pair that occurs, a ruling that describes a pair that does not occur, a region
      that publishes an affected unit and is not quoted, a quote with no locator, and a `same: false`
      ruling that does not say what differs. Negative-tested on all five.*

- [ ] **B2. China's own labels were wrong, found while gathering B1's evidence.** `seed-china-cns-2023.ts`
      passed the basis as a *note* while the unit column stayed bare: niacin stored `mg` with the note
      "mg NE.", vitamin E stored `mg` with the note "α-TE.". The book prints NE and α-TE. Corrected in
      the seed and re-run. *Check: re-seed output, then the units in the database.* `mg` vs `mg α-TE`, `mg` vs
      `mg NE`, `µg` vs `µg RAE`, `µg` vs `µg DFE`, `mg` vs `mg ATE`. Each pair is either the same
      quantity under two names (vitamin E: the USA's bare mg IS α-tocopherol) or genuinely different
      (niacin: mg NE counts tryptophan conversion, bare mg does not). A blanket rule is wrong in both
      directions — one way silently drops sources, the other way silently equates unlike things.
      *Deliverable: a table in `lib/dv/unit-rulings.ts` with the source's own words per compound and
      region, enforced by a checker the way `check-compound-links.ts` enforces the form links.*

## C. Visibility — the audit is invisible to the user

- [~] **C1. Surface how many independent bodies back a target, and the spread.** *(server side done
      2026-09-24; the UI still has to draw it.)* `DvLookupRow` now carries `targetSources` (the bodies,
      named), `targetSpread`, and per-source counts; `GET /api/daily-values` returns them, and the daily
      totals payload passes `sourceCount`/`sources`/`spread` into `DvValue`. Remaining: `/analysis` does
      not render any of it yet — a target from one body still looks like a target from ten on screen.
      *Check: the service smoke run prints, for adult male, vitamin C 100 mg from 10 bodies spread
      40–110, and total fat 96.5 g from RUSSIA alone.* The resolver produces
      `sources`, `spread` and a full `excluded` list; `DvLookupRow` drops all of it at the service
      boundary. A target from one book currently looks identical to one from ten.

- [~] **C2. Carry the rest of the resolved bar through to the UI** *(server side done 2026-09-24)* —
      `diseaseFloor`, `supplementLimit`, `formLimits`, `energyShare` and `range` all reach the API
      response now. Verified end-to-end against the live database: vitamin A returns a 3000 µg retinol
      FORM limit beside its 850 µg RAE target, magnesium returns its 350 mg limit as supplement-only and
      no food limit, vitamin C returns China's 200 mg disease floor apart from the goal, total fat
      returns a 20–32.5 %E range. Remaining: the UI draws none of them.
      *Was:* — the disease-prevention floor, the
      macronutrient range, the supplement-only limit and the form-specific limits. All four are computed
      and thrown away.

## D. Coverage — the real ceiling

- [ ] **D1. Decide what to do about 19 single-body compounds.** Counting goals (RDA/AI) for an adult
      male, 19 of the 56 compounds that have one rest on a single authority: every essential amino acid but one (Korea), omega-3 and omega-6 (Japan),
      total fat (Russia). "Median of independent sources" is a median of one. Either mark them as such
      in the UI (C1 does this), add a source that covers them, or hide them for alpha.

- [ ] **D2. India and the UK are thin.** India 131 rows / 16 compounds, UK 584 / 27, against Korea's
      2,592 / 55. Both are among the 10 that are supposed to carry the median. Deepening these two is
      worth more than adding an 11th body.

- [ ] **D3. 207 of 284 compounds have no DV at all** (77 do). Decide per compound group whether that is
      correct — most have no authority anywhere and should never show a bar — or a gap.

- [ ] **D4. Heavy metals have no limits.** Needs a contaminant source set (JECFA PTWI, EFSA CONTAM TWI/
      TDI), a new value type expressed per kg body weight, and its own provenance pass. `VALUE-TYPES.md`
      carries the open question.

- [ ] **D5. CNF's 117 mappings remain unverifiable** — `source_cnf_nutrients` has 0 rows. Food-side, not
      DV-side, but it is the last unchecked block in the pipeline.

- [ ] **D6. Six provenance entries are still 🟡** (paywalled or unreachable derivation chapters): the
      1997–2005 US reports, EFSA's protein/fat/fibre opinions, D-A-CH's derivations, the full PDRI
      report, Indonesia's WNPG XI proceedings, Italy's LARN method.

## E. Recorded, not scheduled

- **Korea's vitamin A limit** is printed against total vitamin A with no preformed-only footnote, while
  the other five bodies limit retinol. Stored as printed; see `VALUE-TYPES.md`. Needs a chapter read.
- **Whether to show EAR at all**, and how.


---

## F. Corrections to this document's own numbers

- The first sweep (2026-09-24) filtered ages with `age_min <= 360 AND age_max >= 360`, which drops every
  row with a NULL age bound — EU, Russia and India publish many. It undercounted: vitamin C reads 10
  bodies, not 7, and the single-body count is 19, not 22. The service's own filter
  (`age_max IS NULL OR age_max >= 360`) was correct throughout; only the ad-hoc sweep was wrong. Any
  number in this file that predates this note and is not marked as checked against the service should be
  re-derived before it is quoted.


---

# G. PLAN — agreed 2026-09-24

Three things turned out to share one blocker, which is why they are planned together: **WHO's amino
acid requirements, every heavy-metal limit, and several WHO/FAO values we already hold are published
per kilogram of body weight.** Adding body weight unlocks all three at once.

## G1. Collect body weight *(decided: yes)*

- New column on `user_profiles`, **encrypted at rest** like `life_stage`: it is health data, the key
  lives in `user_encryption_keys`, and the pattern is already built (`encryptPHI`/`decryptPHI`).
- **Optional, never blocking.** Every bar must still work without it, using the reference body weight
  the authorities themselves publish per age and sex. A bar computed from a reference weight must say
  so — it is an assumption about the user, not a measurement of them.
- Data minimisation, per the door in CLAUDE.md §2: store **one current value to the nearest kg**, no
  history and no time series. A weight *trend* is a different and much more sensitive dataset, and
  nothing in the read path needs it. If tracking weight over time is ever wanted, that is a separate
  decision with its own DPIA entry.
- Paperwork this triggers, none of it optional:
  - `docs/DATA-SCOPE-DECISIONS.md` — a new entry saying what is collected, why, and what was refused.
  - `docs/DPIA-2026-09-23.md` — **the DPIA says to reissue if scope changes. This is a scope change.**
  - `docs/PRIVACY-POLICY-DRAFT.md` — the data categories list.
  - The export must include it (decrypted) and erasure already cascades from `user_profiles` — both
    need re-verifying end-to-end, not assuming.

## G2. Teach the schema what a per-kg, per-week value is

`reference_daily_values` currently assumes every value is an absolute amount per day. Two columns fix it:

- `per_kg_body_weight boolean` — the stored number is per kilogram.
- `averaging_days integer` — 1 for a daily value, 7 for a weekly one, 30 for cadmium's monthly PTMI.
  A daily bar reading 300 % after one shellfish meal is not what a monthly limit means.

New value types alongside the seven we have: **TWI / TDI / PTMI / RfD** (all ceilings), and **BMDL**
(a reference point, *not* a ceiling — see G4). The resolver converts per-kg values to absolute using
the user's weight, or the reference weight, and states which it used.

## G3. WHO/FAO amino acids — TRS 935 *(free, downloaded, verified)*

Not paywalled and not missing by decision: our WHO source is the **2004 Vitamin and mineral
requirements** report, and amino acids live in a **different document** — *Protein and amino acid
requirements in human nutrition*, WHO Technical Report Series 935 (2007), a joint FAO/WHO/UNU
consultation. It is free from WHO IRIS (4.2 MB PDF, text layer intact, downloaded and read).

- **Table 23** (p. 149) gives the adult requirements in **mg/kg per day**: histidine 10, isoleucine 20,
  leucine 39, lysine 30, methionine+cysteine 15, phenylalanine+tyrosine 25, threonine 15, tryptophan 4,
  valine 26.
- **§8.4** gives the safe intake as the requirement **+24 %** (CV 12 %), which maps to our EAR → RDA
  distinction exactly.
- **§9.4** covers infancy to 18 years; **§8.5** says elderly requirements are the adult pattern.
- Effect: amino acids stop resting on Korea alone. Two independent bodies, which is the difference
  between a median and a single opinion.

## G4. Heavy metals

Sources and their state are in `HEAVY-METALS-SOURCING.md`. The one open decision is what to show where
no safe level exists:

- **Cadmium, methylmercury, inorganic mercury** have real tolerable intakes from JECFA and EFSA, so they
  become ordinary limit bars (per kg, weekly or monthly).
- **Lead and inorganic arsenic do not, and this is not a gap in our sourcing.** Both JECFA and EFSA
  withdrew their tolerable intakes in 2010 after concluding no threshold exists. What they publish
  instead is a benchmark dose — for lead, EFSA 2010: BMDL01 **0.50 µg/kg bw/day** (developmental
  neurotoxicity in young children), BMDL01 1.50 (systolic blood pressure), BMDL10 0.63 (chronic kidney
  disease); for inorganic arsenic, EFSA 2024: BMDL05 **0.06 µg/kg bw/day** (skin cancer). You are meant
  to divide the reference point by the exposure to get a margin, not to fill a bar to 100 %.
  **Recommendation: no percentage bar for these two.** Show the intake, the reference point, and the
  margin, with the words the authorities use — "no safe level has been identified". Inventing a limit
  here would be exactly the kind of unverified claim §0 of CLAUDE.md is about.

## G5. Order

1. **G2** (schema) — everything else writes into it.
2. **G1** (body weight) — independent of G2, has the longest paperwork tail, start it in parallel.
3. **G3** (TRS 935) — the cheapest real win: one free document, one new body for 9 compounds.
4. **G4** (metals) — JECFA and EFSA first, each from its own document; EPA IRIS third and flagged as
   dated (its cadmium assessment is from 1989 and sits ~3x from EFSA's).
5. Codex maximum levels, if ever — a limit on the food, not on the person. Separate feature.
