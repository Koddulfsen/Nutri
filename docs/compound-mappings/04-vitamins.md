# Vitamins - Compound Source Mappings

> **Category:** 4 of 9 (Core)
> **Compounds:** 61
> **Status:** 61/61 complete ✅

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

- [ ] Vitamin A + forms (7)
- [ ] Vitamin D + forms (3)
- [ ] Vitamin E + forms (9)
- [ ] Vitamin K + forms (5)
- [ ] Vitamin C + forms (3)
- [ ] Vitamin B1 + forms (4)
- [ ] Vitamin B2 + forms (3)
- [ ] Vitamin B3 + forms (4)
- [ ] Vitamin B5 + forms (4)
- [ ] Vitamin B6 + forms (5)
- [ ] Vitamin B7 (1)
- [ ] Vitamin B9 + forms (5)
- [ ] Vitamin B12 + forms (5)
- [ ] Choline + forms (5)

---

# FAT-SOLUBLE VITAMINS

## VITAMIN A (7)

### Vitamin A (RAE)
**Canonical unit:** μg RAE
**DV:** 900 μg
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1106 | Vitamin A, RAE | μg | 1x | API | SR Legacy: 320 |
| CNF | ✓ | 814 | Retinol activity equivalents, RAE | μg | 1x | API | code: 320 |
| AFCD | ✓ | - | Vitamin A retinol equivalents | μg | 1x | CSV | RE not RAE |
| CoFID | ✓ | - | Retinol Equivalent | μg | 1x | CSV | RE not RAE |
| CIQUAL | ✓ | 51104 | Vitamin A activity, retinol equivalent | μg | 1x | CSV | INFOODS: RAE |
| FOODfiles | ✓ | VITA_RAE | Vitamin A, retinol activity equivalents | μg | 1x | CSV | also VITA (RE) |
| Fineli | ✓ | VITA | Vitamin A | μg | 1x | CSV | EuroFIR; FSVITAM |
| BLS | ✓ | VITAA | Vitamin A, retinol activity equivalents (RAE) | μg | 1x | CSV | also VITA (RE) |
| NEVO | ✓ | VITA_RAE | Retinol activity equivalents (RAE) | μg | 1x | CSV | also VITA_RE |
| Matvaretabellen | ✓ | Vit A | Vitamin A (RAE) | RAE | 1x | API | euroFirId: VITA |
| FRIDA | ✓ | 12 | Vitamin A | RE μg | 1x | CSV | RE not RAE; eurofir: VITA |
| MEXT | ✓ | col:42 | レチノール活性当量 | μg | 1x | CSV | RAE (Retinol Activity Eq) |
| KFCT | ✓ | VITA_RAE | 비타민 A(RAE) / Retinol Activity Equivalent | μg | 1x | CSV | also VITA (RE) |
| INDB | ✓ | vita_ug | Vita | μg | 1x | CSV | type unclear (RAE/RE) |
| ASEANFOODS | ✓ | VITA_RAE | Vitamin A RAE | μg | 1x | CSV | INFOODS tag |
| FooDB | ✗ | - | - | - | - | API | No RAE; has Retinol (FDB013828) |
| Phenol-Explorer | N/A | - | - | - | - | CSV | Polyphenols only |
| Duke's | ✓ | VITAMIN-A | VITAMIN-A | - | - | Web | Phytochemical DB |

---

### Retinol
**Canonical unit:** μg
**Parent:** Vitamin A
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1105 | Retinol | μg | 1x | API | SR Legacy: 319 |
| CNF | ✓ | 319 | Retinol | μg | 1x | API | code: 319 |
| AFCD | ✓ | - | Retinol (preformed vitamin A) | μg | 1x | CSV | |
| CoFID | ✓ | - | Retinol | μg | 1x | CSV | |
| CIQUAL | ✓ | 51200 | Retinol | μg | 1x | CSV | INFOODS: RETOL |
| FOODfiles | ✓ | RETOL | Retinol | μg | 1x | CSV | INFOODS tag |
| Fineli | ✓ | RETOL | Retinol | μg | 1x | CSV | EuroFIR |
| BLS | ✓ | RETOL | Retinol | μg | 1x | CSV | |
| NEVO | ✓ | RETOL | Retinol | μg | 1x | CSV | |
| Matvaretabellen | ✓ | Retinol | Retinol | μg | 1x | API | euroFirId: RETOL |
| FRIDA | ✓ | 225 | Retinol | μg | 1x | CSV | eurofir: RETOLAT |
| MEXT | ✗ | - | - | - | - | CSV | Only RAE, no Retinol |
| KFCT | ✓ | RETOL | 레티놀 / Retinol | μg | 1x | CSV | |
| INDB | ✗ | - | - | - | - | CSV | Only Vita, no Retinol |
| ASEANFOODS | ✓ | RETOL | Retinol | μg | 1x | CSV | INFOODS tag |
| FooDB | ✓ | FDB013828 | Retinol | - | - | API | Compound.csv |
| Phenol-Explorer | N/A | - | - | - | - | CSV | Polyphenols only |
| Duke's | ✗ | - | - | - | - | Web | Has VITAMIN-A, not Retinol |

---

### Retinal
**Canonical unit:** μg
**Parent:** Vitamin A
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | - | - | - | - | API | Not tracked separately |
| CNF | ✗ | - | - | - | - | API | Not tracked separately |
| AFCD | ✗ | - | - | - | - | CSV | not in nutrient list |
| CoFID | ✓ | col | Retinaldehyde | μg | 1.0 | CSV | sheet: 1.6 Vitamin Fractions |
| CIQUAL | ✗ | - | - | - | - | CSV | not in dataset |
| FOODfiles | ✗ | - | - | - | - | CSV | not in dataset |
| Fineli | ✗ | - | - | - | - | CSV | not in dataset |
| BLS | ✗ | - | - | - | - | CSV | not in dataset |
| NEVO | ✗ | - | - | - | - | CSV | not in dataset |
| Matvaretabellen | ✗ | - | - | - | - | API | not in dataset |
| FRIDA | ✗ | - | - | - | - | CSV | not in dataset |
| MEXT | ✗ | - | - | - | - | CSV | not in dataset |
| KFCT | ✗ | - | - | - | - | CSV | not in dataset |
| INDB | ✗ | - | - | - | - | CSV | not in dataset |
| ASEANFOODS | ✗ | - | - | - | - | CSV | not in dataset |
| FooDB | ✓ | FDB022576 | Retinal | - | - | API | CAS: 116-31-4; Compound.csv |
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only |
| Duke's | ✗ | - | - | - | - | Web | Not found |

---

### Retinoic Acid
**Canonical unit:** μg
**Parent:** Vitamin A
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | - | - | - | - | API | not tracked; metabolite formed in body |
| CNF | ✗ | - | - | - | - | API | not tracked; metabolite formed in body |
| AFCD | ✗ | - | - | - | - | CSV | not in dataset |
| CoFID | ✗ | - | - | - | - | CSV | not in dataset |
| CIQUAL | ✗ | - | - | - | - | CSV | not in dataset |
| FOODfiles | ✗ | - | - | - | - | CSV | not in dataset |
| Fineli | ✗ | - | - | - | - | CSV | not in dataset |
| BLS | ✗ | - | - | - | - | CSV | not in dataset |
| NEVO | ✗ | - | - | - | - | CSV | not in dataset |
| Matvaretabellen | ✗ | - | - | - | - | API | not in dataset |
| FRIDA | ✗ | - | - | - | - | CSV | not in dataset |
| MEXT | ✗ | - | - | - | - | CSV | not in dataset |
| KFCT | ✗ | - | - | - | - | CSV | not in dataset |
| INDB | ✗ | - | - | - | - | CSV | not in dataset |
| ASEANFOODS | ✗ | - | - | - | - | CSV | not in dataset |
| FooDB | ✓ | FDB022710 | Retinoic acid | - | - | API | CAS: 302-79-4; Compound.csv |
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only |
| Duke's | ✓ | RETINOIC-ACID | Retinoic Acid | - | - | Web | phytochemicals db |

---

### Beta-Carotene
**Canonical unit:** μg
**Parent:** Vitamin A (provitamin)
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1107 | Carotene, beta | μg | 1.0 | API | canonical; SR Legacy: 321 |
| CNF | ✓ | 321 | Beta-carotene | μg | 1.0 | API | BC-µG |
| AFCD | ✓ | — | Beta-carotene | μg | 1.0 | CSV | no numeric ID; Core nutrients category |
| CoFID | ✓ | — | Beta-carotene | μg | 1.0 | CSV | sheet 1.6 Vitamin Fractions |
| CIQUAL | ✓ | 51330 | Beta-carotene | μg | 1.0 | CSV | INFOODS: CARTB |
| FOODfiles | ✓ | CARTB | Beta-carotene | μg | 1.0 | CSV | INFOODS code as ID |
| Fineli | ✓ | CARTB | Beta-carotene | μg | 1.0 | CSV | INFOODS code; FSVITAM/VITAM |
| BLS | ✓ | CARTB | Beta-carotene | μg | 1.0 | CSV | de: Beta‑Carotin; fat-soluble vitamins |
| NEVO | ✓ | CARTBTOT | Beta-carotene | μg | 1.0 | CSV | nl: Beta-caroteen; Vitamine A group |
| Matvaretabellen | ✓ | B-karo | Beta-carotene | μg | 1.0 | API | EuroFIR: CARTB; no: B-karo |
| FRIDA | ✓ | 303 | beta-Carotene | μg | 1.0 | CSV | dk: beta-Caroten; EuroFIR: CARTBTRANS |
| MEXT | ✗ | — | — | — | — | CSV | not in local nutrients.json; β-カロテン exists in full tables but not extracted |
| KFCT | ✓ | CARTB | β-Carotene | μg | 1.0 | CSV | kr: 베타카로틴 |
| INDB | ✗ | — | — | — | — | CSV | only has total Carotenoids, not beta-carotene |
| ASEANFOODS | ✓ | CARTB | β-Carotene | μg | 1.0 | CSV | INFOODS tagname |
| FooDB | ✓ | FDB014613 | beta-Carotene | — | — | API | CAS 7235-40-7; compound DB |
| Phenol-Explorer | N/A | — | — | — | — | CSV | polyphenols only; carotenoid |
| Duke's | ✓ | BETA-CAROTENE | BETA-CAROTENE | — | — | Web | phytochemical DB |

---

### Alpha-Carotene
**Canonical unit:** μg
**Parent:** Vitamin A (provitamin)
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1108 | Carotene, alpha | μg | 1.0 | API | canonical; SR Legacy: 322 |
| CNF | ✓ | 322 | Carotene, alpha | μg | 1.0 | API | AC-µG; adopts USDA numbering |
| AFCD | ✓ | CARTA | Alpha-carotene | μg | 1.0 | CSV | INFOODS: CARTA; Vitamins category |
| CoFID | ✓ | — | Alpha-carotene | μg | 1.0 | CSV | sheet 1.6 Vitamin Fractions |
| CIQUAL | ✗ | — | — | — | — | CSV | not in nutrient list |
| FOODfiles | ✓ | CARTA | Alpha-carotene | μg | 1.0 | CSV | INFOODS code as ID |
| Fineli | ✗ | — | — | — | — | CSV | not in component list |
| BLS | ✗ | — | — | — | — | CSV | only has "Carotenoids excl. beta-carotene" |
| NEVO | ✓ | CARTA | Alfa-carotene | μg | 1.0 | CSV | nl: Alfa-caroteen; Vitamine A group |
| Matvaretabellen | ✗ | — | — | — | — | API | not in nutrient list |
| FRIDA | ✗ | — | — | — | — | CSV | not in nutrient list |
| MEXT | ✗ | — | — | — | — | CSV | not in local nutrients.json |
| KFCT | ✓ | CARTA | α-Carotene | μg | 1.0 | CSV | kr: 알파카로틴 |
| INDB | ✗ | — | — | — | — | CSV | only has total Carotenoids |
| ASEANFOODS | ✗ | — | — | — | — | CSV | not in nutrient list |
| FooDB | ✓ | FDB013716 | alpha-Carotene | — | — | API | compound DB |
| Phenol-Explorer | N/A | — | — | — | — | CSV | polyphenols only; carotenoid |
| Duke's | ✓ | ALPHA-CAROTENE | ALPHA-CAROTENE | — | — | Web | phytochemical DB |

---

