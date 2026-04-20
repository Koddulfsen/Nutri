# KFCT 9th Revision (Korea) Mapping Tracker

**Source**: Rural Development Administration (RDA), National Institute of Crop Science
**Version**: 9th Revision (2016/2018)
**Foods**: 3,000 items
**Components**: ~139 nutrient codes
**License**: Public domain (Korean government)
**Format**: PDF, Excel (via search interface)
**URL**: https://koreanfood.rda.go.kr/eng/fctFoodSrchEng/main
**Attribution**: "Korean Food Composition Table, 9th Revision, Rural Development Administration"

---

## Data Structure

KFCT provides food composition data in PDF volumes and online searchable database:

### Files Downloaded
- `kfct_9th_vol1.pdf` (21 MB) - Main composition, amino acids, fatty acids, cholesterol
- `kfct_9th_vol2.pdf` (21 MB) - Additional nutrient data

### Additional Databases (Online)
- **Flavonoid Database**: 300+ foods, 476 flavonoid derivatives
- **Phenolic Acid Database**: 400+ foods, 171 phenolic acid derivatives

### Code Format
KFCT uses INFOODS-style codes with some variations:
- Fatty acids use "F" suffix: `F18D2N6F` (vs MEXT `F18D2N6`)
- Protein: `PROCNP` (vs standard `PROT`)
- Standard vitamin/mineral codes otherwise

---

## Mapping Progress

**Status**: 128/139 mapped ✅ COMPLETE

**New compounds added**: 0 (all already existed)

**Skipped**: 11 (sums: AAE10A, AANE, AAT19, FAESSF, FAFREF, food categories)

---

## Macronutrients (7 codes)

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| ENERC | 에너지 | Energy | kcal | Energy | Yes |
| WATER | 수분 | Water | g | Water | Yes |
| PROCNP | 단백질 | Protein | g | Protein | Yes |
| FAT | 지질 | Fat | g | Total Fat | Yes |
| CHOTDF | 탄수화물 | Carbohydrate | g | Total Carbohydrate | Yes |
| ASH | 회분 | Ash | g | Ash | Yes |
| CHOLE | 콜레스테롤 | Cholesterol | mg | Cholesterol | Yes |

---

## Dietary Fiber (4 codes)

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| FIBTG | 식이섬유 | Total dietary fiber | g | Total Fiber | Yes |
| FIBINS | 불용성 식이섬유 | Insoluble fiber | g | Insoluble Fiber | Yes |
| FIBSOL | 수용성 식이섬유 | Soluble fiber | g | Soluble Fiber | Yes |
| FIBC | 조섬유 | Crude fiber | g | Crude Fiber | Yes |

---

## Sugars (8 codes)

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| SUGAR | 총당류 | Total sugars | g | Total Sugars | Yes |
| SUCS | 자당 | Sucrose | g | Sucrose | Yes |
| GLUS | 포도당 | Glucose | g | Glucose | Yes |
| FRUS | 과당 | Fructose | g | Fructose | Yes |
| GALS | 갈락토오스 | Galactose | g | Galactose | Yes |
| LACS | 유당 | Lactose | g | Lactose | Yes |
| MALS | 맥아당 | Maltose | g | Maltose | Yes |
| RAFS | 라피노오스 | Raffinose | g | Raffinose | Yes |

---

## Minerals (10 codes)

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| NA | 나트륨 | Sodium | mg | Sodium | Yes |
| NACL | 식염 | Salt | g | Salt | Yes |
| CA | 칼슘 | Calcium | mg | Calcium | Yes |
| MG | 마그네슘 | Magnesium | mg | Magnesium | Yes |
| FE | 철 | Iron | mg | Iron | Yes |
| ZN | 아연 | Zinc | mg | Zinc | Yes |
| CU | 구리 | Copper | mg | Copper | Yes |
| MN | 망간 | Manganese | mg | Manganese | Yes |
| ID | 요오드 | Iodine | µg | Iodine | Yes |
| SE | 셀레늄 | Selenium | µg | Selenium | Yes |
| MO | 몰리브덴 | Molybdenum | µg | Molybdenum | Yes |

---

## Vitamins - Retinoids & Carotenoids (5 codes)

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| VITA | 비타민 A | Vitamin A | IU | Vitamin A | No |
| VITA_RAE | 비타민 A RAE | Vitamin A RAE | µg | Vitamin A | Yes |
| RETOL | 레티놀 | Retinol | µg | Retinol | Yes |
| CARTB | 베타카로틴 | Beta-carotene | µg | Beta-Carotene | Yes |
| CARTA | 알파카로틴 | Alpha-carotene | µg | Alpha-Carotene | Yes |
| CRYPX | 크립토잔틴 | Cryptoxanthin | µg | Beta-Cryptoxanthin | Yes |

