import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * Compound Tier
 * Distinguishes curated Core compounds from auto-imported Advanced compounds
 */
export const compoundTierEnum = pgEnum('compound_tier_enum', [
  'core',      // Manually curated, ~195 compounds, shown by default
  'advanced',  // Auto-imported from FooDB/Duke/Phenol-Explorer, hidden by default
]);

/**
 * Compound Type Classification
 * 17 scientifically-organized chemical categories (updated 2025-11-16)
 * Total compounds: 330 (280 with precise values + 50 with risk flags)
 */
export const compoundTypeEnum = pgEnum('compound_type_enum', [
  'MACRONUTRIENT',           // Protein, Fat, Carbs, Energy, Water (6 compounds)
  'VITAMIN',
  'MINERAL',
  'AMINO_ACID',
  'NUCLEOTIDE',              // Purines, uric acid (5 compounds)
  'FATTY_ACID',
  'CARBOHYDRATE',
  'POLYPHENOL',
  'CAROTENOID',
  'ALKALOID',                // Caffeine, histamine, biogenic amines (12 compounds)
  'GLUCOSINOLATE',
  'TERPENOID',
  'STEROL',                  // Phytosterols, ergosterols, etc.
  'ORGANIC_ACID',            // Citric acid, malic acid, lactic acid, etc.
  'MYCOTOXIN',               // Aflatoxin, ochratoxin - safety tracking (10 compounds)
  'PESTICIDE_RESIDUE',       // Glyphosate, organophosphates - safety tracking (6 compounds)
  'PLASTICIZER',             // BPA, phthalates - endocrine disruptor tracking (7 compounds)
  'PROCESSING_COMPOUND',
  'SYNTHETIC_ADDITIVE',
  'ANTI_NUTRIENT',
]);

/**
 * Severity Level for Medication Interactions
 * 4-tier severity classification
 */
export const severityLevelEnum = pgEnum('severity_level_enum', [
  'LOW',
  'MODERATE',
  'HIGH',
  'SEVERE',
]);

/**
 * Evidence Quality Tiers
 * 4-tier evidence classification from RCT to theoretical
 */
export const evidenceLevelEnum = pgEnum('evidence_level_enum', [
  'TIER_1_RCT',              // Randomized controlled trials, meta-analyses
  'TIER_2_OBSERVATIONAL',     // Cohort studies, observational research
  'TIER_3_FDA_LABEL',         // FDA labels, industry standards
  'TIER_4_THEORETICAL',       // Theoretical estimates, expert opinion
]);

/**
 * Audit Action Types
 * 8 security event categories for HIPAA compliance
 */
export const auditActionEnum = pgEnum('audit_action_enum', [
  'LOGIN',
  'LOGOUT',
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'EXPORT',
  'CONSENT_CHANGE',
]);

/**
 * Risk Level for Safety Compounds
 * Used for mycotoxins, heavy metals, pesticides, plasticizers
 * 4-tier risk classification for flagging instead of precise values
 */
export const riskLevelEnum = pgEnum('risk_level_enum', [
  'MINIMAL',     // Rarely detected or trace amounts
  'LOW',         // Occasional detection, below concern thresholds
  'MODERATE',    // Frequent detection, monitor intake
  'HIGH',        // Common detection, significant health concern
]);
