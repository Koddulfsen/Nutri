# Universal Tracking Model - Simulation Synthesis

## The Core Model (Validated)

```
Item: name, type (input|output|context), value_type, unit, options
Entry: item_id, value, timestamp, notes
```

**This model works.** Across 100+ scenarios simulated, the input/output/context framework handled everything from simple hydration tracking to complex autoimmune disease management.

---

## Key Findings

### 1. The Model is Universal

The same simple structure handles:
- **Simple users**: 3-4 items, find value in 1-2 weeks
- **Complex health conditions**: 15-20 items, multi-factor correlations
- **Biohackers**: 30+ items, advanced metrics
- **Compound-level nutrition**: 200+ compounds from food database

### 2. Time Relationships are Critical

| Type | Lag | Examples |
|------|-----|----------|
| **Immediate** | 0-4 hrs | Coffee → jitters |
| **Same-day** | 4-12 hrs | Heavy lunch → afternoon slump |
| **Next-day** | 12-36 hrs | Alcohol → poor sleep → low energy |
| **Delayed** | 2-7 days | Gluten → inflammation, Sugar → acne |
| **Cumulative** | 1-12 weeks | Supplements, meditation, sleep debt |

**Implication**: Correlation engine must test multiple lag windows, not just same-day.

### 3. Thresholds are More Common Than Linear Relationships

Most real patterns have thresholds:
- Alcohol: Fine at 1-2, problems at 3+
- Caffeine: Okay before 2pm, problematic after
- Sleep: Under 6 hours = hard cap on function
- FODMAPs: Below threshold = fine, above = symptoms

**Implication**: Test for threshold effects, not just linear correlation.

### 4. Context Modifies Everything

The same input produces different outputs depending on:
- Time of day (dairy at night vs morning)
- What else was consumed (caffeine + poor sleep = anxiety)
- Cycle phase (luteal phase amplifies food sensitivities)
- Stress level (stress + trigger food = worse than either alone)

**Implication**: Stratified analysis by active context items.

### 5. Simple Users Get Value Quickly

From simple user simulations:
- **3-5 items is enough** for most people
- **1-2 key insights** change behavior permanently
- **Time to value**: 1-4 weeks
- **Most stay simple**: 10/18 users never added more items

**Implication**: Progressive disclosure works. Don't force complexity.

### 6. Compound-Level Data is Powerful

Surface correlations hide deeper truths:

| User Says | Compound Analysis Reveals |
|-----------|---------------------------|
| "Gluten sensitivity" | Fructan (FODMAP) threshold |
| "Can't eat fish" | Histamine + DAO inhibitors |
| "Healthy smoothies hurt me" | Oxalate overload |
| "I need more iron" | Actually iron overload (hemochromatosis) |

**Implication**: Our 200+ compound database enables insights no calorie counter can provide.

---

## Model Extensions Needed

### Required for MVP

| Extension | Why |
|-----------|-----|
| **Lag window per item** | Different items have different delay patterns |
| **Threshold detection** | Most patterns are non-linear |
| **Rolling averages** | Cumulative effects need streak tracking |
| **Missing data handling** | Distinguish "didn't track" from "zero" |

### Required for V2

| Extension | Why |
|-----------|-----|
| **Compound types** | Blood pressure (120/80), body composition |
| **Duration events** | "I was sick Mon-Fri" as single entry |
| **Item versioning** | Users change how they track over time |
| **Context stratification** | Show correlations that only appear in certain conditions |

### Future Considerations

| Extension | Why |
|-----------|-----|
| **External data sources** | Weather, UV index, pollen auto-populated |
| **Protocol/Experiment support** | Elimination diets, supplement trials |
| **Multi-user tracking** | Parent tracking for child |
| **Red flag detection** | Patterns that need medical attention |

---

## Default Items to Ship

### Inputs (What You Do/Control)
- Meals (linked to food DB)
- Water intake
- Supplements taken
- Sleep bedtime/wake time
- Exercise (type, duration)
- Caffeine
- Alcohol

### Outputs (What You Observe/Measure)
- Energy level (scale 1-5)
- Mood (scale 1-5)
- Sleep quality (scale 1-5)
- Digestion comfort (scale 1-5)
- Pain/symptoms (custom, boolean or scale)

### Contexts (Conditions You Don't Control)
- Day of week (auto)
- Time of day (auto)
- Weather (auto via API, future)
- Stress level (scale 1-5)
- Cycle day (optional)
- Travel (boolean)

---

## Correlation Engine Design

### Phase 1: Simple Correlations
```
For each OUTPUT:
  For each INPUT and CONTEXT:
    Test correlation at lag 0, 1, 2, 7 days
    Report if significant (p < 0.05, n >= 10)
```

### Phase 2: Threshold Detection
```
For significant correlations:
  Bin input values into quartiles
  Test for step-function patterns
  Report thresholds if found
```

### Phase 3: Multi-Factor
```
For top correlations:
  Test 2-way interactions
  Report conditional correlations
  "X correlates with Y, but only when Z"
```

### Phase 4: Compound Integration
```
When food logged:
  Expand to compound level
  Test compound → symptom correlations
  Group compounds by category (FODMAPs, histamine, etc.)
  Report at actionable level
```

---

## User Journey

### Onboarding
1. Ask: What do you want to improve? (energy, digestion, sleep, mood, skin, pain)
2. Suggest 3-5 relevant items based on answer
3. Start tracking immediately

### Week 1-2
- Establish baseline
- Prompt at natural times (morning, meals, bedtime)
- Show: "You've logged X entries. Keep going for insights."

### Week 3-4
- First correlations surface
- Simple language: "Your energy is 40% higher on days you exercise"
- Ask: "Want to test this? Track exercise consistently for a week."

### Month 2+
- Deeper patterns emerge
- Compound-level insights (if food tracked)
- Progressive disclosure: "Want to track more detail?"

---

## Files in This Directory

| File | Contents |
|------|----------|
| `a886047.output` | 18 Health condition scenarios (IBS, diabetes, ADHD, lupus, etc.) |
| `ae068b9.output` | 13 Biohacker power user scenarios |
| `ac62925.output` | 28 Edge cases and stress tests |
| `a673309.output` | 28 Correlation discovery simulations |
| `a982407.output` | 18 Simple user journey scenarios |
| `a66ebaa.output` | 25 Food-compound correlation deep dives |
| `a9c8b0a.output` | 40 Creative custom item examples |

---

## Conclusion

The universal tracking model is **validated and ready**. The input/output/context framework with simple value types can handle everything from "drink more water" to "manage lupus flares."

**Next step**: Build the tracking core with this model, then layer the correlation engine on top.
