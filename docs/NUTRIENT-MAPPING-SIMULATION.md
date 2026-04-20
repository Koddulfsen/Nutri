# Nutrient Mapping Simulation Results

## Overview

Simulated importing real food-nutrient data through our compound_sources mapping system to test coverage, identify gaps, and validate the mapping approach.

**Date:** 2026-02-06

## Database Coverage

| Source | Mappings |
|--------|----------|
| FooDB | 147 |
| FOODfiles | 130 |
| FRIDA | 127 |
| FDC | 119 |
| CNF | 117 |
| AFCD | 113 |
| BLS | 110 |
| NEVO | 80 |
| CIQUAL | 66 |
| CoFID | 62 |
| KFCT | 57 |
| Fineli | 57 |
| Matvaretabellen | 52 |
| MEXT | 38 |
| INDB | 33 |
| ASEANFOODS | 20 |

**Total:** 188 compounds, 1328 mappings (avg 7.1 per compound)

## Simulation Results

### Fineli (Finland)
- **Data:** 307,834 food-nutrient entries
- **Unique nutrients:** 74
- **Mapped:** 77.3% (237,849 entries)
- **Unmapped:** 22.7% (69,985 entries)

**Top unmapped nutrients:**
- CHOCDF (Carbohydrates by difference) - 4,232 entries
- NACL (Salt) - 4,232 entries
- FIBC (Crude fiber) - 4,231 entries
- NT (Total nitrogen) - 4,230 entries
- ASH (Ash) - 4,207 entries

### FooDB Nutrients (Basic macronutrients)
- **Data:** 116,684 entries
- **Unique nutrients:** 38
- **Mapped:** 37.2% (43,352 entries)
- **Unmapped:** 62.8%

**Coverage note:** We map 5 basic nutrients (Fat, Protein, Carbs, Fiber, Energy). Unmapped items are mostly specific fatty acid codes (18:1, 18:2, 22:5 n-3, etc.)

### FooDB Compounds (Specific chemical compounds)
- **Data:** 383,316 entries
- **Unique compounds:** 109
- **Mapped:** 28.7% (110,073 entries)
- **Unmapped:** 71.3%

**Coverage note:** We have 147 FooDB compound mappings, but many appear infrequently in actual food data.

## Key Findings

### 1. ID Format Issues (Fixed)
FooDB external IDs were stored as "FDB000565" but Content.csv uses "565". Fixed by normalizing IDs during lookup.

### 2. Granularity Differences
FooDB has separate entries for chemical variants:
- 1223: "Ascorbic acid"
- 1224: "L-Ascorbic acid"

We map one but not both. This is expected - databases have different granularity levels.

### 3. Missing Derived Nutrients
Several commonly-used derived/aggregate values aren't compounds we track:
- CHOCDF (Carbs by difference)
- NACL (Salt)
- ASH (Ash content)
- NT (Total nitrogen)

### 4. Fatty Acid Specificity
FooDB tracks 30+ specific fatty acid variants (18:1 cis, 18:1 trans, etc.) that we haven't mapped individually.

## Recommendations

### Immediate (High Impact)
1. Add FooDB mapping for "L-Ascorbic acid" (ID 1224) to Vitamin C
2. Consider adding CHOCDF, NACL as derived values

### Medium Term
1. Expand fatty acid mappings for detailed lipid analysis
2. Add missing vitamin stereoisomers

### Low Priority
1. Ash, nitrogen, and other non-nutrient analytical values
2. Exotic phenolics and flavonoids

## Simulation Scripts

```bash
# Run full simulation
npx tsx scripts/simulate-nutrient-import.ts

# Run specific source
npx tsx scripts/simulate-nutrient-import.ts --source=FooDB
npx tsx scripts/simulate-nutrient-import.ts --source=Fineli

# Check FooDB coverage
npx tsx scripts/analyze-foodb-coverage.ts

# Check vitamin mappings
npx tsx scripts/check-vitamin-mappings.ts
```

## Conclusion

The mapping system works well for core nutrients (77% coverage for Fineli). Coverage gaps are primarily due to:

1. **Granularity differences** - Databases track at different levels of specificity
2. **Derived values** - Some values (ash, nitrogen) aren't compounds
3. **Specific fatty acids** - We have general categories, not all variants

Real-world usage will reveal which gaps matter most for user needs.