### Beta-Cryptoxanthin
**Canonical unit:** μg
**Parent:** Vitamin A (provitamin)
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1120 | Cryptoxanthin, beta | μg | 1.0 | API | canonical; SR Legacy: 334 |
| CNF | ✓ | 334 | Cryptoxanthin, beta | μg | 1.0 | API | adopts USDA numbering |
| AFCD | ✓ | CRYPX | Cryptoxanthin | μg | 1.0 | CSV | INFOODS: CRYPX; total cryptoxanthin |
| CoFID | ✓ | — | Cryptoxanthins | μg | 1.0 | CSV | sheet 1.6 Vitamin Fractions; total cryptoxanthins |
| CIQUAL | ✗ | — | — | — | — | CSV | not in nutrient list |
| FOODfiles | ✗ | — | — | — | — | CSV | not in nutrient list; has alpha/beta-carotene only |
| Fineli | ✗ | — | — | — | — | CSV | not in component list |
| BLS | ✗ | — | — | — | — | CSV | not in nutrient list |
| NEVO | ✓ | CRYPXB | Beta-cryptoxanthin | μg | 1.0 | CSV | INFOODS: CRYPXB; Vitamin A group |
| Matvaretabellen | ✗ | — | — | — | — | API | not in nutrient list |
| FRIDA | ✗ | — | — | — | — | CSV | not in nutrient list |
| MEXT | ✗ | — | — | — | — | CSV | not in nutrient list; limited carotenoid data |
| KFCT | ✓ | CRYPX | β-Cryptoxanthin | μg | 1.0 | CSV | INFOODS: CRYPX; 베타크립토잔틴 |
| INDB | ✗ | — | — | — | — | CSV | not in nutrient list; only total carotenoids |
| ASEANFOODS | ✗ | — | — | — | — | CSV | not in nutrient list |
| FooDB | ✓ | FDB012019 | beta-Cryptoxanthin | — | 1.0 | API | Compound.csv; also FDB031285 (β-cryptoxanthin) |
| Phenol-Explorer | N/A | — | — | — | — | CSV | polyphenols only |
| Duke's | ✓ | BETACRYPTOXANTHIN | BETA-CRYPTOXANTHIN | — | 1.0 | Web | also CRYPTOXANTHIN (total) |

---

## VITAMIN D (3)

### Vitamin D (Total)
**Canonical unit:** μg
**DV:** 20 μg (800 IU)
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1114 | Vitamin D (D2 + D3) | μg | 1.0 | API | canonical; SR Legacy: 328; = D2 + D3 sum |
| CNF | ✓ | 328 | Vitamin D (D2+D3) | μg | 1.0 | API | adopts USDA numbering |
| AFCD | ✓ | — | Vitamin D3 equivalents | μg | 1.0 | CSV | calculated total; no INFOODS tag |
| CoFID | ✓ | — | Vitamin D | μg | 1.0 | CSV | sheet 1.5 Vitamins |
| CIQUAL | ✓ | 52100 | Vitamin D | μg | 1.0 | CSV | INFOODS: VITD- |
| FOODfiles | ✓ | VITD | Vitamin D; calculated by summation | μg | 1.0 | CSV | INFOODS: VITD |
| Fineli | ✓ | VITD | Vitamin D | μg | 1.0 | CSV | INFOODS: VITD; group FSVITAM |
| BLS | ✓ | VITD | Vitamin D | μg | 1.0 | CSV | INFOODS: VITD; fat-soluble vitamins |
| NEVO | ✓ | VITD | Vitamin D total | μg | 1.0 | CSV | INFOODS: VITD; fat-soluble vitamins group |
| Matvaretabellen | ✓ | Vit D | Vitamin D | μg | 1.0 | API | EuroFIR: VITD |
| FRIDA | ✓ | 126 | Vitamin D | μg | 1.0 | CSV | EuroFIR: VITD; D-vitamin (dk) |
| MEXT | ✓ | col 43 | ビタミンD | μg | 1.0 | CSV | Vitamin D |
| KFCT | ✓ | VITD | Vitamin D (D2+D3) | μg | 1.0 | CSV | INFOODS: VITD; 비타민 D |
| INDB | ✗ | — | — | — | — | CSV | no total; has vitd2_ug + vitd3_ug separately |
| ASEANFOODS | ✗ | — | — | — | — | CSV | not in nutrient list |
| FooDB | ✓ | FDB012732 | Vitamin D3 | — | 1.0 | API | Compound.csv; no total; D2=FDB012811 |
| Phenol-Explorer | N/A | — | — | — | — | CSV | polyphenols only |
| Duke's | ✓ | VITAMIND | VITAMIN-D | — | 1.0 | Web | also VITAMIN-D-2, VITAMIN-D-3 |

---

### Vitamin D2 (Ergocalciferol)
**Canonical unit:** μg
**Parent:** Vitamin D
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1111 | Vitamin D2 (ergocalciferol) | μg | 1.0 | API | canonical; SR Legacy: 325 |
| CNF | ✓ | 325 | Vitamin D2 (ergocalciferol) | μg | 1.0 | API | adopts USDA numbering |
| AFCD | ✓ | — | Ergocalciferol (D2) | μg | 1.0 | CSV | no INFOODS tag |
| CoFID | ✗ | — | — | — | — | CSV | only total Vitamin D available |
| CIQUAL | ✓ | 52200 | Vitamin D2 (ergocalciferol) | μg | 1.0 | CSV | INFOODS: ERGCAL |
| FOODfiles | ✓ | ERGCAL | Ergocalciferol (Vitamin D2) | μg | 1.0 | CSV | INFOODS: ERGCAL |
| Fineli | ✗ | — | — | — | — | CSV | only total VITD available |
| BLS | ✓ | ERGCAL | Vitamin D2 (ergocalciferol) | μg | 1.0 | CSV | INFOODS: ERGCAL |
| NEVO | ✓ | ERGCAL | Ergocalciferol (Vit D2) | μg | 1.0 | CSV | INFOODS: ERGCAL; Vitamin D group |
| Matvaretabellen | ✗ | — | — | — | — | API | only total Vitamin D available |
| FRIDA | ✓ | 127 | Vitamin D2 | μg | 1.0 | CSV | EuroFIR: ERGCAL; D2-vitamin (dk) |
| MEXT | ✗ | — | — | — | — | CSV | only total ビタミンD available |
| KFCT | ✓ | ERGCAL | Ergocalciferol | μg | 1.0 | CSV | INFOODS: ERGCAL; 비타민 D2 |
| INDB | ✓ | vitd2_ug | Vitd2 | μg | 1.0 | CSV | column: vitd2_ug |
| ASEANFOODS | ✗ | — | — | — | — | CSV | not in nutrient list |
| FooDB | ✓ | FDB012811 | Ergocalciferol | — | 1.0 | API | Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | CSV | polyphenols only |
| Duke's | ✓ | VITAMIND2 | VITAMIN-D-2 | — | 1.0 | Web | ergocalciferol |

---

### Vitamin D3 (Cholecalciferol)
**Canonical unit:** μg
**Parent:** Vitamin D
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1112 | Vitamin D3 (cholecalciferol) | μg | 1.0 | API | canonical; SR Legacy: 326 |
| CNF | ✓ | 326 | Vitamin D3 (cholecalciferol) | μg | 1.0 | API | adopts USDA numbering |
| AFCD | ✓ | — | Cholecalciferol (D3) | μg | 1.0 | CSV | no INFOODS tag |
| CoFID | ✓ | — | Cholecalciferol | μg | 1.0 | CSV | sheet 1.6 Vitamin Fractions |
| CIQUAL | ✓ | 52300 | Vitamin D3 (cholecalciferol) | μg | 1.0 | CSV | INFOODS: CHOCAL |
| FOODfiles | ✓ | CHOCAL | Cholecalciferol (Vitamin D3) | μg | 1.0 | CSV | INFOODS: CHOCAL |
| Fineli | ✗ | — | — | — | — | CSV | only total VITD available |
| BLS | ✓ | CHOCAL | Vitamin D3 (cholecalciferol) | μg | 1.0 | CSV | INFOODS: CHOCAL |
| NEVO | ✓ | CHOCAL | Cholecalciferol (Vit D3) | μg | 1.0 | CSV | INFOODS: CHOCAL; Vitamin D group |
| Matvaretabellen | ✗ | — | — | — | — | API | only total Vitamin D available |
| FRIDA | ✓ | 128 | Vitamin D3 | μg | 1.0 | CSV | EuroFIR: CHOCAL; D3-vitamin (dk) |
| MEXT | ✗ | — | — | — | — | CSV | only total ビタミンD available |
| KFCT | ✓ | CHOCAL | Cholecalciferol | μg | 1.0 | CSV | INFOODS: CHOCAL; 비타민 D3 |
| INDB | ✓ | vitd3_ug | Vitd3 | μg | 1.0 | CSV | column: vitd3_ug |
| ASEANFOODS | ✗ | — | — | — | — | CSV | not in nutrient list |
| FooDB | ✓ | FDB012732 | Vitamin D3 | — | 1.0 | API | Compound.csv; cholecalciferol |
| Phenol-Explorer | N/A | — | — | — | — | CSV | polyphenols only |
| Duke's | ✓ | VITAMIND3 | VITAMIN-D-3 | — | 1.0 | Web | cholecalciferol |

---

## VITAMIN E (9)

### Vitamin E (Total)
**Canonical unit:** mg
**DV:** 15 mg
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1109 | Vitamin E (alpha-tocopherol) | mg | — | API | SR:323 |
| CNF | ✓ | 323 | Vitamin E | mg | — | API | alpha-tocopherol |
| AFCD | ✓ | — | Vitamin E | mg | — | CSV | Core nutrients category |
| CoFID | ✓ | — | Vitamin E | mg | — | CSV | sheet 1.5 |
| CIQUAL | ✓ | 53100 | Vitamin E | mg | — | CSV | VITE- |
| FOODfiles | ✓ | VITE | Vitamin E, alpha-tocopherol equivalents | mg | — | CSV | |
| Fineli | ✓ | VITE | Vitamin E | mg | — | CSV | FSVITAM group |
| BLS | ✓ | VITE | Vitamin E (alpha-tocopherol) | mg | — | CSV | |
| NEVO | ✓ | VITE | Vitamin E total | mg | — | CSV | |
| Matvaretabellen | ✓ | Vit E | Vitamin E | mg-ATE | — | API | VITE |
| FRIDA | ✓ | 135 | E-vitamin / Vitamin E | alfa-TE | — | CSV | eurofir: VITE |
| MEXT | ✓ | col:44 | ビタミンE / α-トコフェロール | mg | — | CSV | = alpha-tocopherol; β(45),γ(46),δ(47) separate |
| KFCT | ✓ | VITE | 비타민 E / Total Vitamin E | mg | — | CSV | also TOCPHA (α), TOCPHB (β), TOCPHG (γ), TOCPHD (δ) |
| INDB | ✓ | vite_mg | Vite | mg | — | CSV | column: vite_mg |
| ASEANFOODS | ✗ | — | — | — | — | CSV | not in nutrient list (only 23 nutrients) |
| FooDB | ✗ | — | — | — | — | API | No total; has α-Tocopherol (FDB000565), γ (FDB002431), δ (FDB002432) in Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | VITAMIN-E | VITAMIN-E | — | — | Web | also ALPHA-TOCOPHEROL, TOCOPHEROL, TOCOPHEROLS |

---

### Alpha-Tocopherol
**Canonical unit:** mg
**Parent:** Vitamin E
**Notes:** DV measures this form
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1109 | Vitamin E (alpha-tocopherol) | mg | 1x | API | SR Legacy: 323 |
| CNF | ✓ | 323 | Alpha-tocopherol | mg | 1x | API | tagname: ATMG |
| AFCD | ✓ | — | Alpha tocopherol | mg | 1x | CSV | Core nutrients; separate from Vitamin E |
| CoFID | ✓ | — | Alpha-tocopherol | mg | 1x | CSV | sheet 1.6 Vitamin Fractions |
| CIQUAL | ✓ | 71010 | Alpha-tocopherol (vitamine E) | mg | 1x | CSV | INFOODS: TOCPHA |
| FOODfiles | ✓ | TOCPHA | Alpha-tocopherol | mg | 1x | CSV | INFOODS tag |
| Fineli | ✗ | — | — | — | — | CSV | only VITE (total); no individual tocopherols |
| BLS | ✓ | TOCPHA | Alpha-Tocopherol | mg | 1x | CSV | Fat-soluble vitamins group |
| NEVO | ✓ | TOCPHA | Alfa-tocoferol / Alpha-tocopherol | mg | 1x | CSV | Vitamin E group |
| Matvaretabellen | ✗ | — | — | — | — | API | only VITE (total ATE); no individual tocopherols |
| FRIDA | ✓ | 276 | alfa-Tokoferol / alpha-Tocopherol | mg | 1x | CSV | eurofir: TOCPHA |
| MEXT | ✓ | col:44 | ビタミンE / α-トコフェロール | mg | 1x | CSV | same col as Vit E total; = alpha-tocopherol |
| KFCT | ✓ | TOCPHA | 알파토코페롤 / α-Tocopherol | mg | 1x | CSV | separate from VITE (total) |
| INDB | ✗ | — | — | — | — | CSV | only vite_mg (total); no individual tocopherols |
| ASEANFOODS | ✗ | — | — | — | — | CSV | not in nutrient list (only 23 nutrients) |
| FooDB | ✓ | FDB000565 | alpha-Tocopherol | — | — | API | Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | ALPHA-TOCOPHEROL | ALPHA-TOCOPHEROL | — | — | Web | Phytochemical DB |

