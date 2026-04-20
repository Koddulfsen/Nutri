# FRIDA 5.4 (Denmark) Mapping Tracker

**Source**: DTU National Food Institute (Technical University of Denmark)
**Version**: 5.4 (May 2025)
**Foods**: 1,000+ items
**Components**: 218 parameters (205 unique EuroFIR codes)
**License**: Free with attribution
**Format**: Excel/ODS
**Attribution**: "Food data (frida.fooddata.dk), version 5.4, 2025, National Food Institute, Technical University of Denmark"

---

## Data Structure

FRIDA provides rich metadata including:
- EuroFIR component IDs
- EFSA parameter codes
- PubChem, KEGG, ChEBI, ChEMBL, HMDB identifiers
- CAS numbers, SMILES, molecular formulas
- Parameter groups for categorization

### Files
- `Frida_Dataset_May2025.xlsx` - Main dataset with multiple sheets:
  - Parameter - Nutrient definitions (218 rows)
  - Data_Table - Food composition data
  - Food - Food items
  - FoodGroup - Food group hierarchy
  - Source - Data sources

---

## Mapping Progress

**Status**: 193/218 mapped ✅ COMPLETE

**New compounds added**: 10

**Skipped**: 25 (factors, sums, duplicates, and unassigned codes)

---

## Macro Nutrients (17 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| ENERC | Energy (kJ) | kJ | Energy | No |
| ENERC | Energy (kcal) | kcal | Energy | Yes |
| ENERC | Energy, labelling (kJ) | kJ | Energy | No |
| ENERC | Energy, labelling (kcal) | kcal | Energy | No |
| PROT | Protein | g | Protein | Yes |
| PROT | Protein from Amino Acids | g | Protein | No |
| PROT | Protein, labeling | g | Protein | No |
| CHOT | Carbohydrate by difference | g | Total Carbohydrate | Yes |
| CHO | Available carbohydrates | g | Total Carbohydrate | No |
| CHO | Available carbohydrate, labelling | g | Total Carbohydrate | No |
| FIBT | Dietary fibre | g | Total Fiber | Yes |
| FAT | Fat | g | Total Fat | Yes |
| ALC | Alcohol | g | Alcohol | Yes |
| NACL | Salt labelling | g | Salt | Yes |
| ASH | Ash | g | Ash | Yes |
| DRYMAT | Dry matter | g | *SKIP* | - |
| WATER | Water | g | Water | Yes |

---

## Vitamins (39 codes)

### Vitamin A & Carotenoids

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| VITA | Vitamin A | RE | Vitamin A | Yes |
| RETOLAT | Retinol | µg | Retinol | Yes |
| CARTBTRANS | beta-Carotene | µg | Beta-Carotene | Yes |
| CARTBCIS | cis-beta-Carotene | µg | cis-Beta-Carotene | Yes | **NEW**

### Vitamin D Forms

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| VITD | Vitamin D | µg | Vitamin D | Yes |
| CHOCAL | Vitamin D3 | µg | Cholecalciferol | Yes |
| ERGCAL | Vitamin D2 | µg | Ergocalciferol | Yes |
| CHOCALOH | 25-hydroxy D3 | µg | 25-Hydroxyvitamin D3 | Yes |
| ERGCALOH | 25-hydroxy D2 | µg | 25-Hydroxyvitamin D2 | Yes |

### Vitamin E (Tocopherols)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| VITE | Vitamin E | α-TE | Vitamin E | Yes |
| TOCPHA | alpha-Tocopherol | mg | Alpha-Tocopherol | Yes |
| TOCPHB | beta-Tocopherol | mg | Beta-Tocopherol | Yes |
| TOCPHG | gamma-Tocopherol | mg | Gamma-Tocopherol | Yes |
| TOCPHD | delta-Tocopherol | mg | Delta-Tocopherol | Yes |
| TOCTRA | alpha-Tocotrienol | mg | Alpha-Tocotrienol | Yes |

