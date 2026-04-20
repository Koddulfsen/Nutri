// API stub functions for Nutri Phase 2 frontend development
// These will be replaced with actual API calls in backend implementation

import type {
  Compound,
  CompoundGroup,
  Meal,
  CreateMealInput,
  UpdateMealInput,
  DailyStats,
  WeekDay
} from './types';

// ============================================================================
// Daily Totals API
// ============================================================================

/**
 * Get daily compound totals for a specific date
 * Returns top compounds with amounts, RDA percentages, and confidence scores
 */
export async function getDailyCompoundTotals(date: Date): Promise<Compound[]> {
  // Mock data for development
  return [
    {
      id: '1',
      name: 'Protein',
      amount: '42g',
      rdaPercent: 84,
      zone: 'optimal',
      confidence: 85,
      contributingFoods: [
        { food: 'Chicken 200g', amount: '40g' },
        { food: 'Broccoli 100g', amount: '2g' }
      ]
    },
    {
      id: '2',
      name: 'Vitamin C',
      amount: '120mg',
      rdaPercent: 133,
      zone: 'excess',
      confidence: 92
    },
    {
      id: '3',
      name: 'Iron',
      amount: '8mg',
      rdaPercent: 44,
      zone: 'deficient',
      confidence: 78,
      contributingFoods: [
        { food: 'Chicken 200g', amount: '2mg' },
        { food: 'Broccoli 100g', amount: '1mg' },
        { food: 'Brown rice 150g', amount: '2mg' },
        { food: 'Almonds 30g', amount: '1mg' },
        { food: 'Oatmeal 50g', amount: '2mg' }
      ]
    },
    {
      id: '4',
      name: 'Calcium',
      amount: '650mg',
      rdaPercent: 65,
      zone: 'warning',
      confidence: 80
    },
    {
      id: '5',
      name: 'Fiber',
      amount: '25g',
      rdaPercent: 83,
      zone: 'optimal',
      confidence: 88
    }
  ];
}

/**
 * Get daily quick stats (calories, health score, macros)
 */
export async function getDailyStats(date: Date): Promise<DailyStats> {
  // Mock data for development
  return {
    calories: 1850,
    healthScore: 84,
    macros: {
      carbs: 45,
      protein: 30,
      fat: 25
    }
  };
}

// ============================================================================
// Meal Logging API
// ============================================================================

/**
 * Get all meals logged for a specific date
 */
export async function getMealsForDate(date: Date): Promise<Meal[]> {
  // Mock data for development
  return [
    {
      id: '1',
      emoji: '🍳',
      name: 'Breakfast',
      time: '8:00 AM',
      foods: [
        { name: 'Oatmeal', quantity: '50g' },
        { name: 'Blueberries', quantity: '100g' },
        { name: 'Milk', quantity: '200ml' }
      ]
    },
    {
      id: '2',
      emoji: '🥗',
      name: 'Lunch',
      time: '12:30 PM',
      foods: [
        { name: 'Grilled chicken', quantity: '200g' },
        { name: 'Steamed broccoli', quantity: '100g' },
        { name: 'Brown rice', quantity: '150g' }
      ]
    },
    {
      id: '3',
      emoji: '🍎',
      name: 'Snack',
      time: '3:00 PM',
      foods: [
        { name: 'Apple', quantity: '1 medium' },
        { name: 'Almonds', quantity: '30g' }
      ]
    }
  ];
}

/**
 * Create a new meal log entry
 */
export async function createMeal(meal: CreateMealInput): Promise<Meal> {
  // Mock implementation - would call POST /api/meals
  return {
    id: Math.random().toString(36).substr(2, 9),
    emoji: meal.emoji,
    name: meal.name,
    time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    foods: meal.foods.map(f => ({ name: f.foodId, quantity: f.quantity }))
  };
}

/**
 * Update an existing meal log entry
 */
export async function updateMeal(mealId: string, updates: UpdateMealInput): Promise<Meal> {
  // Mock implementation - would call PATCH /api/meals/:id
  const existingMeal = await getMealsForDate(new Date()).then(meals =>
    meals.find(m => m.id === mealId)
  );

  if (!existingMeal) {
    throw new Error(`Meal ${mealId} not found`);
  }

  return {
    ...existingMeal,
    ...updates,
    foods: updates.foods
      ? updates.foods.map(f => ({ name: f.foodId, quantity: f.quantity }))
      : existingMeal.foods
  };
}

/**
 * Delete a meal log entry
 */
export async function deleteMeal(mealId: string): Promise<void> {
  // Mock implementation - would call DELETE /api/meals/:id
  console.log(`Deleting meal ${mealId}`);
}

