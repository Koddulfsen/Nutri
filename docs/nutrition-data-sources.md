# Nutrition Data Sources Reference

**Purpose**: Comprehensive list of free whole foods nutrition databases
**Focus**: Whole/minimally processed foods only (no branded/packaged products)
**Updated**: 2025-11-18

---

## 🇨🇦 Canadian Nutrient File (CNF) - CURRENTLY USING

**Status**: ✅ Active integration
**Website**: https://food-nutrition.canada.ca/api/canadian-nutrient-file/
**Documentation**: https://produits-sante.canada.ca/api/documentation/cnf-documentation-en.html

### Key Stats
- **Foods**: 5,690 whole foods
- **Nutrients**: 152 nutrients organized in 7 groups
- **API**: Yes, FREE, NO rate limits
- **Download**: Via API only (undocumented feature: GET `/food/` without ID returns full database)
- **License**: Government of Canada data, free use
- **Data Format**: JSON/XML, bilingual (EN/FR)

### Nutrient Groups
1. Proximates (macros, moisture, ash)
2. Other Carbohydrates (fiber, sugars, starch, lactose)
3. Minerals (Ca, Fe, Se, Zn, etc.)
4. Vitamins (A, B-complex, C, D, E, K, folate forms)
5. Amino Acids (20+ essential & non-essential)
6. Lipids (fatty acid breakdown: saturated, mono, poly, trans, omega-3/6)
7. Other Components (caffeine, theobromine, alcohol, aspartame)

### Advantages
- 100% whole foods (no processed/branded items)
- No rate limits
- 24-hour client-side caching possible
- Comprehensive fatty acid profiles
- Data per 100g with serving size conversions

### Limitations
- No food group categorization
- Smaller database than USDA
- No food attributes/tags
- Organ meats rank equally with common cuts in search

### API Endpoints
- `/food/` - Food descriptions and codes
- `/nutrientamount/` - Per-100g nutrient values
- `/servingsize/` - Conversion factors and portions
- `/refuseamount/` - Inedible portion percentages
- `/yieldamount/` - Cooking loss/gain calculations
- `/nutrientname/` - Nutrient definitions (152 total)
- `/nutrientgroup/` - Nutrient category system

---

## 🇺🇸 USDA FoodData Central (FDC)

**Website**: https://fdc.nal.usda.gov/
**API Guide**: https://fdc.nal.usda.gov/api-guide/
**API Spec**: https://fdc.nal.usda.gov/api-spec/fdc_api.html

### Key Stats
- **Foods**: 7,793+ whole foods (Foundation + SR Legacy datasets)
- **Nutrients**: Up to 150 components
- **API**: Yes, FREE (requires data.gov API key)
- **Rate Limit**: 1,000 requests/hour per IP (DEMO_KEY: 30 req/hr)
- **Download**: CSV/JSON available
- **License**: Public domain (CC0 1.0 Universal)

### Data Types (Filter for whole foods)
- **Foundation Foods**: Analytical data on commodity/minimally processed samples
- **SR Legacy**: Standard Reference database (whole foods)
- ❌ Branded Food Products: Skip (packaged/processed)
- ❌ Survey Foods (FNDDS): Skip (prepared dishes)

### Advantages
- Largest government database
- Comprehensive nutrient coverage
- Food portions with gram weights
- Food categories available
- Well-documented API

### Limitations
- Mixed with branded foods (requires filtering)
- Rate limits (especially DEMO_KEY)
- Search returns processed foods unless filtered
- Recent rate limit issues (429 errors)

### Getting Started
1. Sign up for API key at data.gov
2. Filter by `dataType: ['Foundation', 'SR Legacy']`
3. Base URL: `https://api.nal.usda.gov/fdc/v1/`

---

## 🇦🇺 Australian Food Composition Database (AFCD)

**Website**: https://www.foodstandards.gov.au/science-data/monitoringnutrients/afcd
**Data Portal**: https://data.gov.au/dataset/a9159b56-487e-4897-ac45-ab62f7e8d232

### Key Stats
- **Foods**: 1,616 foods available in Australia
- **Nutrients**: Up to 256 nutrients per food (HIGHEST COUNT!)
- **API**: ❌ No API - downloadable files only
- **Download**: FREE Excel/CSV from FSANZ
- **License**: Creative Commons Attribution-ShareAlike 3.0 Australia

### Advantages
- **Highest nutrient count** (256 nutrients)
- Government-verified data
- Regional focus (Australian foods)
- Free download with permissive license

### Limitations
- No API (must import/host data)
- Smaller food count
- Regional specificity may not match North American foods

### Use Case
- Import as secondary database
- Fill nutrient gaps CNF doesn't cover
- 256 nutrients = excellent for compound tracking

---

## 🇬🇧 UK McCance & Widdowson's Composition of Foods (CoFID)

**Website**: https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid
**Searchable Interface**: Available via UK government portal

### Key Stats
- **Foods**: 3,000+ commonly consumed UK foods
- **Nutrients**: Comprehensive macro/micro profiles
- **API**: ❌ No API - downloadable only
- **Download**: FREE from GOV.UK
- **License**: Open Government Licence v3
- **Version**: 2021 (recently updated)

### Advantages
- Well-maintained government database
- Searchable web interface
- Includes recipes and prepared foods
- Regular updates (2021 version added pork cuts)

