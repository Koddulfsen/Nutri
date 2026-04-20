# Nutri Data Sources

**Last Updated**: 2026-01-16

---

## Current Status

### Integrated Sources

| Source | Country | Type | Mappings | Compounds Added | License |
|--------|---------|------|----------|-----------------|---------|
| USDA FoodData Central | USA | Whole foods | 329 | 105 | CC0 Public Domain |
| Health Canada CNF | Canada | Whole foods | 152 | 0 | Open Government |
| Australia AFCD | Australia | Whole foods | 218 | 8 | Free |
| UK CoFID | UK | Whole foods | 168 | 10 | Open Government |
| CIQUAL | France | Whole foods | 71 | 4 | Open Data |
| FOODfiles 2024 | New Zealand | Whole foods | 184 | 6 | Free w/citation |
| Fineli | Finland | Whole foods | 74 | 6 | CC-BY 4.0 |
| BLS 4.0 | Germany | Whole foods | 137 | 5 | CC-BY 4.0 |
| NEVO 2025 | Netherlands | Whole foods | 118 | 7 | Terms agreement |
| Matvaretabellen | Norway | Whole foods | 57 | 0 | Free w/attribution |
| FRIDA 5.4 | Denmark | Whole foods | 193 | 10 | Attribution |
| MEXT 8th Ed | Japan | Whole foods | 122 | 4 | Public domain |
| KFCT 9th Rev | Korea | Whole foods | 128 | 0 | Public domain |
| INDB 2024 | India | Whole foods | 39 | 0 | Open Access |
| ASEANFOODS | SE Asia | Whole foods | 21 | 0 | Free w/attribution |
| FooDB | Canada | Bioactives | 559 | 388 | Non-commercial* |
| Phenol-Explorer | EU | Polyphenols | 748 | 678 | Free w/citation |

**Total compounds**: 1,605 | **Total mappings**: 3,318

*FooDB requires permission for commercial use (contact shhan@ualberta.ca)

---

## Remaining Whole Foods Sources

No remaining whole foods sources. All major regional databases have been integrated.

---

## Specialized Databases

### Packaged Foods

| Source | Products | Format | License | Download URL | Notes |
|--------|----------|--------|---------|--------------|-------|
| **Open Food Facts** | 4M+ | JSONL/CSV | ODbL (share-alike) | https://world.openfoodfacts.org/data | Keep isolated due to viral license |

Full JSONL (~7GB): https://static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz

### Supplements

| Source | Coverage | Format | License | Download URL | Notes |
|--------|----------|--------|---------|--------------|-------|
| **NIH DSLD** | US supplement labels | CSV/JSON + API | Public Domain | https://dsld.od.nih.gov/ | Ingredients, amounts, claims |

CSV Download: https://datadiscovery.nlm.nih.gov/api/views/wp6t-qxsk/rows.csv?accessType=DOWNLOAD

## Already Integrated (via FooDB/Phenol-Explorer)

| Source | Coverage | Status |
|--------|----------|--------|
| USDA Flavonoid DB | 506 foods, 29 flavonoids | Via FooDB |
| USDA Isoflavone DB | 560 foods | Via FooDB |
| USDA Proanthocyanidin DB | 283 foods | Via FooDB |
| Dr. Duke's Phytochemical | Plant-chemical relationships | Partial via FooDB |

---

## API Access

These sources offer programmatic access:

| Source | API Type | Documentation |
|--------|----------|---------------|
| USDA FDC | REST JSON | https://fdc.nal.usda.gov/api-guide.html |
| Health Canada CNF | REST JSON | https://food-nutrition.canada.ca/api/ |
| Matvaretabellen | REST JSON/EDN | https://www.matvaretabellen.no/api/ |
| Open Food Facts | REST JSON | https://openfoodfacts.github.io/openfoodfacts-server/api/ |
| NIH DSLD | REST JSON | https://dsld.od.nih.gov/api-guide |

---

## Legal Architecture

### Unrestricted (CC0/Open Gov) - Can mix freely
- USDA FoodData Central
- Health Canada CNF
- UK CoFID
- CIQUAL
- BLS 4.0 (Germany)
- NIH DSLD

### Attribution Required
- FooDB (non-commercial or contact for license)
- Phenol-Explorer (cite in publications)
- Fineli (CC-BY 4.0 - cite "Finnish Institute for Health and Welfare, Fineli")
- FOODfiles (cite source)
- FRIDA (credit on each use)
- NEVO (terms of use)
- KFCT (cite source)
- MEXT (public domain, but cite source recommended)
- INDB (open access, cite: Jaacks et al.)
- ASEANFOODS (cite: Institute of Nutrition, Mahidol University)

### Isolated Container (Share-alike)
- Open Food Facts (ODbL) - Keep separate to avoid viral licensing

---

## Integration Status

### Completed (17 sources)
- [x] USDA FDC - 329 mappings, 105 compounds
- [x] Health Canada CNF - 152 mappings
- [x] Australia AFCD - 218 mappings, 8 compounds
- [x] UK CoFID - 168 mappings, 10 compounds
- [x] CIQUAL - 71 mappings, 4 compounds
- [x] FOODfiles 2024 - 184 mappings, 6 compounds
- [x] Fineli - 74 mappings, 6 compounds
- [x] BLS 4.0 - 137 mappings, 5 compounds
- [x] NEVO 2025 - 118 mappings, 7 compounds
- [x] Matvaretabellen - 57 mappings
- [x] FRIDA 5.4 - 193 mappings, 10 compounds
- [x] MEXT 8th Ed - 122 mappings, 4 compounds
- [x] KFCT 9th Rev - 128 mappings
- [x] INDB 2024 - 39 mappings
- [x] ASEANFOODS - 21 mappings
- [x] FooDB - 559 mappings, 388 compounds
- [x] Phenol-Explorer - 748 mappings, 678 compounds

