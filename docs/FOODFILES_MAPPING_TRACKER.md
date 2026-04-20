# FOODfiles (New Zealand) to Nutri Compound Mapping Tracker

**Source**: New Zealand FOODfiles™ 2024 Version 01
**URL**: https://www.foodcomposition.co.nz/foodfiles/
**License**: Free (citation required: "The New Zealand Institute for Plant & Food Research Limited and the Ministry of Health (New Zealand)")
**Total Components**: 434 (Unabridged), 87 (Standard)
**Foods**: 2,857

---

## Progress: 184/434 mapped ✅

**Completed**: 2026-01-14
**New Compounds Added**: 6 (Fiber HMW, Fiber LMW, 25-OH-D2, Nitrogen, Long Chain Omega-3, DPA n-6)
**Mappings Created**: 184
**Skipped**: ~250 (variant codes - per-TFA, per-N, monosaccharide equivalents)

---

## Code Naming Convention

FOODfiles uses INFOODS-style codes with variants:
- **Base codes**: Primary measurement (e.g., `F18D2CN6` = Linoleic acid cis,cis omega-6)
- **F suffix**: Per 100g total fatty acids (e.g., `F18D2CN6F`)
- **N suffix**: Per gram nitrogen for amino acids (e.g., `ALAN`)
- **M suffix**: Monosaccharide equivalents (e.g., `STARCHM`)
- **_G suffix**: Gram units instead of mg (e.g., `ALA_G`)

We map **base codes as canonical**, variant codes as non-canonical.

---

## 1. Energy (10 codes)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | ENERC | Energy, total metabolisable (kJ) | kJ | Energy | No | ⬜ |
| 2 | ENERC_KCAL | Energy, total metabolisable (kcal) | kcal | Energy | Yes | ⬜ |
| 3 | ENERC1 | Energy, total metabolisable (kJ, including dietary fibre) | kJ | SKIP (variant) | - | ⬜ |
| 4 | ENERC1_KCAL | Energy, total metabolisable (kcal, including dietary fibre) | kcal | SKIP (variant) | - | ⬜ |
| 5 | ENERC_FSANZ1 | Energy, FSANZ carb by difference (kJ) | kJ | SKIP (variant) | - | ⬜ |
| 6 | ENERC_FSANZ1_KCAL | Energy, FSANZ carb by difference (kcal) | kcal | SKIP (variant) | - | ⬜ |
| 7 | ENERC_FSANZ2 | Energy, FSANZ available carb (kJ) | kJ | SKIP (variant) | - | ⬜ |
| 8 | ENERC_FSANZ2_KCAL | Energy, FSANZ available carb (kcal) | kcal | SKIP (variant) | - | ⬜ |

---

## 2. Proximates (12 codes)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | WATER | Water | g | Water | Yes | ⬜ |
| 2 | ASH | Ash | g | Ash | Yes | ⬜ |
| 3 | PROT | Protein, total | g | Protein | Yes | ⬜ |
| 4 | NT | Nitrogen, total | g | Nitrogen | Yes | ⬜ |
| 5 | FAT | Fat, total | g | Total Fat | Yes | ⬜ |
| 6 | ALC | Alcohol | g | Alcohol | Yes | ⬜ |
| 7 | DM | Dry matter | g | SKIP (derived) | - | ⬜ |
| 8 | PROXTOT | Proximates, total | g | SKIP (sum) | - | ⬜ |
| 9 | CHOAVL | Available carbohydrates by weight | g | Total Carbohydrate | Yes | ⬜ |
| 10 | CHOAVLDF | Available carbohydrate by difference | g | Total Carbohydrate | No | ⬜ |
| 11 | CHOCDF | Total carbohydrate by difference | g | Total Carbohydrate | No | ⬜ |
| 12 | CHOCSM | Total carbohydrates by summation | g | Total Carbohydrate | No | ⬜ |

---

