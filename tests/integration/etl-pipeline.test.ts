/**
 * ETL Pipeline Integration Tests
 * Tests complete flow: USDA API → Transform → Validate → Database
 *
 * Reference: architecture.md lines 3050-3150 (Testing Strategy)
 * Framework: Vitest
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { validateFoodData } from '@/lib/validation/data-validator';
import { addToQuarantine, getQuarantineMetrics } from '@/lib/validation/quarantine-service';

/**
 * Mock USDA API response structure
 * Based on real USDA FoodData Central API responses
 */
const mockUSDAFoodResponse = {
  fdcId: 171705,
  description: 'Chicken, broilers or fryers, breast, meat only, cooked, roasted',
  dataType: 'SR Legacy',
  foodNutrients: [
    {
      nutrient: { number: '208', name: 'Energy', unitName: 'kcal' },
      amount: 165,
    },
    {
      nutrient: { number: '203', name: 'Protein', unitName: 'g' },
      amount: 31.02,
    },
    {
      nutrient: { number: '205', name: 'Carbohydrate, by difference', unitName: 'g' },
      amount: 0,
    },
    {
      nutrient: { number: '204', name: 'Total lipid (fat)', unitName: 'g' },
      amount: 3.57,
    },
    {
      nutrient: { number: '291', name: 'Fiber, total dietary', unitName: 'g' },
      amount: 0,
    },
    {
      nutrient: { number: '301', name: 'Calcium, Ca', unitName: 'mg' },
      amount: 15,
    },
    {
      nutrient: { number: '303', name: 'Iron, Fe', unitName: 'mg' },
      amount: 1.04,
    },
  ],
};

/**
 * Mock food data with missing nutrients (should fail validation)
 */
const mockIncompleteFoodData = {
  fdcId: 999999,
  name: 'Test Food - Incomplete',
  description: 'Food with insufficient nutrients',
  nutrients: [
    {
      nutrientNumber: '208',
      name: 'Energy',
      value: 100,
      unit: 'kcal',
    },
    // Missing protein, carbs, fat - should fail basic nutrients check
  ],
};

/**
 * Mock food data with invalid values (negative nutrients)
 */
const mockInvalidFoodData = {
  fdcId: 888888,
  name: 'Test Food - Invalid',
  description: 'Food with invalid nutrient values',
  nutrients: [
    {
      nutrientNumber: '208',
      name: 'Energy',
      value: 200,
      unit: 'kcal',
    },
    {
      nutrientNumber: '203',
      name: 'Protein',
      value: -5, // INVALID: Negative value
      unit: 'g',
    },
    {
      nutrientNumber: '205',
      name: 'Carbohydrates',
      value: 150, // INVALID: Exceeds 100g per 100g
      unit: 'g',
    },
    {
      nutrientNumber: '204',
      name: 'Fat',
      value: 10,
      unit: 'g',
    },
  ],
};

/**
 * Mock food data with high CV (Coefficient of Variation)
 */
const mockHighCVFoodData = {
  fdcId: 777777,
  name: 'Test Food - High Variance',
  description: 'Food with high data variability',
  nutrients: [
    {
      nutrientNumber: '208',
      name: 'Energy',
      value: 250,
      unit: 'kcal',
    },
    {
      nutrientNumber: '203',
      name: 'Protein',
      value: 20,
      unit: 'g',
      cv: 55, // HIGH: CV > 30% threshold
    },
    {
      nutrientNumber: '205',
      name: 'Carbohydrates',
      value: 30,
      unit: 'g',
    },
    {
      nutrientNumber: '204',
      name: 'Fat',
      value: 5,
      unit: 'g',
    },
    {
      nutrientNumber: '301',
      name: 'Calcium',
      value: 100,
      unit: 'mg',
    },
  ],
};

/**
 * Mock valid food data with all required fields
 */
const mockValidFoodData = {
  fdcId: 171705,
  name: 'Chicken, broilers or fryers, breast, meat only, cooked, roasted',
  description: 'Chicken breast, roasted',
  nutrients: [
    {
      nutrientNumber: '208',
      name: 'Energy',
      value: 165,
      unit: 'kcal',
      sampleSize: 25,
      dataYear: 2022,
      cv: 8.5,
    },
    {
      nutrientNumber: '203',
      name: 'Protein',
      value: 31.02,
      unit: 'g',
      sampleSize: 25,
      dataYear: 2022,
      cv: 5.2,
    },
    {
      nutrientNumber: '205',
      name: 'Carbohydrates',
      value: 0,
      unit: 'g',
      sampleSize: 25,
      dataYear: 2022,
      cv: 0,
    },
    {
      nutrientNumber: '204',
      name: 'Fat',
      value: 3.57,
      unit: 'g',
      sampleSize: 25,
      dataYear: 2022,
      cv: 12.3,
    },
    {
      nutrientNumber: '291',
      name: 'Fiber',
      value: 0,
      unit: 'g',
      sampleSize: 25,
      dataYear: 2022,
      cv: 0,
    },
    {
      nutrientNumber: '301',
      name: 'Calcium',
      value: 15,
      unit: 'mg',
      sampleSize: 25,
      dataYear: 2022,
      cv: 15.8,
    },
  ],
};

