# FDC (USDA) to Nutri Compound Mapping Tracker

## Progress: 357/357 mapped ✅

## Instructions
For each FDC nutrient ID, map to the corresponding Nutri compound:
1. FDC ID = internal ID (1003, 1008, etc.)
2. FDC Num = nutrient number (often matches CNF IDs)
3. Match to our compound database
4. Mark canonical if it's the primary mapping

---

## 1. Proximates & Energy (16 IDs)

| # | FDC ID | FDC Num | FDC Name | Unit | Nutri Compound | Canonical? | Status |
|---|--------|---------|----------|------|----------------|------------|--------|
| 1 | 2045 | 951 | Proximates | G | NO_MATCH | - | ✅ |
| 2 | 1051 | 255 | Water | G | Water | Yes | ✅ |
| 3 | 1001 | 201 | Solids | G | NO_MATCH | - | ✅ |
| 4 | 2047 | 957 | Energy (Atwater General Factors) | KCAL | Energy | No | ✅ |
| 5 | 2048 | 958 | Energy (Atwater Specific Factors) | KCAL | Energy | No | ✅ |
| 6 | 1008 | 208 | Energy | KCAL | Energy | Yes | ✅ |
| 7 | 1062 | 268 | Energy | kJ | Energy | No | ✅ |
| 8 | 1002 | 202 | Nitrogen | G | NO_MATCH | - | ✅ |
| 9 | 1003 | 203 | Protein | G | Protein | Yes | ✅ |
| 10 | 1053 | 257 | Adjusted Protein | G | Protein | No | ✅ |
| 11 | 1004 | 204 | Total lipid (fat) | G | Total Fat | Yes | ✅ |
| 12 | 1085 | 298 | Total fat (NLEA) | G | Total Fat | No | ✅ |
| 13 | 1007 | 207 | Ash | G | Ash | Yes | ✅ |
| 14 | 2039 | 956 | Carbohydrates | G | Total Carbohydrate | No | ✅ |
| 15 | 1005 | 205 | Carbohydrate, by difference | G | Total Carbohydrate | Yes | ✅ |
| 16 | 1050 | 205.2 | Carbohydrate, by summation | G | Total Carbohydrate | No | ✅ |

## 2. Carbohydrates & Fiber (32 IDs)

| # | FDC ID | FDC Num | FDC Name | Unit | Nutri Compound | Canonical? | Status |
|---|--------|---------|----------|------|----------------|------------|--------|
| 17 | 1079 | 291 | Fiber, total dietary | G | Total Fiber | Yes | ✅ |
| 18 | 1082 | 295 | Fiber, soluble | G | Soluble Fiber | Yes | ✅ |
| 19 | 1084 | 297 | Fiber, insoluble | G | Insoluble Fiber | Yes | ✅ |
| 20 | 2033 | 293 | Total dietary fiber (AOAC 2011.25) | G | Total Fiber | No | ✅ |
| 21 | 2038 | 293.3 | High Molecular Weight Dietary Fiber (HMWDF) | G | NO_MATCH | - | ✅ |
| 22 | 2065 | 293.4 | Low Molecular Weight Dietary Fiber (LMWDF) | G | NO_MATCH | - | ✅ |
| 23 | 2034 | 293.1 | Insoluble dietary fiber (IDF) | G | Insoluble Fiber | No | ✅ |
| 24 | 2035 | 293.2 | Soluble dietary fiber (SDFP+SDFS) | G | Soluble Fiber | No | ✅ |
| 25 | 2036 | 954 | Soluble dietary fiber (SDFP) | G | NO_MATCH | - | ✅ |
| 26 | 2037 | 953 | Soluble dietary fiber (SDFS) | G | NO_MATCH | - | ✅ |
| 27 | 2058 |  | Beta-glucan | G | NO_MATCH | - | ✅ |
| 28 | 1063 | 269.3 | Sugars, Total NLEA | G | Total Sugars | No | ✅ |
| 29 | 2000 | 269 | Sugars, Total | G | Total Sugars | Yes | ✅ |
| 30 | 1236 | 549 | Sugars, intrinsic | G | NO_MATCH | - | ✅ |
| 31 | 1235 | 539 | Sugars, added | G | NO_MATCH | - | ✅ |
| 32 | 1010 | 210 | Sucrose | G | Sucrose | Yes | ✅ |
| 33 | 1011 | 211 | Glucose | G | Glucose | Yes | ✅ |
| 34 | 1012 | 212 | Fructose | G | Fructose | Yes | ✅ |
| 35 | 1013 | 213 | Lactose | G | Lactose | Yes | ✅ |
| 36 | 1014 | 214 | Maltose | G | Maltose | Yes | ✅ |
| 37 | 1075 | 287 | Galactose | G | Galactose | Yes | ✅ |
| 38 | 1009 | 209 | Starch | G | Starch | Yes | ✅ |
| 39 | 2064 |  | Oligosaccharides | MG | NO_MATCH | - | ✅ |
| 40 | 1076 | 288 | Raffinose | G | Raffinose | Yes | ✅ |
| 41 | 1077 | 289 | Stachyose | G | Stachyose | Yes | ✅ |
| 42 | 2063 |  | Verbascose | G | NO_MATCH | - | ✅ |
| 43 | 1055 | 260 | Mannitol | G | Mannitol | Yes | ✅ |
| 44 | 1056 | 261 | Sorbitol | G | Sorbitol | Yes | ✅ |
| 45 | 1078 | 290 | Xylitol | G | NO_MATCH | - | ✅ |
| 46 | 1181 | 422 | Inositol | MG | Inositol | Yes | ✅ |
| 47 | 1025 | 229 | Organic acids | G | NO_MATCH | - | ✅ |
| 48 | 1026 | 230 | Acetic acid | MG | NO_MATCH | - | ✅ |

