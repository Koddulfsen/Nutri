# Japan — Dietary Reference Intakes for Japanese (2025)

**Authority:** Ministry of Health, Labour and Welfare (MHLW). 日本人の食事摂取基準（2025年版）, in force
April 2025 – March 2030.
**Region code:** `JAPAN`. Extractor: `extract.ts` -> `values.json` -> `db/seed/dv/load-source.ts JAPAN`

## Documents
- `mhlw-dri-2025-report.pdf`: official report 「日本人の食事摂取基準（2025年版）」策定検討会報告書
  (https://www.mhlw.go.jp/content/10904750/001316585.pdf, 486 pages). Its text layer is unusable (font
  encoding), so tables were read from page renders.
- `source/2025/kenpakusha-dri-2025-summary.pdf`: publisher Kenpakusha's 12-page reprint of the same tables
  ("厚生労働省報告書より"), used for the first transcription (`transcription-draft.txt`).
- Every cell of the transcription was then checked against the official report (pages listed in extract.ts).
  No differences were found.

Mapping decisions are in the header of `extract.ts`.

## History
Until 2026-09-17 this source held the 2020 English edition (folder named `mhlw-2025` ahead of time).
MHLW has not published a 2025 English edition; the Japanese tables are the authoritative version.
