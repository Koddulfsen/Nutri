'use client';

/**
 * The food list's shortcuts (docs/PLAN-SAVED-MEALS.md):
 *  - FoodSuggestions: up to 5 greyed rows under the day's foods, each with +
 *  - MyMealsButton: the "My meals" header button and its modal
 *  - SaveAsMeal: "Save as meal" for the foods selected in the list
 * Used in both copies of the food list (beside the chat, and the phone section).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiUrl } from '@/lib/utils/base-path';
import type { Suggestion } from '@/lib/services/usuals';
import type { SavedMeal } from '@/lib/services/saved-meals';

/** What the page needs to add foods: same path as the chat's Add foods. */
export type AddFoods = (
  items: Array<{ foodId: string; name: string; grams: number; portion: string }>,
  options?: { savedMealId?: string }
) => Promise<void>;

/** Saved meals as the API sends them (dates as strings). */
export type MealJson = Omit<SavedMeal, 'lastUsedAt' | 'createdAt'> & { lastUsedAt: string | null; createdAt: string };
export type SuggestionJson =
  | Extract<Suggestion, { kind: 'food' }>
  | (Omit<Extract<Suggestion, { kind: 'meal' }>, 'items'> & { items: MealJson['items'] });

export interface QuickAddState {
  suggestions: SuggestionJson[];
  meals: MealJson[];
  refresh: () => void;
}

/**
 * One fetch for the day, shared by both food lists. `logKey` changes whenever
 * the day's foods do, so suggestions follow what was just added or removed.
 */
export function useQuickAdd(date: string, logKey: string, enabled: boolean): QuickAddState {
  const [suggestions, setSuggestions] = useState<SuggestionJson[]>([]);
  const [meals, setMeals] = useState<MealJson[]>([]);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch(apiUrl(`/api/quick-add?date=${date}`))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setSuggestions(data.suggestions ?? []);
        setMeals(data.meals ?? []);
      })
      .catch(() => {
        // Suggestions are a convenience; the list works without them.
      });
    return () => {
      cancelled = true;
    };
  }, [date, logKey, tick, enabled]);

  return { suggestions, meals, refresh };
}

function mealSummary(items: MealJson['items']) {
  return items.map((i) => i.name.split(',')[0]).join(', ');
}

// ── Suggestions under the list

