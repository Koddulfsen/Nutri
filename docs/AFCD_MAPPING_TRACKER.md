# AFCD (Australian) to Nutri Compound Mapping Tracker

## Progress: 0/221 mapped

## Instructions
For each AFCD nutrient, map to the corresponding Nutri compound:
1. Match to our compound database (472 compounds)
2. Mark canonical if it's the primary mapping for that compound
3. Note: AFCD uses INFOODS tagnames for standardization

---

## 1. Core Nutrients - Energy & Macros (13 IDs)

| # | AFCD Name | Unit | INFOODS | Nutri Compound | Canonical? | Status |
|---|-----------|------|---------|----------------|------------|--------|
| 1 | Energy, with dietary fibre | kJ | - | Energy | No | |
| 2 | Moisture | g | - | Water | Yes | |
| 3 | Protein | g | - | Protein | Yes | |
| 4 | Fat | g | - | Total Fat | Yes | |
| 5 | Ash | g | - | Ash | Yes | |
| 6 | Dietary fibre | g | - | Total Fiber | Yes | |
| 7 | Ethanol | g | - | Alcohol | Yes | |
| 8 | Total sugars | g | - | Total Sugars | Yes | |
| 9 | Added sugars | g | - | Added Sugars | Yes | |
| 10 | Free sugars | g | - | NO_MATCH | - | |
| 11 | Starch | g | - | Starch | Yes | |
| 12 | Available carbohydrate, without sugar alcohols | g | - | Total Carbohydrate | No | |
| 13 | Available carbohydrate, with sugar alcohols | g | - | Total Carbohydrate | Yes | |

## 2. Core Nutrients - Vitamins (22 IDs)

| # | AFCD Name | Unit | INFOODS | Nutri Compound | Canonical? | Status |
|---|-----------|------|---------|----------------|------------|--------|
| 14 | Retinol (preformed vitamin A) | ug | - | Retinol | Yes | |
| 15 | Beta-carotene | ug | - | Beta-Carotene | Yes | |
| 16 | Beta-carotene equivalents (provitamin A) | ug | - | Beta-Carotene | No | |
| 17 | Vitamin A retinol equivalents | ug | - | Vitamin A | Yes | |
| 18 | Thiamin (B1) | mg | - | Thiamin | Yes | |
| 19 | Riboflavin (B2) | mg | - | Riboflavin | Yes | |
| 20 | Niacin (B3) | mg | - | Niacin | Yes | |
| 21 | Pyridoxine (B6) | mg | - | Vitamin B6 | Yes | |
| 22 | Cobalamin (B12) | ug | - | Vitamin B12 | Yes | |
| 23 | Niacin derived equivalents | mg | - | Niacin | No | |
| 24 | Folate, natural | ug | - | Folate | No | |
| 25 | Folic acid | ug | - | Folic Acid | Yes | |
| 26 | Total folates | ug | - | Folate | Yes | |
| 27 | Dietary folate equivalents | ug | - | Folate | No | |
| 28 | Vitamin C | mg | - | Vitamin C | Yes | |
| 29 | Cholecalciferol (D3) | ug | - | Vitamin D3 | Yes | |
| 30 | Ergocalciferol (D2) | ug | - | Vitamin D2 | Yes | |
| 31 | 25-hydroxy cholecalciferol (25-OH D3) | ug | - | 25-Hydroxycholecalciferol | Yes | |
| 32 | 25-hydroxy ergocalciferol (25-OH D2) | ug | - | 25-Hydroxyergocalciferol | Yes | |
| 33 | Vitamin D3 equivalents | ug | - | Vitamin D | Yes | |
| 34 | Alpha tocopherol | mg | - | Alpha-Tocopherol | Yes | |
| 35 | Vitamin E | mg | - | Vitamin E | Yes | |

## 3. Core Nutrients - Minerals (9 IDs)

| # | AFCD Name | Unit | INFOODS | Nutri Compound | Canonical? | Status |
|---|-----------|------|---------|----------------|------------|--------|
| 36 | Calcium (Ca) | mg | - | Calcium | Yes | |
| 37 | Iodine (I) | ug | - | Iodine | Yes | |
| 38 | Iron (Fe) | mg | - | Iron | Yes | |
| 39 | Magnesium (Mg) | mg | - | Magnesium | Yes | |
| 40 | Phosphorus (P) | mg | - | Phosphorus | Yes | |
| 41 | Potassium (K) | mg | - | Potassium | Yes | |
| 42 | Selenium (Se) | ug | - | Selenium | Yes | |
| 43 | Sodium (Na) | mg | - | Sodium | Yes | |
| 44 | Zinc (Zn) | mg | - | Zinc | Yes | |