### Vitamin K (Menaquinones)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| VITK | Vitamin K | µg | Vitamin K | Yes |
| VITK1 | Vitamin K1 | µg | Phylloquinone | Yes |
| VITK2 | Vitamin K2 | µg | Vitamin K2 | Yes |
| MK4 | Menaquinone 4 | µg | Menaquinone-4 | Yes |
| MK5 | Menaquinone 5 | µg | Menaquinone-5 | Yes | **NEW**
| MK6 | Menaquinone 6 | µg | Menaquinone-6 | Yes | **NEW**
| MK7 | Menaquinone 7 | µg | Menaquinone-7 | Yes |
| MK8 | Menaquinone 8 | µg | Menaquinone-8 | Yes |
| MK9 | Menaquinone 9 | µg | Menaquinone-9 | Yes |
| MK10 | Menaquinone 10 | µg | Menaquinone-10 | Yes | **NEW**

### B Vitamins

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| THIA | Thiamin (B1) | mg | Thiamin | Yes |
| RIBF | Riboflavin (B2) | mg | Riboflavin | Yes |
| NIAEQ | Niacin equivalent | NE | Niacin Equivalents | Yes |
| NICOTAC | Niacin | mg | Niacin | Yes |
| VITB6 | Vitamin B6 | mg | Vitamin B6 | Yes |
| PANTAC | Pantothenic acid | mg | Pantothenic Acid | Yes |
| BIOT | Biotin | µg | Biotin | Yes |
| FOL | Folate | µg | Folate | Yes |
| FOLFRE | Folate, free | µg | Folate | No |
| VITB12 | Vitamin B12 | µg | Vitamin B12 | Yes |

### Vitamin C

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| VITC | Vitamin C | mg | Vitamin C | Yes |
| ASCL | Ascorbic acid | mg | Vitamin C | No |
| ASCDL | Dehydroascorbic acid | mg | Dehydroascorbic Acid | Yes | **NEW**

---

## Minerals & Trace Elements (29 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| NA | Sodium | mg | Sodium | Yes |
| K | Potassium | mg | Potassium | Yes |
| CA | Calcium | mg | Calcium | Yes |
| MG | Magnesium | mg | Magnesium | Yes |
| FE | Iron | mg | Iron | Yes |
| CU | Copper | mg | Copper | Yes |
| ZN | Zinc | mg | Zinc | Yes |
| MN | Manganese | mg | Manganese | Yes |
| SE | Selenium | µg | Selenium | Yes |
| P | Phosphorus | mg | Phosphorus | Yes |
| FD | Fluorine | µg | Fluoride | Yes |
| CLD | Chloride | mg | Chloride | Yes |
| ID | Iodine | µg | Iodine | Yes |
| S | Sulfur | mg | Sulfur | Yes |
| RB | Rubidium | µg | Rubidium | Yes |
| CR | Chromium | µg | Chromium | Yes |
| MO | Molybdenum | µg | Molybdenum | Yes |
| CO | Cobalt | µg | Cobalt | Yes |
| AL | Aluminum | mg | Aluminum | Yes |
| SI | Silicon | mg | Silicon | Yes |
| B | Boron | µg | Boron | Yes |
| NI | Nickel | µg | Nickel | Yes |
| BRD | Bromine | µg | Bromine | Yes | **NEW**
| HG | Mercury | µg | Mercury | Yes |
| AS | Arsenic | µg | Arsenic | Yes |
| CD | Cadmium | µg | Cadmium | Yes |
| PB | Lead | µg | Lead | Yes |
| SN | Tin | µg | Tin | Yes |
| GRP_MIN | Sum minerals | mg | *SKIP* | - |

---