## 3. Fiber (6 codes)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | FIBTG | Fibre, total dietary | g | Total Fiber | Yes | ⬜ |
| 2 | FIBTLC | Fibre, total dietary (LC method) | g | Total Fiber | No | ⬜ |
| 3 | FIBSOL | Fibre, water-soluble | g | Soluble Fiber | Yes | ⬜ |
| 4 | FIBINS | Fibre, water-insoluble | g | Insoluble Fiber | Yes | ⬜ |
| 5 | FIBHMW | Fibre, high molecular weight (LC) | g | ADD_NEW (Fiber HMW) | - | ⬜ |
| 6 | FIBLMW | Fibre, low molecular weight (LC) | g | ADD_NEW (Fiber LMW) | - | ⬜ |

---

## 4. Carbohydrates (15 codes)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | SUGAR | Sugars, total | g | Total Sugars | Yes | ⬜ |
| 2 | SUGARM | Sugars, total (monosaccharide equiv) | g | Total Sugars | No | ⬜ |
| 3 | SUGAD | Sugar, added | g | Added Sugars | Yes | ⬜ |
| 4 | SUGFR | Sugar, free | g | Free Sugars | Yes | ⬜ |
| 5 | STARCH | Starch, total | g | Starch | Yes | ⬜ |
| 6 | STARCHM | Starch, total (monosaccharide equiv) | g | Starch | No | ⬜ |
| 7 | STARES | Starch, resistant | g | Resistant Starch | Yes | ⬜ |
| 8 | FRUS | Fructose | g | Fructose | Yes | ⬜ |
| 9 | GLUS | Glucose | g | Glucose | Yes | ⬜ |
| 10 | GALS | Galactose | g | Galactose | Yes | ⬜ |
| 11 | SUCS | Sucrose | g | Sucrose | Yes | ⬜ |
| 12 | LACS | Lactose | g | Lactose | Yes | ⬜ |
| 13 | MALS | Maltose | g | Maltose | Yes | ⬜ |
| 14 | GLYC | Glycogen | g | Glycogen | Yes | ⬜ |
| 15 | MALTDEX | Maltodextrin | g | Maltodextrin | Yes | ⬜ |

---

## 5. Saturated Fatty Acids (26 codes - primary only)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | FASAT | Fatty acids, total saturated | g | Saturated Fat | Yes | ⬜ |
| 2 | F4D0 | Fatty acid 4:0 | g | Butyric Acid | Yes | ⬜ |
| 3 | F6D0 | Fatty acid 6:0 | g | Caproic Acid | Yes | ⬜ |
| 4 | F8D0 | Fatty acid 8:0 | g | Caprylic Acid | Yes | ⬜ |
| 5 | F10D0 | Fatty acid 10:0 | g | Capric Acid | Yes | ⬜ |
| 6 | F11D0 | Fatty acid 11:0 | g | ADD_NEW (Undecanoic Acid) | - | ⬜ |
| 7 | F12D0 | Fatty acid 12:0 | g | Lauric Acid | Yes | ⬜ |
| 8 | F13D0 | Fatty acid 13:0 | g | ADD_NEW (Tridecanoic Acid) | - | ⬜ |
| 9 | F14D0 | Fatty acid 14:0 | g | Myristic Acid | Yes | ⬜ |
| 10 | F15D0 | Fatty acid 15:0 | g | Pentadecanoic Acid | Yes | ⬜ |
| 11 | F16D0 | Fatty acid 16:0 | g | Palmitic Acid | Yes | ⬜ |
| 12 | F17D0 | Fatty acid 17:0 | g | Margaric Acid | Yes | ⬜ |
| 13 | F18D0 | Fatty acid 18:0 | g | Stearic Acid | Yes | ⬜ |
| 14 | F19D0 | Fatty acid 19:0 | g | ADD_NEW (Nonadecanoic Acid) | - | ⬜ |
| 15 | F20D0 | Fatty acid 20:0 | g | Arachidic Acid | Yes | ⬜ |
| 16 | F21D0 | Fatty acid 21:0 | g | ADD_NEW (Heneicosanoic Acid) | - | ⬜ |
| 17 | F22D0 | Fatty acid 22:0 | g | Behenic Acid | Yes | ⬜ |
| 18 | F23D0 | Fatty acid 23:0 | g | Tricosanoic Acid | Yes | ⬜ |
| 19 | F24D0 | Fatty acid 24:0 | g | Lignoceric Acid | Yes | ⬜ |