## 3. Organic Acids (22 IDs)

| # | FDC ID | FDC Num | FDC Name | Unit | Nutri Compound | Canonical? | Status |
|---|--------|---------|----------|------|----------------|------------|--------|
| 49 | 1027 | 231 | Aconitic acid | MG | NO_MATCH | - | ✅ |
| 50 | 1028 | 232 | Benzoic acid | MG | NO_MATCH | - | ✅ |
| 51 | 1029 | 233 | Chelidonic acid | MG | NO_MATCH | - | ✅ |
| 52 | 1030 | 234 | Chlorogenic acid | MG | Chlorogenic Acid | Yes | ✅ |
| 53 | 1031 | 235 | Cinnamic acid | MG | NO_MATCH | - | ✅ |
| 54 | 1032 | 236 | Citric acid | MG | NO_MATCH | - | ✅ |
| 55 | 1033 | 237 | Fumaric acid | MG | NO_MATCH | - | ✅ |
| 56 | 1034 | 238 | Galacturonic acid | MG | NO_MATCH | - | ✅ |
| 57 | 1035 | 239 | Gallic acid | MG | Gallic Acid | Yes | ✅ |
| 58 | 1036 | 240 | Glycolic acid | MG | NO_MATCH | - | ✅ |
| 59 | 1037 | 241 | Isocitric acid | MG | NO_MATCH | - | ✅ |
| 60 | 1038 | 242 | Lactic acid | MG | NO_MATCH | - | ✅ |
| 61 | 1039 | 243 | Malic acid | MG | NO_MATCH | - | ✅ |
| 62 | 1040 | 244 | Oxaloacetic acid | MG | NO_MATCH | - | ✅ |
| 63 | 1041 | 245 | Oxalic acid | MG | Oxalic Acid | Yes | ✅ |
| 64 | 1042 | 246 | Phytic acid | MG | Phytic Acid | Yes | ✅ |
| 65 | 1043 | 247 | Pyruvic acid | MG | NO_MATCH | - | ✅ |
| 66 | 1044 | 248 | Quinic acid | MG | NO_MATCH | - | ✅ |
| 67 | 1045 | 249 | Salicylic acid | MG | NO_MATCH | - | ✅ |
| 68 | 1046 | 250 | Succinic acid | MG | NO_MATCH | - | ✅ |
| 69 | 1047 | 251 | Tartaric acid | MG | NO_MATCH | - | ✅ |
| 70 | 1048 | 252 | Ursolic acid | MG | NO_MATCH | - | ✅ |

## 4. Minerals (22 IDs)

| # | FDC ID | FDC Num | FDC Name | Unit | Nutri Compound | Canonical? | Status |
|---|--------|---------|----------|------|----------------|------------|--------|
| 71 | 2043 | 300 | Minerals | MG | NO_MATCH | - | ✅ |
| 72 | 1087 | 301 | Calcium, Ca | MG | Calcium | Yes | ✅ |
| 73 | 1239 | 561 | Calcium, intrinsic | MG | Calcium | No | ✅ |
| 74 | 1237 | 551 | Calcium, added | MG | NO_MATCH | - | ✅ |
| 75 | 1089 | 303 | Iron, Fe | MG | Iron | Yes | ✅ |
| 76 | 1240 | 563 | Iron, intrinsic | MG | Iron | No | ✅ |
| 77 | 1238 | 553 | Iron, added | MG | NO_MATCH | - | ✅ |
| 78 | 1090 | 304 | Magnesium, Mg | MG | Magnesium | Yes | ✅ |
| 79 | 1091 | 305 | Phosphorus, P | MG | Phosphorus | Yes | ✅ |
| 80 | 1092 | 306 | Potassium, K | MG | Potassium | Yes | ✅ |
| 81 | 1093 | 307 | Sodium, Na | MG | Sodium | Yes | ✅ |
| 82 | 1095 | 309 | Zinc, Zn | MG | Zinc | Yes | ✅ |
| 83 | 1098 | 312 | Copper, Cu | MG | Copper | Yes | ✅ |
| 84 | 1101 | 315 | Manganese, Mn | MG | Manganese | Yes | ✅ |
| 85 | 1100 | 314 | Iodine, I | UG | Iodine | Yes | ✅ |
| 86 | 1103 | 317 | Selenium, Se | UG | Selenium | Yes | ✅ |
| 87 | 1099 | 313 | Fluoride, F | UG | Fluoride | Yes | ✅ |
| 88 | 1094 | 308 | Sulfur, S | MG | Sulfur | Yes | ✅ |
| 89 | 1146 | 371 | Nickel, Ni | UG | Nickel | Yes | ✅ |
| 90 | 1102 | 316 | Molybdenum, Mo | UG | Molybdenum | Yes | ✅ |
| 91 | 1097 | 311 | Cobalt, Co | UG | Cobalt | Yes | ✅ |
| 92 | 1137 | 354 | Boron, B | UG | Boron | Yes | ✅ |

## 5. Vitamins (76 IDs)

