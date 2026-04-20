# Multi-Source Food Database Schema

**Purpose**: Database schema for community-curated multi-API food system
**Created**: 2025-11-18
**Status**: ✅ Schema designed, ready for migration

---

## 📊 Schema Overview

### New Tables Created

1. **food_sources** - Maps Nutri foods to external API entries
2. **merged_nutrients** - Stores averaged nutrient values from multiple sources
3. **nutrient_source_values** - Individual source values for transparency
4. **food_approvals** - Approval workflow for community additions

### Modified Tables

1. **foods** - Added `commonNames`, `usageCount`, `createdBy` fields

### New Enums

1. **api_source_enum** - CNF, FDC, FOODB, NUTRITIONIX
2. **approval_status_enum** - PENDING, APPROVED, REJECTED, AUTO_APPROVED

---

## 🗂️ Table Structures

### 1. foods (Modified)

**Purpose**: Core food items with multi-source support

```typescript
{
  id: uuid,
  name: text,
  commonNames: text[], // NEW: Search aliases
  description: text,
  usageCount: integer, // NEW: Popularity tracking
  createdBy: uuid, // NEW: Community tracking
  foodCategoryId: uuid,
  dataSource: text (default: 'NUTRI'), // Legacy field
  fdcId: integer, // Legacy field
  // ... other existing fields
}
```

**Key Changes**:
- `commonNames[]`: Aliases for better search ("chicken breast", "raw chicken")
- `usageCount`: Incremented when added to meals (popularity scoring)
- `createdBy`: Tracks who added the food (null if anonymous)

---

### 2. food_sources (New)

**Purpose**: Maps Nutri foods to external API entries

```typescript
{
  id: uuid,
  foodId: uuid → foods.id,
  apiSource: enum (CNF, FDC, FOODB, NUTRITIONIX),
  apiFoodId: text, // External API's food ID
  verifiedBy: uuid → users.id,
  createdAt: timestamp
}
```

**Example**:
```
Food: "Chicken Breast, Raw" (foodId: abc-123)
Sources:
  - CNF: 5690
  - FDC: 171477
  - FooDB: 1023
```

**Unique Constraint**: `(foodId, apiSource)` - prevents duplicate mappings

---

### 3. merged_nutrients (New)

**Purpose**: Averaged nutrient values from multiple API sources

```typescript
{
  id: uuid,
  foodId: uuid → foods.id,
  nutrientName: text, // Standardized (e.g., "Protein")
  averageValue: decimal(15, 4),
  unit: text, // "g", "mg", "μg"
  sourceCount: integer, // How many APIs provided this
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Example**:
```
Food: "Chicken Breast, Raw"
Nutrient: "Protein"
Sources: CNF (23.2g), FDC (23.8g), FooDB (23.5g)
Average: 23.5g
Source Count: 3
```

**Indexes**:
- `foodId` - Fast food lookups
- `nutrientName` - Fast nutrient queries
- `(foodId, nutrientName)` - Composite for direct access

---

### 4. nutrient_source_values (New)

**Purpose**: Individual source values for transparency

```typescript
{
  id: uuid,
  mergedNutrientId: uuid → merged_nutrients.id,
  apiSource: enum (CNF, FDC, FOODB),
  value: decimal(15, 4),
  confidence: decimal(3, 2), // 0.0-1.0 quality score
  createdAt: timestamp
}
```

**Example**:
```
Merged Nutrient: Protein (23.5g average)
Source Values:
  - CNF: 23.2g (confidence: 1.0)
  - FDC: 23.8g (confidence: 0.95)
  - FooDB: 23.5g (confidence: 0.85)
```

**Purpose**: Allows users to see ALL sources and make informed decisions

---

### 5. food_approvals (New)

**Purpose**: Approval workflow for community-added foods

```typescript
{
  id: uuid,
  foodId: uuid → foods.id,
  status: enum (PENDING, APPROVED, REJECTED, AUTO_APPROVED),
  requestedBy: uuid → users.id, // Null if anonymous
  reviewedBy: uuid → users.id,
  reviewNotes: text,
  requestedAt: timestamp,
  reviewedAt: timestamp
}
```

**Workflow**:
1. Non-auth user adds food → `status: PENDING`
2. Auth user adds food → `status: AUTO_APPROVED`
3. Admin reviews → `status: APPROVED` or `REJECTED`

**Note**: Users can still USE pending foods (flagged as "under review")

---

## 🔄 Data Flow

### Adding a Food

```
1. User enters: "Venison Steak, Raw"

2. User selects API sources:
   - CNF: 4567 (Venison, raw)
   - FDC: 98765 (Deer meat, raw)
   - FooDB: 321 (Venison)

3. System creates:
   a. foods record (name, commonNames, createdBy)
   b. 3x food_sources records (CNF, FDC, FooDB mappings)
   c. food_approvals record (status: AUTO_APPROVED if auth)

4. System fetches nutrients from all 3 APIs

5. System creates:
   a. merged_nutrients records (averaged values)
   b. nutrient_source_values records (individual values)

6. Food is now searchable and trackable!
```

---

## 📁 File Structure

```
/db/schema/
├── multi_source_enums.ts   ✅ NEW (API source + approval enums)
├── food_sources.ts          ✅ NEW (API mappings)
├── merged_nutrients.ts      ✅ NEW (Averaged values)
├── nutrient_source_values.ts ✅ NEW (Individual values)
├── food_approvals.ts        ✅ NEW (Approval workflow)
├── foods.ts                 ✅ MODIFIED (Added multi-source fields)
└── index.ts                 ✅ MODIFIED (Exports new tables)
```

---

## 🚀 Next Steps

### Phase 1 Complete ✅
- [x] Design database schema
- [x] Create new tables
- [x] Update foods table
- [x] Add enums
- [x] Update schema exports

### Phase 2 Next 🔄
- [ ] Build FooDB API client
- [ ] Create nutrient standardization service
- [ ] Generate database migration
- [ ] Test schema with Drizzle

---

## 💡 Key Design Decisions

### Why Separate Tables?

**food_sources**:
- Flexible (can add/remove API sources per food)
- Audit trail (who verified each source)
- Unique constraint prevents duplicates

**merged_nutrients + nutrient_source_values**:
- Transparency (users see all sources)
- Performance (averaged values pre-calculated)
- Trust (users can verify data quality)

### Why Approval System?

- **Quality Control**: Admin review for anonymous additions
- **Trust**: Auto-approve authenticated users
- **Usability**: Users can track pending foods immediately
- **Community**: Crowd-sourced curation with oversight

### Backward Compatibility

- `fdcId` + `dataSource` fields preserved
- Existing foods table structure maintained
- New fields added as nullable/optional
- Gradual migration path from single-source to multi-source

---

## 📝 Migration Notes

### Existing Data

Current `foods` table has:
- `fdcId`: USDA FoodData Central IDs
- `dataSource`: "FDC" or "CNF"

Migration strategy:
1. Leave existing foods untouched
2. New foods use multi-source system
3. Eventually migrate old foods to new system

### Database Changes Required

```sql
-- Add new columns to foods table
ALTER TABLE foods
  ADD COLUMN common_names TEXT[],
  ADD COLUMN usage_count INTEGER DEFAULT 0,
  ADD COLUMN created_by UUID REFERENCES users(id);

-- Create new tables
-- (Generated by Drizzle migration tool)

-- Create indexes
CREATE INDEX idx_foods_usage ON foods(usage_count);
CREATE INDEX idx_foods_creator ON foods(created_by);
```

---

**Last Updated**: 2025-11-18
**Ready For**: FooDB API integration + nutrient mapping service
