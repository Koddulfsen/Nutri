# UK CoFID to Nutri Compound Mapping Tracker

**Source**: McCance and Widdowson's Composition of Foods Integrated Dataset 2021
**URL**: https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid
**License**: Open Government Licence
**Total Nutrients**: 187

---

## Progress: 168/187 mapped ✅ COMPLETE

- Mapped to existing compounds: 158
- New compounds added: 10
- Skipped (derived/per-FA values): 19

---

## Lipid Number to Common Name Reference

| Lipid # | Common Name | Type |
|---------|-------------|------|
| C4:0 | Butyric Acid | SFA |
| C6:0 | Caproic Acid | SFA |
| C8:0 | Caprylic Acid | SFA |
| C10:0 | Capric Acid | SFA |
| C12:0 | Lauric Acid | SFA |
| C14:0 | Myristic Acid | SFA |
| C15:0 | Pentadecanoic Acid | SFA |
| C16:0 | Palmitic Acid | SFA |
| C17:0 | Heptadecanoic Acid / Margaric Acid | SFA |
| C18:0 | Stearic Acid | SFA |
| C20:0 | Arachidic Acid | SFA |
| C22:0 | Behenic Acid | SFA |
| C24:0 | Lignoceric Acid | SFA |
| C14:1 | Myristoleic Acid | MUFA |
| C16:1 | Palmitoleic Acid | MUFA |
| C18:1 | Oleic Acid | MUFA |
| C20:1 | Eicosenoic/Gondoic Acid | MUFA |
| C22:1 | Erucic Acid | MUFA |
| C24:1 | Nervonic Acid | MUFA |
| C18:2 n-6 | Linoleic Acid | PUFA |
| C18:3 n-3 | Alpha-Linolenic Acid | PUFA |
| C18:3 n-6 | Gamma-Linolenic Acid | PUFA |
| C18:4 n-3 | Stearidonic Acid | PUFA |
| C20:3 n-6 | Dihomo-gamma-linolenic Acid | PUFA |
| C20:4 n-6 | Arachidonic Acid | PUFA |
| C20:5 n-3 | EPA (Eicosapentaenoic Acid) | PUFA |
| C22:4 n-6 | Adrenic Acid | PUFA |
| C22:5 n-3 | DPA (Docosapentaenoic Acid) | PUFA |
| C22:6 n-3 | DHA (Docosahexaenoic Acid) | PUFA |

---

## 1. Proximates (40 nutrients)

