# MHLW Japan DRI source notes

**Authority:** Ministry of Health, Labour and Welfare (MHLW), Japan
**Version used:** Dietary Reference Intakes for Japanese (2020) — English edition
**Region code:** `JAPAN`
**Source type:** `SCIENTIFIC_DRI`
**Retrieved:** 2026-04-16

## Why 2020 and not 2025

- MHLW released the 2025 edition in April 2025 (applicable FY2025-2029)
- The 2025 English version is not yet publicly available — only Japanese
- The 2020 English version (PDF) is the last comprehensive English edition and remains authoritative
- We'll upgrade to 2025 English when MHLW releases it (expected ~2026-2027)

Folder is named `mhlw-2025` as forward-looking name; currently seeds 2020 data.

## Native structure

**13 age groups** (months precision for infants):
0-5mo, 6-11mo, 1-2y, 3-5y, 6-7y, 8-9y, 10-11y, 12-14y, 15-17y, 18-29y, 30-49y, 50-64y, 65-74y, 75+y

**Value types** (Japanese naming → Nutri enum):
- EAR (Estimated Average Requirement) → `EAR`
- RDA (Recommended Dietary Allowance) → `RDA`
- AI (Adequate Intake) → `AI`
- UL (Tolerable Upper Intake Level) → `UL`
- **DG** (Dietary Goal for LRD prevention) → `AMDR` (Japan-specific: ranges/limits for preventing lifestyle-related diseases)

**Activity levels (PAL):**
- PAL I = low (sedentary, nursing home level)
- PAL II = medium (normal life, can support self)
- PAL III = high (active, outdoor work)

## Special cases

- **Energy** varies by age × sex × PAL (3 levels)
- **Iron F** has Not-menstruating / Menstruating split for ages 10-64y (like EFSA). We store menstruating as default for fertile ages
- **Sodium** published in mg/d with salt equivalent (g/d) in parens. EAR=600 mg/d adults. DG (stay-under) = <7.5 g salt/d M / <6.5 g F → ~2950 mg / 2550 mg Na
- **Niacin UL** split: nicotinamide mg (main value) and nicotinic acid mg (in parens, much lower) — stored on separate compounds
- **Magnesium UL** = 350 mg/d for supplemental intake only (not normal food)
- **Pregnancy additions** split by Early/Mid/Late stage for some nutrients (Vit A, Iron, Protein) — stored as PREGNANT_T1/T2/T3
- **Vitamin A unit** = µg RAE (same as NIH/EFSA)
- **Vitamin K** children values have M/F split from 1-2y onwards (Japan unique — others only split at puberty)

## What we seed

All value types that MHLW publishes, across all 13 age groups × 2 sexes × applicable life stages + PAL for energy.

Covered nutrients:
- Macros: Protein, Fat (via SFA+n-6+n-3), Carbohydrates, Dietary Fiber, Energy
- Vitamins: A, D, E, K, B1 (Thiamin), B2 (Riboflavin), Niacin (+Nicotinamide/Nicotinic Acid UL split), B6, B12, Folate, Pantothenic Acid, Biotin, C
- Minerals: Sodium, Potassium, Calcium, Magnesium, Phosphorus, Iron, Zinc, Copper, Manganese, Iodine, Selenium, Chromium, Molybdenum

## Source files

- `mhlw-dri-2020-en.pdf` — 44-page English DRI document (official MHLW)
- `raw-values.ts` — structured extraction (all tables)
