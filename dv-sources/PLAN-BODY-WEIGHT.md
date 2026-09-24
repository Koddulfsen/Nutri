# Implementation plan — body weight, the per-kg backfill, and what follows

Written 2026-09-24. Companion to `DV-ACCURACY-TASKS.md` (findings and their state),
`PROVENANCE.md` (which body derived what), `VALUE-TYPES.md` (what each value means) and
`HEAVY-METALS-SOURCING.md` (the contaminant sources).

**Status of the prerequisite:** G2 (schema + resolver + checkers) is **done and pushed** — migration
`0057`, columns `per_kg_body_weight` and `averaging_days`, value types TWI/TDI/PTMI/RfD/BMDL, resolver
support with 37 tests. Everything below builds on it.

---

## 0. The two uses of body weight, which are not the same

This distinction decides most of the design, so it comes first.

**(a) The user's own weight** turns a per-kg value into *their* target. `0.83 g/kg × 72 kg = 59.8 g` of
protein. This is the accurate case and the reason to collect it.

**(b) A reference weight** is what we must use when they have given none. But "a reference weight" is
not one number — and the right one is **the weight the source itself used**. When the Nordic council
writes `0.05 mg/kg body weight` and prints `2.9 mg` beside it, it applied its own population reference
weight; using EFSA's 70 kg there would produce a number the Nordic council never published. So:

- Where a source publishes both the per-kg value **and** the absolute value it derived from it, store
  both, and let the absolute one be what a weightless user sees. Nothing is invented.
- Where a source publishes only per-kg, use that source's own reference-weight table if it has one,
  otherwise the global default, and **mark the result as an assumption** (`weightBasis.source =
  'reference'`, already implemented).

A bar built on an assumed weight must be able to say so. That is not a UI nicety: it is the difference
between "your target" and "the target for a 70 kg adult".

---

## A. Reference weights *(prerequisite for C and D to display without a user weight)*

**A1. Decide the global default and record it.**
EFSA's *Guidance on selected default values* (EFSA Journal 2012;10(3):2579) gives **70 kg** for adults,
**12 kg** for 1–3 y and **5 kg** for infants 0–12 months — deliberately coarse, and it does not split
by sex. IOM's DRI tables publish reference heights and weights per age band and sex, which is finer and
matches how our own age bands work.
*Deliverable:* a decision recorded in `docs/DATA-SCOPE-DECISIONS.md` naming the chosen table and why.
*Check:* the document and table are quoted with a locator, as every other value in this project is.

**A2. Build `lib/dv/reference-weights.ts`.**
`referenceWeightKg(ageMonths, sex)` returning `{ kg, note }`, where `note` names the source and table.
Pure function, no database.
*Check:* unit tests at the band edges (11/12 months, 3/4 years, 18/19 years) and for both sexes.

**A3. Per-source reference weights where a source publishes its own.**
Nordic (NNR), IOM and WHO/FAO each do. Store them beside the source, not in the global table, so a
value converts with the weight its own committee used.
*Check:* for a compound where a source prints both per-kg and absolute (NNR fluoride, vitamin K), the
per-kg value × that source's reference weight reproduces the printed absolute value. **If it does not,
the reference weight is wrong — this is the test that proves the whole approach.**

**A4. Wire it into the resolver call path.**
`getDailyValuesBatchByDemographics` already accepts `weightKg`; add the reference fallback so it passes
`referenceWeightKg` and `referenceWeightNote` when the user has none.
*Check:* a per-kg row resolves to an absolute number with `weightBasis.source === 'reference'`, and to
a different number once a user weight is supplied.

**A5. Provenance entry.** Reference weights are values like any other and need their own entry in
`PROVENANCE.md` — which body, which table, which year.

---

## B. The body-weight field *(independent of A; longest paperwork tail — start early)*

