// Compound and nutrient types for Nutri Phase 2

export interface Compound {
  id: string;
  name: string;
  amount: string;
  rdaPercent: number;
  zone: 'optimal' | 'warning' | 'deficient' | 'excess';
  confidence: number;
  contributingFoods?: ContributingFood[];
}

export interface ContributingFood {
  food: string;
  amount: string;
}

export interface CompoundGroup {
  name: string;
  compounds: Compound[];
}
