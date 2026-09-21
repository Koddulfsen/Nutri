# DV value types — what each number means, and how a bar should read it

Inventory of every value from the 10 alpha sources (`ALPHA_INDEPENDENT_REGIONS`), taken from
`reference_daily_values` on 2026-09-21. **14,767 values, 7 stored types.** Companion to `PROVENANCE.md`, which
decides *which* sources count; this file decides *what kind of number* each one is.

## The seven stored types, and the native terms behind them

Every source names its values differently. The loaders already map native terms onto seven types
(`lib/dv/value-types.ts`); these are the terms that collapsed into each for the 10 sources:

| Stored type | Rows | Native terms (10 alpha sources) | Meaning |
|---|---|---|---|
| **RDA** | 4,461 | RDA (US, Japan, India), PRI (EFSA), RNI (WHO, China, Korea, UK), Empfohlene Zufuhr (D-A-CH), норма физиологической потребности (Russia) | Intake covering the needs of ~97.5% of a group (average requirement + 2 SD). |
| **AI** | 2,991 | AI (most), Schätzwert (D-A-CH), Safe Intake (UK), адекватный уровень (Russia), "safe and adequate" (EFSA sodium) | Intake assumed adequate where the evidence cannot support an RDA — usually observed healthy intakes. Same direction as an RDA, less certain. |
| **EAR** | 2,415 | EAR, AR (EFSA) | Intake meeting the needs of **half** a group. A population-planning number. |
| **UL** | 2,048 | UL (all that set one) | Highest habitual intake unlikely to cause harm. **240 rows are supplement-only** (magnesium, folic acid, niacin forms…). |
| **CDRR** | 314 | CDRR (US, Korea), PI-NCD / SPL (China), WHO guideline, DG ceiling (Japan), max. (D-A-CH), UK max salt/sugar/fat, Russia "< x %" | Intake tied to lower **chronic-disease** risk. **Both directions**: 258 ceilings (sodium, sugars, saturated/trans fat, cholesterol), 56 floors (potassium, fibre, vitamin C, lycopene, lutein, plant sterols, β-glucan, inulin). |
| **AMDR** | 693 | AMDR (US, China, Korea), RI (EFSA), DG (Japan), Richtwert (D-A-CH), оптимальная доля (Russia), UK carb target | Share of energy for a macronutrient. **Four shapes**: range (411), floor (110), ceiling (66), point target (106). |
| **EER** | 845 | EER, AR for energy (EFSA), EAR energy (UK), Richtwert energy (D-A-CH), energy requirement (WHO), RDA energy (India) | Average energy need. Depends on sex, age, body size and **activity** (645 rows are activity-specific). |

**Same meaning, different names:** PRI = RNI = RDA = Empfohlene Zufuhr. AR = EAR. Schätzwert = Safe Intake = AI.
RI = AMDR. The mapping is sound; nothing in the 10 sources needs a new stored type.

## What each type means for a bar

The type decides the *kind* of bar. There are five kinds:

| Bar kind | Built from | How it reads | Example |
|---|---|---|---|
| **Goal (reach at least)** | RDA, else AI · CDRR floors · AMDR floors | Fill toward 100%; under = shortfall, over = fine (until a ceiling) | Vitamin C, iron, fibre, potassium |
| **Limit (stay under)** | UL · CDRR ceilings · AMDR ceilings | Empty is good; approaching 100% = warning; over = exceeded | Sodium, added sugar, saturated fat; vitamin A from retinol |
| **Range (stay inside)** | AMDR ranges | Band with a lower and upper edge | Fat 20-35% of energy, carbohydrate 45-65% |
| **Point target (be near)** | EER · AMDR point values | Distance from the target, either side | Energy; Russia's "optimal" 30% fat |
| **Reference marker only** | EAR | Not a target. At most a line on a goal bar: below it, the chance of inadequacy is over 50% | Iron EAR under the RDA |

A single nutrient usually has **both** a goal and a limit — vitamin A, calcium, zinc, iron, sodium (AI floor + CDRR/UL
ceiling). That is one bar with a green zone between the goal and the limit, not two bars.

## Rules the calculation will need (to decide later — recorded now so the data is ready for them)

1. **Goal = RDA if the source has one, else AI.** Never EAR — using EAR as a personal target would tell half the
   people who meet it that they are fine when they are not.
2. **Limit = the lowest applicable ceiling** among UL (non-supplemental), CDRR ceilings and AMDR ceilings. CDRR
   ceilings are usually stricter than ULs (sodium).
3. **Supplement-only ULs never flag food.** 240 UL rows limit only supplemental/synthetic intake (magnesium salts,
   folic acid, nicotinic acid). They need the supplement portion of intake, which the app does not track separately
   yet — until it does, they must not turn a food-only bar red.
4. **Percent-of-energy values need the user's energy intake** to become grams (AMDR, most CDRR for fats and sugars,
   and EFSA's per-MJ thiamin/niacin). A bar for "fat" is a share, not a weight.
5. **Direction lives in min/max, not in the type name.** CDRR and AMDR mix directions; a bar must read `value_min` /
   `value_max`.

## Problems found in this inventory

**1. 106 AMDR rows have no direction.** No min, no max — a bar cannot tell a target from a limit:

| Source | Compounds | Native term |
|---|---|---|
| Russia (78 rows) | carbohydrate 56-58%, protein 12-14%, fat 30%, saturated fat 10%, MUFA 10% | "оптимальная доля в калорийности" (optimal share) |
| D-A-CH (15) | fat 30%, carbohydrate 45 / 47% | Richtwert |
| UK (2) | carbohydrate 50% | carb target |

Most are genuinely **point targets** ("about 50%"), which is a legitimate fifth shape. But at least one is suspect:
Russia's saturated fat 10% reads like "not more than 10%", which would be a ceiling. **Each needs its source text
re-read** before the bar can use it. Until then, treat them as point targets and never as limits.

**2. Heavy metals and contaminants have no values at all.** Lead, cadmium, mercury, arsenic and aluminium exist as
compounds with **0 rows**. Nutrition bodies do not set these: they come from toxicology panels (EFSA CONTAM, the
FAO/WHO JECFA) as **tolerable weekly or daily intakes per kg of body weight** (TWI / PTWI / TDI), sometimes as
"no safe level" (lead). That is a different kind of source, with its own provenance question, and a different
shape of value (per kg, per week). A heavy-metal bar would be a limit bar, but it needs body weight and a new type.

**3. Compounds with only a ceiling — two kinds.** 6 compounds have a UL and nothing else:

- **Boron, nickel** — genuinely limit-only; their bar can only be a limit, and showing no goal must be deliberate.
- **Folic Acid (Synthetic), Nicotinic Acid, Nicotinamide, Retinol** — *forms* of a vitamin whose goal is stored on the
  parent compound (Folate, Niacin, Vitamin A). The limit applies to the form, the goal to the total: folic acid from
  supplements is capped while total folate has a target. So a vitamin A bar needs the goal from "Vitamin A (RAE/RE)"
  and the ceiling from "Retinol" — two compounds feeding one bar. The calculation needs that parent/form link; the
  compound hierarchy already has parents, but which UL belongs to which bar must be explicit.

## Open decisions (for the calculation step)

- Whether to show EAR at all, and how.
- How to aggregate each bar kind across sources (median of goals; strictest or median of limits?).
- Whether to add a TWI/TDI type and a contaminant source set for heavy metals.
