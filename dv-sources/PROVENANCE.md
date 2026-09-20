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
| `aggregate` | The value **is** a statistical summary of other bodies' values (mode / median / mean across references). Must never enter our median — it would re-count every source it summarises. Found in Spain. |
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
| ✅ | Korea (KDRI 2020) | **`primary`**: IOM's vocabulary, Korea's own systematic review (203,237 studies screened). Only 11 of 34 adult values match IOM. |
| ⬜ | Nordic (NNR 2023) | Own systematic reviews (de-novo for some nutrients only). |
| ⬜ | UK (COMA/SACN) | 1991 baseline, own derivation; later updates per nutrient. |
| ⬜ | DACH | Own derivation; some values from EFSA. |
| ✅ | Australia/NZ (NHMRC) | `adapted`: adopted IOM's *approach*, kept its own reference point for chronic disease; 15 of 30 adult values differ from IOM. |
| ⬜ | Russia (MR 2.3.1.0253-21) | Own tradition; little cross-citation. |

### Known or suspected adopters

| | Source | What we already saw while transcribing |
|---|---|---|
| ✅ | Netherlands (GR) | Adult table names the origin of every value (EFSA / NCM 2014 / GR). Mostly EFSA; see findings. |
| ✅ | Malaysia (RNI 2017) | **Adapted**, not adopted: starts from WHO/FAO 2004 (vit D IOM 2011, B12 EFSA 2015) but modifies — e.g. vitamin C = WHO 45 + 25 mg by its own judgement. ULs are adopted from IOM verbatim. |
| 🟡 | Philippines (PDRI 2015) | ULs adopted (WHO/FAO 2006 + IOM), page 7 is WHO verbatim. RNIs: **unknown** — summary tables state no origin and the values match neither IOM nor WHO. Needs the full PDRI report. |
| ✅ | Vietnam (RDA 2016) | Attributable table by table via its "Nguồn:" lines: IOM 2006, Japanese DRIs 2015, FAO/WHO 2004. B1/B2/C/D and energy print no source. |
| ✅ | France (ANSES 2021) | `adapted`: selects the most appropriate reference per nutrient, but substitutes French INCA3 intake data where the reference was intake-based. ULs are EFSA's, `adopted`. |
| ✅ | Spain (AESAN 2019) | **`aggregate`** — its values are the mode/median/mean of other bodies' values. Must be excluded from our median entirely. |
| ⬜ | Italy (LARN 2014) | Check per nutrient. |
| ⬜ | Taiwan (DRIs 8th) | Check per nutrient. |
| 🟡 | Indonesia (AKG 2019) | `unknown`: the regulation states no derivation. Numeric signal points hard at IOM (17/31 adult values identical) but the WNPG XI proceedings are needed to confirm. |
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

### Malaysia, the Philippines and Vietnam (done 2026-09-20)

**Malaysia — adapted, not adopted. My first classification here was wrong.**
Vitamins (book p. 122): *"for all the 8 vitamins in the RNI (2005), except for vitamin D, the TSC decided to retain
the original values, ie adapting the values from WHO/FAO (2004). For vitamin D, the Committee decided to adapt the
values from IOM (2011)"*; vitamin K, B6 and pantothenic acid are WHO/FAO 2004; B12 is *"the EFSA (2015) values"*.
Minerals (p. 300): *"The TSC agreed to adopt the recommendations of WHO/FAO (2004) as a priority. However, for
minerals and trace elements that the WHO/FAO did not have available guidelines, the recommendations of IOM (various
years) were used instead."* Every chapter UL table carries *"Source: IOM"*.

On that basis I first classed Malaysia's vitamins and minerals as `adopted`. Then a numeric check contradicted it:
Malaysia's adult vitamin C is **70 mg**, while WHO/FAO 2004 — its stated source — says **45 mg**. Reading the
ascorbic acid chapter (book p. 227) explains why:

> "Both D-A-CH (2013) and EFSA (2013) recommended a higher intake of ascorbic acid ... However, the TSC Vitamins
> felt that the evidence for this is not conclusive and consistent. ... the TSC on Vitamins has proposed that
> **25 mg per day ascorbic acid be added on to the WHO/FAO (2004) recommended intake of 45 mg per day** for all
> groups above 10 years of age."

That is a Malaysian committee weighing WHO against EFSA and D-A-CH and landing on its own number. The same pattern
shows in the minerals: adult male iodine is 121-123 µg, re-derived on Malaysian reference body weights, against
WHO/FAO's flat 150 µg. The committee's own word in the summary is *"adapting"*, and it means it.

