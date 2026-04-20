# Nutri - Comprehensive Project Overview

## Vision

Nutri is a **compound-centric wellness platform** that helps people understand how what they consume affects how they feel. Unlike calorie counters that reduce food to macros, Nutri tracks 200+ compounds and correlates them with personal wellness outcomes.

**Core Philosophy**: The body is a complex system. Simple calorie counting misses the biochemistry that actually determines how you feel. Nutri bridges the gap between what you eat and how you feel through compound-level analysis and pattern discovery.

---

## The Tracking System

### Three Concepts

```
Item:    { id, name }           -- A thing you observe
Entry:   { item_id, value, timestamp }  -- An observation
Pattern: { discovered }         -- What the system learns
```

That's it. Everything else is derived.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     OBSERVATIONS                            │
│                                                             │
│   Entries: (item, value, timestamp)                        │
│   The only truth. No assumptions. Just data.               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  EXPANSION (optional)                       │
│                                                             │
│   Food → Compounds (from database)                         │
│   Creates derived entries. Just a data transformation.     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  PATTERN DISCOVERY                          │
│                                                             │
│   Discovers from data:                                     │
│   • What correlates with what                              │
│   • At what lag (found, not assumed)                       │
│   • With what threshold (found, not binned)                │
│   • In what cycles (found, not predefined)                 │
│   • Under what conditions (found, not specified)           │
│                                                             │
│   Zero hardcoded values. Pure pattern recognition.         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      INSIGHTS                               │
│                                                             │
│   "Your energy peaks ~14.5 hours after exercise"           │
│   "Bloating occurs when dairy exceeds ~23g"                │
│   "Sleep quality drops when caffeine after ~2:30pm"        │
│                                                             │
│   All numbers discovered, not configured.                  │
└─────────────────────────────────────────────────────────────┘
```

### Why This Design?

| Principle | Implementation |
|-----------|----------------|
| **No hardcoding** | All patterns, lags, thresholds discovered from data |
| **Domain agnostic** | System knows "observations over time," not "health" |
| **Infinitely scalable** | Same schema handles 3 items or 300 items |
| **Compound-powered** | Food expansion enables biochemistry-level insights |

---

## Platform Architecture

### Three Pillars

```
┌─────────────────────────────────────────────────────────────────┐
│                         NUTRI PLATFORM                          │
├─────────────────────┬─────────────────────┬─────────────────────┤
│      TRACKING       │      COMMUNITY      │        STORE        │
├─────────────────────┼─────────────────────┼─────────────────────┤
│ • Case Profile      │ • Forum/Discovery   │ • Supplement Shop   │
│ • Meal Logging      │ • Expert Content    │ • User Reviews      │
│ • Lab Integration   │ • Protocol Sharing  │ • Personalized Recs │
│ • Correlation       │ • Q&A               │ • Affiliate Program │
│ • AI Insights       │ • Success Stories   │                     │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

---

## Pillar 1: Tracking

### The Universal Tracking Model

After extensive simulation across 100+ scenarios (from simple hydration tracking to complex autoimmune management), we arrived at the simplest possible model:

```
Item:    { id, name }
Entry:   { item_id, value, timestamp }
Pattern: { discovered }
```

Three concepts. That's the entire system.

### Design Principles

**1. Data is dumb, discovery is smart**

The schema stores observations. It makes no assumptions about health, nutrition, or what matters. All intelligence lives in the pattern discovery layer.

**2. Nothing is hardcoded**

- No predefined item types (input/output/context are optional labels, not schema constraints)
- No predefined value types (inferred from actual data)
- No predefined lag windows (discovered from temporal patterns)
- No predefined thresholds (discovered from value distributions)
- No predefined correlations (all relationships discovered)

**3. Everything is derived**

| What | How |
|------|-----|
| Item categories | User-defined labels, or inferred from temporal patterns |
| Value types | Inferred from actual values (numbers, booleans, text) |
| Correlations | Discovered by testing all items against all items |
| Lag times | Found where correlation strength peaks |
| Thresholds | Found where outcomes shift |
| Cycles | Found in repeating temporal patterns |
| Multi-factor patterns | Found through stratified analysis |

### Why This Works

The system doesn't know about "health." It knows about **observations over time** and **patterns within them**.

This means the same system handles:
- "I drink water and track energy" → Finds what relates
- "I manage lupus with 20 tracked items" → Finds complex patterns
- "I track crop yield and weather" → Same engine, same structure
- "I monitor business metrics" → Same engine, same structure

No code changes. No configuration. No domain expertise baked in.

### Compound Expansion (Optional Layer)

When meals are logged, an expansion layer creates derived entries:

```
User logs: { item: "Lunch", value: "aged cheese with wine", timestamp: T }
                              ↓
              Expansion layer (reads food database)
                              ↓
Derived entries:
  { item: "Tyramine intake", value: 45, timestamp: T }
  { item: "Histamine intake", value: 12, timestamp: T }
  { item: "Sulfites intake", value: 8, timestamp: T }
                              ↓
        Pattern finder sees all entries, discovers relationships
```

The expansion is a **data transformation**, not a schema change. The pattern finder doesn't know "compound" from "food" — it just sees items with values over time.

---

## Pillar 1.1: Case Profile

The Case Profile is the user's comprehensive health dashboard.

### Static Information

| Category | Data Points |
|----------|-------------|
| **Demographics** | Age, sex, height, weight, activity level |
| **Health History** | Diagnosed conditions, surgeries, family history |
| **Current Medications** | Prescriptions, OTC, supplements with dosages |
| **Known Sensitivities** | Allergies, intolerances, triggers |
| **Goals** | What they want to improve (energy, digestion, skin, etc.) |

### Dynamic Information (from tracking)

| Category | Data Points |
|----------|-------------|
| **Biomarkers** | Lab results over time (blood panels, hormones) |
| **Patterns** | Discovered correlations ("dairy → bloating") |
| **Baselines** | Personal normal ranges for tracked items |
| **Trends** | Long-term changes in key metrics |

### Lab Integration

Users can upload lab results (PDF/photo) for tracking over time:

1. **OCR Extraction**: Parse values from lab reports
2. **Normalization**: Convert to standard units
3. **Trend Tracking**: Show changes over time
4. **Range Comparison**: Personal vs. population ranges
5. **Correlation**: Link biomarkers to nutrition/lifestyle

---

## Pillar 1.2: Pattern Discovery Engine

### Core Principle

The engine receives a stream of entries and discovers patterns. It makes no assumptions about what patterns exist or where to look.

```
Input:  [(item, value, timestamp), ...]
Output: [discovered patterns with confidence]
```

### What the Engine Discovers

| Pattern Type | How It's Found |
|--------------|----------------|
| **Correlations** | When A changes, B tends to change |
| **Lag** | Time offset where correlation peaks (not predefined) |
| **Thresholds** | Value where outcomes shift (not binned) |
| **Cycles** | Repeating patterns in time (weekly, monthly, etc.) |
| **Conditionals** | A relates to B only when C |
| **Direction** | Which typically precedes which |
| **Non-linear** | U-curves, step functions, saturation points |

### No Hardcoded Values

The engine does **not** assume:
- Specific lag windows to test
- Quartile bins for thresholds
- Statistical significance cutoffs
- Which items are "inputs" vs "outputs"
- What time units matter (hours, days, weeks)

Instead, it:
- Finds where correlation peaks across the time continuum
- Finds natural breakpoints in value distributions
- Reports confidence based on data volume and consistency
- Infers item roles from temporal relationships
- Adapts to the actual rhythm of the data

### Example Discoveries

| User Tracks | Engine Discovers |
|-------------|------------------|
| Coffee, sleep quality | "Sleep quality drops when coffee consumed after ~2:47pm" |
| Dairy, bloating, stress | "Dairy correlates with bloating, but only when stress is elevated" |
| Exercise, mood, sleep | "Mood peaks ~14 hours after exercise, stronger effect with 7+ hours sleep" |
| 20 items for lupus | Multi-factor patterns specific to this person's biology |

All numbers discovered from data, not configured.

---

## Pillar 1.3: AI Assistant

The AI assistant interprets patterns and provides personalized guidance:

### Capabilities

1. **Pattern Explanation**: "Your energy crashes 3 hours after high-sugar meals. Here's why..."
2. **Protocol Suggestions**: "Based on your patterns, try eliminating high-histamine foods for 2 weeks"
3. **Question Answering**: "What foods are high in magnesium that I'm not allergic to?"
4. **Trend Analysis**: "Your sleep quality has improved 23% since you started the magnesium supplement"

### Guardrails

- Never diagnoses medical conditions
- Always recommends consulting healthcare providers for concerning patterns
- Flags "red flag" patterns that need medical attention
- Cites sources for nutritional information

---

## Pillar 1.4: Protocols & Experiments

Structured approaches to test hypotheses:

### Protocol Types

| Type | Duration | Example |
|------|----------|---------|
| **Elimination** | 2-6 weeks | Remove dairy, track symptoms |
| **Introduction** | 1-2 weeks | Add magnesium, measure sleep |
| **Titration** | 4-8 weeks | Find optimal caffeine intake |
| **Cycling** | Ongoing | Rotate supplements to prevent tolerance |

### Protocol Structure

```
Protocol: "Low FODMAP Trial"
├── Phase 1: Elimination (2-3 weeks)
│   └── Remove all high-FODMAP foods
├── Phase 2: Reintroduction (6-8 weeks)
│   └── Add back one FODMAP group at a time
└── Phase 3: Personalization (ongoing)
    └── Maintain personal threshold awareness
```

