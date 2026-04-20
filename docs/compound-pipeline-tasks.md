# Compound Data Pipeline - Task Breakdown

## Overview

This document breaks down EVERY task needed to build the compound data pipeline. Tasks are ordered by dependency and grouped into phases. Each task is simple enough that you could explain it to a child.

---

## Pre-Implementation Checklist

Before writing any code, these things must be true:

- [ ] PostgreSQL `pg_trgm` extension is enabled (for fuzzy matching)
- [ ] Redis/Upstash is configured (for background jobs)
- [ ] Anthropic API key is set (for AI matching + research extraction)
- [ ] Sufficient disk space for downloads (~3GB)
- [ ] NCBI API key obtained (for PubMed - optional but recommended)

---

## PHASE 0: Prerequisites & Environment

### 0.1 Enable PostgreSQL Extensions
```
[ ] 0.1.1 - Check if pg_trgm extension exists in Supabase
[ ] 0.1.2 - Enable pg_trgm extension: CREATE EXTENSION IF NOT EXISTS pg_trgm
[ ] 0.1.3 - Verify extension works: SELECT similarity('broccoli', 'brocoli')
```

### 0.2 Environment Variables
```
[ ] 0.2.1 - Add NCBI_API_KEY to .env (get from: https://www.ncbi.nlm.nih.gov/account/settings/)
[ ] 0.2.2 - Verify ANTHROPIC_API_KEY exists and works
[ ] 0.2.3 - Verify UPSTASH_REDIS_REST_URL exists and works
[ ] 0.2.4 - Add DATA_DIR=/home/kodd/Nutri/data to .env (where downloads go)
```

### 0.3 Create Data Directory Structure
```
[ ] 0.3.1 - Create /home/kodd/Nutri/data/ directory
[ ] 0.3.2 - Create /home/kodd/Nutri/data/foodb/ subdirectory
[ ] 0.3.3 - Create /home/kodd/Nutri/data/phenol-explorer/ subdirectory
[ ] 0.3.4 - Create /home/kodd/Nutri/data/duke/ subdirectory
[ ] 0.3.5 - Add data/ to .gitignore (these files are too large for git)
```

---

## PHASE 1: Download & Parse External Data Sources

### 1.1 FooDB Download & Parse

#### 1.1.1 Download FooDB
```
[ ] 1.1.1.1 - Go to https://foodb.ca/downloads
[ ] 1.1.1.2 - Download "FooDB CSV files" (not MySQL dump - easier to parse)
[ ] 1.1.1.3 - Save to /home/kodd/Nutri/data/foodb/
[ ] 1.1.1.4 - Unzip the downloaded file
[ ] 1.1.1.5 - List all CSV files and document what each contains
```

#### 1.1.2 Understand FooDB Structure
```
[ ] 1.1.2.1 - Open Food.csv, note the columns (id, name, scientific_name, etc.)
[ ] 1.1.2.2 - Open Compound.csv, note the columns
[ ] 1.1.2.3 - Open Content.csv, note how foods link to compounds
[ ] 1.1.2.4 - Document the relationships in a comment in the import script
```

#### 1.1.3 Create FooDB Parser
```
[ ] 1.1.3.1 - Create file: /home/kodd/Nutri/scripts/sources/parse-foodb.ts
[ ] 1.1.3.2 - Add function to read Food.csv using csv-parse library
[ ] 1.1.3.3 - Add function to read Compound.csv
[ ] 1.1.3.4 - Add function to read Content.csv (food-compound relationships)
[ ] 1.1.3.5 - Add function to join the data into usable structure
[ ] 1.1.3.6 - Test parser with: npx tsx scripts/sources/parse-foodb.ts
[ ] 1.1.3.7 - Log: "Parsed X foods, Y compounds, Z content rows"
```

### 1.2 Phenol-Explorer Download & Parse

#### 1.2.1 Download Phenol-Explorer
```
[ ] 1.2.1.1 - Go to http://phenol-explorer.eu/downloads
[ ] 1.2.1.2 - Download the Microsoft Access database file (.mdb or .accdb)
[ ] 1.2.1.3 - Save to /home/kodd/Nutri/data/phenol-explorer/
[ ] 1.2.1.4 - Install mdb-tools (Linux) or use mdbtools npm package
        Alternative: Export to CSV using MS Access or LibreOffice Base
```

