/**
 * Data Validation Service
 * Validates food data before database insertion with comprehensive quality checks
 *
 * Reference: architecture.md lines 1348-1545 (Data Quality Validation)
 */

import { logger } from '@/lib/logging/pino-config';

export interface ValidationWarning {
  field: string;
  issue: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ValidationError {
  field: string;
  issue: string;
}

export interface ValidationResult {
  valid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
  quarantine: boolean;
  quarantineReason?: string;
}

interface NutrientData {
  nutrientNumber: string;
  name: string;
  value: number;
  unit: string;
  sampleSize?: number;
  dataYear?: number;
  cv?: number; // Coefficient of Variation (%)
}

interface FoodData {
  fdcId?: number;
  name?: string;
  description?: string;
  nutrients: NutrientData[];
}

/**
 * Nutrient value range definitions (per 100g)
 * Based on biological constraints and USDA data analysis
 */
const NUTRIENT_RANGES = {
  // Energy - calories can range from 0 (water) to ~900 (pure oil)
  '208': { min: 0, max: 10000, unit: 'kcal', name: 'Energy' },

  // Macronutrients (cannot exceed 100g per 100g)
  '203': { min: 0, max: 100, unit: 'g', name: 'Protein' },
  '205': { min: 0, max: 100, unit: 'g', name: 'Carbohydrates' },
  '204': { min: 0, max: 100, unit: 'g', name: 'Total Fat' },
  '269': { min: 0, max: 100, unit: 'g', name: 'Sugars' },
  '291': { min: 0, max: 100, unit: 'g', name: 'Fiber' },

  // Vitamins (typical ranges in mg or μg)
  '401': { min: 0, max: 50000, unit: 'μg', name: 'Vitamin C' }, // High in supplements
  '404': { min: 0, max: 100, unit: 'mg', name: 'Thiamin (B1)' },
  '405': { min: 0, max: 100, unit: 'mg', name: 'Riboflavin (B2)' },
  '406': { min: 0, max: 500, unit: 'mg', name: 'Niacin (B3)' },

  // Minerals (typical ranges)
  '301': { min: 0, max: 10000, unit: 'mg', name: 'Calcium' },
  '303': { min: 0, max: 1000, unit: 'mg', name: 'Iron' },
  '304': { min: 0, max: 5000, unit: 'mg', name: 'Magnesium' },
  '305': { min: 0, max: 10000, unit: 'mg', name: 'Phosphorus' },
  '306': { min: 0, max: 50000, unit: 'mg', name: 'Potassium' },
  '307': { min: 0, max: 50000, unit: 'mg', name: 'Sodium' },
} as const;

/**
 * Critical nutrients that MUST be present for food to be considered valid
 * At least 5 nutrients required for minimum compound coverage
 */
const BASIC_NUTRIENTS = ['208', '203', '205', '204']; // Energy, Protein, Carbs, Fat

/**
 * Data quality thresholds
 */
const QUALITY_THRESHOLDS = {
  minSampleSize: 10,
  oldDataYears: 5, // Data older than 5 years triggers warning
  highCvPercent: 30, // CV > 30% triggers high severity warning
  minNutrientCoverage: 5, // Minimum number of nutrients required
};

/**
 * Validate food data before database insertion
 *
 * Checks:
 * 1. Required fields (name, fdc_id)
 * 2. Nutrient value ranges (0-100g for macros, etc.)
 * 3. Minimum compound coverage (at least 5 nutrients)
 * 4. Data quality warnings (low sample size, old data, high CV)
 *
 * @param data Food data to validate
 * @returns Validation result with errors, warnings, and quarantine recommendation
 */
export function validateFoodData(data: FoodData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let quarantine = false;
  let quarantineReason: string | undefined;

  logger.info({ fdcId: data.fdcId }, 'Validating food data');

  // 1. Required fields validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push({
      field: 'name',
      issue: 'Name is required and cannot be empty',
    });
  }

  if (!data.fdcId) {
    errors.push({
      field: 'fdcId',
      issue: 'FDC ID is required',
    });
  }

  // 2. Check minimum nutrient coverage
  const nutrientCount = data.nutrients?.length ?? 0;
  if (nutrientCount < QUALITY_THRESHOLDS.minNutrientCoverage) {
    errors.push({
      field: 'nutrients',
      issue: `Insufficient nutrient coverage: ${nutrientCount} nutrients (minimum ${QUALITY_THRESHOLDS.minNutrientCoverage} required)`,
    });
    quarantine = true;
    quarantineReason = `Only ${nutrientCount} nutrients found (minimum ${QUALITY_THRESHOLDS.minNutrientCoverage})`;
  }

  // 3. Check for basic nutrients (at least 3 of 4: Energy, Protein, Carbs, Fat)
  if (data.nutrients) {
    const foundBasicNutrients = data.nutrients.filter(n =>
      BASIC_NUTRIENTS.includes(n.nutrientNumber)
    );

    if (foundBasicNutrients.length < 3) {
      errors.push({
        field: 'nutrients',
        issue: `Missing basic nutrients: found ${foundBasicNutrients.length}/4 (Energy, Protein, Carbs, Fat)`,
      });
      quarantine = true;
      quarantineReason = quarantineReason
        ? `${quarantineReason}; Missing basic nutrients`
        : 'Missing basic macronutrient data';
    }
  }

  // 4. Validate each nutrient value range
  if (data.nutrients) {
    for (const nutrient of data.nutrients) {
      const range = NUTRIENT_RANGES[nutrient.nutrientNumber as keyof typeof NUTRIENT_RANGES];

      // Check if nutrient has range definition
      if (range) {
        // Check for negative values (impossible)
        if (nutrient.value < 0) {
          errors.push({
            field: `nutrient.${nutrient.nutrientNumber}`,
            issue: `${range.name} has negative value: ${nutrient.value}${range.unit}`,
          });
          quarantine = true;
          quarantineReason = quarantineReason
            ? `${quarantineReason}; Negative nutrient values`
            : 'Negative nutrient values detected';
        }

        // Check for values exceeding biological constraints
        if (nutrient.value > range.max) {
          warnings.push({
            field: `nutrient.${nutrient.nutrientNumber}`,
            issue: `${range.name} exceeds maximum: ${nutrient.value}${range.unit} > ${range.max}${range.unit}`,
            severity: 'HIGH',
          });

          // Extreme outliers should be quarantined
          if (nutrient.value > range.max * 2) {
            quarantine = true;
            quarantineReason = quarantineReason
              ? `${quarantineReason}; Extreme outlier values`
              : 'Nutrient values exceed biological constraints';
          }
        }
      }

      // 5. Data quality warnings - Sample size
      if (nutrient.sampleSize !== undefined && nutrient.sampleSize < QUALITY_THRESHOLDS.minSampleSize) {
        warnings.push({
          field: `nutrient.${nutrient.nutrientNumber}`,
          issue: `${nutrient.name} has low sample size: ${nutrient.sampleSize} (recommended ≥${QUALITY_THRESHOLDS.minSampleSize})`,
          severity: 'MEDIUM',
        });
      }

      // 6. Data quality warnings - Old data
      if (nutrient.dataYear !== undefined) {
        const currentYear = new Date().getFullYear();
        const dataAge = currentYear - nutrient.dataYear;

        if (dataAge > QUALITY_THRESHOLDS.oldDataYears) {
          warnings.push({
            field: `nutrient.${nutrient.nutrientNumber}`,
            issue: `${nutrient.name} data is ${dataAge} years old (from ${nutrient.dataYear})`,
            severity: 'LOW',
          });
        }
      }

      // 7. Data quality warnings - High coefficient of variation
      if (nutrient.cv !== undefined && nutrient.cv > QUALITY_THRESHOLDS.highCvPercent) {
        warnings.push({
          field: `nutrient.${nutrient.nutrientNumber}`,
          issue: `${nutrient.name} has high variability: CV ${nutrient.cv}% (threshold ${QUALITY_THRESHOLDS.highCvPercent}%)`,
          severity: 'HIGH',
        });

        // Very high CV should trigger quarantine for manual review
        if (nutrient.cv > 50) {
          quarantine = true;
          quarantineReason = quarantineReason
            ? `${quarantineReason}; High data variability (CV >${QUALITY_THRESHOLDS.highCvPercent}%)`
            : `High coefficient of variation (CV ${nutrient.cv}%)`;
        }
      }
    }
  }

  // 8. Calorie sum validation (macros should roughly equal calories)
  if (data.nutrients) {
    const calories = data.nutrients.find(n => n.nutrientNumber === '208')?.value ?? 0;
    const protein = data.nutrients.find(n => n.nutrientNumber === '203')?.value ?? 0;
    const carbs = data.nutrients.find(n => n.nutrientNumber === '205')?.value ?? 0;
    const fat = data.nutrients.find(n => n.nutrientNumber === '204')?.value ?? 0;

    // Calculate expected calories from macros (Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g)
    const expectedCalories = (protein * 4) + (carbs * 4) + (fat * 9);

    if (calories > 0 && expectedCalories > 0) {
      const variance = Math.abs(calories - expectedCalories) / calories;

      // Allow 20% variance (alcohol, fiber, rounding errors)
      if (variance > 0.2) {
        warnings.push({
          field: 'calories',
          issue: `Calorie mismatch: ${calories} kcal reported, ~${expectedCalories.toFixed(0)} kcal expected from macros (${(variance * 100).toFixed(1)}% variance)`,
          severity: variance > 0.5 ? 'HIGH' : 'MEDIUM',
        });
      }
    }
  }

  const valid = errors.length === 0;

  logger.info({
    fdcId: data.fdcId,
    valid,
    errorCount: errors.length,
    warningCount: warnings.length,
    quarantine,
  }, 'Food data validation complete');

  return {
    valid,
    warnings,
    errors,
    quarantine,
    quarantineReason,
  };
}

/**
 * Validate batch of foods
 * Returns map of fdcId → ValidationResult
 */
export function validateFoodBatch(foods: FoodData[]): Map<number, ValidationResult> {
  const results = new Map<number, ValidationResult>();

  logger.info({ count: foods.length }, 'Validating batch of foods');

  for (const food of foods) {
    if (food.fdcId) {
      const result = validateFoodData(food);
      results.set(food.fdcId, result);
    }
  }

  const invalidCount = Array.from(results.values()).filter(r => !r.valid).length;
  const quarantineCount = Array.from(results.values()).filter(r => r.quarantine).length;

  logger.info({
    total: foods.length,
    invalid: invalidCount,
    quarantine: quarantineCount,
  }, 'Batch validation complete');

  return results;
}