| # | FDC ID | FDC Num | FDC Name | Unit | Nutri Compound | Canonical? | Status |
|---|--------|---------|----------|------|----------------|------------|--------|
| 93 | 2046 | 952 | Vitamins and Other Components | G | NO_MATCH | - | ✅ |
| 94 | 1162 | 401 | Vitamin C, total ascorbic acid | MG | Vitamin C | Yes | ✅ |
| 95 | 1247 | 581 | Vitamin C, intrinsic | MG | Vitamin C | No | ✅ |
| 96 | 1241 | 571 | Vitamin C, added | MG | NO_MATCH | - | ✅ |
| 97 | 1165 | 404 | Thiamin | MG | Thiamin | Yes | ✅ |
| 98 | 1249 | 584 | Thiamin, intrinsic | MG | Thiamin | No | ✅ |
| 99 | 1243 | 574 | Thiamin, added | MG | NO_MATCH | - | ✅ |
| 100 | 1166 | 405 | Riboflavin | MG | Riboflavin | Yes | ✅ |
| 101 | 1250 | 585 | Riboflavin, intrinsic | MG | Riboflavin | No | ✅ |
| 102 | 1244 | 575 | Riboflavin, added | MG | NO_MATCH | - | ✅ |
| 103 | 1167 | 406 | Niacin | MG | Niacin | Yes | ✅ |
| 104 | 1251 | 586 | Niacin, intrinsic | MG | Niacin | No | ✅ |
| 105 | 1245 | 576 | Niacin, added | MG | NO_MATCH | - | ✅ |
| 106 | 1170 | 410 | Pantothenic acid | MG | Pantothenic Acid | Yes | ✅ |
| 107 | 1175 | 415 | Vitamin B-6 | MG | Vitamin B6 | Yes | ✅ |
| 108 | 1176 | 416 | Biotin | UG | Biotin | Yes | ✅ |
| 109 | 1177 | 417 | Folate, total | UG | Folate | Yes | ✅ |
| 110 | 1186 | 431 | Folic acid | UG | Folate | No | ✅ |
| 111 | 1187 | 432 | Folate, food | UG | Folate | No | ✅ |
| 112 | 1190 | 435 | Folate, DFE | UG | Folate | No | ✅ |
| 113 | 1180 | 421 | Choline, total | MG | Choline | Yes | ✅ |
| 114 | 1194 | 450 | Choline, free | MG | Choline | No | ✅ |
| 115 | 1195 | 451 | Choline, from phosphocholine | MG | NO_MATCH | - | ✅ |
| 116 | 1196 | 452 | Choline, from phosphotidyl choline | MG | NO_MATCH | - | ✅ |
| 117 | 1197 | 453 | Choline, from glycerophosphocholine | MG | NO_MATCH | - | ✅ |
| 118 | 1199 | 455 | Choline, from sphingomyelin | MG | NO_MATCH | - | ✅ |
| 119 | 1198 | 454 | Betaine | MG | Betaine | Yes | ✅ |
| 120 | 1178 | 418 | Vitamin B-12 | UG | Vitamin B12 | Yes | ✅ |
| 121 | 1252 | 588 | Vitamin B-12, intrinsic | UG | Vitamin B12 | No | ✅ |
| 122 | 1246 | 578 | Vitamin B-12, added | UG | NO_MATCH | - | ✅ |
| 123 | 1106 | 320 | Vitamin A, RAE | UG | Vitamin A | Yes | ✅ |
| 124 | 1105 | 319 | Retinol | UG | Retinol | Yes | ✅ |
| 125 | 1107 | 321 | Carotene, beta | UG | Beta-Carotene | Yes | ✅ |
| 126 | 1159 | 321.1 | cis-beta-Carotene | UG | Beta-Carotene | No | ✅ |
| 127 | 2028 | 321.2 | trans-beta-Carotene | UG | Beta-Carotene | No | ✅ |
| 128 | 1108 | 322 | Carotene, alpha | UG | Alpha-Carotene | Yes | ✅ |
| 129 | 1118 | 332 | Carotene, gamma | UG | NO_MATCH | - | ✅ |
| 130 | 1120 | 334 | Cryptoxanthin, beta | UG | Beta-Cryptoxanthin | Yes | ✅ |
| 131 | 2032 | 335 | Cryptoxanthin, alpha | UG | NO_MATCH | - | ✅ |
| 132 | 1104 | 318 | Vitamin A, IU | IU | Vitamin A | No | ✅ |
| 133 | 1156 | 392 | Vitamin A, RE | MCG_RE | Vitamin A | No | ✅ |
| 134 | 2040 | 955 | Other carotenoids | UG | NO_MATCH | - | ✅ |
| 135 | 1122 | 337 | Lycopene | UG | Lycopene | Yes | ✅ |
| 136 | 1160 | 337.1 | cis-Lycopene | UG | Lycopene | No | ✅ |
| 137 | 2029 | 337.2 | trans-Lycopene | UG | Lycopene | No | ✅ |
| 138 | 1123 | 338 | Lutein + zeaxanthin | UG | NO_MATCH | - | ✅ |
| 139 | 1161 | 338.3 | cis-Lutein/Zeaxanthin | UG | NO_MATCH | - | ✅ |
| 140 | 1121 | 338.1 | Lutein | UG | Lutein | Yes | ✅ |
| 141 | 1119 | 338.2 | Zeaxanthin | UG | Zeaxanthin | Yes | ✅ |
| 142 | 1116 | 330 | Phytoene | UG | NO_MATCH | - | ✅ |
| 143 | 1117 | 331 | Phytofluene | UG | NO_MATCH | - | ✅ |
| 144 | 1157 | 393 | Carotene | MCG_RE | NO_MATCH | - | ✅ |
| 145 | 1158 | 394 | Vitamin E | MG_ATE | Vitamin E | No | ✅ |
| 146 | 2041 | 323.99 | Tocopherols and tocotrienols | MG | NO_MATCH | - | ✅ |
| 147 | 2055 |  | Total Tocopherols | MG | NO_MATCH | - | ✅ |
| 148 | 2054 |  | Total Tocotrienols | MG | NO_MATCH | - | ✅ |
| 149 | 1109 | 323 | Vitamin E (alpha-tocopherol) | MG | Vitamin E | Yes | ✅ |
| 150 | 1242 | 573 | Vitamin E, added | MG | NO_MATCH | - | ✅ |
| 151 | 1248 | 583 | Vitamin E, intrinsic | MG | Vitamin E | No | ✅ |
| 152 | 1125 | 341 | Tocopherol, beta | MG | Beta-Tocopherol | Yes | ✅ |
| 153 | 1126 | 342 | Tocopherol, gamma | MG | Gamma-Tocopherol | Yes | ✅ |
| 154 | 1127 | 343 | Tocopherol, delta | MG | Delta-Tocopherol | Yes | ✅ |
| 155 | 1128 | 344 | Tocotrienol, alpha | MG | Alpha-Tocotrienol | Yes | ✅ |
| 156 | 1129 | 345 | Tocotrienol, beta | MG | Beta-Tocotrienol | Yes | ✅ |
| 157 | 1130 | 346 | Tocotrienol, gamma | MG | Gamma-Tocotrienol | Yes | ✅ |
| 158 | 1131 | 347 | Tocotrienol, delta | MG | Delta-Tocotrienol | Yes | ✅ |
| 159 | 1110 | 324 | Vitamin D (D2 + D3), International Units | IU | Vitamin D | No | ✅ |
| 160 | 1114 | 328 | Vitamin D (D2 + D3) | UG | Vitamin D | Yes | ✅ |
| 161 | 1111 | 325 | Vitamin D2 (ergocalciferol) | UG | Vitamin D2 | Yes | ✅ |
| 162 | 1112 | 326 | Vitamin D3 (cholecalciferol) | UG | Vitamin D3 | Yes | ✅ |
| 163 | 1113 | 327 | 25-hydroxycholecalciferol | UG | NO_MATCH | - | ✅ |
| 164 | 2059 |  | Vitamin D4 | UG | NO_MATCH | - | ✅ |
| 165 | 1115 | 329 | 25-hydroxyergocalciferol | UG | NO_MATCH | - | ✅ |
| 166 | 1185 | 430 | Vitamin K (phylloquinone) | UG | Vitamin K1 | Yes | ✅ |
| 167 | 1184 | 429 | Vitamin K (Dihydrophylloquinone) | UG | NO_MATCH | - | ✅ |
| 168 | 1183 | 428 | Vitamin K (Menaquinone-4) | UG | Menaquinone-4 | Yes | ✅ |

