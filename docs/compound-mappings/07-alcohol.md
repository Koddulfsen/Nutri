# Alcohol - Compound Source Mappings

> **Category:** 7 of 9 (Core)
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

### Ethanol
**Canonical unit:** g
**Status:** ✅ Complete

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | ✓ | 1018 | Alcohol, ethyl | g | — | API | SR Legacy 221 |
| CNF | ✓ | 221 | Alcohol | g | — | API | Same as SR Legacy |
| AFCD | ✓ | — | Ethanol | g | — | CSV | Core nutrients |
| CoFID | ✓ | — | Alcohol | g | — | CSV | Proximates sheet |
| CIQUAL | ✓ | 60000 | Alcohol | g | — | CSV | INFOODS: ALC |
| FOODfiles | ✓ | ALC | Alcohol | g | — | CSV | |
| Fineli | ✓ | ALC | Alcohol | g | — | CSV | MACROCMP |
| BLS | ✓ | ALC | Alcohol (Ethanol) | g | — | CSV | Proximate |
| NEVO | ✓ | ALC | Alcohol total | g | — | CSV | |
| Matvaretabellen | ✓ | Alko | Alcohol | g | — | API | EuroFIR: ALC |
| FRIDA | ✓ | 19 | Alcohol | g | — | CSV | EuroFIR: ALC |
| MEXT | ✓ | 59 | アルコール | g | — | CSV | Alcohol |
| KFCT | ✗ | — | — | — | — | CSV | Not in database |
| INDB | ✗ | — | — | — | — | CSV | Not in database |
| ASEANFOODS | ✗ | — | — | — | — | CSV | Not in database |
| FooDB | ✓ | FDB000753 | Ethanol | — | — | CSV | |
| Phenol-Explorer | N/A | — | — | — | — | CSV | Polyphenols only |
| Duke's | ✓ | ETHANOL | Ethanol | — | — | CSV | |

---

## Notes

- Often listed as "Alcohol" or "Alcohol, ethyl" in databases
- Energy contribution: 7 kcal/g (not counted in carbs/fat/protein)
- Safety limits vary by region (e.g., <2 standard drinks/day for men, <1 for women)
- 1 standard drink ≈ 14g ethanol (US definition)