---

## Vitamins - D (3 codes)

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| VITD | 비타민 D | Vitamin D | µg | Vitamin D | Yes |
| CHOCAL | 콜레칼시페롤 | Cholecalciferol (D3) | µg | Vitamin D3 | Yes |
| ERGCAL | 에르고칼시페롤 | Ergocalciferol (D2) | µg | Vitamin D2 | Yes |

---

## Vitamins - E (9 codes)

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| VITE | 비타민 E | Vitamin E | mg | Vitamin E | Yes |
| TOCPHA | 알파-토코페롤 | Alpha-tocopherol | mg | Alpha-Tocopherol | Yes |
| TOCPHB | 베타-토코페롤 | Beta-tocopherol | mg | Beta-Tocopherol | Yes |
| TOCPHG | 감마-토코페롤 | Gamma-tocopherol | mg | Gamma-Tocopherol | Yes |
| TOCPHD | 델타-토코페롤 | Delta-tocopherol | mg | Delta-Tocopherol | Yes |
| TOCTRA | 알파-토코트리에놀 | Alpha-tocotrienol | mg | Alpha-Tocotrienol | Yes |
| TOCTRB | 베타-토코트리에놀 | Beta-tocotrienol | mg | Beta-Tocotrienol | Yes |
| TOCTRG | 감마-토코트리에놀 | Gamma-tocotrienol | mg | Gamma-Tocotrienol | Yes |
| TOCTRD | 델타-토코트리에놀 | Delta-tocotrienol | mg | Delta-Tocotrienol | Yes |

---

## Vitamins - K (1 code)

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| VITK1 | 비타민 K1 | Phylloquinone | µg | Phylloquinone | Yes |

---

## Vitamins - B Complex (11 codes)

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| THIA | 티아민 | Thiamin (B1) | mg | Thiamin | Yes |
| RIBF | 리보플라빈 | Riboflavin (B2) | mg | Riboflavin | Yes |
| NIA | 니아신 | Niacin | mg | Niacin | Yes |
| NIAEQ | 니아신당량 | Niacin equivalents | mg | Niacin Equivalents | Yes |
| PYRXN | 피리독신 | Pyridoxine (B6) | mg | Vitamin B6 | Yes |
| VITB12 | 비타민 B12 | Vitamin B12 | µg | Vitamin B12 | Yes |
| FOL | 엽산 | Folate | µg | Folate | Yes |
| FOLAC | 엽산 | Folic acid | µg | Folic Acid | Yes |
| FOLFD | 식품엽산 | Food folate | µg | Folate | No |
| BIOT | 비오틴 | Biotin | µg | Biotin | Yes |
| PANTAC | 판토텐산 | Pantothenic acid | mg | Pantothenic Acid | Yes |

---

## Vitamins - C (1 code)

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| VITC | 비타민 C | Vitamin C | mg | Vitamin C | Yes |

---

## Amino Acids (22 codes)

### Essential Amino Acids

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| ILE | 이소류신 | Isoleucine | mg | Isoleucine | Yes |
| LEU | 류신 | Leucine | mg | Leucine | Yes |
| LYS | 라이신 | Lysine | mg | Lysine | Yes |
| MET | 메티오닌 | Methionine | mg | Methionine | Yes |
| PHE | 페닐알라닌 | Phenylalanine | mg | Phenylalanine | Yes |
| THR | 트레오닌 | Threonine | mg | Threonine | Yes |
| TRP | 트립토판 | Tryptophan | mg | Tryptophan | Yes |
| VAL | 발린 | Valine | mg | Valine | Yes |
| HIS | 히스티딘 | Histidine | mg | Histidine | Yes |

### Non-Essential Amino Acids

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| CYS | 시스틴 | Cystine | mg | Cystine | Yes |
| TYR | 티로신 | Tyrosine | mg | Tyrosine | Yes |
| ARG | 아르기닌 | Arginine | mg | Arginine | Yes |
| ALA | 알라닌 | Alanine | mg | Alanine | Yes |
| ASP | 아스파르트산 | Aspartic acid | mg | Aspartic Acid | Yes |
| GLU | 글루탐산 | Glutamic acid | mg | Glutamic Acid | Yes |
| GLY | 글리신 | Glycine | mg | Glycine | Yes |
| PRO | 프롤린 | Proline | mg | Proline | Yes |
| SER | 세린 | Serine | mg | Serine | Yes |

