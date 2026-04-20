# Wellness Tracking System

> **Status:** Concept / Future Implementation
> **Created:** 2026-01-24
> **Purpose:** Expand Nutri from nutrition tracking to comprehensive wellness platform

---

## Vision

Nutri becomes THE platform for understanding how all aspects of life influence wellbeing. Not just "what you eat affects how you feel" but "how sleep, movement, stress, nutrition, and everything else form a feedback loop."

The unique advantage: Nutri already has deep compound-level nutrition data. The wellness layer correlates all signals back to biochemistry.

---

## Core Concept: Signals

Everything tracked is a **Signal**. No strict input/output distinction - everything can influence everything else.

### Signal Categories

| Category | Examples | Nature |
|----------|----------|--------|
| **Consumption** | Food, water, supplements, caffeine, alcohol | Inputs you control |
| **Activity** | Movement, exercise, work hours, screen time | Inputs you control |
| **Rest** | Sleep duration, sleep quality, breaks, relaxation | Both input and output |
| **State** | Energy, mood, focus, stress, motivation | Outputs you observe |
| **Body** | Symptoms, weight, vitals (HR, BP, glucose) | Outputs you measure |
| **Context** | Tags like "traveled", "sick", "stressful day" | Modifiers that affect interpretation |

### Logging Methods

| Type | Method | Examples |
|------|--------|----------|
| Subjective states | Universal 1-5 scale | Energy: 4, Mood: 3, Stress: 2 |
| Objective measures | Numbers with units | Sleep: 7.5 hrs, Steps: 8000, Water: 2L |
| Qualitative data | Tags / free text | Symptoms: "headache", Context: "traveled" |

---

## Integration with Existing System

### Meals → Nutrition → Wellness

```
┌──────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Meals     │ ──► │  Daily Nutrient │ ──► │   Correlation   │
│  (existing)  │     │     Totals      │     │     Engine      │
└──────────────┘     └─────────────────┘     └─────────────────┘
                                                     │
                     ┌─────────────────┐             │
                     │  Other Signals  │ ────────────┘
                     │  (sleep, mood,  │
                     │   activity...)  │
                     └─────────────────┘
```

Meals already capture full compound data. The wellness layer:
- Pulls aggregated daily nutrition from meals
- Does NOT duplicate food logging
- Correlates nutrient totals with all other signals

---

## Database Schema (Minimal)

### Option A: Single Flexible Table

```sql
CREATE TABLE wellness_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- What is being logged
  category TEXT NOT NULL,           -- 'sleep', 'energy', 'mood', 'activity', 'symptom'
  subcategory TEXT,                 -- 'duration', 'quality', 'steps', etc.

  -- The value (one of these)
  value_numeric REAL,               -- 7.5 (hours), 8000 (steps), 4 (scale)
  value_text TEXT,                  -- 'headache', 'feeling great'
  value_scale SMALLINT,             -- 1-5 for subjective ratings

  -- Context
  unit TEXT,                        -- 'hours', 'steps', 'liters', null for scales
  tags TEXT[],                      -- ['traveled', 'weekend', 'stressful']
  notes TEXT,                       -- Free-form notes

  -- Metadata
  metadata JSONB DEFAULT '{}',      -- Extensibility
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_wellness_logs_user_date ON wellness_logs(user_id, logged_at);
CREATE INDEX idx_wellness_logs_category ON wellness_logs(category, logged_at);
```

### Option B: Separate Tables per Category

More structured, but more tables to maintain. Defer decision until implementation.

---

## Time Considerations

### Granularity

| Signal | Logged When | Granularity |
|--------|-------------|-------------|
| Sleep | Morning | Once per night |
| Energy | Multiple times | Morning / Afternoon / Evening |
| Mood | As needed | Flexible |
| Meals | Already tracked | Per meal |
| Activity | End of day or real-time | Daily summary or per activity |
| Symptoms | When they occur | As needed |

