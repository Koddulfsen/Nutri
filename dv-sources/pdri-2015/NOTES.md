# PDRI 2015 — Philippines

Source: FNRI-DOST, PDRI 2015 Summary Tables (revised September 2018), 7 pages. The PDF is gitignored and the URL is in `db/seed/dv/sources.ts`. Renders are in `source/pdri-1..7.png`.

**RNI vs AI.** The tables show RNIs in bold and AIs in italics. `source/pdri-2015-spans.txt` is a PyMuPDF dump that tags each span [B] or [I]. It was generated with a scratch venv: `pip install pymupdf`, then read each span's font name and flags.

Checks, 2026-09-17:
- 1736 values.
- Every row string was matched against the span dump. The only differences were layout wraps (footnote letters, split cells), and those rows were checked against the renders.
- db = file; consistency clean; type audit 0 fail.

Decisions are listed in the `extract.ts` header.

Source dependency:
- The ULs are adapted from WHO/FAO 2006 and IOM.
- Page 7 is WHO's sodium, potassium and sugars guidelines, which are already in WHO_FAO.
