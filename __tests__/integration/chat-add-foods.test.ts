/**
 * Integration test: the chat's write paths, through the real route handlers and
 * the real database.
 *
 *  - "Add foods" (POST /api/meals/sync, addMany) saves exactly the foods sent,
 *    in one meal, with the grams and labels given.
 *  - Nobody can log, or build a recipe from, another user's private food.
 *  - "Save as recipe" (POST /api/foods/recipes) creates a private recipe that
 *    search finds for its owner only.
 *  - The chat route refuses before any AI call when the user is rate limited
 *    or hasn't consented to AI processing.
 *
 * Only auth is faked (a fixed user instead of a cookie). Uses throwaway user
 * ids and deletes every row it creates.
 */
import 'dotenv/config';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import {
  foodComponents,
  foods,
  mealItems,
  mealLogs,
  userConsent,
  userEncryptionKeys,
  userProfiles,
} from '@/db/schema';

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

// after() needs a live Next request scope; run the deferred work inline instead.
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: (fn: () => unknown) => {
    Promise.resolve().then(fn).catch(() => {});
  },
}));

const rateLimit = vi.fn();
vi.mock('@/lib/rate-limit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/rate-limit')>()),
  checkAiRateLimit: (...args: unknown[]) => rateLimit(...args),
}));

const consent = vi.fn();
vi.mock('@/lib/dal/consent', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/dal/consent')>()),
  checkConsent: (...args: unknown[]) => consent(...args),
}));

const { POST: syncPOST } = await import('@/app/api/meals/sync/route');
const { POST: recipePOST } = await import('@/app/api/foods/recipes/route');
const { POST: chatPOST } = await import('@/app/api/ai/log-food/route');
const { searchService } = await import('@/lib/search/search-service');

