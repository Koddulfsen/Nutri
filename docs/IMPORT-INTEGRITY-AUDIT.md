# Import integrity audit — 2026-08-22

**Trigger:** beef liver showed CIQUAL protein = 1.36 g where 12 other sources said 17–21 g.
Initially misdiagnosed (by me) as a mapping error. It is not. **The 1,807 compound mappings
are sound.** The defect is in one importer.

**Scope of this document:** analysis only. Nothing has been fixed.

---

## 1. Root cause

`db/seed/ciqual/import-ciqual.mjs`, lines 189–199:

```js
// nutrients.json entries are in the same order as Excel columns starting at col 9
// But we need to verify by checking headers match nutrient names   <-- never done
const colToNutrientCode = {};
for (let i = 0; i < nutrientsJson.length; i++) {
  const colIdx = NUTRIENT_START_COL + i;
  if (colIdx < headers.length) colToNutrientCode[colIdx] = String(nutrientsJson[i].id);
}
```

It binds **Excel column 9+i** to **nutrients.json[i]** purely by position, and never reads the
header text. The comment states the verification that was required and then omits it.

The two orderings do not match:

| Excel col | nutrients.json claims | The column actually is |
|---|---|---|
| 13 | Water | Water ✅ |
| 14 | Ash | **Protein** |
| 15 | Salt | **Protein, crude** |
| 16 | Sodium | **Carbohydrate** |
| 23 | Iron | **Maltose** |
| 26 | Selenium | **Fibres** |

**69 of 74 nutrient columns are bound to the wrong nutrient.** Only the first five align
(Energy ×4 and Water) — which is why Water looked correct in every spot check and disguised
the problem.

Confirmed against the raw spreadsheet, food `40104 Liver, heifer, raw`:

| Nutrient | Raw file | Staging | |
|---|---|---|---|
| Water | 70 | 70 | ✅ |
| Protein | 21 | 1.36 | ❌ |
| Retinol | 6350 | 59.9 | ❌ |
| Vitamin C | 27 | 0.4 | ❌ |
| Zinc | 3,57 | 0 | ❌ |
| Vitamin A RE | 6430 | **39.3** | ❌ — that is *Selenium's* raw value (39,3) |

Reproduced on two unrelated foods (Apricot 0,81→0.66; Artichoke 2,53→1.21; Water correct in
both). So it is systematic, not a bad row.

---

## 2. Omfang — where this applies

Checked all 13 loaded sources by profiling anchor nutrients (Water / Protein / Total Fat)
across every food, where the true range is known (0–100 g per 100 g).

| Source | Verdict | Evidence |
|---|---|---|
| **CIQUAL** | ❌ **Systemically corrupt** | Protein avg **1.0** vs 4.8–16.7 elsewhere; Total Fat avg 0.8. 69/74 columns misbound |
| **KFCT** | ⚠️ 8 bad rows | Values 2963–2967 for Water/Protein/Fat/Carbs — impossible per 100 g, and sequential, so likely a row index leaking into the value |
| **ASEANFOODS** | ⚠️ 14 bad rows | Water max 644, Protein max 358 |
| BLS · FINELI · FOODFILES · FRIDA · MATVARETABELLEN · MEXT · NEVO · UK_COFID · INDB | ✅ Plausible | Anchor nutrients in range; 12-source agreement on beef liver protein (17–21 g) and water (68.6–72.8 g) |
| FDC · CNF | ✅ Live APIs | Not affected by file parsing |

**CIQUAL blast radius: of 174,570 values, 16,303 are trustworthy and 158,267 are wrong (91%).**

Two things that looked like defects and are not:

- **INDB protein ceiling of 21.6 g** — INDB is a *cooked-dish* database, not raw ingredients.
  A max of 21.6 across roast chicken and dals is correct.
- **FRIDA "101 unmatched mappings"** — my test joined the wrong column. FRIDA maps through
  `source_frida_nutrients.eurofir_code`, not `nutrient_id`; 101 match by EuroFIR code, 4 by
  numeric id, **0 unmatched**. The client documents this. FRIDA is healthy.

---

## 3. Separate defect class — duplicate mappings

Independent of the importer bug, several sources map multiple source codes to one compound,
so one food yields several rows for the same nutrient:

| Source | Mappings | Distinct compounds | Effect |
|---|---|---|---|
| UK_COFID | 169 | 100 | Energy ×4; Dietary Fiber ×3 (AOAC *and* Englyst — genuinely different methods) |
| MEXT | 122 | 116 | Protein twice (17.4 and 19.6) |
| CIQUAL | 70 | 65 | every value duplicated |
| NEVO | 87 | 86 | Protein twice |

Beef liver currently carries **22 Energy rows** across 13 sources. Some are kcal, some are kJ
converted to kcal but still *labelled* kJ, and CNF's 564 kJ was never converted at all.

---

## 4. Why it escaped

1. **Positional coupling.** Meaning was inferred from ordinal position in a file, which is not
   a stable property of that file.
2. **A written TODO substituted for the check.** The comment names the verification and then
   does not perform it — a textbook §0 parasite: an unverified claim treated as fact.
3. **The plausible-looking column masked it.** Water aligned, so casual inspection passed.
4. **No post-import assertions.** The importer reports rows inserted, never whether they mean
   anything. 174,570 wrong values imported with a success message.
5. **Nothing compared sources to each other.** 12 sources agreeing on ~20 g and one saying
   1.36 g is trivially detectable — nothing was looking.

---

## 5. Proposal — how to leave no room for error

Not implemented; for discussion.

### A. Ban positional binding
Every importer must resolve a column by an identifier *present in the source file* — header
text or the source's own nutrient code. Where a format offers only position, assert the header
matches an expected string and **abort** on mismatch. Never `startCol + i`.

### B. Make each importer fail loudly
Before committing, assert and abort on violation:
- every mapped `external_id` resolves to a real column/code in the file
- per-100 g nutrients (water, protein, fat, carbohydrate, ash) are within 0–100
- energy within 0–1000 kcal
- for whole foods, water+protein+fat+carbs+ash ≈ 100 ± tolerance
- row count within an expected band for that source

### C. Golden records
A small fixture of hand-verified values — e.g. beef liver protein ≈ 20 g, retinol ≈ 5,000 µg —
asserted after every import. Cheap, and it would have caught this on the first run.

### D. Cross-source consensus check
For any food present in ≥3 sources, flag values more than ~2× from the median. This is the
check that actually found the bug, run by hand. It should be a command.

### E. Import provenance
Record per import: source, file name, file hash, row counts, timestamp, assertion results.
Then "is CIQUAL trustworthy?" is a query, not an investigation.

### F. One-nutrient-one-meaning
Resolve the duplicate mappings deliberately: pick a canonical code per compound per source, or
model method variants (AOAC vs Englyst fibre) as genuinely distinct compounds. Merging them
silently is a data-quality loss, not a rounding detail.

---

## 6. What is NOT wrong

- **The 1,807 compound mappings.** Spot-traced CIQUAL `25000 → Protein, g, ×1.0` and KFCT
  `RETOL → Retinol, µg, ×1.0`; both correct. The manual mapping pass holds up.
- **The conversion factors.** Fixed and verified earlier today; checker reports 0 real flags.
- **12 of 13 importers**, on the evidence available.
- **The merge and cross-source comparison logic.** It worked well enough to surface the bug.
