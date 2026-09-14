# KDRI 2020 — Source notes

## Authority
- **Ministry of Health and Welfare (MOHW)** + **The Korean Nutrition Society (KNS)**
- *Dietary Reference Intakes for Koreans 2020* — 3-book set:
  - Book 1: 에너지와 다량영양소 (Energy and Macronutrients) — 314 pages
  - Book 2: 비타민 (Vitamins) — 444 pages
  - Book 3: 무기질 (Minerals) — 440 pages
- Published: 2020년 12월 10일 (Dec 10, 2020)
- ISBN set: 978-89-960455-6-4
- Errata: 4 rounds of corrections (Jan 2021, Jan 2021, Jan 2021, Nov 2021)

## Source material
`dv-sources/kdri-2020/`:
- `01+2020+한국인+영양소+섭취기준+-+에너지와+다량영양소.pdf` (9.3 MB) — primary source, includes all summary tables
- `02+2020+한국인+영양소+섭취기준+-+비타민.pdf` (12.2 MB)
- `03+2020+한국인+영양소+섭취기준+-+무기질.pdf` (12.2 MB)
- `2020KDRIs-정오표-1차수정-20210108.pdf` — 1st errata
- `2020KDRIs-정오표-2차수정-아미노산+수정+20210115.pdf` — 2nd errata (amino acids)
- `2020KDRIs-정오표-3차수정-수분_식이섬유+수정+20210129.pdf` — 3rd errata (Water, Fiber)
- `2020KDRIs-정오표-4차수정-에너지++판토텐산++칼슘+수정+2021114.pdf` — 4th errata (Energy, Pantothenic, Calcium) — supersedes #1
- `jnh-55-21-summary.pdf` — JNH review paper with energy comparison
- `vitamin-a-review.pdf` — Vit A KDRI review

**Primary extraction source: Book 1 Appendix 2** "Summary of 2020 Dietary Reference Intakes for Koreans (KDRIs)" — pages 255-264 (English-language consolidated tables).

## Region code
**KOREA** (already in source_region_enum)

## DRV framework (KDRI terminology → Nutri enum)
| KDRI term | Meaning | Nutri enum |
|---|---|---|
| EAR (Estimated Average Requirement) | 50% of population | `EAR` |
| RNI (Recommended Nutrient Intake) | ~97.5% of population | `RDA` |
| AI (Adequate Intake) | Used when EAR cannot be determined | `AI` |
| UL (Tolerable Upper Intake Level) | Upper safe limit | `UL` |
| EER (Estimated Energy Requirement) | Energy need | `EAR` |
| AMDR (Acceptable Macronutrient Distribution Range) | % of energy range | `AMDR` |
| CDRR (Chronic Disease Risk Reduction Intake) | Na "stay under" for chronic disease | `CDRR` |

## Native age buckets
Per Book 1 Appendix 1 Table 2 (Age subgroups for 2015/2020 KDRIs):
- **Infancy**: 0-5 mo, 6-11 mo (no gender)
- **Growth (early)**: 1-2 y, 3-5 y (no gender)
- **Growth (later)**: 6-8, 9-11, 12-14, 15-18 y (M/F split)
- **Adulthood**: 19-29, 30-49, 50-64 y (M/F)
- **Elderly**: 65-74, ≥75 y (M/F)
- **Pregnancy**: single row (not split by maternal age) — addition applied over non-pregnant base
- **Lactation**: single row — addition applied over non-lactating base

## Physical standards (reference body weights — used for protein g/kg context)
| Age | Height M (cm) | Height F | Weight M (kg) | Weight F | BMI M | BMI F |
|---|---|---|---|---|---|---|
| 0-5 mo | 58.3 | — | 5.5 | — | 16.2 | — |
| 6-11 | 70.3 | — | 8.4 | — | 17.0 | — |
| 1-2 y | 85.8 | — | 11.7 | — | 15.9 | — |
| 3-5 | 105.4 | — | 17.6 | — | 15.8 | — |
| 6-8 | 124.6 | 123.5 | 25.6 | 25.0 | 16.7 | 16.4 |
| 9-11 | 141.7 | 142.1 | 37.4 | 36.6 | 18.7 | 18.1 |
| 12-14 | 161.2 | 156.6 | 52.7 | 48.7 | 20.5 | 20.0 |
| 15-18 | 172.4 | 160.3 | 64.5 | 53.8 | 21.9 | 21.0 |
| 19-29 | 174.6 | 161.4 | 68.9 | 55.9 | 22.6 | 21.4 |
| 30-49 | 173.2 | 159.8 | 67.8 | 54.7 | 22.6 | 21.4 |
| 50-64 | 168.9 | 156.6 | 64.5 | 52.5 | 22.6 | 21.4 |
| 65-74 | 166.2 | 152.9 | 62.4 | 50.0 | 22.6 | 21.4 |
| ≥75 | 163.1 | 146.7 | 60.1 | 46.1 | 22.6 | 21.4 |

