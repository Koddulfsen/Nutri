/**
 * Database Schema Index
 * Exports all schemas and relations for Drizzle ORM
 *
 * CRITICAL: This file must export BOTH table schemas AND relations
 * for proper TypeScript type inference
 */

// ENUM types
export * from './enums';
export * from './multi_source_enums'; // Multi-source system enums
export * from './daily_values_enums'; // Daily value enums (must be before users)

// Phase 1: Foundation tables
export * from './compound_groups'; // Hierarchical compound organization
export * from './compounds';
export * from './research';
export * from './categories';
export * from './interactions';
export * from './validation';
export * from './users';
export * from './daily_values'; // Daily values tables (after users to avoid circular deps)
export * from './audit';
export * from './gdpr';

// Phase 2: Food & Meal Tracking tables
export * from './foods';
export * from './food_nutrient_values';
export * from './food_compound_flags'; // NEW: Risk flagging for safety compounds
export * from './food_versions';
export * from './meal_logs';
export * from './meal_items';
export * from './meal_tracking';

// Food Portions
export * from './food_portions'; // Standard portion definitions

// Food Components — recipe decomposition for composite foods
export * from './food_components';

// Multi-Source Food System tables
export * from './food_sources'; // API source mappings
export * from './merged_nutrients'; // Averaged nutrient values
export * from './nutrient_source_values'; // Individual source values
export * from './food_approvals'; // Approval workflow

// Compound Source Verifications
export * from './compound_source_verifications';
export * from './compound_food_sanity_checks';

// External Data Sources (compound pipeline)
export * from './external_sources';

// Staging Tables (imported source data)
export * from './source_afcd'; // Australian Food Composition Database
export * from './source_cofid'; // UK Composition of Foods Integrated Dataset
export * from './source_fineli'; // Finnish Fineli Food Composition Database
export * from './source_ciqual'; // French CIQUAL Food Composition Database
export * from './source_bls'; // German BLS (Bundeslebensmittelschlüssel)
export * from './source_frida'; // Danish FRIDA (Fødevaredatabanken)
export * from './source_nevo'; // Dutch NEVO (Nederlands Voedingsstoffenbestand)
export * from './source_matvaretabellen'; // Norwegian Matvaretabellen
export * from './source_foodfiles'; // New Zealand FOODfiles
export * from './source_mext'; // Japanese MEXT Food Composition
export * from './source_kfct'; // Korean KFCT Food Composition
export * from './source_indb'; // Indian INDB Nutrient Database
export * from './source_aseanfoods'; // ASEAN Food Composition Database
export * from './source_fdc'; // USDA FoodData Central (catalog only — data fetched via API)
export * from './source_cnf'; // Canadian Nutrient File (catalog only — data fetched via API)

// Symptom Tracking tables
export * from './symptoms';
export * from './waitlist';

// Relations (CRITICAL - prevents 100+ type errors)
export * from './relations';
export * from './rate_limits';
