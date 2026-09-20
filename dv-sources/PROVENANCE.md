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

- [x] `dv-sources/PROVENANCE.md` (this file) — findings per source, with quotes and pages.
- [x] `lib/dv/source-provenance.ts` — machine-readable: `region → nutrient group → { class, derivedFrom[], evidence }`.
- [x] A check script that fails when a loaded source has no provenance entry, so new sources cannot skip this:
      `npx tsx scripts/dv-verify/check-provenance.ts`. It also rejects an entry whose evidence quotes no page, table
      or section, and it counts China, which is loaded by its own seeder and would otherwise slip between the two loaders.
- [ ] Aggregation change: collapse values that descend from the same primary judgement, count the cluster once.
- [ ] Update `INDEX.md` (its Tier 1/2 split is a guess at independence — replace it with what the audit found) and
      the audit doc.

## Task list

Sources marked ✅ have both their text evidence read and their entry written in `source-provenance.ts`.

### Primary bodies (expected to derive their own; still need their method read)

| | Source | Notes |
|---|---|---|
| 🟡 | USA/Canada (IOM/NASEM) | Primary for energy, sodium/potassium, calcium and vitamin D — evidenced. **Still to read:** the 1997-2001 vitamin/mineral reports and the 2005 macronutrient report (protein, carbohydrate, fat, fibre, water, AMDRs). |
| 🟡 | EU (EFSA) | Primary: 34 nutrient-by-nutrient opinions by its own panel. **Still to read:** protein, fat and fibre opinions (the macronutrient group beyond carbohydrate). |
| ✅ | WHO/FAO | Primary throughout: 2004 expert consultation, 2001 energy consultation, 2012/2015/2023 GRADE guidelines. Shares IOM's *definition* of the RNI, not its values. |
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
| ✅ | Netherlands (GR) | Adult table names the origin of every value (EFSA / NCM 2014 / GR). Mostly EFSA; see findings. |
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

### Netherlands — Gezondheidsraad (done 2026-09-20)

**Mostly an adopter of EFSA, and it says so plainly.** Adult advice 2018/19 §4.1 (p. 24):

> "Voor ongeveer de helft van deze stoffen zijn de EFSA-normen overgenomen (Tabel 3). De adequate innames voor de
> resterende voedingsstoffen hebben een zwakke onderbouwing en zijn alle overgenomen van EFSA (Tabel 4)."

About half of the well-founded values are EFSA's, and *all* of the weakly-founded adequate intakes are. The council
frames its whole task as European harmonisation (2025/06 §1.1, p. 5: it evaluates the EFSA values published
2010-2019 "om te bezien in hoeverre deze ook voor Nederland kunnen gelden").

Better still, Tabel 3 carries a **Herkomst** (origin) column per value, so this source is auditable value by value —
and our stored notes already carry it. Breakdown of what we hold:

| Origin | Compounds |
|---|---|
| EFSA | biotin, choline, iodine, iron, magnesium, manganese, molybdenum, niacin, pantothenic acid, phosphorus, potassium, riboflavin, selenium, thiamin, vitamin E, vitamin K1, calcium (18-49 y) |
| NCM 2014 (Nordic) | vitamin C, copper, zinc |
| GR's own earlier reports | vitamin B6, folate, B12 (GR 2003); vitamin D (GR 2012); calcium 50+ (GR 2000) |
| This report | vitamin A |

Two findings that matter beyond the Netherlands:

1. **A chain, not a single hop.** Tabel 3 footnote f (p. 25): *"De normen voor koper van NCM 2014 komen overeen met
   de IOM-normen uit 2001."* Dutch copper comes from the Nordic value, which is itself IOM 2001. Collapsing only
   direct citations would still double-count IOM here. The model has to follow chains.
2. **`adapted` is a real category.** Vitamin A is EFSA's *method* re-run on Dutch body weights (footnote b, p. 25:
   "berekend met EFSA's methode, maar voor Nederland is uitgegaan van een hoger lichaamsgewicht"). That is not an
   echo of EFSA's number and shouldn't be collapsed into it.

Upper levels: none stored, and the council no longer derives them — 2025/06 §1.2 (p. 7): *"Sinds 2023 worden deze in
Nederland direct van EFSA overgenomen."* Sodium and chloride: no Dutch reference values exist at all (2025/06 §1.1,
p. 5), which is why our data has none.

Children (2025/06): values are extrapolated by the committee itself, mostly as adequate intakes, and it notes this
sometimes departs from EFSA ("waarmee ze in sommige gevallen afwijkt van EFSA", p. 4). Classed with the adult
groups as adopted-from-EFSA at group level; the departures are in the per-value notes.

### USA/Canada — IOM / NASEM (partly done 2026-09-20)

The body everything else copies, so its own provenance matters most. What is evidenced so far, all **primary**:

- **Energy (EER 2023).** The committee pooled doubly labeled water measurements from IAEA, IOM, SOLNAS and the
  Children's Nutrition Research Center and *"engaged a consultant group to analyze the DLW data and generate
  prediction equations for TEE by age/sex and life-stage groups"* (Summary, NCBI NBK591034). New equations from
  measurement data, and it explicitly discarded the 2005 activity coefficients as not constant across ages.