### Other Amino Compounds

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| TAUN | 타우린 | Taurine | mg | Taurine | Yes |

### Sums (Skip)

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| AAE10A | 필수아미노산 | Essential AA sum | mg | *SKIP* | - |
| AANE | 비필수아미노산 | Non-essential AA sum | mg | *SKIP* | - |
| AAT19 | 총아미노산 | Total amino acids | mg | *SKIP* | - |

---

## Fatty Acid Sums (8 codes)

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| FASATF | 포화지방산 | Saturated fatty acids | g | Saturated Fat | Yes |
| FAMSF | 단일불포화지방산 | Monounsaturated FA | g | Monounsaturated Fat | Yes |
| FAPUF | 다가불포화지방산 | Polyunsaturated FA | g | Polyunsaturated Fat | Yes |
| FAPUN3F | n-3 지방산 | Omega-3 FA | g | Omega-3 Fatty Acids | Yes |
| FAPUN6F | n-6 지방산 | Omega-6 FA | g | Omega-6 Fatty Acids | Yes |
| FATRNF | 트랜스지방산 | Trans fatty acids | g | Trans Fat | Yes |
| FAESSF | 필수지방산 | Essential FA | g | *SKIP* | - |
| FAFREF | 유리지방산 | Free fatty acids | g | *SKIP* | - |

---

## Saturated Fatty Acids (14 codes)

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| F4D0F | 부티르산 | Butyric acid (4:0) | g | Butyric Acid | Yes |
| F6D0F | 카프로산 | Caproic acid (6:0) | g | Caproic Acid | Yes |
| F8D0F | 카프릴산 | Caprylic acid (8:0) | g | Caprylic Acid | Yes |
| F10D0F | 카프르산 | Capric acid (10:0) | g | Capric Acid | Yes |
| F12D0F | 라우르산 | Lauric acid (12:0) | g | Lauric Acid | Yes |
| F13D0F | 트리데칸산 | Tridecanoic acid (13:0) | g | Tridecanoic Acid | Yes |
| F14D0F | 미리스트산 | Myristic acid (14:0) | g | Myristic Acid | Yes |
| F15D0F | 펜타데칸산 | Pentadecanoic acid (15:0) | g | Pentadecanoic Acid | Yes |
| F16D0F | 팔미트산 | Palmitic acid (16:0) | g | Palmitic Acid | Yes |
| F17D0F | 헵타데칸산 | Margaric acid (17:0) | g | Margaric Acid | Yes |
| F18D0F | 스테아르산 | Stearic acid (18:0) | g | Stearic Acid | Yes |
| F20D0F | 아라키드산 | Arachidic acid (20:0) | g | Arachidic Acid | Yes |
| F21D0F | 헤네이코산산 | Heneicosanoic acid (21:0) | g | Heneicosanoic Acid | Yes |
| F22D0F | 베헨산 | Behenic acid (22:0) | g | Behenic Acid | Yes |
| F23D0F | 트리코산산 | Tricosanoic acid (23:0) | g | Tricosanoic Acid | Yes |
| F24D0F | 리그노세르산 | Lignoceric acid (24:0) | g | Lignoceric Acid | Yes |

---

## Monounsaturated Fatty Acids (10 codes)

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| F10D1 | 데센산 | Decenoic acid (10:1) | g | Decenoic Acid | Yes |
| F14D1F | 미리스톨레산 | Myristoleic acid (14:1) | g | Myristoleic Acid | Yes |
| F16D1 | 팔미톨레산 | Palmitoleic acid (16:1) | g | Palmitoleic Acid | Yes |
| F17D1F | 헵타데센산 | Heptadecenoic acid (17:1) | g | Heptadecenoic Acid | Yes |
| F18D1N9F | 올레산 | Oleic acid (18:1 n-9) | g | Oleic Acid | Yes |
| F18D1N7F | 백센산 | Vaccenic acid (18:1 n-7) | g | Vaccenic Acid (cis) | Yes |
| F18D1TN9 | 엘라이드산 | Elaidic acid (18:1t n-9) | g | Oleic Acid (trans) | Yes |
| F20D1F | 에이코센산 | Eicosenoic acid (20:1) | g | Eicosenoic Acid | Yes |
| F22D1F | 에루크산 | Erucic acid (22:1) | g | Erucic Acid | Yes |
| F24D1F | 네르본산 | Nervonic acid (24:1) | g | Nervonic Acid | Yes |

---

