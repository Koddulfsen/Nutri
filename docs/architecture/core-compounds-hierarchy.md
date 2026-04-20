# Core Compounds Hierarchy

> **Status:** Draft
> **Created:** 2026-01-25
> **Purpose:** Define the "Core" compound set for Nutri's default nutrition tracking experience

---

## Overview

Nutri compounds are organized into **categories**, and each category is either **Core** or **Advanced**.

| Tier | Description | Display |
|------|-------------|---------|
| **Core** | Essential nutrition + safety + ubiquitous lifestyle compounds | Shown by default |
| **Advanced** | Optimization, research, condition-specific | Hidden, toggle to show |

### Core vs Advanced is a CATEGORY decision

We don't cherry-pick individual compounds — entire categories are either Core or Advanced.

**Core Categories** (9 total):
1. Energy
2. Water
3. Macronutrients (+ all children: amino acids, sugars, fiber, fatty acids)
4. Vitamins (+ all forms)
5. Minerals (+ all forms)
6. Stimulants (caffeine, theobromine, theophylline)
7. Alcohol
8. Artificial Sweeteners
9. Contaminants (Heavy Metals only - Process Contaminants & Natural Toxins are Advanced)

**What makes a category Core?**
- Has official DVs/AIs from regulatory bodies, OR
- Has official safety limits that average people encounter daily (caffeine, alcohol, sweeteners, heavy metals)

**Advanced = everything else** (optimization compounds, phytochemicals, condition-specific tracking)

**Important:** DV display follows strict rules — only show official DVs from regulatory bodies. A compound being in Core doesn't mean we invent a DV for it.

---

## DV Display Policy

| Scenario | Display |
|----------|---------|
| Has official DV (FDA, Health Canada, EFSA, etc.) | Show % bar with source attribution |
| No official DV | Show amount only + "No official DV" label |
| Has safety limit but no DV (e.g., heavy metals) | Show amount + limit indicator |

**We never make up DVs or show research-based "optimal intakes" as DVs.**

---

## Core Hierarchy

### 1. ENERGY

```
⚡ ENERGY
└── Energy (kcal)                    ✓ DV: ~2000 kcal
```

---

### 2. WATER

```
💧 WATER
└── Water                            ✓ AI: 3.7L (men), 2.7L (women)
```

---

### 3. MACRONUTRIENTS

