# Data Source Methodologies

**Last Updated**: 2026-01-14

How each nutrition database sources and compiles its data.

---

## Summary Comparison

| Database | Primary Method | Original Lab Analysis? | Data Sources |
|----------|---------------|------------------------|--------------|
| **USDA FDC** | Lab analysis + literature | Yes (extensive) | USDA labs, contracted labs, industry |
| **Canada CNF** | Borrowed + supplemented | Limited (SNAP-CAN) | ~80% USDA, Canadian analysis programs |
| **Australia AFCD** | Lab analysis | Yes | Australian NATA-accredited labs |
| **FooDB** | Literature compilation | No (aggregator) | USDA, scientific papers, other DBs |
| **Phenol-Explorer** | Literature compilation | No (aggregator) | 638+ peer-reviewed papers, HPLC data |
| **UK CoFID** | Lab analysis | Yes (historic) | UK labs since 1940, 12+ surveys |
| **CIQUAL (France)** | Lab analysis + industry | Yes | ANSES labs, OQALI observatory |
| **FOODfiles (NZ)** | Lab analysis + borrowed | Partial (42% NZ) | NZ/AU labs, UK data |
| **Fineli (Finland)** | Lab analysis + calculated | Yes | Finnish labs, recipe calculations |

---

## Integrated Sources (What We Have)

### USDA FoodData Central
**Method**: Primary laboratory analysis + multi-source aggregation

**How it works**:
- **Foundation Foods**: Samples purchased at retail across US cities. Each food may represent hundreds of analyzed samples. Full metadata: GPS location, cultivar, growing practices, sample date, lot numbers.
- **SR Legacy**: Composited samples sent to USDA-qualified labs and collaborators.
- **Branded Foods**: Industry-provided label data (365,000+ products via public-private partnership).
- **Experimental Foods**: Peer-reviewed research data, alternative farming systems, experimental genotypes.

**Lab methods**: USDA contracts with accredited laboratories. Uses established AOAC methods. Reports Limit of Quantification (LOQ) values.

**Strengths**: Most transparent methodology. Individual sample data available. Tracks variance across locations/seasons.

**Data quality**: High - original analysis with full provenance.