## 4. Core Nutrients - Fatty Acids Summary (11 IDs)

| # | AFCD Name | Unit | INFOODS | Nutri Compound | Canonical? | Status |
|---|-----------|------|---------|----------------|------------|--------|
| 45 | Fatty acids (header) | - | - | NO_MATCH | - | |
| 46 | Total saturated fatty acids | %T; g | - | Saturated Fat | Yes | |
| 47 | Total monounsaturated fatty acids | %T; g | - | Monounsaturated Fat | Yes | |
| 48 | Total polyunsaturated fatty acids | %T; g | - | Polyunsaturated Fat | Yes | |
| 49 | Total long chain omega 3 fatty acids | %T; mg | - | Omega-3 Fatty Acids | Yes | |
| 50 | Linoleic acid | %T; g | - | Linoleic Acid | Yes | |
| 51 | Alpha-linolenic acid | %T; g | - | Alpha-Linolenic Acid | Yes | |
| 52 | C20:5w3 Eicosapentaenoic | %T; mg | - | EPA | Yes | |
| 53 | C22:5w3 Docosapentaenoic | %T; mg | - | DPA | Yes | |
| 54 | C22:6w3 Docosahexaenoic | %T; mg | - | DHA | Yes | |
| 55 | Total trans fatty acids | %T; mg | - | Trans Fat | Yes | |

## 5. Core Nutrients - Other (4 IDs)

| # | AFCD Name | Unit | INFOODS | Nutri Compound | Canonical? | Status |
|---|-----------|------|---------|----------------|------------|--------|
| 56 | Amino acids (header) | - | - | NO_MATCH | - | |
| 57 | Tryptophan | mg/g N; mg | - | Tryptophan | Yes | |
| 58 | Caffeine | mg | CAFFN | Caffeine | Yes | |
| 59 | Cholesterol | mg | CHOLE | Cholesterol | Yes | |

---

## 6. Proximates - Sugars (8 IDs)

| # | AFCD Name | Unit | INFOODS | Nutri Compound | Canonical? | Status |
|---|-----------|------|---------|----------------|------------|--------|
| 60 | Energy, without dietary fibre | kJ | - | Energy | No | |
| 61 | Fructose | g | FRUS | Fructose | Yes | |
| 62 | Glucose | g | GLUCS | Glucose | Yes | |
| 63 | Sucrose | g | SUCS | Sucrose | Yes | |
| 64 | Maltose | g | MALS | Maltose | Yes | |
| 65 | Lactose | g | LACS | Lactose | Yes | |
| 66 | Galactose | g | GALS | Galactose | Yes | |
| 67 | Maltotriose | g | MALTRS | NO_MATCH | - | |

## 7. Proximates - Starches & Carbs (10 IDs)

| # | AFCD Name | Unit | INFOODS | Nutri Compound | Canonical? | Status |
|---|-----------|------|---------|----------------|------------|--------|
| 68 | Resistant starch | g | - | Resistant Starch | Yes | |
| 69 | Dextrin | g | DEXTRIN | NO_MATCH | - | |
| 70 | Glycerol | g | GLYRL | Glycerol | Yes | |
| 71 | Glycogen | g | GLYC | Glycogen | Yes | |
| 72 | Inulin | g | INULIN | Inulin | Yes | |
| 73 | Mannitol | g | MANTL | Mannitol | Yes | |
| 74 | Maltodextrin | g | MALTDEX | Maltodextrin | Yes | |
| 75 | Oligosaccharides | g | OLSAC | Oligosaccharides | Yes | |
| 76 | Raffinose | g | RAFS | Raffinose | Yes | |
| 77 | Stachyose | g | STAS | Stachyose | Yes | |

## 8. Proximates - Sugar Alcohols (5 IDs)