### Specialized (2 sources)
- [ ] Open Food Facts - 4M+ packaged products (isolate due to ODbL)
- [ ] NIH DSLD - Supplement labels, 200k+ products

---

## Unique Value by Source

| Source | Unique Value |
|--------|--------------|
| BLS 4.0 | Largest EU, German foods, newly open license |
| NEVO | Dutch dairy expertise |
| FRIDA 5.4 | Danish foods, biogenic amines, vitamin K2 forms (MK4-10) |
| Matvaretabellen | Norwegian foods, REST API for automation |
| MEXT | Japanese foods, amino acid profiles, fatty acid breakdown |
| KFCT | Korean foods, flavonoid + phenolic acid databases |
| INDB | Indian foods + recipes, first open-access |
| ASEANFOODS | SE Asian regional foods (6 countries) |
| Open Food Facts | Packaged foods, barcodes, Nutri-Score |
| NIH DSLD | Supplement ingredients, claims, amounts |

---

## Notes

### Compound vs Food Data
- **Compound mappings** (current work): Links external nutrient IDs to our compound UUIDs
- **Food data** (next phase): Actual nutritional values per food item
- Current work builds the compound foundation; food import comes after

### Regional Variance
Some databases track cultivar/variety level differences:
- Sweet potato carotenoids: 200-fold variation
- Rice protein: 5-14 g/100g by variety
- Consider for advanced features later

---

## Contaminant Data Sources

**Note**: Our current nutrition sources (CNF, USDA, AFCD, etc.) have NO contaminant data. These specialized sources fill that gap.

### Heavy Metals & General Contaminants

| Source | Country | Data Type | Foods | Format | Download |
|--------|---------|-----------|-------|--------|----------|
| **FDA Total Diet Study** | USA | Per-food concentrations | ~280 | Excel/TXT | https://www.fda.gov/food/fda-total-diet-study-tds/fda-total-diet-study-tds-results |
| **EFSA National Occurrence** | EU | Per-food concentrations | 4,000+ | CSV (Zenodo) | https://zenodo.org/communities/efsa-chem |
| **FDA Transparency Tool** | USA | Regulatory limits | — | Excel | https://hfpappexternal.fda.gov/scripts/fdcc/index.cfm?set=contaminant-levels |

**FDA TDS Coverage**: Pb, Cd, Hg, As, Al, Ni, Cr, U, + 400 pesticides, 3 radionuclides
**EFSA Coverage**: Heavy metals, mycotoxins, processing contaminants, natural toxins, POPs

### Process Contaminants

| Source | Contaminant | Foods | Format | Download |
|--------|-------------|-------|--------|----------|
| **FDA Acrylamide Survey** | Acrylamide | 5,000+ samples | Excel | https://www.fda.gov/food/process-contaminants-food/survey-data-acrylamide-food |
| **EFSA Nitrosamines** | 10 N-nitrosamines | 2,800+ results | CSV (4.9MB) | https://zenodo.org/records/7616501 |
| **EU Open Data 3-MCPD** | 3-MCPD, Glycidyl esters | 7,000+ results | Excel | https://data.europa.eu/data/datasets/occurrence-data-on-mcpd-free-and-ester-form-and-glycidyl-esters-in-various-food-matrices |
| **FDA Furan** | Furan | Limited | Web tables | https://www.fda.gov/food/process-contaminants-food/exploratory-data-furan-food |

### Natural Toxins & Antinutrients

| Source | Compounds | Foods | Format | Download |
|--------|-----------|-------|--------|----------|
| **Harvard Oxalate DB** | Oxalates | Extensive | Excel | https://regepi.bwh.harvard.edu/health/Oxalate/files |
| **FAO PhyFoodComp** | Phytates | 3,377 | PDF | https://www.fao.org/3/i8542en/I8542EN.pdf |
| **EFSA Glycoalkaloids** | Solanine, Chaconine | Potatoes | Excel (Zenodo) | https://zenodo.org/record/3939104 |
| **USDA Proanthocyanidin** | Tannins | 283 | PDF | https://www.ars.usda.gov/ARSUserFiles/80400535/Data/PA/PA02-1.pdf |

### Toxicological Reference Values

| Source | Coverage | Format | Download |
|--------|----------|--------|----------|
| **EFSA OpenFoodTox** | 5,700+ substances (ADI, TDI, ARfD) | Excel (12MB) | https://zenodo.org/records/8120114 |

**Note**: OpenFoodTox provides safety thresholds, NOT per-food concentrations.

### Integration Priority

**Phase 1 (Heavy Metals - Core)**:
1. FDA Total Diet Study (elements data)
2. EFSA OpenFoodTox (reference values for limits)

**Phase 2 (Process Contaminants - Advanced)**:
1. FDA Acrylamide Survey
2. EFSA Nitrosamines
3. EU 3-MCPD data

**Phase 3 (Antinutrients - Advanced)**:
1. Harvard Oxalate Database
2. FAO PhyFoodComp (Phytates)
3. EFSA Glycoalkaloids

### Data Mapping Notes

- **FDA TDS**: Maps to NHANES food codes → USDA FDC → Nutri foods
- **EFSA data**: Uses FoodEx2 food classification system
- **Contact for mapping files**: TDS@fda.hhs.gov (FDA), EFSA data standardisation team
