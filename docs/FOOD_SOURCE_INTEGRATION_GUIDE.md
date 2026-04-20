# Food Source Integration Guide

**Purpose**: Agnostic process for integrating each food source into the Add Food workflow
**Created**: 2026-01-18

---

## Goal

Each source gets a search field in the Add Food modal. Users can search any source, select a food item, and the nutrients from all selected sources get merged into a single Nutri food entry.

---

## Integration Checklist (Per Source)

### 1. Data Availability
- [ ] Identify data format (API, CSV, Excel, JSON)
- [ ] Confirm food list available (id, name, description)
- [ ] Confirm nutrient data available (food_id, nutrient_id, value, unit)

### 2. Staging Tables (skip for API sources)
- [ ] Create `source_{code}_foods` table
- [ ] Create `source_{code}_nutrients` table
- [ ] Import data from source files
- [ ] Add indexes for search performance

### 3. Search API Route
- [ ] Create `/api/foods/{code}/search/route.ts`
- [ ] Implement search logic (API call or DB query)
- [ ] **REQUIRED**: Apply token-based scoring algorithm (see `docs/food-search-algorithm.md`)
- [ ] **REQUIRED for staging tables**: Add compound count boost to scoring (see below)
- [ ] Fetch larger pool (100-150 results), re-rank, return top N
- [ ] Return unified format: `{ apiSource, apiId, name, description?, relevanceScore, nutrientCount? }`

### 4. Nutrient Fetch
- [ ] Create or update nutrient fetching logic
- [ ] Map source nutrient IDs to Nutri compound IDs (via `compound_sources`)
- [ ] Return standardized nutrients with values and units

### 5. Frontend Integration
- [ ] Add source to Add Food modal
- [ ] Wire up search, selection, nutrient count display

### 6. Testing
- [ ] Search returns relevant results
- [ ] Nutrient mapping works correctly
- [ ] Food creation with this source succeeds

---

## Unified Response Formats

### Search Response
```typescript
interface FoodSearchResult {
  apiSource: string;      // 'CNF', 'FDC', 'AFCD', etc.
  apiId: string;          // External food ID
  name: string;           // Food name
  description?: string;   // Optional description
  category?: string;      // Optional category
}
```

### Nutrient Response
```typescript
interface SourceNutrient {
  compoundId: string;     // Nutri compound UUID
  name: string;           // Compound name
  value: number;          // Amount per 100g
  unit: string;           // g, mg, µg, etc.
  sourceNutrientId: string; // Original source nutrient ID
}
```

---

## Source-Specific Notes

### API Sources
- Query external API directly
- Handle rate limits, caching as needed
- No staging tables required

### CSV/Excel Sources
- Parse once, import to staging tables
- Search via PostgreSQL full-text or ILIKE
- Nutrient lookup by food_id in staging table

### Existing Staging Tables
- FooDB, Phenol-Explorer, Duke already have food/compound data
- May need restructuring for food search use case
- Content tables have nutrient values

---

## Compound Count Boost (Staging Tables Only)

For internal/staging table sources, add a **compound count boost** to prioritize foods with more nutritional data. This helps surface data-rich entries while keeping text relevance dominant.

### Implementation

```typescript
// Add to your search scoring logic (after token-based text score)

// Compound count boost: logarithmic scaling, capped at 200 points
const getCompoundBoost = (count: number): number => {
  if (count <= 0) return 0;
  return Math.min(200, Math.log10(count + 1) * 100);
};

// In your scoring loop:
const textScore = Math.round(matchRatio * (positionScore + bonus) * 1000);  // 0-1400 range
const compoundCount = parseInt(food.compound_count, 10) || 0;
const compoundBoost = Math.round(getCompoundBoost(compoundCount));          // 0-200 range
const finalScore = textScore + compoundBoost;                                // 0-1600 range

return { ...food, relevanceScore: finalScore, textScore, compoundBoost };
```

### Boost Scale

| Compounds | Boost | Notes |
|-----------|-------|-------|
| 1 | +30 | Minimal data |
| 10 | +104 | Decent coverage |
| 50 | +170 | Good coverage |
| 100+ | +200 | Capped - comprehensive |

### Why This Matters

- **User value**: Foods with more compounds provide richer nutritional insights
- **Tiebreaker**: Among similar text matches, more data wins
- **Logarithmic**: Prevents extreme counts from dominating (1000 compounds doesn't beat a perfect text match)

### When to Apply

| Source Type | Compound Boost |
|-------------|----------------|
| API (CNF, FDC) | No - compound count not available at search time |
| Staging (FooDB, Phenol, Duke, etc.) | **Yes** - we have compound counts |

See `docs/food-search-algorithm.md` for full algorithm documentation.

---

## Database Schema Pattern

For new staging tables:

```sql
-- Foods table
CREATE TABLE source_{code}_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL UNIQUE,  -- Original ID from source
  name TEXT NOT NULL,
  name_scientific TEXT,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_source_{code}_foods_name ON source_{code}_foods USING gin(name gin_trgm_ops);
CREATE INDEX idx_source_{code}_foods_source_id ON source_{code}_foods(source_id);

-- Nutrients table
CREATE TABLE source_{code}_nutrients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_source_id TEXT NOT NULL,    -- FK to source_id in foods table
  nutrient_id TEXT NOT NULL,       -- Source's nutrient ID
  nutrient_name TEXT NOT NULL,
  value DECIMAL,
  unit TEXT,
  UNIQUE(food_source_id, nutrient_id)
);

CREATE INDEX idx_source_{code}_nutrients_food ON source_{code}_nutrients(food_source_id);
```
