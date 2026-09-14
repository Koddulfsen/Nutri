# NIH/NAM DRI source notes

**Authority:** US National Academies of Sciences, Engineering & Medicine (Food and Nutrition Board) — harmonized with Health Canada since 1997
**URL:** https://www.ncbi.nlm.nih.gov/books/NBK545442/ (Summary Tables — NCBI Bookshelf)
**Region code:** `USA_CANADA`
**Source type:** `SCIENTIFIC_DRI`
**Retrieved:** 2026-04-14

## Why we're seeding NIH DRI

- Replaces the legacy USA_CANADA data we deleted at the start of this pipeline (old data was not trustworthy)
- Harmonized across US + Canada since 1997 — 370M+ population coverage
- Baseline that other authorities cite
- Fully free, NCBI Bookshelf HTML tables

## Value types & notation

NCBI summary tables use a dual-notation system:
- **Bold values** = RDA (Recommended Dietary Allowance — ≥97.5% coverage)
- `*` marked values = AI (Adequate Intake — when RDA can't be derived)

Per-compound AI vs RDA breakdown (adults):
- **Always AI:** Vitamin K, Biotin, Pantothenic Acid, Choline, Chromium, Fluoride, Potassium, Sodium, Manganese, Chloride, Water, Dietary Fiber
- **RDA for 1y+, AI for infants:** Vitamin A, C, D, E, Thiamin, Riboflavin, Niacin, B6, Folate, B12, Calcium, Iron, Magnesium, Phosphorus, Selenium, Zinc, Iodine, Copper, Molybdenum, Protein, Carbohydrates
- **Infants 0-12mo:** all values are AI regardless of compound

## What we're seeding

1. **Vitamin RDA/AI** — 22 demographic groups × 14 vitamins
2. **Element (mineral) RDA/AI** — 22 demographics × 15 minerals (incl. Na, Cl)
3. **Macros** — water, carbs, fiber, protein (fat = ND, skip)
4. **Vitamin ULs** — 16 demographic groups × 8 vitamins with defined UL
5. **Element ULs** — 21 demographics × 13 minerals with defined UL (Na, K, Cr = ND)
6. **AMDR** (% of energy) — 3 age bands × carbs/protein/fat/n-6/n-3 PUFA
7. **Sodium CDRR** — 5 age bands (less granular than the other tables)

Not seeded (future pass):
- **EARs** — NCBI summary tables don't include EARs; they're in per-nutrient DRI reports
- **Saturated fat / trans fat / added sugar** AMDR — not in this summary
- **Carotenoids** UL — always "ND"

## Special cases

- **Vitamin A** unit is µg RAE (new 2001+ standard)
- **Folate** unit is µg DFE (Dietary Folate Equivalents)
- **Niacin** unit is mg NE (niacin equivalents)
- **Vitamin K** children 9-13y / 14-18y / 19-30y have separate values: 60/75/120 µg — not a uniform adult number
- **Choline UL** unit is g/d (not mg/d) — convert to mg for storage
- **Phosphorus UL** unit is g/d — convert to mg
- **Chloride UL/AI** unit is g/d — convert to mg
- **Sodium CDRR** simpler structure: 5 age bands, no sex/pregnancy split
- **Pregnancy / Lactation** split by maternal age (14-18, 19-30, 31-50) for RDA/AI; just (14-18, 19-50) for ULs
- **Chromium, Potassium, Sodium** element ULs = ND (not determined) — skip those rows

## Source files

- Tables extracted from NCBI Bookshelf via WebFetch
- Raw values stored in `raw-values.ts`
