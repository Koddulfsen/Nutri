# Heavy metals — sourcing plan

Run-state for adding contaminant limits. Companion to `PROVENANCE.md` (who derives what),
`VALUE-TYPES.md` (what each value means) and `DV-ACCURACY-TASKS.md` (task D4).

Researched 2026-09-24. **Every value below is a lead to verify against the source document, not a
transcribed value.** Nothing here is loaded yet.

---

## 0. Why this is not just "another DV source"

A contaminant limit is a different kind of number from an RDA, in four ways that each break something
the current system assumes:

1. **It is per kilogram of body weight.** Every nutrient DV we hold is an absolute amount per day.
   `user_profiles` holds no weight — checked, there is no weight column and `docs/DATA-SCOPE-DECISIONS.md`
   does not mention one. So either we collect body weight (a new field, and one that is health data),
   or we apply the reference body weights the authorities themselves use per age and sex. **Decide
   before transcribing anything**, because it determines whether the stored value is per kg or absolute.
2. **It is per week or per month, not per day.** JECFA's cadmium limit is a *monthly* intake (PTMI) on
   purpose — cadmium's half-life in the body is decades, so a single day's intake means little. A daily
   bar filled to 300 % on a shellfish day says nothing true. This needs an averaging window, which no
   existing value type has.
3. **For lead and inorganic arsenic there is no safe intake at all.** Both JECFA and EFSA withdrew their
   tolerable intakes and moved to a benchmark dose (BMDL) with a margin-of-exposure calculation, because
   no threshold could be identified. A "% of your limit" bar for lead would be inventing a limit the
   science explicitly declines to set. Options: show a margin of exposure, show "no safe level —
   minimise", or show nothing. **This is a product decision, not a data one.**
4. **There is no goal, only a ceiling** — like Boron and Nickel already in `LIMIT_ONLY_COMPOUNDS`.

## 1. Do we have anything to compare a limit against?

Yes, thinly. The compounds exist (Lead, Cadmium, Mercury, Arsenic, Inorganic Arsenic, Organic Arsenic,
Nickel, Aluminum, Tin, Antimony, Chromium, Uranium) and are mapped to 4 food sources (AFCD, DUKE, FOODB,
FOODFILES). Of the 71 merged foods, values exist for cadmium (20), arsenic (20), lead (17), nickel (17),
aluminum (16), mercury (9). AFCD and FOODFILES are loaded; DUKE and FOODB are not, so coverage grows if
they ever are.

## 2. Candidate sources, all free

| Body | What it publishes | Access | Notes |
|---|---|---|---|
| **JECFA** (FAO/WHO) | PTWI / PTMI / PTDI | Free web database + TRS monographs (PDF) | The global reference. Cadmium PTMI 25 µg/kg bw/month (2010); methylmercury PTWI 1.6 µg/kg bw/week. **Lead PTWI withdrawn 2010; inorganic arsenic PTWI withdrawn 2010** |
| **EFSA CONTAM** | TWI, or BMDL + MOE where no threshold exists | Open-access EFSA Journal | Cadmium TWI 2.5 µg/kg bw/week; methylmercury 1.3; inorganic mercury 4 (2012, reaffirmed in a 2026 statement). Lead and iAs: BMDL/MOE only. iAs updated 2024 (BMDL05 0.06 µg/kg bw/day, skin cancer) |
| **US EPA IRIS** | Chronic oral RfD (mg/kg-day) | Free, public domain, per-chemical PDF | Cadmium **food** RfD 1×10⁻³ vs water 5×10⁻⁴ — separate values by route, which no other body does. Assessments are old (cadmium 1989) and disagree with EFSA by ~3× |
| **ATSDR** | Minimal Risk Levels | Free consolidated PDF, fixed-width table, easy to parse | **Verified against the July 2025 table: thin for metals.** Only methylmercury (0.1 µg/kg/day) and selenium have a chronic *oral* MRL; cadmium has none, arsenic only acute. Not a primary source for this |
| Health Canada / FSANZ / COT (UK) | National tolerable intakes | Free | Mostly adopt JECFA or EFSA — check provenance before counting them as independent |
| **Codex GSCTFF** | Maximum levels **in food** (mg/kg of food) | Free | A different axis: a limit on the food, not on the person's intake. Useful for flagging an ingredient, not for a daily bar. Worth having, separately |

## 3. Independence

Expect **three** genuinely independent derivations at most — JECFA, EFSA and EPA — against the ten we
have for nutrients. A median of three is a weak median, and EPA's assessments predate the others by
decades. The same provenance rules apply: read how each body derived its number before counting it.

## 4. Order of work

- [ ] **H1.** Decide the body-weight question (collect vs reference weights). Blocks everything else.
- [ ] **H2.** Decide what to show for lead and inorganic arsenic, where no safe level exists.
- [ ] **H3.** Add the value types and the averaging window to the schema (TWI / TDI / PTMI / RfD, plus
      a `per_kg_body_weight` flag and an `averaging_days` field).
- [ ] **H4.** Transcribe JECFA and EFSA first, each from its own document, with a provenance entry.
- [ ] **H5.** EPA IRIS third, flagged as dated.
- [ ] **H6.** Codex maximum levels as a separate, food-side feature — not a DV.
