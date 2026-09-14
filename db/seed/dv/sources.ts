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
};