---

## 6. Monounsaturated Fatty Acids (20 codes - primary only)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | FAMS | Fatty acids, total monounsaturated | g | Monounsaturated Fat | Yes | ⬜ |
| 2 | F10D1 | Fatty acid 10:1 | g | ADD_NEW (Decenoic Acid) | - | ⬜ |
| 3 | F12D1 | Fatty acid 12:1 | g | ADD_NEW (Dodecenoic Acid) | - | ⬜ |
| 4 | F14D1 | Fatty acid 14:1 | g | Myristoleic Acid | Yes | ⬜ |
| 5 | F15D1 | Fatty acid 15:1 | g | ADD_NEW (Pentadecenoic Acid) | - | ⬜ |
| 6 | F16D1 | Fatty acid 16:1 | g | Palmitoleic Acid | Yes | ⬜ |
| 7 | F17D1 | Fatty acid 17:1 | g | Heptadecenoic Acid | Yes | ⬜ |
| 8 | F18D1 | Fatty acid 18:1 | g | Oleic Acid | Yes | ⬜ |
| 9 | F18D1CN9 | Fatty acid cis 18:1 omega-9 | g | Oleic Acid (cis) | Yes | ⬜ |
| 10 | F18D1CN7 | Fatty acid cis 18:1 omega-7 | g | Vaccenic Acid (cis) | Yes | ⬜ |
| 11 | F20D1 | Fatty acid 20:1 | g | Gondoic Acid | Yes | ⬜ |
| 12 | F20D1CN9 | Fatty acid cis 20:1 omega-9 | g | Gondoic Acid | No | ⬜ |
| 13 | F22D1 | Fatty acid 22:1 | g | Erucic Acid | Yes | ⬜ |
| 14 | F22D1CN9 | Fatty acid cis 22:1 omega-9 | g | Erucic Acid | No | ⬜ |
| 15 | F24D1 | Fatty acid 24:1 | g | Nervonic Acid | Yes | ⬜ |
| 16 | F24D1CN9 | Fatty acid cis 24:1 omega-9 | g | Nervonic Acid | No | ⬜ |

---

## 7. Trans Fatty Acids (8 codes - primary only)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | FATRN | Fatty acids, total trans | g | Trans Fat | Yes | ⬜ |
| 2 | FAMST | Fatty acids, total monounsaturated trans | g | Trans Monounsaturated Fat | Yes | ⬜ |
| 3 | FAPUT | Fatty acids, total polyunsaturated trans | g | Trans Polyunsaturated Fat | Yes | ⬜ |
| 4 | F16D1T | Fatty acid trans 16:1 | g | trans-Palmitoleic Acid | Yes | ⬜ |
| 5 | F18D1T | Fatty acid trans 18:1 | g | Elaidic Acid | Yes | ⬜ |
| 6 | F18D1TN9 | Fatty acid trans 18:1 omega-9 | g | Elaidic Acid | No | ⬜ |
| 7 | F18D2T | Fatty acid trans 18:2 | g | trans-Linoleic Acid | Yes | ⬜ |
| 8 | F18D3TN3 | Fatty acid trans 18:3 omega-3 | g | trans-Alpha-Linolenic Acid | Yes | ⬜ |

---

