# Macronutrients - Compound Source Mappings

> **Category:** 3 of 9 (Core)
> **Compounds:** 79
> **Status:** 79/79 complete ✅

---

## Sources Reference

| Source | Type | Version | Docs |
|--------|------|---------|------|
| FDC (USDA) | API | 2024 | https://fdc.nal.usda.gov/api-guide.html |
| CNF (Canada) | API | 2024 | https://food-nutrition.canada.ca/api/ |
| AFCD (Australia) | CSV | 2024 | https://www.foodstandards.gov.au/science-data/monitoringnutrients/afcd |
| CoFID (UK) | CSV | 2021 | https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid |
| CIQUAL (France) | CSV | 2024 | https://ciqual.anses.fr/ |
| FOODfiles (NZ) | CSV | 2024 | https://www.foodcomposition.co.nz/ |
| Fineli (Finland) | CSV | 2024 | https://fineli.fi/ |
| BLS (Germany) | CSV | 4.0 | https://www.blsdb.de/ |
| NEVO (Netherlands) | CSV | 2025 | https://nevo-online.rivm.nl/ |
| Matvaretabellen (Norway) | API | 2024 | https://www.matvaretabellen.no/api/ |
| FRIDA (Denmark) | CSV | 5.4 | https://frida.fooddata.dk/ |
| MEXT (Japan) | CSV | 8th Ed | https://www.mext.go.jp/en/policy/science_technology/policy/title01/detail01/1374030.htm |
| KFCT (Korea) | CSV | 9th Rev | https://www.foodsafetykorea.go.kr/ |
| INDB (India) | CSV | 2024 | https://www.nin.res.in/ |
| ASEANFOODS | CSV | 2014 | http://www.inmu.mahidol.ac.th/aseanfoods/ |
| FooDB | API | 1.0 | https://foodb.ca/api_doc |
| Phenol-Explorer | CSV | 3.6 | http://phenol-explorer.eu/ |
| Duke's Phytochemical | Web | - | https://phytochem.nal.usda.gov/ |

---

## Progress

- [x] Protein (1)
- [ ] Amino Acids - Essential (9)
- [ ] Amino Acids - Non-Essential (11)
- [ ] Carbohydrates (1)
- [ ] Sugars (8)
- [ ] Fiber (7)
- [ ] Starch (1)
- [ ] Sugar Alcohols (7)
- [ ] Fat (1)
- [ ] Saturated Fatty Acids (12)
- [ ] Trans Fats (3)
- [ ] Monounsaturated Fatty Acids (4)
- [ ] Polyunsaturated Fatty Acids - Omega-3 (5)
- [ ] Polyunsaturated Fatty Acids - Omega-6 (5)
- [ ] Polyunsaturated Fatty Acids - Omega-9 (1)
- [ ] Cholesterol (1)

---

# PROTEIN

### Protein
**Canonical unit:** g
**DV:** 50g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1003 | Protein | g | 1.0 | API | canonical |
| CNF | ✓ | 203 | PROTEIN | g | 1.0 | API | USDA code |
| AFCD | ✓ | col | Protein | g | 1.0 | CSV | column name |
| CoFID | ✓ | col | Protein (g) | g | 1.0 | CSV | column name |
| CIQUAL | ✓ | 25000 | Protein | g | 1.0 | CSV | INFOODS: PROCNT |
| FOODfiles | ✓ | PROT | Protein, total | g | 1.0 | CSV | INFOODS tagname |
| Fineli | ✓ | PROT | Protein | g | 1.0 | CSV | EuroFIR code |
| BLS | ✓ | PROT625 | Protein (Nx6.25) | g | 1.0 | CSV | BLS code |
| NEVO | ✓ | PROT | Eiwit totaal | g | 1.0 | CSV | EuroFIR code |
| Matvaretabellen | ✓ | Protein | Protein | g | 1.0 | API | EuroFIR: PROT |
| FRIDA | ✓ | 218 | Protein | g | 1.0 | CSV | EuroFIR: PROT |
| MEXT | ✓ | col:9 | たんぱく質 | g | 1.0 | CSV | column index |
| KFCT | ✓ | PROCNP | 단백질 | g | 1.0 | CSV | INFOODS tagname |
| INDB | ✓ | protein_g | Protein | g | 1.0 | CSV | column name |
| ASEANFOODS | ✓ | PROCNT | Protein | g | 1.0 | CSV | INFOODS tagname |
| FooDB | ✓ | 2 | Proteins | g | 1.0 | CSV | FDBN00002 |
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only |
| Duke's | N/A | - | - | - | - | Web | phytochemicals only |

---

# ESSENTIAL AMINO ACIDS (9)

### Histidine
**Canonical unit:** g
**INFOODS:** HIS
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1221 | Histidine | g | 1.0 | API | canonical; SR Legacy: 512
| CNF | ✓ | 512 | HISTIDINE | g | 1.0 | API | tagname: HIS
| AFCD | ✓ | col | Histidine | mg/g N | conv | CSV | INFOODS: HISN; EuroFIR: HIS; per g nitrogen
| CoFID | ✗ | - | - | - | - | CSV | not available; only Trp/60 for niacin equiv
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids in dataset
| FOODfiles | ✓ | HIS | Histidine | mg | 0.001 | CSV | INFOODS; also HIS_G (g), HISN (/g N)
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP in amino acids
| BLS | ✓ | HIS | Histidin | g | 1.0 | CSV | EuroFIR code; German: Histidin
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP in amino acids
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids in dataset
| FRIDA | ✓ | 159 | Histidin | mg | 0.001 | CSV | EuroFIR: HIS; Danish: Histidin
| MEXT | ✗ | - | - | - | - | CSV | not in our extract; amino acids in separate MEXT tables
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; amino acids in separate KFCT tables
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids in dataset
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✗ | - | - | - | - | CSV | not in Nutrient.csv; may be in Compound.csv
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | L-HISTIDINE | L-Histidine | - | - | Web | also HISTIDINE; phytochemicals db

---

### Isoleucine [BCAA]
**Canonical unit:** g
**INFOODS:** ILE
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1212 | Isoleucine | g | 1.0 | API | canonical; SR Legacy: 503
| CNF | ✓ | 503 | ISOLEUCINE | g | 1.0 | API | tagname: ILE
| AFCD | ✓ | col | Isoleucine | mg/g N | conv | CSV | INFOODS: ILEN; EuroFIR: ILE
| CoFID | ✗ | - | - | - | - | CSV | not available; no amino acids
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✓ | ILE | Isoleucine | mg | 0.001 | CSV | INFOODS; also ILE_G (g), ILEN (/g N)
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP
| BLS | ✓ | ILE | Isoleucin | g | 1.0 | CSV | EuroFIR code; German: Isoleucin
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✓ | 161 | Isoleucin | mg | 0.001 | CSV | EuroFIR: ILE; Danish: Isoleucin
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✗ | - | - | - | - | CSV | not in Nutrient.csv; may be in Compound.csv
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | ISOLEUCINE | Isoleucine | - | - | Web | also L-(+)-ISOLEUCINE; phytochemicals db

---

### Leucine [BCAA]
**Canonical unit:** g
**INFOODS:** LEU
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1213 | Leucine | g | 1.0 | API | canonical; SR Legacy: 504
| CNF | ✓ | 504 | LEUCINE | g | 1.0 | API | tagname: LEU
| AFCD | ✓ | col | Leucine | mg/g N | conv | CSV | INFOODS: LEUN; EuroFIR: LEU
| CoFID | ✗ | - | - | - | - | CSV | not available; no amino acids
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✓ | LEU | Leucine | mg | 0.001 | CSV | INFOODS; also LEU_G (g), LEUN (/g N)
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP
| BLS | ✓ | LEU | Leucin | g | 1.0 | CSV | EuroFIR code; German: Leucin
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✓ | 180 | Leucin | mg | 0.001 | CSV | EuroFIR: LEU; Danish: Leucin
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✗ | - | - | - | - | CSV | not in Nutrient.csv; may be in Compound.csv
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | LEUCINE | Leucine | - | - | Web | also L-LEUCINE; phytochemicals db

---

### Lysine
**Canonical unit:** g
**INFOODS:** LYS
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1214 | Lysine | g | 1.0 | API | canonical; SR Legacy: 505
| CNF | ✓ | 505 | LYSINE | g | 1.0 | API | tagname: LYS
| AFCD | ✓ | col | Lysine | mg/g N | conv | CSV | INFOODS: LYSN; EuroFIR: LYS
| CoFID | ✗ | - | - | - | - | CSV | not available; no amino acids
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✓ | LYS | Lysine | mg | 0.001 | CSV | INFOODS; also LYS_G (g), LYSN (/g N)
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP
| BLS | ✓ | LYS | Lysin | g | 1.0 | CSV | EuroFIR code; German: Lysin
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✓ | 183 | Lysin | mg | 0.001 | CSV | EuroFIR: LYS; Danish: Lysin
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✗ | - | - | - | - | CSV | not in Nutrient.csv; may be in Compound.csv
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | LYSINE | Lysine | - | - | Web | also L-LYSINE; phytochemicals db

---

### Methionine
**Canonical unit:** g
**INFOODS:** MET
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1215 | Methionine | g | 1.0 | API | canonical; SR Legacy: 506
| CNF | ✓ | 506 | METHIONINE | g | 1.0 | API | tagname: MET
| AFCD | ✓ | col | Methionine | mg/g N | conv | CSV | INFOODS: METN; EuroFIR: MET
| CoFID | ✗ | - | - | - | - | CSV | not available; no amino acids
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✓ | MET | Methionine | mg | 0.001 | CSV | INFOODS; also MET_G (g), METN (/g N)
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP
| BLS | ✓ | MET | Methionin | g | 1.0 | CSV | EuroFIR code; German: Methionin
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✓ | 189 | Methionin | mg | 0.001 | CSV | EuroFIR: MET; Danish: Methionin
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✗ | - | - | - | - | CSV | not in Nutrient.csv; may be in Compound.csv
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | METHIONINE | Methionine | - | - | Web | phytochemicals db

---

### Phenylalanine
**Canonical unit:** g
**INFOODS:** PHE
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1217 | Phenylalanine | g | 1.0 | API | canonical; SR Legacy: 508
| CNF | ✓ | 508 | PHENYLALANINE | g | 1.0 | API | tagname: PHE
| AFCD | ✓ | col | Phenylalanine | mg/g N | conv | CSV | INFOODS: PHEN; EuroFIR: PHE
| CoFID | ✗ | - | - | - | - | CSV | not available; no amino acids
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✓ | PHE | Phenylalanine | mg | 0.001 | CSV | INFOODS; also PHE_G (g), PHEN (/g N)
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP
| BLS | ✓ | PHE | Phenylalanin | g | 1.0 | CSV | EuroFIR code; German: Phenylalanin
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✓ | 211 | Phenylalanin | mg | 0.001 | CSV | EuroFIR: PHE; Danish: Phenylalanin
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✗ | - | - | - | - | CSV | not in Nutrient.csv; may be in Compound.csv
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | PHENYLALANINE | Phenylalanine | - | - | Web | also L-(-)-PHENYLALANINE; phytochemicals db

---

### Threonine
**Canonical unit:** g
**INFOODS:** THR
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1211 | Threonine | g | 1.0 | API | canonical; SR Legacy: 502
| CNF | ✓ | 502 | THREONINE | g | 1.0 | API | tagname: THR
| AFCD | ✓ | col | Threonine | mg/g N | conv | CSV | INFOODS: THRN; EuroFIR: THR
| CoFID | ✗ | - | - | - | - | CSV | not available; no amino acids
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✓ | THR | Threonine | mg | 0.001 | CSV | INFOODS; also THR_G (g), THRN (/g N)
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP
| BLS | ✓ | THR | Threonin | g | 1.0 | CSV | EuroFIR code; German: Threonin
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✓ | 258 | Threonin | mg | 0.001 | CSV | EuroFIR: THR; Danish: Threonin
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✗ | - | - | - | - | CSV | not in Nutrient.csv; may be in Compound.csv
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | THREONINE | Threonine | - | - | Web | also L-(-)-THREONINE; phytochemicals db

---

### Tryptophan
**Canonical unit:** g
**INFOODS:** TRP
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1210 | Tryptophan | g | 1.0 | API | canonical; SR Legacy: 501
| CNF | ✓ | 501 | TRYPTOPHAN | g | 1.0 | API | tagname: TRP
| AFCD | ✓ | col | Tryptophan | mg/g N; mg | conv | CSV | EuroFIR: TRP
| CoFID | ✗ | - | - | - | - | CSV | only Trp/60 for niacin equiv; no amino acid
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✓ | TRP | Tryptophan | mg | 0.001 | CSV | INFOODS; also TRP_G (g), TRPN (/g N)
| Fineli | ✓ | TRP | Tryptophan | mg | 0.001 | CSV | EuroFIR: TRP; only amino acid in Fineli
| BLS | ✓ | TRP | Tryptophan | g | 1.0 | CSV | EuroFIR code
| NEVO | ✓ | TRP | Tryptofaan | mg | 0.001 | CSV | EuroFIR: TRP; Dutch: Tryptofaan; only amino acid
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✓ | 262 | Tryptofan | mg | 0.001 | CSV | EuroFIR: TRP; Danish: Tryptofan
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✗ | - | - | - | - | CSV | not in Nutrient.csv; may be in Compound.csv
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | TRYPTOPHAN | Tryptophan | - | - | Web | also L-TRYPTOPHAN; phytochemicals db

---

### Valine [BCAA]
**Canonical unit:** g
**INFOODS:** VAL
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1219 | Valine | g | 1.0 | API | canonical; SR Legacy: 510
| CNF | ✓ | 510 | VALINE | g | 1.0 | API | tagname: VAL
| AFCD | ✓ | col | Valine | mg/g N | conv | CSV | INFOODS: VALN; EuroFIR: VAL
| CoFID | ✗ | - | - | - | - | CSV | not available; no amino acids
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✓ | VAL | Valine | mg | 0.001 | CSV | INFOODS; also VAL_G (g), VALN (/g N)
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP
| BLS | ✓ | VAL | Valin | g | 1.0 | CSV | EuroFIR code; German: Valin
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✓ | 266 | Valin | mg | 0.001 | CSV | EuroFIR: VAL; Danish: Valin
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✗ | - | - | - | - | CSV | not in Nutrient.csv; may be in Compound.csv
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | VALINE | Valine | - | - | Web | also L-VALINE; phytochemicals db

---

# NON-ESSENTIAL AMINO ACIDS (11)

### Alanine
**Canonical unit:** g
**INFOODS:** ALA
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1222 | Alanine | g | 1.0 | API | canonical; SR Legacy: 513
| CNF | ✓ | 513 | ALANINE | g | 1.0 | API | tagname: ALA
| AFCD | ✓ | col | Alanine | mg/g N | conv | CSV | INFOODS: ALAN; EuroFIR: ALA
| CoFID | ✗ | - | - | - | - | CSV | not available; no amino acids
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✓ | ALA | Alanine | mg | 0.001 | CSV | INFOODS code
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP
| BLS | ✓ | ALA | Alanin | g | 1.0 | CSV | EuroFIR code; German: Alanin
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✓ | 17 | Alanin | mg | 0.001 | CSV | EuroFIR: ALA; Danish: Alanin
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✗ | - | - | - | - | CSV | not in Nutrient.csv; may be in Compound.csv
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | ALANINE | Alanine | - | - | Web | phytochemicals db

---

### Arginine
**Canonical unit:** g
**INFOODS:** ARG
**Notes:** Conditionally essential
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1220 | Arginine | g | 1.0 | API | canonical; SR Legacy: 511
| CNF | ✓ | 511 | ARGININE | g | 1.0 | API | tagname: ARG
| AFCD | ✓ | col | Arginine | mg/g N | conv | CSV | INFOODS: ARGN; EuroFIR: ARG
| CoFID | ✗ | - | - | - | - | CSV | not available; no amino acids
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✓ | ARG | Arginine | mg | 0.001 | CSV | INFOODS; also ARG_G (g), ARGN (/g N)
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP
| BLS | ✓ | ARG | Arginin | g | 1.0 | CSV | EuroFIR code; German: Arginin
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✓ | 31 | Arginin | mg | 0.001 | CSV | EuroFIR: ARG; Danish: Arginin
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✗ | - | - | - | - | CSV | not in Nutrient.csv; may be in Compound.csv
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | ARGININE | Arginine | - | - | Web | phytochemicals db

---

### Asparagine
**Canonical unit:** g
**INFOODS:** ASN
**Notes:** Non-essential; often combined with Aspartic acid (ASP/ASX) in databases
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | - | - | - | - | API | not in SR Legacy; only Aspartic acid (514/1223)
| CNF | ✗ | - | - | - | - | API | not available; only Aspartic acid
| AFCD | ✗ | - | - | - | - | CSV | not separate; combined in Aspartic acid
| CoFID | ✗ | - | - | - | - | CSV | not available; no amino acids
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✓ | ASN | Asparagine | mg | 0.001 | CSV | INFOODS; also ASN_G (g), ASNN (/g N)
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP
| BLS | ✗ | - | - | - | - | CSV | not separate; combined with Aspartic acid as ASP
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✗ | - | - | - | - | CSV | not separate; only Aspartic acid
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✓ | 787 | L-Asparagine | - | - | CSV | in Compound.csv; FDB000787
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | ASPARAGINE | Asparagine | - | - | Web | phytochemicals db

---

