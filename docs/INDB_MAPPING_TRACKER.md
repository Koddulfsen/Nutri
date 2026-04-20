# INDB (Indian Nutrient Databank) to Nutri Compound Mapping Tracker

## Source Information
- **Database**: Indian Nutrient Databank (INDB) 2024
- **Publisher**: University of Edinburgh / IFCT research
- **Coverage**: 1,095 foods + 1,014 Indian recipes
- **Nutrients**: 39
- **Format**: Excel (XLSX) via GitHub
- **License**: Open Access
- **URL**: https://github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB-

## Progress: 39/39 mapped (100%)

---

## Data Sources Used by INDB

INDB compiles data from three primary sources:
1. **NIN_fct** - ICMR-NIN Indian Food Composition Tables (2017 & 2004)
2. **UK_fct** - UK Composition of Foods (CoFID) for 144 missing ingredients
3. **US_fct** - USDA FoodData Central for 54 missing ingredients

---

## INDB Nutrient Column Naming Convention

INDB uses descriptive column names with units appended:
- `energy_kcal` → Energy in kilocalories
- `protein_g` → Protein in grams
- `vitb1_mg` → Vitamin B1 in milligrams

---

## 1. Energy (2 columns)

| # | INDB Column | Description | Unit | Nutri Compound | Canonical? | Status |
|---|-------------|-------------|------|----------------|------------|--------|
| 1 | energy_kcal | Total energy | kcal | Energy | Yes | ✅ |
| 2 | energy_kj | Total energy | kJ | Energy | No | ✅ |

---

## 2. Macronutrients (5 columns)

| # | INDB Column | Description | Unit | Nutri Compound | Canonical? | Status |
|---|-------------|-------------|------|----------------|------------|--------|
| 3 | protein_g | Total protein | g | Protein | Yes | ✅ |
| 4 | fat_g | Total fat | g | Total Fat | Yes | ✅ |
| 5 | carb_g | Total carbohydrates | g | Total Carbohydrate | Yes | ✅ |
| 6 | fibre_g | Total dietary fiber | g | Total Fiber | Yes | ✅ |
| 7 | freesugar_g | Free sugars | g | Free Sugars | Yes | ✅ |

---

## 3. Lipids (4 columns)

| # | INDB Column | Description | Unit | Nutri Compound | Canonical? | Status |
|---|-------------|-------------|------|----------------|------------|--------|
| 8 | sfa_mg | Saturated fatty acids | mg | Saturated Fat | No | ✅ |
| 9 | mufa_mg | Monounsaturated fatty acids | mg | Monounsaturated Fat | No | ✅ |
| 10 | pufa_mg | Polyunsaturated fatty acids | mg | Polyunsaturated Fat | No | ✅ |
| 11 | cholesterol_mg | Cholesterol | mg | Cholesterol | Yes | ✅ |

**Note**: INDB reports SFA/MUFA/PUFA in mg while our canonical unit is g. Conversion factor: 0.001

---

## 4. Minerals (12 columns)

| # | INDB Column | Description | Unit | Nutri Compound | Canonical? | Status |
|---|-------------|-------------|------|----------------|------------|--------|
| 12 | calcium_mg | Calcium | mg | Calcium | Yes | ✅ |
| 13 | phosphorus_mg | Phosphorus | mg | Phosphorus | Yes | ✅ |
| 14 | magnesium_mg | Magnesium | mg | Magnesium | Yes | ✅ |
| 15 | sodium_mg | Sodium | mg | Sodium | Yes | ✅ |
| 16 | potassium_mg | Potassium | mg | Potassium | Yes | ✅ |
| 17 | iron_mg | Iron | mg | Iron | Yes | ✅ |
| 18 | copper_mg | Copper | mg | Copper | Yes | ✅ |
| 19 | zinc_mg | Zinc | mg | Zinc | Yes | ✅ |
| 20 | manganese_mg | Manganese | mg | Manganese | Yes | ✅ |
| 21 | selenium_ug | Selenium | µg | Selenium | Yes | ✅ |
| 22 | chromium_mg | Chromium | mg | Chromium | No | ✅ |
| 23 | molybdenum_mg | Molybdenum | mg | Molybdenum | No | ✅ |