---

### Beta-Tocopherol
**Canonical unit:** mg
**Parent:** Vitamin E
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1125 | Tocopherol, beta | mg | 1x | API | SR Legacy: 341 |
| CNF | ✓ | 341 | Beta-tocopherol | mg | 1x | API | tagname: BTMG |
| AFCD | ✓ | TOCPHB | Beta tocopherol | mg | 1x | CSV | Vitamins category; INFOODS/EuroFIR: TOCPHB |
| CoFID | ✓ | — | Beta-tocopherol | mg | 1x | CSV | sheet 1.6 Vitamin Fractions |
| CIQUAL | ✗ | — | — | — | — | CSV | only alpha-tocopherol (71010); no beta |
| FOODfiles | ✓ | TOCPHB | Beta-tocopherol | mg | 1x | CSV | INFOODS tag |
| Fineli | ✗ | — | — | — | — | CSV | no individual tocopherols |
| BLS | ✓ | TOCPHB | Beta-Tocopherol | mg | 1x | CSV | Fat-soluble vitamins group |
| NEVO | ✓ | TOCPHB | Beta-tocoferol / Beta-tocopherol | mg | 1x | CSV | Vitamin E group |
| Matvaretabellen | ✗ | — | — | — | — | API | no individual tocopherols |
| FRIDA | ✓ | 279 | beta-Tokoferol / beta-Tocopherol | mg | 1x | CSV | eurofir: TOCPHB |
| MEXT | ✓ | col:45 | β-トコフェロール | mg | 1x | CSV | beta-tocopherol |
| KFCT | ✓ | TOCPHB | 베타토코페롤 / β-Tocopherol | mg | 1x | CSV | |
| INDB | ✗ | — | — | — | — | CSV | no individual tocopherols |
| ASEANFOODS | ✗ | — | — | — | — | CSV | not in nutrient list (only 23 nutrients) |
| FooDB | ✓ | FDB031301 | β-tocopherol | — | — | API | Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | BETA-TOCOPHEROL | BETA-TOCOPHEROL | — | — | Web | Phytochemical DB |

---

### Gamma-Tocopherol
**Canonical unit:** mg
**Parent:** Vitamin E
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1126 | Tocopherol, gamma | mg | 1x | API | Fixed: was 1127 (delta) |
| CNF | ✓ | 342 | Gamma-tocopherol | mg | 1x | API | tagname: GTMG |
| AFCD | ✓ | TOCPHG | Gamma tocopherol | mg | 1x | CSV | Vitamins category; INFOODS/EuroFIR: TOCPHG |
| CoFID | ✓ | — | Gamma-tocopherol | mg | 1x | CSV | sheet 1.6 Vitamin Fractions |
| CIQUAL | ✗ | — | — | — | — | CSV | only alpha-tocopherol; no gamma |
| FOODfiles | ✓ | TOCPHG | Gamma-tocopherol | mg | 1x | CSV | INFOODS tag |
| Fineli | ✗ | — | — | — | — | CSV | no individual tocopherols |
| BLS | ✓ | TOCPHG | Gamma-Tocopherol | mg | 1x | CSV | Fat-soluble vitamins group |
| NEVO | ✓ | TOCPHG | Gamma-tocoferol / Gamma-tocopherol | mg | 1x | CSV | Vitamin E group |
| Matvaretabellen | ✗ | — | — | — | — | API | no individual tocopherols |
| FRIDA | ✓ | 286 | gamma-Tokoferol / gamma-Tocopherol | mg | 1x | CSV | eurofir: TOCPHG |
| MEXT | ✓ | col:46 | γ-トコフェロール | mg | 1x | CSV | gamma-tocopherol |
| KFCT | ✓ | TOCPHG | 감마토코페롤 / γ-Tocopherol | mg | 1x | CSV | |
| INDB | ✗ | — | — | — | — | CSV | no individual tocopherols |
| ASEANFOODS | ✗ | — | — | — | — | CSV | not in nutrient list (only 23 nutrients) |
| FooDB | ✓ | FDB002431 | gamma-Tocopherol | — | — | API | Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | GAMMA-TOCOPHEROL | GAMMA-TOCOPHEROL | — | — | Web | Phytochemical DB |

---

### Delta-Tocopherol
**Canonical unit:** mg
**Parent:** Vitamin E
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1127 | Tocopherol, delta | mg | — | API | Fixed: was 1128 (tocotrienol alpha) |
| CNF | ✓ | 343 | Delta-tocopherol | mg | — | API | tagname DTMG |
| AFCD | ✓ | TOCPHD | Delta tocopherol | mg | — | CSV | Vitamins, not core |
| CoFID | ✓ | — | Delta-tocopherol | mg | — | CSV | sheet 1.6 Vitamin Fractions |
| CIQUAL | ✗ | — | — | — | — | CSV | Only alpha-tocopherol available |
| FOODfiles | ✓ | TOCPHD | Delta-tocopherol | mg | — | CSV | |
| Fineli | ✗ | — | — | — | — | CSV | Only VITE total |
| BLS | ✓ | TOCPHD | Delta-Tocopherol | mg | — | CSV | Fat-soluble vitamins |
| NEVO | ✓ | TOCPHD | Delta-tocopherol | mg | — | CSV | NL: Delta-tocoferol |
| Matvaretabellen | ✗ | — | — | — | — | API | Only VITE total |
| FRIDA | ✓ | 282 | delta-Tocopherol | mg | — | CSV | eurofir TOCPHD, DK: delta-Tokoferol |
| MEXT | ✓ | col:47 | δ-トコフェロール | mg | — | CSV | Delta-tocopherol |
| KFCT | ✓ | TOCPHD | δ-Tocopherol | mg | — | CSV | KR: 델타토코페롤 |
| INDB | ✗ | — | — | — | — | CSV | Only vite_mg total |
| ASEANFOODS | ✗ | — | — | — | — | CSV | No Vitamin E compounds |
| FooDB | ✓ | FDB002432 | d-Tocopherol | — | — | API | Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | DELTA-TOCOPHEROL | DELTA-TOCOPHEROL | — | — | Web | key: DELTATOCOPHEROL |

---

### Alpha-Tocotrienol
**Canonical unit:** mg
**Parent:** Vitamin E
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 344 | Tocotrienol, alpha | mg | — | API | SR Legacy 344 |
| CNF | ✓ | 344 | Tocotrienol, alpha | mg | — | API | |
| AFCD | ✓ | TOCTRA | Alpha tocotrienol | mg | — | CSV | Vitamins, not core |
| CoFID | ✓ | — | Alpha-tocotrienol | mg | — | CSV | sheet 1.6 Vitamin Fractions |
| CIQUAL | ✗ | — | — | — | — | CSV | No tocotrienols |
| FOODfiles | ✗ | — | — | — | — | CSV | No tocotrienols |
| Fineli | ✗ | — | — | — | — | CSV | No tocotrienols |
| BLS | ✓ | TOCTRA | Alpha-Tocotrienol | mg | — | CSV | Fat-soluble vitamins |
| NEVO | ✗ | — | — | — | — | CSV | No tocotrienols |
| Matvaretabellen | ✗ | — | — | — | — | API | No tocotrienols |
| FRIDA | ✓ | 277 | alpha-Tocotrienol | mg | — | CSV | eurofir TOCTRA, DK: alfa-Tokotrienol |
| MEXT | ✗ | — | — | — | — | CSV | No tocotrienols |
| KFCT | ✓ | TOCTRA | α-Tocotrienol | mg | — | CSV | KR: 알파토코트리에놀 |
| INDB | ✗ | — | — | — | — | CSV | No tocotrienols |
| ASEANFOODS | ✗ | — | — | — | — | CSV | No tocotrienols |
| FooDB | ✓ | FDB002434 | (R)-alpha-Tocotrienol | — | — | API | Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | ALPHA-TOCOTRIENOL | ALPHA-TOCOTRIENOL | — | — | Web | key: ALPHATOCOTRIENOL |

---

### Beta-Tocotrienol
**Canonical unit:** mg
**Parent:** Vitamin E
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 345 | Tocotrienol, beta | mg | — | API | SR Legacy 345 |
| CNF | ✓ | 345 | Tocotrienol, beta | mg | — | API | |
| AFCD | ✓ | TOCTRB | Beta tocotrienol | mg | — | CSV | Vitamins, not core |
| CoFID | ✗ | — | — | — | — | CSV | Only alpha/gamma tocotrienols |
| CIQUAL | ✗ | — | — | — | — | CSV | No tocotrienols |
| FOODfiles | ✗ | — | — | — | — | CSV | No tocotrienols |
| Fineli | ✗ | — | — | — | — | CSV | No tocotrienols |
| BLS | ✗ | — | — | — | — | CSV | Only alpha-tocotrienol |
| NEVO | ✗ | — | — | — | — | CSV | No tocotrienols |
| Matvaretabellen | ✗ | — | — | — | — | API | No tocotrienols |
| FRIDA | ✗ | — | — | — | — | CSV | Only alpha-tocotrienol |
| MEXT | ✗ | — | — | — | — | CSV | No tocotrienols |
| KFCT | ✓ | TOCTRB | β-Tocotrienol | mg | — | CSV | KR: 베타토코트리에놀 |
| INDB | ✗ | — | — | — | — | CSV | No tocotrienols |
| ASEANFOODS | ✗ | — | — | — | — | CSV | No tocotrienols |
| FooDB | ✓ | FDB093543 | β-tocotrienol | — | — | API | Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | BETA-TOCOTRIENOL | BETA-TOCOTRIENOL | — | — | Web | key: BETATOCOTRIENOL |

---

### Gamma-Tocotrienol
**Canonical unit:** mg
**Parent:** Vitamin E
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 346 | Tocotrienol, gamma | mg | — | API | SR Legacy 346 |
| CNF | ✓ | 346 | Tocotrienol, gamma | mg | — | API | |
| AFCD | ✓ | TOCTRG | Gamma tocotrienol | mg | — | CSV | Vitamins, not core |
| CoFID | ✓ | — | Gamma-tocotrienol | mg | — | CSV | sheet 1.6 Vitamin Fractions |
| CIQUAL | ✗ | — | — | — | — | CSV | No tocotrienols |
| FOODfiles | ✗ | — | — | — | — | CSV | No tocotrienols |
| Fineli | ✗ | — | — | — | — | CSV | No tocotrienols |
| BLS | ✗ | — | — | — | — | CSV | Only alpha-tocotrienol |
| NEVO | ✗ | — | — | — | — | CSV | No tocotrienols |
| Matvaretabellen | ✗ | — | — | — | — | API | No tocotrienols |
| FRIDA | ✗ | — | — | — | — | CSV | Only alpha-tocotrienol |
| MEXT | ✗ | — | — | — | — | CSV | No tocotrienols |
| KFCT | ✓ | TOCTRD | γ-Tocotrienol | mg | — | CSV | 감마토코트리에놀; tagname swap: KFCT uses TOCTRD for gamma |
| INDB | ✗ | — | — | — | — | CSV | No tocotrienols |
| ASEANFOODS | ✗ | — | — | — | — | CSV | No tocotrienols |
| FooDB | ✓ | FDB001298 | gamma-Tocotrienol | — | — | CSV | CAS 14101-61-2 |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | GAMMA-TOCOTRIENOL | GAMMA-TOCOTRIENOL | — | — | CSV | |

---

