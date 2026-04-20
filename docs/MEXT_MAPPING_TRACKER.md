# MEXT 8th Edition (Japan) Mapping Tracker

**Source**: Ministry of Education, Culture, Sports, Science and Technology (MEXT)
**Version**: 8th Edition (2020)
**Foods**: 2,478 items
**Components**: 131 unique parameters across 3 tables
**License**: Public domain (Japanese government)
**Format**: Excel
**URL**: https://www.mext.go.jp/a_menu/syokuhinseibun/mext_01110.html
**Attribution**: "Standard Tables of Food Composition in Japan - 2020 (Eighth Revised Edition), MEXT"

---

## Data Structure

MEXT provides food composition data across three separate Excel files:

### Files
- `main_composition.xlsx` - General nutrients (52 components)
- `amino_acids_1.xlsx` - Amino acid profiles (24 components)
- `fatty_acids_1.xlsx` - Fatty acid breakdown (55 components)

### Code Format
MEXT uses INFOODS-style codes with slight variations:
- Fatty acids: `F18D2N6` (vs EuroFIR `F18:2CN6`)
- Vitamins: Standard codes (TOCPHA, THIA, RIBF, etc.)
- Minerals: Element symbols (NA, K, CA, etc.)

---

## Mapping Progress

**Status**: 122/131 mapped ✅ COMPLETE

**New compounds added**: 4
- Heptanoic Acid (F7D0)
- Anteiso-Pentadecanoic Acid (F15D0AI)
- Iso-Palmitic Acid (F16D0I)
- Anteiso-Margaric Acid (F17D0AI)

**Skipped**: 9 (factors, sums, duplicates: REFUSE, OA, AAS, AAA, AAT, AMMON-E, F18D1, FAUN, AMMON)

---

## Main Composition Table (52 codes)

### Food Properties (Skip)

| Code | Name (JP) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| REFUSE | 廃棄率 | Refuse percentage | % | *SKIP* | - |

### Energy

| Code | Name (JP) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| ENERC | エネルギー | Energy | kJ | Energy | No |
| ENERC_KCAL | エネルギー | Energy | kcal | Energy | Yes |

### Macronutrients

| Code | Name (JP) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| WATER | 水分 | Water | g | Water | Yes |
| PROTCAA | たんぱく質 | Protein (from AA) | g | Protein | No |
| PROT- | たんぱく質 | Protein | g | Protein | Yes |
| FATNLEA | 脂質 | Fat (Soxhlet) | g | Total Fat | No |
| FAT- | 脂質 | Fat | g | Total Fat | Yes |
| CHOLE | コレステロール | Cholesterol | mg | Cholesterol | Yes |
| CHOAVLM | 炭水化物 | Available carbs (mono eq) | g | Total Carbohydrate | No |
| CHOAVL | 炭水化物 | Available carbohydrates | g | Total Carbohydrate | No |
| CHOAVLDF- | 炭水化物 | Carbs (by difference) | g | Total Carbohydrate | Yes |
| FIB- | 食物繊維総量 | Total dietary fiber | g | Total Fiber | Yes |
| POLYL | 糖アルコール | Polyols | g | Sugar Alcohols | Yes |
| CHOCDF- | 炭水化物 | Carbohydrates | g | Total Carbohydrate | No |
| OA | 有機酸 | Organic acids | g | *SKIP* | - |
| ASH | 灰分 | Ash | g | Ash | Yes |
| ALC | アルコール | Alcohol | g | Alcohol | Yes |
| NACL_EQ | 食塩相当量 | Salt equivalent | g | Salt | Yes |

### Minerals

| Code | Name (JP) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| NA | ナトリウム | Sodium | mg | Sodium | Yes |
| CA | カルシウム | Calcium | mg | Calcium | Yes |
| MG | マグネシウム | Magnesium | mg | Magnesium | Yes |
| FE | 鉄 | Iron | mg | Iron | Yes |
| ZN | 亜鉛 | Zinc | mg | Zinc | Yes |
| CU | 銅 | Copper | mg | Copper | Yes |
| MN | マンガン | Manganese | mg | Manganese | Yes |
| ID | ヨウ素 | Iodine | µg | Iodine | Yes |
| SE | セレン | Selenium | µg | Selenium | Yes |
| CR | クロム | Chromium | µg | Chromium | Yes |
| MO | モリブデン | Molybdenum | µg | Molybdenum | Yes |

