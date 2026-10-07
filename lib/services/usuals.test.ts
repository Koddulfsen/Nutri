import { describe, expect, it } from 'vitest';
import { rankSuggestions, type UsualFood } from './usuals';
import type { SavedMeal } from './saved-meals';

const TODAY = '2026-10-07';

const food = (id: string, recentUses: number, lastUsed: string): UsualFood => ({
  foodId: id,
  name: id,
  grams: 100,
  portion: '100 g',
  uses: recentUses,
  recentUses,
  lastUsed,
});

const meal = (id: string, useCount: number, lastUsedAt: string | null, foodIds: string[]): SavedMeal => ({
  id,
  name: id,
  items: foodIds.map((f) => ({ foodId: f, name: f, grams: 50, portion: '50 g' })),
  useCount,
  lastUsedAt: lastUsedAt ? new Date(`${lastUsedAt}T08:00:00Z`) : null,
  createdAt: new Date('2026-09-01T08:00:00Z'),
});

const ids = (s: ReturnType<typeof rankSuggestions>) => s.map((x) => (x.kind === 'food' ? x.foodId : x.id));

describe('rankSuggestions', () => {
  it('orders by recent uses, then by most recent use', () => {
    const out = rankSuggestions({
      foods: [food('rare', 1, '2026-10-06'), food('often', 9, '2026-10-01'), food('tie-old', 3, '2026-09-20'), food('tie-new', 3, '2026-10-05')],
      meals: [],
      loggedToday: new Set(),
      today: TODAY,
      limit: 5,
    });
    expect(ids(out)).toEqual(['often', 'tie-new', 'tie-old', 'rare']);
  });

  it('mixes saved meals in by the same measure, and caps at the limit', () => {
    const out = rankSuggestions({
      foods: [food('a', 5, '2026-10-06'), food('b', 2, '2026-10-06'), food('c', 1, '2026-10-06')],
      meals: [meal('breakfast', 4, '2026-10-06', ['x', 'y'])],
      loggedToday: new Set(),
      today: TODAY,
      limit: 3,
    });
    expect(ids(out)).toEqual(['a', 'breakfast', 'b']);
  });

  it('only counts a meal while it has been used in the last 30 days', () => {
    const out = rankSuggestions({
      foods: [food('a', 1, '2026-10-01')],
      meals: [meal('old-favourite', 50, '2026-07-01', ['x'])],
      loggedToday: new Set(),
      today: TODAY,
      limit: 5,
    });
    expect(ids(out)).toEqual(['a', 'old-favourite']);
  });

  it("leaves out what's already logged today; a meal only once all its foods are", () => {
    const out = rankSuggestions({
      foods: [food('coffee', 9, '2026-10-06'), food('skyr', 2, '2026-10-06')],
      meals: [meal('half-eaten', 3, '2026-10-06', ['oats', 'milk']), meal('all-eaten', 3, '2026-10-06', ['coffee'])],
      loggedToday: new Set(['coffee', 'oats']),
      today: TODAY,
      limit: 5,
    });
    expect(ids(out)).toEqual(['half-eaten', 'skyr']);
  });

  it('shows a newly saved, never-used meal after used things', () => {
    const out = rankSuggestions({
      foods: [food('a', 1, '2026-10-01')],
      meals: [meal('new', 0, null, ['x'])],
      loggedToday: new Set(),
      today: TODAY,
      limit: 5,
    });
    expect(ids(out)).toEqual(['a', 'new']);
  });
});
