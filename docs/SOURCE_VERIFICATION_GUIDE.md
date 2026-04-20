# Source Verification Guide

**Purpose**: Audit each mapped source to ensure complete and correct compound coverage
**Last Updated**: 2026-01-18

---

## Overview

After mapping compounds from external sources, verify:
1. All selected compounds were mapped (none accidentally skipped)
2. Mappings point to correct Nutri compounds
3. No duplicate or orphaned mappings exist

---

## Verification Checklist (Per Source)

For each of the 18 mapped sources:

### 1. Mapping Completeness
- [ ] Count mappings in database matches expected from tracker
- [ ] Identify any gaps (selected but not mapped)

### 2. Compound Coverage
- [ ] Compounds mapped to existing Nutri compounds
- [ ] New compounds added from this source
- [ ] Compound types are appropriate

### 3. Data Quality
- [ ] No duplicate mappings (same external_id mapped twice)
- [ ] All mappings have valid compound_id
- [ ] Canonical flags are set

### 4. Documentation
- [ ] Tracker document exists and is complete

---

## All Sources (compound_sources table)

| # | Source | Code | Mappings |
|---|--------|------|----------|
| 1 | USDA FoodData Central | FDC | 329 |
| 2 | Canadian Nutrient File | CNF | 152 |
| 3 | Australian Food Composition | AFCD | 218 |
| 4 | UK Composition of Foods | UK_COFID | 168 |
| 5 | French CIQUAL | CIQUAL | 71 |
| 6 | Danish Frida | FRIDA | 193 |
| 7 | Finnish Fineli | FINELI | 74 |
| 8 | Dutch NEVO | NEVO | 118 |
| 9 | German BLS | BLS | 137 |
| 10 | Japanese MEXT | MEXT | 122 |
| 11 | Korean KFCT | KFCT | 128 |
| 12 | Norwegian Matvaretabellen | MATVARETABELLEN | 57 |
| 13 | Swedish Foodfiles | FOODFILES | 184 |
| 14 | Indian INDB | INDB | 39 |
| 15 | ASEAN Foods | ASEANFOODS | 21 |
| 16 | FooDB | FOODB | 559 |
| 17 | Phenol-Explorer | PHENOL_EXPLORER | 748 |
| 18 | Dr. Duke's | DUKE | 685 |

**Total**: 4,003 mappings → 1,928 unique compounds

---

## Verification Script

```bash
# Check all sources
npx tsx scripts/verify-source.ts

# Check specific source
npx tsx scripts/verify-source.ts --source=FDC
npx tsx scripts/verify-source.ts --source=DUKE
```

Output includes:
- Total mappings
- Unique compounds
- Compound type distribution
- Duplicate check
- Canonical flag check

---

## Common SQL Checks

### Duplicate Mappings
```sql
SELECT external_source, external_id, COUNT(*)
FROM compound_sources
GROUP BY external_source, external_id
HAVING COUNT(*) > 1;
```

### Cross-Source Coverage
```sql
-- Compounds with most source coverage
SELECT c.name, COUNT(cs.external_source) as sources
FROM compound_sources cs
JOIN compounds c ON c.id = cs.compound_id
GROUP BY c.id, c.name
ORDER BY sources DESC
LIMIT 20;
```

### Missing Expected Mappings
```sql
-- Core nutrients that should have FDC mapping
SELECT c.name FROM compounds c
WHERE NOT EXISTS (
  SELECT 1 FROM compound_sources cs
  WHERE cs.compound_id = c.id AND cs.external_source = 'FDC'
)
AND c.compound_type IN ('VITAMIN', 'MINERAL', 'MACRONUTRIENT');
```