**Note**: Potassium (K) and Phosphorus (P) not in extracted list - may use different codes or be in separate columns.

### Vitamins - Retinoids & Carotenoids

| Code | Name (JP) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| RETOL | レチノール | Retinol | µg | Retinol | Yes |
| CARTA | α-カロテン | alpha-Carotene | µg | Alpha-Carotene | Yes |
| CARTB | β-カロテン | beta-Carotene | µg | Beta-Carotene | Yes |
| CRYPXB | β-クリプトキサンチン | beta-Cryptoxanthin | µg | Beta-Cryptoxanthin | Yes |
| CARTBEQ | β-カロテン当量 | beta-Carotene equivalents | µg | Beta-Carotene Equivalents | Yes |
| VITA_RAE | ビタミンA | Vitamin A RAE | µg | Vitamin A | Yes |

### Vitamins - D, E, K

| Code | Name (JP) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| VITD | ビタミンD | Vitamin D | µg | Vitamin D | Yes |
| TOCPHA | α-トコフェロール | alpha-Tocopherol | mg | Alpha-Tocopherol | Yes |
| TOCPHB | β-トコフェロール | beta-Tocopherol | mg | Beta-Tocopherol | Yes |
| TOCPHG | γ-トコフェロール | gamma-Tocopherol | mg | Gamma-Tocopherol | Yes |
| TOCPHD | δ-トコフェロール | delta-Tocopherol | mg | Delta-Tocopherol | Yes |
| VITK | ビタミンK | Vitamin K | µg | Vitamin K | Yes |

### Vitamins - B Complex

| Code | Name (JP) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| THIA | ビタミンB1 | Thiamin | mg | Thiamin | Yes |
| RIBF | ビタミンB2 | Riboflavin | mg | Riboflavin | Yes |
| NIA | ナイアシン | Niacin | mg | Niacin | Yes |
| NE | ナイアシン当量 | Niacin equivalents | mg | Niacin Equivalents | Yes |
| VITB6A | ビタミンB6 | Vitamin B6 | mg | Vitamin B6 | Yes |
| VITB12 | ビタミンB12 | Vitamin B12 | µg | Vitamin B12 | Yes |
| FOL | 葉酸 | Folate | µg | Folate | Yes |
| PANTAC | パントテン酸 | Pantothenic acid | mg | Pantothenic Acid | Yes |
| BIOT | ビオチン | Biotin | µg | Biotin | Yes |

### Vitamins - C

| Code | Name (JP) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| VITC | ビタミンC | Vitamin C | mg | Vitamin C | Yes |

---

## Amino Acid Table (24 codes)

### Essential Amino Acids

| Code | Name (JP) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| ILE | イソロイシン | Isoleucine | mg | Isoleucine | Yes |
| LEU | ロイシン | Leucine | mg | Leucine | Yes |
| LYS | リシン | Lysine | mg | Lysine | Yes |
| MET | メチオニン | Methionine | mg | Methionine | Yes |
| PHE | フェニルアラニン | Phenylalanine | mg | Phenylalanine | Yes |
| THR | トレオニン | Threonine | mg | Threonine | Yes |
| TRP | トリプトファン | Tryptophan | mg | Tryptophan | Yes |
| VAL | バリン | Valine | mg | Valine | Yes |
| HIS | ヒスチジン | Histidine | mg | Histidine | Yes |

### Conditionally Essential / Non-Essential

| Code | Name (JP) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| CYS | シスチン | Cystine | mg | Cystine | Yes |
| TYR | チロシン | Tyrosine | mg | Tyrosine | Yes |
| ARG | アルギニン | Arginine | mg | Arginine | Yes |
| ALA | アラニン | Alanine | mg | Alanine | Yes |
| ASP | アスパラギン酸 | Aspartic acid | mg | Aspartic Acid | Yes |
| GLU | グルタミン酸 | Glutamic acid | mg | Glutamic Acid | Yes |
| GLY | グリシン | Glycine | mg | Glycine | Yes |
| PRO | プロリン | Proline | mg | Proline | Yes |
| SER | セリン | Serine | mg | Serine | Yes |
| HYP | ヒドロキシプロリン | Hydroxyproline | mg | Hydroxyproline | Yes |

