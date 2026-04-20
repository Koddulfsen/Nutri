# Energy - Compound Source Mappings

> **Category:** 1 of 9 (Core)
> **Compounds:** 1
> **Status:** 1/1 complete

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

## Compounds

### Energy
**Canonical unit:** kcal
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1008 | Energy | kcal | 1.0 | API | canonical |
| FDC | ✓ | 1062 | Energy | kJ | 0.239 | API | alt unit |
| CNF | ✓ | 208 | ENERGY (KILOCALORIES) | kCal | 1.0 | API | canonical |
| CNF | ✓ | 268 | ENERGY (KILOJOULES) | kJ | 0.239 | API | alt unit |
| AFCD | ✓ | col | Energy, with dietary fibre | kJ | 0.239 | CSV | column name; includes fibre |
| AFCD | ✓ | col | Energy, without dietary fibre | kJ | 0.239 | CSV | column name; excludes fibre |
| CoFID | ✓ | col | Energy (kcal) (kcal) | kcal | 1.0 | CSV | column name, not ID |
| CoFID | ✓ | col | Energy (kJ) (kJ) | kJ | 0.239 | CSV | column name, not ID |
| CIQUAL | ✓ | 327 | Energy, Regulation EU No 1169/2011 | kJ | 0.239 | CSV | EU regulation, kJ |
| CIQUAL | ✓ | 328 | Energy, Regulation EU No 1169/2011 | kcal | 1.0 | CSV | EU regulation, kcal; canonical |
| CIQUAL | ✓ | 332 | Energy, N x Jones' factor, with fibres | kJ | 0.239 | CSV | Jones factor, kJ |
| CIQUAL | ✓ | 333 | Energy, N x Jones' factor, with fibres | kcal | 1.0 | CSV | Jones factor, kcal |
| FOODfiles | ✓ | ENERC | Energy, total metabolisable (kJ) | kJ | 0.239 | CSV | INFOODS tagname |
| FOODfiles | ✓ | ENERC_KCAL | Energy, total metabolisable (kcal) | kcal | 1.0 | CSV | kcal variant |
| FOODfiles | ✓ | ENERC1 | Energy, total metabolisable (kJ, including dietary fibre) | kJ | 0.239 | CSV | with fibre |
| FOODfiles | ✓ | ENERC1_KCAL | Energy, total metabolisable (kcal, including dietary fibre) | kcal | 1.0 | CSV | with fibre, kcal |
| FOODfiles | ✓ | ENERC_FSANZ1 | Energy, total metabolisable, carbohydrate by difference, FSANZ (kJ) | kJ | 0.239 | CSV | FSANZ labelling |
| FOODfiles | ✓ | ENERC_FSANZ1_KCAL | Energy, total metabolisable, carbohydrate by difference, FSANZ (kcal) | kcal | 1.0 | CSV | FSANZ labelling, kcal |
| Fineli | ✓ | ENERC | Energia | kJ | 0.239 | CSV | EuroFIR code; includes fibre |
| BLS | ✓ | ENERCJ | Energie (Kilojoule) | kJ | 0.239 | CSV | EuroFIR-style code |
| BLS | ✓ | ENERCC | Energie (Kilokalorien) | kcal | 1.0 | CSV | EuroFIR-style code |
| NEVO | ✓ | ENERCJ | Energie kJ | kJ | 0.239 | CSV | EuroFIR-style code |
| NEVO | ✓ | ENERCC | Energie kcal | kcal | 1.0 | CSV | EuroFIR-style code |
| Matvaretabellen | ✗ | - | - | - | - | API | not in nutrient list; calculate from macros |
| FRIDA | ✓ | 137 | Energy (kJ) | kJ | 0.239 | CSV | calculated |
| FRIDA | ✓ | 316 | Energy, labelling (kJ) | kJ | 0.239 | CSV | for food labels |
| FRIDA | ✓ | 356 | Energy (kcal) | kcal | 1.0 | CSV | calculated |
| FRIDA | ✓ | 359 | Energy, labelling (kcal) | kcal | 1.0 | CSV | for food labels |
| MEXT | ✓ | col:5 | エネルギー | kcal | 1.0 | CSV | column index; single Energy column |
| KFCT | ✓ | ENERC | Energy | kcal | 1.0 | CSV | INFOODS tagname; Korea uses kcal |
| INDB | ✓ | energy_kj | Energy | kJ | 0.239 | CSV | IFCT 2017 uses kJ |
| INDB | ✓ | energy_kcal | Energy | kcal | 1.0 | CSV | IFCT 2004 uses kcal |
| ASEANFOODS | ✓ | ENERC | Energy | kcal | 1.0 | CSV | INFOODS tagname; kcal only |
| FooDB | ✓ | 38 | Energy | kcal | 1.0 | CSV | FDBN00038 |
| Phenol-Explorer | ✗ | - | - | - | - | CSV | polyphenols only |
| Duke's | ✗ | - | - | - | - | Web | phytochemicals only |

---

## Notes

- Most sources provide both kcal and kJ - map both with appropriate conversion
- Conversion: 1 kcal = 4.184 kJ, so kJ → kcal = multiply by 0.239
