// Meal logging types for Nutri Phase 2

export interface Meal {
  id: string;
  emoji: string;
  name: string;
  time: string;
  foods: Food[];
}

export interface Food {
  name: string;
  quantity: string;
}

export interface CreateMealInput {
  date: Date;
  name: string;
  emoji: string;
  foods: { foodId: string; quantity: string }[];
}

export interface UpdateMealInput {
  name?: string;
  emoji?: string;
  foods?: { foodId: string; quantity: string }[];
}
