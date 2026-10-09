# Heavy metals: which bodies publish a limit, and which of those we can use

Research pass, 2026-10-08, prompted by Jens noticing that only mercury, cadmium and nickel show a
bar on the Heavy Metals card while the other six read "No DV".

> **Update 2026-10-08, later the same day:** aluminium and tin have since been verified against the
> bodies' own documents and **stored**. Antimony is verified but **not** stored — see § 6. The rest of
> this file stands as written.

**Status of every number below: NOT YET ADOPTED.** Only the rows marked ✅ VERIFIED were read from
the body's own document in this session. Everything else is a lead, taken from a secondary source,
and must be transcribed from the primary document and put through `npm run check:printed` before it
goes anywhere near the database — the same bar as the other ten bodies. The point of this file is to
decide *what to go and get*, not to be a source itself.

---

## 1. The structural problem, which matters more than any single number

Not every published "safe level" answers the question a food bar asks. Before adopting a body, three
filters apply, and most candidate values fail at least one:

| Filter | Why | What it rules out |
|---|---|---|
| **Oral, from food** | The bar measures what someone ate | Inhalation values (most ATSDR and EPA metal entries are inhalation), occupational limits |
| **Chronic** | A daily target is a long-run average | ATSDR's *acute* and *intermediate* MRLs. ATSDR publishes several durations per metal and the acute one is often 10–100× the chronic — using the wrong row would be a silent 100× error of exactly the kind §6 warns about |
| **Whole diet, per body weight** | Must convert to an amount a person ate | WHO drinking-water guidelines (µg/L of water, not of diet), Codex and EU Reg. 2023/915 maximum levels (mg/kg **of food** — a limit on the producer, not on the eater) |

That last one is worth stating plainly: **maximum levels in food are not daily values.** Codex and the
EU set plenty of them for lead, cadmium, tin and mercury, and they are tempting because they are
numerous and authoritative. They cap concentration in a product, not intake by a person. They cannot
be compared with a day's eating and must never be loaded as if they could.

---

## 2. The bodies

