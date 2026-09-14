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
};
