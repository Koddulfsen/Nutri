import { relations } from 'drizzle-orm';
import { compounds, compoundSources } from './compounds';
import { compoundSourceVerifications } from './compound_source_verifications';
import { compoundGroups } from './compound_groups';
import { researchCitations, compoundCitations } from './research';
import { foodCategories } from './categories';
import { medicationInteractions } from './interactions';
import { compoundValidationRanges } from './validation';
import { userProfiles, apiKeys, userConsent } from './users';
import { auditLog } from './audit';
import { foods } from './foods';
import { foodPortions } from './food_portions';
import { foodNutrientValues } from './food_nutrient_values';
import { foodCompoundValueVersions } from './food_versions';
import { mealLogs } from './meal_logs';
import { mealItems } from './meal_items';
import { favoriteFoods, savedMealTemplates, dailyTotals, cookingContexts, quarantineImports, manualReviewQueue, agUiLogs } from './meal_tracking';
import { referenceDailyValues, userCustomDailyValues } from './daily_values';

/**
 * CRITICAL FILE: Defines all foreign key relationships for Drizzle ORM
 * Prevents 100+ type errors by establishing proper type inference
 *
 * Pattern: Use relations() helper to define one-to-many and many-to-one relationships
 */

// ============================================================================
// COMPOUND RELATIONS
// ============================================================================

/**
 * Compounds Relations
 * - Self-referential: parent/child compounds (hierarchical)
 * - One-to-many: sources, citations, interactions, validation ranges
 */
export const compoundsRelations = relations(compounds, ({ one, many }) => ({
  // Self-referential parent relationship
  parentCompound: one(compounds, {
    fields: [compounds.parentCompoundId],
    references: [compounds.id],
    relationName: 'parent_compound',
  }),
  // Self-referential child relationships
  childCompounds: many(compounds, { relationName: 'parent_compound' }),

  // One-to-many relationships
  sources: many(compoundSources),
  citations: many(compoundCitations),
  medicationInteractions: many(medicationInteractions),

  // One-to-one relationship
  validationRange: one(compoundValidationRanges, {
    fields: [compounds.id],
    references: [compoundValidationRanges.compoundId],
  }),
}));

/**
 * Compound Sources Relations
 * - Many-to-one: compound
 */
export const compoundSourcesRelations = relations(compoundSources, ({ one }) => ({
  compound: one(compounds, {
    fields: [compoundSources.compoundId],
    references: [compounds.id],
  }),
  verification: one(compoundSourceVerifications, {
    fields: [compoundSources.id],
    references: [compoundSourceVerifications.compoundSourceId],
  }),
}));

export const compoundSourceVerificationsRelations = relations(compoundSourceVerifications, ({ one }) => ({
  compoundSource: one(compoundSources, {
    fields: [compoundSourceVerifications.compoundSourceId],
    references: [compoundSources.id],
  }),
}));

// ============================================================================
// RESEARCH RELATIONS
// ============================================================================

/**
 * Research Citations Relations
 * - One-to-many: compound citations
 */
export const researchCitationsRelations = relations(researchCitations, ({ many }) => ({
  compoundCitations: many(compoundCitations),
}));

/**
 * Compound Citations Relations (Junction Table)
 * - Many-to-one: compound, citation
 */
export const compoundCitationsRelations = relations(compoundCitations, ({ one }) => ({
  compound: one(compounds, {
    fields: [compoundCitations.compoundId],
    references: [compounds.id],
  }),
  citation: one(researchCitations, {
    fields: [compoundCitations.citationId],
    references: [researchCitations.id],
  }),
}));

// ============================================================================
// CATEGORY RELATIONS
// ============================================================================

/**
 * Food Categories Relations
 * - Self-referential: parent/child categories (5-level hierarchy)
 */
export const foodCategoriesRelations = relations(foodCategories, ({ one, many }) => ({
  // Self-referential parent relationship
  parentCategory: one(foodCategories, {
    fields: [foodCategories.parentCategoryId],
    references: [foodCategories.id],
    relationName: 'parent_category',
  }),
  // Self-referential child relationships
  childCategories: many(foodCategories, { relationName: 'parent_category' }),
}));