#### 1.2.2 Convert Access DB to CSV
```
[ ] 1.2.2.1 - List tables in Access DB: mdb-tables phenol-explorer.mdb
[ ] 1.2.2.2 - Export Foods table: mdb-export phenol-explorer.mdb Foods > foods.csv
[ ] 1.2.2.3 - Export Compounds table to CSV
[ ] 1.2.2.4 - Export Content/Values table to CSV
[ ] 1.2.2.5 - Document the table relationships
```

#### 1.2.3 Create Phenol-Explorer Parser
```
[ ] 1.2.3.1 - Create file: /home/kodd/Nutri/scripts/sources/parse-phenol-explorer.ts
[ ] 1.2.3.2 - Add function to read foods CSV
[ ] 1.2.3.3 - Add function to read compounds CSV
[ ] 1.2.3.4 - Add function to read content values CSV
[ ] 1.2.3.5 - Test parser
[ ] 1.2.3.6 - Log: "Parsed X foods, Y polyphenols, Z values"
```

### 1.3 Dr. Duke's Download & Parse

#### 1.3.1 Download Dr. Duke's
```
[ ] 1.3.1.1 - Go to https://data.nal.usda.gov/dataset/dr-dukes-phytochemical-and-ethnobotanical-databases
[ ] 1.3.1.2 - Download Duke-Source-CSV.zip
[ ] 1.3.1.3 - Save to /home/kodd/Nutri/data/duke/
[ ] 1.3.1.4 - Unzip the file
[ ] 1.3.1.5 - List all CSV files and document what each contains
```

#### 1.3.2 Understand Duke's Structure
```
[ ] 1.3.2.1 - Open Plants.csv, note the columns (scientific name, common name, family)
[ ] 1.3.2.2 - Open Chemicals.csv, note the columns
[ ] 1.3.2.3 - Open Plant-Chemicals.csv (or similar), note the relationship
[ ] 1.3.2.4 - Note: Duke's data is in PPM (parts per million), need to convert to mg/100g
```

#### 1.3.3 Create Duke's Parser
```
[ ] 1.3.3.1 - Create file: /home/kodd/Nutri/scripts/sources/parse-duke.ts
[ ] 1.3.3.2 - Add function to read Plants CSV
[ ] 1.3.3.3 - Add function to read Chemicals CSV
[ ] 1.3.3.4 - Add function to read Plant-Chemical relationships
[ ] 1.3.3.5 - Add PPM to mg/100g conversion function
[ ] 1.3.3.6 - Test parser
[ ] 1.3.3.7 - Log: "Parsed X plants, Y chemicals, Z relationships"
```

---

## PHASE 2: Database Schema

### 2.1 Create Source Tables

#### 2.1.1 FooDB Tables
```
[ ] 2.1.1.1 - Create file: /home/kodd/Nutri/db/schema/source_foodb.ts
[ ] 2.1.1.2 - Define source_foodb_foods table with columns:
              - id (uuid, primary key)
              - foodb_id (text, unique)
              - name (text)
              - name_scientific (text, nullable)
              - description (text, nullable)
              - food_group (text, nullable)
              - food_subgroup (text, nullable)
              - created_at (timestamp)
[ ] 2.1.1.3 - Define source_foodb_compounds table with columns:
              - id (uuid, primary key)
              - foodb_id (text, unique) - the compound's FooDB ID
              - name (text)
              - compound_class (text, nullable)
              - pubchem_id (text, nullable)
              - our_compound_id (uuid, nullable, FK to compounds)
              - created_at (timestamp)
[ ] 2.1.1.4 - Define source_foodb_contents table with columns:
              - id (uuid, primary key)
              - foodb_food_id (text, FK to source_foodb_foods)
              - foodb_compound_id (text, FK to source_foodb_compounds)
              - orig_content (numeric, nullable)
              - orig_unit (text, nullable)
              - standard_content (numeric, nullable) - converted to mg/100g
              - citation (text, nullable)
              - created_at (timestamp)
[ ] 2.1.1.5 - Add GIN index on source_foodb_foods.name for fuzzy search
[ ] 2.1.1.6 - Export tables from schema file
```

