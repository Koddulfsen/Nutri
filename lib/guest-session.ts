/**
 * Guest Session
 *
 * Persists an unauthenticated user's "today meal" in localStorage so they can
 * try Nutri (search foods, view compound breakdown) before signing in.
 * When they sign in, this data can be migrated to their account.
 */

export interface GuestFoodEntry {
  id: string;               // local unique id
  foodId: string;           // Nutri food UUID
  foodName: string;
  portionSize: number;      // grams
  portionType: string;      // description like "1 cup" or "g"
  addedAt: string;          // ISO timestamp
}

export interface GuestSession {
  createdAt: string;
  foods: GuestFoodEntry[];
}

const STORAGE_KEY = 'nutri-guest-session-v1';

function safeParse(raw: string | null): GuestSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed && Array.isArray(parsed.foods)) {
      return parsed as GuestSession;
    }
  } catch {
    // ignore
  }
  return null;
}

export function getGuestSession(): GuestSession {
  if (typeof window === 'undefined') return { createdAt: new Date().toISOString(), foods: [] };
  const existing = safeParse(localStorage.getItem(STORAGE_KEY));
  if (existing) return existing;
  const fresh: GuestSession = { createdAt: new Date().toISOString(), foods: [] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

export function addGuestFood(entry: Omit<GuestFoodEntry, 'id' | 'addedAt'>): GuestSession {
  const session = getGuestSession();
  const next: GuestFoodEntry = {
    ...entry,
    id: `gf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    addedAt: new Date().toISOString(),
  };
  const updated: GuestSession = { ...session, foods: [...session.foods, next] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function removeGuestFood(entryId: string): GuestSession {
  const session = getGuestSession();
  const updated: GuestSession = {
    ...session,
    foods: session.foods.filter((f) => f.id !== entryId),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearGuestSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function hasGuestData(): boolean {
  if (typeof window === 'undefined') return false;
  const session = safeParse(localStorage.getItem(STORAGE_KEY));
  return !!session && session.foods.length > 0;
}
