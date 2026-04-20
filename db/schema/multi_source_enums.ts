import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * API Source Types
 * External nutrition APIs integrated with Nutri platform
 */
export const apiSourceEnum = pgEnum('api_source_enum', [
  'CNF',           // Canadian Nutrient File
  'FDC',           // USDA FoodData Central
  'FOODB',         // FooDB (phytochemicals)
  'PHENOL',        // Phenol-Explorer (polyphenols)
  'DUKE',          // Dr. Duke's Phytochemical Database
  'AFCD',          // Australian Food Composition Database
  'UK_COFID',      // UK Composition of Foods Integrated Dataset
  'FINELI',        // Finnish Fineli Food Composition Database
  'CIQUAL',        // French CIQUAL Food Composition Database
  'BLS',           // German BLS (Bundeslebensmittelschlüssel)
  'FRIDA',         // Danish FRIDA (Fødevaredatabanken)
  'NEVO',          // Dutch NEVO (Nederlands Voedingsstoffenbestand)
  'MATVARETABELLEN', // Norwegian Matvaretabellen
  'FOODFILES',     // New Zealand FOODfiles
  'MEXT',          // Japanese MEXT Food Composition
  'KFCT',          // Korean KFCT Food Composition (9th Revision)
  'INDB',          // Indian Nutrient Database (INDB)
  'ASEANFOODS',    // ASEAN Food Composition Database
  'NUTRITIONIX',   // Nutritionix (future)
]);

/**
 * Food Approval Status
 * Workflow for community-added foods
 */
/**
 * Food Origin Type
 * Classifies the nutritional origin of a food
 */
export const originTypeEnum = pgEnum('origin_type_enum', [
  'animal',
  'plant',
  'fungi',
  'composite',
  'supplement',
  'other',
]);

/**
 * Food Approval Status
 * Workflow for community-added foods
 */
export const approvalStatusEnum = pgEnum('approval_status_enum', [
  'PENDING',       // Awaiting admin review
  'APPROVED',      // Approved by admin
  'REJECTED',      // Rejected by admin
  'AUTO_APPROVED', // Added by authenticated user (auto-approved)
]);