### Aspartic Acid
**Canonical unit:** g
**INFOODS:** ASP
**Notes:** Non-essential; often combined with Asparagine in databases
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1223 | Aspartic acid | g | 1.0 | API | canonical; SR Legacy: 514
| CNF | ✓ | 514 | ASPARTIC ACID | g | 1.0 | API | tagname: ASP
| AFCD | ✓ | col | Aspartic acid | mg/g N | conv | CSV | INFOODS: ASPN; EuroFIR: ASP
| CoFID | ✗ | - | - | - | - | CSV | not available; no amino acids
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✓ | ASP | Aspartic acid | mg | 0.001 | CSV | INFOODS; also ASP_G (g), ASPN (/g N)
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP
| BLS | ✓ | ASP | Asparaginsäure, inklusive Asparagin | g | 1.0 | CSV | EuroFIR; includes Asparagine
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✓ | 34 | Asparaginsyre | mg | 0.001 | CSV | EuroFIR: ASP; Danish: Asparaginsyre
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✓ | 12570 | L-Aspartic acid | - | - | CSV | in Compound.csv; FDB012567
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | ASPARTIC-ACID | Aspartic acid | - | - | Web | phytochemicals db

---

### Cysteine
**Canonical unit:** g
**INFOODS:** CYS (for Cystine)
**Notes:** Conditionally essential; FDC tracks Cystine (oxidized dimer), some sources track Cysteine (reduced monomer)
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1216 | Cystine | g | 1.0 | API | canonical; SR Legacy: 507
| CNF | ✓ | 507 | CYSTINE | g | 1.0 | API | tagname: CYS
| AFCD | ✓ | col | Cystine plus cysteine | mg/g N | conv | CSV | INFOODS: CYSN; EuroFIR: CYS
| CoFID | ✗ | - | - | - | - | CSV | not available; no amino acids
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✓ | CYS | Cystine | mg | 0.001 | CSV | INFOODS; also CYS_G (g), CYSN (/g N)
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP
| BLS | ✓ | CYSTE | Cystein | g | 1.0 | CSV | EuroFIR; tracks Cysteine not Cystine
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✓ | 124 | Cystin | mg | 0.001 | CSV | EuroFIR: CYS; Danish: Cystin
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✓ | 12566 | L-Cystine | - | - | CSV | also L-Cysteine (12681); FDB012563
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | CYSTINE | Cystine | - | - | Web | also CYSTEINE

---

### Glutamic Acid
**Canonical unit:** g
**INFOODS:** GLU
**Notes:** Non-essential; often combined with Glutamine in databases
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1224 | Glutamic acid | g | 1.0 | API | canonical; SR Legacy: 515
| CNF | ✓ | 515 | GLUTAMIC ACID | g | 1.0 | API | tagname: GLU
| AFCD | ✓ | col | Glutamic acid | mg/g N | conv | CSV | INFOODS: GLUN; EuroFIR: GLU
| CoFID | ✗ | - | - | - | - | CSV | not available; no amino acids
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✓ | GLU | Glutamic acid | mg | 0.001 | CSV | INFOODS; also GLU_G (g), GLUN (/g N)
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP
| BLS | ✓ | GLU | Glutaminsäure, inklusive Glutamin | g | 1.0 | CSV | EuroFIR; includes Glutamine
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✓ | 150 | Glutaminsyre | mg | 0.001 | CSV | EuroFIR: GLU; Danish: Glutaminsyre
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✓ | 12538 | L-Glutamic acid | - | - | CSV | in Compound.csv; FDB012535
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | GLUTAMIC-ACID | Glutamic acid | - | - | Web | phytochemicals db

---

### Glutamine
**Canonical unit:** g
**INFOODS:** GLN
**Notes:** Conditionally essential; often combined with Glutamic acid in databases
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | - | - | - | - | API | not in SR Legacy; combined with Glutamic acid
| CNF | ✗ | - | - | - | - | API | not available; combined with Glutamic acid
| AFCD | ✗ | - | - | - | - | CSV | not separate; combined in Glutamic acid
| CoFID | ✗ | - | - | - | - | CSV | not available; no amino acids
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✗ | - | - | - | - | CSV | not available; no separate glutamine code
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP
| BLS | ✗ | - | - | - | - | CSV | not separate; combined with Glutamic acid (GLU)
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✗ | - | - | - | - | CSV | not separate; only Glutamic acid (GLU)
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✓ | 31128 | L-glutamine | - | - | CSV | in Compound.csv; FDB030965
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | GLUTAMINE | Glutamine | - | - | Web | phytochemicals db

---

### Glycine
**Canonical unit:** g
**INFOODS:** GLY
**Notes:** Conditionally essential
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1225 | Glycine | g | 1.0 | API | canonical; SR Legacy: 516
| CNF | ✓ | 516 | GLYCINE | g | 1.0 | API | tagname: GLY
| AFCD | ✓ | col | Glycine | mg/g N | conv | CSV | INFOODS: GLYN; EuroFIR: GLY
| CoFID | ✗ | - | - | - | - | CSV | not available; no amino acids
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✓ | GLY | Glycine | mg | 0.001 | CSV | INFOODS; also GLY_G (g), GLYN (/g N)
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP
| BLS | ✓ | GLY | Glycin | g | 1.0 | CSV | EuroFIR code; German: Glycin
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✓ | 153 | Glycin | mg | 0.001 | CSV | EuroFIR: GLY; Danish: Glycin
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✓ | 484 | Glycine | - | - | CSV | in Compound.csv; FDB000484
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | GLYCINE | Glycine | - | - | CSV | CHEMICALS.csv

---

### Proline
**Canonical unit:** g
**INFOODS:** PRO
**Notes:** Conditionally essential
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1226 | Proline | g | 1.0 | API | canonical; SR Legacy: 517
| CNF | ✓ | 517 | PROLINE | g | 1.0 | API | tagname: PRO
| AFCD | ✓ | col | Proline | mg/g N | conv | CSV | INFOODS: PRON; EuroFIR: PRO
| CoFID | ✗ | - | - | - | - | CSV | not available; no amino acids
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✓ | PRO | Proline | mg | 0.001 | CSV | INFOODS; also PRO_G (g), PRON (/g N)
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP
| BLS | ✓ | PRO | Prolin | g | 1.0 | CSV | EuroFIR code; German: Prolin
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✓ | 216 | Prolin | mg | 0.001 | CSV | EuroFIR: PRO; Danish: Prolin
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✓ | 570 | L-Proline | - | - | CSV | in Compound.csv; FDB000570
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | PROLINE | Proline | - | - | CSV | CHEMICALS.csv

---

### Serine
**Canonical unit:** g
**INFOODS:** SER
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1227 | Serine | g | 1.0 | API | canonical; SR Legacy: 518
| CNF | ✓ | 518 | SERINE | g | 1.0 | API | tagname: SER
| AFCD | ✓ | col | Serine | mg/g N | conv | CSV | INFOODS: SERN; EuroFIR: SER
| CoFID | ✗ | - | - | - | - | CSV | not available; no amino acids
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✓ | SER | Serine | mg | 0.001 | CSV | INFOODS; also SER_G (g), SERN (/g N)
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP
| BLS | ✓ | SER | Serin | g | 1.0 | CSV | EuroFIR code; German: Serin
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✓ | 231 | Serin | mg | 0.001 | CSV | EuroFIR: SER; Danish: Serin
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✓ | 12742 | L-Serine | - | - | CSV | in Compound.csv; FDB012739
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | SERINE | Serine | - | - | CSV | CHEMICALS.csv

---

### Tyrosine
**Canonical unit:** g
**INFOODS:** TYR
**Notes:** Conditionally essential
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1218 | Tyrosine | g | 1.0 | API | canonical; SR Legacy: 509
| CNF | ✓ | 509 | TYROSINE | g | 1.0 | API | tagname: TYR
| AFCD | ✓ | col | Tyrosine | mg/g N | conv | CSV | INFOODS: TYRN; EuroFIR: TYR
| CoFID | ✗ | - | - | - | - | CSV | not available; no amino acids
| CIQUAL | ✗ | - | - | - | - | CSV | not available; no amino acids
| FOODfiles | ✓ | TYR | Tyrosine | mg | 0.001 | CSV | INFOODS; also TYR_G (g), TYRN (/g N)
| Fineli | ✗ | - | - | - | - | CSV | not available; only TRP
| BLS | ✓ | TYR | Tyrosin | g | 1.0 | CSV | EuroFIR code; German: Tyrosin
| NEVO | ✗ | - | - | - | - | CSV | not available; only TRP
| Matvaretabellen | ✗ | - | - | - | - | API | not available; no amino acids
| FRIDA | ✓ | 264 | Tyrosin | mg | 0.001 | CSV | EuroFIR: TYR; Danish: Tyrosin
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not in our extract; no amino acids
| INDB | ✗ | - | - | - | - | CSV | not available; no amino acids
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✓ | 446 | L-Tyrosine | - | - | CSV | FDB000446
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | TYROSINE | Tyrosine | - | - | CSV | CHEMICALS.csv

---

# CARBOHYDRATES

### Carbohydrates (Total)
**Canonical unit:** g
**INFOODS:** CHOCDF / CHOAVL / CHOTDF
**DV:** 275g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1005 | Carbohydrate, by difference | g | 1.0 | API | canonical; SR Legacy: 205
| CNF | ✓ | 205 | CARBOHYDRATE, TOTAL (BY DIFFERENCE) | g | 1.0 | API | tagname: CHO-
| AFCD | ✓ | col | Available carbohydrate, with sugar alcohols | g | 1.0 | CSV | also: without sugar alcohols
| CoFID | ✓ | col | Carbohydrate (g) | g | 1.0 | CSV | sheet: 1.3 Proximates
| CIQUAL | ✓ | 31000 | Carbohydrate | g | 1.0 | CSV | INFOODS: CHOAVL
| FOODfiles | ✓ | CHOCDF | Total carbohydrate by difference | g | 1.0 | CSV | also: CHOAVL, CHOAVLDF
| Fineli | ✓ | CHOAVL | Carbohydrate, available | g | 1.0 | CSV | EuroFIR: CHOAVL
| BLS | ✓ | CHO | Kohlenhydrate, verfügbar | g | 1.0 | CSV | German: Kohlenhydrate
| NEVO | ✓ | CHO | Koolhydraten beschikbaar | g | 1.0 | CSV | Dutch: Carbohydrate available
| Matvaretabellen | ✓ | Karbo | Carbohydrate | g | 1.0 | API | EuroFIR: CHO; Norwegian: Karbo
| FRIDA | ✓ | 170 | Kulhydrat difference | g | 1.0 | CSV | EuroFIR: CHOT; also: 172 (CHOAVL)
| MEXT | ✓ | col20 | 炭水化物 | g | 1.0 | CSV | also: col13 (available, monosaccharide equiv)
| KFCT | ✓ | CHOTDF | 탄수화물 | g | 1.0 | CSV | tagname: CHOTDF; Korean
| INDB | ✓ | carb_g | Carb | g | 1.0 | CSV | column name
| ASEANFOODS | ✓ | CHOCDF | Total carbohydrate | g | 1.0 | CSV | also: CHOAVLDF (available)
| FooDB | ✓ | 3 | Carbohydrate | - | - | CSV | FDBN00003; Nutrient.csv
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | CARBOHYDRATE | Carbohydrate | - | - | CSV | CHEMICALS.csv

---

# SUGARS (8)

### Total Sugars
**Canonical unit:** g
**INFOODS:** SUGAR
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1063 | Sugars, Total | g | 1.0 | API | SR Legacy: 269
| CNF | ✓ | 269 | SUGAR, TOTAL | g | 1.0 | API | tagname: SUGAR
| AFCD | ✓ | col | Total sugars | g | 1.0 | CSV | Core nutrients
| CoFID | ✓ | col | Total sugars (g) | g | 1.0 | CSV | sheet: 1.3 Proximates
| CIQUAL | ✓ | 32000 | Sugars | g | 1.0 | CSV | INFOODS: SUGAR
| FOODfiles | ✓ | SUGAR | Sugars, total | g | 1.0 | CSV | INFOODS tagname
| Fineli | ✓ | SUGAR | Total sugars | g | 1.0 | CSV | EuroFIR: SUGAR
| BLS | ✓ | SUGAR | Zucker, gesamt | g | 1.0 | CSV | German: Zucker (Mono- und Disaccharide)
| NEVO | ✓ | SUGAR | Mono en disachariden totaal | g | 1.0 | CSV | Dutch: Sugars total
| Matvaretabellen | ✓ | Mono+Di | Sugar, total | g | 1.0 | API | EuroFIR: SUGAR
| FRIDA | ✓ | 245 | Sum sukkerarter | g | 1.0 | CSV | EuroFIR: SUGAR; Danish
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✓ | SUGAR | 총 당류 | g | 1.0 | CSV | tagname: SUGAR; Korean: Total Sugar
| INDB | ✗ | - | - | - | - | CSV | only freesugar_g; no total sugars
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available; only 22 basic nutrients
| FooDB | ✗ | - | - | - | - | CSV | not in Nutrient.csv; only Carbohydrate
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✓ | SUGAR | Sugar | - | - | CSV | CHEMICALS.csv

---

### Added Sugars
**Canonical unit:** g
**INFOODS:** SUGAD
**DV:** <50g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1235 | Sugars, Added | g | 1.0 | API | SR Legacy: 539
| CNF | ✓ | 539 | SUGAR, ADDED | g | 1.0 | API | tagname: SUGAD
| AFCD | ✓ | col | Added sugars | g | 1.0 | CSV | Core nutrients
| CoFID | ✗ | - | - | - | - | CSV | not available
| CIQUAL | ✗ | - | - | - | - | CSV | not available
| FOODfiles | ✓ | SUGAD | Sugar, added | g | 1.0 | CSV | INFOODS tagname
| Fineli | ✗ | - | - | - | - | CSV | not available
| BLS | ✗ | - | - | - | - | CSV | not available
| NEVO | ✗ | - | - | - | - | CSV | not available
| Matvaretabellen | ✓ | Sukker | Sugar, added | g | 1.0 | API | EuroFIR: SUGAD
| FRIDA | ✓ | 417 | Tilsat Sukker | g | 1.0 | CSV | EuroFIR: SUGAD; Danish
| MEXT | ✗ | - | - | - | - | CSV | not in our extract
| KFCT | ✗ | - | - | - | - | CSV | not available
| INDB | ✗ | - | - | - | - | CSV | not available
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available
| FooDB | ✗ | - | - | - | - | CSV | not in Nutrient.csv
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only
| Duke's | ✗ | - | - | - | - | CSV | not in CHEMICALS.csv

---

### Glucose
**Canonical unit:** g
**INFOODS:** GLUS
**Notes:** Monosaccharide
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1011 | Glucose (dextrose) | g | 1.0 | API | SR Legacy: 211 |
| CNF | ✓ | 211 | Glucose | g | 1.0 | API | tagname: GLUS |
| AFCD | ✓ | col | Glucose | g | 1.0 | CSV | INFOODS: GLUCS |
| CoFID | ✓ | col | Glucose (g) | g | 1.0 | CSV | sheet: 1.3 Proximates |
| CIQUAL | ✓ | 32250 | Glucose | g | 1.0 | CSV | INFOODS: GLUS |
| FOODfiles | ✓ | GLUS | Glucose | g | 1.0 | CSV | INFOODS tagname |
| Fineli | ✓ | GLUS | Glucose | g | 1.0 | CSV | EuroFIR: GLUS |
| BLS | ✓ | GLUS | Glucose | g | 1.0 | CSV | German: Glucose |
| NEVO | ✗ | - | - | - | - | CSV | not available |
| Matvaretabellen | ✗ | - | - | - | - | API | no individual sugars |
| FRIDA | ✓ | 149 | Glukose | g | 1.0 | CSV | EuroFIR: GLUS; Danish |
| MEXT | ✗ | - | - | - | - | CSV | not in extract |
| KFCT | ✓ | GLUS | 포도당 | g | 1.0 | CSV | Korean: Glucose |
| INDB | ✗ | - | - | - | - | CSV | not available |
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available |
| FooDB | ✓ | 121331 | Glucose | - | - | CSV | FDB093715; Compound.csv |
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only |
| Duke's | ✓ | GLUCOSE | Glucose | - | - | CSV | CHEMICALS.csv |

---

### Fructose
**Canonical unit:** g
**INFOODS:** FRUS
**Notes:** Monosaccharide
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1012 | Fructose | g | 1.0 | API | SR Legacy: 212 |
| CNF | ✓ | 212 | Fructose | g | 1.0 | API | tagname: FRUS |
| AFCD | ✓ | col | Fructose | g | 1.0 | CSV | INFOODS: FRUS |
| CoFID | ✓ | col | Fructose (g) | g | 1.0 | CSV | sheet: 1.3 Proximates |
| CIQUAL | ✓ | 32210 | Fructose | g | 1.0 | CSV | INFOODS: FRUS |
| FOODfiles | ✓ | FRUS | Fructose | g | 1.0 | CSV | INFOODS tagname |
| Fineli | ✓ | FRUS | Fructose | g | 1.0 | CSV | EuroFIR: FRUS |
| BLS | ✓ | FRUS | Fructose | g | 1.0 | CSV | German: Fructose |
| NEVO | ✗ | - | - | - | - | CSV | not available |
| Matvaretabellen | ✗ | - | - | - | - | API | no individual sugars |
| FRIDA | ✓ | 146 | Fruktose | g | 1.0 | CSV | EuroFIR: FRUS; Danish |
| MEXT | ✗ | - | - | - | - | CSV | not in extract |
| KFCT | ✓ | FRUS | 과당 | g | 1.0 | CSV | Korean: Fructose |
| INDB | ✗ | - | - | - | - | CSV | not available |
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available |
| FooDB | ✓ | 12531 | D-Fructose | - | - | CSV | FDB012528; Compound.csv |
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only |
| Duke's | ✓ | FRUCTOSE | Fructose | - | - | CSV | CHEMICALS.csv |

