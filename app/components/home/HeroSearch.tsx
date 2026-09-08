'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/utils/base-path';
import { addGuestFood } from '@/lib/guest-session';

interface FoodResult {
  id: string;
  name: string;
  description?: string | null;
  compoundCount?: number;
}

interface Portion {
  id: string;
  description: string;
  gramWeight: number;
  isDefault: boolean;
}

interface HeroSearchProps {
  isAuthed?: boolean;
}

export default function HeroSearch({ isAuthed = false }: HeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // After a food is selected
  const [selectedFood, setSelectedFood] = useState<FoodResult | null>(null);
  const [portions, setPortions] = useState<Portion[]>([]);
  const [quantity, setQuantity] = useState('1');
  const [selectedUnit, setSelectedUnit] = useState('g');
  const [adding, setAdding] = useState(false);

  // Search effect
  useEffect(() => {
    if (!query.trim() || selectedFood) {
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          apiUrl(`/api/foods/search?q=${encodeURIComponent(query.trim())}&limit=8`),
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, selectedFood]);

  const handleSelectFood = async (food: FoodResult) => {
    setSelectedFood(food);
    setQuery(food.name);
    setDropdownOpen(false);
    setPortions([]);
    setQuantity('100');
    setSelectedUnit('g');

    try {
      const res = await fetch(apiUrl(`/api/foods/${food.id}/portions`));
      if (res.ok) {
        const data = await res.json();
        const ps: Portion[] = data.portions || [];
        if (ps.length > 0) {
          setPortions(ps);
          const def = ps.find((p) => p.isDefault) || ps[0];
          setSelectedUnit(def.id);
          setQuantity('1');
        }
      }
    } catch (err) {
      console.error('Failed to fetch portions:', err);
    }
  };

  const handleClearSelection = () => {
    setSelectedFood(null);
    setPortions([]);
    setQuery('');
    setQuantity('1');
    setSelectedUnit('g');
  };

  const handleAddFood = async () => {
    if (!selectedFood) return;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return;

    const portion = portions.find((p) => p.id === selectedUnit);
    const grams = portion ? qty * portion.gramWeight : qty;
    const portionType = portion ? portion.description : selectedUnit;

    setAdding(true);

    if (isAuthed) {
      // Authed: add directly to today's meal via API
      try {
        const today = new Date().toISOString().split('T')[0];
        const mealsRes = await fetch(apiUrl(`/api/meals?date=${today}`));
        const mealsData = mealsRes.ok ? await mealsRes.json() : { meals: [] };
        const existingMeal = mealsData.meals?.[0];

        const payload = {
          foods: [{
            foodId: selectedFood.id,
            portionSize: Math.round(grams * 100) / 100,
            portionType,
          }],
        };

        if (existingMeal) {
          await fetch(apiUrl(`/api/meals/${existingMeal.id}/items`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } else {
          await fetch(apiUrl('/api/meals'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: today,
              mealType: 'Today',
              ...payload,
            }),
          });
        }
      } catch (err) {
        console.error('Failed to add food to meal:', err);
      }
    } else {
      // Guest: save to localStorage session
      addGuestFood({
        foodId: selectedFood.id,
        foodName: selectedFood.name,
        portionSize: Math.round(grams * 100) / 100,
        portionType,
      });
    }

    router.push('/analysis');
  };

  return (
    <div className="home-hero">
      <h1 className="home-headline">wtf is even in a banana?</h1>

      <div className="home-search">
        <input
          className="home-search-input"
          type="text"
          placeholder="Try banana, chicken breast, olive oil..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selectedFood) setSelectedFood(null);
          }}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
          autoFocus
        />
        {selectedFood && (
          <button className="home-search-clear" onClick={handleClearSelection} aria-label="Clear selection">
            &#x2715;
          </button>
        )}
        {dropdownOpen && !selectedFood && (loading || results.length > 0 || query.trim()) && (
          <div className="home-dropdown">
            {loading && <div className="home-dropdown-note">Searching…</div>}
            {!loading && results.length === 0 && query.trim() && (
              <div className="home-dropdown-note">No results</div>
            )}
            {results.map((r) => (
              <button
                className="home-dropdown-item"
                key={r.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectFood(r);
                }}
              >
                <span className="home-dropdown-name">{r.name}</span>
                {r.compoundCount != null && r.compoundCount > 0 && (
                  <span className="home-dropdown-count">{r.compoundCount} compounds</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="home-controls">
        <input
          className="home-qty"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="0"
          disabled={!selectedFood}
        />
        <select
          className="home-unit"
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          disabled={!selectedFood}
        >
          {portions.length > 0 ? (
            portions.map((p) => (
              <option key={p.id} value={p.id}>{p.description}</option>
            ))
          ) : (
            <>
              <option value="g">g</option>
              <option value="oz">oz</option>
              <option value="cup">cup</option>
              <option value="tbsp">tbsp</option>
            </>
          )}
        </select>
        <button
          className="home-add-btn"
          onClick={handleAddFood}
          disabled={!selectedFood || adding}
        >
          {adding ? 'Adding...' : 'Add food'}
        </button>
      </div>
    </div>
  );
}