// ============================================================================
// INTERACTION RELATIONS
// ============================================================================

/**
 * Medication Interactions Relations
 * - Many-to-one: compound
 */
export const medicationInteractionsRelations = relations(medicationInteractions, ({ one }) => ({
  compound: one(compounds, {
    fields: [medicationInteractions.compoundId],
    references: [compounds.id],
  }),
}));

// ============================================================================
// VALIDATION RELATIONS
// ============================================================================

/**
 * Compound Validation Ranges Relations
 * - One-to-one: compound
 */
export const compoundValidationRangesRelations = relations(compoundValidationRanges, ({ one }) => ({
  compound: one(compounds, {
    fields: [compoundValidationRanges.compoundId],
    references: [compounds.id],
  }),
}));

// ============================================================================
// USER RELATIONS
// ============================================================================

/**
 * User Profiles Relations
 * - One-to-many: API keys, audit logs
 * - One-to-one: consent
 *
 * Note: user_id references Supabase auth.users table, but we don't define
 * that relation here as it's managed by Supabase
 */
export const userProfilesRelations = relations(userProfiles, ({ one, many }) => ({
  apiKeys: many(apiKeys),
  auditLogs: many(auditLog),
  consent: one(userConsent, {
    fields: [userProfiles.userId],
    references: [userConsent.userId],
  }),
}));

/**
 * API Keys Relations
 * - Many-to-one: user profile
 */
export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [apiKeys.userId],
    references: [userProfiles.userId],
  }),
}));

/**
 * User Consent Relations
 * - One-to-one: user profile
 */
export const userConsentRelations = relations(userConsent, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [userConsent.userId],
    references: [userProfiles.userId],
  }),
}));

// ============================================================================
// AUDIT RELATIONS
// ============================================================================

/**
 * Audit Log Relations
 * - Many-to-one: user profile (nullable - preserved after user deletion)
 */
export const auditLogRelations = relations(auditLog, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [auditLog.userId],
    references: [userProfiles.userId],
  }),
}));

// ============================================================================
// PHASE 2: FOOD & MEAL TRACKING RELATIONS
// ============================================================================

/**
 * Foods Relations
 * - Many-to-one: food category
 * - One-to-many: nutrient values, versions, meal items, favorites
 */
export const foodsRelations = relations(foods, ({ one, many }) => ({
  category: one(foodCategories, {
    fields: [foods.foodCategoryId],
    references: [foodCategories.id],
  }),
  nutrientValues: many(foodNutrientValues),
  versions: many(foodCompoundValueVersions),
  mealItems: many(mealItems),
  favorites: many(favoriteFoods),
  quarantines: many(quarantineImports),
  portions: many(foodPortions),
}));

/**
 * Food Portions Relations
 * - Many-to-one: food
 */
export const foodPortionsRelations = relations(foodPortions, ({ one }) => ({
  food: one(foods, {
    fields: [foodPortions.foodId],
    references: [foods.id],
  }),
}));

/**
 * Food Nutrient Values Relations
 * - Many-to-one: food, compound
 */
export const foodNutrientValuesRelations = relations(foodNutrientValues, ({ one }) => ({
  food: one(foods, {
    fields: [foodNutrientValues.foodId],
    references: [foods.id],
  }),
  compound: one(compounds, {
    fields: [foodNutrientValues.compoundId],
    references: [compounds.id],
  }),
}));

/**
 * Food Compound Value Versions Relations
 * - Many-to-one: food, compound, user (who changed it)
 */
export const foodCompoundValueVersionsRelations = relations(foodCompoundValueVersions, ({ one }) => ({
  food: one(foods, {
    fields: [foodCompoundValueVersions.foodId],
    references: [foods.id],
  }),
  compound: one(compounds, {
    fields: [foodCompoundValueVersions.compoundId],
    references: [compounds.id],
  }),
  changedBy: one(userProfiles, {
    fields: [foodCompoundValueVersions.changedBy],
    references: [userProfiles.userId],
  }),
}));