## 8. Polyunsaturated Fatty Acids - Omega-6 (18 codes - primary only)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | FAPU | Fatty acids, total polyunsaturated | g | Polyunsaturated Fat | Yes | ⬜ |
| 2 | FAPUN6 | Fatty acids, total omega-6 | g | Omega-6 Fatty Acids | Yes | ⬜ |
| 3 | F18D2 | Fatty acid 18:2 | g | Linoleic Acid | Yes | ⬜ |
| 4 | F18D2CN6 | Fatty acid cis,cis 18:2 omega-6 | g | Linoleic Acid (cis,cis) | Yes | ⬜ |
| 5 | F18D3N6 | Fatty acid 18:3 omega-6 | g | Gamma-Linolenic Acid | Yes | ⬜ |
| 6 | F20D2N6 | Fatty acid 20:2 omega-6 | g | Eicosadienoic Acid | Yes | ⬜ |
| 7 | F20D3N6 | Fatty acid 20:3 omega-6 | g | Dihomo-Gamma-Linolenic Acid | Yes | ⬜ |
| 8 | F20D4N6 | Fatty acid 20:4 omega-6 | g | Arachidonic Acid | Yes | ⬜ |
| 9 | F22D2N6 | Fatty acid 22:2 omega-6 | g | Docosadienoic Acid | Yes | ⬜ |
| 10 | F22D4N6 | Fatty acid 22:4 omega-6 | g | Adrenic Acid | Yes | ⬜ |
| 11 | F22D5N6 | Fatty acid 22:5 omega-6 | g | Osbond Acid | Yes | ⬜ |

---

## 9. Polyunsaturated Fatty Acids - Omega-3 (14 codes - primary only)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | FAPUN3 | Fatty acids, total omega-3 | g | Omega-3 Fatty Acids | Yes | ⬜ |
| 2 | FALCPUN3 | Fatty acids, total long chain omega-3 | g | Long Chain Omega-3 | Yes | ⬜ |
| 3 | F18D3N3 | Fatty acid 18:3 omega-3 | g | Alpha-Linolenic Acid | Yes | ⬜ |
| 4 | F18D3CN3 | Fatty acid cis,cis,cis 18:3 omega-3 | g | Alpha-Linolenic Acid | No | ⬜ |
| 5 | F18D4N3 | Fatty acid 18:4 omega-3 | g | Stearidonic Acid | Yes | ⬜ |
| 6 | F20D3N3 | Fatty acid 20:3 omega-3 | g | Eicosatrienoic Acid | Yes | ⬜ |
| 7 | F20D4N3 | Fatty acid 20:4 omega-3 | g | Eicosatetraenoic Acid | Yes | ⬜ |
| 8 | F20D5N3 | Fatty acid 20:5 omega-3 | g | Eicosapentaenoic Acid | Yes | ⬜ |
| 9 | F20D5CN3 | Fatty acid cis 20:5 omega-3 | g | Eicosapentaenoic Acid | No | ⬜ |
| 10 | F21D5N3 | Fatty acid 21:5 omega-3 | g | Heneicosapentaenoic Acid | Yes | ⬜ |
| 11 | F22D5N3 | Fatty acid 22:5 omega-3 | g | Docosapentaenoic Acid | Yes | ⬜ |
| 12 | F22D5CN3 | Fatty acid cis 22:5 omega-3 | g | Docosapentaenoic Acid | No | ⬜ |
| 13 | F22D6N3 | Fatty acid 22:6 omega-3 | g | Docosahexaenoic Acid | Yes | ⬜ |
| 14 | F22D6CN3 | Fatty acid cis 22:6 omega-3 | g | Docosahexaenoic Acid | No | ⬜ |

---

## 10. Sterols (6 codes)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | CHOLE | Cholesterol | mg | Cholesterol | Yes | ⬜ |
| 2 | PHYSTR | Phytosterols, total | mg | Phytosterols | Yes | ⬜ |

---