## 6. Lipids - Totals (6 IDs)

| # | FDC ID | FDC Num | FDC Name | Unit | Nutri Compound | Canonical? | Status |
|---|--------|---------|----------|------|----------------|------------|--------|
| 169 | 2044 | 950 | Lipids | G | NO_MATCH | - | ✅ |
| 170 | 1258 | 606 | Fatty acids, total saturated | G | Saturated Fat | Yes | ✅ |
| 171 | 1259 | 607 | SFA 4:0 | G | Butyric Acid | Yes | ✅ |
| 172 | 2003 | 632 | SFA 5:0 | G | NO_MATCH | - | ✅ |
| 173 | 1260 | 608 | SFA 6:0 | G | Caproic Acid | Yes | ✅ |
| 174 | 2004 | 633 | SFA 7:0 | G | NO_MATCH | - | ✅ |

## 7. Saturated Fatty Acids (17 IDs)

| # | FDC ID | FDC Num | FDC Name | Unit | Nutri Compound | Canonical? | Status |
|---|--------|---------|----------|------|----------------|------------|--------|
| 175 | 1261 | 609 | SFA 8:0 | G | Caprylic Acid | Yes | ✅ |
| 176 | 2005 | 634 | SFA 9:0 | G | NO_MATCH | - | ✅ |
| 177 | 1262 | 610 | SFA 10:0 | G | Capric Acid | Yes | ✅ |
| 178 | 1335 | 699 | SFA 11:0 | G | NO_MATCH | - | ✅ |
| 179 | 1263 | 611 | SFA 12:0 | G | Lauric Acid | Yes | ✅ |
| 180 | 1332 | 696 | SFA 13:0 | G | Tridecanoic Acid | Yes | ✅ |
| 181 | 1264 | 612 | SFA 14:0 | G | Myristic Acid | Yes | ✅ |
| 182 | 1299 | 652 | SFA 15:0 | G | Pentadecanoic Acid | Yes | ✅ |
| 183 | 1265 | 613 | SFA 16:0 | G | Palmitic Acid | Yes | ✅ |
| 184 | 1300 | 653 | SFA 17:0 | G | Heptadecanoic Acid | Yes | ✅ |
| 185 | 1266 | 614 | SFA 18:0 | G | Stearic Acid | Yes | ✅ |
| 186 | 1322 | 686 | SFA 19:0 | G | NO_MATCH | - | ✅ |
| 187 | 1267 | 615 | SFA 20:0 | G | Arachidic Acid | Yes | ✅ |
| 188 | 2006 | 681 | SFA 21:0 | G | NO_MATCH | - | ✅ |
| 189 | 1273 | 624 | SFA 22:0 | G | Behenic Acid | Yes | ✅ |
| 190 | 2007 | 682 | SFA 23:0 | G | NO_MATCH | - | ✅ |
| 191 | 1301 | 654 | SFA 24:0 | G | Lignoceric Acid | Yes | ✅ |

