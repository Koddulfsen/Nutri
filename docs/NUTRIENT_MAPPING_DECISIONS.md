# Nutrient Mapping Decisions

This document defines the canonical nutrient ID to use from each source (CNF, FDC) for each compound in the Nutri database.

**Rule: ONE nutrient ID per source per compound. No duplicates.**

---

## MACRONUTRIENTS

| Compound | CNF ID | FDC ID | Notes |
|----------|--------|--------|-------|
| Energy | **208** (kcal) | **1008** (kcal) | Skip kJ versions (268, 1062) |
| Protein | 203 | 1003 | Clean |
| Carbohydrate | 205 | 1005 | Skip FDC 2039 (duplicate) |
| Total Fat | 204 | 1004 | Clean |
| Water | 255 | 1051 | Clean |
| Ash | 207 | 1007 | Clean |

---

## FIBER & SUGARS

| Compound | CNF ID | FDC ID | Notes |
|----------|--------|--------|-------|
| Total Fiber | 291 | 1079 | Clean |
| Total Sugars | **269** | **2000** | Skip CNF 802, 803 (mono/di saccharides) |
| Sucrose | 210 | 1010 | Clean |
| Glucose | 211 | 1011 | Clean |
| Fructose | 212 | 1012 | Clean |
| Lactose | 213 | 1013 | Clean |
| Maltose | 214 | 1014 | Clean |
| Galactose | 287 | 1075 | Clean |
| Starch | 810 | 1009 | Clean |

---

## FAT TYPES

| Compound | CNF ID | FDC ID | Notes |
|----------|--------|--------|-------|
| Saturated Fat | 606 | 1258 | Clean |
| Monounsaturated Fat | 645 | 1292 | Clean |
| Polyunsaturated Fat | 646 | 1293 | Clean |
| Trans Fat | **605** | **1257** | Skip CNF 829, 859 (mono/polyenoic subtypes) |
| Omega-3 Total | 868 | - | FDC doesn't have total, only individual |
| Omega-6 Total | 869 | - | FDC doesn't have total, only individual |
| Cholesterol | 601 | 1253 | Clean |

---

## MINERALS

| Compound | CNF ID | FDC ID | Notes |
|----------|--------|--------|-------|
| Calcium | 301 | 1087 | Clean |
| Iron | 303 | 1089 | Clean |
| Magnesium | 304 | 1090 | Clean |
| Phosphorus | 305 | 1091 | Clean |
| Potassium | 306 | 1092 | Clean |
| Sodium | 307 | 1093 | Clean |
| Zinc | 309 | 1095 | Clean |
| Copper | 312 | 1098 | Clean |
| Manganese | 315 | 1101 | Clean |
| Selenium | 317 | 1103 | Clean |
| Fluoride | - | 1099 | FDC only |

---

## VITAMIN A & CAROTENOIDS

| Compound | CNF ID | FDC ID | Notes |
|----------|--------|--------|-------|
| Vitamin A (RAE) | **814** | **1106** | Skip FDC 1104 (IU) - different unit! |
| Retinol | 319 | 1105 | Separate compound |
| Beta-Carotene | 321 | 1107 | Separate compound |
| Alpha-Carotene | 834 | 1108 | Separate compound |
| Beta-Cryptoxanthin | 835 | 1120 | Separate compound |
| Lycopene | 836 | 1122 | Separate compound |
| Lutein + Zeaxanthin | 837 | 1123 | Separate compound |

---

## VITAMIN D

| Compound | CNF ID | FDC ID | Notes |
|----------|--------|--------|-------|
| Vitamin D | **339** (µg) | **1114** (µg) | Skip IU versions (324, 1110) |
| Vitamin D2 | 876 | - | CNF only, separate compound |

---

## VITAMIN E & TOCOPHEROLS

| Compound | CNF ID | FDC ID | Notes |
|----------|--------|--------|-------|
| Vitamin E (Alpha-Tocopherol) | **323** | **1109** | Skip "added" versions (875, 1242) |
| Tocopherol Beta | 811 | 1125 | Separate compound |
| Tocopherol Gamma | 812 | 1126 | Separate compound |
| Tocopherol Delta | 813 | 1127 | Separate compound |
| Tocotrienol Alpha | - | 1128 | FDC only |
| Tocotrienol Beta | - | 1129 | FDC only |
| Tocotrienol Gamma | - | 1130 | FDC only |
| Tocotrienol Delta | - | 1131 | FDC only |

---

## VITAMIN K

| Compound | CNF ID | FDC ID | Notes |
|----------|--------|--------|-------|
| Vitamin K (Phylloquinone) | 430 | **1185** | Skip FDC 1184 (dihydro form) |

---

## VITAMIN C

| Compound | CNF ID | FDC ID | Notes |
|----------|--------|--------|-------|
| Vitamin C | 401 | 1162 | Clean |

---

## B VITAMINS

| Compound | CNF ID | FDC ID | Notes |
|----------|--------|--------|-------|
| Thiamin (B1) | 404 | 1165 | Clean |
| Riboflavin (B2) | 405 | 1166 | Clean |
| Niacin (B3) | **406** (mg) | **1167** | Skip CNF 409 (NE - different unit) |
| Pantothenic Acid (B5) | 410 | 1170 | Clean |
| Vitamin B6 | 415 | 1175 | Clean |
| Biotin (B7) | 416 | - | CNF only |
| Folate | **815** (DFE) | **1190** (DFE) | Use DFE as standard. Skip other forms. |
| Folic Acid (synthetic) | 431 | 1186 | Separate compound (for fortified foods) |
| Vitamin B12 | **418** | **1178** | Skip "added" versions (874, 1246) |

