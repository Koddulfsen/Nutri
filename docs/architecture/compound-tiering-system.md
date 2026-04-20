# Compound Tiering System

## Overview

NutriDB uses a tiered compound system to balance data quality with comprehensive coverage. This allows for a curated core experience while enabling unlimited growth through crowdsourced data.

---

## Tiers

### Nutri Core (~150 compounds)

**What it includes:**
- Vitamins (A, B-complex, C, D, E, K)
- Minerals (calcium, iron, zinc, magnesium, etc.)
- Macronutrients (protein, carbs, fats, fiber)
- Amino acids (essential + non-essential)
- Fatty acids (omega-3, omega-6, saturated, trans)
- Heavy metals / contaminants (lead, mercury, cadmium, arsenic)
- Common food additives

**Characteristics:**
- Manually curated, guaranteed accuracy
- Standardized names and units
- Complete metadata (descriptions, health flags, daily values)
- Primary data sources: CNF, USDA FoodData Central

**Frontend behavior:**
- Shown by default in all views
- Clean, familiar nutrition label experience

---

### Nutri Advanced (unlimited, grows organically)

**What it includes:**
- Phytochemicals
- Polyphenols & flavonoids
- Alkaloids
- Terpenes
- Carotenoids (beyond beta-carotene)
- Glucosinolates
- Organic acids
- Any compound from enrichment sources

**Characteristics:**
- Auto-imported from FooDB, Duke, Phenol-Explorer
- Deduplicated via CAS number + exact name matching
- Community-flagged for edge case duplicates
- May have incomplete metadata initially

**Frontend behavior:**
- Hidden by default
- Toggle: "Show Advanced Compounds"
- Subtle indicator: "X advanced compounds available"
- Visual distinction (different styling, "Advanced" badge)

---

## Deduplication Strategy

### Automatic Dedup (on compound import)

1. **CAS Number Match** - If incoming compound has CAS number that exists in DB → link to existing
2. **Exact Name Match** - If exact name (case-insensitive) exists → link to existing
3. **No Match** - Create new compound

### Identifier Coverage by Source

| Source | CAS Number | InChI Key | Other |
|--------|------------|-----------|-------|
| FooDB | 99.9% | 99.9% | - |
| Duke | 0.3% | None | - |
| Phenol-Explorer | 39% | - | PubChem 56% |

### Community Dedup (future)

- Users can flag: "Compound A = Compound B"
- Voting system for merge suggestions
- At threshold (e.g., 5 net votes), system merges
- Merged compound becomes alias pointing to canonical

---

## Database Schema Changes (Future)

```sql
-- Add to compounds table
ALTER TABLE compounds ADD COLUMN tier TEXT DEFAULT 'advanced'
  CHECK (tier IN ('core', 'advanced'));

ALTER TABLE compounds ADD COLUMN cas_number TEXT;
ALTER TABLE compounds ADD COLUMN inchi_key TEXT;
ALTER TABLE compounds ADD COLUMN source_origin TEXT; -- 'CURATED', 'FOODB', 'DUKE', 'PHENOL', etc.
ALTER TABLE compounds ADD COLUMN canonical_id UUID REFERENCES compounds(id); -- for merged duplicates

-- Index for dedup lookups
CREATE INDEX idx_compounds_cas ON compounds(cas_number) WHERE cas_number IS NOT NULL;
CREATE INDEX idx_compounds_name_lower ON compounds(LOWER(name));
```

---

## Open Question: How to Categorize Auto-Added Compounds?

When a compound is automatically imported from a source like FooDB or Duke, how do we determine its tier?

### Option A: Everything Auto-Added is Advanced
- Simple rule: `source_origin != 'CURATED'` → `tier = 'advanced'`
- Core is exclusively manually curated
- Pros: Clean separation, easy to implement
- Cons: Might miss obvious core compounds (e.g., if Vitamin C comes from FooDB first)

### Option B: Pattern Matching on Compound Type/Class
- Use compound classification from source (FooDB has `kingdom`, `superclass`, `klass`)
- Map certain classes to core:
  - Vitamins → core
  - Minerals → core
  - Amino acids → core
  - Everything else → advanced
- Pros: Catches obvious core compounds automatically
- Cons: Relies on source classification quality, more complex

### Option C: Maintain a Core Allowlist
- Keep a static list of ~150 compound names that are "core"
- On import, check if name matches allowlist → `tier = 'core'`
- Pros: Explicit control, no surprises
- Cons: Requires maintaining the list

### Option D: Hybrid
- Start with Option A (all auto-added = advanced)
- Periodically review advanced compounds
- Promote frequently-appearing, well-known compounds to core
- Community can suggest promotions

### Recommendation
**Option D (Hybrid)** - Start simple, refine over time. The tier isn't permanent; compounds can be promoted as the system matures.

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Add `tier`, `cas_number`, `source_origin` columns to compounds table
- [ ] Mark existing curated compounds as `tier = 'core'`
- [ ] Update food add flow to auto-create compounds with `tier = 'advanced'`
- [ ] Implement CAS + name dedup on import

### Phase 2: Frontend
- [ ] Add "Show Advanced" toggle to food detail view
- [ ] Style advanced compounds differently
- [ ] Show compound count badges

### Phase 3: Community Features
- [ ] "Flag as duplicate" button
- [ ] Merge voting system
- [ ] "Suggest for Core" promotion flow

---

## Notes

- FooDB alone has 70k compounds - we can't curate these manually
- The goal is: capture 100% of nutritional value, present it cleanly
- Core = what appears on a nutrition label
- Advanced = what researchers and biohackers want
- This system scales: more sources = more advanced compounds, core stays stable
