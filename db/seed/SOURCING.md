# DV Source Seeding Pipeline

Every new scientific-DRI source follows the same 5-gate flow. Each gate is a
stop-and-confirm checkpoint — no ballooning scope between gates.

## Gate 1 — Intake

- [ ] Source material acquired (PDF in `dv-sources/<slug>/`, or web-reachable)
- [ ] Authority identified; pick a region code (must exist in `source_region_enum`)
- [ ] Write `dv-sources/<slug>/NOTES.md` covering:
  - Authority, URL, retrieved date
  - Value types published (RI / AI / AR / UL / SDT / CDRR / ...)
  - Native age buckets
  - Special cases (unit quirks, provisional flags, what isn't seeded)

## Gate 2 — Pre-flight compound check

Before writing any seed code, run:

```bash
npx tsx scripts/check-source-compound-names.ts "Name1" "Name2" "Name3" ...
```

Output tells you:
- Which source labels map cleanly to existing Nutri compounds
- Which need a `COMPOUND_NAME_MAP` entry
- Which are missing — decide: **skip**, or **add to core**

Paste the suggested `COMPOUND_NAME_MAP` into your seed file.

## Gate 3 — Extraction

- [ ] Raw tabular values extracted (manually from PDF, or scripted from web source)
- [ ] For medium/large sources: store raw data in `dv-sources/<slug>/raw-values.ts` as a pure data file
- [ ] Seed file imports raw data; keeps logic separate from numbers

## Gate 4 — Seed phase 1 (MVP)

- [ ] Start from `db/seed/_template-source-seed.ts`
- [ ] Fill in `SOURCE`, `COMPOUND_NAME_MAP`, `buildAllRows()` — **adults and RDA/AI only**
- [ ] Run once → verify row count + inserted count matches expected
- [ ] **Run it again immediately** → must show `Inserted: 0, Updated: N` (idempotence check)
- [ ] Write `db/seed/verify-<slug>.sql` with 5-7 spot-check queries against known values from the source

## Gate 5 — Seed phase 2 (completeness)

- [ ] Add child/teen age buckets
- [ ] Add pregnancy trimesters (`PREGNANT_T1/T2/T3` or just `PREGNANT`)
- [ ] Add lactation (`LACTATING` or split into `LACTATING_0_6M/7_12M`)
- [ ] Add ULs from per-nutrient chapters
- [ ] Add provisional ARs with `is_provisional = true`
- [ ] Add `value_note` for any caveats (menstruating, smokers, supplemental vs dietary)
- [ ] Re-verify with expanded spot-check query

## Tracking

Update `dv-sources/INDEX.md` each time a source is completed.

## Filename conventions

| Item | Location |
|---|---|
| Source document (PDF/etc.) | `dv-sources/<slug>/` |
| Source notes | `dv-sources/<slug>/NOTES.md` |
| Raw values (optional split) | `dv-sources/<slug>/raw-values.ts` |
| Seed script | `db/seed/seed-<region>-<authority>-<year>.ts` |
| Verify queries | `db/seed/verify-<slug>.sql` |

Slug = short handle like `nnr-2023`, `larn-v-2024`, `icmr-2020`, `mhlw-2025`.

## Golden rule

**Test idempotence before declaring a source done.** Run the seed twice. If the
second run reports any inserts, something's off — usually a NULL column missing
from the unique index's `NULLS NOT DISTINCT` coverage. Fix before moving on.
