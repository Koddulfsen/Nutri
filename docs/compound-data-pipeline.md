# Compound Data Pipeline - System Design

## Overview

A multi-tier data acquisition system that enriches foods with compound data from multiple sources when added to Nutri. The system prioritizes speed for common nutrients (APIs) and completeness for rare compounds (AI research agents).

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              FOOD ADDITION TRIGGER                                   │
│                         (User adds "Broccoli, raw" to Nutri)                        │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  TIER 1: REAL-TIME APIs                                              ~2 seconds    │
│  ────────────────────────────────────────────────────────────────────────────────── │
│                                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                      │
│  │   USDA FDC      │  │   CNF API       │  │ Open Food Facts │                      │
│  │   (existing)    │  │   (existing)    │  │   (new)         │                      │
│  │                 │  │                 │  │                 │                      │
│  │  Rate: 1K/hr    │  │  Cached locally │  │  No key needed  │                      │
│  │  API key: free  │  │                 │  │  4M+ products   │                      │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                      │
│           │                    │                    │                               │
│           └────────────────────┼────────────────────┘                               │
│                                ▼                                                    │
│                   ┌────────────────────────┐                                        │
│                   │   nutrient-mapper.ts   │  Existing: maps external IDs →         │
│                   │   + compound_sources   │  internal compound UUIDs               │
│                   └────────────────────────┘                                        │
│                                                                                     │
│  COMPOUNDS: MACRONUTRIENT, VITAMIN, MINERAL, AMINO_ACID, FATTY_ACID, CARBOHYDRATE  │
│  COUNT: ~150 compounds per food                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  TIER 2: LOCAL DATABASE SEARCH                                       ~500ms        │
│  ────────────────────────────────────────────────────────────────────────────────── │
│                                                                                     │
│  Pre-imported into Supabase (one-time download + periodic sync):                    │
│                                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                      │
│  │   FooDB         │  │ Phenol-Explorer │  │  Dr. Duke's     │                      │
│  │                 │  │                 │  │                 │                      │
│  │  28K compounds  │  │  500 polyphenols│  │  Phytochemicals │                      │
│  │  1000 foods     │  │  452 foods      │  │  1000+ plants   │                      │
│  │                 │  │                 │  │  CC0 license    │                      │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                      │
│           │                    │                    │                               │
│           └────────────────────┼────────────────────┘                               │
│                                ▼                                                    │
│                   ┌────────────────────────┐                                        │
│                   │   AI FUZZY MATCHER     │  Claude/GPT matches food names         │
│                   │   (food-matcher.ts)    │  across naming conventions             │
│                   └────────────────────────┘                                        │
│                                                                                     │
│  COMPOUNDS: POLYPHENOL, GLUCOSINOLATE, CAROTENOID, TERPENOID, ALKALOID,            │
│             ANTI_NUTRIENT                                                           │
│  COUNT: ~50-100 additional compounds per food                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  TIER 3: AI RESEARCH AGENTS                                    Background job      │
│  ────────────────────────────────────────────────────────────────────────────────── │
│                                                                                     │
│  Triggered async for compounds with NO DATA from Tiers 1-2:                         │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  BullMQ Job: RESEARCH_COMPOUNDS                                             │    │
│  │                                                                             │    │
│  │  1. Identify missing compound types for this food                          │    │
│  │  2. Query PubMed: "{food} {compound} content mg per 100g"                   │    │
│  │  3. Fetch abstracts/full-text from PMC                                     │    │
│  │  4. LLM extracts: compound name, value, unit, methodology                  │    │
│  │  5. Validate units, normalize to our schema                                │    │
│  │  6. Store with citation + confidence score                                 │    │
│  │  7. Notify user when complete (optional)                                   │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                     │
│  COMPOUNDS: PROCESSING_COMPOUND, MYCOTOXIN, PLASTICIZER, PESTICIDE_RESIDUE,        │
│             rare GLUCOSINOLATE, NUCLEOTIDE                                          │
│  COUNT: ~5-20 compounds per food (when applicable)                                  │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  RESULT: COMPLETE NUTRITIONAL PROFILE                                               │
│  ────────────────────────────────────────────────────────────────────────────────── │
│                                                                                     │
│  Broccoli, raw (100g)                                                               │
│  ├── Tier 1 (USDA/CNF):     65 compounds   [immediate]                             │
│  ├── Tier 2 (FooDB/PE):     45 compounds   [immediate]                             │
│  └── Tier 3 (Research):      8 compounds   [background, ~5 min]                    │
│  ─────────────────────────────────────────                                         │
│  TOTAL:                    118 compounds                                            │
│                                                                                     │
│  All stored in: food_nutrient_values with source, confidence, citations            │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Additions