| # | Code | CoFID Name | Unit | Nutri Compound | Canonical? | Status |
|---|------|------------|------|----------------|------------|--------|
| 1 | WATER | Water | g | Water | Yes | ⬜ |
| 2 | TOTNIT | Total nitrogen | g | SKIP (derived) | - | ⬜ |
| 3 | PROT | Protein | g | Protein | Yes | ⬜ |
| 4 | FAT | Fat | g | Total Fat | Yes | ⬜ |
| 5 | CHO | Carbohydrate | g | Carbohydrate | Yes | ⬜ |
| 6 | KCALS | Energy (kcal) | kcal | Energy | Yes | ⬜ |
| 7 | KJ | Energy (kJ) | kJ | Energy | No | ⬜ |
| 8 | STAR | Starch | g | Starch | Yes | ⬜ |
| 9 | OLIGO | Oligosaccharide | g | ADD_NEW | - | ⬜ |
| 10 | TOTSUG | Total sugars | g | Total Sugars | Yes | ⬜ |
| 11 | GLUC | Glucose | g | Glucose | Yes | ⬜ |
| 12 | GALACT | Galactose | g | Galactose | Yes | ⬜ |
| 13 | FRUCT | Fructose | g | Fructose | Yes | ⬜ |
| 14 | SUCR | Sucrose | g | Sucrose | Yes | ⬜ |
| 15 | MALT | Maltose | g | Maltose | Yes | ⬜ |
| 16 | LACT | Lactose | g | Lactose | Yes | ⬜ |
| 17 | ALCO | Alcohol | g | Alcohol | Yes | ⬜ |
| 18 | ENGFIB | NSP (Non-starch polysaccharides) | g | Fiber | No | ⬜ |
| 19 | AOACFIB | AOAC fibre | g | Fiber | Yes | ⬜ |
| 20 | SATFOD | Saturated FA /100g food | g | Saturated Fat | Yes | ⬜ |
| 21 | SATFAC | Saturated FA /100g FA | g | SKIP (per FA) | - | ⬜ |
| 22 | TOTn6PFOD | n-6 poly /100g food | g | Omega-6 Fatty Acids | Yes | ⬜ |
| 23 | TOTn6PFAC | n-6 poly /100g FA | g | SKIP (per FA) | - | ⬜ |
| 24 | TOTn3PFOD | n-3 poly /100g food | g | Omega-3 Fatty Acids | Yes | ⬜ |
| 25 | TOTn3PFAC | n-3 poly /100g FA | g | SKIP (per FA) | - | ⬜ |
| 26 | MONOFODc | cis-Mono FA /100g Food | g | Monounsaturated Fat | Yes | ⬜ |
| 27 | MONOFACc | cis-Mono FA /100g FA | g | SKIP (per FA) | - | ⬜ |
| 28 | MONOFOD | Mono FA /100g food | g | Monounsaturated Fat | No | ⬜ |
| 29 | MONOFAC | Mono FA /100g FA | g | SKIP (per FA) | - | ⬜ |
| 30 | POLYFODc | cis-Poly FA /100g Food | g | Polyunsaturated Fat | Yes | ⬜ |
| 31 | POLYFACc | cis-Poly FA /100g FA | g | SKIP (per FA) | - | ⬜ |
| 32 | POLYFOD | Poly FA /100g food | g | Polyunsaturated Fat | No | ⬜ |
| 33 | POLYFAC | Poly FA /100g FA | g | SKIP (per FA) | - | ⬜ |
| 34 | SATFODx6 | Sat FA excl Br /100g food | g | SKIP (variant) | - | ⬜ |
| 35 | SATFACx6 | Sat FA excl Br /100g FA | g | SKIP (per FA) | - | ⬜ |
| 36 | TOTBRFOD | Branched chain FA /100g food | g | ADD_NEW | - | ⬜ |
| 37 | TOTBRFAC | Branched chain FA /100g FA | g | SKIP (per FA) | - | ⬜ |
| 38 | FODTRANS | Trans FAs /100g food | g | Trans Fat | Yes | ⬜ |
| 39 | FACTRANS | Trans FAs /100g FA | g | SKIP (per FA) | - | ⬜ |
| 40 | CHOL | Cholesterol | mg | Cholesterol | Yes | ⬜ |

---

## 2. Inorganics/Minerals (12 nutrients)

| # | Code | CoFID Name | Unit | Nutri Compound | Canonical? | Status |
|---|------|------------|------|----------------|------------|--------|
| 1 | NA | Sodium | mg | Sodium | Yes | ⬜ |
| 2 | K | Potassium | mg | Potassium | Yes | ⬜ |
| 3 | CA | Calcium | mg | Calcium | Yes | ⬜ |
| 4 | MG | Magnesium | mg | Magnesium | Yes | ⬜ |
| 5 | P | Phosphorus | mg | Phosphorus | Yes | ⬜ |
| 6 | FE | Iron | mg | Iron | Yes | ⬜ |
| 7 | CU | Copper | mg | Copper | Yes | ⬜ |
| 8 | ZN | Zinc | mg | Zinc | Yes | ⬜ |
| 9 | CL | Chloride | mg | Chloride | Yes | ⬜ |
| 10 | MN | Manganese | mg | Manganese | Yes | ⬜ |
| 11 | SE | Selenium | µg | Selenium | Yes | ⬜ |
| 12 | I | Iodine | µg | Iodine | Yes | ⬜ |

---

## 3. Vitamins (17 nutrients)