## 11. Minerals (23 codes)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | NA | Sodium | mg | Sodium | Yes | ⬜ |
| 2 | K | Potassium | mg | Potassium | Yes | ⬜ |
| 3 | CA | Calcium | mg | Calcium | Yes | ⬜ |
| 4 | MG | Magnesium | mg | Magnesium | Yes | ⬜ |
| 5 | P | Phosphorus | mg | Phosphorus | Yes | ⬜ |
| 6 | FE | Iron | mg | Iron | Yes | ⬜ |
| 7 | ZN | Zinc | mg | Zinc | Yes | ⬜ |
| 8 | CU | Copper | mg | Copper | Yes | ⬜ |
| 9 | MN | Manganese | µg | Manganese | Yes | ⬜ |
| 10 | SE | Selenium | µg | Selenium | Yes | ⬜ |
| 11 | ID | Iodide | µg | Iodine | Yes | ⬜ |
| 12 | CLD | Chloride | mg | Chloride | Yes | ⬜ |
| 13 | CR | Chromium | µg | Chromium | Yes | ⬜ |
| 14 | MO | Molybdenum | µg | Molybdenum | Yes | ⬜ |
| 15 | FD | Fluoride | µg | Fluoride | Yes | ⬜ |
| 16 | AL | Aluminium | µg | Aluminum | Yes | ⬜ |
| 17 | B | Boron | µg | Boron | Yes | ⬜ |
| 18 | NI | Nickel | µg | Nickel | Yes | ⬜ |
| 19 | CO | Cobalt | µg | Cobalt | Yes | ⬜ |
| 20 | LI | Lithium | µg | Lithium | Yes | ⬜ |
| 21 | V | Vanadium | µg | Vanadium | Yes | ⬜ |
| 22 | S | Sulphur | mg | Sulfur | Yes | ⬜ |
| 23 | SISOL | Silicon (acid soluble) | µg | Silicon | Yes | ⬜ |

---

## 12. Trace Elements (Toxic) (6 codes)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | AS | Arsenic | µg | Arsenic | Yes | ⬜ |
| 2 | CD | Cadmium | µg | Cadmium | Yes | ⬜ |
| 3 | HG | Mercury | µg | Mercury | Yes | ⬜ |
| 4 | PB | Lead | µg | Lead | Yes | ⬜ |
| 5 | SN | Tin | µg | Tin | Yes | ⬜ |

---

## 13. Vitamins - Fat Soluble (14 codes)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | VITA_RAE | Vitamin A, retinol activity equiv | µg | Vitamin A | Yes | ⬜ |
| 2 | VITA | Vitamin A, retinol equiv | µg | Vitamin A | No | ⬜ |
| 3 | RETOL | Retinol | µg | Retinol | Yes | ⬜ |
| 4 | CARTB | Beta-carotene | µg | Beta-Carotene | Yes | ⬜ |
| 5 | CARTA | Alpha-carotene | µg | Alpha-Carotene | Yes | ⬜ |
| 6 | CARTBEQ | Beta-carotene equivalents | µg | Beta-Carotene | No | ⬜ |
| 7 | VITD | Vitamin D; calculated | µg | Vitamin D | Yes | ⬜ |
| 8 | ERGCAL | Ergocalciferol (Vitamin D2) | µg | Vitamin D2 | Yes | ⬜ |
| 9 | CHOCAL | Cholecalciferol (Vitamin D3) | µg | Vitamin D3 | Yes | ⬜ |
| 10 | ERGCALOH | 25-hydroxyvitamin D2 | µg | 25-Hydroxyvitamin D2 | Yes | ⬜ |
| 11 | CHOCALOH | 25-hydroxyvitamin D3 | µg | 25-Hydroxyvitamin D3 | Yes | ⬜ |
| 12 | VITE | Vitamin E, alpha-tocopherol equiv | mg | Vitamin E | Yes | ⬜ |
| 13 | VITK | Vitamin K | µg | Vitamin K | Yes | ⬜ |

---

## 14. Tocopherols (5 codes)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | TOCPHA | Alpha-tocopherol | mg | Alpha-Tocopherol | Yes | ⬜ |
| 2 | TOCPHB | Beta-tocopherol | mg | Beta-Tocopherol | Yes | ⬜ |
| 3 | TOCPHG | Gamma-tocopherol | mg | Gamma-Tocopherol | Yes | ⬜ |
| 4 | TOCPHD | Delta-tocopherol | mg | Delta-Tocopherol | Yes | ⬜ |
| 5 | TOCPHBG | Beta + Gamma-tocopherol | µg | SKIP (combined) | - | ⬜ |