## Polyunsaturated Fatty Acids - Omega-6 (8 codes)

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| F18D2N6F | 리놀레산 | Linoleic acid (18:2 n-6) | g | Linoleic Acid | Yes |
| F18D2TN6 | 리놀레산(트랜스) | Linoleic acid (trans) | g | Linoleic Acid (trans,trans) | Yes |
| F18D3N6F | 감마리놀렌산 | Gamma-linolenic acid (18:3 n-6) | g | Gamma-Linolenic Acid | Yes |
| F20D2N6F | 에이코사디엔산 | Eicosadienoic acid (20:2 n-6) | g | Eicosadienoic Acid | Yes |
| F20D3N6F | 디호모감마리놀렌산 | DGLA (20:3 n-6) | g | Dihomo-gamma-linolenic Acid | Yes |
| F20D4N6F | 아라키돈산 | Arachidonic acid (20:4 n-6) | g | Arachidonic Acid | Yes |
| F22D2F | 도코사디엔산 | Docosadienoic acid (22:2) | g | Docosadienoic Acid | Yes |
| F22D5N6 | 오스본드산 | Osbond acid (22:5 n-6) | g | Osbond Acid | Yes |

---

## Polyunsaturated Fatty Acids - Omega-3 (9 codes)

| Code | Name (KR) | Name (EN) | Unit | Our Compound | Canonical |
|------|-----------|-----------|------|--------------|-----------|
| F18D3N3F | 알파리놀렌산 | Alpha-linolenic acid (18:3 n-3) | g | Alpha-Linolenic Acid | Yes |
| F18D3TN3 | 알파리놀렌산(트랜스) | ALA (trans) | g | Trans Alpha-Linolenic Acid | Yes |
| F18D4 | 스테아리돈산 | Stearidonic acid (18:4 n-3) | g | Stearidonic Acid | Yes |
| F20D3N3F | 에이코사트리엔산 | Eicosatrienoic acid (20:3 n-3) | g | Eicosatrienoic Acid (n-3) | Yes |
| F20D4N3 | 에이코사테트라엔산 | Eicosatetraenoic acid (20:4 n-3) | g | Eicosatetraenoic Acid (n-3) | Yes |
| F20D5N3F | EPA | EPA (20:5 n-3) | g | Eicosapentaenoic Acid | Yes |
| F22D5N3F | DPA | DPA (22:5 n-3) | g | Docosapentaenoic Acid | Yes |
| F22D6N3F | DHA | DHA (22:6 n-3) | g | Docosahexaenoic Acid | Yes |

---

## New Compounds Summary

Based on analysis, most KFCT codes map to existing compounds. Potential new compounds:

| Name | Type | Unit | KFCT Code | Notes |
|------|------|------|-----------|-------|
| Folic Acid | VITAMIN | µg | FOLAC | Synthetic folate form (may exist) |

---

## Mapping Summary

### By Category
- **Macronutrients**: 7 codes
- **Fiber**: 4 codes
- **Sugars**: 8 codes
- **Minerals**: 11 codes
- **Vitamins**: 30 codes
- **Amino Acids**: 19 codes (+ 3 sums skipped)
- **Fatty Acids**: 39 codes (+ 2 sums skipped)

### Totals
- **Total mappable**: ~118
- **Total skipped**: ~5 (sums)
- **New compounds**: ~1

---

## Code Format Differences

KFCT uses different format than MEXT:

| KFCT | MEXT | Description |
|------|------|-------------|
| F18D2N6F | F18D2N6 | KFCT adds "F" suffix |
| PROCNP | PROT- | Different protein code |
| FIBTG | FIB- | Different fiber code |
| FOLAC | - | Folic acid (synthetic) |

---

## Integration Checklist

- [x] Download KFCT 9th edition PDF files
- [x] Extract and analyze structure (~139 components)
- [x] Create mapping tracker
- [x] Create add-kfct-compounds.ts script
- [x] Run compound additions (0 new - all existed)
- [x] Run mappings (128 total)
- [x] Update DATA_SOURCES.md

---

## Notes

### Unique Value from KFCT
1. **All 4 tocotrienols**: Complete vitamin E profile
2. **Taurine**: Important for seafood-heavy Korean diet
3. **Korean foods**: Kimchi, doenjang, gochujang, traditional dishes
4. **Folate forms**: Both folic acid and food folate
5. **Flavonoid/Phenolic databases**: Additional specialized data available

### Potential Issues
1. PDF is in Korean - nutrient tables readable but food names need translation
2. Full 140-nutrient Excel requires search interface export
3. Some codes have "F" suffix inconsistently