### Folate Decision Explanation
- CNF has: 417 (total), 431 (synthetic), 806 (natural), 815 (DFE)
- FDC has: 1177 (total), 1186 (synthetic), 1187 (food), 1190 (DFE)
- **Use DFE (Dietary Folate Equivalents)** as it's the nutrition label standard
- Keep Folic Acid as separate compound for tracking fortification

---

## CHOLINE & BETAINE

| Compound | CNF ID | FDC ID | Notes |
|----------|--------|--------|-------|
| Choline | 862 | **1180** | **BUG FIX**: FDC 1180 is Choline, not Folic Acid! |
| Betaine | 863 | 1198 | Clean |

---

## AMINO ACIDS

| Compound | CNF ID | FDC ID | Notes |
|----------|--------|--------|-------|
| Tryptophan | 501 | 1210 | Clean |
| Threonine | 502 | 1211 | Clean |
| Isoleucine | 503 | 1212 | Clean |
| Leucine | 504 | 1213 | Clean |
| Lysine | 505 | 1214 | Clean |
| Methionine | 506 | 1215 | Clean |
| Cystine | 507 | 1216 | Clean |
| Phenylalanine | 508 | 1217 | Clean |
| Tyrosine | 509 | 1218 | Clean |
| Valine | 510 | 1219 | Clean |
| Arginine | 511 | 1220 | Clean |
| Histidine | 512 | 1221 | Clean |
| Alanine | 513 | 1222 | Clean |
| Aspartic Acid | 514 | 1223 | Clean |
| Glutamic Acid | 515 | 1224 | Clean |
| Glycine | 516 | 1225 | Clean |
| Proline | 517 | 1226 | Clean |
| Serine | 518 | 1227 | Clean |
| Hydroxyproline | 828 | - | CNF only |

---

## OTHER COMPOUNDS

| Compound | CNF ID | FDC ID | Notes |
|----------|--------|--------|-------|
| Alcohol | 221 | 1018 | Clean |
| Caffeine | 262 | 1057 | Clean |
| Theobromine | 263 | 1058 | Clean |
| Phytosterols (Total) | 636 | 1283 | Use totals only |
| Beta-Sitosterol | 816 | - | Separate compound, CNF only |
| Campesterol | 866 | - | Separate compound, CNF only |
| Stigmasterol | 638 | - | Separate compound, CNF only |
| Oxalic Acid | 245 | - | CNF only |
| Aspartame | 550 | - | CNF only |
| Mannitol | 260 | - | CNF only |
| Sorbitol | 261 | - | CNF only |

---

## INDIVIDUAL FATTY ACIDS

These are separate compounds, each with 1:1 mapping:

| Compound | CNF ID | FDC ID | Carbon Chain |
|----------|--------|--------|--------------|
| Butyric Acid | 607 | 1259 | 4:0 |
| Caproic Acid | 608 | 1260 | 6:0 |
| Caprylic Acid | 609 | 1261 | 8:0 |
| Capric Acid | 610 | 1262 | 10:0 |
| Lauric Acid | 611 | 1263 | 12:0 |
| Myristic Acid | 612 | 1264 | 14:0 |
| Pentadecanoic Acid | 652 | - | 15:0 |
| Palmitic Acid | 613 | 1265 | 16:0 |
| Heptadecanoic Acid | 653 | - | 17:0 |
| Stearic Acid | 614 | 1266 | 18:0 |
| Arachidic Acid | 615 | - | 20:0 |
| Behenic Acid | 624 | - | 22:0 |
| Lignoceric Acid | 654 | - | 24:0 |
| Myristoleic Acid | 625 | - | 14:1 |
| Palmitoleic Acid | 626 | 1275 | 16:1 |
| Oleic Acid | 617 | 1268 | 18:1 |
| Eicosenoic Acid | 628 | 1277 | 20:1 |
| Erucic Acid | 630 | 1279 | 22:1 |
| Nervonic Acid | 846 | - | 24:1 |
| Linoleic Acid | 618 | 1269 | 18:2 |
| Alpha-Linolenic Acid | 619 | 1270 | 18:3 |
| Stearidonic Acid | 627 | 1276 | 18:4 |
| Arachidonic Acid | 620 | 1271 | 20:4 |
| EPA | 629 | 1278 | 20:5 n-3 |
| DPA | 631 | 1280 | 22:5 n-3 |
| DHA | 621 | 1272 | 22:6 n-3 |

---

## SUMMARY OF FIXES NEEDED

### Critical Bug Fixes
1. **FDC 1180**: Currently mapped to "Folic Acid" but is actually "Choline"

### Remove Duplicate Mappings (CNF)
- 268 (Energy kJ) - keep only 208
- 802, 803 (mono/disaccharides) - keep only 269
- 829, 859 (trans fat subtypes) - keep only 605
- 409 (Niacin NE) - keep only 406
- 417, 806, 431 (Folate variants) - keep only 815 (DFE)
- 874 (B12 added) - keep only 418

### Remove Duplicate Mappings (FDC)
- 1062 (Energy kJ) - keep only 1008
- 2039 (Carbohydrate) - keep only 1005
- 1104 (Vitamin A IU) - keep only 1106 (RAE)
- 1110 (Vitamin D IU) - keep only 1114
- 1242 (Vitamin E added) - keep only 1109
- 1184 (Vitamin K dihydro) - keep only 1185
- 1177, 1186, 1187 (Folate variants) - keep only 1190 (DFE)
- 1246 (B12 added) - keep only 1178

---

*Generated: 2026-01-10*