## Sugars (14 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| GLUS | Glucose | g | Glucose | Yes |
| FRUS | Fructose | g | Fructose | Yes |
| GALS | Galactose | g | Galactose | Yes |
| MNSAC | Sum monosaccharides | g | Total Monosaccharides | Yes |
| SUCS | Sucrose | g | Sucrose | Yes |
| MALS | Maltose | g | Maltose | Yes |
| LACS | Lactose | g | Lactose | Yes |
| DISAC | Sum disaccharides | g | Total Disaccharides | Yes |
| RAFS | Raffinose | g | Raffinose | Yes |
| SUGAR | Sum sugars | g | Total Sugars | Yes |
| SUGAR | Free Sugars | g | Free Sugars | No |
| SUGAD | Added Sugar | g | Added Sugars | Yes |
| SORTL | Sorbitol | g | Sorbitol | Yes |
| GRP_SUGOH | Sum sugar alcohols | g | *SKIP* | - |

---

## Dietary Fibre & Starch (8 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| STARCH | Starch/Glycogen | g | Starch | Yes |
| CELLU | Cellulose | g | Cellulose | Yes |
| LIGN | Lignin | g | Lignin | Yes |
| FIBINS | Insoluble dietary fibres | g | Insoluble Fiber | Yes |
| FIBHMWS | High MW soluble dietary fibre | g | Soluble Fiber | Yes |
| FIBLMW | Low MW soluble dietary fibre | g | Soluble Fiber | No |
| FIBC | Crude fibre | g | Crude Fiber | Yes |
| FIBT | Neutral detergent fibre | g | *SKIP* | - |

---

## Fatty Acid Sums (9 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| FASAT | Sum saturated FA | g | Saturated Fat | Yes |
| FAMS | Sum monounsaturated FA | g | Monounsaturated Fat | Yes |
| FAPU | Sum polyunsaturated FA | g | Polyunsaturated Fat | Yes |
| FATRS | Sum trans FA | g | Trans Fat | Yes |
| FAN3 | Sum n-3 FA | g | Omega-3 Fatty Acids | Yes |
| FAN6 | Sum n-6 FA | g | Omega-6 Fatty Acids | Yes |
| FACID | Sum fatty acids | g | Total Fatty Acids | Yes |
| FAUN | Other fatty acids | g | *SKIP* | - |
| *null* | Sum FA below detection | g | *SKIP* | - |

---

## Saturated Fatty Acids (16 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| F4:0 | Butyric acid | g | Butyric Acid | Yes |
| F6:0 | Caproic acid | g | Caproic Acid | Yes |
| F8:0 | Caprylic acid | g | Caprylic Acid | Yes |
| F10:0 | Capric acid | g | Capric Acid | Yes |
| F12:0 | Lauric acid | g | Lauric Acid | Yes |
| F13:0 | Tridecanoic acid | g | Tridecanoic Acid | Yes |
| F14:0 | Myristic acid | g | Myristic Acid | Yes |
| F15:0 | Pentadecanoic acid | g | Pentadecanoic Acid | Yes |
| F16:0 | Palmitic acid | g | Palmitic Acid | Yes |
| F17:0 | Margaric acid | g | Margaric Acid | Yes |
| F18:0 | Stearic acid | g | Stearic Acid | Yes |
| F20:0 | Arachidic acid | g | Arachidic Acid | Yes |
| F21:0 | Heneicosanoic acid | g | Heneicosanoic Acid | Yes |
| F22:0 | Behenic acid | g | Behenic Acid | Yes |
| F23:0 | Tricosanoic acid | g | Tricosanoic Acid | Yes |
| F24:0 | Lignoceric acid | g | Lignoceric Acid | Yes |

---

## Monounsaturated Fatty Acids (19 codes)