- **Sodium and potassium (2019).** An AHRQ systematic review *"served as a primary source of evidence"*, supplemented
  by the committee's own literature searches; where evidence could not support an EAR it set AIs from *"median
  intakes observed in an apparently healthy group of people"* (NCBI NBK545428). This is also the report that
  introduced the CDRR category we store.
- **Calcium and vitamin D (2011).** Commissioned by the US and Canadian governments, a 14-member committee worked
  from *"systematic evidence-based reviews from the Agency for Healthcare Research and Quality (AHRQ)"* and set
  EAR/RDA/UL itself (Summary, NCBI nap13050/summary).

**Deliberately not yet claimed.** The evidence above covers energy, the electrolytes, calcium and vitamin D. The
1997-2001 reports behind the other vitamins and minerals, and the 2005 macronutrient report behind protein,
carbohydrate, fat, fibre, water and the AMDRs, have not been read — the 2005 report's text is not freely readable as
HTML (NAP serves a PDF behind a download form). Those groups are absent from the entry rather than assumed primary,
and the scope limit is written into the evidence strings themselves.

Note for the aggregation: our US data comes from the NCBI summary tables, which carry no provenance text at all. The
provenance lives only in the underlying reports — which is exactly why this has to be recorded once, here, rather
than re-derived by whoever next reads the tables.

### EU — EFSA (mostly done 2026-09-20)

**Primary, and the second most-copied body in our set** (the Netherlands, France and Spain all lean on it).

The Summary of Dietary Reference Values v4 (Sept 2017), overview p. 1, states the values are *"derived by the EFSA
Panel on Dietetic Products, Nutrition and Allergies (NDA)"* across 34 nutrient-by-nutrient scientific opinions
(2009-2019), each with its own reasoning: *"the detailed reasoning for establishing individual values can be found
in the related opinions of the NDA Panel."*

One sentence there matters for how we classify everyone else:

> "The work done by EFSA in this area was based on a request from the European Commission, which asked EFSA to update
> previous European advice (SCF, 1993), taking into account new scientific evidence **and recent recommendations
> issued at national and international level**."

So EFSA *reads* IOM and WHO but deliberates its own value. That is the line between `primary` and `adopted`:
considering another body's number is not taking it. A source only becomes `adopted` when it prints the other body's
value as its own, as the Netherlands does explicitly.

Where EFSA cannot determine an Average Requirement it sets an Adequate Intake from *"the average observed or
experimentally determined ... nutrient intake by a population group ... of apparently healthy people"* — European
intake data, i.e. still its own basis.

Sodium and chloride (2019) are the same panel's own work: our stored snapshot of the sodium opinion shows it
weighing balance studies and the intake-blood-pressure relationship before concluding *"that 2.0 g sodium/day is a
safe and adequate intake for the general EU population of adults"*, with children extrapolated from that value.

Not yet claimed: the protein, fat and fibre opinions have not been read, so only carbohydrate is entered for
macronutrients.

### WHO/FAO (done 2026-09-20)

**Primary in all four documents we load**, and the one most copied by the Asian sources.

- **Vitamins and minerals (FAO/WHO 2004, ch. 1).** A joint expert consultation set the RNI as *"the daily intake,
  which meets the nutrient requirements of almost all (97.5 percent) apparently healthy individuals in an age and
  sex-specific population group"*, as `RNI = EAR + 2SD`, from biological criteria for adequacy.
- **Energy (FAO/WHO/UNU 2001, ch. 4).** The consultation *"analysed a number of studies on TEE, growth and habitual
  activity patterns of children and adolescents in different parts of the world"*, deriving requirements from
  measured total energy expenditure instead of the food-intake basis used in 1985.
- **Sodium, potassium, sugars, fats (2012/2015/2023).** WHO's own guideline process: *"WHO developed the present
  evidence-informed guideline using the procedures outlined in the WHO handbook for guideline development"*, with
  GRADE applied to commissioned systematic reviews. The 2023 saturated-fat limits are *"based on evidence from four
  systematic reviews"*.

**The trap I had to avoid here.** The 2004 report says its RNI *"is equivalent to that of recommended dietary
allowance (RDA) as used by the Food and Nutrition Board of the US National Academy of Sciences."* Read carelessly,
that looks like WHO taking IOM's values. It is not — it is an equivalence of *definition* (both mean "covers 97.5%
of the group"). The values are derived separately and often differ substantially. A provenance audit that treated
shared vocabulary as shared judgement would collapse the two biggest independent bodies in the world into one, which
would be a far worse error than the one we are fixing.

**What makes WHO/FAO genuinely distinct:** its mineral tables are published *by bioavailability level* — iron at 5,
10, 12 and 15% absorption, zinc at low/moderate/high — because it is writing for diets worldwide, not for one
country's food supply. No other source in our set does this. When a WHO iron value differs from IOM's, that is a
real second opinion about a different population, not noise to be averaged away.

## Open question for aggregation (decide after the audit)

Two options once dependencies are known:

1. **Collapse** — values tracing to one primary judgement are merged into a single vote before the median.
   Honest, and what the audit is for.
2. **Weight** — adopters count at a reduced weight rather than zero, on the grounds that adopting is itself a
   (weak) endorsement by a national committee that reviewed the evidence.

Recommendation: collapse for identical values, keep `adapted` at full weight (a re-derivation for a different
body size or iron bioavailability is real information). Decide with Jens once the table exists.