/**
 * Meal Logs Relations
 * - Many-to-one: user
 * - One-to-many: meal items
 */
export const mealLogsRelations = relations(mealLogs, ({ one, many }) => ({
  user: one(userProfiles, {
    fields: [mealLogs.userId],
    references: [userProfiles.userId],
  }),
  items: many(mealItems),
}));

/**
 * Meal Items Relations
 * - Many-to-one: meal log, food, cooking context
 */
export const mealItemsRelations = relations(mealItems, ({ one }) => ({
  mealLog: one(mealLogs, {
    fields: [mealItems.mealLogId],
    references: [mealLogs.id],
  }),
  food: one(foods, {
    fields: [mealItems.foodId],
    references: [foods.id],
  }),
  context: one(cookingContexts, {
    fields: [mealItems.contextId],
    references: [cookingContexts.id],
  }),
}));

/**
 * Favorite Foods Relations
 * - Many-to-one: user, food
 */
export const favoriteFoodsRelations = relations(favoriteFoods, ({ one }) => ({
  user: one(userProfiles, {
    fields: [favoriteFoods.userId],
    references: [userProfiles.userId],
  }),
  food: one(foods, {
    fields: [favoriteFoods.foodId],
    references: [foods.id],
  }),
}));

/**
 * Saved Meal Templates Relations
 * - Many-to-one: user
 */
export const savedMealTemplatesRelations = relations(savedMealTemplates, ({ one }) => ({
  user: one(userProfiles, {
    fields: [savedMealTemplates.userId],
    references: [userProfiles.userId],
  }),
}));

/**
 * Daily Totals Relations
 * - Many-to-one: user
 */
export const dailyTotalsRelations = relations(dailyTotals, ({ one }) => ({
  user: one(userProfiles, {
    fields: [dailyTotals.userId],
    references: [userProfiles.userId],
  }),
}));

/**
 * Cooking Contexts Relations
 * - One-to-many: meal items
 */
export const cookingContextsRelations = relations(cookingContexts, ({ many }) => ({
  mealItems: many(mealItems),
}));

/**
 * Quarantine Imports Relations
 * - Many-to-one: food (nullable), reviewer
 */
export const quarantineImportsRelations = relations(quarantineImports, ({ one }) => ({
  food: one(foods, {
    fields: [quarantineImports.foodId],
    references: [foods.id],
  }),
  reviewer: one(userProfiles, {
    fields: [quarantineImports.reviewerId],
    references: [userProfiles.userId],
  }),
}));

/**
 * Manual Review Queue Relations
 * - Many-to-one: assigned user
 */
export const manualReviewQueueRelations = relations(manualReviewQueue, ({ one }) => ({
  assignedUser: one(userProfiles, {
    fields: [manualReviewQueue.assignedTo],
    references: [userProfiles.userId],
  }),
}));

/**
 * AG UI Logs Relations
 * - Many-to-one: user
 */
export const agUiLogsRelations = relations(agUiLogs, ({ one }) => ({
  user: one(userProfiles, {
    fields: [agUiLogs.userId],
    references: [userProfiles.userId],
  }),
}));

// Update user profiles relations to include Phase 2 and Daily Values
export const userProfilesRelationsUpdated = relations(userProfiles, ({ one, many }) => ({
  apiKeys: many(apiKeys),
  auditLogs: many(auditLog),
  consent: one(userConsent, {
    fields: [userProfiles.userId],
    references: [userConsent.userId],
  }),
  // Phase 2 additions
  mealLogs: many(mealLogs),
  favoriteFoods: many(favoriteFoods),
  savedTemplates: many(savedMealTemplates),
  dailyTotals: many(dailyTotals),
  foodVersions: many(foodCompoundValueVersions),
  quarantineReviews: many(quarantineImports),
  assignedReviews: many(manualReviewQueue),
  agUiLogs: many(agUiLogs),
  // Daily Values additions
  customDailyValues: many(userCustomDailyValues),
}));

