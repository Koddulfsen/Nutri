/**
 * Analysis Bootstrap API Endpoint
 *
 * POST /api/analysis/bootstrap
 *
 * Everything /analysis needs to show its first screen, in one response: the
 * selected day (meals, symptoms, totals, the numbers behind its foods), the
 * food catalog, the symptom list, and the calendar dots. The page used to ask
 * for these one by one from the browser — seven separate serverless calls,
 * each able to cold-start. Here they are gathered at the same time.
 *
 * Daily values for the age/sex picker are deliberately not included; they are
 * still their own request.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/with-auth';
import { loadDayState } from '@/lib/services/meal-state';
import { loadFoodCatalog } from '@/lib/services/food-catalog';
import { getSymptomDefinitions } from '@/lib/services/symptom-service';
import { getMealDates, getSymptomDates } from '@/lib/services/day-dates';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const BootstrapSchema = z.object({
  date: isoDate,
  age: z.number().int().min(0).max(120).optional(),
  sex: z.enum(['MALE', 'FEMALE']).optional(),
  // the span the calendar dots are wanted for
  datesFrom: isoDate,
  datesTo: isoDate,
});

export const POST = withAuth(
  async ({ user, input }) => {
    const userId = user.id;
    const { date, age, sex, datesFrom, datesTo } = input;

    const [day, catalog, symptomDefinitions, mealDates, symptomDates] = await Promise.all([
      loadDayState({ userId, date, age, sex, withSymptoms: true }),
      loadFoodCatalog(userId),
      getSymptomDefinitions(userId),
      getMealDates(userId, datesFrom, datesTo),
      getSymptomDates(userId, datesFrom, datesTo),
    ]);

    return NextResponse.json({
      day: {
        date,
        meals: day.meals,
        dailyTotals: day.dailyTotals,
        vectors: day.vectors,
        symptoms: day.symptoms,
      },
      catalog,
      symptomDefinitions,
      dates: [...new Set([...mealDates, ...symptomDates])],
    });
  },
  { schema: BootstrapSchema, source: 'body' }
);
