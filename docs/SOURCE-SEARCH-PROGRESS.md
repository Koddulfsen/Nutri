# Source Search Integration Progress

**Last Updated**: 2026-02-10

Tracks the full integration pipeline for each food data source: from staging tables to UI search.

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| Done | Complete |
| WIP | Work in progress |
| - | Not started |
| N/A | Not applicable |

---

## Integration Checklist

| # | Source | Region | Staging Schema | Data Loaded | Search Endpoint | Nutrient Count | Food-Add | Compound Mappings | UI Enabled |
|---|--------|--------|---------------|-------------|-----------------|----------------|----------|-------------------|------------|
| 1 | CNF | Canada | N/A (API) | N/A (API) | Done | Done | Done | Done (152) | Done |
| 2 | FDC | USA | N/A (API) | N/A (API) | Done | Done | Done | Done (329) | Done |
| 3 | FooDB | Canada | Done | Done | Done | Done | Done | Done (559) | Done |
| 4 | Phenol-Explorer | EU | Done | Done | Done | Done | WIP | Done (748) | Done |
| 5 | Duke | USA | Done | Done | Done | Done | Done | Done | Done |
| 6 | AFCD | Australia | Done | Done | Done | Done | Done | Done (218) | Done |
| 7 | UK CoFID | UK | Done | Done (2,886 foods) | Done | Done | Done | Done (104) | Done |
| 8 | CIQUAL | France | Done | Done (3,484 foods) | Done | Done | Done | Done (70) | Done |
| 9 | BLS | Germany | Done | Done (7,140 foods) | Done | Done | Done | Done (118) | Done |
| 10 | FRIDA | Denmark | Done | Done (1,370 foods) | Done | Done | Done | Done (205) | Done |
| 11 | Fineli | Finland | Done | Done (4,238 foods) | Done | Done | Done | Done (65) | Done |
| 12 | NEVO | Netherlands | Done | Done (2,328 foods) | Done | Done | Done | Done (88) | Done |
| 13 | Matvaretabellen | Norway | Done | Done (2,121 foods) | Done | Done | Done | Done (53) | Done |
| 14 | FOODfiles | New Zealand | Done | Done (2,857 foods) | Done | Done | Done | Done (184) | Done |
| 15 | MEXT | Japan | Done | Done (2,478 foods) | Done | Done | Done | Done (122) | Done |
| 16 | KFCT | Korea | Done | Done (2,733 foods) | Done | Done | Done | Done (126) | Done |
| 17 | INDB | India | Done | Done (1,014 foods) | Done | Done | Done | Done (39) | Done |
| 18 | ASEANFOODS | SE Asia | Done | Done (517 foods) | Done | Done | Done | Done (21) | Done |

---

## Per-Source Integration Steps

Each source follows this pipeline:

1. **Staging Schema** - Create `db/schema/source_<name>.ts` with foods, nutrients, content tables
2. **Data Loaded** - Create `db/seed/<name>/import-<name>.mjs` to load Excel/CSV into staging tables
3. **Search Endpoint** - Create `app/api/foods/<name>/search/route.ts` with token-based scoring
4. **Nutrient Count** - Add source to `app/api/foods/nutrient-count/route.ts`
5. **Food-Add** - Add source to `app/api/foods/route.ts` (SSE fetch + standardize pipeline)
6. **Compound Mappings** - Run `scripts/add-<name>-compounds.ts` to create compound_sources entries
7. **UI Enabled** - Set `enabled: true` in `app/components/modals/add-food/source-config.ts`

---

## Specialized Sources (Future)

| Source | Type | Status |
|--------|------|--------|
| Open Food Facts | Packaged foods (4M+) | Not started - isolate due to ODbL license |
| NIH DSLD | Supplement labels (200k+) | Not started |

---

## Notes

- CNF and FDC use live APIs, all others use local staging tables
- Compound mappings are done for all 18 sources (total 3,318 mappings)
- The search pipeline pattern was established with AFCD and should be replicated for remaining sources
- Each staging table set follows: foods (metadata), nutrients (definitions), content (values in long format)