### Sums & Other (Skip)

| Code | Name (JP) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| AAS | 含硫アミノ酸 | Sulfur amino acids sum | mg | *SKIP* | - |
| AAA | 芳香族アミノ酸 | Aromatic amino acids sum | mg | *SKIP* | - |
| AAT | アミノ酸組成計 | Total amino acids | mg | *SKIP* | - |
| AMMON | アンモニア | Ammonia | mg | Ammonia | Yes |
| AMMON-E | 剰余アンモニア | Excess ammonia | mg | *SKIP* | - |

---

## Fatty Acid Table (55 codes)

### Fatty Acid Sums

| Code | Name (JP) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| FACID | 脂肪酸総量 | Total fatty acids | g | Total Fatty Acids | Yes |
| FASAT | 飽和脂肪酸 | Saturated fatty acids | g | Saturated Fat | Yes |
| FAMS | 一価不飽和脂肪酸 | Monounsaturated fatty acids | g | Monounsaturated Fat | Yes |
| FAPU | 多価不飽和脂肪酸 | Polyunsaturated fatty acids | g | Polyunsaturated Fat | Yes |
| FAPUN3 | n-3系多価不飽和脂肪酸 | n-3 PUFA | g | Omega-3 Fatty Acids | Yes |
| FAPUN6 | n-6系多価不飽和脂肪酸 | n-6 PUFA | g | Omega-6 Fatty Acids | Yes |
| FAUN | 未同定物質 | Unidentified | g | *SKIP* | - |

### Saturated Fatty Acids

| Code | Name (JP) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| F4D0 | 酪酸 | Butyric acid (4:0) | g | Butyric Acid | Yes |
| F6D0 | ヘキサン酸 | Caproic acid (6:0) | g | Caproic Acid | Yes |
| F7D0 | ヘプタン酸 | Heptanoic acid (7:0) | g | Heptanoic Acid | Yes | **NEW**
| F8D0 | オクタン酸 | Caprylic acid (8:0) | g | Caprylic Acid | Yes |
| F10D0 | デカン酸 | Capric acid (10:0) | g | Capric Acid | Yes |
| F12D0 | ラウリン酸 | Lauric acid (12:0) | g | Lauric Acid | Yes |
| F13D0 | トリデカン酸 | Tridecanoic acid (13:0) | g | Tridecanoic Acid | Yes |
| F14D0 | ミリスチン酸 | Myristic acid (14:0) | g | Myristic Acid | Yes |
| F15D0 | ペンタデカン酸 | Pentadecanoic acid (15:0) | g | Pentadecanoic Acid | Yes |
| F15D0AI | ペンタデカン酸ant | Anteiso-pentadecanoic acid (ai15:0) | g | Anteiso-Pentadecanoic Acid | Yes | **NEW**
| F16D0 | パルミチン酸 | Palmitic acid (16:0) | g | Palmitic Acid | Yes |
| F16D0I | パルミチン酸iso | Iso-palmitic acid (i16:0) | g | Iso-Palmitic Acid | Yes | **NEW**
| F17D0 | ヘプタデカン酸 | Margaric acid (17:0) | g | Margaric Acid | Yes |
| F17D0AI | ヘプタデカン酸ant | Anteiso-margaric acid (ai17:0) | g | Anteiso-Margaric Acid | Yes | **NEW**
| F18D0 | ステアリン酸 | Stearic acid (18:0) | g | Stearic Acid | Yes |
| F20D0 | アラキジン酸 | Arachidic acid (20:0) | g | Arachidic Acid | Yes |
| F22D0 | ベヘン酸 | Behenic acid (22:0) | g | Behenic Acid | Yes |
| F24D0 | リグノセリン酸 | Lignoceric acid (24:0) | g | Lignoceric Acid | Yes |