| # | AFCD Name | Unit | INFOODS | Nutri Compound | Canonical? | Status |
|---|-----------|------|---------|----------------|------------|--------|
| 78 | Sorbitol | g | SORTL | Sorbitol | Yes | |
| 79 | Erythritol | g | ERYTHL | Erythritol | Yes | |
| 80 | Maltitol | g | MALTL | NO_MATCH | - | |
| 81 | Xylitol | g | XYLTL | Xylitol | Yes | |

## 9. Proximates - Organic Acids (11 IDs)

| # | AFCD Name | Unit | INFOODS | Nutri Compound | Canonical? | Status |
|---|-----------|------|---------|----------------|------------|--------|
| 82 | Acetic acid | g | ACEAC | Acetic Acid | Yes | |
| 83 | Citric acid | g | CITAC | Citric Acid | Yes | |
| 84 | Fumaric acid | g | FUMAC | Fumaric Acid | Yes | |
| 85 | Lactic acid | g | LACAC | Lactic Acid | Yes | |
| 86 | Malic acid | g | MALAC | Malic Acid | Yes | |
| 87 | Oxalic acid | g | OXALAC | Oxalic Acid | Yes | |
| 88 | Propionic acid | g | PROPAC | NO_MATCH | - | |
| 89 | Quinic acid | g | QUINAC | Quinic Acid | Yes | |
| 90 | Shikimic acid | g | SHIKAC | NO_MATCH | - | |
| 91 | Succinic acid | g | SUCAC | Succinic Acid | Yes | |
| 92 | Tartaric acid | g | TARAC | Tartaric Acid | Yes | |

---

## 10. Vitamins - Extended (15 IDs)

| # | AFCD Name | Unit | INFOODS | Nutri Compound | Canonical? | Status |
|---|-----------|------|---------|----------------|------------|--------|
| 93 | Alpha-carotene | ug | CARTA | Alpha-Carotene | Yes | |
| 94 | Cryptoxanthin | ug | CRYPX | Beta-Cryptoxanthin | Yes | |
| 95 | Lutein | ug | LUTN | Lutein | Yes | |
| 96 | Lycopene | ug | LYCPN | Lycopene | Yes | |
| 97 | Xanthophyl | ug | N/A | Zeaxanthin | Yes | |
| 98 | Niacin derived from tryptophan | mg | NIATRP | Niacin | No | |
| 99 | Pantothenic acid (B5) | mg | PANTAC | Pantothenic Acid | Yes | |
| 100 | Biotin (B7) | ug | BIOT | Biotin | Yes | |
| 101 | Alpha tocotrienol | mg | TOCTRA | Alpha-Tocotrienol | Yes | |
| 102 | Beta tocopherol | mg | TOCPHB | Beta-Tocopherol | Yes | |
| 103 | Beta tocotrienol | mg | TOCTRB | Beta-Tocotrienol | Yes | |
| 104 | Delta tocopherol | mg | TOCPHD | Delta-Tocopherol | Yes | |
| 105 | Delta tocotrienol | mg | TOCTRD | Delta-Tocotrienol | Yes | |
| 106 | Gamma tocopherol | mg | TOCPHG | Gamma-Tocopherol | Yes | |
| 107 | Gamma tocotrienol | mg | TOCTRG | Gamma-Tocotrienol | Yes | |

---

## 11. Minerals - Extended (16 IDs)

| # | AFCD Name | Unit | INFOODS | Nutri Compound | Canonical? | Status |
|---|-----------|------|---------|----------------|------------|--------|
| 108 | Aluminium (Al) | ug | AL | Aluminum | Yes | |
| 109 | Antimony (Sb) | ug | SB | Antimony | Yes | |
| 110 | Arsenic (As) | ug | AS | Arsenic | Yes | |
| 111 | Cadmium (Cd) | ug | CD | Cadmium | Yes | |
| 112 | Chromium (Cr) | ug | CR | Chromium | Yes | |
| 113 | Chloride (Cl) | mg | CL | Chloride | Yes | |
| 114 | Cobalt (Co) | ug | CO | Cobalt | Yes | |
| 115 | Copper (Cu) | mg | CU | Copper | Yes | |
| 116 | Fluoride (F) | ug | F | Fluoride | Yes | |
| 117 | Lead (Pb) | ug | PB | Lead | Yes | |
| 118 | Manganese (Mn) | mg | MN | Manganese | Yes | |
| 119 | Mercury (Hg) | ug | HG | Mercury | Yes | |
| 120 | Molybdenum (Mo) | ug | MO | Molybdenum | Yes | |
| 121 | Nickel (Ni) | ug | NI | Nickel | Yes | |
| 122 | Sulphur (S) | mg | S | Sulfur | Yes | |
| 123 | Tin (Sn) | ug | SN | NO_MATCH | - | |