// ============================================================================
// Week View API
// ============================================================================

/**
 * Get health scores for a week starting from startDate
 */
export async function getWeekHealthScores(startDate: Date): Promise<WeekDay[]> {
  // Mock data for development - 7 days starting from startDate
  return [
    { dayName: 'Mon', date: 11, score: 82, zone: 'optimal', isActive: false },
    { dayName: 'Tue', date: 12, score: 85, zone: 'optimal', isActive: false },
    { dayName: 'Wed', date: 13, score: 72, zone: 'warning', isActive: false },
    { dayName: 'Thu', date: 14, score: 88, zone: 'optimal', isActive: false },
    { dayName: 'Fri', date: 15, score: 84, zone: 'optimal', isActive: true },
    { dayName: 'Sat', date: 16, score: null, zone: null, isActive: false },
    { dayName: 'Sun', date: 17, score: null, zone: null, isActive: false }
  ];
}

// ============================================================================
// Compound Detail API
// ============================================================================

/**
 * Get all compounds grouped by category (Macronutrients, Vitamins, Minerals, etc.)
 * for compound detail page
 */
export async function getCompoundsByGroup(date: Date): Promise<CompoundGroup[]> {
  // Mock data for development
  return [
    {
      name: 'Macronutrients',
      compounds: [
        {
          id: '1',
          name: 'Protein',
          amount: '42g',
          rdaPercent: 84,
          zone: 'optimal',
          confidence: 85,
          contributingFoods: [
            { food: 'Chicken 200g', amount: '40g' },
            { food: 'Broccoli 100g', amount: '2g' }
          ]
        },
        {
          id: '2',
          name: 'Carbohydrates',
          amount: '150g',
          rdaPercent: 46,
          zone: 'deficient',
          confidence: 88
        },
        {
          id: '3',
          name: 'Fat',
          amount: '55g',
          rdaPercent: 76,
          zone: 'warning',
          confidence: 82
        }
      ]
    },
    {
      name: 'Vitamins',
      compounds: [
        {
          id: '4',
          name: 'Vitamin C',
          amount: '120mg',
          rdaPercent: 133,
          zone: 'excess',
          confidence: 92,
          contributingFoods: [
            { food: 'Broccoli 100g', amount: '89mg' },
            { food: 'Orange 1 medium', amount: '31mg' }
          ]
        },
        {
          id: '5',
          name: 'Vitamin A',
          amount: '800μg',
          rdaPercent: 100,
          zone: 'optimal',
          confidence: 85
        },
        {
          id: '6',
          name: 'Vitamin D',
          amount: '12μg',
          rdaPercent: 60,
          zone: 'warning',
          confidence: 78
        },
        {
          id: '7',
          name: 'Vitamin E',
          amount: '9mg',
          rdaPercent: 60,
          zone: 'warning',
          confidence: 75
        },
        {
          id: '8',
          name: 'Vitamin K',
          amount: '95μg',
          rdaPercent: 95,
          zone: 'optimal',
          confidence: 88
        }
      ]
    },
    {
      name: 'Minerals',
      compounds: [
        {
          id: '9',
          name: 'Iron',
          amount: '8mg',
          rdaPercent: 44,
          zone: 'deficient',
          confidence: 78,
          contributingFoods: [
            { food: 'Chicken 200g', amount: '2mg' },
            { food: 'Broccoli 100g', amount: '1mg' },
            { food: 'Brown rice 150g', amount: '2mg' },
            { food: 'Almonds 30g', amount: '1mg' },
            { food: 'Oatmeal 50g', amount: '2mg' }
          ]
        },
        {
          id: '10',
          name: 'Calcium',
          amount: '650mg',
          rdaPercent: 65,
          zone: 'warning',
          confidence: 80,
          contributingFoods: [
            { food: 'Milk 200ml', amount: '240mg' },
            { food: 'Broccoli 100g', amount: '47mg' },
            { food: 'Almonds 30g', amount: '76mg' }
          ]
        },
        {
          id: '11',
          name: 'Magnesium',
          amount: '320mg',
          rdaPercent: 80,
          zone: 'optimal',
          confidence: 86
        },
        {
          id: '12',
          name: 'Zinc',
          amount: '9mg',
          rdaPercent: 82,
          zone: 'optimal',
          confidence: 84
        },
        {
          id: '13',
          name: 'Potassium',
          amount: '2,800mg',
          rdaPercent: 70,
          zone: 'warning',
          confidence: 77
        }
      ]
    }
  ];
}