### Delta-Tocotrienol
**Canonical unit:** mg
**Parent:** Vitamin E
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 347 | Tocotrienol, delta | mg | — | API | SR Legacy 347 |
| CNF | ✓ | 347 | Tocotrienol, delta | mg | — | API | |
| AFCD | ✓ | TOCTRD | Delta tocotrienol | mg | — | CSV | Vitamins, not core |
| CoFID | ✗ | — | — | — | — | CSV | Only alpha/gamma tocotrienols |
| CIQUAL | ✗ | — | — | — | — | CSV | No tocotrienols |
| FOODfiles | ✗ | — | — | — | — | CSV | No tocotrienols |
| Fineli | ✗ | — | — | — | — | CSV | No tocotrienols |
| BLS | ✗ | — | — | — | — | CSV | Only alpha-tocotrienol |
| NEVO | ✗ | — | — | — | — | CSV | No tocotrienols |
| Matvaretabellen | ✗ | — | — | — | — | API | No tocotrienols |
| FRIDA | ✗ | — | — | — | — | CSV | Only alpha-tocotrienol |
| MEXT | ✗ | — | — | — | — | CSV | No tocotrienols |
| KFCT | ✓ | TOCTRG | δ-Tocotrienol | mg | — | CSV | 델타토코트리에놀; tagname swap: KFCT uses TOCTRG for delta |
| INDB | ✗ | — | — | — | — | CSV | No tocotrienols |
| ASEANFOODS | ✗ | — | — | — | — | CSV | No tocotrienols |
| FooDB | ✓ | FDB001299 | d-Tocotrienol | — | — | CSV | CAS 25612-59-3 |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | DELTA-TOCOTRIENOL | DELTA-TOCOTRIENOL | — | — | CSV | |

---

## VITAMIN K (5)

### Vitamin K (Total)
**Canonical unit:** μg
**DV:** 120 μg
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1185 | Vitamin K (phylloquinone) | μg | — | API | SR Legacy 430; FDC equates total K with K1 |
| CNF | ✓ | 430 | Vitamin K (phylloquinone) | μg | — | API | Derived from USDA SR27 |
| AFCD | ✗ | — | — | — | — | CSV | No Vitamin K compounds |
| CoFID | ✓ | — | Vitamin K1 | μg | — | CSV | sheet 1.5 Vitamins; K1 only (=phylloquinone) |
| CIQUAL | ✗ | — | — | — | — | CSV | No total; has VITK1 (54101) + VITK2 (54104) separately |
| FOODfiles | ✓ | VITK | Vitamin K | μg | — | CSV | |
| Fineli | ✓ | VITK | Vitamin K | μg | — | CSV | group FSVITAM |
| BLS | ✓ | VITK | Vitamin K | μg | — | CSV | Also has VITK1 + VITK2 |
| NEVO | ✓ | VITK | Vitamin K total | μg | — | CSV | Also has VITK1 + VITK2 |
| Matvaretabellen | ✗ | — | — | — | — | API | No Vitamin K compounds |
| FRIDA | ✓ | id:442 | Vitamin K | μg | — | CSV | eurofir VITK; also has VITK1 + VITK2 |
| MEXT | ✓ | col:48 | ビタミンK | μg | — | CSV | |
| KFCT | ✗ | — | — | — | — | CSV | No total; only VITK1 (Phylloquinone) |
| INDB | ✗ | — | — | — | — | CSV | No total; has vitk1_ug + vitk2_ug separately |
| ASEANFOODS | ✗ | — | — | — | — | CSV | No Vitamin K compounds |
| FooDB | ✗ | — | — | — | — | CSV | No Vitamin K total; only K2 as compound (FDB001310) |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | VITAMIN-K | VITAMIN-K | — | — | CSV | Also has PHYLLOQUINONE, VITAMIN-K-1 |

---

### Vitamin K1 (Phylloquinone)
**Canonical unit:** μg
**Parent:** Vitamin K
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1185 | Vitamin K (phylloquinone) | μg | — | API | SR Legacy 430; same entry as K total |
| CNF | ✓ | 430 | Vitamin K (phylloquinone) | μg | — | API | Same entry as K total |
| AFCD | ✗ | — | — | — | — | CSV | No Vitamin K compounds |
| CoFID | ✓ | — | Vitamin K1 | μg | — | CSV | sheet 1.5 Vitamins |
| CIQUAL | ✓ | 54101 | Vitamin K1 | μg | — | CSV | INFOODS VITK1 |
| FOODfiles | ✗ | — | — | — | — | CSV | Only VITK total, no separate K1 |
| Fineli | ✗ | — | — | — | — | CSV | Only VITK total, no separate K1 |
| BLS | ✓ | VITK1 | Vitamin K1 (phylloquinone) | μg | — | CSV | Phyllochinon (DE) |
| NEVO | ✓ | VITK1 | Vitamin K1 | μg | — | CSV | |
| Matvaretabellen | ✗ | — | — | — | — | API | No Vitamin K compounds |
| FRIDA | ✓ | id:164 | Vitamin K1 | μg | — | CSV | eurofir VITK1; K1-vitamin (DK) |
| MEXT | ✗ | — | — | — | — | CSV | Only ビタミンK total, no separate K1 |
| KFCT | ✓ | VITK1 | Phylloquinone | μg | — | CSV | 비타민 K1 |
| INDB | ✓ | vitk1_ug | Vitk1 | μg | — | CSV | |
| ASEANFOODS | ✗ | — | — | — | — | CSV | No Vitamin K compounds |
| FooDB | ✓ | FDB097338 | Phylloquinone | — | — | CSV | |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | PHYLLOQUINONE | PHYLLOQUINONE | — | — | CSV | Also as VITAMIN-K-1 |

---

### Vitamin K2 MK-4
**Canonical unit:** μg
**Parent:** Vitamin K
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 428 | Menaquinone-4 | μg | — | API | SR Legacy 428 |
| CNF | ✓ | 428 | Menaquinone-4 | μg | — | API | |
| AFCD | ✗ | — | — | — | — | CSV | No Vitamin K compounds |
| CoFID | ✗ | — | — | — | — | CSV | Only Vitamin K1 |
| CIQUAL | ✗ | — | — | — | — | CSV | Only VITK2 total (54104), no MK-4 specific |
| FOODfiles | ✗ | — | — | — | — | CSV | Only VITK total |
| Fineli | ✗ | — | — | — | — | CSV | Only VITK total |
| BLS | ✗ | — | — | — | — | CSV | Only VITK2 total (menaquinone), no MK-4 specific |
| NEVO | ✗ | — | — | — | — | CSV | Only VITK2 total (Vitamin K2), no MK-4 specific |
| Matvaretabellen | ✗ | — | — | — | — | API | No Vitamin K compounds |
| FRIDA | ✓ | 433 | Menaquinone 4 | μg | — | CSV | eurofir MK4 |
| MEXT | ✗ | — | — | — | — | CSV | Only ビタミンK total, no MK forms |
| KFCT | ✗ | — | — | — | — | CSV | Only VITK1 (Phylloquinone), no K2/MK forms |
| INDB | ✗ | — | — | — | — | CSV | Only vitk2_ug total, no MK-4 specific |
| ASEANFOODS | ✗ | — | — | — | — | CSV | No Vitamin K compounds |
| FooDB | ✓ | FDB029792 | Menatetrenone | — | — | API | CAS 863-61-6, = MK-4 |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | Web | Only VITAMIN-K, VITAMIN-K-1, MENAQUINONE-1 |

---

### Vitamin K2 MK-7
**Canonical unit:** μg
**Parent:** Vitamin K
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Only MK-4 (428), no MK-7 |
| CNF | ✗ | — | — | — | — | API | Derived from USDA SR27, no MK-7 |
| AFCD | ✗ | — | — | — | — | CSV | No Vitamin K compounds |
| CoFID | ✗ | — | — | — | — | CSV | Only Vitamin K1 |
| CIQUAL | ✗ | — | — | — | — | CSV | Only VITK1 + VITK2 total, no MK-7 |
| FOODfiles | ✗ | — | — | — | — | CSV | Only VITK total |
| Fineli | ✗ | — | — | — | — | CSV | Only VITK total |
| BLS | ✗ | — | — | — | — | CSV | Only VITK2 total (menaquinone), no MK-7 specific |
| NEVO | ✗ | — | — | — | — | CSV | Only VITK2 total, no MK-7 specific |
| Matvaretabellen | ✗ | — | — | — | — | API | No Vitamin K compounds |
| FRIDA | ✓ | 436 | Menaquinone 7 | μg | — | CSV | eurofir MK7 |
| MEXT | ✗ | — | — | — | — | CSV | Only ビタミンK total, no MK forms |
| KFCT | ✗ | — | — | — | — | CSV | Only VITK1 (Phylloquinone), no K2/MK forms |
| INDB | ✗ | — | — | — | — | CSV | Only vitk2_ug total, no MK-7 specific |
| ASEANFOODS | ✗ | — | — | — | — | CSV | No Vitamin K compounds |
| FooDB | ✗ | — | — | — | — | API | No MK-7 compound; only MK-4 (FDB029792) + K2 total (FDB001310) |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | Web | Only MENAQUINONE-1, no MK-7 |

---

### Vitamin K2 MK-9
**Canonical unit:** μg
**Parent:** Vitamin K
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Only MK-4 (428), no MK-9 |
| CNF | ✗ | — | — | — | — | API | Derived from USDA SR27, no MK-9 |
| AFCD | ✗ | — | — | — | — | CSV | No Vitamin K compounds |
| CoFID | ✗ | — | — | — | — | CSV | Only Vitamin K1 |
| CIQUAL | ✗ | — | — | — | — | CSV | Only VITK1 + VITK2 total, no MK-9 |
| FOODfiles | ✗ | — | — | — | — | CSV | Only VITK total |
| Fineli | ✗ | — | — | — | — | CSV | Only VITK total |
| BLS | ✗ | — | — | — | — | CSV | Only VITK2 total, no MK-9 specific |
| NEVO | ✗ | — | — | — | — | CSV | Only VITK2 total, no MK-9 specific |
| Matvaretabellen | ✗ | — | — | — | — | API | No Vitamin K compounds |
| FRIDA | ✓ | 438 | Menaquinone 9 | μg | — | CSV | eurofir MK9 |
| MEXT | ✗ | — | — | — | — | CSV | Only ビタミンK total, no MK forms |
| KFCT | ✗ | — | — | — | — | CSV | Only VITK1 (Phylloquinone) |
| INDB | ✗ | — | — | — | — | CSV | Only vitk2_ug total, no MK-9 specific |
| ASEANFOODS | ✗ | — | — | — | — | CSV | No Vitamin K compounds |
| FooDB | ✗ | — | — | — | — | API | No MK-9 compound |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | Web | Only MENAQUINONE-1, no MK-9 |

---

# WATER-SOLUBLE VITAMINS

## VITAMIN C (3)

### Vitamin C (Total)
**Canonical unit:** mg
**DV:** 90 mg
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 401 | Vitamin C, total ascorbic acid | mg | — | API | SR Legacy 401 |
| CNF | ✓ | 401 | Vitamin C | mg | — | API | |
| AFCD | ✓ | — | Vitamin C | mg | — | CSV | Core nutrient |
| CoFID | ✓ | — | Vitamin C | mg | — | CSV | Sheet 1.5 Vitamins |
| CIQUAL | ✓ | 55100 | Vitamin C | mg | — | CSV | INFOODS VITC |
| FOODfiles | ✓ | VITC | Vitamin C | mg | — | CSV | |
| Fineli | ✓ | VITC | Vitamin C | mg | — | CSV | Group WSVITAM |
| BLS | ✓ | VITC | Vitamin C | mg | — | CSV | |
| NEVO | ✓ | VITC | Ascorbic acid (Vit C) | mg | — | CSV | |
| Matvaretabellen | ✓ | Vit C | Vitamin C (askorbic acid) | mg | — | API | euroFir VITC |
| FRIDA | ✓ | 47 | Vitamin C | mg | — | CSV | eurofir VITC; also ASCL (175) + ASCDL (177) |
| MEXT | ✓ | col:58 | ビタミンC | mg | — | CSV | |
| KFCT | ✓ | VITC | Total Ascorbic Acid | mg | — | CSV | 비타민 C |
| INDB | ✓ | vitc_mg | Vitc | mg | — | CSV | |
| ASEANFOODS | ✓ | VITC | Vitamin C | mg | — | CSV | |
| FooDB | ✓ | FDB001223 | Ascorbic acid | — | — | API | CAS 50-81-7 |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | — | ASCORBIC-ACID | — | — | Web | Also VITAMIN-C, L-ASCORBIC-ACID |

---

