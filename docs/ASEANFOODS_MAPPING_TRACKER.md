# ASEANFOODS to Nutri Compound Mapping Tracker

## Source Information

- **Database**: ASEAN Food Composition Database, Electronic Version 1
- **Publisher**: ASEANFOODS / Institute of Nutrition, Mahidol University, Thailand
- **Year**: 2014 (electronic), 2000 (original print)
- **Foods**: 616 (electronic) / 1,740 (original print)
- **Countries**: Indonesia, Malaysia, Philippines, Singapore, Thailand, Vietnam
- **Nutrients**: 21 (20 components + energy)
- **Format**: PDF only
- **License**: Non-commercial free with attribution
- **Website**: http://www.inmu.mahidol.ac.th/aseanfoods
- **Download**: https://inmu.mahidol.ac.th/aseanfoods/doc/OnlineASEAN_FCD_V1_2014.pdf

---

## Progress: 21/21 mapped (100%)

---

## INFOODS Tagnames Used

ASEANFOODS uses standard INFOODS tagnames for nutrient identification:

| # | INFOODS Tag | Description | Unit | Nutri Compound | Canonical? | Status |
|---|-------------|-------------|------|----------------|------------|--------|
| 1 | WATER | Moisture | g | Water | Yes | ✅ |
| 2 | PROCNT | Protein (total N × factor) | g | Protein | Yes | ✅ |
| 3 | FAT | Total fat | g | Total Fat | Yes | ✅ |
| 4 | FIBTG | Total dietary fibre | g | Total Fiber | Yes | ✅ |
| 5 | CHOAVLDF | Available carbohydrate (by diff) | g | Available Carbohydrate | Yes | ✅ |
| 6 | CHOCDF | Total carbohydrate (by diff) | g | Total Carbohydrate | Yes | ✅ |
| 7 | ASH | Ash | g | Ash | Yes | ✅ |
| 8 | ENERC | Energy | kcal | Energy | Yes | ✅ |
| 9 | CA | Calcium | mg | Calcium | Yes | ✅ |
| 10 | P | Phosphorus | mg | Phosphorus | Yes | ✅ |
| 11 | FE | Iron | mg | Iron | Yes | ✅ |
| 12 | NA | Sodium | mg | Sodium | Yes | ✅ |
| 13 | K | Potassium | mg | Potassium | Yes | ✅ |
| 14 | CU | Copper | mg | Copper | Yes | ✅ |
| 15 | ZN | Zinc | mg | Zinc | Yes | ✅ |
| 16 | THIA | Thiamin (B1) | mg | Thiamin | Yes | ✅ |
| 17 | RIBF | Riboflavin (B2) | mg | Riboflavin | Yes | ✅ |
| 18 | NIA | Niacin (B3) | mg | Niacin | Yes | ✅ |
| 19 | VITC | Vitamin C | mg | Vitamin C | Yes | ✅ |
| 20 | RETOL | Retinol | µg | Retinol | Yes | ✅ |
| 21 | CARTB | Beta-carotene | µg | Beta-Carotene | Yes | ✅ |
| 22 | VITA_RAE | Vitamin A (RAE) | µg | Vitamin A | Yes | ✅ |

**Note**: CHOCDF and CHOAVLDF are alternatives (total vs available carbohydrate). Both are mapped.

---

## Summary

| Category | Count | Nutrients |
|----------|-------|-----------|
| Macronutrients | 6 | Water, Protein, Fat, Carbohydrates (2), Fiber |
| Energy | 1 | Energy |
| Minerals | 8 | Ca, P, Fe, Na, K, Cu, Zn, Ash |
| B Vitamins | 3 | Thiamin, Riboflavin, Niacin |
| Vitamin C | 1 | Ascorbic acid |
| Vitamin A | 3 | Retinol, Beta-carotene, Vitamin A (RAE) |
| **Total** | **22** | (21 unique, with CHO alternatives) |

---

## New Compounds Required

**None** - All ASEANFOODS nutrients map to existing compounds.

---

## Data Limitations

1. **PDF only**: No machine-readable format (CSV/Excel/API) available
2. **Limited nutrients**: Only 21 nutrients vs 50+ in other databases
3. **No micronutrients**: Missing selenium, iodine, vitamin D, vitamin E, folate, B12
4. **Dated**: Electronic version from 2014, data from 2000
5. **Regional variation**: Values are averages across 6 countries

---

## Integration Status

- [x] Download PDF from Mahidol University
- [x] Analyze nutrient structure
- [x] Map to existing compounds
- [x] Create add-aseanfoods-compounds.ts script
- [x] Run script (21 mappings created)
- [x] Update DATA_SOURCES.md

**Completed**: 2026-01-16
