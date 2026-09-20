# RNI 2017 — Malaysia

Source: Recommended Nutrient Intakes for Malaysia 2017 (NCCFN, Ministry of Health), the full 523-page book. The PDF is gitignored; the URL is in `db/seed/dv/sources.ts`. Book page = PDF page - 17. Renders of the summary tables are in `source/rni-537..540.png`.

What was taken:
- RNI 2017 Summary Tables 1-3b (book pp. 520-523): energy by activity level, protein, vitamins, minerals.
- Macronutrient ranges: Appendix 3.5 (fat and fatty acids), Appendix 4.1 (carbohydrate, free sugars, fibre), and the protein %TEI range on p. 14.
- Upper levels printed in the chapters. Every one is reproduced from IOM, and each value's note says so.

Checks, 2026-09-17:
- 1241 values.
- 61 of 63 transcribed row strings matched the book text verbatim. The other 2 are the girls' iron rows, where the menstruating and non-menstruating cells were deliberately reordered.
- db = file; consistency clean; type audit 0 fail.

Decisions are listed in the `extract.ts` header. Key points:
- Every summary value is stored as RDA (the tables label them all "RNI"), which is logged as a known issue.
- Iron is stored at 10% bioavailability, with the 15% value in the note.
- Magnesium for women 51-69 y is printed as 420 mg here and in chapter 25; IOM gives 320. Stored as published, with a note.
- No zinc UL: the book's table only compares WHO/FAO, IOM and IZiNCG without adopting one.

Source dependency: the vitamin values are mostly WHO/FAO 2004 (vitamin D and B12 from IOM 2011 and EFSA 2015), the minerals WHO/FAO 2004 or IOM, and every UL is IOM.
