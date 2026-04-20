/**
 * USDA Nutrient to Internal Compound Mapping
 *
 * Purpose: Maps USDA nutrient IDs to internal compound identifiers
 * Pattern: Static mapping with unit conversion metadata
 * Source: USDA FoodData Central nutrient database
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 1450-1600 (Transformation Layer)
 */

/**
 * USDA Nutrient ID to Internal Compound Slug mapping
 *
 * Top 20 essential nutrients for Phase 2
 * Full mapping will be expanded in later phases
 *
 * USDA Nutrient Numbers: https://fdc.nal.usda.gov/nutrient-labels.html
 */
export const USDA_TO_COMPOUND_MAP: Record<string, string> = {
  // Macronutrients
  '1003': 'protein',         // Protein (g)
  '1004': 'total-fat',       // Total lipid (fat) (g)
  '1005': 'carbohydrates',   // Carbohydrate, by difference (g)
  '1008': 'calories',        // Energy (kcal)
  '1079': 'fiber',           // Fiber, total dietary (g)

  // Minerals
  '1087': 'calcium',         // Calcium, Ca (mg)
  '1089': 'iron',            // Iron, Fe (mg)
  '1092': 'zinc',            // Zinc, Zn (mg)
  '1093': 'selenium',        // Selenium, Se (μg)
  '1095': 'magnesium',       // Magnesium, Mg (mg)

  // Vitamins
  '1162': 'vitamin-c',       // Vitamin C, total ascorbic acid (mg)
  '1165': 'thiamin',         // Thiamin (Vitamin B1) (mg)
  '1166': 'riboflavin',      // Riboflavin (Vitamin B2) (mg)
  '1167': 'niacin',          // Niacin (Vitamin B3) (mg)
  '1175': 'vitamin-b6',      // Vitamin B-6 (mg)
  '1177': 'folate',          // Folate, total (μg)
  '1178': 'vitamin-b12',     // Vitamin B-12 (μg)
  '1106': 'vitamin-a',       // Vitamin A, RAE (μg)
  '1109': 'vitamin-e',       // Vitamin E (alpha-tocopherol) (mg)
  '1183': 'vitamin-k',       // Vitamin K (phylloquinone) (μg)
};

/**
 * Alternative nutrient names/IDs that should map to same compound
 * Used for handling variations in USDA data
 */
export const NUTRIENT_ALIASES: Record<string, string> = {
  // Folate variations
  '1186': 'folate',          // Folate, DFE (dietary folate equivalents)
  '1187': 'folate',          // Folic acid

  // Vitamin A variations
  '1105': 'vitamin-a',       // Carotene, beta
  '1108': 'vitamin-a',       // Vitamin A, IU

  // Energy variations
  '1062': 'calories',        // Energy (kJ) - will convert to kcal
};

/**
 * Unit conversion factors
 * Used when USDA units differ from our standard units
 */
export const UNIT_CONVERSIONS: Record<string, { from: string; to: string; factor: number }> = {
  '1008': { from: 'kJ', to: 'kcal', factor: 0.239 },  // kilojoules to kilocalories
  '1062': { from: 'kJ', to: 'kcal', factor: 0.239 },  // kilojoules to kilocalories
  '1108': { from: 'IU', to: 'μg', factor: 0.3 },      // IU to micrograms (Vitamin A)
};

/**
 * Get internal compound slug from USDA nutrient number
 *
 * @param usdaNutrientNumber - USDA nutrient ID (e.g., "1003")
 * @returns Internal compound slug or null if not mapped
 */
export function getCompoundSlug(usdaNutrientNumber: string): string | null {
  // Check primary mapping
  if (USDA_TO_COMPOUND_MAP[usdaNutrientNumber]) {
    return USDA_TO_COMPOUND_MAP[usdaNutrientNumber];
  }

  // Check aliases
  if (NUTRIENT_ALIASES[usdaNutrientNumber]) {
    return NUTRIENT_ALIASES[usdaNutrientNumber];
  }

  return null;
}

/**
 * Check if unit conversion is needed for a nutrient
 *
 * @param usdaNutrientNumber - USDA nutrient ID
 * @param unit - Unit from USDA data
 * @returns Conversion config or null if no conversion needed
 */
export function getUnitConversion(
  usdaNutrientNumber: string,
  unit: string
): { from: string; to: string; factor: number } | null {
  const conversion = UNIT_CONVERSIONS[usdaNutrientNumber];

  if (conversion && unit === conversion.from) {
    return conversion;
  }

  return null;
}

/**
 * List of all mapped USDA nutrient numbers
 * Used for filtering USDA API responses to only mapped nutrients
 */
export const MAPPED_NUTRIENT_NUMBERS = [
  ...Object.keys(USDA_TO_COMPOUND_MAP),
  ...Object.keys(NUTRIENT_ALIASES),
];
