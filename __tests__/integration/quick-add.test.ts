/**
 * Integration test: suggestions and usual amounts, from a real log in the real
 * database, through the real routes.
 *
 *  - The usual amount is the most common grams + label the food was logged with.
 *  - Ranking follows use; foods already logged that day aren't suggested.
 *  - Logging a saved meal (addMany + savedMealId) counts one use of it — only
 *    for the caller's own meal.
 *
 * Only auth is faked. Throwaway user ids; every row is cleaned up.
 */
import 'dotenv/config';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { foods, mealItems, mealLogs, savedMealTemplates, userConsent, userEncryptionKeys, userProfiles } from '@/db/schema';

const userA = randomUUID();
const userB = randomUUID();
let currentUser = userA;

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: currentUser, user_metadata: {} } }, error: null }),
    },
  }),
}));
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: (fn: () => unknown) => {
    Promise.resolve().then(fn).catch(() => {});
  },
}));

const { POST: syncPOST } = await import('@/app/api/meals/sync/route');
const { GET: quickAddGET } = await import('@/app/api/quick-add/route');
const savedMeals = await import('@/app/api/saved-meals/route');

function req(method: string, path: string, body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

// Far from any real day.
const TODAY = '2001-06-30';
const daysAgo = (n: number) => new Date(Date.UTC(2001, 5, 30 - n)).toISOString().slice(0, 10);

let F: { id: string; name: string }[] = [];

async function log(date: string, items: Array<[number, number, string]>, savedMealId?: string) {
  const res = await syncPOST(
    req('POST', '/api/meals/sync', {
      date,
      skipTotals: true,
      change: {
        type: 'addMany',
        mealId: null,
        foods: items.map(([f, g, label]) => ({ foodId: F[f].id, portionSize: g, portionType: label })),
        ...(savedMealId ? { savedMealId } : {}),
      },
    })
  );
  expect(res.status).toBe(200);
}

async function quickAdd() {
  const res = await quickAddGET(req('GET', `/api/quick-add?date=${TODAY}`));
  expect(res.status).toBe(200);
  return res.json();
}

beforeAll(async () => {
  F = await db.select({ id: foods.id, name: foods.name }).from(foods).where(eq(foods.visibility, 'public')).limit(4);
  expect(F).toHaveLength(4);
  // Food 0: logged often, usually "1 glass" 200 g. Food 1: twice. Food 2: once, long ago.
  await log(daysAgo(1), [[0, 200, '1 glass'], [1, 120, '1 medium']]);
  await log(daysAgo(2), [[0, 200, '1 glass']]);
  await log(daysAgo(3), [[0, 250, '250 g']]);
  await log(daysAgo(5), [[0, 200, '1 glass'], [1, 120, '1 medium']]);
  await log(daysAgo(60), [[2, 30, 'a handful']]);
}, 60_000); // many round trips to the remote database

beforeEach(() => {
  currentUser = userA;
});

afterAll(async () => {
  const users = [userA, userB];
  await db.delete(savedMealTemplates).where(inArray(savedMealTemplates.userId, users));
  const logs = await db.select({ id: mealLogs.id }).from(mealLogs).where(inArray(mealLogs.userId, users));
  if (logs.length) {
    await db.delete(mealItems).where(inArray(mealItems.mealLogId, logs.map((l) => l.id)));
    await db.delete(mealLogs).where(inArray(mealLogs.userId, users));
  }
  await db.delete(userConsent).where(inArray(userConsent.userId, users));
  await db.delete(userProfiles).where(inArray(userProfiles.userId, users));
  await db.delete(userEncryptionKeys).where(inArray(userEncryptionKeys.userId, users));
});

describe('suggestions', () => {
  it('ranks by use and suggests the usual amount', async () => {
    const { suggestions } = await quickAdd();
    expect(suggestions.map((s: { foodId: string }) => s.foodId)).toEqual([F[0].id, F[1].id, F[2].id]);
    expect(suggestions[0]).toMatchObject({ kind: 'food', name: F[0].name, grams: 200, portion: '1 glass' });
    expect(suggestions[1]).toMatchObject({ grams: 120, portion: '1 medium' });
  });

  it("leaves out what's already logged that day", async () => {
    await log(TODAY, [[0, 200, '1 glass']]);
    const { suggestions } = await quickAdd();
    expect(suggestions.map((s: { foodId: string }) => s.foodId)).not.toContain(F[0].id);
  });

  it('includes saved meals, counts a use when one is logged, and never counts another user\'s', async () => {
    const created = await savedMeals.POST(
      req('POST', '/api/saved-meals', {
        name: 'Snack',
        items: [{ foodId: F[3].id, grams: 40, portion: '40 g' }],
      })
    );
    const { id } = await created.json();

    let { suggestions, meals } = await quickAdd();
    expect(meals.map((m: { id: string }) => m.id)).toEqual([id]);
    expect(suggestions.some((s: { kind: string; id?: string }) => s.kind === 'meal' && s.id === id)).toBe(true);

    await log(daysAgo(1), [[3, 40, '40 g']], id);
    await log(daysAgo(1), [[3, 40, '40 g']], id);

    // Another user logging with A's meal id doesn't count it.
    currentUser = userB;
    await log(daysAgo(1), [[3, 40, '40 g']], id);
    currentUser = userA;

    const [row] = await db.select().from(savedMealTemplates).where(eq(savedMealTemplates.id, id));
    expect(row.useCount).toBe(2);
    ({ suggestions, meals } = await quickAdd());
    // Two recent uses puts the meal ahead of food 1 (2 uses, older) — ties go to the most recent.
    const order = suggestions.map((s: { kind: string; id?: string; foodId?: string }) => (s.kind === 'meal' ? s.id : s.foodId));
    expect(order.indexOf(id)).toBeLessThan(order.indexOf(F[2].id));
  }, 60_000);
});
