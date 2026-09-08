import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * Biological Sex Enum
 */
export const biologicalSexEnum = pgEnum('biological_sex_enum', [
  'MALE',
  'FEMALE',
]);

/**
 * Standardized Age Groups
 * Union of all regional systems mapped to most granular common groupings
 */
export const ageGroupEnum = pgEnum('age_group_enum', [
  'INFANT_0_6M',
  'INFANT_7_12M',
  'CHILD_1_3Y',
  'CHILD_4_8Y',
  'CHILD_9_13Y',
  'TEEN_14_18Y',
  'ADULT_19_30Y',
  'ADULT_31_50Y',
  'ADULT_51_70Y',
  'ADULT_71_PLUS',
]);

/**
 * Life Stage Modifiers
 * Includes trimester- and lactation-period-specific values because sources like
 * NNR 2023 publish different RIs per pregnancy trimester and (for some nutrients)
 * per lactation period. Use the generic PREGNANT / LACTATING when the source
 * doesn't split.
 */
export const lifeStageEnum = pgEnum('life_stage_enum', [
  'NONE',
  'PREGNANT',
  'PREGNANT_T1',
  'PREGNANT_T2',
  'PREGNANT_T3',
  'LACTATING',
  'LACTATING_0_6M',
  'LACTATING_7_12M',
]);

/**
 * Activity Level
 * Used by sources that publish activity-specific values (Japan, Russia, India, ICMR, KDRI).
 * Null in reference rows = not specified by source (assume moderate).
 */
export const activityLevelEnum = pgEnum('activity_level_enum', [
  'SEDENTARY',
  'MODERATE',
  'ACTIVE',
  'VERY_ACTIVE',
]);

/**
 * Dietary Context
 * Used when a source publishes different reference values depending on dietary
 * pattern or absorption-modifying factor. Currently phytate intake tiers (for
 * zinc, iron absorption); extensible later for smoker status, heme vs non-heme
 * iron diets, vegan adjustments, etc.
 *
 * Null on a reference row = applies to everyone regardless of diet pattern.
 *
 * Phytate tiers (EFSA zinc):
 *   PHYTATE_LOW       300 mg/d  — refined grain omnivore
 *   PHYTATE_MED_LOW   600 mg/d  — standard Western mixed
 *   PHYTATE_MED_HIGH  900 mg/d  — mixed with whole grains
 *   PHYTATE_HIGH    1,200 mg/d  — vegetarian/vegan, legume-heavy
 */
export const dietaryContextEnum = pgEnum('dietary_context_enum', [
  'PHYTATE_LOW',
  'PHYTATE_MED_LOW',
  'PHYTATE_MED_HIGH',
  'PHYTATE_HIGH',
]);

/**
 * Regional Scientific Source Systems
 * Authorities that publish demographic-aware DRIs/DRVs.
 */
export const sourceRegionEnum = pgEnum('source_region_enum', [
  'USA_CANADA', // NIH/IOM DRIs
  'EU',         // EFSA PRIs
  'UK',         // SACN RNIs
  'JAPAN',      // MHLW DRIs
  'CHINA',      // CNS DRIs
  'AU_NZ',      // NHMRC NRVs
  'NORDIC',     // NNR 2023 (DK/FI/IS/NO/SE)
  'DACH',       // DGE/ÖGE/SGE (DE/AT/CH)
  'ITALY',      // SINU LARN V
  'INDIA',      // ICMR-NIN RDA
  'KOREA',      // KDRI
  'TAIWAN',     // HPA DRIs
  'RUSSIA',     // Rospotrebnadzor MR 2.3.1
  'WHO_FAO',    // WHO/FAO global reference
  'SINGAPORE',  // Singapore HPB RDAs
  'SPAIN',      // AESAN INR
]);

/**
 * Daily Value Type Classification
 */
export const dvTypeEnum = pgEnum('dv_type_enum', [
  'RDA',      // Recommended Dietary Allowance
  'AI',       // Adequate Intake
  'UL',       // Tolerable Upper Intake Level
  'EAR',      // Estimated Average Requirement
  'AMDR',     // Acceptable Macronutrient Distribution Range
  'CDRR',     // Chronic Disease Risk Reduction (US sodium 2019)
  'SDT',      // Suggested Dietary Target (Italy LARN)
  'NRV_R',    // Codex Nutrient Reference Value – Requirements
  'NRV_NCD',  // Codex NRV – Noncommunicable Disease
  'DV',       // FDA Daily Value
  'RI',       // EU/UK Reference Intake
]);

/**
 * Source Type
 * Split scientific DRIs (demographic-aware) from regulatory label values (flat).
 */
export const sourceTypeEnum = pgEnum('source_type_enum', [
  'SCIENTIFIC_DRI',
  'REGULATORY_LABEL',
]);

/**
 * User DV Source Preference
 * AVERAGE is the Nutri-default "aggregate" across all scientific sources.
 */
export const dvSourcePreferenceEnum = pgEnum('dv_source_preference_enum', [
  'AVERAGE',
  'USA_CANADA',
  'EU',
  'UK',
  'JAPAN',
  'CHINA',
  'AU_NZ',
  'NORDIC',
  'DACH',
  'ITALY',
  'INDIA',
  'KOREA',
  'TAIWAN',
  'RUSSIA',
  'WHO_FAO',
  'SINGAPORE',
  'SPAIN',
]);
