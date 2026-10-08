/**
 * Which suggestions to show under the food list. Pure — no server code — so the
 * browser runs it on every add and remove without asking the server, and the
 * server-side tests run the very same rule.
 *
 * Foods and saved meals in one list, by uses in the last 30 days, then by most
 * recent use. A saved meal counts its uses only while it has been used in the
 * last 30 days (its count isn't kept per day). Anything already logged on the
 * day is left out — a meal once all its foods are.
 */

const RECENT_DAYS = 30;

export interface UsualFood {
  foodId: string;
  name: string;
  /** Usual amount: the most common grams + label the user logged it with. */
  grams: number;
  portion: string;
  uses: number;
  recentUses: number;
  /** YYYY-MM-DD */
  lastUsed: string;
}

export interface RankableMeal {
  id: string;
  name: string;
  items: Array<{ foodId: string; name: string; grams: number; portion: string }>;
  useCount: number;
  /** A Date on the server, an ISO string once it has crossed JSON. */
  lastUsedAt: Date | string | null;
  createdAt: Date | string;
}

export type Suggestion =
  | { kind: 'food'; foodId: string; name: string; grams: number; portion: string }
  | { kind: 'meal'; id: string; name: string; items: RankableMeal['items'] };

const time = (d: Date | string) => (typeof d === 'string' ? new Date(d) : d).getTime();

export function rankSuggestions(input: {
  foods: UsualFood[];
  meals: RankableMeal[];
  loggedToday: Set<string>;
  /** YYYY-MM-DD the 30-day window counts back from. */
  today: string;
  limit: number;
}): Suggestion[] {
  const { foods, meals, loggedToday, today, limit } = input;
  const recentCutoff = time(`${today}T00:00:00Z`) - RECENT_DAYS * 86_400_000;

  const scored: Array<{ score: number; last: number; s: Suggestion }> = [];
  for (const f of foods) {
    if (loggedToday.has(f.foodId)) continue;
    scored.push({
      score: f.recentUses,
      last: time(`${f.lastUsed}T00:00:00Z`),
      s: { kind: 'food', foodId: f.foodId, name: f.name, grams: f.grams, portion: f.portion },
    });
  }
  for (const m of meals) {
    if (m.items.length === 0 || m.items.every((i) => loggedToday.has(i.foodId))) continue;
    const lastUsed = m.lastUsedAt ? time(m.lastUsedAt) : null;
    scored.push({
      score: lastUsed !== null && lastUsed > recentCutoff ? m.useCount : 0,
      last: lastUsed ?? time(m.createdAt),
      s: { kind: 'meal', id: m.id, name: m.name, items: m.items },
    });
  }

  return scored
    .sort((a, b) => b.score - a.score || b.last - a.last)
    .slice(0, limit)
    .map((x) => x.s);
}