## Special cases

### 1. Carbohydrate Pregnancy/Lactation (Errata 4)
- Pregnancy RNI: published as +45 → non-preg F RNI 130 + 45 = **175 g/d** (originally 180; erratum corrected)
- Lactation RNI: non-lact 130 + 80 = **210 g/d** (originally 215; erratum corrected)

### 2. Niacin UL — form-split
Source publishes UL as "nicotinic acid / nicotinamide" pair, e.g. adults 35/1000 mg/d.
- `Niacin (B3)` UL ← use nicotinic acid value (stricter)
- Document nicotinamide value in value_note

### 3. Sodium CDRR (first Korean source with CDRR)
Adults 19+: CDRR = 2,300 mg/d (equivalent to ~5.75 g salt/d — WHO-aligned).
Stored as `Sodium` UL-type? No, this is CDRR per KDRI framework. Use `CDRR` valueType.
Note: KDRI also has Na AI 1,500 mg/d for adults.

### 4. Pregnancy/Lactation — absolute values vs additions
KDRI presents pregnancy/lactation as additions (+X). To store as absolute values per Nutri convention:
- Absolute = non-pregnant F (age 19-29 or appropriate) base + addition
- Document the addition in `value_note` (e.g., "Pregnancy +10 mg over non-pregnant base")

Decision: Use absolute values, age range 228-599 months (women of child-bearing age 19-49).

### 5. Infants 0-5 / 6-11 — AI only
Per the General Outline: KDRI infant values are AI derived from breast milk composition + standard 780 mL/day intake. No EAR/RNI for infants.

### 6. Niacin mg NE
Source uses mg NE (niacin equivalent) where 1 mg NE = 1 mg niacin = 60 mg tryptophan.

### 7. Folate in µg DFE
Dietary Folate Equivalents. UL applies to folic acid from fortified foods and supplements only, not food folate. Pregnancy: 400 µg DFE/d folic acid supplement recommended.

### 8. Magnesium UL — supplemental only
UL footnote: "Only for non-food magnesium sources" (i.e., supplements/medications).

## Compounds covered (40 nutrients per KDRI 2020)

### Energy + Macros (Book 1)
Energy (EER), Carbohydrate (EAR/RNI/AMDR), Total fiber (AI), Sugars (AMDR 10-20%, CDRR ≤10% added sugars), Protein (EAR/RNI/AMDR), Amino acids (9 EAR/RNI — **skipped**: Nutri doesn't track individually), Fat (AMDR), Linoleic acid (AI), α-Linolenic acid (AI), EPA+DHA (AI — stored as Omega-3), Cholesterol (CDRR <300 mg/d adult), Water (AI food + beverage + liquid + total)

### Vitamins (Book 2, 13 types)
Vitamin A, D, E, K, C, Thiamin, Riboflavin, Niacin, Vitamin B6, Folate, Vitamin B12, Pantothenic acid, Biotin

### Minerals (Book 3, 15 types)
Calcium, Phosphorus (Phosphate in table), Sodium, Chloride, Potassium, Magnesium, Iron, Zinc, Copper, Fluoride, Manganese, Iodine, Selenium, Molybdenum, Chromium

## Compounds SKIPPED / deferred
- **Amino acids** (Methionine+Cysteine, Leucine, Isoleucine, Valine, Lysine, Phe+Tyr, Threonine, Tryptophan, Histidine) — Nutri doesn't track individually (only Protein)
- **Cholesterol** — CDRR <300 mg/d for 19+ → store if `Cholesterol` compound exists
- **Sugars (Total, Added)** — AMDR/CDRR as %energy → `Added Sugars` CDRR ≤10% energy

## Estimated row counts
- Base demographics: 24 (2 infants + 2 children + 9 M + 9 F + 1 preg + 1 lact)
- Micronutrients (27 vitamins+minerals): ~27 × ~20 (avg per nutrient with EAR/RNI/AI/UL) = ~540
- Macros (Protein, Carb, Fat, LA, ALA, Omega-3, Fiber, Water): ~8 × 24 × 2 = ~384
- Energy × 24 = 24 rows
- AMDR (Carb, Protein, Fat, SFA, TFA) × 20 age groups ≈ 100
- Sodium CDRR + Added Sugars CDRR ≈ 20

**Estimated total: ~1,100-1,300 rows.**