### Ascorbic Acid
**Canonical unit:** mg
**Parent:** Vitamin C
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Only total Vitamin C (401), no separate ascorbic acid entry |
| CNF | ✗ | — | — | — | — | API | Only total Vitamin C (401), no separate ascorbic acid entry |
| AFCD | ✗ | — | — | — | — | CSV | Only "Vitamin C" total, no separate ascorbic acid |
| CoFID | ✗ | — | — | — | — | CSV | Only "Vitamin C" total, no separate ascorbic acid |
| CIQUAL | ✗ | — | — | — | — | CSV | Only VITC total (55100), no separate ascorbic acid |
| FOODfiles | ✗ | — | — | — | — | CSV | Only VITC total, no separate ascorbic acid |
| Fineli | ✗ | — | — | — | — | CSV | Only VITC total, no separate ascorbic acid |
| BLS | ✗ | — | — | — | — | CSV | Only VITC total, no separate ascorbic acid |
| NEVO | ✗ | — | — | — | — | CSV | VITC "Ascorbic acid (Vit C)" is total Vitamin C, not separate sub-form |
| Matvaretabellen | ✗ | — | — | — | — | API | Only VITC total "Vitamin C (askorbic acid)", no separate sub-form |
| FRIDA | ✓ | 175 | Ascorbic acid | mg | — | CSV | eurofir ASCL, Ascorbinsyre (DK) |
| MEXT | ✗ | — | — | — | — | CSV | Only ビタミンC total (col:58), no separate ascorbic acid |
| KFCT | ✗ | — | — | — | — | CSV | VITC "Total Ascorbic Acid" is total Vitamin C, not separate sub-form |
| INDB | ✗ | — | — | — | — | CSV | Only vitc_mg total, no separate ascorbic acid |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only VITC total, no separate ascorbic acid |
| FooDB | ✓ | FDB001223 | Ascorbic acid | — | — | API | CAS 50-81-7, L-ascorbic acid compound |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | — | L-ASCORBIC-ACID | — | — | Web | Also ASCORBIC-ACID as separate entry |

---

### Dehydroascorbic Acid
**Canonical unit:** mg
**Parent:** Vitamin C
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Included in total Vitamin C (401), no separate entry |
| CNF | ✗ | — | — | — | — | API | Derived from USDA SR27, no separate dehydroascorbic acid |
| AFCD | ✗ | — | — | — | — | CSV | Only "Vitamin C" total, no dehydroascorbic acid |
| CoFID | ✗ | — | — | — | — | CSV | Only "Vitamin C" total, no dehydroascorbic acid |
| CIQUAL | ✗ | — | — | — | — | CSV | Only VITC total, no dehydroascorbic acid |
| FOODfiles | ✗ | — | — | — | — | CSV | Only VITC total, no dehydroascorbic acid |
| Fineli | ✗ | — | — | — | — | CSV | Only VITC total, no dehydroascorbic acid |
| BLS | ✗ | — | — | — | — | CSV | Only VITC total, no dehydroascorbic acid |
| NEVO | ✗ | — | — | — | — | CSV | Only VITC total, no dehydroascorbic acid |
| Matvaretabellen | ✗ | — | — | — | — | API | Only VITC total, no dehydroascorbic acid |
| FRIDA | ✓ | 177 | Dehydroascorbic acid | mg | — | CSV | eurofir ASCDL, Dehydroascorbinsyre (DK) |
| MEXT | ✗ | — | — | — | — | CSV | Only ビタミンC total, no dehydroascorbic acid |
| KFCT | ✗ | — | — | — | — | CSV | Only VITC total, no dehydroascorbic acid |
| INDB | ✗ | — | — | — | — | CSV | Only vitc_mg total, no dehydroascorbic acid |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only VITC total, no dehydroascorbic acid |
| FooDB | ✓ | FDB011907 | Dehydroascorbic acid | — | — | API | CAS 490-83-5, oxidized form of ascorbic acid |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | — | DEHYDROASCORBIC-ACID | — | — | Web | |

---

## VITAMIN B1 - THIAMIN (4)

### Thiamin (B1)
**Canonical unit:** mg
**DV:** 1.2 mg
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 404 | Thiamin | mg | — | API | SR Legacy 404 |
| CNF | ✓ | 404 | Thiamin | mg | — | API | Same as USDA SR27 |
| AFCD | ✓ | — | Thiamin (B1) | mg | — | CSV | Core nutrient |
| CoFID | ✓ | — | Thiamin | mg | — | CSV | Sheet 1.5 Vitamins |
| CIQUAL | ✓ | 56100 | Vitamin B1 or Thiamin | mg | — | CSV | INFOODS THIA |
| FOODfiles | ✓ | THIA | Thiamin | mg | — | CSV | |
| Fineli | ✓ | THIA | Thiamin | mg | — | CSV | Group WSVITAM |
| BLS | ✓ | THIA | Vitamin B1 (thiamine) | mg | — | CSV | Water-soluble vitamins |
| NEVO | ✓ | THIA | Thiamin (Vit B1) | mg | — | CSV | Thiamine (NL) |
| Matvaretabellen | ✓ | Vit B1 | Vitamin B1 (thiamin) | mg | — | API | euroFir THIA |
| FRIDA | ✓ | 37 | Thiamin (Vitamin B1) | mg | — | CSV | eurofir THIA; also id 36 "Thiamine" sub-form |
| MEXT | ✓ | col:49 | ビタミンＢ１ | mg | — | CSV | Vitamin B1 |
| KFCT | ✓ | THIA | Thiamine | mg | — | CSV | 비타민 B1 (KR) |
| INDB | ✓ | vitb1_mg | Vitb1 | mg | — | CSV | |
| ASEANFOODS | ✓ | THIA | Vitamin B1 | mg | — | CSV | |
| FooDB | ✓ | FDB008424 | Thiamine | — | — | API | CAS 70-16-6 |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | — | THIAMIN | — | — | Web | Also THIAMINE as separate entry |

---

### Thiamin HCl
**Canonical unit:** mg
**Parent:** Thiamin
**Notes:** Supplement form
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Supplement form, not a separate nutrient in FDC |
| CNF | ✗ | — | — | — | — | API | Supplement form, not tracked separately |
| AFCD | ✗ | — | — | — | — | CSV | Only total Thiamin (B1) |
| CoFID | ✗ | — | — | — | — | CSV | Only total Thiamin |
| CIQUAL | ✗ | — | — | — | — | CSV | Only total THIA |
| FOODfiles | ✗ | — | — | — | — | CSV | Only total THIA |
| Fineli | ✗ | — | — | — | — | CSV | Only total THIA |
| BLS | ✗ | — | — | — | — | CSV | Only total THIA |
| NEVO | ✗ | — | — | — | — | CSV | Only total THIA |
| Matvaretabellen | ✗ | — | — | — | — | API | Only total THIA |
| FRIDA | ✗ | — | — | — | — | CSV | Only total THIA + Thiamine sub-form, no HCl |
| MEXT | ✗ | — | — | — | — | CSV | Only total ビタミンＢ１ |
| KFCT | ✗ | — | — | — | — | CSV | Only total THIA |
| INDB | ✗ | — | — | — | — | CSV | Only total vitb1_mg |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total THIA |
| FooDB | ✓ | FDB008416 | Thiamine hydrochloride | — | — | API | CAS 67-03-8 |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | Web | Only THIAMIN / THIAMINE (no HCl form) |

---

### Thiamin Mononitrate
**Canonical unit:** mg
**Parent:** Thiamin
**Notes:** Supplement form
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Supplement form, only total Thiamin (1065) |
| CNF | ✗ | — | — | — | — | API | Supplement form, not tracked separately |
| AFCD | ✗ | — | — | — | — | CSV | Only total Thiamin (B1) |
| CoFID | ✗ | — | — | — | — | CSV | Only total Thiamin |
| CIQUAL | ✗ | — | — | — | — | CSV | Only total THIA |
| FOODfiles | ✗ | — | — | — | — | CSV | Only total THIA |
| Fineli | ✗ | — | — | — | — | CSV | Only total THIA |
| BLS | ✗ | — | — | — | — | CSV | Only total THIA |
| NEVO | ✗ | — | — | — | — | CSV | Only total THIA |
| Matvaretabellen | ✗ | — | — | — | — | API | Only total THIA |
| FRIDA | ✗ | — | — | — | — | CSV | Only total THIA |
| MEXT | ✗ | — | — | — | — | CSV | No mononitrate form |
| KFCT | ✗ | — | — | — | — | CSV | Only total THIA |
| INDB | ✗ | — | — | — | — | CSV | Only total vitb1_mg |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total THIA |
| FooDB | ✓ | FDB008426 | Thiamine mononitrate | — | — | CSV | CAS 532-43-4 |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Only THIAMIN/THIAMINE (generic) |

---

## VITAMIN B2 - RIBOFLAVIN (3)

### Riboflavin (B2)
**Canonical unit:** mg
**DV:** 1.3 mg
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1166 | Riboflavin | mg | — | API | SR Legacy 405 |
| CNF | ✓ | 405 | Riboflavin | mg | — | API | |
| AFCD | ✓ | — | Riboflavin (B2) | mg | — | CSV | Core nutrients |
| CoFID | ✓ | — | Riboflavin | mg | — | CSV | sheet 1.5 Vitamins |
| CIQUAL | ✓ | 56200 | Vitamin B2 or Riboflavin | mg | — | CSV | INFOODS RIBF |
| FOODfiles | ✓ | RIBF | Riboflavin | mg | — | CSV | |
| Fineli | ✓ | RIBF | Riboflavin | mg | — | CSV | group WSVITAM |
| BLS | ✓ | RIBF | Vitamin B2 (riboflavin) | mg | — | CSV | |
| NEVO | ✓ | RIBF | Riboflavin (Vit B2) | mg | — | CSV | |
| Matvaretabellen | ✓ | RIBF | Vitamin B2 (riboflavin) | mg | — | API | nutrientId "Vit B2" |
| FRIDA | ✓ | id:39 | Riboflavin (Vitamin B2) | mg | — | CSV | eurofir RIBF |
| MEXT | ✓ | col:50 | ビタミンB２ | mg | — | CSV | Spaced chars in source: ビ タ ミ ン B２ |
| KFCT | ✓ | RIBF | Total Riboflavin (비타민 B2) | mg | — | CSV | |
| INDB | ✓ | vitb2_mg | Vitb2 | mg | — | CSV | |
| ASEANFOODS | ✓ | RIBF | Vitamin B2 | mg | — | CSV | |
| FooDB | ✓ | FDB012160 | Riboflavine | mg | — | API | Compound.csv; spelled "Riboflavine" |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | RIBOFLAVIN | Riboflavin | mg | — | CSV | |

---

### Riboflavin
**Canonical unit:** mg
**Parent:** Riboflavin (B2)
**Notes:** Base form
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1166 | Riboflavin | mg | — | API | SR Legacy 405; same as parent |
| CNF | ✓ | 405 | Riboflavin | mg | — | API | Same as parent |
| AFCD | ✓ | — | Riboflavin (B2) | mg | — | CSV | Core nutrients; same as parent |
| CoFID | ✓ | — | Riboflavin | mg | — | CSV | Sheet 1.5 Vitamins; same as parent |
| CIQUAL | ✓ | 56200 | Vitamin B2 or Riboflavin | mg | — | CSV | INFOODS RIBF; same as parent |
| FOODfiles | ✓ | RIBF | Riboflavin | mg | — | CSV | Same as parent |
| Fineli | ✓ | RIBF | Riboflavin | mg | — | CSV | group WSVITAM; same as parent |
| BLS | ✓ | RIBF | Vitamin B2 (riboflavin) | mg | — | CSV | Same as parent |
| NEVO | ✓ | RIBF | Riboflavin (Vit B2) | mg | — | CSV | Same as parent |
| Matvaretabellen | ✓ | RIBF | Vitamin B2 (riboflavin) | mg | — | API | nutrientId "Vit B2"; same as parent |
| FRIDA | ✓ | id:39 | Riboflavin (Vitamin B2) | mg | — | CSV | eurofir RIBF; same as parent |
| MEXT | ✓ | col:50 | ビタミンB２ | mg | — | CSV | Same as parent |
| KFCT | ✓ | RIBF | Total Riboflavin (비타민 B2) | mg | — | CSV | Same as parent |
| INDB | ✓ | vitb2_mg | Vitb2 | mg | — | CSV | Same as parent |
| ASEANFOODS | ✓ | RIBF | Vitamin B2 | mg | — | CSV | Same as parent |
| FooDB | ✓ | FDB012160 | Riboflavine | mg | — | API | Same as parent |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | RIBOFLAVIN | Riboflavin | mg | — | CSV | Same as parent |