---

## 12. Fatty Acids - Saturated as %T (18 IDs)

| # | AFCD Name | Unit | INFOODS | Nutri Compound | Canonical? | Status |
|---|-----------|------|---------|----------------|------------|--------|
| 124 | C4 | %T | F4D0F | Butyric Acid | No | |
| 125 | C6 | %T | F6D0F | Caproic Acid | No | |
| 126 | C8 | %T | F8D0F | Caprylic Acid | No | |
| 127 | C10 | %T | F10D0F | Capric Acid | No | |
| 128 | C11 | %T | - | Undecanoic Acid | No | |
| 129 | C12 | %T | F12D0F | Lauric Acid | No | |
| 130 | C13 | %T | F13D0F | Tridecanoic Acid | No | |
| 131 | C14 | %T | F14D0F | Myristic Acid | No | |
| 132 | C15 | %T | F15D0F | Pentadecanoic Acid | No | |
| 133 | C16 | %T | F16D0F | Palmitic Acid | No | |
| 134 | C17 | %T | F17D0F | Margaric Acid | No | |
| 135 | C18 | %T | F18D0F | Stearic Acid | No | |
| 136 | C19 | %T | F19D0F | Nonadecanoic Acid | No | |
| 137 | C20 | %T | F20D0F | Arachidic Acid | No | |
| 138 | C21 | %T | F21D0F | Heneicosanoic Acid | No | |
| 139 | C22 | %T | F22D0F | Behenic Acid | No | |
| 140 | C23 | %T | F23D0F | Tricosanoic Acid | No | |
| 141 | C24 | %T | F24D0F | Lignoceric Acid | No | |

## 13. Fatty Acids - Monounsaturated as %T (8 IDs)

| # | AFCD Name | Unit | INFOODS | Nutri Compound | Canonical? | Status |
|---|-----------|------|---------|----------------|------------|--------|
| 142 | C14:1 | %T | F14D1F | Myristoleic Acid | No | |
| 143 | C15:1 | %T | F15D1F | NO_MATCH | - | |
| 144 | C16:1 | %T | F16D1F | Palmitoleic Acid | No | |
| 145 | C17:1 | %T | F17D1F | NO_MATCH | - | |
| 146 | C18:1 | %T | F18D1F | Oleic Acid | No | |
| 147 | C20:1 | %T | F20D1F | Gondoic Acid | No | |
| 148 | C22:1 | %T | F22D1F | Erucic Acid | No | |
| 149 | C24:1 | %T | F24D1F | Nervonic Acid | No | |

## 14. Fatty Acids - Polyunsaturated as %T (14 IDs)

| # | AFCD Name | Unit | INFOODS | Nutri Compound | Canonical? | Status |
|---|-----------|------|---------|----------------|------------|--------|
| 150 | C18:2w6 | %T | F18D2N6F | Linoleic Acid | No | |
| 151 | C18:3w3 | %T | F18D3N3F | Alpha-Linolenic Acid | No | |
| 152 | C18:3w6 | %T | F18D3N6F | Gamma-Linolenic Acid | No | |
| 153 | C18:4w3 | %T | F18D4N3F | Stearidonic Acid | No | |
| 154 | C20:2w6 | %T | F20D2N6F | Eicosadienoic Acid | No | |
| 155 | C20:3w3 | %T | F20D3N3F | NO_MATCH | - | |
| 156 | C20:3w6 | %T | F20D3N6F | Dihomo-Gamma-Linolenic Acid | No | |
| 157 | C20:4w3 | %T | F20D4N3 | Eicosatetraenoic Acid (n-3) | No | |
| 158 | C20:4w6 | %T | F20D4N6F | Arachidonic Acid | No | |
| 159 | C20:5w3 | %T | F20D5N3F | EPA | No | |
| 160 | C22:2w6 | %T | - | Docosadienoic Acid | No | |
| 161 | C22:4w6 | %T | F22D4N6F | Adrenic Acid | No | |
| 162 | C22:5w3 | %T | F22D5N3F | DPA | No | |
| 163 | C22:6w3 | %T | F22D6N3F | DHA | No | |