| # | Code | CoFID Name | Unit | Nutri Compound | Canonical? | Status |
|---|------|------------|------|----------------|------------|--------|
| 1 | RET | Retinol | µg | Retinol | Yes | ⬜ |
| 2 | CAREQU | Carotene | µg | Beta-Carotene | No | ⬜ |
| 3 | RETEQU | Retinol Equivalent | µg | Vitamin A (RAE) | Yes | ⬜ |
| 4 | VITD | Vitamin D | µg | Vitamin D | Yes | ⬜ |
| 5 | VITE | Vitamin E | mg | Vitamin E | Yes | ⬜ |
| 6 | VITK1 | Vitamin K1 | µg | Vitamin K | Yes | ⬜ |
| 7 | THIA | Thiamin | mg | Thiamine | Yes | ⬜ |
| 8 | RIBO | Riboflavin | mg | Riboflavin | Yes | ⬜ |
| 9 | NIAC | Niacin | mg | Niacin | Yes | ⬜ |
| 10 | TRYP60 | Tryptophan/60 | mg | SKIP (calculated) | - | ⬜ |
| 11 | NIACEQU | Niacin equivalent | mg | SKIP (calculated) | - | ⬜ |
| 12 | VITB6 | Vitamin B6 | mg | Vitamin B6 | Yes | ⬜ |
| 13 | VITB12 | Vitamin B12 | µg | Vitamin B12 | Yes | ⬜ |
| 14 | FOLT | Folate | µg | Folate | Yes | ⬜ |
| 15 | PANTO | Pantothenate | mg | Pantothenic Acid (Vit B5) | Yes | ⬜ |
| 16 | BIOT | Biotin | µg | Biotin | Yes | ⬜ |
| 17 | VITC | Vitamin C | mg | Vitamin C | Yes | ⬜ |

---

## 4. Vitamin Fractions (18 nutrients)

| # | Code | CoFID Name | Unit | Nutri Compound | Canonical? | Status |
|---|------|------------|------|----------------|------------|--------|
| 1 | ALTRET | All-trans-retinol | µg | Retinol | No | ⬜ |
| 2 | 13CISRET | 13-cis-retinol | µg | ADD_NEW | - | ⬜ |
| 3 | DEHYRET | Dehydroretinol | µg | ADD_NEW | - | ⬜ |
| 4 | RETALD | Retinaldehyde | µg | ADD_NEW | - | ⬜ |
| 5 | ACAR | Alpha-carotene | µg | Alpha-Carotene | Yes | ⬜ |
| 6 | BCAR | Beta-carotene | µg | Beta-Carotene | Yes | ⬜ |
| 7 | CRYPT | Cryptoxanthins | µg | Beta-Cryptoxanthin | Yes | ⬜ |
| 8 | LUT | Lutein | µg | Lutein | Yes | ⬜ |
| 9 | LYCO | Lycopene | µg | Lycopene | Yes | ⬜ |
| 10 | 25OHD3 | 25-hydroxy vitamin D3 | µg | ADD_NEW | - | ⬜ |
| 11 | VITD3 | Cholecalciferol | µg | Vitamin D3 | Yes | ⬜ |
| 12 | 5METHF | 5-methyl folate | µg | 5-Methyltetrahydrofolate | Yes | ⬜ |
| 13 | ATOPH | Alpha-tocopherol | mg | Alpha-Tocopherol | Yes | ⬜ |
| 14 | BTOPH | Beta-tocopherol | mg | Beta-Tocopherol | Yes | ⬜ |
| 15 | DTOPH | Delta-tocopherol | mg | Delta-Tocopherol | Yes | ⬜ |
| 16 | GTOPH | Gamma-tocopherol | mg | Gamma-Tocopherol | Yes | ⬜ |
| 17 | ATOTR | Alpha-tocotrienol | mg | Alpha-Tocotrienol | Yes | ⬜ |
| 18 | GTOTR | Gamma-tocotrienol | mg | Gamma-Tocotrienol | Yes | ⬜ |

---

## 5. Saturated Fatty Acids - per 100g Food (27 nutrients)