## 8. Monounsaturated Fatty Acids (20 IDs)

| # | FDC ID | FDC Num | FDC Name | Unit | Nutri Compound | Canonical? | Status |
|---|--------|---------|----------|------|----------------|------------|--------|
| 192 | 1292 | 645 | Fatty acids, total monounsaturated | G | Monounsaturated Fat | Yes | ✅ |
| 193 | 2008 | 635 | MUFA 12:1 | G | Dodecenoic Acid | Yes | ✅ |
| 194 | 1274 | 625 | MUFA 14:1 | G | Myristoleic Acid | Yes | ✅ |
| 195 | 2009 | 822 | MUFA 14:1 c | G | Myristoleic Acid | No | ✅ |
| 196 | 1333 | 697 | MUFA 15:1 | G | Pentadecenoic Acid | Yes | ✅ |
| 197 | 1275 | 626 | MUFA 16:1 | G | Palmitoleic Acid | Yes | ✅ |
| 198 | 1314 | 673 | MUFA 16:1 c | G | Palmitoleic Acid (cis) | Yes | ✅ |
| 199 | 1323 | 687 | MUFA 17:1 | G | Heptadecenoic Acid | Yes | ✅ |
| 200 | 2010 | 825 | MUFA 17:1 c | G | Heptadecenoic Acid | No | ✅ |
| 201 | 1268 | 617 | MUFA 18:1 | G | Oleic Acid | Yes | ✅ |
| 202 | 1315 | 674 | MUFA 18:1 c | G | Oleic Acid (cis) | Yes | ✅ |
| 203 | 1413 | 860 | MUFA 18:1-11 c (18:1c n-7) | G | NO_MATCH | - | ✅ |
| 204 | 1412 | 859 | MUFA 18:1-11 t (18:1t n-7) | G | NO_MATCH | - | ✅ |
| 205 | 1277 | 628 | MUFA 20:1 | G | Eicosenoic Acid | Yes | ✅ |
| 206 | 2012 | 829 | MUFA 20:1 c | G | Eicosenoic Acid | No | ✅ |
| 207 | 1279 | 630 | MUFA 22:1 | G | Erucic Acid | Yes | ✅ |
| 208 | 1317 | 676 | MUFA 22:1 c | G | Erucic Acid (cis) | Yes | ✅ |
| 209 | 2014 | 676.1 | MUFA 22:1 n-9 | G | Erucic Acid | No | ✅ |
| 210 | 2015 | 676.2 | MUFA 22:1 n-11 | G | NO_MATCH | - | ✅ |
| 211 | 1312 | 671 | MUFA 24:1 c | G | Nervonic Acid | Yes | ✅ |

## 9. Polyunsaturated Fatty Acids (36 IDs)