#### 2.1.2 Phenol-Explorer Tables
```
[ ] 2.1.2.1 - Create file: /home/kodd/Nutri/db/schema/source_phenol_explorer.ts
[ ] 2.1.2.2 - Define source_pe_foods table (similar structure to foodb)
[ ] 2.1.2.3 - Define source_pe_compounds table
[ ] 2.1.2.4 - Define source_pe_contents table with:
              - mean_value
              - std_dev
              - n_values (number of data points)
              - retention_factor (for processed foods)
[ ] 2.1.2.5 - Add GIN index on food name
[ ] 2.1.2.6 - Export tables
```

#### 2.1.3 Dr. Duke's Tables
```
[ ] 2.1.3.1 - Create file: /home/kodd/Nutri/db/schema/source_duke.ts
[ ] 2.1.3.2 - Define source_duke_plants table with:
              - common_name
              - scientific_name
              - family
[ ] 2.1.3.3 - Define source_duke_chemicals table
[ ] 2.1.3.4 - Define source_duke_plant_chemicals table with:
              - plant_part (leaf, root, fruit, etc.)
              - low_ppm
              - high_ppm
              - std_dev (if available)
[ ] 2.1.3.5 - Add GIN indexes on both common_name and scientific_name
[ ] 2.1.3.6 - Export tables
```

### 2.2 Create Matching & Research Tables

#### 2.2.1 Food Source Matches Table
```
[ ] 2.2.1.1 - Create file: /home/kodd/Nutri/db/schema/food_source_matches.ts
[ ] 2.2.1.2 - Define food_source_matches table with:
              - id (uuid, primary key)
              - our_food_id (uuid, FK to foods)
              - source_type (text: 'foodb' | 'phenol_explorer' | 'duke')
              - source_food_id (text) - ID in the external source
              - source_food_name (text) - name in the external source
              - match_confidence (numeric 0-1)
              - match_method (text: 'exact' | 'fuzzy' | 'ai' | 'manual')
              - verified_by (uuid, FK to user_profiles, nullable)
              - verified_at (timestamp, nullable)
              - created_at (timestamp)
[ ] 2.2.1.3 - Add unique constraint on (our_food_id, source_type)
[ ] 2.2.1.4 - Add index on source_type + source_food_id
[ ] 2.2.1.5 - Export table
```

#### 2.2.2 Research Extractions Table
```
[ ] 2.2.2.1 - Create file: /home/kodd/Nutri/db/schema/research_extractions.ts
[ ] 2.2.2.2 - Define research_extractions table with:
              - id (uuid, primary key)
              - food_id (uuid, FK to foods)
              - compound_id (uuid, FK to compounds)
              - value (numeric)
              - unit (text)
              - pubmed_id (text, nullable)
              - doi (text, nullable)
              - citation (text)
              - extraction_context (text) - the sentence with the value
              - methodology (text, nullable) - HPLC, etc.
              - sample_size (integer, nullable)
              - confidence (numeric 0-1)
              - extracted_by (text) - model name
              - status (text: 'pending' | 'approved' | 'rejected')
              - reviewed_by (uuid, FK to user_profiles, nullable)
              - reviewed_at (timestamp, nullable)
              - review_notes (text, nullable)
              - created_at (timestamp)
              - updated_at (timestamp)
[ ] 2.2.2.3 - Add indexes on food_id, compound_id, status
[ ] 2.2.2.4 - Export table
```

#### 2.2.3 Compound Mappings Table
```
[ ] 2.2.3.1 - Create file: /home/kodd/Nutri/db/schema/external_compound_mappings.ts
[ ] 2.2.3.2 - Define external_compound_mappings table with:
              - id (uuid, primary key)
              - source_type (text: 'foodb' | 'phenol_explorer' | 'duke')
              - external_compound_id (text)
              - external_compound_name (text)
              - our_compound_id (uuid, FK to compounds, nullable)
              - mapping_confidence (numeric 0-1)
              - mapping_method (text: 'exact' | 'fuzzy' | 'ai' | 'manual')
              - verified_by (uuid, nullable)
              - created_at (timestamp)
[ ] 2.2.3.3 - Add unique constraint on (source_type, external_compound_id)
[ ] 2.2.3.4 - Export table
```

### 2.3 Update Schema Index
```
[ ] 2.3.1 - Open /home/kodd/Nutri/db/schema/index.ts
[ ] 2.3.2 - Add exports for all new source tables
[ ] 2.3.3 - Add exports for matching and research tables
```