| # | Code | CoFID Name | Lipid # | Nutri Compound | Canonical? | Status |
|---|------|------------|---------|----------------|------------|--------|
| 1 | FOD4:0 | C4:0 /100g food | C4:0 | Butyric Acid | Yes | ⬜ |
| 2 | FOD6:0 | C6:0 /100g food | C6:0 | Caproic Acid | Yes | ⬜ |
| 3 | FOD8:0 | C8:0 /100g food | C8:0 | Caprylic Acid | Yes | ⬜ |
| 4 | FOD10:0 | C10:0 /100g food | C10:0 | Capric Acid | Yes | ⬜ |
| 5 | FOD11:0xb | C11:0 ex Br /100g food | C11:0 | Undecanoic Acid | Yes | ⬜ |
| 6 | FOD12:0 | C12:0 /100g food | C12:0 | Lauric Acid | Yes | ⬜ |
| 7 | FOD12:0xb | C12:0 ex Br /100g food | C12:0 | Lauric Acid | No | ⬜ |
| 8 | FOD13:0 | C13:0 /100g food | C13:0 | Tridecanoic Acid | Yes | ⬜ |
| 9 | FOD13:0xb | C13:0 ex Br /100g food | C13:0 | Tridecanoic Acid | No | ⬜ |
| 10 | FOD14:0 | C14:0 /100g food | C14:0 | Myristic Acid | Yes | ⬜ |
| 11 | FOD14:0xb | C14:0 ex Br /100g food | C14:0 | Myristic Acid | No | ⬜ |
| 12 | FOD15:0 | C15:0 /100g food | C15:0 | Pentadecanoic Acid | Yes | ⬜ |
| 13 | FOD15:0xb | C15:0 ex Br /100g food | C15:0 | Pentadecanoic Acid | No | ⬜ |
| 14 | FOD16:0 | C16:0 /100g food | C16:0 | Palmitic Acid | Yes | ⬜ |
| 15 | FOD16:0xb | C16:0 ex Br /100g food | C16:0 | Palmitic Acid | No | ⬜ |
| 16 | FOD17:0 | C17:0 /100g food | C17:0 | Heptadecanoic Acid | Yes | ⬜ |
| 17 | FOD17:0xb | C17:0 ex Br /100g food | C17:0 | Heptadecanoic Acid | No | ⬜ |
| 18 | FOD18:0 | C18:0 /100g food | C18:0 | Stearic Acid | Yes | ⬜ |
| 19 | FOD18:0xb | C18:0 ex Br /100g food | C18:0 | Stearic Acid | No | ⬜ |
| 20 | FOD19:0 | C19:0 /100g food | C19:0 | Nonadecanoic Acid | Yes | ⬜ |
| 21 | FOD20:0 | C20:0 /100g food | C20:0 | Arachidic Acid | Yes | ⬜ |
| 22 | FOD20:0xb | C20:0 ex Br /100g food | C20:0 | Arachidic Acid | No | ⬜ |
| 23 | FOD22:0 | C22:0 /100g food | C22:0 | Behenic Acid | Yes | ⬜ |
| 24 | FOD22:0xb | C22:0 ex Br /100g food | C22:0 | Behenic Acid | No | ⬜ |
| 25 | FOD24:0 | C24:0 /100g food | C24:0 | Lignoceric Acid | Yes | ⬜ |
| 26 | FOD24:0xb | C24:0 ex Br /100g food | C24:0 | Lignoceric Acid | No | ⬜ |
| 27 | FOD25:0xb | C25:0 ex Br /100g food | C25:0 | ADD_NEW (Pentacosanoic) | - | ⬜ |

---

## 6. Monounsaturated Fatty Acids - per 100g Food (25 nutrients)

