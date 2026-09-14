# DV Sourcing Guide

Step-by-step instructions for adding a new DRI/DRV source to Nutri's daily value system. Written for a fresh Claude Code session with no prior context.

## Quick orientation

**What this system does:** Nutri stores dietary reference values from ~15 global health authorities. Each source publishes recommended nutrient intakes by age, sex, pregnancy, lactation, and sometimes activity level or dietary context. We aggregate these into a single "Nutri Target" per user.

**Key files:**
- `db/schema/daily_values.ts` — table definitions (reference_daily_values, dv_sources, user_custom_daily_values)
- `db/schema/daily_values_enums.ts` — all enums (source_region, value_type, life_stage, activity_level, dietary_context, etc.)
- `db/seed/_template-source-seed.ts` — copy-paste starting point for new seeds
- `db/seed/SOURCING.md` — the 5-gate pipeline (Gate 1-5)
- `dv-sources/INDEX.md` — coverage tracker (what's seeded, what's pending, access status)
- `scripts/check-source-compound-names.ts` — Gate 2 compound-name pre-flight tool

**Database:**
- `reference_daily_values` — main table (~5,000+ rows). One row = one value for one compound at one demographic. Unique index on `(compound_id, source_region, age_min_months, age_max_months, sex, life_stage, value_type, activity_level, dietary_context)` with **NULLS NOT DISTINCT**.
- `dv_sources` — source attribution (authority name, URL, version year, notes)

---

## How to add a new source (step by step)

### 1. Check INDEX.md

Open `dv-sources/INDEX.md` and pick the next unseeded source. Check its access status (🆓 free / 🔓 partial / 💰 paid).

### 2. Create the source folder

```bash
mkdir -p dv-sources/<slug>
```

### 3. Gate 1 — Acquire source material

- **Free PDF?** → Download to `dv-sources/<slug>/`
- **Web tables?** → Use WebFetch or ask user to download
- **CAPTCHA-blocked?** (sinu.it, pub.norden.org) → Ask user to download manually via browser
- **Paywalled?** → Note in INDEX.md, use whatever free materials exist

Write `dv-sources/<slug>/NOTES.md` covering:
- Authority name, URL, region code, retrieval date
- Value types published (EAR/RDA/AI/UL/DG/AMDR/CDRR/SDT — see "Value type cheat sheet" below)
- Native age buckets
- Special cases (iron menstruation, niacin form split, thiamin mg/MJ, etc.)

### 4. Gate 2 — Compound name check

**ALWAYS DO THIS BEFORE WRITING SEED CODE.**

```bash
npx tsx scripts/check-source-compound-names.ts "Vitamin A" "Iron" "Calcium" ...
```

Output gives you:
- **Exact matches** — no mapping needed
- **Fuzzy matches** — paste the suggested `COMPOUND_NAME_MAP` into your seed
- **Missing** — decide: skip or add to core

### 5. Gate 3 — Extract raw values

Read the PDF or HTML tables. Structure the data.

For small sources: inline data in the seed file.
For large sources: create `dv-sources/<slug>/raw-values.ts` and import.

### 6. Gate 4 — Write the seed

Copy `db/seed/_template-source-seed.ts` to `db/seed/seed-<region>-<authority>-<year>.ts`.

Fill in:
- `SOURCE` metadata (authorityName, regionCode, versionYear, url, note)
- `COMPOUND_NAME_MAP` from Gate 2
- `buildAllRows()` with all the extracted data

Key patterns:
```typescript
// Age ranges in months — store source's NATIVE ranges
{ ageMinMonths: 216, ageMaxMonths: 359 }  // 18-29 years
{ ageMinMonths: 900, ageMaxMonths: null }  // 75+ years (null = open-ended)

// Sex expansion for unisex age groups (infants/children)
const sexes: Sex[] = sex === 'BOTH' ? ['MALE', 'FEMALE'] : [sex];

// Value type normalization
// PRI (EFSA/LARN) → RDA
// RI (Nordic NNR) → RDA
// AR (EFSA/NNR) → EAR
// DG (Japan MHLW) → AMDR
```

### 7. Run + verify

```bash
# First run — should insert N rows
npx tsx db/seed/seed-<region>-<authority>-<year>.ts

# Second run — MUST show Inserted: 0, Updated: N (idempotence check)
npx tsx db/seed/seed-<region>-<authority>-<year>.ts
```

If second run shows inserts → unique index issue. Check `ON CONFLICT` clause includes all 9 columns.

### 8. Spot-check

Write `db/seed/verify-<slug>.sql` with 5-7 values you can verify against the source PDF.