function post(path: string, body: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const DATE = '2000-01-01'; // far from any real day being viewed
let publicFoods: { id: string; name: string }[] = [];

beforeAll(async () => {
  publicFoods = await db
    .select({ id: foods.id, name: foods.name })
    .from(foods)
    .where(eq(foods.visibility, 'public'))
    .limit(3);
  expect(publicFoods.length).toBe(3);
});

beforeEach(() => {
  currentUser = userA;
});

afterAll(async () => {
  const users = [userA, userB];
  const created = await db.select({ id: foods.id }).from(foods).where(inArray(foods.createdBy, users));
  if (created.length) {
    const ids = created.map((f) => f.id);
    await db.delete(foodComponents).where(inArray(foodComponents.compositeFoodId, ids));
    await db.delete(foods).where(inArray(foods.id, ids));
  }
  const meals = await db.select({ id: mealLogs.id }).from(mealLogs).where(inArray(mealLogs.userId, users));
  if (meals.length) {
    await db.delete(mealItems).where(inArray(mealItems.mealLogId, meals.map((m) => m.id)));
    await db.delete(mealLogs).where(inArray(mealLogs.userId, users));
  }
  await db.delete(userConsent).where(inArray(userConsent.userId, users));
  await db.delete(userProfiles).where(inArray(userProfiles.userId, users));
  await db.delete(userEncryptionKeys).where(inArray(userEncryptionKeys.userId, users));
});

describe('Add foods (sync addMany)', () => {
  it('saves exactly the foods sent, in one meal, with their grams and labels', async () => {
    const sent = [
      { foodId: publicFoods[0].id, portionSize: 100, portionType: '2 eggs' },
      { foodId: publicFoods[1].id, portionSize: 42.5, portionType: '42.5 g' },
      { foodId: publicFoods[2].id, portionSize: 250, portionType: '1 glass' },
    ];
    const res = await syncPOST(post('/api/meals/sync', { date: DATE, skipTotals: false, change: { type: 'addMany', mealId: null, foods: sent } }));
    expect(res.status).toBe(200);

    const meals = await db.select().from(mealLogs).where(and(eq(mealLogs.userId, userA), eq(mealLogs.date, DATE)));
    expect(meals).toHaveLength(1);
    expect(meals[0].mealType).toBe('Today');

    const items = await db.select().from(mealItems).where(eq(mealItems.mealLogId, meals[0].id));
    expect(
      items
        .map((i) => ({ foodId: i.foodId, portionSize: Number(i.portionSize), portionType: i.portionType }))
        .sort((a, b) => a.portionSize - b.portionSize)
    ).toEqual([...sent].sort((a, b) => a.portionSize - b.portionSize));
  });

  it('adds to an existing meal when given its id', async () => {
    const [meal] = await db.select().from(mealLogs).where(and(eq(mealLogs.userId, userA), eq(mealLogs.date, DATE)));
    const res = await syncPOST(
      post('/api/meals/sync', {
        date: DATE,
        change: { type: 'addMany', mealId: meal.id, foods: [{ foodId: publicFoods[0].id, portionSize: 10, portionType: '10 g' }] },
      })
    );
    expect(res.status).toBe(200);
    const items = await db.select().from(mealItems).where(eq(mealItems.mealLogId, meal.id));
    expect(items).toHaveLength(4);
  });

  it("refuses another user's private food, and writes nothing", async () => {
    currentUser = userB;
    const recipe = await recipePOST(
      post('/api/foods/recipes', { name: 'B secret', components: [{ foodId: publicFoods[0].id, grams: 50 }] })
    );
    expect(recipe.status).toBe(201);
    const { id: privateOfB } = await recipe.json();

    currentUser = userA;
    const before = await db.select({ id: mealLogs.id }).from(mealLogs).where(eq(mealLogs.userId, userA));
    const res = await syncPOST(
      post('/api/meals/sync', {
        date: DATE,
        change: {
          type: 'addMany',
          mealId: null,
          foods: [
            { foodId: publicFoods[1].id, portionSize: 10, portionType: '10 g' },
            { foodId: privateOfB, portionSize: 10, portionType: '10 g' },
          ],
        },
      })
    );
    expect(res.status).toBe(404);
    const after = await db.select({ id: mealLogs.id }).from(mealLogs).where(eq(mealLogs.userId, userA));
    expect(after).toHaveLength(before.length);

    // Same check on the single-food add.
    const single = await syncPOST(
      post('/api/meals/sync', { date: DATE, change: { type: 'add', mealId: null, food: { foodId: privateOfB, portionSize: 1, portionType: 'g' } } })
    );
    expect(single.status).toBe(404);

    // And on building a recipe from it.
    const steal = await recipePOST(
      post('/api/foods/recipes', { name: 'stolen', components: [{ foodId: privateOfB, grams: 10 }] })
    );
    expect(steal.status).toBe(400);
  });
});

describe('Save as recipe', () => {
  it('creates a private recipe that search finds for its owner only', async () => {
    const name = `Test smoothie ${userA.slice(0, 8)}`;
    const res = await recipePOST(
      post('/api/foods/recipes', {
        name,
        components: [
          { foodId: publicFoods[0].id, grams: 120 },
          { foodId: publicFoods[1].id, grams: 30 },
        ],
      })
    );
    expect(res.status).toBe(201);
    const { id } = await res.json();

    const [row] = await db.select().from(foods).where(eq(foods.id, id));
    expect(row.visibility).toBe('private');
    expect(row.createdBy).toBe(userA);
    expect(row.isComposite).toBe(true);
    const parts = await db.select().from(foodComponents).where(eq(foodComponents.compositeFoodId, id));
    expect(parts.map((p) => Number(p.grams)).sort((a, b) => a - b)).toEqual([30, 120]);

    const term = userA.slice(0, 8);
    const mine = await searchService.searchFoods({ query: term, page: 1, limit: 5, userId: userA });
    expect(mine.results.map((r) => r.id)).toContain(id);
    const theirs = await searchService.searchFoods({ query: term, page: 1, limit: 5, userId: userB });
    expect(theirs.results.map((r) => r.id)).not.toContain(id);
  });
});

describe('Chat route refusals (no AI call made)', () => {
  it('returns 429 with a readable message when rate limited', async () => {
    rateLimit.mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: new Date(Date.now() + 10 * 60000) });
    const res = await chatPOST(post('/api/ai/log-food', { message: 'two eggs' }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.message).toMatch(/try again in 10 minutes/);
    expect(consent).not.toHaveBeenCalled();
  });

  it('returns 403 without AI consent', async () => {
    rateLimit.mockResolvedValueOnce({ allowed: true, remaining: 29, resetAt: new Date() });
    consent.mockResolvedValueOnce(false);
    const res = await chatPOST(post('/api/ai/log-food', { message: 'two eggs' }));
    expect(res.status).toBe(403);
    expect(consent).toHaveBeenCalledWith(userA, 'aiProcessing');
  });

  // Spends a real Haiku call (~$0.004), so only on request: RUN_AI_TESTS=1.
  it.runIf(process.env.RUN_AI_TESTS === '1')(
    'streams real progress, then a list of real foods the user may log',
    async () => {
      rateLimit.mockResolvedValueOnce({ allowed: true, remaining: 29, resetAt: new Date() });
      consent.mockResolvedValueOnce(true);
      const res = await chatPOST(post('/api/ai/log-food', { message: 'two eggs and a banana' }));
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('application/x-ndjson');

      const events = (await res.text())
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l));
      const progress = events.filter((e) => e.type === 'progress').map((e) => e.label);
      expect(progress[0]).toBe('Reading your message');
      expect(progress.some((l: string) => l.startsWith('Looking up'))).toBe(true);

      const done = events.at(-1);
      expect(done.type).toBe('done');
      const names = done.proposal.items.map((i: { name: string }) => i.name.toLowerCase());
      expect(names.some((n: string) => n.includes('egg'))).toBe(true);
      expect(names.some((n: string) => n.includes('banana'))).toBe(true);
      const ids = done.proposal.items.map((i: { foodId: string }) => i.foodId);
      const rows = await db.select({ id: foods.id }).from(foods).where(and(inArray(foods.id, ids), eq(foods.visibility, 'public')));
      expect(rows).toHaveLength(new Set(ids).size);
    },
    60_000
  );

  it('rejects a proposal in history that is not well-formed', async () => {
    const res = await chatPOST(
      post('/api/ai/log-food', {
        message: 'and a coffee',
        history: [{ role: 'assistant', content: 'x', proposal: { items: [{ foodId: 'nope', name: 'x', grams: 1, portion: '1', guessed: false }] } }],
      })
    );
    expect(res.status).toBe(400);
  });
});