---

### Galactose
**Canonical unit:** g
**INFOODS:** GALS
**Notes:** Monosaccharide
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1075 | Galactose | g | 1.0 | API | SR Legacy nutrient ID |
| CNF | ✓ | 287 | Galactose | g | 1.0 | API | tagname: GALS |
| AFCD | ✓ | col | Galactose | g | 1.0 | CSV | INFOODS: GALS |
| CoFID | ✓ | col | Galactose (g) | g | 1.0 | CSV | sheet: 1.3 Proximates |
| CIQUAL | ✓ | 32220 | Galactose | g | 1.0 | CSV | INFOODS: GALS |
| FOODfiles | ✓ | GALS | Galactose | g | 1.0 | CSV | INFOODS tagname |
| Fineli | ✓ | GALS | Galactose | g | 1.0 | CSV | EuroFIR: GALS |
| BLS | ✓ | GALS | Galactose | g | 1.0 | CSV | German: Galactose |
| NEVO | ✗ | - | - | - | - | CSV | not available |
| Matvaretabellen | ✗ | - | - | - | - | API | no individual sugars |
| FRIDA | ✓ | 148 | Galaktose | g | 1.0 | CSV | EuroFIR: GALS; Danish |
| MEXT | ✗ | - | - | - | - | CSV | not in extract |
| KFCT | ✓ | GALS | 갈락토오스 | g | 1.0 | CSV | Korean: Galactose |
| INDB | ✗ | - | - | - | - | CSV | not available |
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available |
| FooDB | ✓ | 12706 | D-Galactose | - | - | CSV | FDB012703; Compound.csv |
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only |
| Duke's | ✓ | GALACTOSE | Galactose | - | - | CSV | CHEMICALS.csv |

---

### Sucrose
**Canonical unit:** g
**INFOODS:** SUCS
**Notes:** Disaccharide (glucose + fructose)
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1010 | Sucrose | g | 1.0 | API | SR Legacy: 210 |
| CNF | ✓ | 210 | Sucrose | g | 1.0 | API | tagname: SUCS |
| AFCD | ✓ | col | Sucrose | g | 1.0 | CSV | INFOODS: SUCS |
| CoFID | ✓ | col | Sucrose (g) | g | 1.0 | CSV | sheet: 1.3 Proximates |
| CIQUAL | ✓ | 32480 | Sucrose | g | 1.0 | CSV | INFOODS: SUCS |
| FOODfiles | ✓ | SUCS | Sucrose | g | 1.0 | CSV | also: SUCSM (monosaccharide equiv) |
| Fineli | ✓ | SUCS | Sucrose | g | 1.0 | CSV | EuroFIR: SUCS |
| BLS | ✓ | SUCS | Saccharose | g | 1.0 | CSV | German: Saccharose |
| NEVO | ✗ | - | - | - | - | CSV | not available |
| Matvaretabellen | ✗ | - | - | - | - | API | no individual sugars |
| FRIDA | ✓ | 228 | Sakkarose | g | 1.0 | CSV | EuroFIR: SUCS; Danish |
| MEXT | ✗ | - | - | - | - | CSV | not in extract |
| KFCT | ✓ | SUCS | 자당 | g | 1.0 | CSV | Korean: Sucrose |
| INDB | ✗ | - | - | - | - | CSV | not available |
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available |
| FooDB | ✓ | 1131 | Sucrose | - | - | CSV | FDB001131; Compound.csv |
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only |
| Duke's | ✓ | SUCROSE | Sucrose | - | - | CSV | CHEMICALS.csv |

---

### Lactose
**Canonical unit:** g
**INFOODS:** LACS
**Notes:** Disaccharide (glucose + galactose)
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1013 | Lactose | g | 1.0 | API | SR Legacy: 213 |
| CNF | ✓ | 213 | Lactose | g | 1.0 | API | tagname: LACS |
| AFCD | ✓ | col | Lactose | g | 1.0 | CSV | INFOODS: LACS |
| CoFID | ✓ | col | Lactose (g) | g | 1.0 | CSV | sheet: 1.3 Proximates |
| CIQUAL | ✓ | 32410 | Lactose | g | 1.0 | CSV | INFOODS: LACS |
| FOODfiles | ✓ | LACS | Lactose | g | 1.0 | CSV | also: LACSM (monosaccharide equiv) |
| Fineli | ✓ | LACS | Lactose | g | 1.0 | CSV | EuroFIR: LACS |
| BLS | ✓ | LACS | Lactose | g | 1.0 | CSV | German: Lactose |
| NEVO | ✗ | - | - | - | - | CSV | not available |
| Matvaretabellen | ✗ | - | - | - | - | API | no individual sugars |
| FRIDA | ✓ | 179 | Laktose | g | 1.0 | CSV | EuroFIR: LACS; Danish |
| MEXT | ✗ | - | - | - | - | CSV | not in extract |
| KFCT | ✓ | LACS | 유당 | g | 1.0 | CSV | Korean: Lactose |
| INDB | ✗ | - | - | - | - | CSV | not available |
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available |
| FooDB | ✓ | 1145 | Lactose | - | - | CSV | FDB001145; Compound.csv |
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only |
| Duke's | ✓ | LACTOSE | Lactose | - | - | CSV | CHEMICALS.csv |

---

### Maltose
**Canonical unit:** g
**INFOODS:** MALS
**Notes:** Disaccharide (glucose + glucose)
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1014 | Maltose | g | 1.0 | API | SR Legacy: 214 |
| CNF | ✓ | 214 | Maltose | g | 1.0 | API | tagname: MALS |
| AFCD | ✓ | col | Maltose | g | 1.0 | CSV | INFOODS: MALS |
| CoFID | ✓ | col | Maltose (g) | g | 1.0 | CSV | sheet: 1.3 Proximates |
| CIQUAL | ✓ | 32430 | Maltose | g | 1.0 | CSV | INFOODS: MALS |
| FOODfiles | ✓ | MALS | Maltose | g | 1.0 | CSV | also: MALSM (monosaccharide equiv) |
| Fineli | ✓ | MALS | Maltose | g | 1.0 | CSV | EuroFIR: MALS |
| BLS | ✓ | MALS | Maltose | g | 1.0 | CSV | German: Maltose |
| NEVO | ✗ | - | - | - | - | CSV | not available |
| Matvaretabellen | ✗ | - | - | - | - | API | no individual sugars |
| FRIDA | ✓ | 185 | Maltose | g | 1.0 | CSV | EuroFIR: MALS; Danish |
| MEXT | ✗ | - | - | - | - | CSV | not in extract |
| KFCT | ✓ | MALS | 맥아당 | g | 1.0 | CSV | Korean: Maltose |
| INDB | ✗ | - | - | - | - | CSV | not available |
| ASEANFOODS | ✗ | - | - | - | - | CSV | not available |
| FooDB | ✓ | 1193 | Maltose | - | - | CSV | FDB001193; Compound.csv |
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only |
| Duke's | ✓ | MALTOSE | Maltose | - | - | CSV | CHEMICALS.csv |

---

# FIBER (7)

### Dietary Fiber (Total)
**Canonical unit:** g
**INFOODS:** FIBTG
**DV:** 28g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1079 | Fiber, total dietary | g | 1.0 | API | SR Legacy: 291 |
| CNF | ✓ | 291 | Fibre, total dietary | g | 1.0 | API | tagname: FIBTG |
| AFCD | ✓ | col | Dietary fibre | g | 1.0 | CSV | INFOODS: FIBTG |
| CoFID | ✓ | col | AOAC fibre (g) | g | 1.0 | CSV | also: NSP (g) |
| CIQUAL | ✓ | 34100 | Fibres | g | 1.0 | CSV | INFOODS: FIB- |
| FOODfiles | ✓ | FIBTG | Fibre, total dietary | g | 1.0 | CSV | INFOODS tagname |
| Fineli | ✓ | FIBT | Fibre, total dietary | g | 1.0 | CSV | EuroFIR: FIBT |
| BLS | ✓ | FIBT | Ballaststoffe, gesamt | g | 1.0 | CSV | German: total dietary fibre |
| NEVO | ✓ | FIBT | Voedingsvezel totaal | g | 1.0 | CSV | Dutch: total dietary fibre |
| Matvaretabellen | ✓ | Fiber | Dietary fibre | g | 1.0 | API | EuroFIR: FIBT |
| FRIDA | ✓ | 168 | Kostfibre | g | 1.0 | CSV | EuroFIR: FIBT; Danish |
| MEXT | ✓ | col18 | 食物繊維総量 | g | 1.0 | CSV | Japanese: total dietary fiber |
| KFCT | ✓ | FIBTG | 총 식이섬유 | g | 1.0 | CSV | Korean: total dietary fiber |
| INDB | ✓ | fibre_g | Fibre | g | 1.0 | CSV | column name |
| ASEANFOODS | ✓ | FIBTG | Dietary fibre | g | 1.0 | CSV | INFOODS tagname |
| FooDB | ✓ | 5 | Fiber (dietary) | - | - | CSV | FDBN00005; Nutrient.csv |
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only |
| Duke's | ✓ | FIBER | Fiber | - | - | CSV | CHEMICALS.csv |

---

### Soluble Fiber
**Canonical unit:** g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1082 | Fiber, soluble | g | 1.0 | API | SR Legacy: 295 |
| CNF | ✓ | 295 | Fibre, soluble | g | 1.0 | API | Same as SR Legacy code |
| AFCD | ✗ | - | - | - | - | CSV | Only has total dietary fibre |
| CoFID | ✗ | - | - | - | - | CSV | Only has AOAC fibre (total) |
| CIQUAL | ✗ | - | - | - | - | CSV | Only has "Fibres" (total) |
| FOODfiles | ✓ | FIBSOL | Fibre, water-soluble | g | 1.0 | CSV | INFOODS: FIBSOL |
| Fineli | ✗ | - | - | - | - | CSV | Has FIBT/FIBINS but no FIBSOL |
| BLS | ✓ | FIBSOL | Fibre, water-soluble | g | 1.0 | CSV | DE: Ballaststoffe, wasserlöslich |
| NEVO | ✗ | - | - | - | - | CSV | Only has FIBT (total dietary fibre) |
| Matvaretabellen | ✗ | - | - | - | - | API | Only has FIBT (dietary fibre) |
| FRIDA | ~ | 415+416 | HMW+LMW soluble fibre | g | 1.0 | CSV | FIBHMWS(415)+FIBLMW(416); no single FIBSOL |
| MEXT | ✗ | - | - | - | - | CSV | Only has total dietary fiber in extract |
| KFCT | ✓ | FIBSOL | Water Soluble Dietary Fiber | g | 1.0 | CSV | KR: 수용성 식이섬유 |
| INDB | ✗ | - | - | - | - | CSV | Only has total fibre |
| ASEANFOODS | ✗ | - | - | - | - | CSV | Only has FIBTG (total) |
| FooDB | ✗ | - | - | - | - | CSV | Only has total fiber (dietary) |
| Phenol-Explorer | N/A | - | - | - | - | - | Polyphenols only |
| Duke's | ✗ | - | - | - | - | CSV | Has FIBER/FIBER(DIETARY) but no soluble |

---

### Insoluble Fiber
**Canonical unit:** g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1084 | Fiber, insoluble | g | 1.0 | API | SR Legacy: 296 |
| CNF | ✓ | 296 | Fibre, insoluble | g | 1.0 | API | Same as SR Legacy code |
| AFCD | ✗ | - | - | - | - | CSV | Only has total dietary fibre |
| CoFID | ✗ | - | - | - | - | CSV | Only has AOAC fibre (total) |
| CIQUAL | ✗ | - | - | - | - | CSV | Only has "Fibres" (total) |
| FOODfiles | ✓ | FIBINS | Fibre, water-insoluble | g | 1.0 | CSV | INFOODS: FIBINS |
| Fineli | ✓ | FIBINS | Fibre, insoluble | g | 1.0 | CSV | EuroFIR: FIBINS |
| BLS | ✓ | FIBINS | Fibre, water-insoluble | g | 1.0 | CSV | DE: Ballaststoffe, wasserunlöslich |
| NEVO | ✗ | - | - | - | - | CSV | Only has FIBT (total) |
| Matvaretabellen | ✗ | - | - | - | - | API | Only has FIBT (dietary fibre) |
| FRIDA | ✓ | 414 | Insoluble dietary fibers | g | 1.0 | CSV | FIBINS; DK: Uopløselige kostfibre |
| MEXT | ✗ | - | - | - | - | CSV | Only has total dietary fiber in extract |
| KFCT | ✓ | FIBINS | Water Insoluble Dietary Fiber | g | 1.0 | CSV | KR: 불용성 식이섬유 |
| INDB | ✗ | - | - | - | - | CSV | Only has total fibre |
| ASEANFOODS | ✗ | - | - | - | - | CSV | Only has FIBTG (total) |
| FooDB | ✗ | - | - | - | - | CSV | Only has total fiber (dietary) |
| Phenol-Explorer | N/A | - | - | - | - | - | Polyphenols only |
| Duke's | ✗ | - | - | - | - | CSV | Has FIBER/FIBER(DIETARY) but no insoluble |

---

### Beta-Glucan
**Canonical unit:** g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 2058 | Beta-glucan | g | 1.0 | API | No SR Legacy code; newer FDC addition |
| CNF | ✗ | - | - | - | - | API | Not in CNF nutrient list |
| AFCD | ✗ | - | - | - | - | CSV | Not in nutrient list |
| CoFID | ✗ | - | - | - | - | CSV | Not in nutrient list |
| CIQUAL | ✗ | - | - | - | - | CSV | Not in nutrient list |
| FOODfiles | ✗ | - | - | - | - | CSV | Not in nutrient list |
| Fineli | ✗ | - | - | - | - | CSV | Not in nutrient list |
| BLS | ✗ | - | - | - | - | CSV | Not in nutrient list |
| NEVO | ✗ | - | - | - | - | CSV | Not in nutrient list |
| Matvaretabellen | ✗ | - | - | - | - | API | Not in nutrient list |
| FRIDA | ✗ | - | - | - | - | CSV | Not in nutrient list |
| MEXT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| KFCT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| INDB | ✗ | - | - | - | - | CSV | Not in nutrient list |
| ASEANFOODS | ✗ | - | - | - | - | CSV | Not in nutrient list |
| FooDB | ✓ | 5763 | beta-Glucan | g | 1.0 | CSV | FDB005762; in Compound.csv |
| Phenol-Explorer | N/A | - | - | - | - | - | Polyphenols only |
| Duke's | ✓ | BETA-GLUCAN | Beta-Glucan | - | - | CSV | Also has LENTINUS-EDODES-BETA-GLUCAN |

---

### Pectin
**Canonical unit:** g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | - | - | - | - | API | Not a tracked nutrient; only exists as food item |
| CNF | ✗ | - | - | - | - | API | Not a tracked nutrient |
| AFCD | ✗ | - | - | - | - | CSV | Not in nutrient list |
| CoFID | ✗ | - | - | - | - | CSV | Not in nutrient list |
| CIQUAL | ✗ | - | - | - | - | CSV | Not in nutrient list |
| FOODfiles | ✗ | - | - | - | - | CSV | Not in nutrient list |
| Fineli | ✗ | - | - | - | - | CSV | Not in nutrient list |
| BLS | ✗ | - | - | - | - | CSV | Not in nutrient list |
| NEVO | ✗ | - | - | - | - | CSV | Not in nutrient list |
| Matvaretabellen | ✗ | - | - | - | - | API | Not in nutrient list |
| FRIDA | ✗ | - | - | - | - | CSV | Not in nutrient list |
| MEXT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| KFCT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| INDB | ✗ | - | - | - | - | CSV | Not in nutrient list |
| ASEANFOODS | ✗ | - | - | - | - | CSV | Not in nutrient list |
| FooDB | ✓ | 23325 | Pectin | g | 1.0 | CSV | FDB023162; in Compound.csv |
| Phenol-Explorer | N/A | - | - | - | - | - | Polyphenols only |
| Duke's | ✓ | PECTIN | Pectin | - | - | CSV | Also has PECTINS, PROTOPECTIN |

---

### Inulin
**Canonical unit:** g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | - | - | - | - | API | Not a tracked nutrient; only food ingredient |
| CNF | ✗ | - | - | - | - | API | Not in CNF nutrient list |
| AFCD | ✓ | INULIN | Inulin | g | 1.0 | CSV | INFOODS: INULIN; EuroFIR: INULN |
| CoFID | ✗ | - | - | - | - | CSV | Not in nutrient list |
| CIQUAL | ✗ | - | - | - | - | CSV | Not in nutrient list |
| FOODfiles | ✗ | - | - | - | - | CSV | Not in nutrient list |
| Fineli | ✗ | - | - | - | - | CSV | Not in nutrient list |
| BLS | ✗ | - | - | - | - | CSV | Not in nutrient list |
| NEVO | ✗ | - | - | - | - | CSV | Not in nutrient list |
| Matvaretabellen | ✗ | - | - | - | - | API | Not in nutrient list |
| FRIDA | ✗ | - | - | - | - | CSV | Not in nutrient list |
| MEXT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| KFCT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| INDB | ✗ | - | - | - | - | CSV | Not in nutrient list |
| ASEANFOODS | ✗ | - | - | - | - | CSV | Not in nutrient list |
| FooDB | ✓ | 1141 | Inulin | g | 1.0 | CSV | FDB001141; in Compound.csv |
| Phenol-Explorer | N/A | - | - | - | - | - | Polyphenols only |
| Duke's | ✓ | INULIN | Inulin | - | - | CSV | |