**So Malaysia is `adapted`: it keeps full weight in the median.** Had I stopped at the summary chapter's citations —
which read exactly like wholesale adoption — we would have deleted a genuine second opinion from every affected
nutrient. The upper levels are a different matter: those really are IOM's numbers reprinted, and stay `adopted`.

This is the strongest argument yet for the evidence rule. A citation tells you what a body *read*, not what it
*published*. Only the value tells you that.

**Vietnam — attributable table by table**, because most chapter tables print a "Nguồn:" (source) line: vitamin A, E
and K from the Japanese DRIs 2015; niacin, B5, B6, folate, B12, biotin and choline from IOM 2006 plus Japan; iron
and zinc from FAO/WHO 2004; copper, chromium, manganese and fluoride from IOM 2006; protein from WHO TRS 935 (2007);
fibre from the US Food and Nutrition Board 1996; sodium and potassium from the WHO 2012 guidelines. Four vitamin
tables (B1, B2, C, D) and the energy table print **no** source line, so those are left `unknown` rather than swept in
with their neighbours.

**The Philippines — the interesting one, because the answer is "we don't know".**
Its upper levels are explicitly *"Adapted from WHO/FAO Guidelines on Food Fortification with Micronutrients
(WHO/FAO, 2006) ... The remaining values are those recommended by IOM-FNB"*, and its page 7 limits are WHO's
guidelines verbatim. But the summary tables we load state **no origin at all** for the recommended intakes
themselves, and the numbers rule out simple adoption:

| Adult male | Philippines | IOM | WHO/FAO |
|---|---|---|---|
| Vitamin C | 70 mg | 90 | 45 |
| Calcium | 750 mg | 1000 | 1000 |
| Iron | 12 mg | 8 | 11 |
| Zinc | 6.5 mg | 11 | 7 |

Matching neither, so it is recorded as `unknown`, not guessed. The full PDRI report (we hold only the summary
tables) would say.

**The South-East Asian cluster: chased, and not supported.** The Philippine values match Malaysia's on several
nutrients (vitamin C 70, zinc 6.5), and Malaysia, the Philippines and Vietnam all cite the **ILSI South-East Asia
RDA harmonisation**, so I went looking for a regional cluster that agrees internally rather than with the evidence.
The harmonisation paper (Barba & Cabrera, *Asia Pac J Clin Nutr* 2008;17(S2):405-408) says what was harmonised was
*"common approaches, concepts and terminologies; application and uses, format and a research agenda"* across
Indonesia, Malaysia, the Philippines, Singapore, Thailand and Vietnam — shared **method**, not shared values; it
explicitly records differences in physiologic groupings and reference body weights.

So the hypothesis is dropped. The matching numbers are better explained by a shared starting point (WHO/FAO 2004)
plus similar regional body weights. Recorded here because a discarded hypothesis is worth as much as a kept one:
without this check, "SEA countries copy each other" would have become a fact in this file by repetition.

### Indonesia — AKG 2019 (done as far as the document allows, 2026-09-20)

The regulation (Permenkes 28/2019) **states no derivation at all**. Lampiran II (p. 16) gives only institutional
history: the AKG was first set in 1968 and is *"diperbaharui melalui Widyakarya Nasional Pangan dan Gizi (WNPG)"* —
updated through the national food and nutrition workshop, most recently WNPG XI in 2018. The single citation in the
whole document is a footnote crediting IOM 2001/2006 for the zinc bioavailability assumption.

So the class is `unknown`. But the method says to record numeric corroboration as a separate signal, and it is loud:

| Compared on adult-male values | Identical |
|---|---|
| Indonesia vs IOM | **17 of 31** |
| Indonesia vs WHO/FAO | 7 of 19 |

The IOM matches include distinctive values that are unlikely to coincide — choline 550 mg, biotin 30 µg,
pantothenic acid 5 mg, vitamin C 90 mg, vitamin E 15 mg, vitamin D 15 µg. One detail is sharper than the rest:
Indonesia's potassium is **4,700 mg**, which is IOM's *2005* adequate intake — superseded by 3,400 mg in IOM's 2019
revision. A body deriving potassium independently in 2019 would not land on the value IOM had just abandoned.

That is strong circumstantial evidence of adoption, and it is still **not** a finding: the rule is that matching
numbers never substitute for the source's own statement. What would settle it is the WNPG XI proceedings, which the
regulation implements but does not reproduce. Recorded as `unknown` with the signal attached, so whoever finds those
proceedings can close it in minutes.

Note the contrast with Malaysia: there, the text claimed adoption and the numbers refuted it. Here the text is
silent and the numbers suggest it. Neither direction is safe to shortcut.

