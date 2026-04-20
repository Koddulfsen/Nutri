/**
 * Wellness Trend API
 *
 * GET /api/dashboard/wellness-trend?range=7d|30d|90d|all
 *
 * Returns a daily composite of symptom intensities across the selected range,
 * plus per-symptom series for expanded views.
 *
 * Convention: higher intensity = better (applies across all symptoms in this project).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { symptomLogs, symptomDefinitions } from '@/db/schema/symptoms';
import { and, eq, gte, lte } from 'drizzle-orm';
import { logger } from '@/lib/logger';

type Range = '7d' | '30d' | '90d' | 'all';

function rangeToStartDate(range: Range): string | null {
  if (range === 'all') return null;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') as Range) || '30d';
    const validRanges: Range[] = ['7d', '30d', '90d', 'all'];
    if (!validRanges.includes(range)) {
      return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
    }

    const startDate = rangeToStartDate(range);
    const endDate = new Date().toISOString().split('T')[0];

    const whereClauses = [eq(symptomLogs.userId, user.id), lte(symptomLogs.date, endDate)];
    if (startDate) whereClauses.push(gte(symptomLogs.date, startDate));

    const rows = await db
      .select({
        date: symptomLogs.date,
        intensity: symptomLogs.intensity,
        symptomId: symptomLogs.symptomDefinitionId,
        symptomName: symptomDefinitions.name,
        category: symptomDefinitions.category,
      })
      .from(symptomLogs)
      .innerJoin(symptomDefinitions, eq(symptomDefinitions.id, symptomLogs.symptomDefinitionId))
      .where(and(...whereClauses));

    // Group: aggregate by date → composite (avg of all intensities)
    const byDate = new Map<string, { sum: number; count: number }>();
    const bySymptom = new Map<
      string,
      { name: string; category: string; byDate: Map<string, { sum: number; count: number }> }
    >();

    for (const r of rows) {
      const date = r.date;
      const int = r.intensity;

      const d = byDate.get(date) || { sum: 0, count: 0 };
      d.sum += int;
      d.count += 1;
      byDate.set(date, d);

      let s = bySymptom.get(r.symptomId);
      if (!s) {
        s = { name: r.symptomName, category: r.category, byDate: new Map() };
        bySymptom.set(r.symptomId, s);
      }
      const sd = s.byDate.get(date) || { sum: 0, count: 0 };
      sd.sum += int;
      sd.count += 1;
      s.byDate.set(date, sd);
    }

    const composite = Array.from(byDate.entries())
      .map(([date, { sum, count }]) => ({ date, value: count > 0 ? sum / count : null, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const perSymptom = Array.from(bySymptom.entries()).map(([id, s]) => ({
      id,
      name: s.name,
      category: s.category,
      series: Array.from(s.byDate.entries())
        .map(([date, { sum, count }]) => ({ date, value: count > 0 ? sum / count : null }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }));

    return NextResponse.json({
      range,
      startDate,
      endDate,
      composite,
      perSymptom,
    });
  } catch (error) {
    logger.error(
      { service: 'wellness-trend-api', error: error instanceof Error ? error.message : String(error) },
      'Wellness trend API error'
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
