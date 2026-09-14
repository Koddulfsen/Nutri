# EFSA DRV source notes

**Authority:** European Food Safety Authority (EFSA) — Panel on Dietetic Products, Nutrition and Allergies (NDA)
**URL:** https://www.efsa.europa.eu/sites/default/files/assets/DRV_Summary_tables_jan_17.pdf (Summary v4, Sept 2017)
**Region code:** `EU`
**Source type:** `SCIENTIFIC_DRI`
**Retrieved:** 2026-04-14

## What EFSA publishes

EFSA uses their own terminology — maps to our enum:
- **PRI** (Population Reference Intake) → `RDA`
- **AI** (Adequate Intake) → `AI`
- **AR** (Average Requirement) → `EAR`
- **RI** (Reference Intake range) → `AMDR` (for macros, % of energy)

## Native structure

EFSA's age groups **vary by compound**, unlike most other sources:
- Vitamins unisex up to 17y, then split M/F from 11y or 18y
- Calcium: 7-11mo, 1-3, 4-10, 11-17, 18-24, ≥25
- Iron: 7-11mo, 1-6, 7-11, 12-17, ≥18 (then M vs F+menstruation split)
- Zinc: age groups + 4 phytate intake tiers (LPI 300/600/900/1200 mg/d)
- Phosphorus/Potassium/Copper/Magnesium/Iodine/Fluoride/Manganese/Molybdenum/Selenium: different set again

Each compound's native age ranges are stored as-is (no forced bucketing).

## Scope of this seed

**Included:**
- Vitamin PRIs/AIs for 14 vitamins (Tables 9 + 11)
- Mineral PRIs/AIs for 13 minerals (Tables 5 + 7)
- Water AI (Table 3)
- Macro RI ranges — % of energy for fat, carbs, protein %E ranges; absolute for dietary fibre (Table 3)
- Pregnancy + Lactation additions (vitamin/mineral Tables 7, 11)

**Skipped (deferred):**
- Energy AR (Table 1) — too granular (28 yearly ages × 4 PAL levels); covered by NIH + ICMR
- Vitamin/Mineral ARs (Tables 4, 6, 8, 10) — partial compound coverage anyway
- Protein AR/PRI (Table 2) — published as g/kg bw; NIH/ICMR/NNR already provide g/d
- Thiamin/Niacin — EFSA publishes as mg/MJ ratios; can't convert to absolute without per-demographic energy (which we skipped)
- Chromium — EFSA explicitly did not set a DRV
- Sodium/Chloride — "evaluation ongoing" at time of summary (updated 2019, not in this PDF)
- ULs — EFSA publishes separately (scientific opinions per nutrient); not in this summary

## Special cases

- **Zinc LPI** (Level of Phytate Intake): 4 values per adult age for 300/600/900/1200 mg phytate/day. We store the 900 mg/d middle value (typical EU mixed diet) with `value_note` explaining LPI-dependence.
- **Iron F ≥18**: premenopausal 16 mg (covers 95% of premenopausal women), postmenopausal 11 mg. Stored as two rows split at age 51y.
- **Vitamin D**: 15 µg under minimal cutaneous synthesis assumption (winter, northern latitude). Lower in summer. Noted.
- **α-Tocopherol**: EFSA's Vitamin E equivalent, stored as Vitamin E.
- **Cobalamin**: stored as Vitamin B12.
- **Vitamin A** unit = µg RE (same as NIH µg RAE for our purposes).
- **Folate** unit = µg DFE.

## Source files

- `drv-summary-tables.pdf` — 15-page summary tables (Sept 2017 v4)
- `drv-summary-report.pdf` — 92-page narrative summary (context + methodology)
- `raw-values.ts` — extracted values ready for the seed script