---

### Resistant Starch
**Canonical unit:** g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | - | - | - | - | API | Not tracked; only total Starch (209) |
| CNF | ✗ | - | - | - | - | API | Not tracked; only total Starch (209) |
| AFCD | ✓ | - | Resistant starch | g | 1.0 | CSV | No INFOODS/EuroFIR tag; Proximates category |
| CoFID | ✗ | - | - | - | - | CSV | Not in nutrient list |
| CIQUAL | ✗ | - | - | - | - | CSV | Not in nutrient list |
| FOODfiles | ✓ | STARES | Starch, resistant | g | 1.0 | CSV | INFOODS: STARES |
| Fineli | ✗ | - | - | - | - | CSV | Not in nutrient list |
| BLS | ✗ | - | - | - | - | CSV | Not in nutrient list |
| NEVO | ✗ | - | - | - | - | CSV | Not in nutrient list |
| Matvaretabellen | ✗ | - | - | - | - | API | Not in nutrient list |
| FRIDA | ✗ | - | - | - | - | CSV | Not in nutrient list |
| MEXT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| KFCT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| INDB | ✗ | - | - | - | - | CSV | Not in nutrient list |
| ASEANFOODS | ✗ | - | - | - | - | CSV | Not in nutrient list |
| FooDB | ✗ | - | - | - | - | API | Not in Compound.csv or Nutrient.csv |
| Phenol-Explorer | N/A | - | - | - | - | CSV | Polyphenols only |
| Duke's | ✗ | - | - | - | - | Web | Only generic STARCH; no resistant starch |

---

# STARCH

### Starch
**Canonical unit:** g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 209 | Starch | g | 1.0 | API | SR Legacy 209; FDC 4-digit likely 1009 |
| CNF | ✓ | 810 | Starch | g | 1.0 | API | Code 209; tagname STARCH |
| AFCD | ✓ | - | Starch | g | 1.0 | CSV | Core nutrients category; no INFOODS/EuroFIR tags |
| CoFID | ✓ | - | Starch | g | 1.0 | CSV | Sheet 1.3 Proximates |
| CIQUAL | ✓ | 33110 | Starch | g | 1.0 | CSV | INFOODS: STARCH |
| FOODfiles | ✓ | STARCH | Starch, total | g | 1.0 | CSV | Also STARCHM (monosaccharide equiv.) |
| Fineli | ✓ | STARCH | Starch | g | 1.0 | CSV | INFOODS: STARCH; group CARBOCMP |
| BLS | ✓ | STARCH | Starch (starch, glycogen, dextrins) | g | 1.0 | CSV | Includes glycogen & dextrins |
| NEVO | ✓ | STARCH | Starch total | g | 1.0 | CSV | Dutch: Polysachariden totaal |
| Matvaretabellen | ✓ | Stivel | Starch | g | 1.0 | API | EuroFIR: STARCH |
| FRIDA | ✓ | 243 | Starch/Glycogen | g | 1.0 | CSV | Danish: Stivelse/Glykogen; EuroFIR: STARCH |
| MEXT | ✗ | - | - | - | - | CSV | Only aggregate Carbohydrate; no starch |
| KFCT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| INDB | ✗ | - | - | - | - | CSV | Not in nutrient list |
| ASEANFOODS | ✗ | - | - | - | - | CSV | Not in nutrient list |
| FooDB | ✗ | - | - | - | - | API | Only sub-compounds (Amylose, Amylopectin); no total Starch |
| Phenol-Explorer | N/A | - | - | - | - | CSV | Polyphenols only |
| Duke's | ✓ | STARCH | Starch | - | - | Web | |

---

# SUGAR ALCOHOLS (7)

### Erythritol
**Canonical unit:** g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | - | - | - | - | API | Not tracked as nutrient; only food ingredient |
| CNF | ✗ | - | - | - | - | API | Only sorbitol (261) and mannitol (260) tracked |
| AFCD | ✓ | ERYTHL | Erythritol | g | 1.0 | CSV | INFOODS: ERYTHL; EuroFIR: ERYTHL |
| CoFID | ✗ | - | - | - | - | CSV | Not in nutrient list |
| CIQUAL | ✗ | - | - | - | - | CSV | Only total Polyols (34000); no individual sugar alcohols |
| FOODfiles | ✗ | - | - | - | - | CSV | Not in nutrient list |
| Fineli | ✗ | - | - | - | - | CSV | Only total polyol (SUGOH/POLYOL); no individual |
| BLS | ✗ | - | - | - | - | CSV | Has MANTL/SORTL/XYLTL but no erythritol |
| NEVO | ✗ | - | - | - | - | CSV | Only total Polyols (POLYL); no individual |
| Matvaretabellen | ✗ | - | - | - | - | API | Not in nutrient list |
| FRIDA | ✗ | - | - | - | - | CSV | Only sum sugar alcohols (244); no individual |
| MEXT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| KFCT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| INDB | ✗ | - | - | - | - | CSV | Not in nutrient list |
| ASEANFOODS | ✗ | - | - | - | - | CSV | Not in nutrient list |
| FooDB | ✓ | 371 | Erythritol | - | - | API | FDB000371; Compound.csv |
| Phenol-Explorer | N/A | - | - | - | - | CSV | Polyphenols only |
| Duke's | ✓ | ERYTHRITOL | Erythritol | - | - | Web | |

---

### Xylitol
**Canonical unit:** g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | - | - | - | - | API | Not tracked; only Sorbitol (261) & Mannitol (260) |
| CNF | ✗ | - | - | - | - | API | Only Sorbitol (261) & Mannitol (260) tracked |
| AFCD | ✓ | XYLTL | Xylitol | g | 1.0 | CSV | INFOODS: XYLTL; EuroFIR: XYLTL |
| CoFID | ✗ | - | - | - | - | CSV | Not in nutrient list |
| CIQUAL | ✗ | - | - | - | - | CSV | Only total Polyols (34000) |
| FOODfiles | ✗ | - | - | - | - | CSV | Not in nutrient list |
| Fineli | ✗ | - | - | - | - | CSV | Only total polyol; no individual |
| BLS | ✓ | XYLTL | Xylitol | g | 1.0 | CSV | German: Xylit; group Polyols |
| NEVO | ✗ | - | - | - | - | CSV | Only total Polyols |
| Matvaretabellen | ✗ | - | - | - | - | API | Not in nutrient list |
| FRIDA | ✗ | - | - | - | - | CSV | Only sum sugar alcohols; no individual |
| MEXT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| KFCT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| INDB | ✗ | - | - | - | - | CSV | Not in nutrient list |
| ASEANFOODS | ✗ | - | - | - | - | CSV | Not in nutrient list |
| FooDB | ✓ | 1134 | Xylitol | - | - | API | FDB001134; Compound.csv |
| Phenol-Explorer | N/A | - | - | - | - | CSV | Polyphenols only |
| Duke's | ✓ | XYLITOL | Xylitol | - | - | Web | |

---

### Sorbitol
**Canonical unit:** g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 261 | Sorbitol | g | 1.0 | API | SR Legacy 261 |
| CNF | ✓ | 261 | Sorbitol | g | 1.0 | API | Code 261; tagname SORTL |
| AFCD | ✓ | SORTL | Sorbitol | g | 1.0 | CSV | INFOODS: SORTL; EuroFIR: SORTL |
| CoFID | ✗ | - | - | - | - | CSV | Not in nutrient list |
| CIQUAL | ✗ | - | - | - | - | CSV | Only total Polyols (34000) |
| FOODfiles | ✓ | SORTL_G | Sorbitol | g | 1.0 | CSV | INFOODS: SORTL |
| Fineli | ✗ | - | - | - | - | CSV | Only total polyol |
| BLS | ✓ | SORTL | Sorbitol | g | 1.0 | CSV | German: Sorbit; group Polyols |
| NEVO | ✗ | - | - | - | - | CSV | Only total Polyols |
| Matvaretabellen | ✗ | - | - | - | - | API | Not in nutrient list |
| FRIDA | ✓ | 237 | Sorbitol | g | 1.0 | CSV | EuroFIR: SORTL |
| MEXT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| KFCT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| INDB | ✗ | - | - | - | - | CSV | Not in nutrient list |
| ASEANFOODS | ✗ | - | - | - | - | CSV | Not in nutrient list |
| FooDB | ✓ | 11679 | D-Glucitol | g | 1.0 | CSV | FDB011676; CAS 50-70-4; = Sorbitol |
| Phenol-Explorer | N/A | - | - | - | - | - | Polyphenols only |
| Duke's | ✓ | SORBITOL | Sorbitol | - | - | CSV | Also D-SORBITOL, D-GLUCITOL (CAS 50-70-4) |

---

### Mannitol
**Canonical unit:** g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 260 | Mannitol | g | 1.0 | API | SR Legacy 260 |
| CNF | ✓ | 260 | Mannitol | g | 1.0 | API | Code 260; tagname MANTL |
| AFCD | ✓ | MANTL | Mannitol | g | 1.0 | CSV | INFOODS: MANTL; EuroFIR: MANTL |
| CoFID | ✗ | - | - | - | - | CSV | Not in nutrient list |
| CIQUAL | ✗ | - | - | - | - | CSV | Only total Polyols (34000) |
| FOODfiles | ✗ | - | - | - | - | CSV | Not in nutrient list |
| Fineli | ✗ | - | - | - | - | CSV | Only total polyol |
| BLS | ✓ | MANTL | Mannitol | g | 1.0 | CSV | German: Mannit; group Polyols |
| NEVO | ✗ | - | - | - | - | CSV | Only total Polyols |
| Matvaretabellen | ✗ | - | - | - | - | API | Not in nutrient list |
| FRIDA | ✗ | - | - | - | - | CSV | Only sum sugar alcohols (244) |
| MEXT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| KFCT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| INDB | ✗ | - | - | - | - | CSV | Not in nutrient list |
| ASEANFOODS | ✗ | - | - | - | - | CSV | Not in nutrient list |
| FooDB | ✓ | 1982 | D-Mannitol | g | 1.0 | CSV | FDB001982 |
| Phenol-Explorer | N/A | - | - | - | - | - | Polyphenols only |
| Duke's | ✓ | MANNITOL | Mannitol | - | - | CSV | Also D-MANNITOL, ALPHA-MANNITOL |

---

### Maltitol
**Canonical unit:** g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | - | - | - | - | API | Not tracked; only Sorbitol (261) & Mannitol (260) |
| CNF | ✗ | - | - | - | - | API | Only Sorbitol (261) & Mannitol (260) tracked |
| AFCD | ✓ | MALTL | Maltitol | g | 1.0 | CSV | INFOODS: MALTL; EuroFIR: MALTL |
| CoFID | ✗ | - | - | - | - | CSV | Not in nutrient list |
| CIQUAL | ✗ | - | - | - | - | CSV | Only total Polyols (34000) |
| FOODfiles | ✗ | - | - | - | - | CSV | Not in nutrient list |
| Fineli | ✗ | - | - | - | - | CSV | Only total polyol |
| BLS | ✗ | - | - | - | - | CSV | Has MANTL/SORTL/XYLTL but no Maltitol |
| NEVO | ✗ | - | - | - | - | CSV | Only total Polyols |
| Matvaretabellen | ✗ | - | - | - | - | API | Not in nutrient list |
| FRIDA | ✗ | - | - | - | - | CSV | Only sum sugar alcohols (244) |
| MEXT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| KFCT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| INDB | ✗ | - | - | - | - | CSV | Not in nutrient list |
| ASEANFOODS | ✗ | - | - | - | - | CSV | Not in nutrient list |
| FooDB | ✓ | 20377 | Maltitoll | g | 1.0 | CSV | FDB020369; name has typo (Maltitoll) |
| Phenol-Explorer | N/A | - | - | - | - | - | Polyphenols only |
| Duke's | ✗ | - | - | - | - | CSV | Not in database |

---

### Lactitol
**Canonical unit:** g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | - | - | - | - | API | Not tracked; only Sorbitol (261) & Mannitol (260) |
| CNF | ✗ | - | - | - | - | API | Only Sorbitol (261) & Mannitol (260) tracked |
| AFCD | ✗ | - | - | - | - | CSV | Not in nutrient list |
| CoFID | ✗ | - | - | - | - | CSV | Not in nutrient list |
| CIQUAL | ✗ | - | - | - | - | CSV | Only total Polyols (34000) |
| FOODfiles | ✗ | - | - | - | - | CSV | Not in nutrient list |
| Fineli | ✗ | - | - | - | - | CSV | Only total polyol |
| BLS | ✗ | - | - | - | - | CSV | Not in nutrient list |
| NEVO | ✗ | - | - | - | - | CSV | Only total Polyols |
| Matvaretabellen | ✗ | - | - | - | - | API | Not in nutrient list |
| FRIDA | ✗ | - | - | - | - | CSV | Only sum sugar alcohols (244) |
| MEXT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| KFCT | ✗ | - | - | - | - | CSV | Not in nutrient list |
| INDB | ✗ | - | - | - | - | CSV | Not in nutrient list |
| ASEANFOODS | ✗ | - | - | - | - | CSV | Not in nutrient list |
| FooDB | ✓ | 20787 | Lactitol | g | 1.0 | CSV | FDB020779 |
| Phenol-Explorer | N/A | - | - | - | - | - | Polyphenols only |
| Duke's | ✗ | - | - | - | - | CSV | Not in database |

---

# FAT

### Total Fat
**Canonical unit:** g
**DV:** 78g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 204 | Total lipid (fat) | g | 1.0 | API | SR Legacy 204 |
| CNF | ✓ | 204 | Total lipid (fat) | g | 1.0 | API | Code 204; tagname FAT |
| AFCD | ✓ | Fat | Fat | g | 1.0 | CSV | Core nutrients category |
| CoFID | ✓ | Fat | Fat | g | 1.0 | CSV | Sheet 1.3 Proximates |
| CIQUAL | ✓ | 40000 | Fat | g | 1.0 | CSV | INFOODS: FAT |
| FOODfiles | ✓ | FAT | Fat, total | g | 1.0 | CSV | INFOODS: FAT |
| Fineli | ✓ | FAT | Fat | g | 1.0 | CSV | Group TOTALFAT; category MACROCMP |
| BLS | ✓ | FAT | Fat | g | 1.0 | CSV | German: Fett; Proximate composition |
| NEVO | ✓ | FAT | Fat total | g | 1.0 | CSV | Dutch: Vet totaal; Energy and macronutrients |
| Matvaretabellen | ✓ | Fett | Fat | g | 1.0 | API | EuroFIR: FAT; Norwegian: Fett; euroFirName: fat, total |
| FRIDA | ✓ | 141 | Fat | g | 1.0 | CSV | EuroFIR: FAT; Danish: Fedt |
| MEXT | ✓ | col12 | Fat | g | 1.0 | CSV | Japanese: 脂質; col10 = fat as triacylglycerol equiv |
| KFCT | ✓ | FAT | Fat | g | 1.0 | CSV | Korean: 지질; tagname FAT |
| INDB | ✓ | fat_g | Fat | g | 1.0 | CSV | Column: fat_g |
| ASEANFOODS | ✓ | FAT | Fat | g | 1.0 | CSV | INFOODS tagname: FAT |
| FooDB | ✓ | 1/FDBN00001 | Fat | g | 1.0 | CSV | Nutrient.csv id 1; public_id 10930 |
| Phenol-Explorer | N/A | - | - | - | - | - | Polyphenols only |
| Duke's | ✓ | FAT | Fat | - | - | CSV | CHEMICALS.csv line 8416 |

---

# SATURATED FATTY ACIDS (12)

### Saturated Fat (Total)
**Canonical unit:** g
**DV:** <20g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 606 | Fatty acids, total saturated | g | 1.0 | API | FDC nutrient ID 1258; SR Legacy 606 |
| CNF | ✓ | 606 | Fatty acids, total saturated | g | 1.0 | API | Code 606; tagname FASAT |
| AFCD | ✓ | Total saturated fatty acids | Total saturated fatty acids | g | 1.0 | CSV | Core nutrients; unit also %T |
| CoFID | ✓ | Satd FA /100g fd | Satd FA /100g fd | g | 1.0 | CSV | Sheet 1.3 Proximates; also /100g FA variant |
| CIQUAL | ✓ | 40302 | FA saturated | g | 1.0 | CSV | INFOODS: FASAT |
| FOODfiles | ✓ | FASAT | Fatty acids, total saturated | g | 1.0 | CSV | INFOODS: FASAT; also FASATF (/100g TFA) |
| Fineli | ✓ | FASAT | Fatty acids, total saturated | g | 1.0 | CSV | Group FATACID; category FAT |
| BLS | ✓ | FASAT | Fatty acids, saturated, total | g | 1.0 | CSV | German: Fettsäuren, gesättigt, gesamt; Fatty acids group |
| NEVO | ✓ | FASAT | Fatty acids saturated total | g | 1.0 | CSV | Dutch: Vetzuren verzadigd totaal; Fatty acid clusters |
| Matvaretabellen | ✓ | Mettet | Saturated fatty acids | g | 1.0 | API | EuroFIR: FASAT; Norwegian: Mettet; parentId: Fett |
| FRIDA | ✓ | 248 | Sum saturated fatty acids | g | 1.0 | CSV | EuroFIR: FASAT; Danish: Sum mættede fedtsyrer |
| MEXT | ✗ | - | - | - | - | CSV | Not in main nutrient list; fatty acids in separate tables |
| KFCT | ✗ | - | - | - | - | CSV | No fatty acid breakdown in nutrient list |
| INDB | ✓ | sfa_mg | Sfa | mg | 0.001 | CSV | Column: sfa_mg; unit mg (convert to g) |
| ASEANFOODS | ✗ | - | - | - | - | CSV | Only has FAT (total); no fatty acid breakdown |
| FooDB | ✗ | - | - | - | - | CSV | Only "Fatty acids" total (id 4); no saturated subtotal |
| Phenol-Explorer | N/A | - | - | - | - | - | Polyphenols only |
| Duke's | ✓ | SATURATED-FATTY-ACIDS | Saturated Fatty Acids | - | - | CSV | CHEMICALS.csv line 23642 |