| # | FDC ID | FDC Num | FDC Name | Unit | Nutri Compound | Canonical? | Status |
|---|--------|---------|----------|------|----------------|------------|--------|
| 212 | 1293 | 646 | Fatty acids, total polyunsaturated | G | Polyunsaturated Fat | Yes | ✅ |
| 213 | 1324 | 688 | PUFA 16:2 | G | NO_MATCH | - | ✅ |
| 214 | 1269 | 618 | PUFA 18:2 | G | Linoleic Acid | Yes | ✅ |
| 215 | 2016 | 831 | PUFA 18:2 c | G | Linoleic Acid (cis,cis) | Yes | ✅ |
| 216 | 1316 | 675 | PUFA 18:2 n-6 c,c | G | Linoleic Acid | No | ✅ |
| 217 | 1311 | 670 | PUFA 18:2 CLAs | G | Conjugated Linoleic Acid | Yes | ✅ |
| 218 | 1307 | 666 | PUFA 18:2 i | G | Linoleic Acid (trans,trans) | Yes | ✅ |
| 219 | 1309 | 668 | PUFA 18:2 c,t | G | NO_MATCH | - | ✅ |
| 220 | 1308 | 667 | PUFA 18:2 t,c | G | NO_MATCH | - | ✅ |
| 221 | 1270 | 619 | PUFA 18:3 | G | Alpha-Linolenic Acid | Yes | ✅ |
| 222 | 2018 | 833 | PUFA 18:3 c | G | Alpha-Linolenic Acid | No | ✅ |
| 223 | 1404 | 851 | PUFA 18:3 n-3 c,c,c (ALA) | G | Alpha-Linolenic Acid | No | ✅ |
| 224 | 1321 | 685 | PUFA 18:3 n-6 c,c,c | G | Gamma-Linolenic Acid | Yes | ✅ |
| 225 | 1409 | 856 | PUFA 18:3i | G | NO_MATCH | - | ✅ |
| 226 | 1276 | 627 | PUFA 18:4 | G | Stearidonic Acid | Yes | ✅ |
| 227 | 2026 | 840 | PUFA 20:2 c | G | Eicosadienoic Acid | Yes | ✅ |
| 228 | 1313 | 672 | PUFA 20:2 n-6 c,c | G | Eicosadienoic Acid | No | ✅ |
| 229 | 1325 | 689 | PUFA 20:3 | G | Eicosatrienoic Acid | Yes | ✅ |
| 230 | 2020 | 835 | PUFA 20:3 c | G | Eicosatrienoic Acid | No | ✅ |
| 231 | 1405 | 852 | PUFA 20:3 n-3 | G | Eicosatrienoic Acid (omega-3) | Yes | ✅ |
| 232 | 1406 | 853 | PUFA 20:4 n-6 | G | Arachidonic Acid | Yes | ✅ |
| 233 | 1414 | 861 | PUFA 20:3 n-9 | G | Dihomo-gamma-linolenic Acid | Yes | ✅ |
| 234 | 2021 | 683 | PUFA 22:3 | G | Docosatrienoic Acid | Yes | ✅ |
| 235 | 1271 | 620 | PUFA 20:4 | G | Arachidonic Acid | No | ✅ |
| 236 | 2022 | 836 | PUFA 20:4c | G | Arachidonic Acid | No | ✅ |
| 237 | 1407 | 854 | PUFA 20:4 n-3 | G | NO_MATCH | - | ✅ |
| 238 | 1408 | 855 | PUFA 2:4 n-6 | G | NO_MATCH | - | ✅ |
| 239 | 2023 | 837 | PUFA 20:5c | G | Eicosapentaenoic Acid | No | ✅ |
| 240 | 1278 | 629 | PUFA 20:5 n-3 (EPA) | G | Eicosapentaenoic Acid | Yes | ✅ |
| 241 | 1334 | 698 | PUFA 22:2 | G | Docosadienoic Acid | Yes | ✅ |
| 242 | 1410 | 857 | PUFA 21:5 | G | Heneicosapentaenoic Acid | Yes | ✅ |
| 243 | 2024 | 838 | PUFA 22:5 c | G | Docosapentaenoic Acid | No | ✅ |
| 244 | 1411 | 858 | PUFA 22:4 | G | Docosatetraenoic Acid | Yes | ✅ |
| 245 | 1280 | 631 | PUFA 22:5 n-3 (DPA) | G | Docosapentaenoic Acid | Yes | ✅ |
| 246 | 2025 | 839 | PUFA 22:6 c | G | Docosahexaenoic Acid | No | ✅ |
| 247 | 1272 | 621 | PUFA 22:6 n-3 (DHA) | G | Docosahexaenoic Acid | Yes | ✅ |

## 10. Trans Fatty Acids (14 IDs)

| # | FDC ID | FDC Num | FDC Name | Unit | Nutri Compound | Canonical? | Status |
|---|--------|---------|----------|------|----------------|------------|--------|
| 248 | 1257 | 605 | Fatty acids, total trans | G | Trans Fat | Yes | ✅ |
| 249 | 1329 | 693 | Fatty acids, total trans-monoenoic | G | Trans Fat (Monoenoic) | Yes | ✅ |
| 250 | 1281 | 821 | TFA 14:1 t | G | NO_MATCH | - | ✅ |
| 251 | 1303 | 662 | TFA 16:1 t | G | Palmitoleic Acid (trans) | Yes | ✅ |
| 252 | 1304 | 663 | TFA 18:1 t | G | Elaidic Acid | Yes | ✅ |
| 253 | 2011 | 826 | TFA 17:1 t | G | NO_MATCH | - | ✅ |
| 254 | 2013 | 830 | TFA 20:1 t | G | NO_MATCH | - | ✅ |
| 255 | 1305 | 664 | TFA 22:1 t | G | Erucic Acid (trans) | Yes | ✅ |
| 256 | 1330 | 694 | Fatty acids, total trans-dienoic | G | NO_MATCH | - | ✅ |
| 257 | 1306 | 665 | TFA 18:2 t not further defined | G | Linoleic Acid (trans,trans) | Yes | ✅ |
| 258 | 2017 | 832 | TFA 18:2 t | G | Linoleic Acid (trans,trans) | No | ✅ |
| 259 | 1310 | 669 | TFA 18:2 t,t | G | Linoleic Acid (trans,trans) | No | ✅ |
| 260 | 1331 | 695 | Fatty acids, total trans-polyenoic | G | Trans Fat (Polyenoic) | Yes | ✅ |
| 261 | 2019 | 834 | TFA 18:3 t | G | NO_MATCH | - | ✅ |

## 11. Sterols & Phytosterols (18 IDs)