### New Tables for External Source Data

```sql
-- ============================================================================
-- EXTERNAL SOURCE: FooDB (downloaded, imported)
-- ============================================================================

CREATE TABLE source_foodb_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  foodb_id TEXT NOT NULL UNIQUE,           -- e.g., "FOOD00001"
  name TEXT NOT NULL,                       -- "Broccoli"
  name_scientific TEXT,                     -- "Brassica oleracea var. italica"
  description TEXT,
  food_group TEXT,                          -- "Vegetables"
  food_subgroup TEXT,                       -- "Cabbages"
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE source_foodb_compounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  foodb_food_id TEXT NOT NULL REFERENCES source_foodb_foods(foodb_id),
  compound_name TEXT NOT NULL,              -- "Quercetin"
  compound_class TEXT,                      -- "Flavonols"
  value NUMERIC,                            -- 2.34
  unit TEXT,                                -- "mg/100g"
  citation TEXT,                            -- Original source
  pubchem_id TEXT,                          -- Link to PubChem
  our_compound_id UUID REFERENCES compounds(id),  -- Mapped to our compound
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_foodb_foods_name ON source_foodb_foods USING gin(name gin_trgm_ops);
CREATE INDEX idx_foodb_compounds_food ON source_foodb_compounds(foodb_food_id);
CREATE INDEX idx_foodb_compounds_mapped ON source_foodb_compounds(our_compound_id);

-- ============================================================================
-- EXTERNAL SOURCE: Phenol-Explorer (downloaded, imported)
-- ============================================================================

CREATE TABLE source_phenol_explorer_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pe_food_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  food_group TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE source_phenol_explorer_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pe_food_id TEXT NOT NULL REFERENCES source_phenol_explorer_foods(pe_food_id),
  compound_name TEXT NOT NULL,              -- "Quercetin 3-O-glucoside"
  compound_class TEXT,                      -- "Flavonols"
  aglycone TEXT,                            -- "Quercetin"
  mean_value NUMERIC,
  unit TEXT,                                -- "mg/100g"
  n_values INTEGER,                         -- Number of data points
  std_dev NUMERIC,
  our_compound_id UUID REFERENCES compounds(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pe_foods_name ON source_phenol_explorer_foods USING gin(name gin_trgm_ops);
CREATE INDEX idx_pe_values_food ON source_phenol_explorer_values(pe_food_id);

-- ============================================================================
-- EXTERNAL SOURCE: Dr. Duke's Phytochemical DB (downloaded, imported)
-- ============================================================================

CREATE TABLE source_duke_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duke_id TEXT NOT NULL UNIQUE,
  common_name TEXT NOT NULL,
  scientific_name TEXT,
  family TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE source_duke_compounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duke_plant_id TEXT NOT NULL REFERENCES source_duke_plants(duke_id),
  compound_name TEXT NOT NULL,
  activity TEXT,                            -- Biological activity
  part TEXT,                                -- "Leaf", "Root", "Fruit"
  low_ppm NUMERIC,
  high_ppm NUMERIC,
  our_compound_id UUID REFERENCES compounds(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_duke_plants_name ON source_duke_plants USING gin(common_name gin_trgm_ops);
CREATE INDEX idx_duke_plants_scientific ON source_duke_plants USING gin(scientific_name gin_trgm_ops);

-- ============================================================================
-- AI FOOD MATCHING CACHE
-- ============================================================================

CREATE TABLE food_source_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  our_food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,                -- 'foodb', 'phenol_explorer', 'duke'
  source_food_id TEXT NOT NULL,             -- ID in external source
  match_confidence NUMERIC NOT NULL,        -- 0.0 - 1.0
  match_method TEXT NOT NULL,               -- 'exact', 'fuzzy', 'ai', 'manual'
  verified_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(our_food_id, source_type)
);

CREATE INDEX idx_food_matches_food ON food_source_matches(our_food_id);
CREATE INDEX idx_food_matches_source ON food_source_matches(source_type, source_food_id);

-- ============================================================================
-- RESEARCH AGENT RESULTS
-- ============================================================================

CREATE TABLE research_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  compound_id UUID NOT NULL REFERENCES compounds(id),
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,

  -- Source tracking
  pubmed_id TEXT,                           -- e.g., "PMID:12345678"
  doi TEXT,
  citation TEXT NOT NULL,                   -- Full citation string
  extraction_context TEXT,                  -- The text snippet extracted from

  -- Quality metrics
  confidence NUMERIC NOT NULL,              -- 0.0 - 1.0
  methodology TEXT,                         -- "HPLC", "spectrophotometry", etc.
  sample_size INTEGER,
  study_type TEXT,                          -- "in_vitro", "food_analysis", etc.

  -- Processing
  extracted_by TEXT NOT NULL,               -- 'claude-3-opus', 'gpt-4', etc.
  verified_by UUID REFERENCES user_profiles(id),
  status TEXT NOT NULL DEFAULT 'pending',   -- 'pending', 'approved', 'rejected'

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_research_food ON research_extractions(food_id);
CREATE INDEX idx_research_compound ON research_extractions(compound_id);
CREATE INDEX idx_research_status ON research_extractions(status);
```