```
🍖 MACRONUTRIENTS
│
├── Protein                          ✓ DV: 50g
│   │
│   ├── Essential Amino Acids (9)
│   │   ├── Histidine
│   │   ├── Isoleucine               [BCAA]
│   │   ├── Leucine                  [BCAA]
│   │   ├── Lysine
│   │   ├── Methionine
│   │   ├── Phenylalanine
│   │   ├── Threonine
│   │   ├── Tryptophan
│   │   └── Valine                   [BCAA]
│   │
│   └── Non-Essential Amino Acids (11)
│       ├── Alanine
│       ├── Arginine                 (conditionally essential)
│       ├── Asparagine
│       ├── Aspartic Acid
│       ├── Cysteine                 (conditionally essential)
│       ├── Glutamic Acid
│       ├── Glutamine                (conditionally essential)
│       ├── Glycine                  (conditionally essential)
│       ├── Proline                  (conditionally essential)
│       ├── Serine
│       └── Tyrosine                 (conditionally essential)
│
├── Carbohydrates                    ✓ DV: 275g
│   │
│   ├── Sugars
│   │   ├── Total Sugars             ✓ Label required
│   │   ├── Added Sugars             ✓ DV: <50g
│   │   ├── Glucose                  (monosaccharide)
│   │   ├── Fructose                 (monosaccharide)
│   │   ├── Galactose                (monosaccharide)
│   │   ├── Sucrose                  (disaccharide)
│   │   ├── Lactose                  (disaccharide)
│   │   └── Maltose                  (disaccharide)
│   │
│   ├── Fiber                        ✓ DV: 28g
│   │   ├── Soluble Fiber
│   │   ├── Insoluble Fiber
│   │   ├── Beta-Glucan
│   │   ├── Pectin
│   │   ├── Inulin
│   │   └── Resistant Starch
│   │
│   ├── Starch
│   │
│   └── Sugar Alcohols
│       ├── Erythritol
│       ├── Xylitol
│       ├── Sorbitol
│       ├── Mannitol
│       ├── Maltitol
│       ├── Isomalt
│       └── Lactitol
│
└── Fat                              ✓ DV: 78g
    │
    ├── Saturated Fat                ✓ DV: <20g
    │   ├── Short-Chain (SCFA)
    │   │   ├── Butyric Acid (C4:0)
    │   │   └── Caproic Acid (C6:0)
    │   ├── Medium-Chain (MCFA)
    │   │   ├── Caprylic Acid (C8:0)
    │   │   ├── Capric Acid (C10:0)
    │   │   └── Lauric Acid (C12:0)
    │   └── Long-Chain (LCFA)
    │       ├── Myristic Acid (C14:0)
    │       ├── Palmitic Acid (C16:0)
    │       ├── Stearic Acid (C18:0)
    │       ├── Arachidic Acid (C20:0)
    │       ├── Behenic Acid (C22:0)
    │       └── Lignoceric Acid (C24:0)
    │
    ├── Trans Fat                    ✓ Label required (goal: 0)
    │   ├── Industrial Trans Fats    (hydrogenated oils - avoid)
    │   └── Natural Trans Fats
    │       ├── CLA (Conjugated Linoleic Acid)
    │       └── Vaccenic Acid (trans)
    │
    ├── Monounsaturated Fat (MUFA)
    │   ├── Palmitoleic Acid (C16:1)
    │   ├── Oleic Acid (C18:1 n-9)
    │   ├── Vaccenic Acid (C18:1 n-7)
    │   └── Erucic Acid (C22:1)
    │
    ├── Polyunsaturated Fat (PUFA)
    │   │
    │   ├── Omega-3 (n-3)            ✓ AI: 1.1-1.6g
    │   │   ├── ALA (C18:3 n-3)      ← plant sources
    │   │   ├── SDA (C18:4 n-3)
    │   │   ├── EPA (C20:5 n-3)      ← fish oil
    │   │   ├── DPA (C22:5 n-3)
    │   │   └── DHA (C22:6 n-3)      ← fish oil, brain health
    │   │
    │   ├── Omega-6 (n-6)
    │   │   ├── LA (C18:2 n-6)       ← linoleic acid
    │   │   ├── GLA (C18:3 n-6)      ← gamma-linolenic
    │   │   ├── DGLA (C20:3 n-6)
    │   │   ├── AA (C20:4 n-6)       ← arachidonic acid
    │   │   └── DTA (C22:4 n-6)
    │   │
    │   └── Omega-9 (n-9)
    │       └── Mead Acid (C20:3 n-9)
    │
    └── Cholesterol                  ✓ Was DV: <300mg
```

---

### 4. VITAMINS

