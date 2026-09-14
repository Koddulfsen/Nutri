# WHO/FAO — Source notes

## Authority
- **WHO + FAO** joint publication: *Vitamin and mineral requirements in human nutrition, 2nd edition*
- Report of a Joint FAO/WHO Expert Consultation, Bangkok, Thailand, 21-30 September 1998
- Published 2004, ISBN 92 4 154612 3

## Source material
- Chapter-level HTML on FAO: `https://www.fao.org/4/y2809e/y2809e00.htm`
- Appendix (consolidated RNI tables): `https://www.fao.org/4/y2809e/y2809e0o.htm`
- Front matter PDF (20 pages): `who-fao-2004.pdf` saved locally
- Full 361-page PDF only available via WHO IRIS JS-protected viewer; chapter tables extracted via WebFetch from FAO HTML appendix.

## Region code
**WHO_FAO** (already in source_region_enum — used for global baseline)

## Value types
- **RNI** (Recommended Nutrient Intake) → Nutri `RDA`
- No EAR published. No UL published in appendix tables (some per-chapter ULs but not systematically).
- For minerals with bioavailability variants (Iron, Zinc): values stored = 15% Fe bioavailability and Moderate Zn bioavailability (medium diet) as default; documented in value_note.

## Native age buckets
- **Infants**: 0-6 mo, 7-12 mo (some tables say 7-11 mo)
- **Children**: 1-3 y, 4-6 y, 7-9 y (unisex)
- **Adolescents**: M/F 10-18 y. Iron/Iodine split 10-14 vs 15-18.
- **Adults**: M 19-65 y, F 19-50 y, F 51-65 y, M 65+, F 65+
- **Pregnancy**: single (most) or split by trimester (Ca/Fe/Zn/Se/I)
- **Lactation**: single (most) or split 0-3 mo / 4-6 mo / 7-12 mo (Fe/Zn/Se)

## Special cases

### 1. Iron bioavailability (4 levels)
Published at 15%, 12%, 10%, 5% bioavailability. We store the **15% bioavailability (high)** values as the default RNI — matches typical Western omnivorous diets. Value note documents this assumption.

### 2. Zinc bioavailability (3 levels: high, moderate, low)
Published per diet pattern. Store **moderate bioavailability** as default.

### 3. Iodine 10-18 y age split
- M 10-11: 135 µg; M 12-18: 110 µg
- F 10-11: 140 µg; F 12-18: 100 µg
Split into two demographic rows per sex.

### 4. Iron adolescent split
- M 10-14: 10 mg; M 15-18: 12 mg (both at 15% bioavail)
- F 10-14: 9 mg; F 15-18: 21 mg (menstruation starts)

### 5. Vitamin K 10-18 range
M 10-18: 35-65 µg; F 10-18: 35-55 µg — presumably age-graded. Store upper bound (closest to adult value).

### 6. Vitamin D
- 0-50: 5 µg/d baseline
- F 51+: 10 µg/d
- 65+: 15 µg/d (M+F)

### 7. Pregnancy splits
- Ca: only T3 value published (1,200 mg) — implies T1/T2 same as non-preg
- Iron: T1 5.5, T2 7.0, T3 10.0 (at 15% bioavail, over non-preg base)
- Zinc: T1 3.4, T2 4.2, T3 6.0
- Selenium: T2 28, T3 30 (no T1)
- Vitamins + Mg + Iodine: single pregnancy value

### 8. Lactation splits (Iron/Zinc/Selenium)
- Iron lactation: 0-3 mo 9.5, 4-6 mo 8.8, 7-12 mo 7.2
- Zinc lactation: 0-3 mo 5.8, 4-6 mo 5.3, 7-12 mo 4.3
- Selenium lactation: 0-3 35, 4-6 35, 7-12 42
We collapse to two buckets: LACTATING_0_6M (avg of 0-3 and 4-6) and LACTATING_7_12M.

### 9. Vitamin A uses RE (Retinol Equivalent)
Not RAE. Store in `Vitamin A (RAE)` compound with caveat in note.

## Compounds covered
**Vitamins (12):** Thiamin (B1), Riboflavin (B2), Niacin (B3), Vitamin B6, Pantothenate (B5), Biotin (B7), Folate, Vitamin B12, Vitamin C, Vitamin A, Vitamin D, Vitamin E, Vitamin K
**Minerals (6):** Calcium, Magnesium, Selenium, Zinc, Iron, Iodine

**Not covered by WHO/FAO 2004** (deferred): Phosphorus, Sodium, Potassium, Chloride, Copper, Chromium, Manganese, Molybdenum, Fluoride, Protein, Energy, Fat/Carb/Fiber, Choline, Water.

## Estimated rows
- 6 minerals × ~15 demographics (with preg/lact splits) ≈ ~110
- 13 vitamins × ~13 demographics ≈ ~170
- Total: ~280 rows. Smaller than Asian DRIs (no ULs, no AMDRs, vitamins+minerals only).