## 15. Fatty Acids - Saturated as g (18 IDs)

| # | AFCD Name | Unit | INFOODS | Nutri Compound | Canonical? | Status |
|---|-----------|------|---------|----------------|------------|--------|
| 164 | C4FD | g | F4D0 | Butyric Acid | Yes | |
| 165 | C6FD | g | F6D0 | Caproic Acid | Yes | |
| 166 | C8FD | g | F8D0 | Caprylic Acid | Yes | |
| 167 | C10FD | g | F10D0 | Capric Acid | Yes | |
| 168 | C11FD | g | - | Undecanoic Acid | Yes | |
| 169 | C12FD | g | F12D0 | Lauric Acid | Yes | |
| 170 | C13FD | g | F13D0 | Tridecanoic Acid | Yes | |
| 171 | C14FD | g | F14D0 | Myristic Acid | Yes | |
| 172 | C15FD | g | F15D0 | Pentadecanoic Acid | Yes | |
| 173 | C16FD | g | F16D0 | Palmitic Acid | Yes | |
| 174 | C17FD | g | F17D0 | Margaric Acid | Yes | |
| 175 | C18FD | g | F18D0 | Stearic Acid | Yes | |
| 176 | C19FD | g | F19D0 | Nonadecanoic Acid | Yes | |
| 177 | C20FD | g | F20D0 | Arachidic Acid | Yes | |
| 178 | C21FD | g | F21D0 | Heneicosanoic Acid | Yes | |
| 179 | C22FD | g | F22D0 | Behenic Acid | Yes | |
| 180 | C23FD | g | F23D0 | Tricosanoic Acid | Yes | |
| 181 | C24FD | g | F24D0 | Lignoceric Acid | Yes | |

## 16. Fatty Acids - Monounsaturated as g (8 IDs)

| # | AFCD Name | Unit | INFOODS | Nutri Compound | Canonical? | Status |
|---|-----------|------|---------|----------------|------------|--------|
| 182 | C14:1FD | g | F14D1 | Myristoleic Acid | Yes | |
| 183 | C15:1FD | g | F15D1 | NO_MATCH | - | |
| 184 | C16:1FD | g | F16D1 | Palmitoleic Acid | Yes | |
| 185 | C17:1FD | g | F17D1 | NO_MATCH | - | |
| 186 | C18:1FD | g | F18D1 | Oleic Acid | Yes | |
| 187 | C20:1FD | g | F20D1 | Gondoic Acid | Yes | |
| 188 | C22:1FD | g | F22D1 | Erucic Acid | Yes | |
| 189 | C24:1FD | g | F24D1 | Nervonic Acid | Yes | |

## 17. Fatty Acids - Polyunsaturated as g/mg (14 IDs)

| # | AFCD Name | Unit | INFOODS | Nutri Compound | Canonical? | Status |
|---|-----------|------|---------|----------------|------------|--------|
| 190 | C18:2w6FD | g | F18D2N6 | Linoleic Acid | Yes | |
| 191 | C18:3w3FD | g | F18D3N3 | Alpha-Linolenic Acid | Yes | |
| 192 | C18:3w6FD | mg | F18D3N6 | Gamma-Linolenic Acid | Yes | |
| 193 | C18:4w3FD | mg | F18D4N3 | Stearidonic Acid | Yes | |
| 194 | C20:2w6FD | mg | F20D2N6 | Eicosadienoic Acid | Yes | |
| 195 | C20:3w3FD | mg | F20D3N3 | NO_MATCH | - | |
| 196 | C20:3w6FD | mg | F20D3N6 | Dihomo-Gamma-Linolenic Acid | Yes | |
| 197 | C20:4w3FD | mg | F20D4N3 | Eicosatetraenoic Acid (n-3) | Yes | |
| 198 | C20:4w6FD | mg | F20D4N6 | Arachidonic Acid | Yes | |
| 199 | C20:5w3FD | mg | F20D5N3 | EPA | Yes | |
| 200 | C22:2w6FD | mg | - | Docosadienoic Acid | Yes | |
| 201 | C22:4w6FD | mg | F22D4N6 | Adrenic Acid | Yes | |
| 202 | C22:5w3FD | mg | F22D5N3 | DPA | Yes | |
| 203 | C22:6w3FD | mg | F22D6N3 | DHA | Yes | |