### Cis Forms

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| F12:1CIS | C12:1,n-1 | g | Lauroleic Acid | Yes |
| F14:1CN5 | C14:1,n-5 | g | Myristoleic Acid | Yes |
| F15:1CIS | C15:1,n-5 | g | Pentadecenoic Acid | Yes |
| F16:1CN7 | C16:1,n-7 | g | Palmitoleic Acid | Yes |
| F17:1CIS | C17:1,n-7 | g | Heptadecenoic Acid | Yes |
| F18:1CN7 | C18:1,n-7 | g | Vaccenic Acid (cis) | Yes |
| F18:1CN9 | C18:1,n-9 | g | Oleic Acid | Yes |
| F18:1CN12 | C18:1,n-12 | g | Petroselinic Acid | Yes | **NEW**
| F20:1CN9 | C20:1,n-9 | g | Eicosenoic Acid | Yes |
| F20:1CN11 | C20:1,n-11 | g | Gondoic Acid | Yes |
| *null* | C20:1,n-15 | g | *SKIP* | - |
| F22:1CN9 | C22:1,n-9 | g | Erucic Acid | Yes |
| F22:1CN11 | C22:1,n-11 | g | Cetoleic Acid | Yes |
| F24:1CN9 | C24:1,n-9 | g | Nervonic Acid | Yes |

### Trans Forms

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| F14:1TN5 | C14:1,n-5,trans | g | Trans Myristoleic Acid | Yes |
| F16:1TN7 | C16:1,n-7,trans | g | Palmitoleic Acid (trans) | Yes |
| F18:1TRS | C18:1,trans | g | Oleic Acid (trans) | Yes |
| F20:1TRS | C20:1,trans | g | Trans Eicosenoic Acid | Yes |
| F22:1TRS | C22:1,trans | g | Erucic Acid (trans) | Yes |

---

## Polyunsaturated Fatty Acids (20 codes)

### Omega-6

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| F18:2CN6 | Linoleic acid | g | Linoleic Acid | Yes |
| F18:2CON | Conjugated linoleic acid | g | Conjugated Linoleic Acid | Yes |
| F18:3CN6 | Gamma-linolenic acid | g | Gamma-Linolenic Acid | Yes |
| F20:2CN6 | Eicosadienoic acid | g | Eicosadienoic Acid | Yes |
| F20:3CN6 | DGLA | g | Dihomo-gamma-linolenic Acid | Yes |
| F20:4CN6 | Arachidonic acid | g | Arachidonic Acid | Yes |
| F22:2CN6 | Docosadienoic acid | g | Docosadienoic Acid | Yes |
| F22:4CN6 | Adrenic acid | g | Adrenic Acid | Yes |
| F22:5N6 | Osbond acid | g | Osbond Acid | Yes | **NEW**

### Omega-3

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| F18:3CN3 | Alpha-linolenic acid | g | Alpha-Linolenic Acid | Yes |
| F18:4CN3 | Stearidonic acid | g | Stearidonic Acid | Yes |
| F20:3CN3 | Eicosatrienoic acid (n-3) | g | Eicosatrienoic Acid (n-3) | Yes |
| F20:4CN3 | Eicosatetraenoic acid | g | Eicosatetraenoic Acid (n-3) | Yes |
| F20:5CN3 | EPA | g | Eicosapentaenoic Acid | Yes |
| F21:5CN3 | Heneicosapentaenoic acid | g | Heneicosapentaenoic Acid | Yes |
| F22:3CN3 | Docosatrienoic acid | g | Docosatrienoic Acid | Yes |
| F22:5CN3 | DPA | g | Docosapentaenoic Acid | Yes |
| F22:6CN3 | DHA | g | Docosahexaenoic Acid | Yes |

### Trans PUFAs

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| F18:2TRS | C18:2,trans | g | Linoleic Acid (trans,trans) | Yes |
| F18:3TRS | C18:3,trans | g | Trans Alpha-Linolenic Acid | Yes |

---

## Sterols (1 code)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| CHORL | Cholesterol | mg | Cholesterol | Yes |

---

