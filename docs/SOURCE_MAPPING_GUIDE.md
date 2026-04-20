# Source Mapping Guide

**Purpose**: Step-by-step process for mapping external nutrition data sources to Nutri compounds
**Last Updated**: 2026-01-14

---

## Overview

When integrating a new nutrition data source, we need to:
1. Map their nutrient IDs to our compound UUIDs
2. Store mappings in the `compound_sources` table
3. Add any missing compounds to our database

This enables multi-source food data import while normalizing to our unified compound system.

---

## Prerequisites

Before starting, you need:
- [ ] Source's nutrient list (via API or documentation)
- [ ] Access to Nutri database (875 compounds as of Jan 2026)
- [ ] Understanding of the source's ID system

---

## Step 1: Create Tracker Document

Create `/docs/{SOURCE}_MAPPING_TRACKER.md` with this template:

```markdown
# {SOURCE} to Nutri Compound Mapping Tracker

## Progress: 0/X mapped

## Instructions
For each {SOURCE} nutrient ID, map to the corresponding Nutri compound:
1. Match to our compound database
2. Mark canonical if it's the primary mapping for that compound
3. Mark status when complete

---

## 1. Category Name (X IDs)

| # | Source ID | Source Name | Unit | Nutri Compound | Canonical? | Status |
|---|-----------|-------------|------|----------------|------------|--------|
| 1 | 203 | Protein | g | Protein | Yes | ✅ |
| 2 | 204 | Total Fat | g | Total Fat | Yes | ✅ |
```

---

## Step 2: Match Nutrients to Compounds

For each nutrient in the source:

### Direct Match
If the nutrient matches an existing compound:
```
| 1 | 203 | Protein | g | Protein | Yes | ✅ |
```

### Variant/Alternate Measurement
If it's a different unit or calculation method for the same compound:
```
| 6 | 268 | Energy (kJ) | kJ | Energy | No | ✅ |
```
Mark `Canonical? = No` since we already have a primary mapping.

### No Match
If no compound exists:
```
| 48 | 1026 | Acetic acid | mg | NO_MATCH | - | ✅ |
```

---

## Step 3: Analyze NO_MATCH Items

After completing the tracker, categorize all NO_MATCH entries:

### Category A: Skip (Don't Add)
- Category headers (e.g., "Proximates", "Lipids")
- Aggregate/summary values we don't track
- Duplicate calculations

### Category B: Forms of Existing Compounds
Add as new compound with `parent_compound_id`:
- Fortification tracking (e.g., "Calcium, added" → parent: Calcium)
- Isomers (e.g., "trans-Linoleic Acid" → parent: Linoleic Acid)
- Subtypes (e.g., "Proanthocyanidin Dimers" → parent: Proanthocyanidins)

### Category C: New Standalone Compounds
Add as independent compounds:
- Organic acids (Citric Acid, Malic Acid, etc.)
- Sterols (Brassicasterol, Ergosterol, etc.)
- Polyphenols not yet in database

---

## Step 4: Add Missing Compounds

Create script `/scripts/add-{source}-missing-compounds.ts`:

```typescript
import { db } from '@/db';
import { compounds, compoundSources } from '@/db/schema';
import { eq } from 'drizzle-orm';

// New standalone compounds
const newCompounds = [
  {
    name: 'Citric Acid',
    type: 'ORGANIC_ACID' as const,
    description: 'Common organic acid in citrus fruits',
    fdcId: 1032, // Source ID for mapping
  },
  // ... more compounds
];

// Forms of existing compounds
const compoundForms = [
  {
    name: 'Calcium (added)',
    type: 'MINERAL' as const,
    parentName: 'Calcium', // Will lookup parent_compound_id
    fdcId: 1237,
  },
  // ... more forms
];

async function main() {
  // 1. Insert standalone compounds
  for (const compound of newCompounds) {
    const [inserted] = await db.insert(compounds).values({
      name: compound.name,
      type: compound.type,
      description: compound.description,
    }).returning();

    // Create source mapping
    await db.insert(compoundSources).values({
      compoundId: inserted.id,
      source: 'FDC', // or 'CNF', 'AFCD', etc.
      externalId: String(compound.fdcId),
      isCanonical: true,
    });
  }

  // 2. Insert forms with parent relationships
  for (const form of compoundForms) {
    const parent = await db.query.compounds.findFirst({
      where: eq(compounds.name, form.parentName),
    });

    const [inserted] = await db.insert(compounds).values({
      name: form.name,
      type: form.type,
      parentCompoundId: parent?.id,
    }).returning();

    await db.insert(compoundSources).values({
      compoundId: inserted.id,
      source: 'FDC',
      externalId: String(form.fdcId),
      isCanonical: true,
    });
  }
}

main();
```

