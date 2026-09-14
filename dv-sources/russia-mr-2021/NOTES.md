# Russia — Source notes

## Authority
- **Роспотребнадзор** (Rospotrebnadzor / Federal Service for Supervision of Consumer Protection and Human Welfare)
- **МР 2.3.1.0253-21** — Methodological Recommendations: "Нормы физиологических потребностей в энергии и пищевых веществах для различных групп населения Российской Федерации" (Norms of physiological needs for energy and nutrients for various population groups of the Russian Federation)
- Approved: 22 July 2021 (replaces МР 2.3.1.2432-08)

## Source material
- Primary PDF URLs (Rospotrebnadzor + ion.ru) timed out from this environment.
- Extracted via WebFetch from `https://endoexpert.ru/stati/metodicheskie-rekomendatsii-mr-2-3-1-0253-21...` (consolidated Russian reproduction with full tables).
- Cross-checked against Garant.ru and CNTD summaries.

## Region code
**RUSSIA** (already in source_region_enum)

## DRI framework
Russia uses a single "рекомендуемое потребление" (recommended intake) level — roughly equivalent to RDA. No EAR/UL published systematically in this document (a few ULs referenced for specific minerals).

- **"Рекомендуемое потребление"** → Nutri `RDA`
- **"Адекватный уровень потребления"** (Adequate intake) → Nutri `AI` (for cobalt, fluorine, silicon, vanadium, fiber)
- **Added sugars <10% energy** → `CDRR`

## Native structure
- **Children**: 0-6 mo, 6-12 mo, 1-3 y, 3-7 y, 7-11 y, M/F 11-14 y, M/F 14-18 y
- **Adults**: M/F 18-29, 30-44, 45-64 (with 4 activity levels each) + 65-74, 75+ (single activity)
- **Pregnancy** (single row, increments to non-pregnant F 18-29 base)
- **Lactation** (single row, increments)

### Activity levels (КФА — коэффициент физической активности)
- **КФА 1.4** — mental workers (sedentary) → SEDENTARY
- **КФА 1.6** — light physical labor → MODERATE
- **КФА 1.9** — moderate physical labor → ACTIVE
- **КФА 2.2** — heavy physical labor → VERY_ACTIVE
- **КФА 1.7** — elderly 65+ (single level) → MODERATE

## Special cases

### 1. Energy/protein/fat/carb are activity-dependent
All 4 macros scale with KFA. Stored at 4 activity levels for adults 18-64, single MODERATE for 65+.

### 2. Children energy published as ranges
E.g. "1-3 y: 1300-1500 kcal" → split by age (1-2 y = 1300, 2-3 y = 1500). Simplification: store midpoint with note. For cleaner data, we use midpoint (1400 for 1-3y, 1650 for 3-7y, 1950 for 7-11y).

### 3. Vitamins/minerals in children also sometimes as ranges
Treat lower bound as younger in bucket, upper as older. Store midpoint with note for clarity.

### 4. 11-14 y and 14-18 y M/F splits
Source gives ranges — upper=M, lower=F for most. E.g. "Iron 12-18" → F 18, M 12.

### 5. Infant 0-12 mo ranges
Split: 0-6 mo lower; 6-12 mo upper.

### 6. Russia has unique minerals
- **Cobalt** AI: 10 µg (not tracked in most other sources)
- **Silicon** AI: 30 mg
- **Vanadium** AI: 15 µg
- **Chromium**: 40 µg RDA

### 7. Vitamin A in RE (Retinol Equivalent)
Not RAE. Store in `Vitamin A (RAE)` with caveat.

### 8. Sodium recommendation
1300 mg/d ("recommended" not CDRR — Russia's unique approach)

## Compounds covered (20+)
**Vitamins (14):** C, B1, B2, B6, Niacin, B12, Folate, Pantothenic Acid, Biotin, A, Beta-carotene, D, E, K
**Macro-minerals:** Ca, P, Mg, K, Na, Cl
**Trace minerals:** Fe, Zn, I, Cu, Mn, Mo, Se, Cr, F, Co, Si, V
**Macros:** Protein, Fat, Carbohydrate, Fiber, Energy

## Estimated rows
- Adults (3 bands × 2 sexes × 4 activities × ~5 macros) + elderly (2 × 2 × 1 × 5) = 140 macro rows
- Vitamins (~14 × ~12 age-sex buckets) = ~170
- Minerals (~18 × ~12) = ~220
- Preg/lact ~30
- Total estimate: **~550-700 rows**
