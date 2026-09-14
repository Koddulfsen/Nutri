# NNR 2023 source notes

**Authority:** Nordic Council of Ministers — Nordic Nutrition Recommendations 2023 (Integrating Environmental Aspects)
**URL:** https://pub.norden.org/nord2023-003
**Region code:** `NORDIC`
**Countries covered:** Denmark, Finland, Iceland, Norway, Sweden (+ informally the Baltic states)
**Source type:** `SCIENTIFIC_DRI`
**Retrieved:** 2026-04-14

## Value types published

- **RI** — Recommended Intake (97.5 % coverage) → stored as `RDA`
- **AI** — Adequate Intake → stored as `AI`
- **AR** — Average Requirement → stored as `EAR`
- **UL** — Tolerable Upper Intake Level → stored as `UL`
- **CDRR** — Chronic Disease Risk Reduction (sodium only) → stored as `CDRR`

"Provisional AR" is a separate NNR concept: indicates lower confidence. Flagged
with `is_provisional = true` on EAR rows.

## Native age buckets

NNR uses (not sex-differentiated for children):
- ≤6 mo, 7-11 mo
- 1-3 y, 4-6 y, 7-10 y
- 11-14 y, 15-17 y (then sex-split)
- 18-24 y, 25-50 y, 51-70 y, >70 y (sex-split)

Pregnancy split into 3 trimesters. Lactation single bucket.

## Special cases

- **Vitamin A** unit is RE (retinol equivalents); 1 RE = 1 µg preformed retinol = 2 µg supplemental β-carotene = 6 µg dietary β-carotene
- **Vitamin E** unit is α-TE (α-tocopherol equivalents)
- **Niacin** unit is NE (niacin equivalents); 60 mg tryptophan = 1 mg NE
- **Folate** UL (1,000 µg) applies to folic acid (synthetic) only, not dietary folate
- **Magnesium** UL (250 mg) applies to supplemental magnesium only, not dietary
- **Vitamin D** RI is 20 µg for age ≥75 y (not ≥70 y as some summaries suggest)
- **Iron** female 51-70 y RI = 8 mg assumes post-menopause; menstruating females 51-70 use 15 mg
- **Thiamin** and **Niacin** are published as mg/MJ of energy, not absolute. Converted using reference energy from Table 8 (PAL 1.4, low-active)
- **Protein** is published in g/kg body weight. Converted using reference weights from Tables 8 and 10
- **Niacin** has two ULs (900 mg nicotinamide; 10 mg nicotinic acid). We stored only the nicotinamide value — improvement followup
- **Vitamin C** smokers need +40 mg/d (captured in `value_note`)

## What we didn't seed

- Water / fluid recommendations
- Macronutrient E% ranges (fat 25-40 E%, carbs 45-60 E%, etc.) — these are ranges-of-energy-percent which the schema can store but we haven't wired up
- Alcohol recommendations (NNR says "avoid")
- Fatty acid sub-category breakdowns (mono, poly, saturated targets)

## Source document

- `nord2023-003.pdf` — full 388-page report (20 MB)
- Relevant pages: 57-76 (summary Tables 8-16); 124-183 (per-nutrient chapters with ULs)

## Seed files

- `db/seed/seed-nordic-nnr-2023.ts` — seeds everything above
- `db/seed/verify-nnr-2023.sql` — spot-check queries