| # | Code | CoFID Name | Lipid # | Nutri Compound | Canonical? | Status |
|---|------|------------|---------|----------------|------------|--------|
| 1 | FOD10:1 | C10:1 /100g food | C10:1 | ADD_NEW (Decenoic) | - | ⬜ |
| 2 | FOD10:1c | cis C10:1 /100g food | C10:1c | ADD_NEW | - | ⬜ |
| 3 | FOD12:1 | C12:1 /100g food | C12:1 | Dodecenoic Acid | Yes | ⬜ |
| 4 | FOD12:1c | cis C12:1 /100g food | C12:1c | Dodecenoic Acid | No | ⬜ |
| 5 | FOD14:1 | C14:1 /100g food | C14:1 | Myristoleic Acid | Yes | ⬜ |
| 6 | FOD14:1c | cis C14:1 /100g food | C14:1c | Myristoleic Acid (cis) | Yes | ⬜ |
| 7 | FOD15:1 | C15:1 /100g food | C15:1 | Pentadecenoic Acid | Yes | ⬜ |
| 8 | FOD15:1c | cis C15:1 /100g food | C15:1c | Pentadecenoic Acid | No | ⬜ |
| 9 | FOD16:1 | C16:1 /100g food | C16:1 | Palmitoleic Acid | Yes | ⬜ |
| 10 | FOD16:1c | cis C16:1 /100g food | C16:1c | Palmitoleic Acid (cis) | Yes | ⬜ |
| 11 | FOD17:1 | C17:1 /100g food | C17:1 | Heptadecenoic Acid | Yes | ⬜ |
| 12 | FOD17:1c | cis C17:1 /100g food | C17:1c | Heptadecenoic Acid | No | ⬜ |
| 13 | FOD18:1 | C18:1 /100g food | C18:1 | Oleic Acid | Yes | ⬜ |
| 14 | FOD18:1c | cis C18:1 /100g food | C18:1c | Oleic Acid (cis) | Yes | ⬜ |
| 15 | FOD18:1n9 | cis/trans C18:1n-9 /100g food | C18:1n9 | Oleic Acid | No | ⬜ |
| 16 | FOD18:1n7 | cis/trans C18:1n-7 /100g food | C18:1n7 | Vaccenic Acid (cis) | Yes | ⬜ |
| 17 | FOD20:1 | C20:1 /100g food | C20:1 | Eicosenoic Acid | Yes | ⬜ |
| 18 | FOD20:1c | cis C20:1 /100g food | C20:1c | Gondoic Acid | Yes | ⬜ |
| 19 | FOD22:1 | C22:1 /100g food | C22:1 | Erucic Acid | Yes | ⬜ |
| 20 | FOD22:1c | cis C22:1 /100g food | C22:1c | Erucic Acid (cis) | Yes | ⬜ |
| 21 | FOD22:1n11 | cis/trans C22:1n-11 /100g food | C22:1n11 | Cetoleic Acid | Yes | ⬜ |
| 22 | FOD22:1n9 | cis/trans C22:1n-9 /100g food | C22:1n9 | Erucic Acid | No | ⬜ |
| 23 | FOD24:1 | C24:1 /100g food | C24:1 | Nervonic Acid | Yes | ⬜ |
| 24 | FOD24:1c | cis C24:1 /100g food | C24:1c | Nervonic Acid | No | ⬜ |
| 25 | MONOFODtr | trans mono /100g food | - | Trans Fat (Monoenoic) | Yes | ⬜ |

---

## 7. Polyunsaturated Fatty Acids - per 100g Food (36 nutrients)