## Amino Acids (23 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| NT | Nitrogen | g | Nitrogen | Yes |
| ILE | Isoleucine | mg | Isoleucine | Yes |
| LEU | Leucine | mg | Leucine | Yes |
| LYS | Lysine | mg | Lysine | Yes |
| MET | Methionine | mg | Methionine | Yes |
| CYS | Cystine | mg | Cystine | Yes |
| PHE | Phenylalanine | mg | Phenylalanine | Yes |
| TYR | Tyrosine | mg | Tyrosine | Yes |
| THR | Threonine | mg | Threonine | Yes |
| TRP | Tryptophan | mg | Tryptophan | Yes |
| VAL | Valine | mg | Valine | Yes |
| ARG | Arginine | mg | Arginine | Yes |
| HIS | Histidine | mg | Histidine | Yes |
| ALA | Alanine | mg | Alanine | Yes |
| ASP | Aspartic acid | mg | Aspartic Acid | Yes |
| GLU | Glutamic acid | mg | Glutamic Acid | Yes |
| GLY | Glycine | mg | Glycine | Yes |
| PRO | Proline | mg | Proline | Yes |
| SER | Serine | mg | Serine | Yes |
| HYP | Hydroxyproline | mg | Hydroxyproline | Yes |
| *null* | Ornithine | mg | Ornithine | Yes |
| AAE8 | Sum essential AA | mg | *SKIP* | - |
| *null* | Sum non-essential AA | mg | *SKIP* | - |

---

## Biogenic Amines (10 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| HISTN | Histamine | mg | Histamine | Yes |
| SEROTN | Serotonin | mg | Serotonin | Yes |
| CHOLN | Choline | mg | Choline | Yes |
| TYRA | Tyramine | mg | Tyramine | Yes |
| PHETN | Phenylethylamine | mg | Phenylethylamine | Yes | **NEW**
| PUTRSC | Putrescine | mg | Putrescine | Yes |
| CADAVT | Cadaverine | mg | Cadaverine | Yes |
| SPERN | Spermine | mg | Spermine | Yes |
| SPERDN | Spermidine | mg | Spermidine | Yes |
| GRP_AM | Sum biogenic amines | mg | *SKIP* | - |

---

## Organic Acids (8 codes)

| Code | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|------|--------------|-----------|
| LACACL | L-lactic acid | g | Lactic Acid | No |
| LACACD | D-lactic acid | g | Lactic Acid | No |
| LACAC | Lactic acid | g | Lactic Acid | Yes |
| CITAC | Citric acid | g | Citric Acid | Yes |
| OXALAC | Oxalic acid | g | Oxalic Acid | Yes |
| PROPAC | Propionic acid | g | Propionic Acid | Yes |
| BENAC | Benzoic acid | mg | Benzoic Acid | Yes |
| OA | Sum organic acids | g | *SKIP* | - |

---

## Factors (Skipped - 5 codes)

These are food properties, not nutrients:
- WASTE - Waste percentage
- NCF - Nitrogen conversion factor
- FACF - Fatty acid conversion factor
- DEN - Density
- PH - pH value

---

## New Compounds Summary (10)

| Name | Type | Unit | EuroFIR Code |
|------|------|------|--------------|
| Menaquinone-5 | VITAMIN | µg | MK5 |
| Menaquinone-6 | VITAMIN | µg | MK6 |
| Menaquinone-10 | VITAMIN | µg | MK10 |
| cis-Beta-Carotene | VITAMIN | µg | CARTBCIS |
| Dehydroascorbic Acid | VITAMIN | mg | ASCDL |
| Bromine | MINERAL | µg | BRD |
| Phenylethylamine | ALKALOID | mg | PHETN |
| Petroselinic Acid | FATTY_ACID | g | F18:1CN12 |
| Osbond Acid | FATTY_ACID | g | F22:5N6 |
| Crude Fiber | CARBOHYDRATE | g | FIBC |

---

## Integration Checklist

- [x] Download FRIDA 5.4 via email form
- [x] Extract and analyze structure (218 parameters)
- [x] Create mapping tracker
- [x] Create mapping script
- [x] Run mappings (193 created)
- [x] Update DATA_SOURCES.md
