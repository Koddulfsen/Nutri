# DV Sources — Coverage Index

Tracks which authoritative DRI/DRV sources have been seeded into Nutri.
Update this after each source is signed off.

> ⚠️ The Tier 1 / Tier 2 split below is an **assumption** about which sources are independent. It is being replaced
> by evidence read from each report: see **`PROVENANCE.md`**, which is also the run-state for that audit.

**Legend — Status:** ✅ seeded & verified · 🟡 in progress · ⬜ not started · ❌ blocked
**Legend — Access:** 🆓 fully free · 💰 fully paid · 🔓 free partial + paid full · ⚠️ free but CAPTCHA/bot-blocked

> **Scope:** Nutri stores only demographic-aware scientific DRIs. All sources
> must have at minimum age + sex. Regulatory flat-value authorities (FDA DV,
> EU NRV, Codex NRV, etc.) were dropped — they duplicate the adult demographic
> of scientific sources without providing personalized granularity.

## Scientific DRI sources (demographic-aware)

### Tier 1 — independent research, regularly updated, full demographic coverage

| Status | Access | Slug | Authority | Region | Version | Coverage |
|--------|--------|------|-----------|--------|---------|----------|
| ✅ | 🆓 | `nnr-2023` | Nordic Council of Ministers (NNR 2023) | Nordic (DK/FI/IS/NO/SE) | 2023 | Full (1,080 rows; adults + children + pregnancy T1/T2/T3 + lactation + ULs + CDRR + provisional AR + Niacin split into Nicotinamide/Nicotinic Acid variants) |
| ❌ | 💰 | `larn-v-2024` | SINU (LARN V) | Italy | 2024 | **Blocked — €80.75 book only** (Biomedia editore, ISBN 9788886154765, 804 pp., June 2024). Free appendices contain methodology only. |
| ✅ | 🔓 | `larn-2014` | SINU (LARN IV Revisione) | Italy | 2014 | Partial (616 rows; PRI/AI only). Web tables free; full book paywalled. |
| ✅ | 🆓 | `efsa-drv` | EFSA DRV | EU-27 | 2017 + 2025 ULs | Strong (1,136 rows). Energy × age × sex × 4 PAL, Protein AR/PRI + trimesters + lactation, Macro ranges, 14 vitamins AR/PRI/AI, 13 minerals AR/PRI/AI + ULs (2025 v11 consolidated). **First source using `dietary_context`** for Zinc × 4 phytate tiers. Iron F premenopausal/postmenopausal split. Niacin form-specific ULs. Missing: Sodium/Chloride (2019 updates), Chromium. |
| ✅ | 🆓 | `nih-dri` | NIH/NAM DRI | USA + Canada (harmonized) | 2019 | Strong (1,764 rows). Vitamins+Minerals RDA/AI/EAR, Macros, ULs, Sodium CDRR, AMDR ranges. Protein EAR computed from g/kg × NIH reference weights. |
| ✅ | 🆓 | `mhlw-2020` | MHLW DRI | Japan | 2020 | Full (1,729 rows). Energy × 3 PAL, Protein EAR/RDA/AI, 13 vitamins (EAR/RDA/AI/UL + Niacin form-split UL), 13 minerals (EAR/RDA/AI/UL + Iron menstruating split), Macros (Omega-6/3 AI, Fiber DG, Sodium CDRR). 2025 English edition pending. |
| ✅ | 🆓 | `cns-2023` | CNS (Chinese Nutrition Society) DRIs | China | 2023 | Full (2,124 rows). Most comprehensive coverage yet — all value types (EAR/RNI/AI/UL/AMDR/PI-NCD→CDRR). 14 vitamins + 15 minerals + macros + water. Pregnancy 3-trimester split. Source: official 655-page Chinese book, Appendix 3 tables (pages 628-639). Energy at PAL II only. PI-NCD first Chinese disease-prevention intake (K, Na, Vit C). Added Sugars CDRR 10% + ≤50g/d. Vit A in RAE. Iron F 50-64 stored postmeno=10 (menstruating 18 documented). **Known limitation**: Pregnancy/lactation values stored as source-format increments not Nutri-standard absolute (Folate preg T1 row = 200 increment over 400 base should read as 600; future cleanup planned). |
| ✅ | 🆓 | `sacn-rni` | COMA / SACN | UK | 1991 + updates | Strong (586 rows). COMA 1991 baseline (vitamins/minerals/protein RNI; child + sex-split adult + preg/lact) + SACN updates: Salt 2003 (Sodium CDRR), Energy 2011 (EARs by single-year child + 7 adult bands), Carbs/Fibre 2015 (Carb AMDR 50%, Free sugars CDRR 5%, Fibre RDA 30 g AOAC), Vitamin D 2016 (10 µg from age 4). Iron 14.8 mg menstruating-female RNI flagged with supplement-advised note. Phosphorus = Calcium in molar terms. Adult protein derived from COMA Table 5.4 (g/kg × ref body weight). Vitamin K, Pantothenic Acid, Biotin, Mn, Mo, Cr, F (Safe Intakes only) deferred until full COMA Report 41 PDF acquired. |
| ✅ | 🆓 | `nhmrc-nrv` | NHMRC / NZ MoH | Australia + NZ | 2006 + 2017 updates | Full (1,764 rows). Adopts IOM/NIH framework. All value types (AI/EAR/RDI→RDA/UL/EER→EAR/SDT). 22 demographics (16 + 3 preg-by-age + 3 lact-by-age). Infants 1-24 mo single-month EER. Children 3-18 y single-year buckets at PAL 1.6. Adults 4 bands × 2 sexes. Sodium 2017 update: AI range 460-920 (midpoint 690), UL 2300, SDT 2000. Fluoride 2017 update for 0-8 y. Calcium 9-13 y stored as upper-bound (growth recommendation). Mg UL = supplemental only. Folate UL = folic acid. Niacin UL = nicotinic acid form. B6 UL = pyridoxine. |
| ⬜ | 🔓 | `dach` | DGE/ÖGE/SGE | DE/AT/CH | 3rd ed. 2025 | Paid loose-leaf binder — €69 + shipping via DGE-Medienservice. Student discount 30%. Web "Referenzwerte-Tool" is free summary but demographic breakdown limited. |
| ✅ | 🔓 | `icmr-2020` | ICMR-NIN RDA | India | 2020 | Partial (126 rows; 6-page free brief note). Full book **~₹400-500 (~$5-6 USD)** via Amazon.in (ASIN 8194917514) would 5x this. First ICMR edition with EARs + ULs. Activity levels. |
| ✅ | 🆓 | `kdri-2020` | MOHW / KNS | Korea | 2020 + 2021 errata | Full (2,094 rows). Published English summary tables (Book 1 Appendix 2). IOM framework: EAR/RNI→RDA/AI/UL/EER→EAR/AMDR/CDRR. First Korean source with CDRR (Sodium 2,300 mg, Added Sugars 10% energy). 24 demographics (2 infants + 2 unisex children + 9 M + 9 F + 1 pregnancy + 1 lactation). Errata 4 (2021-11-04) applied: Carb pregnancy RNI 175 (was 180), lactation 210 (was 215). Niacin UL = nicotinic acid form (nicotinamide form-split documented). Mg UL = supplemental only. Folate UL = folic acid form only. Amino acids skipped (Nutri tracks Protein only). |
| ✅ | 🆓 | `taiwan-dri-8` | Taiwan HPA DRI (8th ed.) | Taiwan | 2020 promulgated, 2023 book | Strong (1,330 rows). Chinese-language book; summary tables at book pages 718-724. 12 age bands × M/F split at 10歲+; pregnancy split into 3 trimesters (stored as PREGNANT_T1/T2/T3); single lactation. Value types: EAR/RDA/AI/UL/AMDR/CDRR. Only CDRR for Sodium (no RDA/AI ≥1y). Vitamin A uses **Retinol Equivalent (RE)** not RAE — stored in RAE compound with caveat. Energy + Fiber stored at 稍低 (light, PAL ~1.45) activity = MODERATE. Water chapter deferred (omitted in 8th edition). Vitamin B6 RDA deferred (summary-table column ambiguity; chapter-level extraction pending). Amino acids not tracked by Taiwan DRI. |
| ✅ | 🆓 | `russia-mr-2021` | Rospotrebnadzor MR 2.3.1.0253-21 | Russia | 2021 | Strong (936 rows). Russian DRIs approved 2021-07-22 replacing 2008 version. **Unique 4-activity-level macros** (КФА 1.4/1.6/1.9/2.2 → SEDENTARY/MODERATE/ACTIVE/VERY_ACTIVE) for adults 18-64; elderly at single КФА 1.7. 14 vitamins + 15 minerals. **Iron 18 mg/d for ALL adult women** (unique — no post-menopausal reduction). Vit D 20 µg for elderly 65+ (higher than most sources). Sodium 1300 mg/d as RDA (not CDRR). Added Sugars CDRR ≤10%. Vit A in RE (not RAE). Extracted via WebFetch from endoexpert.ru consolidated article; gov URLs timed out. |
| ✅ | 🆓 | `aesan-2019` | AESAN Comité Científico | Spain | 2019 | Strong (808 rows). AESAN-2019-003 approved 22 May 2019 (replaces FESNAD 2010). 13 vitamins + 15 minerals + fiber. Methodology: harmonization algorithm (mode/median/mean) across international references. Vit D tiered: 10/12.5/15 µg young/mid/elderly. Fluoride 0.25 mg for 0-6 mo (higher than WHO). Iron F 20-49 = 18 mg menstruating; F 50+ = 9 mg. Sodium 1,500 mg EFSA-aligned. **New SPAIN region enum** added. Macros (energy/protein/fat AMDR/carb/water) Tables 1-5 adopt EFSA 2017 directly — not seeded to avoid duplication with existing EU source. |
| ✅ | 🆓 | `who-fao` | WHO/FAO Expert Consultation | Global | 2004 (2nd ed.) | Partial (367 rows). RNIs only — no EAR, UL, or AMDR. 13 vitamins + 6 minerals (Ca/Mg/Se/Zn/Fe/I). Iron at 15% bioavailability (mixed omnivorous); zinc at moderate. Iron+Iodine 10-18 split at 10-14/15-18. Pregnancy trimester split for Ca (T3 only), Fe, Zn, Se. Lactation split 0-6/7-12 for Fe, Zn, Se. Vitamin A uses RE not RAE (caveat stored). Not covered: Phosphorus, Sodium/Potassium/Chloride, Cu/Cr/Mn/Mo/F, Protein, Energy, macros, Choline, Water. Extracted from FAO appendix https://www.fao.org/4/y2809e/y2809e0o.htm |