```
💊 VITAMINS
│
├── Fat-Soluble Vitamins
│   │
│   ├── Vitamin A                    ✓ DV: 900 mcg RAE
│   │   ├── Preformed (Retinoids)
│   │   │   ├── Retinol
│   │   │   ├── Retinal
│   │   │   └── Retinoic Acid
│   │   └── Provitamin A Carotenoids
│   │       ├── Beta-Carotene
│   │       ├── Alpha-Carotene
│   │       └── Beta-Cryptoxanthin
│   │
│   ├── Vitamin D                    ✓ DV: 20 mcg (800 IU)
│   │   ├── D2 (Ergocalciferol)
│   │   └── D3 (Cholecalciferol)
│   │
│   ├── Vitamin E                    ✓ DV: 15 mg
│   │   ├── Tocopherols
│   │   │   ├── Alpha-Tocopherol     (DV measures this form)
│   │   │   ├── Beta-Tocopherol
│   │   │   ├── Gamma-Tocopherol
│   │   │   └── Delta-Tocopherol
│   │   └── Tocotrienols
│   │       ├── Alpha-Tocotrienol
│   │       ├── Beta-Tocotrienol
│   │       ├── Gamma-Tocotrienol
│   │       └── Delta-Tocotrienol
│   │
│   └── Vitamin K                    ✓ DV: 120 mcg
│       ├── K1 (Phylloquinone)
│       └── K2 (Menaquinones)
│           ├── MK-4
│           ├── MK-7
│           └── MK-9
│
└── Water-Soluble Vitamins
    │
    ├── Vitamin C                    ✓ DV: 90 mg
    │   ├── Ascorbic Acid
    │   └── Dehydroascorbic Acid
    │
    ├── Thiamin (B1)                 ✓ DV: 1.2 mg
    │   ├── Thiamin HCl
    │   ├── Thiamin Mononitrate
    │   └── Benfotiamine
    │
    ├── Riboflavin (B2)              ✓ DV: 1.3 mg
    │   ├── Riboflavin
    │   └── Riboflavin-5-Phosphate
    │
    ├── Niacin (B3)                  ✓ DV: 16 mg NE
    │   ├── Nicotinic Acid
    │   ├── Nicotinamide
    │   └── Nicotinamide Riboside
    │
    ├── Pantothenic Acid (B5)        ✓ DV: 5 mg
    │   ├── Pantothenic Acid
    │   ├── Pantethine
    │   └── Calcium Pantothenate
    │
    ├── Pyridoxine (B6)              ✓ DV: 1.7 mg
    │   ├── Pyridoxine
    │   ├── Pyridoxal
    │   ├── Pyridoxamine
    │   └── Pyridoxal-5-Phosphate
    │
    ├── Biotin (B7)                  ✓ DV: 30 mcg
    │
    ├── Folate (B9)                  ✓ DV: 400 mcg DFE
    │   ├── Folic Acid (synthetic)
    │   ├── Food Folate (natural)
    │   ├── 5-MTHF (Methylfolate)
    │   └── Folinic Acid
    │
    ├── Cobalamin (B12)              ✓ DV: 2.4 mcg
    │   ├── Cyanocobalamin
    │   ├── Methylcobalamin
    │   ├── Adenosylcobalamin
    │   └── Hydroxocobalamin
    │
    └── Choline                      ✓ AI: 550 mg
        ├── Free Choline
        ├── Phosphatidylcholine
        ├── CDP-Choline
        └── Alpha-GPC
```

---

### 5. MINERALS

```
�ite MINERALS
│
├── Major Minerals (need >100mg/day)
│   │
│   ├── Calcium                      ✓ DV: 1300 mg
│   │   ├── Calcium Carbonate
│   │   ├── Calcium Citrate
│   │   ├── Calcium Phosphate
│   │   └── Calcium Lactate
│   │
│   ├── Phosphorus                   ✓ DV: 1250 mg
│   │
│   ├── Magnesium                    ✓ DV: 420 mg
│   │   ├── Magnesium Oxide
│   │   ├── Magnesium Citrate
│   │   ├── Magnesium Glycinate
│   │   ├── Magnesium Malate
│   │   └── Magnesium L-Threonate
│   │
│   ├── Sodium                       ✓ DV: <2300 mg
│   │
│   ├── Potassium                    ✓ DV: 4700 mg
│   │
│   ├── Chloride                     ✓ DV: 2300 mg
│   │
│   └── Sulfur                       (no DV)
│
└── Trace Minerals (need <100mg/day)
    │
    ├── Iron                         ✓ DV: 18 mg
    │   ├── Heme Iron
    │   └── Non-Heme Iron
    │
    ├── Zinc                         ✓ DV: 11 mg
    │   ├── Zinc Sulfate
    │   ├── Zinc Gluconate
    │   ├── Zinc Picolinate
    │   └── Zinc Citrate
    │
    ├── Copper                       ✓ DV: 0.9 mg
    │
    ├── Manganese                    ✓ DV: 2.3 mg
    │
    ├── Selenium                     ✓ DV: 55 mcg
    │   ├── Selenomethionine
    │   └── Sodium Selenite
    │
    ├── Iodine                       ✓ DV: 150 mcg
    │
    ├── Chromium                     ✓ DV: 35 mcg
    │   ├── Chromium Picolinate
    │   └── Chromium Polynicotinate
    │
    ├── Molybdenum                   ✓ DV: 45 mcg
    │
    ├── Fluoride                     ✓ AI: 4 mg
    │
    ├── Boron                        (no DV, AI ~1-3mg suggested)
    │
    └── Silicon                      (no DV, tracked in AFCD)
```

