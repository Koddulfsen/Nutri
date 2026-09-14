# NHMRC NRV — Source notes

## Authority
- **National Health and Medical Research Council** (Australia) + **NZ Ministry of Health**
- *Nutrient Reference Values for Australia and New Zealand Including Recommended Dietary Intakes*, 2006
- **Updates:** Fluoride (March 2017) + Sodium (September 2017)
- ISBN: 1864962437
- License: CC BY 4.0

## Source PDF
`nutrient-refererence-dietary-intakes.pdf` (320 pages, includes 2017 updates)
Retrieved 2026-04-18. URL: https://www.nhmrc.gov.au/about-us/publications/nutrient-reference-values-australia-and-new-zealand-including-recommended-dietary-intakes

## Region code
**AU_NZ** (already in source_region_enum)

## DRV framework (NHMRC terminology → Nutri enum)
| NHMRC term | Meaning | Nutri enum |
|---|---|---|
| RDI (Recommended Dietary Intake) | 97-98% of population (= US RDA) | `RDA` |
| EAR (Estimated Average Requirement) | 50% of population | `EAR` |
| AI (Adequate Intake) | Used when RDI cannot be set | `AI` |
| UL (Upper Level of Intake) | Tolerable upper limit | `UL` |
| EER (Estimated Energy Requirement) | Energy needs at PAL | `EAR` |
| AMDR | % of energy range (adolescent + adult) | `AMDR` |
| SDT (Suggested Dietary Target) | Disease prevention target | `SDT` |
| BM | "Breast milk" annotation (UL not set, infant value derived from BM) | n/a (note only) |
| BF | "Breast milk + foods" (UL not set) | n/a |
| NP | "Not possible" (UL not set due to insufficient data) | n/a (don't insert) |
| ND | "Not determined" (sodium 2017) | n/a |

## Native age buckets (NHMRC adopted IOM/NIH framework)

### Vitamins / Minerals / Macros / Water (Tables 4-9)
- Infants: **0-6 mo**, **7-12 mo** (AI only — derived from breast milk composition)
- Children: **1-3 y**, **4-8 y** (unisex AI/EAR/RDI/UL)
- Boys: **9-13 y**, **14-18 y**
- Girls: **9-13 y**, **14-18 y**
- Men: **19-30, 31-50, 51-70, >70 y**
- Women: **19-30, 31-50, 51-70, >70 y**
- Pregnancy: **14-18, 19-30, 31-50 y**
- Lactation: **14-18, 19-30, 31-50 y**

### Energy (Tables 1-3 — separate)
- Infants: **single-month buckets** 1-24 mo (Table 1)
- Children/Adolescents: **single-year buckets** 3-18 y (Table 2) at 6 PALs (1.2, 1.4, 1.6, 1.8, 2.0, 2.2)
- Adults: per (height × weight × PAL) matrix (Table 3) for 4 age bands

### Pregnancy/Lactation life-stage mapping
- Pregnancy 14-18 y (mother): 168-227 mo, lifeStage = PREGNANT
- Pregnancy 19-30 y: 228-371 mo, lifeStage = PREGNANT
- Pregnancy 31-50 y: 372-611 mo, lifeStage = PREGNANT
- Same for LACTATING

## Reference body weights (used for protein g/kg derivation)
| Group | Weight (kg) |
|---|---|
| 2-6 mo | 7 |
| 7-11 mo | 9 |
| 1-3 y | 13 |
| 4-8 y | 22 |
| M 9-13 y | 40 |
| M 14-18 y | 64 |
| M 19+ y | 76 |
| F 9-13 y | 40 |
| F 14-18 y | 57 |
| F 19+ y | 61 |

## Special cases / edge cases

### 1. Calcium 9-13 y split
Source publishes EAR/RDI as ranges (e.g. 800-1050 mg) because of separate recommendations for **9-11 y** and **12-13 y** due to growth. We split into two demographic rows:
- 9-11 y (108-143 mo): EAR=800, RDI=1000 (M+F)
- 12-13 y (144-167 mo): EAR=1050, RDI=1300 (M+F)
- 14-18 y: EAR=1050, RDI=1300

### 2. Iron M 9-13 y EAR=8 RDI=11; F 14-18 EAR=8 RDI=15
Higher iron for adolescent females (menstruation onset).

### 3. Energy: PAL strategy
NHMRC publishes EER at 6 Physical Activity Levels (1.2-2.2). Nutri's `activityLevelEnum` has 4 buckets. Mapping:
- PAL 1.4 (Very sedentary) → SEDENTARY
- PAL 1.6 (Light) → MODERATE
- PAL 2.0 (Heavy) → ACTIVE
- PAL 2.2 (Vigorous) → VERY_ACTIVE
For adults, use median height/weight (1.7m/63.6kg M, 1.6m/56.3kg F) per age band.
For infants, no PAL (single value at activityLevel=null).
For children 3-18, store all 4 PALs per single-year bucket.

### 4. Energy unit: Convert kJ → kcal (1 kJ = 0.239 kcal)

### 5. Sodium 2017 update
- AI 460-920 mg/d retained for adults (range stored as midpoint = 690 mg with valueMin=460, valueMax=920)
- UL **2300 mg/d** for adults (2017 — was previously not set)
- SDT (suggested dietary target for chronic disease reduction) added 2017 = **2000 mg/d**

### 6. Fluoride 2017 update
- Updated AI/UL for children 0-8 yr (uses updated reference body weights)
- Values in Table 9 reflect 2017 update

### 7. Niacin UL form-split
- UL footnote: "For supplemental nicotinamide, the UL is 900 mg/day for men and non-pregnant women, 150 mg/day for 1-3 yr-olds, 250 mg/day for 4-8 yr-olds, 500 mg/day for 9-13 yr-olds and 750 mg/day for 14-18 yr-olds. It is not possible to set a UL for nicotinamide for infancy."
- Table values are nicotinic acid ULs (10/15/20/30/35).
- We store the table value (nicotinic acid form) as Niacin UL and document.

### 8. Folate UL
- "For folate, the UL is for intake from fortified foods and supplements as folic acid"
- Store as published, document.

### 9. Vitamin B6 UL — pyridoxine
- "For vitamin B6, the UL is set for pyridoxine"
- Store, document.

### 10. Magnesium UL
- "Note that all of the ULs listed for magnesium refer to supplements"
- Store with value_note.

### 11. Range values (multi-value cells)
- Calcium 9-13: split into 9-11 / 12-13 (see #1)
- Sodium AI: store as range with min/max

## Compounds covered
- **B vitamins (8):** Thiamin, Riboflavin, Niacin, Vit B6, Vit B12, Folate, Pantothenic acid, Biotin
- **Other vitamins (5):** A, C, D, E, K
- **Choline:** yes
- **Macro-minerals:** Calcium, Phosphorus, Magnesium, Sodium, Potassium, Chloride*, Iron
- **Trace minerals:** Zinc, Copper, Chromium, Manganese, Iodine, Selenium, Molybdenum, Fluoride
- **Macros:** Protein, Linoleic acid (n-6), α-linolenic acid (n-3), LC n-3 (DHA/EPA/DPA), Carbohydrate (infants only), Dietary fibre, Total water
- **Energy** (kcal)

*NHMRC summary tables don't show Chloride explicitly — covered in Sodium chapter only. Skip unless time permits.

## Estimated row counts
- Vitamins (13 + choline = 14) × 16 demographics × ~2 value types = ~448
- Minerals (16) × 16 demographics × ~2 value types = ~512
- Protein × 16 × 2 = 32 + lact/preg = ~50
- Macros (n-3, n-6, fibre, water) × 16 × 1 = ~64
- Energy: infants 16 × 2 = 32; children 3-18 × 2 sexes × 4 PALs = 128; adults 4 bands × 2 × 4 PALs = 32 → ~192
- AMDR (~5 macros × 6 demographics ≈ 30)

**Estimated total: ~1,300-1,500 rows.** Larger than UK (586) due to more value types per cell, more compounds, and energy PAL granularity.