### Correlation Windows

- **Same day:** caffeine → sleep quality
- **Next day:** sleep → energy, nutrients → mood
- **Weekly trends:** average sleep → average energy
- **Monthly patterns:** cycle tracking, seasonal effects

---

## Correlation Engine (Future)

### What It Does

1. Collects all signals over time
2. Finds statistically significant patterns
3. Surfaces insights to user

### Example Insights

> "When your sleep is under 6 hours AND you consume caffeine after 2pm AND your magnesium intake is below 300mg, you have a 73% chance of reporting low energy the next day."

> "Your mood scores are 40% higher on days when you hit your protein target and walk more than 5000 steps."

> "Headaches correlate strongly with dehydration (water < 1.5L) the previous day."

### Technical Approach (Future)

- Start simple: basic correlations, rolling averages
- Grow complex: ML models, causal inference
- Privacy-first: all analysis on user's own data

---

## UI Concepts

### Daily Log (Minimal)

```
┌─────────────────────────────────────────┐
│  Today, Jan 24                          │
├─────────────────────────────────────────┤
│  Sleep         ████████░░  7.5 hrs  ⭐4 │
│  Energy        ⭐⭐⭐⭐░              4/5 │
│  Mood          ⭐⭐⭐░░              3/5 │
│  Movement      🚶 6,200 steps           │
│  Water         💧💧💧░░            1.5L │
│                                         │
│  [+ Add symptom]  [+ Add note]          │
└─────────────────────────────────────────┘
```

### Quick Log

One-tap buttons for common entries:
- Energy: 😫 😕 😐 🙂 😊
- Sleep quality: Same scale
- Common symptoms: Headache, Fatigue, Bloating, etc.

### Insights View (Future)

Weekly/monthly correlation insights surfaced by AI.

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Create `wellness_logs` table
- [ ] Basic logging API endpoints
- [ ] Simple daily log UI
- [ ] Track: sleep, energy, mood (1-5 scales)

### Phase 2: Expansion
- [ ] Add activity tracking (steps, exercise)
- [ ] Add hydration tracking
- [ ] Add symptom/tag logging
- [ ] Pull daily nutrition aggregates from meals

### Phase 3: Intelligence
- [ ] Basic correlation analysis
- [ ] Weekly summary with patterns
- [ ] Simple insights ("you sleep better when...")

### Phase 4: Integrations
- [ ] Apple Health / Google Fit sync
- [ ] Wearable integrations (Oura, Whoop, Fitbit)
- [ ] CGM data (future)

### Phase 5: Advanced AI
- [ ] Claude-powered insight generation
- [ ] Personalized recommendations
- [ ] Predictive alerts ("based on today, you might...")

---

## Open Questions

1. **Mobile-first?** Wellness logging needs to be frictionless. Mobile app priority?
2. **Wearables first?** Auto-import sleep/activity vs. manual logging?
3. **Goal setting?** Should users set targets (7+ hrs sleep) or just track?
4. **Social/accountability?** Any community features, or purely personal?
5. **Premium feature?** Part of subscription tier or free for all?

---

## Competitive Landscape

| App | Focus | Nutri Differentiator |
|-----|-------|---------------------|
| MyFitnessPal | Calories/macros | Compound-level nutrition |
| Cronometer | Micronutrients | Wellness correlation |
| Oura | Sleep/readiness | Nutrition connection |
| Whoop | Recovery/strain | Why you feel that way |
| Apple Health | Data aggregation | Intelligence layer |

**Nutri's edge:** The only platform that connects deep biochemistry (compounds, phytochemicals) with holistic wellness signals to explain *why* you feel the way you do.

---

## References

- Existing meal tracking: `/home/kodd/Nutri/db/schema/meal_tracking.ts`
- Compound system: `/home/kodd/Nutri/docs/architecture/compound-tiering-system.md`
- User profiles: `/home/kodd/Nutri/db/schema/users.ts`