---

## 15. Vitamins - Water Soluble (15 codes)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | VITC | Vitamin C | mg | Vitamin C | Yes | ⬜ |
| 2 | THIA | Thiamin | mg | Thiamin | Yes | ⬜ |
| 3 | RIBF | Riboflavin | mg | Riboflavin | Yes | ⬜ |
| 4 | NIA | Niacin, preformed | mg | Niacin | Yes | ⬜ |
| 5 | NIAEQ | Niacin equivalents, total | mg | Niacin | No | ⬜ |
| 6 | NIATRP | Niacin equivalents from tryptophan | mg | SKIP (derived) | - | ⬜ |
| 7 | PANTAC | Pantothenic acid | mg | Pantothenic Acid | Yes | ⬜ |
| 8 | VITB6A | Vitamin B6 | mg | Vitamin B6 | Yes | ⬜ |
| 9 | VITB12 | Vitamin B12 | µg | Vitamin B12 | Yes | ⬜ |
| 10 | FOL | Folate, total | µg | Folate | Yes | ⬜ |
| 11 | FOLDFE | Dietary folate equivalents | µg | Folate (DFE) | Yes | ⬜ |
| 12 | FOLFD | Folate food, naturally occurring | µg | Intrinsic Folate | Yes | ⬜ |
| 13 | FOLAC | Folic acid, synthetic | µg | Folic Acid | Yes | ⬜ |
| 14 | BIOT | Biotin | µg | Biotin | Yes | ⬜ |
| 15 | CHOLN | Choline | mg | Choline | Yes | ⬜ |

---

## 16. Carotenoids (4 codes)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | LYCPN | Lycopene | µg | Lycopene | Yes | ⬜ |
| 2 | LUTN | Lutein | µg | Lutein | Yes | ⬜ |
| 3 | ZEAX | Zeaxanthin | µg | Zeaxanthin | Yes | ⬜ |
| 4 | CRYPX | Cryptoxanthin | µg | Cryptoxanthin | Yes | ⬜ |

---

## 17. Amino Acids (18 codes - primary only)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | ALA | Alanine | mg | Alanine | Yes | ⬜ |
| 2 | ARG | Arginine | mg | Arginine | Yes | ⬜ |
| 3 | ASP | Aspartic acid | mg | Aspartic Acid | Yes | ⬜ |
| 4 | ASN | Asparagine | mg | Asparagine | Yes | ⬜ |
| 5 | CYS | Cystine | mg | Cystine | Yes | ⬜ |
| 6 | GLU | Glutamic acid | mg | Glutamic Acid | Yes | ⬜ |
| 7 | GLY | Glycine | mg | Glycine | Yes | ⬜ |
| 8 | HIS | Histidine | mg | Histidine | Yes | ⬜ |
| 9 | ILE | Isoleucine | mg | Isoleucine | Yes | ⬜ |
| 10 | LEU | Leucine | mg | Leucine | Yes | ⬜ |
| 11 | LYS | Lysine | mg | Lysine | Yes | ⬜ |
| 12 | MET | Methionine | mg | Methionine | Yes | ⬜ |
| 13 | PHE | Phenylalanine | mg | Phenylalanine | Yes | ⬜ |
| 14 | PRO | Proline | mg | Proline | Yes | ⬜ |
| 15 | SER | Serine | mg | Serine | Yes | ⬜ |
| 16 | THR | Threonine | mg | Threonine | Yes | ⬜ |
| 17 | TRP | Tryptophan | mg | Tryptophan | Yes | ⬜ |
| 18 | TYR | Tyrosine | mg | Tyrosine | Yes | ⬜ |
| 19 | VAL | Valine | mg | Valine | Yes | ⬜ |
| 20 | HYP | Hydroxyproline | mg | Hydroxyproline | Yes | ⬜ |
| 21 | TAU | Taurine | mg | Taurine | Yes | ⬜ |

