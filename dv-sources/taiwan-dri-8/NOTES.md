# Taiwan DRIs, 8th edition

**Authority:** Health Promotion Administration (衛生福利部國民健康署), 國人膳食營養素參考攝取量及其說明
第八版 (announced 2022, book Dec 2023): `ntshb-backup.pdf`, 728 pages.
**Region code:** `TAIWAN`. Extractor: `extract.ts` -> `values.json` -> `db/seed/dv/load-source.ts TAIWAN`

Values come from the total table (PDF pp. 718-722) and UL table (p. 724). The text layer is scrambled,
so renders were read (`source/`). Vitamin B6 is missing from the total table and comes from the chapter
table on p. 330. Mapping decisions are in the header of `extract.ts`.

History: the April 2026 seed (1330 rows) was re-checked on 2026-09-16. It ignored the sex split at 4-9 y
(girls got boys' thiamin, riboflavin, niacin, potassium, energy, fibre), shifted merged UL cells by one
age band (vitamin A, B6, iron), built pregnancy magnesium on the men's value, stored lactation iron
without the printed +30, typed zinc AI as RDA and trans fat as a range, and had no B6 RDA.
