import { pgTable, uuid, text, timestamp, integer, real, jsonb, index, uniqueIndex, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * External Data Sources Schema
 * Staging tables for FooDB, Dr. Duke's, and Phenol-Explorer data
 * Used by the compound data pipeline for enriching foods
 */

// =============================================================================
// ENUMS
// =============================================================================

export const externalSourceEnum = pgEnum('external_source', [
  'foodb',
  'duke',
  'phenol_explorer',
  'usda',
  'cnf',
]);

export const matchStatusEnum = pgEnum('match_status', [
  'pending',      // Not yet matched
  'auto_matched', // Matched by algorithm
  'ai_matched',   // Matched by AI fuzzy matching
  'verified',     // Human verified
  'no_match',     // Confirmed no match exists
]);

// =============================================================================
// FOODB STAGING TABLES
// =============================================================================

/**
 * FooDB Compounds - 85k+ compounds from FooDB
 */
export const foodbCompounds = pgTable('source_foodb_compounds', {
  id: uuid('id').primaryKey().defaultRandom(),
  foodbId: integer('foodb_id').notNull().unique(),
  publicId: text('public_id'),
  name: text('name').notNull(),
  casNumber: text('cas_number'),
  moldbInchikey: text('moldb_inchikey'),
  moldbSmiles: text('moldb_smiles'),
  kingdom: text('kingdom'),
  superclass: text('superclass'),
  klass: text('klass'),
  subclass: text('subclass'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  nameIdx: index('idx_foodb_compounds_name').on(table.name),
  casIdx: index('idx_foodb_compounds_cas').on(table.casNumber).where(sql`${table.casNumber} IS NOT NULL`),
  inchikeyIdx: index('idx_foodb_compounds_inchikey').on(table.moldbInchikey).where(sql`${table.moldbInchikey} IS NOT NULL`),
  // Trigram index for fuzzy matching
  nameTrgmIdx: index('idx_foodb_compounds_name_trgm').using('gin', sql`${table.name} gin_trgm_ops`),
}));

/**
 * FooDB Foods - 1.3k+ foods from FooDB
 */
export const foodbFoods = pgTable('source_foodb_foods', {
  id: uuid('id').primaryKey().defaultRandom(),
  foodbId: integer('foodb_id').notNull().unique(),
  name: text('name').notNull(),
  nameScientific: text('name_scientific'),
  description: text('description'),
  foodGroup: text('food_group'),
  foodSubgroup: text('food_subgroup'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  nameIdx: index('idx_foodb_foods_name').on(table.name),
  nameTrgmIdx: index('idx_foodb_foods_name_trgm').using('gin', sql`${table.name} gin_trgm_ops`),
  groupIdx: index('idx_foodb_foods_group').on(table.foodGroup),
}));

/**
 * FooDB Content - 5M+ food-compound content values
 */
export const foodbContent = pgTable('source_foodb_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  foodbId: integer('foodb_id').notNull(),
  foodbFoodId: integer('foodb_food_id').notNull(),
  foodbCompoundId: integer('foodb_compound_id').notNull(),
  sourceType: text('source_type'), // 'Nutrient', 'Compound', etc.
  origFoodName: text('orig_food_name'),
  origContent: real('orig_content'),
  origUnit: text('orig_unit'),
  standardContent: real('standard_content'), // Normalized to mg/100g
  preparationType: text('preparation_type'),
  citation: text('citation'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  foodIdx: index('idx_foodb_content_food').on(table.foodbFoodId),
  compoundIdx: index('idx_foodb_content_compound').on(table.foodbCompoundId),
  foodCompoundIdx: uniqueIndex('idx_foodb_content_food_compound').on(table.foodbFoodId, table.foodbCompoundId, table.preparationType),
}));

// =============================================================================
// DR. DUKE'S STAGING TABLES
// =============================================================================

/**
 * Duke Chemicals - 29k+ phytochemicals
 */
export const dukeChemicals = pgTable('source_duke_chemicals', {
  id: uuid('id').primaryKey().defaultRandom(),
  chemId: text('chem_id').notNull().unique(),
  name: text('name').notNull(),
  casNumber: text('cas_number'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  nameIdx: index('idx_duke_chemicals_name').on(table.name),
  casIdx: index('idx_duke_chemicals_cas').on(table.casNumber).where(sql`${table.casNumber} IS NOT NULL`),
  nameTrgmIdx: index('idx_duke_chemicals_name_trgm').using('gin', sql`${table.name} gin_trgm_ops`),
}));

/**
 * Duke Plants - 2.3k+ plants with taxonomy
 */
export const dukePlants = pgTable('source_duke_plants', {
  id: uuid('id').primaryKey().defaultRandom(),
  fnfNum: text('fnf_num').notNull().unique(),
  latinName: text('latin_name').notNull(),
  commonName: text('common_name'),
  family: text('family'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  latinIdx: index('idx_duke_plants_latin').on(table.latinName),
  commonIdx: index('idx_duke_plants_common').on(table.commonName).where(sql`${table.commonName} IS NOT NULL`),
  latinTrgmIdx: index('idx_duke_plants_latin_trgm').using('gin', sql`${table.latinName} gin_trgm_ops`),
}));

/**
 * Duke Farmacy - 104k+ phytochemical content values
 */
