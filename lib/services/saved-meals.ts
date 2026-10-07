/**
 * Saved meals: a named group of foods with amounts, logged together in one tap.
 * Not recipes — logging one adds each food on its own, exactly as if added one
 * by one, so every ingredient stays visible in the log.
 *
 * Stored in `saved_meal_templates`:
 *  - `name` holds the name ENCRYPTED with the user's own key (encryptPHI). It is
 *    free text the user writes — "my IBS-safe dinner" — so it is treated as
 *    Article 9, like life_stage. Never read it without decryptName().
 *  - `foods` holds `[{ foodId, grams, portion }]`. Food names are not copied in;
 *    they're read live from `foods`.
 *  - Delete is a real delete. `is_active` is not used.
 *
 * Every function takes the authenticated user's id and touches only their rows.
 */

import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { savedMealTemplates } from '@/db/schema';
import { decryptPHI, encryptPHI } from '@/lib/security/encryption';
import { getUserDek } from '@/lib/security/user-dek';
import { visibleFoods } from '@/lib/services/food-visibility';

export const MAX_SAVED_MEAL_ITEMS = 25;
export const MAX_SAVED_MEALS = 200;

export interface SavedMealItem {
  foodId: string;
  /** Saved as the logged amount. */
  grams: number;
  /** The label shown and saved with the log entry, e.g. "2 eggs" or "60 g". */
  portion: string;
}

export interface SavedMeal {
  id: string;
  name: string;
  items: Array<SavedMealItem & { name: string }>;
  useCount: number;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export class SavedMealError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function storedItems(value: unknown): SavedMealItem[] {
  return Array.isArray(value)
    ? value
        .filter((i) => i && typeof i.foodId === 'string' && Number(i.grams) > 0)
        .map((i) => ({ foodId: i.foodId, grams: Number(i.grams), portion: String(i.portion ?? `${i.grams} g`) }))
    : [];
}

export async function listSavedMeals(userId: string): Promise<SavedMeal[]> {
  const rows = await db
    .select()
    .from(savedMealTemplates)
    .where(eq(savedMealTemplates.userId, userId))
    .orderBy(desc(savedMealTemplates.useCount), desc(savedMealTemplates.createdAt))
    .limit(MAX_SAVED_MEALS);
  if (rows.length === 0) return [];

  const dek = await getUserDek(userId);
  const allItems = rows.flatMap((r) => storedItems(r.foods));
  // Resolve names, and drop any food that has stopped being visible to this user.
  const names = await visibleFoods(userId, allItems.map((i) => i.foodId));

  return Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      name: await decryptPHI(r.name, dek),
      items: storedItems(r.foods)
        .filter((i) => names.has(i.foodId))
        .map((i) => ({ ...i, name: names.get(i.foodId)! })),
      useCount: r.useCount,
      lastUsedAt: r.lastUsedAt,
      createdAt: r.createdAt,
    }))
  );
}

export async function createSavedMeal(userId: string, name: string, items: SavedMealItem[]): Promise<{ id: string }> {
  if (items.length === 0 || items.length > MAX_SAVED_MEAL_ITEMS) {
    throw new SavedMealError(`A meal needs 1–${MAX_SAVED_MEAL_ITEMS} foods.`, 400);
  }
  const visible = await visibleFoods(userId, items.map((i) => i.foodId));
  if (items.some((i) => !visible.has(i.foodId))) throw new SavedMealError('One of the foods was not found.', 404);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(savedMealTemplates)
    .where(eq(savedMealTemplates.userId, userId));
  if (count >= MAX_SAVED_MEALS) throw new SavedMealError(`You can save up to ${MAX_SAVED_MEALS} meals.`, 400);

  const dek = await getUserDek(userId);
  const [row] = await db
    .insert(savedMealTemplates)
    .values({
      userId,
      name: await encryptPHI(name, dek),
      foods: items.map((i) => ({ foodId: i.foodId, grams: i.grams, portion: i.portion })),
    })
    .returning({ id: savedMealTemplates.id });
  return row;
}

export async function renameSavedMeal(userId: string, id: string, name: string): Promise<void> {
  const dek = await getUserDek(userId);
  const rows = await db
    .update(savedMealTemplates)
    .set({ name: await encryptPHI(name, dek), updatedAt: new Date() })
    .where(and(eq(savedMealTemplates.id, id), eq(savedMealTemplates.userId, userId)))
    .returning({ id: savedMealTemplates.id });
  if (rows.length === 0) throw new SavedMealError('Meal not found.', 404);
}

export async function deleteSavedMeal(userId: string, id: string): Promise<void> {
  const rows = await db
    .delete(savedMealTemplates)
    .where(and(eq(savedMealTemplates.id, id), eq(savedMealTemplates.userId, userId)))
    .returning({ id: savedMealTemplates.id });
  if (rows.length === 0) throw new SavedMealError('Meal not found.', 404);
}

/** Count one use. Only the owner's meal; anything else is a silent no-op. */
export async function markSavedMealUsed(userId: string, id: string): Promise<void> {
  await db
    .update(savedMealTemplates)
    .set({ useCount: sql`${savedMealTemplates.useCount} + 1`, lastUsedAt: new Date() })
    .where(and(eq(savedMealTemplates.id, id), eq(savedMealTemplates.userId, userId)));
}