### 2.4 Generate & Run Migration
```
[ ] 2.4.1 - Run: npm run db:generate
[ ] 2.4.2 - Review generated migration file in /home/kodd/Nutri/drizzle/
[ ] 2.4.3 - Run: npm run db:migrate
[ ] 2.4.4 - Verify tables exist in Supabase dashboard
```

---

## PHASE 3: Import Data into Database

### 3.1 Create Import Scripts

#### 3.1.1 FooDB Importer
```
[ ] 3.1.1.1 - Create file: /home/kodd/Nutri/scripts/import/import-foodb.ts
[ ] 3.1.1.2 - Import the parser from Phase 1
[ ] 3.1.1.3 - Add function to batch insert foods (100 at a time)
[ ] 3.1.1.4 - Add function to batch insert compounds
[ ] 3.1.1.5 - Add function to batch insert contents
[ ] 3.1.1.6 - Add progress logging: "Imported X/Y foods..."
[ ] 3.1.1.7 - Add error handling for duplicate entries
[ ] 3.1.1.8 - Test with: npx tsx scripts/import/import-foodb.ts
[ ] 3.1.1.9 - Verify data in Supabase: SELECT COUNT(*) FROM source_foodb_foods
```

#### 3.1.2 Phenol-Explorer Importer
```
[ ] 3.1.2.1 - Create file: /home/kodd/Nutri/scripts/import/import-phenol-explorer.ts
[ ] 3.1.2.2 - Import the parser
[ ] 3.1.2.3 - Add batch insert functions
[ ] 3.1.2.4 - Add progress logging
[ ] 3.1.2.5 - Test importer
[ ] 3.1.2.6 - Verify data in Supabase
```

#### 3.1.3 Duke's Importer
```
[ ] 3.1.3.1 - Create file: /home/kodd/Nutri/scripts/import/import-duke.ts
[ ] 3.1.3.2 - Import the parser
[ ] 3.1.3.3 - Add batch insert functions
[ ] 3.1.3.4 - Add PPM to mg/100g conversion during import
[ ] 3.1.3.5 - Add progress logging
[ ] 3.1.3.6 - Test importer
[ ] 3.1.3.7 - Verify data in Supabase
```

### 3.2 Run All Imports
```
[ ] 3.2.1 - Run FooDB import (may take 5-10 minutes)
[ ] 3.2.2 - Run Phenol-Explorer import
[ ] 3.2.3 - Run Duke's import
[ ] 3.2.4 - Log final counts for each source
```

---

## PHASE 4: Compound Mapping (External → Our Compounds)

### 4.1 Automatic Compound Mapping

#### 4.1.1 Exact Name Matching
```
[ ] 4.1.1.1 - Create file: /home/kodd/Nutri/scripts/mapping/map-compounds-exact.ts
[ ] 4.1.1.2 - Query all our compound names from compounds table
[ ] 4.1.1.3 - Query all FooDB compound names from source_foodb_compounds
[ ] 4.1.1.4 - For each FooDB compound, check if name matches any of ours (case-insensitive)
[ ] 4.1.1.5 - Insert matches into external_compound_mappings with confidence=1.0
[ ] 4.1.1.6 - Log: "Exact matched X/Y FooDB compounds"
[ ] 4.1.1.7 - Repeat for Phenol-Explorer compounds
[ ] 4.1.1.8 - Repeat for Duke's compounds
```

#### 4.1.2 Fuzzy Name Matching
```
[ ] 4.1.2.1 - Create file: /home/kodd/Nutri/scripts/mapping/map-compounds-fuzzy.ts
[ ] 4.1.2.2 - For unmapped external compounds, use pg_trgm similarity
[ ] 4.1.2.3 - Match if similarity > 0.7
[ ] 4.1.2.4 - Insert matches with confidence = similarity score
[ ] 4.1.2.5 - Log: "Fuzzy matched X additional compounds"
```

#### 4.1.3 AI Compound Mapping
```
[ ] 4.1.3.1 - Create file: /home/kodd/Nutri/scripts/mapping/map-compounds-ai.ts
[ ] 4.1.3.2 - Get remaining unmapped external compounds
[ ] 4.1.3.3 - Group into batches of 20
[ ] 4.1.3.4 - For each batch, ask Claude to match to our compound list
[ ] 4.1.3.5 - Prompt should include our compound names + types
[ ] 4.1.3.6 - Insert matches with confidence from AI response
[ ] 4.1.3.7 - Log: "AI matched X additional compounds"
```