---

### Riboflavin-5-Phosphate (R5P)
**Canonical unit:** mg
**Parent:** Riboflavin (B2)
**Notes:** Active/supplement form (also known as Flavin mononucleotide / FMN)
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Only total riboflavin (1166); no separate FMN entry |
| CNF | ✗ | — | — | — | — | API | Only total riboflavin (405); no separate FMN entry |
| AFCD | ✗ | — | — | — | — | CSV | Only total Riboflavin (B2) |
| CoFID | ✗ | — | — | — | — | CSV | Only total Riboflavin |
| CIQUAL | ✗ | — | — | — | — | CSV | Only total Riboflavin (56200) |
| FOODfiles | ✗ | — | — | — | — | CSV | Only total Riboflavin (RIBF) |
| Fineli | ✗ | — | — | — | — | CSV | Only total Riboflavin (RIBF) |
| BLS | ✗ | — | — | — | — | CSV | Only total Riboflavin (RIBF) |
| NEVO | ✗ | — | — | — | — | CSV | Only total Riboflavin (RIBF) |
| Matvaretabellen | ✗ | — | — | — | — | API | Only total Riboflavin (RIBF) |
| FRIDA | ✗ | — | — | — | — | CSV | Only total Riboflavin (id:39, RIBF) |
| MEXT | ✗ | — | — | — | — | CSV | Only total ビタミンB２ (col:50) |
| KFCT | ✗ | — | — | — | — | CSV | Only total Riboflavin (RIBF) |
| INDB | ✗ | — | — | — | — | CSV | Only total B2 (vitb2_mg) |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total B2 (RIBF) |
| FooDB | ✓ | FDB030862 | FMN (Flavin mononucleotide) | — | — | API | CAS 146-17-8; aka riboflavin 5'-monophosphate |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Only total RIBOFLAVIN |

---

## VITAMIN B3 - NIACIN (4)

### Niacin (B3)
**Canonical unit:** mg NE
**DV:** 16 mg
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1167 | Niacin | mg | — | API | SR Legacy 415 |
| CNF | ✓ | 409 | Niacin (NE) | mg | — | API | Niacin equivalents |
| AFCD | ✓ | — | Niacin (B3) | mg | — | CSV | Core nutrients |
| CoFID | ✓ | — | Niacin equivalent | mg | — | CSV | Sheet 1.5 Vitamins; also "Niacin" preformed |
| CIQUAL | ✓ | 56310 | Vitamin B3 or Niacin | mg | — | CSV | INFOODS NIA |
| FOODfiles | ✓ | NIAEQ | Niacin equivalents, total | mg | — | CSV | Also NIA (preformed) |
| Fineli | ✓ | NIAEQ | Niacin equivalents | mg | — | CSV | group WSVITAM; also NIA (preformed) |
| BLS | ✓ | NIAEQ | Niacin equivalents (Niacin-Äquivalent) | mg | — | CSV | Also NIA (preformed) |
| NEVO | ✓ | NIAEQ | Niacin equivalents | mg | — | CSV | Also NIA "Niacin (Vit B3)" |
| Matvaretabellen | ✓ | NIAEQ | Niacin equivalents | mg | — | API | nutrientId "NIAEQ" |
| FRIDA | ✓ | id:203 | Niacin equivalent | mg | — | CSV | eurofir NIAEQ |
| MEXT | ✓ | col:52 | ナイアシン当量 (Niacin equivalents) | mg | — | CSV | Also col:51 ナイアシン (preformed) |
| KFCT | ✓ | NIAEQ | Niacin Equivalent (니아신 당량) | mg | — | CSV | Also NIA "Total Niacin" |
| INDB | ✓ | vitb3_mg | Vitb3 | mg | — | CSV | |
| ASEANFOODS | ✓ | NIA | Niacin | mg | — | CSV | |
| FooDB | ✓ | FDB001014 | Nicotinic acid | — | — | API | Compound.csv; also FDB012485 Nicotinamide |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | NIACIN | Niacin | mg | — | CSV | Also NICOTINIC-ACID, NIACINAMIDE |

---

### Nicotinic Acid
**Canonical unit:** mg
**Parent:** Niacin
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1167 | Niacin | mg | — | API | Preformed niacin; same as parent |
| CNF | ✓ | 406 | Niacin (Nicotinic Acid) Preformed | mg | — | API | Separate from 409 (NE) |
| AFCD | ✓ | — | Niacin (B3) | mg | — | CSV | Preformed niacin; same as parent |
| CoFID | ✓ | — | Niacin | mg | — | CSV | Preformed; separate from "Niacin equivalent" |
| CIQUAL | ✓ | 56310 | Vitamin B3 or Niacin | mg | — | CSV | Preformed (NIA); same as parent |
| FOODfiles | ✓ | NIA | Niacin, preformed | mg | — | CSV | Separate from NIAEQ (equivalents) |
| Fineli | ✓ | NIA | Niacin | mg | — | CSV | Preformed; separate from NIAEQ |
| BLS | ✓ | NIA | Niacin | mg | — | CSV | Preformed; separate from NIAEQ |
| NEVO | ✓ | NIA | Niacin (Vit B3) | mg | — | CSV | Preformed; separate from NIAEQ |
| Matvaretabellen | ✓ | NIA | Vitamin B3 (niacin) | mg | — | API | Preformed; nutrientId "Niacin" |
| FRIDA | ✓ | id:294 | Niacin | mg | — | CSV | eurofir NICOTAC; preformed |
| MEXT | ✓ | col:51 | ナイアシン (Niacin) | mg | — | CSV | Preformed; separate from col:52 (当量) |
| KFCT | ✓ | NIA | Total Niacin (니아신) | mg | — | CSV | Preformed; separate from NIAEQ |
| INDB | ✓ | vitb3_mg | Vitb3 | mg | — | CSV | Total B3 only; same as parent |
| ASEANFOODS | ✓ | NIA | Niacin | mg | — | CSV | Preformed; same as parent |
| FooDB | ✓ | FDB001014 | Nicotinic acid | — | — | API | Exact match |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | NICOTINIC-ACID | Nicotinic acid | mg | — | CSV | Exact match |

---

### Nicotinamide
**Canonical unit:** mg
**Parent:** Niacin
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Only total niacin (1167); no separate nicotinamide |
| CNF | ✗ | — | — | — | — | API | Only nicotinic acid (406) and NE (409) |
| AFCD | ✗ | — | — | — | — | CSV | Only total Niacin (B3) |
| CoFID | ✗ | — | — | — | — | CSV | Only Niacin and Niacin equivalent |
| CIQUAL | ✗ | — | — | — | — | CSV | Only Vitamin B3/Niacin (56310, NIA) |
| FOODfiles | ✗ | — | — | — | — | CSV | Only NIA (preformed) and NIAEQ |
| Fineli | ✗ | — | — | — | — | CSV | Only NIA and NIAEQ |
| BLS | ✗ | — | — | — | — | CSV | Only NIA and NIAEQ |
| NEVO | ✗ | — | — | — | — | CSV | Only NIA and NIAEQ |
| Matvaretabellen | ✗ | — | — | — | — | API | Only NIA and NIAEQ |
| FRIDA | ✗ | — | — | — | — | CSV | Only Niacin (294) and NE (203) |
| MEXT | ✗ | — | — | — | — | CSV | Only ナイアシン (51) and 当量 (52) |
| KFCT | ✗ | — | — | — | — | CSV | Only NIA and NIAEQ |
| INDB | ✗ | — | — | — | — | CSV | Only total B3 (vitb3_mg) |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only NIA (preformed) |
| FooDB | ✓ | FDB012485 | Nicotinamide | — | — | API | Exact match |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | NIACINAMIDE | Niacinamide | mg | — | CSV | Exact match |

---

### Nicotinamide Riboside (NR)
**Canonical unit:** mg
**Parent:** Niacin
**Notes:** Supplement form
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Supplement form, not tracked |
| CNF | ✗ | — | — | — | — | API | Supplement form, not tracked |
| AFCD | ✗ | — | — | — | — | CSV | Supplement form, not tracked |
| CoFID | ✗ | — | — | — | — | CSV | Supplement form, not tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Supplement form, not tracked |
| FOODfiles | ✗ | — | — | — | — | CSV | Supplement form, not tracked |
| Fineli | ✗ | — | — | — | — | CSV | Supplement form, not tracked |
| BLS | ✗ | — | — | — | — | CSV | Supplement form, not tracked |
| NEVO | ✗ | — | — | — | — | CSV | Supplement form, not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Supplement form, not tracked |
| FRIDA | ✗ | — | — | — | — | CSV | Supplement form, not tracked |
| MEXT | ✗ | — | — | — | — | CSV | Supplement form, not tracked |
| KFCT | ✗ | — | — | — | — | CSV | Supplement form, not tracked |
| INDB | ✗ | — | — | — | — | CSV | Supplement form, not tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Supplement form, not tracked |
| FooDB | ✓ | FDB022281 | Nicotinamide riboside | — | — | API | CAS 1341-23-7; NAD+ precursor |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Supplement form, not tracked |

---

## VITAMIN B5 - PANTOTHENIC ACID (5)

### Pantothenic Acid (B5)
**Canonical unit:** mg
**DV:** 5 mg
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1170 | Pantothenic acid | mg | — | API | SR Legacy 410 |
| CNF | ✓ | 410 | Pantothenic Acid | mg | — | API | |
| AFCD | ✓ | PANTAC | Pantothenic acid (B5) | mg | — | CSV | INFOODS PANTAC |
| CoFID | ✓ | — | Pantothenate | mg | — | CSV | Sheet 1.5 Vitamins |
| CIQUAL | ✓ | 56400 | Vitamin B5 or Pantothenic acid | mg | — | CSV | INFOODS PANTAC |
| FOODfiles | ✓ | PANTAC | Pantothenic acid | mg | — | CSV | |
| Fineli | ✗ | — | — | — | — | CSV | Not in component.csv |
| BLS | ✓ | PANTAC | Pantothenic acid | mg | — | CSV | |
| NEVO | ✗ | — | — | — | — | CSV | Not in nutrient list |
| Matvaretabellen | ✗ | — | — | — | — | API | Not in nutrient list |
| FRIDA | ✓ | id:210 | Pantothenic acid | mg | — | CSV | eurofir PANTAC |
| MEXT | ✓ | col:56 | パントテン酸 (Pantothenic acid) | mg | — | CSV | |
| KFCT | ✓ | PANTAC | Pantothenic Acid (판토텐산) | mg | — | CSV | |
| INDB | ✓ | vitb5_mg | Vitb5 | mg | — | CSV | |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in nutrient list |
| FooDB | ✓ | FDB008322 | Pantothenic acid | — | — | API | CAS 79-83-4 |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | PANTOTHENIC-ACID | Pantothenic acid | mg | — | CSV | |

---

### Calcium Pantothenate
**Canonical unit:** mg
**Parent:** Pantothenic Acid (B5)
**Notes:** Supplement salt form
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Supplement form not tracked |
| CNF | ✗ | — | — | — | — | API | Supplement form not tracked |
| AFCD | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| CoFID | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| FOODfiles | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| Fineli | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| BLS | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| NEVO | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Supplement form not tracked |
| FRIDA | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| MEXT | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| KFCT | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| INDB | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| FooDB | ✓ | FDB012193 | Calcium pantothenate | — | — | CSV | Supplement compound |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Not found |

---

### Dexpanthenol
**Canonical unit:** mg
**Parent:** Pantothenic Acid (B5)
**Notes:** Provitamin B5 (D-Panthenol), converts to pantothenic acid
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Provitamin not tracked |
| CNF | ✗ | — | — | — | — | API | Provitamin not tracked |
| AFCD | ✗ | — | — | — | — | CSV | Provitamin not tracked |
| CoFID | ✗ | — | — | — | — | CSV | Provitamin not tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Provitamin not tracked |
| FOODfiles | ✗ | — | — | — | — | CSV | Provitamin not tracked |
| Fineli | ✗ | — | — | — | — | CSV | Provitamin not tracked |
| BLS | ✗ | — | — | — | — | CSV | Provitamin not tracked |
| NEVO | ✗ | — | — | — | — | CSV | Provitamin not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Provitamin not tracked |
| FRIDA | ✗ | — | — | — | — | CSV | Provitamin not tracked |
| MEXT | ✗ | — | — | — | — | CSV | Provitamin not tracked |
| KFCT | ✗ | — | — | — | — | CSV | Provitamin not tracked |
| INDB | ✗ | — | — | — | — | CSV | Provitamin not tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Provitamin not tracked |
| FooDB | ✓ | FDB008430 | Dexpanthenol | — | — | CSV | Provitamin compound |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Not found |

