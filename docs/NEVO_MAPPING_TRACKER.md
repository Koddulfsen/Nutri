# NEVO 2025 (Netherlands) Mapping Tracker

**Source**: RIVM (National Institute for Public Health and the Environment)
**Version**: 2025/9.0 (November 2025)
**Foods**: 2,328
**Components**: 137 (unique codes)
**License**: Free with terms agreement (CC-BY 4.0 style)
**Format**: CSV/Excel (pipe-delimited)

---

## Component Code System

NEVO uses **EuroFIR standard codes** which overlap significantly with BLS (Germany) and Fineli (Finland). The database is pipe-delimited with Dutch and English names.

### Key Features
- Detailed fatty acid breakdown (73 fatty acid codes)
- Plant vs animal protein distinction
- Haem vs non-haem iron
- Free sugars (new 2025)
- Carotenoid subfractions (alpha-carotene, lutein, zeaxanthin, lycopene)
- 25-hydroxyvitamin D3

---

## Mapping Progress

**Status**: 118/137 mapped ✅ COMPLETE

**New compounds added**: 7
- Plant Protein
- Animal Protein
- Cerotic Acid (C26:0)
- Tetracosadienoic Acid (C24:2 n-6)
- Heme Iron
- Non-Heme Iron
- Mead Acid (C20:3 n-9)

**Skipped**: 19 (remainder categories, minor trans FA isomers, unidentified FAs)

---

## Energy & Macronutrients (10 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| ENERCJ | Energy kJ | kJ | Energy | No |
| ENERCC | Energy kcal | kcal | Energy | Yes |
| WATER | Water total | g | Water | Yes |
| PROT | Protein total | g | Protein | Yes |
| FAT | Fat total | g | Total Fat | Yes |
| CHO | Carbohydrate available | g | Total Carbohydrate | Yes |
| FIBT | Fibre dietary total | g | Total Fiber | Yes |
| ALC | Alcohol total | g | Alcohol | Yes |
| OA | Organic acids total | g | Total Organic Acids | Yes |
| ASH | Ash | g | Ash | Yes |

---

## Protein Fractions (4 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| PROT | Protein total | g | Protein | Yes |
| PROTPL | Protein plant | g | *NEW* Plant Protein | Yes |
| PROTAN | Protein animal | g | *NEW* Animal Protein | Yes |
| NT | Nitrogen total | g | Nitrogen | Yes |

---

## Amino Acids (1 code)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| TRP | Tryptophan | mg | Tryptophan | Yes |

---

## Carbohydrates (6 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| SUGAR | Sugars total | g | Total Sugars | Yes |
| NVSUGAF | Free sugars | g | Free Sugars | Yes |
| STARCH | Starch total | g | Starch | Yes |
| POLYL | Polyols total | g | Sugar Alcohols | Yes |
| FIBT | Fibre dietary total | g | Total Fiber | Yes |
| CHO | Carbohydrate available | g | Total Carbohydrate | Yes |

---

## Fatty Acid Clusters (8 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| FAT | Fat total | g | Total Fat | Yes |
| FACID | Fatty acids total | g | Total Fatty Acids | Yes |
| FASAT | Fatty acids saturated total | g | Saturated Fat | Yes |
| FAMSCIS | Fatty acids monounsaturated cis total | g | Monounsaturated Fat | Yes |
| FAPU | Fatty acids polyunsaturated total | g | Polyunsaturated Fat | Yes |
| FAPUN3 | Fatty acids n-3 polyunsaturated cis | g | Omega-3 Fatty Acids | Yes |
| FAPUN6 | Fatty acids n-6 polyunsaturated cis | g | Omega-6 Fatty Acids | Yes |
| FATRS | Fatty acids trans total | g | Trans Fat | Yes |

---

## Saturated Fatty Acids (22 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| F4:0 | C4:0 (Butyric) | g | Butyric Acid | Yes |
| F6:0 | C6:0 (Caproic) | g | Caproic Acid | Yes |
| F8:0 | C8:0 (Caprylic) | g | Caprylic Acid | Yes |
| F10:0 | C10:0 (Capric) | g | Capric Acid | Yes |
| F11:0 | C11:0 (Undecanoic) | g | Undecanoic Acid | Yes |
| F12:0 | C12:0 (Lauric) | g | Lauric Acid | Yes |
| F13:0 | C13:0 (Tridecanoic) | g | Tridecanoic Acid | Yes |
| F14:0 | C14:0 (Myristic) | g | Myristic Acid | Yes |
| F15:0 | C15:0 (Pentadecanoic) | g | Pentadecanoic Acid | Yes |
| F16:0 | C16:0 (Palmitic) | g | Palmitic Acid | Yes |
| F17:0 | C17:0 (Margaric) | g | Margaric Acid | Yes |
| F18:0 | C18:0 (Stearic) | g | Stearic Acid | Yes |
| F19:0 | C19:0 (Nonadecanoic) | g | Nonadecanoic Acid | Yes |
| F20:0 | C20:0 (Arachidic) | g | Arachidic Acid | Yes |
| F21:0 | C21:0 (Heneicosanoic) | g | Heneicosanoic Acid | Yes |
| F22:0 | C22:0 (Behenic) | g | Behenic Acid | Yes |
| F23:0 | C23:0 (Tricosanoic) | g | Tricosanoic Acid | Yes |
| F24:0 | C24:0 (Lignoceric) | g | Lignoceric Acid | Yes |
| F25:0 | C25:0 (Pentacosanoic) | g | Pentacosanoic Acid | Yes |
| F26:0 | C26:0 (Cerotic) | g | *NEW* Cerotic Acid | Yes |
| FASATXR | Saturated remainder | g | *SKIP* | - |

