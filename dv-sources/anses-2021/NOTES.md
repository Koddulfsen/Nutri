# ANSES 2021 — France

Source: ANSES avis et rapport 2018-SA-0238 (March 2021), `anses-2021-vitamines-mineraux.pdf` (gitignored; URL in `db/seed/dv/sources.ts`).
Transcribed: the avis summary tables (Tableau 2, vitamins, and Tableau 3, minerals) on avis pages 12-19. Each cell was read from `a.txt` (pdftotext) and checked against `source/anses-avis-0NN.png`. 833 values; db = file; consistency and type audit clean (2026-09-17).

Mapping: BNM→EAR, RNP→RDA, AS/`*`→AI, LSS→UL. The full list of decisions is in the `extract.ts` header.

Not stored:
- mg/day annexes for B1/B3 (per-MJ values are stored).
- Iron RNPs for high menstrual losses and for postmenopausal women (they are in the notes).
- Energy and macronutrients (separate ANSES opinions).
- Manganese (no ANSES value).
- Known source typo: annex B1 RNP for 8-year-old boys (0,38). Not affected, since per-MJ values are stored.