---

## 18. Organic Acids (7 codes)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | OA_G | Organic acids, total | g | Total Organic Acids | Yes | ⬜ |
| 2 | ACEAC_G | Acetic acid | g | Acetic Acid | Yes | ⬜ |
| 3 | CITAC_G | Citric acid | g | Citric Acid | Yes | ⬜ |
| 4 | LACAC_G | Lactic acid | g | Lactic Acid | Yes | ⬜ |
| 5 | MALAC_G | Malic acid | g | Malic Acid | Yes | ⬜ |
| 6 | OXALAC_G | Oxalic acid | g | Oxalic Acid | Yes | ⬜ |
| 7 | QUINAC_G | Quinic acid | g | Quinic Acid | Yes | ⬜ |
| 8 | SUCAC_G | Succinic acid | g | Succinic Acid | Yes | ⬜ |

---

## 19. Other Compounds (4 codes)

| # | Code | Description | Unit | Nutri Compound | Canonical? | Status |
|---|------|-------------|------|----------------|------------|--------|
| 1 | CAFFN | Caffeine | mg | Caffeine | Yes | ⬜ |
| 2 | SORTL_G | Sorbitol | g | Sorbitol | Yes | ⬜ |

---

## Summary

| Category | Total Codes | Map to Existing | Add New | Skip |
|----------|-------------|-----------------|---------|------|
| Energy | 8 | 2 | 0 | 6 |
| Proximates | 12 | 8 | 0 | 4 |
| Fiber | 6 | 4 | 2 | 0 |
| Carbohydrates | 15 | 15 | 0 | 0 |
| Saturated FA | 19 | 15 | 4 | 0 |
| Monounsaturated FA | 16 | 14 | 2 | 0 |
| Trans FA | 8 | 8 | 0 | 0 |
| Omega-6 FA | 11 | 11 | 0 | 0 |
| Omega-3 FA | 14 | 14 | 0 | 0 |
| Sterols | 2 | 2 | 0 | 0 |
| Minerals | 23 | 23 | 0 | 0 |
| Trace Elements | 5 | 5 | 0 | 0 |
| Fat-Soluble Vitamins | 13 | 11 | 2 | 0 |
| Tocopherols | 5 | 4 | 0 | 1 |
| Water-Soluble Vitamins | 15 | 14 | 0 | 1 |
| Carotenoids | 4 | 4 | 0 | 0 |
| Amino Acids | 21 | 21 | 0 | 0 |
| Organic Acids | 8 | 8 | 0 | 0 |
| Other | 2 | 2 | 0 | 0 |
| **TOTAL** | **~207** | **~195** | **~10** | **~12** |

Note: This tracker covers primary codes only. Full 434 codes include ~227 variants (per-TFA, per-N, monosaccharide equiv) that are skipped or mapped as non-canonical.

---

## New Compounds to Add

1. **Fiber, High Molecular Weight** - CARBOHYDRATE - High MW fiber (LC method)
2. **Fiber, Low Molecular Weight** - CARBOHYDRATE - Low MW fiber (LC method)
3. **Undecanoic Acid** - FATTY_ACID - C11:0 saturated fatty acid
4. **Tridecanoic Acid** - FATTY_ACID - C13:0 saturated fatty acid
5. **Nonadecanoic Acid** - FATTY_ACID - C19:0 saturated fatty acid
6. **Heneicosanoic Acid** - FATTY_ACID - C21:0 saturated fatty acid
7. **Decenoic Acid** - FATTY_ACID - C10:1 monounsaturated fatty acid
8. **Dodecenoic Acid** - FATTY_ACID - C12:1 monounsaturated fatty acid
9. **Pentadecenoic Acid** - FATTY_ACID - C15:1 monounsaturated fatty acid
10. **25-Hydroxyvitamin D2** - VITAMIN - Calcidiol from D2
11. **25-Hydroxyvitamin D3** - VITAMIN - Calcidiol from D3