### 4.2 Mapping Verification
```
[ ] 4.2.1 - Create report of all mappings grouped by source
[ ] 4.2.2 - Log how many external compounds mapped vs unmapped
[ ] 4.2.3 - Log which of OUR compounds have external mappings
[ ] 4.2.4 - Identify compound types with poor coverage
```

---

## PHASE 5: Food Matching System

### 5.1 Fuzzy Matcher

#### 5.1.1 Food Name Normalizer
```
[ ] 5.1.1.1 - Create file: /home/kodd/Nutri/lib/matching/normalize-food-name.ts
[ ] 5.1.1.2 - Add function to lowercase the name
[ ] 5.1.1.3 - Add function to remove ", raw", ", cooked", ", fresh", etc.
[ ] 5.1.1.4 - Add function to remove parenthetical info like "(with skin)"
[ ] 5.1.1.5 - Add function to handle plurals (apples → apple)
[ ] 5.1.1.6 - Export normalize() function
[ ] 5.1.1.7 - Test with examples:
              "Broccoli, raw" → "broccoli"
              "Apples, red delicious, with skin" → "apple red delicious"
              "Chicken breast, boneless, skinless" → "chicken breast"
```

#### 5.1.2 PostgreSQL Fuzzy Search Functions
```
[ ] 5.1.2.1 - Create file: /home/kodd/Nutri/lib/matching/fuzzy-matcher.ts
[ ] 5.1.2.2 - Add function searchFoodbFuzzy(foodName: string, threshold: number)
              - Uses: similarity(name, $1) > threshold
              - Returns: [{ foodb_id, name, similarity }]
[ ] 5.1.2.3 - Add function searchPhenolExplorerFuzzy(...)
[ ] 5.1.2.4 - Add function searchDukeFuzzy(...)
              - Search both common_name and scientific_name
[ ] 5.1.2.5 - Add function searchAllSourcesFuzzy(foodName) that calls all three
[ ] 5.1.2.6 - Test with: "broccoli" should find matches in all sources
```

### 5.2 AI Matcher

#### 5.2.1 Create AI Matching Service
```
[ ] 5.2.1.1 - Create file: /home/kodd/Nutri/lib/matching/ai-matcher.ts
[ ] 5.2.1.2 - Import Anthropic SDK
[ ] 5.2.1.3 - Create function getCandidates(foodName, limit) that:
              - Gets top 20 fuzzy matches from each source
              - Returns combined candidate list
[ ] 5.2.1.4 - Create function matchWithAI(foodName, candidates) that:
              - Builds prompt listing all candidates with source
              - Asks Claude to pick best match from each source
              - Returns: [{ source, sourceId, confidence, reasoning }]
[ ] 5.2.1.5 - Add rate limiting (max 1 request per second)
[ ] 5.2.1.6 - Add caching of AI results to prevent duplicate calls
[ ] 5.2.1.7 - Test with edge cases:
              "broccoli rabe" (different from broccoli)
              "chinese cabbage" (multiple types exist)
```

### 5.3 Match Orchestrator

#### 5.3.1 Create Main Matching Function
```
[ ] 5.3.1.1 - Create file: /home/kodd/Nutri/lib/matching/food-matcher.ts
[ ] 5.3.1.2 - Create function findSourceMatches(foodName: string):
              Step 1: Normalize food name
              Step 2: Try exact match (confidence = 1.0)
              Step 3: Try fuzzy match with threshold 0.6
              Step 4: If no good matches, try AI matching
              Step 5: Return best match per source
[ ] 5.3.1.3 - Create function saveMatches(ourFoodId, matches) that:
              - Inserts into food_source_matches table
              - Handles conflicts (update if better confidence)
[ ] 5.3.1.4 - Create function getExistingMatches(ourFoodId) that:
              - Returns cached matches from food_source_matches
[ ] 5.3.1.5 - Export: findSourceMatches, saveMatches, getExistingMatches
```

---

## PHASE 6: Tier 2 Data Extraction

### 6.1 Source Data Extractors

