# Nutri Food Database Design

Comprehensive design document for the Nutri food database structure, covering naming conventions, metadata schema, category taxonomy, portion system, the add-food pipeline, AI search strategy, category inheritance, and the crowdsourced data model.

---

## 1. Food Naming Convention

All food items in Nutri follow a structured, comma-separated naming format. This ensures consistency, enables parsing, and supports future category inheritance.

### Format

```
Core Food, [Variety], [Part/Form], [Preparation], [Qualifier...]
```

### Position Rules

| Position | Field | When to include | Examples |
|----------|-------|-----------------|----------|
| 1 | **Core food** | Always | Egg, Rice, Chicken, Milk, Salmon |
| 2 | **Variety / Species** | When NOT the default | brown, Fuji, Atlantic, duck, goat |
| 3 | **Part / Cut / Form** | When relevant | whole, breast, fillet, long-grain, ground |
| 4 | **Preparation** | When relevant | raw, cooked, grilled, boiled, dried, fermented |
| 5+ | **Qualifiers** | When needed to distinguish | skinless, with salt, 3.25% fat, unsweetened |

### Default Omission Rules

Skip implied defaults to keep names concise:
- "chicken" for eggs (most eggs ARE chicken eggs)
- "cow" for milk (most milk IS cow's milk)
- "white" for rice (white rice is the default)
- "yellow" for bananas

### Examples

```
Egg, whole, raw
Egg, duck, whole, raw
Rice, brown, long-grain, cooked
Chicken, breast, skinless, grilled
Salmon, Atlantic, fillet, baked
Milk, whole, 3.25% fat
Milk, goat, whole, raw
Apple, Fuji, with skin, raw
Banana, raw
Peanut butter, smooth
Olive oil, extra virgin
Sweet potato, baked
```

---

## 2. Food Metadata Schema

Every food item stores structured metadata alongside its display name. This metadata is captured automatically by the AI during the add-food flow — there is no manual backfill opportunity since the database is crowdsourced.

### New Fields on `foods` Table

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `food_family` | text | NO | Core food identity: "Egg", "Chicken", "Rice", "Salmon" |
| `variety` | text | YES | Species/type when not the default: "duck", "brown", "Atlantic", "Fuji" |
| `part` | text | YES | Cut/form: "whole", "breast", "fillet", "long-grain", "ground" |
| `preparation` | text | YES | Cooking state: "raw", "cooked", "grilled", "boiled", "dried" |
| `qualifiers` | text[] | DEFAULT '{}' | Additional modifiers: ["skinless", "3.25% fat", "unsweetened"] |
| `origin_type` | enum | NO | "animal", "plant", "fungi", "composite", "supplement", "other" |
| `is_composite` | boolean | DEFAULT false | True for multi-ingredient foods (pizza, soup, bread) |
| `scientific_name` | text | YES | Botanical/zoological name: "Gallus gallus domesticus" |

### Relationship to Category Tree

Each food also has `food_category_id` (FK to `food_categories`) pointing to its **Level 3 subcategory** in the pre-seeded taxonomy. The `food_family` field provides Level 4+ granularity without needing infinite category tree depth.

```
Category Tree (pre-seeded, levels 1-3)     Food Item (dynamic, level 4+)
─────────────────────────────────────       ──────────────────────────────
Animal > Poultry > Chicken          ←──    Chicken, breast, skinless, grilled
                                            food_family=Chicken, part=breast,
                                            preparation=grilled, qualifiers=[skinless]
```

---

## 3. Food Category Taxonomy

A 3-level pre-seeded hierarchy stored in the existing `food_categories` table (self-referential with `parent_category_id` and `level`). Approximately 70-80 nodes total. This tree is curated and stable — it does not grow from user activity.

### Level 1 — Origin (6 nodes)

| Code | Name | Rationale |
|------|------|-----------|
| ANIMAL | Animal | Protein profiles, B12, heme iron |
| PLANT | Plant | Fiber, phytochemicals |
| FUNGI | Fungi | Ergosterol, beta-glucans |
| COMPOSITE | Composite / Prepared | Multi-ingredient, no single origin |
| SUPPLEMENT | Supplements & Isolates | Concentrated/extracted compounds |
| OTHER | Additives & Other | Inorganic: water, salt, baking ingredients |

> **Note on Beverages:** Not a separate origin. Coffee inherits from coffee beans (plant), milk is dairy (animal). The "beverage" aspect is form/preparation, not nutritional origin. Water goes under OTHER.

### Level 2 — Category (~25 nodes)

**ANIMAL:**

| Category | Typical Foods |
|----------|---------------|
| Red Meat | Beef, pork, lamb |
| Poultry | Chicken, turkey, duck |
| Seafood | Fish, shellfish |
| Eggs | Chicken egg, duck egg, roe |
| Dairy | Milk, cheese, yogurt, butter |
| Insects | Cricket, mealworm |
| Other Animal | Honey, gelatin |

**PLANT:**

| Category | Typical Foods |
|----------|---------------|
| Fruits | Apple, banana, mango, orange |
| Vegetables | Broccoli, carrot, spinach, potato |
| Grains & Cereals | Wheat, rice, oats, corn |
| Legumes & Pulses | Beans, lentils, chickpeas, peanuts |
| Nuts & Seeds | Almond, walnut, sunflower, chia |
| Herbs & Spices | Basil, turmeric, cinnamon, pepper |
| Plant Oils | Olive oil, coconut oil, sesame oil |
| Algae & Seaweed | Spirulina, nori, kelp, chlorella |
| Stimulant Plants | Coffee bean, tea leaf, cacao |
| Plant Sweeteners | Sugar cane, maple syrup, agave |

**FUNGI:**

| Category | Typical Foods |
|----------|---------------|
| Mushrooms | Button, shiitake, oyster, portobello |
| Yeasts | Nutritional yeast, brewer's yeast |

**COMPOSITE:**

| Category | Typical Foods |
|----------|---------------|
| Baked Goods | Bread, cake, pastry, crackers |
| Pasta & Noodles | Spaghetti, ramen, rice noodle |
| Soups & Stews | Chicken soup, chili |
| Condiments & Sauces | Ketchup, soy sauce, mayo |
| Snacks | Chips, popcorn, pretzels |
| Confectionery | Candy, chocolate bars |
| Fast Food | Burger, fries, pizza |
| Frozen Meals | TV dinners, frozen pizza |
| Baby Foods | Purees, formula |

**SUPPLEMENT:**

| Category | Typical Foods |
|----------|---------------|
| Vitamin Supplements | Vitamin C tablet, multivitamin |
| Mineral Supplements | Iron, calcium, zinc capsule |
| Protein Powders | Whey, casein, pea protein |
| Fatty Acid Supplements | Fish oil, omega-3 capsule |
| Herbal Supplements | Ashwagandha, echinacea |
| Sports Nutrition | Creatine, pre-workout |

**OTHER:**

| Category | Typical Foods |
|----------|---------------|
| Water | Plain, sparkling, mineral |
| Salt & Minerals | Table salt, Himalayan salt |
| Baking Ingredients | Baking soda, cornstarch |
| Vinegar | Apple cider, balsamic |
| Flavor Extracts | Vanilla, almond extract |
| Artificial Sweeteners | Aspartame, stevia, sucralose |

### Level 3 — Subcategory (~45 nodes)

**Red Meat:** Beef, Pork, Lamb & Mutton, Goat, Game (venison, bison, rabbit, elk), Organ Meats

**Poultry:** Chicken, Turkey, Duck, Goose, Quail, Ostrich & Emu

**Seafood:** Freshwater Fish, Saltwater Fish, Crustaceans, Mollusks

**Eggs:** Chicken Eggs, Duck Eggs, Quail Eggs, Fish Roe & Caviar

**Dairy:** Milk, Cheese, Yogurt, Butter & Ghee, Cream, Frozen Dairy

**Fruits:** Citrus, Berries, Stone Fruits, Tropical, Pome, Melons, Grapes & Vine

**Vegetables:** Leafy Greens, Root Vegetables, Tubers & Starchy, Cruciferous, Nightshades, Alliums, Squash & Gourds, Stems & Shoots

**Grains & Cereals:** Wheat, Rice, Corn/Maize, Oats, Barley, Rye, Millet & Sorghum, Pseudocereals (quinoa, buckwheat, amaranth, teff)

**Legumes & Pulses:** Beans, Lentils, Chickpeas, Peas, Soybeans, Peanuts

**Nuts & Seeds:** Tree Nuts, Seeds, Coconut

### Edge Case Decisions

| Food | Conflict | Decision | Rationale |
|------|----------|----------|-----------|
| Peanut | Botanically legume, culinarily nut | **Legumes > Peanuts** | Nutritionally closer to legumes |
| Avocado | Botanically fruit, culinarily vegetable | **Fruits > Stone Fruits** | Unique fat profile belongs with fruits |
| Tomato | Botanically fruit, culinarily vegetable | **Vegetables > Nightshades** | Nutritional/culinary context |
| Sweet corn | Grain AND vegetable | **Vegetables > Tubers & Starchy** for fresh; **Grains > Corn** for dried/flour |
| Coconut | Botanically drupe, not a tree nut | **Nuts & Seeds > Coconut** | Culinary usage, own subcategory due to unique profile |
| Honey | Made by bees from plant nectar | **Animal > Other Animal** | Bee product |
| Soy milk | Plant-based, used as dairy | **Legumes > Soybeans** | Classified by origin, not usage |
| Chocolate bar | Composite (cacao + sugar + milk) | **Composite > Confectionery** | Pure cacao → Plant > Stimulant Plants |
| Vinegar | Fermented plant product | **Other > Vinegar** | Minimal nutrition, used as additive |
| Fermented foods | Cross-cutting (kimchi, yogurt, tempeh) | **Keep under ORIGIN** | Use preparation=fermented. Kimchi → Vegetables, Yogurt → Dairy |

---

## 4. Portion System

Every food in Nutri has one or more standard portion definitions. All nutrient values are stored per 100g, so portions provide the gram-weight conversion for meal logging.

### `food_portions` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `food_id` | uuid FK → foods(id) | CASCADE on delete |
| `description` | text | Display label: "1 large", "1 cup, chopped", "1 tablespoon" |
| `gram_weight` | decimal | Equivalent weight in grams (THE key value) |
| `is_default` | boolean | Shown first in UI, used when no portion specified |
| `sort_order` | int | Display ordering |
| `source` | text | Where this data came from: "FDC", "AFCD", "CNF", "AI", "manual" |
| `created_at` | timestamp | |

### Measurement Unit Types

**Weight (most reliable — direct conversion):**
g, mg, kg, oz, lb

**Volume (needs density per food):**
ml, L, cup, tbsp, tsp, fl oz

**Count (needs gram-weight lookup per food):**
piece, whole, slice, fillet, steak, large/medium/small

**Food-specific natural units:**
clove (garlic), stalk (celery), leaf (basil), sprig (thyme), can, bottle, packet, bar, patty, link (sausage), handful, pinch, dash

### How Portions Are Collected

AI **always** synthesizes the final portion profile for every food. Source data is input, not the answer.

1. **Collect raw source portions** — During fetch (Phase 4), extract portion data alongside nutrients from each selected source (USDA FDC `foodPortions`, AFCD serving sizes, CNF measures, etc.). These are raw reference data, not the final output.

2. **AI synthesizes portion profile** — A dedicated AI prompt (PORTION_SYSTEM) receives the raw source portions, canonical food name, and metadata, then outputs a clean, practical portion set. The AI:
   - Normalizes inconsistent descriptions across sources ("1 large egg" + "large" → "1 large")
   - Averages gram weights when multiple sources agree on a portion
   - Fills gaps using general food knowledge (e.g., adds "1 cup, chopped" for vegetables even if no source included it)
   - Drops irrelevant portions (e.g., industrial-scale measures)
   - Picks a sensible default portion

3. **User confirms/edits** — The review step (Phase 5) shows the AI-curated portion list. Users can adjust gram weights, remove portions, or add custom ones.

This ensures every food gets a complete, practical portion set regardless of source quality or coverage.

---

## 5. Add Food Pipeline

The complete flow for adding a food to the Nutri database. Designed for crowdsourced data collection — all metadata, nutrients, and portions are captured automatically at ingestion time.

Two AI touchpoints are involved (see Section 5a for the full map):
- **AI #1** (Clarify) — interprets the user's query, outputs canonical name + metadata + category
- **AI #2** (Rank) — ranks external source results by relevance
- **AI #3** (Portions) — synthesizes a clean portion profile from raw source data

### Flow

```
┌──────────────────────────────────────────────────────────────┐
│ PHASE 1: AI CHAT (Clarify)                          [AI #1] │
│                                                              │
│ User types food query (e.g., "egg")                          │
│ AI returns:                                                  │
│   canonicalName: "Egg, whole, raw"                           │
│   searchQuery: "egg"                                         │
│   confirmationMessage: "Egg, whole, raw — sound right?"      │
│                                                              │
│   NEW — same prompt, extended output:                        │
│   metadata: {                                                │
│     foodFamily: "Egg",                                       │
│     variety: null,                                           │
│     part: "whole",                                           │
│     preparation: "raw",                                      │
│     qualifiers: [],                                          │
│     originType: "animal",                                    │
│     isComposite: false,                                      │
│     scientificName: "Gallus gallus domesticus"               │
│   }                                                          │
│   categoryPath: "Animal > Eggs > Chicken Eggs"               │
│                                                              │
│ Not a new AI call — the AI is already decomposing the food   │
│ to build the canonical name; metadata + category are a       │
│ natural extension of that same reasoning.                    │
│                                                              │
│ User confirms (or AI asks clarifying questions)              │
└────────────────────────────┬─────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────┐
│ PHASE 2: CHECK NUTRI DB                                      │
│                                                              │
│ Search existing foods by canonicalName / foodFamily /        │
│ categoryPath before hitting external sources.                │
│                                                              │
│ Found? → User logs existing food, done (no duplication)      │
│ Not found? → Continue to Phase 3                             │
└────────────────────────────┬─────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────┐
│ PHASE 3: SEARCH + CAROUSEL                          [AI #2] │
│                                                              │
│ Search 18 external sources in parallel (broad keyword)       │
│ AI ranks top 5 per source using canonicalName context        │
│ User picks best match per source in carousel UI              │
│                                                              │
│ No changes from current implementation.                      │
└────────────────────────────┬─────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────┐
│ PHASE 4: FETCH + MERGE                              [AI #3] │
│                                                              │
│ For each selected source:                                    │
│   → Fetch nutrients (existing pipeline)                      │
│   → Collect raw portion data (extract from source response)  │
│                                                              │
│ NUTRIENTS (existing):                                        │
│   standardize → map to compounds → average across sources    │
│                                                              │
│ PORTIONS (new — AI-always model):                            │
│   1. Collect raw source portions as reference data           │
│   2. AI synthesizes clean portion profile:                   │
│      Input:  raw source portions + canonicalName + metadata  │
│      Output: normalized portions with gram weights           │
│   3. AI fills gaps, drops irrelevant entries, picks default  │
│                                                              │
│ This is the second AI touchpoint — a new PORTION_SYSTEM      │
│ prompt that runs once after all sources are fetched.         │
└────────────────────────────┬─────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────┐
│ PHASE 5: REVIEW (enhanced)                                   │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Food name: [Egg, whole, raw                            ] │ │
│ │ Category:  [Animal > Eggs > Chicken Eggs              ▾] │ │
│ │ Family: Egg   Part: whole   Prep: raw                    │ │
│ │ Origin: animal   Composite: no                           │ │
│ │ Scientific: Gallus gallus domesticus                     │ │
│ │                     ↑ from Phase 1 (editable)            │ │
│ │                                                          │ │
│ │ Sources (12 selected)                                    │ │
│ │ US FDC: Egg, whole, raw, fresh                           │ │
│ │ CA CNF: Egg, whole, raw                                  │ │
│ │ ...                                                      │ │
│ │                                                          │ │
│ │ Portions (AI-curated)        ↑ from Phase 4              │ │
│ │ * 1 large — 50g  [default]                               │ │
│ │   1 medium — 44g                                         │ │
│ │   1 cup, raw — 243g                                      │ │
│ │ [+ Add custom portion]                                   │ │
│ │                                                          │ │
│ │ [Add Food (12 sources)]                                  │ │
│ └──────────────────────────────────────────────────────────┘ │
└────────────────────────────┬─────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────┐
│ PHASE 6: SAVE                                                │
│                                                              │
│ Transaction inserts:                                         │
│   → foods (name + metadata fields + food_category_id)        │
│   → food_sources (selected source mappings)                  │
│   → merged_nutrients (averaged compound values)              │
│   → nutrient_source_values (per-source raw values)           │
│   → food_portions (AI-curated portion definitions)           │
│   → food_approvals (AUTO_APPROVED if authenticated)          │
│                                                              │
│ SSE progress events streamed to UI throughout                │
└──────────────────────────────────────────────────────────────┘
```

---

## 5a. AI Touchpoints

Summary of all AI usage in the add-food pipeline.

| # | Phase | Prompt | Model | Purpose | Status |
|---|-------|--------|-------|---------|--------|
| 1 | 1. Clarify | CLARIFY_SYSTEM | Haiku | Canonical name + search query + confirmation | Existing |
| 2 | 1. Clarify | (same prompt, extended output) | Haiku | Metadata fields + category assignment | **Extend** |
| 3 | 3. Search | RANK_SYSTEM | Haiku | Rank top 5 results per source | Existing |
| 4 | 4. Fetch | PORTION_SYSTEM (new) | Haiku | Synthesize portion profile from raw source data | **New** |

**Design notes:**
- All prompts use Haiku for cost efficiency (temperature=0, deterministic)
- AI #1 and #2 are extended/unchanged — only AI #4 is a net-new prompt
- The metadata extension (row 2) adds structured output fields to the existing clarify prompt, not a separate call
- All AI features gracefully degrade when Anthropic is unconfigured

---

## 6. AI Search Strategy

The search uses ILIKE pattern matching across 18 international food databases. Multi-word queries drastically reduce matches because `%brown rice%` misses entries like "rice, brown" or "riz complet".

### Principles

1. **searchQuery = single root food word** — "egg" not "chicken egg", "rice" not "brown rice", "chicken" not "chicken breast", "milk" not "whole milk"

2. **Two words only when the food IS two words** — "peanut butter", "olive oil", "sweet potato", "soy sauce"

3. **Drop ALL modifiers** — species, color, preparation, variety, cut. The AI ranking step uses canonicalName to pick the right match from results.

4. **canonicalName carries full detail** — "Egg, whole, raw" is used by the AI to evaluate and rank the search results intelligently.

### Pipeline

```
searchQuery: "egg"  →  ILIKE '%egg%' across 18 sources  →  ~100 results per source
                                      ↓
canonicalName: "Egg, whole, raw"  →  AI ranks top 5 per source by relevance
```

This ensures maximum recall (broad search) with high precision (AI ranking).

---

## 7. Category Inheritance System (Future)

A planned system for imputing missing compound values from nutritionally similar foods. Enabled by the structured metadata and category taxonomy captured at add-time.

### How It Works

When a food is missing a core compound value, the system searches for the value in progressively broader groups:

```
"Chicken, breast, grilled" missing Selenium?

Search order:
1. Same family + part + any prep    → Chicken breast entries     (HIGH confidence)
2. Same family + any part           → Any chicken entries        (MEDIUM confidence)
3. Same subcategory                 → Other poultry              (LOW confidence)
4. Same category                    → Other animal products      (VERY LOW confidence)
```

### Confidence Levels

| Inheritance Level | Source | Confidence |
|-------------------|--------|------------|
| Same food, different preparation | Chicken breast raw → grilled | 0.9 (minerals barely change with cooking) |
| Same food, different part | Chicken breast → thigh | 0.6 (different composition) |
| Same family, different species | Chicken egg → Duck egg | 0.4 (similar but not identical) |
| Same subcategory | Chicken → Turkey | 0.2 (same poultry family) |
| Same category | Chicken → Salmon | 0.05 (both animal, very different) |

### Requirements

- All food items must have structured metadata (food_family, part, preparation) — captured by AI at add-time
- All food items must be assigned a Level 3 subcategory — captured by AI at add-time
- Inherited values must be clearly marked as estimates, not measured data
- Users should be able to see whether a compound value is measured or inherited

### Not Built Yet

This system is designed for future implementation. The current priority is ensuring the metadata and category structure are in place from day one so inheritance can be built later without backfilling.

---

## 8. Crowdsourced Data Model

The Nutri food database is entirely crowdsourced. No foods are manually added — users grow the database through the Smart Add Food flow.

### Key Implications

1. **Everything captured at ingestion time** — The AI + source pipeline is the only opportunity to capture metadata, nutrients, portions, and categorization. If it's not captured during the add-food flow, it never gets captured.

2. **AI handles all classification and curation** — The AI clarify step outputs canonical name, structured metadata, and category assignment. A separate AI prompt synthesizes the portion profile from raw source data. Both run automatically for every food added — no manual classification or portion curation needed.

3. **Deduplication by search** — Before creating a new food, the system searches existing Nutri foods. If a match exists, the user logs the existing food rather than creating a duplicate. Search uses canonical name, food_family, and category to find matches.

4. **Quality through multi-source merging** — Nutrient values are averaged across multiple international databases, reducing single-source errors. The more sources a user selects, the more robust the data.

5. **Progressive enrichment** — If a food exists with data from 3 sources and a new user adds the same food, the system could merge additional source data into the existing food (future feature).

### Data Quality Safeguards

| Safeguard | Description |
|-----------|-------------|
| Multi-source averaging | Reduces single-source errors |
| AI-assisted selection | AI ranks results by relevance, reducing mismatches |
| Conversion factor validation | Food health dashboard flags suspicious conversions |
| Cross-source comparison | Flags outlier values across sources for the same compound |
| Approval workflow | Authenticated users auto-approved; anonymous submissions reviewed |
| Structured metadata | AI-generated, consistent format, enables future validation |

---

## Schema Migration Summary

### New/Modified Tables

**`foods` table — add columns:**
- `food_family` text NOT NULL
- `variety` text
- `part` text
- `preparation` text
- `qualifiers` text[] DEFAULT '{}'
- `origin_type` enum('animal','plant','fungi','composite','supplement','other') NOT NULL
- `is_composite` boolean DEFAULT false
- `scientific_name` text

**`food_categories` table — pre-seed with ~75 rows:**
- Level 1: 6 origin nodes
- Level 2: ~25 category nodes
- Level 3: ~45 subcategory nodes

**`food_portions` table — create new:**
- id, food_id, description, gram_weight, is_default, sort_order, source, created_at

### Pipeline Changes

- AI clarify prompt updated to output structured metadata + category
- Add-food API updated to store metadata fields + portions
- Review phase UI extended with category, metadata, and portions sections
- Nutri DB search step added before external source search
