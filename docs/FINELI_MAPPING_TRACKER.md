# Fineli (Finland) Mapping Tracker

**Source**: Finnish Institute for Health and Welfare (THL)
**Version**: 20.0 (Basic Package 2)
**Foods**: 4,232
**Components**: 74
**License**: CC-BY 4.0 (Attribution required)
**Format**: CSV (semicolon-delimited)

---

## Component Code System

Fineli uses **EuroFIR standard codes** (EUFDNAME) which are widely used across European food composition databases. This makes mapping relatively straightforward as many codes overlap with other sources we've integrated.

### Code Structure
- Uses standardized EuroFIR/INFOODS codes (ENERC, FAT, PROT, etc.)
- Units: G (gram), MG (milligram), UG (microgram), KJ (kilojoule)
- Categories: MACROCMP, CARBOCMP, VITAM, MINERAL, FAT, NITROCMP, NATINHCN

---

## Mapping Progress

**Status**: 74/74 mapped ✅ COMPLETE

**New compounds added**: 6
- Salt
- Total Fatty Acids
- Fatty Acids (TAG Equivalents)
- Niacin Equivalents
- Total Carotenoids
- Sugar Alcohols

---

## Energy & Macronutrients (8 codes)

| Code | Description | Unit | Our Compound | Status |
|------|-------------|------|--------------|--------|
| ENERC | Energy, calculated | KJ | Energy | Map |
| FAT | Fat, total | G | Total Fat | Map |
| CHOAVL | Carbohydrate, available | G | Carbohydrates | Map |
| CHOCDF | Carbohydrate, by difference | G | Carbohydrates (by difference) | Map |
| PROT | Protein, total | G | Protein | Map |
| ALC | Alcohol | G | Alcohol | Map |
| ASH | Ash (minerals) | G | Ash | Map |
| WATER | Water (moisture) | G | Water | Map |

---

## Carbohydrate Components (14 codes)

| Code | Description | Unit | Our Compound | Status |
|------|-------------|------|--------------|--------|
| OA | Organic acids, total | G | Organic Acids | Map |
| SUGOH | Sugar alcohols | G | Sugar Alcohols | Map |
| SUGAR | Sugars, total | G | Total Sugars | Map |
| FRUS | Fructose | G | Fructose | Map |
| GALS | Galactose | G | Galactose | Map |
| GLUS | Glucose | G | Glucose | Map |
| LACS | Lactose | G | Lactose | Map |
| MALS | Maltose | G | Maltose | Map |
| SUCS | Sucrose | G | Sucrose | Map |
| STARCH | Starch, total | G | Starch | Map |
| FIBC | Fibre, total (crude) | G | Fiber | Map |
| FIBT | Fibre, total dietary | G | Dietary Fiber | Map |
| FIBINS | Fibre, water-insoluble | G | Insoluble Fiber | Map |
| PSACNCS | Polysaccharides, non-cellulosic, water-soluble | G | Soluble Fiber | Map |

---

## Vitamins (15 codes)

| Code | Description | Unit | Our Compound | Status |
|------|-------------|------|--------------|--------|
| FOL | Folate, total | UG | Folate | Map |
| NIAEQ | Niacin equivalents, total | MG | Niacin Equivalents | Map |
| NIA | Niacin, preformed | MG | Niacin | Map |
| VITPYRID | Vitamers pyridoxine | MG | Vitamin B6 | Map |
| RIBF | Riboflavin | MG | Riboflavin | Map |
| THIA | Thiamin (B1) | MG | Thiamin | Map |
| VITA | Vitamin A (RAE) | UG | Vitamin A | Map |
| RETOL | Retinol | UG | Retinol | Map |
| CAROTENS | Carotenoids, total | UG | Carotenoids | Map |
| CARTB | Beta-carotene, total | UG | Beta-Carotene | Map |
| VITB12 | Vitamin B-12 (cobalamin) | UG | Vitamin B12 | Map |
| VITC | Vitamin C (ascorbic acid) | MG | Vitamin C | Map |
| VITD | Vitamin D | UG | Vitamin D | Map |
| VITE | Vitamin E (alpha-tocopherol) | MG | Vitamin E | Map |
| VITK | Vitamin K, total | UG | Vitamin K | Map |

---

## Minerals (16 codes)