**B1. Schema.** `user_profiles.body_weight_kg_encrypted text` — ciphertext only. **No plaintext column,
no history table, no `weight_updated_at`.** One current value.
*Check:* the migration door in CLAUDE.md §2 — `drizzle.__drizzle_migrations` against
`drizzle/meta/_journal.json` before and after, then a live-column diff against the new snapshot with
zero drift both directions. (G2's migration is the worked example: 57/57 → 58/58, 764/764 columns.)

**B2. Read path.** Extend `getUserDemographics` in `lib/services/daily-value-service.ts`, mirroring
`life_stage` exactly: fetch `userEncryptionKeys` by `userId`, `decryptPHI`, log and degrade (return
null weight) if the key is missing rather than throwing.
*Check:* the existing life-stage integration test extended to cover weight — a real round-trip through
the read/write path, plus a raw `psql` read showing ciphertext, not a number.

**B3. Write path.** Extend `updateUserDemographics` the same way; `null` clears it.

**B4. API.** Add to `UpdateDemographicsSchema` in `app/api/user/demographics/route.ts`:
`bodyWeightKg: z.number().int().min(20).max(400).nullable().optional()`.
Integers only — see B5 for why.
*Check:* the route rejects `0`, `500` and `72.4`, accepts `72` and `null`.

**B5. Data minimisation, written down before it is coded.**
- **Nearest kilogram.** A decimal weight is a finer quasi-identifier and nothing in the read path needs
  it: at 0.83 g/kg, one kilogram moves the protein target by 0.8 g.
- **No history.** A weight *trend* is a categorically more sensitive dataset (it can evidence an eating
  disorder, a pregnancy, an illness) and no code reads it. If it is ever wanted, that is a new decision
  with its own DPIA entry — not a schema tweak.
- **No height, no BMI.** Nothing in the DV system reads them.
*Deliverable:* an entry in `docs/DATA-SCOPE-DECISIONS.md` in the same shape as the `birth_date` one,
recording what was refused and why, so a later session does not "helpfully" add it back.

**B6. UI.** One optional field wherever age and sex are already set. Plain wording: what it is used for
(per-kg targets), that leaving it blank is fine, and that a default is used if blank. Jens reviews the
visual result — no browser from this side.

**B7. Export.** `app/api/user/export/route.ts` must include the decrypted weight beside the other
demographics.
*Check:* export a throwaway account with a weight set, confirm it appears in the JSON.

**B8. Erasure.** The weight lives on `user_profiles`, which the 2.8 deletion already removes — but 2.8
found three tables that had no cascade at all, so this is verified, not assumed.
*Check:* re-run the 2.8 end-to-end sequence against a throwaway account: set a weight, confirm the row,
delete, confirm gone.

**B9. Paperwork — this is a scope change and the DPIA says to reissue on one.**
- `docs/DATA-SCOPE-DECISIONS.md` — the B5 entry.
- `docs/DPIA-2026-09-23.md` — reissue: new data category, its purpose, its lawful basis, and the fact
  that it is optional and encrypted at rest.
- `docs/PRIVACY-POLICY-DRAFT.md` — the data-categories list.
*This needs Jens's sign-off, not mine.*

**B10. Consent check.** Body weight is health data. Confirm it is covered by the existing
`sensitiveHealthData` consent flag in `ConsentManager.tsx`, or add it. Do not collect it under a flag
that does not mention it.

---

## C. Backfill the values eight sources dropped *(the payoff; needs A for display, not for storage)*

Each source is its own task: re-read the document, add the values to its `extract.ts` with
`perKgBodyWeight: true`, re-run its loader, verify. **One source per commit**, so a wrong transcription
is revertible on its own.

The standard check for every one of these: `npx tsx scripts/dv-verify/check-source-db.ts <REGION>`
(file = database) and `check-source-consistency.ts <REGION>` (0 failures), plus the new per-kg
plausibility rule catching anything mislabelled.

**C1. EFSA (EU) — protein.** AR and PRI from DRV Table 2, per kg, plus the pregnancy and lactation
increments the header records as skipped.
**C2. DACH — protein.** Currently skipped by an explicit `continue` in the loop at
`dv-sources/dge-dach/extract.ts:125`; remove the skip and store per-kg.
**C3. Nordic (NNR) — protein AR/RI, infant energy.** Also the case where per-kg × reference weight must
reproduce the printed absolute (A3's test).
**C4. UK (SACN) — adult protein RNI 0.75 g/kg** and its pregnancy/lactation increments.
**C5. WHO/FAO — adult energy (ch. 5, per kg × PAL)**, infant iodine, DHA 6–24 months.
Energy also carries an activity dimension, which the schema already has.
**C6. Taiwan — infant energy (kcal/kg) and protein (g/kg).**
**C7. Russia — infant energy, protein, fat, carbohydrate** (footnote * in table 11).
**C8. Vietnam — every amino acid** (Phụ lục 2.2–2.3) and the per-kg water values.
Vietnam is not one of the ten independent bodies, but this is the second amino-acid source in the
database and a cross-check on Korea's numbers.

**C9. Confirm the payoff.**
*Check:* protein resolves from **7 bodies to 10**; amino acids from 1 body to 2 (3 with WHO in D);
`check-source-db` reports file = database for all eight sources.

---

## D. WHO/FAO TRS 935 — amino acids and protein *(free, downloaded, verified readable)*

**D1.** `dv-sources/who-trs935-2007/` with the extracted text as the snapshot (the PDF is 4.2 MB; this
repo stores text snapshots).
**D2.** `extract.ts` covering: **Table 23** (adult indispensable amino acids, mg/kg/day — histidine 10,
isoleucine 20, leucine 39, lysine 30, methionine+cysteine 15, phenylalanine+tyrosine 25, threonine 15,
tryptophan 4, valine 26); **§8.4** (safe intake = requirement +24 %, CV 12 %) → the requirement is the
**EAR** and the safe intake the **RDA**; **§9.4** (infancy to 18 y); **§8.5** (elderly = adult pattern);
and **protein** 0.66 g/kg EAR / 0.83 g/kg RNI.
**D3.** Provenance entry — this is a *different document* from the 2004 report already recorded under
WHO_FAO, with a different consultation behind it, so it needs its own per-nutrient-group entry.
**D4.** Load and verify with all three checkers at 0 failures.
**D5.** Unit rulings check — amino acids in mg/kg against Korea's g/day is a magnitude conversion, not a
qualifier question, but run `check-unit-rulings.ts` anyway to confirm no new pair appeared.

---

## E. Show it *(the remaining half of C1/C2 in the task list)*

The resolver and API already return everything below; `/analysis` draws none of it.

**E1.** Source count and spread on a bar — "10 bodies, 40–110 mg". A one-body target must not look like
a ten-body one.
**E2.** The weight basis — when a bar used an assumed weight, say so.
**E3.** The disease floor, the supplement-only limit, form limits and ranges, each labelled as the
different question it answers.
**E4.** Averaging window, where it is not daily.

⚠️ `AnalysisClient.tsx` is under concurrent editing (CLAUDE.md §3.8 records two unrelated commits
landing in it during one session). Coordinate before touching it, or do this behind a small component
in `app/analysis/components/`.

---

## F. Heavy metals *(after A–D; plan already written)*

Steps are in `HEAVY-METALS-SOURCING.md` §4 and `DV-ACCURACY-TASKS.md` §G5/G4. Summary: JECFA first,
EFSA CONTAM second, EPA IRIS third and flagged as dated, a new region code for EPA, and **no percentage
bar for lead or inorganic arsenic** — both committees withdrew their tolerable intakes in 2010 after
finding no threshold, so what exists is a benchmark dose for a margin-of-exposure calculation. The
resolver already refuses to turn a BMDL into a limit, and a test asserts it.

---

## Order and dependencies

```
B (body-weight field) ───────────────┐
   B9 paperwork needs Jens           │
A (reference weights) ──┬────────────┼──→ C (backfill) ──→ D (TRS 935) ──→ E (show it) ──→ F (metals)
   A3 test proves A     │            │
                        └── needed for C/D to DISPLAY without a user weight
```

- **A and B are independent of each other** and can run in parallel. C can be *stored* without either,
  but cannot be *shown* to a weightless user without A.
- **A3 is the load-bearing test**: if a source's per-kg value times its own reference weight does not
  reproduce the absolute value it printed, the approach is wrong and it is better to find that out on
  day one than after eight backfills.
- Suggested first three: **A1–A3**, then **C1** (one source, end to end, proving the pipeline), then
  **B1–B5** while the DPIA question sits with Jens.

## Risks

| Risk | Handling |
|---|---|
| A reference weight silently wrong → every per-kg bar wrong by a plausible-looking factor | A3: reproduce each source's own printed absolute value. Same failure mode as conversion factors (CLAUDE.md §6): wrong input, plausible output, no crash |
| A per-kg value stored as absolute | The consistency checker rejects a per-kg value above 10 of its unit; already live |
| Body weight collected without the paperwork | B9 is a blocking step, not a follow-up. The DPIA says to reissue on scope change |
| `AnalysisClient.tsx` collisions in E | Small component in `app/analysis/components/`, coordinate first |
| Backfill introduces a transcription error | One source per commit; `check-source-db` proves file = database each time |