---

### 6. STIMULANTS

```
☕ STIMULANTS
│
├── Caffeine                         ⚠️ Safe limit: ~400mg/day
├── Theobromine                      (chocolate)
└── Theophylline                     (tea)
```

---

### 7. ALCOHOL

```
🍺 ALCOHOL
│
└── Ethanol                          ⚠️ Limits vary (e.g., <2 drinks/day)
```

---

### 8. ARTIFICIAL SWEETENERS

```
🧁 ARTIFICIAL SWEETENERS
│
├── Aspartame                        ⚠️ ADI: 40-50 mg/kg
├── Sucralose                        ⚠️ ADI: 5 mg/kg
├── Saccharin                        ⚠️ ADI: 5 mg/kg
├── Acesulfame-K                     ⚠️ ADI: 15 mg/kg
└── Stevia (Steviol Glycosides)      ⚠️ ADI: 4 mg/kg
```

*Note: ADI = Acceptable Daily Intake (per kg body weight)*

---

### 9. CONTAMINANTS

```
☠️ CONTAMINANTS
│
├── Heavy Metals
│   │
│   ├── Lead (Pb)                    ⚠️ ALARA
│   │
│   ├── Mercury (Hg)                 ⚠️ varies by form
│   │   ├── Methylmercury
│   │   └── Inorganic Mercury
│   │
│   ├── Cadmium (Cd)                 ⚠️ ~25 mcg/day (EFSA)
│   │
│   ├── Arsenic (As)                 ⚠️ varies
│   │   ├── Inorganic Arsenic
│   │   └── Organic Arsenic
│   │
│   ├── Aluminum (Al)
│   │
│   ├── Nickel (Ni)
│   │
│   ├── Tin (Sn)                     (canned foods)
│   │
│   ├── Chromium VI                  (toxic form, distinct from Cr III nutrient)
│   │
│   ├── Uranium (U)
│   │
│   ├── Cobalt (Co)
│   │
│   ├── Antimony (Sb)
│   │
│   ├── Thallium (Tl)
│   │
│   └── Barium (Ba)
```

*Note: Process Contaminants, Natural Toxins, and Antinutrients are in Advanced tier (see below). Mycotoxins, Pesticides, and Plasticizers are deferred (require ongoing curation).*

---

---

## Supplement Forms (UI Feature)

This is **not a separate Core category** — it's a UI convenience layer. Supplement forms already exist as children under their logical parents (Vitamins, Minerals). This section defines how to surface them for quick access in a "Supplement View" toggle.

**Design rationale:** Supplementers want to see their forms prominently without drilling into parent compounds. This category provides a "quick view" of all supplement-form compounds.