### Updated food_sources Enum

```sql
-- Add new source types to existing enum
ALTER TYPE api_source_enum ADD VALUE IF NOT EXISTS 'FOODB';
ALTER TYPE api_source_enum ADD VALUE IF NOT EXISTS 'PHENOL_EXPLORER';
ALTER TYPE api_source_enum ADD VALUE IF NOT EXISTS 'DUKE';
ALTER TYPE api_source_enum ADD VALUE IF NOT EXISTS 'RESEARCH';
```

---

## File Structure

```
/home/kodd/Nutri/
├── lib/
│   ├── services/
│   │   ├── usda-client.ts              # Existing
│   │   ├── cnf-client.ts               # Existing
│   │   ├── open-food-facts-client.ts   # NEW: OFF API client
│   │   └── nutrient-mapper.ts          # Existing (extend for new sources)
│   │
│   ├── sources/                         # NEW: External source managers
│   │   ├── foodb/
│   │   │   ├── importer.ts             # One-time import from download
│   │   │   ├── searcher.ts             # Search local foodb tables
│   │   │   └── mapper.ts               # Map FooDB compounds → our compounds
│   │   ├── phenol-explorer/
│   │   │   ├── importer.ts
│   │   │   ├── searcher.ts
│   │   │   └── mapper.ts
│   │   ├── duke/
│   │   │   ├── importer.ts
│   │   │   ├── searcher.ts
│   │   │   └── mapper.ts
│   │   └── index.ts                    # Unified source interface
│   │
│   ├── matching/                        # NEW: AI food matching
│   │   ├── food-matcher.ts             # Main matching orchestrator
│   │   ├── fuzzy-matcher.ts            # pg_trgm-based fuzzy matching
│   │   ├── ai-matcher.ts               # Claude-based semantic matching
│   │   └── match-cache.ts              # Cache management
│   │
│   ├── research/                        # NEW: AI research agents
│   │   ├── pubmed-client.ts            # PubMed E-utilities API
│   │   ├── paper-fetcher.ts            # Fetch full-text from PMC
│   │   ├── extraction-agent.ts         # LLM-based value extraction
│   │   ├── citation-formatter.ts       # Format citations
│   │   └── research-orchestrator.ts    # Coordinate research flow
│   │
│   ├── etl/
│   │   ├── orchestrator.ts             # Existing (extend)
│   │   ├── extractors/
│   │   │   ├── usda-extractor.ts       # Existing
│   │   │   ├── cnf-extractor.ts        # Existing
│   │   │   └── multi-source-extractor.ts  # NEW: Tier 2 extraction
│   │   └── loaders/
│   │       └── database-loader.ts      # Existing (extend)
│   │
│   └── queue/
│       ├── food-import-queue.ts        # Existing
│       ├── job-types.ts                # Existing (add new job types)
│       └── worker.ts                   # Existing (add new handlers)
│
├── scripts/
│   ├── import-foodb.ts                 # One-time FooDB import
│   ├── import-phenol-explorer.ts       # One-time PE import
│   ├── import-duke.ts                  # One-time Duke import
│   └── map-external-compounds.ts       # Map external → our compounds
│
└── data/                                # NEW: Downloaded source files
    ├── foodb/
    │   └── .gitkeep                    # Downloaded MySQL dump goes here
    ├── phenol-explorer/
    │   └── .gitkeep                    # Downloaded Access DB goes here
    └── duke/
        └── .gitkeep                    # Downloaded CSVs go here
```