**Note**: INDB reports Chromium and Molybdenum in mg while standard databases use µg. This appears to be a data entry choice in INDB. Conversion factor: 1000 to get µg.

---

## 5. Fat-Soluble Vitamins (7 columns)

| # | INDB Column | Description | Unit | Nutri Compound | Canonical? | Status |
|---|-------------|-------------|------|----------------|------------|--------|
| 24 | vita_ug | Vitamin A (RAE) | µg | Vitamin A | Yes | ✅ |
| 25 | vite_mg | Vitamin E | mg | Vitamin E | Yes | ✅ |
| 26 | vitd2_ug | Vitamin D2 (ergocalciferol) | µg | Vitamin D2 | Yes | ✅ |
| 27 | vitd3_ug | Vitamin D3 (cholecalciferol) | µg | Vitamin D3 | Yes | ✅ |
| 28 | vitk1_ug | Vitamin K1 (phylloquinone) | µg | Vitamin K1 | Yes | ✅ |
| 29 | vitk2_ug | Vitamin K2 (menaquinones) | µg | Vitamin K2 | Yes | ✅ |
| 30 | carotenoids_ug | Total carotenoids | µg | Total Carotenoids | Yes | ✅ |

---

## 6. Water-Soluble Vitamins (9 columns)

| # | INDB Column | Description | Unit | Nutri Compound | Canonical? | Status |
|---|-------------|-------------|------|----------------|------------|--------|
| 31 | vitc_mg | Vitamin C (ascorbic acid) | mg | Vitamin C | Yes | ✅ |
| 32 | vitb1_mg | Vitamin B1 (thiamin) | mg | Thiamin | Yes | ✅ |
| 33 | vitb2_mg | Vitamin B2 (riboflavin) | mg | Riboflavin | Yes | ✅ |
| 34 | vitb3_mg | Vitamin B3 (niacin) | mg | Niacin | Yes | ✅ |
| 35 | vitb5_mg | Vitamin B5 (pantothenic acid) | mg | Pantothenic Acid | Yes | ✅ |
| 36 | vitb6_mg | Vitamin B6 (pyridoxine) | mg | Vitamin B6 | Yes | ✅ |
| 37 | vitb7_ug | Vitamin B7 (biotin) | µg | Biotin | Yes | ✅ |
| 38 | folate_ug | Folate (total) | µg | Folate | Yes | ✅ |
| 39 | vitb9_ug | Vitamin B9 (folic acid) | µg | Folic Acid | Yes | ✅ |

**Note**: INDB has both `folate_ug` (total folate) and `vitb9_ug` (folic acid/synthetic form).

---

## Summary

| Category | Count | Notes |
|----------|-------|-------|
| Energy | 2 | kcal (canonical) and kJ (non-canonical) |
| Macronutrients | 5 | Includes free sugars |
| Lipids | 4 | SFA/MUFA/PUFA in mg (non-canonical) |
| Minerals | 12 | Cr/Mo in mg (non-canonical unit) |
| Fat-Soluble Vitamins | 7 | Includes D2, D3, K1, K2 separately |
| Water-Soluble Vitamins | 9 | Folate and Folic Acid separately |
| **Total** | **39** | |

---

## New Compounds Needed

**None** - All 39 INDB nutrients map to existing compounds in the database.

---

## Non-Canonical Mappings

The following mappings are marked non-canonical due to unit differences:

| INDB Column | INDB Unit | Nutri Unit | Conversion Factor |
|-------------|-----------|------------|-------------------|
| energy_kj | kJ | kcal | 0.239 |
| sfa_mg | mg | g | 0.001 |
| mufa_mg | mg | g | 0.001 |
| pufa_mg | mg | g | 0.001 |
| chromium_mg | mg | µg | 1000 |
| molybdenum_mg | mg | µg | 1000 |

---

## Integration Status

- [x] Download INDB files from GitHub
- [x] Analyze Stata script for nutrient columns
- [x] Create mapping tracker
- [x] Create add-indb-compounds.ts script
- [x] Run script (39 mappings created, 0 new compounds)
- [x] Update DATA_SOURCES.md

**Completed**: 2026-01-16