| # | FDC ID | FDC Num | FDC Name | Unit | Nutri Compound | Canonical? | Status |
|---|--------|---------|----------|------|----------------|------------|--------|
| 262 | 1253 | 601 | Cholesterol | MG | Cholesterol | Yes | ✅ |
| 263 | 1283 | 636 | Phytosterols | MG | Total Plant Sterols | Yes | ✅ |
| 264 | 2053 |  | Stigmastadiene | MG | NO_MATCH | - | ✅ |
| 265 | 1285 | 638 | Stigmasterol | MG | Stigmasterol | Yes | ✅ |
| 266 | 1286 | 639 | Campesterol | MG | Campesterol | Yes | ✅ |
| 267 | 1287 | 640 | Brassicasterol | MG | NO_MATCH | - | ✅ |
| 268 | 1288 | 641 | Beta-sitosterol | MG | Beta-Sitosterol | Yes | ✅ |
| 269 | 2060 |  | Ergosta-7-enol | MG | NO_MATCH | - | ✅ |
| 270 | 2061 |  |  Ergosta-7,22-dienol | MG | NO_MATCH | - | ✅ |
| 271 | 2062 |  |  Ergosta-5,7-dienol | MG | NO_MATCH | - | ✅ |
| 272 | 1284 | 637 | Ergosterol | MG | NO_MATCH | - | ✅ |
| 273 | 1289 | 642 | Campestanol | MG | NO_MATCH | - | ✅ |
| 274 | 1294 | 647 | Beta-sitostanol | MG | NO_MATCH | - | ✅ |
| 275 | 1295 | 648 | Delta-7-avenasterol | MG | NO_MATCH | - | ✅ |
| 276 | 1296 | 649 | Delta-5-avenasterol | MG | NO_MATCH | - | ✅ |
| 277 | 1297 | 650 | Alpha-spinasterol | MG | NO_MATCH | - | ✅ |
| 278 | 2052 |  | Delta-7-Stigmastenol | MG | NO_MATCH | - | ✅ |
| 279 | 1298 | 651 | Phytosterols, other | MG | NO_MATCH | - | ✅ |

## 12. Amino Acids (26 IDs)

| # | FDC ID | FDC Num | FDC Name | Unit | Nutri Compound | Canonical? | Status |
|---|--------|---------|----------|------|----------------|------------|--------|
| 280 | 2042 | 500 | Amino acids | G | NO_MATCH | - | ✅ |
| 281 | 2057 |  | Ergothioneine | MG | Ergothioneine | Yes | ✅ |
| 282 | 1210 | 501 | Tryptophan | G | Tryptophan | Yes | ✅ |
| 283 | 1211 | 502 | Threonine | G | Threonine | Yes | ✅ |
| 284 | 1212 | 503 | Isoleucine | G | Isoleucine | Yes | ✅ |
| 285 | 1213 | 504 | Leucine | G | Leucine | Yes | ✅ |
| 286 | 1214 | 505 | Lysine | G | Lysine | Yes | ✅ |
| 287 | 1215 | 506 | Methionine | G | Methionine | Yes | ✅ |
| 288 | 1216 | 507 | Cystine | G | NO_MATCH | - | ✅ |
| 289 | 1230 | 523 | Phenylalanine and tyrosine (aromatic  AA) | G | NO_MATCH | - | ✅ |
| 290 | 1217 | 508 | Phenylalanine | G | Phenylalanine | Yes | ✅ |
| 291 | 1218 | 509 | Tyrosine | G | Tyrosine | Yes | ✅ |
| 292 | 1219 | 510 | Valine | G | Valine | Yes | ✅ |
| 293 | 1220 | 511 | Arginine | G | Arginine | Yes | ✅ |
| 294 | 1221 | 512 | Histidine | G | Histidine | Yes | ✅ |
| 295 | 1222 | 513 | Alanine | G | Alanine | Yes | ✅ |
| 296 | 1223 | 514 | Aspartic acid | G | Aspartic Acid | Yes | ✅ |
| 297 | 1224 | 515 | Glutamic acid | G | Glutamic Acid | Yes | ✅ |
| 298 | 1225 | 516 | Glycine | G | Glycine | Yes | ✅ |
| 299 | 1226 | 517 | Proline | G | Proline | Yes | ✅ |
| 300 | 1227 | 518 | Serine | G | Serine | Yes | ✅ |
| 301 | 1228 | 521 | Hydroxyproline | G | Hydroxyproline | Yes | ✅ |
| 302 | 1232 | 526 | Cysteine | G | Cysteine | Yes | ✅ |
| 303 | 1018 | 221 | Alcohol, ethyl | G | Alcohol | Yes | ✅ |
| 304 | 1057 | 262 | Caffeine | MG | Caffeine | Yes | ✅ |
| 305 | 1058 | 263 | Theobromine | MG | Theobromine | Yes | ✅ |

## 13. Other Compounds (52 IDs)

