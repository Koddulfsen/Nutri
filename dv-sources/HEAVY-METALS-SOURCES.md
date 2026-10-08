# Heavy metals: which bodies publish a limit, and which of those we can use

Research pass, 2026-10-08, prompted by Jens noticing that only mercury, cadmium and nickel show a
bar on the Heavy Metals card while the other six read "No DV".

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