### Monounsaturated Fatty Acids

| Code | Name (JP) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| F10D1 | デセン酸 | Decenoic acid (10:1) | g | Decenoic Acid | Yes | **NEW**
| F14D1 | ミリストレイン酸 | Myristoleic acid (14:1) | g | Myristoleic Acid | Yes |
| F15D1 | ペンタデセン酸 | Pentadecenoic acid (15:1) | g | Pentadecenoic Acid | Yes |
| F16D1 | パルミトレイン酸 | Palmitoleic acid (16:1) | g | Palmitoleic Acid | Yes |
| F17D1 | ヘプタデセン酸 | Heptadecenoic acid (17:1) | g | Heptadecenoic Acid | Yes |
| F18D1 | 18:1計 | Total C18:1 | g | *SKIP* | - |
| F18D1CN9 | オレイン酸 | Oleic acid (18:1 n-9) | g | Oleic Acid | Yes |
| F18D1CN7 | シス-バクセン酸 | cis-Vaccenic acid (18:1 n-7) | g | Vaccenic Acid (cis) | Yes |
| F20D1 | イコセン酸 | Eicosenoic acid (20:1) | g | Eicosenoic Acid | Yes |
| F22D1 | ドコセン酸 | Docosenoic acid (22:1) | g | Erucic Acid | Yes |
| F24D1 | テトラコセン酸 | Tetracosenoic acid (24:1) | g | Nervonic Acid | Yes |

### Polyunsaturated Fatty Acids - C16

| Code | Name (JP) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| F16D2 | ヘキサデカジエン酸 | Hexadecadienoic acid (16:2) | g | Hexadecadienoic Acid | Yes | **NEW**
| F16D3 | ヘキサデカトリエン酸 | Hexadecatrienoic acid (16:3) | g | Hexadecatrienoic Acid | Yes | **NEW**
| F16D4 | ヘキサデカテトラエン酸 | Hexadecatetraenoic acid (16:4) | g | Hexadecatetraenoic Acid | Yes | **NEW**

### Polyunsaturated Fatty Acids - Omega-6

| Code | Name (JP) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| F18D2N6 | リノール酸 | Linoleic acid (18:2 n-6) | g | Linoleic Acid | Yes |
| F18D3N6 | γ-リノレン酸 | Gamma-linolenic acid (18:3 n-6) | g | Gamma-Linolenic Acid | Yes |
| F20D2N6 | イコサジエン酸 | Eicosadienoic acid (20:2 n-6) | g | Eicosadienoic Acid | Yes |
| F20D3N6 | イコサトリエン酸 | Dihomo-gamma-linolenic acid (20:3 n-6) | g | Dihomo-gamma-linolenic Acid | Yes |
| F20D4N6 | アラキドン酸 | Arachidonic acid (20:4 n-6) | g | Arachidonic Acid | Yes |
| F22D2 | ドコサジエン酸 | Docosadienoic acid (22:2) | g | Docosadienoic Acid | Yes |
| F22D4N6 | ドコサテトラエン酸 | Adrenic acid (22:4 n-6) | g | Adrenic Acid | Yes |
| F22D5N6 | ドコサペンタエン酸n-6 | Osbond acid (22:5 n-6) | g | Osbond Acid | Yes |

### Polyunsaturated Fatty Acids - Omega-3

| Code | Name (JP) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| F18D3N3 | α-リノレン酸 | Alpha-linolenic acid (18:3 n-3) | g | Alpha-Linolenic Acid | Yes |
| F18D4N3 | オクタデカテトラエン酸 | Stearidonic acid (18:4 n-3) | g | Stearidonic Acid | Yes |
| F20D3N3 | イコサトリエン酸n-3 | Eicosatrienoic acid (20:3 n-3) | g | Eicosatrienoic Acid (n-3) | Yes |
| F20D4N3 | イコサテトラエン酸 | Eicosatetraenoic acid (20:4 n-3) | g | Eicosatetraenoic Acid (n-3) | Yes |
| F20D5N3 | イコサペンタエン酸 | EPA (20:5 n-3) | g | Eicosapentaenoic Acid | Yes |
| F21D5N3 | ヘンイコサペンタエン酸 | Heneicosapentaenoic acid (21:5 n-3) | g | Heneicosapentaenoic Acid | Yes |
| F22D5N3 | ドコサペンタエン酸n-3 | DPA (22:5 n-3) | g | Docosapentaenoic Acid | Yes |
| F22D6N3 | ドコサヘキサエン酸 | DHA (22:6 n-3) | g | Docosahexaenoic Acid | Yes |