### Tier 2 — own publication, but largely cites Tier 1

**Rationale for prioritizing Tier 2:** Not for new science (T2 mostly cites WHO/FAO + IOM/EFSA) but for **population fairness**. SEA Tier 2s pull demographic averages toward smaller body weights, lower iron bioavailability (5-10% vs Western 18%), equatorial Vit D, and goiter-endemic iodine. Sourcing 4 SEA authorities to cover ~600M unrepresented people.

| Status | Access | Slug | Authority | Region | Version | Priority / Coverage |
|--------|--------|------|-----------|--------|---------|----------------------|
| ✅ | 🆓 | `hpb-singapore` | Singapore HPB / MOH | Singapore | 2012 | seeded — Partial (404 rows). 10 vitamins + 2 minerals (Ca, Fe) + Energy at 3 PAL levels. Vit D 2.5 µg for ages 7-65 (notably low, equatorial sun-reliance). Iron F 60+ = 8 mg (unusual drop). Iron M 16-18 = 6 mg anomaly (post-growth-spurt). Iron Lact 0-6 = 9 mg (menses suppression). **New SINGAPORE region enum** added via ALTER TYPE. Not covered: P, K, Na, Mg, Zn, I, Se, Cu, Vit E/K/Pantothenic/Biotin/Choline, macros. |
| 🟡 | 🆓 | `nccfn-2017` | NCCFN RNI | Malaysia | 2017 | **P1 — IN PROGRESS.** Most rigorous SEA T2; closest to T1 quality. Multi-ethnic Malay/Chinese/Indian reference body weights. |
| ⬜ | 🆓 | `akg-2019` | Kemenkes AKG (Permenkes No. 28) | Indonesia | 2019 | **P2.** ~280M population. Regulatory teeth — AKG is the legal reference for Indonesian food labels. |
| ⬜ | 🆓 | `pdri-2015` | FNRI PDRI | Philippines | 2015 | **P3.** ~110M population. Well-documented body-weight adjustments; rice-based AMDR; iron at low bioavailability. |
| ⬜ | 🆓 | `vietnam-rni-2016` | Vietnam RNI | Vietnam | 2016 | **P4.** Most derivative of the four (cites WHO/FAO directly); completes mainland SEA coverage. |
| ⏭️ | 🆓 | `moph-thailand` | MOPH RDI (Notification 445) | Thailand | — | **Skip.** Likely flat regulatory values without age+sex demographics; would fail demographic-granularity gate. Re-evaluate only after running compound-name check on a representative table. |
| ⏭️ | 🆓 | `izz-poland` | IŻŻ | Poland | latest | **Skip.** Europe already saturated by EFSA + NNR + LARN + AESAN + (eventually) DACH. Marginal scientific gain. |