| Code | Description | Unit | Our Compound | Status |
|------|-------------|------|--------------|--------|
| CA | Calcium | MG | Calcium | Map |
| CR | Chromium | UG | Chromium | Map |
| CU | Copper | MG | Copper | Map |
| FD | Fluoride | MG | Fluoride | Map |
| FE | Iron, total | MG | Iron | Map |
| ID | Iodide (Iodine) | UG | Iodine | Map |
| K | Potassium | MG | Potassium | Map |
| MG | Magnesium | MG | Magnesium | Map |
| MN | Manganese | MG | Manganese | Map |
| MO | Molybdenum | MG | Molybdenum | Map |
| NA | Sodium | MG | Sodium | Map |
| NACL | Salt | MG | Salt | NEW |
| NT | Nitrogen, total | G | Nitrogen | Map |
| P | Phosphorus | MG | Phosphorus | Map |
| SE | Selenium, total | UG | Selenium | Map |
| ZN | Zinc | MG | Zinc | Map |

---

## Lipids & Fatty Acids (21 codes)

| Code | Description | Unit | Our Compound | Status |
|------|-------------|------|--------------|--------|
| FAFRE | Fatty acids, total | G | Total Fatty Acids | Map |
| FACIDCTG | Fatty acids, as TAG equivalents | G | Fatty Acids (TAG) | NEW |
| FAPU | Fatty acids, polyunsaturated | G | Polyunsaturated Fat | Map |
| FAMCIS | Fatty acids, monounsaturated cis | G | Monounsaturated Fat | Map |
| FASAT | Fatty acids, saturated | G | Saturated Fat | Map |
| FATRN | Fatty acids, trans | G | Trans Fat | Map |
| FAPUN3 | Fatty acids, n-3 polyunsaturated | G | Omega-3 Fatty Acids | Map |
| FAPUN6 | Fatty acids, n-6 polyunsaturated | G | Omega-6 Fatty Acids | Map |
| FAS18 | Fatty acid isomers 18:0 | G | Stearic Acid | Map |
| F16D0T | Fatty acid isomers 16:0 | MG | Palmitic Acid | Map |
| F18D1T | Fatty acid isomers 18:1 | MG | Oleic Acid | Map |
| F18D2CN6 | Linoleic acid (18:2 n-6) | MG | Linoleic Acid | Map |
| F18D3N3 | Alpha-linolenic acid (18:3 n-3) | MG | Alpha-Linolenic Acid | Map |
| F20D4N6 | Arachidonic acid (20:4 n-6) | MG | Arachidonic Acid | Map |
| F20D5N3 | EPA (20:5 n-3) | MG | Eicosapentaenoic Acid | Map |
| F22D6N3 | DHA (22:6 n-3) | MG | Docosahexaenoic Acid | Map |
| CHOLE | Cholesterol (GC) | MG | Cholesterol | Map |
| STERT | Sterols, total | MG | Total Plant Sterols | Map |

---

## Nitrogen Components (2 codes)

| Code | Description | Unit | Our Compound | Status |
|------|-------------|------|--------------|--------|
| NT | Nitrogen, total | G | Nitrogen | Map |
| TRP | Tryptophan | MG | Tryptophan | Map |

---

## Flavonoids (2 codes)

| Code | Description | Unit | Our Compound | Status |
|------|-------------|------|--------------|--------|
| MYRIC | Myricetin | UG | Myricetin | Map |
| QUERCE | Quercetin | UG | Quercetin | Map |

---

## New Compounds to Add

Based on the component list, these compounds may need to be added:

1. **Salt** (NACL) - Sodium chloride equivalent
2. **Fatty Acids (TAG equivalents)** (FACIDCTG) - Calculated as triglyceride equivalents

---

## Mapping Notes

### EuroFIR Code Overlap

Many Fineli codes are already mapped from other sources:
- ENERC, FAT, PROT, CHOAVL - Standard macronutrients (USDA, CNF, etc.)
- Vitamin codes (VITA, VITC, VITD, etc.) - Standard vitamin identifiers
- Mineral codes (CA, FE, MG, etc.) - Standard element symbols
- Fatty acid codes (F18D2CN6, F20D5N3, etc.) - INFOODS lipid naming

### Unit Differences

Some Fineli units differ from our standard:
- Energy in KJ (we use kcal primarily) - May need both mappings
- Some fatty acids in MG vs G

### License Compliance

Attribution required: "Finnish Institute for Health and Welfare, Fineli"

---

## Files Reference

| File | Contents |
|------|----------|
| component.csv | Component definitions (74 codes) |
| component_value.csv | Actual nutrient values per food |
| eufdname_EN.csv | English component names (369 codes) |
| food.csv | Food items (4,232) |
| foodname_EN.csv | English food names |

---

## Integration Checklist

- [x] Download Fineli Basic Package 2
- [x] Extract and analyze structure
- [x] Create mapping tracker
- [x] Create mapping script
- [x] Run compound additions (6 new)
- [x] Create external source mappings (74 total)
- [x] Update DATA_SOURCES.md
