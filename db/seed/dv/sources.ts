/**
 * Registry of DV sources loaded from dv-sources/<slug>/values.json.
 * China (CNS 2023) has its own seed: db/seed/seed-china-cns-2023.ts.
 */
import type { SourceMeta } from '../../../lib/dv/source-values';

export const SOURCES: Record<string, SourceMeta> = {
  USA_CANADA: {
    region: 'USA_CANADA',
    slug: 'nih-dri',
    authorityName: 'NIH/NAM Dietary Reference Intakes (USA + Canada)',
    versionYear: 2019,
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK545442/',
    note: 'National Academies DRI summary tables (Appendix J of the 2019 Sodium and Potassium report), parsed from HTML snapshots in dv-sources/nih-dri/source/. EAR, RDA/AI (AI marked *), UL, AMDR, sodium CDRR. No EER (published as equations, not values). Protein EAR omitted: published per kg body weight.',
    retrievedDate: '2026-09-14',
  },
  EU: {
    region: 'EU',
    slug: 'efsa-drv',
    authorityName: 'EFSA Dietary Reference Values (NDA Panel) + Tolerable Upper Intake Levels',
    versionYear: 2017,
    url: 'https://www.efsa.europa.eu/sites/default/files/assets/DRV_Summary_tables_jan_17.pdf',
    note: 'EFSA DRV summary tables v4 (Sept 2017) and UL overview v11 (Aug 2025), transcribed cell by cell in dv-sources/efsa-drv/extract.ts. PRI stored as RDA, AR as EAR, energy AR as EER (MJ, by PAL). Thiamin and niacin stored per MJ. Protein (per kg), SFA/TFA (ALAP), EPA+DHA and safe levels of intake not stored.',
    retrievedDate: '2026-09-14',
  },
  JAPAN: {
    region: 'JAPAN',
    slug: 'mhlw-2025',
    authorityName: 'MHLW Dietary Reference Intakes for Japanese (2020)',
    versionYear: 2020,
    url: 'https://www.mhlw.go.jp/content/001151422.pdf',
    note: 'English edition, pages 10-44. Age rows parsed from a text snapshot (dv-sources/mhlw-2025/source/); pregnancy/lactation rows transcribed and stored as totals. DG mapped to AMDR (range/floor) or CDRR (ceiling); sodium DG converted from salt g with the table\'s 2.54 factor. Iron for women 10-64 y stored for menstruating women. Magnesium UL (350 mg/d adults) applies to non-food sources only.',
    retrievedDate: '2026-09-14',
  },
  AU_NZ: {
    region: 'AU_NZ',
    slug: 'nhmrc-nrv',
    authorityName: 'NHMRC / NZ MoH — Nutrient Reference Values for Australia and New Zealand',
    versionYear: 2006,
    url: 'https://www.nhmrc.gov.au/about-us/publications/nutrient-reference-values-australia-and-new-zealand-including-recommended-dietary-intakes',
    note: 'NRV 2006 with the 2017 fluoride and sodium updates. Summary Tables 1, 2, 4-9 and chronic-disease Tables 1 (SDT) and 2 (AMDR) transcribed in dv-sources/nhmrc-nrv/extract.ts. RDI stored as RDA. n-6/n-3 AIs are total (Omega-6/Omega-3); LC n-3 as Long Chain Omega-3. Adult EER not stored (depends on height and weight).',
    retrievedDate: '2026-09-14',
  },
  NORDIC: {
    region: 'NORDIC',
    slug: 'nnr-2023',
    authorityName: 'Nordic Nutrition Recommendations 2023',
    versionYear: 2023,
    url: 'https://pub.norden.org/nord2023-003',
    note: 'NNR2023 Tables 8, 10, 12-21 and Boxes 2-8 transcribed in dv-sources/nnr-2023/extract.ts; merged superscripts read from the rendered pages. RI stored as RDA, AR (incl. provisional, flagged) as EAR, intake ranges as AMDR, energy reference values as EER (MJ, PAL 1.4/1.6/1.8 for adults). Thiamin and niacin per MJ. Protein and infant energy (per kg) not stored.',
    retrievedDate: '2026-09-14',
  },
  SPAIN: {
    region: 'SPAIN',
    slug: 'aesan-2019',
    authorityName: 'AESAN — Ingestas Nutricionales de Referencia (Spain 2019)',
    versionYear: 2019,
    url: 'https://www.aesan.gob.es/AECOSAN/docs/documentos/seguridad_alimentaria/evaluacion_riesgos/informes_comite/INR.pdf',
    note: 'AESAN-2019-003 INR for vitamins and minerals (Tables 6a-7d), parsed from a text snapshot in dv-sources/aesan-2019/source/. Only the AESAN INR column is stored; FESNAD/EFSA comparison columns and the EFSA-derived Tables 1-5 are not. INR stored as RDA although it also covers AI-derived values.',
    retrievedDate: '2026-09-14',
  },
};