---

## Pillar 2: Community

### Forum/Discovery

- **Condition-Based Groups**: IBS, ADHD, Hashimoto's, etc.
- **Interest-Based Groups**: Biohacking, longevity, athletic performance
- **Protocol Sharing**: Users share what worked for them
- **Expert AMAs**: Nutritionists, researchers, practitioners

### Content Types

| Type | Description |
|------|-------------|
| **Success Stories** | "How I identified my migraine triggers" |
| **Protocol Reviews** | Community ratings on elimination diets |
| **Research Summaries** | Accessible breakdowns of new studies |
| **Expert Guides** | Deep dives on specific conditions/compounds |

### Privacy Controls

- **Anonymous Mode**: Share patterns without identity
- **Selective Sharing**: Choose what data is visible
- **Aggregated Insights**: "Users with similar patterns found..."

---

## Pillar 3: Store

### Supplement Shop

- **Quality-First Selection**: Only brands meeting strict criteria
- **Compound-Linked**: Recommendations based on user's tracked deficiencies
- **User Reviews**: Community ratings with outcome tracking

### Personalized Recommendations

```
User Profile:
├── Low Vitamin D (from labs)
├── Poor sleep quality (from tracking)
├── Sensitive to fillers (from history)
└── Budget: moderate

Recommendations:
├── Vitamin D3 (specific brand, no fillers)
├── Magnesium glycinate (for sleep)
└── Explanation: Why these, dosage, timing
```

### Trust Model

- Transparent affiliate relationships
- No pay-for-placement
- Recommendations driven by user data, not profit margins
- Community-verified quality ratings

---

## Data Architecture

### Multi-Source Food Database

Nutri aggregates data from 18 international food databases:

| Region | Sources |
|--------|---------|
| **North America** | FDC (USA), CNF (Canada), FooDB |
| **Europe** | CoFID (UK), CIQUAL (France), BLS (Germany), NEVO (Netherlands), Fineli (Finland), FRIDA (Denmark), Matvaretabellen (Norway) |
| **Asia-Pacific** | AFCD (Australia), FOODfiles (NZ), MEXT (Japan), KFCT (Korea), INDB (India), ASEANFOODS |
| **Specialty** | Phenol-Explorer (polyphenols), Duke's (phytochemicals) |

### 4-Layer Confidence Scoring

Every nutrient value has a confidence score (0-100):

| Layer | Weight | What It Measures |
|-------|--------|------------------|
| **L1** | 30% | Sample size (>10 samples = 100) |
| **L2** | 30% | Method quality (Analytical = 100, Calculated = 75) |
| **L3** | 25% | Source priority (Foundation = 100, Branded = 60) |
| **L4** | 15% | Data freshness (5% decay/year before 2020) |

### Multi-Source Averaging

When foods exist in multiple databases:

```
Protein for "Chicken Breast":
├── CNF: 23.2g (confidence: 0.95)
├── FDC: 23.8g (confidence: 0.98)
├── AFCD: 23.5g (confidence: 0.90)
└── Merged: 23.5g (confidence: 0.94, sources: 3)
```

Users can see all contributing sources for transparency.

### Compound Tiers

| Tier | Count | Examples | Visibility |
|------|-------|----------|------------|
| **Core** | ~213 | Vitamins, minerals, macros, amino acids, fatty acids | Default |
| **Advanced** | Unlimited | Polyphenols, alkaloids, terpenes, phytochemicals | Toggle |

---

## User Journeys

### Simple User (80% of users)

```
Week 1: Onboarding
├── Goal: "I want more energy"
├── Suggested items: Sleep, Caffeine, Exercise, Energy (output)
└── Start tracking

Week 2-3: Building baseline
├── Prompt at natural times (morning, after meals, bedtime)
├── "You've logged 42 entries. Keep going for insights."
└── No pressure to add complexity

Week 4: First insight
├── "Your energy is 40% higher on days you exercise before noon"
├── Actionable: Start morning exercise routine
└── Option: "Want to track more detail?" (most say no)

Ongoing: Maintenance
├── 3-5 items tracked consistently
├── 1-2 behavior changes from insights
└── Value achieved without complexity
```

### Health Condition User

```
Week 1: Detailed onboarding
├── Goal: "Manage IBS symptoms"
├── Condition-specific item suggestions
├── Connect existing food diary if applicable
└── 10-15 items to start

Week 2-4: Data collection
├── Food logging with compound expansion
├── Symptom tracking (bloating, pain, urgency)
├── Context (stress, sleep, cycle phase)
└── Building statistical significance

Month 2: Pattern emergence
├── "High-FODMAP foods correlate with bloating at 4-8hr lag"
├── "Stress amplifies food sensitivity by 2x"
├── Suggested protocol: "Try low-FODMAP elimination"
└── Track protocol adherence and outcomes

Month 3+: Personalization
├── Individual FODMAP thresholds identified
├── "You can tolerate up to 3g fructans per meal"
├── Trigger combinations discovered
└── Maintenance mode with known parameters
```