export function FoodSuggestions({
  state,
  onAdd,
  loggedFoodIds,
}: {
  state: QuickAddState;
  onAdd: AddFoods;
  /** The day's foods as shown right now, optimistic adds included. */
  loggedFoodIds: Set<string>;
}) {
  // Only the clicked row is locked while it saves; the page queues saves in
  // order, so other rows can be added straight away.
  const [busy, setBusy] = useState<Set<string>>(new Set());
  // Hide what's already in the list the moment it's added, by the server's own
  // rule (a food once logged, a meal once all its foods are), instead of
  // waiting for the refetch. The refetch then only fills the freed slot.
  const visible = state.suggestions.filter((s) =>
    s.kind === 'food' ? !loggedFoodIds.has(s.foodId) : !s.items.every((i) => loggedFoodIds.has(i.foodId))
  );
  if (visible.length === 0) return null;

  async function add(s: SuggestionJson) {
    const key = s.kind === 'food' ? s.foodId : s.id;
    setBusy((b) => new Set(b).add(key));
    try {
      if (s.kind === 'food') {
        await onAdd([{ foodId: s.foodId, name: s.name, grams: s.grams, portion: s.portion }]);
      } else {
        await onAdd(
          s.items.map((i) => ({ foodId: i.foodId, name: i.name, grams: i.grams, portion: i.portion })),
          { savedMealId: s.id }
        );
      }
    } catch {
      // The page shows the error and restores the list; nothing to add here.
    } finally {
      // No refresh here: the day's foods changed, so useQuickAdd refetches.
      setBusy((b) => {
        const next = new Set(b);
        next.delete(key);
        return next;
      });
    }
  }

  return (
    <div className="qa-suggestions" aria-label="Suggestions">
      <ul className="qa-list">
        {visible.map((s) => {
          const key = s.kind === 'food' ? s.foodId : s.id;
          return (
            <li key={`${s.kind}-${key}`} className="qa-row">
              <span className="qa-name">
                {s.name}
                {s.kind === 'meal' && <span className="qa-count"> · {s.items.length}</span>}
              </span>
              <span className="qa-meta">
                {s.kind === 'food' ? (/^\d/.test(s.portion) ? s.portion : `${s.grams} g`) : mealSummary(s.items)}
              </span>
              <button
                type="button"
                className="qa-add"
                onClick={() => add(s)}
                disabled={busy.has(key)}
                aria-label={`Add ${s.name}`}
              >
                +
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── My meals

export function MyMealsButton({ state, onAdd }: { state: QuickAddState; onAdd: AddFoods }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="qa-mymeals" onClick={() => setOpen(true)}>
        My meals
      </button>
      {open &&
        createPortal(<MyMealsModal state={state} onAdd={onAdd} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function MyMealsModal({ state, onAdd, onClose }: { state: QuickAddState; onAdd: AddFoods; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const meals = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? state.meals.filter((m) => m.name.toLowerCase().includes(q)) : state.meals;
  }, [state.meals, query]);

  async function call(id: string, run: () => Promise<Response | void>) {
    setBusy(id);
    setError(null);
    try {
      const res = await run();
      if (res && !res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Something went wrong.');
      }
      state.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      return false;
    } finally {
      setBusy(null);
    }
  }

  const add = (m: MealJson) =>
    call(m.id, () =>
      onAdd(
        m.items.map((i) => ({ foodId: i.foodId, name: i.name, grams: i.grams, portion: i.portion })),
        { savedMealId: m.id }
      )
    ).then((ok) => ok && onClose());

  const rename = (id: string, name: string) =>
    call(id, () =>
      fetch(apiUrl('/api/saved-meals'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      })
    ).then((ok) => ok && setRenaming(null));

  const remove = (id: string) =>
    call(id, () => fetch(apiUrl(`/api/saved-meals?id=${id}`), { method: 'DELETE' })).then(
      (ok) => ok && setConfirmDelete(null)
    );

  return (
    <div className="qa-backdrop" onClick={onClose}>
      <div className="qa-modal" role="dialog" aria-modal="true" aria-label="My meals" onClick={(e) => e.stopPropagation()}>
        <div className="qa-modal-head">
          <h2 className="qa-modal-title">My meals</h2>
          <button type="button" className="qa-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {state.meals.length > 8 && (
          <input
            className="qa-search"
            placeholder="Search your meals"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        )}

        {state.meals.length === 0 ? (
          <p className="qa-empty">
            No saved meals yet. Select foods in your list and choose <em>Save as meal</em>.
          </p>
        ) : (
          <ul className="qa-meals">
            {meals.map((m) => (
              <li key={m.id} className="qa-meal">
                {renaming?.id === m.id ? (
                  <form
                    className="qa-rename"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (renaming.name.trim()) rename(m.id, renaming.name.trim());
                    }}
                  >
                    <input
                      autoFocus
                      value={renaming.name}
                      maxLength={80}
                      onChange={(e) => setRenaming({ id: m.id, name: e.target.value })}
                      onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), setRenaming(null))}
                    />
                    <button type="submit" className="qa-link" disabled={busy === m.id}>
                      Save
                    </button>
                    <button type="button" className="qa-link" onClick={() => setRenaming(null)}>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="qa-meal-main">
                    <span className="qa-meal-name">{m.name}</span>
                    <span className="qa-meal-items">
                      {m.items.map((i) => `${i.name.split(',')[0]} ${i.grams} g`).join(' · ')}
                    </span>
                  </div>
                )}
                {renaming?.id !== m.id && (
                  <div className="qa-meal-actions">
                    {confirmDelete === m.id ? (
                      <>
                        <span className="qa-confirm">Delete?</span>
                        <button type="button" className="qa-link qa-link--danger" onClick={() => remove(m.id)} disabled={busy === m.id}>
                          Delete
                        </button>
                        <button type="button" className="qa-link" onClick={() => setConfirmDelete(null)}>
                          Keep
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="qa-link" onClick={() => setRenaming({ id: m.id, name: m.name })}>
                          Rename
                        </button>
                        <button type="button" className="qa-link" onClick={() => setConfirmDelete(m.id)}>
                          Delete
                        </button>
                        <button
                          type="button"
                          className="qa-add qa-add--solid"
                          onClick={() => add(m)}
                          disabled={busy !== null || m.items.length === 0}
                          aria-label={`Add ${m.name}`}
                        >
                          +
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
            {meals.length === 0 && <li className="qa-empty">No meals match “{query}”.</li>}
          </ul>
        )}
        {error && <p className="qa-error">{error}</p>}
      </div>
    </div>
  );
}

// ── Save as meal, from the foods selected in the list

export function SaveAsMeal({
  selected,
  onSaved,
}: {
  selected: Array<{ foodId: string; grams: number; portion: string }>;
  onSaved: () => void;
}) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (selected.length === 0) return null;

  async function save() {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/saved-meals'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), items: selected }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Could not save the meal.');
      }
      setNaming(false);
      setName('');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the meal.');
    } finally {
      setSaving(false);
    }
  }

  if (!naming) {
    return (
      <button type="button" className="qa-link qa-save-link" onClick={() => setNaming(true)}>
        Save as meal
      </button>
    );
  }

  return (
    <form
      className="qa-save-form"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <input
        autoFocus
        placeholder={`Name ${selected.length} food${selected.length === 1 ? '' : 's'}, e.g. Usual breakfast`}
        value={name}
        maxLength={80}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setNaming(false)}
      />
      <button type="submit" className="qa-link" disabled={!name.trim() || saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
      <button type="button" className="qa-link" onClick={() => setNaming(false)}>
        Cancel
      </button>
      {error && <p className="qa-error">{error}</p>}
    </form>
  );
}
