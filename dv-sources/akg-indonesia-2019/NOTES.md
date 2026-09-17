# AKG 2019 — Indonesia

Source: Permenkes No. 28 Tahun 2019, Lampiran I, Tabel 1-3, printed pp. 7-14. The copy is the Ministry-certified one from stunting.go.id. The PDF is gitignored and the renders are in `source/`.

Checks, 2026-09-17:
- 1294 values.
- Every typed row was diffed against the text layer (78 rows, 0 differences), and every page was compared with its render.
- db = file; consistency clean; type audit 0 fail.

Decisions are listed in the `extract.ts` header. Key points:
- All values are stored as RDA (AKG is one category) and energy as EER. This is logged as a known issue.
- Pregnancy and lactation are stored as totals over women 19-29 and 30-49 y.
- Vitamin E header typo: printed "mcg", stored as mg.
- Selenium printed "±10": read as +10.

Not in the source: upper levels.