| # | Code | CoFID Name | Lipid # | Nutri Compound | Canonical? | Status |
|---|------|------------|---------|----------------|------------|--------|
| 1 | FOD16:2 | C16:2 /100g food | C16:2 | Hexadecadienoic Acid | Yes | ⬜ |
| 2 | FOD16:2c | cis C16:2 /100g food | C16:2c | Hexadecadienoic Acid | No | ⬜ |
| 3 | FOD16:3 | C16:3 /100g food | C16:3 | ADD_NEW | - | ⬜ |
| 4 | FOD16:4 | C16:4 /100g food | C16:4 | ADD_NEW | - | ⬜ |
| 5 | FOD16:4c | cis C16:4 /100g food | C16:4c | ADD_NEW | - | ⬜ |
| 6 | FOD16 poly | unknown C16 poly /100g food | - | SKIP (unknown) | - | ⬜ |
| 7 | FOD18:2 | C18:2 /100g food | C18:2 | Linoleic Acid | Yes | ⬜ |
| 8 | FOD18:2cn6 | cis n-6 C18:2 /100g food | C18:2n6 | Linoleic Acid (cis,cis) | Yes | ⬜ |
| 9 | FOD18:3 | C18:3 /100g food | C18:3 | Linolenic Acid Isomers | Yes | ⬜ |
| 10 | FOD18:3cn3 | cis n-3 C18:3 /100g food | C18:3n3 | Alpha-Linolenic Acid | Yes | ⬜ |
| 11 | FOD18:3cn6 | cis n-6 C18:3 /100g food | C18:3n6 | Gamma-Linolenic Acid | Yes | ⬜ |
| 12 | FOD18:4 | C18:4 /100g food | C18:4 | Stearidonic Acid | Yes | ⬜ |
| 13 | FOD18:4cn3 | cis n-3 C18:4 /100g food | C18:4n3 | Stearidonic Acid | No | ⬜ |
| 14 | FOD18 poly | unknown C18 poly /100g food | - | SKIP (unknown) | - | ⬜ |
| 15 | FOD20:2 | C20:2 /100g food | C20:2 | Eicosadienoic Acid | Yes | ⬜ |
| 16 | FOD20:2cn6 | cis n-6 C20:2 /100g food | C20:2n6 | Eicosadienoic Acid | No | ⬜ |
| 17 | FOD20:3 | C20:3 /100g food | C20:3 | Eicosatrienoic Acid | Yes | ⬜ |
| 18 | FOD20:3cn6 | cis n-6 C20:3 /100g food | C20:3n6 | Dihomo-gamma-linolenic Acid | Yes | ⬜ |
| 19 | FOD20:4 | C20:4 /100g food | C20:4 | Arachidonic Acid | Yes | ⬜ |
| 20 | FOD20:4cn6 | cis n-6 C20:4 /100g food | C20:4n6 | Arachidonic Acid | No | ⬜ |
| 21 | FOD20:5 | C20:5 /100g food | C20:5 | Eicosapentaenoic Acid | Yes | ⬜ |
| 22 | FOD20:5cn3 | cis n-3 C20:5 /100g food | C20:5n3 | Eicosapentaenoic Acid | No | ⬜ |
| 23 | FOD20 poly | unknown C20 poly /100g food | - | SKIP (unknown) | - | ⬜ |
| 24 | FOD21:5 | C21:5 /100g food | C21:5 | Heneicosapentaenoic Acid | Yes | ⬜ |
| 25 | FOD21:5cn3 | cis n-3 C21:5 /100g food | C21:5n3 | Heneicosapentaenoic Acid | No | ⬜ |
| 26 | FOD22:2 | C22:2 /100g food | C22:2 | Docosadienoic Acid | Yes | ⬜ |
| 27 | FOD22:2cn6 | cis n-6 C22:2 /100g food | C22:2n6 | Docosadienoic Acid | No | ⬜ |
| 28 | FOD22:3cn6 | cis n-6 C22:3 /100g food | C22:3n6 | Docosatrienoic Acid | Yes | ⬜ |
| 29 | FOD22:4 | C22:4 /100g food | C22:4 | Docosatetraenoic Acid | Yes | ⬜ |
| 30 | FOD22:4cn6 | cis n-6 C22:4 /100g food | C22:4n6 | Adrenic Acid | Yes | ⬜ |
| 31 | FOD22:5 | C22:5 /100g food | C22:5 | Docosapentaenoic Acid | Yes | ⬜ |
| 32 | FOD22:5cn3 | cis n-3 C22:5 /100g food | C22:5n3 | Docosapentaenoic Acid | No | ⬜ |
| 33 | FOD22:6 | C22:6 /100g food | C22:6 | Docosahexaenoic Acid | Yes | ⬜ |
| 34 | FOD22:6cn3 | cis n-3 C22:6 /100g food | C22:6n3 | Docosahexaenoic Acid | No | ⬜ |
| 35 | FOD22 poly | unknown C22 poly /100g food | - | SKIP (unknown) | - | ⬜ |
| 36 | POLYFODtr | trans poly /100g food | - | Trans Fat (Polyenoic) | Yes | ⬜ |