### Power User (Biohacker)

```
Tracking: 30+ items
├── HRV, continuous glucose, sleep stages
├── Nootropic stack cycling
├── Biomarker labs quarterly
├── Temperature, weight, body composition
└── Custom metrics (focus score, creativity index)

Analysis: Multi-factor
├── N=1 experiments with statistical rigor
├── Supplement timing optimization
├── Compound-level correlations
├── Long-term trend analysis
└── Export data for external analysis

Community: Active contributor
├── Shares protocols and results
├── Reviews supplements with outcome data
├── Participates in research studies
└── Beta tests new features
```

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Frontend** | React 19, Tailwind CSS 4, Framer Motion |
| **Database** | PostgreSQL (Supabase), Drizzle ORM |
| **Auth** | Supabase Auth + TOTP MFA |
| **State** | Zustand |
| **Forms** | React Hook Form + Zod |
| **Payments** | Stripe |
| **Email** | Resend |
| **Rate Limiting** | Upstash Redis |
| **AI** | Anthropic SDK |
| **Testing** | Vitest |

---

## Implementation Phases

### Phase 1: Foundation (Current)
- [x] Auth system with MFA
- [x] Compound database (~280 compounds)
- [x] Multi-source food schema
- [x] 4-layer confidence scoring
- [x] Basic meal logging
- [x] Daily nutrient totals

### Phase 2: Tracking Core
- [ ] Item/Entry schema (minimal: id, name, value, timestamp)
- [ ] Entry logging UI
- [ ] Custom item creation
- [ ] Mobile-optimized logging

### Phase 3: Pattern Discovery Engine
- [ ] Correlation discovery (no predefined lags)
- [ ] Threshold discovery (no predefined bins)
- [ ] Cycle detection (weekly, monthly, custom)
- [ ] Compound expansion layer
- [ ] Insight delivery UI

### Phase 4: Case Profile
- [ ] Health history intake
- [ ] Lab result upload/OCR
- [ ] Biomarker trending
- [ ] Pattern library
- [ ] AI assistant integration

### Phase 5: Community
- [ ] Forum infrastructure
- [ ] Protocol sharing
- [ ] Anonymous mode
- [ ] Aggregated insights

### Phase 6: Store
- [ ] Supplement catalog
- [ ] Personalized recommendations
- [ ] User reviews
- [ ] Checkout/fulfillment

---

## Monetization

### Free Tier
- Basic tracking (5 items)
- Food logging
- Simple correlations
- Community read access

### Premium ($9-15/month)
- Unlimited items
- Advanced correlations
- Compound-level analysis
- Lab tracking
- AI assistant
- Protocol tools

### Store Revenue
- Affiliate commissions on supplements
- Quality-verified products only
- Transparent recommendations

---

## Privacy & Ethics

### Data Principles

1. **User Ownership**: Users own their data, can export/delete anytime
2. **Minimal Collection**: Only collect what's needed for features
3. **Transparent Use**: Clear about what data is used for what
4. **No Selling**: Never sell user data to third parties
5. **Aggregation Only**: Research uses only anonymized, aggregated data

### Health Disclaimers

- Not a replacement for medical care
- Correlations are not causation
- Red flag patterns prompt medical consultation
- Clear about confidence levels in insights

---

## Success Metrics

| Metric | Target | Why |
|--------|--------|-----|
| **Time to first insight** | < 2 weeks | Value quickly or users churn |
| **Tracking consistency** | > 70% days logged | Data quality for correlations |
| **Insight accuracy** | > 80% user-confirmed | Trust in the system |
| **Behavior change rate** | > 30% act on insights | Actual impact |
| **Retention (6mo)** | > 40% | Sustained value |

---

## Conclusion

Nutri transforms nutrition tracking from calorie counting into compound-level wellness intelligence. By understanding the biochemistry of food and correlating it with how users actually feel, Nutri delivers insights that change behavior and improve lives.

### The Core Innovation

The universal tracking model reduces to three concepts:

```
Item:    { id, name }
Entry:   { item_id, value, timestamp }
Pattern: { discovered }
```

Everything else—categories, value types, lag windows, thresholds, correlations—is either **derived from data** or **layered on top**.

The system doesn't know about health. It knows about observations over time and the patterns within them. This means it scales from "drink more water" to "manage complex autoimmune conditions" without code changes, configuration, or domain expertise baked in.

**Data is dumb. Discovery is smart. Nothing is hardcoded.**