export const dukeFarmacy = pgTable('source_duke_farmacy', {
  id: uuid('id').primaryKey().defaultRandom(),
  fnfNum: text('fnf_num').notNull(),
  chemId: text('chem_id').notNull(),
  plantPart: text('plant_part'),
  amountLow: real('amount_low'),
  amountHigh: real('amount_high'),
  unit: text('unit'),
  reference: text('reference'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  plantIdx: index('idx_duke_farmacy_plant').on(table.fnfNum),
  chemIdx: index('idx_duke_farmacy_chem').on(table.chemId),
  plantChemIdx: index('idx_duke_farmacy_plant_chem').on(table.fnfNum, table.chemId),
}));

// =============================================================================
// PHENOL-EXPLORER STAGING TABLES
// =============================================================================

/**
 * Phenol-Explorer Compounds - 500+ polyphenols
 */
export const phenolCompounds = pgTable('source_phenol_compounds', {
  id: uuid('id').primaryKey().defaultRandom(),
  phenolId: integer('phenol_id').notNull().unique(),
  name: text('name').notNull(),
  compoundClass: text('compound_class'),
  compoundSubclass: text('compound_subclass'),
  molecularWeight: real('molecular_weight'),
  casNumber: text('cas_number'),
  chebiId: text('chebi_id'),
  pubchemId: text('pubchem_id'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  nameIdx: index('idx_phenol_compounds_name').on(table.name),
  classIdx: index('idx_phenol_compounds_class').on(table.compoundClass),
  casIdx: index('idx_phenol_compounds_cas').on(table.casNumber).where(sql`${table.casNumber} IS NOT NULL`),
  nameTrgmIdx: index('idx_phenol_compounds_name_trgm').using('gin', sql`${table.name} gin_trgm_ops`),
}));

/**
 * Phenol-Explorer Foods - 450+ foods
 */
export const phenolFoods = pgTable('source_phenol_foods', {
  id: uuid('id').primaryKey().defaultRandom(),
  phenolId: integer('phenol_id').notNull().unique(),
  name: text('name').notNull(),
  foodGroup: text('food_group'),
  foodSubgroup: text('food_subgroup'),
  scientificName: text('scientific_name'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  nameIdx: index('idx_phenol_foods_name').on(table.name),
  groupIdx: index('idx_phenol_foods_group').on(table.foodGroup),
  nameTrgmIdx: index('idx_phenol_foods_name_trgm').using('gin', sql`${table.name} gin_trgm_ops`),
}));

/**
 * Phenol-Explorer Content - 35k+ polyphenol content values
 */
export const phenolContent = pgTable('source_phenol_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  phenolFoodId: integer('phenol_food_id').notNull(),
  phenolCompoundId: integer('phenol_compound_id').notNull(),
  contentMean: real('content_mean'), // mg/100g
  contentMin: real('content_min'),
  contentMax: real('content_max'),
  unit: text('unit'),
  publicationCount: integer('publication_count'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  foodIdx: index('idx_phenol_content_food').on(table.phenolFoodId),
  compoundIdx: index('idx_phenol_content_compound').on(table.phenolCompoundId),
  foodCompoundIdx: uniqueIndex('idx_phenol_content_food_compound').on(table.phenolFoodId, table.phenolCompoundId),
}));

// =============================================================================
// FOOD MAPPING TABLES
// =============================================================================

/**
 * External Food Mappings
 * Maps external source food IDs to internal Nutri food UUIDs
 */
export const externalFoodMappings = pgTable('external_food_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Internal Nutri food (nullable until matched)
  foodId: uuid('food_id'),
  // External source info
  externalSource: externalSourceEnum('external_source').notNull(),
  externalId: text('external_id').notNull(),
  externalName: text('external_name').notNull(),
  // Matching metadata
  matchStatus: matchStatusEnum('match_status').notNull().default('pending'),
  matchConfidence: real('match_confidence'),
  matchMethod: text('match_method'), // 'exact_name', 'usda_fdc_id', 'ai_semantic'
  matchedAt: timestamp('matched_at', { withTimezone: true }),
  verifiedBy: uuid('verified_by'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  // Audit
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  foodIdx: index('idx_ext_food_map_food').on(table.foodId).where(sql`${table.foodId} IS NOT NULL`),
  externalIdx: uniqueIndex('idx_ext_food_map_external').on(table.externalSource, table.externalId),
  statusIdx: index('idx_ext_food_map_status').on(table.matchStatus),
  nameTrgmIdx: index('idx_ext_food_map_name_trgm').using('gin', sql`${table.externalName} gin_trgm_ops`),
}));

// =============================================================================
// DATA IMPORT TRACKING
// =============================================================================

/**
 * External Data Import Log
 * Tracks import history for each source
 */
export const externalDataImports = pgTable('external_data_imports', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: externalSourceEnum('source').notNull(),
  importType: text('import_type').notNull(), // 'full', 'incremental'
  status: text('status').notNull(), // 'running', 'completed', 'failed'
  recordsProcessed: integer('records_processed').default(0),
  recordsImported: integer('records_imported').default(0),
  recordsSkipped: integer('records_skipped').default(0),
  recordsFailed: integer('records_failed').default(0),
  errorLog: jsonb('error_log'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  sourceIdx: index('idx_imports_source').on(table.source),
  statusIdx: index('idx_imports_status').on(table.status),
}));