---

### Butyric Acid (C4:0)
**Canonical unit:** g
**Notes:** Short-chain (SCFA)
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 607 | Fatty acid 4:0 (Butyric acid) | g | 1.0 | API | FDC nutrient ID 1259; SR Legacy 607 |
| CNF | ✓ | 607 | 4:0 (Butyric acid) | g | 1.0 | API | Code 607; shares USDA SR codes |
| AFCD | ✓ | C4FD | C4:0 | g | 1.0 | CSV | INFOODS: F4D0; EuroFIR: F4:0; Fatty acids category |
| CoFID | ✓ | C4:0 /100g food | C4:0 /100g food | g | 1.0 | CSV | Sheet 1.8 (SFA per 100gFood); also /100gFA variant |
| CIQUAL | ✓ | 40400 | FA 4:0 | g | 1.0 | CSV | INFOODS: F4D0 |
| FOODfiles | ✓ | F4D0 | Fatty acid 4:0 | g | 1.0 | CSV | Also F4D0F (/100g TFA) |
| Fineli | ✗ | - | - | - | - | CSV | Only has select FA (16:0, 18:1/2/3, 20:4/5, 22:6); no C4:0 |
| BLS | ✓ | F4:0 | Fatty acid C4:0 (butyric acid) | g | 1.0 | CSV | German: Buttersäure; Fatty acids group |
| NEVO | ✓ | F4:0 | C4:0 | g | 1.0 | CSV | Verzadigde vetzuren (Saturated fatty acids) group |
| Matvaretabellen | ✗ | - | - | - | - | API | Only has C12:0, C14:0, C16:0, C18:0; no short-chain FA |
| FRIDA | ✓ | 103 | C4:0 | g | 1.0 | CSV | EuroFIR: F4:0 |
| MEXT | ✗ | - | - | - | - | CSV | No individual fatty acids in main nutrient list |
| KFCT | ✗ | - | - | - | - | CSV | No fatty acid entries in nutrient list |
| INDB | ✗ | - | - | - | - | CSV | No individual fatty acids |
| ASEANFOODS | ✗ | - | - | - | - | CSV | No individual fatty acids |
| FooDB | ✓ | 31194/FDB031031 | n-butanoate | g | 1.0 | CSV | Compound.csv; CAS 107-92-6; butyric acid |
| Phenol-Explorer | N/A | - | - | - | - | - | Polyphenols only |
| Duke's | ✓ | BUTYRIC-ACID | Butyric Acid | - | - | CSV | Also BUTANOIC-ACID, N-BUTYRIC-ACID |

---

### Caproic Acid (C6:0)
**Canonical unit:** g
**Notes:** Short-chain (SCFA)
**Status:** ✅ Complete (11/17 applicable sources)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 608 | Fatty acid 6:0 (Caproic acid) | g | 1.0 | API | FDC nutrient ID 1260; SR Legacy 608 |
| CNF | ✓ | 608 | 6:0 (Caproic acid) | g | 1.0 | API | Code 608; shares USDA SR codes |
| AFCD | ✓ | C6FD | C6:0 | g | 1.0 | CSV | INFOODS: F6D0; EuroFIR: F6:0 |
| CoFID | ✓ | C6:0 /100g food | C6:0 /100g food | g | 1.0 | CSV | Sheet 1.8 (SFA per 100gFood) |
| CIQUAL | ✓ | 40600 | FA 6:0 | g | 1.0 | CSV | INFOODS: F6D0 |
| FOODfiles | ✓ | F6D0 | Fatty acid 6:0 | g | 1.0 | CSV | Also F6D0F (/100g TFA) |
| Fineli | ✗ | — | — | — | — | CSV | Only select FA (16:0, 18:1/2/3, 20:4/5, 22:6); no short-chain FA |
| BLS | ✓ | F6:0 | Fatty acid C6:0 (Capronsäure) | g | 1.0 | CSV | German: Capronsäure; group: Fatty acids |
| NEVO | ✓ | F6:0 | C6:0 | g | 1.0 | CSV | Dutch group: Verzadigde vetzuren |
| Matvaretabellen | ✗ | — | — | — | — | API | Only C12:0, C14:0, C16:0, C18:0 individual SFA |
| FRIDA | ✓ | 104 | C6:0 | g/100g | 1.0 | CSV | EuroFIR: F6:0 |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA in main nutrient list |
| KFCT | ✗ | — | — | — | — | CSV | No FA entries in nutrient list |
| INDB | ✗ | — | — | — | — | CSV | Only total SFA/MUFA/PUFA; no individual FA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT; no FA breakdown |
| FooDB | ✓ | 13900/FDB013897 | Hexanoic acid | g | 1.0 | API | CAS 142-62-1; aka caproic acid; Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | CAPROIC-ACID | Caproic acid | — | — | Web | Also HEXANOIC-ACID, N-CAPROIC-ACID |

---

### Caprylic Acid (C8:0)
**Canonical unit:** g
**Notes:** Medium-chain (MCFA)
**Status:** ✅ Complete (11/17 applicable sources)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 609 | Fatty acid 8:0 (Caprylic acid) | g | 1.0 | API | FDC nutrient ID 1261; SR Legacy 609 |
| CNF | ✓ | 609 | 8:0 (Caprylic acid) | g | 1.0 | API | Code 609; shares USDA SR codes |
| AFCD | ✓ | C8FD | C8:0 | g | 1.0 | CSV | INFOODS: F8D0; EuroFIR: F8:0 |
| CoFID | ✓ | C8:0 /100g food | C8:0 /100g food | g | 1.0 | CSV | Sheet 1.8 (SFA per 100gFood) |
| CIQUAL | ✓ | 40800 | FA 8:0 | g | 1.0 | CSV | INFOODS: F8D0 |
| FOODfiles | ✓ | F8D0 | Fatty acid 8:0 | g | 1.0 | CSV | Also F8D0F (/100g TFA) |
| Fineli | ✗ | — | — | — | — | CSV | Only select FA (16:0, 18:1/2/3, 20:4/5, 22:6); no MCFA |
| BLS | ✓ | F8:0 | Fatty acid C8:0 (Caprylsäure) | g | 1.0 | CSV | German: Caprylsäure; group: Fatty acids |
| NEVO | ✓ | F8:0 | C8:0 | g | 1.0 | CSV | Dutch group: Verzadigde vetzuren |
| Matvaretabellen | ✗ | — | — | — | — | API | Only C12:0, C14:0, C16:0, C18:0 individual SFA |
| FRIDA | ✓ | 105 | C8:0 | g/100g | 1.0 | CSV | EuroFIR: F8:0 |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA in main nutrient list |
| KFCT | ✗ | — | — | — | — | CSV | No FA entries in nutrient list |
| INDB | ✗ | — | — | — | — | CSV | Only total SFA/MUFA/PUFA; no individual FA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT; no FA breakdown |
| FooDB | ✓ | 3337/FDB003336 | Octanoic acid | g | 1.0 | API | CAS 124-07-2; aka caprylic acid; Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | CAPRYLIC-ACID | Caprylic acid | — | — | Web | Also OCTANOIC-ACID, N-CAPRYLIC-ACID |

---

### Capric Acid (C10:0)
**Canonical unit:** g
**Notes:** Medium-chain (MCFA)
**Status:** ✅ Complete (11/17 applicable sources)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 610 | Fatty acid 10:0 (Capric acid) | g | 1.0 | API | FDC nutrient ID 1262; SR Legacy 610 |
| CNF | ✓ | 610 | 10:0 (Capric acid) | g | 1.0 | API | Code 610; shares USDA SR codes |
| AFCD | ✓ | C10FD | C10:0 | g | 1.0 | CSV | INFOODS: F10D0; EuroFIR: F10:0 |
| CoFID | ✓ | C10:0 /100g food | C10:0 /100g food | g | 1.0 | CSV | Sheet 1.8 (SFA per 100gFood) |
| CIQUAL | ✓ | 41000 | FA 10:0 | g | 1.0 | CSV | INFOODS: F10D0 |
| FOODfiles | ✓ | F10D0 | Fatty acid 10:0 | g | 1.0 | CSV | Also F10D0F (/100g TFA) |
| Fineli | ✗ | — | — | — | — | CSV | Only select FA (16:0, 18:1/2/3, 20:4/5, 22:6); no MCFA |
| BLS | ✓ | F10:0 | Fatty acid C10:0 (Caprinsäure) | g | 1.0 | CSV | German: Caprinsäure; group: Fatty acids |
| NEVO | ✓ | F10:0 | C10:0 | g | 1.0 | CSV | Dutch group: Verzadigde vetzuren |
| Matvaretabellen | ✗ | — | — | — | — | API | Only C12:0, C14:0, C16:0, C18:0 individual SFA |
| FRIDA | ✓ | 48 | C10:0 | g/100g | 1.0 | CSV | EuroFIR: F10:0 |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA in main nutrient list |
| KFCT | ✗ | — | — | — | — | CSV | No FA entries in nutrient list |
| INDB | ✗ | — | — | — | — | CSV | Only total SFA/MUFA/PUFA; no individual FA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT; no FA breakdown |
| FooDB | ✓ | 12030/FDB012027 | Decanoic acid | g | 1.0 | API | CAS 334-48-5; aka capric acid; Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | CAPRIC-ACID | Capric acid | — | — | Web | Also DECANOIC-ACID, N-CAPRIC-ACID |

---

### Lauric Acid (C12:0)
**Canonical unit:** g
**Notes:** Medium-chain (MCFA)
**Status:** ✅ Complete (12/17 applicable sources)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 611 | Fatty acid 12:0 (Lauric acid) | g | 1.0 | API | FDC nutrient ID 1263; SR Legacy 611 |
| CNF | ✓ | 611 | 12:0 (Lauric acid) | g | 1.0 | API | Code 611; shares USDA SR codes |
| AFCD | ✓ | C12FD | C12:0 | g | 1.0 | CSV | INFOODS: F12D0; EuroFIR: F12:0 |
| CoFID | ✓ | C12:0 /100g food | C12:0 /100g food | g | 1.0 | CSV | Sheet 1.8 (SFA per 100gFood) |
| CIQUAL | ✓ | 41200 | FA 12:0 | g | 1.0 | CSV | INFOODS: F12D0 |
| FOODfiles | ✓ | F12D0 | Fatty acid 12:0 | g | 1.0 | CSV | Also F12D0F (/100g TFA) |
| Fineli | ✗ | — | — | — | — | CSV | Only select FA (16:0, 18:1/2/3, 20:4/5, 22:6) |
| BLS | ✓ | F12:0 | Fatty acid C12:0 (Laurinsäure) | g | 1.0 | CSV | German: Laurinsäure; group: Fatty acids |
| NEVO | ✓ | F12:0 | C12:0 | g | 1.0 | CSV | Dutch group: Verzadigde vetzuren |
| Matvaretabellen | ✓ | C12:0Laurinsyre | C12:0 (lauric acid) | g | 1.0 | API | EuroFIR: F12:0; Norwegian: Laurinsyre |
| FRIDA | ✓ | 49 | C12:0 | g/100g | 1.0 | CSV | EuroFIR: F12:0 |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA in main nutrient list |
| KFCT | ✗ | — | — | — | — | CSV | No FA entries in nutrient list |
| INDB | ✗ | — | — | — | — | CSV | Only total SFA/MUFA/PUFA; no individual FA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT; no FA breakdown |
| FooDB | ✓ | 3011/FDB003010 | Dodecanoic acid | g | 1.0 | API | CAS 143-07-7; aka lauric acid; Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | LAURIC-ACID | Lauric acid | — | — | Web | Also DODECANOIC-ACID |

---

### Myristic Acid (C14:0)
**Canonical unit:** g
**Notes:** Long-chain (LCFA)
**Status:** ✅ Complete (12/17 applicable sources)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 612 | Fatty acid 14:0 (Myristic acid) | g | 1.0 | API | FDC nutrient ID 1264; SR Legacy 612 |
| CNF | ✓ | 612 | 14:0 (Myristic acid) | g | 1.0 | API | Code 612; shares USDA SR codes |
| AFCD | ✓ | C14FD | C14:0 | g | 1.0 | CSV | INFOODS: F14D0; EuroFIR: F14:0 |
| CoFID | ✓ | C14:0 /100g food | C14:0 /100g food | g | 1.0 | CSV | Sheet 1.8 (SFA per 100gFood) |
| CIQUAL | ✓ | 41400 | FA 14:0 | g | 1.0 | CSV | INFOODS: F14D0 |
| FOODfiles | ✓ | F14D0 | Fatty acid 14:0 | g | 1.0 | CSV | Also F14D0F (/100g TFA) |
| Fineli | ✗ | — | — | — | — | CSV | Only select FA (16:0, 18:1/2/3, 20:4/5, 22:6) |
| BLS | ✓ | F14:0 | Fatty acid C14:0 (Myristinsäure) | g | 1.0 | CSV | German: Myristinsäure; group: Fatty acids |
| NEVO | ✓ | F14:0 | C14:0 | g | 1.0 | CSV | Dutch group: Verzadigde vetzuren |
| Matvaretabellen | ✓ | C14:0Myristinsyre | C14:0 (myristic acid) | g | 1.0 | API | EuroFIR: F14:0; Norwegian: Myristinsyre |
| FRIDA | ✓ | 51 | C14:0 | g/100g | 1.0 | CSV | EuroFIR: F14:0 |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA in main nutrient list |
| KFCT | ✗ | — | — | — | — | CSV | No FA entries in nutrient list |
| INDB | ✗ | — | — | — | — | CSV | Only total SFA/MUFA/PUFA; no individual FA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT; no FA breakdown |
| FooDB | ✓ | 31172/FDB031009 | Myristate | g | 1.0 | API | CAS 544-63-8; aka tetradecanoic acid; Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | MYRISTIC-ACID | Myristic acid | — | — | Web | Also TETRADECANOIC-ACID |

---

### Palmitic Acid (C16:0)
**Canonical unit:** g
**Notes:** Long-chain (LCFA)
**Status:** ✅ Complete (13/17 applicable sources)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 613 | Fatty acid 16:0 (Palmitic acid) | g | 1.0 | API | FDC nutrient ID 1265; SR Legacy 613 |
| CNF | ✓ | 613 | 16:0 (Palmitic acid) | g | 1.0 | API | Code 613; shares USDA SR codes |
| AFCD | ✓ | C16FD | C16:0 | g | 1.0 | CSV | INFOODS: F16D0; EuroFIR: F16:0 |
| CoFID | ✓ | C16:0 /100g food | C16:0 /100g food | g | 1.0 | CSV | Sheet 1.8 (SFA per 100gFood) |
| CIQUAL | ✓ | 41600 | FA 16:0 | g | 1.0 | CSV | INFOODS: F16D0 |
| FOODfiles | ✓ | F16D0 | Fatty acid 16:0 | g | 1.0 | CSV | Also F16D0F (/100g TFA) |
| Fineli | ✓ | F16D0T | Fatty acid 16:0 | mg | 0.001 | CSV | mg→g conversion; group: FATACID/FAT |
| BLS | ✓ | F16:0 | Fatty acid C16:0 (Palmitinsäure) | g | 1.0 | CSV | German: Palmitinsäure; group: Fatty acids |
| NEVO | ✓ | F16:0 | C16:0 | g | 1.0 | CSV | Dutch group: Verzadigde vetzuren |
| Matvaretabellen | ✓ | C16:0Palmitinsyre | C16:0 (palmitic acid) | g | 1.0 | API | EuroFIR: F16:0; Norwegian: Palmitinsyre |
| FRIDA | ✓ | 58 | C16:0 | g/100g | 1.0 | CSV | EuroFIR: F16:0 |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA in main nutrient list |
| KFCT | ✗ | — | — | — | — | CSV | No FA entries in nutrient list |
| INDB | ✗ | — | — | — | — | CSV | Only total SFA/MUFA/PUFA; no individual FA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT; no FA breakdown |
| FooDB | ✓ | 31247/FDB031084 | Palmitate | g | 1.0 | API | CAS 57-10-3; aka hexadecanoic acid; Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | PALMITIC-ACID | Palmitic acid | — | — | Web | Also HEXADECANOIC-ACID |

---