```
💊 SUPPLEMENTS
│
├── Vitamin Forms
│   │
│   ├── B1 Forms
│   │   ├── Thiamin HCl
│   │   ├── Thiamin Mononitrate
│   │   └── Benfotiamine
│   │
│   ├── B2 Forms
│   │   ├── Riboflavin
│   │   └── Riboflavin-5-Phosphate (R5P)
│   │
│   ├── B3 Forms
│   │   ├── Nicotinic Acid
│   │   ├── Nicotinamide
│   │   └── Nicotinamide Riboside (NR)
│   │
│   ├── B5 Forms
│   │   ├── Pantothenic Acid
│   │   ├── Pantethine
│   │   └── Calcium Pantothenate
│   │
│   ├── B6 Forms
│   │   ├── Pyridoxine
│   │   ├── Pyridoxine HCl
│   │   ├── Pyridoxal
│   │   └── Pyridoxal-5-Phosphate (P5P)
│   │
│   ├── B9 Forms
│   │   ├── Folic Acid (synthetic)
│   │   ├── 5-MTHF (Methylfolate)
│   │   └── Folinic Acid (Leucovorin)
│   │
│   ├── B12 Forms
│   │   ├── Cyanocobalamin
│   │   ├── Methylcobalamin
│   │   ├── Adenosylcobalamin
│   │   └── Hydroxocobalamin
│   │
│   ├── Choline Forms
│   │   ├── Choline Bitartrate
│   │   ├── Phosphatidylcholine
│   │   ├── CDP-Choline (Citicoline)
│   │   └── Alpha-GPC
│   │
│   ├── Vitamin C Forms
│   │   ├── Ascorbic Acid
│   │   ├── Sodium Ascorbate
│   │   └── Liposomal Vitamin C
│   │
│   ├── Vitamin D Forms
│   │   ├── D2 (Ergocalciferol)
│   │   └── D3 (Cholecalciferol)
│   │
│   ├── Vitamin E Forms
│   │   ├── d-Alpha-Tocopherol (natural)
│   │   ├── dl-Alpha-Tocopherol (synthetic)
│   │   └── Mixed Tocopherols
│   │
│   └── Vitamin K2 Forms
│       ├── MK-4
│       └── MK-7
│
├── Mineral Forms
│   │
│   ├── Calcium Forms
│   │   ├── Calcium Carbonate
│   │   ├── Calcium Citrate
│   │   ├── Calcium Citrate Malate
│   │   └── Calcium Lactate
│   │
│   ├── Magnesium Forms
│   │   ├── Magnesium Oxide
│   │   ├── Magnesium Citrate
│   │   ├── Magnesium Glycinate
│   │   ├── Magnesium Malate
│   │   ├── Magnesium Taurate
│   │   └── Magnesium L-Threonate
│   │
│   ├── Zinc Forms
│   │   ├── Zinc Oxide
│   │   ├── Zinc Sulfate
│   │   ├── Zinc Gluconate
│   │   ├── Zinc Picolinate
│   │   └── Zinc Citrate
│   │
│   ├── Iron Forms
│   │   ├── Ferrous Sulfate
│   │   ├── Ferrous Gluconate
│   │   ├── Ferrous Bisglycinate
│   │   └── Iron Carbonyl
│   │
│   ├── Selenium Forms
│   │   ├── Selenomethionine
│   │   ├── Sodium Selenite
│   │   └── Selenium Yeast
│   │
│   └── Chromium Forms
│       ├── Chromium Picolinate
│       └── Chromium Polynicotinate
│
└── Omega Forms
    ├── Fish Oil
    ├── Krill Oil
    ├── Algal Oil (DHA)
    └── Flaxseed Oil (ALA)
```

*Note: Compounds in this section have `is_supplement_form: true` in the database and are aliases to their logical parents in the hierarchy. Nutrient totals roll up to the parent compound (e.g., Magnesium Glycinate contributes to total Magnesium).*

---

## Summary Statistics

| # | Core Category | Compounds |
|---|---------------|-----------|
| 1 | Energy | 1 |
| 2 | Water | 1 |
| 3 | Macronutrients | ~80 (protein + 20 AAs, carbs + sugars/fiber, fats + ~35 FAs) |
| 4 | Vitamins | ~63 (13 vitamins + forms) |
| 5 | Minerals | ~46 (14 minerals + forms) |
| 6 | Stimulants | 3 |
| 7 | Alcohol | 1 |
| 8 | Artificial Sweeteners | 5 |
| 9 | Contaminants (Heavy Metals only) | 13 |
| | **TOTAL CORE** | **~213** |

*Note: Supplement forms (e.g., Magnesium Glycinate) are counted under their parent category (Minerals), not separately.*

---

## Advanced Categories (TODO)

These categories are hidden by default and shown via toggle. Full hierarchy TBD.

