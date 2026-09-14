# CNS 2023 — Chinese DRIs — Source notes

## Authority
- **中国营养学会** (Chinese Nutrition Society, CNS)
- *Dietary Reference Intakes for China (2023版)* — revises 2013 edition
- Published: September 2023, 人民卫生出版社 (People's Medical Publishing House)
- ISBN: 978-7-117-35069-3

## Source material
- `cns-2023.pdf` (655 pages, 63.5 MB) — full official book
- Summary tables at pages 628-639 (附录三 — Appendix 3, Tables 3-1 to 3-12)

## Region code
**CHINA** (already in source_region_enum)

## Value types (most comprehensive yet)
| CNS term | Nutri enum |
|---|---|
| EAR (平均需要量) | `EAR` |
| RNI (推荐摄入量) | `RDA` |
| AI (适宜摄入量) | `AI` |
| UL (可耐受最高摄入量) | `UL` |
| AMDR (可接受范围) | `AMDR` |
| PI-NCD (降低慢病风险建议量) | `CDRR` |
| EER (能量需要量) | `EAR` (for Energy) |
| SPL (特定建议值) — phytonutrients only | not stored |

## Native age buckets (standardized)
- Infants: 0-6 mo (0岁~), 6-12 mo (0.5岁~)
- Children: 1-3y (1岁~), 4-6y (4岁~), 7-8y (7岁~), 9-11y (9岁~)
- Adolescents: 12-14y (12岁~), 15-17y (15岁~)
- Adults: 18-29y, 30-49y, 50-64y, 65-74y, 75+y
- Pregnancy: 孕早期/中期/晚期 → PREGNANT_T1/T2/T3
- Lactation: 乳母 → LACTATING

Note: **Energy table (3-1)** uses single-year bands for ages 1-11. We store Energy at the standardized child buckets using midpoint-age representative value.

## Physical activity levels (PAL) — Energy only
- **PAL I** (low, ~1.4) → SEDENTARY
- **PAL II** (moderate, ~1.7) → MODERATE (default)
- **PAL III** (high, ~2.0) → ACTIVE

Energy tables publish 3 PAL levels for each adult age band.

## Special cases

### 1. Iron female adults: menstruation split
Table 3-7 shows "12 / 10ᶜ 18ᵈ" for F 50-64y means:
- 无月经 (non-menstruating/postmenopausal): 10 mg
- 有月经 (menstruating): 18 mg
We split into two rows with value_note marking dietary_context.

### 2. Pregnancy stored as trimesters
孕早期/中期/晚期 → PREGNANT_T1/T2/T3 (first source besides Taiwan + KDRI variants to use full trimester split)

### 3. Added Sugars CDRR
Table 3-4 footnote: "添加糖每天不超过 50g/d，最好低于 25g/d" (≤50g/d, ideally <25g)
Also AMDR <10% energy. Store as CDRR at 50 g/d + 10%.

### 4. PI-NCD = CDRR
Table 3-9 publishes reduced-intake levels for chronic disease prevention:
- Potassium (increase target for cardiovascular benefits) — 3,600 mg/d adult
- Sodium (≤2,000 mg/d adult = ceiling)
- Vitamin C (200 mg/d adult as disease-reduction target)

Map: PI-NCD → CDRR enum (appropriate since it's a "stay under/above for chronic disease prevention" concept)

### 5. Vitamin A in µg RAE (not RE)
CNS 2023 uses RAE standard, unlike WHO/FAO which uses RE. Stored directly in `Vitamin A (RAE)`.

### 6. Water AI
Table 3-11 gives M/F split for 饮水量 (drinking water) and 总摄入量 (total water including food). Store total water AI.

### 7. Niacin UL form-split
Table 3-10 shows separate 烟酸 (niacin, 烟酸 stricter) and 烟酰胺 (nicotinamide) ULs. Store nicotinic acid form (stricter).

### 8. Chromium excluded from CNS 2023
Table 3-10 UL doesn't list Chromium; not in Table 3-7 either. Appears CNS dropped chromium as a required nutrient. Skip in seed.

Actually Table 3-7 DOES show 铬/Cr in the last columns. Will include.

## Compounds covered (~25)
**Vitamins (14):** A, D, E, K, B1, B2, Niacin, B6, B12, Folate, Pantothenic acid, Biotin, Choline, Vitamin C
**Minerals (16):** Ca, P, K, Na, Mg, Cl, Fe, I, Zn, Se, Cu, F (fluoride), Cr (chromium), Mn, Mo
**Macros:** Energy, Protein, Total Fat, Saturated Fat, n-6 (LA), n-3 (ALA), EPA+DHA, Carb, Dietary Fiber, Added Sugars
**Water:** Water AI

## Estimated rows
- Micronutrients (~30) × ~13 age bands × ~4 value types (EAR/RNI/UL/preg-lact) = ~600-800
- Macros ~10 × ~15 ages × ~3 types = ~300
- Energy × 3 PALs × ~13 ages × 2 sexes = ~80
- Total estimate: **~1,200-1,500 rows**.

Expected to be near or slightly above Korea/Taiwan in size.
