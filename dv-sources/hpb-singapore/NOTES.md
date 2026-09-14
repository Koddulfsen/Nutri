# Singapore HPB — Source notes

## Authority
- **Singapore Health Promotion Board (HPB)** / Ministry of Health
- Recommended Dietary Allowances for Singapore
- Latest guidance: MOH 2012 RDAs (in use via HealthHub as canonical reference)

## Source material
- HealthHub RDA page: `https://www.healthhub.sg/well-being-and-lifestyle/food-diet-and-nutrition/recommended_dietary_allowances`
- National Nutrition Survey 2019 + 2010 reports (context only; RDA tables on HealthHub)
- Extracted via WebFetch

## Region code
**SINGAPORE** (new — added to `source_region_enum` and `dv_source_preference_enum` via ALTER TYPE migration)

## Value types
- **RDA** (Recommended Dietary Allowance) → Nutri `RDA`
- Energy at 3 PAL levels (Light/Moderate/Vigorous for children; Low/Moderate/Very Active for adults)

## Native age buckets
- Infants: 3-6 mo, 6-9 mo, 9-12 mo (unisex)
- Early children: 1-2, 2-3 y (unisex)
- 3-5 y (unisex)
- 5+ years: M/F split (5-7, 7-10, 10-12, 12-14, 14-16, 16-18)
- Adults: 18-30, 30-60, 60+ (M/F)
- Pregnancy: Full-activity vs reduced-activity split (both rows)
- Lactation: 0-6 mo / 6+ mo

## Special cases

### 1. Vitamin D age cutoff
Children 3 mo - 6 y: 10 µg/d (high due to growth + sun avoidance)
Children 7 - 17 y: **2.5 µg/d** (notably low!)
Adults 18+: 2.5 µg/d
Pregnancy/Lactation: 10 µg/d

### 2. Iron female adult split
- F 18-60: 18 mg (menstruating)
- F 60+: 8 mg (postmenopausal)
Pregnancy: 27 mg
Lactation 0-6 mo: 9 mg (suppressed menstruation)
Lactation 6+ mo: 18 mg

### 3. Iron male adolescent anomaly
- M 12-14: 12 mg
- M 14-16: 12 mg
- **M 16-18: 6 mg** (drops sharply — end of growth spurt)
- M 18+: 8 mg

### 4. Calcium simpler table
Only 4 age bands: 0-12mo, 1-3, 4-6, 7-9, 10-18, 19-50, 51+, Preg/Lact

### 5. Energy 3 activity levels
- Adults: Low / Moderate / Very Active (map to SEDENTARY / MODERATE / ACTIVE)
- Adolescents: Light / Moderate / Vigorous (map same)
- Children 1-5 y: single value (no activity split)

### 6. Pregnancy additions for B-vitamins
Thiamin/Riboflavin/Niacin pregnancy are increments (e.g. "+0.11" thiamin preg). Compute absolute = non-preg adult F base + increment.

### 7. Pregnancy has full-activity vs reduced-activity split
For B-vitamins. Store both with dietary_context? Or average? Use full-activity values as standard (matches typical modern recommendation).

## Compounds covered
**Vitamins (10):** A, D, Thiamin, Riboflavin, Niacin, B6, B12, Folate (as Folic Acid), Vitamin C (Ascorbic Acid)
**Minerals:** Calcium, Iron (only 2 minerals with explicit RDA tables on HealthHub)
**Macros:** Energy (3 PAL levels)
**Missing from HealthHub extract:** Phosphorus, K, Na, Mg, Zn, Iodine, Se, Cu, Vitamin E, K, Pantothenic, Biotin, Choline — likely published in MOH clinical guideline PDFs not captured here. Defer to enrichment.

## Estimated rows
- 10 vitamins × ~20 demographics = ~200
- 2 minerals (Ca, Fe) × ~12 demographics = ~25
- Energy × ~23 ages × 2 sexes × ~3 PALs = ~200
- Total: **~400-500 rows**