describe('ETL Pipeline Integration Tests', () => {
  beforeAll(async () => {
    // Setup: Initialize test environment
    // Note: In real tests, you'd setup test database, mock Redis, etc.
  });

  afterAll(async () => {
    // Cleanup: Remove test data
  });

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe('Data Validation', () => {
    it('should validate complete food data successfully', () => {
      const result = validateFoodData(mockValidFoodData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.quarantine).toBe(false);
    });

    it('should detect missing required fields', () => {
      const foodWithoutName = {
        fdcId: 123,
        name: '', // Empty name
        nutrients: mockValidFoodData.nutrients,
      };

      const result = validateFoodData(foodWithoutName);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('should detect insufficient nutrient coverage', () => {
      const result = validateFoodData(mockIncompleteFoodData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.quarantine).toBe(true);
      expect(result.quarantineReason).toContain('nutrients');
    });

    it('should detect missing basic nutrients (macros)', () => {
      const result = validateFoodData(mockIncompleteFoodData);

      expect(result.valid).toBe(false);
      const hasBasicNutrientError = result.errors.some(
        e => e.field === 'nutrients' && e.issue.includes('basic nutrients')
      );
      expect(hasBasicNutrientError).toBe(true);
    });

    it('should detect negative nutrient values', () => {
      const result = validateFoodData(mockInvalidFoodData);

      expect(result.valid).toBe(false);
      expect(result.quarantine).toBe(true);
      const hasNegativeError = result.errors.some(
        e => e.issue.includes('negative')
      );
      expect(hasNegativeError).toBe(true);
    });

    it('should detect nutrient values exceeding biological constraints', () => {
      const result = validateFoodData(mockInvalidFoodData);

      // Carbs = 150g exceeds max 100g per 100g
      const hasExceedingWarning = result.warnings.some(
        w => w.field.includes('205') && w.issue.includes('exceeds maximum')
      );
      expect(hasExceedingWarning).toBe(true);
    });

    it('should flag high CV (Coefficient of Variation)', () => {
      const result = validateFoodData(mockHighCVFoodData);

      // CV = 55% exceeds 30% threshold
      const hasHighCVWarning = result.warnings.some(
        w => w.issue.includes('variability') && w.severity === 'HIGH'
      );
      expect(hasHighCVWarning).toBe(true);
      expect(result.quarantine).toBe(true);
      expect(result.quarantineReason).toContain('coefficient of variation');
    });

    it('should warn about low sample size', () => {
      const foodWithLowSampleSize = {
        ...mockValidFoodData,
        nutrients: mockValidFoodData.nutrients.map(n => ({
          ...n,
          sampleSize: 3, // Below minimum of 10
        })),
      };

      const result = validateFoodData(foodWithLowSampleSize);

      const hasLowSampleWarning = result.warnings.some(
        w => w.issue.includes('low sample size')
      );
      expect(hasLowSampleWarning).toBe(true);
    });

    it('should warn about old data', () => {
      const foodWithOldData = {
        ...mockValidFoodData,
        nutrients: mockValidFoodData.nutrients.map(n => ({
          ...n,
          dataYear: 2015, // > 5 years old
        })),
      };

      const result = validateFoodData(foodWithOldData);

      const hasOldDataWarning = result.warnings.some(
        w => w.issue.includes('years old')
      );
      expect(hasOldDataWarning).toBe(true);
    });

    it('should validate calorie sum from macros', () => {
      const foodWithCalorieMismatch = {
        fdcId: 666666,
        name: 'Test Food - Calorie Mismatch',
        nutrients: [
          {
            nutrientNumber: '208',
            name: 'Energy',
            value: 500, // Reported calories
            unit: 'kcal',
          },
          {
            nutrientNumber: '203',
            name: 'Protein',
            value: 10, // 10g × 4 = 40 kcal
            unit: 'g',
          },
          {
            nutrientNumber: '205',
            name: 'Carbohydrates',
            value: 10, // 10g × 4 = 40 kcal
            unit: 'g',
          },
          {
            nutrientNumber: '204',
            name: 'Fat',
            value: 10, // 10g × 9 = 90 kcal
            unit: 'g',
          },
          // Total expected: 40 + 40 + 90 = 170 kcal
          // Reported: 500 kcal
          // Variance: (500 - 170) / 500 = 66% >> 20% threshold
        ],
      };

      const result = validateFoodData(foodWithCalorieMismatch);

      const hasCalorieMismatchWarning = result.warnings.some(
        w => w.field === 'calories' && w.issue.includes('mismatch')
      );
      expect(hasCalorieMismatchWarning).toBe(true);
    });
  });

  describe('Quarantine Workflow', () => {
    it('should add invalid food to quarantine', async () => {
      const validationResult = validateFoodData(mockInvalidFoodData);

      // Verify food should be quarantined
      expect(validationResult.quarantine).toBe(true);
      expect(validationResult.quarantineReason).toBeDefined();

      // Note: Actual database insertion would be tested with test database
      // For now, we verify the validation logic correctly identifies quarantine cases
    });

    it('should add high CV food to quarantine', async () => {
      const validationResult = validateFoodData(mockHighCVFoodData);

      expect(validationResult.quarantine).toBe(true);
      expect(validationResult.quarantineReason).toContain('coefficient of variation');
    });

    it('should not quarantine valid food', async () => {
      const validationResult = validateFoodData(mockValidFoodData);

      expect(validationResult.quarantine).toBe(false);
      expect(validationResult.valid).toBe(true);
    });
  });

  describe('ETL Pipeline End-to-End', () => {
    it('should successfully import valid USDA food', async () => {
      // 1. Extract: Mock USDA API response
      const usdaResponse = mockUSDAFoodResponse;

      // 2. Transform: Convert USDA format to our format
      const transformedFood = {
        fdcId: usdaResponse.fdcId,
        name: usdaResponse.description,
        description: usdaResponse.description,
        nutrients: usdaResponse.foodNutrients.map(fn => ({
          nutrientNumber: fn.nutrient.number,
          name: fn.nutrient.name,
          value: fn.amount,
          unit: fn.nutrient.unitName,
        })),
      };

      // 3. Validate: Check data quality
      const validationResult = validateFoodData(transformedFood);

      expect(validationResult.valid).toBe(true);
      expect(validationResult.quarantine).toBe(false);

      // 4. Load: Would insert to database here
      // In real tests, verify database state
    });

    it('should handle missing nutrients gracefully', async () => {
      // 1. Extract: Mock USDA response with minimal nutrients
      const minimalUSDAResponse = {
        fdcId: 999999,
        description: 'Minimal Food',
        foodNutrients: [
          {
            nutrient: { number: '208', name: 'Energy', unitName: 'kcal' },
            amount: 100,
          },
          // Missing protein, carbs, fat
        ],
      };

      // 2. Transform
      const transformedFood = {
        fdcId: minimalUSDAResponse.fdcId,
        name: minimalUSDAResponse.description,
        nutrients: minimalUSDAResponse.foodNutrients.map(fn => ({
          nutrientNumber: fn.nutrient.number,
          name: fn.nutrient.name,
          value: fn.amount,
          unit: fn.nutrient.unitName,
        })),
      };

      // 3. Validate
      const validationResult = validateFoodData(transformedFood);

      expect(validationResult.valid).toBe(false);
      expect(validationResult.quarantine).toBe(true);
      expect(validationResult.errors.length).toBeGreaterThan(0);

      // 4. Should route to quarantine instead of main database
    });

    it('should handle invalid data without crashing', async () => {
      // Test with completely malformed data
      const malformedFood = {
        fdcId: 0,
        name: '',
        nutrients: [],
      };

      const validationResult = validateFoodData(malformedFood);

      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Batch Validation', () => {
    it('should validate multiple foods in batch', () => {
      const foods = [
        mockValidFoodData,
        mockInvalidFoodData,
        mockHighCVFoodData,
      ];

      const results = foods.map(food => validateFoodData(food));

      expect(results).toHaveLength(3);
      expect(results[0].valid).toBe(true); // Valid food
      expect(results[1].valid).toBe(false); // Invalid food
      expect(results[2].quarantine).toBe(true); // High CV food
    });
  });
});

/**
 * Additional test scenarios to consider:
 *
 * 1. Database Integration:
 *    - Test actual database inserts
 *    - Test conflict resolution (ON CONFLICT UPDATE)
 *    - Test transaction rollback on errors
 *
 * 2. USDA API Integration:
 *    - Test with real USDA API responses
 *    - Test rate limiting behavior
 *    - Test circuit breaker behavior
 *
 * 3. Caching Layer:
 *    - Test L1/L2 cache hits
 *    - Test cache invalidation
 *    - Test stale-while-revalidate
 *
 * 4. BullMQ Job Queue:
 *    - Test job processing
 *    - Test job failure and retry
 *    - Test job progress tracking
 *
 * 5. Performance:
 *    - Test batch import performance
 *    - Test database query performance
 *    - Test cache effectiveness
 */
