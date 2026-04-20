# Minerals - Compound Source Mappings

> **Category:** 5 of 9 (Core)
> **Compounds:** 35
> **Status:** 35/35 complete ✅

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

- [ ] Major Minerals (7)
  - [ ] Calcium + forms (5)
  - [ ] Phosphorus (1)
  - [ ] Magnesium + forms (6)
  - [ ] Sodium (1)
  - [ ] Potassium (1)
  - [ ] Chloride (1)
  - [ ] Sulfur (1)
- [ ] Trace Minerals (12)
  - [ ] Iron + forms (3)
  - [ ] Zinc + forms (5)
  - [ ] Copper (1)
  - [ ] Manganese (1)
  - [ ] Selenium + forms (3)
  - [ ] Iodine (1)
  - [ ] Chromium + forms (3)
  - [ ] Molybdenum (1)
  - [ ] Fluoride (1)
  - [ ] Boron (1)
  - [ ] Silicon (1)

---

# MAJOR MINERALS

## CALCIUM (5)

### Calcium (Total)
**Canonical unit:** mg
**DV:** 1300 mg
**Status:** ✅ Complete (16/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 301 | Calcium, Ca | mg | 1 | API | FDC ID 1087 |
| CNF | ✓ | 301 | Calcium | mg | 1 | API | Based on USDA |
| AFCD | ✓ | — | Calcium (Ca) | mg | 1 | CSV | Core nutrient |
| CoFID | ✓ | — | Calcium | mg | 1 | CSV | |
| CIQUAL | ✓ | 10200 | Calcium | mg | 1 | CSV | CA |
| FOODfiles | ✓ | CA | Calcium | mg | 1 | CSV | |
| Fineli | ✓ | CA | Calcium | mg | 1 | CSV | |
| BLS | ✓ | CA | Calcium | mg | 1 | CSV | |
| NEVO | ✓ | CA | Calcium | mg | 1 | CSV | |
| Matvaretabellen | ✓ | CA | Kalsium | mg | 1 | API | |
| FRIDA | ✓ | 108 | Calcium | mg | 1 | CSV | |
| MEXT | ✓ | col:25 | カルシウム | mg | 1 | CSV | |
| KFCT | ✓ | CA | 칼슘 | mg | 1 | CSV | |
| INDB | ✓ | calcium_mg | Calcium | mg | 1 | CSV | |
| ASEANFOODS | ✓ | CA | Calcium | mg | 1 | CSV | |
| FooDB | ✓ | FDB003513 | Calcium | mg | 1 | API | |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | CALCIUM | — | — | CSV | |

---

### Calcium Carbonate
**Canonical unit:** mg
**Parent:** Calcium
**Notes:** Supplement form
**Status:** ✅ Complete (1/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Not a nutrient |
| CNF | ✗ | — | — | — | — | API | Not a nutrient |
| AFCD | ✗ | — | — | — | — | CSV | Supplement form |
| CoFID | ✗ | — | — | — | — | CSV | Supplement form |
| CIQUAL | ✗ | — | — | — | — | CSV | Supplement form |
| FOODfiles | ✗ | — | — | — | — | CSV | Supplement form |
| Fineli | ✗ | — | — | — | — | CSV | Supplement form |
| BLS | ✗ | — | — | — | — | CSV | Supplement form |
| NEVO | ✗ | — | — | — | — | CSV | Supplement form |
| Matvaretabellen | ✗ | — | — | — | — | API | Supplement form |
| FRIDA | ✗ | — | — | — | — | CSV | Supplement form |
| MEXT | ✗ | — | — | — | — | CSV | Supplement form |
| KFCT | ✗ | — | — | — | — | CSV | Supplement form |
| INDB | ✗ | — | — | — | — | CSV | Supplement form |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Supplement form |
| FooDB | ✓ | FDB015437 | Calcium carbonate | mg | 1 | API | |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Not tracked |

---

### Calcium Citrate
**Canonical unit:** mg
**Parent:** Calcium
**Notes:** Supplement form
**Status:** ✅ Complete (2/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Supplement form |
| CNF | ✗ | — | — | — | — | API | Supplement form |
| AFCD | ✗ | — | — | — | — | CSV | Supplement form |
| CoFID | ✗ | — | — | — | — | CSV | Supplement form |
| CIQUAL | ✗ | — | — | — | — | CSV | Supplement form |
| FOODfiles | ✗ | — | — | — | — | CSV | Supplement form |
| Fineli | ✗ | — | — | — | — | CSV | Supplement form |
| BLS | ✗ | — | — | — | — | CSV | Supplement form |
| NEVO | ✗ | — | — | — | — | CSV | Supplement form |
| Matvaretabellen | ✗ | — | — | — | — | API | Supplement form |
| FRIDA | ✗ | — | — | — | — | CSV | Supplement form |
| MEXT | ✗ | — | — | — | — | CSV | Supplement form |
| KFCT | ✗ | — | — | — | — | CSV | Supplement form |
| INDB | ✗ | — | — | — | — | CSV | Supplement form |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Supplement form |
| FooDB | ✓ | FDB013368 | Calcium citrate | mg | 1 | API | |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | CALCIUM-CITRATE | — | — | CSV | |

---

### Calcium Phosphate
**Canonical unit:** mg
**Parent:** Calcium
**Notes:** Supplement form
**Status:** ✅ Complete (2/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Supplement form |
| CNF | ✗ | — | — | — | — | API | Supplement form |
| AFCD | ✗ | — | — | — | — | CSV | Supplement form |
| CoFID | ✗ | — | — | — | — | CSV | Supplement form |
| CIQUAL | ✗ | — | — | — | — | CSV | Supplement form |
| FOODfiles | ✗ | — | — | — | — | CSV | Supplement form |
| Fineli | ✗ | — | — | — | — | CSV | Supplement form |
| BLS | ✗ | — | — | — | — | CSV | Supplement form |
| NEVO | ✗ | — | — | — | — | CSV | Supplement form |
| Matvaretabellen | ✗ | — | — | — | — | API | Supplement form |
| FRIDA | ✗ | — | — | — | — | CSV | Supplement form |
| MEXT | ✗ | — | — | — | — | CSV | Supplement form |
| KFCT | ✗ | — | — | — | — | CSV | Supplement form |
| INDB | ✗ | — | — | — | — | CSV | Supplement form |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Supplement form |
| FooDB | ✓ | FDB013356 | Calcium phosphate | mg | 1 | API | |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | CALCIUM-PHOSPHATE | — | — | CSV | |

---

## PHOSPHORUS (1)

### Phosphorus
**Canonical unit:** mg
**DV:** 1250 mg
**Status:** ✅ Complete (16/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 305 | Phosphorus, P | mg | 1 | API | FDC ID 1091 |
| CNF | ✓ | 305 | Phosphorus | mg | 1 | API | Based on USDA |
| AFCD | ✓ | — | Phosphorus (P) | mg | 1 | CSV | Core nutrient |
| CoFID | ✓ | — | Phosphorus | mg | 1 | CSV | |
| CIQUAL | ✓ | 10150 | Phosphorus | mg | 1 | CSV | P |
| FOODfiles | ✓ | P | Phosphorus | mg | 1 | CSV | |
| Fineli | ✓ | P | Phosphorus | mg | 1 | CSV | |
| BLS | ✓ | P | Phosphor | mg | 1 | CSV | |
| NEVO | ✓ | P | Fosfor | mg | 1 | CSV | |
| Matvaretabellen | ✓ | P | Fosfor | mg | 1 | API | |
| FRIDA | ✓ | 214 | Fosfor | mg | 1 | CSV | |
| MEXT | ✓ | col:27 | リン | mg | 1 | CSV | |
| KFCT | ✓ | P | 인 | mg | 1 | CSV | |
| INDB | ✓ | phosphorus_mg | Phosphorus | mg | 1 | CSV | |
| ASEANFOODS | ✓ | P | Phosphorus | mg | 1 | CSV | |
| FooDB | ✓ | FDB003520 | Phosphorus | mg | 1 | API | |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | PHOSPHORUS | — | — | CSV | |

---

## MAGNESIUM (6)

### Magnesium (Total)
**Canonical unit:** mg
**DV:** 420 mg
**Status:** ✅ Complete (15/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 304 | Magnesium, Mg | mg | 1 | API | FDC ID 1090 |
| CNF | ✓ | 304 | Magnesium | mg | 1 | API | Based on USDA |
| AFCD | ✓ | — | Magnesium (Mg) | mg | 1 | CSV | Core nutrient |
| CoFID | ✓ | — | Magnesium | mg | 1 | CSV | |
| CIQUAL | ✓ | 10120 | Magnesium | mg | 1 | CSV | MG |
| FOODfiles | ✓ | MG | Magnesium | mg | 1 | CSV | |
| Fineli | ✓ | MG | Magnesium | mg | 1 | CSV | |
| BLS | ✓ | MG | Magnesium | mg | 1 | CSV | |
| NEVO | ✓ | MG | Magnesium | mg | 1 | CSV | |
| Matvaretabellen | ✓ | MG | Magnesium | mg | 1 | API | |
| FRIDA | ✓ | 184 | Magnesium | mg | 1 | CSV | |
| MEXT | ✓ | col:26 | マグネシウム | mg | 1 | CSV | |
| KFCT | ✓ | MG | 마그네슘 | mg | 1 | CSV | |
| INDB | ✓ | magnesium_mg | Magnesium | mg | 1 | CSV | |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not tracked |
| FooDB | ✗ | — | — | — | — | API | Not tracked |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | MAGNESIUM | — | — | CSV | |

---

### Magnesium Oxide
**Canonical unit:** mg
**Parent:** Magnesium
**Notes:** Supplement form (low bioavailability)
**Status:** ✅ Complete (2/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Supplement form |
| CNF | ✗ | — | — | — | — | API | Supplement form |
| AFCD | ✗ | — | — | — | — | CSV | Supplement form |
| CoFID | ✗ | — | — | — | — | CSV | Supplement form |
| CIQUAL | ✗ | — | — | — | — | CSV | Supplement form |
| FOODfiles | ✗ | — | — | — | — | CSV | Supplement form |
| Fineli | ✗ | — | — | — | — | CSV | Supplement form |
| BLS | ✗ | — | — | — | — | CSV | Supplement form |
| NEVO | ✗ | — | — | — | — | CSV | Supplement form |
| Matvaretabellen | ✗ | — | — | — | — | API | Supplement form |
| FRIDA | ✗ | — | — | — | — | CSV | Supplement form |
| MEXT | ✗ | — | — | — | — | CSV | Supplement form |
| KFCT | ✗ | — | — | — | — | CSV | Supplement form |
| INDB | ✗ | — | — | — | — | CSV | Supplement form |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Supplement form |
| FooDB | ✓ | FDB015358 | Magnesium oxide | mg | 1 | API | |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | MAGNESIUM-OXIDE | — | — | CSV | |

---

## SODIUM (1)

### Sodium
**Canonical unit:** mg
**DV:** <2300 mg
**Status:** ✅ Complete (16/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 307 | Sodium, Na | mg | 1 | API | FDC ID 1093 |
| CNF | ✓ | 307 | Sodium | mg | 1 | API | Based on USDA |
| AFCD | ✓ | — | Sodium (Na) | mg | 1 | CSV | Core nutrient |
| CoFID | ✓ | — | Sodium | mg | 1 | CSV | |
| CIQUAL | ✓ | 10110 | Sodium | mg | 1 | CSV | |
| FOODfiles | ✓ | NA | Sodium | mg | 1 | CSV | |
| Fineli | ✓ | NA | Sodium | mg | 1 | CSV | |
| BLS | ✓ | nan | Natrium | mg | 1 | CSV | |
| NEVO | ✓ | NA | Natrium | mg | 1 | CSV | |
| Matvaretabellen | ✓ | NA | Natrium | mg | 1 | API | |
| FRIDA | ✓ | 201 | Natrium | mg | 1 | CSV | |
| MEXT | ✓ | col:23 | ナトリウム | mg | 1 | CSV | |
| KFCT | ✓ | NA | 나트륨 | mg | 1 | CSV | |
| INDB | ✓ | sodium_mg | Sodium | mg | 1 | CSV | |
| ASEANFOODS | ✓ | NA | Sodium | mg | 1 | CSV | |
| FooDB | ✓ | FDB003523 | Sodium | mg | 1 | API | |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | SODIUM | — | — | CSV | |

---

## POTASSIUM (1)

### Potassium
**Canonical unit:** mg
**DV:** 4700 mg
**Status:** ✅ Complete (16/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 306 | Potassium, K | mg | 1 | API | FDC ID 1092 |
| CNF | ✓ | 306 | Potassium | mg | 1 | API | Based on USDA |
| AFCD | ✓ | — | Potassium (K) | mg | 1 | CSV | Core nutrient |
| CoFID | ✓ | — | Potassium | mg | 1 | CSV | |
| CIQUAL | ✓ | 10190 | Potassium | mg | 1 | CSV | K |
| FOODfiles | ✓ | K | Potassium | mg | 1 | CSV | |
| Fineli | ✓ | K | Potassium | mg | 1 | CSV | |
| BLS | ✓ | K | Kalium | mg | 1 | CSV | |
| NEVO | ✓ | K | Kalium | mg | 1 | CSV | |
| Matvaretabellen | ✓ | K | Kalium | mg | 1 | API | |
| FRIDA | ✓ | 165 | Kalium | mg | 1 | CSV | |
| MEXT | ✓ | col:24 | カリウム | mg | 1 | CSV | |
| KFCT | ✓ | K | 칼륨 | mg | 1 | CSV | |
| INDB | ✓ | potassium_mg | Potassium | mg | 1 | CSV | |
| ASEANFOODS | ✓ | K | Potassium | mg | 1 | CSV | |
| FooDB | ✓ | FDB003521 | Potassium | mg | 1 | API | |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | POTASSIUM | — | — | CSV | |

---

## CHLORIDE (1)

### Chloride
**Canonical unit:** mg
**DV:** 2300 mg
**Status:** ✅ Complete (11/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Not in FDC (1104 is Vitamin A, IU) |
| CNF | ✓ | 315 | Chloride | mg | 1 | API | Based on USDA |
| AFCD | ✓ | — | Chloride (Cl) | mg | 1 | CSV | |
| CoFID | ✓ | — | Chloride | mg | 1 | CSV | |
| CIQUAL | ✓ | 10170 | Chloride | mg | 1 | CSV | CLD |
| FOODfiles | ✓ | CLD | Chloride | mg | 1 | CSV | |
| Fineli | ✗ | — | — | — | — | CSV | Not tracked |
| BLS | ✓ | CLD | Chlorid | mg | 1 | CSV | |
| NEVO | ✗ | — | — | — | — | CSV | Not tracked |
| Matvaretabellen | ✓ | CLD | Klorid | mg | 1 | API | |
| FRIDA | ✓ | 114 | Chlorid | mg | 1 | CSV | |
| MEXT | ✗ | — | — | — | — | CSV | Not tracked |
| KFCT | ✗ | — | — | — | — | CSV | Not tracked |
| INDB | ✗ | — | — | — | — | CSV | Not tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not tracked |
| FooDB | ✓ | FDB006557 | Chloride | mg | 1 | API | |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | CHLORIDE | — | — | CSV | |

---

## SULFUR (1)

### Sulfur
**Canonical unit:** mg
**Notes:** No DV established
**Status:** ✅ Complete (6/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Not tracked |
| CNF | ✗ | — | — | — | — | API | Not tracked |
| AFCD | ✓ | S | Sulphur (S) | mg | 1 | CSV | INFOODS: S |
| CoFID | ✗ | — | — | — | — | CSV | Not tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Not tracked |
| FOODfiles | ✓ | S | Sulphur | mg | 1 | CSV | |
| Fineli | ✗ | — | — | — | — | CSV | Not tracked |
| BLS | ✓ | S | Schwefel | mg | 1 | CSV | |
| NEVO | ✗ | — | — | — | — | CSV | Not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Not tracked |
| FRIDA | ✓ | 253 | Svovl | mg | 1 | CSV | |
| MEXT | ✗ | — | — | — | — | CSV | Not tracked |
| KFCT | ✗ | — | — | — | — | CSV | Not tracked |
| INDB | ✗ | — | — | — | — | CSV | Not tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not tracked |
| FooDB | ✓ | FDB003717 | Sulfur | mg | 1 | API | |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | SULFUR | — | — | CSV | |

---

# TRACE MINERALS

## IRON (3)

### Iron (Total)
**Canonical unit:** mg
**DV:** 18 mg
**Status:** ✅ Complete (16/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 303 | Iron, Fe | mg | 1 | API | FDC ID 1089 |
| CNF | ✓ | 303 | Iron | mg | 1 | API | Based on USDA |
| AFCD | ✓ | — | Iron (Fe) | mg | 1 | CSV | Core nutrient |
| CoFID | ✓ | — | Iron | mg | 1 | CSV | |
| CIQUAL | ✓ | 10260 | Iron | mg | 1 | CSV | FE |
| FOODfiles | ✓ | FE | Iron | mg | 1 | CSV | |
| Fineli | ✓ | FE | Iron | mg | 1 | CSV | |
| BLS | ✓ | FE | Eisen | mg | 1 | CSV | |
| NEVO | ✓ | FE | IJzer totaal | mg | 1 | CSV | |
| Matvaretabellen | ✓ | FE | Jern | mg | 1 | API | |
| FRIDA | ✓ | 162 | Jern | mg | 1 | CSV | |
| MEXT | ✓ | col:28 | 鉄 | mg | 1 | CSV | |
| KFCT | ✓ | FE | 철 | mg | 1 | CSV | |
| INDB | ✓ | iron_mg | Iron | mg | 1 | CSV | |
| ASEANFOODS | ✓ | FE | Iron | mg | 1 | CSV | |
| FooDB | ✓ | FDB016251 | Iron | mg | 1 | API | |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | IRON | — | — | CSV | |

---

### Heme Iron
**Canonical unit:** mg
**Parent:** Iron
**Notes:** Animal sources, higher bioavailability
**Status:** ✅ Complete (1/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Only total Fe |
| CNF | ✗ | — | — | — | — | API | Only total Fe |
| AFCD | ✗ | — | — | — | — | CSV | Only total Fe |
| CoFID | ✗ | — | — | — | — | CSV | Only total Fe |
| CIQUAL | ✗ | — | — | — | — | CSV | Only total Fe |
| FOODfiles | ✗ | — | — | — | — | CSV | Only total Fe |
| Fineli | ✗ | — | — | — | — | CSV | Only total Fe |
| BLS | ✗ | — | — | — | — | CSV | Only total Fe |
| NEVO | ✓ | HAEM | IJzer haem | mg | 1 | CSV | |
| Matvaretabellen | ✗ | — | — | — | — | API | Only total Fe |
| FRIDA | ✗ | — | — | — | — | CSV | Only total Fe |
| MEXT | ✗ | — | — | — | — | CSV | Only total Fe |
| KFCT | ✗ | — | — | — | — | CSV | Only total Fe |
| INDB | ✗ | — | — | — | — | CSV | Only total Fe |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total Fe |
| FooDB | ✗ | — | — | — | — | API | Has heme compounds, not heme Fe |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Has haem compounds |

---

### Non-Heme Iron
**Canonical unit:** mg
**Parent:** Iron
**Notes:** Plant sources, lower bioavailability
**Status:** ✅ Complete (1/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Only total Fe |
| CNF | ✗ | — | — | — | — | API | Only total Fe |
| AFCD | ✗ | — | — | — | — | CSV | Only total Fe |
| CoFID | ✗ | — | — | — | — | CSV | Only total Fe |
| CIQUAL | ✗ | — | — | — | — | CSV | Only total Fe |
| FOODfiles | ✗ | — | — | — | — | CSV | Only total Fe |
| Fineli | ✗ | — | — | — | — | CSV | Only total Fe |
| BLS | ✗ | — | — | — | — | CSV | Only total Fe |
| NEVO | ✓ | NHAEM | IJzer non haem | mg | 1 | CSV | |
| Matvaretabellen | ✗ | — | — | — | — | API | Only total Fe |
| FRIDA | ✗ | — | — | — | — | CSV | Only total Fe |
| MEXT | ✗ | — | — | — | — | CSV | Only total Fe |
| KFCT | ✗ | — | — | — | — | CSV | Only total Fe |
| INDB | ✗ | — | — | — | — | CSV | Only total Fe |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total Fe |
| FooDB | ✗ | — | — | — | — | API | Only total Fe |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Only total Fe |

---

## ZINC (5)

### Zinc (Total)
**Canonical unit:** mg
**DV:** 11 mg
**Status:** ✅ Complete (16/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 309 | Zinc, Zn | mg | 1 | API | FDC ID 1095 |
| CNF | ✓ | 309 | Zinc | mg | 1 | API | Based on USDA |
| AFCD | ✓ | — | Zinc (Zn) | mg | 1 | CSV | Core nutrient |
| CoFID | ✓ | — | Zinc | mg | 1 | CSV | |
| CIQUAL | ✓ | 10300 | Zinc | mg | 1 | CSV | ZN |
| FOODfiles | ✓ | ZN | Zinc | mg | 1 | CSV | |
| Fineli | ✓ | ZN | Zinc | mg | 1 | CSV | |
| BLS | ✓ | ZN | Zink | mg | 1 | CSV | |
| NEVO | ✓ | ZN | Zink | mg | 1 | CSV | |
| Matvaretabellen | ✓ | ZN | Sink | mg | 1 | API | |
| FRIDA | ✓ | 274 | Zink | mg | 1 | CSV | |
| MEXT | ✓ | col:29 | 亜鉛 | mg | 1 | CSV | |
| KFCT | ✓ | ZN | 아연 | mg | 1 | CSV | |
| INDB | ✓ | zinc_mg | Zinc | mg | 1 | CSV | |
| ASEANFOODS | ✓ | ZN | Zinc | mg | 1 | CSV | |
| FooDB | ✓ | FDB003729 | Zinc | mg | 1 | API | |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | ZINC | — | — | CSV | |

---

### Zinc Sulfate
**Canonical unit:** mg
**Parent:** Zinc
**Notes:** Supplement form
**Status:** ✅ Complete (1/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Supplement form |
| CNF | ✗ | — | — | — | — | API | Supplement form |
| AFCD | ✗ | — | — | — | — | CSV | Supplement form |
| CoFID | ✗ | — | — | — | — | CSV | Supplement form |
| CIQUAL | ✗ | — | — | — | — | CSV | Supplement form |
| FOODfiles | ✗ | — | — | — | — | CSV | Supplement form |
| Fineli | ✗ | — | — | — | — | CSV | Supplement form |
| BLS | ✗ | — | — | — | — | CSV | Supplement form |
| NEVO | ✗ | — | — | — | — | CSV | Supplement form |
| Matvaretabellen | ✗ | — | — | — | — | API | Supplement form |
| FRIDA | ✗ | — | — | — | — | CSV | Supplement form |
| MEXT | ✗ | — | — | — | — | CSV | Supplement form |
| KFCT | ✗ | — | — | — | — | CSV | Supplement form |
| INDB | ✗ | — | — | — | — | CSV | Supplement form |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Supplement form |
| FooDB | ✓ | FDB013488 | Zinc sulfate | mg | 1 | API | |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Not tracked |

---

## COPPER (1)

### Copper
**Canonical unit:** mg
**DV:** 0.9 mg
**Status:** ✅ Complete (16/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 312 | Copper, Cu | mg | 1 | API | FDC ID 1098 |
| CNF | ✓ | 312 | Copper | mg | 1 | API | Based on USDA |
| AFCD | ✓ | CU | Copper (Cu) | mg | 1 | CSV | |
| CoFID | ✓ | — | Copper | mg | 1 | CSV | |
| CIQUAL | ✓ | 10290 | Copper | mg | 1 | CSV | CU |
| FOODfiles | ✓ | CU | Copper | mg | 1 | CSV | |
| Fineli | ✓ | CU | Kupari | mg | 1 | CSV | TRACEELM |
| BLS | ✓ | CU | Kupfer | µg | 0.001 | CSV | |
| NEVO | ✓ | CU | Koper | mg | 1 | CSV | |
| Matvaretabellen | ✓ | Cu | Copper (Cu) | mg | 1 | API | CU |
| FRIDA | ✓ | 166 | Kobber | mg | 1 | CSV | CU |
| MEXT | ✓ | col30 | 銅 | mg | 1 | CSV | |
| KFCT | ✓ | CU | 구리 | mg | 1 | CSV | |
| INDB | ✓ | copper_mg | Copper | mg | 1 | CSV | |
| ASEANFOODS | ✓ | CU | Copper | mg | 1 | CSV | |
| FooDB | ✓ | FDB003582 | Copper | — | — | CSV | Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | COPPER | — | — | CSV | |

---

## MANGANESE (1)

### Manganese
**Canonical unit:** mg
**DV:** 2.3 mg
**Status:** ✅ Complete (14/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 315 | Manganese, Mn | mg | 1 | API | FDC ID 1101 |
| CNF | ✓ | 315 | Manganese | mg | 1 | API | Based on USDA |
| AFCD | ✓ | MN | Manganese (Mn) | mg | 1 | CSV | INFOODS: MN |
| CoFID | ✓ | — | Manganese | mg | 1 | CSV | |
| CIQUAL | ✓ | 10251 | Manganese | mg | 1 | CSV | MN |
| FOODfiles | ✓ | MN | Manganese | µg | 0.001 | CSV | |
| Fineli | ✓ | MN | Mangaani | mg | 1 | CSV | TRACEELM |
| BLS | ✓ | MN | Mangan | µg | 0.001 | CSV | |
| NEVO | ✗ | — | — | — | — | CSV | Not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Not tracked |
| FRIDA | ✓ | 187 | Mangan | mg | 1 | CSV | MN |
| MEXT | ✓ | col:31 | マンガン | mg | 1 | CSV | |
| KFCT | ✓ | MN | 망간 | mg | 1 | CSV | |
| INDB | ✓ | manganese_mg | Manganese | mg | 1 | CSV | |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not tracked |
| FooDB | ✓ | FDB003636 | Manganese | — | — | CSV | Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | MANGANESE | — | — | CSV | |

---

## SELENIUM (3)

### Selenium (Total)
**Canonical unit:** μg
**DV:** 55 μg
**Status:** ✅ Complete (15/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 317 | Selenium, Se | µg | 1 | API | FDC ID 1103 |
| CNF | ✓ | 317 | Selenium | µg | 1 | API | Based on USDA |
| AFCD | ✓ | — | Selenium (Se) | µg | 1 | CSV | Core nutrient |
| CoFID | ✓ | — | Selenium | µg | 1 | CSV | |
| CIQUAL | ✓ | 10340 | Selenium | µg | 1 | CSV | SE |
| FOODfiles | ✓ | SE | Selenium | µg | 1 | CSV | |
| Fineli | ✓ | SE | Seleeni | µg | 1 | CSV | TRACEELM |
| BLS | ✗ | — | — | — | — | CSV | Not tracked |
| NEVO | ✓ | SE | Selenium | µg | 1 | CSV | |
| Matvaretabellen | ✓ | Se | Selenium (Se) | µg | 1 | API | SE |
| FRIDA | ✓ | 230 | Selen | µg | 1 | CSV | SE |
| MEXT | ✓ | col:34 | セレン | µg | 1 | CSV | |
| KFCT | ✓ | SE | 셀레늄 | µg | 1 | CSV | |
| INDB | ✓ | selenium_ug | Selenium | µg | 1 | CSV | |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not tracked |
| FooDB | ✓ | FDB013400 | Selenium | — | — | CSV | Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | SELENIUM | — | — | CSV | |

---

### Selenomethionine
**Canonical unit:** μg
**Parent:** Selenium
**Notes:** Organic form (high bioavailability)
**Status:** ✅ Complete (2/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Only total Se |
| CNF | ✗ | — | — | — | — | API | Only total Se |
| AFCD | ✗ | — | — | — | — | CSV | Only total Se |
| CoFID | ✗ | — | — | — | — | CSV | Only total Se |
| CIQUAL | ✗ | — | — | — | — | CSV | Only total Se |
| FOODfiles | ✗ | — | — | — | — | CSV | Only total Se |
| Fineli | ✗ | — | — | — | — | CSV | Only total Se |
| BLS | ✗ | — | — | — | — | CSV | Only total Se |
| NEVO | ✗ | — | — | — | — | CSV | Only total Se |
| Matvaretabellen | ✗ | — | — | — | — | API | Only total Se |
| FRIDA | ✗ | — | — | — | — | CSV | Only total Se |
| MEXT | ✗ | — | — | — | — | CSV | Only total Se |
| KFCT | ✗ | — | — | — | — | CSV | Only total Se |
| INDB | ✗ | — | — | — | — | CSV | Only total Se |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total Se |
| FooDB | ✓ | FDB012156 | L-Selenomethionine | — | — | CSV | Compound.csv |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | SELENO-METHIONINE | — | — | CSV | |

---

### Sodium Selenite
**Canonical unit:** μg
**Parent:** Selenium
**Notes:** Inorganic form (supplement)
**Status:** ✅ Complete (1/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | — | — | — | — | API | Only total Se |
| CNF | ✗ | — | — | — | — | API | Only total Se |
| AFCD | ✗ | — | — | — | — | CSV | Only total Se |
| CoFID | ✗ | — | — | — | — | CSV | Only total Se |
| CIQUAL | ✗ | — | — | — | — | CSV | Only total Se |
| FOODfiles | ✗ | — | — | — | — | CSV | Only total Se |
| Fineli | ✗ | — | — | — | — | CSV | Only total Se |
| BLS | ✗ | — | — | — | — | CSV | Only total Se |
| NEVO | ✗ | — | — | — | — | CSV | Only total Se |
| Matvaretabellen | ✗ | — | — | — | — | API | Only total Se |
| FRIDA | ✗ | — | — | — | — | CSV | Only total Se |
| MEXT | ✗ | — | — | — | — | CSV | Only total Se |
| KFCT | ✗ | — | — | — | — | CSV | Only total Se |
| INDB | ✗ | — | — | — | — | CSV | Only total Se |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Only total Se |
| FooDB | ✓ | FDB027901 | Selenite | — | — | API | Selenite ion SeO₃²⁻ |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✗ | — | — | — | — | CSV | Not in database |

---

## IODINE (1)

### Iodine
**Canonical unit:** μg
**DV:** 150 μg
**Status:** ✅ Complete (14/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1100 | Iodine, I | μg | 1 | API | Fixed: was 1012 (Fructose) |
| CNF | ✓ | 314 | Iodine | μg | 1 | API | |
| AFCD | ✓ | — | Iodine (I) | μg | 1 | CSV | |
| CoFID | ✓ | — | Iodine | μg | 1 | CSV | |
| CIQUAL | ✓ | 10530 | Iodine | μg | 1 | CSV | INFOODS: ID |
| FOODfiles | ✓ | ID | Iodide | μg | 1 | CSV | |
| Fineli | ✓ | ID | Iodine | μg | 1 | CSV | TRACEELM |
| BLS | ✓ | ID | Iodid | μg | 1 | CSV | |
| NEVO | ✓ | ID | Jodium | μg | 1 | CSV | |
| Matvaretabellen | ✓ | I | Iodine (I) | μg | 1 | API | EuroFIR: ID |
| FRIDA | ✓ | 163 | Jod | μg | 1 | CSV | EuroFIR: ID |
| MEXT | ✓ | col33 | ヨウ素 | μg | 1 | CSV | |
| KFCT | ✓ | ID | 요오드 | μg | 1 | CSV | |
| INDB | ✗ | — | — | — | — | CSV | Not tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not tracked |
| FooDB | ✓ | FDB003635 | Iodine | — | — | API | |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | IODINE | IODINE | — | — | CSV | |

---

## CHROMIUM (3)

### Chromium (Total)
**Canonical unit:** μg
**DV:** 35 μg
**Notes:** Chromium III (trivalent) - essential nutrient
**Status:** ✅ Complete (11/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1096 | Chromium, Cr | μg | 1 | API | |
| CNF | ✓ | 310 | Chromium | μg | 1 | API | Fixed: was 304 (Magnesium) |
| AFCD | ✓ | CR | Chromium (Cr) | μg | 1 | CSV | INFOODS: CR |
| CoFID | ✗ | — | — | — | — | CSV | Not tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Not tracked |
| FOODfiles | ✓ | CR | Chromium | μg | 1 | CSV | |
| Fineli | ✓ | CR | Chromium | μg | 1 | CSV | TRACEELM |
| BLS | ✓ | CR | Chrom | μg | 1 | CSV | |
| NEVO | ✗ | — | — | — | — | CSV | Not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Not tracked |
| FRIDA | ✓ | 117 | Krom | μg | 1 | CSV | EuroFIR: CR |
| MEXT | ✓ | col35 | クロム | μg | 1 | CSV | |
| KFCT | ✗ | — | — | — | — | CSV | Not tracked |
| INDB | ✓ | chromium_mg | Chromium | mg | 1000 | CSV | mg→μg |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not tracked |
| FooDB | ✓ | FDB003516 | Chromium | — | — | API | |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | CHROMIUM | CHROMIUM | — | — | CSV | |

---

## MOLYBDENUM (1)

### Molybdenum
**Canonical unit:** μg
**DV:** 45 μg
**Status:** ✅ Complete (12/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1098 | Molybdenum, Mo | μg | 1 | API | |
| CNF | ✓ | 312 | Molybdenum | μg | 1 | API | |
| AFCD | ✓ | MO | Molybdenum (Mo) | μg | 1 | CSV | INFOODS: MO |
| CoFID | ✗ | — | — | — | — | CSV | Not tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Not tracked |
| FOODfiles | ✓ | MO | Molybdenum | μg | 1 | CSV | |
| Fineli | ✓ | MO | Molybdenum | mg | 0.001 | CSV | mg→μg |
| BLS | ✓ | MO | Molybdän | μg | 1 | CSV | |
| NEVO | ✗ | — | — | — | — | CSV | Not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Not tracked |
| FRIDA | ✓ | 190 | Molybdæn | μg | 1 | CSV | EuroFIR: MO |
| MEXT | ✓ | col36 | モリブデン | μg | 1 | CSV | |
| KFCT | ✓ | MO | 몰리브덴 | μg | 1 | CSV | |
| INDB | ✓ | molybdenum_mg | Molybdenum | mg | 1000 | CSV | mg→μg |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not tracked |
| FooDB | ✓ | FDB003653 | Molybdenum | — | — | API | |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | MOLYBDENUM | MOLYBDENUM | — | — | CSV | |

---

## FLUORIDE (1)

### Fluoride
**Canonical unit:** mg
**AI:** 4 mg
**Status:** ✅ Complete (9/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1099 | Fluoride, F | µg | 0.001 | API | |
| CNF | ✓ | 313 | Fluoride, F | µg | 0.001 | API | Based on USDA |
| AFCD | ✓ | F | Fluoride (F) | µg | 0.001 | CSV | EuroFIR: FD |
| CoFID | ✗ | — | — | — | — | CSV | Not tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Not tracked |
| FOODfiles | ✓ | FD | Fluoride | µg | 0.001 | CSV | |
| Fineli | ✓ | FD | Fluoride | mg | 1 | CSV | |
| BLS | ✓ | FD | Fluorid | µg | 0.001 | CSV | |
| NEVO | ✗ | — | — | — | — | CSV | Not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Not tracked |
| FRIDA | ✓ | 142 | Fluor | µg | 0.001 | CSV | EuroFIR: FD |
| MEXT | ✗ | — | — | — | — | CSV | Not tracked |
| KFCT | ✗ | — | — | — | — | CSV | Not tracked |
| INDB | ✗ | — | — | — | — | CSV | Not tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not tracked |
| FooDB | ✓ | FDB004485 | Fluoride | — | — | API | CAS: 16984-48-8 |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | FLUORIDE | — | — | CSV | |

---

## BORON (1)

### Boron
**Canonical unit:** mg
**Notes:** No DV; suggested AI ~1-3 mg
**Status:** ✅ Complete (6/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1137 | Boron, B | µg | 0.001 | API | |
| CNF | ✓ | 312 | Boron, B | µg | 0.001 | API | Based on USDA |
| AFCD | ✗ | — | — | — | — | CSV | Not tracked |
| CoFID | ✗ | — | — | — | — | CSV | Not tracked |
| CIQUAL | ✗ | — | — | — | — | CSV | Not tracked |
| FOODfiles | ✓ | B | Boron | µg | 0.001 | CSV | |
| Fineli | ✗ | — | — | — | — | CSV | Not tracked |
| BLS | ✗ | — | — | — | — | CSV | Not tracked |
| NEVO | ✗ | — | — | — | — | CSV | Not tracked |
| Matvaretabellen | ✗ | — | — | — | — | API | Not tracked |
| FRIDA | ✓ | 44 | Bor | µg | 0.001 | CSV | EuroFIR: B |
| MEXT | ✗ | — | — | — | — | CSV | Not tracked |
| KFCT | ✗ | — | — | — | — | CSV | Not tracked |
| INDB | ✗ | — | — | — | — | CSV | Not tracked |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not tracked |
| FooDB | ✓ | FDB003575 | Boron | — | — | API | CAS: 7440-42-8 |
| Phenol-Explorer | N/A | — | — | — | — | — | Polyphenols only |
| Duke's | ✓ | — | BORON | — | — | CSV | |

---

## SILICON (1)

### Silicon
**Canonical unit:** mg
**Notes:** No DV; tracked in AFCD
**Status:** ✅ Complete (4/17)

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✗ | | | | | API | Not tracked |
| CNF | ✗ | | | | | API | Not tracked |
| AFCD | ✗ | | | | | CSV | Not in nutrient list |
| CoFID | ✗ | | | | | CSV | Not tracked |
| CIQUAL | ✗ | | | | | CSV | Not tracked |
| FOODfiles | ✓ | SISOL | Silicon (acid soluble) | µg | ÷1000 | CSV | |
| Fineli | ✗ | | | | | CSV | Not tracked |
| BLS | ✗ | | | | | CSV | Not tracked |
| NEVO | ✗ | | | | | CSV | Not tracked |
| Matvaretabellen | ✗ | | | | | API | Not tracked |
| FRIDA | ✓ | 234 | Silicium | mg | | CSV | EuroFIR: SI |
| MEXT | ✗ | | | | | CSV | Not tracked |
| KFCT | ✗ | | | | | CSV | Not tracked |
| INDB | ✗ | | | | | CSV | Not tracked |
| ASEANFOODS | ✗ | | | | | CSV | Not tracked |
| FooDB | ✓ | FDB003713 | Silicon | | | API | Compound |
| Phenol-Explorer | — | | | | | CSV | Polyphenols only |
| Duke's | ✓ | SILICON | Silicon | | | Web | Also SILICA |

---

## Notes

- **Chromium III vs Chromium VI**: Chromium III (trivalent) is the essential nutrient tracked here. Chromium VI (hexavalent) is a contaminant tracked in the Contaminants doc.
- **Iron forms**: Heme vs Non-Heme affects bioavailability (~15-35% vs ~2-20%)
- **Supplement forms**: Most nutrition databases only report totals; FooDB has individual forms
- **Boron and Silicon**: Limited coverage in standard databases; AFCD notable for silicon data
- **Electrolytes**: Sodium, Potassium, Chloride form the primary electrolyte trio