// Update food categories relations to include Phase 2
export const foodCategoriesRelationsUpdated = relations(foodCategories, ({ one, many }) => ({
  // Self-referential parent relationship
  parentCategory: one(foodCategories, {
    fields: [foodCategories.parentCategoryId],
    references: [foodCategories.id],
    relationName: 'parent_category',
  }),
  // Self-referential child relationships
  childCategories: many(foodCategories, { relationName: 'parent_category' }),
  // Phase 2 additions
  foods: many(foods),
}));

// Update compounds relations to include Phase 2 and Daily Values
export const compoundsRelationsUpdated = relations(compounds, ({ one, many }) => ({
  // Self-referential parent relationship
  parentCompound: one(compounds, {
    fields: [compounds.parentCompoundId],
    references: [compounds.id],
    relationName: 'parent_compound',
  }),
  // Self-referential child relationships
  childCompounds: many(compounds, { relationName: 'parent_compound' }),

  // One-to-many relationships
  sources: many(compoundSources),
  citations: many(compoundCitations),
  medicationInteractions: many(medicationInteractions),

  // One-to-one relationship
  validationRange: one(compoundValidationRanges, {
    fields: [compounds.id],
    references: [compoundValidationRanges.compoundId],
  }),
  // Phase 2 additions
  nutrientValues: many(foodNutrientValues),
  valueVersions: many(foodCompoundValueVersions),
  // Daily Values additions
  referenceDailyValues: many(referenceDailyValues),
  customDailyValues: many(userCustomDailyValues),
}));

// ============================================================================
// DAILY VALUES RELATIONS
// ============================================================================

/**
 * Reference Daily Values Relations
 * - Many-to-one: compound
 */
export const referenceDailyValuesRelations = relations(referenceDailyValues, ({ one }) => ({
  compound: one(compounds, {
    fields: [referenceDailyValues.compoundId],
    references: [compounds.id],
  }),
}));

/**
 * User Custom Daily Values Relations
 * - Many-to-one: user, compound
 */
export const userCustomDailyValuesRelations = relations(userCustomDailyValues, ({ one }) => ({
  user: one(userProfiles, {
    fields: [userCustomDailyValues.userId],
    references: [userProfiles.userId],
  }),
  compound: one(compounds, {
    fields: [userCustomDailyValues.compoundId],
    references: [compounds.id],
  }),
}));

/**
 * Compound Groups Relations
 * - Self-referential: parent/child groups (hierarchical)
 * - One-to-many: compounds
 */
export const compoundGroupsRelations = relations(compoundGroups, ({ one, many }) => ({
  // Self-referential parent relationship
  parentGroup: one(compoundGroups, {
    fields: [compoundGroups.parentGroupId],
    references: [compoundGroups.id],
    relationName: 'parent_group',
  }),
  // Self-referential child relationships
  childGroups: many(compoundGroups, { relationName: 'parent_group' }),
  // One-to-many: compounds in this group
  compounds: many(compounds),
}));

// ============================================================================
// SYMPTOM TRACKING RELATIONS
// ============================================================================

import { symptomDefinitions, symptomLogs } from './symptoms';

/**
 * Symptom Definitions Relations
 * - Many-to-one: user (for custom symptoms, null for system-defined)
 * - One-to-many: symptom logs
 */
export const symptomDefinitionsRelations = relations(symptomDefinitions, ({ one, many }) => ({
  user: one(userProfiles, {
    fields: [symptomDefinitions.userId],
    references: [userProfiles.userId],
  }),
  logs: many(symptomLogs),
}));

/**
 * Symptom Logs Relations
 * - Many-to-one: user, symptom definition
 */
export const symptomLogsRelations = relations(symptomLogs, ({ one }) => ({
  user: one(userProfiles, {
    fields: [symptomLogs.userId],
    references: [userProfiles.userId],
  }),
  symptomDefinition: one(symptomDefinitions, {
    fields: [symptomLogs.symptomDefinitionId],
    references: [symptomDefinitions.id],
  }),
}));
