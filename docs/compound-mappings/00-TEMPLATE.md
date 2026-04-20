# [CATEGORY NAME] - Compound Source Mappings

> **Category:** X of 9 (Core)
> **Compounds:** N
> **Status:** 0/N complete

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

### Contaminant Sources (for Heavy Metals only)

| Source | Type | Version | Docs |
|--------|------|---------|------|
| FDA TDS | CSV | 2024 | https://www.fda.gov/food/fda-total-diet-study-tds/fda-total-diet-study-tds-results |
| EFSA Occurrence | CSV | 2024 | https://zenodo.org/communities/efsa-chem |

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🟡 | In progress |
| ✅ | Complete |
| ✓ | Source has this compound (mapped) |
| ✗ | Source confirmed does NOT have this compound |
| (blank) | Not yet checked |

---

## Compounds

### [Compound Name]
**Canonical unit:** [unit]
**Status:** ⬜ Not started

| Source | ✓ | ID | Name | Unit | Conv | Type | Notes |
|--------|---|-----|------|------|------|------|-------|
| FDC | | | | | | API | |
| CNF | | | | | | API | |
| AFCD | | | | | | CSV | |
| CoFID | | | | | | CSV | |
| CIQUAL | | | | | | CSV | |
| FOODfiles | | | | | | CSV | |
| Fineli | | | | | | CSV | |
| BLS | | | | | | CSV | |
| NEVO | | | | | | CSV | |
| Matvaretabellen | | | | | | API | |
| FRIDA | | | | | | CSV | |
| MEXT | | | | | | CSV | |
| KFCT | | | | | | CSV | |
| INDB | | | | | | CSV | |
| ASEANFOODS | | | | | | CSV | |
| FooDB | | | | | | API | |
| Phenol-Explorer | | | | | | CSV | |
| Duke's | | | | | | Web | |

**Column definitions:**
- **✓** = Has mapping? (✓ = yes, ✗ = confirmed no, blank = unchecked)
- **ID** = Source's nutrient/compound ID
- **Name** = What source calls this compound
- **Unit** = Source's unit for this compound
- **Conv** = Conversion factor to canonical unit (multiply source value by this)
- **Type** = API or CSV (for implementation reference)
- **Notes** = Variants, canonical flag, special handling

---

## Template Usage

1. Copy this template for new category
2. Update header metadata (category #, compound count)
3. Copy compound section for each compound in category
4. Fill in mappings as you research each source
5. Update status as you go (⬜ → 🟡 → ✅)

### Adding multiple IDs from same source

When a source has multiple IDs for the same compound (e.g., kcal and kJ for Energy):

```markdown
| FDC | ✓ | 1008 | Energy | kcal | 1.0 | API | canonical |
| FDC | ✓ | 1062 | Energy | kJ | 0.239 | API | alt unit |
```

### Marking confirmed absence

When you've verified a source doesn't have a compound:

```markdown
| Phenol-Explorer | ✗ | - | - | - | - | CSV | polyphenols only |
```
