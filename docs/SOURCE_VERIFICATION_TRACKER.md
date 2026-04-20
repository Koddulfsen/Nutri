# Source Verification Tracker

**Purpose**: Track verification status for all 18 mapped sources
**Created**: 2026-01-18

---

## Verification Status

| # | Source | Code | Mappings | Verified | Notes |
|---|--------|------|----------|----------|-------|
| 1 | USDA FoodData Central | FDC | 329 | ✅ | 266 unique compounds |
| 2 | Canadian Nutrient File | CNF | 152 | ✅ | 140 unique compounds |
| 3 | Australian Food Composition | AFCD | 218 | ✅ | 166 unique compounds |
| 4 | UK Composition of Foods | UK_COFID | 168 | ✅ | 133 unique compounds |
| 5 | French CIQUAL | CIQUAL | 71 | ✅ | 69 unique compounds |
| 6 | Danish Frida | FRIDA | 193 | ✅ | 187 unique compounds |
| 7 | Finnish Fineli | FINELI | 74 | ✅ | 72 unique compounds |
| 8 | Dutch NEVO | NEVO | 118 | ✅ | 116 unique compounds |
| 9 | German BLS | BLS | 137 | ✅ | 135 unique compounds |
| 10 | Japanese MEXT | MEXT | 122 | ✅ | 115 unique compounds |
| 11 | Korean KFCT | KFCT | 128 | ✅ | 126 unique compounds |
| 12 | Norwegian Matvaretabellen | MATVARETABELLEN | 57 | ✅ | 56 unique compounds |
| 13 | Swedish Foodfiles | FOODFILES | 184 | ✅ | 178 unique compounds |
| 14 | Indian INDB | INDB | 39 | ✅ | 38 unique compounds |
| 15 | ASEAN Foods | ASEANFOODS | 21 | ✅ | 21 unique compounds |
| 16 | FooDB | FOODB | 559 | ✅ | 559 unique compounds |
| 17 | Phenol-Explorer | PHENOL_EXPLORER | 748 | ✅ | 748 unique compounds |
| 18 | Dr. Duke's | DUKE | 685 | ✅ | 681 unique compounds |

**Total**: 4,003 mappings → 1,928 unique compounds

---

## Verification Checklist

For each source:
- [x] Mapping count matches tracker doc
- [x] No duplicates
- [x] Canonical flags set
- [x] Compound types appropriate

---

## How to Verify

```bash
npx tsx scripts/verify-source.ts --source=FDC
```

---

## Progress

- **Verified**: 18/18 ✅
- **Last Updated**: 2026-01-18
