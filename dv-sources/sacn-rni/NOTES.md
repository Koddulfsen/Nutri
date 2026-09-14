# SACN / UK DRV — Source notes

## Authority
- **Original framework**: Committee on Medical Aspects of Food and Nutrition Policy (COMA), 1991 — *Dietary Reference Values for Food Energy and Nutrients for the United Kingdom* (HMSO 1991, Report 41)
- **Current advisor**: Scientific Advisory Committee on Nutrition (SACN, replaced COMA)
- **Updates since 1991**:
  - SACN 2003 — *Salt and Health* (target salt intakes)
  - SACN 2011 — *Dietary Reference Values for Energy* (revised EARs)
  - SACN 2015 — *Carbohydrates and Health* (free sugars 5%, fibre 30 g/d AOAC)
  - SACN 2016 — *Vitamin D and Health* (10 µg/d RNI from age 4)

## Source material used
- `bnf-nutrition-requirements-2021.pdf` — British Nutrition Foundation digest, 2021 review
  - Consolidates COMA 1991 + SACN updates into clean tables
  - Cited sources at the bottom of each table: "Department of Health, *Dietary Reference Values for Food Energy and Nutrients for the United Kingdom*, HMSO, 1991. SACN Vitamin D and Health report, 2016."
- Retrieved 2026-04-18 from https://www.nutrition.org.uk/media/nmmewdug/nutrition-requirements.pdf

## Region code
**UK_GBR** (new region — first UK source)

## DRV framework (UK terminology → Nutri enum)
| UK term | Meaning | Nutri enum |
|---|---|---|
| RNI (Reference Nutrient Intake) | 97.5% of population covered (~mean + 2 SD) | `RDA` |
| EAR (Estimated Average Requirement) | 50% of population (mean) | `EAR` |
| LRNI (Lower Reference Nutrient Intake) | 2.5% of population (mean − 2 SD) | not stored (below floor) |
| Safe Intake (SI) | Used when evidence insufficient for EAR/RNI/LRNI | `AI` |
| Maximum salt intake | Population goal (not optimum) | `CDRR` |
| % energy from carb/fat/sugars | Population macronutrient ranges | `AMDR` |

## Native age buckets

### Vitamins & Minerals (COMA 1991, SACN 2016 Vit D)
- 0-3 mo, 4-6 mo, 7-9 mo, 10-12 mo
- 1-3 y, 4-6 y, 7-10 y
- Males 11-14, 15-18, 19-50, 50+ y
- Females 11-14, 15-18, 19-50, 50+ y
- Pregnancy increment, Lactation increment (0-4 mo + 4+ mo)

### Energy EAR (SACN 2011)
- Infants split by feeding mode (breastfed / formula-fed / mixed) — we'll use **mixed/unknown** as default for the broadest applicability
- Mixed: 1-2, 3-4, 5-6, 7-12 mo, 1, 2, 3 y
- Children 4-18 y (single-year buckets)
- Adults 19-24, 25-34, 35-44, 45-54, 55-64, 65-74, 75+ y
- Pregnancy: +0.8 MJ/d (200 kcal/d) **last trimester only**

### Salt (SACN 2003) — Maximum intake (CDRR)
- 0-6 mo, 6-12 mo, 1-3 y, 4-6 y, 7-10 y, 11+ y

### Fibre (SACN 2015) — AOAC method (RNI-equivalent, but called "Recommended intake")
- 2-5 y, 5-11 y, 11-16 y, 17+ y (note 5y and 11y appear in two buckets — published exactly as such; treat as a one-day overlap)

### Macronutrient ranges (% of energy)
- Total Carb 50% (SACN 2015, age 2+)
- Free sugars ≤5% (SACN 2015, age 2+)
- Total Fat ≤35% (COMA 1991, age 5+)
- Saturated Fat ≤11% (COMA 1991, age 5+)

## Special cases / edge cases

### 1. Vitamin D infants (0-12 mo): Safe Intake 8.5-10 µg
- Marked `***` = Safe Intake (not RNI). Range — we'll store as **AI = 10 µg/d** (upper bound, recommended for supplementation in non-formula-fed infants).

### 2. Iron 11+ y females: 14.8 mg/d marked `***`
- Note: "Insufficient for women with high menstrual losses where the most practical way of meeting iron requirements is to take iron supplements"
- Store as RNI 14.8, document caveat in `value_note`.

### 3. Phosphorus RNI = Calcium RNI in molar terms
- Per source footnote `†`. Store published values as-is.

### 4. Niacin RNI based on 14.7% of EAR for energy
- Per source footnote. Already converted to mg/d in the table — store as-is.