---

## Implementation Details

### Tier 1: API Clients

#### Open Food Facts Client (New)

```typescript
// lib/services/open-food-facts-client.ts

const OFF_BASE_URL = 'https://world.openfoodfacts.org/api/v2';

export class OpenFoodFactsClient {

  async searchByName(query: string, limit = 20): Promise<OFFProduct[]> {
    const res = await fetch(
      `${OFF_BASE_URL}/search?search_terms=${encodeURIComponent(query)}&page_size=${limit}&json=1`
    );
    const data = await res.json();
    return data.products || [];
  }

  async getByBarcode(barcode: string): Promise<OFFProduct | null> {
    const res = await fetch(`${OFF_BASE_URL}/product/${barcode}.json`);
    const data = await res.json();
    return data.status === 1 ? data.product : null;
  }

  extractNutrients(product: OFFProduct): StandardizedNutrient[] {
    const nutriments = product.nutriments || {};
    const nutrients: StandardizedNutrient[] = [];

    // Map OFF fields to our compounds
    const mappings = {
      'energy-kcal_100g': { name: 'Energy', unit: 'kcal' },
      'proteins_100g': { name: 'Protein', unit: 'g' },
      'carbohydrates_100g': { name: 'Total Carbohydrate', unit: 'g' },
      'fat_100g': { name: 'Total Fat', unit: 'g' },
      'fiber_100g': { name: 'Dietary Fiber', unit: 'g' },
      'sugars_100g': { name: 'Total Sugars', unit: 'g' },
      'salt_100g': { name: 'Sodium', unit: 'mg', multiplier: 400 }, // salt → sodium
      // ... more mappings
    };

    for (const [offKey, mapping] of Object.entries(mappings)) {
      if (nutriments[offKey] !== undefined) {
        nutrients.push({
          name: mapping.name,
          value: nutriments[offKey] * (mapping.multiplier || 1),
          unit: mapping.unit,
          source: 'OFF'
        });
      }
    }

    return nutrients;
  }
}
```

### Tier 2: AI Food Matcher