---

## New Compounds Summary (Estimated 11)

| Name | Type | Unit | MEXT Code | Notes |
|------|------|------|-----------|-------|
| Heptanoic Acid | FATTY_ACID | g | F7D0 | 7:0 saturated |
| Anteiso-Pentadecanoic Acid | FATTY_ACID | g | F15D0AI | Branched-chain 15:0 |
| Iso-Palmitic Acid | FATTY_ACID | g | F16D0I | Branched-chain 16:0 |
| Anteiso-Margaric Acid | FATTY_ACID | g | F17D0AI | Branched-chain 17:0 |
| Decenoic Acid | FATTY_ACID | g | F10D1 | 10:1 monounsaturated |
| Hexadecadienoic Acid | FATTY_ACID | g | F16D2 | 16:2 (found in fish/algae) |
| Hexadecatrienoic Acid | FATTY_ACID | g | F16D3 | 16:3 (found in algae) |
| Hexadecatetraenoic Acid | FATTY_ACID | g | F16D4 | 16:4 (found in algae) |
| Ammonia | OTHER | mg | AMMON | Metabolic marker |
| Sugar Alcohols | CARBOHYDRATE | g | POLYL | Sum of polyols |
| Beta-Carotene Equivalents | VITAMIN | µg | CARTBEQ | Calculated provitamin A |

---

## Mapping Summary

### Main Composition (52 codes)
- **Mapped**: ~45
- **Skipped**: ~4 (REFUSE, OA sum, duplicates)
- **New**: ~3 (Sugar Alcohols, Beta-Carotene Equivalents, potentially K/P if found)

### Amino Acids (24 codes)
- **Mapped**: ~21
- **Skipped**: ~3 (AAS, AAA, AAT sums, AMMON-E)
- **New**: 1 (Ammonia)

### Fatty Acids (55 codes)
- **Mapped**: ~47
- **Skipped**: ~2 (FAUN, F18D1 sum)
- **New**: ~8 (branched-chain + C16 PUFAs)

### Totals
- **Total mappable**: ~113
- **Total skipped**: ~9
- **New compounds**: ~11

---

## Code Format Differences

MEXT uses different separator format than EuroFIR:

| MEXT | EuroFIR | Description |
|------|---------|-------------|
| F18D2N6 | F18:2CN6 | Uses D instead of : and N instead of CN |
| F18D1CN9 | F18:1CN9 | Mixed - sometimes uses CN |
| PROT- | PROT | Suffix indicates primary value |
| FAT- | FAT | Suffix indicates primary value |

---

## Integration Checklist

- [x] Download MEXT 8th edition Excel files
- [x] Extract and analyze structure (131 components)
- [x] Create mapping tracker
- [x] Verify existing compounds in database
- [x] Create add-mext-compounds.ts script
- [x] Run compound additions (4 new)
- [x] Run mappings (122 total)
- [x] Update DATA_SOURCES.md

---

## Notes

### Unique Value from MEXT
1. **Amino acid profiles**: Full essential + non-essential AA data for 2,478 foods
2. **Branched-chain fatty acids**: Iso/anteiso forms (F15D0AI, F16D0I, F17D0AI) found in dairy/ruminant fat
3. **C16 polyunsaturated**: Hexadecadienoic, hexadecatrienoic, hexadecatetraenoic - algal fatty acids important in seafood
4. **Japanese foods**: Traditional Japanese ingredients (natto, miso, seaweed, tofu varieties)

### Potential Issues
1. Missing K (Potassium) and P (Phosphorus) from extracted list - need to check raw Excel
2. Some codes have Japanese-only names in certain rows
3. Vitamin E is only alpha-tocopherol forms (no tocotrienols in main table)