### 9. Update INDEX.md

Mark the source as ✅, update row count and coverage description.

---

## Value type cheat sheet

| Source term | Nutri enum | Meaning | Coverage |
|---|---|---|---|
| RDA / PRI / RNI / RI / RDI | `RDA` | Recommended intake (97.5% of population) | "Target" |
| AI | `AI` | Adequate intake (when RDA can't be derived) | "Target" (lower confidence) |
| EAR / AR | `EAR` | Estimated average requirement (50%) | "Floor" |
| UL | `UL` | Tolerable upper intake level | "Ceiling" |
| AMDR / RI range / DG range | `AMDR` | % of energy range for macros | Range |
| CDRR / DG upper | `CDRR` | Chronic disease risk reduction | "Stay under" |
| SDT | `SDT` | Suggested dietary target (Italy LARN only) | Disease prevention |

---

## Common edge cases

### Iron menstruating/not-menstruating split
Sources: EFSA, MHLW Japan, LARN, NNR. Store menstruating value as the primary row for fertile-age females. Use `value_note` to capture the non-menstruating alternative.

### Zinc phytate (LPI) tiers
Source: EFSA. Four phytate levels → four rows per demographic using `dietary_context` column: `PHYTATE_LOW`, `PHYTATE_MED_LOW`, `PHYTATE_MED_HIGH`, `PHYTATE_HIGH`.

### Niacin UL form split
Sources: NNR, EFSA, MHLW. Nicotinamide UL (~900 mg) and Nicotinic Acid UL (~10 mg) are separate DB compounds. The umbrella "Niacin (B3)" gets the nicotinamide value.

### Thiamin & Niacin as mg/MJ
Sources: NNR, EFSA. Published as ratio per MJ of energy, not absolute mg. Convert using source's reference energy table (PAL 1.4 default). Document derivation in `value_note`.

### Protein as g/kg body weight
Sources: NNR, EFSA, ICMR. Multiply by source's reference body weight per age/sex to get absolute g/d. Document in `value_note`.

### Magnesium UL = supplemental only
Sources: NIH, NNR, EFSA. The UL applies to supplemental magnesium (salts + supplements), not dietary. Note in `value_note`.

### Folate UL = synthetic folic acid only
Sources: all. The UL applies to pteroylmonoglutamic acid (synthetic folic acid), not food folate.

### Vitamin D for elderly
Sources: NNR, NIH. Higher AI/RDA for ≥75y (typically 20 µg vs 10-15 µg for younger adults). Check source carefully.

### Sodium unit conversion
Sources: MHLW Japan publishes as mg Na + salt equivalent (g). Convert: 1 g salt ≈ 393 mg Na.

### Vitamin D IU → µg
Sources: ICMR. Convert: 1 µg = 40 IU (so 400 IU = 10 µg, 600 IU = 15 µg).

---

## DO / DON'T

### DO
1. **Always run compound-name check** before writing seed code
2. **Test idempotence** — run seed twice, second must show 0 inserts
3. **Store native age ranges** as-is (age_min_months/age_max_months)
4. **Include all 9 columns** in ON CONFLICT clause (compound_id, source_region, age_min_months, age_max_months, sex, life_stage, value_type, activity_level, dietary_context)
5. **Use value_note** for caveats (menstruation, supplemental-only, phytate, form-specific)
6. **Convert units** at seed time (g→mg, IU→µg, MJ→kcal, salt→Na)
7. **Write NOTES.md** before the seed (documents source structure for future reference)
8. **Distinguish RDA vs AI** when source marks them differently (bold/asterisk notation)
9. **Collect ALL value types** the source publishes (EAR+RDA+AI+UL+DG) — maximum granularity
10. **DELETE + re-seed** if you find orphan rows from a bad previous run

### DON'T
1. **Don't force source age buckets into an enum** — use age_min_months/age_max_months
2. **Don't map multiple source compounds to the same DB compound** (e.g., ALA+DHA→Omega-3 caused 12 collision rows in EFSA)
3. **Don't skip data** because extraction is tedious — user wants maximum granularity
4. **Don't store flat/regulatory values** without age+sex demographics (regulatory table was removed)
5. **Don't generate migrations** without checking NULLS NOT DISTINCT is preserved on the unique index
6. **Don't use WebFetch** on CloudFlare-protected sites — ask user to download
7. **Don't call values "%DV"** — use "daily target" or cite specific source
8. **Don't assume compound names match** — always use the name checker tool first
9. **Don't skip pregnancy/lactation** if the source publishes them
10. **Don't merge EAR into RDA pool** — they're different value types with different use cases
