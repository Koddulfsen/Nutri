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
    <div className="hero-search-wrap">
      <h1 className="hero-title">The world&apos;s food data, unified.</h1>

      <div className="hero-search-box">
        <input
          type="text"
          className="hero-search-input"
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
          <button className="clear-btn" onClick={handleClearSelection} aria-label="Clear selection">
            &#x2715;
          </button>
        )}
        {dropdownOpen && !selectedFood && (loading || results.length > 0 || query.trim()) && (
          <div className="hero-search-dropdown">
            {loading && <div className="hero-search-status">Searching…</div>}
            {!loading && results.length === 0 && query.trim() && (
              <div className="hero-search-status">No results</div>
            )}
            {results.map((r) => (
              <button
                key={r.id}
                className="hero-search-result"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectFood(r);
                }}
              >
                <span className="result-name">{r.name}</span>
                {r.compoundCount != null && r.compoundCount > 0 && (
                  <span className="result-meta">{r.compoundCount} compounds</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`hero-add-row ${selectedFood ? 'active' : 'inactive'}`}>
        <input
          type="number"
          className="hero-quantity-input"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="0"
          disabled={!selectedFood}
        />
        <select
          className="hero-unit-select"
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
          className="hero-add-btn"
          onClick={handleAddFood}
          disabled={!selectedFood || adding}
        >
          {adding ? 'Adding...' : 'Add food'}
        </button>
      </div>

      <style jsx>{`
        .hero-search-wrap {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          max-width: 680px;
          padding: 0 24px;
          text-align: center;
        }

        .hero-title {
          font-family: var(--font-display, 'Instrument Serif', serif);
          font-size: 56px;
          font-weight: 400;
          letter-spacing: -0.01em;
          line-height: 1.05;
          color: var(--text-1, #e8e8f4);
          margin: 0 0 28px 0;
        }

        @media (max-width: 640px) {
          .hero-title {
            font-size: 40px;
          }
        }

        .hero-search-box {
          position: relative;
        }

        .hero-search-input {
          width: 100%;
          height: 80px;
          padding: 0 52px 0 28px;
          background: #000;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          color: var(--text-1, #e8e8f4);
          font-family: var(--font-display, 'Instrument Serif', serif);
          font-size: 28px;
          font-weight: 400;
          outline: none;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .hero-search-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
          font-style: italic;
        }

        .hero-search-input:focus {
          border-color: transparent;
          background: #000;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 0 4px rgba(34, 211, 238, 0.3);
        }

        .clear-btn {
          position: absolute;
          right: 18px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: var(--text-3, #484860);
          font-size: 16px;
          cursor: pointer;
          padding: 6px 8px;
          line-height: 1;
          transition: color 0.15s;
        }

        .clear-btn:hover {
          color: var(--text-1, #e8e8f4);
        }

        .hero-search-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #000;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          max-height: 420px;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          text-align: left;
          z-index: 2;
        }

        .hero-search-result {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 12px 20px;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          color: var(--text-1, #e8e8f4);
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 14px;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s ease;
        }

        .hero-search-result:last-child {
          border-bottom: none;
        }

        .hero-search-result:hover {
          background: rgba(80, 136, 152, 0.1);
        }

        .result-name {
          color: var(--text-1, #e8e8f4);
        }

        .result-meta {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 11px;
          color: var(--text-3, #484860);
        }

        .hero-search-status {
          padding: 16px 20px;
          color: var(--text-3, #484860);
          font-size: 13px;
          font-style: italic;
          text-align: center;
        }

        /* Add row */
        .hero-add-row {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          transition: opacity 0.2s ease;
        }

        .hero-add-row.inactive {
          opacity: 0.65;
        }

        .hero-add-row .hero-quantity-input,
        .hero-add-row .hero-unit-select,
        .hero-add-row .hero-add-btn {
          flex: 1 1 0;
          min-width: 0;
        }

        .hero-quantity-input {
          height: 60px;
          padding: 0 16px;
          background: #000;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          color: var(--text-1, #e8e8f4);
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 16px;
          outline: none;
          text-align: center;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }

        .hero-quantity-input:focus {
          border-color: var(--accent, #508898);
        }

        .hero-unit-select {
          height: 60px;
          padding: 0 16px;
          background: #000;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          color: var(--text-1, #e8e8f4);
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 14px;
          cursor: pointer;
          outline: none;
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }

        .hero-unit-select:focus {
          border-color: var(--accent, #508898);
        }

        .hero-add-btn {
          height: 60px;
          background: var(--accent, #508898);
          color: #fff;
          border: none;
          border-radius: 3px;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 5px 0 var(--accent-dark, #306070);
          transform: translateY(0);
          transition: transform 0.08s, box-shadow 0.08s;
        }

        .hero-add-btn:hover:not(:disabled) {
          transform: translateY(2px);
          box-shadow: 0 3px 0 var(--accent-dark, #306070);
        }

        .hero-add-btn:active:not(:disabled) {
          transform: translateY(5px);
          box-shadow: 0 0 0 var(--accent-dark, #306070);
        }

        .hero-add-btn:disabled {
          opacity: 0.4;
          cursor: default;
        }
      `}</style>
    </div>
  );
}
