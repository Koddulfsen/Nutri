# Matvaretabellen (Norway) Mapping Tracker

**Source**: Norwegian Food Safety Authority (Mattilsynet)
**Version**: 2024 (annual updates)
**Foods**: 2,137
**Components**: 57
**License**: Free with attribution
**Format**: REST API (JSON/EDN)
**API URL**: https://www.matvaretabellen.no/api/

---

## API Structure

Matvaretabellen provides a public REST API with no authentication required.

### Endpoints
- `/api/en/nutrients.json` - Nutrient definitions with EuroFIR codes
- `/api/en/foods.json` - All food items
- `/api/en/food-groups.json` - Food group hierarchy
- `/api/en/sources.json` - Data sources

### Key Features
- EuroFIR standard codes
- Hierarchical nutrient organization (parent-child relationships)
- Norwegian and English versions
- Annual autumn updates

---

## Mapping Progress

**Status**: 57/57 mapped ✅ COMPLETE

**New compounds added**: 0 (all map to existing compounds)

**Note**: Matvaretabellen uses slightly different EuroFIR notation than BLS/NEVO (e.g., F18:3N3 vs F18:3CN3), but these map to the same compounds.

---

## Energy & Macronutrients (7 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| WATER | Water | g | Water | Yes |
| FAT | Fat | g | Total Fat | Yes |
| CHO | Carbohydrate | g | Total Carbohydrate | Yes |
| FIBT | Dietary fibre | g | Total Fiber | Yes |
| PROT | Protein | g | Protein | Yes |
| ALC | Alcohol | g | Alcohol | Yes |
| NACL | Salt (NaCl) | g | Salt | Yes |

---

## Carbohydrates (5 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| STARCH | Starch | g | Starch | Yes |
| SUGAR | Sugar, total | g | Total Sugars | Yes |
| SUGAD | Sugar, added | g | Added Sugars | Yes |
| SUGAN | Sugar, free | g | Free Sugars | Yes |

---

## Fatty Acid Clusters (7 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| FASAT | Saturated fatty acids | g | Saturated Fat | Yes |
| FAMS | Monounsaturated fatty acids | g | Monounsaturated Fat | Yes |
| FAPU | Polyunsaturated fatty acids | g | Polyunsaturated Fat | Yes |
| FATRS | Trans fatty acids | g | Trans Fat | Yes |
| FAN3 | Omega-3 | g | Omega-3 Fatty Acids | Yes |
| FAN6 | Omega-6 | g | Omega-6 Fatty Acids | Yes |
| CHORL | Cholesterol | mg | Cholesterol | Yes |

---

## Saturated Fatty Acids (4 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| F12:0 | C12:0 (lauric acid) | g | Lauric Acid | Yes |
| F14:0 | C14:0 (myristic acid) | g | Myristic Acid | Yes |
| F16:0 | C16:0 (palmitic acid) | g | Palmitic Acid | Yes |
| F18:0 | C18:0 (stearic acid) | g | Stearic Acid | Yes |

---

## Monounsaturated Fatty Acids (2 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| F16:1 | C16:1 sum (palmitoleic acid) | g | Palmitoleic Acid | Yes |
| F18:1 | C18:1 sum (oleic acid) | g | Oleic Acid | Yes |

---

## Polyunsaturated Fatty Acids (10 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| F18:2CN6 | C18:2n-6 (linoleic acid) | g | Linoleic Acid | Yes |
| F18:3N3 | C18:3n-3 (alpha-linolenic acid) | g | Alpha-Linolenic Acid | Yes |
| F20:3N3 | C20:3n-3 (eicosatrienoic acid) | g | Eicosatrienoic Acid (n-3) | Yes |
| F20:3N6 | C20:3n-6 (DGLA) | g | Dihomo-gamma-linolenic Acid | Yes |
| F20:4N3 | C20:4n-3 (eicosatetraenoic acid) | g | Eicosatetraenoic Acid (n-3) | Yes |
| F20:4N6 | C20:4n-6 (arachidonic acid) | g | Arachidonic Acid | Yes |
| F20:5N3 | C20:5n-3 (EPA) | g | Eicosapentaenoic Acid | Yes |
| F22:5N3 | C22:5n-3 (DPA) | g | Docosapentaenoic Acid | Yes |
| F22:6N3 | C22:6n-3 (DHA) | g | Docosahexaenoic Acid | Yes |

---

## Minerals (11 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| CA | Calcium (Ca) | mg | Calcium | Yes |
| FE | Iron (Fe) | mg | Iron | Yes |
| NA | Sodium (Na) | mg | Sodium | Yes |
| K | Potassium (K) | mg | Potassium | Yes |
| MG | Magnesium (Mg) | mg | Magnesium | Yes |
| ZN | Zinc (Zn) | mg | Zinc | Yes |
| SE | Selenium (Se) | µg | Selenium | Yes |
| CU | Copper (Cu) | mg | Copper | Yes |
| P | Phosphorus (P) | mg | Phosphorus | Yes |
| ID | Iodine (I) | µg | Iodine | Yes |

---

## Vitamins (14 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| VITA | Vitamin A (RAE) | RAE | Vitamin A | Yes |
| VITARE | Vitamin A (RE) | RE | Vitamin A | No |
| RETOL | Retinol | µg | Retinol | Yes |
| CARTB | Beta-carotene | µg | Beta-Carotene | Yes |
| VITD | Vitamin D | µg | Vitamin D | Yes |
| VITE | Vitamin E | mg | Vitamin E | Yes |
| THIA | Thiamin (B1) | mg | Thiamin | Yes |
| RIBF | Riboflavin (B2) | mg | Riboflavin | Yes |
| NIA | Niacin (B3) | mg | Niacin | Yes |
| NIAEQ | Niacin equivalents | mg | Niacin Equivalents | Yes |
| VITB6 | Pyridoxine (B6) | mg | Vitamin B6 | Yes |
| FOL | Folate (B9) | µg | Folate | Yes |
| VITB12 | Cobalamin (B12) | µg | Vitamin B12 | Yes |
| VITC | Ascorbic acid (C) | mg | Vitamin C | Yes |

---

## Integration Checklist

- [x] Research Matvaretabellen API
- [x] Download nutrients via API
- [x] Analyze component structure (57 nutrients)
- [x] Create mapping tracker
- [x] Create mapping script
- [x] Run mappings (57 created)
- [x] Update DATA_SOURCES.md