### 5. Protein adults: g/kg × reference body weight
- COMA 1991 sets RNI = 0.75 g/kg/d for adults
- BNF table only shows up to 7-10 y (28.3 g/d)
- Need COMA 1991 reference body weights to derive 11-14, 15-18, 19-50, 50+ — see DERIVATION below
- Pregnancy: +6 g/d
- Lactation: +11 g/d (0-6 mo), +8 g/d (6+ mo)

### 6. Salt → Sodium conversion
- Source publishes salt (NaCl) in g
- 1 g salt = 393 mg Na (per BNF: "1 g sodium = 2.5 g of salt")
- Store as Sodium (mg) since `Sodium` is the canonical compound
- 6 g salt = 2,400 mg Na
- 5 g salt = 2,000 mg Na, 3 g salt = 1,200 mg Na, 2 g salt = 800 mg Na, 1 g salt = 400 mg Na, <1 g = ~200 mg Na

### 7. Energy MJ/d vs kcal/d
- Both columns published. Use **kcal/d** as primary (matches NIH, EFSA, MHLW pattern).

### 8. Pregnancy/lactation increments marked `*`
- `*` = "No increase" → don't insert pregnancy/lactation rows (use the base female adult value)
- `**` = "For last trimester only" → only insert third-trimester pregnancy row

### 9. Fibre "Recommended intake" (SACN 2015)
- AOAC method (whole-fibre definition replacing earlier NSP definition)
- Treat as RDA (population recommendation, not just safe-intake)

### 10. Chloride 11+ shows `2500` for both M/F
- Set in molar equivalence to sodium (per COMA 1991): 1 mmol Na = 1 mmol Cl. 70 mmol Na (1610 mg) = 70 mmol Cl (2483 mg ≈ 2500). Store as published.

## Protein adult derivation (need reference weights)

UK COMA 1991 reference body weights (Annex 2 of report 41):
- 11-14 y: M 43.0 kg, F 43.8 kg
- 15-18 y: M 64.5 kg, F 55.5 kg
- 19-50 y: M 74.0 kg, F 60.0 kg
- 50+ y: M 71.0 kg, F 62.0 kg

Protein RNI = 0.75 × kg:
- 11-14 M: 32.3 g/d, F: 32.9 g/d (BNF/SACN published values; we'll cross-check)
- 15-18 M: 48.4 g/d, F: 41.6 g/d
- 19-50 M: 55.5 g/d, F: 45.0 g/d
- 50+ M: 53.3 g/d, F: 46.5 g/d

Note: COMA actually published derived adult RNIs in Table 5.4 of Report 41 — values above match published. Document in `value_note`.

## Compounds covered (BNF digest)

**Vitamins (9):** Thiamin, Riboflavin, Niacin, Vitamin B6, Vitamin B12, Folate, Vitamin C, Vitamin A, Vitamin D
**Minerals (11):** Calcium, Phosphorus, Magnesium, Sodium, Potassium, Chloride, Iron, Zinc, Copper, Selenium, Iodine
**Macros:** Protein, Total Fat (AMDR), Saturated Fat (AMDR), Total Carbohydrate (AMDR), Free Sugars (AMDR), Fibre (RDA)
**Energy:** kcal/d (EAR), MJ/d (also store as Energy in kcal canonical)

## Compounds in COMA 1991 not in BNF digest (deferred)
- Vitamin K (SI only, 1 µg/kg/d adult)
- Pantothenic Acid (SI 3-7 mg/d adult)
- Biotin (SI 10-200 µg/d)
- Manganese (SI ≥1.4 mg/d adult)
- Molybdenum (SI 50-400 µg/d)
- Chromium (SI ≥25 µg/d adult)
- Fluoride (SI 0.05 mg/kg/d infants)
- Linoleic acid (≥1% energy)
- Alpha-Linolenic acid (≥0.2% energy)

→ If we want these we'd need the original COMA 1991 PDF. Note in value_note that these are Safe Intakes (`AI`), and accept lower confidence.

## Estimated row counts
- Vitamins: 9 × (7 child + 4 male + 4 female) = 9 × 15 = 135 RNIs/AIs
- + Pregnancy: 9 (where * not noted)
- + Lactation × 2 windows: ~18
- Minerals: 11 × 15 = 165 + ~30 preg/lact
- Energy: 4 + 7 (mixed mode + child + adult) = 4 + 16 + 14 = ~34
- Protein: 7 child + 8 adult + 3 preg/lact = ~18
- Macros (AMDR): ~15 (5 per macro × 3 age tiers ≈)
- Fibre (RDA): 4 + male/female split? = 4
- Salt → Sodium (CDRR): 6 ranges

**Estimated total: ~600-700 rows** (similar to LARN scale).
