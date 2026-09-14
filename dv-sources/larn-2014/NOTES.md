# LARN 2014 source notes

**Authority:** SINU — Società Italiana di Nutrizione Umana, IV Revisione
**URL:** https://eng.sinu.it/tabelle-larn-2014/ (tables pasted into `raw-values.ts`)
**Region code:** `ITALY`
**Source type:** `SCIENTIFIC_DRI`
**Retrieved:** 2026-04-14

## Why 2014 and not 2024

LARN V (2024) is commercially published by Biomedia editore — only methodology appendices are freely available (see `dv-sources/larn-v-2024/`). LARN 2014 is the IV Revision and is freely available as HTML tables on SINU. Until we acquire the 2024 book, 2014 provides Italy coverage.

## Value types published

- **PRI** — Population Reference Intake (covers ~97.5%) → stored as `RDA`
- **AI** — Adequate Intake → stored as `AI`

LARN 2014 summary tables on the web do not reliably distinguish PRI vs AI per
nutrient, so in this first pass we treat all as `RDA`. A second pass could
reclassify based on per-nutrient chapters if we get the book.

## Native age buckets

- 6-12 mesi (infants — no 0-6 mo bucket)
- 1-3, 4-6, 7-10 anni (children, sex-unified)
- 11-14, 15-17 anni (sex-split teens)
- 18-29, 30-59, 60-74, ≥75 anni (sex-split adults — broader than NNR's 18-24/25-50)
- Gravidanza (single bucket, no trimester split)
- Allattamento

## Special cases

- **Iron F 11-14** = 10/18: 10 pre-menarche, 18 menstruating. We store 18 with `value_note` capturing the pre-menarche alternative
- **Iron F 30-59** = 18/10: 18 menstruating, 10 post-menopause. Store 18 + note
- **Sodium, Potassium, Chloride** published in grams in LARN — converted to mg
- **Vitamin D** = 20 µg for ≥75 y (aligns with NNR 2023 pattern)
- **Vitamin A** = µg RAE (Italian: µg)
- **Niacin** = mg NE (niacin equivalents)

## What's missing (compared to NNR 2023)

- **ULs** — not on the web summary tables (would need the full book)
- **EARs / provisional ARs** — not published on web
- **Macronutrients (protein, fat, carbs, fiber, energy)** — on a separate SINU page; gather later
- **Trimester-split pregnancy** — LARN uses single pregnancy bucket
- **0-6 mo infants** — not included in LARN 2014 (assumes breastfeeding)

## Source files

- `raw-values.ts` — tabular vitamin + mineral values (what the user pasted from web)

## What we haven't captured yet

Can be added as follow-ups:
- ULs (would need book access or separate SINU UL page)
- Protein / fat / carb / fiber E% ranges
- Energy requirements by age/sex/activity