Sources: [FDC About](https://fdc.nal.usda.gov/about-us/), [FDC Foundation Foods](https://fdc.nal.usda.gov/Foundation_Foods_Documentation/), [PMC Paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC8182005/)

---

### Health Canada CNF (Canadian Nutrient File)
**Method**: Borrowed data + Canadian supplementation

**How it works**:
- **Base data**: ~80% derived from USDA National Nutrient Database (up to SR27)
- **Canadian modifications**: Adjusted for Canadian fortification levels and regulatory standards
- **SNAP-CAN program**: Sampling and Nutrient Analysis of Canadian food samples - at least one food category analyzed per year with nationally representative sampling
- **Exclusions**: Foods in USDA not available in Canadian market are removed

**Data quality codes**: Each nutrient value has a numeric flag revealing source type (chemical analysis, calculation, expert estimation).

**Strengths**: Good for Canadian-specific fortification (e.g., vitamin D in milk). Bilingual.

**Limitations**: Derivative database - most data not from original Canadian analysis.

Sources: [CNF About](https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/nutrient-data/canadian-nutrient-file-about-us.html), [CNF User Guide](https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/nutrient-data/canadian-nutrient-file-compilation-canadian-food-composition-data-users-guide.html)

---

### Australia AFCD
**Method**: Primary laboratory analysis (Australian samples)

**How it works**:
- **Sampling**: Foods purchased at retail in capital cities (Sydney, Melbourne, Adelaide historically; national sampling in recent programs)
- **Compositing**: 4-8 purchases for packaged foods, 6-12 for unpackaged. Mixed into single analytical composite.
- **Lab analysis**: All laboratories are ISO17025 accredited by NATA (National Association of Testing Authorities)
- **Special methods**: Red meat (210 items) uses recipe approach - separate lean/fat analysis combined based on measured proportions

**Data spans**: 1980s to present. Analytical techniques have evolved over 40 years.

**Strengths**: True Australian food supply representation. Rigorous lab accreditation.

**Limitations**: Compositing method loses variance information. Some data borrowed from other countries.

Sources: [AFCD About](https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/about-afcd), [AFCD FAQ](https://www.foodstandards.gov.au/science-data/monitoringnutrients/afcd/Faqs)

---

### FooDB
**Method**: Literature aggregation (secondary data)

**How it works**:
- **Compilation sources**: Textbooks, scientific journals, online databases (USDA, Frida, Duke, Phenol-Explorer), flavor/aroma databases, metabolomic databases
- **Alberta Food Metabolome Project**: Some experimental data from analysis of 40+ common foods
- **Cross-linking**: Integrates with HMDB, PubChem, CHEBI, KEGG, NCBI Taxonomy

**Database scope**: 70,000+ distinct compounds, but only ~5% quantified.

**Data fields**: 100+ fields per compound covering nomenclature, structure, chemical class, physico-chemical properties, food sources, color, aroma, taste, physiological effects.

**Strengths**: Largest compound coverage. Rich chemical metadata. Great for bioactive discovery.

**Limitations**: Secondary data quality issues. Poor metadata on analytical methods, cultivars, varieties. Many unquantified compounds.

Sources: [FooDB](https://foodb.ca/), [Wikipedia](https://en.wikipedia.org/wiki/FooDB), [PMC Analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC6081979/)

---

### Phenol-Explorer
**Method**: Systematic literature compilation (curated)

**How it works**:
- **Literature search**: Systematic search of peer-reviewed publications on polyphenol content
- **Data extraction**: 60,832 composition data points from 901 papers, critically evaluated
- **Inclusion criteria**: Proper sample identification, valid analytical methods, appropriate standards
- **Exclusion criteria**: Non-edible plant parts, experimental processing methods, inaccurate polyphenol identification

**Analytical methods documented**: HPLC (most common), GC, capillary electrophoresis. Database records extraction method, hydrolysis type, standard compound used.

**Standardization**: All values converted to mg/100g fresh weight (solids) or mg/100mL (liquids).

**Additional data (v2.0+)**: Metabolite pharmacokinetics from 221 human/animal intervention studies. Retention factors for cooking/processing effects.

**Strengths**: Most rigorous polyphenol database. Full method documentation. Quality-controlled inclusion.

**Limitations**: Limited to polyphenols. Literature-derived (no original analysis).

Sources: [Phenol-Explorer](http://phenol-explorer.eu/), [PubMed Paper](https://pubmed.ncbi.nlm.nih.gov/20428313/), [Database 2.0 Paper](https://academic.oup.com/database/article/doi/10.1093/database/bas031/436481)

---

## Potential Future Sources

### UK CoFID (McCance & Widdowson)
**Method**: Primary laboratory analysis (historic UK reference)

**History**: First systematic British tables published 1921 (Plimmer). McCance & Widdowson first edition 1940. Seventh edition 2014.

**How it works**:
- **Sampling**: Market-share weighted sampling accounting for retail outlets, origin, and quality
- **Analysis**: 12+ analytical surveys since 2002. Laboratories include Leatherhead Food R.A. and Government Chemist
- **Updates**: All values reviewed for current representativeness. Processed foods reformulated for salt/sugar/fat reduction tracked.

**Data types**: Mix of direct analysis and calculated values for composite dishes.

**Strengths**: 85+ year history. UK-specific formulations. Trusted reference.

Sources: [CoFID GOV.UK](https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid), [2021 Dataset PDF](https://assets.publishing.service.gov.uk/media/60538e66d3bf7f03249bac58/McCance_and_Widdowsons_Composition_of_Foods_integrated_dataset_2021.pdf)

---

### CIQUAL (France)
**Method**: Primary laboratory analysis + industry data

**How it works**:
- **Lab analysis**: Samples selected based on French consumption habits. Rigorous lab selection procedure.
- **OQALI Observatory**: Annual sampling/analysis programs. Collects data from operators, distributors, inter-professional bodies.
- **Industry data**: Nutrition labeling data from processed foods included.

**Technical details**: Uses Jones factors for protein conversion (6.38 dairy, 5.95 rice, etc.). All values per 100g edible portion.

**Coverage**: 3,484 foods, 74 constituents. One of most comprehensive EU tables.

**Strengths**: French food supply specific. Open Data license. Regular updates.

Sources: [ANSES CIQUAL](https://www.anses.fr/en/content/ciqual-nutritional-composition-table), [Zenodo 2025](https://zenodo.org/records/17550133)

---

### FOODfiles (New Zealand)
**Method**: Lab analysis + borrowed data

**How it works**:
- **NZ analysis**: 42% from New Zealand labs, 5% Australian sources
- **Borrowed data**: Remaining ~53% from British sources (McCance & Widdowson)
- **Sampling**: Retail purchases reflecting consumer behavior. Composites across varieties, regions, seasons, brands.
- **Labs**: Accredited laboratories in NZ and Australia

**Database scope**: 2,857 foods, 434 nutrients (most comprehensive nutrient coverage).

**Documentation**: Detailed provenance tracking (derivation, source code, method type, acquisition type).

**Strengths**: Most nutrients per food. Good documentation. Updated every ~2 years.

Sources: [FOODfiles](https://www.foodcomposition.co.nz/foodfiles/), [2024 Data Manual](https://www.foodcomposition.co.nz/downloads/new-zealand-food-composition-database-2024-data-manual.pdf)

---

### Fineli (Finland)
**Method**: Lab analysis + recipe calculations

**How it works**:
- **Direct analysis**: Vast majority of values from analytical measurements or derived from similar products
- **Recipe compilation**: 3,000+ dishes compiled from ingredients with individual recipes
- **Cooking adjustments**: Accounts for vitamin losses during cooking (C, thiamine, riboflavin, B12, folate, niacin, B6, A)
- **Version control**: Different versions maintained for longitudinal cohort studies (formulations change over time)

**Technical details**:
- Vitamin A: VITA = retinol + 0.0083 × β-carotene
- Salt: NaCl = 2.548 × Na
- Energy: Atwater factors + polyols

**Strengths**: Nordic food coverage. Recipe-level data. Cooking loss factors.

Sources: [Fineli THL](https://thl.fi/en/topics/lifestyles-and-nutrition/nutrition/fineli-the-national-food-composition-database), [Fineli.fi](https://fineli.fi/fineli/en/index)

---

## Data Quality Hierarchy

Based on methodology, data quality can be ranked:

### Tier 1: Primary Analysis (Highest Quality)
- **USDA FDC Foundation Foods** - Individual sample data, full provenance
- **Australia AFCD** - ISO17025 accredited labs
- **UK CoFID** - 85+ years of UK-specific analysis
- **CIQUAL** - French government lab standards

### Tier 2: Primary + Borrowed Mix
- **FOODfiles NZ** - 42% original, rest borrowed but well-documented
- **Fineli** - Original analysis + calculated recipes
- **Canada CNF** - SNAP-CAN supplements USDA base

### Tier 3: Literature Aggregation (Curated)
- **Phenol-Explorer** - Systematic review with quality criteria
- Quality-controlled inclusion/exclusion

### Tier 4: Literature Aggregation (Broad)
- **FooDB** - Maximum coverage, variable quality
- Many unquantified compounds, poor metadata

---

## Implications for Nutri

### What this means for our data:

1. **Compound mappings are solid**: Our FDC, CNF, AFCD mappings link to authoritative sources with real lab analysis.

2. **FooDB/Phenol-Explorer are discovery tools**: Great for identifying compounds that exist in foods, but actual values need verification from primary sources.

3. **Future integrations should prioritize**:
   - UK CoFID (primary analysis, English, open license)
   - CIQUAL (primary analysis, open data)
   - FOODfiles (most nutrients, good documentation)

4. **Data provenance tracking**: Consider adding quality tier metadata to our compound_sources table.

### Recommended quality fields to add:
```sql
ALTER TABLE compound_sources ADD COLUMN data_quality TEXT;
-- Values: 'primary_analysis', 'primary_borrowed_mix', 'literature_curated', 'literature_broad'

ALTER TABLE compound_sources ADD COLUMN methodology_notes TEXT;
-- Free text for specific notes about the source
```
