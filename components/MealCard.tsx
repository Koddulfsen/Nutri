import React from 'react';
import type { Meal } from '@/lib/types';

interface MealCardProps {
  meal: Meal;
  onEdit: (mealId: string) => void;
  onDelete: (mealId: string) => void;
}

export default function MealCard({ meal, onEdit, onDelete }: MealCardProps) {
  return (
    <article className="meal-card">
      <div className="meal-header">
        <div>
          {meal.emoji} {meal.name} • {meal.time}
        </div>
      </div>
      <div className="meal-foods">
        {meal.foods?.length > 0 ? (
          meal.foods.map((food, index) => (
            <div className="food-item" key={index}>
              • {food.name} {food.quantity}
            </div>
          ))
        ) : (
          <div className="food-item" style={{ color: 'rgba(255,255,255,0.5)' }}>
            No foods logged
          </div>
        )}
      </div>
      <div className="meal-actions">
        <button className="btn-secondary" onClick={() => onEdit(meal.id)}>
          Edit
        </button>
        <button className="btn-danger" onClick={() => onDelete(meal.id)}>
          Delete
        </button>
      </div>
    </article>
  );
}
