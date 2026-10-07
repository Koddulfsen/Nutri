# US EPA — Integrated Risk Information System (IRIS)

**Authority:** United States Environmental Protection Agency, IRIS programme
**Region code:** `USA_EPA` — deliberately NOT `USA_CANADA`. That region is the IOM/NAM nutrient DRIs;
this is a toxicology programme in a different agency. Two committees of the same country are two
judgements, and folding them together would hide where they disagree.
**Retrieved:** 2026-10-07 · **Assessment date:** 1989 (cadmium)

## What is stored

| Contaminant | EPA's value | Stored? |
|---|---|---|
| **Cadmium (food)** | chronic oral RfD **1 × 10⁻³ mg/kg-day** = 1 µg/kg bw per day, critical effect "significant proteinuria", NOAEL with a composite uncertainty factor of 10 | ✅ yes |
| Cadmium (water) | 5 × 10⁻⁴ mg/kg-day | ❌ not dietary |
| Lead | no RfD — EPA states a safe level cannot be identified | ❌ none exists |
| Inorganic arsenic | an RfD exists but was not verified against IRIS in this pass | ❌ not yet |

EPA is the only one of the three bodies to split cadmium by exposure route. The **food** value is the
one stored, because that is what this system measures; the water figure is stricter and would be the
wrong number to apply to a meal.

## Age of the assessment, stated plainly

The cadmium RfD was last updated **1 October 1989**. JECFA's PTMI is from 2010 and EFSA's TWI from 2009,
both of which post-date it by two decades and both of which are stricter per day:

| Body | As published | Per kg per day |
|---|---|---|
| EFSA | 2.5 µg/kg per week | 0.357 |
| JECFA | 25 µg/kg per month | 0.833 |
| **EPA** | **1 µg/kg per day** | **1.0** |

So EPA is the most permissive of the three and does not change what a user sees — `lib/dv/resolve.ts`
shows the strictest contaminant ceiling, which is EFSA's. It is stored anyway because a body that
agrees-but-looser is still evidence about the spread, and because leaving it out would make the
disagreement between authorities invisible.

## Shape

Chronic oral RfDs are **daily** values **per kg of body weight**: `averaging_days: 1`,
`per_kg_body_weight: true`, value type `RfD`.

## Source held

`source/epa-iris-cadmium.txt` — the IRIS chemical record for cadmium (CASRN 7440-43-9), quoting the two
oral RfDs, their critical effect and the assessment date.