---

### Pantetheine
**Canonical unit:** mg
**Parent:** Pantothenic Acid (B5)
**Notes:** Monomer form (Pantethine is the dimer), CoA precursor
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Metabolite not tracked |
| CNF | ✗ | — | — | — | — | API | Metabolite not tracked |
| AFCD | ✗ | — | — | — | — | CSV | Metabolite not tracked |
| CoFID | ✗ | — | — | — | — | CSV | Metabolite not tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Metabolite not tracked |
| FOODfiles | ✗ | — | — | — | — | CSV | Metabolite not tracked |
| Fineli | ✗ | — | — | — | — | CSV | Metabolite not tracked |
| BLS | ✗ | — | — | — | — | CSV | Metabolite not tracked |
| NEVO | ✗ | — | — | — | — | CSV | Metabolite not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Metabolite not tracked |
| FRIDA | ✗ | — | — | — | — | CSV | Metabolite not tracked |
| MEXT | ✗ | — | — | — | — | CSV | Metabolite not tracked |
| KFCT | ✗ | — | — | — | — | CSV | Metabolite not tracked |
| INDB | ✗ | — | — | — | — | CSV | Metabolite not tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Metabolite not tracked |
| FooDB | ✓ | FDB023172 | Pantetheine | — | — | CSV | Metabolite compound |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Not found |

---

## VITAMIN B6 - PYRIDOXINE (5)

### Vitamin B6
**Canonical unit:** mg
**DV:** 1.7 mg
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1175 | Vitamin B-6 | mg | — | API | SR Legacy 415 |
| CNF | ✓ | 415 | Vitamin B-6 | mg | — | API | Tagname: B6 |
| AFCD | ✓ | Pyridoxine (B6) | Pyridoxine (B6) | mg | — | CSV | Core nutrient |
| CoFID | ✓ | Vitamin B6 (mg) | Vitamin B6 | mg | — | CSV | Sheet 1.5 Vitamins |
| CIQUAL | ✓ | 56500 | Vitamin B6 | mg | — | CSV | INFOODS: VITB6- |
| FOODfiles | ✓ | VITB6A | Vitamin B6 | mg | — | CSV | |
| Fineli | ✓ | VITPYRID | Vitamin B6 (pyridoxine) | mg | — | CSV | WSVITAM class |
| BLS | ✓ | VITB6 | Vitamin B6 | µg | ÷1000 | CSV | Water-soluble vitamins |
| NEVO | ✓ | VITB6 | Pyridoxine (Vit B6) | mg | — | CSV | |
| Matvaretabellen | ✓ | Vit B6 | Vitamin B6 (pyridoxine) | mg | — | API | EuroFIR: VITB6 |
| FRIDA | ✓ | 40 | Vitamin B6 | mg | — | CSV | EuroFIR: VITB6 |
| MEXT | ✓ | col:53 | ビタミンＢ６ | mg | — | CSV | |
| KFCT | ✓ | PYRXN | Pyridoxine | mg | — | CSV | 비타민 B6 |
| INDB | ✓ | vitb6_mg | Vitb6 | mg | — | CSV | |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not tracked |
| FooDB | ✓ | FDB000574 | Pyridoxine | — | — | CSV | Vitamin B6 compound |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | PYRIDOXINE | Pyridoxine | — | — | CSV | Also: VITAMIN-B-6 |

---

### Pyridoxine
**Canonical unit:** mg
**Parent:** Vitamin B6
**Notes:** Alcohol form - most databases track as total B6
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1175 | Vitamin B-6 | mg | — | API | Same as parent (total B6) |
| CNF | ✓ | 415 | Vitamin B-6 | mg | — | API | Same as parent (total B6) |
| AFCD | ✓ | Pyridoxine (B6) | Pyridoxine (B6) | mg | — | CSV | Same as parent |
| CoFID | ✓ | Vitamin B6 (mg) | Vitamin B6 | mg | — | CSV | Same as parent (total B6) |
| CIQUAL | ✓ | 56500 | Vitamin B6 | mg | — | CSV | Same as parent (total B6) |
| FOODfiles | ✓ | VITB6A | Vitamin B6 | mg | — | CSV | Same as parent (total B6) |
| Fineli | ✓ | VITPYRID | Vitamin B6 (pyridoxine) | mg | — | CSV | Same as parent |
| BLS | ✓ | VITB6 | Vitamin B6 | µg | ÷1000 | CSV | Same as parent (total B6) |
| NEVO | ✓ | VITB6 | Pyridoxine (Vit B6) | mg | — | CSV | Same as parent |
| Matvaretabellen | ✓ | Vit B6 | Vitamin B6 (pyridoxine) | mg | — | API | Same as parent |
| FRIDA | ✓ | 40 | Vitamin B6 | mg | — | CSV | Same as parent (total B6) |
| MEXT | ✓ | col:53 | ビタミンＢ６ | mg | — | CSV | Same as parent (total B6) |
| KFCT | ✓ | PYRXN | Pyridoxine | mg | — | CSV | Same as parent |
| INDB | ✓ | vitb6_mg | Vitb6 | mg | — | CSV | Same as parent (total B6) |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not tracked (same as parent) |
| FooDB | ✓ | FDB000574 | Pyridoxine | — | — | CSV | Specific compound |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | PYRIDOXINE | Pyridoxine | — | — | CSV | Specific compound |

---

### Pyridoxal
**Canonical unit:** mg
**Parent:** Vitamin B6
**Notes:** Aldehyde form - specific vitamer not tracked separately
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Vitamer not tracked separately |
| CNF | ✗ | — | — | — | — | API | Vitamer not tracked separately |
| AFCD | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| CoFID | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| CIQUAL | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| FOODfiles | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| Fineli | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| BLS | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| NEVO | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| Matvaretabellen | ✗ | — | — | — | — | API | Vitamer not tracked separately |
| FRIDA | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| MEXT | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| KFCT | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| INDB | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| FooDB | ✓ | FDB011169 | Pyridoxal | — | — | CSV | Specific vitamer compound |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Not found |

---

### Pyridoxamine
**Canonical unit:** mg
**Parent:** Vitamin B6
**Notes:** Amine form - specific vitamer not tracked separately
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Vitamer not tracked separately |
| CNF | ✗ | — | — | — | — | API | Vitamer not tracked separately |
| AFCD | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| CoFID | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| CIQUAL | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| FOODfiles | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| Fineli | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| BLS | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| NEVO | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| Matvaretabellen | ✗ | — | — | — | — | API | Vitamer not tracked separately |
| FRIDA | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| MEXT | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| KFCT | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| INDB | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Vitamer not tracked separately |
| FooDB | ✓ | FDB021819 | Pyridoxamine | — | — | CSV | Specific vitamer compound |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Not found |

---

### Pyridoxal-5-Phosphate (P5P)
**Canonical unit:** mg
**Parent:** Vitamin B6
**Notes:** Active coenzyme form, used in supplements
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Coenzyme not tracked |
| CNF | ✗ | — | — | — | — | API | Coenzyme not tracked |
| AFCD | ✗ | — | — | — | — | CSV | Coenzyme not tracked |
| CoFID | ✗ | — | — | — | — | CSV | Coenzyme not tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Coenzyme not tracked |
| FOODfiles | ✗ | — | — | — | — | CSV | Coenzyme not tracked |
| Fineli | ✗ | — | — | — | — | CSV | Coenzyme not tracked |
| BLS | ✗ | — | — | — | — | CSV | Coenzyme not tracked |
| NEVO | ✗ | — | — | — | — | CSV | Coenzyme not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Coenzyme not tracked |
| FRIDA | ✗ | — | — | — | — | CSV | Coenzyme not tracked |
| MEXT | ✗ | — | — | — | — | CSV | Coenzyme not tracked |
| KFCT | ✗ | — | — | — | — | CSV | Coenzyme not tracked |
| INDB | ✗ | — | — | — | — | CSV | Coenzyme not tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Coenzyme not tracked |
| FooDB | ✓ | FDB021820 | Pyridoxal 5'-phosphate | — | — | CSV | Active coenzyme compound |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Not found |

---

## VITAMIN B7 - BIOTIN (1)

### Biotin (B7)
**Canonical unit:** μg
**DV:** 30 μg
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1176 | Biotin | µg | — | API | SR Legacy 416; sparse data |
| CNF | ✓ | 416 | Biotin | µg | — | API | Symbol: BIOT |
| AFCD | ✓ | Biotin (B7) | Biotin (B7) | µg | — | CSV | INFOODS: BIOT |
| CoFID | ✓ | Biotin (µg) | Biotin | µg | — | CSV | |
| CIQUAL | ✗ | — | — | — | — | CSV | Not tracked |
| FOODfiles | ✓ | BIOT | Biotin | µg | — | CSV | |
| Fineli | ✗ | — | — | — | — | CSV | Not tracked |
| BLS | ✓ | BIOT | Biotin | µg | — | CSV | Water-soluble vitamins |
| NEVO | ✗ | — | — | — | — | CSV | Not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Not tracked |
| FRIDA | ✓ | 42 | Biotin | µg | — | CSV | EuroFIR: BIOT |
| MEXT | ✓ | col:57 | ビオチン | µg | — | CSV | |
| KFCT | ✓ | BIOT | Biotin | µg | — | CSV | 비오틴 |
| INDB | ✗ | — | — | — | — | CSV | Not tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not tracked |
| FooDB | ✓ | FDB014510 | Biotin | — | — | CSV | Vitamin B7 compound |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | BIOTIN | Biotin | — | — | CSV | |

---

## VITAMIN B9 - FOLATE (5)

### Folate (Total)
**Canonical unit:** μg DFE
**DV:** 400 μg
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1190 | Folate, DFE | µg DFE | — | API | SR Legacy 435; also 1177 (total µg) |
| CNF | ✓ | 435 | Folate, DFE | µg DFE | — | API | Also 417 (total) |
| AFCD | ✓ | Dietary folate equivalents | Dietary folate equivalents | µg | — | CSV | Also: Total folates |
| CoFID | ✓ | Folate (µg) | Folate | µg | — | CSV | |
| CIQUAL | ✓ | 56702 | Vitamin B9 (DFE) | µg | — | CSV | INFOODS: FOLDFE |
| FOODfiles | ✓ | FOLDFE | Dietary folate equivalents | µg | — | CSV | Also: FOL (total) |
| Fineli | ✓ | FOL | Folate | µg | — | CSV | WSVITAM class |
| BLS | ✓ | FOL | Folate equivalent | µg | — | CSV | Also: FOLFD (natural) |
| NEVO | ✓ | FOL | Dietary folate equivalents | µg | — | CSV | Folaat equivalenten |
| Matvaretabellen | ✓ | Folat | Vitamin B9 (folate) | µg | — | API | EuroFIR: FOL |
| FRIDA | ✓ | 143 | Folate | µg | — | CSV | EuroFIR: FOL |
| MEXT | ✓ | col:55 | 葉酸 | µg | — | CSV | |
| KFCT | ✓ | FOL | Dietary Folate Equivalent | µg | — | CSV | 엽산(DFE) |
| INDB | ✓ | folate_ug | Folate | µg | — | CSV | |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not tracked |
| FooDB | ✓ | FDB014504 | Folic acid | — | — | CSV | Synthetic form (total not tracked) |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | FOLATE | Folate | — | — | CSV | Also: FOLIC-ACID |

---

### Folic Acid (Synthetic)
**Canonical unit:** μg
**Parent:** Folate
**Notes:** Synthetic form from fortification
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1186 | Folic acid | µg | — | API | SR Legacy 431 |
| CNF | ✓ | 431 | Folic acid | µg | — | API | |
| AFCD | ✓ | Folic acid | Folic acid | µg | — | CSV | |
| CoFID | ✗ | — | — | — | — | CSV | Not tracked separately |
| CIQUAL | ✓ | 56708 | Folic acid (enrichment) | µg | — | CSV | INFOODS: FOLAC |
| FOODfiles | ✓ | FOLAC | Folic acid, synthetic | µg | — | CSV | |
| Fineli | ✗ | — | — | — | — | CSV | Not tracked separately |
| BLS | ✓ | FOLAC | Folic acid, synthetic | µg | — | CSV | |
| NEVO | ✓ | FOLAC | Folic acid synthetic | µg | — | CSV | Foliumzuur synthetisch |
| Matvaretabellen | ✗ | — | — | — | — | API | Not tracked separately |
| FRIDA | ✗ | — | — | — | — | CSV | Not tracked separately |
| MEXT | ✗ | — | — | — | — | CSV | Not tracked separately |
| KFCT | ✓ | FOLAC | Folic Acid | µg | — | CSV | 엽산 - 첨가 엽산 |
| INDB | ✗ | — | — | — | — | CSV | Not tracked separately |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not tracked |
| FooDB | ✓ | FDB014504 | Folic acid | — | — | CSV | |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | FOLIC-ACID | Folic acid | — | — | CSV | |