### Tier 3 — derivative / older (low priority)

All free. Skip unless targeting that specific country with low other coverage.

| Slug | Authority | Region | Note |
|------|-----------|--------|------|
| `anvisa-idr` | ANVISA RDC 269/2005 | Brazil | Based on 1989 RDA (outdated) |
| `caa-1387` | Código Alimentario Argentino | Argentina | Cites FAO/WHO + IOM |
| `moh-israel` | MoH Israel | Israel | Cites WHO |
| `fbdg-sa` | FBDG | South Africa | Derivative |

## Paid sources — complete unlock map (confirmed 2026-04-20)

All remaining Tier 1 paid options. Pricing verified via publisher pages.

| Priority | Source | Region | Cost | What it unlocks | Where to buy |
|---|---|---|---|---|---|
| 1 | **ICMR 2020 book** | India | ~₹400-500 (≈ $5-6 USD) | Upgrade current 126 rows (6-page brief) → ~600+ rows with ULs, all vitamins/minerals at full demographic granularity. Biggest ROI per euro. | [Amazon.in](https://www.amazon.in/Nutrient-Requirements-Recommended-Allowances-Estimated/dp/8194917514), or direct from NIN Hyderabad |
| 2 | **DGE DACH Ordner (3rd ed. 2025)** | DE/AT/CH | €69 + shipping | NEW source — covers ~100M Germans/Austrians/Swiss. Loose-leaf ring binder format, latest revision Sept 2025 with updated Iodine + Vitamin E. Student discount 30% available. | [DGE-Medienservice](https://www.dge-medienservice.de/ordner-referenzwerte-fur-die-nahrstoffzufuhr.html) |
| 3 | **LARN V 2024** | Italy | €80.75 | Upgrade current 616 rows (2014 PRI/AI only) → 2024 science incl. SDT + ULs. 804 pages, published June 2024. | [Biomedia](https://www.biomediashop.net/) · [IBS](https://www.ibs.it/larn-livelli-di-assunzione-di-libro-vari/e/9788886154765) · [Amazon.it](https://www.amazon.it/Assunzione-Riferimento-Nutrienti-popolazione-italiana/dp/8886154763) |

**Total to complete Tier 1 at highest fidelity: ~€155 / ~$165 USD** (€69 DACH + €80.75 LARN + ~₹500 ICMR).

**ROI ranking:**
1. **ICMR** — cheapest + biggest row uplift (500+ new rows for ~$5)
2. **DACH** — biggest demographic uplift (new population ~100M, no current source)
3. **LARN V** — incremental refresh of already-seeded 2014 (lowest net gain)

**All other 12 Tier 1 sources are 🆓 fully free:**
- NNR 2023 (Nordic) — open-access PDF
- EFSA DRV — free via EFSA Journal + DRV Finder
- NIH DRI — free via NAM
- MHLW Japan — free via MHLW website
- CNS China 2023 — free (PDF available; we have full 655-pg book)
- SACN UK — free via gov.uk
- NHMRC AU/NZ — free via nhmrc.gov.au
- KDRI Korea — free via MOHW
- Taiwan HPA — free via hpa.gov.tw
- Russia MR — free via Rospotrebnadzor
- AESAN Spain — free via aesan.gob.es
- WHO/FAO — free via FAO/WHO IRIS

## Current state

**14 of 15 Tier 1 sources + 1 Tier 2 seeded. Total: 16,864 scientific rows across 15 regions.**
AESAN Spain closes the Iberian/Mediterranean gap. Only DACH remaining in Tier 1 (paid).

## Next candidates (priority order)

1. **NCCFN Malaysia 2017** — Tier 2 P1 (IN PROGRESS) — opens SEA coverage
2. **AKG Indonesia 2019** — Tier 2 P2 — 280M population, regulatory weight
3. **PDRI Philippines 2015** — Tier 2 P3 — 110M population
4. **Vietnam RNI 2016** — Tier 2 P4 — completes mainland SEA
5. **DACH** (DE/AT/CH) — last remaining Tier 1, paid ~€69 — defer until paid sources are tackled together (with ICMR full book + LARN V)

**Skipped:** MOPH Thailand (likely flat values), IŻŻ Poland (Europe saturated). See Tier 2 table for rationale.

Done recently: NNR 2023 ✅ · LARN 2014 ✅ · ICMR 2020 ✅ · NIH DRI ✅ · EFSA DRV ✅ · MHLW Japan ✅ · SACN UK ✅ · NHMRC AU/NZ ✅ · KDRI Korea ✅ · Taiwan HPA ✅ · WHO/FAO ✅ · Russia MR ✅ · CNS China ✅ · Singapore HPB ✅ · AESAN Spain ✅

Principle: prioritize Tier 1 sources with demographic granularity. Regulatory flat-value sources are not stored.