| # | FDC ID | FDC Num | FDC Name | Unit | Nutri Compound | Canonical? | Status |
|---|--------|---------|----------|------|----------------|------------|--------|
| 306 | 1343 | 713 | Isoflavones | MG | NO_MATCH | - | ✅ |
| 307 | 1340 | 710 | Daidzein | MG | Daidzein | Yes | ✅ |
| 308 | 1341 | 711 | Genistein | MG | Genistein | Yes | ✅ |
| 309 | 1342 | 712 | Glycitein | MG | NO_MATCH | - | ✅ |
| 310 | 2049 | 717 | Daidzin | MG | NO_MATCH | - | ✅ |
| 311 | 2050 | 718 | Genistin | MG | NO_MATCH | - | ✅ |
| 312 | 2051 | 719 | Glycitin | MG | NO_MATCH | - | ✅ |
| 313 | 1348 | 730 | Anthocyanidins | MG | NO_MATCH | - | ✅ |
| 314 | 1349 | 731 | Cyanidin | MG | Cyanidin | Yes | ✅ |
| 315 | 1350 | 732 | Proanthocyanidin (dimer-A linkage) | MG | NO_MATCH | - | ✅ |
| 316 | 1351 | 733 | Proanthocyanidin monomers | MG | NO_MATCH | - | ✅ |
| 317 | 1352 | 734 | Proanthocyanidin dimers | MG | NO_MATCH | - | ✅ |
| 318 | 1353 | 735 | Proanthocyanidin trimers | MG | NO_MATCH | - | ✅ |
| 319 | 1354 | 736 | Proanthocyanidin 4-6mers | MG | NO_MATCH | - | ✅ |
| 320 | 1355 | 737 | Proanthocyanidin 7-10mers | MG | NO_MATCH | - | ✅ |
| 321 | 1356 | 738 | Proanthocyanidin polymers (>10mers) | MG | NO_MATCH | - | ✅ |
| 322 | 1357 | 741 | Delphinidin | MG | Delphinidin | Yes | ✅ |
| 323 | 1358 | 742 | Malvidin | MG | NO_MATCH | - | ✅ |
| 324 | 1359 | 743 | Pelargonidin | MG | Pelargonidin | Yes | ✅ |
| 325 | 1360 | 745 | Peonidin | MG | NO_MATCH | - | ✅ |
| 326 | 1361 | 746 | Petunidin | MG | NO_MATCH | - | ✅ |
| 327 | 1362 | 747 | Flavans, total | MG | NO_MATCH | - | ✅ |
| 328 | 1363 | 748 | Catechins, total | MG | NO_MATCH | - | ✅ |
| 329 | 1364 | 749 | Catechin | MG | Catechin | Yes | ✅ |
| 330 | 1365 | 750 | Epigallocatechin | MG | NO_MATCH | - | ✅ |
| 331 | 1366 | 751 | Epicatechin | MG | Epicatechin | Yes | ✅ |
| 332 | 1367 | 752 | Epicatechin-3-gallate | MG | NO_MATCH | - | ✅ |
| 333 | 1368 | 753 | Epigallocatechin-3-gallate | MG | Epigallocatechin Gallate | Yes | ✅ |
| 334 | 1369 | 754 | Procyanidins, total | MG | NO_MATCH | - | ✅ |
| 335 | 1370 | 755 | Theaflavins | MG | NO_MATCH | - | ✅ |
| 336 | 1371 | 756 | Thearubigins | MG | NO_MATCH | - | ✅ |
| 337 | 1392 | 790 | Theogallin | MG | NO_MATCH | - | ✅ |
| 338 | 1372 | 757 | Flavanones, total | MG | NO_MATCH | - | ✅ |
| 339 | 1373 | 758 | Eriodictyol | MG | NO_MATCH | - | ✅ |
| 340 | 1374 | 759 | Hesperetin | MG | NO_MATCH | - | ✅ |
| 341 | 1375 | 760 | Isosakuranetin | MG | NO_MATCH | - | ✅ |
| 342 | 1376 | 761 | Liquiritigenin | MG | NO_MATCH | - | ✅ |
| 343 | 1377 | 762 | Naringenin | MG | Naringenin | Yes | ✅ |
| 344 | 1378 | 768 | Flavones, total | MG | NO_MATCH | - | ✅ |
| 345 | 1379 | 770 | Apigenin | MG | Apigenin | Yes | ✅ |
| 346 | 1380 | 771 | Chrysoeriol | MG | NO_MATCH | - | ✅ |
| 347 | 1381 | 772 | Diosmetin | MG | NO_MATCH | - | ✅ |
| 348 | 1382 | 773 | Luteolin | MG | Luteolin | Yes | ✅ |
| 349 | 1383 | 781 | Nobiletin | MG | NO_MATCH | - | ✅ |
| 350 | 1384 | 782 | Sinensetin | MG | NO_MATCH | - | ✅ |
| 351 | 1385 | 783 | Tangeretin | MG | NO_MATCH | - | ✅ |
| 352 | 1386 | 784 | Flavonols, total | MG | NO_MATCH | - | ✅ |
| 353 | 1387 | 785 | Isorhamnetin | MG | NO_MATCH | - | ✅ |
| 354 | 1388 | 786 | Kaempferol | MG | Kaempferol | Yes | ✅ |
| 355 | 1389 | 787 | Limocitrin | MG | NO_MATCH | - | ✅ |
| 356 | 1390 | 788 | Myricetin | MG | Myricetin | Yes | ✅ |
| 357 | 1391 | 789 | Quercetin | MG | Quercetin | Yes | ✅ |

---

## Summary

| Category | Count | Mapped |
|----------|-------|--------|
| Proximates & Energy | 16 | 16 |
| Carbohydrates & Fiber | 32 | 32 |
| Organic Acids | 22 | 22 |
| Minerals | 22 | 22 |
| Vitamins | 76 | 76 |
| Lipids - Totals | 6 | 6 |
| Saturated Fatty Acids | 17 | 17 |
| Monounsaturated Fatty Acids | 20 | 20 |
| Polyunsaturated Fatty Acids | 36 | 36 |
| Trans Fatty Acids | 14 | 14 |
| Sterols & Phytosterols | 18 | 18 |
| Amino Acids | 26 | 26 |
| Other Compounds | 52 | 52 |
| **TOTAL** | **357** | **357** |

## Notes

- FDC has 357 active nutrients vs CNF's 152
- FDC Num often matches CNF ID (e.g., 203 = Protein in both)
- Many nutrients already mapped via CNF can be reused
- FDC has more detailed polyphenol/flavonoid data
