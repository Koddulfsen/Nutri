# Vietnam — Nhu cầu dinh dưỡng khuyến nghị cho người Việt Nam (2016)

Source: the official National Institute of Nutrition book, issued with decision 2615/QĐ-BYT of 16 June 2016 (188 pages). The PDF is gitignored; the URL is in `db/seed/dv/sources.ts`. `source/vn-125-125.png` is the folate page render (see below).

What was taken:
- The per-nutrient chapter tables (Bảng 16-42), which publish EAR / RDA / AI / UL by sex — richer than the appendix.
- The appendix for what the chapters do not cover: energy by activity level, protein, fat and fatty acids, carbohydrate and fibre, sodium/potassium/chloride, and the vitamin B1 and B2 pregnancy increments.

Checks, 2026-09-20:
- 1847 values.
- All 307 chapter table rows were compared cell by cell against the book's text layer: 0 mismatches.
- db = file; type audit 0 fail.

Decisions are in the `extract.ts` header. Notable ones:
- Iron is stored at 10% dietary bioavailability, with the 15% value in the note. Where the book prints a separate menstruating row (girls 10-11 and 12-14 y, women over 50), the menstruating value is stored and the non-menstruating one noted — one value per demographic, and the menstruating case is what the recommendation covers.
- Zinc is stored at three absorption levels, mapped onto the phytate contexts (poor = 15%, moderate = 30%, good = 50% bioavailability).
- Amino acids (per kg, per g protein) and water (per kg, per kcal) are not stored, as we do not store per-kg values.

Source defects, verified on the page render and recorded in `scripts/dv-verify/check-source-consistency.ts`:
- Bảng 38 (folate) prints an average requirement above the recommended intake for 1-2 y (120 vs 100 µg), boys 15-19 y (320 vs 300) and lactation (520 vs 500). Stored as published.
- The appendix and chapters disagree on a few zinc cells; the chapter value is stored and the appendix value noted.

Source dependency: the values are adapted from FAO/WHO 2004, IOM and the Japanese DRIs 2015, named per table in the book.
