'use client';

import type { ContributingFood } from '@/lib/types';

interface ContributingFoodsProps {
  foods: ContributingFood[];
}

export default function ContributingFoods({ foods }: ContributingFoodsProps) {
  if (!foods || foods.length === 0) {
    return null;
  }

  return (
    <div className="contributing-foods">
      {foods.map((food, index) => (
        <div key={`${food?.food}-${index}`} className="contributing-food-item food-indent">
          ↳ {food?.food ?? 'Unknown food'}: {food?.amount ?? 'N/A'}
        </div>
      ))}
    </div>
  );
}