| Category | Examples | Notes |
|----------|----------|-------|
| **Contaminants - Process** | Acrylamide, Nitrosamines, 3-MCPD, Furan, Glycidyl esters | Heat/cooking-formed contaminants |
| **Contaminants - Natural Toxins** | Glycoalkaloids (Solanine, Chaconine) | Plant defense compounds |
| **Antinutrients** | Oxalates, Phytates, Tannins, Lectins, Purines | Condition-specific tracking (kidney stones, iron absorption) |
| Ergogenic Compounds | Creatine, Taurine, L-Carnitine, Beta-Alanine, Citrulline | Supplement/optimization territory |
| Quasi-Vitamins | Inositol, CoQ10, PQQ, Betaine (TMG) | No DVs, optimization |
| Polyphenols | Quercetin, Resveratrol, EGCG, Curcumin | Research-grade |
| Flavonoids | Anthocyanins, Catechins, Kaempferol | Subclass of polyphenols |
| Non-Provitamin Carotenoids | Lycopene, Lutein, Zeaxanthin, Astaxanthin | No DVs despite research |
| Other Alkaloids | Capsaicin, Piperine, Trigonelline | Beyond common stimulants |
| Glucosinolates | Sulforaphane, Indole-3-carbinol | Cruciferous compounds |
| Terpenoids | Limonene, Pinene, Linalool | Plant volatiles/aromatics |
| Sterols | Beta-sitosterol, Campesterol | Plant sterols |
| Organic Acids | Citric, Malic, Quinic | Food acids |
| Saponins | Ginsenosides, Glycyrrhizin | Adaptogen compounds |
| Peptides | Glutathione, Carnosine | Bioactive peptides |
| Nitrates | Dietary nitrates | Performance, cardiovascular |

---

## Supplement Forms Strategy

Supplement forms (Magnesium Glycinate, Methylcobalamin, etc.) present a UX challenge:
- **Logically:** They're children of their parent compound
- **Practically:** Supplementers want to see them prominently

### Solution: Dual Location + Supplement View Toggle

**Dual Location Approach:**
1. Supplement forms live under their logical parent (e.g., Methylcobalamin → B12 → Water-Soluble Vitamins)
2. Supplement forms ALSO appear in the dedicated **Supplements** category (Section 8) for quick access

This means when viewing the compound hierarchy, users can:
- Find Magnesium Glycinate under Minerals → Magnesium
- OR find it under Supplements → Mineral Forms → Magnesium Forms

**Supplement View Toggle:**

```
┌─────────────────────────────────────────────────────────────┐
│  Analysis    [Food View]  [Supplement View]                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SUPPLEMENT VIEW - Forms Expanded                           │
│                                                             │
│  📁 Magnesium                      420 mg total   100% DV   │
│      ├── Magnesium Glycinate       200 mg  ████████░░      │
│      ├── Magnesium L-Threonate     144 mg  █████░░░░░      │
│      └── From Food                  76 mg  ███░░░░░░░      │
│                                                             │
│  📁 Vitamin B12                   1200 mcg total  500% DV   │
│      └── Methylcobalamin          1200 mcg  ████████████   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

1. **Keep forms as children** in the compound hierarchy (where they logically belong)
2. **Add parallel Supplements category** that references the same compounds (Section 8)
3. **Add `is_supplement_form: boolean`** flag to compounds table
4. **Supplement View toggle** in Analysis page:
   - Auto-expands all parents containing supplement forms
   - Highlights supplement form rows visually
   - Shows "Your Supplements" summary card
5. **Smart detection:** When logging a supplement product, auto-switch to Supplement View

---

## Implementation Notes

1. **Categories in DB:** Each category has a `tier` enum ('core', 'advanced') — all compounds in a category inherit the tier
2. **Hierarchy:** Use `compound_groups` table with `parent_id` for nesting within categories
3. **Supplement flag:** Add `is_supplement_form: boolean` to compounds table for UI filtering
4. **UI default:** Show Core categories expanded, Advanced categories collapsed with toggle
5. **DV bars:** Only render for compounds with entries in `reference_daily_values`
6. **Safety limits:** For compounds without DVs but with limits (caffeine, sweeteners, heavy metals), show limit indicator instead of DV bar

---

## References

- FDA Daily Values: https://www.fda.gov/food/nutrition-facts-label/daily-value-nutrition-and-supplement-facts-labels
- NIH Nutrient Fact Sheets: https://ods.od.nih.gov/factsheets/list-all/
- EFSA Dietary Reference Values: https://www.efsa.europa.eu/en/topics/topic/dietary-reference-values
