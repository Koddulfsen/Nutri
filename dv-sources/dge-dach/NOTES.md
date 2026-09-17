# DACH — D-A-CH Referenzwerte für die Nährstoffzufuhr

**Authorities:** Deutsche Gesellschaft für Ernährung (DGE), Österreichische Gesellschaft für Ernährung (ÖGE),
Schweizerische Gesellschaft für Ernährung (SGE).
**Region code:** `DACH`. Extractor: `extract.ts` -> `values.json` -> `db/seed/dv/load-source.ts DACH`

## Source
The printed binder (3rd edition, 2025) costs €69, but DGE publishes the same current values free in its
Referenzwerte-Tool: https://www.dge.de/wissenschaft/referenzwerte-tool/. The tool's filter URL was requested
for all 16 population groups, all nutrients and both sexes (2026-09-17):

- `source/dge-referenzwerte-tool-all.html`: the full response (16 group tables)
- `source/dge-footnotes.json`: footnote texts, collected from 20 per-group responses (the combined page
  lists only some footnotes)

Every group table in the combined response was compared with the same group's individual response: identical.

Mapping decisions are in the header of `extract.ts`.
