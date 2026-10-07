/**
 * Integration test: saved meals, through the real route and the real database.
 *
 *  - The name is stored encrypted (raw SQL never sees it), and comes back
 *    decrypted through the route.
 *  - Rename works; delete removes the row (not a hidden flag).
 *  - Another user's foods can't go into a meal; another user's meal can't be
 *    read, renamed or deleted.
 *  - The data export includes saved meals with readable names.
 *
 * Only auth is faked. Throwaway user ids; every row is cleaned up.
 */
import 'dotenv/config';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { foodComponents, foods, savedMealTemplates, userConsent, userEncryptionKeys, userProfiles } from '@/db/schema';

const userA = randomUUID();
const userB = randomUUID();
let currentUser = userA;

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: currentUser, email: `${currentUser}@test.invalid`, user_metadata: {} } },
        error: null,
      }),
    },
  }),
}));

// The export's audit log and rate limit aren't what's tested here.
vi.mock('@/lib/security/audit-logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/security/audit-logger')>()),
  logAudit: async () => {},
}));
vi.mock('@/lib/rate-limit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/rate-limit')>()),
  checkRateLimit: async () => ({ allowed: true, remaining: 1, resetAt: new Date() }),
}));

const route = await import('@/app/api/saved-meals/route');
const { POST: recipePOST } = await import('@/app/api/foods/recipes/route');
const { GET: exportGET } = await import('@/app/api/user/export/route');

function req(method: string, path: string, body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

const NAME = 'My IBS-safe breakfast';
let publicFoods: { id: string; name: string }[] = [];
let mealId = '';

beforeAll(async () => {
  publicFoods = await db.select({ id: foods.id, name: foods.name }).from(foods).where(eq(foods.visibility, 'public')).limit(2);
  expect(publicFoods).toHaveLength(2);
});

beforeEach(() => {
  currentUser = userA;
});

afterAll(async () => {
  const users = [userA, userB];
  await db.delete(savedMealTemplates).where(inArray(savedMealTemplates.userId, users));
  const created = await db.select({ id: foods.id }).from(foods).where(inArray(foods.createdBy, users));
  if (created.length) {
    await db.delete(foodComponents).where(inArray(foodComponents.compositeFoodId, created.map((f) => f.id)));
    await db.delete(foods).where(inArray(foods.id, created.map((f) => f.id)));
  }
  await db.delete(userConsent).where(inArray(userConsent.userId, users));
  await db.delete(userProfiles).where(inArray(userProfiles.userId, users));
  await db.delete(userEncryptionKeys).where(inArray(userEncryptionKeys.userId, users));
});

describe('saved meals', () => {
  it('saves a meal, with the name encrypted at rest', async () => {
    const res = await route.POST(
      req('POST', '/api/saved-meals', {
        name: NAME,
        items: [
          { foodId: publicFoods[0].id, grams: 60, portion: '60 g' },
          { foodId: publicFoods[1].id, grams: 200, portion: '1 glass' },
        ],
      })
    );
    expect(res.status).toBe(201);
    mealId = (await res.json()).id;

    const raw = await db.execute<{ name: string }>(sql`SELECT name FROM saved_meal_templates WHERE id = ${mealId}`);
    const stored = (raw as unknown as Array<{ name: string }>)[0].name;
    expect(stored).toBeTruthy();
    expect(stored).not.toContain('IBS');
    expect(stored).not.toContain('breakfast');
  });

  it('lists it with the name decrypted and food names filled in', async () => {
    const body = await (await route.GET(req('GET', '/api/saved-meals'))).json();
    expect(body.meals).toHaveLength(1);
    const [meal] = body.meals;
    expect(meal.name).toBe(NAME);
    expect(meal.items).toEqual([
      { foodId: publicFoods[0].id, name: publicFoods[0].name, grams: 60, portion: '60 g' },
      { foodId: publicFoods[1].id, name: publicFoods[1].name, grams: 200, portion: '1 glass' },
    ]);
  });

  it('renames it', async () => {
    expect((await route.PATCH(req('PATCH', '/api/saved-meals', { id: mealId, name: 'Breakfast' }))).status).toBe(200);
    const body = await (await route.GET(req('GET', '/api/saved-meals'))).json();
    expect(body.meals[0].name).toBe('Breakfast');
  });

  it('is in the data export, readable', async () => {
    const res = await exportGET(req('GET', '/api/user/export'));
    expect(res.status).toBe(200);
    const body = JSON.parse(await res.text());
    expect(body.savedMeals).toHaveLength(1);
    expect(body.savedMeals[0].name).toBe('Breakfast');
    expect(body.savedMeals[0].items[0].grams).toBe(60);
  });

  it("keeps other users out, both ways", async () => {
    // B makes a private recipe; A can't put it in a meal.
    currentUser = userB;
    const recipe = await recipePOST(
      req('POST', '/api/foods/recipes', { name: 'B secret', components: [{ foodId: publicFoods[0].id, grams: 50 }] })
    );
    const { id: privateOfB } = await recipe.json();
    // B can't see, rename or delete A's meal.
    expect((await (await route.GET(req('GET', '/api/saved-meals'))).json()).meals).toHaveLength(0);
    expect((await route.PATCH(req('PATCH', '/api/saved-meals', { id: mealId, name: 'pwned' }))).status).toBe(404);
    expect((await route.DELETE(req('DELETE', `/api/saved-meals?id=${mealId}`))).status).toBe(404);

    currentUser = userA;
    const res = await route.POST(
      req('POST', '/api/saved-meals', { name: 'stolen', items: [{ foodId: privateOfB, grams: 10, portion: '10 g' }] })
    );
    expect(res.status).toBe(404);
    const body = await (await route.GET(req('GET', '/api/saved-meals'))).json();
    expect(body.meals.map((m: { name: string }) => m.name)).toEqual(['Breakfast']);
  });

  it('deletes it for real', async () => {
    expect((await route.DELETE(req('DELETE', `/api/saved-meals?id=${mealId}`))).status).toBe(200);
    const rows = await db.select().from(savedMealTemplates).where(eq(savedMealTemplates.id, mealId));
    expect(rows).toHaveLength(0);
  });
});