---

## 8. Phytosterols (10 nutrients)

| # | Code | CoFID Name | Unit | Nutri Compound | Canonical? | Status |
|---|------|------------|------|----------------|------------|--------|
| 1 | Total PHYTO | Total Phytosterols | mg | Total Plant Sterols | Yes | ⬜ |
| 2 | Other CHOL and PHYTO | Other Cholesterol and Phytosterols | mg | SKIP (aggregate) | - | ⬜ |
| 3 | PHYTO | Phytosterol | mg | Total Plant Sterols | No | ⬜ |
| 4 | BSITPHYTO | Beta-sitosterol | mg | Beta-Sitosterol | Yes | ⬜ |
| 5 | BRASPHYTO | Brassicasterol | mg | ADD_NEW | - | ⬜ |
| 6 | CAMPHYTO | Campesterol | mg | Campesterol | Yes | ⬜ |
| 7 | D5AVEN | Delta-5-avenasterol | mg | ADD_NEW | - | ⬜ |
| 8 | D7AVEN | Delta-7-avenasterol | mg | ADD_NEW | - | ⬜ |
| 9 | D7STIG | Delta-7-stigmastenol | mg | ADD_NEW | - | ⬜ |
| 10 | STIGPHYTO | Stigmasterol | mg | Stigmasterol | Yes | ⬜ |

---

## 9. Organic Acids (2 nutrients)

| # | Code | CoFID Name | Unit | Nutri Compound | Canonical? | Status |
|---|------|------------|------|----------------|------------|--------|
| 1 | CITA | Citric acid | g | Citric Acid | Yes | ⬜ |
| 2 | MALA | Malic acid | g | Malic Acid | Yes | ⬜ |

---

## Summary

| Category | Total | Match Existing | Add New | Skip |
|----------|-------|----------------|---------|------|
| Proximates | 40 | 24 | 2 | 14 |
| Inorganics | 12 | 12 | 0 | 0 |
| Vitamins | 17 | 15 | 0 | 2 |
| Vitamin Fractions | 18 | 14 | 4 | 0 |
| SFA per 100g food | 27 | 26 | 1 | 0 |
| MUFA per 100g food | 25 | 23 | 2 | 0 |
| PUFA per 100g food | 36 | 30 | 3 | 3 |
| Phytosterols | 10 | 5 | 4 | 1 |
| Organic Acids | 2 | 2 | 0 | 0 |
| **TOTAL** | **187** | **151** | **16** | **20** |

---

## New Compounds to Add

1. **Oligosaccharide** - CARBOHYDRATE
2. **Branched Chain Fatty Acids** - FATTY_ACID
3. **13-cis-Retinol** - VITAMIN
4. **Dehydroretinol** - VITAMIN
5. **Retinaldehyde** - VITAMIN
6. **25-Hydroxyvitamin D3** - VITAMIN
7. **Pentacosanoic Acid (C25:0)** - FATTY_ACID
8. **Decenoic Acid (C10:1)** - FATTY_ACID
9. **cis-Decenoic Acid** - FATTY_ACID
10. **Hexadecatrienoic Acid (C16:3)** - FATTY_ACID
11. **Hexadecatetraenoic Acid (C16:4)** - FATTY_ACID
12. **cis-Hexadecatetraenoic Acid** - FATTY_ACID
13. **Brassicasterol** - STEROL
14. **Delta-5-Avenasterol** - STEROL
15. **Delta-7-Avenasterol** - STEROL
16. **Delta-7-Stigmastenol** - STEROL