#### 6.1.1 FooDB Extractor
```
[ ] 6.1.1.1 - Create file: /home/kodd/Nutri/lib/sources/foodb/extractor.ts
[ ] 6.1.1.2 - Create function extractNutrients(foodbFoodId: string):
              - Query source_foodb_contents WHERE foodb_food_id = $1
              - Join with source_foodb_compounds to get our_compound_id
              - Filter out rows where our_compound_id is NULL (unmapped)
              - Return: [{ compoundId, value, unit, source: 'FOODB' }]
[ ] 6.1.1.3 - Add unit normalization (all to mg/100g where applicable)
[ ] 6.1.1.4 - Test with a known food ID
```

#### 6.1.2 Phenol-Explorer Extractor
```
[ ] 6.1.2.1 - Create file: /home/kodd/Nutri/lib/sources/phenol-explorer/extractor.ts
[ ] 6.1.2.2 - Create function extractPolyphenols(peFoodId: string):
              - Query source_pe_contents
              - Join to get our_compound_id
              - Include std_dev and n_values for confidence scoring
              - Return nutrients with source: 'PHENOL_EXPLORER'
[ ] 6.1.2.3 - Test with a known food
```

#### 6.1.3 Duke's Extractor
```
[ ] 6.1.3.1 - Create file: /home/kodd/Nutri/lib/sources/duke/extractor.ts
[ ] 6.1.3.2 - Create function extractPhytochemicals(dukePlantId: string):
              - Query source_duke_plant_chemicals
              - Convert PPM range to mg/100g: (low_ppm + high_ppm) / 2 / 10
              - Include plant_part in metadata
              - Return nutrients with source: 'DUKE'
[ ] 6.1.3.3 - Handle "whole plant" vs specific parts
[ ] 6.1.3.4 - Test with a known plant
```

### 6.2 Multi-Source Extractor

#### 6.2.1 Combine All Tier 2 Sources
```
[ ] 6.2.1.1 - Create file: /home/kodd/Nutri/lib/sources/multi-source-extractor.ts
[ ] 6.2.1.2 - Create function extractFromAllSources(matches: SourceMatch[]):
              - For each match, call appropriate extractor
              - Combine all results
              - Deduplicate by compound_id (keep highest confidence)
              - Return combined nutrient list
[ ] 6.2.1.3 - Add confidence scoring based on:
              - Source reliability (FOODB: 0.8, PE: 0.9, DUKE: 0.7)
              - Number of data points
              - Presence of std_dev
[ ] 6.2.1.4 - Test with "broccoli" - should get data from all 3 sources
```

---

## PHASE 7: ETL Integration

### 7.1 Modify ETL Orchestrator

#### 7.1.1 Add Tier 2 to Import Flow
```
[ ] 7.1.1.1 - Open /home/kodd/Nutri/lib/etl/orchestrator.ts
[ ] 7.1.1.2 - Import food-matcher and multi-source-extractor
[ ] 7.1.1.3 - In processSingleFoodImport(), after USDA extraction:
              - Call: const matches = await findSourceMatches(food.description)
              - Call: const tier2Data = await extractFromAllSources(matches)
              - Call: await saveMatches(foodId, matches)
[ ] 7.1.1.4 - Modify mergeNutrients() to accept tier2Data
[ ] 7.1.1.5 - Update databaseLoader.load() to save source matches
```

#### 7.1.2 Update Nutrient Merging
```
[ ] 7.1.2.1 - Open /home/kodd/Nutri/lib/etl/orchestrator.ts (or create new file)
[ ] 7.1.2.2 - Create function mergeMultiSourceNutrients(sources: SourceData[]):
              - Priority order: USDA > CNF > FOODB > PHENOL_EXPLORER > DUKE
              - For same compound from multiple sources, calculate weighted average
              - Track which sources contributed to each value
[ ] 7.1.2.3 - Update food_nutrient_values to store source info
[ ] 7.1.2.4 - Test merge with conflicting values
```

---

## PHASE 8: Open Food Facts Integration (Tier 1 Addition)

### 8.1 Create OFF Client

#### 8.1.1 Basic Client
```
[ ] 8.1.1.1 - Create file: /home/kodd/Nutri/lib/services/open-food-facts-client.ts
[ ] 8.1.1.2 - Define base URL: https://world.openfoodfacts.org/api/v2
[ ] 8.1.1.3 - Create function searchByName(query: string, limit: number)
[ ] 8.1.1.4 - Create function getByBarcode(barcode: string)
[ ] 8.1.1.5 - Add proper error handling for network failures
[ ] 8.1.1.6 - Test search with "broccoli"
```