```typescript
// lib/matching/food-matcher.ts

import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export class FoodMatcher {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic();
  }

  /**
   * Find matching foods across all external sources
   */
  async findMatches(foodName: string, options?: MatchOptions): Promise<SourceMatch[]> {
    const matches: SourceMatch[] = [];

    // Step 1: Try exact matches first (fastest)
    const exactMatches = await this.findExactMatches(foodName);
    matches.push(...exactMatches);

    // Step 2: Fuzzy matches using pg_trgm
    const fuzzyMatches = await this.findFuzzyMatches(foodName, 0.3);
    matches.push(...fuzzyMatches.filter(m => !this.isDuplicate(m, matches)));

    // Step 3: If low confidence or few matches, use AI
    if (matches.length < 3 || matches.every(m => m.confidence < 0.7)) {
      const aiMatches = await this.findAIMatches(foodName, matches);
      matches.push(...aiMatches.filter(m => !this.isDuplicate(m, matches)));
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Fuzzy match using PostgreSQL trigram similarity
   */
  private async findFuzzyMatches(foodName: string, threshold: number): Promise<SourceMatch[]> {
    const results: SourceMatch[] = [];

    // Search FooDB
    const foodbMatches = await db.execute(sql`
      SELECT
        foodb_id,
        name,
        name_scientific,
        similarity(name, ${foodName}) as sim
      FROM source_foodb_foods
      WHERE similarity(name, ${foodName}) > ${threshold}
         OR similarity(name_scientific, ${foodName}) > ${threshold}
      ORDER BY sim DESC
      LIMIT 5
    `);

    for (const row of foodbMatches.rows) {
      results.push({
        sourceType: 'foodb',
        sourceFoodId: row.foodb_id,
        sourceFoodName: row.name,
        confidence: row.sim,
        matchMethod: 'fuzzy'
      });
    }

    // Search Phenol-Explorer
    const peMatches = await db.execute(sql`
      SELECT
        pe_food_id,
        name,
        similarity(name, ${foodName}) as sim
      FROM source_phenol_explorer_foods
      WHERE similarity(name, ${foodName}) > ${threshold}
      ORDER BY sim DESC
      LIMIT 5
    `);

    for (const row of peMatches.rows) {
      results.push({
        sourceType: 'phenol_explorer',
        sourceFoodId: row.pe_food_id,
        sourceFoodName: row.name,
        confidence: row.sim,
        matchMethod: 'fuzzy'
      });
    }

    // Search Dr. Duke's
    const dukeMatches = await db.execute(sql`
      SELECT
        duke_id,
        common_name,
        scientific_name,
        GREATEST(
          similarity(common_name, ${foodName}),
          similarity(scientific_name, ${foodName})
        ) as sim
      FROM source_duke_plants
      WHERE similarity(common_name, ${foodName}) > ${threshold}
         OR similarity(scientific_name, ${foodName}) > ${threshold}
      ORDER BY sim DESC
      LIMIT 5
    `);

    for (const row of dukeMatches.rows) {
      results.push({
        sourceType: 'duke',
        sourceFoodId: row.duke_id,
        sourceFoodName: row.common_name,
        confidence: row.sim,
        matchMethod: 'fuzzy'
      });
    }

    return results;
  }

  /**
   * AI-powered semantic matching for difficult cases
   */
  private async findAIMatches(
    foodName: string,
    existingMatches: SourceMatch[]
  ): Promise<SourceMatch[]> {

    // Get candidate foods from each source (top 20 by name similarity)
    const candidates = await this.getCandidateFoods(foodName, 20);

    const prompt = `You are a food matching expert. Match the query food to the most appropriate items from our databases.

QUERY FOOD: "${foodName}"

CANDIDATE FOODS:
${candidates.map((c, i) => `${i + 1}. [${c.source}] ${c.name}${c.scientific ? ` (${c.scientific})` : ''}`).join('\n')}

EXISTING MATCHES (for context):
${existingMatches.map(m => `- [${m.sourceType}] ${m.sourceFoodName} (${(m.confidence * 100).toFixed(0)}%)`).join('\n') || 'None'}

For each source (foodb, phenol_explorer, duke), identify the BEST match if one exists.
Consider:
- Common name variations (e.g., "broccoli" = "broccoli, raw" = "Brassica oleracea var. italica")
- Regional naming differences
- Scientific vs common names
- Part specificity (whole food vs specific part)

Return JSON array:
[
  {
    "source": "foodb|phenol_explorer|duke",
    "candidate_index": <1-based index>,
    "confidence": <0.0-1.0>,
    "reasoning": "<brief explanation>"
  }
]

Only include matches with confidence > 0.5. Return empty array if no good matches.`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const aiResults = JSON.parse(jsonMatch[0]);

    return aiResults.map((r: any) => ({
      sourceType: r.source,
      sourceFoodId: candidates[r.candidate_index - 1]?.id,
      sourceFoodName: candidates[r.candidate_index - 1]?.name,
      confidence: r.confidence,
      matchMethod: 'ai',
      reasoning: r.reasoning
    }));
  }
}
```

### Tier 3: Research Agent