---

### Food Folate (Natural)
**Canonical unit:** μg
**Parent:** Folate
**Notes:** Naturally occurring food folates
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1187 | Folate, food | µg | — | API | SR Legacy 432 |
| CNF | ✓ | 432 | Folate, food | µg | — | API | |
| AFCD | ✓ | Folate, natural | Folate, natural | µg | — | CSV | |
| CoFID | ✗ | — | — | — | — | CSV | Not tracked separately |
| CIQUAL | ✓ | 56704 | Intrinsic folate | µg | — | CSV | INFOODS: FOLFD |
| FOODfiles | ✓ | FOLFD | Folate food, naturally occurring | µg | — | CSV | |
| Fineli | ✗ | — | — | — | — | CSV | Not tracked separately |
| BLS | ✓ | FOLFD | Folate | µg | — | CSV | Natural folate |
| NEVO | ✓ | FOLFD | Folate food | µg | — | CSV | |
| Matvaretabellen | ✗ | — | — | — | — | API | Not tracked separately |
| FRIDA | ✗ | — | — | — | — | CSV | Not tracked separately |
| MEXT | ✗ | — | — | — | — | CSV | Not tracked separately |
| KFCT | ✓ | FOLFD | Food Folate | µg | — | CSV | 엽산 – 식품 엽산 |
| INDB | ✗ | — | — | — | — | CSV | Not tracked separately |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not tracked |
| FooDB | ✗ | — | — | — | — | CSV | Not tracked separately |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Not tracked separately |

---

### 5-MTHF (Methylfolate)
**Canonical unit:** μg
**Parent:** Folate
**Notes:** Active/supplement form
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Supplement form not tracked |
| CNF | ✗ | — | — | — | — | API | Supplement form not tracked |
| AFCD | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| CoFID | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| FOODfiles | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| Fineli | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| BLS | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| NEVO | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Supplement form not tracked |
| FRIDA | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| MEXT | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| KFCT | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| INDB | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| FooDB | ✓ | FDB022600 | 5-Methyltetrahydrofolic acid | — | — | CSV | Active coenzyme form |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Not found |

---

### Folinic Acid
**Canonical unit:** μg
**Parent:** Folate
**Notes:** Supplement form (Leucovorin)
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Supplement form not tracked |
| CNF | ✗ | — | — | — | — | API | Supplement form not tracked |
| AFCD | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| CoFID | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| FOODfiles | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| Fineli | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| BLS | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| NEVO | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Supplement form not tracked |
| FRIDA | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| MEXT | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| KFCT | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| INDB | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| FooDB | ✓ | FDB022689 | 5-Formyltetrahydrofolic acid | — | — | CSV | Leucovorin |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | FOLINIC-ACID | Folinic Acid | — | — | CSV | |

---

## VITAMIN B12 - COBALAMIN (5)

### Vitamin B12 (Total)
**Canonical unit:** μg
**DV:** 2.4 μg
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1178 | Vitamin B-12 | µg | — | API | SR Legacy 418, VITB12 |
| CNF | ✓ | 418 | Vitamin B-12 | µg | — | API | Same as SR Legacy |
| AFCD | ✓ | — | Cobalamin (B12) | µg | — | CSV | Core nutrients |
| CoFID | ✓ | — | Vitamin B12 | µg | — | CSV | Sheet 1.5 Vitamins |
| CIQUAL | ✓ | 56600 | Vitamin B12 | µg | — | CSV | VITB12 |
| FOODfiles | ✓ | VITB12 | Vitamin B12 | µg | — | CSV | |
| Fineli | ✓ | VITB12 | Vitamin B12 | µg | — | CSV | WSVITAM category |
| BLS | ✓ | VITB12 | Vitamin B12 (cobalamin) | µg | — | CSV | Water-soluble vitamins |
| NEVO | ✓ | VITB12 | Cobalamin (Vit B12) | µg | — | CSV | Water soluble vitamins |
| Matvaretabellen | ✓ | Vit B12 | Vitamin B12 (cobalamin) | µg | — | API | EuroFIR VITB12 |
| FRIDA | ✓ | 38 | Vitamin B12 | µg | — | CSV | B12-vitamin (DK), VITB12 |
| MEXT | ✓ | col:54 | ビタミンＢ１２ | µg | — | CSV | Vitamin B12 |
| KFCT | ✓ | VITB12 | 비타민 B12 | µg | — | CSV | Cyanocobalamin |
| INDB | ✗ | — | — | — | — | CSV | Not in database |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in database |
| FooDB | ✓ | FDB013264 | Cyanocobalamin | — | — | CSV | Also FDB003166 Hydroxycobalamin |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | VITAMIN-B12 | Vitamin B12 | — | — | CSV | Also CYANOCOBALAMIN, COBALAMINE |

---

### Cyanocobalamin
**Canonical unit:** μg
**Parent:** Vitamin B12
**Notes:** Common supplement form
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Supplement form not tracked |
| CNF | ✗ | — | — | — | — | API | Supplement form not tracked |
| AFCD | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| CoFID | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| FOODfiles | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| Fineli | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| BLS | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| NEVO | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Supplement form not tracked |
| FRIDA | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| MEXT | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| KFCT | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| INDB | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| FooDB | ✓ | FDB013264 | Cyanocobalamin | — | — | CSV | Common supplement form |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | CYANOCOBALAMIN | Cyanocobalamin | — | — | CSV | |

---

### Methylcobalamin
**Canonical unit:** μg
**Parent:** Vitamin B12
**Notes:** Active/supplement form
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Supplement form not tracked |
| CNF | ✗ | — | — | — | — | API | Supplement form not tracked |
| AFCD | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| CoFID | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| FOODfiles | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| Fineli | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| BLS | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| NEVO | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Supplement form not tracked |
| FRIDA | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| MEXT | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| KFCT | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| INDB | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| FooDB | ✓ | FDB022939 | Methylcobalamin | — | — | CSV | Active coenzyme form |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Not found |

---

### Adenosylcobalamin
**Canonical unit:** μg
**Parent:** Vitamin B12
**Notes:** Active form (Dibencozide)
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Supplement form not tracked |
| CNF | ✗ | — | — | — | — | API | Supplement form not tracked |
| AFCD | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| CoFID | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| FOODfiles | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| Fineli | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| BLS | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| NEVO | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Supplement form not tracked |
| FRIDA | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| MEXT | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| KFCT | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| INDB | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| FooDB | ✓ | FDB022837 | Adenosylcobalamin | — | — | CSV | Active coenzyme form |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Not found |

---

### Hydroxocobalamin
**Canonical unit:** μg
**Parent:** Vitamin B12
**Notes:** Injectable form
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Supplement form not tracked |
| CNF | ✗ | — | — | — | — | API | Supplement form not tracked |
| AFCD | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| CoFID | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| FOODfiles | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| Fineli | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| BLS | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| NEVO | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Supplement form not tracked |
| FRIDA | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| MEXT | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| KFCT | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| INDB | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| FooDB | ✓ | FDB003166 | Hydroxocobalamin | — | — | CSV | Injectable form |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Not found |

---

## CHOLINE (5)

### Choline (Total)
**Canonical unit:** mg
**AI:** 550 mg
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1180 | Choline, total | mg | — | API | SR Legacy 430, CHOLN |
| CNF | ✓ | 430 | Choline, total | mg | — | API | Same as SR Legacy |
| AFCD | ✗ | — | — | — | — | CSV | Not in database |
| CoFID | ✗ | — | — | — | — | CSV | Not in database |
| CIQUAL | ✗ | — | — | — | — | CSV | Not in database |
| FOODfiles | ✓ | CHOLN | Choline | mg | — | CSV | |
| Fineli | ✗ | — | — | — | — | CSV | Not in database |
| BLS | ✗ | — | — | — | — | CSV | Not in database |
| NEVO | ✗ | — | — | — | — | CSV | Not in database |
| Matvaretabellen | ✗ | — | — | — | — | API | Not in database |
| FRIDA | ✓ | 116 | Choline | mg | — | CSV | Cholin (DK), CHOLN |
| MEXT | ✗ | — | — | — | — | CSV | Not in database |
| KFCT | ✗ | — | — | — | — | CSV | Not in database |
| INDB | ✗ | — | — | — | — | CSV | Not in database |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in database |
| FooDB | ✓ | FDB000710 | Choline | — | — | CSV | |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | CHOLINE | Choline | — | — | CSV | |

---

### Free Choline
**Canonical unit:** mg
**Parent:** Choline
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1181 | Choline, free | mg | — | API | SR Legacy 421 |
| CNF | ✓ | 421 | Choline, free | mg | — | API | Same as SR Legacy |
| AFCD | ✗ | — | — | — | — | CSV | Only total tracked |
| CoFID | ✗ | — | — | — | — | CSV | Only total tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Only total tracked |
| FOODfiles | ✗ | — | — | — | — | CSV | Only total tracked |
| Fineli | ✗ | — | — | — | — | CSV | Only total tracked |
| BLS | ✗ | — | — | — | — | CSV | Only total tracked |
| NEVO | ✗ | — | — | — | — | CSV | Only total tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Only total tracked |
| FRIDA | ✗ | — | — | — | — | CSV | Only total tracked |
| MEXT | ✗ | — | — | — | — | CSV | Only total tracked |
| KFCT | ✗ | — | — | — | — | CSV | Only total tracked |
| INDB | ✗ | — | — | — | — | CSV | Only total tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total tracked |
| FooDB | ✗ | — | — | — | — | CSV | Only total tracked |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Only total tracked |

---

### Phosphatidylcholine
**Canonical unit:** mg
**Parent:** Choline
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1182 | Choline, from phosphatidylcholine | mg | — | API | SR Legacy 422 |
| CNF | ✓ | 422 | Choline, from phosphatidylcholine | mg | — | API | Same as SR Legacy |
| AFCD | ✗ | — | — | — | — | CSV | Only total tracked |
| CoFID | ✗ | — | — | — | — | CSV | Only total tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Only total tracked |
| FOODfiles | ✗ | — | — | — | — | CSV | Only total tracked |
| Fineli | ✗ | — | — | — | — | CSV | Only total tracked |
| BLS | ✗ | — | — | — | — | CSV | Only total tracked |
| NEVO | ✗ | — | — | — | — | CSV | Only total tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Only total tracked |
| FRIDA | ✗ | — | — | — | — | CSV | Only total tracked |
| MEXT | ✗ | — | — | — | — | CSV | Only total tracked |
| KFCT | ✗ | — | — | — | — | CSV | Only total tracked |
| INDB | ✗ | — | — | — | — | CSV | Only total tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total tracked |
| FooDB | ✗ | — | — | — | — | CSV | Only total tracked |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | PHOSPHATIDYL-CHOLINE | Phosphatidyl-Choline | — | — | CSV | |

---

### CDP-Choline (Citicoline)
**Canonical unit:** mg
**Parent:** Choline
**Notes:** Supplement form
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Supplement form not tracked |
| CNF | ✗ | — | — | — | — | API | Supplement form not tracked |
| AFCD | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| CoFID | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| FOODfiles | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| Fineli | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| BLS | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| NEVO | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Supplement form not tracked |
| FRIDA | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| MEXT | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| KFCT | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| INDB | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Supplement form not tracked |
| FooDB | ✓ | FDB022608 | Citicoline | — | — | CSV | Found in foods |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Not found |

---

## Notes

- **DFE = Dietary Folate Equivalents**: 1 μg DFE = 1 μg food folate = 0.6 μg folic acid
- **RAE = Retinol Activity Equivalents**: 1 μg RAE = 1 μg retinol = 12 μg beta-carotene
- **NE = Niacin Equivalents**: 1 mg NE = 1 mg niacin = 60 mg tryptophan
- **Vitamin K2 forms (MK-4, MK-7, MK-9)** - FRIDA is notable for having these
- **Supplement forms** - Mostly only available in FooDB; standard nutrition databases report totals only
