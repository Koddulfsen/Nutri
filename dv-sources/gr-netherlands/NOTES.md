# Gezondheidsraad — Netherlands

Sources (PDFs gitignored; URLs in `db/seed/dv/sources.ts`):
- Adults: advice 2018/19. Tabel 3 is on p. 25 and Tabel 4 on p. 26 (renders `source/gr2018-25.png`, `-26.png`).
- Infants 7-11 months and children: advice 2025/06, erratum of 9 Sept 2025. Tabellen 2-4 are on pp. 15-17 (renders `source/gr2025-15..17.png`).

445 values; db = file; consistency and type audit clean (2026-09-17). Decisions are listed in the `extract.ts` header.

Source dependency: every adult note records its "Herkomst".
- EFSA: most adult values.
- NCM 2014 (Nordic): vitamin C, copper, zinc.
- GR's own: vitamin A, B6, folate, B12, vitamin D, calcium 50+.

This matters for the median, where these rows are not independent votes.

Gaps in the source:
- Infants under 7 months.
- Pregnancy and lactation.
- Upper levels.
- Energy and macronutrients (GR 2001, not transcribed).
