# Food Source Integration Tracker

**Purpose**: Track progress integrating each source into the Add Food workflow
**Created**: 2026-01-18

---

## Progress Overview

| # | Source | Code | Type | Data | Staging | Search API | Nutrients | Frontend | Status |
|---|--------|------|------|------|---------|------------|-----------|----------|--------|
| 1 | Canadian Nutrient File | CNF | API | ✅ | N/A | ✅ | ✅ | ✅ | ✅ Done |
| 2 | USDA FoodData Central | FDC | API | ✅ | N/A | ✅ | ✅ | ✅ | ✅ Done |
| 3 | FooDB | FOODB | Staging | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done |
| 4 | Phenol-Explorer | PHENOL | Staging | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Done |
| 5 | Dr. Duke's | DUKE | Staging | ✅ | ⚠️ Exists | ⬜ | ⬜ | ⬜ | 🔧 Rework |
| 6 | Australian Food Composition | AFCD | Excel | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Todo |
| 7 | UK Composition of Foods | UK_COFID | Excel | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Todo |
| 8 | French CIQUAL | CIQUAL | Excel | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Todo |
| 9 | Danish Frida | FRIDA | Excel | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Todo |
| 10 | Finnish Fineli | FINELI | CSV | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Todo |
| 11 | Dutch NEVO | NEVO | Excel | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Todo |
| 12 | German BLS | BLS | Excel | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Todo |
| 13 | Japanese MEXT | MEXT | Excel | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Todo |
| 14 | Korean KFCT | KFCT | Excel | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Todo |
| 15 | Norwegian Matvaretabellen | MATVARETABELLEN | Excel | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Todo |
| 16 | Swedish Foodfiles | FOODFILES | Excel | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Todo |
| 17 | Indian INDB | INDB | Excel | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Todo |
| 18 | ASEAN Foods | ASEANFOODS | Excel | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Todo |

**Legend:**
- ✅ Complete
- ⚠️ Exists but needs rework
- ⬜ Not started
- 🔧 Needs rework

---

## Status Summary

- **Done**: 4 (CNF, FDC, FooDB, Phenol-Explorer)
- **Rework needed**: 1 (Duke)
- **Todo**: 13 (food composition sources)

---

## Source Details

### 1. CNF - Canadian Nutrient File ✅
- **Type**: Live API
- **Client**: `lib/services/cnf-client.ts`
- **Search route**: `app/api/foods/cnf/search/route.ts`
- **Foods**: ~1,300
- **Nutrients**: ~95
- **Status**: Complete, working in Add Food modal

### 2. FDC - USDA FoodData Central ✅
- **Type**: Live API
- **Client**: `lib/services/usda-client.ts`
- **Search route**: `app/api/foods/fdc/search/route.ts`
- **Foods**: 500k+ (filtered to Foundation/SR Legacy)
- **Nutrients**: ~150
- **Status**: Complete, working in Add Food modal

### 3. FooDB ✅
- **Type**: Staging tables
- **Tables**: `source_foodb_foods`, `source_foodb_compounds`, `source_foodb_content`
- **Foods**: 992
- **Compounds**: ~85,000 (4,003 mapped to Nutri compounds)
- **Client**: `lib/services/foodb-client.ts` (FooDBStagingClient class)
- **Search route**: `app/api/foods/foodb/search/route.ts`
- **Status**: Complete, working in Add Food modal

### 4. Phenol-Explorer ✅
- **Type**: Staging tables
- **Tables**: `source_phenol_foods`, `source_phenol_compounds`, `source_phenol_content`
- **Foods**: 459
- **Compounds**: 501
- **Content rows**: 6,512
- **Search route**: `app/api/foods/phenol/search/route.ts`
- **Nutrient count**: Added to `/api/foods/nutrient-count`
- **Status**: Complete, working in Add Food modal

### 5. Duke 🔧
- **Type**: Staging tables
- **Tables**: `source_duke_plants`, `source_duke_chemicals`, `source_duke_farmacy`
- **Plants**: ~2,300
- **Chemicals**: ~29,000
- **Data**: Downloaded, imported
- **Needs**: Search route, nutrient fetch logic, frontend integration
- **Note**: Currently used for enrichment only, plants not foods

### 6. AFCD - Australian ⬜
- **Data**: `data/afcd/food-details.xlsx`, `nutrient-profiles.xlsx`
- **Needs**: Parse Excel, create staging tables, import, search route

### 7. UK_COFID - UK ⬜
- **Data**: `data/uk-cofid/cofid-2021.xlsx`
- **Needs**: Parse Excel, create staging tables, import, search route

### 8. CIQUAL - French ⬜
- **Data**: `data/ciqual/`
- **Needs**: Parse data, create staging tables, import, search route

### 9. FRIDA - Danish ⬜
- **Data**: `data/frida/`
- **Needs**: Parse data, create staging tables, import, search route

### 10. FINELI - Finnish ⬜
- **Data**: `data/fineli/` (CSV files: foodname_EN.csv, component_value.csv)
- **Needs**: Parse CSV, create staging tables, import, search route

### 11. NEVO - Dutch ⬜
- **Data**: `data/nevo/`
- **Needs**: Parse data, create staging tables, import, search route

### 12. BLS - German ⬜
- **Data**: `data/bls/BLS_4_0_2025_DE/BLS_4_0_Daten_2025_DE.xlsx`
- **Needs**: Parse Excel, create staging tables, import, search route

### 13. MEXT - Japanese ⬜
- **Data**: `data/mext/`
- **Needs**: Parse data, create staging tables, import, search route

### 14. KFCT - Korean ⬜
- **Data**: `data/kfct/`
- **Needs**: Parse data, create staging tables, import, search route

### 15. MATVARETABELLEN - Norwegian ⬜
- **Data**: `data/matvaretabellen/`
- **Needs**: Parse data, create staging tables, import, search route

### 16. FOODFILES - Swedish ⬜
- **Data**: `data/foodfiles/`
- **Needs**: Parse data, create staging tables, import, search route

### 17. INDB - Indian ⬜
- **Data**: `data/indb/`
- **Needs**: Parse data, create staging tables, import, search route

### 18. ASEANFOODS ⬜
- **Data**: `data/aseanfoods/`
- **Needs**: Parse data, create staging tables, import, search route

---

## Next Steps

1. ~~Start with FooDB (staging tables exist, just needs search route)~~ ✅ Done
2. ~~Phenol-Explorer~~ ✅ Done
3. Duke (staging tables exist, plants not foods - may need different approach)
4. Then tackle Excel/CSV sources one by one

---

## Recent Changes

### 2026-01-22: Phenol-Explorer Integration Complete
- Created search API: `app/api/foods/phenol/search/route.ts`
- Applied token-based scoring algorithm (same as CNF/FDC)
- Added PHENOL support to nutrient-count API
- Enabled in frontend source-config.ts
- **Data**: 459 foods, 501 compounds, 6,512 content rows (polyphenol data)

### 2026-01-18: FooDB Integration Complete
- Created search API: `app/api/foods/foodb/search/route.ts`
- Added FooDB support to nutrient-count API
- Added `FooDBStagingClient` class to `lib/services/foodb-client.ts`
- Updated `/api/foods` to accept FOODB as a source
- **Refactored Add Food Modal**:
  - Created `app/components/modals/add-food/source-config.ts` (all 18 sources)
  - Created `app/components/modals/add-food/SourceSearchColumn.tsx` (reusable component)
  - Reduced AddFoodModal.tsx from 1013 lines to 455 lines
  - Modal now dynamically renders enabled sources