```typescript
// lib/research/research-orchestrator.ts

import { PubMedClient } from './pubmed-client';
import { ExtractionAgent } from './extraction-agent';
import { db } from '@/db';

export class ResearchOrchestrator {
  private pubmed: PubMedClient;
  private extractor: ExtractionAgent;

  constructor() {
    this.pubmed = new PubMedClient();
    this.extractor = new ExtractionAgent();
  }

  /**
   * Research missing compounds for a food
   */
  async researchFood(foodId: string, foodName: string): Promise<ResearchResult> {
    // 1. Identify which compound types are missing
    const missingTypes = await this.getMissingCompoundTypes(foodId);

    if (missingTypes.length === 0) {
      return { status: 'complete', extractionsCount: 0 };
    }

    const extractions: ResearchExtraction[] = [];

    // 2. For each missing type, search PubMed
    for (const compoundType of missingTypes) {
      const compounds = await this.getCompoundsOfType(compoundType);

      for (const compound of compounds) {
        // Build search query
        const query = this.buildSearchQuery(foodName, compound.name, compoundType);

        // Search PubMed
        const articles = await this.pubmed.search(query, { maxResults: 10 });

        if (articles.length === 0) continue;

        // Fetch abstracts
        const abstracts = await this.pubmed.fetchAbstracts(
          articles.map(a => a.pmid)
        );

        // Extract values using LLM
        for (const abstract of abstracts) {
          const extraction = await this.extractor.extractValue({
            foodName,
            compoundName: compound.name,
            text: abstract.abstract,
            pmid: abstract.pmid,
            title: abstract.title
          });

          if (extraction && extraction.confidence > 0.6) {
            extractions.push({
              foodId,
              compoundId: compound.id,
              ...extraction
            });
          }
        }
      }
    }

    // 3. Store extractions (pending review)
    if (extractions.length > 0) {
      await this.storeExtractions(extractions);
    }

    return {
      status: 'complete',
      extractionsCount: extractions.length,
      missingTypesSearched: missingTypes
    };
  }

  private buildSearchQuery(food: string, compound: string, type: string): string {
    // Build targeted PubMed query
    const queries: Record<string, string> = {
      PROCESSING_COMPOUND: `"${food}"[Title/Abstract] AND ("${compound}"[Title/Abstract] OR "Maillard"[Title/Abstract]) AND ("content" OR "concentration" OR "level")`,
      MYCOTOXIN: `"${food}"[Title/Abstract] AND "${compound}"[Title/Abstract] AND ("contamination" OR "occurrence" OR "survey")`,
      GLUCOSINOLATE: `"${food}"[Title/Abstract] AND ("${compound}"[Title/Abstract] OR "glucosinolate"[Title/Abstract]) AND ("content" OR "mg" OR "μmol")`,
      // ... other types
    };

    return queries[type] || `"${food}"[Title/Abstract] AND "${compound}"[Title/Abstract] AND "content"`;
  }
}
```

```typescript
// lib/research/extraction-agent.ts

import Anthropic from '@anthropic-ai/sdk';

export class ExtractionAgent {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic();
  }

  async extractValue(input: ExtractionInput): Promise<ExtractionResult | null> {
    const prompt = `Extract the compound concentration from this research abstract.

FOOD: ${input.foodName}
COMPOUND: ${input.compoundName}
PAPER TITLE: ${input.title}
PMID: ${input.pmid}

ABSTRACT:
${input.text}

Extract:
1. The concentration/content value for ${input.compoundName} in ${input.foodName}
2. The unit (convert to mg/100g if possible)
3. The analytical method used (HPLC, spectrophotometry, etc.)
4. Sample size if mentioned
5. Your confidence in this extraction (0.0-1.0)

Return JSON:
{
  "value": <number or null if not found>,
  "unit": "<string>",
  "original_value": "<as stated in paper>",
  "original_unit": "<as stated in paper>",
  "methodology": "<string or null>",
  "sample_size": <number or null>,
  "confidence": <0.0-1.0>,
  "extraction_context": "<the sentence(s) containing the value>",
  "notes": "<any caveats or uncertainties>"
}

If no concentration value is found for this specific food-compound pair, return:
{ "value": null, "confidence": 0 }`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const result = JSON.parse(jsonMatch[0]);

    if (result.value === null) return null;

    return {
      value: result.value,
      unit: result.unit,
      methodology: result.methodology,
      sampleSize: result.sample_size,
      confidence: result.confidence,
      extractionContext: result.extraction_context,
      citation: `${input.title}. PMID: ${input.pmid}`,
      pubmedId: input.pmid
    };
  }
}
```

### New Job Types