---

## Monounsaturated Fatty Acids - cis (10 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| F10:1CIS | C10:1 cis | g | Decenoic Acid | Yes |
| F12:1CIS | C12:1 cis | g | Dodecenoic Acid | Yes |
| F14:1CIS | C14:1 cis | g | Myristoleic Acid | Yes |
| F16:1CIS | C16:1 cis | g | Palmitoleic Acid | Yes |
| F18:1CIS | C18:1 cis | g | Oleic Acid | Yes |
| F20:1CIS | C20:1 cis | g | Gondoic Acid | Yes |
| F22:1CIS | C22:1 cis | g | Erucic Acid | Yes |
| F24:1CIS | C24:1 cis | g | Nervonic Acid | Yes |
| FAMSCXR | MUFA cis remainder | g | *SKIP* | - |

---

## Omega-3 Fatty Acids (12 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| F18:3CN3 | C18:3 n-3 (ALA) | g | Alpha-Linolenic Acid | Yes |
| F18:4CN3 | C18:4 n-3 (Stearidonic) | g | Stearidonic Acid | Yes |
| F20:3CN3 | C20:3 n-3 | g | Eicosatrienoic Acid (n-3) | Yes |
| F20:4CN3 | C20:4 n-3 | g | Eicosatetraenoic Acid | Yes |
| F20:5CN3 | C20:5 n-3 (EPA) | g | Eicosapentaenoic Acid | Yes |
| F21:5CN3 | C21:5 n-3 (HPA) | g | Heneicosapentaenoic Acid | Yes |
| F22:2CN3 | C22:2 n-3 | g | Docosadienoic Acid | Yes |
| F22:3CN3 | C22:3 n-3 | g | Docosatrienoic Acid | Yes |
| F22:5CN3 | C22:5 n-3 (DPA) | g | Docosapentaenoic Acid | Yes |
| F22:6CN3 | C22:6 n-3 (DHA) | g | Docosahexaenoic Acid | Yes |

---

## Omega-6 Fatty Acids (11 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| F18:2CN6 | C18:2 n-6 (Linoleic) | g | Linoleic Acid | Yes |
| F18:3CN6 | C18:3 n-6 (GLA) | g | Gamma-Linolenic Acid | Yes |
| F20:2CN6 | C20:2 n-6 | g | Eicosadienoic Acid | Yes |
| F20:3CN6 | C20:3 n-6 (DGLA) | g | Dihomo-gamma-linolenic Acid | Yes |
| F20:4CN6 | C20:4 n-6 (Arachidonic) | g | Arachidonic Acid | Yes |
| F22:2CN6 | C22:2 n-6 | g | Docosadienoic Acid (n-6) | Yes |
| F22:4CN6 | C22:4 n-6 (Adrenic) | g | Adrenic Acid | Yes |
| F22:5CN6 | C22:5 n-6 (Osbond) | g | Docosapentaenoic Acid (n-6) | Yes |
| F24:2CN6 | C24:2 n-6 | g | *NEW* Tetracosadienoic Acid | Yes |

---

## Other Polyunsaturated Fatty Acids (6 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| F18:2CN9 | C18:2 n-9 | g | Eicosadienoic Acid (n-9) | Yes |
| F18:2CT | C18:2 cis-trans | g | *SKIP* | - |
| F18:2TC | C18:2 trans-cis | g | *SKIP* | - |
| F18:2R | C18:2 remainder | g | *SKIP* | - |
| F20:3CN9 | C20:3 n-9 (Mead) | g | Mead Acid | Yes |
| FAPUXR | PUFA remainder | g | *SKIP* | - |

---

## Trans Fatty Acids (12 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| FATRS | Trans total | g | Trans Fat | Yes |
| F10:1TRS | C10:1 trans | g | *SKIP* | - |
| F12:1TRS | C12:1 trans | g | *SKIP* | - |
| F14:1TRS | C14:1 trans | g | *SKIP* | - |
| F16:1TRS | C16:1 trans | g | *SKIP* | - |
| F18:1TRS | C18:1 trans | g | Trans Fat (Monoenoic) | Yes |
| F18:2TTN6 | C18:2 n-6 trans | g | Trans Fat (Polyenoic) | Yes |
| F18:3TTTN3 | C18:3 n-3 trans | g | *SKIP* | - |
| F20:1TRS | C20:1 trans | g | *SKIP* | - |
| F20:2TT | C20:2 n-6 trans | g | *SKIP* | - |
| F22:1TRS | C22:1 trans | g | *SKIP* | - |
| F24:1TRS | C24:1 trans | g | *SKIP* | - |
| FAMSTXR | MUFA trans remainder | g | *SKIP* | - |
| FAUN | Fatty acids unidentified | g | *SKIP* | - |