### Stearic Acid (C18:0)
**Canonical unit:** g
**Notes:** Long-chain (LCFA)
**Status:** ✅ Complete (12/17 applicable sources)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 614 | Fatty acid 18:0 (Stearic acid) | g | 1.0 | API | FDC nutrient ID 1266; SR Legacy 614 |
| CNF | ✓ | 614 | 18:0 (Stearic acid) | g | 1.0 | API | Code 614; shares USDA SR codes |
| AFCD | ✓ | C18FD | C18:0 | g | 1.0 | CSV | INFOODS: F18D0; EuroFIR: F18:0 |
| CoFID | ✓ | C18:0 /100g food | C18:0 /100g food | g | 1.0 | CSV | Sheet 1.8 (SFA per 100gFood) |
| CIQUAL | ✓ | 41800 | FA 18:0 | g | 1.0 | CSV | INFOODS: F18D0 |
| FOODfiles | ✓ | F18D0 | Fatty acid 18:0 | g | 1.0 | CSV | Also F18D0F (/100g TFA) |
| Fineli | ✗ | — | — | — | — | CSV | Only select FA (16:0, 18:1/2/3, 20:4/5, 22:6) |
| BLS | ✓ | F18:0 | Fatty acid C18:0 (Stearinsäure) | g | 1.0 | CSV | German: Stearinsäure; group: Fatty acids |
| NEVO | ✓ | F18:0 | C18:0 | g | 1.0 | CSV | Dutch group: Verzadigde vetzuren |
| Matvaretabellen | ✓ | C18:0Stearinsyre | C18:0 (stearic acid) | g | 1.0 | API | EuroFIR: F18:0; Norwegian: Stearinsyre |
| FRIDA | ✓ | 65 | C18:0 | g/100g | 1.0 | CSV | EuroFIR: F18:0 |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA in main nutrient list |
| KFCT | ✗ | — | — | — | — | CSV | No FA entries in nutrient list |
| INDB | ✗ | — | — | — | — | CSV | Only total SFA/MUFA/PUFA; no individual FA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT; no FA breakdown |
| FooDB | ✓ | 31346/FDB031183 | Stearate | g | 1.0 | API | CAS 57-11-4; aka octadecanoic acid; Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | STEARIC-ACID | Stearic acid | — | — | Web | Also OCTADECANOIC-ACID |

---

### Arachidic Acid (C20:0)
**Canonical unit:** g
**Notes:** Long-chain (LCFA)
**Status:** ✅ Complete (10/17 applicable sources)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 615 | Fatty acid 20:0 (Arachidic acid) | g | 1.0 | API | FDC nutrient ID 1267; SR Legacy 615 |
| CNF | ✓ | 615 | 20:0 (Arachidic acid) | g | 1.0 | API | Code 615; shares USDA SR codes |
| AFCD | ✓ | C20FD | C20:0 | g | 1.0 | CSV | INFOODS: F20D0; EuroFIR: F20:0 |
| CoFID | ✓ | C20:0 /100g food | C20:0 /100g food | g | 1.0 | CSV | Sheet 1.8 (SFA per 100gFood) |
| CIQUAL | ✗ | — | — | — | — | CSV | Not in CIQUAL; jumps from C18:0 (41800) to C20:4 (42046) |
| FOODfiles | ✓ | F20D0 | Fatty acid 20:0 | g | 1.0 | CSV | Also F20D0F (/100g TFA) |
| Fineli | ✗ | — | — | — | — | CSV | Not in Fineli; only has select FA (16:0, 18:1–3, 20:4–5, 22:6) |
| BLS | ✓ | F20:0 | Arachinsäure / Fatty acid C20:0 (arachidic acid) | g | 1.0 | CSV | EuroFIR code F20:0 |
| NEVO | ✓ | F20:0 | C20:0 | g | 1.0 | CSV | Group: Verzadigde vetzuren (Saturated FA) |
| Matvaretabellen | ✗ | — | — | — | — | API | Has C20:3–5 but not C20:0 |
| FRIDA | ✓ | 77 | C20:0 | g/100g | 1.0 | CSV | EuroFIR: F20:0 |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA in MEXT |
| KFCT | ✗ | — | — | — | — | CSV | No FA entries in KFCT |
| INDB | ✗ | — | — | — | — | CSV | Only total SFA/MUFA/PUFA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT |
| FooDB | ✓ | 4029 / FDB004028 | Eicosanic acid | — | — | API | CAS 506-30-9; FooDB spells "eicosanic" |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | ARACHIDIC-ACID | Arachidic acid | — | — | Web | Also EICOSANOIC-ACID |

---

### Behenic Acid (C22:0)
**Canonical unit:** g
**Notes:** Long-chain (LCFA)
**Status:** ✅ Complete (10/17 applicable sources)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 624 | Fatty acid 22:0 (Behenic acid) | g | 1.0 | API | FDC nutrient ID 1276; SR Legacy 624 |
| CNF | ✓ | 624 | 22:0 (Behenic acid) | g | 1.0 | API | Code 624; shares USDA SR codes |
| AFCD | ✓ | C22FD | C22:0 | g | 1.0 | CSV | INFOODS: F22D0; EuroFIR: F22:0 |
| CoFID | ✓ | C22:0 /100g food | C22:0 /100g food | g | 1.0 | CSV | Sheet 1.8 (SFA per 100gFood) |
| CIQUAL | ✗ | — | — | — | — | CSV | Not in CIQUAL; no individual SFA beyond C18:0 |
| FOODfiles | ✓ | F22D0 | Fatty acid 22:0 | g | 1.0 | CSV | Also F22D0F (/100g TFA) |
| Fineli | ✗ | — | — | — | — | CSV | Not in Fineli; only select FA |
| BLS | ✓ | F22:0 | Behensäure / Fatty acid C22:0 (behenic acid) | g | 1.0 | CSV | EuroFIR code F22:0 |
| NEVO | ✓ | F22:0 | C22:0 | g | 1.0 | CSV | Group: Verzadigde vetzuren (Saturated FA) |
| Matvaretabellen | ✗ | — | — | — | — | API | No SFA beyond C18:0 |
| FRIDA | ✓ | 89 | C22:0 | g/100g | 1.0 | CSV | EuroFIR: F22:0 |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA in MEXT |
| KFCT | ✗ | — | — | — | — | CSV | No FA entries in KFCT |
| INDB | ✗ | — | — | — | — | CSV | Only total SFA/MUFA/PUFA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT |
| FooDB | ✓ | 5831 / FDB005830 | Behnic acid | — | — | API | FooDB typo "Behnic"; also 30850 "behenate" |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | BEHENIC-ACID | Behenic acid | — | — | Web | Also DOCOSANOIC-ACID |

---

### Lignoceric Acid (C24:0)
**Canonical unit:** g
**Notes:** Long-chain (LCFA)
**Status:** ✅ Complete (10/17 applicable sources)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 654 | Fatty acid 24:0 (Lignoceric acid) | g | 1.0 | API | SR Legacy 654 |
| CNF | ✓ | 654 | 24:0 (Lignoceric acid) | g | 1.0 | API | Code 654; shares USDA SR codes |
| AFCD | ✓ | C24FD | C24:0 | g | 1.0 | CSV | INFOODS: F24D0; EuroFIR: F24:0 |
| CoFID | ✓ | C24:0 /100g food | C24:0 /100g food | g | 1.0 | CSV | Sheet 1.8 (SFA per 100gFood) |
| CIQUAL | ✗ | — | — | — | — | CSV | Not in CIQUAL; no individual SFA beyond C18:0 |
| FOODfiles | ✓ | F24D0 | Fatty acid 24:0 | g | 1.0 | CSV | Also F24D0F (/100g TFA) |
| Fineli | ✗ | — | — | — | — | CSV | Not in Fineli; only select FA |
| BLS | ✓ | F24:0 | Lignocerinsäure / Fatty acid C24:0 (lignoceric acid) | g | 1.0 | CSV | EuroFIR code F24:0 |
| NEVO | ✓ | F24:0 | C24:0 | g | 1.0 | CSV | Group: Verzadigde vetzuren (Saturated FA) |
| Matvaretabellen | ✗ | — | — | — | — | API | No SFA beyond C18:0 |
| FRIDA | ✓ | 100 | C24:0 | g/100g | 1.0 | CSV | EuroFIR: F24:0 |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA in MEXT |
| KFCT | ✗ | — | — | — | — | CSV | No FA entries in KFCT |
| INDB | ✗ | — | — | — | — | CSV | Only total SFA/MUFA/PUFA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT |
| FooDB | ✓ | 4652 / FDB004651 | Carnaubic acid | — | — | CSV | = Lignoceric/tetracosanoic acid; CAS 557-59-5 |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | LIGNOCERIC-ACID | Lignoceric acid | — | — | CSV | Also TETRACOSANOIC-ACID |

---

# TRANS FATS (3)

### Trans Fat (Total)
**Canonical unit:** g
**Notes:** Goal: 0
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 605 | Fatty acids, total trans | g | 1.0 | API | SR Legacy 605 |
| CNF | ✓ | 605 | Fatty acids, total trans | g | 1.0 | API | Code 605; tagname FATRN |
| AFCD | ✓ | Total trans fatty acids | Total trans fatty acids | %T; mg | varies | CSV | Core nutrients; unit varies |
| CoFID | ✓ | Trans FAs /100g food | Trans FAs /100g food | g | 1.0 | CSV | Sheet 1.3 Proximates |
| CIQUAL | ✗ | — | — | — | — | CSV | Not in CIQUAL nutrient list |
| FOODfiles | ✓ | FATRN | Fatty acids, total trans | g | 1.0 | CSV | INFOODS: FATRN |
| Fineli | ✓ | FATRN | Trans fatty acids | g | 1.0 | CSV | Group FATACID; category FAT |
| BLS | ✗ | — | — | — | — | CSV | No total trans FA; only individual CLA |
| NEVO | ✓ | FATRS | Fatty acids trans total | g | 1.0 | CSV | Dutch: Vetzuren trans totaal |
| Matvaretabellen | ✓ | Trans | Trans fatty acids | g | 1.0 | API | EuroFIR: FATRS |
| FRIDA | ✓ | 261 | Sum trans fatty acids | g/100g | 1.0 | CSV | EuroFIR: FATRS |
| MEXT | ✗ | — | — | — | — | CSV | Not in MEXT nutrient list |
| KFCT | ✗ | — | — | — | — | CSV | Not in KFCT nutrient list |
| INDB | ✗ | — | — | — | — | CSV | Not in INDB nutrient list |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in ASEANFOODS nutrient list |
| FooDB | ✗ | — | — | — | — | CSV | No aggregate trans fat total; only individual trans FAs in Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | No total trans fat; only individual trans compounds |

---

### CLA (Conjugated Linoleic Acid)
**Canonical unit:** g
**Notes:** Natural trans fat (ruminant)
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 670 | 18:2 CLAs | g | 1.0 | API | SR Legacy 670; conjugated linoleic acids |
| CNF | ✓ | 670 | 18:2 CLAs | g | 1.0 | API | Code 670; derived from USDA SR |
| AFCD | ✗ | — | — | — | — | CSV | Has C18:2w6 but no CLA-specific entry |
| CoFID | ✗ | — | — | — | — | CSV | Has C18:2 total but no CLA-specific entry |
| CIQUAL | ✗ | — | — | — | — | CSV | Only FA 18:2 9c,12c (n-6); no CLA |
| FOODfiles | ✓ | F18D2CN9TN11 | Fatty acid cis, trans 18:2 omega-9, 11 | g | 1.0 | CSV | CLA c9,t11 isomer |
| Fineli | ✗ | — | — | — | — | CSV | Only F18D2CN6 (linoleic); no CLA |
| BLS | ✓ | F18:2C9T11 | Fatty acid C18:2 conjugated, cis 9,trans 11 | g | 1.0 | CSV | Konjugierte Linolsäure |
| NEVO | ✓ | F18:2CT | C18:2 cis trans | g | 1.0 | CSV | CLA cis-trans isomer |
| Matvaretabellen | ✗ | — | — | — | — | API | No CLA; only C18:2n-6 linoleic |
| FRIDA | ✓ | 72 | C18:2,conjugated | g/100g | 1.0 | CSV | EuroFIR: F18:2CON; Danish: konjugeret |
| MEXT | ✗ | — | — | — | — | CSV | Not in MEXT nutrient list |
| KFCT | ✗ | — | — | — | — | CSV | Not in KFCT nutrient list |
| INDB | ✗ | — | — | — | — | CSV | Not in INDB nutrient list |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in ASEANFOODS nutrient list |
| FooDB | ✓ | 121369 | Rumenic acid | — | — | CSV | FDB093753; c9,t11-CLA isomer |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | CONJUGATED-LINOLEIC-ACID | Conjugated Linoleic Acid | — | — | CSV | Added 14-DEC-07 |

---

### Vaccenic Acid (trans)
**Canonical unit:** g
**Notes:** Natural trans fat (ruminant)
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 859 | 18:1-11 t (18:1t n-7) | g | 1.0 | API | Vaccenic acid; Foundation Foods |
| CNF | ✗ | — | — | — | — | API | Not separately tracked; under total trans-monoenoic |
| AFCD | ✗ | — | — | — | — | CSV | Only undifferentiated C18:1 |
| CoFID | ✗ | — | — | — | — | CSV | Has cis/trans C18:1n-7 combined; not trans-specific |
| CIQUAL | ✗ | — | — | — | — | CSV | Only FA 18:1 n-9 cis (oleic) |
| FOODfiles | ✓ | F18D1TN7 | Fatty acid trans 18:1 omega-7 | g | 1.0 | CSV | Vaccenic acid (trans-11 C18:1) |
| Fineli | ✗ | — | — | — | — | CSV | Only F18D1T (undiff. trans 18:1); not n-7 specific |
| BLS | ✗ | — | — | — | — | CSV | Only cis-vaccenic (F18:1CN7); no trans variant |
| NEVO | ✗ | — | — | — | — | CSV | Only F18:1TRS (total trans 18:1); not n-7 specific |
| Matvaretabellen | ✗ | — | — | — | — | API | Not in Matvaretabellen |
| FRIDA | ✗ | — | — | — | — | CSV | Only C18:1,trans (id 70, total); not n-7 specific |
| MEXT | ✗ | — | — | — | — | CSV | Not in MEXT nutrient list |
| KFCT | ✗ | — | — | — | — | CSV | Not in KFCT nutrient list |
| INDB | ✗ | — | — | — | — | CSV | Not in INDB nutrient list |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in ASEANFOODS nutrient list |
| FooDB | ✓ | 2953 | Vaccenic acid | — | — | CSV | FDB002952; trans-11 C18:1 |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Only CIS-11-VACCENIC-ACID; no trans form |

---

# MONOUNSATURATED FATTY ACIDS (5)

### Monounsaturated Fat (Total)
**Canonical unit:** g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 645 | Fatty acids, total monounsaturated | g | 1.0 | API | SR Legacy 645 |
| CNF | ✓ | 645 | Fatty acids, total monounsaturated | g | 1.0 | API | Code 645; derived from USDA SR |
| AFCD | ✓ | Total monounsaturated fatty acids | Total monounsaturated fatty acids | %T; g | varies | CSV | Core nutrients |
| CoFID | ✓ | Mono FA /100g food | Mono FA /100g food | g | 1.0 | CSV | Sheet 1.3 Proximates |
| CIQUAL | ✓ | 40303 | FA mono | g | 1.0 | CSV | INFOODS: FAMS |
| FOODfiles | ✓ | FAMS | Fatty acids, total monounsaturated | g | 1.0 | CSV | INFOODS: FAMS |
| Fineli | ✓ | FAMCIS | Monounsaturated cis fatty acids | g | 1.0 | CSV | Group FATACID; category FAT |
| BLS | ✓ | FAMS | Fatty acids, monounsaturated, total | g | 1.0 | CSV | INFOODS: FAMS |
| NEVO | ✓ | FAMSCIS | Fatty acids monounsaturated cis total | g | 1.0 | CSV | Dutch: Vetzuren enkelvoudig onverzadigd cis totaal |
| Matvaretabellen | ✓ | Enumet | Monounsaturated fatty acids | g | 1.0 | API | |
| FRIDA | ✓ | 247 | Sum monounsaturated fatty acids | g/100g | 1.0 | CSV | EuroFIR: FAMS |
| MEXT | ✗ | — | — | — | — | CSV | No fatty acid breakdown |
| KFCT | ✗ | — | — | — | — | CSV | Not in KFCT nutrient list |
| INDB | ✓ | mufa_mg | Mufa | mg | 0.001 | CSV | Convert mg to g |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in ASEANFOODS nutrient list |
| FooDB | ✗ | — | — | — | — | CSV | No aggregate MUFA; only individual FA |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | MUFA | MUFA | — | — | CSV | Also MUFAS |

---

