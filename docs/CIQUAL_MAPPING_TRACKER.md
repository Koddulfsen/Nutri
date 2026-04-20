# CIQUAL (France) to Nutri Compound Mapping Tracker

**Source**: ANSES Ciqual French Food Composition Table 2025
**URL**: https://zenodo.org/records/17550133
**License**: Open Data (citation required: "Anses. 2025. Ciqual French food composition table")
**Total Nutrients**: 75
**Foods**: 3,484

---

## Progress: 71/75 mapped ✅

**Completed**: 2026-01-14
**New Compounds Added**: 4 (Total Organic Acids, Intrinsic Folate, Polyols, Folate DFE)
**Mappings Created**: 71
**Skipped**: 4 (Jones factor variants, Salt derived from Na)

---

## INFOODS Tagnames Reference

CIQUAL uses INFOODS standardized tagnames which map well to our existing compounds.

---

## 1. Energy (4 nutrients)

| # | INFOODS | CIQUAL ID | Name | Nutri Compound | Canonical? | Status |
|---|---------|-----------|------|----------------|------------|--------|
| 1 | ENERC | 327 | Energy (kJ) | Energy | No | ✅ |
| 2 | ENERC | 328 | Energy (kcal) | Energy | Yes | ✅ |
| 3 | ENERC | 332 | Energy, Jones factor (kJ) | SKIP (variant) | - | ⏭️ |
| 4 | ENERC | 333 | Energy, Jones factor (kcal) | SKIP (variant) | - | ⏭️ |

---

## 2. Proximates (8 nutrients)

| # | INFOODS | CIQUAL ID | Name | Nutri Compound | Canonical? | Status |
|---|---------|-----------|------|----------------|------------|--------|
| 1 | WATER | 400 | Water | Water | Yes | ✅ |
| 2 | ASH | 10000 | Ash | Ash | Yes | ✅ |
| 3 | - | 10004 | Salt | SKIP (derived from Na) | - | ⏭️ |
| 4 | PROCNT | 25000 | Protein | Protein | Yes | ✅ |
| 5 | PROCNT | 25003 | Protein, crude N×6.25 | Protein | No | ✅ |
| 6 | CHOAVL | 31000 | Carbohydrate | Total Carbohydrate | Yes | ✅ |
| 7 | FAT | 40000 | Fat | Total Fat | Yes | ✅ |
| 8 | ALC | 60000 | Alcohol | Alcohol | Yes | ✅ |

---

## 3. Carbohydrates (9 nutrients)

| # | INFOODS | CIQUAL ID | Name | Nutri Compound | Canonical? | Status |
|---|---------|-----------|------|----------------|------------|--------|
| 1 | SUGAR | 32000 | Sugars | Total Sugars | Yes | ✅ |
| 2 | FRUS | 32210 | Fructose | Fructose | Yes | ✅ |
| 3 | GALS | 32220 | Galactose | Galactose | Yes | ✅ |
| 4 | GLUS | 32250 | Glucose | Glucose | Yes | ✅ |
| 5 | LACS | 32410 | Lactose | Lactose | Yes | ✅ |
| 6 | MALS | 32430 | Maltose | Maltose | Yes | ✅ |
| 7 | SUCS | 32480 | Sucrose | Sucrose | Yes | ✅ |
| 8 | STARCH | 33110 | Starch | Starch | Yes | ✅ |
| 9 | POLYL | 34000 | Polyols | Polyols | Yes | ✅ |
| 10 | FIB- | 34100 | Fibres | Total Fiber | Yes | ✅ |
| 11 | OA | 65000 | Organic acids | Total Organic Acids | Yes | ✅ |

---

## 4. Fatty Acids (18 nutrients)

| # | INFOODS | CIQUAL ID | Name | Nutri Compound | Canonical? | Status |
|---|---------|-----------|------|----------------|------------|--------|
| 1 | FASAT | 40302 | FA saturated | Saturated Fat | Yes | ✅ |
| 2 | FAMS | 40303 | FA mono | Monounsaturated Fat | Yes | ✅ |
| 3 | FAPU | 40304 | FA poly | Polyunsaturated Fat | Yes | ✅ |
| 4 | F4D0 | 40400 | FA 4:0 | Butyric Acid | Yes | ✅ |
| 5 | F6D0 | 40600 | FA 6:0 | Caproic Acid | Yes | ✅ |
| 6 | F8D0 | 40800 | FA 8:0 | Caprylic Acid | Yes | ✅ |
| 7 | F10D0 | 41000 | FA 10:0 | Capric Acid | Yes | ✅ |
| 8 | F12D0 | 41200 | FA 12:0 | Lauric Acid | Yes | ✅ |
| 9 | F14D0 | 41400 | FA 14:0 | Myristic Acid | Yes | ✅ |
| 10 | F16D0 | 41600 | FA 16:0 | Palmitic Acid | Yes | ✅ |
| 11 | F18D0 | 41800 | FA 18:0 | Stearic Acid | Yes | ✅ |
| 12 | F18D1CN9 | 41819 | FA 18:1 n-9 cis | Oleic Acid (cis) | Yes | ✅ |
| 13 | F18D2CN6 | 41826 | FA 18:2 n-6 cis | Linoleic Acid (cis,cis) | Yes | ✅ |
| 14 | F18D3N3 | 41833 | FA 18:3 n-3 | Alpha-Linolenic Acid | Yes | ✅ |
| 15 | F20D4N6 | 42046 | FA 20:4 n-6 (AA) | Arachidonic Acid | Yes | ✅ |
| 16 | F20D5N3 | 42053 | FA 20:5 n-3 (EPA) | Eicosapentaenoic Acid | Yes | ✅ |
| 17 | F22D6N3 | 42263 | FA 22:6 n-3 (DHA) | Docosahexaenoic Acid | Yes | ✅ |
| 18 | CHOL- | 75100 | Cholesterol | Cholesterol | Yes | ✅ |

