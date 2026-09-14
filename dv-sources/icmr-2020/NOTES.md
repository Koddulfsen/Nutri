# ICMR-NIN 2020 source notes

**Authority:** Indian Council of Medical Research — National Institute of Nutrition (ICMR-NIN)
**URL:** https://www.nin.res.in/rdabook/brief_note.pdf (free brief note — full book is commercial ₹400)
**Region code:** `INDIA`
**Source type:** `SCIENTIFIC_DRI`
**Retrieved:** 2026-04-14

## Scope of this seed

Only what's in the 6-page brief note — we **don't have the full book**:

| Covered | Not covered (book only, paywalled) |
|---|---|
| Energy (all ages × activity levels) | Vitamin E, K, Biotin, Pantothenic Acid |
| Protein EAR + RDA (all demographics) | Phosphorus, Na, K, Cl, Cu, Se, Cr, Mn, Mo, F |
| Adult micros (14 nutrients, M + F) | Child/teen values for any micro |
| EAR + RDA for adult micros | Tolerable Upper Intake Levels (ULs) |

## Value types published

- **EAR** — Estimated Average Requirement (median of requirement distribution) → stored as `EAR`
- **RDA** — Recommended Dietary Allowance (97.5th percentile) → stored as `RDA`

## Native structure

- **Adults** = single "Adult Men / Adult Women" bucket (no age subdivision beyond that). Reference weights: 65 kg M, 55 kg W.
- **Activity levels** for energy + protein: Sedentary (PAL 1.4), Moderate, Heavy.
- **Children:** 0-6m, 6-12m, 1-3y, 4-6y, 7-9y (sex-unified).
- **Teens:** 10-12y, 13-15y, 16-18y (sex-split as Boys / Girls).
- **Pregnancy:** 2nd and 3rd trimester additions (no 1st trimester adjustment).
- **Lactation:** 0-6m and 6-12m postpartum.

## Special cases

- **Vitamin D** published in IU; converted to µg (1 µg = 40 IU → 400 IU = 10 µg; 600 IU = 15 µg)
- **Folate** unit is µg DFE (Dietary Folate Equivalents) — same magnitude as µg for our purposes
- **Thiamine** spelling: ICMR uses "Thiamine" (with final e); Nutri uses "Thiamin" — map explicitly
- **Iron F (non-pregnant)** = 29 mg RDA / 15 EAR — markedly higher than Western sources (assumes menstruating; Indian dietary iron bioavailability ~8%)
- **Adult age boundary** — brief note doesn't specify geriatric cutoff; we store 216 months (18y) onward, no upper bound

## Source files

- `brief-note.pdf` — 6-page free summary PDF
- `short-report.html` — index page (not data)

## Gaps to resolve in a future pass

1. Full book (₹400) would add child/teen micros + ULs + missing nutrients
2. Dietary Guidelines for Indians 2024 (free) may have some missing pieces — gather separately