### France — ANSES 2021 (done 2026-09-20)

**`adapted`.** The avis states its method plainly (§1): the work is to *"répertorier les références définies par
d'autres instances et notamment par l'Efsa ... puis à identifier pour chaque nutriment, la référence nutritionnelle
la plus appropriée pour la population cible"* — survey what other bodies have set, then pick per nutrient.

Selection alone would make it an adopter. What lifts it to `adapted` is the next sentence: *"Pour les références
nutritionnelles basées sur des consommations alimentaires, l'expertise prendra en compte les apports observés pour
la population vivant en France."* Where EFSA set an adequate intake from **European** mean intakes, the French
committee substituted the **French** mean, from the INCA3 survey of 5,855 people. Same method, French data, often a
different number.

The upper levels are a different matter and stay `adopted`: *"la limite supérieure de sécurité déterminée par
l'Efsa, sera donnée à titre indicatif"* — EFSA's ULs, reprinted for information.

### Spain — AESAN 2019 (done 2026-09-20). The most important finding of the audit so far.

**Spain's values are not a judgement about nutrition. They are a statistical summary of other bodies' judgements.**

From the method section (Revista del Comité Científico nº 29, pp. 51-52): for every vitamin and mineral the values
were set *"aplicando un algoritmo de toma de decisiones basado en el de la FESNAD"*, which begins by *"definir la
moda y la mediana del nutriente correspondiente entre las fuentes de referencia seleccionadas"* and, where those
disagree, *"calcular la media"*. Mode, median, then mean — **of EFSA, IOM, WHO/FAO, the Nordic and D-A-CH values.**

That is precisely the computation we are building. Feeding Spain into our median would:

1. re-count every body Spain summarised, on top of counting them directly; and
2. pull our result toward the majority opinion of *Spain's* chosen reference set, which we did not choose.

So `aggregate` is now its own class, defined as "must never enter the aggregation". It is not a criticism of AESAN —
harmonising existing references is a perfectly sound way to produce national guidance. It is simply the one kind of
source that a median-of-sources must exclude, and we would never have known from the values alone: they look like
ordinary national reference intakes.

Spain's energy and macronutrient values are `adopted` straight from EFSA, and were already left out at transcription
time to avoid duplicating EFSA — the right call, made before we had a name for the problem.

### Australia/NZ and Korea (done 2026-09-20) — "framework" is not "values"

Both sources describe themselves in terms of the IOM DRI system, which is exactly the phrasing that makes a source
look like a copy. In both cases the values say otherwise.

**Australia/NZ — `adapted`.** The Working Party *"decided to adopt the APPROACH of the US:Canadian Dietary Reference
Intakes (DRIs) but vary some of the terminology"*, while also weighing *"recommendations from the United Kingdom,
Germany and the European Union, recent dietary survey data collected in Australia and New Zealand, scientific data
and unique Australasian conditions"*. It also breaks with IOM on principle:

> "In contrast to the US:Canadian approach, the Working Party agreed to retain the traditional concept of adequate
> physiological or metabolic function ... as the prime reference point for establishing the EAR and RDIs and to deal
> separately with the issue of chronic disease prevention."

Numbers agree with the text: **15 of 30** adult-male values differ from IOM, several sharply — vitamin C 45 vs
90 mg, vitamin D 5 vs 15 µg, vitamin K 70 vs 120 µg, zinc 14 vs 11 mg, selenium 70 vs 55 µg.

**Korea — `primary`.** The KDRI systematic review framework *"followed the Agency for Healthcare Research and
Quality and the Tufts Evidence-based Practice Center"*; *"A total of 203,237 studies were retrieved ... with 2,324
of these studies included in the analysis"* (Nutr Res Pract 2018;12(6):459-468). Only **11 of 34** adult-male values
match IOM. A body that screens 203,000 studies and lands on different numbers is deriving, not copying — the shared
EAR/RDA/AI/UL vocabulary is just vocabulary.

**Rule of thumb this establishes:** "we use the DRI framework" is a statement about *terminology and value types*,
not about numbers. Several sources in this set say it. It is not evidence of dependence on its own, and the numeric
check is what separates the cases.

## Open question for aggregation (decide after the audit)

Two options once dependencies are known:

1. **Collapse** — values tracing to one primary judgement are merged into a single vote before the median.
   Honest, and what the audit is for.
2. **Weight** — adopters count at a reduced weight rather than zero, on the grounds that adopting is itself a
   (weak) endorsement by a national committee that reviewed the evidence.

Recommendation: collapse for identical values, keep `adapted` at full weight (a re-derivation for a different
body size or iron bioavailability is real information). Decide with Jens once the table exists.