---

## 5. Minerals (12 nutrients)

| # | INFOODS | CIQUAL ID | Name | Nutri Compound | Canonical? | Status |
|---|---------|-----------|------|----------------|------------|--------|
| 1 | NA | 10110 | Sodium | Sodium | Yes | ✅ |
| 2 | MG | 10120 | Magnesium | Magnesium | Yes | ✅ |
| 3 | P | 10150 | Phosphorus | Phosphorus | Yes | ✅ |
| 4 | CLD | 10170 | Chloride | Chloride | Yes | ✅ |
| 5 | K | 10190 | Potassium | Potassium | Yes | ✅ |
| 6 | CA | 10200 | Calcium | Calcium | Yes | ✅ |
| 7 | MN | 10251 | Manganese | Manganese | Yes | ✅ |
| 8 | FE | 10260 | Iron | Iron | Yes | ✅ |
| 9 | CU | 10290 | Copper | Copper | Yes | ✅ |
| 10 | ZN | 10300 | Zinc | Zinc | Yes | ✅ |
| 11 | SE | 10340 | Selenium | Selenium | Yes | ✅ |
| 12 | ID | 10530 | Iodine | Iodine | Yes | ✅ |

---

## 6. Vitamins (23 nutrients)

| # | INFOODS | CIQUAL ID | Name | Nutri Compound | Canonical? | Status |
|---|---------|-----------|------|----------------|------------|--------|
| 1 | RAE | 51104 | Vitamin A (RAE) | Vitamin A | Yes | ✅ |
| 2 | RETOL | 51200 | Retinol | Retinol | Yes | ✅ |
| 3 | CARTB | 51330 | Beta-carotene | Beta-Carotene | Yes | ✅ |
| 4 | VITD- | 52100 | Vitamin D | Vitamin D | Yes | ✅ |
| 5 | ERGCAL | 52200 | Vitamin D2 (ergocalciferol) | Vitamin D2 | Yes | ✅ |
| 6 | CHOCAL | 52300 | Vitamin D3 (cholecalciferol) | Vitamin D3 | Yes | ✅ |
| 7 | VITE- | 53100 | Vitamin E | Vitamin E | Yes | ✅ |
| 8 | TOCPHA | 71010 | Alpha-tocopherol | Alpha-Tocopherol | Yes | ✅ |
| 9 | VITK1 | 54101 | Vitamin K1 | Vitamin K | Yes | ✅ |
| 10 | VITK2 | 54104 | Vitamin K2 | Vitamin K2 | Yes | ✅ |
| 11 | VITC | 55100 | Vitamin C | Vitamin C | Yes | ✅ |
| 12 | THIA | 56100 | Vitamin B1 (Thiamin) | Thiamin | Yes | ✅ |
| 13 | RIBF | 56200 | Vitamin B2 (Riboflavin) | Riboflavin | Yes | ✅ |
| 14 | NIA | 56310 | Vitamin B3 (Niacin) | Niacin | Yes | ✅ |
| 15 | PANTAC | 56400 | Vitamin B5 (Pantothenic acid) | Pantothenic Acid | Yes | ✅ |
| 16 | VITB6- | 56500 | Vitamin B6 | Vitamin B6 | Yes | ✅ |
| 17 | VITB12 | 56600 | Vitamin B12 | Vitamin B12 | Yes | ✅ |
| 18 | FOL | 56700 | Total folates | Folate | Yes | ✅ |
| 19 | FOLDFE | 56702 | Dietary folate equivalents (DFE) | Folate (DFE) | Yes | ✅ |
| 20 | FOLFD | 56704 | Intrinsic folate | Intrinsic Folate | Yes | ✅ |
| 21 | FOLAC | 56708 | Folic acid (enrichment) | Folic Acid | Yes | ✅ |

---

## Summary

| Category | Total | Match Existing | Add New | Skip |
|----------|-------|----------------|---------|------|
| Energy | 4 | 2 | 0 | 2 |
| Proximates | 8 | 7 | 0 | 1 |
| Carbohydrates | 11 | 9 | 2 | 0 |
| Fatty Acids | 18 | 18 | 0 | 0 |
| Minerals | 12 | 12 | 0 | 0 |
| Vitamins | 21 | 19 | 2 | 0 |
| **TOTAL** | **74** | **67** | **4** | **3** |

Note: "Jones factor" column (75th) is metadata not a nutrient.

---

## New Compounds Added ✅

1. **Total Organic Acids** - ORGANIC_ACID - Sum of organic acids in food
2. **Intrinsic Folate** - VITAMIN - Naturally occurring folate (not from fortification)
3. **Polyols** - CARBOHYDRATE - Sugar alcohols (sorbitol, xylitol, mannitol, etc.)
4. **Folate (DFE)** - VITAMIN - Dietary Folate Equivalents - standardized measure of folate activity