#### 8.1.2 Nutrient Extraction
```
[ ] 8.1.2.1 - Create function extractNutrients(product: OFFProduct):
              - Map OFF fields (proteins_100g, etc.) to our compound names
              - Handle salt → sodium conversion (x 400)
              - Handle energy-kj to kcal conversion (/ 4.184)
              - Return standardized nutrients
[ ] 8.1.2.2 - Create mapping table for OFF field → our compound
[ ] 8.1.2.3 - Test with a real product
```

#### 8.1.3 Add to Search Route
```
[ ] 8.1.3.1 - Create file: /home/kodd/Nutri/app/api/foods/off/search/route.ts
[ ] 8.1.3.2 - Accept query parameter
[ ] 8.1.3.3 - Call OFF client
[ ] 8.1.3.4 - Return formatted results matching other search endpoints
[ ] 8.1.3.5 - Test endpoint with curl or browser
```

---

## PHASE 9: Research Agent (Tier 3)

### 9.1 PubMed Client

#### 9.1.1 Create E-utilities Client
```
[ ] 9.1.1.1 - Create file: /home/kodd/Nutri/lib/research/pubmed-client.ts
[ ] 9.1.1.2 - Define base URL: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/
[ ] 9.1.1.3 - Create function search(query: string, maxResults: number):
              - Use esearch.fcgi endpoint
              - Return list of PMIDs
[ ] 9.1.1.4 - Create function fetchAbstracts(pmids: string[]):
              - Use efetch.fcgi endpoint
              - Parse XML response
              - Return: [{ pmid, title, abstract, authors, year }]
[ ] 9.1.1.5 - Add rate limiting: max 3 requests per second
[ ] 9.1.1.6 - Add API key header if NCBI_API_KEY is set
[ ] 9.1.1.7 - Test with: search("broccoli sulforaphane content")
```

### 9.2 Extraction Agent

#### 9.2.1 Create LLM Extraction Service
```
[ ] 9.2.1.1 - Create file: /home/kodd/Nutri/lib/research/extraction-agent.ts
[ ] 9.2.1.2 - Import Anthropic SDK
[ ] 9.2.1.3 - Create extraction prompt template (see system design doc)
[ ] 9.2.1.4 - Create function extractValue(input: ExtractionInput):
              - input: { foodName, compoundName, title, abstract, pmid }
              - Send to Claude with extraction prompt
              - Parse JSON response
              - Return: { value, unit, confidence, context, methodology }
[ ] 9.2.1.5 - Add validation: value must be numeric, unit must be recognized
[ ] 9.2.1.6 - Test with a real abstract
```

### 9.3 Research Orchestrator

#### 9.3.1 Create Main Research Function
```
[ ] 9.3.1.1 - Create file: /home/kodd/Nutri/lib/research/research-orchestrator.ts
[ ] 9.3.1.2 - Create function getMissingCompoundTypes(foodId: string):
              - Query food_nutrient_values for this food
              - Compare against all compound types
              - Return types with no data: PROCESSING_COMPOUND, MYCOTOXIN, etc.
[ ] 9.3.1.3 - Create function buildSearchQuery(food, compound, type):
              - Different query templates per compound type
              - Example: MYCOTOXIN → "{food} {compound} contamination survey"
[ ] 9.3.1.4 - Create function researchFood(foodId, foodName):
              Step 1: Get missing compound types
              Step 2: For each type, get compounds of that type
              Step 3: Build PubMed query
              Step 4: Fetch abstracts
              Step 5: Extract values using LLM
              Step 6: Store in research_extractions (status: pending)
[ ] 9.3.1.5 - Add progress tracking
[ ] 9.3.1.6 - Add timeout handling (max 10 minutes per food)
```

### 9.4 Background Job Integration

#### 9.4.1 Add Job Type
```
[ ] 9.4.1.1 - Open /home/kodd/Nutri/lib/queue/job-types.ts
[ ] 9.4.1.2 - Add RESEARCH_COMPOUNDS = 'RESEARCH_COMPOUNDS'
[ ] 9.4.1.3 - Define ResearchCompoundsPayload interface:
              { foodId: string, foodName: string, priority?: number }
[ ] 9.4.1.4 - Add Zod schema for validation
```

