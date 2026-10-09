# ATSDR Minimal Risk Levels

Added 2026-10-09. Region `USA_ATSDR`. Source: the July 2025 MRL table, read as a primary document
(`source/atsdr-mrl-july-2025-metals.txt`).

## Why only chronic oral

The table's own footer defines the durations:

> "For Duration, Acute = 1 to 14 days, Intermediate = 15 to 364 days, and Chronic = 1 year or longer"

An intermediate MRL caps exposure over up to a year and is usually several times looser than the
chronic one. Used as a daily value it would be wrong in a way nothing downstream could catch, which is
the shape of error §6 of CLAUDE.md exists to prevent. So only `Oral` + `Chr.` rows are transcribed.

That alone removes most of the table's metal coverage:

| Metal | ATSDR has | Stored |
|---|---|---|
| Cadmium | Int. 0.0005 · **Chr. 0.0001 mg/kg/day** | ✅ |
| Aluminum | Int. 1 · **Chr. 1 mg/kg/day** | ✅ |
| Arsenic | Acute 0.005 · **Chr. 0.0003 mg/kg/day** | ❌ see below |
| Tin, inorganic | Int. 0.3 mg/kg/day only | ❌ no chronic row |
| Uranium | Acute 0.002 · Int. 0.0002 mg/kg/day | ❌ no chronic row |
| Mercury, Nickel | inhalation only | ❌ nothing oral |
| Lead, Antimony | nothing, any route | ❌ |

## What it changed

**Cadmium.** ATSDR's 0.1 µg/kg bw per day is the strictest of four bodies and now governs:

| Body | per kg per day | at 70 kg |
|---|---|---|
| **ATSDR** | **0.1 µg** | **7 µg/day** ← used |
| EFSA | 0.357 µg | 25 µg/day |
| JECFA | 0.833 µg | 58 µg/day |
| US EPA | 1.0 µg | 70 µg/day |

The displayed limit fell from 175 µg/week to 49 µg/week. The other three are in `excluded` with their
own per-day figures, so the disagreement is visible rather than silently resolved.

**Aluminium.** No change — ATSDR's 1 mg/kg/day is the loosest of three and is excluded. Stored anyway
so the spread is on the record: EFSA 0.143, JECFA 0.286, ATSDR 1.0 mg/kg/day, a sevenfold range.

## Arsenic: usable, and deliberately not used

ATSDR publishes a chronic oral MRL of 0.0003 mg/kg/day — 0.3 µg/kg bw per day, 21 µg/day at 70 kg.
It is the only body with an arsenic limit at all, since JECFA withdrew its PTWI and EFSA publishes only
a BMDL. It is not stored, for a reason that has nothing to do with the number's quality.

**The limit is for INORGANIC arsenic. Our `Arsenic` compound is TOTAL arsenic.**

This looks like the mercury case and behaves in the opposite way. For mercury, the limited form
(methylmercury) is most of the total in the foods that matter, so reading the total against it
over-states slightly and safely. For arsenic, the limited form is a few percent of the total in
seafood — the rest is arsenobetaine, which is excreted unchanged — and seafood is exactly where our
arsenic values are largest:

| Food | Total arsenic, µg/100 g | Would read against 21 µg/day |
|---|---|---|
| Oyster | 200 | **952 %** |
| Salmon, wild | 126 | **601 %** |
| Tuna, canned | 76 | **362 %** |

Directionally conservative, numerically misinformation: the actual inorganic exposure from those foods
is a small fraction of what the bar would claim. A user would be told that a portion of salmon used six
times their daily arsenic allowance.

Two honest ways forward, neither taken without a decision:

1. **Store it against `Inorganic Arsenic`** (the compound exists, with 0 foods today). Correct, shows
   nothing until inorganic data is loaded, and makes the limit ready for when it is.
2. **Store it against total arsenic with the over-statement labelled on the bar.** Shows something
   immediately, at the cost of numbers that are wrong by one to two orders of magnitude for fish.

The same split exists for mercury and was resolved the other way there, because the magnitudes differed
— see `dv-sources/jecfa-contaminants/NOTES.md`.
