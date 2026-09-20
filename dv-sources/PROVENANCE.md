# DV source provenance — who actually derived each number

**Status: in progress. This file is the run-state for the provenance audit — update it as each source is done, and
it is safe to pick up cold from here.**

## Why

Aggregating 22 sources is only honest if they are 22 independent judgements. They are not. While transcribing we
kept seeing sources adopt others wholesale:

- The Netherlands adopts EFSA for most adult values.
- Malaysia adopts WHO/FAO 2004 for vitamins and IOM for minerals; every upper level is IOM.
- The Philippines' upper levels come from WHO/FAO 2006 and IOM; its sodium, potassium and sugar limits are WHO's
  guidelines verbatim.
- Vietnam cites FAO/WHO 2004, IOM and the Japanese DRIs table by table.
- France prints EFSA's upper levels as its own LSS.
- Spain harmonises other bodies' values by an explicit algorithm.

So "12 of 15 authorities say 100 mg" can be one IOM judgement counted twelve times. Unless we know which values
descend from which, the median is a popularity contest among copies, and a user's target inherits that bias.

**Goal:** for every value we store, know which primary derivation it descends from, so the aggregator can count a
judgement once and keep genuinely independent ones at full weight.

## Definitions

Each (source × nutrient group) gets one of:

| Class | Meaning |
|---|---|
| `primary` | The body derived the value itself from evidence (its own balance studies, biomarkers, factorial modelling, or its own population intake data). |
| `adapted` | Took another body's value but re-derived it for its own population — e.g. rescaled to national reference weights, re-cut age bands, changed iron bioavailability assumptions. Partly independent. |
| `adopted` | Took another body's value as published. Not an independent vote. |
| `unknown` | The report does not say. Treated as `adopted` when it matches a primary source's value exactly, otherwise left as unknown and excluded from dependency collapsing. |

Recorded **per nutrient group**, not per source: Malaysia is WHO for vitamins and IOM for minerals, and a source
often sets its own value for one or two nutrients that matter locally (iodine in goitre-endemic regions, iron at
local bioavailability, vitamin D at local latitude).

Nutrient groups: `energy`, `protein`, `fat`, `carbohydrate`, `fibre`, `vitamins`, `minerals`, `electrolytes`,
`upper_levels`, `water`.

## Evidence rules

The same door as everywhere else in this repo: **a claim about provenance needs a quote from the source document.**

1. Evidence must come from the source's own text — a methods chapter, a "Source:" line under a table, or a
   comparison appendix. Every entry records the page.
2. Where the report says different things for different tables, record per table; do not average an impression.
3. If the report is silent, mark `unknown`. Do **not** infer from matching numbers alone — but do record the
   numeric match as a separate signal (see below).
4. Numeric corroboration: for a sample of nutrients, compare stored values across sources. An exact match across
   all age bands is strong evidence of adoption even when the text is silent; it is recorded as evidence, never as
   a substitute for the text.

## Deliverables

- [ ] `dv-sources/PROVENANCE.md` (this file) — findings per source, with quotes and pages.
- [ ] `lib/dv/source-provenance.ts` — machine-readable: `region → nutrient group → { class, derivedFrom[], evidence }`.
- [ ] A check script that fails when a loaded source has no provenance entry, so new sources cannot skip this.
- [ ] Aggregation change: collapse values that descend from the same primary judgement, count the cluster once.
- [ ] Update `INDEX.md` (its Tier 1/2 split is a guess at independence — replace it with what the audit found) and
      the audit doc.

## Task list

Sources marked ✅ have both their text evidence read and their entry written in `source-provenance.ts`.

### Primary bodies (expected to derive their own; still need their method read)

| | Source | Notes |
|---|---|---|
| ⬜ | USA/Canada (IOM/NASEM) | The most-copied body. Which of its values are themselves from WHO/FAO? |
| ⬜ | EU (EFSA) | Second most-copied. |
| ⬜ | WHO/FAO | Global reference; check how much it shares with IOM. |
| ⬜ | Japan (MHLW 2025) | Derives own; check which nutrients cite IOM. |
| ⬜ | China (CNS 2023) | Large own-evidence base. |
| ⬜ | Korea (KDRI 2020) | States its framework is IOM's — but values may be own. |
| ⬜ | Nordic (NNR 2023) | Own systematic reviews (de-novo for some nutrients only). |
| ⬜ | UK (COMA/SACN) | 1991 baseline, own derivation; later updates per nutrient. |
| ⬜ | DACH | Own derivation; some values from EFSA. |
| ⬜ | Australia/NZ (NHMRC) | Explicitly built on IOM — expect mostly `adapted`. |
| ⬜ | Russia (MR 2.3.1.0253-21) | Own tradition; little cross-citation. |

### Known or suspected adopters

| | Source | What we already saw while transcribing |
|---|---|---|
| ⬜ | Netherlands (GR) | Adult table names the origin of every value (EFSA / NCM 2014 / GR). Easiest one; notes already carry it. |
| ⬜ | Malaysia (RNI 2017) | Vitamins WHO/FAO 2004 (vit D IOM 2011, B12 EFSA 2015); minerals WHO/FAO or IOM; all ULs IOM. |
| ⬜ | Philippines (PDRI 2015) | ULs WHO/FAO 2006 + IOM; page 7 is WHO guidelines. |
| ⬜ | Vietnam (RDA 2016) | Per-table sources: FAO/WHO 2004, IOM, Japan 2015. |
| ⬜ | France (ANSES 2021) | ULs are EFSA's; some values own. |
| ⬜ | Spain (AESAN 2019) | Harmonisation algorithm over other bodies — mostly `adopted` by construction. |
| ⬜ | Italy (LARN 2014) | Check per nutrient. |
| ⬜ | Taiwan (DRIs 8th) | Check per nutrient. |
| ⬜ | Indonesia (AKG 2019) | Widely assumed IOM-derived; needs the regulation's own basis. |
| ⬜ | Singapore (HPB) | Small table; origin unstated so far. |
| ⬜ | India (ICMR brief) | 131 rows only. |

### Not yet loaded (do provenance at load time, not as a second pass)

| | Source |
|---|---|
| ⬜ | Thailand (DRI 2020) |
| ⬜ | Poland (2020) |
| ⬜ | Belgium (2016) |
| ⬜ | Türkiye (TÜBER 2022) |

## Findings

One section per source as it is done: what the report says, with page references, then the classification.

_(none yet)_

## Open question for aggregation (decide after the audit)

Two options once dependencies are known:

1. **Collapse** — values tracing to one primary judgement are merged into a single vote before the median.
   Honest, and what the audit is for.
2. **Weight** — adopters count at a reduced weight rather than zero, on the grounds that adopting is itself a
   (weak) endorsement by a national committee that reviewed the evidence.

Recommendation: collapse for identical values, keep `adapted` at full weight (a re-derivation for a different
body size or iron bioavailability is real information). Decide with Jens once the table exists.