Run with: `npx tsx scripts/add-{source}-missing-compounds.ts`

---

## Step 5: Insert Source Mappings

Create script `/scripts/insert-{source}-mappings.ts`:

```typescript
import { db } from '@/db';
import { compounds, compoundSources } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const mappings = [
  { sourceId: '203', compoundName: 'Protein', isCanonical: true },
  { sourceId: '204', compoundName: 'Total Fat', isCanonical: true },
  { sourceId: '268', compoundName: 'Energy', isCanonical: false }, // kJ variant
  // ... all mappings from tracker
];

async function main() {
  const SOURCE = 'AFCD'; // Change per source

  for (const mapping of mappings) {
    // Find compound
    const compound = await db.query.compounds.findFirst({
      where: eq(compounds.name, mapping.compoundName),
    });

    if (!compound) {
      console.log(`❌ Compound not found: ${mapping.compoundName}`);
      continue;
    }

    // Check if mapping exists
    const existing = await db.query.compoundSources.findFirst({
      where: and(
        eq(compoundSources.source, SOURCE),
        eq(compoundSources.externalId, mapping.sourceId),
      ),
    });

    if (existing) {
      console.log(`⏭️  ${mapping.compoundName} (already mapped)`);
      continue;
    }

    // Insert mapping
    await db.insert(compoundSources).values({
      compoundId: compound.id,
      source: SOURCE,
      externalId: mapping.sourceId,
      isCanonical: mapping.isCanonical,
    });

    console.log(`✅ ${SOURCE} ${mapping.sourceId} → ${mapping.compoundName}`);
  }
}

main();
```

---

## Step 6: Verify Mappings

Run verification script:

```bash
npx tsx scripts/verify-mappings.ts
```

Expected output:
```
Mappings by source:
{
  "CNF": 152,
  "FDC": 329,
  "AFCD": 256
}

Unique compounds mapped: 350
Total compounds in database: 500
Coverage: 70%
```

---

## Database Schema Reference

### compound_sources table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| compound_id | uuid | FK to compounds.id |
| source | text | Source identifier (CNF, FDC, AFCD, etc.) |
| external_id | text | The source's nutrient ID |
| external_name | text | Optional: source's name for reference |
| is_canonical | boolean | True if this is the primary mapping |
| unit | text | Optional: source's unit |
| created_at | timestamp | Auto-generated |

### Canonical Mapping Rules

- **One canonical per source per compound**: Each compound should have at most one canonical mapping per source
- **Canonical = primary ID**: Used when importing food data from that source
- **Non-canonical = variants**: Alternate measurements (kJ vs kcal), added forms, etc.

---

## Completed Sources

| Source | Mappings | Compounds Added | Date |
|--------|----------|-----------------|------|
| CNF | 152 | 0 | Nov 2024 |
| FDC | 329 | 105 | Jan 2025 |
| AFCD | 218 | 8 | Jan 2025 |
| FooDB | 559 | 388 | Jan 2025 |
| Phenol-Explorer | 748 | 678 | Jan 2026 |
| UK CoFID | 168 | 10 | Jan 2026 |
| CIQUAL | 71 | 4 | Jan 2026 |
| Duke | 685 | 431 | Jan 2026 |

**Total compounds**: 2,036

---

## Checklist for New Source

- [ ] Research source (API/download, license, nutrient count)
- [ ] Create `{SOURCE}_MAPPING_TRACKER.md`
- [ ] Map all nutrients (match, variant, or NO_MATCH)
- [ ] Categorize NO_MATCH items (skip, form, or standalone)
- [ ] Create and run `add-{source}-missing-compounds.ts`
- [ ] Create and run `insert-{source}-mappings.ts`
- [ ] Run `verify-mappings.ts` to confirm
- [ ] Update tracker progress to 100%
- [ ] Update this guide's "Completed Sources" table