#### 9.4.2 Add Job Handler
```
[ ] 9.4.2.1 - Open /home/kodd/Nutri/lib/queue/worker.ts
[ ] 9.4.2.2 - Import research orchestrator
[ ] 9.4.2.3 - Add case for RESEARCH_COMPOUNDS:
              - Call researchOrchestrator.researchFood()
              - Update job progress
              - Handle errors gracefully
[ ] 9.4.2.4 - Test by manually adding a job
```

#### 9.4.3 Trigger Research After Import
```
[ ] 9.4.3.1 - Open /home/kodd/Nutri/lib/etl/orchestrator.ts
[ ] 9.4.3.2 - After successful food import, add:
              await foodImportQueue.add(RESEARCH_COMPOUNDS, {
                foodId: result.foodId,
                foodName: food.description,
                priority: 10
              });
[ ] 9.4.3.3 - Log: "Queued research job for {foodName}"
```

---

## PHASE 10: Testing & Verification

### 10.1 End-to-End Test
```
[ ] 10.1.1 - Add a new food via the API: "Broccoli, raw"
[ ] 10.1.2 - Verify Tier 1 data (USDA nutrients) is saved
[ ] 10.1.3 - Verify food_source_matches has entries for FooDB, PE, Duke
[ ] 10.1.4 - Verify Tier 2 data (polyphenols, glucosinolates) is saved
[ ] 10.1.5 - Verify RESEARCH_COMPOUNDS job was queued
[ ] 10.1.6 - Wait for research job to complete
[ ] 10.1.7 - Check research_extractions for new entries
[ ] 10.1.8 - Query total compound count for this food - should be 100+
```

### 10.2 Data Quality Checks
```
[ ] 10.2.1 - Run: SELECT COUNT(DISTINCT compound_id) FROM food_nutrient_values WHERE food_id = X
[ ] 10.2.2 - Compare compound coverage across foods
[ ] 10.2.3 - Check for outlier values (10x normal range)
[ ] 10.2.4 - Verify unit consistency
```

---

## PHASE 11: Documentation & Cleanup

### 11.1 Update Documentation
```
[ ] 11.1.1 - Update CLAUDE.md with new file structure
[ ] 11.1.2 - Document new environment variables
[ ] 11.1.3 - Document import process for new data sources
[ ] 11.1.4 - Document compound mapping process
```

### 11.2 Create Maintenance Scripts
```
[ ] 11.2.1 - Create script to re-run imports (for source updates)
[ ] 11.2.2 - Create script to re-map unmapped compounds
[ ] 11.2.3 - Create script to check data staleness
```

---

## Summary: Task Counts by Phase

| Phase | Description | Task Count |
|-------|-------------|------------|
| 0 | Prerequisites | 12 |
| 1 | Download & Parse | 23 |
| 2 | Database Schema | 24 |
| 3 | Import Data | 13 |
| 4 | Compound Mapping | 12 |
| 5 | Food Matching | 17 |
| 6 | Tier 2 Extraction | 11 |
| 7 | ETL Integration | 7 |
| 8 | Open Food Facts | 9 |
| 9 | Research Agent | 18 |
| 10 | Testing | 10 |
| 11 | Documentation | 5 |
| **TOTAL** | | **~161 tasks** |

---

## Dependencies Graph

```
Phase 0 (Prerequisites)
    ↓
Phase 1 (Download & Parse) ←──────────────────┐
    ↓                                         │
Phase 2 (Database Schema)                     │
    ↓                                         │
Phase 3 (Import Data) ────────────────────────┘
    ↓
Phase 4 (Compound Mapping)
    ↓
Phase 5 (Food Matching)
    ↓
Phase 6 (Tier 2 Extraction)
    ↓
Phase 7 (ETL Integration) ←── Phase 8 (Open Food Facts)
    ↓
Phase 9 (Research Agent)
    ↓
Phase 10 (Testing)
    ↓
Phase 11 (Documentation)
```

---

## Quick Start: First 10 Tasks

If you want to start right now, do these first:

1. [ ] Enable pg_trgm extension in Supabase
2. [ ] Create /home/kodd/Nutri/data/ directory structure
3. [ ] Download FooDB CSV files
4. [ ] Download Dr. Duke's CSVs (easiest - already CSV format)
5. [ ] Create source_foodb_foods table schema
6. [ ] Create source_duke_plants table schema
7. [ ] Run db:generate and db:migrate
8. [ ] Create parse-foodb.ts script
9. [ ] Create parse-duke.ts script
10. [ ] Test parsers work correctly
