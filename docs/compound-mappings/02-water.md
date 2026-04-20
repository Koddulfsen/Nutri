# Water - Compound Source Mappings

> **Category:** 2 of 9 (Core)
> **Compounds:** 1
> **Status:** 1/1 complete ✅

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

### Water
**Canonical unit:** g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1051 | Water | g | 1.0 | API | canonical |
| CNF | ✓ | 255 | MOISTURE | g | 1.0 | API | USDA code |
| AFCD | ✓ | col | Moisture | g | 1.0 | CSV | column name |
| CoFID | ✓ | col | Water (g) | g | 1.0 | CSV | column name |
| CIQUAL | ✓ | 400 | Water | g | 1.0 | CSV | INFOODS: WATER |
| FOODfiles | ✓ | WATER | Water | g | 1.0 | CSV | INFOODS tagname |
| Fineli | ✓ | WATER | Water | g | 1.0 | CSV | EuroFIR code |
| BLS | ✓ | WATER | Wasser | g | 1.0 | CSV | EuroFIR code |
| NEVO | ✓ | WATER | Water total | g | 1.0 | CSV | EuroFIR code |
| Matvaretabellen | ✓ | Vann | Water | g | 1.0 | API | EuroFIR: WATER |
| FRIDA | ✓ | 268 | Vand | g | 1.0 | CSV | EuroFIR: WATER |
| MEXT | ✓ | col:7 | 水分 | g | 1.0 | CSV | column index |
| KFCT | ✓ | WATER | 수분 | g | 1.0 | CSV | INFOODS tagname |
| INDB | ✗ | - | - | - | - | CSV | not available |
| ASEANFOODS | ✓ | WATER | Moisture | g | 1.0 | CSV | INFOODS tagname |
| FooDB | ✗ | - | - | - | - | API | not available |
| Phenol-Explorer | N/A | - | - | - | - | CSV | polyphenols only |
| Duke's | N/A | - | - | - | - | Web | phytochemicals only |

---

## Notes

- Often called "Moisture" in nutrition databases
- AI (Adequate Intake): 3.7L/day men, 2.7L/day women (includes water from food)