---

## 18. Amino Acids (17 IDs)

| # | AFCD Name | Unit | INFOODS | Nutri Compound | Canonical? | Status |
|---|-----------|------|---------|----------------|------------|--------|
| 204 | Alanine | mg/g N | ALAN | Alanine | Yes | |
| 205 | Arginine | mg/g N | ARGN | Arginine | Yes | |
| 206 | Aspartic acid | mg/g N | ASPN | Aspartic Acid | Yes | |
| 207 | Cystine plus cysteine | mg/g N | CYSN | Cystine | Yes | |
| 208 | Glutamic acid | mg/g N | GLUN | Glutamic Acid | Yes | |
| 209 | Glycine | mg/g N | GLYN | Glycine | Yes | |
| 210 | Histidine | mg/g N | HISN | Histidine | Yes | |
| 211 | Isoleucine | mg/g N | ILEN | Isoleucine | Yes | |
| 212 | Leucine | mg/g N | LEUN | Leucine | Yes | |
| 213 | Lysine | mg/g N | LYSN | Lysine | Yes | |
| 214 | Methionine | mg/g N | METN | Methionine | Yes | |
| 215 | Phenylalanine | mg/g N | PHEN | Phenylalanine | Yes | |
| 216 | Proline | mg/g N | PRON | Proline | Yes | |
| 217 | Serine | mg/g N | SERN | Serine | Yes | |
| 218 | Threonine | mg/g N | THRN | Threonine | Yes | |
| 219 | Tyrosine | mg/g N | TYRN | Tyrosine | Yes | |
| 220 | Valine | mg/g N | VALN | Valine | Yes | |

---

## Summary

| Category | Count | Mapped | NO_MATCH |
|----------|-------|--------|----------|
| Core - Macros | 13 | TBD | TBD |
| Core - Vitamins | 22 | TBD | TBD |
| Core - Minerals | 9 | TBD | TBD |
| Core - Fatty Acids | 11 | TBD | TBD |
| Core - Other | 4 | TBD | TBD |
| Proximates - Sugars | 8 | TBD | TBD |
| Proximates - Starches | 10 | TBD | TBD |
| Proximates - Sugar Alcohols | 5 | TBD | TBD |
| Proximates - Organic Acids | 11 | TBD | TBD |
| Vitamins Extended | 15 | TBD | TBD |
| Minerals Extended | 16 | TBD | TBD |
| Fatty Acids %T Saturated | 18 | TBD | TBD |
| Fatty Acids %T Mono | 8 | TBD | TBD |
| Fatty Acids %T Poly | 14 | TBD | TBD |
| Fatty Acids g Saturated | 18 | TBD | TBD |
| Fatty Acids g Mono | 8 | TBD | TBD |
| Fatty Acids g Poly | 14 | TBD | TBD |
| Amino Acids | 17 | TBD | TBD |
| **TOTAL** | **221** | **TBD** | **TBD** |

---

## NO_MATCH Items to Review

These AFCD nutrients need new compounds:

### Carbohydrates (4)
1. Free sugars (g) - WHO metric (total sugars minus lactose in dairy)
2. Maltotriose (g) - trisaccharide
3. Dextrin (g) - polysaccharide
4. Maltitol (g) - sugar alcohol

### Organic Acids (2)
5. Propionic acid (g) - short-chain fatty acid / organic acid
6. Shikimic acid (g) - plant metabolite

### Minerals (1)
7. Tin (Sn) - only heavy metal we're missing

### Fatty Acids (3)
8. C15:1 - Pentadecenoic acid (rare MUFA)
9. C17:1 - Heptadecenoic acid (rare MUFA)
10. C20:3w3 - Eicosatrienoic acid n-3 (rare PUFA)

**Total: 10 new compounds needed**

### Already Mapped (updated from NO_MATCH)
These were marked NO_MATCH but we already have them:
- Aluminium → Aluminum (MINERAL)
- Antimony → Antimony (MINERAL)
- Arsenic → Arsenic (MINERAL)
- Cadmium → Cadmium (MINERAL)
- Lead → Lead (MINERAL)
- Mercury → Mercury (MINERAL)