### Palmitoleic Acid (C16:1)
**Canonical unit:** g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 626 | 16:1 undifferentiated | g | 1.0 | API | SR Legacy 626; palmitoleic/hexadecenoic |
| CNF | ✓ | 626 | 16:1 undifferentiated | g | 1.0 | API | Code 626; derived from USDA SR |
| AFCD | ✓ | C16:1 | C16:1 | %T | varies | CSV | INFOODS: F16D1F |
| CoFID | ✓ | C16:1 /100g food | C16:1 /100g food | g | 1.0 | CSV | Sheet 1.10 (MUFA per 100gFood) |
| CIQUAL | ✗ | — | — | — | — | CSV | No individual MUFA beyond oleic |
| FOODfiles | ✓ | F16D1 | Fatty acid 16:1 | g | 1.0 | CSV | Palmitoleic acid |
| Fineli | ✗ | — | — | — | — | CSV | Not in Fineli individual FA list |
| BLS | ✓ | F16:1CN7 | Fatty acid C16:1 n-7 cis (palmitoleic acid) | g | 1.0 | CSV | German: Palmitoleinsäure |
| NEVO | ✓ | F16:1CIS | C16:1 cis | g | 1.0 | CSV | Dutch: Enkelvoudig onverzadigde vetzuren |
| Matvaretabellen | ✓ | C16:1 | C16:1 sum (palmitoleic acid) | g | 1.0 | API | |
| FRIDA | ✓ | 59 | C16:1,n-7 | g/100g | 1.0 | CSV | EuroFIR: F16:1CN7 |
| MEXT | ✗ | — | — | — | — | CSV | Not in MEXT nutrient list |
| KFCT | ✗ | — | — | — | — | CSV | Not in KFCT nutrient list |
| INDB | ✗ | — | — | — | — | CSV | Not in INDB nutrient list |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in ASEANFOODS nutrient list |
| FooDB | ✓ | 4037 | Hexadecenoic acid | — | — | CSV | FDB004036; (Z)-9-hexadecenoic acid; CAS 373-49-9 |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | PALMITOLEIC-ACID | Palmitoleic Acid | — | — | CSV | Also CIS-9-PALMITOLEIC-ACID |

---

