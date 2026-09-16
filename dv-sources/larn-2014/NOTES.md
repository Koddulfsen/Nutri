# LARN 2014 (Italy)

**Authority:** SINU (Società Italiana di Nutrizione Umana), IV Revisione
**Source:** the 13 open tables linked from https://eng.sinu.it/tabelle-larn-2014/, saved 2026-09-16 in `source/`
**Region code:** `ITALY`. Extractor: `extract.ts` -> `values.json` -> `db/seed/dv/load-source.ts ITALY`

The mapping decisions, what is not stored, and the source's own contradictions are documented in the
header of `extract.ts`.

Why 2014: LARN V (2024) values are only in the paid book. The free 2024 files in `../larn-v-2024/`
contain methodology appendices (reference weights, growth factors, food sources) and a press release,
but no reference values.

History: the April 2026 seed stored 616 PRI/AI values, all typed RDA. The values matched the source
exactly, but about half were AIs (SINU prints AIs in italics). AR, UL, SDT, protein, lipid,
carbohydrate/fibre and energy tables were not loaded. All are now stored (1420 values).
