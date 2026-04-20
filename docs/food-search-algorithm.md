# Food Search Algorithm

Token-based search ranking for external food database APIs.

---

## Problem

External food databases (USDA FDC, CNF, etc.) return search results that often prioritize processed/packaged foods over whole foods. For example, searching "milk" might return "Grandma's Packaged Dry Milkshake Powder" before "Milk, whole".

**Issues with substring matching:**
- "salmon" matches "salmonberry" (compound word)
- "bread" matches "breadfruit"
- "sugar" matches "sugar-apple"
- "Crackers, milk" ranks equally with "Milk, whole"

---

## Solution: Token-Based Word Boundary Matching

### Algorithm Overview

```
score = matchRatio × (positionScore + bonus) × 1000
```

**Components:**
1. **Tokenization** - Split descriptions by common delimiters
2. **Plural Normalization** - Handle singular/plural variations
3. **Exact Token Matching** - Match whole tokens only (word boundaries)
4. **Position Scoring** - Earlier tokens score higher (exponential decay)
5. **Bonuses** - Reward first-token matches and consecutive tokens

---

## Implementation

### 1. Delimiter Configuration

```typescript
const DELIMITERS = /[,\s\-\(\):;\/]+/;
```

This handles common food database formats:
- `"Milk, whole, 3.25%"` → `["milk", "whole", "3.25%"]`
- `"Fish, salmon, atlantic, raw"` → `["fish", "salmon", "atlantic", "raw"]`
- `"Sugar-apple, raw"` → `["sugar", "apple", "raw"]`

### 2. Plural Normalization

```typescript
const normalize = (word: string): string => {
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';  // berries → berry
  if (word.endsWith('es') && word.length > 3) return word.slice(0, -2);  // tomatoes → tomato
  if (word.endsWith('s') && word.length > 2) return word.slice(0, -1);   // eggs → egg
  return word;
};
```

This ensures:
- "egg" matches "Eggs, Grade A, Large"
- "sugar" matches "Sugars, brown"
- "berry" matches "Berries, mixed"

### 3. Token Matching

```typescript
// Tokenize and normalize
const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
const normalizedQueryTokens = queryTokens.map(normalize);

const foodTokens = description.toLowerCase().split(DELIMITERS)
  .map(t => t.trim()).filter(t => t.length > 1);
const normalizedFoodTokens = foodTokens.map(normalize);

// Find exact token matches (returns positions)
const matchPositions: number[] = [];
for (const nqt of normalizedQueryTokens) {
  const idx = normalizedFoodTokens.findIndex(nft => nft === nqt);
  if (idx >= 0) matchPositions.push(idx);
}
```

### 4. Scoring Formula

```typescript
// Match ratio: what % of query tokens were found
const matchRatio = matchPositions.length / queryTokens.length;

// Position score: exponential decay on average position
const avgPosition = matchPositions.reduce((a, b) => a + b, 0) / matchPositions.length;
const positionScore = 1 / (1 + avgPosition);

// Bonuses
let bonus = 0;

// First token bonus: query matches the primary food (+0.25)
if (matchPositions.includes(0)) {
  bonus += 0.25;
}

// Consecutive tokens bonus: query tokens appear consecutively (+0.15)
if (matchPositions.length >= 2) {
  const sorted = [...matchPositions].sort((a, b) => a - b);
  let consecutive = true;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) {
      consecutive = false;
      break;
    }
  }
  if (consecutive) bonus += 0.15;
}

// Final score (0-1400 range typically)
const score = Math.round(matchRatio * (positionScore + bonus) * 1000);
```

---

## Score Examples

| Query | Food | Match Ratio | Avg Pos | Position Score | Bonus | Final Score |
|-------|------|-------------|---------|----------------|-------|-------------|
| "milk" | "Milk, whole" | 1.0 | 0 | 1.0 | +0.25 | **1250** |
| "milk" | "Crackers, milk" | 1.0 | 1 | 0.5 | 0 | **500** |
| "milk" | "Chocolate milk shake" | 1.0 | 1 | 0.5 | 0 | **500** |
| "chicken breast" | "Chicken, breast, raw" | 1.0 | 0.5 | 0.67 | +0.40 | **1067** |
| "salmon" | "Fish, salmon, raw" | 1.0 | 1 | 0.5 | 0 | **500** |
| "salmon" | "Salmonberry, raw" | 0 | - | - | - | **0** |

---

## Adding to a New Source

### Step 1: Identify the Description Field

Find the field containing the food name/description:
- USDA FDC: `food.description`
- CNF: `food.food_description`
- FooDB: `food.name`

### Step 2: Copy the Scoring Logic