| Body | What it publishes | Usable? | Notes |
|---|---|---|---|
| **JECFA** (FAO/WHO) | PTWI, PTMI, PTDI | ✅ Yes — already a source (`WHO_FAO`) | The reference point for contaminants in food worldwide. Withdraws values when it finds no threshold, which is itself information |
| **EFSA CONTAM** | TWI, TDI, BMDL | ✅ Yes — already a source (`EU`) | Usually the strictest of the three, and reassesses more often than JECFA |
| **US EPA IRIS** | RfD (chronic oral, mg/kg-day) | ✅ Yes — already a source (`USA_EPA`, added 2026-10-07) | Route-specific: publishes separate water and food RfDs. Many entries are decades old (cadmium's is 1989) |
| **ATSDR** (US CDC) | MRL, by route **and duration** | 🟡 Candidate — needs care | Broadest metal coverage of any single body, in one table. But acute/intermediate/chronic are mixed in one list and only the **chronic oral** row is usable. Derived for hazardous-waste-site screening, not diet |
| **WHO drinking water** | Guideline value (µg/L) + the TDI behind it | 🟡 Only the TDI | The guideline is per litre of water; the underlying TDI is per kg bw and is the usable part. Antimony's commonly cited 6 µg/kg bw/day comes from here |
| **IOM / NASEM** | UL | ✅ Already a source (`USA_CANADA`) | Only for metals that are also nutrients — nickel, manganese, copper, zinc, selenium, molybdenum. Already how nickel gets its bar |
| **Codex / EU Reg. 2023/915** | Maximum level in a food | ❌ No | Concentration caps on products. See §1 |
| **Health Canada, FSANZ, COT (UK), RIVM, BfR** | Mostly adopt JECFA or EFSA | ❌ Probably not | Would need the provenance test (`dv-sources/PROVENANCE.md`): a body that adopts another's number is not a second vote. This is exactly how 12 of our 22 sources came to be excluded from targets |

---

## 3. Coverage per metal

`foods` = how many of our 107 foods carry a value for it today.

| Metal | foods | JECFA | EFSA | EPA IRIS | ATSDR chronic oral | Status |
|---|---|---|---|---|---|---|
| **Cadmium** | 20 | PTMI 25 µg/kg/mo ✅ | TWI 2.5 µg/kg/wk ✅ | RfD 1 µg/kg-day (food) ✅ | 0.1 µg/kg/day | **DONE** — 3 bodies stored |
| **Mercury** | 9 | MeHg PTWI 1.6 µg/kg/wk ✅ | MeHg TWI 1.3 µg/kg/wk ✅ | — | none (data insufficient) | **DONE** — 2 bodies stored |
| **Lead** | 17 | **withdrawn** ✅ | **withdrawn**, BMDL only ✅ | — | none derived | **Correctly empty.** No threshold exists. A BMDL could be stored as a reference point (`referencePoints` is built and empty) |
| **Arsenic (inorg.)** | 20 | **withdrawn** ✅ | BMDL only ✅ | RfD 0.3 µg/kg-day? | 0.3 µg/kg/day (chronic oral) | **Correctly empty** as a limit. Same BMDL question as lead |
| **Aluminum** | 16 | PTWI 2 mg/kg/wk 🔍 | TWI 1 mg/kg/wk 🔍 | — | **1 mg/kg/day** ✅ | **BEST CANDIDATE.** 3 bodies, 16 foods. They span 7× (EFSA 0.14, JECFA 0.29, ATSDR 1.0 mg/kg/day) — exactly what strictest-wins is for |
| **Tin (inorg.)** | 5 | PTWI 14 mg/kg/wk 🔍 | — | — | 0.3 mg/kg/day (intermediate — **not** chronic) | Worth getting; JECFA value is old (33rd mtg) and was retained unreviewed |
| **Antimony** | 3 | — | SML only, from WHO's TDI | — | 🔍 | WHO drinking-water TDI 6 µg/kg bw/day 🔍 is the only real candidate |
| **Uranium** | **0** | — | TDI exists, value unconfirmed 🔍 | — | inhalation only | **Skip.** No food data, so a target could never render |
| **Nickel** | 17 | — | **TDI 13 µg/kg bw/day (2020)** 🔍 | RfD 20 µg/kg-day 🔍 | 0.2–9 µg/kg/day (intermediate) | Already has IOM's UL 1 mg. EFSA's 2020 TDI would be a **second body** (13 µg/kg × 70 kg = 0.91 mg, close to IOM's 1 mg) |
| **Chromium (VI)** | — | — | TDI 0.3 mg/kg/day for Cr(III) 🔍 | — | 0.005 mg/kg/day (intermediate) | Our compound is total chromium, a **nutrient**. Cr(III) and Cr(VI) are different substances — same split problem as mercury, and we cannot tell them apart |

✅ read from the body's own document · 🔍 secondary source, needs primary verification

---

## 4. What this suggests

1. **Aluminium first.** Three independent bodies, 16 foods, and a 7× disagreement that the
   strictest-wins rule (added 2026-10-07) exists precisely to resolve. Primary sources needed: WHO
   Food Additives Series 65 (JECFA 74th, 2011), EFSA's 2008 opinion, ATSDR's aluminium profile.
2. **Nickel second** — it already has a bar from IOM's UL, so EFSA's 2020 TDI would make it a
   two-body value rather than a one-body one, and `excluded` would start showing a real comparison.
3. **Tin and antimony** are cheap and would finish the card, though both rest on a single body.
4. **Lead and arsenic stay empty as limits** — that is the committees' own conclusion, not a gap. The
   open question is different: both have a **BMDL**, and `ResolvedBar.referencePoints` was built for
   exactly that and currently holds nothing. Storing them would turn two blank rows into "no safe
   threshold; here is the reference point" — more honest than either a bar or silence.
5. **Uranium: skip** until there is food data.
6. **ATSDR is worth adopting as a body**, but only its chronic oral rows, and its provenance needs
   checking first — if it simply adopts EPA's or JECFA's numbers it is not an independent vote.

## 5. Before any of this is stored

Per `dv-sources/GUIDE.md` and the provenance audit: each body needs a `SOURCE_PROVENANCE` entry with
a quote and a locator, each value transcribed from the body's own printed document, and a row added to
`scripts/dv-verify/check-against-printed.ts`. The contaminant types already exist in the enum
(`TWI`/`TDI`/`PTMI`/`RfD`/`BMDL`) and `CONTAMINANT_CEILINGS` already resolves them by strictest, so no
schema work is expected — only transcription and verification.


---

## 6. Run state after the first pass (2026-10-08)

| Metal | Outcome |
|---|---|
| **Aluminum** | ✅ **STORED.** JECFA PTWI **2 mg/kg bw/week** (74th meeting 2011, read from the committee's own Summary and Conclusions) and EFSA TWI **1 mg/kg bw/week** (EFSA Journal 2008;6(7):754). EFSA wins on strictest: **70 mg/week at 70 kg**. Expect bars over 100 % — EFSA says in the same opinion that intakes "may exceed the TWI in a significant part of the European population" |
| **Tin** | ✅ **STORED, with the committee's own doubt attached.** JECFA PTWI **14 mg/kg bw/week** (set at the 33rd meeting, reviewed and maintained at the 64th, TRS 930). But the same report says "the basis for the PMTDI and PTWI ... was unclear and these values may have been derived from intakes associated with acute effects" and asks for a reassessment. Stored because it is what JECFA currently publishes, not because it is well founded; the note on the value carries the quote |
| **Antimony** | 🟡 **VERIFIED, NOT STORED.** WHO's own fact sheet gives a **TDI of 6 µg/kg bw/day**, "based on a NOAEL of 6.0 mg/kg body weight per day ... using an uncertainty factor of 1000". The TDI is the **whole-diet** figure — the 20 µg/L drinking-water guideline is derived from it by allocating only 10 % to water — so it is the right shape for a food bar. Two reasons it is not in: (1) it comes from WHO's **Guidelines for Drinking-water Quality**, a different expert process from JECFA, so it needs its own source region and provenance entry rather than being filed under `WHO_FAO` — the same work `USA_EPA` needed; (2) the assessment is from **2003**, WHO notes the value "could be highly conservative", and a UK COT draft (April 2025, explicitly not citable) proposes 20 µg/kg bw/day instead. Worth doing, but it is a decision about adding a body, not a transcription |
| **Lead, Arsenic** | Unchanged — no limit exists, by the committees' own conclusion |
| **Uranium** | Unchanged — skipped, no food data |
| **Nickel** | Unchanged — still IOM's UL alone. EFSA's 2020 TDI (13 µg/kg bw/day 🔍) would make it two bodies |

### What this pass taught about sourcing

**inchem.org is a stale archive and cost real time twice.** It still serves aluminium's 1988 PTWI of
7 mg/kg bw — superseded in 2006 (1 mg/kg) and again in 2011 (2 mg/kg) — and it misled the cadmium work
earlier in the same session. Use the committee's own meeting reports (`iris.who.int`, the TRS series)
or WHO's live JECFA database. Both aluminium and tin here were read from the primary PDFs, which are
snapshotted under `dv-sources/jecfa-contaminants/source/`.


---

## 7. The ATSDR list, curated (2026-10-09) — FOR DISCUSSION, NOTHING ADOPTED

Source: ATSDR *Minimal Risk Levels*, July 2025 table (484 MRLs: 175 inhalation, 305 oral, 4 external
radiation), read as a primary document. Snapshot of the metal rows:
`dv-sources/jecfa-contaminants/source/atsdr-mrl-2025-aluminum.txt` holds aluminium; the full table was
parsed from the published PDF.

**The table's own duration definitions, which decide everything below:**

> "For Duration, Acute = 1 to 14 days, Intermediate = 15 to 364 days, and Chronic = 1 year or longer"

Only **Chronic** answers the question a daily value asks. An Intermediate MRL is a limit for up to a
year of exposure and is typically several times looser; using one as a daily target would be wrong in
a way nothing downstream could detect.

### Every row ATSDR has for our nine metals

| Metal | Oral MRLs ATSDR publishes | Usable (chronic oral)? |
|---|---|---|
| **Aluminum** | Int. 1 mg/kg/day (UF 30) · **Chr. 1 mg/kg/day** (UF 90, neurological) | ✅ yes |
| **Arsenic** | Acute 0.005 mg/kg/day (UF 10) · **Chr. 0.0003 mg/kg/day** (UF 3, dermal) | ✅ yes |
| **Cadmium** | Int. 0.0005 mg/kg/day (UF 100) · **Chr. 0.0001 mg/kg/day** (UF 3, renal) | ✅ yes |
| **Tin, inorganic** | Int. 0.3 mg/kg/day only | ❌ no chronic value |
| **Uranium, soluble salts** | Acute 0.002 · Int. 0.0002 mg/kg/day | ❌ no chronic value |
| **Mercury** | none — inhalation only (Chr. 0.3 µg/m³) | ❌ nothing oral |
| **Nickel** | none — inhalation only | ❌ nothing oral |
| **Lead** | **no MRL at all**, any route | ❌ — and consistent with the other bodies |
| **Antimony** | **no MRL at all**, any route | ❌ |

So of nine metals, ATSDR offers exactly **three** usable values. Two of them force a decision.

### Decision 1 — cadmium would get **3.6× stricter**

Everything converted to a per-day, per-kg basis:

| Body | Cadmium, per kg per day |
|---|---|
| **ATSDR** | **0.1 µg** ← strictest by far |
| EFSA | 0.357 µg |
| JECFA | 0.833 µg |
| US EPA | 1.0 µg |

Under the strictest-wins rule ATSDR would take over, and the displayed limit would fall from
**175 µg/week to about 49 µg/week** at 70 kg. Every cadmium bar in the app roughly quadruples.

Points for: it is a chronic oral value from a body that derived it itself, and strictest-wins exists
precisely so the most protective published figure governs. Points against: it is the one value that
would change what users already see, and its uncertainty factor is 3 against EFSA's much larger
margins — a low factor on a low number means ATSDR read the underlying study as closer to certain,
which is a judgement, not a measurement.

### Decision 2 — arsenic would get a bar where two bodies refused to set one

ATSDR publishes a chronic oral MRL of **0.3 µg/kg/day** (dermal endpoint, UF 3). JECFA withdrew its
arsenic PTWI and EFSA publishes only a BMDL, both because **no threshold could be identified**.

This is not a gap ATSDR fills — it is a disagreement about whether a threshold exists at all. Adding
it would give arsenic a reassuring percentage bar that two other bodies have explicitly declined to
provide. That is a judgement about what the app asserts, not a sourcing question, which is why it is
here rather than in the code.

### Decision 3 — aluminium changes nothing

ATSDR's 1 mg/kg/day is **7× looser** than EFSA's 0.143 and 3.5× looser than JECFA's 0.286. It would be
excluded as the loosest and the displayed value would not move. Worth adding only for the honesty of
showing a third body in `excluded`.

### Before any of it: is ATSDR an independent body?

Unchecked. MRLs come from ATSDR's own Toxicological Profiles and look like independent derivations —
its cadmium uncertainty factor of 3 differs from EPA's composite 10, and its endpoints differ — but
`dv-sources/PROVENANCE.md` requires this to be established from the documents, not inferred. If ATSDR
turns out to adapt EPA's work it is not a second vote, and 12 of our 22 nutrient sources were excluded
from targets on exactly that test.
