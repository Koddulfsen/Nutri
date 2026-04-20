/**
 * DV Composite API
 *
 * GET /api/dashboard/dv-composite?range=7d|30d|90d|all
 *
 * Computes a daily Daily Value (DV) coverage composite across the selected range.
 * For each day: composite = avg of min(amount/target, 1) * 100 across all compounds with DVs.
 * Also returns top shortfall compounds over the range and a heatmap matrix for expanded view.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateDailyTotals } from '@/lib/services/daily-totals-service';
import { getDailyValuesBatch } from '@/lib/services/daily-value-service';
import { db } from '@/db';
import { mealLogs } from '@/db/schema';
import { and, eq, gte, lte } from 'drizzle-orm';
import { logger } from '@/lib/logger';

type Range = '7d' | '30d' | '90d' | 'all';

function rangeToDays(range: Range): number | null {
  if (range === 'all') return null;
  return range === '7d' ? 7 : range === '30d' ? 30 : 90;
}

function enumerateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
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

    const today = new Date().toISOString().split('T')[0];
    const days = rangeToDays(range);
    let startDate: string;
    if (days) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1));
      startDate = d.toISOString().split('T')[0];
    } else {
      // 'all' — start from the user's earliest meal log
      const firstMeal = await db
        .select({ date: mealLogs.date })
        .from(mealLogs)
        .where(eq(mealLogs.userId, user.id))
        .orderBy(mealLogs.date)
        .limit(1);
      startDate = firstMeal[0]?.date || today;
    }

    const dates = enumerateDates(startDate, today);

    // Fetch daily totals for each date in parallel (cached per date)
    const totalsPerDate = await Promise.all(
      dates.map((date) =>
        calculateDailyTotals(user.id, date).catch((err) => {
          logger.warn({ service: 'dv-composite-api', date, err: String(err) }, 'Daily totals failed for date');
          return [];
        })
      )
    );

    // Collect all unique compound IDs across all dates
    const allCompoundIds = new Set<string>();
    for (const compounds of totalsPerDate) {
      for (const c of compounds) allCompoundIds.add(c.compoundId);
    }

    // Fetch DVs for all compounds in one batch
    const dvMap = await getDailyValuesBatch(user.id, Array.from(allCompoundIds));

    // Only include compounds that have a DV target
    const dvCompoundIds = new Set(
      Array.from(dvMap.entries())
        .filter(([, dv]) => dv.value > 0)
        .map(([id]) => id)
    );

    // For each date, compute composite score
    const composite: Array<{ date: string; score: number | null; compoundCount: number }> = [];
    // Heatmap: per compound, map of date -> % DV (clamped at 200 for display)
    const heatmapByCompound = new Map<string, {
      id: string;
      name: string;
      valuesByDate: Record<string, number>;
    }>();

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const compounds = totalsPerDate[i];

      let sumCoverage = 0;
      let coveredCount = 0;

      for (const c of compounds) {
        if (!dvCompoundIds.has(c.compoundId)) continue;
        const dv = dvMap.get(c.compoundId)!;
        const pct = (c.amount / dv.value) * 100;
        const clamped = Math.min(pct, 100); // Cap at 100 for composite — no compensation for excess

        sumCoverage += clamped;
        coveredCount++;

        // Heatmap entry — raw %, not clamped (so we can visualize excess too)
        let entry = heatmapByCompound.get(c.compoundId);
        if (!entry) {
          entry = { id: c.compoundId, name: c.name, valuesByDate: {} };
          heatmapByCompound.set(c.compoundId, entry);
        }
        entry.valuesByDate[date] = Math.min(pct, 300); // cap display at 300%
      }

      composite.push({
        date,
        score: coveredCount > 0 ? sumCoverage / coveredCount : null,
        compoundCount: coveredCount,
      });
    }

    // Compute overall average per compound and identify top gaps
    const compoundAverages = Array.from(heatmapByCompound.values()).map((entry) => {
      const vals = Object.values(entry.valuesByDate);
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return { id: entry.id, name: entry.name, avgPct: avg };
    });

    const topGaps = compoundAverages
      .filter((c) => c.avgPct < 100)
      .sort((a, b) => a.avgPct - b.avgPct)
      .slice(0, 3);

    // Overall composite average over the range
    const scoredDays = composite.filter((d) => d.score !== null);
    const overallAvg = scoredDays.length > 0
      ? scoredDays.reduce((sum, d) => sum + (d.score || 0), 0) / scoredDays.length
      : null;

    return NextResponse.json({
      range,
      startDate,
      endDate: today,
      overallAvg,
      composite,
      topGaps,
      heatmap: Array.from(heatmapByCompound.values()),
    });
  } catch (error) {
    logger.error(
      { service: 'dv-composite-api', error: error instanceof Error ? error.message : String(error) },
      'DV composite API error'
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