```typescript
// In your search/ranking function:

const DELIMITERS = /[,\s\-\(\):;\/]+/;

const normalize = (word: string): string => {
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.endsWith('es') && word.length > 3) return word.slice(0, -2);
  if (word.endsWith('s') && word.length > 2) return word.slice(0, -1);
  return word;
};

const queryTokens = query.toLowerCase().trim().split(/\s+/).filter(t => t.length > 1);
const normalizedQueryTokens = queryTokens.map(normalize);

// For each food item:
const foodTokens = food.description  // <-- adjust field name
  .toLowerCase()
  .split(DELIMITERS)
  .map(t => t.trim())
  .filter(t => t.length > 1);

const normalizedFoodTokens = foodTokens.map(normalize);

// Find matches
const matchPositions: number[] = [];
for (const nqt of normalizedQueryTokens) {
  const idx = normalizedFoodTokens.findIndex(nft => nft === nqt);
  if (idx >= 0) matchPositions.push(idx);
}

if (matchPositions.length === 0) {
  return { ...food, relevanceScore: 0 };
}

// Calculate score
const matchRatio = matchPositions.length / queryTokens.length;
const avgPosition = matchPositions.reduce((a, b) => a + b, 0) / matchPositions.length;
const positionScore = 1 / (1 + avgPosition);

let bonus = 0;
if (matchPositions.includes(0)) bonus += 0.25;
if (matchPositions.length >= 2) {
  const sorted = [...matchPositions].sort((a, b) => a - b);
  let consecutive = true;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) consecutive = false;
  }
  if (consecutive) bonus += 0.15;
}

const score = Math.round(matchRatio * (positionScore + bonus) * 1000);
return { ...food, relevanceScore: score };
```

### Step 3: Sort by Score

```typescript
const results = foods
  .map(food => scoreFood(food, query))
  .filter(r => r.relevanceScore > 0)
  .sort((a, b) => b.relevanceScore - a.relevanceScore);
```

---

## Tuning Parameters

| Parameter | Current Value | Effect |
|-----------|---------------|--------|
| First token bonus | +0.25 | Higher = prioritize primary foods more |
| Consecutive bonus | +0.15 | Higher = prioritize exact phrase matches |
| Position decay | `1/(1+pos)` | Exponential decay; alternatives: `1-pos/total` (linear) |
| Min token length | 2 | Filter out single-char tokens |

---

## Compound Count Boost (Internal Sources Only)

For staging table sources (FooDB, Phenol-Explorer, etc.), we add a **compound count boost** to prioritize foods with more nutritional data. This rewards data-rich entries without overwhelming text relevance.

### Formula

```typescript
// Compound count boost: logarithmic scaling, capped at 200 points
const getCompoundBoost = (count: number): number => {
  if (count <= 0) return 0;
  return Math.min(200, Math.log10(count + 1) * 100);
};

// Final score = text relevance + compound boost
const textScore = matchRatio * (positionScore + bonus) * 1000;  // 0-1400 range
const compoundBoost = getCompoundBoost(compoundCount);           // 0-200 range
const finalScore = textScore + compoundBoost;                    // 0-1600 range
```

### Boost Examples

| Compounds | Boost | Rationale |
|-----------|-------|-----------|
| 1 | +30 | Minimal data |
| 10 | +104 | Decent coverage |
| 50 | +170 | Good coverage |
| 100+ | +200 (capped) | Comprehensive data |

### Why Logarithmic?

- **Diminishing returns**: Going from 10→100 compounds is more valuable than 100→1000
- **Cap prevents dominance**: A food with 1000 compounds can't beat a perfect text match
- **Tiebreaker behavior**: Among similar text scores, more data wins

### When to Apply

| Source Type | Apply Compound Boost? |
|-------------|----------------------|
| API sources (CNF, FDC) | No - compound count not reliably available at search time |
| Staging tables (FooDB, Phenol) | Yes - we have compound counts from our data |

---

## Current Implementations

**All food search endpoints MUST use this algorithm for consistent ranking.**

| Source | File | Status | Compound Boost |
|--------|------|--------|----------------|
| CNF | `lib/services/cnf-client.ts` | ✅ Implemented | No (API) |
| FDC (USDA) | `app/api/foods/fdc/search/route.ts` | ✅ Implemented | No (API) |
| FooDB | `app/api/foods/foodb/search/route.ts` | ✅ Implemented | ✅ Yes |
| Phenol-Explorer | `app/api/foods/phenol/search/route.ts` | ✅ Implemented | ✅ Yes |
| Duke | `app/api/foods/duke/search/route.ts` | ⬜ Not yet created | Add when created |
| AFCD | `app/api/foods/afcd/search/route.ts` | ⬜ Not yet created | Add when created |
| UK_COFID | `app/api/foods/uk-cofid/search/route.ts` | ⬜ Not yet created | Add when created |
| (other sources) | ... | ⬜ Not yet created | Add when created |

**When adding a new source:**
1. Copy the token-based scoring logic from an existing implementation
2. Adjust the field name for the food description/name
3. Fetch a larger pool (100-150 results) from the source
4. Apply scoring, filter zero scores, sort by score descending
5. Paginate the results before returning

---

## Testing

Test queries that previously failed:

```bash
# Should show "Eggs" items first, not "Bagels, egg"
curl "http://localhost:3000/api/foods/fdc/search?q=egg&limit=5"

# Should show "Sugar" and "Sugars" items, not "Sugar-apple"
curl "http://localhost:3000/api/foods/fdc/search?q=sugar&limit=5"

# Should show salmon fish, not "Salmonberry"
curl "http://localhost:3000/api/foods/fdc/search?q=salmon&limit=5"

# Should show "Milk" items first, not "Crackers, milk"
curl "http://localhost:3000/api/foods/fdc/search?q=milk&limit=5"
```
