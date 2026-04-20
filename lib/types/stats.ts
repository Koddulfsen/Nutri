// Daily stats and metrics types for Nutri Phase 2

export interface DailyStats {
  calories: number;
  healthScore: number;
  macros: {
    carbs: number;
    protein: number;
    fat: number;
  };
}

export interface WeekDay {
  dayName: string;
  date: number;
  score: number | null;
  zone: 'optimal' | 'warning' | 'deficient' | null;
  isActive: boolean;
}
