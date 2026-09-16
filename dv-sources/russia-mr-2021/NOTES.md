# Russia — MR 2.3.1.0253-21

**Authority:** Rospotrebnadzor. Methodological recommendations MR 2.3.1.0253-21 "Нормы физиологических
потребностей в энергии и пищевых веществах для различных групп населения Российской Федерации",
approved 22 July 2021 (replaces MR 2.3.1.2432-08).
**Source:** official text as published by Garant (https://www.garant.ru/products/ipo/prime/doc/402716140/),
snapshot in `source/`, with the table pictures (vitamin subscripts, Greek letters, ≥65) in `source/img/`.
**Region code:** `RUSSIA`. Extractor: `extract.ts` -> `values.json` -> `db/seed/dv/load-source.ts RUSSIA`

Mapping decisions and what is not stored are in the header of `extract.ts`.

History: the April 2026 seed (936 rows) came from a third-party article, with invented midpoints for
ranges and guessed sex splits. Checked against the official tables on 2026-09-16, 225 of its values that
could be matched by key were wrong, most of them for children (e.g. infant fluoride 1.2 mg vs 0.4 mg,
magnesium 1-2 y 150 mg vs 80 mg), and its child age bands did not match the document's.
