# KDRI 2020 (Korea)

**Authority:** Ministry of Health and Welfare + The Korean Nutrition Society, *2020 Dietary Reference
Intakes for Koreans* (3 books, Dec 2020) and 4 rounds of errata (2021), all in this folder.
**Region code:** `KOREA`. Extractor: `extract.ts` -> `values.json` -> `db/seed/dv/load-source.ts KOREA`

Values come from the English summary tables in Book 1, Appendix 2, printed pp. 255-264 = PDF pages
293-302. Those pages are images; the renders read are in `source/`. **PDF pages 303-311 are the 2015
KDRI tables. Do not use them.** Mapping decisions, errata handling and what is not stored are in the
header of `extract.ts`.

History: the April 2026 seed (2094 rows) was re-checked cell by cell against these renders on
2026-09-16. It had:
- 9 wrong values: iodine EAR boys 9-11, phosphorus RNI girls 6-8, phosphorus UL 65-74 (both sexes)
  and 5 zinc cells, plus the same 16-cell comparison surfacing a pregnancy base mix-up (magnesium EAR,
  protein EAR)
- an iodine UL for pregnancy and lactation that the table leaves blank
- EPA+DHA stored as "Omega-3", folic-acid UL stored as "Folate (Total)", and niacin UL (two forms)
  collapsed into "Niacin (B3)"
- no amino-acid or water values, and none of the 2021 amino-acid errata