### Oleic Acid (C18:1 n-9)
**Canonical unit:** g
**Status:** ✅ Complete (12/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 617 | 18:1 undifferentiated | g | 1.0 | API | SR Legacy 617; oleic/octadecenoic |
| CNF | ✓ | 617 | 18:1 undifferentiated | g | 1.0 | API | Code 617; derived from USDA SR |
| AFCD | ✓ | C18:1 | C18:1 | %T | varies | CSV | INFOODS: F18D1F |
| CoFID | ✓ | C18:1 /100g food | C18:1 /100g food | g | 1.0 | CSV | Sheet 1.10 (MUFA per 100gFood) |
| CIQUAL | ✓ | 41819 | FA 18:1 n-9 cis | g | 1.0 | CSV | INFOODS: F18D1CN9 |
| FOODfiles | ✓ | F18D1 | Fatty acid 18:1 | g | 1.0 | CSV | Oleic acid |
| Fineli | ✗ | — | — | — | — | CSV | Only F18D1T (trans); no cis oleic |
| BLS | ✓ | F18:1CN9 | Fatty acid C18:1 n-9 cis (oleic acid) | g | 1.0 | CSV | German: Ölsäure |
| NEVO | ✓ | F18:1CIS | C18:1 cis | g | 1.0 | CSV | Dutch: Enkelvoudig onverzadigde vetzuren |
| Matvaretabellen | ✓ | C18:1 | C18:1 sum (oleic acid) | g | 1.0 | API | |
| FRIDA | ✓ | 67 | C18:1,n-9 | g | 1.0 | CSV | EuroFIR: F18:1CN9 |
| MEXT | ✗ | - | - | - | - | CSV | No individual fatty acids |
| KFCT | ✗ | - | - | - | - | CSV | No individual fatty acids |
| INDB | ✗ | - | - | - | - | CSV | Only total MUFA; no individual FA |
| ASEANFOODS | ✗ | - | - | - | - | CSV | No fatty acid data |
| FooDB | ✓ | 12861 | Oleic acid | g | 1.0 | CSV | FDB012858; in Compound.csv |
| Phenol-Explorer | N/A | - | - | - | - | - | Polyphenols only |
| Duke's | ✓ | OLEIC-ACID | Oleic acid | - | - | CSV | Also CIS-9-OLEIC-ACID |

---

### Vaccenic Acid (C18:1 n-7)
**Canonical unit:** g
**Notes:** cis-Vaccenic (distinct from trans-Vaccenic)
**Status:** ✅ Complete (5/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | - | - | - | - | API | No dedicated ID; included in 617 (18:1 undiff) |
| CNF | ✗ | - | - | - | - | API | No dedicated ID; derived from USDA |
| AFCD | ✗ | - | - | - | - | CSV | Only C18:1 general; no n-7 specific |
| CoFID | ✓ | - | cis/trans C18:1n-7 /100g food | g | 1.0 | CSV | Combined cis+trans; Sheet 1.10 |
| CIQUAL | ✗ | - | - | - | - | CSV | Only 18:1 n-9 cis (oleic); no n-7 |
| FOODfiles | ✓ | F18D1CN7 | Fatty acid cis 18:1 omega-7 | g | 1.0 | CSV | cis-Vaccenic acid |
| Fineli | ✗ | - | - | - | - | CSV | Only F18D1T (trans); no cis n-7 |
| BLS | ✓ | F18:1CN7 | Fatty acid C18:1 n-7 cis (vaccenic acid) | g | 1.0 | CSV | German: Vaccensäure |
| NEVO | ✗ | - | - | - | - | CSV | Only C18:1 cis general; no n-7 specific |
| Matvaretabellen | ✗ | - | - | - | - | API | Only C18:1 sum; no n-7 specific |
| FRIDA | ✓ | 66 | C18:1,n-7 | g | 1.0 | CSV | EuroFIR: F18:1CN7; cis-vaccenic |
| MEXT | ✗ | - | - | - | - | CSV | No individual fatty acids |
| KFCT | ✗ | - | - | - | - | CSV | No individual fatty acids |
| INDB | ✗ | - | - | - | - | CSV | Only total MUFA; no individual FA |
| ASEANFOODS | ✗ | - | - | - | - | CSV | No fatty acid data |
| FooDB | ✗ | - | - | - | - | CSV | Only trans-vaccenic (2953); no cis |
| Phenol-Explorer | N/A | - | - | - | - | - | Polyphenols only |
| Duke's | ✓ | CIS-11-VACCENIC-ACID | Cis-11-vaccenic acid | - | - | CSV | cis-Vaccenic = C18:1 n-7 cis |

---

### Erucic Acid (C22:1)
**Canonical unit:** g
**Status:** ✅ Complete (10/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 630 | 22:1 undifferentiated | g | 1.0 | API | SR Legacy; also 676 (22:1 cis) |
| CNF | ✓ | 630 | 22:1 undifferentiated | g | 1.0 | API | Derived from USDA; also 676 (22:1c) |
| AFCD | ✓ | C22:1FD | C22:1 | g | 1.0 | CSV | INFOODS: F22D1 |
| CoFID | ✓ | - | C22:1 /100g food | g | 1.0 | CSV | Also cis/trans C22:1n-9 (erucic specific) |
| CIQUAL | ✗ | - | - | - | - | CSV | Not in nutrient list |
| FOODfiles | ✓ | F22D1CN9 | Fatty acid cis 22:1 omega-9 | g | 1.0 | CSV | Erucic acid (n-9) |
| Fineli | ✗ | - | - | - | - | CSV | Not in nutrient list |
| BLS | ✓ | F22:1CN9 | Fatty acid C22:1 n-9 cis (erucic acid) | g | 1.0 | CSV | German: Erucasäure |
| NEVO | ✓ | F22:1CIS | C22:1 cis | g | 1.0 | CSV | Also F22:1TRS (trans) |
| Matvaretabellen | ✗ | - | - | - | - | API | Not in nutrient list |
| FRIDA | ✓ | 92 | C22:1,n-9 | g | 1.0 | CSV | EuroFIR: F22:1CN9; erucic acid |
| MEXT | ✗ | - | - | - | - | CSV | No individual fatty acids |
| KFCT | ✗ | - | - | - | - | CSV | No individual fatty acids |
| INDB | ✗ | - | - | - | - | CSV | Only total MUFA; no individual FA |
| ASEANFOODS | ✗ | - | - | - | - | CSV | No fatty acid data |
| FooDB | ✓ | 4288 | Erucic acid | g | 1.0 | CSV | FDB004287; CAS 112-86-7 |
| Phenol-Explorer | N/A | - | - | - | - | - | Polyphenols only |
| Duke's | ✓ | ERUCIC-ACID | Erucic acid | - | - | CSV | Also CIS-13-ERUCIC-ACID |

---

# POLYUNSATURATED FATTY ACIDS - OMEGA-3 (6)

### Omega-3 (Total)
**Canonical unit:** g
**AI:** 1.1-1.6g
**Status:** ✅ Complete (9/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | - | - | - | - | API | No total; sum ALA+EPA+DPA+DHA |
| CNF | ✗ | - | - | - | - | API | No total; derived from USDA |
| AFCD | ✓ | - | Total long chain omega 3 fatty acids | mg | 0.001 | CSV | EPA+DPA+DHA; excludes ALA |
| CoFID | ✓ | - | n-3 poly /100g food | g | 1.0 | CSV | Total omega-3 PUFA |
| CIQUAL | ✗ | - | - | - | - | CSV | No total; has individual n-3 FAs |
| FOODfiles | ✓ | FAPUN3 | Fatty acids, total polyunsaturated omega-3 | g | 1.0 | CSV | |
| Fineli | ✓ | FAPUN3 | PUFA n-3 total | g | 1.0 | CSV | INFOODS: FAPUN3 |
| BLS | ✓ | FAPUN3 | Fatty acids, polyunsaturated, n-3 (omega-3), total | g | 1.0 | CSV | |
| NEVO | ✓ | FAPUN3 | Fatty acids n-3 polyunsaturated cis | g | 1.0 | CSV | |
| Matvaretabellen | ✓ | Omega-3 | Omega-3 | g | 1.0 | API | EuroFIR: FAN3 |
| FRIDA | ✓ | 249 | Sum n-3 fatty acids | g | 1.0 | CSV | Danish: Sum n-3 fedtsyrer |
| MEXT | ✗ | - | - | - | - | CSV | No omega-3 data |
| KFCT | ✗ | - | - | - | - | CSV | No omega-3 data |
| INDB | ✗ | - | - | - | - | CSV | No omega-3 data |
| ASEANFOODS | ✗ | - | - | - | - | CSV | No omega-3 data |
| FooDB | ✗ | - | - | - | - | CSV | No total; has individual n-3 FAs |
| Phenol-Explorer | N/A | - | - | - | - | - | Polyphenols only |
| Duke's | ✓ | OMEGA-3-FATTY-ACIDS | Omega-3 fatty acids | - | - | CSV | Also OMEGA-3'S |

---

### ALA (C18:3 n-3)
**Canonical unit:** g
**Notes:** Alpha-linolenic acid (plant sources)
**Status:** ✅ Complete (13/17 applicable sources)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 619 | 18:3 (Linolenic acid) | g | 1.0 | API | FDC nutrient ID 1270; SR Legacy 619 |
| CNF | ✓ | 851 | 18:3cccn-3, alpha linolenic | g | 1.0 | API | Specific ALA code (vs 619 total 18:3) |
| AFCD | ✓ | Alpha-linolenic acid | Alpha-linolenic acid | %T; g | varies | CSV | Core nutrients |
| CoFID | ✓ | cis n-3 C18:3 /100g food | cis n-3 C18:3 /100g food | g | 1.0 | CSV | Sheet 1.12 (PUFA per 100gFood) |
| CIQUAL | ✓ | 41833 | FA 18:3 c9,c12,c15 (n-3) | g | 1.0 | CSV | INFOODS: F18D3N3 |
| FOODfiles | ✓ | F18D3CN3 | Fatty acid cis,cis,cis 18:3 omega-3 | g | 1.0 | CSV | Also F18D3CN3F (/100g TFA) |
| Fineli | ✓ | F18D3N3 | 18:3 n-3 alpha-linolenic | mg | 0.001 | CSV | Group FATACID; category FAT |
| BLS | ✓ | F18:3CN3 | Alpha-Linolensäure / C18:3 n-3 all-cis | g | 1.0 | CSV | EuroFIR code F18:3CN3 |
| NEVO | ✓ | F18:3CN3 | C18:3 n-3 cis (ALA) | g | 1.0 | CSV | Group: Vetzuren n-3 meerv onverz cis |
| Matvaretabellen | ✓ | F18:3N3 | C18:3n-3 (alpha-linolenic acid) | g | 1.0 | API | EuroFIR: F18:3N3 |
| FRIDA | ✓ | 74 | C18:3,n-3 | g/100g | 1.0 | CSV | EuroFIR: F18:3CN3 |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA in MEXT |
| KFCT | ✗ | — | — | — | — | CSV | No FA entries in KFCT |
| INDB | ✗ | — | — | — | — | CSV | Only total SFA/MUFA/PUFA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT |
| FooDB | ✓ | 12465 / FDB012462 | alpha-Linolenic acid | — | — | CSV | CAS 463-40-1; 18:3 n-3 |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | ALPHA-LINOLENIC-ACID | Alpha-linolenic acid | — | — | CSV | Also LINOLENIC-ACID |

---

### SDA (C18:4 n-3)
**Canonical unit:** g
**Notes:** Stearidonic acid
**Status:** ✅ Complete (11/17 applicable sources)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 627 | 18:4 (stearidonic acid) | g | 1.0 | API | SR Legacy 627; undifferentiated |
| CNF | ✓ | 627 | 18:4 (stearidonic acid) | g | 1.0 | API | Code 627; shares USDA SR codes |
| AFCD | ✓ | C18:4w3 | C18:4w3 | %T | varies | CSV | INFOODS: F18D4N3F |
| CoFID | ✓ | cis n-3 C18:4 /100g food | cis n-3 C18:4 /100g food | g | 1.0 | CSV | Sheet 1.12 (PUFA per 100gFood) |
| CIQUAL | ✗ | — | — | — | — | CSV | No 18:4 in CIQUAL |
| FOODfiles | ✓ | F18D4N3 | Fatty acid 18:4 omega-3 | g | 1.0 | CSV | Also F18D4N3F (/100g TFA) |
| Fineli | ✗ | — | — | — | — | CSV | No 18:4 in Fineli |
| BLS | ✓ | F18:4CN3 | Stearidonsäure / C18:4 n-3 all-cis | g | 1.0 | CSV | EuroFIR code F18:4CN3 |
| NEVO | ✓ | F18:4CN3 | C18:4 n-3 cis | g | 1.0 | CSV | Group: Vetzuren n-3 meerv onverz cis |
| Matvaretabellen | ✗ | — | — | — | — | API | No 18:4 in Matvaretabellen |
| FRIDA | ✓ | 76 | C18:4,n-3 | g/100g | 1.0 | CSV | EuroFIR: F18:4CN3 |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA in MEXT |
| KFCT | ✗ | — | — | — | — | CSV | No FA entries in KFCT |
| INDB | ✗ | — | — | — | — | CSV | Only total SFA/MUFA/PUFA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT |
| FooDB | ✓ | 2943 / FDB002942 | Stearidonic acid | — | — | CSV | CAS 20290-75-9; 18:4 n-3 |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | STEARIDONIC ACID | Stearidonic acid | — | — | CSV | 18:4 n-3 |

---

### EPA (C20:5 n-3)
**Canonical unit:** g
**Notes:** Eicosapentaenoic acid (fish oil)
**Status:** ✅ Complete (13/17 applicable sources)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 629 | 20:5 n-3 (EPA) | g | 1.0 | API | SR Legacy 629; timnodonic acid |
| CNF | ✓ | 629 | 20:5n-3, eicosapentaenoic | g | 1.0 | API | Code 629; shares USDA SR codes |
| AFCD | ✓ | C20:5w3 Eicosapentaenoic | C20:5w3 Eicosapentaenoic | %T; mg | varies | CSV | Core nutrients |
| CoFID | ✓ | cis n-3 C20:5 /100g food | cis n-3 C20:5 /100g food | g | 1.0 | CSV | Sheet 1.12 (PUFA per 100gFood) |
| CIQUAL | ✓ | 42053 | FA 20:5 (n-3) EPA | g | 1.0 | CSV | INFOODS: F20D5N3 |
| FOODfiles | ✓ | F20D5N3 | Fatty acid 20:5 omega-3 | g | 1.0 | CSV | Also F20D5N3F (/100g TFA) |
| Fineli | ✓ | F20D5N3 | 20:5 n-3 eicosapentaenoic | mg | 0.001 | CSV | Group FATACID; category FAT |
| BLS | ✓ | F20:5CN3 | Eicosapentaensäure / C20:5 n-3 all-cis | g | 1.0 | CSV | EuroFIR code F20:5CN3 |
| NEVO | ✓ | F20:5CN3 | C20:5 n-3 cis (EPA) | g | 1.0 | CSV | Group: Vetzuren n-3 meerv onverz cis |
| Matvaretabellen | ✓ | F20:5N3 | C20:5n-3 (eicosapentaenoic acid, EPA) | g | 1.0 | API | EuroFIR: F20:5N3 |
| FRIDA | ✓ | 87 | C20:5,n-3 | g/100g | 1.0 | CSV | EuroFIR: F20:5CN3 |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA in MEXT |
| KFCT | ✗ | — | — | — | — | CSV | No FA entries in KFCT |
| INDB | ✗ | — | — | — | — | CSV | Only total SFA/MUFA/PUFA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT |
| FooDB | ✓ | 3103 / FDB003102 | Eicosapentaenoic acid | — | — | CSV | CAS 10417-94-4; 20:5 n-3 |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | EICOSAPENTAENOIC-ACID | Eicosapentaenoic acid | — | — | CSV | 20:5 n-3 |

---

### DPA (C22:5 n-3)
**Canonical unit:** g
**Notes:** Docosapentaenoic acid
**Status:** ✅ Complete (10/17 applicable sources)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 631 | 22:5 n-3 (DPA) | g | 1.0 | API | SR Legacy 631; clupanodonic acid |
| CNF | ✓ | 631 | 22:5n-3, docosapentaenoic | g | 1.0 | API | Code 631; shares USDA SR codes |
| AFCD | ✓ | C22:5w3 Docosapentaenoic | C22:5w3 Docosapentaenoic | %T; mg | varies | CSV | Core nutrients |
| CoFID | ✓ | cis n-3 C22:5 /100g food | cis n-3 C22:5 /100g food | g | 1.0 | CSV | Sheet 1.12 (PUFA per 100gFood) |
| CIQUAL | ✗ | — | — | — | — | CSV | No 22:5 in CIQUAL |
| FOODfiles | ✓ | F22D5N3 | Fatty acid 22:5 omega-3 | g | 1.0 | CSV | Also F22D5N3F (/100g TFA) |
| Fineli | ✗ | — | — | — | — | CSV | No 22:5 in Fineli |
| BLS | ✓ | F22:5CN3 | Docosapentaensäure / C22:5 n-3 all-cis | g | 1.0 | CSV | EuroFIR code F22:5CN3 |
| NEVO | ✓ | F22:5CN3 | C22:5 n-3 cis (DPA) | g | 1.0 | CSV | Group: Vetzuren n-3 meerv onverz cis |
| Matvaretabellen | ✓ | F22:5N3 | C22:5n-3 (docosapentaenoic acid, DPA) | g | 1.0 | API | EuroFIR: F22:5N3 |
| FRIDA | ✓ | 98 | C22:5,n-3 | g/100g | 1.0 | CSV | EuroFIR: F22:5CN3 |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA in MEXT |
| KFCT | ✗ | — | — | — | — | CSV | No FA entries in KFCT |
| INDB | ✗ | — | — | — | — | CSV | Only total SFA/MUFA/PUFA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT |
| FooDB | ✓ | 21989 / FDB021831 | Docosapentaenoic acid | — | — | CSV | CAS 24880-45-3; 22:5 n-3 |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | No DPA entry |

---

### DHA (C22:6 n-3)
**Canonical unit:** g
**Notes:** Docosahexaenoic acid (fish oil, brain health)
**Status:** ✅ Complete (13/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 621 | 22:6 n-3 (DHA) | g | 1 | API | Docosahexaenoic acid |
| CNF | ✓ | 859 | Fatty acid 22:6 n-3 | g | 1 | API | DHA |
| AFCD | ✓ | F22D6N3 | C22:6w3FD | mg | 0.001 | CSV | Docosahexaenoic acid |
| CoFID | ✓ | — | cis n-3 C22:6 /100g food | g | 1 | CSV | Sheet 1.12 |
| CIQUAL | ✓ | 42263 | FA 22:6 (n-3) DHA | g | 1 | CSV | F22D6N3 |
| FOODfiles | ✓ | F22D6N3 | Fatty acid 22:6 omega-3 | g | 1 | CSV | DHA |
| Fineli | ✓ | F22D6N3 | C22:6 n-3 DHA | mg | 0.001 | CSV | FATACID |
| BLS | ✓ | F22:6CN3 | Docosahexaensäure | g | 1 | CSV | C22:6 n-3 all-cis |
| NEVO | ✓ | F22:6CN3 | C22:6 n-3 cis (DHA) | g | 1 | CSV | Docosahexaenoic acid |
| Matvaretabellen | ✓ | F22:6N3 | C22:6n-3 (DHA) | g | 1 | API | Dokosaheksaensyre |
| FRIDA | ✓ | 99 | C22:6,n-3 | g | 1 | CSV | F22:6CN3 DHA |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA |
| KFCT | ✗ | — | — | — | — | CSV | No individual FA |
| INDB | ✗ | — | — | — | — | CSV | No individual FA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT |
| FooDB | ✓ | FDB003003 | Doconexent | — | — | API | CAS 6217-54-5 |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | DOCOSAHEXAENOICACID | Docosahexaenoic acid | — | — | CSV | DHA |

---

# POLYUNSATURATED FATTY ACIDS - OMEGA-6 (6)

### Omega-6 (Total)
**Canonical unit:** g
**Status:** ✅ Complete (7/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | No total n-6; only individual FA |
| CNF | ✓ | 903 | FAPUN6 | g | 1 | API | Total omega n-6 |
| AFCD | ✗ | — | — | — | — | CSV | Only total PUFA |
| CoFID | ✗ | — | — | — | — | CSV | Only individual n-6 FA |
| CIQUAL | ✗ | — | — | — | — | CSV | Only individual n-6 FA |
| FOODfiles | ✓ | FAPUN6 | Total PUFA omega-6 | g | 1 | CSV | |
| Fineli | ✓ | FAPUN6 | Omega-6 total | g | 1 | CSV | FATACID |
| BLS | ✓ | FAPUN6 | n-6 (Omega-6), total | g | 1 | CSV | |
| NEVO | ✓ | FAPUN6 | Fatty acids n-6 PUFA cis | g | 1 | CSV | |
| Matvaretabellen | ✓ | FAN6 | Omega-6 | g | 1 | API | total n-6 |
| FRIDA | ✓ | 250 | Sum n-6 fatty acids | g | 1 | CSV | |
| MEXT | ✗ | — | — | — | — | CSV | No omega totals |
| KFCT | ✗ | — | — | — | — | CSV | No omega totals |
| INDB | ✗ | — | — | — | — | CSV | No omega totals |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT |
| FooDB | ✗ | — | — | — | — | API | Individual FA only |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | No omega-6 total |

---

### LA (C18:2 n-6)
**Canonical unit:** g
**Notes:** Linoleic acid
**Status:** ✅ Complete (13/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 675 | 18:2 n-6 c,c | g | 1 | API | Linoleic acid |
| CNF | ✓ | 675 | 18:2ccn-6 linoleic | g | 1 | API | |
| AFCD | ✓ | F18D2N6 | C18:2w6FD | g | 1 | CSV | Linoleic acid |
| CoFID | ✓ | — | cis n-6 C18:2 /100g food | g | 1 | CSV | Linoleic acid |
| CIQUAL | ✓ | 41826 | FA 18:2 9c,12c (n-6) | g | 1 | CSV | F18D2CN6 |
| FOODfiles | ✓ | F18D2CN6 | FA cis,cis 18:2 omega-6 | g | 1 | CSV | Linoleic |
| Fineli | ✓ | F18D2CN6 | C18:2 n-6 | mg | 0.001 | CSV | Linoleic |
| BLS | ✓ | F18:2CN6 | Linolsäure | g | 1 | CSV | C18:2 n-6 cis,cis |
| NEVO | ✓ | F18:2CN6 | C18:2 n-6 (linoleic acid) | g | 1 | CSV | linolzuur |
| Matvaretabellen | ✓ | F18:2CN6 | C18:2n-6 (linoleic acid) | g | 1 | API | Linolsyre |
| FRIDA | ✓ | 71 | C18:2,n-6 | g | 1 | CSV | Linoleic acid |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA |
| KFCT | ✗ | — | — | — | — | CSV | No individual FA |
| INDB | ✗ | — | — | — | — | CSV | No individual FA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT |
| FooDB | ✓ | FDB006562 | Linoleic acid | — | — | API | CAS 60-33-3 |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | LINOLEICACID | Linoleic acid | — | — | CSV | |

---

### GLA (C18:3 n-6)
**Canonical unit:** g
**Notes:** Gamma-linolenic acid
**Status:** ✅ Complete (10/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 685 | 18:3 n-6 c,c,c | g | 1 | API | Gamma-linolenic |
| CNF | ✓ | 832 | 18:3 c,c,c n-6 | g | 1 | API | g-Linolenic |
| AFCD | ✓ | F18D3N6 | C18:3w6FD | g | 1 | CSV | Gamma-linolenic |
| CoFID | ✓ | — | cis n-6 C18:3 /100g food | g | 1 | CSV | GLA |
| CIQUAL | ✗ | — | — | — | — | CSV | Only 18:3 n-3 |
| FOODfiles | ✓ | F18D3CN6 | FA cis 18:3 omega-6 | g | 1 | CSV | GLA |
| Fineli | ✗ | — | — | — | — | CSV | Only 18:3 n-3 |
| BLS | ✓ | F18:3CN6 | Gamma-Linolensäure | g | 1 | CSV | C18:3 n-6 |
| NEVO | ✓ | F18:3CN6 | C18:3 n-6 cis | g | 1 | CSV | GLA |
| Matvaretabellen | ✗ | — | — | — | — | API | Only 18:3 n-3 |
| FRIDA | ✓ | 75 | C18:3,n-6 | g | 1 | CSV | GLA |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA |
| KFCT | ✗ | — | — | — | — | CSV | No individual FA |
| INDB | ✗ | — | — | — | — | CSV | No individual FA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT |
| FooDB | ✓ | FDB002906 | g-Linolenic acid | — | — | API | CAS 506-26-3 |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | GAMMALINOLENICACID | Gamma-linolenic acid | — | — | CSV | |

---

### DGLA (C20:3 n-6)
**Canonical unit:** g
**Notes:** Dihomo-gamma-linolenic acid
**Status:** ✅ Complete (11/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 853 | 20:3 n-6 | g | 1 | API | DGLA |
| CNF | ✓ | 853 | 20:3 n-6 | g | 1 | API | DGLA |
| AFCD | ✓ | F20D3N6 | C20:3w6FD | g | 1 | CSV | DGLA |
| CoFID | ✓ | — | cis n-6 C20:3 /100g food | g | 1 | CSV | DGLA |
| CIQUAL | ✗ | — | — | — | — | CSV | No 20:3 n-6 |
| FOODfiles | ✓ | F20D3CN6 | FA cis 20:3 omega-6 | g | 1 | CSV | DGLA |
| Fineli | ✗ | — | — | — | — | CSV | No 20:3 n-6 |
| BLS | ✓ | F20:3CN6 | Dihomogamma-Linolensäure | g | 1 | CSV | C20:3 n-6 |
| NEVO | ✓ | F20:3CN6 | C20:3 n-6 cis | g | 1 | CSV | DGLA |
| Matvaretabellen | ✓ | F20:3N6 | C20:3n-6 (DGLA) | g | 1 | API | |
| FRIDA | ✓ | 85 | C20:3,n-6 | g | 1 | CSV | DGLA |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA |
| KFCT | ✗ | — | — | — | — | CSV | No individual FA |
| INDB | ✗ | — | — | — | — | CSV | No individual FA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT |
| FooDB | ✓ | FDB023082 | 8,11,14-Eicosatrienoic acid | g | 1 | API | DGLA, CAS 1783-84-2 |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | (Z,Z,Z)-8,11,14-EICOSATRIENOIC-ACID | — | — | CSV | DGLA |

---

### AA (C20:4 n-6)
**Canonical unit:** g
**Notes:** Arachidonic acid
**Status:** ✅ Complete (13/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 855 | 20:4 n-6 | g | 1 | API | AA |
| CNF | ✓ | 855 | 20:4 n-6 arachidonic | g | 1 | API | AA |
| AFCD | ✓ | F20D4N6 | C20:4w6FD | g | 1 | CSV | AA |
| CoFID | ✓ | — | cis n-6 C20:4 /100g food | g | 1 | CSV | AA |
| CIQUAL | ✓ | 42046 | FA 20:4 5c,8c,11c,14c (n-6) | g | 1 | CSV | F20D4N6 |
| FOODfiles | ✓ | F20D4CN6 | FA cis 20:4 omega-6 | g | 1 | CSV | AA |
| Fineli | ✓ | F20D4N6 | F20D4N6 | g | 0.001 | CSV | mg→g |
| BLS | ✓ | F20:4CN6 | Arachidonsäure | g | 1 | CSV | C20:4 n-6 |
| NEVO | ✓ | F20:4CN6 | C20:4 n-6 cis | g | 1 | CSV | AA |
| Matvaretabellen | ✓ | F20:4N6 | C20:4n-6 (arachidonic acid) | g | 1 | API | |
| FRIDA | ✓ | 86 | C20:4,n-6 | g | 1 | CSV | AA |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA |
| KFCT | ✗ | — | — | — | — | CSV | No individual FA |
| INDB | ✗ | — | — | — | — | CSV | No individual FA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT |
| FooDB | ✓ | FDB011872 | Arachidonic acid | g | 1 | API | AA |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | ARACHIDONIC-ACID | — | — | CSV | AA |

---

### DTA (C22:4 n-6)
**Canonical unit:** g
**Notes:** Docosatetraenoic acid
**Status:** ✅ Complete (8/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 858 | 22:4 | g | 1 | API | DTA |
| CNF | ✓ | 858 | 22:4 n-6 docosatetraenoic | g | 1 | API | DTA |
| AFCD | ✓ | F22D4N6 | C22:4w6FD | g | 1 | CSV | DTA |
| CoFID | ✓ | — | cis n-6 C22:4 /100g food | g | 1 | CSV | DTA |
| CIQUAL | ✗ | — | — | — | — | CSV | No 22:4 n-6 |
| FOODfiles | ✓ | F22D4N6 | FA 22:4 omega-6 | g | 1 | CSV | DTA |
| Fineli | ✗ | — | — | — | — | CSV | No 22:4 n-6 |
| BLS | ✗ | — | — | — | — | CSV | No 22:4 n-6 |
| NEVO | ✓ | F22:4CN6 | C22:4 n-6 cis | g | 1 | CSV | DTA |
| Matvaretabellen | ✗ | — | — | — | — | API | No 22:4 n-6 |
| FRIDA | ✓ | 411 | C22:4,n-6 | g | 1 | CSV | DTA |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA |
| KFCT | ✗ | — | — | — | — | CSV | No individual FA |
| INDB | ✗ | — | — | — | — | CSV | No individual FA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT |
| FooDB | ✓ | FDB022918 | Adrenic acid | g | 1 | API | DTA, CAS 28874-58-0 |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Not found |

---

# POLYUNSATURATED FATTY ACIDS - OMEGA-9 (1)

### Mead Acid (C20:3 n-9)
**Canonical unit:** g
**Status:** ✅ Complete (2/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | No 20:3 n-9 entry |
| CNF | ✗ | — | — | — | — | API | No 20:3 n-9 entry |
| AFCD | ✗ | — | — | — | — | CSV | No 20:3 n-9 |
| CoFID | ✗ | — | — | — | — | CSV | No 20:3 n-9 |
| CIQUAL | ✗ | — | — | — | — | CSV | No 20:3 n-9 |
| FOODfiles | ✗ | — | — | — | — | CSV | No 20:3 n-9 |
| Fineli | ✗ | — | — | — | — | CSV | No 20:3 n-9 |
| BLS | ✗ | — | — | — | — | CSV | No 20:3 n-9 |
| NEVO | ✓ | F20:3CN9 | C20:3 n-9 cis | g | 1 | CSV | Mead acid |
| Matvaretabellen | ✗ | — | — | — | — | API | No 20:3 n-9 |
| FRIDA | ✗ | — | — | — | — | CSV | No 20:3 n-9 |
| MEXT | ✗ | — | — | — | — | CSV | No individual FA |
| KFCT | ✗ | — | — | — | — | CSV | No individual FA |
| INDB | ✗ | — | — | — | — | CSV | No individual FA |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total FAT |
| FooDB | ✓ | FDB027529 | 5,8,11-Eicosatrienoic acid | g | 1 | API | Mead acid, CAS 20590-32-3 |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Not found |

---

# CHOLESTEROL

### Cholesterol
**Canonical unit:** mg
**Notes:** Was DV: <300mg (removed from label requirements)
**Status:** ✅ Complete (15/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 601 | Cholesterol | mg | 1 | API | FDC ID 1253 |
| CNF | ✓ | 601 | Cholesterol | mg | 1 | API | Based on USDA |
| AFCD | ✓ | — | Cholesterol | mg | 1 | CSV | Core nutrient |
| CoFID | ✓ | — | Cholesterol | mg | 1 | CSV | |
| CIQUAL | ✓ | 75100 | Cholesterol | mg | 1 | CSV | CHOL- |
| FOODfiles | ✓ | CHOLE | Cholesterol | mg | 1 | CSV | |
| Fineli | ✓ | CHOLE | Cholesterol | mg | 1 | CSV | |
| BLS | ✓ | CHORL | Cholesterin | mg | 1 | CSV | |
| NEVO | ✓ | CHORL | Cholesterol | mg | 1 | CSV | |
| Matvaretabellen | ✓ | CHORL | Cholesterol | mg | 1 | API | |
| FRIDA | ✓ | 115 | Kolesterol | mg | 1 | CSV | |
| MEXT | ✓ | col:11 | コレステロール | mg | 1 | CSV | |
| KFCT | ✗ | — | — | — | — | CSV | Not in nutrients.json |
| INDB | ✓ | cholesterol_mg | Cholesterol | mg | 1 | CSV | |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not tracked |
| FooDB | ✓ | FDB013269 | Cholesterol | mg | 1 | API | |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | CHOLESTEROL | — | — | CSV | |

---

## Notes

- **Amino acids** - Most sources provide individual amino acids but coverage varies
- **Fatty acid specificity** - FDC/CNF have detailed fatty acid profiles; smaller databases may only have totals
- **Sugar alcohols** - Primarily found in processed foods; whole food databases may have limited coverage
- **Fiber subtypes** - Beta-glucan, pectin, inulin coverage varies widely by source
