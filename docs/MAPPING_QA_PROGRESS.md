# Mapping QA Progress (per-mapping correctness)

Tracks per-source review via `/admin/source-inspect` — confirming each compound's stored external_id, source_unit, and conversion_factor are correct against the source's actual catalog.

Different from `SOURCE_VERIFICATION_TRACKER.md` (which tracks mapping counts, not correctness).

| Source | Status | Date | Notes |
|---|---|---|---|
| AFCD | ✅ Done | 2026-04-25 | All core compounds verified. ~110 mappings. Mead Acid demoted, Behenic/Lignoceric unflagged (FLAGGED_MAPPINGS doc was wrong). Carb-family compounds retyped to CARBOHYDRATE. Fatty acids retyped to FATTY_ACID. |
| ASEANFOODS | 🔨 In progress | 2026-04-25 | |
| BLS | — | | |
| CIQUAL | — | | |
| FINELI | — | | |
| FOODB | — | | |
| FOODFILES | — | | |
| FRIDA | — | | |
| INDB | — | | |
| KFCT | — | | |
| MATVARETABELLEN | — | | |
| MEXT | — | | |
| NEVO | — | | |
| UK_COFID | — | | |
| DUKE | — | (no source-inspect adapter — needs special handling) |
| FDC | — | (API-backed — needs special handling) |
| CNF | — | (API-backed — needs special handling) |
| PHENOL | — | (no source-inspect adapter — needs special handling) |

## Notes per source

### AFCD
- Integer IDs only; non-numeric strings (e.g. EuroFIR codes) won't resolve.
- Scientific fatty acid notation: plain `Cx` = saturated form (Cx:0), `Cx:Y` = total of all Y-double-bond isomers, `Cx:Yw3`/`Cx:Yw6` = specific omega isomer.
- For unsaturated fatty acids: always pick the omega-specific isomer to avoid over-reporting.
- Amino acids: AFCD has both `mg` and `mg/gN` (per gram of nitrogen) forms — always pick `mg` (cf=0.001 → g).
- Cholesterol search: search "Alcohol" (AFCD's term for ethanol).
- Unit-cap: search returns 20 results max — narrow query if needed (e.g. `C20:5` instead of `C20`).