---

## Cholesterol (1 code)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| CHORL | Cholesterol | mg | Cholesterol | Yes |

---

## Minerals (12 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| NA | Sodium | mg | Sodium | Yes |
| K | Potassium | mg | Potassium | Yes |
| CA | Calcium | mg | Calcium | Yes |
| P | Phosphorus | mg | Phosphorus | Yes |
| MG | Magnesium | mg | Magnesium | Yes |
| FE | Iron total | mg | Iron | Yes |
| HAEM | Iron haem | mg | *NEW* Heme Iron | Yes |
| NHAEM | Iron non-haem | mg | *NEW* Non-Heme Iron | Yes |
| CU | Copper | mg | Copper | Yes |
| SE | Selenium total | µg | Selenium | Yes |
| ZN | Zinc | mg | Zinc | Yes |
| ID | Iodine | µg | Iodine | Yes |

---

## Vitamin A & Carotenoids (9 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| VITA_RAE | Retinol activity equivalents (RAE) | µg | Vitamin A | Yes |
| VITA_RE | Retinol equivalents (RE) | µg | Vitamin A | No |
| RETOL | Retinol | µg | Retinol | Yes |
| CARTBTOT | Beta-carotene | µg | Beta-Carotene | Yes |
| CARTA | Alpha-carotene | µg | Alpha-Carotene | Yes |
| LUTN | Lutein | µg | Lutein | Yes |
| ZEA | Zeaxanthin | µg | Zeaxanthin | Yes |
| CRYPXB | Beta-cryptoxanthin | µg | Beta-Cryptoxanthin | Yes |
| LYCPN | Lycopene | µg | Lycopene | Yes |

---

## Vitamin D (4 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| VITD | Vitamin D total | µg | Vitamin D | Yes |
| ERGCAL | Ergocalciferol (D2) | µg | Vitamin D2 | Yes |
| CHOCAL | Cholecalciferol (D3) | µg | Vitamin D3 | Yes |
| CHOCALOH | 25-hydroxycholecalciferol | µg | 25-Hydroxycholecalciferol | Yes |

---

## Vitamin E (5 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| VITE | Vitamin E total | µg | Vitamin E | Yes |
| TOCPHA | Alpha-tocopherol | mg | Alpha-Tocopherol | Yes |
| TOCPHB | Beta-tocopherol | mg | Beta-Tocopherol | Yes |
| TOCPHD | Delta-tocopherol | mg | Delta-Tocopherol | Yes |
| TOCPHG | Gamma-tocopherol | mg | Gamma-Tocopherol | Yes |

---

## Vitamin K (3 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| VITK | Vitamin K total | µg | Vitamin K | Yes |
| VITK1 | Vitamin K1 | µg | Vitamin K1 | Yes |
| VITK2 | Vitamin K2 | µg | Vitamin K2 | Yes |

---

## Water-Soluble Vitamins (10 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| THIA | Thiamin (B1) | mg | Thiamin | Yes |
| RIBF | Riboflavin (B2) | mg | Riboflavin | Yes |
| VITB6 | Pyridoxin (B6) | mg | Vitamin B6 | Yes |
| VITB12 | Cobalamin (B12) | µg | Vitamin B12 | Yes |
| NIAEQ | Niacin equivalents | mg | Niacin Equivalents | Yes |
| NIA | Niacin (B3) | mg | Niacin | Yes |
| FOL | Dietary folate equivalents | µg | Folate | Yes |
| FOLFD | Folate food | µg | Intrinsic Folate | Yes |
| FOLAC | Folic acid synthetic | µg | Folic Acid | Yes |
| VITC | Ascorbic acid (C) | mg | Vitamin C | Yes |

---

## New Compounds to Add

1. **Plant Protein** (PROTPL) - Protein from plant sources
2. **Animal Protein** (PROTAN) - Protein from animal sources
3. **Cerotic Acid** (F26:0) - C26:0 saturated fatty acid
4. **Tetracosadienoic Acid** (F24:2CN6) - C24:2 n-6 polyunsaturated
5. **Heme Iron** (HAEM) - Iron bound to heme in animal foods
6. **Non-Heme Iron** (NHAEM) - Non-heme iron (plant sources, fortified)

---

## Codes to Skip

These are "remainder" or catch-all categories not meaningful to map:
- FASATXR, FAMSCXR, FAPUXR, FAMSTXR - FA remainder categories
- FAUN - Unidentified fatty acids
- F18:2CT, F18:2TC, F18:2R - Minor FA isomers
- Most individual trans FA codes (except totals)

---

## Integration Checklist

- [x] Download NEVO 2025 dataset
- [x] Analyze component structure (137 nutrients)
- [x] Create mapping tracker
- [x] Create mapping script
- [x] Run compound additions (7 new)
- [x] Create external source mappings (118 total)
- [x] Update DATA_SOURCES.md