### Limitations
- No API access
- UK-specific foods may differ from North American equivalents
- Requires manual download and import

---

## 🌍 EuroFIR Network

**Website**: https://www.eurofir.org/
**Tools**: https://www.eurofir.org/food-information/

### Key Stats
- **Coverage**: 26 European countries + Canada, US, NZ, Japan
- **Foods**: Varies by member database
- **API**: Limited/research access only
- **Access**: Web interface (FoodExplorer)
- **Special Tools**:
  - FoodExplorer (multi-country simultaneous search)
  - eBASIS (bioactive compounds database)
  - ePlantLIBRA (plant/supplement bioactives)

### Advantages
- Pan-European harmonized data
- Multi-country comparison
- Bioactive compound focus
- International food standards collaboration (with FAO INFOODS)

### Limitations
- No public API
- Web interface only
- Requires understanding multiple national databases
- Commercial licensing for full access

---

## 🧬 FooDB - PHYTOCHEMICAL DATABASE

**Website**: https://foodb.ca/
**API Documentation**: https://foodb.ca/api_doc

### Key Stats
- **Foods**: 1,000+ raw/unprocessed foods
- **Compounds**: 28,000+ chemicals
- **Focus**: Phytochemicals, flavonoids, polyphenols, food chemistry
- **API**: Yes (beta), FREE for non-commercial use
- **License**: Free access, commercial use requires permission

### Compound Coverage
- Flavonoids (quercetin, kaempferol, etc.)
- Polyphenols (resveratrol, curcumin, etc.)
- Carotenoids (beta-carotene, lycopene, etc.)
- Alkaloids, terpenes, phenolic acids
- Food additives, aroma compounds
- Health effects database

### Advantages
- **Perfect for compound tracking** (28,000+ compounds!)
- Chemical composition data
- Metabolism and biological effects
- Research-grade phytochemical data
- Free API access

### Limitations
- May lack complete basic macro/micro nutrient data
- Focus on chemistry over nutrition
- Smaller food count than national databases
- Beta API (stability unknown)

### Use Case
- **Primary source for 280+ compound tracking**
- Complement CNF/USDA for phytochemicals
- Research-level chemical composition

---

## 📊 Multi-Source Strategy

### Recommended Combination

**Tier 1 - Basic Nutrients (Macros/Micros/Vitamins)**
- Primary: CNF (5,690 foods, 152 nutrients, FREE API, no limits)
- Backup: USDA FDC (larger database, rate limited)

**Tier 2 - Extended Nutrients**
- Import: AFCD (256 nutrients - fill gaps CNF doesn't cover)

**Tier 3 - Phytochemicals/Compounds**
- Primary: FooDB (28,000 compounds)
- Match foods from Tier 1 to FooDB entries

### Hybrid Search Architecture
1. **User searches** → Our custom search index (smart ranking)
2. **User selects food** → Query multiple sources:
   - CNF API (basic nutrients)
   - FooDB API (compounds)
   - AFCD (imported data for extended nutrients)
3. **Merge results** → Unified nutrient profile

---

## 🚫 Excluded Sources (Not Whole Foods Focus)

### Open Food Facts
- **Website**: https://world.openfoodfacts.org/
- **Why excluded**: 2.8M+ packaged/branded products (not whole foods)
- **Crowd-sourced**: Quality varies

### Nutritionix
- **Website**: https://www.nutritionix.com/
- **Why excluded**: Restaurant + grocery brands (not whole foods)

### FatSecret Platform API
- **Website**: https://platform.fatsecret.com/
- **Why excluded**: 1.9M verified items = mostly branded/processed

### Spoonacular
- **Website**: https://spoonacular.com/
- **Why excluded**: Recipe-focused (360K recipes, 80K products)

---

## 📝 Implementation Notes

### Current Integration (Phase 1)
- ✅ CNF API client implemented
- ✅ Search service with CNF fallback
- ✅ Client-side relevance scoring
- ✅ 24-hour caching

### Future Enhancements (Phase 2+)
- [ ] FooDB API integration for compounds
- [ ] AFCD data import for extended nutrients
- [ ] Multi-source nutrient merging
- [ ] Smart food matching across databases
- [ ] Custom search ranking system

### Data Quality Considerations
- **Prefer government databases** (CNF, USDA, AFCD, CoFID) over crowd-sourced
- **Verify nutrient completeness** - some foods have partial data
- **Check data freshness** - use most recent database versions
- **Source tracking** - maintain provenance for user transparency

---

## 🔗 Quick Reference Links

| Database | API | Download | License | Best For |
|----------|-----|----------|---------|----------|
| CNF 🇨🇦 | ✅ Free | Via API | Gov data | Basic nutrients |
| USDA 🇺🇸 | ✅ Rate limited | ✅ CSV/JSON | Public domain | Large coverage |
| AFCD 🇦🇺 | ❌ | ✅ Excel/CSV | CC BY-SA 3.0 | Extended nutrients |
| CoFID 🇬🇧 | ❌ | ✅ Free | OGL v3 | UK foods |
| FooDB 🧬 | ✅ Beta | ❌ | Free (non-commercial) | Phytochemicals |
| EuroFIR 🌍 | ⚠️ Limited | ❌ | Restricted | Research |

---

**Last Updated**: 2025-11-18
**Maintained By**: Nutri Development Team
