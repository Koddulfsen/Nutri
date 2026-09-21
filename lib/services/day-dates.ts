/**
 * Which days have data — the dots on the calendar.
 */

import { and, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/db';
import { mealLogs, mealItems, symptomLogs } from '@/db/schema';

/** Days in [from, to] on which the user has at least one meal item. */
export async function getMealDates(userId: string, from: string, to: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ date: mealLogs.date })
    .from(mealLogs)
    .innerJoin(mealItems, eq(mealItems.mealLogId, mealLogs.id))
    .where(
      and(
        eq(mealLogs.userId, userId),
        gte(mealLogs.date, from),
        lte(mealLogs.date, to),
        eq(mealLogs.isActive, true)
      )
    );
  return rows.map((r) => r.date);
}

/** Days in [from, to] on which the user logged a symptom. */
export async function getSymptomDates(userId: string, from: string, to: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ date: symptomLogs.date })
    .from(symptomLogs)
    .where(
      and(
        eq(symptomLogs.userId, userId),
        eq(symptomLogs.isActive, true),
        gte(symptomLogs.date, from),
        lte(symptomLogs.date, to)
      )
    );
  return rows.map((r) => r.date);
}
