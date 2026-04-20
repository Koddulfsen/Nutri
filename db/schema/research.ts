import { pgTable, uuid, integer, text, timestamp, index, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { compounds } from './compounds';

/**
 * Research Citations Table
 * PubMed E-utilities integration storing ~2,500 research citations
 * Growing to ~10K Year 3
 */
export const researchCitations = pgTable('research_citations', {
  id: uuid('id').primaryKey().defaultRandom(),
  pmid: integer('pmid').notNull().unique(),
  studyDesign: text('study_design').notNull(),
  sampleSize: integer('sample_size'),
  qualityScoreTotal: integer('quality_score_total').notNull(),
  year: integer('year').notNull(),
  authors: text('authors').notNull(),
  title: text('title').notNull(),
  journal: text('journal').notNull(),
  abstract: text('abstract'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pmidUnique: uniqueIndex('idx_research_citations_pmid').on(table.pmid),
  qualityIdx: index('idx_research_citations_quality').on(table.qualityScoreTotal.desc()),
  yearIdx: index('idx_research_citations_year').on(table.year.desc()),
  sampleSizeCheck: check('sample_size_check', sql`${table.sampleSize} >= 0 OR ${table.sampleSize} IS NULL`),
  qualityCheck: check('quality_check', sql`${table.qualityScoreTotal} BETWEEN 0 AND 18`),
  yearCheck: check('year_check', sql`${table.year} BETWEEN 1900 AND 2100`),
}));

/**
 * Compound Citations Table
 * Polymorphic junction table linking compounds to research citations
 * Many-to-many relationship with future extensibility
 */
export const compoundCitations = pgTable('compound_citations', {
  id: uuid('id').primaryKey().defaultRandom(),
  compoundId: uuid('compound_id').notNull().references(() => compounds.id, { onDelete: 'restrict' }),
  citationId: uuid('citation_id').notNull().references(() => researchCitations.id, { onDelete: 'restrict' }),
  citableType: text('citable_type').notNull(),
  citableId: uuid('citable_id').notNull(),
  context: text('context'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  compoundIdx: index('idx_compound_citations_compound').on(table.compoundId),
  citationIdx: index('idx_compound_citations_citation').on(table.citationId),
  polymorphicIdx: index('idx_compound_citations_polymorphic').on(table.citableType, table.citableId),
}));