```typescript
// lib/queue/job-types.ts (additions)

export const RESEARCH_COMPOUNDS = 'RESEARCH_COMPOUNDS';

export interface ResearchCompoundsPayload {
  foodId: string;
  foodName: string;
  priority?: number;
  compoundTypes?: string[];  // Optional: limit to specific types
}

export const researchCompoundsSchema = z.object({
  foodId: z.string().uuid(),
  foodName: z.string().min(1),
  priority: z.number().min(1).max(10).optional().default(5),
  compoundTypes: z.array(z.string()).optional()
});
```

---

## Integration with Existing ETL

```typescript
// lib/etl/orchestrator.ts (modified)

export class ETLOrchestrator {

  async processSingleFoodImport(fdcId: number, userId?: string): Promise<ETLResult> {
    // ... existing code ...

    // EXISTING: Tier 1 - USDA extraction
    const usdaData = await this.usdaExtractor.extract(fdcId);

    // NEW: Also fetch from CNF if available
    const cnfMatch = await this.cnfClient.findByName(usdaData.description);
    let cnfData = null;
    if (cnfMatch) {
      cnfData = await this.cnfExtractor.extract(cnfMatch.foodCode);
    }

    // NEW: Tier 2 - Search local databases
    const localMatches = await this.foodMatcher.findMatches(usdaData.description);
    const tier2Data = await this.multiSourceExtractor.extractFromMatches(localMatches);

    // Merge all sources
    const mergedNutrients = this.mergeNutrients([
      { source: 'FDC', data: usdaData.nutrients },
      { source: 'CNF', data: cnfData?.nutrients },
      { source: 'FOODB', data: tier2Data.foodb },
      { source: 'PHENOL_EXPLORER', data: tier2Data.phenolExplorer },
      { source: 'DUKE', data: tier2Data.duke }
    ]);

    // Load to database
    const result = await this.databaseLoader.load({
      food: usdaData,
      nutrients: mergedNutrients,
      sourceMatches: localMatches
    });

    // NEW: Queue Tier 3 research job (async)
    await foodImportQueue.add(RESEARCH_COMPOUNDS, {
      foodId: result.foodId,
      foodName: usdaData.description,
      priority: 10  // Low priority, background
    });

    return result;
  }
}
```

---

## Data Flow Summary

| Step | Trigger | Sources | Time | Compounds |
|------|---------|---------|------|-----------|
| **Tier 1** | Food added | USDA API, CNF API, OFF API | ~2s | ~150 |
| **Tier 2** | Immediate after Tier 1 | FooDB, Phenol-Explorer, Duke (local) | ~500ms | ~50-100 |
| **Tier 3** | Background job | PubMed + LLM extraction | ~5-30min | ~5-20 |

---

## Scalability Considerations

### Database
- External source tables use separate schemas, can be partitioned
- Indexes on food names use `gin_trgm_ops` for fast fuzzy search
- Match cache prevents repeated AI calls

### API Rate Limits
- USDA: 1,000/hr → Use cached CNF for backup
- PubMed: 3 req/sec → Respect in research agent
- Claude: Token limits → Batch abstracts when possible

### Storage Estimates
- FooDB import: ~500MB in Postgres
- Phenol-Explorer: ~50MB
- Dr. Duke's: ~100MB
- Research extractions: ~1KB per extraction × 10 per food × 150K foods = ~1.5GB

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create database schema for external sources
- [ ] Build FooDB importer script
- [ ] Build Phenol-Explorer importer script
- [ ] Build Dr. Duke's importer script
- [ ] Create compound mapping tables (external → our compounds)

### Phase 2: Tier 2 Integration (Week 3)
- [ ] Implement fuzzy matcher with pg_trgm
- [ ] Implement AI matcher with Claude
- [ ] Integrate Tier 2 into ETL orchestrator
- [ ] Add match caching

### Phase 3: Tier 3 Research (Week 4-5)
- [ ] Build PubMed E-utilities client
- [ ] Build LLM extraction agent
- [ ] Add RESEARCH_COMPOUNDS job type
- [ ] Implement research orchestrator
- [ ] Build approval UI for research extractions

### Phase 4: Polish (Week 6)
- [ ] Add Open Food Facts API client
- [ ] Optimize matching performance
- [ ] Add monitoring/metrics
- [ ] Documentation
